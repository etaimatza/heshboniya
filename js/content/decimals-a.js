/* חשבוניה — כוכב העשרוניים, חלק א׳: משמעות, חיבור וחיסור
   כלל ברזל: עובדים תמיד במספרים שלמים של עשיריות / מאיות / אלפיות, ומציגים עם HM.dec — אף פעם לא חשבון נקודה צפה */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { frac: F, m, b } = HM;
  const MN = HM.op.minus;

  /* ---------- כלים מקומיים ---------- */
  const P10 = [1, 10, 100, 1000];
  const D = (n, p) => HM.dec(n, p == null ? 1 : p);          // D(23) = "2.3", D(125,2) = "1.25"
  const DZ = (n, p) => HM.dec(n, p, true);                    // DZ(50,2) = "0.50"
  const VAL = (n, p) => HM.round(n / P10[p == null ? 1 : p]); // ערך מספרי לתשובה
  const sgn = (x, y) => (x === y ? '=' : x < y ? '<' : '>');
  const sgnH = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  const FEM = ['', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  const tW = (k) => (k === 1 ? 'עשירית אחת' : `${FEM[k]} עשיריות`);
  const hW = (k) => (k === 1 ? 'מאית אחת' : `${k === 2 ? 'שתי' : HM.numToWords(k)} מאיות`);
  const thW = (k) => (k === 1 ? 'אלפית אחת' : `${k === 2 ? 'שתי' : HM.numToWords(k)} אלפיות`);
  const nT = (k) => HM.cnt(k, 'עשירית', 'עשיריות', true);
  const nH = (k) => HM.cnt(k, 'מאית', 'מאיות', true);
  const nTh = (k) => HM.cnt(k, 'אלפית', 'אלפיות', true);
  const nW = (k) => HM.cnt(k, 'שלם', 'שלמים');
  const nJ = (k) => HM.cnt(k, 'קפיצה', 'קפיצות', true);
  const meters = (k) => HM.cnt(k, 'מטר', 'מטרים');
  const shekels = (k) => HM.cnt(k, 'שקל', 'שקלים');
  const coins = (k) => `${HM.cnt(k, 'מטבע', 'מטבעות')} של 10 אגורות`;
  const payCoins = (W, t) => (W ? `${shekels(W)} ${t === 1 ? 'ו' : 'ו-'}${coins(t)}` : coins(t));
  const big = (html) => `<div class="big">${html}</div>`;
  const signPrompt = (c) => `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
  const parts = (k) => (k === 1 ? 'חלק אחד' : `${k} חלקים`);

  /* ---------- המחשות ---------- */
  const strip = (k, o) => V.grid(k, Object.assign({ rows: 1, cols: 10, cell: 30, maxw: 300, aria: 'פס מחולק ל-10 עשיריות' }, o || {}));
  // t עשיריות כפסים: פס מלא לכל שלם ועוד פס חלקי
  const strips = (t, o) => { let s = '', r = t; do { s += `<div>${strip(Math.max(0, Math.min(10, r)), o)}</div>`; r -= 10; } while (r > 0); return s; };
  // פס עשיריות בשני צבעים: a חלקים בצבע ראשי ואחריהם z בצבע משני (מימין לשמאל)
  function strip2(a, z) {
    const cell = 30, w = 10 * cell + 8, h = cell + 8;
    let s = '';
    for (let i = 0; i < 10; i++) s += S.rect(w - 4 - (i + 1) * cell, 4, cell, cell, { cls: (i < a ? 'f-a' : i < a + z ? 'f-b' : 'f-w') + ' s-soft', sw: 1 });
    s += S.rect(4, 4, 10 * cell, cell, { fill: 'none', cls: 's-ink', sw: 2.5, rx: 3 });
    return `<div>${S.svg(w, h, s, { label: 'פס של 10 עשיריות', maxw: 300 })}</div>`;
  }
  const addStrips = (a, z) => (a + z <= 10 ? strip2(a, z) : strip2(a, 10 - a) + strip2(0, a + z - 10));
  const sq = (k, o) => V.grid(k, Object.assign({ maxw: 200, aria: 'ריבוע של 100 משבצות' }, o || {}));
  // ישר לעשיריות בין lo ל-hi (בעשיריות). show(n) — אילו ערכים לתייג (ברירת מחדל: שלמים)
  const tLine = (lo, hi, show) => ({ min: VAL(lo, 1), max: VAL(hi, 1), den: 10, labels: (v, i) => ((show ? show(lo + i) : (lo + i) % 10 === 0) ? D(lo + i, 1) : null) });
  // ישר "זום": n קפיצות של 10^-p החל מ-lo. show(i) — אילו סימונים לתייג (ברירת מחדל: הקצוות)
  const zLine = (lo, n, p, show) => ({ min: VAL(lo, p), max: VAL(lo + n, p), step: [1, 0.1, 0.01, 0.001][p], every: n > 10 ? 10 : n, labels: (v, i) => ((show ? show(i) : i === 0 || i === n) ? D(lo + i, p) : null) });

  /* ---------- דמויות ושאלות ---------- */
  // k דמויות שונות: הילד/ה וחברים
  function crew(c, k) {
    const out = [c.me];
    for (let g = 0; out.length < k && g < 80; g++) { const f = c.friend(); if (!out.some((p) => p.name === f.name)) out.push(f); }
    return c.shuffle(out);
  }
  const hero = (c) => (c.chance(0.5) ? c.me : c.friend());
  const sortIdx = (vals, desc) => vals.map((_, i) => i).sort((i, j) => (desc ? vals[j] - vals[i] : vals[i] - vals[j]));
  // תשובה נכונה + מסיחים (מספרים שלמים של יחידות), בלי כפילויות
  function decChoices(ans, wrongs, p) {
    const vals = [ans];
    wrongs.forEach((w) => { if (vals.length < 4 && Number.isInteger(w) && w >= 0 && vals.indexOf(w) < 0) vals.push(w); });
    for (let k = 1; vals.length < 3 && k < 40; k++) { const w = ans + (k % 2 ? k : -k); if (w >= 0 && vals.indexOf(w) < 0) vals.push(w); }
    return { choices: vals.map((v) => D(v, p)), answer: 0 };
  }
  // הסבר השוואה מקום אחר מקום. x,y — מספרים שלמים של יחידות (p ספרות אחרי הנקודה); sx,sy — מה שהוצג
  const PLACE = ['', 'העשיריות', 'המאיות', 'האלפיות'];
  function cmpSteps(x, y, p, sx, sy) {
    const steps = [], px = DZ(x, p), py = DZ(y, p);
    if (sx != null && (px !== sx || py !== sy)) steps.push(`נשלים אפסים, כך שלשני המספרים יהיה אותו מספר ספרות אחרי הנקודה: ${m(px)} ו-${m(py)}.`);
    const wx = Math.floor(x / P10[p]), wy = Math.floor(y / P10[p]);
    if (wx !== wy) steps.push(`השלמים שונים: ${wx} לעומת ${wy} — הם קובעים.`);
    else {
      let k = 1;
      for (; k <= p; k++) { if (Math.floor(x / P10[p - k]) % 10 !== Math.floor(y / P10[p - k]) % 10) break; }
      if (k > p) steps.push('כל הספרות שוות, לכן המספרים שווים.');
      else {
        const dx = Math.floor(x / P10[p - k]) % 10, dy = Math.floor(y / P10[p - k]) % 10;
        steps.push(`השלמים שווים (${wx})${k === 2 ? ' וגם העשיריות שוות' : k === 3 ? ' וגם העשיריות והמאיות שוות' : ''}. ספרת ${PLACE[k]}: ${dx} לעומת ${dy}.`);
      }
    }
    steps.push(m(`${sx != null ? sx : D(x, p)} ${sgnH(sgn(x, y))} ${sy != null ? sy : D(y, p)}`));
    return steps;
  }
  const cmpQ = (c, x, y, p, sx, sy, hint, extra) => Object.assign({
    type: 'compare', prompt: signPrompt(c), left: sx, right: sy, lv: VAL(x, p), rv: VAL(y, p), answer: sgn(x, y),
    hint, solution: cmpSteps(x, y, p, sx, sy),
  }, extra || {});
  // סיפור השוואה: כמה דמויות, מי הכי גדול/קטן. mk(sc) מחזיר ערכים שונים זה מזה
  function cmpStory(c, scenes, p, mk) {
    const sc = c.scene(scenes);
    const vals = mk(sc);
    const ppl = crew(c, vals.length);
    const askBig = c.chance(0.5);
    const best = vals.indexOf(askBig ? Math.max(...vals) : Math.min(...vals));
    const sorted = vals.slice().sort((x, y) => x - y).map((v) => D(v, p));
    return {
      type: 'choice', choices: ppl.map((q) => q.name), answer: best,
      prompt: ppl.map((q, i) => sc.line(q, D(vals[i], p))).join('<br>') + `<br>${b(askBig ? sc.big : sc.small)}`,
      hint: `${c.g('השווה', 'השווי')} את המספרים מקום אחר מקום: קודם השלמים, אחר כך העשיריות${p > 1 ? ', המאיות' : ''}${p > 2 ? ' והאלפיות' : ''}.${p > 1 ? ` אפשר להשלים אפסים בסוף.` : ''}`,
      solution: [`מהקטן לגדול: ${m(sorted.join(' &lt; '))}`, `${askBig ? 'הגדול ביותר' : 'הקטן ביותר'} הוא ${m(D(vals[best], p))}, ולכן התשובה: ${ppl[best].name}.`],
    };
  }

  /* ========== העשירית (א) ========== */
  // שלם שמחולק ל-10 חלקים שווים (לסיפורי רמה 1)
  const TEN_SC = [
    { tags: ['baking'], intro: 'חטיף שוקולד מחולק ל-10 קוביות שוות.', act: (p, k) => `${p.name} ${p.g('אכל', 'אכלה')} ${HM.cnt(k, 'קובייה', 'קוביות', true)}.`, q: 'איזה חלק מהחטיף נאכל?' },
    { tags: ['sport'], intro: 'מסלול הריצה מחולק ל-10 קטעים שווים.', act: (p, k) => `${p.name} ${p.g('רץ', 'רצה')} ${HM.cnt(k, 'קטע', 'קטעים')}.`, q: (p) => `איזה חלק מהמסלול ${p.name} ${p.g('רץ', 'רצה')}?` },
    { tags: ['games'], intro: 'בשלב במשחק יש 10 משימות.', act: (p, k) => `${p.name} ${p.g('השלים', 'השלימה')} ${HM.cnt(k, 'משימה', 'משימות', true)}.`, q: 'איזה חלק מהשלב הושלם?' },
    { tags: ['reading'], intro: 'בספר ההרפתקאות יש 10 פרקים.', act: (p, k) => `${p.name} ${p.g('קרא', 'קראה')} ${HM.cnt(k, 'פרק', 'פרקים')}.`, q: 'איזה חלק מהספר נקרא?' },
    { tags: ['nature'], intro: 'שביל הטיול מחולק ל-10 קטעים שווים.', act: (p, k) => `${p.name} ${p.g('הלך', 'הלכה')} ${HM.cnt(k, 'קטע', 'קטעים')}.`, q: 'איזה חלק מהשביל עברו?' },
    { tags: ['music'], intro: 'בשיר יש 10 בתים.', act: (p, k) => `${p.name} ${p.g('שר', 'שרה')} ${HM.cnt(k, 'בית', 'בתים')}.`, q: 'איזה חלק מהשיר הושר?' },
    { tags: ['art'], intro: 'הציור מחולק ל-10 אזורים שווים.', act: (p, k) => `${p.name} ${p.g('צבע', 'צבעה')} ${HM.cnt(k, 'אזור', 'אזורים')}.`, q: 'איזה חלק מהציור נצבע?' },
    { tags: ['space'], intro: 'המסע לירח מחולק ל-10 שלבים שווים.', act: (p, k) => `החללית של ${p.name} עברה ${HM.cnt(k, 'שלב', 'שלבים')}.`, q: 'איזה חלק מהמסע עבר?' },
    { tags: ['animals'], intro: 'בחווה יש 10 גורי כלבים.', act: (p, k) => `${p.name} ${p.g('האכיל', 'האכילה')} ${HM.cnt(k, 'גור', 'גורים')}.`, q: 'איזה חלק מהגורים קיבל אוכל?' },
    { tags: ['tech'], intro: 'בתוכנית של הרובוט יש 10 שורות קוד.', act: (p, k) => `${p.name} ${p.g('כתב', 'כתבה')} ${HM.cnt(k, 'שורה', 'שורות', true)}.`, q: 'איזה חלק מהתוכנית נכתב?' },
    { tags: ['kpop'], intro: 'בריקוד החדש של הלהקה יש 10 חלקים.', act: (p, k) => `${p.name} כבר ${p.g('למד', 'למדה')} ${HM.cnt(k, 'חלק', 'חלקים')}.`, q: 'איזה חלק מהריקוד נלמד?' },
    { tags: ['magic'], intro: 'בספר הלחשים יש 10 פרקים.', act: (p, k) => `${p.name} ${p.g('קרא', 'קראה')} ${HM.cnt(k, 'פרק', 'פרקים')}.`, q: 'איזה חלק מספר הלחשים נקרא?' },
    { tags: ['squishy'], intro: 'במדף הסקווישים יש 10 תאים שווים.', act: (p, k) => `${p.name} ${p.g('מילא', 'מילאה')} בסקווישים ${HM.cnt(k, 'תא', 'תאים')}.`, q: 'איזה חלק מהמדף מלא?' },
  ];
  // כמות של שלמים ועשיריות במצבים מהחיים (ס"מ, מטבעות של 10 אגורות, מספר מעורב)
  const T_SC = [
    { tags: ['sport'], k: 'cm', w: 3, txt: (p, W, t) => `${p.name} ${p.g('קפץ', 'קפצה')} בקפיצה לרוחק ${W ? meters(W) + ' ו-' : ''}${t * 10} ס"מ.`, ask: (p) => `כמה מטרים ${p.g('קפץ', 'קפצה')}?` },
    { tags: ['space'], k: 'cm', w: 2, txt: (p, W, t) => `דגם הטיל ש${p.name} ${p.g('בנה', 'בנתה')} גבוה ${W ? meters(W) + ' ו-' : ''}${t * 10} ס"מ.`, ask: () => 'מה גובה הדגם במטרים?' },
    { tags: ['art'], k: 'cm', w: 4, txt: (p, W, t) => `${p.name} ${p.g('גזר', 'גזרה')} סרט באורך ${W ? meters(W) + ' ו-' : ''}${t * 10} ס"מ.`, ask: () => 'מה אורך הסרט במטרים?' },
    { tags: ['tech'], k: 'cm', w: 5, txt: (p, W, t) => `הרובוט של ${p.name} נסע ${W ? meters(W) + ' ו-' : ''}${t * 10} ס"מ.`, ask: () => 'כמה מטרים נסע הרובוט?' },
    { tags: ['games'], k: 'coin', w: 25, txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} חבילת קלפים למשחק ו${p.g('שילם', 'שילמה')} ${payCoins(W, t)}.`, ask: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')}?` },
    { tags: ['music'], k: 'coin', w: 15, txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} מפרט לגיטרה ו${p.g('שילם', 'שילמה')} ${payCoins(W, t)}.`, ask: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')}?` },
    { tags: ['kpop'], k: 'coin', w: 20, txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} פוטוקארד של הלהקה ו${p.g('שילם', 'שילמה')} ${payCoins(W, t)}.`, ask: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')}?` },
    { tags: ['squishy'], k: 'coin', w: 30, txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} סקווישי בצורת דונאט ו${p.g('שילם', 'שילמה')} ${payCoins(W, t)}.`, ask: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')}?` },
    { tags: ['magic'], k: 'frac', u: 'ליטר', w: 3, txt: (p, W, t) => `בשיעור שיקויים ${p.name} ${p.g('מזג', 'מזגה')} לקלחת ${m(HM.mixed(W, t, 10))} ליטר מי מעיין.`, ask: (p, c) => `${c.g('כתוב', 'כתבי')} את הכמות כמספר עשרוני.` },
    { tags: ['reading'], k: 'coin', w: 30, txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} סימנייה ו${p.g('שילם', 'שילמה')} ${payCoins(W, t)}.`, ask: (p) => `כמה שקלים ${p.g('שילם', 'שילמה')}?` },
    { tags: ['nature'], k: 'frac', u: 'ק"מ', w: 9, txt: (p, W, t) => `${p.name} ${p.g('הלך', 'הלכה')} בטיול ${m(HM.mixed(W, t, 10))} ק"מ.`, ask: (p, c) => `${c.g('כתוב', 'כתבי')} את המרחק כמספר עשרוני.` },
    { tags: ['animals'], k: 'frac', u: 'ק"ג', w: 9, txt: (p, W, t) => `הגור של ${p.name} שוקל ${m(HM.mixed(W, t, 10))} ק"ג.`, ask: (p, c) => `${c.g('כתוב', 'כתבי')} את המשקל כמספר עשרוני.` },
    { tags: ['baking'], k: 'frac', u: 'ק"ג', w: 2, txt: (p, W, t) => `${p.name} ${p.g('אפה', 'אפתה')} עוגות ליום הולדת ו${p.g('השתמש', 'השתמשה')} ב-${m(HM.mixed(W, t, 10))} ק"ג קמח.`, ask: (p, c) => `${c.g('כתוב', 'כתבי')} את כמות הקמח כמספר עשרוני.` },
  ];
  const T_UNIT = { cm: "מ'", coin: '₪' };
  // רמה 3: הרבה יחידות קטנות שמצטרפות לשלם (14 מטבעות של 10 אגורות = 1.4 ₪)
  const T_MANY = [
    { tags: ['games', 'music', 'reading'], u: '₪', txt: (p, W, t) => `בקופת החיסכון של ${p.name} יש ${shekels(W)} ועוד ${t} מטבעות של 10 אגורות.`, ask: 'כמה שקלים יש בקופה?', unitW: 'שקל', small: 'מטבעות של 10 אגורות', one: 'כל 10 מטבעות של 10 אגורות הם שקל אחד' },
    { tags: ['tech', 'space'], u: "מ'", txt: (p, W, t) => `הרובוט של ${p.name} נסע ${meters(W)}, ואחר כך עוד ${t} צעדים קטנים של 10 ס"מ כל אחד.`, ask: 'כמה מטרים נסע הרובוט בסך הכול?', unitW: 'מטר', small: 'צעדים של 10 ס"מ', one: 'כל 10 צעדים של 10 ס"מ הם מטר אחד' },
    { tags: ['art', 'sport', 'nature'], u: "מ'", txt: (p, W, t) => `${p.name} ${p.g('חיבר', 'חיברה')} ${meters(W)} של חבל ועוד ${t} חתיכות חבל של 10 ס"מ כל אחת.`, ask: 'מה האורך של כל החבל במטרים?', unitW: 'מטר', small: 'חתיכות של 10 ס"מ', one: 'כל 10 חתיכות של 10 ס"מ הן מטר אחד' },
    { tags: ['kpop'], u: '₪', txt: (p, W, t) => `${p.name} ${p.g('חוסך', 'חוסכת')} לכרטיס להופעה של הלהקה. בקופה יש ${shekels(W)} ועוד ${t} מטבעות של 10 אגורות.`, ask: 'כמה שקלים יש בקופה?', unitW: 'שקל', small: 'מטבעות של 10 אגורות', one: 'כל 10 מטבעות של 10 אגורות הם שקל אחד' },
    { tags: ['squishy'], u: '₪', txt: (p, W, t) => `${p.name} ${p.g('חוסך', 'חוסכת')} לסקווישי ענק. בקופה יש ${shekels(W)} ועוד ${t} מטבעות של 10 אגורות.`, ask: 'כמה שקלים יש בקופה?', unitW: 'שקל', small: 'מטבעות של 10 אגורות', one: 'כל 10 מטבעות של 10 אגורות הם שקל אחד' },
    { tags: ['magic'], u: 'ליטר', txt: (p, W, t) => `${p.name} ${p.g('הכין', 'הכינה')} שיקוי: ${HM.cnt(W, 'בקבוק', 'בקבוקים')} של ליטר ועוד ${t} כוסות של עשירית ליטר.`, ask: 'כמה ליטרים של שיקוי יש בסך הכול?', unitW: 'ליטר', small: 'כוסות של עשירית ליטר', one: 'כל 10 כוסות של עשירית ליטר הן ליטר אחד' },
    { tags: ['baking', 'animals'], u: 'ק"ג', txt: (p, W, t) => `${p.name} ${p.g('קנה', 'קנתה')} ${HM.cnt(W, 'שק', 'שקים')} של קילוגרם אוכל לחתולים ועוד ${t} שקיות קטנות של עשירית קילוגרם.`, ask: 'כמה קילוגרמים אוכל נקנו בסך הכול?', unitW: 'קילוגרם', small: 'שקיות של עשירית קילוגרם', one: 'כל 10 שקיות של עשירית קילוגרם הן קילוגרם אחד' },
  ];

  HM.lesson({
    id: 'dec-tenths-a',
    learn: (c) => [
      {
        title: 'עשירית — חלק אחד מעשרה',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} חטיף שוקולד עם ${b('10 קוביות שוות')}.<br>כל קובייה היא ${b('עשירית')} מהחטיף: ${m(F(1, 10))}.<br>אכלו 3 קוביות? אכלו ${m(F(3, 10))} מהחטיף — ${b('שלוש עשיריות')}.`,
        visual: strip(3),
      },
      {
        title: 'מספר עשרוני',
        html: `אפשר לכתוב עשיריות גם כ${b('מספר עשרוני')}:<br>${m(F(1, 10) + ' = 0.1')} &nbsp;&nbsp; ${m(F(3, 10) + ' = 0.3')}<br>הספרה שאחרי ${b('הנקודה העשרונית')} היא ${b('ספרת העשיריות')}. ה-0 שלפני הנקודה אומר שאין שלמים.<br>קוראים: "אפס נקודה שלוש", או "שלוש עשיריות".`,
        visual: V.decTable('0.3'),
      },
      {
        title: 'עשיריות על ישר המספרים',
        html: `נחלק את הקטע שבין 0 ל-1 ל-${b('10 קטעים שווים')}. כל קטע הוא עשירית.<br>כל קפיצה מוסיפה ${m('0.1')}. אחרי ${m('0.9')} מגיעים ל-${b('1')}, כי ${b('10 עשיריות הן שלם אחד')}.`,
        visual: V.numberLine({ min: 0, max: 1, den: 10, labels: (v, i) => D(i), marks: [{ v: 0.7, label: '0.7' }] }),
      },
      {
        title: 'יותר משלם',
        html: `כל פס הוא שלם אחד. כאן צבוע פס שלם ועוד 4 עשיריות: ${m('1.4')}.<br>הספרה ${b('לפני')} הנקודה סופרת ${b('שלמים')}, והספרה ${b('אחרי')} הנקודה סופרת ${b('עשיריות')}.<br>קוראים: "אחת נקודה ארבע", או "שלם וארבע עשיריות".`,
        visual: strips(14) + V.decTable('1.4'),
      },
      {
        title: 'דוגמה: משבר למספר עשרוני',
        html: `איך כותבים ${m(HM.mixed(2, 7, 10))} ו-${m(F(23, 10))} כמספרים עשרוניים?`,
        visual: strips(23),
        steps: [
          `${m(HM.mixed(2, 7, 10))} הם 2 שלמים ושבע עשיריות, ולכן ${m(HM.mixed(2, 7, 10) + ' = 2.7')}.`,
          `${m(F(23, 10))} הם 23 עשיריות. כל 10 עשיריות הן שלם אחד.`,
          m(F(23, 10) + ' = ' + F(20, 10) + ' + ' + F(3, 10) + ' = 2 + ' + F(3, 10)),
          `ולכן ${m(F(23, 10) + ' = 2.3')} ✔`,
        ],
      },
      {
        title: 'עשיריות סביבנו',
        html: `• ${b('כסף')}: מטבע של 10 אגורות הוא עשירית שקל. 4 שקלים ו-5 מטבעות של 10 אגורות הם ${m('4.5')} ₪.<br>• ${b('אורך')}: 10 ס"מ הם עשירית מטר. מטר אחד ו-30 ס"מ הם ${m('1.3')} מ'.<br>• ${b('חצי')}: ${m(F(5, 10) + ' = ' + F(1, 2))}, ולכן חצי הוא ${m('0.5')}.`,
        quiz: {
          type: 'number', answer: 16, prompt: `כמה עשיריות יש בסך הכול במספר ${m('1.6')}?`,
          hint: 'בכל שלם יש 10 עשיריות.',
          solution: ['בשלם אחד יש 10 עשיריות.', `ועוד 6 עשיריות: ${m('10 + 6 = 16')}.`],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['read', 'shade', 'frac', 'words', 'nl', 'story10', 'story10', 'measure0', 'measure0']
        : level === 2 ? ['reads', 'mixed', 'improper', 'count', 'nlBig', 'measure', 'measure', 'measure', 'many']
        : ['toFrac', 'tf', 'missing', 'fromTenths', 'pickPic', 'nlBig', 'many', 'many', 'storyCmp', 'storyCmp'];
      const kind = c.pick(kinds);
      const t = c.rnd(1, 9);
      switch (kind) {
        case 'read': return {
          type: 'number', decimal: true, answer: VAL(t),
          prompt: 'הפס מחולק ל-10 חלקים שווים. איזה מספר עשרוני מתאר את החלק הצבוע?',
          visual: strip(t),
          hint: `כל חלק הוא עשירית (${m('0.1')}). ${c.g('ספור', 'ספרי')} כמה חלקים צבועים.`,
          solution: [`${t === 1 ? 'חלק אחד צבוע' : `${t} חלקים צבועים`} מתוך 10 ← ${tW(t)}.`, m(F(t, 10) + ' = ' + D(t))],
        };
        case 'shade': {
          const form = c.pick(['dec', 'dec', 'words', 'frac']);
          const what = form === 'dec' ? m(D(t)) : form === 'frac' ? m(F(t, 10)) : b(tW(t));
          return {
            type: 'shade', shape: 'grid', rows: 1, cols: 10, answer: t,
            prompt: `${c.g('צבע', 'צבעי')} ${what} מהפס (${c.g('גע', 'געי')} בחלקים כדי לצבוע אותם).`,
            hint: 'הפס מחולק ל-10 חלקים שווים, וכל חלק הוא עשירית. כמה עשיריות צריך לצבוע?',
            solution: [`${form === 'words' ? '' : `${what} = ${tW(t)}, לכן `}צובעים ${parts(t)} מתוך 10.`],
          };
        }
        case 'frac': return {
          type: 'number', decimal: true, answer: VAL(t),
          prompt: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני:${big(m(F(t, 10) + ' = ' + HM.slot(0)))}`,
          hint: 'המכנה 10 אומר שאלה עשיריות. ספרת העשיריות נכתבת מיד אחרי הנקודה.',
          solution: [`${m(F(t, 10))} = ${tW(t)}. אין שלמים, לכן כותבים 0 לפני הנקודה.`, m(F(t, 10) + ' = ' + D(t))],
        };
        case 'words': return {
          type: 'choice', choices: [D(t), String(t), D(t, 2), `${t}.10`], answer: 0,
          prompt: `איך כותבים ${b(`"${tW(t)}"`)} כמספר עשרוני?`,
          hint: 'עשיריות כותבים בספרה הראשונה אחרי הנקודה.',
          solution: [`${tW(t)} = ${m(F(t, 10))} = ${m(D(t))}`],
        };
        case 'nl': return {
          type: 'numberline', line: tLine(0, 10), answer: VAL(t),
          prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${c.chance(0.7) ? m(D(t)) : b(tW(t))}.`,
          hint: `הקטע בין 0 ל-1 מחולק ל-10 חלקים שווים. כל קפיצה היא ${m('0.1')}.`,
          solution: [`${m(D(t))} = ${tW(t)}, לכן סופרים ${nJ(t)} מ-0.`],
        };
        case 'story10': {
          const sc = c.scene(TEN_SC), p = hero(c);
          return {
            type: 'number', decimal: true, answer: VAL(t),
            prompt: `${sc.intro} ${sc.act(p, t)}<br>${typeof sc.q === 'function' ? sc.q(p) : sc.q} ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: 'השלם מחולק ל-10 חלקים שווים, לכן כל חלק הוא עשירית.',
            solution: [`${parts(t)} מתוך 10 ← ${m(F(t, 10))}.`, `${m(F(t, 10) + ' = ' + D(t))}`],
          };
        }
        case 'measure0':
        case 'measure': {
          const sc = c.scene(kind === 'measure0' ? T_SC.filter((s) => s.k !== 'frac') : T_SC), p = hero(c);
          const W = kind === 'measure0' ? 0 : c.rnd(1, sc.w), x = W * 10 + t;
          const sol = sc.k === 'cm' ? [`10 ס"מ הם עשירית מטר, לכן ${t * 10} ס"מ הם ${tW(t)} מטר.`, `${W ? `${meters(W)} ועוד ${tW(t)} מטר` : `${tW(t)} מטר`} ← ${m(D(x))} מ'`]
            : sc.k === 'coin' ? [`מטבע של 10 אגורות הוא עשירית שקל, לכן ${coins(t)} ${t === 1 ? 'הוא' : 'הם'} ${tW(t)} שקל.`, `${W ? `${shekels(W)} ועוד ${tW(t)} שקל` : `${tW(t)} שקל`} ← ${m(D(x))} ₪`]
            : [`${m(HM.mixed(W, t, 10))} = ${nW(W)} ו${tW(t)}.`, `במספר עשרוני: ${m(D(x))}`];
          return {
            type: 'number', decimal: true, answer: VAL(x), unit: sc.u || T_UNIT[sc.k],
            prompt: `${sc.txt(p, W, t)}<br>${sc.ask(p, c)}${sc.k === 'frac' ? '' : ` ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`}`,
            hint: sc.k === 'cm' ? `10 ס"מ הם עשירית מטר (${m('0.1')} מ').` : sc.k === 'coin' ? `מטבע של 10 אגורות הוא עשירית שקל (${m('0.1')} ₪).` : 'המספר השלם נכתב לפני הנקודה, והעשיריות — מיד אחריה.',
            solution: sol,
          };
        }
        case 'reads': {
          const W = c.rnd(1, 2), x = W * 10 + t;
          return {
            type: 'number', decimal: true, answer: VAL(x),
            prompt: 'כל פס הוא שלם אחד. איזה מספר עשרוני מתאר את כל החלק הצבוע?',
            visual: strips(x, { maxw: 260 }),
            hint: 'כל פס מלא הוא שלם, וכל חלק בפס הוא עשירית.',
            solution: [`${HM.cnt(W, 'פס מלא', 'פסים מלאים')} ← ${nW(W)}.`, `${t === 1 ? 'בפס האחרון צבוע חלק אחד' : `בפס האחרון צבועים ${t} חלקים`} ← ${tW(t)}.`, `התשובה: ${m(D(x))}`],
          };
        }
        case 'mixed': {
          const W = c.rnd(1, 9), x = W * 10 + t;
          return {
            type: 'number', decimal: true, answer: VAL(x),
            prompt: `${c.g('כתוב', 'כתבי')} את המספר המעורב כמספר עשרוני:${big(m(HM.mixed(W, t, 10) + ' = ' + HM.slot(0)))}`,
            hint: 'המספר השלם נכתב לפני הנקודה, והעשיריות — מיד אחריה.',
            solution: [`${m(HM.mixed(W, t, 10))} = ${nW(W)} ו${tW(t)}.`, m(HM.mixed(W, t, 10) + ' = ' + D(x))],
          };
        }
        case 'improper': {
          const W = c.rnd(1, 5), x = W * 10 + t;
          return {
            type: 'number', decimal: true, answer: VAL(x),
            prompt: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני:${big(m(F(x, 10) + ' = ' + HM.slot(0)))}`,
            hint: `${m(F(10, 10) + ' = 1')}. כמה שלמים "מתחבאים" ב-${m(F(x, 10))}?`,
            solution: [m(F(x, 10) + ' = ' + F(W * 10, 10) + ' + ' + F(t, 10)), `${m(F(W * 10, 10) + ' = ' + W)}, ולכן ${m(F(x, 10) + ' = ' + HM.mixed(W, t, 10) + ' = ' + D(x))}`],
          };
        }
        case 'count': {
          const W = c.rnd(1, 5), x = W * 10 + t;
          return {
            type: 'number', answer: x,
            prompt: `כמה עשיריות יש בסך הכול במספר ${m(D(x))}?`,
            hint: 'בכל שלם יש 10 עשיריות.',
            solution: [`${W === 1 ? 'בשלם אחד' : `ב-${W} שלמים`} יש ${W * 10} עשיריות.`, `ועוד ${nT(t)}: ${m(`${W * 10} + ${t} = ${x}`)}.`],
          };
        }
        case 'nlBig': {
          const lo = c.rnd(0, 3) * 10; let x; do { x = lo + c.rnd(1, 19); } while (x % 10 === 0);
          const W = Math.floor(x / 10), tt = x % 10;
          const form = level === 2 ? m(D(x)) : (c.chance(0.5) || !W) ? m(F(x, 10)) : m(HM.mixed(W, tt, 10));
          return {
            type: 'numberline', line: tLine(lo, lo + 20), answer: VAL(x),
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${form}.`,
            hint: 'בין כל שני מספרים שלמים יש 10 קפיצות קטנות, וכל קפיצה היא עשירית.',
            solution: [...(level === 3 ? [`${form} = ${m(D(x))}`] : []), W ? `${m(D(x))} = ${nW(W)} ו${tW(tt)}: מגיעים ל-${W}, ומשם עוד ${nJ(tt)}.` : `${m(D(x))} = ${tW(tt)}: סופרים ${nJ(tt)} מ-0.`],
          };
        }
        case 'many': {
          const sc = c.scene(T_MANY), p = hero(c);
          const W = c.rnd(1, level === 2 ? 3 : 6), k = c.rnd(level === 2 ? 2 : 11, level === 2 ? 9 : 29), x = W * 10 + k;
          return {
            type: 'number', decimal: true, answer: VAL(x), unit: sc.u,
            prompt: `${sc.txt(p, W, k)}<br>${sc.ask} ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: k >= 10 ? `${sc.one}. כמה שלמים אפשר להרכיב מ-${k} ${sc.small}?` : `כל אחד מה${sc.small} הוא עשירית ${sc.unitW}.`,
            solution: k >= 10
              ? [`${k} ${sc.small} = ${k} עשיריות = ${m(D(k))}.`, `${m(`${W} + ${D(k)} = ${D(x)}`)}`]
              : [`${k} ${sc.small} = ${tW(k)} ${sc.unitW}.`, `${m(`${W} + ${D(k)} = ${D(x)}`)}`],
          };
        }
        case 'storyCmp': {
          // שתי דמויות, שתי צורות כתיבה: מספר מעורב / שבר מול מספר עשרוני
          const ppl = crew(c, 2), sc = c.scene([
            { tags: ['sport'], u: 'ק"מ', verb: (p) => p.g('רץ', 'רצה'), q: 'מי רץ יותר?' },
            { tags: ['nature'], u: 'ק"מ', verb: (p) => p.g('הלך', 'הלכה'), q: 'מי הלך יותר?' },
            { tags: ['tech'], u: 'מטרים', verb: (p) => p.g('הסיע את הרובוט', 'הסיעה את הרובוט'), q: 'מי הסיע את הרובוט רחוק יותר?' },
            { tags: ['art'], u: 'מטרים של סרט', verb: (p) => p.g('גזר', 'גזרה'), q: 'מי גזר יותר סרט?' },
            { tags: ['magic'], u: 'ק"מ', verb: (p) => p.g('טס על המטאטא', 'טסה על המטאטא'), q: 'מי טס רחוק יותר?' },
            { tags: ['kpop'], u: 'שעות', verb: (p) => p.g('תרגל את הריקוד של הלהקה', 'תרגלה את הריקוד של הלהקה'), q: 'מי תרגל יותר?' },
            { tags: ['squishy'], u: 'מטרים', verb: (p) => p.g('סידר סקווישים בשורה באורך', 'סידרה סקווישים בשורה באורך'), q: 'של מי השורה ארוכה יותר?' },
          ]);
          const W = c.rnd(1, 4); const [t1, t2] = c.sample(HM.range(1, 9), 2);
          const x = W * 10 + t1, y = W * 10 + t2;
          const showA = c.chance(0.5) ? m(HM.mixed(W, t1, 10)) : m(F(x, 10));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: x > y ? 0 : 1,
            prompt: `${ppl[0].name} ${sc.verb(ppl[0])} ${showA} ${sc.u}, ו${ppl[1].name} ${sc.verb(ppl[1])} ${m(D(y))} ${sc.u}.<br>${b(sc.q)}`,
            hint: `${c.g('כתוב', 'כתבי')} את שני המספרים באותה צורה — למשל שניהם כמספר עשרוני — ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${showA} = ${m(D(x))}`, `${m(D(x) + ' ' + sgnH(sgn(x, y)) + ' ' + D(y))}`, `התשובה: ${ppl[x > y ? 0 : 1].name}`],
          };
        }
        case 'toFrac': {
          let W = c.rnd(1, 9); if (W === t) W = W === 9 ? 1 : W + 1;
          const x = W * 10 + t;
          return {
            type: 'choice', answer: 0,
            choices: [m(HM.mixed(W, t, 10)), m(HM.mixed(W, t, 100)), m(F(x, 100)), m(HM.mixed(t, W, 10))],
            prompt: `איזה מספר שווה ל-${m(D(x))}?`,
            hint: 'הספרה שלפני הנקודה סופרת שלמים, והספרה שאחרי הנקודה סופרת עשיריות.',
            solution: [`${m(D(x))} = ${nW(W)} ו${tW(t)}.`, m(D(x) + ' = ' + HM.mixed(W, t, 10))],
          };
        }
        case 'tf': {
          const W = c.rnd(1, 6), x = W * 10 + t, v = c.rnd(0, 3);
          let st, ok, why;
          if (v === 0) { ok = c.chance(0.5); st = m(F(t, 10) + ' = ' + (ok ? D(t) : D(t, 2))); why = `${m(F(t, 10))} = ${tW(t)} = ${m(D(t))}.`; }
          else if (v === 1) { ok = false; st = m(F(x, 10) + ' = ' + D(x, 2)); why = `${m(F(x, 10))} = ${x} עשיריות = ${nW(W)} ו${tW(t)} = ${m(D(x))}.`; }
          else if (v === 2) { ok = t === W || c.chance(0.5); st = `${nW(W)} ו${tW(t)} = ${m(D(ok ? x : t * 10 + W))}`; why = `${nW(W)} ו${tW(t)} כותבים ${m(D(x))}: השלמים לפני הנקודה והעשיריות אחריה.`; }
          else { ok = c.chance(0.5); st = m(D(x) + ' = ' + (ok ? F(x, 10) : F(x, 100))); why = `${m(D(x))} = ${x} עשיריות = ${m(F(x, 10))}.`; }
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(st)}`,
            hint: `${c.g('כתוב', 'כתבי')} את שני הצדדים כשלמים ועשיריות, ו${c.g('בדוק', 'בדקי')} אם הם שווים.`,
            solution: [why, `לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'missing': {
          let W = c.rnd(1, 9); if (W === t) W = W === 9 ? 2 : W + 1;
          const x = W * 10 + t, askW = c.chance(0.5);
          return {
            type: 'number', answer: askW ? W : t,
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:${big(m(D(x) + ' = ' + (askW ? HM.slot(0) : W) + ' + ' + F(askW ? t : HM.slot(0), 10)))}`,
            hint: `${m(D(x))} בנוי משלמים ומעשיריות. איזה חלק חסר?`,
            solution: [`${m(D(x))} = ${nW(W)} ו${tW(t)}.`, m(D(x) + ' = ' + W + ' + ' + F(t, 10))],
          };
        }
        case 'fromTenths': {
          let x; do { x = c.rnd(11, 89); } while (x % 10 === 0);
          const W = Math.floor(x / 10), tt = x % 10;
          return {
            type: 'number', decimal: true, answer: VAL(x),
            prompt: `איזה מספר עשרוני שווה ל-${x} עשיריות?`,
            hint: 'כל 10 עשיריות הן שלם אחד. כמה שלמים יש, וכמה עשיריות נשארות?',
            solution: [`${x} עשיריות = ${W * 10} עשיריות ועוד ${nT(tt)}.`, `${W * 10} עשיריות = ${nW(W)}.`, `התשובה: ${m(D(x))}`],
          };
        }
        case 'pickPic': {
          const W = c.rnd(1, 2), x = W * 10 + t;
          const vals = [x, t, W * 10 + (10 - t), (W + 1) * 10 + t].filter((v, i, a) => a.indexOf(v) === i);
          return {
            type: 'choice', cols: 2, answer: 0,
            choices: vals.map((v) => strips(v, { maxw: 150 })),
            prompt: `כל פס הוא שלם אחד. באיזה ציור צבוע בדיוק ${m(D(x))}?`,
            hint: 'כמה פסים מלאים צריך, וכמה חלקים צבועים בפס האחרון?',
            solution: [`${m(D(x))} = ${nW(W)} ו${tW(t)}.`, `לכן צריך ${HM.cnt(W, 'פס מלא', 'פסים מלאים')} ועוד ${parts(t)} צבועים בפס הבא.`],
          };
        }
      }
    },
  });

  /* ========== העשירית (ב): השוואה ========== */
  // סיפורי השוואה: line(p, v) — משפט על הדמות; big/small — השאלה; w — טווח השלמים
  const CMP_SC = [
    { tags: ['sport'], w: [1, 3], line: (p, v) => `${p.name} ${p.g('קפץ', 'קפצה')} לרוחק ${v} מטרים.`, big: 'מי קפץ הכי רחוק?', small: 'מי קפץ למרחק הקצר ביותר?' },
    { tags: ['nature'], w: [2, 8], line: (p, v) => `${p.name} ${p.g('הלך', 'הלכה')} בטיול ${v} ק"מ.`, big: 'מי הלך את המרחק הארוך ביותר?', small: 'מי הלך את המרחק הקצר ביותר?' },
    { tags: ['animals'], w: [3, 9], line: (p, v) => `הכלב של ${p.name} שוקל ${v} ק"ג.`, big: 'הכלב של מי הכי כבד?', small: 'הכלב של מי הכי קל?' },
    { tags: ['baking'], w: [1, 4], line: (p, v) => `${p.name} ${p.g('הכין', 'הכינה')} ${v} ליטר לימונדה.`, big: 'מי הכין הכי הרבה לימונדה?', small: 'מי הכין הכי מעט לימונדה?' },
    { tags: ['space'], w: [3, 9], line: (p, v) => `הטיל של ${p.name} עף לגובה ${v} מטרים.`, big: 'הטיל של מי עף הכי גבוה?', small: 'הטיל של מי עף הכי נמוך?' },
    { tags: ['games'], w: [8, 14], line: (p, v) => `${p.name} ${p.g('סיים', 'סיימה')} את המסלול במשחק ב-${v} שניות.`, big: 'מי סיים את המסלול בזמן הארוך ביותר?', small: 'מי סיים את המסלול בזמן הקצר ביותר?' },
    { tags: ['music'], hours: true, w: [1, 5], line: (p, v) => `${p.name} ${p.g('תרגל', 'תרגלה')} פסנתר ${v} שעות השבוע.`, big: 'מי תרגל הכי הרבה?', small: 'מי תרגל הכי מעט?' },
    { tags: ['art'], w: [1, 4], line: (p, v) => `חוט הצמר של ${p.name} ארוך ${v} מטרים.`, big: 'חוט הצמר של מי הכי ארוך?', small: 'חוט הצמר של מי הכי קצר?' },
    { tags: ['reading'], hours: true, w: [2, 7], line: (p, v) => `${p.name} ${p.g('קרא', 'קראה')} ספרים ${v} שעות השבוע.`, big: 'מי קרא הכי הרבה זמן?', small: 'מי קרא הכי מעט זמן?' },
    { tags: ['tech'], w: [1, 6], line: (p, v) => `הרובוט של ${p.name} נסע ${v} מטרים.`, big: 'הרובוט של מי נסע הכי רחוק?', small: 'הרובוט של מי נסע את המרחק הקצר ביותר?' },
    { tags: ['kpop'], hours: true, w: [1, 4], line: (p, v) => `${p.name} ${p.g('תרגל', 'תרגלה')} את הריקוד של הלהקה ${v} שעות השבוע.`, big: 'מי תרגל הכי הרבה?', small: 'מי תרגל הכי מעט?' },
    { tags: ['magic'], w: [2, 9], line: (p, v) => `המטאטא של ${p.name} טס ${v} ק"מ.`, big: 'המטאטא של מי טס הכי רחוק?', small: 'המטאטא של מי טס את המרחק הקצר ביותר?' },
    { tags: ['squishy'], w: [2, 6], line: (p, v) => `הסקווישי של ${p.name} חזר לצורתו אחרי ${v} שניות.`, big: 'הסקווישי של מי חזר לצורתו הכי לאט?', small: 'הסקווישי של מי חזר לצורתו הכי מהר?' },
  ];
  // יעד ותחרות "מי הכי קרוב" (רמה 3)
  const CLOSE_SC = [
    { tags: ['sport'], u: 'מטרים', goal: (W) => `המאמן ביקש לקפוץ בדיוק ${W} מטרים.`, line: (p, v) => `${p.name} ${p.g('קפץ', 'קפצה')} ${v} מטרים.` },
    { tags: ['baking'], u: 'ק"ג', goal: (W) => `במתכון כתוב ${W} ק"ג קמח בדיוק.`, line: (p, v) => `${p.name} ${p.g('שקל', 'שקלה')} ${v} ק"ג קמח.` },
    { tags: ['tech', 'space'], u: 'מטרים', goal: (W) => `הרובוטים צריכים לעצור בדיוק אחרי ${W} מטרים.`, line: (p, v) => `הרובוט של ${p.name} עצר אחרי ${v} מטרים.` },
    { tags: ['magic'], u: 'ליטר', goal: (W) => `בשיעור שיקויים צריך למזוג לקלחת בדיוק ${W} ליטר של מי מעיין.`, line: (p, v) => `${p.name} ${p.g('מזג', 'מזגה')} ${v} ליטר.` },
    { tags: ['squishy'], u: 'שניות', goal: (W) => `בתחרות מנחשים כמה זמן לוקח לסקווישי ענק לחזור לצורתו. התשובה: בדיוק ${W} שניות.`, line: (p, v) => `${p.name} ${p.g('ניחש', 'ניחשה')} ${v} שניות.` },
    { tags: ['games', 'music', 'kpop'], u: 'שניות', goal: (W) => `במשחק "עצור את השעון" צריך לעצור בדיוק ב-${W} שניות.`, line: (p, v) => `${p.name} ${p.g('עצר', 'עצרה')} ב-${v} שניות.` },
    { tags: ['nature', 'animals', 'art', 'reading'], u: 'ק"ג', goal: (W) => `ביריד מנחשים את המשקל של דלעת ששוקלת בדיוק ${W} ק"ג.`, line: (p, v) => `${p.name} ${p.g('ניחש', 'ניחשה')} ${v} ק"ג.` },
  ];

  HM.lesson({
    id: 'dec-tenths-b',
    learn: (c) => {
      const f = c.buddy();
      return [
        {
          title: 'מי קפץ רחוק יותר?',
          html: `${c.name} ${c.g('קפץ', 'קפצה')} לרוחק ${m('2.4')} מטרים, ו${f.name} ${f.g('קפץ', 'קפצה')} ${m('2.7')} מטרים.<br>בשני המספרים יש 2 שלמים, לכן משווים עשיריות: 7 עשיריות הן יותר מ-4 עשיריות.<br>${m('2.7 &gt; 2.4')} — ועל ישר המספרים ${m('2.7')} נמצא ${b('ימינה')} יותר.`,
          visual: V.numberLine({ min: 2, max: 3, den: 10, labels: (v, i) => D(20 + i), marks: [{ v: 2.4, label: '2.4' }, { v: 2.7, label: '2.7', cls: 'f-b' }] }),
        },
        {
          title: 'קודם משווים שלמים',
          html: `מה גדול יותר: ${m('3.1')} או ${m('2.9')}?<br>אל ${c.g('תתבלבל', 'תתבלבלי')} מה-9! קודם ${c.g('בדוק', 'בדקי')} את ${b('השלמים')}: 3 שלמים הם יותר מ-2 שלמים, ולכן ${m('3.1 &gt; 2.9')}.<br>רק כשהשלמים שווים — משווים את ${b('העשיריות')}.`,
          visual: V.numberLine({ min: 2, max: 4, den: 10, marks: [{ v: 2.9, label: '2.9', cls: 'f-b' }, { v: 3.1, label: '3.1' }] }),
        },
        {
          title: 'אין שלמים? משווים עשיריות',
          html: `${m('0.4')} ו-${m('0.7')}: בשני המספרים אין שלמים, אז משווים עשיריות.<br>4 עשיריות &lt; 7 עשיריות, ולכן ${m('0.4 &lt; 0.7')}.`,
          visual: V.bars([{ n: 4, d: 10 }, { n: 7, d: 10 }], { labels: ['0.4', '0.7'] }),
        },
        {
          title: 'אותו מספר, שמות שונים',
          html: `${m('1.2 = ' + F(12, 10) + ' = ' + HM.mixed(1, 2, 10))} — שלושה שמות לאותו מספר.<br>${m('0.5 = ' + F(5, 10) + ' = ' + F(1, 2))} — חצי!<br>כדי להשוות שבר למספר עשרוני, ${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני, ואז ${c.g('השווה', 'השווי')}.`,
          visual: strips(12, { maxw: 240 }),
        },
        {
          title: 'דוגמה: סידור מהקטן לגדול',
          html: `${c.name}, נסדר מהקטן לגדול: ${HM.seq(['2.3', '0.9', '3.2', '2.9'])}`,
          steps: [
            `ב-${m('0.9')} אין שלמים בכלל, לכן הוא הקטן ביותר.`,
            `ל-${m('2.3')} ול-${m('2.9')} יש 2 שלמים. 3 עשיריות &lt; 9 עשיריות, ולכן ${m('2.3 &lt; 2.9')}.`,
            `ל-${m('3.2')} יש 3 שלמים — הוא הגדול ביותר.`,
            `הסדר: ${m('0.9 &lt; 2.3 &lt; 2.9 &lt; 3.2')} ✔`,
          ],
        },
        {
          title: c.g('נסה בעצמך', 'נסי בעצמך'),
          html: `${c.g('זכור', 'זכרי')}: שלמים קודם, עשיריות אחר כך.`,
          quiz: cmpQ(c, 18, 21, 1, '1.8', '2.1', 'קודם משווים את השלמים.'),
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['same', 'same', 'diff', 'pickBig', 'fracEasy', 'nlPick', 'story2', 'story2', 'story2']
        : level === 2 ? ['diff', 'order', 'frac', 'between', 'pickBig', 'story', 'story', 'story', 'story']
        : ['digit', 'closest', 'mid', 'tf', 'orderMix', 'storyMix', 'storyMix', 'storyClose', 'storyClose'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'same': {
          const W = level === 1 ? c.rnd(0, 3) : c.rnd(0, 9), t1 = c.rnd(1, 9);
          let t2 = c.chance(0.12) ? t1 : c.rnd(1, 9); if (t2 === t1 && c.chance(0.85)) t2 = t1 === 9 ? 8 : t1 + 1;
          const x = W * 10 + t1, y = W * 10 + t2;
          return cmpQ(c, x, y, 1, D(x), D(y), `${W ? `לשני המספרים יש ${nW(W)}` : 'בשני המספרים אין שלמים'}. ${c.g('השווה', 'השווי')} את העשיריות.`,
            W === 0 ? { visual: V.bars([{ n: t1, d: 10 }, { n: t2, d: 10 }], { labels: [D(x), D(y)] }) } : null);
        }
        case 'diff': {
          const W = c.rnd(0, level === 1 ? 4 : 8), gap = level === 1 ? 1 : c.rnd(1, 2);
          const small = W * 10 + c.rnd(5, 9), bigv = (W + gap) * 10 + (level === 2 && c.chance(0.3) ? 0 : c.rnd(1, 4));
          const [x, y] = c.chance(0.5) ? [small, bigv] : [bigv, small];
          return cmpQ(c, x, y, 1, D(x), D(y), `קודם ${c.g('השווה', 'השווי')} את השלמים — הספרה שלפני הנקודה.`);
        }
        case 'pickBig': {
          const W = c.rnd(1, 6), askBig = c.chance(0.5);
          const vals = c.shuffle([W * 10 + c.rnd(5, 9), W * 10 + c.rnd(1, 4), (W + 1) * 10 + c.rnd(0, 3), (W - 1) * 10 + 9]);
          const ans = vals.indexOf(askBig ? Math.max(...vals) : Math.min(...vals));
          return {
            type: 'choice', choices: vals.map((v) => D(v)), answer: ans,
            prompt: `איזה מספר הוא ה${askBig ? 'גדול' : 'קטן'} ביותר?`,
            hint: `${c.g('חפש', 'חפשי')} קודם את המספר עם ${askBig ? 'הכי הרבה' : 'הכי מעט'} שלמים. אם יש תיקו — ${c.g('השווה', 'השווי')} עשיריות.`,
            solution: [`מהקטן לגדול: ${m(vals.slice().sort((x, y) => x - y).map((v) => D(v)).join(' &lt; '))}`, `התשובה: ${m(D(vals[ans]))}`],
          };
        }
        case 'fracEasy': {
          const t1 = c.rnd(1, 9); let t2 = c.chance(0.2) ? t1 : c.rnd(1, 9); if (t2 === t1 && c.chance(0.8)) t2 = t1 === 1 ? 2 : t1 - 1;
          const fl = c.chance(0.5);
          const L = fl ? m(F(t1, 10)) : D(t2), R = fl ? D(t2) : m(F(t1, 10));
          const [x, y] = fl ? [t1, t2] : [t2, t1];
          return {
            type: 'compare', prompt: signPrompt(c), left: L, right: R, lv: VAL(x), rv: VAL(y), answer: sgn(x, y),
            hint: `${m(F(t1, 10))} = ${tW(t1)}. איך כותבים את זה כמספר עשרוני?`,
            solution: [m(F(t1, 10) + ' = ' + D(t1)), m(D(x) + ' ' + sgnH(sgn(x, y)) + ' ' + D(y))],
          };
        }
        case 'nlPick': {
          const [x, y] = c.sample(HM.range(1, 9), 2), askBig = c.chance(0.6), ans = askBig ? Math.max(x, y) : Math.min(x, y);
          return {
            type: 'numberline', line: tLine(0, 10), answer: VAL(ans),
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את המספר ה${askBig ? 'גדול' : 'קטן'} מבין ${m(D(x))} ו-${m(D(y))}.`,
            hint: 'על ישר המספרים, ככל שמתקדמים ימינה — המספרים גדלים.',
            solution: [m(D(Math.min(x, y)) + ' &lt; ' + D(Math.max(x, y))), `מסמנים את ${m(D(ans))}: ${nJ(ans)} של עשירית מ-0.`],
          };
        }
        case 'story2': {
          // רמה 1: שתי דמויות, שלמים שווים או שונים
          const sc = c.scene(CMP_SC), ppl = crew(c, 2), W = c.rnd(sc.w[0], sc.w[1]);
          const [t1, t2] = c.sample(HM.range(1, 9), 2);
          const vals = c.chance(0.6) ? [W * 10 + t1, W * 10 + t2] : c.shuffle([W * 10 + c.rnd(6, 9), (W + 1) * 10 + c.rnd(1, 4)]);
          const askBig = c.chance(0.5), best = vals.indexOf(askBig ? Math.max(...vals) : Math.min(...vals));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: ppl.map((p, i) => sc.line(p, D(vals[i]))).join('<br>') + `<br>${b(askBig ? sc.big : sc.small)}`,
            hint: 'קודם משווים שלמים. אם הם שווים — משווים עשיריות.',
            solution: [m(D(Math.min(...vals)) + ' &lt; ' + D(Math.max(...vals))), `התשובה: ${ppl[best].name}`],
          };
        }
        case 'story':
          return cmpStory(c, CMP_SC, 1, (sc) => {
            const W0 = c.rnd(sc.w[0], sc.w[1] - 1);
            return c.shuffle([W0 * 10 + c.rnd(6, 9), W0 * 10 + c.rnd(1, 5), (W0 + 1) * 10 + c.rnd(1, 4)]);
          });
        case 'order': {
          const W = c.rnd(0, 5), desc = level === 3 && c.chance(0.5);
          const vals = c.shuffle([W * 10 + c.rnd(6, 9), (W + 1) * 10 + c.rnd(1, 3), W * 10 + c.rnd(1, 5), (W + 1) * 10 + c.rnd(5, 9)]);
          const ans = sortIdx(vals, desc);
          return {
            type: 'order', items: vals.map((v) => D(v)), answer: ans,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `קודם ${c.g('מיין', 'מייני')} לפי השלמים. כשהשלמים שווים — לפי העשיריות.`,
            solution: [m(ans.map((i) => D(vals[i])).join(desc ? ' &gt; ' : ' &lt; '))],
          };
        }
        case 'frac': {
          const r = c.pick(['imp', 'mix', 'half']);
          let x, y, rh;
          if (r === 'imp') { x = c.rnd(11, 39); y = c.chance(0.25) ? x : Math.max(11, x + c.pick([-3, -2, -1, 1, 2, 3])); rh = m(F(y, 10)); }
          else if (r === 'mix') { const W = c.rnd(1, 5), t = c.rnd(1, 9); y = W * 10 + t; x = c.chance(0.25) ? y : y + c.pick([-2, -1, 1, 2]); rh = m(HM.mixed(W, t, 10)); }
          else { x = c.rnd(1, 9); y = 5; rh = m(F(1, 2)); }
          const sw = c.chance(0.5);
          return {
            type: 'compare', prompt: signPrompt(c), left: sw ? rh : D(x), right: sw ? D(x) : rh,
            lv: VAL(sw ? y : x), rv: VAL(sw ? x : y), answer: sw ? sgn(y, x) : sgn(x, y),
            hint: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${rh} = ${m(D(y))}`, sw ? m(D(y) + ' ' + sgnH(sgn(y, x)) + ' ' + D(x)) : m(D(x) + ' ' + sgnH(sgn(x, y)) + ' ' + D(y))],
          };
        }
        case 'between': {
          const W = c.rnd(0, 7), t1 = c.rnd(1, 3), t2 = t1 + c.rnd(4, 6);
          const A = W * 10 + t1, B = W * 10 + t2, cor = W * 10 + c.rnd(t1 + 1, t2 - 1);
          const wr = c.shuffle([B + c.rnd(1, 3), A - c.rnd(1, t1), (W + 1) * 10 + c.rnd(t1 + 1, t2 - 1)].concat(W ? [(W - 1) * 10 + c.rnd(t1 + 1, t2 - 1)] : [])).slice(0, 3);
          return {
            type: 'choice', choices: [D(cor)].concat(wr.map((v) => D(v))), answer: 0,
            prompt: `איזה מספר נמצא בין ${m(D(A))} ל-${m(D(B))}?`,
            hint: `המספר צריך להיות גדול מ-${m(D(A))} וגם קטן מ-${m(D(B))}. ${c.g('בדוק', 'בדקי')} קודם את השלמים.`,
            solution: [`${m(D(A) + ' &lt; ' + D(cor) + ' &lt; ' + D(B))} ✔`, `שאר המספרים קטנים מ-${m(D(A))} או גדולים מ-${m(D(B))}.`],
          };
        }
        case 'digit': {
          const v = c.rnd(0, 2);
          if (v === 0) {
            const W = c.rnd(0, 9), t = c.rnd(2, 9);
            return {
              type: 'number', answer: t - 1,
              prompt: `מה הספרה ה${b('גדולה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.` + HM.slot(0) + ` &lt; ${D(W * 10 + t)}`))}`,
              hint: `${c.g('נסה', 'נסי')} לכתוב במשבצת ספרות שונות, ו${c.g('בדוק', 'בדקי')} בכל פעם אם המשפט נכון.`,
              solution: [`${m(`${W}.${t - 1} &lt; ${D(W * 10 + t)}`)} ✔`, `${m(`${W}.${t}`)} שווה ל-${m(D(W * 10 + t))}, ולכן אינו קטן ממנו ✘`, `התשובה: ${t - 1}`],
            };
          }
          if (v === 1) {
            const W = c.rnd(0, 9), t = c.rnd(0, 8);
            return {
              type: 'number', answer: t + 1,
              prompt: `מה הספרה ה${b('קטנה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.` + HM.slot(0) + ` &gt; ${D(W * 10 + t)}`))}`,
              hint: `${c.g('נסה', 'נסי')} לכתוב במשבצת ספרות שונות, ו${c.g('בדוק', 'בדקי')} בכל פעם אם המשפט נכון.`,
              solution: [`${m(`${W}.${t}`)} שווה ל-${m(D(W * 10 + t))}, ולכן אינו גדול ממנו ✘`, `${m(`${W}.${t + 1} &gt; ${D(W * 10 + t)}`)} ✔`, `התשובה: ${t + 1}`],
            };
          }
          const W = c.rnd(1, 8), t = c.rnd(1, 8), d = c.rnd(1, 9), ans = d > t ? W : W + 1;
          return {
            type: 'number', answer: ans,
            prompt: `מה הספרה ה${b('קטנה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(HM.slot(0) + `.${d} &gt; ${D(W * 10 + t)}`))}`,
            hint: 'הספרה במשבצת היא ספרת השלמים. מה קורה כשהשלמים שווים?',
            solution: d > t
              ? [`${m(`${W}.${d} &gt; ${D(W * 10 + t)}`)} ✔ — השלמים שווים, ו-${d} עשיריות הן יותר מ-${t}.`, `${m(`${W - 1}.${d} &lt; ${D(W * 10 + t)}`)} ✘`, `התשובה: ${W}`]
              : [`${m(`${W}.${d}`)} ${d === t ? 'שווה ל-' : 'קטן מ-'}${m(D(W * 10 + t))} ✘`, `${m(`${W + 1}.${d} &gt; ${D(W * 10 + t)}`)} ✔`, `התשובה: ${W + 1}`],
          };
        }
        case 'closest': {
          const W = c.rnd(1, 5), ds = c.sample(HM.range(1, 9), 4);
          const vals = ds.map((d) => W * 10 + (c.chance(0.5) ? d : -d));
          const best = ds.indexOf(Math.min(...ds));
          return {
            type: 'choice', choices: vals.map((v) => D(v)), answer: best,
            prompt: `איזה מספר הכי קרוב ל-${W}?`,
            hint: `${c.g('חשב', 'חשבי')} לכל מספר: כמה עשיריות הוא רחוק מ-${W}?`,
            solution: [`המרחקים מ-${W}: ${vals.map((v, i) => `${m(D(v))} — ${nT(ds[i])}`).join('; ')}.`, `הכי קרוב: ${m(D(vals[best]))}`],
          };
        }
        case 'mid': {
          const lo = c.rnd(0, 3) * 10; let a, gap, mid;
          do { gap = c.pick([2, 4, 6, 8]); a = lo + c.rnd(0, 20 - gap); mid = a + gap / 2; } while (mid % 10 === 0);
          return {
            type: 'numberline', line: tLine(lo, lo + 20), answer: VAL(mid),
            prompt: `${c.g('סמן', 'סמני')} על הישר את המספר שנמצא בדיוק באמצע בין ${m(D(a))} ל-${m(D(a + gap))}.`,
            hint: `כמה עשיריות יש מ-${m(D(a))} עד ${m(D(a + gap))}? האמצע נמצא בחצי הדרך.`,
            solution: [`מ-${m(D(a))} עד ${m(D(a + gap))} יש ${gap} עשיריות.`, `חצי מהדרך: ${nT(gap / 2)}.`, `${m(D(a))} ועוד ${nT(gap / 2)} ← ${m(D(mid))}`],
          };
        }
        case 'tf': {
          if (c.chance(0.65)) {
            const W = c.rnd(1, 8); let x = (W - 1) * 10 + c.rnd(5, 9), y = W * 10 + c.rnd(1, 4);
            if (c.chance(0.4)) { x = W * 10 + c.rnd(1, 4); y = W * 10 + c.rnd(5, 9); }
            if (c.chance(0.5)) [x, y] = [y, x];
            const sym = c.pick(['<', '>']), ok = sgn(x, y) === sym;
            return {
              type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(m(`${D(x)} ${sgnH(sym)} ${D(y)}`))}`,
              hint: `קודם ${c.g('השווה', 'השווי')} את השלמים. אם הם שווים — את העשיריות.`,
              solution: [m(`${D(x)} ${sgnH(sgn(x, y))} ${D(y)}`), `לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
            };
          }
          const n = c.rnd(11, 39), y = n + c.pick([-6, -3, -1, 1, 3, 6]), ok = n > y;
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(`${n} עשיריות גדולות מ-${m(D(y))}`)}`,
            hint: 'כל 10 עשיריות הן שלם. איך כותבים את העשיריות כמספר עשרוני?',
            solution: [`${n} עשיריות = ${m(D(n))}`, `${m(`${D(n)} ${sgnH(sgn(n, y))} ${D(y)}`)}, לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'orderMix': {
          const W = c.rnd(0, 3), pool = HM.range(W * 10 + 1, W * 10 + 25).filter((v) => v % 10 !== 0);
          const vals = c.sample(pool, 4), desc = c.chance(0.4);
          const forms = c.shuffle(['d', 'd', 'f', 'x']);
          const items = vals.map((v, i) => (forms[i] === 'f' ? m(F(v, 10)) : forms[i] === 'x' && v > 10 ? m(HM.mixed(Math.floor(v / 10), v % 10, 10)) : D(v)));
          const ans = sortIdx(vals, desc);
          const conv = vals.map((v, i) => (items[i] === D(v) ? null : `${items[i]} = ${m(D(v))}`)).filter(Boolean);
          return {
            type: 'order', items, answer: ans,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `${c.g('כתוב', 'כתבי')} קודם את כל המספרים כמספרים עשרוניים, ואז ${c.g('סדר', 'סדרי')}.`,
            solution: [...(conv.length ? [conv.join(' , ')] : []), m(ans.map((i) => D(vals[i])).join(desc ? ' &gt; ' : ' &lt; '))],
          };
        }
        case 'storyMix': {
          // רמה 3: כל דמות כתבה את התוצאה בצורה אחרת
          const sc = c.scene(CMP_SC), ppl = crew(c, 3), W = c.rnd(sc.w[0], sc.w[1] - 1);
          const vals = c.shuffle([W * 10 + c.rnd(6, 9), W * 10 + c.rnd(1, 5), (W + 1) * 10 + c.rnd(1, 4)]);
          const shows = vals.map((v, i) => (i === 0 ? m(F(v, 10)) : i === 1 ? m(HM.mixed(Math.floor(v / 10), v % 10, 10)) : m(D(v))));
          const askBig = c.chance(0.5), best = vals.indexOf(askBig ? Math.max(...vals) : Math.min(...vals));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: ppl.map((p, i) => sc.line(p, shows[i])).join('<br>') + `<br>${b(askBig ? sc.big : sc.small)}`,
            hint: `${c.g('כתוב', 'כתבי')} את כל התוצאות כמספרים עשרוניים, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${shows[0]} = ${m(D(vals[0]))} , ${shows[1]} = ${m(D(vals[1]))}`, `מהקטן לגדול: ${m(vals.slice().sort((x, y) => x - y).map((v) => D(v)).join(' &lt; '))}`, `התשובה: ${ppl[best].name}`],
          };
        }
        case 'storyClose': {
          const sc = c.scene(CLOSE_SC), ppl = crew(c, 3), W = c.rnd(2, 6);
          const ds = c.sample(HM.range(1, 8), 3), vals = ds.map((d, i) => W * 10 + (i === 0 ? -d : i === 1 ? d : (c.chance(0.5) ? d : -d)));
          const best = ds.indexOf(Math.min(...ds));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: `${sc.goal(W)}<br>${ppl.map((p, i) => sc.line(p, D(vals[i]))).join('<br>')}<br>${b('מי הכי קרוב ליעד?')}`,
            hint: `${c.g('חשב', 'חשבי')} לכל אחד: כמה עשיריות חסרות או עודפות כדי להגיע בדיוק ל-${W}?`,
            solution: [ppl.map((p, i) => `${p.name}: ${nT(ds[i])} ${vals[i] < W * 10 ? 'פחות' : 'יותר'}`).join('; '), `הכי קרוב: ${ppl[best].name} (${m(D(vals[best]))})`],
          };
        }
      }
    },
  });

  /* ========== חיבור וחיסור — עשיריות ========== */
  // סיפורי חיבור / חיסור (A, B כבר מעוצבים כמחרוזות). max — הגבול העליון של A בעשיריות
  const AS_T = [
    { tags: ['sport'], u: 'ק"מ', max: 59,
      add: (p, A, B) => `${p.name} ${p.g('רץ', 'רצה')} בבוקר ${A} ק"מ ובערב עוד ${B} ק"מ. כמה ק"מ ${p.g('רץ', 'רצה')} בסך הכול?`,
      sub: (p, A, B) => `מסלול הריצה ארוך ${A} ק"מ. ${p.name} כבר ${p.g('רץ', 'רצה')} ${B} ק"מ. כמה ק"מ נשארו ${p.g('לו', 'לה')} לרוץ?` },
    { tags: ['nature'], u: 'ק"מ', max: 79,
      add: (p, A, B) => `ביום הראשון של הטיול ${p.name} ${p.g('הלך', 'הלכה')} ${A} ק"מ, וביום השני ${B} ק"מ. כמה ק"מ ${p.g('הלך', 'הלכה')} בשני הימים?`,
      sub: (p, A, B) => `שביל הטיול ארוך ${A} ק"מ. ${p.name} כבר ${p.g('הלך', 'הלכה')} ${B} ק"מ. כמה ק"מ נשארו ${p.g('לו', 'לה')} ללכת?` },
    { tags: ['baking'], u: 'ק"ג', max: 39,
      add: (p, A, B) => `${p.name} ${p.g('שם', 'שמה')} בקערה ${A} ק"ג קמח ו-${B} ק"ג סוכר. כמה ק"ג יש בקערה?`,
      sub: (p, A, B) => `בשק היו ${A} ק"ג קמח. ${p.name} ${p.g('לקח', 'לקחה')} ${B} ק"ג לאפיית לחמניות. כמה ק"ג קמח נשארו בשק?` },
    { tags: ['animals'], u: 'ק"ג', max: 79,
      add: (p, A, B) => `הגור של ${p.name} שקל ${A} ק"ג. בחודש האחרון הוא עלה במשקל עוד ${B} ק"ג. כמה הוא שוקל עכשיו?`,
      sub: (p, A, B) => `הכלב של ${p.name} שוקל ${A} ק"ג, והחתול ${p.g('שלו', 'שלה')} שוקל ${B} ק"ג. בכמה ק"ג הכלב כבד יותר מהחתול?` },
    { tags: ['space'], u: "מ'", max: 29,
      add: (p, A, B) => `${p.name} ${p.g('בנה', 'בנתה')} דגם טיל משני חלקים: החלק התחתון ארוך ${A} מטרים, והחלק העליון ${B} מטרים. מה האורך של כל הטיל?`,
      sub: (p, A, B, f) => `הטיל של ${p.name} עף לגובה ${A} מטרים, והטיל של ${f.name} עף לגובה ${B} מטרים. בכמה מטרים הטיל של ${p.name} עף גבוה יותר?` },
    { tags: ['music'], u: '₪', max: 79,
      add: (p, A, B) => `${p.name} ${p.g('קנה', 'קנתה')} מיתר לגיטרה ב-${A} ₪ ומפרט ב-${B} ₪. כמה ${p.g('שילם', 'שילמה')} בסך הכול?`,
      sub: (p, A, B) => `ל${p.name} היו ${A} ₪. ${p.g('הוא', 'היא')} ${p.g('קנה', 'קנתה')} מפרט לגיטרה ב-${B} ₪. כמה כסף נשאר ${p.g('לו', 'לה')}?` },
    { tags: ['games'], u: '₪', max: 79,
      add: (p, A, B) => `${p.name} ${p.g('חסך', 'חסכה')} ${A} ₪ למשחק חדש, ואז ${p.g('קיבל', 'קיבלה')} מסבתא עוד ${B} ₪. כמה כסף יש ${p.g('לו', 'לה')} עכשיו?`,
      sub: (p, A, B) => `משחק חדש לטלפון עולה ${A} ₪. ל${p.name} יש ${B} ₪. כמה כסף חסר ${p.g('לו', 'לה')}?` },
    { tags: ['art'], u: "מ'", max: 59,
      add: (p, A, B) => `${p.name} ${p.g('גזר', 'גזרה')} סרט אדום באורך ${A} מטרים וסרט כחול באורך ${B} מטרים. מה האורך של שני הסרטים יחד?`,
      sub: (p, A, B) => `בגליל היו ${A} מטרים של סרט. ${p.name} ${p.g('גזר', 'גזרה')} ממנו ${B} מטרים לעבודת יצירה. כמה מטרים נשארו בגליל?` },
    { tags: ['reading'], u: '₪', max: 79,
      add: (p, A, B) => `${p.name} ${p.g('קנה', 'קנתה')} ספר ב-${A} ₪ וסימנייה ב-${B} ₪. כמה ${p.g('שילם', 'שילמה')} בסך הכול?`,
      sub: (p, A, B) => `${p.name} ${p.g('בחר', 'בחרה')} בין שני ספרים: ספר הרפתקאות ב-${A} ₪ וספר קומיקס ב-${B} ₪. בכמה שקלים ספר ההרפתקאות יקר יותר?` },
    { tags: ['tech'], u: "מ'", max: 59,
      add: (p, A, B) => `הרובוט של ${p.name} נסע ${A} מטרים, עצר, ונסע עוד ${B} מטרים. כמה מטרים נסע בסך הכול?`,
      sub: (p, A, B) => `הרובוט של ${p.name} צריך לנסוע ${A} מטרים. הוא כבר נסע ${B} מטרים. כמה מטרים נשארו לו?` },
    { tags: ['kpop'], u: '₪', max: 79,
      add: (p, A, B) => `${p.name} ${p.g('קנה', 'קנתה')} פוטוקארד ב-${A} ₪ ומחזיק מפתחות של הלהקה ב-${B} ₪. כמה ${p.g('שילם', 'שילמה')} בסך הכול?`,
      sub: (p, A, B) => `מחזיק מפתחות של הלהקה עולה ${A} ₪. ל${p.name} יש ${B} ₪. כמה כסף חסר ${p.g('לו', 'לה')}?` },
    { tags: ['magic'], u: 'ליטר', max: 39,
      add: (p, A, B) => `בשיעור שיקויים ${p.name} ${p.g('מזג', 'מזגה')} לקלחת ${A} ליטר מי מעיין ועוד ${B} ליטר מיץ דלעת. כמה ליטרים יש בקלחת?`,
      sub: (p, A, B) => `בקלחת היו ${A} ליטר שיקוי. ${p.name} ${p.g('מזג', 'מזגה')} לבקבוקים ${B} ליטר. כמה ליטרים נשארו בקלחת?` },
    { tags: ['squishy'], u: '₪', max: 79,
      add: (p, A, B) => `${p.name} ${p.g('קנה', 'קנתה')} סקווישי בצורת תות ב-${A} ₪ ומדבקה לקופסת הסקווישים ב-${B} ₪. כמה ${p.g('שילם', 'שילמה')} בסך הכול?`,
      sub: (p, A, B) => `ל${p.name} היו ${A} ₪. ${p.g('הוא', 'היא')} ${p.g('קנה', 'קנתה')} סקווישי בצורת דונאט ב-${B} ₪. כמה כסף נשאר ${p.g('לו', 'לה')}?` },
  ];
  // רמה 3: סיפורים דו-שלביים. make מחזיר טקסט, תשובה (בעשיריות) ושלבי פתרון
  const shop2T = (tags, i1, i2) => ({ tags, u: '₪', make: (c, p) => {
    const T = c.rnd(3, 6) * 100, A = c.rnd(80, 200), B = c.rnd(30, T - A - 20);
    return { txt: `ל${p.name} היו ${D(T)} ₪. ${p.g('הוא', 'היא')} ${p.g('קנה', 'קנתה')} ${i1} ב-${D(A)} ₪ ו${i2} ב-${D(B)} ₪. כמה כסף נשאר ${p.g('לו', 'לה')}?`, ans: T - A - B,
      steps: [`כמה ${p.g('שילם', 'שילמה')}: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `כמה נשאר: ${m(`${D(T)} ${MN} ${D(A + B)} = ${D(T - A - B)}`)}`] };
  } });
  const AS2_T = [
    { tags: ['sport'], u: 'ק"מ', make: (c, p) => {
      const T = c.rnd(5, 9) * 10, A = c.rnd(12, 25), B = c.rnd(8, T - A - 5);
      return { txt: `מסלול הריצה של ${p.name} ארוך ${D(T)} ק"מ. בבוקר ${p.g('הוא', 'היא')} ${p.g('רץ', 'רצה')} ${D(A)} ק"מ, ובצהריים עוד ${D(B)} ק"מ. כמה ק"מ נשארו ${p.g('לו', 'לה')} לרוץ?`, ans: T - A - B,
        steps: [`כמה ${p.g('רץ', 'רצה')}: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `כמה נשאר: ${m(`${D(T)} ${MN} ${D(A + B)} = ${D(T - A - B)}`)}`] };
    } },
    { tags: ['nature'], u: 'ק"מ', make: (c, p) => {
      const T = c.rnd(6, 12) * 10, A = c.rnd(15, 35), B = c.rnd(10, T - A - 5);
      return { txt: `${p.name} ${p.g('יצא', 'יצאה')} לטיול של ${D(T)} ק"מ. עד המעיין ${p.g('הלך', 'הלכה')} ${D(A)} ק"מ, ומשם עד התצפית עוד ${D(B)} ק"מ. כמה ק"מ נשארו עד סוף הטיול?`, ans: T - A - B,
        steps: [`כמה ${p.g('הלך', 'הלכה')}: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `כמה נשאר: ${m(`${D(T)} ${MN} ${D(A + B)} = ${D(T - A - B)}`)}`] };
    } },
    { tags: ['baking'], u: 'ק"ג', make: (c, p) => {
      const T = c.rnd(3, 5) * 10, A = c.rnd(5, 12), B = c.rnd(3, T - A - 3);
      return { txt: `בשק היו ${D(T)} ק"ג קמח. ${p.name} ${p.g('לקח', 'לקחה')} ${D(A)} ק"ג לעוגה ו-${D(B)} ק"ג ללחמניות. כמה ק"ג קמח נשארו בשק?`, ans: T - A - B,
        steps: [`כמה נלקח: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `כמה נשאר: ${m(`${D(T)} ${MN} ${D(A + B)} = ${D(T - A - B)}`)}`] };
    } },
    { tags: ['animals'], u: 'ק"ג', make: (c, p) => {
      const T = c.rnd(25, 60), A = c.rnd(3, 9), B = c.rnd(2, 8);
      return { txt: `הכלבה של ${p.name} שקלה ${D(T)} ק"ג. בחודש הראשון היא עלתה במשקל ${D(A)} ק"ג, ובחודש השני ירדה ${D(B)} ק"ג. כמה היא שוקלת עכשיו?`, ans: T + A - B,
        steps: [`אחרי החודש הראשון: ${m(`${D(T)} + ${D(A)} = ${D(T + A)}`)}`, `אחרי החודש השני: ${m(`${D(T + A)} ${MN} ${D(B)} = ${D(T + A - B)}`)}`] };
    } },
    { tags: ['tech', 'space'], u: "מ'", make: (c, p) => {
      const A = c.rnd(15, 40), B = c.rnd(8, 25), C = c.rnd(5, A + B - 5);
      return { txt: `הרובוט של ${p.name} נסע ${D(A)} מטרים קדימה, אחר כך עוד ${D(B)} מטרים קדימה, ואז ${D(C)} מטרים אחורה. כמה מטרים הוא רחוק מנקודת ההתחלה?`, ans: A + B - C,
        steps: [`קדימה: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `אחורה: ${m(`${D(A + B)} ${MN} ${D(C)} = ${D(A + B - C)}`)}`] };
    } },
    shop2T(['games'], 'חבילת קלפים', 'מדבקות'),
    shop2T(['music'], 'מיתר לגיטרה', 'מפרט'),
    shop2T(['art'], 'צבעי גואש', 'מכחול'),
    shop2T(['reading'], 'ספר', 'סימנייה'),
    shop2T(['kpop'], 'מקל אור להופעה', 'פוטוקארד'),
    shop2T(['squishy'], 'סקווישי בצורת פנדה', 'קופסה לאוסף'),
    { tags: ['magic'], u: 'ליטר', make: (c, p) => {
      const T = c.rnd(3, 6) * 10, A = c.rnd(5, 15), B = c.rnd(3, T - A - 3);
      return { txt: `בקלחת של ${p.name} היו ${D(T)} ליטר שיקוי. ${p.g('הוא', 'היא')} ${p.g('מזג', 'מזגה')} ${D(A)} ליטר לבקבוק אחד, ו-${D(B)} ליטר לבקבוק שני. כמה ליטרים נשארו בקלחת?`, ans: T - A - B,
        steps: [`כמה נמזג: ${m(`${D(A)} + ${D(B)} = ${D(A + B)}`)}`, `כמה נשאר: ${m(`${D(T)} ${MN} ${D(A + B)} = ${D(T - A - B)}`)}`] };
    } },
  ];
  function addStepsT(x, y) {
    const s = x + y;
    return [`${m(D(x))} = ${nT(x)}, ${m(D(y))} = ${nT(y)}.`,
      `${m(`${x} + ${y} = ${s}`)}, כלומר ${nT(s)}${s >= 10 ? `. כל 10 עשיריות הן שלם: ${m(D(s))}` : ''}.`,
      m(`${D(x)} + ${D(y)} = ${D(s)}`)];
  }
  function subStepsT(x, y) {
    const s = x - y;
    return [`${m(D(x))} = ${nT(x)}, ${m(D(y))} = ${nT(y)}.`,
      `${m(`${x} ${MN} ${y} = ${s}`)}, כלומר ${nT(s)}${s >= 10 ? ` = ${m(D(s))}` : ''}.`,
      m(`${D(x)} ${MN} ${D(y)} = ${D(s)}`)];
  }
  const noWhole = (n) => n % 10 !== 0;

  HM.lesson({
    id: 'dec-addsub-tenths',
    learn: (c) => [
      {
        title: 'מחברים עשיריות כמו תפוחים',
        html: `${c.name} ${c.g('מזג', 'מזגה')} לכוס ${m('0.4')} ליטר מיץ, ואחר כך עוד ${m('0.3')} ליטר.<br>4 עשיריות ועוד 3 עשיריות הן ${b('7 עשיריות')} — בדיוק כמו 4 תפוחים ועוד 3 תפוחים.<br>${m('0.4 + 0.3 = 0.7')}`,
        visual: strip2(4, 3),
      },
      {
        title: '10 עשיריות = שלם',
        html: `${m('0.6 + 0.7')}: 6 עשיריות ועוד 7 עשיריות הן ${b('13 עשיריות')}.<br>10 עשיריות הן שלם אחד, ולכן 13 עשיריות הן ${m('1.3')}.<br><div class="note">זהירות: ${m('0.6 + 0.7')} אינו ${m('0.13')}!</div>`,
        visual: addStrips(6, 7),
      },
      {
        title: 'שלמים עם שלמים, עשיריות עם עשיריות',
        html: `${m('2.4 + 1.3')}:<br>• שלמים: ${m('2 + 1 = 3')}<br>• עשיריות: ${m('0.4 + 0.3 = 0.7')}<br>• ביחד: ${m('2.4 + 1.3 = 3.7')}`,
        visual: V.numberLine({ min: 2, max: 4, den: 10, labels: (v, i) => ([0, 4, 10, 14, 17, 20].indexOf(i) >= 0 ? D(20 + i) : null), jumps: [{ from: 2.4, to: 3.4, label: '+1' }, { from: 3.4, to: 3.7, label: '+0.3' }] }),
      },
      {
        title: 'דוגמה: חיסור עשיריות',
        html: `כמה זה ${m('1.2 − 0.5')}?`,
        visual: V.numberLine({ min: 0, max: 2, den: 10, labels: (v, i) => ([0, 7, 10, 12, 20].indexOf(i) >= 0 ? D(i) : null), jumps: [{ from: 1.2, to: 0.7, label: '−0.5' }] }),
        steps: [
          `${m('1.2')} הם 12 עשיריות, ו-${m('0.5')} הם 5 עשיריות.`,
          `${m('12 − 5 = 7')} — נשארות 7 עשיריות.`,
          `${m('1.2 − 0.5 = 0.7')} ✔`,
        ],
      },
      {
        title: 'דוגמה: מספר חסר',
        html: `איזה מספר חסר? ${m('0.8 + ' + HM.box() + ' = 1.5')}`,
        visual: V.numberLine({ min: 0.5, max: 1.5, den: 10, labels: (v, i) => ([3, 5, 10].indexOf(i) >= 0 ? D(5 + i) : null), jumps: [{ from: 0.8, to: 1, label: '+0.2' }, { from: 1, to: 1.5, label: '+0.5' }] }),
        steps: [
          `קודם משלימים ל-1: ${m('0.8 + 0.2 = 1')}.`,
          `מ-1 עד ${m('1.5')} חסרים עוד ${m('0.5')}.`,
          `ביחד: ${m('0.2 + 0.5 = 0.7')}, ולכן ${m('0.8 + 0.7 = 1.5')} ✔`,
          `אפשר גם בחיסור: ${m('1.5 − 0.8 = 0.7')}.`,
        ],
      },
      {
        title: c.g('נסה בעצמך', 'נסי בעצמך'),
        html: `${c.name}, ${c.g('זכור', 'זכרי')}: כל 10 עשיריות הן שלם אחד.`,
        quiz: {
          type: 'number', decimal: true, answer: 1.3, prompt: `${c.g('חשב', 'חשבי')}:${big(m('0.9 + 0.4 = ' + HM.slot(0)))}`,
          hint: 'כמה עשיריות יש ביחד?', solution: addStepsT(9, 4),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['addNo', 'subNo', 'to1', 'nlJump', 'addWhole', 'story', 'story', 'story', 'story']
        : level === 2 ? ['addCarry', 'subBorrow', 'missAdd', 'errChoice', 'nlJump', 'story', 'story', 'story', 'story']
        : ['missSub', 'missMin', 'chain', 'cmpExpr', 'tf', 'nlBack', 'story2', 'story2', 'story2', 'story2'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'addNo': {
          const a = c.rnd(1, 8), z = c.rnd(1, 9 - a);
          return {
            type: 'number', decimal: true, answer: VAL(a + z), visual: strip2(a, z),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} + ${D(z)} = ` + HM.slot(0)))}`,
            hint: 'כל משבצת היא עשירית. כמה עשיריות יש ביחד?',
            solution: addStepsT(a, z),
          };
        }
        case 'subNo': {
          const a = c.rnd(3, 9), z = c.rnd(1, a - 1);
          return {
            type: 'number', decimal: true, answer: VAL(a - z), visual: strip(a),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} ${MN} ${D(z)} = ` + HM.slot(0)))}`,
            hint: `${m(D(a))} = ${nT(a)}. כמה נשאר אם מורידים ${nT(z)}?`,
            solution: subStepsT(a, z),
          };
        }
        case 'to1': {
          const a = c.rnd(1, 9);
          return {
            type: 'number', decimal: true, answer: VAL(10 - a), visual: strip(a),
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:${big(m(`${D(a)} + ` + HM.slot(0) + ' = 1'))}`,
            hint: 'בשלם יש 10 עשיריות. כמה עשיריות חסרות?',
            solution: [`ב-1 יש 10 עשיריות, וב-${m(D(a))} יש ${nT(a)}.`, `${m(`10 ${MN} ${a} = ${10 - a}`)} — זה מה שחסר: ${nT(10 - a)}.`, `${m(`${D(a)} + ${D(10 - a)} = 1`)} ✔`],
          };
        }
        case 'addWhole': {
          const t1 = c.rnd(1, 8), t2 = c.rnd(1, 9 - t1), W1 = c.rnd(1, 5), W2 = c.rnd(0, 4);
          const a = W1 * 10 + t1, z = W2 * 10 + t2;
          return {
            type: 'number', decimal: true, answer: VAL(a + z),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} + ${D(z)} = ` + HM.slot(0)))}`,
            hint: `${c.g('חבר', 'חברי')} שלמים לשלמים ועשיריות לעשיריות.`,
            solution: [`שלמים: ${m(`${W1} + ${W2} = ${W1 + W2}`)}`, `עשיריות: ${m(`${D(t1)} + ${D(t2)} = ${D(t1 + t2)}`)}`, m(`${D(a)} + ${D(z)} = ${D(a + z)}`)],
          };
        }
        case 'nlJump': {
          let s, j;
          do { s = c.rnd(1, level === 1 ? 9 : 15); j = c.rnd(2, 9); } while (s + j > 19 || !noWhole(s + j) || (level === 2 && Math.floor(s / 10) === Math.floor((s + j) / 10)));
          const r = s + j;
          return {
            type: 'numberline', line: tLine(0, 20), answer: VAL(r),
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(`${D(s)} + ${D(j)}`)}.`,
            hint: `${c.g('התחל', 'התחילי')} ב-${m(D(s))} ו${c.g('התקדם', 'התקדמי')} ${nT(j)} ימינה.`,
            solution: [Math.floor(s / 10) !== Math.floor(r / 10) ? `מ-${m(D(s))} עד ${Math.ceil(s / 10)} יש ${nT(Math.ceil(s / 10) * 10 - s)}, ומשם עוד ${nT(r - Math.ceil(s / 10) * 10)}.` : `מתחילים ב-${m(D(s))} ומתקדמים ${nT(j)}.`, m(`${D(s)} + ${D(j)} = ${D(r)}`)],
          };
        }
        case 'nlBack': {
          let s, j;
          do { s = c.rnd(11, 19); j = c.rnd(3, 9); } while (s % 10 >= j || !noWhole(s - j));
          return {
            type: 'numberline', line: tLine(0, 20), answer: VAL(s - j),
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את התוצאה של ${m(`${D(s)} ${MN} ${D(j)}`)}.`,
            hint: `${c.g('התחל', 'התחילי')} ב-${m(D(s))} ו${c.g('חזור', 'חזרי')} ${nT(j)} שמאלה.`,
            solution: [`מ-${m(D(s))} חוזרים ${nT(s - 10)} עד 1, ומשם עוד ${nT(j - (s - 10))}.`, m(`${D(s)} ${MN} ${D(j)} = ${D(s - j)}`)],
          };
        }
        case 'addCarry': {
          let t1, t2; do { t1 = c.rnd(2, 9); t2 = c.rnd(2, 9); } while (t1 + t2 < 11);
          const a = c.rnd(0, 4) * 10 + t1, z = c.rnd(0, 3) * 10 + t2;
          return {
            type: 'number', decimal: true, answer: VAL(a + z),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} + ${D(z)} = ` + HM.slot(0)))}`,
            hint: `${c.g('חבר', 'חברי')} עשיריות לעשיריות. אם יש 10 עשיריות או יותר — הן הופכות לשלם!`,
            solution: addStepsT(a, z),
          };
        }
        case 'subBorrow': {
          let t1, t2; do { t1 = c.rnd(0, 8); t2 = c.rnd(1, 9); } while (t1 >= t2);
          const W1 = c.rnd(1, 6), a = W1 * 10 + t1, z = c.rnd(0, W1 - 1) * 10 + t2;
          return {
            type: 'number', decimal: true, answer: VAL(a - z),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} ${MN} ${D(z)} = ` + HM.slot(0)))}`,
            hint: `אין מספיק עשיריות? ${c.g('חשוב', 'חשבי')} על ${m(D(a))} כעל ${nT(a)}.`,
            solution: subStepsT(a, z),
          };
        }
        case 'missAdd': {
          const a = c.rnd(3, 45), d = c.rnd(3, 25), s = a + d, first = c.chance(0.7);
          return {
            type: 'number', decimal: true, answer: VAL(d),
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:${big(m(first ? `${D(a)} + ` + HM.slot(0) + ` = ${D(s)}` : HM.slot(0) + ` + ${D(a)} = ${D(s)}`))}`,
            hint: `מה צריך להוסיף ל-${m(D(a))} כדי להגיע ל-${m(D(s))}? אפשר לחשב בחיסור.`,
            solution: [m(`${D(s)} ${MN} ${D(a)} = ${D(d)}`), `בדיקה: ${m(`${D(a)} + ${D(d)} = ${D(s)}`)} ✔`],
          };
        }
        case 'errChoice': {
          if (c.chance(0.5)) {
            let t1, t2; do { t1 = c.rnd(2, 9); t2 = c.rnd(2, 9); } while (t1 + t2 < 11);
            const s = t1 + t2;
            return Object.assign(decChoices(s * 10, [s, s * 100, (s - 10) * 10], 2), {
              type: 'choice', prompt: `כמה זה ${m(`${D(t1)} + ${D(t2)}`)}?`,
              hint: 'כמה עשיריות יש ביחד? כמה מהן יוצרות שלם?',
              solution: addStepsT(t1, t2),
            });
          }
          let t1, t2; do { t1 = c.rnd(0, 8); t2 = c.rnd(1, 9); } while (t1 >= t2);
          const W = c.rnd(1, 5), a = W * 10 + t1, d = a - t2;
          return Object.assign(decChoices(d, [W * 10 + (t2 - t1), W * 10 + (t1 + 10 - t2), d * 10], 1), {
            type: 'choice', prompt: `כמה זה ${m(`${D(a)} ${MN} ${D(t2)}`)}?`,
            hint: `${c.g('חשוב', 'חשבי')} בעשיריות: כמה עשיריות יש ב-${m(D(a))}?`,
            solution: subStepsT(a, t2),
          });
        }
        case 'missSub': {
          const a = c.rnd(15, 59), cc = c.rnd(3, a - 5);
          return {
            type: 'number', decimal: true, answer: VAL(a - cc),
            prompt: `${c.g('השלם', 'השלימי')} את המחסר החסר:${big(m(`${D(a)} ${MN} ` + HM.slot(0) + ` = ${D(cc)}`))}`,
            hint: `כמה צריך להוריד מ-${m(D(a))} כדי להגיע ל-${m(D(cc))}?`,
            solution: [m(`${D(a)} ${MN} ${D(cc)} = ${D(a - cc)}`), `בדיקה: ${m(`${D(a)} ${MN} ${D(a - cc)} = ${D(cc)}`)} ✔`],
          };
        }
        case 'missMin': {
          const z = c.rnd(5, 35), cc = c.rnd(5, 35);
          return {
            type: 'number', decimal: true, answer: VAL(z + cc),
            prompt: `${c.g('השלם', 'השלימי')} את המחוסר החסר:${big(m(HM.slot(0) + ` ${MN} ${D(z)} = ${D(cc)}`))}`,
            hint: 'המחוסר הוא המספר שממנו מחסרים. איזו פעולה הפוכה לחיסור?',
            solution: [`חיבור הוא הפעולה ההפוכה: ${m(`${D(cc)} + ${D(z)} = ${D(z + cc)}`)}`, `בדיקה: ${m(`${D(z + cc)} ${MN} ${D(z)} = ${D(cc)}`)} ✔`],
          };
        }
        case 'chain': {
          const a = c.rnd(5, 35), z = c.rnd(5, 35), w = c.rnd(3, a + z - 3), addFirst = c.chance(0.5);
          if (addFirst) {
            return {
              type: 'number', decimal: true, answer: VAL(a + z - w),
              prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(a)} + ${D(z)} ${MN} ${D(w)} = ` + HM.slot(0)))}`,
              hint: `${c.g('פתור', 'פתרי')} לפי הסדר: קודם החיבור, אחר כך החיסור.`,
              solution: [m(`${D(a)} + ${D(z)} = ${D(a + z)}`), m(`${D(a + z)} ${MN} ${D(w)} = ${D(a + z - w)}`)],
            };
          }
          const A = a + z;
          return {
            type: 'number', decimal: true, answer: VAL(A - w + z),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(A)} ${MN} ${D(w)} + ${D(z)} = ` + HM.slot(0)))}`,
            hint: `${c.g('פתור', 'פתרי')} לפי הסדר: קודם החיסור, אחר כך החיבור.`,
            solution: [m(`${D(A)} ${MN} ${D(w)} = ${D(A - w)}`), m(`${D(A - w)} + ${D(z)} = ${D(A - w + z)}`)],
          };
        }
        case 'cmpExpr': {
          const a = c.rnd(5, 29), z = c.rnd(5, 29), L = a + z, R = Math.max(1, L + c.pick([-2, -1, 0, 1, 2]));
          const y = c.rnd(3, 19), x = R + y, sub = c.chance(0.6);
          const right = sub ? `${D(x)} ${MN} ${D(y)}` : D(R);
          return {
            type: 'compare', prompt: signPrompt(c), left: `${D(a)} + ${D(z)}`, right, lv: VAL(L), rv: VAL(R), answer: sgn(L, R),
            hint: `${c.g('חשב', 'חשבי')} כל צד בנפרד, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [m(`${D(a)} + ${D(z)} = ${D(L)}`), ...(sub ? [m(`${D(x)} ${MN} ${D(y)} = ${D(R)}`)] : []), m(`${D(L)} ${sgnH(sgn(L, R))} ${D(R)}`)],
          };
        }
        case 'tf': {
          const f = c.friend();
          if (c.chance(0.5)) {
            let t1, t2; do { t1 = c.rnd(2, 9); t2 = c.rnd(2, 9); } while (t1 + t2 < 11);
            const s = t1 + t2, ok = c.chance(0.4);
            return {
              type: 'tf', answer: ok,
              prompt: `${f.name} ${f.g('חישב', 'חישבה')}:${big(m(`${D(t1)} + ${D(t2)} = ${ok ? D(s) : D(s, 2)}`))}${f.g('האם הוא צודק?', 'האם היא צודקת?')}`,
              hint: `${c.g('חשב', 'חשבי')} בעצמך ו${c.g('השווה', 'השווי')}.`,
              solution: [...addStepsT(t1, t2).slice(1), ok ? 'החישוב נכון.' : `החישוב לא נכון: ${nT(s)} הן יותר משלם אחד, ולא ${m(D(s, 2))}.`],
            };
          }
          let t1, t2; do { t1 = c.rnd(0, 8); t2 = c.rnd(1, 9); } while (t1 >= t2);
          const W = c.rnd(1, 5), a = W * 10 + t1, ok = c.chance(0.4), shown = ok ? a - t2 : W * 10 + (t2 - t1);
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}:${big(m(`${D(a)} ${MN} ${D(t2)} = ${D(shown)}`))}${f.g('האם הוא צודק?', 'האם היא צודקת?')}`,
            hint: `אפשר לבדוק בחיבור: ${c.g('חבר', 'חברי')} את התוצאה ואת ${m(D(t2))} — האם יוצא ${m(D(a))}?`,
            solution: [m(`${D(a)} ${MN} ${D(t2)} = ${D(a - t2)}`), `בדיקה: ${m(`${D(shown)} + ${D(t2)} = ${D(shown + t2)}`)} ${ok ? '✔' : `ולא ${m(D(a))} ✘`}`, ok ? 'החישוב נכון.' : 'החישוב לא נכון.'],
          };
        }
        case 'story': {
          const sc = c.scene(AS_T), p = hero(c), f = c.friend(), isAdd = c.chance(0.5);
          let A, B;
          if (level === 1) {
            if (isAdd) { const t1 = c.rnd(1, 7), t2 = c.rnd(1, 9 - t1); A = c.rnd(1, Math.min(4, Math.floor(sc.max / 10))) * 10 + t1; B = c.rnd(0, 1) * 10 + t2; }
            else { const t2 = c.rnd(1, 7), t1 = c.rnd(t2 + 1, 9), W1 = c.rnd(2, Math.min(5, Math.floor(sc.max / 10))); A = W1 * 10 + t1; B = c.rnd(1, W1 - 1) * 10 + t2; }
          } else if (isAdd) {
            let t1, t2; do { t1 = c.rnd(2, 9); t2 = c.rnd(2, 9); } while (t1 + t2 < 11);
            A = c.rnd(1, Math.floor(sc.max / 10) - 1) * 10 + t1; B = c.rnd(0, 2) * 10 + t2;
          } else {
            let t1, t2; do { t1 = c.rnd(0, 8); t2 = c.rnd(1, 9); } while (t1 >= t2);
            const W1 = c.rnd(2, Math.floor(sc.max / 10)); A = W1 * 10 + t1; B = c.rnd(1, W1 - 1) * 10 + t2;
          }
          const ans = isAdd ? A + B : A - B;
          return {
            type: 'number', decimal: true, answer: VAL(ans), unit: sc.u,
            prompt: isAdd ? sc.add(p, D(A), D(B)) : sc.sub(p, D(A), D(B), f),
            hint: isAdd ? `זו שאלת חיבור. ${c.g('חבר', 'חברי')} שלמים לשלמים ועשיריות לעשיריות.` : `זו שאלת חיסור: ${m(`${D(A)} ${MN} ${D(B)}`)}. אפשר לחשוב בעשיריות.`,
            solution: isAdd ? addStepsT(A, B) : subStepsT(A, B),
          };
        }
        case 'story2': {
          const sc = c.scene(AS2_T), p = hero(c), r = sc.make(c, p);
          return {
            type: 'number', decimal: true, answer: VAL(r.ans), unit: sc.u, prompt: r.txt,
            hint: 'יש כאן שני שלבים. מה צריך לחשב קודם?',
            solution: r.steps.concat([`התשובה: ${m(D(r.ans))} ${sc.u}`]),
          };
        }
      }
    },
  });

  /* ========== המאית (א) ========== */
  // חנות: cheap — פריט זול (באגורות), item / item2 — פריטים רגילים
  const SHOP = [
    { tags: ['baking'], cheap: 'סוכרייה', item: 'חבילת סוכריות צבעוניות לעוגה', item2: 'תבנית לעוגיות' },
    { tags: ['sport'], cheap: 'מדבקה של שחקן כדורגל', item: 'בקבוק מים לאימון', item2: 'משרוקית' },
    { tags: ['games'], cheap: 'קלף למשחק', item: 'חבילת קלפים', item2: 'מחזיק מפתחות של דמות מהמשחק' },
    { tags: ['art'], cheap: 'מחק צבעוני', item: 'קופסת טושים', item2: 'בלוק ציור' },
    { tags: ['reading'], cheap: 'סימנייה', item: 'חוברת קומיקס', item2: 'ספר הרפתקאות' },
    { tags: ['music'], cheap: 'מפרט לגיטרה', item: 'מיתר לגיטרה', item2: 'מחברת תווים' },
    { tags: ['nature'], cheap: 'שקית זרעים', item: 'כובע טיול', item2: 'מימייה' },
    { tags: ['animals'], cheap: 'חטיף לכלב', item: 'צעצוע לחתול', item2: 'קערת אוכל לכלב' },
    { tags: ['space'], cheap: 'מדבקת כוכב זוהרת', item: 'פוסטר של מערכת השמש', item2: 'פנס ראש' },
    { tags: ['tech'], cheap: 'נורת לד קטנה', item: 'סוללה לרובוט', item2: 'כבל לרובוט' },
    { tags: ['kpop'], cheap: 'מדבקה של הלהקה', item: 'מקל אור להופעה', item2: 'אלבום של הלהקה' },
    { tags: ['magic'], cheap: 'נוצה לכתיבת לחשים', item: 'שרביט קסמים מעץ', item2: 'ספר לחשים' },
    { tags: ['squishy'], cheap: 'סקווישי זעיר בצורת תות', item: 'סקווישי בצורת פנדה', item2: 'קופסה לאוסף הסקווישים' },
  ];
  const ag = (k) => HM.cnt(k, 'אגורה', 'אגורות', true);
  // אורך בס"מ כמילים: "מטר אחד ו-5 ס"מ"
  const mcm = (cm) => { const W = Math.floor(cm / 100), r = cm % 100; return !W ? `${r} ס"מ` : !r ? meters(W) : `${meters(W)} ו-${r} ס"מ`; };
  const CM_SC = [
    { tags: ['sport'], r: [140, 320], txt: (p, L) => `${p.name} ${p.g('קפץ', 'קפצה')} בקפיצה לרוחק ${L}.`, ask: (p) => `כמה מטרים ${p.g('קפץ', 'קפצה')}?` },
    { tags: ['nature'], r: [35, 160], txt: (p, L) => `שתיל החמנייה ש${p.name} ${p.g('שתל', 'שתלה')} גבוה ${L}.`, ask: () => 'מה גובה השתיל במטרים?' },
    { tags: ['animals'], r: [101, 260], txt: (p, L) => `${p.name} ${p.g('ראה', 'ראתה')} בגן החיות נחש באורך ${L}.`, ask: () => 'מה אורך הנחש במטרים?' },
    { tags: ['art'], r: [45, 250], txt: (p, L) => `${p.name} ${p.g('גזר', 'גזרה')} סרט באורך ${L}.`, ask: () => 'מה אורך הסרט במטרים?' },
    { tags: ['tech'], r: [101, 380], txt: (p, L) => `הרובוט של ${p.name} נסע ${L}.`, ask: () => 'כמה מטרים נסע הרובוט?' },
    { tags: ['music'], r: [85, 104], txt: (p, L) => `אורך הגיטרה של ${p.name} הוא ${L}.`, ask: () => 'מה אורך הגיטרה במטרים?' },
    { tags: ['space'], r: [60, 140], txt: (p, L) => `הטלסקופ של ${p.name} ארוך ${L}.`, ask: () => 'מה אורך הטלסקופ במטרים?' },
    { tags: ['reading'], r: [70, 180], txt: (p, L) => `מדף הספרים של ${p.name} ארוך ${L}.`, ask: () => 'מה אורך המדף במטרים?' },
    { tags: ['baking'], r: [25, 120], txt: (p, L) => `${p.name} ${p.g('אפה', 'אפתה')} עוגה ארוכה באורך ${L}.`, ask: () => 'מה אורך העוגה במטרים?' },
    { tags: ['kpop'], r: [40, 95], txt: (p, L) => `מקל האור של ${p.name} להופעה ארוך ${L}.`, ask: () => 'מה אורך מקל האור במטרים?' },
    { tags: ['magic'], r: [101, 190], txt: (p, L) => `המטאטא המעופף של ${p.name} ארוך ${L}.`, ask: () => 'מה אורך המטאטא במטרים?' },
    { tags: ['squishy'], r: [105, 240], txt: (p, L) => `${p.name} ${p.g('סידר', 'סידרה')} את הסקווישים ${p.g('שלו', 'שלה')} בשורה באורך ${L}.`, ask: () => 'מה אורך השורה במטרים?' },
    { tags: ['games'], r: [45, 130], txt: (p, L) => `מסך המחשב של ${p.name} רחב ${L}.`, ask: () => 'מה רוחב המסך במטרים?' },
  ];
  // ס"מ שמתאים לטווח, עם ספרת עשרות 0 לפעמים (105 ס"מ = 1.05 מ')
  function pickCm(c, r, small) {
    let x, g = 0;
    do { x = c.rnd(r[0], r[1]); g++; } while (g < 30 && (x % 10 === 0 || (small && x >= 100) || (!small && x < 100 && r[1] >= 100)));
    if (!small && x >= 100 && c.chance(0.3)) { const z = Math.floor(x / 100) * 100 + c.rnd(1, 9); if (z >= r[0] && z <= r[1]) x = z; }
    return x;
  }

  HM.lesson({
    id: 'dec-hund-a',
    learn: (c) => [
      {
        title: 'שקל ומאה אגורות',
        html: `${c.name} ${c.g('מצא', 'מצאה')} בכיס ${b('35 אגורות')}.<br>בשקל יש ${b('100 אגורות')}, ולכן כל אגורה היא ${b('מאית')} שקל: ${m(F(1, 100) + ' = 0.01')}.<br>35 אגורות הן ${m(F(35, 100))} שקל, ובמספר עשרוני: ${m('0.35')} ₪.`,
        visual: sq(35),
      },
      {
        title: 'בעשירית יש 10 מאיות',
        html: `הריבוע הגדול הוא ${b('שלם')}, ויש בו 100 משבצות — כל משבצת היא ${b('מאית')}.<br>שורה אחת, 10 משבצות, היא ${b('עשירית')}.<br>לכן ${b('בעשירית יש 10 מאיות')}, ו${b('בשלם יש 100 מאיות')}.`,
        visual: sq(10),
      },
      {
        title: 'עשיריות ומאיות במספר',
        html: `ב-${m('0.35')} יש ${b('3 עשיריות')} (3 שורות) ועוד ${b('5 מאיות')} (5 משבצות).<br>הספרה הראשונה אחרי הנקודה היא ספרת ה${b('עשיריות')}, והשנייה — ספרת ה${b('מאיות')}.<br>אפשר לקרוא: "שלושים וחמש מאיות".`,
        visual: V.decTable('0.35'),
      },
      {
        title: 'הצגה מורחבת',
        html: `${c.g('בוא', 'בואי')} נפרק את ${m('1.35')} לפי ערך המקום של כל ספרה:`,
        visual: V.decTable('1.35'),
        steps: [
          `הספרה 1 — ${b('שלם אחד')}: ${m('1')}`,
          `הספרה 3 — ${b('שלוש עשיריות')}: ${m(F(3, 10))}`,
          `הספרה 5 — ${b('חמש מאיות')}: ${m(F(5, 100))}`,
          `${m('1.35 = 1 + ' + F(3, 10) + ' + ' + F(5, 100))} ✔`,
        ],
      },
      {
        title: 'מאיות על ישר המספרים',
        html: `${c.g('דמיין', 'דמייני')} זכוכית מגדלת על הקטע שבין ${m('0.3')} ל-${m('0.4')}. מחלקים אותו ל-10 חלקים שווים, וכל חלק הוא ${b('מאית')}.<br>${m('0.37')} נמצא 7 מאיות אחרי ${m('0.3')} — קרוב יותר ל-${m('0.4')}.`,
        visual: V.numberLine(Object.assign(zLine(30, 10, 2, (i) => i === 0 || i === 5 || i === 10), { marks: [{ v: 0.37, label: '0.37' }] })),
      },
      {
        title: 'אפסים: מתי הם משנים?',
        html: `• ${m('0.5 = 0.50')}: חמש עשיריות הן חמישים מאיות. אפס ${b('בסוף')} לא משנה את המספר.<br>• ${m('0.05 ≠ 0.5')}: האפס שאחרי הנקודה מזיז את ה-5 למקום המאיות — רק 5 מאיות!`,
        visual: `<div class="row">${sq(50, { maxw: 140 })}${sq(5, { maxw: 140 })}</div>`,
        quiz: {
          type: 'number', answer: 40, prompt: `${c.g('השלם', 'השלימי')}:${big(m('0.4 = ' + HM.slot(0)) + ' מאיות')}`,
          hint: 'בכל עשירית יש 10 מאיות.',
          solution: [`${m('0.4')} הן ארבע עשיריות, ובכל עשירית יש 10 מאיות.`, `${m('0.4 = 0.40')} ← 40 מאיות`],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['readGrid', 'shadeGrid', 'frac100', 'tenthToHund', 'nlHund', 'money', 'money', 'cm0', 'cm0']
        : level === 2 ? ['expanded', 'nlHund', 'digitValue', 'zeros', 'relation', 'money2', 'money2', 'measure', 'measure']
        : ['placePoint', 'expSum', 'hundToDec', 'pickGrid', 'shadeTenths', 'nlWords', 'storyCmp', 'storyCmp', 'storyInv', 'storyInv'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'readGrid': {
          let k; do { k = c.rnd(1, 99); } while (k % 10 === 0);
          const rows = Math.floor(k / 10), r = k % 10;
          return {
            type: 'number', decimal: true, answer: VAL(k, 2), visual: sq(k),
            prompt: 'הריבוע הגדול הוא שלם אחד. איזה מספר עשרוני מתאר את החלק הצבוע?',
            hint: 'בריבוע יש 100 משבצות, וכל משבצת היא מאית. כל שורה מלאה היא עשירית.',
            solution: [`${rows ? `${HM.cnt(rows, 'שורה מלאה', 'שורות מלאות', true)} (${rows * 10} משבצות) ועוד ${r}` : `${r}`} — בסך הכול ${k} משבצות מתוך 100.`, m(F(k, 100) + ' = ' + D(k, 2))],
          };
        }
        case 'shadeGrid': {
          let k; do { k = c.rnd(3, 45); } while (k % 10 === 0);
          return {
            type: 'shade', shape: 'grid', rows: 10, cols: 10, answer: k,
            prompt: `${c.g('צבע', 'צבעי')} ${m(D(k, 2))} מהריבוע (אפשר לגרור על כמה משבצות).`,
            hint: `כל משבצת היא מאית, וכל שורה היא עשירית. כמה מאיות יש ב-${m(D(k, 2))}?`,
            solution: [`${m(D(k, 2))} = ${nH(k)}${k >= 10 ? ` (${HM.cnt(Math.floor(k / 10), 'שורה', 'שורות', true)} ועוד ${HM.cnt(k % 10, 'משבצת', 'משבצות', true)})` : ''}.`, `צובעים ${k} משבצות.`],
          };
        }
        case 'frac100': {
          let n; do { n = c.chance(0.4) ? c.rnd(1, 9) : c.rnd(11, 99); } while (n % 10 === 0);
          return {
            type: 'number', decimal: true, answer: VAL(n, 2),
            prompt: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני:${big(m(F(n, 100) + ' = ' + HM.slot(0)))}`,
            hint: 'המכנה 100 — אלה מאיות. ספרת המאיות היא הספרה השנייה אחרי הנקודה.',
            solution: [n < 10 ? `${m(F(n, 100))} = ${hW(n)}. אין עשיריות, לכן כותבים 0 במקום העשיריות.` : `${m(F(n, 100))} = ${nT(Math.floor(n / 10))} ועוד ${nH(n % 10)}.`, m(F(n, 100) + ' = ' + D(n, 2))],
          };
        }
        case 'tenthToHund': {
          const t = c.rnd(1, 9);
          return {
            type: 'number', answer: t * 10,
            prompt: `${c.g('השלם', 'השלימי')}:${big(m(D(t) + ' = ' + HM.slot(0)) + ' מאיות')}`,
            hint: 'בכל עשירית יש 10 מאיות.',
            solution: [`${m(D(t))} = ${tW(t)}, ובכל עשירית יש 10 מאיות.`, `${m(D(t) + ' = ' + DZ(t * 10, 2))} ← ${t * 10} מאיות`],
          };
        }
        case 'nlHund':
        case 'nlWords': {
          const L = kind === 'nlWords' ? c.rnd(1, 9) : c.rnd(0, 29), h = c.rnd(1, 9), lo = L * 10, x = lo + h;
          const form = kind === 'nlHund' ? m(D(x, 2)) : c.pick([b(hW(x)), m(F(x, 100)), b(`${tW(L)} ו${hW(h)}`)]);
          return {
            type: 'numberline', line: zLine(lo, 10, 2), answer: VAL(x, 2),
            prompt: `${c.g('סמן', 'סמני')} על הישר את המספר ${form}.`,
            hint: `הקטע מ-${m(D(lo, 2))} עד ${m(D(lo + 10, 2))} מחולק ל-10 חלקים שווים. כל חלק הוא מאית (${m('0.01')}).`,
            solution: [...(kind === 'nlWords' ? [`${form} = ${m(D(x, 2))}`] : []), `${m(D(x, 2))} = ${m(D(lo, 2))} ועוד ${nH(h)}: סופרים ${nJ(h)} מ-${m(D(lo, 2))}.`],
          };
        }
        case 'money': {
          const s = c.scene(SHOP), p = hero(c);
          let a; do { a = c.chance(0.25) ? c.rnd(5, 9) : c.rnd(11, 95); } while (a % 10 === 0);
          return {
            type: 'number', decimal: true, answer: VAL(a, 2), unit: '₪',
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.cheap} ב-${a} אגורות.<br>כמה שקלים זה? ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: `בשקל יש 100 אגורות, לכן כל אגורה היא מאית שקל (${m('0.01')} ₪).`,
            solution: [`${a} אגורות = ${m(F(a, 100))} שקל.`, `${m(F(a, 100) + ' = ' + D(a, 2))} ₪`],
          };
        }
        case 'cm0':
        case 'measure': {
          const sc = c.scene(kind === 'cm0' ? CM_SC.filter((s) => s.r[0] < 100) : CM_SC.filter((s) => s.r[1] >= 100)), p = hero(c);
          const cm = pickCm(c, sc.r, kind === 'cm0'), W = Math.floor(cm / 100), r = cm % 100;
          return {
            type: 'number', decimal: true, answer: VAL(cm, 2), unit: "מ'",
            prompt: `${sc.txt(p, mcm(cm))}<br>${sc.ask(p)} ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: 'במטר יש 100 ס"מ, לכן כל ס"מ הוא מאית מטר.',
            solution: [`${r} ס"מ = ${m(F(r, 100))} מטר = ${m(D(r, 2))} מ'.`, ...(W ? [`${meters(W)} ועוד ${m(D(r, 2))} מ' ← ${m(D(cm, 2))} מ'`] : [])],
          };
        }
        case 'money2': {
          const s = c.scene(SHOP), p = hero(c), W = c.rnd(1, 30);
          let a; do { a = c.chance(0.35) ? c.rnd(2, 9) : c.rnd(11, 99); } while (a % 10 === 0);
          return {
            type: 'number', decimal: true, answer: VAL(W * 100 + a, 2), unit: '₪',
            prompt: `${p.name} ${p.g('שילם', 'שילמה')} על ${s.item} ${shekels(W)} ו-${a} אגורות.<br>${c.g('כתוב', 'כתבי')} את המחיר בשקלים כמספר עשרוני.`,
            hint: `בשקל יש 100 אגורות, לכן כל אגורה היא מאית שקל.${a < 10 ? ' כמה עשיריות יש כאן?' : ''}`,
            solution: [`${a} אגורות = ${m(F(a, 100))} שקל = ${m(D(a, 2))} ₪.`, `${m(`${W} + ${D(a, 2)} = ${D(W * 100 + a, 2)}`)} ₪`],
          };
        }
        case 'expanded': {
          const W = c.rnd(0, 9), t = c.rnd(1, 9), h = c.rnd(1, 9), x = W * 100 + t * 10 + h;
          const which = c.pick(W ? ['w', 't', 'h'] : ['t', 'h']);
          const terms = [];
          if (W) terms.push(which === 'w' ? HM.slot(0) : String(W));
          terms.push(F(which === 't' ? HM.slot(0) : t, 10), F(which === 'h' ? HM.slot(0) : h, 100));
          return {
            type: 'number', answer: which === 'w' ? W : which === 't' ? t : h,
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר בהצגה המורחבת:${big(m(`${D(x, 2)} = ` + terms.join(' + ')))}`,
            hint: `${c.g('בדוק', 'בדקי')} איזו ספרה נמצאת בכל מקום: לפני הנקודה — שלמים, הראשונה אחריה — עשיריות, השנייה — מאיות.`,
            solution: [`ב-${m(D(x, 2))} יש ${W ? nW(W) + ', ' : ''}${nT(t)} ועוד ${nH(h)}.`, m(`${D(x, 2)} = ${W ? W + ' + ' : ''}${F(t, 10)} + ${F(h, 100)}`)],
          };
        }
        case 'digitValue': {
          const ds = c.sample(HM.range(1, 9), 3), [W, t, h] = ds, x = W * 100 + t * 10 + h, place = c.pick([1, 2]), d = ds[place];
          const opts = [nW(d), nT(d), nH(d)];
          return {
            type: 'choice', choices: opts, answer: place, keep: true,
            prompt: `מה הערך של הספרה ${d} במספר ${m(D(x, 2))}?`,
            hint: `${c.g('בדוק', 'בדקי')} באיזה מקום נמצאת הספרה: לפני הנקודה, ראשונה אחרי הנקודה או שנייה אחרי הנקודה.`,
            solution: [`הספרה ${d} היא ה${place === 1 ? 'ראשונה' : 'שנייה'} אחרי הנקודה — ספרת ה${place === 1 ? 'עשיריות' : 'מאיות'}.`, `ערכה: ${opts[place]}.`],
          };
        }
        case 'zeros': {
          const v = c.rnd(0, 3), W = c.rnd(1, 9), t = c.rnd(1, 9);
          let st, ok, why;
          if (v === 0) { const x = c.chance(0.5) ? t : W * 10 + t; ok = true; st = m(D(x) + ' = ' + DZ(x * 10, 2)); why = `${tW(t)} הן ${t * 10} מאיות, ואפס בסוף לא משנה את המספר.`; }
          else if (v === 1) { ok = false; st = m(D(t) + ' = ' + D(t, 2)); why = `${m(D(t))} = ${tW(t)}, אבל ${m(D(t, 2))} = ${hW(t)} בלבד.`; }
          else if (v === 2) { ok = false; st = m(D(W * 100 + t, 2) + ' = ' + D(W * 10 + t)); why = `ב-${m(D(W * 100 + t, 2))} יש 0 עשיריות ו-${nH(t)}, וב-${m(D(W * 10 + t))} יש ${nT(t)}.`; }
          else { ok = false; st = m(DZ(W * 100 + t * 10, 2) + ' = ' + D(W * 100 + t, 2)); why = `ב-${m(DZ(W * 100 + t * 10, 2))} הספרה ${t} במקום העשיריות, וב-${m(D(W * 100 + t, 2))} היא במקום המאיות.`; }
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(st)}`,
            hint: `${c.g('בדוק', 'בדקי')} באיזה מקום נמצאת כל ספרה. אפס בסוף לא משנה, אבל אפס שמזיז ספרה — משנה.`,
            solution: [why, `לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'relation': {
          const v = c.rnd(0, 3);
          if (v === 0) {
            let x; do { x = c.chance(0.3) ? c.rnd(11, 99) : c.rnd(101, 499); } while (x % 10 === 0);
            const W = Math.floor(x / 100), t = Math.floor(x / 10) % 10, h = x % 10;
            return {
              type: 'number', answer: x, prompt: `${c.g('השלם', 'השלימי')}:${big(m(D(x, 2) + ' = ' + HM.slot(0)) + ' מאיות')}`,
              hint: 'בשלם יש 100 מאיות, ובעשירית יש 10 מאיות.',
              solution: [`${W ? `${nW(W)} = ${W * 100} מאיות, ` : ''}${t ? `${nT(t)} = ${t * 10} מאיות, ` : ''}ועוד ${nH(h)}.`, `${m([W * 100, t * 10, h].filter((q) => q).join(' + ') + ' = ' + x)} מאיות`],
            };
          }
          if (v === 1) {
            const k = c.rnd(11, 35);
            return {
              type: 'number', answer: k * 10, prompt: `${c.g('השלם', 'השלימי')}:${big(`${k} עשיריות = ` + m(HM.slot(0)) + ' מאיות')}`,
              hint: 'בכל עשירית יש 10 מאיות.',
              solution: [`בכל עשירית 10 מאיות: ${m(`${k} × 10 = ${k * 10}`)}`, `${k} עשיריות = ${k * 10} מאיות (${m(D(k) + ' = ' + DZ(k * 10, 2))})`],
            };
          }
          if (v === 2) {
            const W = c.rnd(2, 9);
            return {
              type: 'number', answer: [W * 10, W * 100], prompt: `${c.g('השלם', 'השלימי')}:${big(`${W} שלמים = ` + m(HM.slot(0)) + ' עשיריות = ' + m(HM.slot(1)) + ' מאיות')}`,
              hint: 'בשלם יש 10 עשיריות ו-100 מאיות.',
              solution: [`${W} שלמים = ${m(`${W} × 10 = ${W * 10}`)} עשיריות.`, `${W} שלמים = ${m(`${W} × 100 = ${W * 100}`)} מאיות.`],
            };
          }
          const k = c.rnd(2, 30);
          return {
            type: 'number', answer: k, prompt: `${c.g('השלם', 'השלימי')}:${big(`${k * 10} מאיות = ` + m(HM.slot(0)) + ' עשיריות')}`,
            hint: 'כל 10 מאיות הן עשירית אחת.',
            solution: [`${m(`${k * 10} : 10 = ${k}`)}`, `${k * 10} מאיות = ${nT(k)} (${m(DZ(k * 10, 2) + ' = ' + D(k))})`],
          };
        }
        case 'hundToDec': {
          let x; do { x = c.rnd(101, 699); } while (x % 100 === 0); if (c.chance(0.3)) x = Math.floor(x / 100) * 100 + c.rnd(1, 9);
          const W = Math.floor(x / 100);
          return {
            type: 'number', decimal: true, answer: VAL(x, 2),
            prompt: `איזה מספר עשרוני שווה ל-${x} מאיות?`,
            hint: '100 מאיות הן שלם, ו-10 מאיות הן עשירית.',
            solution: [`${x} מאיות = ${m(F(x, 100))} = ${nW(W)} ועוד ${nH(x % 100)}.`, `התשובה: ${m(D(x, 2))}`],
          };
        }
        case 'placePoint': {
          const [d1, d2, d3] = c.sample(HM.range(1, 9), 3), digits = `${d1}${d2}${d3}`;
          const opts = [`${d1}.${d2}${d3}`, `${d1}${d2}.${d3}`, digits];
          let ans, ask, sol;
          if (c.chance(0.5)) {
            ans = c.rnd(0, 1); const lo = ans === 0 ? d1 : d1 * 10 + d2;
            ask = `כך שיתקבל מספר בין ${lo} ל-${lo + 1}`;
            sol = [`מספר בין ${lo} ל-${lo + 1} מתחיל ב-${lo} שלמים.`, `לכן הנקודה באה אחרי ${lo}: ${m(opts[ans])}`];
          } else {
            const combo = c.pick([[d2, 'עשיריות', 0], [d3, 'עשיריות', 1], [d3, 'מאיות', 0]]);
            ans = combo[2];
            ask = `כך שהספרה ${combo[0]} תהיה ספרת ה${combo[1]}`;
            sol = [`ספרת העשיריות באה מיד אחרי הנקודה, וספרת המאיות — אחריה.`, `לכן: ${m(opts[ans])}`];
          }
          return {
            type: 'choice', choices: opts, answer: ans, keep: true,
            prompt: `איפה צריך לשים נקודה עשרונית במספר ${b(digits)}, ${ask}?`,
            hint: 'ספרת העשיריות באה מיד אחרי הנקודה. כמה ספרות צריכות להיות לפני הנקודה?',
            solution: sol,
          };
        }
        case 'expSum': {
          const W = c.rnd(1, 9), t = c.chance(0.4) ? 0 : c.rnd(1, 9), h = c.rnd(1, 9), x = W * 100 + t * 10 + h;
          const terms = c.shuffle([String(W)].concat(t ? [F(t, 10)] : [], [F(h, 100)]));
          return {
            type: 'number', decimal: true, answer: VAL(x, 2),
            prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני:${big(m(terms.join(' + ') + ' = ' + HM.slot(0)))}`,
            hint: `${c.g('בדוק', 'בדקי')} כמה שלמים, כמה עשיריות וכמה מאיות יש. אם חסר מקום — ${c.g('כתוב', 'כתבי')} בו 0.`,
            solution: [`שלמים: ${W}, עשיריות: ${t}, מאיות: ${h}.`, m(`${W}${t ? ' + ' + F(t, 10) : ''} + ${F(h, 100)} = ${D(x, 2)}`)],
          };
        }
        case 'pickGrid': {
          let target, vals;
          if (c.chance(0.5)) { const t = c.rnd(2, 8); target = D(t); vals = [t * 10, t, t === 5 ? 55 : 100 - t * 10]; }
          else { let k; do { k = c.rnd(12, 89); } while (k % 10 === 0 || k % 10 === Math.floor(k / 10)); target = D(k, 2); vals = [k, (k % 10) * 10 + Math.floor(k / 10), Math.floor(k / 10) * 10, 100 - k].filter((v, i, a) => a.indexOf(v) === i); }
          return {
            type: 'choice', cols: 2, answer: 0, choices: vals.map((v) => sq(v, { maxw: 140 })),
            prompt: `הריבוע הוא שלם אחד. באיזה ציור צבוע בדיוק ${m(target)} מהריבוע?`,
            hint: 'כל משבצת היא מאית, וכל שורה היא עשירית. כמה משבצות צריכות להיות צבועות?',
            solution: [`${m(target)} = ${nH(vals[0])}.`, `לכן צבועות ${vals[0]} משבצות.`],
          };
        }
        case 'shadeTenths': {
          const t = c.rnd(2, 7), extra = c.chance(0.4) ? c.rnd(1, 9) : 0, k = t * 10 + extra;
          return {
            type: 'shade', shape: 'grid', rows: 10, cols: 10, answer: k,
            prompt: `${c.g('צבע', 'צבעי')} ${m(D(k, 2))} מהריבוע (אפשר לגרור על כמה משבצות).`,
            hint: 'כמה מאיות יש בעשירית אחת? וכמה בכל המספר?',
            solution: [`${m(D(k, 2))} = ${tW(t)}${extra ? ` ועוד ${nH(extra)}` : ''}, ובכל עשירית יש 10 מאיות.`, `צובעים ${k} משבצות${extra ? '' : ` (${t} שורות)`}.`],
          };
        }
        case 'storyCmp': {
          // רמה 3: אגורות מול עשרוני — המלכודת 3.05 לעומת 3.5
          const ppl = crew(c, 2), s = c.scene(SHOP), W = c.rnd(2, 9), d = c.rnd(1, 9);
          const aCents = c.pick([d, d * 10]), bCents = aCents === d ? d * 10 : d;   // אחד עם 0 עשיריות והשני עם d עשיריות
          const A = W * 100 + aCents, B = W * 100 + bCents;
          return {
            type: 'choice', choices: [ppl[0].name, ppl[1].name, 'לשניהם אותו סכום'], answer: A > B ? 0 : 1, keep: true,
            prompt: `${ppl[0].name} ${ppl[0].g('שילם', 'שילמה')} על ${s.item} ${shekels(W)} ו-${aCents} אגורות. ${ppl[1].name} ${ppl[1].g('שילם', 'שילמה')} על ${s.item2} ${m(D(B, 2))} ₪.<br>${b('מי שילם יותר?')}`,
            hint: `${c.g('כתוב', 'כתבי')} את שני הסכומים כמספר עשרוני בשקלים. כמה עשיריות וכמה מאיות יש בכל אחד?`,
            solution: [`${shekels(W)} ו-${aCents} אגורות = ${m(D(A, 2))} ₪.`, `${m(DZ(A, 2) + ' ' + sgnH(sgn(A, B)) + ' ' + DZ(B, 2))}`, `שילם יותר: ${ppl[A > B ? 0 : 1].name}`],
          };
        }
        case 'storyInv': {
          // רמה 3: מעשרוני חזרה ליחידה הקטנה (₪ ← אגורות, מ' ← ס"מ), ועוד שלב
          const p = hero(c);
          if (c.chance(0.5)) {
            const s = c.scene(SHOP); let x, y; do { x = c.rnd(101, 699); } while (x % 10 === 0); do { y = c.rnd(15, 90); } while (y % 10 === 0 && c.chance(0.7));
            return {
              type: 'number', answer: x + y, unit: 'אגורות',
              prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${m(D(x, 2))} ₪ ו${s.cheap} ב-${y} אגורות.<br>כמה ${b('אגורות')} ${p.g('שילם', 'שילמה')} בסך הכול?`,
              hint: 'בשקל אחד יש 100 אגורות. קודם כל המחירים צריכים להיות באגורות.',
              solution: [`${m(D(x, 2))} ₪ = ${x} אגורות (${shekels(Math.floor(x / 100))} = ${Math.floor(x / 100) * 100} אגורות, ועוד ${x % 100}).`, `${m(`${x} + ${y} = ${x + y}`)} אגורות`],
            };
          }
          const sc = c.scene(CM_SC.filter((q) => q.r[1] >= 100)), cm = pickCm(c, sc.r, false), W = Math.floor(cm / 100);
          return {
            type: 'number', answer: (W + 1) * 100 - cm, unit: 'ס"מ',
            prompt: `${sc.txt(p, `${m(D(cm, 2))} מטרים`)}<br>כמה ${b('סנטימטרים')} חסרים כדי להגיע ל-${meters(W + 1)}?`,
            hint: `במטר יש 100 ס"מ. כמה ס"מ הם ${m(D(cm, 2))} מטרים, וכמה ס"מ הם ${meters(W + 1)}?`,
            solution: [`${m(D(cm, 2))} מטרים = ${cm} ס"מ, ו-${meters(W + 1)} = ${(W + 1) * 100} ס"מ.`, `${m(`${(W + 1) * 100} ${MN} ${cm} = ${(W + 1) * 100 - cm}`)} ס"מ`],
          };
        }
      }
    },
  });

  /* ========== המאית (ב): השוואה ומיקום על הישר ========== */
  // ערכים עם עשיריות ומאיות שמכילים את המלכודת (2.3 מול 2.25)
  function trapVals(c, W, k) {
    const a = c.rnd(2, 8), set = [W * 100 + a * 10, W * 100 + (a - 1) * 10 + c.rnd(5, 9), W * 100 + a * 10 + c.rnd(1, 9), W * 100 + (a + 1) * 10, W * 100 + (a - 1) * 10 + c.rnd(1, 4)];
    return c.shuffle(set.slice(0, k));
  }
  // ישר מ-0 עד 1 בקפיצות של 0.05, תוויות רק ב-0, 0.5 ו-1
  const CMP_SC2 = CMP_SC.filter((s) => !s.hours);   // שעות עם מאיות לא טבעיות בסיפור
  const halfLine = () => ({ min: 0, max: 1, step: 0.05, every: 10, labels: (v, i) => (i % 10 === 0 ? D(5 * i, 2) : null) });
  const CLOSE2_SC = [
    { tags: ['sport'], goal: (g) => `באימון קפיצה לרוחק, המטרה היא לנחות בדיוק על הקו של ${g} מטרים.`, line: (p, v) => `${p.name} ${p.g('נחת', 'נחתה')} ב-${v} מטרים.` },
    { tags: ['baking', 'animals'], goal: (g) => `ביריד מנחשים את המשקל של עוגת ענק ששוקלת בדיוק ${g} ק"ג.`, line: (p, v) => `${p.name} ${p.g('ניחש', 'ניחשה')} ${v} ק"ג.` },
    { tags: ['magic'], goal: (g) => `בשיעור שיקויים צריך למזוג לקלחת בדיוק ${g} ליטר של מי מעיין.`, line: (p, v) => `${p.name} ${p.g('מזג', 'מזגה')} ${v} ליטר.` },
    { tags: ['squishy'], goal: (g) => `בתחרות מנחשים כמה זמן לוקח לסקווישי ענק לחזור לצורתו. התשובה: בדיוק ${g} שניות.`, line: (p, v) => `${p.name} ${p.g('ניחש', 'ניחשה')} ${v} שניות.` },
    { tags: ['games', 'music', 'kpop'], goal: (g) => `במשחק "עצור את השעון" צריך לעצור בדיוק ב-${g} שניות.`, line: (p, v) => `${p.name} ${p.g('עצר', 'עצרה')} ב-${v} שניות.` },
    { tags: ['tech', 'space'], goal: (g) => `הרובוטים בתחרות צריכים לעצור בדיוק אחרי ${g} מטרים.`, line: (p, v) => `הרובוט של ${p.name} עצר אחרי ${v} מטרים.` },
    { tags: ['art', 'reading', 'nature'], goal: (g) => `בכיתה מנחשים את האורך של חבל שאורכו בדיוק ${g} מטרים.`, line: (p, v) => `${p.name} ${p.g('ניחש', 'ניחשה')} ${v} מטרים.` },
  ];

  HM.lesson({
    id: 'dec-hund-b',
    learn: (c) => {
      const f = c.buddy();
      return [
        {
          title: 'מי קפץ רחוק יותר?',
          html: `${c.name} ${c.g('קפץ', 'קפצה')} לרוחק ${m('2.3')} מטרים, ו${f.name} ${f.g('קפץ', 'קפצה')} ${m('2.25')} מטרים.<br>${f.name} ${f.g('אומר', 'אומרת')}: "25 גדול מ-3, אז אני ניצחתי!"<br>${f.g('האם הוא צודק', 'האם היא צודקת')}? ${c.g('הסתכל', 'הסתכלי')} על הישר.`,
          visual: V.numberLine(Object.assign(zLine(220, 20, 2, (i) => i % 10 === 0), { marks: [{ v: 2.25, label: '2.25', cls: 'f-b' }, { v: 2.3, label: '2.3' }] })),
        },
        {
          title: 'משלימים אפס',
          html: `${m('2.3 = 2.30')} — אפס בסוף לא משנה את המספר.<br>עכשיו לשני המספרים יש 2 ספרות אחרי הנקודה: ${m('2.30 &gt; 2.25')}, כי 30 מאיות הן יותר מ-25 מאיות.<br>${c.name} ${c.g('קפץ', 'קפצה')} רחוק יותר!`,
          visual: V.decTable('2.30') + V.decTable('2.25'),
        },
        {
          title: 'משווים מקום אחר מקום',
          html: `משווים ${b('משמאל לימין')}, בדיוק כמו במספרים שלמים:<br>1. ${b('שלמים')}. אם הם שווים —<br>2. ${b('עשיריות')}. אם הן שוות —<br>3. ${b('מאיות')}.<br>הספרה הראשונה ששונה קובעת: ${m('0.5 &gt; 0.45')}, כי 5 עשיריות הן יותר מ-4 עשיריות.`,
          visual: `<div class="row">${sq(50, { maxw: 140 })}${sq(45, { maxw: 140 })}</div>`,
        },
        {
          title: 'איפה זה על הישר?',
          html: `${m('0.45')} נמצא בין ${m('0.4')} ל-${m('0.5')} — בדיוק באמצע.<br>${c.g('דמיין', 'דמייני')} שכל עשירית על הישר מחולקת ל-10 מאיות קטנות.`,
          visual: V.numberLine({ min: 0, max: 1, den: 10, labels: (v, i) => D(i), marks: [{ v: 0.45, label: '0.45' }] }),
        },
        {
          title: 'אפס בסוף או באמצע?',
          html: `• ${m('3.40 = 3.4')} — אפס ${b('בסוף')} לא משנה.<br>• ${m('5.05 ≠ 5.5')} — ב-${m('5.05')} יש ${b('0 עשיריות')} ו-5 מאיות, וב-${m('5.5')} יש 5 עשיריות.<br>לכן ${m('5.05 &lt; 5.5')}.`,
          visual: V.decTable('5.05') + V.decTable('5.50'),
        },
        {
          title: 'דוגמה: מהקטן לגדול',
          html: `נסדר מהקטן לגדול: ${HM.seq(['0.7', '0.07', '0.69', '0.71'])}`,
          steps: [
            `נשלים אפסים, כך שלכולם יהיו 2 ספרות אחרי הנקודה: ${HM.seq(['0.70', '0.07', '0.69', '0.71'])}`,
            `עכשיו משווים את המאיות כמו מספרים שלמים: ${HM.seq([70, 7, 69, 71])}`,
            `מהקטן לגדול: ${m('0.07 &lt; 0.69 &lt; 0.7 &lt; 0.71')} ✔`,
          ],
          quiz: cmpQ(c, 60, 58, 2, '0.6', '0.58', `${c.g('השלם', 'השלימי')} אפס: ${m('0.6 = 0.60')}.`),
        },
      ];
    },
    gen: (c, level) => {
      const kinds = level === 1 ? ['cmp2', 'cmpZeros', 'cmpLonger', 'nlPlace', 'pickBig', 'story2', 'story2', 'story2', 'storyMoney']
        : level === 2 ? ['cmpTrap', 'cmpTrap', 'order', 'between', 'nlHalf', 'cmpFrac', 'story', 'story', 'story', 'storyMoney']
        : ['digit', 'closest', 'orderMix', 'tf', 'nlRead', 'storyOrder', 'storyOrder', 'storyClose', 'storyClose'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'cmp2': {
          const W = c.rnd(0, 5); let x, y;
          do { x = W * 100 + c.rnd(11, 99); y = c.chance(0.35) ? W * 100 + (x % 10) * 10 + Math.floor(x / 10) % 10 : W * 100 + c.rnd(11, 99); } while (x % 10 === 0 || y % 10 === 0 || x === y);
          return cmpQ(c, x, y, 2, D(x, 2), D(y, 2), `${c.g('השווה', 'השווי')} מקום אחר מקום: קודם שלמים, אחר כך עשיריות, ואז מאיות.`);
        }
        case 'cmpZeros': {
          const v = c.rnd(0, 2), W = c.rnd(0, 6), t = c.rnd(1, 9);
          let x, y, sx, sy;
          if (v === 0) { x = W * 100 + t * 10; y = x; sx = D(x, 2); sy = DZ(x, 2); }
          else if (v === 1) { x = W * 100 + t * 10; y = W * 100 + t; sx = D(x, 2); sy = D(y, 2); }
          else { x = W * 100 + t; y = W * 100 + t * 10; sx = D(x, 2); sy = D(y, 2); }
          if (c.chance(0.5)) { [x, y] = [y, x]; [sx, sy] = [sy, sx]; }
          return cmpQ(c, x, y, 2, sx, sy, `${c.g('השלם', 'השלימי')} אפסים כך שלשני המספרים יהיו 2 ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`);
        }
        case 'cmpLonger': {
          const W = c.rnd(0, 6), t = c.rnd(1, 8); let x = W * 100 + t * 10, y = x + c.rnd(1, 9);
          if (c.chance(0.5)) [x, y] = [y, x];
          return cmpQ(c, x, y, 2, D(x, 2), D(y, 2), `לשני המספרים אותם שלמים ואותן עשיריות. ${c.g('השלם', 'השלימי')} אפס ו${c.g('השווה', 'השווי')} את המאיות.`);
        }
        case 'nlPlace': {
          const L = c.rnd(0, 29), h = c.rnd(1, 9), lo = L * 10, x = lo + h;
          return {
            type: 'numberline', line: zLine(lo, 10, 2), answer: VAL(x, 2),
            prompt: `${c.g('סמן', 'סמני')} על הישר את ${m(D(x, 2))}.`,
            hint: `הקטע מ-${m(D(lo, 2))} עד ${m(D(lo + 10, 2))} מחולק ל-10 חלקים, וכל חלק הוא מאית.`,
            solution: [`${m(D(x, 2))} = ${m(D(lo, 2))} ועוד ${nH(h)}: סופרים ${nJ(h)} מ-${m(D(lo, 2))}.`],
          };
        }
        case 'pickBig': {
          const W = c.rnd(0, 5), askBig = c.chance(0.5), a = c.rnd(2, 8);
          const vals = c.shuffle([W * 100 + a * 10, W * 100 + (a - 1) * 10 + c.rnd(5, 9), W * 100 + a * 10 + c.rnd(1, 9), W * 100 + c.rnd(1, 9)]);
          const ans = vals.indexOf(askBig ? Math.max(...vals) : Math.min(...vals));
          return {
            type: 'choice', choices: vals.map((v) => D(v, 2)), answer: ans,
            prompt: `איזה מספר הוא ה${askBig ? 'גדול' : 'קטן'} ביותר?`,
            hint: `${c.g('השלם', 'השלימי')} אפסים כך שלכל המספרים יהיו 2 ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`עם אפסים: ${HM.seq(vals.map((v) => DZ(v, 2)))}`, `מהקטן לגדול: ${m(vals.slice().sort((x, y) => x - y).map((v) => D(v, 2)).join(' &lt; '))}`],
          };
        }
        case 'cmpTrap': {
          const W = c.rnd(0, 6), a = c.rnd(2, 9), sh = W * 100 + a * 10;
          let lg = c.chance(0.75) ? W * 100 + (a - c.rnd(1, Math.min(2, a))) * 10 + c.rnd(1, 9) : sh + c.rnd(1, 9);
          if (lg % 10 === 0) lg += 1;
          const [x, y] = c.chance(0.5) ? [sh, lg] : [lg, sh];
          return cmpQ(c, x, y, 2, D(x, 2), D(y, 2), `זהירות: מספר עם יותר ספרות אינו בהכרח גדול יותר. ${c.g('השלם', 'השלימי')} אפס ו${c.g('השווה', 'השווי')} מקום אחר מקום.`);
        }
        case 'order': {
          const W = c.rnd(0, 4), a = c.rnd(2, 8), desc = c.chance(0.3);
          const vals = c.shuffle([W * 100 + a * 10, W * 100 + (a - 1) * 10 + c.rnd(5, 9), W * 100 + a * 10 + c.rnd(1, 9), W * 100 + c.rnd(1, 9)]);
          const ans = sortIdx(vals, desc);
          return {
            type: 'order', items: vals.map((v) => D(v, 2)), answer: ans,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `${c.g('השלם', 'השלימי')} אפסים כך שלכולם יהיו 2 ספרות אחרי הנקודה. עכשיו ${c.g('השווה', 'השווי')} כמו מספרים שלמים.`,
            solution: [`עם אפסים: ${HM.seq(vals.map((v) => DZ(v, 2)))}`, m(ans.map((i) => D(vals[i], 2)).join(desc ? ' &gt; ' : ' &lt; '))],
          };
        }
        case 'between': {
          const A = c.rnd(1, 48), lo = A * 10, hi = lo + 10, cor = lo + c.rnd(1, 9);
          const cand = c.shuffle([hi + c.rnd(1, 9), lo - c.rnd(1, 9), Math.floor(A / 10) * 100 + c.rnd(1, 9), (cor % 10) * 10 + Math.floor(cor / 10) % 10 + Math.floor(cor / 100) * 100, hi + 10]);
          const wr = cand.filter((v, i, a) => v >= 0 && (v <= lo || v >= hi) && a.indexOf(v) === i && v !== cor).slice(0, 3);
          return {
            type: 'choice', choices: [D(cor, 2)].concat(wr.map((v) => D(v, 2))), answer: 0,
            prompt: `איזה מספר נמצא בין ${m(D(A))} ל-${m(D(A + 1))}?`,
            hint: `${c.g('השלם', 'השלימי')} אפס: ${m(DZ(lo, 2))} ו-${m(DZ(hi, 2))}. אילו מספרים נמצאים ביניהם?`,
            solution: [`${m(DZ(lo, 2) + ' &lt; ' + D(cor, 2) + ' &lt; ' + DZ(hi, 2))} ✔`, 'שאר המספרים מחוץ לתחום.'],
          };
        }
        case 'nlHalf': {
          let k; do { k = c.rnd(1, 19); } while (k === 10);
          return {
            type: 'numberline', line: halfLine(), answer: VAL(5 * k, 2),
            prompt: `${c.g('סמן', 'סמני')} על הישר את ${m(D(5 * k, 2))}.`,
            hint: `בין 0 ל-${m('0.5')} יש 10 קפיצות. כמה שווה כל קפיצה?`,
            solution: [`כל קפיצה היא ${m('0.05')} (חמש מאיות), ושתי קפיצות הן עשירית.`, `${m(D(5 * k, 2))} ← ${nJ(k)} מ-0${k > 10 ? `, או ${nJ(k - 10)} אחרי ${m('0.5')}` : ''}.`],
          };
        }
        case 'cmpFrac': {
          let x, y, fr;
          if (c.chance(0.5)) { y = c.rnd(11, 99); x = y + c.pick([-1, 1, 0, 9, -9]); fr = F(y, 100); if (x % 10 === 0 && c.chance(0.5)) x += 1; }
          else { const t = c.rnd(1, 9); y = t * 10; x = y + c.pick([-5, -3, 2, 4, 0]); fr = F(t, 10); }
          if (x <= 0) x = y + 3;
          const sw = c.chance(0.5);
          const L = sw ? m(fr) : D(x, 2), R = sw ? D(x, 2) : m(fr), lv = sw ? y : x, rv = sw ? x : y;
          return {
            type: 'compare', prompt: signPrompt(c), left: L, right: R, lv: VAL(lv, 2), rv: VAL(rv, 2), answer: sgn(lv, rv),
            hint: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${m(fr)} = ${m(D(y, 2))}`, ...cmpSteps(lv, rv, 2, D(lv, 2), D(rv, 2)).slice(-1)],
          };
        }
        case 'digit': {
          const v = c.rnd(0, 2), W = c.rnd(0, 9);
          if (v === 0) {
            const t = c.rnd(1, 8), h = c.rnd(1, 9);
            return {
              type: 'number', answer: t,
              prompt: `מה הספרה ה${b('קטנה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.` + HM.slot(0) + `${h} &gt; ${D(W * 10 + t)}`))}`,
              hint: `${c.g('השלם', 'השלימי')} אפס: ${m(D(W * 10 + t) + ' = ' + DZ(W * 100 + t * 10, 2))}. עכשיו ${c.g('נסה', 'נסי')} ספרות שונות במשבצת.`,
              solution: [`${m(`${W}.${t}${h} &gt; ${DZ(W * 100 + t * 10, 2)}`)} ✔`, `${m(`${W}.${t - 1}${h} &lt; ${DZ(W * 100 + t * 10, 2)}`)} ✘`, `התשובה: ${t}`],
            };
          }
          if (v === 1) {
            const t = c.rnd(0, 9), h = c.rnd(1, 9);
            return {
              type: 'number', answer: h - 1,
              prompt: `מה הספרה ה${b('גדולה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.${t}` + HM.slot(0) + ` &lt; ${D(W * 100 + t * 10 + h, 2)}`))}`,
              hint: `השלמים והעשיריות שווים. מה צריך להיות במקום המאיות?`,
              solution: [`${m(`${W}.${t}${h - 1} &lt; ${D(W * 100 + t * 10 + h, 2)}`)} ✔`, `${m(`${W}.${t}${h}`)} שווה למספר, ולכן אינו קטן ממנו ✘`, `התשובה: ${h - 1}`],
            };
          }
          const t = c.rnd(1, 9), h = c.rnd(1, 9);
          return {
            type: 'number', answer: t - 1,
            prompt: `מה הספרה ה${b('גדולה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.` + HM.slot(0) + `${h} &lt; ${D(W * 10 + t)}`))}`,
            hint: `${c.g('השלם', 'השלימי')} אפס: ${m(D(W * 10 + t) + ' = ' + DZ(W * 100 + t * 10, 2))}. עכשיו ${c.g('נסה', 'נסי')} ספרות שונות במשבצת.`,
            solution: [`${m(`${W}.${t - 1}${h} &lt; ${DZ(W * 100 + t * 10, 2)}`)} ✔`, `${m(`${W}.${t}${h} &gt; ${DZ(W * 100 + t * 10, 2)}`)} ✘`, `התשובה: ${t - 1}`],
          };
        }
        case 'closest': {
          const T = c.pick([50, 100, 100, 200, 150]), ds = c.sample([1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 25], 4);
          const vals = ds.map((d) => T + (c.chance(0.5) ? d : -d));
          const best = ds.indexOf(Math.min(...ds));
          return {
            type: 'choice', choices: vals.map((v) => D(v, 2)), answer: best,
            prompt: `איזה מספר הכי קרוב ל-${m(D(T, 2))}?`,
            hint: `${c.g('חשב', 'חשבי')} לכל מספר: כמה מאיות הוא רחוק מ-${m(D(T, 2))}?`,
            solution: [`המרחקים: ${vals.map((v, i) => `${m(D(v, 2))} — ${nH(ds[i])}`).join('; ')}.`, `הכי קרוב: ${m(D(vals[best], 2))}`],
          };
        }
        case 'orderMix': {
          const base = c.rnd(2, 6) * 10, desc = c.chance(0.4);
          let vals; do { vals = [base, base + c.rnd(1, 9), base - c.rnd(1, 9), base + 10 + c.rnd(-5, 5)]; } while (new Set(vals).size < 4);
          const order = c.shuffle([0, 1, 2, 3]);
          const items = [], conv = [];
          order.forEach((k) => {
            const v = vals[k];
            if (k === 0) { items.push(m(F(v / 10, 10))); conv.push(`${m(F(v / 10, 10))} = ${m(D(v, 2))}`); }
            else if (k === 2) { items.push(m(F(v, 100))); conv.push(`${m(F(v, 100))} = ${m(D(v, 2))}`); }
            else items.push(D(v, 2));
          });
          const sv = order.map((k) => vals[k]), ans = sortIdx(sv, desc);
          return {
            type: 'order', items, answer: ans,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `${c.g('כתוב', 'כתבי')} קודם את השברים כמספרים עשרוניים, ואז ${c.g('סדר', 'סדרי')}.`,
            solution: [conv.join(' , '), m(ans.map((i) => D(sv[i], 2)).join(desc ? ' &gt; ' : ' &lt; '))],
          };
        }
        case 'tf': {
          const v = c.rnd(0, 4), W = c.rnd(0, 6), a = c.rnd(2, 9);
          let st, ok, why;
          if (v === 0) { const lg = W * 100 + (a - 1) * 10 + c.rnd(1, 9), sh = W * 100 + a * 10; ok = false; st = `${m(D(lg, 2) + ' &gt; ' + D(sh, 2))}, כי ${lg % 100} גדול מ-${a}.`; why = `${m(D(sh, 2) + ' = ' + DZ(sh, 2))}, ו-${m(DZ(sh, 2) + ' &gt; ' + D(lg, 2))}. ההסבר שגוי: משווים מקום אחר מקום.`; }
          else if (v === 1) { const x = W * 10 + a; ok = true; st = m(DZ(x * 10, 2) + ' = ' + D(x)); why = 'אפס בסוף החלק העשרוני לא משנה את המספר.'; }
          else if (v === 2) { ok = false; st = m(D(W * 100 + a, 2) + ' = ' + D(W * 10 + a)); why = `ב-${m(D(W * 100 + a, 2))} יש 0 עשיריות, וב-${m(D(W * 10 + a))} יש ${nT(a)}.`; }
          else if (v === 3) { const A = W * 10 + a - 1; ok = false; st = `בין ${m(D(A))} ל-${m(D(A + 1))} אין אף מספר אחר.`; why = `למשל ${m(D(A * 10 + 5, 2))} נמצא ביניהם (וגם ${m(D(A * 10 + 1, 2))}, ${m(D(A * 10 + 2, 2))} ועוד).`; }
          else { const x = W * 100 + c.rnd(11, 99), y = W * 100 + c.rnd(11, 99), sym = c.pick(['<', '>']); ok = x !== y && sgn(x, y) === sym; st = m(`${D(x, 2)} ${sgnH(sym)} ${D(y, 2)}`); why = m(`${D(x, 2)} ${sgnH(sgn(x, y))} ${D(y, 2)}`); }
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(st)}`,
            hint: `${c.g('השלם', 'השלימי')} אפסים ו${c.g('השווה', 'השווי')} מקום אחר מקום.`,
            solution: [why, `לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'nlRead': {
          if (c.chance(0.5)) {
            const L = c.rnd(0, 29), h = c.rnd(1, 9), lo = L * 10;
            return {
              type: 'number', decimal: true, answer: VAL(lo + h, 2),
              prompt: 'איזה מספר מסומן בנקודה על ישר המספרים?',
              visual: V.numberLine(Object.assign(zLine(lo, 10, 2), { marks: [{ v: VAL(lo + h, 2), cls: 'f-c' }] })),
              hint: `כמה שווה כל קפיצה קטנה בין ${m(D(lo, 2))} ל-${m(D(lo + 10, 2))}?`,
              solution: [`יש 10 קפיצות, וכל קפיצה היא מאית.`, `הנקודה נמצאת ${nJ(h)} אחרי ${m(D(lo, 2))} ← ${m(D(lo + h, 2))}`],
            };
          }
          let k; do { k = c.rnd(1, 19); } while (k === 10);
          return {
            type: 'number', decimal: true, answer: VAL(5 * k, 2),
            prompt: 'איזה מספר מסומן בנקודה על ישר המספרים?',
            visual: V.numberLine(Object.assign(halfLine(), { marks: [{ v: VAL(5 * k, 2), cls: 'f-c' }] })),
            hint: `בין 0 ל-${m('0.5')} יש 10 קפיצות. כמה שווה כל קפיצה?`,
            solution: [`כל קפיצה היא ${m('0.05')}.`, `הנקודה נמצאת ${nJ(k)} אחרי 0 ← ${m(D(5 * k, 2))}`],
          };
        }
        case 'story2': {
          const sc = c.scene(CMP_SC2), ppl = crew(c, 2), W = c.rnd(sc.w[0], sc.w[1]); let x, y;
          do { x = W * 100 + c.rnd(11, 99); y = W * 100 + c.rnd(11, 99); } while (x === y || x % 10 === 0 || y % 10 === 0);
          const vals = [x, y], askBig = c.chance(0.5), best = vals.indexOf(askBig ? Math.max(x, y) : Math.min(x, y));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: ppl.map((p, i) => sc.line(p, D(vals[i], 2))).join('<br>') + `<br>${b(askBig ? sc.big : sc.small)}`,
            hint: 'השלמים שווים. משווים עשיריות, ואם צריך — מאיות.',
            solution: [m(D(Math.min(x, y), 2) + ' &lt; ' + D(Math.max(x, y), 2)), `התשובה: ${ppl[best].name}`],
          };
        }
        case 'storyMoney': {
          // מחירים בשתי חנויות: איפה זול יותר?
          const s = c.scene(SHOP), p = hero(c), W = c.rnd(2, 30); let x, y;
          if (level === 1) { do { x = W * 100 + c.rnd(11, 99); y = W * 100 + c.rnd(11, 99); } while (x === y || x % 10 === 0 || y % 10 === 0); }
          else { const a = c.rnd(2, 9); x = W * 100 + a * 10; y = W * 100 + (a - 1) * 10 + c.rnd(5, 9); if (c.chance(0.5)) [x, y] = [y, x]; }
          return {
            type: 'choice', choices: ['בחנות הראשונה', 'בחנות השנייה'], answer: x < y ? 0 : 1, keep: true,
            prompt: `${p.name} ${p.g('רוצה', 'רוצה')} לקנות ${s.item}. בחנות הראשונה המחיר הוא ${D(x, 2)} ₪, ובחנות השנייה ${D(y, 2)} ₪.<br>${b('באיזו חנות המחיר נמוך יותר?')}`,
            hint: `${c.g('השווה', 'השווי')} את המחירים מקום אחר מקום. אפשר להשלים אפס.`,
            solution: [...cmpSteps(x, y, 2, D(x, 2), D(y, 2)).slice(-2), `המחיר נמוך יותר ${x < y ? 'בחנות הראשונה' : 'בחנות השנייה'}.`],
          };
        }
        case 'story':
          return cmpStory(c, CMP_SC2, 2, (sc) => trapVals(c, c.rnd(sc.w[0], sc.w[1]), 3));
        case 'storyOrder': {
          const sc = c.scene(CMP_SC2), ppl = crew(c, 4), vals = trapVals(c, c.rnd(sc.w[0], sc.w[1]), 4), desc = c.chance(0.5);
          const ans = sortIdx(vals, desc);
          return {
            type: 'order', items: ppl.map((p) => p.name), answer: ans,
            prompt: `${ppl.map((p, i) => sc.line(p, D(vals[i], 2))).join('<br>')}<br>${c.g('סדר', 'סדרי')} את הילדים לפי התוצאה, <b>${desc ? 'מהגדולה לקטנה' : 'מהקטנה לגדולה'}</b>:`,
            hint: `${c.g('השלם', 'השלימי')} אפסים כך שלכל התוצאות יהיו 2 ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`עם אפסים: ${ppl.map((p, i) => `${p.name} ${m(DZ(vals[i], 2))}`).join(', ')}`, m(ans.map((i) => D(vals[i], 2)).join(desc ? ' &gt; ' : ' &lt; ')), ans.map((i) => ppl[i].name).join(', ')],
          };
        }
        case 'storyClose': {
          const sc = c.scene(CLOSE2_SC), ppl = crew(c, 3), g = c.rnd(2, 5) * 100;
          const ds = c.sample([1, 3, 4, 5, 6, 8, 10, 12, 15, 20], 3), vals = ds.map((d, i) => g + (i === 0 ? -d : i === 1 ? d : (c.chance(0.5) ? d : -d)));
          const best = ds.indexOf(Math.min(...ds));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: `${sc.goal(D(g, 2))}<br>${ppl.map((p, i) => sc.line(p, D(vals[i], 2))).join('<br>')}<br>${b('מי הכי קרוב ליעד?')}`,
            hint: `${c.g('חשב', 'חשבי')} לכל אחד: כמה מאיות חסרות או עודפות כדי להגיע בדיוק ל-${D(g, 2)}?`,
            solution: [ppl.map((p, i) => `${p.name}: ${nH(ds[i])} ${vals[i] < g ? 'פחות' : 'יותר'}`).join('; '), `הכי קרוב: ${ppl[best].name} (${m(D(vals[best], 2))})`],
          };
        }
      }
    },
  });

  /* ========== חיבור עשרוניים — עשיריות ומאיות ========== */
  const dg = (x) => [Math.floor(x / 100), Math.floor(x / 10) % 10, x % 10];   // [שלמים, עשיריות, מאיות]
  // פתרון חיבור במאונך, מקום אחר מקום (x, y במאיות)
  function addStepsH(x, y) {
    const [Wa, ta, ha] = dg(x), [Wb, tb, hb] = dg(y);
    const hs = ha + hb, c1 = hs >= 10 ? 1 : 0, ts = ta + tb + c1, c2 = ts >= 10 ? 1 : 0;
    return [
      `מאיות: ${m(`${ha} + ${hb} = ${hs}`)}${c1 ? ` — 10 מאיות הן עשירית: כותבים ${hs - 10} ומעבירים 1 לעשיריות` : ''}.`,
      `עשיריות: ${m(`${ta} + ${tb}${c1 ? ' + 1' : ''} = ${ts}`)}${c2 ? ` — 10 עשיריות הן שלם: כותבים ${ts - 10} ומעבירים 1 לשלמים` : ''}.`,
      `שלמים: ${m(`${Wa} + ${Wb}${c2 ? ' + 1' : ''} = ${Wa + Wb + c2}`)}. התשובה: ${m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`)}`,
    ];
  }
  // שני מספרים במאיות; carry: 0 — בלי המרה, 1 — עם המרה במאיות
  function pairH(c, carry, wa, wb) {
    let x, y, g = 0;
    do {
      x = c.rnd(wa[0], wa[1]) * 100 + c.rnd(1, 9) * 10 + c.rnd(1, 9);
      y = c.rnd(wb[0], wb[1]) * 100 + c.rnd(0, 9) * 10 + c.rnd(1, 9);
      g++;
    } while (g < 60 && (carry ? (x % 10) + (y % 10) < 10 : ((x % 10) + (y % 10) >= 10 || dg(x)[1] + dg(y)[1] >= 10)));
    return [x, y];
  }
  // סיפורי חיבור: כסף (מהחנות) ומידות
  const ADD_H = SHOP.map((s) => ({ tags: s.tags, u: '₪', txt: (p, A, B) => `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${A} ₪ ו${s.item2} ב-${B} ₪. כמה ${p.g('שילם', 'שילמה')} בסך הכול?` })).concat([
    { tags: ['sport'], u: 'ק"מ', txt: (p, A, B) => `${p.name} ${p.g('רץ', 'רצה')} ${A} ק"מ ביום ראשון ו-${B} ק"מ ביום שני. כמה ק"מ ${p.g('רץ', 'רצה')} בשני הימים?` },
    { tags: ['nature'], u: 'ק"מ', txt: (p, A, B) => `${p.name} ${p.g('הלך', 'הלכה')} בטיול ${A} ק"מ עד המעיין, ועוד ${B} ק"מ עד התצפית. כמה ק"מ ${p.g('הלך', 'הלכה')} בסך הכול?` },
    { tags: ['animals'], u: 'ק"ג', txt: (p, A, B) => `הכלבה של ${p.name} שקלה ${A} ק"ג, ומאז היא עלתה במשקל ${B} ק"ג. כמה היא שוקלת עכשיו?` },
    { tags: ['tech'], u: "מ'", txt: (p, A, B) => `הרובוט של ${p.name} נסע ${A} מטרים, עצר, ונסע עוד ${B} מטרים. כמה מטרים נסע בסך הכול?` },
  ]);

  HM.lesson({
    id: 'dec-add',
    learn: (c) => [
      {
        title: 'שקלים עם שקלים, אגורות עם אגורות',
        html: `${c.name} ${c.g('קנה', 'קנתה')} מחברת ב-${m('3.25')} ₪ ועט ב-${m('2.40')} ₪. כמה ${c.g('שילם', 'שילמה')}?<br>מחברים ${b('שקלים עם שקלים')} ו${b('אגורות עם אגורות')}: 5 שקלים ו-65 אגורות.<br>${m('3.25 + 2.40 = 5.65')}`,
        visual: V.column(['3.25', '2.40'], '+', { result: '5.65' }),
      },
      {
        title: 'נקודה מתחת לנקודה',
        html: `בחיבור במאונך ${b('הנקודה נכתבת מתחת לנקודה')}. כך כל ספרה עומדת מתחת לספרה מאותו מקום: מאיות מתחת למאיות, עשיריות מתחת לעשיריות.<br>אם חסרה ספרה — ${c.g('השלם', 'השלימי')} ${b('אפס')}: ${m('2.5 = 2.50')}.`,
        visual: V.column(['2.5', '1.37'], '+', { result: '3.87', zeros: true }),
      },
      {
        title: 'דוגמה: 10 מאיות הן עשירית',
        html: `כמה זה ${m('0.75 + 0.48')}?`,
        visual: V.column(['0.75', '0.48'], '+', { result: '1.23', carry: ['1', '', '1', ''] }),
        steps: [
          `מאיות: ${m('5 + 8 = 13')}. 13 מאיות הן עשירית ועוד 3 מאיות: כותבים 3 ומעבירים 1 לעשיריות.`,
          `עשיריות: ${m('7 + 4 + 1 = 12')}. 12 עשיריות הן שלם ועוד 2 עשיריות: כותבים 2 ומעבירים 1 לשלמים.`,
          `שלמים: ${m('0 + 0 + 1 = 1')}.`,
          `${m('0.75 + 0.48 = 1.23')} ✔`,
        ],
      },
      {
        title: 'אומדן — בערך כמה?',
        html: `לפני שמחשבים כדאי לאמוד: מעגלים כל מחובר למספר השלם הקרוב אליו.<br>${m('3.92 + 4.15')} ← ${m('4 + 4 = 8')}. התשובה צריכה להיות קרובה ל-8.<br>אם יצא 80 או ${m('0.8')} — כנראה שהנקודה במקום הלא נכון!`,
        visual: big(m('3.92 + 4.15 ≈ 4 + 4 = 8')),
      },
      {
        title: c.g('נסה בעצמך', 'נסי בעצמך'),
        html: `${c.name}, ${c.g('זכור', 'זכרי')}: נקודה מתחת לנקודה, ומתחילים מהמאיות.`,
        quiz: { type: 'number', decimal: true, answer: 1.65, prompt: `${c.g('חשב', 'חשבי')}:${big(m('1.36 + 0.29 = ' + HM.slot(0)))}`, hint: '6 מאיות ועוד 9 מאיות הן יותר מעשירית.', solution: addStepsH(136, 29) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['add', 'addCol', 'addLen', 'align', 'est', 'story', 'story', 'story', 'story']
        : level === 2 ? ['carry', 'carryCol', 'missing', 'est', 'estTf', 'story', 'story', 'story', 'story']
        : ['three', 'digit', 'cmpSum', 'err', 'missing2', 'budget', 'budget', 'storyTotal', 'storyCmp'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'add':
        case 'carry': {
          const [x, y] = pairH(c, kind === 'carry', [0, 6], [0, 3]);
          return {
            type: 'number', decimal: true, answer: VAL(x + y, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(x, 2)} + ${D(y, 2)} = ` + HM.slot(0)))}`,
            hint: kind === 'carry' ? `${c.g('התחל', 'התחילי')} מהמאיות. אם יש 10 מאיות או יותר — הן הופכות לעשירית.` : `${c.g('חבר', 'חברי')} מאיות למאיות, עשיריות לעשיריות ושלמים לשלמים.`,
            solution: addStepsH(x, y),
          };
        }
        case 'addCol':
        case 'carryCol': {
          const [x, y] = pairH(c, kind === 'carryCol', [1, 9], [0, 5]);
          return {
            type: 'number', decimal: true, answer: VAL(x + y, 2),
            prompt: `${c.g('חשב', 'חשבי')} במאונך:`,
            visual: V.column([D(x, 2), D(y, 2)], '+', { result: null, zeros: true }),
            hint: `נקודה מתחת לנקודה! ${c.g('התחל', 'התחילי')} מהמאיות.`,
            solution: addStepsH(x, y),
          };
        }
        case 'addLen': {
          let x, y; do { x = c.rnd(1, 8) * 100 + c.rnd(1, 9) * 10; y = c.rnd(0, 5) * 100 + c.rnd(0, 9) * 10 + c.rnd(1, 9); } while (dg(x)[1] + dg(y)[1] >= 10);
          if (c.chance(0.5)) [x, y] = [y, x];
          return {
            type: 'number', decimal: true, answer: VAL(x + y, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(x, 2)} + ${D(y, 2)} = ` + HM.slot(0)))}`,
            hint: `לאחד המספרים יש רק עשיריות. ${c.g('הוסף', 'הוסיפי')} לו אפס בסוף, ואז ${c.g('חבר', 'חברי')} מקום למקום.`,
            solution: [`${m(`${D(x % 10 ? y : x, 2)} = ${DZ(x % 10 ? y : x, 2)}`)}`].concat(addStepsH(x, y)),
          };
        }
        case 'align': {
          let x, y; do { x = c.rnd(1, 8) * 100 + c.rnd(1, 9) * 10; y = c.rnd(1, 5) * 100 + c.rnd(1, 9) * 10 + c.rnd(1, 9); } while (dg(x)[1] + dg(y)[1] >= 10);
          const mis = x / 10 + y;                                     // יישור לימין: 25 + 134 = 159 ← 1.59
          const glue = (dg(x)[0] + dg(y)[0]) * 100 + dg(x)[1] + (y % 100); // 2 + 1 = 3, 5 + 34 = 39 ← 3.39
          return Object.assign(decChoices(x + y, [mis, glue, x + y + 100], 2), {
            type: 'choice', prompt: `כמה זה ${m(`${D(x, 2)} + ${D(y, 2)}`)}?`,
            hint: `${c.g('שים לב', 'שימי לב')} לנקודה: עשיריות מחברים לעשיריות, ומאיות למאיות. ${m(D(x, 2) + ' = ' + DZ(x, 2))}.`,
            solution: [m(`${D(x, 2)} = ${DZ(x, 2)}`)].concat(addStepsH(x, y)),
          });
        }
        case 'est': {
          const near = () => { const W = c.rnd(1, 8), f = c.chance(0.5) ? c.rnd(1, 15) : c.rnd(85, 99); return W * 100 + f; };
          const x = near(), y = near(), rx = Math.round(x / 100), ry = Math.round(y / 100), ans = rx + ry;
          return Object.assign(decChoices(ans, [ans - 1, ans + 1, ans + 2, ans * 10], 0), {
            type: 'choice', prompt: `בלי לחשב בדיוק: לאיזה מספר שלם קרוב הסכום ${m(`${D(x, 2)} + ${D(y, 2)}`)}?`,
            hint: `${c.g('עגל', 'עגלי')} כל מחובר למספר השלם הקרוב אליו.`,
            solution: [`${m(D(x, 2))} ≈ ${rx}, ${m(D(y, 2))} ≈ ${ry}`, m(`${rx} + ${ry} = ${ans}`), `(בדיוק: ${m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`)})`],
          });
        }
        case 'estTf': {
          let x, y, T; do { x = c.rnd(110, 690); y = c.rnd(110, 490); T = Math.round((x + y) / 100) + c.pick([-1, 0, 1]); } while (Math.abs(x + y - T * 100) < 12);
          const ok = x + y > T * 100;
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(`הסכום ${m(`${D(x, 2)} + ${D(y, 2)}`)} גדול מ-${T}`)}`,
            hint: `${c.g('עגל', 'עגלי')} ו${c.g('אמוד', 'אמדי')} קודם. אם קשה להחליט — ${c.g('חשב', 'חשבי')} בדיוק.`,
            solution: [m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`), `${m(D(x + y, 2) + ' ' + sgnH(sgn(x + y, T * 100)) + ' ' + T)}, לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'missing': {
          const W = c.rnd(1, 5); let a; do { a = (W - 1) * 100 + c.rnd(11, 99); } while (a % 10 === 0 && c.chance(0.7));
          const r1 = (10 - (a % 10)) % 10, r2 = W * 100 - a - r1;
          return {
            type: 'number', decimal: true, answer: VAL(W * 100 - a, 2),
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:${big(m(`${D(a, 2)} + ` + HM.slot(0) + ` = ${W}`))}`,
            hint: `קודם ${c.g('השלם', 'השלימי')} את המאיות לעשירית שלמה, ואחר כך את העשיריות ל-${W}.`,
            solution: [...(r1 ? [m(`${D(a, 2)} + ${D(r1, 2)} = ${D(a + r1, 2)}`)] : []), m(`${D(a + r1, 2)} + ${D(r2, 2)} = ${W}`), `${r1 ? `ביחד: ${m(`${D(r1, 2)} + ${D(r2, 2)} = ${D(r1 + r2, 2)}`)}` : `התשובה: ${m(D(r2, 2))}`}`],
          };
        }
        case 'missing2': {
          const [x, y] = pairH(c, true, [0, 5], [0, 3]), first = c.chance(0.6);
          return {
            type: 'number', decimal: true, answer: VAL(y, 2),
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:${big(m(first ? `${D(x, 2)} + ` + HM.slot(0) + ` = ${D(x + y, 2)}` : HM.slot(0) + ` + ${D(x, 2)} = ${D(x + y, 2)}`))}`,
            hint: `איזה מספר צריך להוסיף ל-${m(D(x, 2))}? ${c.g('חשוב', 'חשבי')} על הפעולה ההפוכה.`,
            solution: [m(`${D(x + y, 2)} ${MN} ${D(x, 2)} = ${D(y, 2)}`), `בדיקה: ${m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`)} ✔`],
          };
        }
        case 'three': {
          const x = c.rnd(1, 4) * 100 + c.rnd(11, 99), pair = c.chance(0.4);
          const z = pair ? (Math.ceil(x / 100) * 100 - x) + c.rnd(0, 2) * 100 : c.rnd(0, 3) * 100 + c.rnd(1, 9) * 10;
          const y = c.rnd(0, 3) * 100 + c.rnd(11, 99);
          return {
            type: 'number', decimal: true, answer: VAL(x + y + z, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(x, 2)} + ${D(y, 2)} + ${D(z, 2)} = ` + HM.slot(0)))}`,
            hint: pair ? `${c.g('חפש', 'חפשי')} שני מחוברים שביחד יוצאים מספר שלם — זה מקצר את החישוב!` : `${c.g('חבר', 'חברי')} קודם שני מספרים, ואז ${c.g('הוסף', 'הוסיפי')} את השלישי.`,
            solution: pair ? [m(`${D(x, 2)} + ${D(z, 2)} = ${D(x + z, 2)}`), m(`${D(x + z, 2)} + ${D(y, 2)} = ${D(x + y + z, 2)}`)] : [m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`), m(`${D(x + y, 2)} + ${D(z, 2)} = ${D(x + y + z, 2)}`)],
          };
        }
        case 'digit': {
          const [x, y] = pairH(c, true, [1, 6], [0, 3]), s = x + y, [W, t, h] = dg(x), inX = c.chance(0.5);
          const [Wy, ty, hy] = dg(y);
          const left = inX ? `${W}.${t}` + HM.slot(0) + ` + ${DZ(y, 2)}` : `${DZ(x, 2)} + ${Wy}.${ty}` + HM.slot(0);
          return {
            type: 'number', answer: inX ? h : hy,
            prompt: `איזו ספרה חסרה במשבצת?${big(m(left + ` = ${DZ(s, 2)}`))}`,
            hint: `${c.g('התחל', 'התחילי')} מהמאיות: איזו ספרה ועוד ${inX ? hy : h} נותנת מספר שמסתיים ב-${s % 10}?`,
            solution: [m(`${DZ(s, 2)} ${MN} ${DZ(inX ? y : x, 2)} = ${DZ(inX ? x : y, 2)}`), `לכן הספרה החסרה היא ${inX ? h : hy}.`],
          };
        }
        case 'cmpSum': {
          const [x, y] = pairH(c, true, [0, 4], [0, 3]);
          let L = `${D(x, 2)} + ${D(y, 2)}`, lv = x + y, R, rv, sol;
          if (y > 10 && c.chance(0.5)) {
            const k = c.rnd(1, 5), d = c.pick([0, 0, 1, -1, 2]); const x2 = x + k, y2 = y - k + d;
            R = `${D(x2, 2)} + ${D(y2, 2)}`; rv = x2 + y2;
            sol = [`${m(D(x2, 2))} גדול מ-${m(D(x, 2))} ב-${m(D(k, 2))}, ו-${m(D(y2, 2))} ${y2 < y ? `קטן מ-${m(D(y, 2))} ב-${m(D(y - y2, 2))}` : `גדול מ-${m(D(y, 2))} ב-${m(D(y2 - y, 2))}`}.`, `${m(`${D(x + y, 2)} ${sgnH(sgn(lv, rv))} ${D(rv, 2)}`)}`];
          } else {
            rv = Math.round((x + y) / 10) * 10 + c.pick([-10, 0, 10, 5, -5]); R = D(rv, 2);
            sol = [m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`), m(`${D(x + y, 2)} ${sgnH(sgn(lv, rv))} ${D(rv, 2)}`)];
          }
          return {
            type: 'compare', prompt: signPrompt(c), left: L, right: R, lv: VAL(lv, 2), rv: VAL(rv, 2), answer: sgn(lv, rv),
            hint: `אפשר לחשב את שני הצדדים — או לחשוב: במה שונים המחוברים?`,
            solution: sol,
          };
        }
        case 'err': {
          const f = c.friend(), v = c.rnd(0, 2);
          let x, y, shown;
          if (v === 0) { do { x = c.rnd(1, 8) * 100 + c.rnd(1, 9) * 10; y = c.rnd(1, 5) * 100 + c.rnd(1, 9) * 10 + c.rnd(1, 9); } while (dg(x)[1] + dg(y)[1] >= 10); shown = x / 10 + y; }
          else if (v === 1) { [x, y] = pairH(c, true, [0, 5], [0, 3]); const a = dg(x), z = dg(y); shown = ((a[0] + z[0]) % 10) * 100 + ((a[1] + z[1]) % 10) * 10 + (a[2] + z[2]) % 10; }
          else { [x, y] = pairH(c, c.chance(0.5), [0, 5], [0, 3]); shown = x + y; }
          const ok = shown === x + y;
          return {
            type: 'tf', answer: ok,
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}:${big(m(`${D(x, 2)} + ${D(y, 2)} = ${D(shown, 2)}`))}${f.g('האם הוא צודק?', 'האם היא צודקת?')}`,
            hint: `${c.g('חשב', 'חשבי')} במאונך — נקודה מתחת לנקודה — ו${c.g('השווה', 'השווי')}. אפשר גם לאמוד.`,
            solution: [m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`), ok ? 'החישוב נכון.' : v === 0 ? 'החישוב לא נכון: הנקודות לא נכתבו זו מתחת לזו.' : 'החישוב לא נכון: שכחו להעביר את ה-1 למקום הבא.'],
          };
        }
        case 'story': {
          const sc = c.scene(ADD_H), p = hero(c); let x, y; do { [x, y] = pairH(c, level > 1, [1, 9], [0, 4]); } while (y < 30);
          return {
            type: 'number', decimal: true, answer: VAL(x + y, 2), unit: sc.u, prompt: sc.txt(p, D(x, 2), D(y, 2)),
            hint: `זו שאלת חיבור: ${m(`${D(x, 2)} + ${D(y, 2)}`)}. נקודה מתחת לנקודה!`,
            solution: addStepsH(x, y),
          };
        }
        case 'storyTotal': {
          const s = c.scene(SHOP), p = hero(c), x = c.rnd(2, 15) * 100 + c.rnd(11, 99), y = c.rnd(1, 9) * 100 + c.rnd(1, 9) * 10, z = c.rnd(15, 95);
          return {
            type: 'number', decimal: true, answer: VAL(x + y + z, 2), unit: '₪',
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${D(x, 2)} ₪, מתנה לחבר ב-${D(y, 2)} ₪ ו${s.cheap} ב-${z} אגורות. כמה ${p.g('שילם', 'שילמה')} בסך הכול?`,
            hint: `${c.g('כתוב', 'כתבי')} את כל המחירים בשקלים (${z} אגורות = ${m(D(z, 2))} ₪), ואז ${c.g('חבר', 'חברי')}.`,
            solution: [`${z} אגורות = ${m(D(z, 2))} ₪`, m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`), m(`${D(x + y, 2)} + ${D(z, 2)} = ${D(x + y + z, 2)}`)],
          };
        }
        case 'storyCmp': {
          // שתי דמויות, לכל אחת שני מחירים: מי שילם יותר?
          const ppl = crew(c, 2), s = c.scene(SHOP);
          let a1, a2, b1, b2; do { [a1, a2] = pairH(c, true, [1, 6], [0, 3]); b1 = a1 + c.rnd(-40, 40); b2 = a2 + c.rnd(-40, 40); } while (a1 + a2 === b1 + b2 || b1 < 50 || b2 < 50 || Math.abs(a1 + a2 - b1 - b2) > 60);
          const best = a1 + a2 > b1 + b2 ? 0 : 1;
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: `${ppl[0].name} ${ppl[0].g('קנה', 'קנתה')} ${s.item} ב-${D(a1, 2)} ₪ ו${s.item2} ב-${D(a2, 2)} ₪.<br>${ppl[1].name} ${ppl[1].g('קנה', 'קנתה')} ${s.item} ב-${D(b1, 2)} ₪ ו${s.item2} ב-${D(b2, 2)} ₪.<br>${b('מי שילם יותר בסך הכול?')}`,
            hint: `${c.g('חשב', 'חשבי')} כמה שילם כל אחד, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${ppl[0].name}: ${m(`${D(a1, 2)} + ${D(a2, 2)} = ${D(a1 + a2, 2)}`)}`, `${ppl[1].name}: ${m(`${D(b1, 2)} + ${D(b2, 2)} = ${D(b1 + b2, 2)}`)}`, `שילם יותר: ${ppl[best].name}`],
          };
        }
        case 'budget': {
          const s = c.scene(SHOP), p = hero(c), M = c.pick([10, 15, 20, 25, 30]), exact = c.chance(0.15);
          let S; do { S = M * 100 + (exact ? 0 : c.pick([-1, 1]) * c.rnd(15, 140)); } while (S < 300);
          let x; do { x = Math.round(S * (0.45 + 0.3 * Math.random())); } while (x % 100 === 0 || x % 10 === 0);
          const y = S - x, ans = S < M * 100 ? 0 : S === M * 100 ? 1 : 2;
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [`כן, ויישאר ${p.g('לו', 'לה')} עודף`, 'כן, בדיוק מספיק', `לא, חסר ${p.g('לו', 'לה')} כסף`],
            prompt: `ל${p.name} יש ${M} ₪. ${p.g('הוא', 'היא')} ${p.g('רוצה', 'רוצה')} לקנות ${s.item} ב-${D(x, 2)} ₪ ו${s.item2} ב-${D(y, 2)} ₪.<br>${b(`האם יש ${p.g('לו', 'לה')} מספיק כסף?`)}`,
            hint: `${c.g('חבר', 'חברי')} את שני המחירים ו${c.g('השווה', 'השווי')} ל-${M} ₪. אפשר להתחיל באומדן.`,
            solution: [m(`${D(x, 2)} + ${D(y, 2)} = ${D(S, 2)}`), m(`${D(S, 2)} ${sgnH(sgn(S, M * 100))} ${M}`), ans === 0 ? 'יש מספיק כסף, ויישאר עודף.' : ans === 1 ? 'הכסף מספיק בדיוק.' : 'הכסף לא מספיק.'],
          };
        }
      }
    },
  });

  /* ========== חיסור מספרים עשרוניים ========== */
  // פתרון חיסור במאונך עם פריטה (x, y במאיות, x ≥ y)
  function subStepsH(x, y) {
    const [Wa, ta, ha] = dg(x), [Wb, tb, hb] = dg(y);
    const b1 = ha < hb ? 1 : 0, dh = ha + 10 * b1 - hb, tt = ta - b1, b2 = tt < tb ? 1 : 0, dt = tt + 10 * b2 - tb;
    const s1 = b1 ? `מאיות: ${ha} &lt; ${hb}, לכן ${ta ? 'פורטים עשירית ל-10 מאיות' : 'פורטים שלם ל-10 עשיריות, ועשירית אחת מהן ל-10 מאיות'}: ${m(`${ha + 10} ${MN} ${hb} = ${dh}`)}.` : `מאיות: ${m(`${ha} ${MN} ${hb} = ${dh}`)}.`;
    const s2 = tt < 0 ? `עשיריות: נשארו 9 (אחרי הפריטה): ${m(`9 ${MN} ${tb} = ${dt}`)}.`
      : `עשיריות${b1 ? ' (אחרי שנתנו אחת למאיות)' : ''}: ${b2 ? `${tt} &lt; ${tb}, לכן פורטים שלם ל-10 עשיריות: ${m(`${tt + 10} ${MN} ${tb} = ${dt}`)}` : m(`${tt} ${MN} ${tb} = ${dt}`)}.`;
    const s3 = `שלמים${b2 ? ' (אחרי שנתנו אחד לעשיריות)' : ''}: ${m(`${Wa - b2} ${MN} ${Wb} = ${Wa - b2 - Wb}`)}. התשובה: ${m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(x - y, 2)}`)}`;
    return [s1, s2, s3];
  }
  // זוג לחיסור: borrow — 0 בלי פריטה, 1 עם פריטה
  function subPair(c, borrow, wa) {
    let x, y, g = 0;
    do {
      x = c.rnd(wa[0], wa[1]) * 100 + c.rnd(0, 9) * 10 + c.rnd(0, 9);
      y = c.rnd(0, Math.floor(x / 100)) * 100 + c.rnd(0, 9) * 10 + c.rnd(1, 9);
      g++;
    } while (g < 80 && (y >= x - 5 || (borrow ? (x % 10 >= y % 10 && dg(x)[1] >= dg(y)[1]) : (x % 10 < y % 10 || dg(x)[1] < dg(y)[1]))));
    return [x, y];
  }
  // סיפורי חיסור: עודף בחנות, חסר, הפרש במידות
  const SUB_H = SHOP.map((s) => ({ tags: s.tags, u: '₪', txt: (p, A, B) => `בארנק של ${p.name} היו ${A} ₪. ${p.g('הוא', 'היא')} ${p.g('קנה', 'קנתה')} ${s.item} ב-${B} ₪. כמה כסף נשאר ${p.g('לו', 'לה')}?` })).concat([
    { tags: ['sport'], u: 'ק"מ', txt: (p, A, B, f) => `${p.name} ${p.g('רץ', 'רצה')} השבוע ${A} ק"מ, ו${f.name} ${f.g('רץ', 'רצה')} ${B} ק"מ. בכמה ק"מ ${p.name} ${p.g('רץ', 'רצה')} יותר?` },
    { tags: ['animals'], u: 'ק"ג', txt: (p, A, B) => `הכלב של ${p.name} שוקל ${A} ק"ג, והחתול ${p.g('שלו', 'שלה')} שוקל ${B} ק"ג. בכמה ק"ג הכלב כבד יותר?` },
    { tags: ['nature'], u: 'ק"מ', txt: (p, A, B) => `מסלול הטיול ארוך ${A} ק"מ. ${p.name} כבר ${p.g('הלך', 'הלכה')} ${B} ק"מ. כמה ק"מ נשארו ${p.g('לו', 'לה')}?` },
    { tags: ['tech'], u: "מ'", txt: (p, A, B) => `הרובוט של ${p.name} צריך לנסוע ${A} מטרים. הוא כבר נסע ${B} מטרים. כמה מטרים נשארו לו?` },
    { tags: ['space'], u: "מ'", txt: (p, A, B, f) => `הטיל של ${p.name} עף לגובה ${A} מטרים, והטיל של ${f.name} עף לגובה ${B} מטרים. בכמה מטרים הטיל של ${p.name} עף גבוה יותר?` },
    { tags: ['games'], u: 'שניות', txt: (p, A, B, f) => `${f.name} ${f.g('סיים', 'סיימה')} את השלב במשחק ב-${A} שניות, ו${p.name} ${p.g('סיים', 'סיימה')} אותו ב-${B} שניות. בכמה שניות ${p.name} ${p.g('היה מהיר', 'הייתה מהירה')} יותר?` },
  ]);

  HM.lesson({
    id: 'dec-sub',
    learn: (c) => [
      {
        title: 'כמה עודף?',
        html: `${c.name}, יש ${c.g('לך', 'לך')} ${m('5')} ₪, ו${c.g('אתה רוצה', 'את רוצה')} לקנות ארטיק ב-${m('3.45')} ₪. כמה עודף ${c.g('תקבל', 'תקבלי')}?<br>נחשב ${m('5 − 3.45')}. כדי לחסר במאונך כותבים ${m('5 = 5.00')}.<br>${m('5.00 − 3.45 = 1.55')}`,
        visual: V.column(['5.00', '3.45'], '−', { result: '1.55' }),
      },
      {
        title: 'נקודה מתחת לנקודה',
        html: `מחסרים ${b('מאיות ממאיות')}, ${b('עשיריות מעשיריות')} ו${b('שלמים משלמים')}, בדיוק כמו בחיבור.<br>${m('4.68 − 2.35 = 2.33')}`,
        visual: V.column(['4.68', '2.35'], '−', { result: '2.33' }),
      },
      {
        title: 'דוגמה: פריטה',
        html: `כמה זה ${m('1.23 − 0.48')}?`,
        visual: V.column(['1.23', '0.48'], '−', { result: '0.75' }),
        steps: [
          `מאיות: ${m('3 − 8')} — אי אפשר. פורטים עשירית אחת ל-10 מאיות: ${m('13 − 8 = 5')}.`,
          `עשיריות: נשארה עשירית אחת, ו-${m('1 − 4')} — אי אפשר. פורטים שלם ל-10 עשיריות: ${m('11 − 4 = 7')}.`,
          `שלמים: לא נשארו שלמים: ${m('0 − 0 = 0')}.`,
          `${m('1.23 − 0.48 = 0.75')} ✔`,
        ],
      },
      {
        title: 'בודקים בעזרת חיבור',
        html: `חיבור וחיסור הן פעולות הפוכות. כדי לבדוק תרגיל חיסור ${c.g('חבר', 'חברי')} את ${b('ההפרש')} ואת ${b('המחסר')} — צריך לקבל את ${b('המחוסר')}.<br>${m('1.23 − 0.48 = 0.75')} ← בדיקה: ${m('0.75 + 0.48 = 1.23')} ✔`,
        visual: V.column(['0.75', '0.48'], '+', { result: '1.23' }),
      },
      {
        title: 'אומדן הפרש',
        html: `${m('7.9 − 3.2')} ← ${m('8 − 3 = 5')}. התשובה המדויקת, ${m('4.7')}, קרובה ל-5 ✔<br>אומדן עוזר לגלות טעויות: אם יצא 47 או ${m('0.47')} — משהו השתבש.`,
        visual: big(m('7.9 − 3.2 ≈ 8 − 3 = 5')),
      },
      {
        title: c.g('נסה בעצמך', 'נסי בעצמך'),
        html: `${c.name}, ${c.g('זכור', 'זכרי')}: ${m('3 = 3.00')}.`,
        quiz: { type: 'number', decimal: true, answer: 1.75, prompt: `${c.g('חשב', 'חשבי')}:${big(m(`3 ${MN} 1.25 = ` + HM.slot(0)))}`, hint: `${c.g('כתוב', 'כתבי')} את 3 כ-${m('3.00')} ו${c.g('פרוט', 'פרטי')}.`, solution: subStepsH(300, 125) },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['sub', 'subCol', 'from1', 'nlBack', 'checkChoice', 'story', 'story', 'story', 'story']
        : level === 2 ? ['borrow', 'subWhole', 'subLen', 'checkSlot', 'missSub', 'est', 'story', 'story', 'story', 'change']
        : ['err', 'missMin', 'cmpDiff', 'estTf', 'digit', 'story2', 'story2', 'storyCmp', 'storyCheck'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'sub':
        case 'borrow': {
          const [x, y] = subPair(c, kind === 'borrow', [1, 7]);
          return {
            type: 'number', decimal: true, answer: VAL(x - y, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(x, 2)} ${MN} ${D(y, 2)} = ` + HM.slot(0)))}`,
            hint: kind === 'borrow' ? `${c.g('התחל', 'התחילי')} מהמאיות. אם אין מספיק — ${c.g('פרוט', 'פרטי')} עשירית ל-10 מאיות.` : `${c.g('חסר', 'חסרי')} מאיות ממאיות, עשיריות מעשיריות ושלמים משלמים.`,
            solution: subStepsH(x, y),
          };
        }
        case 'subCol': {
          const [x, y] = subPair(c, false, [2, 9]);
          return {
            type: 'number', decimal: true, answer: VAL(x - y, 2),
            prompt: `${c.g('חשב', 'חשבי')} במאונך:`,
            visual: V.column([D(x, 2), D(y, 2)], '−', { result: null, zeros: true }),
            hint: `נקודה מתחת לנקודה! ${c.g('התחל', 'התחילי')} מהמאיות.`,
            solution: subStepsH(x, y),
          };
        }
        case 'from1': {
          let a; do { a = c.rnd(11, 99); } while (a % 10 === 0);
          const r1 = 10 - (a % 10), r2 = 100 - a - r1;
          return {
            type: 'number', decimal: true, answer: VAL(100 - a, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`1 ${MN} ${D(a, 2)} = ` + HM.slot(0)))}`,
            hint: `כמה חסר ל-${m(D(a, 2))} כדי להגיע ל-1? אפשר "לטפס" מ-${m(D(a, 2))} עד 1.`,
            solution: [m(`${D(a, 2)} + ${D(r1, 2)} = ${D(a + r1, 2)}`), m(`${D(a + r1, 2)} + ${D(r2, 2)} = 1`), `ביחד: ${m(`${D(r1, 2)} + ${D(r2, 2)} = ${D(100 - a, 2)}`)}, ולכן ${m(`1 ${MN} ${D(a, 2)} = ${D(100 - a, 2)}`)}`],
          };
        }
        case 'nlBack': {
          const L = c.rnd(1, 28), lo = L * 10; let s, j;
          do { s = lo + c.rnd(11, 19); j = c.rnd(3, 9); } while ((s - j - lo) % 10 === 0 || (s - lo) % 10 >= j);
          return {
            type: 'numberline', line: zLine(lo, 20, 2, (i) => i % 10 === 0), answer: VAL(s - j, 2),
            prompt: `${c.g('סמן', 'סמני')} על הישר את התוצאה של ${m(`${D(s, 2)} ${MN} ${D(j, 2)}`)}.`,
            hint: `${c.g('מצא', 'מצאי')} את ${m(D(s, 2))} על הישר ו${c.g('חזור', 'חזרי')} ${nH(j)} שמאלה. כל קפיצה קטנה היא מאית.`,
            solution: [`מ-${m(D(s, 2))} חוזרים ${nJ(j)} של מאית.`, m(`${D(s, 2)} ${MN} ${D(j, 2)} = ${D(s - j, 2)}`)],
          };
        }
        case 'checkChoice': {
          const [x, y] = subPair(c, false, [1, 6]), d = x - y, f = c.friend();
          return {
            type: 'choice', answer: 0,
            choices: [m(`${D(d, 2)} + ${D(y, 2)} = ${D(x, 2)}`), m(`${D(x, 2)} + ${D(y, 2)} = ${D(d, 2)}`), m(`${D(d, 2)} + ${D(x, 2)} = ${D(y, 2)}`), m(`${D(d, 2)} ${MN} ${D(y, 2)} = ${D(x, 2)}`)],
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}: ${m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(d, 2)}`)}.<br>באיזה תרגיל אפשר לבדוק את החישוב?`,
            hint: 'בתרגיל הבדיקה מחברים את ההפרש ואת המחסר — וצריך לקבל את המחוסר.',
            solution: [`ההפרש ${m(D(d, 2))} ועוד המחסר ${m(D(y, 2))} צריכים לתת את המחוסר ${m(D(x, 2))}.`, `${m(`${D(d, 2)} + ${D(y, 2)} = ${D(x, 2)}`)} ✔`],
          };
        }
        case 'subWhole': {
          const W = c.rnd(2, 10); let y; do { y = c.rnd(11, (W - 1) * 100 + 99); } while (y % 10 === 0);
          return {
            type: 'number', decimal: true, answer: VAL(W * 100 - y, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${W} ${MN} ${D(y, 2)} = ` + HM.slot(0)))}`,
            visual: V.column([`${W}.00`, D(y, 2)], '−', { result: null }),
            hint: `${c.g('כתוב', 'כתבי')} את ${W} כ-${m(`${W}.00`)}, ואז ${c.g('חסר', 'חסרי')} במאונך עם פריטה.`,
            solution: [m(`${W} = ${W}.00`)].concat(subStepsH(W * 100, y)),
          };
        }
        case 'subLen': {
          let x, y; do { x = c.rnd(2, 9) * 100 + c.rnd(0, 9) * 10; y = c.rnd(0, Math.floor(x / 100) - 1) * 100 + c.rnd(0, 9) * 10 + c.rnd(1, 9); } while (y >= x);
          return {
            type: 'number', decimal: true, answer: VAL(x - y, 2),
            prompt: `${c.g('חשב', 'חשבי')}:${big(m(`${D(x, 2)} ${MN} ${D(y, 2)} = ` + HM.slot(0)))}`,
            hint: `${c.g('הוסף', 'הוסיפי')} אפס: ${m(`${D(x, 2)} = ${DZ(x, 2)}`)}, ואז ${c.g('חסר', 'חסרי')} מקום ממקום.`,
            solution: [m(`${D(x, 2)} = ${DZ(x, 2)}`)].concat(subStepsH(x, y)),
          };
        }
        case 'checkSlot': {
          const [x, y] = subPair(c, true, [1, 7]), d = x - y, f = c.friend(), ok = c.chance(0.5);
          let shown = ok ? d : d + c.pick([10, -10, 100, 9]); if (shown < 0) shown = d + 10;
          const sum = shown + y;
          return {
            type: 'number', decimal: true, answer: VAL(sum, 2),
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}: ${m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(shown, 2)}`)}.<br>${c.g('השלם', 'השלימי')} את תרגיל הבדיקה:${big(m(`${D(shown, 2)} + ${D(y, 2)} = ` + HM.slot(0)))}`,
            hint: `${c.g('חבר', 'חברי')} את שני המספרים במאונך. אחר כך ${c.g('בדוק', 'בדקי')}: האם יצא ${m(D(x, 2))}?`,
            solution: addStepsH(shown, y).slice(-1).concat([sum === x ? `יצא ${m(D(x, 2))} — החישוב של ${f.name} נכון ✔` : `יצא ${m(D(sum, 2))} ולא ${m(D(x, 2))} — ב${f.g('חישוב שלו', 'חישוב שלה')} יש טעות. התשובה הנכונה היא ${m(D(d, 2))}.`]),
          };
        }
        case 'missSub': {
          const [x, y] = subPair(c, true, [1, 6]);
          return {
            type: 'number', decimal: true, answer: VAL(y, 2),
            prompt: `${c.g('השלם', 'השלימי')} את המחסר החסר:${big(m(`${D(x, 2)} ${MN} ` + HM.slot(0) + ` = ${D(x - y, 2)}`))}`,
            hint: `כמה צריך להוריד מ-${m(D(x, 2))} כדי להגיע ל-${m(D(x - y, 2))}?`,
            solution: [m(`${D(x, 2)} ${MN} ${D(x - y, 2)} = ${D(y, 2)}`), `בדיקה: ${m(`${D(x - y, 2)} + ${D(y, 2)} = ${D(x, 2)}`)} ✔`],
          };
        }
        case 'missMin': {
          const [x, y] = subPair(c, true, [1, 6]);
          return {
            type: 'number', decimal: true, answer: VAL(x, 2),
            prompt: `${c.g('השלם', 'השלימי')} את המחוסר החסר:${big(m(HM.slot(0) + ` ${MN} ${D(y, 2)} = ${D(x - y, 2)}`))}`,
            hint: 'המחוסר הוא המספר שממנו מחסרים. ההפרש ועוד המחסר שווים למחוסר.',
            solution: [m(`${D(x - y, 2)} + ${D(y, 2)} = ${D(x, 2)}`), `בדיקה: ${m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(x - y, 2)}`)} ✔`],
          };
        }
        case 'est': {
          const near = (lo, hi) => { const W = c.rnd(lo, hi), f = c.chance(0.5) ? c.rnd(1, 15) : c.rnd(85, 99); return W * 100 + f; };
          let x, y; do { x = near(5, 12); y = near(1, 4); } while (Math.round(x / 100) - Math.round(y / 100) < 2);
          const rx = Math.round(x / 100), ry = Math.round(y / 100), ans = rx - ry;
          return Object.assign(decChoices(ans, [ans - 1, ans + 1, rx + ry], 0), {
            type: 'choice', prompt: `בלי לחשב בדיוק: לאיזה מספר שלם קרוב ההפרש ${m(`${D(x, 2)} ${MN} ${D(y, 2)}`)}?`,
            hint: `${c.g('עגל', 'עגלי')} את המחוסר ואת המחסר למספר השלם הקרוב.`,
            solution: [`${m(D(x, 2))} ≈ ${rx}, ${m(D(y, 2))} ≈ ${ry}`, m(`${rx} ${MN} ${ry} = ${ans}`), `(בדיוק: ${m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(x - y, 2)}`)})`],
          });
        }
        case 'estTf': {
          let x, y, T; do { x = c.rnd(400, 990); y = c.rnd(105, 390); T = Math.round((x - y) / 100) + c.pick([-1, 0, 1]); } while (T < 1 || Math.abs(x - y - T * 100) < 12);
          const ok = x - y > T * 100;
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(`ההפרש ${m(`${D(x, 2)} ${MN} ${D(y, 2)}`)} גדול מ-${T}`)}`,
            hint: `${c.g('אמוד', 'אמדי')} קודם. אם קשה להחליט — ${c.g('חשב', 'חשבי')} בדיוק.`,
            solution: [m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(x - y, 2)}`), `${m(D(x - y, 2) + ' ' + sgnH(sgn(x - y, T * 100)) + ' ' + T)}, לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'err': {
          const [x, y] = subPair(c, true, [1, 7]), f = c.friend(), a = dg(x), z = dg(y), ok = c.chance(0.4);
          const wrong = (a[0] - z[0]) * 100 + Math.abs(a[1] - z[1]) * 10 + Math.abs(a[2] - z[2]);
          const shown = ok || wrong === x - y ? x - y : wrong;
          return {
            type: 'tf', answer: shown === x - y,
            prompt: `${f.name} ${f.g('חישב', 'חישבה')}:${big(m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(shown, 2)}`))}${f.g('האם הוא צודק?', 'האם היא צודקת?')} (אפשר לבדוק בעזרת חיבור)`,
            hint: `${c.g('חבר', 'חברי')} את התוצאה של ${f.name} ואת ${m(D(y, 2))}. האם יוצא ${m(D(x, 2))}?`,
            solution: [`בדיקה: ${m(`${D(shown, 2)} + ${D(y, 2)} = ${D(shown + y, 2)}`)} ${shown === x - y ? '✔' : `ולא ${m(D(x, 2))} ✘`}`, shown === x - y ? 'החישוב נכון.' : `החישוב לא נכון: חיסרו את הספרה הקטנה מהגדולה במקום לפרוט. התשובה הנכונה: ${m(D(x - y, 2))}`],
          };
        }
        case 'cmpDiff': {
          const [x, y] = subPair(c, true, [2, 7]);
          let R, rv, sol;
          if (c.chance(0.5)) {
            const k = c.rnd(1, 30), d = c.pick([0, 0, 1, -1]); const x2 = x + k + d, y2 = y + k;
            R = `${D(x2, 2)} ${MN} ${D(y2, 2)}`; rv = x2 - y2;
            sol = [`בצד ימין המחוסר גדול ב-${m(D(k + d, 2))} והמחסר גדול ב-${m(D(k, 2))}${d ? '' : ' — באותה מידה, ולכן ההפרש לא משתנה'}.`, m(`${D(x2, 2)} ${MN} ${D(y2, 2)} = ${D(rv, 2)}`), m(`${D(x - y, 2)} ${sgnH(sgn(x - y, rv))} ${D(rv, 2)}`)];
          } else {
            rv = Math.round((x - y) / 10) * 10 + c.pick([-10, 0, 10, 5]); R = D(rv, 2);
            sol = [m(`${D(x, 2)} ${MN} ${D(y, 2)} = ${D(x - y, 2)}`), m(`${D(x - y, 2)} ${sgnH(sgn(x - y, rv))} ${D(rv, 2)}`)];
          }
          return {
            type: 'compare', prompt: signPrompt(c), left: `${D(x, 2)} ${MN} ${D(y, 2)}`, right: R, lv: VAL(x - y, 2), rv: VAL(rv, 2), answer: sgn(x - y, rv),
            hint: `${c.g('חשב', 'חשבי')} את שני הצדדים, או ${c.g('חשוב', 'חשבי')}: מה השתנה במחוסר ובמחסר?`,
            solution: sol,
          };
        }
        case 'digit': {
          const [x, y] = subPair(c, true, [2, 8]), d = x - y, [Wy, ty, hy] = dg(y);
          return {
            type: 'number', answer: hy,
            prompt: `איזו ספרה חסרה במשבצת?${big(m(`${DZ(x, 2)} ${MN} ${Wy}.${ty}` + HM.slot(0) + ` = ${DZ(d, 2)}`))}`,
            hint: `${c.g('השתמש', 'השתמשי')} בבדיקה בחיבור: ההפרש ועוד המחסר שווים למחוסר.`,
            solution: [m(`${DZ(x, 2)} ${MN} ${DZ(d, 2)} = ${DZ(y, 2)}`), `לכן הספרה החסרה היא ${hy}.`],
          };
        }
        case 'story': {
          const sc = c.scene(SUB_H), p = hero(c), f = c.friend(), [x, y] = subPair(c, level > 1, [2, 9]);
          return {
            type: 'number', decimal: true, answer: VAL(x - y, 2), unit: sc.u, prompt: sc.txt(p, D(x, 2), D(y, 2), f),
            hint: `זו שאלת חיסור: ${m(`${D(x, 2)} ${MN} ${D(y, 2)}`)}. נקודה מתחת לנקודה!`,
            solution: subStepsH(x, y),
          };
        }
        case 'change': {
          const s = c.scene(SHOP), p = hero(c), M = c.pick([5, 10, 20, 50]); let y; do { y = c.rnd(Math.max(105, M * 40), M * 100 - 15); } while (y % 10 === 0);
          return {
            type: 'number', decimal: true, answer: VAL(M * 100 - y, 2), unit: '₪',
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${D(y, 2)} ₪ ו${p.g('שילם', 'שילמה')} ב${M <= 10 ? 'מטבע' : 'שטר'} של ${M} ₪. כמה עודף ${p.g('קיבל', 'קיבלה')}?`,
            hint: `${c.g('חשב', 'חשבי')} ${m(`${M} ${MN} ${D(y, 2)}`)}. ${c.g('כתוב', 'כתבי')} ${m(`${M} = ${M}.00`)}.`,
            solution: [m(`${M} = ${M}.00`)].concat(subStepsH(M * 100, y)),
          };
        }
        case 'story2': {
          // רמה 3: שני פריטים ועודף
          const s = c.scene(SHOP), p = hero(c), M = c.pick([20, 50, 100]);
          let x, y; do { x = c.rnd(M * 20, M * 55); y = c.rnd(M * 10, M * 35); } while (x % 10 === 0 || x + y >= M * 100 - 20);
          return {
            type: 'number', decimal: true, answer: VAL(M * 100 - x - y, 2), unit: '₪',
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${D(x, 2)} ₪ ו${s.item2} ב-${D(y, 2)} ₪, ו${p.g('שילם', 'שילמה')} בשטר של ${M} ₪. כמה עודף ${p.g('קיבל', 'קיבלה')}?`,
            hint: 'יש כאן שני שלבים: קודם כמה עלתה כל הקנייה, ואחר כך כמה עודף.',
            solution: [`הקנייה: ${m(`${D(x, 2)} + ${D(y, 2)} = ${D(x + y, 2)}`)}`, `העודף: ${m(`${M} ${MN} ${D(x + y, 2)} = ${D(M * 100 - x - y, 2)}`)}`, `בדיקה: ${m(`${D(M * 100 - x - y, 2)} + ${D(x + y, 2)} = ${M}`)} ✔`],
          };
        }
        case 'storyCmp': {
          // רמה 3: שתי דמויות קיבלו אותו סכום וקנו דברים שונים — למי נשאר יותר?
          const ppl = crew(c, 2), s = c.scene(SHOP), M = c.pick([10, 20, 30]);
          let x, y; do { x = c.rnd(M * 30, M * 90); y = c.rnd(M * 30, M * 90); } while (x === y || x % 10 === 0 || y % 10 === 0);
          const lx = M * 100 - x, ly = M * 100 - y, best = lx > ly ? 0 : 1;
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: `${ppl[0].name} ו${ppl[1].name} קיבלו ${M} ₪ ${ppl[0].gender === 'f' && ppl[1].gender === 'f' ? 'כל אחת' : 'כל אחד'}.<br>${ppl[0].name} ${ppl[0].g('קנה', 'קנתה')} ${s.item} ב-${D(x, 2)} ₪, ו${ppl[1].name} ${ppl[1].g('קנה', 'קנתה')} ${s.item2} ב-${D(y, 2)} ₪.<br>${b('למי נשאר יותר כסף?')}`,
            hint: `${c.g('חשב', 'חשבי')} כמה נשאר לכל אחד, או ${c.g('חשוב', 'חשבי')}: מי הוציא פחות?`,
            solution: [`${ppl[0].name}: ${m(`${M} ${MN} ${D(x, 2)} = ${D(lx, 2)}`)}`, `${ppl[1].name}: ${m(`${M} ${MN} ${D(y, 2)} = ${D(ly, 2)}`)}`, `ל${ppl[best].name} נשאר יותר, ב-${m(D(Math.abs(lx - ly), 2))} ₪.`],
          };
        }
        case 'storyCheck': {
          // רמה 3: עודף שגוי — כמה עודף צריך היה לקבל?
          const s = c.scene(SHOP), p = hero(c), M = c.pick([10, 20, 50]); let y; do { y = c.rnd(M * 30, M * 90); } while (y % 10 === 0 || (M * 100 - y) % 10 === 0);
          const right = M * 100 - y, a = dg(M * 100), z = dg(y);
          const wrong = (a[0] - z[0]) * 100 + Math.abs(a[1] - z[1]) * 10 + Math.abs(a[2] - z[2]);
          return {
            type: 'number', decimal: true, answer: VAL(right, 2), unit: '₪',
            prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${s.item} ב-${D(y, 2)} ₪ ו${p.g('שילם', 'שילמה')} ב-${M} ₪. הקופאי החזיר ${p.g('לו', 'לה')} ${D(wrong, 2)} ₪ עודף.<br>${p.name} ${p.g('בדק', 'בדקה')} בעזרת חיבור וגילה טעות. ${b('כמה עודף היה צריך לקבל?')}`,
            hint: `${c.g('חשב', 'חשבי')} ${m(`${M} ${MN} ${D(y, 2)}`)}, ו${c.g('בדוק', 'בדקי')} בחיבור.`,
            solution: [`בדיקת העודף השגוי: ${m(`${D(wrong, 2)} + ${D(y, 2)} = ${D(wrong + y, 2)}`)} — לא ${M} ✘`, `העודף הנכון: ${m(`${M} ${MN} ${D(y, 2)} = ${D(right, 2)}`)}`, `בדיקה: ${m(`${D(right, 2)} + ${D(y, 2)} = ${M}`)} ✔`],
          };
        }
      }
    },
  });

  /* ========== האלפית ========== */
  // משקלים בגרם (גרם = אלפית קילוגרם)
  const G_SC = [
    { tags: ['baking'], r: [120, 900], txt: (p, g, u) => `${p.name} ${p.g('שם', 'שמה')} בקערה ${g} ${u || 'גרם'} קמח.` },
    { tags: ['animals'], r: [35, 180], txt: (p, g, u) => `האוגר של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['space'], r: [150, 2400], txt: (p, g, u) => `${p.name} ${p.g('ראה', 'ראתה')} במוזיאון אבן מטאוריט ששוקלת ${g} ${u || 'גרם'}.` },
    { tags: ['tech'], r: [250, 1800], txt: (p, g, u) => `הרובוט של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['sport'], r: [400, 450], txt: (p, g, u) => `כדור הכדורגל של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['nature'], r: [15, 95], txt: (p, g, u) => `${p.name} ${p.g('אסף', 'אספה')} בטיול אצטרובל ששוקל ${g} ${u || 'גרם'}.` },
    { tags: ['music'], r: [380, 520], txt: (p, g, u) => `הכינור של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['art'], r: [200, 1500], txt: (p, g, u) => `גוש החימר של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['reading'], r: [180, 750], txt: (p, g, u) => `הספר החדש של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['games'], r: [190, 290], txt: (p, g, u) => `שלט המשחק של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['kpop'], r: [210, 480], txt: (p, g, u) => `האלבום החדש של הלהקה ש${p.name} ${p.g('קנה', 'קנתה')} שוקל ${g} ${u || 'גרם'}.` },
    { tags: ['magic'], r: [12, 95], txt: (p, g, u) => `בשיעור שיקויים ${p.name} ${p.g('שקל', 'שקלה')} ${g} ${u || 'גרם'} של אבקת כנפי פרפר.` },
    { tags: ['squishy'], r: [25, 160], txt: (p, g, u) => `הסקווישי בצורת אבוקדו של ${p.name} שוקל ${g} ${u || 'גרם'}.` },
  ];
  // השוואת משקלים / מרחקים עם אלפיות
  const CMP3_SC = [
    { tags: ['animals'], w: 0, line: (p, v) => `האוגר של ${p.name} שוקל ${v} ק"ג.`, big: 'האוגר של מי הכי כבד?', small: 'האוגר של מי הכי קל?' },
    { tags: ['baking'], w: 0, line: (p, v) => `${p.name} ${p.g('קנה', 'קנתה')} ${v} ק"ג גבינה.`, big: 'מי קנה הכי הרבה גבינה?', small: 'מי קנה הכי מעט גבינה?' },
    { tags: ['sport'], w: 1, line: (p, v) => `${p.name} ${p.g('רץ', 'רצה')} ${v} ק"מ.`, big: 'מי רץ את המרחק הארוך ביותר?', small: 'מי רץ את המרחק הקצר ביותר?' },
    { tags: ['nature'], w: 2, line: (p, v) => `${p.name} ${p.g('הלך', 'הלכה')} בטיול ${v} ק"מ.`, big: 'מי הלך את המרחק הארוך ביותר?', small: 'מי הלך את המרחק הקצר ביותר?' },
    { tags: ['space'], w: 0, line: (p, v) => `אבן המטאוריט באוסף של ${p.name} שוקלת ${v} ק"ג.`, big: 'האבן של מי הכי כבדה?', small: 'האבן של מי הכי קלה?' },
    { tags: ['tech'], w: 1, line: (p, v) => `הרובוט של ${p.name} שוקל ${v} ק"ג.`, big: 'הרובוט של מי הכי כבד?', small: 'הרובוט של מי הכי קל?' },
    { tags: ['music'], w: 0, line: (p, v) => `הכינור של ${p.name} שוקל ${v} ק"ג.`, big: 'הכינור של מי הכי כבד?', small: 'הכינור של מי הכי קל?' },
    { tags: ['art'], w: 1, line: (p, v) => `גוש החימר של ${p.name} שוקל ${v} ק"ג.`, big: 'גוש החימר של מי הכי כבד?', small: 'גוש החימר של מי הכי קל?' },
    { tags: ['reading'], w: 0, line: (p, v) => `הספר ש${p.name} ${p.g('קורא', 'קוראת')} עכשיו שוקל ${v} ק"ג.`, big: 'הספר של מי הכי כבד?', small: 'הספר של מי הכי קל?' },
    { tags: ['games'], w: 0, line: (p, v) => `שלט המשחק של ${p.name} שוקל ${v} ק"ג.`, big: 'שלט המשחק של מי הכי כבד?', small: 'שלט המשחק של מי הכי קל?' },
    { tags: ['kpop'], w: 0, line: (p, v) => `מקל האור של ${p.name} להופעה שוקל ${v} ק"ג.`, big: 'מקל האור של מי הכי כבד?', small: 'מקל האור של מי הכי קל?' },
    { tags: ['magic'], w: 0, line: (p, v) => `בשיעור שיקויים ${p.name} ${p.g('שקל', 'שקלה')} ${v} ק"ג של עלי מנדרגורה.`, big: 'מי שקל הכי הרבה עלים?', small: 'מי שקל הכי מעט עלים?' },
    { tags: ['squishy'], w: 0, line: (p, v) => `אוסף הסקווישים של ${p.name} שוקל ${v} ק"ג.`, big: 'האוסף של מי הכי כבד?', small: 'האוסף של מי הכי קל?' },
  ];
  // ערכים עם אלפיות שמכילים את המלכודת (0.5 מול 0.456)
  function trap3(c, W, k) {
    const a = c.rnd(2, 8);
    const set = [W * 1000 + a * 100, W * 1000 + (a - 1) * 100 + c.rnd(51, 99), W * 1000 + a * 100 + c.rnd(1, 9), W * 1000 + a * 100 + c.rnd(1, 9) * 10 + c.rnd(1, 9)];
    while (set[3] === set[2]) set[3] += 10;
    return c.shuffle(set.slice(0, k));
  }
  const PLACES3 = ['ספרת היחידות', 'ספרת העשיריות', 'ספרת המאיות', 'ספרת האלפיות'];
  const dg3 = (x) => [Math.floor(x / 1000), Math.floor(x / 100) % 10, Math.floor(x / 10) % 10, x % 10];

  HM.lesson({
    id: 'dec-thous',
    learn: (c) => [
      {
        title: 'גרם הוא אלפית קילוגרם',
        html: `${c.name}, בקילוגרם אחד יש ${b('1,000 גרם')}. לכן גרם אחד הוא ${b('אלפית')} קילוגרם: ${m(F(1, 1000) + ' = 0.001')}.<br>אוגר ששוקל 125 גרם שוקל ${m(F(125, 1000))} ק"ג, כלומר ${m('0.125')} ק"ג.`,
        visual: V.decTable('0.125'),
      },
      {
        title: 'כל מקום קטן פי 10',
        html: `כל מקום קטן ${b('פי 10')} מהמקום שמשמאלו:<br>• שלם = 10 עשיריות<br>• עשירית = 10 מאיות<br>• מאית = 10 אלפיות<br>לכן בשלם יש ${b('1,000 אלפיות')}, ובעשירית יש ${b('100 אלפיות')}.`,
        visual: V.decTable('2.345', { hl: [2] }),
      },
      {
        title: 'כותבים אלפיות',
        html: `• ${m(F(7, 1000) + ' = 0.007')} — שני אפסים אחרי הנקודה!<br>• ${m(F(45, 1000) + ' = 0.045')}<br>• ${m(F(368, 1000) + ' = 0.368')}<br>${c.g('שים לב', 'שימי לב')}: לאלפיות יש ${b('3 מקומות')} אחרי הנקודה.`,
        visual: V.decTable('0.045'),
      },
      {
        title: 'הצגה מורחבת',
        html: `נפרק את ${m('2.375')}. אפשר לקרוא אותו גם כך: "2 שלמים ו-375 אלפיות".`,
        visual: V.decTable('2.375'),
        steps: [
          `2 שלמים: ${m('2')}`,
          `3 עשיריות: ${m(F(3, 10))}`,
          `7 מאיות: ${m(F(7, 100))}`,
          `5 אלפיות: ${m(F(5, 1000))}`,
          `${m('2.375 = 2 + ' + F(3, 10) + ' + ' + F(7, 100) + ' + ' + F(5, 1000))} ✔`,
        ],
      },
      {
        title: 'זום פעמיים על הישר',
        html: `נגדיל את הקטע שבין ${m('0.12')} ל-${m('0.13')} ונחלק אותו ל-10 חלקים שווים. כל חלק הוא ${b('אלפית')}.<br>${m('0.127')} נמצא 7 אלפיות אחרי ${m('0.12')}.`,
        visual: V.numberLine(Object.assign(zLine(120, 10, 3), { marks: [{ v: 0.127, label: '0.127' }] })),
      },
      {
        title: 'השוואה עם אלפיות',
        html: `מה גדול יותר: ${m('0.5')} או ${m('0.456')}?<br>נשלים אפסים: ${m('0.500')} ו-${m('0.456')}, ונשווה מקום אחר מקום: 5 עשיריות &gt; 4 עשיריות.<br>${m('0.5 &gt; 0.456')} — מספר עם יותר ספרות ${b('אינו')} בהכרח גדול יותר!`,
        quiz: cmpQ(c, 80, 75, 3, '0.08', '0.075', `${c.g('השלם', 'השלימי')} אפס: ${m('0.08 = 0.080')}.`),
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['fracTo', 'placeName', 'readTable', 'cmpSame', 'nlThous', 'grams', 'grams', 'grams', 'story2']
        : level === 2 ? ['cmpLen', 'expanded', 'relation', 'order', 'nlThous', 'grams', 'meters', 'meters', 'story']
        : ['placePoint', 'expSum', 'digit', 'tf', 'digitValue', 'nlWords', 'story', 'storyMix', 'storyMix', 'storyOrder'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'fracTo': {
          const n = c.pick([c.rnd(1, 9), c.rnd(11, 99), c.rnd(101, 999)]);
          return {
            type: 'number', decimal: true, answer: VAL(n, 3),
            prompt: `${c.g('כתוב', 'כתבי')} את השבר כמספר עשרוני:${big(m(F(n, 1000) + ' = ' + HM.slot(0)))}`,
            hint: 'המכנה 1000 — אלה אלפיות. לאלפיות יש 3 מקומות אחרי הנקודה.',
            solution: [`${m(F(n, 1000))} = ${nTh(n)}.${n < 100 ? ' צריך 3 ספרות אחרי הנקודה, לכן משלימים אפסים לפני המספר.' : ''}`, m(F(n, 1000) + ' = ' + DZ(n, 3) + (n % 10 === 0 ? ' = ' + D(n, 3) : ''))],
          };
        }
        case 'placeName': {
          const ds = c.sample(HM.range(1, 9), 4), x = ds[0] * 1000 + ds[1] * 100 + ds[2] * 10 + ds[3], pl = c.rnd(1, 3);
          return {
            type: 'choice', choices: PLACES3, answer: pl, keep: true,
            prompt: `באיזה מקום נמצאת הספרה ${ds[pl]} במספר ${m(D(x, 3))}?`,
            hint: 'אחרי הנקודה באים, לפי הסדר: עשיריות, מאיות, אלפיות.',
            solution: [`${m(D(x, 3))}: ${ds[0]} יחידות, ${ds[1]} עשיריות, ${ds[2]} מאיות, ${ds[3]} אלפיות.`, `הספרה ${ds[pl]} היא ${PLACES3[pl]}.`],
          };
        }
        case 'readTable': {
          const W = c.rnd(0, 9); let r; do { r = c.rnd(1, 999); } while (r % 10 === 0 && c.chance(0.7));
          const x = W * 1000 + r, [w, t, h, k] = dg3(x);
          return {
            type: 'number', decimal: true, answer: VAL(x, 3),
            prompt: 'איזה מספר כתוב בטבלת המקומות?',
            visual: V.decTable(DZ(x, 3)),
            hint: 'אחרי הנקודה באים: עשיריות, מאיות, אלפיות.',
            solution: [`יחידות: ${w}, עשיריות: ${t}, מאיות: ${h}, אלפיות: ${k}.`, `המספר: ${m(D(x, 3))}`],
          };
        }
        case 'cmpSame': {
          const W = c.rnd(0, 4); let x, y;
          do { x = W * 1000 + c.rnd(101, 999); y = c.chance(0.4) ? W * 1000 + Math.floor((x % 1000) / 100) * 100 + (x % 10) * 10 + Math.floor(x / 10) % 10 : W * 1000 + c.rnd(101, 999); } while (x === y || x % 10 === 0 || y % 10 === 0);
          return cmpQ(c, x, y, 3, D(x, 3), D(y, 3), `${c.g('השווה', 'השווי')} מקום אחר מקום: שלמים, עשיריות, מאיות ואז אלפיות.`);
        }
        case 'cmpLen': {
          const W = c.rnd(0, 3), p1 = c.pick([1, 2]); let x, y;
          do {
            x = W * 1000 + (p1 === 1 ? c.rnd(1, 9) * 100 : c.rnd(1, 99) * 10);
            y = x + c.pick([-1, 1]) * (c.chance(0.6) ? c.rnd(11, 99) : c.rnd(1, 9));
          } while (y <= 0 || y % 10 === 0 || x % 100 === 0 && p1 === 2);
          const [a, z] = c.chance(0.5) ? [x, y] : [y, x];
          return cmpQ(c, a, z, 3, D(a, 3), D(z, 3), `${c.g('השלם', 'השלימי')} אפסים כך שלשני המספרים יהיו 3 ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`);
        }
        case 'expanded': {
          const ds = [c.rnd(0, 9), c.rnd(0, 9), c.rnd(1, 9), c.rnd(1, 9)], x = ds[0] * 1000 + ds[1] * 100 + ds[2] * 10 + ds[3];
          const avail = [0, 1, 2, 3].filter((i) => ds[i] > 0), which = c.pick(avail.filter((i) => i > 0));
          const terms = [];
          if (ds[0]) terms.push(which === 0 ? HM.slot(0) : String(ds[0]));
          [[1, 10], [2, 100], [3, 1000]].forEach(([i, d]) => { if (ds[i]) terms.push(F(which === i ? HM.slot(0) : ds[i], d)); });
          return {
            type: 'number', answer: ds[which],
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר בהצגה המורחבת:${big(m(`${D(x, 3)} = ` + terms.join(' + ')))}`,
            hint: 'אחרי הנקודה באים: עשיריות, מאיות ואלפיות. איזו ספרה נמצאת במקום החסר?',
            solution: [`ב-${m(D(x, 3))}: ${ds[0]} שלמים, ${ds[1]} עשיריות, ${ds[2]} מאיות, ${ds[3]} אלפיות.`, `החסר הוא ${ds[which]}.`],
          };
        }
        case 'relation': {
          const v = c.rnd(0, 3);
          if (v === 0) {
            const x = c.chance(0.5) ? c.rnd(11, 99) * 10 : c.rnd(101, 2999);
            return {
              type: 'number', answer: x, prompt: `${c.g('השלם', 'השלימי')}:${big(m(D(x, 3) + ' = ' + HM.slot(0)) + ' אלפיות')}`,
              hint: 'בשלם יש 1,000 אלפיות, בעשירית 100 ובמאית 10.',
              solution: [`${m(D(x, 3) + (DZ(x, 3) !== D(x, 3) ? ' = ' + DZ(x, 3) : '') + ' = ' + F(x, 1000))}`, `כלומר ${HM.fmt(x)} אלפיות.`],
            };
          }
          if (v === 1) {
            const h = c.rnd(2, 45);
            return { type: 'number', answer: h * 10, prompt: `${c.g('השלם', 'השלימי')}:${big(`${h} מאיות = ` + m(HM.slot(0)) + ' אלפיות')}`, hint: 'בכל מאית יש 10 אלפיות.', solution: [m(`${h} × 10 = ${h * 10}`), `${m(D(h, 2) + ' = ' + DZ(h * 10, 3))}`] };
          }
          if (v === 2) {
            const t = c.rnd(2, 9);
            return { type: 'number', answer: t * 100, prompt: `${c.g('השלם', 'השלימי')}:${big(`${t} עשיריות = ` + m(HM.slot(0)) + ' אלפיות')}`, hint: 'בכל עשירית יש 100 אלפיות.', solution: [m(`${t} × 100 = ${t * 100}`), `${m(D(t) + ' = ' + DZ(t * 100, 3))}`] };
          }
          const k = c.rnd(2, 40);
          return { type: 'number', answer: k, prompt: `${c.g('השלם', 'השלימי')}:${big(`${k * 10} אלפיות = ` + m(HM.slot(0)) + ' מאיות')}`, hint: 'כל 10 אלפיות הן מאית אחת.', solution: [m(`${k * 10} : 10 = ${k}`), `${m(DZ(k * 10, 3) + ' = ' + D(k, 2))}`] };
        }
        case 'order': {
          const W = c.rnd(0, 3), desc = c.chance(0.3), vals = trap3(c, W, 4);
          const ans = sortIdx(vals, desc);
          return {
            type: 'order', items: vals.map((v) => D(v, 3)), answer: ans,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `${c.g('השלם', 'השלימי')} אפסים כך שלכל המספרים יהיו 3 ספרות אחרי הנקודה.`,
            solution: [`עם אפסים: ${HM.seq(vals.map((v) => DZ(v, 3)))}`, m(ans.map((i) => D(vals[i], 3)).join(desc ? ' &gt; ' : ' &lt; '))],
          };
        }
        case 'nlThous':
        case 'nlWords': {
          const lo = c.rnd(1, 99) * 10, k = c.rnd(1, 9), x = lo + k;
          const form = kind === 'nlThous' ? m(D(x, 3)) : c.chance(0.6) ? m(F(x, 1000)) : b(thW(x));
          return {
            type: 'numberline', line: zLine(lo, 10, 3), answer: VAL(x, 3),
            prompt: `${c.g('סמן', 'סמני')} על הישר את המספר ${form}.`,
            hint: `הקטע מ-${m(D(lo, 3))} עד ${m(D(lo + 10, 3))} מחולק ל-10 חלקים. כל חלק הוא אלפית (${m('0.001')}).`,
            solution: [...(kind === 'nlWords' ? [`${form} = ${m(D(x, 3))}`] : []), `${m(D(x, 3))} = ${m(D(lo, 3))} ועוד ${nTh(k)}: סופרים ${nJ(k)} מ-${m(D(lo, 3))}.`],
          };
        }
        case 'grams': {
          const sc = c.scene(G_SC), p = hero(c);
          let g; do { g = c.rnd(sc.r[0], sc.r[1]); } while (g % 10 === 0 && c.chance(0.6));
          return {
            type: 'number', decimal: true, answer: VAL(g, 3), unit: 'ק"ג',
            prompt: `${sc.txt(p, HM.fmt(g))}<br>כמה קילוגרמים זה? ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: 'בקילוגרם יש 1,000 גרם, לכן כל גרם הוא אלפית קילוגרם.',
            solution: [`${HM.fmt(g)} גרם = ${m(F(g, 1000))} ק"ג.`, `${m(F(g, 1000) + ' = ' + D(g, 3))} ק"ג`],
          };
        }
        case 'meters': {
          const p = hero(c), sc = c.scene([
            { tags: ['sport'], t: (q, d) => `${q.name} ${q.g('רץ', 'רצה')} ${d} מטרים.`, a: (q) => `כמה ק"מ ${q.g('רץ', 'רצה')}?` },
            { tags: ['nature'], t: (q, d) => `${q.name} ${q.g('הלך', 'הלכה')} בטיול ${d} מטרים.`, a: (q) => `כמה ק"מ ${q.g('הלך', 'הלכה')}?` },
            { tags: ['magic'], t: (q, d) => `${q.name} ${q.g('טס', 'טסה')} על מטאטא מעופף ${d} מטרים.`, a: (q) => `כמה ק"מ ${q.g('טס', 'טסה')}?` },
            { tags: ['kpop'], t: (q, d) => `מהבית של ${q.name} עד אולם ההופעה של הלהקה יש ${d} מטרים.`, a: () => 'כמה ק"מ זה?' },
            { tags: ['tech', 'space'], t: (q, d) => `הרחפן של ${q.name} טס ${d} מטרים.`, a: () => 'כמה ק"מ טס הרחפן?' },
          ]);
          let d; do { d = c.rnd(120, 4800); } while (d % 10 === 0 && c.chance(0.6));
          return {
            type: 'number', decimal: true, answer: VAL(d, 3), unit: 'ק"מ',
            prompt: `${sc.t(p, HM.fmt(d))}<br>${sc.a(p)} ${c.g('כתוב', 'כתבי')} כמספר עשרוני.`,
            hint: 'בקילומטר יש 1,000 מטרים, לכן כל מטר הוא אלפית קילומטר.',
            solution: [`${HM.fmt(d)} מטרים = ${m(F(d, 1000))} ק"מ.`, `${m(F(d, 1000) + ' = ' + D(d, 3))} ק"מ`],
          };
        }
        case 'placePoint': {
          const [d1, d2, d3, d4] = c.sample(HM.range(1, 9), 4), digits = `${d1}${d2}${d3}${d4}`;
          const opts = [`${d1}.${d2}${d3}${d4}`, `${d1}${d2}.${d3}${d4}`, `${d1}${d2}${d3}.${d4}`];
          let ans, ask;
          if (c.chance(0.5)) { ans = c.rnd(0, 2); const lo = [d1, d1 * 10 + d2, d1 * 100 + d2 * 10 + d3][ans]; ask = `כך שיתקבל מספר בין ${lo} ל-${lo + 1}`; }
          else { const combo = c.pick([[d4, 'האלפיות', 0], [d4, 'המאיות', 1], [d4, 'העשיריות', 2], [d3, 'המאיות', 0], [d3, 'העשיריות', 1], [d2, 'העשיריות', 0]]); ans = combo[2]; ask = `כך שהספרה ${combo[0]} תהיה ספרת ${combo[1]}`; }
          return {
            type: 'choice', choices: opts, answer: ans, keep: true,
            prompt: `איפה צריך לשים נקודה עשרונית במספר ${b(digits)}, ${ask}?`,
            hint: 'אחרי הנקודה באים, לפי הסדר: עשיריות, מאיות, אלפיות. כמה ספרות צריכות להיות לפני הנקודה?',
            solution: [`ב-${m(opts[ans])} יש ${ans + 1 === 1 ? 'ספרה אחת' : `${ans + 1} ספרות`} לפני הנקודה ו-${3 - ans === 1 ? 'ספרה אחת' : `${3 - ans} ספרות`} אחריה.`, `התשובה: ${m(opts[ans])}`],
          };
        }
        case 'expSum': {
          const W = c.rnd(1, 9), t = c.chance(0.3) ? 0 : c.rnd(1, 9), h = c.chance(0.4) ? 0 : c.rnd(1, 9), k = c.rnd(1, 9), x = W * 1000 + t * 100 + h * 10 + k;
          const terms = c.shuffle([String(W)].concat(t ? [F(t, 10)] : [], h ? [F(h, 100)] : [], [F(k, 1000)]));
          return {
            type: 'number', decimal: true, answer: VAL(x, 3),
            prompt: `${c.g('כתוב', 'כתבי')} כמספר עשרוני:${big(m(terms.join(' + ') + ' = ' + HM.slot(0)))}`,
            hint: `${c.g('בדוק', 'בדקי')} כמה שלמים, עשיריות, מאיות ואלפיות יש. מקום ריק מקבל 0.`,
            solution: [`שלמים: ${W}, עשיריות: ${t}, מאיות: ${h}, אלפיות: ${k}.`, `המספר: ${m(D(x, 3))}`],
          };
        }
        case 'digit': {
          const v = c.rnd(0, 2), W = c.rnd(0, 5), t = c.rnd(1, 8), h = c.rnd(1, 8), k = c.rnd(1, 9);
          if (v === 0) {
            return {
              type: 'number', answer: h,
              prompt: `מה הספרה ה${b('קטנה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.${t}` + HM.slot(0) + `${k} &gt; ${D(W * 100 + t * 10 + h, 2)}`))}`,
              hint: `${c.g('השלם', 'השלימי')} אפס: ${m(D(W * 100 + t * 10 + h, 2) + ' = ' + DZ(W * 1000 + t * 100 + h * 10, 3))}, ו${c.g('נסה', 'נסי')} ספרות במשבצת.`,
              solution: [`${m(`${W}.${t}${h}${k} &gt; ${DZ(W * 1000 + t * 100 + h * 10, 3)}`)} ✔`, `${m(`${W}.${t}${h - 1}${k} &lt; ${DZ(W * 1000 + t * 100 + h * 10, 3)}`)} ✘`, `התשובה: ${h}`],
            };
          }
          if (v === 1) {
            return {
              type: 'number', answer: k - 1,
              prompt: `מה הספרה ה${b('גדולה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.${t}${h}` + HM.slot(0) + ` &lt; ${D(W * 1000 + t * 100 + h * 10 + k, 3)}`))}`,
              hint: 'השלמים, העשיריות והמאיות שווים. מה צריך להיות במקום האלפיות?',
              solution: [`${m(`${W}.${t}${h}${k - 1} &lt; ${D(W * 1000 + t * 100 + h * 10 + k, 3)}`)} ✔`, `${m(`${W}.${t}${h}${k}`)} שווה למספר, ולכן אינו קטן ממנו ✘`, `התשובה: ${k - 1}`],
            };
          }
          return {
            type: 'number', answer: t,
            prompt: `מה הספרה ה${b('קטנה')} ביותר שאפשר לכתוב במשבצת, כדי שהמשפט יהיה נכון?${big(m(`${W}.` + HM.slot(0) + `${h}${k} &gt; ${D(W * 10 + t)}`))}`,
            hint: `${c.g('השלם', 'השלימי')} אפסים: ${m(D(W * 10 + t) + ' = ' + DZ(W * 1000 + t * 100, 3))}, ו${c.g('נסה', 'נסי')} ספרות במשבצת.`,
            solution: [`${m(`${W}.${t}${h}${k} &gt; ${DZ(W * 1000 + t * 100, 3)}`)} ✔`, `${m(`${W}.${t - 1}${h}${k} &lt; ${DZ(W * 1000 + t * 100, 3)}`)} ✘`, `התשובה: ${t}`],
          };
        }
        case 'tf': {
          const v = c.rnd(0, 4), a = c.rnd(2, 9), W = c.rnd(0, 4);
          let st, ok, why;
          if (v === 0) { const lg = W * 1000 + (a - 1) * 100 + c.rnd(11, 99); ok = false; st = `${m(D(lg, 3) + ' &gt; ' + D(W * 10 + a))}, כי ${lg % 1000} גדול מ-${a}.`; why = `${m(D(W * 10 + a) + ' = ' + DZ(W * 1000 + a * 100, 3))}, ולכן ${m(D(W * 10 + a) + ' &gt; ' + D(lg, 3))}. משווים מקום אחר מקום!`; }
          else if (v === 1) { ok = true; st = m(D(W * 10 + a) + ' = ' + DZ(W * 1000 + a * 100, 3)); why = 'אפסים בסוף החלק העשרוני לא משנים את המספר.'; }
          else if (v === 2) { ok = false; st = m(D(W * 1000 + a, 3) + ' = ' + D(W * 100 + a, 2)); why = `ב-${m(D(W * 1000 + a, 3))} הספרה ${a} במקום האלפיות, וב-${m(D(W * 100 + a, 2))} היא במקום המאיות.`; }
          else if (v === 3) { const q = c.pick([['בעשירית יש 100 אלפיות', true], ['במאית יש 100 אלפיות', false], ['במאית יש 10 אלפיות', true], ['בשלם יש 100 אלפיות', false], ['בשלם יש 1,000 אלפיות', true]]); ok = q[1]; st = q[0]; why = 'שלם = 10 עשיריות = 100 מאיות = 1,000 אלפיות; עשירית = 100 אלפיות; מאית = 10 אלפיות.'; }
          else { const x = W * 1000 + c.rnd(101, 999), y = W * 1000 + c.rnd(101, 999), sym = c.pick(['<', '>']); ok = x !== y && sgn(x, y) === sym; st = m(`${D(x, 3)} ${sgnH(sym)} ${D(y, 3)}`); why = m(`${D(x, 3)} ${sgnH(sgn(x, y))} ${D(y, 3)}`); }
          return {
            type: 'tf', answer: ok, prompt: `נכון או לא נכון?${big(st)}`,
            hint: `${c.g('השלם', 'השלימי')} אפסים ו${c.g('השווה', 'השווי')} מקום אחר מקום.`,
            solution: [why, `לכן המשפט ${ok ? 'נכון' : 'לא נכון'}.`],
          };
        }
        case 'digitValue': {
          const ds = c.sample(HM.range(1, 9), 4), x = ds[0] * 1000 + ds[1] * 100 + ds[2] * 10 + ds[3], pl = c.rnd(1, 3), d = ds[pl];
          const asFrac = c.chance(0.5);
          const opts = asFrac ? [String(d), m(F(d, 10)), m(F(d, 100)), m(F(d, 1000))] : [nW(d), nT(d), nH(d), nTh(d)];
          return {
            type: 'choice', choices: opts, answer: pl, keep: true,
            prompt: `מה הערך של הספרה ${d} במספר ${m(D(x, 3))}?`,
            hint: 'באיזה מקום נמצאת הספרה? אחרי הנקודה: עשיריות, מאיות, אלפיות.',
            solution: [`הספרה ${d} היא ${PLACES3[pl]}.`, `ערכה: ${opts[pl]}`],
          };
        }
        case 'story2': {
          const sc = c.scene(CMP3_SC), ppl = crew(c, 2); let x, y;
          do { x = sc.w * 1000 + c.rnd(101, 999); y = sc.w * 1000 + c.rnd(101, 999); } while (x === y || Math.floor(x / 100) !== Math.floor(y / 100) && c.chance(0.5));
          const vals = [x, y], askBig = c.chance(0.5), best = vals.indexOf(askBig ? Math.max(x, y) : Math.min(x, y));
          return {
            type: 'choice', choices: ppl.map((p) => p.name), answer: best,
            prompt: ppl.map((p, i) => sc.line(p, D(vals[i], 3))).join('<br>') + `<br>${b(askBig ? sc.big : sc.small)}`,
            hint: 'משווים מקום אחר מקום: שלמים, עשיריות, מאיות, אלפיות.',
            solution: [m(D(Math.min(x, y), 3) + ' &lt; ' + D(Math.max(x, y), 3)), `התשובה: ${ppl[best].name}`],
          };
        }
        case 'story':
          return cmpStory(c, CMP3_SC, 3, (sc) => trap3(c, sc.w, 3));
        case 'storyMix': {
          // רמה 3: משקל אחד בגרם ואחד בק"ג — מי כבד יותר ובכמה גרם?
          const sc = c.scene(G_SC.filter((s) => s.r[1] < 1000)), ppl = crew(c, 2);
          let g1, g2; do { g1 = c.rnd(sc.r[0], sc.r[1]); g2 = c.rnd(sc.r[0], sc.r[1]); } while (g1 === g2 || g1 % 10 === 0);
          const hv = g1 > g2 ? 0 : 1;
          return {
            type: 'number', answer: Math.abs(g1 - g2), unit: 'גרם',
            prompt: `${sc.txt(ppl[0], m(D(g1, 3)), 'ק"ג')}<br>${sc.txt(ppl[1], HM.fmt(g2))}<br>${b('מה ההפרש בין שני המשקלים, בגרמים?')}`,
            hint: `${c.g('כתוב', 'כתבי')} את שני המשקלים באותה יחידה: ${m(D(g1, 3))} ק"ג = כמה גרם?`,
            solution: [`${m(D(g1, 3))} ק"ג = ${HM.fmt(g1)} גרם.`, m(`${Math.max(g1, g2)} ${MN} ${Math.min(g1, g2)} = ${Math.abs(g1 - g2)}`) + ' גרם'],
          };
        }
        case 'storyOrder': {
          const sc = c.scene(CMP3_SC), ppl = crew(c, 4), vals = trap3(c, sc.w, 4), desc = c.chance(0.5), ans = sortIdx(vals, desc);
          return {
            type: 'order', items: ppl.map((p) => p.name), answer: ans,
            prompt: `${ppl.map((p, i) => sc.line(p, D(vals[i], 3))).join('<br>')}<br>${c.g('סדר', 'סדרי')} את השמות לפי המספרים, <b>${desc ? 'מהגדול לקטן' : 'מהקטן לגדול'}</b>:`,
            hint: `${c.g('השלם', 'השלימי')} אפסים כך שלכל המספרים יהיו 3 ספרות אחרי הנקודה, ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`עם אפסים: ${ppl.map((p, i) => `${p.name} ${m(DZ(vals[i], 3))}`).join(', ')}`, m(ans.map((i) => D(vals[i], 3)).join(desc ? ' &gt; ' : ' &lt; ')), ans.map((i) => ppl[i].name).join(', ')],
          };
        }
      }
    },
  });
})(HM);
