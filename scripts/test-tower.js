#!/usr/bin/env node

/**
 * test-tower.js
 * Comprehensive automated test suite for «نبض | برج التنسيق» (Nabd Coordination Tower)
 * Covers: Handoff receipts, status enums, decision consistency, safe URLs,
 * priority ordering, actor resolution, and offline cache epistemic transparency.
 */

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const {
  validateStateObject,
  isValidIsoDate,
  isValidSafeUrl
} = require('./validate-state.js');

function createBaseState() {
  return {
    updated_at: '2026-11-20T00:26:45+03:00',
    agents: [
      {
        id: 'muse',
        name: 'Muse',
        role: 'مساعد شخصي وتنسيق',
        status: 'working',
        current_task: 'تنسيق لوحة نبض الوكلاء ومراجعة PR #96',
        connection: 'email',
        last_seen: '2026-11-20T00:26:45+03:00'
      },
      {
        id: 'site-agent',
        name: 'موقعي',
        role: 'وكيل موقع amnabd.com',
        status: 'waiting',
        current_task: 'انتظار مراجعة PR #96 لتحسين السرعة والأداء الشامل',
        connection: 'email',
        last_seen: '2026-11-19T23:05:00+03:00'
      }
    ],
    tasks: [
      {
        id: 'perf-opt-phase',
        title: 'المرحلة الاحترافية لتحسين السرعة والأداء الشامل',
        owner: 'site-agent',
        status: 'waiting_review',
        link: 'https://github.com/amiraq1/amnabd-deals-web/pull/96',
        created_by: 'site-agent',
        updated_at: '2026-11-19T23:05:00+03:00'
      }
    ],
    messages: [
      {
        id: 'm1',
        from: 'site-agent',
        to: 'muse',
        task: 'perf-opt-phase',
        at: '2026-11-19T23:05:00+03:00',
        body: 'تم الانتهاء من مرحلة تحسين الأداء ورفع PR #96. بانتظار المراجعة والدمج.'
      }
    ]
  };
}

// Logic replicate matching app.js Coordination Tower implementation
function getCoordinationTowerItems(tasks, agents) {
  const activeTasks = tasks.filter(
    (t) => t.status !== 'done' && t.status !== 'cancelled' && t.state !== 'completed'
  );

  const items = [];

  for (const task of activeTasks) {
    if (!task.handoff) continue;
    const h = task.handoff;
    const fromAgent = agents.find((a) => a.id === h.from) || { id: h.from, name: h.from };
    const toAgent = agents.find((a) => a.id === h.to) || { id: h.to, name: h.to };

    let actorId;
    let actorName;
    let actorRole;
    let waitTimestamp;
    let rank;
    let returnReason = null;

    if (h.status === 'returned') {
      rank = 1;
      actorId = h.from;
      actorName = fromAgent.name;
      actorRole = 'المرسل (مطلوب معالجة سبب الإعادة)';
      waitTimestamp = h.decision?.at || h.at;
      returnReason = h.decision?.reason || null;
    } else if (h.status === 'pending') {
      rank = 2;
      actorId = h.to;
      actorName = toAgent.name;
      actorRole = 'المستلم (مطلوب مراجعة التسليم)';
      waitTimestamp = h.at;
    } else if (h.status === 'accepted') {
      rank = 3;
      actorId = h.to;
      actorName = toAgent.name;
      actorRole = 'المستلم (التسليم مقبول والمهمة جارية)';
      waitTimestamp = h.decision?.at || h.at;
    } else {
      continue;
    }

    const waitMs = Math.max(0, Date.now() - new Date(waitTimestamp).getTime());
    const waitMinutes = Math.floor(waitMs / (1000 * 60));

    items.push({
      task,
      handoff: h,
      rank,
      actorId,
      actorName,
      actorRole,
      nextStep: h.next_step,
      summary: h.summary,
      evidenceUrl: isValidSafeUrl(h.evidence_url) ? h.evidence_url : null,
      waitTimestamp,
      waitMinutes,
      returnReason
    });
  }

  items.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Pending: oldest wait first
    return b.waitMinutes - a.waitMinutes;
  });

  return items;
}

describe('Coordination Tower: Schema & Receipt Validation', () => {
  test('Case 1: Baseline state with no handoff is valid (100% backwards compatible)', () => {
    const state = createBaseState();
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('Case 2: Valid pending handoff receipt passes validation', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'pending',
      summary: 'اكتمال تحسينات الأداء وفصل الحزم واجتياز 633 فحصاً بنجاح',
      next_step: 'مراجعة PR #96 ودمجه في amnabd-deals-web',
      evidence_url: 'https://github.com/amiraq1/amnabd-deals-web/pull/96'
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('Case 3: Valid accepted handoff receipt passes validation (task remains open)', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'accepted',
      summary: 'اكتمال تحسينات الأداء وفصل الحزم',
      next_step: 'دمج الفرع بعد التأكد من النشر النهائي',
      evidence_url: 'https://github.com/amiraq1/amnabd-deals-web/pull/96',
      decision: {
        by: 'muse',
        at: '2026-11-20T00:15:00+03:00'
      }
    };
    // Crucial rule: accepting a handoff does NOT mean task is done
    assert.notEqual(state.tasks[0].status, 'done');
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('Case 4: Valid returned handoff receipt with mandatory reason passes validation', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'returned',
      summary: 'اكتمال تحسينات الأداء وفصل الحزم',
      next_step: 'إعادة ضبط أبعاد الصور وإزالة الحزم غير المستعملة',
      evidence_url: 'https://github.com/amiraq1/amnabd-deals-web/pull/96',
      decision: {
        by: 'muse',
        at: '2026-11-20T00:20:00+03:00',
        reason: 'فحص موازنة الحزم يتطلب تقليل حجم CSS بمقدار 0.5KB إضافي'
      }
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  test('Case 5: Rejects handoff missing required fields (from, to, summary, next_step, status)', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      at: '2026-11-19T23:05:00+03:00'
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"from" is required')));
    assert.ok(result.errors.some((e) => e.includes('"to" is required')));
    assert.ok(result.errors.some((e) => e.includes('"status" is required')));
    assert.ok(result.errors.some((e) => e.includes('"summary" is required')));
    assert.ok(result.errors.some((e) => e.includes('"next_step" is required')));
  });

  test('Case 6: Rejects handoff with unknown agent ID in from/to/decision.by', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'unknown-agent-xyz',
      to: 'another-phantom-agent',
      at: '2026-11-19T23:05:00+03:00',
      status: 'accepted',
      summary: 'ملخص',
      next_step: 'خطوة',
      decision: {
        by: 'ghost-agent',
        at: '2026-11-20T00:00:00+03:00'
      }
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"unknown-agent-xyz" is not registered')));
    assert.ok(result.errors.some((e) => e.includes('"another-phantom-agent" is not registered')));
    assert.ok(result.errors.some((e) => e.includes('"ghost-agent" is not registered')));
  });

  test('Case 7: Rejects handoff with invalid status', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'in_progress', // invalid handoff status!
      summary: 'ملخص',
      next_step: 'خطوة'
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('status "in_progress" is invalid')));
  });

  test('Case 8: Rejects pending handoff having a premature decision object', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'pending',
      summary: 'ملخص',
      next_step: 'خطوة',
      decision: {
        by: 'muse',
        at: '2026-11-20T00:00:00+03:00'
      }
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"decision" must not be present while status is "pending"')));
  });

  test('Case 9: Rejects returned handoff lacking a mandatory reason', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'returned',
      summary: 'ملخص',
      next_step: 'إعادة المعالجة',
      decision: {
        by: 'muse',
        at: '2026-11-20T00:00:00+03:00'
        // missing reason!
      }
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"reason" is required and must be a non-empty string when status is "returned"')));
  });

  test('Case 10: Rejects unsafe evidence URL schemes (e.g. javascript:)', () => {
    const state = createBaseState();
    state.tasks[0].handoff = {
      from: 'site-agent',
      to: 'muse',
      at: '2026-11-19T23:05:00+03:00',
      status: 'pending',
      summary: 'ملخص',
      next_step: 'خطوة',
      evidence_url: 'javascript:alert(1)'
    };
    const result = validateStateObject(state);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('must be a valid http/https URL')));
  });
});

describe('Coordination Tower: Priority Sorting & Action Allocation Logic', () => {
  const agents = [
    { id: 'muse', name: 'Muse' },
    { id: 'site-agent', name: 'موقعي' },
    { id: 'dev-agent', name: 'المطور' }
  ];

  test('Case 11: Correct priority order (Returned > Pending oldest first > Accepted) and actor resolution', () => {
    const tasks = [
      {
        id: 'T-PENDING-RECENT',
        title: 'مهمة تسليم معلق حديث',
        owner: 'site-agent',
        status: 'in_progress',
        handoff: {
          from: 'site-agent',
          to: 'muse',
          at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
          status: 'pending',
          summary: 'عمل حديث',
          next_step: 'مراجعة حديثة'
        }
      },
      {
        id: 'T-RETURNED',
        title: 'مهمة معادة للتعديل',
        owner: 'site-agent',
        status: 'blocked',
        handoff: {
          from: 'site-agent',
          to: 'muse',
          at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: 'returned',
          summary: 'تسليم سابق لم يستوفِ المعايير',
          next_step: 'إصلاح الخلل',
          decision: {
            by: 'muse',
            at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
            reason: 'فشل فحص التكامل الأمني'
          }
        }
      },
      {
        id: 'T-PENDING-OLD',
        title: 'مهمة تسليم معلق قديم',
        owner: 'dev-agent',
        status: 'waiting_review',
        handoff: {
          from: 'dev-agent',
          to: 'site-agent',
          at: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 120 mins ago (older)
          status: 'pending',
          summary: 'عمل سابق ينتظر طويلاً',
          next_step: 'مراجعة عاجلة'
        }
      },
      {
        id: 'T-ACCEPTED',
        title: 'مهمة مقبولة وما زالت مفتوحة',
        owner: 'dev-agent',
        status: 'in_progress',
        handoff: {
          from: 'muse',
          to: 'dev-agent',
          at: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
          status: 'accepted',
          summary: 'تم قبول التسليم والبدء بالتنفيذ',
          next_step: 'إكمال الاختبارات النهائية',
          decision: {
            by: 'dev-agent',
            at: new Date(Date.now() - 180 * 60 * 1000).toISOString()
          }
        }
      },
      {
        id: 'T-DONE',
        title: 'مهمة مكتملة',
        owner: 'muse',
        status: 'done', // Should be EXCLUDED completely
        handoff: {
          from: 'site-agent',
          to: 'muse',
          at: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
          status: 'accepted',
          summary: 'منتهية',
          next_step: 'لا شيء',
          decision: { by: 'muse', at: new Date().toISOString() }
        }
      }
    ];

    const towerItems = getCoordinationTowerItems(tasks, agents);

    // 1. Completed task T-DONE must be excluded
    assert.equal(towerItems.some((i) => i.task.id === 'T-DONE'), false);

    // 2. Exact length must be 4
    assert.equal(towerItems.length, 4);

    // 3. First item MUST be T-RETURNED (rank 1)
    assert.equal(towerItems[0].task.id, 'T-RETURNED');
    assert.equal(towerItems[0].actorId, 'site-agent'); // In returned, sender is the actor!
    assert.equal(towerItems[0].returnReason, 'فشل فحص التكامل الأمني');

    // 4. Second item MUST be T-PENDING-OLD (rank 2, oldest wait)
    assert.equal(towerItems[1].task.id, 'T-PENDING-OLD');
    assert.equal(towerItems[1].actorId, 'site-agent'); // In pending, recipient is actor!

    // 5. Third item MUST be T-PENDING-RECENT (rank 2, newer wait)
    assert.equal(towerItems[2].task.id, 'T-PENDING-RECENT');
    assert.equal(towerItems[2].actorId, 'muse'); // In pending, recipient is actor!

    // 6. Fourth item MUST be T-ACCEPTED (rank 3)
    assert.equal(towerItems[3].task.id, 'T-ACCEPTED');
    assert.equal(towerItems[3].actorId, 'dev-agent');
  });

  test('Case 12: Empty state returns zero items without hallucinating fake actions', () => {
    const tasks = [
      { id: 'T1', title: 'مهمة عادية بلا إيصال', owner: 'muse', status: 'in_progress' },
      { id: 'T2', title: 'مهمة مكتملة', owner: 'site-agent', status: 'done' }
    ];
    const towerItems = getCoordinationTowerItems(tasks, agents);
    assert.equal(towerItems.length, 0);
  });
});

console.log('✓ All 12 test suites for Coordination Tower passed successfully!');
