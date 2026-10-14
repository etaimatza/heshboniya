/* חשבוניה — עיר המספרים: חקר נתונים
   שכיח ושכיחות, דיאגרמה כפולה וקריאה ביקורתית, הממוצע ותכונותיו, עבודת חקר */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { frac: F, m, b } = HM;

  /* ================= עזרים ================= */
  const SUM = HM.sum;
  const MX = (a) => Math.max(...a), MN = (a) => Math.min(...a);
  const plus = (a) => a.join(' + ');
  // ממוצע כמחרוזת מדויקת (שלם, חצאים, עשיריות) — עובדים בשלמים, בלי שגיאות נקודה צפה
  const meanStr = (s, n) => (s % n === 0 ? HM.fmt(s / n) : (s * 10) % n === 0 ? HM.dec((s * 10) / n, 1) : HM.dec(Math.round((s * 100) / n), 2));
  const meanNum = (s, n) => HM.round(s / n);
  const cmpAns = (x, y) => (Math.abs(x - y) < 1e-9 ? '=' : x < y ? '<' : '>');
  const signOf = (x, y) => ({ '=': ' = ', '<': ' &lt; ', '>': ' &gt; ' }[cmpAns(x, y)]);
  const andJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ו' + a[a.length - 1]);
  const andNums = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ו-' + a[a.length - 1]);
  const times = (n) => HM.cnt(n, 'פעם', 'פעמים', true);
  const chose = (n) => (n === 1 ? 'ילד אחד בחר' : `${n} ילדים בחרו`);
  const fr = (x, N) => { const g = HM.gcd(x, N); return F(x, N) + (g > 1 ? ' = ' + F(x / g, N / g) : ''); };
  const uniqMax = (f) => f.filter((x) => x === MX(f)).length === 1;
  const modeOf = (arr) => {
    const o = {}; arr.forEach((x) => (o[x] = (o[x] || 0) + 1));
    const best = MX(Object.values(o)), ks = Object.keys(o).filter((k) => o[k] === best);
    return ks.length === 1 && best > 1 ? +ks[0] : null;
  };
  const expand = (c, cats, f) => c.shuffle(cats.flatMap((x, i) => Array(f[i]).fill(x)));
  const NOLAB = '\u200f'; // תווית ריקה לקו הממוצע (התווית המובנית מסתירה את העמודה השמאלית)
  const niceStep = (v) => { const raw = Math.max(v, 1) / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), q = raw / p; return (q <= 1 ? 1 : q <= 2 ? 2 : q <= 5 ? 5 : 10) * p; };

  // k חברים שונים (בלי כפילויות שמות); withMe — הילד/ה הראשון/ה ברשימה
  function crew(c, k, withMe) {
    const out = withMe ? [c.me] : [], seen = new Set([c.name]);
    for (let guard = 0; out.length < k && guard < 200; guard++) { const f = c.friend(); if (!seen.has(f.name)) { seen.add(f.name); out.push(f); } }
    return out;
  }
  const allF = (ps) => ps.every((p) => p.gender === 'f');

  // k שכיחויות (לפחות lo) שסכומן total, עם מקסימום יחיד; distinct — כולן שונות
  function partition(c, k, total, lo, distinct) {
    lo = lo == null ? 1 : lo;
    for (let t = 0; t < 500; t++) {
      const f = Array(k).fill(lo), bag = [];
      for (let i = 0; i < k; i++) for (let j = c.rnd(1, 4); j > 0; j--) bag.push(i);
      for (let left = total - k * lo; left > 0; left--) f[c.pick(bag)]++;
      if (!uniqMax(f)) continue;
      if (distinct && new Set(f).size !== k) continue;
      return f;
    }
    const f = HM.range(1, k); f[k - 1] += total - SUM(f); return c.shuffle(f);
  }

  // n מספרים שלמים בטווח [lo,hi] שסכומם total (ולכן הממוצע total/n)
  function dataWithSum(c, n, total, lo, hi, test) {
    for (let t = 0; t < 800; t++) {
      const a = [];
      for (let i = 0; i < n - 1; i++) a.push(c.rnd(lo, hi));
      const last = total - SUM(a);
      if (last < lo || last > hi) continue;
      a.push(last);
      if (test && !test(a)) continue;
      return c.shuffle(a);
    }
    const base = Math.floor(total / n), a = Array(n).fill(base);
    for (let i = 0; i < total - base * n; i++) a[i]++;
    if (n > 1 && a[n - 1] > lo) { a[0] += 1; a[n - 1] -= 1; }
    return a;
  }
  // נתונים עם ממוצע שלם M (לא כולם שווים)
  const withMean = (c, n, M, lo, hi, test) => dataWithSum(c, n, n * M, lo, hi, (a) => new Set(a).size > 1 && (!test || test(a)));

  /* ---------- דיאגרמה כפולה / ציר שלא מתחיל ב-0 (מימין לשמאל, הציר מימין, כמו V.barChart) ---------- */
  // o: {labels, a, b?, names?:[A,B], min?, max?, step?, title?, values?, w?, h?}
  function chart2(o) {
    const n = o.labels.length, two = !!o.b;
    const w = o.w || 420, h = o.h || 300;
    const padT = (o.title ? 34 : 14) + (two ? 30 : 0), padB = 40, padR = 44, padL = 10;
    const lo = o.min || 0;
    const all = two ? o.a.concat(o.b) : o.a;
    const hiV = o.max != null ? o.max : MX(all) + 1;
    const step = o.step || niceStep(hiV - lo);
    const top = lo + Math.ceil((hiV - lo) / step) * step;
    const ch = h - padT - padB, cw = w - padL - padR;
    const Y = (v) => padT + ch - ((Math.max(v, lo) - lo) / (top - lo)) * ch;
    let s = '';
    if (o.title) s += S.text(w / 2, 17, o.title, { fs: 16, fw: 700 });
    for (let v = lo; v <= top + 1e-9; v += step) {
      s += S.line(padL, Y(v), w - padR, Y(v), { cls: 's-soft', sw: 1, dash: v > lo ? '4 4' : null });
      s += S.text(w - padR + 22, Y(v), HM.fmt(HM.round(v)), { fs: 13, cls: 't-mute' });
    }
    const slot = cw / n, bw = two ? Math.min(28, slot * 0.36) : Math.min(48, slot * 0.58);
    o.labels.forEach((lab, i) => {
      const cx = w - padR - slot * (i + 0.5);
      // הקבוצה הראשונה מימין (כיוון הקריאה)
      const bars = two ? [[o.a[i], cx, 'f-a'], [o.b[i], cx - bw, 'f-b']] : [[o.a[i], cx - bw / 2, 'f-a']];
      bars.forEach(([v, x, cl]) => {
        if (v > lo) s += S.rect(x, Y(v), bw, Y(lo) - Y(v), { cls: cl, rx: 4 });
        if (o.values) s += S.text(x + bw / 2, Y(v) - 10, HM.fmt(v), { fs: two ? 12 : 14, fw: 700 });
      });
      s += S.text(cx, h - padB + 20, lab, { fs: n > 5 ? 12 : 13, fw: 600 });
    });
    s += S.line(padL, Y(lo), w - padR, Y(lo), { sw: 2.5 });
    if (two) {
      const y = padT - 20, nm = o.names, tw = nm.map((t) => String(t).length * 8 + 6);
      const blockW = (k) => 20 + tw[k];
      let x = w / 2 + (blockW(0) + 22 + blockW(1)) / 2;
      [0, 1].forEach((k) => {
        s += S.rect(x - 14, y - 7, 14, 14, { cls: k ? 'f-b' : 'f-a', rx: 3 });
        s += S.text(x - 20 - tw[k] / 2, y + 1, nm[k], { fs: 14, fw: 700 });
        x -= blockW(k) + 22;
      });
    }
    return S.svg(w, h, s, { cls: 'vz-chart', label: o.title || 'דיאגרמת עמודות', maxw: o.maxw || w });
  }

  /* ---------- מגדלי קוביות (הממוצע כהשוואת עמודות) ---------- */
  // o: {labels, line: גובה הקו המקווקו — קוביות מעליו מודגשות, חורים מתחתיו מקווקווים}
  function towers(vals, o) {
    o = o || {};
    const cell = o.cell || 20, colW = cell + (o.labels ? 34 : 18), n = vals.length;
    const top = Math.max(MX(vals), o.line || 0);
    const w = n * colW, base = 10 + top * cell, h = base + (o.labels ? 30 : 8);
    let s = '';
    vals.forEach((v, i) => {
      const x = w - (i + 1) * colW + (colW - cell) / 2;
      for (let k = 0; k < Math.max(v, o.line || 0); k++) {
        const y = base - (k + 1) * cell;
        if (k < v) s += S.rect(x, y, cell, cell, { cls: (o.line != null && k >= o.line ? 'f-c' : 'f-a') + ' s-white', sw: 2, rx: 3 });
        else s += S.rect(x + 1, y + 1, cell - 2, cell - 2, { fill: 'none', cls: 's-soft', sw: 1.5, dash: '3 3', rx: 3 });
      }
      if (o.labels) s += S.text(x + cell / 2, base + 17, o.labels[i], { fs: 13, fw: 600 });
    });
    s += S.line(2, base, w - 2, base, { sw: 2 });
    if (o.line != null) s += S.line(2, base - o.line * cell, w - 2, base - o.line * cell, { cls: 's-b', sw: 2.5, dash: '7 5' });
    return S.svg(w, h, s, { label: 'מגדלי קוביות', maxw: Math.min(w * 1.15, 340) });
  }

  /* ================= תרחישים ================= */
  // סקרים (נתונים איכותיים)
  const SURVEYS = [
    { tags: ['sport'], title: 'ענף הספורט האהוב', ask: 'איזה ענף ספורט הכי אהוב עליכם?', head: 'ענף ספורט', which: 'איזה ענף ספורט', cats: ['כדורגל', 'כדורסל', 'שחייה', 'טניס', 'ריצה'] },
    { tags: ['animals'], title: 'חיית המחמד האהובה', ask: 'איזו חיית מחמד הייתם רוצים?', head: 'חיית מחמד', which: 'איזו חיית מחמד', cats: ['כלב', 'חתול', 'ארנב', 'דג', 'תוכי'] },
    { tags: ['space'], title: 'כוכב הלכת המעניין ביותר', ask: 'איזה כוכב לכת הכי מעניין אתכם?', head: 'כוכב לכת', which: 'איזה כוכב לכת', cats: ['מאדים', 'צדק', 'שבתאי', 'נוגה', 'נפטון'] },
    { tags: ['music'], title: 'כלי הנגינה האהוב', ask: 'על איזה כלי הייתם רוצים לנגן?', head: 'כלי נגינה', which: 'איזה כלי נגינה', cats: ['גיטרה', 'פסנתר', 'תופים', 'כינור', 'חליל'] },
    { tags: ['baking'], title: 'הקינוח האהוב', ask: 'איזה קינוח הכי טעים לכם?', head: 'קינוח', which: 'איזה קינוח', cats: ['עוגה', 'גלידה', 'פנקייק', 'עוגיות', 'פאי'] },
    { tags: ['games'], title: 'סוג המשחק האהוב', ask: 'איזה סוג של משחק מחשב אתם הכי אוהבים?', head: 'סוג משחק', which: 'איזה סוג משחק', cats: ['הרפתקאות', 'ספורט', 'חשיבה', 'בנייה', 'מרוצים'] },
    { tags: ['art'], title: 'הצבע האהוב', ask: 'מה הצבע האהוב עליכם?', head: 'צבע', which: 'איזה צבע', cats: ['כחול', 'אדום', 'ירוק', 'סגול', 'צהוב'] },
    { tags: ['nature'], title: 'יעד הטיול השנתי', ask: 'לאן הייתם רוצים לצאת לטיול השנתי?', head: 'יעד', which: 'איזה יעד', cats: ['ים', 'יער', 'מדבר', 'הרים', 'מערות'] },
    { tags: ['reading'], title: 'סוג הספר האהוב', ask: 'איזה סוג ספר אתם הכי אוהבים?', head: 'סוג ספר', which: 'איזה סוג ספר', cats: ['הרפתקאות', 'קומיקס', 'מדע', 'פנטזיה', 'מתח'] },
    { tags: ['tech'], title: 'המכשיר שהכי רוצים', ask: 'איזה מכשיר הייתם רוצים לקבל?', head: 'מכשיר', which: 'איזה מכשיר', cats: ['רחפן', 'רובוט', 'טאבלט', 'מצלמה', 'שעון חכם'] },
    { tags: ['kpop'], title: 'מוצר המעריצים הכי רצוי', ask: 'איזה מוצר של להקת הקיי-פופ הכי הייתם רוצים?', head: 'מוצר', which: 'איזה מוצר', cats: ['פוטוקארד', 'אלבום', 'מקל אור', 'פוסטר', 'חולצה'] },
    { tags: ['magic'], title: 'החפץ הקסום הכי רצוי', ask: 'איזה חפץ קסום הייתם רוצים לקבל?', head: 'חפץ קסום', which: 'איזה חפץ קסום', cats: ['שרביט', 'מטאטא', 'גלימה', 'ספר לחשים', 'שיקוי'] },
    { tags: ['squishy'], title: 'צורת הסקווישי האהובה', ask: 'איזו צורה של סקווישי הכי אהובה עליכם?', head: 'צורה', which: 'איזו צורה', cats: ['דונאט', 'חתול', 'אבוקדו', 'פנדה', 'תות'] },
  ];

  // נתונים מספריים על דמות אחת (לממוצע ותכונותיו)
  const NUMS = [
    { tags: ['sport'], lo: 4, hi: 20, unit: ['משחק', 'משחקים'], next2: 'בשני המשחקים הבאים',
      avg: (p, n, M) => `${p.name} ${p.g('שיחק', 'שיחקה')} ${n} משחקי כדורסל, ${p.g('וקלע', 'וקלעה')} בממוצע ${M} נקודות במשחק.`,
      tot: (p) => `כמה נקודות ${p.g('קלע', 'קלעה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `מספר הנקודות ש${p.g('קלע', 'קלעה')} ${p.name} ב-${n} משחקי כדורסל:`,
      ask: (p) => `כמה נקודות ${p.g('קלע', 'קלעה')} ${p.name} בממוצע במשחק?`,
      next: (p, v) => `במשחק הבא ${p.g('קלע', 'קלעה')} ${p.name} ${HM.cnt(v, 'נקודה', 'נקודות', true)}.` },
    { tags: ['reading'], lo: 10, hi: 40, unit: ['יום', 'ימים'], next2: 'בשני הימים הבאים',
      avg: (p, n, M) => `${p.name} ${p.g('קרא', 'קראה')} ספר במשך ${n} ימים, בממוצע ${M} עמודים ביום.`,
      tot: (p) => `כמה עמודים ${p.g('קרא', 'קראה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `מספר העמודים ש${p.g('קרא', 'קראה')} ${p.name} בכל יום, במשך ${n} ימים:`,
      ask: (p) => `כמה עמודים ${p.g('קרא', 'קראה')} ${p.name} בממוצע ביום?`,
      next: (p, v) => `למחרת ${p.g('קרא', 'קראה')} ${p.name} ${HM.cnt(v, 'עמוד', 'עמודים')}.` },
    { tags: ['baking'], lo: 6, hi: 20, unit: ['מגש', 'מגשים'], next2: 'בשני המגשים הבאים',
      avg: (p, n, M) => `${p.name} ${p.g('אפה', 'אפתה')} ${n} מגשים של עוגיות, ובכל מגש היו בממוצע ${M} עוגיות.`,
      tot: () => 'כמה עוגיות היו בכל המגשים יחד?',
      intro: (p, n) => `${p.name} ${p.g('אפה', 'אפתה')} ${n} מגשים של עוגיות. מספר העוגיות בכל מגש:`,
      ask: () => 'כמה עוגיות יש בממוצע במגש?',
      next: (p, v) => `${p.name} ${p.g('אפה', 'אפתה')} עוד מגש, ובו ${HM.cnt(v, 'עוגייה', 'עוגיות', true)}.` },
    { tags: ['animals'], lo: 3, hi: 15, unit: ['יום', 'ימים'], next2: 'בשני הימים הבאים',
      avg: (p, n, M) => `בלול של סבא של ${p.name} נמצאו במשך ${n} ימים בממוצע ${M} ביצים ביום.`,
      tot: () => 'כמה ביצים נמצאו בסך הכול?',
      intro: (p, n) => `בלול של סבא של ${p.name} סופרים ביצים. מספר הביצים שנמצאו בכל יום, במשך ${n} ימים:`,
      ask: () => 'כמה ביצים נמצאו בממוצע ביום?',
      next: (p, v) => `למחרת נמצאו בלול ${HM.cnt(v, 'ביצה', 'ביצים', true)}.` },
    { tags: ['space'], lo: 1, hi: 12, unit: ['לילה', 'לילות'], next2: 'בשני הלילות הבאים',
      avg: (p, n, M) => `${p.name} ${p.g('צפה', 'צפתה')} בשמיים ${n} לילות, ${p.g('וראה', 'וראתה')} בממוצע ${M} כוכבים נופלים בלילה.`,
      tot: (p) => `כמה כוכבים נופלים ${p.g('ראה', 'ראתה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `${p.name} ${p.g('צפה', 'צפתה')} בשמיים ${n} לילות. מספר הכוכבים הנופלים ש${p.g('ראה', 'ראתה')} בכל לילה:`,
      ask: (p) => `כמה כוכבים נופלים ${p.g('ראה', 'ראתה')} ${p.name} בממוצע בלילה?`,
      next: (p, v) => `בלילה הבא ${p.g('ראה', 'ראתה')} ${p.name} ${HM.cnt(v, 'כוכב נופל', 'כוכבים נופלים')}.` },
    { tags: ['music'], lo: 2, hi: 12, unit: ['חזרה', 'חזרות'], next2: 'בשתי החזרות הבאות',
      avg: (p, n, M) => `ב-${n} חזרות של הלהקה ${p.g('ניגן', 'ניגנה')} ${p.name} בממוצע ${M} שירים בחזרה.`,
      tot: (p) => `כמה שירים ${p.g('ניגן', 'ניגנה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `מספר השירים ש${p.g('ניגן', 'ניגנה')} ${p.name} בכל חזרה של הלהקה, ב-${n} חזרות:`,
      ask: (p) => `כמה שירים ${p.g('ניגן', 'ניגנה')} ${p.name} בממוצע בחזרה?`,
      next: (p, v) => `בחזרה הבאה ${p.g('ניגן', 'ניגנה')} ${p.name} ${HM.cnt(v, 'שיר', 'שירים')}.` },
    { tags: ['games'], lo: 1, hi: 12, unit: ['יום', 'ימים'], next2: 'בשני הימים הבאים',
      avg: (p, n, M) => `במשך ${n} ימים ${p.g('עבר', 'עברה')} ${p.name} במשחק המחשב בממוצע ${M} שלבים ביום.`,
      tot: (p) => `כמה שלבים ${p.g('עבר', 'עברה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `מספר השלבים ש${p.g('עבר', 'עברה')} ${p.name} במשחק המחשב בכל יום, במשך ${n} ימים:`,
      ask: (p) => `כמה שלבים ${p.g('עבר', 'עברה')} ${p.name} בממוצע ביום?`,
      next: (p, v) => `למחרת ${p.g('עבר', 'עברה')} ${p.name} ${HM.cnt(v, 'שלב', 'שלבים')}.` },
    { tags: ['art'], lo: 1, hi: 10, unit: ['שבוע', 'שבועות'], next2: 'בשני השבועות הבאים',
      avg: (p, n, M) => `במשך ${n} שבועות ${p.g('צייר', 'ציירה')} ${p.name} בממוצע ${M} ציורים בשבוע.`,
      tot: (p) => `כמה ציורים ${p.g('צייר', 'ציירה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `מספר הציורים ש${p.g('צייר', 'ציירה')} ${p.name} לתערוכה בכל שבוע, במשך ${n} שבועות:`,
      ask: (p) => `כמה ציורים ${p.g('צייר', 'ציירה')} ${p.name} בממוצע בשבוע?`,
      next: (p, v) => `בשבוע הבא ${p.g('צייר', 'ציירה')} ${p.name} ${HM.cnt(v, 'ציור', 'ציורים')}.` },
    { tags: ['nature'], lo: 4, hi: 16, unit: ['יום', 'ימים'], next2: 'בשני הימים הבאים',
      avg: (p, n, M) => `במסע של ${n} ימים הלכה המשפחה של ${p.name} בממוצע ${M} קילומטרים ביום.`,
      tot: () => 'כמה קילומטרים הלכו בסך הכול?',
      intro: (p, n) => `${p.name} ${p.g('יצא', 'יצאה')} עם המשפחה למסע של ${n} ימים. מספר הקילומטרים שהלכו בכל יום:`,
      ask: () => 'כמה קילומטרים הלכו בממוצע ביום?',
      next: (p, v) => `ביום הבא הלכו ${HM.cnt(v, 'קילומטר', 'קילומטרים')}.` },
    { tags: ['tech'], lo: 2, hi: 15, unit: ['ניסוי', 'ניסויים'], next2: 'בשני הניסויים הבאים',
      avg: (p, n, M) => `הרובוט של ${p.name} נסע ב-${n} ניסויים בממוצע ${M} מטרים בניסוי.`,
      tot: () => 'כמה מטרים נסע הרובוט בכל הניסויים יחד?',
      intro: (p, n) => `${p.name} ${p.g('בנה', 'בנתה')} רובוט ${p.g('ומדד', 'ומדדה')} כמה מטרים הוא נוסע בדקה, ב-${n} ניסויים:`,
      ask: () => 'כמה מטרים נסע הרובוט בממוצע בניסוי?',
      next: (p, v) => `בניסוי הבא נסע הרובוט ${HM.cnt(v, 'מטר', 'מטרים')}.` },
    { tags: ['kpop'], lo: 2, hi: 12, unit: ['יום', 'ימים'], next2: 'בשני הימים הבאים',
      avg: (p, n, M) => `${p.name} ${p.g('תרגל', 'תרגלה')} ריקוד של להקת קיי-פופ ${n} ימים, בממוצע ${M} פעמים ביום.`,
      tot: (p) => `כמה פעמים ${p.g('תרגל', 'תרגלה')} ${p.name} את הריקוד בסך הכול?`,
      intro: (p, n) => `${p.name} ${p.g('לומד', 'לומדת')} ריקוד של להקת קיי-פופ. מספר הפעמים ש${p.g('תרגל', 'תרגלה')} את הריקוד בכל יום, במשך ${n} ימים:`,
      ask: (p) => `כמה פעמים ${p.g('תרגל', 'תרגלה')} ${p.name} את הריקוד בממוצע ביום?`,
      next: (p, v) => `למחרת ${p.g('תרגל', 'תרגלה')} ${p.name} את הריקוד ${times(v)}.` },
    { tags: ['magic'], lo: 5, hi: 20, unit: ['שבוע', 'שבועות'], next2: 'בשני השבועות הבאים',
      avg: (p, n, M) => `במשך ${n} שבועות הרוויח הבית של ${p.name} בבית הספר לקוסמים בממוצע ${M} נקודות בשבוע.`,
      tot: () => 'כמה נקודות הרוויח הבית בסך הכול?',
      intro: (p, n) => `בבית הספר לקוסמים הבתים מתחרים על נקודות. מספר הנקודות שהרוויח הבית של ${p.name} בכל שבוע, במשך ${n} שבועות:`,
      ask: () => 'כמה נקודות הרוויח הבית בממוצע בשבוע?',
      next: (p, v) => `בשבוע הבא הרוויח הבית ${HM.cnt(v, 'נקודה', 'נקודות', true)}.` },
    { tags: ['squishy'], lo: 1, hi: 9, unit: ['חודש', 'חודשים'], next2: 'בשני החודשים הבאים',
      avg: (p, n, M) => `במשך ${n} חודשים ${p.g('הוסיף', 'הוסיפה')} ${p.name} לאוסף בממוצע ${M} סקווישים בחודש.`,
      tot: (p) => `כמה סקווישים ${p.g('הוסיף', 'הוסיפה')} ${p.name} בסך הכול?`,
      intro: (p, n) => `${p.name} ${p.g('אוסף', 'אוספת')} סקווישים. מספר הסקווישים ש${p.g('הוסיף', 'הוסיפה')} לאוסף בכל חודש, במשך ${n} חודשים:`,
      ask: (p) => `כמה סקווישים ${p.g('הוסיף', 'הוסיפה')} ${p.name} בממוצע בחודש?`,
      next: (p, v) => `בחודש הבא ${p.g('הוסיף', 'הוסיפה')} ${p.name} ${HM.cnt(v, 'סקווישי', 'סקווישים')}.` },
  ];
  const numLabels = (sc, n) => HM.range(1, n).map((i) => `${sc.unit[0]} ${i}`);

  // חפצים שאפשר לחלק שווה בשווה
  const SHARE = [
    { tags: ['nature'], act: 'אספו צדפים בחוף', verb: 'אספו', obj: 'צדפים', them: 'אותם' },
    { tags: ['baking'], act: 'אפו עוגיות', verb: 'אפו', obj: 'עוגיות', them: 'אותן' },
    { tags: ['animals'], act: 'אספו קלפי חיות', verb: 'אספו', obj: 'קלפים', them: 'אותם' },
    { tags: ['space'], act: 'אספו מדבקות של חלליות', verb: 'אספו', obj: 'מדבקות', them: 'אותן' },
    { tags: ['sport'], act: 'אספו קלפי כדורגל', verb: 'אספו', obj: 'קלפים', them: 'אותם' },
    { tags: ['art'], act: 'הביאו עפרונות צבעוניים', verb: 'הביאו', obj: 'עפרונות', them: 'אותם' },
    { tags: ['reading'], act: 'הכינו סימניות לספרים', verb: 'הכינו', obj: 'סימניות', them: 'אותן' },
    { tags: ['games'], act: 'קיבלו מטבעות זהב במשחק קבוצתי', verb: 'קיבלו', obj: 'מטבעות', them: 'אותם' },
    { tags: ['music'], act: 'אספו מפרטים לגיטרה', verb: 'אספו', obj: 'מפרטים', them: 'אותם' },
    { tags: ['tech'], act: 'הביאו חלקי לגו לחוג רובוטיקה', verb: 'הביאו', obj: 'חלקים', them: 'אותם' },
    { tags: ['kpop'], act: 'אספו פוטוקארדים של הלהקה', verb: 'אספו', obj: 'פוטוקארדים', them: 'אותם' },
    { tags: ['magic'], act: 'הכינו בקבוקוני שיקוי בשיעור שיקויים', verb: 'הכינו', obj: 'בקבוקונים', them: 'אותם' },
    { tags: ['squishy'], act: 'הביאו סקווישים לפינת המשחק', verb: 'הביאו', obj: 'סקווישים', them: 'אותם' },
  ];

  // טבלאות שכיחויות של נתונים מספריים (לחישוב ממוצע)
  const FTABLES = [
    { tags: ['animals'], t: 'כמה חיות מחמד יש לילדי הקבוצה', head: 'מספר חיות המחמד', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [0, 1, 2, 3, 4], q: 'מספר חיות המחמד הממוצע לילד' },
    { tags: ['reading'], t: 'כמה ספרים קראו ילדי הקבוצה בחופשה', head: 'מספר הספרים', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [1, 2, 3, 4, 5, 6], q: 'מספר הספרים הממוצע לילד' },
    { tags: ['sport'], t: 'כמה גולים הבקיעה הקבוצה בכל משחק העונה', head: 'מספר הגולים', col: 'מספר משחקים', colDef: 'מספר המשחקים', vals: [0, 1, 2, 3, 4, 5], q: 'מספר הגולים הממוצע במשחק' },
    { tags: [], t: 'כמה אחים ואחיות יש לילדי הקבוצה', head: 'מספר האחים והאחיות', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [0, 1, 2, 3, 4], q: 'מספר האחים והאחיות הממוצע לילד' },
    { tags: ['music'], t: 'כמה שעות בשבוע מתאמנים ילדי המקהלה', head: 'שעות אימון', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [1, 2, 3, 4, 5], q: 'מספר שעות האימון הממוצע לילד' },
    { tags: ['space'], t: 'כמה כוכבים נופלים נראו בכל לילה במחנה', head: 'כוכבים נופלים', col: 'מספר לילות', colDef: 'מספר הלילות', vals: [0, 1, 2, 3, 4, 5], q: 'מספר הכוכבים הנופלים הממוצע בלילה' },
    { tags: ['games'], t: 'כמה שלבים עברו ילדי הקבוצה במשחק', head: 'מספר השלבים', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [1, 2, 3, 4, 5, 6], q: 'מספר השלבים הממוצע לילד' },
    { tags: ['nature'], t: 'כמה ציפורים נראו בכל תצפית בטיול', head: 'מספר הציפורים', col: 'מספר תצפיות', colDef: 'מספר התצפיות', vals: [2, 3, 4, 5, 6, 7], q: 'מספר הציפורים הממוצע בתצפית' },
    { tags: ['kpop'], t: 'כמה אלבומים של להקות קיי-פופ יש לחברי מועדון המעריצים', head: 'מספר האלבומים', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [0, 1, 2, 3, 4, 5], q: 'מספר האלבומים הממוצע לילד' },
    { tags: ['magic'], t: 'כמה ספרי לחשים קרא כל תלמיד בבית הספר לקוסמים', head: 'ספרי לחשים', col: 'מספר תלמידים', colDef: 'מספר התלמידים', vals: [1, 2, 3, 4, 5, 6], q: 'מספר ספרי הלחשים הממוצע לתלמיד' },
    { tags: ['squishy'], t: 'כמה סקווישים יש לכל ילד בקבוצה', head: 'מספר הסקווישים', col: 'מספר ילדים', colDef: 'מספר הילדים', vals: [1, 2, 3, 4, 5, 6, 7], q: 'מספר הסקווישים הממוצע לילד' },
  ];
  // טבלת שכיחויות שהממוצע שלה שלם
  function ftData(c, sc, k) {
    for (let t = 0; t < 400; t++) {
      const vals = c.sample(sc.vals, k).sort((x, y) => x - y);
      const f = vals.map(() => c.rnd(1, 5));
      const N = SUM(f), tot = SUM(vals.map((v, i) => v * f[i]));
      if (tot % N === 0 && N >= 6 && uniqMax(f)) return { vals, f, N, tot, M: tot / N };
    }
    const v0 = sc.vals.slice(0, 3);
    return { vals: v0, f: [2, 3, 2], N: 7, tot: v0[0] * 2 + v0[1] * 3 + v0[2] * 2, M: v0[1] };
  }
  const ftSolution = (c, sc, d) => [
    `סכום הנתונים: ${m(d.vals.map((v, i) => `${v} × ${d.f[i]}`).join(' + ') + ' = ' + d.tot)}`,
    `${sc.colDef} (סכום השכיחויות): ${m(plus(d.f) + ' = ' + d.N)}`,
    `הממוצע: ${m(`${d.tot} : ${d.N} = ${d.M}`)}`,
  ];

  /* ============================================================
     שכיח, שכיחות ושכיחות יחסית
     ============================================================ */
  const MODE_SETS = [
    { tags: ['sport'], txt: (p) => `מספר הגולים ש${p.g('הבקיע', 'הבקיעה')} ${p.name} בכל משחק העונה:`, lo: 0, hi: 4 },
    { tags: [], txt: () => 'מידות הנעליים של ילדי הקבוצה:', lo: 32, hi: 37 },
    { tags: ['animals'], txt: () => 'מספר חיות המחמד בבית של כל ילד בקבוצה:', lo: 0, hi: 3 },
    { tags: ['reading'], txt: () => 'מספר הספרים שקרא כל ילד בחופשה:', lo: 1, hi: 6 },
    { tags: ['games'], txt: (p) => `מספר השלבים ש${p.g('עבר', 'עברה')} ${p.name} במשחק בכל יום:`, lo: 2, hi: 7 },
    { tags: ['nature'], txt: () => 'מספר הציפורים שנראו בכל תצפית בטיול:', lo: 3, hi: 8 },
    { tags: ['music'], txt: () => 'מספר השעות שכל ילד במקהלה מתאמן בשבוע:', lo: 1, hi: 5 },
    { tags: ['space'], txt: (p) => `מספר הכוכבים הנופלים ש${p.g('ראה', 'ראתה')} ${p.name} בכל לילה במחנה:`, lo: 0, hi: 5 },
    { tags: ['baking'], txt: (p) => `מספר כפות הסוכר ששמו בכל עוגה בתחרות האפייה של ${p.name}:`, lo: 2, hi: 6 },
    { tags: ['kpop'], txt: (p) => `מספר הפוטוקארדים ש${p.g('מצא', 'מצאה')} ${p.name} בכל אלבום ש${p.g('פתח', 'פתחה')}:`, lo: 1, hi: 5 },
    { tags: ['magic'], txt: (p) => `מספר הנקודות שהרוויח הבית של ${p.name} בכל יום בבית הספר לקוסמים:`, lo: 1, hi: 6 },
    { tags: ['squishy'], txt: (p) => `מספר השניות שלקח לכל סקווישי באוסף של ${p.name} לחזור לצורתו:`, lo: 3, hi: 8 },
  ];
  function survey(c, k, N, distinct) {
    const sc = c.scene(SURVEYS), cats = c.sample(sc.cats, k), f = partition(c, k, N, 1, distinct);
    const mi = f.indexOf(MX(f));
    return { sc, cats, f, N, mi, mode: cats[mi], p: c.chance(0.5) ? c.me : c.friend() };
  }
  const sIntro = (d) => `${d.p.name} ${d.p.g('שאל', 'שאלה')} ${d.N} ילדים: "${d.sc.ask}"`;
  const ftable = (d, o) => V.table([d.sc.head, 'שכיחות'], d.cats.map((x, i) => [x, o && o.hide === i ? HM.box() : d.f[i]]));
  const fchart = (d, o) => V.barChart(Object.assign({ labels: d.cats, values: d.f, title: d.sc.title, w: 400, h: 260, max: MX(d.f) + 1, step: MX(d.f) < 10 ? 1 : 2 }, o || {}));

  HM.lesson({
    id: 'data-freq',
    learn: (c) => {
      const pets = ['כלב', 'חתול', 'כלב', 'דג', 'כלב', 'ארנב', 'חתול', 'כלב', 'דג', 'חתול', 'כלב', 'ארנב'];
      return [
        {
          title: 'סקר בכיתה',
          html: `${c.name} ${c.g('רצה', 'רצתה')} לדעת איזו חיית מחמד הכי אהובה בכיתה. ${c.g('הוא שאל', 'היא שאלה')} 12 ילדים, וכל ילד ענה תשובה אחת.<br>התשובות שנאספו נקראות ${b('נתונים')}. ברשימה מבולגנת קשה לראות מה הכי אהוב — לכן נסדר אותן.`,
          visual: HM.seq(pets),
        },
        {
          title: 'שכיחות וטבלת שכיחויות',
          html: `${b('השכיחות')} של נתון היא מספר הפעמים שהוא מופיע.<br>"כלב" מופיע ברשימה 5 פעמים, לכן השכיחות שלו היא 5.<br>כשרושמים את השכיחות של כל נתון, מקבלים ${b('טבלת שכיחויות')}. סכום כל השכיחויות שווה למספר הילדים: 12.<br>טיפ: ${c.g('סמן', 'סמני')} כל תשובה שכבר ספרת, כדי לא לספור פעמיים.`,
          visual: V.table(['חיית מחמד', 'שכיחות'], [['כלב', 5], ['חתול', 3], ['דג', 2], ['ארנב', 2], ['סך הכול', 12]]),
        },
        {
          title: 'השכיח',
          html: `${b('השכיח')} הוא הנתון שמופיע ${HM.hl('הכי הרבה פעמים')}.<br>בסקר שלנו השכיח הוא ${b('כלב')}, כי השכיחות שלו הכי גדולה.<br>${c.g('שים לב', 'שימי לב')}: השכיח הוא ${b('הנתון')} (כלב), ולא מספר הפעמים (5).`,
          visual: V.barChart({ labels: ['כלב', 'חתול', 'דג', 'ארנב'], values: [5, 3, 2, 2], hl: [0], title: 'חיית המחמד האהובה', w: 380, h: 250, max: 6, step: 1 }),
          quiz: {
            type: 'choice', prompt: 'בסקר אחר: כדורגל — 4 ילדים, כדורסל — 7 ילדים, שחייה — 3 ילדים. מה השכיח?',
            choices: ['כדורסל', '7', 'כדורגל', 'שחייה'], answer: 0,
            hint: 'השכיח הוא הנתון שבחרו הכי הרבה ילדים — שם, לא מספר.',
            solution: ['הכי הרבה ילדים (7) בחרו כדורסל.', 'לכן השכיח הוא כדורסל.'],
          },
        },
        {
          title: 'מדיאגרמה לטבלה',
          html: `בדיאגרמת עמודות, ${b('הגובה של כל עמודה הוא השכיחות')}.<br>כדי להעביר לטבלה, ${c.g('עבור', 'עברי')} על העמודות ${b('מימין לשמאל')}. בכל עמודה ${c.g('קרא', 'קראי')} את המספר בציר שמימין, ${c.g('ורשום', 'ורשמי')} אותו בשורה של הנתון.`,
          visual: `<div class="row">${V.barChart({ labels: ['גיטרה', 'פסנתר', 'תופים', 'כינור'], values: [6, 4, 7, 3], hideValues: true, step: 1, max: 8, title: 'כלי הנגינה האהוב', w: 340, h: 250 })}${V.table(['כלי נגינה', 'שכיחות'], [['גיטרה', 6], ['פסנתר', 4], ['תופים', 7], ['כינור', 3]])}</div>`,
          quiz: {
            type: 'number', prompt: 'כמה ילדים השתתפו בסקר על כלי הנגינה?', answer: 20,
            hint: 'כל ילד בחר כלי אחד. ' + c.g('חבר', 'חברי') + ' את כל השכיחויות.',
            solution: [m('6 + 4 + 7 + 3 = 20'), '20 ילדים השתתפו בסקר.'],
          },
        },
        {
          title: 'שכיחות יחסית',
          html: `${b('שכיחות יחסית')} אומרת איזה ${b('חלק')} מכל הקבוצה בחר בנתון:<br>${HM.hl('שכיחות יחסית = השכיחות : מספר כל הנתונים')}<br>כלב: 5 ילדים מתוך 12, כלומר ${m(F(5, 12))} מהכיתה.<br>אפשר גם באחוזים: אם 5 מתוך 20 ילדים בחרו כדורגל, זה ${m(F(5, 20) + ' = ' + F(25, 100))}, כלומר 25%.`,
          visual: V.bar(5, 12, { label: 'כלב: 5 מתוך 12' }),
        },
        {
          title: 'דוגמה פתורה',
          html: `מידות הנעליים של 10 ילדים:<br>${HM.seq([34, 35, 33, 35, 36, 35, 34, 35, 33, 35])}<br>מה השכיח, ומה השכיחות היחסית שלו?`,
          steps: [
            'סופרים כל מידה: 33 ← פעמיים, 34 ← פעמיים, 35 ← 5 פעמים, 36 ← פעם אחת.',
            `הנתון שמופיע הכי הרבה פעמים הוא 35, לכן ${b('השכיח הוא 35')}, והשכיחות שלו 5.`,
            `השכיחות היחסית: 5 מתוך 10 ← ${m(F(5, 10) + ' = ' + F(1, 2))}`,
            `${m(F(5, 10) + ' = ' + F(50, 100))} ← 50% מהילדים נועלים מידה 35.`,
          ],
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['count', 'modeTable', 'readChart', 'total', 'modeNum']
        : level === 2 ? ['tableSlots', 'relFrac', 'missingCell', 'modeChart', 'tableToChart', 'countRaw']
        : ['relPct', 'fromRel', 'toBeMode', 'tf', 'totalFromRel', 'relTwo'];
      const kind = c.pick(level === 2 && c.chance(0.15) ? ['relRaw'] : kinds);
      switch (kind) {
        case 'count': {
          const d = survey(c, c.pick([3, 4]), c.rnd(8, 12));
          const t = c.rnd(0, d.cats.length - 1), cat = d.cats[t];
          return {
            type: 'number', answer: d.f[t],
            prompt: `${sIntro(d)}<br>אלה התשובות. מה ${b('השכיחות')} של "${cat}"?`,
            visual: HM.seq(expand(c, d.cats, d.f)),
            hint: `השכיחות היא מספר הפעמים שהתשובה מופיעה. ${c.g('ספור', 'ספרי')} את "${cat}" ברשימה, ${c.g('וסמן', 'וסמני')} כל אחת שספרת.`,
            solution: [`התשובה "${cat}" מופיעה ברשימה ${times(d.f[t])}.`, `השכיחות של "${cat}" היא ${d.f[t]}.`],
          };
        }
        case 'modeTable':
        case 'modeChart': {
          const chart = kind === 'modeChart';
          const d = survey(c, chart ? c.pick([4, 5]) : c.pick([3, 4]), chart ? c.rnd(16, 26) : c.rnd(10, 20));
          const mf = d.f[d.mi];
          const choices = [d.mode].concat(d.cats.filter((x, i) => i !== d.mi).slice(0, 3), [String(mf)]);
          return {
            type: 'choice', choices, answer: 0,
            prompt: `${sIntro(d)}<br>${chart ? 'התוצאות בדיאגרמה.' : 'התוצאות בטבלה.'} מה ${b('השכיח')}?`,
            visual: chart ? fchart(d, { hideValues: true }) : ftable(d),
            hint: `השכיח הוא ${b('הנתון')} ${chart ? 'שהעמודה שלו הכי גבוהה' : 'שהשכיחות שלו הכי גדולה'} — לא מספר הפעמים.`,
            solution: [`השכיחות הגדולה ביותר היא ${mf}, של "${d.mode}".`, `לכן השכיח הוא ${d.mode}. (${mf} הוא מספר הפעמים, כלומר השכיחות.)`],
          };
        }
        case 'readChart': {
          const d = survey(c, 4, c.rnd(12, 20), true);
          const diff = c.chance(0.4);
          const order = d.f.map((x, i) => i).sort((x, y) => d.f[y] - d.f[x]);
          const i = diff ? order[c.rnd(0, 1)] : c.rnd(0, 3), j = order[c.rnd(2, 3)];
          return {
            type: 'number', answer: diff ? d.f[i] - d.f[j] : d.f[i],
            prompt: `${d.p.name} ${d.p.g('ערך', 'ערכה')} סקר: "${d.sc.ask}" והציג${d.p.g('', 'ה')} את התוצאות בדיאגרמה.<br>${diff ? `בכמה ילדים יותר בחרו ${d.cats[i]} מאשר ${d.cats[j]}?` : `כמה ילדים בחרו ${d.cats[i]}?`}`,
            visual: fchart(d, { hideValues: true }),
            hint: `${c.g('מצא', 'מצאי')} את ראש העמודה של ${d.cats[i]}, ${c.g('והמשך', 'והמשיכי')} בקו ישר ימינה עד המספרים שבציר.`,
            solution: diff
              ? [`${d.cats[i]}: ${d.f[i]}, ${d.cats[j]}: ${d.f[j]}.`, m(`${d.f[i]} − ${d.f[j]} = ${d.f[i] - d.f[j]}`)]
              : [`העמודה של ${d.cats[i]} מגיעה עד ${d.f[i]}.`, `${chose(d.f[i])} ${d.cats[i]}.`],
          };
        }
        case 'total': {
          const d = survey(c, c.pick([3, 4]), c.rnd(10, 24));
          const asChart = c.chance(0.5);
          return {
            type: 'number', answer: d.N,
            prompt: `${d.p.name} ${d.p.g('ערך', 'ערכה')} סקר: "${d.sc.ask}"<br>כל ילד ענה תשובה אחת. כמה ילדים השתתפו בסקר?`,
            visual: asChart ? fchart(d) : ftable(d),
            hint: `כל ילד מופיע פעם אחת באחת ${asChart ? 'העמודות' : 'השורות'}. ${c.g('חבר', 'חברי')} את כל השכיחויות.`,
            solution: [m(`${plus(d.f)} = ${d.N}`), `${d.N} ילדים השתתפו בסקר.`],
          };
        }
        case 'modeNum': {
          const sc = c.scene(MODE_SETS), p = c.chance(0.5) ? c.me : c.friend();
          const vals = c.sample(HM.range(sc.lo, sc.hi), 4).sort((x, y) => x - y);
          const f = partition(c, 4, c.rnd(9, 12), 1);
          const mo = vals[f.indexOf(MX(f))];
          return {
            type: 'number', answer: mo,
            prompt: `${sc.txt(p)}<br>${HM.seq(expand(c, vals, f))}<br>מה ${b('השכיח')}?`,
            hint: `${c.g('ספור', 'ספרי')} כמה פעמים מופיע כל מספר. השכיח הוא המספר שמופיע הכי הרבה פעמים.`,
            solution: [vals.map((v, i) => `${v} ← ${times(f[i])}`).join(', '), `השכיח הוא ${mo}: הוא מופיע ${times(MX(f))}.`],
          };
        }
        case 'tableSlots': {
          const d = survey(c, 4, c.rnd(14, 24));
          const [i, j] = c.sample([0, 1, 2, 3], 2).sort((x, y) => x - y);
          const rows = d.cats.map((x, k) => [x, k === i ? HM.slot(0) : k === j ? HM.slot(1) : d.f[k]]);
          return {
            type: 'number', answer: [d.f[i], d.f[j]],
            prompt: `${c.g('השלם', 'השלימי')} את טבלת השכיחויות לפי הדיאגרמה:${V.table([d.sc.head, 'שכיחות'], rows)}`,
            visual: fchart(d, { hideValues: true }),
            hint: `הגובה של כל עמודה הוא השכיחות. ${c.g('קרא', 'קראי')} אותו בציר שמימין. ${c.g('שים לב', 'שימי לב')}: העמודה הראשונה היא הימנית.`,
            solution: [`העמודה של ${d.cats[i]} מגיעה עד ${d.f[i]}.`, `העמודה של ${d.cats[j]} מגיעה עד ${d.f[j]}.`],
          };
        }
        case 'relFrac':
        case 'relRaw': {
          const raw = kind === 'relRaw';
          const d = survey(c, raw ? 3 : 4, raw ? c.pick([8, 9, 10, 12]) : c.pick([12, 15, 16, 18, 20, 24]));
          const t = c.rnd(0, d.cats.length - 1), x = d.f[t], cat = d.cats[t];
          return {
            type: 'fraction', answer: { n: x, d: d.N },
            prompt: `${sIntro(d)}<br>${raw ? 'אלה התשובות.' : 'התוצאות בטבלה.'} מה ${b('השכיחות היחסית')} של ${cat}? ${c.g('כתוב', 'כתבי')} אותה כשבר.`,
            visual: raw ? HM.seq(expand(c, d.cats, d.f)) : ftable(d),
            hint: `שכיחות יחסית = השכיחות : מספר כל הנתונים. ${raw ? `${c.g('ספור', 'ספרי')} כמה פעמים מופיעה התשובה "${cat}", ומתוך כמה תשובות.` : `כמה ילדים בחרו ${cat}, ומתוך כמה ילדים?`}`,
            solution: [`${chose(x)} ${cat}, מתוך ${d.N} ילדים.`, `השכיחות היחסית: ${m(fr(x, d.N))}`],
          };
        }
        case 'missingCell': {
          const d = survey(c, 4, c.rnd(16, 26));
          const t = c.rnd(0, 3), others = d.f.filter((x, i) => i !== t), so = SUM(others);
          return {
            type: 'number', answer: d.f[t],
            prompt: `${sIntro(d)}<br>כל ילד בחר תשובה אחת. כמה ילדים בחרו ${d.cats[t]}?`,
            visual: ftable(d, { hide: t }),
            hint: `סכום כל השכיחויות שווה למספר הילדים בסקר — ${d.N}.`,
            solution: [`השכיחויות הידועות: ${m(`${plus(others)} = ${so}`)}`, m(`${d.N} − ${so} = ${d.f[t]}`), `${chose(d.f[t])} ${d.cats[t]}.`],
          };
        }
        case 'tableToChart': {
          const d = survey(c, 4, c.rnd(14, 22), true);
          const mk = (vals) => V.barChart({ labels: d.cats, values: vals, w: 300, h: 210, max: MX(d.f) + 2, step: 2 });
          const rev = d.f.slice().reverse();
          const sw = d.f.slice(), a = c.rnd(0, 2); [sw[a], sw[a + 1]] = [sw[a + 1], sw[a]];
          const off = d.f.slice(), o2 = c.rnd(0, 3); off[o2] += off[o2] > 2 && c.chance(0.5) ? -1 : 1;
          return {
            type: 'choice', cols: 2, choices: [mk(d.f), mk(rev), mk(sw), mk(off)], answer: 0,
            prompt: `${d.p.name} ${d.p.g('ערך', 'ערכה')} סקר על ${d.sc.title}. באיזו דיאגרמה מוצגים הנתונים שבטבלה?`,
            visual: ftable(d),
            hint: `${c.g('בדוק', 'בדקי')} כל עמודה: האם הגובה שלה מתאים למספר שבטבלה? ${c.g('שים לב', 'שימי לב')} גם לשם שמתחת לעמודה.`,
            solution: [`בטבלה: ${d.cats.map((x, i) => `${x} — ${d.f[i]}`).join(', ')}.`, 'רק בדיאגרמה הנכונה לכל שם יש עמודה בגובה המתאים בדיוק.'],
          };
        }
        case 'countRaw': {
          const d = survey(c, 4, c.rnd(12, 16), true);
          const order = d.f.map((x, i) => i).sort((x, y) => d.f[y] - d.f[x]);
          const i = order[c.rnd(0, 1)], j = order[c.rnd(2, 3)];
          return {
            type: 'number', answer: d.f[i] - d.f[j],
            prompt: `${sIntro(d)}<br>אלה התשובות. בכמה ילדים יותר בחרו ${d.cats[i]} מאשר ${d.cats[j]}?`,
            visual: HM.seq(expand(c, d.cats, d.f)),
            hint: `${c.g('מצא', 'מצאי')} את השכיחות של כל אחת משתי התשובות, ואז את ההפרש ביניהן.`,
            solution: [`"${d.cats[i]}" — ${times(d.f[i])}, "${d.cats[j]}" — ${times(d.f[j])}.`, m(`${d.f[i]} − ${d.f[j]} = ${d.f[i] - d.f[j]}`)],
          };
        }
        case 'relPct': {
          const N = c.pick([10, 20, 25, 50]);
          const d = survey(c, 4, N);
          const t = c.rnd(0, 3), x = d.f[t], pc = (x * 100) / N;
          return {
            type: 'number', answer: pc, unit: '%',
            prompt: `${sIntro(d)}<br>כמה ${b('אחוזים')} מהילדים בחרו ${d.cats[t]}?`,
            visual: c.chance(0.5) ? ftable(d) : fchart(d),
            hint: `${c.g('כתוב', 'כתבי')} את השכיחות היחסית כשבר, ${c.g('והרחב', 'והרחיבי')} אותו למכנה 100.`,
            solution: [`${chose(x)} ${d.cats[t]} מתוך ${N}: ${m(F(x, N))}`, `${m(F(x, N) + ' = ' + F(pc, 100))} ← ${pc}%`],
          };
        }
        case 'fromRel': {
          const sc = c.scene(SURVEYS), cat = c.pick(sc.cats), p = c.chance(0.5) ? c.me : c.friend();
          if (c.chance(0.55)) {
            const dd = c.pick([2, 3, 4, 5, 6]);
            const nums = HM.range(1, dd - 1).filter((a) => HM.gcd(a, dd) === 1), a = c.pick(nums);
            const N = dd * c.rnd(Math.ceil(16 / dd), Math.floor(36 / dd)), q = N / dd, ans = q * a;
            return {
              type: 'number', answer: ans,
              prompt: `${p.name} ${p.g('שאל', 'שאלה')} ${N} ילדים: "${sc.ask}"<br>השכיחות היחסית של התשובה "${cat}" היא ${m(F(a, dd))}. כמה ילדים בחרו ${cat}?`,
              hint: `${m(F(1, dd))} מ-${N} זה ${m(`${N} : ${dd}`)}.${a > 1 ? ` אחר כך ${c.g('כפול', 'כפלי')} במונה.` : ''}`,
              solution: [m(`${N} : ${dd} = ${q}`)].concat(a > 1 ? [m(`${q} × ${a} = ${ans}`)] : [], [`${chose(ans)} ${cat}.`]),
            };
          }
          const opt = c.pick([[20, 10], [20, 25], [40, 25], [40, 10], [50, 10], [50, 20], [60, 25], [30, 10], [20, 75], [40, 75]]);
          const [N, pct] = opt, g = HM.gcd(pct, 100), q = N / (100 / g), ans = q * (pct / g);
          return {
            type: 'number', answer: ans,
            prompt: `${p.name} ${p.g('שאל', 'שאלה')} ${N} ילדים: "${sc.ask}"<br>${pct}% מהילדים בחרו ${cat}. כמה ילדים בחרו ${cat}?`,
            hint: `${pct}% זה ${m(F(pct, 100))}. ${c.g('צמצם', 'צמצמי')} את השבר, ואז ${c.g('מצא', 'מצאי')} את החלק מ-${N}.`,
            solution: [`${pct}% = ${m(fr(pct, 100))}`, m(`${N} : ${100 / g} = ${q}`)].concat(pct / g > 1 ? [m(`${q} × ${pct / g} = ${ans}`)] : [], [`${chose(ans)} ${cat}.`]),
          };
        }
        case 'totalFromRel': {
          const sc = c.scene(SURVEYS), cat = c.pick(sc.cats), p = c.chance(0.5) ? c.me : c.friend();
          const dd = c.pick([3, 4, 5, 6]), a = c.pick(HM.range(1, dd - 1).filter((x) => HM.gcd(x, dd) === 1)), q = c.rnd(Math.max(2, Math.ceil(12 / dd)), Math.floor(36 / dd));
          const x = q * a, N = q * dd;
          return {
            type: 'number', answer: N,
            prompt: `${p.name} ${p.g('ערך', 'ערכה')} סקר: "${sc.ask}"<br>${x} ילדים בחרו ${cat}, ו${b('השכיחות היחסית')} של ${cat} היא ${m(F(a, dd))}. כמה ילדים השתתפו בסקר?`,
            hint: `${m(F(a, dd))} מהילדים הם ${x} ילדים. ${a > 1 ? `כמה ילדים הם ${m(F(1, dd))}? ` : ''}וכמה הם השלם, ${m(F(dd, dd))}?`,
            solution: (a > 1 ? [`${m(F(a, dd))} ← ${x} ילדים, לכן ${m(F(1, dd))} ← ${m(`${x} : ${a} = ${q}`)} ילדים.`] : [`${m(F(1, dd))} ← ${x} ילדים.`]).concat([`כל הילדים (${m(F(dd, dd))}): ${m(`${q} × ${dd} = ${N}`)}`, `בסקר השתתפו ${N} ילדים.`]),
          };
        }
        case 'relTwo': {
          const d = survey(c, 4, c.pick([12, 15, 16, 18, 20, 24]));
          const [i, j] = c.sample([0, 1, 2, 3], 2), x = d.f[i] + d.f[j];
          return {
            type: 'fraction', answer: { n: x, d: d.N },
            prompt: `${sIntro(d)}<br>איזה ${b('חלק')} מהילדים בחר ${d.cats[i]} ${b('או')} ${d.cats[j]}? ${c.g('כתוב', 'כתבי')} כשבר.`,
            visual: c.chance(0.5) ? ftable(d) : fchart(d, { hideValues: true }),
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה ילדים בחרו באחת משתי התשובות, ואז ${c.g('כתוב', 'כתבי')} שבר מתוך כל הילדים.`,
            solution: [`${d.cats[i]}: ${d.f[i]}, ${d.cats[j]}: ${d.f[j]} ← יחד ${m(`${d.f[i]} + ${d.f[j]} = ${x}`)}`, `מתוך ${d.N} ילדים: ${m(fr(x, d.N))}`],
          };
        }
        case 'toBeMode': {
          const d = survey(c, 4, c.rnd(16, 26), true);
          const y = c.pick([0, 1, 2, 3].filter((i) => i !== d.mi)), mf = d.f[d.mi], ans = mf - d.f[y] + 1, cat = d.cats[y];
          return {
            type: 'number', answer: ans,
            prompt: `${sIntro(d)}<br>עוד ילדים מצטרפים לסקר, וכולם בוחרים ${cat}. כמה ילדים ${b('לפחות')} צריכים להצטרף, כדי שהתשובה "${cat}" תהיה השכיח היחיד?`,
            visual: c.chance(0.5) ? ftable(d) : fchart(d),
            hint: `עכשיו השכיח הוא ${d.mode}, עם שכיחות ${mf}. השכיחות של "${cat}" צריכה להיות ${b('גדולה')} מ-${mf}, ולא רק שווה לה.`,
            solution: [`השכיחות של "${cat}" צריכה להגיע לפחות ל-${mf + 1}.`, m(`${mf + 1} − ${d.f[y]} = ${ans}`), `צריכים להצטרף לפחות ${ans} ילדים.`],
          };
        }
        case 'tf': {
          const d = survey(c, 4, c.pick([12, 16, 18, 20, 24]), true);
          const mf = d.f[d.mi], t = c.pick([0, 1, 2, 3].filter((i) => i !== d.mi)), x = d.f[t], cat = d.cats[t];
          const opts = [
            [`השכיח הוא ${mf}.`, false, `${mf} הוא מספר הפעמים (השכיחות) של ${d.mode}. השכיח הוא הנתון עצמו: ${d.mode}.`],
            [`השכיח הוא ${d.mode}.`, true, `ל"${d.mode}" יש השכיחות הגדולה ביותר (${mf}), לכן השכיח הוא ${d.mode}.`],
            [`השכיחות היחסית של ${cat} היא ${m(F(x, d.N))}.`, true, `${chose(x)} ${cat} מתוך ${d.N} ילדים: ${m(F(x, d.N))}.`],
            [`השכיחות היחסית של ${cat} היא ${m(F(x, d.N - x))}.`, false, `מחלקים במספר ${b('כל')} הילדים (${d.N}), לא רק במספר הילדים שלא בחרו ${cat}: ${m(F(x, d.N))}.`],
            [`יותר ממחצית הילדים בחרו ${d.mode}.`, mf * 2 > d.N, `${mf} מתוך ${d.N}. מחצית מ-${d.N} היא ${d.N / 2}, ו-${mf} ${mf * 2 > d.N ? 'גדול' : 'לא גדול'} ממנה.`],
          ];
          const [stmt, ans, expl] = c.pick(opts);
          return {
            type: 'tf', answer: ans,
            prompt: `${sIntro(d)}<br>${stmt}`,
            visual: ftable(d),
            hint: `${c.g('היזכר', 'היזכרי')}: השכיח הוא הנתון שמופיע הכי הרבה פעמים. שכיחות יחסית = השכיחות : מספר כל הנתונים.`,
            solution: [expl, ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
      }
    },
  });

  /* ============================================================
     דיאגרמה כפולה וקריאת גרפים
     ============================================================ */
  const CLASSES = [['ה׳1', 'ה׳2'], ['ה׳2', 'ה׳3'], ['ה׳1', 'ה׳3'], ['ה׳3', 'ה׳4']];
  const MONTHS = [['ספט׳', 'בספטמבר'], ['אוק׳', 'באוקטובר'], ['נוב׳', 'בנובמבר'], ['דצמ׳', 'בדצמבר']];
  const DAYS = [['יום א׳', 'ביום א׳'], ['יום ב׳', 'ביום ב׳'], ['יום ג׳', 'ביום ג׳'], ['יום ד׳', 'ביום ד׳']];
  const nth = (w, wIn) => HM.range(1, 4).map((i) => [`${w} ${i}`, `${wIn} ${i}`]);
  const DUOS = [
    { tags: ['reading'], the: 'הספרים', u: 'ספרים', verb: ['קרא', 'קראה'], verbPl: 'קראו', each: 'בכל חודש', which: 'באיזה חודש', per: MONTHS, lo: 1, hi: 8 },
    { tags: ['sport'], the: 'הגולים', u: 'גולים', verb: ['הבקיע', 'הבקיעה'], verbPl: 'הבקיעו', each: 'בכל משחק', which: 'באיזה משחק', per: nth('משחק', 'במשחק'), lo: 0, hi: 6 },
    { tags: ['baking'], the: 'העוגיות', u: 'עוגיות', verb: ['אפה', 'אפתה'], verbPl: 'אפו', each: 'בכל יום', which: 'באיזה יום', per: DAYS, lo: 2, hi: 12 },
    { tags: ['art'], the: 'הציורים', u: 'ציורים', verb: ['צייר', 'ציירה'], verbPl: 'ציירו', each: 'בכל חודש', which: 'באיזה חודש', per: MONTHS, lo: 1, hi: 9 },
    { tags: ['music'], the: 'השירים', u: 'שירים', verb: ['למד', 'למדה'], verbPl: 'למדו', each: 'בכל חודש', which: 'באיזה חודש', per: MONTHS, lo: 1, hi: 8 },
    { tags: ['nature'], the: 'הקילומטרים', u: 'קילומטרים', verb: ['הלך', 'הלכה'], verbPl: 'הלכו', each: 'בכל יום של הטיול', which: 'באיזה יום', per: DAYS, lo: 3, hi: 12 },
    { tags: ['tech'], the: 'אתגרי התכנות', u: 'אתגרי תכנות', verb: ['פתר', 'פתרה'], verbPl: 'פתרו', each: 'בכל שבוע', which: 'באיזה שבוע', per: nth('שבוע', 'בשבוע'), lo: 1, hi: 9 },
    { tags: ['games'], the: 'הכוכבים', u: 'כוכבים', verb: ['אסף', 'אספה'], verbPl: 'אספו', each: 'בכל שלב של המשחק', which: 'באיזה שלב', per: nth('שלב', 'בשלב'), lo: 1, hi: 10 },
    { tags: ['space'], the: 'הכוכבים הנופלים', u: 'כוכבים נופלים', verb: ['ראה', 'ראתה'], verbPl: 'ראו', each: 'בכל לילה', which: 'באיזה לילה', per: nth('לילה', 'בלילה'), lo: 0, hi: 8 },
    { tags: ['kpop'], the: 'הפוטוקארדים', u: 'פוטוקארדים', verb: ['אסף', 'אספה'], verbPl: 'אספו', each: 'בכל חודש', which: 'באיזה חודש', per: MONTHS, lo: 1, hi: 9 },
    { tags: ['magic'], the: 'הלחשים', u: 'לחשים', verb: ['למד', 'למדה'], verbPl: 'למדו', each: 'בכל שבוע בבית הספר לקוסמים', which: 'באיזה שבוע', per: nth('שבוע', 'בשבוע'), lo: 1, hi: 8 },
    { tags: ['squishy'], the: 'הסקווישים', u: 'סקווישים', verb: ['החליף', 'החליפה'], verbPl: 'החליפו', each: 'בכל חודש עם חברים', which: 'באיזה חודש', per: MONTHS, lo: 1, hi: 8 },
  ];
  // תרחיש לדיאגרמה כפולה: fam 1 = סקר בשתי כיתות, fam 2 = שני חברים לאורך זמן
  function makeDouble(c, force) {
    const pool = (force === 2 ? [] : SURVEYS.map((s) => ({ tags: s.tags, s, f: 1 }))).concat(force === 1 ? [] : DUOS.map((s) => ({ tags: s.tags, s, f: 2 })));
    const pk = c.scene(pool), s = pk.s;
    if (pk.f === 1) {
      const cl = c.pick(CLASSES), cats = c.sample(s.cats, 4), inn = (g) => 'ב' + cl[g];
      return {
        fam: 1, labels: cats, names: cl, title: s.title, lo: 1, hi: 9,
        intro: `בשתי כיתות שאלו את הילדים: "${s.ask}"`,
        val: (g, i) => `מספר הילדים ${inn(g)} שבחרו ${cats[i]}`,
        more: (gb, gs, i) => `בכמה ילדים יותר בחרו ${cats[i]} ${inn(gb)} מאשר ${inn(gs)}?`,
        moreStmt: (gb, gs, i) => `${inn(gb)} בחרו ${cats[i]} יותר ילדים מאשר ${inn(gs)}.`,
        which: (g) => `את ${s.which} בחרו יותר ילדים ${inn(g)} מאשר ${inn(1 - g)}?`,
        whichIn: 'ב' + s.which,
        top: (g) => `מה השכיח ${inn(g)}?`,
        who: (i) => `באיזו כיתה בחרו יותר ילדים ${cats[i]}?`,
        same: 'בשתי הכיתות אותו מספר',
        both: (i) => `כמה ילדים בשתי הכיתות יחד בחרו ${cats[i]}?`,
        total: (g) => `כמה ילדים ${inn(g)} השתתפו בסקר?`,
        totalStmt: (g) => `${inn(g)} השתתפו בסקר יותר ילדים מאשר ${inn(1 - g)}.`,
        totalWhat: 'מספר הילדים שהשתתפו בסקר בכל כיתה:',
      };
    }
    const P = [c.me, c.friend()];
    const vb = (g) => P[g].g(s.verb[0], s.verb[1]);
    return {
      fam: 2, labels: s.per.map((x) => x[0]), names: [P[0].name, P[1].name], title: `מספר ${s.the}`, lo: s.lo, hi: s.hi,
      intro: `הדיאגרמה מראה כמה ${s.u} ${s.verbPl} ${P[0].name} ו${P[1].name} ${s.each}.`,
      val: (g, i) => `מספר ${s.the} ש${vb(g)} ${P[g].name} ${s.per[i][1]}`,
      more: (gb, gs, i) => `${s.per[i][1]}, בכמה ${s.u} יותר ${vb(gb)} ${P[gb].name} מ${P[gs].name}?`,
      moreStmt: (gb, gs, i) => `${s.per[i][1]} ${vb(gb)} ${P[gb].name} יותר ${s.u} מ${P[gs].name}.`,
      which: (g) => `${s.which} ${vb(g)} ${P[g].name} יותר ${s.u} מ${P[1 - g].name}?`,
      whichIn: s.which,
      top: (g) => `${s.which} ${vb(g)} ${P[g].name} הכי הרבה ${s.u}?`,
      who: (i) => `מי ${s.verb[0]} יותר ${s.u} ${s.per[i][1]}?`,
      same: allF(P) ? 'לשתיהן אותו מספר' : 'לשניהם אותו מספר',
      both: (i) => `כמה ${s.u} ${s.verbPl} ${P[0].name} ו${P[1].name} יחד ${s.per[i][1]}?`,
      total: (g) => `כמה ${s.u} ${vb(g)} ${P[g].name} בסך הכול?`,
      totalStmt: (g) => `${P[g].name} ${vb(g)} בסך הכול יותר ${s.u} מ${P[1 - g].name}.`,
      totalWhat: `מספר ${s.the} בסך הכול:`,
    };
  }
  // k ערכים אקראיים עם לפחות 3 ערכים שונים (בלי דיאגרמות "שטוחות")
  const rndArr = (c, k, lo, hi) => {
    let a;
    for (let t = 0; t < 50; t++) { a = HM.range(1, k).map(() => c.rnd(lo, hi)); if (new Set(a).size >= Math.min(3, k)) break; }
    return a;
  };
  const dchart = (D, A, B, o) => chart2(Object.assign({ labels: D.labels, a: A, b: B, names: D.names, title: D.title, step: 1 }, o || {}));
  const TRUNC = [
    { tags: ['reading'], title: 'מבקרים בספרייה', noun: 'ילדים', what: 'ביקרו בספרייה' },
    { tags: ['sport'], title: 'צופים באימוני הקבוצה', noun: 'צופים', what: 'הגיעו לאימון' },
    { tags: ['baking'], title: 'עוגות שנמכרו ביריד', noun: 'עוגות', what: 'נמכרו ביריד' },
    { tags: ['nature'], title: 'מטיילים בשמורה', noun: 'מטיילים', what: 'ביקרו בשמורה' },
    { tags: ['games', 'tech'], title: 'שחקנים באתר המשחקים', noun: 'שחקנים', what: 'נכנסו לאתר המשחקים' },
    { tags: ['animals'], title: 'מבקרים בפינת החי', noun: 'מבקרים', what: 'הגיעו לפינת החי' },
    { tags: ['space'], title: 'מבקרים במצפה הכוכבים', noun: 'מבקרים', what: 'הגיעו למצפה הכוכבים' },
    { tags: ['music', 'art'], title: 'כרטיסים שנמכרו להופעה', noun: 'כרטיסים', what: 'נמכרו להופעה' },
    { tags: ['kpop'], title: 'מקלות אור שנמכרו בחנות המעריצים', noun: 'מקלות אור', what: 'נמכרו בחנות המעריצים' },
    { tags: ['magic'], title: 'ינשופי דואר שהגיעו לבית הספר', noun: 'ינשופים', what: 'הגיעו לבית הספר לקוסמים' },
    { tags: ['squishy'], title: 'סקווישים שנמכרו בחנות', noun: 'סקווישים', what: 'נמכרו בחנות הסקווישים' },
  ];
  // דיאגרמה עם ציר שמתחיל ב-B: יום X נראה פי r מיום Y
  function truncData(c) {
    const sc = c.scene(TRUNC), B = c.pick([40, 50, 60, 70, 80]);
    const dY = c.rnd(1, 3), r = c.pick([2, 3, 4].filter((q) => q * dY <= 9 && (q - 1) * dY >= 2)), dX = r * dY;
    const others = c.sample(HM.range(1, 9).filter((v) => v !== dY && v !== dX), 2);
    const [iX, iY] = c.sample([0, 1, 2, 3], 2), d = [];
    let k = 0;
    for (let i = 0; i < 4; i++) d.push(i === iX ? dX : i === iY ? dY : others[k++]);
    return { sc, B, r, iX, iY, vals: d.map((v) => B + v), X: DAYS[iX][1], Y: DAYS[iY][1], diff: dX - dY };
  }

  HM.lesson({
    id: 'data-double',
    learn: (c) => {
      const cats = ['כדורגל', 'כדורסל', 'שחייה', 'טניס'], A = [8, 5, 4, 3], B = [6, 7, 4, 5];
      const ch = (o) => chart2(Object.assign({ labels: cats, a: A, b: B, names: ['ה׳1', 'ה׳2'], title: 'ענף הספורט האהוב', step: 1 }, o || {}));
      return [
        {
          title: 'שתי קבוצות בדיאגרמה אחת',
          html: `${c.name} ${c.g('רצה', 'רצתה')} להשוות בין ה׳1 לה׳2: איזה ענף ספורט כל כיתה הכי אוהבת?<br>במקום לצייר שתי דיאגרמות נפרדות, ציירנו ${b('דיאגרמת עמודות כפולה')}: לכל ענף יש ${b('שתי עמודות צמודות')} — אחת לכל כיתה. כך קל להשוות.`,
          visual: ch({ values: true }),
        },
        {
          title: 'המקרא',
          html: `${b('המקרא')} (מעל הדיאגרמה) מספר איזה צבע שייך לאיזו קבוצה.<br>• כל זוג עמודות שייך לנתון אחד (ענף אחד).<br>• את הגובה של כל עמודה ${c.g('קרא', 'קראי')} בציר שמימין.<br>למשל, בכדורסל: 5 ילדים מה׳1 ו-7 ילדים מה׳2.`,
          visual: ch(),
          quiz: {
            type: 'number', prompt: 'כמה ילדים בה׳2 בחרו טניס?', answer: 5,
            hint: c.g('מצא', 'מצאי') + ' במקרא את הצבע של ה׳2, ואז את העמודה בצבע הזה מעל "טניס".',
            solution: ['העמודה של ה׳2 מעל "טניס" מגיעה עד 5.'],
          },
        },
        {
          title: 'משווים בין הקבוצות',
          html: 'מה אפשר ללמוד מהדיאגרמה הכפולה?',
          visual: ch({ values: true }),
          steps: [
            'בכדורגל: 8 ילדים בה׳1 ו-6 בה׳2 ← בה׳1 בחרו 2 ילדים יותר.',
            'בשחייה: 4 ילדים בכל כיתה ← אין הבדל.',
            'השכיח בה׳1 הוא כדורגל, והשכיח בה׳2 הוא כדורסל.',
            `בה׳1 השתתפו ${m('8 + 5 + 4 + 3 = 20')} ילדים, ובה׳2 ${m('6 + 7 + 4 + 5 = 22')} ילדים.`,
          ],
        },
        {
          title: 'זהירות: הציר לא מתחיל ב-0!',
          html: `ה׳1 אספה 52 בקבוקים למחזור, וה׳2 אספה 56. ${c.g('הסתכל', 'הסתכלי')} בשתי הדיאגרמות: ${b('הנתונים זהים')}!<br>בדיאגרמה שהציר שלה מתחיל ב-50, עמודה אחת נראית פי 3 מהשנייה — אבל באמת ההפרש הוא רק 4 בקבוקים.<br>${c.g('בדוק', 'בדקי')} תמיד ${b('מאיזה מספר מתחיל הציר')}.`,
          visual: `<div class="row">${chart2({ labels: ['ה׳1', 'ה׳2'], a: [52, 56], title: 'הציר מתחיל ב-0', w: 220, h: 240, step: 10, max: 70, values: true })}${chart2({ labels: ['ה׳1', 'ה׳2'], a: [52, 56], title: 'הציר מתחיל ב-50', w: 220, h: 240, min: 50, step: 1, max: 57, values: true })}</div>`,
        },
        {
          title: 'מסקנה נכונה?',
          html: `מדיאגרמה מסיקים רק מה שהנתונים באמת אומרים:<br>• "בה׳1 כולם אוהבים כדורגל" — ${b('לא נכון')}: רק 8 מתוך 20.<br>• "בה׳2 בחרו כדורסל יותר ילדים מאשר בה׳1" — ${b('נכון')}: 7 לעומת 5.<br>• כשהקבוצות בגודל שונה, ${c.g('השווה', 'השווי')} את ${b('החלק')} מכל קבוצה (השכיחות היחסית), ולא רק את מספר הילדים.`,
          visual: ch({ values: true }),
          quiz: {
            type: 'tf', prompt: 'בה׳1 ובה׳2 בחרו שחייה אותו מספר ילדים.', answer: true,
            hint: c.g('השווה', 'השווי') + ' את שתי העמודות מעל "שחייה".',
            solution: ['בשתי הכיתות 4 ילדים בחרו שחייה — הטענה נכונה.'],
          },
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['read', 'who', 'more', 'total', 'read']
        : level === 2 ? ['which', 'maxDiff', 'tf', 'cmpTotals', 'readHidden', 'top']
        : ['truncTf', 'truncWhy', 'truncDiff', 'conclusion', 'relCompare', 'maxDiff'];
      const kind = c.pick(kinds);
      if (kind.indexOf('trunc') === 0) {
        const T = truncData(c), sc = T.sc;
        const vis = chart2({ labels: DAYS.map((x) => x[0]), a: T.vals, min: T.B, step: kind === 'truncDiff' ? 1 : 2, max: T.B + 10, title: sc.title, values: kind !== 'truncDiff' });
        const real = `באמת: ${T.X} — ${T.vals[T.iX]}, ${T.Y} — ${T.vals[T.iY]}. ההפרש הוא רק ${T.diff}.`;
        if (kind === 'truncTf') {
          const fake = c.chance(0.65);
          return {
            type: 'tf', answer: !fake,
            prompt: `לפי הדיאגרמה: ${fake ? `${T.X} ${sc.what} פי ${T.r} ${sc.noun} מאשר ${T.Y}.` : `${T.X} ${sc.what} ${T.diff} ${sc.noun} יותר מאשר ${T.Y}.`}`,
            visual: vis,
            hint: `${c.g('קרא', 'קראי')} את המספרים עצמם, ולא רק את גובה העמודות. ${c.g('שים לב', 'שימי לב')} מאיזה מספר מתחיל הציר.`,
            solution: [`הציר מתחיל ב-${T.B}, ולכן ההבדל בין העמודות נראה גדול.`, real, fake ? `${T.vals[T.iX]} הוא לא פי ${T.r} מ-${T.vals[T.iY]} — הטענה לא נכונה.` : 'הטענה נכונה.'],
          };
        }
        if (kind === 'truncWhy') {
          const f = c.friend();
          return {
            type: 'choice', answer: 0,
            choices: [`הציר מתחיל ב-${T.B} ולא ב-0`, 'העמודות מסודרות מימין לשמאל', 'המספרים בציר עולים בקפיצות של 2', 'לכל העמודות יש אותו צבע'],
            prompt: `${f.name} ${f.g('הסתכל', 'הסתכלה')} בדיאגרמה ${f.g('ואמר', 'ואמרה')}: "${T.X} ${sc.what} פי ${T.r} ${sc.noun} מאשר ${T.Y}!"<br>מה גרם ל${f.g('ו', 'ה')} לטעות?`,
            visual: vis,
            hint: `${c.g('הסתכל', 'הסתכלי')} על הציר שמימין: מאיזה מספר הוא מתחיל?`,
            solution: [`הציר מתחיל ב-${T.B}, ולכן רואים רק את ה"קצוות" של העמודות.`, real],
          };
        }
        return {
          type: 'number', answer: T.diff,
          prompt: `בכמה ${sc.noun} יותר ${sc.what} ${T.X} מאשר ${T.Y}?`,
          visual: vis,
          hint: `${c.g('אל תשווה', 'אל תשווי')} רק את גובה העמודות. ${c.g('קרא', 'קראי')} בציר את המספר המדויק של כל עמודה. הציר מתחיל ב-${T.B}!`,
          solution: [`${T.X}: ${T.vals[T.iX]}, ${T.Y}: ${T.vals[T.iY]}.`, m(`${T.vals[T.iX]} − ${T.vals[T.iY]} = ${T.diff}`)],
        };
      }
      if (kind === 'relCompare') {
        const sc = c.scene(SURVEYS), cat = c.pick(sc.cats), cl = c.pick(CLASSES);
        const FR = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
        let p1, p2, N1, N2, x1, x2;
        const same = c.chance(0.2);
        for (let t = 0; t < 300; t++) {
          p1 = c.pick(FR); p2 = same ? p1 : c.pick(FR);
          if (!same && p1[0] * p2[1] === p2[0] * p1[1]) continue;
          N1 = p1[1] * c.rnd(Math.ceil(16 / p1[1]), Math.floor(36 / p1[1]));
          N2 = p2[1] * c.rnd(Math.ceil(16 / p2[1]), Math.floor(36 / p2[1]));
          x1 = (N1 / p1[1]) * p1[0]; x2 = (N2 / p2[1]) * p2[0];
          if (N1 === N2) continue;
          const big = p1[0] * p2[1] > p2[0] * p1[1] ? 1 : 2;
          if (same ? x1 !== x2 : (big === 1 ? x2 > x1 : x1 > x2)) break; // מלכודת: יותר ילדים אבל חלק קטן יותר
        }
        const v1 = p1[0] / p1[1], v2 = p2[0] / p2[1], ans = Math.abs(v1 - v2) < 1e-9 ? 2 : v1 > v2 ? 0 : 1;
        const L = HM.lcm(p1[1], p2[1]);
        return {
          type: 'choice', keep: true, answer: ans,
          choices: [cl[0], cl[1], 'בשתי הכיתות אותו חלק'],
          prompt: `בשתי כיתות שאלו: "${sc.ask}"<br>באיזו כיתה ${b('חלק גדול יותר')} מהילדים בחר ${cat}?`,
          visual: V.table(['כיתה', 'מספר הילדים', `בחרו ${cat}`], [[cl[0], N1, x1], [cl[1], N2, x2]]),
          hint: `הכיתות בגודל שונה, ולכן לא מספיק להשוות כמה ילדים בחרו. ${c.g('כתוב', 'כתבי')} לכל כיתה שבר: כמה בחרו מתוך כל הילדים.`,
          solution: [`${cl[0]}: ${m(fr(x1, N1))}`, `${cl[1]}: ${m(fr(x2, N2))}`,
            ans === 2 ? 'השברים שווים — בשתי הכיתות אותו חלק.' : `${m(F((p1[0] * L) / p1[1], L) + signOf(v1, v2) + F((p2[0] * L) / p2[1], L))} ← החלק גדול יותר ב${cl[ans]}.`],
        };
      }
      const D = makeDouble(c, kind === 'conclusion' ? 1 : 0);
      let A = rndArr(c, 4, D.lo, D.hi), B = rndArr(c, 4, D.lo, D.hi);
      const nm = D.names, arr = (g) => (g ? B : A);
      switch (kind) {
        case 'read':
        case 'readHidden': {
          const hid = kind === 'readHidden', g = c.rnd(0, 1), i = c.rnd(0, 3);
          const sumQ = hid && c.chance(0.5);
          return {
            type: 'number', answer: sumQ ? A[i] + B[i] : arr(g)[i],
            prompt: `${D.intro}<br>${sumQ ? D.both(i) : `מה ${D.val(g, i)}?`}`,
            visual: dchart(D, A, B, { values: !hid }),
            hint: sumQ ? `${c.g('קרא', 'קראי')} את הגובה של שתי העמודות מעל "${D.labels[i]}" ${c.g('וחבר', 'וחברי')} אותם.` : `${c.g('הסתכל', 'הסתכלי')} במקרא: איזה צבע שייך ל${nm[g]}? אחר כך ${c.g('מצא', 'מצאי')} את העמודה בצבע הזה מעל "${D.labels[i]}".`,
            solution: sumQ ? [`מעל "${D.labels[i]}": ${nm[0]} — ${A[i]}, ${nm[1]} — ${B[i]}.`, m(`${A[i]} + ${B[i]} = ${A[i] + B[i]}`)] : [`העמודה של ${nm[g]} מעל "${D.labels[i]}" מגיעה עד ${arr(g)[i]}.`, `${D.val(g, i)} הוא ${arr(g)[i]}.`],
          };
        }
        case 'who': {
          const i = c.rnd(0, 3);
          if (c.chance(0.25)) B[i] = A[i]; else if (A[i] === B[i]) B[i] = A[i] > D.lo ? A[i] - 1 : A[i] + 1;
          const ans = A[i] > B[i] ? 0 : A[i] < B[i] ? 1 : 2;
          return {
            type: 'choice', keep: true, answer: ans, choices: [nm[0], nm[1], D.same],
            prompt: `${D.intro}<br>${D.who(i)}`,
            visual: dchart(D, A, B, { values: level === 1 }),
            hint: `${c.g('השווה', 'השווי')} בין שתי העמודות הצמודות מעל "${D.labels[i]}". ${c.g('היעזר', 'היעזרי')} במקרא.`,
            solution: [`מעל "${D.labels[i]}": ${nm[0]} — ${A[i]}, ${nm[1]} — ${B[i]}.`, ans === 2 ? 'המספרים שווים.' : `${Math.max(A[i], B[i])} גדול מ-${Math.min(A[i], B[i])}, לכן התשובה: ${nm[ans]}.`],
          };
        }
        case 'more': {
          const i = c.rnd(0, 3);
          if (A[i] === B[i]) B[i] = A[i] > D.lo ? A[i] - 1 : A[i] + 1;
          const gb = A[i] > B[i] ? 0 : 1, big = arr(gb)[i], small = arr(1 - gb)[i];
          return {
            type: 'number', answer: big - small,
            prompt: `${D.intro}<br>${D.more(gb, 1 - gb, i)}`,
            visual: dchart(D, A, B, { values: true }),
            hint: `${c.g('מצא', 'מצאי')} את שתי העמודות מעל "${D.labels[i]}", ${c.g('וחשב', 'וחשבי')} את ההפרש ביניהן.`,
            solution: [`${nm[gb]}: ${big}, ${nm[1 - gb]}: ${small}.`, m(`${big} − ${small} = ${big - small}`)],
          };
        }
        case 'total': {
          const g = c.rnd(0, 1), tot = SUM(arr(g));
          return {
            type: 'number', answer: tot,
            prompt: `${D.intro}<br>${D.total(g)}`,
            visual: dchart(D, A, B, { values: true }),
            hint: `${c.g('חבר', 'חברי')} את המספרים של כל העמודות בצבע של ${nm[g]}.`,
            solution: [m(`${plus(arr(g))} = ${tot}`), `התשובה: ${tot}.`],
          };
        }
        case 'top': {
          const g = c.rnd(0, 1);
          for (let t = 0; t < 50 && !uniqMax(arr(g)); t++) { if (g) B = rndArr(c, 4, D.lo, D.hi); else A = rndArr(c, 4, D.lo, D.hi); }
          if (!uniqMax(arr(g))) { const ar = arr(g); ar[0] = MX(ar) + 1; }
          const ar = arr(g), mi = ar.indexOf(MX(ar));
          const choices = [D.labels[mi]].concat(D.labels.filter((x, i) => i !== mi), D.fam === 1 ? [String(ar[mi])] : []);
          return {
            type: 'choice', answer: 0, choices,
            prompt: `${D.intro}<br>${D.top(g)}`,
            visual: dchart(D, A, B, { values: true }),
            hint: `${c.g('הסתכל', 'הסתכלי')} רק על העמודות בצבע של ${nm[g]}, ${c.g('ומצא', 'ומצאי')} את הגבוהה ביותר.`,
            solution: [`העמודה הגבוהה ביותר של ${nm[g]} נמצאת מעל "${D.labels[mi]}" (${ar[mi]}).`, `התשובה: ${D.labels[mi]}.`],
          };
        }
        case 'which': {
          const g = c.rnd(0, 1), t = c.rnd(0, 3), G = [], O = [];
          for (let i = 0; i < 4; i++) {
            if (i === t) { const v = c.rnd(D.lo + 1, D.hi); G.push(v); O.push(c.rnd(D.lo, v - 1)); }
            else { const v = c.rnd(D.lo + 1, D.hi); O.push(v); G.push(c.rnd(D.lo, v)); }
          }
          if (g) { B = G; A = O; } else { A = G; B = O; }
          return {
            type: 'choice', answer: t, choices: D.labels.slice(),
            prompt: `${D.intro}<br>${D.which(g)}`,
            visual: dchart(D, A, B),
            hint: `${c.g('עבור', 'עברי')} על כל זוג עמודות, ${c.g('ובדוק', 'ובדקי')} איפה העמודה של ${nm[g]} גבוהה יותר.`,
            solution: [`רק מעל "${D.labels[t]}" העמודה של ${nm[g]} גבוהה יותר: ${G[t]} לעומת ${O[t]}.`],
          };
        }
        case 'maxDiff': {
          const df = () => A.map((x, i) => Math.abs(x - B[i]));
          for (let t = 0; t < 80 && !uniqMax(df()); t++) { A = rndArr(c, 4, D.lo, D.hi); B = rndArr(c, 4, D.lo, D.hi); }
          if (!uniqMax(df())) { A = [D.lo + 1, D.lo + 6, D.lo + 3, D.lo + 2]; B = [D.lo + 2, D.lo + 1, D.lo + 3, D.lo + 4]; }
          const d = df(), t = d.indexOf(MX(d));
          return {
            type: 'choice', answer: t, choices: D.labels.slice(),
            prompt: `${D.intro}<br>${D.whichIn} ההפרש בין ${nm[0]} ל${nm[1]} הכי גדול?`,
            visual: dchart(D, A, B, { values: level === 2 }),
            hint: `${c.g('חשב', 'חשבי')} את ההפרש בכל זוג עמודות: הגבוהה פחות הנמוכה.`,
            solution: [D.labels.map((l, i) => `${l}: ${d[i]}`).join(', '), `ההפרש הגדול ביותר (${d[t]}) הוא ב"${D.labels[t]}".`],
          };
        }
        case 'tf': {
          const ty = c.rnd(0, 2);
          let stmt, ans, sol;
          if (ty === 0) {
            const i = c.rnd(0, 3); if (A[i] === B[i]) B[i] = A[i] > D.lo ? A[i] - 1 : A[i] + 1;
            const gb = c.rnd(0, 1); stmt = D.moreStmt(gb, 1 - gb, i); ans = arr(gb)[i] > arr(1 - gb)[i];
            sol = [`מעל "${D.labels[i]}": ${nm[0]} — ${A[i]}, ${nm[1]} — ${B[i]}.`];
          } else if (ty === 1) {
            const g = c.rnd(0, 1), i = c.rnd(0, 3); if (A[i] === B[i]) B[i] = A[i] > D.lo ? A[i] - 1 : A[i] + 1;
            ans = c.chance(0.5); const x = ans ? arr(g)[i] : arr(1 - g)[i];
            stmt = `${D.val(g, i)} הוא ${x}.`; sol = [`העמודה של ${nm[g]} מעל "${D.labels[i]}" מגיעה עד ${arr(g)[i]}.`];
          } else {
            if (SUM(A) === SUM(B)) A[0] += A[0] < D.hi ? 1 : -1;
            const g = c.rnd(0, 1); stmt = D.totalStmt(g); ans = SUM(arr(g)) > SUM(arr(1 - g));
            sol = [`${nm[0]}: ${m(plus(A) + ' = ' + SUM(A))}`, `${nm[1]}: ${m(plus(B) + ' = ' + SUM(B))}`];
          }
          return {
            type: 'tf', answer: ans, prompt: `${D.intro}<br>${stmt}`,
            visual: dchart(D, A, B),
            hint: `${c.g('היעזר', 'היעזרי')} במקרא כדי לדעת איזה צבע שייך למי, ${c.g('ובדוק', 'ובדקי')} את המספרים בציר.`,
            solution: sol.concat([ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.']),
          };
        }
        case 'cmpTotals': {
          if (c.chance(0.2)) { B = A.slice().reverse(); B[0] = A[3]; }
          const sa = SUM(A), sb = SUM(B);
          return {
            type: 'compare', left: nm[0], right: nm[1], lv: sa, rv: sb, answer: cmpAns(sa, sb),
            prompt: `${D.intro}<br>${c.g('השלם', 'השלימי')} את הסימן &gt;, &lt; או = — ${D.totalWhat}`,
            visual: dchart(D, A, B, { values: true }),
            hint: `${c.g('חבר', 'חברי')} את כל העמודות בצבע אחד, ואחר כך את כל העמודות בצבע השני.`,
            solution: [`${nm[0]}: ${m(plus(A) + ' = ' + sa)}`, `${nm[1]}: ${m(plus(B) + ' = ' + sb)}`, m(`${sa}${signOf(sa, sb)}${sb}`)],
          };
        }
        case 'conclusion': {
          // D הוא סקר בשתי כיתות
          for (let t = 0; t < 60 && !(uniqMax(A) && uniqMax(B) && A.indexOf(MX(A)) !== B.indexOf(MX(B)) && SUM(A) !== SUM(B)); t++) { A = rndArr(c, 4, 1, 9); B = rndArr(c, 4, 1, 9); }
          if (!(uniqMax(A) && uniqMax(B) && A.indexOf(MX(A)) !== B.indexOf(MX(B)) && SUM(A) !== SUM(B))) { A = [7, 3, 2, 4]; B = [4, 8, 2, 5]; }
          const mA = D.labels[A.indexOf(MX(A))], mB = D.labels[B.indexOf(MX(B))];
          const i = [0, 1, 2, 3].filter((k) => A[k] !== B[k])[0];
          const gT = A[i] > B[i] ? 0 : 1;
          const big = SUM(A) > SUM(B) ? 0 : 1;
          const trues = [[`השכיח ב${nm[0]} הוא ${mA}.`, `העמודה הגבוהה ביותר של ${nm[0]} היא ${mA}.`], [D.moreStmt(gT, 1 - gT, i), `מעל "${D.labels[i]}": ${A[i]} לעומת ${B[i]}.`], [D.totalStmt(big), `${nm[0]}: ${SUM(A)} ילדים, ${nm[1]}: ${SUM(B)} ילדים.`]];
          const falses = [`השכיח ב${nm[0]} הוא ${mB}.`, D.moreStmt(1 - gT, gT, i), `כל הילדים ב${nm[0]} בחרו ${mA}.`, D.totalStmt(1 - big)];
          const tr = c.pick(trues), fs = c.sample(falses, 3);
          return {
            type: 'choice', answer: 0, choices: [tr[0]].concat(fs),
            prompt: `${D.intro}<br>איזו מסקנה ${b('נכונה')} לפי הדיאגרמה?`,
            visual: dchart(D, A, B, { values: true }),
            hint: `${c.g('בדוק', 'בדקי')} כל משפט מול המספרים בדיאגרמה, ${c.g('ושים לב', 'ושימי לב')} לצבעים שבמקרא.`,
            solution: [tr[1], `לכן המסקנה הנכונה: ${tr[0]}`],
          };
        }
      }
      return null;
    },
  });

  /* ============================================================
     משמעות הממוצע
     ============================================================ */
  HM.lesson({
    id: 'data-mean',
    learn: (c) => {
      const fr3 = crew(c, 3), names = [c.name].concat(fr3.map((p) => p.name)), vals = [2, 6, 3, 5];
      const girls = allF([c.me].concat(fr3));
      return [
        {
          title: 'לחלק שווה בשווה',
          html: `${andJoin(names)} אספו צדפים בחוף: ${andNums(vals)}.<br>${girls ? 'הן' : 'הם'} החליטו ${b('לחלק אותם שווה בשווה')}. כמה ${girls ? 'תקבל כל אחת' : 'יקבל כל אחד'}?<br>מחברים: ${m('2 + 6 + 3 + 5 = 16')}, ומחלקים ל-4: ${m('16 : 4 = 4')}.<br>המספר 4 הוא ${b('הממוצע')} של הנתונים.`,
          visual: towers(vals, { labels: names }),
        },
        {
          title: 'הממוצע כהשוואת עמודות',
          html: `${c.g('דמיין', 'דמייני')} שכל צדף הוא קובייה. מעבירים קוביות מהמגדלים הגבוהים לנמוכים, עד שכל המגדלים ${b('באותו גובה')}.<br>הגובה המשותף — 4 — הוא הממוצע.<br>הקוביות שמעל הקו המקווקו ממלאות בדיוק את החורים שמתחתיו.`,
          visual: towers(vals, { labels: names, line: 4 }),
        },
        {
          title: 'איך מחשבים ממוצע?',
          html: `${HM.hl('ממוצע = סכום הנתונים : מספר הנתונים')}<br>1. ${c.g('חבר', 'חברי')} את כל הנתונים.<br>2. ${c.g('חלק', 'חלקי')} את הסכום במספר הנתונים.<br>דוגמה: מספר הנקודות של ${fr3[0].name} ב-5 משחקים: ${HM.seq([8, 12, 6, 10, 14])}`,
          steps: [
            `סכום הנתונים: ${m('8 + 12 + 6 + 10 + 14 = 50')}`,
            'מספר הנתונים: 5 (חמישה משחקים).',
            `${m('50 : 5 = 10')} ← הממוצע הוא 10 נקודות במשחק.`,
          ],
          quiz: {
            type: 'number', prompt: `מה הממוצע של ${HM.seq([3, 9, 6])}?`, answer: 6,
            hint: c.g('חבר', 'חברי') + ' ואז ' + c.g('חלק', 'חלקי') + ' ב-3.',
            solution: [m('3 + 9 + 6 = 18'), m('18 : 3 = 6')],
          },
        },
        {
          title: 'ממוצע מטבלת שכיחויות',
          html: `לפעמים הנתונים מגיעים בטבלת שכיחויות. כאן: מספר האחים והאחיות של 10 ילדים.<br>כל שורה אומרת ${b('כמה ילדים')} יש להם אותו נתון. למשל, ל-4 ילדים יש אח אחד או אחות אחת.`,
          visual: V.table(['מספר האחים והאחיות', 'מספר ילדים'], [[1, 4], [2, 3], [3, 2], [4, 1]]),
          steps: [
            `סכום הנתונים: ${m('1 × 4 + 2 × 3 + 3 × 2 + 4 × 1 = 20')}`,
            `מספר הנתונים הוא מספר הילדים: ${m('4 + 3 + 2 + 1 = 10')}`,
            `הממוצע: ${m('20 : 10 = 2')} אחים ואחיות לילד.`,
            `${c.g('שים לב', 'שימי לב')}: השכיח כאן הוא 1, והממוצע 2. הם לא תמיד שווים!`,
          ],
        },
        {
          title: 'אומדן לפני חישוב',
          html: `לפני שמחשבים כדאי ${b('לאמוד')}: הממוצע תמיד בין הנתון הקטן ביותר לגדול ביותר, ובדרך כלל קרוב ל"אמצע" של הנתונים.<br>למשל: ${HM.seq([38, 42, 41, 39, 45])} ← הממוצע בערך 40.<br>אם יצא לך 205 — שכחת לחלק!`,
          quiz: {
            type: 'choice', keep: true, prompt: `בלי לחשב בדיוק: מה בערך הממוצע של ${HM.seq([19, 22, 18, 21])}?`,
            choices: ['בערך 10', 'בערך 20', 'בערך 30', 'בערך 80'], answer: 1,
            hint: 'הממוצע נמצא בין הנתון הקטן ביותר לגדול ביותר.',
            solution: ['כל הנתונים בין 18 ל-22, לכן הממוצע בערך 20.', `בדיוק: ${m('80 : 4 = 20')}`],
          },
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['level', 'share', 'calc', 'sumFromMean', 'lineTf', 'storyEasy']
        : level === 2 ? ['story', 'freqTable', 'readMean', 'estimate', 'moves', 'sumFromMean']
        : ['missing', 'buildChoice', 'buildSlots', 'freqChartMean', 'meanCompare', 'missing'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'level':
        case 'share': {
          const sc = c.scene(SHARE), n = c.pick([3, 4]), team = crew(c, n, true), names = team.map((p) => p.name);
          const M = c.rnd(level === 1 ? 2 : 3, level === 1 ? 6 : 9), vals = withMean(c, n, M, 1, level === 1 ? 10 : 15), s = n * M;
          const each = allF(team) ? 'תקבל כל אחת' : 'יקבל כל אחד', eachS = allF(team) ? 'כל אחת תקבל' : 'כל אחד יקבל';
          if (kind === 'level') {
            return {
              type: 'number', answer: M,
              prompt: `הציור מראה כמה ${sc.obj} ${sc.verb} ${andJoin(names)} (כל קובייה היא אחד).<br>אם נעביר קוביות מהמגדלים הגבוהים לנמוכים, עד שכולם יהיו ${b('באותו גובה')} — מה יהיה הגובה של כל מגדל?`,
              visual: towers(vals, { labels: names }),
              hint: `${c.g('ספור', 'ספרי')} את כל הקוביות, ${c.g('וחלק', 'וחלקי')} אותן שווה בשווה בין ${n} המגדלים.`,
              solution: [`סך הכול: ${m(plus(vals) + ' = ' + s)} קוביות.`, m(`${s} : ${n} = ${M}`), `כל מגדל יהיה בגובה ${M} — זה הממוצע.`],
            };
          }
          return {
            type: 'number', answer: M,
            prompt: `${andJoin(names)} ${sc.act}, והחליטו לחלק ${sc.them} ${b('שווה בשווה')}. כמה ${sc.obj} ${each}?`,
            visual: V.table(names, [vals]),
            hint: `${c.g('חבר', 'חברי')} כמה ${sc.obj} יש בסך הכול, ${c.g('וחלק', 'וחלקי')} במספר הילדים.`,
            solution: [m(`${plus(vals)} = ${s}`), m(`${s} : ${n} = ${M}`), `${eachS} ${M} — זה הממוצע.`],
          };
        }
        case 'calc': {
          const n = c.pick([3, 4]), M = c.rnd(3, 9), vals = withMean(c, n, M, 1, 15), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `מה הממוצע של המספרים ${HM.seq(vals)}?<br>${m(`(${plus(vals)}) : ${n} = ` + HM.slot(0))}`,
            hint: `קודם ${c.g('חבר', 'חברי')} את כל המספרים, ואז ${c.g('חלק', 'חלקי')} ב-${n} — מספר הנתונים.`,
            solution: [m(`${plus(vals)} = ${s}`), m(`${s} : ${n} = ${M}`)],
          };
        }
        case 'storyEasy':
        case 'story': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend();
          const n = level === 1 ? 3 : c.pick([4, 5, 6]);
          const M = c.rnd(sc.lo + 1, sc.hi - 1), vals = withMean(c, n, M, sc.lo, sc.hi), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.ask(p)}`,
            hint: `ממוצע = סכום הנתונים : מספר הנתונים. כאן יש ${n} נתונים.`,
            solution: [m(`${plus(vals)} = ${s}`), m(`${s} : ${n} = ${M}`), `בממוצע: ${M}.`],
          };
        }
        case 'sumFromMean': {
          if (level === 1 || c.chance(0.5)) {
            const sc = c.scene(SHARE), n = c.rnd(3, 6), M = c.rnd(3, 9);
            return {
              type: 'number', answer: n * M,
              prompt: `${n} ילדים ${sc.act}, וחילקו ${sc.them} שווה בשווה. כל ילד קיבל ${M} ${sc.obj}.<br>כמה ${sc.obj} היו בסך הכול?`,
              hint: `ממוצע = סכום : מספר הנתונים. לכן הסכום = ממוצע × מספר הנתונים.`,
              solution: [m(`${M} × ${n} = ${n * M}`), `היו ${n * M} ${sc.obj}.`],
            };
          }
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.rnd(4, 7), M = c.rnd(sc.lo + 1, sc.hi - 1);
          return {
            type: 'number', answer: n * M,
            prompt: `${sc.avg(p, n, M)}<br>${sc.tot(p)}`,
            hint: `ממוצע = סכום : מספר הנתונים. איזה מספר, כשמחלקים אותו ב-${n}, נותן ${M}?`,
            solution: [`ממוצע = סכום : ${n}, לכן הסכום = ממוצע × ${n}.`, m(`${M} × ${n} = ${n * M}`)],
          };
        }
        case 'lineTf': {
          const n = 4, M = c.rnd(3, 6), vals = withMean(c, n, M, 1, 9), L = c.chance(0.5) ? M : M + c.pick([-1, 1]);
          const s = n * M;
          return {
            type: 'tf', answer: L === M,
            prompt: `הקו המקווקו נמצא ${b('בגובה הממוצע')} של ארבעת המגדלים.`,
            visual: towers(vals, { line: L }),
            hint: `${c.g('ספור', 'ספרי')} את הקוביות שמעל הקו ואת החורים שמתחתיו. בגובה הממוצע הם שווים.`,
            solution: [m(`(${plus(vals)}) : ${n} = ${s} : ${n} = ${M}`), L === M ? `הקו בגובה ${L} — בדיוק הממוצע. הטענה נכונה.` : `הקו בגובה ${L}, אבל הממוצע הוא ${M}. הטענה לא נכונה.`],
          };
        }
        case 'freqTable':
        case 'freqChartMean': {
          const sc = c.scene(FTABLES), d = ftData(c, sc, kind === 'freqTable' ? c.pick([3, 4]) : 4), p = c.chance(0.5) ? c.me : c.friend();
          const chart = kind === 'freqChartMean';
          return {
            type: 'number', answer: d.M,
            prompt: chart
              ? `${p.name} ${p.g('בדק', 'בדקה')} ${sc.t}, ${p.g('וסידר', 'וסידרה')} את התוצאות בדיאגרמה. מתחת לכל עמודה רשום הנתון, והגובה הוא ${sc.colDef}.<br>מה ${sc.q}?`
              : `${p.name} ${p.g('בדק', 'בדקה')} ${sc.t}, ${p.g('וסידר', 'וסידרה')} את התוצאות בטבלה.<br>מה ${sc.q}?`,
            visual: chart
              ? V.barChart({ labels: d.vals.map(String), values: d.f, xTitle: sc.head, w: 380, h: 260, max: MX(d.f) + 1, step: 1, hideValues: true })
              : V.table([sc.head, sc.col], d.vals.map((v, i) => [v, d.f[i]])),
            hint: chart
              ? `${c.g('שים לב', 'שימי לב')}: הנתונים הם המספרים ${b('מתחת')} לעמודות, והגובה הוא השכיחות. ${c.g('כפול', 'כפלי')} כל נתון בשכיחות שלו.`
              : `${c.g('כפול', 'כפלי')} כל נתון בשכיחות שלו ${c.g('וחבר', 'וחברי')}. אחר כך ${c.g('חלק', 'חלקי')} ב${sc.colDef} — סכום השכיחויות.`,
            solution: ftSolution(c, sc, d),
          };
        }
        case 'readMean': {
          const sc = c.scene(NUMS.filter((x) => x.hi <= 12)), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([4, 5]);
          const M = c.rnd(sc.lo + 1, sc.hi - 2), vals = withMean(c, n, M, sc.lo, sc.hi), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `${sc.intro(p, n).replace(/:$/, '')} — בדיאגרמה.<br>${sc.ask(p)}`,
            visual: V.barChart({ labels: numLabels(sc, n), values: vals, w: 400, h: 260, max: MX(vals) + 1, step: 1, hideValues: true }),
            hint: `${c.g('קרא', 'קראי')} את הגובה של כל עמודה בציר שמימין. אחר כך ${c.g('חבר', 'חברי')} ${c.g('וחלק', 'וחלקי')} ב-${n}.`,
            solution: [`הנתונים: ${andNums(vals)}.`, m(`${plus(vals)} = ${s}`), m(`${s} : ${n} = ${M}`)],
          };
        }
        case 'estimate': {
          const C = 10 * c.rnd(3, 8), n = 5;
          let vals, s;
          for (let t = 0; t < 100; t++) { vals = HM.range(1, n).map(() => C + c.rnd(-5, 5)); s = SUM(vals); if (Math.abs(s / n - C) <= 2) break; }
          const sumR = HM.roundTo(s, 10);
          return {
            type: 'choice', keep: true, answer: 1,
            choices: [`בערך ${C - 10}`, `בערך ${C}`, `בערך ${C + 10}`, `בערך ${HM.fmt(sumR)}`],
            prompt: `בלי לחשב בדיוק: מה ${b('בערך')} הממוצע של ${HM.seq(vals)}?`,
            hint: `הממוצע תמיד בין הנתון הקטן ביותר (${MN(vals)}) לגדול ביותר (${MX(vals)}).`,
            solution: [`כל הנתונים בין ${MN(vals)} ל-${MX(vals)}, לכן הממוצע בערך ${C}.`, `בדיוק: ${m(`${s} : ${n} = ${meanStr(s, n)}`)}`, `${HM.fmt(sumR)} הוא בערך ה${b('סכום')} — שוכחים לחלק!`],
          };
        }
        case 'moves': {
          const n = c.pick([3, 4]), M = c.rnd(3, 6), vals = withMean(c, n, M, 1, 10), s = n * M;
          const ex = vals.filter((v) => v > M).map((v) => v - M), ans = SUM(ex);
          return {
            type: 'number', answer: ans,
            prompt: `${c.g('דמיין', 'דמייני')} שמעבירים קוביות ממגדל למגדל, עד שכל המגדלים באותו גובה.<br>כמה קוביות ${b('לפחות')} צריך להעביר?`,
            visual: towers(vals),
            hint: `קודם ${c.g('מצא', 'מצאי')} את הגובה המשותף (הממוצע). אחר כך ${c.g('ספור', 'ספרי')} כמה קוביות יש מעליו.`,
            solution: [`הממוצע: ${m(`${s} : ${n} = ${M}`)}`, ex.length > 1 ? `הקוביות שמעל גובה ${M}: ${m(ex.join(' + ') + ' = ' + ans)}` : `מעל גובה ${M} יש ${HM.cnt(ans, 'קובייה', 'קוביות', true)}.`, `צריך להעביר ${HM.cnt(ans, 'קובייה', 'קוביות', true)}.`],
          };
        }
        case 'missing': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([4, 5]);
          const M = c.rnd(sc.lo + 2, sc.hi - 2), vals = withMean(c, n, M, sc.lo, sc.hi);
          const x = vals[n - 1], given = vals.slice(0, n - 1), sg = SUM(given);
          return {
            type: 'number', answer: x,
            prompt: `${sc.intro(p, n)} ${HM.seq(given.concat([HM.slot(0)]))}<br>נתון אחד נמחק, אבל ידוע שהממוצע הוא ${M}. מה הנתון החסר?`,
            hint: `אם הממוצע של ${n} נתונים הוא ${M}, הסכום של כולם הוא ${m(`${n} × ${M}`)}.`,
            solution: [`סכום כל הנתונים: ${m(`${n} × ${M} = ${n * M}`)}`, `סכום הנתונים הידועים: ${m(`${plus(given)} = ${sg}`)}`, m(`${n * M} − ${sg} = ${x}`)],
          };
        }
        case 'buildChoice': {
          const M = c.rnd(4, 9), n = 4;
          const good = withMean(c, n, M, 1, 2 * M - 1);
          const d1 = c.shuffle([M, M, M + c.rnd(1, 3), M + c.rnd(1, 3)]);
          const key = (a) => a.slice().sort((x, y) => x - y).join(',');
          const d2 = dataWithSum(c, n, n * M + n, 1, 2 * M + 2, (a) => a.indexOf(M) >= 0 && key(a) !== key(d1));
          const d3 = dataWithSum(c, n, n * M - n, 1, 2 * M, (a) => a.indexOf(M) >= 0 && new Set(a).size > 1);
          const sets = [good, d1, d2, d3];
          if (new Set(sets.map(key)).size < 4) { sets[1] = [M, M, M + 1, M + 3]; sets[2] = [M, M + 1, M + 2, M + 1]; }
          return {
            type: 'choice', answer: 0, choices: sets.map((x) => HM.seq(x)),
            prompt: `${c.name}, ${c.g('בחר', 'בחרי')} את קבוצת הנתונים שהממוצע שלה ${b(M)}:`,
            hint: `ממוצע ${M} של 4 נתונים פירושו שהסכום שלהם ${m(`4 × ${M} = ${4 * M}`)}.`,
            solution: [`הסכום צריך להיות ${4 * M}.`, `${m(plus(good) + ' = ' + 4 * M)} ✔`, `${c.g('שים לב', 'שימי לב')}: גם אם ${M} מופיע בנתונים, הממוצע לא בהכרח ${M}.`],
          };
        }
        case 'buildSlots': {
          const M = c.rnd(5, 10), n = c.pick([4, 5]);
          let given, x;
          for (let t = 0; t < 300; t++) {
            given = HM.range(1, n - 2).map(() => c.rnd(1, 2 * M));
            const rest = n * M - SUM(given);
            if (rest > 0 && rest % 2 === 0 && rest / 2 <= 2 * M) { x = rest / 2; break; }
          }
          if (x == null) { given = HM.range(1, n - 2).map(() => M); x = M; }
          const sg = SUM(given);
          return {
            type: 'number', answer: [x, x],
            prompt: `${c.g('השלם', 'השלימי')} שני מספרים ${b('שווים')}, כך שהממוצע של כל ${n} המספרים יהיה ${M}:<br>${HM.seq(given.concat([HM.slot(0), HM.slot(1)]))}`,
            hint: `הסכום של כל ${n} המספרים צריך להיות ${m(`${n} × ${M} = ${n * M}`)}.`,
            solution: [m(`${n} × ${M} = ${n * M}`), `${m(`${n * M} − ${sg} = ${2 * x}`)} — זה הסכום של שני המספרים החסרים.`, `כל אחד מהם: ${m(`${2 * x} : 2 = ${x}`)}`],
          };
        }
        case 'meanCompare': {
          const tpl = c.scene([
            { tags: [], what: 'הציונים', lo: 60, hi: 100 },
            { tags: ['sport'], what: 'הנקודות במשחקי הכדורסל', lo: 4, hi: 24 },
            { tags: ['games'], what: 'הכוכבים בשלבי המשחק', lo: 1, hi: 15 },
            { tags: ['reading'], what: 'העמודים שנקראו בכל יום', lo: 8, hi: 40 },
            { tags: ['kpop'], what: 'הפוטוקארדים בכל אלבום', lo: 1, hi: 10 },
            { tags: ['magic'], what: 'הציונים בשיעור שיקויים', lo: 60, hi: 100 },
            { tags: ['squishy'], what: 'מחירי הסקווישים (ב-₪) באוסף', lo: 5, hi: 25 },
          ]);
          const P = [c.me, c.friend()], n1 = c.pick([3, 4]), n2 = n1 === 3 ? 4 : 3;
          const M1 = c.rnd(tpl.lo + 3, tpl.hi - 3);
          const M2 = c.chance(0.2) ? M1 : M1 + c.pick([-2, -1, 1, 2]);
          const v1 = withMean(c, n1, M1, tpl.lo, tpl.hi), v2 = withMean(c, n2, M2, tpl.lo, tpl.hi);
          return {
            type: 'compare', left: P[0].name, right: P[1].name, lv: M1, rv: M2, answer: cmpAns(M1, M2),
            prompt: `${tpl.what} של ${P[0].name}: ${HM.seq(v1)}<br>${tpl.what} של ${P[1].name}: ${HM.seq(v2)}<br>${c.g('השלם', 'השלימי')} את הסימן &gt;, &lt; או = בין ${b('הממוצעים')}:`,
            hint: `${c.g('חשב', 'חשבי')} את הממוצע של כל אחד בנפרד. ${c.g('שים לב', 'שימי לב')}: מספר הנתונים שונה!`,
            solution: [`${P[0].name}: ${m(`${SUM(v1)} : ${n1} = ${M1}`)}`, `${P[1].name}: ${m(`${SUM(v2)} : ${n2} = ${M2}`)}`, m(`${M1}${signOf(M1, M2)}${M2}`)],
          };
        }
      }
      return null;
    },
  });

  /* ============================================================
     תכונות הממוצע (א): בין הקטן לגדול, לא חייב להיות נתון, לא חייב להיות שלם
     ============================================================ */
  // נתונים עם ממוצע שאינו שלם: n=2 או 4 → חצאים, n=5 → עשיריות
  function decData(c, n, lo, hi) {
    for (let t = 0; t < 400; t++) {
      const a = HM.range(1, n).map(() => c.rnd(lo, hi)), s = SUM(a);
      if (s % n === 0) continue;
      if (n === 4 && s % 4 !== 2) continue;
      return a;
    }
    return n === 2 ? [lo, lo + 1] : n === 4 ? [lo, lo + 1, lo + 1, lo + 2].map((x, i) => (i === 3 ? x + 2 : x)) : [lo, lo, lo, lo, lo + 1];
  }
  // פתרון לחילוק עם שארית: s : n
  function decSteps(s, n) {
    const q = Math.floor(s / n), r = s % n, out = [`${m(`${s} : ${n} = ${q}`)} ושארית ${r}.`];
    if (n === 5) out.push(`את השארית מחלקים גם: ${m(`${r} : 5 = ${F(r, 5)} = ${F(2 * r, 10)} = 0.${2 * r}`)}`);
    else out.push(`את השארית מחלקים גם: ${m(`${r} : ${n} = ${F(r, n)} = 0.5`)}`);
    out.push(`הממוצע: ${m(`${q} + ${HM.dec(Math.round(((s % n) * 10) / n), 1)} = ${meanStr(s, n)}`)}`);
    return out;
  }

  HM.lesson({
    id: 'data-mean-a',
    learn: (c) => [
      {
        title: 'בין הקטן לגדול',
        html: `${c.name} ${c.g('קלע', 'קלעה')} בשלושה משחקים 6, 10 ו-8 נקודות. הממוצע: ${m('(6 + 10 + 8) : 3 = 8')} (הקו המקווקו).<br>${HM.hl('הממוצע תמיד נמצא בין הנתון הקטן ביותר לגדול ביותר.')}<br>למה? כשמשווים עמודות, לוקחים מהגבוהות ונותנים לנמוכות. אף עמודה לא עולה מעל הגבוהה ביותר, ואף אחת לא יורדת מתחת לנמוכה ביותר.`,
        visual: V.barChart({ labels: ['משחק 1', 'משחק 2', 'משחק 3'], values: [6, 10, 8], line: 8, lineLabel: NOLAB, w: 340, h: 240, max: 11, step: 2 }),
      },
      {
        title: 'הממוצע לא חייב להיות אחד הנתונים',
        html: `הממוצע של ${HM.seq([2, 4, 9])} הוא ${m('15 : 3 = 5')} (הקו המקווקו).<br>המספר 5 לא מופיע בנתונים בכלל — וזה בסדר! הממוצע "מייצג" את כל הנתונים, אבל הוא לא חייב להיות אחד מהם.`,
        visual: V.barChart({ labels: ['א', 'ב', 'ג'], values: [2, 4, 9], line: 5, lineLabel: NOLAB, w: 320, h: 230, max: 10, step: 1 }),
      },
      {
        title: 'הממוצע לא חייב להיות מספר שלם',
        html: `מספר הילדים ב-4 משפחות: ${HM.seq([2, 3, 3, 2])}<br>${m('2 + 3 + 3 + 2 = 10')}, ${m('10 : 4 = 2.5')}<br>אין "חצי ילד", אבל ${b('הממוצע')} (הקו המקווקו) הוא 2.5 ילדים למשפחה! גם כשכל הנתונים שלמים, הממוצע לא חייב להיות מספר שלם.`,
        visual: V.barChart({ labels: ['משפחה 1', 'משפחה 2', 'משפחה 3', 'משפחה 4'], values: [2, 3, 3, 2], line: 2.5, lineLabel: NOLAB, w: 360, h: 220, max: 4, step: 1 }),
      },
      {
        title: 'כשיש שארית',
        html: `מה הממוצע של ${HM.seq([6, 9, 7, 8, 7])}?`,
        steps: [`סכום: ${m('6 + 9 + 7 + 8 + 7 = 37')}`].concat(decSteps(37, 5), [`${c.g('בדוק', 'בדקי')}: 7.4 נמצא בין 6 ל-9 ✔`]),
      },
      {
        title: 'בדיקה בעזרת התכונות',
        html: `התכונות עוזרות לגלות טעויות:<br>• ממוצע שקטן מהנתון הקטן ביותר, או גדול מהגדול ביותר — בטוח שגוי.<br>• אם כל הנתונים שווים, הממוצע שווה להם.<br>• אם בחילוק נשארה שארית, הממוצע לא שלם — אל ${c.g('תשכח', 'תשכחי')} לחלק גם אותה!`,
        quiz: {
          type: 'tf', prompt: `הממוצע של ${HM.seq([4, 7, 10])} הוא 12.`, answer: false,
          hint: 'האם 12 נמצא בין הנתון הקטן ביותר לגדול ביותר?',
          solution: ['12 גדול מהנתון הגדול ביותר (10), לכן הוא לא יכול להיות הממוצע.', `הממוצע האמיתי: ${m('21 : 3 = 7')}`],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['between', 'tfRange', 'inList', 'calcInt', 'numline2']
        : level === 2 ? ['calcHalf', 'calcTenth', 'whichMean', 'storyDec', 'numline4']
        : ['maxPossible', 'possibleSet', 'missingDec', 'tfProps', 'orderMeans'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'between': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([3, 4]);
          const M = c.rnd(sc.lo + 2, sc.hi - 2), vals = withMean(c, n, M, sc.lo + 1, sc.hi), s = n * M, mn = MN(vals), mx = MX(vals);
          const low = mn - c.rnd(1, 3);
          const ch = HM.numChoices(M, [s, mx + c.rnd(1, 4), low >= 0 ? low : mx + 6, mx + 8, mx + 11, mx + 13]);
          return {
            type: 'choice', choices: ch.choices, answer: 0,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${c.g('בלי לחשב', 'בלי לחשב')}: איזה מהמספרים ${b('יכול')} להיות הממוצע?`,
            hint: `הממוצע תמיד בין הנתון הקטן ביותר (${mn}) לגדול ביותר (${mx}).`,
            solution: [`הנתון הקטן ביותר ${mn}, הגדול ביותר ${mx}.`, `רק ${M} נמצא ביניהם.`, `${c.g('בדוק', 'בדקי')}: ${m(`(${plus(vals)}) : ${n} = ${M}`)} ✔`],
          };
        }
        case 'tfRange': {
          const n = c.pick([3, 4, 5]), M = c.rnd(4, 12), vals = withMean(c, n, M, 1, 20), s = n * M, mn = MN(vals), mx = MX(vals);
          const ok = c.chance(0.45), X = ok ? M : c.pick([s, mx + c.rnd(1, 4), Math.max(0, mn - c.rnd(1, 3))].filter((v) => v > mx || v < mn));
          return {
            type: 'tf', answer: ok,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${X}.`,
            hint: `הממוצע תמיד בין הנתון הקטן ביותר לגדול ביותר. ${c.g('בדוק', 'בדקי')} את זה קודם.`,
            solution: ok ? [m(`(${plus(vals)}) : ${n} = ${s} : ${n} = ${M}`), 'הטענה נכונה.']
              : [`${X} ${X > mx ? `גדול מהנתון הגדול ביותר (${mx})` : `קטן מהנתון הקטן ביותר (${mn})`}, לכן הוא לא יכול להיות הממוצע.`, `הממוצע האמיתי: ${m(`${s} : ${n} = ${M}`)}`],
          };
        }
        case 'inList': {
          const n = c.pick([3, 4, 5]), M = c.rnd(4, 12), inc = c.chance(0.5);
          const vals = withMean(c, n, M, 1, 20, (a) => (a.indexOf(M) >= 0) === inc), s = n * M, has = vals.indexOf(M) >= 0;
          return {
            type: 'tf', answer: has,
            prompt: `הממוצע של ${HM.seq(vals)} הוא אחד מהנתונים.`,
            hint: `${c.g('חשב', 'חשבי')} את הממוצע, ${c.g('ובדוק', 'ובדקי')} אם הוא מופיע ברשימה.`,
            solution: [m(`(${plus(vals)}) : ${n} = ${s} : ${n} = ${M}`), has ? `${M} מופיע ברשימה — הטענה נכונה.` : `${M} לא מופיע ברשימה — הממוצע לא חייב להיות אחד הנתונים.`],
          };
        }
        case 'calcInt': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([3, 4]);
          const M = c.rnd(sc.lo + 1, sc.hi - 1), vals = withMean(c, n, M, sc.lo, sc.hi, (a) => a.indexOf(M) < 0), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.ask(p)}`,
            hint: `${c.g('חבר', 'חברי')} את הנתונים ${c.g('וחלק', 'וחלקי')} ב-${n}. הממוצע לא חייב להופיע ברשימה.`,
            solution: [m(`${plus(vals)} = ${s}`), m(`${s} : ${n} = ${M}`), `${M} בין ${MN(vals)} ל-${MX(vals)} ✔`],
          };
        }
        case 'numline2': {
          const x1 = c.rnd(0, 20), x2 = x1 + 2 * c.rnd(1, 7) + 1, s = x1 + x2;
          const lo = Math.max(0, x1 - c.rnd(0, 2)), hi = x2 + c.rnd(0, 2);
          return {
            type: 'numberline', line: { min: lo, max: hi, den: 2 }, answer: s / 2,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${b('הממוצע')} של ${x1} ו-${x2}.`,
            hint: 'הממוצע של שני מספרים נמצא בדיוק באמצע ביניהם.',
            solution: [m(`(${x1} + ${x2}) : 2 = ${s} : 2 = ${meanStr(s, 2)}`), `${meanStr(s, 2)} נמצא בדיוק באמצע בין ${x1} ל-${x2}.`],
          };
        }
        case 'numline4': {
          let vals;
          for (let t = 0; t < 200; t++) { vals = decData(c, 4, 1, 16); if (MX(vals) - MN(vals) <= 14) break; }
          const s = SUM(vals), lo = MN(vals) - 1, hi = MX(vals) + 1;
          return {
            type: 'numberline', line: { min: Math.max(0, lo), max: hi, den: 2 }, answer: s / 4,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את הממוצע של ${HM.seq(vals)}.`,
            hint: `${c.g('חבר', 'חברי')} ${c.g('וחלק', 'וחלקי')} ב-4. ${c.g('שים לב', 'שימי לב')}: על הישר יש סימון בכל חצי.`,
            solution: [m(`${plus(vals)} = ${s}`)].concat(decSteps(s, 4)),
          };
        }
        case 'calcHalf':
        case 'calcTenth': {
          const n = kind === 'calcTenth' ? 5 : c.pick([2, 4]), vals = decData(c, n, 1, 20), s = SUM(vals);
          return {
            type: 'number', decimal: true, answer: meanNum(s, n),
            prompt: `מה הממוצע של ${HM.seq(vals)}?<br>${m(`(${plus(vals)}) : ${n} = ` + HM.slot(0))}`,
            hint: `${c.g('חלק', 'חלקי')} את הסכום ב-${n}. אם יש שארית, ${c.g('המשך', 'המשיכי')} לחלק — הממוצע לא שלם.`,
            solution: [m(`${plus(vals)} = ${s}`)].concat(decSteps(s, n)),
          };
        }
        case 'whichMean':
        case 'storyDec': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend();
          const n = kind === 'whichMean' ? 5 : c.pick([2, 4, 5]), vals = decData(c, n, sc.lo, sc.hi), s = SUM(vals);
          const q = Math.floor(s / n), r = s % n;
          const base = {
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.ask(p)}`,
            hint: `${c.g('חבר', 'חברי')} ${c.g('וחלק', 'וחלקי')} ב-${n}. ${c.g('שים לב', 'שימי לב')} לשארית: גם אותה מחלקים.`,
            solution: [m(`${plus(vals)} = ${s}`)].concat(decSteps(s, n)),
          };
          if (kind === 'storyDec') return Object.assign(base, { type: 'number', decimal: true, answer: meanNum(s, n) });
          return Object.assign(base, { type: 'choice', answer: 0, choices: [meanStr(s, n), String(q), `${q}.${r}`, String(q + 1)] });
        }
        case 'maxPossible': {
          const p = c.chance(0.5) ? c.me : c.friend(), n = c.rnd(4, 6), his = p.g('ו', 'ה');
          const tpl = c.scene([
            { tags: [], unit: ' ס"מ', cap: 9, mk: () => { const M = c.rnd(136, 146), low = M - c.rnd(6, 10); return [M, low, `הגובה הממוצע של ${n} ילדים בקבוצה של ${p.name} הוא ${M} ס"מ. הילד הנמוך ביותר בגובה ${low} ס"מ.<br>מה ${b('יכול')} להיות הגובה של הילד הגבוה ביותר?`]; } },
            { tags: [], unit: '', cap: 100, mk: () => { const M = c.rnd(76, 88), low = M - c.rnd(5, 12); return [M, low, `הציון הממוצע של ${p.name} ב-${n} מבחנים הוא ${M}. הציון הנמוך ביותר של${his} ${low}.<br>מה ${b('יכול')} להיות הציון הגבוה ביותר של${his}?`]; } },
            { tags: ['sport'], unit: '', cap: 9, mk: () => { const M = c.rnd(10, 16), low = M - c.rnd(4, 7); return [M, low, `${p.name} ${p.g('קלע', 'קלעה')} בממוצע ${M} נקודות במשחק כדורסל. במשחק הכי חלש ${p.g('הוא קלע', 'היא קלעה')} ${low} נקודות.<br>כמה נקודות ייתכן ש${p.g('קלע', 'קלעה')} ${p.name} במשחק ${b('הכי טוב')}?`]; } },
            { tags: ['magic'], unit: '', cap: 100, mk: () => { const M = c.rnd(74, 88), low = M - c.rnd(5, 12); return [M, low, `הציון הממוצע של ${p.name} בשיעור שיקויים הוא ${M}. הציון הנמוך ביותר של${his} בשיעור הזה ${low}.<br>מה ${b('יכול')} להיות הציון הגבוה ביותר של${his} בשיקויים?`]; } },
            { tags: ['squishy'], unit: ' ₪', cap: 9, mk: () => { const M = c.rnd(12, 20), low = M - c.rnd(4, 8); return [M, low, `${p.name} ${p.g('קנה', 'קנתה')} ${n} סקווישים, והמחיר הממוצע שלהם ${M} ₪. הסקווישי הזול ביותר עלה ${low} ₪.<br>כמה ${b('ייתכן')} שעלה הסקווישי היקר ביותר?`]; } },
            { tags: ['kpop'], unit: '', cap: 6, mk: () => { const M = c.rnd(6, 10), low = M - c.rnd(4, 5); return [M, low, `${p.name} ${p.g('פתח', 'פתחה')} ${n} אלבומים של להקת קיי-פופ, ובכל אלבום היו בממוצע ${M} פוטוקארדים. באלבום עם הכי מעט פוטוקארדים היו ${low}.<br>כמה פוטוקארדים ${b('ייתכן')} שהיו באלבום עם הכי הרבה?`]; } },
          ]);
          const [M, low, prompt] = tpl.mk(), unit = tpl.unit;
          const good = M + c.rnd(2, tpl.cap === 100 ? Math.min(9, 100 - M) : tpl.cap);
          const opts = [good, M - 1, M - c.rnd(2, 3), low - 1];
          return {
            type: 'choice', answer: 0, choices: opts.map((v) => v + unit),
            prompt,
            hint: 'הממוצע נמצא בין הנתון הקטן ביותר לגדול ביותר. אז הנתון הגדול ביותר לא יכול להיות קטן מהממוצע.',
            solution: [`הממוצע ${M} נמצא בין הקטן לגדול, לכן הנתון הגדול ביותר חייב להיות לפחות ${M}.`, `רק ${good}${unit} גדול מ-${M}.`],
          };
        }
        case 'possibleSet': {
          const q = c.rnd(4, 10), T = q * 10 + 5;
          const good = dataWithSum(c, 4, 4 * q + 2, 1, 2 * q + 2, (a) => new Set(a).size > 2);
          const d1 = dataWithSum(c, 4, 4 * q, 1, 2 * q + 2, (a) => MX(a) > q + 1);
          const d2 = dataWithSum(c, 4, 4 * q + 4, 1, 2 * q + 4, (a) => MN(a) < q);
          const d3 = HM.range(1, 4).map(() => c.rnd(Math.max(1, q - 4), q));
          const sets = [good, d1, d2, d3];
          if (new Set(sets.map((x) => x.join(','))).size < 4) sets[3] = [q - 1, q, q, q - 2];
          return {
            type: 'choice', answer: 0, choices: sets.map((x) => HM.seq(x)),
            prompt: `לאיזו קבוצת נתונים הממוצע הוא ${b(HM.dec(T, 1))}?`,
            hint: `${c.g('חשב', 'חשבי')} את הסכום של כל קבוצה ${c.g('וחלק', 'וחלקי')} ב-4. ${c.g('שים לב', 'שימי לב')}: אם כל הנתונים קטנים מ-${HM.dec(T, 1)}, גם הממוצע קטן ממנו.`,
            solution: [m(`(${plus(good)}) : 4 = ${4 * q + 2} : 4 = ${HM.dec(T, 1)}`), `בקבוצה ${HM.seq(d3)} כל הנתונים קטנים מ-${HM.dec(T, 1)}, לכן הממוצע שלה בטוח קטן יותר.`],
          };
        }
        case 'missingDec': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend();
          if (c.chance(0.4)) {
            const lo2 = c.rnd(sc.lo, sc.hi - 1), hi2 = Math.min(sc.hi, lo2 + 2 * c.rnd(1, 4) - 1);
            const pair = [lo2, hi2 - ((hi2 - lo2) % 2 === 0 ? 1 : 0)], s2 = pair[0] + pair[1], T2 = meanStr(s2, 2);
            const gi = c.rnd(0, 1), known = pair[gi], other = pair[1 - gi];
            return {
              type: 'number', answer: other,
              prompt: `${sc.avg(p, 2, T2)}<br>נתון אחד הוא ${known}. מה הנתון השני?`,
              hint: `הסכום של שני הנתונים הוא ${m(`2 × ${T2}`)}.`,
              solution: [`הסכום: ${m(`2 × ${T2} = ${s2}`)}`, m(`${s2} − ${known} = ${other}`)],
            };
          }
          const vals = decData(c, 4, sc.lo, sc.hi), s = SUM(vals), q = Math.floor(s / 4), T = meanStr(s, 4);
          const given = vals.slice(0, 3), x = vals[3], sg = SUM(given);
          return {
            type: 'number', answer: x,
            prompt: `${sc.intro(p, 4)} ${HM.seq(given.concat([HM.slot(0)]))}<br>הממוצע של 4 הנתונים הוא ${T}. מה הנתון החסר?`,
            hint: `הסכום של כל 4 הנתונים הוא ${m(`4 × ${T}`)}, כלומר ${m(`4 × ${q}`)} ועוד 2.`,
            solution: [`סכום כל הנתונים: ${m(`4 × ${T} = ${s}`)}`, `שלושת הנתונים הידועים: ${m(`${plus(given)} = ${sg}`)}`, m(`${s} − ${sg} = ${x}`)],
          };
        }
        case 'tfProps': {
          const ty = c.rnd(0, 4), p = c.chance(0.5) ? c.me : c.friend();
          if (ty === 0) {
            const x = c.rnd(1, 20);
            return {
              type: 'tf', answer: false,
              prompt: 'אם כל הנתונים הם מספרים שלמים, גם הממוצע שלהם תמיד מספר שלם.',
              hint: `${c.g('נסה', 'נסי')} דוגמה: מה הממוצע של ${x} ו-${x + 1}?`,
              solution: [`הממוצע של ${x} ו-${x + 1} הוא ${meanStr(2 * x + 1, 2)} — לא מספר שלם.`, 'הטענה לא נכונה.'],
            };
          }
          if (ty === 1) {
            const n = c.pick([3, 4]), M = c.rnd(5, 12), vals = withMean(c, n, M, 1, 20), mx = MX(vals);
            return {
              type: 'tf', answer: false,
              prompt: `הממוצע של ${HM.seq(vals)} גדול מ-${mx}.`,
              hint: 'האם הממוצע יכול להיות גדול מהנתון הגדול ביותר?',
              solution: [`${mx} הוא הנתון הגדול ביותר, והממוצע תמיד קטן ממנו או שווה לו.`, `הממוצע כאן: ${m(`${n * M} : ${n} = ${M}`)}. הטענה לא נכונה.`],
            };
          }
          if (ty === 2) {
            const L = c.rnd(75, 90), k = c.rnd(2, 6);
            return {
              type: 'tf', answer: false,
              prompt: `כל הציונים של ${p.name} במבחנים נמוכים מ-${L}, והממוצע של${p.g('ו', 'ה')} ${L + k}.`,
              hint: 'האם הממוצע יכול להיות גדול מכל הנתונים?',
              solution: [`אם כל הציונים נמוכים מ-${L}, גם הממוצע נמוך מ-${L}.`, `ממוצע ${L + k} בלתי אפשרי — הטענה לא נכונה.`],
            };
          }
          if (ty === 3) {
            const v = c.rnd(3, 30), n = c.rnd(3, 6);
            return {
              type: 'tf', answer: true,
              prompt: `${p.name} ${p.g('שיחק', 'שיחקה')} ${n} משחקים, ובכל משחק ${p.g('צבר', 'צברה')} בדיוק ${v} נקודות. הממוצע של${p.g('ו', 'ה')} הוא ${v} נקודות למשחק.`,
              hint: 'מה קורה בהשוואת עמודות כשכל העמודות כבר באותו גובה?',
              solution: [`כשכל הנתונים שווים, הממוצע שווה להם: ${m(`(${v} × ${n}) : ${n} = ${v}`)}`, 'הטענה נכונה.'],
            };
          }
          const n = c.pick([2, 4]), dec = c.chance(0.5), vals = dec ? decData(c, n, 1, 20) : withMean(c, n, c.rnd(4, 12), 1, 20), s = SUM(vals);
          return {
            type: 'tf', answer: s % n === 0,
            prompt: `הממוצע של ${HM.seq(vals)} הוא מספר שלם.`,
            hint: `${c.g('חשב', 'חשבי')} את הסכום ${c.g('ובדוק', 'ובדקי')} אם הוא מתחלק ב-${n} בלי שארית.`,
            solution: [m(`(${plus(vals)}) : ${n} = ${s} : ${n} = ${meanStr(s, n)}`), s % n === 0 ? 'הממוצע שלם — הטענה נכונה.' : 'הממוצע לא שלם — הטענה לא נכונה.'],
          };
        }
        case 'orderMeans': {
          const B0 = c.rnd(5, 14), pool = [-1, -0.5, 0, 0.5, 1].map((d) => B0 + d);
          const mus = c.sample(pool, 3);
          const sets = mus.map((mu) => {
            const half = mu % 1 !== 0, n = half ? c.pick([2, 4]) : c.pick([2, 3, 4]), tot = Math.round(mu * n);
            return dataWithSum(c, n, tot, Math.max(1, Math.floor(mu) - 5), Math.ceil(mu) + 5, (a) => new Set(a).size > 1);
          });
          const meanOf = (a) => SUM(a) / a.length;
          const order = [0, 1, 2].sort((i, j) => meanOf(sets[i]) - meanOf(sets[j]));
          return {
            type: 'order', items: sets.map((x) => HM.seq(x)), answer: order,
            prompt: `${c.g('סדר', 'סדרי')} את קבוצות הנתונים לפי הממוצע שלהן, ${b('מהקטן לגדול')}:`,
            hint: `${c.g('חשב', 'חשבי')} את הממוצע של כל קבוצה. ${c.g('שים לב', 'שימי לב')}: יש ממוצעים שאינם שלמים.`,
            solution: order.map((i) => `${HM.seq(sets[i])} ← ${m(`${SUM(sets[i])} : ${sets[i].length} = ${meanStr(SUM(sets[i]), sets[i].length)}`)}`),
          };
        }
      }
      return null;
    },
  });

  /* ============================================================
     תכונות הממוצע (ב): הוספת נתון גדול, קטן או שווה לממוצע
     ============================================================ */
  const DIRS = ['הממוצע יגדל', 'הממוצע יקטן', 'הממוצע לא ישתנה'];
  const relOf = (v, M) => (v > M ? 0 : v < M ? 1 : 2);
  const relTxt = (v, M) => (v > M ? `${v} גדול מהממוצע (${M}), ולכן הוא "מושך" את הממוצע למעלה.` : v < M ? `${v} קטן מהממוצע (${M}), ולכן הוא "מושך" את הממוצע למטה.` : `${v} שווה לממוצע, ולכן הממוצע לא משתנה.`);
  // נתון חדש ביחס לממוצע M: up / down / same
  function newVal(c, M, lo, hi, rel) {
    if (rel === 0) return Math.min(hi + 5, M + c.rnd(1, 6));
    if (rel === 1) return M - c.rnd(1, Math.max(1, Math.min(6, M - lo)));
    return M;
  }

  HM.lesson({
    id: 'data-mean-b',
    learn: (c) => [
      {
        title: 'משחק חדש, ממוצע חדש',
        html: `${c.name} ${c.g('הבקיע', 'הבקיעה')} בשלושה משחקים 4, 6 ו-5 גולים. הממוצע: ${m('15 : 3 = 5')}.<br>במשחק הרביעי ${c.g('הבקיע', 'הבקיעה')} 9 גולים — יותר מהממוצע!<br>הממוצע החדש (הקו המקווקו): ${m('(15 + 9) : 4 = 24 : 4 = 6')}. הוא ${b('גדל')}.`,
        visual: V.barChart({ labels: ['משחק 1', 'משחק 2', 'משחק 3', 'משחק 4'], values: [4, 6, 5, 9], hl: [3], line: 6, lineLabel: NOLAB, w: 380, h: 240, max: 10, step: 1 }),
      },
      {
        title: 'נתון גדול מהממוצע',
        html: `${HM.hl('כשמוסיפים נתון גדול מהממוצע — הממוצע גדל.')}<br>למה? בהשוואת העמודות, לעמודה החדשה יש "עודף" מעל הקו, והיא מחלקת אותו בין כולם — אז הקו עולה.<br>אבל הממוצע החדש ${b('קטן')} מהנתון שהוספנו: 6 קטן מ-9.`,
      },
      {
        title: 'נתון קטן מהממוצע',
        html: `${HM.hl('כשמוסיפים נתון קטן מהממוצע — הממוצע קטן.')}<br>למשל, הממוצע של ${HM.seq([4, 6, 5])} הוא 5. אם במשחק הבא ${c.g('תבקיע', 'תבקיעי')} רק גול אחד:<br>${m('(15 + 1) : 4 = 16 : 4 = 4')} — הממוצע (הקו המקווקו) ירד ל-4.`,
        visual: V.barChart({ labels: ['משחק 1', 'משחק 2', 'משחק 3', 'משחק 4'], values: [4, 6, 5, 1], hl: [3], line: 4, lineLabel: NOLAB, w: 380, h: 220, max: 7, step: 1 }),
      },
      {
        title: 'נתון השווה לממוצע',
        html: `${HM.hl('כשמוסיפים נתון השווה לממוצע — הממוצע לא משתנה.')}<br>העמודה החדשה כבר בדיוק בגובה הקו, אין מה לקחת ממנה ואין מה לתת לה.<br>${m('(15 + 5) : 4 = 20 : 4 = 5')} — עדיין 5.`,
        quiz: {
          type: 'choice', keep: true, prompt: `הממוצע של ${HM.seq([7, 9, 8])} הוא 8. מוסיפים את המספר 8. מה יקרה לממוצע?`,
          choices: DIRS.slice(), answer: 2,
          hint: c.g('השווה', 'השווי') + ' את המספר החדש לממוצע.',
          solution: ['8 שווה לממוצע, לכן הממוצע לא ישתנה.', m('(24 + 8) : 4 = 32 : 4 = 8')],
        },
      },
      {
        title: 'דוגמה פתורה',
        html: `הממוצע של ${HM.seq([6, 8, 10])} הוא 8. מוסיפים את 12. מה הממוצע החדש?`,
        steps: [
          `12 גדול מהממוצע 8 ← הממוצע יגדל.`,
          `הסכום הקודם: ${m('3 × 8 = 24')}. הסכום החדש: ${m('24 + 12 = 36')}`,
          `יש עכשיו 4 נתונים: ${m('36 : 4 = 9')}`,
          `הממוצע גדל מ-8 ל-9, ונשאר קטן מ-12 ✔`,
        ],
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['dir', 'dirTf', 'addEqual', 'newMean', 'chartAdd']
        : level === 2 ? ['cmpMeans', 'newMeanStory', 'keepSame', 'raiseBy1', 'addPair', 'dir']
        : ['needed', 'remove', 'howMuchUp', 'tfClaims', 'addTwoMean', 'needed'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'dir':
        case 'chartAdd': {
          const sc = c.scene(NUMS.filter((x) => x.hi <= 20)), p = c.chance(0.5) ? c.me : c.friend(), n = 4;
          const M = c.rnd(sc.lo + 2, sc.hi - 2), vals = withMean(c, n, M, sc.lo, sc.hi), s = n * M;
          const rel = c.rnd(0, 2), v = newVal(c, M, sc.lo, sc.hi, rel);
          const chk = `${c.g('בדוק', 'בדקי')}: ${m(`(${s} + ${v}) : 5 = ${s + v} : 5 = ${meanStr(s + v, 5)}`)}`;
          if (kind === 'chartAdd') {
            return {
              type: 'choice', keep: true, choices: DIRS.slice(), answer: rel,
              prompt: `${sc.intro(p, n).replace(/:$/, '')} — ב-${n} העמודות שמימין. הקו המקווקו הוא הממוצע שלהן.<br>${sc.next(p, v)} (העמודה השמאלית) מה יקרה לממוצע?`,
              visual: V.barChart({ labels: numLabels(sc, n + 1), values: vals.concat([v]), hl: [n], line: M, lineLabel: NOLAB, w: 420, h: 250, max: Math.max(MX(vals), v) + 1, step: Math.max(MX(vals), v) > 12 ? 2 : 1 }),
              hint: 'האם העמודה החדשה מעל הקו המקווקו, מתחתיו, או בדיוק עליו?',
              solution: [relTxt(v, M), chk],
            };
          }
          return {
            type: 'choice', keep: true, choices: DIRS.slice(), answer: rel,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${level === 1 ? `הממוצע הוא ${M}. ` : ''}${sc.next(p, v)}<br>מה יקרה לממוצע?`,
            hint: level === 1 ? `${c.g('השווה', 'השווי')} את הנתון החדש (${v}) לממוצע (${M}).` : `קודם ${c.g('חשב', 'חשבי')} את הממוצע של ${n} הנתונים, ואז ${c.g('השווה', 'השווי')} אליו את ${v}.`,
            solution: (level === 1 ? [] : [`הממוצע: ${m(`${s} : ${n} = ${M}`)}`]).concat([relTxt(v, M), chk]),
          };
        }
        case 'dirTf': {
          const n = c.pick([3, 4]), M = c.rnd(4, 12), vals = withMean(c, n, M, 1, 20), rel = c.rnd(0, 2), v = newVal(c, M, 1, 20, rel);
          const claim = c.chance(0.5) ? rel : c.pick([0, 1, 2].filter((x) => x !== rel));
          const words = ['יגדל', 'יקטן', 'לא ישתנה'];
          return {
            type: 'tf', answer: claim === rel,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. אם נוסיף לנתונים את ${v}, הממוצע ${words[claim]}.`,
            hint: `${c.g('השווה', 'השווי')} את ${v} לממוצע ${M}.`,
            solution: [relTxt(v, M), claim === rel ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
        case 'addEqual': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = 3;
          const M = c.rnd(sc.lo + 1, sc.hi - 1), vals = withMean(c, n, M, sc.lo, sc.hi, (a) => a.indexOf(M) < 0), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.next(p, M)} מה הממוצע עכשיו, בכל ${n + 1} ה${sc.unit[1]}?`,
            hint: `${c.g('חשב', 'חשבי')} קודם את הממוצע של ${n} הנתונים הראשונים, ${c.g('והשווה', 'והשווי')} אליו את הנתון החדש.`,
            solution: [`הממוצע הקודם: ${m(`${s} : ${n} = ${M}`)}`, `הנתון החדש (${M}) שווה לממוצע, לכן הממוצע לא משתנה: ${M}.`, `${c.g('בדוק', 'בדקי')}: ${m(`(${s} + ${M}) : ${n + 1} = ${M}`)}`],
          };
        }
        case 'newMean': {
          const n = 3, M = c.rnd(4, 10), vals = withMean(c, n, M, 1, 18), s = n * M;
          const k = c.chance(0.6) || M < 6 ? c.rnd(1, 2) : -1, v = M + 4 * k;
          return {
            type: 'number', answer: M + k,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}.<br>מוסיפים את המספר ${v}. מה הממוצע החדש?`,
            hint: `${c.g('חבר', 'חברי')} את כל ${n + 1} המספרים, ${c.g('וחלק', 'וחלקי')} ב-${n + 1}.`,
            solution: [m(`${plus(vals)} + ${v} = ${s + v}`), m(`${s + v} : ${n + 1} = ${M + k}`), `${v} ${v > M ? 'גדול' : 'קטן'} מ-${M}, ולכן הממוצע ${v > M ? 'גדל' : 'קטן'}.`],
          };
        }
        case 'cmpMeans': {
          const n = 4, M = c.rnd(4, 12), vals = withMean(c, n, M, 1, 20), rel = c.rnd(0, 2), v = newVal(c, M, 1, 20, rel), s = n * M;
          const after = meanNum(s + v, 5);
          return {
            type: 'compare', left: 'הממוצע לפני', right: 'הממוצע אחרי', lv: M, rv: after, answer: cmpAns(M, after),
            prompt: `הנתונים: ${HM.seq(vals)}. מוסיפים להם את ${v}.<br>${c.g('השלם', 'השלימי')} את הסימן &gt;, &lt; או =`,
            hint: `${c.g('חשב', 'חשבי')} קודם את הממוצע של ${n} הנתונים, ${c.g('והשווה', 'והשווי')} אליו את ${v}.`,
            solution: [`הממוצע לפני: ${m(`${s} : ${n} = ${M}`)}`, relTxt(v, M), `הממוצע אחרי: ${m(`${s + v} : 5 = ${meanStr(s + v, 5)}`)}`],
          };
        }
        case 'newMeanStory': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = 4;
          let M, vals, v, s, t = 0;
          do {
            M = c.rnd(sc.lo + 2, sc.hi - 2); vals = withMean(c, n, M, sc.lo, sc.hi); s = n * M;
            const k = c.pick([-1, 1, 2]); v = M + 5 * k; t++;
          } while ((v < Math.max(1, sc.lo - 2) || v > sc.hi + 8) && t < 50);
          if (v < 1 || v > sc.hi + 8) v = M;
          return {
            type: 'number', answer: (s + v) / 5,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.next(p, v)}<br>${sc.ask(p)} (בכל ${n + 1} ה${sc.unit[1]})`,
            hint: `${c.g('חבר', 'חברי')} את כל ${n + 1} הנתונים, ${c.g('וחלק', 'וחלקי')} ב-${n + 1}.`,
            solution: [m(`${plus(vals)} + ${v} = ${s + v}`), m(`${s + v} : 5 = ${(s + v) / 5}`), relTxt(v, M)],
          };
        }
        case 'keepSame': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([3, 4, 5]);
          const M = c.rnd(sc.lo + 1, sc.hi - 1), vals = withMean(c, n, M, sc.lo, sc.hi, (a) => a.indexOf(M) < 0), s = n * M;
          return {
            type: 'number', answer: M,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>איזה נתון צריך להוסיף, כדי שהממוצע ${b('לא ישתנה')}?`,
            hint: 'איזה נתון לא "מושך" את הממוצע לאף כיוון?',
            solution: [`הממוצע עכשיו: ${m(`${s} : ${n} = ${M}`)}`, `כדי שהממוצע לא ישתנה, מוסיפים נתון השווה לו: ${M}.`],
          };
        }
        case 'raiseBy1': {
          const n = c.pick([3, 4]), up = c.chance(0.65);
          const M = up ? c.rnd(4, 12) : c.rnd(n + 4, 14), vals = withMean(c, n, M, 1, 20), s = n * M;
          const T = up ? M + 1 : M - 1, need = T * (n + 1) - s;
          return {
            type: 'number', answer: need,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}.<br>איזה מספר צריך להוסיף, כדי שהממוצע החדש יהיה ${T}?`,
            hint: `${c.g('חשב', 'חשבי')} מה צריך להיות הסכום של ${n + 1} המספרים, כדי שהממוצע יהיה ${T}.`,
            solution: [`הסכום הדרוש: ${m(`${n + 1} × ${T} = ${(n + 1) * T}`)}`, `הסכום עכשיו: ${m(`${plus(vals)} = ${s}`)}`, m(`${(n + 1) * T} − ${s} = ${need}`)],
          };
        }
        case 'addPair': {
          const n = c.pick([3, 4]), M = c.rnd(9, 14), vals = withMean(c, n, M, 1, 24), rel = c.rnd(0, 2);
          const d1 = c.rnd(2, 5), d2 = rel === 2 ? d1 : rel === 0 ? d1 - c.rnd(1, d1 - 1) : d1 + c.rnd(1, 3);
          const v1 = M + d1, v2 = M - d2;
          return {
            type: 'choice', keep: true, choices: DIRS.slice(), answer: rel,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}.<br>מוסיפים ${b('שני')} מספרים: ${v1} ו-${v2}. מה יקרה לממוצע?`,
            hint: `${c.g('בדוק', 'בדקי')} בכמה כל מספר חדש גדול מהממוצע או קטן ממנו.`,
            solution: [`${v1} גדול מ-${M} ב-${d1}, ו-${v2} קטן מ-${M} ב-${d2}.`, rel === 2 ? 'העודף והחוסר שווים — הם מקזזים זה את זה, והממוצע לא ישתנה.' : rel === 0 ? 'העודף גדול מהחוסר, לכן הממוצע יגדל.' : 'החוסר גדול מהעודף, לכן הממוצע יקטן.'],
          };
        }
        case 'needed': {
          const p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([3, 4]);
          const sh = p.g('הוא צריך', 'היא צריכה');
          const tpl = c.scene([
            { tags: [], unitPl: 'מבחנים', score: true, txt: (M, T) => `הציון הממוצע של ${p.name} ב-${n} מבחנים הוא ${M}. איזה ציון ${p.g('צריך', 'צריכה')} ${p.name} לקבל במבחן הבא, כדי שהממוצע יעלה ל-${T}?` },
            { tags: ['sport'], unitPl: 'משחקים', lo: 8, hi: 14, txt: (M, T) => `${p.name} ${p.g('קלע', 'קלעה')} בממוצע ${M} נקודות ב-${n} משחקי כדורסל. כמה נקודות ${sh} לקלוע במשחק הבא, כדי שהממוצע יעלה ל-${T}?` },
            { tags: ['games'], unitPl: 'שלבים', lo: 6, hi: 12, txt: (M, T) => `${p.name} ${p.g('אסף', 'אספה')} בממוצע ${M} כוכבים בכל שלב, ב-${n} שלבים של משחק מחשב. כמה כוכבים ${sh} לאסוף בשלב הבא, כדי שהממוצע יהיה ${T}?` },
            { tags: ['magic'], unitPl: 'שיעורים', score: true, txt: (M, T) => `הציון הממוצע של ${p.name} ב-${n} שיעורי שיקויים הוא ${M}. איזה ציון ${p.g('צריך', 'צריכה')} ${p.name} לקבל בשיעור הבא, כדי שהממוצע יעלה ל-${T}?` },
            { tags: ['kpop'], unitPl: 'אלבומים', lo: 4, hi: 8, txt: (M, T) => `ב-${n} אלבומים ש${p.g('פתח', 'פתחה')} ${p.name} היו בממוצע ${M} פוטוקארדים. כמה פוטוקארדים צריכים להיות באלבום הבא, כדי שהממוצע יעלה ל-${T}?` },
            { tags: ['squishy'], unitPl: 'סקווישים', lo: 10, hi: 18, txt: (M, T) => `${p.name} ${p.g('קנה', 'קנתה')} ${n} סקווישים במחיר ממוצע של ${M} ₪. כמה ₪ צריך לעלות הסקווישי הבא, כדי שהמחיר הממוצע יהיה ${T} ₪?` },
          ]);
          let M, T;
          if (tpl.score) { do { M = c.rnd(70, 88); T = M + c.rnd(1, 3); } while (T + n * (T - M) > 100); }
          else { M = c.rnd(tpl.lo, tpl.hi); T = M + c.rnd(1, 2); }
          const need = T * (n + 1) - n * M, unitPl = tpl.unitPl;
          return {
            type: 'number', answer: need, prompt: tpl.txt(M, T),
            hint: `כדי שהממוצע של ${n + 1} ${unitPl} יהיה ${T}, הסכום צריך להיות ${m(`${n + 1} × ${T}`)}.`,
            solution: [`הסכום עד עכשיו: ${m(`${n} × ${M} = ${n * M}`)}`, `הסכום הדרוש: ${m(`${n + 1} × ${T} = ${(n + 1) * T}`)}`, m(`${(n + 1) * T} − ${n * M} = ${need}`)],
          };
        }
        case 'remove': {
          const sc = c.scene(NUMS.filter((x) => x.hi <= 20)), p = c.chance(0.5) ? c.me : c.friend(), n = 5, rel = c.rnd(0, 2);
          const M = c.rnd(sc.lo + 2, sc.hi - 2);
          const vals = withMean(c, n, M, sc.lo, sc.hi, (a) => (rel === 2 ? a.indexOf(M) >= 0 : rel === 0 ? MX(a) > M : MN(a) < M));
          const r = rel === 2 ? M : rel === 0 ? MX(vals) : MN(vals), s = n * M;
          const ans = rel === 0 ? 1 : rel === 1 ? 0 : 2;
          return {
            type: 'choice', keep: true, choices: DIRS.slice(), answer: ans,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>הממוצע הוא ${M}. מתברר שהנתון ${r} נרשם בטעות, ומוחקים אותו. מה יקרה לממוצע?`,
            hint: `${c.g('השווה', 'השווי')} את ${r} לממוצע ${M}. ${c.g('חשוב', 'חשבי')}: מה קורה כשמוציאים נתון גבוה או נמוך?`,
            solution: [rel === 0 ? `${r} גדול מהממוצע. כשמוציאים אותו, נשארים הנתונים ה"נמוכים" יותר — הממוצע יקטן.` : rel === 1 ? `${r} קטן מהממוצע. כשמוציאים אותו, נשארים הנתונים ה"גבוהים" יותר — הממוצע יגדל.` : `${r} שווה לממוצע, לכן הממוצע לא ישתנה.`, `${c.g('בדוק', 'בדקי')}: ${m(`(${s} − ${r}) : 4 = ${s - r} : 4 = ${meanStr(s - r, 4)}`)}`],
          };
        }
        case 'howMuchUp': {
          const sc = c.scene(NUMS), p = c.chance(0.5) ? c.me : c.friend(), n = c.pick([3, 4]), up = c.chance(0.65);
          const M = up ? c.rnd(sc.lo + 1, sc.hi - 1) : c.rnd(Math.max(sc.lo + 1, n + 3), sc.hi + 4);
          const k = up ? c.rnd(1, 3) : 1, v = up ? M + k * (n + 1) : M - (n + 1);
          return {
            type: 'number', answer: k,
            prompt: `${sc.avg(p, n, M)}<br>${sc.next(p, v)} ${b('בכמה')} ${up ? 'יגדל' : 'יקטן'} הממוצע?`,
            hint: `הנתון החדש ${up ? 'גדול' : 'קטן'} מהממוצע ב-${Math.abs(v - M)}. בהשוואת העמודות, ההבדל הזה מתחלק בין כל ${n + 1} הנתונים.`,
            solution: [m(up ? `${v} − ${M} = ${v - M}` : `${M} − ${v} = ${M - v}`), m(`${Math.abs(v - M)} : ${n + 1} = ${k}`), `הממוצע ${up ? 'יגדל' : 'יקטן'} ב-${k} ויהיה ${up ? M + k : M - k}.`, `${c.g('בדוק', 'בדקי')}: ${m(`(${n} × ${M} + ${v}) : ${n + 1} = ${up ? M + k : M - k}`)}`],
          };
        }
        case 'tfClaims': {
          const ty = c.rnd(0, 4), n = 4, M = c.rnd(5, 12), vals = withMean(c, n, M, 1, 20), s = n * M;
          if (ty === 0) {
            const v = M + 5 * c.rnd(1, 2), wrong = v + c.rnd(1, 3);
            return {
              type: 'tf', answer: false,
              prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. הוסיפו את ${v}, והממוצע החדש הוא ${wrong}.`,
              hint: 'האם הממוצע החדש יכול להיות גדול מהנתון שהוספנו?',
              solution: [`הממוצע החדש חייב להיות בין ${M} ל-${v}.`, `באמת: ${m(`(${s} + ${v}) : 5 = ${(s + v) / 5}`)}. הטענה לא נכונה.`],
            };
          }
          if (ty === 1) {
            const v = M + 5 * c.rnd(1, 2);
            return {
              type: 'tf', answer: true,
              prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. הוסיפו את ${v}, והממוצע החדש הוא ${(s + v) / 5}.`,
              hint: `${c.g('חשב', 'חשבי')}: מה הסכום החדש, ובכמה נתונים מחלקים?`,
              solution: [m(`(${s} + ${v}) : 5 = ${s + v} : 5 = ${(s + v) / 5}`), 'הטענה נכונה.'],
            };
          }
          if (ty === 2) {
            const d = c.rnd(1, 4);
            return {
              type: 'tf', answer: true,
              prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. הוסיפו שני מספרים, ${M + d} ו-${M - d}, והממוצע נשאר ${M}.`,
              hint: `${c.g('בדוק', 'בדקי')} בכמה כל מספר חדש גדול מהממוצע או קטן ממנו.`,
              solution: [`${M + d} גדול מהממוצע ב-${d}, ו-${M - d} קטן ממנו ב-${d}. הם מקזזים זה את זה.`, m(`(${s} + ${M + d} + ${M - d}) : 6 = ${s + 2 * M} : 6 = ${M}`), 'הטענה נכונה.'],
            };
          }
          if (ty === 3) {
            const v = M - c.rnd(1, Math.min(4, M - 1));
            return {
              type: 'tf', answer: false,
              prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. הוסיפו את ${v}, ולכן הממוצע גדל.`,
              hint: `${c.g('השווה', 'השווי')} את ${v} לממוצע.`,
              solution: [relTxt(v, M), 'הטענה לא נכונה.'],
            };
          }
          return {
            type: 'tf', answer: true,
            prompt: `הממוצע של ${HM.seq(vals)} הוא ${M}. אם נוסיף את ${M}, הממוצע יישאר ${M}.`,
            hint: 'מה קורה כשמוסיפים נתון השווה לממוצע?',
            solution: [relTxt(M, M), m(`(${s} + ${M}) : 5 = ${M}`), 'הטענה נכונה.'],
          };
        }
        case 'addTwoMean': {
          const sc = c.scene(NUMS.filter((x) => x.hi <= 20)), p = c.chance(0.5) ? c.me : c.friend(), n = 3;
          let M, vals, v1, v2, s, T, t = 0;
          do {
            M = c.rnd(sc.lo + 2, sc.hi - 2); vals = withMean(c, n, M, sc.lo, sc.hi); s = n * M;
            T = M + c.pick([-1, 1, 2]); v1 = c.rnd(sc.lo, sc.hi); v2 = 5 * T - s - v1; t++;
          } while ((v2 < Math.max(0, sc.lo - 2) || v2 > sc.hi + 6 || v2 === v1) && t < 200);
          if (v2 < 0 || t >= 200) { T = M; v1 = M + 1; v2 = M - 1; }
          return {
            type: 'number', answer: T,
            prompt: `${sc.intro(p, n)} ${HM.seq(vals)}<br>${sc.next2}: ${andNums([v1, v2])}.<br>${sc.ask(p)} (בכל 5 ה${sc.unit[1]})`,
            hint: `${c.g('חבר', 'חברי')} את כל 5 הנתונים, ${c.g('וחלק', 'וחלקי')} ב-5.`,
            solution: [m(`${plus(vals)} + ${v1} + ${v2} = ${s + v1 + v2}`), m(`${s + v1 + v2} : 5 = ${T}`)],
          };
        }
      }
      return null;
    },
  });

  /* ============================================================
     עבודת חקר
     ============================================================ */
  const PUPS = ['שוקו', 'לבנה', 'צימוק', 'בונבון', 'פלפל', 'קקאו', 'במבה'];
  const SQUISH = ['דונאט', 'פנדה', 'אבוקדו', 'חתול', 'תות', 'פינגווין', 'ענן'];
  const hrs = (k) => (k === 1 ? 'שעה אחת' : `${k} שעות`);
  const RES = [
    { tags: [], q: 'מה הגובה של ילדי הקבוצה?', what: 'הגובה', unitIn: 'בס"מ', lo: 128, hi: 150, step: 50,
      up: (k) => `אחרי שנה כל ילד גבה ב-${k} ס"מ.`,
      add: (v) => `לקבוצה הצטרף ילד חדש, והגובה שלו ${v} ס"מ.` },
    { tags: ['games', 'tech'], q: 'כמה שעות ביום אנחנו מול מסך?', what: 'זמן המסך', unitIn: 'בשעות', lo: 1, hi: 6,
      up: (k) => `בחופש הגדול כל ילד הוסיף ${k === 1 ? 'שעת מסך אחת' : k + ' שעות מסך'} ביום.`,
      down: (k) => `בשבוע המבחנים כל ילד צפה ${hrs(k)} פחות ביום.`,
      scale: 'בחופש הגדול כל ילד צפה פי 2 שעות ביום',
      add: (v) => `לקבוצה הצטרף ילד חדש, שצופה ${hrs(v)} ביום.` },
    { tags: ['reading'], q: 'כמה ספרים קוראים בחודש?', what: 'מספר הספרים', lo: 1, hi: 8,
      up: (k) => `בחודש הקריאה כל ילד קרא ${HM.cnt(k, 'ספר', 'ספרים')} יותר.`,
      down: (k) => `בחודש המבחנים כל ילד קרא ${HM.cnt(k, 'ספר', 'ספרים')} פחות.`,
      scale: 'בחודש הקריאה כל ילד קרא פי 2 ספרים',
      add: (v) => `לקבוצה הצטרף ילד חדש, שקרא ${HM.cnt(v, 'ספר', 'ספרים')}.` },
    { tags: ['animals'], q: 'כמה שוקלים הגורים בפינת החי?', what: 'המשקל', unitIn: 'בק"ג', lo: 2, hi: 9, pups: true,
      up: (k) => `אחרי חודש כל גור עלה ${k} ק"ג במשקל.`,
      scale: 'אחרי חודשיים כל גור הכפיל את המשקל שלו',
      add: (v) => `לפינת החי הגיע גור חדש, שמשקלו ${v} ק"ג.` },
    { tags: ['sport'], q: 'כמה קליעות לסל מצליחים מתוך 20 זריקות?', what: 'מספר הקליעות', lo: 3, hi: 10,
      up: (k) => `אחרי חודש של אימונים כל ילד קלע ${HM.cnt(k, 'קליעה', 'קליעות', true)} יותר.`,
      down: (k) => `ביום עם רוח חזקה כל ילד קלע ${HM.cnt(k, 'קליעה', 'קליעות', true)} פחות.`,
      scale: 'אחרי חצי שנה של אימונים כל ילד קלע פי 2 קליעות',
      add: (v) => `לקבוצה הצטרף ילד חדש, שקלע ${HM.cnt(v, 'קליעה', 'קליעות', true)}.` },
    { tags: ['space'], q: 'לאיזה גובה מגיעה רקטת מים?', what: 'גובה הרקטות', unitIn: 'במטרים', lo: 8, hi: 25,
      up: (k) => `אחרי ששיפרו את הכנפיים, כל רקטה עלתה ${HM.cnt(k, 'מטר', 'מטרים')} יותר.`,
      down: (k) => `ביום עם רוח חזקה כל רקטה עלתה ${HM.cnt(k, 'מטר', 'מטרים')} פחות.`,
      scale: 'עם משאבה חזקה יותר, כל רקטה עלתה לגובה כפול',
      add: (v) => `ילד נוסף שיגר רקטה, והיא עלתה לגובה ${v} מטרים.` },
    { tags: ['music'], q: 'כמה שעות בשבוע מתאמנים בנגינה?', what: 'מספר שעות האימון', lo: 1, hi: 7,
      up: (k) => `לפני הקונצרט כל ילד התאמן ${hrs(k)} יותר בשבוע.`,
      down: (k) => `בשבוע הטיול כל ילד התאמן ${hrs(k)} פחות.`,
      scale: 'לפני הקונצרט כל ילד התאמן פי 2 שעות',
      add: (v) => `ללהקה הצטרף ילד חדש, שמתאמן ${hrs(v)} בשבוע.` },
    { tags: ['baking'], q: 'כמה עוגיות מכין כל ילד למסיבת הכיתה?', what: 'מספר העוגיות', lo: 4, hi: 14,
      up: (k) => `למסיבת סוף השנה כל ילד הכין ${HM.cnt(k, 'עוגייה', 'עוגיות', true)} יותר.`,
      down: (k) => `כשהקמח כמעט נגמר, כל ילד הכין ${HM.cnt(k, 'עוגייה', 'עוגיות', true)} פחות.`,
      scale: 'למסיבת סוף השנה כל ילד הכין פי 2 עוגיות',
      add: (v) => `ילד נוסף הביא ${HM.cnt(v, 'עוגייה', 'עוגיות', true)}.` },
    { tags: ['nature'], q: 'כמה ציפורים רואים בתצפית?', what: 'מספר הציפורים', lo: 3, hi: 15,
      up: (k) => `בתצפית של הבוקר כל ילד ספר ${HM.cnt(k, 'ציפור', 'ציפורים', true)} יותר.`,
      down: (k) => `ביום הגשום כל ילד ספר ${HM.cnt(k, 'ציפור', 'ציפורים', true)} פחות.`,
      scale: 'בתצפית ליד האגם כל ילד ספר פי 2 ציפורים',
      add: (v) => `ילד נוסף הצטרף לתצפית וספר ${HM.cnt(v, 'ציפור', 'ציפורים', true)}.` },
    { tags: ['art'], q: 'כמה ציורים מכין כל ילד לתערוכה?', what: 'מספר הציורים', lo: 1, hi: 8,
      up: (k) => `לפני הפתיחה כל ילד הוסיף ${HM.cnt(k, 'ציור', 'ציורים')}.`,
      down: (k) => `בגלל חוסר מקום, כל ילד הוריד ${HM.cnt(k, 'ציור', 'ציורים')} מהתערוכה.`,
      scale: 'לתערוכה הבאה כל ילד הכין פי 2 ציורים',
      add: (v) => `ילד נוסף הביא לתערוכה ${HM.cnt(v, 'ציור', 'ציורים')}.` },
    { tags: ['kpop'], q: 'כמה פוטוקארדים יש לכל חבר במועדון המעריצים?', what: 'מספר הפוטוקארדים', lo: 4, hi: 20,
      up: (k) => `אחרי ההופעה כל ילד קיבל עוד ${HM.cnt(k, 'פוטוקארד', 'פוטוקארדים')}.`,
      down: (k) => `כל ילד נתן במתנה ${HM.cnt(k, 'פוטוקארד', 'פוטוקארדים')} לחבר חדש במועדון.`,
      scale: 'אחרי שיצא האלבום החדש, לכל ילד היו פי 2 פוטוקארדים',
      add: (v) => `למועדון הצטרף ילד חדש, שיש לו ${HM.cnt(v, 'פוטוקארד', 'פוטוקארדים')}.` },
    { tags: ['magic'], q: 'כמה נקודות צובר כל תלמיד לבית שלו בבית הספר לקוסמים?', what: 'מספר הנקודות', lo: 5, hi: 20,
      up: (k) => `בשבוע תחרות הבתים כל תלמיד צבר ${HM.cnt(k, 'נקודה', 'נקודות', true)} יותר.`,
      down: (k) => `כל התלמידים איחרו לשיעור שיקויים, ולכל אחד הורידו ${HM.cnt(k, 'נקודה', 'נקודות', true)}.`,
      scale: 'בשבוע תחרות הבתים כל תלמיד צבר פי 2 נקודות',
      add: (v) => `לבית הצטרף תלמיד חדש, שצבר ${HM.cnt(v, 'נקודה', 'נקודות', true)}.` },
    { tags: ['squishy'], q: 'כמה שניות לוקח לסקווישי לחזור לצורתו?', what: 'זמן החזרה', unitIn: 'בשניות', lo: 3, hi: 12, labels: SQUISH,
      up: (k) => `אחרי לילה במקרר, כל סקווישי לקח ${HM.cnt(k, 'שנייה', 'שניות', true)} יותר לחזור לצורתו.`,
      down: (k) => `אחרי שחיממו אותם בידיים, כל סקווישי לקח ${HM.cnt(k, 'שנייה', 'שניות', true)} פחות לחזור לצורתו.`,
      scale: 'אחרי לילה במקפיא, כל סקווישי לקח פי 2 זמן לחזור לצורתו',
      add: (v) => `לאוסף הצטרף סקווישי חדש, שחוזר לצורתו ב-${v} שניות.` },
  ];
  // נתוני מחקר: n ערכים עם ממוצע שלם (ואופציונלית שכיח יחיד)
  function research(c, opts) {
    opts = opts || {};
    const pool = RES.filter((r) => (!opts.need || r[opts.need]));
    const sc = c.scene(pool), n = opts.n || c.pick([4, 5]), p = c.chance(0.5) ? c.me : c.friend();
    const loM = sc.lo + 1, hiM = sc.hi - 1;
    let M = c.rnd(loM, hiM), vals;
    for (let t = 0; t < 30; t++) {
      vals = withMean(c, n, M, sc.lo, sc.hi, opts.mode ? (a) => modeOf(a) !== null && (!opts.modeNotMean || modeOf(a) !== M) : null);
      if (!opts.mode || (modeOf(vals) !== null && (!opts.modeNotMean || modeOf(vals) !== M))) break;
      M = c.rnd(loM, hiM);
    }
    const labels = sc.pups ? c.sample(PUPS, n) : sc.labels ? c.sample(sc.labels, n) : crew(c, n).map((f) => f.name);
    const subj = sc.pups ? 'הגורים' : sc.what === 'גובה הרקטות' ? 'הרקטות' : 'הילדים';
    const head = `${p.name} ${p.g('חקר', 'חקרה')} את השאלה: "${sc.q}"`;
    const list = `הנתונים${sc.unitIn ? ' (' + sc.unitIn + ')' : ''}: ${HM.seq(vals)}`;
    return { sc, n, p, M, vals, s: n * M, labels, subj, head, list };
  }
  const rchart = (R, o) => V.barChart(Object.assign({ labels: R.labels, values: R.vals, w: 420, h: 260, max: MX(R.vals) + 1, step: R.sc.step || (MX(R.vals) > 12 ? 2 : 1) }, o || {}));
  const MEASURES = [
    { tags: ['animals'], q: 'איזו חיית מחמד הכי אהובה בכיתה?', a: 0 }, { tags: ['sport'], q: 'באיזה ענף ספורט בחרו הכי הרבה ילדים?', a: 0 },
    { tags: [], q: 'איזו מידת נעליים הכי נפוצה בכיתה?', a: 0 }, { tags: [], q: 'איזה ציון קיבלו הכי הרבה תלמידים במבחן?', a: 0 },
    { tags: ['art'], q: 'איזה צבע בחרו הכי הרבה ילדים?', a: 0 }, { tags: ['music'], q: 'על איזה כלי נגינה מנגנים הכי הרבה ילדים בשכבה?', a: 0 },
    { tags: ['reading'], q: 'אם כל הילדים יקראו אותו מספר ספרים, כמה ספרים יקרא כל ילד?', a: 1 },
    { tags: ['sport'], q: 'כמה נקודות קלע כל שחקן, אם מחלקים את כל הנקודות של הקבוצה שווה בשווה?', a: 1 },
    { tags: ['games', 'tech'], q: 'כמה שעות מסך יש לכל ילד, אם מחלקים את כל השעות שווה בשווה בין הילדים?', a: 1 },
    { tags: ['space'], q: 'כמה כוכבים נופלים ראו בכל לילה, אם מחלקים את כל מה שראו שווה בשווה בין הלילות?', a: 1 },
    { tags: ['baking'], q: 'כמה עוגיות הכינו כל ילדי הכיתה יחד?', a: 2 }, { tags: ['nature'], q: 'כמה קילומטרים הלכה הקבוצה בכל ימי הטיול ביחד?', a: 2 },
    { tags: ['reading'], q: 'כמה ספרים קראו כל ילדי הכיתה בסך הכול?', a: 2 }, { tags: ['animals'], q: 'כמה ביצים הטילו כל התרנגולות בלול השבוע?', a: 2 },
    { tags: ['kpop'], q: 'איזה פוטוקארד הכי נפוץ באוספים של חברי המועדון?', a: 0 }, { tags: ['kpop'], q: 'כמה מקלות אור קנו כל חברי המועדון יחד?', a: 2 },
    { tags: ['magic'], q: 'איזה בית קיבל הכי הרבה קולות בהצבעה בבית הספר לקוסמים?', a: 0 }, { tags: ['magic'], q: 'כמה נקודות יקבל כל תלמיד, אם מחלקים את נקודות הבית שווה בשווה?', a: 1 },
    { tags: ['squishy'], q: 'איזו צורת סקווישי הכי נפוצה בכיתה?', a: 0 }, { tags: ['squishy'], q: 'כמה סקווישים יהיו לכל ילד, אם מחלקים את כל הסקווישים שווה בשווה?', a: 1 },
  ];

  HM.lesson({
    id: 'data-research',
    learn: (c) => {
      const kids = crew(c, 6), names = kids.map((k) => k.name), scr = [3, 2, 4, 2, 1, 6];
      const two = crew(c, 3).map((k) => k.name);
      return [
        {
          title: 'יוצאים למחקר!',
          html: `${c.name}, ${c.g('אתה חוקר', 'את חוקרת')} נתונים! כל מחקר עובר כמה שלבים:<br>1. ${b('שאלת חקר')} — מה רוצים לדעת?<br>2. ${b('איסוף נתונים')} — סקר, מדידה או ספירה.<br>3. ${b('ארגון')} — טבלה או דיאגרמה.<br>4. ${b('חישוב')} — שכיח, ממוצע.<br>5. ${b('מסקנה')} — מה גילינו?`,
        },
        {
          title: 'דוגמה למחקר',
          html: `שאלת חקר: "כמה זמן ביום ילדי הקבוצה מול מסך?"<br>${c.name} ${c.g('שאל', 'שאלה')} 6 ילדים, ${c.g('ורשם', 'ורשמה')} את התשובות בשעות. הקו המקווקו הוא הממוצע.`,
          visual: V.barChart({ labels: names, values: scr, line: 3, lineLabel: NOLAB, title: 'שעות מסך ביום', w: 420, h: 250, max: 7, step: 1 }),
          steps: [
            'השכיח: 2 שעות (מופיע פעמיים).',
            `הממוצע: ${m('(3 + 2 + 4 + 2 + 1 + 6) : 6 = 18 : 6 = 3')} שעות.`,
            `מסקנה: בממוצע 3 שעות ביום, אבל הכי הרבה ילדים צופים שעתיים. ${names[5]}, שצופה 6 שעות, "מושך" את הממוצע למעלה.`,
          ],
        },
        {
          title: 'כל נתון גדל באותו מספר',
          html: `אחרי שנה כל ילד בקבוצה ${b('גבה ב-5 ס"מ')}. מה קרה לגובה הממוצע?<br>כל עמודה עלתה ב-5, ולכן גם קו הממוצע עלה ב-5.<br>${HM.hl('אם כל נתון גדל (או קטן) באותו מספר — הממוצע גדל (או קטן) באותו מספר.')}`,
          visual: V.table(['', two[0], two[1], two[2], 'ממוצע'], [['לפני', 130, 134, 138, 134], ['אחרי שנה', 135, 139, 143, 139]], { rowHead: true }),
        },
        {
          title: 'כל נתון גדל פי 2',
          html: `בחודש הקריאה כל ילד קרא ${b('פי 2')} ספרים מבחודש הקודם: 1, 3 ו-5 הפכו ל-2, 6 ו-10.<br>הממוצע היה ${m('9 : 3 = 3')}, ועכשיו ${m('18 : 3 = 6')} — גם הוא גדל פי 2.<br>${HM.hl('כשכל נתון גדל פי מספר מסוים, גם הממוצע גדל פי אותו מספר.')}`,
          visual: V.table(['', two[0], two[1], two[2], 'ממוצע'], [['חודש קודם', 1, 3, 5, 3], ['חודש הקריאה', 2, 6, 10, 6]], { rowHead: true }),
        },
        {
          title: 'מצטרף נתון השווה לממוצע',
          html: `לקבוצה הצטרף ילד חדש, והגובה שלו 134 ס"מ — ${b('בדיוק כמו הממוצע')} (הקו המקווקו). הממוצע ${b('לא משתנה')}!<br>למה? העמודה החדשה כבר בגובה הקו, אז אין מה להעביר אליה או ממנה.<br>${m('(402 + 134) : 4 = 536 : 4 = 134')}`,
          visual: V.barChart({ labels: two.concat(['חדש']), values: [130, 134, 138, 134], hl: [3], line: 134, lineLabel: NOLAB, w: 380, h: 240, max: 150, step: 50 }),
          quiz: {
            type: 'number', prompt: 'הממוצע של 4 ילדים הוא 9 ספרים. הצטרף ילד חמישי שקרא 9 ספרים. מה הממוצע עכשיו?', answer: 9,
            hint: 'הנתון החדש שווה לממוצע.',
            solution: ['נתון השווה לממוצע לא משנה את הממוצע.', m('(36 + 9) : 5 = 45 : 5 = 9')],
          },
        },
        {
          title: 'שכיח או ממוצע?',
          html: `לכל שאלה — הכלי המתאים:<br>• "איזה ספורט הכי אהוב בכיתה?" — הנתונים הם מילים, אז מחפשים את ${b('השכיח')}. אין ממוצע של מילים!<br>• "כמה ספרים קוראים בחודש?" — הנתונים הם מספרים, ואפשר לחשב ${b('ממוצע')} וגם למצוא שכיח.`,
          quiz: {
            type: 'choice', keep: true, prompt: 'כדי לדעת איזו חיית מחמד הכי אהובה בכיתה, מה מחפשים?',
            choices: ['את השכיח', 'את הממוצע', 'את הסכום'], answer: 0,
            hint: 'הנתונים הם שמות של חיות, לא מספרים.',
            solution: ['החיה שבחרו הכי הרבה ילדים היא השכיח.'],
          },
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['shiftUp', 'shiftDir', 'researchMode', 'researchMean', 'addEqual', 'measure']
        : level === 2 ? ['freqTableMean', 'scale', 'chartBoth', 'meanChoice', 'shiftSlot', 'shiftDir2']
        : ['reverseShift', 'shiftAndAdd', 'missingVal', 'compareGroups', 'tfScale', 'oneValue'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'shiftUp': {
          const R = research(c), k = c.rnd(1, R.sc.lo > 100 ? 8 : 3), nv = R.vals.map((v) => v + k);
          return {
            type: 'number', answer: R.M + k,
            prompt: `${R.head}<br>${R.list}<br>${R.sc.what} הממוצע הוא ${R.M}. ${R.sc.up(k)}<br>מה ${R.sc.what} הממוצע עכשיו?`,
            hint: `כל נתון גדל ב-${k}. מה קורה לקו הממוצע כשכל העמודות עולות באותה מידה?`,
            solution: [`כל נתון גדל ב-${k}, לכן גם הממוצע גדל ב-${k}.`, m(`${R.M} + ${k} = ${R.M + k}`), `${c.g('בדוק', 'בדקי')}: ${m(`(${plus(nv)}) : ${R.n} = ${R.M + k}`)}`],
          };
        }
        case 'shiftDir':
        case 'shiftDir2': {
          const R = research(c, kind === 'shiftDir2' ? { need: 'down', n: c.pick([5, 6]) } : {});
          const down = !!R.sc.down && (kind === 'shiftDir2' || c.chance(0.4));
          const k = down ? c.rnd(1, Math.min(3, MN(R.vals) - 1 > 0 ? MN(R.vals) - 1 : 1)) : c.rnd(1, R.sc.lo > 100 ? 8 : 3);
          const ch = down ? [`הממוצע קטן ב-${k}`, `הממוצע גדל ב-${k}`, 'הממוצע לא השתנה', `הממוצע קטן ב-${k * R.n}`]
            : [`הממוצע גדל ב-${k}`, `הממוצע קטן ב-${k}`, 'הממוצע לא השתנה', `הממוצע גדל ב-${k * R.n}`];
          return {
            type: 'choice', answer: 0, choices: ch,
            prompt: `${R.head}<br>${R.list}<br>${down ? R.sc.down(k) : R.sc.up(k)} מה קרה לממוצע?`,
            hint: `כל עמודה ${down ? 'יורדת' : 'עולה'} ב-${k}. ${c.g('דמיין', 'דמייני')} מה קורה לקו הממוצע.`,
            solution: [`כל נתון ${down ? 'קטן' : 'גדל'} ב-${k}, ולכן גם הממוצע ${down ? 'קטן' : 'גדל'} ב-${k} — ולא ב-${k * R.n}.`, `${c.g('בדוק', 'בדקי')}: הממוצע היה ${m(`${R.s} : ${R.n} = ${R.M}`)}, ועכשיו ${down ? R.M - k : R.M + k}.`],
          };
        }
        case 'researchMode': {
          const R = research(c, { n: c.pick([6, 7]), mode: true });
          const mo = modeOf(R.vals);
          return {
            type: 'number', answer: mo,
            prompt: `${R.head}<br>${R.p.g('הוא הציג', 'היא הציגה')} את הנתונים בדיאגרמה. מה ${b('השכיח')}?`,
            visual: rchart(R),
            hint: `השכיח הוא הנתון שמופיע הכי הרבה פעמים. ${c.g('חפש', 'חפשי')} עמודות באותו גובה.`,
            solution: [`הנתונים: ${andNums(R.vals)}.`, `${mo} מופיע ${times(R.vals.filter((v) => v === mo).length)} — יותר מכל נתון אחר. השכיח הוא ${mo}.`],
          };
        }
        case 'researchMean': {
          const R = research(c, { n: c.pick([4, 5]) });
          return {
            type: 'number', answer: R.M,
            prompt: `${R.head}<br>${R.p.g('הוא הציג', 'היא הציגה')} את הנתונים בדיאגרמה. מה ${R.sc.what} ${b('הממוצע')}?`,
            visual: rchart(R),
            hint: `${c.g('חבר', 'חברי')} את כל הנתונים, ${c.g('וחלק', 'וחלקי')} ב-${R.n}.`,
            solution: [m(`${plus(R.vals)} = ${R.s}`), m(`${R.s} : ${R.n} = ${R.M}`)],
          };
        }
        case 'addEqual': {
          const R = research(c), same = c.chance(0.5), v = same ? R.M : R.M + c.pick([-2, -1, 1, 2]);
          return {
            type: 'tf', answer: same,
            prompt: `${R.head}<br>${R.list}<br>${R.sc.what} הממוצע הוא ${R.M}. ${R.sc.add(v)} עכשיו הממוצע לא השתנה.`,
            hint: `${c.g('השווה', 'השווי')} את הנתון החדש לממוצע.`,
            solution: [relTxt(v, R.M), same ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
        case 'measure': {
          const { q, a } = c.scene(MEASURES), p = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'choice', keep: true, choices: ['השכיח', 'הממוצע', 'הסכום'], answer: a,
            prompt: `${p.name} ${p.g('רוצה', 'רוצה')} לענות על השאלה: "${q}"<br>מה ${p.g('הוא צריך', 'היא צריכה')} למצוא בנתונים?`,
            hint: 'שכיח — הנתון הכי נפוץ. ממוצע — "מחלקים שווה בשווה". סכום — כמה בסך הכול.',
            solution: [a === 0 ? 'השאלה היא מה הכי נפוץ — זה השכיח.' : a === 1 ? 'השאלה היא כמה לכל אחד אם מחלקים שווה בשווה — זה הממוצע.' : 'השאלה היא כמה בסך הכול — זה הסכום.'],
          };
        }
        case 'freqTableMean': {
          const sc = c.scene(FTABLES), d = ftData(c, sc, c.pick([3, 4])), p = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'number', answer: d.M,
            prompt: `${p.name} ${p.g('ערך', 'ערכה')} מחקר: ${sc.t}? ${p.g('הוא סידר', 'היא סידרה')} את התוצאות בטבלה.<br>מה ${sc.q}?`,
            visual: V.table([sc.head, sc.col], d.vals.map((v, i) => [v, d.f[i]])),
            hint: `${c.g('כפול', 'כפלי')} כל נתון בשכיחות שלו ${c.g('וחבר', 'וחברי')}. אחר כך ${c.g('חלק', 'חלקי')} ב${sc.colDef}.`,
            solution: ftSolution(c, sc, d),
          };
        }
        case 'scale': {
          const R = research(c, { need: 'scale' });
          return {
            type: 'number', answer: 2 * R.M,
            prompt: `${R.head}<br>${R.list}<br>${R.sc.what} הממוצע הוא ${R.M}. ${R.sc.scale}.<br>מה ${R.sc.what} הממוצע עכשיו?`,
            hint: 'כל נתון גדל פי 2. מה קורה לסכום? ומה לממוצע?',
            solution: ['כל נתון גדל פי 2, לכן גם הסכום גדל פי 2 — וגם הממוצע.', m(`${R.M} × 2 = ${2 * R.M}`), `${c.g('בדוק', 'בדקי')}: ${m(`(${plus(R.vals.map((v) => 2 * v))}) : ${R.n} = ${2 * R.M}`)}`],
          };
        }
        case 'chartBoth': {
          const R = research(c, { n: c.pick([6, 7]), mode: true, modeNotMean: true }), mo = modeOf(R.vals);
          return {
            type: 'number', answer: [mo, R.M], labels: ['השכיח', 'הממוצע'],
            prompt: `${R.head}<br>מה ${b('השכיח')} ומה ${b('הממוצע')} של הנתונים בדיאגרמה?`,
            visual: rchart(R),
            hint: `השכיח — הנתון שמופיע הכי הרבה פעמים. הממוצע — סכום הנתונים : ${R.n}.`,
            solution: [`השכיח: ${mo} (מופיע ${times(R.vals.filter((v) => v === mo).length)}).`, `הממוצע: ${m(`${R.s} : ${R.n} = ${R.M}`)}`, 'השכיח והממוצע לא תמיד שווים!'],
          };
        }
        case 'meanChoice': {
          const R = research(c, { n: c.pick([5, 6]), mode: true, modeNotMean: true }), mo = modeOf(R.vals);
          const ch = HM.numChoices(R.M, [mo, MX(R.vals), R.s, MN(R.vals)]);
          return {
            type: 'choice', answer: 0, choices: ch.choices,
            prompt: `${R.head}<br>מה ${R.sc.what} ${b('הממוצע')} לפי הדיאגרמה?`,
            visual: rchart(R),
            hint: `${c.g('היזהר', 'היזהרי')}: הממוצע הוא לא העמודה הגבוהה ביותר ולא הנתון השכיח. ${c.g('חבר', 'חברי')} ${c.g('וחלק', 'וחלקי')} ב-${R.n}.`,
            solution: [m(`${plus(R.vals)} = ${R.s}`), m(`${R.s} : ${R.n} = ${R.M}`)],
          };
        }
        case 'shiftSlot': {
          const R = research(c), k = c.rnd(2, R.sc.lo > 100 ? 9 : 5), nv = R.vals.map((v) => v + k);
          return {
            type: 'number', answer: R.M + k,
            prompt: `הממוצע של ${HM.seq(R.vals)} הוא ${R.M}. ${c.g('חשב', 'חשבי')} ${b('בלי לחבר הכול')}:<br>${m(`(${plus(nv)}) : ${R.n} = ` + HM.slot(0))}`,
            hint: `${c.g('השווה', 'השווי')} את הנתונים החדשים לישנים: בכמה גדל כל אחד?`,
            solution: [`כל נתון גדל ב-${k}, לכן גם הממוצע גדל ב-${k}.`, m(`${R.M} + ${k} = ${R.M + k}`)],
          };
        }
        case 'reverseShift': {
          const scaleQ = c.chance(0.35);
          const R = research(c, scaleQ ? { need: 'scale' } : {});
          if (scaleQ) {
            return {
              type: 'number', answer: R.M,
              prompt: `${R.head}<br>${R.sc.scale}, ועכשיו ${R.sc.what} הממוצע הוא ${2 * R.M}.<br>מה היה ${R.sc.what} הממוצע ${b('לפני')} השינוי?`,
              hint: 'אם כל נתון גדל פי 2, גם הממוצע גדל פי 2. איך חוזרים אחורה?',
              solution: ['הממוצע גדל פי 2, לכן לפני השינוי הוא היה חצי.', m(`${2 * R.M} : 2 = ${R.M}`)],
            };
          }
          const k = c.rnd(2, R.sc.lo > 100 ? 9 : 4);
          return {
            type: 'number', answer: R.M,
            prompt: `${R.head}<br>${R.sc.up(k)} אחרי השינוי, ${R.sc.what} הממוצע הוא ${R.M + k}.<br>מה היה ${R.sc.what} הממוצע ${b('לפני')} השינוי?`,
            hint: `כל נתון גדל ב-${k}. בכמה גדל הממוצע?`,
            solution: [`הממוצע גדל ב-${k}, לכן לפני השינוי: ${m(`${R.M + k} − ${k} = ${R.M}`)}`],
          };
        }
        case 'shiftAndAdd': {
          const R = research(c), k = c.rnd(1, R.sc.lo > 100 ? 6 : 3);
          return {
            type: 'number', answer: R.M + k,
            prompt: `${R.head}<br>${R.sc.what} הממוצע היה ${R.M}.<br>${R.sc.up(k)} אחר כך: ${R.sc.add(R.M + k)}<br>מה ${R.sc.what} הממוצע עכשיו?`,
            hint: 'שני שלבים: מה קרה לממוצע כשכל נתון גדל? ומה קורה כשמצטרף נתון השווה לממוצע החדש?',
            solution: [`כל נתון גדל ב-${k}, לכן הממוצע גדל ל-${m(`${R.M} + ${k} = ${R.M + k}`)}.`, `הנתון החדש (${R.M + k}) שווה לממוצע החדש — הוא לא משנה אותו.`, `${R.sc.what} הממוצע: ${R.M + k}.`],
          };
        }
        case 'missingVal': {
          const R = research(c, { n: c.pick([4, 5]) });
          const given = R.vals.slice(0, R.n - 1), x = R.vals[R.n - 1], sg = SUM(given);
          return {
            type: 'number', answer: x,
            prompt: `${R.head}<br>הנתונים${R.sc.unitIn ? ' (' + R.sc.unitIn + ')' : ''}: ${HM.seq(given.concat([HM.slot(0)]))}<br>נתון אחד נמחק, אבל ידוע ש${R.sc.what} הממוצע הוא ${R.M}. מה הנתון החסר?`,
            hint: `הסכום של כל ${R.n} הנתונים הוא ${m(`${R.n} × ${R.M}`)}.`,
            solution: [`סכום כל הנתונים: ${m(`${R.n} × ${R.M} = ${R.s}`)}`, `הנתונים הידועים: ${m(`${plus(given)} = ${sg}`)}`, m(`${R.s} − ${sg} = ${x}`)],
          };
        }
        case 'compareGroups': {
          const sc = c.scene(RES.filter((r) => !r.pups && !r.labels)), cl = c.pick(CLASSES), p = c.chance(0.5) ? c.me : c.friend();
          const n1 = c.pick([3, 4]), n2 = c.pick([4, 5, 6].filter((x) => x !== n1));
          const M1 = c.rnd(sc.lo + 1, sc.hi - 1), M2 = c.chance(0.2) ? M1 : Math.min(sc.hi - 1, Math.max(sc.lo + 1, M1 + c.pick([-2, -1, 1, 2])));
          const v1 = withMean(c, n1, M1, sc.lo, sc.hi), v2 = withMean(c, n2, M2, sc.lo, sc.hi);
          return {
            type: 'compare', left: cl[0], right: cl[1], lv: M1, rv: M2, answer: cmpAns(M1, M2),
            prompt: `${p.name} ${p.g('חקר', 'חקרה')} בשתי כיתות: "${sc.q}"<br>${cl[0]}: ${HM.seq(v1)}<br>${cl[1]}: ${HM.seq(v2)}<br>${c.g('השלם', 'השלימי')} את הסימן &gt;, &lt; או = בין ${b('הממוצעים')}:`,
            hint: `${c.g('חשב', 'חשבי')} את הממוצע של כל כיתה בנפרד. ${c.g('שים לב', 'שימי לב')}: מספר הנתונים שונה!`,
            solution: [`${cl[0]}: ${m(`${SUM(v1)} : ${n1} = ${M1}`)}`, `${cl[1]}: ${m(`${SUM(v2)} : ${n2} = ${M2}`)}`, m(`${M1}${signOf(M1, M2)}${M2}`)],
          };
        }
        case 'tfScale': {
          const ty = c.rnd(0, 3), R = research(c, ty === 0 ? { need: 'scale' } : {}), k = c.rnd(2, R.sc.lo > 100 ? 6 : 3);
          let stmt, ans, sol;
          if (ty === 0) { stmt = `${R.sc.scale}. לכן גם ${R.sc.what} הממוצע גדל פי 2.`; ans = true; sol = [`הממוצע היה ${R.M} ועכשיו ${2 * R.M} — פי 2.`]; }
          else if (ty === 1) { stmt = `${R.sc.up(k)} לכן ${R.sc.what} הממוצע גדל ב-${k * R.n}.`; ans = false; sol = [`כל נתון גדל ב-${k}, לכן הממוצע גדל ב-${k} בלבד (ולא ב-${k * R.n}).`]; }
          else if (ty === 2) { stmt = `${R.sc.up(k)} לכן ${R.sc.what} הממוצע גדל ב-${k}.`; ans = true; sol = [`כל נתון גדל ב-${k}, לכן גם הממוצע גדל ב-${k}: מ-${R.M} ל-${R.M + k}.`]; }
          else { stmt = `רק אחד הנתונים גדל ב-${k * R.n}, והשאר לא השתנו. לכן ${R.sc.what} הממוצע גדל ב-${k * R.n}.`; ans = false; sol = [`התוספת ${k * R.n} מתחלקת בין כל ${R.n} הנתונים: ${m(`${k * R.n} : ${R.n} = ${k}`)}`, `הממוצע גדל ב-${k} בלבד.`]; }
          return {
            type: 'tf', answer: ans,
            prompt: `${R.head}<br>${R.list}<br>${stmt}`,
            hint: `${c.g('דמיין', 'דמייני')} את העמודות: מה קורה לקו הממוצע?`,
            solution: sol.concat([ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.']),
          };
        }
        case 'oneValue': {
          const R = research(c), j = c.rnd(1, R.sc.lo > 100 ? 3 : 2), add = j * R.n, lab = R.labels[c.rnd(0, R.n - 1)], who = R.sc.labels ? `סקווישי ה${lab}` : lab;
          return {
            type: 'number', answer: R.M + j,
            prompt: `${R.head}<br>${R.sc.what} הממוצע לפי הדיאגרמה הוא ${R.M}. מתברר שהנתון של ${who} נרשם בטעות, ו${b('רק אותו')} צריך להגדיל ב-${add}. מה ${R.sc.what} הממוצע אחרי התיקון?`,
            visual: rchart(R),
            hint: `הסכום גדל ב-${add}. מה קורה כשמחלקים את התוספת בין כל ${R.n} הנתונים?`,
            solution: [`הסכום גדל ב-${add}, והתוספת מתחלקת בין ${R.n} הנתונים: ${m(`${add} : ${R.n} = ${j}`)}`, `הממוצע החדש: ${m(`${R.M} + ${j} = ${R.M + j}`)}`],
          };
        }
      }
      return null;
    },
  });
})(HM);
