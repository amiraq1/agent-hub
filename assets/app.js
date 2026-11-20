/**
 * assets/app.js
 * High-Performance Single Page Architecture for Nabd Agents
 * Features: Instant Paint, Stale-While-Revalidate (SWR), Zero-Dependency SVG Charting,
 * In-Memory Debounced Search, Keyboard Shortcuts, Tab Visibility Management & PWA.
 */

// =========================================================================
// 1. I18N DICTIONARY (Arabic RTL default + English LTR)
// =========================================================================
const I18N = {
  ar: {
    brandName: 'نبض الوكلاء',
    brandSub: 'طبقة التسليم وسجل الحالة غير المتزامن',
    alertsBtn: 'التنبيهات',
    alertsTitle: 'مركز التنبيهات الذكية وسجل التدقيق',
    footerCopy: 'نبض الوكلاء (Nabd Agents) — المنصة التفاعلية وخطة المنتج المعتمدة | عمار محمد • 2026-11-19',
    resetDemo: 'إعادة ضبط بيانات التجربة',
    searchPlaceholder: 'بحث فوري في الوكلاء، المهام، الرسائل... (اضغط / للتركيز)',
    shortcutsHint: 'اختصارات: [ / ] بحث • [ R ] تحديث • [ 1-6 ] التبويبات • [ Esc ] إغلاق',
    nav: {
      overview: 'نظرة عامة',
      board: 'لوحة الحالة',
      tasks: 'المهام والأدلة',
      handoffs: 'سجل التسليمات',
      pipeline: 'بوابة الاستقبال',
      blueprint: 'الخطة والمالية'
    },
    states: {
      working: 'يعمل',
      idle: 'جاهز / خامل',
      waiting_human: 'ينتظر الإنسان',
      blocked: 'معطّل',
      unresponsive: 'غير متجاوب'
    },
    handoffStates: {
      sent: 'أُرسل (Sent)',
      received: 'استُلم (Received)',
      accepted: 'قُبل (Accepted)',
      completed: 'أُنجز (Completed)'
    },
    connTypes: {
      github: 'ملف GitHub مستقل',
      email: 'بريد وارد مُهيكل',
      cli: 'API + CLI (المرحلة 2)'
    },
    tower: {
      title: 'من عليه الخطوة التالية؟',
      subtitle: 'مركز الإجراءات وتوجيه قرارات التنسيق الفورية',
      emptyTitle: 'لا توجد مهام تنتظر إجراءً حالياً — جميع المهام مكتملة أو تسير دون عوائق',
      emptyDesc: 'لا يوجد أي تسليم معلق أو معاد يتطلب تدخلاً عاجلاً. يمكنك مراقبة نبضات الوكلاء أو الاطلاع على سجل التسليمات.',
      actionNeeded: 'مهمة تحتاج إجراء',
      actionsNeeded: 'مهام تحتاج إجراء',
      allClear: 'الوضع مستقر ومستمر',
      returnedBadge: 'معادة (مطلوب تصحيح)',
      pendingBadge: 'معلقة (بانتظار المراجعة)',
      acceptedBadge: 'مقبولة (العمل جارٍ)',
      actorLabel: 'صاحب الخطوة التالية',
      nextStepLabel: 'الخطوة التالية المطلوبة',
      waitingAgeLabel: 'عمر الانتظار',
      evidenceLabel: 'عرض الدليل والمخرجات',
      detailsBtn: 'التفاصيل والتسلسل المتاح'
    }
  },
  en: {
    brandName: 'Nabd Agents',
    brandSub: 'Async-First Handoff & State Ledger',
    alertsBtn: 'Alerts',
    alertsTitle: 'Smart Alerts & Audit Stream',
    footerCopy: 'Nabd Agents — Interactive MVP & Approved Product Plan | Ammar Mohammed • 2026-11-19',
    resetDemo: 'Reset Demo Data',
    searchPlaceholder: 'Instant search agents, tasks, messages... (Press /)',
    shortcutsHint: 'Shortcuts: [ / ] Search • [ R ] Sync • [ 1-6 ] Views • [ Esc ] Close',
    nav: {
      overview: 'Overview',
      board: 'Status Board',
      tasks: 'Tasks & Artifacts',
      handoffs: 'Handoff Ledger',
      pipeline: 'Edge Pipeline',
      blueprint: 'Blueprint & ROI'
    },
    states: {
      working: 'Working',
      idle: 'Idle / Ready',
      waiting_human: 'Waiting Human',
      blocked: 'Blocked',
      unresponsive: 'Unresponsive'
    },
    handoffStates: {
      sent: 'Sent',
      received: 'Received',
      accepted: 'Accepted',
      completed: 'Completed'
    },
    connTypes: {
      github: 'GitHub Agent File',
      email: 'Structured Inbound Email',
      cli: 'API + CLI (Phase 2)'
    },
    tower: {
      title: 'Who Has the Next Step?',
      subtitle: 'Coordination Tower & Immediate Next Actions',
      emptyTitle: 'No tasks awaiting action — all tasks completed or running smoothly',
      emptyDesc: 'Zero stalled or returned handoffs requiring urgent intervention. You can monitor heartbeats or check the handoff ledger.',
      actionNeeded: 'action needed',
      actionsNeeded: 'actions needed',
      allClear: 'All Clear',
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
const F24_MANIFEST = `Nabd reliability/F-24 local handoff
Branch: audit/reliability
Base main: 155f16bf65d71350c888ce1fdd5b73805ebc8ae5
Reliability commit: 40ca457df79a802a592dcd0439ce6d65a568245f
F-24 integration commit: 98badfcc50f050841a8d68141041f9738699d602

Red real MCP before integration: EXIT 1 (f24-integrate-real-red.log)
Green real MCP after integration: EXIT 0 (f24-integrate-real-green.log)
Extended F-24, x32/cancellation, PID tests: EXIT 0
Each listed f24-mutation-*.log: EXIT 1 (expected test failure; restored afterwards)

Clean archive gate:
GOFMT: test -z "$(gofmt -l .)" EXIT 0
BUILD: CGO disabled; go build ./... EXIT 0
VET: go vet ./... EXIT 0
MODVERIFY: go mod verify EXIT 0
TEST: go test ./... -v -count=1 -p 2 EXIT 0
RACE: go test -race ./... -short -count=1 -p 2 EXIT 0
STATIC: staticcheck 2025.1.1 ./... EXIT 0
ANDROID: Android/arm64 CGO disabled; go build ./... EXIT 0
WINDOWS: Windows/amd64 CGO disabled; go build ./... EXIT 0
The real 60-second test was included in TEST; RACE used -short.
No Termux runtime test and no push or merge were performed.`;

const F24_SAMPLE_LOGS = `--- f24-integrate-real-red.log (Before Integration) ---
FAIL: TestF24IntegrationRealMCPAndEnvironment (0.25s)
  mcp_integration_linux_test.go:77: real MCP request failed:
  Error: mcp call failed: client not initialized

--- f24-integrate-real-green.log (After Integration) ---
ok   github.com/amiraq1/nabd/internal/tools   0.481s

--- f24-clean-RACE.log ---
ok   github.com/amiraq1/nabd/cmd/agent        4.189s
ok   github.com/amiraq1/nabd/cmd/mcp-server   1.045s
ok   github.com/amiraq1/nabd/internal/audit   1.013s
ok   github.com/amiraq1/nabd/internal/llm     1.023s
ok   github.com/amiraq1/nabd/internal/shadow  1.096s
ok   github.com/amiraq1/nabd/internal/tools   14.028s`;

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
    searchQuery: '',
    lastFingerprint: '',
    liveMessages: [],
    boardFilter: 'all',
    blueprintTab: 'architecture',
    pipelineMode: 'github',
    pricing: {
      fixedCost: 50,
      proPrice: 10,
      varCost: 1.5,
      targetSubs: 25
    },
    agents: [
      {
        id: 'muse',
        name: 'Muse',
        roleAr: 'مساعد شخصي وتنسيق (سحابي)',
        roleEn: 'Personal Assistant & Coordination (Cloud)',
        connection: 'email',
        config: 'agents-state.json',
        status: 'working',
        ttlMinutes: 60,
        minutesAgo: 4,
        activeTaskId: 'ربط الوكيلين بلوحة نبض الوكلاء',
        color: 'emerald'
      },
      {
        id: 'site-agent',
        name: 'موقعي',
        roleAr: 'وكيل موقع amnabd.com (على Cue)',
        roleEn: 'amnabd.com Site Agent (on Cue)',
        connection: 'email',
        config: 'agents-state.json',
        status: 'waiting_human',
        ttlMinutes: 45,
        minutesAgo: 8,
        activeTaskId: 'بانتظار مراجعة PR #1 في agent-hub',
        color: 'amber'
      },
      {
        id: 'nabd-coder',
        name: 'nabd-coder',
        roleAr: 'وكيل برمجة وموثوقية (محلي)',
        roleEn: 'Coding & Reliability Agent (Local)',
        connection: 'cli',
        config: 'POST /v1/heartbeat',
        status: 'idle',
        ttlMinutes: 120,
        minutesAgo: 12,
        activeTaskId: 'F-24',
        color: 'cyan'
      }
    ],
    tasks: [
      {
        id: 'sec-phase1',
        titleAr: 'المرحلة 1 الأمنية لموقع amnabd.com',
        titleEn: 'Security Phase 1 for amnabd.com',
        ownerId: 'site-agent',
        state: 'working',
        updatedAt: '2026-11-19 21:21',
        summaryAr: 'تنفيذ القائمة المصححة للمرحلة 1 الأمنية وربط PR #94.',
        summaryEn: 'Security phase 1 execution and linking PR #94.',
        artifacts: [
          {
            type: 'pr',
            label: 'amnabd-deals-web/pull/94',
            url: 'https://github.com/amiraq1/amnabd-deals-web/pull/94',
            checks: 'passed (tests)',
            commit: 'commit-sec-94',
            branch: 'feat/sec-phase1',
            details: 'Pull Request: https://github.com/amiraq1/amnabd-deals-web/pull/94\nOwner: site-agent\nStatus: in_progress'
          }
        ]
      },
      {
        id: 'F-24',
        titleAr: 'تسليم موثوقية MCP الحقيقي وإلغاء العمليات (audit/reliability)',
        titleEn: 'Real MCP Integration & Process Cancellation Reliability Handoff',
        ownerId: 'nabd-coder',
        state: 'completed',
        updatedAt: '2026-11-14 19:35',
        summaryAr: 'اجتاز جميع بوابات Clean Gate (9/9) و13 اختبار Mutation وتكامل MCP الحقيقي (Red → Green).',
        summaryEn: 'Passed all 9/9 Clean Gate checks, 13 mutation tests, and real MCP integration (Red → Green).',
        artifacts: [
          {
            type: 'evidence_zip',
            label: 'nabd-f24-evidence.zip (28 files)',
            checks: 'passed (9/9 gates)',
            commit: '98badfcc50f050841a8d68141041f9738699d602',
            branch: 'audit/reliability',
            details: F24_MANIFEST + '\n\n' + F24_SAMPLE_LOGS
          }
        ]
      },
      {
        id: 'perf-opt-phase',
        titleAr: 'المرحلة الاحترافية لتحسين السرعة والأداء الشامل لموقع amnabd.com',
        titleEn: 'Comprehensive Performance Optimization for amnabd.com',
        ownerId: 'site-agent',
        state: 'waiting_human',
        updatedAt: '2026-11-19 23:05',
        summaryAr: 'اكتمال تحسين Core Web Vitals ورفع PR #96 مع اجتياز 633 فحصًا بنجاح.',
        summaryEn: 'Completed Core Web Vitals optimization and opened PR #96 with 633 passed tests.',
        handoff: {
          from: 'site-agent',
          to: 'muse',
          at: '2026-11-19T23:05:00+03:00',
          status: 'pending',
          summary: 'اكتمال المرحلة الاحترافية لتحسين السرعة والأداء الشامل لموقع amnabd.com بنجاح (633 اختبار، bundle budget 122.94KB)',
          next_step: 'مراجعة واعتماد PR #96 ودمجه إلى main',
          evidence_url: 'https://github.com/amiraq1/amnabd-deals-web/pull/96'
        },
        artifacts: [
          {
            type: 'pr',
            label: 'amnabd-deals-web/pull/96',
            url: 'https://github.com/amiraq1/amnabd-deals-web/pull/96',
            checks: 'passed (633 tests, bundle 122.94KB)',
            commit: '274287c',
            branch: 'agent/perf-optimization',
            details: 'Pull Request: https://github.com/amiraq1/amnabd-deals-web/pull/96\nOwner: site-agent\nStatus: waiting_review'
          }
        ]
      }
    ],
    handoffs: [
      {
        id: 'H-101',
        taskId: 'sec-phase1',
        fromId: 'muse',
        toId: 'site-agent',
        state: 'accepted',
        idempotencyKey: 'msg-m1-sec',
        minutesInState: 14,
        slaMinutes: 30,
        summaryAr: 'توجيه بتنفيذ القائمة المصححة للمرحلة 1 الأمنية وربط PR #94.',
        summaryEn: 'Instruction to execute Security Phase 1 and link PR #94.'
      },
      {
        id: 'H-102',
        taskId: 'F-24',
        fromId: 'nabd-coder',
        toId: 'muse',
        state: 'completed',
        idempotencyKey: 'commit-98badfc',
        minutesInState: 5,
        slaMinutes: 15,
        summaryAr: 'حزمة أدلة F-24 مكتملة مع تقرير الفحوصات.',
        summaryEn: 'F-24 evidence bundle complete with verification logs.'
      }
    ],
    seenKeys: ['msg-m1-sec', 'commit-98badfc'],
    auditEvents: [
      {
        id: 'AUD-103',
        time: '21:33:45',
        type: 'ingest',
        actor: 'github:merge',
        msgAr: 'دمج PR #1 بنجاح وتحديث agents-state.json على الفرع الرئيسي.',
        msgEn: 'PR #1 merged successfully into main, updating agents-state.json.'
      },
      {
        id: 'AUD-102',
        time: '21:24:21',
        type: 'ingest',
        actor: 'agent:site-agent',
        msgAr: 'تحديث حالة وكيل الموقع إلى waiting (بانتظار مراجعة PR #1).',
        msgEn: 'Site agent state set to waiting for PR #1 review.'
      },
      {
        id: 'AUD-101',
        time: '20:56:00',
        type: 'ingest',
        actor: 'agent:muse',
        msgAr: 'تأسيس ملف الحالة المشترك وتكليف مهمة ربط الوكيلين باللوحة.',
        msgEn: 'Initialized shared state board and assigned agent board task.'
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
  try {
    const raw = localStorage.getItem('nabd_agents_state_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.agents) && Array.isArray(parsed.tasks)) {
        parsed.liveStatusState = 'cached';
        return Object.assign(createDefaultState(), parsed);
      }
    }
  } catch (e) {}
  return createDefaultState();
}

function saveState() {
  try {
    localStorage.setItem('nabd_agents_state_v1', JSON.stringify(state));
  } catch (e) {}
}

function t(key) {
  const dict = I18N[state.lang] || I18N.ar;
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : key), dict);
}

function isAr() {
  return state.lang === 'ar';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
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
    success: 'border-emerald-500/50 bg-emerald-950/95 text-emerald-100',
    warning: 'border-amber-500/50 bg-amber-950/95 text-amber-100',
    danger: 'border-rose-500/50 bg-rose-950/95 text-rose-100',
    info: 'border-cyan-500/50 bg-cyan-950/95 text-cyan-100'
  };
  const el = document.createElement('div');
  el.className = `rounded-xl border px-4 py-3 text-xs font-medium shadow-xl backdrop-blur-md transition-all ${colors[variant] || colors.info}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(isAr() ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard', 'info');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(isAr() ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard', 'info');
  } catch (e) {}
  ta.remove();
}

function normalizeAgentStatus(raw) {
  const val = String(raw || 'idle').toLowerCase().trim();
  if (val === 'waiting' || val === 'waiting_human' || val === 'needs_human') return 'waiting_human';
  if (val === 'working' || val === 'active' || val === 'running' || val === 'busy') return 'working';
  if (val === 'blocked' || val === 'error' || val === 'failed') return 'blocked';
  if (val === 'unresponsive' || val === 'offline' || val === 'stale') return 'unresponsive';
  return 'idle';
}

function minutesSinceIso(isoStr) {
  if (!isoStr) return 0;
  const ms = Date.parse(isoStr);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.round((Date.now() - ms) / 60000));
}

function computeFingerprint(data) {
  if (!data) return '';
  const handoffsSig = Array.isArray(data.tasks)
    ? data.tasks.map((t) => t.handoff ? (t.id + ':' + t.handoff.status + ':' + (t.handoff.decision?.at || '')) : '').join('|')
    : '';
  return `${data.updated_at || ''}::${data.agents ? data.agents.length : 0}::${data.tasks ? data.tasks.length : 0}::${data.messages ? data.messages.length : 0}::${handoffsSig}`;
}

function applyAgentHubJson(data, sourceLabel, silent = false) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON root object');
  }

  const rawAgents = Array.isArray(data.agents)
    ? data.agents
    : (data.agents && typeof data.agents === 'object'
      ? Object.entries(data.agents).map(([k, v]) => Object.assign({ id: k }, v))
      : []);

  const mappedAgents = rawAgents.map((a, idx) => {
    const id = String(a.id || a.agent_id || a.name || ('agent-' + (idx + 1)));
    const name = String(a.name || id);
    const role = String(a.role || a.description || 'AI Agent');
    const ttl = Number(a.ttl_minutes || a.ttl || 60);
    const lastSeenIso = a.last_seen || a.last_seen_at || a.updated_at || '';
    const mins = lastSeenIso ? minutesSinceIso(lastSeenIso) : 0;
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
    const prUrl = tk.pr_url || tk.pr || tk.url || tk.link || '';
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

// =========================================================================
// 4. SECRET REDACTOR ENGINE
// =========================================================================
function redactSecrets(text) {
  const patterns = [
    { name: 'OpenAI/API Key (sk-...)', regex: /\bsk-[A-Za-z0-9_-]{12,}\b/g },
    { name: 'GitHub Token (ghp_...)', regex: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g },
    { name: 'AWS Access Key (AKIA...)', regex: /\bAKIA[0-9A-Z]{12,}\b/g },
    { name: 'Bearer Token', regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/gi },
    { name: 'JWT Token', regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g }
  ];
  let redacted = text;
  const found = [];
  patterns.forEach((p) => {
    const matches = redacted.match(p.regex);
    if (matches && matches.length) {
      found.push(`${p.name} (×${matches.length})`);
      redacted = redacted.replace(p.regex, '[REDACTED]');
    }
  });
  return { redacted, found };
}

function getActiveAlerts() {
  const alerts = [];
  state.agents.forEach((a) => {
    if (a.status === 'unresponsive') {
      alerts.push({
        level: 'danger',
        titleAr: `وكيل غير متجاوب: ${a.name}`,
        titleEn: `Unresponsive Agent: ${a.name}`,
        descAr: `آخر نبضة منذ ${a.minutesAgo} دقيقة (تجاوز مهلة ${a.ttlMinutes} دقيقة).`,
        descEn: `Last heartbeat ${a.minutesAgo}m ago (exceeded ${a.ttlMinutes}m TTL).`,
        targetView: 'board'
      });
    } else if (a.status === 'waiting_human') {
      alerts.push({
        level: 'warning',
        titleAr: `طلب تدخل بشري: ${a.name}`,
        titleEn: `Human Decision Needed: ${a.name}`,
        descAr: `متوقف على المهمة ${a.activeTaskId || '—'} بانتظار موافقة أو قرار.`,
        descEn: `Paused on task ${a.activeTaskId || '—'} waiting for approval.`,
        targetView: 'board'
      });
    }
  });
  state.handoffs.forEach((h) => {
    if ((h.state === 'sent' || h.state === 'received') && h.minutesInState > h.slaMinutes) {
      alerts.push({
        level: 'danger',
        titleAr: `تسليم معلّق معرّض للضياع: ${h.id} (${h.taskId})`,
        titleEn: `Stalled Handoff at Risk: ${h.id} (${h.taskId})`,
        descAr: `بقي في حالة ${h.state} لمدة ${h.minutesInState} دقيقة دون قبول (المهلة ${h.slaMinutes} دقيقة).`,
        descEn: `Stuck in ${h.state} for ${h.minutesInState}m without acceptance (SLA ${h.slaMinutes}m).`,
        targetView: 'handoffs'
      });
    }
  });
  return alerts;
}

function stateBadge(status) {
  const styles = {
    working: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    idle: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    waiting_human: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blocked: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    unresponsive: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  };
  const dot = {
    working: 'bg-emerald-400 pulse-dot',
    idle: 'bg-sky-400',
    waiting_human: 'bg-amber-400',
    blocked: 'bg-orange-400',
    unresponsive: 'bg-rose-500',
    completed: 'bg-emerald-400'
  };
  const label = status === 'completed' ? (isAr() ? 'مكتملة' : 'Completed') : t('states.' + status);
  return `<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status] || styles.idle}">
    <span class="h-1.5 w-1.5 rounded-full ${dot[status] || 'bg-slate-400'}"></span>
    ${escapeHtml(label)}
  </span>`;
}

// =========================================================================
// 4.1 COORDINATION TOWER ENGINE («نبض | برج التنسيق»)
// =========================================================================
function isValidSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function formatWaitingDuration(minutes) {
  const m = Math.max(0, Number(minutes) || 0);
  if (m < 1) return isAr() ? 'الآن (أقل من دقيقة)' : 'Just now (<1m)';
  if (m === 1) return isAr() ? 'منذ دقيقة واحدة' : '1 minute ago';
  if (m === 2) return isAr() ? 'منذ دقيقتين' : '2 minutes ago';
  if (m < 11) return isAr() ? `منذ ${m} دقائق` : `${m} minutes ago`;
  if (m < 60) return isAr() ? `منذ ${m} دقيقة` : `${m} minutes ago`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (hours === 1) return isAr() ? `منذ ساعة${rem ? ' و' + rem + ' دقيقة' : ''}` : `1h ${rem ? rem + 'm' : ''} ago`;
  if (hours === 2) return isAr() ? `منذ ساعتين${rem ? ' و' + rem + ' دقيقة' : ''}` : `2h ${rem ? rem + 'm' : ''} ago`;
  if (hours < 24) return isAr() ? `منذ ${hours} ساعات${rem ? ' و' + rem + ' دقيقة' : ''}` : `${hours}h ${rem ? rem + 'm' : ''} ago`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return isAr() ? `منذ ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : 'أيام'}${remH ? ' و' + remH + ' س' : ''}` : `${days}d ago`;
}

function getCoordinationTowerItems(tasks, agents) {
  const activeTasks = (tasks || []).filter(
    (t) => t.status !== 'done' && t.status !== 'cancelled' && t.state !== 'completed' && t.rawStatus !== 'done' && t.rawStatus !== 'completed' && t.rawStatus !== 'cancelled'
  );

  const items = [];

  for (const task of activeTasks) {
    if (!task.handoff) continue;
    const h = task.handoff;
    const fromAgent = (agents || []).find((a) => a.id === h.from) || { id: h.from, name: h.from };
    const toAgent = (agents || []).find((a) => a.id === h.to) || { id: h.to, name: h.to };

    let actorId;
    let actorName;
    let actorRoleAr;
    let actorRoleEn;
    let waitTimestamp;
    let rank;
    let returnReason = null;

    if (h.status === 'returned') {
      rank = 1;
      actorId = h.from;
      actorName = fromAgent.name || h.from;
      actorRoleAr = 'المرسل (مطلوب تصحيح سبب الإعادة وإعادة التسليم)';
      actorRoleEn = 'Sender (Action needed to address return reason)';
      waitTimestamp = h.decision?.at || h.at;
      returnReason = h.decision?.reason || null;
    } else if (h.status === 'pending') {
      rank = 2;
      actorId = h.to;
      actorName = toAgent.name || h.to;
      actorRoleAr = 'المستلم (مطلوب مراجعة التسليم واتخاذ القرار)';
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

    const waitMs = Math.max(0, Date.now() - new Date(waitTimestamp).getTime());
    const waitMinutes = Number.isNaN(waitMs) ? 0 : Math.floor(waitMs / (1000 * 60));

    items.push({
      task,
      handoff: h,
      rank,
      actorId,
      actorName,
      actorRoleAr,
      actorRoleEn,
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
    return b.waitMinutes - a.waitMinutes;
  });

  return items;
}

function renderCoordinationTower() {
  const items = getCoordinationTowerItems(state.tasks, state.agents);

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
            <h3 class="text-sm font-bold text-emerald-200">
              ${escapeHtml(t('tower.emptyTitle'))}
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              ${escapeHtml(t('tower.emptyDesc'))}
            </p>
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
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-[11px] text-slate-400">⏱ ${escapeHtml(t('tower.waitingAgeLabel'))}: <strong class="text-slate-200">${formatWaitingDuration(item.waitMinutes)}</strong></span>
                </div>
              </div>

              <!-- Current Next Step Actor -->
              <div class="rounded-xl bg-surface-950/90 border border-slate-800/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-slate-400 font-medium">${escapeHtml(t('tower.actorLabel'))}:</span>
                  <strong class="text-white bg-surface-900 border border-slate-700 rounded-md px-2 py-0.5 font-bold">${escapeHtml(item.actorName)}</strong>
                  <span class="text-[11px] text-slate-400">(${escapeHtml(isAr() ? item.actorRoleAr : item.actorRoleEn)})</span>
                </div>
                <div class="text-[11px] font-mono text-slate-500">${escapeHtml(item.waitTimestamp || '')}</div>
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
                  ${item.evidenceUrl ? `
                    <a href="${escapeHtml(item.evidenceUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">
                      <span>📎 ${escapeHtml(t('tower.evidenceLabel'))}</span>
                      <span class="text-[10px]">↗</span>
                    </a>
                  ` : `<span class="text-[11px] text-slate-500">${isAr() ? 'لا يوجد رابط دليل مرفق' : 'No evidence link'}</span>`}
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

function openTaskDetailsModal(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const ownerAgent = state.agents.find((a) => a.id === task.ownerId) || { id: task.ownerId, name: task.ownerId, minutesAgo: 0, status: 'unknown' };
  const h = task.handoff;
  const isCached = state.liveStatusState === 'cached' || state.liveStatusState === 'offline';

  // Calculate wait duration if handoff exists
  let handoffWaitMins = 0;
  if (h && h.at) {
    const ts = (h.status === 'returned' && h.decision?.at) ? h.decision.at : h.at;
    const ms = Date.now() - new Date(ts).getTime();
    handoffWaitMins = Number.isNaN(ms) ? 0 : Math.max(0, Math.floor(ms / 60000));
  }

  // 1. Banner for Cache status (Requirement 4)
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

  // 2. Disambiguation between 3 Timestamps (Requirement 4)
  const disambiguationBoxes = `
    <div class="space-y-2">
      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">${isAr() ? 'فصل التواريخ الصريح (Timestamp Disambiguation)' : 'Timestamp Disambiguation'}</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <!-- Handoff Age -->
        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'عمر انتظار التسليم' : 'Handoff Waiting Age'}</div>
          <div class="font-mono font-bold mt-1 ${h ? (h.status === 'returned' ? 'text-rose-400' : 'text-amber-300') : 'text-slate-500'}">
            ${h ? formatWaitingDuration(handoffWaitMins) : (isAr() ? 'لا يوجد تسليم معلق' : 'No pending handoff')}
          </div>
          <div class="text-[10px] text-slate-500 truncate mt-0.5">${h ? (h.at || '—') : '—'}</div>
        </div>

        <!-- Agent Last Seen -->
        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'آخر ظهور للوكيل المالك' : 'Agent Last Seen'}</div>
          <div class="font-mono font-bold text-cyan-300 mt-1">
            ${formatWaitingDuration(ownerAgent.minutesAgo || 0)}
          </div>
          <div class="text-[10px] text-slate-500 truncate mt-0.5">${escapeHtml(ownerAgent.name)} (${escapeHtml(ownerAgent.status)})</div>
        </div>

        <!-- Data Fetch Age -->
        <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
          <div class="text-slate-400 text-[10px]">${isAr() ? 'توقيت جلب البيانات المعروضة' : 'Data Fetch Time'}</div>
          <div class="font-mono font-bold text-emerald-300 mt-1">
            ${state.liveLastSync || (isAr() ? 'ذاكرة أولية' : 'Initial Cache')}
          </div>
          <div class="text-[10px] text-slate-500 truncate mt-0.5">${isCached ? (isAr() ? 'مخزن محلياً' : 'Local Storage') : (isAr() ? 'جلب حي من GitHub' : 'Live GitHub Fetch')}</div>
        </div>
      </div>
    </div>
  `;

  // 3. Handoff receipt details
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

    const safeEvidence = isValidSafeUrl(h.evidence_url) ? h.evidence_url : null;

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

  // 4. Chronological Available Sequence (Requirement 4)
  const timelineEvents = [];

  // Initial task creation / update
  timelineEvents.push({
    at: task.updatedAt || '2026-11-19T21:00:00Z',
    type: 'task',
    icon: '📝',
    title: isAr() ? `تحديث المهمة: ${task.id}` : `Task updated: ${task.id}`,
    actor: ownerAgent.name,
    desc: isAr() ? (task.summaryAr || task.summaryEn) : (task.summaryEn || task.summaryAr)
  });

  // Matching messages
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

  // Handoff submission
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

  // Handoff decision
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

  // Sort chronologically by date
  timelineEvents.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const sequenceHtml = `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-white">${isAr() ? 'التسلسل المتاح (Available Sequence)' : 'Available Sequence'}</h4>
        <span class="font-mono text-[10px] text-slate-500">${timelineEvents.length} ${isAr() ? 'حدث متاح' : 'events'}</span>
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

  // 3.1 Quick Actions Bridge (Copy JSON Patch / GitHub Web Edit Link)
  const quickActionsHtml = `
    <div class="rounded-2xl border border-slate-800 bg-surface-950/90 p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-white">${isAr() ? 'إجراءات التنسيق السريعة (Action Quick-Bridge)' : 'Action Quick-Bridge'}</span>
          <span class="rounded bg-surface-900 border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">GitHub</span>
        </div>
        <a href="https://github.com/amiraq1/agent-hub/edit/main/agents-state.json" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
          <span>${isAr() ? 'تحرير agents-state.json على GitHub' : 'Edit on GitHub'}</span>
          <span class="text-[10px]">↗</span>
        </a>
      </div>
      <p class="text-[11px] text-slate-400 leading-relaxed">
        ${isAr()
          ? 'انسخ رقعة القرار الجاهزة بنقرة واحدة، ثم افتح رابط التحرير المباشر على GitHub لإتمام الاعتماد أو الإعادة بثوانٍ:'
          : 'Copy the decision JSON patch in one click, then edit agents-state.json directly on GitHub:'}
      </p>
      <div class="flex flex-wrap gap-2 pt-1">
        <button type="button" data-copy-patch="accept" class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition">
          <span>✓ ${isAr() ? 'نسخ كود الاعتماد (Accept JSON)' : 'Copy Accept JSON'}</span>
        </button>
        <button type="button" data-copy-patch="return" class="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 transition">
          <span>↩ ${isAr() ? 'نسخ كود الإعادة (Return JSON)' : 'Copy Return JSON'}</span>
        </button>
      </div>
    </div>
  `;

  openModal(
    `${task.id} — ${isAr() ? (task.titleAr || task.title) : (task.titleEn || task.title)}`,
    `
      <div class="space-y-4 text-xs">
        ${cacheBanner}
        ${disambiguationBoxes}
        ${handoffHtml}
        ${quickActionsHtml}
        ${sequenceHtml}
      </div>
    `
  );

  const modalBody = document.getElementById('appModalBody');
  if (modalBody) {
    modalBody.querySelectorAll('[data-copy-patch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-copy-patch');
        const nowIso = new Date().toISOString();
        let payload = {};
        if (mode === 'accept') {
          payload = {
            status: "done",
            handoff: {
              status: "accepted",
              decision: {
                by: "muse",
                at: nowIso,
                reason: "تمت مراجعة واعتماد المخرجات بنجاح والموافقة على الدمج."
              }
            }
          };
        } else {
          payload = {
            status: "in_progress",
            handoff: {
              status: "returned",
              decision: {
                by: "muse",
                at: nowIso,
                reason: "يرجى معالجة الملاحظات التالية وإعادة التسليم: [اكتب السبب هنا]"
              }
            }
          };
        }
        copyText(JSON.stringify(payload, null, 2));
        showToast(isAr() ? 'تم نسخ كود القرار (JSON) إلى الحافظة' : 'Copied decision JSON to clipboard', 'success');
      });
    });
  }
}

// =========================================================================
// 5. ZERO-DEPENDENCY NATIVE SVG BREAK-EVEN CHART (Instant Render)
// =========================================================================
function renderSvgBreakEven(containerEl) {
  if (!containerEl) return;
  const p = state.pricing;
  const maxX = Math.max(20, p.targetSubs + 5);
  const margin = Math.max(0.5, p.proPrice - p.varCost);
  const breakEvenX = p.fixedCost / margin;

  const w = 600;
  const h = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const maxRev = maxX * p.proPrice;
  const maxCost = p.fixedCost + maxX * p.varCost;
  const maxY = Math.ceil(Math.max(maxRev, maxCost) * 1.15 / 50) * 50;

  const scaleX = (x) => padLeft + (x / maxX) * chartW;
  const scaleY = (y) => padTop + chartH - (y / maxY) * chartH;

  // Revenue line & area
  const revPoints = [];
  const costPoints = [];
  for (let x = 0; x <= maxX; x += 1) {
    const rx = scaleX(x);
    const ry = scaleY(x * p.proPrice);
    const cy = scaleY(p.fixedCost + x * p.varCost);
    revPoints.push(`${rx.toFixed(1)},${ry.toFixed(1)}`);
    costPoints.push(`${rx.toFixed(1)},${cy.toFixed(1)}`);
  }

  const revPoly = `${padLeft},${scaleY(0)} ` + revPoints.join(' ') + ` ${scaleX(maxX)},${scaleY(0)}`;
  const beX = scaleX(breakEvenX);
  const beY = scaleY(breakEvenX * p.proPrice);

  const yTicks = [0, maxY / 2, maxY];
  const xTicks = [0, Math.round(maxX / 2), maxX];

  containerEl.innerHTML = `
    <div class="relative w-full overflow-hidden select-none">
      <svg viewBox="0 0 ${w} ${h}" class="w-full h-auto text-xs" style="max-height:260px;">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines & Y Labels -->
        ${yTicks.map(val => {
          const yPos = scaleY(val);
          return `
            <line x1="${padLeft}" y1="${yPos}" x2="${w - padRight}" y2="${yPos}" stroke="#334155" stroke-dasharray="2 3" opacity="0.4"/>
            <text x="${padLeft - 6}" y="${yPos + 4}" fill="#94a3b8" text-anchor="end" font-size="10" font-family="monospace">$${Math.round(val)}</text>
          `;
        }).join('')}

        <!-- X Labels -->
        ${xTicks.map(val => {
          const xPos = scaleX(val);
          return `
            <line x1="${xPos}" y1="${padTop}" x2="${xPos}" y2="${padTop + chartH}" stroke="#334155" stroke-dasharray="2 3" opacity="0.2"/>
            <text x="${xPos}" y="${h - 12}" fill="#94a3b8" text-anchor="middle" font-size="10" font-family="monospace">${val}</text>
          `;
        }).join('')}

        <!-- Revenue Area & Stroke -->
        <polygon points="${revPoly}" fill="url(#revGrad)" />
        <polyline points="${revPoints.join(' ')}" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Cost Line (Dashed) -->
        <polyline points="${costPoints.join(' ')}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>

        <!-- Break-even intersection point -->
        ${breakEvenX <= maxX ? `
          <circle cx="${beX.toFixed(1)}" cy="${beY.toFixed(1)}" r="5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
          <text x="${beX + 8}" y="${beY - 8}" fill="#34d399" font-size="10" font-weight="bold" font-family="sans-serif">${isAr() ? `نقطة التعادل (${Math.ceil(breakEvenX)})` : `Break-Even (${Math.ceil(breakEvenX)})`}</text>
        ` : ''}

        <!-- Axis Lines -->
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${w - padRight}" y2="${padTop + chartH}" stroke="#475569" stroke-width="1"/>
        <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="#475569" stroke-width="1"/>
      </svg>
      <div class="flex items-center justify-center gap-6 mt-2 text-xs">
        <span class="inline-flex items-center gap-1.5 text-emerald-300">
          <span class="w-3 h-0.5 bg-emerald-400"></span> ${isAr() ? 'الإيرادات ($)' : 'Revenue ($)'}
        </span>
        <span class="inline-flex items-center gap-1.5 text-rose-300">
          <span class="w-3 h-0.5 bg-rose-500 border-b border-dashed"></span> ${isAr() ? 'إجمالي التكاليف ($)' : 'Total Costs ($)'}
        </span>
      </div>
    </div>
  `;
}

// =========================================================================
// 6. VIEW RENDERERS
// =========================================================================
function filterItems() {
  const q = state.searchQuery.toLowerCase().trim();
  if (!q) {
    return {
      agents: state.agents,
      tasks: state.tasks,
      messages: state.liveMessages
    };
  }
  return {
    agents: state.agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      (a.roleAr && a.roleAr.toLowerCase().includes(q)) ||
      (a.roleEn && a.roleEn.toLowerCase().includes(q))
    ),
    tasks: state.tasks.filter(t =>
      t.id.toLowerCase().includes(q) ||
      (t.titleAr && t.titleAr.toLowerCase().includes(q)) ||
      (t.titleEn && t.titleEn.toLowerCase().includes(q)) ||
      t.ownerId.toLowerCase().includes(q)
    ),
    messages: state.liveMessages.filter(m =>
      m.from.toLowerCase().includes(q) ||
      m.to.toLowerCase().includes(q) ||
      m.text.toLowerCase().includes(q)
    )
  };
}

function renderOverview() {
  const alerts = getActiveAlerts();
  const completedHandoffs = state.handoffs.filter((h) => h.state === 'completed').length;
  const workingCount = state.agents.filter((a) => a.status === 'working' || a.status === 'idle').length;

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
            <button type="button" data-jump="pipeline" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-surface-900/90 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-400/60 hover:text-white transition">
              <span>${isAr() ? 'بوابة الأمن وحجب الأسرار' : 'Edge Secret Redaction'}</span>
            </button>
            <button type="button" data-jump="blueprint" class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-surface-900/90 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-400/60 hover:text-white transition">
              <span>${isAr() ? 'الخطة والمالية' : 'Blueprint & ROI'}</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-5">
          <div class="rounded-2xl border border-slate-800 bg-surface-950/90 p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${isAr() ? 'لقطة حية من مساحة العمل' : 'Live Snapshot'}</span>
              <span class="font-mono text-[11px] text-emerald-400">PWA: ACTIVE</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'الوكلاء النشطون' : 'Active Agents'}</div>
                <div class="mt-1 text-2xl font-extrabold text-white">${workingCount}<span class="text-sm text-slate-500">/${state.agents.length}</span></div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'تنبيهات نشطة' : 'Active Alerts'}</div>
                <div class="mt-1 text-2xl font-extrabold ${alerts.length ? 'text-rose-400' : 'text-emerald-400'}">${alerts.length}</div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'تسليمات مكتملة' : 'Completed'}</div>
                <div class="mt-1 text-2xl font-extrabold text-cyan-300">${completedHandoffs}</div>
              </div>
              <div class="rounded-xl bg-surface-900 p-3.5 border border-slate-800">
                <div class="text-[11px] text-slate-400">${isAr() ? 'نقطة التعادل (Pro)' : 'Break-Even (Pro)'}</div>
                <div class="mt-1 text-2xl font-extrabold text-emerald-400">6 <span class="text-xs font-normal text-slate-400">${isAr() ? 'مشتركين' : 'subs'}</span></div>
              </div>
            </div>
            <div class="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-slate-300">
              <div class="font-semibold text-emerald-300 mb-1">${isAr() ? 'دليل تسليم حقيقي مدمج: حزمة F-24' : 'Grounded Evidence: F-24 Bundle'}</div>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                ${isAr()
                  ? 'تم ربط حزمة nabd-f24-evidence.zip (فرع audit/reliability • 9/9 بوابات Clean Gate • 13 اختبار Mutation) كدليل حي في قسم المهام.'
                  : 'nabd-f24-evidence.zip (branch audit/reliability • 9/9 Clean Gate • 13 Mutation tests) attached in Tasks view.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4 Capabilities -->
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
          <h2 class="text-lg font-bold text-white">${isAr() ? 'القدرات الجوهرية وآلة الحالة' : 'Core Capabilities'}</h2>
          <span class="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">${isAr() ? 'مع نبض الوكلاء' : 'With Nabd'}</span>
        </div>
        <div class="space-y-3 text-sm">
          ${[
            ['board', isAr() ? '1. لوحة الحالة الخماسية (Status Board)' : '1. 5-State Status Board', isAr() ? 'working / idle / waiting_human / blocked / unresponsive تلقائيًا عند انقطاع النبض.' : '5 states with auto-unresponsive on TTL expiry.'],
            ['tasks', isAr() ? '2. قائمة مهام مشتركة بالأدلة (Artifacts)' : '2. Shared Tasks with Artifacts', isAr() ? 'كل مهمة لها وكيل مالك وروابط أدلة موثّقة (PR / Commit / فحص).' : 'Every task binds an owner agent with verifiable proof.'],
            ['handoffs', isAr() ? '3. سجل تسليم رباعي وكبح الحلقات' : '3. 4-State Handoff Ledger & Loop Guard', isAr() ? 'Sent → Received → Accepted → Completed مع كبح >5 تسليمات في 10 دقائق.' : 'Full lifecycle with loop freezing (>5 handoffs in 10 min).'],
            ['pipeline', isAr() ? '4. بوابة استقبال وحجب الأسرار' : '4. Edge Ingestion & Secret Scrubbing', isAr() ? 'توقيع HMAC، فحص SPF/DKIM، منع التكرار، وحجب الأسرار بـ [REDACTED].' : 'HMAC, SPF/DKIM, idempotency, and [REDACTED] scrubbing.']
          ].map(([jump, title, desc]) => `
            <button type="button" data-jump="${jump}" class="w-full text-start rounded-xl bg-surface-950/70 border border-slate-800/80 hover:border-emerald-500/40 p-3.5 transition group">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-emerald-300 text-xs">${title}</span>
                <span class="text-xs text-slate-500 group-hover:text-emerald-300">${isAr() ? 'فتح ←' : 'Open →'}</span>
              </div>
              <p class="mt-1 text-xs text-slate-400 leading-relaxed">${desc}</p>
            </button>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderBoard() {
  const { agents } = filterItems();
  const filters = ['all', 'working', 'idle', 'waiting_human', 'blocked', 'unresponsive'];
  const filtered = state.boardFilter === 'all'
    ? agents
    : agents.filter((a) => a.status === state.boardFilter);

  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'لوحة الحالة الخماسية (Status Board)' : '5-State Agent Status Board'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'راقب نبض كل وكيل، اختبر انقطاع المهلة، أو أضف وكيلًا جديدًا.' : 'Monitor heartbeats, test TTL watchdog, or register new agents.'}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button id="simulateTtlBtn" type="button" class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 transition">
          ${isAr() ? '⏱ محاكاة انقطاع نبضة (+35m)' : '⏱ Simulate TTL Expiry (+35m)'}
        </button>
        <button id="addAgentBtn" type="button" class="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition">
          ${isAr() ? '+ إضافة وكيل' : '+ Add Agent'}
        </button>
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
                <span class="font-mono font-semibold text-cyan-300">${escapeHtml(a.activeTaskId || '—')}</span>
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

            <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button type="button" data-heartbeat="${escapeHtml(a.id)}" class="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition">
                ♥ ${isAr() ? 'إرسال نبضة الآن' : 'Send Heartbeat'}
              </button>
              <select data-agent-state="${escapeHtml(a.id)}" class="rounded-lg bg-surface-950 border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-200 focus:border-emerald-400 focus:outline-none">
                ${['working', 'idle', 'waiting_human', 'blocked', 'unresponsive'].map((st) => `
                  <option value="${st}" ${a.status === st ? 'selected' : ''}>${escapeHtml(t('states.' + st))}</option>
                `).join('')}
              </select>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTasks() {
  const { tasks } = filterItems();
  return `
    ${renderCoordinationTower()}

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'قائمة المهام والأدلة الموثّقة' : 'Shared Tasks & Artifacts'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'لا تسليم بلا دليل: استعرض حزم الاختبارات أو PRs المرتبطة والتسلسل المتاح.' : 'No handoff without proof: inspect verified test bundles & available sequence.'}</p>
      </div>
      <button id="addTaskBtn" type="button" class="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition">
        ${isAr() ? '+ إضافة مهمة' : '+ New Task'}
      </button>
    </div>

    <div class="space-y-4 contain-opt">
      ${tasks.map((task) => {
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
                `).join('') : `<span class="text-[11px] text-slate-500">${isAr() ? 'لا توجد أدلة بعد' : 'No artifacts'}</span>`}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderHandoffs() {
  const stages = ['sent', 'received', 'accepted', 'completed'];
  const { messages } = filterItems();

  return `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'سجل التسليمات الرباعي وكبح الحلقات' : '4-State Handoff Ledger'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'Sent ← Received ← Accepted ← Completed، مع كبح الحلقات (>5 في 10 دقائق).' : 'Lifecycle tracking with loop freezing.'}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button id="simLoopGuardBtn" type="button" class="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition">
          ${isAr() ? '⚡ اختبار Loop Guard' : '⚡ Test Loop Guard'}
        </button>
        <button id="newHandoffBtn" type="button" class="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition">
          ${isAr() ? '+ تسجيل تسليم' : '+ New Handoff'}
        </button>
      </div>
    </div>

    <!-- Live Messages -->
    ${messages && messages.length ? `
      <div class="rounded-2xl glass-card border-cyan-500/30 p-5 space-y-3 contain-opt">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-cyan-200">${isAr() ? 'سجل الرسائل الحية (messages)' : 'Live Agent Messages'}</h2>
          <span class="font-mono text-[11px] text-cyan-300">${messages.length}</span>
        </div>
        <div class="space-y-2.5">
          ${messages.map((m) => `
            <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3.5 text-xs space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-emerald-300">${escapeHtml(m.from)}</span>
                  <span class="text-slate-500">${isAr() ? '←' : '→'}</span>
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

    <!-- Handoff Cards -->
    <div class="space-y-4 contain-opt">
      ${state.handoffs.map((h) => {
        const idx = stages.indexOf(h.state);
        const isStalled = (h.state === 'sent' || h.state === 'received') && h.minutesInState > h.slaMinutes;
        const nextState = idx < stages.length - 1 ? stages[idx + 1] : null;
        return `
          <div class="rounded-2xl glass-card p-5 space-y-4 ${isStalled ? 'border-rose-500/60 bg-rose-950/15' : ''}">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-bold text-emerald-300">${escapeHtml(h.id)}</span>
                <span class="rounded-md bg-surface-950 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-slate-800">${escapeHtml(h.taskId)}</span>
                <span class="text-xs text-slate-200 font-semibold">${escapeHtml(h.fromId)} ${isAr() ? '←' : '→'} ${escapeHtml(h.toId)}</span>
                ${isStalled ? `<span class="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">⚠ ${isAr() ? `معلّق (${h.minutesInState}m)` : `Stalled (${h.minutesInState}m)`}</span>` : ''}
              </div>
              <span class="font-mono text-[11px] text-slate-400">idempotency: ${escapeHtml(h.idempotencyKey)}</span>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(isAr() ? h.summaryAr : h.summaryEn)}</p>

            <div class="grid grid-cols-4 gap-1.5">
              ${stages.map((st, sIdx) => `
                <div class="space-y-1">
                  <div class="h-1.5 rounded-full ${sIdx <= idx ? (isStalled && sIdx === idx ? 'bg-rose-500' : 'bg-emerald-400') : 'bg-slate-800'}"></div>
                  <div class="text-[10px] ${sIdx <= idx ? 'text-slate-200 font-semibold' : 'text-slate-500'}">${escapeHtml(t('handoffStates.' + st))}</div>
                </div>
              `).join('')}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span class="text-[11px] text-slate-400">${isAr() ? `مهلة الاستلام: ${h.slaMinutes}m` : `SLA: ${h.slaMinutes}m`}</span>
              ${nextState ? `
                <button type="button" data-advance-handoff="${escapeHtml(h.id)}" class="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition">
                  ${isAr() ? `ترقية إلى: ${t('handoffStates.' + nextState)}` : `Advance to: ${t('handoffStates.' + nextState)}`}
                </button>
              ` : `<span class="text-xs font-semibold text-emerald-400">✓ ${isAr() ? 'مكتمل وموثّق' : 'Verified'}</span>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPipeline() {
  const defaultGithub = JSON.stringify({
    schema_version: '1.0',
    agent_id: 'muse',
    updated_at: '2026-11-19T21:00:00Z',
    status: 'working',
    ttl_minutes: 60,
    task: { id: 'sec-phase1', state: 'working' },
    handoff: {
      to_agent: 'site-agent',
      idempotency_key: 'key-9x882',
      summary: 'اختبار حجب سر: sk-live-9876543210abcdef123456 ومفتاح ghp_9xK2mP7qR4sT8vW1yZ3bN5cM'
    }
  }, null, 2);

  const defaultEmail = `To: agent_9x4k2m@inbound.nabdagents.dev
Subject: [task:sec-phase1][status:done][to:@muse]
SPF: PASS | DKIM: PASS
Message-ID: mail-msg-99102

Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

  const payloadValue = state.pipelineMode === 'github' ? defaultGithub : defaultEmail;

  return `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-white">${isAr() ? 'بوابة الاستقبال والأمن الدفاعي' : 'Defensive Edge Ingestion Pipeline'}</h1>
        <p class="text-xs text-slate-400 mt-1">${isAr() ? 'اختبر بوابات التحقق: التوقيع، عدم التكرار، حجب الأسرار، وآلة الحالة.' : 'Test verification gates: auth, idempotency, secret scrubbing, and state guard.'}</p>
      </div>

      <div class="grid lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 rounded-2xl glass-card p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex gap-2">
              <button type="button" data-pipe-mode="github" class="rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${state.pipelineMode === 'github' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-surface-950 text-slate-400'}">
                GitHub Payload
              </button>
              <button type="button" data-pipe-mode="email" class="rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${state.pipelineMode === 'email' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200' : 'border-slate-700 bg-surface-950 text-slate-400'}">
                Email Payload
              </button>
            </div>
            <label class="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input id="pipeValidSig" type="checkbox" checked class="rounded border-slate-600 bg-surface-950 text-emerald-500" />
              <span>Valid Signature (HMAC/SPF)</span>
            </label>
          </div>

          <textarea id="pipelineInput" rows="12" dir="ltr" class="w-full rounded-xl bg-surface-950 border border-slate-800 p-3.5 font-mono text-xs text-emerald-200 focus:border-emerald-400 focus:outline-none custom-scroll">${escapeHtml(payloadValue)}</textarea>

          <div class="flex flex-wrap items-center gap-2">
            <button id="runPipelineBtn" type="button" class="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition">
              ${isAr() ? '▶ تشغيل الفحص والتنقيح' : '▶ Run Edge Ingestion'}
            </button>
            <button id="copyPayloadBtn" type="button" class="rounded-xl border border-slate-700 bg-surface-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition">
              ${isAr() ? 'نسخ القالب' : 'Copy Template'}
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <div id="pipelineResultBox" class="rounded-2xl glass-card p-5 space-y-3">
            <h3 class="text-sm font-bold text-white">${isAr() ? 'نتيجة الفحص الفوري' : 'Ingestion Verdict'}</h3>
            <p class="text-xs text-slate-400">${isAr() ? 'اضغط «تشغيل الفحص» لاختبار حجب الأسرار التلقائي.' : 'Click Run Edge Ingestion to test automatic scrubbing.'}</p>
          </div>

          <div class="rounded-2xl glass-card p-5 space-y-3 contain-opt">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white">${isAr() ? 'سجل التدقيق (audit_events)' : 'Audit Events'}</h3>
              <span class="font-mono text-[10px] text-slate-400">${state.auditEvents.length} events</span>
            </div>
            <div class="space-y-2 max-h-56 overflow-y-auto custom-scroll pe-1">
              ${state.auditEvents.slice(0, 6).map((ev) => `
                <div class="rounded-lg bg-surface-950/80 border border-slate-800 p-2.5 text-[11px]">
                  <div class="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                    <span class="${ev.type === 'alert' ? 'text-rose-400' : ev.type === 'redact' ? 'text-amber-300' : 'text-emerald-400'}">${escapeHtml(ev.actor)}</span>
                    <span>${escapeHtml(ev.time)}</span>
                  </div>
                  <div class="text-slate-300 leading-relaxed">${escapeHtml(isAr() ? ev.msgAr : ev.msgEn)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBlueprint() {
  const p = state.pricing;
  const margin = Math.max(0.5, p.proPrice - p.varCost);
  const breakEvenExact = p.fixedCost / margin;
  const breakEvenSubs = Math.ceil(breakEvenExact);
  const monthlyProfit = (p.targetSubs * margin) - p.fixedCost;

  const tabs = [
    ['architecture', isAr() ? 'المعمارية وA2A' : 'Architecture & A2A'],
    ['pricing', isAr() ? 'الميزانية ونقطة التعادل' : 'Pricing & Break-Even'],
    ['competition', isAr() ? 'المنافسة 2026' : '2026 Landscape'],
    ['roadmap', isAr() ? 'خارطة الطريق' : 'Roadmap']
  ];

  let tabBody = '';
  if (state.blueprintTab === 'architecture') {
    tabBody = `
      <div class="grid lg:grid-cols-2 gap-6 contain-opt">
        <div class="rounded-2xl glass-card p-5 space-y-3">
          <h3 class="text-base font-bold text-white">${isAr() ? 'نموذج البيانات المتوافق مع A2A' : 'A2A-Aligned Data Model'}</h3>
          <div class="space-y-2 text-xs">
            ${[
              ['agents-state.json', 'Shared State Hub', isAr() ? 'مصدر الحقيقة الموحد: الوكلاء، الحالات، المهام، الرسائل، وتوقيت النبضات.' : 'Single source of truth: agents, states, tasks, messages, and heartbeats.'],
              ['agents', '↔ AgentCard', isAr() ? 'id فريد، الاسم، الدور، الحالة، TTL، وطريقة الربط بدون أسرار.' : 'Unique id, name, role, status, TTL, and secret-free config.'],
              ['tasks', '↔ Tasks & Evidence', isAr() ? 'معرّف المهمة، المالك، الحالة، وحقل artifacts لربط PRs ونتائج الفحوصات.' : 'Task id, owner, status, and verifiable artifacts links.'],
              ['messages', '↔ Async Ledger', isAr() ? 'رسائل وتوجيهات تسلسلية لحفظ سياق التنسيق والقرارات.' : 'Sequential async messaging preserving context and directives.']
            ].map(([tbl, map, desc]) => `
              <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-mono font-bold text-emerald-300">${tbl}</span>
                  <span class="font-mono text-[10px] text-cyan-300">${map}</span>
                </div>
                <p class="text-slate-400 leading-relaxed">${desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="rounded-2xl glass-card p-5 space-y-4">
          <h3 class="text-base font-bold text-white">${isAr() ? 'المكدس التقني فائق الخفة' : 'Ultra-Lightweight Tech Stack'}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Frontend</div>
              <div class="font-bold text-white mt-0.5">Vanilla ES Modules</div>
              <div class="text-[11px] text-emerald-400">Zero-Blocking &lt;15KB</div>
            </div>
            <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Hosting & PWA</div>
              <div class="font-bold text-white mt-0.5">GitHub Pages + SW</div>
              <div class="text-[11px] text-cyan-400">Offline Instant Paint</div>
            </div>
            <div class="rounded-xl bg-surface-950/80 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Validation (CI)</div>
              <div class="font-bold text-white mt-0.5">Node 22 GitHub Action</div>
              <div class="text-[11px] text-amber-300">Fast 9s Gates</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (state.blueprintTab === 'pricing') {
    tabBody = `
      <div class="grid lg:grid-cols-12 gap-6 contain-opt">
        <div class="lg:col-span-5 rounded-2xl glass-card p-5 space-y-5">
          <div>
            <h3 class="text-base font-bold text-white">${isAr() ? 'حاسبة نقطة التعادل التفاعلية' : 'Break-Even Calculator'}</h3>
            <p class="text-xs text-slate-400 mt-1">${isAr() ? 'التكاليف الثابتة $50/شهر، باقة Pro $10، تكلفة متغيرة $1.50.' : 'Fixed $50/mo, $10 Pro, $1.50 variable.'}</p>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">${isAr() ? 'التكاليف الثابتة الشهرية' : 'Monthly Fixed Costs'}</span>
                <span class="font-mono font-bold text-white">$${p.fixedCost}</span>
              </div>
              <input id="slFixed" type="range" min="15" max="150" step="5" value="${p.fixedCost}" class="w-full accent-emerald-500" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">${isAr() ? 'سعر باقة Pro الشهري' : 'Pro Plan Price'}</span>
                <span class="font-mono font-bold text-emerald-300">$${p.proPrice}</span>
              </div>
              <input id="slPrice" type="range" min="5" max="30" step="1" value="${p.proPrice}" class="w-full accent-emerald-500" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-slate-300">${isAr() ? 'عدد مشتركي Pro المستهدف' : 'Target Subscribers'}</span>
                <span class="font-mono font-bold text-cyan-300">${p.targetSubs}</span>
              </div>
              <input id="slSubs" type="range" min="1" max="100" step="1" value="${p.targetSubs}" class="w-full accent-cyan-400" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="rounded-xl bg-surface-950 border border-emerald-500/30 p-3.5">
              <div class="text-[11px] text-slate-400">${isAr() ? 'نقطة التعادل' : 'Break-Even'}</div>
              <div class="mt-1 text-2xl font-extrabold text-emerald-400">${breakEvenSubs} <span class="text-xs font-normal text-slate-400">subs</span></div>
            </div>
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-3.5">
              <div class="text-[11px] text-slate-400">${isAr() ? 'صافي الربح المتوقع' : 'Estimated Net'}</div>
              <div class="mt-1 text-2xl font-extrabold ${monthlyProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'}">${monthlyProfit >= 0 ? '+' : ''}$${monthlyProfit.toFixed(0)}</div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-7 space-y-4">
          <div class="rounded-2xl glass-card p-5">
            <h3 class="text-sm font-bold text-white mb-2">${isAr() ? 'منحنى الإيرادات مقابل التكاليف (SVG أصلي فوري)' : 'Revenue vs. Cost Curve (Native SVG)'}</h3>
            <div id="svgChartContainer"></div>
          </div>
        </div>
      </div>
    `;
  } else if (state.blueprintTab === 'competition') {
    tabBody = `
      <div class="rounded-2xl glass-card p-5 overflow-x-auto contain-opt">
        <h3 class="text-base font-bold text-white mb-4">${isAr() ? 'تحليل المنافسة والتميّز 2026' : '2026 Competitive Landscape'}</h3>
        <table class="w-full text-xs text-start border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400">
              <th class="py-2.5 pe-4 text-start">${isAr() ? 'المنافس' : 'Competitor'}</th>
              <th class="py-2.5 pe-4 text-start">${isAr() ? 'التركيز' : 'Focus'}</th>
              <th class="py-2.5 text-start">${isAr() ? 'لماذا نبض الوكلاء؟' : 'Why Nabd?'}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70">
            <tr>
              <td class="py-3 pe-4 font-bold text-white">GitHub Agent HQ</td>
              <td class="py-3 pe-4 text-slate-300">${isAr() ? 'وكلاء كود داخل GitHub فقط.' : 'GitHub coding agents only.'}</td>
              <td class="py-3 text-slate-400">${isAr() ? 'لا يربط وكلاء البريد أو السكربتات الخارجية.' : 'Ignores email & multi-platform agents.'}</td>
            </tr>
            <tr>
              <td class="py-3 pe-4 font-bold text-white">LangSmith / Langfuse</td>
              <td class="py-3 pe-4 text-slate-300">${isAr() ? 'مراقبة تقنية وتتبع (Traces).' : 'LLM observability & tracing.'}</td>
              <td class="py-3 text-slate-400">${isAr() ? 'أدوات هندسية وليست لوحة مهام وتسليمات يومية.' : 'Engineering telemetry, not a daily handoff board.'}</td>
            </tr>
            <tr>
              <td class="py-3 pe-4 font-bold text-white">Linear / Slack</td>
              <td class="py-3 pe-4 text-slate-300">${isAr() ? 'أدوات تواصل مصممة للبشر.' : 'Human-first tools.'}</td>
              <td class="py-3 text-slate-400">${isAr() ? 'الوكيل فيها ضيف ثانوي بلا فحص نبض أصلي.' : 'Agents are second-class guests without native heartbeat.'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
    tabBody = `
      <div class="grid md:grid-cols-4 gap-3 text-xs contain-opt">
        ${[
          ['0', isAr() ? 'التأسيس' : 'Phase 0: Setup', isAr() ? 'مستودع عام، لوحة حية، تحقق CI، ترخيص MIT، وقرار ADR-001 (مكتمل).' : 'Repo, Live Board, CI, MIT License, ADR-001 (Done).'],
          ['1', isAr() ? 'إثبات الحلقة' : 'Phase 1: Proof', isAr() ? 'تشغيل أسبوع كامل بوكيلين (Muse وموقعي) بلا تدخل يدوي.' : '1 week dogfooding with 2 agents with zero manual intervention.'],
          ['2', isAr() ? 'المهام والتسليمات' : 'Phase 2: Leases', isAr() ? 'حجز المهام لمنع التعارض، تسليمات بالأدلة، وانضمام وكيل البرمجة Nabd.' : 'Task leases, evidence-based handoffs, and Nabd agent integration.'],
          ['3', isAr() ? 'المنتج ومساحات العمل' : 'Phase 3: Product', isAr() ? 'مساحات عمل متعددة، API + CLI، والدفع بـ Stripe.' : 'Multi-workspace, API/CLI, and Stripe billing.']
        ].map(([ph, title, desc]) => `
          <div class="rounded-2xl glass-card p-4 space-y-2">
            <span class="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">P${ph}</span>
            <h4 class="font-bold text-white text-sm">${title}</h4>
            <p class="text-slate-400 leading-relaxed">${desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white">${isAr() ? 'المخطط التنفيذي وخارطة الطريق' : 'Product Blueprint & Economics'}</h1>
          <p class="text-xs text-slate-400 mt-1">${isAr() ? 'خطة نبض الوكلاء المعتمدة (2026-11-19).' : 'Approved Nabd Agents Roadmap.'}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 rounded-xl bg-surface-900 p-1 border border-slate-800">
          ${tabs.map(([id, label]) => `
            <button type="button" data-bp-tab="${id}" class="rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              state.blueprintTab === id ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }">${label}</button>
          `).join('')}
        </div>
      </div>
      ${tabBody}
    </div>
  `;
}

// =========================================================================
// 7. MODALS & DRAWERS
// =========================================================================
function openModal(title, htmlBody) {
  const tEl = document.getElementById('appModalTitle');
  const bEl = document.getElementById('appModalBody');
  const modal = document.getElementById('appModal');
  if (!modal || !tEl || !bEl) return;
  tEl.textContent = title;
  bEl.innerHTML = htmlBody;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  const modal = document.getElementById('appModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function openAlertsDrawer() {
  const alerts = getActiveAlerts();
  const body = document.getElementById('alertsContent');
  const modal = document.getElementById('alertsModal');
  if (!body || !modal) return;

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
      modal.classList.add('hidden');
      renderApp();
    });
  });
  modal.classList.remove('hidden');
}

// =========================================================================
// 8. MAIN RENDERER & EVENT BINDINGS
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
    else if (state.view === 'pipeline') main.innerHTML = renderPipeline();
    else main.innerHTML = renderBlueprint();
  }

  bindViewEvents();

  if (state.view === 'blueprint' && state.blueprintTab === 'pricing') {
    renderSvgBreakEven(document.getElementById('svgChartContainer'));
  }

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

  document.querySelectorAll('[data-agent-state]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = sel.getAttribute('data-agent-state');
      const ag = state.agents.find((a) => a.id === id);
      if (!ag) return;
      ag.status = sel.value;
      addAudit(sel.value === 'waiting_human' || sel.value === 'unresponsive' ? 'alert' : 'ingest', `state:${ag.name}`, `تغيير حالة ${ag.name} إلى ${t('states.' + sel.value)}.`, `Changed ${ag.name} state to ${sel.value}.`);
      showToast(isAr() ? `تم تغيير حالة ${ag.name}` : `Updated ${ag.name} state`, 'info');
      renderApp();
    });
  });

  const simTtlBtn = document.getElementById('simulateTtlBtn');
  if (simTtlBtn) {
    simTtlBtn.addEventListener('click', () => {
      let flipped = 0;
      state.agents.forEach((a) => {
        a.minutesAgo += 35;
        if (a.status === 'working' && a.minutesAgo > a.ttlMinutes) {
          a.status = 'unresponsive';
          flipped++;
          addAudit('alert', 'system:ttl-watchdog', `تجاوز الوكيل ${a.name} مهلة النبض (${a.ttlMinutes}m) ← unresponsive.`, `Agent ${a.name} exceeded ${a.ttlMinutes}m TTL.`);
        }
      });
      showToast(
        flipped
          ? (isAr() ? `رصد النظام ${flipped} وكيلًا غير متجاوب!` : `Detected ${flipped} unresponsive agent(s)!`)
          : (isAr() ? 'تقدّم الزمن +35 دقيقة.' : 'Advanced clock +35m.'),
        flipped ? 'danger' : 'info'
      );
      renderApp();
    });
  }

  // Inspect Task Modal
  document.querySelectorAll('[data-inspect-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tid = btn.getAttribute('data-inspect-task');
      const idx = Number(btn.getAttribute('data-inspect-idx'));
      const task = state.tasks.find((x) => x.id === tid);
      if (!task || !task.artifacts[idx]) return;
      const art = task.artifacts[idx];
      openModal(`${task.id} — ${art.label}`, `
        <div class="space-y-3 text-xs">
          <div class="grid sm:grid-cols-3 gap-2">
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Checks</div>
              <div class="font-mono font-bold text-emerald-400 mt-0.5">${escapeHtml(art.checks)}</div>
            </div>
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Branch</div>
              <div class="font-mono text-cyan-300 mt-0.5">${escapeHtml(art.branch || 'main')}</div>
            </div>
            <div class="rounded-xl bg-surface-950 border border-slate-800 p-3">
              <div class="text-slate-400 text-[10px]">Commit</div>
              <div class="font-mono text-slate-200 truncate mt-0.5">${escapeHtml(art.commit || '—')}</div>
            </div>
          </div>
          ${art.url ? `<a href="${escapeHtml(art.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 transition">↗ ${isAr() ? 'فتح الرابط على GitHub' : 'Open on GitHub'}</a>` : ''}
          <pre dir="ltr" class="rounded-xl bg-surface-950 border border-slate-800 p-4 text-[11px] text-emerald-200 overflow-x-auto custom-scroll whitespace-pre-wrap leading-relaxed">${escapeHtml(art.details)}</pre>
        </div>
      `);
    });
  });

  // Open Task Details & Epistemic Honesty Sequence Modal
  document.querySelectorAll('[data-open-task-details]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tid = btn.getAttribute('data-open-task-details');
      openTaskDetailsModal(tid);
    });
  });

  // Advance Handoff
  document.querySelectorAll('[data-advance-handoff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-advance-handoff');
      const h = state.handoffs.find((x) => x.id === id);
      if (!h) return;
      const stages = ['sent', 'received', 'accepted', 'completed'];
      const idx = stages.indexOf(h.state);
      if (idx < stages.length - 1) {
        h.state = stages[idx + 1];
        h.minutesInState = 0;
        addAudit('ingest', `handoff:${h.id}`, `ترقية التسليم ${h.id} إلى ${t('handoffStates.' + h.state)}.`, `Advanced handoff ${h.id} to ${h.state}.`);
        showToast(isAr() ? `تمت الترقية إلى ${t('handoffStates.' + h.state)}` : `Advanced to ${h.state}`, 'success');
        renderApp();
      }
    });
  });

  // Loop guard simulator
  const simLoopBtn = document.getElementById('simLoopGuardBtn');
  if (simLoopBtn) {
    simLoopBtn.addEventListener('click', () => {
      const ag = state.agents.find((a) => a.id === 'site-agent') || state.agents[0];
      if (ag) ag.status = 'waiting_human';
      addAudit('alert', 'system:loop-guard', 'رصد حلقة تسليم متكررة (>5 في 10 دقائق) ← تجميد المهمة وتحويل الحالة إلى waiting_human.', 'Loop Guard triggered (>5 handoffs in 10m) → moved to waiting_human.');
      showToast(isAr() ? '⚡ تم تفعيل Loop Guard وتجميد الحالة إلى waiting_human!' : '⚡ Loop Guard triggered: frozen to waiting_human!', 'danger');
      renderApp();
    });
  }

  // Pipeline execution
  document.querySelectorAll('[data-pipe-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pipelineMode = btn.getAttribute('data-pipe-mode');
      renderApp();
    });
  });

  const runPipelineBtn = document.getElementById('runPipelineBtn');
  if (runPipelineBtn) {
    runPipelineBtn.addEventListener('click', () => {
      const input = document.getElementById('pipelineInput').value;
      const validSig = document.getElementById('pipeValidSig').checked;
      const resultBox = document.getElementById('pipelineResultBox');

      if (!validSig) {
        addAudit('alert', 'edge:auth-gate', 'رفض طلب وارد: فشل التحقق من التوقيع (401 Unauthorized).', 'Rejected inbound: failed signature (401 Unauthorized).');
        resultBox.innerHTML = `
          <div class="rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-xs space-y-1.5">
            <div class="font-bold text-rose-300">✕ GATE 01 BLOCKED — 401 Unauthorized</div>
            <p class="text-slate-300">${isAr() ? 'تم رفض الحدث بسبب فشل التوقيع.' : 'Blocked due to failed signature.'}</p>
          </div>
        `;
        showToast(isAr() ? 'رفضت البوابة الحدث: توقيع غير صالح' : 'Blocked: invalid signature', 'danger');
        saveState();
        return;
      }

      const { redacted, found } = redactSecrets(input);
      addAudit('redact', 'edge:secret-redactor', `حجب أسرار: ${found.length ? found.join(', ') : 'لا توجد'} قبل الحفظ.`, `Sanitized secrets: ${found.length ? found.join(', ') : 'none'}.`);

      resultBox.innerHTML = `
        <div class="space-y-3 text-xs">
          <div class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
            <div class="font-bold text-emerald-300">✓ PASSED ALL 4 EDGE GATES (201 OK)</div>
            <div class="mt-1 text-slate-300">
              ${isAr() ? 'الأسرار المحجوبة:' : 'Redacted:'} <strong>${found.length ? escapeHtml(found.join(', ')) : (isAr() ? 'لا توجد' : 'None')}</strong>
            </div>
          </div>
          <pre dir="ltr" class="rounded-xl bg-surface-950 border border-slate-800 p-3 text-[11px] text-amber-200 max-h-44 overflow-auto custom-scroll whitespace-pre-wrap">${escapeHtml(redacted)}</pre>
        </div>
      `;
      showToast(isAr() ? 'اجتاز الفحص بنجاح وحُجبت الأسرار' : 'Passed and secrets scrubbed', 'success');
      saveState();
    });
  }

  // Blueprint Tabs
  document.querySelectorAll('[data-bp-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.blueprintTab = btn.getAttribute('data-bp-tab');
      renderApp();
    });
  });

  // Sliders
  const bindSlider = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state.pricing[key] = parseInt(el.value, 10);
      renderApp();
    });
  };
  bindSlider('slFixed', 'fixedCost');
  bindSlider('slPrice', 'proPrice');
  bindSlider('slSubs', 'targetSubs');
}

// =========================================================================
// 9. GLOBAL LISTENERS & KEYBOARD SHORTCUTS
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

  document.getElementById('alertsBtn')?.addEventListener('click', openAlertsDrawer);
  document.getElementById('closeAlertsBtn')?.addEventListener('click', () => {
    document.getElementById('alertsModal')?.classList.add('hidden');
  });
  document.getElementById('alertsBackdrop')?.addEventListener('click', () => {
    document.getElementById('alertsModal')?.classList.add('hidden');
  });

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

  // Keyboard Shortcuts: [ / ] search, [ R ] refresh, [ 1-6 ] views, [ Esc ] close
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') {
        e.target.blur();
        closeModal();
        document.getElementById('alertsModal')?.classList.add('hidden');
      }
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
    } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      const views = ['overview', 'board', 'tasks', 'handoffs', 'pipeline', 'blueprint'];
      const targetView = views[parseInt(e.key, 10) - 1];
      if (targetView && state.view !== targetView) {
        state.view = targetView;
        renderApp();
      }
    } else if (e.key === 'Escape') {
      closeModal();
      document.getElementById('alertsModal')?.classList.add('hidden');
      const s = document.getElementById('globalSearchInput');
      if (s && s.value) {
        s.value = '';
        state.searchQuery = '';
        renderApp();
      }
    }
  });

  // Tab Visibility API: pause polling when hidden, resume & refresh immediately on visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
      }
    } else if (document.visibilityState === 'visible') {
      fetchLiveAgentHub(true);
      if (state.autoRefresh && !autoRefreshTimer) {
        autoRefreshTimer = setInterval(() => fetchLiveAgentHub(true), 45000);
      }
    }
  });
}

// =========================================================================
// 10. BOOT & PWA SERVICE WORKER
// =========================================================================
function boot() {
  initGlobalListeners();
  
  // Instant First Paint from Cache (<16ms)
  renderApp();

  // Background SWR Revalidation
  fetchLiveAgentHub(true);

  if (state.autoRefresh) {
    autoRefreshTimer = setInterval(() => fetchLiveAgentHub(true), 45000);
  }

  // Register PWA Service Worker
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

boot();
