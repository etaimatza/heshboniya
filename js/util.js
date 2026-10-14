/* חשבוניה — כלי עזר משותפים (ללא DOM, רץ גם ב-jsc לבדיקות) */
var HM = (typeof window !== 'undefined' ? (window.HM = window.HM || {}) : (this.HM = this.HM || {}));

(function (HM) {
  'use strict';
  // כיוון ושפה גם כשהעמוד נטען בלי עטיפת html משלו (למשל כ-Artifact)
  if (typeof document !== 'undefined' && document.documentElement) { document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'he'); }

  /* ---------- אקראיות ---------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sample = (arr, k) => shuffle(arr).slice(0, k);
  const chance = (p) => Math.random() < p;
  const range = (a, b, step = 1) => { const r = []; for (let x = a; step > 0 ? x <= b : x >= b; x += step) r.push(x); return r; };

  /* ---------- חשבון ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const round = (x, p = 6) => { const f = Math.pow(10, p); return Math.round((x + Number.EPSILON) * f) / f; };
  const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const primeFactors = (n) => { const f = []; let d = 2; while (n > 1) { while (n % d === 0) { f.push(d); n /= d; } d++; if (d * d > n && n > 1) { f.push(n); break; } } return f; };
  const divisors = (n) => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
  const roundTo = (n, unit) => Math.round(n / unit) * unit;
  const sum = (arr) => arr.reduce((s, x) => s + x, 0);
  const mean = (arr) => sum(arr) / arr.length;
  const mode = (arr) => { const c = {}; arr.forEach((x) => (c[x] = (c[x] || 0) + 1)); let best = null, bc = 0; Object.keys(c).forEach((k) => { if (c[k] > bc) { bc = c[k]; best = +k; } }); return best; };

  /* ---------- עיצוב מספרים ---------- */
  // מספר שלם עם פסיקים (125,000). עשרוני: מעגל ל-6 ספרות ומסיר אפסים מיותרים
  function fmt(x, opts) {
    if (x === null || x === undefined || x === '') return '';
    if (typeof x === 'string') return x;
    const o = opts || {};
    let v = round(x, o.places != null ? o.places : 6);
    const neg = v < 0; v = Math.abs(v);
    let [ip, dp] = String(v).split('.');
    if (String(v).indexOf('e') >= 0) { ip = v.toFixed(0); dp = ''; }
    if (o.fixed != null) { const s = v.toFixed(o.fixed).split('.'); ip = s[0]; dp = s[1] || ''; }
    const useSep = o.sep !== false && ip.length > 3;
    if (useSep) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + ip + (dp ? '.' + dp : '');
  }
  // מספר עשרוני מתוך שלם + מספר מקומות (dec(125,2) => "1.25") — בלי שגיאות נקודה צפה
  function dec(intVal, places, keepZeros) {
    const neg = intVal < 0; let s = String(Math.abs(intVal));
    if (!places) return (neg ? '-' : '') + fmt(Math.abs(intVal));
    while (s.length <= places) s = '0' + s;
    let ip = s.slice(0, s.length - places), dp = s.slice(s.length - places);
    if (!keepZeros) dp = dp.replace(/0+$/, '');
    ip = fmt(+ip);
    return (neg ? '-' : '') + ip + (dp ? '.' + dp : '');
  }

  /* ---------- HTML מתמטי ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ביטוי מתמטי משמאל לימין בתוך טקסט עברי
  const m = (s) => `<span class="math" dir="ltr">${s}</span>`;
  // שבר מוערם
  const frac = (n, d, cls) => `<span class="fr${cls ? ' ' + cls : ''}"><span class="fr-n">${n}</span><span class="fr-d">${d}</span></span>`;
  // מספר מעורב
  const mixed = (w, n, d) => (w ? `<span class="mixed"><span class="mx-w">${w}</span>${frac(n, d)}</span>` : frac(n, d));
  // שבר מקוצר לפי ערך: {n,d} או מספר מעורב אם גדול מ-1 (אופציונלי)
  function fracAuto(n, d, asMixed) {
    if (d === 1) return String(n);
    if (asMixed && n >= d) { const w = Math.floor(n / d), r = n % d; return r ? mixed(w, r, d) : String(w); }
    return frac(n, d);
  }
  // משבצת להשלמה בתוך תרגיל (המנוע ממלא אותה בזמן הקלדה)
  const slot = (i) => `<span class="slot" data-slot="${i || 0}"><span class="slot-v"></span></span>`;
  // משבצת סטטית עם סימן שאלה (לתצוגה בלבד)
  const box = (t) => `<span class="qbox">${t == null ? '?' : t}</span>`;
  const op = { times: '×', div: ':', minus: '−', plus: '+', eq: '=', neq: '≠', lt: '<', gt: '>' };
  // b("טקסט") — הדגשה
  const b = (s) => `<b>${s}</b>`;
  const hl = (s) => `<span class="hl">${s}</span>`;
  // מספר + שם עצם בעברית תקינה: cnt(1,'קטע','קטעים') => "קטע אחד", cnt(3,'קטע','קטעים') => "3 קטעים"
  // fem=true לשם עצם בנקבה (cnt(1,'עוגה','עוגות',true) => "עוגה אחת")
  const cnt = (n, sing, plur, fem) => (n === 1 ? `${sing} ${fem ? 'אחת' : 'אחד'}` : `${fmt(n)} ${plur}`);
  // מעלות בתוך טקסט עברי: deg(90) => "90°" בכיוון הנכון
  const deg = (n) => m(`${n}°`);
  // סדרת מספרים בכיוון הקריאה העברי (האיבר הראשון מימין). null => משבצת "?"
  const seq = (arr) => '<span class="seq">' + arr.map((x) => `<span class="seq-i">${x === null ? box() : x}</span>`).join('<span class="seq-c">,</span>') + '</span>';

  /* ---------- מספרים במילים (עברית, ספירה בנקבה, אלפים ומיליונים בזכר) ---------- */
  const F_UNITS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  const M_UNITS = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
  const F_TEENS = ['עשר', 'אחת-עשרה', 'שתים-עשרה', 'שלוש-עשרה', 'ארבע-עשרה', 'חמש-עשרה', 'שש-עשרה', 'שבע-עשרה', 'שמונה-עשרה', 'תשע-עשרה'];
  const M_TEENS = ['עשרה', 'אחד-עשר', 'שנים-עשר', 'שלושה-עשר', 'ארבעה-עשר', 'חמישה-עשר', 'שישה-עשר', 'שבעה-עשר', 'שמונה-עשר', 'תשעה-עשר'];
  const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
  const HUNDREDS = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות'];
  const THOUSANDS_1_10 = ['', 'אלף', 'אלפיים', 'שלושת אלפים', 'ארבעת אלפים', 'חמשת אלפים', 'ששת אלפים', 'שבעת אלפים', 'שמונת אלפים', 'תשעת אלפים', 'עשרת אלפים'];

  // מחזיר רשימת רכיבים למספר 1-999 (masc=זכר)
  function partsBelow1000(n, masc) {
    const parts = [];
    const h = Math.floor(n / 100), r = n % 100;
    if (h) parts.push(HUNDREDS[h]);
    if (r) {
      if (r < 10) parts.push(masc ? M_UNITS[r] : F_UNITS[r]);
      else if (r < 20) parts.push(masc ? M_TEENS[r - 10] : F_TEENS[r - 10]);
      else {
        const t = Math.floor(r / 10), u = r % 10;
        parts.push(TENS[t]);
        if (u) parts.push(masc ? M_UNITS[u] : F_UNITS[u]);
      }
    }
    return parts;
  }
  const joinVav = (parts) => parts.length <= 1 ? parts.join('') : parts.slice(0, -1).join(' ') + ' ו' + parts[parts.length - 1];

  function numToWords(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'אפס';
    const comps = [];
    const mil = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), rest = n % 1000;
    if (mil) {
      if (mil === 1) comps.push('מיליון');
      else if (mil === 2) comps.push('שני מיליון');
      else comps.push(joinVav(partsBelow1000(mil, true)) + ' מיליון');
    }
    if (th) {
      if (th <= 10) comps.push(THOUSANDS_1_10[th]);
      else comps.push(joinVav(partsBelow1000(th, true)) + ' אלף');
    }
    if (rest) partsBelow1000(rest, false).forEach((p) => comps.push(p));
    return joinVav(comps);
  }

  /* ---------- בחירות מספריות ---------- */
  // בונה 4 תשובות ייחודיות למספר: answer + מסיחים (פונקציות או ערכים)
  function numChoices(answer, distractors, count, format) {
    const f = format || ((x) => fmt(x));
    const seen = new Set([String(answer)]);
    const out = [answer];
    for (const d of distractors) {
      if (out.length >= (count || 4)) break;
      const v = typeof d === 'function' ? d() : d;
      if (v === undefined || v === null || (typeof v === 'number' && (!isFinite(v) || v < 0))) continue;
      if (seen.has(String(v))) continue;
      seen.add(String(v)); out.push(v);
    }
    let guard = 0;
    while (out.length < (count || 4) && guard++ < 60) {
      const delta = pick([1, 2, 10, 100, -1, -10, 5, -5]) * (Math.abs(answer) > 1000 ? 100 : 1);
      const v = typeof answer === 'number' ? round(answer + delta) : answer;
      if (v >= 0 && !seen.has(String(v))) { seen.add(String(v)); out.push(v); }
    }
    return { choices: out.map(f), answer: 0 };
  }

  /* ---------- שמות ותחומי עניין ---------- */
  HM.NAMES = {
    m: ['נועם', 'איתי', 'יואב', 'אורי', 'עומר', 'דניאל', 'אריאל', 'רועי', 'אלון', 'עידו', 'יהונתן', 'אביב', 'תומר', 'ליאם', 'עמית', 'אדם', 'נדב', 'יונתן', 'מאור', 'אלמוג'],
    f: ['נועה', 'מאיה', 'תמר', 'יעל', 'שירה', 'אביגיל', 'הילה', 'רוני', 'ליה', 'עלמה', 'אגם', 'מיכל', 'הדר', 'שקד', 'טליה', 'אלה', 'נגה', 'עדי', 'ליבי', 'אורין'],
  };

  HM.INTERESTS = [
    { id: 'sport', label: 'כדורגל וספורט', icon: 'ball' },
    { id: 'animals', label: 'בעלי חיים', icon: 'paw' },
    { id: 'space', label: 'חלל ומדע', icon: 'rocket' },
    { id: 'music', label: 'מוזיקה וריקוד', icon: 'note' },
    { id: 'baking', label: 'בישול ואפייה', icon: 'cake' },
    { id: 'games', label: 'משחקי מחשב', icon: 'pad' },
    { id: 'art', label: 'ציור ויצירה', icon: 'brush' },
    { id: 'nature', label: 'טיולים וטבע', icon: 'tree' },
    { id: 'reading', label: 'ספרים וסיפורים', icon: 'book' },
    { id: 'tech', label: 'רובוטים וטכנולוגיה', icon: 'bot' },
    { id: 'kpop', label: 'קיי-פופ', icon: 'mic' },
    { id: 'magic', label: 'הארי פוטר וקסמים', icon: 'wand' },
    { id: 'squishy', label: 'סקווישים', icon: 'squish' },
  ];
  // תחום עניין חדש שעדיין אין לו תרחיש בשיעור מסוים — נופלים לתחום קרוב
  HM.INTEREST_ALIAS = { kpop: ['music'], magic: ['reading', 'art'], squishy: ['art', 'games'] };

  /* ---------- הקשר אישי (מועבר לכל תוכן) ---------- */
  // profile: {name, gender:'m'|'f', interests:[]}
  function makeCtx(profile) {
    const p = profile || { name: 'חבר', gender: 'm', interests: [] };
    const gender = p.gender === 'f' ? 'f' : 'm';
    const g = (mWord, fWord) => (gender === 'f' ? fWord : mWord);
    const person = (name, gg) => ({ name, gender: gg, g: (a, bb) => (gg === 'f' ? bb : a) });
    const usedNames = new Set([p.name]);
    function friend(gg) {
      const gen = gg || (Math.random() < 0.5 ? 'm' : 'f');
      const pool = HM.NAMES[gen].filter((n) => !usedNames.has(n));
      const name = pick(pool.length ? pool : HM.NAMES[gen]);
      usedNames.add(name);
      return person(name, gen);
    }
    const interests = (p.interests && p.interests.length ? p.interests : []);
    const related = [].concat.apply([], interests.map((t) => (HM.INTEREST_ALIAS && HM.INTEREST_ALIAS[t]) || []));
    // בחירת תרחיש: מעדיף תרחישים שמתאימים לתחומי העניין של הילד/ה, ואם אין — לתחום קרוב
    function scene(list) {
      const fits = list.filter((s) => s.tags && s.tags.some((t) => interests.indexOf(t) >= 0));
      if (fits.length && Math.random() < 0.75) return pick(fits);
      const near = list.filter((s) => s.tags && s.tags.some((t) => related.indexOf(t) >= 0));
      if (!fits.length && near.length && Math.random() < 0.6) return pick(near);
      return pick(list);
    }
    return {
      name: p.name, gender, g, interests,
      me: person(p.name, gender),
      friend, friendM: () => friend('m'), friendF: () => friend('f'),
      // חבר/ה מאותו מגדר כמו הילד/ה (שימושי לדמויות בסיפורים)
      buddy: () => friend(gender),
      scene,
      rnd, pick, shuffle, sample, chance, range,
      m, frac, mixed, slot, box, fmt, dec, b, hl, seq, cnt, deg,
    };
  }

  Object.assign(HM, {
    rnd, pick, shuffle, sample, chance, range,
    gcd, lcm, round, isPrime, primeFactors, divisors, roundTo, sum, mean, mode,
    fmt, dec, esc, m, frac, mixed, fracAuto, slot, box, op, b, hl, seq, cnt, deg,
    numToWords, numChoices, makeCtx,
  });
})(HM);
