/* חשבוניה — ממלכת השברים, חלק ב׳: השוואה, חיבור וחיסור (וכפל שבר במספר שלם) */
(function (HM) {
  'use strict';
  const V = HM.viz;
  const { frac: F, m, b } = HM;
  const gcd = HM.gcd, lcm = HM.lcm;

  /* ---------- עזרי שברים (ערך = מונה כולל N ומכנה d) ---------- */
  const red = (n, d) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
  // שבר, מספר מעורב או שלם — בלי צמצום
  const MX = (N, d) => { const w = Math.floor(N / d), r = N % d; return r ? (w ? HM.mixed(w, r, d) : F(r, d)) : String(w); };
  // אחרי צמצום
  const RX = (N, d) => { const [a, bb] = red(N, d); return MX(a, bb); };
  // מספר מעורב w n/d
  const WN = (w, n, d) => (n ? (w ? HM.mixed(w, n, d) : F(n, d)) : String(w));
  // שדות תשובה לשאלת fraction: מצומצמת, ומעורבת כשגדולה מ-1
  const ans = (N, d) => { const [a, bb] = red(N, d); return a >= bb ? { mixed: true, answer: { w: Math.floor(a / bb), n: a % bb, d: bb } } : { answer: { n: a, d: bb } }; };
  // שורת סיום: מראה צמצום או הפיכה למעורב כשצריך
  const fin = (N, d, improper) => { const raw = improper && N > d ? F(N, d) : MX(N, d), r = RX(N, d); return 'התשובה: ' + m(raw === r ? r : raw + ' = ' + r); };
  // הרחבה למכנה D
  const ex = (n, d, D) => (D === d ? m(F(n, d)) : m(F(n, d) + ' = ' + F((n * D) / d, D)));
  const sgn = (a1, d1, a2, d2) => { const x = a1 * d2, y = a2 * d1; return x < y ? '<' : x > y ? '>' : '='; };
  const ent = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  // זוג מכנים שאף אחד מהם אינו כפולה של האחר
  const coPair = (c, list) => { for (let t = 0; t < 60; t++) { const [x, y] = c.sample(list, 2); if (x % y && y % x) return [x, y]; } return [3, 4]; };
  // זוג מכנים שאחד מהם כפולה של האחר: [d, d·k]
  const multPair = (c, maxD) => { for (let t = 0; t < 60; t++) { const d = c.pick([2, 3, 4, 5, 6]), k = c.pick([2, 2, 3, 4]); if (d * k <= (maxD || 12)) return [d, d * k]; } return [3, 6]; };
  // מונה שהשבר איתו מצומצם
  const nRed = (c, d) => { for (let t = 0; t < 40; t++) { const n = c.rnd(1, d - 1); if (gcd(n, d) === 1) return n; } return 1; };
  // בחירה מרובה לפי ערך: הראשונה נכונה, בלי ערכים כפולים
  function vChoices(list, fmt) {
    const seen = {}, out = [];
    list.forEach((x) => {
      if (!x) return;
      const [N, d] = x;
      if (!(d > 0) || !(N >= 0) || N % 1 || d % 1) return;
      const k = red(N, d).join('/');
      if (seen[k]) return;
      seen[k] = 1;
      out.push(fmt ? fmt(N, d) : m(MX(N, d)));
    });
    return out;
  }
  // ישר מספרים עם קפיצות; path = מונים (ביחידות של 1/d) לאורך הדרך
  function jumpLine(d, max, path, o) {
    o = o || {};
    const last = path[path.length - 1], on = {};
    path.forEach((x) => (on[x] = 1));
    return V.numberLine({
      min: 0, max, den: d, w: o.w || 520,
      labels: (v, i) => (o.hide && i === last ? '?' : i % d === 0 ? String(i / d) : on[i] && !o.wholeOnly ? { n: i, d } : null),
      jumps: path.slice(1).map((x, k) => ({ from: path[k] / d, to: x / d })),
      marks: o.hide ? [] : [{ v: last / d, cls: 'f-c' }],
    });
  }
  const cmpQ = (c) => `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;

  /* ---------- תרחישים: כמות עם יחידה ---------- */
  const KM = ['ק"מ', 'ק"מ'], KG = ['ק"ג', 'ק"ג'], LT = ['ליטר', 'ליטר'], MT = ['מטר', 'מטר'], HR = ['שעה', 'שעות'];
  // כמות N/d עם יחידה מתאימה (שעה/שעות)
  const Q = (u, N, d) => `${m(MX(N, d))} ${N < d ? u[0] : u[1]}`;
  const QTY = [
    { tags: ['sport'], u: KM,
      tot: (x, A, B) => `${x.name} ${x.g('רץ', 'רצה')} ${A} בבוקר ועוד ${B} אחר הצהריים.`, qTot: (x) => `כמה ק"מ ${x.g('רץ', 'רצה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `מסלול הריצה ארוך ${A}. ${x.name} ${x.g('רץ', 'רצה')} כבר ${B}.`, qLeft: (x) => `כמה ק"מ ${x.g('נשארו לו', 'נשארו לה')} לרוץ?`,
      cmp: (x, y, A, B) => `${x.name} ${x.g('רץ', 'רצה')} ${A}, ו${y.name} ${y.g('רץ', 'רצה')} ${B}.`, qMore: (x) => `מי ${x.g('רץ', 'רצה')} יותר?`,
      qDiff: (x, y) => `בכמה ק"מ ${x.name} ${x.g('רץ', 'רצה')} יותר מ${y.name}?` },
    { tags: ['nature'], u: KM,
      tot: (x, A, B) => `בטיול ${x.name} ${x.g('הלך', 'הלכה')} ${A} עד המעיין ועוד ${B} עד התצפית.`, qTot: (x) => `כמה ק"מ ${x.g('הלך', 'הלכה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `שביל הטיול ארוך ${A}. ${x.name} ${x.g('הלך', 'הלכה')} כבר ${B}.`, qLeft: (x) => `כמה ק"מ ${x.g('נשארו לו', 'נשארו לה')} ללכת?`,
      cmp: (x, y, A, B) => `בטיול ${x.name} ${x.g('הלך', 'הלכה')} ${A}, ו${y.name} ${y.g('הלך', 'הלכה')} ${B}.`, qMore: (x) => `מי ${x.g('הלך', 'הלכה')} יותר?`,
      qDiff: (x, y) => `בכמה ק"מ ${x.name} ${x.g('הלך', 'הלכה')} יותר מ${y.name}?` },
    { tags: ['baking'], u: KG,
      tot: (x, A, B) => `${x.name} ${x.g('אפה', 'אפתה')} ${A} עוגיות שוקולד ועוד ${B} עוגיות וניל.`, qTot: (x) => `כמה ק"ג עוגיות ${x.g('אפה', 'אפתה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `בשקית היו ${A} קמח. ${x.name} ${x.g('השתמש', 'השתמשה')} ב-${B} לעוגה.`, qLeft: () => 'כמה ק"ג קמח נשארו בשקית?',
      cmp: (x, y, A, B) => `${x.name} ${x.g('אפה', 'אפתה')} ${A} עוגיות, ו${y.name} ${y.g('אפה', 'אפתה')} ${B} עוגיות.`, qMore: (x) => `מי ${x.g('אפה', 'אפתה')} יותר עוגיות?`,
      qDiff: (x, y) => `בכמה ק"ג ${x.name} ${x.g('אפה', 'אפתה')} יותר מ${y.name}?` },
    { tags: ['animals'], u: KG,
      tot: (x, A, B) => `הכלב של ${x.name} אכל ${A} מזון בשבוע הראשון ועוד ${B} בשבוע השני.`, qTot: () => 'כמה ק"ג מזון אכל הכלב בשני השבועות?',
      left: (x, A, B) => `בשק היו ${A} מזון לחתול של ${x.name}. החתול אכל ${B}.`, qLeft: () => 'כמה ק"ג מזון נשארו בשק?',
      cmp: (x, y, A, B) => `הכלב של ${x.name} אכל ${A} מזון, והכלב של ${y.name} אכל ${B}.`, qMore: () => 'הכלב של מי אכל יותר?',
      qDiff: (x, y) => `בכמה ק"ג הכלב של ${x.name} אכל יותר מהכלב של ${y.name}?` },
    { tags: ['space'], u: LT,
      tot: (x, A, B) => `${x.name} ${x.g('בנה', 'בנתה')} טיל מים. ${x.g('הוא', 'היא')} ${x.g('שפך', 'שפכה')} לבקבוק ${A} מים ואחר כך עוד ${B}.`, qTot: () => 'כמה ליטר מים יש בבקבוק?',
      left: (x, A, B) => `במיכל של ${x.name} היו ${A} מים לשיגור טילי מים. ${x.g('הוא', 'היא')} ${x.g('השתמש', 'השתמשה')} ב-${B}.`, qLeft: () => 'כמה ליטר מים נשארו במיכל?',
      cmp: (x, y, A, B) => `${x.name} ${x.g('מילא', 'מילאה')} טיל מים ב-${A} מים, ו${y.name} ${y.g('מילא', 'מילאה')} טיל ב-${B}.`, qMore: (x) => `מי ${x.g('מילא', 'מילאה')} יותר מים?`,
      qDiff: (x, y) => `בכמה ליטר ${x.name} ${x.g('מילא', 'מילאה')} יותר מ${y.name}?` },
    { tags: ['music'], u: HR,
      tot: (x, A, B) => `${x.name} ${x.g('התאמן', 'התאמנה')} בגיטרה ${A} ביום ראשון ועוד ${B} ביום שני.`, qTot: (x) => `כמה שעות ${x.g('התאמן', 'התאמנה')} ${x.name} בשני הימים?`,
      left: (x, A, B) => `${x.name} ${x.g('תכנן', 'תכננה')} להתאמן בפסנתר ${A} השבוע. עד עכשיו ${x.g('הוא', 'היא')} ${x.g('התאמן', 'התאמנה')} ${B}.`, qLeft: (x) => `כמה שעות ${x.g('נשארו לו', 'נשארו לה')} להתאמן?`,
      cmp: (x, y, A, B) => `${x.name} ${x.g('התאמן', 'התאמנה')} בגיטרה ${A}, ו${y.name} ${y.g('התאמן', 'התאמנה')} ${B}.`, qMore: (x) => `מי ${x.g('התאמן', 'התאמנה')} יותר זמן?`,
      qDiff: (x, y) => `בכמה שעות ${x.name} ${x.g('התאמן', 'התאמנה')} יותר מ${y.name}?` },
    { tags: ['games'], u: HR,
      tot: (x, A, B) => `${x.name} ${x.g('שיחק', 'שיחקה')} במשחק מחשב ${A} בשבת ועוד ${B} ביום ראשון.`, qTot: (x) => `כמה שעות ${x.g('שיחק', 'שיחקה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `ההורים של ${x.name} ${x.g('הרשו לו', 'הרשו לה')} לשחק במחשב ${A} בסוף השבוע. ${x.g('הוא', 'היא')} כבר ${x.g('שיחק', 'שיחקה')} ${B}.`, qLeft: (x) => `כמה שעות עוד ${x.g('מותר לו', 'מותר לה')} לשחק?`,
      cmp: (x, y, A, B) => `${x.name} ${x.g('שיחק', 'שיחקה')} במחשב ${A}, ו${y.name} ${y.g('שיחק', 'שיחקה')} ${B}.`, qMore: (x) => `מי ${x.g('שיחק', 'שיחקה')} יותר זמן?`,
      qDiff: (x, y) => `בכמה שעות ${x.name} ${x.g('שיחק', 'שיחקה')} יותר מ${y.name}?` },
    { tags: ['art'], u: MT,
      tot: (x, A, B) => `לעבודת יצירה ${x.name} ${x.g('קנה', 'קנתה')} ${A} סרט אדום ועוד ${B} סרט כחול.`, qTot: (x) => `כמה מטר סרט ${x.g('קנה', 'קנתה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `ל${x.name} היה גליל בד באורך ${A}. ${x.g('הוא', 'היא')} ${x.g('גזר', 'גזרה')} ממנו ${B} לתלבושת.`, qLeft: () => 'כמה מטר בד נשארו בגליל?',
      cmp: (x, y, A, B) => `${x.name} ${x.g('קנה', 'קנתה')} ${A} סרט, ו${y.name} ${y.g('קנה', 'קנתה')} ${B} סרט.`, qMore: (x) => `מי ${x.g('קנה', 'קנתה')} יותר סרט?`,
      qDiff: (x, y) => `בכמה מטר ${x.name} ${x.g('קנה', 'קנתה')} יותר מ${y.name}?` },
    { tags: ['reading'], u: HR,
      tot: (x, A, B) => `${x.name} ${x.g('קרא', 'קראה')} ספר הרפתקאות ${A} ביום רביעי ועוד ${B} ביום חמישי.`, qTot: (x) => `כמה שעות ${x.g('קרא', 'קראה')} ${x.name} בשני הימים?`,
      left: (x, A, B) => `${x.name} ${x.g('החליט', 'החליטה')} לקרוא ${A} בחופשה. ${x.g('הוא', 'היא')} כבר ${x.g('קרא', 'קראה')} ${B}.`, qLeft: (x) => `כמה שעות קריאה ${x.g('נשארו לו', 'נשארו לה')}?`,
      cmp: (x, y, A, B) => `${x.name} ${x.g('קרא', 'קראה')} ${A}, ו${y.name} ${y.g('קרא', 'קראה')} ${B}.`, qMore: (x) => `מי ${x.g('קרא', 'קראה')} יותר זמן?`,
      qDiff: (x, y) => `בכמה שעות ${x.name} ${x.g('קרא', 'קראה')} יותר מ${y.name}?` },
    { tags: ['tech'], u: MT,
      tot: (x, A, B) => `${x.name} ${x.g('חיבר', 'חיברה')} לרובוט כבל באורך ${A} וכבל נוסף באורך ${B}.`, qTot: () => 'מה האורך של שני הכבלים יחד, במטרים?',
      left: (x, A, B) => `לרובוט של ${x.name} היה כבל באורך ${A}. ${x.name} ${x.g('חתך', 'חתכה')} ממנו ${B}.`, qLeft: () => 'מה אורך הכבל שנשאר, במטרים?',
      cmp: (x, y, A, B) => `הכבל של ${x.name} ארוך ${A}, והכבל של ${y.name} ארוך ${B}.`, qMore: () => 'של מי הכבל ארוך יותר?',
      qDiff: (x, y) => `בכמה מטר הכבל של ${x.name} ארוך יותר מהכבל של ${y.name}?` },
    { tags: ['kpop'], u: HR,
      tot: (x, A, B) => `${x.name} ${x.g('תרגל', 'תרגלה')} ריקוד של להקת הקיי-פופ ${A} ביום ראשון ועוד ${B} ביום שני.`, qTot: (x) => `כמה שעות ${x.g('תרגל', 'תרגלה')} ${x.name} בשני הימים?`,
      left: (x, A, B) => `${x.name} רוצה ללמוד ריקוד קיי-פופ חדש ב-${A} של תרגול. ${x.g('הוא', 'היא')} כבר ${x.g('תרגל', 'תרגלה')} ${B}.`, qLeft: (x) => `כמה שעות תרגול ${x.g('נשארו לו', 'נשארו לה')}?`,
      cmp: (x, y, A, B) => `${x.name} ${x.g('תרגל', 'תרגלה')} ריקוד קיי-פופ ${A}, ו${y.name} ${y.g('תרגל', 'תרגלה')} ${B}.`, qMore: (x) => `מי ${x.g('תרגל', 'תרגלה')} יותר זמן?`,
      qDiff: (x, y) => `בכמה שעות ${x.name} ${x.g('תרגל', 'תרגלה')} יותר מ${y.name}?` },
    { tags: ['magic'], u: LT,
      tot: (x, A, B) => `בשיעור שיקויים בבית הספר לקוסמים ${x.name} ${x.g('מזג', 'מזגה')} לקדרה ${A} מיץ דרקון ועוד ${B} מי ירח.`, qTot: () => 'כמה ליטר שיקוי יש בקדרה?',
      left: (x, A, B) => `בבקבוק של ${x.name} היו ${A} שיקוי קסם. ${x.g('הוא', 'היא')} ${x.g('מזג', 'מזגה')} לקדרה ${B}.`, qLeft: () => 'כמה ליטר שיקוי נשארו בבקבוק?',
      cmp: (x, y, A, B) => `בשיעור שיקויים ${x.name} ${x.g('מזג', 'מזגה')} לקדרה ${A} שיקוי, ו${y.name} ${y.g('מזג', 'מזגה')} ${B}.`, qMore: (x) => `מי ${x.g('מזג', 'מזגה')} יותר שיקוי?`,
      qDiff: (x, y) => `בכמה ליטר ${x.name} ${x.g('מזג', 'מזגה')} יותר מ${y.name}?` },
    { tags: ['magic'], u: KM,
      tot: (x, A, B) => `באימון תעופה על מטאטא ${x.name} ${x.g('טס', 'טסה')} ${A} עד המגדל ועוד ${B} עד האגם.`, qTot: (x) => `כמה ק"מ ${x.g('טס', 'טסה')} ${x.name} בסך הכול?`,
      left: (x, A, B) => `מסלול התעופה על המטאטא ארוך ${A}. ${x.name} ${x.g('טס', 'טסה')} כבר ${B}.`, qLeft: (x) => `כמה ק"מ ${x.g('נשארו לו', 'נשארו לה')} לטוס?`,
      cmp: (x, y, A, B) => `באימון תעופה ${x.name} ${x.g('טס', 'טסה')} על מטאטא ${A}, ו${y.name} ${y.g('טס', 'טסה')} ${B}.`, qMore: (x) => `מי ${x.g('טס', 'טסה')} יותר?`,
      qDiff: (x, y) => `בכמה ק"מ ${x.name} ${x.g('טס', 'טסה')} יותר מ${y.name}?` },
    { tags: ['squishy'], u: KG,
      tot: (x, A, B) => `${x.name} ${x.g('קנה', 'קנתה')} שקית סקווישים בצורת אוכל במשקל ${A}, ושקית סקווישים בצורת חיות במשקל ${B}.`, qTot: () => 'כמה ק"ג שוקלות שתי השקיות יחד?',
      left: (x, A, B) => `קופסת הסקווישים של ${x.name} שקלה ${A}. ${x.g('הוא', 'היא')} ${x.g('נתן', 'נתנה')} לחברים סקווישים במשקל ${B}.`, qLeft: () => 'כמה ק"ג סקווישים נשארו בקופסה?',
      cmp: (x, y, A, B) => `קופסת הסקווישים של ${x.name} שוקלת ${A}, וקופסת הסקווישים של ${y.name} שוקלת ${B}.`, qMore: () => 'של מי הקופסה כבדה יותר?',
      qDiff: (x, y) => `בכמה ק"ג הקופסה של ${x.name} כבדה יותר מהקופסה של ${y.name}?` },
  ];

  /* ---------- תרחישים: חלק משלם ---------- */
  const part = (tags, verb, of, of2, w1, w2, left) => ({
    tags,
    one: (x, A) => `${x.name} ${verb(x)} ${A} ${of}.`,
    two: (x, A, B) => `${x.name} ${verb(x)} ${A} ${of} ${w1} ו-${B} ${of2} ${w2}.`,
    sum: (x) => `איזה חלק ${of} ${verb(x)} ${x.name} בסך הכול?`,
    left,
  });
  const PARTS = [
    part(['baking'], (x) => x.g('אכל', 'אכלה'), 'מהפיצה', 'ממנה', 'בצהריים', 'בערב', () => 'איזה חלק מהפיצה נשאר?'),
    part(['baking'], (x) => x.g('אכל', 'אכלה'), 'מהעוגה', 'ממנה', 'ביום שישי', 'בשבת', () => 'איזה חלק מהעוגה נשאר?'),
    part(['reading'], (x) => x.g('קרא', 'קראה'), 'מהספר', 'ממנו', 'ביום ראשון', 'ביום שני', (x) => `איזה חלק מהספר ${x.g('נשאר לו', 'נשאר לה')} לקרוא?`),
    part(['art'], (x) => x.g('צבע', 'צבעה'), 'מהקיר', 'ממנו', 'בבוקר', 'בצהריים', () => 'איזה חלק מהקיר עוד לא צבוע?'),
    part(['nature'], (x) => x.g('הלך', 'הלכה'), 'משביל הטיול', 'ממנו', 'לפני ההפסקה', 'אחרי ההפסקה', (x) => `איזה חלק מהשביל ${x.g('נשאר לו', 'נשאר לה')} ללכת?`),
    part(['sport'], (x) => x.g('רץ', 'רצה'), 'ממסלול הריצה', 'ממנו', 'בבוקר', 'בערב', (x) => `איזה חלק מהמסלול ${x.g('נשאר לו', 'נשאר לה')} לרוץ?`),
    part(['games'], (x) => x.g('השלים', 'השלימה'), 'מהשלב במשחק', 'ממנו', 'אתמול', 'היום', (x) => `איזה חלק מהשלב ${x.g('נשאר לו', 'נשאר לה')} להשלים?`),
    part(['tech'], (x) => x.g('כתב', 'כתבה'), 'מהקוד של הרובוט', 'ממנו', 'ביום ראשון', 'ביום שני', () => 'איזה חלק מהקוד עוד לא נכתב?'),
    part(['music'], (x) => x.g('למד', 'למדה'), 'מהשיר', 'ממנו', 'בשיעור הראשון', 'בשיעור השני', (x) => `איזה חלק מהשיר ${x.g('נשאר לו', 'נשאר לה')} ללמוד?`),
    part(['space'], (x) => x.g('בנה', 'בנתה'), 'מדגם החללית', 'ממנו', 'ביום ראשון', 'ביום שני', () => 'איזה חלק מהדגם עוד לא נבנה?'),
    part(['kpop'], (x) => x.g('אסף', 'אספה'), 'מסדרת הפוטוקארדים של הלהקה', 'ממנה', 'בחודש שעבר', 'החודש', (x) => `איזה חלק מהסדרה עוד חסר ${x.g('לו', 'לה')}?`),
    part(['kpop'], (x) => x.g('למד', 'למדה'), 'מהריקוד החדש של הלהקה', 'ממנו', 'ביום ראשון', 'ביום שני', (x) => `איזה חלק מהריקוד ${x.g('נשאר לו', 'נשאר לה')} ללמוד?`),
    part(['magic'], (x) => x.g('קרא', 'קראה'), 'מספר הלחשים', 'ממנו', 'ביום ראשון', 'ביום שני', (x) => `איזה חלק מספר הלחשים ${x.g('נשאר לו', 'נשאר לה')} לקרוא?`),
    part(['squishy'], (x) => x.g('מילא', 'מילאה'), 'מקופסת הסקווישים', 'ממנה', 'בחנוכה', 'בפורים', () => 'איזה חלק מהקופסה עוד ריק?'),
    { tags: ['animals'], one: (x, A) => `הכלב של ${x.name} שתה ${A} מהמים בקערה.`, two: (x, A, B) => `הכלב של ${x.name} שתה ${A} מהמים בקערה בבוקר ו-${B} מהם בצהריים.`, sum: () => 'איזה חלק מהמים שתה הכלב בסך הכול?', left: () => 'איזה חלק מהמים נשאר בקערה?' },
  ];

  /* ========== מכנה משותף ========== */
  // שני שברים n1/b1 < n2/d1 ומכנה D שבו יש בדיוק מונה שלם אחד ביניהם (k)
  function betweenSet(c) {
    for (let t = 0; t < 120; t++) {
      const b1 = c.pick([2, 3, 4, 5, 6, 8]), d1 = c.pick([2, 3, 4, 5, 6, 8, 10]);
      const n1 = c.rnd(1, b1 - 1), n2 = c.rnd(1, d1 - 1);
      if (b1 === d1 || gcd(n1, b1) !== 1 || gcd(n2, d1) !== 1) continue;
      const L = lcm(b1, d1), lo = (n1 * L) / b1, hi = (n2 * L) / d1, diff = hi - lo;
      if (diff !== 1 && diff !== 2) continue;
      const D = diff === 1 ? 2 * L : L, k = diff === 1 ? 2 * lo + 1 : lo + 1;
      if (D > 24) continue;
      return { n1, b1, n2, d1, D, k, lo: k - 1, hi: k + 1 };
    }
    return { n1: 1, b1: 3, n2: 1, d1: 2, D: 12, k: 5, lo: 4, hi: 6 };
  }
  function cmpSol(n1, d1, n2, d2) {
    const D = lcm(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, s = ent(sgn(n1, d1, n2, d2));
    return [
      `מכנה משותף: ${D} (מתחלק גם ב-${d1} וגם ב-${d2}).`,
      `${ex(n1, d1, D)} ו-${ex(n2, d2, D)}`,
      `משווים מונים: ${m(a + ' ' + s + ' ' + bb)}, לכן ${m(F(n1, d1) + ' ' + s + ' ' + F(n2, d2))}`,
    ];
  }
  const betweenSol = (s) => [
    `נרחיב את שני השברים למכנה ${s.D}: ${ex(s.n1, s.b1, s.D)} ו-${ex(s.n2, s.d1, s.D)}.`,
    `המונה צריך להיות גדול מ-${s.lo} וקטן מ-${s.hi}: רק ${s.k}.`,
    `התשובה: ${m(F(s.k, s.D))}`,
  ];

  HM.lesson({
    id: 'f-common',
    learn: (c) => {
      const fr = c.buddy();
      return [
        {
          title: 'מי אכל יותר?',
          html: `${c.name} ${c.g('אכל', 'אכלה')} ${m(F(2, 3))} מפיצה, ו${fr.name} ${fr.g('אכל', 'אכלה')} ${m(F(3, 4))} מפיצה באותו גודל.<br>קשה להשוות, כי החלקים בגדלים שונים: שלישים ורבעים.<br>הרעיון: לחתוך את שתי הפיצות ל${b('חלקים באותו גודל')}.`,
          visual: V.bars([{ n: 2, d: 3 }, { n: 3, d: 4 }], { labels: [{ n: 2, d: 3 }, { n: 3, d: 4 }] }),
        },
        {
          title: 'מכנה משותף',
          html: `נרחיב את שני השברים כך שיהיה להם ${b('אותו מכנה')}, כלומר ${b('מכנה משותף')}.<br>המכנה המשותף מתחלק בשני המכנים: 12 מתחלק גם ב-3 וגם ב-4.<br>${m(F(2, 3) + ' = ' + F(8, 12))} ו-${m(F(3, 4) + ' = ' + F(9, 12))}.<br>עכשיו קל: ${m(F(8, 12) + ' &lt; ' + F(9, 12))}, לכן ${m(F(2, 3) + ' &lt; ' + F(3, 4))}.`,
          visual: V.bars([{ n: 8, d: 12 }, { n: 9, d: 12 }], { labels: [{ n: 8, d: 12 }, { n: 9, d: 12 }] }),
        },
        {
          title: 'דוגמה פתורה',
          html: `מה גדול יותר: ${m(F(5, 6))} או ${m(F(7, 9))}?`,
          steps: [
            `נחפש מכנה משותף: מספר שמתחלק גם ב-6 וגם ב-9. הקטן ביותר הוא 18.`,
            `נרחיב: ${m(F(5, 6) + ' = ' + F(15, 18))} (פי 3), ${m(F(7, 9) + ' = ' + F(14, 18))} (פי 2).`,
            `משווים מונים: ${m('15 &gt; 14')}, לכן ${m(F(5, 6) + ' &gt; ' + F(7, 9))} ✔`,
          ],
        },
        {
          title: 'השוואה לחצי ול-1',
          html: `לפעמים אפשר להשוות ${b('בלי מכנה משותף')}:<br>• ${b('חצי')}: ${m(F(3, 7))} קטן מחצי (3 קטן מחצי של 7), ו-${m(F(5, 9))} גדול מחצי. לכן ${m(F(3, 7) + ' &lt; ' + F(5, 9))}.<br>• ${b('קרוב ל-1')}: ל-${m(F(7, 8))} חסרה שמינית עד 1, ול-${m(F(9, 10))} חסרה רק עשירית. חסר פחות, ולכן ${m(F(9, 10) + ' &gt; ' + F(7, 8))}.`,
          visual: V.numberLine({ min: 0, max: 1, den: 2, w: 520, jumps: [], labels: (v, i) => (i === 1 ? { n: 1, d: 2 } : String(i / 2)), marks: [{ v: 3 / 7, label: { n: 3, d: 7 } }, { v: 5 / 9, label: { n: 5, d: 9 }, cls: 'f-b' }] }),
        },
        {
          title: 'שבר בין שני שברים',
          html: `איזה שבר נמצא בין ${m(F(1, 3))} ל-${m(F(1, 2))}?<br>במכנה 6: ${m(F(2, 6))} ו-${m(F(3, 6))}. אין שישית ביניהם.<br>נרחיב עוד, למכנה 12: ${m(F(4, 12))} ו-${m(F(6, 12))}, ו-${HM.hl(m(F(5, 12)))} באמצע!<br>אפשר להמשיך להרחיב בלי סוף, ולכן ${b('בין כל שני שברים יש אין-סוף שברים')}.`,
          visual: V.numberLine({ min: 0, max: 1, den: 12, w: 520, labels: (v, i) => (i === 0 ? '0' : i === 12 ? '1' : i >= 4 && i <= 6 ? { n: i, d: 12 } : null), marks: [{ v: 5 / 12, cls: 'f-c' }] }),
        },
        {
          title: `${c.g('נסה', 'נסי')} בעצמך`,
          html: `${c.g('השווה', 'השווי')} בעזרת מכנה משותף.`,
          quiz: { type: 'compare', prompt: cmpQ(c), left: F(3, 4), right: F(5, 6), lv: 3 / 4, rv: 5 / 6, answer: '<',
            hint: `מכנה משותף ל-4 ול-6 הוא 12.`, solution: cmpSol(3, 4, 5, 6) },
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['cdMult', 'expand', 'cmpMult', 'half', 'storyEasy', 'storyHalf', 'storyEasy']
        : level === 2 ? ['cmpGen', 'half2', 'between', 'order', 'cdMin', 'story', 'storyBetween', 'story']
        : ['betweenSlot', 'near1', 'infinite', 'order4', 'cmpGen', 'story', 'storyBetween', 'story'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'cdMult': {
          const [d1, d2] = multPair(c, 12), n1 = c.rnd(1, d1 - 1), n2 = nRed(c, d2);
          const flip = c.chance(0.5);
          return {
            type: 'number', answer: d2,
            prompt: `מהו המכנה המשותף הקטן ביותר של ${flip ? m(F(n2, d2)) : m(F(n1, d1))} ו-${flip ? m(F(n1, d1)) : m(F(n2, d2))}?`,
            hint: 'מכנה משותף מתחלק בשני המכנים. אולי אחד המכנים כבר מתחלק בשני?',
            solution: [`${d2} מתחלק ב-${d1}: ${m(`${d2} : ${d1} = ${d2 / d1}`)}.`, `לכן אפשר להרחיב את ${m(F(n1, d1))} למכנה ${d2}: ${ex(n1, d1, d2)}.`, `המכנה המשותף הקטן ביותר: ${d2}`],
          };
        }
        case 'expand': {
          const [d1, d2] = multPair(c, 12), k = d2 / d1, n1 = c.rnd(1, d1 - 1);
          return {
            type: 'number', answer: n1 * k,
            prompt: `${c.g('השלם', 'השלימי')} את המונה כדי לקבל שבר שווה:<div class="big">${m(F(n1, d1) + ' = ' + F(HM.slot(0), d2))}</div>`,
            hint: `פי כמה גדל המכנה? פי אותו מספר צריך לגדול גם המונה.`,
            solution: [`${m(`${d1} × ${k} = ${d2}`)}, כלומר המכנה גדל פי ${k}.`, `גם המונה גדל פי ${k}: ${m(`${n1} × ${k} = ${n1 * k}`)}.`, `${m(F(n1, d1) + ' = ' + F(n1 * k, d2))}`],
          };
        }
        case 'cmpMult': {
          const [d1, d2] = multPair(c, 12), k = d2 / d1, n1 = c.rnd(1, d1 - 1);
          const n2 = c.chance(0.2) ? n1 * k : c.rnd(1, d2 - 1);
          const flip = c.chance(0.5), L = flip ? [n2, d2] : [n1, d1], R = flip ? [n1, d1] : [n2, d2];
          return {
            type: 'compare', prompt: cmpQ(c), left: F(L[0], L[1]), right: F(R[0], R[1]), lv: L[0] / L[1], rv: R[0] / R[1], answer: sgn(L[0], L[1], R[0], R[1]),
            visual: V.bars([{ n: L[0], d: L[1] }, { n: R[0], d: R[1] }], { labels: [{ n: L[0], d: L[1] }, { n: R[0], d: R[1] }] }),
            hint: `${c.g('הרחב', 'הרחיבי')} את ${m(F(n1, d1))} למכנה ${d2}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: cmpSol(L[0], L[1], R[0], R[1]),
          };
        }
        case 'half': {
          const d = c.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
          let n = c.rnd(1, d - 1);
          if (d % 2 === 0 && c.chance(0.2)) n = d / 2;
          const ai = 2 * n < d ? 0 : 2 * n === d ? 1 : 2;
          const half = d % 2 ? `${(d - 1) / 2} וחצי` : String(d / 2);
          const rel = ['קטן מ', 'שווה ל', 'גדול מ'];
          return {
            type: 'choice', keep: true, prompt: `השבר ${m(F(n, d))} הוא:`,
            choices: rel.map((r) => `${r}-${m(F(1, 2))}`), answer: ai, visual: V.bar(n, d),
            hint: `כמה זה חצי מ-${d}? ${c.g('השווה', 'השווי')} את זה למונה.`,
            solution: [`חצי מ-${d} הוא ${half}.`, `המונה ${n} ${rel[ai]}-${half}, לכן ${m(F(n, d))} ${rel[ai]}-${m(F(1, 2))}.`],
          };
        }
        case 'half2': {
          let A = [3, 7], B = [5, 9];
          for (let t = 0; t < 80; t++) {
            const d1 = c.pick([3, 4, 5, 6, 7, 8, 9, 10]), d2 = c.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
            const a = [c.rnd(1, d1 - 1), d1], bb = [c.rnd(1, d2 - 1), d2];
            if (2 * a[0] < a[1] && 2 * bb[0] > bb[1] && d1 !== d2) { A = a; B = bb; break; }
          }
          const flip = c.chance(0.5), L = flip ? B : A, R = flip ? A : B;
          return {
            type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי מכנה משותף: ${c.g('השווה', 'השווי')} כל שבר לחצי.`,
            left: F(L[0], L[1]), right: F(R[0], R[1]), lv: L[0] / L[1], rv: R[0] / R[1], answer: sgn(L[0], L[1], R[0], R[1]),
            hint: 'שבר גדול מחצי כשהמונה גדול מחצי המכנה.',
            solution: [`${m(F(A[0], A[1]))} קטן מחצי (${A[0]} קטן מחצי של ${A[1]}).`, `${m(F(B[0], B[1]))} גדול מחצי (${B[0]} גדול מחצי של ${B[1]}).`, `לכן ${m(F(L[0], L[1]) + ' ' + ent(sgn(L[0], L[1], R[0], R[1])) + ' ' + F(R[0], R[1]))}`],
          };
        }
        case 'cmpGen': {
          const [d1, d2] = coPair(c, level === 2 ? [3, 4, 5, 6, 8, 10] : [4, 5, 6, 7, 8, 9, 10, 12]);
          const n1 = nRed(c, d1);
          let n2 = nRed(c, d2);
          if (level === 3) { n2 = Math.max(1, Math.min(d2 - 1, Math.round((n1 * d2) / d1) + c.pick([-1, 0, 1]))); if (gcd(n2, d2) !== 1) n2 = n2 > 1 && gcd(n2 - 1, d2) === 1 ? n2 - 1 : n2 + 1 < d2 && gcd(n2 + 1, d2) === 1 ? n2 + 1 : nRed(c, d2); }
          return {
            type: 'compare', prompt: cmpQ(c), left: F(n1, d1), right: F(n2, d2), lv: n1 / d1, rv: n2 / d2, answer: sgn(n1, d1, n2, d2),
            hint: `${c.g('מצא', 'מצאי')} מכנה משותף: מספר שמתחלק גם ב-${d1} וגם ב-${d2}.`,
            solution: cmpSol(n1, d1, n2, d2),
          };
        }
        case 'near1': {
          const k = c.pick([1, 1, 2]), over = c.chance(0.3);
          const [d1, d2] = c.sample([5, 6, 7, 8, 9, 10, 11, 12], 2);
          const n1 = over ? d1 + k : d1 - k, n2 = over ? d2 + k : d2 - k;
          const s = ent(sgn(n1, d1, n2, d2));
          return {
            type: 'compare', prompt: cmpQ(c), left: F(n1, d1), right: F(n2, d2), lv: n1 / d1, rv: n2 / d2, answer: sgn(n1, d1, n2, d2),
            hint: over ? 'בכמה כל שבר גדול מ-1?' : 'כמה חסר לכל שבר כדי להגיע ל-1?',
            solution: [over ? `${m(F(n1, d1))} גדול מ-1 ב-${m(F(k, d1))}, ו-${m(F(n2, d2))} גדול מ-1 ב-${m(F(k, d2))}.` : `ל-${m(F(n1, d1))} חסר ${m(F(k, d1))} עד 1, ול-${m(F(n2, d2))} חסר ${m(F(k, d2))}.`, `${m(F(k, Math.min(d1, d2)) + ' &gt; ' + F(k, Math.max(d1, d2)))}, כי כשמחלקים לפחות חלקים, כל חלק גדול יותר.`, over ? `העודף הגדול יותר נותן שבר גדול יותר: ${m(F(n1, d1) + ' ' + s + ' ' + F(n2, d2))}` : `כשחסר פחות, השבר גדול יותר: ${m(F(n1, d1) + ' ' + s + ' ' + F(n2, d2))}`],
          };
        }
        case 'between': {
          const s = betweenSet(c), alt = s.k - 2 >= 1 ? s.k - 2 : s.k + 2;
          const choices = [s.k, s.k - 1, s.k + 1, alt].map((x) => m(F(x, s.D)));
          return {
            type: 'choice', prompt: `איזה שבר נמצא בין ${m(F(s.n1, s.b1))} ל-${m(F(s.n2, s.d1))}?`, choices, answer: 0,
            hint: `${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${s.D}, כמו בתשובות.`,
            solution: betweenSol(s),
          };
        }
        case 'betweenSlot': {
          const s = betweenSet(c);
          return {
            type: 'number', answer: s.k,
            prompt: `${c.g('השלם', 'השלימי')} מונה כך שהשבר יהיה בין שני השברים:<div class="big">${m(F(s.n1, s.b1) + ' &lt; ' + F(HM.slot(0), s.D) + ' &lt; ' + F(s.n2, s.d1))}</div>`,
            hint: `${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${s.D}.`,
            solution: betweenSol(s),
          };
        }
        case 'infinite': {
          const s = betweenSet(c), A = m(F(s.n1, s.b1)), B = m(F(s.n2, s.d1)), v = c.rnd(0, 4);
          const exp = `נרחיב למכנה ${s.D}: ${ex(s.n1, s.b1, s.D)} ו-${ex(s.n2, s.d1, s.D)}.`;
          const inf = `אפשר להרחיב עוד ועוד (למשל למכנה ${2 * s.D}) ולמצוא עוד ועוד שברים ביניהם.`;
          if (v === 4) {
            const d = c.pick([5, 6, 7, 8, 9]), n = c.rnd(1, d - 2);
            return {
              type: 'tf', answer: false, prompt: `בין ${m(F(n, d))} ל-${m(F(n + 1, d))} אין אף שבר.`,
              hint: `${c.g('נסה', 'נסי')} להרחיב את שני השברים פי 2.`,
              solution: [`${ex(n, d, 2 * d)} ו-${ex(n + 1, d, 2 * d)}.`, `${m(F(2 * n + 1, 2 * d))} נמצא ביניהם, ויש עוד אין-סוף שברים. לא נכון.`],
            };
          }
          const st = [
            [`בין ${A} ל-${B} יש בדיוק שבר אחד.`, false, [exp, `ביניהם ${m(F(s.k, s.D))}, אבל ${inf}`, 'יש אין-סוף שברים. לא נכון.']],
            [`בין ${A} ל-${B} יש אין-סוף שברים.`, true, [exp, `ביניהם ${m(F(s.k, s.D))}, ו${inf}`, 'נכון.']],
            [`השבר ${m(F(s.k, s.D))} נמצא בין ${A} ל-${B}.`, true, [exp, `${m(s.lo + ' &lt; ' + s.k + ' &lt; ' + s.hi)}. נכון.`]],
            [`השבר ${m(F(s.hi + 1, s.D))} נמצא בין ${A} ל-${B}.`, false, [exp, `${m(s.hi + 1 + ' &gt; ' + s.hi)}, כלומר השבר גדול מ-${B}. לא נכון.`]],
          ][v];
          return { type: 'tf', prompt: st[0], answer: st[1], hint: `${c.g('הרחב', 'הרחיבי')} את השברים לאותו מכנה, ${c.g('ונסה', 'ונסי')} למצוא שברים ביניהם.`, solution: st[2] };
        }
        case 'order':
        case 'order4': {
          const cnt = kind === 'order4' ? 4 : 3, desc = kind === 'order4' && c.chance(0.5);
          const fam = c.pick([[2, 3, 4, 6, 12], [2, 4, 5, 10], [2, 3, 6, 9], [3, 4, 6, 8]]);
          const items = [];
          for (let g = 0; items.length < cnt && g < 300; g++) {
            const d = c.pick(fam), n = c.rnd(1, d - 1);
            if (gcd(n, d) !== 1 || items.some((x) => x.n * d === n * x.d)) continue;
            items.push({ n, d });
          }
          const D = items.reduce((a, x) => lcm(a, x.d), 1);
          const idx = items.map((_, i) => i).sort((i, j) => (items[i].n / items[i].d - items[j].n / items[j].d) * (desc ? -1 : 1));
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את השברים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            items: items.map((x) => m(F(x.n, x.d))), answer: idx,
            hint: `${c.g('הרחב', 'הרחיבי')} את כל השברים למכנה משותף (${D}) ו${c.g('השווה', 'השווי')} את המונים.`,
            solution: [`נרחיב למכנה ${D}: ${items.map((x) => ex(x.n, x.d, D)).join(' , ')}`, `הסדר: ${idx.map((i) => m(F(items[i].n, items[i].d))).join(' , ')}`],
          };
        }
        case 'cdMin': {
          const [d1, d2] = c.pick([[4, 6], [6, 8], [6, 9], [4, 10], [8, 12], [6, 10], [9, 12], [10, 12], [6, 4], [8, 6], [12, 8]]);
          const L = lcm(d1, d2), big = Math.max(d1, d2), small = Math.min(d1, d2);
          const ch = HM.numChoices(L, [d1 * d2, d1 + d2, big]);
          const mults = HM.range(1, L / big).map((k) => k * big);
          return {
            type: 'choice', choices: ch.choices, answer: 0,
            prompt: `מהו המכנה המשותף הקטן ביותר של ${m(F(nRed(c, d1), d1))} ו-${m(F(nRed(c, d2), d2))}?`,
            hint: `${c.g('כתוב', 'כתבי')} כפולות של ${big} ו${c.g('עצור', 'עצרי')} בראשונה שמתחלקת גם ב-${small}.`,
            solution: [`כפולות של ${big}: ${HM.seq(mults)}`, `${L} מתחלק גם ב-${small}.`, `גם ${d1 * d2} הוא מכנה משותף, אבל לא הקטן ביותר. התשובה: ${L}`],
          };
        }
        case 'storyEasy':
        case 'story': {
          const sc = c.scene(QTY), x = c.me, y = c.buddy();
          let A, B, w = 0;
          if (kind === 'storyEasy') {
            const [d1, d2] = multPair(c, 12), n1 = nRed(c, d1);
            let n2 = nRed(c, d2);
            if (n2 * d1 === n1 * d2) n2 = n2 > 1 ? n2 - 1 : n2 + 1;
            [A, B] = c.shuffle([[n1, d1], [n2, d2]]);
          } else {
            const [d1, d2] = coPair(c, level === 2 ? [3, 4, 5, 6, 8, 10] : [4, 5, 6, 7, 8, 9, 10, 12]);
            const n1 = nRed(c, d1);
            let n2 = level === 3 ? Math.max(1, Math.min(d2 - 1, Math.round((n1 * d2) / d1) + c.pick([-1, 1]))) : nRed(c, d2);
            if (n2 * d1 === n1 * d2) n2 = n2 > 1 ? n2 - 1 : n2 + 1;
            if (gcd(n2, d2) !== 1) n2 = nRed(c, d2);
            if (n2 * d1 === n1 * d2) n2 = 1;
            A = [n1, d1]; B = [n2, d2];
            if (level === 3) w = c.rnd(1, 4);
          }
          const qa = Q(sc.u, w * A[1] + A[0], A[1]), qb = Q(sc.u, w * B[1] + B[0], B[1]);
          const xMore = A[0] * B[1] > B[0] * A[1];
          const sol = cmpSol(A[0], A[1], B[0], B[1]);
          return {
            type: 'choice', prompt: `${sc.cmp(x, y, qa, qb)}<br>${sc.qMore(x, y)}`,
            choices: [xMore ? x.name : y.name, xMore ? y.name : x.name, 'אי אפשר לדעת'], answer: 0,
            hint: w ? `השלמים שווים. ${c.g('השווה', 'השווי')} את השברים בעזרת מכנה משותף.` : `${c.g('השווה', 'השווי')} את השברים בעזרת מכנה משותף.`,
            solution: (w ? [`לשניהם ${HM.cnt(w, 'שלם', 'שלמים')}, לכן משווים רק את השברים.`] : []).concat(sol.slice(0, 2), [`${sol[2]}. התשובה: ${xMore ? x.name : y.name}`]),
          };
        }
        case 'storyHalf': {
          const sc = c.scene(PARTS), d = c.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
          let n = c.rnd(1, d - 1);
          if (d % 2 === 0 && c.chance(0.2)) n = d / 2;
          const ai = 2 * n < d ? 0 : 2 * n === d ? 1 : 2, half = d % 2 ? `${(d - 1) / 2} וחצי` : String(d / 2);
          const words = ['פחות מחצי', 'בדיוק חצי', 'יותר מחצי'];
          return {
            type: 'choice', keep: true, prompt: `${sc.one(c.me, m(F(n, d)))}<br>האם זה פחות מחצי, בדיוק חצי או יותר מחצי?`,
            choices: words, answer: ai,
            hint: `כמה זה חצי מ-${d}? ${c.g('השווה', 'השווי')} את זה למונה ${n}.`,
            solution: [`חצי מ-${d} הוא ${half}.`, `${n} ${['קטן מ', 'שווה ל', 'גדול מ'][ai]}-${half}, ולכן התשובה: ${words[ai]}.`],
          };
        }
        case 'storyBetween': {
          const sc = c.scene(PARTS), s = betweenSet(c), alt = s.k - 2 >= 1 ? s.k - 2 : s.k + 2;
          return {
            type: 'choice', prompt: `${sc.one(c.me, `יותר מ-${m(F(s.n1, s.b1))} ופחות מ-${m(F(s.n2, s.d1))}`)}<br>איזה מהשברים האלה יכול להתאים?`,
            choices: [s.k, s.k - 1, s.k + 1, alt].map((k) => m(F(k, s.D))), answer: 0,
            hint: `${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${s.D}, כמו בתשובות.`,
            solution: betweenSol(s),
          };
        }
      }
    },
  });

  /* ========== חיבור וחיסור שברים (א) ========== */
  const PLUS = '+', MIN = HM.op.minus;
  // פתרון לחיבור/חיסור שני שברים (מכנה משותף, פעולה, צמצום/מעורב)
  function opSol(n1, d1, n2, d2, op) {
    const D = lcm(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, N = op === PLUS ? a + bb : a - bb;
    const st = [];
    if (d1 !== d2) st.push(`מכנה משותף: ${D}. ${[d1 !== D ? ex(n1, d1, D) : '', d2 !== D ? ex(n2, d2, D) : ''].filter(Boolean).join(' ו-')}`);
    st.push(`${m(F(a, D) + ` ${op} ` + F(bb, D) + ' = ' + F(N, D))} (${op === PLUS ? 'מחברים' : 'מחסרים'} מונים, המכנה נשאר).`);
    st.push(fin(N, D, true));
    return st;
  }
  const exprF = (n1, d1, n2, d2, op) => F(n1, d1) + ` ${op} ` + F(n2, d2);
  const storySol = (n1, d1, n2, d2, op) => (d1 !== d2 ? [`התרגיל: ${m(exprF(n1, d1, n2, d2, op))}`] : []).concat(opSol(n1, d1, n2, d2, op));
  // מסיחים לחיבור/חיסור: חיבור מונים ומכנים, שכחת הרחבה
  function opWrong(n1, d1, n2, d2, op) {
    const D = Math.max(d1, d2), out = [];
    if (op === PLUS) { out.push([n1 + n2, d1 + d2]); if (d1 !== d2) out.push([n1 + n2, D]); out.push([n1 + n2, d1 * d2]); }
    else { if (d1 > d2 && n1 > n2) out.push([n1 - n2, d1 - d2]); if (d1 !== d2 && n1 >= n2) out.push([n1 - n2, D]); if (d1 < d2 && n1 > n2) out.push([n1 - n2, d2 - d1]); }
    return out;
  }

  HM.lesson({
    id: 'f-addsub-a',
    learn: (c) => [
      {
        title: 'אותו מכנה: מחברים מונים',
        html: `${c.name} ${c.g('אכל', 'אכלה')} ${m(F(2, 8))} מהפיצה בצהריים ו-${m(F(3, 8))} ממנה בערב.<br>שמיניות ועוד שמיניות הן שמיניות: ${m(F(2, 8) + ' + ' + F(3, 8) + ' = ' + F(5, 8))}.<br>${b('מחברים את המונים')}, והמכנה ${b('נשאר')}: הוא רק השם של החלק.`,
        visual: jumpLine(8, 1, [0, 2, 5]),
      },
      {
        title: 'למה לא מחברים מכנים?',
        html: `אם נחבר גם את המכנים, נקבל ${m(F(1, 2) + ' + ' + F(1, 2) + ' = ' + F(2, 4))}?<br>אבל שני חצאים הם ${b('שלם')}, ו-${m(F(2, 4))} הוא רק חצי!<br>המכנה אומר ${b('מה גודל החלק')}. כשמחברים חלקים באותו גודל, הגודל לא משתנה.`,
        visual: V.bars([{ n: 1, d: 2 }, { n: 1, d: 2 }, { n: 2, d: 2 }], { labels: [{ n: 1, d: 2 }, { n: 1, d: 2 }, 'שלם'] }),
      },
      {
        title: 'חיסור עם אותו מכנה',
        html: `${m(F(7, 9) + ' − ' + F(4, 9) + ' = ' + F(3, 9))}: ${b('מחסרים את המונים')}, והמכנה נשאר.<br>אפשר גם לצמצם: ${m(F(3, 9) + ' = ' + F(1, 3))}.<br>על ישר המספרים מתחילים ב-${m(F(7, 9))} וקופצים 4 תשיעיות אחורה.`,
        visual: jumpLine(9, 1, [7, 3]),
      },
      {
        title: 'מכנה אחד כפולה של השני',
        html: `כמה זה ${m(F(1, 4) + ' + ' + F(3, 8))}? החלקים בגדלים שונים, אבל כל רבע הוא בדיוק 2 שמיניות.`,
        visual: V.bars([{ n: 1, d: 4 }, { n: 2, d: 8 }], { labels: [{ n: 1, d: 4 }, { n: 2, d: 8 }] }),
        steps: [
          `8 מתחלק ב-4, לכן נרחיב את הרבעים לשמיניות: ${ex(1, 4, 8)}.`,
          `עכשיו המכנים שווים: ${m(F(2, 8) + ' + ' + F(3, 8) + ' = ' + F(5, 8))}.`,
          `התשובה: ${m(F(5, 8))} ✔`,
        ],
      },
      {
        title: 'אומדן: יותר או פחות מ-1?',
        html: `${c.g('לפני שאתה מחשב', 'לפני שאת מחשבת')}, ${c.g('נסה', 'נסי')} להעריך:<br>• שני שברים גדולים מחצי: הסכום ${b('גדול מ-1')}. למשל ${m(F(3, 4) + ' + ' + F(5, 8))}.<br>• שני שברים קטנים מחצי: הסכום ${b('קטן מ-1')}. למשל ${m(F(1, 3) + ' + ' + F(1, 6))}.<br>• ${m(F(3, 4) + ' + ' + F(1, 8))}: ל-${m(F(3, 4))} חסר רבע עד 1, ו-${m(F(1, 8))} קטן מרבע, ולכן הסכום קטן מ-1.`,
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('הרחב', 'הרחיבי')} שבר אחד, ואז ${c.g('חבר', 'חברי')}.`,
        quiz: { type: 'fraction', prompt: `${c.g('חשב', 'חשבי')}: ${m(F(1, 3) + ' + ' + F(1, 6) + ' =')}`, answer: { n: 1, d: 2 },
          hint: 'שליש אחד הוא 2 שישיות.', solution: opSol(1, 3, 1, 6, PLUS) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['sameAdd', 'sameSub', 'shadeSum', 'missSame', 'storySame', 'storySame', 'storyLeft1']
        : level === 2 ? ['multAdd', 'multSub', 'est1', 'missMult', 'pickErr', 'storyMult', 'storyMultLeft', 'storyMult']
        : ['chain3', 'cmpExpr', 'tfErr', 'missMult3', 'est1', 'storyTwoLeft', 'storyCmp', 'storyTwoLeft'];
      const kind = c.pick(kinds);
      // זוג שברים עם מכנים שווים (sum<d)
      const same = () => { const d = c.pick([3, 4, 5, 6, 7, 8, 9, 10]); const a = c.rnd(1, d - 2), bb = c.rnd(1, d - 1 - a); return [a, bb, d]; };
      // זוג שברים שאחד המכנים כפולה של השני (בסדר אקראי)
      const mp = (maxSum) => {
        for (let t = 0; t < 80; t++) {
          const [d1, d2] = multPair(c, 12), n1 = nRed(c, d1), n2 = nRed(c, d2);
          const s = n1 * (d2 / d1) + n2;
          if (maxSum && s >= d2 * maxSum) continue;
          return c.chance(0.5) ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
        }
        return [1, 4, 3, 8];
      };
      switch (kind) {
        case 'sameAdd': {
          const [a, bb, d] = same();
          return {
            type: 'fraction', ...ans(a + bb, d), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')}: ${m(exprF(a, d, bb, d, PLUS) + ' =')}`, visual: jumpLine(d, 1, [0, a, a + bb], { hide: true }),
            hint: 'המכנים שווים: מחברים את המונים, והמכנה נשאר.',
            solution: opSol(a, d, bb, d, PLUS),
          };
        }
        case 'sameSub': {
          const [x, y, d] = same(), a = x + y, bb = c.chance(0.5) ? x : y;
          return {
            type: 'fraction', ...ans(a - bb, d), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')}: ${m(exprF(a, d, bb, d, MIN) + ' =')}`, visual: jumpLine(d, 1, [a, a - bb], { hide: true }),
            hint: 'המכנים שווים: מחסרים את המונים, והמכנה נשאר.',
            solution: opSol(a, d, bb, d, MIN),
          };
        }
        case 'shadeSum': {
          const [a, bb, d] = same();
          return {
            type: 'shade', shape: 'bar', parts: d, answer: a + bb,
            prompt: `${c.g('צבע', 'צבעי')} בפס את הסכום ${m(exprF(a, d, bb, d, PLUS))}.`,
            hint: `הפס מחולק ל-${d} חלקים. כמה חלקים יש בשני השברים יחד?`,
            solution: [`${m(exprF(a, d, bb, d, PLUS) + ' = ' + F(a + bb, d))}`, `צריך לצבוע ${a + bb} חלקים מתוך ${d}.`],
          };
        }
        case 'missSame': {
          const [a, bb, d] = same(), sub = c.chance(0.5);
          return {
            type: 'number', answer: bb,
            prompt: `${c.g('השלם', 'השלימי')} את המונה החסר:<div class="big">${m(sub ? F(a + bb, d) + ' − ' + F(HM.slot(0), d) + ' = ' + F(a, d) : F(a, d) + ' + ' + F(HM.slot(0), d) + ' = ' + F(a + bb, d))}</div>`,
            hint: sub ? `כמה צריך להוריד מ-${a + bb} כדי לקבל ${a}?` : `כמה חסר מ-${a} עד ${a + bb}?`,
            solution: [`המכנים שווים, אז עובדים עם המונים: ${m(`${a + bb} − ${a} = ${bb}`)}.`, `${m(sub ? exprF(a + bb, d, bb, d, MIN) + ' = ' + F(a, d) : exprF(a, d, bb, d, PLUS) + ' = ' + F(a + bb, d))}`],
          };
        }
        case 'multAdd':
        case 'multSub': {
          let [n1, d1, n2, d2] = mp(kind === 'multAdd' ? 0 : 0);
          const add = kind === 'multAdd', D = Math.max(d1, d2);
          if (!add && n1 * (D / d1) <= n2 * (D / d2)) [n1, d1, n2, d2] = [n2, d2, n1, d1];
          if (!add && n1 * (D / d1) === n2 * (D / d2)) [n1, d1, n2, d2] = [3, 4, 1, 8];
          const op = add ? PLUS : MIN, N = add ? n1 * (D / d1) + n2 * (D / d2) : n1 * (D / d1) - n2 * (D / d2);
          const small = d1 < d2 ? [n1, d1] : [n2, d2];
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')}: ${m(exprF(n1, d1, n2, d2, op) + ' =')}`,
            visual: V.bars([{ n: small[0], d: small[1] }, { n: (small[0] * D) / small[1], d: D }], { labels: [{ n: small[0], d: small[1] }, '?'] }),
            hint: `${D} מתחלק ב-${Math.min(d1, d2)}. ${c.g('הרחב', 'הרחיבי')} את ${m(F(small[0], small[1]))} למכנה ${D}.`,
            solution: opSol(n1, d1, n2, d2, op),
          };
        }
        case 'pickErr': {
          let [n1, d1, n2, d2] = mp(1);
          const D = Math.max(d1, d2), N = n1 * (D / d1) + n2 * (D / d2);
          const choices = vChoices([[N, D]].concat(opWrong(n1, d1, n2, d2, PLUS)), (x, y) => m(F(x, y)));
          return {
            type: 'choice', prompt: `מה התוצאה הנכונה של ${m(exprF(n1, d1, n2, d2, PLUS))}?`, choices, answer: 0,
            hint: `לא מחברים מכנים! קודם ${c.g('מצא', 'מצאי')} מכנה משותף.`,
            solution: opSol(n1, d1, n2, d2, PLUS),
          };
        }
        case 'est1': {
          let n1 = 3, d1 = 4, n2 = 3, d2 = 8;
          for (let t = 0; t < 60; t++) {
            const [a1, a2] = multPair(c, 12), dd = c.chance(0.5) ? [a1, a2] : [a2, a1];
            const D0 = Math.max(a1, a2), x = nRed(c, dd[0]), ax = (x * D0) / dd[0];
            const y = c.rnd(1, dd[1] - 1), ay = (y * D0) / dd[1];
            if (Math.abs(ax + ay - D0) > Math.max(2, D0 / 4)) continue;
            n1 = x; d1 = dd[0]; n2 = y; d2 = dd[1]; break;
          }
          const D = Math.max(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, miss = D - a;
          const ai = a + bb < D ? 0 : a + bb === D ? 1 : 2;
          const rel = ['קטן מ', 'שווה ל', 'גדול מ'];
          return {
            type: 'choice', keep: true, prompt: `בלי לחשב עד הסוף: הסכום ${m(exprF(n1, d1, n2, d2, PLUS))} הוא`,
            choices: rel.map((r) => `${r}-1`), answer: ai,
            hint: `כמה חסר ל-${m(F(n1, d1))} עד 1? ${c.g('השווה', 'השווי')} את זה לשבר השני.`,
            solution: [`ל-${m(F(n1, d1))} חסר ${m(MX(miss, D))} עד 1${d1 !== D ? `, כלומר ${m(F(miss, D))}` : ''}.`, `${ex(n2, d2, D)}, ו-${bb} ${rel[ai]}-${miss}.`, `לכן הסכום ${rel[ai]}-1.`],
          };
        }
        case 'missMult':
        case 'missMult3': {
          const [n1, d1, n2, d2] = mp(1), D = Math.max(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, s = a + bb;
          const form = kind === 'missMult' ? c.pick([0, 1]) : c.pick([2, 3]);
          const box = HM.box();
          // 0: n1/d1 + ? = s/D   1: ? + n2/d2 = s/D   2: s/D − ? = n1/d1   3: ? − n1/d1 = n2/d2
          const ex0 = [F(n1, d1) + ' + ' + box + ' = ' + RX(s, D), box + ' + ' + F(n2, d2) + ' = ' + RX(s, D), RX(s, D) + ' − ' + box + ' = ' + F(n1, d1), box + ' − ' + F(n1, d1) + ' = ' + F(n2, d2)][form];
          const res = form === 0 || form === 2 ? [n2, d2] : form === 1 ? [n1, d1] : [s, D];
          const howTo = form === 3 ? `המספר החסר הוא המחוסר, ומוצאים אותו בחיבור: ${m(exprF(n1, d1, n2, d2, PLUS))}.` : `מוצאים את המספר החסר בחיסור: ${m(RX(s, D) + ' − ' + (form === 1 ? F(n2, d2) : F(n1, d1)))}.`;
          const sol = form === 3 ? opSol(n1, d1, n2, d2, PLUS) : form === 1 ? opSol(...red(s, D), n2, d2, MIN) : opSol(...red(s, D), n1, d1, MIN);
          return {
            type: 'fraction', ...ans(res[0], res[1]), accept: 'equal',
            prompt: `מה המספר החסר?<div class="big">${m(ex0)}</div>`,
            hint: form === 3 ? `מה מחסרים כדי לקבל ${m(F(n2, d2))}? ${c.g('חבר', 'חברי')} את שני השברים.` : `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה: חיסור.`,
            solution: [howTo].concat(sol),
          };
        }
        case 'chain3': {
          for (let t = 0; t < 80; t++) {
            const dens = c.shuffle(c.pick([[2, 4, 8], [3, 6, 12], [2, 6, 12], [2, 4, 12], [5, 10, 10], [4, 8, 8], [3, 6, 6]]));
            const ns = dens.map((d) => nRed(c, d)), D = dens.reduce((x, y) => lcm(x, y), 1);
            const u = ns.map((n, i) => (n * D) / dens[i]), sub = c.chance(0.4);
            const N = sub ? u[0] + u[1] - u[2] : u[0] + u[1] + u[2];
            if (N <= 0 || N % D === 0) continue;
            const op2 = sub ? MIN : PLUS;
            return {
              type: 'fraction', ...ans(N, D), accept: 'equal',
              prompt: `${c.g('חשב', 'חשבי')}: ${m(F(ns[0], dens[0]) + ' + ' + F(ns[1], dens[1]) + ` ${op2} ` + F(ns[2], dens[2]) + ' =')}`,
              hint: `${c.g('הרחב', 'הרחיבי')} את כל השברים למכנה ${D}, ואז ${c.g('חשב', 'חשבי')} משמאל לימין.`,
              solution: [`נרחיב למכנה ${D}: ${m(F(u[0], D) + ' + ' + F(u[1], D) + ` ${op2} ` + F(u[2], D))}`, `${m(F(u[0] + u[1], D) + ` ${op2} ` + F(u[2], D) + ' = ' + F(N, D))}`, fin(N, D, true)],
            };
          }
          return { type: 'fraction', answer: { n: 7, d: 8 }, prompt: `${c.g('חשב', 'חשבי')}: ${m(F(1, 2) + ' + ' + F(1, 4) + ' + ' + F(1, 8) + ' =')}`, hint: 'מכנה משותף: 8.', solution: [`${m(F(4, 8) + ' + ' + F(2, 8) + ' + ' + F(1, 8) + ' = ' + F(7, 8))}`] };
        }
        case 'cmpExpr': {
          const [n1, d1, n2, d2] = mp(2), D = Math.max(d1, d2), s = (n1 * D) / d1 + (n2 * D) / d2;
          const r = c.pick(['one', 'one', 'half', 'frac']);
          let right, rv;
          if (r === 'one') { right = '1'; rv = 1; }
          else if (r === 'half') { right = F(1, 2); rv = 1 / 2; }
          else { const k = Math.max(1, Math.min(2 * D - 1, s + c.pick([-1, 1]))); const [p, q] = red(k, D); right = q === 1 ? String(p) : F(p, q); rv = p / q; }
          const lv = s / D, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c), left: exprF(n1, d1, n2, d2, PLUS), right, lv, rv, answer: an,
            hint: `${c.g('חשב', 'חשבי')} את הסכום (או ${c.g('הערך', 'העריכי')} אותו), ואז ${c.g('השווה', 'השווי')}.`,
            solution: opSol(n1, d1, n2, d2, PLUS).slice(0, -1).concat([`${m(RX(s, D) + ' ' + ent(an) + ' ' + right)}`]),
          };
        }
        case 'tfErr': {
          const add = c.chance(0.6);
          let [n1, d1, n2, d2] = mp(add ? 1 : 0);
          const D = Math.max(d1, d2);
          if (!add && n1 * (D / d1) <= n2 * (D / d2)) [n1, d1, n2, d2] = [n2, d2, n1, d1];
          if (!add && n1 * (D / d1) === n2 * (D / d2)) [n1, d1, n2, d2] = [5, 6, 1, 3];
          const op = add ? PLUS : MIN, N = add ? n1 * (D / d1) + n2 * (D / d2) : n1 * (D / d1) - n2 * (D / d2);
          const wrongs = opWrong(n1, d1, n2, d2, op).filter(([x, y]) => x >= 0 && y > 0 && x * D !== N * y);
          const truth = c.chance(0.4) || !wrongs.length, shown = truth ? [N, D] : c.pick(wrongs);
          return {
            type: 'tf', answer: truth, prompt: `${m(exprF(n1, d1, n2, d2, op) + ' = ' + F(shown[0], shown[1]))}`,
            hint: `${c.g('פתור', 'פתרי')} בעצמך עם מכנה משותף, ו${c.g('השווה', 'השווי')} לתוצאה הכתובה.`,
            solution: opSol(n1, d1, n2, d2, op).concat([truth ? 'נכון.' : `ולא ${m(F(shown[0], shown[1]))}. לא נכון.`]),
          };
        }
        case 'storySame':
        case 'storyMult': {
          const usePart = c.chance(0.5), x = c.me;
          let n1 = 3, d1 = 4, n2 = 3, d2 = 8;
          for (let t = 0; t < 40; t++) {
            [n1, d1, n2, d2] = kind === 'storySame' ? (() => { const [a, bb, d] = same(); return [a, d, bb, d]; })() : mp(usePart ? 1 : 0);
            if (((n1 * lcm(d1, d2)) / d1 + (n2 * lcm(d1, d2)) / d2) % lcm(d1, d2)) break;
          }
          const D = lcm(d1, d2), N = (n1 * D) / d1 + (n2 * D) / d2;
          if (usePart && N < D) {
            const sc = c.scene(PARTS);
            return {
              type: 'fraction', ...ans(N, D), accept: 'equal', prompt: `${sc.two(x, m(F(n1, d1)), m(F(n2, d2)))}<br>${sc.sum(x)}`,
              hint: d1 === d2 ? 'המכנים שווים: מחברים את המונים.' : `${c.g('הרחב', 'הרחיבי')} את השבר עם המכנה הקטן, ואז ${c.g('חבר', 'חברי')}.`,
              solution: storySol(n1, d1, n2, d2, PLUS),
            };
          }
          const sc = c.scene(QTY);
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal', prompt: `${sc.tot(x, Q(sc.u, n1, d1), Q(sc.u, n2, d2))}<br>${sc.qTot(x)}`,
            hint: d1 === d2 ? 'המכנים שווים: מחברים את המונים.' : `${c.g('הרחב', 'הרחיבי')} את השבר עם המכנה הקטן, ואז ${c.g('חבר', 'חברי')}.`,
            solution: storySol(n1, d1, n2, d2, PLUS),
          };
        }
        case 'storyLeft1':
        case 'storyMultLeft': {
          let n1, d1, n2, d2;
          if (kind === 'storyLeft1') { const [a, bb, d] = same(); n1 = a + bb; d1 = d; n2 = c.chance(0.5) ? a : bb; d2 = d; }
          else {
            [n1, d1, n2, d2] = mp(0);
            const D0 = Math.max(d1, d2);
            if (n1 * (D0 / d1) <= n2 * (D0 / d2)) [n1, d1, n2, d2] = [n2, d2, n1, d1];
            if (n1 * (D0 / d1) === n2 * (D0 / d2)) [n1, d1, n2, d2] = [7, 8, 1, 4];
          }
          const D = lcm(d1, d2), N = (n1 * D) / d1 - (n2 * D) / d2, sc = c.scene(QTY), x = c.me;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal', prompt: `${sc.left(x, Q(sc.u, n1, d1), Q(sc.u, n2, d2))}<br>${sc.qLeft(x)}`,
            hint: `כדי למצוא כמה נשאר, ${c.g('חסר', 'חסרי')} את הכמות הקטנה מהגדולה.`,
            solution: storySol(n1, d1, n2, d2, MIN),
          };
        }
        case 'storyTwoLeft': {
          const [n1, d1, n2, d2] = mp(1), D = lcm(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, sc = c.scene(PARTS), x = c.me;
          return {
            type: 'fraction', ...ans(D - a - bb, D), accept: 'equal', prompt: `${sc.two(x, m(F(n1, d1)), m(F(n2, d2)))}<br>${sc.left(x)}`,
            hint: `קודם ${c.g('מצא', 'מצאי')} איזה חלק כבר נעשה בסך הכול. השלם הוא ${m(F(D, D))}.`,
            solution: [`ביחד: ${m(exprF(n1, d1, n2, d2, PLUS) + ' = ' + F(a, D) + ' + ' + F(bb, D) + ' = ' + F(a + bb, D))}`, `נשאר: ${m('1 − ' + F(a + bb, D) + ' = ' + F(D, D) + ' − ' + F(a + bb, D) + ' = ' + F(D - a - bb, D))}`, fin(D - a - bb, D)],
          };
        }
        case 'storyCmp': {
          let [n1, d1, n2, d2] = mp(0);
          const D = lcm(d1, d2);
          if (n1 * (D / d1) <= n2 * (D / d2)) [n1, d1, n2, d2] = [n2, d2, n1, d1];
          if (n1 * (D / d1) === n2 * (D / d2)) [n1, d1, n2, d2] = [5, 6, 1, 3];
          const sc = c.scene(QTY), x = c.me, y = c.buddy(), N = (n1 * D) / d1 - (n2 * D) / d2;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal', prompt: `${sc.cmp(x, y, Q(sc.u, n1, d1), Q(sc.u, n2, d2))}<br>${sc.qDiff(x, y)}`,
            hint: `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור: הגדול פחות הקטן.`,
            solution: storySol(n1, d1, n2, d2, MIN),
          };
        }
      }
    },
  });

  /* ========== חיבור וחיסור מספרים מעורבים (א) ========== */
  // הרחבה של מספר (N/d) למכנה D
  const exM = (N, d, D) => (D === d ? m(MX(N, d)) : m(MX(N, d) + ' = ' + MX((N * D) / d, D)));
  // הצגה מצומצמת, אלא אם הצמצום שובר את הקשר "כפולה" עם מכנה אחר
  const nice = (N, D, dOther) => { const [a, bb] = red(N, D); return bb % dOther === 0 || dOther % bb === 0 ? MX(a, bb) : MX(N, D); };
  // פתרון לחיבור/חיסור מעורבים (שלמים לחוד, שברים לחוד; בחיבור — מעבר שלם)
  function mixSol(N1, d1, N2, d2, op) {
    const D = lcm(d1, d2), A = (N1 * D) / d1, B = (N2 * D) / d2, R = op === PLUS ? A + B : A - B;
    const wA = Math.floor(A / D), wB = Math.floor(B / D), w = op === PLUS ? wA + wB : wA - wB, f = op === PLUS ? (A % D) + (B % D) : (A % D) - (B % D);
    const st = [];
    if (d1 !== d2) st.push(`מכנה משותף: ${D}. ` + [d1 !== D ? exM(N1, d1, D) : '', d2 !== D ? exM(N2, d2, D) : ''].filter(Boolean).join(' ו-'));
    st.push(`שלמים: ${m(`${wA} ${op} ${wB} = ${w}`)}. שברים: ${m(F(A % D, D) + ` ${op} ` + F(B % D, D) + ' = ' + F(f, D))}.`);
    if (f >= D) st.push(`${m(F(f, D) + ' = ' + MX(f, D))}, ולכן ${m(w + ' + ' + MX(f, D) + ' = ' + MX(R, D))}.`);
    st.push(fin(R, D));
    return st;
  }
  const exprM = (N1, d1, N2, d2, op) => MX(N1, d1) + ` ${op} ` + MX(N2, d2);
  // מספר מעורב אקראי (מונה כולל) עם מכנה d
  const rMix = (c, d, w0, w1) => c.rnd(w0, w1) * d + nRed(c, d);
  // זוג מעורבים: op חיבור (carry: true/false/null) או חיסור בלי המרה
  function mixPair(c, d1, d2, op, o) {
    o = o || {};
    const D = lcm(d1, d2);
    for (let t = 0; t < 150; t++) {
      const N1 = rMix(c, d1, o.w0 || 1, o.w1 || 5), N2 = rMix(c, d2, o.v0 || 1, o.v1 || o.w1 || 5);
      const a = ((N1 * D) / d1) % D, bb = ((N2 * D) / d2) % D;
      if (op === PLUS) {
        if (a + bb === D || (o.carry === true && a + bb < D) || (o.carry === false && a + bb > D)) continue;
      } else if (a <= bb || Math.floor(N1 / d1) < Math.floor(N2 / d2)) continue;
      return [N1, N2];
    }
    return op === PLUS ? [5 * d1 + 1, d2 + 1] : [4 * d1 - 1, d2 + 1];
  }
  // סיפור עם שתי כמויות
  function storyQ(c, kind, N1, d1, N2, d2) {
    const sc = c.scene(QTY), x = c.me;
    if (kind === 'tot') return `${sc.tot(x, Q(sc.u, N1, d1), Q(sc.u, N2, d2))}<br>${sc.qTot(x)}`;
    if (kind === 'left') return `${sc.left(x, Q(sc.u, N1, d1), Q(sc.u, N2, d2))}<br>${sc.qLeft(x)}`;
    const y = c.buddy();
    return `${sc.cmp(x, y, Q(sc.u, N1, d1), Q(sc.u, N2, d2))}<br>${sc.qDiff(x, y)}`;
  }
  const mixStorySol = (N1, d1, N2, d2, op) => { const st = mixSol(N1, d1, N2, d2, op); st[0] = `התרגיל: ${m(exprM(N1, d1, N2, d2, op))}. ` + st[0]; return st; };
  // שלושה מכנים שכל אחד מהם כפולה של האחר (שרשרת)
  const chain3 = (c) => c.shuffle(c.pick([[2, 4, 8], [3, 6, 12], [2, 4, 4], [3, 6, 6], [5, 10, 10], [2, 6, 6], [4, 8, 8], [2, 4, 12]]));
  const fq = (N, D) => (N % D === 0 ? { type: 'number', answer: N / D } : Object.assign({ type: 'fraction', accept: 'equal' }, ans(N, D)));

  HM.lesson({
    id: 'f-mixed-a',
    learn: (c) => [
      {
        title: 'שלמים לחוד, שברים לחוד',
        html: `${c.name} ${c.g('הלך', 'הלכה')} ${m(WN(1, 1, 5))} ק"מ עד המעיין ועוד ${m(WN(2, 3, 5))} ק"מ עד התצפית.<br>מחברים ${b('שלמים עם שלמים')}: ${m('1 + 2 = 3')}, ו${b('שברים עם שברים')}: ${m(F(1, 5) + ' + ' + F(3, 5) + ' = ' + F(4, 5))}.<br>בסך הכול: ${m(WN(3, 4, 5))} ק"מ.`,
        visual: jumpLine(5, 4, [6, 16, 19], { wholeOnly: true }),
      },
      {
        title: 'כשהשברים עוברים שלם',
        html: `${m(WN(2, 3, 4) + ' + ' + WN(1, 3, 4))}: שלמים ${m('2 + 1 = 3')}, שברים ${m(F(3, 4) + ' + ' + F(3, 4) + ' = ' + F(6, 4))}.<br>${m(F(6, 4))} גדול מ-1: ${m(F(6, 4) + ' = ' + WN(1, 2, 4))}. ${b('מעבירים את השלם')} לשלמים:<br>${m('3 + ' + WN(1, 2, 4) + ' = ' + WN(4, 2, 4) + ' = ' + WN(4, 1, 2))}`,
        visual: jumpLine(4, 5, [11, 15, 18], { wholeOnly: true }),
      },
      {
        title: 'חיסור מספרים מעורבים',
        html: `כמה זה ${m(WN(3, 5, 6) + ' − ' + WN(1, 1, 3))}? המכנה 6 הוא כפולה של 3.`,
        steps: [
          `מכנה משותף: 6. ${m(WN(1, 1, 3) + ' = ' + WN(1, 2, 6))}.`,
          `שלמים: ${m('3 − 1 = 2')}. שברים: ${m(F(5, 6) + ' − ' + F(2, 6) + ' = ' + F(3, 6))}.`,
          `התוצאה: ${m(WN(2, 3, 6) + ' = ' + WN(2, 1, 2))} ✔`,
        ],
      },
      {
        title: 'שלושה מחוברים וסוגריים',
        html: `• ${b('קודם הסוגריים')}: ${m(WN(5, 3, 4) + ' − (' + WN(1, 1, 4) + ' + ' + WN(2, 1, 4) + ')')}<br>${m(' = ' + WN(5, 3, 4) + ' − ' + WN(3, 2, 4) + ' = ' + WN(2, 1, 4))}<br>• בחיבור מותר ${b('לשנות את הסדר')}: ב-${m(WN(1, 1, 4) + ' + ' + WN(2, 1, 2) + ' + ' + F(3, 4))} נחבר קודם ${m(F(1, 4) + ' + ' + F(3, 4) + ' = 1')}. עם השלמים: ${m('1 + 2 + 1 = 4')}, ועוד ${m(F(1, 2))}: ${m(WN(4, 1, 2))}.`,
      },
      {
        title: 'מספר חסר ואי-שוויון',
        html: `• ${m(WN(1, 1, 3) + ' + ' + HM.box() + ' = ' + WN(4, 2, 3))}: ${c.g('שאל', 'שאלי')} כמה חסר מ-${m(WN(1, 1, 3))} עד ${m(WN(4, 2, 3))}. ${m(WN(4, 2, 3) + ' − ' + WN(1, 1, 3) + ' = ' + WN(3, 1, 3))}.<br>• איזה מספר שלם מתאים ל-${m(WN(1, 1, 2) + ' + ' + HM.box() + ' &lt; 4')}? 2 מתאים (${m(WN(3, 1, 2) + ' &lt; 4')}), אבל 3 כבר לא (${m(WN(4, 1, 2) + ' &gt; 4')}).`,
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('חבר', 'חברי')} שלמים עם שלמים ושברים עם שברים.`,
        quiz: { type: 'fraction', mixed: true, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(2, 1, 4) + ' + ' + WN(1, 1, 2) + ' =')}`, answer: { w: 3, n: 3, d: 4 },
          hint: `${m(F(1, 2) + ' = ' + F(2, 4))}`, solution: mixSol(9, 4, 3, 2, PLUS) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['addSame', 'subSame', 'line', 'missW', 'storyAdd1', 'storySub1', 'storyAdd1']
        : level === 2 ? ['addMult', 'subMult', 'three', 'est', 'storyAdd', 'storySub', 'storyAdd']
        : ['paren', 'eqMissing', 'ineq', 'cmpExpr', 'storyTwo', 'storyCmp', 'storyTwo'];
      const kind = c.pick(kinds);
      const dSame = () => c.pick([3, 4, 5, 6, 7, 8, 9, 10]);
      const pairM = () => { const [a, bb] = multPair(c, 12); return c.chance(0.5) ? [a, bb] : [bb, a]; };
      switch (kind) {
        case 'addSame':
        case 'subSame':
        case 'storyAdd1':
        case 'storySub1': {
          const d = dSame(), add = kind === 'addSame' || kind === 'storyAdd1', op = add ? PLUS : MIN;
          const [N1, N2] = mixPair(c, d, d, op, add ? { carry: false, w1: 4 } : { w0: 2, w1: 6, v1: 3 });
          const R = add ? N1 + N2 : N1 - N2, story = kind.indexOf('story') === 0;
          const q = fq(R, d);
          return Object.assign(q, {
            prompt: story ? storyQ(c, add ? 'tot' : 'left', N1, d, N2, d) : `${c.g('חשב', 'חשבי')}: ${m(exprM(N1, d, N2, d, op) + ' =')}`,
            visual: !story && (Math.floor(Math.max(N1, R) / d) + 1) * d <= 40 ? jumpLine(d, Math.floor(Math.max(N1, R) / d) + 1, add ? [N1, N1 + Math.floor(N2 / d) * d, R] : [N1, N1 - Math.floor(N2 / d) * d, R], { hide: true, wholeOnly: true }) : undefined,
            hint: `${c.g(add ? 'חבר' : 'חסר', add ? 'חברי' : 'חסרי')} שלמים עם שלמים ושברים עם שברים.`,
            solution: story ? mixStorySol(N1, d, N2, d, op) : mixSol(N1, d, N2, d, op),
          });
        }
        case 'line': {
          const d = c.pick([3, 4, 5, 6, 8]), w = c.rnd(1, 2), n1 = nRed(c, d), sub = c.chance(0.4);
          let n2 = nRed(c, d);
          if (sub && n2 >= n1) n2 = n1 > 1 ? c.rnd(1, n1 - 1) : 0;
          const N1 = w * d + n1, useSub = sub && n2 > 0, R = useSub ? N1 - n2 : N1 + n2;
          return {
            type: 'numberline', line: { min: 0, max: w + 2, den: d }, answer: R / d,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(MX(N1, d) + (useSub ? ' − ' : ' + ') + F(n2, d))}.`,
            hint: `${c.g('מצא', 'מצאי')} קודם את ${m(MX(N1, d))} על הישר, ואז ${c.g('קפוץ', 'קפצי')} ${HM.cnt(n2, 'שנתה', 'שנתות', true)} ${useSub ? 'אחורה' : 'קדימה'}. כל שנתה היא ${m(F(1, d))}.`,
            solution: [`${m(MX(N1, d) + (useSub ? ' − ' : ' + ') + F(n2, d) + ' = ' + MX(R, d))}`, `מסמנים את ${m(MX(R, d))}.`],
          };
        }
        case 'missW': {
          const d = dSame(), [N1, N2] = mixPair(c, d, d, PLUS, { carry: false, w1: 4 }), R = N1 + N2;
          return {
            type: 'number', answer: [Math.floor(R / d), R % d],
            prompt: `${c.g('השלם', 'השלימי')} את התוצאה:<div class="big">${m(exprM(N1, d, N2, d, PLUS) + ' = ' + HM.mixed(HM.slot(0), HM.slot(1), d))}</div>`,
            hint: 'במשבצת הגדולה: כמה שלמים. במשבצת הקטנה: המונה של השבר.',
            solution: mixSol(N1, d, N2, d, PLUS),
          };
        }
        case 'addMult':
        case 'subMult':
        case 'storyAdd':
        case 'storySub': {
          const [d1, d2] = pairM(), add = kind === 'addMult' || kind === 'storyAdd', op = add ? PLUS : MIN;
          const [N1, N2] = mixPair(c, d1, d2, op, add ? { carry: c.chance(0.6) ? true : null, w1: 5 } : { w0: 2, w1: 7, v1: 4 });
          const D = lcm(d1, d2), R = add ? (N1 * D) / d1 + (N2 * D) / d2 : (N1 * D) / d1 - (N2 * D) / d2, story = kind.indexOf('story') === 0;
          const sm = d1 < d2 ? [N1 % d1, d1] : [N2 % d2, d2];
          return Object.assign(fq(R, D), {
            prompt: story ? storyQ(c, add ? 'tot' : 'left', N1, d1, N2, d2) : `${c.g('חשב', 'חשבי')}: ${m(exprM(N1, d1, N2, d2, op) + ' =')}`,
            visual: story ? undefined : V.bars([{ n: sm[0], d: sm[1] }, { n: (sm[0] * D) / sm[1], d: D }], { labels: [{ n: sm[0], d: sm[1] }, '?'] }),
            hint: `${c.g('הרחב', 'הרחיבי')} את השבר עם המכנה ${Math.min(d1, d2)} למכנה ${D}, ואז ${c.g(add ? 'חבר' : 'חסר', add ? 'חברי' : 'חסרי')} שלמים ושברים.`,
            solution: story ? mixStorySol(N1, d1, N2, d2, op) : mixSol(N1, d1, N2, d2, op),
          });
        }
        case 'three': {
          const [d1, d2] = multPair(c, 12), D = d2, k = nRed(c, D);
          const f2 = nRed(c, d1), ws = [c.rnd(1, 4), c.rnd(1, 4), c.rnd(0, 3)];
          const nums = c.shuffle([[ws[0] * D + k, D], [ws[1] * D + (D - k), D], [ws[2] * d1 + f2, d1]]);
          const disp = nums.map(([N, d]) => { const [a, bb] = red(N, d); return MX(a, bb); });
          const total = ws[0] + ws[1] + ws[2] + 1, Rn = total * d1 + f2;
          return {
            type: 'fraction', ...ans(Rn, d1), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')} בדרך קצרה: ${m(disp.join(' + ') + ' =')}`,
            hint: `${c.g('חפש', 'חפשי')} שני שברים שיחד הם שלם אחד.`,
            solution: [`שלמים: ${m(`${ws[0]} + ${ws[1]} + ${ws[2]} = ${ws[0] + ws[1] + ws[2]}`)}.`, `${m(RX(k, D) + ' + ' + RX(D - k, D) + ' = 1')}`, `${m(`${ws[0] + ws[1] + ws[2]} + 1 + ` + F(f2, d1) + ' = ' + WN(total, f2, d1))}`, fin(Rn, d1)],
          };
        }
        case 'est': {
          const [d1, d2] = pairM(), sub = c.chance(0.35), op = sub ? MIN : PLUS;
          const [N1, N2] = mixPair(c, d1, d2, op, sub ? { w0: 3, w1: 8, v1: 3 } : { carry: true, w1: 5 });
          const D = lcm(d1, d2), R = sub ? (N1 * D) / d1 - (N2 * D) / d2 : (N1 * D) / d1 + (N2 * D) / d2, W = Math.floor(R / D);
          const opts = [W - 1, W, W + 1].filter((k) => k >= 0);
          return {
            type: 'choice', keep: true, prompt: `בלי לחשב עד הסוף: התוצאה של ${m(exprM(N1, d1, N2, d2, op))} נמצאת`,
            choices: opts.map((k) => `בין ${k} ל-${k + 1}`), answer: opts.indexOf(W),
            hint: sub ? `${c.g('חסר', 'חסרי')} את השלמים, ו${c.g('בדוק', 'בדקי')} אם אפשר להוריד את השבר בלי לפרוט שלם.` : `${c.g('חבר', 'חברי')} את השלמים, ו${c.g('בדוק', 'בדקי')}: האם שני השברים יחד עוברים 1?`,
            solution: mixSol(N1, d1, N2, d2, op).slice(0, -1).concat([`התוצאה ${m(RX(R, D))} נמצאת בין ${W} ל-${W + 1}.`]),
          };
        }
        case 'paren': {
          for (let t = 0; t < 200; t++) {
            const dens = chain3(c), D = dens.reduce((x, y) => lcm(x, y), 1), form = c.pick([0, 1, 2]);
            const N = [rMix(c, dens[0], form === 2 ? 1 : 5, form === 2 ? 4 : 9), rMix(c, dens[1], 1, 3), rMix(c, dens[2], 1, 3)];
            const u = N.map((x, i) => (x * D) / dens[i]);
            const noB = (X, Y) => X > Y && X % D >= Y % D;
            let mid, R, steps;
            const disp = N.map((x, i) => RX(x, dens[i]));
            if (form === 0) {
              mid = u[1] + u[2]; if (!noB(u[0], mid)) continue; R = u[0] - mid;
              steps = [`קודם הסוגריים: ${m(MX(u[1], D) + ' + ' + MX(u[2], D) + ' = ' + MX(mid, D))}`, `${m(MX(u[0], D) + ' − ' + MX(mid, D) + ' = ' + MX(R, D))}`];
            } else if (form === 1) {
              mid = u[0] + u[1]; if (!noB(mid, u[2])) continue; R = mid - u[2];
              steps = [`קודם הסוגריים: ${m(MX(u[0], D) + ' + ' + MX(u[1], D) + ' = ' + MX(mid, D))}`, `${m(MX(mid, D) + ' − ' + MX(u[2], D) + ' = ' + MX(R, D))}`];
            } else {
              mid = u[0] + u[1]; R = mid + u[2];
              steps = [`${m(MX(u[0], D) + ' + ' + MX(u[1], D) + ' = ' + MX(mid, D))}`, `${m(MX(mid, D) + ' + ' + MX(u[2], D) + ' = ' + MX(R, D))}`];
            }
            if (R % D === 0 && c.chance(0.7)) continue;
            const expr = form === 0 ? `${disp[0]} − (${disp[1]} + ${disp[2]})` : form === 1 ? `(${disp[0]} + ${disp[1]}) − ${disp[2]}` : `${disp[0]} + ${disp[1]} + ${disp[2]}`;
            return Object.assign(fq(R, D), {
              prompt: `${c.g('חשב', 'חשבי')}: ${m(expr + ' =')}`,
              hint: form === 2 ? `${c.g('הרחב', 'הרחיבי')} את כל השברים למכנה ${D}, ו${c.g('חבר', 'חברי')} שלמים ושברים.` : `קודם ${c.g('פתור', 'פתרי')} את מה שבתוך הסוגריים. מכנה משותף: ${D}.`,
              solution: [`נרחיב למכנה ${D}.`].concat(steps, [R % D ? fin(R, D) : `התשובה: ${R / D}`]),
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 2, n: 1, d: 4 }, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(5, 3, 4) + ' − (' + WN(1, 1, 4) + ' + ' + WN(2, 1, 4) + ') =')}`, hint: 'קודם הסוגריים.', solution: [`${m(WN(1, 1, 4) + ' + ' + WN(2, 1, 4) + ' = ' + WN(3, 2, 4))}`, `${m(WN(5, 3, 4) + ' − ' + WN(3, 2, 4) + ' = ' + WN(2, 1, 4))}`] };
        }
        case 'eqMissing': {
          const [dA, dX] = pairM(), D = lcm(dA, dX);
          const [NA, NX] = mixPair(c, dA, dX, PLUS, { carry: false, w1: 4 });
          const S = (NA * D) / dA + (NX * D) / dX, form = c.pick([0, 1, 2]);
          const sTxt = nice(S, D, dA), aTxt = MX(NA, dA), xTxt = MX(NX, dX), box = HM.box();
          // 0: A + ? = S   1: S − ? = A   2: ? − A = X
          const expr = [aTxt + ' + ' + box + ' = ' + sTxt, sTxt + ' − ' + box + ' = ' + aTxt, box + ' − ' + aTxt + ' = ' + xTxt][form];
          const res = form === 2 ? [S, D] : [NX, dX];
          const sol = form === 2 ? [`המחוסר החסר שווה לסכום: ${m(aTxt + ' + ' + xTxt)}`].concat(mixSol(NA, dA, NX, dX, PLUS)) : [`מוצאים את החסר בחיסור: ${m(sTxt + ' − ' + aTxt)}`].concat(mixSol(S, D, NA, dA, MIN));
          return {
            type: 'fraction', ...ans(...res), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
            hint: form === 2 ? `מה צריך להיות המספר, כדי שאחרי שמורידים ממנו ${m(aTxt)} יישאר ${m(xTxt)}?` : `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה.`,
            solution: sol.length > 4 ? [sol[0]].concat(sol.slice(-3)) : sol,
          };
        }
        case 'ineq': {
          const [dA, dT] = pairM(), D = lcm(dA, dT), NA = rMix(c, dA, 1, 3), k = c.rnd(1, 4), uA = (NA * D) / dA;
          const fT = c.rnd(1, Math.max(1, D - 1 - (uA % D))), T = uA + k * D + fT, tTxt = nice(T, D, dA), aTxt = MX(NA, dA), form = c.pick([0, 1, 2]), box = HM.box();
          const answer = form === 1 ? k + 1 : k;
          const expr = [aTxt + ' + ' + box + ' &lt; ' + tTxt, aTxt + ' + ' + box + ' &gt; ' + tTxt, tTxt + ' − ' + box + ' &gt; ' + aTxt][form];
          const ask = form === 1 ? 'הקטן ביותר' : 'הגדול ביותר';
          const lines = form === 2
            ? `${m(tTxt + ' − ' + k + ' = ' + RX(T - k * D, D) + ' &gt; ' + aTxt)}, אבל ${m(tTxt + ' − ' + (k + 1) + ' = ' + RX(T - (k + 1) * D, D) + ' &lt; ' + aTxt)}.`
            : `${m(aTxt + ' + ' + k + ' = ' + RX(uA + k * D, D) + ' &lt; ' + tTxt)}, אבל ${m(aTxt + ' + ' + (k + 1) + ' = ' + RX(uA + (k + 1) * D, D) + ' &gt; ' + tTxt)}.`;
          return {
            type: 'number', answer,
            prompt: `מהו המספר השלם ${b(ask)} שאפשר לכתוב במשבצת?<div class="big">${m(expr)}</div>`,
            hint: `${c.g('נסה', 'נסי')} מספרים שלמים במשבצת: 1, 2, 3... ו${c.g('בדוק', 'בדקי')} מתי האי-שוויון מתקיים.`,
            solution: [`ההפרש בין ${m(tTxt)} ל-${m(aTxt)} הוא ${m(RX(T - uA, D))}.`, lines, `התשובה: ${answer}`],
          };
        }
        case 'cmpExpr': {
          const form = c.pick([0, 0, 1, 2, 2]), [d1, d2] = pairM();
          const A = rMix(c, d1, 2, 6);
          let B = rMix(c, d2, 1, 3), C = rMix(c, d2, 1, 3);
          if (B === C) C = B + 1;
          const v = (N, d) => N / d;
          let left, right, lv, rv, why;
          if (form === 0) { left = exprM(A, d1, B, d2, PLUS); right = exprM(A, d1, C, d2, PLUS); lv = v(A, d1) + v(B, d2); rv = v(A, d1) + v(C, d2); why = `המחובר ${m(MX(A, d1))} מופיע בשני הצדדים, לכן משווים רק את ${m(MX(B, d2))} ו-${m(MX(C, d2))}.`; }
          else if (form === 1) { left = exprM(A, d1, B, d2, PLUS); right = exprM(B, d2, A, d1, PLUS); lv = v(A, d1) + v(B, d2); rv = lv; why = 'אותם מחוברים בסדר אחר: בחיבור מותר להחליף סדר, והסכום לא משתנה.'; }
          else { const A2 = A + 4 * d1; left = exprM(A2, d1, B, d2, MIN); right = exprM(A2, d1, C, d2, MIN); lv = v(A2, d1) - v(B, d2); rv = v(A2, d1) - v(C, d2); why = `מחסרים מאותו מספר. מי שמחסר מספר גדול יותר, מקבל תוצאה קטנה יותר.`; }
          const an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב.`, left, right, lv, rv, answer: an,
            hint: `מה שווה בשני הצדדים? ${c.g('השווה', 'השווי')} רק את מה ששונה.`,
            solution: [why, form === 1 ? `התשובה: =` : `${m(MX(B, d2) + ' ' + ent(sgn(B, d2, C, d2)) + ' ' + MX(C, d2))}, ולכן הסימן הוא ${ent(an)}.`],
          };
        }
        case 'storyTwo': {
          for (let t = 0; t < 200; t++) {
            const dens = chain3(c), D = dens.reduce((x, y) => lcm(x, y), 1);
            const N = [rMix(c, dens[0], 5, 9), rMix(c, dens[1], 1, 2), rMix(c, dens[2], 0, 2)];
            const u = N.map((x, i) => (x * D) / dens[i]), used = u[1] + u[2];
            if (!(u[0] > used && u[0] % D >= used % D) || (u[0] - used) % D === 0) continue;
            const sc = c.scene(QTY), x = c.me, R = u[0] - used;
            const qs = N.map((x2, i) => Q(sc.u, ...red(x2, dens[i])));
            return Object.assign(fq(R, D), {
              prompt: `${sc.left(x, qs[0], `${qs[1]} ועוד ${qs[2]}`)}<br>${sc.qLeft(x)}`,
              hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואז ${c.g('חסר', 'חסרי')} את הסכום מהכמות שהייתה בהתחלה.`,
              solution: [`נרחיב למכנה ${D}.`, `${m(MX(u[1], D) + ' + ' + MX(u[2], D) + ' = ' + MX(used, D))}`, `${m(MX(u[0], D) + ' − ' + MX(used, D) + ' = ' + MX(R, D))}`, fin(R, D)],
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 3, n: 1, d: 2 }, prompt: `${c.name} ${c.g('קנה', 'קנתה')} ${Q(MT, 15, 2)} סרט ו${c.g('השתמש', 'השתמשה')} ב-${Q(MT, 5, 4)} ועוד ${Q(MT, 11, 4)}. כמה מטר נשארו?`, hint: 'קודם חיבור, אחר כך חיסור.', solution: [`${m(WN(1, 1, 4) + ' + ' + WN(2, 3, 4) + ' = 4')}`, `${m(WN(7, 1, 2) + ' − 4 = ' + WN(3, 1, 2))}`] };
        }
        case 'storyCmp': {
          const [d1, d2] = pairM(), [N1, N2] = mixPair(c, d1, d2, MIN, { w0: 2, w1: 6, v1: 4 });
          const D = lcm(d1, d2), R = (N1 * D) / d1 - (N2 * D) / d2;
          return Object.assign(fq(R, D), {
            prompt: storyQ(c, 'cmp', N1, d1, N2, d2),
            hint: `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור: הגדול פחות הקטן.`,
            solution: mixStorySol(N1, d1, N2, d2, MIN),
          });
        }
      }
    },
  });

  /* ========== חיבור וחיסור שברים (ב) ========== */
  // זוג מכנים שאף אחד מהם אינו כפולה של האחר, עם מכנה משותף קטן מספיק
  const coP = (c, list, maxL) => { for (let t = 0; t < 80; t++) { const [x, y] = coPair(c, list); if (lcm(x, y) <= maxL) return [x, y]; } return [3, 4]; };

  HM.lesson({
    id: 'f-addsub-b',
    learn: (c) => {
      const fr = c.buddy();
      return [
        {
          title: 'חצי ועוד שליש',
          html: `${c.name} ${c.g('אכל', 'אכלה')} ${m(F(1, 2))} פיצה, ו${fr.name} ${fr.g('אכל', 'אכלה')} ${m(F(1, 3))} פיצה. כמה אכלו יחד?<br>חצאים ושלישים הם חלקים בגדלים שונים, ואף מכנה אינו כפולה של השני.<br>נחתוך הכול ל${b('שישיות')}: ${m(F(1, 2) + ' = ' + F(3, 6))} ו-${m(F(1, 3) + ' = ' + F(2, 6))}, ויחד ${m(F(5, 6))}.`,
          visual: V.bars([{ n: 3, d: 6 }, { n: 2, d: 6 }, { n: 5, d: 6 }], { labels: [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 5, d: 6 }] }),
        },
        {
          title: 'איך מוצאים מכנה משותף?',
          html: `• תמיד אפשר ${b('לכפול את המכנים')}: ל-4 ול-6 יתאים 24.<br>• עדיף ${b('המכנה המשותף הקטן ביותר')}: עוברים על הכפולות של המכנה הגדול, ${HM.seq([6, 12, 18])}, ועוצרים בראשונה שמתחלקת גם במכנה השני: 12.<br>מכנה קטן יותר = מספרים קטנים יותר = פחות טעויות.`,
        },
        {
          title: 'דוגמה פתורה',
          html: `כמה זה ${m(F(3, 4) + ' − ' + F(1, 6))}?`,
          visual: V.bars([{ n: 9, d: 12 }, { n: 2, d: 12 }], { labels: [{ n: 3, d: 4 }, { n: 1, d: 6 }] }),
          steps: [
            `מכנה משותף: 12 (הכפולה הראשונה של 6 שמתחלקת גם ב-4).`,
            `${m(F(3, 4) + ' = ' + F(9, 12))} ו-${m(F(1, 6) + ' = ' + F(2, 12))}.`,
            `${m(F(9, 12) + ' − ' + F(2, 12) + ' = ' + F(7, 12))} ✔`,
          ],
        },
        {
          title: 'מספר חסר',
          html: `${m(F(1, 3) + ' + ' + HM.box() + ' = ' + F(5, 6))}: כמה חסר מ-${m(F(1, 3))} עד ${m(F(5, 6))}?<br>משתמשים ב${b('פעולה ההפוכה')}, חיסור: ${m(F(5, 6) + ' − ' + F(2, 6) + ' = ' + F(3, 6) + ' = ' + F(1, 2))}.<br>${c.g('בדוק', 'בדקי')}: ${m(F(1, 3) + ' + ' + F(1, 2) + ' = ' + F(2, 6) + ' + ' + F(3, 6) + ' = ' + F(5, 6))} ✔`,
          visual: jumpLine(6, 1, [2, 5]),
        },
        {
          title: 'להשוות בלי לחשב',
          html: `• ${m(F(2, 3) + ' + ' + F(1, 5))} או ${m(F(2, 3) + ' + ' + F(1, 4))}? המחובר ${m(F(2, 3))} זהה, ו-${m(F(1, 5) + ' &lt; ' + F(1, 4))}, לכן הסכום הראשון קטן יותר.<br>• ${m('1 − ' + F(2, 7))} או ${m('1 − ' + F(2, 9))}? בראשון מורידים יותר, אז נשאר פחות.<br>• ${m(F(3, 5) + ' + ' + F(4, 7))}: שני השברים גדולים מחצי, ולכן הסכום גדול מ-1.`,
        },
        {
          title: `${c.g('נסה', 'נסי')} בעצמך`,
          html: `${c.g('מצא', 'מצאי')} מכנה משותף, ${c.g('הרחב', 'הרחיבי')} ו${c.g('חבר', 'חברי')}.`,
          quiz: { type: 'fraction', prompt: `${c.g('חשב', 'חשבי')}: ${m(F(1, 4) + ' + ' + F(2, 3) + ' =')}`, answer: { n: 11, d: 12 },
            hint: 'מכנה משותף: 12.', solution: opSol(1, 4, 2, 3, PLUS) },
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['add2', 'sub2', 'expandBoth', 'est1', 'storyAdd', 'storyLeft', 'storyAdd']
        : level === 2 ? ['addGen', 'subGen', 'missing', 'cmpExpr', 'pickErr', 'storyTot', 'storyLeft', 'storyDiff']
        : ['three', 'missing3', 'tfEst', 'cmpSums', 'storyTwoLeft', 'storyUsed2', 'storyDiff'];
      const kind = c.pick(kinds);
      const LIST = level === 1 ? [2, 3, 4, 5] : level === 2 ? [2, 3, 4, 5, 6, 8, 9, 10] : [3, 4, 5, 6, 7, 8, 9, 10, 12];
      const MAXL = level === 1 ? 20 : level === 2 ? 30 : 40;
      // זוג שברים מצומצמים עם מכנים "זרים"; sub: הראשון גדול; maxSum: סכום קטן מ-1
      const pair = (o) => {
        o = o || {};
        for (let t = 0; t < 120; t++) {
          const [d1, d2] = coP(c, LIST, MAXL), n1 = nRed(c, d1), n2 = nRed(c, d2), D = lcm(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2;
          if (o.sub && a <= bb) continue;
          if (o.maxSum && a + bb >= D) continue;
          if (!o.sub && (a + bb) % D === 0) continue;
          return [n1, d1, n2, d2];
        }
        return o.sub ? [3, 4, 1, 3] : [1, 2, 1, 3];
      };
      switch (kind) {
        case 'add2':
        case 'sub2':
        case 'addGen':
        case 'subGen': {
          const sub = kind.indexOf('sub') === 0, op = sub ? MIN : PLUS;
          const [n1, d1, n2, d2] = pair({ sub, maxSum: level === 1 && !sub });
          const D = lcm(d1, d2), N = sub ? (n1 * D) / d1 - (n2 * D) / d2 : (n1 * D) / d1 + (n2 * D) / d2;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')}: ${m(exprF(n1, d1, n2, d2, op) + ' =')}`,
            visual: level === 1 ? V.bars([{ n: n1, d: d1 }, { n: n2, d: d2 }], { labels: [{ n: n1, d: d1 }, { n: n2, d: d2 }] }) : undefined,
            hint: `${c.g('מצא', 'מצאי')} מכנה משותף: מספר שמתחלק גם ב-${d1} וגם ב-${d2}.`,
            solution: opSol(n1, d1, n2, d2, op),
          };
        }
        case 'expandBoth': {
          const [n1, d1, n2, d2] = pair({ maxSum: true }), D = lcm(d1, d2), sub = c.chance(0.3);
          const [A, B] = sub && (n1 * D) / d1 < (n2 * D) / d2 ? [[n2, d2], [n1, d1]] : [[n1, d1], [n2, d2]];
          const op = sub ? MIN : PLUS;
          return {
            type: 'number', answer: [(A[0] * D) / A[1], (B[0] * D) / B[1]],
            prompt: `${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${D}:<div class="big">${m(exprF(A[0], A[1], B[0], B[1], op) + ' = ' + F(HM.slot(0), D) + ` ${op} ` + F(HM.slot(1), D))}</div>`,
            hint: `פי כמה צריך להגדיל כל מכנה כדי לקבל ${D}? פי אותו מספר ${c.g('הגדל', 'הגדילי')} את המונה.`,
            solution: [`${ex(A[0], A[1], D)} (פי ${D / A[1]})`, `${ex(B[0], B[1], D)} (פי ${D / B[1]})`],
          };
        }
        case 'est1': {
          let n1, d1, n2, d2, side;
          for (let t = 0; t < 80; t++) {
            [n1, d1, n2, d2] = pair();
            side = 2 * n1 > d1 && 2 * n2 > d2 ? 2 : 2 * n1 < d1 && 2 * n2 < d2 ? 0 : -1;
            if (side >= 0) break;
          }
          if (side < 0) { [n1, d1, n2, d2] = [3, 5, 2, 3]; side = 2; }
          const rel = ['קטן מ', 'שווה ל', 'גדול מ'];
          return {
            type: 'choice', keep: true, prompt: `בלי לחשב: הסכום ${m(exprF(n1, d1, n2, d2, PLUS))} הוא`,
            choices: rel.map((r) => `${r}-1`), answer: side,
            hint: `${c.g('השווה', 'השווי')} כל שבר לחצי.`,
            solution: [`${m(F(n1, d1))} ${side ? 'גדול' : 'קטן'} מחצי, וגם ${m(F(n2, d2))} ${side ? 'גדול' : 'קטן'} מחצי.`, `שני חצאים הם 1, ולכן הסכום ${rel[side]}-1.`],
          };
        }
        case 'missing':
        case 'missing3': {
          const L3 = kind === 'missing3';
          const form = L3 ? c.pick([2, 3, 3]) : c.pick([0, 1, 2]);
          const [n1, d1, n2, d2] = pair({ maxSum: !L3 || form === 2 }), D = lcm(d1, d2), s = (n1 * D) / d1 + (n2 * D) / d2;
          const box = HM.box(), sT = RX(s, D);
          // 0: a + ? = s   1: ? + b = s   2: s − ? = a   3: ? − a = b
          const expr = [F(n1, d1) + ' + ' + box + ' = ' + sT, box + ' + ' + F(n2, d2) + ' = ' + sT, sT + ' − ' + box + ' = ' + F(n1, d1), box + ' − ' + F(n1, d1) + ' = ' + F(n2, d2)][form];
          const res = form === 0 || form === 2 ? [n2, d2] : form === 1 ? [n1, d1] : [s, D];
          const known = form === 1 ? [n2, d2] : [n1, d1];
          const sol = form === 3
            ? [`המחוסר החסר שווה לסכום: ${m(exprF(n1, d1, n2, d2, PLUS))}`].concat(opSol(n1, d1, n2, d2, PLUS).slice(-2))
            : [`מוצאים את החסר בחיסור: ${m(sT + ' − ' + F(known[0], known[1]))}`].concat(opSol(...red(s, D), known[0], known[1], MIN).slice(-2));
          return {
            type: 'fraction', ...ans(...res), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
            hint: form === 3 ? `מאיזה מספר צריך להוריד ${m(F(n1, d1))} כדי לקבל ${m(F(n2, d2))}?` : `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה: חיסור.`,
            solution: sol.concat([`${c.g('בדוק', 'בדקי')} בעזרת הצבה בתרגיל.`]),
          };
        }
        case 'cmpExpr': {
          const form = c.pick([0, 0, 1, 2]);
          const [n1, d1, n2, d2] = pair({ maxSum: true });
          let n3 = n2, d3 = c.pick(LIST.filter((x) => x !== d2));
          if (n3 >= d3) n3 = d3 - 1;
          if (n3 * d2 === n2 * d3) { d3 += 1; }
          const A = form === 2 ? '1' : F(n1, d1), av = form === 2 ? 1 : n1 / d1, op = form === 0 ? PLUS : MIN;
          const left = A + ` ${op} ` + F(n2, d2), right = A + ` ${op} ` + F(n3, d3);
          const lv = op === PLUS ? av + n2 / d2 : av - n2 / d2, rv = op === PLUS ? av + n3 / d3 : av - n3 / d3;
          if (lv < 0 || rv < 0) {
            return { type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב.`, left: '1 − ' + F(n2, d2), right: '1 − ' + F(n3, d3), lv: 1 - n2 / d2, rv: 1 - n3 / d3, answer: sgn(d2 - n2, d2, d3 - n3, d3),
              hint: 'בשני הצדדים מורידים מ-1. מאיפה מורידים יותר?', solution: [`${m(F(n2, d2) + ' ' + ent(sgn(n2, d2, n3, d3)) + ' ' + F(n3, d3))}`, `מי שמוריד יותר, מקבל פחות. הסימן: ${ent(sgn(d2 - n2, d2, d3 - n3, d3))}`] };
          }
          const an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב.`, left, right, lv, rv, answer: an,
            hint: `מה זהה בשני הצדדים? ${c.g('השווה', 'השווי')} רק את מה ששונה.`,
            solution: [`${m(A)} מופיע בשני הצדדים. משווים את ${m(F(n2, d2))} ו-${m(F(n3, d3))}: ${m(F(n2, d2) + ' ' + ent(sgn(n2, d2, n3, d3)) + ' ' + F(n3, d3))}.`, op === PLUS ? `מוסיפים יותר, מקבלים יותר. הסימן: ${ent(an)}` : `מורידים יותר, נשאר פחות. הסימן: ${ent(an)}`],
          };
        }
        case 'pickErr': {
          const [n1, d1, n2, d2] = pair({ maxSum: true }), D = lcm(d1, d2), N = (n1 * D) / d1 + (n2 * D) / d2;
          const choices = vChoices([[N, D], [n1 + n2, d1 + d2], [n1 + n2, D], [(n1 * D) / d1 + n2, D]], (x, y) => m(F(x, y)));
          return {
            type: 'choice', prompt: `מה התוצאה הנכונה של ${m(exprF(n1, d1, n2, d2, PLUS))}?`, choices, answer: 0,
            hint: `${c.g('שים לב', 'שימי לב')}: כשמרחיבים, מכפילים ${b('גם את המונה וגם את המכנה')}.`,
            solution: opSol(n1, d1, n2, d2, PLUS),
          };
        }
        case 'three': {
          for (let t = 0; t < 120; t++) {
            const dens = c.sample([2, 3, 4, 5, 6, 8, 10], 3), D = dens.reduce((x, y) => lcm(x, y), 1);
            if (D > 30 || dens.some((x, i) => dens.some((y, j) => i !== j && y % x === 0)) && c.chance(0.5)) continue;
            const ns = dens.map((d) => nRed(c, d)), u = ns.map((n, i) => (n * D) / dens[i]);
            const ops = c.pick([[PLUS, PLUS], [PLUS, MIN], [MIN, PLUS]]);
            const s1 = ops[0] === PLUS ? u[0] + u[1] : u[0] - u[1];
            if (s1 <= 0) continue;
            const N = ops[1] === PLUS ? s1 + u[2] : s1 - u[2];
            if (N <= 0 || N % D === 0) continue;
            return {
              type: 'fraction', ...ans(N, D), accept: 'equal',
              prompt: `${c.g('חשב', 'חשבי')}: ${m(F(ns[0], dens[0]) + ` ${ops[0]} ` + F(ns[1], dens[1]) + ` ${ops[1]} ` + F(ns[2], dens[2]) + ' =')}`,
              hint: `מכנה משותף לשלושת השברים: ${D}. ${c.g('חשב', 'חשבי')} משמאל לימין.`,
              solution: [`נרחיב למכנה ${D}: ${m(F(u[0], D) + ` ${ops[0]} ` + F(u[1], D) + ` ${ops[1]} ` + F(u[2], D))}`, `${m(F(s1, D) + ` ${ops[1]} ` + F(u[2], D) + ' = ' + F(N, D))}`, fin(N, D, true)],
            };
          }
          return { type: 'fraction', answer: { n: 7, d: 12 }, prompt: `${c.g('חשב', 'חשבי')}: ${m(F(1, 2) + ' + ' + F(1, 3) + ' − ' + F(1, 4) + ' =')}`, hint: 'מכנה משותף: 12.', solution: [`${m(F(6, 12) + ' + ' + F(4, 12) + ' − ' + F(3, 12) + ' = ' + F(7, 12))}`] };
        }
        case 'tfEst': {
          const [n1, d1, n2, d2] = pair(), D = lcm(d1, d2), N = (n1 * D) / d1 + (n2 * D) / d2;
          const tgt = c.pick([[1, 1, '1'], [1, 2, m(F(1, 2))], [3, 2, m(WN(1, 1, 2))]]), T = (tgt[0] * D) / tgt[1];
          if (N === T || T % 1) return { type: 'tf', answer: true, prompt: `${m(F(3, 5) + ' + ' + F(4, 7))} גדול מ-1.`, hint: `${c.g('השווה', 'השווי')} כל שבר לחצי.`, solution: ['שני השברים גדולים מחצי, ולכן הסכום גדול מ-1. נכון.'] };
          const bigger = c.chance(0.5), truth = bigger ? N > T : N < T;
          return {
            type: 'tf', answer: truth, prompt: `הסכום ${m(exprF(n1, d1, n2, d2, PLUS))} ${bigger ? 'גדול' : 'קטן'} מ-${tgt[2]}.`,
            hint: `${c.g('נסה', 'נסי')} להעריך בעזרת חצי, ואם צריך, ${c.g('חשב', 'חשבי')} עם מכנה משותף.`,
            solution: opSol(n1, d1, n2, d2, PLUS).slice(0, -1).concat([`${m(RX(N, D))} ${N > T ? 'גדול' : 'קטן'} מ-${tgt[2]}. ${truth ? 'נכון.' : 'לא נכון.'}`]),
          };
        }
        case 'cmpSums': {
          const [a1, b1, a2, b2] = pair({ maxSum: true }), [c1, e1, c2, e2] = pair({ maxSum: true });
          const D1 = lcm(b1, b2), D2 = lcm(e1, e2), L = (a1 * D1) / b1 + (a2 * D1) / b2, R = (c1 * D2) / e1 + (c2 * D2) / e2;
          const left = exprF(a1, b1, a2, b2, PLUS), right = exprF(c1, e1, c2, e2, PLUS), an = sgn(L, D1, R, D2);
          return {
            type: 'compare', prompt: cmpQ(c), left, right, lv: L / D1, rv: R / D2, answer: an,
            hint: `${c.g('חשב', 'חשבי')} כל סכום בנפרד, ואז ${c.g('השווה', 'השווי')} את התוצאות.`,
            solution: [`${m(left + ' = ' + F(L, D1) + (RX(L, D1) !== F(L, D1) ? ' = ' + RX(L, D1) : ''))}`, `${m(right + ' = ' + F(R, D2) + (RX(R, D2) !== F(R, D2) ? ' = ' + RX(R, D2) : ''))}`].concat(cmpSol(...red(L, D1), ...red(R, D2)).slice(-1)),
          };
        }
        case 'storyAdd': {
          const usePart = c.chance(0.5), [n1, d1, n2, d2] = pair({ maxSum: true }), D = lcm(d1, d2), N = (n1 * D) / d1 + (n2 * D) / d2;
          const sc = c.scene(usePart ? PARTS : QTY), x = c.me;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal',
            prompt: usePart ? `${sc.two(x, m(F(n1, d1)), m(F(n2, d2)))}<br>${sc.sum(x)}` : `${sc.tot(x, Q(sc.u, n1, d1), Q(sc.u, n2, d2))}<br>${sc.qTot(x)}`,
            hint: `${c.g('חבר', 'חברי')} את שני השברים בעזרת מכנה משותף.`,
            solution: storySol(n1, d1, n2, d2, PLUS),
          };
        }
        case 'storyTot': {
          const [n1, d1, n2, d2] = pair(), D = lcm(d1, d2), N = (n1 * D) / d1 + (n2 * D) / d2;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal', prompt: storyQ(c, 'tot', n1, d1, n2, d2),
            hint: `${c.g('חבר', 'חברי')} את שני השברים בעזרת מכנה משותף.`,
            solution: storySol(n1, d1, n2, d2, PLUS),
          };
        }
        case 'storyLeft':
        case 'storyDiff': {
          const [n1, d1, n2, d2] = pair({ sub: true }), D = lcm(d1, d2), N = (n1 * D) / d1 - (n2 * D) / d2;
          return {
            type: 'fraction', ...ans(N, D), accept: 'equal', prompt: storyQ(c, kind === 'storyLeft' ? 'left' : 'cmp', n1, d1, n2, d2),
            hint: kind === 'storyLeft' ? `כדי למצוא כמה נשאר, ${c.g('חסר', 'חסרי')} את הכמות הקטנה מהגדולה.` : `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור: הגדול פחות הקטן.`,
            solution: storySol(n1, d1, n2, d2, MIN),
          };
        }
        case 'storyTwoLeft': {
          const [n1, d1, n2, d2] = pair({ maxSum: true }), D = lcm(d1, d2), a = (n1 * D) / d1, bb = (n2 * D) / d2, sc = c.scene(PARTS), x = c.me;
          return {
            type: 'fraction', ...ans(D - a - bb, D), accept: 'equal', prompt: `${sc.two(x, m(F(n1, d1)), m(F(n2, d2)))}<br>${sc.left(x)}`,
            hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים. השלם הוא ${m(F(D, D))}.`,
            solution: [`ביחד: ${m(exprF(n1, d1, n2, d2, PLUS) + ' = ' + F(a, D) + ' + ' + F(bb, D) + ' = ' + F(a + bb, D))}`, `נשאר: ${m('1 − ' + F(a + bb, D) + ' = ' + F(D, D) + ' − ' + F(a + bb, D) + ' = ' + F(D - a - bb, D))}`, fin(D - a - bb, D)],
          };
        }
        case 'storyUsed2': {
          for (let t = 0; t < 200; t++) {
            const [n2, d2, n3, d3] = pair({ maxSum: true }), L = lcm(d2, d3), S = (n2 * L) / d2 + (n3 * L) / d3;
            const dA = c.pick(HM.divisors(L).filter((x) => x > 1 && x <= 12)), nA = nRed(c, dA), wA = c.rnd(0, 2), fA = (nA * L) / dA;
            if (fA <= S) continue;
            const NA = wA * dA + nA, R = wA * L + fA - S, sc = c.scene(QTY), x = c.me;
            return Object.assign(fq(R, L), {
              prompt: `${sc.left(x, Q(sc.u, NA, dA), `${Q(sc.u, n2, d2)} ועוד ${Q(sc.u, n3, d3)}`)}<br>${sc.qLeft(x)}`,
              hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואז ${c.g('חסר', 'חסרי')} את הסכום מהכמות שהייתה בהתחלה.`,
              solution: [`${m(exprF(n2, d2, n3, d3, PLUS) + ' = ' + F(S, L))}`, `${m(MX(NA, dA) + ' − ' + F(S, L) + (dA !== L ? ' = ' + MX(wA * L + fA, L) + ' − ' + F(S, L) : '') + ' = ' + MX(R, L))}`, fin(R, L)],
            });
          }
          return { type: 'fraction', answer: { n: 1, d: 4 }, prompt: `${c.name} ${c.g('קנה', 'קנתה')} ${Q(MT, 11, 12)} סרט ו${c.g('השתמש', 'השתמשה')} ב-${Q(MT, 1, 3)} ועוד ${Q(MT, 1, 3)}. כמה מטר נשארו?`, hint: 'קודם חיבור, אחר כך חיסור.', solution: [`${m(F(1, 3) + ' + ' + F(1, 3) + ' = ' + F(8, 12))}`, `${m(F(11, 12) + ' − ' + F(8, 12) + ' = ' + F(3, 12) + ' = ' + F(1, 4))}`] };
        }
      }
    },
  });

  /* ========== חיבור וחיסור מספרים מעורבים (ב) ========== */
  // שלושה מכנים עם מכנה משותף קטן מספיק (לפחות זוג אחד שאינו כפולה)
  const dens3 = (c, list, maxL) => {
    for (let t = 0; t < 120; t++) {
      const ds = [c.pick(list), c.pick(list), c.pick(list)], D = ds.reduce((x, y) => lcm(x, y), 1);
      if (D > maxL || D === Math.max(...ds)) continue;
      return ds;
    }
    return [2, 3, 4];
  };

  HM.lesson({
    id: 'f-mixed-b',
    learn: (c) => [
      {
        title: 'מעורבים עם מכנים שונים',
        html: `${c.name} ${c.g('הלך', 'הלכה')} ${m(WN(2, 1, 2))} ק"מ עד המעיין ועוד ${m(WN(1, 1, 3))} ק"מ עד המערה.<br>השלמים: ${m('2 + 1 = 3')}. לשברים צריך ${b('מכנה משותף')}: ${m(F(1, 2) + ' = ' + F(3, 6))}, ${m(F(1, 3) + ' = ' + F(2, 6))}.<br>${m(F(3, 6) + ' + ' + F(2, 6) + ' = ' + F(5, 6))}, ולכן ${c.g('הוא הלך', 'היא הלכה')} ${m(WN(3, 5, 6))} ק"מ.`,
        visual: V.bars([{ n: 3, d: 6 }, { n: 2, d: 6 }], { labels: [{ n: 1, d: 2 }, { n: 1, d: 3 }] }),
      },
      {
        title: 'דוגמה פתורה: מעבר שלם',
        html: `כמה זה ${m(WN(2, 3, 4) + ' + ' + WN(1, 2, 3))}?`,
        steps: [
          `מכנה משותף: 12. ${m(WN(2, 3, 4) + ' = ' + WN(2, 9, 12))}, ${m(WN(1, 2, 3) + ' = ' + WN(1, 8, 12))}.`,
          `שלמים: ${m('2 + 1 = 3')}. שברים: ${m(F(9, 12) + ' + ' + F(8, 12) + ' = ' + F(17, 12) + ' = ' + WN(1, 5, 12))}.`,
          `${m('3 + ' + WN(1, 5, 12) + ' = ' + WN(4, 5, 12))} ✔`,
        ],
      },
      {
        title: 'חיסור מעורבים',
        html: `${m(WN(4, 5, 6) + ' − ' + WN(2, 3, 4))}: מכנה משותף 12.<br>${m(WN(4, 10, 12) + ' − ' + WN(2, 9, 12))}: שלמים ${m('4 − 2 = 2')}, שברים ${m(F(10, 12) + ' − ' + F(9, 12) + ' = ' + F(1, 12))}.<br>התוצאה: ${m(WN(2, 1, 12))}.<br>כאן השבר במחוסר גדול מהשבר במחסר, אז אפשר לחסר ישר.`,
        visual: V.bars([{ n: 10, d: 12 }, { n: 9, d: 12 }], { labels: [{ n: 5, d: 6 }, { n: 3, d: 4 }] }),
      },
      {
        title: 'סדר פעולות',
        html: `בלי סוגריים מחשבים ${b('משמאל לימין')}:<br>${m(WN(6, 5, 6) + ' − ' + WN(2, 1, 2) + ' + ' + WN(1, 1, 4))}<br>${m(' = ' + WN(4, 1, 3) + ' + ' + WN(1, 1, 4) + ' = ' + WN(5, 7, 12))}<br>עם סוגריים מחשבים ${b('קודם את הסוגריים')}:<br>${m(WN(6, 5, 6) + ' − (' + WN(2, 1, 2) + ' + ' + WN(1, 1, 4) + ')')}<br>${m(' = ' + WN(6, 5, 6) + ' − ' + WN(3, 3, 4) + ' = ' + WN(3, 1, 12))}<br>הסוגריים שינו את התוצאה!`,
      },
      {
        title: 'להשוות בלי לחשב',
        html: `• ${m(WN(3, 1, 2) + ' + ' + WN(1, 2, 3))} או ${m(WN(3, 1, 2) + ' + ' + WN(1, 3, 4))}? המחובר הראשון זהה, ו-${m(WN(1, 2, 3) + ' &lt; ' + WN(1, 3, 4))}, לכן התרגיל הראשון קטן יותר.<br>• ${m('6 − ' + WN(2, 1, 3))} או ${m('6 − ' + WN(2, 1, 4))}? בראשון מורידים יותר, אז נשאר פחות.<br>• ${m(WN(2, 1, 5) + ' + ' + WN(4, 1, 3))} ו-${m(WN(4, 1, 3) + ' + ' + WN(2, 1, 5))} שווים: בחיבור מותר להחליף סדר.`,
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('מצא', 'מצאי')} מכנה משותף לשברים, ו${c.g('חבר', 'חברי')} שלמים ושברים.`,
        quiz: { type: 'fraction', mixed: true, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(1, 1, 2) + ' + ' + WN(2, 1, 3) + ' =')}`, answer: { w: 3, n: 5, d: 6 },
          hint: 'מכנה משותף: 6.', solution: mixSol(3, 2, 7, 3, PLUS) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['addMix', 'subMix', 'slots', 'est', 'storyAdd', 'storySub', 'storyAdd']
        : level === 2 ? ['addCarry', 'subMix', 'orderOps', 'missingMix', 'cmpExpr', 'storyTot', 'storyLeft', 'storyDiff']
        : ['paren', 'parenTf', 'three', 'cmpSub', 'storyTwo', 'storyDiff', 'storyTwo'];
      const kind = c.pick(kinds);
      const LIST = level === 1 ? [2, 3, 4, 5] : level === 2 ? [2, 3, 4, 5, 6, 8, 9, 10] : [2, 3, 4, 5, 6, 8, 9, 10, 12];
      const MAXL = level === 1 ? 20 : level === 2 ? 30 : 36;
      const pr = () => coP(c, LIST, MAXL);
      const val = (N1, d1, N2, d2, op) => { const D = lcm(d1, d2); return [op === PLUS ? (N1 * D) / d1 + (N2 * D) / d2 : (N1 * D) / d1 - (N2 * D) / d2, D]; };
      switch (kind) {
        case 'addMix':
        case 'subMix':
        case 'addCarry':
        case 'storyAdd':
        case 'storySub':
        case 'storyTot':
        case 'storyLeft':
        case 'storyDiff': {
          const add = ['addMix', 'addCarry', 'storyAdd', 'storyTot'].indexOf(kind) >= 0, op = add ? PLUS : MIN;
          const [d1, d2] = pr();
          const carry = level === 1 ? false : kind === 'addCarry' || (kind === 'storyTot' && c.chance(0.6)) ? true : null;
          const [N1, N2] = mixPair(c, d1, d2, op, add ? { carry, w1: level === 1 ? 4 : 6 } : { w0: 2, w1: level === 1 ? 5 : 8, v1: level === 1 ? 3 : 5 });
          const [R, D] = val(N1, d1, N2, d2, op), story = kind.indexOf('story') === 0;
          return Object.assign(fq(R, D), {
            prompt: story ? storyQ(c, add ? 'tot' : kind === 'storyDiff' ? 'cmp' : 'left', N1, d1, N2, d2) : `${c.g('חשב', 'חשבי')}: ${m(exprM(N1, d1, N2, d2, op) + ' =')}`,
            visual: !story && level === 1 ? V.bars([{ n: N1 % d1, d: d1 }, { n: N2 % d2, d: d2 }], { labels: [{ n: N1 % d1, d: d1 }, { n: N2 % d2, d: d2 }] }) : undefined,
            hint: kind === 'storyDiff' ? `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור. מכנה משותף לשברים: ${D}.` : `מכנה משותף לשברים: ${D}. ${c.g(add ? 'חבר' : 'חסר', add ? 'חברי' : 'חסרי')} שלמים לחוד ושברים לחוד.`,
            solution: story ? mixStorySol(N1, d1, N2, d2, op) : mixSol(N1, d1, N2, d2, op),
          });
        }
        case 'slots': {
          const [d1, d2] = pr(), [N1, N2] = mixPair(c, d1, d2, PLUS, { carry: false, w1: 4 }), [R, D] = val(N1, d1, N2, d2, PLUS);
          return {
            type: 'number', answer: [Math.floor(R / D), R % D],
            prompt: `${c.g('השלם', 'השלימי')} את התוצאה במכנה ${D}:<div class="big">${m(exprM(N1, d1, N2, d2, PLUS) + ' = ' + HM.mixed(HM.slot(0), HM.slot(1), D))}</div>`,
            hint: `${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${D}, ו${c.g('חבר', 'חברי')} שלמים לחוד ושברים לחוד.`,
            solution: mixSol(N1, d1, N2, d2, PLUS).slice(0, -1).concat([`התשובה: ${m(MX(R, D))}`]),
          };
        }
        case 'est': {
          const [d1, d2] = pr(), sub = c.chance(0.3), op = sub ? MIN : PLUS;
          const [N1, N2] = mixPair(c, d1, d2, op, sub ? { w0: 3, w1: 8, v1: 3 } : { carry: c.chance(0.5), w1: 5 });
          const [R, D] = val(N1, d1, N2, d2, op), W = Math.floor(R / D), opts = [W - 1, W, W + 1].filter((k) => k >= 0);
          return {
            type: 'choice', keep: true, prompt: `בלי לחשב עד הסוף: התוצאה של ${m(exprM(N1, d1, N2, d2, op))} נמצאת`,
            choices: opts.map((k) => `בין ${k} ל-${k + 1}`), answer: opts.indexOf(W),
            hint: sub ? `${c.g('חסר', 'חסרי')} את השלמים. השבר שמורידים קטן מהשבר שיש?` : `${c.g('חבר', 'חברי')} את השלמים, ו${c.g('בדוק', 'בדקי')} בעזרת חצי: האם שני השברים יחד עוברים 1?`,
            solution: mixSol(N1, d1, N2, d2, op).slice(0, -1).concat([`התוצאה ${m(RX(R, D))} נמצאת בין ${W} ל-${W + 1}.`]),
          };
        }
        case 'missingMix': {
          const [dA, dX] = pr(), [NA, NX] = mixPair(c, dA, dX, PLUS, { carry: false, w1: 4 });
          const D = lcm(dA, dX), S = (NA * D) / dA + (NX * D) / dX, form = c.pick([0, 1, 2]);
          const sTxt = RX(S, D), aTxt = MX(NA, dA), xTxt = MX(NX, dX), box = HM.box();
          const expr = [aTxt + ' + ' + box + ' = ' + sTxt, sTxt + ' − ' + box + ' = ' + aTxt, box + ' − ' + aTxt + ' = ' + xTxt][form];
          const res = form === 2 ? [S, D] : [NX, dX];
          const sol = form === 2 ? [`המחוסר החסר שווה לסכום: ${m(aTxt + ' + ' + xTxt)}`].concat(mixSol(NA, dA, NX, dX, PLUS)) : [`מוצאים את החסר בחיסור: ${m(sTxt + ' − ' + aTxt)}`].concat(mixSol(...red(S, D), NA, dA, MIN));
          return {
            type: 'fraction', ...ans(...res), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
            hint: form === 2 ? `מאיזה מספר צריך להוריד ${m(aTxt)} כדי לקבל ${m(xTxt)}?` : `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה: חיסור.`,
            solution: sol.length > 4 ? [sol[0]].concat(sol.slice(-3)) : sol,
          };
        }
        case 'orderOps':
        case 'paren':
        case 'three': {
          for (let t = 0; t < 300; t++) {
            const ds = dens3(c, LIST, level === 2 ? 30 : 36), D = ds.reduce((x, y) => lcm(x, y), 1);
            const form = kind === 'orderOps' ? 0 : kind === 'three' ? 3 : c.pick([1, 1, 2, 4]);
            const big = form === 3 ? [1, 3] : [5, 9];
            const N = [rMix(c, ds[0], big[0], big[1]), rMix(c, ds[1], 1, 3), rMix(c, ds[2], 1, 3)];
            const u = N.map((x, i) => (x * D) / ds[i]), noB = (X, Y) => X > Y && X % D >= Y % D;
            const disp = N.map((x, i) => MX(x, ds[i]));
            let mid, R, expr, s1, s2;
            if (form === 0) { if (!noB(u[0], u[1])) continue; mid = u[0] - u[1]; R = mid + u[2]; expr = `${disp[0]} − ${disp[1]} + ${disp[2]}`; s1 = `משמאל לימין: ${m(MX(u[0], D) + ' − ' + MX(u[1], D) + ' = ' + MX(mid, D))}`; s2 = `${m(MX(mid, D) + ' + ' + MX(u[2], D) + ' = ' + MX(R, D))}`; }
            else if (form === 1) { mid = u[1] + u[2]; if (!noB(u[0], mid)) continue; R = u[0] - mid; expr = `${disp[0]} − (${disp[1]} + ${disp[2]})`; s1 = `קודם הסוגריים: ${m(MX(u[1], D) + ' + ' + MX(u[2], D) + ' = ' + MX(mid, D))}`; s2 = `${m(MX(u[0], D) + ' − ' + MX(mid, D) + ' = ' + MX(R, D))}`; }
            else if (form === 2) { if (!noB(u[1], u[2]) || u[1] - u[2] < D) continue; mid = u[1] - u[2]; R = u[0] + mid; expr = `${disp[0]} + (${disp[1]} − ${disp[2]})`; s1 = `קודם הסוגריים: ${m(MX(u[1], D) + ' − ' + MX(u[2], D) + ' = ' + MX(mid, D))}`; s2 = `${m(MX(u[0], D) + ' + ' + MX(mid, D) + ' = ' + MX(R, D))}`; }
            else if (form === 4) { if (!noB(u[0], u[1])) continue; mid = u[0] - u[1]; if (!noB(mid, u[2])) continue; R = mid - u[2]; expr = `${disp[0]} − ${disp[1]} − ${disp[2]}`; s1 = `משמאל לימין: ${m(MX(u[0], D) + ' − ' + MX(u[1], D) + ' = ' + MX(mid, D))}`; s2 = `${m(MX(mid, D) + ' − ' + MX(u[2], D) + ' = ' + MX(R, D))}`; }
            else { mid = u[0] + u[1]; R = mid + u[2]; expr = `${disp[0]} + ${disp[1]} + ${disp[2]}`; s1 = `${m(MX(u[0], D) + ' + ' + MX(u[1], D) + ' = ' + MX(mid, D))}`; s2 = `${m(MX(mid, D) + ' + ' + MX(u[2], D) + ' = ' + MX(R, D))}`; }
            if (R % D === 0) continue;
            return Object.assign(fq(R, D), {
              prompt: `${c.g('חשב', 'חשבי')}: ${m(expr + ' =')}`,
              hint: form === 1 || form === 2 ? `קודם הסוגריים. מכנה משותף לכל השברים: ${D}.` : form === 3 ? `מכנה משותף לכל השברים: ${D}. ${c.g('חבר', 'חברי')} שלמים לחוד ושברים לחוד.` : `בלי סוגריים ${c.g('חשב', 'חשבי')} משמאל לימין. מכנה משותף: ${D}.`,
              solution: [`נרחיב את כל השברים למכנה ${D}.`, s1, s2, fin(R, D)],
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 5, n: 7, d: 12 }, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(6, 5, 6) + ' − ' + WN(2, 1, 2) + ' + ' + WN(1, 1, 4) + ' =')}`, hint: 'משמאל לימין.', solution: [`${m(WN(6, 5, 6) + ' − ' + WN(2, 1, 2) + ' = ' + WN(4, 1, 3))}`, `${m(WN(4, 1, 3) + ' + ' + WN(1, 1, 4) + ' = ' + WN(5, 7, 12))}`] };
        }
        case 'parenTf': {
          const ds = dens3(c, [2, 3, 4, 5, 6, 8], 24), A = MX(rMix(c, ds[0], 6, 9), ds[0]), Bn = rMix(c, ds[1], 2, 4), Cn = rMix(c, ds[2], 1, 1);
          const B = MX(Bn, ds[1]), C = MX(Cn, ds[2]);
          const st = c.pick([
            [`${A} − ${B} + ${C} = ${A} − (${B} + ${C})`, false, `בצד שמאל מורידים את ${m(B)} ו${b('מוסיפים')} את ${m(C)}. בצד ימין מורידים ${b('גם')} את ${m(C)}. התוצאות שונות.`],
            [`${A} + ${B} − ${C} = ${A} + (${B} − ${C})`, true, `בשני הצדדים מוסיפים את ${m(B)} ומורידים את ${m(C)}, לכן התוצאות שוות.`],
            [`${A} − ${B} − ${C} = ${A} − (${B} + ${C})`, true, `להוריד את ${m(B)} ואחר כך את ${m(C)} זה כמו להוריד את שניהם יחד.`],
            [`${A} − (${B} − ${C}) = ${A} − ${B} − ${C}`, false, `בצד שמאל מורידים פחות מ-${m(B)}, ובצד ימין מורידים את ${m(B)} ועוד ${m(C)}. התוצאות שונות.`],
          ]);
          return {
            type: 'tf', answer: st[1], prompt: `בלי לחשב: האם השוויון נכון?<div class="big">${m(st[0])}</div>`,
            hint: `${c.g('חשוב', 'חשבי')}: מה מוסיפים ומה מורידים בכל צד?`,
            solution: [st[2], st[1] ? 'נכון.' : 'לא נכון.'],
          };
        }
        case 'cmpExpr':
        case 'cmpSub': {
          let [d1, d2] = pr(), form = kind === 'cmpSub' ? c.pick([1, 2, 2]) : c.pick([0, 0, 1, 3]);
          const A = rMix(c, d1, 6, 9);
          let B = 7, dC = 3, C = 4;
          for (let t = 0; t < 60; t++) {
            B = rMix(c, d2, 1, 4); dC = c.pick(LIST.filter((x) => x !== d2 && x > 2));
            C = Math.floor(B / d2) * dC + Math.min(dC - 1, Math.max(1, Math.round(((B % d2) * dC) / d2) + c.pick([-1, 1])));
            if (C * d2 !== B * dC && gcd(C % dC, dC) === 1) break;
          }
          if (C * d2 === B * dC) { B = 7; d2 = 2; }
          const W = Math.ceil(A / d1);
          let left, right, lv, rv, why;
          if (form === 0) { left = exprM(A, d1, B, d2, PLUS); right = exprM(A, d1, C, dC, PLUS); lv = A / d1 + B / d2; rv = A / d1 + C / dC; why = `המחובר ${m(MX(A, d1))} זהה, משווים רק את ${m(MX(B, d2))} ו-${m(MX(C, dC))}.`; }
          else if (form === 1) { left = exprM(A, d1, B, d2, MIN); right = exprM(A, d1, C, dC, MIN); lv = A / d1 - B / d2; rv = A / d1 - C / dC; why = 'מחסרים מאותו מספר. מי שמוריד יותר, מקבל פחות.'; }
          else if (form === 2) { left = W + ' − ' + MX(B, d2); right = W + ' − ' + MX(C, dC); lv = W - B / d2; rv = W - C / dC; why = `מחסרים מ-${W}. מי שמוריד יותר, מקבל פחות.`; }
          else { left = exprM(A, d1, B, d2, PLUS); right = exprM(B, d2, A, d1, PLUS); lv = A / d1 + B / d2; rv = lv; why = 'אותם מחוברים בסדר אחר. בחיבור מותר להחליף סדר.'; }
          const an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב עד הסוף.`, left, right, lv, rv, answer: an,
            hint: `מה זהה בשני הצדדים? ${c.g('השווה', 'השווי')} רק את מה ששונה.`,
            solution: [why].concat(form === 3 ? ['הסימן: ='] : [`${cmpSol((B % d2), d2, (C % dC), dC)[1]}`, `${m(MX(B, d2) + ' ' + ent(sgn(B, d2, C, dC)) + ' ' + MX(C, dC))}, ולכן הסימן: ${ent(an)}`]),
          };
        }
        case 'storyTwo': {
          for (let t = 0; t < 300; t++) {
            const ds = dens3(c, LIST, 36), D = ds.reduce((x, y) => lcm(x, y), 1);
            const N = [rMix(c, ds[0], 5, 9), rMix(c, ds[1], 1, 2), rMix(c, ds[2], 0, 2)];
            const u = N.map((x, i) => (x * D) / ds[i]), used = u[1] + u[2];
            if (!(u[0] > used && u[0] % D >= used % D) || (u[0] - used) % D === 0) continue;
            const sc = c.scene(QTY), x = c.me, R = u[0] - used, qs = N.map((x2, i) => Q(sc.u, x2, ds[i]));
            return Object.assign(fq(R, D), {
              prompt: `${sc.left(x, qs[0], `${qs[1]} ועוד ${qs[2]}`)}<br>${sc.qLeft(x)}`,
              hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואז ${c.g('חסר', 'חסרי')} את הסכום מהכמות שהייתה בהתחלה. מכנה משותף: ${D}.`,
              solution: [`נרחיב למכנה ${D}.`, `${m(MX(u[1], D) + ' + ' + MX(u[2], D) + ' = ' + MX(used, D))}`, `${m(MX(u[0], D) + ' − ' + MX(used, D) + ' = ' + MX(R, D))}`, fin(R, D)],
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 3, n: 1, d: 12 }, prompt: `${c.name} ${c.g('קנה', 'קנתה')} ${Q(MT, 41, 6)} סרט ו${c.g('השתמש', 'השתמשה')} ב-${Q(MT, 5, 2)} ועוד ${Q(MT, 5, 4)}. כמה מטר נשארו?`, hint: 'קודם חיבור, אחר כך חיסור.', solution: [`${m(WN(2, 1, 2) + ' + ' + WN(1, 1, 4) + ' = ' + WN(3, 3, 4))}`, `${m(WN(6, 5, 6) + ' − ' + WN(3, 3, 4) + ' = ' + WN(3, 1, 12))}`] };
        }
      }
    },
  });

  /* ========== חיסור בהמרה (א) ========== */
  // פתרון לחיסור N1/d1 − N2/d2 עם המרת שלם כשצריך
  function borrowSol(N1, d1, N2, d2) {
    const D = lcm(d1, d2), A = (N1 * D) / d1, B = (N2 * D) / d2, R = A - B;
    const wA = Math.floor(A / D), fA = A % D, fB = B % D, st = [], exps = [];
    if (N1 % d1 && d1 !== D) exps.push(exM(N1, d1, D));
    if (N2 % d2 && d2 !== D) exps.push(exM(N2, d2, D));
    if (exps.length) st.push(`מכנה משותף: ${D}. ${exps.join(' ו-')}`);
    let w1 = wA, f1 = fA;
    if (fA < fB) {
      w1 = wA - 1; f1 = fA + D;
      st.push((fA ? `${m(F(fA, D))} קטן מ-${m(F(fB, D))}, לכן` : 'אין שבר במחוסר, לכן') + ` ממירים שלם אחד ל-${m(F(D, D))}: ${m(MX(A, D) + ' = ' + HM.mixed(w1, f1, D))}.`);
    }
    const r1 = MX(R, D), r2 = RX(R, D);
    st.push(`שלמים מהשלמים ושברים מהשברים: ${m(HM.mixed(w1, f1, D) + ' − ' + MX(B, D) + ' = ' + r1 + (r1 === r2 ? '' : ' = ' + r2))}`);
    return st;
  }
  // תשובות שגויות נפוצות ל-W − w n/d (מחרוזות HTML)
  function borrowWrong(W, w, n, d) {
    const out = [];
    out.push(WN(W - w, n, d));                       // השאיר את השבר
    out.push(WN(W - w, d - n, d));                   // המיר בלי להוריד שלם
    if (d !== 10 && 10 - n > 0) out.push(W - w - 1 > 0 ? HM.mixed(W - w - 1, 10 - n, d) : F(10 - n, d)); // "פרט" 10 במקום שלם
    return out;
  }

  HM.lesson({
    id: 'f-borrow-a',
    learn: (c) => [
      {
        title: 'פיצה שלמה',
        html: `${c.name} ${c.g('חתך', 'חתכה')} פיצה שלמה ל-8 משולשים, ו${c.g('אכל', 'אכלה')} ${m(F(3, 8))} ממנה.<br>כמה נשאר? ${m('1 − ' + F(3, 8))}<br>הפיצה השלמה היא ${b('8 שמיניות')}: ${m('1 = ' + F(8, 8))}.<br>${m(F(8, 8) + ' − ' + F(3, 8) + ' = ' + F(5, 8))}. נשארו ${m(F(5, 8))} מהפיצה.`,
        visual: V.bars([{ n: 8, d: 8 }, { n: 5, d: 8 }], { labels: ['1', { n: 5, d: 8 }] }),
      },
      {
        title: 'שלם פחות שבר',
        html: `${m('4 − ' + F(2, 5))}: אין חמישיות במספר 4, אז ${b('ממירים שלם אחד')} לחמישיות:<br>${m('4 = 3 + ' + F(5, 5) + ' = ' + WN(3, 5, 5))}<br>${m(WN(3, 5, 5) + ' − ' + F(2, 5) + ' = ' + WN(3, 3, 5))}`,
        visual: V.bars([{ n: 5, d: 5 }, { n: 5, d: 5 }, { n: 5, d: 5 }, { n: 3, d: 5 }], { labels: ['1', '1', '1', { n: 3, d: 5 }] }),
      },
      {
        title: 'דוגמה פתורה',
        html: `כמה זה ${m('4 − ' + WN(2, 3, 5))}?`,
        steps: [
          `אין שבר במספר 4, לכן ממירים שלם אחד: ${m('4 = ' + WN(3, 5, 5))}.`,
          `${m(WN(3, 5, 5) + ' − ' + WN(2, 3, 5))}: שלמים ${m('3 − 2 = 1')}, שברים ${m(F(5, 5) + ' − ' + F(3, 5) + ' = ' + F(2, 5))}.`,
          `התוצאה: ${m(WN(1, 2, 5))} ✔`,
        ],
      },
      {
        title: 'זהירות, טעויות נפוצות',
        html: `ב-${m('4 − ' + WN(2, 3, 5))} התשובה ${b('אינה')}:<br>• ${m(WN(2, 3, 5))}: אי אפשר "להשאיר" את השבר, צריך להוריד אותו.<br>• ${m(WN(2, 2, 5))}: מי שממיר שלם צריך להוריד אותו מהשלמים (4 נהיה 3).<br>• ${m(WN(1, 7, 5))}: שלם אחד הוא ${m(F(5, 5))}, ${b('לא')} 10 חמישיות!`,
      },
      {
        title: 'דרך אחרת: השלמה',
        html: `אפשר לחשוב על ${m('4 − ' + WN(2, 3, 5))} כמו ${b('קפיצות על ישר המספרים')}: כמה צריך להוסיף ל-${m(WN(2, 3, 5))} כדי להגיע ל-4?<br>• עד 3: ${m(F(2, 5))}.<br>• מ-3 עד 4: עוד 1.<br>ביחד: ${m(WN(1, 2, 5))}.`,
        visual: jumpLine(5, 4, [13, 15, 20], { wholeOnly: true }),
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('המר', 'המירי')} שלם אחד לרבעים.`,
        quiz: { type: 'fraction', mixed: true, prompt: `${c.g('חשב', 'חשבי')}: ${m('3 − ' + F(1, 4) + ' =')}`, answer: { w: 2, n: 3, d: 4 },
          hint: `${m('3 = ' + WN(2, 4, 4))}`, solution: borrowSol(12, 4, 1, 4) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['oneMinus', 'wholeMinusFrac', 'convert', 'line1', 'shadeLeft', 'storyOne', 'storyWhole1']
        : level === 2 ? ['wholeMinusMixed', 'pickErr', 'missing', 'line', 'storyWhole', 'storyDiffW', 'storyWhole']
        : ['twoStep', 'cmpExpr', 'missingWhole', 'tfErr', 'storyTwoStep', 'storyDiffW', 'storyTwoStep'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5, 6, 8]) : c.pick([3, 4, 5, 6, 8, 10, 12]);
      const n = nRed(c, d);
      switch (kind) {
        case 'oneMinus':
          return {
            type: 'fraction', ...ans(d - n, d), accept: 'equal',
            prompt: `${c.g('חשב', 'חשבי')}: ${m('1 − ' + F(n, d) + ' =')}`, visual: V.bar(d, d),
            hint: `${c.g('כתוב', 'כתבי')} את 1 כשבר עם המכנה ${d}.`,
            solution: [`${m('1 = ' + F(d, d))}`, `${m(F(d, d) + ' − ' + F(n, d) + ' = ' + F(d - n, d))}`, fin(d - n, d)],
          };
        case 'wholeMinusFrac':
        case 'storyWhole1': {
          const W = c.rnd(2, 5), R = W * d - n;
          const story = kind === 'storyWhole1', sc = c.scene(QTY);
          return {
            type: 'fraction', ...ans(R, d), accept: 'equal',
            prompt: story ? `${sc.left(c.me, Q(sc.u, W * d, d), Q(sc.u, n, d))}<br>${sc.qLeft(c.me)}` : `${c.g('חשב', 'חשבי')}: ${m(W + ' − ' + F(n, d) + ' =')}`,
            visual: !story && W * d <= 40 ? jumpLine(d, W, [W * d, R], { hide: true, wholeOnly: true }) : undefined,
            hint: `${c.g('המר', 'המירי')} שלם אחד: ${m(W + ' = ' + HM.mixed(W - 1, d, d))}.`,
            solution: (story ? [`התרגיל: ${m(W + ' − ' + F(n, d))}`] : []).concat(borrowSol(W * d, d, n, d)),
          };
        }
        case 'convert': {
          const W = c.rnd(1, 6);
          return {
            type: 'number', answer: d,
            prompt: `${c.g('המר', 'המירי')} שלם אחד לשבר. ${c.g('השלם', 'השלימי')} את המונה:<div class="big">${m(W + ' = ' + HM.mixed(W - 1, HM.slot(0), d))}</div>`,
            hint: `כמה חלקים של ${m(F(1, d))} יש בשלם אחד?`,
            solution: [`בשלם אחד יש ${d} חלקים של ${m(F(1, d))}: ${m('1 = ' + F(d, d))}.`, `${m(W + ' = ' + HM.mixed(W - 1, d, d))}`],
          };
        }
        case 'line1':
        case 'line': {
          const dd = level === 1 ? c.pick([2, 3, 4, 5]) : c.pick([3, 4, 5, 6, 8]);
          const W = level === 1 ? c.rnd(2, 3) : c.rnd(3, Math.min(5, Math.floor(40 / dd)));
          const sub = level === 1 ? nRed(c, dd) : c.rnd(1, W - 2) * dd + nRed(c, dd);
          return {
            type: 'numberline', line: { min: 0, max: W, den: dd }, answer: (W * dd - sub) / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(W + ' − ' + MX(sub, dd))}.`,
            hint: `${c.g('התחל', 'התחילי')} ב-${W} ו${c.g('קפוץ', 'קפצי')} אחורה ${MX(sub, dd) === F(sub % dd, dd) ? '' : 'קודם את השלמים ואז '}את השבר. כל שנתה היא ${m(F(1, dd))}.`,
            solution: borrowSol(W * dd, dd, sub, dd).slice(-3).concat([`מסמנים את ${m(RX(W * dd - sub, dd))}.`]),
          };
        }
        case 'shadeLeft': {
          const dd = c.pick([4, 5, 6, 8, 10]), nn = c.rnd(1, dd - 1), sc = c.scene(PARTS);
          return {
            type: 'shade', shape: dd <= 8 && c.chance(0.5) ? 'pie' : 'bar', parts: dd, answer: dd - nn,
            prompt: `${sc.one(c.me, m(F(nn, dd)))}<br>הצורה היא השלם, והיא מחולקת ל-${dd} חלקים שווים. ${c.g('צבע', 'צבעי')} את החלק שנשאר.`,
            hint: `השלם הוא ${m(F(dd, dd))}. כמה חלקים נשארים אחרי שמורידים ${nn}?`,
            solution: [`${m('1 − ' + F(nn, dd) + ' = ' + F(dd, dd) + ' − ' + F(nn, dd) + ' = ' + F(dd - nn, dd))}`, `צובעים ${dd - nn} חלקים.`],
          };
        }
        case 'storyOne': {
          const sc = c.scene(PARTS);
          return {
            type: 'fraction', ...ans(d - n, d), accept: 'equal', prompt: `${sc.one(c.me, m(F(n, d)))}<br>${sc.left(c.me)}`,
            hint: `השלם הוא 1, כלומר ${m(F(d, d))}.`,
            solution: [`${m('1 − ' + F(n, d))}`, `${m(F(d, d) + ' − ' + F(n, d) + ' = ' + F(d - n, d))}`, fin(d - n, d)],
          };
        }
        case 'wholeMinusMixed':
        case 'storyWhole':
        case 'storyDiffW': {
          const W = level === 3 ? c.rnd(6, 12) : c.rnd(3, 8), w = c.rnd(1, W - 2), X = w * d + n, R = W * d - X;
          const story = kind !== 'wholeMinusMixed';
          return {
            type: 'fraction', ...ans(R, d), accept: 'equal',
            prompt: story ? storyQ(c, kind === 'storyWhole' ? 'left' : 'cmp', W * d, d, X, d) : `${c.g('חשב', 'חשבי')}: ${m(W + ' − ' + WN(w, n, d) + ' =')}`,
            hint: kind === 'storyDiffW' ? `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור. ${c.g('זכור', 'זכרי')} להמיר שלם אחד.` : `אין שבר במספר ${W}. ${c.g('המר', 'המירי')} שלם אחד ל-${m(F(d, d))}.`,
            solution: (story ? [`התרגיל: ${m(W + ' − ' + WN(w, n, d))}`] : []).concat(borrowSol(W * d, d, X, d)),
          };
        }
        case 'pickErr': {
          const W = c.rnd(3, 8), w = c.rnd(1, W - 2), R = W * d - (w * d + n);
          const right = MX(R, d), seen = {}, choices = [m(right)];
          seen[right] = 1;
          borrowWrong(W, w, n, d).forEach((x) => { if (!seen[x]) { seen[x] = 1; choices.push(m(x)); } });
          return {
            type: 'choice', prompt: `מה התוצאה הנכונה של ${m(W + ' − ' + WN(w, n, d))}?`, choices, answer: 0,
            hint: `${c.g('זכור', 'זכרי')}: שלם אחד הוא ${m(F(d, d))}, ומי שממיר אותו מוריד אחד מהשלמים.`,
            solution: borrowSol(W * d, d, w * d + n, d),
          };
        }
        case 'missing': {
          const W = c.rnd(2, 7), w = c.rnd(0, W - 2), X = w * d + n, R = W * d - X, form = c.pick([0, 1, 2]), box = HM.box();
          const expr = [W + ' − ' + box + ' = ' + MX(R, d), box + ' + ' + MX(X, d) + ' = ' + W, MX(X, d) + ' + ' + box + ' = ' + W][form];
          const res = form === 0 ? X : R;
          return {
            type: 'fraction', ...ans(res, d), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
            hint: `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה: ${m(W + ' − ' + MX(form === 0 ? R : X, d))}.`,
            solution: [`המספר החסר: ${m(W + ' − ' + MX(form === 0 ? R : X, d))}`].concat(borrowSol(W * d, d, form === 0 ? R : X, d).slice(-2)),
          };
        }
        case 'twoStep': {
          const [d1, d2] = c.chance(0.5) ? [d, d] : multPair(c, 12), D = lcm(d1, d2);
          for (let t = 0; t < 100; t++) {
            const W = c.rnd(5, 9), A = rMix(c, d1, 1, 3), B = rMix(c, d2, 0, 2), uA = (A * D) / d1, uB = (B * D) / d2, R = W * D - uA - uB;
            if (R <= 0) continue;
            return Object.assign(fq(R, D), {
              prompt: `${c.g('חשב', 'חשבי')}: ${m(W + ' − ' + MX(A, d1) + ' − ' + MX(B, d2) + ' =')}`,
              hint: `${c.g('חשב', 'חשבי')} משמאל לימין, או ${c.g('חבר', 'חברי')} קודם את שני המחסרים. ${c.g('זכור', 'זכרי')} להמיר שלם כשצריך.`,
              solution: [`אפשר לחבר קודם את המחסרים: ${m(MX(A, d1) + ' + ' + MX(B, d2) + ' = ' + MX(uA + uB, D))}`].concat(borrowSol(W * D, D, uA + uB, D).slice(-3)).slice(0, 4),
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 1, n: 1, d: 2 }, prompt: `${c.g('חשב', 'חשבי')}: ${m('5 − ' + WN(1, 3, 4) + ' − ' + WN(1, 3, 4) + ' =')}`, hint: 'חבר קודם את המחסרים.', solution: [`${m(WN(1, 3, 4) + ' + ' + WN(1, 3, 4) + ' = ' + WN(3, 2, 4))}`, `${m('5 − ' + WN(3, 2, 4) + ' = ' + WN(1, 2, 4) + ' = ' + WN(1, 1, 2))}`] };
        }
        case 'cmpExpr': {
          const W = c.rnd(3, 9), form = c.pick([0, 0, 1]);
          if (form === 0) {
            const [d1, d2] = c.sample([3, 4, 5, 6, 8, 10], 2), w = c.rnd(1, W - 2);
            let n1 = nRed(c, d1), n2 = nRed(c, d2);
            if (n1 * d2 === n2 * d1) n2 = n2 > 1 ? n2 - 1 : n2 + 1 < d2 ? n2 + 1 : n2;
            const lv = W - w - n1 / d1, rv = W - w - n2 / d2, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
            return {
              type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב עד הסוף.`,
              left: W + ' − ' + WN(w, n1, d1), right: W + ' − ' + WN(w, n2, d2), lv, rv, answer: an,
              hint: 'מורידים משני הצדדים מאותו מספר. מאיזה צד מורידים יותר?',
              solution: cmpSol(n1, d1, n2, d2).slice(1).concat([`מי שמוריד יותר, מקבל פחות. הסימן: ${ent(an)}`]),
            };
          }
          const w = c.rnd(1, W - 2), X = w * d + n, R = W * d - X, near = R + c.pick([-d, d, -1, 1, 0]);
          const Y = Math.max(1, near), lv = R / d, rv = Y / d, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c), left: W + ' − ' + WN(w, n, d), right: RX(Y, d), lv, rv, answer: an,
            hint: `${c.g('חשב', 'חשבי')} את צד שמאל (${c.g('זכור', 'זכרי')} להמיר שלם), ואז ${c.g('השווה', 'השווי')}.`,
            solution: borrowSol(W * d, d, X, d).slice(-1).concat([`${m(RX(R, d) + ' ' + ent(an) + ' ' + RX(Y, d))}`]),
          };
        }
        case 'missingWhole': {
          const W = c.rnd(4, 9), w = c.rnd(1, W - 2), X = w * d + n, Y = W * d - X;
          return {
            type: 'number', answer: W,
            prompt: `מה המספר החסר?<div class="big">${m(HM.box() + ' − ' + MX(X, d) + ' = ' + MX(Y, d))}</div>`,
            hint: 'המספר החסר הוא המחוסר. אפשר למצוא אותו בחיבור.',
            solution: [`המחוסר = המחסר + ההפרש: ${m(MX(X, d) + ' + ' + MX(Y, d))}`].concat(mixSol(X, d, Y, d, PLUS).slice(-3)),
          };
        }
        case 'tfErr': {
          const W = c.rnd(3, 9), w = c.rnd(1, W - 2), X = w * d + n, R = W * d - X;
          const wrong = borrowWrong(W, w, n, d), truth = c.chance(0.4), shown = truth ? MX(R, d) : c.pick(wrong);
          return {
            type: 'tf', answer: truth, prompt: `${m(W + ' − ' + WN(w, n, d) + ' = ' + shown)}`,
            hint: `${c.g('פתור', 'פתרי')} בעצמך: ${c.g('המר', 'המירי')} שלם אחד ל-${m(F(d, d))}.`,
            solution: borrowSol(W * d, d, X, d).concat([truth ? 'נכון.' : 'לא נכון.']),
          };
        }
        case 'storyTwoStep': {
          const [d1, d2] = c.chance(0.4) ? [d, d] : multPair(c, 12), D = lcm(d1, d2);
          for (let t = 0; t < 100; t++) {
            const W = c.rnd(5, 9), A = rMix(c, d1, 1, 3), B = rMix(c, d2, 0, 2), uA = (A * D) / d1, uB = (B * D) / d2, R = W * D - uA - uB;
            if (R <= 0 || (uA + uB) % D === 0) continue;
            const sc = c.scene(QTY), x = c.me;
            return Object.assign(fq(R, D), {
              prompt: `${sc.left(x, Q(sc.u, W, 1), `${Q(sc.u, A, d1)} ועוד ${Q(sc.u, B, d2)}`)}<br>${sc.qLeft(x)}`,
              hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואז ${c.g('חסר', 'חסרי')} מ-${W}. ${c.g('זכור', 'זכרי')} להמיר שלם.`,
              solution: [`${m(MX(A, d1) + ' + ' + MX(B, d2) + ' = ' + MX(uA + uB, D))}`].concat(borrowSol(W * D, D, uA + uB, D).slice(-3)).slice(0, 4),
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 1, n: 1, d: 2 }, prompt: `${c.name} ${c.g('קנה', 'קנתה')} ${Q(MT, 5, 1)} סרט ו${c.g('השתמש', 'השתמשה')} ב-${Q(MT, 7, 4)} ועוד ${Q(MT, 7, 4)}. כמה מטר נשארו?`, hint: 'קודם חיבור, אחר כך חיסור.', solution: [`${m(WN(1, 3, 4) + ' + ' + WN(1, 3, 4) + ' = ' + WN(3, 2, 4))}`, `${m('5 − ' + WN(3, 2, 4) + ' = ' + WN(1, 1, 2))}`] };
        }
      }
    },
  });

  /* ========== חיסור בהמרה (ב) ========== */
  // זוג מעורבים שבחיסור שלהם צריך להמיר שלם (השבר במחוסר קטן מהשבר במחסר)
  function brPair(c, d1, d2, o) {
    o = o || {};
    const D = lcm(d1, d2);
    for (let t = 0; t < 200; t++) {
      const N1 = rMix(c, d1, o.w0 || 3, o.w1 || 7), N2 = rMix(c, d2, o.v0 || 1, o.v1 || 4);
      const fA = ((N1 * D) / d1) % D, fB = ((N2 * D) / d2) % D;
      if (fA >= fB || Math.floor(N1 / d1) <= Math.floor(N2 / d2)) continue;
      return [N1, N2];
    }
    return [d1 * 5 + 1, d2 * 3 - 1];
  }
  // תשובות שגויות נפוצות לחיסור בהמרה (במכנה D): הפוך, בלי להוריד שלם, "פריטה" של 10
  function brWrong(A, B, D) {
    const wA = Math.floor(A / D), fA = A % D, wB = Math.floor(B / D), fB = B % D, out = [];
    out.push(WN(wA - wB, fB - fA, D));
    out.push(HM.mixed(wA - wB, fA + D - fB, D));
    if (D !== 10 && (fA + 10 - fB) % D && wA - 1 - wB > 0) out.push(HM.mixed(wA - 1 - wB, fA + 10 - fB, D));
    return out;
  }
  const storyB = (c, kind, N1, d1, N2, d2) => ({ prompt: storyQ(c, kind, N1, d1, N2, d2), solution: [`התרגיל: ${m(exprM(N1, d1, N2, d2, MIN))}`].concat(borrowSol(N1, d1, N2, d2)) });

  HM.lesson({
    id: 'f-borrow-b',
    learn: (c) => [
      {
        title: 'כשהשבר קטן מדי',
        html: `${c.name} ${c.g('קנה', 'קנתה')} ${m(WN(5, 1, 4))} מטר סרט ו${c.g('השתמש', 'השתמשה')} ב-${m(WN(2, 3, 4))} מטר.<br>כמה נשאר? ${m(WN(5, 1, 4) + ' − ' + WN(2, 3, 4))}<br>אי אפשר להוריד ${m(F(3, 4))} מ-${m(F(1, 4))}! לכן ${b('ממירים שלם אחד')} לרבעים: ${m(WN(5, 1, 4) + ' = ' + WN(4, 5, 4))}.`,
        visual: jumpLine(4, 6, [21, 13, 10], { wholeOnly: true }),
      },
      {
        title: 'דוגמה פתורה',
        html: `${m(WN(5, 1, 4) + ' − ' + WN(2, 3, 4))}`,
        steps: [
          `${m(F(1, 4))} קטן מ-${m(F(3, 4))}, לכן ממירים שלם אחד: ${m(WN(5, 1, 4) + ' = 4 + ' + F(4, 4) + ' + ' + F(1, 4) + ' = ' + WN(4, 5, 4))}.`,
          `${m(WN(4, 5, 4) + ' − ' + WN(2, 3, 4))}: שלמים ${m('4 − 2 = 2')}, שברים ${m(F(5, 4) + ' − ' + F(3, 4) + ' = ' + F(2, 4))}.`,
          `התוצאה: ${m(WN(2, 2, 4) + ' = ' + WN(2, 1, 2))} ✔`,
        ],
      },
      {
        title: 'מכנים שונים והמרה',
        html: `${m(WN(4, 1, 3) + ' − ' + WN(1, 3, 4))}`,
        steps: [
          `מכנה משותף: 12. ${m(WN(4, 4, 12) + ' − ' + WN(1, 9, 12))}`,
          `${m(F(4, 12))} קטן מ-${m(F(9, 12))}, לכן ממירים שלם: ${m(WN(4, 4, 12) + ' = ' + WN(3, 16, 12))}.`,
          `${m(WN(3, 16, 12) + ' − ' + WN(1, 9, 12) + ' = ' + WN(2, 7, 12))} ✔`,
        ],
      },
      {
        title: 'דרך אחרת: קפיצות',
        html: `כמה צריך להוסיף ל-${m(WN(2, 3, 4))} כדי להגיע ל-${m(WN(5, 1, 4))}?<br>• עד 3: ${m(F(1, 4))}.<br>• מ-3 עד 5: עוד 2.<br>• מ-5 עד ${m(WN(5, 1, 4))}: עוד ${m(F(1, 4))}.<br>ביחד: ${m('2 + ' + F(2, 4) + ' = ' + WN(2, 1, 2))}.`,
        visual: jumpLine(4, 6, [11, 12, 20, 21], { wholeOnly: true }),
      },
      {
        title: 'זהירות, טעויות נפוצות',
        html: `ב-${m(WN(6, 1, 5) + ' − ' + WN(2, 3, 5))} התשובה היא ${m(WN(3, 3, 5))}, ${b('ולא')}:<br>• ${m(WN(4, 2, 5))}: חיסרו "הפוך", ${m(F(3, 5) + ' − ' + F(1, 5))}. מורידים תמיד את המחסר מהמחוסר!<br>• ${m(WN(4, 3, 5))}: המירו שלם אבל שכחו להוריד אותו מהשלמים.<br>• ${m(HM.mixed(3, 8, 5))}: שלם אחד הוא ${m(F(5, 5))}, לא 10 חמישיות.`,
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('בדוק', 'בדקי')} קודם: האם צריך להמיר שלם?`,
        quiz: { type: 'fraction', mixed: true, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(3, 1, 3) + ' − ' + WN(1, 2, 3) + ' =')}`, answer: { w: 1, n: 2, d: 3 },
          hint: `${m(WN(3, 1, 3) + ' = ' + WN(2, 4, 3))}`, solution: borrowSol(10, 3, 5, 3) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['needBorrow', 'rename', 'sameDen', 'line', 'storySame', 'storySameCmp', 'storySame']
        : level === 2 ? ['unlikeMult', 'renameUnlike', 'pickErr', 'missing', 'storyMult', 'storyDiff', 'storyMult']
        : ['unlikeGen', 'chain', 'cmpExpr', 'missingSub', 'tfErr', 'storyTwoStep', 'storyDiffGen', 'storyTwoStep'];
      const kind = c.pick(kinds);
      const d = c.pick(level === 1 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10, 12]);
      const pm = () => { const [a, bb] = multPair(c, 12); return c.chance(0.5) ? [a, bb] : [bb, a]; };
      const pg = () => coP(c, [2, 3, 4, 5, 6, 8, 9, 10, 12], 36);
      switch (kind) {
        case 'needBorrow': {
          const need = c.chance(0.5);
          let [N1, N2] = brPair(c, d, d, { w0: 3, w1: 8 });
          if (!need) { const f1 = N1 % d, f2 = N2 % d; N1 = N1 - f1 + f2; N2 = N2 - f2 + f1; }
          return {
            type: 'tf', answer: need, prompt: `כדי לחשב את ${m(exprM(N1, d, N2, d, MIN))} צריך להמיר שלם אחד.`,
            hint: `${c.g('השווה', 'השווי')} את השבר במחוסר לשבר במחסר.`,
            solution: [`${m(F(N1 % d, d) + ' ' + ent(sgn(N1 % d, d, N2 % d, d)) + ' ' + F(N2 % d, d))}`, need ? 'השבר במחוסר קטן יותר, לכן צריך להמיר שלם. נכון.' : 'השבר במחוסר גדול יותר, אפשר לחסר ישר. לא נכון.'],
          };
        }
        case 'rename': {
          const w = c.rnd(1, 7), n = nRed(c, d);
          return {
            type: 'number', answer: n + d,
            prompt: `${c.g('המר', 'המירי')} שלם אחד לשבר. ${c.g('השלם', 'השלימי')} את המונה:<div class="big">${m(WN(w, n, d) + ' = ' + HM.mixed(w - 1, HM.slot(0), d))}</div>`,
            hint: `שלם אחד הוא ${m(F(d, d))}. ${c.g('הוסף', 'הוסיפי')} אותו ל-${m(F(n, d))}.`,
            solution: [`${m(WN(w, n, d) + ' = ' + (w - 1) + ' + ' + F(d, d) + ' + ' + F(n, d))}`, `${m(F(d, d) + ' + ' + F(n, d) + ' = ' + F(n + d, d))}, ולכן ${m(WN(w, n, d) + ' = ' + HM.mixed(w - 1, n + d, d))}`],
          };
        }
        case 'sameDen':
        case 'unlikeMult':
        case 'unlikeGen': {
          const [d1, d2] = kind === 'sameDen' ? [d, d] : kind === 'unlikeMult' ? pm() : pg();
          const [N1, N2] = brPair(c, d1, d2, level === 3 ? { w0: 4, w1: 9, v1: 5 } : {}), D = lcm(d1, d2), R = (N1 * D) / d1 - (N2 * D) / d2;
          return Object.assign(fq(R, D), {
            prompt: `${c.g('חשב', 'חשבי')}: ${m(exprM(N1, d1, N2, d2, MIN) + ' =')}`,
            hint: d1 === d2 ? `השבר ${m(F(N1 % d1, d1))} קטן מ-${m(F(N2 % d2, d2))}. ${c.g('המר', 'המירי')} שלם אחד.` : `קודם מכנה משותף (${D}). אחר כך ${c.g('בדוק', 'בדקי')} אם צריך להמיר שלם.`,
            solution: borrowSol(N1, d1, N2, d2),
          });
        }
        case 'line': {
          const dd = c.pick([3, 4, 5]), w1 = c.rnd(2, 4), n1 = c.rnd(1, dd - 2), n2 = c.rnd(n1 + 1, dd - 1);
          const w2 = c.rnd(1, w1 - 1), N1 = w1 * dd + n1, N2 = w2 * dd + n2, R = N1 - N2;
          return {
            type: 'numberline', line: { min: 0, max: w1 + 1, den: dd }, answer: R / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(exprM(N1, dd, N2, dd, MIN))}.`,
            hint: `${c.g('התחל', 'התחילי')} ב-${m(MX(N1, dd))} ו${c.g('קפוץ', 'קפצי')} אחורה ${HM.cnt(w2, 'שלם', 'שלמים')} ועוד ${HM.cnt(n2, 'שנתה', 'שנתות', true)}.`,
            solution: borrowSol(N1, dd, N2, dd).slice(-2).concat([`מסמנים את ${m(RX(R, dd))}.`]),
          };
        }
        case 'renameUnlike': {
          const [d1, d2] = pm(), [N1, N2] = brPair(c, d1, d2), D = lcm(d1, d2), A = (N1 * D) / d1, B = (N2 * D) / d2;
          const wA = Math.floor(A / D), wB = Math.floor(B / D);
          return {
            type: 'number', answer: [(A % D) + D, B % D],
            prompt: `${c.g('הרחב', 'הרחיבי')} למכנה ${D} ו${c.g('המר', 'המירי')} שלם אחד במחוסר:<div class="big">${m(exprM(N1, d1, N2, d2, MIN) + ' = ' + HM.mixed(wA - 1, HM.slot(0), D) + ' − ' + HM.mixed(wB, HM.slot(1), D))}</div>`,
            hint: `קודם ${c.g('הרחב', 'הרחיבי')} את שני השברים למכנה ${D}. אחר כך ${c.g('הוסף', 'הוסיפי')} ${m(F(D, D))} לשבר במחוסר.`,
            solution: borrowSol(N1, d1, N2, d2).slice(0, -1),
          };
        }
        case 'pickErr':
        case 'tfErr': {
          const [d1, d2] = kind === 'pickErr' ? (c.chance(0.5) ? [d, d] : pm()) : pg();
          const [N1, N2] = brPair(c, d1, d2), D = lcm(d1, d2), A = (N1 * D) / d1, B = (N2 * D) / d2, R = A - B;
          const right = MX(R, D), wrong = brWrong(A, B, D).filter((x) => x !== right);
          if (kind === 'pickErr') {
            const seen = {}, choices = [m(right)];
            seen[right] = 1;
            wrong.forEach((x) => { if (!seen[x]) { seen[x] = 1; choices.push(m(x)); } });
            return {
              type: 'choice', prompt: `מה התוצאה הנכונה של ${m(exprM(N1, d1, N2, d2, MIN))}?`, choices, answer: 0,
              hint: `${c.g('זכור', 'זכרי')}: מורידים את השבר של המחסר מהשבר של המחוסר. אם הוא קטן מדי, ממירים שלם אחד.`,
              solution: borrowSol(N1, d1, N2, d2),
            };
          }
          const truth = c.chance(0.4) || !wrong.length, shown = truth ? right : c.pick(wrong);
          return {
            type: 'tf', answer: truth, prompt: `${m(exprM(N1, d1, N2, d2, MIN) + ' = ' + shown)}`,
            hint: `${c.g('פתור', 'פתרי')} בעצמך ו${c.g('השווה', 'השווי')}. ${c.g('שים', 'שימי')} לב להמרה.`,
            solution: borrowSol(N1, d1, N2, d2).slice(0, 4).concat([truth ? 'נכון.' : 'לא נכון.']),
          };
        }
        case 'missing':
        case 'missingSub': {
          const [d1, d2] = kind === 'missing' ? pm() : pg();
          const [N1, N2] = brPair(c, d1, d2), D = lcm(d1, d2), A = (N1 * D) / d1, B = (N2 * D) / d2, R = A - B;
          const form = kind === 'missing' ? c.pick([0, 1]) : c.pick([0, 2, 2]), box = HM.box(), rT = RX(R, D), aT = MX(N1, d1), bT = MX(N2, d2);
          // 0: A − ? = R   1: ? + B = A   2: ? − B = R
          const expr = [aT + ' − ' + box + ' = ' + rT, box + ' + ' + bT + ' = ' + aT, box + ' − ' + bT + ' = ' + rT][form];
          if (form === 2) {
            return {
              type: 'fraction', ...ans(A, D), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
              hint: 'המספר החסר הוא המחוסר. אפשר למצוא אותו בחיבור.',
              solution: [`המחוסר = המחסר + ההפרש: ${m(bT + ' + ' + rT)}`].concat(mixSol(N2, d2, ...red(R, D), PLUS).slice(-3)),
            };
          }
          const res = form === 0 ? red(B, D) : red(R, D);
          return {
            type: 'fraction', ...ans(...res), accept: 'equal', prompt: `מה המספר החסר?<div class="big">${m(expr)}</div>`,
            hint: `${c.g('השתמש', 'השתמשי')} בפעולה ההפוכה: חיסור. ${c.g('שים', 'שימי')} לב להמרה.`,
            solution: [`המספר החסר: ${m(aT + ' − ' + (form === 0 ? rT : bT))}`].concat(borrowSol(N1, d1, ...(form === 0 ? red(R, D) : [N2, d2])).slice(-3)),
          };
        }
        case 'chain': {
          for (let t = 0; t < 300; t++) {
            const ds = c.chance(0.5) ? chain3(c) : [c.pick([2, 3, 4]), c.pick([3, 4, 6]), c.pick([2, 4, 6])], D = ds.reduce((x, y) => lcm(x, y), 1);
            if (D > 24) continue;
            const add = c.chance(0.35), N = [rMix(c, ds[0], 6, 9), rMix(c, ds[1], 1, 3), rMix(c, ds[2], 1, 3)], u = N.map((x, i) => (x * D) / ds[i]);
            const mid = add ? u[0] + u[1] : u[0] - u[1], R = mid - u[2];
            if (R <= 0 || R % D === 0) continue;
            const br1 = !add && u[0] % D < u[1] % D, br2 = mid % D < u[2] % D;
            if (!br1 && !br2) continue;
            const op1 = add ? PLUS : MIN, note = (x) => (x ? ' (עם המרת שלם)' : '');
            return Object.assign(fq(R, D), {
              prompt: `${c.g('חשב', 'חשבי')}: ${m(MX(N[0], ds[0]) + ` ${op1} ` + MX(N[1], ds[1]) + ' − ' + MX(N[2], ds[2]) + ' =')}`,
              hint: `${c.g('חשב', 'חשבי')} משמאל לימין, במכנה ${D}. ${c.g('בדוק', 'בדקי')} בכל חיסור אם צריך להמיר שלם.`,
              solution: [`נרחיב את כל השברים למכנה ${D}.`, `${m(MX(u[0], D) + ` ${op1} ` + MX(u[1], D) + ' = ' + MX(mid, D))}${note(br1)}`, `${m(MX(mid, D) + ' − ' + MX(u[2], D) + ' = ' + MX(R, D))}${note(br2)}`, fin(R, D)],
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 1, n: 3, d: 4 }, prompt: `${c.g('חשב', 'חשבי')}: ${m(WN(6, 1, 4) + ' − ' + WN(2, 3, 4) + ' − ' + WN(1, 3, 4) + ' =')}`, hint: 'משמאל לימין.', solution: [`${m(WN(6, 1, 4) + ' − ' + WN(2, 3, 4) + ' = ' + WN(3, 2, 4))}`, `${m(WN(3, 2, 4) + ' − ' + WN(1, 3, 4) + ' = ' + WN(1, 3, 4))}`] };
        }
        case 'cmpExpr': {
          const [d1, d2] = pg(), [N1, N2] = brPair(c, d1, d2), D = lcm(d1, d2), R = (N1 * D) / d1 - (N2 * D) / d2;
          if (c.chance(0.5)) {
            const Y = Math.max(1, R + c.pick([-D, D, -1, 1, 0])), lv = R / D, rv = Y / D, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
            return {
              type: 'compare', prompt: cmpQ(c), left: exprM(N1, d1, N2, d2, MIN), right: RX(Y, D), lv, rv, answer: an,
              hint: `${c.g('חשב', 'חשבי')} את התרגיל (${c.g('שים', 'שימי')} לב להמרה), ואז ${c.g('השווה', 'השווי')}.`,
              solution: borrowSol(N1, d1, N2, d2).slice(-2).concat([`${m(RX(R, D) + ' ' + ent(an) + ' ' + RX(Y, D))}`]),
            };
          }
          let N3 = N2 + c.pick([-1, 1]);
          if (N3 % d2 === 0) N3 = N2 + (N3 < N2 ? 1 : -1) * 2;
          if (N3 % d2 === 0 || N3 <= 0) N3 = N2 + d2;
          const lv = N1 / d1 - N2 / d2, rv = N1 / d1 - N3 / d2, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c) + `<br>${c.g('נסה', 'נסי')} בלי לחשב.`, left: exprM(N1, d1, N2, d2, MIN), right: exprM(N1, d1, N3, d2, MIN), lv, rv, answer: an,
            hint: 'המחוסר זהה בשני הצדדים. מאיזה צד מורידים יותר?',
            solution: [`${m(MX(N2, d2) + ' ' + ent(sgn(N2, d2, N3, d2)) + ' ' + MX(N3, d2))}`, `מי שמוריד יותר, מקבל פחות. הסימן: ${ent(an)}`],
          };
        }
        case 'storySame':
        case 'storySameCmp': {
          const [N1, N2] = brPair(c, d, d, { w0: 3, w1: 6, v1: 3 }), R = N1 - N2;
          return Object.assign(fq(R, d), storyB(c, kind === 'storySame' ? 'left' : 'cmp', N1, d, N2, d), {
            hint: kind === 'storySame' ? `${c.g('חסר', 'חסרי')}. השבר ${m(F(N1 % d, d))} קטן מ-${m(F(N2 % d, d))}, אז ${c.g('המר', 'המירי')} שלם אחד.` : `"בכמה יותר" ${c.g('מוצא', 'מוצאת')} בחיסור. ${c.g('המר', 'המירי')} שלם אחד אם צריך.`,
          });
        }
        case 'storyMult':
        case 'storyDiff':
        case 'storyDiffGen': {
          const [d1, d2] = kind === 'storyDiffGen' ? pg() : pm(), [N1, N2] = brPair(c, d1, d2, kind === 'storyDiffGen' ? { w0: 4, w1: 9, v1: 5 } : {}), D = lcm(d1, d2), R = (N1 * D) / d1 - (N2 * D) / d2;
          return Object.assign(fq(R, D), storyB(c, kind === 'storyMult' ? 'left' : 'cmp', N1, d1, N2, d2), {
            hint: `${kind === 'storyMult' ? 'כדי למצוא כמה נשאר,' : '"בכמה יותר"?'} ${c.g('חסר', 'חסרי')} במכנה משותף ${D}, ו${c.g('המר', 'המירי')} שלם אם צריך.`,
          });
        }
        case 'storyTwoStep': {
          for (let t = 0; t < 300; t++) {
            const ds = c.chance(0.5) ? chain3(c) : dens3(c, [2, 3, 4, 6], 12), D = ds.reduce((x, y) => lcm(x, y), 1);
            const N = [rMix(c, ds[0], 6, 9), rMix(c, ds[1], 1, 3), rMix(c, ds[2], 0, 2)], u = N.map((x, i) => (x * D) / ds[i]), used = u[1] + u[2];
            if (!(u[0] > used && u[0] % D < used % D) || (u[0] - used) % D === 0) continue;
            const sc = c.scene(QTY), x = c.me, R = u[0] - used;
            return Object.assign(fq(R, D), {
              prompt: `${sc.left(x, Q(sc.u, N[0], ds[0]), `${Q(sc.u, N[1], ds[1])} ועוד ${Q(sc.u, N[2], ds[2])}`)}<br>${sc.qLeft(x)}`,
              hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואז ${c.g('חסר', 'חסרי')} מהכמות שהייתה בהתחלה. ${c.g('זכור', 'זכרי')} להמיר שלם.`,
              solution: [`${m(MX(u[1], D) + ' + ' + MX(u[2], D) + ' = ' + MX(used, D))}`].concat(borrowSol(u[0], D, used, D).slice(-3)),
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 3, n: 7, d: 12 }, prompt: `${c.name} ${c.g('קנה', 'קנתה')} ${Q(MT, 25, 4)} סרט ו${c.g('השתמש', 'השתמשה')} ב-${Q(MT, 5, 3)} ועוד ${Q(MT, 1, 1)}. כמה מטר נשארו?`, hint: 'קודם חיבור, אחר כך חיסור עם המרה.', solution: [`${m(WN(1, 2, 3) + ' + 1 = ' + WN(2, 2, 3))}`, `${m(WN(6, 1, 4) + ' − ' + WN(2, 2, 3) + ' = ' + WN(6, 3, 12) + ' − ' + WN(2, 8, 12) + ' = ' + WN(3, 7, 12))}`] };
        }
      }
    },
  });

  /* ========== כפל שבר במספר שלם ========== */
  // כמות שחוזרת k פעמים (A = כמות עם יחידה)
  const REP = [
    { tags: ['baking'], u: KG, t: (x, k, A) => `בכל עוגה ${x.name} ${x.g('שם', 'שמה')} ${A} קמח. ${x.g('הוא', 'היא')} ${x.g('אפה', 'אפתה')} ${k} עוגות.`, q: (x) => `כמה ק"ג קמח ${x.g('השתמש', 'השתמשה')} ${x.name} בסך הכול?` },
    { tags: ['sport'], u: KM, t: (x, k, A) => `בכל אימון ${x.name} ${x.g('רץ', 'רצה')} ${A}. השבוע ${x.g('הוא', 'היא')} ${x.g('התאמן', 'התאמנה')} ${k} פעמים.`, q: (x) => `כמה ק"מ ${x.g('רץ', 'רצה')} ${x.name} השבוע?` },
    { tags: ['animals'], u: KG, t: (x, k, A) => `הכלב של ${x.name} אוכל ${A} מזון בכל יום.`, q: (x, k) => `כמה ק"ג מזון הוא אוכל ב-${k} ימים?` },
    { tags: ['music'], u: HR, t: (x, k, A) => `${x.name} ${x.g('מתאמן', 'מתאמנת')} בתופים ${A} בכל יום.`, q: (x, k) => `כמה שעות ${x.g('הוא מתאמן', 'היא מתאמנת')} ב-${k} ימים?` },
    { tags: ['games'], u: HR, t: (x, k, A) => `כל שלב במשחק לוקח ל${x.name} ${A}. ${x.g('הוא', 'היא')} ${x.g('השלים', 'השלימה')} ${k} שלבים.`, q: (x) => `כמה שעות ${x.g('שיחק', 'שיחקה')} ${x.name} בסך הכול?` },
    { tags: ['reading'], u: HR, t: (x, k, A) => `${x.name} ${x.g('קורא', 'קוראת')} ${A} בכל ערב.`, q: (x, k) => `כמה שעות ${x.g('הוא קורא', 'היא קוראת')} ב-${k} ערבים?` },
    { tags: ['nature'], u: KM, t: (x, k, A) => `בטיול השנתי הכיתה של ${x.name} הלכה ${A} בכל בוקר.`, q: (x, k) => `כמה ק"מ הלכה הכיתה ב-${k} בקרים?` },
    { tags: ['space'], u: LT, t: (x, k, A) => `לכל טיל מים ${x.name} ${x.g('צריך', 'צריכה')} ${A} מים.`, q: (x, k) => `כמה ליטר מים ${x.g('הוא צריך', 'היא צריכה')} ל-${k} טילים?` },
    { tags: ['art'], u: MT, t: (x, k, A) => `לכל כרזה ${x.name} ${x.g('צריך', 'צריכה')} ${A} סרט.`, q: (x, k) => `כמה מטר סרט ${x.g('הוא צריך', 'היא צריכה')} ל-${k} כרזות?` },
    { tags: ['tech'], u: MT, t: (x, k, A) => `כל רובוט צריך כבל באורך ${A}. ${x.name} בונה ${k} רובוטים.`, q: (x) => `כמה מטר כבל ${x.g('הוא צריך', 'היא צריכה')}?` },
    { tags: ['kpop'], u: HR, t: (x, k, A) => `${x.name} ${x.g('לומד', 'לומדת')} ריקודים של להקת קיי-פופ. כל ריקוד דורש ${A} של תרגול.`, q: (x, k) => `כמה שעות תרגול צריך בשביל ${k} ריקודים?` },
    { tags: ['magic'], u: LT, t: (x, k, A) => `בשיעור שיקויים כל שיקוי צריך ${A} מי ירח. ${x.name} ${x.g('מכין', 'מכינה')} ${k} שיקויים.`, q: (x) => `כמה ליטר מי ירח ${x.g('הוא צריך', 'היא צריכה')}?` },
    { tags: ['squishy'], u: MT, t: (x, k, A) => `כל קופסת סקווישים תופסת ${A} על המדף של ${x.name}. ${x.g('יש לו', 'יש לה')} ${k} קופסאות.`, q: () => 'כמה מטר מהמדף תופסות הקופסאות?' },
  ];
  // k אנשים, כל אחד לוקח A (שבר) מעצם אחד — כמה עצמים בסך הכול
  const EACH = [
    { tags: ['baking'], t: (x, k, A) => `${x.name} ${x.g('הזמין', 'הזמינה')} ${k} חברים לפיצה. כל אחד מהם אכל ${A} פיצה.`, q: 'כמה פיצות אכלו החברים יחד?' },
    { tags: ['sport'], t: (x, k, A) => `אחרי המשחק כל אחד מ-${k} השחקנים בקבוצה של ${x.name} שתה ${A} בקבוק מים.`, q: 'כמה בקבוקים שתו השחקנים יחד?' },
    { tags: ['nature'], t: (x, k, A) => `בטיול כל אחד מ-${k} הילדים בקבוצה של ${x.name} שתה ${A} בקבוק מים.`, q: 'כמה בקבוקי מים שתו הילדים יחד?' },
    { tags: ['animals'], t: (x, k, A) => `בגן החיות ${x.name} ${x.g('ראה', 'ראתה')} ${k} קופים. כל קוף אכל ${A} אשכול בננות.`, q: 'כמה אשכולות בננות אכלו הקופים יחד?' },
    { tags: ['art'], t: (x, k, A) => `לכל אחד מ-${k} הציורים ${x.name} ${x.g('השתמש', 'השתמשה')} ב-${A} שפופרת צבע.`, q: (x) => `בכמה שפופרות צבע ${x.g('השתמש', 'השתמשה')} ${x.name} בסך הכול?` },
    { tags: ['magic'], t: (x, k, A) => `בבית הספר לקוסמים כל אחד מ-${k} התלמידים בכיתה של ${x.name} שתה ${A} בקבוק שיקוי.`, q: 'כמה בקבוקי שיקוי שתו התלמידים יחד?' },
    { tags: ['kpop'], t: (x, k, A) => `בהופעת הקיי-פופ כל אחד מ-${k} החברים של ${x.name} שתה ${A} בקבוק מיץ.`, q: 'כמה בקבוקי מיץ שתו החברים יחד?' },
    { tags: ['baking'], t: (x, k, A) => `${x.name} ${x.g('אפה', 'אפתה')} עוגות זהות, ו${x.g('נתן', 'נתנה')} לכל אחד מ-${k} השכנים ${A} עוגה.`, q: (x) => `כמה עוגות ${x.g('חילק', 'חילקה')} ${x.name} בסך הכול?` },
  ];
  // הייתה כמות W, ו-k פעמים לקחו ממנה A — כמה נשאר
  const LEFTT = [
    { tags: ['baking'], u: KG, t: (x, W, k, A) => `בשק היו ${W} ק"ג קמח. ${x.name} ${x.g('אפה', 'אפתה')} ${k} עוגות, ובכל אחת ${x.g('שם', 'שמה')} ${A} קמח.`, q: 'כמה ק"ג קמח נשארו בשק?' },
    { tags: ['sport'], u: LT, t: (x, W, k, A) => `בצידנית של הקבוצה של ${x.name} היו ${W} ליטר מים. כל אחד מ-${k} השחקנים שתה ${A}.`, q: 'כמה ליטר מים נשארו בצידנית?' },
    { tags: ['animals'], u: KG, t: (x, W, k, A) => `בשק היו ${W} ק"ג מזון לכלב של ${x.name}. הכלב אוכל ${A} בכל יום.`, q: (k) => `כמה ק"ג מזון נשארו בשק אחרי ${k} ימים?` },
    { tags: ['art', 'squishy'], u: MT, t: (x, W, k, A) => `ל${x.name} היה גליל סרט באורך ${W} מטר. ${x.g('הוא', 'היא')} ${x.g('גזר', 'גזרה')} ממנו ${k} חתיכות, כל אחת באורך ${A}.`, q: 'כמה מטר סרט נשארו בגליל?' },
    { tags: ['magic'], u: LT, t: (x, W, k, A) => `בקדרה של ${x.name} היו ${W} ליטר שיקוי. כל אחד מ-${k} התלמידים לקח ${A}.`, q: 'כמה ליטר שיקוי נשארו בקדרה?' },
    { tags: ['tech', 'space'], u: MT, t: (x, W, k, A) => `ל${x.name} היה כבל באורך ${W} מטר. ${x.g('הוא', 'היא')} ${x.g('חתך', 'חתכה')} ממנו ${k} חתיכות לרובוטים, כל חתיכה באורך ${A}.`, q: 'כמה מטר כבל נשארו?' },
    { tags: ['reading', 'games', 'nature'], u: HR, t: (x, W, k, A) => `${x.name} ${x.g('החליט', 'החליטה')} לקרוא ${W} שעות בחופשה. ${x.g('הוא', 'היא')} כבר ${x.g('קרא', 'קראה')} ${k} ערבים, ${A} בכל ערב.`, q: 'כמה שעות קריאה נשארו?' },
    { tags: ['music', 'kpop'], u: HR, t: (x, W, k, A) => `${x.name} ${x.g('תכנן', 'תכננה')} ${W} שעות לחזרות על ריקוד לקראת ההופעה. ${x.g('הוא', 'היא')} כבר ${x.g('התאמן', 'התאמנה')} ${k} פעמים, ${A} בכל פעם.`, q: 'כמה שעות חזרות נשארו?' },
  ];
  // שני ילדים: k1 פעמים A1 לעומת k2 פעמים A2
  const CMPT = [
    { tags: ['sport'], t: (x, y, k1, A1, k2, A2) => `${x.name} ${x.g('רץ', 'רצה')} ${k1} הקפות של ${A1}, ו${y.name} ${y.g('רץ', 'רצה')} ${k2} הקפות של ${A2}.`, q: (x, y) => `בכמה ק"מ ${x.name} ${x.g('רץ', 'רצה')} יותר מ${y.name}?`, u: KM },
    { tags: ['baking'], t: (x, y, k1, A1, k2, A2) => `${x.name} ${x.g('אפה', 'אפתה')} ${k1} עוגות, ובכל אחת ${A1} קמח. ${y.name} ${y.g('אפה', 'אפתה')} ${k2} עוגות, ובכל אחת ${A2} קמח.`, q: (x, y) => `בכמה ק"ג קמח ${x.name} ${x.g('השתמש', 'השתמשה')} יותר מ${y.name}?`, u: KG },
    { tags: ['music', 'reading', 'games'], t: (x, y, k1, A1, k2, A2) => `${x.name} ${x.g('התאמן', 'התאמנה')} בגיטרה ${k1} ימים, ${A1} בכל יום. ${y.name} ${y.g('התאמן', 'התאמנה')} ${k2} ימים, ${A2} בכל יום.`, q: (x, y) => `בכמה שעות ${x.name} ${x.g('התאמן', 'התאמנה')} יותר מ${y.name}?`, u: HR },
    { tags: ['magic'], t: (x, y, k1, A1, k2, A2) => `${x.name} ${x.g('הכין', 'הכינה')} ${k1} שיקויים, ${A1} כל אחד. ${y.name} ${y.g('הכין', 'הכינה')} ${k2} שיקויים, ${A2} כל אחד.`, q: (x, y) => `בכמה ליטר שיקוי ${x.name} ${x.g('הכין', 'הכינה')} יותר מ${y.name}?`, u: LT },
    { tags: ['kpop'], t: (x, y, k1, A1, k2, A2) => `${x.name} ${x.g('תרגל', 'תרגלה')} ${k1} ריקודי קיי-פופ, ${A1} כל ריקוד. ${y.name} ${y.g('תרגל', 'תרגלה')} ${k2} ריקודים, ${A2} כל ריקוד.`, q: (x, y) => `בכמה שעות ${x.name} ${x.g('תרגל', 'תרגלה')} יותר מ${y.name}?`, u: HR },
    { tags: ['squishy', 'art', 'tech'], t: (x, y, k1, A1, k2, A2) => `על המדף של ${x.name} יש ${k1} קופסאות סקווישים, כל אחת ברוחב ${A1}. על המדף של ${y.name} יש ${k2} קופסאות, כל אחת ברוחב ${A2}.`, q: (x, y) => `בכמה מטר הקופסאות של ${x.name} תופסות יותר מקום מהקופסאות של ${y.name}?`, u: MT },
    { tags: ['animals', 'nature', 'space'], t: (x, y, k1, A1, k2, A2) => `במשך ${k1} ימים הכלב של ${x.name} אכל ${A1} מזון בכל יום. במשך ${k2} ימים הכלב של ${y.name} אכל ${A2} מזון בכל יום.`, q: (x, y) => `בכמה ק"ג הכלב של ${x.name} אכל יותר מהכלב של ${y.name}?`, u: KG },
  ];
  const repSum = (k, a, d) => HM.range(1, k).map(() => F(a, d)).join(' + ');
  const timesSol = (k, a, d) => [`${m(k + ' × ' + F(a, d) + ' = ' + F(`${k} × ${a}`, d) + ' = ' + F(k * a, d))} (כופלים את המונה, המכנה נשאר).`, (k * a) % d === 0 ? `התשובה: ${m(F(k * a, d) + ' = ' + (k * a) / d)}` : fin(k * a, d, true)];

  HM.lesson({
    id: 'f-times',
    learn: (c) => [
      {
        title: 'שלוש פעמים שתי חמישיות',
        html: `${c.name} ${c.g('הזמין', 'הזמינה')} 3 חברים. כל אחד אכל ${m(F(2, 5))} פיצה. כמה פיצה אכלו יחד?<br>${m(F(2, 5) + ' + ' + F(2, 5) + ' + ' + F(2, 5) + ' = ' + F(6, 5))}<br>חיבור של אותו מספר כמה פעמים הוא ${b('כפל')}: ${m('3 × ' + F(2, 5) + ' = ' + F(6, 5))}.`,
        visual: V.bars([{ n: 2, d: 5 }, { n: 2, d: 5 }, { n: 2, d: 5 }], { labels: [{ n: 2, d: 5 }, { n: 2, d: 5 }, { n: 2, d: 5 }] }),
      },
      {
        title: 'כופלים את המונה',
        html: `${m('4 × ' + F(3, 8))} זה 4 פעמים 3 שמיניות, כלומר ${m('4 × 3 = 12')} שמיניות: ${m(F(12, 8))}.<br>${b('כופלים את המונה')} במספר השלם, ו${b('המכנה לא משתנה')}, כי גודל החלק (שמינית) נשאר אותו דבר.`,
        visual: jumpLine(8, 2, [0, 3, 6, 9, 12]),
      },
      {
        title: 'משבר למספר מעורב',
        html: `${m(F(12, 8))} גדול מ-1. ב-12 שמיניות יש שלם אחד (8 שמיניות) ועוד 4 שמיניות:<br>${m(F(12, 8) + ' = ' + WN(1, 4, 8) + ' = ' + WN(1, 1, 2))}<br>דרך מהירה: מחלקים את המונה במכנה, ${m('12 : 8')} = 1 ושארית 4.`,
        visual: V.bars([{ n: 8, d: 8 }, { n: 4, d: 8 }], { labels: ['1', { n: 4, d: 8 }] }),
      },
      {
        title: 'בעיה מילולית',
        html: `5 חברים אכלו כל אחד ${m(F(3, 4))} פיצה. כמה פיצות אכלו יחד?`,
        steps: [
          `זה חיבור חוזר של ${m(F(3, 4))}, חמש פעמים, כלומר ${m('5 × ' + F(3, 4))}.`,
          `${m('5 × ' + F(3, 4) + ' = ' + F(15, 4))}`,
          `${m(F(15, 4) + ' = ' + WN(3, 3, 4))}: קצת פחות מ-4 פיצות ✔`,
        ],
      },
      {
        title: 'זהירות!',
        html: `${m('3 × ' + F(2, 5))} ${b('אינו')} ${m(F(6, 15))}: לא כופלים את המכנה!<br>${c.g('בדוק', 'בדקי')} בחיבור: ${m(F(2, 5) + ' + ' + F(2, 5) + ' + ' + F(2, 5))} הן שש חמישיות, ${m(F(6, 5))}.<br>ועוד דבר: ${m(F(2, 5) + ' × 3 = 3 × ' + F(2, 5))}, כי בכפל מותר להחליף את סדר הגורמים.`,
      },
      {
        title: `${c.g('נסה', 'נסי')} בעצמך`,
        html: `${c.g('כפול', 'כפלי')} את המונה, ואז ${c.g('הפוך', 'הפכי')} למספר מעורב.`,
        quiz: { type: 'fraction', mixed: true, prompt: `${c.g('חשב', 'חשבי')}: ${m('4 × ' + F(2, 3) + ' =')}`, answer: { w: 2, n: 2, d: 3 },
          hint: `${m(F(2, 3) + ' + ' + F(2, 3) + ' + ' + F(2, 3) + ' + ' + F(2, 3))}`, solution: timesSol(4, 2, 3) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['repAdd', 'mulSmall', 'line', 'shade', 'storyEach', 'storyRepeat', 'storyEach']
        : level === 2 ? ['mulMixed', 'toMixed', 'missingK', 'pickErr', 'cmp1', 'storyRepeat', 'storyBottles', 'storyEach']
        : ['missingNum', 'whole', 'estimate', 'cmpProducts', 'storyLeftT', 'storyCompareT', 'storyBottles'];
      const kind = c.pick(kinds);
      const d = c.pick(level === 1 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8, 9, 10, 12]);
      const a = nRed(c, d);
      const k = level === 1 ? c.rnd(2, 4) : level === 2 ? c.rnd(3, 6) : c.rnd(4, 9);
      switch (kind) {
        case 'repAdd': {
          const kk = c.rnd(2, 5);
          return {
            type: 'number', answer: kk,
            prompt: `${c.g('כתוב', 'כתבי')} את החיבור כתרגיל כפל:<div class="big">${m(repSum(kk, a, d) + ' = ' + HM.slot(0) + ' × ' + F(a, d))}</div>`,
            hint: `${c.g('ספור', 'ספרי')} כמה פעמים מופיע ${m(F(a, d))}.`,
            solution: [`${m(F(a, d))} מופיע ${kk} פעמים, לכן זה ${m(kk + ' × ' + F(a, d))}.`],
          };
        }
        case 'mulSmall':
        case 'mulMixed': {
          let kk = k, aa = a, dd = d;
          if (kind === 'mulSmall') { dd = c.pick([5, 6, 7, 8, 9, 10]); kk = c.rnd(2, 4); aa = c.rnd(1, Math.max(1, Math.floor((dd - 1) / kk))); }
          else { for (let t = 0; t < 40 && (kk * aa <= dd || (kk * aa) % dd === 0); t++) { kk = c.rnd(3, 6); aa = nRed(c, dd); } }
          if (kind === 'mulMixed' && (kk * aa <= dd || (kk * aa) % dd === 0)) { kk = 3; aa = 2; dd = 5; }
          return Object.assign(fq(kk * aa, dd), {
            prompt: `${c.g('חשב', 'חשבי')}: ${m(kk + ' × ' + F(aa, dd) + ' =')}`,
            visual: kind === 'mulSmall' ? V.bars(HM.range(1, kk).map(() => ({ n: aa, d: dd })), {}) : undefined,
            hint: kind === 'mulSmall' ? `זה כמו ${m(repSum(kk, aa, dd))}.` : `${c.g('כפול', 'כפלי')} את המונה ב-${kk}. אחר כך ${c.g('הפוך', 'הפכי')} את התוצאה למספר מעורב.`,
            solution: timesSol(kk, aa, dd),
          });
        }
        case 'line': {
          const dd = c.pick([3, 4, 5, 6, 8]), aa = c.rnd(1, dd - 1), kk = c.rnd(2, 4), P = kk * aa, M = Math.floor(P / dd) + 1;
          if (M * dd > 40) return { type: 'numberline', line: { min: 0, max: 2, den: 4 }, answer: 1.5, prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m('2 × ' + F(3, 4))}.`, hint: `${c.g('קפוץ', 'קפצי')} 2 קפיצות של ${m(F(3, 4))} מ-0.`, solution: [`${m('2 × ' + F(3, 4) + ' = ' + F(6, 4) + ' = ' + WN(1, 2, 4))}`] };
          return {
            type: 'numberline', line: { min: 0, max: M, den: dd }, answer: P / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(kk + ' × ' + F(aa, dd))}.`,
            hint: `${c.g('התחל', 'התחילי')} ב-0 ו${c.g('קפוץ', 'קפצי')} ${kk} קפיצות, כל קפיצה ${HM.cnt(aa, 'שנתה', 'שנתות', true)}.`,
            solution: [`${kk} קפיצות של ${m(F(aa, dd))}: ${m(kk + ' × ' + F(aa, dd) + ' = ' + F(P, dd))}`, `מסמנים את ${m(RX(P, dd))}.`],
          };
        }
        case 'shade': {
          const dd = c.pick([6, 8, 9, 10, 12]), aa = c.pick([1, 2]), kk = c.rnd(2, Math.min(5, Math.floor((dd - 1) / aa)));
          return {
            type: 'shade', shape: 'bar', parts: dd, answer: kk * aa,
            prompt: `${c.g('צבע', 'צבעי')} בפס את ${m(kk + ' × ' + F(aa, dd))}.`,
            hint: `כל ${m(F(aa, dd))} ${aa === 1 ? 'הוא חלק אחד' : `הם ${aa} חלקים`}. כמה חלקים יש ב-${kk} פעמים?`,
            solution: [`${m(kk + ' × ' + F(aa, dd) + ' = ' + F(kk * aa, dd))}`, `צובעים ${kk * aa} חלקים.`],
          };
        }
        case 'toMixed': {
          let kk = k, aa = a;
          for (let t = 0; t < 40 && (kk * aa <= d || (kk * aa) % d === 0); t++) { kk = c.rnd(3, 6); aa = nRed(c, d); }
          if (kk * aa <= d || (kk * aa) % d === 0) { kk = 4; aa = 3; }
          const dd = kk * aa <= d || (kk * aa) % d === 0 ? 8 : d, P = kk * aa;
          return {
            type: 'number', answer: [P, Math.floor(P / dd), P % dd],
            prompt: `${c.g('השלם', 'השלימי')} את המונה, ואחר כך את המספר המעורב:<div class="big">${m(kk + ' × ' + F(aa, dd) + ' = ' + F(HM.slot(0), dd) + ' = ' + HM.mixed(HM.slot(1), HM.slot(2), dd))}</div>`,
            hint: `קודם ${c.g('כפול', 'כפלי')} את המונה. אחר כך ${c.g('בדוק', 'בדקי')} כמה שלמים יש בשבר: כמה פעמים ${dd} נכנס במונה?`,
            solution: [`${m(kk + ' × ' + aa + ' = ' + P)}, לכן ${m(F(P, dd))}.`, `${m(P + ' : ' + dd)} = ${Math.floor(P / dd)} ושארית ${P % dd}, לכן ${m(F(P, dd) + ' = ' + MX(P, dd))}.`],
          };
        }
        case 'missingK': {
          return {
            type: 'number', answer: k,
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:<div class="big">${m(HM.slot(0) + ' × ' + F(a, d) + ' = ' + F(k * a, d))}</div>`,
            hint: `כמה פעמים צריך לקחת ${a} כדי לקבל ${k * a}?`,
            solution: [`המכנה לא משתנה. במונה: ${m(`? × ${a} = ${k * a}`)}.`, `${m(`${k * a} : ${a} = ${k}`)}. התשובה: ${k}`],
          };
        }
        case 'pickErr': {
          const choices = vChoices([[k * a, d], [k * a, k * d], [a, k * d], [k + a, d]], (x, y) => m(F(x, y)));
          return {
            type: 'choice', prompt: `מה התוצאה הנכונה של ${m(k + ' × ' + F(a, d))}?`, choices, answer: 0,
            hint: `${c.g('חשוב', 'חשבי')} על חיבור חוזר: ${m(F(a, d) + ' + ' + F(a, d) + ' + ...')} האם המכנה משתנה?`,
            solution: timesSol(k, a, d),
          };
        }
        case 'cmp1': {
          const P = k * a, W = Math.max(1, Math.round(P / d) + c.pick([-1, 0, 0, 1]));
          const asW = c.chance(0.7), RN = asW ? W * d : W * d + c.pick([-1, 1]);
          const right = asW ? String(W) : RX(RN, d), rv = RN / d, lv = P / d, an = Math.abs(lv - rv) < 1e-9 ? '=' : lv < rv ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c), left: k + ' × ' + F(a, d), right, lv, rv, answer: an,
            hint: `${c.g('חשב', 'חשבי')} את המכפלה ו${c.g('הפוך', 'הפכי')} אותה למספר מעורב.`,
            solution: [`${m(k + ' × ' + F(a, d) + ' = ' + F(P, d) + (P % d && P > d ? ' = ' + MX(P, d) : P % d ? '' : ' = ' + P / d))}`, `${m(RX(P, d) + ' ' + ent(an) + ' ' + right)}`],
          };
        }
        case 'missingNum': {
          return {
            type: 'number', answer: a,
            prompt: `${c.g('השלם', 'השלימי')} את המונה החסר:<div class="big">${m(k + ' × ' + F(HM.slot(0), d) + ' = ' + MX(k * a, d))}</div>`,
            hint: `${c.g('הפוך', 'הפכי')} את ${m(MX(k * a, d))} לשבר עם המכנה ${d}. אחר כך ${c.g('חשוב', 'חשבי')}: ${k} כפול מה נותן את המונה?`,
            solution: [`${m(MX(k * a, d) + ' = ' + F(k * a, d))}`, `${m(`${k} × ? = ${k * a}`)}, ולכן ${m(`${k * a} : ${k} = ${a}`)}.`],
          };
        }
        case 'whole': {
          const dd = c.pick([6, 8, 9, 10, 12]), g = c.pick(HM.divisors(dd).filter((x) => x > 1 && x < dd)), aa = g * c.pick(HM.range(1, dd / g - 1).filter((x) => gcd(x, dd / g) === 1));
          const ansK = dd / gcd(aa, dd);
          return {
            type: 'number', answer: ansK,
            prompt: `מהו המספר השלם הקטן ביותר שאם ${c.g('תכפול', 'תכפלי')} בו את ${m(F(aa, dd))}, ${c.g('תקבל', 'תקבלי')} מספר שלם?`,
            hint: `${c.g('נסה', 'נסי')} קודם לצמצם את ${m(F(aa, dd))}.`,
            solution: [`${m(F(aa, dd) + ' = ' + RX(aa, dd))}`, `צריך ${ansK} פעמים ${m(RX(aa, dd))} כדי שהמונה יתחלק במכנה: ${m(ansK + ' × ' + RX(aa, dd) + ' = ' + (ansK * aa) / dd)}.`, `התשובה: ${ansK} (ולא ${dd}!)`],
          };
        }
        case 'estimate': {
          const A = a, kk = k % d === 0 ? k + 1 : k, PP = kk * A;
          const WW = Math.floor(PP / d), opts = [WW - 1, WW, WW + 1].filter((x) => x >= 0);
          return {
            type: 'choice', keep: true, prompt: `בין אילו מספרים שלמים נמצאת המכפלה ${m(kk + ' × ' + F(A, d))}?`,
            choices: opts.map((x) => `בין ${x} ל-${x + 1}`), answer: opts.indexOf(WW),
            hint: `${c.g('כפול', 'כפלי')} את המונה, ואז ${c.g('בדוק', 'בדקי')} כמה פעמים ${d} נכנס בו.`,
            solution: [`${m(kk + ' × ' + F(A, d) + ' = ' + F(PP, d) + ' = ' + MX(PP, d))}`, `${m(MX(PP, d))} נמצא בין ${WW} ל-${WW + 1}.`],
          };
        }
        case 'cmpProducts': {
          const [d1, d2] = c.chance(0.5) ? [d, d] : multPair(c, 12), k1 = c.rnd(3, 8), k2 = c.rnd(3, 8), a1 = nRed(c, d1), a2 = nRed(c, d2);
          const D = lcm(d1, d2), P1 = (k1 * a1 * D) / d1, P2 = (k2 * a2 * D) / d2, an = P1 === P2 ? '=' : P1 < P2 ? '<' : '>';
          return {
            type: 'compare', prompt: cmpQ(c), left: k1 + ' × ' + F(a1, d1), right: k2 + ' × ' + F(a2, d2), lv: (k1 * a1) / d1, rv: (k2 * a2) / d2, answer: an,
            hint: `${c.g('חשב', 'חשבי')} כל מכפלה, ו${c.g('השווה', 'השווי')} בעזרת מכנה משותף.`,
            solution: [`${m(k1 + ' × ' + F(a1, d1) + ' = ' + F(k1 * a1, d1))}, ${m(k2 + ' × ' + F(a2, d2) + ' = ' + F(k2 * a2, d2))}`, d1 === d2 ? `המכנים שווים: ${m((k1 * a1) + ' ' + ent(an) + ' ' + (k2 * a2))}` : `במכנה ${D}: ${m(F(P1, D) + ' ' + ent(an) + ' ' + F(P2, D))}`, `הסימן: ${ent(an)}`],
          };
        }
        case 'storyRepeat': {
          const sc = c.scene(REP), x = c.me;
          let kk = k, aa = a, dd = d;
          if (level === 1) { dd = c.pick([3, 4, 5, 8]); aa = nRed(c, dd); kk = c.rnd(2, 4); }
          return Object.assign(fq(kk * aa, dd), {
            prompt: `${sc.t(x, kk, Q(sc.u, aa, dd))}<br>${sc.q(x, kk)}`,
            hint: `${m(F(aa, dd))} חוזר ${kk} פעמים. ${c.g('כפול', 'כפלי')}: ${m(kk + ' × ' + F(aa, dd))}.`,
            solution: timesSol(kk, aa, dd),
          });
        }
        case 'storyEach':
        case 'storyBottles': {
          const sc = c.scene(EACH), x = c.me;
          let kk = k, aa = a, dd = d;
          if (kind === 'storyEach' && level === 1) { dd = c.pick([2, 3, 4, 5, 8]); aa = nRed(c, dd); kk = c.rnd(2, 4); }
          if (kind === 'storyBottles' && level === 3) { kk = c.rnd(6, 12); }
          return Object.assign(fq(kk * aa, dd), {
            prompt: `${sc.t(x, kk, m(F(aa, dd)))}<br>${typeof sc.q === 'function' ? sc.q(x) : sc.q}`,
            hint: `כל אחד לקח ${m(F(aa, dd))}, ויש ${kk}. ${c.g('חבר', 'חברי')} ${kk} פעמים, או ${c.g('כפול', 'כפלי')}.`,
            solution: timesSol(kk, aa, dd),
          });
        }
        case 'storyLeftT': {
          for (let t = 0; t < 60; t++) {
            const sc = c.scene(LEFTT), x = c.me, dd = c.pick([3, 4, 5, 6, 8]), aa = nRed(c, dd), kk = c.rnd(3, 7), P = kk * aa, W = Math.max(2, Math.floor(P / dd) + c.rnd(1, 3));
            if (P % dd === 0 || W * dd - P <= 0) continue;
            const R = W * dd - P;
            return Object.assign(fq(R, dd), {
              prompt: `${sc.t(x, W, kk, Q(sc.u, aa, dd))}<br>${typeof sc.q === 'function' ? sc.q(kk) : sc.q}`,
              hint: `קודם ${c.g('חשב', 'חשבי')} את המכפלה (כמה יצא בסך הכול), ואז ${c.g('חסר', 'חסרי')} אותה מ-${W}.`,
              solution: [`בסך הכול: ${m(kk + ' × ' + F(aa, dd) + ' = ' + F(P, dd) + ' = ' + MX(P, dd))}`].concat(borrowSol(W * dd, dd, P, dd)).slice(0, 4),
            });
          }
          return { type: 'fraction', mixed: true, answer: { w: 1, n: 1, d: 2 }, prompt: `ל${c.name} היו 4 פיצות. 5 חברים אכלו כל אחד ${m(F(1, 2))} פיצה. כמה פיצה נשארה?`, hint: 'קודם כפל, אחר כך חיסור.', solution: [`${m('5 × ' + F(1, 2) + ' = ' + WN(2, 1, 2))}`, `${m('4 − ' + WN(2, 1, 2) + ' = ' + WN(1, 1, 2))}`] };
        }
        case 'storyCompareT': {
          for (let t = 0; t < 80; t++) {
            const sc = c.scene(CMPT), x = c.me, y = c.buddy(), dd = c.pick([3, 4, 5, 6, 8]), a1 = nRed(c, dd), a2 = nRed(c, dd), k1 = c.rnd(2, 7), k2 = c.rnd(2, 7);
            const P1 = k1 * a1, P2 = k2 * a2;
            if (P1 <= P2 || (P1 - P2) % dd === 0 || a1 === a2) continue;
            return Object.assign(fq(P1 - P2, dd), {
              prompt: `${sc.t(x, y, k1, Q(sc.u, a1, dd), k2, Q(sc.u, a2, dd))}<br>${sc.q(x, y)}`,
              hint: `${c.g('חשב', 'חשבי')} כמה כל אחד בסך הכול (כפל), ואז ${c.g('מצא', 'מצאי')} את ההפרש.`,
              solution: [`${x.name}: ${m(k1 + ' × ' + F(a1, dd) + ' = ' + F(P1, dd))}`, `${y.name}: ${m(k2 + ' × ' + F(a2, dd) + ' = ' + F(P2, dd))}`, `ההפרש: ${m(F(P1, dd) + ' − ' + F(P2, dd) + ' = ' + F(P1 - P2, dd))}`, fin(P1 - P2, dd, true)],
            });
          }
          return { type: 'fraction', answer: { n: 1, d: 2 }, prompt: `${c.name} ${c.g('רץ', 'רצה')} 3 הקפות של ${Q(KM, 1, 2)}, ו${c.buddy().name} ${c.g('רץ', 'רצה')} 2 הקפות של ${Q(KM, 1, 2)}. בכמה ק"מ ${c.name} ${c.g('רץ', 'רצה')} יותר?`, hint: 'כפל ואז חיסור.', solution: [`${m(F(3, 2) + ' − ' + F(2, 2) + ' = ' + F(1, 2))}`] };
        }
      }
    },
  });

})(HM);
