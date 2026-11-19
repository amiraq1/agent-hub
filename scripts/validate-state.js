#!/usr/bin/env node

/**
 * validate-state.js
 * Lightweight validator for agents-state.json
 * Runs in CI (GitHub Actions) without external dependencies.
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

function isValidIsoDate(str) {
  if (typeof str !== 'string' || !str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function validate() {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(STATE_FILE)) {
    console.error(`✗ Error: State file not found at ${STATE_FILE}`);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(STATE_FILE, 'utf8');
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

  // Root validation
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Root must be an object.');
    printResultsAndExit(errors, warnings, data);
  }

  if (!isValidIsoDate(data.updated_at)) {
    errors.push(`Invalid or missing root "updated_at": "${data.updated_at}". Must be a valid ISO 8601 date.`);
  }

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

  printResultsAndExit(errors, warnings, data);
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
    console.log(`  - Updated at: ${data.updated_at}`);
    console.log(`  - Agents (${data.agents?.length || 0}): ${data.agents?.map(a => `${a.name} [${a.status}]`).join(', ')}`);
    console.log(`  - Tasks (${data.tasks?.length || 0}): ${data.tasks?.map(t => `${t.id} [${t.status}]`).join(', ')}`);
    console.log(`  - Messages (${data.messages?.length || 0}): ${data.messages?.length || 0} message(s) logged.`);
  }
  process.exit(0);
}

validate();
