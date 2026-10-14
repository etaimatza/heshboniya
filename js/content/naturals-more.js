/* חשבוניה — עיר המספרים: עוד על מספרים טבעיים
   בעיות מילוליות, סימני התחלקות, מספרים ראשוניים, חזקות, חוקיות בסדרות, השיטה הרומית */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { m, b } = HM;
  const fm = HM.fmt;
  const cnt = HM.cnt;

  /* ---------- עזרים כלליים ---------- */
  // ו' החיבור לפני מספר נכתבת עם מקף ("ו-3")
  const vav = (s) => (/^[\d(]/.test(String(s)) ? 'ו-' + s : 'ו' + s);
  const he = (p) => p.g('הוא', 'היא');
  const lo = (p) => p.g('לו', 'לה');
  // הילד/ה או חבר/ה כגיבור הסיפור
  const P = (c) => (c.chance(0.5) ? c.me : c.friend());
  // כמה דמויות עם שמות שונים
  function people(c, n, withMe) {
    const out = withMe ? [c.me] : [];
    let guard = 0;
    while (out.length < n && guard++ < 60) { const f = c.friend(); if (!out.some((x) => x.name === f.name)) out.push(f); }
    return out;
  }
  const sup = (base, e) => (e === 1 ? `${base}<sup>1</sup>` : `${base}<sup>${e}</sup>`);

  /* פריטים באריזות (לכפל, חילוק ואוספים). the = הצורה המיודעת לצירוף "מספר ..." */
  const ITEMS = [
    { tags: ['sport'], it: 'מדבקת כדורגל', its: 'מדבקות כדורגל', the: 'מדבקות הכדורגל', itf: true, cont: 'חבילה', conts: 'חבילות', cf: true, per: [6, 12] },
    { tags: ['animals'], it: 'קלף בעלי חיים', its: 'קלפי בעלי חיים', the: 'קלפי בעלי החיים', itf: false, cont: 'חבילה', conts: 'חבילות', cf: true, per: [5, 10] },
    { tags: ['space'], it: 'כוכב זוהר', its: 'כוכבים זוהרים', the: 'הכוכבים הזוהרים', itf: false, cont: 'שקית', conts: 'שקיות', cf: true, per: [10, 25] },
    { tags: ['music'], it: 'מפרט לגיטרה', its: 'מפרטים לגיטרה', the: 'המפרטים', itf: false, cont: 'קופסה', conts: 'קופסאות', cf: true, per: [4, 12] },
    { tags: ['baking'], it: 'עוגייה', its: 'עוגיות', the: 'העוגיות', itf: true, cont: 'מגש', conts: 'מגשים', cf: false, per: [8, 24] },
    { tags: ['games'], it: 'קלף', its: 'קלפים', the: 'הקלפים', itf: false, cont: 'חבילה', conts: 'חבילות', cf: true, per: [8, 15] },
    { tags: ['art'], it: 'טוש', its: 'טושים', the: 'הטושים', itf: false, cont: 'קופסה', conts: 'קופסאות', cf: true, per: [6, 24] },
    { tags: ['nature'], it: 'אצטרובל', its: 'אצטרובלים', the: 'האצטרובלים', itf: false, cont: 'סל', conts: 'סלים', cf: false, per: [10, 30] },
    { tags: ['reading'], it: 'סימנייה', its: 'סימניות', the: 'הסימניות', itf: true, cont: 'חבילה', conts: 'חבילות', cf: true, per: [5, 12] },
    { tags: ['tech'], it: 'בורג', its: 'ברגים', the: 'הברגים', itf: false, cont: 'שקית', conts: 'שקיות', cf: true, per: [10, 30] },
    { tags: ['kpop'], it: 'פוטוקארד', its: 'פוטוקארדים', the: 'הפוטוקארדים', itf: false, cont: 'חבילה', conts: 'חבילות', cf: true, per: [5, 10] },
    { tags: ['magic'], it: 'בקבוקון שיקוי', its: 'בקבוקוני שיקוי', the: 'בקבוקוני השיקוי', itf: false, cont: 'ארגז', conts: 'ארגזים', cf: false, per: [6, 12] },
    { tags: ['squishy'], it: 'סקווישי', its: 'סקווישים', the: 'הסקווישים', itf: false, cont: 'קופסה', conts: 'קופסאות', cf: true, per: [4, 12] },
  ];
  /* מוצרים בחנות. ts = יחיד מיודע, tp = רבים מיודע */
  const SHOP = [
    { tags: ['sport'], s: 'כדור', pl: 'כדורים', ts: 'הכדור', tp: 'הכדורים', f: false, p: [25, 45] },
    { tags: ['animals'], s: 'קופסת מזון לדגים', pl: 'קופסאות מזון לדגים', ts: 'קופסת המזון', tp: 'קופסאות המזון', f: true, p: [12, 24] },
    { tags: ['space'], s: 'פוסטר של כוכבי הלכת', pl: 'פוסטרים של כוכבי הלכת', ts: 'הפוסטר', tp: 'הפוסטרים', f: false, p: [15, 30] },
    { tags: ['music'], s: 'מיתר לגיטרה', pl: 'מיתרים לגיטרה', ts: 'המיתר', tp: 'המיתרים', f: false, p: [8, 16] },
    { tags: ['baking'], s: 'תבנית אפייה', pl: 'תבניות אפייה', ts: 'תבנית האפייה', tp: 'תבניות האפייה', f: true, p: [18, 35] },
    { tags: ['games'], s: 'משחק מחשב', pl: 'משחקי מחשב', ts: 'משחק המחשב', tp: 'משחקי המחשב', f: false, p: [40, 70] },
    { tags: ['art'], s: 'מכחול', pl: 'מכחולים', ts: 'המכחול', tp: 'המכחולים', f: false, p: [6, 15] },
    { tags: ['nature'], s: 'מימייה', pl: 'מימיות', ts: 'המימייה', tp: 'המימיות', f: true, p: [20, 40] },
    { tags: ['reading'], s: 'ספר', pl: 'ספרים', ts: 'הספר', tp: 'הספרים', f: false, p: [30, 60] },
    { tags: ['tech'], s: 'חיישן לרובוט', pl: 'חיישנים לרובוט', ts: 'החיישן', tp: 'החיישנים', f: false, p: [15, 35] },
    { tags: ['kpop'], s: 'אלבום של הלהקה', pl: 'אלבומים של הלהקה', ts: 'האלבום', tp: 'האלבומים', f: false, p: [45, 70] },
    { tags: ['magic'], s: 'שרביט קסמים', pl: 'שרביטי קסמים', ts: 'שרביט הקסמים', tp: 'שרביטי הקסמים', f: false, p: [25, 50] },
    { tags: ['squishy'], s: 'סקווישי', pl: 'סקווישים', ts: 'הסקווישי', tp: 'הסקווישים', f: false, p: [12, 30] },
  ];
  /* כמויות גדולות בשני חלקים (חיבור וחיסור) */
  const TOTALS = [
    { tags: ['sport'], place: 'במשחק הכדורגל', v: 'ישבו', a: 'ביציע המזרחי', b: 'ביציע המערבי', what: 'צופים' },
    { tags: ['animals'], place: 'בגן החיות', v: 'ביקרו', a: 'ביום שישי', b: 'בשבת', what: 'מבקרים' },
    { tags: ['space'], place: 'במצפה הכוכבים', v: 'ביקרו', a: 'בבוקר', b: 'בערב', what: 'מבקרים' },
    { tags: ['music'], place: 'להופעה', v: 'נמכרו', a: 'בשבוע הראשון', b: 'בשבוע השני', what: 'כרטיסים' },
    { tags: ['baking'], place: 'במאפייה', v: 'נאפו', a: 'ביום ראשון', b: 'ביום שני', what: 'לחמניות' },
    { tags: ['games'], place: 'לאתר המשחק', v: 'נרשמו', a: 'בחודש הראשון', b: 'בחודש השני', what: 'שחקנים' },
    { tags: ['art'], place: 'בתערוכה', v: 'ביקרו', a: 'בשבוע הראשון', b: 'בשבוע השני', what: 'מבקרים' },
    { tags: ['nature'], place: 'בשמורת הטבע', v: 'ניטעו', a: 'בשנה שעברה', b: 'השנה', what: 'עצים' },
    { tags: ['reading'], place: 'ביריד הספרים', v: 'נמכרו', a: 'ביום הראשון', b: 'ביום השני', what: 'ספרים' },
    { tags: ['tech'], place: 'במפעל הרובוטים', v: 'הורכבו', a: 'בינואר', b: 'בפברואר', what: 'רובוטים' },
    { tags: ['kpop'], place: 'למועדון המעריצים של הלהקה', v: 'הצטרפו', a: 'בחודש הראשון', b: 'בחודש השני', what: 'מעריצים' },
    { tags: ['magic'], place: 'בדואר הינשופים של בית הספר לקוסמים', v: 'נשלחו', a: 'בשבוע הראשון', b: 'בשבוע השני', what: 'מכתבים' },
    { tags: ['squishy'], place: 'בחנות הסקווישים', v: 'נמכרו', a: 'בחנוכה', b: 'בפסח', what: 'סקווישים' },
  ];

  /* מודל פסים: rows = [{name, parts:[{w, label, cls}]}]; o.total = תווית הסוגר המסכם (משמאל) */
  function barModel(rows, o) {
    o = o || {};
    const W = 340, nameW = 72, h = 34, gap = 12, totW = o.total != null ? 62 : 8;
    let maxRaw = 0;
    rows.forEach((r) => (maxRaw = Math.max(maxRaw, HM.sum(r.parts.map((p) => p.w)))));
    const minW = maxRaw * 0.15;
    const rs = rows.map((r) => ({ name: r.name, parts: r.parts.map((p) => Object.assign({}, p, { w: Math.max(p.w, minW) })) }));
    const maxLen = Math.max(...rs.map((r) => HM.sum(r.parts.map((p) => p.w))));
    const sc = (W - nameW - totW - 6) / maxLen;
    let s = '', y = 6, minX = W;
    rs.forEach((r) => {
      let x = W - nameW;
      if (r.name) s += S.text(W - nameW / 2 + 2, y + h / 2, r.name, { fs: 14, fw: 700 });
      r.parts.forEach((p) => {
        const w = p.w * sc, cls = p.cls || 'f-a';
        s += S.rect(x - w, y, w, h, { cls: cls + ' s-ink', sw: 2, rx: 3 });
        if (p.label != null && p.label !== '') s += S.text(x - w / 2, y + h / 2 + 1, p.label, { fs: 15, fw: 700, cls: /f-(a|b|ink)\b/.test(cls) ? 't-on' : 't-ink' });
        x -= w;
      });
      minX = Math.min(minX, x);
      y += h + gap;
    });
    const H = y - gap + 6;
    if (o.total != null) {
      const bx = minX - 10, mid = H / 2;
      s += S.path(`M${bx + 6},6 Q${bx},6 ${bx},12 L${bx},${mid - 6} L${bx - 6},${mid} L${bx},${mid + 6} L${bx},${H - 12} Q${bx},${H - 6} ${bx + 6},${H - 6}`, { fill: 'none', cls: 's-b', sw: 2.5 });
      s += S.text(bx - 30, mid, o.total, { fs: 16, fw: 800, cls: 't-b' });
    }
    return S.svg(W, H, s, { label: o.aria || 'מודל פסים', maxw: 340 });
  }

  /* ========== בעיות מילוליות (א) ========== */
  HM.lesson({
    id: 'n-word-a',
    learn: (c) => {
      const f = c.friend();
      return [
        {
          title: 'איך פותרים בעיה מילולית?',
          html: `${c.name}, בספריית הכיתה היו 245 ספרים, והגיעו עוד 130. כמה ספרים יש עכשיו?<br>• ${b('מה ידוע?')} 245 ספרים, ועוד 130.<br>• ${b('מה שואלים?')} כמה יש בסך הכול.<br>• ${b('איזו פעולה?')} מחברים: ${m('245 + 130 = 375')}.<br>• ${b('בודקים:')} האם זה הגיוני? 375 גדול מ-245 ✔`,
          visual: barModel([{ name: 'ספרים', parts: [{ w: 245, label: '245' }, { w: 130, label: '130', cls: 'f-b' }] }], { total: '?' }),
        },
        {
          title: 'חיבור או חיסור?',
          html: `• יודעים את ${b('שני החלקים')} ומחפשים את השלם? ${b('מחברים')}.<br>• יודעים את ${b('השלם וחלק אחד')}? ${b('מחסרים')}.<br>• שואלים "${b('בכמה יותר?')}" או "בכמה פחות?" — מחשבים ${b('הפרש')}, כלומר מחסרים.<br>ל${f.name} יש 85 מדבקות, ול${c.name} יש 60. בכמה יותר יש ל${f.name}? ${m('85 − 60 = 25')}`,
          visual: barModel([{ name: f.name, parts: [{ w: 60, label: '' }, { w: 25, label: '?', cls: 'f-y' }] }, { name: c.name, parts: [{ w: 60, label: '60' }] }]),
        },
        {
          title: 'כפל או חילוק?',
          html: `כשיש ${b('קבוצות שוות')}:<br>• מספר הקבוצות × כמה בכל קבוצה = כמה בסך הכול: ${m('4 × 6 = 24')}.<br>• יודעים כמה בסך הכול? ${b('מחלקים')}: ${m('24 : 6 = 4')} קבוצות, או ${m('24 : 4 = 6')} בכל קבוצה.`,
          visual: V.groups(4, 6),
        },
        {
          title: 'בעיה בכמה שלבים',
          html: `${f.name} ${f.g('קנה', 'קנתה')} 3 חבילות קלפים, ובכל חבילה 24 קלפים. אחר כך ${f.g('נתן', 'נתנה')} 15 קלפים ${f.g('לאחיו', 'לאחיה')}. כמה קלפים נשארו ל${f.name}?`,
          visual: barModel([{ name: 'קלפים', parts: [{ w: 24, label: '24' }, { w: 24, label: '24' }, { w: 24, label: '24' }] }], { total: '?' }),
          steps: [
            `שלב 1 — כמה קלפים ${f.g('קנה', 'קנתה')}? ${m('3 × 24 = 72')}`,
            `שלב 2 — כמה נשארו? ${m('72 − 15 = 57')}`,
            `בדיקה: ${m('57 + 15 = 72')} ✔ נשארו 57 קלפים.`,
          ],
        },
        {
          title: 'בעיה בלי מספרים',
          html: `לפעמים אין בבעיה מספרים בכלל! אז ${c.g('חשוב', 'חשבי')} רק על ${b('הפעולה')}.<br>ידוע המחיר של כרטיס אחד לסרט, וידוע כמה כרטיסים קנו. כמה שילמו?<br>${b('מחיר כרטיס × מספר הכרטיסים')}.<br>טיפ: ${c.g('הצב', 'הציבי')} מספרים קטנים, למשל 2 כרטיסים של 10 ₪.`,
          quiz: {
            type: 'choice',
            prompt: 'ידוע כמה עוגיות יש, וכמה עוגיות נכנסות בכל קופסה. איך מוצאים כמה קופסאות אפשר למלא?',
            choices: ['מספר העוגיות : מספר העוגיות בכל קופסה', 'מספר העוגיות × מספר העוגיות בכל קופסה', 'מספר העוגיות + מספר העוגיות בכל קופסה', 'מספר העוגיות בכל קופסה : מספר העוגיות'],
            answer: 0,
            hint: `${c.g('נסה', 'נסי')} להציב: 20 עוגיות, ו-5 בכל קופסה.`,
            solution: ['מחלקים את כל העוגיות לקבוצות שוות — קבוצה לכל קופסה.', `למשל: ${m('20 : 5 = 4')} קופסאות.`],
          },
        },
        {
          title: 'אומדן: בערך כמה?',
          html: `לפני שמחשבים, כדאי לשאול: ${b('בערך')} כמה?<br>בחנות 38 קופסאות, ובכל קופסה 21 עפרונות. ${c.g('עגל', 'עגלי')} למספרים נוחים: ${m('40 × 20 = 800')}.<br>התשובה המדויקת, ${m('38 × 21 = 798')}, קרובה מאוד ל-800 ✔<br>אומדן עוזר לגלות טעויות, ולענות מהר כש"בערך" מספיק.`,
          visual: V.numberLine({ min: 0, max: 1000, step: 100, marks: [{ v: 798, label: '798' }], w: 360 }),
        },
      ];
    },
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const kinds = L1 ? ['sum', 'diff', 'missing', 'mult', 'share', 'boxes', 'opChoice']
        : L2 ? ['twoStep', 'change', 'packs', 'ceil', 'noNum', 'estimate', 'missing']
        : ['threeStep', 'possible', 'noNum', 'estimateTF', 'ceil', 'startInverse'];
      const kind = c.pick(kinds);
      const big = () => (L1 ? c.rnd(120, 880) : c.rnd(1200, 8900));
      const OPS = ['חיבור', 'חיסור', 'כפל', 'חילוק'];
      const rp = (r) => c.rnd(r[0], r[1]);

      const qSum = () => {
        const sc = c.scene(TOTALS), A = big();
        let B = big(); if (B === A) B += 11;
        return {
          op: 0, type: 'number', answer: A + B,
          prompt: `${sc.place} ${sc.v} ${sc.a} ${fm(A)} ${sc.what}, ${vav(sc.b)} ${sc.v} ${fm(B)} ${sc.what}.<br>כמה ${sc.what} ${sc.v} ${sc.place} בסך הכול?`,
          visual: L1 ? barModel([{ name: sc.what, parts: [{ w: A, label: fm(A) }, { w: B, label: fm(B), cls: 'f-b' }] }], { total: '?' }) : undefined,
          hint: 'יודעים את שני החלקים ומחפשים את השלם. איזו פעולה מתאימה לזה?',
          solution: ['מחפשים את השלם ← מחברים את שני החלקים.', m(`${fm(A)} + ${fm(B)} = ${fm(A + B)}`), `התשובה: ${fm(A + B)} ${sc.what}.`],
        };
      };
      const qDiff = () => {
        const sc = c.scene(TOTALS), small = big();
        const d = L1 ? c.rnd(3, 30) * 10 + c.rnd(1, 9) : c.rnd(30, 300) * 10 + c.rnd(1, 9);
        const aBig = c.chance(0.5);
        const A = aBig ? small + d : small, B = aBig ? small : small + d;
        const hi = aBig ? sc.a : sc.b, low = aBig ? sc.b : sc.a;
        return {
          op: 1, type: 'number', answer: d,
          prompt: `${sc.place} ${sc.v} ${sc.a} ${fm(A)} ${sc.what}, ${vav(sc.b)} ${sc.v} ${fm(B)} ${sc.what}.<br>כמה ${sc.what} יותר ${sc.v} ${hi} מאשר ${low}?`,
          hint: '"כמה יותר?" — מחפשים את ההפרש בין שני המספרים.',
          solution: ['ההפרש = המספר הגדול פחות המספר הקטן ← חיסור.', m(`${fm(small + d)} − ${fm(small)} = ${fm(d)}`), `התשובה: ${fm(d)} ${sc.what}.`],
        };
      };
      const qMissing = () => {
        const sc = c.scene(TOTALS), A = big();
        let B = big(); if (B === A) B += 13;
        const T = A + B;
        return {
          op: 1, type: 'number', answer: B,
          prompt: `${sc.place} ${sc.v} בסך הכול ${fm(T)} ${sc.what}. ${sc.a} ${sc.v} ${fm(A)} ${sc.what}.<br>כמה ${sc.what} ${sc.v} ${sc.b}?`,
          visual: L1 ? barModel([{ name: sc.what, parts: [{ w: A, label: fm(A) }, { w: B, label: '?', cls: 'f-y' }] }], { total: fm(T) }) : undefined,
          hint: 'יודעים את השלם ואת אחד החלקים. מה עושים כדי למצוא את החלק השני?',
          solution: ['יודעים את השלם וחלק אחד ← מחסרים.', m(`${fm(T)} − ${fm(A)} = ${fm(B)}`), `בדיקה: ${m(`${fm(A)} + ${fm(B)} = ${fm(T)}`)} ✔`],
        };
      };
      const qMult = () => {
        const sc = c.scene(ITEMS), p = P(c), k = c.rnd(3, L1 ? 6 : 9), per = rp(sc.per);
        return {
          op: 2, type: 'number', answer: k * per,
          prompt: `ל${p.name} יש ${k} ${sc.conts}, ובכל ${sc.cont} ${per} ${sc.its}.<br>כמה ${sc.its} יש ל${p.name} בסך הכול?`,
          visual: L1 && k * per <= 72 ? V.groups(k, per) : undefined,
          hint: 'יש כאן קבוצות שוות. כמה קבוצות יש, וכמה בכל קבוצה?',
          solution: [`${k} קבוצות שוות, ${per} בכל קבוצה ← כפל.`, m(`${k} × ${per} = ${k * per}`), `התשובה: ${k * per} ${sc.its}.`],
        };
      };
      const qShare = () => {
        const sc = c.scene(ITEMS), p = P(c), k = c.rnd(2, 9), per = c.rnd(3, 12);
        return {
          op: 3, type: 'number', answer: per,
          prompt: `${p.name} ${p.g('מחלק', 'מחלקת')} ${k * per} ${sc.its} שווה בשווה בין ${k} חברים.<br>כמה ${sc.its} יקבל כל חבר?`,
          hint: 'מחלקים כמות לקבוצות שוות. איזו פעולה זו?',
          solution: [`מחלקים ${k * per} ל-${k} חלקים שווים ← חילוק.`, m(`${k * per} : ${k} = ${per}`), `התשובה: ${per} ${sc.its} לכל חבר.`],
        };
      };
      const qBoxes = () => {
        const sc = c.scene(ITEMS), p = P(c), per = rp(sc.per), k = c.rnd(3, 9);
        return {
          op: 3, type: 'number', answer: k,
          prompt: `${p.name} ${p.g('מסדר', 'מסדרת')} ${k * per} ${sc.its} ב${sc.conts}, ${per} ${sc.its} בכל ${sc.cont}.<br>כמה ${sc.conts} ${he(p)} ${p.g('ממלא', 'ממלאת')}?`,
          hint: `כמה פעמים ${per} "נכנס" ב-${k * per}?`,
          solution: [`מחלקים את כל ${sc.the} לקבוצות של ${per} ← חילוק.`, m(`${k * per} : ${per} = ${k}`), `התשובה: ${k} ${sc.conts}.`],
        };
      };
      const qChange = () => {
        const sh = c.scene(SHOP), p = P(c), price = rp(sh.p);
        let k = c.rnd(2, 5);
        if (k * price >= 200) k = Math.floor(199 / price);
        const total = k * price, bill = total < 50 ? 50 : total < 100 ? 100 : 200;
        return {
          type: 'number', answer: bill - total, unit: '₪',
          prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${k} ${sh.pl}. כל ${sh.s} ${sh.f ? 'עלתה' : 'עלה'} ${price} ₪.<br>${he(p)} ${p.g('שילם', 'שילמה')} בשטר של ${bill} ₪. כמה עודף ${p.g('קיבל', 'קיבלה')}?`,
          hint: `שני שלבים: קודם ${c.g('חשב', 'חשבי')} כמה עלתה כל הקנייה, ואחר כך את העודף.`,
          solution: [`הקנייה: ${m(`${k} × ${price} = ${total}`)} ₪`, `העודף: ${m(`${bill} − ${total} = ${bill - total}`)} ₪`, `התשובה: ${bill - total} ₪.`],
        };
      };
      const qTwoStep = () => {
        const sc = c.scene(TOTALS), A = big(), k = c.rnd(1, 9) * 100 + c.rnd(1, 9) * 10, more = c.chance(0.5);
        const B = more ? A + k : A - k;
        return {
          type: 'number', answer: A + B,
          prompt: `${sc.place} ${sc.v} ${sc.a} ${fm(A)} ${sc.what}. ${sc.b} ${sc.v} ${fm(k)} ${sc.what} ${more ? 'יותר' : 'פחות'}.<br>כמה ${sc.what} ${sc.v} ${sc.place} בסך הכול?`,
          hint: `קודם ${c.g('מצא', 'מצאי')} כמה ${sc.what} ${sc.v} ${sc.b}, ורק אחר כך ${c.g('חבר', 'חברי')}.`,
          solution: [`${sc.b}: ${m(`${fm(A)} ${more ? '+' : '−'} ${fm(k)} = ${fm(B)}`)}`, `בסך הכול: ${m(`${fm(A)} + ${fm(B)} = ${fm(A + B)}`)}`, `התשובה: ${fm(A + B)} ${sc.what}.`],
        };
      };
      const qPacks = () => {
        const sc = c.scene(ITEMS), p = P(c), s0 = c.rnd(25, 180), k = c.rnd(2, 6), per = rp(sc.per);
        const nw = sc.cf ? 'החדשות' : 'החדשים';
        return {
          type: 'number', answer: s0 + k * per,
          prompt: `ל${p.name} היו ${s0} ${sc.its}. ${he(p)} ${p.g('קיבל', 'קיבלה')} עוד ${k} ${sc.conts}, ובכל ${sc.cont} ${per} ${sc.its}.<br>כמה ${sc.its} יש ל${p.name} עכשיו?`,
          hint: `קודם ${c.g('מצא', 'מצאי')} כמה ${sc.its} היו ב${sc.conts} ${nw}.`,
          solution: [`ב${sc.conts} ${nw}: ${m(`${k} × ${per} = ${k * per}`)}`, `עכשיו: ${m(`${s0} + ${k * per} = ${s0 + k * per}`)}`, `התשובה: ${s0 + k * per} ${sc.its}.`],
        };
      };
      const qCeil = () => {
        const sc = c.scene(ITEMS), p = P(c), per = rp(sc.per), q = c.rnd(3, L2 ? 12 : 40), r = c.rnd(1, per - 1), N = q * per + r;
        const askRest = !L2 && c.chance(0.5);
        const full = sc.cf ? 'מלאות' : 'מלאים', extra = sc.cf ? 'נוספת' : 'נוסף';
        const need = r === 1 ? (sc.itf ? 'צריכה' : 'צריך') : (sc.itf ? 'צריכות' : 'צריכים');
        const head = `${p.name} ${p.g('מסדר', 'מסדרת')} ${fm(N)} ${sc.its} ב${sc.conts}. בכל ${sc.cont} ${sc.itf ? 'נכנסות' : 'נכנסים'} ${per} ${sc.its}.<br>`;
        const ask = askRest
          ? `כמה ${sc.its} יהיו ב${sc.cont} ${sc.cf ? 'האחרונה, שאינה מלאה' : 'האחרון, שאינו מלא'}?`
          : `כמה ${sc.conts} ${p.g('הוא צריך', 'היא צריכה')} כדי שכל ${sc.the} ייכנסו?`;
        return {
          type: 'number', answer: askRest ? r : q + 1,
          prompt: head + ask,
          hint: askRest ? `${c.g('חלק', 'חלקי')} — מה שנשאר הוא השארית.` : `${c.g('חלק', 'חלקי')}, ואל ${c.g('תשכח', 'תשכחי')} מה קורה עם השארית!`,
          solution: askRest
            ? [m(`${fm(N)} : ${per} = ${q}`) + ` (שארית ${r})`, `${q} ${sc.conts} ${full}, וב${sc.cont} ${sc.cf ? 'האחרונה' : 'האחרון'} יש רק ${cnt(r, sc.it, sc.its, sc.itf)}.`, `התשובה: ${r}.`]
            : [m(`${fm(N)} : ${per} = ${q}`) + ` (שארית ${r})`, `${q} ${sc.conts} ${full}, ועוד ${cnt(r, sc.it, sc.its, sc.itf)} ${need} ${sc.cont} ${extra}.`, `התשובה: ${q + 1} ${sc.conts}.`],
        };
      };
      const qNoNum = () => {
        const sc = c.scene(ITEMS), sh = c.scene(SHOP), [p, q2] = people(c, 2, c.chance(0.5));
        const T = L2 ? c.pick(['groups', 'boxes', 'money', 'share']) : c.pick(['gave', 'more', 'changeExpr']);
        let ask, ok, bad, ex;
        if (T === 'groups') {
          const A = `מספר ה${sc.conts}`, B = `מספר ${sc.the} בכל ${sc.cont}`;
          ask = `ידוע כמה ${sc.conts} יש, וכמה ${sc.its} יש בכל ${sc.cont}. איך מוצאים כמה ${sc.its} יש בסך הכול?`;
          ok = `${A} × ${B}`; bad = [`${A} + ${B}`, `${B} : ${A}`, `${B} − ${A}`];
          ex = `למשל: 3 ${sc.conts}, ובכל ${sc.cont} 10 ${sc.its} ← ${m('3 × 10 = 30')}.`;
        } else if (T === 'boxes') {
          const A = `מספר ${sc.the} בסך הכול`, B = `מספר ${sc.the} בכל ${sc.cont}`;
          ask = `ידוע כמה ${sc.its} יש בסך הכול, וכמה ${sc.its} ${sc.itf ? 'נכנסות' : 'נכנסים'} בכל ${sc.cont}. איך מוצאים כמה ${sc.conts} אפשר למלא?`;
          ok = `${A} : ${B}`; bad = [`${A} × ${B}`, `${B} : ${A}`, `${A} − ${B}`];
          ex = `למשל: 30 ${sc.its}, 10 בכל ${sc.cont} ← ${m('30 : 10 = 3')}.`;
        } else if (T === 'money') {
          ask = `ל${p.name} היה סכום כסף, ו${he(p)} ${p.g('קנה', 'קנתה')} ${sh.s}. איך מוצאים כמה כסף נשאר ל${p.name}?`;
          ok = `הסכום שהיה − מחיר ${sh.ts}`; bad = [`הסכום שהיה + מחיר ${sh.ts}`, `מחיר ${sh.ts} − הסכום שהיה`, `הסכום שהיה : מחיר ${sh.ts}`];
          ex = `למשל: היו 50 ₪, והמחיר 20 ₪ ← ${m('50 − 20 = 30')} ₪ נשארו.`;
        } else if (T === 'share') {
          ask = `${p.name} ${p.g('מחלק', 'מחלקת')} את כל ${sc.the} שווה בשווה בין כמה חברים. איך מוצאים כמה ${sc.its} יקבל כל חבר?`;
          ok = `מספר ${sc.the} : מספר החברים`; bad = [`מספר החברים : מספר ${sc.the}`, `מספר ${sc.the} × מספר החברים`, `מספר ${sc.the} − מספר החברים`];
          ex = `למשל: 20 ${sc.its} בין 4 חברים ← ${m('20 : 4 = 5')} לכל חבר.`;
        } else if (T === 'gave') {
          const G = `מה ש${p.g('נתן', 'נתנה')}`, R = 'מה שנשאר';
          ask = `${p.name} ${p.g('נתן', 'נתנה')} חלק מ${sc.the} ${p.g('שלו', 'שלה')} ל${q2.name}. ידוע כמה ${p.g('נתן', 'נתנה')}, וכמה נשארו ${lo(p)}. איך מוצאים כמה ${sc.its} היו ל${p.name} בהתחלה?`;
          ok = `${R} + ${G}`; bad = [`${R} − ${G}`, `${G} − ${R}`, `${R} × ${G}`];
          ex = `למשל: נשארו 10, ו${p.g('נתן', 'נתנה')} 5 ← בהתחלה היו ${m('10 + 5 = 15')}. מחברים, כי "מחזירים" את מה שניתן!`;
        } else if (T === 'more') {
          const A = `מה שיש ל${p.name}`;
          ask = `ל${q2.name} יש יותר ${sc.its} מאשר ל${p.name}. ידוע כמה ${sc.its} יש ל${p.name}, וידוע בכמה יותר יש ל${q2.name}. איך מוצאים כמה ${sc.its} יש ל${q2.name}?`;
          ok = `${A} + ההפרש`; bad = [`${A} − ההפרש`, `${A} × ההפרש`, `${A} : ההפרש`];
          ex = `למשל: ל${p.name} 10, ול${q2.name} 4 יותר ← ${m('10 + 4 = 14')}.`;
        } else {
          const pr = `מחיר ${sh.s} ${sh.f ? 'אחת' : 'אחד'}`, n = `מספר ${sh.tp}`;
          ask = `${p.name} ${p.g('קנה', 'קנתה')} כמה ${sh.pl} באותו מחיר, ו${p.g('שילם', 'שילמה')} בשטר. איך מוצאים את העודף?`;
          ok = `השטר − (${pr} × ${n})`; bad = [`(השטר − ${pr}) × ${n}`, `השטר + ${pr} × ${n}`, `${pr} − ${n} × השטר`];
          ex = `למשל: 3 ב-20 ₪ ושטר של 100 ₪ ← ${m('100 − (3 × 20) = 40')} ₪. קודם מחיר הקנייה, אחר כך העודף.`;
        }
        return {
          type: 'choice', choices: [ok].concat(bad), answer: 0,
          prompt: `${ask}<br>${b(c.g('בחר', 'בחרי') + ' את הדרך הנכונה:')}`,
          hint: `${c.g('הצב', 'הציבי')} מספרים קטנים ונוחים, ו${c.g('בדוק', 'בדקי')} איזו דרך נותנת תשובה הגיונית.`,
          solution: [`הדרך הנכונה: ${ok}.`, ex],
        };
      };
      const qEstimate = () => {
        const sc = c.scene(ITEMS);
        let k, per;
        do { k = c.rnd(21, 89); } while (k % 10 === 0 || k % 10 === 5);
        do { per = c.rnd(12, 48); } while (per % 10 === 0 || per % 10 === 5);
        const rk = HM.roundTo(k, 10), rq = HM.roundTo(per, 10), est = rk * rq;
        const ch = HM.numChoices(est, [est * 10, est / 10, rk + rq]);
        return {
          type: 'choice', choices: ch.choices, answer: 0,
          prompt: `בחנות יש ${k} ${sc.conts}, ובכל ${sc.cont} ${per} ${sc.its}.<br>בערך כמה ${sc.its} יש בחנות? ${c.g('בחר', 'בחרי')} את האומדן המתאים.`,
          hint: `${c.g('עגל', 'עגלי')} כל מספר לעשרת הקרובה, ו${c.g('כפול', 'כפלי')} את המספרים העגולים.`,
          solution: [`מעגלים: ${k} ← ${rk}, ${per} ← ${rq}.`, m(`${rk} × ${rq} = ${fm(est)}`), `החישוב המדויק, ${m(`${k} × ${per} = ${fm(k * per)}`)}, קרוב מאוד ✔`],
        };
      };
      const qEstimateTF = () => {
        const sh = c.scene(SHOP), p = P(c), k = c.rnd(6, 9), price = rp(sh.p), cost = k * price;
        const unit = cost < 200 ? 10 : 50, enough = c.chance(0.5);
        const budget = enough ? Math.ceil(cost / unit) * unit + unit : Math.floor(cost / unit) * unit - unit;
        return {
          type: 'tf', answer: enough,
          prompt: `${p.name} רוצה לקנות ${k} ${sh.pl}. כל ${sh.s} עולה ${price} ₪, ויש ל${p.name} ${budget} ₪.<br>${b('נכון או לא נכון?')} הכסף מספיק לקנייה.`,
          hint: `${c.g('עגל', 'עגלי')} את המחיר למספר נוח ו${c.g('הכפל', 'הכפילי')}: יוצא יותר או פחות מ-${budget} ₪?`,
          solution: [`אומדן: ${m(`${k} × ${HM.roundTo(price, 10)} = ${k * HM.roundTo(price, 10)}`)} — בערך.`, `בדיוק: ${m(`${k} × ${price} = ${cost}`)} ₪.`, enough ? `${m(`${cost} &lt; ${budget}`)} — הכסף מספיק. נכון.` : `${m(`${cost} &gt; ${budget}`)} — הכסף לא מספיק. לא נכון.`],
        };
      };
      const qPossible = () => {
        const sh = c.scene(SHOP), p = P(c), price = rp(sh.p), k = c.rnd(3, 8);
        const low = Math.floor((price * k - 1) / 5) * 5, high = Math.ceil((price * k + 1) / 5) * 5;
        return {
          type: 'choice', choices: [k, k - 1, k + 1, k + 2].map(String), answer: 0,
          prompt: `${p.name} ${p.g('קנה', 'קנתה')} כמה ${sh.pl}. כל ${sh.s} ${sh.f ? 'עלתה' : 'עלה'} ${price} ₪.<br>${he(p)} ${p.g('שילם', 'שילמה')} יותר מ-${low} ₪ ופחות מ-${high} ₪. כמה ${sh.pl} ${p.g('קנה', 'קנתה')}?`,
          hint: `${c.g('כפול', 'כפלי')} כל אפשרות במחיר, ו${c.g('בדוק', 'בדקי')} אם התוצאה נמצאת בין ${low} ל-${high}.`,
          solution: [`${m(`${k - 1} × ${price} = ${price * (k - 1)}`)} — פחות מ-${low} ✗`, `${m(`${k} × ${price} = ${price * k}`)} — בין ${low} ל-${high} ✔`, `${m(`${k + 1} × ${price} = ${price * (k + 1)}`)} — יותר מ-${high} ✗`, `התשובה: ${k}.`],
        };
      };
      const qThreeStep = () => {
        const s1 = c.scene(SHOP), s2 = c.pick(SHOP.filter((x) => x !== s1)), p = P(c);
        const p1 = rp(s1.p), p2 = rp(s2.p);
        let k1 = c.rnd(2, 4), k2 = c.rnd(2, 3);
        while (k1 * p1 + k2 * p2 >= 200) { if (k1 > 1) k1--; else if (k2 > 1) k2--; else break; }
        const t1 = k1 * p1, t2 = k2 * p2, total = t1 + t2, bill = total < 100 ? 100 : 200;
        const part = (k, it, pr) => `${cnt(k, it.s, it.pl, it.f)} ב-${pr} ₪${k > 1 ? ' ' + (it.f ? 'כל אחת' : 'כל אחד') : ''}`;
        return {
          type: 'number', answer: bill - total, unit: '₪',
          prompt: `${p.name} ${p.g('קנה', 'קנתה')} ${part(k1, s1, p1)} ${vav(part(k2, s2, p2))}. ${he(p)} ${p.g('שילם', 'שילמה')} בשטר של ${bill} ₪.<br>כמה עודף ${p.g('קיבל', 'קיבלה')}?`,
          hint: `${c.g('חשב', 'חשבי')} בנפרד כמה עלה כל מוצר, ${c.g('חבר', 'חברי')}, ורק אז ${c.g('מצא', 'מצאי')} את העודף.`,
          solution: [`${s1.tp}: ${m(`${k1} × ${p1} = ${t1}`)} ₪`, `${s2.tp}: ${m(`${k2} × ${p2} = ${t2}`)} ₪`, `כל הקנייה: ${m(`${t1} + ${t2} = ${total}`)} ₪`, `העודף: ${m(`${bill} − ${total} = ${bill - total}`)} ₪`],
        };
      };
      const qStartInverse = () => {
        const sc = c.scene(ITEMS), [p, q1, q2] = people(c, 3, c.chance(0.5));
        const g1 = c.rnd(5, 40), g2 = c.rnd(5, 40), left = c.rnd(10, 120), tot = g1 + g2 + left;
        return {
          type: 'number', answer: tot,
          prompt: `${p.name} ${p.g('נתן', 'נתנה')} ${g1} ${sc.its} ל${q1.name} ו-${g2} ${sc.its} ל${q2.name}. נשארו ${lo(p)} ${left} ${sc.its}.<br>כמה ${sc.its} היו ל${p.name} בהתחלה?`,
          hint: `${c.g('חשוב', 'חשבי')} מהסוף להתחלה: מה יקרה אם ${p.name} ${p.g('יקבל', 'תקבל')} בחזרה את כל מה ש${p.g('נתן', 'נתנה')}?`,
          solution: [`${p.g('הוא נתן', 'היא נתנה')} בסך הכול: ${m(`${g1} + ${g2} = ${g1 + g2}`)}`, `בהתחלה: ${m(`${left} + ${g1 + g2} = ${tot}`)}`, `בדיקה: ${m(`${tot} − ${g1 + g2} = ${left}`)} ✔`],
        };
      };

      const B = { sum: qSum, diff: qDiff, missing: qMissing, mult: qMult, share: qShare, boxes: qBoxes, change: qChange, twoStep: qTwoStep, packs: qPacks, ceil: qCeil, noNum: qNoNum, estimate: qEstimate, estimateTF: qEstimateTF, possible: qPossible, threeStep: qThreeStep, startInverse: qStartInverse };
      let q;
      if (kind === 'opChoice') {
        const base = c.pick([qSum, qDiff, qMissing, qMult, qShare, qBoxes])();
        q = {
          type: 'choice', keep: true, choices: OPS.slice(), answer: base.op,
          prompt: `${base.prompt}<br>${b(`באיזו פעולה ${c.g('תפתור', 'תפתרי')} את הבעיה?`)}`,
          hint: `${c.g('שאל', 'שאלי')} את עצמך: מחפשים שלם או חלק? יש קבוצות שוות?`,
          solution: [base.solution[0], `הפעולה: ${OPS[base.op]}.`],
        };
      } else q = B[kind]();
      delete q.op;
      if (q.visual === undefined) delete q.visual;
      return q;
    },
  });

  /* ========== בעיות מילוליות (ב): חלוקה לחלקים לא שווים ========== */
  /* שתי דמויות שאספו/צברו יחד כמות. the = הצורה המיודעת, ask = מילת השאלה */
  const PAIRS = [
    { tags: ['sport'], at: 'העונה, ', what: 'שערים', the: 'השערים', v: ['כבש', 'כבשה'], vp: 'כבשו', sm: true },
    { tags: ['animals'], at: 'בתצפית הציפורים, ', what: 'ציפורים', the: 'הציפורים', v: ['ספר', 'ספרה'], vp: 'ספרו' },
    { tags: ['space'], at: 'בלילה אחד במדבר, ', what: 'כוכבים נופלים', the: 'הכוכבים הנופלים', v: ['ראה', 'ראתה'], vp: 'ראו', sm: true },
    { tags: ['music'], at: 'בחוג הגיטרה, ', what: 'שירים', the: 'השירים', v: ['למד', 'למדה'], vp: 'למדו', sm: true },
    { tags: ['baking'], at: 'לקראת המסיבה, ', what: 'עוגיות', the: 'העוגיות', v: ['אפה', 'אפתה'], vp: 'אפו', sm: true },
    { tags: ['games'], at: 'במשחק המחשב, ', what: 'נקודות', the: 'הנקודות', v: ['צבר', 'צברה'], vp: 'צברו', big: true },
    { tags: ['art'], at: 'השנה, ', what: 'ציורים', the: 'הציורים', v: ['צייר', 'ציירה'], vp: 'ציירו', sm: true },
    { tags: ['nature'], at: 'בט"ו בשבט, ', what: 'עצים', the: 'העצים', v: ['שתל', 'שתלה'], vp: 'שתלו' },
    { tags: ['reading'], at: 'בשבוע הספר, ', what: 'עמודים', the: 'העמודים', v: ['קרא', 'קראה'], vp: 'קראו' },
    { tags: ['tech'], at: 'בחוג הרובוטיקה, ', what: 'שורות קוד', the: 'שורות הקוד', v: ['כתב', 'כתבה'], vp: 'כתבו', big: true },
    { tags: ['kpop'], at: 'במועדון המעריצים, ', what: 'פוטוקארדים', the: 'הפוטוקארדים', v: ['אסף', 'אספה'], vp: 'אספו' },
    { tags: ['magic'], at: 'בתחרות הבתים בבית הספר לקוסמים, ', what: 'נקודות', the: 'הנקודות', v: ['צבר', 'צברה'], vp: 'צברו', big: true },
    { tags: ['squishy'], at: '', what: 'סקווישים', the: 'הסקווישים', v: ['אסף', 'אספה'], vp: 'אספו', sm: true },
    { tags: [], at: '', what: '₪', the: 'הכסף', ask: 'שקלים', v: ['חסך', 'חסכה'], vp: 'חסכו', big: true },
  ];
  const units = (k, lab) => HM.range(1, k).map(() => ({ w: 1, label: lab == null ? '?' : lab }));

  HM.lesson({
    id: 'n-word-b',
    learn: (c) => {
      const [f, A, B] = people(c, 3, false);
      return [
        {
          title: 'חלוקה לא שווה',
          html: `${c.name} ו${f.name} אספו יחד 50 צדפים בים. ל${f.name} יש 10 צדפים יותר. כמה צדפים יש לכל אחד?<br>אם ${c.g('תוריד', 'תורידי')} את 10 הצדפים ה"עודפים", יישארו ${m('50 − 10 = 40')} — שני חלקים ${b('שווים')}: ${m('40 : 2 = 20')}.<br>ל${c.name} יש 20 צדפים, ול${f.name} יש ${m('20 + 10 = 30')}.`,
          visual: barModel([{ name: f.name, parts: [{ w: 20, label: '?' }, { w: 10, label: '10', cls: 'f-y' }] }, { name: c.name, parts: [{ w: 20, label: '?' }] }], { total: '50' }),
        },
        {
          title: '"גדול ב..." — דוגמה פתורה',
          html: 'הסכום של שני מספרים הוא 64, והמספר הגדול גדול מהקטן ב-12. מהם המספרים?',
          visual: barModel([{ name: 'גדול', parts: [{ w: 26, label: '?' }, { w: 12, label: '12', cls: 'f-y' }] }, { name: 'קטן', parts: [{ w: 26, label: '?' }] }], { total: '64' }),
          steps: [
            `מורידים את ההפרש: ${m('64 − 12 = 52')}`,
            `נשארו שני חלקים שווים: ${m('52 : 2 = 26')} — זה המספר הקטן.`,
            `המספר הגדול: ${m('26 + 12 = 38')}`,
            `בדיקה: ${m('26 + 38 = 64')} ✔ וגם ${m('38 − 26 = 12')} ✔`,
          ],
        },
        {
          title: '"גדול פי..."',
          html: `${A.name} ו${B.name} קראו יחד 48 עמודים. ${A.name} ${A.g('קרא', 'קראה')} פי 3 ממה ש${B.name} ${B.g('קרא', 'קראה')}.<br>החלק של ${B.name} הוא ${b('יחידה אחת')}, והחלק של ${A.name} הוא ${b('3 יחידות')}. יחד: 4 יחידות.<br>יחידה אחת: ${m('48 : 4 = 12')}. ${B.name} ${B.g('קרא', 'קראה')} 12 עמודים, ו${A.name} ${A.g('קרא', 'קראה')} ${m('3 × 12 = 36')}.`,
          visual: barModel([{ name: A.name, parts: units(3) }, { name: B.name, parts: units(1) }], { total: '48' }),
        },
        {
          title: '"ב..." או "פי..."?',
          html: `${c.g('שים', 'שימי')} לב להבדל:<br>• גדול מ-4 ${b('ב-3')} ← מוסיפים: ${m('4 + 3 = 7')}.<br>• גדול מ-4 ${b('פי 3')} ← כופלים: ${m('4 × 3 = 12')}.<br>במודל: ב"ב..." מוסיפים חתיכה לפס, וב"פי..." משכפלים את הפס כולו.`,
          visual: barModel([{ name: '4', parts: [{ w: 4, label: '4' }] }, { name: 'גדול ב-3', parts: [{ w: 4, label: '4' }, { w: 3, label: '3', cls: 'f-y' }] }, { name: 'גדול פי 3', parts: units(3, '4').map((u) => ({ w: 4, label: u.label })) }]),
          quiz: {
            type: 'choice', prompt: 'מספר גדול מ-6 פי 4. מהו המספר?', choices: ['24', '10', '2'], answer: 0,
            hint: '"פי" פירושו כפל.',
            solution: [`"פי 4" ← כופלים: ${m('6 × 4 = 24')}.`],
          },
        },
        {
          title: 'שיקול לוגי וניחוש ובדיקה',
          html: `לפני שמחשבים — ${c.g('חשוב', 'חשבי')}!<br>• אם הסכום 50 ואחד גדול מהשני, הגדול ${b('יותר מחצי')} (25), והקטן ${b('פחות מחצי')}.<br>• דרך נוספת: ${b('ניחוש ובדיקה')}. לדוגמה: הסכום 30, וההפרש 6.`,
          steps: [
            'ניחוש: 15 ו-15. ההפרש 0 — קטן מדי.',
            'ניחוש: 17 ו-13. ההפרש 4 — עדיין קטן.',
            `ניחוש: 18 ו-12. ${m('18 + 12 = 30')}, ${m('18 − 12 = 6')} ✔`,
          ],
        },
      ];
    },
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const kinds = L1 ? ['diffStory', 'timesStory', 'byOrTimes', 'reverse', 'model']
        : L2 ? ['diffStory', 'timesStory', 'pickModel', 'pairPick', 'reverse', 'model']
        : ['timesDiff', 'threeParts', 'estTF', 'diffStory', 'timesStory'];
      const kind = c.pick(kinds);
      const sc = c.scene(PAIRS);
      const mul = sc.big && !L1 ? 10 : 1;
      const [A, B, C] = c.shuffle(people(c, 3, c.chance(0.6)));
      const vA = A.g(sc.v[0], sc.v[1]), vB = B.g(sc.v[0], sc.v[1]), vC = C.g(sc.v[0], sc.v[1]);
      const W = sc.ask || sc.what;
      // טווח לפי גודל התרחיש: sm = כמויות קטנות במציאות (שערים, שירים...)
      const rr = (n, sm0) => { const r = sc.sm ? sm0 : n; return c.rnd(r[0], r[1]) * mul; };
      const intro = (S) => `${sc.at}${A.name} ${vav(B.name)} ${sc.vp} יחד ${fm(S)} ${sc.what}.`;
      const fromB = B.g('ממנו', 'ממנה');
      const askA = `כמה ${W} ${vA} ${A.name}?`, askB = `כמה ${W} ${vB} ${B.name}?`;

      if (kind === 'diffStory') {
        const x = L1 ? rr([4, 20], [2, 12]) : L2 ? rr([15, 90], [5, 25]) : rr([60, 450], [12, 60]);
        const d = L1 ? rr([2, 10], [2, 8]) : L2 ? rr([4, 40], [3, 15]) : rr([15, 150], [4, 30]);
        const S = 2 * x + d, askBig = c.chance(0.5);
        return {
          type: 'number', answer: askBig ? x + d : x,
          prompt: `${intro(S)} ${A.name} ${vA} ${fm(d)} ${sc.what} יותר מ${B.name}.<br>${askBig ? askA : askB}`,
          visual: L1 ? barModel([{ name: A.name, parts: [{ w: x, label: '?' }, { w: d, label: fm(d), cls: 'f-y' }] }, { name: B.name, parts: [{ w: x, label: '?' }] }], { total: fm(S) }) : undefined,
          hint: `${c.g('הורד', 'הורידי')} מהסכום את ה"עודף" של ${A.name} — יישארו שני חלקים שווים.`,
          solution: [`בלי העודף: ${m(`${fm(S)} − ${fm(d)} = ${fm(2 * x)}`)}`, `שני חלקים שווים: ${m(`${fm(2 * x)} : 2 = ${fm(x)}`)} — החלק של ${B.name}.`, `${A.name}: ${m(`${fm(x)} + ${fm(d)} = ${fm(x + d)}`)}`, `התשובה: ${fm(askBig ? x + d : x)}.`],
        };
      }
      if (kind === 'timesStory') {
        const k = L1 ? c.rnd(2, 3) : L2 ? c.rnd(2, 5) : c.rnd(3, 7);
        const x = L1 ? rr([2, 10], [2, 6]) : L2 ? rr([5, 30], [3, 12]) : rr([12, 90], [4, 12]);
        const S = (k + 1) * x, askBig = c.chance(0.5);
        return {
          type: 'number', answer: askBig ? k * x : x,
          prompt: `${intro(S)} ${A.name} ${vA} פי ${k} ממה ש${B.name} ${vB}.<br>${askBig ? askA : askB}`,
          visual: L1 ? barModel([{ name: A.name, parts: units(k) }, { name: B.name, parts: units(1) }], { total: fm(S) }) : undefined,
          hint: `אם החלק של ${B.name} הוא יחידה אחת, כמה יחידות יש ל${A.name}? וכמה יחידות יחד?`,
          solution: [`${B.name}: יחידה אחת. ${A.name}: ${k} יחידות. יחד: ${k + 1} יחידות.`, `יחידה אחת: ${m(`${fm(S)} : ${k + 1} = ${fm(x)}`)} — החלק של ${B.name}.`, `${A.name}: ${m(`${k} × ${fm(x)} = ${fm(k * x)}`)}`, `התשובה: ${fm(askBig ? k * x : x)}.`],
        };
      }
      if (kind === 'byOrTimes') {
        const n = c.rnd(3, 9), k = c.rnd(2, Math.min(5, n - 1)), times = c.chance(0.5);
        const ans = times ? n * k : n + k, other = times ? n + k : n * k;
        return {
          type: 'choice', choices: [ans, other, n - k].map(String), answer: 0,
          prompt: `${sc.at}${B.name} ${vB} ${n} ${sc.what}. ${A.name} ${vA} ${times ? `פי ${k} ${fromB}` : `${k} ${sc.what} יותר ${fromB}`}.<br>${askA}`,
          hint: `${c.g('שים', 'שימי')} לב: "פי ${k}" פירושו לכפול, ו"${k} יותר" פירושו להוסיף.`,
          solution: [times ? `"פי ${k}" ← כפל: ${m(`${n} × ${k} = ${n * k}`)}` : `"${k} יותר" ← חיבור: ${m(`${n} + ${k} = ${n + k}`)}`, `התשובה: ${ans}.`],
        };
      }
      if (kind === 'reverse') {
        const times = c.chance(0.5), k = c.rnd(2, L1 ? 3 : 5);
        const x = L1 ? rr([3, 12], [2, 8]) : rr([12, 60], [4, 15]), d = L1 ? rr([2, 9], [2, 6]) : rr([5, 40], [3, 12]);
        const a = times ? k * x : x + d;
        const both = A.gender === 'f' && B.gender === 'f' ? 'שתיהן' : 'שניהם';
        return {
          type: 'number', answer: x + a,
          prompt: `${sc.at}${B.name} ${vB} ${fm(x)} ${sc.what}. ${A.name} ${vA} ${times ? `פי ${k} ${fromB}` : `${fm(d)} ${sc.what} יותר ${fromB}`}.<br>כמה ${W} ${sc.vp} ${both} יחד?`,
          hint: `קודם ${c.g('מצא', 'מצאי')} כמה ${vA} ${A.name}, ואחר כך ${c.g('חבר', 'חברי')}.`,
          solution: [`${A.name}: ${m(times ? `${k} × ${fm(x)} = ${fm(a)}` : `${fm(x)} + ${fm(d)} = ${fm(a)}`)}`, `יחד: ${m(`${fm(x)} + ${fm(a)} = ${fm(x + a)}`)}`, `התשובה: ${fm(x + a)}.`],
        };
      }
      if (kind === 'model') {
        const times = c.chance(0.5), askBig = c.chance(0.5);
        if (times) {
          const k = c.rnd(2, L1 ? 3 : 5), x = L1 ? c.rnd(3, 12) : c.rnd(8, 40), S = (k + 1) * x;
          return {
            type: 'number', answer: askBig ? k * x : x,
            prompt: `הסכום של שני מספרים הוא ${S}. המספר הגדול גדול מהקטן פי ${k}.<br>מהו המספר ${askBig ? 'הגדול' : 'הקטן'}?`,
            visual: barModel([{ name: 'גדול', parts: units(k) }, { name: 'קטן', parts: units(1) }], { total: String(S) }),
            hint: `${c.g('ספור', 'ספרי')} כמה יחידות יש בשני הפסים יחד.`,
            solution: [`יחד: ${k + 1} יחידות.`, `יחידה: ${m(`${S} : ${k + 1} = ${x}`)} — המספר הקטן.`, `הגדול: ${m(`${k} × ${x} = ${k * x}`)}`],
          };
        }
        const x = L1 ? c.rnd(4, 20) : c.rnd(15, 90), d = L1 ? c.rnd(2, 10) : c.rnd(4, 40), S = 2 * x + d;
        return {
          type: 'number', answer: askBig ? x + d : x,
          prompt: `הסכום של שני מספרים הוא ${S}. המספר הגדול גדול מהקטן ב-${d}.<br>מהו המספר ${askBig ? 'הגדול' : 'הקטן'}?`,
          visual: barModel([{ name: 'גדול', parts: [{ w: x, label: '?' }, { w: d, label: String(d), cls: 'f-y' }] }, { name: 'קטן', parts: [{ w: x, label: '?' }] }], { total: String(S) }),
          hint: `${c.g('הורד', 'הורידי')} את ההפרש מהסכום, ו${c.g('חלק', 'חלקי')} את מה שנשאר לשני חלקים שווים.`,
          solution: [m(`${S} − ${d} = ${2 * x}`), `${m(`${2 * x} : 2 = ${x}`)} — המספר הקטן.`, `הגדול: ${m(`${x} + ${d} = ${x + d}`)}`],
        };
      }
      if (kind === 'pickModel') {
        const times = c.chance(0.5);
        const M = (ra, rb, tot) => barModel([{ name: A.name, parts: ra }, { name: B.name, parts: rb }], { total: tot });
        if (times) {
          const k = c.rnd(2, 4), x = rr([5, 25], [3, 10]), S = (k + 1) * x;
          return {
            type: 'choice', answer: 0,
            choices: [M(units(k), units(1), fm(S)), M(units(1), units(k), fm(S)), M([{ w: 1, label: '?' }, { w: 1, label: String(k), cls: 'f-y' }], units(1), fm(S)), M(units(k + 1), units(1), fm(S))],
            prompt: `${intro(S)} ${A.name} ${vA} פי ${k} ממה ש${B.name} ${vB}.<br>איזה מודל מתאים לסיפור?`,
            hint: `${c.g('בדוק', 'בדקי')}: כמה יחידות צריכות להיות בפס של ${A.name}, וכמה בפס של ${B.name}?`,
            solution: [`${B.name}: יחידה אחת. ${A.name}: פי ${k} — כלומר ${k} יחידות שוות.`, `הסוגר מראה את הסכום: ${fm(S)}.`],
          };
        }
        const x = rr([10, 40], [5, 15]), d = rr([4, 20], [2, 8]), S = 2 * x + d;
        return {
          type: 'choice', answer: 0,
          choices: [M([{ w: x, label: '?' }, { w: d, label: fm(d), cls: 'f-y' }], [{ w: x, label: '?' }], fm(S)), M([{ w: x, label: '?' }], [{ w: x, label: '?' }, { w: d, label: fm(d), cls: 'f-y' }], fm(S)), M(units(2), units(1), fm(S)), M([{ w: x, label: '?' }, { w: d, label: fm(S), cls: 'f-y' }], [{ w: x, label: '?' }], fm(d))],
          prompt: `${intro(S)} ${A.name} ${vA} ${fm(d)} ${sc.what} יותר מ${B.name}.<br>איזה מודל מתאים לסיפור?`,
          hint: `${c.g('בדוק', 'בדקי')}: למי הפס ארוך יותר, ומה כתוב על החתיכה הנוספת?`,
          solution: [`ל${A.name} יש יותר, לכן הפס של ${A.name} ארוך יותר בחתיכה של ${fm(d)}.`, `הסוגר מראה את הסכום: ${fm(S)}.`],
        };
      }
      if (kind === 'pairPick') {
        const x = c.rnd(15, 90), d = c.rnd(4, 40), S = 2 * x + d, h = Math.floor(S / 2);
        const pr = (u, v) => `${Math.min(u, v)} ו-${Math.max(u, v)}`;
        const ok = pr(x, x + d);
        const cands = [pr(h, h + d), pr(x + 1, x + d - 1), pr(d, S - d), pr(x - 1, x + d + 1)];
        const choices = [ok];
        cands.forEach((s0) => { if (choices.length < 4 && choices.indexOf(s0) < 0) choices.push(s0); });
        return {
          type: 'choice', choices, answer: 0,
          prompt: `הסכום של שני מספרים הוא ${S}, וההפרש ביניהם הוא ${d}.<br>מהם שני המספרים?`,
          hint: `${c.g('בדוק', 'בדקי')} כל זוג בשני תנאים: גם הסכום, וגם ההפרש.`,
          solution: [m(`${S} − ${d} = ${S - d}`), `${m(`${S - d} : 2 = ${x}`)}, ${m(`${x} + ${d} = ${x + d}`)}`, `בדיקה: ${m(`${x} + ${x + d} = ${S}`)} ✔ ${m(`${x + d} − ${x} = ${d}`)} ✔`],
        };
      }
      if (kind === 'timesDiff') {
        const k = c.rnd(3, 6), x = rr([6, 40], [3, 10]), D = (k - 1) * x, askBig = c.chance(0.4);
        return {
          type: 'number', answer: askBig ? k * x : x,
          prompt: `${sc.at}${A.name} ${vA} פי ${k} ממה ש${B.name} ${vB}, וגם ${fm(D)} ${sc.what} יותר ${fromB}.<br>${askBig ? askA : askB}`,
          hint: `${c.g('צייר', 'ציירי')} פסים: ל${B.name} יחידה אחת, ול${A.name} ${k} יחידות. כמה יחידות הן ההפרש?`,
          solution: [`ההפרש הוא ${k - 1} יחידות.`, `יחידה אחת: ${m(`${fm(D)} : ${k - 1} = ${fm(x)}`)} — החלק של ${B.name}.`, `${A.name}: ${m(`${k} × ${fm(x)} = ${fm(k * x)}`)}`, `התשובה: ${fm(askBig ? k * x : x)}.`],
        };
      }
      if (kind === 'threeParts') {
        const head = `${sc.at}${A.name}, ${B.name} ${vav(C.name)} ${sc.vp} יחד`;
        if (c.chance(0.5)) {
          const x = rr([5, 40], [2, 8]), S = 6 * x, askC = c.chance(0.5);
          return {
            type: 'number', answer: askC ? 3 * x : x,
            prompt: `${head} ${fm(S)} ${sc.what}. ${B.name} ${vB} פי 2 ממה ש${A.name} ${vA}, ${vav(C.name)} ${vC} פי 3 ממה ש${A.name} ${vA}.<br>כמה ${W} ${askC ? vC + ' ' + C.name : vA + ' ' + A.name}?`,
            hint: `אם החלק של ${A.name} הוא יחידה אחת — כמה יחידות יש לכל השלושה יחד?`,
            solution: [`${A.name}: יחידה אחת, ${B.name}: 2 יחידות, ${C.name}: 3 יחידות. יחד: 6 יחידות.`, `יחידה: ${m(`${fm(S)} : 6 = ${fm(x)}`)} — החלק של ${A.name}.`, `${C.name}: ${m(`3 × ${fm(x)} = ${fm(3 * x)}`)}`, `התשובה: ${fm(askC ? 3 * x : x)}.`],
          };
        }
        const x = rr([10, 80], [3, 15]), d = rr([3, 20], [2, 6]), S = 3 * x + 3 * d, askC = c.chance(0.5);
        return {
          type: 'number', answer: askC ? x + 2 * d : x,
          prompt: `${head} ${fm(S)} ${sc.what}. ${B.name} ${vB} ${fm(d)} ${sc.what} יותר מ${A.name}, ${vav(C.name)} ${vC} ${fm(d)} ${sc.what} יותר מ${B.name}.<br>כמה ${W} ${askC ? vC + ' ' + C.name : vA + ' ' + A.name}?`,
          hint: `כמה יותר מ${A.name} יש ל${C.name}? ${c.g('הורד', 'הורידי')} את כל התוספות מהסכום, ו${c.g('חלק', 'חלקי')} ל-3.`,
          solution: [`${B.name}: ${fm(d)} יותר מ${A.name}. ${C.name}: ${fm(2 * d)} יותר מ${A.name}.`, `בלי התוספות: ${m(`${fm(S)} − ${fm(d)} − ${fm(2 * d)} = ${fm(3 * x)}`)}`, `${m(`${fm(3 * x)} : 3 = ${fm(x)}`)} — החלק של ${A.name}.`, `${C.name}: ${m(`${fm(x)} + ${fm(2 * d)} = ${fm(x + 2 * d)}`)}. התשובה: ${fm(askC ? x + 2 * d : x)}.`],
        };
      }
      // estTF: שיקול לוגי
      const k = c.rnd(2, 5), x = rr([10, 90], [4, 15]), S = (k + 1) * x, a = k * x;
      const t = c.pick(['halfA', 'halfB', 'thr', 'thr']);
      let stmt, ans;
      if (t === 'halfA') { stmt = `${A.name} ${vA} יותר ממחצית ${sc.the}.`; ans = true; }
      else if (t === 'halfB') { stmt = `${B.name} ${vB} יותר ממחצית ${sc.the}.`; ans = false; }
      else {
        const step = 10 * mul;
        let T = HM.roundTo(a, step) + (c.chance(0.5) ? step : -step);
        if (T === a) T += step;
        if (T <= 0) T = step;
        stmt = `${A.name} ${vA} יותר מ-${fm(T)} ${sc.what}.`; ans = a > T;
      }
      return {
        type: 'tf', answer: ans,
        prompt: `${intro(S)} ${A.name} ${vA} פי ${k} ממה ש${B.name} ${vB}.<br>${b('נכון או לא נכון?')} ${stmt}`,
        hint: `${c.g('חשוב', 'חשבי')}: לכמה יחידות שוות מתחלק הסכום, וכמה מהן של ${A.name}?`,
        solution: [`יחד ${k + 1} יחידות. יחידה: ${m(`${fm(S)} : ${k + 1} = ${fm(x)}`)}.`, `${A.name}: ${m(`${k} × ${fm(x)} = ${fm(a)}`)}. ${B.name}: ${fm(x)}.`, ans ? 'לכן הטענה נכונה.' : 'לכן הטענה לא נכונה.'],
      };
    },
  });

  /* ========== סימני התחלקות ========== */
  const dsum = (n) => String(n).split('').reduce((s0, d) => s0 + +d, 0);
  const digs = (n) => String(n).split('').map(Number);
  // לוח מספרים (משמאל לימין, 10 בשורה). cls(v) מחזיר מחלקת מילוי או null
  function chart(from, to, cls) {
    const cols = 10, cell = 32, rows = Math.ceil((to - from + 1) / cols);
    let s = '';
    for (let v = from; v <= to; v++) {
      const i = v - from, x = 4 + (i % cols) * cell, y = 4 + Math.floor(i / cols) * cell, k = cls(v);
      s += S.rect(x, y, cell, cell, { cls: (k || 'f-w') + ' s-soft', sw: 1 });
      s += S.text(x + cell / 2, y + cell / 2 + 1, v, { fs: 13, fw: k ? 800 : 400, cls: k && /f-(a|b)\b/.test(k) ? 't-on' : 't-ink' });
    }
    s += S.rect(4, 4, cols * cell, rows * cell, { fill: 'none', cls: 's-ink', sw: 2 });
    return S.svg(cols * cell + 8, rows * cell + 8, s, { label: 'לוח מספרים', maxw: 340 });
  }
  // מספר אקראי בטווח שמקיים תנאי
  function numWith(c, lo0, hi0, pred) {
    for (let i = 0; i < 800; i++) { const n = c.rnd(lo0, hi0); if (pred(n)) return n; }
    for (let n = lo0; n <= hi0; n++) if (pred(n)) return n;
    return lo0;
  }
  // הסבר קצר: האם n מתחלק ב-d ולמה
  function why(n, d) {
    const u = n % 10, s0 = dsum(n);
    if (d === 2) return `ספרת היחידות ${u} — ${u % 2 ? 'אי-זוגית' : 'זוגית'}`;
    if (d === 5 || d === 10) return `ספרת היחידות ${u}`;
    if (d === 3 || d === 9) return `סכום הספרות ${s0}${s0 % d ? ` — לא מתחלק ב-${d}` : ` — מתחלק ב-${d}`}`;
    return `${n % 2 ? 'אי-זוגי' : 'זוגי'}, וסכום הספרות ${s0}${s0 % 3 ? ' — לא מתחלק ב-3' : ' — מתחלק ב-3'}`;
  }
  const RULE = {
    2: 'מספר מתחלק ב-2 כשספרת היחידות שלו זוגית: 0, 2, 4, 6 או 8.',
    5: 'מספר מתחלק ב-5 כשספרת היחידות שלו 0 או 5.',
    10: 'מספר מתחלק ב-10 כשספרת היחידות שלו 0.',
    3: 'מספר מתחלק ב-3 כשסכום הספרות שלו מתחלק ב-3.',
    9: 'מספר מתחלק ב-9 כשסכום הספרות שלו מתחלק ב-9.',
    6: 'מספר מתחלק ב-6 כשהוא מתחלק גם ב-2 וגם ב-3.',
  };
  // ספרות עם משבצת במקום pos (ופסיק אלפים למספר בן 4 ספרות)
  const digitStr = (ds, pos) => ds.map((d, i) => (i === pos ? HM.slot(0) : d) + (ds.length === 4 && i === 0 ? ',' : '')).join('');

  HM.lesson({
    id: 'n-divis',
    learn: (c) => [
      {
        title: 'מתחלק — בלי שארית',
        html: `${c.name} ${c.g('רוצה', 'רוצה')} לחלק 21 סוכריות שווה בשווה בין 3 חברים. כל אחד מקבל 7, ולא נשאר כלום: 21 ${b('מתחלק')} ב-3.<br>"מתחלק" פירושו: ${b('השארית היא 0')}.<br>ומה עם 1,236 סוכריות? ${b('סימני ההתחלקות')} עונים על זה בלי לחלק בכלל!`,
        visual: V.groups(3, 7),
      },
      {
        title: 'ב-2, ב-5 וב-10',
        html: `${c.g('הסתכל', 'הסתכלי')} רק על ${b('ספרת היחידות')}:<br>• ב-2: ספרת היחידות זוגית (0, 2, 4, 6, 8).<br>• ב-5: ספרת היחידות 0 או 5.<br>• ב-10: ספרת היחידות 0.<br>למה? כל עשרת מתחלקת ב-2, ב-5 וב-10, אז רק היחידות קובעות. בלוח: כפולות של 5 צבועות, וכפולות של 10 בצבע כהה יותר.`,
        visual: chart(1, 40, (v) => (v % 10 === 0 ? 'f-b' : v % 5 === 0 ? 'f-l' : null)),
      },
      {
        title: 'ב-3 וב-9: סכום הספרות',
        html: `${c.g('חבר', 'חברי')} את ${b('כל הספרות')}:<br>• אם ${b('סכום הספרות')} מתחלק ב-3, המספר מתחלק ב-3.<br>• אם סכום הספרות מתחלק ב-9, המספר מתחלק ב-9.<br>כל מספר שמתחלק ב-9 מתחלק גם ב-3, אבל לא להפך: 12 מתחלק ב-3 ולא ב-9.`,
        steps: [
          'האם 4,725 מתחלק ב-9?',
          `סכום הספרות: ${m('4 + 7 + 2 + 5 = 18')}`,
          '18 מתחלק ב-9, לכן גם 4,725 מתחלק ב-9 ✔ (וגם ב-3).',
          `בדיקה: ${m('4,725 : 9 = 525')}`,
        ],
      },
      {
        title: 'ב-6: גם וגם',
        html: `${m('6 = 2 × 3')}, ולכן מספר מתחלק ב-6 רק אם הוא מתחלק ${b('גם ב-2 וגם ב-3')}.<br>• 114: זוגי ✔, ${m('1 + 1 + 4 = 6')} ✔ ← מתחלק ב-6.<br>• 93: ${m('9 + 3 = 12')} ✔, אבל אי-זוגי ✗.<br>• 82: זוגי ✔, אבל ${m('8 + 2 = 10')} ✗.`,
        visual: V.table(['מספר', 'מתחלק ב-2?', 'מתחלק ב-3?', 'מתחלק ב-6?'], [['114', '✔', '✔', '✔'], ['93', '✗', '✔', '✗'], ['82', '✔', '✗', '✗']]),
      },
      {
        title: 'יש שארית או אין?',
        html: `סימני ההתחלקות עונים מיד: האם בחילוק תהיה שארית?<br>• ${m('347 : 5')} — ספרת היחידות 7 ← ${b('יש שארית')}.<br>• ${m('2,016 : 9')} — סכום הספרות 9 ← ${b('אין שארית')}.<div class="note">טיפ: בחילוק ב-9 או ב-3, השארית שווה לשארית של ${b('סכום הספרות')}. למשל ${m('25 : 9')}: ${m('2 + 5 = 7')} ← שארית 7.</div>`,
        visual: V.groups(5, 9),
      },
      {
        title: 'סיכום הסימנים',
        html: 'כל הסימנים בטבלה אחת:',
        visual: V.table(['מתחלק ב...', 'איך בודקים?'], [['2', 'ספרת היחידות זוגית'], ['5', 'ספרת היחידות 0 או 5'], ['10', 'ספרת היחידות 0'], ['3', 'סכום הספרות מתחלק ב-3'], ['9', 'סכום הספרות מתחלק ב-9'], ['6', 'מתחלק גם ב-2 וגם ב-3']]),
        quiz: {
          type: 'tf', prompt: `${b('נכון או לא נכון?')} המספר 3,045 מתחלק ב-3.`, answer: true,
          hint: `${c.g('חבר', 'חברי')} את הספרות.`,
          solution: [`${m('3 + 0 + 4 + 5 = 12')}, ו-12 מתחלק ב-3.`, 'לכן 3,045 מתחלק ב-3. נכון.'],
        },
      },
    ],
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const story = c.chance(0.42);
      const kinds = L1 ? (story ? ['share', 'pack'] : ['tf2510', 'pick2510', 'digitSum', 'tf3'])
        : L2 ? (story ? ['share', 'rows'] : ['tf39', 'pick39', 'missing9', 'six'])
        : (story ? ['pack', 'rows', 'share'] : ['pick6', 'maxDigit', 'rem', 'multi', 'claim']);
      const kind = c.pick(kinds);
      const R4 = () => c.rnd(100, 9999);
      const units = (u) => Math.floor(R4() / 10) * 10 + u;
      const distinct = (correct, gens) => {
        const out = [correct];
        gens.forEach((g) => { for (let t = 0; t < 30; t++) { const v = g(); if (out.indexOf(v) < 0) { out.push(v); break; } } });
        return out;
      };
      const tfQ = (N, d, pre, stmt, verdict) => ({
        type: 'tf', answer: N % d === 0,
        prompt: `${pre || ''}${b('נכון או לא נכון?')} ${stmt || `המספר ${fm(N)} מתחלק ב-${d}.`}`,
        hint: d === 2 || d === 5 || d === 10 ? `${c.g('הסתכל', 'הסתכלי')} על ספרת היחידות.` : d === 6 ? `${c.g('בדוק', 'בדקי')} שני דברים: התחלקות ב-2 וגם ב-3.` : `${c.g('חבר', 'חברי')} את הספרות.`,
        solution: [RULE[d], `${fm(N)}: ${why(N, d)}.`, N % d === 0 ? `לכן ${fm(N)} מתחלק ב-${d}${verdict ? ', ' + verdict[0] : ''}. נכון.` : `לכן ${fm(N)} לא מתחלק ב-${d}${verdict ? ', ' + verdict[1] : ''}. לא נכון.`],
      });

      if (kind === 'tf2510') {
        const d = c.pick([2, 5, 10]), want = c.chance(0.5);
        let N = numWith(c, 100, 9999, (n) => (n % d === 0) === want);
        if (!want && c.chance(0.5)) {
          if (d === 10) N = Math.floor(N / 10) * 10 + 5;
          if (d === 5) N = Math.floor(N / 100) * 100 + 50 + c.pick([1, 2, 3, 4, 6, 7, 8, 9]);
          if (d === 2) N = Math.floor(N / 100) * 100 + c.pick([2, 4, 6, 8]) * 10 + c.pick([1, 3, 5, 7, 9]);
        }
        return tfQ(N, d);
      }
      if (kind === 'tf3') {
        const want = c.chance(0.5);
        return tfQ(numWith(c, 12, 400, (n) => (n % 3 === 0) === want && (want || n % 10 === 3 || n % 10 === 6 || n % 10 === 9 || c.chance(0.3))), 3);
      }
      if (kind === 'pick2510') {
        const d = c.pick([2, 5, 10]);
        const G = {
          10: [() => units(0), () => units(5), () => Math.floor(R4() / 100) * 100 + c.rnd(1, 9), () => units(c.pick([2, 4, 6, 8]))],
          5: [() => units(c.pick([0, 5])), () => Math.floor(R4() / 100) * 100 + 50 + c.pick([1, 2, 3, 4, 6, 7, 8, 9]), () => units(c.pick([1, 2, 3, 4])), () => units(c.pick([6, 7, 8, 9]))],
          2: [() => units(c.pick([0, 2, 4, 6, 8])), () => Math.floor(R4() / 100) * 100 + c.pick([2, 4, 6, 8]) * 10 + c.pick([1, 3, 7, 9]), () => units(5), () => c.pick([2, 4, 6, 8]) * 1000 + Math.floor(c.rnd(0, 99)) * 10 + c.pick([1, 3, 7, 9])],
        }[d];
        const vals = distinct(G[0](), G.slice(1));
        return {
          type: 'choice', choices: vals.map(fm), answer: 0,
          prompt: `איזה מספר מתחלק ב-${d}?`,
          hint: `${c.g('הסתכל', 'הסתכלי')} רק על ספרת היחידות של כל מספר.`,
          solution: [RULE[d], `${fm(vals[0])}: ${why(vals[0], d)} ✔`],
        };
      }
      if (kind === 'digitSum') {
        const N = c.rnd(L1 ? 100 : 1000, 9999), ds = digs(N);
        return {
          type: 'number', answer: dsum(N),
          prompt: `מהו סכום הספרות של המספר ${fm(N)}?<div class="big">${m(ds.join(' + ') + ' = ' + HM.slot(0))}</div>`,
          hint: `${c.g('חבר', 'חברי')} את הספרות אחת אחרי השנייה.`,
          solution: [m(`${ds.join(' + ')} = ${dsum(N)}`), `סכום הספרות הוא ${dsum(N)}${dsum(N) % 3 ? '.' : ` — מתחלק ב-3, אז גם ${fm(N)} מתחלק ב-3.`}`],
        };
      }
      if (kind === 'share') {
        const sc = c.scene(ITEMS), p = P(c);
        const d = L1 ? c.pick([2, 5, 10]) : L2 ? c.pick([3, 9, 6]) : c.pick([6, 9]);
        const want = c.chance(0.5);
        const N = numWith(c, L1 ? 20 : L2 ? 100 : 300, L1 ? 200 : L2 ? 999 : 2999, (n) => (n % d === 0) === want && (want || d === 2 || d === 5 || d === 10 || n % 3 === 0 || c.chance(0.4)));
        const dd = d === 2 ? 'שני' : d;
        return tfQ(N, d, `${p.name} ${p.g('רוצה', 'רוצה')} לחלק ${fm(N)} ${sc.its} שווה בשווה בין ${dd} חברים.<br>`, `אפשר לחלק את ${sc.the} בין ${dd} החברים בלי שארית.`, ['ואפשר לחלק בלי שארית', 'ותהיה שארית']);
      }
      if (kind === 'pack') {
        const sc = c.scene(ITEMS), p = P(c);
        const d = L1 ? c.pick([10, 10, 5]) : c.pick([9, 3, 9]);
        const N = numWith(c, L1 ? 23 : 200, L1 ? 399 : 1999, (n) => n % d !== 0);
        const r = N % d, u = N % 10, s0 = dsum(N);
        const left = `${r === 1 ? (sc.itf ? 'נשארת' : 'נשאר') : (sc.itf ? 'נשארות' : 'נשארים')} ${cnt(r, sc.it, sc.its, sc.itf)}`;
        return {
          type: 'number', answer: r,
          prompt: `${p.name} ${p.g('ממלא', 'ממלאת')} ${sc.conts}, ובכל ${sc.cont} בדיוק ${d} ${sc.its}. יש ${lo(p)} ${fm(N)} ${sc.its}.<br>כמה ${sc.its} יישארו בחוץ?`,
          hint: d === 10 || d === 5 ? `${c.g('הסתכל', 'הסתכלי')} על ספרת היחידות.` : `${c.g('היעזר', 'היעזרי')} בסכום הספרות — לא צריך לחלק!`,
          solution: d === 10 ? ['כל העשרות נכנסות במלואן, ורק היחידות נשארות.', `ספרת היחידות היא ${u}, לכן ${left}.`]
            : d === 5 ? ['כל עשרת היא 2 קבוצות של 5, ולכן רק ספרת היחידות קובעת.', u >= 5 ? `ספרת היחידות ${u}: ${m(`${u} − 5 = ${r}`)}, לכן ${left}.` : `ספרת היחידות ${u}, לכן ${left}.`]
            : [`סכום הספרות: ${m(digs(N).join(' + ') + ' = ' + s0)}`, `השארית של ${s0} בחילוק ב-${d} היא ${s0 % d}.`, `לכן ${left} — בדיוק השארית של ${m(`${fm(N)} : ${d}`)}.`],
        };
      }
      if (kind === 'rows') {
        const sc = c.scene(ITEMS), p = P(c), D = [2, 3, 5, 6, 9, 10];
        const d = c.pick(D);
        const N = numWith(c, L2 ? 50 : 300, L2 ? 999 : 2999, (n) => n % d === 0 && D.filter((e) => n % e).length >= 3);
        const bad = c.sample(D.filter((e) => N % e), 3);
        const opts = [d].concat(bad);
        return {
          type: 'choice', choices: opts.map((e) => `${e} שורות`), answer: 0,
          prompt: `${p.name} ${p.g('רוצה', 'רוצה')} לסדר ${fm(N)} ${sc.its} בשורות שוות, כך ש${sc.itf ? 'לא תישאר אף' : 'לא יישאר אף'} ${sc.it}.<br>כמה שורות ${he(p)} ${p.g('יכול', 'יכולה')} לעשות?`,
          hint: `${c.g('בדוק', 'בדקי')} כל אפשרות בעזרת סימני ההתחלקות.`,
          solution: opts.map((e) => `${e}: ${why(N, e)} ${N % e ? '✗' : '✔'}`),
        };
      }
      if (kind === 'tf39') {
        const d = c.pick([3, 9]), want = c.chance(0.5);
        const N = numWith(c, 100, 9999, (n) => (n % d === 0) === want && (want || (d === 9 ? n % 3 === 0 || c.chance(0.3) : [3, 6, 9].indexOf(n % 10) >= 0 || c.chance(0.3))));
        return tfQ(N, d);
      }
      if (kind === 'pick39') {
        const d = c.pick([3, 9]);
        const G = d === 9
          ? [() => numWith(c, 100, 9999, (n) => n % 9 === 0), () => numWith(c, 100, 9999, (n) => n % 3 === 0 && n % 9), () => numWith(c, 100, 9999, (n) => n % 10 === 9 && n % 9), () => numWith(c, 100, 9999, (n) => dsum(n) % 9 === 1)]
          : [() => numWith(c, 100, 9999, (n) => n % 3 === 0), () => numWith(c, 100, 9999, (n) => n % 10 === 3 && n % 3), () => numWith(c, 100, 9999, (n) => n % 10 === 6 && n % 3), () => numWith(c, 100, 9999, (n) => dsum(n) % 3 === 1)];
        const vals = distinct(G[0](), G.slice(1));
        return {
          type: 'choice', choices: vals.map(fm), answer: 0,
          prompt: `איזה מספר מתחלק ב-${d}?`,
          hint: `${c.g('חבר', 'חברי')} את הספרות של כל מספר. ספרת היחידות לא עוזרת כאן!`,
          solution: [RULE[d], `${fm(vals[0])}: ${why(vals[0], d)} ✔`],
        };
      }
      if (kind === 'six') {
        const want = c.chance(0.5), trap = c.pick(['odd', 'even']);
        const N = numWith(c, L2 ? 30 : 1000, L2 ? 999 : 9999, (n) => (want ? n % 6 === 0 : trap === 'odd' ? n % 2 === 1 && n % 3 === 0 : n % 2 === 0 && n % 3 !== 0));
        return tfQ(N, 6);
      }
      if (kind === 'missing9') {
        let ds, pos, r;
        for (let t = 0; t < 50; t++) {
          ds = [c.rnd(1, 9), c.rnd(0, 9), c.rnd(0, 9)]; pos = c.rnd(0, 2);
          const s0 = ds.reduce((a, x, i) => a + (i === pos ? 0 : x), 0);
          r = (9 - (s0 % 9)) % 9;
          if (r !== 0) break;
        }
        ds[pos] = r;
        const known = ds.filter((x, i) => i !== pos), s0 = HM.sum(known);
        return {
          type: 'number', answer: r,
          prompt: `${c.g('השלם', 'השלימי')} את הספרה החסרה, כך שהמספר יתחלק ב-9:<div class="big">${m(digitStr(ds, pos))}</div>`,
          hint: `${c.g('חבר', 'חברי')} את הספרות שכבר יש. כמה חסר עד המספר הבא שמתחלק ב-9?`,
          solution: [`סכום הספרות הידועות: ${m(known.join(' + ') + ' = ' + s0)}`, `צריך להגיע למספר שמתחלק ב-9: ${m(`${s0} + ${r} = ${s0 + r}`)}`, `הספרה החסרה: ${r}.`],
        };
      }
      if (kind === 'pick6') {
        const G = [() => numWith(c, 100, 9999, (n) => n % 6 === 0), () => numWith(c, 100, 9999, (n) => n % 3 === 0 && n % 2), () => numWith(c, 100, 9999, (n) => n % 10 === 6 && n % 3), () => numWith(c, 100, 9999, (n) => n % 2 === 0 && n % 3 && n % 10 !== 6)];
        const vals = distinct(G[0](), G.slice(1));
        return {
          type: 'choice', choices: vals.map(fm), answer: 0,
          prompt: 'איזה מספר מתחלק ב-6?',
          hint: `${c.g('בדוק', 'בדקי')} לכל מספר שני תנאים: זוגי? וסכום הספרות מתחלק ב-3?`,
          solution: [RULE[6], `${fm(vals[0])}: ${why(vals[0], 6)} ✔`, 'בכל אחת מהאפשרויות האחרות אחד התנאים לא מתקיים.'],
        };
      }
      if (kind === 'maxDigit') {
        const d = c.pick([3, 6, 9]), max = c.chance(0.5);
        let ds, pos, valid;
        for (let t = 0; t < 80; t++) {
          const len = c.pick([3, 4]);
          ds = [c.rnd(1, 9)].concat(HM.range(2, len).map(() => c.rnd(0, 9))); pos = c.rnd(0, len - 1);
          valid = HM.range(pos === 0 ? 1 : 0, 9).filter((x) => { const t2 = ds.slice(); t2[pos] = x; return +t2.join('') % d === 0; });
          if (valid.length >= 2) break;
        }
        const ans = max ? valid[valid.length - 1] : valid[0];
        const known = ds.filter((x, i) => i !== pos), s0 = HM.sum(known);
        const shown = ds.slice(); shown[pos] = ans;
        return {
          type: 'number', answer: ans,
          prompt: `מהי הספרה ה${max ? 'גדולה' : 'קטנה'} ביותר שאפשר לכתוב במשבצת, כך שהמספר יתחלק ב-${d}?<div class="big">${m(digitStr(ds, pos))}</div>`,
          hint: `סכום הספרות הידועות הוא ${s0}.${d === 6 ? ' ואל ' + c.g('תשכח', 'תשכחי') + ' שהמספר צריך להיות גם זוגי!' : ''}`,
          solution: [`${RULE[d]}`, `הספרות שמתאימות: ${valid.join(', ')}.`, `ה${max ? 'גדולה' : 'קטנה'} ביותר: ${ans} ← ${fm(+shown.join(''))}.`],
        };
      }
      if (kind === 'rem') {
        const d = c.pick([9, 9, 3]), N = numWith(c, 1000, 9999, (n) => n % d !== 0), s0 = dsum(N);
        return {
          type: 'number', answer: N % d,
          prompt: `מה השארית בתרגיל ${m(`${fm(N)} : ${d}`)}?<br>${c.g('נסה', 'נסי')} למצוא אותה בלי לחלק.`,
          hint: `${c.g('חבר', 'חברי')} את הספרות, ו${c.g('מצא', 'מצאי')} את השארית של הסכום בחילוק ב-${d}.`,
          solution: [`סכום הספרות: ${m(digs(N).join(' + ') + ' = ' + s0)}`, `${m(`${s0} : ${d} = ${Math.floor(s0 / d)}`)} ושארית ${s0 % d}.`, `לכן השארית של ${m(`${fm(N)} : ${d}`)} היא ${N % d}.`],
        };
      }
      if (kind === 'multi') {
        const set = c.pick([[2, 5, 9], [2, 3, 5], [2, 9], [5, 9], [3, 10], [5, 6]]);
        const ok = (n, skip) => set.every((e) => (e === skip ? n % e !== 0 : n % e === 0));
        const vals = [numWith(c, 100, 9999, (n) => ok(n))];
        set.forEach((e) => { const v = numWith(c, 100, 9999, (n) => ok(n, e)); if (vals.indexOf(v) < 0 && ok(v, e)) vals.push(v); });
        for (let g = 0; vals.length < 3 && g < 60; g++) { const v = numWith(c, 100, 9999, (n) => !ok(n) && n % set[0] === 0); if (vals.indexOf(v) < 0) vals.push(v); }
        const list = set.length === 2 ? `גם ב-${set[0]} וגם ב-${set[1]}` : `גם ב-${set[0]}, גם ב-${set[1]} וגם ב-${set[2]}`;
        return {
          type: 'choice', choices: vals.map(fm), answer: 0,
          prompt: `איזה מספר מתחלק ${list}?`,
          hint: `${c.g('בדוק', 'בדקי')} כל מספר בכל הסימנים. מספיק סימן אחד שלא מתקיים כדי לפסול.`,
          solution: set.map((e) => `${fm(vals[0])} ב-${e}: ${why(vals[0], e)} ✔`).concat(['בכל אחת מהאפשרויות האחרות לפחות סימן אחד לא מתקיים.']),
        };
      }
      // claim: טענות כלליות
      const CL = [
        ['כל מספר שמתחלק ב-9 מתחלק גם ב-3.', true, `${m('9 = 3 × 3')}, ולכן כל כפולה של 9 היא גם כפולה של 3.`],
        ['כל מספר שמתחלק ב-3 מתחלק גם ב-9.', false, 'למשל 12 מתחלק ב-3, אבל לא ב-9.'],
        ['כל מספר שמתחלק ב-10 מתחלק גם ב-5.', true, 'ספרת היחידות שלו 0, ולכן הוא מתחלק גם ב-5.'],
        ['כל מספר שמתחלק ב-5 מתחלק גם ב-10.', false, 'למשל 15 מתחלק ב-5, אבל לא ב-10.'],
        ['מספר שמתחלק ב-2 וגם ב-3 מתחלק גם ב-6.', true, `${m('6 = 2 × 3')} — זה בדיוק סימן ההתחלקות ב-6.`],
        ['מספר שספרת היחידות שלו 3 מתחלק ב-3.', false, 'למשל 13 לא מתחלק ב-3. בודקים את סכום הספרות, לא את ספרת היחידות.'],
        ['כל מספר שמתחלק ב-6 הוא זוגי.', true, 'מספר שמתחלק ב-6 מתחלק גם ב-2, ולכן הוא זוגי.'],
        ['אם משנים את סדר הספרות של 123, תמיד מתקבל מספר שמתחלק ב-3.', true, 'סכום הספרות נשאר 6 בכל סדר, ו-6 מתחלק ב-3.'],
        ['מספר שמתחלק ב-3 וגם ב-9 מתחלק גם ב-27.', false, 'למשל 18 מתחלק ב-3 וב-9, אבל לא ב-27.'],
        ['כל מספר אי-זוגי שמתחלק ב-3 מתחלק גם ב-6.', false, 'מספר אי-זוגי לא מתחלק ב-2, ולכן גם לא ב-6. למשל 9.'],
      ];
      const [t, a, ex] = c.pick(CL);
      return {
        type: 'tf', answer: a,
        prompt: `${b('נכון או לא נכון?')} ${t}`,
        hint: `${c.g('נסה', 'נסי')} כמה דוגמאות. מספיקה דוגמה אחת שלא מתאימה כדי שהטענה לא תהיה נכונה.`,
        solution: [ex, a ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
      };
    },
  });

  /* ========== מספרים ראשוניים ופירוק לגורמים ========== */
  // עץ גורמים: מפצלים לזוג הגורמים הקרוב ביותר (עץ "מאוזן")
  function buildTree(n, parent) {
    const nd = { v: n, parent };
    if (!HM.isPrime(n)) {
      let a = 1;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) a = d;
      nd.kids = [buildTree(a, nd), buildTree(n / a, nd)];
    }
    return nd;
  }
  const treeNodes = (root) => { const out = []; const w = (nd) => { out.push(nd); (nd.kids || []).forEach(w); }; w(root); return out; };
  function drawTree(root, hide) {
    let leaf = 0, maxD = 0;
    const lay = (nd, d) => { nd.d = d; maxD = Math.max(maxD, d); if (!nd.kids) nd.x = leaf++; else { nd.kids.forEach((k) => lay(k, d + 1)); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; } };
    lay(root, 0);
    const cw = 52, rh = 58, W = Math.max(leaf * cw + 24, 140), H = maxD * rh + 50;
    const X = (nd) => W / 2 + (nd.x - (leaf - 1) / 2) * cw, Y = (nd) => 25 + nd.d * rh;
    let ln = '', nodes = '';
    const walk = (nd) => {
      const x = X(nd), y = Y(nd);
      (nd.kids || []).forEach((k) => { ln += S.line(x, y + 15, X(k), Y(k) - 16, { cls: 's-soft', sw: 2 }); walk(k); });
      if (nd === hide) nodes += S.rect(x - 20, y - 15, 40, 30, { rx: 6, cls: 'f-y s-ink', sw: 2 }) + S.text(x, y + 1, '?', { fs: 18, fw: 800 });
      else {
        if (!nd.kids) nodes += S.circle(x, y, 17, { cls: 'f-l s-a', sw: 2.5 });
        nodes += S.text(x, y + 1, nd.v, { fs: nd.v > 99 ? 15 : 17, fw: 700 });
      }
    };
    walk(root);
    return S.svg(W, H, ln + nodes, { label: 'עץ גורמים', maxw: Math.min(W, 340) });
  }
  const groupF = (fs) => { const g = []; fs.forEach((p) => { const l = g[g.length - 1]; if (l && l[0] === p) l[1]++; else g.push([p, 1]); }); return g; };
  const powStr = (fs) => groupF(fs).map(([p, e]) => (e === 1 ? String(p) : sup(p, e))).join(' × ');
  const expStr = (fs) => fs.join(' × ');
  const PRIMES100 = HM.range(2, 100).filter(HM.isPrime);
  const TREE_POOL = [
    [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 50],
    [48, 54, 56, 60, 63, 72, 75, 80, 84, 90, 96, 100, 108, 120],
    [126, 132, 140, 150, 168, 180, 196, 200, 210, 225, 240, 252, 264, 270, 280, 300, 330, 360, 420, 450, 500, 540, 600],
  ];
  const GROUPS = [
    { tags: ['sport'], who: 'שחקנים', place: 'בחוג הכדורסל' },
    { tags: ['music'], who: 'זמרים', place: 'במקהלה' },
    { tags: ['kpop'], who: 'רקדנים', place: 'בחוג ריקודי הקיי-פופ' },
    { tags: ['magic'], who: 'תלמידים', place: 'בבית הספר לקוסמים' },
    { tags: ['nature'], who: 'מטיילים', place: 'בטיול השנתי' },
    { tags: ['space'], who: 'חניכים', place: 'בחוג האסטרונומיה' },
    { tags: ['games'], who: 'שחקנים', place: 'בטורניר המשחקים' },
    { tags: ['art'], who: 'ילדים', place: 'בחוג הציור' },
    { tags: ['tech'], who: 'ילדים', place: 'בחוג הרובוטיקה' },
    { tags: ['animals'], who: 'מתנדבים', place: 'בפינת החי' },
    { tags: ['baking'], who: 'ילדים', place: 'בסדנת האפייה' },
    { tags: ['reading'], who: 'ילדים', place: 'במועדון הקריאה' },
    { tags: ['squishy'], who: 'ילדים', place: 'במפגש החלפות הסקווישים' },
  ];
  const SECRET = [
    { tags: ['games'], lead: 'בחדר הבריחה, הקוד של המנעול הוא' },
    { tags: ['magic'], lead: 'כדי לפתוח את ספר הלחשים, צריך לומר מספר קסם. המספר הוא' },
    { tags: ['tech'], lead: 'הסיסמה של הרובוט היא' },
    { tags: ['space'], lead: 'קוד השיגור של החללית הוא' },
    { tags: ['squishy'], lead: 'על הקופסה הסודית של הסקווישים יש מנעול. הקוד הוא' },
    { tags: ['kpop'], lead: 'הקוד לכניסה למועדון המעריצים הוא' },
    { tags: ['reading'], lead: 'בספר הבלשים, המספר הסודי הוא' },
    { tags: ['sport'], lead: 'מספר החולצה של השחקן החדש הוא' },
  ];
  const pairsOf = (n) => HM.divisors(n).filter((d) => d * d <= n).map((d) => [d, n / d]);

  HM.lesson({
    id: 'n-primes',
    learn: (c) => [
      {
        title: 'מלבנים מאריחים',
        html: `${c.name} ${c.g('בונה', 'בונה')} מלבנים מאריחים ריבועיים. עם 12 אריחים יש כמה אפשרויות: ${m('1 × 12')}, ${m('2 × 6')}, ${m('3 × 4')}.<br>אבל עם 7 אריחים יש רק מלבן אחד: ${m('1 × 7')} — שורה ארוכה אחת.<br>למספר כמו 7 קוראים ${b('מספר ראשוני')}.`,
        visual: `<div class="row">${V.dots(3, 4)}${V.dots(1, 7)}</div>`,
      },
      {
        title: 'ראשוני או פריק?',
        html: `• ${b('מספר ראשוני')} מתחלק רק בשני מספרים: ב-1 ובעצמו. למשל 2, 3, 5, 7, 11, 13.<br>• ${b('מספר פריק')} מתחלק ביותר משני מספרים. למשל 12 מתחלק ב-1, 2, 3, 4, 6 ו-12.<br>• ${b('1')} אינו ראשוני ואינו פריק.<br>• 2 הוא המספר הראשוני ${b('הזוגי היחיד')}. בלוח: המספרים הראשוניים צבועים.`,
        visual: chart(1, 50, (v) => (HM.isPrime(v) ? 'f-a' : null)),
      },
      {
        title: 'איך בודקים?',
        html: `האם 91 ראשוני? ${c.g('נסה', 'נסי')} לחלק במספרים הראשוניים הקטנים: 2, 3, 5, 7… אם אחד מהם מחלק בלי שארית — המספר פריק.`,
        steps: [
          '91 אי-זוגי ← לא מתחלק ב-2.',
          `${m('9 + 1 = 10')} ← לא מתחלק ב-3.`,
          'ספרת היחידות 1 ← לא מתחלק ב-5.',
          `${m('91 : 7 = 13')} ← מתחלק ב-7! לכן 91 ${b('פריק')}: ${m('91 = 7 × 13')}.`,
        ],
      },
      {
        title: 'עץ גורמים',
        html: `כל מספר פריק אפשר ${b('לפרק לגורמים ראשוניים')}: מפצלים אותו למכפלה, וממשיכים לפצל עד שכל הענפים ראשוניים (בעיגול).<br>${m('60 = 2 × 2 × 3 × 5')}<br>אפשר להתחיל מכל פיצול (${m('6 × 10')} או ${m('2 × 30')}) — הגורמים הראשוניים בסוף תמיד אותם גורמים!`,
        visual: drawTree(buildTree(60)),
      },
      {
        title: 'כתיב חזקות',
        html: `כשגורם חוזר כמה פעמים, כותבים אותו ${b('בחזקה')}:<br>${m('2 × 2 × 2 = 2<sup>3</sup>')} (קוראים: "2 בחזקת 3").<br>${m('72 = 2 × 2 × 2 × 3 × 3 = 2<sup>3</sup> × 3<sup>2</sup>')}<br>המספר הקטן למעלה אומר ${b('כמה פעמים')} הגורם מופיע.`,
        visual: drawTree(buildTree(72)),
      },
      {
        title: 'חזקות של 10',
        html: `${m('10 = 2 × 5')}<br>${m('100 = 10 × 10 = 2<sup>2</sup> × 5<sup>2</sup>')}<br>${m('1,000 = 2<sup>3</sup> × 5<sup>3</sup>')}<br>כל אפס "מביא" עוד 2 ועוד 5. כמה אפסים — זו החזקה. אפשר לכתוב גם ${m('1,000 = 10<sup>3</sup>')}.`,
        quiz: {
          type: 'number', answer: 4, prompt: 'כמה פעמים מופיע הגורם 5 בפירוק של 10,000 לגורמים ראשוניים?',
          hint: `${c.g('ספור', 'ספרי')} את האפסים.`,
          solution: [`${m('10,000 = 10 × 10 × 10 × 10')}, ובכל 10 יש 5 אחד.`, `${m('10,000 = 2<sup>4</sup> × 5<sup>4</sup>')} — התשובה: 4.`],
        },
      },
    ],
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const story = c.chance(0.4);
      const kinds = L1 ? (story ? ['arrange', 'rect'] : ['tfPrime', 'pickPrime', 'tree'])
        : L2 ? (story ? ['teams', 'packs'] : ['factorize', 'missingFactor', 'countFactor', 'fromFactors', 'tfPrime', 'tree'])
        : (story ? ['secret', 'semi'] : ['factorize', 'claim', 'between', 'largest', 'tens', 'order']);
      const kind = c.pick(kinds);
      const pool = TREE_POOL[level - 1];

      if (kind === 'tfPrime') {
        const traps = L1 ? [1, 2, 9, 15, 21, 25, 27, 33, 35, 39, 45, 49] : [1, 2, 51, 57, 87, 91, 93, 77, 63, 69, 81, 119];
        const prs = PRIMES100.filter((p) => (L1 ? p <= 50 : p > 30));
        const N = c.chance(0.5) ? c.pick(traps) : c.pick(prs), pr = HM.isPrime(N);
        const dv = HM.divisors(N);
        return {
          type: 'tf', answer: pr,
          prompt: `${b('נכון או לא נכון?')} ${N} הוא מספר ראשוני.`,
          hint: `${c.g('נסה', 'נסי')} לחלק את ${N} ב-2, 3, 5, 7. האם אחד מהם מחלק בלי שארית?`,
          solution: N === 1 ? ['1 מתחלק רק במספר אחד — בעצמו.', 'לכן 1 אינו ראשוני (וגם לא פריק). לא נכון.']
            : pr ? [`${N} מתחלק רק ב-1 וב-${N}.`, 'לכן הוא מספר ראשוני. נכון.']
            : [`${N} מתחלק ב: ${dv.join(', ')}.`, `למשל ${m(`${N} = ${dv[1]} × ${N / dv[1]}`)}, לכן ${N} פריק. לא נכון.`],
        };
      }
      if (kind === 'pickPrime') {
        const askPrime = c.chance(0.6);
        const comps = [1, 9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51];
        const prs = PRIMES100.filter((p) => p <= 50);
        const ok = askPrime ? c.pick(prs) : c.pick(comps.slice(1));
        const others = askPrime ? c.sample(comps, 3) : c.sample(prs.filter((p) => p > 2), 3);
        const vals = [ok].concat(others);
        return {
          type: 'choice', choices: vals.map(String), answer: 0,
          prompt: askPrime ? 'איזה מהמספרים הוא מספר ראשוני?' : `איזה מהמספרים הוא מספר ${b('פריק')}?`,
          hint: `לכל מספר ${c.g('בדוק', 'בדקי')}: האם הוא מתחלק במספר כלשהו חוץ מ-1 ומעצמו?`,
          solution: askPrime ? [`${ok} מתחלק רק ב-1 ובעצמו — ראשוני.`, `האחרים: ${others.map((x) => (x === 1 ? '1 אינו ראשוני' : m(`${x} = ${HM.divisors(x)[1]} × ${x / HM.divisors(x)[1]}`))).join(', ')}.`]
            : [`${m(`${ok} = ${HM.divisors(ok)[1]} × ${ok / HM.divisors(ok)[1]}`)} — לכן ${ok} פריק.`, `${others.join(', ')} — כולם ראשוניים.`],
        };
      }
      if (kind === 'tree') {
        const n = c.pick(pool), root = buildTree(n), nodes = treeNodes(root);
        const hide = c.pick(nodes);
        let sol;
        if (hide.kids) sol = `${m(`${hide.kids[0].v} × ${hide.kids[1].v} = ${hide.v}`)}`;
        else { const sib = hide.parent.kids[0] === hide ? hide.parent.kids[1] : hide.parent.kids[0]; sol = `${m(`${hide.parent.v} : ${sib.v} = ${hide.v}`)}`; }
        return {
          type: 'number', answer: hide.v,
          prompt: 'איזה מספר חסר בעץ הגורמים?',
          visual: drawTree(root, hide),
          hint: 'בעץ גורמים, כל מספר שווה למכפלה של שני המספרים שמתחתיו.',
          solution: [sol, `התשובה: ${hide.v}. הפירוק המלא: ${m(`${n} = ${expStr(HM.primeFactors(n))}`)}`],
        };
      }
      if (kind === 'arrange') {
        const sc = c.scene(ITEMS), p = P(c);
        const N = c.chance(0.5) ? c.pick(PRIMES100.filter((x) => x > 5 && x < 50)) : c.pick([9, 15, 21, 25, 27, 33, 35, 39, 49, 12, 18, 20, 24, 30, 36]);
        const pr = HM.isPrime(N), pp = pairsOf(N).filter((x) => x[0] > 1);
        return {
          type: 'tf', answer: !pr,
          prompt: `${p.name} ${p.g('רוצה', 'רוצה')} לסדר ${N} ${sc.its} במלבן: לפחות 2 שורות שוות, ובכל שורה לפחות 2 ${sc.its}.<br>${b('נכון או לא נכון?')} ${p.g('הוא יכול', 'היא יכולה')} לעשות את זה.`,
          hint: `${c.g('חפש', 'חפשי')} שני מספרים, כל אחד גדול מ-1, שהמכפלה שלהם ${N}.`,
          solution: pr ? [`${N} הוא מספר ראשוני: ${m(`${N} = 1 × ${N}`)} בלבד.`, 'אפשר לסדר רק שורה אחת ארוכה. לא נכון.'] : [`${m(`${N} = ${pp[0][0]} × ${pp[0][1]}`)} ← ${pp[0][0]} שורות של ${pp[0][1]}.`, `${N} פריק, אז אפשר. נכון.`],
        };
      }
      if (kind === 'rect') {
        const sc = c.scene(ITEMS), p = P(c), N = c.pick([6, 8, 10, 12, 15, 16, 18, 20, 24, 7, 11, 13]);
        const pp = pairsOf(N);
        return {
          type: 'number', answer: pp.length,
          prompt: `ל${p.name} יש ${N} ${sc.its}, ו${he(p)} ${p.g('רוצה', 'רוצה')} לסדר את ${sc.itf ? 'כולן' : 'כולם'} במלבן מלא. כמה מלבנים שונים ${p.g('הוא יכול', 'היא יכולה')} לבנות?<br>(${m('2 × 3')} ו-${m('3 × 2')} הם אותו מלבן.)`,
          visual: V.tokens(N, 'square', { perRow: N > 12 ? 12 : N }),
          hint: `${c.g('חפש', 'חפשי')} את כל הזוגות של מספרים שהמכפלה שלהם ${N}. ${c.g('התחל', 'התחילי')} מ-${m(`1 × ${N}`)}.`,
          solution: [pp.map((x) => m(`${x[0]} × ${x[1]}`)).join(', '), `התשובה: ${pp.length}.${pp.length === 1 ? ` ${N} ראשוני — יש לו רק מלבן אחד.` : ''}`],
        };
      }
      if (kind === 'teams') {
        const sc = c.scene(GROUPS);
        const pr = c.pick(PRIMES100.filter((x) => x > 10 && x < 90));
        const comps = c.sample(HM.range(pr - 15, pr + 15).filter((x) => x > 9 && !HM.isPrime(x)), 3);
        const vals = [pr].concat(comps);
        return {
          type: 'choice', choices: vals.map((x) => `${x} ${sc.who}`), answer: 0,
          prompt: `${sc.place} רוצים לחלק את ה${sc.who} לקבוצות שוות: לפחות 2 קבוצות, ובכל קבוצה לפחות 2 ${sc.who}.<br>באיזה מספר ${sc.who} ${b('אי אפשר')} לעשות זאת?`,
          hint: 'מספר שאפשר לחלק לקבוצות שוות הוא מספר פריק. ' + c.g('חפש', 'חפשי') + ' את המספר הראשוני.',
          solution: comps.map((x) => m(`${x} = ${HM.divisors(x)[1]} × ${x / HM.divisors(x)[1]}`)).concat([`${pr} ראשוני — מתחלק רק ב-1 ובעצמו, ולכן אי אפשר.`]),
        };
      }
      if (kind === 'packs') {
        const sc = c.scene(ITEMS), p = P(c), N = c.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 60]);
        const mid = HM.divisors(N).filter((d) => d > 1 && d < N);
        return {
          type: 'number', answer: mid.length,
          prompt: `${p.name} ${p.g('אורז', 'אורזת')} ${N} ${sc.its} ב${sc.conts}. בכל ${sc.cont} אותו מספר של ${sc.its}, יש לפחות 2 ${sc.conts}, ובכל ${sc.cont} לפחות 2 ${sc.its}.<br>כמה אפשרויות שונות יש למספר ${sc.the} בכל ${sc.cont}?`,
          hint: `${c.g('מצא', 'מצאי')} את כל המחלקים של ${N}, חוץ מ-1 ומ-${N}.`,
          solution: [`המחלקים של ${N}: ${HM.divisors(N).join(', ')}.`, `בלי 1 ובלי ${N}: ${mid.join(', ')}.`, `התשובה: ${mid.length} אפשרויות.`],
        };
      }
      if (kind === 'factorize') {
        const n = c.pick(pool), fs = HM.primeFactors(n);
        let choices;
        if (L2) {
          const comp = [fs[0] * fs[1]].concat(fs.slice(2));
          choices = [expStr(fs), expStr(comp), expStr(fs.slice(1)), expStr([fs[0]].concat(fs))];
        } else {
          const g = groupF(fs), gi = g.findIndex((x) => x[1] > 1);
          const swapped = gi >= 0 && g[gi][0] !== g[gi][1] ? g.map((x, i) => (i === gi ? sup(x[1], x[0]) : x[1] === 1 ? String(x[0]) : sup(x[0], x[1]))).join(' × ') : powStr([fs[0]].concat(fs));
          const comp = [fs[0] * fs[1]].concat(fs.slice(2)).sort((a, b2) => a - b2);
          choices = [powStr(fs), groupF(comp).map(([p0, e]) => (e === 1 ? String(p0) : sup(p0, e))).join(' × '), powStr(fs.slice(1)), swapped];
        }
        const uniq = choices.filter((x, i) => choices.indexOf(x) === i);
        return {
          type: 'choice', choices: uniq.map(m), answer: 0,
          prompt: `מהו הפירוק של ${n} לגורמים ${b('ראשוניים')}?`,
          hint: `${c.g('בדוק', 'בדקי')} שני דברים: שכל הגורמים ראשוניים, ושהמכפלה שלהם באמת ${n}.`,
          solution: [`${m(`${n} = ${expStr(fs)}`)}`, L2 ? 'כל הגורמים ראשוניים, והמכפלה נכונה.' : `בכתיב חזקות: ${m(`${n} = ${powStr(fs)}`)}`],
        };
      }
      if (kind === 'missingFactor') {
        const n = c.pick(pool), fs = HM.primeFactors(n), i = c.rnd(0, fs.length - 1);
        return {
          type: 'number', answer: fs[i],
          prompt: `${c.g('השלם', 'השלימי')} את הגורם הראשוני החסר:<div class="big">${m(`${n} = ` + fs.map((f, j) => (j === i ? HM.slot(0) : f)).join(' × '))}</div>`,
          hint: `${c.g('כפול', 'כפלי')} את הגורמים שכבר יש, ו${c.g('חלק', 'חלקי')} את ${n} בתוצאה.`,
          solution: [`${m(fs.filter((f, j) => j !== i).join(' × ') + ' = ' + n / fs[i])}`, `${m(`${n} : ${n / fs[i]} = ${fs[i]}`)} — הגורם החסר.`],
        };
      }
      if (kind === 'countFactor') {
        const n = c.pick(pool), fs = HM.primeFactors(n), g = groupF(fs);
        const pick = g.filter((x) => x[1] > 1).length ? c.pick(g.filter((x) => x[1] > 1)) : c.pick(g);
        return {
          type: 'number', answer: pick[1],
          prompt: `בפירוק של ${n} לגורמים ראשוניים, כמה פעמים מופיע הגורם ${pick[0]}?`,
          visual: drawTree(buildTree(n)),
          hint: `${c.g('ספור', 'ספרי')} את העיגולים שכתוב בהם ${pick[0]}.`,
          solution: [m(`${n} = ${expStr(fs)} = ${powStr(fs)}`), `הגורם ${pick[0]} מופיע ${pick[1] === 1 ? 'פעם אחת' : pick[1] + ' פעמים'}.`],
        };
      }
      if (kind === 'fromFactors') {
        const n = c.pick(pool), fs = HM.primeFactors(n);
        return {
          type: 'number', answer: n,
          prompt: `איזה מספר מתקבל?<div class="big">${m(`${powStr(fs)} = ${HM.slot(0)}`)}</div>`,
          hint: 'קודם ' + c.g('חשב', 'חשבי') + ' את החזקות, ואחר כך ' + c.g('כפול', 'כפלי') + '.',
          solution: [m(`${powStr(fs)} = ${expStr(fs)}`), m(`${expStr(fs)} = ${n}`)],
        };
      }
      if (kind === 'between') {
        const a = c.rnd(1, 8) * 10, bnd = a + c.pick([10, 20]);
        const ps = PRIMES100.filter((x) => x > a && x < bnd);
        return {
          type: 'number', answer: ps.length,
          prompt: `כמה מספרים ראשוניים יש בין ${a} ל-${bnd}?`,
          hint: `${c.g('פסול', 'פסלי')} קודם את הזוגיים ואת מה שמסתיים ב-5. את השאר ${c.g('בדוק', 'בדקי')} עם 3 ו-7.`,
          solution: [`המספרים הראשוניים בין ${a} ל-${bnd}: ${ps.join(', ')}.`, `התשובה: ${ps.length}.`],
        };
      }
      if (kind === 'largest') {
        const n = c.pick(pool.concat([91, 119, 133, 143, 161, 187, 203, 209, 221, 247, 299])), fs = HM.primeFactors(n);
        return {
          type: 'number', answer: fs[fs.length - 1],
          prompt: `מהו הגורם הראשוני ה${b('גדול ביותר')} של ${n}?`,
          hint: `${c.g('פרק', 'פרקי')} את ${n} לגורמים ראשוניים — ${c.g('התחל', 'התחילי')} מהקטנים: 2, 3, 5, 7, 11, 13...`,
          solution: [m(`${n} = ${expStr(fs)}`), `הגורם הגדול ביותר: ${fs[fs.length - 1]}.`],
        };
      }
      if (kind === 'tens') {
        const m0 = c.pick([2, 4, 5, 8, 25]), k = c.rnd(2, 4), N = m0 * Math.pow(10, k), q = c.pick([2, 5]);
        const fs = HM.primeFactors(N), e = fs.filter((x) => x === q).length;
        return {
          type: 'number', answer: e,
          prompt: `בפירוק של ${fm(N)} לגורמים ראשוניים, כמה פעמים מופיע הגורם ${q}?`,
          hint: `${m(`${fm(N)} = ${m0} × ${fm(Math.pow(10, k))}`)}. כל 10 הוא ${m('2 × 5')}.`,
          solution: [`${m(`${fm(Math.pow(10, k))} = ${sup(2, k)} × ${sup(5, k)}`)}, ${m(`${m0} = ${powStr(HM.primeFactors(m0))}`)}`, `${m(`${fm(N)} = ${powStr(fs)}`)}`, `הגורם ${q} מופיע ${e} פעמים.`],
        };
      }
      if (kind === 'order') {
        const vals = c.sample(HM.range(12, 72).filter((x) => !HM.isPrime(x) && HM.primeFactors(x).length >= 3), 4);
        const sorted = vals.map((x, i) => i).sort((i, j) => vals[i] - vals[j]);
        return {
          type: 'order', items: vals.map((x) => m(powStr(HM.primeFactors(x)))), answer: sorted,
          prompt: `${c.g('סדר', 'סדרי')} את המספרים ${b('מהקטן לגדול')}:`,
          hint: `${c.g('חשב', 'חשבי')} את הערך של כל מכפלה.`,
          solution: [sorted.map((i) => m(`${powStr(HM.primeFactors(vals[i]))} = ${vals[i]}`)).join(' , ')],
        };
      }
      if (kind === 'secret') {
        const sc = c.scene(SECRET);
        let lo0, hi0, pr, ps, s0;
        for (let t = 0; t < 60; t++) {
          lo0 = c.rnd(1, 7) * 10; hi0 = lo0 + c.pick([20, 30]);
          ps = PRIMES100.filter((x) => x > lo0 && x < hi0); pr = c.pick(ps); s0 = dsum(pr);
          if (ps.filter((x) => dsum(x) === s0).length === 1) break;
          if (t === 59) { lo0 = 40; hi0 = 60; ps = [41, 43, 47, 53, 59]; pr = 47; s0 = 11; }
        }
        return {
          type: 'number', answer: pr,
          prompt: `${sc.lead} מספר ראשוני בין ${lo0} ל-${hi0}, וסכום הספרות שלו ${s0}.<br>מהו המספר?`,
          hint: `${c.g('כתוב', 'כתבי')} את כל המספרים הראשוניים בין ${lo0} ל-${hi0}, ו${c.g('בדוק', 'בדקי')} את סכום הספרות של כל אחד.`,
          solution: [`הראשוניים בין ${lo0} ל-${hi0}: ${ps.join(', ')}.`, `רק ל-${pr} סכום הספרות ${s0}: ${m(`${String(pr)[0]} + ${String(pr)[1]} = ${s0}`)}.`, `התשובה: ${pr}.`],
        };
      }
      // semi: מכפלה של שני ראשוניים
      const sc = c.scene(ITEMS), p = P(c);
      const [a, bq] = c.sample([2, 3, 5, 7, 11, 13, 17, 19], 2).sort((x, y) => x - y);
      const N = a * bq;
      return {
        type: 'number', answer: bq,
        prompt: `${p.name} ${p.g('סידר', 'סידרה')} ${N} ${sc.its} ב${sc.conts}, ובכל ${sc.cont} אותו מספר. מספר ה${sc.conts} ומספר ${sc.the} בכל ${sc.cont} הם מספרים ראשוניים, ובכל ${sc.cont} יש יותר ${sc.its} ממספר ה${sc.conts}.<br>כמה ${sc.its} יש בכל ${sc.cont}?`,
        hint: `${c.g('פרק', 'פרקי')} את ${N} למכפלה של שני מספרים ראשוניים.`,
        solution: [m(`${N} = ${a} × ${bq}`), `שני הגורמים ראשוניים, ו-${bq} הוא הגדול מביניהם.`, `לכן בכל ${sc.cont} יש ${bq} ${sc.its}.`],
      };
    },
  });

  /* ========== חזקות ========== */
  const pw = (b0, e) => Math.pow(b0, e);
  const rep = (b0, e, op) => HM.range(1, e).map(() => b0).join(op || ' × ');
  // סיפורי "קופסה בתוך קופסה" (חזקה שלישית)
  const NEST = [
    { tags: ['baking'], t: (n) => `במאפייה יש ${n} ארגזים. בכל ארגז ${n} מגשים, ובכל מגש ${n} עוגיות.`, ask: 'כמה עוגיות יש בכל הארגזים?' },
    { tags: ['squishy'], t: (n) => `בחנות הסקווישים יש ${n} מדפים. על כל מדף ${n} קופסאות, ובכל קופסה ${n} סקווישים.`, ask: 'כמה סקווישים יש על כל המדפים?' },
    { tags: ['reading'], t: (n) => `בספרייה יש ${n} ארונות. בכל ארון ${n} מדפים, ובכל מדף ${n} ספרים.`, ask: 'כמה ספרים יש בכל הארונות?' },
    { tags: ['magic'], t: (n) => `בבית הספר לקוסמים יש ${n} כיתות. בכל כיתה ${n} שולחנות, ועל כל שולחן ${n} בקבוקוני שיקוי.`, ask: 'כמה בקבוקוני שיקוי יש בכל הכיתות?' },
    { tags: ['kpop'], t: (n) => `במחסן של הלהקה יש ${n} ארגזים. בכל ארגז ${n} קופסאות, ובכל קופסה ${n} מקלות אור.`, ask: 'כמה מקלות אור יש במחסן?' },
    { tags: ['nature'], t: (n) => `על עץ יש ${n} ענפים גדולים. על כל ענף גדול ${n} ענפים קטנים, ועל כל ענף קטן ${n} עלים.`, ask: 'כמה עלים יש על העץ?' },
    { tags: ['space'], t: (n) => `בגלקסיה דמיונית יש ${n} מערכות שמש. בכל מערכת ${n} כוכבי לכת, ולכל כוכב לכת ${n} ירחים.`, ask: 'כמה ירחים יש בגלקסיה?' },
    { tags: ['sport'], t: (n) => `באצטדיון יש ${n} יציעים. בכל יציע ${n} שורות, ובכל שורה ${n} כיסאות.`, ask: 'כמה כיסאות יש באצטדיון?' },
    { tags: ['art'], t: (n) => `בחנות היצירה יש ${n} ארגזים. בכל ארגז ${n} קופסאות, ובכל קופסה ${n} טושים.`, ask: 'כמה טושים יש בכל הארגזים?' },
    { tags: ['tech'], t: (n) => `במפעל הרובוטים יש ${n} פסי ייצור. על כל פס ${n} רובוטים, ולכל רובוט ${n} גלגלים.`, ask: 'כמה גלגלים יש לכל הרובוטים?' },
    { tags: ['animals'], t: (n) => `בחווה יש ${n} לולים. בכל לול ${n} תרנגולות, וכל תרנגולת הטילה ${n} ביצים.`, ask: 'כמה ביצים הוטלו בסך הכול?' },
  ];
  // שרשרת שיתוף (חזקה לפי מספר הסבבים)
  const CHAIN = [
    { tags: ['tech'], thing: 'הודעה', f: true },
    { tags: ['kpop'], thing: 'סרטון של הריקוד החדש', f: false },
    { tags: ['games'], thing: 'הזמנה למשחק החדש', f: true },
    { tags: ['magic'], thing: 'מכתב בדואר ינשופים', f: false },
    { tags: ['music'], thing: 'שיר חדש', f: false },
  ];
  const ORD = ['', 'הראשון', 'השני', 'השלישי', 'הרביעי', 'החמישי'];
  const toN = (n) => (n === 2 ? 'לשני חברים' : `ל-${n} חברים`);

  HM.lesson({
    id: 'n-powers',
    learn: (c) => [
      {
        title: 'קיפולים מכפילים',
        html: `${c.name}, ${c.g('קפל', 'קפלי')} דף נייר לחצי: 2 שכבות. ${c.g('קפל', 'קפלי')} שוב: 4 שכבות. ושוב: 8.<br>בכל קיפול ${b('כופלים ב-2')}: ${m('2 × 2 × 2 = 8')}.<br>כפל של אותו מספר שוב ושוב כותבים בקיצור — ${b('חזקה')}: ${m('2<sup>3</sup> = 8')}.`,
        visual: V.pattern([1, 2, 4, 8], 'line', { labels: ['לפני', 'קיפול 1', 'קיפול 2', 'קיפול 3'] }),
      },
      {
        title: 'בסיס ומעריך',
        html: `בחזקה ${m('5<sup>3</sup>')}:<br>• ${b('הבסיס')} הוא 5 — המספר שכופלים.<br>• ${b('המעריך')} הוא 3 — כמה פעמים כופלים אותו.<br>${m('5<sup>3</sup> = 5 × 5 × 5 = 125')}<br>קוראים: "5 בחזקת 3". ${m('5<sup>2</sup>')} נקרא גם "5 בריבוע".`,
        visual: S.svg(260, 130, S.text(120, 78, '5', { fs: 64, fw: 800, cls: 't-a' }) + S.text(154, 38, '3', { fs: 32, fw: 800, cls: 't-b' }) + S.line(102, 102, 66, 116, { cls: 's-a', sw: 2 }) + S.text(38, 118, 'בסיס', { fs: 16, fw: 700, cls: 't-a' }) + S.line(170, 30, 202, 22, { cls: 's-b', sw: 2 }) + S.text(228, 20, 'מעריך', { fs: 16, fw: 700, cls: 't-b' }), { label: 'בסיס ומעריך', maxw: 260 }),
      },
      {
        title: 'זהירות: זה לא כפל!',
        html: `${m('2<sup>4</sup>')} ${b('אינו')} ${m('2 × 4')}:<br>${m('2<sup>4</sup> = 2 × 2 × 2 × 2 = 16')}, ואילו ${m('2 × 4 = 8')}.<br>וגם אי אפשר להחליף בין הבסיס למעריך: ${m('3<sup>2</sup> = 9')} (ריבוע של 9 נקודות), אבל ${m('2<sup>3</sup> = 8')}. בחזקה ${b('אין חוק חילוף')}!`,
        visual: `<div class="row">${V.dots(3, 3)}${V.dots(2, 4)}</div>`,
      },
      {
        title: 'מעריך 1',
        html: `${m('7<sup>1</sup> = 7')} — המספר 7 מופיע ${b('פעם אחת')}, ולכן נשאר 7.<br>כל מספר בחזקת 1 שווה לעצמו: ${m('25<sup>1</sup> = 25')}.<br>ומה עם בסיס 1? ${m('1<sup>5</sup> = 1 × 1 × 1 × 1 × 1 = 1')}.`,
        quiz: {
          type: 'number', answer: 9, prompt: `${c.g('השלם', 'השלימי')}: ${m('9<sup>1</sup> = ' + HM.slot(0))}`,
          hint: 'המעריך 1 — הבסיס מופיע פעם אחת בלבד.',
          solution: [m('9<sup>1</sup> = 9')],
        },
      },
      {
        title: 'חזקות של 10',
        html: `בחזקות של 10, ${b('המעריך שווה למספר האפסים')}: ${m('10<sup>4</sup> = 10,000')} — 4 אפסים.<br>מיליון הוא ${m('10<sup>6</sup>')}.`,
        visual: V.table(['חזקה', 'כפל', 'מספר'], [[m('10<sup>1</sup>'), m('10'), '10'], [m('10<sup>2</sup>'), m('10 × 10'), '100'], [m('10<sup>3</sup>'), m('10 × 10 × 10'), '1,000'], [m('10<sup>6</sup>'), m('10 × … × 10'), '1,000,000']]),
      },
      {
        title: 'דוגמה: מה גדול יותר?',
        html: `מה גדול יותר: ${m('2<sup>5</sup>')} או ${m('5<sup>2</sup>')}?`,
        steps: [
          m('2<sup>5</sup> = 2 × 2 × 2 × 2 × 2 = 32'),
          m('5<sup>2</sup> = 5 × 5 = 25'),
          `${m('32 &gt; 25')}, לכן ${m('2<sup>5</sup> &gt; 5<sup>2</sup>')} ✔`,
        ],
      },
    ],
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const story = c.chance(0.4);
      const kinds = L1 ? (story ? ['sq', 'fold'] : ['calc', 'baseExp', 'toPower', 'expand', 'exp1'])
        : L2 ? (story ? ['nest', 'chain'] : ['compare', 'tens', 'missingExp', 'missingBase', 'tfSwap'])
        : (story ? ['tourney', 'chainTotal', 'offer'] : ['order', 'mixed', 'trap', 'tensTimes', 'compare']);
      const kind = c.pick(kinds);
      const sl = HM.slot(0);

      if (kind === 'calc') {
        const b0 = c.pick([2, 3, 4, 5, 10]), e = b0 === 2 ? c.rnd(2, 4) : c.rnd(2, 3), v = pw(b0, e);
        return {
          type: 'number', answer: v,
          prompt: `${c.g('חשב', 'חשבי')}:<div class="big">${m(`${sup(b0, e)} = ${sl}`)}</div>`,
          hint: `${c.g('כתוב', 'כתבי')} כתרגיל כפל: ${b0} מופיע ${e} פעמים.`,
          solution: [m(`${sup(b0, e)} = ${rep(b0, e)}`), m(`${rep(b0, e)} = ${fm(v)}`)],
        };
      }
      if (kind === 'baseExp') {
        const b0 = c.rnd(2, 9), e = c.rnd(2, 6), askB = c.chance(0.5);
        return {
          type: 'number', answer: askB ? b0 : e,
          prompt: `בחזקה ${m(sup(b0, e))}, מהו ${askB ? b('הבסיס') : b('המעריך')}?`,
          hint: 'הבסיס הוא המספר הגדול — המספר שכופלים. המעריך הוא המספר הקטן למעלה — כמה פעמים כופלים.',
          solution: [`${m(sup(b0, e))}: קוראים "${b0} בחזקת ${e}".`, `הבסיס ${b0}, המעריך ${e}. התשובה: ${askB ? b0 : e}.`],
        };
      }
      if (kind === 'toPower') {
        let b0 = c.rnd(2, 6), e = c.rnd(3, 5);
        if (b0 === e) b0 = e === 6 ? 2 : b0 + 1;
        return {
          type: 'choice', choices: [m(sup(b0, e)), m(sup(e, b0)), m(`${b0} × ${e}`), m(sup(b0, e - 1))], answer: 0,
          prompt: `איך כותבים בחזקה את התרגיל ${m(rep(b0, e))}?`,
          hint: `${c.g('ספור', 'ספרי')} כמה פעמים מופיע ${b0} — זה המעריך.`,
          solution: [`${b0} מופיע ${e} פעמים ← הבסיס ${b0}, המעריך ${e}.`, m(`${rep(b0, e)} = ${sup(b0, e)}`)],
        };
      }
      if (kind === 'expand') {
        let b0 = c.rnd(2, 5), e = c.rnd(3, 4);
        if (b0 === e) b0 = 2;
        return {
          type: 'choice', choices: [m(rep(b0, e)), m(`${b0} × ${e}`), m(rep(e, b0)), m(rep(b0, e, ' + '))], answer: 0,
          prompt: `איזה תרגיל שווה ל-${m(sup(b0, e))}?`,
          hint: 'המעריך אומר כמה פעמים כופלים את הבסיס בעצמו.',
          solution: [m(`${sup(b0, e)} = ${rep(b0, e)} = ${pw(b0, e)}`)],
        };
      }
      if (kind === 'exp1') {
        const one = c.chance(0.35), n = c.rnd(2, 99), e = c.rnd(2, 9);
        return {
          type: 'number', answer: one ? 1 : n,
          prompt: `${c.g('השלם', 'השלימי')}:<div class="big">${m(`${one ? sup(1, e) : sup(n, 1)} = ${sl}`)}</div>`,
          hint: one ? 'כמה זה 1 כפול 1 כפול 1...?' : 'המעריך 1 אומר שהבסיס מופיע פעם אחת בלבד.',
          solution: one ? [m(`${sup(1, e)} = ${rep(1, e)} = 1`)] : [`המספר ${n} מופיע פעם אחת: ${m(`${sup(n, 1)} = ${n}`)}`],
        };
      }
      if (kind === 'sq') {
        const sc = c.scene(ITEMS), p = P(c), n = c.rnd(3, 8);
        return {
          type: 'number', answer: n * n,
          prompt: `${p.name} ${p.g('סידר', 'סידרה')} ${sc.its} בריבוע: ${n} שורות, ובכל שורה ${n} ${sc.its}.<br>כמה ${sc.its} יש בריבוע? (זה ${m(sup(n, 2))})`,
          visual: V.dots(n, n),
          hint: `${m(sup(n, 2))} פירושו ${m(`${n} × ${n}`)}.`,
          solution: [m(`${sup(n, 2)} = ${n} × ${n} = ${n * n}`), `התשובה: ${n * n} ${sc.its}.`],
        };
      }
      if (kind === 'fold') {
        const p = P(c), k = c.rnd(2, 5);
        return {
          type: 'number', answer: pw(2, k),
          prompt: `${p.name} ${p.g('קיפל', 'קיפלה')} דף נייר לחצי, ושוב לחצי — בסך הכול ${k} קיפולים.<br>כמה שכבות של נייר יש עכשיו?`,
          visual: V.pattern(HM.range(0, Math.min(k, 3)).map((i) => pw(2, i)), 'line', { labels: HM.range(0, Math.min(k, 3)).map((i) => (i ? `קיפול ${i}` : 'לפני')) }),
          hint: `בכל קיפול מספר השכבות ${b('מוכפל ב-2')}.`,
          solution: [`${k} קיפולים ← ${m(rep(2, k))}`, m(`${sup(2, k)} = ${pw(2, k)}`), `התשובה: ${pw(2, k)} שכבות.`],
        };
      }
      if (kind === 'nest') {
        const sc = c.scene(NEST), n = c.chance(0.2) ? 10 : c.rnd(3, 6), v = pw(n, 3);
        return {
          type: 'number', answer: v,
          prompt: `${sc.t(n)}<br>${sc.ask}`,
          hint: `${c.g('שים', 'שימי')} לב: אותו מספר חוזר שלוש פעמים. זו חזקה!`,
          solution: [m(`${n} × ${n} × ${n} = ${sup(n, 3)}`), m(`${sup(n, 3)} = ${fm(v)}`), `התשובה: ${fm(v)}.`],
        };
      }
      if (kind === 'chain') {
        const sc = c.scene(CHAIN), p = P(c), n = c.rnd(2, 5), r = n <= 3 ? c.rnd(3, 4) : 3, v = pw(n, r);
        const it = sc.f ? 'אותה' : 'אותו';
        return {
          type: 'number', answer: v,
          prompt: `${p.name} ${p.g('שלח', 'שלחה')} ${sc.thing} ${toN(n)} (הסבב הראשון). כל אחד מהם שלח ${it} ${toN(n)} חדשים, וכך הלאה.<br>כמה ילדים קיבלו ${it} בסבב ה${ORD[r].slice(1)}?`,
          hint: `בכל סבב מספר הילדים ${b(`מוכפל ב-${n}`)}. ${c.g('כתוב', 'כתבי')} את זה בחזקה.`,
          solution: HM.range(1, r).map((i) => `סבב ${i}: ${m(sup(n, i) + ' = ' + pw(n, i))}`).slice(-3).concat([`התשובה: ${fm(v)}.`]),
        };
      }
      if (kind === 'compare') {
        const pairs = L2 ? [[2, 3], [2, 5], [3, 4], [2, 6], [2, 4], [4, 5], [3, 5]] : [[2, 10, 10, 3], [3, 5, 5, 3], [2, 8, 4, 4], [9, 2, 3, 4], [2, 7, 5, 3], [6, 3, 3, 6], [2, 9, 9, 2], [4, 3, 8, 2]];
        const pr = c.pick(pairs);
        let l, r;
        if (L2) { if (c.chance(0.75)) { l = [pr[0], pr[1]]; r = [pr[1], pr[0]]; } else { l = [pr[1], pr[0]]; r = null; } }
        else { l = [pr[0], pr[1]]; r = [pr[2], pr[3]]; }
        if (c.chance(0.5) && r) [l, r] = [r, l];
        const lv = pw(l[0], l[1]), rv = r ? pw(r[0], r[1]) : l[0] * l[1];
        const left = sup(l[0], l[1]), right = r ? sup(r[0], r[1]) : `${l[0]} × ${l[1]}`;
        return {
          type: 'compare', left: m(left), right: m(right), lv, rv,
          answer: lv === rv ? '=' : lv < rv ? '<' : '>',
          prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
          hint: `${c.g('חשב', 'חשבי')} כל צד בנפרד — אל ${c.g('תסמוך', 'תסמכי')} על המראה!`,
          solution: [m(`${left} = ${fm(lv)}`), m(`${right} = ${fm(rv)}`), m(`${left} ${lv === rv ? '=' : lv < rv ? '&lt;' : '&gt;'} ${right}`)],
        };
      }
      if (kind === 'tens') {
        const k = c.rnd(2, 6), v = pw(10, k), fwd = c.chance(0.5);
        return {
          type: 'number', answer: fwd ? v : k,
          prompt: fwd ? `${c.g('כתוב', 'כתבי')} את המספר:<div class="big">${m(`${sup(10, k)} = ${sl}`)}</div>` : `${fm(v)} הוא 10 בחזקת כמה?<div class="big">${m(`${fm(v)} = 10<sup>?</sup>`)}</div>`,
          hint: 'בחזקות של 10, המעריך שווה למספר האפסים.',
          solution: [m(`${sup(10, k)} = ${rep(10, k)} = ${fm(v)}`), `ב-${fm(v)} יש ${k} אפסים, ולכן המעריך הוא ${k}.`],
        };
      }
      if (kind === 'missingExp') {
        const b0 = c.pick([2, 3, 4, 5, 10]), e = b0 === 2 ? c.rnd(3, 7) : b0 === 10 ? c.rnd(2, 6) : c.rnd(2, 4), v = pw(b0, e);
        return {
          type: 'number', answer: e,
          prompt: `${c.g('מצא', 'מצאי')} את המעריך החסר:<div class="big">${m(`${b0}<sup>?</sup> = ${fm(v)}`)}</div>`,
          hint: `${c.g('כפול', 'כפלי')} ${b0} בעצמו שוב ושוב, ו${c.g('ספור', 'ספרי')} כמה פעמים עד ${fm(v)}.`,
          solution: [m(`${rep(b0, e)} = ${fm(v)}`), `${b0} מופיע ${e} פעמים, לכן המעריך ${e}.`],
        };
      }
      if (kind === 'missingBase') {
        const e = c.pick([2, 2, 3]), b0 = e === 2 ? c.rnd(2, 12) : c.rnd(2, 6), v = pw(b0, e);
        return {
          type: 'number', answer: b0,
          prompt: `${c.g('מצא', 'מצאי')} את הבסיס החסר:<div class="big">${m(`?<sup>${e}</sup> = ${v}`)}</div>`,
          hint: `איזה מספר, כשכופלים אותו בעצמו ${e === 2 ? 'פעמיים' : '3 פעמים'}, נותן ${v}?`,
          solution: [m(`${rep(b0, e)} = ${v}`), `הבסיס הוא ${b0}.`],
        };
      }
      if (kind === 'tfSwap' || kind === 'trap') {
        const pool = L2 ? [
          () => { const a = c.rnd(2, 5); let e = c.rnd(2, 5); if (e === a) e = a === 2 ? 3 : 2; return [`${sup(a, e)} = ${sup(e, a)}`, pw(a, e) === pw(e, a), `${sup(a, e)} = ${pw(a, e)}, ${sup(e, a)} = ${pw(e, a)}`]; },
          () => { const a = c.rnd(2, 6), e = c.rnd(2, 4); return [`${sup(a, e)} = ${a} × ${e}`, pw(a, e) === a * e, `${sup(a, e)} = ${rep(a, e)} = ${pw(a, e)}, ${a} × ${e} = ${a * e}`]; },
          () => { const n = c.rnd(2, 30); return [`${sup(n, 1)} = ${n}`, true, `המעריך 1: המספר מופיע פעם אחת.`]; },
          () => { const n = c.rnd(2, 9); return [`${sup(1, n)} = ${n}`, false, `${sup(1, n)} = ${rep(1, n)} = 1`]; },
          () => { const k = c.rnd(2, 6), ok = c.chance(0.5); return [`${sup(10, k)} = ${ok ? fm(pw(10, k)) : 10 * k}`, ok, `${sup(10, k)} = ${fm(pw(10, k))}`]; },
        ] : [
          () => [`${sup(2, 4)} = ${sup(4, 2)}`, true, `${sup(2, 4)} = 16, ${sup(4, 2)} = 16`],
          () => [`${sup(2, 10)} &gt; ${sup(10, 2)}`, true, `${sup(2, 10)} = 1,024, ${sup(10, 2)} = 100`],
          () => [`${sup(3, 4)} = ${sup(9, 2)}`, true, `${sup(3, 4)} = 81, ${sup(9, 2)} = 81`],
          () => [`${sup(2, 6)} = ${sup(4, 3)}`, true, `${sup(2, 6)} = 64, ${sup(4, 3)} = 64`],
          () => [`${sup(2, 5)} = ${sup(5, 2)}`, false, `${sup(2, 5)} = 32, ${sup(5, 2)} = 25`],
          () => [`${sup(5, 3)} = 15`, false, `${sup(5, 3)} = 5 × 5 × 5 = 125`],
          () => [`${sup(1, 100)} = 100`, false, `${sup(1, 100)} = 1 — כפל של 1 בעצמו נשאר 1`],
          () => [`${sup(6, 2)} &lt; ${sup(2, 6)}`, true, `${sup(6, 2)} = 36, ${sup(2, 6)} = 64`],
          () => [`${sup(3, 3)} = ${sup(3, 2)} × 3`, true, `${sup(3, 3)} = 27, ${sup(3, 2)} × 3 = 9 × 3 = 27`],
          () => [`${sup(10, 3)} × ${sup(10, 2)} = ${sup(10, 6)}`, false, `${sup(10, 3)} × ${sup(10, 2)} = 1,000 × 100 = 100,000 = ${sup(10, 5)}`],
        ];
        const [st, ans, ex] = c.pick(pool)();
        return {
          type: 'tf', answer: ans,
          prompt: `${b('נכון או לא נכון?')}<div class="big">${m(st)}</div>`,
          hint: `${c.g('חשב', 'חשבי')} את הערך של כל צד.`,
          solution: [m(ex), ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
        };
      }
      if (kind === 'order') {
        const VALS = [[2, 3], [3, 2], [2, 4], [5, 2], [3, 3], [2, 5], [6, 2], [7, 2], [4, 3], [3, 4], [10, 2], [5, 3], [2, 7], [11, 2], [12, 2]];
        let pick4;
        do { pick4 = c.sample(VALS, 4); } while (new Set(pick4.map((x) => pw(x[0], x[1]))).size < 4);
        const sorted = pick4.map((x, i) => i).sort((i, j) => pw(pick4[i][0], pick4[i][1]) - pw(pick4[j][0], pick4[j][1]));
        return {
          type: 'order', items: pick4.map((x) => m(sup(x[0], x[1]))), answer: sorted,
          prompt: `${c.g('סדר', 'סדרי')} את החזקות ${b('מהקטנה לגדולה')}:`,
          hint: `${c.g('חשב', 'חשבי')} את הערך של כל חזקה. בסיס גדול לא תמיד אומר חזקה גדולה!`,
          solution: [sorted.map((i) => m(`${sup(pick4[i][0], pick4[i][1])} = ${pw(pick4[i][0], pick4[i][1])}`)).join(' , ')],
        };
      }
      if (kind === 'mixed') {
        const t = c.pick(['add', 'sub', 'mul10', 'mul25']);
        let ex, v, sol;
        if (t === 'add') { const a = c.rnd(2, 9), b2 = c.rnd(2, 4); ex = `${sup(a, 2)} + ${sup(b2, 3)}`; v = a * a + pw(b2, 3); sol = [m(`${sup(a, 2)} = ${a * a}, ${sup(b2, 3)} = ${pw(b2, 3)}`), m(`${a * a} + ${pw(b2, 3)} = ${v}`)]; }
        else if (t === 'sub') { const e = c.rnd(5, 7), a = c.rnd(3, e === 5 ? 5 : 7); ex = `${sup(2, e)} − ${sup(a, 2)}`; v = pw(2, e) - a * a; sol = [m(`${sup(2, e)} = ${pw(2, e)}, ${sup(a, 2)} = ${a * a}`), m(`${pw(2, e)} − ${a * a} = ${v}`)]; }
        else if (t === 'mul10') { const d = c.rnd(2, 9), k = c.rnd(2, 4); ex = `${d} × ${sup(10, k)} + ${sup(d, 2)}`; v = d * pw(10, k) + d * d; sol = [m(`${d} × ${fm(pw(10, k))} = ${fm(d * pw(10, k))}`), m(`${fm(d * pw(10, k))} + ${d * d} = ${fm(v)}`)]; }
        else { const k = c.rnd(2, 4); ex = `${sup(2, k)} × ${sup(5, k)}`; v = pw(10, k); sol = [m(`${pw(2, k)} × ${pw(5, k)} = ${fm(v)}`), `כי ${m('2 × 5 = 10')}, ולכן התוצאה ${m(sup(10, k))}.`]; }
        return {
          type: 'number', answer: v,
          prompt: `${c.g('חשב', 'חשבי')}:<div class="big">${m(`${ex} = ${sl}`)}</div>`,
          hint: `קודם ${c.g('חשב', 'חשבי')} את החזקות, ורק אחר כך את שאר הפעולות.`,
          solution: sol,
        };
      }
      if (kind === 'tensTimes') {
        const d = c.rnd(2, 99), k = c.rnd(2, 4), v = d * pw(10, k), fwd = c.chance(0.5);
        return {
          type: 'number', answer: fwd ? v : k,
          prompt: fwd ? `${c.g('חשב', 'חשבי')}:<div class="big">${m(`${d} × ${sup(10, k)} = ${sl}`)}</div>` : `${c.g('מצא', 'מצאי')} את המעריך החסר:<div class="big">${m(`${fm(v)} = ${d} × 10<sup>?</sup>`)}</div>`,
          hint: `${m(sup(10, k))} הוא 1 ואחריו ${k} אפסים. כפל ב-${fm(pw(10, k))} מוסיף אפסים.`,
          solution: [m(`${sup(10, k)} = ${fm(pw(10, k))}`), m(`${d} × ${fm(pw(10, k))} = ${fm(v)}`), fwd ? `התשובה: ${fm(v)}.` : `המעריך: ${k}.`],
        };
      }
      if (kind === 'tourney') {
        const sport = c.scene([{ tags: ['sport'], t: 'טניס' }, { tags: ['games'], t: 'משחקי מחשב' }, { tags: ['magic'], t: 'דו-קרב קסמים' }, { tags: ['reading'], t: 'שחמט' }, { tags: [], t: 'פינג-פונג' }]);
        const k = c.rnd(3, 6), v = pw(2, k);
        return {
          type: 'number', answer: v,
          prompt: `בטורניר ${sport.t} כל משחק הוא בין שני שחקנים, והמפסיד יוצא. אחרי ${k} סיבובים נשאר מנצח אחד.<br>כמה שחקנים היו בטורניר בהתחלה?`,
          hint: `${c.g('חשוב', 'חשבי')} מהסוף להתחלה: לפני הסיבוב האחרון היו 2 שחקנים, ולפני כן — פי 2...`,
          solution: [`בכל סיבוב מספר השחקנים קטן פי 2. מהסוף: ${HM.range(0, k).map((i) => pw(2, i)).join(' ← ')}.`, m(`${sup(2, k)} = ${v}`), `התשובה: ${v} שחקנים.`],
        };
      }
      if (kind === 'chainTotal') {
        const sc = c.scene(CHAIN), p = P(c), n = c.rnd(2, 5);
        const it = sc.f ? 'אותה' : 'אותו', tot = n + n * n + n * n * n;
        return {
          type: 'number', answer: tot,
          prompt: `${p.name} ${p.g('שלח', 'שלחה')} ${sc.thing} ${toN(n)}. כל אחד מהם שלח ${it} ${toN(n)} חדשים, וכל אחד מהחדשים שלח ${it} ${toN(n)} נוספים.<br>כמה ילדים קיבלו ${it} בסך הכול?`,
          hint: `${c.g('חשב', 'חשבי')} כמה קיבלו בכל סבב (חזקות של ${n}), ואז ${c.g('חבר', 'חברי')}.`,
          solution: [`סבב 1: ${m(sup(n, 1) + ' = ' + n)}, סבב 2: ${m(sup(n, 2) + ' = ' + n * n)}, סבב 3: ${m(sup(n, 3) + ' = ' + pw(n, 3))}`, m(`${n} + ${n * n} + ${pw(n, 3)} = ${tot}`), `התשובה: ${tot} ילדים.`],
        };
      }
      // offer: השוואת שתי הצעות
      const p = P(c);
      const pr = c.pick([[2, 3], [2, 5], [3, 4], [2, 6], [2, 4], [3, 5], [4, 5]]);
      const [a, e] = c.chance(0.5) ? pr : [pr[1], pr[0]];
      const va = pw(a, e), vb = pw(e, a);
      const goods = c.scene([{ tags: ['squishy'], w: 'סקווישים' }, { tags: ['kpop'], w: 'פוטוקארדים' }, { tags: ['games'], w: 'מטבעות במשחק' }, { tags: [], w: '₪ לחיסכון' }]);
      return {
        type: 'choice', keep: true, answer: va > vb ? 0 : va < vb ? 1 : 2,
        choices: ['הצעה א', 'הצעה ב', 'שתי ההצעות שוות'],
        prompt: `${p.name} ${p.g('יכול', 'יכולה')} לבחור:<br>הצעה א: ${m(sup(a, e))} ${goods.w}.<br>הצעה ב: ${m(sup(e, a))} ${goods.w}.<br>באיזו הצעה ${p.g('יקבל', 'תקבל')} יותר?`,
        hint: `${c.g('חשב', 'חשבי')} את שתי החזקות. החלפת הבסיס והמעריך משנה את התוצאה!`,
        solution: [m(`${sup(a, e)} = ${rep(a, e)} = ${va}`), m(`${sup(e, a)} = ${rep(e, a)} = ${vb}`), va === vb ? 'שתי ההצעות שוות.' : `הצעה ${va > vb ? 'א' : 'ב'} גדולה יותר.`],
      };
    },
  });

  /* ========== חוקיות בסדרות ========== */
  const ORDM = ['', 'הראשון', 'השני', 'השלישי', 'הרביעי', 'החמישי', 'השישי', 'השביעי', 'השמיני', 'התשיעי', 'העשירי'];
  const ORDF = ['', 'הראשונה', 'השנייה', 'השלישית', 'הרביעית', 'החמישית', 'השישית', 'השביעית', 'השמינית', 'התשיעית', 'העשירית'];
  const ordn = (n, f) => (n <= 10 ? (f ? ORDF : ORDM)[n] : `ה-${n}`);
  /* סדרה חשבונית בסיפור: a = האיבר הראשון, d = ההפרש. o = מספר סידורי ("החמישי") */
  const GROW = [
    { tags: ['reading'], u: 'יום', w: 'עמודים', t: (p, a, d) => `${p.name} ${p.g('קורא', 'קוראת')} ספר. ביום הראשון ${he(p)} ${p.g('קרא', 'קראה')} ${a} עמודים, ובכל יום ${p.g('הוא קורא', 'היא קוראת')} ${d} עמודים יותר מביום הקודם.`, q: (p, o) => `כמה עמודים ${p.g('יקרא', 'תקרא')} ${p.name} ביום ${o}?`, qi: (p, v) => `באיזה יום ${p.name} ${p.g('יקרא', 'תקרא')} ${v} עמודים?` },
    { tags: ['sport'], u: 'אימון', w: 'דקות', t: (p, a, d) => `באימון הראשון ${p.name} ${p.g('רץ', 'רצה')} ${a} דקות, ובכל אימון ${he(p)} ${p.g('רץ', 'רצה')} ${d} דקות יותר מבאימון הקודם.`, q: (p, o) => `כמה דקות ${p.g('ירוץ', 'תרוץ')} ${p.name} באימון ${o}?`, qi: (p, v) => `באיזה אימון ${p.name} ${p.g('ירוץ', 'תרוץ')} ${v} דקות?` },
    { tags: ['music'], u: 'יום', w: 'דקות', t: (p, a, d) => `${p.name} ${p.g('מתאמן', 'מתאמנת')} בגיטרה. ביום הראשון ${he(p)} ${p.g('התאמן', 'התאמנה')} ${a} דקות, ובכל יום ${p.g('הוא מתאמן', 'היא מתאמנת')} ${d} דקות יותר.`, q: (p, o) => `כמה דקות ${p.g('יתאמן', 'תתאמן')} ${p.name} ביום ${o}?`, qi: (p, v) => `באיזה יום ${p.name} ${p.g('יתאמן', 'תתאמן')} ${v} דקות?` },
    { tags: ['baking'], u: 'יום', w: 'עוגיות', t: (p, a, d) => `לקראת היריד, ${p.name} ${p.g('אופה', 'אופה')} עוגיות. ביום הראשון ${he(p)} ${p.g('אפה', 'אפתה')} ${a} עוגיות, ובכל יום ${d} עוגיות יותר מביום הקודם.`, q: (p, o) => `כמה עוגיות ${p.g('יאפה', 'תאפה')} ${p.name} ביום ${o}?`, qi: (p, v) => `באיזה יום ${p.name} ${p.g('יאפה', 'תאפה')} ${v} עוגיות?` },
    { tags: ['art'], u: 'שורה', f: true, w: 'אבנים', t: (p, a, d) => `${p.name} ${p.g('מכין', 'מכינה')} פסיפס. בשורה הראשונה יש ${a} אבנים, ובכל שורה ${d} אבנים יותר מבשורה הקודמת.`, q: (p, o) => `כמה אבנים יהיו בשורה ${o}?`, qi: (p, v) => `באיזו שורה יהיו ${v} אבנים?` },
    { tags: ['nature'], u: 'שבוע', w: 'ס"מ', unit: 'ס"מ', t: (p, a, d) => `${p.name} ${p.g('שתל', 'שתלה')} שתיל. בסוף השבוע הראשון גובהו ${a} ס"מ, ובכל שבוע הוא גדל ב-${d} ס"מ.`, q: (p, o) => `מה יהיה גובה השתיל בסוף השבוע ${o}?`, qi: (p, v) => `בסוף איזה שבוע יהיה גובה השתיל ${v} ס"מ?` },
    { tags: ['games'], u: 'שלב', w: 'מטבעות', t: (p, a, d) => `במשחק המחשב של ${p.name}, בשלב הראשון מקבלים ${a} מטבעות, ובכל שלב ${d} מטבעות יותר מבשלב הקודם.`, q: (p, o) => `כמה מטבעות מקבלים בשלב ${o}?`, qi: (p, v) => `באיזה שלב מקבלים ${v} מטבעות?` },
    { tags: ['kpop'], u: 'חודש', w: 'מעריצים', t: (p, a, d) => `למועדון המעריצים של הלהקה הצטרפו בחודש הראשון ${a} מעריצים, ובכל חודש מצטרפים ${d} מעריצים יותר מבחודש הקודם.`, q: (p, o) => `כמה מעריצים יצטרפו בחודש ${o}?`, qi: (p, v) => `באיזה חודש יצטרפו ${v} מעריצים?` },
    { tags: ['magic'], u: 'שבוע', w: 'נקודות', t: (p, a, d) => `בבית הספר לקוסמים, הבית של ${p.name} קיבל בשבוע הראשון ${a} נקודות, ובכל שבוע הוא מקבל ${d} נקודות יותר מבשבוע הקודם.`, q: (p, o) => `כמה נקודות יקבל הבית בשבוע ${o}?`, qi: (p, v) => `באיזה שבוע יקבל הבית ${v} נקודות?` },
    { tags: ['squishy'], u: 'שבוע', w: 'סקווישים', t: (p, a, d) => `ל${p.name} יש אוסף סקווישים. בסוף השבוע הראשון היו בו ${a} סקווישים, ובכל שבוע ${he(p)} ${p.g('מוסיף', 'מוסיפה')} לאוסף ${d} סקווישים.`, q: (p, o) => `כמה סקווישים יהיו באוסף בסוף השבוע ${o}?`, qi: (p, v) => `בסוף איזה שבוע יהיו באוסף ${v} סקווישים?` },
    { tags: ['space'], u: 'דקה', f: true, w: 'ק"מ', unit: 'ק"מ', t: (p, a, d) => `החללית ממריאה. בסוף הדקה הראשונה היא בגובה ${a} ק"מ, ובכל דקה היא עולה עוד ${d} ק"מ.`, q: (p, o) => `באיזה גובה תהיה החללית בסוף הדקה ${o}?`, qi: (p, v) => `בסוף איזו דקה תהיה החללית בגובה ${v} ק"מ?` },
    { tags: ['tech'], u: 'שעה', f: true, w: 'צעצועים', t: (p, a, d) => `במפעל, רובוט הרכיב בשעה הראשונה ${a} צעצועים, ובכל שעה הוא מרכיב ${d} צעצועים יותר מבשעה הקודמת.`, q: (p, o) => `כמה צעצועים ירכיב הרובוט בשעה ${o}?`, qi: (p, v) => `באיזו שעה ירכיב הרובוט ${v} צעצועים?` },
    { tags: ['animals'], u: 'שבוע', w: 'ביצים', t: (p, a, d) => `בלול של ${p.name} נאספו בשבוע הראשון ${a} ביצים, ובכל שבוע נאספות ${d} ביצים יותר מבשבוע הקודם.`, q: (p, o) => `כמה ביצים ייאספו בשבוע ${o}?`, qi: (p, v) => `באיזה שבוע ייאספו ${v} ביצים?` },
  ];
  const TABLES = [
    { tags: ['kpop'], place: 'במפגש המעריצים של הלהקה' },
    { tags: ['magic'], place: 'באולם האוכל של בית הספר לקוסמים' },
    { tags: ['baking'], place: 'במסיבת העוגות' },
    { tags: ['games'], place: 'בטורניר משחקי הקופסה' },
    { tags: ['reading'], place: 'במועדון הקריאה' },
    { tags: [], place: 'בחדר האוכל' },
  ];
  // צורות לחוקיות: counts(n) = מספר הריבועים בשלב n
  const SHAPES = [
    { kind: 'L', f: (n) => 2 * n - 1, rule: (n) => `${m(`2 × ${n} − 1`)} (עמודה של ${n} ועוד ${n - 1} בצד)`, why: 'בכל שלב מוסיפים 2 ריבועים — אחד למעלה ואחד בצד.' },
    { kind: 'square', f: (n) => n * n, rule: (n) => m(`${n} × ${n}`), why: 'בכל שלב הצורה היא ריבוע: מספר השלב כפול עצמו.' },
    { kind: 'stairs', f: (n) => (n * (n + 1)) / 2, rule: (n) => m(HM.range(1, n).join(' + ')), why: 'בכל שלב מוסיפים עמודה גבוהה ב-1 מהקודמת.' },
    { kind: 'line', f: (n) => 2 * n + 1, rule: (n) => m(`2 × ${n} + 1`), why: 'בכל שלב מוסיפים 2 ריבועים.' },
  ];

  HM.lesson({
    id: 'n-patterns',
    learn: (c) => [
      {
        title: 'סדרה של צורות',
        html: `${c.name} ${c.g('בונה', 'בונה')} צורות L מריבועים.<br>בכל שלב ${b('מוסיפים 2 ריבועים')} — אחד למעלה ואחד בצד.<br>שלב 1: ריבוע אחד, שלב 2: 3, שלב 3: 5, שלב 4: 7...<br>כמה ריבועים יהיו בשלב 10? ${c.g('המשך', 'המשיכי')} לקרוא!`,
        visual: V.pattern([1, 3, 5, 7], 'L'),
      },
      {
        title: 'חוק לפי מספר השלב',
        html: `אפשר להוסיף 2 שוב ושוב — אבל עד שלב 10 זה ארוך!<br>${c.g('חפש', 'חפשי')} ${b('חוק')} שמקשר בין מספר השלב למספר הריבועים: בשלב 4 יש עמודה של 4 ועוד 3 בצד, כלומר ${m('2 × 4 − 1 = 7')}.<br>בשלב 10: ${m('2 × 10 − 1 = 19')}.`,
        visual: V.table(null, [['מספר השלב', '1', '2', '3', '4', '10'], ['מספר הריבועים', '1', '3', '5', '7', '?']], { rowHead: true }),
      },
      {
        title: 'סדרות של מספרים',
        html: `בסדרה מוסיפים, מחסרים או כופלים בכל צעד. למשל ${HM.seq([3, 6, 12, 24])} — כופלים ב-2.<br>${c.g('מצא', 'מצאי')} את המספר החסר: ${HM.seq([5, 9, null, 17, 21])}`,
        steps: [
          'ההפרש בין 5 ל-9 הוא 4, וגם בין 17 ל-21.',
          'החוק: מוסיפים 4 בכל צעד.',
          `${m('9 + 4 = 13')} ← המספר החסר הוא 13.`,
          `בדיקה: ${m('13 + 4 = 17')} ✔`,
        ],
      },
      {
        title: 'מספרים ריבועיים',
        html: `מסדרים ריבועים בצורת ריבוע: 1, 4, 9, 16, 25...<br>כל מספר כזה הוא מספר כפול עצמו: ${m('4 × 4 = 4<sup>2</sup> = 16')}.<br>${b('ומה מוסיפים?')} 3, 5, 7, 9 — המספרים האי-זוגיים! לכן ${m('1 + 3 + 5 + 7 = 16')}.`,
        visual: V.pattern([1, 4, 9, 16], 'square'),
      },
      {
        title: 'מספרים משולשים',
        html: `מסדרים ריבועים במדרגות: 1, 3, 6, 10, 15...<br>בכל שלב מוסיפים עמודה גבוהה יותר: ${m('+2, +3, +4, +5')}.<br>הקפיצה ${b('גדלה ב-1')} בכל פעם.`,
        visual: V.pattern([1, 3, 6, 10], 'stairs'),
        quiz: {
          type: 'number', answer: 21, prompt: `מהו המספר המשולש הבא? ${HM.seq([1, 3, 6, 10, 15, HM.slot(0)])}`,
          hint: 'הקפיצות הן 2, 3, 4, 5... מה הקפיצה הבאה?',
          solution: [`הקפיצה הבאה היא 6: ${m('15 + 6 = 21')}.`],
        },
      },
    ],
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const story = c.chance(0.4);
      const kinds = L1 ? (story ? ['growNext'] : ['nextArith', 'missing', 'shapeNext', 'ruleChoice'])
        : L2 ? (story ? ['growFar', 'tables'] : ['decreasing', 'multSeq', 'shapeFar', 'tableFar', 'special'])
        : (story ? ['growInverse', 'tablesInv'] : ['growDiff', 'oddSum', 'belongs', 'pickRule', 'special']);
      const kind = c.pick(kinds);
      const sl = HM.slot(0);
      const fill = `${c.g('השלם', 'השלימי')} את המספר החסר בסדרה:`;

      if (kind === 'nextArith' || kind === 'missing') {
        const a = c.rnd(1, 30), d = c.rnd(2, 10), n = 5, terms = HM.range(0, n - 1).map((i) => a + i * d);
        const pos = kind === 'nextArith' ? n - 1 : c.rnd(1, n - 2);
        return {
          type: 'number', answer: terms[pos],
          prompt: `${fill}<div class="big">${HM.seq(terms.map((x, i) => (i === pos ? sl : x)))}</div>`,
          hint: `${c.g('בדוק', 'בדקי')} בכמה גדל כל מספר לעומת המספר שלפניו.`,
          solution: [`החוק: מוסיפים ${d} בכל צעד.`, pos > 0 ? m(`${terms[pos - 1]} + ${d} = ${terms[pos]}`) : m(`${terms[1]} − ${d} = ${terms[0]}`), `התשובה: ${terms[pos]}.`],
        };
      }
      if (kind === 'shapeNext' || kind === 'shapeFar') {
        const sh = c.pick(SHAPES), shown = kind === 'shapeNext' ? c.pick([3, 4]) : 3;
        const target = kind === 'shapeNext' ? shown + 1 : c.pick([8, 10, 12]);
        const counts = HM.range(1, shown).map(sh.f);
        return {
          type: 'number', answer: sh.f(target),
          prompt: `כמה ריבועים יהיו בשלב ${target}?`,
          visual: V.pattern(counts, sh.kind),
          hint: `${sh.why} ${kind === 'shapeFar' ? c.g('חפש', 'חפשי') + ' חוק לפי מספר השלב.' : ''}`,
          solution: [`בשלבים הראשונים: ${counts.join(', ')}.`, sh.why, `בשלב ${target}: ${sh.rule(target)} = ${sh.f(target)}.`],
        };
      }
      if (kind === 'ruleChoice') {
        const mult = c.chance(0.35);
        if (mult) {
          const a = c.rnd(2, 5), terms = [a, a * 2, a * 4, a * 8];
          return {
            type: 'choice', choices: ['כופלים ב-2', `מוסיפים ${a}`, `מוסיפים ${a * 2}`, 'כופלים ב-3'], answer: 0,
            prompt: `מה החוק של הסדרה? ${HM.seq(terms)}`,
            hint: `${c.g('בדוק', 'בדקי')} את החוק על ${b('כל')} הצעדים, לא רק על הראשון.`,
            solution: [`${m(`${a} × 2 = ${a * 2}`)}, ${m(`${a * 2} × 2 = ${a * 4}`)}, ${m(`${a * 4} × 2 = ${a * 8}`)}`, 'החוק: כופלים ב-2. ("מוסיפים" מתאים רק לצעד אחד.)'],
          };
        }
        const a = c.rnd(1, 20), d = c.rnd(2, 9), terms = HM.range(0, 3).map((i) => a + i * d);
        return {
          type: 'choice', choices: [`מוסיפים ${d}`, `מוסיפים ${d + 1}`, `מחסרים ${d}`, `כופלים ב-${d}`], answer: 0,
          prompt: `מה החוק של הסדרה? ${HM.seq(terms)}`,
          hint: `${c.g('חשב', 'חשבי')} את ההפרש בין כל שני מספרים סמוכים.`,
          solution: [`${m(`${terms[1]} − ${terms[0]} = ${d}`)}, ${m(`${terms[2]} − ${terms[1]} = ${d}`)}`, `החוק: מוסיפים ${d}.`],
        };
      }
      if (kind === 'decreasing') {
        const d = c.rnd(3, 15), a = c.rnd(5 * d, 200), terms = HM.range(0, 4).map((i) => a - i * d), pos = c.rnd(1, 4);
        return {
          type: 'number', answer: terms[pos],
          prompt: `${fill}<div class="big">${HM.seq(terms.map((x, i) => (i === pos ? sl : x)))}</div>`,
          hint: `הסדרה יורדת. בכמה היא קטנה בכל צעד?`,
          solution: [`החוק: מחסרים ${d} בכל צעד.`, m(`${terms[pos - 1]} − ${d} = ${terms[pos]}`)],
        };
      }
      if (kind === 'multSeq') {
        const r = c.pick([2, 2, 3]), a = c.rnd(1, 5), terms = HM.range(0, 4).map((i) => a * Math.pow(r, i)), pos = c.pick([3, 4]);
        return {
          type: 'number', answer: terms[pos],
          prompt: `${fill}<div class="big">${HM.seq(terms.map((x, i) => (i === pos ? sl : fm(x))))}</div>`,
          hint: `${c.g('בדוק', 'בדקי')}: מוסיפים אותו מספר, או ${b('כופלים')} באותו מספר?`,
          solution: [`החוק: כופלים ב-${r} בכל צעד.`, m(`${fm(terms[pos - 1])} × ${r} = ${fm(terms[pos])}`)],
        };
      }
      if (kind === 'tableFar') {
        const a = c.rnd(2, 5), bb = c.rnd(0, 5), N = c.pick([10, 12, 15, 20]), f = (n) => a * n + bb;
        return {
          type: 'number', answer: f(N),
          prompt: `לפי החוקיות בטבלה, מה יהיה המספר בשלב ${N}?`,
          visual: V.table(null, [['שלב', '1', '2', '3', '4', String(N)], ['מספר', String(f(1)), String(f(2)), String(f(3)), String(f(4)), '?']], { rowHead: true }),
          hint: `בכל שלב המספר גדל ב-${a}. ${c.g('נסה', 'נסי')} חוק כמו "מספר השלב × ${a} ועוד משהו".`,
          solution: [`החוק: ${bb ? `מספר השלב × ${a} + ${bb}` : `מספר השלב × ${a}`}.`, `בדיקה בשלב 1: ${m(`1 × ${a}${bb ? ' + ' + bb : ''} = ${f(1)}`)} ✔`, `בשלב ${N}: ${m(`${N} × ${a}${bb ? ' + ' + bb : ''} = ${f(N)}`)}`],
        };
      }
      if (kind === 'special') {
        const t = c.pick(['sq', 'tri']);
        if (L2) {
          const n = c.rnd(5, 7), f = t === 'sq' ? (k) => k * k : (k) => (k * (k + 1)) / 2;
          const terms = HM.range(1, n).map(f);
          return {
            type: 'number', answer: f(n + 1),
            prompt: `${c.g('השלם', 'השלימי')} את המספר הבא בסדרה:<div class="big">${HM.seq(terms.concat([sl]))}</div>`,
            hint: t === 'sq' ? 'אלה מספרים ריבועיים: 1 × 1, 2 × 2, 3 × 3...' : `${c.g('הסתכל', 'הסתכלי')} על הקפיצות: הן גדלות ב-1 כל פעם.`,
            solution: t === 'sq' ? [`אלה המספרים הריבועיים. הבא: ${m(`${n + 1} × ${n + 1} = ${f(n + 1)}`)}`] : [`הקפיצה האחרונה הייתה ${n}, הבאה ${n + 1}.`, m(`${f(n)} + ${n + 1} = ${f(n + 1)}`)],
          };
        }
        const n = t === 'sq' ? c.rnd(11, 15) : c.rnd(8, 12), v = t === 'sq' ? n * n : (n * (n + 1)) / 2;
        return {
          type: 'number', answer: v,
          prompt: t === 'sq' ? `מהו המספר הריבועי ה-${n}? ${HM.seq([1, 4, 9, 16, '...'])}` : `מהו המספר המשולש ה-${n}? ${HM.seq([1, 3, 6, 10, '...'])}`,
          hint: t === 'sq' ? `המספר הריבועי ה-${n} הוא ${m(`${n} × ${n}`)}.` : `המספר המשולש ה-${n} הוא ${m(`1 + 2 + 3 + … + ${n}`)}.`,
          solution: t === 'sq' ? [m(`${n} × ${n} = ${n * n}`)] : [m(`1 + 2 + 3 + … + ${n} = ${v}`), `טיפ: ${m(`${n} × ${n + 1} : 2 = ${v}`)}`],
        };
      }
      if (kind === 'growDiff') {
        const a = c.rnd(1, 20), s0 = c.rnd(1, 3), step = c.pick([1, 2]), terms = [a];
        for (let i = 0; i < 5; i++) terms.push(terms[i] + s0 + i * step);
        return {
          type: 'number', answer: terms[5],
          prompt: `${c.g('השלם', 'השלימי')} את המספר הבא בסדרה:<div class="big">${HM.seq(terms.slice(0, 5).concat([sl]))}</div>`,
          hint: `${c.g('כתוב', 'כתבי')} את הקפיצות בין המספרים. מה קורה לקפיצות?`,
          solution: [`הקפיצות: ${HM.range(0, 3).map((i) => s0 + i * step).join(', ')} — כל קפיצה גדולה ב-${step} מהקודמת.`, `הקפיצה הבאה: ${s0 + 4 * step}.`, m(`${terms[4]} + ${s0 + 4 * step} = ${terms[5]}`)],
        };
      }
      if (kind === 'oddSum') {
        const k = c.rnd(5, 12), last = 2 * k - 1;
        return {
          type: 'number', answer: k * k,
          prompt: `${c.g('חשב', 'חשבי')} בדרך קצרה:<div class="big">${m(`1 + 3 + 5 + … + ${last} = ${sl}`)}</div>`,
          hint: `סכום של המספרים האי-זוגיים הראשונים הוא מספר ריבועי. ${c.g('ספור', 'ספרי')} כמה מחוברים יש.`,
          solution: [`מ-1 עד ${last} יש ${k} מספרים אי-זוגיים.`, `הסכום של ${k} האי-זוגיים הראשונים: ${m(`${k} × ${k} = ${k * k}`)}`],
        };
      }
      if (kind === 'belongs') {
        const a = c.rnd(1, 9), d = c.rnd(3, 9), j = c.rnd(15, 40), inS = c.chance(0.5);
        const N = a + j * d + (inS ? 0 : c.rnd(1, d - 1));
        const lastBelow = a + Math.floor((N - a) / d) * d;
        return {
          type: 'tf', answer: inS,
          prompt: `${b('נכון או לא נכון?')} המספר ${N} נמצא בסדרה ${HM.seq([a, a + d, a + 2 * d, a + 3 * d, '...'])}`,
          hint: `כל מספר בסדרה הוא ${a} ועוד כמה פעמים ${d}. ${c.g('בדוק', 'בדקי')}: האם ${m(`${N} − ${a}`)} מתחלק ב-${d}?`,
          solution: [m(`${N} − ${a} = ${N - a}`), (N - a) % d === 0 ? `${m(`${N - a} : ${d} = ${(N - a) / d}`)} — בלי שארית, לכן ${N} בסדרה. נכון.` : `${N - a} לא מתחלק ב-${d} (הקרוב בסדרה: ${lastBelow}). לא נכון.`],
        };
      }
      if (kind === 'pickRule') {
        const a = c.rnd(2, 5), bb = c.rnd(1, 6), f = (n) => a * n + bb, shown = [1, 2, 3, 4];
        const txt = (k, q) => (q ? `מספר השלב × ${k} + ${q}` : `מספר השלב × ${k}`);
        const cands = [
          { t: txt(a, bb), f },
          { t: txt(a + bb), f: (n) => (a + bb) * n },
          { t: `מספר השלב + ${a + bb - 1}`, f: (n) => n + a + bb - 1 },
          { t: txt(a, bb + 1), f: (n) => a * n + bb + 1 },
          { t: txt(a + 1, bb - 1), f: (n) => (a + 1) * n + bb - 1 },
        ];
        const ok = [cands[0]];
        cands.slice(1).forEach((x) => { if (ok.length < 4 && !shown.every((n) => x.f(n) === f(n)) && ok.every((y) => y.t !== x.t)) ok.push(x); });
        return {
          type: 'choice', choices: ok.map((x) => x.t), answer: 0,
          prompt: 'איזה חוק מתאים לכל הטבלה?',
          visual: V.table(null, [['מספר השלב', '1', '2', '3', '4'], ['המספר', String(f(1)), String(f(2)), String(f(3)), String(f(4))]], { rowHead: true }),
          hint: `${c.g('בדוק', 'בדקי')} כל חוק על ${b('כל')} העמודות, לא רק על הראשונה.`,
          solution: [`בכל שלב המספר גדל ב-${a}, ולכן כופלים את מספר השלב ב-${a}.`, `שלב 1: ${m(`1 × ${a} + ${bb} = ${f(1)}`)} ✔, שלב 4: ${m(`4 × ${a} + ${bb} = ${f(4)}`)} ✔`, `החוק: ${cands[0].t}.`],
        };
      }
      if (kind === 'growNext' || kind === 'growFar' || kind === 'growInverse') {
        const sc = c.scene(GROW), p = P(c);
        const small = sc.tags[0] === 'animals' || sc.tags[0] === 'space';
        const a = small ? c.rnd(2, 8) : c.rnd(5, 30), d = small ? c.rnd(2, 5) : c.rnd(2, 9);
        const n = kind === 'growNext' ? c.pick([4, 5]) : kind === 'growFar' ? c.rnd(8, 12) : c.rnd(9, 20);
        const v = a + (n - 1) * d, U = sc.unit ? ' ' + sc.unit : '';
        const first = `מה${sc.u} ${sc.f ? 'הראשונה' : 'הראשון'}`;
        const vis = kind === 'growNext' ? V.table(null, [[sc.u, '1', '2', '3', String(n)], [sc.w, String(a), String(a + d), String(a + 2 * d), '?']], { rowHead: true }) : undefined;
        const q = kind === 'growInverse' ? sc.qi(p, v) : sc.q(p, ordn(n, sc.f));
        const sol = kind === 'growInverse'
          ? [`${first} עד ${v}: ${m(`${v} − ${a} = ${v - a}`)}`, `${m(`${v - a} : ${d} = ${n - 1}`)} קפיצות של ${d}.`, `${m(`1 + ${n - 1} = ${n}`)} — התשובה: ${n}.`]
          : n - 1 <= 4 ? [`בכל ${sc.u} מוסיפים ${d}: ${HM.range(0, n - 1).map((i) => a + i * d).join(', ')}.`, `התשובה: ${v}${U}.`]
          : [`${first} עד ה${sc.u} ה-${n} יש ${n - 1} קפיצות של ${d}.`, m(`${a} + ${n - 1} × ${d} = ${a} + ${(n - 1) * d} = ${v}`), `התשובה: ${v}${U}.`];
        return {
          type: 'number', answer: kind === 'growInverse' ? n : v,
          unit: kind === 'growInverse' ? undefined : sc.unit,
          prompt: `${sc.t(p, a, d)}<br>${q}`,
          visual: vis,
          hint: kind === 'growInverse' ? `${c.g('חשב', 'חשבי')} כמה צריך להוסיף מ-${a} עד ${v}, וכמה קפיצות של ${d} זה.` : kind === 'growFar' ? `${first} עד ה${sc.u} ה-${n} יש ${n - 1} קפיצות של ${d}.` : `בכל ${sc.u} מוסיפים ${d}.`,
          solution: sol,
        };
      }
      // tables / tablesInv: שולחנות וכיסאות
      const sc = c.scene(TABLES), f = (n) => 2 * n + 2;
      const intro = `${sc.place} מסדרים שולחנות מרובעים בשורה ארוכה, ומסביבם כיסאות: ליד שולחן אחד 4 כיסאות, ליד 2 שולחנות 6 כיסאות, וליד 3 שולחנות 8 כיסאות.`;
      const vis = V.table(null, [['שולחנות', '1', '2', '3', '4'], ['כיסאות', '4', '6', '8', '?']], { rowHead: true });
      if (kind === 'tables') {
        const n = c.rnd(8, 15);
        return {
          type: 'number', answer: f(n),
          prompt: `${intro}<br>כמה כיסאות יהיו ליד ${n} שולחנות?`, visual: vis,
          hint: `לכל שולחן יש 2 כיסאות בצדדים הארוכים, ועוד 2 כיסאות בקצוות של כל השורה.`,
          solution: ['החוק: מספר השולחנות × 2 + 2.', m(`${n} × 2 + 2 = ${f(n)}`), `התשובה: ${f(n)} כיסאות.`],
        };
      }
      const n = c.rnd(8, 25), v = f(n);
      return {
        type: 'number', answer: n,
        prompt: `${intro}<br>כמה שולחנות צריך כדי שיהיו בדיוק ${v} כיסאות?`, visual: vis,
        hint: `החוק הוא "מספר השולחנות × 2 + 2". ${c.g('חשוב', 'חשבי')} הפוך: קודם ${c.g('הורד', 'הורידי')} 2, ואחר כך ${c.g('חלק', 'חלקי')} ב-2.`,
        solution: [`2 כיסאות בקצוות: ${m(`${v} − 2 = ${v - 2}`)}`, `2 כיסאות לכל שולחן: ${m(`${v - 2} : 2 = ${n}`)}`, `בדיקה: ${m(`${n} × 2 + 2 = ${v}`)} ✔`],
      };
    },
  });

  /* ========== השיטה הרומית ========== */
  const RN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const RA = [[1000, 'M'], [500, 'D'], [100, 'C'], [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I']];
  const toR = (n, tbl) => { let s0 = ''; (tbl || RN).forEach(([v, r]) => { while (n >= v) { s0 += r; n -= v; } }); return s0; };
  const RV = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const fromR = (s0) => { let t = 0; for (let i = 0; i < s0.length; i++) { const v = RV[s0[i]], nx = RV[s0[i + 1]] || 0; t += v < nx ? -v : v; } return t; };
  // חלקים לפי ערך המקום: 1994 -> [[1000,'M'],[900,'CM'],[90,'XC'],[4,'IV']]
  const rParts = (n) => String(n).split('').reverse().map((d, i) => +d * Math.pow(10, i)).filter((v) => v).reverse().map((v) => [v, toR(v)]);
  const has49 = (n) => /[49]/.test(String(n));
  // תשובות שגויות טיפוסיות לכתיבת n
  function romanWrongs(n) {
    const R = toR(n), out = [];
    const add = (x) => { if (x && x !== R && out.indexOf(x) < 0) out.push(x); };
    add(toR(n, RA)); // בלי כלל החיסור: IIII, VIIII, XXXX
    add(R.replace(/IV|IX|XL|XC|CD|CM/, (p) => p[1] + p[0])); // היפוך זוג: IV -> VI
    add(R.replace('XCIX', 'IC').replace('XLIX', 'IL').replace('CMXC', 'XM').replace('CDXC', 'XD').replace('XLV', 'VL').replace('XCV', 'VC'));
    [1, -1, 10, -10, 5].forEach((dd) => { if (n + dd > 0 && n + dd < 4000) add(toR(n + dd)); });
    const parts = rParts(n);
    if (parts.length > 1) add(parts.slice().reverse().map((x) => x[1]).join('')); // סדר הפוך של החלקים
    return out;
  }
  const partsSol = (n) => {
    const ps = rParts(n);
    return [`מפרקים לפי ערך המקום: ${m(`${fm(n)} = ${ps.map((x) => fm(x[0])).join(' + ')}`)}`, ps.map((x) => `${fm(x[0])} ← ${m(x[1])}`).join(', '), `מחברים את החלקים: ${m(toR(n))}`];
  };
  const readSol = (n) => {
    const ps = rParts(n);
    if (ps.length === 1) return [m(`${ps[0][1]} = ${fm(n)}`), `התשובה: ${fm(n)}.`];
    return [`מפרקים לחלקים: ${m(ps.map((x) => x[1]).join(' + '))}`, m(`${ps.map((x) => fm(x[0])).join(' + ')} = ${fm(n)}`), `התשובה: ${fm(n)}.`];
  };
  function romanClock(h) {
    const C = 100;
    let s = S.circle(C, C, 90, { cls: 'f-w s-ink', sw: 4 }) + S.circle(C, C, 83, { fill: 'none', cls: 's-soft', sw: 1 });
    for (let k = 1; k <= 12; k++) {
      const a = ((-90 + k * 30) * Math.PI) / 180;
      s += S.text(C + 68 * Math.cos(a), C + 68 * Math.sin(a) + 1, toR(k), { fs: 14, fw: 700 });
    }
    if (h) { const a = ((-90 + h * 30) * Math.PI) / 180; s += S.line(C, C, C + 42 * Math.cos(a), C + 42 * Math.sin(a), { cls: 's-a', sw: 6, 'stroke-linecap': 'round' }); }
    s += S.line(C, C, C, C - 60, { cls: 's-ink', sw: 3, 'stroke-linecap': 'round' }) + S.circle(C, C, 5, { cls: 'f-ink' });
    return S.svg(200, 200, s, { label: 'שעון עם ספרות רומיות', maxw: 200 });
  }
  /* מספרים רומיים בסיפורים: [min,max] טווח הגיוני */
  const ROM = [
    { tags: ['sport'], r: [1, 99], t: (c, R) => `על החולצה של שחקן הכדורסל מודפס המספר ${R}.` },
    { tags: ['animals'], r: [1, 99], t: (c, R) => `בגן החיות, על השלט של כלוב הקופים כתוב ${R}.` },
    { tags: ['space'], r: [1, 399], t: (c, R) => `על החללית החדשה כתוב בגדול ${R}.` },
    { tags: ['music'], r: [1, 399], t: (c, R) => `${c.name} ${c.g('לומד', 'לומדת')} לנגן את שיר מספר ${R} בספר השירים.` },
    { tags: ['baking'], r: [1, 99], t: (c, R) => `על עוגת יום ההולדת כתבו בקצפת ${R}.` },
    { tags: ['games'], r: [1, 399], t: (c, R) => `${c.name} ${c.g('הגיע', 'הגיעה')} לשלב ${R} במשחק.` },
    { tags: ['art'], r: [1, 399], t: (c, R) => `ליד כל ציור בתערוכה יש מספר רומי. ליד הציור האהוב על ${c.name} כתוב ${R}.` },
    { tags: ['nature'], r: [1, 60], t: (c, R) => `בשביל הטיול, על השלט של התחנה כתוב ${R}.` },
    { tags: ['reading'], r: [1, 150], t: (c, R) => { const f = c.friend(); return `בספר ההרפתקאות של ${f.name}, הפרק האהוב ${f.g('עליו', 'עליה')} הוא פרק ${R}.`; } },
    { tags: ['tech'], r: [1, 399], t: (c, R) => `לרובוט החדש בחוג הרובוטיקה קוראים "רובו ${R}".` },
    { tags: ['kpop'], r: [1, 99], t: (c, R) => `על הפוטוקארד החדש של ${c.name} כתוב המספר ${R}.` },
    { tags: ['magic'], r: [1, 399], t: (c, R) => `בבית הספר לקוסמים, ${c.name} ${c.g('צריך', 'צריכה')} להגיע לכיתה מספר ${R}.` },
    { tags: ['squishy'], r: [1, 99], t: (c, R) => `על הקופסה של הסקווישי החדש כתוב המספר ${R}.` },
  ];
  const YEARS = [
    { tags: ['art'], t: (R) => `על הפסל בכיכר העיר חקוקה השנה ${R}.` },
    { tags: ['nature'], t: (R) => `על אבן עתיקה בשביל הטיול חקוקה השנה ${R}.` },
    { tags: ['reading'], t: (R) => `בעמוד הראשון של ספר ישן כתובה השנה ${R}.` },
    { tags: ['tech', 'games'], t: (R) => `בסוף הסרט על הרובוטים מופיעה השנה ${R}.` },
    { tags: ['sport'], t: (R) => `על גביע ישן בחדר הספורט חקוקה השנה ${R}.` },
    { tags: ['magic'], t: (R) => `על השער של בית הספר לקוסמים חקוקה השנה ${R}.` },
    { tags: ['music', 'kpop'], t: (R) => `על התקליט הישן של סבא כתובה השנה ${R}.` },
    { tags: [], t: (R) => `על בניין ישן חקוקה השנה ${R}.` },
  ];
  const WRITE = [
    { tags: ['art'], r: [1, 399], o: (p) => `הציור ${p.g('שלו', 'שלה')} בתערוכה` },
    { tags: ['magic'], r: [1, 399], o: () => 'דלת הכיתה בבית הספר לקוסמים' },
    { tags: ['sport'], r: [1, 99], o: () => 'החולצה החדשה' },
    { tags: ['tech'], r: [1, 399], o: (p) => `הרובוט ש${p.g('בנה', 'בנתה')}` },
    { tags: ['squishy', 'kpop'], r: [1, 99], o: () => 'קופסת האוסף' },
    { tags: ['baking'], r: [1, 99], o: () => 'עוגת יום ההולדת' },
    { tags: [], r: [1, 399], o: () => 'דלת החדר במלון' },
  ];
  const YWRITE = [
    { tags: ['sport'], o: () => 'הגביע של הקבוצה' },
    { tags: ['magic'], o: () => 'השער של בית הספר לקוסמים' },
    { tags: ['art'], o: (p) => `הפסל ש${p.g('יצר', 'יצרה')}` },
    { tags: ['reading'], o: (p) => `הכריכה של הספר ש${p.g('כתב', 'כתבה')}` },
    { tags: ['tech'], o: (p) => `הרובוט ש${p.g('בנה', 'בנתה')}` },
    { tags: ['kpop', 'music'], o: () => 'הכרזה של ההופעה' },
    { tags: [], o: () => 'השלט של הגינה הקהילתית' },
  ];
  const SPAN = [
    { tags: ['reading'], t: (R1, R2) => `הספר הראשון בסדרה יצא בשנת ${R1}, והספר האחרון יצא בשנת ${R2}.` },
    { tags: ['games'], t: (R1, R2) => `המשחק הראשון בסדרה יצא בשנת ${R1}, והמשחק החדש יצא בשנת ${R2}.` },
    { tags: ['kpop', 'music'], t: (R1, R2) => `הלהקה הוקמה בשנת ${R1}, והאלבום החדש שלה יצא בשנת ${R2}.` },
    { tags: ['sport'], t: (R1, R2) => `המועדון נוסד בשנת ${R1}, וזכה באליפות בשנת ${R2}.` },
    { tags: ['magic'], t: (R1, R2) => `בית הספר לקוסמים נוסד בשנת ${R1}, והספרייה שלו נבנתה בשנת ${R2}.` },
  ];

  HM.lesson({
    id: 'n-roman',
    learn: (c) => [
      {
        title: 'מספרים על השעון',
        html: `${c.name}, ראית פעם שעון כזה? אלה ${b('ספרות רומיות')} — שיטה שהמציאו ברומא לפני יותר מ-2,000 שנה.<br>עד היום רואים אותן בשעונים, במספרי פרקים בספרים ובשמות של מלכים.`,
        visual: romanClock(3),
      },
      {
        title: 'שבעה סמלים',
        html: `בשיטה הרומית יש רק ${b('7 סמלים')}.<br>טיפ לזכירה: ${m('I, X, C, M')} הם 1, 10, 100, 1,000, ו-${m('V, L, D')} הם ה"חצאים": 5, 50, 500.`,
        visual: V.table(['סמל', 'I', 'V', 'X', 'L', 'C', 'D', 'M'], [['ערך', '1', '5', '10', '50', '100', '500', '1,000']], { rowHead: true }),
      },
      {
        title: 'כלל החיבור',
        html: `כותבים מהגדול לקטן, ו${b('מחברים')} את הערכים:<br>${m('XVI = 10 + 5 + 1 = 16')}<br>${m('CLXII = 100 + 50 + 10 + 1 + 1 = 162')}<br>סמל יכול לחזור ${b('עד 3 פעמים')} ברצף: ${m('III = 3')}, ${m('XXX = 30')}. את ${m('V, L, D')} לא כותבים פעמיים.`,
      },
      {
        title: 'כלל החיסור',
        html: `כשסמל ${b('קטן')} כתוב ${b('לפני')} סמל גדול — ${b('מחסרים')} אותו: ${m('IV = 5 − 1 = 4')}.<br>• ${m('I')} רק לפני ${m('V')} או ${m('X')}.<br>• ${m('X')} רק לפני ${m('L')} או ${m('C')}.<br>• ${m('C')} רק לפני ${m('D')} או ${m('M')}.`,
        visual: V.table(['4', '9', '40', '90', '400', '900'], [['IV', 'IX', 'XL', 'XC', 'CD', 'CM']]),
      },
      {
        title: 'דוגמה: 1,994',
        html: 'ממספר רגיל לרומי — מפרקים לפי ערך המקום. ומרומי לרגיל — מפרקים לחלקים ומחברים.',
        steps: [
          `מפרקים: ${m('1,994 = 1,000 + 900 + 90 + 4')}`,
          `${m('1,000')} ← ${m('M')}, ${m('900')} ← ${m('CM')}, ${m('90')} ← ${m('XC')}, ${m('4')} ← ${m('IV')}`,
          `מחברים את החלקים: ${m('MCMXCIV')}`,
          `ובכיוון ההפוך: ${m('XLVII')} ← ${m('XL + V + II = 40 + 5 + 2 = 47')}`,
        ],
      },
      {
        title: 'המגבלות של השיטה',
        html: `• ${b('אין אפס')} — ואין סמל ל"כלום".<br>• ${b('אין ערך מקום')}: X הוא תמיד 10, בכל מקום (חוץ מכלל החיסור).<br>• מספרים ארוכים: ${m('388 = CCCLXXXVIII')} — 11 סמלים!<br>• קשה מאוד לחשב: ${c.g('נסה', 'נסי')} לכפול ${m('XLVII × XIX')}…<br>• עם 7 הסמלים מגיעים רק עד ${m('3,999 = MMMCMXCIX')}.`,
        quiz: {
          type: 'tf', answer: false, prompt: `${b('נכון או לא נכון?')} בשיטה הרומית אפשר לכתוב את המספר 0.`,
          hint: 'האם יש סמל ל"כלום"?',
          solution: ['בשיטה הרומית אין סמל לאפס. לכן הטענה לא נכונה.'],
        },
      },
    ],
    gen: (c, level) => {
      const L1 = level === 1, L2 = level === 2;
      const story = c.chance(0.4);
      const kinds = L1 ? (story ? ['readStory', 'clock'] : ['symbol', 'read', 'write', 'tfRule'])
        : L2 ? (story ? ['readStory', 'writeStory'] : ['read', 'write', 'compare', 'order'])
        : (story ? ['year', 'yearWrite', 'span'] : ['read', 'write', 'invalid', 'limits', 'count', 'arith']);
      const kind = c.pick(kinds);
      const lo2 = L1 ? 1 : L2 ? 40 : 400, hi2 = L1 ? 39 : L2 ? 399 : 3999;
      const pickN = (a, z) => (c.chance(0.65) ? numWith(c, a, z, has49) : c.rnd(a, z));
      const readQ = (n, pre) => ({
        type: 'number', answer: n,
        prompt: `${pre || ''}${pre ? '<br>' : ''}איזה מספר זה בשיטה העשרונית?${pre ? '' : `<div class="big">${m(toR(n))}</div>`}`,
        hint: `${c.g('פרק', 'פרקי')} את המספר לחלקים משמאל לימין, ו${c.g('שים', 'שימי')} לב לזוגות כמו ${m('IV')}, ${m('IX')}, ${m('XL')}.`,
        solution: readSol(n),
      });
      const writeQ = (n, pre) => {
        const R = toR(n), w = romanWrongs(n);
        return {
          type: 'choice', choices: [R].concat(w.slice(0, 3)).map(m), answer: 0,
          prompt: pre || `איך כותבים את ${fm(n)} בשיטה הרומית?`,
          hint: `${c.g('פרק', 'פרקי')} את ${fm(n)} לפי ערך המקום, ו${c.g('כתוב', 'כתבי')} כל חלק בנפרד. ${c.g('זכור', 'זכרי')}: סמל לא חוזר יותר מ-3 פעמים.`,
          solution: partsSol(n),
        };
      };

      if (kind === 'symbol') {
        const sym = c.pick(['I', 'V', 'X', 'L', 'C', 'L', 'C', 'D', 'M']);
        return {
          type: 'number', answer: RV[sym],
          prompt: `מה הערך של הסמל הרומי ${m(sym)}?`,
          hint: `${m('I, X, C, M')} הם 1, 10, 100, 1,000, ו-${m('V, L, D')} הם ה"חצאים" ביניהם.`,
          solution: [`${m(sym)} = ${fm(RV[sym])}`],
        };
      }
      if (kind === 'read') return readQ(L1 ? pickN(1, 39) : L2 ? pickN(40, 399) : pickN(400, 3999));
      if (kind === 'write') return writeQ(L1 ? pickN(4, 39) : L2 ? pickN(40, 399) : pickN(400, 3999));
      if (kind === 'readStory') {
        const sc = c.scene(ROM.filter((x) => x.r[1] >= lo2)), n = pickN(Math.max(lo2, sc.r[0]), Math.min(hi2, sc.r[1]));
        return readQ(n, sc.t(c, m(toR(n))));
      }
      if (kind === 'clock') {
        const p = P(c), h = c.rnd(1, 11);
        return {
          type: 'number', answer: h,
          prompt: `${p.name} ${p.g('הסתכל', 'הסתכלה')} על השעון העתיק בבית של סבתא. השעה עגולה, והמחוג הקצר מצביע על ${m(toR(h))}.<br>מה השעה?`,
          visual: romanClock(h),
          hint: `${c.g('תרגם', 'תרגמי')} את ${m(toR(h))} למספר רגיל.`,
          solution: readSol(h),
        };
      }
      if (kind === 'tfRule') {
        const pool = [
          [`${m('IIII')} היא הדרך הנכונה לכתוב 4.`, false, `כותבים ${m('IV')}: סמל לא חוזר 4 פעמים.`],
          [`${m('IV')} ו-${m('VI')} הם אותו מספר.`, false, `${m('IV = 4')}, אבל ${m('VI = 6')}. המקום של ${m('I')} משנה!`],
          [`${m('VV')} הוא 10.`, false, `את ${m('V')} לא כותבים פעמיים. 10 הוא ${m('X')}.`],
          [`${m('XL')} הוא 40.`, true, `${m('XL = 50 − 10 = 40')}`],
        ];
        const n = pickN(4, 39), R = toR(n), sw = R.replace(/IV|IX/, (p0) => p0[1] + p0[0]);
        const claimV = c.chance(0.5) ? n : sw !== R ? fromR(sw) : n + c.pick([1, -1, 10]);
        const dyn = [`${m(`${R} = ${claimV}`)}`, claimV === n, `${m(`${R} = ${rParts(n).map((x) => x[1]).join(' + ')} = ${n}`)}`];
        const [st, ans, ex] = c.chance(0.4) ? c.pick(pool) : dyn;
        return {
          type: 'tf', answer: ans,
          prompt: `${b('נכון או לא נכון?')} ${st}`,
          hint: `${c.g('זכור', 'זכרי')}: סמל קטן לפני גדול — מחסרים. סמל קטן אחרי גדול — מחברים.`,
          solution: [ex, ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
        };
      }
      if (kind === 'writeStory' || kind === 'yearWrite') {
        const year = kind === 'yearWrite', sc = c.scene(year ? YWRITE : WRITE.filter((x) => x.r[1] >= 40)), p = P(c);
        const n = year ? c.rnd(1900, 2030) : pickN(40, sc.r[1]);
        return writeQ(n, `${p.name} ${p.g('רוצה', 'רוצה')} לכתוב בספרות רומיות על ${sc.o(p)} את ${year ? 'השנה' : 'המספר'} ${year ? n : fm(n)}.<br>מה ${p.g('הוא צריך', 'היא צריכה')} לכתוב?`);
      }
      if (kind === 'compare') {
        const n1 = pickN(40, 399), R1 = toR(n1), sw = R1.replace(/IV|IX|XL|XC|CD|CM/, (p0) => p0[1] + p0[0]);
        let n2 = sw !== R1 && toR(fromR(sw)) === sw && c.chance(0.6) ? fromR(sw) : n1 + c.pick([-11, -9, -1, 1, 9, 11, 40]);
        if (n2 < 1 || n2 === n1) n2 = n1 + 10;
        const R2 = toR(n2);
        return {
          type: 'compare', left: m(R1), right: m(R2), lv: n1, rv: n2, answer: n1 < n2 ? '<' : '>',
          prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
          hint: `${c.g('תרגם', 'תרגמי')} כל צד למספר רגיל. ${c.g('שים', 'שימי')} לב לסמלים שמחסרים!`,
          solution: [m(`${R1} = ${n1}`), m(`${R2} = ${n2}`), m(`${R1} ${n1 < n2 ? '&lt;' : '&gt;'} ${R2}`)],
        };
      }
      if (kind === 'order') {
        const base = pickN(40, 360), vals = [base];
        const sw = toR(base).replace(/IV|IX|XL|XC|CD|CM/, (p0) => p0[1] + p0[0]);
        if (sw !== toR(base) && toR(fromR(sw)) === sw && vals.indexOf(fromR(sw)) < 0) vals.push(fromR(sw));
        while (vals.length < 4) { const v = c.rnd(Math.max(10, base - 60), base + 60); if (vals.indexOf(v) < 0) vals.push(v); }
        const sorted = vals.map((x, i) => i).sort((i, j) => vals[i] - vals[j]);
        return {
          type: 'order', items: vals.map((x) => m(toR(x))), answer: sorted,
          prompt: `${c.g('סדר', 'סדרי')} את המספרים הרומיים ${b('מהקטן לגדול')}:`,
          hint: `${c.g('תרגם', 'תרגמי')} כל מספר רומי למספר רגיל, ואז ${c.g('סדר', 'סדרי')}.`,
          solution: [sorted.map((i) => m(`${toR(vals[i])} = ${vals[i]}`)).join(' , ')],
        };
      }
      if (kind === 'year') {
        const sc = c.scene(YEARS), y = c.rnd(1500, 2030);
        const q = readQ(y, sc.t(m(toR(y))));
        q.prompt = q.prompt.replace('איזה מספר זה בשיטה העשרונית?', 'באיזו שנה מדובר? ' + c.g('כתוב', 'כתבי') + ' אותה במספר רגיל.');
        return q;
      }
      if (kind === 'span') {
        const sc = c.scene(SPAN), y1 = c.rnd(1900, 1999), y2 = c.rnd(2000, 2026);
        return {
          type: 'number', answer: y2 - y1,
          prompt: `${sc.t(m(toR(y1)), m(toR(y2)))}<br>כמה שנים עברו בין שתי השנים?`,
          hint: `קודם ${c.g('תרגם', 'תרגמי')} את שתי השנים למספרים רגילים, ואחר כך ${c.g('חסר', 'חסרי')}.`,
          solution: [m(`${toR(y1)} = ${fm(y1)}`), m(`${toR(y2)} = ${fm(y2)}`), m(`${fm(y2)} − ${fm(y1)} = ${y2 - y1}`)],
        };
      }
      if (kind === 'invalid') {
        const BAD = [['IIII', `${m('I')} חוזר 4 פעמים. 4 כותבים ${m('IV')}.`], ['VV', `את ${m('V')} לא כותבים פעמיים. 10 הוא ${m('X')}.`], ['IC', `${m('I')} נכתב רק לפני ${m('V')} או ${m('X')}. 99 הוא ${m('XCIX')}.`], ['IL', `${m('I')} נכתב רק לפני ${m('V')} או ${m('X')}. 49 הוא ${m('XLIX')}.`], ['VX', `את ${m('V')} לא מחסרים.`], ['XXXX', `${m('X')} חוזר 4 פעמים. 40 כותבים ${m('XL')}.`], ['LL', `את ${m('L')} לא כותבים פעמיים. 100 הוא ${m('C')}.`], ['IM', `${m('I')} לא נכתב לפני ${m('M')}. 999 הוא ${m('CMXCIX')}.`], ['DD', `את ${m('D')} לא כותבים פעמיים. 1,000 הוא ${m('M')}.`], ['CCCC', `${m('C')} חוזר 4 פעמים. 400 כותבים ${m('CD')}.`], ['XM', `${m('X')} נכתב רק לפני ${m('L')} או ${m('C')}. 990 הוא ${m('CMXC')}.`], ['VL', `את ${m('V')} לא מחסרים. 45 הוא ${m('XLV')}.`]];
        const [bad, why0] = c.pick(BAD);
        const ok = [];
        while (ok.length < 3) { const v = toR(pickN(40, 2500)); if (ok.indexOf(v) < 0) ok.push(v); }
        return {
          type: 'choice', choices: [bad].concat(ok).map(m), answer: 0,
          prompt: `איזה מהם ${b('אינו')} מספר רומי תקין?`,
          hint: `${c.g('בדוק', 'בדקי')}: האם סמל חוזר יותר מ-3 פעמים? האם V, L או D חוזרים? האם החיסור מותר?`,
          solution: [`${m(bad)} אינו תקין: ${why0}`, `השאר תקינים: ${ok.map((x) => m(`${x} = ${fm(fromR(x))}`)).join(', ')}.`],
        };
      }
      if (kind === 'limits') {
        const n = numWith(c, 100, 3999, (x) => toR(x).length >= 7);
        const L0 = [
          ['בשיטה הרומית יש סמל לאפס.', false, 'אין בשיטה הרומית סמל לאפס.'],
          [`בשיטה הרומית הסמל ${m('V')} יכול לחזור פעמיים ברצף.`, false, `את ${m('V')}, ${m('L')} ו-${m('D')} לא כותבים פעמיים — יש לזה סמל אחר (${m('X')}, ${m('C')}, ${m('M')}).`],
          ['בשיטה הרומית, סמל יכול לחזור לכל היותר 3 פעמים ברצף.', true, `לכן 4 כותבים ${m('IV')} ולא ${m('IIII')}.`],
          ['בשיטה הרומית, ערך הסמל תלוי במקום שלו, כמו הספרה 3 ב-30 וב-300.', false, `${m('X')} הוא תמיד 10. אין בשיטה הרומית ערך מקום.`],
          [`כדי לכתוב 38 בשיטה הרומית צריך יותר סמלים מאשר בשיטה העשרונית.`, true, `${m('38 = XXXVIII')} — 7 סמלים, ובשיטה העשרונית רק 2 ספרות.`],
          ['המספר הגדול ביותר שאפשר לכתוב עם 7 הסמלים לפי הכללים הוא 3,999.', true, `${m('3,999 = MMMCMXCIX')}. ל-4,000 צריך ${m('M')} ארבע פעמים — אסור.`],
          [`כדי לכתוב ${fm(n)} בשיטה הרומית צריך ${toR(n).length} סמלים.`, true, `${m(`${fm(n)} = ${toR(n)}`)}`],
          [`כדי לכתוב ${fm(n)} בשיטה הרומית צריך ${toR(n).length - 2} סמלים.`, false, `${m(`${fm(n)} = ${toR(n)}`)} — ${toR(n).length} סמלים.`],
        ];
        const [st, ans, ex] = c.pick(L0);
        return {
          type: 'tf', answer: ans,
          prompt: `${b('נכון או לא נכון?')} ${st}`,
          hint: `${c.g('חשוב', 'חשבי')} על הכללים של השיטה הרומית ועל המגבלות שלה.`,
          solution: [ex, ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
        };
      }
      if (kind === 'count') {
        const n = numWith(c, 100, 3999, (x) => toR(x).length >= 7);
        return {
          type: 'number', answer: toR(n).length,
          prompt: `כמה סמלים צריך כדי לכתוב את ${fm(n)} בשיטה הרומית?`,
          hint: `${c.g('כתוב', 'כתבי')} את המספר בשיטה הרומית — חלק אחרי חלק לפי ערך המקום — ו${c.g('ספור', 'ספרי')} את הסמלים.`,
          solution: partsSol(n).concat([`${toR(n).length} סמלים — ובשיטה העשרונית רק ${String(n).length} ספרות!`]),
        };
      }
      // arith: חשבון במספרים רומיים
      const mul = c.chance(0.35);
      const a = mul ? c.rnd(11, 60) : c.rnd(14, 300), b2 = mul ? c.rnd(2, 9) : c.rnd(14, 300), v = mul ? a * b2 : a + b2;
      return {
        type: 'number', answer: v,
        prompt: `${c.g('חשב', 'חשבי')}, ו${c.g('כתוב', 'כתבי')} את התשובה במספר רגיל:<div class="big">${m(`${toR(a)} ${mul ? '×' : '+'} ${toR(b2)}`)}</div>`,
        hint: `קודם ${c.g('תרגם', 'תרגמי')} כל מספר רומי למספר רגיל.`,
        solution: [m(`${toR(a)} = ${a}`), m(`${toR(b2)} = ${b2}`), m(`${a} ${mul ? '×' : '+'} ${b2} = ${fm(v)}`)],
      };
    },
  });
})(HM);
