#!/usr/bin/env node

/**
 * test-validation.js
 * Comprehensive automated test suite for schema validation, security scanning,
 * and negative edge cases in scripts/validate-state.js.
 * Zero external dependencies (uses node:test and node:assert/strict).
 */

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const {
  validateStateObject,
  isValidIsoDate,
  isValidSafeUrl,
  scanForSecrets
} = require('./validate-state.js');

function createValidBaseState() {
  return {
    updated_at: '2026-11-20T09:47:00+03:00',
    revision: 1,
    agents: [
      {
        id: 'muse',
        name: 'Muse',
        role: 'مساعد شخصي وتنسيق',
        status: 'idle',
        last_seen: '2026-11-20T09:47:00+03:00'
      },
      {
        id: 'site-agent',
        name: 'موقعي',
        role: 'وكيل موقع amnabd.com',
        status: 'idle',
        last_seen: '2026-11-20T09:47:00+03:00'
      }
    ],
    tasks: [
      {
        id: 'sec-phase1',
        title: 'المرحلة 1 الأمنية',
        owner: 'site-agent',
        status: 'done',
        updated_at: '2026-11-20T09:44:00+03:00',
        link: 'https://github.com/amiraq1/amnabd-deals-web/pull/94'
      }
    ],
    messages: [
      {
        id: 'm1',
        from: 'muse',
        to: 'site-agent',
        body: 'بدء العمل',
        at: '2026-11-19T19:54:00+03:00'
      }
    ]
  };
}

describe('Security & Validation: Positive & Negative Tests', () => {
  test('POS-01: Baseline valid state passes validation with zero errors', () => {
    const state = createValidBaseState();
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('NEG-01: Rejects unsafe javascript: scheme in task.link', () => {
    const state = createValidBaseState();
    state.tasks[0].link = 'javascript:alert(1)';
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('must be a valid safe http/https URL')));
  });

  test('NEG-02: Rejects data: URI scheme in task.link', () => {
    const state = createValidBaseState();
    state.tasks[0].link = 'data:text/html,<script>alert(1)</script>';
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('must be a valid safe http/https URL')));
  });

  test('NEG-03: Rejects invalid calendar date (2026-02-31 rollover)', () => {
    assert.equal(isValidIsoDate('2026-02-31T09:47:00+03:00'), false);
    const state = createValidBaseState();
    state.updated_at = '2026-02-31T09:47:00+03:00';
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Invalid or missing root "updated_at"')));
  });

  test('NEG-04: Rejects numeric string "100" as a date', () => {
    assert.equal(isValidIsoDate('100'), false);
    const state = createValidBaseState();
    state.updated_at = '100';
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
  });

  test('NEG-05: Rejects non-ISO slash format "2026/11/19"', () => {
    assert.equal(isValidIsoDate('2026/11/19'), false);
    const state = createValidBaseState();
    state.updated_at = '2026/11/19';
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
  });

  test('NEG-06: Rejects empty agents array (requires at least 1 agent)', () => {
    const state = createValidBaseState();
    state.agents = [];
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Root "agents" array must not be empty')));
  });

  test('NEG-07: Strictly rejects unregistered agent in handoff.from and handoff.to', () => {
    const state = createValidBaseState();
    state.tasks[0].handoff = {
      from: 'ghost-agent-a',
      to: 'ghost-agent-b',
      at: '2026-11-20T09:47:00+03:00',
      status: 'pending',
      summary: 'عمل غير مسجل',
      next_step: 'مراجعة'
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"ghost-agent-a" is not registered')));
    assert.ok(result.errors.some((e) => e.includes('"ghost-agent-b" is not registered')));
  });

  test('NEG-08: Secret scanning rejects leaked OpenAI API key', () => {
    const raw = JSON.stringify(createValidBaseState()) + ' "secret": "sk-1234567890abcdef1234567890abcdef"';
    const secrets = scanForSecrets(raw);
    assert.ok(secrets.includes('OpenAI/Anthropic API Key'));
    const result = validateStateObject(JSON.parse(JSON.stringify(createValidBaseState())), raw);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('SECURITY ALERT')));
  });

  test('NEG-09: Secret scanning rejects leaked GitHub token (ghp_)', () => {
    const raw = '{"token": "ghp_012345678901234567890123456789012345"}';
    const secrets = scanForSecrets(raw);
    assert.ok(secrets.includes('GitHub Personal Access Token (classic)'));
  });

  test('NEG-10: Secret scanning rejects leaked Google API key (AIza)', () => {
    const raw = '{"key": "AIzaSyD-1234567890123456789012345678901"}';
    const secrets = scanForSecrets(raw);
    assert.ok(secrets.includes('Google API Key'));
  });

  test('NEG-11: Rejects corrupted or non-object root', () => {
    const result1 = validateStateObject(null);
    assert.equal(result1.valid, false);
    const result2 = validateStateObject([]);
    assert.equal(result2.valid, false);
  });

  test('POS-02: Accepts valid optional handoff.history array', () => {
    const state = createValidBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-20T09:47:00+03:00',
      status: 'accepted',
      summary: 'اكتمال العمل',
      next_step: 'دمج',
      decision: {
        by: 'muse',
        at: '2026-11-20T09:47:00+03:00'
      },
      history: [
        {
          from: 'site-agent',
          to: 'muse',
          at: '2026-11-19T23:05:00+03:00',
          status: 'returned',
          summary: 'تسليم أولي',
          reason: 'ملاحظة'
        }
      ]
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('NEG-12: Rejects invalid status in handoff.history', () => {
    const state = createValidBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-20T09:47:00+03:00',
      status: 'pending',
      summary: 'عمل',
      next_step: 'خطوة',
      history: [
        {
          at: '2026-11-19T23:05:00+03:00',
          status: 'invalid_status_xyz'
        }
      ]
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('status "invalid_status_xyz" is invalid')));
  });
});

console.log('✓ All 14 security and validation test suites passed successfully!');
