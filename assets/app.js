/**
 * assets/app.js
 * High-Performance Single Page Architecture for Nabd Agents
 * Features: Instant Paint, Stale-While-Revalidate (SWR), Zero-Dependency Native Modules,
 * In-Memory Debounced Search, Keyboard Shortcuts, Tab Visibility Management & PWA.
 *
 * Architecture:
 * - Native ES Modules: security.js, tower.js, format.js
 * - Single Source of Truth: agents-state.json (with live GitHub SWR fallback)
 * - Epistemic Honesty: Explicit separation of cache, heartbeats, and available history
 */

import { sanitizeUrl, isValidSafeUrl, escapeHtml, safeLinkHref } from './modules/security.js';
import { getCoordinationTowerItems } from './modules/tower.js';
import { formatWaitingDuration, nowTime, minutesSinceIso } from './modules/format.js';
import { getFocusableElements, trapFocusInModal } from './modules/a11y.js';

// =========================================================================
// 1. I18N DICTIONARY (Arabic RTL default + English LTR)
// =========================================================================
const I18N = {
  ar: {
    brandName: 'نبض الوكلاء',
    brandSub: 'طبقة التسليم وسجل الحالة غير المتزامن',
    alertsBtn: 'التنبيهات',
    alertsTitle: 'مركز التنبيهات الذكية وسجل التدقيق',
    footerCopy: 'نبض الوكلاء (Nabd Agents) — المنصة التفاعلية ومصدر الحقيقة المشترك | 2026',
    resetDemo: 'إعادة ضبط البيانات المحلية',
    searchPlaceholder: 'بحث فوري في الوكلاء، المهام، الرسائل... (اضغط / للتركيز)',
    shortcutsHint: 'اختصارات: [ / ] بحث • [ R ] تحديث • [ 1-4 ] التبويبات • [ Esc ] إغلاق',
    nav: {
      overview: 'نظرة عامة',
      board: 'لوحة الحالة',
      tasks: 'المهام والأدلة',
      handoffs: 'سجل التسليمات'
    },
    states: {
      working: 'يعمل',
      waiting: 'بانتظار مراجعة',
      idle: 'خامل / جاهز',
      offline: 'غير متصل',
      error: 'خطأ',
      done: 'مكتمل',
      waiting_human: 'بانتظار قرار بشري',
      blocked: 'معطّل',
      unresponsive: 'منقطع النبض'
    },
    taskStates: {
      todo: 'قيد الانتظار',
      in_progress: 'قيد التنفيذ',
      waiting_review: 'بانتظار المراجعة',
      blocked: 'معطّل',
      done: 'مكتمل',
      cancelled: 'ملغي'
    },
    handoffStates: {
      pending: 'معلّق (بانتظار البت)',
      accepted: 'مقبول (قيد الإنجاز)',
      returned: 'معاد للتصحيح'
    },
    connTypes: {
      email: 'البريد الإلكتروني',
      github: 'مستودع GitHub',
      cli: 'طرفية CLI محلية'
    },
    tower: {
      title: 'نبض | برج التنسيق — من عليه الخطوة التالية؟',
      subtitle: 'ترتيب الأولويات الآني لتسريع بت التسليمات وفك التعثر',
      emptyTitle: 'لا توجد مهام تنتظر إجراءً حالياً — جميع المهام مكتملة أو تسير دون عوائق',
      emptyDesc: 'صفر تسليمات معادة أو معلقة تتطلب تدخلاً عاجلاً. يمكنك مراقبة النبضات الحية أو فحص سجل المهام.',
      noTasksTitle: 'لا توجد مهام مسجلة حالياً في ملف الحالة',
      noTasksDesc: 'ملف agents-state.json لا يحتوي على أي مهام مسجلة. عند إضافة مهام ستظهر هنا بترتيب الأولوية.',
      actionNeeded: 'إجراء مطلوب',
      actionsNeeded: 'إجراءات مطلوبة',
      allClear: 'الوضع سليم بالكامل',
      noTasksBadge: 'لا توجد مهام',
      returnedBadge: 'معاد للتصحيح (أولوية 1)',
      pendingBadge: 'معلّق للمراجعة (أولوية 2)',
      acceptedBadge: 'مقبول وجارٍ (أولوية 3)',
      actorLabel: 'صاحب الخطوة التالية',
      nextStepLabel: 'الخطوة التالية المطلوبة',
      waitingAgeLabel: 'عمر انتظار التسليم',
      evidenceLabel: 'فحص الدليل المرتبط',
      detailsBtn: 'التفاصيل والتسلسل المتاح'
    }
  },
  en: {
    brandName: 'Nabd Agents',
    brandSub: 'Async-First Handoff & State Ledger',
    alertsBtn: 'Alerts',
    alertsTitle: 'Smart Alerts & Audit Stream',
    footerCopy: 'Nabd Agents — Single Source of Truth & Coordination Ledger | 2026',
    resetDemo: 'Reset Local Cache',
    searchPlaceholder: 'Instant search agents, tasks, messages... (Press /)',
    shortcutsHint: 'Shortcuts: [ / ] Search • [ R ] Sync • [ 1-4 ] Views • [ Esc ] Close',
    nav: {
      overview: 'Overview',
      board: 'Status Board',
      tasks: 'Tasks & Artifacts',
      handoffs: 'Handoff Ledger'
    },
    states: {
      working: 'Working',
      waiting: 'Waiting',
      idle: 'Idle',
      offline: 'Offline',
      error: 'Error',
      done: 'Done',
      waiting_human: 'Waiting for Human',
      blocked: 'Blocked',
      unresponsive: 'Unresponsive'
    },
    taskStates: {
      todo: 'Todo',
      in_progress: 'In Progress',
      waiting_review: 'Waiting Review',
      blocked: 'Blocked',
      done: 'Done',
      cancelled: 'Cancelled'
    },
    handoffStates: {
      pending: 'Pending Review',
      accepted: 'Accepted',
      returned: 'Returned for Fixes'
    },
    connTypes: {
      email: 'Email Channel',
      github: 'GitHub Repo',
      cli: 'Local CLI'
    },
    tower: {
      title: 'Who Has the Next Step?',
      subtitle: 'Coordination Tower & Immediate Next Actions',
      emptyTitle: 'No tasks awaiting action — all tasks completed or running smoothly',
      emptyDesc: 'Zero stalled or returned handoffs requiring urgent intervention. You can monitor heartbeats or check the handoff ledger.',
      noTasksTitle: 'No tasks currently registered in state file',
      noTasksDesc: 'The agents-state.json file does not contain registered tasks yet.',
      actionNeeded: 'action needed',
      actionsNeeded: 'actions needed',
      allClear: 'All Clear',
      noTasksBadge: 'No Tasks',
      returnedBadge: 'Returned (Fix Needed)',
      pendingBadge: 'Pending (Review Needed)',
      acceptedBadge: 'Accepted (In Progress)',
      actorLabel: 'Current Next Step Owner',
      nextStepLabel: 'Required Next Step',
      waitingAgeLabel: 'Waiting Age',
      evidenceLabel: 'Inspect Evidence Artifact',
      detailsBtn: 'Details & Available Sequence'
    }
  }
};

// =========================================================================
// 2. GROUNDED INITIAL STATE
// =========================================================================
function createDefaultState() {
  return {
    lang: 'ar',
    view: 'overview',
    liveMode: false,
    liveUrl: './agents-state.json',
    liveRemoteUrl: 'https://raw.githubusercontent.com/amiraq1/agent-hub/main/agents-state.json',
    liveLastSync: null,
    liveStatusState: 'checking', // 'cached', 'checking', 'live', 'offline'
    liveError: null,
    autoRefresh: true,
    autoRefreshSecondsRemaining: 30,
    searchQuery: '',
    lastFingerprint: '',
    liveMessages: [],
    boardFilter: 'all',
    taskFilterOwner: 'all',
    taskFilterStatus: 'all',
    agents: [
      {
        id: 'muse',
        name: 'Muse',
        roleAr: 'مساعد شخصي وتنسيق',
        roleEn: 'Personal Assistant & Coordination',
        connection: 'email',
        config: 'agents-state.json',
        status: 'idle',
        ttlMinutes: 60,
        minutesAgo: 0,
        activeTaskId: 'جاهز للتكليفات',
        color: 'emerald'
      },
      {
        id: 'site-agent',
        name: 'موقعي',
        roleAr: 'وكيل موقع amnabd.com',
        roleEn: 'amnabd.com Site Agent',
        connection: 'email',
        config: 'agents-state.json',
        status: 'idle',
        ttlMinutes: 60,
        minutesAgo: 0,
        activeTaskId: 'جاهز للتكليفات',
        color: 'emerald'
      }
    ],
    tasks: [],
    auditEvents: [
      {
        id: 'AUD-101',
        time: nowTime(),
        type: 'ingest',
        actor: 'system:init',
        msgAr: 'بدء تشغيل اللوحة وتهيئة مصدر الحقيقة المشترك.',
        msgEn: 'Dashboard initialized with single source of truth.'
      }
    ]
  };
}

let state = loadInitialState();
let autoRefreshTimer = null;
let searchDebounceTimer = null;

// =========================================================================
// 3. STORAGE & SWR ENGINE
// =========================================================================
function loadInitialState() {
  const VALID_VIEWS = new Set(['overview', 'board', 'tasks', 'handoffs']);
  try {
    const raw = localStorage.getItem('nabd_agents_state_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.agents) && Array.isArray(parsed.tasks)) {
        parsed.liveStatusState = 'cached';
        const merged = Object.assign(createDefaultState(), parsed);
        if (!VALID_VIEWS.has(merged.view)) {
          merged.view = 'overview';
        }
        return merged;
      }
    }
  } catch (e) {}
  const def = createDefaultState();
  if (!VALID_VIEWS.has(def.view)) def.view = 'overview';
  return def;
}

function saveState() {
  try {
    localStorage.setItem('nabd_agents_state_v1', JSON.stringify({
      lang: state.lang,
      view: state.view,
      agents: state.agents,
      tasks: state.tasks,
      liveMessages: state.liveMessages,
      auditEvents: state.auditEvents,
      boardFilter: state.boardFilter,
      taskFilterOwner: state.taskFilterOwner,
      taskFilterStatus: state.taskFilterStatus,
      lastFingerprint: state.lastFingerprint
    }));
  } catch (e) {}
}

function t(path) {
  const parts = path.split('.');
  let cur = I18N[state.lang] || I18N.ar;
  for (const p of parts) {
    if (cur && cur[p] !== undefined) cur = cur[p];
    else return path;
  }
  return cur;
}

function isAr() {
  return state.lang === 'ar';
}

function addAudit(type, actor, msgAr, msgEn) {
  state.auditEvents.unshift({
    id: 'AUD-' + (100 + state.auditEvents.length + 1),
    time: nowTime(),
    type,
    actor,
    msgAr,
    msgEn
  });
  if (state.auditEvents.length > 50) state.auditEvents.pop();
}

function showToast(msg, variant = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const colors = {
    success: 'border-emerald-500/50 bg-surface-900/95 text-emerald-300',
    danger: 'border-rose-500/50 bg-surface-900/95 text-rose-300',
    warning: 'border-amber-500/50 bg-surface-900/95 text-amber-300',
    info: 'border-cyan-500/50 bg-surface-900/95 text-cyan-300'
  }[variant] || 'border-slate-700 bg-surface-900 text-slate-200';

  const el = document.createElement('div');
  el.className = `flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs shadow-2xl glass-card transition-all duration-200 ${colors}`;
  el.innerHTML = `<span>${variant === 'success' ? '✓' : variant === 'danger' ? '✕' : 'ℹ'}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2400);
}

function normalizeAgentStatus(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'working' || s === 'running' || s === 'in_progress') return 'working';
  if (s === 'waiting' || s === 'waiting_review' || s === 'pending') return 'waiting';
  if (s === 'waiting_human') return 'waiting_human';
  if (s === 'idle' || s === 'ready') return 'idle';
  if (s === 'offline' || s === 'stopped') return 'offline';
  if (s === 'blocked' || s === 'error') return 'blocked';
  if (s === 'unresponsive') return 'unresponsive';
  if (s === 'done' || s === 'completed') return 'done';
  return 'idle';
}

function computeFingerprint(data) {
  try {
    return JSON.stringify({
      u: data.updated_at,
      r: data.revision || 0,
      a: (data.agents || []).map((x) => [x.id, x.status, x.last_seen, x.current_task]),
      t: (data.tasks || []).map((x) => [x.id, x.status, x.updated_at, x.handoff?.status, x.handoff?.decision?.at]),
      m: (data.messages || []).length
    });
  } catch (e) {
    return String(Date.now());
  }
}

function applyAgentHubJson(data, sourceLabel, silent = false) {
  if (!data || typeof data !== 'object') return;

  const rawAgents = Array.isArray(data.agents) ? data.agents
    : (data.agents && typeof data.agents === 'object'
      ? Object.entries(data.agents).map(([k, v]) => Object.assign({ id: k }, v))
      : []);

  const mappedAgents = rawAgents.map((a, idx) => {
    const id = String(a.id || a.agent_id || a.name || ('agent-' + (idx + 1)));
    const name = String(a.name || id);
    const role = String(a.role || a.description || 'AI Agent');
    const ttl = Number(a.ttl_minutes || a.ttl || 60);
    const lastSeenIso = a.last_seen || a.last_seen_at || a.updated_at || '';
    const mins = lastSeenIso ? (minutesSinceIso(lastSeenIso) ?? 0) : 0;
    let st = normalizeAgentStatus(a.status || a.state);
    if (st === 'working' && lastSeenIso && mins > ttl) {
      st = 'unresponsive';
    }
    const connRaw = String(a.connection || a.connection_type || a.channel || '').toLowerCase();
    const conn = connRaw.includes('mail') || connRaw.includes('cue') ? 'email'
      : connRaw.includes('cli') || connRaw.includes('local') ? 'cli' : 'github';
    return {
      id,
      name,
      roleAr: role,
      roleEn: role,
      connection: conn,
      config: a.config || a.source || (lastSeenIso ? ('last_seen: ' + lastSeenIso) : 'agents-state.json'),
      status: st,
      ttlMinutes: ttl,
      minutesAgo: mins,
      activeTaskId: a.current_task || a.active_task || a.task_id || '—',
      color: st === 'working' ? 'emerald' : st === 'waiting_human' ? 'amber' : st === 'unresponsive' ? 'rose' : 'cyan'
    };
  });

  const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
  const mappedTasks = rawTasks.map((tk, idx) => {
    const id = String(tk.id || tk.task_id || ('T-' + (idx + 1)));
    const title = String(tk.title || tk.name || id);
    const ownerId = String(tk.owner || tk.assignee || tk.owner_agent_id || tk.agent || 'unassigned');
    const stRaw = String(tk.status || tk.state || 'working').toLowerCase();
    const st = (stRaw === 'done' || stRaw === 'completed' || stRaw === 'merged') ? 'completed' : normalizeAgentStatus(stRaw);
    const artifacts = [];
    const prUrl = sanitizeUrl(tk.pr_url || tk.pr || tk.url || tk.link || '');
    if (prUrl) {
      artifacts.push({
        type: 'pr',
        label: prUrl.replace(/^https?:\/\/github\.com\//i, ''),
        url: prUrl,
        checks: tk.checks || stRaw,
        commit: tk.commit || tk.sha || 'github',
        branch: tk.branch || tk.repo || 'main',
        details: JSON.stringify(tk, null, 2)
      });
    }
    return {
      id,
      titleAr: title,
      titleEn: title,
      ownerId,
      state: st,
      rawStatus: stRaw,
      updatedAt: tk.updated_at || tk.last_updated || tk.created_at || nowTime(),
      summaryAr: tk.summary || tk.notes || tk.description || (prUrl ? ('مرتبط بـ PR: ' + prUrl) : 'مهمة نشطة'),
      summaryEn: tk.summary || tk.notes || tk.description || (prUrl ? ('Linked PR: ' + prUrl) : 'Active task'),
      artifacts,
      handoff: tk.handoff || null,
      rawTask: tk
    };
  });

  const rawMessages = Array.isArray(data.messages) ? data.messages : [];
  const mappedMessages = rawMessages.map((m, idx) => ({
    id: String(m.id || ('MSG-' + (idx + 1))),
    from: String(m.from || m.sender || m.from_agent || 'agent'),
    to: String(m.to || m.recipient || m.to_agent || 'all'),
    taskId: String(m.task_id || m.task || '—'),
    text: String(m.message || m.content || m.body || m.text || m.summary || ''),
    timestamp: String(m.timestamp || m.created_at || m.at || m.date || '')
  }));

  if (mappedAgents.length) state.agents = mappedAgents;
  if (mappedTasks.length) state.tasks = mappedTasks;
  state.liveMessages = mappedMessages;
  state.liveMode = true;
  state.liveStatusState = 'live';
  state.liveLastSync = nowTime();
  state.liveError = null;

  if (!silent) {
    addAudit(
      'ingest',
      sourceLabel || 'github:agent-hub',
      `تمت مزامنة agents-state.json بنجاح (${mappedAgents.length} وكلاء • ${mappedTasks.length} مهام • ${mappedMessages.length} رسائل).`,
      `Synced agents-state.json (${mappedAgents.length} agents • ${mappedTasks.length} tasks • ${mappedMessages.length} messages).`
    );
  }
}

/**
 * Stale-While-Revalidate Live Fetcher with 4000ms AbortController
 */
async function fetchLiveAgentHub(silent = false) {
  const primaryUrl = './agents-state.json';
  const remoteUrl = state.liveRemoteUrl || 'https://raw.githubusercontent.com/amiraq1/agent-hub/main/agents-state.json';

  const pill = document.getElementById('liveStatusPill');
  if (pill && state.liveStatusState !== 'live') {
    pill.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-dot"></span><span>${isAr() ? 'جارٍ التحقق...' : 'Checking...'}</span>`;
  }

  const tryFetchUrl = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}_t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    let data = null;
    let usedSource = 'relative';

    try {
      data = await tryFetchUrl(primaryUrl);
    } catch (relErr) {
      data = await tryFetchUrl(remoteUrl);
      usedSource = 'github-raw';
    }

    const newFingerprint = computeFingerprint(data);
    const hasChanged = newFingerprint !== state.lastFingerprint;

    applyAgentHubJson(data, usedSource === 'relative' ? 'local:relative' : 'github:raw', silent);
    state.lastFingerprint = newFingerprint;

    if (hasChanged) {
      renderApp();
      if (!silent) {
        showToast(isAr() ? 'تم تحديث البيانات الحية بنجاح' : 'Live data synchronized', 'success');
      }
    } else {
      updateLiveBarUI();
      if (!silent) {
        showToast(isAr() ? 'البيانات محدثة بالفعل ومطابقة للنسخة الحية' : 'Data is already up to date', 'info');
      }
    }
  } catch (err) {
    state.liveError = String(err?.message || err);
    state.liveStatusState = 'offline';
    updateLiveBarUI();
    if (!silent) {
      showToast(isAr() ? `تعذر الاتصال بالخادم (${state.liveError}) — تم الاعتماد على الذاكرة المحلية` : `Sync failed (${state.liveError}) — using local cache`, 'warning');
    }
  }
}

function updateLiveBarUI() {
  const pill = document.getElementById('liveStatusPill');
  const last = document.getElementById('liveLastSync');
  const syncLbl = document.getElementById('syncLiveBtnLabel');
  if (syncLbl) syncLbl.textContent = isAr() ? '↻ تحديث حي' : '↻ Sync Live';

  if (pill && last) {
    if (state.liveStatusState === 'live') {
      pill.className = 'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200';
      pill.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot"></span><span>${isAr() ? 'متصل وحي' : 'Live Connected'}</span>`;
      last.textContent = (isAr() ? 'آخر مزامنة: ' : 'Last sync: ') + (state.liveLastSync || '—');
    } else if (state.liveStatusState === 'cached') {
      pill.className = 'inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200';
      pill.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-cyan-400"></span><span>${isAr() ? 'ذاكرة محلية سريعة' : 'Instant Cached'}</span>`;
      last.textContent = isAr() ? 'التحقق في الخلفية...' : 'Checking background...';
    } else {
      pill.className = 'inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200';
      pill.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span><span>${isAr() ? 'غير متصل (احتياطي)' : 'Offline Fallback'}</span>`;
      last.textContent = state.liveError ? state.liveError : 'amiraq1/agent-hub';
    }
  }
}

function getActiveAlerts() {
  const alerts = [];
  state.agents.forEach((a) => {
    if (a.status === 'unresponsive') {
      alerts.push({
        id: 'alt-unresp-' + a.id,
        level: 'danger',
        titleAr: `وكيل غير متجاوب: ${a.name}`,
        titleEn: `Unresponsive Agent: ${a.name}`,
        descAr: `آخر نبضة منذ ${a.minutesAgo} دقيقة (تجاوز مهلة ${a.ttlMinutes} دقيقة).`,
        descEn: `Last heartbeat ${a.minutesAgo}m ago (exceeded ${a.ttlMinutes}m TTL).`,
        targetView: 'board'
      });
    } else if (a.status === 'waiting_human') {
      alerts.push({
        id: 'alt-human-' + a.id,
        level: 'warning',
        titleAr: `طلب تدخل بشري: ${a.name}`,
        titleEn: `Human Decision Needed: ${a.name}`,
        descAr: isAr() ? 'يتطلب قراراً صريحاً قبل استئناف المهمة.' : 'Awaiting explicit confirmation.',
        targetView: 'board'
      });
    }
  });

  // Handoff returned alerts
  state.tasks.forEach((t) => {
    if (t.handoff && t.handoff.status === 'returned') {
      alerts.push({
        id: 'alt-returned-' + t.id,
        level: 'danger',
        titleAr: `تسليم معاد للتصحيح: ${t.id}`,
        titleEn: `Returned Handoff: ${t.id}`,
        descAr: `السبب: ${t.handoff.decision?.reason || 'مطلوب مراجعة الملاحظات'}`,
        descEn: `Reason: ${t.handoff.decision?.reason || 'Revision required'}`,
        targetView: 'tasks'
      });
    }
  });

  return alerts;
}

function stateBadge(status) {
  const cfg = {
    working: { bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', dot: 'bg-emerald-400' },
    waiting: { bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300', dot: 'bg-amber-400' },
    waiting_human: { bg: 'bg-amber-500/20 border-amber-500/50 text-amber-200', dot: 'bg-amber-400' },
    idle: { bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300', dot: 'bg-cyan-400' },
    offline: { bg: 'bg-slate-700/40 border-slate-600 text-slate-300', dot: 'bg-slate-400' },
    error: { bg: 'bg-rose-500/20 border-rose-500/50 text-rose-300', dot: 'bg-rose-400' },
    blocked: { bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300', dot: 'bg-rose-400' },
    unresponsive: { bg: 'bg-rose-500/25 border-rose-500/60 text-rose-200', dot: 'bg-rose-400' },
    completed: { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200', dot: 'bg-emerald-400' },
    done: { bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200', dot: 'bg-emerald-400' }
  }[status] || { bg: 'bg-slate-800 border-slate-700 text-slate-300', dot: 'bg-slate-400' };

  return `
    <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg}">
      <span class="h-1.5 w-1.5 rounded-full ${cfg.dot}"></span>
      <span>${escapeHtml(t('states.' + status))}</span>
    </span>
  `;
}

// =========================================================================
// 4. COORDINATION TOWER VIEW RENDERER
// =========================================================================
function renderCoordinationTower() {
  const items = getCoordinationTowerItems(state.tasks, state.agents);

  // Honest Empty State: distinguish between 0 tasks vs all tasks completed
  if (!state.tasks || state.tasks.length === 0) {
    return `
      <section class="rounded-2xl border border-slate-700/80 bg-surface-900/90 p-5 contain-opt space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              ℹ
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-tight">${escapeHtml(t('tower.title'))}</h2>
                <span class="rounded-full border border-slate-700 bg-surface-950 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                  ${escapeHtml(t('tower.noTasksBadge'))}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(t('tower.subtitle'))}</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-800 bg-surface-950/70 p-4 text-center sm:text-start">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-300">${escapeHtml(t('tower.noTasksTitle'))}</h3>
            <p class="text-xs text-slate-400 leading-relaxed">${escapeHtml(t('tower.noTasksDesc'))}</p>
          </div>
        </div>
      </section>
    `;
  }

  if (!items.length) {
    return `
      <section class="rounded-2xl border border-emerald-500/30 bg-surface-900/90 p-5 contain-opt space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-tight">${escapeHtml(t('tower.title'))}</h2>
                <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 me-1"></span>
                  ${escapeHtml(t('tower.allClear'))}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(t('tower.subtitle'))}</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-800 bg-surface-950/70 p-4 text-center sm:text-start">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xl font-bold">
            ✓
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-emerald-200">${escapeHtml(t('tower.emptyTitle'))}</h3>
            <p class="text-xs text-slate-400 leading-relaxed">${escapeHtml(t('tower.emptyDesc'))}</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="rounded-2xl border border-amber-500/30 bg-surface-900/90 p-5 contain-opt space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-white tracking-tight">${escapeHtml(t('tower.title'))}</h2>
              <span class="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                ${items.length} ${items.length === 1 ? escapeHtml(t('tower.actionNeeded')) : escapeHtml(t('tower.actionsNeeded'))}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(t('tower.subtitle'))}</p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        ${items.map((item) => {
          const isReturned = item.rank === 1;
          const isPending = item.rank === 2;
          const cardBorder = isReturned
            ? 'border-rose-500/50 bg-rose-950/20'
            : isPending
              ? 'border-amber-500/40 bg-amber-950/15'
              : 'border-emerald-500/40 bg-emerald-950/15';

          const badgeClass = isReturned
            ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            : isPending
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';

          const badgeText = isReturned
            ? escapeHtml(t('tower.returnedBadge'))
            : isPending
              ? escapeHtml(t('tower.pendingBadge'))
              : escapeHtml(t('tower.acceptedBadge'));

          return `
            <div class="rounded-xl border ${cardBorder} p-4 space-y-3 transition hover:border-slate-500">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}">
                    ${badgeText}
                  </span>
                  <span class="rounded-md bg-surface-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-slate-800">${escapeHtml(item.task.id)}</span>
                  <span class="text-sm font-bold text-white">${escapeHtml(isAr() ? (item.task.titleAr || item.task.title) : (item.task.titleEn || item.task.title))}</span>
                  ${item.isCorruptedDate ? `
                    <span class="rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                      ⚠️ ${isAr() ? 'تاريخ غير صالح' : 'Invalid Date'}
                    </span>
                  ` : ''}
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-[11px] text-slate-400">⏱ ${escapeHtml(t('tower.waitingAgeLabel'))}: <strong class="text-slate-200">${formatWaitingDuration(item.waitMinutes, isAr())}</strong></span>
                </div>
              </div>

              <!-- Current Next Step Actor -->
              <div class="rounded-xl bg-surface-950/90 border border-slate-800/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-slate-400 font-medium">${escapeHtml(t('tower.actorLabel'))}:</span>
                  <strong class="text-white bg-surface-900 border border-slate-700 rounded-md px-2 py-0.5 font-bold">${escapeHtml(item.actorName)}</strong>
                  <span class="text-[11px] text-slate-400">(${escapeHtml(isAr() ? item.actorRoleAr : item.actorRoleEn)})</span>
                </div>
                <div class="text-[11px] font-mono text-slate-400">${escapeHtml(item.waitTimestamp || '')}</div>
              </div>

              <!-- Next Step Required -->
              <div class="rounded-xl bg-surface-950/70 border border-slate-800 p-3 space-y-1.5 text-xs">
                <div class="text-slate-300">
                  <span class="text-slate-400">${isAr() ? 'ملخص الإنجاز:' : 'Summary:'}</span>
                  <span>${escapeHtml(item.summary)}</span>
                </div>
                <div class="text-emerald-300 pt-1 border-t border-slate-800/80">
                  <strong class="font-bold">${escapeHtml(t('tower.nextStepLabel'))}:</strong>
                  <span class="text-slate-100 ms-1">${escapeHtml(item.nextStep)}</span>
                </div>
              </div>

              <!-- Return Reason Alert (if returned) -->
              ${item.returnReason ? `
                <div class="rounded-xl bg-rose-500/10 border border-rose-500/40 p-3 text-xs text-rose-200 space-y-1">
                  <div class="font-bold flex items-center gap-1.5">
                    <span>↩</span>
                    <span>${isAr() ? 'سبب الإعادة من الطرف الآخر:' : 'Return Reason:'}</span>
                  </div>
                  <p class="leading-relaxed ps-4">${escapeHtml(item.returnReason)}</p>
                </div>
              ` : ''}

              <!-- Bottom Actions Bar -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  ${sanitizeUrl(item.evidenceUrl) ? `
                    <a href="${escapeHtml(sanitizeUrl(item.evidenceUrl))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">
                      <span>📎 ${escapeHtml(t('tower.evidenceLabel'))}</span>
                      <span class="text-[10px]">↗</span>
                    </a>
                  ` : `<span class="text-[11px] text-slate-400">${isAr() ? 'لا يوجد رابط دليل مرفق' : 'No evidence link'}</span>`}
                </div>
                <button type="button" data-open-task-details="${escapeHtml(item.task.id)}" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-white transition">
                  <span>${escapeHtml(t('tower.detailsBtn'))}</span>
                  <span>${isAr() ? '←' : '→'}</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function openTaskDetailsModal(taskId, triggerEl = null) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const ownerAgent = state.agents.find((a) => a.id === task.ownerId) || { id: task.ownerId, name: task.ownerId, minutesAgo: 0, status: 'unknown' };
  const h = task.handoff;
  const isCached = state.liveStatusState === 'cached' || state.liveStatusState === 'offline';

  let handoffWaitMins = null;
  if (h && h.at) {
    const ts = (h.status === 'returned' && h.decision?.at) ? h.decision.at : h.at;
    handoffWaitMins = minutesSinceIso(ts);
  }

  const cacheBanner = isCached
    ? `<div class="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2.5">
         <span class="text-base">⚠️</span>
         <div>
           <strong class="font-bold">${isAr() ? 'نسخة مخزنة محلياً' : 'Locally Cached Copy'}</strong> — ${isAr() ? 'قد لا تعكس آخر تحديث على GitHub. يتم التحقق والتحديث تلقائياً في الخلفية.' : 'May not reflect the latest update on GitHub. Revalidating in background.'}
         </div>
       </div>`
    : `<div class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-center gap-2.5">
         <span class="text-base">✓</span>
         <div>
           <strong class="font-bold">${isAr() ? 'نسخة حية متصلة' : 'Live Connected Copy'}</strong> — ${isAr() ? 'متزامنة مباشرة مع agents-state.json على GitHub.' : 'Synchronized directly with agents-state.json.'}
         </div>
       </div>`;

  const disambiguationBoxes = `
    <div class="space-y-2">
      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${isAr() ? 'فصل التواريخ الصريح (Timestamp Disambiguation)' : 'Timestamp Disambiguation'}</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'عمر انتظار التسليم' : 'Handoff Waiting Age'}</div>
          <div class="font-mono font-bold mt-1 ${h ? (h.status === 'returned' ? 'text-rose-400' : 'text-amber-300') : 'text-slate-400'}">
            ${h ? formatWaitingDuration(handoffWaitMins, isAr()) : (isAr() ? 'لا يوجد تسليم معلق' : 'No pending handoff')}
          </div>
          <div class="text-[10px] text-slate-400 truncate mt-0.5">${h ? (h.at || '—') : '—'}</div>
        </div>

        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'آخر ظهور للوكيل المالك' : 'Agent Last Seen'}</div>
          <div class="font-mono font-bold text-cyan-300 mt-1">
            ${formatWaitingDuration(ownerAgent.minutesAgo || 0, isAr())}
          </div>
          <div class="text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(ownerAgent.name)} (${escapeHtml(ownerAgent.status)})</div>
        </div>

        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'توقيت جلب البيانات المعروضة' : 'Data Fetch Time'}</div>
          <div class="font-mono font-bold text-emerald-300 mt-1">
            ${state.liveLastSync || (isAr() ? 'ذاكرة أولية' : 'Initial Cache')}
          </div>
          <div class="text-[10px] text-slate-400 truncate mt-0.5">${isCached ? (isAr() ? 'مخزن محلياً' : 'Local Storage') : (isAr() ? 'جلب حي من GitHub' : 'Live GitHub Fetch')}</div>
        </div>
      </div>
    </div>
  `;

  let handoffHtml = '';
  if (h) {
    const fromAgent = state.agents.find((a) => a.id === h.from) || { id: h.from, name: h.from };
    const toAgent = state.agents.find((a) => a.id === h.to) || { id: h.to, name: h.to };
    const isReturned = h.status === 'returned';
    const isPending = h.status === 'pending';
    const badgeColor = isReturned
      ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
      : isPending
        ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';

    const safeEvidence = sanitizeUrl(h.evidence_url);

    handoffHtml = `
      <div class="rounded-2xl border ${isReturned ? 'border-rose-500/40 bg-rose-950/20' : isPending ? 'border-amber-500/30 bg-amber-950/15' : 'border-emerald-500/30 bg-emerald-950/15'} p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-white">${isAr() ? 'إيصال التسليم الموثق (Handoff Receipt)' : 'Verified Handoff Receipt'}</span>
            <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeColor}">
              ${h.status.toUpperCase()}
            </span>
          </div>
          <span class="font-mono text-[10px] text-slate-400">${escapeHtml(h.at || '')}</span>
        </div>

        <div class="grid sm:grid-cols-2 gap-2 text-xs">
          <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-2.5">
            <span class="text-slate-400 text-[10px]">${isAr() ? 'المرسل (From):' : 'From:'}</span>
            <strong class="block text-slate-200 font-semibold mt-0.5">${escapeHtml(fromAgent.name)}</strong>
          </div>
          <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-2.5">
            <span class="text-slate-400 text-[10px]">${isAr() ? 'المستلم (To):' : 'To:'}</span>
            <strong class="block text-slate-200 font-semibold mt-0.5">${escapeHtml(toAgent.name)}</strong>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="text-slate-300"><strong class="text-white">${isAr() ? 'ملخص الإنجاز:' : 'Summary:'}</strong> ${escapeHtml(h.summary)}</div>
          <div class="rounded-xl bg-surface-950 border border-slate-800 p-3 text-emerald-200">
            <strong class="text-emerald-400">${isAr() ? 'الخطوة التالية المطلوبة:' : 'Next Step Required:'}</strong> ${escapeHtml(h.next_step)}
          </div>
        </div>

        ${h.decision ? `
          <div class="rounded-xl border border-slate-700 bg-surface-950 p-3 space-y-1 text-xs">
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Decision by: <strong class="text-slate-200">${escapeHtml(h.decision.by || '—')}</strong></span>
              <span>${escapeHtml(h.decision.at || '—')}</span>
            </div>
            ${h.decision.reason ? `<div class="text-rose-200 mt-1"><strong>${isAr() ? 'سبب الإعادة / القرار:' : 'Reason:'}</strong> ${escapeHtml(h.decision.reason)}</div>` : ''}
          </div>
        ` : ''}

        ${safeEvidence ? `
          <div class="pt-2 border-t border-slate-800/80">
            <a href="${escapeHtml(safeEvidence)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">
              <span>↗ ${isAr() ? 'عرض الدليل والمخرجات المرتبطة' : 'Inspect Evidence Artifact'}</span>
              <span class="font-mono text-[10px] opacity-75">(${escapeHtml(safeEvidence)})</span>
            </a>
            <p class="text-[10px] text-slate-400 mt-1.5 italic">
              ℹ ${isAr() ? 'فتح الرابط للمشاهدة والتحقق فقط — لا يؤدي تلقائياً إلى قبول التسليم. يتم تحديث الحالة عبر تعديل ملف agents-state.json في المستودع.' : 'Note: Reviewing evidence does not automatically accept the handoff. Updates must be committed to agents-state.json.'}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  const timelineEvents = [];
  timelineEvents.push({
    at: task.updatedAt || '2026-11-19T21:00:00Z',
    type: 'task',
    icon: '📝',
    title: isAr() ? `تحديث المهمة: ${task.id}` : `Task updated: ${task.id}`,
    actor: ownerAgent.name,
    desc: isAr() ? (task.summaryAr || task.summaryEn) : (task.summaryEn || task.summaryAr)
  });

  state.liveMessages.forEach((m) => {
    if (m.taskId === task.id || m.task === task.id) {
      timelineEvents.push({
        at: m.timestamp || '2026-11-19T21:00:00Z',
        type: 'message',
        icon: '💬',
        title: isAr() ? `رسالة تنسيق (${m.from} ← ${m.to})` : `Coordination Message (${m.from} → ${m.to})`,
        actor: m.from,
        desc: m.text
      });
    }
  });

  if (h && h.at) {
    timelineEvents.push({
      at: h.at,
      type: 'handoff',
      icon: '🤝',
      title: isAr() ? `إرسال إيصال تسليم (${h.status})` : `Handoff Submitted (${h.status})`,
      actor: h.from,
      desc: h.summary + (h.next_step ? ` — مطلوب: ${h.next_step}` : '')
    });
  }

  if (h && h.decision && h.decision.at) {
    timelineEvents.push({
      at: h.decision.at,
      type: 'decision',
      icon: h.status === 'returned' ? '↩' : '✓',
      title: isAr() ? `قرار التسليم: ${h.status}` : `Handoff Decision: ${h.status}`,
      actor: h.decision.by || 'reviewer',
      desc: h.decision.reason ? (isAr() ? `السبب: ${h.decision.reason}` : `Reason: ${h.decision.reason}`) : (isAr() ? 'تم الاعتماد' : 'Accepted')
    });
  }

  timelineEvents.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const sequenceHtml = `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-white">${isAr() ? 'التسلسل المتاح (Available Sequence)' : 'Available Sequence'}</h4>
        <span class="font-mono text-[10px] text-slate-400">${timelineEvents.length} ${isAr() ? 'حدث متاح' : 'events'}</span>
      </div>
      <p class="text-[11px] text-slate-400 mb-2 leading-relaxed">
        ${isAr()
          ? 'يعرض هذا القسم الأحداث المرتبطة المتوفرة في ملف الحالة الحالي agents-state.json (وليس سجلاً تدقيقياً خارجياً شاملاً).'
          : 'Displays available associated events from the current agents-state.json (not an exhaustive external audit log).'}
      </p>

      <div class="space-y-2 max-h-56 overflow-y-auto custom-scroll pe-1">
        ${timelineEvents.map((ev) => `
          <div class="rounded-xl bg-surface-950 border border-slate-800 p-3 text-xs space-y-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-200 flex items-center gap-1.5">
                <span>${ev.icon}</span>
                <span>${escapeHtml(ev.title)}</span>
              </span>
              <span class="font-mono text-[10px] text-slate-400">${escapeHtml(ev.at)}</span>
            </div>
            <p class="text-slate-400 text-[11px] leading-relaxed">${escapeHtml(ev.desc)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  openModal(`${task.id} — ${isAr() ? (task.titleAr || task.title) : (task.titleEn || task.title)}`, `
    <div class="space-y-5">
      ${cacheBanner}
      ${disambiguationBoxes}
      ${handoffHtml}
      ${sequenceHtml}
      <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
        <span class="text-slate-400">${isAr() ? 'لإجراء أي تعديل، قم بإنشاء PR وتحديث الملف:' : 'To update state, submit a PR to:'}</span>
        <a href="https://github.com/amiraq1/agent-hub/edit/main/agents-state.json" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
          <span>agents-state.json</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  `, triggerEl);
}

function filterItems() {
  const q = (state.searchQuery || '').toLowerCase().trim();
  const filterByQuery = (item, fields) => {
    if (!q) return true;
    return fields.some((f) => String(item[f] || '').toLowerCase().includes(q));
  };

  const agents = state.agents.filter((a) =>
    filterByQuery(a, ['name', 'id', 'roleAr', 'roleEn', 'activeTaskId', 'status'])
  );

  let tasks = state.tasks.filter((t) =>
    filterByQuery(t, ['titleAr', 'titleEn', 'id', 'ownerId', 'summaryAr', 'summaryEn', 'state'])
  );

  if (state.taskFilterOwner && state.taskFilterOwner !== 'all') {
    tasks = tasks.filter((t) => t.ownerId === state.taskFilterOwner);
  }

  if (state.taskFilterStatus && state.taskFilterStatus !== 'all') {
    tasks = tasks.filter((t) => t.rawStatus === state.taskFilterStatus || t.state === state.taskFilterStatus);
  }

  const messages = state.liveMessages.filter((m) =>
    filterByQuery(m, ['from', 'to', 'text', 'taskId'])
  );

  return { agents, tasks, messages };
}

// =========================================================================
// 5. VIEW RENDERERS (OVERVIEW, BOARD, TASKS, HANDOFFS)
// =========================================================================
function renderOverview() {
  const workingCount = state.agents.filter((a) => a.status === 'working').length;
  const alerts = getActiveAlerts();
  const tasksWithHandoff = state.tasks.filter((t) => t.handoff);
  const completedTasks = state.tasks.filter((t) => t.state === 'completed' || t.rawStatus === 'done').length;

  return `
    ${renderCoordinationTower()}

    <section class="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-10 contain-opt">
      <div class="pointer-events-none absolute -top-24 -end-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div class="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7 space-y-5">
          <div class="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span class="h-2 w-2 rounded-full bg-emerald-400 pulse-dot"></span>
            <span>${isAr() ? 'غير متزامن أولًا (Async-First) • فائق السرعة وبلا حجب رسم' : 'Async-First Ledger • Ultra-Fast Zero-Blocking'}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            ${isAr() ? 'نبض الوكلاء — سجل الحالة والتسليم الموثّق لوكلائك غير المتجانسين' : 'Nabd Agents — Auditable State & Handoff Ledger'}
          </h1>

          <p class="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            ${isAr()
              ? 'طبقة تسليم وسجل حالة غير متزامن ومحايد للمنصات، تجمع وكلاء الذكاء الاصطناعي عبر البريد وGitHub وCLI في لوحة موحدة قابلة للتدقيق — لتكشف التسليم الضائع وتُنهي دور الإنسان كوسيط يدوي.'
              : 'A platform-neutral, async-first state board and handoff ledger unifying heterogeneous AI agents (Email, GitHub, CLI) for solo builders and teams.'}
          </p>

          <div class="flex flex-wrap gap-3 pt-1">
            <button type="button" data-jump="board" class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20">
              <span>${isAr() ? 'افتح لوحة الحالة' : 'Open Status Board'}</span>
              <span>${isAr() ? '←' : '→'}</span>
            </button>
            <button type="button" data-jump="tasks" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-surface-900/90 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-white transition">
              <span>${isAr() ? 'المهام والأدلة' : 'Tasks & Proofs'}</span>
            </button>
            <button type="button" data-jump="handoffs" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-surface-900/90 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-400/60 hover:text-white transition">
              <span>${isAr() ? 'سجل التسليمات' : 'Handoff Ledger'}</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-5">
          <div class="rounded-2xl border border-slate-800 bg-surface-950/90 p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${isAr() ? 'مؤشرات المنظومة الحية' : 'Live Snapshot'}</span>
              <span class="font-mono text-[11px] text-emerald-400">PWA: ACTIVE</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'الوكلاء المسجلون' : 'Registered Agents'}</div>
                <div class="mt-1 text-2xl font-extrabold text-white">${state.agents.length} <span class="text-xs text-slate-400">(${workingCount} نشط)</span></div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'تنبيهات نشطة' : 'Active Alerts'}</div>
                <div class="mt-1 text-2xl font-extrabold ${alerts.length ? 'text-rose-400' : 'text-emerald-400'}">${alerts.length}</div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'إجمالي المهام' : 'Total Tasks'}</div>
                <div class="mt-1 text-2xl font-extrabold text-cyan-300">${state.tasks.length}</div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'إيصالات التسليم' : 'Handoff Receipts'}</div>
                <div class="mt-1 text-2xl font-extrabold text-emerald-400">${tasksWithHandoff.length}</div>
              </div>
            </div>
            <div class="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-slate-300">
              <div class="font-semibold text-emerald-300 mb-1">${isAr() ? 'تنسيق حي بين وكلاء نبض' : 'Live Nabd Coordination'}</div>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                ${isAr()
                  ? 'يتم قراءة الحالة مباشرة من agents-state.json مع التحقق الصارم في CI وتوثيق القرارات.'
                  : 'Live state synchronized from agents-state.json with strict CI validation.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problems Solved -->
    <section class="grid md:grid-cols-2 gap-6 contain-opt">
      <div class="rounded-2xl glass-card p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-white">${isAr() ? 'المشكلات اليومية التي ينهيها المنتج' : 'Problems Solved'}</h2>
          <span class="rounded-lg bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300">${isAr() ? 'قبل نبض الوكلاء' : 'Before Nabd'}</span>
        </div>
        <div class="space-y-3 text-sm">
          ${[
            [isAr() ? 'العزل الكامل' : 'Total Silos', isAr() ? 'كل وكيل يعمل داخل صومعته؛ لا أحد يرى ما يعمل عليه الوكيل الآخر.' : 'Each agent operates in isolation with zero cross-tool visibility.'],
            [isAr() ? 'التسليم الهش والضائع' : 'Fragile Lost Handoffs', isAr() ? 'نقل المهام بالنسخ اليدوي أو البريد يفقد السياق والروابط بصمت.' : 'Manual handoffs silently drop context and test results.'],
            [isAr() ? 'غياب السجل الموحّد' : 'No Unified Ledger', isAr() ? 'لا مرجع يجيب: من طلب ماذا، متى أُنجز، وأين الدليل (PR / فحص).' : 'No single source of truth linking who requested what with proof.'],
            [isAr() ? 'تحوّل الإنسان لمنسّق يدوي' : 'Human Orchestrator Tax', isAr() ? 'يضيع وقت الباني يوميًا في نقل الرسائل ومتابعة الحالات يدويًا.' : 'Solo builders burn hours manually ferrying status updates between agents.']
          ].map(([title, desc]) => `
            <div class="rounded-xl bg-surface-950/70 border border-slate-800/80 p-3.5">
              <div class="font-semibold text-rose-300 text-xs mb-1">✕ ${title}</div>
              <p class="text-xs text-slate-400 leading-relaxed">${desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="rounded-2xl glass-card p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-white">${isAr() ? 'القواعد المعمارية الثابتة' : 'Fixed Architectural Principles'}</h2>
          <span class="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">${isAr() ? 'مع نبض الوكلاء' : 'With Nabd'}</span>
        </div>
        <div class="space-y-3 text-sm">
          ${[
            [isAr() ? 'برج التنسيق — صاحب الخطوة التالية' : 'Coordination Tower', isAr() ? 'إجابة فورية خلال ثوانٍ عن صاحب التدخل التالي (معاد ثم معلق تصاعدياً ثم مقبول).' : 'Immediate visibility into who owns the next action.'],
            [isAr() ? 'الأمانة المعرفية (Epistemic Transparency)' : 'Epistemic Transparency', isAr() ? 'فصل تواريخ الانتظار وظهور الوكلاء، وإشعار صريح بالنسخة المخزنة محلياً عند عدم الاتصال.' : 'Clear disambiguation between cache, wait age, and heartbeat.'],
            [isAr() ? 'صفر أسرار ومستودع عام' : 'Zero Secrets in State', isAr() ? 'فحص آلي في CI لمنع إدراج التوكنات أو مفاتيح API في ملف الحالة.' : 'Strict automated secret scanning protects public state.'],
            [isAr() ? 'الأدلة الموثّقة والإيصالات' : 'Verified Evidence Receipts', isAr() ? 'لا تسليم بلا دليل: كل مهمة تُربط بـ PR وفحوصات واضحة قبل اعتمادها.' : 'No handoff without verified PR or build artifacts.']
          ].map(([title, desc]) => `
            <div class="rounded-xl bg-surface-950/70 border border-slate-800/80 p-3.5">
              <div class="font-semibold text-emerald-300 text-xs mb-1">✓ ${title}</div>
              <p class="text-xs text-slate-400 leading-relaxed">${desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderBoard() {
  const { agents } = filterItems();
  const filters = ['all', 'working', 'idle', 'waiting', 'waiting_human', 'blocked', 'unresponsive'];
  const filtered = state.boardFilter === 'all'
    ? agents
    : agents.filter((a) => a.status === state.boardFilter);

  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'لوحة حالة الوكلاء (Agent Status Board)' : 'Agent Status Board'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'متابعة النبضات، المهام الحالية، ووسائل التنسيق بين الوكلاء.' : 'Monitor heartbeats, active tasks, and agent channels.'}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      ${filters.map((f) => {
        const count = f === 'all' ? state.agents.length : state.agents.filter((a) => a.status === f).length;
        const active = state.boardFilter === f;
        const label = f === 'all' ? (isAr() ? 'الكل' : 'All') : t('states.' + f);
        return `
          <button type="button" data-board-filter="${f}" class="rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
            active ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200' : 'border-slate-800 bg-surface-900 text-slate-400 hover:text-white'
          }">
            ${label} <span class="ms-1 font-mono text-[10px] opacity-80">(${count})</span>
          </button>
        `;
      }).join('')}
    </div>

    <!-- Grid -->
    <div class="grid md:grid-cols-2 gap-4 contain-opt">
      ${filtered.map((a) => {
        const pct = Math.min(100, Math.round((a.minutesAgo / Math.max(1, a.ttlMinutes)) * 100));
        const barColor = pct >= 100 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400';
        return `
          <div class="rounded-2xl glass-card p-5 flex flex-col justify-between gap-4 hover:border-slate-600 transition">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-white">${escapeHtml(a.name)}</h3>
                  <span class="rounded-md bg-surface-950 px-2 py-0.5 font-mono text-[10px] text-slate-400 border border-slate-800">${escapeHtml(t('connTypes.' + a.connection))}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${escapeHtml(isAr() ? a.roleAr : a.roleEn)}</p>
              </div>
              ${stateBadge(a.status)}
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex items-center justify-between rounded-xl bg-surface-950/70 px-3 py-2 border border-slate-800/80">
                <span class="text-slate-400">${isAr() ? 'المهمة النشطة' : 'Active Task'}</span>
                <span class="font-mono font-semibold text-cyan-300 truncate max-w-[200px]">${escapeHtml(a.activeTaskId || '—')}</span>
              </div>
              <div>
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-400">${isAr() ? 'آخر نبضة (last_seen)' : 'Last Heartbeat'}</span>
                  <span class="font-mono ${pct >= 100 ? 'text-rose-400 font-bold' : 'text-slate-300'}">${a.minutesAgo}m / TTL ${a.ttlMinutes}m</span>
                </div>
                <div class="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full rounded-full ${barColor} transition-all" style="width: ${pct}%"></div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <span class="font-mono text-[11px] text-slate-400">ID: ${escapeHtml(a.id)}</span>
              <button type="button" data-heartbeat="${escapeHtml(a.id)}" class="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition">
                ♥ ${isAr() ? 'تحديث النبضة الآن' : 'Send Heartbeat'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTasks() {
  const { tasks } = filterItems();
  const owners = ['all', ...new Set(state.tasks.map((t) => t.ownerId).filter(Boolean))];
  const statuses = ['all', 'todo', 'in_progress', 'waiting_review', 'blocked', 'done'];

  return `
    ${renderCoordinationTower()}

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'قائمة المهام والأدلة الموثّقة' : 'Shared Tasks & Artifacts'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'كل مهمة مربوطة بمالكها، أدلة فحصها، وإيصال التسليم إن وجد.' : 'Shared tasks with owners, verified artifacts, and handoff receipts.'}</p>
      </div>
    </div>

    <!-- Filters: Owner & Status -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-900/90 border border-slate-800 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-slate-400 font-semibold">${isAr() ? 'فلترة حسب الوكيل:' : 'Filter Owner:'}</span>
        ${owners.map((o) => `
          <button type="button" data-task-filter-owner="${o}" class="rounded-lg px-2.5 py-1 transition ${
            state.taskFilterOwner === o ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
          }">
            ${o === 'all' ? (isAr() ? 'الكل' : 'All') : escapeHtml(o)}
          </button>
        `).join('')}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-slate-400 font-semibold">${isAr() ? 'الحالة:' : 'Status:'}</span>
        ${statuses.map((s) => `
          <button type="button" data-task-filter-status="${s}" class="rounded-lg px-2.5 py-1 transition ${
            state.taskFilterStatus === s ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
          }">
            ${s === 'all' ? (isAr() ? 'الكل' : 'All') : escapeHtml(t('taskStates.' + s))}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="space-y-4 contain-opt">
      ${tasks.length === 0 ? `
        <div class="rounded-2xl border border-slate-800 bg-surface-900/90 p-8 text-center space-y-2">
          <h3 class="text-sm font-bold text-slate-300">${isAr() ? 'لا توجد مهام تطابق الفلترة الحالية' : 'No tasks match current filter'}</h3>
        </div>
      ` : tasks.map((task) => {
        const owner = state.agents.find((a) => a.id === task.ownerId);
        return `
          <div class="rounded-2xl glass-card p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">${escapeHtml(task.id)}</span>
                  <h3 class="text-base font-bold text-white">${escapeHtml(isAr() ? task.titleAr : task.titleEn)}</h3>
                  ${task.handoff ? `
                    <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      task.handoff.status === 'returned'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : task.handoff.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }">
                      <span>${task.handoff.status === 'returned' ? '🔴' : task.handoff.status === 'pending' ? '🟡' : '🟢'}</span>
                      <span>${isAr() ? (task.handoff.status === 'returned' ? 'إيصال معاد' : task.handoff.status === 'pending' ? 'إيصال معلق' : 'إيصال مقبول') : ('Receipt: ' + task.handoff.status)}</span>
                    </span>
                  ` : ''}
                </div>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">${escapeHtml(isAr() ? task.summaryAr : task.summaryEn)}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                ${stateBadge(task.state)}
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <div class="flex flex-wrap items-center gap-4">
                <span>${isAr() ? 'الوكيل المالك:' : 'Owner:'} <strong class="text-slate-200">${escapeHtml(owner ? owner.name : task.ownerId)}</strong></span>
                <span class="font-mono text-[11px]">${escapeHtml(task.updatedAt)}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-open-task-details="${escapeHtml(task.id)}" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-950 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-emerald-400/60 hover:text-white transition">
                  <span>📋 ${isAr() ? 'التفاصيل والتسلسل المتاح' : 'Details & Sequence'}</span>
                </button>
                ${task.artifacts.length ? task.artifacts.map((art, idx) => `
                  <button type="button" data-inspect-task="${escapeHtml(task.id)}" data-inspect-idx="${idx}" class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 transition">
                    <span>📎 ${escapeHtml(art.label)}</span>
                    <span class="rounded bg-surface-950 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">${escapeHtml(art.checks)}</span>
                  </button>
                `).join('') : `<span class="text-[11px] text-slate-400">${isAr() ? 'لا توجد أدلة بعد' : 'No artifacts'}</span>`}
              </div>
            </div>
          </div>
        `;
      })}
    </div>
  `;
}

function renderHandoffs() {
  const { messages } = filterItems();
  const tasksWithHandoff = (state.tasks || []).filter((t) => t && t.handoff);

  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'سجل إيصالات التسليم غير المتزامن' : 'Async Handoff Ledger'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'إيصالات التسليم الموثقة بين الوكلاء، متطلبات الخطوة التالية، وسجل التبادلات التاريخية.' : 'Documented cross-agent handoff receipts, next step requirements, and history.'}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
          ${isAr() ? `إجمالي الإيصالات: ${tasksWithHandoff.length}` : `Total Receipts: ${tasksWithHandoff.length}`}
        </span>
      </div>
    </div>

    <!-- Live Messages Stream -->
    ${messages && messages.length ? `
      <div class="rounded-2xl glass-card border-cyan-500/30 p-5 space-y-3 contain-opt">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-cyan-200">${isAr() ? 'سجل رسائل التنسيق الحية (messages)' : 'Live Agent Messages'}</h2>
          <span class="font-mono text-[11px] text-cyan-300">${messages.length}</span>
        </div>
        <div class="space-y-2.5 max-h-72 overflow-y-auto custom-scroll pe-1">
          ${messages.map((m) => `
            <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3.5 text-xs space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-emerald-300">${escapeHtml(m.from)}</span>
                  <span class="text-slate-400">${isAr() ? '←' : '→'}</span>
                  <span class="font-bold text-cyan-300">${escapeHtml(m.to)}</span>
                  ${m.taskId && m.taskId !== '—' ? `<span class="rounded bg-surface-900 border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">${escapeHtml(m.taskId)}</span>` : ''}
                </div>
                <span class="font-mono text-[10px] text-slate-400">${escapeHtml(m.timestamp)}</span>
              </div>
              <p class="text-slate-200 leading-relaxed">${escapeHtml(m.text)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Actual Task Handoff Receipts -->
    <div class="space-y-4 contain-opt">
      ${tasksWithHandoff.length === 0 ? `
        <div class="rounded-2xl border border-slate-800 bg-surface-900/90 p-8 text-center space-y-2">
          <div class="text-2xl">🤝</div>
          <h3 class="text-sm font-bold text-slate-300">${isAr() ? 'لا توجد إيصالات تسليم مسجلة حالياً' : 'No handoff receipts found'}</h3>
          <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            ${isAr() ? 'عندما يسجّل وكيل إيصال تسليم في حقل handoff داخل أي مهمة، سيظهر الإيصال وتفاصيل الخطوة التالية هنا.' : 'When an agent records a handoff receipt on a task, it will appear here.'}
          </p>
        </div>
      ` : tasksWithHandoff.map((t) => {
        const h = t.handoff;
        const fromAgent = state.agents.find((a) => a.id === h.from) || { id: h.from, name: h.from };
        const toAgent = state.agents.find((a) => a.id === h.to) || { id: h.to, name: h.to };
        const isReturned = h.status === 'returned';
        const isPending = h.status === 'pending';
        const borderCls = isReturned ? 'border-rose-500/50 bg-rose-950/20' : isPending ? 'border-amber-500/40 bg-amber-950/15' : 'border-emerald-500/40 bg-emerald-950/15';
        const badgeCls = isReturned ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : isPending ? 'border-amber-500/40 bg-amber-500/15 text-amber-200' : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';
        const historyList = Array.isArray(h.history) ? h.history : [];

        return `
          <div class="rounded-2xl glass-card border ${borderCls} p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeCls}">${h.status.toUpperCase()}</span>
                <span class="rounded-md bg-surface-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-slate-800">${escapeHtml(t.id)}</span>
                <span class="text-sm font-bold text-white">${escapeHtml(isAr() ? (t.titleAr || t.title) : (t.titleEn || t.title))}</span>
              </div>
              <span class="font-mono text-[11px] text-slate-400">${escapeHtml(h.at || '')}</span>
            </div>

            <div class="grid sm:grid-cols-2 gap-2.5 text-xs">
              <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-2.5">
                <span class="text-slate-400 text-[10px]">${isAr() ? 'المرسل (From):' : 'From:'}</span>
                <strong class="block text-slate-200 font-semibold mt-0.5">${escapeHtml(fromAgent.name)}</strong>
              </div>
              <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-2.5">
                <span class="text-slate-400 text-[10px]">${isAr() ? 'المستلم صاحب الخطوة (To):' : 'To:'}</span>
                <strong class="block text-slate-200 font-semibold mt-0.5">${escapeHtml(toAgent.name)}</strong>
              </div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="text-slate-300">
                <strong class="text-white">${isAr() ? 'ملخص الإنجاز:' : 'Summary:'}</strong> ${escapeHtml(h.summary)}
              </div>
              <div class="rounded-xl bg-surface-950 border border-slate-800 p-3 text-emerald-200">
                <strong class="text-emerald-400">${isAr() ? 'الخطوة التالية المطلوبة:' : 'Next Step:'}</strong> ${escapeHtml(h.next_step)}
              </div>
            </div>

            ${h.decision ? `
              <div class="rounded-xl border border-slate-700 bg-surface-950 p-3 space-y-1 text-xs">
                <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Decision by: <strong class="text-slate-200">${escapeHtml(h.decision.by || '—')}</strong></span>
                  <span>${escapeHtml(h.decision.at || '—')}</span>
                </div>
                ${h.decision.reason ? `<div class="text-rose-200 mt-1"><strong>${isAr() ? 'السبب:' : 'Reason:'}</strong> ${escapeHtml(h.decision.reason)}</div>` : ''}
              </div>
            ` : ''}

            ${historyList.length > 0 ? `
              <div class="pt-3 border-t border-slate-800/80 space-y-2">
                <div class="text-[11px] font-bold text-slate-400">${isAr() ? `سجل التبادلات السابقة (${historyList.length})` : `Handoff History (${historyList.length})`}</div>
                <div class="space-y-1.5 max-h-40 overflow-y-auto custom-scroll">
                  ${historyList.map((hist) => `
                    <div class="rounded-lg bg-surface-950/60 border border-slate-800/80 p-2 text-[11px] flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-semibold ${hist.status === 'returned' ? 'text-rose-400' : 'text-slate-300'}">[${escapeHtml(hist.status)}]</span>
                        <span class="text-slate-400">${escapeHtml(hist.summary || hist.reason || '—')}</span>
                      </div>
                      <span class="font-mono text-[10px] text-slate-400">${escapeHtml(hist.at || '')}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div>
                ${sanitizeUrl(h.evidence_url) ? `
                  <a href="${escapeHtml(sanitizeUrl(h.evidence_url))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">
                    <span>📎 ${isAr() ? 'عرض الدليل' : 'Inspect Evidence'}</span>
                    <span class="text-[10px]">↗</span>
                  </a>
                ` : `<span class="text-[11px] text-slate-400">${isAr() ? 'لا يوجد رابط دليل' : 'No evidence link'}</span>`}
              </div>
              <button type="button" data-open-task-details="${escapeHtml(t.id)}" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-white transition">
                <span>${isAr() ? 'التفاصيل والتسلسل' : 'Details'}</span>
                <span>${isAr() ? '←' : '→'}</span>
              </button>
            </div>
          </div>
        `;
      })}
    </div>
  `;
}

// =========================================================================
// 6. MODALS & DRAWERS (Accessible Dialogs with Focus Trap & Restoration)
// =========================================================================
let lastFocusedElement = null;

function openModal(title, htmlBody, triggerEl = null) {
  lastFocusedElement = triggerEl || document.activeElement;
  const tEl = document.getElementById('appModalTitle');
  const bEl = document.getElementById('appModalBody');
  const modal = document.getElementById('appModal');
  if (!modal || !tEl || !bEl) return;
  tEl.textContent = title;
  bEl.innerHTML = htmlBody;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  setTimeout(() => {
    const closeBtn = document.getElementById('closeAppModalBtn');
    if (closeBtn) closeBtn.focus();
  }, 20);
}

function closeModal() {
  const modal = document.getElementById('appModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    try { lastFocusedElement.focus(); } catch (e) {}
    lastFocusedElement = null;
  }
}

function openAlertsDrawer(triggerEl = null) {
  lastFocusedElement = triggerEl || document.activeElement;
  const alerts = getActiveAlerts();
  const body = document.getElementById('alertsContent');
  const modal = document.getElementById('alertsModal');
  if (!body || !modal) return;

  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  body.innerHTML = `
    <div class="space-y-2.5">
      <div class="text-xs font-bold text-slate-400">${isAr() ? `التنبيهات النشطة (${alerts.length})` : `Active Alerts (${alerts.length})`}</div>
      ${alerts.length ? alerts.map((al) => `
        <div class="rounded-xl border p-3.5 ${al.level === 'danger' ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-500/40 bg-amber-500/10'}">
          <div class="font-bold text-xs ${al.level === 'danger' ? 'text-rose-200' : 'text-amber-200'}">${escapeHtml(isAr() ? al.titleAr : al.titleEn)}</div>
          <p class="text-[11px] text-slate-300 mt-1">${escapeHtml(isAr() ? al.descAr : al.descEn)}</p>
          <button type="button" data-alert-jump="${al.targetView}" class="mt-2 text-[11px] font-semibold text-white underline underline-offset-4">${isAr() ? 'انتقل للمعالجة' : 'Inspect'}</button>
        </div>
      `).join('') : `<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">${isAr() ? 'جميع الوكلاء والتسليمات سليمة.' : 'All agents healthy.'}</div>`}
    </div>
    <div class="pt-4 border-t border-slate-800 space-y-2">
      <div class="text-xs font-bold text-slate-400">${isAr() ? 'آخر أحداث التدقيق' : 'Recent Audit Events'}</div>
      ${state.auditEvents.slice(0, 8).map((ev) => `
        <div class="rounded-lg bg-surface-950 border border-slate-800 p-2.5 text-[11px]">
          <div class="flex justify-between font-mono text-[10px] text-slate-400">
            <span>${escapeHtml(ev.actor)}</span>
            <span>${escapeHtml(ev.time)}</span>
          </div>
          <div class="text-slate-300 mt-1">${escapeHtml(isAr() ? ev.msgAr : ev.msgEn)}</div>
        </div>
      `).join('')}
    </div>
  `;

  body.querySelectorAll('[data-alert-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.getAttribute('data-alert-jump');
      closeAlertsDrawer();
      renderApp();
    });
  });
  modal.classList.remove('hidden');

  setTimeout(() => {
    const closeBtn = document.getElementById('closeAlertsBtn');
    if (closeBtn) closeBtn.focus();
  }, 20);
}

function closeAlertsDrawer() {
  const modal = document.getElementById('alertsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    try { lastFocusedElement.focus(); } catch (e) {}
    lastFocusedElement = null;
  }
}

// =========================================================================
// 7. MAIN RENDERER & EVENT BINDINGS
// =========================================================================
function renderApp() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isAr() ? 'rtl' : 'ltr';
  const langLabel = document.getElementById('langToggleLabel');
  if (langLabel) langLabel.textContent = isAr() ? 'EN' : 'عربي';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput && document.activeElement !== searchInput) {
    searchInput.placeholder = t('searchPlaceholder');
  }

  const updateNav = (sel) => {
    document.querySelectorAll(sel).forEach((btn) => {
      const v = btn.getAttribute('data-view');
      btn.textContent = t('nav.' + v);
      if (v === state.view) {
        btn.className = sel.includes('mobile')
          ? 'nav-btn-mobile px-3 py-2 rounded-lg text-xs font-bold text-start bg-emerald-500 text-slate-950 transition'
          : 'nav-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 transition';
      } else {
        btn.className = sel.includes('mobile')
          ? 'nav-btn-mobile px-3 py-2 rounded-lg text-xs font-medium text-start text-slate-300 hover:bg-slate-800 transition'
          : 'nav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition';
      }
    });
  };
  updateNav('.nav-btn');
  updateNav('.nav-btn-mobile');

  const alertCount = getActiveAlerts().length;
  const badge = document.getElementById('alertsBadge');
  if (badge) {
    badge.textContent = String(alertCount);
    badge.className = `inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${alertCount ? 'bg-rose-500' : 'bg-emerald-600'}`;
  }

  const main = document.getElementById('appMain');
  if (main) {
    if (state.view === 'overview') main.innerHTML = renderOverview();
    else if (state.view === 'board') main.innerHTML = renderBoard();
    else if (state.view === 'tasks') main.innerHTML = renderTasks();
    else if (state.view === 'handoffs') main.innerHTML = renderHandoffs();
    else {
      state.view = 'overview';
      main.innerHTML = renderOverview();
    }
  }

  bindViewEvents();
  updateLiveBarUI();
  saveState();
}

function bindViewEvents() {
  document.querySelectorAll('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.getAttribute('data-jump');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderApp();
    });
  });

  document.querySelectorAll('[data-board-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.boardFilter = btn.getAttribute('data-board-filter');
      renderApp();
    });
  });

  document.querySelectorAll('[data-task-filter-owner]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.taskFilterOwner = btn.getAttribute('data-task-filter-owner');
      renderApp();
    });
  });

  document.querySelectorAll('[data-task-filter-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.taskFilterStatus = btn.getAttribute('data-task-filter-status');
      renderApp();
    });
  });

  document.querySelectorAll('[data-heartbeat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-heartbeat');
      const ag = state.agents.find((a) => a.id === id);
      if (!ag) return;
      ag.minutesAgo = 0;
      if (ag.status === 'unresponsive') ag.status = 'working';
      addAudit('ingest', `heartbeat:${ag.name}`, `نبضة جديدة من ${ag.name} — تحديث last_seen.`, `Heartbeat received from ${ag.name}.`);
      showToast(isAr() ? `تم تحديث نبضة ${ag.name}` : `Heartbeat updated for ${ag.name}`, 'success');
      renderApp();
    });
  });

  document.querySelectorAll('[data-open-task-details]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-open-task-details');
      openTaskDetailsModal(id, e.currentTarget);
    });
  });

  document.querySelectorAll('[data-inspect-task]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const taskId = btn.getAttribute('data-inspect-task');
      const idx = parseInt(btn.getAttribute('data-inspect-idx'), 10);
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task || !task.artifacts[idx]) return;
      const art = task.artifacts[idx];
      const safeUrl = sanitizeUrl(art.url);
      openModal(`${task.id} — ${art.label}`, `
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-2.5">
              <div class="text-slate-400 text-[10px]">Checks</div>
              <div class="font-mono text-emerald-400 truncate mt-0.5">${escapeHtml(art.checks)}</div>
            </div>
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-2.5">
              <div class="text-slate-400 text-[10px]">Branch</div>
              <div class="font-mono text-cyan-300 truncate mt-0.5">${escapeHtml(art.branch || 'main')}</div>
            </div>
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-2.5">
              <div class="text-slate-400 text-[10px]">Commit</div>
              <div class="font-mono text-slate-200 truncate mt-0.5">${escapeHtml(art.commit || '—')}</div>
            </div>
          </div>
          ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">↗ ${isAr() ? 'فتح الرابط على GitHub' : 'Open on GitHub'}</a>` : `<span class="text-xs text-slate-400 font-mono italic">${isAr() ? 'رابط غير متاح أو غير آمن' : 'No safe link'}</span>`}
          <pre dir="ltr" class="rounded-xl bg-surface-950 border border-slate-800 p-4 text-[11px] text-emerald-200 overflow-x-auto custom-scroll whitespace-pre-wrap leading-relaxed">${escapeHtml(art.details)}</pre>
        </div>
      `, e.currentTarget);
    });
  });
}

// =========================================================================
// 8. GLOBAL LISTENERS & KEYBOARD SHORTCUTS
// =========================================================================
function initGlobalListeners() {
  document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.view = btn.getAttribute('data-view');
      document.getElementById('mobileNav')?.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderApp();
    });
  });

  document.getElementById('brandHomeBtn')?.addEventListener('click', () => {
    state.view = 'overview';
    renderApp();
  });

  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    state.lang = isAr() ? 'en' : 'ar';
    renderApp();
  });

  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileNav')?.classList.toggle('hidden');
  });

  document.getElementById('alertsBtn')?.addEventListener('click', (e) => openAlertsDrawer(e.currentTarget));
  document.getElementById('closeAlertsBtn')?.addEventListener('click', closeAlertsDrawer);
  document.getElementById('alertsBackdrop')?.addEventListener('click', closeAlertsDrawer);

  document.getElementById('closeAppModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('appModalBackdrop')?.addEventListener('click', closeModal);

  document.getElementById('resetDemoBtn')?.addEventListener('click', () => {
    try { localStorage.removeItem('nabd_agents_state_v1'); } catch (e) {}
    state = createDefaultState();
    showToast(isAr() ? 'تمت إعادة ضبط البيانات' : 'Reset demo data', 'info');
    renderApp();
  });

  document.getElementById('syncLiveBtn')?.addEventListener('click', () => {
    fetchLiveAgentHub(false);
  });

  // Debounced Search Inputs (Desktop & Mobile)
  const bindSearch = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        const otherId = id === 'globalSearchInput' ? 'mobileSearchInput' : 'globalSearchInput';
        const otherEl = document.getElementById(otherId);
        if (otherEl && otherEl !== document.activeElement) otherEl.value = e.target.value;
        renderApp();
      }, 120);
    });
  };
  bindSearch('globalSearchInput');
  bindSearch('mobileSearchInput');

  // Keyboard Navigation: [ / ] search, [ R ] sync, [ 1-4 ] views, [ Esc ] close, [ Tab ] focus trap
  window.addEventListener('keydown', (e) => {
    const appModal = document.getElementById('appModal');
    const alertsModal = document.getElementById('alertsModal');
    const isAppModalOpen = appModal && !appModal.classList.contains('hidden');
    const isAlertsModalOpen = alertsModal && !alertsModal.classList.contains('hidden');

    if (e.key === 'Tab') {
      if (isAppModalOpen) {
        trapFocusInModal(e, appModal);
        return;
      }
      if (isAlertsModalOpen) {
        trapFocusInModal(e, alertsModal);
        return;
      }
    }

    if (e.key === 'Escape') {
      if (isAppModalOpen) {
        e.preventDefault();
        closeModal();
        return;
      }
      if (isAlertsModalOpen) {
        e.preventDefault();
        closeAlertsDrawer();
        return;
      }
      const s = document.getElementById('globalSearchInput');
      if (s && s.value) {
        s.value = '';
        state.searchQuery = '';
        renderApp();
      }
      return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      const s = document.getElementById('globalSearchInput');
      if (s) {
        s.focus();
        s.select();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      fetchLiveAgentHub(false);
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      const views = ['overview', 'board', 'tasks', 'handoffs'];
      const targetView = views[parseInt(e.key, 10) - 1];
      if (targetView && state.view !== targetView) {
        state.view = targetView;
        renderApp();
      }
    }
  });

  // Tab Visibility Auto-pause & Auto-refresh (every 30s)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
      }
    } else {
      fetchLiveAgentHub(true);
      startAutoRefresh();
    }
  });

  startAutoRefresh();
}

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  state.autoRefreshSecondsRemaining = 30;
  autoRefreshTimer = setInterval(() => {
    state.autoRefreshSecondsRemaining -= 1;
    const cdEl = document.getElementById('autoRefreshCountdown');
    if (cdEl) {
      cdEl.textContent = `⏱ ${state.autoRefreshSecondsRemaining}s`;
    }
    if (state.autoRefreshSecondsRemaining <= 0) {
      state.autoRefreshSecondsRemaining = 30;
      fetchLiveAgentHub(true);
    }
  }, 1000);
}

// =========================================================================
// 9. SERVICE WORKER & BOOTSTRAP
// =========================================================================
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

initGlobalListeners();
renderApp();
fetchLiveAgentHub(true);
