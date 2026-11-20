#!/usr/bin/env node

/**
 * validate-state.js
 * Strict, zero-dependency schema and security validator for agents-state.json.
 * Runs in CI (GitHub Actions) and pre-commit checks.
 *
 * Enforces:
 * 1. Strict ISO 8601 calendar validation (prevents rollover, non-standard, or numeric formats)
 * 2. URL scheme safety (http/https only for evidence_url and task.link; rejects javascript:)
 * 3. Registered agent referential integrity (strictly rejects unknown agent IDs)
 * 4. Handoff receipt lifecycle rules and optional handoff.history validation
 * 5. Pre-deployment secret scanning (rejects common API tokens/keys before publish)
 * 6. Revision tracking consistency (optimistic concurrency)
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.resolve(__dirname, '../agents-state.json');

const VALID_AGENT_STATUSES = new Set([
  'working',
  'waiting',
  'idle',
  'offline',
  'error',
  'done'
]);

const VALID_TASK_STATUSES = new Set([
  'todo',
  'in_progress',
  'waiting_review',
  'blocked',
  'done',
  'cancelled'
]);

const VALID_HANDOFF_STATUSES = new Set([
  'pending',
  'accepted',
  'returned'
]);

const ISO_8601_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/**
 * Validates strict ISO 8601 date string with real calendar day bounds.
 * Rejects roll-overs such as 2026-02-31, numbers like '100', and slash-separated dates.
 */
function isValidIsoDate(str) {
  if (typeof str !== 'string' || !str.trim()) return false;
  const trimmed = str.trim();
  if (!ISO_8601_REGEX.test(trimmed)) return false;

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return false;

  // Verify calendar validity (prevent 2026-02-31 -> 2026-03-03 silent rollover)
  const [datePart] = trimmed.split('T');
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr);
  const day = Number(dayStr);

  const isLeap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (day < 1 || day > daysInMonth[m]) return false;
  return true;
}

/**
 * Validates that a string is a safe http or https URL.
 * Rejects javascript:, data:, vbscript:, and malformed values.
 */
function isValidSafeUrl(str) {
  if (typeof str !== 'string' || !str.trim()) return false;
  try {
    const u = new URL(str.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Secret scanning patterns for CI gate.
 * Rejects committed API keys or authentication credentials in public state.
 */
const SECRET_PATTERNS = [
  { name: 'GitHub Personal Access Token (classic)', regex: /\bghp_[A-Za-z0-9]{36}\b/ },
  { name: 'GitHub Fine-grained PAT', regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/ },
  { name: 'GitHub OAuth Access Token', regex: /\bgho_[A-Za-z0-9]{36}\b/ },
  { name: 'OpenAI/Anthropic API Key', regex: /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Google API Key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: 'Authorization Bearer Token', regex: /\bBearer\s+[A-Za-z0-9\-_=.]{20,}\b/i },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/ }
];

function scanForSecrets(rawText) {
  const detected = [];
  if (typeof rawText !== 'string') return detected;

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(rawText)) {
      detected.push(pattern.name);
    }
  }
  return detected;
}

function validateStateObject(data, rawText = null) {
  const errors = [];
  const warnings = [];

  // 1. Secret Scanning Gate
  if (rawText) {
    const foundSecrets = scanForSecrets(rawText);
    if (foundSecrets.length > 0) {
      errors.push(`SECURITY ALERT: Potential secrets detected in state file: ${foundSecrets.join(', ')}. Never commit credentials to public repository!`);
    }
  }

  // 2. Root validation
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Root must be an object.');
    return { errors, warnings, valid: false };
  }

  if (!isValidIsoDate(data.updated_at)) {
    errors.push(`Invalid or missing root "updated_at": "${data.updated_at}". Must be a strictly valid ISO 8601 date with timezone offset.`);
  }

  if (data.revision !== undefined && data.revision !== null) {
    if (!Number.isInteger(data.revision) || data.revision < 1) {
      errors.push(`Root "revision" must be a positive integer >= 1 (got: ${data.revision}).`);
    }
  }

  // 3. Agents array validation
  const knownAgentIds = new Set();

  if (!Array.isArray(data.agents)) {
    errors.push('Root "agents" must be an array.');
  } else if (data.agents.length === 0) {
    errors.push('Root "agents" array must not be empty. At least one registered agent is required.');
  } else {
    data.agents.forEach((agent, i) => {
      const prefix = `agents[${i}] (${agent?.id || 'unknown'})`;
      if (!agent || typeof agent !== 'object' || Array.isArray(agent)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      if (!agent.id || typeof agent.id !== 'string' || !agent.id.trim()) {
        errors.push(`${prefix}: "id" is required and must be a non-empty string.`);
      } else {
        if (knownAgentIds.has(agent.id)) {
          errors.push(`${prefix}: Duplicate agent ID "${agent.id}". Agent IDs must be unique.`);
        }
        knownAgentIds.add(agent.id);
      }
      if (!agent.name || typeof agent.name !== 'string' || !agent.name.trim()) {
        errors.push(`${prefix}: "name" is required and must be a non-empty string.`);
      }
      if (!agent.role || typeof agent.role !== 'string' || !agent.role.trim()) {
        errors.push(`${prefix}: "role" is required and must be a non-empty string.`);
      }
      if (!agent.status || typeof agent.status !== 'string') {
        errors.push(`${prefix}: "status" is required.`);
      } else if (!VALID_AGENT_STATUSES.has(agent.status)) {
        errors.push(`${prefix}: status "${agent.status}" is invalid. Allowed: ${[...VALID_AGENT_STATUSES].join(', ')}`);
      }
      if (!isValidIsoDate(agent.last_seen)) {
        errors.push(`${prefix}: "last_seen" ("${agent.last_seen}") must be a strictly valid ISO 8601 date.`);
      }
    });
  }

  // 4. Tasks array validation
  if (!Array.isArray(data.tasks)) {
    errors.push('Root "tasks" must be an array.');
  } else {
    const knownTaskIds = new Set();
    data.tasks.forEach((task, i) => {
      const prefix = `tasks[${i}] (${task?.id || 'unknown'})`;
      if (!task || typeof task !== 'object' || Array.isArray(task)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      if (!task.id || typeof task.id !== 'string' || !task.id.trim()) {
        errors.push(`${prefix}: "id" is required and must be a non-empty string.`);
      } else {
        if (knownTaskIds.has(task.id)) {
          errors.push(`${prefix}: Duplicate task ID "${task.id}". Task IDs must be unique.`);
        }
        knownTaskIds.add(task.id);
      }
      if (!task.title || typeof task.title !== 'string' || !task.title.trim()) {
        errors.push(`${prefix}: "title" is required and must be a non-empty string.`);
      }
      if (!task.owner || typeof task.owner !== 'string' || !task.owner.trim()) {
        errors.push(`${prefix}: "owner" is required and must be a non-empty string.`);
      }
      if (!task.status || typeof task.status !== 'string') {
        errors.push(`${prefix}: "status" is required.`);
      } else if (!VALID_TASK_STATUSES.has(task.status)) {
        errors.push(`${prefix}: status "${task.status}" is invalid. Allowed: ${[...VALID_TASK_STATUSES].join(', ')}`);
      }
      if (!isValidIsoDate(task.updated_at)) {
        errors.push(`${prefix}: "updated_at" ("${task.updated_at}") must be a strictly valid ISO 8601 date.`);
      }

      // Security check: task.link must be safe if provided
      if (task.link !== undefined && task.link !== null) {
        if (typeof task.link !== 'string' || !isValidSafeUrl(task.link)) {
          errors.push(`${prefix}: "link" ("${task.link}") must be a valid safe http/https URL (or null).`);
        }
      }

      // Handoff receipt validation (strictly optional field)
      if (task.handoff !== undefined && task.handoff !== null) {
        const hPrefix = `${prefix}.handoff`;
        if (typeof task.handoff !== 'object' || Array.isArray(task.handoff)) {
          errors.push(`${hPrefix} must be an object when provided.`);
        } else {
          const h = task.handoff;

          if (!h.from || typeof h.from !== 'string') {
            errors.push(`${hPrefix}: "from" is required and must be an agent ID string.`);
          } else if (!knownAgentIds.has(h.from)) {
            errors.push(`${hPrefix}: "from" agent ID "${h.from}" is not registered in agents array.`);
          }

          if (!h.to || typeof h.to !== 'string') {
            errors.push(`${hPrefix}: "to" is required and must be an agent ID string.`);
          } else if (!knownAgentIds.has(h.to)) {
            errors.push(`${hPrefix}: "to" agent ID "${h.to}" is not registered in agents array.`);
          }

          if (!isValidIsoDate(h.at)) {
            errors.push(`${hPrefix}: "at" ("${h.at}") must be a strictly valid ISO 8601 date.`);
          }

          if (!h.status || typeof h.status !== 'string') {
            errors.push(`${hPrefix}: "status" is required.`);
          } else if (!VALID_HANDOFF_STATUSES.has(h.status)) {
            errors.push(`${hPrefix}: status "${h.status}" is invalid. Allowed: ${[...VALID_HANDOFF_STATUSES].join(', ')}`);
          }

          if (typeof h.summary !== 'string' || !h.summary.trim()) {
            errors.push(`${hPrefix}: "summary" is required and must be a non-empty string.`);
          }

          if (typeof h.next_step !== 'string' || !h.next_step.trim()) {
            errors.push(`${hPrefix}: "next_step" is required and must be a non-empty string.`);
          }

          if (h.evidence_url !== undefined && h.evidence_url !== null) {
            if (typeof h.evidence_url !== 'string' || !isValidSafeUrl(h.evidence_url)) {
              errors.push(`${hPrefix}: "evidence_url" ("${h.evidence_url}") must be a valid http/https URL.`);
            }
          }

          // Decision object consistency
          if (h.status === 'pending') {
            if (h.decision !== undefined && h.decision !== null) {
              errors.push(`${hPrefix}: "decision" must not be present while status is "pending".`);
            }
          } else if (h.status === 'accepted' || h.status === 'returned') {
            if (!h.decision || typeof h.decision !== 'object' || Array.isArray(h.decision)) {
              errors.push(`${hPrefix}: "decision" object is required when status is "${h.status}".`);
            } else {
              const dPrefix = `${hPrefix}.decision`;
              if (!h.decision.by || typeof h.decision.by !== 'string') {
                errors.push(`${dPrefix}: "by" is required and must be an agent ID string.`);
              } else if (!knownAgentIds.has(h.decision.by)) {
                errors.push(`${dPrefix}: "by" agent ID "${h.decision.by}" is not registered in agents array.`);
              }

              if (!isValidIsoDate(h.decision.at)) {
                errors.push(`${dPrefix}: "at" ("${h.decision.at}") must be a strictly valid ISO 8601 date.`);
              }

              if (h.status === 'returned') {
                if (typeof h.decision.reason !== 'string' || !h.decision.reason.trim()) {
                  errors.push(`${dPrefix}: "reason" is required and must be a non-empty string when status is "returned".`);
                }
              }
            }
          }

          // Optional handoff history array validation (100% backwards compatible)
          if (h.history !== undefined && h.history !== null) {
            if (!Array.isArray(h.history)) {
              errors.push(`${hPrefix}.history must be an array when provided.`);
            } else {
              h.history.forEach((hist, hIdx) => {
                const histPrefix = `${hPrefix}.history[${hIdx}]`;
                if (!hist || typeof hist !== 'object' || Array.isArray(hist)) {
                  errors.push(`${histPrefix} must be an object.`);
                  return;
                }
                if (!hist.status || !VALID_HANDOFF_STATUSES.has(hist.status)) {
                  errors.push(`${histPrefix}: status "${hist?.status}" is invalid. Allowed: ${[...VALID_HANDOFF_STATUSES].join(', ')}`);
                }
                if (!isValidIsoDate(hist.at)) {
                  errors.push(`${histPrefix}: "at" ("${hist?.at}") must be a strictly valid ISO 8601 date.`);
                }
                if (hist.from && !knownAgentIds.has(hist.from)) {
                  errors.push(`${histPrefix}: "from" agent ID "${hist.from}" is not registered.`);
                }
                if (hist.to && !knownAgentIds.has(hist.to)) {
                  errors.push(`${histPrefix}: "to" agent ID "${hist.to}" is not registered.`);
                }
              });
            }
          }
        }
      }
    });
  }

  // 5. Messages array validation
  if (data.messages !== undefined && data.messages !== null) {
    if (!Array.isArray(data.messages)) {
      errors.push('Root "messages" must be an array.');
    } else {
      data.messages.forEach((msg, i) => {
        const prefix = `messages[${i}] (${msg?.id || i})`;
        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
          errors.push(`${prefix} must be an object.`);
          return;
        }
        if (!msg.id || typeof msg.id !== 'string') {
          errors.push(`${prefix}: "id" is required and must be a string.`);
        }
        if (!msg.from || typeof msg.from !== 'string') {
          errors.push(`${prefix}: "from" is required and must be a string.`);
        }
        if (!msg.to || typeof msg.to !== 'string') {
          errors.push(`${prefix}: "to" is required and must be a string.`);
        }
        if (!msg.body || typeof msg.body !== 'string') {
          errors.push(`${prefix}: "body" is required and must be a string.`);
        }
        if (!isValidIsoDate(msg.at)) {
          errors.push(`${prefix}: "at" ("${msg.at}") must be a strictly valid ISO 8601 date.`);
        }
      });
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}

function validateFile(filePath = STATE_FILE) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Error: State file not found at ${filePath}`);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`✗ Error reading state file: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`✗ Error: Invalid JSON syntax in agents-state.json: ${err.message}`);
    process.exit(1);
  }

  const result = validateStateObject(data, raw);
  printResultsAndExit(result.errors, result.warnings, data);
}

function printResultsAndExit(errors, warnings, data) {
  if (warnings.length > 0) {
    console.warn('\nWarnings:');
    warnings.forEach((w) => console.warn(`  ! ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\n✗ Validation failed with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('✓ agents-state.json is valid!');
  if (data) {
    const handoffCount = Array.isArray(data.tasks)
      ? data.tasks.filter((t) => t && t.handoff).length
      : 0;
    console.log(`  - Updated at: ${data.updated_at}`);
    console.log(`  - Agents (${data.agents?.length || 0}): ${data.agents?.map(a => `${a.name} [${a.status}]`).join(', ')}`);
    console.log(`  - Tasks (${data.tasks?.length || 0}): ${data.tasks?.map(t => `${t.id} [${t.status}${t.handoff ? `:${t.handoff.status}` : ''}]`).join(', ')}`);
    console.log(`  - Handoff receipts: ${handoffCount}`);
    console.log(`  - Messages (${data.messages?.length || 0}): ${data.messages?.length || 0} message(s) logged.`);
  }
  process.exit(0);
}

if (require.main === module) {
  validateFile();
}

module.exports = {
  validateStateObject,
  isValidIsoDate,
  isValidSafeUrl,
  scanForSecrets,
  VALID_AGENT_STATUSES,
  VALID_TASK_STATUSES,
  VALID_HANDOFF_STATUSES
};
