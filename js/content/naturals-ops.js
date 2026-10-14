/* חשבוניה — עיר המספרים, פעולות החשבון: ייצוגים, חיבור וחיסור, כפל, חילוק, סדר פעולות */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { m, b } = HM;
  const fmt = HM.fmt, slot = HM.slot;
  const X = HM.op.times, DV = HM.op.div, MI = HM.op.minus;
  const P10 = (k) => Math.pow(10, k);
  const digitAt = (n, p) => Math.floor(n / P10(p)) % 10;
  const nDigits = (n) => String(Math.floor(n)).length;
  // שם המקום בצורת סמיכות/יידוע: "במקום עשרות האלפים"
  const PN = ['היחידות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים', 'מאות האלפים', 'המיליונים', 'עשרות המיליונים'];
  const GT = '&gt;', LT = '&lt;';
  const sym = (a, c2) => (a === c2 ? '=' : a < c2 ? LT : GT);
  const cmpAns = (a, c2) => (a === c2 ? '=' : a < c2 ? '<' : '>');

  // מספר אקראי בן len ספרות; zp = הסיכוי לספרה 0 (לא בספרה הראשונה)
  function bigNum(len, zp) {
    let s = String(HM.rnd(1, 9));
    for (let i = 1; i < len; i++) s += HM.chance(zp || 0) ? '0' : String(HM.rnd(1, 9));
    return +s;
  }
  // מספר בטווח [lo, hi] (אותו מספר ספרות) עם אפסים אקראיים
  function numIn(lo, hi, zp) {
    for (let t = 0; t < 40; t++) { const n = bigNum(nDigits(lo), zp); if (n >= lo && n <= hi) return n; }
    return HM.rnd(lo, hi);
  }
  // טעויות אפס נפוצות: אפס מיותר או אפס חסר
  function zeroSlips(n) {
    const s = String(n), out = [];
    for (let i = 1; i < s.length; i++) if (s[i] === '0') out.push(+(s.slice(0, i) + s.slice(i + 1)));
    for (let i = 1; i <= s.length; i++) out.push(+(s.slice(0, i) + '0' + s.slice(i)));
    return HM.shuffle(out);
  }
  // כתיבת המחלקות בלי אפסים שומרי מקום (4 מיליון 25 אלף 3 => 4253)
  function noPad(n) {
    const parts = [];
    let x = n; while (x > 0) { parts.unshift(x % 1000); x = Math.floor(x / 1000); }
    return +parts.map(String).join('');
  }
  // החלפת שתי ספרות סמוכות
  function swapAdj(n) {
    const s = String(n).split('');
    for (let t = 0; t < 12; t++) {
      const i = HM.rnd(0, s.length - 2);
      if (s[i] !== s[i + 1] && !(i === 0 && s[1] === '0')) { [s[i], s[i + 1]] = [s[i + 1], s[i]]; return +s.join(''); }
    }
    return n + P10(Math.max(0, s.length - 2));
  }
  // תשובה נכונה + מסיחים ייחודיים (שלמים אי-שליליים בלבד). התשובה תמיד באינדקס 0
  function opts(ans, cands, f, k) {
    f = f || fmt; k = k || 4;
    const out = [ans], seen = new Set([f(ans)]);
    for (const v of cands) {
      if (out.length >= k) break;
      if (typeof v !== 'number' || !isFinite(v) || v < 0 || Math.floor(v) !== v) continue;
      const key = f(v); if (seen.has(key)) continue;
      seen.add(key); out.push(v);
    }
    return { choices: out.map(f), answer: 0 };
  }
  // פירוק המספר למחלקות (לפתרונות)
  function classSteps(n) {
    const mil = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), un = n % 1000;
    const out = [];
    if (mil) out.push(`מחלקת המיליונים: ${mil}`);
    if (mil || th) out.push(`מחלקת האלפים: ${mil ? String(th).padStart(3, '0') : th}`);
    out.push(`מחלקת היחידות: ${mil || th ? String(un).padStart(3, '0') : un}`);
    return out.join(' • ');
  }
  // הסבר להשוואת שני מספרים
  function cmpWhy(a, c2) {
    if (nDigits(a) !== nDigits(c2)) return `ל-${fmt(Math.max(a, c2))} יש יותר ספרות, ולכן הוא גדול יותר.`;
    let p = nDigits(a) - 1;
    while (p >= 0 && digitAt(a, p) === digitAt(c2, p)) p--;
    if (p < 0) return 'המספרים שווים.';
    return `לשני המספרים יש אותו מספר ספרות. הספרה הראשונה (משמאל) שונה נמצאת במקום ${PN[p]}: ${digitAt(a, p)} לעומת ${digitAt(c2, p)}.`;
  }
  // מחשב ביטוי עם + − × : וסוגריים. NaN לחילוק לא שלם או ב-0
  function ev(str) {
    const t = String(str).replace(/,/g, '').match(/\d+|[+−×:()]/g) || [];
    let i = 0;
    const peek = () => t[i], next = () => t[i++];
    function prim() { const x = next(); if (x === '(') { const v = sum(); next(); return v; } return +x; }
    function prod() { let v = prim(); while (peek() === '×' || peek() === ':') { const o = next(), r = prim(); if (o === '×') v *= r; else v = r === 0 || v % r ? NaN : v / r; } return v; }
    function sum() { let v = prod(); while (peek() === '+' || peek() === '−') { const o = next(), r = prod(); v = o === '+' ? v + r : v - r; } return v; }
    return sum();
  }
  // חישוב במאונך (לפתרונות ולכרטיסים)
  const col = (a, c2, op, res) => V.column([String(a), String(c2)], op, { result: res == null ? null : String(res) });
  // נקודות הנשיאה בחיבור במאונך (לכרטיסי הלימוד)
  function carries(a, c2) {
    const L = Math.max(nDigits(a + c2), nDigits(a), nDigits(c2));
    const out = new Array(L).fill('');
    let cin = 0;
    for (let p = 0; p < L; p++) { const s = digitAt(a, p) + digitAt(c2, p) + cin; cin = s >= 10 ? 1 : 0; if (cin && p + 1 < L) out[L - 1 - (p + 1)] = '1'; }
    return out;
  }
  // מודל פסים: שלם למעלה, חלקים למטה (RTL — החלק הראשון מימין)
  function barModel(topLabel, parts, o) {
    o = o || {};
    const W = 330, H = 40, x0 = 6, inner = W - 12;
    const tot = parts.reduce((s, p) => s + p.v, 0) || 1;
    let ws = parts.map((p) => Math.max(0.22, p.v / tot));
    const sw = ws.reduce((s, w) => s + w, 0); ws = ws.map((w) => (w / sw) * inner);
    let s = S.rect(x0, 6, inner, H, { cls: 'f-l s-ink', sw: 2, rx: 6 }) + S.text(W / 2, 6 + H / 2, topLabel, { fs: 16, fw: 700 });
    let x = W - x0;
    parts.forEach((p, i) => {
      const w = ws[i]; x -= w;
      s += S.rect(x, H + 18, w, H, { cls: (p.cls || (i % 2 ? 'f-b' : 'f-a')) + ' s-ink', sw: 2, rx: 4 });
      s += S.text(x + w / 2, H + 18 + H / 2, p.label, { fs: 15, fw: 700, cls: 't-on' });
    });
    return S.svg(W, 2 * H + 26, s, { label: o.aria || 'מודל פסים', maxw: 330 });
  }

  // k חברים עם שמות שונים זה מזה
  function friends(c, k, gender) {
    const out = [], used = new Set([c.name]);
    for (let t = 0; t < 60 && out.length < k; t++) {
      const f = gender === 'm' ? c.friendM() : gender === 'f' ? c.friendF() : c.friend();
      if (!used.has(f.name)) { used.add(f.name); out.push(f); }
    }
    return out;
  }
  const ORD_M = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני'];
  const ORD_F = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית', 'שמינית'];

  /* ========== ייצוגים של מספרים טבעיים ========== */
  // מספרים מהחדשות (המספר במילים בסוף המשפט, בלי שם עצם אחריו)
  const NEWS_SC = [
    { tags: ['animals'], what: 'מספר המבקרים בגן החיות בשנה שעברה היה', lo: 2, hi: 9 },
    { tags: ['sport'], what: 'מספר הכרטיסים שנמכרו למשחקי הליגה העונה היה', lo: 1, hi: 4 },
    { tags: ['space'], what: 'המרחק שעברה החללית עד היום, בקילומטרים, הוא', lo: 1, hi: 9 },
    { tags: ['music'], what: 'מספר ההשמעות של השיר החדש ברשת הוא', lo: 1, hi: 9 },
    { tags: ['baking'], what: 'מספר העוגיות שאפתה המאפייה הגדולה בשנה שעברה היה', lo: 1, hi: 9 },
    { tags: ['games'], what: 'מספר השחקנים שהורידו את המשחק החדש הוא', lo: 1, hi: 9 },
    { tags: ['art'], what: 'מספר האנשים שביקרו בתערוכת הציורים השנה היה', lo: 1, hi: 6 },
    { tags: ['nature'], what: 'מספר העצים שנטעו ביערות בעשר השנים האחרונות הוא', lo: 1, hi: 9 },
    { tags: ['reading'], what: 'מספר העותקים שנמכרו מסדרת ספרי ההרפתקאות הוא', lo: 1, hi: 9 },
    { tags: ['tech'], what: 'מספר הרובוטים שייצר המפעל בשנה האחרונה היה', lo: 1, hi: 9 },
    { tags: ['kpop'], what: 'מספר הצפיות בקליפ החדש של להקת קיי-פופ מפורסמת הוא', lo: 1, hi: 9 },
    { tags: ['magic'], what: 'מספר העותקים שנמכרו מהספר החדש על בית הספר לקוסמים הוא', lo: 1, hi: 9 },
    { tags: ['squishy'], what: 'מספר הסקווישים שמכרה רשת הצעצועים בשנה שעברה היה', lo: 1, hi: 9 },
  ];
  // סדרות בסיפור: ערך בתקופה הראשונה וקפיצה קבועה
  const SEQ_SC = [
    { tags: ['sport'], fem: true, txt: (f, a, j) => `בעונה הראשונה הגיעו למשחקי הקבוצה של ${f.name} ${fmt(a)} אוהדים. בכל עונה הגיעו ${fmt(j)} אוהדים יותר מבעונה שלפניה.`, q: (o) => `כמה אוהדים הגיעו בעונה ה${o}?` },
    { tags: ['animals'], txt: (f, a, j) => `${f.name} ${f.g('התנדב', 'התנדבה')} בשמורת טבע. בחודש הראשון ספרו שם ${fmt(a)} ציפורים נודדות, ובכל חודש ספרו ${fmt(j)} ציפורים יותר מבחודש שלפניו.`, q: (o) => `כמה ציפורים ספרו בחודש ה${o}?` },
    { tags: ['games'], txt: (f, a, j) => `במשחק המחשב ${f.name} ${f.g('צבר', 'צברה')} בשלב הראשון ${fmt(a)} נקודות. בכל שלב ${f.g('הוא צובר', 'היא צוברת')} ${fmt(j)} נקודות יותר מבשלב הקודם.`, q: (o, f) => `כמה נקודות ${f.g('יצבור', 'תצבור')} ${f.name} בשלב ה${o}?` },
    { tags: ['music'], txt: (f, a, j) => `לשיר ש${f.g('כתב', 'כתבה')} ${f.name} היו בסוף היום הראשון ${fmt(a)} השמעות. בכל יום נוספו לו ${fmt(j)} השמעות.`, q: (o) => `כמה השמעות היו לשיר בסוף היום ה${o}?` },
    { tags: ['space'], txt: (f, a, j) => `במשחק החלל של ${f.name}, בסוף היום הראשון החללית נמצאת ${fmt(a)} ק"מ מכדור הארץ. בכל יום היא מתרחקת עוד ${fmt(j)} ק"מ.`, q: (o) => `כמה קילומטרים מכדור הארץ תהיה החללית בסוף היום ה${o}?` },
    { tags: ['baking'], txt: (f, a, j) => `בשבוע הראשון אפתה המאפייה של הדוד של ${f.name} ${fmt(a)} לחמניות. בכל שבוע היא אפתה ${fmt(j)} לחמניות יותר מבשבוע שלפניו.`, q: (o) => `כמה לחמניות אפתה המאפייה בשבוע ה${o}?` },
    { tags: ['art'], txt: (f, a, j) => `לתערוכת הציורים של ${f.name} הגיעו בחודש הראשון ${fmt(a)} מבקרים. בכל חודש הגיעו ${fmt(j)} מבקרים יותר מבחודש שלפניו.`, q: (o) => `כמה מבקרים הגיעו בחודש ה${o}?` },
    { tags: ['nature'], fem: true, txt: (f, a, j) => `בשנה הראשונה נטעו ביער ליד הבית של ${f.name} ${fmt(a)} עצים. בכל שנה נטעו ${fmt(j)} עצים יותר מבשנה שלפניה.`, q: (o) => `כמה עצים נטעו בשנה ה${o}?` },
    { tags: ['reading'], txt: (f, a, j) => `בחודש הראשון השאילה הספרייה של ${f.name} ${fmt(a)} ספרים. בכל חודש היא השאילה ${fmt(j)} ספרים יותר מבחודש שלפניו.`, q: (o) => `כמה ספרים השאילה הספרייה בחודש ה${o}?` },
    { tags: ['tech'], txt: (f, a, j) => `המפעל שבו עובדת האימא של ${f.name} ייצר בחודש הראשון ${fmt(a)} רובוטים. בכל חודש הוא ייצר ${fmt(j)} רובוטים יותר מבחודש שלפניו.`, q: (o) => `כמה רובוטים ייצר המפעל בחודש ה${o}?` },
    { tags: ['kpop'], txt: (f, a, j) => `במועדון המעריצים של להקת הקיי-פופ ש${f.name} ${f.g('אוהב', 'אוהבת')} היו בחודש הראשון ${fmt(a)} חברים. בכל חודש הצטרפו ${fmt(j)} חברים חדשים.`, q: (o) => `כמה חברים היו במועדון בחודש ה${o}?` },
    { tags: ['magic'], txt: (f, a, j) => `${f.name} ${f.g('קרא', 'קראה')} שבדואר הינשופים של עולם הקוסמים נשלחו בשבוע הראשון ${fmt(a)} מכתבים, ובכל שבוע נשלחו ${fmt(j)} מכתבים יותר מבשבוע שלפניו.`, q: (o) => `כמה מכתבים נשלחו בשבוע ה${o}?` },
    { tags: ['squishy'], txt: (f, a, j) => `חנות הסקווישים שליד הבית של ${f.name} מכרה בשבוע הראשון ${fmt(a)} סקווישים. בכל שבוע היא מכרה ${fmt(j)} סקווישים יותר מבשבוע שלפניו.`, q: (o) => `כמה סקווישים מכרה החנות בשבוע ה${o}?` },
  ];
  // השוואת כמויות בין חברים (v: מחרוזת מוכנה של מספר)
  const CMP_SC = [
    { tags: ['games'], say: (f, v) => `${f.name} ${f.g('צבר', 'צברה')} ${v} נקודות`, q: 'מי צבר הכי הרבה נקודות?' },
    { tags: ['sport'], say: (f, v) => `${f.name} ${f.g('הלך', 'הלכה')} החודש ${v} צעדים`, q: 'מי הלך הכי הרבה צעדים?' },
    { tags: ['music'], say: (f, v) => `לסרטון הריקוד של ${f.name} יש ${v} צפיות`, q: 'לסרטון של מי יש הכי הרבה צפיות?' },
    { tags: ['animals'], say: (f, v) => `לסרטון של ${f.name} על ${f.g('הכלב שלו', 'הכלבה שלה')} יש ${v} צפיות`, q: 'לסרטון של מי יש הכי הרבה צפיות?' },
    { tags: ['baking'], say: (f, v) => `לערוץ האפייה של ${f.name} יש ${v} צפיות`, q: 'לערוץ של מי יש הכי הרבה צפיות?' },
    { tags: ['tech'], say: (f, v) => `לאתר ש${f.g('בנה', 'בנתה')} ${f.name} היו ${v} כניסות`, q: 'לאתר של מי היו הכי הרבה כניסות?' },
    { tags: ['space'], say: (f, v) => `החללית במשחק של ${f.name} עברה ${v} ק"מ`, q: 'החללית של מי עברה את המרחק הגדול ביותר?' },
    { tags: ['art'], say: (f, v) => `לגלריה המקוונת של ${f.name} היו ${v} כניסות`, q: 'לגלריה של מי היו הכי הרבה כניסות?' },
    { tags: ['reading'], say: (f, v) => `${f.name} ${f.g('קרא', 'קראה')} השנה ספרים עם ${v} מילים בסך הכול`, q: 'מי קרא הכי הרבה מילים?' },
    { tags: ['nature'], say: (f, v) => `${f.name} ${f.g('רכב', 'רכבה')} השנה באופניים ${v} מטרים`, q: 'מי רכב את המרחק הגדול ביותר?' },
    { tags: ['kpop'], say: (f, v) => `${f.name} ${f.g('אסף', 'אספה')} ${v} נקודות באפליקציית המעריצים של הלהקה`, q: 'מי אסף הכי הרבה נקודות?' },
    { tags: ['magic'], say: (f, v) => `במשחק הקוסמים ${f.name} ${f.g('אסף', 'אספה')} ${v} מטבעות זהב`, q: 'מי אסף הכי הרבה מטבעות זהב?' },
    { tags: ['squishy'], say: (f, v) => `לסרטון הסקווישים של ${f.name} יש ${v} צפיות`, q: 'לסרטון של מי יש הכי הרבה צפיות?' },
  ];
  // כמה מספרים קרובים ושונים זה מזה (לשאלות השוואה)
  function closeNums(len, k) {
    const base = bigNum(len, 0.2), set = new Set([base]), out = [base];
    for (let t = 0; t < 80 && out.length < k; t++) {
      let v;
      const r = HM.rnd(0, 2);
      if (r === 0) v = swapAdj(base);
      else { const p = HM.rnd(0, len - 2), d = digitAt(base, p); v = base + (HM.rnd(1, 9) - d) * P10(p); }
      if (nDigits(v) === len && !set.has(v)) { set.add(v); out.push(v); }
    }
    return out;
  }
  // פירוק מספר לסכום לפי ערך המקום
  const expTerms = (n) => { const t = []; for (let p = nDigits(n) - 1; p >= 0; p--) if (digitAt(n, p)) t.push(digitAt(n, p) * P10(p)); return t; };

  HM.lesson({
    id: 'n-rep',
    learn: (c) => [
      {
        title: 'מספרים ענקיים',
        html: `${c.name}, ${c.g('אתה יודע', 'את יודעת')} כמה קילומטרים יש מכדור הארץ עד הירח? בערך ${b('384,400')}!<br>במספרים גדולים כל ספרה "שווה" משהו אחר לפי ${HM.hl('המקום')} שלה. ${b('טבלת ערך המקום')} עוזרת לקרוא אותם בלי להתבלבל.`,
        visual: V.placeValue(384400),
      },
      {
        title: 'מחלקות ופסיקים',
        html: `כל 3 מקומות בטבלה יוצרים ${b('מחלקה')}:<br>• מחלקת היחידות: יחידות, עשרות, מאות.<br>• מחלקת האלפים: אלפים, עשרות אלפים, מאות אלפים.<br>• מחלקת המיליונים.<br>בין מחלקה למחלקה כותבים ${b('פסיק')}: ${m('2,345,678')}.`,
        visual: V.placeValue(2345678, { hl: [3, 4, 5] }),
      },
      {
        title: 'קוראים מספר גדול',
        html: `איך קוראים את ${m('2,045,300')}? קוראים כל מחלקה בנפרד, משמאל לימין, ומוסיפים את שם המחלקה.`,
        steps: [
          `מחלקים למחלקות לפי הפסיקים: מיליונים 2, אלפים 045, יחידות 300.`,
          `2 מיליונים ← "שני מיליון".`,
          `045 אלפים ← "ארבעים וחמישה אלף".`,
          `300 יחידות ← "שלוש מאות".`,
          `ביחד: ${b(HM.numToWords(2045300))}.`,
        ],
      },
      {
        title: 'פירוק לפי ערך המקום',
        html: `כל מספר אפשר לפרק לפי ערך הספרות:<br>${m('3,405,020 = 3,000,000 + 400,000 + 5,000 + 20')}<br>או כך: ${m(`3 ${X} 1,000,000 + 4 ${X} 100,000 + 5 ${X} 1,000 + 2 ${X} 10`)}<br>האפסים לא מופיעים בפירוק, אבל במספר הם ${b('שומרים על המקום')} של שאר הספרות.`,
        visual: V.placeValue(3405020, { hl: [6, 5, 3, 1] }),
        quiz: {
          type: 'number', answer: 4070305,
          prompt: `${c.g('השלם', 'השלימי')}: ${m('4,000,000 + 70,000 + 300 + 5 = ' + slot(0))}`,
          hint: 'אין אלפים, אין מאות אלפים ואין עשרות — במקומות האלה ' + c.g('כתוב', 'כתבי') + ' 0.',
          solution: [`${m('4,000,000 + 70,000 + 300 + 5 = 4,070,305')}`],
        },
      },
      {
        title: 'העוקב והקודם',
        html: `${b('המספר העוקב')} גדול ב-1: העוקב ל-${m('4,599')} הוא ${m('4,600')}.<br>${b('המספר הקודם')} קטן ב-1: הקודם ל-${m('70,000')} הוא ${m('69,999')}.<br>${c.g('שים לב', 'שימי לב')} למספרים שמסתיימים ב-9 או ב-0: שם משתנות כמה ספרות בבת אחת.`,
        visual: V.numberLine({ min: 69998, max: 70002, step: 1, w: 520, marks: [{ v: 69999, label: 'הקודם' }, { v: 70001, label: 'העוקב' }] }),
        quiz: {
          type: 'number', answer: 410000,
          prompt: `מהו המספר העוקב ל-${m('409,999')}?`,
          hint: 'העוקב גדול ב-1. מה קורה לכל הספרות 9?',
          solution: [`${m('409,999 + 1 = 410,000')}`],
        },
      },
      {
        title: 'סדרות וישר המספרים',
        html: `בסדרה חשבונית מוסיפים (או מחסירים) בכל צעד את אותו מספר.<br>${HM.seq(['250,000', '300,000', '350,000', null])}<br>בכל צעד מוסיפים 50,000, ולכן המספר החסר הוא 400,000.<br>${c.name}, על ישר המספרים כל מספר גדול נמצא ${b('מימין')} למספרים הקטנים ממנו.`,
        visual: V.numberLine({ min: 200000, max: 450000, step: 50000, w: 560, jumps: [{ from: 250000, to: 300000, label: '+50,000' }, { from: 300000, to: 350000, label: '+50,000' }, { from: 350000, to: 400000, label: '+50,000' }] }),
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['readWords', 'placeTable', 'digitValue', 'succPred', 'seq', 'compare', 'storyWords', 'storyCmp', 'storySeq', 'storySeq']
        : level === 2 ? ['writeWords', 'toWords', 'expanded', 'succPred', 'seq', 'numberline', 'storyWords', 'storyCmp', 'storySeq', 'storySucc']
        : ['order', 'numberline', 'seq2', 'expandedTimes', 'maxMin', 'howMany', 'compare', 'storyCmp3', 'storyOrder', 'storyCode', 'storySeq'];
      const kind = c.pick(kinds);
      const len = level === 1 ? c.pick([4, 5]) : level === 2 ? c.pick([6, 7]) : 7;
      switch (kind) {
        case 'readWords': {
          const n = bigNum(len, 0.35);
          return {
            type: 'choice', prompt: `איזה מספר כתוב כאן במילים?<div class="big">${HM.numToWords(n)}</div>`,
            ...opts(n, [noPad(n), ...zeroSlips(n), swapAdj(n), n + P10(len - 2)]),
            hint: `${c.g('חלק', 'חלקי')} למחלקות: קודם האלפים ואחר כך היחידות. בכל מחלקה (חוץ מהראשונה) יש בדיוק 3 ספרות, גם אם חלקן 0.`,
            solution: [classSteps(n), `התשובה: ${fmt(n)}`],
          };
        }
        case 'placeTable': {
          const n = bigNum(len, 0.3);
          return {
            type: 'number', answer: n, prompt: `${c.g('כתוב', 'כתבי')} בספרות את המספר שבטבלה:`, visual: V.placeValue(n),
            hint: `${c.g('העתק', 'העתיקי')} את הספרות לפי הסדר, מהמקום הגבוה (משמאל) עד היחידות.`,
            solution: [`המספר הוא ${fmt(n)}.`, `קוראים אותו: ${HM.numToWords(n)}.`],
          };
        }
        case 'digitValue': {
          const n = +c.sample(HM.range(1, 9), len).join('');
          const p = c.rnd(0, len - 1), d = digitAt(n, p), val = d * P10(p);
          return {
            type: 'choice', prompt: `מה ${b('הערך')} של הספרה ${d} במספר ${m(fmt(n))}?`, visual: V.placeValue(n),
            ...opts(val, [d * P10(p + 1), p > 0 ? d * P10(p - 1) : d * 100, d, d * P10(p + 2), d * P10(p + 3)]),
            hint: `${c.g('מצא', 'מצאי')} בטבלה באיזה מקום נמצאת הספרה ${d}.`,
            solution: [`הספרה ${d} נמצאת במקום ${PN[p]}.`, `ערכה: ${m(`${d} ${X} ${fmt(P10(p))} = ${fmt(val)}`)}`],
          };
        }
        case 'succPred': {
          const succ = c.chance(0.5);
          let n;
          if (level === 1) n = bigNum(len, 0.2);
          else { const k = c.rnd(2, 4); n = bigNum(len - k, 0.2) * P10(k); if (succ) n -= 1; }
          const ans = succ ? n + 1 : n - 1;
          return {
            type: 'number', answer: ans, prompt: `מהו ${b(succ ? 'המספר העוקב' : 'המספר הקודם')} ל-${m(fmt(n))}?`,
            hint: succ ? `העוקב גדול ב-1.${n % 10 === 9 ? ` ${c.g('שים לב', 'שימי לב')} מה קורה לספרות 9.` : ''}` : `הקודם קטן ב-1.${n % 10 === 0 ? ` ${c.g('שים לב', 'שימי לב')} מה קורה לספרות 0.` : ''}`,
            solution: [m(`${fmt(n)} ${succ ? '+' : MI} 1 = ${fmt(ans)}`)],
          };
        }
        case 'seq': {
          const j = level === 1 ? c.pick([10, 100, 1000]) : c.pick([500, 2500, 5000, 25000, 50000, 200000]);
          const down = level > 1 && c.chance(0.4);
          const a0 = level === 1 ? c.rnd(100, 9800) : c.rnd(2, 60) * j + c.pick([0, c.rnd(1, 9) * 100]);
          let terms = HM.range(0, 4).map((i) => a0 + i * j);
          if (down) terms = terms.reverse();
          const k = c.rnd(1, 4), ans = terms[k];
          return {
            type: 'number', answer: ans,
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר בסדרה:<div class="big">${HM.seq(terms.map((v, i) => (i === k ? slot(0) : fmt(v))))}</div>`,
            hint: `${c.g('מצא', 'מצאי')} את הקפיצה: בכמה ${down ? 'קטן' : 'גדל'} כל מספר לעומת המספר שלפניו?`,
            solution: [`הסדרה ${down ? 'יורדת' : 'עולה'} בקפיצות של ${fmt(j)}.`, m(`${fmt(terms[k - 1])} ${down ? MI : '+'} ${fmt(j)} = ${fmt(ans)}`)],
          };
        }
        case 'seq2': {
          const j = c.pick([1500, 2500, 12000, 25000, 150000, 250000]);
          const down = c.chance(0.5);
          const s0 = c.rnd(2, 40) * 10000;
          let t = HM.range(0, 3).map((i) => s0 + i * j);
          if (down) t = t.reverse();
          const diff = Math.abs(t[3] - t[0]);
          return {
            type: 'number', answer: [t[1], t[2]],
            prompt: `${c.g('השלם', 'השלימי')} את שני המספרים החסרים בסדרה החשבונית:<div class="big">${HM.seq([fmt(t[0]), slot(0), slot(1), fmt(t[3])])}</div>`,
            hint: `מהמספר הראשון עד האחרון יש ${b('3 קפיצות')} שוות.`,
            solution: [`ההפרש בין הקצוות: ${m(`${fmt(Math.max(t[0], t[3]))} ${MI} ${fmt(Math.min(t[0], t[3]))} = ${fmt(diff)}`)}`, `קפיצה אחת: ${m(`${fmt(diff)} ${DV} 3 = ${fmt(j)}`)}`, `המספרים החסרים: ${fmt(t[1])} ו-${fmt(t[2])}.`],
          };
        }
        case 'compare': {
          let a, c2;
          if (level === 1) { [a, c2] = closeNums(len, 2); if (c.chance(0.25)) c2 = numIn(8 * P10(len - 2), P10(len - 1) - 1, 0.1); }
          else { a = bigNum(len, 0.35); const t = expTerms(a); const slip = c.chance(0.6); c2 = slip ? (c.chance(0.5) ? zeroSlips(a)[0] : swapAdj(a)) : a; const right = slip ? expTerms(c2) : c.shuffle(t);
            return {
              type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
              left: fmt(a), right: right.map(fmt).join(' + '), lv: a, rv: c2, answer: cmpAns(a, c2),
              hint: `${c.g('חשב', 'חשבי')} קודם את הסכום שמימין, ואז ${c.g('השווה', 'השווי')} ספרה אחרי ספרה.`,
              solution: [`${m(right.map(fmt).join(' + ') + ' = ' + fmt(c2))}`, cmpWhy(a, c2), m(`${fmt(a)} ${sym(a, c2)} ${fmt(c2)}`)],
            };
          }
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: fmt(a), right: fmt(c2), lv: a, rv: c2, answer: cmpAns(a, c2),
            hint: `קודם ${c.g('השווה', 'השווי')} את מספר הספרות. אם הוא שווה — ${c.g('השווה', 'השווי')} ספרה אחרי ספרה, משמאל.`,
            solution: [cmpWhy(a, c2), m(`${fmt(a)} ${sym(a, c2)} ${fmt(c2)}`)],
          };
        }
        case 'writeWords': {
          const n = bigNum(len, 0.4);
          return {
            type: 'number', answer: n, prompt: `${c.g('כתוב', 'כתבי')} את המספר בספרות:<div class="big">${HM.numToWords(n)}</div>`,
            hint: `${c.g('כתוב', 'כתבי')} כל מחלקה בנפרד. במחלקת האלפים ובמחלקת היחידות חייבות להיות 3 ספרות — ${c.g('השלם', 'השלימי')} באפסים.`,
            solution: [classSteps(n), `התשובה: ${fmt(n)}`],
          };
        }
        case 'toWords': {
          const n = bigNum(len, 0.4);
          return {
            type: 'choice', prompt: `איך קוראים את המספר?<div class="big">${m(fmt(n))}</div>`,
            ...opts(n, [...zeroSlips(n), noPad(n), swapAdj(n)], HM.numToWords),
            hint: `${c.g('חלק', 'חלקי')} את המספר למחלקות לפי הפסיקים, ו${c.g('קרא', 'קראי')} כל מחלקה עם השם שלה.`,
            solution: [classSteps(n), `קוראים: ${HM.numToWords(n)}`],
          };
        }
        case 'expanded': {
          let n = bigNum(len, 0.35); while (expTerms(n).length < 3) n = bigNum(len, 0.35);
          const t = expTerms(n);
          if (c.chance(0.5)) {
            const sh = c.shuffle(t);
            return {
              type: 'number', answer: n, prompt: `${c.g('השלם', 'השלימי')}: ${m(sh.map(fmt).join(' + ') + ' = ' + slot(0))}`,
              hint: `${c.g('סדר', 'סדרי')} את המחוברים מהגדול לקטן, ו${c.g('כתוב', 'כתבי')} 0 בכל מקום שאין לו מחובר.`,
              solution: [m(t.map(fmt).join(' + ')), `= ${fmt(n)}`],
            };
          }
          const k = c.rnd(0, t.length - 1), p = nDigits(t[k]) - 1;
          return {
            type: 'number', answer: t[k], prompt: `${c.g('השלם', 'השלימי')}: ${m(fmt(n) + ' = ' + t.map((v, i) => (i === k ? slot(0) : fmt(v))).join(' + '))}`,
            hint: `${c.g('בדוק', 'בדקי')} איזו ספרה של ${fmt(n)} עוד לא מופיעה בפירוק, ומה ערכה.`,
            solution: [`הספרה ${digitAt(n, p)} נמצאת במקום ${PN[p]}.`, `ערכה ${fmt(t[k])}.`],
          };
        }
        case 'expandedTimes': {
          let n = bigNum(len, 0.45); while (expTerms(n).length < 3) n = bigNum(len, 0.45);
          const pl = []; for (let p = len - 1; p >= 0; p--) if (digitAt(n, p)) pl.push(p);
          const sh = c.shuffle(pl);
          return {
            type: 'number', answer: n, prompt: `איזה מספר שווה לתרגיל?<div class="big">${m(sh.map((p) => `${digitAt(n, p)} ${X} ${fmt(P10(p))}`).join(' + '))}</div>`,
            hint: `${c.g('שים לב', 'שימי לב')}: המחוברים לא מסודרים. ${c.g('מצא', 'מצאי')} לכל ספרה את המקום שלה, ו${c.g('כתוב', 'כתבי')} 0 במקומות הריקים.`,
            solution: [m(pl.map((p) => `${digitAt(n, p)} ${X} ${fmt(P10(p))}`).join(' + ')), m(pl.map((p) => fmt(digitAt(n, p) * P10(p))).join(' + ')), `= ${fmt(n)}`],
          };
        }
        case 'numberline': {
          const step = level === 2 ? c.pick([1000, 10000, 100000]) : c.pick([500, 5000, 50000]);
          const N = level === 2 ? 10 : 20;
          const min = c.rnd(level === 2 ? 0 : 1, 9) * step * N;
          let k = c.rnd(1, N - 1); if (k === N / 2) k += c.pick([-1, 1, 2, -2]);
          const ans = min + k * step;
          return {
            type: 'numberline', answer: ans,
            prompt: `${c.g('גע', 'געי')} בסימון של המספר ${m(fmt(ans))} על ישר המספרים.`,
            line: { min, max: min + N * step, step, every: 5, labels: (v, i) => (i === 0 || i === N || i === N / 2 ? fmt(v) : null) },
            hint: `כל סימון גדול מהסימון שמשמאלו ב-${fmt(step)}. ${c.g('התחל', 'התחילי')} מ-${fmt(min)} ו${c.g('ספור', 'ספרי')} קפיצות.`,
            solution: [`בין שני סימונים יש ${fmt(step)}.`, `${m(`${fmt(ans)} ${MI} ${fmt(min)} = ${fmt(k * step)}`)}, כלומר ${k} קפיצות ימינה מ-${fmt(min)}.`],
          };
        }
        case 'order': {
          const nums = closeNums(len, 3);
          nums.push(numIn(9 * P10(len - 2), P10(len - 1) - 1, 0.1));
          const items = c.shuffle(nums), up = c.chance(0.5);
          const ord = items.map((x, i) => i).sort((i, j) => (up ? items[i] - items[j] : items[j] - items[i]));
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את המספרים ${b(up ? 'מהקטן לגדול' : 'מהגדול לקטן')}:`,
            items: items.map((v) => m(fmt(v))), answer: ord,
            hint: `קודם ${c.g('ספור', 'ספרי')} ספרות: למספר עם פחות ספרות יש ערך קטן יותר. אחר כך ${c.g('השווה', 'השווי')} ספרה אחרי ספרה, משמאל.`,
            solution: [m(ord.map((i) => fmt(items[i])).join(up ? ' &lt; ' : ' &gt; '))],
          };
        }
        case 'maxMin': {
          const big = c.chance(0.5);
          const ds = c.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5).concat([0]);
          const desc = ds.slice().sort((x, y) => y - x);
          const asc = ds.slice().sort((x, y) => x - y);
          const minD = asc.slice(1, 2).concat([0], asc.slice(2));
          const ans = +(big ? desc : minD).join('');
          return {
            type: 'number', answer: ans,
            prompt: `${c.g('בנה', 'בני')} מהספרות ${c.shuffle(ds).join(', ')} את המספר ${b(big ? 'הגדול ביותר' : 'הקטן ביותר')} בן 6 ספרות. כל ספרה מופיעה פעם אחת בדיוק.`,
            hint: big ? 'הספרה הגדולה ביותר צריכה להיות במקום הגבוה ביותר.' : `הספרות הקטנות במקומות הגבוהים — אבל ${c.g('זכור', 'זכרי')}: מספר לא יכול להתחיל ב-0.`,
            solution: big ? [`מסדרים מהגדולה לקטנה: ${fmt(ans)}`] : [`בהתחלה הספרה הקטנה ביותר שאינה 0: ${asc[1]}.`, `אחריה ה-0, ואז שאר הספרות מהקטנה לגדולה: ${fmt(ans)}`],
          };
        }
        case 'howMany': {
          const n = bigNum(c.pick([5, 6]), 0.3);
          const u = c.pick([{ w: 'מאות', v: 100, adj: 'שלמות' }, { w: 'אלפים', v: 1000, adj: 'שלמים' }, { w: 'עשרות', v: 10, adj: 'שלמות' }]);
          const ans = Math.floor(n / u.v), place = u.v === 10 ? 1 : u.v === 100 ? 2 : 3;
          return {
            type: 'number', answer: ans, prompt: `כמה ${b(u.w)} ${u.adj} יש במספר ${m(fmt(n))}?`,
            hint: `${c.g('שים לב', 'שימי לב')}: לא שואלים מהי ספרת ה${u.w}, אלא כמה ${u.w} יש ${b('בכל המספר')}.`,
            solution: [`ספרת ה${u.w} היא ${digitAt(n, place)}, אבל גם המקומות הגבוהים יותר מכילים ${u.w}.`, `${m(`${fmt(n)} = ${fmt(ans)} ${X} ${fmt(u.v)} + ${n % u.v}`)}`, `יש ${fmt(ans)} ${u.w} ${u.adj}.`],
          };
        }
        case 'storyWords': {
          const sc = c.scene(NEWS_SC), f = c.friend();
          const L = level === 1 ? 5 : level === 2 ? 6 : 7;
          const n = numIn(sc.lo * P10(L - 1), (sc.hi + 1) * P10(L - 1) - 1, level === 3 ? 0.45 : 0.3);
          return {
            type: 'number', answer: n,
            prompt: `${f.name} ${f.g('קרא', 'קראה')} בחדשות ש${sc.what} ${b(HM.numToWords(n))}.<br>${c.g('כתוב', 'כתבי')} את המספר בספרות.`,
            hint: `${c.g('כתוב', 'כתבי')} כל מחלקה בנפרד, ו${c.g('זכור', 'זכרי')} את האפסים שומרי המקום.`,
            solution: [classSteps(n), `התשובה: ${fmt(n)}`],
          };
        }
        case 'storyCmp': {
          const sc = c.scene(CMP_SC), k = level === 1 ? 2 : 3, fs = friends(c, k);
          const nums = closeNums(level === 1 ? c.pick([4, 5]) : 6, k);
          const best = nums.indexOf(Math.max(...nums));
          const others = fs.filter((x, i) => i !== best).map((x) => x.name);
          return {
            type: 'choice', prompt: fs.map((f, i) => sc.say(f, m(fmt(nums[i])))).join('. ') + `.<br>${sc.q}`,
            choices: [fs[best].name, ...others], answer: 0,
            hint: `${c.g('השווה', 'השווי')} את המספרים: קודם את מספר הספרות, ואז ספרה אחרי ספרה משמאל.`,
            solution: [m(nums.slice().sort((x, y) => y - x).map(fmt).join(' &gt; ')), `התשובה: ${fs[best].name}`],
          };
        }
        case 'storyCmp3': {
          const sc = c.scene(CMP_SC), fs = friends(c, 3);
          const nums = closeNums(6, 3);
          const best = nums.indexOf(Math.max(...nums));
          const shows = nums.map((v, i) => (i === 0 ? m(fmt(v)) : i === 1 ? m(c.shuffle(expTerms(v)).map(fmt).join(' + ')) : m(expTerms(v).map((t) => `${String(t)[0]} ${X} ${fmt(t / +String(t)[0])}`).join(' + '))));
          return {
            type: 'choice', prompt: fs.map((f, i) => sc.say(f, shows[i])).join('. ') + `.<br>${sc.q}`,
            choices: [fs[best].name, ...fs.filter((x, i) => i !== best).map((x) => x.name)], answer: 0,
            hint: `קודם ${c.g('כתוב', 'כתבי')} כל כמות כמספר רגיל, ורק אחר כך ${c.g('השווה', 'השווי')}.`,
            solution: [fs.map((f, i) => `${f.name}: ${fmt(nums[i])}`).join(' • '), `הכי הרבה: ${fs[best].name}`],
          };
        }
        case 'storyOrder': {
          const sc = c.scene(CMP_SC), fs = friends(c, 4);
          const nums = closeNums(6, 3); nums.push(numIn(90000, 99999, 0.1));
          const ord = nums.map((x, i) => i).sort((i, j) => nums[j] - nums[i]);
          return {
            type: 'order', prompt: fs.map((f, i) => sc.say(f, m(fmt(nums[i])))).join('. ') + `.<br>${c.g('סדר', 'סדרי')} את השמות ${b('מהגדול לקטן')} לפי הכמות.`,
            items: fs.map((f) => f.name), answer: ord,
            hint: `${c.g('שים לב', 'שימי לב')} למספר הספרות של כל מספר לפני שמשווים.`,
            solution: [ord.map((i) => `${fs[i].name} (${fmt(nums[i])})`).join(' ← ')],
          };
        }
        case 'storyCode': {
          const f = c.friend(), big = c.chance(0.5);
          const ds = c.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4).concat([0]);
          const asc = ds.slice().sort((x, y) => x - y);
          const ans = +(big ? ds.slice().sort((x, y) => y - x) : asc.slice(1, 2).concat([0], asc.slice(2))).join('');
          return {
            type: 'number', answer: ans,
            prompt: `הקוד של הכספת ש${f.g('מצא', 'מצאה')} ${f.name} הוא ${b(big ? 'המספר הגדול ביותר' : 'המספר הקטן ביותר')} בן 5 ספרות שאפשר לבנות מהספרות ${c.shuffle(ds).join(', ')} (כל ספרה פעם אחת). מהו הקוד?`,
            hint: big ? 'הספרה הגדולה ביותר במקום הגבוה ביותר.' : 'מספר לא יכול להתחיל ב-0, אבל ה-0 יכול לבוא מיד אחרי הספרה הראשונה.',
            solution: [big ? `מסדרים את הספרות מהגדולה לקטנה.` : `ראשונה הספרה הקטנה ביותר שאינה 0 (${asc[1]}), אחריה 0, ואז השאר מהקטנה לגדולה.`, `הקוד: ${fmt(ans)}`],
          };
        }
        case 'storySucc': {
          const fs = friends(c, 2), k = c.rnd(2, 3);
          const n = bigNum(c.pick([5, 6]) - k, 0.2) * P10(k);
          const next = c.chance(0.5), ans = next ? n : n - 1, given = next ? n - 1 : n;
          return {
            type: 'number', answer: ans,
            prompt: `במופע הגדול חילקו כרטיסים ממוספרים לפי הסדר. ${fs[0].name} ${fs[0].g('קיבל', 'קיבלה')} את הכרטיס ${m(fmt(given))}, ו${fs[1].name} ${fs[1].g('קיבל', 'קיבלה')} את הכרטיס ${next ? 'שבא מיד אחריו' : 'שבא מיד לפניו'}. מה המספר על הכרטיס של ${fs[1].name}?`,
            hint: next ? 'הכרטיס הבא הוא המספר העוקב — גדול ב-1.' : 'הכרטיס שלפני הוא המספר הקודם — קטן ב-1.',
            solution: [m(`${fmt(given)} ${next ? '+' : MI} 1 = ${fmt(ans)}`)],
          };
        }
        case 'storySeq': {
          const sc = c.scene(SEQ_SC), f = c.friend();
          let j, a, k;
          if (level === 1) { j = c.pick([10, 100, 1000]); a = j === 1000 ? c.rnd(2, 9) * 1000 + c.rnd(1, 9) * 100 : c.rnd(120, 900); k = c.rnd(2, 4); }
          else if (level === 2) { j = c.pick([250, 1500, 2500, 5000]); a = c.rnd(5, 60) * 1000 + c.rnd(0, 9) * 100; k = c.rnd(4, 6); }
          else { j = c.pick([1250, 2500, 12500, 25000]); a = c.rnd(20, 300) * 1000; k = c.rnd(6, 8); }
          const ans = a + (k - 1) * j, ordw = (sc.fem ? ORD_F : ORD_M)[k - 1];
          return {
            type: 'number', answer: ans,
            prompt: `${sc.txt(f, a, j)}<br>${sc.q(ordw, f)}`,
            hint: level === 3 ? `מהתקופה הראשונה עד ה${ordw} יש ${k - 1} קפיצות של ${fmt(j)}. אפשר לחשב את כולן בבת אחת.` : `${c.g('המשך', 'המשיכי')} את הסדרה: בכל פעם ${c.g('הוסף', 'הוסיפי')} ${fmt(j)}.`,
            solution: level === 3
              ? [`מספר הקפיצות: ${k - 1}.`, m(`${k - 1} ${X} ${fmt(j)} = ${fmt((k - 1) * j)}`), m(`${fmt(a)} + ${fmt((k - 1) * j)} = ${fmt(ans)}`)]
              : [HM.seq(HM.range(0, k - 1).map((i) => fmt(a + i * j))), `התשובה: ${fmt(ans)}`],
          };
        }
      }
    },
  });

  /* ========== חיבור וחיסור (א) ========== */
  // תרחישי חיבור, חיסור (נשאר) והשוואה (בכמה יותר). A, B מחרוזות מעוצבות
  const AS_SC = [
    { tags: ['games'], add: (f, A, B) => `${f.name} ${f.g('צבר', 'צברה')} במשחק בשלב הראשון ${A} נקודות ובשלב השני ${B} נקודות.`, qAdd: (f) => `כמה נקודות ${f.g('צבר', 'צברה')} ${f.name} בשני השלבים יחד?`,
      sub: (f, A, B) => `ל${f.name} היו ${A} מטבעות במשחק. ${f.g('הוא קנה', 'היא קנתה')} שריון חדש ב-${B} מטבעות.`, qSub: (f) => `כמה מטבעות נשארו ל${f.name}?`,
      more: (f, g, A, B) => `${f.name} ${f.g('צבר', 'צברה')} ${A} נקודות, ו${g.name} ${g.g('צבר', 'צברה')} ${B} נקודות.`, qMore: (f, g) => `בכמה נקודות יותר ${f.g('צבר', 'צברה')} ${f.name}?` },
    { tags: ['sport'], add: (f, A, B) => `ביום שישי הגיעו למשחק של הקבוצה ש${f.name} ${f.g('אוהד', 'אוהדת')} ${A} צופים, ובשבת הגיעו ${B} צופים.`, qAdd: () => 'כמה צופים הגיעו בשני הימים יחד?',
      sub: (f, A, B) => `באצטדיון יש ${A} מקומות ישיבה. למשחק הגיעו ${B} צופים, וכל אחד מהם ישב במקום משלו.`, qSub: () => 'כמה מקומות נשארו ריקים?',
      more: (f, g, A, B) => `${f.name} ${f.g('רץ', 'רצה')} החודש ${A} מטרים, ו${g.name} ${g.g('רץ', 'רצה')} ${B} מטרים.`, qMore: (f) => `בכמה מטרים יותר ${f.g('רץ', 'רצה')} ${f.name}?` },
    { tags: ['animals'], add: (f, A, B) => `בגן החיות ביקרו ביולי ${A} אנשים ובאוגוסט ${B} אנשים.`, qAdd: () => 'כמה אנשים ביקרו בגן החיות בשני החודשים יחד?',
      sub: (f, A, B) => `בחווה של הסבא של ${f.name} נאספו החודש ${A} ביצים. ${B} ביצים נמכרו.`, qSub: () => 'כמה ביצים לא נמכרו?',
      more: (f, g, A, B) => `בשמורת הטבע ספרו השנה ${A} ציפורים נודדות, ובשנה שעברה ספרו ${B}.`, qMore: () => 'בכמה ציפורים יותר ספרו השנה?' },
    { tags: ['space'], add: (f, A, B) => `החללית טסה ביום הראשון ${A} ק"מ וביום השני ${B} ק"מ.`, qAdd: () => 'כמה קילומטרים טסה החללית בשני הימים יחד?',
      sub: (f, A, B) => `החללית צריכה לעבור ${A} ק"מ עד תחנת החלל. היא כבר עברה ${B} ק"מ.`, qSub: () => 'כמה קילומטרים נשארו לה?',
      more: (f, g, A, B) => `לוויין אחד נמצא במרחק ${A} ק"מ מכדור הארץ, ולוויין אחר נמצא במרחק ${B} ק"מ.`, qMore: () => 'בכמה קילומטרים הלוויין הראשון רחוק יותר?' },
    { tags: ['music'], add: (f, A, B) => `לשיר הראשון של הלהקה ש${f.name} ${f.g('אוהב', 'אוהבת')} היו ${A} השמעות, ולשיר השני היו ${B} השמעות.`, qAdd: () => 'כמה השמעות היו לשני השירים יחד?',
      sub: (f, A, B) => `באולם המופעים יש ${A} מקומות. כבר נמכרו ${B} כרטיסים.`, qSub: () => 'כמה כרטיסים עוד אפשר למכור?',
      more: (f, g, A, B) => `להופעה ביום חמישי הגיעו ${A} אנשים, ולהופעה ביום שישי הגיעו ${B} אנשים.`, qMore: () => 'בכמה אנשים יותר הגיעו ביום חמישי?' },
    { tags: ['baking'], add: (f, A, B) => `המאפייה אפתה בבוקר ${A} עוגיות ובערב ${B} עוגיות.`, qAdd: () => 'כמה עוגיות אפתה המאפייה באותו יום?',
      sub: (f, A, B) => `במחסן של המאפייה היו ${A} גרם קמח. האופים השתמשו ב-${B} גרם.`, qSub: () => 'כמה גרם קמח נשארו?',
      more: (f, g, A, B) => `בחנוכה מכרה המאפייה ${A} סופגניות, ובפורים מכרה ${B} אוזני המן.`, qMore: () => 'בכמה סופגניות נמכרו יותר מאוזני המן?' },
    { tags: ['art'], add: (f, A, B) => `לתערוכת הציורים הגיעו בשבוע הראשון ${A} מבקרים ובשבוע השני ${B} מבקרים.`, qAdd: () => 'כמה מבקרים הגיעו בשני השבועות יחד?',
      sub: (f, A, B) => `בחנות היצירה היו ${A} טושים. במהלך השנה נמכרו ${B} טושים.`, qSub: () => 'כמה טושים נשארו בחנות?',
      more: (f, g, A, B) => `בפסיפס של ${f.name} יש ${A} אבנים, ובפסיפס של ${g.name} יש ${B} אבנים.`, qMore: (f) => `בכמה אבנים יותר יש בפסיפס של ${f.name}?` },
    { tags: ['nature'], add: (f, A, B) => `בשנה שעברה נטעו ביער ${A} עצים, והשנה נטעו ${B} עצים.`, qAdd: () => 'כמה עצים נטעו בשתי השנים יחד?',
      sub: (f, A, B) => `מסלול הטיול של ${f.name} ארוך ${A} מטרים. ${f.g('הוא', 'היא')} כבר ${f.g('הלך', 'הלכה')} ${B} מטרים.`, qSub: (f) => `כמה מטרים נשארו ל${f.name} ללכת?`,
      more: (f, g, A, B) => `${f.name} ${f.g('הלך', 'הלכה')} בטיול הראשון ${A} צעדים ובטיול השני ${B} צעדים.`, qMore: (f) => `בכמה צעדים יותר ${f.g('הלך', 'הלכה')} ${f.name} בטיול הראשון?` },
    { tags: ['reading'], add: (f, A, B) => `בספר הראשון בסדרה יש ${A} מילים ובספר השני יש ${B} מילים.`, qAdd: () => 'כמה מילים יש בשני הספרים יחד?',
      sub: (f, A, B) => `בספרייה של בית הספר יש ${A} ספרים. ${B} ספרים מושאלים עכשיו לתלמידים.`, qSub: () => 'כמה ספרים נמצאים עכשיו על המדפים?',
      more: (f, g, A, B) => `${f.name} ${f.g('קרא', 'קראה')} השנה ${A} עמודים, ו${g.name} ${g.g('קרא', 'קראה')} ${B} עמודים.`, qMore: (f) => `בכמה עמודים יותר ${f.g('קרא', 'קראה')} ${f.name}?` },
    { tags: ['tech'], add: (f, A, B) => `הרובוט של ${f.name} נסע ביום ראשון ${A} מטרים וביום שני ${B} מטרים.`, qAdd: () => 'כמה מטרים נסע הרובוט בשני הימים יחד?',
      sub: (f, A, B) => `בכרטיס הזיכרון יש מקום ל-${A} תמונות. ${f.name} כבר ${f.g('שמר', 'שמרה')} ${B} תמונות.`, qSub: () => 'לכמה תמונות נוספות יש עוד מקום?',
      more: (f, g, A, B) => `למשחק ש${f.g('תכנת', 'תכנתה')} ${f.name} יש ${A} הורדות, ולמשחק ש${g.g('תכנת', 'תכנתה')} ${g.name} יש ${B} הורדות.`, qMore: (f) => `בכמה הורדות יותר יש למשחק של ${f.name}?` },
    { tags: ['kpop'], add: (f, A, B) => `להופעה הראשונה של להקת הקיי-פופ נמכרו ${A} כרטיסים, ולהופעה השנייה ${B} כרטיסים.`, qAdd: () => 'כמה כרטיסים נמכרו לשתי ההופעות יחד?',
      sub: (f, A, B) => `למועדון המעריצים היו ${A} פוטוקארדים לחלוקה. בכנס המעריצים חילקו ${B} פוטוקארדים.`, qSub: () => 'כמה פוטוקארדים נשארו?',
      more: (f, g, A, B) => `לסרטון הריקוד ש${f.g('העלה', 'העלתה')} ${f.name} יש ${A} צפיות, ולסרטון ש${g.g('העלה', 'העלתה')} ${g.name} יש ${B} צפיות.`, qMore: (f) => `בכמה צפיות יותר יש לסרטון של ${f.name}?` },
    { tags: ['magic'], add: (f, A, B) => `בדואר הינשופים של עולם הקוסמים נשלחו בחודש הראשון ${A} מכתבים ובחודש השני ${B} מכתבים.`, qAdd: () => 'כמה מכתבים נשלחו בשני החודשים יחד?',
      sub: (f, A, B) => `בספריית הקסמים היו ${A} ספרי לחשים. התלמידים השאילו ${B} ספרים.`, qSub: () => 'כמה ספרי לחשים נשארו בספרייה?',
      more: (f, g, A, B) => `בדואר הינשופים נשלחו השנה ${A} מכתבים, ובשנה שעברה נשלחו ${B} מכתבים.`, qMore: () => 'בכמה מכתבים יותר נשלחו השנה?' },
    { tags: ['squishy'], add: (f, A, B) => `רשת חנויות הסקווישים מכרה בחודש הראשון ${A} סקווישים ובחודש השני ${B} סקווישים.`, qAdd: () => 'כמה סקווישים נמכרו בשני החודשים יחד?',
      sub: (f, A, B) => `במחסן של רשת חנויות הסקווישים היו ${A} סקווישים. הרשת מכרה ${B} מהם.`, qSub: () => 'כמה סקווישים נשארו במחסן?',
      more: (f, g, A, B) => `רשת חנויות הסקווישים מכרה ${A} סקווישים בצורת חיות ו-${B} סקווישים בצורת אוכל.`, qMore: () => 'בכמה סקווישים בצורת חיות נמכרו יותר?' },
  ];
  // מספר חסר בסיפור: kind = 'min' (מחוסר חסר), 'sub' (מחסר חסר), 'add' (מחובר חסר)
  const MISS_SC = [
    { tags: ['games'], kind: 'min', txt: (f, x, y) => `${f.name} ${f.g('קנה', 'קנתה')} במשחק חרב ב-${x} מטבעות, ונשארו ${f.g('לו', 'לה')} ${y} מטבעות.`, q: (f) => `כמה מטבעות היו ל${f.name} לפני הקנייה?` },
    { tags: ['reading'], kind: 'sub', txt: (f, x, y) => `בספרייה היו ${x} ספרים. אחרי שהשאילו חלק מהם, נשארו על המדפים ${y} ספרים.`, q: () => 'כמה ספרים הושאלו?' },
    { tags: ['sport'], kind: 'add', txt: (f, x, y) => `לאצטדיון יש שני שערים. בשער הצפוני נכנסו ${x} צופים, ובסך הכול נכנסו ${y} צופים.`, q: () => 'כמה צופים נכנסו בשער הדרומי?' },
    { tags: ['baking'], kind: 'min', txt: (f, x, y) => `המאפייה מכרה היום ${x} עוגיות, ונשארו בה ${y} עוגיות.`, q: () => 'כמה עוגיות היו במאפייה בתחילת היום?' },
    { tags: ['tech'], kind: 'sub', txt: (f, x, y) => `בטלפון של ${f.name} היו ${x} תמונות. ${f.g('הוא מחק', 'היא מחקה')} חלק מהן, ונשארו ${y} תמונות.`, q: (f) => `כמה תמונות ${f.g('מחק', 'מחקה')} ${f.name}?` },
    { tags: ['space'], kind: 'add', txt: (f, x, y) => `החללית טסה ביום הראשון ${x} ק"מ. אחרי היום השני היא עברה בסך הכול ${y} ק"מ.`, q: () => 'כמה קילומטרים טסה החללית ביום השני?' },
    { tags: ['animals'], kind: 'add', txt: (f, x, y) => `השבוע הגיעו לעמק החולה ${x} ציפורים נודדות, ועכשיו יש בעמק ${y} ציפורים נודדות.`, q: () => 'כמה ציפורים נודדות היו בעמק לפני השבוע?' },
    { tags: ['music', 'art'], kind: 'sub', txt: (f, x, y) => `באולם היו ${x} מקומות פנויים לפני הפסטיבל. אחרי שנמכרו כרטיסים, נשארו ${y} מקומות פנויים.`, q: () => 'כמה כרטיסים נמכרו?' },
    { tags: ['nature'], kind: 'add', txt: (f, x, y) => `בשבוע הראשון של הקיץ ביקרו בשמורת הטבע ${x} מטיילים, ובשני השבועות הראשונים ביקרו בה ${y} מטיילים.`, q: () => 'כמה מטיילים ביקרו בשבוע השני?' },
    { tags: ['kpop'], kind: 'sub', txt: (f, x, y) => `לסיבוב ההופעות של להקת הקיי-פופ היו ${x} כרטיסים. אחרי יום המכירה הראשון נשארו ${y} כרטיסים.`, q: () => 'כמה כרטיסים נמכרו ביום הראשון?' },
    { tags: ['magic'], kind: 'add', txt: (f, x, y) => `למחסן השרביטים הגדול של עולם הקוסמים הגיעו ${x} שרביטים חדשים, ועכשיו יש בו ${y} שרביטים.`, q: () => 'כמה שרביטים היו במחסן לפני המשלוח?' },
    { tags: ['squishy'], kind: 'min', txt: (f, x, y) => `רשת חנויות הסקווישים מכרה החודש ${x} סקווישים, ונשארו במחסן שלה ${y} סקווישים.`, q: () => 'כמה סקווישים היו במחסן בתחילת החודש?' },
  ];
  // סיפור דו-שלבי: חיסכון, מתנה וקנייה
  const BUY_SC = [
    { tags: ['sport', 'nature'], item: 'אופניים חדשים' }, { tags: ['music'], item: 'קלידים חשמליים' }, { tags: ['space'], item: 'טלסקופ' },
    { tags: ['games', 'tech'], item: 'מחשב חדש' }, { tags: ['baking'], item: 'מיקסר מקצועי' }, { tags: ['art'], item: 'כן ציור וערכת צבעים' },
    { tags: ['reading'], item: 'סדרת אנציקלופדיות' }, { tags: ['animals'], item: 'אקווריום גדול' },
    { tags: ['kpop'], item: 'כרטיסים להופעת קיי-פופ' }, { tags: ['magic'], item: 'כרטיסים לפארק הקוסמים' }, { tags: ['squishy'], item: 'מדף תצוגה ענק לסקווישים' },
  ];
  // אירועים למכירת כרטיסים (סיפור "יותר מ... ובסך הכול")
  const EVENT_SC = [
    { tags: ['sport'], ev: 'גמר הגביע' }, { tags: ['music'], ev: 'פסטיבל המוזיקה' }, { tags: ['space'], ev: 'תערוכת החלל' }, { tags: ['art'], ev: 'יריד האמנות' },
    { tags: ['animals'], ev: 'תערוכת הכלבים' }, { tags: ['games'], ev: 'כנס משחקי המחשב' }, { tags: ['baking'], ev: 'פסטיבל הקינוחים' },
    { tags: ['reading'], ev: 'שבוע הספר' }, { tags: ['tech'], ev: 'תחרות הרובוטים' }, { tags: ['nature'], ev: 'פסטיבל הפריחה' },
    { tags: ['kpop'], ev: 'הופעת הקיי-פופ' }, { tags: ['magic'], ev: 'פסטיבל הקוסמים' }, { tags: ['squishy'], ev: 'יריד הסקווישים' },
  ];
  // זוג מספרים לחיבור / חיסור לפי רמה (תמיד עם המרה)
  function addPair(level) {
    for (;;) {
      const a = level === 1 ? HM.rnd(1200, 6999) : level === 2 ? HM.rnd(12000, 79999) : HM.rnd(120000, 699999);
      const b = level === 1 ? HM.rnd(250, 2999) : level === 2 ? HM.rnd(3000, 49999) : HM.rnd(30000, 299999);
      if (carries(a, b).some((x) => x)) return [a, b];
    }
  }
  function subPair(level) {
    for (;;) {
      let a = level === 1 ? HM.rnd(2000, 9999) : level === 2 ? numIn(20000, 99999, 0.3) : numIn(100000, 999999, 0.35);
      const b = level === 1 ? HM.rnd(300, a - 500) : level === 2 ? HM.rnd(2000, a - 1000) : HM.rnd(10000, a - 5000);
      if (b > 0 && carries(a - b, b).some((x) => x)) return [a, b];
    }
  }
  const roundWord = { 10: 'לעשרות', 100: 'למאות', 1000: 'לאלפים', 10000: 'לעשרות אלפים' };
  const placeOf = { 10: 1, 100: 2, 1000: 3, 10000: 4 };
  function roundSol(n, u) {
    const p = placeOf[u], d = digitAt(n, p - 1), r = HM.roundTo(n, u);
    return [`מסתכלים על הספרה שמימין למקום ${PN[p]}: זו ספרת ${PN[p - 1]} — ${d}.`, `${d} ${d >= 5 ? 'היא 5 או יותר ← מעגלים כלפי מעלה' : 'קטנה מ-5 ← מעגלים כלפי מטה'}.`, `${m(`${fmt(n)} ≈ ${fmt(r)}`)}`];
  }

  HM.lesson({
    id: 'n-addsub-a',
    learn: (c) => [
      {
        title: 'חיבור במאונך',
        html: `${c.name} ${c.g('צבר', 'צברה')} במשחק ${m('4,385')} נקודות בשלב הראשון ו-${m('2,947')} בשלב השני. כמה בסך הכול?<br>כותבים את ${b('המחוברים')} זה מתחת לזה — יחידות מתחת ליחידות, עשרות מתחת לעשרות — ומחברים מימין לשמאל.`,
        visual: V.column(['4385', '2947'], '+', { result: '7332', carry: carries(4385, 2947) }),
        steps: [
          `יחידות: ${m('5 + 7 = 12')} ← כותבים 2 ומעבירים 1 לעשרות.`,
          `עשרות: ${m('8 + 4 + 1 = 13')} ← כותבים 3 ומעבירים 1 למאות.`,
          `מאות: ${m('3 + 9 + 1 = 13')} ← כותבים 3 ומעבירים 1 לאלפים.`,
          `אלפים: ${m('4 + 2 + 1 = 7')}. ${b('הסכום')}: ${m('7,332')}.`,
        ],
      },
      {
        title: 'חיסור ופריטה',
        html: `בתרגיל ${m('6,204 − 2,857')}: 6,204 הוא ${b('המחוסר')}, 2,857 הוא ${b('המחסר')}, והתוצאה היא ${b('ההפרש')}.<br>כשהספרה למעלה קטנה מדי — ${b('פורטים')}: לוקחים 1 מהמקום שמשמאל, והוא שווה 10 במקום שלנו.`,
        visual: col(6204, 2857, MI, 3347),
        steps: [
          `יחידות: 4 קטן מ-7. אין עשרות לפרוט (0), אז פורטים מאה אחת ל-10 עשרות, ועשרת אחת ל-10 יחידות.`,
          `יחידות: ${m('14 − 7 = 7')}. עשרות: ${m('9 − 5 = 4')}.`,
          `מאות: נשארה מאה אחת. 1 קטן מ-8, אז פורטים אלף: ${m('11 − 8 = 3')}.`,
          `אלפים: ${m('5 − 2 = 3')}. ההפרש: ${m('3,347')}.`,
        ],
      },
      {
        title: 'בודקים חיסור בעזרת חיבור',
        html: `ההפרש והמחסר ביחד יוצרים את המחוסר:<br>${m('3,347 + 2,857 = 6,204')}<br>לכן אחרי כל חיסור ${c.g('אתה יכול', 'את יכולה')} לבדוק: ${b('ההפרש + המחסר')} צריכים לתת את ${b('המחוסר')}. אם לא — יש טעות.`,
        visual: barModel('מחוסר: 6,204', [{ v: 2857, label: 'מחסר: 2,857' }, { v: 3347, label: 'הפרש: 3,347' }]),
      },
      {
        title: 'כשחסר מספר',
        html: `• חסר ${b('המחוסר')}? מחברים: ${m(HM.box() + ' − 1,250 = 3,400')} ← ${m('3,400 + 1,250 = 4,650')}.<br>• חסר ${b('המחסר')}? מחסרים מהמחוסר: ${m('5,000 − ' + HM.box() + ' = 1,200')} ← ${m('5,000 − 1,200 = 3,800')}.<br>${c.g('דמיין', 'דמייני')} את מודל הפסים: השלם הוא המחוסר, והחלקים הם המחסר וההפרש.`,
        visual: barModel('5,000', [{ v: 3800, label: '?' }, { v: 1200, label: '1,200' }]),
        quiz: {
          type: 'number', answer: 5300, prompt: `${c.g('השלם', 'השלימי')}: ${m(slot(0) + ' − 2,700 = 2,600')}`,
          hint: 'חסר המחוסר — השלם. ' + c.g('חבר', 'חברי') + ' את שני החלקים.',
          solution: [m('2,600 + 2,700 = 5,300')],
        },
      },
      {
        title: 'עיגול מספרים',
        html: `לעגל ${b('למאות')} פירושו למצוא את המאה העגולה הקרובה ביותר.<br>${m('3,468')} נמצא בין 3,400 ל-3,500, וקרוב יותר ל-${b('3,500')}.<br>הכלל: מסתכלים על ${b('הספרה שמימין')} למקום שאליו מעגלים. 0–4 ← כלפי מטה; 5–9 ← כלפי מעלה.`,
        visual: V.numberLine({ min: 3400, max: 3500, step: 10, every: 5, w: 520, labels: (v, i) => (i % 5 === 0 ? fmt(v) : null), marks: [{ v: 3468, label: '3,468' }] }),
        steps: [`נעגל את ${m('27,649')} לאלפים: ספרת האלפים היא 7.`, `הספרה שמימינה (המאות) היא 6, כלומר 5 או יותר.`, `לכן מעגלים כלפי מעלה: ${m('27,649 ≈ 28,000')}.`],
      },
      {
        title: 'אומדן לפני חישוב',
        html: `לפני שמחשבים, כדאי לעשות ${b('אומדן')}: מעגלים את המספרים ומחשבים בראש.<br>${m('4,385 + 2,947 ≈ 4,000 + 3,000 = 7,000')}<br>התשובה המדויקת, 7,332, קרובה לאומדן — סימן טוב! אם היינו מקבלים 73,320, האומדן היה מגלה מיד שטעינו.`,
        quiz: {
          type: 'choice', prompt: `מה האומדן הטוב ביותר ל-${m('5,912 + 3,105')}? (${c.g('עגל', 'עגלי')} לאלפים)`,
          choices: ['9,000', '8,000', '90,000', '10,000'], answer: 0,
          hint: '5,912 קרוב ל-6,000, ו-3,105 קרוב ל-3,000.',
          solution: [m('6,000 + 3,000 = 9,000')],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['add', 'sub', 'missAdd', 'round', 'roundNL', 'check', 'storyAdd', 'storySub', 'storyMore', 'storyAdd']
        : level === 2 ? ['add', 'sub', 'missMin', 'missSub', 'check', 'round', 'estimate', 'storySub', 'storyMore', 'storyMiss', 'storyRound', 'storyMiss']
        : ['add3', 'subZeros', 'missMin', 'missSub', 'checkTF', 'roundTrap', 'estimate', 'storyTwo', 'storyMoreTotal', 'storyMiss', 'storyTwo', 'storyEst'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'add': {
          const [a, bb] = addPair(level);
          return {
            type: 'number', answer: a + bb, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(a)} + ${fmt(bb)} = ` + slot(0))}`,
            visual: level === 1 ? col(a, bb, '+', null) : undefined,
            hint: `${c.g('כתוב', 'כתבי')} במאונך: יחידות מתחת ליחידות. ${c.g('התחל', 'התחילי')} מהיחידות, ו${c.g('זכור', 'זכרי')} להעביר 1 כשהסכום במקום מסוים הוא 10 או יותר.`,
            solution: [col(a, bb, '+', a + bb), `${b('הסכום')}: ${fmt(a + bb)}`],
          };
        }
        case 'add3': {
          const a = c.rnd(12000, 89999), bb = c.rnd(3000, 9999), cc = c.rnd(20000, 99999), s = a + bb + cc;
          return {
            type: 'number', answer: s, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(a)} + ${fmt(bb)} + ${fmt(cc)} = ` + slot(0))}`,
            hint: `${c.g('כתוב', 'כתבי')} את שלושת המחוברים במאונך, יחידות מתחת ליחידות. ${c.g('שים לב', 'שימי לב')}: לפעמים מעבירים 2 ולא 1.`,
            solution: [m(`${fmt(a)} + ${fmt(bb)} = ${fmt(a + bb)}`), m(`${fmt(a + bb)} + ${fmt(cc)} = ${fmt(s)}`)],
          };
        }
        case 'sub': case 'subZeros': {
          let a, bb;
          if (kind === 'subZeros') { a = c.pick([c.rnd(2, 9) * 10000 + c.rnd(1, 9), c.rnd(1, 9) * 100000, c.rnd(2, 9) * 10000 + c.rnd(1, 9) * 100, c.rnd(1, 9) * 100000 + c.rnd(1, 9) * 1000 + c.rnd(1, 9)]); bb = c.rnd(Math.floor(a / 5), a - 1000); }
          else [a, bb] = subPair(level);
          const r = a - bb;
          return {
            type: 'number', answer: r, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(a)} − ${fmt(bb)} = ` + slot(0))}`,
            visual: level === 1 ? col(a, bb, MI, null) : undefined,
            hint: kind === 'subZeros' ? `במחוסר יש אפסים. כדי לפרוט, ${c.g('לך', 'לכי')} שמאלה עד הספרה הראשונה שאינה 0.` : `${c.g('התחל', 'התחילי')} מהיחידות. כשהספרה למעלה קטנה מהספרה למטה — ${c.g('פרוט', 'פרטי')} מהמקום שמשמאל.`,
            solution: [col(a, bb, MI, r), `בדיקה: ${m(`${fmt(r)} + ${fmt(bb)} = ${fmt(a)}`)} ✔`],
          };
        }
        case 'missAdd': {
          const t = c.rnd(3, 9) * 1000 + c.pick([0, 500]), a = c.rnd(12, Math.floor(t / 100) - 5) * 100 + c.pick([0, 50]);
          const first = c.chance(0.5);
          return {
            type: 'number', answer: t - a, prompt: `${c.g('השלם', 'השלימי')}: ${m((first ? `${fmt(a)} + ` + slot(0) : slot(0) + ` + ${fmt(a)}`) + ` = ${fmt(t)}`)}`,
            visual: barModel(fmt(t), [{ v: a, label: fmt(a) }, { v: t - a, label: '?' }]),
            hint: `חסר מחובר. ${c.g('חסר', 'חסרי')} את המחובר הידוע מהסכום.`,
            solution: [m(`${fmt(t)} − ${fmt(a)} = ${fmt(t - a)}`), `בדיקה: ${m(`${fmt(a)} + ${fmt(t - a)} = ${fmt(t)}`)} ✔`],
          };
        }
        case 'missMin': {
          const [x, y] = level === 2 ? [c.rnd(1200, 9999), c.rnd(2000, 30000)] : [c.rnd(12000, 99999), c.rnd(30000, 500000)];
          return {
            type: 'number', answer: x + y, prompt: `${c.g('השלם', 'השלימי')}: ${m(slot(0) + ` − ${fmt(x)} = ${fmt(y)}`)}`,
            hint: `חסר ${b('המחוסר')} — המספר הגדול שממנו מחסרים. ${c.g('חבר', 'חברי')} את ההפרש והמחסר.`,
            solution: [m(`${fmt(y)} + ${fmt(x)} = ${fmt(x + y)}`), `בדיקה: ${m(`${fmt(x + y)} − ${fmt(x)} = ${fmt(y)}`)} ✔`],
          };
        }
        case 'missSub': {
          const a = level === 2 ? c.rnd(20000, 90000) : c.rnd(200000, 900000), y = c.rnd(Math.floor(a / 6), Math.floor(a * 0.8));
          return {
            type: 'number', answer: a - y, prompt: `${c.g('השלם', 'השלימי')}: ${m(`${fmt(a)} − ` + slot(0) + ` = ${fmt(y)}`)}`,
            hint: `חסר ${b('המחסר')}. אם מהמחוסר מורידים את ההפרש — מה נשאר?`,
            solution: [m(`${fmt(a)} − ${fmt(y)} = ${fmt(a - y)}`), `בדיקה: ${m(`${fmt(a)} − ${fmt(a - y)} = ${fmt(y)}`)} ✔`],
          };
        }
        case 'check': {
          const [a, bb] = subPair(level === 1 ? 1 : 2), r = a - bb;
          return {
            type: 'choice', prompt: `באיזה תרגיל חיבור אפשר לבדוק את התרגיל ${m(`${fmt(a)} − ${fmt(bb)} = ${fmt(r)}`)}?`,
            choices: [m(`${fmt(r)} + ${fmt(bb)} = ${fmt(a)}`), m(`${fmt(a)} + ${fmt(bb)} = ${fmt(a + bb)}`), m(`${fmt(a)} + ${fmt(r)} = ${fmt(a + r)}`)], answer: 0,
            hint: 'ההפרש + המחסר = המחוסר.',
            solution: [`מחברים את ההפרש (${fmt(r)}) עם המחסר (${fmt(bb)}) וצריך לקבל את המחוסר (${fmt(a)}).`, m(`${fmt(r)} + ${fmt(bb)} = ${fmt(a)}`)],
          };
        }
        case 'checkTF': {
          const f = c.friend(), [a, bb] = subPair(3), r = a - bb;
          let wrong = r;
          if (c.chance(0.6)) { const ws = []; for (let p = 0; p < nDigits(a); p++) ws.push(Math.abs(digitAt(a, p) - digitAt(bb, p)) * P10(p)); const w1 = HM.sum(ws); wrong = w1 !== r ? w1 : r + c.pick([10, 100, 1000]); }
          return {
            type: 'tf', answer: wrong === r,
            prompt: `${f.name} ${f.g('פתר', 'פתרה')}: ${m(`${fmt(a)} − ${fmt(bb)} = ${fmt(wrong)}`)}.<br>${c.g('בדוק', 'בדקי')} בעזרת חיבור: האם התשובה נכונה?`,
            hint: `${c.g('חבר', 'חברי')} את ההפרש עם המחסר. האם התקבל המחוסר?`,
            solution: [m(`${fmt(wrong)} + ${fmt(bb)} = ${fmt(wrong + bb)}`), wrong === r ? `קיבלנו את המחוסר — התשובה נכונה.` : `קיבלנו ${fmt(wrong + bb)} ולא ${fmt(a)} — יש טעות. התשובה הנכונה: ${fmt(r)}.`],
          };
        }
        case 'round': case 'roundTrap': {
          let u, n;
          if (kind === 'roundTrap') { u = c.pick([100, 1000, 10000]); n = c.rnd(1, 89) * u * 10 + 9 * u + c.rnd(Math.ceil(u / 2), u - 1); }
          else if (level === 1) { u = c.pick([10, 100]); n = c.rnd(110, 9989); }
          else { u = c.pick([100, 1000, 1000, 10000]); n = c.rnd(10001, 899999); }
          if (n % u === 0) n += c.rnd(1, u - 1);
          const ans = HM.roundTo(n, u);
          return {
            type: 'number', answer: ans, prompt: `${c.g('עגל', 'עגלי')} את המספר ${m(fmt(n))} ${b(roundWord[u])}.`,
            hint: `${c.g('הסתכל', 'הסתכלי')} על הספרה שמימין למקום ${PN[placeOf[u]]}: אם היא 5 או יותר — מעגלים כלפי מעלה.${kind === 'roundTrap' ? ` ${c.g('שים לב', 'שימי לב')} מה קורה כשמוסיפים 1 לספרה 9.` : ''}`,
            solution: roundSol(n, u),
          };
        }
        case 'roundNL': {
          const u = c.pick([10, 100]), min = c.rnd(1, 30) * 10 * u, k = c.rnd(1, 9);
          const d = c.pick([-1, 1]) * c.rnd(1, u / 2 - 1), n = min + k * u + d;
          return {
            type: 'numberline', answer: min + k * u,
            prompt: `על הישר מסומן המספר ${m(fmt(n))}. ${c.g('גע', 'געי')} ב${u === 10 ? 'עשרת העגולה' : 'מאה העגולה'} הקרובה אליו ביותר.`,
            line: { min, max: min + 10 * u, step: u, labels: (v, i) => (i === 0 || i === 10 ? fmt(v) : null), marks: [{ v: n, label: fmt(n) }] },
            hint: `כל סימון הוא ${u === 10 ? 'עשרת' : 'מאה'} עגולה. ${c.g('מצא', 'מצאי')} את שני הסימונים שהמספר נמצא ביניהם, ו${c.g('בחר', 'בחרי')} את הקרוב יותר.`,
            solution: [`${fmt(n)} נמצא בין ${fmt(min + (d < 0 ? k - 1 : k) * u)} ל-${fmt(min + (d < 0 ? k : k + 1) * u)}.`, `הוא קרוב יותר ל-${fmt(min + k * u)}.`],
          };
        }
        case 'estimate': {
          const isAdd = c.chance(0.5);
          const u = level === 2 ? 1000 : 10000;
          let a = c.rnd(isAdd ? 2.1 * u : 5.1 * u, 9.8 * u), bb = c.rnd(1.1 * u, isAdd ? 4.9 * u : 3.9 * u);
          if (a % u === u / 2) a += 7;
          if (bb % u === u / 2) bb += 3;
          const ra = HM.roundTo(a, u), rb = HM.roundTo(bb, u), E = isAdd ? ra + rb : ra - rb;
          const fl = isAdd ? Math.floor(a / u) * u + Math.floor(bb / u) * u : Math.floor(a / u) * u - Math.floor(bb / u) * u;
          return {
            type: 'choice', prompt: `${c.g('עגל', 'עגלי')} כל מספר ${roundWord[u]} ו${c.g('מצא', 'מצאי')} אומדן ל${isAdd ? 'סכום' : 'הפרש'}: ${m(`${fmt(a)} ${isAdd ? '+' : MI} ${fmt(bb)}`)}`,
            ...opts(E, [fl, E + u, E - u, E * 10, E + 2 * u]),
            hint: `${c.g('עגל', 'עגלי')} כל מספר בנפרד, ורק אחר כך ${isAdd ? c.g('חבר', 'חברי') : c.g('חסר', 'חסרי')}.`,
            solution: [`${m(`${fmt(a)} ≈ ${fmt(ra)}`)}, ${m(`${fmt(bb)} ≈ ${fmt(rb)}`)}`, m(`${fmt(ra)} ${isAdd ? '+' : MI} ${fmt(rb)} = ${fmt(E)}`)],
          };
        }
        case 'storyAdd': case 'storySub': case 'storyMore': {
          const sc = c.scene(AS_SC), [f, g] = friends(c, 2);
          const isAdd = kind === 'storyAdd';
          const [p, q] = isAdd ? addPair(level) : subPair(level);
          const A = p, B = q;
          const ans = isAdd ? A + B : A - B;
          const txt = isAdd ? sc.add(f, fmt(A), fmt(B)) + '<br>' + sc.qAdd(f) : kind === 'storySub' ? sc.sub(f, fmt(A), fmt(B)) + '<br>' + sc.qSub(f) : sc.more(f, g, fmt(A), fmt(B)) + '<br>' + sc.qMore(f, g);
          return {
            type: 'number', answer: ans, prompt: txt,
            hint: isAdd ? `מחברים את שני החלקים כדי למצוא את הכול.` : kind === 'storySub' ? 'מהכמות שהייתה מורידים את מה שהשתמשו בו — זה חיסור.' : `"בכמה יותר" — מוצאים את ${b('ההפרש')}: מהמספר הגדול מחסרים את הקטן.`,
            solution: [m(`${fmt(A)} ${isAdd ? '+' : MI} ${fmt(B)} = ${fmt(ans)}`), `התשובה: ${fmt(ans)}`],
          };
        }
        case 'storyMiss': {
          const sc = c.scene(MISS_SC), f = c.friend();
          const [p, q] = subPair(level); // p > q
          let x, y, ans, sol;
          if (sc.kind === 'min') { x = q; y = p - q; ans = p; sol = m(`${fmt(y)} + ${fmt(x)} = ${fmt(ans)}`); }
          else if (sc.kind === 'sub') { x = p; y = p - q; ans = q; sol = m(`${fmt(x)} − ${fmt(y)} = ${fmt(ans)}`); }
          else { x = q; y = p; ans = p - q; sol = m(`${fmt(y)} − ${fmt(x)} = ${fmt(ans)}`); }
          return {
            type: 'number', answer: ans, prompt: `${sc.txt(f, fmt(x), fmt(y))}<br>${sc.q(f)}`,
            visual: level === 2 ? barModel(sc.kind === 'min' ? '?' : fmt(sc.kind === 'sub' ? x : y), sc.kind === 'min' ? [{ v: x, label: fmt(x) }, { v: y, label: fmt(y) }] : sc.kind === 'sub' ? [{ v: ans, label: '?' }, { v: y, label: fmt(y) }] : [{ v: x, label: fmt(x) }, { v: ans, label: '?' }]) : undefined,
            hint: sc.kind === 'min' ? 'חסרה הכמות שהייתה בהתחלה — השלם. מחברים את שני החלקים.' : 'ידוע השלם וידוע חלק אחד. מחסרים כדי למצוא את החלק השני.',
            solution: [sol, `התשובה: ${fmt(ans)}`],
          };
        }
        case 'storyRound': {
          const sc = c.scene(NEWS_SC), f = c.friend(), u = c.pick([1000, 10000, 100]);
          let n = c.rnd(12001, 98999); if (n % u === 0) n += 7;
          return {
            type: 'number', answer: HM.roundTo(n, u),
            prompt: `${f.name} ${f.g('קרא', 'קראה')} בחדשות ש${sc.what} ${m(fmt(n))}. בכותרת ${f.g('הוא', 'היא')} רוצה לכתוב את המספר מעוגל ${b(roundWord[u])}. מה ${f.g('יכתוב', 'תכתוב')}?`,
            hint: `${c.g('הסתכל', 'הסתכלי')} על הספרה שמימין למקום ${PN[placeOf[u]]}.`,
            solution: roundSol(n, u),
          };
        }
        case 'storyTwo': {
          const sc = c.scene(BUY_SC), f = c.friend();
          const A = c.rnd(12, 60) * 100 + c.rnd(0, 9) * 10, B = c.rnd(5, 30) * 50, C = c.rnd(Math.floor((A + B) / 300), Math.floor((A + B) / 120)) * 100 + c.rnd(1, 9) * 10;
          const ans = A + B - C;
          return {
            type: 'number', answer: ans, unit: '₪',
            prompt: `ל${f.name} היו בחיסכון ${fmt(A)} ₪. ליום ההולדת ${f.g('הוא קיבל', 'היא קיבלה')} עוד ${fmt(B)} ₪, ואחר כך ${f.g('קנה', 'קנתה')} ${sc.item} ב-${fmt(C)} ₪.<br>כמה כסף נשאר ל${f.name}?`,
            hint: `יש כאן שני שלבים: קודם ${c.g('מצא', 'מצאי')} כמה כסף היה אחרי יום ההולדת, ואז ${c.g('חסר', 'חסרי')} את המחיר.`,
            solution: [m(`${fmt(A)} + ${fmt(B)} = ${fmt(A + B)}`), m(`${fmt(A + B)} − ${fmt(C)} = ${fmt(ans)}`), `נשארו ${fmt(ans)} ₪.`],
          };
        }
        case 'storyMoreTotal': {
          const sc = c.scene(EVENT_SC), A = c.rnd(12000, 48000), B = c.rnd(1500, 9800), more = c.chance(0.5);
          const second = more ? A + B : A - B, ans = A + second;
          return {
            type: 'number', answer: ans,
            prompt: `בשבוע הראשון נמכרו ל${sc.ev} ${fmt(A)} כרטיסים. בשבוע השני נמכרו ${fmt(B)} כרטיסים ${b(more ? 'יותר' : 'פחות')} מבשבוע הראשון.<br>כמה כרטיסים נמכרו בשני השבועות יחד?`,
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה כרטיסים נמכרו בשבוע השני, ורק אחר כך ${c.g('חבר', 'חברי')} את שני השבועות.`,
            solution: [`בשבוע השני: ${m(`${fmt(A)} ${more ? '+' : MI} ${fmt(B)} = ${fmt(second)}`)}`, `ביחד: ${m(`${fmt(A)} + ${fmt(second)} = ${fmt(ans)}`)}`],
          };
        }
        case 'storyEst': {
          const sc = c.scene(BUY_SC), f = c.friend(), sc2 = c.pick(BUY_SC.filter((x) => x !== sc));
          const a = c.rnd(21, 48) * 100 + c.rnd(1, 99), bb = c.rnd(11, 38) * 100 + c.rnd(1, 99), budget = c.pick([HM.roundTo(a + bb, 1000) + 1000, HM.roundTo(a + bb, 1000) - 1000]);
          const ok = a + bb <= budget;
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('חוסך', 'חוסכת')} לקנות ${sc.item} ב-${fmt(a)} ₪ וגם ${sc2.item} ב-${fmt(bb)} ₪. יש ${f.g('לו', 'לה')} ${fmt(budget)} ₪.<br>נכון או לא נכון: יש ל${f.name} מספיק כסף לקנות את שניהם?`,
            hint: `${c.g('עגל', 'עגלי')} את המחירים למאות ו${c.g('חבר', 'חברי')} — זה אומדן מהיר. אחר כך ${c.g('השווה', 'השווי')} לכסף שיש.`,
            solution: [`אומדן: ${m(`${fmt(HM.roundTo(a, 100))} + ${fmt(HM.roundTo(bb, 100))} = ${fmt(HM.roundTo(a, 100) + HM.roundTo(bb, 100))}`)}`, `בדיוק: ${m(`${fmt(a)} + ${fmt(bb)} = ${fmt(a + bb)}`)}`, ok ? `${fmt(a + bb)} ≤ ${fmt(budget)} — יש מספיק כסף. נכון.` : `${fmt(a + bb)} גדול מ-${fmt(budget)} — אין מספיק כסף. לא נכון.`],
          };
        }
      }
    },
  });

  /* ========== חיבור וחיסור (ב) ========== */
  // שני "מכלים" בסיפור: b1/b2 = בתוך, f1/f2 = מתוך, t1/t2 = אל, both = בשניהם
  const BOX_SC = [
    { tags: ['reading'], b1: 'במדף העליון', b2: 'במדף התחתון', f1: 'מהמדף העליון', f2: 'מהמדף התחתון', t1: 'למדף העליון', t2: 'למדף התחתון', both: 'בשני המדפים', u: 'ספרים' },
    { tags: ['baking'], b1: 'בתבנית הראשונה', b2: 'בתבנית השנייה', f1: 'מהתבנית הראשונה', f2: 'מהתבנית השנייה', t1: 'לתבנית הראשונה', t2: 'לתבנית השנייה', both: 'בשתי התבניות', u: 'עוגיות' },
    { tags: ['art'], b1: 'בקופסה האדומה', b2: 'בקופסה הכחולה', f1: 'מהקופסה האדומה', f2: 'מהקופסה הכחולה', t1: 'לקופסה האדומה', t2: 'לקופסה הכחולה', both: 'בשתי הקופסאות', u: 'טושים' },
    { tags: ['animals'], b1: 'בכלוב הגדול', b2: 'בכלוב הקטן', f1: 'מהכלוב הגדול', f2: 'מהכלוב הקטן', t1: 'לכלוב הגדול', t2: 'לכלוב הקטן', both: 'בשני הכלובים', u: 'תוכים' },
    { tags: ['nature'], b1: 'בערוגה הראשונה', b2: 'בערוגה השנייה', f1: 'מהערוגה הראשונה', f2: 'מהערוגה השנייה', t1: 'לערוגה הראשונה', t2: 'לערוגה השנייה', both: 'בשתי הערוגות', u: 'שתילים' },
    { tags: ['sport'], b1: 'בשק הראשון', b2: 'בשק השני', f1: 'מהשק הראשון', f2: 'מהשק השני', t1: 'לשק הראשון', t2: 'לשק השני', both: 'בשני השקים', u: 'כדורים' },
    { tags: ['games'], b1: 'בתיבת האוצר הראשונה', b2: 'בתיבת האוצר השנייה', f1: 'מהתיבה הראשונה', f2: 'מהתיבה השנייה', t1: 'לתיבה הראשונה', t2: 'לתיבה השנייה', both: 'בשתי התיבות', u: 'מטבעות' },
    { tags: ['music'], b1: 'ברשימת השירים הראשונה', b2: 'ברשימת השירים השנייה', f1: 'מהרשימה הראשונה', f2: 'מהרשימה השנייה', t1: 'לרשימה הראשונה', t2: 'לרשימה השנייה', both: 'בשתי הרשימות', u: 'שירים' },
    { tags: ['tech'], b1: 'בתיקייה הראשונה', b2: 'בתיקייה השנייה', f1: 'מהתיקייה הראשונה', f2: 'מהתיקייה השנייה', t1: 'לתיקייה הראשונה', t2: 'לתיקייה השנייה', both: 'בשתי התיקיות', u: 'קבצים' },
    { tags: ['space'], b1: 'בתא המטען הראשון של החללית', b2: 'בתא המטען השני', f1: 'מהתא הראשון', f2: 'מהתא השני', t1: 'לתא הראשון', t2: 'לתא השני', both: 'בשני התאים', u: 'ארגזים' },
    { tags: ['kpop'], b1: 'באלבום הפוטוקארדים הוורוד', b2: 'באלבום הפוטוקארדים הסגול', f1: 'מהאלבום הוורוד', f2: 'מהאלבום הסגול', t1: 'לאלבום הוורוד', t2: 'לאלבום הסגול', both: 'בשני האלבומים', u: 'פוטוקארדים' },
    { tags: ['magic'], b1: 'בארון השיקויים הראשון', b2: 'בארון השיקויים השני', f1: 'מהארון הראשון', f2: 'מהארון השני', t1: 'לארון הראשון', t2: 'לארון השני', both: 'בשני הארונות', u: 'בקבוקוני שיקוי' },
    { tags: ['squishy'], b1: 'בקופסת הסקווישים הגדולה', b2: 'בקופסת הסקווישים הקטנה', f1: 'מהקופסה הגדולה', f2: 'מהקופסה הקטנה', t1: 'לקופסה הגדולה', t2: 'לקופסה הקטנה', both: 'בשתי הקופסאות', u: 'סקווישים' },
  ];
  const RELS = [{ w: 'סבא', m: true, lo: 60, hi: 82 }, { w: 'סבתא', lo: 58, hi: 80 }, { w: 'אבא', m: true, lo: 36, hi: 50 }, { w: 'אימא', lo: 34, hi: 48 }, { w: 'הדוד', m: true, lo: 25, hi: 45 }, { w: 'הדודה', lo: 25, hi: 45 }];
  // ריבוע קסם 3×3 (ריבוע לו-שו בסיבוב/שיקוף אקראי) * mul + off
  function magicSq(mul, off) {
    let s = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
    for (let r = HM.rnd(0, 3); r > 0; r--) s = s.map((row, i) => row.map((_, j) => s[2 - j][i]));
    if (HM.chance(0.5)) s = s.map((row) => row.slice().reverse());
    return s.map((row) => row.map((v) => v * mul + off));
  }
  // תיאור השינוי במחובר / במחוסר / במחסר
  const chg = (d) => (d > 0 ? `גדל ב-${fmt(d)}` : `קטן ב-${fmt(-d)}`);

  HM.lesson({
    id: 'n-addsub-b',
    learn: (c) => [
      {
        title: 'מה קורה לסכום?',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} בטבלה:<br>• מגדילים מחובר אחד ב-200 ← ${b('הסכום גדל ב-200')}.<br>• מגדילים מחובר אחד ומקטינים את השני ${b('באותו מספר')} ← ${b('הסכום לא משתנה')}.<br>אפשר לדעת את הסכום החדש בלי לחשב מההתחלה!`,
        visual: V.table(['תרגיל', 'סכום'], [[m('2,500 + 1,300'), '3,800'], [m('2,700 + 1,300'), '4,000'], [m('2,700 + 1,100'), '3,800']]),
      },
      {
        title: 'חישוב חכם בעזרת פיצוי',
        html: `קשה לחבר ${m('398 + 245')}? נעביר 2 מהמחובר השני לראשון. הסכום לא משתנה, והתרגיל נעשה קל.`,
        visual: barModel('643', [{ v: 398, label: '398 + 2' }, { v: 245, label: '245 − 2' }]),
        steps: [`${m('398 + 2 = 400')} — מגדילים את המחובר הראשון ב-2.`, `${m('245 − 2 = 243')} — מקטינים את המחובר השני ב-2.`, `${m('398 + 245 = 400 + 243 = 643')}`],
      },
      {
        title: 'מה קורה להפרש?',
        html: `• המחוסר גדל ב-k ← ההפרש ${b('גדל')} ב-k.<br>• המחסר גדל ב-k ← ההפרש ${b('קטן')} ב-k (מורידים יותר!).<br>• שניהם גדלים (או קטנים) באותו מספר ← ההפרש ${b('לא משתנה')}.<br>על ישר המספרים: ההפרש הוא המרחק בין שני המספרים. אם מזיזים את שניהם יחד, המרחק נשאר.`,
        visual: V.numberLine({ min: 0, max: 12, step: 1, w: 520, jumps: [{ from: 3, to: 7, label: '4' }, { from: 6, to: 10, label: '4' }] }),
        steps: [`${m('5,003 − 1,998')} נראה קשה.`, `מוסיפים 2 גם למחוסר וגם למחסר: ${m('5,005 − 2,000')}.`, `ההפרש לא השתנה: ${m('5,005 − 2,000 = 3,005')}.`],
      },
      {
        title: 'ריבוע קסם',
        html: `בריבוע קסם הסכום בכל ${b('שורה')}, בכל ${b('טור')} ובכל ${b('אלכסון')} שווה. בריבוע הראשון הסכום הוא 15.<br>אם מוסיפים 10 ${b('לכל משבצת')}, מקבלים שוב ריבוע קסם. בכל שורה יש 3 משבצות, ולכן הסכום גדל ב-${m(`3 ${X} 10 = 30`)} ונהיה 45.`,
        visual: `<div class="row">${V.magic([[2, 7, 6], [9, 5, 1], [4, 3, 8]])}${V.magic([[12, 17, 16], [19, 15, 11], [14, 13, 18]])}</div>`,
      },
      {
        title: 'מספר חסר בשוויון ובאי-שוויון',
        html: `• ${m('3,450 + ' + HM.box() + ' = 3,500 + 1,200')}: הצד הימני שווה 4,700, ולכן במשבצת ${m('4,700 − 3,450 = 1,250')}.<br>• ${m(HM.box() + ' − 250 &gt; 1,000')}: ${m('1,250 − 250 = 1,000')} — שווה, לא גדול. המספר השלם הקטן ביותר שמתאים הוא ${b('1,251')}.`,
        quiz: {
          type: 'number', answer: 300, prompt: `${c.g('השלם', 'השלימי')}: ${m('1,450 + 700 = 1,850 + ' + slot(0))}`,
          hint: `המחובר הראשון גדל ב-400 (מ-1,450 ל-1,850). מה צריך לקרות למחובר השני כדי שהסכום לא ישתנה?`,
          solution: [`המחובר הראשון גדל ב-400, אז השני צריך לקטון ב-400.`, m('700 − 400 = 300')],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['addChange', 'subChange', 'magicMiss', 'missEq', 'cmpExpr', 'storyMove', 'storyAddOne', 'storyAge', 'storyMove']
        : level === 2 ? ['addChange', 'subChange', 'magicAdd', 'ineqPick', 'cmpExpr', 'missEq', 'storyAddMore', 'storyDiff', 'storyAge', 'storyMove']
        : ['magicAfter', 'ineqMax', 'missEq3', 'tfRules', 'cmpExpr', 'addChange', 'storyAge', 'storyDiffTrap', 'storyCombo', 'storyDiff'];
      const kind = c.pick(kinds);
      const K = level === 1 ? [10, 20, 50, 100, 200] : level === 2 ? [25, 150, 300, 1000, 2500] : [99, 101, 1500, 2001, 999];
      switch (kind) {
        case 'addChange': {
          const a = level === 1 ? c.rnd(120, 800) : level === 2 ? c.rnd(1200, 9000) : c.rnd(12000, 90000);
          const bb = level === 1 ? c.rnd(120, 800) : level === 2 ? c.rnd(1200, 9000) : c.rnd(12000, 90000), s = a + bb;
          let da = 0, db = 0;
          const sg = (v, k) => (v - k < 50 ? 1 : c.pick([1, -1]));
          if (level === 1) { const k = c.pick(K); if (c.chance(0.5)) da = k * sg(a, k); else db = k * sg(bb, k); }
          else { const k = c.pick(K); da = k * sg(a, k); if (c.chance(0.4) && bb - da > 50) db = -da; else { const k2 = c.pick(K); db = k2 * sg(bb, k2); } }
          const a2 = a + da, b2 = bb + db, s2 = s + da + db;
          const sol = [];
          if (da) sol.push(`המחובר הראשון ${chg(da)}.`);
          if (db) sol.push(`המחובר השני ${chg(db)}.`);
          sol.push(da + db === 0 ? 'השינויים מבטלים זה את זה — הסכום לא משתנה.' : `לכן הסכום ${chg(da + db)}: ${m(`${fmt(s)} ${da + db > 0 ? '+' : MI} ${fmt(Math.abs(da + db))} = ${fmt(s2)}`)}`);
          return {
            type: 'number', answer: s2,
            prompt: `ידוע ש-${m(`${fmt(a)} + ${fmt(bb)} = ${fmt(s)}`)}.<br>${c.g('השלם', 'השלימי')} בלי לחשב מההתחלה: ${m(`${fmt(a2)} + ${fmt(b2)} = ` + slot(0))}`,
            hint: `${c.g('השווה', 'השווי')} כל מחובר למחובר המקורי: בכמה הוא גדל או קטן? הסכום משתנה באותה מידה.`,
            solution: sol,
          };
        }
        case 'subChange': {
          let a, bb, d, da, db;
          for (let t = 0; t < 50; t++) {
            a = level === 1 ? c.rnd(500, 990) : c.rnd(5000, 9900); bb = level === 1 ? c.rnd(110, 380) : c.rnd(1100, 3800); d = a - bb; da = 0; db = 0;
            if (level === 1) da = c.pick(K) * c.pick([1, -1]);
            else { const r = c.rnd(0, 2), k = c.pick(K); if (r === 0) db = k * c.pick([1, -1]); else if (r === 1) { da = k * c.pick([1, -1]); db = da; } else { da = k; db = c.pick(K) * c.pick([1, -1]); } }
            if (bb + db > 50 && a + da - bb - db > 50) break;
          }
          const d2 = d + da - db, sol = [];
          if (da) sol.push(`המחוסר ${chg(da)} ← ההפרש ${chg(da)}.`);
          if (db) sol.push(`המחסר ${chg(db)} ← ההפרש ${chg(-db)}.`);
          sol.push(da - db === 0 ? 'ההפרש לא משתנה.' : m(`${fmt(d)} ${da - db > 0 ? '+' : MI} ${fmt(Math.abs(da - db))} = ${fmt(d2)}`));
          return {
            type: 'number', answer: d2,
            prompt: `ידוע ש-${m(`${fmt(a)} − ${fmt(bb)} = ${fmt(d)}`)}.<br>${c.g('השלם', 'השלימי')} בלי לחשב מההתחלה: ${m(`${fmt(a + da)} − ${fmt(bb + db)} = ` + slot(0))}`,
            hint: `${c.g('זכור', 'זכרי')}: כשהמחוסר גדל — ההפרש גדל. כשהמחסר גדל — ההפרש ${b('קטן')}.`,
            solution: sol,
          };
        }
        case 'cmpExpr': {
          const big = level === 3;
          const a = big ? c.rnd(25000, 80000) : level === 2 ? c.rnd(2500, 8000) : c.rnd(120, 800);
          const bb = big ? c.rnd(5000, 11000) : level === 2 ? c.rnd(700, 1100) : c.rnd(70, 110), k = c.pick(big ? [99, 999, 1001] : level === 2 ? [25, 150, 300] : [10, 20, 30]);
          const isSub = level > 1 && c.chance(0.6);
          const forms = isSub
            ? [[a + k, bb + k, 'שני המספרים גדלו באותו מספר — ההפרש לא משתנה.'], [a, bb + k, `המחסר גדל ב-${k} — ההפרש קטן.`], [a + k, bb, `המחוסר גדל ב-${k} — ההפרש גדל.`], [a - k, bb + k, 'המחוסר קטן והמחסר גדל — ההפרש קטן.']]
            : [[a + k, bb - k, `מחובר אחד גדל ב-${k} והשני קטן ב-${k} — הסכום לא משתנה.`], [a + k, bb, `מחובר אחד גדל ב-${k} — הסכום גדל.`], [a - k, bb, `מחובר אחד קטן ב-${k} — הסכום קטן.`], [a + k, bb - 2 * k, `מחובר אחד גדל ב-${k} והשני קטן ב-${2 * k} — הסכום קטן.`]];
          const [x, y, why] = c.pick(forms);
          const lv = isSub ? a - bb : a + bb, rv = isSub ? x - y : x + y, o = isSub ? MI : '+';
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים (&gt;, &lt; או =) ${b('בלי לחשב')} את התרגילים:`,
            left: `${fmt(a)} ${o} ${fmt(bb)}`, right: `${fmt(x)} ${o} ${fmt(y)}`, lv, rv, answer: cmpAns(lv, rv),
            hint: `${c.g('השווה', 'השווי')} את המספרים בשני התרגילים: מה גדל, מה קטן, ובכמה?`,
            solution: [why, m(`${fmt(a)} ${o} ${fmt(bb)} ${sym(lv, rv)} ${fmt(x)} ${o} ${fmt(y)}`)],
          };
        }
        case 'magicMiss': {
          const sq = magicSq(1, c.pick([0, 0, 10, 20, 100])), S = sq[0][0] + sq[0][1] + sq[0][2];
          const r = c.rnd(0, 2), cc = c.rnd(0, 2), ans = sq[r][cc];
          const shown = sq.map((row, i) => row.map((v, j) => (i === r && j === cc ? null : v)));
          const fr = (r + 1) % 3, others = sq[r].filter((v, j) => j !== cc);
          return {
            type: 'number', answer: ans,
            prompt: `זה ${b('ריבוע קסם')}: הסכום בכל שורה, בכל טור ובכל אלכסון שווה. מה המספר החסר?`,
            visual: V.magic(shown),
            hint: `${c.g('מצא', 'מצאי')} שורה שלמה ו${c.g('חשב', 'חשבי')} את הסכום שלה. זה הסכום של כל שורה.`,
            solution: [`סכום שורה שלמה: ${m(sq[fr].join(' + ') + ' = ' + S)}`, `בשורה של המשבצת החסרה: ${m(`${S} ${MI} ${others[0]} ${MI} ${others[1]} = ${ans}`)}`],
          };
        }
        case 'magicAdd': {
          const mul = c.pick([1, 2, 5, 10]), off = c.pick([0, 5, 10, 20]), sq = magicSq(mul, off), S = 15 * mul + 3 * off;
          const minC = mul + off, sub = minC > 3 && c.chance(0.4);
          const k = sub ? c.rnd(2, minC - 1) : c.pick([3, 4, 6, 12, 15, 25, 50]);
          const S2 = sub ? S - 3 * k : S + 3 * k;
          return {
            type: 'number', answer: S2,
            prompt: `זה ריבוע קסם. ${sub ? `מכל משבצת ${b(`החסירו ${k}`)}` : `לכל משבצת ${b(`הוסיפו ${k}`)}`}. מה יהיה הסכום של כל שורה בריבוע החדש?`,
            visual: V.magic(sq),
            hint: `קודם ${c.g('מצא', 'מצאי')} את הסכום של שורה בריבוע הזה. בכל שורה יש 3 משבצות — וכל אחת ${sub ? 'קטנה' : 'גדלה'} ב-${k}.`,
            solution: [`סכום שורה עכשיו: ${m(sq[0].join(' + ') + ' = ' + S)}`, `כל שורה ${sub ? 'קטנה' : 'גדלה'} ב-${m(`3 ${X} ${k} = ${3 * k}`)}`, m(`${S} ${sub ? MI : '+'} ${3 * k} = ${S2}`)],
          };
        }
        case 'magicAfter': {
          const mul = c.pick([2, 3, 5, 10]), off = c.pick([0, 10, 50]), sq = magicSq(mul, off), k = c.pick([7, 15, 25, 120, 250]);
          const cells = c.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], 2), [p1, p2] = cells.map((x) => [Math.floor(x / 3), x % 3]);
          const after = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === p1[0] && j === p1[1] ? sq[i][j] + k : i === p2[0] && j === p2[1] ? null : '')));
          const ans = sq[p2[0]][p2[1]] + k;
          return {
            type: 'number', answer: ans,
            prompt: `לכל משבצת בריבוע הקסם "לפני" הוסיפו אותו מספר, וקיבלו את הריבוע "אחרי". מה המספר במשבצת עם סימן השאלה?`,
            visual: `<div class="row"><div><b>לפני</b>${V.magic(sq)}</div><div><b>אחרי</b>${V.magic(after)}</div></div>`,
            hint: `${c.g('השווה', 'השווי')} את המשבצת שמופיעה בשני הריבועים: כמה הוסיפו לה? אותו מספר הוסיפו לכל משבצת.`,
            solution: [`במשבצת הידועה: ${m(`${sq[p1[0]][p1[1]] + k} ${MI} ${sq[p1[0]][p1[1]]} = ${k}`)} — הוסיפו ${k}.`, m(`${sq[p2[0]][p2[1]]} + ${k} = ${ans}`)],
          };
        }
        case 'missEq': {
          const sub = level === 2 && c.chance(0.5);
          const k = c.rnd(1, 5), a = (level === 1 ? c.rnd(2, 9) * 100 : c.rnd(12, 89) * 100) - k, bb = level === 1 ? c.rnd(120, 480) : c.rnd(1200, 4800);
          if (sub) {
            const A = c.rnd(5, 9) * 1000 + c.rnd(10, 90) * 10, B = c.rnd(12, 39) * 100 - k;
            return {
              type: 'number', answer: A + k,
              prompt: `${c.g('השלם', 'השלימי')}: ${m(`${fmt(A)} − ${fmt(B)} = ` + slot(0) + ` − ${fmt(B + k)}`)}`,
              hint: 'המחסר גדל. מה צריך לעשות למחוסר כדי שההפרש לא ישתנה?',
              solution: [`המחסר גדל ב-${k} (מ-${fmt(B)} ל-${fmt(B + k)}).`, `כדי שההפרש יישאר — גם המחוסר צריך לגדול ב-${k}: ${m(`${fmt(A)} + ${k} = ${fmt(A + k)}`)}`],
            };
          }
          return {
            type: 'number', answer: bb - k,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(`${fmt(a)} + ${fmt(bb)} = ${fmt(a + k)} + ` + slot(0))}`,
            hint: `המחובר הראשון גדל ב-${k}. מה צריך לקרות למחובר השני כדי שהסכום לא ישתנה?`,
            solution: [`${fmt(a)} גדל ב-${k} ונהיה ${fmt(a + k)}.`, `לכן המחובר השני קטן ב-${k}: ${m(`${fmt(bb)} − ${k} = ${fmt(bb - k)}`)}`],
          };
        }
        case 'missEq3': {
          const a = c.rnd(20000, 90000), bb = c.rnd(5000, 15000), cc = c.rnd(1000, 4000), r = c.rnd(0, 2);
          const F = [
            [m(`${fmt(a)} − ${fmt(bb)} = ` + slot(0) + ` − ${fmt(cc)}`), a - bb + cc, [`הצד השמאלי: ${m(`${fmt(a)} − ${fmt(bb)} = ${fmt(a - bb)}`)}`, `צריך מספר שאם נחסר ממנו ${fmt(cc)} נקבל ${fmt(a - bb)}: ${m(`${fmt(a - bb)} + ${fmt(cc)} = ${fmt(a - bb + cc)}`)}`]],
            [m(`${fmt(a)} + ${fmt(bb)} = ` + slot(0) + ` − ${fmt(cc)}`), a + bb + cc, [`הצד השמאלי: ${m(`${fmt(a)} + ${fmt(bb)} = ${fmt(a + bb)}`)}`, m(`${fmt(a + bb)} + ${fmt(cc)} = ${fmt(a + bb + cc)}`)]],
            [m(`${fmt(a)} − ` + slot(0) + ` = ${fmt(bb)} + ${fmt(cc)}`), a - bb - cc, [`הצד הימני: ${m(`${fmt(bb)} + ${fmt(cc)} = ${fmt(bb + cc)}`)}`, m(`${fmt(a)} − ${fmt(bb + cc)} = ${fmt(a - bb - cc)}`)]],
          ][r];
          return {
            type: 'number', answer: F[1], prompt: `${c.g('השלם', 'השלימי')} את המספר החסר: ${F[0]}`,
            hint: `קודם ${c.g('חשב', 'חשבי')} את הצד שאין בו משבצת. שני הצדדים של סימן השוויון שווים.`,
            solution: F[2],
          };
        }
        case 'ineqPick': {
          const plus = c.chance(0.5), a = c.rnd(12, 89) * 100 + c.rnd(1, 9) * 10, bb = c.rnd(Math.floor(a / 100) + 15, Math.floor(a / 100) + 60) * 100;
          const t = plus ? bb - a : a + bb, ok = plus ? t + c.rnd(1, 9) * 10 : t - c.rnd(1, 9) * 10;
          const bad = plus ? [t, t - 10, t - 100] : [t, t + 10, t + 100];
          const expr = plus ? `${fmt(a)} + ${HM.box()} &gt; ${fmt(bb)}` : `${HM.box()} − ${fmt(a)} &lt; ${fmt(bb)}`;
          return {
            type: 'choice', prompt: `איזה מספר יכול להיות במשבצת? ${m(expr)}`,
            choices: [ok, ...bad].map(fmt), answer: 0,
            hint: plus ? `${c.g('מצא', 'מצאי')} קודם את המספר שנותן ${b('שוויון')}: ${m(`${fmt(a)} + ${HM.box()} = ${fmt(bb)}`)}. המספר המתאים צריך להיות גדול ממנו.` : `${c.g('מצא', 'מצאי')} קודם את המספר שנותן ${b('שוויון')}: ${m(`${HM.box()} − ${fmt(a)} = ${fmt(bb)}`)}. המספר המתאים צריך להיות קטן ממנו.`,
            solution: [`שוויון מתקבל ב-${fmt(t)}.`, plus ? `צריך מספר גדול מ-${fmt(t)}: ${fmt(ok)}.` : `צריך מספר קטן מ-${fmt(t)}: ${fmt(ok)}.`],
          };
        }
        case 'ineqMax': {
          const a = c.rnd(120, 890) * 10 + c.rnd(1, 9), bb = c.rnd(150, 990) * 10, r = c.rnd(0, 3);
          const F = [
            ['הגדול ביותר', `${HM.box()} + ${fmt(a)} &lt; ${fmt(bb + a)}`, bb - 1, bb],
            ['הגדול ביותר', `${fmt(a + bb)} − ${HM.box()} &gt; ${fmt(a)}`, bb - 1, bb],
            ['הקטן ביותר', `${HM.box()} − ${fmt(a)} &gt; ${fmt(bb)}`, a + bb + 1, a + bb],
            ['הקטן ביותר', `${fmt(a)} + ${HM.box()} &gt; ${fmt(a + bb)}`, bb + 1, bb],
          ][r];
          return {
            type: 'number', answer: F[2],
            prompt: `מהו המספר השלם ${b(F[0])} שיכול להיות במשבצת? ${m(F[1])}`,
            hint: `${c.g('מצא', 'מצאי')} קודם את המספר שנותן ${b('שוויון')}, ואז ${c.g('חשוב', 'חשבי')}: צריך מספר קצת ${F[0] === 'הגדול ביותר' ? 'קטן' : 'גדול'} ממנו או קצת ${F[0] === 'הגדול ביותר' ? 'גדול' : 'קטן'}?`,
            solution: [`שוויון מתקבל כשבמשבצת ${fmt(F[3])}.`, `${fmt(F[3])} עצמו לא מתאים (יוצא שוויון), ולכן התשובה: ${fmt(F[2])}.`],
          };
        }
        case 'tfRules': {
          const k = c.pick([20, 50, 100, 300]);
          const S = c.pick([
            [`אם מגדילים את המחוסר ב-${k} וגם את המחסר ב-${k}, ההפרש גדל ב-${2 * k}.`, false, 'כששני המספרים גדלים באותו מספר, ההפרש לא משתנה.'],
            [`אם מגדילים מחובר אחד ב-${k} ומקטינים את המחובר השני ב-${k}, הסכום לא משתנה.`, true, 'מה שנוסף לאחד ירד מהשני.'],
            [`אם מגדילים את המחסר ב-${k}, ההפרש גדל ב-${k}.`, false, 'מורידים יותר — לכן ההפרש קטן ב-' + k + '.'],
            [`אם מקטינים את המחוסר ב-${k}, ההפרש קטן ב-${k}.`, true, 'המספר שממנו מחסרים קטן, ולכן גם ההפרש.'],
            [`אם מוסיפים ${k} לכל משבצת בריבוע קסם בגודל 3 על 3, הסכום בכל שורה גדל ב-${3 * k}.`, true, `בכל שורה 3 משבצות: ${m(`3 ${X} ${k} = ${3 * k}`)}.`, true],
            [`אם מוסיפים ${k} רק למשבצת האמצעית של ריבוע קסם, הוא נשאר ריבוע קסם.`, false, 'השורה האמצעית גדלה, אבל השורה העליונה לא — הסכומים כבר לא שווים.', true],
            [`אם מגדילים כל אחד משני המחוברים ב-${k}, הסכום גדל ב-${k}.`, false, `כל מחובר תורם ${k}, ולכן הסכום גדל ב-${2 * k}.`],
          ]);
          return {
            type: 'tf', answer: S[1], prompt: `נכון או לא נכון? ${S[0]}`,
            hint: S[3] ? `${c.g('דמיין', 'דמייני')} ריבוע קסם שהסכום בו 15, ו${c.g('בדוק', 'בדקי')} מה קורה לסכום של כל שורה.` : `${c.g('נסה', 'נסי')} עם מספרים קטנים, למשל ${m('10 − 4')} או ${m('10 + 4')}, ו${c.g('בדוק', 'בדקי')} מה קורה.`,
            solution: [S[1] ? 'נכון.' : 'לא נכון.', S[2]],
          };
        }
        case 'storyMove': case 'storyAddOne': case 'storyAddMore': case 'storyCombo': {
          const sc = c.scene(BOX_SC), f = c.friend();
          const A = level === 1 ? c.rnd(25, 150) : level === 2 ? c.rnd(120, 900) : c.rnd(1200, 4800);
          const B = level === 1 ? c.rnd(25, 150) : level === 2 ? c.rnd(120, 900) : c.rnd(1200, 4800), S0 = A + B;
          const k = level === 1 ? c.rnd(2, 15) : level === 2 ? c.rnd(12, 60) : c.rnd(120, 600), j = level === 1 ? c.rnd(2, 9) : c.rnd(8, 40);
          const intro = `${sc.b1} יש ${A} ${sc.u}, ו${sc.b2} יש ${B} ${sc.u}`;
          const add = f.g('הוסיף', 'הוסיפה'), out = f.g('הוציא', 'הוציאה'), move = f.g('העביר', 'העבירה');
          if (kind === 'storyMove') return {
            type: 'number', answer: S0,
            prompt: `${intro} — ביחד ${S0} ${sc.u}. ${f.name} ${move} ${k} ${sc.u} ${sc.f1} ${sc.t2}.<br>כמה ${sc.u} יש עכשיו ${sc.both} יחד?`,
            hint: `מה קרה לכמות הכוללת? מה שיצא ממקום אחד — נכנס למקום השני.`,
            solution: [`מחובר אחד קטן ב-${k} והשני גדל ב-${k}.`, `הסכום לא משתנה: ${S0}.`],
          };
          if (kind === 'storyAddOne') return {
            type: 'number', answer: S0 + k,
            prompt: `${intro} — ביחד ${S0} ${sc.u}. ${f.name} ${add} עוד ${k} ${sc.u} ${sc.t1}.<br>כמה ${sc.u} יש עכשיו ${sc.both} יחד?`,
            hint: 'מחובר אחד גדל. בכמה גדל הסכום?',
            solution: [`מחובר אחד גדל ב-${k} ← גם הסכום גדל ב-${k}.`, m(`${S0} + ${k} = ${S0 + k}`)],
          };
          if (kind === 'storyAddMore') return {
            type: 'number', answer: S0 + k - j,
            prompt: `${intro} — ביחד ${fmt(S0)} ${sc.u}. ${f.name} ${add} ${k} ${sc.u} ${sc.t1}, ו${out} ${j} ${sc.u} ${sc.f2}.<br>כמה ${sc.u} יש עכשיו ${sc.both} יחד?`,
            hint: 'מחובר אחד גדל ומחובר אחד קטן. מה קורה לסכום?',
            solution: [`המחובר הראשון גדל ב-${k}, והשני קטן ב-${j}.`, m(`${fmt(S0)} + ${k} − ${j} = ${fmt(S0 + k - j)}`)],
          };
          return {
            type: 'number', answer: S0 + j,
            prompt: `${intro}. ${f.name} ${move} ${k} ${sc.u} ${sc.f1} ${sc.t2}, ואחר כך ${add} עוד ${j} ${sc.u} ${sc.t2}.<br>כמה ${sc.u} יש עכשיו ${sc.both} יחד?`,
            hint: `שני שלבים: ההעברה לא משנה את הכמות הכוללת. רק ההוספה משנה אותה.`,
            solution: [`ביחד בהתחלה: ${m(`${fmt(A)} + ${fmt(B)} = ${fmt(S0)}`)}`, `ההעברה לא שינתה את הסכום. ההוספה הגדילה אותו ב-${j}.`, m(`${fmt(S0)} + ${j} = ${fmt(S0 + j)}`)],
          };
        }
        case 'storyDiff': case 'storyDiffTrap': {
          const sc = c.scene(BOX_SC), f = c.friend();
          const B = level === 2 ? c.rnd(120, 600) : c.rnd(1200, 4000), A = B + (level === 2 ? c.rnd(40, 300) : c.rnd(300, 2500));
          const k = level === 2 ? c.rnd(12, 80) : c.rnd(120, 900), j = c.rnd(15, 95), addBoth = c.chance(0.5);
          const add = f.g('הוסיף', 'הוסיפה'), out = f.g('הוציא', 'הוציאה');
          if (kind === 'storyDiff') return {
            type: 'number', answer: A - B,
            prompt: `${sc.b1} יש ${fmt(A)} ${sc.u}, ו${sc.b2} יש ${fmt(B)} ${sc.u}. ${f.name} ${addBoth ? add : out} ${k} ${sc.u} ${addBoth ? sc.t1 : sc.f1} ועוד ${k} ${sc.u} ${addBoth ? sc.t2 : sc.f2}.<br>בכמה ${sc.u} יותר יש עכשיו ${sc.b1}?`,
            hint: `"בכמה יותר" זה הפרש. מה קורה להפרש כששני המספרים ${addBoth ? 'גדלים' : 'קטנים'} באותו מספר?`,
            solution: [`המחוסר והמחסר ${addBoth ? 'גדלו' : 'קטנו'} שניהם ב-${k} ← ההפרש לא משתנה.`, m(`${fmt(A)} − ${fmt(B)} = ${fmt(A - B)}`)],
          };
          return {
            type: 'number', answer: A - B + k + j,
            prompt: `${sc.b1} יש ${fmt(A)} ${sc.u}, ו${sc.b2} יש ${fmt(B)} ${sc.u}. ${f.name} ${add} ${k} ${sc.u} ${sc.t1}, ו${out} ${j} ${sc.u} ${sc.f2}.<br>בכמה ${sc.u} יותר יש עכשיו ${sc.b1}?`,
            hint: `ההפרש בהתחלה הוא ${m(`${fmt(A)} − ${fmt(B)}`)}. המחוסר גדל והמחסר קטן — כל שינוי כזה מגדיל את ההפרש.`,
            solution: [`ההפרש בהתחלה: ${m(`${fmt(A)} − ${fmt(B)} = ${fmt(A - B)}`)}`, `המחוסר גדל ב-${k} והמחסר קטן ב-${j} — ההפרש גדל ב-${m(`${k} + ${j} = ${k + j}`)}.`, m(`${fmt(A - B)} + ${k + j} = ${fmt(A - B + k + j)}`)],
          };
        }
        case 'storyAge': {
          const f = c.friend(), rel = c.pick(RELS), a = c.rnd(9, 12), R = c.rnd(rel.lo, rel.hi), k = level === 1 ? c.rnd(2, 5) : c.rnd(3, 15);
          const sumQ = level === 3 && c.chance(0.6), past = level >= 2 && !sumQ && c.chance(0.5);
          const intro = `היום ${f.name} ${f.g('בן', 'בת')} ${a}, ו${rel.w} ${f.g('שלו', 'שלה')} ${rel.m ? 'בן' : 'בת'} ${R}.`;
          if (sumQ) return {
            type: 'number', answer: a + R + 2 * k,
            prompt: `${intro}<br>מה יהיה ${b('סכום')} הגילים שלהם בעוד ${k} שנים?`,
            hint: `בעוד ${k} שנים כל אחד מהם יהיה מבוגר ב-${k}. כמה מחוברים גדלים?`,
            solution: [`סכום הגילים היום: ${m(`${a} + ${R} = ${a + R}`)}`, `שני המחוברים גדלים ב-${k}, ולכן הסכום גדל ב-${m(`2 ${X} ${k} = ${2 * k}`)}.`, m(`${a + R} + ${2 * k} = ${a + R + 2 * k}`)],
          };
          return {
            type: 'number', answer: R - a,
            prompt: `${intro}<br>מה ${past ? 'היה' : 'יהיה'} ${b('ההפרש')} בין הגילים שלהם ${past ? `לפני ${k} שנים` : `בעוד ${k} שנים`}?`,
            hint: `${past ? `לפני ${k} שנים` : `בעוד ${k} שנים`} שניהם ${past ? 'צעירים' : 'מבוגרים'} באותו מספר שנים. מה קורה להפרש?`,
            solution: [`שני הגילים ${past ? 'קטנים' : 'גדלים'} באותו מספר ← ההפרש לא משתנה.`, m(`${R} − ${a} = ${R - a}`)],
          };
        }
      }
    },
  });

  /* ========== כפל ========== */
  // מודל שטח לכפל: cols = חלקי הגורם הראשון (מימין לשמאל), rows = חלקי הגורם השני; hide=[i,j] => '?'
  function areaModel(cols, rows, o) {
    o = o || {};
    const W = 340, L = 44, x0 = 6, y0 = 26, iw = W - L - x0, ih = rows.length === 1 ? 62 : 112;
    const share = (arr, min) => { const t = HM.sum(arr); let w = arr.map((v) => Math.max(min, v / t)); const s = HM.sum(w); return w.map((x) => x / s); };
    const cw = share(cols, 0.2).map((x) => x * iw), rh = share(rows, 0.32).map((x) => x * ih);
    let s = '', x = W - L;
    cols.forEach((cv, j) => {
      x -= cw[j];
      s += S.text(x + cw[j] / 2, 13, fmt(cv), { fs: 14, fw: 700, cls: 't-a' });
      let y = y0;
      rows.forEach((rv, i) => {
        const hide = o.hide && o.hide[0] === i && o.hide[1] === j;
        s += S.rect(x, y, cw[j], rh[i], { cls: (hide ? 'f-y' : (i + j) % 2 ? 'f-l' : 'f-w') + ' s-ink', sw: 2 });
        s += S.text(x + cw[j] / 2, y + rh[i] / 2, hide ? '?' : fmt(cv * rv), { fs: 14, fw: 700 });
        y += rh[i];
      });
    });
    let y = y0;
    rows.forEach((rv, i) => { s += S.text(W - L / 2, y + rh[i] / 2, fmt(rv), { fs: 15, fw: 700, cls: 't-b' }); y += rh[i]; });
    return S.svg(W, y0 + ih + 6, s, { label: 'מודל שטח לכפל', maxw: 340 });
  }
  // פתרון בפירוק לפי ערך המקום
  function mulSteps(a, bb) {
    const t = a < 10 ? expTerms(bb) : expTerms(a);
    const part = (v) => (a < 10 ? `${a} ${X} ${fmt(v)}` : `${fmt(v)} ${X} ${fmt(bb)}`), val = (v) => (a < 10 ? a * v : v * bb);
    return [m(`${fmt(a)} ${X} ${fmt(bb)} = ` + t.map(part).join(' + ')), m('= ' + t.map((v) => fmt(val(v))).join(' + ')), m(`= ${fmt(a * bb)}`)];
  }
  // כפל: a קבוצות של bb
  const MUL_SC = [
    { tags: ['sport'], txt: (f, a, bb) => `באצטדיון יש ${a} שורות, ובכל שורה ${bb} מושבים.`, q: () => 'כמה מושבים יש באצטדיון?' },
    { tags: ['animals'], txt: (f, a, bb) => `בחווה של הדודה של ${f.name} יש ${a} לולים, ובכל לול ${bb} תרנגולות.`, q: () => 'כמה תרנגולות יש בחווה?' },
    { tags: ['space'], txt: (f, a, bb) => `החללית במשחק של ${f.name} טסה ${bb} ק"מ בכל דקה.`, q: (f, a) => `כמה קילומטרים היא תטוס ב-${a} דקות?` },
    { tags: ['music'], txt: (f, a, bb) => `התזמורת נתנה ${a} הופעות, ולכל הופעה נמכרו ${bb} כרטיסים.`, q: () => 'כמה כרטיסים נמכרו בסך הכול?' },
    { tags: ['baking'], txt: (f, a, bb) => `המאפייה ארזה היום ${a} קופסאות, ובכל קופסה ${bb} עוגיות.`, q: () => 'כמה עוגיות ארזו היום?' },
    { tags: ['games'], txt: (f, a, bb) => `על כל שלב במשחק ${f.name} ${f.g('מקבל', 'מקבלת')} ${bb} נקודות. ${f.g('הוא סיים', 'היא סיימה')} ${a} שלבים.`, q: (f) => `כמה נקודות ${f.g('קיבל', 'קיבלה')} ${f.name}?` },
    { tags: ['art'], txt: (f, a, bb) => `לקראת יריד היצירה ${f.name} ${f.g('קנה', 'קנתה')} ${a} חבילות חרוזים, ובכל חבילה ${bb} חרוזים.`, q: () => 'כמה חרוזים יש בכל החבילות?' },
    { tags: ['nature'], txt: (f, a, bb) => `במטע יש ${a} שורות של עצים, ובכל שורה ${bb} עצים.`, q: () => 'כמה עצים יש במטע?' },
    { tags: ['reading'], txt: (f, a, bb) => `בסדרת הספרים ש${f.name} ${f.g('אוהב', 'אוהבת')} יש ${a} ספרים, ובכל ספר ${bb} עמודים.`, q: () => 'כמה עמודים יש בכל הסדרה?' },
    { tags: ['tech'], txt: (f, a, bb) => `מפעל הרובוטים מייצר ${bb} רובוטים ביום.`, q: (f, a) => `כמה רובוטים ייצר המפעל ב-${a} ימים?` },
    { tags: ['kpop'], txt: (f, a, bb) => `חנות המעריצים קיבלה ${a} ארגזים של אלבומי קיי-פופ, ובכל ארגז ${bb} אלבומים.`, q: () => 'כמה אלבומים קיבלה החנות?' },
    { tags: ['magic'], txt: (f, a, bb) => `בספריית בית הספר לקוסמים יש ${a} מדפים, ועל כל מדף ${bb} ספרי לחשים.`, q: () => 'כמה ספרי לחשים יש בספרייה?' },
    { tags: ['squishy'], txt: (f, a, bb) => `חנות הסקווישים קיבלה ${a} קרטונים, ובכל קרטון ${bb} סקווישים בצורת חיות.`, q: () => 'כמה סקווישים קיבלה החנות?' },
  ];
  // סיפורים דו-שלביים: make מחזיר {txt, ans, sol, ex?, wr?}
  const MUL2_SC = [
    { tags: ['nature'], make: (c, f) => { const a = c.rnd(4, 9), bb = c.rnd(42, 56), n = a * bb - c.rnd(5, 40); return { txt: `לטיול השנתי הזמינו ${a} אוטובוסים, ובכל אוטובוס ${bb} מקומות. נרשמו לטיול ${n} תלמידים ומורים.<br>כמה מקומות יישארו פנויים?`, ans: a * bb - n, ex: `${a} ${X} ${bb} − ${n}`, wr: [`${a} + ${bb} − ${n}`, `${a} ${X} ${bb} + ${n}`, `${a} ${X} (${bb} − ${n})`], sol: [m(`${a} ${X} ${bb} = ${a * bb}`), m(`${a * bb} − ${n} = ${a * bb - n}`)] }; } },
    { tags: ['kpop'], make: (c, f) => { const a = c.rnd(3, 6), p = c.rnd(18, 39) * 10, k = c.rnd(2, 5), q = c.rnd(45, 95); const t = a * p + k * q; return { txt: `${f.name} ${f.g('קנה', 'קנתה')} ${a} כרטיסים להופעת קיי-פופ, ${p} ₪ לכרטיס, ועוד ${k} מקלות אור, ${q} ₪ למקל.<br>כמה ${f.g('שילם', 'שילמה')} ${f.name} בסך הכול?`, ans: t, unit: '₪', ex: `${a} ${X} ${p} + ${k} ${X} ${q}`, wr: [`${a} ${X} ${p} + ${q}`, `(${a} + ${k}) ${X} ${p}`, `${a} + ${p} + ${k} + ${q}`], sol: [m(`${a} ${X} ${p} = ${fmt(a * p)}`), m(`${k} ${X} ${q} = ${k * q}`), m(`${fmt(a * p)} + ${k * q} = ${fmt(t)}`)] }; } },
    { tags: ['squishy'], make: (c, f) => { const a = c.rnd(12, 25), p = c.rnd(12, 19), k = c.rnd(8, 15), q = c.rnd(21, 29); const t = a * p + k * q; return { txt: `לקראת יום ההולדת של הכיתה ${f.name} ${f.g('קנה', 'קנתה')} ${a} סקווישים בצורת אוכל, ${p} ₪ לכל אחד, ו-${k} סקווישים בצורת חיות, ${q} ₪ לכל אחד.<br>כמה ${f.g('שילם', 'שילמה')} בסך הכול?`, ans: t, unit: '₪', ex: `${a} ${X} ${p} + ${k} ${X} ${q}`, wr: [`(${a} + ${k}) ${X} ${p}`, `${a} ${X} ${q} + ${k} ${X} ${p}`, `${a} + ${p} + ${k} + ${q}`], sol: [m(`${a} ${X} ${p} = ${a * p}`), m(`${k} ${X} ${q} = ${k * q}`), m(`${a * p} + ${k * q} = ${fmt(t)}`)] }; } },
    { tags: ['magic'], make: (c, f) => { const a = c.rnd(18, 32), p = c.rnd(15, 45), V0 = (Math.floor((a * p) / 100) + c.rnd(1, 4)) * 100; return { txt: `בשיעור שיקויים כל תלמיד צריך ${p} מ"ל של מיץ דרקון. בכיתה ${a} תלמידים, ובבקבוק הגדול יש ${fmt(V0)} מ"ל.<br>כמה מ"ל יישארו בבקבוק אחרי שכל התלמידים ייקחו?`, ans: V0 - a * p, ex: `${fmt(V0)} − ${a} ${X} ${p}`, wr: [`${fmt(V0)} − ${a} − ${p}`, `(${fmt(V0)} − ${a}) ${X} ${p}`, `${fmt(V0)} + ${a} ${X} ${p}`], sol: [m(`${a} ${X} ${p} = ${fmt(a * p)}`), m(`${fmt(V0)} − ${fmt(a * p)} = ${fmt(V0 - a * p)}`)] }; } },
    { tags: ['sport'], make: (c, f) => { const a = c.rnd(12, 24), bb = c.rnd(11, 16), k = c.rnd(2, 4); return { txt: `לטורניר הכדורגל הגיעו ${a} קבוצות, ובכל קבוצה ${bb} שחקנים. כל שחקן קיבל ${k} בקבוקי מים.<br>כמה בקבוקי מים חילקו?`, ans: a * bb * k, ex: `${a} ${X} ${bb} ${X} ${k}`, wr: [`${a} ${X} ${bb} + ${k}`, `${a} + ${bb} + ${k}`, `${a} ${X} ${bb}`], sol: [m(`${a} ${X} ${bb} = ${a * bb}`) + ' שחקנים', m(`${a * bb} ${X} ${k} = ${fmt(a * bb * k)}`)] }; } },
    { tags: ['baking'], make: (c, f) => { const a = c.rnd(12, 28), bb = c.rnd(24, 48), n = c.rnd(Math.floor(a * bb * 0.4), Math.floor(a * bb * 0.9)); return { txt: `המאפייה אפתה ${a} מגשים, ובכל מגש ${bb} עוגיות. עד הצהריים נמכרו ${fmt(n)} עוגיות.<br>כמה עוגיות נשארו?`, ans: a * bb - n, ex: `${a} ${X} ${bb} − ${fmt(n)}`, wr: [`${a} + ${bb} − ${fmt(n)}`, `${a} ${X} ${bb} + ${fmt(n)}`, `${a} ${X} (${bb} − ${fmt(n)})`], sol: [m(`${a} ${X} ${bb} = ${fmt(a * bb)}`), m(`${fmt(a * bb)} − ${fmt(n)} = ${fmt(a * bb - n)}`)] }; } },
    { tags: ['games', 'tech'], make: (c, f) => { const a = c.rnd(12, 35), p = c.rnd(125, 480), k = c.rnd(12, 60) * 100; return { txt: `${f.name} ${f.g('צבר', 'צברה')} ${p} נקודות בכל אחד מ-${a} שלבים במשחק, ובסוף ${f.g('קיבל', 'קיבלה')} בונוס של ${fmt(k)} נקודות.<br>כמה נקודות ${f.g('צבר', 'צברה')} בסך הכול?`, ans: a * p + k, ex: `${a} ${X} ${p} + ${fmt(k)}`, wr: [`${a} ${X} (${p} + ${fmt(k)})`, `${a} + ${p} + ${fmt(k)}`, `${a} ${X} ${p} − ${fmt(k)}`], sol: [m(`${a} ${X} ${p} = ${fmt(a * p)}`), m(`${fmt(a * p)} + ${fmt(k)} = ${fmt(a * p + k)}`)] }; } },
    { tags: ['space'], make: (c, f) => { const a = c.rnd(12, 30), p = c.rnd(1200, 4800), n = c.rnd(12, 95) * 1000; return { txt: `חללית טסה ${fmt(p)} ק"מ בכל שעה. היא טסה ${a} שעות, ועכשיו נשארו לה עוד ${fmt(n)} ק"מ עד היעד.<br>מה המרחק כולו?`, ans: a * p + n, ex: `${a} ${X} ${fmt(p)} + ${fmt(n)}`, wr: [`${a} ${X} ${fmt(p)} − ${fmt(n)}`, `${a} + ${fmt(p)} + ${fmt(n)}`, `${a} ${X} (${fmt(p)} + ${fmt(n)})`], sol: [m(`${a} ${X} ${fmt(p)} = ${fmt(a * p)}`), m(`${fmt(a * p)} + ${fmt(n)} = ${fmt(a * p + n)}`)] }; } },
    { tags: ['reading'], make: (c, f) => { const a = c.rnd(12, 25), p = c.rnd(14, 28), n = c.rnd(35, 150); return { txt: `${f.name} ${f.g('קורא', 'קוראת')} ${p} עמודים בכל יום. אחרי ${a} ימים נשארו ${f.g('לו', 'לה')} עוד ${n} עמודים עד סוף הספר.<br>כמה עמודים יש בספר?`, ans: a * p + n, ex: `${a} ${X} ${p} + ${n}`, wr: [`${a} ${X} ${p} − ${n}`, `${a} + ${p} + ${n}`, `${a} ${X} (${p} + ${n})`], sol: [m(`${a} ${X} ${p} = ${a * p}`), m(`${a * p} + ${n} = ${a * p + n}`)] }; } },
    { tags: ['music'], make: (c, f) => { const a = c.rnd(14, 36), bb = c.rnd(24, 64), n = c.rnd(100, 400); return { txt: `לכל אחת מ-${a} ההופעות של הלהקה נמכרו ${bb} כרטיסים, ועוד ${n} כרטיסים נמכרו להופעת הסיום.<br>כמה כרטיסים נמכרו בסך הכול?`, ans: a * bb + n, ex: `${a} ${X} ${bb} + ${n}`, wr: [`${a} ${X} (${bb} + ${n})`, `${a} + ${bb} + ${n}`, `${a} ${X} ${bb} − ${n}`], sol: [m(`${a} ${X} ${bb} = ${fmt(a * bb)}`), m(`${fmt(a * bb)} + ${n} = ${fmt(a * bb + n)}`)] }; } },
  ];

  HM.lesson({
    id: 'n-mult',
    learn: (c) => [
      {
        title: 'כפל במספרים עגולים',
        html: `במחסן יש 40 ארגזים, ובכל ארגז 30 בקבוקים. כמה בקבוקים?<br>כופלים בלי האפסים: ${m(`4 ${X} 3 = 12`)}, ואז מוסיפים את ${b('כל האפסים')} של שני הגורמים: ${m(`40 ${X} 30 = 1,200`)}.<br>${c.g('שים לב', 'שימי לב')}: ${m(`50 ${X} 40 = 2,000`)} — כי ב-${m(`5 ${X} 4 = 20`)} כבר יש אפס משלו!`,
        visual: V.table(['תרגיל', 'מכפלה'], [[m(`4 ${X} 3`), '12'], [m(`40 ${X} 3`), '120'], [m(`40 ${X} 30`), '1,200'], [m(`400 ${X} 30`), '12,000']]),
      },
      {
        title: 'פירוק לפי ערך המקום',
        html: `${c.name}, קל יותר לחשב ${m(`7 ${X} 386`)} בחלקים: מפרקים את 386 למאות, עשרות ויחידות, כופלים כל חלק ב-7 ומחברים.<br>זה כמו מלבן שמחלקים לשלושה מלבנים קטנים.`,
        visual: areaModel([300, 80, 6], [7]),
        steps: [m(`7 ${X} 386 = 7 ${X} 300 + 7 ${X} 80 + 7 ${X} 6`), m('= 2,100 + 560 + 42'), m('= 2,702')],
      },
      {
        title: 'כפל בגורם דו-ספרתי',
        html: `ב-${m(`24 ${X} 136`)} מפרקים את 24 לעשרות ויחידות: ${b('20 פעמים')} 136 ועוד ${b('4 פעמים')} 136.`,
        visual: areaModel([100, 30, 6], [20, 4]),
        steps: [m(`20 ${X} 136 = 2,720`), m(`4 ${X} 136 = 544`), m(`24 ${X} 136 = 2,720 + 544 = 3,264`)],
      },
      {
        title: 'אומדן מכפלה',
        html: `לפני שמחשבים, מעגלים כל גורם למספר עגול:<br>${m(`48 ${X} 312 ≈ 50 ${X} 300 = 15,000`)}<br>התשובה המדויקת היא 14,976 — קרובה מאוד לאומדן. אם יצא לנו 1,497, האומדן מראה מיד שחסר אפס.`,
        quiz: {
          type: 'choice', prompt: `מה האומדן הטוב ביותר ל-${m(`29 ${X} 412`)}?`,
          choices: ['12,000', '1,200', '120,000', '8,000'], answer: 0,
          hint: '29 קרוב ל-30, ו-412 קרוב ל-400.',
          solution: [m(`30 ${X} 400 = 12,000`)],
        },
      },
      {
        title: 'בעיה מילולית',
        html: `לטיול יצאו 18 אוטובוסים, ובכל אוטובוס 52 מקומות. כמה מקומות יש בכל האוטובוסים?<br>${b('קבוצות שוות')} ← כפל: מספר הקבוצות ${X} מספר הפריטים בכל קבוצה.`,
        steps: [m(`18 ${X} 52 = 10 ${X} 52 + 8 ${X} 52`), m('= 520 + 416'), m('= 936'), `אומדן לבדיקה: ${m(`20 ${X} 50 = 1,000`)} — קרוב. ✔`],
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['tens', 'zerosTrap', 'split1', 'mul1', 'storyMul', 'storyTens', 'storyMul']
        : level === 2 ? ['mul2', 'area', 'split2', 'estimate', 'tens', 'storyMul', 'storyEst', 'storyMul', 'zerosTrap', 'storyMul']
        : ['mul3', 'estCheck', 'cmpEst', 'splitMiss', 'tens', 'storyTwo', 'storyChoose', 'storyTwo', 'storyMul'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'tens': {
          const d = c.rnd(2, 9), e = c.rnd(2, 9), z1 = level === 1 ? c.rnd(0, 1) : c.rnd(1, 2), z2 = level === 1 ? c.rnd(1, 2) : c.rnd(1, 3);
          const a = (level === 3 ? c.rnd(11, 25) : d) * P10(z1), bb = e * P10(z2), ans = a * bb;
          const core = (a / P10(z1)) * e, zs = z1 + z2;
          return {
            type: 'number', answer: ans, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(a)} ${X} ${fmt(bb)} = ` + slot(0))}`,
            hint: `${c.g('כפול', 'כפלי')} קודם את המספרים בלי האפסים, ואחר כך ${c.g('הוסף', 'הוסיפי')} את כל האפסים של שני הגורמים.`,
            solution: [m(`${a / P10(z1)} ${X} ${e} = ${core}`), `בשני הגורמים יש יחד ${zs} אפסים ← ${m(fmt(ans))}`],
          };
        }
        case 'zerosTrap': {
          const [d, e] = c.pick([[5, 4], [5, 6], [5, 8], [2, 5], [4, 5], [6, 5], [8, 5], [5, 2]]);
          const z1 = c.rnd(1, 2), z2 = c.rnd(1, 2), a = d * P10(z1), bb = e * P10(z2), ans = a * bb;
          return {
            type: 'choice', prompt: `כמה זה ${m(`${fmt(a)} ${X} ${fmt(bb)}`)}?`,
            ...opts(ans, [ans / 10, ans * 10, ans / 100]),
            hint: `כמה זה ${m(`${d} ${X} ${e}`)}? ${c.g('שים לב', 'שימי לב')} שבתוצאה הזאת כבר יש אפס.`,
            solution: [m(`${d} ${X} ${e} = ${d * e}`), `מוסיפים עוד ${z1 + z2} אפסים מהגורמים: ${m(fmt(ans))}`],
          };
        }
        case 'split1': {
          const a = c.rnd(3, 9), t = c.rnd(2, 9), u = c.rnd(2, 9), bb = t * 10 + u, r = c.rnd(0, 1);
          return {
            type: 'number', answer: r ? u : a * u,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(r ? `${a} ${X} ${bb} = ${a} ${X} ${t * 10} + ${a} ${X} ` + slot(0) : `${a} ${X} ${bb} = ${a * t * 10} + ` + slot(0))}`,
            visual: r ? undefined : areaModel([t * 10, u], [a], { hide: [0, 1] }),
            hint: `${fmt(bb)} = ${t * 10} + ${u}. ${c.g('כפול', 'כפלי')} כל חלק ב-${a}.`,
            solution: [m(`${a} ${X} ${bb} = ${a} ${X} ${t * 10} + ${a} ${X} ${u}`), m(`= ${a * t * 10} + ${a * u} = ${a * bb}`)],
          };
        }
        case 'split2': {
          const a = c.rnd(13, 49), bb = c.rnd(112, 399), tt = Math.floor(a / 10) * 10, u = a % 10 || 1, A = tt + u, r = c.rnd(0, 1);
          return {
            type: 'number', answer: r ? u : u * bb,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(r ? `${A} ${X} ${bb} = ${tt} ${X} ${bb} + ` + slot(0) + ` ${X} ${bb}` : `${A} ${X} ${bb} = ${fmt(tt * bb)} + ` + slot(0))}`,
            hint: r ? `${A} = ${tt} + ? — כמה פעמים ${bb} חסרות?` : `${fmt(tt * bb)} הוא ${tt} פעמים ${bb}. כמה זה עוד ${u} פעמים ${bb}?`,
            solution: [m(`${A} ${X} ${bb} = ${tt} ${X} ${bb} + ${u} ${X} ${bb}`), m(`= ${fmt(tt * bb)} + ${fmt(u * bb)} = ${fmt(A * bb)}`)],
          };
        }
        case 'splitMiss': {
          const a = c.rnd(23, 68), h = c.rnd(1, 4) * 100, t = c.rnd(1, 9) * 10, u = c.rnd(1, 9), bb = h + t + u, r = c.rnd(0, 1);
          return {
            type: 'number', answer: r ? t : a * t,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(r ? `${a} ${X} ${bb} = ${a} ${X} ${h} + ${a} ${X} ` + slot(0) + ` + ${a} ${X} ${u}` : `${a} ${X} ${bb} = ${fmt(a * h)} + ` + slot(0) + ` + ${a * u}`)}`,
            hint: r ? `${c.g('פרק', 'פרקי')} את ${bb} למאות, עשרות ויחידות. ${c.g('שים לב', 'שימי לב')} לערך של ספרת העשרות.` : `${fmt(a * h)} הוא ${a} ${X} ${h}, ו-${a * u} הוא ${a} ${X} ${u}. מה חסר?`,
            solution: [m(`${bb} = ${h} + ${t} + ${u}`), r ? `החסר הוא ${t} (ולא ${t / 10}).` : m(`${a} ${X} ${t} = ${fmt(a * t)}`)],
          };
        }
        case 'mul1': case 'mul2': case 'mul3': {
          const a = kind === 'mul1' ? c.rnd(3, 9) : kind === 'mul2' ? c.rnd(12, 48) : c.pick([c.rnd(23, 89), c.rnd(112, 389)]);
          const bb = kind === 'mul1' ? c.rnd(24, 489) : kind === 'mul2' ? c.rnd(23, 389) : (a > 99 ? c.rnd(112, 489) : c.rnd(1203, 4987));
          return {
            type: 'number', answer: a * bb, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(a)} ${X} ${fmt(bb)} = ` + slot(0))}`,
            hint: a < 10 ? `${c.g('פרק', 'פרקי')} את ${fmt(bb)} לפי ערך המקום, ${c.g('כפול', 'כפלי')} כל חלק ב-${a} ו${c.g('חבר', 'חברי')}.` : `${c.g('פרק', 'פרקי')} את ${fmt(a)} לפי ערך המקום. ${c.g('אל תשכח', 'אל תשכחי')}: כשכופלים בעשרות, התוצאה מסתיימת ב-0.`,
            solution: mulSteps(a, bb),
          };
        }
        case 'area': {
          const a = c.rnd(12, 39), bb = c.rnd(112, 389), cols = expTerms(bb), rows = expTerms(a);
          const i = c.rnd(0, rows.length - 1), j = c.rnd(0, cols.length - 1), ans = rows[i] * cols[j];
          return {
            type: 'number', answer: ans,
            prompt: `במודל השטח מחשבים את ${m(`${a} ${X} ${bb}`)}. איזה מספר צריך להיות במשבצת עם סימן השאלה?`,
            visual: areaModel(cols, rows, { hide: [i, j] }),
            hint: `כל משבצת היא מכפלה של המספר שמעליה במספר שמימינה.`,
            solution: [m(`${fmt(rows[i])} ${X} ${fmt(cols[j])} = ${fmt(ans)}`), `ובסך הכול: ${m(`${a} ${X} ${bb} = ${fmt(a * bb)}`)}`],
          };
        }
        case 'estimate': {
          let a = c.rnd(21, 89), bb = c.rnd(210, 890);
          if (a % 10 === 5) a++; if (Math.floor(bb / 10) % 10 === 5) bb += 10;
          const ra = HM.roundTo(a, 10), rb = HM.roundTo(bb, 100), E = ra * rb;
          const fa = Math.floor(a / 10) * 10, fb = Math.floor(bb / 100) * 100, ca = fa + 10, cb = fb + 100;
          return {
            type: 'choice', prompt: `מה האומדן הטוב ביותר ל-${m(`${a} ${X} ${bb}`)}?`,
            ...opts(E, [E * 10, E / 10, fa * fb, ca * cb, fa * cb, ca * fb]),
            hint: `${c.g('עגל', 'עגלי')} את ${a} לעשרות ואת ${bb} למאות, ו${c.g('כפול', 'כפלי')} את המספרים העגולים.`,
            solution: [`${m(`${a} ≈ ${ra}`)}, ${m(`${bb} ≈ ${rb}`)}`, m(`${ra} ${X} ${rb} = ${fmt(E)}`)],
          };
        }
        case 'estCheck': {
          const f = c.friend(), a = c.rnd(23, 89), bb = c.rnd(213, 879), r = a * bb;
          const wrong = (a % 10) * bb + Math.floor(a / 10) * bb, ok = wrong === r || c.chance(0.45);
          const shown = ok ? r : wrong, ra = HM.roundTo(a, 10), rb = HM.roundTo(bb, 100);
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}: ${m(`${a} ${X} ${bb} = ${fmt(shown)}`)}.<br>נכון או לא נכון: התוצאה ${f.g('שלו', 'שלה')} סבירה? (${c.g('היעזר', 'היעזרי')} באומדן)`,
            hint: `${c.g('עגל', 'עגלי')} את שני הגורמים ו${c.g('חשב', 'חשבי')} אומדן. האם התוצאה קרובה לאומדן?`,
            solution: [`אומדן: ${m(`${ra} ${X} ${rb} = ${fmt(ra * rb)}`)}`, ok ? `${fmt(shown)} קרוב לאומדן — סביר. (ואכן ${m(`${a} ${X} ${bb} = ${fmt(r)}`)})` : `${fmt(shown)} רחוק מאוד מהאומדן — כנראה ${f.name} ${f.g('שכח', 'שכחה')} שכופלים ב-${Math.floor(a / 10) * 10} ולא ב-${Math.floor(a / 10)}. התשובה: ${fmt(r)}.`],
          };
        }
        case 'cmpEst': {
          const ra = c.rnd(2, 9) * 10, rb = c.rnd(2, 9) * 100, below = c.chance(0.5);
          const a = below ? ra - c.rnd(1, 3) : ra + c.rnd(1, 3), bb = below ? rb - c.rnd(1, 9) : rb + c.rnd(1, 9), R = ra * rb;
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים ${b('בלי לחשב')} את המכפלה:`,
            left: `${a} ${X} ${bb}`, right: fmt(R), lv: a * bb, rv: R, answer: cmpAns(a * bb, R),
            hint: `${c.g('השווה', 'השווי')} כל גורם למספר עגול קרוב: ${ra} ו-${rb}. האם שני הגורמים קטנים מהם או גדולים מהם?`,
            solution: [`${m(`${ra} ${X} ${rb} = ${fmt(R)}`)}`, below ? `${a} קטן מ-${ra} ו-${bb} קטן מ-${rb}, ולכן המכפלה קטנה מ-${fmt(R)}.` : `${a} גדול מ-${ra} ו-${bb} גדול מ-${rb}, ולכן המכפלה גדולה מ-${fmt(R)}.`, m(`${a} ${X} ${bb} ${sym(a * bb, R)} ${fmt(R)}`)],
          };
        }
        case 'storyMul': case 'storyTens': {
          const sc = c.scene(MUL_SC), f = c.friend();
          let a, bb;
          if (kind === 'storyTens') { a = c.rnd(2, 9) * 10; bb = c.rnd(2, 9) * c.pick([10, 100]); }
          else if (level === 1) { a = c.rnd(3, 9); bb = c.rnd(12, 250); }
          else if (level === 2) { a = c.rnd(12, 48); bb = c.rnd(24, 360); }
          else { a = c.rnd(24, 89); bb = c.rnd(125, 960); }
          const ans = a * bb;
          return {
            type: 'number', answer: ans, prompt: `${sc.txt(f, a, bb)}<br>${sc.q(f, a)}`,
            hint: `יש כאן ${b('קבוצות שוות')}: ${a} קבוצות, ובכל אחת ${bb}. איזו פעולה מתאימה?`,
            solution: kind === 'storyTens' ? [m(`${a} ${X} ${bb}`), m(`${a / 10} ${X} ${bb / P10(nDigits(bb) - 1)} = ${(a / 10) * (bb / P10(nDigits(bb) - 1))}`) + ' ומוסיפים את האפסים', `התשובה: ${fmt(ans)}`] : mulSteps(a, bb).concat([`התשובה: ${fmt(ans)}`]),
          };
        }
        case 'storyEst': {
          const sc = c.scene(MUL_SC), f = c.friend();
          let a = c.rnd(21, 89), bb = c.rnd(210, 890);
          if (a % 10 === 5) a++; if (Math.floor(bb / 10) % 10 === 5) bb += 10;
          const ra = HM.roundTo(a, 10), rb = HM.roundTo(bb, 100), E = ra * rb;
          return {
            type: 'choice', prompt: `${sc.txt(f, a, bb)}<br>${sc.q(f, a)} ${c.g('בחר', 'בחרי')} את האומדן הקרוב ביותר.`,
            ...opts(E, [E * 10, E / 10, (Math.floor(a / 10) * 10) * (Math.floor(bb / 100) * 100), (Math.floor(a / 10) * 10 + 10) * (Math.floor(bb / 100) * 100 + 100)]),
            hint: `${c.g('עגל', 'עגלי')} את ${a} לעשרות ואת ${bb} למאות.`,
            solution: [m(`${a} ${X} ${bb} ≈ ${ra} ${X} ${rb} = ${fmt(E)}`)],
          };
        }
        case 'storyTwo': case 'storyChoose': {
          const sc = c.scene(MUL2_SC), f = c.friend(), r = sc.make(c, f);
          if (kind === 'storyChoose') return {
            type: 'choice', prompt: `${r.txt}<br>${c.g('בחר', 'בחרי')} את התרגיל שפותר את הבעיה.`,
            choices: [m(r.ex), ...r.wr.map(m)], answer: 0,
            hint: `${c.g('חשוב', 'חשבי')} מה מחשבים קודם, ואיזו פעולה מתאימה לכל שלב.`,
            solution: r.sol.concat([`התרגיל: ${m(r.ex)}`]),
          };
          return {
            type: 'number', answer: r.ans, unit: r.unit, prompt: r.txt,
            hint: `יש כאן שני שלבים. ${c.g('מצא', 'מצאי')} קודם את מה שאפשר לחשב בכפל.`,
            solution: r.sol,
          };
        }
      }
    },
  });

  /* ========== חילוק במחלק חד-ספרתי ========== */
  // שלבי חילוק ארוך בשורה אחת
  function longDiv(N, d) {
    const s = String(N), parts = [];
    let cur = 0, started = false;
    for (const ch of s) {
      cur = cur * 10 + +ch;
      if (!started && cur < d) continue;
      started = true;
      const qd = Math.floor(cur / d), rem = cur - qd * d;
      parts.push(m(`${cur} ${DV} ${d} = ${qd}`) + (rem ? ` (נשאר ${rem})` : ''));
      cur = rem;
    }
    return parts.join(' • ');
  }
  // פתרון חילוק: שלבי חילוק ארוך (אם יש יותר משלב אחד) + שורת התוצאה
  const divSol = (N, d) => (longDiv(N, d).indexOf(' • ') > 0 ? [longDiv(N, d), divLine(N, d)] : [divLine(N, d)]);
  const divLine = (N, d) => { const q = Math.floor(N / d), r = N % d; return m(`${fmt(N)} ${DV} ${d} = ${fmt(q)}`) + (r ? ` ושארית ${r}` : ''); };
  // מספר עם d ספרות שמתחלק ב-k (או עם שארית r)
  function dividend(k, digits, r) {
    const lo = P10(digits - 1), hi = P10(digits) - 1;
    const q = HM.rnd(Math.ceil((lo - (r || 0)) / k), Math.floor((hi - (r || 0)) / k));
    return q * k + (r || 0);
  }
  // אריזה: N פריטים ב"מכלים" של d. q1 = כמה מתמלאים, q2 = כמה מלאים ומה נשאר, qAll = כמה צריך לכולם, qMore = כמה חסר למכל נוסף
  const PACK_SC = [
    { tags: ['baking'], txt: (f, N, d) => `המאפייה אורזת ${N} עוגיות בקופסאות, ${d} עוגיות בכל קופסה.`, q1: 'כמה קופסאות יתמלאו?', q2: 'כמה קופסאות מלאות יהיו, וכמה עוגיות יישארו בחוץ?', lab: ['קופסאות מלאות', 'עוגיות שנשארו'], qAll: 'כמה קופסאות צריך כדי לארוז את כל העוגיות?', qMore: 'כמה עוגיות חסרות כדי למלא עוד קופסה?' },
    { tags: ['sport'], txt: (f, N, d) => `המאמן מסדר ${N} כדורים בשקים, ${d} כדורים בכל שק.`, q1: 'כמה שקים יתמלאו?', q2: 'כמה שקים מלאים יהיו, וכמה כדורים יישארו בחוץ?', lab: ['שקים מלאים', 'כדורים שנשארו'], qAll: 'כמה שקים צריך כדי לסדר את כל הכדורים?', qMore: 'כמה כדורים חסרים כדי למלא עוד שק?' },
    { tags: ['animals'], txt: (f, N, d) => `בחווה אספו ${N} ביצים ואורזים אותן בתבניות של ${d} ביצים.`, q1: 'כמה תבניות יתמלאו?', q2: 'כמה תבניות מלאות יהיו, וכמה ביצים יישארו בחוץ?', lab: ['תבניות מלאות', 'ביצים שנשארו'], qAll: 'כמה תבניות צריך כדי לארוז את כל הביצים?', qMore: 'כמה ביצים חסרות כדי למלא עוד תבנית?' },
    { tags: ['art'], txt: (f, N, d) => `${f.name} ${f.g('מחלק', 'מחלקת')} ${N} חרוזים לשקיות, ${d} חרוזים בכל שקית.`, q1: 'כמה שקיות יתמלאו?', q2: 'כמה שקיות מלאות יהיו, וכמה חרוזים יישארו בחוץ?', lab: ['שקיות מלאות', 'חרוזים שנשארו'], qAll: 'כמה שקיות צריך כדי לחלק את כל החרוזים?', qMore: 'כמה חרוזים חסרים כדי למלא עוד שקית?' },
    { tags: ['reading'], txt: (f, N, d) => `בספרייה מסדרים ${N} ספרים חדשים על מדפים, ${d} ספרים בכל מדף.`, q1: 'כמה מדפים יתמלאו?', q2: 'כמה מדפים מלאים יהיו, וכמה ספרים יישארו בחוץ?', lab: ['מדפים מלאים', 'ספרים שנשארו'], qAll: 'כמה מדפים צריך כדי לסדר את כל הספרים?', qMore: 'כמה ספרים חסרים כדי למלא עוד מדף?' },
    { tags: ['nature'], txt: (f, N, d) => `בגן הבוטני שותלים ${N} שתילים בשורות, ${d} שתילים בכל שורה.`, q1: 'כמה שורות יתמלאו?', q2: 'כמה שורות מלאות יהיו, וכמה שתילים יישארו?', lab: ['שורות מלאות', 'שתילים שנשארו'], qAll: 'כמה שורות צריך כדי לשתול את כל השתילים?', qMore: 'כמה שתילים חסרים כדי למלא עוד שורה?' },
    { tags: ['music'], txt: (f, N, d) => `${f.name} ${f.g('מסדר', 'מסדרת')} ${N} שירים ברשימות השמעה, ${d} שירים בכל רשימה.`, q1: 'כמה רשימות יתמלאו?', q2: 'כמה רשימות מלאות יהיו, וכמה שירים יישארו?', lab: ['רשימות מלאות', 'שירים שנשארו'], qAll: 'כמה רשימות צריך כדי לסדר את כל השירים?', qMore: 'כמה שירים חסרים כדי למלא עוד רשימה?' },
    { tags: ['games'], txt: (f, N, d) => `במשחק, ${f.name} ${f.g('ממיר', 'ממירה')} ${N} מטבעות ליהלומים. כל יהלום עולה ${d} מטבעות.`, q1: 'כמה יהלומים אפשר לקבל?', q2: 'כמה יהלומים אפשר לקבל, וכמה מטבעות יישארו?', lab: ['יהלומים', 'מטבעות שנשארו'], qMore: 'כמה מטבעות חסרים כדי לקבל עוד יהלום?' },
    { tags: ['space'], txt: (f, N, d) => `בתחנת החלל אורזים ${N} ארוחות בארגזים, ${d} ארוחות בכל ארגז.`, q1: 'כמה ארגזים יתמלאו?', q2: 'כמה ארגזים מלאים יהיו, וכמה ארוחות יישארו?', lab: ['ארגזים מלאים', 'ארוחות שנשארו'], qAll: 'כמה ארגזים צריך כדי לארוז את כל הארוחות?', qMore: 'כמה ארוחות חסרות כדי למלא עוד ארגז?' },
    { tags: ['tech'], txt: (f, N, d) => `${f.name} ${f.g('מעביר', 'מעבירה')} ${N} תמונות לתיקיות, ${d} תמונות בכל תיקייה.`, q1: 'כמה תיקיות יתמלאו?', q2: 'כמה תיקיות מלאות יהיו, וכמה תמונות יישארו?', lab: ['תיקיות מלאות', 'תמונות שנשארו'], qAll: 'כמה תיקיות צריך כדי להעביר את כל התמונות?', qMore: 'כמה תמונות חסרות כדי למלא עוד תיקייה?' },
    { tags: ['kpop'], txt: (f, N, d) => `מועדון המעריצים אורז ${N} פוטוקארדים בשקיות, ${d} פוטוקארדים בכל שקית.`, q1: 'כמה שקיות יתמלאו?', q2: 'כמה שקיות מלאות יהיו, וכמה פוטוקארדים יישארו?', lab: ['שקיות מלאות', 'פוטוקארדים שנשארו'], qAll: 'כמה שקיות צריך כדי לארוז את כל הפוטוקארדים?', qMore: 'כמה פוטוקארדים חסרים כדי למלא עוד שקית?' },
    { tags: ['magic'], txt: (f, N, d) => `בבית הספר לקוסמים מסדרים ${N} בקבוקוני שיקוי בתיבות, ${d} בקבוקונים בכל תיבה.`, q1: 'כמה תיבות יתמלאו?', q2: 'כמה תיבות מלאות יהיו, וכמה בקבוקונים יישארו?', lab: ['תיבות מלאות', 'בקבוקונים שנשארו'], qAll: 'כמה תיבות צריך כדי לסדר את כל הבקבוקונים?', qMore: 'כמה בקבוקונים חסרים כדי למלא עוד תיבה?' },
    { tags: ['squishy'], txt: (f, N, d) => `${f.name} ${f.g('מסדר', 'מסדרת')} ${N} סקווישים בקופסאות, ${d} סקווישים בכל קופסה.`, q1: 'כמה קופסאות יתמלאו?', q2: 'כמה קופסאות מלאות יהיו, וכמה סקווישים יישארו בחוץ?', lab: ['קופסאות מלאות', 'סקווישים שנשארו'], qAll: 'כמה קופסאות צריך כדי לסדר את כל הסקווישים?', qMore: 'כמה סקווישים חסרים כדי למלא עוד קופסה?' },
    { tags: ['nature', 'sport'], small: true, txt: (f, N, d) => `לטיול יוצאים ${N} ילדים. בכל מכונית יש מקום ל-${d} ילדים.`, q1: 'כמה מכוניות יתמלאו?', q2: 'כמה מכוניות מלאות יהיו, וכמה ילדים יישארו?', lab: ['מכוניות מלאות', 'ילדים שנשארו'], qAll: 'כמה מכוניות צריך כדי שכל הילדים ייסעו?', qMore: 'כמה ילדים חסרים כדי למלא עוד מכונית?' },
    { tags: ['nature', 'sport'], big: true, txt: (f, N, d) => `לטיול השנתי יוצאים ${N} תלמידים. בכל אוטובוס יש ${d} מקומות.`, q1: 'כמה אוטובוסים יתמלאו?', q2: 'כמה אוטובוסים מלאים יהיו, וכמה תלמידים יישארו?', lab: ['אוטובוסים מלאים', 'תלמידים שנשארו'], qAll: 'כמה אוטובוסים צריך כדי שכל התלמידים ייסעו?', qMore: 'כמה תלמידים חסרים כדי למלא עוד אוטובוס?' },
  ];
  // שאלה "רב-שדות": מנה + שארית
  const qr = (N, d) => [Math.floor(N / d), N % d];

  HM.lesson({
    id: 'n-div1',
    learn: (c) => [
      {
        title: 'מחלקים לפי ערך המקום',
        html: `${c.name} ${c.g('מחלק', 'מחלקת')} ${m('852')} מדבקות שווה בשווה בין 4 חברים. כמה מקבל כל אחד?<br>מפרקים את 852 לחלקים שקל לחלק ב-4, ומחלקים כל חלק בנפרד:`,
        visual: V.table(['חלק', 'חילוק', 'תוצאה'], [['800', m(`800 ${DV} 4`), '200'], ['40', m(`40 ${DV} 4`), '10'], ['12', m(`12 ${DV} 4`), '3'], [b('852'), m(`852 ${DV} 4`), b('213')]]),
      },
      {
        title: 'מחולק, מחלק, מנה ושארית',
        html: `${m(`29 ${DV} 4 = 7`)} ושארית 1:<br>• 29 — ${b('המחולק')} (מה שמחלקים)<br>• 4 — ${b('המחלק')} (לכמה מחלקים, או כמה בכל קבוצה)<br>• 7 — ${b('המנה')} (התוצאה)<br>• 1 — ${b('השארית')} (מה שנשאר בחוץ)<br>השארית תמיד ${HM.hl('קטנה מהמחלק')} — אחרת אפשר היה ליצור עוד קבוצה.`,
        visual: `<div class="row">${V.groups(7, 4)}${V.tokens(1, 'circle', { hl: 1 })}</div>`,
      },
      {
        title: 'חילוק ארוך',
        html: `ב-${m(`1,356 ${DV} 4`)} מחלקים משמאל לימין, מקום אחרי מקום. אלף אחד אי אפשר לחלק ל-4 קבוצות, אז מתחילים מ-13 מאות.`,
        steps: [`${m(`13 ${DV} 4 = 3`)} (כי ${m(`3 ${X} 4 = 12`)}), נשארה מאה אחת.`, `מאה אחת ועוד 5 עשרות הן 15 עשרות: ${m(`15 ${DV} 4 = 3`)}, נשארו 3 עשרות.`, `3 עשרות ועוד 6 יחידות הן 36: ${m(`36 ${DV} 4 = 9`)}.`, `${b('המנה')}: ${m(`1,356 ${DV} 4 = 339`)}.`],
      },
      {
        title: 'חילוק עם שארית ובדיקה',
        html: `${m(`2,347 ${DV} 5 = 469`)} ושארית 2.<br>${c.g('בדוק', 'בדקי')} תמיד בעזרת כפל: ${b('מנה × מחלק + שארית = מחולק')}.<br>${m(`469 ${X} 5 + 2 = 2,345 + 2 = 2,347`)} ✔`,
        quiz: {
          type: 'number', answer: [24, 3],
          prompt: `${c.g('חשב', 'חשבי')}: ${m(`171 ${DV} 7 = ` + slot(0))} ושארית ${slot(1)}`,
          hint: `כמה פעמים 7 נכנס ב-171? ${m(`7 ${X} 20 = 140`)}, ומה עם השאר?`,
          solution: [longDiv(171, 7), `${m(`24 ${X} 7 + 3 = 171`)} ✔`],
        },
      },
      {
        title: 'אל תשכחו את האפס!',
        html: `${m(`4,236 ${DV} 4`)}: אחרי שמחלקים את 4 האלפים ואת 2 המאות, מגיעים ל-3 עשרות. 3 קטן מ-4, ולכן ${b('כותבים 0 במנה')} וממשיכים עם 36.<br>התשובה היא ${m('1,059')} — ולא 159!`,
        steps: [`${m(`4 ${DV} 4 = 1`)} ← אלף אחד.`, `${m(`2 ${DV} 4 = 0`)} ← 0 מאות במנה, נשארו 2 מאות = 20 עשרות.`, `${m(`23 ${DV} 4 = 5`)}, נשארו 3 ← ${m(`36 ${DV} 4 = 9`)}.`, `המנה: ${m('1,059')}`],
      },
      {
        title: 'חוש מספרים: כמה ספרות במנה?',
        html: `ב-${m(`2,450 ${DV} 7`)} הספרה הראשונה, 2, קטנה מ-7. לכן מתחילים ממאות (24 מאות), והמנה תהיה ${b('בת 3 ספרות')}.<br>אומדן: ${m(`7 ${X} 300 = 2,100`)} ו-${m(`7 ${X} 400 = 2,800`)}, אז המנה בין 300 ל-400. (התשובה: 350.)`,
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['divExact', 'divRem', 'remPossible', 'check', 'placeSplit', 'storyShare', 'storyPack', 'storyShare', 'storyPack']
        : level === 2 ? ['divExact', 'divRem', 'zeroQuot', 'digits', 'estimate', 'storyPack', 'storyShare', 'storyAll', 'storyPack', 'divRem']
        : ['divRem', 'missDividend', 'remTF', 'zeroQuot', 'digitsWhy', 'storyAll', 'storyMore', 'storyTwoDiv', 'storyAll', 'divExact'];
      const kind = c.pick(kinds);
      const dg = level === 1 ? 3 : level === 2 ? 4 : 5;
      switch (kind) {
        case 'divExact': {
          const d = c.rnd(level === 1 ? 2 : 3, 9), N = dividend(d, dg);
          return {
            type: 'number', answer: N / d, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(N)} ${DV} ${d} = ` + slot(0))}`,
            hint: `${c.g('חלק', 'חלקי')} משמאל לימין. ${c.g('התחל', 'התחילי')} מהמקום הראשון שאפשר לחלק ב-${d}.`,
            solution: divSol(N, d).concat([`בדיקה: ${m(`${fmt(N / d)} ${X} ${d} = ${fmt(N)}`)} ✔`]),
          };
        }
        case 'divRem': {
          const d = c.rnd(3, 9), r = c.rnd(1, d - 1), N = dividend(d, level === 1 ? c.pick([2, 3]) : dg, r), [q] = qr(N, d);
          return {
            type: 'number', answer: [q, r], prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(N)} ${DV} ${d} = ` + slot(0))} ושארית ${slot(1)}`,
            hint: `${c.g('חלק', 'חלקי')} כרגיל. בסוף נשאר מספר קטן מ-${d} — זו השארית.`,
            solution: divSol(N, d).concat([`בדיקה: ${m(`${fmt(q)} ${X} ${d} + ${r} = ${fmt(N)}`)} ✔`]),
          };
        }
        case 'placeSplit': {
          const d = c.rnd(2, 6), h = c.rnd(1, Math.floor(9 / d)), t = c.rnd(1, 9), u = c.rnd(1, 9);
          const A = d * h * 100, B = d * t * 10, C = d * u, N = A + B + C, q = h * 100 + t * 10 + u;
          return {
            type: 'number', answer: q,
            prompt: `${c.g('חשב', 'חשבי')} בעזרת הפירוק: ${m(`${fmt(N)} ${DV} ${d} = ${A} ${DV} ${d} + ${B} ${DV} ${d} + ${C} ${DV} ${d} = ` + slot(0))}`,
            hint: `${c.g('חלק', 'חלקי')} כל חלק ב-${d}, ואז ${c.g('חבר', 'חברי')} את התוצאות.`,
            solution: [m(`${A} ${DV} ${d} = ${h * 100}`) + ' • ' + m(`${B} ${DV} ${d} = ${t * 10}`) + ' • ' + m(`${C} ${DV} ${d} = ${u}`), m(`${h * 100} + ${t * 10} + ${u} = ${q}`)],
          };
        }
        case 'remPossible': {
          const d = c.rnd(4, 9), ok = c.sample(HM.range(1, d - 1), 3);
          const tf = c.chance(0.4);
          if (tf) {
            const r = c.chance(0.5) ? d : c.rnd(1, d - 1);
            return {
              type: 'tf', answer: r < d, prompt: `נכון או לא נכון? כשמחלקים מספר ב-${d}, השארית יכולה להיות ${r}.`,
              hint: 'השארית תמיד קטנה מהמחלק.',
              solution: [r < d ? `${r} קטן מ-${d} — אפשרי. נכון.` : `${r} שווה למחלק — אפשר ליצור ממנה עוד קבוצה. לא נכון.`],
            };
          }
          return {
            type: 'choice', prompt: `מחלקים מספרים ב-${d}. איזו שארית ${b('אי אפשר')} לקבל?`,
            choices: [d, ...ok].map(String), answer: 0,
            hint: `${c.g('זכור', 'זכרי')}: השארית תמיד קטנה מהמחלק.`,
            solution: [`השארית יכולה להיות רק 0, 1, ..., ${d - 1}.`, `שארית ${d} אומרת שאפשר ליצור עוד קבוצה של ${d}.`],
          };
        }
        case 'check': {
          const f = c.friend(), d = c.rnd(3, 9), r = c.rnd(1, d - 1), N = dividend(d, 3, r), q = Math.floor(N / d);
          return {
            type: 'number', answer: N,
            prompt: `${f.name} ${f.g('פתר', 'פתרה')}: ${m(`${fmt(N)} ${DV} ${d} = ${q}`)} ושארית ${r}.<br>${c.g('השלם', 'השלימי')} את תרגיל הבדיקה: ${m(`${q} ${X} ${d} + ${r} = ` + slot(0))}`,
            hint: `קודם ${c.g('כפול', 'כפלי')} את המנה במחלק, ואחר כך ${c.g('הוסף', 'הוסיפי')} את השארית.`,
            solution: [m(`${q} ${X} ${d} = ${fmt(q * d)}`), m(`${fmt(q * d)} + ${r} = ${fmt(N)}`), 'קיבלנו את המחולק — התרגיל נכון.'],
          };
        }
        case 'zeroQuot': {
          const d = c.rnd(3, 9), big = level === 3;
          const q = big ? c.rnd(1, 9) * 1000 + c.rnd(1, 9) * 10 * c.pick([0, 1]) + c.rnd(1, 9) : c.rnd(1, 9) * 100 + c.rnd(1, 9);
          const r = c.chance(0.5) ? 0 : c.rnd(1, d - 1), N = q * d + r;
          const noZero = +String(q).replace(/0/g, ''), shift = +(String(q).replace(/0/, '') + '0');
          return {
            type: 'choice', prompt: `כמה זה ${m(`${fmt(N)} ${DV} ${d}`)}?${r ? ` (${c.g('בחר', 'בחרי')} את המנה; יש גם שארית.)` : ''}`,
            ...opts(q, [noZero, shift, q * 10, q + P10(nDigits(q) - 2)]),
            hint: `${c.g('חלק', 'חלקי')} מקום אחרי מקום. אם באחד המקומות המספר קטן מ-${d} — ${c.g('כתוב', 'כתבי')} 0 במנה!`,
            solution: divSol(N, d),
          };
        }
        case 'digits': {
          const d = c.rnd(3, 9), N = dividend(d, c.pick([4, 5]), c.rnd(0, d - 1)), q = Math.floor(N / d), k = nDigits(q);
          const choices = ['1', '2', '3', '4', '5'].slice(k >= 3 ? k - 3 : 0, (k >= 3 ? k - 3 : 0) + 4);
          return {
            type: 'choice', keep: true, prompt: `${b('בלי לחשב')}: כמה ספרות יהיו במנה של ${m(`${fmt(N)} ${DV} ${d}`)}?`,
            choices, answer: choices.indexOf(String(k)),
            hint: `${c.g('השווה', 'השווי')} את הספרה הראשונה של המחולק ל-${d}. אם היא קטנה מ-${d}, מתחילים מהמקום הבא.`,
            solution: [String(N)[0] >= d ? `${String(N)[0]} גדול מ-${d} או שווה לו, ולכן כבר המקום הראשון נותן ספרה במנה.` : `${String(N)[0]} קטן מ-${d}, ולכן מתחילים מ-${String(N).slice(0, 2)}.`, `המנה ${fmt(q)} — ${k} ספרות.`],
          };
        }
        case 'digitsWhy': {
          const d = c.rnd(4, 9);
          const mk = (digs, small) => { for (let t = 0; t < 60; t++) { const N = dividend(d, digs); if ((+String(N)[0] < d) === small) return N; } return null; };
          const right = mk(4, true), w = [mk(4, false), mk(3, true), mk(5, true), mk(3, false)].filter((x) => x);
          return {
            type: 'choice', prompt: `באיזה תרגיל המנה היא מספר ${b('בן 3 ספרות')}?`,
            choices: [right, ...w.slice(0, 3)].map((N) => m(`${fmt(N)} ${DV} ${d}`)), answer: 0,
            hint: `לכל תרגיל ${c.g('בדוק', 'בדקי')}: מאיזה מקום מתחילים לחלק? אם הספרה הראשונה קטנה מ-${d}, מתחילים מהמקום הבא.`,
            solution: [`${m(`${fmt(right)} ${DV} ${d} = ${fmt(right / d)}`)} — 3 ספרות.`],
          };
        }
        case 'estimate': {
          const d = c.rnd(3, 9);
          let N, q;
          do { N = dividend(d, 4, c.rnd(0, d - 1)); q = Math.floor(N / d); } while (q % P10(nDigits(q) - 1) === 0);
          const p = P10(nDigits(q) - 1), lo = Math.floor(q / p) * p;
          const rng = (a) => `בין ${fmt(a)} ל-${fmt(a + P10(nDigits(a) - 1))}`;
          const cands = [lo * 10, lo / 10, lo + p, lo - p].filter((x) => x >= 1 && Number.isInteger(x) && x !== lo);
          return {
            type: 'choice', prompt: `בין אילו מספרים נמצאת המנה של ${m(`${fmt(N)} ${DV} ${d}`)}?`,
            choices: [rng(lo), ...cands.slice(0, 3).map(rng)], answer: 0,
            hint: `${c.g('נסה', 'נסי')} לכפול את ${d} במספרים עגולים: ${m(`${d} ${X} 100`)}, ${m(`${d} ${X} 200`)}...`,
            solution: [`${m(`${d} ${X} ${fmt(lo)} = ${fmt(d * lo)}`)} ו-${m(`${d} ${X} ${fmt(lo + p)} = ${fmt(d * (lo + p))}`)}`, `${fmt(N)} נמצא ביניהם, ולכן המנה ${rng(lo)}.`],
          };
        }
        case 'missDividend': {
          const d = c.rnd(3, 9), q = c.rnd(105, 2400), r = c.rnd(1, d - 1);
          return {
            type: 'number', answer: q * d + r, prompt: `${c.g('השלם', 'השלימי')}: ${m(slot(0) + ` ${DV} ${d} = ${fmt(q)}`)} ושארית ${r}`,
            hint: `${c.g('היעזר', 'היעזרי')} בתרגיל הבדיקה: מנה × מחלק + שארית = מחולק.`,
            solution: [m(`${fmt(q)} ${X} ${d} = ${fmt(q * d)}`), m(`${fmt(q * d)} + ${r} = ${fmt(q * d + r)}`)],
          };
        }
        case 'remTF': {
          const d = c.rnd(4, 9), r = c.rnd(1, d - 1), N = dividend(d, 4, r), q = Math.floor(N / d);
          const S = c.pick([
            [`בחילוק ב-${d}, השארית הגדולה ביותר האפשרית היא ${d - 1}.`, true, `השארית קטנה מהמחלק, ולכן לכל היותר ${d - 1}.`],
            [`${m(`${fmt(N)} ${DV} ${d} = ${fmt(q - 1)}`)} ושארית ${r + d}.`, false, `השארית ${r + d} גדולה מהמחלק — אפשר לחלק עוד. התשובה: ${fmt(q)} ושארית ${r}.`],
            [`אם ${m(`${fmt(N)} ${DV} ${d} = ${fmt(q)}`)} ושארית ${r}, אז ${m(`${fmt(q)} ${X} ${d} + ${r} = ${fmt(N)}`)}.`, true, 'זה תרגיל הבדיקה: מנה × מחלק + שארית = מחולק.'],
            [`${m(`${fmt(N)} ${DV} ${d} = ${fmt(q)}`)} ושארית ${r}, ולכן ${m(`${fmt(N - r)} ${DV} ${d}`)} מתחלק בלי שארית.`, true, `${fmt(N - r)} הוא בדיוק ${fmt(q)} פעמים ${d}.`],
            [`${m(`${fmt(N)} ${DV} ${d} = ${fmt(q)}`)} ושארית ${r}, ולכן ${m(`${fmt(N + 1)} ${DV} ${d}`)} מתחלק בלי שארית.`, r === d - 1, r === d - 1 ? `${r} + 1 = ${d} — נוצרת עוד קבוצה שלמה.` : `השארית תהיה ${r + 1}, ולא 0.`],
          ]);
          return {
            type: 'tf', answer: S[1], prompt: `נכון או לא נכון? ${S[0]}`,
            hint: `${c.g('זכור', 'זכרי')}: השארית קטנה מהמחלק, ו-מנה × מחלק + שארית = מחולק.`,
            solution: [S[1] ? 'נכון.' : 'לא נכון.', S[2]],
          };
        }
        case 'storyShare': case 'storyPack': case 'storyAll': case 'storyMore': {
          let list = PACK_SC.filter((s) => !s.big);
          if (kind === 'storyAll') list = list.filter((s) => s.qAll);
          const sc = c.scene(list), f = c.friend();
          const d = c.rnd(level === 1 ? 2 : 3, 9);
          const digs = sc.small ? 2 : level === 1 ? c.pick([2, 3]) : level === 2 ? 3 : 4;
          const r = kind === 'storyShare' ? 0 : c.rnd(1, d - 1), N = dividend(d, digs, r), q = Math.floor(N / d);
          const base = sc.txt(f, fmt(N), d);
          if (kind === 'storyShare') return {
            type: 'number', answer: q, prompt: `${base}<br>${sc.q1}`,
            hint: `מחלקים ${fmt(N)} לקבוצות של ${d}. איזו פעולה זו?`,
            solution: divSol(N, d),
          };
          if (kind === 'storyPack') return {
            type: 'number', answer: [q, r], labels: sc.lab, prompt: `${base}<br>${sc.q2}`,
            hint: `${c.g('חלק', 'חלקי')} את ${fmt(N)} ב-${d}. המנה היא מספר הקבוצות המלאות, והשארית היא מה שנשאר.`,
            solution: divSol(N, d).concat([`${sc.lab[0]}: ${fmt(q)}, ${sc.lab[1]}: ${r}.`]),
          };
          if (kind === 'storyAll') return {
            type: 'number', answer: q + 1, prompt: `${base}<br>${sc.qAll}`,
            hint: `${c.g('חלק', 'חלקי')}, ו${c.g('חשוב', 'חשבי')} מה עושים עם השארית: גם הפריטים שנשארו צריכים מקום!`,
            solution: [divLine(N, d), `${fmt(q)} מלאים לא מספיקים — צריך עוד אחד בשביל ה-${r} שנשארו.`, m(`${fmt(q)} + 1 = ${fmt(q + 1)}`)],
          };
          return {
            type: 'number', answer: d - r, prompt: `${base}<br>${sc.qMore}`,
            hint: `קודם ${c.g('מצא', 'מצאי')} מה השארית. כמה חסר לה כדי להגיע ל-${d}?`,
            solution: [divLine(N, d), m(`${d} − ${r} = ${d - r}`)],
          };
        }
        case 'storyTwoDiv': {
          const f = c.friend();
          if (c.chance(0.5)) {
            const d = c.rnd(3, 8), each = c.rnd(18, 95), Q = c.rnd(5, 25), P = each * d - Q;
            return {
              type: 'number', answer: each, unit: '₪',
              prompt: `${f.name} ו-${d - 1} ${f.g('חברים שלו', 'חברות שלה')} קנו מתנה ב-${fmt(P)} ₪ וכרטיס ברכה ב-${Q} ₪, וחילקו את התשלום שווה בשווה.<br>כמה ${f.g('שילם כל אחד', 'שילמה כל אחת')}?`,
              hint: `שני שלבים: כמה עלה הכול, וכמה ילדים משלמים? ${c.g('אל תשכח', 'אל תשכחי')} את ${f.name}!`,
              solution: [m(`${fmt(P)} + ${Q} = ${fmt(each * d)}`), `משלמים ${d} ילדים: ${m(`${fmt(each * d)} ${DV} ${d} = ${each}`)}`],
            };
          }
          const d = c.rnd(4, 8), g = c.rnd(12, 40), A = c.rnd(Math.floor(g * d * 0.35), Math.floor(g * d * 0.65)), B = g * d - A;
          return {
            type: 'number', answer: g,
            prompt: `ביום הספורט השתתפו ${fmt(A)} בנים ו-${fmt(B)} בנות. המורים חילקו את כל הילדים לקבוצות של ${d}.<br>כמה קבוצות היו?`,
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה ילדים היו בסך הכול, ואחר כך ${c.g('חלק', 'חלקי')}.`,
            solution: [m(`${fmt(A)} + ${fmt(B)} = ${fmt(g * d)}`), m(`${fmt(g * d)} ${DV} ${d} = ${g}`)],
          };
        }
      }
    },
  });

  /* ========== חילוק במחלק דו-ספרתי ========== */
  // כמה ספרות במנה (והסבר)
  function quotDigits(N, d) {
    const s = String(N), k = nDigits(d), pre = +s.slice(0, k);
    const digs = pre >= d ? s.length - k + 1 : s.length - k;
    const why = pre >= d ? `${pre} ${pre > d ? 'גדול מ-' : 'שווה ל-'}${d}, ולכן מתחילים לחלק כבר מ-${pre}.` : `${pre} קטן מ-${d}, ולכן מתחילים לחלק מ-${s.slice(0, k + 1)}.`;
    return { digs, why };
  }
  // בחירה: "בין אילו מספרים נמצאת המנה"
  function rangeQ(c, N, d) {
    const q = Math.floor(N / d), p = P10(nDigits(q) - 1), lo = Math.floor(q / p) * p;
    const rng = (a) => `בין ${fmt(a)} ל-${fmt(a + P10(nDigits(a) - 1))}`;
    const cands = [lo * 10, lo / 10, lo + p, lo - p].filter((x) => x >= 1 && Number.isInteger(x) && x !== lo);
    return {
      type: 'choice', prompt: `${b('בלי לחשב בדיוק')}: בין אילו מספרים נמצאת המנה של ${m(`${fmt(N)} ${DV} ${d}`)}?`,
      choices: [rng(lo), ...cands.slice(0, 3).map(rng)], answer: 0,
      hint: `${c.g('כפול', 'כפלי')} את ${d} במספרים עגולים (${m(`${d} ${X} 10`)}, ${m(`${d} ${X} 100`)}...) ו${c.g('בדוק', 'בדקי')} בין אילו מכפלות נמצא ${fmt(N)}.`,
      solution: [`${m(`${d} ${X} ${fmt(lo)} = ${fmt(d * lo)}`)} ו-${m(`${d} ${X} ${fmt(lo + p)} = ${fmt(d * (lo + p))}`)}`, `${fmt(N)} נמצא ביניהם, ולכן המנה ${rng(lo)}.`],
    };
  }
  // מחירים: איזו חבילה משתלמת יותר
  const DEAL_SC = [
    { tags: ['squishy'], u: 'סקווישים', one: 'סקוויש אחד' }, { tags: ['kpop'], u: 'פוטוקארדים', one: 'פוטוקארד אחד' },
    { tags: ['art'], u: 'טושים', one: 'טוש אחד' }, { tags: ['sport'], u: 'כדורי טניס', one: 'כדור טניס אחד' },
    { tags: ['reading'], u: 'מחברות', one: 'מחברת אחת', fem: true }, { tags: ['baking'], u: 'עוגיות', one: 'עוגייה אחת', fem: true },
    { tags: ['magic'], u: 'בקבוקוני שיקוי', one: 'בקבוקון שיקוי אחד' }, { tags: ['games', 'tech'], u: 'כרטיסי משחק', one: 'כרטיס משחק אחד' },
    { tags: ['animals', 'nature'], u: 'שקיות מזון לציפורים', one: 'שקית מזון אחת', fem: true }, { tags: ['music', 'space'], u: 'מדבקות', one: 'מדבקה אחת', fem: true },
  ];

  HM.lesson({
    id: 'n-div2',
    learn: (c) => [
      {
        title: 'מחלק דו-ספרתי',
        html: `לטיול יוצאים ${m('384')} תלמידים, ובכל אוטובוס 32 מקומות. כמה אוטובוסים צריך?<br>${c.name}, כשהמחלק דו-ספרתי, עוזר לבנות ${b('טבלת כפולות')} קטנה של המחלק ולמצוא את הכפולה המתאימה.`,
        visual: V.table(['תרגיל', 'מכפלה'], [[m(`32 ${X} 10`), '320'], [m(`32 ${X} 11`), '352'], [m(`32 ${X} 12`), b('384')], [m(`32 ${X} 13`), '416']]),
      },
      {
        title: 'מנחשים ובודקים',
        html: `כדי למצוא ספרה במנה, מעגלים את המחלק ומנחשים. אחר כך ${b('בודקים בכפל')} ומתקנים.`,
        steps: [`${m(`168 ${DV} 24`)}: 24 קרוב ל-20, ו-${m(`168 ${DV} 20`)} זה בערך 8.`, `בדיקה: ${m(`8 ${X} 24 = 192`)} — גדול מ-168. הניחוש גדול מדי.`, `ננסה 7: ${m(`7 ${X} 24 = 168`)} ✔`, `${b('המנה')}: 7.`],
      },
      {
        title: 'חילוק ארוך במספר ארבע-ספרתי',
        html: `${m(`7,392 ${DV} 32`)}: 7 קטן מ-32, ולכן מתחילים מ-73 (מאות).`,
        steps: [`${m(`73 ${DV} 32 = 2`)} (כי ${m(`2 ${X} 32 = 64`)}), נשארו 9.`, `מורידים את הספרה הבאה: 99. ${m(`99 ${DV} 32 = 3`)} (${m(`3 ${X} 32 = 96`)}), נשארו 3.`, `מורידים את הספרה האחרונה: 32. ${m(`32 ${DV} 32 = 1`)}.`, `המנה: ${m('231')}. בדיקה: ${m(`231 ${X} 32 = 7,392`)} ✔`],
      },
      {
        title: 'חילוק עם שארית',
        html: `${m(`1,000 ${DV} 24 = 41`)} ושארית 16.<br>בדיקה: ${m(`41 ${X} 24 + 16 = 984 + 16 = 1,000`)} ✔<br>${c.g('זכור', 'זכרי')}: השארית חייבת להיות ${b('קטנה מהמחלק')}. אם יצאה שארית 30 בחילוק ב-24 — אפשר לחלק עוד!`,
        quiz: {
          type: 'number', answer: [21, 17], prompt: `${c.g('חשב', 'חשבי')}: ${m(`500 ${DV} 23 = ` + slot(0))} ושארית ${slot(1)}`,
          hint: `${m(`23 ${X} 20 = 460`)}. כמה נשאר עד 500?`,
          solution: [longDiv(500, 23), `בדיקה: ${m(`21 ${X} 23 + 17 = 500`)} ✔`],
        },
      },
      {
        title: 'כמה ספרות במנה?',
        html: `${b('לפני')} שמחלקים, אפשר לדעת כמה ספרות יהיו במנה:<br>• ${m(`4,536 ${DV} 54`)}: 45 קטן מ-54, מתחילים מ-453 עשרות ← המנה ${b('דו-ספרתית')} (84).<br>• ${m(`6,120 ${DV} 51`)}: 61 גדול מ-51, מתחילים כבר במאות ← המנה ${b('תלת-ספרתית')} (120).`,
      },
      {
        title: 'אומדן תוצאות חילוק',
        html: `מעגלים את המחלק לעשרות, ואת המחולק למספר שקל לחלק בו:<br>${m(`6,120 ${DV} 29 ≈ 6,000 ${DV} 30 = 200`)}<br>האומדן עוזר לבדוק שלא שכחנו ספרה במנה.`,
        quiz: {
          type: 'choice', prompt: `מה האומדן הטוב ביותר ל-${m(`3,950 ${DV} 41`)}?`,
          choices: ['100', '10', '1,000', '400'], answer: 0,
          hint: '41 קרוב ל-40, ו-3,950 קרוב ל-4,000.',
          solution: [m(`4,000 ${DV} 40 = 100`)],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['div3a', 'divRem3a', 'trial', 'roundDiv', 'digits', 'storyShare', 'storyPack', 'storyShare', 'roundDiv', 'storyPack']
        : level === 2 ? ['div3b', 'div4', 'divRem4', 'digits', 'estimate', 'storyShare', 'storyPack', 'storyAll', 'storyDeal', 'div4']
        : ['divRem4z', 'checkTF', 'missDividend', 'digitsWhy', 'estimate', 'storyAll', 'storyMore', 'storyTwo', 'storyDeal', 'divRem4z'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'div3a': case 'div3b': case 'div4': {
          let d, q;
          if (kind === 'div3a') { d = c.rnd(12, 49); q = c.rnd(3, 9); }
          else if (kind === 'div3b') { d = c.rnd(11, 39); q = c.rnd(11, Math.floor(999 / d)); }
          else { d = c.rnd(12, 79); q = c.rnd(Math.ceil(1000 / d), Math.floor(9999 / d)); }
          const N = q * d;
          return {
            type: 'number', answer: q, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(N)} ${DV} ${d} = ` + slot(0))}`,
            hint: d % 10 ? `${c.g('עגל', 'עגלי')} את ${d} לעשרות כדי לנחש כל ספרה במנה, ואז ${c.g('בדוק', 'בדקי')} בכפל.` : `${c.g('נחש', 'נחשי')} כל ספרה במנה בעזרת כפולות של ${d}, ו${c.g('בדוק', 'בדקי')} בכפל.`,
            solution: divSol(N, d).concat([`בדיקה: ${m(`${fmt(q)} ${X} ${d} = ${fmt(N)}`)} ✔`]),
          };
        }
        case 'divRem3a': case 'divRem4': case 'divRem4z': {
          let d, q;
          if (kind === 'divRem3a') { d = c.rnd(12, 49); q = c.rnd(3, Math.min(9, Math.floor(990 / d))); }
          else if (kind === 'divRem4') { d = c.rnd(12, 79); q = c.rnd(Math.ceil(1000 / d), Math.floor(9900 / d)); }
          else { d = c.rnd(13, 69); q = c.pick([c.rnd(1, 9) * 100 + c.rnd(1, 9), c.rnd(1, 9) * 100 + c.rnd(1, 9) * 10, c.rnd(1, 9) * 1000 + c.rnd(1, 9) * 10 + c.rnd(1, 9)]); }
          const r = c.rnd(1, d - 1), N = q * d + r;
          return {
            type: 'number', answer: [q, r], prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(N)} ${DV} ${d} = ` + slot(0))} ושארית ${slot(1)}`,
            hint: kind === 'divRem4z' ? `${c.g('שים לב', 'שימי לב')}: אם באחד השלבים המספר קטן מ-${d}, ${c.g('כתוב', 'כתבי')} 0 במנה ו${c.g('הורד', 'הורידי')} את הספרה הבאה.` : `${c.g('חלק', 'חלקי')} כרגיל. מה שנשאר בסוף, והוא קטן מ-${d}, הוא השארית.`,
            solution: divSol(N, d).concat([`בדיקה: ${m(`${fmt(q)} ${X} ${d} + ${r} = ${fmt(N)}`)} ✔`]),
          };
        }
        case 'trial': {
          const d = c.rnd(13, 48), q = c.rnd(3, 8), r = c.chance(0.5) ? 0 : c.rnd(1, d - 1), N = q * d + r;
          return {
            type: 'choice', keep: true, prompt: `${c.g('נחש', 'נחשי')} ו${c.g('בדוק', 'בדקי')}: מהי המנה בתרגיל ${m(`${N} ${DV} ${d}`)}?${r ? ' (יש גם שארית.)' : ''}`,
            choices: [q - 2, q - 1, q, q + 1].filter((x) => x > 0).map(String), answer: q - 2 > 0 ? 2 : 1,
            hint: `${c.g('עגל', 'עגלי')} את ${d} לעשרות ו${c.g('נחש', 'נחשי')}. אחר כך ${c.g('בדוק', 'בדקי')}: ${m(`${d} ${X} ?`)} צריך להיות קרוב ל-${N}, אבל לא יותר ממנו.`,
            solution: [m(`${q} ${X} ${d} = ${q * d}`) + (r ? ` (נשארו ${r})` : ''), m(`${q + 1} ${X} ${d} = ${(q + 1) * d}`) + ` — יותר מ-${N}.`, `המנה: ${q}.`],
          };
        }
        case 'roundDiv': {
          const bd = c.rnd(2, 9), d = bd * 10, cq = c.rnd(2, 9), j = c.rnd(0, 2), q = cq * P10(j), N = d * q;
          return {
            type: 'number', answer: q, prompt: `${c.g('חשב', 'חשבי')}: ${m(`${fmt(N)} ${DV} ${d} = ` + slot(0))}`,
            hint: `${c.g('מחק', 'מחקי')} אפס אחד גם מהמחולק וגם מהמחלק — המנה לא משתנה. עכשיו המחלק חד-ספרתי.`,
            solution: [m(`${fmt(N)} ${DV} ${d} = ${fmt(N / 10)} ${DV} ${bd}`), m(`${fmt(N / 10)} ${DV} ${bd} = ${fmt(q)}`)],
          };
        }
        case 'digits': {
          const d = c.rnd(12, 79), N = level === 1 ? c.rnd(Math.max(100, d * 2), 999) : c.rnd(1000, 9999), q = Math.floor(N / d), info = quotDigits(N, d);
          const opts4 = level === 1 ? ['1', '2', '3'] : ['1', '2', '3', '4'];
          return {
            type: 'choice', keep: true, prompt: `${b('בלי לחשב')}: כמה ספרות יהיו במנה של ${m(`${fmt(N)} ${DV} ${d}`)}?`,
            choices: opts4, answer: opts4.indexOf(String(info.digs)),
            hint: `${c.g('השווה', 'השווי')} את ${nDigits(d)} הספרות הראשונות של המחולק למחלק ${d}.`,
            solution: [info.why, `המנה היא ${fmt(q)} — ${info.digs === 1 ? 'ספרה אחת' : info.digs + ' ספרות'}.`],
          };
        }
        case 'digitsWhy': {
          const d = c.rnd(21, 79);
          const mk = (digs, ok) => { for (let t = 0; t < 80; t++) { const N = c.rnd(P10(digs - 1), P10(digs) - 1); if ((quotDigits(N, d).digs === 3) === ok && !(ok === false && quotDigits(N, d).digs < 1)) return N; } return null; };
          const right = mk(c.pick([4, 5]), true);
          const w = []; for (let t = 0; t < 30 && w.length < 3; t++) { const N = mk(c.pick([4, 4, 5]), false); if (N && w.indexOf(N) < 0 && quotDigits(N, d).digs >= 1) w.push(N); }
          return {
            type: 'choice', prompt: `באיזה תרגיל המנה היא מספר ${b('בן 3 ספרות')}?`,
            choices: [right, ...w].map((N) => m(`${fmt(N)} ${DV} ${d}`)), answer: 0,
            hint: `לכל תרגיל ${c.g('בדוק', 'בדקי')} מאיזה מקום מתחילים לחלק: ${c.g('השווה', 'השווי')} את שתי הספרות הראשונות ל-${d}.`,
            solution: [quotDigits(right, d).why, `${m(`${fmt(right)} ${DV} ${d}`)} — המנה ${fmt(Math.floor(right / d))}, 3 ספרות.`],
          };
        }
        case 'estimate': {
          const d = c.rnd(12, 79);
          let N, q;
          do { N = c.rnd(level === 2 ? 1000 : 10000, level === 2 ? 9999 : 99999); q = Math.floor(N / d); } while (q < 10 || q % P10(nDigits(q) - 1) === 0);
          return rangeQ(c, N, d);
        }
        case 'checkTF': {
          const f = c.friend(), d = c.rnd(13, 59), q = c.rnd(21, 199), r = c.rnd(0, d - 1), N = q * d + r;
          const mode = c.rnd(0, 2), [sq, sr] = mode === 0 ? [q, r] : mode === 1 ? [q - 1, r + d] : [Math.floor(q / 10) || q + 10, r];
          const ok = sq === q && sr === r;
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('פתר', 'פתרה')}: ${m(`${fmt(N)} ${DV} ${d} = ${fmt(sq)}`)}${sr ? ` ושארית ${sr}` : ''}.<br>נכון או לא נכון: הפתרון נכון?`,
            hint: `${c.g('בדוק', 'בדקי')} שני דברים: שהשארית קטנה מהמחלק, ושמנה × מחלק + שארית = מחולק.`,
            solution: ok ? [`${m(`${fmt(q)} ${X} ${d} + ${r} = ${fmt(N)}`)} והשארית קטנה מ-${d}.`, 'הפתרון נכון.'] : mode === 1 ? [`השארית ${sr} גדולה מהמחלק ${d} — אפשר לחלק עוד.`, `הפתרון הנכון: ${divLine(N, d)}`] : [`${m(`${fmt(sq)} ${X} ${d} + ${sr} = ${fmt(sq * d + sr)}`)} — זה לא ${fmt(N)}.`, `הפתרון הנכון: ${divLine(N, d)}`],
          };
        }
        case 'missDividend': {
          const d = c.rnd(13, 69), q = c.rnd(21, 250), r = c.rnd(1, d - 1);
          return {
            type: 'number', answer: q * d + r, prompt: `${c.g('השלם', 'השלימי')}: ${m(slot(0) + ` ${DV} ${d} = ${q}`)} ושארית ${r}`,
            hint: 'מנה × מחלק + שארית = מחולק.',
            solution: [m(`${q} ${X} ${d} = ${fmt(q * d)}`), m(`${fmt(q * d)} + ${r} = ${fmt(q * d + r)}`)],
          };
        }
        case 'storyShare': case 'storyPack': case 'storyAll': case 'storyMore': {
          let list = PACK_SC.filter((s) => !s.small);
          if (kind === 'storyAll') list = list.filter((s) => s.qAll);
          const sc = c.scene(list), f = c.friend();
          const d = sc.big ? c.rnd(40, 55) : c.rnd(12, level === 1 ? 30 : 48);
          const digs = level === 1 ? 3 : 4, r = kind === 'storyShare' ? 0 : c.rnd(1, d - 1);
          const q = sc.big ? c.rnd(3, 18) : level === 1 ? c.rnd(3, Math.floor((999 - r) / d)) : c.rnd(Math.ceil(1000 / d), Math.floor((9999 - r) / d)), N = q * d + r;
          const base = sc.txt(f, fmt(N), d);
          if (kind === 'storyShare') return {
            type: 'number', answer: q, prompt: `${base}<br>${sc.q1}`,
            hint: `מחלקים ${fmt(N)} לקבוצות של ${d}.${d % 10 ? ` ${c.g('עגל', 'עגלי')} את ${d} לעשרות כדי לנחש.` : ''}`,
            solution: divSol(N, d),
          };
          if (kind === 'storyPack') return {
            type: 'number', answer: [q, r], labels: sc.lab, prompt: `${base}<br>${sc.q2}`,
            hint: `${c.g('חלק', 'חלקי')} את ${fmt(N)} ב-${d}: המנה היא מספר הקבוצות המלאות, והשארית היא מה שנשאר.`,
            solution: divSol(N, d).concat([`${sc.lab[0]}: ${fmt(q)}, ${sc.lab[1]}: ${r}.`]),
          };
          if (kind === 'storyAll') return {
            type: 'number', answer: q + 1, prompt: `${base}<br>${sc.qAll}`,
            hint: `${c.g('חלק', 'חלקי')}, ו${c.g('חשוב', 'חשבי')} מה עושים עם השארית.`,
            solution: [divLine(N, d), `${fmt(q)} מלאים לא מספיקים — צריך עוד אחד בשביל ה-${r} שנשארו.`, m(`${fmt(q)} + 1 = ${fmt(q + 1)}`)],
          };
          return {
            type: 'number', answer: d - r, prompt: `${base}<br>${sc.qMore}`,
            hint: `קודם ${c.g('מצא', 'מצאי')} את השארית. כמה חסר לה כדי להגיע ל-${d}?`,
            solution: [divLine(N, d), m(`${d} − ${r} = ${d - r}`)],
          };
        }
        case 'storyDeal': {
          const sc = c.scene(DEAL_SC), f = c.friend();
          const a = c.rnd(12, 24), b2 = c.rnd(25, 48), pa = c.rnd(3, 9), pb = c.chance(0.2) ? pa : c.pick([pa - 1, pa + 1, pa - 2, pa + 2].filter((x) => x > 1));
          const A = a * pa, B = b2 * pb, ans = pa === pb ? 2 : pa < pb ? 0 : 1;
          const ch = [`בחבילה של ${a}`, `בחבילה של ${b2}`, 'המחיר זהה'];
          return {
            type: 'choice', keep: true, prompt: `${f.name} רוצה לקנות ${sc.u}. יש חבילה של ${a} ${sc.u} ב-${A} ₪, וחבילה של ${b2} ${sc.u} ב-${B} ₪.<br>באיזו חבילה המחיר של ${sc.one} נמוך יותר?`,
            choices: ch, answer: ans,
            hint: `${c.g('חשב', 'חשבי')} לכל חבילה כמה עולה ${sc.one}: מחלקים את המחיר במספר הפריטים.`,
            solution: [m(`${A} ${DV} ${a} = ${pa}`) + ' ₪', m(`${B} ${DV} ${b2} = ${pb}`) + ' ₪', pa === pb ? 'המחיר זהה.' : `${ch[ans]} — ${Math.min(pa, pb)} ₪ ל${sc.one.replace(/ אחד| אחת/, '')}.`],
          };
        }
        case 'storyTwo': {
          if (c.chance(0.5)) {
            const s = c.rnd(24, 96), each = c.rnd(35, 120), T = s * each, Bus = c.rnd(Math.floor(T * 0.3), Math.floor(T * 0.6)), E = T - Bus;
            return {
              type: 'number', answer: each, unit: '₪',
              prompt: `לטיול השנתי יצאו ${s} תלמידים. ההסעה עלתה ${fmt(Bus)} ₪, והכניסה לפארק עלתה ${fmt(E)} ₪ לכל הקבוצה. התלמידים חילקו את התשלום שווה בשווה.<br>כמה שילם כל תלמיד?`,
              hint: `שני שלבים: קודם ${c.g('מצא', 'מצאי')} כמה עלה הטיול כולו, ואז ${c.g('חלק', 'חלקי')} במספר התלמידים.`,
              solution: [m(`${fmt(Bus)} + ${fmt(E)} = ${fmt(T)}`), m(`${fmt(T)} ${DV} ${s} = ${each}`)],
            };
          }
          const sc = c.scene(DEAL_SC), f = c.friend(), d = c.rnd(12, 25), k = c.rnd(12, 40), P = c.rnd(15, 60), N = k * d;
          return {
            type: 'number', answer: k * P, unit: '₪',
            prompt: `${sc.u} ${sc.fem ? 'נמכרות' : 'נמכרים'} בחבילות של ${d}, וכל חבילה עולה ${P} ₪. ${f.name} ${f.g('צריך', 'צריכה')} בדיוק ${fmt(N)} ${sc.u} בשביל הכיתה.<br>כמה ${f.g('ישלם', 'תשלם')} ${f.name}?`,
            hint: `שני שלבים: קודם ${c.g('מצא', 'מצאי')} כמה חבילות צריך (חילוק), ואחר כך כמה הן עולות (כפל).`,
            solution: [`חבילות: ${m(`${fmt(N)} ${DV} ${d} = ${k}`)}`, `מחיר: ${m(`${k} ${X} ${P} = ${fmt(k * P)}`)} ₪`],
          };
        }
      }
    },
  });

  /* ========== כפל וחילוק ========== */
  // סידור בקבוצות שוות: arr = g קבוצות של per; share = N מסודרים ב-g קבוצות; G = שם הקבוצות, P = שם הפריטים, each = "בכל ..."
  const GRP_SC = [
    { tags: ['music'], arr: (g, per) => `באולם הקונצרטים יש ${g} שורות, ובכל שורה ${per} כיסאות`, share: (N, g) => `באולם הקונצרטים יש ${N} כיסאות, מסודרים ב-${g} שורות שוות.`, G: 'שורות', P: 'כיסאות', GG: 'השורות', PP: 'הכיסאות', each: 'בכל שורה' },
    { tags: ['sport'], arr: (g, per) => `ביציע של האצטדיון יש ${g} שורות, ובכל שורה ${per} מושבים`, share: (N, g) => `ביציע של האצטדיון יש ${N} מושבים, מסודרים ב-${g} שורות שוות.`, G: 'שורות', P: 'מושבים', GG: 'השורות', PP: 'המושבים', each: 'בכל שורה' },
    { tags: ['baking'], arr: (g, per) => `במאפייה יש ${g} מגשים, ובכל מגש ${per} עוגיות`, share: (N, g) => `במאפייה יש ${N} עוגיות, מחולקות שווה בשווה ל-${g} מגשים.`, G: 'מגשים', P: 'עוגיות', GG: 'המגשים', PP: 'העוגיות', each: 'בכל מגש' },
    { tags: ['animals'], arr: (g, per) => `בחווה יש ${g} לולים, ובכל לול ${per} תרנגולות`, share: (N, g) => `בחווה יש ${N} תרנגולות, מחולקות שווה בשווה ל-${g} לולים.`, G: 'לולים', P: 'תרנגולות', GG: 'הלולים', PP: 'התרנגולות', each: 'בכל לול' },
    { tags: ['nature'], arr: (g, per) => `במטע יש ${g} שורות, ובכל שורה ${per} עצים`, share: (N, g) => `במטע יש ${N} עצים, נטועים ב-${g} שורות שוות.`, G: 'שורות', P: 'עצים', GG: 'השורות', PP: 'העצים', each: 'בכל שורה' },
    { tags: ['reading'], arr: (g, per) => `בספרייה יש ${g} מדפים, ועל כל מדף ${per} ספרים`, share: (N, g) => `בספרייה יש ${N} ספרים, מסודרים שווה בשווה על ${g} מדפים.`, G: 'מדפים', P: 'ספרים', GG: 'המדפים', PP: 'הספרים', each: 'על כל מדף' },
    { tags: ['art'], arr: (g, per) => `בחדר האומנות יש ${g} קופסאות, ובכל קופסה ${per} צבעים`, share: (N, g) => `בחדר האומנות יש ${N} צבעים, מחולקים שווה בשווה ל-${g} קופסאות.`, G: 'קופסאות', P: 'צבעים', GG: 'הקופסאות', PP: 'הצבעים', each: 'בכל קופסה' },
    { tags: ['games'], arr: (g, per) => `במשחק יש ${g} עולמות, ובכל עולם ${per} יהלומים`, share: (N, g) => `במשחק יש ${N} יהלומים, מחולקים שווה בשווה בין ${g} עולמות.`, G: 'עולמות', P: 'יהלומים', GG: 'העולמות', PP: 'היהלומים', each: 'בכל עולם' },
    { tags: ['space'], arr: (g, per) => `בתחנת החלל יש ${g} מחסנים, ובכל מחסן ${per} ארגזי מזון`, share: (N, g) => `בתחנת החלל יש ${N} ארגזי מזון, מחולקים שווה בשווה בין ${g} מחסנים.`, G: 'מחסנים', P: 'ארגזי מזון', GG: 'המחסנים', PP: 'ארגזי המזון', each: 'בכל מחסן' },
    { tags: ['tech'], arr: (g, per) => `במפעל יש ${g} פסי ייצור, ובכל פס ${per} רובוטים`, share: (N, g) => `במפעל יש ${N} רובוטים, מחולקים שווה בשווה בין ${g} פסי ייצור.`, G: 'פסי ייצור', P: 'רובוטים', GG: 'פסי הייצור', PP: 'הרובוטים', each: 'בכל פס' },
    { tags: ['kpop'], arr: (g, per) => `באלבום של מועדון המעריצים יש ${g} דפים, ובכל דף ${per} פוטוקארדים`, share: (N, g) => `במועדון המעריצים יש ${N} פוטוקארדים, מסודרים שווה בשווה ב-${g} דפים של אלבום.`, G: 'דפים', P: 'פוטוקארדים', GG: 'הדפים', PP: 'הפוטוקארדים', each: 'בכל דף' },
    { tags: ['magic'], arr: (g, per) => `בבית הספר לקוסמים יש ${g} ארונות, ובכל ארון ${per} שרביטים`, share: (N, g) => `בבית הספר לקוסמים יש ${N} שרביטים, מחולקים שווה בשווה ל-${g} ארונות.`, G: 'ארונות', P: 'שרביטים', GG: 'הארונות', PP: 'השרביטים', each: 'בכל ארון' },
    { tags: ['squishy'], arr: (g, per) => `בחנות הסקווישים יש ${g} מדפים, ועל כל מדף ${per} סקווישים`, share: (N, g) => `בחנות הסקווישים יש ${N} סקווישים, מסודרים שווה בשווה על ${g} מדפים.`, G: 'מדפים', P: 'סקווישים', GG: 'המדפים', PP: 'הסקווישים', each: 'על כל מדף' },
  ];
  const timesW = (k) => `פי ${k}`;

  HM.lesson({
    id: 'n-muldiv',
    learn: (c) => [
      {
        title: 'מה קורה למכפלה?',
        html: `${c.name} ${c.g('קנה', 'קנתה')} 6 חבילות, ובכל חבילה 8 מדבקות: ${m(`6 ${X} 8 = 48`)}.<br>אם ${c.g('יקנה', 'תקנה')} ${b('פי 2')} חבילות — ${m(`12 ${X} 8 = 96`)} — גם המכפלה תגדל ${b('פי 2')}.<br>כשגורם אחד גדל פי מספר מסוים, המכפלה גדלה פי אותו מספר.`,
        visual: V.dots(6, 8),
      },
      {
        title: 'פי 2 ועוד חצי — אותה מכפלה',
        html: `אם גורם אחד גדל ${b('פי 2')} והגורם השני קטן ${b('פי 2')}, המכפלה ${b('לא משתנה')}. זה עוזר לחשב בראש!`,
        visual: V.table(['תרגיל', 'מכפלה'], [[m(`25 ${X} 48`), '1,200'], [m(`50 ${X} 24`), '1,200'], [m(`100 ${X} 12`), '1,200']]),
        steps: [`${m(`25 ${X} 48`)} נראה קשה.`, `נכפול את 25 ב-2 ונחלק את 48 ב-2: ${m(`50 ${X} 24`)}.`, `שוב: ${m(`100 ${X} 12 = 1,200`)}.`],
      },
      {
        title: 'מה קורה למנה?',
        html: `• המחולק גדל פי k ← המנה ${b('גדלה')} פי k.<br>• המחלק גדל פי k ← המנה ${b('קטנה')} פי k (מחלקים ליותר חלקים, כל חלק קטן).<br>• שניהם גדלים (או קטנים) פי אותו מספר ← המנה ${b('לא משתנה')}.`,
        visual: V.table(['תרגיל', 'מנה'], [[m(`60 ${DV} 2`), '30'], [m(`120 ${DV} 2`), '60'], [m(`120 ${DV} 4`), '30'], [m(`600 ${DV} 20`), '30']]),
      },
      {
        title: 'משפחת תרגילים',
        html: `כפל וחילוק הם "פעולות הפוכות". משלושה מספרים בונים ארבעה תרגילים:<br>${m(`6 ${X} 8 = 48`)}, ${m(`8 ${X} 6 = 48`)}, ${m(`48 ${DV} 6 = 8`)}, ${m(`48 ${DV} 8 = 6`)}.<br>כך מוצאים מספר חסר: ${m(`7 ${X} ${HM.box()} = 392`)} ← ${m(`392 ${DV} 7 = 56`)}.<br>${m(`${HM.box()} ${DV} 8 = 125`)} ← ${m(`125 ${X} 8 = 1,000`)}.`,
        quiz: {
          type: 'number', answer: 35, prompt: `${c.g('השלם', 'השלימי')}: ${m(`840 ${DV} ` + slot(0) + ' = 24')}`,
          hint: 'חסר המחלק. מחלקים את המחולק במנה.',
          solution: [m(`840 ${DV} 24 = 35`), `בדיקה: ${m(`24 ${X} 35 = 840`)} ✔`],
        },
      },
      {
        title: 'מספר חסר באי-שוויון',
        html: `מהו המספר השלם הגדול ביותר שמתאים ל-${m(`8 ${X} ${HM.box()} &lt; 60`)}?<br>${m(`8 ${X} 7 = 56`)} — קטן מ-60 ✔. ${m(`8 ${X} 8 = 64`)} — גדול מ-60 ✘.<br>לכן התשובה היא ${b('7')}.`,
        quiz: {
          type: 'number', answer: 9, prompt: `מהו המספר השלם ${b('הקטן ביותר')} שמתאים? ${m(`${HM.box()} ${X} 6 &gt; 50`)}`,
          hint: `${c.g('חפש', 'חפשי')} את הכפולות של 6 שקרובות ל-50.`,
          solution: [m(`8 ${X} 6 = 48`) + ' — לא גדול מ-50.', m(`9 ${X} 6 = 54`) + ' — גדול מ-50 ✔'],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['factChange', 'missFactor', 'family', 'divChange', 'cmp', 'storyFamily', 'storyDouble', 'storyFamily']
        : level === 2 ? ['factChange', 'divChange', 'cmp', 'missDivisor', 'missDividend', 'ineq', 'storyDouble', 'storyDivChange', 'storyFamily', 'storyDivChange']
        : ['divChange', 'cmp', 'tfRules', 'ineq', 'missEqMul', 'missEqMul', 'storyDivChange', 'storyDouble', 'storyMoreRows', 'storyMoreRows'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'factChange': {
          const a = c.rnd(12, 48), bb = c.pick([2, 4, 6, 8]) * (level === 1 ? 1 : c.pick([1, 3])), p = a * bb;
          let a2 = a, b2 = bb, mul = 1, sol;
          if (level === 1) { const k = c.pick([2, 3, 10]); if (c.chance(0.5)) a2 = a * k; else b2 = bb * k; mul = k; sol = [`גורם אחד גדל ${timesW(k)} ← המכפלה גדלה ${timesW(k)}.`, m(`${fmt(p)} ${X} ${k} = ${fmt(p * k)}`)]; }
          else {
            const r = c.rnd(0, 1);
            if (r === 0) { a2 = a * 2; b2 = bb / 2; sol = ['גורם אחד גדל פי 2 והשני קטן פי 2 ← המכפלה לא משתנה.', `${fmt(p)}`]; }
            else { const k = c.pick([2, 3, 4]); a2 = a * k; b2 = bb * 2; mul = 2 * k; sol = [`גורם אחד גדל ${timesW(k)} והשני ${timesW(2)} ← המכפלה גדלה ${timesW(m(`${k} ${X} 2 = ${2 * k}`))}.`, m(`${fmt(p)} ${X} ${2 * k} = ${fmt(p * 2 * k)}`)]; }
          }
          return {
            type: 'number', answer: a2 * b2,
            prompt: `ידוע ש-${m(`${a} ${X} ${bb} = ${fmt(p)}`)}.<br>${c.g('השלם', 'השלימי')} בלי לחשב מההתחלה: ${m(`${fmt(a2)} ${X} ${fmt(b2)} = ` + slot(0))}`,
            hint: `${c.g('השווה', 'השווי')} כל גורם לגורם המקורי: פי כמה הוא גדל או קטן?`,
            solution: sol,
          };
        }
        case 'divChange': {
          const d = c.rnd(3, 12), q = c.pick([12, 16, 18, 24, 30, 36, 40, 48, 60]), N = q * d;
          let N2 = N, d2 = d, ans, why;
          const r = level === 1 ? 0 : level === 2 ? c.rnd(1, 2) : c.rnd(2, 4);
          const k = r === 1 && q % 3 ? 2 : c.pick([2, 3]);
          if (r === 0) { N2 = N * k; ans = q * k; why = `המחולק גדל ${timesW(k)} ← המנה גדלה ${timesW(k)}.`; }
          else if (r === 1) { d2 = d * k; ans = q / k; why = `המחלק גדל ${timesW(k)} ← המנה קטנה ${timesW(k)}.`; }
          else if (r === 2) { N2 = N * k; d2 = d * k; ans = q; why = `המחולק והמחלק גדלו שניהם ${timesW(k)} ← המנה לא משתנה.`; }
          else if (r === 3) { N2 = N * 2 * k; d2 = d * k; ans = q * 2; why = `המחולק גדל ${timesW(2 * k)} והמחלק ${timesW(k)} ← המנה גדלה פי 2.`; }
          else { N2 = N * k; d2 = d * 2 * k; ans = q / 2; why = `המחולק גדל ${timesW(k)} והמחלק ${timesW(2 * k)} ← המנה קטנה פי 2.`; }
          return {
            type: 'number', answer: ans,
            prompt: `ידוע ש-${m(`${fmt(N)} ${DV} ${d} = ${q}`)}.<br>${c.g('השלם', 'השלימי')} בלי לחשב מההתחלה: ${m(`${fmt(N2)} ${DV} ${d2} = ` + slot(0))}`,
            hint: `פי כמה השתנה המחולק? פי כמה השתנה המחלק? ${c.g('זכור', 'זכרי')}: מחלק גדול יותר ← מנה קטנה יותר.`,
            solution: [why, `התשובה: ${fmt(ans)}`],
          };
        }
        case 'cmp': {
          const isDiv = level > 1 && c.chance(0.6);
          let left, right, lv, rv, why;
          if (!isDiv) {
            const a = c.rnd(12, 48) * 2, bb = c.rnd(3, 9) * 2;
            const F = c.pick([[a * 2, bb / 2, 'גורם אחד גדל פי 2 והשני קטן פי 2 — המכפלה לא משתנה.'], [a * 2, bb, 'גורם אחד גדל פי 2 — המכפלה גדלה.'], [a / 2, bb, 'גורם אחד קטן פי 2 — המכפלה קטנה.'], [a * 2, bb / 2 + 1, 'אחרי הכפלה פי 2 וחילוק ב-2 המכפלה הייתה שווה, אבל הגורם השני גדול ב-1 — המכפלה גדלה.']]);
            left = `${a} ${X} ${bb}`; right = `${F[0]} ${X} ${F[1]}`; lv = a * bb; rv = F[0] * F[1]; why = F[2];
          } else {
            const d = c.rnd(3, 9) * 2, q = c.rnd(6, 24) * 2, N = d * q;
            const F = c.pick([[N * 2, d * 2, 'המחולק והמחלק גדלו פי 2 — המנה לא משתנה.'], [N, d * 2, 'המחלק גדל פי 2 — המנה קטנה.'], [N * 2, d, 'המחולק גדל פי 2 — המנה גדלה.'], [N / 2, d / 2, 'המחולק והמחלק קטנו פי 2 — המנה לא משתנה.'], [N, d / 2, 'המחלק קטן פי 2 — המנה גדלה.']]);
            left = `${fmt(N)} ${DV} ${d}`; right = `${fmt(F[0])} ${DV} ${F[1]}`; lv = q; rv = F[0] / F[1]; why = F[2];
          }
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים (&gt;, &lt; או =) ${b('בלי לחשב')}:`,
            left, right, lv, rv, answer: cmpAns(lv, rv),
            hint: `${c.g('השווה', 'השווי')} את המספרים בשני התרגילים: פי כמה כל אחד גדל או קטן?`,
            solution: [why, m(`${left} ${sym(lv, rv)} ${right}`)],
          };
        }
        case 'missFactor': {
          const a = c.rnd(3, 9), x = c.rnd(12, 99), N = a * x, first = c.chance(0.5);
          return {
            type: 'number', answer: x, prompt: `${c.g('השלם', 'השלימי')}: ${m((first ? slot(0) + ` ${X} ${a}` : `${a} ${X} ` + slot(0)) + ` = ${N}`)}`,
            hint: `חסר גורם. ${c.g('היעזר', 'היעזרי')} בתרגיל חילוק מאותה משפחה.`,
            solution: [m(`${N} ${DV} ${a} = ${x}`), `בדיקה: ${m(`${a} ${X} ${x} = ${N}`)} ✔`],
          };
        }
        case 'missDivisor': case 'missDividend': {
          const d = c.rnd(12, 48), q = c.rnd(12, 85), N = d * q;
          if (kind === 'missDivisor') return {
            type: 'number', answer: d, prompt: `${c.g('השלם', 'השלימי')}: ${m(`${fmt(N)} ${DV} ` + slot(0) + ` = ${q}`)}`,
            hint: 'חסר המחלק. מחולק : מנה = מחלק.',
            solution: [m(`${fmt(N)} ${DV} ${q} = ${d}`), `בדיקה: ${m(`${q} ${X} ${d} = ${fmt(N)}`)} ✔`],
          };
          return {
            type: 'number', answer: N, prompt: `${c.g('השלם', 'השלימי')}: ${m(slot(0) + ` ${DV} ${d} = ${q}`)}`,
            hint: 'חסר המחולק. מנה × מחלק = מחולק.',
            solution: [m(`${q} ${X} ${d} = ${fmt(N)}`)],
          };
        }
        case 'family': {
          const a = c.rnd(3, 9), x = c.rnd(24, 98), N = a * x, r = c.rnd(0, 2);
          const F = [
            [`${HM.box()} ${X} ${a} = ${N}`, `${N} ${DV} ${a}`, [`${N} ${X} ${a}`, `${N} − ${a}`, `${a} ${DV} ${N}`], `חסר גורם — מחלקים את המכפלה בגורם הידוע.`],
            [`${N} ${DV} ${HM.box()} = ${a}`, `${N} ${DV} ${a}`, [`${N} ${X} ${a}`, `${a} ${DV} ${N}`, `${N} − ${a}`], `חסר המחלק — מחלקים את המחולק במנה.`],
            [`${HM.box()} ${DV} ${a} = ${x}`, `${x} ${X} ${a}`, [`${x} ${DV} ${a}`, `${a} ${DV} ${x}`, `${x} + ${a}`], `חסר המחולק — כופלים את המנה במחלק.`],
          ][r];
          return {
            type: 'choice', prompt: `איזה תרגיל עוזר למצוא את המספר החסר? ${m(F[0])}`,
            choices: [m(F[1]), ...F[2].map(m)], answer: 0,
            hint: 'כפל וחילוק הם פעולות הפוכות. ' + c.g('חשוב', 'חשבי') + ': איזה תרגיל מאותה משפחה מבודד את המספר החסר?',
            solution: [F[3], `${m(F[1])} = ${r === 2 ? N : r === 1 ? x : x}`],
          };
        }
        case 'ineq': {
          const big = level === 3, a = big ? c.rnd(13, 48) : c.rnd(3, 9);
          let n = big ? c.rnd(300, 2000) : c.rnd(25, 95); if (n % a === 0) n += 1;
          const k = Math.floor(n / a), maxQ = c.chance(0.5);
          return {
            type: 'number', answer: maxQ ? k : k + 1,
            prompt: `מהו המספר השלם ${b(maxQ ? 'הגדול ביותר' : 'הקטן ביותר')} שמתאים? ${m(maxQ ? `${a} ${X} ${HM.box()} &lt; ${fmt(n)}` : `${HM.box()} ${X} ${a} &gt; ${fmt(n)}`)}`,
            hint: `${c.g('חלק', 'חלקי')} את ${fmt(n)} ב-${a} כדי למצוא כפולות של ${a} שקרובות ל-${fmt(n)}.`,
            solution: [m(`${a} ${X} ${k} = ${fmt(a * k)}`) + ` — קטן מ-${fmt(n)}.`, m(`${a} ${X} ${k + 1} = ${fmt(a * (k + 1))}`) + ` — גדול מ-${fmt(n)}.`, `התשובה: ${maxQ ? k : k + 1}`],
          };
        }
        case 'missEqMul': {
          const r = c.rnd(0, 2);
          let txt, ans, sol;
          if (r === 0) { const k = c.pick([2, 4, 5]), a = c.rnd(3, 12) * k, bb = c.pick([15, 25, 35, 45]); txt = `${a} ${X} ${bb} = ${a / k} ${X} ` + slot(0); ans = bb * k; sol = [`${a} קטן ${timesW(k)} ונהיה ${a / k}.`, `כדי שהמכפלה לא תשתנה, ${bb} צריך לגדול ${timesW(k)}: ${m(`${bb} ${X} ${k} = ${ans}`)}`]; }
          else if (r === 1) { const k = c.pick([2, 3]), a = c.rnd(12, 48), bb = c.rnd(3, 9) * k * 2; txt = `${a} ${X} ${bb} = ` + slot(0) + ` ${X} ${bb / k}`; ans = a * k; sol = [`${bb} קטן ${timesW(k)} ונהיה ${bb / k}.`, `לכן הגורם השני צריך לגדול ${timesW(k)}: ${m(`${a} ${X} ${k} = ${ans}`)}`]; }
          else { const k = c.pick([2, 3, 4]), d = c.rnd(3, 9) * k, q = c.rnd(12, 40), N = d * q; txt = `${fmt(N)} ${DV} ${d} = ` + slot(0) + ` ${DV} ${d / k}`; ans = N / k; sol = [`המחלק קטן ${timesW(k)} (מ-${d} ל-${d / k}).`, `כדי שהמנה לא תשתנה, גם המחולק צריך לקטון ${timesW(k)}: ${m(`${fmt(N)} ${DV} ${k} = ${fmt(ans)}`)}`]; }
          return {
            type: 'number', answer: ans, prompt: `${c.g('השלם', 'השלימי')} בלי לחשב את התרגילים: ${m(txt)}`,
            hint: `${c.g('השווה', 'השווי')} בין המספרים בשני הצדדים: פי כמה השתנה כל אחד?`,
            solution: sol,
          };
        }
        case 'tfRules': {
          const S = c.pick([
            ['אם מגדילים גורם אחד פי 2 ואת הגורם השני פי 3, המכפלה גדלה פי 5.', false, `המכפלה גדלה ${timesW(m(`2 ${X} 3 = 6`))}. למשל: ${m(`4 ${X} 5 = 20`)}, ${m(`8 ${X} 15 = 120`)}.`],
            ['אם מגדילים את המחולק פי 2 וגם את המחלק פי 2, המנה לא משתנה.', true, `למשל: ${m(`12 ${DV} 3 = 4`)} וגם ${m(`24 ${DV} 6 = 4`)}.`],
            ['אם מגדילים את המחלק פי 3, המנה גדלה פי 3.', false, `המנה קטנה פי 3. למשל: ${m(`36 ${DV} 2 = 18`)}, אבל ${m(`36 ${DV} 6 = 6`)}.`],
            ['אם מקטינים את המחולק פי 4, המנה קטנה פי 4.', true, `למשל: ${m(`80 ${DV} 5 = 16`)}, ${m(`20 ${DV} 5 = 4`)}.`],
            ['אם מגדילים גורם אחד פי 10 ומקטינים את הגורם השני פי 10, המכפלה לא משתנה.', true, `למשל: ${m(`30 ${X} 40 = 1,200`)} וגם ${m(`300 ${X} 4 = 1,200`)}.`],
            ['אם מגדילים גורם אחד ב-10, המכפלה גדלה ב-10.', false, `המכפלה גדלה ב-10 פעמים הגורם השני. למשל: ${m(`3 ${X} 5 = 15`)}, ${m(`13 ${X} 5 = 65`)} — גדלה ב-50.`],
          ]);
          return {
            type: 'tf', answer: S[1], prompt: `נכון או לא נכון? ${S[0]}`,
            hint: `${c.g('נסה', 'נסי')} את הטענה על תרגיל קטן משלך ו${c.g('בדוק', 'בדקי')}.`,
            solution: [S[1] ? 'נכון.' : 'לא נכון.', S[2]],
          };
        }
        case 'storyFamily': {
          const sc = c.scene(GRP_SC), g = level === 1 ? c.rnd(3, 9) : c.rnd(12, 36), per = level === 1 ? c.rnd(12, 60) : c.rnd(14, 48), N = g * per;
          return {
            type: 'number', answer: per, prompt: `${sc.share(fmt(N), g)}<br>כמה ${sc.P} יש ${sc.each}?`,
            hint: `ידוע הכול (${fmt(N)}) וידוע מספר ${sc.GG}. חסר גורם — ${c.g('היעזר', 'היעזרי')} בחילוק.`,
            solution: [m(`${fmt(N)} ${DV} ${g} = ${per}`), `בדיקה: ${m(`${g} ${X} ${per} = ${fmt(N)}`)} ✔`],
          };
        }
        case 'storyDouble': {
          const sc = c.scene(GRP_SC), g = level === 1 ? c.rnd(3, 9) * 2 : c.rnd(6, 20) * 2, per = level === 1 ? c.rnd(6, 25) * 2 : c.rnd(8, 30) * 2, p = g * per;
          const r = level === 1 ? 0 : level === 2 ? c.rnd(0, 1) : c.rnd(1, 2);
          const k = c.pick([2, 3]);
          const F = [
            [`מספר ${sc.GG} גדל ${timesW(k)}, ומספר ${sc.PP} ${sc.each} לא השתנה.`, p * k, [`גורם אחד גדל ${timesW(k)} ← המכפלה גדלה ${timesW(k)}.`, m(`${fmt(p)} ${X} ${k} = ${fmt(p * k)}`)]],
            [`מספר ${sc.GG} גדל פי 2, ומספר ${sc.PP} ${sc.each} קטן פי 2.`, p, ['גורם אחד גדל פי 2 והשני קטן פי 2 ← המכפלה לא משתנה.', `${fmt(p)}`]],
            [`מספר ${sc.GG} גדל ${timesW(k)}, וגם מספר ${sc.PP} ${sc.each} גדל פי 2.`, p * k * 2, [`המכפלה גדלה ${timesW(m(`${k} ${X} 2 = ${2 * k}`))}.`, m(`${fmt(p)} ${X} ${2 * k} = ${fmt(p * 2 * k)}`)]],
          ][r];
          return {
            type: 'number', answer: F[1], prompt: `${sc.arr(g, per)} — בסך הכול ${fmt(p)} ${sc.P}. ${F[0]}<br>כמה ${sc.P} יש עכשיו בסך הכול?`,
            hint: `אין צורך לחשב מההתחלה: ${c.g('חשוב', 'חשבי')} פי כמה השתנה כל גורם.`,
            solution: F[2],
          };
        }
        case 'storyDivChange': {
          const sc = c.scene(GRP_SC), g = c.rnd(3, 12) * 2, per = c.rnd(6, 24) * 6, N = g * per;
          const r = level === 2 ? c.rnd(0, 1) : c.rnd(1, 3);
          const F = [
            [`מספר ${sc.PP} גדל פי 2, ומספר ${sc.GG} לא השתנה.`, per * 2, 'המחולק גדל פי 2 ← המנה גדלה פי 2.'],
            [`מספר ${sc.GG} גדל פי 2, ומספר ${sc.PP} לא השתנה.`, per / 2, 'המחלק גדל פי 2 ← המנה קטנה פי 2.'],
            [`מספר ${sc.PP} גדל פי 3, וגם מספר ${sc.GG} גדל פי 3.`, per, 'המחולק והמחלק גדלו פי אותו מספר ← המנה לא משתנה.'],
            [`מספר ${sc.PP} גדל פי 2, ומספר ${sc.GG} קטן פי 2.`, per * 4, `המחולק גדל פי 2 (המנה גדלה פי 2), והמחלק קטן פי 2 (המנה גדלה שוב פי 2) ← בסך הכול פי 4.`],
          ][r];
          return {
            type: 'number', answer: F[1], prompt: `${sc.share(fmt(N), g)} ${sc.each} יש ${per} ${sc.P}.<br>${F[0]} את ${sc.PP} מסדרים שוב שווה בשווה. כמה ${sc.P} יהיו ${sc.each}?`,
            hint: `מספר ${sc.PP} הוא המחולק, ומספר ${sc.GG} הוא המחלק. מה קורה למנה?`,
            solution: [F[2], `התשובה: ${F[1]}`],
          };
        }
        case 'storyMoreRows': {
          const sc = c.scene(GRP_SC), g = c.rnd(8, 24), per = c.rnd(12, 36), extra = c.rnd(3, 12), N = (g + extra) * per;
          return {
            type: 'number', answer: extra, prompt: `${sc.arr(g, per)}. צריך שיהיו בסך הכול ${fmt(N)} ${sc.P}, ${sc.each} אותו מספר כמו עכשיו.<br>כמה ${sc.G} צריך להוסיף?`,
            hint: `שלושה שלבים: כמה יש עכשיו (כפל), כמה חסר (חיסור), ולכמה ${sc.G} זה מתחלק (חילוק).`,
            solution: [`עכשיו: ${m(`${g} ${X} ${per} = ${fmt(g * per)}`)}`, `חסרים: ${m(`${fmt(N)} − ${fmt(g * per)} = ${fmt(extra * per)}`)}`, `${m(`${fmt(extra * per)} ${DV} ${per} = ${extra}`)}`],
          };
        }
      }
    },
  });

  /* ========== סדר פעולות החשבון וסוגריים ========== */
  const TOK = (str) => String(str).replace(/,/g, '').match(/\d+|[+−×:()]/g).map((x) => (/\d/.test(x) ? +x : x));
  const showT = (t) => t.map((x) => (typeof x === 'number' ? fmt(x) : x)).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  // הפעולה הבאה לפי סדר הפעולות: אינדקס הסימן בתוך מערך האסימונים
  function nextOp(t) {
    const close = t.indexOf(')'), open = close >= 0 ? t.lastIndexOf('(', close) : -1;
    const lo = close >= 0 ? open + 1 : 0, hi = close >= 0 ? close : t.length;
    for (let k = lo; k < hi; k++) if (t[k] === X || t[k] === DV) return k;
    for (let k = lo; k < hi; k++) if (t[k] === '+' || t[k] === MI) return k;
    return -1;
  }
  // שלבי חישוב (מחרוזות). null אם יש תוצאת ביניים לא שלמה או שלילית
  function evalSteps(str) {
    const t = TOK(str), steps = [];
    for (let guard = 0; t.length > 1 && guard < 20; guard++) {
      const i = nextOp(t);
      if (i < 0) return null;
      const a = t[i - 1], c2 = t[i + 1], o = t[i];
      const v = o === X ? a * c2 : o === DV ? a / c2 : o === '+' ? a + c2 : a - c2;
      if (!isFinite(v) || v < 0 || Math.floor(v) !== v) return null;
      t.splice(i - 1, 3, v);
      if (t[i - 2] === '(' && t[i] === ')') { t.splice(i, 1); t.splice(i - 2, 1); }
      steps.push(showT(t));
    }
    return steps;
  }
  const valOf = (str) => { const s = evalSteps(str); return s ? +s[s.length - 1].replace(/,/g, '') : NaN; };
  const stepSol = (str) => { const s = evalSteps(str); return s.map((x, i) => m((i === 0 ? str + ' = ' : '= ') + x)); };
  // סיפורים עם ביטוי: make(c, f, level) => {txt, ex, wr[], unit?}
  const R = (lv, a, b2, c3) => (lv === 1 ? HM.rnd(a[0], a[1]) : lv === 2 ? HM.rnd(b2[0], b2[1]) : HM.rnd(c3[0], c3[1]));
  const EXPR_SC = [
    { tags: ['reading', 'art'], make: (c, f, lv) => { const a = R(lv, [2, 5], [3, 9], [6, 15]), p = R(lv, [3, 9], [6, 15], [12, 28]), q = R(lv, [2, 9], [5, 19], [8, 35]); return { txt: `${f.name} ${f.g('קנה', 'קנתה')} ${a} מחברות, ${p} ₪ כל מחברת, ועוד עט ב-${q} ₪.`, q: `כמה ${f.g('שילם', 'שילמה')} בסך הכול?`, ex: `${q} + ${a} ${X} ${p}`, wr: [`(${q} + ${a}) ${X} ${p}`, `${a} + ${p} + ${q}`, `${a} ${X} (${p} + ${q})`], unit: '₪' }; } },
    { tags: ['sport'], make: (c, f, lv) => { const a = R(lv, [5, 9], [11, 18], [14, 24]), p = R(lv, [2, 4], [2, 5], [3, 6]), q = R(lv, [3, 9], [6, 15], [10, 30]); return { txt: `בקבוצה של ${f.name} יש ${a} שחקנים. כל שחקן קיבל ${p} בקבוקי מים, והמאמן קיבל עוד ${q} בקבוקים.`, q: 'כמה בקבוקי מים חילקו בסך הכול?', ex: `${a} ${X} ${p} + ${q}`, wr: [`${a} ${X} (${p} + ${q})`, `${a} + ${p} + ${q}`, `(${a} + ${q}) ${X} ${p}`] }; } },
    { tags: ['baking'], paren: true, make: (c, f, lv) => { const k = R(lv, [2, 4], [3, 6], [4, 9]), m1 = R(lv, [3, 8], [6, 15], [12, 30]), a = k * HM.rnd(Math.max(1, Math.ceil(m1 * 0.3)), Math.max(1, Math.floor(m1 * 0.7))), b2 = k * m1 - a; return { txt: `${f.name} ${f.g('אפה', 'אפתה')} ${a} עוגיות שוקולד ו-${b2} עוגיות וניל, ${f.g('וחילק', 'וחילקה')} את כולן שווה בשווה ל-${k} קופסאות.`, q: 'כמה עוגיות יש בכל קופסה?', ex: `(${a} + ${b2}) ${DV} ${k}`, wr: [`${a} + ${b2} ${DV} ${k}`, `${a} ${DV} ${k} + ${b2}`, `(${a} + ${b2}) ${X} ${k}`] }; } },
    { tags: ['squishy'], paren: true, make: (c, f, lv) => { const a = R(lv, [2, 5], [4, 12], [8, 25]), b2 = R(lv, [2, 5], [3, 9], [6, 18]), p = R(lv, [4, 9], [8, 15], [12, 25]); return { txt: `${f.name} ${f.g('קנה', 'קנתה')} ${a} סקווישים בצורת אוכל ו-${b2} סקווישים בצורת חיות. כל סקוויש עלה ${p} ₪.`, q: `כמה ${f.g('שילם', 'שילמה')} בסך הכול?`, ex: `(${a} + ${b2}) ${X} ${p}`, wr: [`${a} + ${b2} ${X} ${p}`, `${a} ${X} ${p} + ${b2}`, `${a} + ${b2} + ${p}`], unit: '₪' }; } },
    { tags: ['kpop'], make: (c, f, lv) => { const n = R(lv, [2, 5], [4, 9], [6, 14]), k = R(lv, [2, 5], [3, 8], [5, 12]), N = n * k + R(lv, [3, 20], [10, 60], [20, 150]); return { txt: `בקופסה של ${f.name} היו ${N} פוטוקארדים. ${f.g('הוא נתן', 'היא נתנה')} ${k} פוטוקארדים לכל אחד מ-${n} חברים במועדון המעריצים.`, q: 'כמה פוטוקארדים נשארו בקופסה?', ex: `${N} − ${k} ${X} ${n}`, wr: [`(${N} − ${k}) ${X} ${n}`, `${N} − ${k} − ${n}`, `${N} − (${k} + ${n})`] }; } },
    { tags: ['magic'], make: (c, f, lv) => { const a = R(lv, [10, 60], [40, 200], [150, 600]), n = R(lv, [2, 6], [4, 9], [6, 15]), k = R(lv, [2, 9], [5, 15], [10, 25]); return { txt: `לבית של ${f.name} בבית הספר לקוסמים היו ${a} נקודות. בשיעור שיקויים כל אחד מ-${n} תלמידי הבית הרוויח ${k} נקודות.`, q: 'כמה נקודות יש עכשיו לבית?', ex: `${a} + ${n} ${X} ${k}`, wr: [`(${a} + ${n}) ${X} ${k}`, `${a} + ${n} + ${k}`, `${a} ${X} ${n} + ${k}`] }; } },
    { tags: ['games'], make: (c, f, lv) => { const n = R(lv, [3, 6], [4, 9], [6, 15]), a = R(lv, [10, 50], [20, 90], [50, 250]), q = R(lv, [3, 9], [10, 40], [20, 120]); return { txt: `${f.name} ${f.g('צבר', 'צברה')} ${a} נקודות בכל אחד מ-${n} שלבים, ואחר כך ${f.g('איבד', 'איבדה')} ${q} נקודות בשלב הבונוס.`, q: `כמה נקודות יש ל${f.name} עכשיו?`, ex: `${n} ${X} ${a} − ${q}`, wr: [`${n} ${X} (${a} − ${q})`, `${n} + ${a} − ${q}`, `(${n} − ${q}) ${X} ${a}`] }; } },
    { tags: ['nature'], paren: true, make: (c, f, lv) => { const n = R(lv, [3, 9], [8, 25], [20, 45]), a = R(lv, [2, 3], [2, 4], [2, 5]), b2 = R(lv, [2, 4], [2, 5], [3, 6]); return { txt: `לטיול יצאו ${n} ילדים. כל ילד הביא ${a} בקבוקי מים ו-${b2} כריכים.`, q: 'כמה בקבוקים וכריכים הביאו כל הילדים ביחד?', ex: `${n} ${X} (${a} + ${b2})`, wr: [`${n} ${X} ${a} + ${b2}`, `${n} + ${a} + ${b2}`, `(${n} + ${a}) ${X} ${b2}`] }; } },
    { tags: ['music'], make: (c, f, lv) => { const r = R(lv, [3, 8], [8, 20], [15, 40]), s = R(lv, [5, 9], [10, 25], [18, 32]), q = R(lv, [3, 9], [10, 30], [20, 60]); return { txt: `באולם המופעים יש ${r} שורות, ובכל שורה ${s} כיסאות. ליד הבמה הוסיפו עוד ${q} כיסאות.`, q: 'כמה כיסאות יש באולם עכשיו?', ex: `${r} ${X} ${s} + ${q}`, wr: [`${r} ${X} (${s} + ${q})`, `${r} + ${s} + ${q}`, `(${r} + ${q}) ${X} ${s}`] }; } },
    { tags: ['animals'], make: (c, f, lv) => { const a = R(lv, [2, 4], [3, 6], [4, 9]), p = R(lv, [8, 20], [15, 40], [25, 60]), B = Math.ceil((a * p + 1) / 50) * 50 + R(lv, [0, 0], [0, 50], [50, 100]); return { txt: `${f.name} ${f.g('קנה', 'קנתה')} ${a} שקי מזון לכלבים, ${p} ₪ כל שק, ${f.g('ונתן', 'ונתנה')} למוכר ${B} ₪.`, q: `כמה עודף ${f.g('קיבל', 'קיבלה')} ${f.name}?`, ex: `${B} − ${a} ${X} ${p}`, wr: [`(${B} − ${a}) ${X} ${p}`, `${B} − ${a} − ${p}`, `${B} − (${a} + ${p})`], unit: '₪' }; } },
    { tags: ['tech'], make: (c, f, lv) => { const a = R(lv, [3, 9], [6, 15], [12, 30]), n = R(lv, [3, 6], [5, 12], [10, 25]), q = R(lv, [2, 9], [5, 20], [10, 50]); return { txt: `הרובוט ש${f.g('בנה', 'בנתה')} ${f.name} מרכיב ${a} חלקים בכל דקה. אחרי ${n} דקות התברר ש-${q} מהחלקים פגומים.`, q: 'כמה חלקים תקינים הרכיב הרובוט?', ex: `${n} ${X} ${a} − ${q}`, wr: [`${n} ${X} (${a} − ${q})`, `${n} + ${a} − ${q}`, `(${n} − ${q}) ${X} ${a}`] }; } },
    { tags: ['space'], paren: true, make: (c, f, lv) => { const n = R(lv, [2, 4], [3, 6], [4, 8]), a = R(lv, [2, 3], [2, 4], [3, 5]), b2 = R(lv, [2, 9], [5, 15], [10, 30]); return { txt: `בחללית יש ${n} אסטרונאוטים. כל אחד מהם אוכל ביום ${a} ארוחות ו-${b2} חטיפי אנרגיה.`, q: 'כמה ארוחות וחטיפים אוכלים כל האסטרונאוטים ביחד ביום אחד?', ex: `${n} ${X} (${a} + ${b2})`, wr: [`${n} ${X} ${a} + ${b2}`, `${n} + ${a} + ${b2}`, `(${n} + ${a}) ${X} ${b2}`] }; } },
  ];

  HM.lesson({
    id: 'n-order',
    learn: (c) => [
      {
        title: 'מה מחשבים קודם?',
        html: `${c.name} ${c.g('קנה', 'קנתה')} 3 מחברות, 5 ₪ כל אחת, ועוד עט ב-4 ₪. כמה ${c.g('שילם', 'שילמה')}?<br>התרגיל: ${m(`4 + 3 ${X} 5`)}. אם נחשב משמאל לימין נקבל 35 — אבל זה לא נכון! קודם מחשבים את המחברות (${m(`3 ${X} 5 = 15`)}), ורק אז מוסיפים את העט.`,
        visual: `<div class="big">${m(`4 + 3 ${X} 5 = 4 + 15 = 19`)}</div>`,
      },
      {
        title: 'כללי סדר הפעולות',
        html: `1. ${b('סוגריים')} — מה שבתוך הסוגריים מחשבים ראשון.<br>2. ${b('כפל וחילוק')} — לפי הסדר, משמאל לימין.<br>3. ${b('חיבור וחיסור')} — לפי הסדר, משמאל לימין.<br>(התרגיל כתוב משמאל לימין, כמו מספרים.)`,
        visual: S.svg(320, 150, S.rect(10, 6, 300, 40, { cls: 'f-a', rx: 10 }) + S.text(160, 26, 'קודם: סוגריים', { fs: 17, fw: 700, cls: 't-on' }) + S.rect(30, 54, 260, 40, { cls: 'f-b', rx: 10 }) + S.text(160, 74, 'אחר כך: כפל וחילוק', { fs: 17, fw: 700, cls: 't-on' }) + S.rect(50, 102, 220, 40, { cls: 'f-l s-ink', sw: 1.5, rx: 10 }) + S.text(160, 122, 'בסוף: חיבור וחיסור', { fs: 17, fw: 700 }), { label: 'סדר הפעולות', maxw: 320 }),
      },
      {
        title: 'דוגמה פתורה',
        html: `${c.g('חשב', 'חשבי')}: ${m(`48 ${MI} (6 + 2) ${X} 5`)}`,
        steps: [`סוגריים: ${m('6 + 2 = 8')} ← ${m(`48 ${MI} 8 ${X} 5`)}`, `כפל: ${m(`8 ${X} 5 = 40`)} ← ${m(`48 ${MI} 40`)}`, `חיסור: ${m(`48 ${MI} 40 = 8`)}`, `${c.g('שים לב', 'שימי לב')}: ${m(`36 ${DV} 4 ${X} 3 = 9 ${X} 3 = 27`)} — כפל וחילוק לפי הסדר משמאל, ולא ${m(`36 ${DV} 12`)}.`],
      },
      {
        title: 'חוק החילוף וחוק הקיבוץ',
        html: `${b('חוק החילוף')}: ${m('7 + 5 = 5 + 7')}, ${m(`4 ${X} 9 = 9 ${X} 4`)}.<br>${b('חוק הקיבוץ')}: אפשר לקבץ מחוברים או גורמים כרצוננו: ${m(`25 ${X} 17 ${X} 4 = 17 ${X} (25 ${X} 4) = 17 ${X} 100 = 1,700`)}.<br>זהירות: בחיסור ובחילוק החוקים ${b('לא')} עובדים: ${m(`10 ${MI} 4 ≠ 4 ${MI} 10`)}, ${m(`(24 ${DV} 4) ${DV} 2 = 3`)} אבל ${m(`24 ${DV} (4 ${DV} 2) = 12`)}.`,
        quiz: {
          type: 'number', answer: 645, prompt: `${c.g('חשב', 'חשבי')} בדרך חכמה: ${m('387 + 245 + 13 = ' + slot(0))}`,
          hint: 'אילו שני מחוברים יוצרים יחד מספר עגול?',
          solution: [m('387 + 13 = 400'), m('400 + 245 = 645')],
        },
      },
      {
        title: 'המספרים 0 ו-1',
        html: `• ${m('a + 0 = a')}, ${m(`a ${MI} 0 = a`)}, ${m(`a ${MI} a = 0`)}<br>• ${m(`a ${X} 0 = 0`)}, ${m(`0 ${DV} a = 0`)}<br>• ${m(`a ${X} 1 = a`)}, ${m(`a ${DV} 1 = a`)}, ${m(`a ${DV} a = 1`)}<br>• ${HM.hl('אי אפשר לחלק ב-0!')} אם ${m(`5 ${DV} 0`)} היה שווה מספר כלשהו, אז כפל של המספר הזה ב-0 היה צריך לתת 5 — אבל כל מספר כפול 0 הוא 0.`,
        visual: V.table(['תרגיל', 'תוצאה'], [[m(`37 ${X} 0`), '0'], [m(`0 ${DV} 37`), '0'], [m(`37 ${DV} 1`), '37'], [m(`37 ${DV} 37`), '1'], [m(`37 ${DV} 0`), 'אי אפשר']]),
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['eval', 'zeroOne', 'cmpParen', 'firstOp', 'smart', 'storyExpr', 'storyCalc', 'storyExpr']
        : level === 2 ? ['eval', 'paren', 'zeroOneTF', 'lawTF', 'smart', 'firstOp', 'storyExpr', 'storyCalc', 'storyCalc', 'storyExpr']
        : ['eval', 'makeTrue', 'paren', 'lawTF', 'zeroOneTF', 'cmpParen', 'storyExpr', 'storyCalc', 'storyWrong', 'storyCalc'];
      const kind = c.pick(kinds);
      const r9 = () => c.rnd(2, 9);
      // ביטוי אקראי לפי רמה (נבדק שכל שלבי הביניים שלמים ואי-שליליים)
      function randExpr() {
        for (let t = 0; t < 200; t++) {
          const a = c.rnd(2, 30), bb = r9(), cc = r9(), d = r9(), e = r9(), k = r9();
          const T1 = [`${a} + ${bb} ${X} ${cc}`, `${a} ${X} ${bb} ${MI} ${cc}`, `${bb * cc + k} ${MI} ${bb} ${X} ${cc}`, `${a} + ${cc * k} ${DV} ${cc}`, `${cc * k} ${DV} ${cc} + ${a}`, `${a} ${MI} ${bb} + ${cc}`];
          const T2 = [`(${a} + ${bb}) ${X} ${cc}`, `${a} ${X} (${bb + cc} ${MI} ${cc})`, `(${bb + cc * k} ${MI} ${bb}) ${DV} ${cc}`, `${a + bb + cc + k} ${MI} (${bb} + ${cc})`, `${a} + ${bb} ${X} ${cc} ${MI} ${d}`, `${bb * k * cc} ${DV} ${bb} ${X} ${cc}`, `(${a} + ${bb}) ${X} (${cc + d} ${MI} ${d})`, `${a * 10} ${DV} (${bb} + ${cc})`];
          const T3 = [`${(bb + cc) * d + a * 10} ${MI} (${bb} + ${cc}) ${X} ${d}`, `(${a} + ${bb} ${X} ${cc}) ${DV} ${d}`, `${bb * k} ${DV} ${bb} + ${cc} ${X} ${d} ${MI} ${e}`, `${a} ${X} (${bb} + ${cc}) ${MI} ${d * e} ${DV} ${e}`, `(${a + bb} ${MI} ${bb}) ${X} (${cc} + ${d}) ${DV} ${e}`, `${a * 4} ${MI} ${a * 4} ${DV} (${bb} + ${cc} ${MI} ${cc}) ${X} ${d}`];
          const ex = c.pick(level === 1 ? T1 : level === 2 ? T2 : T3);
          const st = evalSteps(ex);
          if (st && (level === 1 || st.length >= (level === 2 ? 2 : 3)) && valOf(ex) < 5000) return ex;
        }
        return `4 + 3 ${X} 5`;
      }
      switch (kind) {
        case 'eval': {
          const ex = randExpr(), v = valOf(ex);
          return {
            type: 'number', answer: v, prompt: `${c.g('חשב', 'חשבי')}: ${m(ex + ' = ' + slot(0))}`,
            hint: `${c.g('זכור', 'זכרי')} את הסדר: סוגריים, אחר כך כפל וחילוק (משמאל), ובסוף חיבור וחיסור (משמאל).`,
            solution: stepSol(ex),
          };
        }
        case 'firstOp': {
          let ex, t, i;
          const unique = (tt) => { const np = tt.filter((x) => x === '(').length; if (np > 1) return false; if (np === 1) return true; const md = tt.map((x) => (x === X || x === DV ? 'm' : x === '+' || x === MI ? 'a' : '')).filter((x) => x).join(''); return !/m+a+m/.test(md); };
          for (let g = 0; g < 80; g++) { ex = randExpr(); t = TOK(ex); i = nextOp(t); if (t.filter((x) => x === '+' || x === MI || x === X || x === DV).length >= 2 && unique(t) && typeof t[i - 1] === 'number' && typeof t[i + 1] === 'number') break; }
          const L = (k) => (typeof t[k - 1] === 'number' ? t[k - 1] : t[k - 2]), Rr = (k) => (typeof t[k + 1] === 'number' ? t[k + 1] : t[k + 2]);
          const pairs = [];
          t.forEach((x, k) => { if (x === '+' || x === MI || x === X || x === DV) pairs.push(k); });
          const right = `${fmt(L(i))} ${t[i]} ${fmt(Rr(i))}`;
          const others = pairs.filter((k) => k !== i).map((k) => `${fmt(L(k))} ${t[k]} ${fmt(Rr(k))}`).filter((s) => s !== right);
          return {
            type: 'choice', prompt: `איזה חלק של התרגיל מחשבים ${b('ראשון')}? ${m(ex)}`,
            choices: [m(right), ...Array.from(new Set(others)).slice(0, 3).map(m)], answer: 0,
            hint: 'סוגריים קודמים לכול. אחריהם כפל וחילוק, ורק בסוף חיבור וחיסור.',
            solution: stepSol(ex).slice(0, 1).concat([`מתחילים ב-${m(right)}.`]),
          };
        }
        case 'zeroOne': {
          const a = c.rnd(12, 999), F = c.pick([
            [`${a} ${X} ${slot(0)} = 0`, 0, `כל מספר כפול 0 שווה 0.`],
            [`${a} ${X} ${slot(0)} = ${a}`, 1, `כל מספר כפול 1 שווה לעצמו.`],
            [`${a} ${DV} ${slot(0)} = ${a}`, 1, `כל מספר חלקי 1 שווה לעצמו.`],
            [`${slot(0)} ${DV} ${a} = 0`, 0, `0 חלקי כל מספר (חוץ מ-0) שווה 0.`],
            [`${a} ${MI} ${slot(0)} = ${a}`, 0, `מחסרים 0 — המספר לא משתנה.`],
            [`${a} ${MI} ${slot(0)} = 0`, a, `מספר פחות עצמו שווה 0.`],
            [`${a} ${DV} ${slot(0)} = 1`, a, `מספר חלקי עצמו שווה 1.`],
            [`${slot(0)} + ${a} = ${a}`, 0, `מוסיפים 0 — המספר לא משתנה.`],
          ]);
          return {
            type: 'number', answer: F[1], prompt: `${c.g('השלם', 'השלימי')}: ${m(F[0])}`,
            hint: `${c.g('חשוב', 'חשבי')} על התכונות של 0 ו-1 בכל אחת מארבע הפעולות.`,
            solution: [F[2], `התשובה: ${F[1]}`],
          };
        }
        case 'zeroOneTF': {
          const a = c.rnd(12, 999), S2 = c.pick([
            [`${a} ${DV} 0 = 0`, false, 'אי אפשר לחלק ב-0!'], [`0 ${DV} ${a} = 0`, true, '0 חלקי כל מספר (חוץ מ-0) שווה 0.'],
            [`${a} ${X} 0 = ${a}`, false, 'כל מספר כפול 0 שווה 0.'], [`${a} ${DV} 1 = 1`, false, `מספר חלקי 1 שווה לעצמו: ${a}.`],
            [`${a} ${DV} ${a} = 1`, true, 'מספר (חוץ מ-0) חלקי עצמו שווה 1.'], [`${a} ${MI} 0 = 0`, false, `מחסרים 0 — המספר לא משתנה: ${a}.`],
            [`${a} ${X} 1 = ${a} ${DV} 1`, true, `שני הצדדים שווים ${a}.`], [`0 ${X} ${a} = 0 ${DV} ${a}`, true, 'שני הצדדים שווים 0.'],
            [`${a} ${DV} 0 = ${a}`, false, 'אי אפשר לחלק ב-0!'], [`${a} + 0 = ${a} ${X} 0`, false, `${a} + 0 = ${a}, אבל ${a} ${X} 0 = 0.`],
          ]);
          return {
            type: 'tf', answer: S2[1], prompt: `נכון או לא נכון? ${m(S2[0])}`,
            hint: `${c.g('היזכר', 'היזכרי')} בתכונות של 0 ו-1. ${c.g('זכור', 'זכרי')}: מותר לחלק את 0, אבל אסור לחלק ב-0.`,
            solution: [S2[1] ? 'נכון.' : 'לא נכון.', S2[2]],
          };
        }
        case 'lawTF': {
          const a = c.rnd(20, 90), cc = c.rnd(2, 4), bb = cc * c.rnd(2, 4), dv = bb * cc * c.rnd(2, 5);
          const S2 = c.pick([
            [`${a} ${MI} ${bb} = ${bb} ${MI} ${a}`, false, 'בחיסור אין חוק חילוף.'],
            [`${a} + ${bb} + ${cc} = ${a} + (${bb} + ${cc})`, true, 'חוק הקיבוץ בחיבור.'],
            [`(${dv} ${DV} ${bb}) ${DV} ${cc} = ${dv} ${DV} (${bb} ${DV} ${cc})`, false, `בחילוק אין חוק קיבוץ: ${m(`(${dv} ${DV} ${bb}) ${DV} ${cc} = ${dv / bb / cc}`)}, אבל ${m(`${dv} ${DV} (${bb} ${DV} ${cc}) = ${dv / (bb / cc)}`)}.`],
            [`${a} ${X} ${bb} ${X} ${cc} = ${cc} ${X} (${a} ${X} ${bb})`, true, 'חוק החילוף וחוק הקיבוץ בכפל.'],
            [`(${a} ${MI} ${bb}) ${MI} ${cc} = ${a} ${MI} (${bb} ${MI} ${cc})`, false, `בחיסור אין חוק קיבוץ: ${m(`${a - bb - cc} ≠ ${a - bb + cc}`)}.`],
            [`${a} ${X} ${bb} = ${bb} ${X} ${a}`, true, 'חוק החילוף בכפל.'],
            [`${dv} ${DV} ${bb} = ${bb} ${DV} ${dv}`, false, 'בחילוק אין חוק חילוף.'],
          ]);
          return {
            type: 'tf', answer: S2[1], prompt: `נכון או לא נכון? ${m(S2[0])}`,
            hint: `חוק החילוף וחוק הקיבוץ מתקיימים רק בחיבור ובכפל. אם ${c.g('אתה לא בטוח', 'את לא בטוחה')} — ${c.g('חשב', 'חשבי')} את שני הצדדים.`,
            solution: [S2[1] ? 'נכון.' : 'לא נכון.', S2[2]],
          };
        }
        case 'smart': {
          const k = level === 1 ? c.rnd(3, 19) : c.rnd(12, 89);
          const F = c.pick([
            [`25 ${X} ${k} ${X} 4`, 25 * k * 4, [m(`25 ${X} 4 = 100`), m(`100 ${X} ${k} = ${fmt(100 * k)}`)]],
            [`5 ${X} ${k} ${X} 2`, 10 * k, [m(`5 ${X} 2 = 10`), m(`10 ${X} ${k} = ${fmt(10 * k)}`)]],
            [`4 ${X} ${k} ${X} 25`, 100 * k, [m(`4 ${X} 25 = 100`), m(`100 ${X} ${k} = ${fmt(100 * k)}`)]],
            [`50 ${X} ${k} ${X} 2`, 100 * k, [m(`50 ${X} 2 = 100`), m(`100 ${X} ${k} = ${fmt(100 * k)}`)]],
            [`125 ${X} ${k} ${X} 8`, 1000 * k, [m(`125 ${X} 8 = 1,000`), m(`1,000 ${X} ${k} = ${fmt(1000 * k)}`)]],
            (() => { const t = c.rnd(2, 8) * 100, u = c.rnd(11, 89), a = t - u, mid = c.rnd(101, 899); return [`${a} + ${mid} + ${u}`, t + mid, [m(`${a} + ${u} = ${t}`), m(`${t} + ${mid} = ${fmt(t + mid)}`)]]; })(),
          ]);
          return {
            type: 'number', answer: F[1], prompt: `${c.g('חשב', 'חשבי')} בדרך חכמה: ${m(F[0] + ' = ' + slot(0))}`,
            hint: `לפי חוק החילוף וחוק הקיבוץ אפשר לשנות את הסדר. אילו שני מספרים נותנים יחד מספר עגול?`,
            solution: F[2],
          };
        }
        case 'cmpParen': {
          const a = level === 1 ? r9() : c.rnd(12, 40), bb = r9(), cc = r9();
          const F = c.pick([
            [`${a} + ${bb} ${X} ${cc}`, `(${a} + ${bb}) ${X} ${cc}`],
            [`${a} ${X} ${bb} + ${cc}`, `${a} ${X} (${bb} + ${cc})`],
            [`${a} ${X} ${bb} + ${cc}`, `${cc} + ${bb} ${X} ${a}`],
            [`${a} + ${bb} ${X} ${cc}`, `${bb} ${X} ${cc} + ${a}`],
            [`${a * cc + bb} ${MI} ${bb}`, `${a * cc + bb} ${MI} (${bb} ${MI} ${bb - 1})`],
          ]);
          const lv = valOf(F[0]), rv = valOf(F[1]);
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: F[0], right: F[1], lv, rv, answer: cmpAns(lv, rv),
            hint: `${c.g('חשב', 'חשבי')} כל צד לפי סדר הפעולות. ${c.g('שים לב', 'שימי לב')} לסוגריים!`,
            solution: [...stepSol(F[0]).slice(-1), ...stepSol(F[1]).slice(-1), m(`${lv} ${sym(lv, rv)} ${rv}`)],
          };
        }
        case 'paren': {
          for (let t = 0; t < 100; t++) {
            const n = level === 3 ? 4 : c.pick([3, 4]);
            const nums = HM.range(1, n).map(() => c.rnd(2, 9)), ops = HM.range(1, n - 1).map(() => c.pick(['+', MI, X, X]));
            const build = (lo, hi) => nums.map((v, i) => (i === lo ? '(' : '') + v + (i === hi ? ')' : '') + (i < n - 1 ? ` ${ops[i]} ` : '')).join('');
            const plain = build(-1, -1), opts2 = [];
            for (let lo = 0; lo < n - 1; lo++) for (let hi = lo + 1; hi < n; hi++) if (!(lo === 0 && hi === n - 1)) opts2.push(build(lo, hi));
            const vals = opts2.map(valOf), pv = valOf(plain);
            const good = opts2.filter((s, i) => !isNaN(vals[i]) && vals[i] !== pv && vals.filter((v) => v === vals[i]).length === 1);
            if (!good.length || isNaN(pv)) continue;
            const right = c.pick(good), T = valOf(right);
            const wrong = opts2.filter((s) => s !== right && valOf(s) !== T).slice(0, 2);
            if (!wrong.length) continue;
            return {
              type: 'choice', prompt: `היכן צריך לשים סוגריים כדי שהתוצאה תהיה ${b(T)}?`,
              choices: [m(right), ...wrong.map(m), m(plain) + ' (בלי סוגריים)'], answer: 0,
              hint: `${c.g('חשב', 'חשבי')} כל אפשרות לפי סדר הפעולות, ו${c.g('בדוק', 'בדקי')} איזו נותנת ${T}.`,
              solution: stepSol(right).concat(isNaN(pv) ? [] : [`בלי סוגריים: ${m(`${plain} = ${pv}`)}`]),
            };
          }
          return { type: 'number', answer: 32, prompt: `${c.g('חשב', 'חשבי')}: ${m(`(4 + 4) ${X} 4 = ` + slot(0))}`, hint: 'קודם הסוגריים.', solution: [m(`8 ${X} 4 = 32`)] };
        }
        case 'makeTrue': {
          const a = r9(), bb = r9(), x = c.rnd(3, 20), q = r9();
          const F = c.pick([
            [`(${slot(0)} + ${a}) ${X} ${bb} = ${(x + a) * bb}`, x, [m(`${(x + a) * bb} ${DV} ${bb} = ${x + a}`), m(`${x + a} ${MI} ${a} = ${x}`)]],
            [`${bb} ${X} (${slot(0)} ${MI} ${a}) = ${bb * x}`, x + a, [m(`${bb * x} ${DV} ${bb} = ${x}`), m(`${x} + ${a} = ${x + a}`)]],
            [`${x * q} ${DV} (${slot(0)} ${MI} ${a}) = ${q}`, x + a, [m(`${x * q} ${DV} ${q} = ${x}`), m(`${x} + ${a} = ${x + a}`)]],
            [`(${slot(0)} ${MI} ${a}) ${DV} ${bb} = ${q}`, q * bb + a, [m(`${q} ${X} ${bb} = ${q * bb}`), m(`${q * bb} + ${a} = ${q * bb + a}`)]],
          ]);
          return {
            type: 'number', answer: F[1], prompt: `${c.g('השלם', 'השלימי')} את המספר החסר: ${m(F[0])}`,
            hint: `${c.g('חשוב', 'חשבי')} קודם: כמה צריך לצאת בתוך הסוגריים? אחר כך ${c.g('מצא', 'מצאי')} את המספר החסר.`,
            solution: F[2],
          };
        }
        case 'storyExpr': case 'storyCalc': case 'storyWrong': {
          let list = EXPR_SC;
          if (level === 1) list = list.filter((s) => !s.paren);
          if (kind === 'storyWrong') list = list.filter((s) => s.paren);
          const sc = c.scene(list), f = c.friend(), r = sc.make(c, f, level), ans = valOf(r.ex);
          const wr = r.wr.filter((w) => valOf(w) !== ans);
          if (kind === 'storyExpr') return {
            type: 'choice', prompt: `${r.txt} ${r.q}<br>${c.g('בחר', 'בחרי')} את התרגיל שמתאים לבעיה.`,
            choices: [m(r.ex), ...wr.map(m)], answer: 0,
            hint: `${c.g('חשוב', 'חשבי')} מה צריך לחשב קודם בסיפור, ו${c.g('בדוק', 'בדקי')} שסדר הפעולות בתרגיל מחשב בדיוק את זה.`,
            solution: [`התרגיל המתאים: ${m(r.ex)}`].concat(stepSol(r.ex)),
          };
          if (kind === 'storyWrong') {
            const wv = wr.filter((w) => !isNaN(valOf(w))), ok = !wv.length || c.chance(0.4), shown = ok ? r.ex : wv[0];
            return {
              type: 'tf', answer: ok, prompt: `${r.txt} ${r.q}<br>${f.name} ${f.g('כתב', 'כתבה')} את התרגיל ${m(shown)}. נכון או לא נכון: התרגיל מתאים לבעיה?`,
              hint: `${c.g('חשב', 'חשבי')} את התרגיל לפי סדר הפעולות. האם הוא מחשב את מה שקרה בסיפור?`,
              solution: ok ? [`נכון. סדר הפעולות בתרגיל מתאים לסיפור.`].concat(stepSol(r.ex)) : [`לא נכון. לפי סדר הפעולות, ${m(shown)} = ${valOf(shown)}.`, `התרגיל המתאים: ${m(r.ex)} = ${ans}.`],
            };
          }
          return {
            type: 'number', answer: ans, unit: r.unit, prompt: `${r.txt}<br>${r.q}`,
            hint: `${c.g('כתוב', 'כתבי')} תרגיל אחד שמתאים לסיפור, ו${c.g('חשב', 'חשבי')} לפי סדר הפעולות.`,
            solution: [`התרגיל: ${m(r.ex)}`].concat(stepSol(r.ex)),
          };
        }
      }
    },
  });
})(HM);
