/**
 * tower.js
 * Single source of truth for «نبض | برج التنسيق» (Nabd Coordination Tower) logic.
 * Zero external dependencies. Shared natively between browser and Node.js test runners.
 */

import { sanitizeUrl } from './security.js';
import { minutesSinceIso } from './format.js';

/**
 * Computes prioritized coordination tower items from tasks and registered agents.
 *
 * Priority Rules:
 * 1. Returned handoffs (rank 1): Urgent block requiring correction from sender.
 * 2. Pending handoffs (rank 2): Awaiting review from recipient, sorted oldest wait first.
 * 3. Accepted handoffs (rank 3): Normal execution in progress.
 *
 * Excludes:
 * - Tasks with status 'done' or 'cancelled'
 * - Tasks without a handoff receipt
 *
 * @param {Array} tasks
 * @param {Array} agents
 * @returns {Array} Ordered tower items
 */
export function getCoordinationTowerItems(tasks, agents = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const activeTasks = tasks.filter((t) => {
    if (!t) return false;
    const st = String(t.status || t.state || t.rawStatus || '').toLowerCase();
    return st !== 'done' && st !== 'cancelled' && st !== 'completed';
  });

  const agentList = Array.isArray(agents) ? agents : [];
  const items = [];

  for (const task of activeTasks) {
    if (!task || !task.handoff || typeof task.handoff !== 'object') {
      continue;
    }

    const h = task.handoff;
    const fromAgent = agentList.find((a) => a && a.id === h.from) || { id: h.from, name: h.from };
    const toAgent = agentList.find((a) => a && a.id === h.to) || { id: h.to, name: h.to };

    let rank;
    let actorId;
    let actorName;
    let actorRoleAr;
    let actorRoleEn;
    let waitTimestamp;
    let returnReason = null;

    if (h.status === 'returned') {
      rank = 1;
      actorId = h.from;
      actorName = fromAgent.name || h.from;
      actorRoleAr = 'المرسل (مطلوب معالجة سبب الإعادة وإعادة التسليم)';
      actorRoleEn = 'Sender (Action needed to address return reason)';
      waitTimestamp = h.decision?.at || h.at;
      returnReason = h.decision?.reason || null;
    } else if (h.status === 'pending') {
      rank = 2;
      actorId = h.to;
      actorName = toAgent.name || h.to;
      actorRoleAr = 'المستلم (مطلوب مراجعة التسليم والبت فيه)';
      actorRoleEn = 'Recipient (Review handoff and decide)';
      waitTimestamp = h.at;
    } else if (h.status === 'accepted') {
      rank = 3;
      actorId = h.to;
      actorName = toAgent.name || h.to;
      actorRoleAr = 'المستلم (التسليم مقبول والمهمة جارية)';
      actorRoleEn = 'Recipient (Handoff accepted, execution in progress)';
      waitTimestamp = h.decision?.at || h.at;
    } else {
      continue;
    }

    const elapsed = minutesSinceIso(waitTimestamp);
    const isCorruptedDate = elapsed === null;
    const waitMinutes = isCorruptedDate ? 0 : elapsed;

    items.push({
      task,
      handoff: h,
      rank,
      actorId,
      actorName,
      actorRoleAr,
      actorRoleEn,
      // Default actorRole for backwards-compatibility with test suites
      actorRole: actorRoleAr,
      nextStep: h.next_step || '',
      summary: h.summary || '',
      evidenceUrl: sanitizeUrl(h.evidence_url) || null,
      waitTimestamp,
      waitMinutes,
      isCorruptedDate,
      returnReason
    });
  }

  items.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Within same priority rank, oldest wait duration comes first
    return b.waitMinutes - a.waitMinutes;
  });

  return items;
}
