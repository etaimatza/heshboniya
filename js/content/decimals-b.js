/* חשבוניה — כוכב העשרוניים, חלק ב׳: דרכי המרה, חיבור וחיסור במאונך, סדרות, מספר בין מספרים, עיגול ואחוזים */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { frac: F, m, b } = HM;
  const D = HM.dec;
  const POW = [1, 10, 100, 1000];
  const UN = ['', 'עשיריות', 'מאיות', 'אלפיות'];
  const US = ['', 'עשירית', 'מאית', 'אלפית'];
  const val = (i, p) => HM.round(i / POW[p]);
  const cntU = (n, p) => HM.cnt(n, US[p], UN[p], true);
  const digs = (p) => HM.cnt(p, 'ספרה', 'ספרות', true);
  const wholes = (w) => HM.cnt(w, 'שלם', 'שלמים');
  // מספר שלם אקראי שאינו מתחלק ב-10 (כדי שהעשרוני יוצג עם כל הספרות)
  const clean = (c, lo, hi) => { let x = c.rnd(lo, hi), g = 0; while (x % 10 === 0 && g++ < 60) x = c.rnd(lo, hi); if (x % 10 === 0) x += 1; return x; };
  // עבודה באלפיות: v = מספר שלם של אלפיות (2350 => 2.35)
  const T = (v) => D(v, 3);
  const plc = (v) => (v % 1000 === 0 ? 0 : v % 100 === 0 ? 1 : v % 10 === 0 ? 2 : 3);
  const TK = (v, q) => D(v / POW[3 - q], q, true); // TK(2500,2) => "2.50"
  const TV = (v) => HM.round(v / 1000);
  const tenths = (c, lo, hi) => clean(c, lo, hi) * 100; // lo..hi בעשיריות
  const hunds = (c, lo, hi) => clean(c, lo, hi) * 10; // lo..hi במאיות
  const near = (v) => Math.floor((v + 500) / 1000); // עיגול למספר שלם (מאלפיות)
  // בחירות ממחרוזות (הראשונה נכונה, בלי כפולים)
  function opts(correct, wrong, k) {
    const out = [correct], seen = new Set([correct]);
    wrong.forEach((w) => { if (w != null && !seen.has(w) && out.length < (k || 4)) { seen.add(w); out.push(w); } });
    return out.map((s) => m(s));
  }
  const pickP = (c) => (c.chance(0.5) ? c.me : c.friend());
  // שתי דמויות שונות
  const duo = (c) => { const a = pickP(c); let b2 = c.friend(), g = 0; while (b2.name === a.name && g++ < 20) b2 = c.friend(); return [a, b2]; };
  const sign = (a, b2) => (a === b2 ? '=' : a < b2 ? '<' : '>');
  const signH = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  const ORD = ['', 'הראשון', 'השני', 'השלישי', 'הרביעי', 'החמישי', 'השישי', 'השביעי', 'השמיני', 'התשיעי', 'העשירי', 'האחד-עשר', 'השנים-עשר'];

  /* ---------- כלים לחישוב במאונך ---------- */
  // ספרות מיושרות לפי הנקודה (עם אפסים)
  function alignDigits(strs) {
    const parts = strs.map((s) => String(s).replace(/,/g, '').split('.'));
    const il = Math.max(...parts.map((p) => p[0].length)), dl = Math.max(...parts.map((p) => (p[1] || '').length));
    return { il, dl, rows: parts.map((p) => (p[0].padStart(il, '0') + (p[1] || '').padEnd(dl, '0')).split('').map(Number)) };
  }
  // נשיאות (המרות) בחיבור, בפריסה של V.column (כולל משבצת לנקודה)
  function carryAdd(rowsStr, resStr) {
    const A = alignDigits(rowsStr.concat([resStr]));
    const n = A.il + A.dl, car = new Array(n).fill('');
    let cr = 0;
    for (let k = n - 1; k >= 0; k--) {
      let s = cr;
      for (let r = 0; r < rowsStr.length; r++) s += A.rows[r][k];
      cr = Math.floor(s / 10);
      if (cr && k > 0) car[k - 1] = String(cr);
    }
    if (A.dl) car.splice(A.il, 0, '');
    return car;
  }
  // טעות נפוצה: חיבור בלי המרה / חיסור "הקטן מהגדול" בכל עמודה
  function slip(strs, op) {
    const A = alignDigits(strs);
    const dg = A.rows[0].map((d, k) => (op === '+' ? A.rows.reduce((s, r) => s + r[k], 0) % 10 : Math.abs(A.rows[0][k] - A.rows[1][k])));
    const ip = dg.slice(0, A.il).join('').replace(/^0+(?=\d)/, ''), dp = dg.slice(A.il).join('');
    return dp ? ip + '.' + dp : ip;
  }
  // האם יש המרה בחיבור / פריטה בחיסור
  function needsRegroup(strs, op) {
    const A = alignDigits(strs);
    if (op === '+') { let cr = 0, any = false; for (let k = A.il + A.dl - 1; k >= 0; k--) { const s = A.rows.reduce((t, r) => t + r[k], 0) + cr; cr = Math.floor(s / 10); if (cr) any = true; } return any; }
    return A.rows[0].some((d, k) => d < A.rows[1][k]);
  }
  // תרגיל במאונך כציור (לשאלות "איך כותבים נכון"): mode 'dot' | 'right' | 'left'
  function colSvg(rows, op, mode) {
    const cw = 20, rh = 32, x0 = 10;
    const info = rows.map((s) => { const i = s.indexOf('.'); return { s, dot: i < 0 ? s.length : i }; });
    const maxDot = Math.max(...info.map((r) => r.dot)), maxL = Math.max(...info.map((r) => r.s.length));
    const off = info.map((r) => (mode === 'dot' ? maxDot - r.dot : mode === 'right' ? maxL - r.s.length : 0));
    const ncol = Math.max(...info.map((r, k) => off[k] + r.s.length)) + 1;
    const W = ncol * cw + x0 * 2, H = rows.length * rh + 22;
    let s = '';
    info.forEach((r, k) => {
      const y = 8 + k * rh + rh / 2;
      if (k === rows.length - 1) s += S.text(x0 + cw / 2, y, op, { fs: 22, fw: 700, cls: 't-a' });
      r.s.split('').forEach((ch, j) => (s += S.text(x0 + (1 + off[k] + j) * cw + cw / 2, y, ch, { fs: 22, fw: 600 })));
    });
    s += S.line(x0, 8 + rows.length * rh + 4, W - x0, 8 + rows.length * rh + 4, { sw: 2.5 });
    return S.svg(W, H, s, { label: 'תרגיל במאונך', maxw: Math.min(W, 170) });
  }
  // ישר מספרים עם תוויות רק בקצוות (ובנקודות שנבחרו)
  const lineLabels = (min, step, places, show) => (v, i) => (show(i) ? D(Math.round((min + i * step) * POW[places]), places) : null);

  /* ---------- שברים "נוחים" (n, d, מאיות) ---------- */
  const NICE = [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [3, 5, 60], [4, 5, 80], [3, 10, 30], [7, 10, 70], [9, 10, 90], [1, 20, 5], [3, 20, 15], [7, 20, 35], [9, 20, 45], [1, 25, 4], [3, 25, 12], [1, 50, 2], [7, 50, 14]];
  // שברים שהמכנה שלהם מחלק את 1000: {n, d, k (אלפיות)}
  function fracsFor(dens) {
    const out = [];
    dens.forEach((d) => { for (let n = 1; n < d; n++) if (HM.gcd(n, d) === 1) out.push({ n, d, k: (n * 1000) / d }); });
    return out;
  }
  const targetOf = (d) => [10, 100, 1000].find((P) => P % d === 0);

  /* ---------- תרחישים משותפים (כמויות עשרוניות) ----------
     one: משפט עם כמות אחת (u1), two/sumQ: שתי כמויות לחיבור (u), left/leftQ: כמה נשאר (u). money: ערכים בשקלים */
  const SC = [
    { tags: ['sport'], max: 8, who: 'מי רץ יותר?', u: 'ק"מ', u1: 'ק"מ', uw1: 'קילומטרים', noun: 'המרחק',
      one: (p, v) => `${p.name} ${p.g('רץ', 'רצה')} ${v} ק"מ`,
      two: (p, x, y) => `${p.name} ${p.g('רץ', 'רצה')} ${x} ק"מ ביום ראשון ו-${y} ק"מ ביום שני.`,
      sumQ: (p) => `כמה קילומטרים ${p.g('רץ', 'רצה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `${p.name} ${p.g('רוצה', 'רוצה')} לרוץ היום ${t} ק"מ. עד עכשיו ${p.g('הוא רץ', 'היא רצה')} ${x} ק"מ.`,
      leftQ: (p) => `כמה קילומטרים נשארו ל${p.name} לרוץ?` },
    { tags: ['animals'], max: 6, who: 'מי נתן לכלב יותר מזון?', u: 'ק"ג', u1: 'ק"ג', uw1: 'קילוגרמים', noun: 'כמות המזון',
      one: (p, v) => `${p.name} ${p.g('נתן', 'נתנה')} לכלב ${v} ק"ג מזון השבוע`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} שק מזון לכלב במשקל ${x} ק"ג ושק מזון לחתול במשקל ${y} ק"ג.`,
      sumQ: (p) => `כמה קילוגרמים של מזון ${p.g('קנה', 'קנתה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `בשק המזון של הכלב של ${p.name} היו ${t} ק"ג. במשך החודש הכלב אכל ${x} ק"ג.`,
      leftQ: () => 'כמה קילוגרמים נשארו בשק?' },
    { tags: ['space'], max: 25, who: 'הטיל של מי עף גבוה יותר?', u: "מ'", u1: "מ'", uw1: 'מטרים', noun: 'הגובה',
      one: (p, v) => `הטיל ש${p.name} ${p.g('בנה', 'בנתה')} עף לגובה ${v} מ'`,
      two: (p, x, y) => `הטיל ש${p.name} ${p.g('בנה', 'בנתה')} עף בשיגור הראשון לגובה ${x} מ'. בשיגור השני הוא עף גבוה יותר ב-${y} מ'.`,
      sumQ: () => 'לאיזה גובה (במטרים) עף הטיל בשיגור השני?',
      left: (p, t, x) => `${p.name} ${p.g('רוצה', 'רוצה')} שהטיל יגיע לגובה ${t} מ'. בינתיים הוא הגיע לגובה ${x} מ'.`,
      leftQ: () => 'כמה מטרים חסרים לטיל כדי להגיע לגובה הרצוי?' },
    { tags: ['music'], who: 'השיר של מי ארוך יותר?', money: true, u: '₪', u1: 'דקות', uw1: 'דקות', noun: 'אורך השיר',
      one: (p, v) => `השיר ש${p.name} ${p.g('הקליט', 'הקליטה')} נמשך ${v} דקות`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} ספר תווים ב-${x} ₪ ומיתרים לגיטרה ב-${y} ₪.`,
      sumQ: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `ל${p.name} היו ${t} ₪. ${p.g('הוא קנה', 'היא קנתה')} מיתרים לגיטרה ב-${x} ₪.`,
      leftQ: (p) => `כמה שקלים נשארו ל${p.name}?` },
    { tags: ['baking'], max: 3, who: 'מי קנה יותר קמח?', u: 'ק"ג', u1: 'ק"ג', uw1: 'קילוגרמים', noun: 'כמות הקמח',
      one: (p, v) => `${p.name} ${p.g('קנה', 'קנתה')} ${v} ק"ג קמח לעוגות`,
      two: (p, x, y) => `${p.name} ${p.g('שם', 'שמה')} בקערה ${x} ק"ג קמח ו-${y} ק"ג סוכר.`,
      sumQ: () => 'כמה קילוגרמים יש בקערה בסך הכול?',
      left: (p, t, x) => `בשקית היו ${t} ק"ג קמח. ${p.name} ${p.g('השתמש', 'השתמשה')} ב-${x} ק"ג לעוגה.`,
      leftQ: () => 'כמה קילוגרמים של קמח נשארו בשקית?' },
    { tags: ['games'], who: 'מי שיחק יותר זמן?', money: true, u: '₪', u1: 'שעות', uw1: 'שעות', noun: 'זמן המשחק',
      one: (p, v) => `${p.name} ${p.g('שיחק', 'שיחקה')} במשחק המחשב ${v} שעות השבוע`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} משחק מחשב ב-${x} ₪ ושלט למשחקים ב-${y} ₪.`,
      sumQ: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `בקופת החיסכון של ${p.name} היו ${t} ₪. ${p.g('הוא קנה', 'היא קנתה')} משחק מחשב ב-${x} ₪.`,
      leftQ: () => 'כמה שקלים נשארו בקופה?' },
    { tags: ['art'], max: 9, who: 'מי גזר סרט ארוך יותר?', u: "מ'", u1: "מ'", uw1: 'מטרים', noun: 'אורך הסרט',
      one: (p, v) => `${p.name} ${p.g('גזר', 'גזרה')} סרט צבעוני באורך ${v} מ'`,
      two: (p, x, y) => `${p.name} ${p.g('גזר', 'גזרה')} סרט אדום באורך ${x} מ' וסרט כחול באורך ${y} מ'.`,
      sumQ: (p) => `כמה מטרים של סרט ${p.g('גזר', 'גזרה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `ל${p.name} היה גליל נייר באורך ${t} מ'. ${p.g('הוא גזר', 'היא גזרה')} ממנו ${x} מ' לציור.`,
      leftQ: () => 'כמה מטרים נשארו בגליל?' },
    { tags: ['nature'], max: 9, who: 'מי הלך יותר?', u: 'ק"מ', u1: 'ק"מ', uw1: 'קילומטרים', noun: 'המרחק',
      one: (p, v) => `${p.name} ${p.g('הלך', 'הלכה')} בטיול ${v} ק"מ`,
      two: (p, x, y) => `בטיול ${p.name} ${p.g('הלך', 'הלכה')} ${x} ק"מ לפני ההפסקה ו-${y} ק"מ אחריה.`,
      sumQ: (p) => `כמה קילומטרים ${p.g('הלך', 'הלכה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `שביל הטיול ארוך ${t} ק"מ. ${p.name} כבר ${p.g('הלך', 'הלכה')} ${x} ק"מ.`,
      leftQ: () => 'כמה קילומטרים נשארו עד סוף השביל?' },
    { tags: ['reading'], who: 'מי קרא יותר זמן?', money: true, u: '₪', u1: 'שעות', uw1: 'שעות', noun: 'זמן הקריאה',
      one: (p, v) => `${p.name} ${p.g('קרא', 'קראה')} ספרים ${v} שעות השבוע`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} ספר הרפתקאות ב-${x} ₪ וחוברת קומיקס ב-${y} ₪.`,
      sumQ: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `ל${p.name} היו ${t} ₪. ${p.g('הוא קנה', 'היא קנתה')} ספר חדש ב-${x} ₪.`,
      leftQ: (p) => `כמה שקלים נשארו ל${p.name}?` },
    { tags: ['tech'], max: 15, who: 'הרובוט של מי נסע יותר?', u: "מ'", u1: "מ'", uw1: 'מטרים', noun: 'המרחק',
      one: (p, v) => `הרובוט של ${p.name} נסע ${v} מ'`,
      two: (p, x, y) => `הרובוט של ${p.name} נסע ${x} מ', ואחר כך עוד ${y} מ'.`,
      sumQ: () => 'כמה מטרים נסע הרובוט בסך הכול?',
      left: (p, t, x) => `הרובוט של ${p.name} צריך להגיע לקו שנמצא במרחק ${t} מ'. הוא כבר נסע ${x} מ'.`,
      leftQ: () => 'כמה מטרים נשארו לרובוט?' },
    { tags: ['kpop'], who: 'מי התאמן יותר זמן?', money: true, u: '₪', u1: 'שעות', uw1: 'שעות', noun: 'זמן האימון',
      one: (p, v) => `${p.name} ${p.g('התאמן', 'התאמנה')} על הריקוד החדש של להקת הקיי-פופ ${v} שעות השבוע`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} אלבום של להקת הקיי-פופ ב-${x} ₪ ומקל אור להופעה ב-${y} ₪.`,
      sumQ: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `ל${p.name} היו ${t} ₪. ${p.g('הוא קנה', 'היא קנתה')} כרטיס להופעת קיי-פופ ב-${x} ₪.`,
      leftQ: (p) => `כמה שקלים נשארו ל${p.name}?` },
    { tags: ['magic'], max: 4, who: 'מי הכין יותר שיקוי?', u: 'ליטר', u1: 'ליטר', uw1: 'ליטרים', noun: 'כמות השיקוי',
      one: (p, v) => `בשיעור שיקויים בבית הספר לקוסמים ${p.name} ${p.g('הכין', 'הכינה')} ${v} ליטר שיקוי`,
      two: (p, x, y) => `בשיעור שיקויים ${p.name} ${p.g('מזג', 'מזגה')} לקדרה ${x} ליטר מי מעיין ו-${y} ליטר מיץ פטל קסום.`,
      sumQ: () => 'כמה ליטרים יש בקדרה בסך הכול?',
      left: (p, t, x) => `בבקבוק השיקוי של ${p.name} היו ${t} ליטר. ${p.g('הוא מזג', 'היא מזגה')} ממנו ${x} ליטר לקדרה.`,
      leftQ: () => 'כמה ליטרים נשארו בבקבוק?' },
    { tags: ['squishy'], who: 'הסקווישי של מי חוזר לצורתו לאט יותר?', money: true, u: '₪', u1: 'שניות', uw1: 'שניות', noun: 'זמן החזרה לצורה',
      one: (p, v) => `הסקווישי של ${p.name} חוזר לצורתו אחרי ${v} שניות`,
      two: (p, x, y) => `${p.name} ${p.g('קנה', 'קנתה')} סקווישי בצורת דונאט ב-${x} ₪ וסקווישי בצורת חתול ב-${y} ₪.`,
      sumQ: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')} ${p.name} בסך הכול?`,
      left: (p, t, x) => `בקופה של ${p.name} היו ${t} ₪. ${p.g('הוא קנה', 'היא קנתה')} סקווישי חדש ב-${x} ₪.`,
      leftQ: () => 'כמה שקלים נשארו בקופה?' },
  ];
  // הצגת ערך (באלפיות) לפי התרחיש: כסף תמיד עם 2 ספרות אחרי הנקודה
  const showV = (sc, v) => (sc.money ? (v % 1000 === 0 ? HM.fmt(v / 1000) : TK(v, 2)) : T(v));

  const NICE3 = NICE.map(([n, d, h]) => ({ n, d, k: h * 10 }));
  // סיפור השוואה: שבר אצל אחד, עשרוני אצל אחר — מי יותר? (list: {n,d,k באלפיות})
  function cmpStory(c, list, deltas) {
    const sc = c.scene(SC), [p1, p2] = duo(c);
    const q = c.pick(list), w = c.rnd(0, 3), fv = w * 1000 + q.k;
    let x = fv + c.pick(deltas.concat(q.n < 10 && q.n * 100 !== q.k ? [q.n * 100 - q.k] : []));
    if (x <= 0 || x === fv) x = fv + deltas[0];
    const fr = w ? HM.mixed(w, q.n, q.d) : F(q.n, q.d), fracBig = fv > x;
    const big = fracBig ? p1 : p2, small = fracBig ? p2 : p1;
    return {
      type: 'choice', answer: 0,
      prompt: `${sc.one(p1, m(fr))}.<br>${sc.one(p2, m(T(x)))}.<br>${sc.who}`,
      choices: [big.name, small.name, 'אי אפשר לדעת'],
      hint: `${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני, ואז ${c.g('השווה', 'השווי')} בין המספרים.`,
      solution: [m(fr + ' = ' + T(fv)), m(T(Math.max(fv, x)) + ' &gt; ' + T(Math.min(fv, x))), `התשובה: ${big.name}.`],
    };
  }
  // סיפור רב-שלבי: שבר + עשרוני, או מספר מעורב − עשרוני → תשובה עשרונית
  function storyFD(c, list) {
    const sc = c.scene(SC.filter((z) => !z.money)), p = pickP(c);
    const q = c.pick(list), w = c.rnd(0, 4), fv = w * 1000 + q.k, fr = w ? HM.mixed(w, q.n, q.d) : F(q.n, q.d);
    if (c.chance(0.55)) {
      const x = c.chance(0.5) ? hunds(c, 11, 399) : tenths(c, 1, 49), r = fv + x;
      return {
        type: 'number', decimal: true, unit: sc.u, answer: TV(r),
        prompt: `${sc.two(p, m(fr), T(x))}<br>${sc.sumQ(p)} ${c.g('כתוב', 'כתבי')} את התשובה כמספר עשרוני.`,
        hint: `קודם ${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני, ואחר כך ${c.g('חבר', 'חברי')}.`,
        solution: [m(fr + ' = ' + T(fv)), m(T(fv) + ' + ' + T(x) + ' = ' + T(r)), `התשובה: ${T(r)} ${sc.u}`],
      };
    }
    const W = w + c.rnd(1, 4), t = W * 1000 + q.k, tf = HM.mixed(W, q.n, q.d);
    const x = c.chance(0.5) ? hunds(c, 11, Math.floor((t - 300) / 10)) : tenths(c, 1, Math.floor((t - 300) / 100)), r = t - x;
    return {
      type: 'number', decimal: true, unit: sc.u, answer: TV(r),
      prompt: `${sc.left(p, m(tf), T(x))}<br>${sc.leftQ(p)} ${c.g('כתוב', 'כתבי')} את התשובה כמספר עשרוני.`,
      hint: `קודם ${c.g('הפוך', 'הפכי')} את המספר המעורב למספר עשרוני, ואחר כך ${c.g('חסר', 'חסרי')}.`,
      solution: [m(tf + ' = ' + T(t)), m(T(t) + ' − ' + T(x) + ' = ' + T(r)), `התשובה: ${T(r)} ${sc.u}`],
    };
  }

  /* ========== מעשרוני לשבר ולהיפך ========== */
  HM.lesson({
    id: 'dec-tofrac',
    learn: (c) => [
      {
        title: 'מה ששומעים — כותבים',
        html: `${c.name}, ${c.g('קרא', 'קראי')} בקול את המספר ${m('0.7')}: "7 ${b('עשיריות')}".<br>מה ששומעים — כותבים כשבר: ${m('0.7 = ' + F(7, 10))}.<br>כל מספר עשרוני הוא בעצם ${HM.hl('שבר שהמכנה שלו 10, 100 או 1000')}.`,
        visual: V.bar(7, 10, { maxw: 300 }),
      },
      {
        title: 'כמה ספרות אחרי הנקודה?',
        html: `מספר הספרות אחרי הנקודה קובע את ${b('המכנה')}:<br>• ספרה אחת ← עשיריות ← מכנה 10: ${m('0.3 = ' + F(3, 10))}<br>• 2 ספרות ← מאיות ← מכנה 100: ${m('0.35 = ' + F(35, 100))}<br>• 3 ספרות ← אלפיות ← מכנה 1000: ${m('0.007 = ' + F(7, 1000))}`,
        visual: V.decTable('0.35'),
      },
      {
        title: 'מספר גדול מ-1',
        html: `מה שלפני הנקודה — ${b('שלמים')}, ומה שאחריה — ${b('שבר')}. כך מקבלים ${b('מספר מעורב')}:<br>${m('2.45 = ' + HM.mixed(2, 45, 100))}<br>אפשר גם לפרק לפי המקומות: ${m('2.45 = 2 + ' + F(4, 10) + ' + ' + F(5, 100))}`,
        visual: V.decTable('2.45'),
      },
      {
        title: 'ואז מצמצמים',
        html: `לפעמים אפשר לצמצם את השבר שקיבלנו: ${m('0.5 = ' + F(5, 10) + ' = ' + F(1, 2))} ו-${m('0.25 = ' + F(25, 100) + ' = ' + F(1, 4))}.<br>איך ${c.g('תכתוב', 'תכתבי')} את ${m('0.36')} כשבר מצומצם?`,
        visual: V.grid(36, { maxw: 200 }),
        steps: [
          `2 ספרות אחרי הנקודה ← מאיות: ${m('0.36 = ' + F(36, 100))}`,
          `המונה והמכנה מתחלקים ב-4: ${m(F(36, 100) + ' = ' + F(9, 25))}`,
          `אי אפשר לצמצם יותר, ולכן ${m('0.36 = ' + F(9, 25))} ✔`,
        ],
      },
      {
        title: 'משבר לעשרוני: זהירות מאפסים',
        html: `כשהמכנה 10, 100 או 1000, כותבים את המונה כך שהספרה האחרונה תעמוד במקום הנכון:<br>${m(F(7, 100) + ' = 0.07')} — 7 מאיות, ולכן ה-7 במקום המאיות.<br>${c.g('שים לב', 'שימי לב')}: ${m('0.7 = 0.70')} (אפס בסוף לא משנה), אבל ${m('0.07 ≠ 0.7')} (אפס באמצע משנה!).`,
        visual: V.decTable('0.07'),
        quiz: { type: 'number', prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני: ${m(F(9, 100) + ' = ' + HM.slot(0))}`, answer: 0.09, decimal: true, hint: 'המכנה 100 ← מאיות: 2 ספרות אחרי הנקודה.', solution: [`9 מאיות: ${m(F(9, 100) + ' = 0.09')}`] },
      },
      {
        title: 'שבר ועשרוני באותו תרגיל',
        html: `כשבתרגיל יש גם שבר וגם מספר עשרוני, קודם ${c.g('הפוך', 'הפכי')} את שניהם ${b('לאותה צורה')}, ורק אז ${c.g('חשב', 'חשבי')}.`,
        visual: V.bars([{ n: 4, d: 10 }, { n: 3, d: 10 }], { labels: ['0.4', { n: 3, d: 10 }] }),
        steps: [`${m('0.4 + ' + F(3, 10) + ' = ?')}`, `${m(F(3, 10) + ' = 0.3')}`, `${m('0.4 + 0.3 = 0.7')} ✔`],
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['toFrac', 'pickFrac', 'fracToDec', 'expanded', 'tfZero', 'story1', 'story1', 'story1']
        : level === 2 ? ['toMixed', 'reduce', 'fracToDec', 'pickDec', 'cmp', 'tfZero', 'mixCalc', 'story', 'story', 'storyCmp', 'storyCmp']
        : ['reduce', 'mixCalc', 'cmp', 'expanded3', 'tfZero', 'toMixed', 'story', 'storySum', 'storySum', 'storySum'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'story1': {
          const sc = c.scene(SC), p = pickP(c), q = c.pick([1, 1, 2]), P = POW[q];
          const w = c.chance(0.3) ? c.rnd(1, 5) : 0, f = q === 1 ? c.rnd(1, 9) : clean(c, 1, 99), i = w * P + f;
          return {
            type: 'fraction', mixed: !!w, answer: w ? { w, n: f, d: P } : { n: f, d: P },
            prompt: `${sc.one(p, D(i, q))}.<br>${c.g('כתוב', 'כתבי')} את ${m(D(i, q))} ${sc.u1} ${w ? 'כמספר מעורב' : 'כשבר'}.`,
            hint: `${c.g('קרא', 'קראי')} את המספר בקול: ${q === 1 ? 'ספרה אחת אחרי הנקודה ← עשיריות' : '2 ספרות אחרי הנקודה ← מאיות'}.`,
            solution: [`${w ? wholes(w) + ' ו-' : ''}${cntU(f, q)}.`, `התשובה: ${m(D(i, q) + ' = ' + (w ? HM.mixed(w, f, P) : F(f, P)))} ${sc.u1}`],
          };
        }
        case 'storyCmp': return cmpStory(c, NICE3, [50, -50, 100, -100, 10, -10]);
        case 'storySum': return storyFD(c, NICE3.filter((z) => z.d !== 10));
        case 'toFrac': {
          const p = level === 1 ? c.pick([1, 2]) : c.pick([1, 2, 3]), P = POW[p];
          const f = p === 1 ? c.rnd(1, 9) : clean(c, 1, P - 1);
          return {
            type: 'fraction', prompt: `${c.g('כתוב', 'כתבי')} את ${m(D(f, p))} כשבר.`,
            visual: level === 1 ? (p === 1 ? V.bar(f, 10, { maxw: 300 }) : V.grid(f, { maxw: 200 })) : undefined,
            answer: { n: f, d: P },
            hint: 'כמה ספרות יש אחרי הנקודה? ספרה אחת ← מכנה 10, 2 ספרות ← מכנה 100, 3 ספרות ← מכנה 1000.',
            solution: [`ב-${m(D(f, p))} יש ${digs(p)} אחרי הנקודה ← ${UN[p]}.`, `קוראים "${cntU(f, p)}", ולכן ${m(D(f, p) + ' = ' + F(f, P))}`],
          };
        }
        case 'toMixed': {
          const p = level === 2 ? c.pick([1, 2]) : c.pick([2, 3]), P = POW[p];
          const w = level === 2 ? c.rnd(1, 9) : c.rnd(2, 40), f = p === 1 ? c.rnd(1, 9) : clean(c, 1, P - 1), i = w * P + f;
          return {
            type: 'fraction', mixed: true, prompt: `${c.g('כתוב', 'כתבי')} את ${m(D(i, p))} כמספר מעורב.`,
            answer: { w, n: f, d: P },
            hint: `מה שלפני הנקודה הוא השלמים. את מה שאחרי הנקודה ${c.g('כתוב', 'כתבי')} כשבר.`,
            solution: [`השלמים: ${w}.`, `אחרי הנקודה: ${cntU(f, p)}, כלומר ${m(F(f, P))}.`, m(D(i, p) + ' = ' + HM.mixed(w, f, P))],
          };
        }
        case 'reduce': {
          const p = level === 2 ? c.pick([1, 2, 2]) : c.pick([2, 3]), P = POW[p];
          const f = p === 1 ? c.pick([2, 4, 5, 6, 8])
            : p === 2 ? c.pick([25, 75, 5, 15, 35, 45, 4, 8, 12, 16, 24, 36, 48, 52, 64, 85, 95, 2, 6, 14, 22, 28, 44, 55, 65, 68, 72, 84, 96])
            : c.pick([125, 375, 625, 875, 25, 75, 5, 8, 16, 24, 45, 64]);
          const w = level === 3 && c.chance(0.5) ? c.rnd(1, 9) : 0, g = HM.gcd(f, P), n = f / g, d = P / g, i = w * P + f;
          const show = (nn, dd) => (w ? HM.mixed(w, nn, dd) : F(nn, dd));
          return {
            type: 'fraction', mixed: !!w, accept: 'simplest',
            prompt: `${c.g('כתוב', 'כתבי')} את ${m(D(i, p))} ${w ? 'כמספר מעורב' : 'כשבר'} מצומצם.`,
            answer: w ? { w, n, d } : { n, d },
            hint: `קודם ${c.g('כתוב', 'כתבי')} שבר עם מכנה ${P}, ואז ${c.g('צמצם', 'צמצמי')}: ${c.g('חלק', 'חלקי')} את המונה ואת המכנה באותו מספר.`,
            solution: [m(D(i, p) + ' = ' + show(f, P)), `נצמצם ב-${g}: ${m(F(f, P) + ' = ' + F(n, d))}`, `התשובה: ${m(show(n, d))}`],
          };
        }
        case 'fracToDec': {
          const p = level === 1 ? c.pick([1, 2]) : c.pick([1, 2, 3]), P = POW[p];
          const f = p === 1 ? c.rnd(1, 9) : c.chance(0.4) ? c.rnd(1, 9) : clean(c, 11, P - 1);
          const w = level >= 2 && c.chance(0.4) ? c.rnd(1, 9) : 0, i = w * P + f;
          const fr = w ? HM.mixed(w, f, P) : F(f, P);
          return {
            type: 'number', decimal: true, answer: val(i, p),
            prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני:<br>${m(fr + ' = ' + HM.slot(0))}`,
            hint: `המכנה ${P} ← ${UN[p]}, כלומר ${digs(p)} אחרי הנקודה.`,
            solution: [`${m(F(f, P))} הן ${cntU(f, p)} ← ${digs(p)} אחרי הנקודה.`, String(f).length < p ? 'משלימים אפסים במקומות הריקים שאחרי הנקודה.' : null, m(fr + ' = ' + D(i, p))].filter(Boolean),
          };
        }
        case 'pickFrac': {
          const p = c.pick([1, 2]), P = POW[p], f = p === 1 ? c.rnd(1, 9) : clean(c, 1, 99);
          return {
            type: 'choice', prompt: `איזה שבר שווה ל-${m(D(f, p))}?`, answer: 0,
            choices: opts(F(f, P), [F(f, P * 10), P > 10 ? F(f, P / 10) : F(f, 1000), f > 1 ? F(P, f) : F(f + 1, P)]),
            hint: `${c.g('קרא', 'קראי')} את המספר בקול. המילה האחרונה (עשיריות, מאיות או אלפיות) אומרת מה המכנה.`,
            solution: [`${m(D(f, p))} = ${cntU(f, p)} = ${m(F(f, P))}`],
          };
        }
        case 'pickDec': {
          const p = c.pick([1, 2, 3]), P = POW[p], f = p === 1 ? c.rnd(1, 9) : c.chance(0.5) ? c.rnd(1, 9) : clean(c, 11, P - 1);
          return {
            type: 'choice', prompt: `איזה מספר עשרוני שווה ל-${m(F(f, P))}?`, answer: 0,
            choices: opts(D(f, p), [D(f, p + 1), `${f}.${P}`, p > 1 ? D(f, p - 1) : D(f, 3)]),
            hint: `המכנה ${P} ← ${UN[p]}. כמה ספרות צריכות להיות אחרי הנקודה?`,
            solution: [`${m(F(f, P))} הן ${cntU(f, p)} ← ${digs(p)} אחרי הנקודה.`, m(F(f, P) + ' = ' + D(f, p))],
          };
        }
        case 'expanded': {
          const w = c.rnd(0, level === 1 ? 5 : 30), t = c.rnd(1, 9), h = c.rnd(1, 9), i = w * 100 + t * 10 + h, askT = c.chance(0.5);
          const lead = w ? w + ' + ' : '';
          return {
            type: 'number', answer: askT ? t : h,
            prompt: `${c.g('השלם', 'השלימי')} את הפירוק לפי המקומות:<br>${m(D(i, 2) + ' = ' + lead + F(askT ? HM.slot(0) : t, 10) + ' + ' + F(askT ? h : HM.slot(0), 100))}`,
            hint: 'הספרה הראשונה אחרי הנקודה היא ספרת העשיריות, והשנייה היא ספרת המאיות.',
            solution: [`ב-${m(D(i, 2))} יש ${w ? wholes(w) + ', ' : ''}${cntU(t, 1)} ו-${cntU(h, 2)}.`, m(D(i, 2) + ' = ' + lead + F(t, 10) + ' + ' + F(h, 100))],
          };
        }
        case 'expanded3': {
          const w = c.rnd(1, 20), th = c.rnd(1, 9);
          let t = c.rnd(1, 9), h = c.rnd(1, 9);
          if (c.chance(0.5)) t = 0; else h = 0;
          const terms = c.shuffle([t && F(t, 10), h && F(h, 100), F(th, 1000)].filter(Boolean));
          const v = w * 1000 + t * 100 + h * 10 + th;
          return {
            type: 'number', decimal: true, answer: TV(v),
            prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני:<br>${m(w + ' + ' + terms.join(' + ') + ' = ' + HM.slot(0))}`,
            hint: `${c.g('שים', 'שימי')} כל חלק במקום שלו: עשיריות, מאיות ואלפיות. במקום ריק ${c.g('כתוב', 'כתבי')} 0.`,
            solution: [`שלמים: ${w}, עשיריות: ${t}, מאיות: ${h}, אלפיות: ${th}.`, `התשובה: ${m(T(v))}`],
          };
        }
        case 'tfZero': {
          const w = level === 1 ? 0 : c.rnd(0, 9), t = c.rnd(1, 9);
          const a = D(w * 10 + t, 1);
          const L = [
            { s: `${a} = ${D(w * 100 + t * 10, 2, true)}`, a: true, why: `אפס בסוף לא משנה את הערך: ${cntU(t, 1)} הן ${t * 10} מאיות.` },
            { s: `${a} = ${D(w * 100 + t, 2)}`, a: false, why: `ב-${m(a)} הספרה ${t} במקום העשיריות, וב-${m(D(w * 100 + t, 2))} היא במקום המאיות. ${m(a + ' &gt; ' + D(w * 100 + t, 2))}` },
            { s: `${F(t, 100)} = ${D(t, 1)}`, a: false, why: `${m(F(t, 100))} הן ${cntU(t, 2)}, ולכן ${m(F(t, 100) + ' = ' + D(t, 2))}.` },
            { s: `${F(t, 100)} = ${D(t, 2)}`, a: true, why: `${cntU(t, 2)}: הספרה ${t} במקום המאיות, ולכן ${m(F(t, 100) + ' = ' + D(t, 2))}.` },
            { s: `${a} = ${HM.mixed(w, t, 10)}`, a: true, why: `${m(a)} הוא ${w ? wholes(w) + ' ו-' : ''}${cntU(t, 1)}, כלומר ${m(HM.mixed(w, t, 10))}.` },
            { s: `${a} = ${HM.mixed(w, t, 100)}`, a: false, why: `${m(a)} הוא ${w ? wholes(w) + ' ו-' : ''}${cntU(t, 1)}, כלומר ${m(HM.mixed(w, t, 10))}, ולא ${cntU(t, 2)}.` },
          ];
          const st = c.pick(L);
          return {
            type: 'tf', prompt: `נכון או לא נכון?<br>${m(st.s)}`, answer: st.a,
            hint: `${c.g('בדוק', 'בדקי')} באיזה מקום עומדת כל ספרה: עשיריות, מאיות או אלפיות.`,
            solution: [st.why, st.a ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
        case 'cmp': {
          const [n, d, h] = c.pick(NICE);
          let x = c.pick([h, h, n < 10 && n * 10 !== h ? n * 10 : h + 5, h + c.pick([5, 10, 1]), h - c.pick([5, 10, 1])]);
          if (x <= 0) x = h + 3;
          const fl = c.chance(0.5), lv = fl ? x : h, rv = fl ? h : x, s = sign(lv, rv);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: fl ? D(x, 2) : F(n, d), right: fl ? F(n, d) : D(x, 2), lv: lv / 100, rv: rv / 100, answer: s,
            hint: `${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני: ${c.g('הרחב', 'הרחיבי')} אותו למכנה 100.`,
            solution: [m(F(n, d) + ' = ' + F(h, 100) + ' = ' + D(h, 2)), m(D(lv, 2) + ' ' + signH(s) + ' ' + D(rv, 2))],
          };
        }
        case 'mixCalc': {
          if (level === 2) {
            const plus = c.chance(0.6), y = c.rnd(1, 9);
            let x = c.rnd(2, 19);
            if (!plus && x <= y) x = y + c.rnd(1, 9);
            const r = plus ? x + y : x - y;
            const expr = plus && c.chance(0.5) ? F(y, 10) + ' + ' + D(x, 1) : D(x, 1) + (plus ? ' + ' : ' − ') + F(y, 10);
            return {
              type: 'number', decimal: true, answer: val(r, 1), prompt: `${c.g('חשב', 'חשבי')}:<br>${m(expr + ' = ' + HM.slot(0))}`,
              hint: `${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני, ואז ${c.g('חשב', 'חשבי')}.`,
              solution: [m(F(y, 10) + ' = ' + D(y, 1)), m(D(x, 1) + (plus ? ' + ' : ' − ') + D(y, 1) + ' = ' + D(r, 1))],
            };
          }
          const [n, d, h] = c.pick(NICE.filter((z) => z[1] !== 10));
          const w = c.chance(0.4) ? c.rnd(1, 3) : 0, fv = w * 100 + h, plus = c.chance(0.6);
          const x = plus ? clean(c, 5, 250) : clean(c, 1, fv - 1);
          const r = plus ? fv + x : fv - x, fr = w ? HM.mixed(w, n, d) : F(n, d);
          const expr = plus && c.chance(0.5) ? D(x, 2) + ' + ' + fr : fr + (plus ? ' + ' : ' − ') + D(x, 2);
          return {
            type: 'number', decimal: true, answer: val(r, 2), prompt: `${c.g('חשב', 'חשבי')}:<br>${m(expr + ' = ' + HM.slot(0))}`,
            hint: `${c.g('כתוב', 'כתבי')} את שני המספרים באותה צורה — שניהם כמספרים עשרוניים — ורק אז ${c.g('חשב', 'חשבי')}.`,
            solution: [m(fr + ' = ' + D(fv, 2)), m(D(fv, 2) + (plus ? ' + ' : ' − ') + D(x, 2) + ' = ' + D(r, 2))],
          };
        }
        case 'story': {
          const sc = c.scene(SC), p = pickP(c);
          const [n, d, h] = c.pick(NICE);
          const w = c.chance(0.6) ? c.rnd(1, 9) : 0, i = w * 100 + h, g = HM.gcd(h, 100);
          const show = (nn, dd) => (w ? HM.mixed(w, nn, dd) : F(nn, dd));
          return {
            type: 'fraction', mixed: !!w, accept: 'simplest', answer: w ? { w, n, d } : { n, d },
            prompt: `${sc.one(p, D(i, 2))}.<br>${c.g('כתוב', 'כתבי')} את ${m(D(i, 2))} ${sc.u1} ${w ? 'כמספר מעורב' : 'כשבר'} מצומצם.`,
            hint: `קודם ${c.g('כתוב', 'כתבי')} שבר עם מכנה 10 או 100, ואחר כך ${c.g('צמצם', 'צמצמי')}.`,
            solution: [m(D(i, 2) + ' = ' + show(h, 100)), `נצמצם ב-${g}: ${m(F(h, 100) + ' = ' + F(n, d))}`, `התשובה: ${m(show(n, d))} ${sc.u1}`],
          };
        }
      }
    },
  });

  /* ========== משבר למספר עשרוני ========== */
  const CONV = {
    km: { from: "מ'", to: 'ק"מ', P: 1000, toW: 'קילומטרים' },
    kg: { from: 'גרם', to: 'ק"ג', P: 1000, toW: 'קילוגרמים' },
    m: { from: 'ס"מ', to: "מ'", P: 100, toW: 'מטרים' },
    nis: { from: 'אגורות', to: '₪', P: 100, toW: 'שקלים' },
  };
  const UNSC = [
    { tags: ['sport'], cv: 'km', s: (p, A) => `${p.name} ${p.g('רץ', 'רצה')} באימון ${A}` },
    { tags: ['animals'], cv: 'kg', s: (p, A) => `${p.name} ${p.g('קנה', 'קנתה')} לחתול ${A} מזון` },
    { tags: ['space'], cv: 'm', s: (p, A) => `הדגם של הטיל ש${p.name} ${p.g('בנה', 'בנתה')} גבוה ${A}` },
    { tags: ['music'], cv: 'nis', s: (p, A) => `${p.name} ${p.g('שילם', 'שילמה')} על מפרט לגיטרה ${A}` },
    { tags: ['baking'], cv: 'kg', s: (p, A) => `${p.name} ${p.g('שם', 'שמה')} בבצק ${A} חמאה` },
    { tags: ['games'], cv: 'nis', s: (p, A) => `${p.name} ${p.g('שילם', 'שילמה')} על תוספת למשחק המחשב ${A}` },
    { tags: ['art'], cv: 'm', s: (p, A) => `${p.name} ${p.g('גזר', 'גזרה')} חוט צמר באורך ${A}` },
    { tags: ['nature'], cv: 'km', s: (p, A) => `${p.name} ${p.g('הלך', 'הלכה')} בשביל הטיול ${A}` },
    { tags: ['reading'], cv: 'm', s: (p, A) => `המדף בספרייה של ${p.name} ארוך ${A}` },
    { tags: ['tech'], cv: 'm', s: (p, A) => `הרובוט של ${p.name} נסע ${A}` },
    { tags: ['kpop'], cv: 'nis', s: (p, A) => `${p.name} ${p.g('שילם', 'שילמה')} על פוטוקארד של הזמר האהוב ${p.g('עליו', 'עליה')} ${A}` },
    { tags: ['magic'], cv: 'kg', s: (p, A) => `בשיעור שיקויים ${p.name} ${p.g('שקל', 'שקלה')} ${A} אבקת כנפי פרפר` },
    { tags: ['squishy'], cv: 'kg', s: (p, A) => `הסקווישי הענק של ${p.name} שוקל ${A}` },
  ];
  // כמות ביחידה הקטנה, לפי רמה
  function uAmount(c, P, level) {
    if (level === 1) return P === 100 ? c.rnd(5, 95) : c.rnd(1, 99) * 10;
    if (level === 2) return c.pick(P === 100 ? [c.rnd(101, 999), c.rnd(2, 9), c.rnd(11, 99)] : [c.rnd(1001, 4999), c.rnd(2, 99), c.rnd(101, 999)]);
    return c.pick(P === 100 ? [c.rnd(1001, 9999), c.rnd(2, 9), c.rnd(101, 999)] : [c.rnd(1001, 24999), c.rnd(2, 99), c.rnd(10001, 99999)]);
  }

  HM.lesson({
    id: 'dec-fromfrac',
    learn: (c) => [
      {
        title: 'מה יראה המשקל?',
        html: `${c.name} קונה ${m(F(3, 4))} ק"ג גבינה, אבל המשקל במכולת מראה רק מספרים עשרוניים. מה הוא יראה?<br>הסוד: ${b('להרחיב')} את השבר כך שהמכנה יהיה ${HM.hl('10, 100 או 1000')}.<br>${m(F(3, 4) + ' = ' + F(75, 100) + ' = 0.75')} — המשקל יראה 0.75.`,
        visual: V.grid(75, { maxw: 200 }),
      },
      {
        title: 'הרחבה למכנה 10 או 100',
        html: `• ${m(F(7, 20) + ' = ' + F(35, 100) + ' = 0.35')} (הרחבנו פי 5, כי ${m('20 × 5 = 100')})<br>• ${m(HM.mixed(1, 1, 5) + ' = ' + HM.mixed(1, 2, 10) + ' = 1.2')} (פי 2)<br>• ${m(F(3, 25) + ' = ' + F(12, 100) + ' = 0.12')} (פי 4)<br>${c.g('זכור', 'זכרי')}: מכפילים ${b('גם את המונה וגם את המכנה')} באותו מספר.`,
        visual: V.grid(35, { maxw: 200 }),
      },
      {
        title: 'דוגמה: שמיניות',
        html: `איך ${c.g('תכתוב', 'תכתבי')} את ${m(F(3, 8))} כמספר עשרוני?`,
        visual: V.bar(3, 8, { maxw: 300 }),
        steps: [
          `10 ו-100 לא מתחלקים ב-8, אבל ${m('8 × 125 = 1000')}.`,
          `נרחיב פי 125: ${m(F(3, 8) + ' = ' + F(375, 1000))}`,
          `375 אלפיות: ${m(F(375, 1000) + ' = 0.375')} ✔`,
        ],
      },
      {
        title: 'גם צמצום עוזר',
        html: `לפעמים המכנה גדול מדי — אז ${b('מצמצמים')}:<br>${m(F(9, 30) + ' = ' + F(3, 10) + ' = 0.3')} (חילקנו ב-3)<br>${m(F(18, 200) + ' = ' + F(9, 100) + ' = 0.09')} (חילקנו ב-2)`,
        visual: V.bar(3, 10, { maxw: 300 }),
      },
      {
        title: 'שבר מול מספר עשרוני',
        html: `כדי להשוות שבר למספר עשרוני, ${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני:<br>${m(F(3, 5) + ' = ' + F(6, 10) + ' = 0.6')}, ולכן ${m(F(3, 5) + ' &lt; 0.65')}.<br>על ישר המספרים רואים: ${m(F(3, 5))} נמצא משמאל ל-0.65.`,
        visual: V.numberLine({ min: 0.5, max: 0.7, step: 0.01, every: 5, labels: (v, i) => (i % 10 === 0 ? D(50 + i, 2) : null), marks: [{ v: 0.6, label: { n: 3, d: 5 } }, { v: 0.65, label: '0.65', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'המרת יחידות מידה',
        html: `יחידה קטנה היא שבר של יחידה גדולה:<br>• מטר = 100 ס"מ, ולכן 35 ס"מ = ${m(F(35, 100))} מ' = 0.35 מ'<br>• קילומטר = 1,000 מ', ולכן 250 מ' = 0.25 ק"מ<br>• קילוגרם = 1,000 גרם, ולכן 75 גרם = 0.075 ק"ג<br>• שקל = 100 אגורות, ולכן 90 אגורות = 0.90 ₪`,
        visual: V.table(['יחידה גדולה', 'יחידות קטנות'], [["1 מ'", '100 ס"מ'], ['1 ק"מ', "1,000 מ'"], ['1 ק"ג', '1,000 גרם'], ['1 ₪', '100 אגורות']]),
        quiz: { type: 'number', decimal: true, answer: 0.45, prompt: `${c.g('השלם', 'השלימי')}: 45 ס"מ = ${HM.slot(0)} מ'`, hint: 'במטר יש 100 ס"מ, ולכן 45 ס"מ הם 45 מאיות של מטר.', solution: [`45 ס"מ = ${m(F(45, 100))} מ' = 0.45 מ'`] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['expand', 'missingFactor', 'line', 'units', 'cmpFD', 'story1', 'story1', 'storyUnits']
        : level === 2 ? ['expand', 'reduceTo', 'cmpFD', 'line', 'lineRead', 'units', 'pickDec', 'missingFactor', 'story1', 'story1', 'storyUnits', 'storyUnits', 'storyCmp']
        : ['expand', 'reduceTo', 'cmpFD', 'orderMix', 'units', 'pickDec', 'line', 'storyMulti', 'storyMulti', 'storyUnits', 'storyCmp'];
      const kind = c.pick(kinds);
      const FL = fracsFor(level === 1 ? [2, 5, 10] : level === 2 ? [4, 20, 25, 50, 2, 5] : [8, 40, 125, 200, 250, 500, 20, 25]);
      const conv = (q) => { const P = targetOf(q.d); return { P, f: P / q.d, num: (q.n * P) / q.d }; };
      switch (kind) {
        case 'expand': {
          const q = c.pick(FL), w = level > 1 && c.chance(level === 2 ? 0.3 : 0.5) ? c.rnd(1, 9) : 0;
          const { P, f, num } = conv(q), fr = w ? HM.mixed(w, q.n, q.d) : F(q.n, q.d), v = w * 1000 + q.k;
          return {
            type: 'number', decimal: true, answer: TV(v),
            prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני:<br>${m(fr + ' = ' + HM.slot(0))}`,
            hint: q.d === 10 ? 'המכנה 10 ← עשיריות: ספרה אחת אחרי הנקודה.' : `${c.g('חפש', 'חפשי')} מספר שכשכופלים בו את ${q.d} מקבלים 10, 100 או 1000, ${c.g('והרחב', 'והרחיבי')} את השבר בעזרתו.`,
            solution: [f > 1 ? `${m(q.d + ' × ' + f + ' = ' + P)}, ולכן נרחיב פי ${f}: ${m(F(q.n, q.d) + ' = ' + F(num, P))}` : null, m(F(num, P) + ' = ' + T(q.k)), w ? `עם השלמים: ${m(fr + ' = ' + T(v))}` : null].filter(Boolean),
          };
        }
        case 'missingFactor': {
          const q = c.pick(FL.filter((z) => z.d !== 10));
          let P = targetOf(q.d);
          if (level >= 2 && P < 1000 && c.chance(0.4)) P *= 10;
          const f = P / q.d;
          return {
            type: 'number', answer: q.n * f,
            prompt: `${c.g('השלם', 'השלימי')} את המונה החסר:<br>${m(F(q.n, q.d) + ' = ' + F(HM.slot(0), P))}`,
            hint: `בכמה צריך לכפול את ${q.d} כדי לקבל ${P}? ${c.g('כפול', 'כפלי')} גם את המונה באותו מספר.`,
            solution: [m(q.d + ' × ' + f + ' = ' + P), m(q.n + ' × ' + f + ' = ' + q.n * f), m(F(q.n, q.d) + ' = ' + F(q.n * f, P) + ' = ' + T(q.k))],
          };
        }
        case 'reduceTo': {
          const q1 = level === 2 ? 1 : c.pick([1, 2]), P = POW[q1], k = q1 === 1 ? c.rnd(1, 9) : clean(c, 1, 99), f = c.pick([2, 3, 4, 5, 6]);
          return {
            type: 'number', decimal: true, answer: val(k, q1),
            prompt: `${c.g('צמצם', 'צמצמי')} את השבר למכנה ${P}, ${c.g('וכתוב', 'וכתבי')} אותו כמספר עשרוני:<br>${m(F(k * f, P * f) + ' = ' + HM.slot(0))}`,
            hint: `${c.g('חלק', 'חלקי')} את המונה ואת המכנה באותו מספר, כך שהמכנה יהיה ${P}.`,
            solution: [`${m(P * f + ' : ' + f + ' = ' + P)}, ולכן נצמצם ב-${f}: ${m(F(k * f, P * f) + ' = ' + F(k, P))}`, m(F(k, P) + ' = ' + D(k, q1))],
          };
        }
        case 'cmpFD': {
          const q = c.pick(FL);
          let x;
          if (level === 1) x = c.chance(0.25) ? q.k : c.rnd(1, 9) * 100;
          else if (level === 2) x = q.k + c.pick([0, 50, -50, 10, -10, q.n < 10 && q.n * 100 !== q.k ? q.n * 100 - q.k : 30]);
          else x = q.k + c.pick([0, 25, -25, 5, -5, 1, -1, q.n < 10 && q.n * 100 !== q.k ? q.n * 100 - q.k : 125]);
          if (x <= 0) x = q.k + 50;
          const fl = c.chance(0.5), lv = fl ? x : q.k, rv = fl ? q.k : x, s = sign(lv, rv);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: fl ? T(x) : F(q.n, q.d), right: fl ? F(q.n, q.d) : T(x), lv: lv / 1000, rv: rv / 1000, answer: s,
            hint: `${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני (${c.g('הרחב', 'הרחיבי')} אותו למכנה 10, 100 או 1000), ואז ${c.g('השווה', 'השווי')}.`,
            solution: [m(F(q.n, q.d) + ' = ' + T(q.k)), m(T(lv) + ' ' + signH(s) + ' ' + T(rv))],
          };
        }
        case 'line': {
          if (level === 1) {
            const q = c.pick(FL), t = q.k / 100;
            return {
              type: 'numberline', line: { min: 0, max: 1, step: 0.1, labels: (v, i) => (i === 0 ? '0' : i === 10 ? '1' : null) }, answer: val(t, 1),
              prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${m(F(q.n, q.d))}.`,
              hint: `כל סימון על הישר הוא עשירית (${m('0.1')}). ${c.g('הפוך', 'הפכי')} את השבר לעשיריות.`,
              solution: [m(F(q.n, q.d) + (q.d === 10 ? '' : ' = ' + F(t, 10)) + ' = ' + D(t, 1)), `סופרים ${HM.cnt(t, 'סימון', 'סימונים')} מ-0.`],
            };
          }
          if (level === 2) {
            const q = c.pick(fracsFor([2, 4, 5, 10, 20])), w = c.rnd(0, 5), v = w * 1000 + q.k, fr = w ? HM.mixed(w, q.n, q.d) : F(q.n, q.d);
            return {
              type: 'numberline', answer: TV(v),
              line: { min: w, max: w + 1, step: 0.05, labels: (x, i) => (i === 0 ? String(w) : i === 20 ? String(w + 1) : i === 10 && q.k !== 500 ? D(w * 10 + 5, 1) : null) },
              prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${m(fr)}.`,
              hint: `בין ${w} ל-${w + 1} יש 20 חלקים שווים, וכל חלק הוא ${m('0.05')}. ${c.g('הפוך', 'הפכי')} קודם את השבר למספר עשרוני.`,
              solution: [m(fr + ' = ' + T(v)), `${m(T(v))} נמצא ${HM.cnt(q.k / 50, 'סימון', 'סימונים')} אחרי ${w}.`],
            };
          }
          const d = c.pick([2, 5, 10]);
          let n;
          do { n = c.rnd(1, 2 * d - 1); } while (n === d || HM.gcd(n, d) !== 1 && d !== 10);
          const t = (n * 10) / d;
          return {
            type: 'numberline', answer: val(t, 1),
            line: { min: 0, max: 2, step: 0.1, labels: (v, i) => (i % 10 === 0 ? String(i / 10) : null) },
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${m(F(n, d))}.`,
            hint: `כל סימון הוא ${m('0.1')}. ${c.g('הפוך', 'הפכי')} את השבר למספר עשרוני.`,
            solution: [m(F(n, d) + (d === 10 ? '' : ' = ' + F(t, 10)) + ' = ' + D(t, 1)), `סופרים ${HM.cnt(t, 'סימון', 'סימונים')} מ-0.`],
          };
        }
        case 'lineRead': {
          const w = c.rnd(0, 8), t = c.rnd(1, 9), asFrac = c.chance(0.5);
          return {
            type: asFrac ? 'fraction' : 'number', mixed: asFrac && w > 0 ? true : undefined, decimal: asFrac ? undefined : true,
            answer: asFrac ? (w ? { w, n: t, d: 10 } : { n: t, d: 10 }) : val(w * 10 + t, 1),
            visual: V.numberLine({ min: w, max: w + 1, step: 0.1, labels: (v, i) => (i === 0 ? String(w) : i === 10 ? String(w + 1) : null), marks: [{ v: w + t / 10, label: '?' }], maxw: 360 }),
            prompt: `איזה מספר מסומן על הישר? ${c.g('כתוב', 'כתבי')} אותו ${asFrac ? (w ? 'כמספר מעורב' : 'כשבר') : 'כמספר עשרוני'}.`,
            hint: `הקטע בין ${w} ל-${w + 1} מחולק ל-10 חלקים שווים, וכל חלק הוא עשירית.`,
            solution: [`מ-${w} סופרים ${cntU(t, 1)} עד הנקודה.`, m(D(w * 10 + t, 1) + ' = ' + HM.mixed(w, t, 10))],
          };
        }
        case 'units': {
          const cv = c.pick(Object.values(CONV)), pl = cv.P === 100 ? 2 : 3, v = uAmount(c, cv.P, level), up = level === 1 || c.chance(0.55);
          const big = D(v, pl, cv.to === '₪');
          if (up) {
            return {
              type: 'number', decimal: true, answer: val(v, pl),
              prompt: `${c.g('השלם', 'השלימי')}:<br>${HM.fmt(v)} ${cv.from} = ${HM.slot(0)} ${cv.to}`,
              hint: `${c.g('זכור', 'זכרי')}: 1 ${cv.to} = ${HM.fmt(cv.P)} ${cv.from}.`,
              solution: [`1 ${cv.to} = ${HM.fmt(cv.P)} ${cv.from}, ולכן ${HM.fmt(v)} ${cv.from} = ${m(F(v, cv.P))} ${cv.to}.`, m(F(v, cv.P) + ' = ' + D(v, pl)), `התשובה: ${big} ${cv.to}`],
            };
          }
          return {
            type: 'number', answer: v,
            prompt: `${c.g('השלם', 'השלימי')}:<br>${big} ${cv.to} = ${HM.slot(0)} ${cv.from}`,
            hint: `${c.g('זכור', 'זכרי')}: 1 ${cv.to} = ${HM.fmt(cv.P)} ${cv.from}. ${c.g('כפול', 'כפלי')} ב-${HM.fmt(cv.P)}.`,
            solution: [`1 ${cv.to} = ${HM.fmt(cv.P)} ${cv.from}.`, m(D(v, pl) + ' × ' + HM.fmt(cv.P) + ' = ' + HM.fmt(v)), `התשובה: ${HM.fmt(v)} ${cv.from}`],
          };
        }
        case 'pickDec': {
          const q = c.pick(FL.filter((z) => z.d !== 10)), { P, num } = conv(q);
          return {
            type: 'choice', answer: 0, prompt: `איזה מספר עשרוני שווה ל-${m(F(q.n, q.d))}?`,
            choices: opts(T(q.k), [q.d < 100 ? `0.${q.n}${q.d}` : D(q.k, 4), `${q.n}.${q.d}`, D(q.k, 2), q.n < 10 ? `0.${q.n}` : D(q.k, 4)]),
            hint: `${c.g('הרחב', 'הרחיבי')} את השבר כך שהמכנה יהיה 10, 100 או 1000.`,
            solution: [m(F(q.n, q.d) + ' = ' + F(num, P)), m(F(num, P) + ' = ' + T(q.k))],
          };
        }
        case 'orderMix': {
          const fl = fracsFor([2, 4, 5, 8, 20, 25]);
          const items = [], vals = [];
          let g = 0;
          while (items.length < 4 && g++ < 200) {
            let v, html;
            if (items.length < 2) { const q = c.pick(fl); v = q.k; html = F(q.n, q.d); }
            else { v = vals[c.rnd(0, 1)] + c.pick([-25, 25, -50, 50, -5, 5, 10, -10, 100, -100]); html = T(v); }
            if (v > 0 && v < 1000 && vals.indexOf(v) < 0) { vals.push(v); items.push(html); }
          }
          const ord = vals.map((x, i) => i).sort((i, j) => vals[i] - vals[j]);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>מהקטן לגדול</b>:`, items: items.map((x) => m(x)), answer: ord,
            hint: `${c.g('הפוך', 'הפכי')} את השברים למספרים עשרוניים, ואז ${c.g('השווה', 'השווי')} ספרה אחר ספרה.`,
            solution: [items.slice(0, 2).map((x, i) => m(x + ' = ' + T(vals[i]))).join(' , '), ord.map((i) => m(T(vals[i]))).join(' &lt; ')],
          };
        }
        case 'story1': {
          const sc = c.scene(SC), p = pickP(c), q = c.pick(FL), w = c.chance(level === 1 ? 0.3 : 0.5) ? c.rnd(1, 5) : 0, v = w * 1000 + q.k;
          const fr = w ? HM.mixed(w, q.n, q.d) : F(q.n, q.d), { P, f, num } = conv(q);
          return {
            type: 'number', decimal: true, unit: sc.u1, answer: TV(v),
            prompt: `${sc.one(p, m(fr))}.<br>${c.g('כתוב', 'כתבי')} את ${sc.noun} כמספר עשרוני.`,
            hint: q.d === 10 ? 'המכנה 10 ← עשיריות.' : `${c.g('הרחב', 'הרחיבי')} את השבר כך שהמכנה יהיה ${P}.`,
            solution: [f > 1 ? m(F(q.n, q.d) + ' = ' + F(num, P) + ' = ' + T(q.k)) : m(F(q.n, q.d) + ' = ' + T(q.k)), `התשובה: ${T(v)} ${sc.u1}`],
          };
        }
        case 'storyUnits': {
          const sc = c.scene(UNSC), cv = CONV[sc.cv], p = pickP(c), pl = cv.P === 100 ? 2 : 3;
          let v, A, pre = null;
          if (level === 3) {
            const a = c.rnd(1, 9), n = cv.P === 100 ? c.rnd(2, 99) : c.pick([c.rnd(2, 99), c.rnd(10, 99) * 10, c.rnd(101, 999)]);
            v = a * cv.P + n; A = `${a} ${cv.to} ו-${n} ${cv.from}`; pre = `${A} = ${HM.fmt(a * cv.P)} ${cv.from} + ${n} ${cv.from} = ${HM.fmt(v)} ${cv.from}`;
          } else { v = uAmount(c, cv.P, level); A = `${HM.fmt(v)} ${cv.from}`; }
          return {
            type: 'number', decimal: true, unit: cv.to, answer: val(v, pl),
            prompt: `${sc.s(p, A)}.<br>כמה ${cv.toW} זה? ${c.g('כתוב', 'כתבי')} מספר עשרוני.`,
            hint: `${c.g('זכור', 'זכרי')}: 1 ${cv.to} = ${HM.fmt(cv.P)} ${cv.from}.`,
            solution: [pre, `${HM.fmt(v)} ${cv.from} = ${m(F(v, cv.P))} ${cv.to}`, `התשובה: ${D(v, pl, cv.to === '₪')} ${cv.to}`].filter(Boolean),
          };
        }
        case 'storyCmp': return level === 2 ? cmpStory(c, fracsFor([4, 20, 25, 5]), [50, -50, 10, -10]) : cmpStory(c, fracsFor([8, 4, 20, 25, 40]), [25, -25, 5, -5, 125]);
        case 'storyMulti': return storyFD(c, fracsFor([8, 4, 20, 25, 40, 5]));
      }
    },
  });

  /* ========== קניות (לסיפורים רב-שלביים) ========== */
  const SHOP = [
    { tags: ['sport'], big: ['זוג נעלי כדורגל', 400], place: 'בחנות הספורט', items: ['כדור כדורגל', 'משרוקית', 'זוג גרביים', 'בקבוק שתייה'] },
    { tags: ['animals'], big: ['מיטה לכלב', 300], place: 'בחנות לחיות מחמד', items: ['קולר לכלב', 'צעצוע לחתול', 'שק חטיפים לכלב', 'קערת מים'] },
    { tags: ['space'], big: ['טלסקופ', 400], place: 'בחנות של מוזיאון המדע', items: ['מפת כוכבים', 'דגם של טיל', 'ספר על כוכבי הלכת', 'כדור פלנטה זוהר'] },
    { tags: ['music'], big: ['גיטרה', 400], place: 'בחנות כלי הנגינה', items: ['ספר תווים', 'סט מיתרים לגיטרה', 'מפרט', 'מטרונום'] },
    { tags: ['baking'], big: ['סט תבניות לאפייה', 200], place: 'בסופרמרקט', items: ['שוקולד מריר', 'שקית קמח', 'שקית סוכריות לקישוט', 'אבקת אפייה'] },
    { tags: ['games'], big: ['משחק מחשב', 300], place: 'בחנות המשחקים', items: ['משחק קופסה', 'שלט למשחקים', 'חפיסת קלפים', 'משחק מחשב'] },
    { tags: ['art'], big: ['כן ציור', 240], place: 'בחנות היצירה', items: ['קופסת צבעים', 'מכחול', 'בלוק ציור', 'דבק נצנצים'] },
    { tags: ['nature'], big: ['תרמיל טיולים', 300], place: 'בחנות הטיולים', items: ['כובע', 'בקבוק מים', 'פנס', 'משקפת'] },
    { tags: ['reading'], big: ['סדרת ספרים', 240], place: 'בחנות הספרים', items: ['ספר הרפתקאות', 'חוברת קומיקס', 'סימנייה', 'ספר בלשים'] },
    { tags: ['tech'], big: ['ערכת רובוטיקה', 400], place: 'בחנות האלקטרוניקה', items: ['חבילת סוללות', 'חיישן לרובוט', 'כבל', 'מנוע קטן'] },
    { tags: ['kpop'], big: ['כרטיס להופעה', 400], place: 'בדוכן של להקת הקיי-פופ', items: ['אלבום', 'מקל אור', 'חבילת פוטוקארדים', 'פוסטר'] },
    { tags: ['magic'], big: ['ערכת קוסמות', 200], place: 'בחנות הקסמים', items: ['שרביט', 'ספר לחשים', 'גלימה', 'בקבוקון שיקוי'] },
    { tags: ['squishy'], big: ['סקווישי ענק', 80], place: 'בחנות הסקווישים', items: ['סקווישי בצורת אבוקדו', 'סקווישי בצורת פנדה', 'סקווישי בצורת עוגה', 'קופסה לסקווישים'] },
  ];
  const AG = [90, 50, 40, 20, 75, 25, 95, 45, 60, 80, 10, 30];
  const price = (c, lo, hi) => c.rnd(lo, hi) * 1000 + c.pick(AG) * 10; // באלפיות
  const NIS = (v) => TK(v, 2);
  // שורת קנייה: "כדור ב-12.90 ₪, משרוקית ב-5.50 ₪ ו..."
  const buyList = (its, prs) => its.map((it, i) => `${i === its.length - 1 && i > 0 ? 'ו' : ''}${it} ב-${NIS(prs[i])} ₪`).join(', ').replace(/, ו/, ' ו');
  // פתרון במאונך: אפסים, תרגיל במאונך, תשובה
  function colSolution(vs, op, R) {
    const dl = Math.max(...vs.map(plc)), pads = vs.map((v) => TK(v, dl)), res = TK(R, dl);
    const zeros = vs.some((v) => plc(v) < dl);
    return [
      zeros ? `נשלים אפסים, כך שלכל המספרים יהיו ${digs(dl)} אחרי הנקודה: ${m(pads.join(op === '+' ? ' + ' : ' − '))}` : 'נכתוב נקודה מתחת לנקודה, ונתחיל מהמקום הימני.',
      V.column(pads, op, { result: res, carry: op === '+' ? carryAdd(pads, res) : undefined }),
      `התשובה: ${m(T(R))}`,
    ];
  }
  // מספר "ישר" לפי השיטה השגויה: מיישרים לימין במקום לפי הנקודה
  function misaligned(a, b2, op) {
    const ia = Number(T(a).replace('.', '')), ib = Number(T(b2).replace('.', '')), q = Math.max(plc(a), plc(b2));
    return (op === '+' ? ia + ib : Math.abs(ia - ib)) * POW[3 - q];
  }

  /* ========== חיבור במאונך ========== */
  function addends(c, level) {
    if (level === 1) return c.chance(0.5) ? [tenths(c, 11, 99), tenths(c, 11, 99)] : [tenths(c, 11, 199), tenths(c, 1, 9)];
    if (level === 2) return c.shuffle([hunds(c, 101, 2999), c.chance(0.5) ? tenths(c, 11, 199) : hunds(c, 11, 999)]);
    return c.pick([
      () => c.shuffle([hunds(c, 101, 999), tenths(c, 11, 99), c.rnd(2, 30) * 1000]),
      () => c.shuffle([clean(c, 1001, 9999), hunds(c, 101, 2999)]),
      () => [hunds(c, 1001, 9999), hunds(c, 1001, 9999)],
      () => c.shuffle([c.rnd(3, 40) * 1000, clean(c, 101, 999), tenths(c, 11, 99)]),
    ])();
  }

  HM.lesson({
    id: 'dec-vadd',
    learn: (c) => [
      {
        title: 'נקודה מתחת לנקודה',
        html: `${c.name} ${c.g('קנה', 'קנתה')} מחברת ב-12.5 ₪ ועט ב-3.75 ₪. כמה ${c.g('שילם', 'שילמה')}?<br>כשמחברים ${b('במאונך')}, כותבים ${HM.hl('נקודה מתחת לנקודה')}: יחידות מתחת ליחידות, עשיריות מתחת לעשיריות, מאיות מתחת למאיות.`,
        visual: `<div class="row"><div>${colSvg(['12.5', '3.75'], '+', 'dot')}<div class="note">✔ נכון: הנקודות זו מתחת לזו</div></div><div>${colSvg(['12.5', '3.75'], '+', 'right')}<div class="note">✘ לא נכון: יישור לימין</div></div></div>`,
      },
      {
        title: 'אפסים במקומות הריקים',
        html: `במקום ריק אפשר לכתוב ${b('0')} — זה לא משנה את הערך: ${m('12.5 = 12.50')}.<br>כך לכל מספר יש אותו מספר ספרות אחרי הנקודה, וקל לחבר עמודה אחרי עמודה, מימין לשמאל.`,
        visual: V.column(['12.5', '3.75'], '+', { zeros: true, result: '16.25' }),
      },
      {
        title: 'חיבור עם המרה',
        html: `10 מאיות הן עשירית אחת, ו-10 עשיריות הן שלם אחד — בדיוק כמו ש-10 יחידות הן עשרת.<br>${c.g('בוא', 'בואי')} נחבר ${m('4.68 + 2.57')}:`,
        visual: V.column(['4.68', '2.57'], '+', { result: '7.25', carry: carryAdd(['4.68', '2.57'], '7.25') }),
        steps: [
          `מאיות: ${m('8 + 7 = 15')} ← כותבים 5 ומעבירים 1 לעשיריות.`,
          `עשיריות: ${m('6 + 5 + 1 = 12')} ← כותבים 2 ומעבירים 1 ליחידות.`,
          `יחידות: ${m('4 + 2 + 1 = 7')}.`,
          `התשובה: ${m('4.68 + 2.57 = 7.25')} ✔`,
        ],
      },
      {
        title: 'אומדן: האם התוצאה הגיונית?',
        html: `${c.g('עגל', 'עגלי')} כל מחובר למספר שלם: ${m('12.5 + 3.75 ≈ 13 + 4 = 17')}.<br>התוצאה 16.25 קרובה ל-17 ✔.<br>אם יצא 5 או 162.5 — כנראה שהנקודות לא היו זו מתחת לזו.`,
        visual: V.numberLine({ min: 15, max: 18, step: 0.25, every: 4, marks: [{ v: 16.25, label: '16.25' }, { v: 17, label: '≈17', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'מספר שלם ושלושה מחוברים',
        html: `למספר שלם יש נקודה "סמויה" בסוף: ${m('7 = 7.00')}.<br>${m('7 + 2.35 + 0.8')}: ${c.g('כתוב', 'כתבי')} את כולם במאונך, ${c.g('השלם', 'השלימי')} אפסים ${c.g('וחבר', 'וחברי')} כרגיל.`,
        visual: V.column(['7', '2.35', '0.8'], '+', { zeros: 'all', result: '10.15' }),
        quiz: { type: 'number', decimal: true, answer: 4.85, prompt: `${c.g('חשב', 'חשבי')}: ${m('3.6 + 1.25 = ' + HM.slot(0))}`, hint: `${c.g('כתוב', 'כתבי')} ${m('3.60')} מתחת ל-${m('1.25')}, נקודה מתחת לנקודה.`, solution: [V.column(['3.60', '1.25'], '+', { result: '4.85' }), `התשובה: ${m('4.85')}`] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['calc', 'calc', 'layout', 'estimate', 'check', 'story', 'story', 'story']
        : level === 2 ? ['calc', 'layout', 'estimate', 'estNum', 'missing', 'check', 'story', 'story', 'story', 'storyShop']
        : ['calc', 'missing', 'estNum', 'check', 'cmpEst', 'layout', 'story', 'storyShop', 'storyShop', 'storyShop'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'calc': {
          const vs = addends(c, level), R = HM.sum(vs);
          return {
            type: 'number', decimal: true, answer: TV(R),
            prompt: `${c.g('חשב', 'חשבי')} במאונך:<br>${m(vs.map(T).join(' + ') + ' = ' + HM.slot(0))}`,
            visual: V.column(vs.map(T), '+', { result: null }),
            hint: `${c.g('כתוב', 'כתבי')} נקודה מתחת לנקודה, ${c.g('השלם', 'השלימי')} אפסים במקומות הריקים, ${c.g('והתחל', 'והתחילי')} לחבר מהמקום הימני.`,
            solution: colSolution(vs, '+', R),
          };
        }
        case 'layout': {
          const a = level === 1 ? tenths(c, 101, 499) : c.chance(0.5) ? c.rnd(2, 9) * 1000 : tenths(c, 101, 999);
          const bb = level === 3 ? clean(c, 1001, 9999) : hunds(c, 101, 999), R = a + bb;
          const rows = c.chance(0.5) ? [T(a), T(bb)] : [T(bb), T(a)];
          const choices = [...new Set(['dot', 'right', 'left'].map((md) => colSvg(rows, '+', md)))];
          return {
            type: 'choice', answer: 0, cols: 2, choices,
            prompt: `באיזה ציור התרגיל ${m(rows.join(' + '))} כתוב נכון במאונך?`,
            hint: `במאונך כותבים ${b('נקודה מתחת לנקודה')}: יחידות מתחת ליחידות ועשיריות מתחת לעשיריות.`,
            solution: ['הנקודות צריכות לעמוד זו מתחת לזו, וכל ספרה מתחת לספרה מאותו מקום.', V.column(rows, '+', { zeros: 'all', result: TK(R, Math.max(plc(a), plc(bb))) })],
          };
        }
        case 'estimate': {
          const a = tenths(c, 101, 499), bb = hunds(c, 101, 999), R = a + bb, mis = misaligned(a, bb, '+');
          return {
            type: 'choice', answer: 0,
            prompt: `${c.g('היעזר', 'היעזרי')} באומדן ${c.g('ובחר', 'ובחרי')} את התוצאה הנכונה:<br>${m(T(a) + ' + ' + T(bb))}`,
            choices: opts(T(R), [Math.abs(mis - R) >= 1500 ? T(mis) : null, T(R * 10), D(R, 4), T(R + 1000)]),
            hint: `${c.g('עגל', 'עגלי')} כל מחובר למספר שלם ${c.g('וחבר', 'וחברי')}. איזו תוצאה קרובה לאומדן?`,
            solution: [`אומדן: ${m(near(a) + ' + ' + near(bb) + ' = ' + (near(a) + near(bb)))}`, `התוצאה הקרובה לאומדן: ${m(T(R))}`],
          };
        }
        case 'estNum': {
          const vs = HM.range(1, level === 3 ? 3 : 2).map(() => hunds(c, 101, 4999)), rs = vs.map(near), E = HM.sum(rs);
          return {
            type: 'number', answer: E,
            prompt: `${c.g('עגל', 'עגלי')} כל מחובר למספר השלם הקרוב, ${c.g('וחשב', 'וחשבי')} אומדן לסכום:<br>${m(vs.map(T).join(' + ') + ' ≈ ' + HM.slot(0))}`,
            hint: `${c.g('הסתכל', 'הסתכלי')} על ספרת העשיריות: 5 ומעלה ← מעגלים למעלה, פחות מ-5 ← מעגלים למטה.`,
            solution: [vs.map((v, i) => m(T(v) + ' ≈ ' + rs[i])).join(' , '), m(rs.join(' + ') + ' = ' + E)],
          };
        }
        case 'missing': {
          const [a, bb] = addends(c, level), R = a + bb;
          return {
            type: 'number', decimal: true, answer: TV(bb),
            prompt: `${c.g('השלם', 'השלימי')} את המחובר החסר:<br>${m(T(a) + ' + ' + HM.slot(0) + ' = ' + T(R))}`,
            hint: `המחובר החסר = הסכום פחות המחובר הידוע.`,
            solution: [m(T(R) + ' − ' + T(a) + ' = ' + T(bb)), `בדיקה: ${m(T(a) + ' + ' + T(bb) + ' = ' + T(R))} ✔`],
          };
        }
        case 'check': {
          let vs, pads, g = 0;
          do { vs = addends(c, level).slice(0, 2); const dl = Math.max(...vs.map(plc)); pads = vs.map((v) => TK(v, dl)); } while (!needsRegroup(pads, '+') && g++ < 40);
          const R = vs[0] + vs[1], res = TK(R, Math.max(...vs.map(plc))), wrong = slip(pads, '+'), ok = c.chance(0.4) || wrong === res;
          const f = c.friend();
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('פתר', 'פתרה')} את התרגיל במאונך כמו בציור. האם הפתרון ${f.g('שלו', 'שלה')} נכון?`,
            visual: V.column(pads, '+', { result: ok ? res : wrong }),
            hint: `${c.g('פתור', 'פתרי')} את התרגיל בעצמך, ${c.g('ושים', 'ושימי')} לב להמרות: 10 מאיות הן עשירית אחת, ו-10 עשיריות הן שלם אחד.`,
            solution: [V.column(pads, '+', { result: res, carry: carryAdd(pads, res) }), ok ? `הפתרון נכון: ${m(pads.join(' + ') + ' = ' + T(R))} ✔` : `${f.name} ${f.g('שכח', 'שכחה')} להעביר את ההמרה (ה-1 הקטן) לעמודה הבאה. התשובה הנכונה: ${m(T(R))}`],
          };
        }
        case 'cmpEst': {
          const a = hunds(c, 101, 999), bb = hunds(c, 101, 999), R = a + bb, N = Math.max(1, near(R) + c.pick([0, 1, -1])), s = sign(R, N * 1000);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: `${T(a)} + ${T(bb)}`, right: String(N), lv: TV(R), rv: N, answer: s,
            hint: `${c.g('נסה', 'נסי')} קודם אומדן. אם התוצאה קרובה מדי, ${c.g('חשב', 'חשבי')} בדיוק.`,
            solution: [m(T(a) + ' + ' + T(bb) + ' = ' + T(R)), m(T(R) + ' ' + signH(s) + ' ' + N)],
          };
        }
        case 'story': {
          const sc = c.scene(SC), p = pickP(c);
          let x, y;
          if (sc.money) { x = level === 1 ? c.rnd(5, 30) * 1000 + c.rnd(1, 9) * 100 : price(c, 10, 60); y = level === 1 ? c.rnd(2, 15) * 1000 + c.rnd(1, 9) * 100 : price(c, 5, 40); }
          else if (level === 1) { x = tenths(c, 2, sc.max * 5); y = tenths(c, 2, sc.max * 5); }
          else { x = hunds(c, 11, sc.max * 50); y = c.chance(0.5) ? tenths(c, 2, sc.max * 5) : hunds(c, 11, sc.max * 50); }
          const R = x + y;
          return {
            type: 'number', decimal: true, unit: sc.u, answer: TV(R),
            prompt: `${sc.two(p, showV(sc, x), showV(sc, y))}<br>${sc.sumQ(p)}`,
            hint: `${c.g('חבר', 'חברי')} את שני המספרים במאונך — נקודה מתחת לנקודה.`,
            solution: [m(showV(sc, x) + ' + ' + showV(sc, y) + ' = ' + showV(sc, R)), `התשובה: ${showV(sc, R)} ${sc.u}`],
          };
        }
        case 'storyShop': {
          const sc = c.scene(SHOP), p = pickP(c);
          if (level === 2 || c.chance(0.5)) {
            const its = c.sample(sc.items, 3), prs = its.map(() => price(c, 3, 35)), R = HM.sum(prs);
            return {
              type: 'number', decimal: true, unit: '₪', answer: TV(R),
              prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${sc.place} ${buyList(its, prs)}.<br>כמה שקלים ${p.g('שילם', 'שילמה')} בסך הכול?`,
              hint: `${c.g('חבר', 'חברי')} את שלושת המחירים במאונך — נקודה מתחת לנקודה.`,
              solution: [m(prs.map(NIS).join(' + ') + ' = ' + NIS(R)), `התשובה: ${NIS(R)} ₪`],
            };
          }
          const its = c.sample(sc.items, 2), prs = its.map(() => price(c, 4, 45)), sum = HM.sum(prs), bill = sum < 50000 ? 50 : 100, R = bill * 1000 - sum;
          return {
            type: 'number', decimal: true, unit: '₪', answer: TV(R),
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${sc.place} ${buyList(its, prs)}. ${p.g('הוא שילם', 'היא שילמה')} בשטר של ${bill} ₪.<br>כמה עודף ${p.g('הוא קיבל', 'היא קיבלה')}?`,
            hint: `קודם ${c.g('חשב', 'חשבי')} כמה עלו שני הדברים יחד, ואחר כך ${c.g('חשב', 'חשבי')} כמה חסר עד ${bill} ₪.`,
            solution: [`המחיר הכולל: ${m(prs.map(NIS).join(' + ') + ' = ' + NIS(sum))}`, `העודף: ${m(bill + ' − ' + NIS(sum) + ' = ' + NIS(R))}`, `התשובה: ${NIS(R)} ₪`],
          };
        }
      }
    },
  });

  /* ========== חיסור במאונך ========== */
  function subPair(c, level) {
    for (let g = 0; g < 80; g++) {
      let a, bb;
      if (level === 1) { a = tenths(c, 21, 199); bb = tenths(c, 11, 99); }
      else if (level === 2) { a = c.chance(0.5) ? hunds(c, 201, 2999) : tenths(c, 21, 299); bb = plc(a) === 1 ? hunds(c, 101, 1999) : c.chance(0.5) ? tenths(c, 11, 199) : hunds(c, 101, 1999); }
      else { const k = c.rnd(1, 3); a = k === 1 ? c.rnd(2, 50) * 1000 : k === 2 ? clean(c, 1001, 30000) : hunds(c, 1001, 9999); bb = k === 2 ? hunds(c, 101, 2999) : c.chance(0.5) ? clean(c, 101, 9999) : hunds(c, 101, 4999); }
      if (bb < a - 50) return [a, bb];
    }
    return [9500, 2750];
  }

  HM.lesson({
    id: 'dec-vsub',
    learn: (c) => [
      {
        title: 'כמה עודף?',
        html: `${c.name} ${c.g('קנה', 'קנתה')} מחברת ב-7.35 ₪ ${c.g('ושילם', 'ושילמה')} בשטר של 20 ₪. כמה עודף ${c.g('יקבל', 'תקבל')}?<br>כותבים במאונך ${b('נקודה מתחת לנקודה')}, ובמקומות הריקים כותבים אפסים: ${m('20 = 20.00')}.`,
        visual: V.column(['20', '7.35'], '−', { zeros: 'all', result: '12.65' }),
      },
      {
        title: 'המחוסר, המחסר וההפרש',
        html: `בתרגיל ${m('8.4 − 2.75 = 5.65')}:<br>• 8.4 הוא ${b('המחוסר')} (ממנו מחסרים)<br>• 2.75 הוא ${b('המחסר')} (אותו מחסרים)<br>• 5.65 הוא ${b('ההפרש')}<br>${c.g('שים לב', 'שימי לב')}: ${m('8.4 = 8.40')} — משלימים אפס כדי שיהיו מאיות לחסר מהן.`,
        visual: V.column(['8.4', '2.75'], '−', { zeros: true, result: '5.65' }),
      },
      {
        title: 'חיסור עם פריטה',
        html: `כשהספרה למעלה קטנה מהספרה למטה, ${b('פורטים')}: שלם אחד = 10 עשיריות, עשירית אחת = 10 מאיות.<br>${c.g('בוא', 'בואי')} נחסר ${m('6.42 − 3.75')}:`,
        visual: V.column(['6.42', '3.75'], '−', { result: '2.67' }),
        steps: [
          `מאיות: אי אפשר ${m('2 − 5')}. פורטים עשירית אחת ל-10 מאיות: ${m('12 − 5 = 7')}.`,
          `עשיריות: נשארו 3 עשיריות. אי אפשר ${m('3 − 7')}. פורטים שלם אחד: ${m('13 − 7 = 6')}.`,
          `יחידות: נשארו 5. ${m('5 − 3 = 2')}.`,
          `התשובה: ${m('6.42 − 3.75 = 2.67')} ✔`,
        ],
      },
      {
        title: 'בודקים בעזרת חיבור',
        html: `${b('ההפרש ועוד המחסר שווים למחוסר')}.<br>${m('6.42 − 3.75 = 2.67')}, ולכן ${m('2.67 + 3.75')} צריך לצאת ${m('6.42')}.<br>יצא? התרגיל נכון ✔`,
        visual: V.column(['2.67', '3.75'], '+', { result: '6.42', carry: carryAdd(['2.67', '3.75'], '6.42') }),
      },
      {
        title: 'אומדן הפרשים',
        html: `${c.g('עגל', 'עגלי')} למספרים שלמים: ${m('8.9 − 3.15 ≈ 9 − 3 = 6')}.<br>התוצאה המדויקת, ${m('5.75')}, קרובה ל-6 ✔. אם יצא ${m('0.575')} או ${m('57.5')} — משהו השתבש.`,
        visual: V.column(['8.90', '3.15'], '−', { result: '5.75' }),
        quiz: { type: 'number', decimal: true, answer: 2.65, prompt: `${c.g('חשב', 'חשבי')}: ${m('5 − 2.35 = ' + HM.slot(0))}`, hint: `${c.g('כתוב', 'כתבי')} ${m('5.00')} מעל ${m('2.35')} ${c.g('ופרוט', 'ופרטי')} כשצריך.`, solution: [V.column(['5.00', '2.35'], '−', { result: '2.65' }), `בדיקה: ${m('2.65 + 2.35 = 5')} ✔`] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['calc', 'calc', 'checkNum', 'estimate', 'errCheck', 'story', 'story', 'story']
        : level === 2 ? ['calc', 'wholeMinus', 'check', 'estNum', 'missing', 'errCheck', 'story', 'story', 'storyNeed', 'storyNeed']
        : ['wholeMinus', 'calc', 'missing', 'cmpEst', 'estNum', 'check', 'story', 'storyShop', 'storyShop', 'storyShop'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'calc':
        case 'wholeMinus': {
          let a, bb;
          if (kind === 'wholeMinus') { a = c.rnd(2, level === 2 ? 10 : 50) * 1000; bb = level === 2 ? hunds(c, 11, a / 10 - 11) : clean(c, 11, a - 11); }
          else [a, bb] = subPair(c, level);
          const R = a - bb;
          return {
            type: 'number', decimal: true, answer: TV(R),
            prompt: `${c.g('חשב', 'חשבי')} במאונך:<br>${m(T(a) + ' − ' + T(bb) + ' = ' + HM.slot(0))}`,
            visual: V.column([T(a), T(bb)], '−', { result: null }),
            hint: `${c.g('כתוב', 'כתבי')} נקודה מתחת לנקודה ${c.g('והשלם', 'והשלימי')} אפסים במקומות הריקים. כשהספרה למעלה קטנה מדי — ${c.g('פרוט', 'פרטי')}.`,
            solution: colSolution([a, bb], '−', R).concat([`בדיקה: ${m(T(R) + ' + ' + T(bb) + ' = ' + T(a))} ✔`]),
          };
        }
        case 'checkNum': {
          const [a, bb] = subPair(c, level), R = a - bb;
          return {
            type: 'number', decimal: true, answer: TV(a),
            prompt: `${c.g('בדוק', 'בדקי')} את התרגיל ${m(T(a) + ' − ' + T(bb) + ' = ' + T(R))} בעזרת חיבור:<br>${m(T(R) + ' + ' + T(bb) + ' = ' + HM.slot(0))}`,
            hint: 'ההפרש ועוד המחסר שווים למחוסר.',
            solution: [m(T(R) + ' + ' + T(bb) + ' = ' + T(a)), 'קיבלנו את המחוסר, ולכן התרגיל נכון ✔'],
          };
        }
        case 'check': {
          const [a, bb] = subPair(c, level), R = a - bb;
          return {
            type: 'choice', answer: 0,
            prompt: `איזה תרגיל חיבור בודק את התרגיל ${m(T(a) + ' − ' + T(bb) + ' = ' + T(R))}?`,
            choices: opts(T(R) + ' + ' + T(bb) + ' = ' + T(a), [T(a) + ' + ' + T(bb) + ' = ' + T(R), T(a) + ' + ' + T(R) + ' = ' + T(bb), T(bb) + ' + ' + T(a) + ' = ' + T(R)]),
            hint: 'בבדיקה מחברים את ההפרש עם המחסר, וצריך לקבל את המחוסר.',
            solution: [`ההפרש + המחסר = המחוסר: ${m(T(R) + ' + ' + T(bb) + ' = ' + T(a))}`],
          };
        }
        case 'errCheck': {
          let a, bb, pads, g = 0;
          do { [a, bb] = subPair(c, level); const dl = Math.max(plc(a), plc(bb)); pads = [TK(a, dl), TK(bb, dl)]; } while (!needsRegroup(pads, '−') && g++ < 40);
          const R = a - bb, res = TK(R, Math.max(plc(a), plc(bb))), wrong = slip(pads, '−'), ok = c.chance(0.4) || wrong === res, f = c.friend();
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('פתר', 'פתרה')} את התרגיל במאונך כמו בציור. האם הפתרון ${f.g('שלו', 'שלה')} נכון?`,
            visual: V.column(pads, '−', { result: ok ? res : wrong }),
            hint: `${c.g('בדוק', 'בדקי')} בעזרת חיבור: ההפרש ועוד המחסר צריכים לתת את המחוסר.`,
            solution: [V.column(pads, '−', { result: res }), ok ? `הפתרון נכון. בדיקה: ${m(T(R) + ' + ' + T(bb) + ' = ' + T(a))} ✔` : `${f.name} ${f.g('חיסר', 'חיסרה')} בכל עמודה את הספרה הקטנה מהגדולה, בלי לפרוט. התשובה הנכונה: ${m(T(R))}`],
          };
        }
        case 'estimate': {
          const a = tenths(c, 201, 499), bb = hunds(c, 101, 999), R = a - bb, mis = misaligned(a, bb, '−');
          return {
            type: 'choice', answer: 0,
            prompt: `${c.g('היעזר', 'היעזרי')} באומדן ${c.g('ובחר', 'ובחרי')} את התוצאה הנכונה:<br>${m(T(a) + ' − ' + T(bb))}`,
            choices: opts(T(R), [Math.abs(mis - R) >= 1500 ? T(mis) : null, T(R * 10), D(R, 4), T(R + 1000)]),
            hint: `${c.g('עגל', 'עגלי')} את שני המספרים למספרים שלמים ${c.g('וחסר', 'וחסרי')}. איזו תוצאה קרובה לאומדן?`,
            solution: [`אומדן: ${m(near(a) + ' − ' + near(bb) + ' = ' + (near(a) - near(bb)))}`, `התוצאה הקרובה לאומדן: ${m(T(R))}`],
          };
        }
        case 'estNum': {
          let a, bb, g = 0;
          do { a = hunds(c, 301, 4999); bb = hunds(c, 101, 2999); } while (near(a) - near(bb) < 1 && g++ < 40);
          if (near(a) - near(bb) < 1) { a = 7480; bb = 2310; }
          const E = near(a) - near(bb);
          return {
            type: 'number', answer: E,
            prompt: `${c.g('עגל', 'עגלי')} כל מספר למספר השלם הקרוב, ${c.g('וחשב', 'וחשבי')} אומדן להפרש:<br>${m(T(a) + ' − ' + T(bb) + ' ≈ ' + HM.slot(0))}`,
            hint: `${c.g('הסתכל', 'הסתכלי')} על ספרת העשיריות: 5 ומעלה ← מעגלים למעלה, פחות מ-5 ← מעגלים למטה.`,
            solution: [m(T(a) + ' ≈ ' + near(a)) + ' , ' + m(T(bb) + ' ≈ ' + near(bb)), m(near(a) + ' − ' + near(bb) + ' = ' + E)],
          };
        }
        case 'missing': {
          const [a, bb] = subPair(c, level), R = a - bb, askB = c.chance(0.5);
          return {
            type: 'number', decimal: true, answer: TV(askB ? bb : a),
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:<br>${m((askB ? T(a) + ' − ' + HM.slot(0) : HM.slot(0) + ' − ' + T(bb)) + ' = ' + T(R))}`,
            hint: askB ? 'המחסר החסר = המחוסר פחות ההפרש.' : 'המחוסר החסר = ההפרש ועוד המחסר.',
            solution: askB ? [m(T(a) + ' − ' + T(R) + ' = ' + T(bb)), `בדיקה: ${m(T(a) + ' − ' + T(bb) + ' = ' + T(R))} ✔`] : [m(T(R) + ' + ' + T(bb) + ' = ' + T(a)), `בדיקה: ${m(T(a) + ' − ' + T(bb) + ' = ' + T(R))} ✔`],
          };
        }
        case 'cmpEst': {
          const [a, bb] = subPair(c, 2), R = a - bb, N = Math.max(1, near(R) + c.pick([0, 1, -1])), s = sign(R, N * 1000);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: `${T(a)} − ${T(bb)}`, right: String(N), lv: TV(R), rv: N, answer: s,
            hint: `${c.g('נסה', 'נסי')} קודם אומדן. אם התוצאה קרובה מדי, ${c.g('חשב', 'חשבי')} בדיוק.`,
            solution: [m(T(a) + ' − ' + T(bb) + ' = ' + T(R)), m(T(R) + ' ' + signH(s) + ' ' + N)],
          };
        }
        case 'story': {
          const sc = c.scene(SC), p = pickP(c);
          let t, x;
          if (sc.money) { t = level === 1 ? c.rnd(20, 60) * 1000 : c.rnd(30, 150) * 1000 + (level === 3 ? c.pick(AG) * 10 : 0); x = level === 1 ? c.rnd(5, 18) * 1000 + c.rnd(1, 9) * 100 : price(c, 5, Math.floor(t / 1000) - 3); }
          else if (level === 1) { t = tenths(c, 11, sc.max * 10); x = tenths(c, 1, t / 100 - 1); }
          else { t = c.chance(0.5) ? hunds(c, 101, sc.max * 100) : tenths(c, 11, sc.max * 10); x = plc(t) === 1 || c.chance(0.5) ? hunds(c, 11, Math.floor(t / 10) - 11) : tenths(c, 1, Math.floor(t / 100) - 1); }
          const R = t - x;
          return {
            type: 'number', decimal: true, unit: sc.u, answer: TV(R),
            prompt: `${sc.left(p, showV(sc, t), showV(sc, x))}<br>${sc.leftQ(p)}`,
            hint: `${c.g('חסר', 'חסרי')} במאונך — נקודה מתחת לנקודה, ואפסים במקומות הריקים.`,
            solution: [m(showV(sc, t) + ' − ' + showV(sc, x) + ' = ' + showV(sc, R)), `בדיקה: ${m(showV(sc, R) + ' + ' + showV(sc, x) + ' = ' + showV(sc, t))} ✔`, `התשובה: ${showV(sc, R)} ${sc.u}`],
          };
        }
        case 'storyNeed': {
          const sc = c.scene(SHOP), p = pickP(c), it = c.pick(sc.items), x = price(c, 25, 90), t = x - (c.rnd(2, 20) * 1000 + c.pick(AG) * 10), R = x - t;
          return {
            type: 'number', decimal: true, unit: '₪', answer: TV(R),
            prompt: `ל${p.name} יש ${NIS(t)} ₪. ${p.g('הוא רוצה', 'היא רוצה')} לקנות ${sc.place} ${it} שעולה ${NIS(x)} ₪.<br>כמה שקלים חסרים ל${p.name}?`,
            hint: `${c.g('חשב', 'חשבי')} את ההפרש בין המחיר לבין הכסף שיש.`,
            solution: [m(NIS(x) + ' − ' + NIS(t) + ' = ' + NIS(R)), `התשובה: ${NIS(R)} ₪`],
          };
        }
        case 'storyShop': {
          const sc = c.scene(SHOP), p = pickP(c), n = c.pick([2, 3]), its = c.sample(sc.items, n), prs = its.map(() => price(c, 4, 30)), sum = HM.sum(prs);
          const bill = sum < 50000 ? 50 : sum < 100000 ? 100 : 200, R = bill * 1000 - sum;
          return {
            type: 'number', decimal: true, unit: '₪', answer: TV(R),
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${sc.place} ${buyList(its, prs)}. ${p.g('הוא שילם', 'היא שילמה')} בשטר של ${bill} ₪.<br>כמה עודף ${p.g('הוא קיבל', 'היא קיבלה')}?`,
            hint: `שני שלבים: קודם ${c.g('חשב', 'חשבי')} כמה עלו כל הדברים יחד, ואחר כך ${c.g('חסר', 'חסרי')} את הסכום מ-${bill} ₪.`,
            solution: [`המחיר הכולל: ${m(prs.map(NIS).join(' + ') + ' = ' + NIS(sum))}`, `העודף: ${m(bill + '.00 − ' + NIS(sum) + ' = ' + NIS(R))}`, `התשובה: ${NIS(R)} ₪`],
          };
        }
      }
    },
  });

  /* ========== סדרות של מספרים עשרוניים ========== */
  const SQ = [
    { tags: ['sport'], u: 'ק"מ', t: (p, a, d) => `באימון הראשון ${p.name} ${p.g('רץ', 'רצה')} ${a} ק"מ, ובכל אימון ${p.g('הוא מוסיף', 'היא מוסיפה')} ${d} ק"מ.`, q: (p, n) => `כמה קילומטרים ${p.g('ירוץ', 'תרוץ')} ${p.name} באימון ${ORD[n]}?` },
    { tags: ['animals'], u: 'ק"ג', t: (p, a, d) => `הגור של ${p.name} שקל בשבוע הראשון ${a} ק"ג, ובכל שבוע משקלו עלה ב-${d} ק"ג.`, q: (p, n) => `כמה ישקול הגור בשבוע ${ORD[n]}?` },
    { tags: ['space'], u: "מ'", t: (p, a, d) => `${p.name} בונה מגדל שיגור לדגמי טילים. ביום הראשון גובהו ${a} מ', ובכל יום ${p.g('הוא מוסיף', 'היא מוסיפה')} לו ${d} מ'.`, q: (p, n) => `מה יהיה גובה המגדל ביום ${ORD[n]}?` },
    { tags: ['music'], u: 'שעות', t: (p, a, d) => `ביום הראשון ${p.name} ${p.g('התאמן', 'התאמנה')} בגיטרה ${a} שעות, ובכל יום ${p.g('הוא מתאמן', 'היא מתאמנת')} ${d} שעות יותר.`, q: (p, n) => `כמה שעות ${p.g('יתאמן', 'תתאמן')} ${p.name} ביום ${ORD[n]}?` },
    { tags: ['baking'], u: 'ק"ג', t: (p, a, d) => `ביום הראשון של מכירת העוגיות ${p.name} ${p.g('השתמש', 'השתמשה')} ב-${a} ק"ג קמח, ובכל יום ${p.g('הוא משתמש', 'היא משתמשת')} ב-${d} ק"ג יותר.`, q: (p, n) => `בכמה קילוגרמים של קמח ${p.g('ישתמש', 'תשתמש')} ${p.name} ביום ${ORD[n]}?` },
    { tags: ['games'], u: 'נקודות', t: (p, a, d) => `במשחק של ${p.name} מקבלים בשלב הראשון ${a} נקודות כוח, ובכל שלב ${d} נקודות יותר.`, q: (p, n) => `כמה נקודות כוח מקבלים בשלב ${ORD[n]}?` },
    { tags: ['art'], u: 'ס"מ', t: (p, a, d) => `${p.name} ${p.g('מצייר', 'מציירת')} פסים צבעוניים. הפס הראשון ארוך ${a} ס"מ, וכל פס ארוך ב-${d} ס"מ מהפס שלפניו.`, q: (p, n) => `מה אורך הפס ${ORD[n]}?` },
    { tags: ['nature'], u: 'ס"מ', t: (p, a, d) => `הצמח ש${p.name} ${p.g('שתל', 'שתלה')} היה גבוה ${a} ס"מ ביום הראשון, ובכל יום הוא גדל ב-${d} ס"מ.`, q: (p, n) => `מה יהיה גובה הצמח ביום ${ORD[n]}?` },
    { tags: ['reading'], money: true, u: '₪', t: (p, a, d) => `${p.name} ${p.g('חוסך', 'חוסכת')} לספר חדש. בשבוע הראשון היו בקופה ${a} ₪, ובכל שבוע ${p.g('הוא מוסיף', 'היא מוסיפה')} ${d} ₪.`, q: (p, n) => `כמה שקלים יהיו בקופה בשבוע ${ORD[n]}?` },
    { tags: ['tech'], u: "מ'", t: (p, a, d) => `אחרי שנייה אחת הרובוט של ${p.name} נמצא ${a} מ' מקו הזינוק, ובכל שנייה הוא מתקדם עוד ${d} מ'.`, q: (p, n) => `כמה מטרים מקו הזינוק יהיה הרובוט אחרי ${n} שניות?` },
    { tags: ['kpop'], u: 'דקות', t: (p, a, d) => `${p.name} ${p.g('לומד', 'לומדת')} ריקוד של להקת קיי-פופ. ביום הראשון ${p.g('הוא התאמן', 'היא התאמנה')} ${a} דקות, ובכל יום ${d} דקות יותר.`, q: (p, n) => `כמה דקות ${p.g('יתאמן', 'תתאמן')} ${p.name} ביום ${ORD[n]}?` },
    { tags: ['magic'], u: 'ליטר', t: (p, a, d) => `בשיעור שיקויים ${p.name} ${p.g('מוזג', 'מוזגת')} לסיר הראשון ${a} ליטר, ולכל סיר אחריו ${d} ליטר יותר.`, q: (p, n) => `כמה ליטרים ${p.g('ימזוג', 'תמזוג')} ${p.name} לסיר ${ORD[n]}?` },
    { tags: ['squishy'], money: true, u: '₪', t: (p, a, d) => `${p.name} ${p.g('חוסך', 'חוסכת')} לסקווישי חדש. בשבוע הראשון היו בקופה ${a} ₪, ובכל שבוע ${p.g('הוא מוסיף', 'היא מוסיפה')} ${d} ₪.`, q: (p, n) => `כמה שקלים יהיו בקופה בשבוע ${ORD[n]}?` },
  ];
  function seqParams(c, level) {
    if (level === 1) return { a: c.rnd(1, 40) * 100, d: c.pick([100, 200, 300, 500, 100]) };
    if (level === 2) return { a: c.rnd(1, 300) * 10, d: c.pick([50, 250, 150, 20, 50, 400, 1100, 120, 350]) };
    return { a: c.rnd(1, 3000), d: c.pick([125, 25, 75, 5, 350, 1250, 15, 45]) };
  }
  // 5 איברים (עולה או יורדת, תמיד חיוביים)
  function seqTerms(c, level, upP) {
    const { a, d } = seqParams(c, level), up = c.chance(upP), start = up ? a : a + 5 * d;
    return { d, up, t: HM.range(0, 4).map((i) => (up ? start + i * d : start - i * d)) };
  }
  const jumpLine = (s) => m(s.up ? T(s.t[1]) + ' − ' + T(s.t[0]) : T(s.t[0]) + ' − ' + T(s.t[1])) + ` = ${m(T(s.d))}`;

  HM.lesson({
    id: 'dec-seq',
    learn: (c) => [
      {
        title: 'קפיצות של צפרדע',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} צפרדע שקופצת על ישר המספרים. בכל קפיצה היא מתקדמת ${m('0.2')}.<br>היא נוחתת ב: ${HM.seq(['0.2', '0.4', '0.6', '0.8', '1', '1.2'])}<br>זו ${b('סדרה')}, ו-${m('0.2')} הוא ${b('הקפיצה')} שלה.`,
        visual: V.numberLine({ min: 0, max: 1.2, step: 0.1, labels: (v, i) => (i % 5 === 0 ? D(i, 1) : null), jumps: HM.range(0, 5).map((k) => ({ from: k * 0.2, to: (k + 1) * 0.2, label: k === 0 ? '+0.2' : '' })), maxw: 360 }),
      },
      {
        title: 'זהירות במעבר לשלם',
        html: `כשהקפיצה ידועה, מוסיפים אותה בכל צעד: ${HM.seq(['0.7', '0.8', '0.9', '1', '1.1'])}<br>${c.g('שים לב', 'שימי לב')}: אחרי ${m('0.9')} בא ${m('1')}, ולא 0.10! כי ${m('0.9 + 0.1 = 1')} — 10 עשיריות הן שלם אחד.`,
        visual: V.numberLine({ min: 0.6, max: 1.2, step: 0.1, labels: (v, i) => D(6 + i, 1), marks: [{ v: 1, label: '1', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'סדרה יורדת',
        html: `בסדרה ${b('יורדת')} מחסרים את הקפיצה בכל צעד:<br>${HM.seq(['3.5', '3.25', '3', '2.75', '2.5'])}<br>כאן מחסרים ${m('0.25')} בכל פעם.`,
        visual: V.numberLine({ min: 2.5, max: 3.5, step: 0.25, labels: (v, i) => D(250 + i * 25, 2), jumps: HM.range(0, 3).map((k) => ({ from: 3.5 - k * 0.25, to: 3.25 - k * 0.25, label: k === 0 ? '−0.25' : '' })), maxw: 360 }),
      },
      {
        title: 'מגלים את הקפיצה',
        html: `מה האיבר הבא? ${HM.seq(['2.35', '2.5', '2.65', null])}`,
        steps: [
          `הקפיצה היא ההפרש בין שני איברים סמוכים: ${m('2.5 − 2.35 = 0.15')} (כי ${m('2.50 − 2.35 = 0.15')}).`,
          `${c.g('בדוק', 'בדקי')} גם בזוג הבא: ${m('2.65 − 2.5 = 0.15')} ✔`,
          `האיבר הבא: ${m('2.65 + 0.15 = 2.8')}`,
        ],
        visual: V.numberLine({ min: 2.3, max: 2.9, step: 0.05, every: 2, labels: (v, i) => (i % 2 === 0 ? D(230 + i * 5, 2) : null), marks: [{ v: 2.35 }, { v: 2.5 }, { v: 2.65 }, { v: 2.8, label: '?', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'איבר רחוק',
        html: `בסדרה האיבר הראשון הוא ${m('1.2')} והקפיצה היא ${m('0.5')}. מה האיבר העשירי?<br>מהאיבר הראשון עד העשירי יש ${b('9 קפיצות')}: ${m('9 × 0.5 = 4.5')}, ולכן האיבר העשירי הוא ${m('1.2 + 4.5 = 5.7')}.`,
        visual: V.numberLine({ min: 1, max: 6, step: 0.5, labels: (v, i) => (i % 2 === 0 ? String(1 + i / 2) : null), marks: [{ v: 1.2, label: '1.2' }, { v: 5.7, label: '5.7', cls: 'f-b' }], jumps: [{ from: 1.2, to: 5.7, label: '9 × 0.5' }], maxw: 360 }),
        quiz: { type: 'number', decimal: true, answer: 5.5, prompt: `${c.g('השלם', 'השלימי')}: ${HM.seq(['4.75', '5', '5.25', HM.slot(0)])}`, hint: `הקפיצה היא ${m('5 − 4.75')}.`, solution: [`הקפיצה: ${m('5 − 4.75 = 0.25')}`, m('5.25 + 0.25 = 5.5')] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['next', 'next', 'jump', 'line', 'tfCross', 'story', 'story', 'story']
        : level === 2 ? ['next', 'jump', 'middle', 'line', 'tfCross', 'story', 'story', 'story']
        : ['middle2', 'nth', 'jump', 'next', 'tfCross', 'story', 'story', 'story', 'story'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'next': {
          const s = seqTerms(c, level, level === 1 ? 0.75 : 0.6), t = s.t, show = level === 1 || (level === 2 && c.chance(0.4));
          return {
            type: 'number', decimal: true, answer: TV(t[4]),
            prompt: `${c.g('השלם', 'השלימי')} את האיבר הבא בסדרה${show ? ` (בכל צעד ${s.up ? 'מוסיפים' : 'מחסרים'} ${m(T(s.d))})` : ''}:<br>${HM.seq(t.slice(0, 4).map(T).concat([HM.slot(0)]))}`,
            hint: show ? `${s.up ? c.g('הוסף', 'הוסיפי') : c.g('החסר', 'החסירי')} ${m(T(s.d))} לאיבר האחרון. ${c.g('שים לב', 'שימי לב')} למעבר בין המקומות.` : `קודם ${c.g('מצא', 'מצאי')} את הקפיצה: ${c.g('חשב', 'חשבי')} את ההפרש בין שני איברים סמוכים.`,
            solution: [`הסדרה ${s.up ? 'עולה' : 'יורדת'}. הקפיצה: ${jumpLine(s)}`, m(T(t[3]) + (s.up ? ' + ' : ' − ') + T(s.d) + ' = ' + T(t[4]))],
          };
        }
        case 'jump': {
          const s = seqTerms(c, level, 0.6), t = s.t;
          return {
            type: 'number', decimal: true, answer: TV(s.d),
            prompt: `הסדרה ${s.up ? 'עולה' : 'יורדת'}: ${HM.seq(t.map(T))}<br>בכמה ${s.up ? 'גדל' : 'קטן'} כל איבר?`,
            hint: `${c.g('חשב', 'חשבי')} את ההפרש בין שני איברים סמוכים. ${c.g('הוסף', 'הוסיפי')} אפסים כדי שיהיה קל לחסר.`,
            solution: [`הקפיצה: ${jumpLine(s)}`, `בדיקה: ${m(T(t[1]) + (s.up ? ' + ' : ' − ') + T(s.d) + ' = ' + T(t[2]))} ✔`],
          };
        }
        case 'middle': {
          const s = seqTerms(c, level, 0.6), t = s.t, k = c.rnd(1, 3);
          return {
            type: 'number', decimal: true, answer: TV(t[k]),
            prompt: `${c.g('השלם', 'השלימי')} את האיבר החסר בסדרה:<br>${HM.seq(t.map((x, i) => (i === k ? HM.slot(0) : T(x))))}`,
            hint: `${c.g('מצא', 'מצאי')} את הקפיצה בעזרת שני איברים סמוכים שמופיעים בסדרה.`,
            solution: [`הקפיצה היא ${m(T(s.d))} (הסדרה ${s.up ? 'עולה' : 'יורדת'}).`, m(T(t[k - 1]) + (s.up ? ' + ' : ' − ') + T(s.d) + ' = ' + T(t[k]))],
          };
        }
        case 'middle2': {
          const s = seqTerms(c, 3, 0.6), t = s.t;
          return {
            type: 'number', decimal: true, answer: [TV(t[1]), TV(t[3])],
            prompt: `${c.g('השלם', 'השלימי')} את שני האיברים החסרים בסדרה:<br>${HM.seq([T(t[0]), HM.slot(0), T(t[2]), HM.slot(1), T(t[4])])}`,
            hint: `בין ${m(T(t[0]))} ל-${m(T(t[2]))} יש ${b('שתי')} קפיצות.`,
            solution: [`מ-${m(T(t[0]))} ל-${m(T(t[2]))} יש 2 קפיצות: ${m(s.up ? T(t[2]) + ' − ' + T(t[0]) : T(t[0]) + ' − ' + T(t[2]))} = ${m(T(2 * s.d))}, ולכן קפיצה אחת היא ${m(T(s.d))}.`, `האיברים החסרים: ${m(T(t[1]))} ו-${m(T(t[3]))}.`],
          };
        }
        case 'line': {
          const fine = level === 2 && c.chance(0.5);
          const step = fine ? 50 : 100, maxV = fine ? 2000 : 3000;
          let d, a, ans, g = 0;
          do { d = fine ? c.pick([50, 150, 250]) : c.pick([100, 200, 300]); a = c.rnd(1, maxV / step - 4) * step; ans = a + 3 * d; } while ((ans > maxV - step || ans % 1000 === 0) && g++ < 60);
          if (ans > maxV - step || ans % 1000 === 0) { d = 200; a = 300; ans = 900; }
          const t = [a, a + d, a + 2 * d];
          return {
            type: 'numberline', answer: TV(ans),
            line: { min: 0, max: maxV / 1000, step: step / 1000, labels: (v, i) => (i % (1000 / step) === 0 ? String((i * step) / 1000) : null) },
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את האיבר הבא בסדרה:<br>${HM.seq(t.map(T).concat([null]))}`,
            hint: `${c.g('מצא', 'מצאי')} את הקפיצה, ${c.g('והוסף', 'והוסיפי')} אותה לאיבר האחרון. כל סימון על הישר הוא ${m(T(step))}.`,
            solution: [`הקפיצה: ${m(T(t[1]) + ' − ' + T(t[0]) + ' = ' + T(d))}`, m(T(t[2]) + ' + ' + T(d) + ' = ' + T(ans))],
          };
        }
        case 'tfCross': {
          const dd = level === 1 ? 100 : c.pick([100, 10]);
          const E = dd === 100 ? c.rnd(1, level === 1 ? 5 : 20) * 1000 : c.rnd(3, 99) * 100;
          const t = [E - 3 * dd, E - 2 * dd, E - dd], naive = T(E - dd).replace(/9$/, '10'), right = c.chance(0.5);
          return {
            type: 'tf', answer: right,
            prompt: `נכון או לא נכון?<br>האיבר הבא בסדרה ${HM.seq(t.map(T))} הוא ${m(right ? T(E) : naive)}.`,
            hint: `הקפיצה היא ${m(T(dd))}. ${c.g('זכור', 'זכרי')}: 10 ${dd === 100 ? 'עשיריות הן שלם אחד' : 'מאיות הן עשירית אחת'}.`,
            solution: [`האיבר הבא: ${m(T(E - dd) + ' + ' + T(dd) + ' = ' + T(E))}`, right ? 'הטענה נכונה.' : `${m(naive)} הוא אפילו קטן מ-${m(T(E - dd))}! הטענה לא נכונה.`],
          };
        }
        case 'nth': {
          const { a, d } = seqParams(c, 2), n = c.rnd(8, 12), v = a + (n - 1) * d;
          return {
            type: 'number', decimal: true, answer: TV(v),
            prompt: `בסדרה עולה האיבר הראשון הוא ${m(T(a))} והקפיצה היא ${m(T(d))}:<br>${HM.seq([T(a), T(a + d), T(a + 2 * d), '…'])}<br>מה האיבר ${ORD[n]}?`,
            hint: `כמה קפיצות יש מהאיבר הראשון עד האיבר ${ORD[n]}? (לא ${n}!)`,
            solution: [`מהאיבר הראשון עד האיבר ${ORD[n]} יש ${n - 1} קפיצות.`, m(`${n - 1} × ${T(d)} = ${T((n - 1) * d)}`), m(`${T(a)} + ${T((n - 1) * d)} = ${T(v)}`)],
          };
        }
        case 'story': {
          const sc = c.scene(SQ), p = pickP(c);
          let a, d, n;
          if (sc.money) { a = c.rnd(5, 20) * 1000 + c.pick([0, 500]); d = c.pick(level === 1 ? [500, 1500, 2500] : [2500, 3500, 1250, 4750]); }
          else if (level === 1) { a = tenths(c, 5, 30); d = c.pick([100, 200, 500, 300]); }
          else if (level === 2) { a = hunds(c, 50, 300); d = c.pick([250, 150, 50, 350, 120, 450]); }
          else { a = hunds(c, 50, 300); d = c.pick([125, 250, 75, 150, 225]); }
          n = level === 1 ? c.rnd(3, 4) : level === 2 ? c.rnd(4, 6) : c.rnd(8, 12);
          const val2 = (v) => (sc.money ? NIS(v) : T(v)), v = a + (n - 1) * d;
          const terms = HM.range(0, n - 1).map((i) => val2(a + i * d));
          return {
            type: 'number', decimal: true, unit: sc.u, answer: TV(v),
            prompt: `${sc.t(p, val2(a), val2(d))}<br>${sc.q(p, n)}`,
            hint: n <= 6 ? `${c.g('כתוב', 'כתבי')} את המספרים לפי הסדר: ${c.g('התחל', 'התחילי')} ב-${val2(a)} ${c.g('והוסף', 'והוסיפי')} ${val2(d)} בכל פעם.` : `${c.g('חשב', 'חשבי')} כמה קפיצות יש מהראשון עד ה${ORD[n].slice(1)}, ${c.g('וכפול', 'וכפלי')} בגודל הקפיצה.`,
            solution: n <= 6 ? [HM.seq(terms), `התשובה: ${val2(v)} ${sc.u}`] : [`מהראשון עד ה${ORD[n].slice(1)} יש ${n - 1} קפיצות: ${m(`${n - 1} × ${val2(d)} = ${val2((n - 1) * d)}`)}`, m(`${val2(a)} + ${val2((n - 1) * d)} = ${val2(v)}`), `התשובה: ${val2(v)} ${sc.u}`],
          };
        }
      }
    },
  });

  /* ========== מספר עשרוני בין שני מספרים ========== */
  // זוג מספרים A < B (באלפיות) ו-f: הצעד הקטן שבו יש מספרים ביניהם
  function btPair(c, level) {
    const w = c.rnd(0, level === 1 ? 3 : 9) * 1000;
    if (level === 1) { const a = w + c.rnd(1, 8) * 100; return { A: a, B: a + 100, f: 10 }; }
    if (level === 2) {
      if (c.chance(0.6)) { const a = w + c.rnd(1, 8) * 100; return { A: a, B: a + 100, f: 10 }; }
      const a = w + clean(c, 11, 89) * 10; return { A: a, B: a + c.pick([30, 40, 50, 60]), f: 10 };
    }
    if (c.chance(0.6)) { const a = w + clean(c, 11, 89) * 10; return { A: a, B: a + 10, f: 1 }; }
    const a = w + c.rnd(1, 8) * 100; return { A: a, B: a + 10, f: 1 }; // למשל 0.5 ו-0.51
  }
  const qOf = (f) => (f === 10 ? 2 : 3);
  // מספרים שאינם בין A ל-B (מסיחים)
  function outside(c, P, base) {
    const { A, B, f } = P;
    const cand = [B + f * c.rnd(1, 4), A - f * c.rnd(1, 4), base * 10, A % 10 === 0 ? A / 10 : null, B + 100 * c.rnd(1, 3), A - 100 * c.rnd(1, 3)];
    return cand.filter((v) => v != null && v > 0 && (v <= A || v >= B));
  }
  const BT = [
    { tags: ['sport'], u: "מ'", w: [1, 4], s: (p, v) => `${p.name} ${p.g('קפץ', 'קפצה')} לרוחק ${v} מ'`, mid: (me, p1, p2) => `${me.name} ${me.g('קפץ', 'קפצה')} רחוק יותר מ${p1.name}, אבל פחות רחוק מ${p2.name}.`, q: (me) => `כמה מטרים יכול להיות ש${me.name} ${me.g('קפץ', 'קפצה')}?` },
    { tags: ['animals'], u: 'ק"ג', w: [5, 30], s: (p, v) => `הכלב של ${p.name} שוקל ${v} ק"ג`, mid: (me, p1, p2) => `הכלב של ${me.name} כבד יותר מהכלב של ${p1.name}, אבל קל יותר מהכלב של ${p2.name}.`, q: (me) => `כמה יכול לשקול הכלב של ${me.name}?` },
    { tags: ['space'], u: "מ'", w: [5, 40], s: (p, v) => `הטיל של ${p.name} עף לגובה ${v} מ'`, mid: (me, p1, p2) => `הטיל של ${me.name} עף גבוה יותר מהטיל של ${p1.name}, אבל נמוך יותר מהטיל של ${p2.name}.`, q: (me) => `לאיזה גובה יכול היה לעוף הטיל של ${me.name}?` },
    { tags: ['music'], u: 'דקות', w: [2, 5], s: (p, v) => `השיר ש${p.name} ${p.g('הלחין', 'הלחינה')} נמשך ${v} דקות`, mid: (me, p1, p2) => `השיר של ${me.name} ארוך יותר מהשיר של ${p1.name}, אבל קצר יותר מהשיר של ${p2.name}.`, q: (me) => `כמה דקות יכול להימשך השיר של ${me.name}?` },
    { tags: ['baking'], u: 'ק"ג', w: [1, 3], s: (p, v) => `העוגה ש${p.name} ${p.g('אפה', 'אפתה')} שוקלת ${v} ק"ג`, mid: (me, p1, p2) => `העוגה של ${me.name} כבדה יותר מהעוגה של ${p1.name}, אבל קלה יותר מהעוגה של ${p2.name}.`, q: (me) => `כמה יכולה לשקול העוגה של ${me.name}?` },
    { tags: ['games'], u: "מ'", w: [1, 9], s: (p, v) => `הדמות של ${p.name} במשחק קפצה לגובה ${v} מ'`, mid: (me, p1, p2) => `הדמות של ${me.name} קפצה גבוה יותר מהדמות של ${p1.name}, אבל נמוך יותר מהדמות של ${p2.name}.`, q: (me) => `לאיזה גובה יכלה לקפוץ הדמות של ${me.name}?` },
    { tags: ['art'], u: "מ'", w: [0, 2], s: (p, v) => `הציור של ${p.name} רחב ${v} מ'`, mid: (me, p1, p2) => `הציור של ${me.name} רחב יותר מהציור של ${p1.name}, אבל צר יותר מהציור של ${p2.name}.`, q: (me) => `מה יכול להיות הרוחב של הציור של ${me.name}?` },
    { tags: ['nature'], u: "מ'", w: [0, 2], s: (p, v) => `המקל ש${p.name} ${p.g('מצא', 'מצאה')} בטיול ארוך ${v} מ'`, mid: (me, p1, p2) => `המקל של ${me.name} ארוך יותר מהמקל של ${p1.name}, אבל קצר יותר מהמקל של ${p2.name}.`, q: (me) => `מה יכול להיות האורך של המקל של ${me.name}?` },
    { tags: ['reading'], u: 'ס"מ', w: [1, 6], s: (p, v) => `הספר ש${p.name} ${p.g('קורא', 'קוראת')} עבה ${v} ס"מ`, mid: (me, p1, p2) => `הספר של ${me.name} עבה יותר מהספר של ${p1.name}, אבל דק יותר מהספר של ${p2.name}.`, q: (me) => `מה יכול להיות העובי של הספר של ${me.name}?` },
    { tags: ['tech'], u: "מ'", w: [1, 20], s: (p, v) => `הרובוט של ${p.name} נסע ${v} מ'`, mid: (me, p1, p2) => `הרובוט של ${me.name} נסע יותר מהרובוט של ${p1.name}, אבל פחות מהרובוט של ${p2.name}.`, q: (me) => `כמה מטרים יכול היה לנסוע הרובוט של ${me.name}?` },
    { tags: ['kpop'], u: 'ס"מ', w: [20, 40], s: (p, v) => `מקל האור של ${p.name} ארוך ${v} ס"מ`, mid: (me, p1, p2) => `מקל האור של ${me.name} ארוך יותר מזה של ${p1.name}, אבל קצר יותר מזה של ${p2.name}.`, q: (me) => `מה יכול להיות האורך של מקל האור של ${me.name}?` },
    { tags: ['magic'], u: 'ס"מ', w: [25, 40], s: (p, v) => `השרביט של ${p.name} ארוך ${v} ס"מ`, mid: (me, p1, p2) => `השרביט של ${me.name} ארוך יותר מהשרביט של ${p1.name}, אבל קצר יותר מהשרביט של ${p2.name}.`, q: (me) => `מה יכול להיות האורך של השרביט של ${me.name}?` },
    { tags: ['squishy'], u: 'שניות', w: [2, 9], s: (p, v) => `הסקווישי של ${p.name} חוזר לצורתו אחרי ${v} שניות`, mid: (me, p1, p2) => `הסקווישי של ${me.name} חוזר לצורתו לאט יותר מהסקווישי של ${p1.name}, אבל מהר יותר מהסקווישי של ${p2.name}.`, q: (me) => `אחרי כמה שניות יכול הסקווישי של ${me.name} לחזור לצורתו?` },
  ];

  HM.lesson({
    id: 'dec-between',
    learn: (c) => [
      {
        title: 'יש מישהו באמצע?',
        html: `${c.name} ${c.g('מדד', 'מדדה')} את הגובה של שני חברים: ${m('1.3')} מ' ו-${m('1.4')} מ'. האם יש גובה שנמצא ביניהם?<br>כן! למשל ${m('1.35')} מ'. על ישר המספרים רואים שבין 1.3 ל-1.4 יש עוד הרבה נקודות.`,
        visual: V.numberLine({ min: 1.3, max: 1.4, step: 0.01, labels: (v, i) => (i === 0 ? '1.3' : i === 10 ? '1.4' : null), marks: [{ v: 1.35, label: '1.35' }], maxw: 360 }),
      },
      {
        title: 'מוסיפים אפס — ומגלים מקום',
        html: `${m('0.3 = 0.30')} ו-${m('0.4 = 0.40')}.<br>עכשיו רואים שביניהם יש 9 מספרים עם 2 ספרות אחרי הנקודה: ${m('0.31, 0.32, … , 0.39')}.`,
        visual: V.numberLine({ min: 0.3, max: 0.4, step: 0.01, labels: (v, i) => (i % 5 === 0 ? D(30 + i, 2) : null), maxw: 360 }),
      },
      {
        title: 'תמיד יש עוד',
        html: `גם בין ${m('0.35')} ל-${m('0.36')} יש מספרים: ${m('0.351, 0.352, … , 0.359')}.<br>ובין 0.351 ל-0.352? גם!<br>${HM.hl('בין כל שני מספרים עשרוניים שונים יש עוד אין-סוף מספרים.')}`,
        visual: V.numberLine({ min: 0.35, max: 0.36, step: 0.001, labels: (v, i) => (i === 0 ? '0.35' : i === 10 ? '0.36' : i === 5 ? '0.355' : null), maxw: 360 }),
      },
      {
        title: 'המספר שבאמצע',
        html: `איזה מספר נמצא ${b('בדיוק באמצע')} בין ${m('2.4')} ל-${m('2.5')}?`,
        visual: V.numberLine({ min: 2.4, max: 2.5, step: 0.01, labels: (v, i) => (i === 0 ? '2.4' : i === 10 ? '2.5' : null), marks: [{ v: 2.45, label: '2.45' }], maxw: 360 }),
        steps: [
          `מוסיפים אפס: ${m('2.40')} ו-${m('2.50')}.`,
          `ביניהם: ${m('2.41, 2.42, … , 2.49')}. האמצע הוא ${m('2.45')}.`,
          `בדיקה: ${m('2.45 − 2.4 = 0.05')} וגם ${m('2.5 − 2.45 = 0.05')} ✔`,
        ],
      },
      {
        title: 'זהירות ממלכודת',
        html: `מה גדול יותר: ${m('0.5')} או ${m('0.45')}? מספר עם יותר ספרות ${b('לא')} תמיד גדול יותר!<br>${m('0.5 = 0.50 &gt; 0.45')}, ולכן בין 0.45 ל-0.5 נמצאים ${m('0.46, 0.47, 0.48, 0.49')}.`,
        visual: V.numberLine({ min: 0.4, max: 0.5, step: 0.01, labels: (v, i) => (i === 0 ? '0.4' : i === 10 ? '0.5' : null), marks: [{ v: 0.45, label: '0.45' }], maxw: 360 }),
        quiz: { type: 'choice', answer: 0, prompt: `איזה מספר נמצא בין ${m('0.6')} ל-${m('0.7')}?`, choices: [m('0.65'), m('0.56'), m('0.075'), m('0.71')], hint: `${c.g('כתוב', 'כתבי')} ${m('0.60')} ו-${m('0.70')}.`, solution: [m('0.60 &lt; 0.65 &lt; 0.70')] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['pick', 'pick', 'mid', 'line', 'tf', 'story', 'story', 'story']
        : level === 2 ? ['pick', 'mid', 'line', 'count', 'tf', 'order', 'story', 'story', 'story', 'story']
        : ['pick', 'mid', 'count', 'tf', 'order', 'line', 'story', 'story', 'story', 'story'];
      const kind = c.pick(kinds);
      const padOne = (v, q) => (T(v) === TK(v, q) ? m(T(v)) : m(T(v) + ' = ' + TK(v, q)));
      const padH = (P) => `${padOne(P.A, qOf(P.f))} ו-${padOne(P.B, qOf(P.f))}`;
      switch (kind) {
        case 'pick': {
          const P = btPair(c, level), x = P.A + P.f * c.rnd(1, (P.B - P.A) / P.f - 1);
          const wrong = c.shuffle(outside(c, P, x)).map(T);
          return {
            type: 'choice', answer: 0, prompt: `איזה מספר נמצא בין ${m(T(P.A))} ל-${m(T(P.B))}?`,
            choices: opts(T(x), wrong),
            hint: `${c.g('הוסף', 'הוסיפי')} אפס בסוף כל מספר, כך שלשניהם יהיו ${digs(qOf(P.f))} אחרי הנקודה.`,
            solution: [padH(P), m(TK(P.A, qOf(P.f)) + ' &lt; ' + T(x) + ' &lt; ' + TK(P.B, qOf(P.f))) + ' ✔'],
          };
        }
        case 'mid': {
          const w = c.rnd(0, 9) * 1000;
          const A = level === 1 ? w + c.rnd(1, 7) * 100 : level === 2 ? w + c.rnd(1, 8) * 100 : w + clean(c, 11, 89) * 10;
          const gap = level === 1 ? 200 : level === 2 ? 100 : 10, B = A + gap, M = A + gap / 2, q = plc(M);
          return {
            type: 'number', decimal: true, answer: TV(M),
            prompt: `איזה מספר נמצא ${b('בדיוק באמצע')} בין ${m(T(A))} ל-${m(T(B))}?`,
            hint: level === 1 ? `${c.g('ספור', 'ספרי')} את העשיריות מ-${m(T(A))} עד ${m(T(B))}.` : `${c.g('הוסף', 'הוסיפי')} אפס בסוף כל מספר: ${m(TK(A, q))} ו-${m(TK(B, q))}.`,
            solution: [level === 1 ? `בין ${m(T(A))} ל-${m(T(B))} יש 2 עשיריות.` : `${m(TK(A, q))} ו-${m(TK(B, q))}`, `האמצע: ${m(T(M))}`, `בדיקה: ${m(T(M) + ' − ' + T(A) + ' = ' + T(gap / 2))} וגם ${m(T(B) + ' − ' + T(M) + ' = ' + T(gap / 2))} ✔`],
          };
        }
        case 'line': {
          const fine = level === 3, w = c.rnd(0, 5) * 1000;
          const A = fine ? w + clean(c, 11, 89) * 10 : w + c.rnd(1, 8) * 100, f = fine ? 1 : 10, B = A + 10 * f;
          const midQ = c.chance(0.5), x = midQ ? A + 5 * f : A + f * c.rnd(1, 9);
          return {
            type: 'numberline', answer: TV(x),
            line: { min: TV(A), max: TV(B), step: f / 1000, labels: (v, i) => (i === 0 ? T(A) : i === 10 ? T(B) : null) },
            prompt: midQ ? `${c.g('סמן', 'סמני')} על הישר את המספר שנמצא בדיוק באמצע בין ${m(T(A))} ל-${m(T(B))}.` : `${c.g('סמן', 'סמני')} על הישר את ${m(T(x))}.`,
            hint: `הקטע בין ${m(T(A))} ל-${m(T(B))} מחולק ל-10 חלקים שווים. כל חלק הוא ${m(T(f))}.`,
            solution: [`כל סימון הוא ${m(T(f))}.`, midQ ? `האמצע הוא הסימון החמישי: ${m(T(x))}` : `${m(T(x))} נמצא ${HM.cnt((x - A) / f, 'סימון', 'סימונים')} אחרי ${m(T(A))}.`],
          };
        }
        case 'count': {
          const P = btPair(c, level), k = (P.B - P.A) / P.f - 1, q = qOf(P.f);
          const list = HM.range(1, k).map((i) => T(P.A + i * P.f));
          return {
            type: 'number', answer: k,
            prompt: `כמה מספרים עם ${digs(q)} אחרי הנקודה נמצאים בין ${m(T(P.A))} ל-${m(T(P.B))}? (בלי שני המספרים האלה עצמם)`,
            hint: `${c.g('כתוב', 'כתבי')} את שני המספרים עם ${digs(q)} אחרי הנקודה, ${c.g('וספור', 'וספרי')} מה ביניהם.`,
            solution: [padH(P), `המספרים שביניהם: ${m(list.join(', '))}`, `יש ${HM.cnt(k, 'מספר', 'מספרים')}.`],
          };
        }
        case 'tf': {
          const P = btPair(c, level), mid = (P.A + P.B) / 2;
          if (level > 1 && c.chance(0.25)) {
            return {
              type: 'tf', answer: false, prompt: `נכון או לא נכון?<br>בין ${m(T(P.A))} ל-${m(T(P.B))} אין אף מספר.`,
              hint: `${c.g('הוסף', 'הוסיפי')} ספרה נוספת אחרי הנקודה.`,
              solution: [`יש! למשל ${m(T(mid))}. בין כל שני מספרים שונים יש עוד אין-סוף מספרים.`, 'הטענה לא נכונה.'],
            };
          }
          const cands = [mid, P.A + P.f * c.rnd(1, (P.B - P.A) / P.f - 1)].concat(outside(c, P, mid));
          const x = c.chance(0.5) ? cands[c.rnd(0, 1)] : c.pick(cands.slice(2)), inside = x > P.A && x < P.B, q = Math.max(plc(P.A), plc(P.B), plc(x));
          return {
            type: 'tf', answer: inside, prompt: `נכון או לא נכון?<br>המספר ${m(T(x))} נמצא בין ${m(T(P.A))} ל-${m(T(P.B))}.`,
            hint: `${c.g('הוסף', 'הוסיפי')} אפסים כך שלכל המספרים יהיה אותו מספר ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [m(TK(P.A, q) + ' , ' + TK(x, q) + ' , ' + TK(P.B, q)), inside ? m(TK(P.A, q) + ' &lt; ' + TK(x, q) + ' &lt; ' + TK(P.B, q)) + ' ← הטענה נכונה.' : `${m(T(x))} לא נמצא ביניהם ← הטענה לא נכונה.`],
          };
        }
        case 'order': {
          const P = btPair(c, level), n = (P.B - P.A) / P.f, pool = HM.range(1, n - 1).map((k) => P.A + k * P.f);
          if (P.f === 10) pool.push(P.A + c.rnd(1, 9));
          const vals = [P.A, P.B].concat(c.sample(pool, 2));
          const items = c.shuffle(vals), ord = items.map((x, i) => i).sort((i, j) => items[i] - items[j]), q = Math.max(...items.map(plc));
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>מהקטן לגדול</b>:`, items: items.map((v) => m(T(v))), answer: ord,
            hint: `${c.g('הוסף', 'הוסיפי')} אפסים כך שלכל המספרים יהיו ${digs(q)} אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [ord.map((i) => m(TK(items[i], q))).join(' &lt; '), ord.map((i) => m(T(items[i]))).join(' , ')],
          };
        }
        case 'story': {
          const sc = c.scene(BT), me = c.me;
          let p1 = c.friend(), p2 = c.friend(), g = 0;
          while (p2.name === p1.name && g++ < 20) p2 = c.friend();
          const w = c.rnd(sc.w[0], sc.w[1]) * 1000;
          const P = level === 1 ? { A: w + c.rnd(1, 7) * 100, f: 10 } : level === 2 ? { A: w + c.rnd(1, 8) * 100, f: 10 } : { A: w + clean(c, 11, 89) * 10, f: 1 };
          P.B = P.A + (level === 1 ? 200 : P.f === 10 ? 100 : 10);
          if (P.A <= 0) P.A = 100;
          const x = level === 1 ? P.A + 100 : P.A + P.f * c.rnd(1, (P.B - P.A) / P.f - 1);
          const wrong = c.shuffle(outside(c, P, x)).filter((v) => v !== x).slice(0, 3);
          const vals = [x].concat(wrong);
          return {
            type: 'choice', answer: 0,
            prompt: `${sc.s(p1, T(P.A))}. ${sc.s(p2, T(P.B))}.<br>${sc.mid(me, p1, p2)}<br>${sc.q(me)}`,
            choices: [...new Set(vals.map((v) => `${m(T(v))} ${sc.u}`))],
            hint: `המספר צריך להיות גדול מ-${m(T(P.A))} וקטן מ-${m(T(P.B))}.`,
            solution: [padH(P), m(TK(P.A, qOf(P.f)) + ' &lt; ' + T(x) + ' &lt; ' + TK(P.B, qOf(P.f))), `התשובה: ${T(x)} ${sc.u}`],
          };
        }
      }
    },
  });

  /* ========== עיגול מספרים עשרוניים ========== */
  const r10 = (v) => Math.floor((v + 50) / 100) * 100; // עיגול לעשיריות (באלפיות)
  const tDig = (v) => Math.floor(v / 100) % 10; // ספרת העשיריות
  const hDig = (v) => Math.floor(v / 10) % 10; // ספרת המאיות
  const AG2 = AG.filter((x) => x !== 50);
  const priceNo50 = (c, lo, hi) => c.rnd(lo, hi) * 1000 + c.pick(AG2) * 10;
  const wholeLine = (x) => { const w = Math.floor(x / 1000); return V.numberLine({ min: w, max: w + 1, step: 0.1, labels: (v, i) => (i === 0 ? String(w) : i === 10 ? String(w + 1) : null), marks: [{ v: x / 1000, label: T(x) }], maxw: 360 }); };

  HM.lesson({
    id: 'dec-round',
    learn: (c) => [
      {
        title: 'בערך 8 שקלים',
        html: `${c.name} רואה בחנות מחברת ב-${m('7.80')} ₪ ${c.g('ואומר', 'ואומרת')}: "זה בערך 8 שקלים".<br>${c.g('הוא עיגל', 'היא עיגלה')} את המחיר ${b('למספר השלם הקרוב')}: על הישר רואים ש-7.8 קרוב יותר ל-8 מאשר ל-7.`,
        visual: V.numberLine({ min: 7, max: 8, step: 0.1, labels: (v, i) => (i === 0 ? '7' : i === 10 ? '8' : i === 5 ? '7.5' : null), marks: [{ v: 7.8, label: '7.8' }], maxw: 360 }),
      },
      {
        title: 'עיגול למספר שלם',
        html: `מסתכלים על ${b('ספרת העשיריות')}:<br>• 0, 1, 2, 3, 4 ← מעגלים ${b('למטה')}: ${m('3.4 ≈ 3')}<br>• 5, 6, 7, 8, 9 ← מעגלים ${b('למעלה')}: ${m('3.6 ≈ 4')}<br>• בדיוק באמצע? ${m('3.5 ≈ 4')} — מעגלים למעלה.`,
        visual: V.numberLine({ min: 3, max: 4, step: 0.1, labels: (v, i) => (i === 0 ? '3' : i === 10 ? '4' : i === 5 ? '3.5' : null), marks: [{ v: 3.4, label: '3.4' }, { v: 3.6, label: '3.6', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'עיגול לעשיריות',
        html: `מסתכלים על ${b('ספרת המאיות')}: ${m('2.43 ≈ 2.4')}, אבל ${m('2.47 ≈ 2.5')}.<br>כל הספרות שאחרי העשיריות נמחקות.`,
        visual: V.numberLine({ min: 2.4, max: 2.5, step: 0.01, labels: (v, i) => (i === 0 ? '2.4' : i === 10 ? '2.5' : i === 5 ? '2.45' : null), marks: [{ v: 2.43, label: '2.43' }, { v: 2.47, label: '2.47', cls: 'f-b' }], maxw: 360 }),
      },
      {
        title: 'דוגמה עם 9',
        html: `${c.g('עגל', 'עגלי')} את ${m('5.96')} לעשיריות.`,
        visual: V.numberLine({ min: 5.9, max: 6, step: 0.01, labels: (v, i) => (i === 0 ? '5.9' : i === 10 ? '6' : null), marks: [{ v: 5.96, label: '5.96' }], maxw: 360 }),
        steps: [
          `ספרת המאיות היא 6 ← מעגלים למעלה.`,
          `ספרת העשיריות (9) גדלה ב-1: 9 עשיריות ועוד עשירית הן 10 עשיריות — שלם אחד!`,
          `${m('5.96 ≈ 6.0')}, כלומר 6 ✔`,
        ],
      },
      {
        title: 'למה זה שימושי?',
        html: `עיגול עוזר ל${b('אומדן')} — חישוב מהיר בראש:<br>${m('4.8 + 3.1 ≈ 5 + 3 = 8')}<br>בקנייה: 19.90 ₪ ועוד 5.20 ₪ הם בערך ${m('20 + 5 = 25')} ₪.`,
        quiz: { type: 'number', answer: 7, prompt: `${c.g('עגל', 'עגלי')} את ${m('7.45')} למספר שלם.`, hint: 'ספרת העשיריות היא 4.', solution: [`ספרת העשיריות היא 4 ← מעגלים למטה: ${m('7.45 ≈ 7')}`] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['whole', 'whole', 'closer', 'tenths', 'roundLine', 'story', 'story', 'story']
        : level === 2 ? ['tenths', 'whole', 'which', 'tf', 'roundLine', 'story', 'story', 'storyShop1', 'storyShop1']
        : ['tenths', 'which', 'range', 'tf', 'whole', 'story', 'storyEst', 'storyEst', 'storyEst'];
      const kind = c.pick(kinds);
      const ruleW = `${c.g('הסתכל', 'הסתכלי')} על ספרת העשיריות: 0 עד 4 ← מעגלים למטה, 5 עד 9 ← מעגלים למעלה.`;
      const ruleT = `${c.g('הסתכל', 'הסתכלי')} על ספרת המאיות: 0 עד 4 ← מעגלים למטה, 5 עד 9 ← מעגלים למעלה.`;
      const solW = (x) => [`ספרת העשיריות היא ${tDig(x)} ← ${tDig(x) >= 5 ? 'מעגלים למעלה' : 'מעגלים למטה'}.`, m(T(x) + ' ≈ ' + HM.fmt(near(x)))];
      const solT = (x) => [`ספרת המאיות היא ${hDig(x)} ← ${hDig(x) >= 5 ? 'ספרת העשיריות גדלה ב-1' : 'ספרת העשיריות לא משתנה'}.`, `מוחקים את הספרות שאחרי העשיריות: ${m(T(x) + ' ≈ ' + TK(r10(x), 1))}`];
      switch (kind) {
        case 'whole': {
          const x = level === 1 ? c.rnd(0, 20) * 1000 + c.rnd(1, 9) * 100 : level === 2 ? hunds(c, 101, 9999) : clean(c, 1001, 199999);
          return {
            type: 'number', answer: near(x), prompt: `${c.g('עגל', 'עגלי')} את ${m(T(x))} למספר שלם.`,
            visual: level === 1 ? wholeLine(x) : undefined,
            hint: ruleW, solution: solW(x),
          };
        }
        case 'tenths': {
          let x;
          if (level === 3) x = c.chance(0.3) ? c.rnd(0, 30) * 1000 + 900 + c.rnd(50, 99) : clean(c, 1001, 99999);
          else x = level === 2 && c.chance(0.25) ? c.rnd(0, 9) * 1000 + 900 + c.rnd(5, 9) * 10 : hunds(c, 11, level === 1 ? 999 : 4999);
          const lo = Math.floor(x / 100);
          return {
            type: 'number', decimal: true, answer: TV(r10(x)), prompt: `${c.g('עגל', 'עגלי')} את ${m(T(x))} לעשיריות.`,
            visual: level === 1 ? V.numberLine({ min: lo / 10, max: (lo + 1) / 10, step: 0.01, labels: (v, i) => (i === 0 ? D(lo, 1) : i === 10 ? D(lo + 1, 1) : null), marks: [{ v: x / 1000, label: T(x) }], maxw: 360 }) : undefined,
            hint: ruleT, solution: solT(x),
          };
        }
        case 'closer': {
          const w = c.rnd(0, 9), t = c.pick([1, 2, 3, 4, 6, 7, 8, 9]), x = w * 1000 + t * 100, r = near(x);
          return {
            type: 'choice', answer: 0, prompt: `לאיזה מספר שלם קרוב יותר ${m(T(x))}?`,
            choices: [m(String(r)), m(String(r === w ? w + 1 : w))],
            visual: V.numberLine({ min: w, max: w + 1, step: 0.1, labels: (v, i) => (i === 0 ? String(w) : i === 10 ? String(w + 1) : i === 5 ? D(w * 10 + 5, 1) : null), marks: [{ v: x / 1000, label: T(x) }], maxw: 360 }),
            hint: `${c.g('הסתכל', 'הסתכלי')} על הישר: באיזה צד של ${m(D(w * 10 + 5, 1))} נמצא ${m(T(x))}?`,
            solution: [`${m(T(x))} נמצא ${t > 5 ? 'אחרי' : 'לפני'} האמצע (${m(D(w * 10 + 5, 1))}), ולכן הוא קרוב יותר ל-${r}.`],
          };
        }
        case 'roundLine': {
          const w = c.rnd(0, level === 1 ? 5 : 20), t = c.rnd(1, 8), h = c.rnd(1, 9), x = w * 1000 + t * 100 + h * 10, r = r10(x);
          return {
            type: 'numberline', answer: TV(r),
            line: { min: w, max: w + 1, step: 0.1, labels: (v, i) => (i === 0 ? String(w) : i === 10 ? String(w + 1) : null) },
            prompt: `${c.g('עגל', 'עגלי')} את ${m(T(x))} לעשיריות, ${c.g('וסמן', 'וסמני')} את התוצאה על הישר.`,
            hint: ruleT, solution: solT(x),
          };
        }
        case 'which': {
          if (c.chance(0.5)) {
            const N = c.rnd(2, level === 3 ? 60 : 20), base = N * 1000;
            const x = base + c.rnd(-5, 4) * 100 + c.rnd(1, 9) * 10;
            const wrong = [base + 500 + c.rnd(0, 4) * 100 + c.rnd(1, 9) * 10, base - 600 - c.rnd(0, 3) * 100 + c.rnd(1, 9) * 10, N < 10 ? N * 100 : base + 1500 + c.rnd(1, 9) * 10, base + 1000 + c.rnd(1, 4) * 100].filter((v) => v > 0 && near(v) !== N);
            return {
              type: 'choice', answer: 0, prompt: `איזה מספר מתעגל ל-${m(N)} (עיגול למספר שלם)?`,
              choices: opts(T(x), wrong.map(T)),
              hint: `${c.g('עגל', 'עגלי')} כל מספר בעזרת ספרת העשיריות, ${c.g('ובדוק', 'ובדקי')} מתי מקבלים ${N}.`,
              solution: [`מתעגלים ל-${N} המספרים מ-${m(D(N * 10 - 5, 1))} ועד ${m(D(N * 10 + 5, 1))} (בלי ${m(D(N * 10 + 5, 1))} עצמו).`, `התשובה: ${m(T(x))}`],
            };
          }
          const r = clean(c, 11, level === 3 ? 999 : 199) * 100;
          let off = c.rnd(-5, 4); if (off === 0) off = 3;
          const x = r + off * 10 + (level === 3 ? c.rnd(1, 9) : 0) * (off < 0 ? 1 : 1);
          const wrong = [r + 50 + c.rnd(0, 4) * 10, r - 60 - c.rnd(0, 3) * 10, r / 10, r + 100 + c.rnd(1, 4) * 10].filter((v) => v > 0 && r10(v) !== r);
          return {
            type: 'choice', answer: 0, prompt: `איזה מספר מתעגל ל-${m(TK(r, 1))} (עיגול לעשיריות)?`,
            choices: opts(T(x), wrong.map(T)),
            hint: `${c.g('עגל', 'עגלי')} כל מספר לעשיריות בעזרת ספרת המאיות.`,
            solution: [`מתעגלים ל-${TK(r, 1)} המספרים מ-${m(TK(r - 50, 2))} ועד ${m(TK(r + 50, 2))} (בלי ${m(TK(r + 50, 2))} עצמו).`, `התשובה: ${m(T(x))}`],
          };
        }
        case 'tf': {
          const toWhole = c.chance(0.5), x = level === 3 ? clean(c, 1001, 99999) : hunds(c, 101, 9999);
          const correct = toWhole ? near(x) * 1000 : r10(x), trunc = toWhole ? Math.floor(x / 1000) * 1000 : Math.floor(x / 100) * 100;
          const wrongV = correct === trunc ? trunc + (toWhole ? 1000 : 100) : trunc, right = c.chance(0.5), y = right ? correct : wrongV;
          const show = (v) => (toWhole ? HM.fmt(v / 1000) : TK(v, 1));
          return {
            type: 'tf', answer: right,
            prompt: `נכון או לא נכון?<br>${m(T(x))} מעוגל ${toWhole ? 'למספר שלם' : 'לעשיריות'} הוא ${m(show(y))}.`,
            hint: toWhole ? ruleW : ruleT,
            solution: (toWhole ? solW(x) : solT(x)).concat([right ? 'הטענה נכונה.' : 'הטענה לא נכונה.']),
          };
        }
        case 'range': {
          const toWhole = c.chance(0.5), big = c.chance(0.5);
          if (toWhole) {
            const N = c.rnd(2, 40), ans = big ? N * 1000 + 400 : N * 1000 - 500;
            return {
              type: 'number', decimal: true, answer: TV(ans),
              prompt: `מה המספר ה${big ? 'גדול' : 'קטן'} ביותר עם ספרה אחת אחרי הנקודה, שמתעגל ל-${m(N)} (עיגול למספר שלם)?`,
              hint: `${c.g('חשוב', 'חשבי')}: אילו מספרים מתעגלים ל-${N}? ${c.g('היעזר', 'היעזרי')} בישר המספרים.`,
              solution: [`מתעגלים ל-${N} המספרים מ-${m(D(N * 10 - 5, 1))} ועד ${m(D(N * 10 + 5, 1))} (בלי ${m(D(N * 10 + 5, 1))} עצמו).`, `התשובה: ${m(T(ans))}`],
            };
          }
          const r = clean(c, 11, 99) * 100, ans = big ? r + 40 : r - 50;
          return {
            type: 'number', decimal: true, answer: TV(ans),
            prompt: `מה המספר ה${big ? 'גדול' : 'קטן'} ביותר עם 2 ספרות אחרי הנקודה, שמתעגל ל-${m(TK(r, 1))} (עיגול לעשיריות)?`,
            hint: `${c.g('חשוב', 'חשבי')}: אילו מספרים מתעגלים ל-${TK(r, 1)}? ${c.g('היעזר', 'היעזרי')} בישר המספרים.`,
            solution: [`מתעגלים ל-${TK(r, 1)} המספרים מ-${m(TK(r - 50, 2))} ועד ${m(TK(r + 50, 2))} (בלי ${m(TK(r + 50, 2))} עצמו).`, `התשובה: ${m(T(ans))}`],
          };
        }
        case 'story': {
          const sc = c.scene(SC), p = pickP(c), toWhole = level === 1 || c.chance(0.5);
          const v = level === 1 ? c.rnd(1, 9) * 1000 + c.rnd(1, 9) * 100 : level === 2 ? hunds(c, 101, 999) : clean(c, 1001, 9999);
          return toWhole ? {
            type: 'number', unit: sc.u1, answer: near(v),
            prompt: `${sc.one(p, T(v))}.<br>בערך כמה ${sc.uw1}? ${c.g('עגל', 'עגלי')} למספר שלם.`,
            hint: ruleW, solution: solW(v),
          } : {
            type: 'number', decimal: true, unit: sc.u1, answer: TV(r10(v)),
            prompt: `${sc.one(p, T(v))}.<br>${c.g('עגל', 'עגלי')} את המספר לעשיריות.`,
            hint: ruleT, solution: solT(v),
          };
        }
        case 'storyShop1': {
          const sc = c.scene(SHOP), p = pickP(c), it = c.pick(sc.items), x = priceNo50(c, 3, 99);
          return {
            type: 'number', unit: '₪', answer: near(x),
            prompt: `${p.name} ${p.g('ראה', 'ראתה')} ${sc.place} ${it} ב-${NIS(x)} ₪.<br>בערך כמה שקלים זה? ${c.g('עגל', 'עגלי')} לשקל השלם.`,
            hint: ruleW, solution: [`ספרת העשיריות היא ${tDig(x)} ← ${tDig(x) >= 5 ? 'מעגלים למעלה' : 'מעגלים למטה'}.`, `${m(NIS(x) + ' ≈ ' + near(x))} ₪`],
          };
        }
        case 'storyEst': {
          const sc = c.scene(SHOP), p = pickP(c), its = c.sample(sc.items, 3), prs = its.map(() => priceNo50(c, 2, 40)), rs = prs.map(near), E = HM.sum(rs);
          return {
            type: 'number', unit: '₪', answer: E,
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${sc.place} ${buyList(its, prs)}.<br>${c.g('עגל', 'עגלי')} כל מחיר לשקל השלם ${c.g('וחשב', 'וחשבי')}: בערך כמה שקלים ${p.g('הוא שילם', 'היא שילמה')}?`,
            hint: `שני שלבים: קודם ${c.g('עגל', 'עגלי')} כל מחיר בנפרד, ואחר כך ${c.g('חבר', 'חברי')} את המספרים השלמים.`,
            solution: [prs.map((v, i) => m(NIS(v) + ' ≈ ' + rs[i])).join(' , '), m(rs.join(' + ') + ' = ' + E), `בערך ${E} ₪`],
          };
        }
      }
    },
  });

  /* ========== אחוזים ========== */
  // סיפורי "כמה זה P% מתוך N"
  const PC = [
    { tags: ['sport'], Ns: [20, 40, 60, 80, 100, 200], t: (p, N, P) => `בליגה של ${p.name} יש ${N} שחקנים. ${P}% מהם שוערים.`, q: () => 'כמה שוערים יש בליגה?' },
    { tags: ['animals'], Ns: [20, 40, 80, 100, 200], t: (p, N, P) => `במקלט לבעלי חיים ש${p.name} ${p.g('מתנדב', 'מתנדבת')} בו יש ${N} בעלי חיים. ${P}% מהם חתולים.`, q: () => 'כמה חתולים יש במקלט?' },
    { tags: ['space'], Ns: [20, 40, 60, 80, 100, 200], t: (p, N, P) => `למצפה הכוכבים הגיעו ${N} ילדים, ובהם ${p.name}. ${P}% מהם ראו בטלסקופ את שבתאי.`, q: () => 'כמה ילדים ראו את שבתאי?' },
    { tags: ['music'], Ns: [20, 40, 60, 80, 100, 200], t: (p, N, P) => `בפלייליסט של ${p.name} יש ${N} שירים. ${P}% מהם שירי רוק.`, q: () => 'כמה שירי רוק יש בפלייליסט?' },
    { tags: ['baking'], Ns: [20, 40, 60, 80, 100], t: (p, N, P) => `${p.name} ${p.g('אפה', 'אפתה')} ${N} עוגיות. ${P}% מהן עם שוקולד צ'יפס.`, q: (p) => `כמה עוגיות עם שוקולד צ'יפס ${p.g('אפה', 'אפתה')} ${p.name}?` },
    { tags: ['games'], Ns: [20, 40, 60, 80, 100, 200], t: (p, N, P) => `במשחק של ${p.name} יש ${N} שלבים. ${p.g('הוא סיים', 'היא סיימה')} ${P}% מהם.`, q: (p) => `כמה שלבים ${p.g('סיים', 'סיימה')} ${p.name}?` },
    { tags: ['art'], Ns: [20, 40, 60, 80], t: (p, N, P) => `בקופסת הצבעים של ${p.name} יש ${N} עפרונות. ${P}% מהם בגוונים של כחול.`, q: () => 'כמה עפרונות כחולים יש בקופסה?' },
    { tags: ['nature'], Ns: [40, 80, 100, 200, 400], t: (p, N, P) => `בשמורת הטבע ש${p.name} ${p.g('טייל', 'טיילה')} בה ספרו ${N} עצים. ${P}% מהם אלונים.`, q: () => 'כמה אלונים ספרו בשמורה?' },
    { tags: ['reading'], Ns: [40, 60, 80, 100, 200], t: (p, N, P) => `בספרייה של ${p.name} יש ${N} ספרים. ${P}% מהם ספרי הרפתקאות.`, q: () => 'כמה ספרי הרפתקאות יש בספרייה?' },
    { tags: ['tech'], Ns: [20, 40, 60, 80, 100], t: (p, N, P) => `${p.name} ${p.g('בנה', 'בנתה')} רובוט מ-${N} חלקים. ${P}% מהחלקים הם גלגלי שיניים.`, q: () => 'כמה גלגלי שיניים יש ברובוט?' },
    { tags: ['kpop'], Ns: [20, 40, 80, 100, 200], t: (p, N, P) => `במועדון המעריצים של להקת הקיי-פופ ש${p.name} ${p.g('חבר', 'חברה')} בו יש ${N} חברים. ${P}% מהם הגיעו להופעה.`, q: () => 'כמה חברי מועדון הגיעו להופעה?' },
    { tags: ['magic'], Ns: [40, 80, 100, 200, 400], t: (p, N, P) => `בבית הספר לקוסמים של ${p.name} לומדים ${N} תלמידים. ${P}% מהם שייכים לבית הדרקון, כמו ${p.name}.`, q: () => 'כמה תלמידים שייכים לבית הדרקון?' },
    { tags: ['squishy'], Ns: [20, 40, 60, 80, 100, 200], t: (p, N, P) => `${p.name} ${p.g('ספר', 'ספרה')} בחנות ${N} סקווישים. ${P}% מהם בצורת אוכל.`, q: () => 'כמה סקווישים בצורת אוכל יש בחנות?' },
  ];
  // סיפורי "חלק מהשלם" (P% ממשהו)
  const RS = [
    { tags: ['sport'], s: (p, P) => `${p.name} ${p.g('רץ', 'רצה')} ${P}% ממסלול הריצה` },
    { tags: ['animals'], s: (p, P) => `הכלב של ${p.name} אכל ${P}% מהאוכל שבקערה` },
    { tags: ['space'], s: (p, P) => `${p.name} ${p.g('בנה', 'בנתה')} ${P}% מדגם החללית` },
    { tags: ['music'], s: (p, P) => `${p.name} ${p.g('למד', 'למדה')} לנגן ${P}% מהשיר החדש` },
    { tags: ['baking'], s: (p, P) => `${p.name} ${p.g('קישט', 'קישטה')} ${P}% מהעוגה` },
    { tags: ['games'], s: (p, P) => `${p.name} ${p.g('סיים', 'סיימה')} ${P}% מהשלב במשחק` },
    { tags: ['art'], s: (p, P) => `${p.name} ${p.g('צבע', 'צבעה')} ${P}% מהציור` },
    { tags: ['nature'], s: (p, P) => `${p.name} ${p.g('הלך', 'הלכה')} ${P}% משביל הטיול` },
    { tags: ['reading'], s: (p, P) => `${p.name} ${p.g('קרא', 'קראה')} ${P}% מהספר` },
    { tags: ['tech'], s: (p, P) => `${p.name} ${p.g('הרכיב', 'הרכיבה')} ${P}% מהרובוט` },
    { tags: ['kpop'], s: (p, P) => `${p.name} ${p.g('למד', 'למדה')} ${P}% מהריקוד החדש של להקת הקיי-פופ` },
    { tags: ['magic'], s: (p, P) => `${p.name} ${p.g('למד', 'למדה')} ${P}% מהלחשים שבספר הקסמים` },
    { tags: ['squishy'], s: (p, P) => `${p.name} ${p.g('סידר', 'סידרה')} על המדף ${P}% מאוסף הסקווישים ${p.g('שלו', 'שלה')}` },
  ];
  function ofSteps(P, N) {
    const r = (N * P) / 100, f = HM.fmt;
    if (P === 50) return [`50% זה חצי: ${m(f(N) + ' : 2 = ' + f(r))}`];
    if (P === 25) return [`25% זה רבע: ${m(f(N) + ' : 4 = ' + f(r))}`];
    if (P === 75) return [`25% זה ${m(f(N) + ' : 4 = ' + f(N / 4))}`, `75% זה פי 3: ${m(f(N / 4) + ' × 3 = ' + f(r))}`];
    if (P === 10) return [`10% זה עשירית: ${m(f(N) + ' : 10 = ' + f(r))}`];
    if (P === 5) return [`10% זה ${m(f(N) + ' : 10 = ' + f(N / 10))}`, `5% זה חצי מזה: ${m(f(N / 10) + ' : 2 = ' + f(r))}`];
    if (P % 10 === 0) return [`10% זה ${m(f(N) + ' : 10 = ' + f(N / 10))}`, `${P}% זה פי ${P / 10}: ${m(f(N / 10) + ' × ' + P / 10 + ' = ' + f(r))}`];
    return [`1% זה ${m(f(N) + ' : 100 = ' + f(N / 100))}`, `${P}% זה פי ${P}: ${m(f(N / 100) + ' × ' + P + ' = ' + f(r))}`];
  }
  // בחירת P ו-N כך שהתוצאה שלם (ולשלבי הפתרון יש מספרים שלמים)
  function pickPN(c, level, Ns) {
    const Ps = level === 3 ? [5, 15, 30, 40, 60, 70, 80, 35, 75] : [50, 25, 10, 20, 75];
    const NN = Ns || (level === 3 ? [200, 400, 60, 120, 300, 500, 1000, 80] : [20, 40, 60, 80, 100, 200, 400]);
    const ok = [];
    Ps.forEach((P) => NN.forEach((N) => { const r = (N * P) / 100; if (Number.isInteger(r) && r >= 2 && ([15, 35].indexOf(P) < 0 || N % 100 === 0) && (P % 10 !== 0 || P === 50 || N % 10 === 0)) ok.push([P, N]); }));
    return ok.length ? c.pick(ok) : [50, 40];
  }
  const TFP = [
    { l: 1, s: `${m('50%')} זה חצי.`, a: true, why: m('50% = ' + F(50, 100) + ' = ' + F(1, 2)) },
    { l: 1, s: `${m('100%')} זה השלם כולו.`, a: true, why: m('100% = ' + F(100, 100) + ' = 1') },
    { l: 1, s: `${m('25% = ' + F(1, 25))}`, a: false, why: `${m('25% = ' + F(25, 100) + ' = ' + F(1, 4))}, ולא ${m(F(1, 25))}.` },
    { l: 1, s: `${m('10% = ' + F(1, 10))}`, a: true, why: m('10% = ' + F(10, 100) + ' = ' + F(1, 10)) },
    { l: 2, s: `${m(F(1, 5) + ' = 5%')}`, a: false, why: m(F(1, 5) + ' = ' + F(20, 100) + ' = 20%') },
    { l: 2, s: `${m('75% = ' + F(3, 4))}`, a: true, why: m('75% = ' + F(75, 100) + ' = ' + F(3, 4)) },
    { l: 2, s: `${m(F(1, 2) + ' = 2%')}`, a: false, why: m(F(1, 2) + ' = ' + F(50, 100) + ' = 50%') },
    { l: 2, s: `${m('20%')} מ-200 הם 40.`, a: true, why: `10% מ-200 הם ${m('200 : 10 = 20')}, ולכן 20% הם ${m('2 × 20 = 40')}.` },
    { l: 2, s: `${m('10%')} מ-200 הם 10.`, a: false, why: `10% מ-200 הם ${m('200 : 10 = 20')}.` },
    { l: 3, s: `${m('0.35 = 35%')}`, a: true, why: m('0.35 = ' + F(35, 100) + ' = 35%') },
    { l: 3, s: `${m('0.5 = 5%')}`, a: false, why: m('0.5 = 0.50 = ' + F(50, 100) + ' = 50%') },
    { l: 3, s: `${m('25%')} מ-80 שווים ל-${m('50%')} מ-40.`, a: true, why: `25% מ-80 הם ${m('80 : 4 = 20')}, ו-50% מ-40 הם ${m('40 : 2 = 20')}.` },
    { l: 3, s: `${m('5%')} מ-200 הם 5.`, a: false, why: `10% מ-200 הם 20, ולכן 5% הם 10.` },
  ];

  HM.lesson({
    id: 'dec-percent',
    learn: (c) => [
      {
        title: 'מה זה אחוז?',
        html: `הסוללה בטאבלט של ${c.name} מראה ${m('75%')}. מה זה אומר?<br>${b('אחוז')} פירושו ${HM.hl('מתוך מאה')}: ${m('75%')} הם 75 מתוך 100, כלומר ${m(F(75, 100))}.<br>בריבוע של 100 משבצות — 75 צבועות.`,
        visual: V.grid(75, { maxw: 220 }),
      },
      {
        title: 'אחוז אחד = מאית אחת',
        html: `כל משבצת היא ${m('1%')} — מאית אחת מהשלם.<br>${m('35% = ' + F(35, 100) + ' = 0.35')}<br>${m('7% = ' + F(7, 100) + ' = 0.07')}`,
        visual: V.grid(35, { maxw: 220 }),
      },
      {
        title: '100% הם השלם',
        html: `${m('100%')} הם ${b('כל השלם')}. כדאי לזכור בעל פה:`,
        visual: V.table(['אחוזים', 'שבר'], [['100%', 'השלם (1)'], ['50%', F(1, 2)], ['25%', F(1, 4)], ['75%', F(3, 4)], ['10%', F(1, 10)]]),
      },
      {
        title: 'אחוזים בצורות אחרות',
        html: `הפס מחולק ל-4 חלקים שווים, וכל חלק הוא ${m('100% : 4 = 25%')}.<br>3 חלקים צבועים ← ${m('3 × 25% = 75%')}.<br>ואם הפס מחולק ל-5 חלקים? כל חלק הוא ${m('20%')}.`,
        visual: V.bar(3, 4, { maxw: 300 }),
      },
      {
        title: 'כמה זה 30% מ-200?',
        html: `${c.g('בוא', 'בואי')} נחשב בעזרת 10%:`,
        visual: V.grid(30, { maxw: 200 }),
        steps: [
          `10% זה עשירית: ${m('200 : 10 = 20')}`,
          `30% זה פי 3: ${m('3 × 20 = 60')}`,
          `ולכן 30% מ-200 הם 60 ✔ (וגם: 50% זה חצי, 25% זה רבע)`,
        ],
      },
      {
        title: 'מלכודת נפוצה',
        html: `${c.g('זכור', 'זכרי')}: ${m('25%')} זה ${b('רבע')} (25 מתוך 100), ולא ${m(F(1, 25))}!<br>האחוז תמיד "מתוך 100".`,
        visual: V.grid(25, { maxw: 200 }),
        quiz: { type: 'tf', answer: true, prompt: `נכון או לא נכון? ${m('20% = ' + F(1, 5))}`, hint: `${m('20% = ' + F(20, 100))}. אפשר לצמצם?`, solution: [m('20% = ' + F(20, 100) + ' = ' + F(1, 5)) + ' — נכון.'] },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['gridRead', 'shade', 'shadeBar', 'barPct', 'tf', 'fracToPct', 'storyFrac', 'storyFrac', 'storyRest', 'storyRest']
        : level === 2 ? ['shade', 'gridRead', 'toFrac', 'fracToPct', 'of', 'pickPct', 'rest', 'tf', 'storyOf', 'storyOf', 'storyOf', 'storyOf', 'storyDisc1']
        : ['of', 'cmp', 'toFrac', 'tf', 'pickPct', 'shadeBar', 'storyOf', 'storyOf', 'storyDisc', 'storyDisc', 'storyRest2'];
      const kind = c.pick(kinds);
      const partSol = (n, d) => [`כל חלק הוא ${m('100% : ' + d + ' = ' + 100 / d + '%')}.`, `${HM.cnt(n, 'חלק', 'חלקים')}: ${m(n + ' × ' + 100 / d + '% = ' + (n * 100) / d + '%')}`];
      switch (kind) {
        case 'gridRead': {
          const k = level === 1 ? c.pick([10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 75]) : c.rnd(1, 99);
          return {
            type: 'number', unit: '%', answer: k, prompt: 'איזה אחוז מהריבוע צבוע?', visual: V.grid(k, { maxw: 240 }),
            hint: 'הריבוע מחולק ל-100 משבצות, וכל משבצת היא אחוז אחד. כל שורה היא 10%.',
            solution: [`צבועות ${k} משבצות מתוך 100.`, m(F(k, 100) + ' = ' + k + '%')],
          };
        }
        case 'shade': {
          const k = level === 1 ? c.rnd(1, 9) * 10 : c.chance(0.5) ? c.rnd(1, 19) * 5 : c.rnd(1, 99), tens = Math.floor(k / 10), ones = k % 10;
          return {
            type: 'shade', shape: 'grid', rows: 10, cols: 10, answer: k,
            prompt: `${c.g('צבע', 'צבעי')} ${m(k + '%')} מהריבוע.`,
            hint: 'כל משבצת היא 1%, וכל שורה של 10 משבצות היא 10%.',
            solution: [`${m(k + '%')} הם ${k} משבצות מתוך 100.`, [tens ? HM.cnt(tens, 'שורה שלמה', 'שורות שלמות', true) : '', ones ? HM.cnt(ones, 'משבצת', 'משבצות', true) : ''].filter(Boolean).join(' ועוד ') + '.'],
          };
        }
        case 'shadeBar': {
          const d = level === 1 ? c.pick([2, 4, 5, 10]) : c.pick([20, 4, 5, 10]), n = c.rnd(1, d - 1), P = (n * 100) / d;
          return {
            type: 'shade', shape: 'bar', parts: d, answer: n,
            prompt: `${c.g('צבע', 'צבעי')} ${m(P + '%')} מהפס.`,
            hint: `100% הם כל הפס. כמה אחוזים שווה כל חלק?`,
            solution: partSol(n, d),
          };
        }
        case 'barPct': {
          const d = c.pick([2, 4, 5, 10]), n = c.rnd(1, d - 1), pie = c.chance(0.4);
          return {
            type: 'number', unit: '%', answer: (n * 100) / d,
            prompt: `איזה אחוז מה${pie ? 'עיגול' : 'פס'} צבוע?`, visual: pie ? V.pie(n, d, { r: 64 }) : V.bar(n, d, { maxw: 300 }),
            hint: `100% הם כל ה${pie ? 'עיגול' : 'פס'}. ${c.g('חלק', 'חלקי')} 100% למספר החלקים.`,
            solution: partSol(n, d),
          };
        }
        case 'pickPct': {
          const d = c.pick([2, 4, 5, 10, 20]), n = c.rnd(1, d - 1), P = (n * 100) / d, pie = d <= 10 && c.chance(0.4);
          return {
            type: 'choice', answer: 0, prompt: `איזה אחוז מה${pie ? 'עיגול' : 'פס'} צבוע?`, visual: pie ? V.pie(n, d, { r: 64 }) : V.bar(n, d, { maxw: 300 }),
            choices: opts(P + '%', [n + '%', 100 - P + '%', n * 10 + '%', d + '%']),
            hint: `100% הם כל ה${pie ? 'עיגול' : 'פס'}. כמה אחוזים שווה כל חלק?`,
            solution: partSol(n, d),
          };
        }
        case 'fracToPct': {
          const d = level === 1 ? c.pick([2, 4, 10]) : c.pick([5, 20, 25, 50, 4]);
          let n = c.rnd(1, d - 1); while (HM.gcd(n, d) !== 1 && d !== 10) n = c.rnd(1, d - 1);
          const f = 100 / d;
          return {
            type: 'number', answer: n * f, prompt: `${c.g('השלם', 'השלימי')}:<br>${m(F(n, d) + ' = ' + HM.slot(0) + '%')}`,
            hint: `${c.g('הרחב', 'הרחיבי')} את השבר למכנה 100. המונה הוא מספר האחוזים.`,
            solution: [f > 1 ? m(F(n, d) + ' = ' + F(n * f, 100)) : m(F(n, d)), m(F(n * f, 100) + ' = ' + n * f + '%')],
          };
        }
        case 'toFrac': {
          const P = c.pick(level === 2 ? [50, 25, 75, 10, 20, 30, 40, 60, 70, 80, 90] : [5, 15, 35, 45, 2, 4, 12, 64, 85, 95]), g = HM.gcd(P, 100);
          return {
            type: 'fraction', accept: 'simplest', answer: { n: P / g, d: 100 / g },
            prompt: `${c.g('כתוב', 'כתבי')} את ${m(P + '%')} כשבר מצומצם.`,
            hint: `${m(P + '%')} הם ${P} מתוך 100. ${c.g('כתוב', 'כתבי')} שבר עם מכנה 100 ${c.g('וצמצם', 'וצמצמי')}.`,
            solution: [m(P + '% = ' + F(P, 100)), `נצמצם ב-${g}: ${m(F(P, 100) + ' = ' + F(P / g, 100 / g))}`],
          };
        }
        case 'rest': {
          const k = c.rnd(5, 95);
          return {
            type: 'number', unit: '%', answer: 100 - k, prompt: `${m(k + '%')} מהריבוע צבועים. כמה אחוזים מהריבוע <b>לא</b> צבועים?`, visual: V.grid(k, { maxw: 220 }),
            hint: 'כל הריבוע הוא 100%.',
            solution: [m('100% − ' + k + '% = ' + (100 - k) + '%')],
          };
        }
        case 'of': {
          const [P, N] = pickPN(c, level);
          return {
            type: 'number', answer: (N * P) / 100, prompt: `כמה זה ${m(P + '%')} מ-${HM.fmt(N)}?`,
            hint: P === 50 ? '50% זה חצי.' : P === 25 || P === 75 ? '25% זה רבע.' : `${c.g('התחל', 'התחילי')} מ-10%: ${c.g('חלק', 'חלקי')} ב-10.`,
            solution: ofSteps(P, N),
          };
        }
        case 'tf': {
          const pool = TFP.filter((x) => (level === 1 ? x.l === 1 : level === 2 ? x.l <= 2 : x.l >= 2));
          const st = c.pick(pool);
          return {
            type: 'tf', answer: st.a, prompt: `נכון או לא נכון?<br>${st.s}`,
            hint: 'אחוז פירושו "מתוך 100". ' + c.g('כתוב', 'כתבי') + ' שבר עם מכנה 100.',
            solution: [st.why, st.a ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
        case 'cmp': {
          const [n, d, h] = c.pick(NICE);
          if (c.chance(0.5)) {
            let P = c.pick([h, h + 5, h - 5, h + 10, n < 10 && n * 10 !== h ? n * 10 : h - 10]); if (P <= 0) P = h + 5;
            const fl = c.chance(0.5), lv = fl ? P : h, rv = fl ? h : P, s = sign(lv, rv);
            return {
              type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
              left: fl ? P + '%' : F(n, d), right: fl ? F(n, d) : P + '%', lv: lv / 100, rv: rv / 100, answer: s,
              hint: `${c.g('הפוך', 'הפכי')} את השבר לאחוזים: ${c.g('הרחב', 'הרחיבי')} אותו למכנה 100.`,
              solution: [m(F(n, d) + ' = ' + F(h, 100) + ' = ' + h + '%'), m(lv + '% ' + signH(s) + ' ' + rv + '%')],
            };
          }
          let x = h + c.pick([0, 5, -5, 10]); if (x <= 0) x = h + 5;
          const P = c.chance(0.5) ? h : x * 10 < 100 ? x * 10 : h, fl = c.chance(0.5), lv = fl ? P : x, rv = fl ? x : P, s = sign(lv, rv);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: fl ? P + '%' : D(x, 2), right: fl ? D(x, 2) : P + '%', lv: lv / 100, rv: rv / 100, answer: s,
            hint: `${c.g('כתוב', 'כתבי')} את המספר העשרוני במאיות: כמה מאיות יש בו?`,
            solution: [m(D(x, 2) + ' = ' + F(x, 100) + ' = ' + x + '%'), m(lv + '% ' + signH(s) + ' ' + rv + '%')],
          };
        }
        case 'storyOf': {
          const sc = c.scene(PC), p = pickP(c), [P, N] = pickPN(c, level, sc.Ns.concat(level === 3 ? [] : []));
          return {
            type: 'number', answer: (N * P) / 100,
            prompt: `${sc.t(p, N, P)}<br>${sc.q(p)}`,
            hint: P === 50 ? '50% זה חצי.' : P === 25 || P === 75 ? '25% זה רבע.' : `${c.g('התחל', 'התחילי')} מ-10%: ${c.g('חלק', 'חלקי')} ב-10.`,
            solution: ofSteps(P, N).concat([`התשובה: ${HM.fmt((N * P) / 100)}`]),
          };
        }
        case 'storyDisc1':
        case 'storyDisc': {
          const sc = c.scene(SHOP), p = pickP(c), it = sc.big[0];
          const P = c.pick(kind === 'storyDisc1' ? [10, 50, 25] : [10, 20, 25, 50, 30, 75]);
          const Ns = [40, 60, 80, 120, 200, 240, 300, 400].filter((N) => N <= sc.big[1] && Number.isInteger((N * P) / 100) && (P % 10 !== 0 || P === 50 || N % 10 === 0) && (P !== 25 && P !== 75 || N % 4 === 0));
          const N = c.pick(Ns), off = (N * P) / 100, fin = N - off;
          return {
            type: 'number', unit: '₪', answer: kind === 'storyDisc1' ? off : fin,
            prompt: `${p.name} רוצה לקנות ${sc.place} ${it} שעולה ${N} ₪. היום יש הנחה של ${m(P + '%')} על כל המוצרים.<br>${kind === 'storyDisc1' ? `כמה שקלים ${p.g('יחסוך', 'תחסוך')} ${p.name} בזכות ההנחה?` : `כמה ${p.g('ישלם', 'תשלם')} ${p.name} אחרי ההנחה?`}`,
            hint: kind === 'storyDisc1' ? `ההנחה היא ${P}% מ-${N}.` : `שני שלבים: קודם ${c.g('חשב', 'חשבי')} כמה שקלים ההנחה, ואחר כך ${c.g('חסר', 'חסרי')} אותה מהמחיר.`,
            solution: kind === 'storyDisc1' ? ofSteps(P, N).concat([`ההנחה: ${off} ₪`]) : ofSteps(P, N).concat([`ההנחה היא ${off} ₪, ולכן המחיר: ${m(N + ' − ' + off + ' = ' + fin)} ₪`]),
          };
        }
        case 'storyFrac': {
          const sc = c.scene(RS), p = pickP(c), P = c.pick([50, 25, 75, 10, 20]), g = HM.gcd(P, 100);
          return {
            type: 'fraction', accept: 'simplest', answer: { n: P / g, d: 100 / g },
            prompt: `${sc.s(p, P)}.<br>איזה חלק זה? ${c.g('כתוב', 'כתבי')} את ${m(P + '%')} כשבר מצומצם.`,
            hint: `${m(P + '%')} הם ${P} מתוך 100.`,
            solution: [m(P + '% = ' + F(P, 100) + ' = ' + F(P / g, 100 / g))],
          };
        }
        case 'storyRest': {
          const sc = c.scene(RS), p = pickP(c), P = c.rnd(1, 9) * 10 + (c.chance(0.3) ? 5 : 0);
          return {
            type: 'number', unit: '%', answer: 100 - P,
            prompt: `${sc.s(p, P)}.<br>כמה אחוזים עוד נשארו?`,
            hint: 'השלם כולו הוא 100%.',
            solution: [m('100% − ' + P + '% = ' + (100 - P) + '%')],
          };
        }
        case 'storyRest2': {
          const sc = c.scene(RS), p = pickP(c), P1 = c.rnd(2, 6) * 5 + 10, P2 = c.rnd(2, 8) * 5, R = 100 - P1 - P2;
          return {
            type: 'number', unit: '%', answer: R,
            prompt: `ביום ראשון ${sc.s(p, P1)}, וביום שני עוד ${m(P2 + '%')}.<br>כמה אחוזים עוד נשארו?`,
            hint: `שני שלבים: כמה אחוזים כבר עשו בסך הכול? ואז — כמה חסר עד 100%?`,
            solution: [m(P1 + '% + ' + P2 + '% = ' + (P1 + P2) + '%'), m('100% − ' + (P1 + P2) + '% = ' + R + '%')],
          };
        }
      }
    },
  });
})(HM);
