#!/usr/bin/env node

/**
 * validate-state.js
 * Lightweight validator for agents-state.json
 * Runs in CI (GitHub Actions) without external dependencies.
 * Includes validation for Nabd Coordination Tower & Handoff Receipts.
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

function isValidIsoDate(str) {
  if (typeof str !== 'string' || !str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isValidSafeUrl(str) {
  if (typeof str !== 'string' || !str.trim()) return false;
  try {
    const u = new URL(str.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateStateObject(data) {
  const errors = [];
  const warnings = [];

  // Root validation
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Root must be an object.');
    return { errors, warnings, valid: false };
  }

  if (!isValidIsoDate(data.updated_at)) {
    errors.push(`Invalid or missing root "updated_at": "${data.updated_at}". Must be a valid ISO 8601 date.`);
  }

  const knownAgentIds = new Set();

  if (!Array.isArray(data.agents)) {
    errors.push('Root "agents" must be an array.');
  } else {
    data.agents.forEach((agent, i) => {
      const prefix = `agents[${i}] (${agent?.id || 'unknown'})`;
      if (!agent || typeof agent !== 'object') {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      if (!agent.id || typeof agent.id !== 'string') {
        errors.push(`${prefix}: "id" is required and must be a string.`);
      } else {
        knownAgentIds.add(agent.id);
      }
      if (!agent.name || typeof agent.name !== 'string') {
        errors.push(`${prefix}: "name" is required and must be a string.`);
      }
      if (!agent.role || typeof agent.role !== 'string') {
        errors.push(`${prefix}: "role" is required and must be a string.`);
      }
      if (!agent.status || typeof agent.status !== 'string') {
        errors.push(`${prefix}: "status" is required.`);
      } else if (!VALID_AGENT_STATUSES.has(agent.status)) {
        errors.push(`${prefix}: status "${agent.status}" is invalid. Allowed: ${[...VALID_AGENT_STATUSES].join(', ')}`);
      }
      if (!isValidIsoDate(agent.last_seen)) {
        errors.push(`${prefix}: "last_seen" ("${agent.last_seen}") must be a valid ISO 8601 date.`);
      }
    });
  }

  if (!Array.isArray(data.tasks)) {
    errors.push('Root "tasks" must be an array.');
  } else {
    data.tasks.forEach((task, i) => {
      const prefix = `tasks[${i}] (${task?.id || 'unknown'})`;
      if (!task || typeof task !== 'object') {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      if (!task.id || typeof task.id !== 'string') {
        errors.push(`${prefix}: "id" is required and must be a string.`);
      }
      if (!task.title || typeof task.title !== 'string') {
        errors.push(`${prefix}: "title" is required and must be a string.`);
      }
      if (!task.status || typeof task.status !== 'string') {
        errors.push(`${prefix}: "status" is required.`);
      } else if (!VALID_TASK_STATUSES.has(task.status)) {
        errors.push(`${prefix}: status "${task.status}" is invalid. Allowed: ${[...VALID_TASK_STATUSES].join(', ')}`);
      }
      if (!isValidIsoDate(task.updated_at)) {
        errors.push(`${prefix}: "updated_at" ("${task.updated_at}") must be a valid ISO 8601 date.`);
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
          } else if (knownAgentIds.size > 0 && !knownAgentIds.has(h.from)) {
            errors.push(`${hPrefix}: "from" agent ID "${h.from}" is not registered in agents array.`);
          }

          if (!h.to || typeof h.to !== 'string') {
            errors.push(`${hPrefix}: "to" is required and must be an agent ID string.`);
          } else if (knownAgentIds.size > 0 && !knownAgentIds.has(h.to)) {
            errors.push(`${hPrefix}: "to" agent ID "${h.to}" is not registered in agents array.`);
          }

          if (!isValidIsoDate(h.at)) {
            errors.push(`${hPrefix}: "at" ("${h.at}") must be a valid ISO 8601 date.`);
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
              } else if (knownAgentIds.size > 0 && !knownAgentIds.has(h.decision.by)) {
                errors.push(`${dPrefix}: "by" agent ID "${h.decision.by}" is not registered in agents array.`);
              }

              if (!isValidIsoDate(h.decision.at)) {
                errors.push(`${dPrefix}: "at" ("${h.decision.at}") must be a valid ISO 8601 date.`);
              }

              if (h.status === 'returned') {
                if (typeof h.decision.reason !== 'string' || !h.decision.reason.trim()) {
                  errors.push(`${dPrefix}: "reason" is required and must be a non-empty string when status is "returned".`);
                }
              }
            }
          }
        }
      }
    });
  }

  if (!Array.isArray(data.messages)) {
    errors.push('Root "messages" must be an array.');
  } else {
    data.messages.forEach((msg, i) => {
      const prefix = `messages[${i}] (${msg?.id || i})`;
      if (!msg || typeof msg !== 'object') {
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
        errors.push(`${prefix}: "at" ("${msg.at}") must be a valid ISO 8601 date.`);
      }
    });
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

  const result = validateStateObject(data);
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
  VALID_AGENT_STATUSES,
  VALID_TASK_STATUSES,
  VALID_HANDOFF_STATUSES
};
