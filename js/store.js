/* חשבוניה — פרופילים, התקדמות, ערכות צבעים ותגים (נשמר מקומית בדפדפן) */
(function (HM) {
  'use strict';
  const KEY = 'heshboniya.v1';

  /* ---------- ערכות צבעים ---------- */
  HM.THEMES = {
    berry:  { name: 'פטל',      g: 'f', p: '#e23d7d', pd: '#b3245c', pl: '#ffdbe9', pll: '#fff2f7', s: '#8b5cf6', sd: '#6a3fd6', sl: '#ece4ff', a: '#ffbf1f', ad: '#d48c00', al: '#fff1cc', ink: '#3b1534', ink2: '#7a4d6e', ink3: '#b190a8', paper: '#fff7fa' },
    lilac:  { name: 'לילך',     g: 'f', p: '#8b5cf6', pd: '#6a3fd6', pl: '#ebe2ff', pll: '#f7f3ff', s: '#ec4899', sd: '#be2f77', sl: '#ffe0f0', a: '#ffc21a', ad: '#d48c00', al: '#fff3cc', ink: '#2b1a4d', ink2: '#5e4d82', ink3: '#a194bd', paper: '#faf7ff' },
    sunset: { name: 'שקיעה',    g: 'f', p: '#ff6b57', pd: '#d9473a', pl: '#ffe1dc', pll: '#fff4f2', s: '#d6409f', sd: '#a92a7b', sl: '#fde0f1', a: '#ffc21a', ad: '#d48c00', al: '#fff3cc', ink: '#3d1a1a', ink2: '#7c4f4a', ink3: '#b8958f', paper: '#fff8f5' },
    ocean:  { name: 'אוקיינוס', g: 'm', p: '#1f7ae0', pd: '#155bb0', pl: '#dcecff', pll: '#eef6ff', s: '#13b3a4', sd: '#0c877c', sl: '#d6f6f2', a: '#ffbb1a', ad: '#d48c00', al: '#fff1cf', ink: '#12304f', ink2: '#40597a', ink3: '#7d93ad', paper: '#f5f9ff' },
    space:  { name: 'חלל',      g: 'm', p: '#4f46e5', pd: '#3730b8', pl: '#e2e1ff', pll: '#f3f2ff', s: '#06b6d4', sd: '#0789a1', sl: '#d4f6fc', a: '#ffc21a', ad: '#d48c00', al: '#fff3cc', ink: '#1a1b45', ink2: '#4b4d7c', ink3: '#9294bd', paper: '#f6f6ff' },
    jungle: { name: "ג'ונגל",   g: 'm', p: '#16a34a', pd: '#0f7a37', pl: '#d9f5e3', pll: '#effbf3', s: '#f97316', sd: '#c2560b', sl: '#ffe8d6', a: '#ffc21a', ad: '#d48c00', al: '#fff3cc', ink: '#13321f', ink2: '#456b53', ink3: '#8fab99', paper: '#f6fcf7' },
  };
  HM.defaultTheme = (gender) => (gender === 'f' ? 'berry' : 'ocean');

  HM.applyTheme = function (id) {
    const t = HM.THEMES[id] || HM.THEMES.ocean;
    if (typeof document === 'undefined') return;
    const r = document.documentElement.style;
    const set = (k, v) => r.setProperty(k, v);
    set('--p', t.p); set('--p-d', t.pd); set('--p-l', t.pl); set('--p-ll', t.pll);
    set('--s', t.s); set('--s-d', t.sd); set('--s-l', t.sl);
    set('--a', t.a); set('--a-d', t.ad); set('--a-l', t.al);
    set('--ink', t.ink); set('--ink-2', t.ink2); set('--ink-3', t.ink3);
    set('--paper', t.paper);
    const rgb = hexToRgb(t.p);
    set('--shadow', `rgba(${rgb[0]},${rgb[1]},${rgb[2]},.32)`);
    const ink = hexToRgb(t.ink); set('--line', `rgba(${ink[0]},${ink[1]},${ink[2]},.08)`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.paper);
  };
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  HM.AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🦄', '🐙', '🐵', '🐶', '🐱', '🐰', '🦉', '🐧', '🐲', '🤖', '🐬', '🦖'];

  /* ---------- אחסון ---------- */
  let mem = null;
  function readRaw() {
    try { const s = window.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function writeRaw(data) {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  function db() {
    if (!mem) mem = readRaw() || { v: 1, profiles: {}, current: null };
    return mem;
  }
  function save() { writeRaw(db()); }

  const todayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

  function newProfile(data) {
    return {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      name: (data.name || '').trim() || 'חבר',
      gender: data.gender === 'f' ? 'f' : 'm',
      avatar: data.avatar || HM.AVATARS[0],
      theme: data.theme || HM.defaultTheme(data.gender),
      interests: data.interests || [],
      created: Date.now(),
      xp: 0, goal: 50,
      streak: { count: 0, best: 0, last: null },
      daily: { date: todayKey(), xp: 0 },
      lessons: {}, mistakes: [], badges: {},
      stats: { answered: 0, correct: 0, sessions: 0, perfects: 0, seconds: 0, sprintBest: 0, fixed: 0, learned: 0 },
      settings: { sound: true, tts: true },
    };
  }

  /* ---------- שליטה ואדפטיביות ----------
     ability: מיקום רציף 1.0–3.99 בכל נושא → רמת השאלה = floor(ability). עולה לאט עם הצלחות, יורד מהר עם טעויות.
     mastery: 0–100. כל רמה יכולה למלא את המד רק עד תקרה — כדי להגיע לרף (80) חייבים להצליח ברמה 3. */
  HM.MASTERY = { target: 80, caps: { 1: 45, 2: 75, 3: 100 }, gain: { 1: 9, 2: 10, 3: 11 }, loss: { 1: 10, 2: 7, 3: 5 }, up: 0.4, upRetry: 0.1, down: 0.6, stars: [30, 60, 80] };
  const starsOf = (m) => (m >= HM.MASTERY.stars[2] ? 3 : m >= HM.MASTERY.stars[1] ? 2 : m >= HM.MASTERY.stars[0] ? 1 : 0);
  const ensureL = (p, id) => p.lessons[id] || (p.lessons[id] = { stars: 0, mastery: 0, sessions: 0, ability: 1 });

  /* ---------- רמות ---------- */
  const levelNeed = (lvl) => 100 + 60 * (lvl - 1); // XP לעלייה מרמה lvl
  function levelOf(xp) {
    let lvl = 1, left = xp;
    while (left >= levelNeed(lvl)) { left -= levelNeed(lvl); lvl++; }
    return { level: lvl, into: left, need: levelNeed(lvl) };
  }
  const TITLES = [['צוער', 'צוערת'], ['חוקר מספרים', 'חוקרת מספרים'], ['בלש חשבון', 'בלשית חשבון'], ['אלוף שברים', 'אלופת שברים'], ['קוסם מספרים', 'קוסמת מספרים'], ['קפטן עשרוניים', 'קפטנית עשרוניים'], ['אדריכל צורות', 'אדריכלית צורות'], ['גאון חשבוניה', 'גאונת חשבוניה'], ['אגדה של חשבוניה', 'אגדה של חשבוניה']];
  const titleOf = (lvl, gender) => TITLES[Math.min(lvl, TITLES.length) - 1][gender === 'f' ? 1 : 0];

  /* ---------- תגים ---------- */
  const worldDone = (p, wid) => {
    const w = HM.WORLDS.find((x) => x.id === wid);
    const ids = []; w.units.forEach((u) => u.lessons.forEach((l) => { if (HM.hasContent(l.id)) ids.push(l.id); }));
    return ids.length > 0 && ids.every((id) => (p.lessons[id] && p.lessons[id].stars > 0));
  };
  const totalStars = (p) => Object.values(p.lessons).reduce((s, l) => s + (l.stars || 0), 0);
  HM.BADGES = [
    { id: 'first', glyph: 'first', color: '#59c3f5', name: () => 'צעד ראשון', desc: (g) => g('סיימת', 'סיימת') + ' תרגול ראשון', test: (p) => p.stats.sessions >= 1 },
    { id: 'perfect', glyph: 'perfect', color: '#ffc21a', name: () => 'מושלם!', desc: () => 'תרגול שלם בלי אף טעות', test: (p) => p.stats.perfects >= 1 },
    { id: 'learn5', glyph: 'book', color: '#b07cff', name: (g) => g('לומד סקרן', 'לומדת סקרנית'), desc: () => 'קריאת הסברים ב-5 נושאים', test: (p) => p.stats.learned >= 5 },
    { id: 'streak3', glyph: 'fire', color: '#ff8a3d', name: () => 'רצף של 3 ימים', desc: () => 'תרגול 3 ימים ברצף', test: (p) => p.streak.best >= 3 },
    { id: 'streak7', glyph: 'fire', color: '#f2545b', name: () => 'שבוע של אש', desc: () => 'תרגול 7 ימים ברצף', test: (p) => p.streak.best >= 7 },
    { id: 'c50', glyph: 'check', color: '#22b35e', name: () => '50 תשובות נכונות', desc: () => 'ממשיכים לצבור!', test: (p) => p.stats.correct >= 50 },
    { id: 'c250', glyph: 'check', color: '#13b3a4', name: () => '250 תשובות נכונות', desc: () => 'מקצוענות אמיתית', test: (p) => p.stats.correct >= 250 },
    { id: 'c1000', glyph: 'hundred', color: '#4f46e5', name: () => 'אלף תשובות!', desc: () => '1,000 תשובות נכונות', test: (p) => p.stats.correct >= 1000 },
    { id: 'stars30', glyph: 'perfect', color: '#ff7f9e', name: () => 'אספן כוכבים', desc: () => '30 כוכבים בנושאים', test: (p) => totalStars(p) >= 30 },
    { id: 'sprint15', glyph: 'bolt', color: '#ffb547', name: (g) => g('מהיר כברק', 'מהירה כברק'), desc: () => '15 תשובות באתגר המהיר', test: (p) => p.stats.sprintBest >= 15 },
    { id: 'fixer', glyph: 'redo', color: '#8fd85a', name: (g) => g('מתקן טעויות', 'מתקנת טעויות'), desc: () => 'תיקון 10 טעויות', test: (p) => p.stats.fixed >= 10 },
    { id: 'night', glyph: 'owl', color: '#5b5bd6', name: () => 'ינשוף לילה', desc: () => 'תרגול אחרי 20:00', test: (p, ctx) => ctx && ctx.hour >= 20 },
    { id: 'early', glyph: 'sun', color: '#ffd84d', name: () => 'ציפור בוקר', desc: () => 'תרגול לפני 8:00', test: (p, ctx) => ctx && ctx.hour < 8 },
    { id: 'w-naturals', glyph: 'city', color: '#ffb547', name: (g) => g('אזרח כבוד בעיר המספרים', 'אזרחית כבוד בעיר המספרים'), desc: () => 'כוכב בכל נושאי עיר המספרים', test: (p) => worldDone(p, 'naturals') },
    { id: 'w-fractions', glyph: 'pie', color: '#ff7f9e', name: (g) => g('אביר השברים', 'אבירת השברים'), desc: () => 'כוכב בכל נושאי ממלכת השברים', test: (p) => worldDone(p, 'fractions') },
    { id: 'w-decimals', glyph: 'planet', color: '#59c3f5', name: (g) => g('אסטרונאוט עשרוני', 'אסטרונאוטית עשרונית'), desc: () => 'כוכב בכל נושאי כוכב העשרוניים', test: (p) => worldDone(p, 'decimals') },
    { id: 'w-geometry', glyph: 'shapes', color: '#8fd85a', name: (g) => g('מגלה אי הצורות', 'מגלת אי הצורות'), desc: () => 'כוכב בכל נושאי אי הצורות', test: (p) => worldDone(p, 'geometry') },
    { id: 'level5', glyph: 'crown', color: '#ffc21a', name: () => 'רמה 5', desc: () => 'הגעה לרמה 5', test: (p) => levelOf(p.xp).level >= 5 },
  ];

  /* ---------- מיזוג בין מכשירים ---------- */
  const num = (x) => (typeof x === 'number' && isFinite(x) ? x : 0);
  // ממלא שדות חסרים מפרופיל ברירת מחדל (לנתונים ישנים או חלקיים מהענן)
  function withDefaults(p) {
    const d = newProfile({ name: p.name, gender: p.gender, avatar: p.avatar, theme: p.theme });
    const out = Object.assign({}, d, p);
    ['streak', 'daily', 'stats', 'settings'].forEach((k) => (out[k] = Object.assign({}, d[k], p[k] || {})));
    ['lessons', 'badges'].forEach((k) => (out[k] = Object.assign({}, p[k] || {})));
    out.mistakes = Array.isArray(p.mistakes) ? p.mistakes : [];
    return out;
  }
  function mergeProfiles(a, b) {
    const newer = num(a.updatedAt) >= num(b.updatedAt) ? a : b, older = newer === a ? b : a;
    const out = JSON.parse(JSON.stringify(newer));
    out.xp = Math.max(num(a.xp), num(b.xp));
    const sa = a.streak || {}, sb = b.streak || {};
    const later = (sa.last || '') >= (sb.last || '') ? sa : sb;
    out.streak = { count: num(later.count), best: Math.max(num(sa.best), num(sb.best)), last: later.last || null };
    const da = a.daily || {}, dbb = b.daily || {};
    out.daily = da.date === dbb.date ? { date: da.date, xp: Math.max(num(da.xp), num(dbb.xp)) } : ((da.date || '') > (dbb.date || '') ? da : dbb);
    out.lessons = {};
    const la = a.lessons || {}, lb = b.lessons || {};
    Object.keys(Object.assign({}, la, lb)).forEach((id) => {
      const x = la[id], y = lb[id];
      if (!x || !y) { out.lessons[id] = JSON.parse(JSON.stringify(x || y)); return; }
      const nx = num(x.lastAt || x.last) >= num(y.lastAt || y.last) ? x : y;
      const L = JSON.parse(JSON.stringify(nx));
      ['stars', 'sessions', 'q', 'c', 'c1', 'lastAt', 'last'].forEach((k) => { L[k] = Math.max(num(x[k]), num(y[k])); });
      L.mastery = Math.max(num(x.mastery), num(y.mastery));
      L.learned = !!(x.learned || y.learned);
      L.masteredAt = x.masteredAt && y.masteredAt ? Math.min(x.masteredAt, y.masteredAt) : (x.masteredAt || y.masteredAt || undefined);
      out.lessons[id] = L;
    });
    out.stats = Object.assign({}, older.stats || {}, newer.stats || {});
    Object.keys(out.stats).forEach((k) => { out.stats[k] = Math.max(num((a.stats || {})[k]), num((b.stats || {})[k])); });
    out.badges = {};
    [a.badges || {}, b.badges || {}].forEach((bg) => Object.keys(bg).forEach((k) => { out.badges[k] = out.badges[k] ? Math.min(out.badges[k], bg[k]) : bg[k]; }));
    out.days = {};
    [a.days || {}, b.days || {}].forEach((dd) => Object.keys(dd).forEach((k) => {
      const v = dd[k], o = out.days[k] || { q: 0, c: 0, sec: 0, s: 0 };
      out.days[k] = { q: Math.max(o.q, num(v.q)), c: Math.max(o.c, num(v.c)), sec: Math.max(o.sec, num(v.sec)), s: Math.max(o.s, num(v.s)) };
    }));
    const seenT = new Set();
    out.log = [].concat(a.log || [], b.log || []).filter((x) => x && !seenT.has(x.t) && seenT.add(x.t)).sort((x, y) => y.t - x.t).slice(0, 60);
    out.updatedAt = Math.max(num(a.updatedAt), num(b.updatedAt));
    return out;
  }
  HM.mergeProfiles = mergeProfiles;
  function fromRow(row) {
    const base = withDefaults(Object.assign({}, row.data || {}, { id: row.id }));
    base.id = row.id; base.cloud = true; base.pinHash = row.pin_hash || null;
    if (!row.data || !row.data.updatedAt) { base.name = row.name; base.gender = row.gender; base.avatar = row.avatar; base.theme = (row.data && row.data.theme) || HM.defaultTheme(row.gender); }
    if (!row.data || row.data.setupDone === undefined) base.setupDone = !!(row.data && row.data.created);
    base.syncedAt = Date.parse(row.updated_at) || Date.now();
    return base;
  }

  /* ---------- API ---------- */
  const store = {
    todayKey, levelOf, titleOf, levelNeed, totalStars,
    all() { return Object.values(db().profiles).sort((a, b) => a.created - b.created); },
    current() { const d = db(); if (store._peek && d.profiles[store._peek]) return d.profiles[store._peek]; return d.current && d.profiles[d.current] ? d.profiles[d.current] : null; },
    setCurrent(id) { db().current = id; save(); },
    create(data) { const p = newProfile(data); db().profiles[p.id] = p; db().current = p.id; save(); return p; },
    update(fn) { const p = store.current(); if (!p) return; fn(p); p.updatedAt = Date.now(); save(); if (p.cloud && HM.cloud) HM.cloud.queue(p); return p; },
    byId(id) { return db().profiles[id] || null; },
    // עדכון פרופיל שאינו הנוכחי (למשל מתוך ניהול המשפחה)
    updateById(id, fn) { const p = db().profiles[id]; if (!p) return; fn(p); p.updatedAt = Date.now(); save(); if (p.cloud && HM.cloud) HM.cloud.queue(p); return p; },
    markSynced(id) { const p = db().profiles[id]; if (p) { p.syncedAt = Date.now(); save(); } },
    localProfiles() { return store.all().filter((p) => !p.cloud); },
    cloudProfiles() { return store.all().filter((p) => p.cloud); },
    // מיזוג רשימת הילדים מהענן אל המכשיר
    mergeFromCloud(rows) {
      const d = db(), pushBack = [], seen = new Set();
      rows.forEach((row) => {
        seen.add(row.id);
        const remote = fromRow(row);
        const local = d.profiles[row.id];
        if (!local) { d.profiles[row.id] = remote; return; }
        const merged = mergeProfiles(withDefaults(local), remote);
        merged.id = row.id; merged.cloud = true; merged.pinHash = row.pin_hash || null; merged.syncedAt = remote.syncedAt;
        if (merged.setupDone === undefined) merged.setupDone = !!(local.setupDone || remote.setupDone);
        d.profiles[row.id] = merged;
        if (JSON.stringify(HM.cloud.payload(merged)) !== JSON.stringify(HM.cloud.payload(remote))) pushBack.push(row.id);
      });
      Object.keys(d.profiles).forEach((id) => { if (d.profiles[id].cloud && !seen.has(id)) { delete d.profiles[id]; if (d.current === id) d.current = null; } });
      save();
      return { pushBack };
    },
    addFromRow(row) { const p = fromRow(row); db().profiles[p.id] = p; save(); return p; },
    removeLocal(id) { const d = db(); delete d.profiles[id]; if (d.current === id) d.current = null; if (d.unlocked) delete d.unlocked[id]; save(); },
    // התנתקות: מוחקים מהמכשיר את כל פרופילי הענן של המשפחה
    clearCloud() { const d = db(); Object.keys(d.profiles).forEach((id) => { if (d.profiles[id].cloud) delete d.profiles[id]; }); if (d.current && !d.profiles[d.current]) d.current = null; d.unlocked = {}; save(); },
    // ילד שהזין קוד במכשיר הזה
    isUnlocked(id) { const d = db(); return !!(d.unlocked && d.unlocked[id]); },
    unlock(id) { const d = db(); d.unlocked = d.unlocked || {}; d.unlocked[id] = true; d.current = id; save(); },
    lockAll() { const d = db(); d.unlocked = {}; save(); },
    // צפייה זמנית בפרופיל אחר (אזור ההורים) בלי לשנות את הלומד הנוכחי
    peek(id) { store._peek = id || null; },
    remove(id) { const d = db(); delete d.profiles[id]; if (d.current === id) d.current = Object.keys(d.profiles)[0] || null; save(); },
    ctx() { return HM.makeCtx(store.current()); },
    lesson(id) { const p = store.current(); return (p && p.lessons[id]) || { stars: 0, mastery: 0, learned: false, sessions: 0, ability: 1 }; },
    starsOf,
    // רמת השאלה הבאה בנושא, לפי המיקום האדפטיבי
    levelFor(id) { const a = store.lesson(id).ability; return Math.max(1, Math.min(3, Math.floor(a || 1))); },
    ability(id) { return store.lesson(id).ability || 1; },
    // עדכון אחרי כל תשובה: מיקום הקושי + מד השליטה
    answer(id, level, ok, tries) {
      const M = HM.MASTERY; let L;
      store.update((p) => {
        L = ensureL(p, id);
        if (L.ability == null) L.ability = 1;
        L.ability = Math.round(Math.max(1, Math.min(3.99, L.ability + (ok ? (tries === 1 ? M.up : M.upRetry) : -M.down))) * 100) / 100;
        const cap = M.caps[level] || 100;
        if (ok) { if (L.mastery < cap) L.mastery = Math.min(cap, L.mastery + M.gain[level] * (tries === 1 ? 1 : 0.4)); }
        else L.mastery = Math.max(0, L.mastery - M.loss[level]);
        L.mastery = Math.round(L.mastery * 10) / 10;
        L.stars = Math.max(L.stars || 0, starsOf(L.mastery));
        if (L.mastery >= M.target && !L.masteredAt) L.masteredAt = Date.now();
        L.q = (L.q || 0) + 1; if (ok) L.c = (L.c || 0) + 1; if (ok && tries === 1) L.c1 = (L.c1 || 0) + 1;
        L.lastAt = Date.now();
      });
      return { mastery: L.mastery, level: Math.max(1, Math.min(3, Math.floor(L.ability))) };
    },
    markLearned(id) {
      store.update((p) => {
        const L = ensureL(p, id);
        if (!L.learned) { L.learned = true; p.stats.learned = (p.stats.learned || 0) + 1; }
      });
    },
    addMistake(lessonId, level) {
      store.update((p) => { p.mistakes.push({ l: lessonId, v: level || 1, t: Date.now() }); if (p.mistakes.length > 120) p.mistakes.shift(); });
    },
    fixMistake(lessonId) {
      store.update((p) => { const i = p.mistakes.findIndex((m) => m.l === lessonId); if (i >= 0) { p.mistakes.splice(i, 1); p.stats.fixed = (p.stats.fixed || 0) + 1; } });
    },
    mistakeCounts() { const p = store.current(); const c = {}; (p ? p.mistakes : []).forEach((m) => (c[m.l] = (c[m.l] || 0) + 1)); return c; },
    // סיום תרגול: results=[{ok:bool, tries:1|2, level}], mode: practice|review|mixed|sprint
    finishSession({ lessonId, mode, results, seconds, sprintScore }) {
      const out = { xp: 0, stars: 0, pct: 0, newBadges: [], levelUp: false, streakUp: false, newBest: false };
      const p = store.current(); if (!p) return out;
      const before = levelOf(p.xp).level;
      const n = results.length || 1;
      const score = results.reduce((s, r) => s + (r.ok ? (r.tries === 1 ? 1 : 0.5) : 0), 0);
      out.pct = score / n;
      out.correct = results.filter((r) => r.ok).length;
      out.n = results.length;
      out.firstTry = results.filter((r) => r.ok && r.tries === 1).length;
      results.forEach((r) => { out.xp += r.ok ? (r.tries === 1 ? 10 : 5) : 1; });
      if (mode === 'sprint') out.xp = (sprintScore || 0) * 4;
      else { out.xp += 10; if (out.pct === 1) out.xp += 20; }
      out.stars = 0;
      store.update((P) => {
        P.xp += out.xp;
        const t = todayKey();
        if (P.daily.date !== t) P.daily = { date: t, xp: 0 };
        P.daily.xp += out.xp;
        if (P.streak.last !== t) {
          const gap = P.streak.last ? dayDiff(P.streak.last, t) : 99;
          P.streak.count = gap === 1 ? P.streak.count + 1 : 1;
          P.streak.last = t; P.streak.best = Math.max(P.streak.best, P.streak.count);
          out.streakUp = true;
        }
        P.stats.sessions++; P.stats.answered += results.length; P.stats.correct += out.correct; P.stats.seconds += Math.round(seconds || 0);
        P.days = P.days || {};
        const dd = P.days[t] || (P.days[t] = { q: 0, c: 0, sec: 0, s: 0 });
        dd.q += results.length; dd.c += out.correct; dd.sec += Math.round(seconds || 0); dd.s += 1;
        const keys = Object.keys(P.days).sort(); while (keys.length > 120) delete P.days[keys.shift()];
        P.log = P.log || [];
        P.log.unshift({ t: Date.now(), l: lessonId || null, m: mode, n: results.length, c: out.correct, sec: Math.round(seconds || 0), ma: lessonId && P.lessons[lessonId] ? P.lessons[lessonId].mastery : null });
        if (P.log.length > 60) P.log.length = 60;
        if (mode !== 'sprint' && out.pct === 1 && results.length >= 5) P.stats.perfects++;
        if (mode === 'sprint') { if ((sprintScore || 0) > (P.stats.sprintBest || 0)) { P.stats.sprintBest = sprintScore; out.newBest = true; } }
        if (mode === 'practice' && lessonId) {
          const L = ensureL(P, lessonId);
          L.sessions = (L.sessions || 0) + 1;
          L.last = Date.now();
          out.stars = L.stars || 0;
          out.mastery = L.mastery || 0;
        }
        const ctx = { hour: new Date().getHours() };
        HM.BADGES.forEach((b) => { if (!P.badges[b.id] && b.test(P, ctx)) { P.badges[b.id] = Date.now(); out.newBadges.push(b); } });
      });
      out.levelUp = levelOf(store.current().xp).level > before;
      out.level = levelOf(store.current().xp);
      return out;
    },
    dailyXP() { const p = store.current(); if (!p) return 0; return p.daily.date === todayKey() ? p.daily.xp : 0; },
    streakAlive() { const p = store.current(); if (!p || !p.streak.last) return 0; const g = dayDiff(p.streak.last, todayKey()); return g <= 1 ? p.streak.count : 0; },
    // נושא הבא ללמידה: הראשון בלי כוכבים בעולם (או בכלל)
    nextLesson(worldId) {
      const ids = HM.LESSON_ORDER.filter((id) => HM.hasContent(id) && (!worldId || HM.LESSONS[id].world === worldId));
      return ids.find((id) => (store.lesson(id).mastery || 0) < HM.MASTERY.target) || ids[0] || null;
    },
    worldProgress(worldId) {
      const w = HM.WORLDS.find((x) => x.id === worldId); let tot = 0, got = 0;
      w.units.forEach((u) => u.lessons.forEach((l) => { tot += 3; got += store.lesson(l.id).stars || 0; }));
      return { pct: tot ? got / tot : 0, stars: got, max: tot };
    },
    exportJSON() { return JSON.stringify(db()); },
  };
  HM.store = store;
})(HM);
