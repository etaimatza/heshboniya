/* חשבוניה — אי הצורות, חלק ב׳: מצולעים משוכללים, ריצוף, גבהים, שטחים והיקפים */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { m, b } = HM;
  const T = HM.op.times, DV = HM.op.div;

  /* ---------- עזרים כלליים ---------- */
  const R2 = (x) => Math.round(x * 100) / 100;
  const LET = ['א', 'ב', 'ג', 'ד'];
  // שם צלע לפי שתי אותיות, בסדר האלף-בית: nm('ג','ב') => 'בג'
  const nm = (p, q) => [p, q].sort((x, y) => LET.indexOf(x) - LET.indexOf(y)).join('');
  const andJoin = (arr) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' ו' + arr[arr.length - 1]);
  const U = { cm: { L: 'ס"מ', A: 'סמ"ר' }, m: { L: "מ'", A: 'מ"ר' } };
  const cm = (x) => `${HM.fmt(x)} ס"מ`;
  const sqcm = (x) => `${HM.fmt(x)} סמ"ר`;
  const row = (...xs) => `<div class="row">${xs.join('')}</div>`;
  const tfSol = (ans) => (ans ? 'הטענה נכונה.' : 'הטענה לא נכונה.');
  // וקטורים
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const unit = (p) => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l]; };
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const mid = (p, q) => mul(add(p, q), 0.5);
  const foot = (P, A, B) => { const ab = sub(B, A), t = ((P[0] - A[0]) * ab[0] + (P[1] - A[1]) * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]); return add(A, mul(ab, t)); };
  // קטע מקווקו באותו סגנון כמו גובה של V.polygon, וסימון זווית ישרה ב-F
  const dseg = (P, Q, cls) => S.line(P[0], P[1], Q[0], Q[1], { cls: cls || 's-c', sw: 3, dash: '6 4' });
  const rmark = (F, P, along, cls) => {
    const u1 = unit(sub(P, F)), u2 = unit(along), q = 11;
    return S.path(`M${R2(F[0] + u1[0] * q)},${R2(F[1] + u1[1] * q)} L${R2(F[0] + u1[0] * q + u2[0] * q)},${R2(F[1] + u1[1] * q + u2[1] * q)} L${R2(F[0] + u2[0] * q)},${R2(F[1] + u2[1] * q)}`, { fill: 'none', cls: cls || 's-c', sw: 2 });
  };
  // אותיות על דף משבצות: list של [x, y, טקסט, dx, dy] ביחידות משבצת והיסט בפיקסלים
  const gridText = (list) => (cell, off) => list.map((t) => S.text(t[0] * cell + off + (t[3] || 0), t[1] * cell + off + (t[4] || 0), t[2], { fs: 15, fw: 800, cls: t[5] || 't-ink' })).join('');
  // שלשות פיתגוריות (היסט, גובה, צלע נטויה) — כדי שהציורים יהיו מדויקים
  const PYTH = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17], [12, 16, 20], [16, 12, 20], [6, 8, 10], [3, 4, 5]];

  /* ---------- מצולעים משוכללים ---------- */
  const REG = {
    3: { name: 'משולש משוכלל', the: 'המשולש המשוכלל', pl: 'משולשים משוכללים', one: 'משולשים', sh: 'משולש', ang: 60 },
    4: { name: 'ריבוע', the: 'הריבוע', pl: 'ריבועים', one: 'ריבועים', sh: 'ריבוע', ang: 90 },
    5: { name: 'מחומש משוכלל', the: 'המחומש המשוכלל', pl: 'מחומשים משוכללים', one: 'מחומשים', sh: 'מחומש', ang: 108 },
    6: { name: 'משושה משוכלל', the: 'המשושה המשוכלל', pl: 'משושים משוכללים', one: 'משושים', sh: 'משושה', ang: 120 },
    8: { name: 'מתומן משוכלל', the: 'המתומן המשוכלל', pl: 'מתומנים משוכללים', one: 'מתומנים', sh: 'מתומן', ang: 135 },
    10: { name: 'מעושר משוכלל', the: 'המעושר המשוכלל', pl: 'מעושרים משוכללים', one: 'מעושרים', sh: 'מעושר', ang: 144 },
  };
  const regPic = (n, o) => {
    o = o || {};
    return V.polygon(V.shapes.regular(n, o.r || 46), { fill: o.fill || 'f-l', ticks: o.ticks ? HM.range(1, n).map(() => 1) : null, arcs: o.arcs, right: o.right, diags: o.diags, pad: o.pad || 16, maxw: o.maxw || 120, dots: false });
  };
  // מצולע קמור לא משוכלל (קודקודים על מעגל, במרווחים לא שווים)
  const cyclic = (c, n, r) => {
    const st = 360 / n;
    return HM.range(0, n - 1).map((i) => {
      const j = i === 0 ? 0 : (i % 2 ? 1 : -1) * c.rnd(16, 28) / 100;
      const a = ((-90 + (i + j) * st) * Math.PI) / 180;
      return [r + r * Math.cos(a), r + r * Math.sin(a)];
    });
  };

  // תרחישים למצולעים משוכללים. ns: אילו מצולעים מתאימים לתרחיש
  function regScene(c, allowed, needObj) {
    const all = [
      { tags: ['nature'], ns: [6, 8], s: `הערוגה ש${c.name} ${c.g('בנה', 'בנתה')} בגינה`, the: 'הערוגה', obj: 'ערוגה', mk: 'לבנות', fem: true, u: "מ'", a: [2, 5] },
      { tags: ['sport'], ns: [5, 6], s: (n) => `כל טלאי ${n === 5 ? 'שחור' : 'לבן'} בכדור הכדורגל`, the: 'הטלאי', fem: false, u: 'ס"מ', a: [3, 5] },
      { tags: ['animals'], ns: [6], s: 'כל תא בחלת הדבש', the: 'התא', fem: false, u: 'מ"מ', a: [3, 4] },
      { tags: ['baking'], ns: [3, 4, 6, 8], s: `העוגייה ש${c.name} ${c.g('אפה', 'אפתה')}`, the: 'העוגייה', obj: 'עוגייה', mk: 'לאפות', fem: true, u: 'ס"מ', a: [3, 5] },
      { tags: ['games'], ns: [3, 4, 6], s: 'כל משבצת בלוח המשחק', the: 'המשבצת', fem: true, u: 'ס"מ', a: [2, 4] },
      { tags: ['art'], ns: [5, 6, 8], s: `המסגרת ש${c.name} ${c.g('יצר', 'יצרה')} בחוג`, the: 'המסגרת', obj: 'מסגרת', mk: 'ליצור', fem: true, u: 'ס"מ', a: [5, 9] },
      { tags: ['space'], ns: [6], s: 'כל מראה בדגם של טלסקופ החלל', the: 'המראה', fem: true, u: 'ס"מ', a: [3, 6] },
      { tags: ['music'], ns: [3], s: 'המשולש (כלי הנגינה) של להקת בית הספר', the: 'המשולש', fem: false, u: 'ס"מ', a: [12, 20] },
      { tags: ['reading'], ns: [4, 6, 8], s: `השטיח בפינת הקריאה של ${c.name}`, the: 'השטיח', obj: 'שטיח', mk: 'לקנות', fem: false, u: 'ס"מ', a: [60, 150] },
      { tags: ['tech'], ns: [6], s: 'האום שמחזיק את הגלגל של הרובוט', the: 'האום', fem: false, u: 'מ"מ', a: [5, 9] },
      { tags: ['kpop'], ns: [6, 8], s: 'הבמה שעליה רוקדת להקת הקיי-פופ', the: 'הבמה', obj: 'במה', mk: 'לבנות', fem: true, u: "מ'", a: [3, 6] },
      { tags: ['magic'], ns: [5, 6, 8], s: 'שולחן השיקויים בבית הספר לקוסמים', the: 'השולחן', obj: 'שולחן', mk: 'לבנות', fem: false, u: 'ס"מ', a: [40, 70] },
      { tags: ['squishy'], ns: [4, 6], s: `הקופסה שבה ${c.name} ${c.g('שומר', 'שומרת')} את הסקווישים`, the: 'הקופסה', obj: 'קופסה', mk: 'לקנות', fem: true, u: 'ס"מ', a: [6, 12] },
    ].filter((s) => s.ns.some((n) => allowed.indexOf(n) >= 0) && (!needObj || s.obj));
    const sc = Object.assign({}, c.scene(all));
    sc.n = c.pick(sc.ns.filter((n) => allowed.indexOf(n) >= 0));
    if (typeof sc.s === 'function') sc.s = sc.s(sc.n);
    sc.av = sc.a[1] > 30 ? c.rnd(Math.ceil(sc.a[0] / 10), Math.floor(sc.a[1] / 10)) * 10 : c.rnd(sc.a[0], sc.a[1]);
    return sc;
  }

  HM.lesson({
    id: 'g-regular',
    learn: (c) => [
      {
        title: 'חלת הדבש',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} על חלת הדבש: הדבורים בונות תאים בצורת ${b('משושה')}.<br>בכל תא ${b('כל הצלעות שוות')}, ${b('וגם כל הזוויות שוות')}.<br>למצולע כזה קוראים ${HM.hl('מצולע משוכלל')}.`,
        visual: V.tiling('hexagon', { w: 300, h: 150, size: 46 }),
      },
      {
        title: 'מה זה מצולע משוכלל?',
        html: `מצולע משוכלל הוא מצולע ש:<br>• ${b('כל הצלעות')} שלו שוות זו לזו, ${b('וגם')}<br>• ${b('כל הזוויות')} שלו שוות זו לזו.<br>הנה כמה מצולעים משוכללים: משולש, ריבוע, מחומש ומשושה. הקווים הקטנים מסמנים צלעות שוות.`,
        visual: row(...[3, 4, 5, 6].map((n) => regPic(n, { ticks: true, maxw: 80 }))),
      },
      {
        title: 'תנאי אחד לא מספיק',
        html: `• ב${b('מעוין')} כל הצלעות שוות, אבל הזוויות לא שוות — לכן הוא ${b('אינו')} משוכלל.<br>• ב${b('מלבן')} כל הזוויות שוות (90°), אבל הצלעות לא שוות — גם הוא ${b('אינו')} משוכלל.<br>• ה${b('ריבוע')} עומד בשני התנאים, ולכן הוא מצולע משוכלל.`,
        visual: row(
          V.polygon(V.shapes.rhombus(90, 60), { fill: 'f-l', ticks: [1, 1, 1, 1], arcs: [{ i: 0, label: '120°' }, { i: 1, label: '60°' }], pad: 18, maxw: 150, dots: false }),
          V.polygon(V.shapes.rect(130, 70), { fill: 'f-l', right: [0, 1, 2, 3], pad: 18, maxw: 150, dots: false })
        ),
        quiz: {
          type: 'tf', prompt: 'משולש שכל הצלעות שלו שוות הוא מצולע משוכלל.', answer: true,
          hint: 'במשולש שכל הצלעות שלו שוות — מה ידוע על הזוויות?',
          solution: ['במשולש שווה-צלעות גם כל הזוויות שוות: 60° כל אחת.', 'הוא עומד בשני התנאים, לכן הטענה נכונה.'],
        },
      },
      {
        title: 'כמה מעלות בכל זווית?',
        html: `• במשולש המשוכלל (שווה-הצלעות) כל זווית היא ${b('60°')}, כי ${m(`180° ${DV} 3 = 60°`)}.<br>• בריבוע כל זווית היא ${b('90°')}.<br>• במשושה המשוכלל כל זווית היא ${b('120°')}.<br>ככל שיש יותר צלעות — הזוויות גדולות יותר.`,
        visual: row(
          regPic(3, { r: 52, maxw: 110, arcs: [{ i: 0, label: '60°' }, { i: 1 }, { i: 2 }] }),
          regPic(4, { r: 46, maxw: 100, right: [0, 1, 2, 3] }),
          regPic(6, { r: 48, maxw: 110, arcs: [{ i: 0, label: '120°' }, { i: 1 }, { i: 2 }, { i: 3 }, { i: 4 }, { i: 5 }] })
        ),
      },
      {
        title: 'פירוק למשולשים',
        html: `${c.g('בחר', 'בחרי')} קודקוד אחד במצולע, ו${c.g('סרטט', 'סרטטי')} ממנו את כל האלכסונים. המצולע מתחלק ל${b('משולשים')}.<br>מספר המשולשים ${b('קטן ב-2')} ממספר הצלעות: מחומש — 3 משולשים, משושה — 4 משולשים.<br>בכל משולש סכום הזוויות הוא 180°.`,
        visual: V.polygon(V.shapes.regular(6, 70), { fill: 'f-l', diags: [[0, 2], [0, 3], [0, 4]], maxw: 200 }),
      },
      {
        title: 'דוגמה פתורה',
        html: `${c.name}, בוא${c.g('', 'י')} נמצא את גודל כל זווית במשושה משוכלל.`,
        steps: [
          `מקודקוד אחד המשושה מתחלק ל-${m('6 − 2 = 4')} משולשים.`,
          `סכום הזוויות במשושה: ${m(`4 ${T} 180° = 720°`)}.`,
          `במשושה המשוכלל יש 6 זוויות שוות: ${m(`720° ${DV} 6 = 120°`)} ✔`,
        ],
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['isReg', 'tf', 'angle', 'triCount', 'perim', 'storyAngle', 'perim']
        : level === 2 ? ['isReg', 'tf', 'angleSum', 'perim', 'triCount', 'order', 'storyAngle', 'perimInv']
        : ['isNotReg', 'tf', 'angleEach', 'storyMulti', 'angleSum', 'order', 'storyMulti', 'perimInv']);
      switch (kind) {
        case 'isReg':
        case 'isNotReg': {
          const pic = (pts, o) => V.polygon(pts, Object.assign({ fill: 'f-l', pad: 16, maxw: 120, dots: false }, o));
          const rh = pic(V.shapes.rhombus(80, 60), { ticks: [1, 1, 1, 1] });
          const re = pic(V.shapes.rect(110, 60), { right: [0, 1, 2, 3] });
          const iso = pic(V.shapes.triangle('isosceles', 100), { ticks: [1, 0, 1] });
          const irr = pic(cyclic(c, c.pick([5, 6]), 50));
          if (kind === 'isReg') {
            const n = c.pick([3, 4, 5, 6, 8]);
            const odd = n === 3 ? irr : c.pick([iso, irr]);
            return {
              type: 'choice', cols: 2, prompt: `איזו צורה היא ${b('מצולע משוכלל')}?`,
              choices: [regPic(n, { ticks: true, maxw: 120 }), rh, re, odd], answer: 0,
              hint: `${c.g('בדוק', 'בדקי')} שני תנאים: כל הצלעות שוות, ${b('וגם')} כל הזוויות שוות.`,
              solution: ['במעוין כל הצלעות שוות, אבל הזוויות לא שוות.', 'במלבן כל הזוויות שוות, אבל הצלעות לא שוות.', `רק ${REG[n].the} עומד בשני התנאים.`],
            };
          }
          const ns = c.sample([3, 4, 5, 6, 8], 3);
          const w = c.pick([
            [rh, 'במעוין כל הצלעות שוות, אבל הזוויות לא שוות — לכן הוא אינו משוכלל.'],
            [re, 'במלבן כל הזוויות שוות, אבל הצלעות לא שוות — לכן הוא אינו משוכלל.'],
            [iso, 'במשולש שווה-השוקיים רק שתי צלעות שוות — לכן הוא אינו משוכלל.'],
          ]);
          return {
            type: 'choice', cols: 2, prompt: `איזו צורה ${b('אינה')} מצולע משוכלל?`,
            choices: [w[0], ...ns.map((n) => regPic(n, { ticks: true, maxw: 120 }))], answer: 0,
            hint: `בכל צורה ${c.g('בדוק', 'בדקי')}: האם כל הצלעות שוות? האם כל הזוויות שוות? צריך את שני התנאים.`,
            solution: [w[1], `שאר הצורות (${andJoin(ns.map((n) => REG[n].name))}) הן מצולעים משוכללים.`],
          };
        }
        case 'tf': {
          const A = [
            ['ריבוע הוא מצולע משוכלל.', true, 'בריבוע כל הצלעות שוות וכל הזוויות שוות (90°).'],
            ['כל מעוין הוא מצולע משוכלל.', false, 'במעוין הצלעות שוות, אבל הזוויות בדרך כלל לא שוות.'],
            ['מלבן שאינו ריבוע הוא מצולע משוכלל.', false, 'במלבן כזה הזוויות שוות, אבל הצלעות לא שוות.'],
            ['במשולש משוכלל כל זווית היא 60°.', true, `סכום הזוויות במשולש הוא 180°, ובמשולש המשוכלל הזוויות שוות: ${m(`180° ${DV} 3 = 60°`)}.`],
            ['במצולע משוכלל כל הצלעות שוות זו לזו.', true, 'זה חלק מההגדרה של מצולע משוכלל.'],
            ['את המשושה אפשר לחלק מקודקוד אחד ל-6 משולשים.', false, `מקודקוד אחד מקבלים ${m('6 − 2 = 4')} משולשים.`],
          ];
          const B = [
            ['מצולע שכל הזוויות שלו שוות הוא תמיד מצולע משוכלל.', false, 'דוגמה נגדית: במלבן כל הזוויות שוות, אבל הצלעות לא.'],
            ['מצולע שכל הצלעות שלו שוות הוא תמיד מצולע משוכלל.', false, 'דוגמה נגדית: במעוין כל הצלעות שוות, אבל הזוויות לא.'],
            ['במשושה משוכלל כל זווית היא 120°.', true, `${m(`4 ${T} 180° = 720°`)}, ו-${m(`720° ${DV} 6 = 120°`)}.`],
            ['משולש שכל הזוויות שלו שוות הוא משולש משוכלל.', true, 'במשולש שכל הזוויות שלו שוות גם כל הצלעות שוות.'],
            ['ככל שלמצולע משוכלל יש יותר צלעות, כל זווית שלו גדולה יותר.', true, 'משולש 60°, ריבוע 90°, מחומש 108°, משושה 120°, מתומן 135°.'],
            ['סכום הזוויות במחומש הוא 360°.', false, `המחומש מתחלק ל-3 משולשים: ${m(`3 ${T} 180° = 540°`)}.`],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B;
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('נסה', 'נסי')} לחשוב על דוגמאות: ריבוע, מלבן, מעוין, משולש שווה-צלעות. ${c.g('זכור', 'זכרי')}: מצולע משוכלל צריך צלעות שוות ${b('וגם')} זוויות שוות.`,
            solution: [why, tfSol(ans)],
          };
        }
        case 'angle': {
          const n = c.pick(level === 1 ? [3, 4, 6] : [3, 4, 5, 6]);
          const ang = REG[n].ang;
          return {
            type: 'number', answer: ang, unit: 'מעלות',
            prompt: `מה גודל כל זווית ב${REG[n].name}?`,
            visual: regPic(n, { r: 62, maxw: 170, ticks: true, arcs: [{ i: 0, label: '?' }] }),
            hint: n === 3 ? 'סכום הזוויות במשולש הוא 180°, ובמשולש המשוכלל שלוש הזוויות שוות.'
              : n === 4 ? 'בריבוע כל הזוויות ישרות.'
              : `אפשר לחלק את ה${REG[n].sh} מקודקוד אחד למשולשים. בכל משולש סכום הזוויות 180°.`,
            solution: n === 3 ? [`3 זוויות שוות שסכומן 180°.`, `${m(`180° ${DV} 3 = 60°`)}`]
              : n === 4 ? ['כל זווית בריבוע היא זווית ישרה: 90°.']
              : [`מקודקוד אחד מקבלים ${n - 2} משולשים.`, `סכום הזוויות: ${m(`${n - 2} ${T} 180° = ${(n - 2) * 180}°`)}.`, `כל זווית: ${m(`${(n - 2) * 180}° ${DV} ${n} = ${ang}°`)}.`],
          };
        }
        case 'triCount': {
          const n = c.pick(level === 1 ? [4, 5, 6] : [5, 6, 7, 8]);
          const pts = c.chance(0.5) ? V.shapes.regular(n, 70) : cyclic(c, n, 70);
          const show = level === 1 || n <= 6;
          const d = n - 3;
          return {
            type: 'number', answer: n - 2,
            prompt: `מקודקוד אחד של מצולע עם ${n} צלעות מסרטטים את כל האלכסונים. לכמה משולשים המצולע מתחלק?`,
            visual: V.polygon(pts, { fill: 'f-l', diags: show ? HM.range(2, n - 2).map((j) => [0, j]) : [], maxw: 200 }),
            hint: show ? `${c.g('ספור', 'ספרי')} את המשולשים בציור.` : `${c.g('דמיין', 'דמייני')} את האלכסונים מקודקוד אחד. מספר המשולשים קטן ממספר הצלעות.`,
            solution: [d === 1 ? 'מקודקוד אחד יוצא אלכסון אחד.' : `מקודקוד אחד יוצאים ${d} אלכסונים.`, `הם מחלקים את המצולע ל-${m(`${n} − 2 = ${n - 2}`)} משולשים.`],
          };
        }
        case 'angleSum': {
          const n = level === 2 ? c.pick([4, 5, 6]) : c.pick([5, 6, 7, 8, 9, 10]);
          const tri = n - 2, sum = tri * 180;
          return {
            type: 'number', answer: sum, unit: 'מעלות',
            prompt: `מה סכום הזוויות במצולע עם ${n} צלעות?`,
            visual: level === 2 ? V.polygon(cyclic(c, n, 66), { fill: 'f-l', diags: HM.range(2, n - 2).map((j) => [0, j]), maxw: 190 }) : undefined,
            hint: `מחלקים את המצולע למשולשים בעזרת אלכסונים מקודקוד אחד. בכל משולש סכום הזוויות הוא 180°.`,
            solution: [`המצולע מתחלק ל-${m(`${n} − 2 = ${tri}`)} משולשים.`, `${m(`${tri} ${T} 180° = ${HM.fmt(sum)}°`)}`],
          };
        }
        case 'angleEach': {
          const n = c.pick([5, 8, 9, 10, 12]);
          const sum = (n - 2) * 180, ang = sum / n;
          return {
            type: 'number', answer: ang, unit: 'מעלות',
            prompt: `מה גודל כל זווית במצולע משוכלל עם ${n} צלעות?`,
            hint: `קודם ${c.g('מצא', 'מצאי')} את סכום הזוויות (בעזרת חלוקה למשולשים), ואז ${c.g('זכור', 'זכרי')} שבמצולע משוכלל כל הזוויות שוות.`,
            solution: [`${n - 2} משולשים: ${m(`${n - 2} ${T} 180° = ${HM.fmt(sum)}°`)}.`, `יש ${n} זוויות שוות: ${m(`${HM.fmt(sum)}° ${DV} ${n} = ${ang}°`)}.`],
          };
        }
        case 'perim':
        case 'perimInv':
        case 'storyAngle':
        case 'storyMulti': {
          const allowed = kind === 'storyAngle' ? (level === 1 ? [3, 4, 6] : [3, 4, 5, 6, 8]) : [3, 4, 5, 6, 8];
          const sc = regScene(c, allowed, kind === 'storyMulti');
          const n = sc.n, a = sc.av, P = n * a, is = sc.fem ? 'היא' : 'הוא', its = sc.fem ? 'שלה' : 'שלו';
          if (kind === 'storyAngle') {
            const ang = REG[n].ang;
            return {
              type: 'number', answer: ang, unit: 'מעלות',
              prompt: `${sc.s} ${is} בצורת ${REG[n].name}.<br>מה גודל כל זווית ${its}?`,
              hint: n === 3 ? 'במשולש משוכלל שלוש זוויות שוות, וסכומן 180°.' : n === 4 ? 'בריבוע כל הזוויות ישרות.' : `מחלקים את ה${REG[n].sh} למשולשים מקודקוד אחד, ומוצאים את סכום הזוויות. במצולע משוכלל כל הזוויות שוות.`,
              solution: n === 3 ? [`${m(`180° ${DV} 3 = 60°`)}`] : n === 4 ? ['בריבוע כל זווית היא 90°.']
                : [`${n - 2} משולשים: ${m(`${n - 2} ${T} 180° = ${(n - 2) * 180}°`)}.`, `${m(`${(n - 2) * 180}° ${DV} ${n} = ${ang}°`)}`],
            };
          }
          if (kind === 'perim') {
            return {
              type: 'number', answer: P, unit: sc.u,
              prompt: `${sc.s} ${is} בצורת ${REG[n].name}. אורך כל צלע ${its} ${a} ${sc.u}.<br>מה היקף ${sc.the}?`,
              hint: `ההיקף הוא סכום האורכים של כל הצלעות. כמה צלעות יש ל${REG[n].sh}, ומה ידוע עליהן?`,
              solution: [`ל${REG[n].sh} יש ${n} צלעות שוות.`, `${m(`${n} ${T} ${a} = ${HM.fmt(P)}`)}`, `ההיקף: ${HM.fmt(P)} ${sc.u}.`],
            };
          }
          if (kind === 'storyMulti') {
            const f = c.friend();
            const opts = [3, 4, 5, 6, 8].filter((k) => k !== n && P % k === 0);
            const n2 = opts.length ? c.pick(opts) : (n === 4 ? 8 : 4);
            const P2 = opts.length ? P : n2 * a, a2 = P2 / n2;
            const nfem = sc.fem ? 'נוספת' : 'נוסף';
            return {
              type: 'number', answer: a2, unit: sc.u,
              prompt: `${sc.s} ${is} בצורת ${REG[n].name}, ואורך כל צלע ${its} ${a} ${sc.u}.<br>${f.name} ${f.g('רוצה', 'רוצה')} ${sc.mk} ${sc.obj} ${nfem} בצורת ${REG[n2].name}, ${b('עם אותו היקף')}. מה יהיה אורך כל צלע ${its}?`,
              hint: `קודם ${c.g('חשב', 'חשבי')} את ההיקף של ${sc.the} ${sc.fem ? 'הראשונה' : 'הראשון'}. אחר כך מחלקים אותו בין הצלעות של הצורה החדשה.`,
              solution: P2 === P
                ? [`ההיקף: ${m(`${n} ${T} ${a} = ${HM.fmt(P)}`)} ${sc.u}.`, `ל${REG[n2].sh} יש ${n2} צלעות שוות: ${m(`${HM.fmt(P)} ${DV} ${n2} = ${a2}`)}.`, `אורך כל צלע: ${a2} ${sc.u}.`]
                : [`ההיקף: ${m(`${n2} ${T} ${a} = ${HM.fmt(P2)}`)} ${sc.u}.`, `אורך כל צלע: ${a2} ${sc.u}.`],
            };
          }
          if (c.chance(0.5)) {
            return {
              type: 'number', answer: a, unit: sc.u,
              prompt: `${sc.s} ${is} בצורת ${REG[n].name}, וההיקף ${its} ${HM.fmt(P)} ${sc.u}.<br>מה אורך כל צלע?`,
              hint: 'במצולע משוכלל כל הצלעות שוות. ההיקף מתחלק שווה בשווה בין הצלעות.',
              solution: [`ל${REG[n].sh} יש ${n} צלעות שוות.`, `${m(`${HM.fmt(P)} ${DV} ${n} = ${a}`)}`, `אורך כל צלע: ${a} ${sc.u}.`],
            };
          }
          const nn = c.pick([5, 6, 8, 10]), aa = c.rnd(3, 9);
          return {
            type: 'number', answer: nn,
            prompt: `היקף של מצולע משוכלל הוא ${nn * aa} ס"מ, ואורך כל צלע שלו ${aa} ס"מ.<br>כמה צלעות יש למצולע?`,
            hint: 'במצולע משוכלל כל הצלעות שוות. כמה פעמים אורך הצלע "נכנס" בהיקף?',
            solution: [`${m(`${nn * aa} ${DV} ${aa} = ${nn}`)}`, `למצולע יש ${nn} צלעות.`],
          };
        }
        case 'order': {
          const ns = c.sample([3, 4, 5, 6, 8], 4);
          const ans = ns.map((x, i) => i).sort((i, j) => ns[i] - ns[j]);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את המצולעים המשוכללים לפי גודל הזווית שלהם, ${b('מהקטנה לגדולה')}:`,
            items: ns.map((n) => REG[n].name), answer: ans,
            hint: 'ככל שיש למצולע המשוכלל יותר צלעות, כל זווית שלו גדולה יותר.',
            solution: [ans.map((i) => `${REG[ns[i]].sh} ${REG[ns[i]].ang}°`).join(' ← ')],
          };
        }
      }
    },
  });

  /* ---------- ריצוף ---------- */
  // מצולעים משוכללים צמודים סביב נקודה אחת (list: מספרי צלעות). אם נשאר רווח — הוא נצבע באדום
  function around(list, o) {
    o = o || {};
    const a = o.a || 46, cols = ['f-a', 'f-b', 'f-l', 'f-c', 'f-y', 'f-g'];
    let s = '', start = -90, all = [[0, 0]];
    list.forEach((n, k) => {
      const ang = 180 - 360 / n, R = a / (2 * Math.sin(Math.PI / n));
      const bis = ((start + ang / 2) * Math.PI) / 180;
      const cx = R * Math.cos(bis), cy = R * Math.sin(bis), phi0 = bis + Math.PI;
      const pts = HM.range(0, n - 1).map((i) => [cx + R * Math.cos(phi0 + (i * 2 * Math.PI) / n), cy + R * Math.sin(phi0 + (i * 2 * Math.PI) / n)]);
      all = all.concat(pts);
      s += S.poly(pts, { cls: cols[k % cols.length] + ' s-ink', sw: 2, 'stroke-linejoin': 'round' });
      start += ang;
    });
    const gap = 270 - start;
    if (gap > 0.5) {
      const r = 24, a1 = (start * Math.PI) / 180, a2 = (270 * Math.PI) / 180;
      s += S.path(`M0,0 L${R2(r * Math.cos(a1))},${R2(r * Math.sin(a1))} A${r},${r} 0 ${gap > 180 ? 1 : 0} 1 ${R2(r * Math.cos(a2))},${R2(r * Math.sin(a2))} Z`, { cls: 'f-r', 'fill-opacity': 0.7 });
      if (o.label) { const mb = ((start + gap / 2) * Math.PI) / 180, rr = gap < 70 ? 58 : 46; s += S.text(R2(rr * Math.cos(mb)), R2(rr * Math.sin(mb)), o.label, { fs: 16, fw: 800, cls: 't-ink' }); }
    }
    s += S.circle(0, 0, 3.5, { cls: 'f-ink' });
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]), pad = 12;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
    return S.svg(w, h, s, { viewBox: `${R2(x0)} ${R2(y0)} ${R2(w)} ${R2(h)}`, label: 'מצולעים סביב נקודה', maxw: o.maxw || 200 });
  }
  const circlesPic = () => { let s = ''; for (let y = 18; y < 110; y += 32) for (let x = 18; x < 150; x += 32) s += S.circle(x, y, 15, { cls: 'f-a s-ink', sw: 2 }); return S.svg(150, 110, s, { label: 'עיגולים', maxw: 150 }); };
  const overlapPic = () => { let s = ''; [[6, 6], [44, 14], [84, 6], [18, 50], [58, 58], [98, 48]].forEach((p, k) => (s += S.rect(p[0], p[1], 50, 50, { cls: (k % 2 ? 'f-b' : 'f-a') + ' s-ink', sw: 2, 'fill-opacity': 0.7, rx: 2 }))); return S.svg(156, 116, s, { label: 'ריבועים חופפים', maxw: 150 }); };
  const TL_NAME = { square: 'הריבועים', triangle: 'המשולשים', hexagon: 'המשושים', brick: 'המלבנים', rhombus: 'המעוינים', octagon: 'המתומנים והריבועים' };
  const tilePic = (k, o) => V.tiling(k, Object.assign({ w: 150, h: 110, size: 34 }, o));
  function placeScene(c, rooms) {
    const all = [
      { tags: ['baking'], place: 'רצפת המטבח', fem: true, room: true, thing: ['מקרר', false, 'המקרר'] },
      { tags: ['sport'], place: 'רצפת חדר הכושר', fem: true, room: true, thing: ['ארון ציוד', false, 'ארון הציוד'] },
      { tags: ['music'], place: 'רצפת חדר המוזיקה', fem: true, room: true, thing: ['פסנתר', false, 'הפסנתר'] },
      { tags: ['reading'], place: 'רצפת פינת הקריאה בספרייה', fem: true, room: true, thing: ['ארון ספרים', false, 'ארון הספרים'] },
      { tags: ['art'], place: 'קיר הפסיפס בחוג האמנות', fem: false },
      { tags: ['games'], place: 'לוח המשחק החדש', fem: false },
      { tags: ['animals'], place: 'רצפת הלול של התרנגולות', fem: true, room: true, thing: ['שוקת מים', true, 'שוקת המים'] },
      { tags: ['nature'], place: 'רחבת הפיקניק בגינה', fem: true, room: true, thing: ['ערוגת פרחים', true, 'ערוגת הפרחים'] },
      { tags: ['space'], place: 'רצפת מצפה הכוכבים', fem: true, room: true, thing: ['טלסקופ גדול', false, 'הטלסקופ'] },
      { tags: ['tech'], place: 'רצפת מעבדת הרובוטיקה', fem: true, room: true, thing: ['שולחן עבודה', false, 'שולחן העבודה'] },
      { tags: ['kpop'], place: 'רצפת חדר החזרות של להקת הריקוד', fem: true, room: true, thing: ['מערכת הגברה', true, 'מערכת ההגברה'] },
      { tags: ['magic'], place: 'רצפת כיתת השיקויים', fem: true, room: true, thing: ['קדרה ענקית', true, 'הקדרה'] },
      { tags: ['squishy'], place: 'רצפת חנות הסקווישים', fem: true, room: true, thing: ['דלפק', false, 'הדלפק'] },
    ];
    return c.scene(rooms ? all.filter((s) => s.room) : all);
  }

  HM.lesson({
    id: 'g-tiling',
    learn: (c) => [
      {
        title: 'מה זה ריצוף?',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} על רצפת הבית: אריחים מכסים את כל הרצפה.<br>${HM.hl('ריצוף')} הוא כיסוי של משטח בצורות, כך ש:<br>• ${b('אין רווחים')} בין הצורות,<br>• ${b('אין חפיפות')} — אף צורה לא עולה על צורה אחרת.`,
        visual: V.tiling('square', { w: 300, h: 140, size: 46 }),
      },
      {
        title: 'ריצוף או לא?',
        html: `במלבנים (משמאל) יש ריצוף. בעיגולים (מימין) נשארים ${b('רווחים')} — זה לא ריצוף.<br>אפשר לרצף גם בצורות שאינן משוכללות: במלבנים, במקביליות ואפילו בכל משולש.`,
        visual: row(circlesPic(), tilePic('brick', { size: 30 })),
      },
      {
        title: 'מה קורה בקודקוד?',
        html: `בכל נקודה שבה נפגשים אריחים, הזוויות סביבה ממלאות סיבוב שלם: ${b('360°')}.<br>• 6 משולשים משוכללים: ${m(`6 ${T} 60° = 360°`)}<br>• 4 ריבועים: ${m(`4 ${T} 90° = 360°`)}<br>• 3 משושים משוכללים: ${m(`3 ${T} 120° = 360°`)}`,
        visual: row(around([3, 3, 3, 3, 3, 3], { a: 40, maxw: 110 }), around([4, 4, 4, 4], { a: 40, maxw: 110 }), around([6, 6, 6], { a: 34, maxw: 120 })),
      },
      {
        title: 'למה לא במחומשים?',
        html: `כל זווית במחומש משוכלל היא ${b('108°')}. ${c.g('בוא', 'בואי')} נבדוק אם אפשר לרצף בו:`,
        visual: around([5, 5, 5], { label: '36°', maxw: 200 }),
        steps: [
          `3 מחומשים: ${m(`3 ${T} 108° = 324°`)} — חסרות 36°, ונשאר ${b('רווח')}.`,
          `4 מחומשים: ${m(`4 ${T} 108° = 432°`)} — יותר מ-360°, ויש ${b('חפיפה')}.`,
          'אין מספר שלם של זוויות של 108° שנותן בדיוק 360°. לכן אי אפשר לרצף במחומשים משוכללים בלבד.',
        ],
      },
      {
        title: 'ריצוף משולב',
        html: `אפשר לרצף גם בכמה סוגים של מצולעים יחד. למשל במתומנים ובריבועים: בכל קודקוד נפגשים 2 מתומנים וריבוע אחד:<br>${m('135° + 135° + 90° = 360°')}`,
        visual: V.tiling('octagon', { w: 300, h: 150, size: 64 }),
        quiz: {
          type: 'number', prompt: 'בכל קודקוד של ריצוף משולב נפגשים 2 משושים משוכללים ועוד כמה משולשים משוכללים. כמה משולשים יש בכל קודקוד?', answer: 2,
          hint: `2 משושים תופסים ${m('120° + 120° = 240°')}. כמה מעלות נשארות עד 360°?`,
          solution: [`${m('360° − 240° = 120°')}`, `${m('120° : 60° = 2')} — שני משולשים.`],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['vertexCount', 'isTiling', 'tf', 'why', 'story', 'tileCount', 'tileCount']
        : level === 2 ? ['canTile', 'gap', 'tf', 'why', 'story', 'tileCount', 'notTiling', 'vertexCount']
        : ['mixed', 'gapFill', 'canTile', 'tf', 'story', 'tileCost', 'tileCost']);
      switch (kind) {
        case 'vertexCount': {
          const n = c.pick([3, 4, 6]), ang = REG[n].ang, k = 360 / ang;
          return {
            type: 'number', answer: k,
            prompt: `בריצוף של ${REG[n].pl}, כמה ${REG[n].one} נפגשים בכל קודקוד?`,
            visual: V.tiling({ 3: 'triangle', 4: 'square', 6: 'hexagon' }[n], { w: 280, h: 150, size: n === 6 ? 56 : 50 }),
            hint: `${c.g('בחר', 'בחרי')} נקודה שבה נפגשים אריחים, ו${c.g('ספור', 'ספרי')} כמה אריחים נוגעים בה. אפשר גם לחשב: כמה זוויות של ${ang}° ממלאות 360°?`,
            solution: [`כל זווית ב${REG[n].name} היא ${ang}°.`, `${m(`360° ${DV} ${ang}° = ${k}`)}`, `בכל קודקוד נפגשים ${k} ${REG[n].one}.`],
          };
        }
        case 'isTiling':
        case 'notTiling': {
          const bad = [['circ', circlesPic(), 'בעיגולים נשארים רווחים.'], ['over', overlapPic(), 'בריבועים החופפים צורות עולות זו על זו.'], ['pent', around([5, 5, 5], { maxw: 150 }), 'סביב הנקודה עם המחומשים נשאר רווח.']];
          if (kind === 'isTiling') {
            const tl = c.pick(['square', 'triangle', 'hexagon', 'brick', 'rhombus']);
            return {
              type: 'choice', cols: 2, prompt: `באיזה ציור יש ${b('ריצוף')}?`,
              choices: [tilePic(tl), ...bad.map((x) => x[1])], answer: 0,
              hint: 'בריצוף אין רווחים בין הצורות, ואף צורה לא עולה על צורה אחרת.',
              solution: [...bad.map((x) => x[2]), `רק בציור של ${TL_NAME[tl]} אין רווחים ואין חפיפות — זה ריצוף.`],
            };
          }
          const goods = c.sample(['square', 'triangle', 'hexagon', 'brick', 'rhombus', 'octagon'], 3);
          const w = c.pick(bad);
          return {
            type: 'choice', cols: 2, prompt: `באיזה ציור ${b('אין')} ריצוף?`,
            choices: [w[1], ...goods.map((k) => tilePic(k))], answer: 0,
            hint: `${c.g('חפש', 'חפשי')} ציור שיש בו רווחים בין הצורות, או צורות שעולות זו על זו.`,
            solution: [w[2], 'בשאר הציורים הצורות מכסות הכול בלי רווחים ובלי חפיפות.'],
          };
        }
        case 'canTile': {
          const pic = (n) => `${regPic(n, { maxw: 90, r: 40 })}<div>${REG[n].sh}</div>`;
          if (level === 3 && c.chance(0.5)) {
            const bn = c.pick([5, 8, 10]);
            return {
              type: 'choice', cols: 2, prompt: `באיזה מצולע משוכלל ${b('אי אפשר')} לרצף לבד, בלי צורות אחרות?`,
              choices: [pic(bn), pic(3), pic(4), pic(6)], answer: 0,
              hint: 'בכל קודקוד בריצוף הזוויות צריכות להשלים בדיוק 360°. איזו זווית לא "נכנסת" מספר שלם של פעמים ב-360°?',
              solution: [`משולש: ${m('6 × 60° = 360°')}, ריבוע: ${m('4 × 90° = 360°')}, משושה: ${m('3 × 120° = 360°')}.`, `ב${REG[bn].sh} כל זווית היא ${REG[bn].ang}°, ואין מספר שלם של זוויות כאלה שנותן 360°.`],
            };
          }
          const ok = c.pick([3, 4, 6]), ang = REG[ok].ang;
          return {
            type: 'choice', cols: 2, prompt: 'באיזה מצולע משוכלל אפשר לרצף לבד, בלי צורות אחרות?',
            choices: [pic(ok), pic(5), pic(8), pic(10)], answer: 0,
            hint: 'בכל קודקוד בריצוף הזוויות צריכות להשלים בדיוק 360°. איזו זווית "נכנסת" מספר שלם של פעמים ב-360°?',
            solution: ['מחומש: 108°, מתומן: 135°, מעושר: 144° — אף אחת מהזוויות האלה לא נכנסת מספר שלם של פעמים ב-360°.', `${REG[ok].sh}: ${m(`${360 / ang} × ${ang}° = 360°`)} — אפשר לרצף!`],
          };
        }
        case 'why': {
          const n = c.pick([3, 4, 6]), ang = REG[n].ang, k = 360 / ang;
          const expr = level === 1 ? m(HM.slot(0) + ` ${T} ${ang}° = 360°`) : m(`360° ${DV} ${ang}° = ` + HM.slot(0));
          return {
            type: 'number', answer: k,
            prompt: `למה אפשר לרצף ב${REG[n].pl}? ${c.g('השלם', 'השלימי')} את התרגיל:<div class="big">${expr}</div>`,
            hint: `כל זווית ב${REG[n].name} היא ${ang}°. כמה זוויות כאלה ממלאות סיבוב שלם, 360°?`,
            solution: [`${m(`${k} ${T} ${ang}° = 360°`)}`, `לכן ${k} ${REG[n].one} נפגשים בכל קודקוד, בלי רווח ובלי חפיפה.`],
          };
        }
        case 'gap':
        case 'gapFill': {
          const combos = [
            { list: [5, 5, 5], txt: '3 מחומשים משוכללים' },
            { list: [8, 8], txt: '2 מתומנים משוכללים' },
            { list: [6, 6], txt: '2 משושים משוכללים' },
            { list: [4, 3, 3, 3], txt: 'ריבוע אחד ו-3 משולשים משוכללים' },
            { list: [6, 4, 4], txt: 'משושה משוכלל אחד ו-2 ריבועים' },
            { list: [4, 4, 4], txt: '3 ריבועים' },
            { list: [6, 3, 3], txt: 'משושה משוכלל אחד ו-2 משולשים משוכללים' },
            { list: [3, 3, 3, 3, 3], txt: '5 משולשים משוכללים' },
          ];
          const pool = kind === 'gapFill' ? combos.filter((x) => x.list[0] !== 5) : combos;
          const cb = c.pick(pool), angs = cb.list.map((n) => REG[n].ang), sum = HM.sum(angs), gap = 360 - sum;
          const sumSol = `${m(angs.map((x) => x + '°').join(' + ') + ` = ${sum}°`)}`;
          if (kind === 'gap') {
            const sc = c.scene([
              { tags: ['art', 'magic', 'kpop'], mat: 'נייר צבעוני' }, { tags: ['games', 'tech', 'space'], mat: 'קרטון' },
              { tags: ['baking', 'squishy'], mat: 'בצק' }, { tags: ['nature', 'animals', 'sport', 'reading', 'music'], mat: 'קרטון' },
            ]);
            return {
              type: 'number', answer: gap, unit: 'מעלות',
              prompt: `${c.name} ${c.g('גזר', 'גזרה')} מ${sc.mat} ${cb.txt}, ${c.g('והניח', 'והניחה')} אותם סביב נקודה, צמודים זה לזה.<br>כמה מעלות נשארו פנויות סביב הנקודה?`,
              visual: around(cb.list, { label: '?', maxw: 200 }),
              hint: `${c.g('חבר', 'חברי')} את הזוויות שנפגשות בנקודה, ו${c.g('חסר', 'חסרי')} את הסכום מ-360°.`,
              solution: [sumSol, `${m(`360° − ${sum}° = ${gap}°`)}`],
            };
          }
          const names = [3, 4, 5, 6];
          return {
            type: 'choice', keep: true,
            prompt: `סביב נקודה מונחים ${cb.txt}, צמודים זה לזה. איזה מצולע משוכלל ימלא בדיוק את המקום שנשאר?`,
            visual: around(cb.list, { label: '?', maxw: 200 }),
            choices: names.map((n) => REG[n].name), answer: names.findIndex((n) => REG[n].ang === gap),
            hint: `${c.g('חשב', 'חשבי')} כמה מעלות נשארו פנויות, ו${c.g('מצא', 'מצאי')} מצולע משוכלל שזו הזווית שלו.`,
            solution: [sumSol, `${m(`360° − ${sum}° = ${gap}°`)}`, `זווית של ${gap}° יש ל${REG[names.find((n) => REG[n].ang === gap)].name}.`],
          };
        }
        case 'mixed': {
          const mx = c.pick([
            { have: 'משושה משוכלל אחד', hs: [6], fill: 3 },
            { have: '2 משושים משוכללים', hs: [6, 6], fill: 3 },
            { have: '2 מתומנים משוכללים', hs: [8, 8], fill: 4 },
            { have: '2 ריבועים', hs: [4, 4], fill: 3 },
            { have: '3 משולשים משוכללים', hs: [3, 3, 3], fill: 4 },
            { have: 'משושה משוכלל אחד ו-2 ריבועים', hs: [6, 4, 4], fill: 3 },
            { have: '4 משולשים משוכללים', hs: [3, 3, 3, 3], fill: 6 },
          ]);
          const angs = mx.hs.map((n) => REG[n].ang), sum = HM.sum(angs), gap = 360 - sum, fa = REG[mx.fill].ang, ans = gap / fa;
          return {
            type: 'number', answer: ans,
            prompt: `בכל קודקוד של ריצוף משולב נפגשים ${mx.have}, ועוד כמה ${REG[mx.fill].pl}.<br>כמה ${REG[mx.fill].pl} יש בכל קודקוד?`,
            visual: around(mx.hs, { label: '?', maxw: 190 }),
            hint: `${c.g('חשב', 'חשבי')} כמה מעלות תופסים ${mx.have}, וכמה נשאר עד 360°. כל זווית ב${REG[mx.fill].name} היא ${fa}°.`,
            solution: [angs.length > 1 ? `${m(angs.map((x) => x + '°').join(' + ') + ` = ${sum}°`)}` : `${mx.have}: ${sum}°.`, `${m(`360° − ${sum}° = ${gap}°`)}`, `${m(`${gap}° ${DV} ${fa}° = ${ans}`)}`],
          };
        }
        case 'tf': {
          const A = [
            ['בריצוף אסור שיישארו רווחים בין הצורות.', true, 'זה אחד מכללי הריצוף: אין רווחים.'],
            ['בריצוף מותר שצורה אחת תעלה על צורה אחרת.', false, 'בריצוף אין חפיפות — אף צורה לא עולה על צורה אחרת.'],
            ['אפשר לרצף במחומשים משוכללים בלבד.', false, `${m(`3 ${T} 108° = 324°`)} — נשאר רווח, ו-4 מחומשים כבר יותר מ-360°.`],
            ['סכום הזוויות סביב כל קודקוד בריצוף הוא 360°.', true, 'הזוויות סביב נקודה ממלאות סיבוב שלם: 360°.'],
            ['אפשר לרצף במשושים משוכללים בלבד.', true, `${m(`3 ${T} 120° = 360°`)}`],
          ];
          const B = [
            ['אפשר לרצף במתומנים משוכללים בלבד.', false, `${m(`2 ${T} 135° = 270°`)} — נשאר רווח של 90°, ו-3 מתומנים כבר יותר מ-360°.`],
            ['אפשר לרצף רק במצולעים משוכללים.', false, 'אפשר לרצף גם במלבנים, במקביליות ובכל משולש.'],
            ['בריצוף משולב יש יותר מסוג אחד של מצולעים.', true, 'למשל ריצוף במתומנים ובריבועים יחד.'],
            ['בריצוף במשולשים משוכללים נפגשים 6 משולשים בכל קודקוד.', true, `${m(`6 ${T} 60° = 360°`)}`],
            ['בריצוף בריבועים נפגשים 3 ריבועים בכל קודקוד.', false, `${m(`4 ${T} 90° = 360°`)} — נפגשים 4 ריבועים.`],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B.concat(A.slice(2, 3));
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('זכור', 'זכרי')} את כללי הריצוף: בלי רווחים, בלי חפיפות, ובכל קודקוד הזוויות משלימות 360°.`,
            solution: [why, tfSol(ans)],
          };
        }
        case 'story': {
          const sc = placeScene(c, false);
          const n = level === 1 ? c.pick([3, 4, 6, 5]) : c.pick([3, 4, 5, 6, 8, 10]);
          const ang = REG[n].ang, ok = 360 % ang === 0, fl = Math.floor(360 / ang);
          const f = c.friend();
          return {
            type: 'tf',
            prompt: `${c.name} רוצה לרצף את ${sc.place} באריחים בצורת ${REG[n].name} בלבד. ${f.name} ${f.g('אומר', 'אומרת')}: "זה אפשרי, בלי רווחים ובלי חפיפות."<br>האם ${f.g('הוא צודק', 'היא צודקת')}?`,
            answer: ok,
            hint: `מה גודל כל זווית ב${REG[n].name}? האם מספר שלם של זוויות כאלה נותן בדיוק 360°?`,
            solution: ok ? [`כל זווית: ${ang}°.`, `${m(`${360 / ang} ${T} ${ang}° = 360°`)} — אפשר לרצף.`, `${f.name} ${f.g('צודק', 'צודקת')}.`]
              : [`כל זווית: ${ang}°.`, `${m(`${fl} ${T} ${ang}° = ${fl * ang}°`)} — פחות מ-360°, ו-${m(`${fl + 1} ${T} ${ang}° = ${(fl + 1) * ang}°`)} — יותר מ-360°.`, `אי אפשר לרצף, ולכן ${f.name} ${f.g('טועה', 'טועה')}.`],
          };
        }
        case 'tileCount': {
          if (level === 1) {
            const sc = placeScene(c, false);
            const W = c.rnd(4, 8), H = c.rnd(2, 5);
            return {
              type: 'number', answer: W * H,
              prompt: `${c.name} ${c.g('מרצף', 'מרצפת')} את ${sc.place} באריחים ריבועיים. בכל שורה יש ${W} אריחים, ויש ${H} שורות.<br>כמה אריחים ${c.g('צריך', 'צריכה')} ${c.name}?`,
              visual: V.grid(0, { rows: H, cols: W, cell: 26 }),
              hint: `יש ${H} שורות, ובכל אחת ${W} אריחים. אפשר לחבר שוב ושוב — או לכפול.`,
              solution: [`${m(`${H} ${T} ${W} = ${W * H}`)}`, `צריך ${W * H} אריחים.`],
            };
          }
          const sc = placeScene(c, true);
          const W = c.rnd(3, 6), H = c.rnd(2, W - 1), ans = 2 * W * 2 * H;
          return {
            type: 'number', answer: ans,
            prompt: `${sc.place} היא מלבן שאורכו ${W} מ' ורוחבו ${H} מ'. ${c.name} ${c.g('מרצף', 'מרצפת')} אותה באריחים ריבועיים שאורך הצלע שלהם 50 ס"מ.<br>כמה אריחים ${c.g('צריך', 'צריכה')} ${c.name}?`,
            hint: `כמה אריחים של 50 ס"מ נכנסים במטר אחד? ${c.g('חשב', 'חשבי')} כמה אריחים נכנסים לאורך וכמה לרוחב.`,
            solution: ['במטר אחד (100 ס"מ) נכנסים 2 אריחים של 50 ס"מ.', `לאורך: ${m(`${W} ${T} 2 = ${2 * W}`)} אריחים. לרוחב: ${m(`${H} ${T} 2 = ${2 * H}`)} אריחים.`, `${m(`${2 * W} ${T} ${2 * H} = ${ans}`)} אריחים.`],
          };
        }
        case 'tileCost': {
          const sc = placeScene(c, true);
          const W = c.rnd(5, 9), H = c.rnd(3, Math.min(6, W - 1)), a = c.rnd(1, 2), bb = c.rnd(1, Math.min(3, H - 1)), p = c.pick([40, 50, 60, 80, 100, 120]);
          const all = W * H, cut = a * bb, area = all - cut, cost = area * p;
          return {
            type: 'number', answer: cost, unit: '₪',
            prompt: `${sc.place} היא מלבן שאורכו ${W} מ' ורוחבו ${H} מ'. בפינה ${sc.thing[1] ? 'עומדת' : 'עומד'} ${sc.thing[0]} ${sc.thing[1] ? 'שתופסת' : 'שתופס'} מלבן של ${a} מ' על ${bb} מ', ${sc.thing[1] ? 'ומתחתיה' : 'ומתחתיו'} לא מרצפים.<br>מטר רבוע של אריחים עולה ${p} ₪. כמה ${c.g('ישלם', 'תשלם')} ${c.name} על האריחים?`,
            visual: V.onGrid([[[0, 0], [W - a, 0], [W - a, bb], [W, bb], [W, H], [0, H]].map((q) => [q[0] + 1, q[1] + 1])], { w: W + 2, h: H + 2, cell: 22 }),
            hint: `קודם ${c.g('מצא', 'מצאי')} את השטח שצריך לרצף: כל הרצפה פחות המקום של ${sc.thing[2]}. אחר כך ${c.g('חשב', 'חשבי')} את המחיר.`,
            solution: [`כל הרצפה: ${m(`${W} ${T} ${H} = ${all}`)} מ"ר.`, `בלי הפינה: ${m(`${all} − ${a} ${T} ${bb} = ${all} − ${cut} = ${area}`)} מ"ר.`, `המחיר: ${m(`${area} ${T} ${p} = ${HM.fmt(cost)}`)} ₪.`],
          };
        }
      }
    },
  });

  /* ---------- גבהים במשולש ---------- */
  // משולש [A, B, C] עם בסיס BC אופקי. obtuse: הזווית הקהה ב-B. right: הזווית הישרה ב-B
  function triPts(c, kind) {
    let p;
    if (kind === 'right') { const H = c.rnd(110, 140); p = [[0, 0], [0, H], [c.rnd(160, 200), H]]; }
    else if (kind === 'obtuse') { const H = c.rnd(90, 120); p = [[-c.rnd(50, 80), 0], [0, H], [c.rnd(130, 160), H]]; }
    else { const H = c.rnd(125, 150), x = c.chance(0.5) ? c.rnd(55, 80) : c.rnd(120, 145); p = [[x, 0], [0, H], [200, H]]; }
    if (c.chance(0.5)) p = p.map((q) => [-q[0], q[1]]);
    return p;
  }
  const triPic = (pts, L, o) => V.polygon(pts, Object.assign({ labels: L, fill: 'f-l', maxw: 170 }, o));
  // קטעים מקווקווים במשולש [A,B,C] אל הצלע BC: median, side, nv (מאונך שלא יוצא מקודקוד), other (גובה לצלע אחרת)
  function triSeg(pts, kind) {
    const [A, B, C] = pts;
    if (kind === 'median') return dseg(A, mid(B, C));
    if (kind === 'side') return dseg(A, B);
    if (kind === 'nv') { const P = add(A, mul(sub(B, A), 0.45)), F = foot(P, B, C); return dseg(P, F) + rmark(F, P, sub(C, F)); }
    if (kind === 'other') { const F = foot(B, A, C); return dseg(B, F) + rmark(F, B, sub(A, F)); }
    return '';
  }
  const triH = (pts, L, o) => triPic(pts, L, Object.assign({ heights: [{ from: 0, to: [1, 2] }] }, o));
  // תרחישים: ציור על דף משבצות
  const triObj = (c) => c.scene([
    { tags: ['nature'], obj: 'אוהל' }, { tags: ['baking'], obj: 'חתיכת פיצה' }, { tags: ['sport'], obj: 'דגל של קבוצת כדורגל' },
    { tags: ['animals'], obj: 'סנפיר של כריש' }, { tags: ['space'], obj: 'כנף של חללית' }, { tags: ['music'], obj: 'קישוט לחדר המוזיקה' },
    { tags: ['reading'], obj: 'סימנייה' }, { tags: ['games'], obj: 'סמל של משחק מחשב' }, { tags: ['art'], obj: 'פירמידה' },
    { tags: ['tech'], obj: 'כנף של רחפן' }, { tags: ['kpop'], obj: 'דגלון של מועדון המעריצים' }, { tags: ['magic'], obj: 'כובע של קוסם' },
    { tags: ['squishy'], obj: 'סקוויש של פרוסת אבטיח' },
  ]);
  // שאלת מדידת גובה על דף משבצות. kind: acute | obtuse | right
  function gridTriQ(c, kind, o) {
    o = o || {};
    const sc = triObj(c), L = c.shuffle(LET.slice(0, 3));
    let A, B, C, Fp, h, bl;
    if (kind === 'right') { h = c.rnd(3, 6); bl = c.rnd(3, 7); if (bl === h) bl++; A = [1, 1]; B = [1, 1 + h]; C = [1 + bl, 1 + h]; Fp = B; }
    else if (kind === 'obtuse') { h = c.rnd(3, 6); bl = c.rnd(3, 5); const d = c.rnd(1, 3); A = [1, 1]; B = [1 + d, 1 + h]; C = [1 + d + bl, 1 + h]; Fp = [1, 1 + h]; }
    else { h = c.rnd(3, 6); bl = c.rnd(4, 8); const ax = c.rnd(1, bl - 1); A = [1 + ax, 1]; B = [1, 1 + h]; C = [1 + bl, 1 + h]; Fp = [1 + ax, 1 + h]; }
    let P = [A, B, C, Fp];
    let gw = Math.max(...P.map((q) => q[0])) + 2, gh = Math.max(...P.map((q) => q[1])) + 2;
    if (c.chance(0.5)) P = P.map((q) => [gw - q[0], q[1]]);
    if (o.transpose) { P = P.map((q) => [q[1], q[0]]); [gw, gh] = [gh, gw]; }
    [A, B, C, Fp] = P;
    const G = mul(add(add(A, B), C), 1 / 3);
    const cell = Math.min(28, Math.floor(300 / gw));
    const extra = (cl, off) => {
      const px = (q) => [q[0] * cl + off, q[1] * cl + off];
      let s = '';
      if (kind === 'obtuse' && o.ext !== false) s += S.line(...px(B), ...px(Fp), { cls: 's-soft', sw: 2.5, dash: '4 4' });
      if (o.showH && kind !== 'right') s += dseg(px(A), px(Fp)) + rmark(px(Fp), px(A), sub(px(kind === 'obtuse' ? B : C), px(Fp)));
      [A, B, C].forEach((q, i) => { const u = unit(sub(q, G)); s += S.text(q[0] * cl + off + u[0] * 15, q[1] * cl + off + u[1] * 15, L[i], { fs: 15, fw: 800 }); });
      return s;
    };
    const kt = kind === 'obtuse' ? ' קהה-זווית' : kind === 'right' ? ' ישר-זווית' : '';
    const base = nm(L[1], L[2]);
    return {
      type: 'number', answer: h, unit: 'ס"מ',
      prompt: `${c.name} ${c.g('צייר', 'ציירה')} על דף משבצות ${sc.obj} בצורת משולש${kt}. כל משבצת היא ריבוע שצלעו 1 ס"מ.<br>מה אורך הגובה מהקודקוד ${L[0]} אל הצלע ${base}${kind === 'obtuse' ? ' (או אל ההמשך שלה)' : ''}?`,
      visual: V.onGrid([A, B, C], { w: gw, h: gh, cell, extra }),
      hint: kind === 'right' ? `במשולש ישר-זווית כל ניצב הוא גובה לניצב השני. איזו צלע מאונכת לצלע ${base}?`
        : o.showH ? `${c.g('ספור', 'ספרי')} משבצות לאורך הקו המקווקו, מהקודקוד ${L[0]} ועד ${kind === 'obtuse' ? 'ההמשך של הבסיס' : 'הבסיס'}.`
        : `הגובה יוצא מ-${L[0]} ופוגש את הצלע ${base}${kind === 'obtuse' ? ' (או את ההמשך שלה)' : ''} בזווית ישרה. הצלע מונחת על קו של הדף — ${c.g('דמיין', 'דמייני')} קו ישר מ-${L[0]} אליה, לאורך קווי הדף.`,
      solution: kind === 'right'
        ? [`הזווית בקודקוד ${L[1]} ישרה, לכן הצלע ${nm(L[0], L[1])} מאונכת לצלע ${base}.`, `הצלע ${nm(L[0], L[1])} היא הגובה. אורכה ${h} משבצות: ${h} ס"מ.`]
        : [`הגובה יוצא מהקודקוד ${L[0]} ופוגש את ${kind === 'obtuse' ? 'ההמשך של הצלע' : 'הצלע'} ${base} בזווית ישרה.`, `לאורכו ${h} משבצות, ולכן אורכו ${h} ס"מ.`],
    };
  }
  // תרחישים: "כמה גבוה...?"
  const tallObj = (c) => c.scene([
    { tags: ['nature'], the: 'האוהל', fem: false }, { tags: ['animals'], the: 'גג המלונה', fem: false },
    { tags: ['sport'], the: 'המפרש של הסירה', fem: false }, { tags: ['space'], the: 'ההר על הירח', fem: false },
    { tags: ['kpop'], the: 'הקישוט המשולש מעל הבמה', fem: false }, { tags: ['magic'], the: 'כובע הקוסם', fem: false },
    { tags: ['squishy'], the: 'סקוויש פרוסת האבטיח', fem: false }, { tags: ['reading'], the: 'הגג של תיבת הספרים בשכונה', fem: false },
    { tags: ['art'], the: 'הפירמידה שבציור', fem: true }, { tags: ['baking'], the: 'עוגת הקצפת המשולשת', fem: true },
    { tags: ['music', 'games', 'tech'], the: 'המגדל המשולש במשחק', fem: false },
  ]);

  HM.lesson({
    id: 'g-height-tri-a',
    learn: (c) => [
      {
        title: 'כמה גבוה האוהל?',
        html: `${c.name} ${c.g('רוצה', 'רוצה')} לדעת כמה גבוה האוהל. ${c.g('האם תמדוד', 'האם תמדדי')} לאורך הדופן הנטויה? לא!<br>את ${b('הגובה')} מודדים ${b('ישר למטה')}, מהקודקוד העליון אל הרצפה — בזווית ישרה.<br>בציורים מסמנים את הגובה באות ${b('h')}.`,
        visual: V.polygon(V.shapes.triangle('isosceles', 170), { fill: 'f-l', heights: [{ from: 0, to: [1, 2], label: 'h' }], maxw: 200 }),
      },
      {
        title: 'מהו גובה במשולש?',
        html: `${HM.hl('גובה במשולש')} הוא קטע ש:<br>• ${b('יוצא מקודקוד')}, ${b('וגם')}<br>• ${b('מאונך לצלע שמול הקודקוד')}.<br>הצלע הזאת נקראת ${b('הבסיס')} של הגובה. את הזווית הישרה מסמנים בריבוע קטן.`,
        visual: triH([[70, 0], [0, 140], [210, 140]], ['א', 'ב', 'ג'], { maxw: 220 }),
      },
      {
        title: 'מה אינו גובה?',
        html: `• קטע מקודקוד אל ${b('אמצע')} הצלע שמולו — בדרך כלל אינו מאונך לה, ולכן אינו גובה (משמאל).<br>• קטע מאונך לצלע ש${b('לא יוצא מקודקוד')} — אינו גובה (מימין).<br>• ${b('צלע נטויה')} — אינה גובה.`,
        visual: row(triPic([[60, 0], [0, 130], [200, 130]], ['א', 'ב', 'ג'], { extra: triSeg([[60, 0], [0, 130], [200, 130]], 'nv'), maxw: 160 }), triPic([[60, 0], [0, 130], [200, 130]], ['א', 'ב', 'ג'], { extra: triSeg([[60, 0], [0, 130], [200, 130]], 'median'), maxw: 160 })),
      },
      {
        title: 'דוגמה: האם זה גובה?',
        html: `${c.g('בדוק', 'בדקי')} את הקטע המקווקו בשני שלבים:`,
        visual: triH([[150, 0], [0, 140], [210, 140]], ['א', 'ב', 'ג'], { maxw: 210 }),
        steps: [
          'האם הקטע יוצא מקודקוד? כן — מהקודקוד א.',
          'האם הוא מאונך לצלע שמול א, הצלע בג? כן — יש שם זווית ישרה.',
          'שני התנאים מתקיימים, ולכן הקטע הוא גובה לצלע בג ✔',
        ],
      },
      {
        title: 'גובה לא חייב "לעמוד"',
        html: `לכל צלע במשולש יש גובה משלה, שיוצא מהקודקוד שמולה.<br>אם מסובבים את המשולש — גם הגובה מסתובב. לכן ${c.g('חפש', 'חפשי')} תמיד את ${b('הזווית הישרה')} עם הצלע, ולא קו ש"עומד" ישר.`,
        visual: V.polygon(V.shapes.rotate([[70, 0], [0, 140], [210, 140]], -28), { labels: ['א', 'ב', 'ג'], fill: 'f-l', heights: [{ from: 1, to: [2, 0] }], maxw: 210 }),
        quiz: {
          type: 'tf', prompt: 'כל קטע שיוצא מקודקוד של משולש הוא גובה.', answer: false,
          hint: 'כמה תנאים צריך כדי שקטע יהיה גובה?',
          solution: ['הקטע צריך גם להיות מאונך לצלע שמול הקודקוד.', 'לכן הטענה לא נכונה.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['pickHeight', 'tf', 'whichBase', 'measure', 'rightAngle', 'storyTall', 'measure']
        : level === 2 ? ['pickHeight', 'whyNot', 'tf', 'whichBase', 'measure', 'storyTall', 'measure']
        : ['pickHeight', 'whyNot', 'slant', 'measure', 'storyTall', 'tf', 'whichBase']);
      const L = c.shuffle(LET.slice(0, 3));
      switch (kind) {
        case 'pickHeight': {
          let pts = triPts(c, 'acute');
          if (level === 3) pts = V.shapes.rotate(pts, c.pick([-1, 1]) * c.rnd(18, 35));
          const base = nm(L[1], L[2]);
          const o = { maxw: 150, pad: 26 };
          const dis = level === 1 ? ['median', 'nv', 'side'] : c.sample(['median', 'nv', 'other', 'side'], 3);
          const why = { median: 'קטע אל אמצע הצלע אינו מאונך לה.', nv: 'קטע שלא יוצא מקודקוד אינו גובה.', other: 'גובה שיוצא מקודקוד אחר הולך אל צלע אחרת.', side: 'צלע נטויה אינה מאונכת לבסיס.' };
          return {
            type: 'choice', cols: 2, prompt: `באיזה ציור הקטע המקווקו הוא ${b('הגובה לצלע ' + base)}?`,
            choices: [triH(pts, L, o), ...dis.map((d) => triPic(pts, L, Object.assign({ extra: triSeg(pts, d) }, o)))], answer: 0,
            hint: `הגובה לצלע ${base} יוצא מהקודקוד ${L[0]} (שמול הצלע) ומאונך לצלע ${base}.`,
            solution: [...dis.map((d) => why[d]), `הגובה הנכון יוצא מ-${L[0]} ופוגש את הצלע ${base} בזווית ישרה.`],
          };
        }
        case 'whyNot': {
          const pts = triPts(c, 'acute'), base = nm(L[1], L[2]);
          const opts = ['כן, הוא יוצא מקודקוד ומאונך לצלע שמולו.', 'לא, כי הוא לא מאונך לצלע.', 'לא, כי הוא לא יוצא מקודקוד.', 'לא, כי הוא לא עובר באמצע הצלע.'];
          const w = c.pick(['h', 'median', 'nv', 'side']);
          const ans = { h: 0, median: 1, side: 1, nv: 2 }[w];
          const f = c.friend();
          return {
            type: 'choice', keep: true,
            prompt: `${f.name} ${f.g('סרטט', 'סרטטה')} את הקטע המקווקו ${f.g('ואמר', 'ואמרה')} שהוא גובה לצלע ${base}. האם ${f.g('הוא צודק', 'היא צודקת')}?`,
            visual: w === 'h' ? triH(pts, L, { maxw: 200 }) : triPic(pts, L, { extra: triSeg(pts, w), maxw: 200 }),
            choices: opts, answer: ans,
            hint: `${c.g('בדוק', 'בדקי')} שני תנאים: האם הקטע יוצא מקודקוד? האם הוא מאונך לצלע ${base}?`,
            solution: ans === 0 ? [`הקטע יוצא מהקודקוד ${L[0]}.`, `הוא מאונך לצלע ${base} — יש זווית ישרה.`, `זה גובה, ו${f.name} ${f.g('צודק', 'צודקת')}.`]
              : ans === 1 ? [`הקטע יוצא מהקודקוד ${L[0]}, אבל הוא ${b('לא מאונך')} לצלע ${base}.`, 'לכן הוא אינו גובה.']
              : ['הקטע מאונך לצלע, אבל הוא יוצא מנקודה על צלע אחרת — ' + b('לא מקודקוד') + '.', 'לכן הוא אינו גובה.'],
          };
        }
        case 'tf': {
          const A = [
            ['גובה במשולש יוצא תמיד מקודקוד.', true, 'כך מגדירים גובה: קטע שיוצא מקודקוד.'],
            ['גובה במשולש מאונך לצלע שמול הקודקוד שממנו הוא יוצא.', true, 'זה התנאי השני בהגדרה של גובה.'],
            ['כל קטע שיוצא מקודקוד הוא גובה.', false, 'הקטע צריך גם להיות מאונך לצלע שמול הקודקוד.'],
            ['בין הגובה לבסיס יש זווית ישרה.', true, 'הגובה מאונך לבסיס, כלומר יוצר איתו זווית של 90°.'],
            ['הצלע הנטויה של המשולש היא הגובה שלו.', false, 'צלע נטויה אינה מאונכת לבסיס, ולכן אינה גובה.'],
          ];
          const B = [
            ['כל קטע שמאונך לצלע של המשולש הוא גובה.', false, 'הקטע צריך גם לצאת מקודקוד.'],
            ['הקטע שמחבר קודקוד לאמצע הצלע שמולו הוא תמיד גובה.', false, 'הקטע הזה בדרך כלל אינו מאונך לצלע.'],
            ['הגובה הוא הדרך הקצרה ביותר מהקודקוד אל הישר שעליו מונח הבסיס.', true, 'כל קטע אחר מהקודקוד אל הבסיס נטוי, ולכן ארוך יותר.'],
            ['אם מסובבים משולש, הגבהים שלו נשארים גבהים.', true, 'הקטע עדיין יוצא מקודקוד ועדיין מאונך לצלע שמולו.'],
            ['גובה במשולש חייב להיות קו "עומד", מלמעלה למטה.', false, 'גובה יכול להיות נטוי, אם הבסיס נטוי. מה שקובע הוא הזווית הישרה.'],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B;
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('זכור', 'זכרי')}: גובה במשולש יוצא מקודקוד ${b('וגם')} מאונך לצלע שמול הקודקוד.`,
            solution: [why, tfSol(ans)],
          };
        }
        case 'whichBase': {
          let pts = triPts(c, 'acute');
          if (level === 3) pts = V.shapes.rotate(pts, c.pick([-1, 1]) * c.rnd(15, 35));
          const i = c.rnd(0, 2), j = (i + 1) % 3, k = (i + 2) % 3;
          const vis = triPic(pts, L, { heights: [{ from: i, to: [j, k] }], maxw: 200 });
          if (c.chance(0.5)) {
            return {
              type: 'choice', prompt: 'לאיזו צלע הקטע המקווקו הוא גובה?', visual: vis,
              choices: [`לצלע ${nm(L[j], L[k])}`, `לצלע ${nm(L[i], L[j])}`, `לצלע ${nm(L[i], L[k])}`, 'הוא אינו גובה'], answer: 0,
              hint: `${c.g('חפש', 'חפשי')} את הזווית הישרה: הגובה מאונך לצלע שאליה הוא מגיע.`,
              solution: [`הקטע יוצא מהקודקוד ${L[i]}.`, `הוא מגיע לצלע ${nm(L[j], L[k])}, שמול הקודקוד ${L[i]}, ומאונך לה.`, `זה הגובה לצלע ${nm(L[j], L[k])}.`],
            };
          }
          return {
            type: 'choice', prompt: 'מאיזה קודקוד יוצא הגובה המקווקו?', visual: vis,
            choices: [i, j, k].map((x) => `מהקודקוד ${L[x]}`), answer: 0,
            hint: 'הגובה מתחיל בקודקוד ומסתיים על הצלע שמולו, עם זווית ישרה.',
            solution: [`הקטע מתחיל בקודקוד ${L[i]} ומאונך לצלע ${nm(L[j], L[k])}.`],
          };
        }
        case 'measure':
          return gridTriQ(c, 'acute', { showH: level < 3, transpose: level === 3 && c.chance(0.5) });
        case 'rightAngle': {
          const pts = triPts(c, 'acute');
          return {
            type: 'number', answer: 90, unit: 'מעלות',
            prompt: `הקטע המקווקו הוא הגובה לצלע ${nm(L[1], L[2])}. מה גודל הזווית בין הגובה לצלע ${nm(L[1], L[2])}?`,
            visual: triH(pts, L, { maxw: 200 }),
            hint: 'הגובה מאונך לבסיס. איזו זווית נוצרת בין שני קווים מאונכים?',
            solution: ['הגובה מאונך לבסיס.', 'קווים מאונכים יוצרים זווית ישרה: 90°.'],
          };
        }
        case 'storyTall': {
          const sc = tallObj(c);
          const H = 140, W = 210, ax = c.rnd(70, 140);
          const A = [ax, 0], B = [0, H], C = [W, H], D = [ax, H];
          const E = ax > W / 2 ? [ax - c.rnd(45, 60), H] : [ax + c.rnd(45, 60), H];
          const marks = level === 1 ? rmark(D, A, sub(C, D)) : '';
          const extra = dseg(A, D) + dseg(A, E) + marks + S.text(D[0], H + 20, 'ד', { fs: 17, fw: 800 }) + S.text(E[0], H + 20, 'ה', { fs: 17, fw: 800 });
          const vis = V.polygon([A, B, C], { labels: ['א', 'ב', 'ג'], fill: 'f-l', extra, maxw: 220 });
          return {
            type: 'choice',
            prompt: `${c.name} ${c.g('רוצה', 'רוצה')} לדעת כמה ${sc.fem ? 'גבוהה' : 'גבוה'} ${sc.the}. בציור, ${sc.the} ${sc.fem ? 'היא' : 'הוא'} המשולש אבג, והצלע בג מונחת על הקרקע.<br>איזה קטע ${c.g('צריך', 'צריכה')} ${c.name} למדוד?`,
            visual: vis,
            choices: ['את הקטע אד', 'את הצלע אב', 'את הצלע בג', 'את הקטע אה'], answer: 0,
            hint: 'הגובה יוצא מהקודקוד העליון ופוגש את הבסיס בזווית ישרה.',
            solution: ['הצלעות אב ואג נטויות, והקטע אה לא מאונך לבסיס.', 'הקטע אד יוצא מהקודקוד א ומאונך לצלע בג — הוא הגובה.'],
          };
        }
        case 'slant': {
          const sc = tallObj(c);
          let pts = triPts(c, 'acute');
          const dAB = dist(pts[0], pts[1]), dAC = dist(pts[0], pts[2]);
          const s1 = c.rnd(9, 16), s2 = s1 + c.rnd(2, 5), hc = s1 - c.rnd(1, 3);
          const sides = dAB <= dAC ? [cm(s1), '', cm(s2)] : [cm(s2), '', cm(s1)];
          const short = dAB <= dAC ? nm('א', 'ב') : nm('א', 'ג'), long = dAB <= dAC ? nm('א', 'ג') : nm('א', 'ב');
          return {
            type: 'choice',
            prompt: `בציור, ${sc.the} ${sc.fem ? 'היא' : 'הוא'} המשולש החד-זווית אבג. ${c.name} ${c.g('מדד', 'מדדה')}: הצלע ${short} באורך ${s1} ס"מ, והצלע ${long} באורך ${s2} ס"מ.<br>מה יכול להיות אורך הגובה מהקודקוד א אל הצלע בג?`,
            visual: V.polygon(pts, { labels: ['א', 'ב', 'ג'], fill: 'f-l', sides, heights: [{ from: 0, to: [1, 2], label: '?' }], maxw: 220 }),
            choices: [cm(hc), cm(s1), cm(s2), cm(s2 + c.rnd(2, 4))], answer: 0,
            hint: 'הגובה הוא הדרך הקצרה ביותר מהקודקוד אל הבסיס. האם הוא יכול להיות ארוך כמו צלע נטויה?',
            solution: ['הגובה מאונך לבסיס, ולכן הוא הדרך הקצרה ביותר מ-א אל הבסיס.', `לכן הוא קצר יותר מ-${s1} ס"מ וגם מ-${s2} ס"מ.`, `התשובה היחידה האפשרית: ${hc} ס"מ.`],
          };
        }
      }
    },
  });

  // תרחישים: חפץ שנשען על קיר (משולש ישר-זווית)
  const leanObj = (c) => c.scene([
    { tags: ['reading', 'nature'], the: 'הסולם', fem: false }, { tags: ['magic'], the: 'המטאטא המעופף', fem: false },
    { tags: ['sport'], the: 'קרש הסקייטבורד', fem: false }, { tags: ['music'], the: 'הגיטרה', fem: true },
    { tags: ['kpop'], the: 'מקל האור של הלהקה', fem: false }, { tags: ['baking'], the: 'המערוך הגדול', fem: false },
    { tags: ['art'], the: 'כן הציור', fem: false }, { tags: ['squishy'], the: 'קרש המדף של הסקווישים', fem: false },
    { tags: ['tech', 'space', 'games'], the: 'הזרוע של הרובוט', fem: true }, { tags: ['animals'], the: 'קרש הטיפוס של החתול', fem: false },
  ]);
  const KN = { acute: 'חד-זווית', right: 'ישר-זווית', obtuse: 'קהה-זווית' };
  const all3 = (pts, L, o) => triPic(pts, L, Object.assign({ heights: [{ from: 0, to: [1, 2] }, { from: 1, to: [2, 0] }, { from: 2, to: [0, 1] }] }, o));

  HM.lesson({
    id: 'g-height-tri-b',
    learn: (c) => [
      {
        title: 'שלושה גבהים',
        html: `${c.name}, לכל משולש יש ${b('3 גבהים')} — אחד מכל קודקוד, אל הצלע שמולו.<br>במשולש ${b('חד-זווית')} כל שלושת הגבהים נמצאים ${b('בתוך')} המשולש.`,
        visual: all3([[70, 0], [0, 140], [210, 140]], ['א', 'ב', 'ג'], { maxw: 230 }),
      },
      {
        title: 'איך מסרטטים גובה?',
        html: `משתמשים ב${b('גונייה')} (סרגל משולש עם זווית ישרה). הנה הגובה מ-א אל הצלע בג:`,
        visual: V.polygon([[70, 0], [0, 140], [210, 140]], { labels: ['א', 'ב', 'ג'], fill: 'f-l', maxw: 230, extra: S.poly([[70, 140], [70, -18], [168, 140]], { cls: 'f-y s-ink', sw: 1.5, 'fill-opacity': 0.55 }) + dseg([70, 0], [70, 140]) + rmark([70, 140], [70, 0], [1, 0]) }),
        steps: [
          'מניחים צלע אחת של הגונייה על הבסיס בג (או על ההמשך שלו).',
          'מזיזים את הגונייה לאורך הבסיס, עד שהצלע השנייה שלה נוגעת בקודקוד א.',
          'מותחים קו מהקודקוד א אל הבסיס, לאורך הגונייה.',
          'מסמנים זווית ישרה בין הגובה לבסיס ✔',
        ],
      },
      {
        title: 'משולש ישר-זווית',
        html: `במשולש ישר-זווית, שתי הצלעות שיוצרות את הזווית הישרה נקראות ${b('ניצבים')}, והצלע השלישית נקראת ${b('יתר')}.<br>כל ניצב הוא ${b('גובה')} לניצב השני! הגובה השלישי יורד אל היתר, בתוך המשולש.`,
        visual: V.polygon([[0, 0], [0, 130], [200, 130]], { labels: ['א', 'ב', 'ג'], fill: 'f-l', right: [1], sideCls: ['s-c', 's-c', null], heights: [{ from: 1, to: [2, 0] }], maxw: 220 }),
      },
      {
        title: 'משולש קהה-זווית',
        html: `במשולש קהה-זווית ${b('שני גבהים נמצאים מחוץ למשולש')}.<br>כדי לסרטט אותם ${c.g('המשך', 'המשיכי')} את הצלע בקו מקווקו, ו${c.g('סרטט', 'סרטטי')} את הגובה אל ההמשך שלה. הגובה השלישי — מהקודקוד של הזווית הקהה — נמצא בתוך המשולש.`,
        visual: all3([[-70, 0], [0, 110], [150, 110]], ['א', 'ב', 'ג'], { maxw: 240 }),
      },
      {
        title: 'סיכום',
        html: `כמה גבהים נמצאים בכל מקום?`,
        visual: V.table(['סוג המשולש', 'בתוך המשולש', 'הם צלעות', 'מחוץ למשולש'], [['חד-זווית', '3', '0', '0'], ['ישר-זווית', '1', '2', '0'], ['קהה-זווית', '1', '0', '2']], { rowHead: true }),
        quiz: {
          type: 'number', prompt: 'במשולש קהה-זווית, כמה גבהים נמצאים מחוץ למשולש?', answer: 2,
          hint: 'רק הגובה שיוצא מהקודקוד של הזווית הקהה נמצא בתוך המשולש.',
          solution: ['לכל משולש 3 גבהים.', 'במשולש קהה-זווית אחד בפנים ו-2 בחוץ.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['count3', 'where', 'legs', 'tf', 'storyRight', 'gridRight', 'gridRight']
        : level === 2 ? ['count3', 'where', 'pickObtuse', 'tf', 'gridObtuse', 'storyRight', 'drawOrder', 'gridObtuse']
        : ['pickObtuse', 'gridObtuse', 'legs', 'tf', 'where', 'storyRight', 'gridObtuse']);
      const L = c.shuffle(LET.slice(0, 3));
      switch (kind) {
        case 'count3': {
          const v = c.pick([
            { q: 'כמה גבהים יש לכל משולש?', a: 3, k: c.pick(['acute', 'right', 'obtuse']), why: 'מכל קודקוד יוצא גובה אחד אל הצלע שמולו: 3 קודקודים — 3 גבהים.' },
            { q: 'במשולש קהה-זווית, כמה מהגבהים נמצאים מחוץ למשולש?', a: 2, k: 'obtuse', why: 'רק הגובה מהקודקוד של הזווית הקהה בפנים. שני האחרים בחוץ.' },
            { q: 'במשולש חד-זווית, כמה מהגבהים נמצאים בתוך המשולש?', a: 3, k: 'acute', why: 'במשולש חד-זווית כל שלושת הגבהים בפנים.' },
            { q: 'במשולש ישר-זווית, כמה מהגבהים הם צלעות של המשולש?', a: 2, k: 'right', why: 'שני הניצבים מאונכים זה לזה, ולכן כל אחד מהם הוא גובה לשני.' },
            { q: 'במשולש ישר-זווית, כמה גבהים נמצאים בתוך המשולש ואינם צלעות?', a: 1, k: 'right', why: 'רק הגובה אל היתר נמצא בתוך המשולש.' },
          ]);
          const pts = triPts(c, v.k);
          return {
            type: 'number', answer: v.a, prompt: v.q,
            visual: level === 1 ? all3(pts, L, { maxw: 210, right: v.k === 'right' ? [1] : [] }) : triPic(pts, L, { maxw: 190, right: v.k === 'right' ? [1] : [] }),
            hint: level === 1 ? `${c.g('הסתכל', 'הסתכלי')} בציור: הגבהים מקווקווים.` : `${c.g('דמיין', 'דמייני')} את הגובה מכל אחד משלושת הקודקודים.`,
            solution: [v.why, `התשובה: ${v.a}.`],
          };
        }
        case 'where': {
          if (level === 3 && c.chance(0.5)) {
            const q = c.pick([['שני גבהים נמצאים מחוץ למשולש', 2], ['שני גבהים הם צלעות של המשולש', 1], ['כל שלושת הגבהים נמצאים בתוך המשולש', 0]]);
            return {
              type: 'choice', keep: true, prompt: `באיזה משולש ${q[0]}?`,
              choices: ['במשולש חד-זווית', 'במשולש ישר-זווית', 'במשולש קהה-זווית'], answer: q[1],
              hint: `${c.g('דמיין', 'דמייני')} כל סוג משולש, ו${c.g('סרטט', 'סרטטי')} בדמיון את שלושת הגבהים שלו.`,
              solution: ['חד-זווית: 3 גבהים בפנים. ישר-זווית: 2 ניצבים הם גבהים, ועוד אחד בפנים. קהה-זווית: 2 בחוץ ואחד בפנים.', `התשובה: ${['במשולש חד-זווית', 'במשולש ישר-זווית', 'במשולש קהה-זווית'][q[1]]}.`],
            };
          }
          const k = c.pick(['acute', 'right', 'obtuse']);
          const opts = ['כל שלושת הגבהים בתוך המשולש', 'שני גבהים הם צלעות המשולש, והשלישי בתוך המשולש', 'שני גבהים מחוץ למשולש, והשלישי בתוך המשולש', 'כל שלושת הגבהים מחוץ למשולש'];
          const ans = { acute: 0, right: 1, obtuse: 2 }[k];
          return {
            type: 'choice', keep: true, prompt: `איפה נמצאים שלושת הגבהים במשולש ${KN[k]}?`,
            visual: level === 1 ? triPic(triPts(c, k), L, { maxw: 180, right: k === 'right' ? [1] : [] }) : undefined,
            choices: opts, answer: ans,
            hint: k === 'right' ? 'בדוק אילו צלעות מאונכות זו לזו.'.replace('בדוק', c.g('בדוק', 'בדקי')) : k === 'obtuse' ? 'כשהזווית קהה, צריך להמשיך צלעות כדי לסרטט חלק מהגבהים.' : 'כשכל הזוויות חדות, הגבהים "נופלים" על הצלעות עצמן.',
            solution: [`במשולש ${KN[k]}: ${opts[ans]}.`],
          };
        }
        case 'legs': {
          const pts = triPts(c, 'right');
          const fromA = c.chance(0.5);
          const [p, q, r] = fromA ? [L[0], L[1], L[2]] : [L[2], L[1], L[0]];
          return {
            type: 'choice',
            prompt: `במשולש ישר-הזווית שבציור, מהו הגובה מהקודקוד ${p} אל הצלע ${nm(q, r)}?`,
            visual: triPic(pts, L, { right: [1], maxw: 200 }),
            choices: [`הצלע ${nm(p, q)}`, `הצלע ${nm(p, r)}`, 'קטע שנמצא מחוץ למשולש', 'אין למשולש גובה כזה'], answer: 0,
            hint: `הזווית הישרה נמצאת בקודקוד ${L[1]}. אילו שתי צלעות מאונכות זו לזו?`,
            solution: [`הזווית בקודקוד ${L[1]} ישרה, לכן הצלע ${nm(p, q)} מאונכת לצלע ${nm(q, r)}.`, `הצלע ${nm(p, q)} יוצאת מהקודקוד ${p} ומאונכת לצלע ${nm(q, r)} — היא הגובה.`],
          };
        }
        case 'pickObtuse': {
          const pts = triPts(c, 'obtuse'), base = nm(L[1], L[2]);
          const o = { maxw: 160, pad: 26 };
          const dis = c.sample(['median', 'side', 'other'], 3);
          const why = { median: 'קטע אל אמצע הצלע אינו מאונך לה.', side: 'הצלע הנטויה אינה מאונכת לבסיס.', other: 'הקטע מהקודקוד של הזווית הקהה הוא גובה לצלע אחרת.' };
          return {
            type: 'choice', cols: 2, prompt: `באיזה ציור הקטע המקווקו הוא הגובה מהקודקוד ${L[0]} אל הצלע ${base} (או אל ההמשך שלה)?`,
            choices: [triH(pts, L, o), ...dis.map((d) => triPic(pts, L, Object.assign({ extra: triSeg(pts, d) }, o)))], answer: 0,
            hint: `הזווית בקודקוד ${L[1]} קהה, ולכן הגובה מ-${L[0]} נופל ${b('מחוץ')} למשולש, על ההמשך של הצלע ${base}.`,
            solution: [...dis.map((d) => why[d]), `הגובה הנכון יוצא מ-${L[0]}, פוגש את ההמשך של הצלע ${base} בזווית ישרה, ונמצא מחוץ למשולש.`],
          };
        }
        case 'tf': {
          const A = [
            ['לכל משולש יש שלושה גבהים.', true, 'מכל קודקוד יוצא גובה אחד.'],
            ['במשולש ישר-זווית, שני הניצבים הם גם גבהים.', true, 'הניצבים מאונכים זה לזה, ולכן כל אחד מהם גובה לשני.'],
            ['במשולש קהה-זווית כל הגבהים נמצאים בתוך המשולש.', false, 'במשולש קהה-זווית שני גבהים נמצאים מחוץ למשולש.'],
            ['במשולש חד-זווית כל הגבהים נמצאים בתוך המשולש.', true, 'כשכל הזוויות חדות, כל הגבהים בפנים.'],
          ];
          const B = [
            ['גובה של משולש יכול להיות מחוץ למשולש.', true, 'במשולש קהה-זווית שני גבהים נמצאים בחוץ.'],
            ['כדי לסרטט גובה מחוץ למשולש, ממשיכים את הצלע.', true, 'הגובה פוגש את ההמשך של הצלע בזווית ישרה.'],
            ['במשולש ישר-זווית יש רק גובה אחד.', false, 'יש לו 3 גבהים: שני הניצבים, ועוד גובה אל היתר.'],
            ['היתר במשולש ישר-זווית הוא גובה.', false, 'היתר אינו מאונך לאף אחד מהניצבים.'],
            ['במשולש קהה-זווית, הגובה מהקודקוד של הזווית הקהה נמצא בתוך המשולש.', true, 'שני הגבהים האחרים נמצאים בחוץ.'],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B;
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('סרטט', 'סרטטי')} בדמיון משולש מהסוג שבטענה, ואת שלושת הגבהים שלו.`,
            solution: [why, tfSol(ans)],
          };
        }
        case 'drawOrder': {
          const steps = ['מניחים צלע אחת של הגונייה על הבסיס.', 'מזיזים את הגונייה עד שהצלע השנייה שלה נוגעת בקודקוד.', 'מותחים קו מהקודקוד אל הבסיס, לאורך הגונייה.', 'מסמנים זווית ישרה בין הגובה לבסיס.'];
          const order = c.shuffle([0, 1, 2, 3]);
          return {
            type: 'order',
            prompt: `${c.name} ${c.g('מסרטט', 'מסרטטת')} גובה במשולש בעזרת גונייה. ${c.g('סדר', 'סדרי')} את השלבים ${b('מהראשון לאחרון')}:`,
            items: order.map((i) => steps[i]), answer: [0, 1, 2, 3].map((i) => order.indexOf(i)),
            hint: 'קודם מניחים את הגונייה, ורק בסוף מסמנים את הזווית הישרה.',
            solution: steps.map((s, i) => `${i + 1}. ${s}`),
          };
        }
        case 'storyRight': {
          const sc = leanObj(c);
          const fromTop = level === 1 || c.chance(0.6);
          const W = c.rnd(150, 200), H = c.rnd(110, 150);
          const pts = [[W, 0], [W, H], [0, H]];
          const wall = S.rect(W, -14, 12, H + 14, { cls: 'f-l s-soft', sw: 1.5 }) + S.line(-14, H, W + 12, H, { cls: 's-soft', sw: 3 });
          const vis = V.polygon(pts, { labels: ['א', 'ב', 'ג'], fill: 'f-w', right: [1], extra: wall, maxw: 230 });
          const nOn = `לאורך ${sc.the}`;
          return {
            type: 'choice',
            prompt: `${sc.the} ${sc.fem ? 'נשענת' : 'נשען'} על הקיר. הקיר, הרצפה ו${sc.the} יוצרים את המשולש ישר-הזווית אבג (הזווית הישרה ב-ב).<br>${fromTop ? 'מהו הגובה מהקודקוד א אל הרצפה?' : 'מהו הגובה מהקודקוד ג אל הקיר?'}`,
            visual: vis,
            choices: ['הקטע אב, לאורך הקיר', `הקטע אג, ${nOn}`, 'הקטע בג, לאורך הרצפה', 'קטע שנמצא מחוץ למשולש'], answer: fromTop ? 0 : 2,
            hint: fromTop ? 'הגובה מ-א צריך להיות מאונך לרצפה. איזה קטע עומד ישר על הרצפה?' : 'הגובה מ-ג צריך להיות מאונך לקיר. איזה קטע יוצר זווית ישרה עם הקיר?',
            solution: fromTop ? ['הקיר מאונך לרצפה (הזווית ב-ב ישרה).', 'הקטע אב יוצא מ-א ומאונך לרצפה — הוא הגובה.'] : ['הרצפה מאונכת לקיר (הזווית ב-ב ישרה).', 'הקטע בג יוצא מ-ג ומאונך לקיר — הוא הגובה.'],
          };
        }
        case 'gridRight':
          return gridTriQ(c, 'right');
        case 'gridObtuse':
          return gridTriQ(c, 'obtuse', { showH: level === 2, ext: level === 2, transpose: level === 3 && c.chance(0.4) });
      }
    },
  });

  /* ---------- גבהים במקבילית ---------- */
  // תרחישים למקביליות (משמשים גם בשיעורי השטח). u: יחידת אורך
  const parObj = (c) => c.scene([
    { tags: ['nature'], the: 'הערוגה', obj: 'ערוגה', fem: true, u: 'm' },
    { tags: ['sport'], the: 'דגל המעודדים', obj: 'דגל מעודדים', fem: false, u: 'cm' },
    { tags: ['animals'], the: 'מכלאת העיזים', obj: 'מכלאה לעיזים', fem: true, u: 'm' },
    { tags: ['baking'], the: 'חתיכת הבקלאווה', obj: 'חתיכת בקלאווה', fem: true, u: 'cm' },
    { tags: ['art'], the: 'פיסת הבד', obj: 'פיסת בד', fem: true, u: 'cm' },
    { tags: ['music'], the: 'במת ההופעה', obj: 'במה', fem: true, u: 'm' },
    { tags: ['reading'], the: 'הסימנייה', obj: 'סימנייה', fem: true, u: 'cm' },
    { tags: ['games'], the: 'האריח במשחק', obj: 'אריח למשחק', fem: false, u: 'cm' },
    { tags: ['space'], the: 'הלוח הסולארי של הלוויין', obj: 'לוח סולארי', fem: false, u: 'cm' },
    { tags: ['tech'], the: 'לוח המתכת של הרובוט', obj: 'לוח מתכת לרובוט', fem: false, u: 'cm' },
    { tags: ['kpop'], the: 'השלט של מועדון המעריצים', obj: 'שלט למועדון המעריצים', fem: false, u: 'cm' },
    { tags: ['magic'], the: 'השטיח המעופף', obj: 'שטיח מעופף', fem: false, u: 'm' },
    { tags: ['squishy'], the: 'המדבקה על קופסת הסקווישים', obj: 'מדבקה לקופסת הסקווישים', fem: true, u: 'cm' },
  ]);
  // מקבילית בפיקסלים עם קטעים מקווקווים. segs: [[P, Q, withMark, along]] בקואורדינטות לא משוקפות
  function parSegPic(B, H, OFF, segs, o) {
    o = o || {};
    const fx = o.flip ? (p) => [-p[0], p[1]] : (p) => p;
    const pts = V.shapes.parallelogram(B, H, OFF).map(fx);
    let extra = '';
    (segs || []).forEach((sg) => { const P = fx(sg[0]), Q = fx(sg[1]); extra += dseg(P, Q); if (sg[2]) extra += rmark(Q, P, fx(sg[3] || [1, 0]).map((v, i) => v - fx([0, 0])[i])); });
    if (o.texts) o.texts.forEach((t) => { const p = fx(t[0]); extra += S.text(p[0], p[1], t[1], { fs: 15, fw: 800, cls: t[2] || 't-c' }); });
    return V.polygon(pts, Object.assign({ labels: LET, fill: 'f-l', maxw: o.maxw || 220, extra }, o.poly || {}));
  }
  // מקבילית על דף משבצות. מחזיר שאלה על אורך הגובה
  function gridParQ(c, o) {
    o = o || {};
    const sc = parObj(c);
    const h = c.rnd(2, 5); let bl = c.rnd(3, 6); if (bl === h) bl++;
    const off = c.rnd(1, 3);
    let P = [[1 + off, 1], [1 + off + bl, 1], [1 + bl, 1 + h], [1, 1 + h]];
    let gw = 3 + off + bl, gh = h + 2;
    const hx = 1 + off + c.rnd(0, Math.max(0, bl - off));
    let H1 = [hx, 1], H2 = [hx, 1 + h];
    if (c.chance(0.5)) { P = P.map((q) => [gw - q[0], q[1]]); H1 = [gw - H1[0], H1[1]]; H2 = [gw - H2[0], H2[1]]; }
    if (o.transpose) { P = P.map((q) => [q[1], q[0]]); H1 = [H1[1], H1[0]]; H2 = [H2[1], H2[0]]; [gw, gh] = [gh, gw]; }
    const G = mul(P.reduce((s, q) => add(s, q), [0, 0]), 0.25);
    const cell = Math.min(28, Math.floor(300 / gw));
    const extra = (cl, of) => {
      const px = (q) => [q[0] * cl + of, q[1] * cl + of];
      let s = '';
      if (o.showH) s += dseg(px(H1), px(H2)) + rmark(px(H2), px(H1), sub(px(P[2]), px(P[3])));
      P.forEach((q, i) => { const u = unit(sub(q, G)); s += S.text(q[0] * cl + of + u[0] * 15, q[1] * cl + of + u[1] * 15, LET[i], { fs: 15, fw: 800 }); });
      return s;
    };
    return {
      type: 'number', answer: h, unit: 'ס"מ',
      prompt: `${c.name} ${c.g('צייר', 'ציירה')} על דף משבצות ${sc.obj} בצורת מקבילית. כל משבצת היא ריבוע שצלעו 1 ס"מ.<br>מה אורך הגובה לצלע גד?`,
      visual: V.onGrid([P], { w: gw, h: gh, cell, extra }),
      hint: o.showH ? `${c.g('ספור', 'ספרי')} משבצות לאורך הקו המקווקו.` : 'הגובה לצלע גד מחבר אותה עם הצלע שמולה, אב, ומאונך לשתיהן. הצלעות מונחות על קווי הדף — ' + c.g('ספור', 'ספרי') + ' כמה משבצות ביניהן.',
      solution: ['הגובה מחבר את הצלעות המקבילות אב ו-גד, ומאונך להן.', `המרחק ביניהן ${h} משבצות, ולכן אורך הגובה ${h} ס"מ.`, `(הצלע הנטויה אינה גובה — היא לא מאונכת לבסיס.)`],
    };
  }

  HM.lesson({
    id: 'g-height-par',
    learn: (c) => [
      {
        title: 'מסילת הרכבת',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} מסילת רכבת: שני פסים ${b('מקבילים')}, וביניהם קורות עץ ישרות.<br>כל הקורות באותו אורך, כי ${b('המרחק בין קווים מקבילים לא משתנה')}. כך גם במקבילית.`,
        visual: parSegPic(200, 90, 60, [60, 95, 130, 165, 200].map((x) => [[x, 0], [x, 90], true]), { poly: { labels: null } }),
      },
      {
        title: 'גובה במקבילית',
        html: `${HM.hl('גובה במקבילית')} הוא קטע ש${b('מחבר שתי צלעות נגדיות')} (או את ההמשכים שלהן), ${b('ומאונך')} להן.<br>הצלע שאליה הגובה מאונך נקראת ${b('בסיס')}. גם כאן מסמנים את הגובה באות ${b('h')}.`,
        visual: V.polygon(V.shapes.parallelogram(190, 100, 70), { labels: LET, fill: 'f-l', heights: [{ from: 0, to: [3, 2], label: 'h' }], maxw: 240 }),
      },
      {
        title: 'אין-סוף גבהים',
        html: `אפשר לסרטט גובה מ${b('כל נקודה')} על הצלע — לא רק מקודקוד.<br>לכן לכל צלע במקבילית יש ${b('אין-סוף גבהים')}, וכולם ${b('שווים באורכם')}.`,
        visual: parSegPic(190, 100, 70, [80, 120, 160].map((x) => [[x, 0], [x, 100], true]), { texts: [80, 120, 160].map((x) => [[x + 20, 50], '4']), maxw: 240 }),
      },
      {
        title: 'הגבהים לזוג הצלעות השני',
        html: `גם לצלעות הנטויות יש גבהים: קטעים שמאונכים לצלעות הנטויות.<br>בדרך כלל ${b('אורכם שונה')} מהגבהים לבסיס. בציור: גובה לצלע גד, וגובה לצלע בג.<br>ובמלבן? כל צלע מאונכת לצלעות הסמוכות לה, ולכן כל צלע של מלבן היא גם גובה!`,
        visual: V.polygon(V.shapes.parallelogram(170, 90, 60), { labels: LET, fill: 'f-l', heights: [{ from: 0, to: [3, 2] }, { from: 0, to: [1, 2], cls: 's-b' }], maxw: 240 }),
      },
      {
        title: 'דוגמה: איך מזהים גובה?',
        html: `כדי לבדוק אם קטע במקבילית הוא גובה, ${c.g('שאל', 'שאלי')} שתי שאלות:`,
        steps: [
          'האם הקטע מחבר שתי צלעות נגדיות (או את ההמשכים שלהן)?',
          'האם הוא מאונך לצלעות האלה — עם זווית ישרה?',
          'אם התשובה לשתי השאלות היא "כן" — הקטע הוא גובה ✔',
        ],
        quiz: {
          type: 'choice', prompt: 'כמה גבהים אפשר לסרטט לצלע אחת של מקבילית?', choices: ['אין-סוף', '1', '2', '4'], answer: 0,
          hint: 'האם הגובה חייב לצאת מקודקוד?',
          solution: ['אפשר לסרטט גובה מכל נקודה על הצלע.', 'לכן יש אין-סוף גבהים, וכולם שווים.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['pickHeight', 'howMany', 'equalH', 'tf', 'gridH', 'equalStory', 'gridH']
        : level === 2 ? ['pickHeight', 'equalH', 'whichPair', 'tf', 'gridH', 'equalStory', 'howMany', 'gridH']
        : ['pickHeight', 'whichPair', 'gridH', 'tf', 'equalStory', 'gridH', 'equalStory']);
      switch (kind) {
        case 'pickHeight': {
          const B = c.rnd(150, 180), H = c.rnd(80, 100), OFF = c.rnd(45, 70), flip = c.chance(0.5);
          const x = c.rnd(OFF + 15, B - 15), x1 = c.rnd(Math.max(OFF + 50, 70), B);
          const D = {
            slant: [[[x1, 0], [x1 - 50, H]], 'קטע נטוי אינו מאונך לצלעות.'],
            diag: [[[OFF, 0], [B, H]], 'האלכסון אינו מאונך לצלעות.'],
            side: [[[0, H], [OFF, 0]], 'הצלע הנטויה אינה מאונכת לבסיס.'],
            part: [[[x, H * 0.45], [x, H], true], 'קטע שלא מגיע עד הצלע שמולו אינו גובה.'],
          };
          const dis = level === 1 ? ['slant', 'diag', 'side'] : c.sample(['slant', 'diag', 'side', 'part'], 3);
          const o = { flip, maxw: 160 };
          return {
            type: 'choice', cols: 2, prompt: `באיזה ציור הקטע המקווקו הוא ${b('גובה')} לצלע גד?`,
            choices: [parSegPic(B, H, OFF, [[[x, 0], [x, H], true]], o), ...dis.map((k) => parSegPic(B, H, OFF, [D[k][0]], o))], answer: 0,
            hint: 'גובה במקבילית מחבר שתי צלעות נגדיות ומאונך להן.',
            solution: [...dis.map((k) => D[k][1]), 'הגובה הנכון מחבר את הצלעות אב ו-גד ופוגש אותן בזווית ישרה.'],
          };
        }
        case 'howMany': {
          if (c.chance(0.5)) {
            return {
              type: 'choice', keep: true, prompt: 'כמה גבהים אפשר לסרטט לצלע אחת של מקבילית?', choices: ['1', '2', '4', 'אין-סוף'], answer: 3,
              hint: 'האם גובה במקבילית חייב לצאת מקודקוד?',
              solution: ['אפשר לסרטט גובה מכל נקודה על הצלע.', 'לכן יש לכל צלע אין-סוף גבהים, וכולם שווים באורכם.'],
            };
          }
          return {
            type: 'choice', keep: true, prompt: 'במקבילית יש שני זוגות של צלעות נגדיות. לכמה זוגות כאלה אפשר לסרטט גבהים?', choices: ['רק לזוג אחד', 'לשני הזוגות', 'לאף זוג'], answer: 1,
            hint: 'האם גם בין הצלעות הנטויות יש קטעים מאונכים?',
            solution: ['אפשר לסרטט גבהים בין הצלעות האופקיות, וגם בין הצלעות הנטויות.', 'לכל זוג — אין-סוף גבהים שווים.'],
          };
        }
        case 'equalH': {
          const tr = c.pick(PYTH.filter((t) => t[0] <= 8 && t[1] <= 12));
          const [off, h, s] = tr;
          let bs = off + c.rnd(5, 9); while (bs === s || bs === h) bs++;
          const k = 240 / (bs + off);
          const B = bs * k, H = h * k, OFF = off * k, x1 = OFF + (B - OFF) * 0.15, x2 = OFF + (B - OFF) * 0.8;
          const flip = c.chance(0.5);
          return {
            type: 'number', answer: h, unit: 'ס"מ',
            prompt: 'במקבילית שבציור מסורטטים שני גבהים לצלע גד. מה אורך הגובה שמסומן ב-?',
            visual: parSegPic(B, H, OFF, [[[x1, 0], [x1, H], true], [[x2, 0], [x2, H], true]], { flip, maxw: 250, texts: [[[x1 + 22, H / 2], h], [[x2 + 16, H / 2], '?']], poly: { sides: ['', '', cm(bs), cm(s)] } }),
            hint: 'כל הגבהים לאותה צלע במקבילית שווים זה לזה.',
            solution: ['שני הגבהים מאונכים לאותן שתי צלעות מקבילות.', 'המרחק בין צלעות מקבילות לא משתנה, ולכן הגבהים שווים.', `הגובה המסומן: ${h} ס"מ. (${s} ס"מ הוא אורך הצלע הנטויה, והיא אינה גובה.)`],
          };
        }
        case 'equalStory': {
          const sc = parObj(c), f = c.friend(), u = U[sc.u].L;
          const tr = c.pick(PYTH.filter((t) => t[1] <= 12)), [off, h, s] = tr;
          let bs = off + c.rnd(3, 9); while (bs === s || bs === h) bs++;
          const is = sc.fem ? 'היא' : 'הוא';
          const st = `${sc.the} ${is} בצורת מקבילית. אורכי הצלעות: ${bs} ${u} ו-${s} ${u}. ${c.name} ${c.g('מדד', 'מדדה')} גובה לצלע של ${bs} ${u} ${c.g('וקיבל', 'וקיבלה')} ${h} ${u}. ${f.name} ${f.g('מדד', 'מדדה')} גובה לאותה צלע, במקום אחר.`;
          const sol = ['כל הגבהים לאותה צלע במקבילית שווים, כי המרחק בין צלעות מקבילות לא משתנה.', `${f.name} ${f.g('קיבל', 'קיבלה')} ${h} ${u}.`];
          if (level === 3) {
            return {
              type: 'choice', prompt: `${st}<br>מה ${f.g('הוא קיבל', 'היא קיבלה')}?`,
              choices: [`${h} ${u}`, `${s} ${u}`, `${bs} ${u}`, 'אי אפשר לדעת, זה תלוי איפה מודדים'], answer: 0,
              hint: 'האם המרחק בין שתי צלעות מקבילות משתנה ממקום למקום?',
              solution: sol,
            };
          }
          return {
            type: 'number', answer: h, unit: u, prompt: `${st}<br>כמה ${f.name} ${f.g('קיבל', 'קיבלה')}?`,
            hint: 'האם המרחק בין שתי צלעות מקבילות משתנה ממקום למקום?',
            solution: sol,
          };
        }
        case 'whichPair': {
          const pts = V.shapes.parallelogram(170, 90, 60);
          const toSlant = c.chance(0.5);
          return {
            type: 'choice', keep: true, prompt: 'הקטע המקווקו הוא גובה במקבילית אבגד. לאילו צלעות הוא מאונך?',
            visual: V.polygon(c.chance(0.5) ? pts : pts.map((p) => [-p[0], p[1]]), { labels: LET, fill: 'f-l', heights: [toSlant ? { from: 0, to: [1, 2] } : { from: 0, to: [3, 2] }], maxw: 230 }),
            choices: ['הצלע אב והצלע גד', 'הצלע בג והצלע אד', 'הצלע אב והצלע בג', 'הצלע גד והצלע אד'], answer: toSlant ? 1 : 0,
            hint: `${c.g('חפש', 'חפשי')} את הזווית הישרה. גובה מאונך לשתי צלעות נגדיות — מקבילות.`,
            solution: toSlant ? ['הקטע יוצא מהקודקוד א ומאונך לצלע בג.', 'הצלע אד מקבילה לצלע בג, ולכן הקטע מאונך גם לה.'] : ['הקטע יוצא מהקודקוד א ומאונך לצלע גד.', 'הצלע אב מקבילה לצלע גד, ולכן הקטע מאונך גם לה.'],
          };
        }
        case 'tf': {
          const A = [
            ['לכל צלע במקבילית אפשר לסרטט אין-סוף גבהים.', true, 'אפשר לסרטט גובה מכל נקודה על הצלע.'],
            ['כל הגבהים לאותה צלע במקבילית שווים זה לזה.', true, 'המרחק בין צלעות מקבילות לא משתנה.'],
            ['למקבילית יש רק 2 גבהים.', false, 'לכל צלע אפשר לסרטט אין-סוף גבהים.'],
            ['הצלע הנטויה של המקבילית היא גובה.', false, 'היא לא מאונכת לבסיס, ולכן אינה גובה.'],
          ];
          const B = [
            ['במלבן כל צלע היא גם גובה.', true, 'במלבן כל צלע מאונכת לצלעות הסמוכות לה.'],
            ['במקבילית שאינה מעוין, הגובה לצלע הארוכה שווה לגובה לצלע הקצרה.', false, 'הגבהים לשני זוגות הצלעות שונים באורכם.'],
            ['גובה במקבילית יכול לצאת מנקודה שאינה קודקוד.', true, 'אפשר לסרטט גובה מכל נקודה על הצלע.'],
            ['גובה במקבילית מאונך לשתי צלעות נגדיות.', true, 'הצלעות הנגדיות מקבילות, ולכן הגובה מאונך לשתיהן.'],
            ['האלכסון של מקבילית הוא תמיד גובה.', false, 'האלכסון בדרך כלל אינו מאונך לצלעות.'],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B;
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('זכור', 'זכרי')}: גובה במקבילית מחבר שתי צלעות נגדיות ומאונך להן.`,
            solution: [why, tfSol(ans)],
          };
        }
        case 'gridH':
          return gridParQ(c, { showH: level === 1, transpose: level === 3 && c.chance(0.5) });
      }
    },
  });

  /* ---------- היקף ושטח ---------- */
  // תווית לגובה: באמצע הקטע PF, מוזזת לכיוון dir (וקטור) לפי אורך הטקסט
  const hlab = (P, F, txt, dir) => { const M = mid(P, F), u = unit(dir), d = 10 + String(txt).length * 4.2; return S.text(M[0] + u[0] * d, M[1] + u[1] * d, txt, { fs: 15, fw: 800, cls: 't-c' }); };
  // תוויות צלעות שמתרחקות מהצלע לפי אורך הטקסט (גם לצלעות אנכיות). להשתמש עם pad גדול
  const slabs = (pts, labels) => {
    const n = pts.length, C = mul(pts.reduce((s2, p) => add(s2, p), [0, 0]), 1 / n);
    return labels.map((t, i) => {
      if (!t) return '';
      const A = pts[i], B = pts[(i + 1) % n], M = mid(A, B);
      let nr = unit([-(B[1] - A[1]), B[0] - A[0]]);
      if ((M[0] + nr[0] - C[0]) * nr[0] + (M[1] + nr[1] - C[1]) * nr[1] < 0) nr = mul(nr, -1);
      const d = 13 + Math.abs(nr[0]) * String(t).length * 4.4 + Math.abs(nr[1]) * 4;
      return S.text(M[0] + nr[0] * d, M[1] + nr[1] * d, t, { fs: 16, fw: 700 });
    }).join('');
  };
  // צורה ממשבצות: rect | L | U. מחזיר נקודות, שטח, היקף, צלעות ופתרון לשטח
  function gShape(c, kind) {
    let W = c.rnd(3, 7), H = c.rnd(2, 5), r;
    if (kind === 'rect') {
      r = { pts: [[0, 0], [W, 0], [W, H], [0, H]], area: W * H, sides: [W, H, W, H], aSol: [`מלבן של ${H} שורות, ובכל שורה ${W} משבצות.`, `${m(`${H} ${T} ${W} = ${W * H}`)}`] };
    } else if (kind === 'L') {
      W = Math.max(W, 4); H = Math.max(H, 3);
      const cw = c.rnd(1, W - 2), ch = c.rnd(1, H - 1);
      r = { pts: [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]], area: W * H - cw * ch, sides: [W - cw, ch, cw, H - ch, W, H], aSol: [`מלבן שלם: ${m(`${W} ${T} ${H} = ${W * H}`)} משבצות.`, `בפינה חסרות ${m(`${cw} ${T} ${ch} = ${cw * ch}`)} משבצות.`, `${m(`${W * H} − ${cw * ch} = ${W * H - cw * ch}`)}`] };
    } else {
      W = Math.max(W, 5); H = Math.max(H, 3);
      const a = c.rnd(1, W - 3), nw = c.rnd(1, W - a - 2), nd = c.rnd(1, H - 1);
      r = { pts: [[0, 0], [a, 0], [a, nd], [a + nw, nd], [a + nw, 0], [W, 0], [W, H], [0, H]], area: W * H - nw * nd, sides: [a, nd, nw, nd, W - a - nw, H, W, H], aSol: [`מלבן שלם: ${m(`${W} ${T} ${H} = ${W * H}`)} משבצות.`, `בחריץ חסרות ${m(`${nw} ${T} ${nd} = ${nw * nd}`)} משבצות.`, `${m(`${W * H} − ${nw * nd} = ${W * H - nw * nd}`)}`] };
    }
    const flipY = c.chance(0.5), flipX = c.chance(0.5);
    r.pts = r.pts.map((p) => [1 + (flipX ? W - p[0] : p[0]), 1 + (flipY ? H - p[1] : p[1])]);
    r.perim = HM.sum(r.sides); r.gw = W + 2; r.gh = H + 2; r.W = W; r.H = H;
    r.pSol = [`${m(r.sides.join(' + ') + ` = ${r.perim}`)}`];
    return r;
  }
  const shapePic = (sh, o) => V.onGrid([sh.pts], Object.assign({ w: sh.gw, h: sh.gh, cell: Math.min(28, Math.floor(280 / sh.gw)) }, o || {}));
  // תרחישים למלבנים. r/w: טווחי אורך ורוחב. fence: אפשר להקיף בגדר. cover: חומר לכיסוי
  const rectObj = (c, filter) => c.scene([
    { tags: ['sport'], the: 'מגרש הכדורסל', fem: false, u: 'm', r: [15, 30], w: [8, 15], fence: true, cover: 'דשא סינתטי' },
    { tags: ['nature'], the: 'ערוגת הירקות', fem: true, u: 'm', r: [4, 12], w: [2, 7], fence: true, cover: 'אדמת גינה' },
    { tags: ['animals'], the: 'מכלאת הסוסים', fem: true, u: 'm', r: [10, 25], w: [6, 15], fence: true, cover: 'נסורת' },
    { tags: ['baking'], the: 'תבנית האפייה', fem: true, u: 'cm', r: [25, 40], w: [15, 30] },
    { tags: ['art'], the: 'בד הציור', fem: false, u: 'cm', r: [30, 60], w: [20, 40] },
    { tags: ['music'], the: 'במת ההופעה', fem: true, u: 'm', r: [6, 14], w: [4, 9], fence: true, cover: 'שטיח' },
    { tags: ['reading'], the: 'כריכת הספר', fem: true, u: 'cm', r: [18, 30], w: [12, 20] },
    { tags: ['games'], the: 'לוח המשחק', fem: false, u: 'cm', r: [30, 50], w: [20, 40] },
    { tags: ['space'], the: 'הלוח הסולארי של הלוויין', fem: false, u: 'm', r: [5, 12], w: [2, 6] },
    { tags: ['tech'], the: 'מסך הטאבלט', fem: false, u: 'cm', r: [20, 30], w: [12, 20] },
    { tags: ['kpop'], the: 'רחבת הריקודים בהופעה', fem: true, u: 'm', r: [8, 20], w: [5, 12], fence: true, cover: 'שטיח' },
    { tags: ['magic'], the: 'מגרש התעופה על מטאטאים', fem: false, u: 'm', r: [20, 40], w: [10, 25], fence: true, cover: 'דשא' },
    { tags: ['squishy'], the: 'המדף של הסקווישים', fem: false, u: 'cm', r: [40, 90], w: [15, 30] },
  ].filter(filter || (() => true)));
  // אורך ורוחב מתוך התרחיש (ברמה 1: כפולות של 10 כשהטווח גדול)
  function dims(c, sc, level) {
    const pickIn = (a, z) => { if (level === 1 && z >= 15) { const t = HM.range(Math.ceil(a / 10), Math.floor(z / 10)).map((x) => x * 10); if (t.length) return c.pick(t); } return c.rnd(a, z); };
    const w = pickIn(sc.w[0], sc.w[1]);
    let l = pickIn(Math.max(sc.r[0], w + 1), Math.max(sc.r[1], w + 2));
    if (l <= w) l = w + (level === 1 && w >= 20 ? 10 : 1);
    return [l, w];
  }
  const fieldObj = (c) => c.scene([
    { tags: ['nature'], the: 'שדה החמניות' }, { tags: ['animals'], the: 'אחו המרעה של הפרות' },
    { tags: ['baking'], the: 'מטע התפוחים' }, { tags: ['sport'], the: 'מתחם הספורט' },
    { tags: ['music', 'kpop'], the: 'מתחם הפסטיבל' }, { tags: ['space', 'tech'], the: 'שדה הלוחות הסולאריים' },
    { tags: ['magic'], the: 'גן צמחי השיקויים' }, { tags: ['squishy', 'games'], the: 'מגרש החנייה של הקניון' },
  ]);

  HM.lesson({
    id: 'g-perim-area',
    learn: (c) => [
      {
        title: 'גדר או דשא?',
        html: `${c.name} ${c.g('מתכנן', 'מתכננת')} גינה.<br>• כדי לדעת כמה ${b('גדר')} לקנות, צריך את ${HM.hl('ההיקף')}: האורך של הקו שמקיף את הגינה.<br>• כדי לדעת כמה ${b('דשא')} לשתול, צריך את ${HM.hl('השטח')}: כמה מקום הגינה תופסת.`,
        visual: V.onGrid([[1, 1], [7, 1], [7, 5], [1, 5]], { w: 8, h: 6, cell: 30, extra: (cl, of) => S.rect(cl + of, cl + of, 6 * cl, 4 * cl, { fill: 'none', cls: 's-c', sw: 6, rx: 2 }) }),
      },
      {
        title: 'יחידות מידה',
        html: `• ${b('אורך והיקף')} מודדים ביחידות אורך: ס"מ, מ', ק"מ.<br>• ${b('שטח')} מודדים ב${b('ריבועים')}: ${b('סמ"ר')} (סנטימטר רבוע) הוא ריבוע שצלעו 1 ס"מ, ו${b('מ"ר')} (מטר רבוע) הוא ריבוע שצלעו 1 מ'.`,
        visual: S.svg(220, 130, S.rect(70, 20, 80, 80, { cls: 'f-a s-ink', sw: 2.5, 'fill-opacity': 0.5 }) + S.text(110, 60, '1 סמ"ר', { fs: 17, fw: 800 }) + S.text(110, 118, '1 ס"מ', { fs: 15, fw: 700 }) + S.text(38, 60, '1 ס"מ', { fs: 15, fw: 700 }), { label: 'סנטימטר רבוע', maxw: 220 }),
      },
      {
        title: 'שטח והיקף של מלבן',
        html: `במלבן כל השורות שוות, לכן לא צריך לספור: כופלים!<br>${HM.hl('שטח מלבן = אורך × רוחב')}<br>${HM.hl('היקף מלבן = אורך + רוחב + אורך + רוחב')}`,
        visual: V.onGrid([[1, 1], [7, 1], [7, 5], [1, 5]], { w: 8, h: 6, cell: 28 }),
        steps: [
          'המלבן שבציור: אורך 6 ס"מ, רוחב 4 ס"מ (כל משבצת: 1 ס"מ).',
          `שטח: ${m(`6 ${T} 4 = 24`)} — כלומר 24 סמ"ר.`,
          `היקף: ${m('6 + 4 + 6 + 4 = 20')} — כלומר 20 ס"מ.`,
          'שימו לב: לשטח יחידות של ריבועים (סמ"ר), ולהיקף יחידות של אורך (ס"מ) ✔',
        ],
      },
      {
        title: 'פירוק והרכבה',
        html: `צורה מסובכת? ${c.g('פרק', 'פרקי')} אותה למלבנים, ${c.g('חשב', 'חשבי')} את השטח של כל מלבן, ו${c.g('חבר', 'חברי')} את השטחים.<br>בציור: ${m(`3 ${T} 4 = 12`)} ועוד ${m(`4 ${T} 2 = 8`)}, ביחד ${m('12 + 8 = 20')} משבצות.`,
        visual: V.onGrid([[[1, 1], [4, 1], [4, 5], [1, 5]], [[4, 3], [8, 3], [8, 5], [4, 5]]], { w: 9, h: 6, cell: 28 }),
      },
      {
        title: 'היקף שווה — שטח שונה',
        html: `לשני המלבנים יש ${b('אותו היקף')}: 12 ס"מ.<br>אבל השטחים שונים: ${m(`1 ${T} 5 = 5`)} סמ"ר, ו-${m(`3 ${T} 3 = 9`)} סמ"ר.<br>${c.name}, ${c.g('זכור', 'זכרי')}: היקף שווה ${b('לא')} אומר שטח שווה!`,
        visual: V.onGrid([[[1, 2], [6, 2], [6, 3], [1, 3]], [[8, 1], [11, 1], [11, 4], [8, 4]]], { w: 12, h: 5, cell: 26 }),
      },
      {
        title: 'דונם',
        html: `שטחים גדולים, כמו שדות וחלקות, מודדים ב${b('דונם')}.<br>${HM.hl('1 דונם = 1,000 מ"ר')}<br>למשל: שדה שאורכו 50 מ' ורוחבו 20 מ' — ${m(`50 ${T} 20 = 1,000`)} מ"ר, כלומר דונם אחד.`,
        quiz: {
          type: 'number', prompt: 'כמה מ"ר הם 3 דונם?', answer: 3000, unit: 'מ"ר',
          hint: 'בכל דונם יש 1,000 מ"ר.',
          solution: [`${m(`3 ${T} 1,000 = 3,000`)}`, '3 דונם הם 3,000 מ"ר.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['countArea', 'countPerim', 'units', 'rectFig', 'tfMis', 'rectStory', 'rectStory', 'gridStory']
        : level === 2 ? ['rectStory', 'decompL', 'dunamField', 'gridChoice', 'compareRect', 'units', 'countPerim', 'fenceStory', 'dunamConv', 'rectStory']
        : ['perimInv', 'decompStory', 'gridChoice', 'compareRect', 'dunamField', 'tfMis', 'carpetCost', 'both']);
      switch (kind) {
        case 'countArea':
        case 'gridStory': {
          const sh = gShape(c, level === 1 ? c.pick(['rect', 'L']) : c.pick(['L', 'U']));
          if (kind === 'gridStory') {
            const sc = rectObj(c);
            return {
              type: 'number', answer: sh.area, unit: U[sc.u].A,
              prompt: `${c.name} ${c.g('שרטט', 'שרטטה')} על דף משבצות תוכנית של ${sc.the}. כל משבצת בתוכנית מייצגת ${sc.u === 'm' ? 'מטר רבוע אחד' : 'סנטימטר רבוע אחד'}.<br>מה שטח ${sc.the}?`,
              visual: shapePic(sh),
              hint: `${c.g('ספור', 'ספרי')} את המשבצות שבתוך הצורה. במלבן אפשר לכפול: מספר השורות × מספר המשבצות בשורה.`,
              solution: [...sh.aSol, `השטח: ${sh.area} ${U[sc.u].A}.`],
            };
          }
          return {
            type: 'number', answer: sh.area, unit: 'סמ"ר',
            prompt: 'כל משבצת היא ריבוע של 1 סמ"ר. מה השטח של הצורה הצבועה?',
            visual: shapePic(sh),
            hint: `${c.g('ספור', 'ספרי')} את המשבצות שבתוך הצורה. אפשר גם להשלים למלבן ולהחסיר את מה שחסר.`,
            solution: [...sh.aSol, `השטח: ${sh.area} סמ"ר.`],
          };
        }
        case 'countPerim': {
          const sh = gShape(c, level === 1 ? c.pick(['rect', 'L']) : c.pick(['L', 'U']));
          return {
            type: 'number', answer: sh.perim, unit: 'ס"מ',
            prompt: 'אורך הצלע של כל משבצת הוא 1 ס"מ. מה ההיקף של הצורה הצבועה?',
            visual: shapePic(sh),
            hint: `${c.g('עבור', 'עברי')} עם האצבע מסביב לצורה, ו${c.g('ספור', 'ספרי')} את צלעות המשבצות שעל הגבול. ${c.g('שים', 'שימי')} לב לכל "מדרגה".`,
            solution: ['מחברים את אורכי כל הצלעות מסביב:', ...sh.pSol, `ההיקף: ${sh.perim} ס"מ.`],
          };
        }
        case 'units': {
          const qs = [
            { q: 'שטח רצפת הכיתה', ans: 'מ"ר', d: ["מ'", 'ס"מ', 'ק"מ'] },
            { q: 'היקף מגרש הכדורגל', ans: "מ'", d: ['מ"ר', 'סמ"ר', 'דונם'] },
            { q: 'שטח הדף במחברת', ans: 'סמ"ר', d: ['ס"מ', "מ'", 'ק"מ'] },
            { q: 'אורך העיפרון', ans: 'ס"מ', d: ['סמ"ר', 'מ"ר', 'דונם'] },
            { q: 'שטח שדה החיטה של הקיבוץ', ans: 'דונם', d: ["מ'", 'ס"מ', 'ק"מ'] },
            { q: 'היקף התמונה שעל הקיר', ans: 'ס"מ', d: ['סמ"ר', 'מ"ר', 'דונם'] },
            { q: 'שטח הבול שעל המכתב', ans: 'סמ"ר', d: ['ס"מ', 'מ"מ', "מ'"] },
            { q: 'המרחק בין שתי ערים', ans: 'ק"מ', d: ['מ"ר', 'סמ"ר', 'דונם'] },
          ];
          const x = c.pick(qs), isArea = /^שטח/.test(x.q);
          return {
            type: 'choice', prompt: `באיזו יחידת מידה הכי מתאים למדוד את ${x.q}?`,
            choices: [x.ans, ...x.d], answer: 0,
            hint: 'אורך והיקף מודדים ביחידות אורך (ס"מ, מ\', ק"מ). שטח מודדים ביחידות שטח (סמ"ר, מ"ר, דונם). אחר כך ' + c.g('בחר', 'בחרי') + ' יחידה בגודל מתאים.',
            solution: [isArea ? 'מודדים שטח, לכן צריך יחידת שטח.' : 'מודדים אורך, לכן צריך יחידת אורך.', `היחידה המתאימה: ${x.ans}.`],
          };
        }
        case 'rectFig': {
          const l = c.rnd(3, 9), w = c.rnd(2, l - 1), area = c.chance(0.5);
          return {
            type: 'number', answer: area ? l * w : 2 * (l + w), unit: area ? 'סמ"ר' : 'ס"מ',
            prompt: `מה ${area ? 'השטח' : 'ההיקף'} של המלבן?`,
            visual: V.polygon(V.shapes.rect(l * 26, w * 26), { fill: 'f-l', right: [0, 1, 2, 3], extra: slabs(V.shapes.rect(l * 26, w * 26), [cm(l), cm(w), '', '']), pad: 62, maxw: 280 }),
            hint: area ? 'שטח מלבן = אורך × רוחב.' : 'היקף = סכום כל הצלעות. במלבן יש שתי צלעות ארוכות ושתי צלעות קצרות.',
            solution: area ? [`${m(`${l} ${T} ${w} = ${l * w}`)}`, `השטח: ${l * w} סמ"ר.`] : [`${m(`${l} + ${w} + ${l} + ${w} = ${2 * (l + w)}`)}`, `ההיקף: ${2 * (l + w)} ס"מ.`],
          };
        }
        case 'rectStory': {
          const sc = rectObj(c), [l, w] = dims(c, sc, level), area = c.chance(0.5), u = U[sc.u];
          const A = l * w, P = 2 * (l + w);
          return {
            type: 'number', answer: area ? A : P, unit: area ? u.A : u.L,
            prompt: `${c.name} ${c.g('מדד', 'מדדה')} את ${sc.the}: ${sc.fem ? 'אורכה' : 'אורכו'} ${l} ${u.L} ${sc.fem ? 'ורוחבה' : 'ורוחבו'} ${w} ${u.L}.<br>מה ${area ? 'שטח' : 'היקף'} ${sc.the}?`,
            hint: area ? 'שטח מלבן = אורך × רוחב. השטח נמדד ביחידות ריבועיות.' : 'היקף מלבן = אורך + רוחב + אורך + רוחב.',
            solution: area ? [`${m(`${l} ${T} ${w} = ${HM.fmt(A)}`)}`, `השטח: ${HM.fmt(A)} ${u.A}.`] : [`${m(`${l} + ${w} + ${l} + ${w} = ${HM.fmt(P)}`)}`, `ההיקף: ${HM.fmt(P)} ${u.L}.`],
          };
        }
        case 'fenceStory': {
          const sc = rectObj(c, (s) => s.fence), [l, w] = dims(c, sc, 2), g = c.rnd(1, 3), P = 2 * (l + w);
          return {
            type: 'number', answer: P - g, unit: "מ'",
            prompt: `${c.name} ${c.g('רוצה', 'רוצה')} להקיף את ${sc.the} בגדר. ${sc.fem ? 'אורכה' : 'אורכו'} ${l} מ' ${sc.fem ? 'ורוחבה' : 'ורוחבו'} ${w} מ'. בגדר צריך להשאיר פתח של ${g} מ' לשער.<br>כמה מטרים של גדר ${c.g('צריך', 'צריכה')} ${c.name}?`,
            hint: `קודם ${c.g('חשב', 'חשבי')} את ההיקף, ואחר כך ${c.g('חסר', 'חסרי')} את הפתח.`,
            solution: [`ההיקף: ${m(`${l} + ${w} + ${l} + ${w} = ${P}`)} מ'.`, `בלי השער: ${m(`${P} − ${g} = ${P - g}`)} מ'.`],
          };
        }
        case 'decompL':
        case 'decompStory': {
          const W = c.rnd(5, 10), H = c.rnd(4, 8), cw = c.rnd(2, W - 2), ch = c.rnd(1, H - 2), k = Math.min(24, 240 / W);
          const pts = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]].map((p) => [p[0] * k, p[1] * k]);
          const unitL = kind === 'decompStory' ? "מ'" : 'ס"מ', unitA = kind === 'decompStory' ? 'מ"ר' : 'סמ"ר';
          const lab = (x) => `${x} ${unitL}`;
          const area = W * H - cw * ch;
          const vis = V.polygon(pts, { fill: 'f-l', right: [0, 1, 3, 4, 5], extra: slabs(pts, [lab(W - cw), '', '', lab(H - ch), lab(W), lab(H)]), pad: 62, maxw: 300 });
          const sol = [`מפרקים לשני מלבנים בקו אנכי:`, `מלבן שמאלי: ${m(`${W - cw} ${T} ${H} = ${(W - cw) * H}`)}.`, `מלבן ימני: רוחבו ${m(`${W} − ${W - cw} = ${cw}`)}, וגובהו ${m(`${H} − ${ch} = ${H - ch}`)}, ולכן ${m(`${cw} ${T} ${H - ch} = ${cw * (H - ch)}`)}.`, `ביחד: ${m(`${(W - cw) * H} + ${cw * (H - ch)} = ${area}`)} ${unitA}.`];
          if (kind === 'decompStory') {
            const p = c.pick([40, 50, 60, 80]);
            return {
              type: 'number', answer: area * p, unit: '₪',
              prompt: `לחדר של ${c.name} יש צורה כמו בציור. ${c.g('הוא רוצה', 'היא רוצה')} לכסות את כל הרצפה בשטיח מקיר לקיר. מטר רבוע של שטיח עולה ${p} ₪.<br>כמה יעלה השטיח?`,
              visual: vis,
              hint: `קודם ${c.g('מצא', 'מצאי')} את שטח החדר: ${c.g('פרק', 'פרקי')} אותו לשני מלבנים. את המידות החסרות מוצאים מהמידות הידועות. אחר כך ${c.g('חשב', 'חשבי')} את המחיר.`,
              solution: [...sol.slice(0, 3), `שטח החדר: ${m(`${(W - cw) * H} + ${cw * (H - ch)} = ${area}`)} מ"ר.`, `המחיר: ${m(`${area} ${T} ${p} = ${HM.fmt(area * p)}`)} ₪.`],
            };
          }
          return {
            type: 'number', answer: area, unit: 'סמ"ר',
            prompt: 'מה השטח של הצורה? (כל הזוויות בה ישרות)',
            visual: vis,
            hint: `${c.g('פרק', 'פרקי')} את הצורה לשני מלבנים בעזרת קו. את המידות החסרות מוצאים מהמידות הידועות.`,
            solution: sol,
          };
        }
        case 'dunamConv': {
          const d = c.rnd(2, 12);
          if (c.chance(0.5)) {
            return {
              type: 'number', answer: d * 1000,
              prompt: `${c.g('השלם', 'השלימי')}:<div class="big">${d} דונם = ${HM.slot(0)} מ"ר</div>`,
              hint: 'בכל דונם יש 1,000 מ"ר.',
              solution: [`${m(`${d} ${T} 1,000 = ${HM.fmt(d * 1000)}`)}`],
            };
          }
          return {
            type: 'number', answer: d,
            prompt: `${c.g('השלם', 'השלימי')}:<div class="big">${HM.fmt(d * 1000)} מ"ר = ${HM.slot(0)} דונם</div>`,
            hint: 'בכל דונם יש 1,000 מ"ר. כמה פעמים 1,000 נכנס במספר?',
            solution: [`${m(`${HM.fmt(d * 1000)} ${DV} 1,000 = ${d}`)}`],
          };
        }
        case 'dunamField': {
          const sc = fieldObj(c), d = c.rnd(2, 9), a = c.pick([25, 40, 50, 100]), bb = (d * 1000) / a;
          const [l, w] = a > bb ? [a, bb] : [bb, a];
          if (level === 3 && c.chance(0.6)) {
            return {
              type: 'number', answer: w, unit: "מ'",
              prompt: `${sc.the} הוא מלבן ששטחו ${d} דונם. אורכו ${l} מ'.<br>מה רוחבו?`,
              hint: `קודם ${c.g('המר', 'המירי')} את השטח למ"ר. אחר כך: אורך × רוחב = שטח, אז רוחב = שטח : אורך.`,
              solution: [`${d} דונם = ${HM.fmt(d * 1000)} מ"ר.`, `${m(`${HM.fmt(d * 1000)} ${DV} ${l} = ${w}`)}`, `הרוחב: ${w} מ'.`],
            };
          }
          return {
            type: 'number', answer: d, unit: 'דונם',
            prompt: `${sc.the} הוא מלבן שאורכו ${l} מ' ורוחבו ${w} מ'.<br>כמה דונם שטחו?`,
            hint: `קודם ${c.g('חשב', 'חשבי')} את השטח במ"ר, ואז ${c.g('זכור', 'זכרי')}: 1 דונם = 1,000 מ"ר.`,
            solution: [`${m(`${l} ${T} ${w} = ${HM.fmt(d * 1000)}`)} מ"ר.`, `${m(`${HM.fmt(d * 1000)} ${DV} 1,000 = ${d}`)} — ${d} דונם.`],
          };
        }
        case 'gridChoice': {
          const N = c.pick([8, 10, 12, 14, 18]);
          const fp = HM.range(1, 7).filter((x) => N % x === 0 && N / x <= 7 && N / x !== x);
          const W1 = c.pick(fp), H1 = N / W1;
          const rectAt = (w, h) => [[1, 1], [1 + w, 1], [1 + w, 1 + h], [1, 1 + h]];
          // מלבן שההיקף שלו N אבל השטח שונה
          const pp = HM.range(1, N / 2 - 1).map((x) => [x, N / 2 - x]).filter((q) => q[0] <= 7 && q[1] <= 6 && q[0] * q[1] !== N);
          const P1 = c.pick(pp);
          const near = HM.range(1, 7).map((x) => [x, Math.round((N + c.pick([-2, 2, 3, -3])) / x)]).filter((q) => q[1] >= 1 && q[1] <= 6 && q[0] * q[1] !== N && q[0] * q[1] !== P1[0] * P1[1]);
          const n1 = c.pick(near);
          const near2 = near.filter((q) => q[0] * q[1] !== n1[0] * n1[1]);
          const n2 = near2.length ? c.pick(near2) : [n1[0] + 1, n1[1]];
          const pic = (pts) => V.onGrid([pts], { w: 9, h: 8, cell: 17, maxw: 160 });
          return {
            type: 'choice', cols: 2, prompt: `לאיזו צורה יש ${b('שטח')} של ${N} משבצות?`,
            choices: [pic(rectAt(W1, H1)), pic(rectAt(P1[0], P1[1])), pic(rectAt(n1[0], n1[1])), pic(rectAt(n2[0], n2[1]))], answer: 0,
            hint: `שטח הוא מספר המשבצות ${b('בתוך')} הצורה, לא מספר הצלעות מסביב. אפשר לכפול שורות × עמודות.`,
            solution: [`${m(`${W1} ${T} ${H1} = ${N}`)} — זו הצורה.`, `לצורה של ${P1[0]} על ${P1[1]} יש ${b('היקף')} של ${N}, אבל השטח שלה רק ${P1[0] * P1[1]}.`],
          };
        }
        case 'compareRect': {
          const pairs = [[[1, 5], [3, 3]], [[2, 6], [4, 4]], [[1, 7], [3, 5]], [[2, 8], [5, 5]], [[3, 8], [4, 6]], [[2, 9], [6, 3]], [[4, 9], [6, 6]], [[3, 12], [4, 9]], [[2, 10], [4, 5]], [[5, 8], [4, 10]]];
          const [p1, p2] = c.shuffle(c.pick(pairs));
          const a1 = p1[0] * p1[1], a2 = p2[0] * p2[1];
          return {
            type: 'compare',
            prompt: `מלבן א: ${p1[0]} ס"מ על ${p1[1]} ס"מ. מלבן ב: ${p2[0]} ס"מ על ${p2[1]} ס"מ.<br>${c.g('השלם', 'השלימי')} את הסימן בין ${b('השטחים')} שלהם (משמאל — מלבן א):`,
            left: m(`${p1[0]} ${T} ${p1[1]}`), right: m(`${p2[0]} ${T} ${p2[1]}`), lv: a1, rv: a2,
            answer: a1 === a2 ? '=' : a1 < a2 ? '<' : '>',
            hint: `${c.g('חשב', 'חשבי')} את השטח של כל מלבן: אורך × רוחב. ${c.g('שים', 'שימי')} לב: גם אם ההיקפים שווים, השטחים יכולים להיות שונים.`,
            solution: [`מלבן א: ${m(`${p1[0]} ${T} ${p1[1]} = ${a1}`)} סמ"ר. מלבן ב: ${m(`${p2[0]} ${T} ${p2[1]} = ${a2}`)} סמ"ר.`, `ההיקפים: ${2 * (p1[0] + p1[1])} ס"מ ו-${2 * (p2[0] + p2[1])} ס"מ.`],
          };
        }
        case 'perimInv': {
          let l = c.rnd(5, 12), w = c.rnd(2, l - 1), P = 2 * (l + w);
          if (c.chance(0.5)) {
            const sc = rectObj(c, (s) => s.u === 'cm'), the = sc.the;
            [l, w] = dims(c, sc, 2); P = 2 * (l + w);
            return {
              type: 'number', answer: l * w, unit: 'סמ"ר',
              prompt: `היקף ${the} הוא ${P} ס"מ, ו${sc.fem ? 'אורכה' : 'אורכו'} ${l} ס"מ.<br>מה שטח ${the}?`,
              hint: `ההיקף הוא אורך + רוחב + אורך + רוחב. מה הסכום של אורך אחד ורוחב אחד?`,
              solution: [`אורך + רוחב = חצי מההיקף: ${m(`${P} ${DV} 2 = ${P / 2}`)}.`, `הרוחב: ${m(`${P / 2} − ${l} = ${w}`)} ס"מ.`, `השטח: ${m(`${l} ${T} ${w} = ${HM.fmt(l * w)}`)} סמ"ר.`],
            };
          }
          return {
            type: 'number', answer: 2 * (l + w), unit: 'ס"מ',
            prompt: `שטח של מלבן הוא ${l * w} סמ"ר, ואורכו ${l} ס"מ. מה ההיקף שלו?`,
            hint: 'קודם ' + c.g('מצא', 'מצאי') + ' את הרוחב: שטח : אורך.',
            solution: [`הרוחב: ${m(`${l * w} ${DV} ${l} = ${w}`)} ס"מ.`, `ההיקף: ${m(`${l} + ${w} + ${l} + ${w} = ${2 * (l + w)}`)} ס"מ.`],
          };
        }
        case 'carpetCost': {
          const sc = rectObj(c, (s) => s.cover), l = c.rnd(6, 14), w = c.rnd(3, l - 2), P = 2 * (l + w), p = c.pick([20, 25, 30, 40, 50]);
          return {
            type: 'number', answer: l * w * p, unit: '₪',
            prompt: `היקף ${sc.the} הוא ${P} מ', ו${sc.fem ? 'אורכה' : 'אורכו'} ${l} מ'. ${c.name} ${c.g('רוצה', 'רוצה')} לכסות ${sc.fem ? 'אותה' : 'אותו'} ב${sc.cover}, ומטר רבוע עולה ${p} ₪.<br>כמה יעלה הכיסוי?`,
            hint: `שלושה שלבים: ${c.g('מצא', 'מצאי')} את הרוחב מתוך ההיקף, ${c.g('חשב', 'חשבי')} את השטח, ואז את המחיר.`,
            solution: [`אורך + רוחב: ${m(`${P} ${DV} 2 = ${P / 2}`)}, ולכן הרוחב ${m(`${P / 2} − ${l} = ${w}`)} מ'.`, `השטח: ${m(`${l} ${T} ${w} = ${l * w}`)} מ"ר.`, `המחיר: ${m(`${l * w} ${T} ${p} = ${HM.fmt(l * w * p)}`)} ₪.`],
          };
        }
        case 'both': {
          const sh = gShape(c, c.pick(['L', 'U']));
          return {
            type: 'number', answer: [sh.area, sh.perim], labels: ['השטח (סמ"ר)', 'ההיקף (ס"מ)'],
            prompt: 'כל משבצת היא ריבוע שצלעו 1 ס"מ. מה השטח ומה ההיקף של הצורה?',
            visual: shapePic(sh),
            hint: `שטח — כמה משבצות ${b('בתוך')} הצורה. היקף — כמה צלעות של משבצות ${b('על הגבול')}.`,
            solution: [...sh.aSol, `השטח: ${sh.area} סמ"ר.`, ...sh.pSol, `ההיקף: ${sh.perim} ס"מ.`],
          };
        }
        case 'tfMis': {
          const A = [
            ['לשני מלבנים עם אותו היקף יש תמיד אותו שטח.', false, `מלבן 1 על 5 ומלבן 3 על 3: לשניהם היקף 12, אבל השטחים 5 ו-9.`],
            ['שטח מודדים ביחידות ריבועיות, כמו סמ"ר ומ"ר.', true, 'שטח הוא כמה ריבועים קטנים מכסים את הצורה.'],
            ['1 דונם = 1,000 מ"ר.', true, 'זו ההגדרה של דונם.'],
            ['1 דונם = 100 מ"ר.', false, 'דונם הוא 1,000 מ"ר.'],
            ['כדי למצוא את ההיקף של מלבן כופלים את האורך ברוחב.', false, 'אורך × רוחב הוא השטח. ההיקף הוא סכום כל הצלעות.'],
          ];
          const B = [
            ['אם השטח של צורה גדל, גם ההיקף שלה בהכרח גדל.', false, 'מלבן 1 על 8: שטח 8, היקף 18. ריבוע 3 על 3: שטח 9 (גדול יותר), היקף 12 (קטן יותר).'],
            ['לשתי צורות עם אותו שטח יכולים להיות היקפים שונים.', true, 'מלבן 1 על 4 וריבוע 2 על 2: לשניהם שטח 4, וההיקפים 10 ו-8.'],
            ['ריבוע שצלעו 1 מ\' הוא 100 סמ"ר.', false, `צלע של 1 מ' היא 100 ס"מ, ולכן השטח ${m(`100 ${T} 100 = 10,000`)} סמ"ר.`],
            ['שדה של 2,000 מ"ר הוא 2 דונם.', true, 'בכל דונם 1,000 מ"ר.'],
          ];
          const pool = level === 1 ? A : B.concat(A.slice(0, 1));
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('נסה', 'נסי')} לבדוק בדוגמה: ${c.g('צייר', 'ציירי')} שני מלבנים על דף משבצות, ו${c.g('חשב', 'חשבי')} שטח והיקף.`,
            solution: [why, tfSol(ans)],
          };
        }
      }
    },
  });

  /* ---------- שטח מקבילית ---------- */
  // מספרים למקבילית מדויקת: היסט, גובה, צלע נטויה (שלשה פיתגורית) ובסיס
  function parNums(c, level) {
    const pool = level === 1 ? PYTH.filter((t) => t[2] <= 10) : level === 2 ? PYTH.filter((t) => t[2] <= 15) : PYTH;
    const [off, h, s] = c.pick(pool);
    let bs = off + c.rnd(2, level === 1 ? 5 : 9); while (bs === s || bs === h) bs++;
    return { off, h, s, bs };
  }
  // ציור מקבילית עם בסיס, צלע נטויה וגובה מסומנים
  function parFig(N, o) {
    o = o || {};
    const k = Math.min(26, 250 / (N.bs + N.off));
    let pts = V.shapes.parallelogram(N.bs * k, N.h * k, N.off * k);
    if (o.flip) pts = pts.map((p) => [-p[0], p[1]]);
    const A = pts[0], F = [pts[0][0], N.h * k];
    const extra = o.hLabel != null ? hlab(A, F, o.hLabel, [o.flip ? -1 : 1, 0]) : '';
    return V.polygon(pts, { fill: 'f-l', labels: o.labels, sides: ['', '', o.base || '', o.slant || ''], heights: [{ from: 0, to: [3, 2] }], extra, maxw: o.maxw || 270 });
  }
  // מקבילית על דף משבצות (ביחידות משבצת). split: לצבוע בנפרד את המשולש שגוזרים
  const gridPar = (x0, bl, h, off, split) => (split
    ? [[[x0 + off, 1], [x0 + off + bl, 1], [x0 + bl, 1 + h], [x0 + off, 1 + h]], [[x0 + off, 1], [x0 + off, 1 + h], [x0, 1 + h]]]
    : [[[x0 + off, 1], [x0 + off + bl, 1], [x0 + bl, 1 + h], [x0, 1 + h]]]);
  const parCover = { 'הערוגה': 'דשא', 'מכלאת העיזים': 'נסורת', 'במת ההופעה': 'שטיח', 'השטיח המעופף': 'בד קטיפה' };

  HM.lesson({
    id: 'g-area-par-find',
    learn: (c) => [
      {
        title: 'מקבילית שהופכת למלבן',
        html: `${c.name}, ${c.g('קח', 'קחי')} מקבילית מנייר. ${c.g('גזור', 'גזרי')} ממנה את המשולש הצבוע, לאורך הגובה, ו${c.g('הזז', 'הזיזי')} אותו לצד השני.<br>מה קיבלת? ${b('מלבן!')}`,
        visual: V.onGrid(gridPar(1, 6, 4, 2, true), { w: 10, h: 6, cell: 28 }),
      },
      {
        title: 'אחרי ההזזה',
        html: `המשולש עבר לצד השני, ונוצר מלבן. ${b('השטח לא השתנה')} — לא הוספנו ולא הורדנו כלום.<br>• אורך המלבן = ${b('הבסיס')} של המקבילית.<br>• רוחב המלבן = ${b('הגובה')} של המקבילית.`,
        visual: V.onGrid([[[3, 1], [9, 1], [7, 5], [3, 5]], [[9, 1], [9, 5], [7, 5]]], { w: 10, h: 6, cell: 28 }),
      },
      {
        title: 'שטח המקבילית',
        html: `לכן: ${HM.hl('שטח מקבילית = בסיס × גובה')}<br>חשוב: הגובה הוא ${b('הגובה לאותו בסיס')} — הקטע המאונך לבסיס.`,
        visual: parFig({ bs: 6, h: 4, off: 3 }, { base: cm(6), hLabel: cm(4) }),
        steps: ['הבסיס: 6 ס"מ. הגובה לבסיס: 4 ס"מ.', `${m(`6 ${T} 4 = 24`)}`, 'שטח המקבילית: 24 סמ"ר ✔'],
      },
      {
        title: 'זהירות: הצלע הנטויה!',
        html: `הצלע הנטויה ${b('ארוכה')} מהגובה. אם ${c.g('תכפול', 'תכפלי')} את הבסיס בצלע הנטויה, ${c.g('תקבל', 'תקבלי')} שטח גדול מדי.<br>בציור: ${m(`8 ${T} 4 = 32`)} ✔ ולא ${m(`8 ${T} 5 = 40`)} ✘`,
        visual: parFig({ bs: 8, h: 4, off: 3 }, { base: cm(8), slant: cm(5), hLabel: cm(4) }),
        quiz: {
          type: 'choice', prompt: `מקבילית: בסיס 10 ס"מ, צלע נטויה 5 ס"מ, גובה לבסיס 3 ס"מ. מה השטח שלה?`,
          choices: ['30 סמ"ר', '50 סמ"ר', '30 ס"מ', '15 סמ"ר'], answer: 0,
          hint: 'שטח = בסיס × הגובה לבסיס. ' + c.g('שים', 'שימי') + ' לב גם ליחידה.',
          solution: [`${m(`10 ${T} 3 = 30`)}`, 'השטח: 30 סמ"ר. (5 ס"מ היא הצלע הנטויה — לא משתמשים בה.)'],
        },
      },
      {
        title: 'אותו בסיס, אותו גובה',
        html: `לשתי המקביליות יש בסיס של 4 משבצות וגובה של 3 משבצות. אחת "שוכבת" יותר מהשנייה — אבל ${b('השטח של שתיהן שווה')}: ${m(`4 ${T} 3 = 12`)}.`,
        visual: V.onGrid([gridPar(1, 4, 3, 1)[0], gridPar(7, 4, 3, 3)[0]], { w: 15, h: 5, cell: 22 }),
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['gridCount', 'cutMove', 'tf', 'compute', 'gridStory', 'storyCompute', 'storyCompute']
        : level === 2 ? ['compute', 'choiceMis', 'compareTwo', 'gridCount', 'cutMove', 'tf', 'storyCompute', 'gridStory', 'storyRect', 'storyCompute']
        : ['choiceMis', 'compareTwo', 'gridChoice', 'storyCompute', 'tf', 'storyRect', 'storyCost']);
      switch (kind) {
        case 'gridCount':
        case 'gridStory': {
          const h = c.rnd(2, 4), bl = c.rnd(3, 6), off = c.rnd(1, Math.min(3, bl - 1));
          const split = level === 1 && kind === 'gridCount';
          const vis = V.onGrid(gridPar(1, bl, h, off, split), { w: bl + off + 2, h: h + 2, cell: 26 });
          const sol = [`גוזרים את המשולש מצד אחד ומעבירים אותו לצד השני — מתקבל מלבן ${bl} על ${h}.`, `${m(`${bl} ${T} ${h} = ${bl * h}`)}`];
          if (kind === 'gridStory') {
            const sc = parObj(c), u = U[sc.u];
            return {
              type: 'number', answer: bl * h, unit: u.A,
              prompt: `${c.name} ${c.g('שרטט', 'שרטטה')} על דף משבצות תוכנית של ${sc.the}, ${sc.fem ? 'שהיא' : 'שהוא'} בצורת מקבילית. כל משבצת בתוכנית מייצגת ${sc.u === 'm' ? 'מטר רבוע אחד' : 'סנטימטר רבוע אחד'}.<br>מה השטח?`,
              visual: vis,
              hint: `${c.g('דמיין', 'דמייני')} שגוזרים את המשולש מצד אחד ומעבירים אותו לצד השני. איזה מלבן מתקבל?`,
              solution: [...sol, `השטח: ${bl * h} ${u.A}.`],
            };
          }
          return {
            type: 'number', answer: bl * h, unit: 'סמ"ר',
            prompt: `כל משבצת היא ריבוע של 1 סמ"ר. מה שטח המקבילית?`,
            visual: vis,
            hint: split ? `${c.g('הזז', 'הזיזי')} בדמיון את המשולש הצבוע לצד השני. ${c.g('ספור', 'ספרי')} את המשבצות במלבן שמתקבל.` : `${c.g('דמיין', 'דמייני')} שגוזרים את המשולש מצד אחד ומעבירים אותו לצד השני. איזה מלבן מתקבל?`,
            solution: [...sol, `שטח המקבילית: ${bl * h} סמ"ר.`],
          };
        }
        case 'cutMove': {
          const N = parNums(c, level);
          return {
            type: 'choice', prompt: 'גוזרים מהמקבילית משולש לאורך הגובה, ומזיזים אותו לצד השני כך שמתקבל מלבן. מה המידות של המלבן?',
            visual: parFig(N, { base: cm(N.bs), slant: cm(N.s), hLabel: cm(N.h), flip: c.chance(0.5) }),
            choices: [`${N.bs} ס"מ על ${N.h} ס"מ`, `${N.bs} ס"מ על ${N.s} ס"מ`, `${N.s} ס"מ על ${N.h} ס"מ`], answer: 0,
            hint: 'אורך המלבן הוא הבסיס של המקבילית. ורוחב המלבן — הצלע הנטויה או הגובה?',
            solution: [`אורך המלבן שווה לבסיס: ${N.bs} ס"מ.`, `רוחב המלבן שווה לגובה: ${N.h} ס"מ (לא לצלע הנטויה).`],
          };
        }
        case 'compute': {
          const N = parNums(c, level);
          return {
            type: 'number', answer: N.bs * N.h, unit: 'סמ"ר', prompt: 'מה שטח המקבילית?',
            visual: parFig(N, { base: cm(N.bs), slant: cm(N.s), hLabel: cm(N.h), flip: c.chance(0.5) }),
            hint: `שטח מקבילית = בסיס × הגובה לבסיס. איזה מספר בציור הוא הגובה?`,
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${N.bs * N.h}`)}`, `השטח: ${N.bs * N.h} סמ"ר. (${N.s} ס"מ היא הצלע הנטויה — לא משתמשים בה.)`],
          };
        }
        case 'choiceMis': {
          const N = parNums(c, level), A = N.bs * N.h;
          const ch = HM.numChoices(A, [N.bs * N.s, 2 * (N.bs + N.s), (A % 2 ? N.bs + N.h : A / 2), N.bs + N.s + N.h], 4, sqcm);
          return {
            type: 'choice', prompt: `במקבילית הבסיס ${N.bs} ס"מ, הצלע הנטויה ${N.s} ס"מ, והגובה לבסיס ${N.h} ס"מ. מה שטח המקבילית?`,
            choices: ch.choices, answer: ch.answer,
            hint: 'שטח מקבילית = בסיס × הגובה לבסיס. ' + c.g('בדוק', 'בדקי') + ' איזה נתון מיותר.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${A}`)}`, `השטח: ${A} סמ"ר.`, `${m(`${N.bs} ${T} ${N.s}`)} היא טעות נפוצה: הצלע הנטויה אינה הגובה.`],
          };
        }
        case 'compareTwo': {
          const bA = c.rnd(3, 5), hA = c.rnd(2, 4), oA = c.rnd(0, 2);
          let bB = bA, hB = hA;
          if (c.chance(0.5)) { if (c.chance(0.5)) bB = bA + c.pick([-1, 1]); else hB = hA + c.pick([-1, 1]); }
          const oB = c.rnd(oA === 0 ? 2 : 0, 3);
          const xB = 1 + bA + oA + 2, W = xB + bB + oB + 1, H = Math.max(hA, hB) + 2;
          const extra = gridText([[1 + oA + bA / 2, 0.45, 'א'], [xB + oB + bB / 2, 0.45, 'ב']]);
          const aA = bA * hA, aB = bB * hB;
          return {
            type: 'compare', prompt: `${c.g('השווה', 'השווי')} בין השטחים של מקבילית א ומקבילית ב:`,
            visual: V.onGrid([gridPar(1, bA, hA, oA)[0].map((p) => [p[0], p[1] + (H - 2 - hA)]), gridPar(xB, bB, hB, oB)[0].map((p) => [p[0], p[1] + (H - 2 - hB)])], { w: W, h: H, cell: Math.min(24, Math.floor(300 / W)), extra }),
            left: 'א', right: 'ב', lv: aA, rv: aB, answer: aA === aB ? '=' : aA < aB ? '<' : '>',
            hint: `${c.g('ספור', 'ספרי')} את הבסיס ואת הגובה של כל מקבילית (בתוך המשבצות), ו${c.g('חשב', 'חשבי')} בסיס × גובה. השיפוע לא משנה!`,
            solution: [`מקבילית א: ${m(`${bA} ${T} ${hA} = ${aA}`)}. מקבילית ב: ${m(`${bB} ${T} ${hB} = ${aB}`)}.`, aA === aB ? 'השטחים שווים.' : `השטח של מקבילית ${aA > aB ? 'א' : 'ב'} גדול יותר.`],
          };
        }
        case 'gridChoice': {
          const N = c.pick([6, 8, 12]);
          const fp = HM.range(2, 6).filter((x) => N % x === 0 && N / x <= 4);
          const bl = c.pick(fp), h = N / bl;
          const opts = [[bl, h], [bl + 1, h], [bl, h + 1 <= 4 ? h + 1 : h - 1], [bl - 1 >= 2 ? bl - 1 : bl + 2, h]].filter((q, i, arr) => i === 0 || q[0] * q[1] !== N);
          const uniq = []; opts.forEach((q) => { if (!uniq.some((u2) => u2[0] * u2[1] === q[0] * q[1])) uniq.push(q); });
          const pic = (q) => { const off = c.rnd(1, 3); return V.onGrid(gridPar(1, q[0], q[1], off), { w: q[0] + off + 2, h: 6, cell: 18, maxw: 160 }); };
          return {
            type: 'choice', cols: 2, prompt: `לאיזו מקבילית יש שטח של ${N} משבצות?`,
            choices: uniq.map(pic), answer: 0,
            hint: `לכל מקבילית ${c.g('ספור', 'ספרי')} את הבסיס ואת הגובה במשבצות, ו${c.g('חשב', 'חשבי')} בסיס × גובה.`,
            solution: [`במקבילית הנכונה: בסיס ${bl}, גובה ${h}: ${m(`${bl} ${T} ${h} = ${N}`)}.`],
          };
        }
        case 'storyCompute': {
          const sc = parObj(c), u = U[sc.u], N = parNums(c, level), A = N.bs * N.h;
          return {
            type: 'number', answer: A, unit: u.A,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית. ${c.name} ${c.g('מדד', 'מדדה')}: הבסיס ${N.bs} ${u.L}, הצלע הנטויה ${N.s} ${u.L}, והגובה לבסיס ${N.h} ${u.L}.<br>מה שטח ${sc.the}?`,
            visual: level === 1 ? parFig(N, { base: `${N.bs} ${u.L}`, slant: `${N.s} ${u.L}`, hLabel: `${N.h} ${u.L}` }) : undefined,
            hint: 'שטח מקבילית = בסיס × הגובה לבסיס. אחד הנתונים מיותר.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${A}`)}`, `השטח: ${A} ${u.A}. (הצלע הנטויה אינה הגובה.)`],
          };
        }
        case 'storyRect': {
          const sc = parObj(c), u = U[sc.u], a = c.rnd(5, 14), w = c.rnd(2, a - 2);
          const askH = c.chance(0.5);
          return {
            type: 'number', answer: askH ? w : a * w, unit: askH ? u.L : u.A,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית. ${c.name} ${c.g('גזר', 'גזרה')} ${sc.fem ? 'ממנה' : 'ממנו'} משולש לאורך הגובה ${c.g('והעביר', 'והעבירה')} אותו לצד השני, וכך ${c.g('קיבל', 'קיבלה')} מלבן שאורכו ${a} ${u.L} ורוחבו ${w} ${u.L}.<br>${askH ? 'מה הגובה של המקבילית?' : 'מה שטח המקבילית?'}`,
            hint: askH ? 'רוחב המלבן שווה לאחד הקטעים של המקבילית. לאיזה?' : 'כשגוזרים ומעבירים, השטח משתנה?',
            solution: askH ? ['אורך המלבן שווה לבסיס של המקבילית, ורוחבו שווה לגובה.', `הגובה: ${w} ${u.L}.`] : ['השטח לא משתנה כשמעבירים חלק ממקום למקום.', `${m(`${a} ${T} ${w} = ${a * w}`)}`, `שטח המקבילית: ${a * w} ${u.A}.`],
          };
        }
        case 'storyCost': {
          const sc = parObj(c), cover = parCover[sc.the] || 'דשא';
          const useM = !!parCover[sc.the];
          const N = parNums(c, 2), p = c.pick([15, 20, 25, 30, 40]), A = N.bs * N.h;
          const the = useM ? sc.the : 'הערוגה', fem = useM ? sc.fem : true;
          return {
            type: 'number', answer: A * p, unit: '₪',
            prompt: `${the} ${fem ? 'היא' : 'הוא'} בצורת מקבילית: הבסיס ${N.bs} מ', הצלע הנטויה ${N.s} מ', והגובה לבסיס ${N.h} מ'. ${c.name} ${c.g('רוצה', 'רוצה')} לכסות ${fem ? 'אותה' : 'אותו'} ב${cover}. כל מ"ר עולה ${p} ₪.<br>כמה ${c.g('ישלם', 'תשלם')} ${c.name}?`,
            hint: `קודם ${c.g('חשב', 'חשבי')} את השטח (בסיס × גובה), ואז ${c.g('כפול', 'כפלי')} במחיר של מ"ר אחד.`,
            solution: [`השטח: ${m(`${N.bs} ${T} ${N.h} = ${A}`)} מ"ר.`, `המחיר: ${m(`${A} ${T} ${p} = ${HM.fmt(A * p)}`)} ₪.`],
          };
        }
        case 'tf': {
          const A = [
            ['כשגוזרים משולש מהמקבילית ומעבירים אותו לצד השני, השטח לא משתנה.', true, 'לא הוספנו ולא הורדנו שום חלק — רק הזזנו אותו.'],
            ['המלבן שמתקבל מהמקבילית ארוך כמו הבסיס שלה, ורחב כמו הגובה שלה.', true, 'כך בדיוק נוצר המלבן.'],
            ['רוחב המלבן שמתקבל שווה לצלע הנטויה של המקבילית.', false, 'רוחב המלבן הוא הגובה, לא הצלע הנטויה.'],
          ];
          const B = [
            ['שטח מקבילית שווה למכפלה של שתי הצלעות שלה.', false, 'שטח = בסיס × גובה. הצלע הנטויה ארוכה מהגובה.'],
            ['לשתי מקביליות עם אותו בסיס ואותו גובה יש אותו שטח.', true, 'שתיהן הופכות למלבן עם אותן מידות.'],
            ['מקבילית ומלבן עם אותו בסיס ואותו גובה שווים בשטחם.', true, 'המקבילית הופכת בגזירה והעברה בדיוק למלבן הזה.'],
            ['ככל שהמקבילית "שוכבת" יותר (עם אותו בסיס ואותו גובה), השטח שלה גדל.', false, 'השטח תלוי רק בבסיס ובגובה.'],
          ];
          const pool = level === 1 ? A : level === 2 ? A.concat(B) : B;
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('דמיין', 'דמייני')} את הגזירה וההעברה: מה הופך לאורך המלבן, ומה לרוחב שלו?`,
            solution: [why, tfSol(ans)],
          };
        }
      }
    },
  });

  // שני גבהים במקבילית: שטח A, צלעות a (ארוכה) ו-cc, גבהים h1 (ל-a) ו-h2 (ל-cc)
  function twoHeights(c) {
    for (let t = 0; t < 60; t++) {
      const A = c.pick([24, 30, 36, 40, 48, 60, 72, 80, 84, 90, 96, 120]);
      const ds = HM.divisors(A).filter((d) => d >= 3 && d <= 16 && A / d >= 2);
      const a = c.pick(ds), cc = c.pick(ds), h1 = A / a, h2 = A / cc;
      if (a > cc && h1 < cc && h2 < a && a !== h1 && cc !== h2 && h1 !== h2 && a !== h2 && cc !== h1) return { A, a, cc, h1, h2 };
    }
    return { A: 24, a: 8, cc: 6, h1: 3, h2: 4 };
  }
  const twoHFig = (T2) => {
    const off = Math.sqrt(T2.cc * T2.cc - T2.h1 * T2.h1), k = Math.min(22, 230 / (T2.a + off));
    return V.polygon(V.shapes.parallelogram(T2.a * k, T2.h1 * k, off * k), { fill: 'f-l', sides: ['', '', cm(T2.a), cm(T2.cc)], heights: [{ from: 0, to: [3, 2], label: String(T2.h1) }, { from: 1, to: [0, 3], label: '?', cls: 's-b' }], maxw: 270 });
  };

  HM.lesson({
    id: 'g-area-par',
    learn: (c) => [
      {
        title: 'הנוסחה',
        html: `${c.name}, ${c.g('זוכר', 'זוכרת')} איך הפכנו מקבילית למלבן? מכאן הנוסחה:<br>${HM.hl('שטח מקבילית = בסיס × גובה')}<br>הגובה חייב להיות ${b('הגובה לאותו בסיס')}.`,
        visual: parFig({ bs: 7, h: 4, off: 3 }, { base: 'בסיס', hLabel: 'גובה' }),
      },
      {
        title: 'כל צלע יכולה להיות בסיס',
        html: `במקבילית שבציור הצלעות הן 10 ס"מ ו-6 ס"מ.<br>• בסיס 10 וגובה 3: ${m(`10 ${T} 3 = 30`)}<br>• בסיס 6 וגובה 5: ${m(`6 ${T} 5 = 30`)}<br>אותו שטח! רק צריך לזווג כל בסיס ${b('עם הגובה שלו')}.`,
        visual: V.polygon(V.shapes.parallelogram(200, 60, Math.sqrt(27) * 20), { fill: 'f-l', sides: ['', '', cm(10), cm(6)], heights: [{ from: 0, to: [3, 2], label: '3' }, { from: 1, to: [0, 3], label: '5', cls: 's-b' }], maxw: 280 }),
      },
      {
        title: 'דוגמה פתורה',
        html: 'במקבילית הבסיס 12 ס"מ, הצלע הנטויה 7 ס"מ, והגובה לבסיס 5 ס"מ. מה השטח?',
        steps: ['בוחרים בסיס וגובה שמתאימים זה לזה: 12 ס"מ ו-5 ס"מ.', `${m(`12 ${T} 5 = 60`)}`, 'השטח: 60 סמ"ר. את 7 ס"מ לא צריך — זו הצלע הנטויה ✔'],
      },
      {
        title: 'מציאת גובה או בסיס',
        html: `${c.g('אתה יודע', 'את יודעת')} את השטח ואת הבסיס? אז ${HM.hl('גובה = שטח : בסיס')}.<br>ובאותו אופן: ${HM.hl('בסיס = שטח : גובה')}.`,
        steps: ['שטח מקבילית 48 סמ"ר, והבסיס 8 ס"מ. מה הגובה?', `${m(`8 ${T} ? = 48`)}`, `${m(`48 ${DV} 8 = 6`)} — הגובה 6 ס"מ.`, `בדיקה: ${m(`8 ${T} 6 = 48`)} ✔`],
      },
      {
        title: 'מה קורה כשמכפילים?',
        html: `• מכפילים את ${b('הבסיס')} פי 2, והגובה לא משתנה — השטח גדל ${b('פי 2')}.<br>• מכפילים ${b('גם')} את הבסיס ${b('וגם')} את הגובה פי 2 — השטח גדל ${b('פי 4')}!`,
        visual: V.onGrid([gridPar(1, 2, 2, 1)[0], gridPar(6, 4, 4, 2)[0]], { w: 13, h: 6, cell: 22 }),
        quiz: {
          type: 'choice', keep: true, prompt: 'מכפילים את הבסיס של מקבילית פי 3, והגובה לא משתנה. מה קורה לשטח?',
          choices: ['לא משתנה', 'גדל פי 2', 'גדל פי 3', 'גדל פי 6'], answer: 2,
          hint: 'שטח = בסיס × גובה. ' + c.g('נסה', 'נסי') + ' עם מספרים: בסיס 2, גובה 5.',
          solution: [`לפני: ${m(`2 ${T} 5 = 10`)}. אחרי: ${m(`6 ${T} 5 = 30`)}.`, 'השטח גדל פי 3.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['calcSlot', 'calcFig', 'mis', 'story', 'compare', 'story', 'story']
        : level === 2 ? ['calcFig', 'inverseH', 'storyInvH', 'double', 'mis', 'compare', 'story', 'storyDouble']
        : ['otherHeight', 'inverseB', 'double', 'storyOther', 'compare', 'mis', 'storyCost', 'storyInvH']);
      switch (kind) {
        case 'calcSlot': {
          const bs = c.rnd(3, 12), h = c.rnd(2, 9);
          return {
            type: 'number', answer: bs * h,
            prompt: `${c.g('השלם', 'השלימי')} את חישוב השטח של המקבילית (בסמ"ר):<div class="big">${m(`${bs} ${T} ${h} = ` + HM.slot(0))}</div>`,
            visual: parFig({ bs, h, off: Math.min(3, bs - 1) }, { base: cm(bs), hLabel: cm(h), maxw: 240 }),
            hint: 'שטח מקבילית = בסיס × גובה.',
            solution: [`${m(`${bs} ${T} ${h} = ${bs * h}`)}`, `השטח: ${bs * h} סמ"ר.`],
          };
        }
        case 'calcFig': {
          const N = parNums(c, level);
          return {
            type: 'number', answer: N.bs * N.h, unit: 'סמ"ר', prompt: 'מה שטח המקבילית?',
            visual: parFig(N, { base: cm(N.bs), slant: cm(N.s), hLabel: cm(N.h), flip: c.chance(0.5) }),
            hint: 'שטח מקבילית = בסיס × הגובה לבסיס. הצלע הנטויה אינה הגובה.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${N.bs * N.h}`)}`, `השטח: ${N.bs * N.h} סמ"ר.`],
          };
        }
        case 'mis': {
          const N = parNums(c, level), A = N.bs * N.h;
          const ch = HM.numChoices(A, [N.bs * N.s, (A % 2 ? N.bs + N.h + N.s : A / 2), 2 * (N.bs + N.s), N.bs + N.h], 4, sqcm);
          return {
            type: 'choice', prompt: `${c.name} ${c.g('מחשב', 'מחשבת')} שטח של מקבילית: הבסיס ${N.bs} ס"מ, הצלע הנטויה ${N.s} ס"מ, והגובה לבסיס ${N.h} ס"מ. מה התשובה הנכונה?`,
            choices: ch.choices, answer: ch.answer,
            hint: 'שטח מקבילית = בסיס × הגובה לבסיס. ' + c.g('בדוק', 'בדקי') + ' שלא השתמשת בצלע הנטויה.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${A}`)}`, `השטח: ${A} סמ"ר.`],
          };
        }
        case 'story': {
          const sc = parObj(c), u = U[sc.u], N = parNums(c, level === 1 ? 1 : 2), A = N.bs * N.h;
          return {
            type: 'number', answer: A, unit: u.A,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית. ${level === 1 ? `הבסיס ${N.bs} ${u.L}, והגובה לבסיס ${N.h} ${u.L}` : `הבסיס ${N.bs} ${u.L}, הצלע הנטויה ${N.s} ${u.L}, והגובה לבסיס ${N.h} ${u.L}`}.<br>מה שטח ${sc.the}?`,
            hint: 'שטח מקבילית = בסיס × הגובה לבסיס.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${A}`)}`, `השטח: ${A} ${u.A}.`],
          };
        }
        case 'compare': {
          let b1 = c.rnd(4, 12), h1 = c.rnd(2, 8), b2, h2;
          if (c.chance(0.4)) { const A = b1 * h1, ds = HM.divisors(A).filter((d) => d !== b1 && d >= 2 && A / d >= 2 && d <= 15); if (ds.length) { b2 = c.pick(ds); h2 = A / b2; } }
          if (!b2) { b2 = c.rnd(4, 12); h2 = c.rnd(2, 8); }
          const a1 = b1 * h1, a2 = b2 * h2, ans = a1 === a2 ? '=' : a1 < a2 ? '<' : '>';
          if (level === 1) {
            return {
              type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן בין השטחים של שתי מקביליות (בסיס × גובה):`,
              left: m(`${b1} ${T} ${h1}`), right: m(`${b2} ${T} ${h2}`), lv: a1, rv: a2, answer: ans,
              hint: `${c.g('חשב', 'חשבי')} כל מכפלה בנפרד, ואז ${c.g('השווה', 'השווי')}.`,
              solution: [`${m(`${b1} ${T} ${h1} = ${a1}`)}, ${m(`${b2} ${T} ${h2} = ${a2}`)}.`],
            };
          }
          const s1 = h1 + c.rnd(1, 4), s2 = h2 + c.rnd(1, 4);
          return {
            type: 'compare', prompt: `מקבילית א: בסיס ${b1} ס"מ, צלע נטויה ${s1} ס"מ, גובה לבסיס ${h1} ס"מ.<br>מקבילית ב: בסיס ${b2} ס"מ, צלע נטויה ${s2} ס"מ, גובה לבסיס ${h2} ס"מ.<br>${c.g('השווה', 'השווי')} בין השטחים:`,
            left: 'א', right: 'ב', lv: a1, rv: a2, answer: ans,
            hint: 'שטח = בסיס × גובה. הצלעות הנטויות לא משפיעות על השטח.',
            solution: [`א: ${m(`${b1} ${T} ${h1} = ${a1}`)} סמ"ר. ב: ${m(`${b2} ${T} ${h2} = ${a2}`)} סמ"ר.`],
          };
        }
        case 'inverseH':
        case 'inverseB':
        case 'storyInvH': {
          const bs = c.rnd(4, 14); let h = c.rnd(3, 12); if (h === bs) h++;
          const A = bs * h, findH = kind !== 'inverseB';
          let pre = 'שטח של מקבילית הוא', unitA = 'סמ"ר', unitL = 'ס"מ', post = '';
          if (kind === 'storyInvH') { const sc = parObj(c); unitA = U[sc.u].A; unitL = U[sc.u].L; pre = `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית, ${sc.fem ? 'ושטחה' : 'ושטחו'}`; }
          post = findH ? `הבסיס ${bs} ${unitL}. מה הגובה לבסיס?` : `הגובה לבסיס ${h} ${unitL}. מה אורך הבסיס?`;
          return {
            type: 'number', answer: findH ? h : bs, unit: unitL,
            prompt: `${pre} ${A} ${unitA}.<br>${post}`,
            hint: findH ? 'בסיס × גובה = שטח. איזה מספר כופלים בבסיס כדי לקבל את השטח?' : 'בסיס × גובה = שטח. איזה מספר כופלים בגובה כדי לקבל את השטח?',
            solution: findH ? [`${m(`${bs} ${T} ? = ${A}`)}`, `${m(`${A} ${DV} ${bs} = ${h}`)}`, `הגובה: ${h} ${unitL}.`] : [`${m(`? ${T} ${h} = ${A}`)}`, `${m(`${A} ${DV} ${h} = ${bs}`)}`, `הבסיס: ${bs} ${unitL}.`],
          };
        }
        case 'double': {
          const v = c.pick([
            ['מכפילים את הבסיס פי 2, והגובה לא משתנה.', 1, 2, 1],
            ['מכפילים גם את הבסיס וגם את הגובה פי 2.', 3, 2, 2],
            ['מכפילים את הבסיס פי 2, ומקטינים את הגובה לחצי.', 0, 2, 0.5],
            ['מכפילים את הגובה פי 3, והבסיס לא משתנה.', 2, 1, 3],
          ].concat(level === 3 ? [['מכפילים את הבסיס פי 3, ואת הגובה פי 2.', 4, 3, 2], ['מכפילים את הבסיס פי 4, ומקטינים את הגובה לחצי.', 1, 4, 0.5]] : []));
          const bs = 4, h = 6, a0 = bs * h, a1 = bs * v[2] * h * v[3];
          return {
            type: 'choice', keep: true, prompt: `${v[0]} מה קורה לשטח של המקבילית?`,
            choices: ['השטח לא משתנה', 'השטח גדל פי 2', 'השטח גדל פי 3', 'השטח גדל פי 4', 'השטח גדל פי 6'], answer: v[1],
            hint: `${c.g('נסה', 'נסי')} עם מספרים: בסיס ${bs}, גובה ${h}. ${c.g('חשב', 'חשבי')} את השטח לפני ואחרי.`,
            solution: [`לפני: ${m(`${bs} ${T} ${h} = ${a0}`)}.`, `אחרי: ${m(`${bs * v[2]} ${T} ${h * v[3]} = ${a1}`)}.`, ['השטח לא משתנה.', 'השטח גדל פי 2.', 'השטח גדל פי 3.', 'השטח גדל פי 4.', 'השטח גדל פי 6.'][v[1]]],
          };
        }
        case 'storyDouble': {
          const sc = parObj(c), u = U[sc.u], f = c.friend(), bs = c.rnd(3, 9), h = c.rnd(2, 6), both = c.chance(0.5);
          const A1 = bs * h, A2 = both ? 4 * A1 : 2 * A1;
          return {
            type: 'number', answer: A2, unit: u.A,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית: בסיס ${bs} ${u.L} וגובה ${h} ${u.L}. ${f.name} ${f.g('רוצה', 'רוצה')} להכין עוד ${sc.fem ? 'אחת כזאת' : 'אחד כזה'}, אבל עם בסיס כפול${both ? ' וגובה כפול' : ' ואותו גובה'}.<br>מה יהיה השטח של המקבילית החדשה?`,
            hint: `${c.g('חשב', 'חשבי')} את הבסיס והגובה החדשים, ואז בסיס × גובה.`,
            solution: [`בסיס חדש: ${m(`${bs} ${T} 2 = ${2 * bs}`)}. גובה: ${both ? m(`${h} ${T} 2 = ${2 * h}`) : h}.`, `${m(`${2 * bs} ${T} ${both ? 2 * h : h} = ${A2}`)}`, `השטח: ${A2} ${u.A} — פי ${both ? 4 : 2} מהשטח המקורי (${A1}).`],
          };
        }
        case 'otherHeight':
        case 'storyOther': {
          const T2 = twoHeights(c);
          const sol = [`השטח: ${m(`${T2.a} ${T} ${T2.h1} = ${T2.A}`)}.`, `אותו שטח עם הצלע השנייה: ${m(`${T2.cc} ${T} ? = ${T2.A}`)}.`, `${m(`${T2.A} ${DV} ${T2.cc} = ${T2.h2}`)}`];
          if (kind === 'storyOther') {
            const sc = parObj(c), u = U[sc.u];
            return {
              type: 'number', answer: T2.h2, unit: u.L,
              prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת מקבילית שאורכי צלעותיה ${T2.a} ${u.L} ו-${T2.cc} ${u.L}. הגובה לצלע של ${T2.a} ${u.L} הוא ${T2.h1} ${u.L}.<br>מה הגובה לצלע של ${T2.cc} ${u.L}?`,
              hint: `קודם ${c.g('מצא', 'מצאי')} את השטח. אותו שטח אפשר לחשב גם עם הצלע השנייה והגובה שלה.`,
              solution: [...sol, `הגובה: ${T2.h2} ${u.L}.`],
            };
          }
          return {
            type: 'number', answer: T2.h2, unit: 'ס"מ',
            prompt: `במקבילית שבציור הצלעות ${T2.a} ס"מ ו-${T2.cc} ס"מ. הגובה לצלע של ${T2.a} ס"מ הוא ${T2.h1} ס"מ.<br>מה אורך הגובה לצלע של ${T2.cc} ס"מ?`,
            visual: twoHFig(T2),
            hint: `קודם ${c.g('מצא', 'מצאי')} את השטח. אותו שטח אפשר לחשב גם עם הצלע השנייה והגובה שלה.`,
            solution: [...sol, `הגובה: ${T2.h2} ס"מ.`],
          };
        }
        case 'storyCost': {
          const sc = parObj(c), useM = !!parCover[sc.the], the = useM ? sc.the : 'הערוגה', fem = useM ? sc.fem : true;
          const bs = c.rnd(6, 15), h = c.rnd(3, 9), p = c.pick([15, 20, 25, 30]), have = c.rnd(2, Math.floor((bs * h) / 2));
          const A = bs * h, need = A - have;
          return {
            type: 'number', answer: need * p, unit: '₪',
            prompt: `${the} ${fem ? 'היא' : 'הוא'} בצורת מקבילית: בסיס ${bs} מ' וגובה ${h} מ'. ${c.name} ${c.g('רוצה', 'רוצה')} לכסות ${fem ? 'אותה' : 'אותו'} ב${parCover[the] || 'דשא'}. כבר יש ${c.g('לו', 'לה')} ${have} מ"ר של ${parCover[the] || 'דשא'}, ואת השאר ${c.g('הוא צריך', 'היא צריכה')} לקנות. כל מ"ר עולה ${p} ₪.<br>כמה ${c.g('ישלם', 'תשלם')} ${c.name}?`,
            hint: `שלושה שלבים: השטח, כמה מ"ר חסרים, והמחיר.`,
            solution: [`השטח: ${m(`${bs} ${T} ${h} = ${A}`)} מ"ר.`, `חסרים: ${m(`${A} − ${have} = ${need}`)} מ"ר.`, `המחיר: ${m(`${need} ${T} ${p} = ${HM.fmt(need * p)}`)} ₪.`],
          };
        }
      }
    },
  });

  /* ---------- שטח משולש ---------- */
  // מספרים למשולש מדויק: הקודקוד העליון בהיסט x מהקודקוד השמאלי, גובה h, צלע שמאלית s (שלשה פיתגורית), בסיס bs. bs × h זוגי
  function triNums(c, level, obtuse) {
    const pool = level === 1 ? PYTH.filter((t) => t[2] <= 10) : level === 2 ? PYTH.filter((t) => t[2] <= 15) : PYTH;
    const [x, h, s] = c.pick(pool);
    let bs = obtuse ? c.rnd(3, 10) : x + c.rnd(2, level === 1 ? 5 : 8);
    while (bs === s || bs === h || (bs * h) % 2) bs++;
    return { x, h, s, bs, A: (bs * h) / 2, obtuse: !!obtuse };
  }
  function triFig(N, o) {
    o = o || {};
    const k = Math.min(26, 250 / (N.bs + (N.obtuse ? N.x : 0)));
    const ax = N.obtuse ? -N.x * k : N.x * k;
    let pts = [[ax, 0], [0, N.h * k], [N.bs * k, N.h * k]];
    if (o.flip) pts = pts.map((p) => [-p[0], p[1]]);
    const A = pts[0], F = [A[0], N.h * k];
    const wideLeft = N.obtuse || N.x >= N.bs / 2;
    const dir = [(wideLeft ? -1 : 1) * (o.flip ? -1 : 1), 0];
    return V.polygon(pts, { fill: 'f-l', labels: o.labels, sides: [o.slant || '', o.base || '', ''], heights: [{ from: 0, to: [1, 2] }], extra: o.hLabel != null ? hlab(A, F, o.hLabel, dir) : '', maxw: o.maxw || 260 });
  }
  const triScene = (c) => c.scene([
    { tags: ['sport'], the: 'דגל הקבוצה', fem: false, u: 'cm' }, { tags: ['baking'], the: 'חתיכת הפיצה', fem: true, u: 'cm' },
    { tags: ['nature', 'sport'], the: 'המפרש של הסירה', fem: false, u: 'm' }, { tags: ['animals'], the: 'סנפיר הכריש בדגם', fem: false, u: 'cm' },
    { tags: ['space'], the: 'כנף החללית בדגם', fem: true, u: 'cm' }, { tags: ['music'], the: 'השלט של להקת בית הספר', fem: false, u: 'cm' },
    { tags: ['reading'], the: 'הסימנייה', fem: true, u: 'cm' }, { tags: ['games'], the: 'הסמל של המשחק', fem: false, u: 'cm' },
    { tags: ['art'], the: 'המדבקה', fem: true, u: 'cm' }, { tags: ['tech'], the: 'כנף הרחפן', fem: true, u: 'cm' },
    { tags: ['kpop'], the: 'הדגלון של מועדון המעריצים', fem: false, u: 'cm' }, { tags: ['magic'], the: 'הדגל של בית הקוסמים', fem: false, u: 'cm' },
    { tags: ['squishy'], the: 'סקוויש פרוסת האבטיח', fem: false, u: 'cm' },
  ]);
  const triMulti = (c) => c.scene([
    { tags: ['kpop'], pl: 'דגלונים משולשים למועדון המעריצים', fem: false, mat: 'בד' }, { tags: ['magic'], pl: 'דגלים משולשים לבית הקוסמים', fem: false, mat: 'בד' },
    { tags: ['art'], pl: 'מדבקות משולשות', fem: true, mat: 'נייר מדבקה' }, { tags: ['reading'], pl: 'סימניות משולשות', fem: true, mat: 'קרטון' },
    { tags: ['sport'], pl: 'דגלוני עידוד משולשים', fem: false, mat: 'בד' }, { tags: ['baking'], pl: 'משולשי בצק לבורקסים', fem: false, mat: 'בצק' },
    { tags: ['squishy'], pl: 'תוויות משולשות לסקווישים', fem: true, mat: 'נייר' }, { tags: ['music'], pl: 'קישוטים משולשים לבמה', fem: false, mat: 'נייר צבעוני' },
    { tags: ['nature', 'animals', 'space', 'games', 'tech'], pl: 'כנפיים משולשות לדגמים', fem: true, mat: 'קרטון' },
  ]);

  HM.lesson({
    id: 'g-area-tri',
    learn: (c) => [
      {
        title: 'חצי מלבן',
        html: `${c.name}, ${c.g('קח', 'קחי')} מלבן ו${c.g('גזור', 'גזרי')} אותו לאורך האלכסון. קיבלת שני משולשים ${b('זהים')}.<br>לכן השטח של כל משולש הוא ${b('חצי')} משטח המלבן: ${m(`6 ${T} 4 : 2 = 12`)}.`,
        visual: V.onGrid([[[1, 1], [7, 1], [7, 5]], [[1, 1], [7, 5], [1, 5]]], { w: 8, h: 6, cell: 28 }),
      },
      {
        title: 'כל משולש — חצי מקבילית',
        html: `גם משולש "רגיל" אפשר להשלים: מניחים לידו משולש ${b('זהה')}, הפוך, ומקבלים ${b('מקבילית')} עם אותו בסיס ואותו גובה.<br>המשולש הוא בדיוק חצי מהמקבילית.`,
        visual: V.onGrid([[[3, 1], [1, 5], [7, 5]], [[3, 1], [9, 1], [7, 5]]], { w: 10, h: 6, cell: 28 }),
      },
      {
        title: 'הנוסחה',
        html: `${HM.hl('שטח משולש = בסיס × גובה : 2')}<br>כמו במקבילית — ואז מחלקים ב-2. הגובה הוא ${b('הגובה לאותו בסיס')}.`,
        visual: triFig({ x: 3, h: 4, s: 5, bs: 8 }, { base: cm(8), hLabel: cm(4) }),
        steps: ['בסיס 8 ס"מ, גובה 4 ס"מ.', `${m(`8 ${T} 4 = 32`)} — זה שטח המקבילית.`, `${m(`32 ${DV} 2 = 16`)} — שטח המשולש: 16 סמ"ר ✔`],
      },
      {
        title: 'ישר-זווית וקהה-זווית',
        html: `• במשולש ${b('ישר-זווית')} הניצבים הם בסיס וגובה: ${m(`6 ${T} 4 : 2 = 12`)}.<br>• במשולש ${b('קהה-זווית')} הגובה יכול להיות מחוץ למשולש — והנוסחה עובדת בדיוק אותו דבר.`,
        visual: row(V.polygon([[0, 0], [0, 100], [150, 100]], { fill: 'f-l', right: [1], extra: slabs([[0, 0], [0, 100], [150, 100]], [cm(4), cm(6), '']), pad: 56, maxw: 190 }), triFig({ x: 3, h: 4, s: 5, bs: 4, obtuse: true }, { base: cm(4), hLabel: cm(4), maxw: 190 })),
      },
      {
        title: 'טעויות נפוצות',
        html: `✘ לשכוח לחלק ב-2.<br>✘ לכפול בצלע הנטויה במקום בגובה.<br>✘ לכתוב ס"מ במקום סמ"ר.<br>${c.g('בדוק', 'בדקי')} את שלושתן בכל תרגיל!`,
        quiz: {
          type: 'choice', prompt: 'במשולש הבסיס 10 ס"מ, הגובה לבסיס 6 ס"מ, והצלע הנטויה 7 ס"מ. מה השטח?',
          choices: ['30 סמ"ר', '60 סמ"ר', '35 סמ"ר', '30 ס"מ'], answer: 0,
          hint: 'בסיס × גובה : 2. ' + c.g('שים', 'שימי') + ' לב ליחידה.',
          solution: [`${m(`10 ${T} 6 : 2 = 30`)}`, 'השטח: 30 סמ"ר.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['gridTri', 'calcSlot', 'right', 'mis', 'tf', 'story', 'story', 'gridStory']
        : level === 2 ? ['fig', 'obtuse', 'story', 'mis', 'inverseH', 'gridTri', 'storyInv', 'storyMulti']
        : ['inverseH', 'compareTri', 'obtuse', 'storyInv', 'tf', 'mis', 'storyMulti', 'storyCut']);
      switch (kind) {
        case 'gridTri':
        case 'gridStory': {
          let bl = c.rnd(3, 8), h = c.rnd(2, 5); if ((bl * h) % 2) bl++;
          const out = level >= 2 && c.chance(0.4), ax = out ? 0 : c.rnd(0, bl);
          const x0 = out ? 2 + c.rnd(1, 2) : 1;
          const A = [out ? 1 : x0 + ax, 1], B = [x0, 1 + h], C = [x0 + bl, 1 + h];
          const W = x0 + bl + 1;
          const extra = level === 1 ? (cl, of) => S.rect(Math.min(A[0], B[0]) * cl + of, cl + of, (Math.max(C[0], A[0]) - Math.min(A[0], B[0])) * cl, h * cl, { fill: 'none', cls: 's-b', sw: 2, dash: '6 4' }) : null;
          const vis = V.onGrid([A, B, C], { w: W, h: h + 2, cell: Math.min(28, Math.floor(280 / W)), extra });
          const sol = [`הבסיס: ${bl} משבצות. הגובה: ${h} משבצות${out ? ' (הגובה נמצא מחוץ למשולש)' : ''}.`, `${m(`${bl} ${T} ${h} : 2 = ${(bl * h) / 2}`)}`];
          if (kind === 'gridStory') {
            const sc = triScene(c), u = U[sc.u];
            return {
              type: 'number', answer: (bl * h) / 2, unit: u.A,
              prompt: `${c.name} ${c.g('שרטט', 'שרטטה')} על דף משבצות תוכנית של ${sc.the}. כל משבצת בתוכנית מייצגת ${sc.u === 'm' ? 'מטר רבוע אחד' : 'סנטימטר רבוע אחד'}.<br>מה שטח ${sc.the}?`,
              visual: vis,
              hint: `${c.g('ספור', 'ספרי')} את הבסיס ואת הגובה במשבצות, ו${c.g('זכור', 'זכרי')}: שטח משולש = בסיס × גובה : 2.`,
              solution: [...sol, `השטח: ${(bl * h) / 2} ${u.A}.`],
            };
          }
          return {
            type: 'number', answer: (bl * h) / 2, unit: 'סמ"ר',
            prompt: 'כל משבצת היא ריבוע של 1 סמ"ר. מה שטח המשולש?',
            visual: vis,
            hint: level === 1 ? 'המשולש הוא חצי מהמלבן המקווקו. מה שטח המלבן?' : `${c.g('ספור', 'ספרי')} את הבסיס ואת הגובה במשבצות. שטח משולש = בסיס × גובה : 2.`,
            solution: [...sol, `השטח: ${(bl * h) / 2} סמ"ר.`],
          };
        }
        case 'calcSlot': {
          const N = triNums(c, 1);
          return {
            type: 'number', answer: N.A,
            prompt: `${c.g('השלם', 'השלימי')} את חישוב השטח של המשולש (בסמ"ר):<div class="big">${m(`${N.bs} ${T} ${N.h} : 2 = ` + HM.slot(0))}</div>`,
            visual: triFig(N, { base: cm(N.bs), hLabel: cm(N.h), maxw: 240 }),
            hint: `קודם ${c.g('כפול', 'כפלי')} את הבסיס בגובה, ואחר כך ${c.g('חלק', 'חלקי')} ב-2.`,
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${N.bs * N.h}`)}`, `${m(`${N.bs * N.h} ${DV} 2 = ${N.A}`)}`],
          };
        }
        case 'right': {
          let a = c.rnd(3, 10), cc = c.rnd(2, 8); if (a === cc) a++; if ((a * cc) % 2) cc++;
          const k = Math.min(24, 220 / Math.max(a, cc));
          return {
            type: 'number', answer: (a * cc) / 2, unit: 'סמ"ר', prompt: 'מה שטח המשולש ישר-הזווית?',
            visual: V.polygon([[0, 0], [0, cc * k], [a * k, cc * k]], { fill: 'f-l', right: [1], extra: slabs([[0, 0], [0, cc * k], [a * k, cc * k]], [cm(cc), cm(a), '']), pad: 58, maxw: 260 }),
            hint: 'במשולש ישר-זווית אחד הניצבים הוא הבסיס, והניצב השני הוא הגובה.',
            solution: [`${m(`${a} ${T} ${cc} = ${a * cc}`)}`, `${m(`${a * cc} ${DV} 2 = ${(a * cc) / 2}`)}`, `השטח: ${(a * cc) / 2} סמ"ר.`],
          };
        }
        case 'fig':
        case 'obtuse': {
          const N = triNums(c, level, kind === 'obtuse');
          return {
            type: 'number', answer: N.A, unit: 'סמ"ר', prompt: kind === 'obtuse' ? 'מה שטח המשולש הקהה-זווית?' : 'מה שטח המשולש?',
            visual: triFig(N, { base: cm(N.bs), slant: cm(N.s), hLabel: cm(N.h), flip: c.chance(0.5) }),
            hint: kind === 'obtuse' ? 'הגובה נמצא מחוץ למשולש, אבל הנוסחה לא משתנה: בסיס × גובה : 2.' : 'שטח משולש = בסיס × גובה : 2. איזה מספר הוא הגובה?',
            solution: [`${m(`${N.bs} ${T} ${N.h} : 2 = ${N.A}`)}`, `השטח: ${N.A} סמ"ר. (${N.s} ס"מ היא צלע נטויה — לא משתמשים בה.)`],
          };
        }
        case 'mis': {
          const N = triNums(c, level);
          const ch = HM.numChoices(N.A, [N.bs * N.h, (N.bs * N.s) % 2 ? N.bs * N.s : (N.bs * N.s) / 2, N.bs * N.s, N.bs + N.h], 4, sqcm);
          return {
            type: 'choice', prompt: `${c.name} ${c.g('מחשב', 'מחשבת')} שטח של משולש: הבסיס ${N.bs} ס"מ, הגובה לבסיס ${N.h} ס"מ, ואחת הצלעות הנטויות ${N.s} ס"מ. מה התשובה הנכונה?`,
            choices: ch.choices, answer: ch.answer,
            hint: 'שטח משולש = בסיס × גובה : 2. אל ' + c.g('תשכח', 'תשכחי') + ' לחלק ב-2!',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${N.bs * N.h}`)}`, `${m(`${N.bs * N.h} ${DV} 2 = ${N.A}`)}`, `השטח: ${N.A} סמ"ר. (${N.bs * N.h} הוא שטח המקבילית — שוכחים לחלק ב-2.)`],
          };
        }
        case 'story': {
          const sc = triScene(c), u = U[sc.u], N = triNums(c, level);
          return {
            type: 'number', answer: N.A, unit: u.A,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת משולש. הבסיס ${N.bs} ${u.L}, והגובה לבסיס ${N.h} ${u.L}${level > 1 ? `. אחת הצלעות הנטויות ${N.s} ${u.L}` : ''}.<br>מה שטח ${sc.the}?`,
            hint: 'שטח משולש = בסיס × גובה : 2.',
            solution: [`${m(`${N.bs} ${T} ${N.h} = ${N.bs * N.h}`)}`, `${m(`${N.bs * N.h} ${DV} 2 = ${N.A}`)}`, `השטח: ${N.A} ${u.A}.`],
          };
        }
        case 'inverseH':
        case 'storyInv': {
          let bs = c.rnd(4, 14), h = c.rnd(3, 12); if ((bs * h) % 2) bs++; if (bs === h) h++; if ((bs * h) % 2) bs += 2;
          const A = (bs * h) / 2, findH = kind === 'storyInv' || c.chance(0.6);
          let pre = 'שטח של משולש הוא', uA = 'סמ"ר', uL = 'ס"מ';
          if (kind === 'storyInv') { const sc = triScene(c); uA = U[sc.u].A; uL = U[sc.u].L; pre = `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת משולש, ${sc.fem ? 'ושטחה' : 'ושטחו'}`; }
          return {
            type: 'number', answer: findH ? h : bs, unit: uL,
            prompt: `${pre} ${A} ${uA}.<br>${findH ? `הבסיס ${bs} ${uL}. מה הגובה לבסיס?` : `הגובה לבסיס ${h} ${uL}. מה אורך הבסיס?`}`,
            hint: `בסיס × גובה : 2 = שטח. לכן בסיס × גובה = שטח × 2. ${c.g('התחל', 'התחילי')} מכפל השטח ב-2.`,
            solution: [`בסיס × גובה = ${m(`${A} ${T} 2 = ${2 * A}`)}.`, findH ? `${m(`${2 * A} ${DV} ${bs} = ${h}`)}` : `${m(`${2 * A} ${DV} ${h} = ${bs}`)}`, findH ? `הגובה: ${h} ${uL}.` : `הבסיס: ${bs} ${uL}.`],
          };
        }
        case 'compareTri': {
          let bl = c.rnd(3, 6), h = c.rnd(2, 4); if ((bl * h) % 2) bl++;
          let bl2 = bl, h2 = h;
          if (c.chance(0.5)) { if (c.chance(0.5)) bl2 = bl + 2; else h2 = h + 1; if ((bl2 * h2) % 2) bl2++; }
          const x2 = bl + 3, H = Math.max(h, h2) + 2, W = x2 + bl2 + 2;
          const tA = [[1 + c.rnd(0, bl), H - 1 - h], [1, H - 1], [1 + bl, H - 1]], tB = [[x2 + c.pick([0, bl2, bl2 + 1]), H - 1 - h2], [x2, H - 1], [x2 + bl2, H - 1]];
          const aA = (bl * h) / 2, aB = (bl2 * h2) / 2;
          return {
            type: 'compare', prompt: `${c.g('השווה', 'השווי')} בין השטחים של משולש א ומשולש ב:`,
            visual: V.onGrid([tA, tB], { w: W, h: H, cell: Math.min(24, Math.floor(300 / W)), extra: gridText([[1 + bl / 2, H - 0.4, 'א'], [x2 + bl2 / 2, H - 0.4, 'ב']]) }),
            left: 'א', right: 'ב', lv: aA, rv: aB, answer: aA === aB ? '=' : aA < aB ? '<' : '>',
            hint: `לכל משולש ${c.g('ספור', 'ספרי')} את הבסיס ואת הגובה (המרחק מהקודקוד העליון אל הקו של הבסיס). הצורה של המשולש לא משנה!`,
            solution: [`משולש א: ${m(`${bl} ${T} ${h} : 2 = ${aA}`)}. משולש ב: ${m(`${bl2} ${T} ${h2} : 2 = ${aB}`)}.`, aA === aB ? 'אותו בסיס ואותו גובה — אותו שטח.' : `השטח של משולש ${aA > aB ? 'א' : 'ב'} גדול יותר.`],
          };
        }
        case 'storyMulti': {
          const sc = triMulti(c), n = c.rnd(3, level === 3 ? 12 : 6);
          let bs = c.rnd(4, 12), h = c.rnd(3, 10); if ((bs * h) % 2) bs++;
          const one = (bs * h) / 2;
          return {
            type: 'number', answer: n * one, unit: 'סמ"ר',
            prompt: `${c.name} ${c.g('מכין', 'מכינה')} ${n} ${sc.pl}. ${sc.fem ? 'כל אחת' : 'כל אחד'} ${sc.fem ? 'היא' : 'הוא'} משולש שהבסיס שלו ${bs} ס"מ והגובה לבסיס ${h} ס"מ.<br>כמה סמ"ר של ${sc.mat} ${c.g('צריך', 'צריכה')} ${c.name}?`,
            hint: `קודם ${c.g('חשב', 'חשבי')} את השטח של משולש אחד, ואז ${c.g('כפול', 'כפלי')} במספר המשולשים.`,
            solution: [`משולש אחד: ${m(`${bs} ${T} ${h} : 2 = ${one}`)} סמ"ר.`, `${n} משולשים: ${m(`${n} ${T} ${one} = ${HM.fmt(n * one)}`)} סמ"ר.`],
          };
        }
        case 'storyCut': {
          const a = c.rnd(6, 10), w = c.rnd(3, 6);
          let base = c.rnd(2, a - 2); if ((base * w) % 2) base++;
          const ax = c.rnd(0, a), x0 = c.rnd(0, a - base);
          const tri = [[1 + ax, 1], [1 + x0, 1 + w], [1 + x0 + base, 1 + w]];
          const rem = a * w - (base * w) / 2;
          const f = c.friend();
          return {
            type: 'number', answer: rem, unit: 'סמ"ר',
            prompt: `${f.name} ${f.g('גזר', 'גזרה')} מדף מלבני של ${a} ס"מ על ${w} ס"מ משולש, כמו בציור: הבסיס שלו ${base} ס"מ, והקודקוד שלו נוגע בצד השני של הדף.<br>כמה סמ"ר נשארו מהדף אחרי הגזירה?`,
            visual: V.onGrid([[[1, 1], [1 + a, 1], [1 + a, 1 + w], [1, 1 + w]], tri], { w: a + 2, h: w + 2, cell: 24 }),
            hint: `${c.g('חשב', 'חשבי')} את שטח הדף ואת שטח המשולש. מה הגובה של המשולש? (הקודקוד נוגע בצד השני של הדף.)`,
            solution: [`שטח הדף: ${m(`${a} ${T} ${w} = ${a * w}`)} סמ"ר.`, `הגובה של המשולש שווה לרוחב הדף, ${w} ס"מ. שטח המשולש: ${m(`${base} ${T} ${w} : 2 = ${(base * w) / 2}`)} סמ"ר.`, `נשארו: ${m(`${a * w} − ${(base * w) / 2} = ${rem}`)} סמ"ר.`],
          };
        }
        case 'tf': {
          const A = [
            ['שטח משולש הוא חצי משטח של מקבילית עם אותו בסיס ואותו גובה.', true, 'שני משולשים זהים יוצרים מקבילית כזאת.'],
            ['שטח משולש = בסיס × גובה.', false, 'שוכחים לחלק ב-2! שטח משולש = בסיס × גובה : 2.'],
            ['במשולש ישר-זווית, השטח = ניצב × ניצב : 2.', true, 'ניצב אחד הוא הבסיס, והשני הוא הגובה.'],
            ['האלכסון מחלק מלבן לשני משולשים שווים בשטחם.', true, 'כל משולש הוא חצי מהמלבן.'],
          ];
          const B = [
            ['לכל המשולשים עם אותו בסיס ואותו גובה יש אותו שטח.', true, 'השטח תלוי רק בבסיס ובגובה.'],
            ['כדי לחשב שטח של משולש קהה-זווית, משתמשים בצלע הנטויה במקום בגובה.', false, 'תמיד משתמשים בגובה, גם כשהוא מחוץ למשולש.'],
            ['אם מכפילים את הבסיס של משולש פי 2 (והגובה לא משתנה), השטח גדל פי 2.', true, `למשל ${m(`4 ${T} 3 : 2 = 6`)} ו-${m(`8 ${T} 3 : 2 = 12`)}.`],
            ['משולש עם בסיס 6 ס"מ וגובה 4 ס"מ, ומשולש עם בסיס 8 ס"מ וגובה 3 ס"מ — שווים בשטחם.', true, `${m(`6 ${T} 4 : 2 = 12`)} וגם ${m(`8 ${T} 3 : 2 = 12`)}.`],
          ];
          const pool = level === 1 ? A : B.concat(A.slice(1, 2));
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('נסה', 'נסי')} לבדוק עם מספרים, ו${c.g('זכור', 'זכרי')}: שטח משולש = בסיס × גובה : 2.`,
            solution: [why, tfSol(ans)],
          };
        }
      }
    },
  });

  /* ---------- עוד על שטחים ---------- */
  // דלתון/מעוין לפי אלכסונים: d1 אופקי, האלכסון האנכי מחולק ל-top ו-bot
  function kiteFig(d1, top, bot, o) {
    o = o || {};
    const k = Math.min(22, 220 / Math.max(d1, top + bot));
    const w = d1 * k, t = top * k, bb = bot * k;
    const pts = V.shapes.kite(w, t, bb);
    let extra = rmark([w / 2, t], [w / 2, 0], [1, 0], 's-b');
    if (o.l1 != null) extra += S.text(w * 0.27, t - 11, o.l1, { fs: 14, fw: 800, cls: 't-b' });
    if (o.l2 != null) extra += S.text(w / 2 + 10 + String(o.l2).length * 4, t + bb * 0.55, o.l2, { fs: 14, fw: 800, cls: 't-b' });
    if (o.box) extra = S.rect(0, 0, w, t + bb, { fill: 'none', cls: 's-soft', sw: 2, dash: '6 4' }) + extra;
    return V.polygon(pts, { fill: 'f-l', diags: true, extra, maxw: o.maxw || 230 });
  }
  function trapFig(a, t, h, off, o) {
    o = o || {};
    const k = Math.min(24, 250 / a);
    const pts = V.shapes.trapezoid(a * k, t * k, h * k, off * k);
    return V.polygon(pts, { fill: 'f-l', sides: [o.top || '', '', o.bottom || '', ''], heights: [{ from: 0, to: [3, 2] }], extra: o.hLabel != null ? hlab(pts[0], [pts[0][0], h * k], o.hLabel, [1, 0]) : '', maxw: o.maxw || 270 });
  }
  function trapNums(c, level) {
    const a = c.rnd(6, level === 1 ? 10 : 14), t = c.rnd(2, a - 2);
    let h = c.rnd(2, level === 1 ? 6 : 9); if (((a + t) * h) % 2) h++;
    return { a, t, h, off: c.rnd(0, a - t), A: ((a + t) * h) / 2 };
  }
  const trapScene = (c, mOnly) => c.scene([
    { tags: ['nature'], the: 'ערוגת הפרחים', fem: true, u: 'm', cv: ['לכסות', ' בדשא', 'דשא'] }, { tags: ['music'], the: 'במת המקהלה', fem: true, u: 'm' },
    { tags: ['kpop'], the: 'הבמה של להקת הקיי-פופ', fem: true, u: 'm' }, { tags: ['magic'], the: 'גג מגדל הקוסמים', fem: false, u: 'm' },
    { tags: ['animals'], the: 'רצפת הלול', fem: true, u: 'm', cv: ['לכסות', ' בנסורת', 'נסורת'] }, { tags: ['art'], the: 'הבד של התפאורה להצגה', fem: false, u: 'm' },
    { tags: ['baking'], the: 'חתיכת העוגה', fem: true, u: 'cm' }, { tags: ['squishy'], the: 'המדף של הסקווישים', fem: false, u: 'cm' },
    { tags: ['tech'], the: 'הלוח של הרובוט', fem: false, u: 'cm' }, { tags: ['space'], the: 'כנף המטוס בדגם', fem: true, u: 'cm' },
    { tags: ['games'], the: 'האריח במשחק', fem: false, u: 'cm' }, { tags: ['reading', 'sport'], the: 'השלט של הספרייה', fem: false, u: 'cm' },
  ].filter((s) => !mOnly || s.u === 'm'));
  const kiteScene = (c) => c.scene([
    { tags: ['nature', 'sport', 'art', 'space'], s: `${c.name} ${c.g('בונה', 'בונה')} עפיפון בצורת דלתון`, the: 'העפיפון', fem: false },
    { tags: ['magic'], s: 'על הגלימה של הקוסם תפור טלאי בצורת מעוין', the: 'הטלאי', fem: false, rh: true },
    { tags: ['squishy'], s: `${c.name} ${c.g('קנה', 'קנתה')} סקוויש שטוח בצורת יהלום (מעוין)`, the: 'הסקוויש', fem: false, rh: true },
    { tags: ['kpop'], s: 'מעל הבמה של להקת הקיי-פופ תלוי שלט בצורת מעוין', the: 'השלט', fem: false, rh: true },
    { tags: ['baking'], s: `${c.name} ${c.g('חתך', 'חתכה')} עוגייה בצורת מעוין`, the: 'העוגייה', fem: true, rh: true },
    { tags: ['reading', 'music', 'animals', 'games', 'tech'], s: 'בחלון של הספרייה יש זכוכית צבעונית בצורת דלתון', the: 'הזכוכית', fem: true },
  ]);
  const maxPairs = (q) => HM.range(1, Math.floor(q / 2)).map((x) => [x, q - x]);

  HM.lesson({
    id: 'g-area-more',
    learn: (c) => [
      {
        title: 'עפיפון ודלתון',
        html: `${c.name}, עפיפון הוא בדרך כלל בצורת ${b('דלתון')}. האלכסונים שלו ${b('מאונכים')} זה לזה.<br>מקיפים את הדלתון במלבן (מקווקו) — והדלתון הוא בדיוק ${b('חצי')} מהמלבן.<br>${HM.hl('שטח דלתון = אלכסון × אלכסון : 2')}`,
        visual: kiteFig(8, 3, 6, { box: true, l1: '8', l2: '9' }),
      },
      {
        title: 'מעוין',
        html: `גם במעוין האלכסונים מאונכים, ולכן:<br>${HM.hl('שטח מעוין = אלכסון × אלכסון : 2')}<br>(ומכיוון שמעוין הוא מקבילית, אפשר גם: בסיס × גובה.)`,
        visual: kiteFig(8, 3, 3, { l1: '8', l2: '6' }),
        steps: ['האלכסונים: 8 ס"מ ו-6 ס"מ.', `${m(`8 ${T} 6 = 48`)} — שטח המלבן שמסביב.`, `${m(`48 ${DV} 2 = 24`)} — שטח המעוין: 24 סמ"ר ✔`],
      },
      {
        title: 'טרפז',
        html: `${c.g('פרק', 'פרקי')} את הטרפז לחלקים מוכרים: מלבן באמצע ושני משולשים בצדדים.<br>בציור: ${m(`6 ${T} 4 = 24`)}, והמשולשים יחד: ${m(`4 ${T} 4 : 2 = 8`)}. בסך הכול 32 סמ"ר.<br>קיצור דרך: ${HM.hl('(בסיס + בסיס) × גובה : 2')}`,
        visual: V.polygon(V.shapes.trapezoid(240, 144, 96, 48), { fill: 'f-l', sides: [cm(6), '', cm(10), ''], extra: dseg([48, 0], [48, 96], 's-b') + dseg([192, 0], [192, 96], 's-b') + hlab([48, 0], [48, 96], cm(4), [1, 0]), maxw: 280 }),
      },
      {
        title: 'ממד חסר',
        html: `${c.g('אתה יודע', 'את יודעת')} את השטח? אפשר למצוא צלע או גובה שחסרים: ${c.g('חשוב', 'חשבי')} איזה מספר חסר בתרגיל.`,
        steps: [`מלבן: שטח 42 סמ"ר, אורך 7 ס"מ. ${m(`7 ${T} ? = 42`)}, ולכן הרוחב ${m(`42 ${DV} 7 = 6`)} ס"מ.`, `משולש: שטח 15 סמ"ר, בסיס 6 ס"מ. ${m(`6 ${T} ? : 2 = 15`)}, כלומר ${m(`6 ${T} ? = 30`)}.`, `${m(`30 ${DV} 6 = 5`)} — הגובה 5 ס"מ ✔`],
      },
      {
        title: 'אותו היקף — איזה שטח הכי גדול?',
        html: `כל המלבנים בטבלה הם בעלי היקף של 20 ס"מ. ככל שהמלבן קרוב יותר ל${b('ריבוע')}, השטח ${b('גדול')} יותר. המלבן ה"דק" ביותר — השטח שלו הכי קטן.`,
        visual: V.table(['אורך', 'רוחב', 'היקף', 'שטח'], maxPairs(10).map((p) => [cm(p[1]), cm(p[0]), cm(20), sqcm(p[0] * p[1])])),
      },
      {
        title: 'אותו שטח — היקפים שונים',
        html: `מלבנים ששטחם 24 סמ"ר: ${m(`24 ${T} 1`)} (היקף 50), ${m(`12 ${T} 2`)} (היקף 28), ${m(`8 ${T} 3`)} (היקף 22), ${m(`6 ${T} 4`)} (היקף 20).<br>כשהמלבן קרוב לריבוע — ${b('ההיקף הכי קטן')}.`,
        quiz: {
          type: 'number', prompt: 'מכל המלבנים שהיקפם 16 ס"מ (עם צלעות באורך שלם), מה השטח הגדול ביותר?', answer: 16, unit: 'סמ"ר',
          hint: 'אורך + רוחב = 8. איזה מלבן הכי קרוב לריבוע?',
          solution: [`${m(`4 ${T} 4 = 16`)} — הריבוע.`, 'השטח הגדול ביותר: 16 סמ"ר.'],
        },
      },
    ],
    gen: (c, level) => {
      const kind = c.pick(level === 1 ? ['kite', 'rhombus', 'trapGrid', 'missingRect', 'tf', 'storyKite', 'storyMissing', 'storyKite']
        : level === 2 ? ['trap', 'missing', 'maxArea', 'order', 'double', 'kite', 'storyTrap', 'storyMax', 'storyMissing', 'storyKite']
        : ['minPerim', 'maxArea', 'missingKite', 'trap', 'double', 'order', 'storyMin', 'storyTrapCost', 'storyMissing', 'storyMax', 'tf']);
      switch (kind) {
        case 'kite':
        case 'rhombus':
        case 'storyKite': {
          const sc = kind === 'storyKite' ? kiteScene(c) : null;
          const rh = kind === 'rhombus' || (sc && sc.rh);
          let d1 = c.rnd(4, level === 1 ? 10 : 14), top = c.rnd(2, 5), bot = rh ? top : top + c.rnd(2, 6);
          if (((d1 * (top + bot)) % 2)) d1++;
          if (d1 === top + bot) d1 += 2;
          const d2 = top + bot, A = (d1 * d2) / 2;
          const sol = [`${m(`${d1} ${T} ${d2} = ${d1 * d2}`)} — שטח המלבן שמסביב.`, `${m(`${d1 * d2} ${DV} 2 = ${A}`)}`];
          if (kind === 'storyKite') {
            return {
              type: 'number', answer: A, unit: 'סמ"ר',
              prompt: `${sc.s}. ${sc.the.replace(/^ה/, 'ל')} יש אלכסונים מאונכים באורך ${d1} ס"מ ו-${d2} ס"מ.<br>מה שטח ${sc.the}?`,
              visual: level === 1 ? kiteFig(d1, top, bot, { l1: d1, l2: d2 }) : undefined,
              hint: 'כשהאלכסונים מאונכים (בדלתון ובמעוין): שטח = אלכסון × אלכסון : 2.',
              solution: [...sol, `השטח: ${A} סמ"ר.`],
            };
          }
          return {
            type: 'number', answer: A, unit: 'סמ"ר',
            prompt: `מה השטח של ה${rh ? 'מעוין' : 'דלתון'}? אורכי האלכסונים: ${d1} ס"מ ו-${d2} ס"מ.`,
            visual: kiteFig(d1, top, bot, { l1: d1, l2: d2 }),
            hint: `שטח ${rh ? 'מעוין' : 'דלתון'} = אלכסון × אלכסון : 2.`,
            solution: [...sol, `השטח: ${A} סמ"ר.`],
          };
        }
        case 'trapGrid': {
          const a = c.rnd(5, 8), t = c.rnd(2, a - 2), off = c.rnd(0, a - t);
          let h = c.rnd(2, 4); if (((a + t) * h) % 2) h = h === 4 ? 3 : h + 1;
          if (((a + t) * h) % 2) h = 2;
          const A = ((a + t) * h) / 2;
          return {
            type: 'number', answer: A, unit: 'סמ"ר', prompt: 'כל משבצת היא ריבוע של 1 סמ"ר. מה שטח הטרפז?',
            visual: V.onGrid([[1 + off, 1], [1 + off + t, 1], [1 + a, 1 + h], [1, 1 + h]], { w: a + 2, h: h + 2, cell: 28 }),
            hint: `${c.g('פרק', 'פרקי')} את הטרפז: מלבן באמצע, ומשולשים בצדדים. שני המשולשים יחד הם משולש אחד עם בסיס ${a - t}.`,
            solution: [`מלבן: ${m(`${t} ${T} ${h} = ${t * h}`)}.`, `המשולשים יחד: ${m(`${a - t} ${T} ${h} : 2 = ${((a - t) * h) / 2}`)}.`, `${m(`${t * h} + ${((a - t) * h) / 2} = ${A}`)} סמ"ר.`],
          };
        }
        case 'trap':
        case 'storyTrap':
        case 'storyTrapCost': {
          const N = trapNums(c, level);
          const formula = `${m(`(${N.a} + ${N.t}) ${T} ${N.h} : 2 = ${N.A}`)}`;
          const sol = [`מחברים את הבסיסים: ${m(`${N.a} + ${N.t} = ${N.a + N.t}`)}.`, `${m(`${N.a + N.t} ${T} ${N.h} = ${(N.a + N.t) * N.h}`)}, ואז ${m(`${(N.a + N.t) * N.h} ${DV} 2 = ${N.A}`)}.`];
          if (kind === 'storyTrap' || kind === 'storyTrapCost') {
            const sc = trapScene(c, kind === 'storyTrapCost'), u = U[sc.u];
            const st = `${sc.the} ${sc.fem ? 'היא' : 'הוא'} בצורת טרפז: הבסיסים ${N.a} ${u.L} ו-${N.t} ${u.L}, והגובה ${N.h} ${u.L}.`;
            if (kind === 'storyTrapCost') {
              const p = c.pick([12, 15, 20, 25, 30]);
              return {
                type: 'number', answer: N.A * p, unit: '₪',
                prompt: `${st} ${c.name} ${c.g('רוצה', 'רוצה')} ${(sc.cv || ['לצבוע'])[0]} ${sc.fem ? 'אותה' : 'אותו'}${(sc.cv || ['', ''])[1]}, ו${(sc.cv || [0, 0, 'צבע'])[2]} לכל מ"ר עולה ${p} ₪.<br>כמה ${c.g('ישלם', 'תשלם')} ${c.name}?`,
                hint: `קודם ${c.g('חשב', 'חשבי')} את שטח הטרפז, ואז את המחיר.`,
                solution: [...sol, `המחיר: ${m(`${N.A} ${T} ${p} = ${HM.fmt(N.A * p)}`)} ₪.`],
              };
            }
            return {
              type: 'number', answer: N.A, unit: u.A, prompt: `${st}<br>מה שטח ${sc.the}?`,
              hint: `${c.g('פרק', 'פרקי')} את הטרפז למלבן ומשולשים, או ${c.g('השתמש', 'השתמשי')} בקיצור הדרך: (בסיס + בסיס) × גובה : 2.`,
              solution: [...sol, `השטח: ${N.A} ${u.A}.`],
            };
          }
          if (level === 3 && c.chance(0.4)) {
            return {
              type: 'number', answer: N.h, unit: 'ס"מ',
              prompt: `שטח טרפז הוא ${N.A} סמ"ר. אורכי הבסיסים ${N.a} ס"מ ו-${N.t} ס"מ. מה הגובה של הטרפז?`,
              hint: `(בסיס + בסיס) × גובה : 2 = שטח. ${c.g('התחל', 'התחילי')} מכפל השטח ב-2.`,
              solution: [`${m(`${N.A} ${T} 2 = ${2 * N.A}`)}`, `${m(`${N.a} + ${N.t} = ${N.a + N.t}`)}`, `${m(`${2 * N.A} ${DV} ${N.a + N.t} = ${N.h}`)} — הגובה ${N.h} ס"מ.`],
            };
          }
          return {
            type: 'number', answer: N.A, unit: 'סמ"ר', prompt: 'מה שטח הטרפז?',
            visual: trapFig(N.a, N.t, N.h, N.off, { top: cm(N.t), bottom: cm(N.a), hLabel: cm(N.h) }),
            hint: `(בסיס + בסיס) × גובה : 2. אפשר גם לפרק לחלקים מוכרים.`,
            solution: [...sol, formula],
          };
        }
        case 'missingRect': {
          const l = c.rnd(3, 10), w = c.rnd(2, 9);
          return {
            type: 'number', answer: w,
            prompt: `שטח מלבן הוא ${l * w} סמ"ר, ואורכו ${l} ס"מ. מה הרוחב שלו?<div class="big">${m(`${l} ${T} ` + HM.slot(0) + ` = ${l * w}`)}</div>`,
            hint: 'אורך × רוחב = שטח. איזה מספר כופלים באורך כדי לקבל את השטח?',
            solution: [`${m(`${l * w} ${DV} ${l} = ${w}`)}`, `הרוחב: ${w} ס"מ.`],
          };
        }
        case 'missing':
        case 'missingKite': {
          const v = kind === 'missingKite' ? 'kite' : c.pick(['rect', 'tri', 'par', 'kite']);
          let x = c.rnd(3, 12), y = c.rnd(2, 11);
          if ((v === 'tri' || v === 'kite') && (x * y) % 2) x++;
          const A = v === 'rect' || v === 'par' ? x * y : (x * y) / 2;
          const P = {
            rect: [`שטח מלבן הוא ${A} סמ"ר, ואורכו ${x} ס"מ. מה הרוחב שלו?`, 'אורך × רוחב = שטח.', [`${m(`${A} ${DV} ${x} = ${y}`)}`]],
            par: [`שטח מקבילית הוא ${A} סמ"ר, והגובה לבסיס ${x} ס"מ. מה אורך הבסיס?`, 'בסיס × גובה = שטח.', [`${m(`${A} ${DV} ${x} = ${y}`)}`]],
            tri: [`שטח משולש הוא ${A} סמ"ר, והבסיס שלו ${x} ס"מ. מה הגובה לבסיס?`, 'בסיס × גובה : 2 = שטח, ולכן בסיס × גובה = שטח × 2.', [`${m(`${A} ${T} 2 = ${2 * A}`)}`, `${m(`${2 * A} ${DV} ${x} = ${y}`)}`]],
            kite: [`שטח דלתון הוא ${A} סמ"ר, ואחד האלכסונים שלו ${x} ס"מ. מה אורך האלכסון השני?`, 'אלכסון × אלכסון : 2 = שטח, ולכן אלכסון × אלכסון = שטח × 2.', [`${m(`${A} ${T} 2 = ${2 * A}`)}`, `${m(`${2 * A} ${DV} ${x} = ${y}`)}`]],
          }[v];
          return {
            type: 'number', answer: y, unit: 'ס"מ', prompt: P[0],
            hint: P[1] + ` ${c.g('חשוב', 'חשבי')} איזה מספר חסר.`,
            solution: [...P[2], `התשובה: ${y} ס"מ.`],
          };
        }
        case 'storyMissing': {
          const sc = rectObj(c), u = U[sc.u], [l, w] = dims(c, sc, level), A = l * w;
          return {
            type: 'number', answer: w, unit: u.L,
            prompt: `${sc.the} ${sc.fem ? 'היא' : 'הוא'} מלבן ששטחו ${HM.fmt(A)} ${u.A}. ${sc.fem ? 'אורכה' : 'אורכו'} ${l} ${u.L}.<br>מה ${sc.fem ? 'רוחבה' : 'רוחבו'}?`,
            hint: 'אורך × רוחב = שטח. איזה מספר כופלים באורך כדי לקבל את השטח?',
            solution: [`${m(`${l} ${T} ? = ${HM.fmt(A)}`)}`, `${m(`${HM.fmt(A)} ${DV} ${l} = ${w}`)}`, `הרוחב: ${w} ${u.L}.`],
          };
        }
        case 'maxArea':
        case 'storyMax': {
          const P = c.pick(level === 2 ? [12, 16, 20, 24] : [18, 22, 24, 28, 30, 32, 36, 40]), q = P / 2;
          const best = Math.floor(q / 2) * Math.ceil(q / 2);
          const askMin = kind === 'maxArea' && level === 3 && c.chance(0.3);
          const ans = askMin ? q - 1 : best;
          const list = maxPairs(q).map((p) => `${m(`${p[0]} ${T} ${p[1]} = ${p[0] * p[1]}`)}`).join(', ');
          const sol = [`אורך + רוחב = ${m(`${P} ${DV} 2 = ${q}`)}.`, `האפשרויות: ${list}.`, askMin ? `השטח הקטן ביותר: ${q - 1} סמ"ר — המלבן הכי "דק".` : `השטח הגדול ביותר: ${best} סמ"ר — המלבן הכי קרוב לריבוע.`];
          if (kind === 'storyMax') {
            const sc = c.scene([
              { tags: ['animals'], obj: 'מכלאה מלבנית לארנבים', mat: 'גדר' }, { tags: ['nature'], obj: 'ערוגת ירקות מלבנית', mat: 'גדר' },
              { tags: ['sport'], obj: 'מגרש משחקים מלבני', mat: 'חבל' }, { tags: ['kpop', 'music'], obj: 'רחבת ריקודים מלבנית', mat: 'סרט סימון' },
              { tags: ['magic'], obj: 'גן מלבני לצמחי שיקויים', mat: 'גדר' }, { tags: ['squishy', 'games', 'art', 'reading', 'baking', 'space', 'tech'], obj: 'אזור משחק מלבני בחצר', mat: 'חבל' },
            ]);
            return {
              type: 'number', answer: ans, unit: 'מ"ר',
              prompt: `${c.name} ${c.g('קיבל', 'קיבלה')} ${P} מ' של ${sc.mat} כדי להקיף ${sc.obj}. אורכי הצלעות במטרים שלמים.<br>מה השטח הגדול ביותר ש${c.g('הוא יכול', 'היא יכולה')} להקיף?`,
              hint: `ההיקף הוא ${P} מ', ולכן אורך + רוחב = ${q}. ${c.g('נסה', 'נסי')} כמה אפשרויות — מתי השטח הכי גדול?`,
              solution: [sol[0], sol[1], `השטח הגדול ביותר: ${best} מ"ר — המלבן הכי קרוב לריבוע.`],
            };
          }
          return {
            type: 'number', answer: ans, unit: 'סמ"ר',
            prompt: `מכל המלבנים שהיקפם ${P} ס"מ, ואורכי הצלעות שלהם מספרים שלמים — מה השטח ${askMin ? 'הקטן' : 'הגדול'} ביותר?`,
            hint: `אורך + רוחב = ${q}. ${c.g('נסה', 'נסי')} כמה אפשרויות ו${c.g('השווה', 'השווי')} את השטחים.`,
            solution: sol,
          };
        }
        case 'minPerim':
        case 'storyMin': {
          const A = c.pick(kind === 'storyMin' ? [12, 16, 18, 20, 24, 30, 36] : [16, 18, 24, 30, 36, 40, 48, 60, 64]);
          const pairs = HM.divisors(A).filter((d) => d * d <= A).map((d) => [d, A / d]);
          const bestP = Math.min(...pairs.map((p) => 2 * (p[0] + p[1])));
          const list = pairs.map((p) => `${m(`${p[0]} ${T} ${p[1]}`)} (היקף ${2 * (p[0] + p[1])})`).join(', ');
          const sol = [`המלבנים האפשריים: ${list}.`, `ההיקף הקטן ביותר: ${bestP} ס"מ — המלבן הכי קרוב לריבוע.`];
          if (kind === 'storyMin') {
            const sc = c.scene([
              { tags: ['art'], pl: 'אריחי פסיפס', fem: false }, { tags: ['squishy'], pl: 'סקווישים', fem: false },
              { tags: ['games', 'tech', 'space'], pl: 'קוביות', fem: true }, { tags: ['kpop', 'music'], pl: 'מדבקות של הלהקה', fem: true },
              { tags: ['baking'], pl: 'קוביות סוכר', fem: true }, { tags: ['magic', 'reading'], pl: 'קלפי קסם', fem: false },
              { tags: ['nature', 'animals', 'sport'], pl: 'אריחים קטנים', fem: false },
            ]);
            return {
              type: 'number', answer: bestP, unit: 'ס"מ',
              prompt: `${c.name} ${c.g('מסדר', 'מסדרת')} ${A} ${sc.pl} ${sc.fem ? 'ריבועיות' : 'ריבועיים'} (${sc.fem ? 'כל אחת' : 'כל אחד'} 1 ס"מ על 1 ס"מ), ${sc.fem ? 'צמודות זו לזו' : 'צמודים זה לזה'}, בצורת מלבן מלא. ${c.g('הוא רוצה', 'היא רוצה')} להקיף את המלבן בסרט קצר ככל האפשר.<br>מה אורך הסרט?`,
              hint: `השטח של המלבן הוא ${A} סמ"ר. ${c.g('מצא', 'מצאי')} את כל המלבנים האפשריים, ו${c.g('בחר', 'בחרי')} את זה עם ההיקף הקטן ביותר.`,
              solution: sol,
            };
          }
          return {
            type: 'number', answer: bestP, unit: 'ס"מ',
            prompt: `שטח מלבן הוא ${A} סמ"ר, ואורכי הצלעות שלו מספרים שלמים. מה ההיקף הקטן ביותר שיכול להיות לו?`,
            hint: `${c.g('מצא', 'מצאי')} את כל הזוגות של אורך ורוחב שהמכפלה שלהם ${A}, ו${c.g('חשב', 'חשבי')} לכל זוג את ההיקף.`,
            solution: sol,
          };
        }
        case 'order': {
          const q = c.pick([10, 12, 14, 16]);
          const ps = c.sample(maxPairs(q), 4);
          const ans = ps.map((p, i) => i).sort((i, j) => ps[i][0] * ps[i][1] - ps[j][0] * ps[j][1]);
          return {
            type: 'order', prompt: `לכל המלבנים האלה יש היקף של ${2 * q} ס"מ. ${c.g('סדר', 'סדרי')} אותם לפי השטח, ${b('מהקטן לגדול')}:`,
            items: ps.map((p) => `${p[1]} ס"מ על ${p[0]} ס"מ`), answer: ans,
            hint: `${c.g('חשב', 'חשבי')} את השטח של כל מלבן. ${c.g('שים', 'שימי')} לב: ככל שהמלבן קרוב לריבוע, השטח גדל.`,
            solution: [ans.map((i) => `${m(`${ps[i][1]} ${T} ${ps[i][0]} = ${ps[i][0] * ps[i][1]}`)}`).join(' ← ')],
          };
        }
        case 'double': {
          const V2 = [
            ['מכפילים את הצלע של ריבוע פי 2.', 3, `${m(`3 ${T} 3 = 9`)}`, `${m(`6 ${T} 6 = 36`)}`],
            ['מכפילים את אחד האלכסונים של דלתון פי 2, והשני לא משתנה.', 1, `${m(`6 ${T} 4 : 2 = 12`)}`, `${m(`12 ${T} 4 : 2 = 24`)}`],
            ['מכפילים את שני האלכסונים של מעוין פי 2.', 3, `${m(`6 ${T} 4 : 2 = 12`)}`, `${m(`12 ${T} 8 : 2 = 48`)}`],
            ['במשולש מכפילים את הבסיס פי 2, ומקטינים את הגובה לחצי.', 0, `${m(`6 ${T} 4 : 2 = 12`)}`, `${m(`12 ${T} 2 : 2 = 12`)}`],
          ];
          const V3 = [
            ['מכפילים את הצלע של ריבוע פי 3.', 4, `${m(`2 ${T} 2 = 4`)}`, `${m(`6 ${T} 6 = 36`)}`],
            ['בטרפז מכפילים את שני הבסיסים פי 2, והגובה לא משתנה.', 1, `${m(`(4 + 6) ${T} 2 : 2 = 10`)}`, `${m(`(8 + 12) ${T} 2 : 2 = 20`)}`],
          ];
          const v = c.pick(level === 3 ? V2.concat(V3) : V2);
          const ch = ['השטח לא משתנה', 'השטח גדל פי 2', 'השטח גדל פי 3', 'השטח גדל פי 4', 'השטח גדל פי 9'];
          return {
            type: 'choice', keep: true, prompt: `${v[0]} מה קורה לשטח?`, choices: ch, answer: v[1],
            hint: `${c.g('נסה', 'נסי')} עם מספרים קטנים: ${c.g('חשב', 'חשבי')} את השטח לפני השינוי ואחריו.`,
            solution: [`לפני: ${v[2]}. אחרי: ${v[3]}.`, `${ch[v[1]]}.`],
          };
        }
        case 'tf': {
          const A = [
            ['שטח דלתון = אלכסון × אלכסון : 2.', true, 'הדלתון הוא חצי מהמלבן שנבנה סביב האלכסונים.'],
            ['שטח מעוין = צלע × צלע.', false, 'זה נכון רק בריבוע. במעוין: אלכסון × אלכסון : 2, או בסיס × גובה.'],
            ['את שטח הטרפז אפשר למצוא בעזרת פירוק למלבן ולמשולשים.', true, 'מחשבים את השטח של כל חלק ומחברים.'],
            ['אם מכפילים את הצלע של ריבוע פי 2, השטח שלו גדל פי 2.', false, `השטח גדל פי 4: ${m(`3 ${T} 3 = 9`)}, ו-${m(`6 ${T} 6 = 36`)}.`],
          ];
          const B = [
            ['מכל המלבנים עם אותו היקף, לריבוע יש השטח הגדול ביותר.', true, `למשל היקף 20: ${m(`5 ${T} 5 = 25`)} גדול מ-${m(`4 ${T} 6 = 24`)} ומכל השאר.`],
            ['למלבנים עם אותו שטח יש תמיד אותו היקף.', false, `${m(`1 ${T} 12`)} (היקף 26) ו-${m(`3 ${T} 4`)} (היקף 14) — לשניהם שטח 12.`],
            ['ככל שמלבן "דק וארוך" יותר (עם אותו היקף), השטח שלו קטן יותר.', true, `היקף 20: ${m(`1 ${T} 9 = 9`)}, אבל ${m(`5 ${T} 5 = 25`)}.`],
          ];
          const pool = level === 1 ? A : B.concat(A.slice(1));
          const [st, ans, why] = c.pick(pool);
          const f = c.friend();
          const prompt = level > 1 && c.chance(0.5) ? `${f.name} ${f.g('טוען', 'טוענת')}: "${st}"<br>האם ${f.g('הוא צודק', 'היא צודקת')}?` : st;
          return {
            type: 'tf', prompt, answer: ans,
            hint: `${c.g('בדוק', 'בדקי')} עם דוגמה במספרים.`,
            solution: [why, tfSol(ans)],
          };
        }
      }
    },
  });
})(HM);
