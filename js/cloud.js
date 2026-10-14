/* חשבוניה — חשבונות הורים וסנכרון התקדמות (Supabase)
   ההורה נרשם עם דוא"ל וסיסמה. ילדים לא נרשמים: ההורה יוצר להם פרופיל (שם פרטי, מגדר, דמות, קוד בן 4 ספרות).
   ההתקדמות נשמרת גם במכשיר (עבודה בלי אינטרנט) וגם בענן, ומסונכרנת כשיש חיבור. */
(function (HM) {
  'use strict';
  const CFG = {
    url: 'https://wgcpqdabjybddtwdheep.supabase.co',
    // מפתח ציבורי (anon) — בטוח לחשיפה; ההגנה על הנתונים היא ב-Row Level Security במסד
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY3BxZGFianliZGR0d2RoZWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTAxMzcsImV4cCI6MjEwNzU2NjEzN30.aWWJiNDErQGHNatlyV5DonQLQDUWc7eSSgZFM6J0zXE',
  };
  // גרסאות המסמכים שההורה מאשר בהרשמה (מתעדכנות כשהמסמכים משתנים)
  HM.LEGAL = { terms: '2026-10-14', privacy: '2026-10-14' };

  const cloud = { enabled: false, client: null, user: null, dirty: new Set(), timers: {}, listeners: [] };
  HM.cloud = cloud;

  cloud.init = function () {
    if (cloud.client) return true;
    if (!window.supabase || !window.supabase.createClient) return false;
    // אין טעם בחשבונות כשהקובץ נפתח מהמחשב (file://) — שם עובדים במצב מקומי
    if (location.protocol === 'file:') return false;
    try {
      cloud.client = window.supabase.createClient(CFG.url, CFG.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'heshboniya.auth', flowType: 'implicit' },
      });
      cloud.enabled = true;
      cloud.client.auth.onAuthStateChange((event, session) => {
        cloud.user = session ? session.user : null;
        cloud.listeners.forEach((fn) => { try { fn(event, session); } catch (e) { console.error(e); } });
      });
      window.addEventListener('online', () => cloud.flush());
    } catch (e) { console.error(e); return false; }
    return true;
  };
  cloud.onAuth = (fn) => cloud.listeners.push(fn);
  cloud.session = async function () {
    if (!cloud.client) return null;
    const { data } = await cloud.client.auth.getSession();
    cloud.user = data.session ? data.session.user : null;
    return data.session;
  };
  const redirect = () => location.origin + location.pathname;

  /* ---------- הודעות שגיאה בעברית ---------- */
  function heError(err) {
    const m = String((err && (err.message || err.error_description)) || err || '');
    if (/invalid login|invalid credentials/i.test(m)) return 'הדוא"ל או הסיסמה לא נכונים.';
    if (/email not confirmed/i.test(m)) return 'צריך קודם לאשר את כתובת הדוא"ל — חפשו את המייל ששלחנו (גם בתיקיית הספאם).';
    if (/already registered|already exists/i.test(m)) return 'כבר יש חשבון עם הדוא"ל הזה. אפשר להתחבר או לאפס סיסמה.';
    if (/password.*(6|8|short|weak)/i.test(m)) return 'הסיסמה קצרה או חלשה מדי. כדאי לפחות 8 תווים.';
    if (/rate limit|too many/i.test(m)) return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.';
    if (/invalid.*email|email.*invalid/i.test(m)) return 'כתובת הדוא"ל לא תקינה.';
    if (/failed to fetch|network/i.test(m)) return 'אין חיבור לאינטרנט כרגע.';
    if (/too many children/i.test(m)) return 'אפשר עד 8 ילדים בחשבון.';
    return 'משהו השתבש: ' + m;
  }
  cloud.heError = heError;

  /* ---------- חשבון הורה ---------- */
  cloud.signUp = async function ({ email, password, name }) {
    const { data, error } = await cloud.client.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirect(), data: { display_name: name || null, terms_version: HM.LEGAL.terms, privacy_version: HM.LEGAL.privacy } },
    });
    if (error) throw new Error(heError(error));
    return { needsConfirm: !data.session, user: data.user };
  };
  cloud.signIn = async function ({ email, password }) {
    const { data, error } = await cloud.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(heError(error));
    cloud.user = data.user;
    return data;
  };
  cloud.signOut = async function () { await cloud.flush(); await cloud.client.auth.signOut(); cloud.user = null; };
  cloud.sendReset = async function (email) {
    const { error } = await cloud.client.auth.resetPasswordForEmail(email, { redirectTo: redirect() });
    if (error) throw new Error(heError(error));
  };
  cloud.setPassword = async function (password) {
    const { error } = await cloud.client.auth.updateUser({ password });
    if (error) throw new Error(heError(error));
  };
  // שער הורים: אימות הסיסמה מחדש לפני ניהול המשפחה
  let gateUntil = 0;
  cloud.gateOpen = () => Date.now() < gateUntil;
  cloud.verifyPassword = async function (password) {
    const email = cloud.user && cloud.user.email;
    const { error } = await cloud.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(heError(error));
    gateUntil = Date.now() + 15 * 60 * 1000;
  };
  cloud.deleteAccount = async function () {
    const { error } = await cloud.client.rpc('delete_my_account');
    if (error) throw new Error(heError(error));
    await cloud.client.auth.signOut();
    cloud.user = null;
  };

  /* ---------- ילדים ---------- */
  const COLS = 'id,name,gender,avatar,pin_hash,data,updated_at';
  cloud.listChildren = async function () {
    const { data, error } = await cloud.client.from('children').select(COLS).order('created_at');
    if (error) throw new Error(heError(error));
    return data;
  };
  cloud.addChild = async function (row) {
    const { data, error } = await cloud.client.from('children').insert(row).select(COLS).single();
    if (error) throw new Error(heError(error));
    return data;
  };
  cloud.updateChild = async function (id, patch) {
    const { data, error } = await cloud.client.from('children').update(patch).eq('id', id).select('id,updated_at').single();
    if (error) throw new Error(heError(error));
    return data;
  };
  cloud.removeChild = async function (id) {
    const { error } = await cloud.client.from('children').delete().eq('id', id);
    if (error) throw new Error(heError(error));
  };

  /* ---------- סנכרון התקדמות ---------- */
  // הנתונים שנשמרים בענן: כל הפרופיל חוץ משדות מקומיים
  const LOCAL_ONLY = ['cloud', 'pinHash', 'syncedAt', 'dirty'];
  cloud.payload = (p) => { const o = {}; Object.keys(p).forEach((k) => { if (LOCAL_ONLY.indexOf(k) < 0) o[k] = p[k]; }); return o; };
  cloud.queue = function (p) {
    if (!cloud.enabled || !p || !p.cloud) return;
    cloud.dirty.add(p.id);
    clearTimeout(cloud.timers[p.id]);
    cloud.timers[p.id] = setTimeout(() => cloud.flush(), 1500);
  };
  let flushing = null;
  cloud.flush = async function () {
    if (!cloud.enabled || !cloud.user || !cloud.dirty.size || flushing) return flushing;
    if (navigator.onLine === false) return;
    flushing = (async () => {
      for (const id of Array.from(cloud.dirty)) {
        const p = HM.store.byId(id);
        if (!p || !p.cloud) { cloud.dirty.delete(id); continue; }
        try {
          await cloud.updateChild(id, { data: cloud.payload(p), name: p.name, gender: p.gender, avatar: p.avatar });
          cloud.dirty.delete(id);
          HM.store.markSynced(id);
        } catch (e) { console.warn('sync failed', e); break; }
      }
    })();
    try { await flushing; } finally { flushing = null; }
  };
  // משיכה מהענן ומיזוג עם המכשיר. מחזיר את רשימת פרופילי הילדים
  cloud.pull = async function () {
    const rows = await cloud.listChildren();
    const ids = HM.store.mergeFromCloud(rows);
    ids.pushBack.forEach((id) => cloud.dirty.add(id));
    if (ids.pushBack.length) cloud.flush();
    return rows;
  };

  /* ---------- קוד הילד (SHA-256, עם מזהה הילד כמלח) ---------- */
  cloud.hashPin = async function (childId, pin) {
    const text = 'heshboniya:' + childId + ':' + pin;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return sha256(text);
  };
  // גיבוי ל-SHA-256 כשאין crypto.subtle
  function sha256(ascii) {
    const r = (v, a) => (v >>> a) | (v << (32 - a));
    const bytes = new TextEncoder().encode(ascii); const words = []; const len = bytes.length * 8;
    const K = [], H = [];
    let pc = 0;
    for (let c = 2; pc < 64; c++) { let ok = true; for (let d = 2; d * d <= c; d++) if (c % d === 0) { ok = false; break; } if (ok) { if (pc < 8) H[pc] = (Math.pow(c, 1 / 2) * 4294967296) | 0; K[pc++] = (Math.pow(c, 1 / 3) * 4294967296) | 0; } }
    const b = Array.from(bytes); b.push(0x80); while (b.length % 64 !== 56) b.push(0);
    for (let i = 7; i >= 0; i--) b.push(i > 3 ? 0 : (len >>> (i * 8)) & 255);
    for (let i = 0; i < b.length; i += 4) words.push((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);
    for (let j = 0; j < words.length; j += 16) {
      const w = words.slice(j, j + 16); const h = H.slice(0);
      for (let i = 0; i < 64; i++) {
        if (i >= 16) { const w15 = w[i - 15], w2 = w[i - 2]; w[i] = (w[i - 16] + (r(w15, 7) ^ r(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (r(w2, 17) ^ r(w2, 19) ^ (w2 >>> 10))) | 0; }
        const t1 = h[7] + (r(h[4], 6) ^ r(h[4], 11) ^ r(h[4], 25)) + ((h[4] & h[5]) ^ (~h[4] & h[6])) + K[i] + w[i];
        const t2 = (r(h[0], 2) ^ r(h[0], 13) ^ r(h[0], 22)) + ((h[0] & h[1]) ^ (h[0] & h[2]) ^ (h[1] & h[2]));
        h.unshift((t1 + t2) | 0); h[4] = (h[4] + t1) | 0; h.pop();
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + h[i]) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  cloud._sha256 = sha256;
})(HM);
