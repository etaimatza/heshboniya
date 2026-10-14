/* חשבוניה — ממלכת השברים, חלק א׳: משמעות השבר והצגות שונות */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { frac: F, m, b } = HM;
  const DENOMS = { 2: 'חצאים', 3: 'שלישים', 4: 'רבעים', 5: 'חמישיות', 6: 'שישיות', 7: 'שביעיות', 8: 'שמיניות', 9: 'תשיעיות', 10: 'עשיריות', 12: 'שתים-עשרה' };

  /* ========== השבר כחלק משלם ========== */
  HM.lesson({
    id: 'f-part',
    learn: (c) => [
      {
        title: 'מה זה שבר?',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} פיצה עגולה שחותכים ל-${b('4 חלקים שווים')}.<br>כל חלק הוא ${b('רבע')} מהפיצה, ואנחנו כותבים אותו כך: ${m(F(1, 4))}.<br>שבר מתאר ${HM.hl('חלק משלם')} — השלם יכול להיות פיצה, שוקולד, דרך, או אפילו כיתה שלמה.`,
        visual: V.pie(1, 4, { r: 74 }),
      },
      {
        title: 'מונה ומכנה',
        html: `בשבר ${m(F(3, 5))} יש שני מספרים:<br>• ${b('המכנה')} (למטה) — לכמה ${b('חלקים שווים')} חילקנו את השלם. כאן: 5.<br>• ${b('המונה')} (למעלה) — כמה חלקים לקחנו או צבענו. כאן: 3.<br>טיפ: המכנה "מכנה" את השם של החלק — חמישיות. המונה "מונה" כמה יש.`,
        visual: V.bar(3, 5, { unitLabels: true }),
      },
      {
        title: 'רק חלקים שווים!',
        html: `שבר נכון רק כשכל החלקים ${b('שווים בגודלם')}.<br>בפס העליון כל חלק הוא באמת רבע. בפס התחתון יש 4 חלקים, אבל הם לא שווים — אז החלק הצבוע ${b('אינו')} רבע.`,
        visual: V.bar(1, 4) + S.svg(320, 60, S.rect(4, 4, 140, 52, { cls: 'f-a s-ink', sw: 2 }) + S.rect(144, 4, 40, 52, { cls: 'f-w s-ink', sw: 2 }) + S.rect(184, 4, 60, 52, { cls: 'f-w s-ink', sw: 2 }) + S.rect(244, 4, 72, 52, { cls: 'f-w s-ink', sw: 2 }) + S.rect(4, 4, 312, 52, { fill: 'none', cls: 's-ink', sw: 3, rx: 6 }), { label: 'פס מחולק לא שווה' }),
      },
      {
        title: 'אותו מכנה? משווים את המונים',
        html: `כשהמכנים שווים, החלקים באותו גודל. השבר עם יותר חלקים — גדול יותר.<br>${m(F(3, 8) + ' &lt; ' + F(5, 8))} כי 5 שמיניות זה יותר מ-3 שמיניות.`,
        visual: V.bars([{ n: 3, d: 8 }, { n: 5, d: 8 }], { labels: [{ n: 3, d: 8 }, { n: 5, d: 8 }] }),
      },
      {
        title: 'אותו מונה? משווים את המכנים',
        html: `ככל שמחלקים את השלם ל${b('יותר')} חלקים — כל חלק ${b('קטן יותר')}.<br>לכן ${m(F(1, 3) + ' &gt; ' + F(1, 6))}: שליש הוא חתיכה גדולה יותר משישית.<br>${c.g('תחשוב', 'תחשבי')} על עוגה: אם ${c.g('אתה מתחלק', 'את מתחלקת')} בה עם 6 חברים, כל אחד מקבל פחות מאשר כשמתחלקים עם 3.`,
        visual: V.bars([{ n: 1, d: 3 }, { n: 1, d: 6 }], { labels: [{ n: 1, d: 3 }, { n: 1, d: 6 }] }),
      },
      {
        title: 'דוגמה פתורה',
        html: `מה גדול יותר: ${m(F(2, 5))} או ${m(F(2, 7))}?`,
        steps: [
          `למונים יש אותו ערך: 2. כלומר בשני השברים לקחנו 2 חלקים.`,
          `נבדוק את גודל החלק: חמישית גדולה משביעית, כי חילקנו לפחות חלקים.`,
          `2 חלקים גדולים יותר שווים יותר: ${m(F(2, 5) + ' &gt; ' + F(2, 7))} ✔`,
        ],
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['read', 'read', 'shade', 'parts', 'notShaded', 'story', 'story', 'storyLeft']
        : level === 2 ? ['story', 'story', 'storyLeft', 'storyCmp', 'cmpSameD', 'cmpSameN', 'notShaded', 'shade', 'read']
        : ['order', 'pickPic', 'story', 'cmpSameN', 'storyLeft', 'storyCmp', 'storyCmp'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5, 6, 8]) : c.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
      const n = c.rnd(1, d - 1);
      switch (kind) {
        case 'read': {
          const usePie = d <= 8 && c.chance(0.5);
          return {
            type: 'fraction',
            prompt: `איזה חלק מה${usePie ? 'עיגול' : 'פס'} צבוע?`,
            visual: usePie ? V.pie(n, d) : V.bar(n, d),
            answer: { n, d },
            hint: `${c.g('ספור', 'ספרי')} לכמה חלקים שווים חילקו את ה${usePie ? 'עיגול' : 'פס'} — זה המכנה. אחר כך ${c.g('ספור', 'ספרי')} כמה חלקים צבועים — זה המונה.`,
            solution: [`ה${usePie ? 'עיגול' : 'פס'} מחולק ל-${d} חלקים שווים ← המכנה הוא ${d}.`, `${n === 1 ? 'חלק אחד צבוע' : n + ' חלקים צבועים'} ← המונה הוא ${n}.`, `התשובה: ${m(F(n, d))}`],
          };
        }
        case 'shade':
          return {
            type: 'shade', shape: d <= 8 && c.chance(0.4) ? 'pie' : 'bar', parts: d, answer: n,
            prompt: `${c.g('צבע', 'צבעי')} ${m(F(n, d))} מהצורה (${c.g('גע', 'געי')} בחלקים כדי לצבוע אותם).`,
            hint: `המכנה ${d} אומר שהצורה מחולקת ל-${d} חלקים. המונה ${n} אומר כמה לצבוע.`,
            solution: [`צריך לצבוע ${HM.cnt(n, 'חלק', 'חלקים')} מתוך ${d}.`],
          };
        case 'parts': {
          const askD = c.chance(0.5);
          return {
            type: 'number', answer: askD ? d : n,
            prompt: `בשבר ${m(F(n, d))}, מה ${askD ? 'המכנה' : 'המונה'}?`,
            hint: 'המונה למעלה, המכנה למטה.',
            solution: [`המונה הוא ${n} (למעלה), המכנה הוא ${d} (למטה).`],
          };
        }
        case 'notShaded':
          return {
            type: 'fraction', prompt: 'איזה חלק מהפס <b>לא</b> צבוע?', visual: V.bar(n, d), answer: { n: d - n, d },
            hint: `${c.g('ספור', 'ספרי')} את החלקים הלבנים.`,
            solution: [`יש ${d} חלקים, ${n} מהם צבועים.`, `לבנים: ${m(`${d} − ${n} = ${d - n}`)}.`, `התשובה: ${m(F(d - n, d))}`],
          };
        case 'story':
        case 'storyLeft': {
          const left = kind === 'storyLeft';
          // the: השלם בה"א הידיעה, wf: השלם בלשון נקבה, u/us: יחידה ברבים/ביחיד, fem: היחידה בלשון נקבה
          const sc = c.scene([
            { tags: ['baking'], the: 'העוגה', wf: true, us: 'חלק', u: 'חלקים', verb: c.g('אכל', 'אכלה') },
            { tags: ['baking'], the: 'הפיצה', wf: true, us: 'משולש', u: 'משולשים', verb: c.g('אכל', 'אכלה') },
            { tags: ['games'], the: 'השלב במשחק', us: 'משימה', u: 'משימות', fem: true, verb: c.g('השלים', 'השלימה') },
            { tags: ['reading'], the: 'הספר', us: 'פרק', u: 'פרקים', verb: c.g('קרא', 'קראה') },
            { tags: ['art'], the: 'הציור', us: 'אזור', u: 'אזורים', verb: c.g('צבע', 'צבעה') },
            { tags: ['sport'], the: 'מסלול הריצה', us: 'קטע', u: 'קטעים', verb: c.g('רץ', 'רצה') },
            { tags: ['nature'], the: 'שביל הטיול', us: 'קטע', u: 'קטעים', verb: c.g('הלך', 'הלכה') },
            { tags: ['music'], the: 'השיר', us: 'בית', u: 'בתים', verb: c.g('שר', 'שרה') },
            { tags: ['space'], the: 'המסע לירח', us: 'שלב', u: 'שלבים', verb: c.g('עבר', 'עברה') },
            { tags: ['tech'], the: 'הקוד של הרובוט', us: 'שורה', u: 'שורות', fem: true, verb: c.g('כתב', 'כתבה') },
            { tags: ['kpop'], the: 'הריקוד החדש של הלהקה', us: 'קטע', u: 'קטעים', verb: c.g('למד', 'למדה') },
            { tags: ['magic'], the: 'ספר הלחשים', us: 'פרק', u: 'פרקים', verb: c.g('קרא', 'קראה') },
            { tags: ['squishy'], the: 'מדף הסקווישים', us: 'תא', u: 'תאים', verb: c.g('מילא', 'מילאה') },
          ]);
          const parts = (k) => HM.cnt(k, sc.us, sc.u, sc.fem);
          return {
            type: 'fraction',
            prompt: `${sc.the} ${sc.wf ? 'מחולקת' : 'מחולק'} ל-${d} ${sc.u} ${sc.fem ? 'שוות' : 'שווים'}. ${c.name} ${sc.verb} ${parts(n)}.<br>איזה חלק מ${sc.the} ${left ? '<b>נשאר</b>' : `${c.name} ${sc.verb}`}?`,
            answer: { n: left ? d - n : n, d },
            hint: left ? `קודם ${c.g('מצא', 'מצאי')} כמה ${sc.u} נשארו, ואז ${c.g('כתוב', 'כתבי')} שבר.` : 'המכנה הוא מספר כל החלקים, והמונה הוא מספר החלקים שלקחנו.',
            solution: left
              ? [`בסך הכול: ${d} ${sc.u}.`, `נשארו ${m(`${d} − ${n} = ${d - n}`)}.`, `התשובה: ${m(F(d - n, d))}`]
              : [`בסך הכול ${d} ${sc.u} ← המכנה ${d}.`, `${c.name} ${sc.verb} ${parts(n)} ← המונה ${n}.`, `התשובה: ${m(F(n, d))}`],
          };
        }
        case 'cmpSameD': {
          let n2 = c.rnd(1, d - 1); if (n2 === n && c.chance(0.7)) n2 = n === d - 1 ? n - 1 : n + 1;
          if (n2 < 1) n2 = 1;
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: F(n, d), right: F(n2, d), lv: n / d, rv: n2 / d,
            answer: n === n2 ? '=' : n < n2 ? '<' : '>',
            hint: 'למכנים יש אותו ערך — החלקים באותו גודל. ' + c.g('השווה', 'השווי') + ' את המונים.',
            solution: [`המכנים שווים (${d}), לכן משווים מונים: ${n} ו-${n2}.`],
          };
        }
        case 'cmpSameN': {
          const nn = c.rnd(1, 4);
          const ds = c.shuffle([3, 4, 5, 6, 7, 8, 9, 10, 12].filter((x) => x > nn)).slice(0, 2);
          const [d1, d2] = ds;
          return {
            type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
            left: F(nn, d1), right: F(nn, d2), lv: nn / d1, rv: nn / d2,
            answer: d1 === d2 ? '=' : d1 < d2 ? '>' : '<',
            hint: 'המונים שווים. איפה החלקים גדולים יותר — כשמחלקים לפחות חלקים או ליותר?',
            solution: [`המונים שווים (${nn}).`, `ככל שהמכנה קטן יותר, החלק גדול יותר.`, `${d1 < d2 ? m(F(nn, d1) + ' &gt; ' + F(nn, d2)) : m(F(nn, d1) + ' &lt; ' + F(nn, d2))}`],
          };
        }
        case 'storyCmp': {
          // מי אכל/ה יותר? רמה 2: אותו מכנה. רמה 3: אותו מונה (פיצות שנחתכו למספר שונה של משולשים)
          const f = c.friend();
          const sc = c.scene([
            { tags: ['baking'], the: 'פיצה', u: 'משולשים', verbM: 'אכל', verbF: 'אכלה', wf: true },
            { tags: ['baking'], the: 'עוגה', u: 'חתיכות', verbM: 'אכל', verbF: 'אכלה', wf: true, uf: true },
            { tags: ['reading', 'magic'], the: 'ספר כישופים', u: 'פרקים', verbM: 'קרא', verbF: 'קראה' },
            { tags: ['sport'], the: 'מסלול ריצה', u: 'קטעים', verbM: 'רץ', verbF: 'רצה' },
            { tags: ['kpop', 'music'], the: 'ריקוד קיי-פופ', u: 'חלקים', verbM: 'למד', verbF: 'למדה' },
            { tags: ['art', 'squishy'], the: 'דף צביעה של סקווישים', u: 'אזורים', verbM: 'צבע', verbF: 'צבעה' },
            { tags: ['games', 'tech'], the: 'שלב במשחק', u: 'משימות', verbM: 'השלים', verbF: 'השלימה', uf: true },
            { tags: ['nature', 'animals', 'space'], the: 'מסלול טיול', u: 'קטעים', verbM: 'הלך', verbF: 'הלכה' },
          ]);
          const sameN = level === 3 && c.chance(0.6);
          let n1, d1, n2, d2;
          if (sameN) { n1 = n2 = c.rnd(1, 3); [d1, d2] = c.sample([4, 5, 6, 8, 10, 12].filter((x) => x > n1), 2); }
          else { d1 = d2 = c.pick([5, 6, 8, 10, 12]); [n1, n2] = c.sample(HM.range(1, d1 - 1), 2); }
          const v1 = n1 / d1, v2 = n2 / d2;
          const me = c.me;
          const shares = sameN
            ? `ל${me.name} ול${f.name} יש ${sc.the} זהה. ${me.name} ${me.g(sc.verbM, sc.verbF)} ${m(F(n1, d1))} ${sc.wf ? 'ממנה' : 'ממנו'}, ו${f.name} ${f.g(sc.verbM, sc.verbF)} ${m(F(n2, d2))}.`
            : `ל${me.name} ול${f.name} יש ${sc.the} זהה, ${sc.wf ? 'מחולקת' : 'מחולק'} ל-${d1} ${sc.u} ${sc.uf ? 'שוות' : 'שווים'}. ${me.name} ${me.g(sc.verbM, sc.verbF)} ${m(F(n1, d1))} ${sc.wf ? 'ממנה' : 'ממנו'}, ו${f.name} ${f.g(sc.verbM, sc.verbF)} ${m(F(n2, d2))}.`;
          const winner = v1 > v2 ? me : f;
          return {
            type: 'choice', keep: true,
            prompt: `${shares}<br>מי ${sc.verbM} חלק גדול יותר?`,
            choices: [me.name, f.name],
            answer: v1 > v2 ? 0 : 1,
            hint: sameN ? 'המונים שווים. באיזה שבר החלקים גדולים יותר — כשהמכנה קטן או גדול?' : `המכנים שווים, כלומר החלקים באותו גודל. ${c.g('השווה', 'השווי')} את המונים.`,
            solution: sameN
              ? [`המונים שווים (${n1}).`, `ככל שהמכנה קטן יותר, כל חלק גדול יותר.`, `${m(F(n1, d1) + (v1 > v2 ? ' &gt; ' : ' &lt; ') + F(n2, d2))}, ולכן ל${winner.name} חלק גדול יותר.`]
              : [`המכנים שווים (${d1}).`, `${n1} ${v1 > v2 ? '&gt;' : '&lt;'} ${n2}, ולכן ${m(F(n1, d1) + (v1 > v2 ? ' &gt; ' : ' &lt; ') + F(n2, d2))}.`, `ל${winner.name} חלק גדול יותר.`],
          };
        }
        case 'order': {
          const sameN = c.chance(0.5);
          let items;
          if (sameN) { const nn = c.rnd(1, 2); items = c.sample([3, 4, 5, 6, 8, 10, 12].filter((x) => x > nn), 4).map((dd) => ({ n: nn, d: dd })); }
          else { const dd = c.pick([7, 8, 9, 10, 12]); items = c.sample(HM.range(1, dd - 1), 4).map((nn) => ({ n: nn, d: dd })); }
          const sorted = items.map((x, i) => i).sort((i, j) => items[i].n / items[i].d - items[j].n / items[j].d);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את השברים <b>מהקטן לגדול</b>:`,
            items: items.map((x) => m(F(x.n, x.d))), answer: sorted,
            hint: sameN ? 'המונים שווים — המכנה הגדול ביותר נותן את השבר הקטן ביותר.' : 'המכנים שווים — ' + c.g('השווה', 'השווי') + ' את המונים.',
            solution: [sorted.map((i) => F(items[i].n, items[i].d)).map(m).join(' , ')],
          };
        }
        case 'pickPic': {
          const target = { n, d: Math.min(d, 8) };
          if (target.n >= target.d) target.n = target.d - 1;
          const T = target;
          const wrong1 = V.bar(T.n, T.d + 1, { maxw: 220 });
          const wrong2 = V.bar(T.d - T.n, T.d, { maxw: 220 });
          const wrong3 = S.svg(320, 60, (() => { let s = '', x = 4; const ws = HM.range(0, T.d - 1).map((i) => (i === 0 ? 2 : 1)); const tot = HM.sum(ws); ws.forEach((wv, i) => { const w = (312 * wv) / tot; s += S.rect(316 - (x - 4) - w, 4, w, 52, { cls: (i < T.n ? 'f-a' : 'f-w') + ' s-ink', sw: 2 }); x += w; }); return s + S.rect(4, 4, 312, 52, { fill: 'none', cls: 's-ink', sw: 3, rx: 6 }); })(), { maxw: 220 });
          const choices = [V.bar(T.n, T.d, { maxw: 220 }), wrong1, T.d - T.n !== T.n ? wrong2 : V.bar(Math.max(1, T.n - 1), T.d, { maxw: 220 }), wrong3];
          return {
            type: 'choice', prompt: `באיזה ציור צבוע בדיוק ${m(F(T.n, T.d))}?`, choices, answer: 0, cols: 2,
            hint: `${c.g('בדוק', 'בדקי')} שני דברים: שהחלקים שווים, ושמספר החלקים הצבועים מתאים למונה.`,
            solution: [`צריך ${T.d} חלקים שווים ו-${T.n} מהם צבועים.`],
          };
        }
      }
    },
  });

  /* ====================================================================
     כלי עזר משותפים לשאר השיעורים בקובץ
     ==================================================================== */
  const fr = (n, d) => m(F(n, d));
  const mx = (w, n, d) => m(HM.mixed(w, n, d));
  const NL = (o) => V.numberLine(Object.assign({ w: 380 }, o));
  const row = (...xs) => `<div class="row">${xs.join('')}</div>`;
  const cntSeg = (k) => HM.cnt(k, 'קטע', 'קטעים');
  const cntPart = (k) => HM.cnt(k, 'חלק', 'חלקים');
  const SIGN = (a, bb) => (Math.abs(a - bb) < 1e-9 ? '=' : a < bb ? '<' : '>');
  const SIGNH = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  // מונה זר למכנה (כדי שהשבר יהיה מצומצם)
  const coprime = (c, d, lo, hi) => c.pick(HM.range(lo || 1, hi || d - 1).filter((x) => HM.gcd(x, d) === 1));
  const redF = (n, d) => { const g = HM.gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  const fkey = (f) => { const r = redF(f.n, f.d); return r.n + '/' + r.d; };
  const okF = (f) => f && Number.isInteger(f.n) && Number.isInteger(f.d) && f.d > 0 && f.n >= 0;
  // בחירות של שברים: הראשונה נכונה; byValue — כל מסיח בערך שונה (אחרת: רק כתיב שונה)
  function fracChoices(right, wrongs, k, byValue) {
    const key = (f) => (byValue ? fkey(f) : f.n + '/' + f.d);
    const seen = new Set([key(right)]), out = [right];
    wrongs.forEach((f) => { if (out.length >= (k || 4) || !okF(f)) return; const kk = key(f); if (seen.has(kk)) return; seen.add(kk); out.push(f); });
    return out;
  }
  // קבוצות של עיגולים, hl הקבוצות הראשונות מודגשות
  function groupsHL(count, size, hl, o) {
    o = o || {};
    const per = Math.ceil(Math.sqrt(size)), cell = 16, gw = per * cell + 16, gh = Math.ceil(size / per) * cell + 16;
    const perRow = Math.min(count, o.perRow || 5);
    const w = perRow * (gw + 10), h = Math.ceil(count / perRow) * (gh + 10);
    let s = '';
    for (let g = 0; g < count; g++) {
      const gx = w - (g % perRow + 1) * (gw + 10) + 5, gy = Math.floor(g / perRow) * (gh + 10) + 5;
      const on = g < (hl || 0);
      s += S.rect(gx, gy, gw, gh, { rx: 12, cls: (on ? 'f-y' : 'f-l') + ' s-a', sw: 2 });
      for (let k = 0; k < size; k++) s += S.circle(gx + 8 + (k % per + 0.5) * cell, gy + 8 + (Math.floor(k / per) + 0.5) * cell, 6, { cls: on ? 'f-c' : 'f-a' });
    }
    return S.svg(w, h, s, { label: `${count} קבוצות של ${size}`, maxw: Math.min(w, o.maxw || 340) });
  }

  /* ========== שברים על ישר המספרים ========== */
  // מסלולים: the = שם מיודע (wf = נקבה), who = הנושא כשהוא לא הילד/ה (whoF = נקבה), v = הפועל [ז, נ], stop = [ז, נ]
  const TRACKS = [
    { tags: ['sport'], the: 'מסלול הריצה', v: ['רץ', 'רצה'] },
    { tags: ['nature'], the: 'שביל הטיול', v: ['הלך', 'הלכה'] },
    { tags: ['animals'], the: 'שביל הגינה', who: (p) => `הצב של ${p.name}`, v: ['זחל', 'זחלה'] },
    { tags: ['space'], the: 'מסלול הניסוי', who: (p) => `רכב החלל של ${p.name}`, v: ['נסע', 'נסעה'] },
    { tags: ['tech'], the: 'המסילה', wf: true, who: (p) => `הרובוט של ${p.name}`, v: ['נסע', 'נסעה'] },
    { tags: ['music'], the: 'מסלול המצעד', v: ['צעד', 'צעדה'] },
    { tags: ['baking'], the: 'הדרך למאפייה', wf: true, v: ['הלך', 'הלכה'] },
    { tags: ['reading'], the: 'הדרך לספרייה', wf: true, v: ['הלך', 'הלכה'] },
    { tags: ['games'], the: 'הגשר במשחק', who: (p) => `הדמות של ${p.name}`, whoF: true, v: ['עבר', 'עברה'] },
    { tags: ['art'], the: 'סרט הקישוט', v: ['צבע', 'צבעה'], stop: ['הפסיק לצבוע', 'הפסיקה לצבוע'] },
    { tags: ['kpop'], the: 'הדרך לאולם ההופעות', wf: true, v: ['הלך', 'הלכה'] },
    { tags: ['magic'], the: 'מסלול המטאטאים', v: ['טס', 'טסה'] },
    { tags: ['squishy'], the: 'הדרך לחנות הסקווישים', wf: true, v: ['הלך', 'הלכה'] },
  ];
  const trackSubj = (sc, p) => (sc.who ? { name: sc.who(p), g: (a, bb) => (sc.whoF ? bb : a) } : p);
  const lineTapQ = (c, n, d, max) => ({
    type: 'numberline', line: { min: 0, max: max || 1, den: d }, answer: n / d,
    prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${fr(n, d)}.`,
    hint: `${max > 1 ? `${c.g('שים', 'שימי')} לב: קטע היחידה הוא מ-0 עד 1, לא עד ${max}. ` : ''}קטע היחידה מחולק ל-${d} קטעים שווים, וכל קטע הוא ${fr(1, d)}. ${c.g('ספור', 'ספרי')} ${cntSeg(n)} מ-0.`,
    solution: [`כל קטע קטן הוא ${fr(1, d)}.`, `סופרים ${cntSeg(n)} מ-0 לכיוון 1.`, `שם נמצא ${fr(n, d)}.`],
  });

  HM.lesson({
    id: 'f-line',
    learn: (c) => [
      {
        title: 'שברים גרים בין המספרים',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} שביל ישר מהבית (0) עד הגן הציבורי (1). בדיוק באמצע הדרך יש ספסל — הוא נמצא ב${b('חצי')} הדרך, ב-${fr(1, 2)}.<br>גם על ישר המספרים יש מקום ל${b('שברים')}: הם נמצאים ${HM.hl('בין המספרים השלמים')}.`,
        visual: NL({ min: 0, max: 1, den: 2, marks: [{ v: 0.5, label: { n: 1, d: 2 } }] }),
      },
      {
        title: 'קטע היחידה',
        html: `הקטע מ-0 עד 1 נקרא ${b('קטע היחידה')}.<br>כדי לסמן שברים, מחלקים אותו ל${b('קטעים שווים')}. המכנה אומר לכמה קטעים: כאן 4, ולכן כל קטע הוא ${fr(1, 4)}.<br>${c.g('שים', 'שימי')} לב: ${HM.hl('סופרים קטעים, לא קווים')}! ב-4 קטעים יש 5 קווים.`,
        visual: NL({ min: 0, max: 1, den: 4, fracLabels: true }),
      },
      {
        title: 'כל קטעי היחידה שווים',
        html: `על ישר המספרים המרחק מ-0 עד 1 שווה למרחק מ-1 עד 2 ומ-2 עד 3.<br>לכן אם ${c.g('אתה יודע', 'את יודעת')} איפה נמצא ${fr(1, 3)}, ${c.g('אתה יכול', 'את יכולה')} למצוא את 1: ${b('3 קפיצות')} של ${fr(1, 3)} מ-0 מגיעות בדיוק ל-1.`,
        visual: NL({ min: 0, max: 2, den: 3, jumps: [{ from: 0, to: 1 / 3 }, { from: 1 / 3, to: 2 / 3 }, { from: 2 / 3, to: 1 }], marks: [{ v: 1 / 3 }] }),
      },
      {
        title: 'איך מסמנים שבר?',
        html: `נסמן על הישר את ${fr(3, 5)}.`,
        steps: [
          `המכנה הוא 5: מחלקים את הקטע מ-0 עד 1 ל-5 קטעים שווים. כל קטע הוא ${fr(1, 5)}.`,
          `המונה הוא 3: מתחילים ב-0 וסופרים 3 קטעים לכיוון 1.`,
          `מסמנים נקודה בסוף הקטע השלישי — זה ${fr(3, 5)} ✔`,
        ],
        visual: NL({ min: 0, max: 1, den: 5, jumps: [{ from: 0, to: 0.2 }, { from: 0.2, to: 0.4 }, { from: 0.4, to: 0.6 }], marks: [{ v: 0.6 }] }),
      },
      {
        title: 'שבר אחד, שלוש תמונות',
        html: `את ${fr(3, 4)} אפשר להראות ב${b('עיגול')}, ב${b('מלבן')} וב${b('ישר המספרים')}.<br>בכל תמונה השלם מחולק ל-4 חלקים שווים ולוקחים 3 מהם. בישר המספרים השלם הוא ${b('קטע היחידה')}, והחלק הוא המרחק מ-0.`,
        visual: row(V.pie(3, 4, { r: 42 }), V.bar(3, 4, { w: 200, maxw: 160 }), NL({ min: 0, max: 1, den: 4, marks: [{ v: 0.75 }], w: 260, maxw: 260 })),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, ${c.g('נסה', 'נסי')} בעצמך: ${c.g('גע', 'געי')} בקו הנכון על הישר.`,
        quiz: lineTapQ(c, 2, 3),
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['tap', 'tap', 'read', 'segs', 'segFrac', 'rep', 'storyFrac', 'storyLine', 'storyFrac', 'storyLine']
        : level === 2 ? ['tap', 'read', 'rep', 'tf', 'storyLine', 'storyFrac', 'storyLine']
        : ['tap2', 'tapHalf', 'read2', 'findOne', 'tf', 'storyTwo', 'storyCmp', 'storyTwo', 'storyCmp'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5, 6, 8]) : c.pick([3, 4, 5, 6, 7, 8, 9, 10]);
      const n = c.rnd(1, d - 1);
      switch (kind) {
        case 'tap': return lineTapQ(c, n, d);
        case 'tap2': return lineTapQ(c, n, d, 2);
        case 'tapHalf': {
          const dd = c.pick([2, 3, 4, 5]), nn = coprime(c, dd), D = dd * 2;
          return {
            type: 'numberline', line: { min: 0, max: 1, den: D }, answer: nn / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${fr(nn, dd)}. ${c.g('שים', 'שימי')} לב לגודל הקטעים!`,
            hint: `קטע היחידה מחולק ל-${D} קטעים קטנים. כמה קטעים קטנים יחד הם ${fr(1, dd)}?`,
            solution: [`כל קטע קטן הוא ${fr(1, D)}, ושני קטעים קטנים הם ${fr(1, dd)}.`, `${fr(nn, dd)} ${nn === 1 ? 'הוא' : 'הם'} ${2 * nn} קטעים קטנים מ-0.`, `${m(F(nn, dd) + ' = ' + F(2 * nn, D))}`],
          };
        }
        case 'read':
        case 'read2': {
          const max = kind === 'read2' ? 2 : 1;
          return {
            type: 'fraction', prompt: 'איזה שבר מסומן על ישר המספרים?',
            visual: NL({ min: 0, max, den: d, marks: [{ v: n / d }] }),
            answer: { n, d },
            hint: `${max > 1 ? `${c.g('שים', 'שימי')} לב: קטע היחידה הוא מ-0 עד 1, לא עד 2. ` : ''}לכמה קטעים שווים מחולק קטע היחידה? כמה קטעים יש מ-0 עד הנקודה?`,
            solution: [`קטע היחידה מחולק ל-${d} קטעים ← המכנה ${d}.`, `מ-0 עד הנקודה יש ${cntSeg(n)} ← המונה ${n}.`, `התשובה: ${fr(n, d)}`],
          };
        }
        case 'segs': {
          const toPoint = c.chance(0.5);
          return toPoint ? {
            type: 'number', answer: n,
            prompt: `כמה קטעים של ${fr(1, d)} יש מ-0 עד הנקודה המסומנת?`,
            visual: NL({ min: 0, max: 1, den: d, marks: [{ v: n / d }] }),
            hint: `${c.g('ספור', 'ספרי')} את הרווחים בין הקווים, מ-0 ועד הנקודה.`,
            solution: [`קטע היחידה מחולק ל-${d} קטעים, וכל קטע הוא ${fr(1, d)}.`, `מ-0 עד הנקודה יש ${cntSeg(n)}.`],
          } : {
            type: 'number', answer: d,
            prompt: 'לכמה קטעים שווים מחולק קטע היחידה (מ-0 עד 1)?',
            visual: NL({ min: 0, max: 1, den: d }),
            hint: `${c.g('ספור', 'ספרי')} רווחים, לא קווים. ב-${cntSeg(2)} יש 3 קווים.`,
            solution: [`מ-0 עד 1 יש ${d + 1} קווים.`, `ביניהם יש ${d} קטעים שווים.`],
          };
        }
        case 'segFrac':
          return {
            type: 'fraction', answer: { n: 1, d },
            prompt: 'קטע היחידה מחולק לקטעים שווים. איזה שבר מתאים לכל קטע קטן?',
            visual: NL({ min: 0, max: 1, den: d }),
            hint: `${c.g('ספור', 'ספרי')} לכמה קטעים שווים חילקו את קטע היחידה. זה המכנה.`,
            solution: [`קטע היחידה מחולק ל-${d} קטעים שווים.`, `כל קטע הוא ${fr(1, d)}.`],
          };
        case 'rep': {
          const dd = Math.min(d, 8), nn = Math.min(n, dd - 1);
          const usePie = c.chance(0.5);
          const line = (k, den) => NL({ min: 0, max: 1, den, marks: [{ v: k / den }], w: 300 });
          const opts = [[nn, dd], [nn, dd + 1], [dd - nn, dd], [nn > 1 ? nn - 1 : nn + 1, dd], [nn + 1 < dd ? nn + 1 : nn - 1, dd], [nn + 1, dd + 1], [nn, dd - 1]];
          const seen = new Set(), choices = [];
          opts.forEach(([k, den]) => { const key = k + '/' + den; if (k < 1 || k >= den || seen.has(key) || (choices.length && k * dd === nn * den)) return; seen.add(key); if (choices.length < 4) choices.push(line(k, den)); });
          return {
            type: 'choice', choices, answer: 0,
            prompt: `באיזה ישר מסומן אותו שבר כמו ב${usePie ? 'עיגול' : 'מלבן'}?`,
            visual: usePie ? V.pie(nn, dd, { r: 50 }) : V.bar(nn, dd, { maxw: 240 }),
            hint: `קודם ${c.g('מצא', 'מצאי')} איזה שבר צבוע ב${usePie ? 'עיגול' : 'מלבן'}. אחר כך ${c.g('בדוק', 'בדקי')} בכל ישר לכמה קטעים מחולק קטע היחידה ועל איזה קטע נמצאת הנקודה.`,
            solution: [`ב${usePie ? 'עיגול' : 'מלבן'} צבוע ${fr(nn, dd)}.`, `בישר הנכון קטע היחידה מחולק ל-${dd} קטעים, והנקודה נמצאת אחרי ${cntSeg(nn)} מ-0.`],
          };
        }
        case 'tf': {
          const max = level === 3 ? c.pick([1, 2]) : 1;
          const mode = c.pick(['true', 'true', 'ticks', 'zero']);
          let sn = n, sd = d;
          if (mode === 'ticks') sd = d + 1;
          if (mode === 'zero') sn = n + 1;
          if (sn >= sd) { sn = n; sd = d; }
          const truth = sn * d === n * sd;
          return {
            type: 'tf', answer: truth,
            prompt: `הנקודה המסומנת על הישר היא ${fr(sn, sd)}.`,
            visual: NL({ min: 0, max, den: d, marks: [{ v: n / d }] }),
            hint: `${c.g('ספור', 'ספרי')} לכמה קטעים (לא קווים!) מחולק הקטע מ-0 עד 1, ואחר כך כמה קטעים יש מ-0 עד הנקודה.`,
            solution: [`קטע היחידה מחולק ל-${d} קטעים, ומ-0 עד הנקודה יש ${cntSeg(n)}.`, `הנקודה היא ${fr(n, d)}, ולכן הטענה ${truth ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
        case 'findOne': {
          const dd = c.pick([3, 4, 5, 6, 7, 8]), k = c.rnd(1, Math.min(3, dd - 1)), extra = c.rnd(2, 4), tot = dd + extra;
          return {
            type: 'numberline', answer: 1,
            line: { min: 0, max: tot / dd, step: 1 / dd, labels: (v, i) => (i === 0 ? '0' : i === k ? { n: k, d: dd } : null) },
            prompt: `על הישר מסומנים רק 0 ו-${fr(k, dd)}, והמרחקים בין הקווים שווים. ${c.g('סמן', 'סמני')} איפה נמצא המספר 1.`,
            hint: `מ-0 עד ${fr(k, dd)} יש ${cntSeg(k)}, ולכן כל קטע הוא ${fr(1, dd)}. כמה קטעים כאלה יש ב-1?`,
            solution: [`כל קטע הוא ${fr(1, dd)}.`, `${m('1 = ' + F(dd, dd))}, כלומר ${dd} קטעים מ-0.`, `המספר 1 נמצא בקו ה-${dd} אחרי 0.`],
          };
        }
        case 'storyCmp': {
          const sc = c.scene(TRACKS.filter((t) => !t.who && !t.stop));
          const p1 = c.me, p2 = c.friend(), sameD = c.chance(0.5);
          let a1, d1, a2, d2;
          if (sameD) { d1 = d2 = c.rnd(5, 10); [a1, a2] = c.sample(HM.range(1, d1 - 1), 2); }
          else { a1 = a2 = c.rnd(1, 4); [d1, d2] = c.sample(HM.range(a1 + 1, 10), 2); }
          const v1 = p1.g(sc.v[0], sc.v[1]), v2 = p2.g(sc.v[0], sc.v[1]), ans = a1 / d1 > a2 / d2 ? 0 : 1;
          const both = p1.gender === 'f' && p2.gender === 'f' ? 'שתיהן' : 'שניהם';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p1.name, p2.name, `${both} באותה מידה`],
            prompt: `${p1.name} ${v1} ${fr(a1, d1)} מ${sc.the}, ו${p2.name} ${v2} ${fr(a2, d2)} מ${sc.the}.<br>מי ${sc.v[0]} יותר?`,
            hint: `${c.g('דמיין', 'דמייני')} את שני השברים על ישר המספרים מ-0 עד 1. ${sameD ? 'המכנים שווים — ' + c.g('השווה', 'השווי') + ' את המונים.' : 'המונים שווים — באיזה שבר כל קטע גדול יותר?'}`,
            solution: [sameD ? `כל הקטעים באותו גודל — ${fr(1, d1)} — ולכן משווים את המונים: ${a1} ו-${a2}.` : `המונים שווים (${a1}), ו-${fr(1, Math.min(d1, d2))} גדול מ-${fr(1, Math.max(d1, d2))}.`, `${m(F(a1, d1) + ` ${SIGNH(SIGN(a1 / d1, a2 / d2))} ` + F(a2, d2))}, ולכן ${ans === 0 ? p1.name + ' ' + v1 : p2.name + ' ' + v2} יותר.`],
          };
        }
        case 'storyLine':
        case 'storyFrac':
        case 'storyTwo': {
          const sc = c.scene(TRACKS);
          const p = c.chance(0.6) ? c.me : c.friend();
          const S1 = trackSubj(sc, p), verb = S1.g(sc.v[0], sc.v[1]), stop = S1.g(...(sc.stop || ['עצר', 'עצרה']));
          const split = `${sc.the} ${sc.wf ? 'מחולקת' : 'מחולק'} ל-${d} קטעים שווים.`;
          if (kind === 'storyLine') return {
            type: 'numberline', line: { min: 0, max: 1, den: d }, answer: n / d,
            prompt: `${S1.name} ${verb} ${fr(n, d)} מ${sc.the} ו${stop}.<br>${c.g('סמן', 'סמני')} על הישר איפה ${S1.g('הוא', 'היא')} ${stop} (0 — ההתחלה, 1 — הסוף).`,
            hint: `הקטע מ-0 עד 1 הוא כל ${sc.the}. הוא מחולק ל-${d} קטעים שווים — ${c.g('ספור', 'ספרי')} ${cntSeg(n)} מ-0.`,
            solution: [`כל קטע הוא ${fr(1, d)} מ${sc.the}.`, `סופרים ${cntSeg(n)} מ-0 ומסמנים את ${fr(n, d)}.`],
          };
          if (kind === 'storyFrac') return {
            type: 'fraction', answer: { n, d },
            prompt: `${split} ${S1.name} ${verb} ${cntSeg(n)} ו${stop}.<br>איזה חלק מ${sc.the} ${S1.name} ${verb}?`,
            visual: NL({ min: 0, max: 1, den: d, marks: [{ v: n / d }] }),
            hint: 'המכנה הוא מספר כל הקטעים, והמונה הוא מספר הקטעים שעברו.',
            solution: [`בסך הכול ${d} קטעים ← המכנה ${d}.`, `${S1.name} ${verb} ${cntSeg(n)} ← המונה ${n}.`, `התשובה: ${fr(n, d)}`],
          };
          const dd = Math.max(d, 5), a = c.rnd(1, dd - 3), bb = c.rnd(1, dd - 1 - a), left = c.chance(0.5);
          const done = a + bb;
          return {
            type: 'fraction', answer: { n: left ? dd - done : done, d: dd },
            prompt: `${sc.the} ${sc.wf ? 'מחולקת' : 'מחולק'} ל-${dd} קטעים שווים. ${S1.name} ${verb} ${cntSeg(a)}, ${S1.g('עשה', 'עשתה')} הפסקה, ואז ${verb} עוד ${cntSeg(bb)}.<br>${left ? `איזה חלק מ${sc.the} ${S1.g('נשאר לו', 'נשאר לה')}?` : `איזה חלק מ${sc.the} ${S1.name} ${verb} בסך הכול?`}`,
            hint: left ? `קודם ${c.g('חשב', 'חשבי')} כמה קטעים ${S1.name} ${verb} בסך הכול, ואחר כך כמה קטעים נשארו.` : `${c.g('חבר', 'חברי')} את הקטעים, ואז ${c.g('כתוב', 'כתבי')} שבר מתוך ${dd} קטעים.`,
            solution: left
              ? [`בסך הכול ${m(`${a} + ${bb} = ${done}`)} קטעים.`, `נשארו ${m(`${dd} − ${done} = ${dd - done}`)} קטעים.`, `התשובה: ${fr(dd - done, dd)}`]
              : [`בסך הכול ${m(`${a} + ${bb} = ${done}`)} קטעים מתוך ${dd}.`, `התשובה: ${fr(done, dd)}`],
          };
        }
      }
    },
  });

  /* ========== השלמה ל-1 ========== */
  // שלמים לבעיות: the = שם מיודע, v = פועל [ז, נ], rest = מה שנשאר (מתאים ל"חלק")
  const WHOLES = [
    { tags: ['baking'], the: 'הפיצה', v: ['אכל', 'אכלה'], rest: 'נשאר' },
    { tags: ['baking'], the: 'העוגה', v: ['אכל', 'אכלה'], rest: 'נשאר' },
    { tags: ['reading'], the: 'הסיפור', v: ['הקריא', 'הקריאה'], rest: 'עוד לא הוקרא' },
    { tags: ['games'], the: 'המבצר במשחק', v: ['בנה', 'בנתה'], rest: 'עוד לא נבנה' },
    { tags: ['sport'], the: 'מרוץ השליחים', v: ['רץ', 'רצה'], rest: 'נשאר לרץ השלישי' },
    { tags: ['nature'], the: 'הערוגה בגינה', v: ['שתל', 'שתלה'], rest: 'עוד לא נשתל' },
    { tags: ['music'], the: 'שיר הסיום', v: ['שר', 'שרה'], rest: 'נשאר לשיר' },
    { tags: ['art'], the: 'ציור הקיר', v: ['צבע', 'צבעה'], rest: 'עוד לא נצבע' },
    { tags: ['space'], the: 'הפאזל של מערכת השמש', v: ['הרכיב', 'הרכיבה'], rest: 'עוד לא הורכב' },
    { tags: ['tech'], the: 'הקוד של הרובוט', v: ['כתב', 'כתבה'], rest: 'עוד לא נכתב' },
    { tags: ['animals'], the: 'הכלוב של הארנבים', v: ['ניקה', 'ניקתה'], rest: 'עוד לא נוקה' },
    { tags: ['kpop'], the: 'הריקוד החדש של הלהקה', v: ['למד', 'למדה'], rest: 'נשאר ללמוד' },
    { tags: ['magic'], the: 'ספר הלחשים', v: ['העתיק', 'העתיקה'], rest: 'עוד לא הועתק' },
    { tags: ['squishy'], the: 'מדף הסקווישים', v: ['מילא', 'מילאה'], rest: 'עוד לא מולא' },
  ];

  // כל אחד והמשימה שלו (own = מוסיפים "שלו/שלה")
  const CLOSER = [
    { tags: ['baking'], the: 'הפיצה', own: true, v: ['אכל', 'אכלה'] },
    { tags: ['baking'], the: 'העוגה', own: true, v: ['אכל', 'אכלה'] },
    { tags: ['reading'], the: 'הספר', own: true, v: ['קרא', 'קראה'] },
    { tags: ['games'], the: 'השלב', own: true, v: ['השלים', 'השלימה'] },
    { tags: ['sport'], the: 'מסלול הריצה', v: ['רץ', 'רצה'] },
    { tags: ['nature'], the: 'שביל הטיול', v: ['הלך', 'הלכה'] },
    { tags: ['music'], the: 'השיר החדש', v: ['למד', 'למדה'] },
    { tags: ['art'], the: 'הציור', own: true, v: ['צבע', 'צבעה'] },
    { tags: ['space'], the: 'הפאזל', own: true, v: ['הרכיב', 'הרכיבה'] },
    { tags: ['tech'], the: 'הרובוט', own: true, v: ['בנה', 'בנתה'] },
    { tags: ['animals'], the: 'מסלול הטיול עם הכלב', v: ['הלך', 'הלכה'] },
    { tags: ['kpop'], the: 'הריקוד החדש של הלהקה', v: ['למד', 'למדה'] },
    { tags: ['magic'], the: 'ספר הלחשים', own: true, v: ['קרא', 'קראה'] },
    { tags: ['squishy'], the: 'מדף הסקווישים', own: true, v: ['מילא', 'מילאה'] },
  ];

  HM.lesson({
    id: 'f-whole',
    learn: (c) => [
      {
        title: 'כל החלקים = שלם אחד',
        html: `פיצה חתוכה ל-8 משולשים שווים. ${c.name} והחברים ${c.g('שלו', 'שלה')} אכלו את כל 8 המשולשים — כלומר ${fr(8, 8)} מהפיצה.<br>${fr(8, 8)} מהפיצה הם ${b('פיצה שלמה אחת')}: ${m(F(8, 8) + ' = 1')}.`,
        visual: V.pie(8, 8, { r: 64 }),
      },
      {
        title: 'ל-1 יש הרבה שמות',
        html: `כשהמונה ${b('שווה')} למכנה, לקחנו את כל החלקים — וזה ${HM.hl('שלם אחד')}.<br>${m(`1 = ${F(2, 2)} = ${F(3, 3)} = ${F(5, 5)} = ${F(10, 10)}`)}<br>${c.g('בחר', 'בחרי')} את השם שמתאים לחלקים שיש לך.`,
        visual: V.bars([{ n: 2, d: 2 }, { n: 3, d: 3 }, { n: 5, d: 5 }], { labels: [{ n: 2, d: 2 }, { n: 3, d: 3 }, { n: 5, d: 5 }] }),
      },
      {
        title: 'השלמה ל-1',
        html: `בפס צבוע ${fr(3, 5)}. כמה חסר עד שלם?<br>שלם הוא ${fr(5, 5)}, ולכן חסרים ${fr(2, 5)}: ${m(F(3, 5) + ' + ' + F(2, 5) + ' = 1')}.<br>טיפ: ${b('המכנה לא משתנה')} — משלימים רק את המונה עד המכנה.`,
        visual: V.bar(3, 5, { unitLabels: true }),
      },
      {
        title: 'חיסור מ-1',
        html: `כמה זה ${m('1 − ' + F(3, 8))}?`,
        steps: [
          `כותבים את 1 כשבר עם המכנה 8: ${m('1 = ' + F(8, 8))}.`,
          `עכשיו מחסרים את המונים: ${m(F(8, 8) + ' − ' + F(3, 8) + ' = ' + F(5, 8))}.`,
          `התשובה: ${fr(5, 8)} ✔`,
        ],
        visual: NL({ min: 0, max: 1, den: 8, fracLabels: true, marks: [{ v: 5 / 8 }] }),
      },
      {
        title: 'מי קרוב יותר ל-1?',
        html: `מה גדול יותר: ${fr(4, 5)} או ${fr(7, 8)}?<br>ל-${fr(4, 5)} חסרה ${b('חמישית')} עד 1, ול-${fr(7, 8)} חסרה רק ${b('שמינית')}.<br>שמינית קטנה מחמישית, ולכן ${fr(7, 8)} ${HM.hl('קרוב יותר ל-1')} — והוא הגדול: ${m(F(7, 8) + ' &gt; ' + F(4, 5))}.`,
        visual: V.bars([{ n: 4, d: 5 }, { n: 7, d: 8 }], { labels: [{ n: 4, d: 5 }, { n: 7, d: 8 }] }),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, כמה שביעיות חסרות כדי להגיע לשלם?`,
        visual: V.bar(4, 7),
        quiz: {
          type: 'number', answer: 3,
          prompt: `${c.g('השלם', 'השלימי')}: ${m(F(4, 7) + ' + ' + F(HM.slot(0), 7) + ' = 1')}`,
          hint: `1 = ${fr(7, 7)}. כמה חסר מ-4 עד 7?`,
          solution: [`${m('7 − 4 = 3')}`, `${m(F(4, 7) + ' + ' + F(3, 7) + ' = 1')}`],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['oneSlot', 'complete', 'shadeRest', 'sub', 'jumps', 'story', 'story', 'story']
        : level === 2 ? ['completeSlot', 'sub', 'cmp1', 'tf', 'jumps', 'story', 'story', 'storyCloser']
        : ['closest', 'order', 'cmp1', 'subMissing', 'tf', 'storyTwo', 'storyTwo', 'storyCloser', 'storyCloser'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5, 6, 8]) : level === 2 ? c.pick([4, 5, 6, 7, 8, 9, 10, 12]) : c.pick([6, 7, 8, 9, 10, 12]);
      const n = c.rnd(1, d - 1);
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      switch (kind) {
        case 'oneSlot': {
          const dd = c.rnd(2, 12), slotDen = c.chance(0.5);
          return {
            type: 'number', answer: dd,
            prompt: `${c.g('השלם', 'השלימי')} את המספר החסר:<br>${m('1 = ' + (slotDen ? F(dd, HM.slot(0)) : F(HM.slot(0), dd)))}`,
            hint: 'כשהמונה שווה למכנה, לקחנו את כל החלקים — וזה שלם אחד.',
            solution: [`${m('1 = ' + F(dd, dd))}`, `המונה והמכנה שווים: ${dd}.`],
          };
        }
        case 'complete':
          return {
            type: 'fraction', answer: { n: d - n, d },
            prompt: `איזה שבר צריך להוסיף ל-${fr(n, d)} כדי לקבל 1?`,
            visual: V.bar(n, d),
            hint: `${m('1 = ' + F(d, d))}. כמה חלקים לבנים יש בפס?`,
            solution: [`${m('1 = ' + F(d, d))}`, `${m(`${d} − ${n} = ${d - n}`)}, ולכן ${d - n === 1 ? 'חסר' : 'חסרים'} ${cntPart(d - n)}.`, `${m(F(n, d) + ' + ' + F(d - n, d) + ' = 1')}`],
          };
        case 'completeSlot': {
          const first = c.chance(0.5);
          return {
            type: 'number', answer: d - n,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(first ? F(HM.slot(0), d) + ' + ' + F(n, d) + ' = 1' : F(n, d) + ' + ' + F(HM.slot(0), d) + ' = 1')}`,
            hint: `${m('1 = ' + F(d, d))}. כמה צריך להוסיף ל-${n} כדי להגיע ל-${d}?`,
            solution: [`${m(`${d} − ${n} = ${d - n}`)}`, `${m(F(n, d) + ' + ' + F(d - n, d) + ' = ' + F(d, d) + ' = 1')}`],
          };
        }
        case 'shadeRest':
          return {
            type: 'shade', shape: 'bar', parts: d, answer: d - n,
            prompt: `בפס הצבעוני צבוע ${fr(n, d)}. ${c.g('צבע', 'צבעי')} בפס הריק את החלק שחסר עד שלם.`,
            visual: V.bar(n, d),
            hint: `שלם הוא ${fr(d, d)}. כמה חלקים לבנים יש בפס הצבעוני?`,
            solution: [`${m(`${d} − ${n} = ${d - n}`)}`, `צריך לצבוע ${cntPart(d - n)}, כלומר ${fr(d - n, d)}.`],
          };
        case 'sub':
          return {
            type: 'fraction', answer: { n: d - n, d },
            prompt: `${c.g('חשב', 'חשבי')}: ${m('1 − ' + F(n, d) + ' =')}`,
            hint: `${c.g('כתוב', 'כתבי')} את 1 כשבר שהמכנה שלו ${d}.`,
            solution: [`${m('1 = ' + F(d, d))}`, `${m(F(d, d) + ' − ' + F(n, d) + ' = ' + F(d - n, d))}`],
          };
        case 'subMissing': {
          const k = c.rnd(1, d - 1);
          return {
            type: 'number', answer: d - k,
            prompt: `${c.g('השלם', 'השלימי')}: ${m('1 − ' + F(HM.slot(0), d) + ' = ' + F(k, d))}`,
            hint: `${m('1 = ' + F(d, d))}. כמה צריך להחסיר מ-${d} כדי לקבל ${k}?`,
            solution: [`${m(`${d} − ${d - k} = ${k}`)}`, `${m(F(d, d) + ' − ' + F(d - k, d) + ' = ' + F(k, d))}`],
          };
        }
        case 'jumps':
          return {
            type: 'number', answer: d - n,
            prompt: `כמה קפיצות של ${fr(1, d)} צריך כדי להגיע מהנקודה המסומנת ל-1?`,
            visual: NL({ min: 0, max: 1, den: d, marks: [{ v: n / d, label: { n, d } }] }),
            hint: `${c.g('ספור', 'ספרי')} את הקטעים מהנקודה עד 1.`,
            solution: [`${m('1 = ' + F(d, d))}`, `${m(`${d} − ${n} = ${d - n}`)}, כלומר ${HM.cnt(d - n, 'קפיצה', 'קפיצות', true)}.`, `${m(F(n, d) + ' + ' + F(d - n, d) + ' = 1')}`],
          };
        case 'story': {
          const sc = c.scene(WHOLES), p = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'fraction', answer: { n: d - n, d },
            prompt: `${p.name} ${p.g(sc.v[0], sc.v[1])} ${fr(n, d)} מ${sc.the}.<br>איזה חלק מ${sc.the} ${sc.rest}?`,
            hint: `השלם הוא ${fr(d, d)}. ${c.g('חסר', 'חסרי')} ממנו את ${fr(n, d)}.`,
            solution: [`${m('1 − ' + F(n, d) + ' = ' + F(d, d) + ' − ' + F(n, d) + ' = ' + F(d - n, d))}`, `התשובה: ${fr(d - n, d)}`],
          };
        }
        case 'storyCloser': {
          const sc = c.scene(CLOSER), p1 = c.me, p2 = c.friend();
          const k = level === 2 ? 1 : c.pick([1, 2, 3]);
          const [d1, d2] = c.sample(HM.range(k + 2, 12), 2);
          const n1 = d1 - k, n2 = d2 - k, ans = d1 > d2 ? 0 : 1, W = ans === 0 ? p1 : p2;
          const own = (p) => (sc.own ? ' ' + p.g('שלו', 'שלה') : '');
          const both = p1.gender === 'f' && p2.gender === 'f' ? 'שתיהן קרובות' : 'שניהם קרובים';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p1.name, p2.name, `${both} באותה מידה`],
            prompt: `${p1.name} ${p1.g(sc.v[0], sc.v[1])} ${fr(n1, d1)} מ${sc.the}${own(p1)}, ו${p2.name} ${p2.g(sc.v[0], sc.v[1])} ${fr(n2, d2)} מ${sc.the}${own(p2)}.<br>מי קרוב יותר לסיים?`,
            hint: `${c.g('בדוק', 'בדקי')} כמה חסר לכל אחד עד השלם (1). למי חסר פחות?`,
            solution: [`ל${p1.name} חסר ${fr(k, d1)}, ול${p2.name} חסר ${fr(k, d2)}.`, `${fr(k, Math.max(d1, d2))} קטן מ-${fr(k, Math.min(d1, d2))}, ולכן ${W.name} ${W.g('קרוב', 'קרובה')} יותר לסיים.`],
          };
        }
        case 'storyTwo': {
          const sc = c.scene(WHOLES), p1 = c.me, p2 = c.friend();
          const a = c.rnd(1, d - 2), bb = c.rnd(1, d - 1 - a);
          return {
            type: 'fraction', answer: { n: d - a - bb, d },
            prompt: `${p1.name} ${p1.g(sc.v[0], sc.v[1])} ${fr(a, d)} מ${sc.the}, ו${p2.name} ${p2.g(sc.v[0], sc.v[1])} עוד ${fr(bb, d)}.<br>איזה חלק מ${sc.the} ${sc.rest}?`,
            hint: `קודם ${c.g('חבר', 'חברי')} את שני החלקים, ואחר כך ${c.g('חסר', 'חסרי')} את הסכום מ-1.`,
            solution: [`${m(F(a, d) + ' + ' + F(bb, d) + ' = ' + F(a + bb, d))}`, `${m('1 − ' + F(a + bb, d) + ' = ' + F(d - a - bb, d))}`, `התשובה: ${fr(d - a - bb, d)}`],
          };
        }
        case 'cmp1': {
          const k = level === 2 ? 1 : c.pick([1, 2, 3]);
          const [d1, d2] = c.sample(HM.range(k + 2, 12), 2);
          const n1 = d1 - k, n2 = d2 - k, sg = SIGN(n1 / d1, n2 / d2);
          const big = d1 > d2 ? [n1, d1] : [n2, d2];
          return {
            type: 'compare', prompt: cmpPrompt,
            left: F(n1, d1), right: F(n2, d2), lv: n1 / d1, rv: n2 / d2, answer: sg,
            hint: `${c.g('בדוק', 'בדקי')} כמה חסר לכל שבר עד 1. השבר שחסר לו פחות — הוא הגדול.`,
            solution: [`ל-${fr(n1, d1)} חסר ${fr(k, d1)} עד 1, ול-${fr(n2, d2)} חסר ${fr(k, d2)}.`, `${fr(k, Math.max(d1, d2))} קטן מ-${fr(k, Math.min(d1, d2))}, ולכן ${fr(big[0], big[1])} קרוב יותר ל-1.`, `${m(F(n1, d1) + ` ${SIGNH(sg)} ` + F(n2, d2))}`],
          };
        }
        case 'closest': {
          const dens = c.sample(HM.range(5, 10), 3);
          const D = c.pick([8, 9, 10, 11, 12]), K = Math.ceil(D / 4) + c.rnd(0, 1);
          const cands = dens.map((dd) => ({ n: dd - 1, d: dd })).concat([{ n: D - K, d: D }]);
          const best = cands.reduce((bi, f, i) => (f.n / f.d > cands[bi].n / cands[bi].d ? i : bi), 0);
          const B = cands[best];
          return {
            type: 'choice', choices: cands.map((f) => fr(f.n, f.d)), answer: best,
            prompt: 'איזה שבר הכי קרוב ל-1?',
            hint: `${c.g('בדוק', 'בדקי')} לכל שבר כמה חסר לו עד 1. ככל שחסר פחות — השבר קרוב יותר ל-1.`,
            solution: [`ל-${dens.map((dd) => fr(dd - 1, dd)).join(', ל-')} חסר רק חלק אחד עד 1, ול-${fr(D - K, D)} חסרים ${K} חלקים של ${fr(1, D)} — זה הרבה יותר.`, `החלק החסר הקטן ביותר הוא ${fr(1, B.d)}, ולכן ${fr(B.n, B.d)} הכי קרוב ל-1.`],
          };
        }
        case 'order': {
          const dens = c.sample(HM.range(2, 10), 4);
          const withOne = c.chance(0.35);
          const items = dens.map((dd, i) => (withOne && i === 0 ? { n: dd, d: dd } : { n: dd - 1, d: dd }));
          const sorted = items.map((x, i) => i).sort((i, j) => items[i].n / items[i].d - items[j].n / items[j].d);
          return {
            type: 'order', items: items.map((f) => fr(f.n, f.d)), answer: sorted,
            prompt: `${c.g('סדר', 'סדרי')} את השברים ${b('מהקטן לגדול')}:`,
            hint: `${withOne ? 'שבר שהמונה שלו שווה למכנה הוא 1. ' : ''}${withOne ? 'לשאר' : 'לכל'} השברים חסר חלק אחד עד 1. ככל שהחלק החסר קטן יותר — השבר גדול יותר.`,
            solution: [`ככל שהמכנה גדול יותר, החלק החסר קטן יותר והשבר קרוב יותר ל-1.`, sorted.map((i) => fr(items[i].n, items[i].d)).join(' , ')],
          };
        }
        case 'tf': {
          const t = c.pick(['whole', 'comp', 'sub', 'close']), truth = c.chance(0.5);
          if (t === 'whole') {
            const k = c.rnd(3, 12);
            return {
              type: 'tf', answer: truth, prompt: `${m((truth ? F(k, k) : F(k, k + 1)) + ' = 1')}`,
              hint: 'שבר שווה ל-1 רק כשהמונה שווה למכנה.',
              solution: truth ? [`המונה והמכנה שווים (${k}), ולכן השבר שווה ל-1. הטענה נכונה.`] : [`המונה ${k} קטן מהמכנה ${k + 1}, ולכן חסר ${fr(1, k + 1)} עד 1. הטענה לא נכונה.`],
            };
          }
          if (t === 'comp' || t === 'sub') {
            let x = d - n;
            if (!truth) x = d - n + (d - n > 1 && c.chance(0.5) ? -1 : 1);
            if (x >= d || x < 1) x = d - n - 1 >= 1 ? d - n - 1 : d - n;
            const ok = x === d - n;
            return t === 'comp' ? {
              type: 'tf', answer: ok, prompt: `${m(F(n, d) + ' + ' + F(x, d) + ' = 1')}`,
              hint: `${m('1 = ' + F(d, d))}. ${c.g('בדוק', 'בדקי')} אם סכום המונים הוא ${d}.`,
              solution: [`${m(`${n} + ${x} = ${n + x}`)}`, ok ? `הסכום הוא ${fr(d, d)}, כלומר 1. הטענה נכונה.` : `${fr(n + x, d)} אינו 1, ולכן הטענה לא נכונה.`],
            } : {
              type: 'tf', answer: ok, prompt: `${m('1 − ' + F(n, d) + ' = ' + F(x, d))}`,
              hint: `${c.g('כתוב', 'כתבי')} את 1 כ-${fr(d, d)} ו${c.g('חסר', 'חסרי')}.`,
              solution: [`${m(F(d, d) + ' − ' + F(n, d) + ' = ' + F(d - n, d))}`, ok ? 'הטענה נכונה.' : `התוצאה היא ${fr(d - n, d)} ולא ${fr(x, d)}, ולכן הטענה לא נכונה.`],
            };
          }
          const [d1, d2] = c.sample(HM.range(3, 12), 2);
          const ok = d1 > d2;
          return {
            type: 'tf', answer: ok, prompt: `${fr(d1 - 1, d1)} קרוב יותר ל-1 מאשר ${fr(d2 - 1, d2)}.`,
            hint: `${c.g('בדוק', 'בדקי')} כמה חסר לכל שבר עד 1.`,
            solution: [`ל-${fr(d1 - 1, d1)} חסר ${fr(1, d1)}, ול-${fr(d2 - 1, d2)} חסר ${fr(1, d2)}.`, `${fr(1, Math.max(d1, d2))} הוא החלק הקטן יותר, ולכן ${ok ? 'הטענה נכונה' : 'הטענה לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ========== השבר כחלק מכמות ========== */
  // אוספים: many = רבים, the = רבים מיודע (כולל סמיכות), fem = נקבה
  const COLLECT = [
    { tags: ['sport'], many: 'מדבקות כדורגל', the: 'מדבקות הכדורגל', fem: true },
    { tags: ['animals'], many: 'קלפי בעלי חיים', the: 'קלפי בעלי החיים' },
    { tags: ['space'], many: 'מדבקות כוכבים', the: 'מדבקות הכוכבים', fem: true },
    { tags: ['music'], many: 'מפרטים לגיטרה', the: 'המפרטים לגיטרה' },
    { tags: ['baking'], many: 'עוגיות', the: 'העוגיות', fem: true },
    { tags: ['games'], many: 'קלפי משחק', the: 'קלפי המשחק' },
    { tags: ['art'], many: 'טושים', the: 'הטושים' },
    { tags: ['nature'], many: 'צדפים', the: 'הצדפים' },
    { tags: ['reading'], many: 'ספרים', the: 'הספרים' },
    { tags: ['tech'], many: 'חלקי לגו', the: 'חלקי הלגו' },
    { tags: ['kpop'], many: 'פוטוקארדים', the: 'הפוטוקארדים' },
    { tags: ['magic'], many: 'קלפי קוסמים', the: 'קלפי הקוסמים' },
    { tags: ['squishy'], many: 'סקווישים', the: 'הסקווישים' },
  ];
  // תלמידים בכיתה ש...
  const CLASSQ = [
    { tags: ['sport'], what: 'משחקים כדורגל' },
    { tags: ['animals'], what: 'מגדלים חיית מחמד' },
    { tags: ['music'], what: 'מנגנים על כלי נגינה' },
    { tags: ['reading'], what: 'קוראים ספר בכל שבוע' },
    { tags: ['art'], what: 'אוהבים לצייר' },
    { tags: ['space'], what: 'רוצים לטוס לחלל' },
    { tags: ['tech'], what: 'בונים רובוטים בחוג' },
    { tags: ['baking'], what: 'אוהבים לאפות' },
    { tags: ['games'], what: 'משחקים במחשב' },
    { tags: ['nature'], what: 'יצאו לטיול בשבת' },
    { tags: ['kpop'], what: 'אוהבים קיי-פופ' },
    { tags: ['magic'], what: 'קראו את הארי פוטר' },
    { tags: ['squishy'], what: 'אוספים סקווישים' },
  ];
  // על מה מוציאים את דמי יום ההולדת
  const MONEY = [
    { tags: ['sport'], on: 'כדור כדורגל חדש' },
    { tags: ['animals'], on: 'צעצועים לכלב' },
    { tags: ['space'], on: 'דגם של חללית' },
    { tags: ['music'], on: 'מיתרים לגיטרה' },
    { tags: ['baking'], on: 'תבניות אפייה' },
    { tags: ['games'], on: 'משחק מחשב' },
    { tags: ['art'], on: 'צבעי מים' },
    { tags: ['nature'], on: 'תרמיל לטיולים' },
    { tags: ['reading'], on: 'ספרים חדשים' },
    { tags: ['tech'], on: 'ערכת רובוטיקה' },
    { tags: ['kpop'], on: 'כרטיס להופעה של הלהקה' },
    { tags: ['magic'], on: 'שרביט קסמים' },
    { tags: ['squishy'], on: 'סקווישים חדשים' },
  ];
  // פתרון ל"n/d מתוך N": שני צעדים
  const partSteps = (n, d, N) => {
    const u = N / d;
    return n === 1
      ? [`מחלקים את ${N} ל-${d} חלקים שווים: ${m(`${N} : ${d} = ${u}`)} ← זה ${fr(1, d)} מתוך ${N}.`]
      : [`מחלקים את ${N} ל-${d} חלקים שווים: ${m(`${N} : ${d} = ${u}`)} ← זה ${fr(1, d)} מתוך ${N}.`, `לוקחים ${n} חלקים: ${m(`${u} × ${n} = ${n * u}`)} ← זה ${fr(n, d)} מתוך ${N}.`];
  };
  // פתרון ל"n/d מהשלם הם part": מוצאים חלק אחד ואז את השלם
  const wholeSteps = (n, d, part) => {
    const u = part / n;
    return (n === 1 ? [`${fr(1, d)} מהשלם ${u === 1 ? 'הוא' : 'הם'} ${u}.`] : [`${fr(n, d)} הם ${part}, ולכן חלק אחד — ${fr(1, d)} — הוא ${m(`${part} : ${n} = ${u}`)}.`])
      .concat([`בשלם יש ${d} חלקים כאלה: ${m(`${u} × ${d} = ${u * d}`)}.`]);
  };
  const twoFriends = (c) => { const f1 = c.friend(); let f2 = c.friend(), g = 0; while (f2.name === f1.name && g++ < 20) f2 = c.friend(); return [f1, f2]; };
  // מודל פס: השלם (top) בסוגר מעל הפס, החלק הצבוע (bottom) בסוגר מתחתיו; each = ערך בתוך כל חלק
  function barModel(n, d, top, bottom, o) {
    o = o || {};
    const w = 330, h = 42, x0 = 8, y0 = 38, pw = (w - 2 * x0) / d;
    let s = S.path(`M${x0},${y0 - 6} v-9 H${w - x0} v9`, { fill: 'none', cls: 's-ink', sw: 2 });
    s += S.text(w / 2, y0 - 26, top, { fs: 18, fw: 800, cls: 't-a' });
    for (let i = 0; i < d; i++) {
      const x = w - x0 - (i + 1) * pw;
      s += S.rect(x, y0, pw, h, { cls: (i < n ? 'f-a' : 'f-w') + ' s-ink', sw: 2 });
      if (o.each != null) s += S.text(x + pw / 2, y0 + h / 2, o.each, { fs: Math.min(15, pw / 2.2), fw: 700, cls: i < n ? 't-on' : 't-ink' });
    }
    s += S.rect(x0, y0, w - 2 * x0, h, { fill: 'none', cls: 's-ink', sw: 3, rx: 4 });
    const hasB = bottom != null && n > 0;
    if (hasB) {
      const xr = w - x0, xl = w - x0 - n * pw, yb = y0 + h + 6;
      s += S.path(`M${xl},${yb} v9 H${xr} v-9`, { fill: 'none', cls: 's-b', sw: 2 });
      s += S.text((xl + xr) / 2, yb + 26, bottom, { fs: 18, fw: 800, cls: 't-b' });
    }
    return S.svg(w, y0 + h + (hasB ? 48 : 8), s, { label: 'מודל פס', maxw: 330 });
  }

  HM.lesson({
    id: 'f-quantity',
    learn: (c) => [
      {
        title: 'חלק מקבוצה',
        html: `ל${c.name} יש 12 מדבקות. ${c.g('הוא רוצה', 'היא רוצה')} לתת ${fr(1, 3)} מהן ${c.g('לחבר', 'לחברה')}.<br>מחלקים את 12 המדבקות ל-${b('3 קבוצות שוות')} — בכל קבוצה 4 מדבקות.<br>קבוצה אחת היא ${fr(1, 3)}, ולכן ${HM.hl(`${fr(1, 3)} מתוך 12 הם 4`)}.`,
        visual: groupsHL(3, 4, 1),
      },
      {
        title: 'שבר יחידה מכמות',
        html: `${b('שבר יחידה')} הוא שבר שהמונה שלו 1, כמו ${fr(1, 2)}, ${fr(1, 4)} או ${fr(1, 5)}.<br>כדי למצוא ${fr(1, 4)} מתוך 20, מחלקים את 20 ל-4 חלקים שווים:<br>${m('20 : 4 = 5')}, ולכן ${fr(1, 4)} מתוך 20 הם 5.<br>בפס: השלם (20) למעלה, וכל רבע שווה 5.`,
        visual: barModel(1, 4, '20', '5', { each: 5 }),
      },
      {
        title: 'שני צעדים: מחלקים וכופלים',
        html: `כמה זה ${fr(5, 7)} מתוך 70? ${c.g('עקוב', 'עקבי')} אחרי שני הצעדים:`,
        steps: [
          `מחלקים את 70 ל-7 חלקים שווים: ${m('70 : 7 = 10')}. כל שביעית היא 10.`,
          `לוקחים 5 שביעיות: ${m('10 × 5 = 50')}.`,
          `${fr(5, 7)} מתוך 70 הם ${b('50')} ✔`,
        ],
        visual: barModel(5, 7, '70', '50', { each: 10 }),
      },
      {
        title: 'אותו שבר, ייצוגים שונים',
        html: `${fr(3, 4)} יכול להיות חלק מצורה וגם חלק מקבוצה.<br>בפס: 3 חלקים מתוך 4.<br>בקבוצה של 8 כדורים: ${b('6 כדורים מתוך 8')} — כי בכל רבע יש 2 כדורים.<br>${c.g('שים', 'שימי')} לב: המספרים שונים, אבל השבר אותו שבר.`,
        visual: row(V.bar(3, 4, { w: 200, maxw: 170 }), groupsHL(4, 2, 3, { maxw: 200 })),
      },
      {
        title: 'מוצאים את השלם',
        html: `${fr(2, 5)} מהכדורים בארגז הם 6 כדורים. כמה כדורים יש בארגז?<br>הפעם ${b('השלם')} הוא סימן השאלה.`,
        steps: [
          `${fr(2, 5)} הם 6 כדורים, ולכן חמישית אחת היא ${m('6 : 2 = 3')} כדורים.`,
          `בשלם יש 5 חמישיות: ${m('3 × 5 = 15')}.`,
          `בארגז יש 15 כדורים ✔`,
        ],
        visual: barModel(2, 5, '?', '6'),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, ${c.g('חלק', 'חלקי')} בראש את 18 ל-3 חלקים שווים.`,
        visual: barModel(1, 3, '18', '?'),
        quiz: {
          type: 'number', answer: 6, prompt: `כמה זה ${fr(1, 3)} מתוך 18?`,
          hint: `${c.g('חלק', 'חלקי')} את 18 ל-3 חלקים שווים.`,
          solution: partSteps(1, 3, 18),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['unitOf', 'unitOf', 'unitPic', 'shadeGrid', 'whatFrac', 'storyGive', 'storyGive', 'classQ', 'money']
        : level === 2 ? ['nonUnit', 'nonUnit', 'shadeGrid', 'tf', 'whatFrac', 'storyGive', 'storyGive', 'classQ', 'money']
        : ['findWhole', 'findWhole', 'tfWhole', 'bigNonUnit', 'whichFrac', 'storyWhole', 'moneyLeft', 'storyLeft', 'twoGifts', 'cmpWho', 'classWhole', 'moneyWhole'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5, 6]) : level === 2 ? c.pick([3, 4, 5, 6, 7, 8, 10]) : c.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
      const n = level === 1 ? 1 : coprime(c, d, d > 2 ? 2 : 1);
      const u = level === 1 ? c.rnd(2, 6) : level === 2 ? c.rnd(2, 12) : c.rnd(3, 15);
      const N = d * u;
      const it = c.scene(COLLECT), them = it.fem ? 'מהן' : 'מהם';
      switch (kind) {
        case 'unitOf':
          return {
            type: 'number', answer: u, prompt: `כמה זה ${fr(1, d)} מתוך ${N}?`,
            visual: barModel(1, d, String(N), '?'),
            hint: `${c.g('חלק', 'חלקי')} את ${N} ל-${d} חלקים שווים. כמה יש בכל חלק?`,
            solution: partSteps(1, d, N),
          };
        case 'unitPic':
          return {
            type: 'number', answer: u, prompt: `כמה כוכבים הם ${fr(1, d)} מכל הכוכבים?`,
            visual: V.tokens(N, 'star', { perRow: N > 12 ? Math.ceil(N / 2) : N }),
            hint: `${c.g('ספור', 'ספרי')} את כל הכוכבים, ואז ${c.g('חלק', 'חלקי')} אותם ל-${d} קבוצות שוות.`,
            solution: [`יש ${N} כוכבים.`].concat(partSteps(1, d, N)),
          };
        case 'shadeGrid':
          return {
            type: 'shade', shape: 'grid', rows: d, cols: u, answer: n * u,
            prompt: `${c.g('צבע', 'צבעי')} ${fr(n, d)} מתוך ${N} המשבצות.`,
            hint: `המשבצות מסודרות ב-${d} שורות שוות. כל שורה היא ${fr(1, d)} מהמשבצות.`,
            solution: partSteps(n, d, N).concat([`צריך לצבוע ${n * u} משבצות — ${n === 1 ? 'שורה אחת' : n + ' שורות'}.`]),
          };
        case 'whatFrac': {
          const dd = Math.min(d, 6), uu = Math.min(u, 6), k = c.rnd(1, dd - 1);
          return {
            type: 'fraction', answer: { n: k, d: dd },
            prompt: 'העיגולים מחולקים לקבוצות שוות. איזה חלק מכל העיגולים נמצא בקבוצות המודגשות?',
            visual: groupsHL(dd, uu, k),
            hint: `${c.g('ספור', 'ספרי')} כמה קבוצות יש בסך הכול וכמה מהן מודגשות.`,
            solution: [`יש ${dd} קבוצות שוות ← המכנה ${dd}.`, `${k === 1 ? 'קבוצה אחת מודגשת' : k + ' קבוצות מודגשות'} ← המונה ${k}.`, `התשובה: ${fr(k, dd)} (וזה ${k * uu} עיגולים מתוך ${dd * uu}).`],
          };
        }
        case 'nonUnit':
        case 'bigNonUnit': {
          const big = kind === 'bigNonUnit';
          const dd = big ? c.pick([6, 7, 8, 9, 12]) : d, uu = big ? c.rnd(9, 20) : u, NN = dd * uu, nn = big ? coprime(c, dd, 2) : n;
          return {
            type: 'number', answer: nn * uu, prompt: `כמה זה ${fr(nn, dd)} מתוך ${NN}?`,
            visual: big ? undefined : barModel(nn, dd, String(NN), '?'),
            hint: `שני צעדים: קודם ${c.g('מצא', 'מצאי')} כמה זה ${fr(1, dd)} מתוך ${NN}, ואחר כך ${c.g('כפול', 'כפלי')} ב-${nn}.`,
            solution: partSteps(nn, dd, NN),
          };
        }
        case 'tf': {
          const right = n * u;
          const wrongs = [u, N % n === 0 ? N / n : null, N - right, right + u].filter((x) => x != null && x !== right && x > 0);
          const truth = c.chance(0.5) || !wrongs.length;
          const X = truth ? right : c.pick(wrongs);
          return {
            type: 'tf', answer: truth, prompt: `${fr(n, d)} מתוך ${N} הם ${X}.`,
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה זה ${fr(1, d)} מתוך ${N}, ואחר כך ${c.g('כפול', 'כפלי')} במונה.`,
            solution: partSteps(n, d, N).concat([truth ? 'הטענה נכונה.' : `התשובה היא ${right} ולא ${X}, ולכן הטענה לא נכונה.`]),
          };
        }
        case 'storyGive':
        case 'storyLeft': {
          const p = c.me, f = c.friend(), left = kind === 'storyLeft', give = n * u;
          return {
            type: 'number', answer: left ? N - give : give,
            prompt: `ל${p.name} היו ${N} ${it.many}. ${p.g('הוא', 'היא')} ${p.g('נתן', 'נתנה')} ${fr(n, d)} ${them} ל${f.name}.<br>${left ? `כמה ${it.many} נשארו ל${p.name}?` : `כמה ${it.many} ${f.g('קיבל', 'קיבלה')} ${f.name}?`}`,
            visual: left ? undefined : barModel(n, d, String(N), '?'),
            hint: left ? `קודם ${c.g('מצא', 'מצאי')} כמה ${it.many} ${p.name} ${p.g('נתן', 'נתנה')}, ואחר כך כמה נשארו.` : `כמה זה ${fr(n, d)} מתוך ${N}? ${c.g('התחל', 'התחילי')} בחלוקה ל-${d} חלקים שווים.`,
            solution: partSteps(n, d, N).concat(left ? [`נשארו ${m(`${N} − ${give} = ${N - give}`)} ${it.many}.`] : [`${f.name} ${f.g('קיבל', 'קיבלה')} ${give} ${it.many}.`]),
          };
        }
        case 'classQ': {
          const dd = c.pick(level === 1 ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 7]), uu = c.rnd(Math.ceil(16 / dd), Math.floor(36 / dd)), NN = dd * uu, nn = level === 1 ? 1 : coprime(c, dd, 2);
          const q = c.scene(CLASSQ);
          return {
            type: 'number', answer: nn * uu,
            prompt: `בכיתה של ${c.name} יש ${NN} תלמידים. ${fr(nn, dd)} מהם ${q.what}.<br>כמה תלמידים ${q.what}?`,
            hint: `כמה זה ${fr(nn, dd)} מתוך ${NN}? ${c.g('חלק', 'חלקי')} את ${NN} ל-${dd} קבוצות שוות.`,
            solution: partSteps(nn, dd, NN).concat([`${nn * uu} תלמידים ${q.what}.`]),
          };
        }
        case 'money':
        case 'moneyLeft':
        case 'moneyWhole': {
          const p = c.chance(0.6) ? c.me : c.friend(), sc = c.scene(MONEY);
          const dd = level === 1 ? c.pick([2, 3, 4, 5]) : c.pick([3, 4, 5, 6, 8, 10]), uu = level === 1 ? c.pick([5, 10]) : c.pick([4, 5, 6, 8, 10, 12, 15, 20]);
          const NN = dd * uu, nn = level === 1 ? 1 : coprime(c, dd, dd > 2 ? 2 : 1), spent = nn * uu;
          if (kind === 'moneyWhole') return {
            type: 'number', answer: NN, unit: '₪',
            prompt: `${p.name} ${p.g('הוציא', 'הוציאה')} ${spent} ₪ על ${sc.on}. זה ${fr(nn, dd)} מכל הכסף ש${p.g('קיבל', 'קיבלה')} ליום ההולדת.<br>כמה כסף ${p.g('קיבל', 'קיבלה')} ${p.name} ליום ההולדת?`,
            visual: barModel(nn, dd, '?', `${spent} ₪`),
            hint: `${spent} ₪ הם ${fr(nn, dd)} מהכסף. ${nn > 1 ? `קודם ${c.g('מצא', 'מצאי')} כמה זה ${fr(1, dd)}.` : `כמה חלקים כאלה יש בשלם?`}`,
            solution: wholeSteps(nn, dd, spent).concat([`${p.name} ${p.g('קיבל', 'קיבלה')} ${NN} ₪.`]),
          };
          const left = kind === 'moneyLeft';
          return {
            type: 'number', answer: left ? NN - spent : spent, unit: '₪',
            prompt: `${p.name} ${p.g('קיבל', 'קיבלה')} ${NN} ₪ ליום ההולדת ${p.g('והוציא', 'והוציאה')} ${fr(nn, dd)} מהם על ${sc.on}.<br>${left ? `כמה שקלים נשארו ל${p.name}?` : `כמה שקלים ${p.g('הוציא', 'הוציאה')} ${p.name}?`}`,
            visual: left ? undefined : barModel(nn, dd, `${NN} ₪`, '?'),
            hint: left ? `קודם ${c.g('מצא', 'מצאי')} כמה שקלים ${p.name} ${p.g('הוציא', 'הוציאה')}, ואחר כך כמה נשארו.` : `כמה זה ${fr(nn, dd)} מתוך ${NN}?`,
            solution: partSteps(nn, dd, NN).concat(left ? [`נשארו ${m(`${NN} − ${spent} = ${NN - spent}`)} ₪.`] : [`${p.name} ${p.g('הוציא', 'הוציאה')} ${spent} ₪.`]),
          };
        }
        case 'findWhole': {
          const part = n * u;
          return {
            type: 'number', answer: N,
            prompt: `${fr(n, d)} ממספר הם ${part}. מהו המספר?`,
            visual: barModel(n, d, '?', String(part)),
            hint: n === 1 ? `המספר מחולק ל-${d} חלקים שווים, וכל חלק הוא ${part}.` : `קודם ${c.g('מצא', 'מצאי')} כמה זה ${fr(1, d)} מהמספר: ${c.g('חלק', 'חלקי')} את ${part} ל-${n}.`,
            solution: wholeSteps(n, d, part).concat([`המספר הוא ${N}.`]),
          };
        }
        case 'tfWhole': {
          const part = n * u;
          const wrongs = [part * d, part % n === 0 ? part / n : null, part + u, N + u].filter((x) => x != null && x !== N && x > 0);
          const truth = c.chance(0.5);
          const X = truth ? N : c.pick(wrongs);
          return {
            type: 'tf', answer: truth,
            prompt: `אם ${fr(n, d)} ממספר הם ${part}, אז המספר הוא ${X}.`,
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה זה ${fr(1, d)} מהמספר, ואחר כך את השלם.`,
            solution: wholeSteps(n, d, part).concat([truth ? 'הטענה נכונה.' : `המספר הוא ${N} ולא ${X}, ולכן הטענה לא נכונה.`]),
          };
        }
        case 'whichFrac': {
          const k = c.rnd(1, d - 1), part = k * u;
          return {
            type: 'fraction', answer: { n: k, d },
            prompt: `איזה חלק מתוך ${N} הם ${part}?`,
            hint: `${c.g('חלק', 'חלקי')} את ${N} ל-${d} חלקים שווים. כמה חלקים כאלה יש ב-${part}?`,
            solution: [`${m(`${N} : ${d} = ${u}`)} ← כל ${fr(1, d)} הוא ${u}.`, `${m(`${part} : ${u} = ${k}`)} ← ב-${part} יש ${k === 1 ? 'חלק אחד' : k + ' חלקים'} כאלה.`, `התשובה: ${fr(k, d)} (אפשר גם ${fr(part, N)}).`],
          };
        }
        case 'storyWhole': {
          const p = c.me, f = c.friend(), part = n * u;
          return {
            type: 'number', answer: N,
            prompt: `${p.name} ${p.g('נתן', 'נתנה')} ל${f.name} ${fr(n, d)} מ${it.the} ${p.g('שלו', 'שלה')}, ו${f.name} ${f.g('קיבל', 'קיבלה')} ${part} ${it.many}.<br>כמה ${it.many} היו ל${p.name} בהתחלה?`,
            visual: barModel(n, d, '?', String(part)),
            hint: `${part} ${it.many} הם ${fr(n, d)} מכולם. ${n === 1 ? 'כמה חלקים כאלה יש בשלם?' : `קודם ${c.g('מצא', 'מצאי')} כמה הם ${fr(1, d)}.`}`,
            solution: wholeSteps(n, d, part).concat([`בהתחלה היו ל${p.name} ${N} ${it.many}.`]),
          };
        }
        case 'classWhole': {
          const dd = c.pick([3, 4, 5, 6]), uu = c.rnd(Math.ceil(16 / dd), Math.floor(36 / dd)), NN = dd * uu, nn = coprime(c, dd, 2), part = nn * uu;
          const q = c.scene(CLASSQ);
          return {
            type: 'number', answer: NN,
            prompt: `בכיתה של ${c.name}, ${part} תלמידים ${q.what}. הם ${fr(nn, dd)} מכל תלמידי הכיתה.<br>כמה תלמידים יש בכיתה?`,
            hint: `קודם ${c.g('מצא', 'מצאי')} כמה תלמידים הם ${fr(1, dd)} מהכיתה.`,
            solution: wholeSteps(nn, dd, part).concat([`בכיתה יש ${NN} תלמידים.`]),
          };
        }
        case 'cmpWho': {
          const p = c.me, f = c.friend();
          const mk = () => { const dd = c.pick([3, 4, 5, 6, 8]), nn = coprime(c, dd), uu = c.rnd(2, 8); return { n: nn, d: dd, N: dd * uu, u: uu, v: nn * uu }; };
          const steps = (X) => `${m(`${X.N} : ${X.d} = ${X.u}`)}` + (X.n > 1 ? `, ${m(`${X.u} × ${X.n} = ${X.v}`)}` : '');
          const A = mk(); let B = mk(), g = 0;
          while ((B.N === A.N && B.d === A.d) && g++ < 20) B = mk();
          const ans = A.v > B.v ? 0 : A.v < B.v ? 1 : 2;
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p.name, f.name, `${p.name} ו${f.name} קיבלו אותו מספר`],
            prompt: `${p.name} ${p.g('קיבל', 'קיבלה')} ${fr(A.n, A.d)} מתוך ${A.N} ${it.many}, ו${f.name} ${f.g('קיבל', 'קיבלה')} ${fr(B.n, B.d)} מתוך ${B.N} ${it.many}.<br>מי קיבל יותר ${it.many}?`,
            hint: `${c.g('חשב', 'חשבי')} בנפרד כמה ${it.many} קיבל כל אחד מהם. לא מספיק להשוות רק את השברים!`,
            solution: [`${p.name}: ${steps(A)}.`, `${f.name}: ${steps(B)}.`, ans === 2 ? `שניהם קיבלו ${A.v} ${it.many}.` : `${ans === 0 ? p.name : f.name} ${ans === 0 ? p.g('קיבל', 'קיבלה') : f.g('קיבל', 'קיבלה')} יותר.`],
          };
        }
        case 'twoGifts': {
          const p = c.me, [f1, f2] = twoFriends(c);
          const [d1, d2] = c.sample([2, 3, 4, 5, 6], 2).sort((x, y) => x - y);
          const L = HM.lcm(d1, d2), k = c.rnd(1, Math.max(1, Math.floor(60 / L))), NN = L * k;
          const g1 = NN / d1, g2 = NN / d2;
          return {
            type: 'number', answer: NN - g1 - g2,
            prompt: `ל${p.name} היו ${NN} ${it.many}. ${p.g('הוא', 'היא')} ${p.g('נתן', 'נתנה')} ${fr(1, d1)} ${them} ל${f1.name} ו-${fr(1, d2)} ${them} ל${f2.name}.<br>כמה ${it.many} נשארו ל${p.name}?`,
            hint: `${c.g('חשב', 'חשבי')} כמה ${it.many} קיבל כל אחד, ואחר כך ${c.g('חסר', 'חסרי')} את שניהם מ-${NN}.`,
            solution: [`${f1.name}: ${m(`${NN} : ${d1} = ${g1}`)}.`, `${f2.name}: ${m(`${NN} : ${d2} = ${g2}`)}.`, `נשארו ${m(`${NN} − ${g1} − ${g2} = ${NN - g1 - g2}`)} ${it.many}.`],
          };
        }
      }
    },
  });

  /* ========== השבר כמנת חילוק ========== */
  // חלוקה שווה: one/many = הדבר שמחלקים (fem = נקבה), who/whoS = בין מי מחלקים (ברירת מחדל: ילדים)
  const SHARE = [
    { tags: ['baking'], place: 'בשיעור הבישול', one: 'פיצה', many: 'פיצות', fem: true },
    { tags: ['art'], place: 'בסוף חוג היצירה', one: 'עוגה', many: 'עוגות', fem: true },
    { tags: ['nature'], place: 'בטיול השנתי', one: 'פיתה', many: 'פיתות', fem: true },
    { tags: ['sport'], place: 'אחרי משחק הכדורגל', one: 'פיצה', many: 'פיצות', fem: true },
    { tags: ['animals'], place: 'בפינת החי', one: 'גזר', many: 'גזרים', who: 'ארנבים', whoS: 'ארנב' },
    { tags: ['space'], place: 'בערב תצפית הכוכבים', one: 'פיתה', many: 'פיתות', fem: true },
    { tags: ['music'], place: 'אחרי החזרה של הלהקה', one: 'פיצה', many: 'פיצות', fem: true },
    { tags: ['games'], place: 'בערב משחקי הקופסה', one: 'עוגה', many: 'עוגות', fem: true },
    { tags: ['reading'], place: 'במועדון הקריאה', one: 'עוגה', many: 'עוגות', fem: true },
    { tags: ['tech'], place: 'בחוג הרובוטיקה', one: 'פיצה', many: 'פיצות', fem: true },
    { tags: ['kpop'], place: 'במפגש של מועדון המעריצים', one: 'פיצה', many: 'פיצות', fem: true },
    { tags: ['magic'], place: 'בסעודה של בית הספר לקוסמים', one: 'עוגת דלעת', many: 'עוגות דלעת', fem: true },
    { tags: ['squishy'], place: 'בערב החלפת הסקווישים', one: 'פיצה', many: 'פיצות', fem: true },
  ];
  const shareText = (c, sc, k, p) => `${sc.place}, ${c.name} ${c.g('חילק', 'חילקה')} ${k} ${sc.many} שווה בשווה בין ${p} ${sc.who || 'ילדים'}.`;
  const pizzasPic = (k, p) => row(...HM.range(1, k).map(() => V.pie(1, p, { r: 34 })));

  HM.lesson({
    id: 'f-division',
    learn: (c) => [
      {
        title: '3 פיצות, 4 ילדים',
        html: `${c.name} ו-3 ${c.g('חברים', 'חברות')} ${c.g('רוצים', 'רוצות')} להתחלק שווה בשווה ב-3 פיצות. איך עושים את זה?<br>חותכים כל פיצה ל-${b('4 חלקים')}. כל אחד לוקח חלק אחד מכל פיצה — כלומר ${b('3 רבעים')}.<br>כל אחד מקבל ${fr(3, 4)} פיצה: ${HM.hl(m('3 : 4 = ' + F(3, 4)))}.`,
        visual: pizzasPic(3, 4),
      },
      {
        title: 'כל חילוק הוא שבר',
        html: `כל תרגיל חילוק אפשר לכתוב כשבר:<br>• ${b('המחולק')} הוא ה${b('מונה')}.<br>• ${b('המחלק')} הוא ה${b('מכנה')}.<br>${m('2 : 5 = ' + F(2, 5))} &nbsp; ${m('1 : 8 = ' + F(1, 8))} &nbsp; ${m('7 : 10 = ' + F(7, 10))}<br>וגם להפך: ${m(F(5, 6) + ' = 5 : 6')}. הקו של השבר הוא בעצם ${b('סימן חילוק')}.`,
        visual: V.bars([{ n: 2, d: 5 }, { n: 1, d: 8 }], { labels: ['2 : 5', '1 : 8'] }),
      },
      {
        title: 'קטן מ-1, שווה ל-1 או גדול מ-1?',
        html: `${m('2 : 5')} — 2 פיצות ל-5 ילדים: כל אחד מקבל ${b('פחות')} מפיצה.<br>${m('6 : 6')} — 6 פיצות ל-6 ילדים: כל אחד מקבל ${b('בדיוק')} פיצה אחת.<br>${m('7 : 4')} — 7 פיצות ל-4 ילדים: כל אחד מקבל ${b('יותר')} מפיצה.<br>${HM.hl('המחולק קטן מהמחלק ← התוצאה קטנה מ-1')}.`,
        visual: V.bars([{ n: 2, d: 5 }, { n: 6, d: 6 }], { labels: [{ n: 2, d: 5 }, { n: 6, d: 6 }] }),
      },
      {
        title: 'דוגמה פתורה',
        html: `2 חפיסות שוקולד מתחלקות שווה בשווה בין 3 ילדים. כמה שוקולד מקבל כל ילד?`,
        steps: [
          `חותכים כל חפיסה ל-3 חלקים שווים. כל חלק הוא ${fr(1, 3)} חפיסה.`,
          `כל ילד לוקח חלק אחד מכל חפיסה: 2 חלקים של ${fr(1, 3)}.`,
          `כל ילד מקבל ${fr(2, 3)} חפיסה: ${m('2 : 3 = ' + F(2, 3))} ✔`,
        ],
        visual: V.bars([{ n: 1, d: 3 }, { n: 1, d: 3 }]),
      },
      {
        title: 'גם מספרים שלמים',
        html: `גם ${fr(12, 4)} הוא תרגיל חילוק: ${m(F(12, 4) + ' = 12 : 4 = 3')}.<br>12 פיצות ל-4 ילדים — כל ילד מקבל ${b('3 פיצות שלמות')}.<br>כשהמונה מתחלק במכנה בלי שארית, השבר שווה ל${b('מספר שלם')}.`,
        visual: groupsHL(4, 3, 1),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, 5 פיצות ל-8 ילדים — האם כל ילד מקבל פחות מפיצה או יותר?`,
        quiz: {
          type: 'compare', prompt: `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`,
          left: '5 : 8', right: '1', lv: 5 / 8, rv: 1, answer: '<',
          hint: `${c.g('השווה', 'השווי')} את המחולק למחלק.`,
          solution: [`${m('5 : 8 = ' + F(5, 8))}`, 'המחולק קטן מהמחלק, ולכן התוצאה קטנה מ-1.'],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['pic', 'divToFrac', 'fracToDiv', 'cmp1', 'missing', 'share', 'share']
        : level === 2 ? ['share', 'cmp1', 'fracToDiv', 'whichDiv', 'classify', 'tf', 'missing']
        : ['order', 'wholeQuot', 'classify', 'shareBack', 'tf', 'cmpTwo', 'storyCmpShare'];
      const kind = c.pick(kinds);
      const bMax = level === 1 ? 8 : level === 2 ? 10 : 12;
      const bb = c.rnd(2, bMax), a = coprime(c, bb);
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      const sc = c.scene(SHARE), who = sc.who || 'ילדים', whoS = sc.whoS || 'ילד';
      const one1 = HM.cnt(1, sc.one, sc.many, sc.fem);
      switch (kind) {
        case 'pic': {
          const k = c.rnd(2, 4), p = c.rnd(k + 1, 6);
          return {
            type: 'fraction', answer: { n: k, d: p },
            prompt: `${k} פיצות חולקו שווה בשווה בין ${p} ילדים. כל פיצה נחתכה ל-${p} חלקים, והחלקים של ילד אחד צבועים.<br>כמה פיצה קיבל כל ילד?`,
            visual: pizzasPic(k, p),
            hint: `כל ילד קיבל חלק אחד מכל פיצה, וכל חלק הוא ${fr(1, p)}. כמה חלקים צבועים?`,
            solution: [`מכל פיצה כל ילד קיבל ${fr(1, p)}.`, `יש ${k} פיצות, ולכן כל ילד קיבל ${k} חלקים של ${fr(1, p)}.`, `${m(`${k} : ${p} = ` + F(k, p))}`],
          };
        }
        case 'divToFrac':
          return {
            type: 'fraction', answer: { n: a, d: bb },
            prompt: `${c.g('כתוב', 'כתבי')} את תוצאת החילוק כשבר: ${m(`${a} : ${bb} =`)}`,
            hint: `המחולק (${a}) הוא המונה, והמחלק (${bb}) הוא המכנה.`,
            solution: [`${m(`${a} : ${bb} = ` + F(a, bb))}`],
          };
        case 'fracToDiv':
          return {
            type: 'number', answer: [a, bb],
            prompt: `${c.g('כתוב', 'כתבי')} את השבר כתרגיל חילוק:<br>${m(F(a, bb) + ' = ' + HM.slot(0) + ' : ' + HM.slot(1))}`,
            hint: 'המונה הוא המחולק, והמכנה הוא המחלק.',
            solution: [`${m(F(a, bb) + ` = ${a} : ${bb}`)}`],
          };
        case 'missing': {
          const askB = c.chance(0.5);
          return {
            type: 'number', answer: askB ? bb : a,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(askB ? `${a} : ` + HM.slot(0) + ' = ' + F(a, bb) : HM.slot(0) + ` : ${bb} = ` + F(a, bb))}`,
            hint: askB ? 'המחלק הוא המכנה של השבר.' : 'המחולק הוא המונה של השבר.',
            solution: [`${m(`${a} : ${bb} = ` + F(a, bb))}`],
          };
        }
        case 'cmp1': {
          const rel = c.pick(['<', '=', '>']);
          const y = c.rnd(2, level === 1 ? 6 : 12);
          const x = rel === '=' ? y : rel === '<' ? c.rnd(1, y - 1) : c.rnd(y + 1, y + (level === 1 ? 4 : 9));
          return {
            type: 'compare', prompt: cmpPrompt, left: `${x} : ${y}`, right: '1', lv: x / y, rv: 1, answer: rel,
            hint: `${c.g('השווה', 'השווי')} את המחולק למחלק. מה קורה כשיש פחות פיצות מילדים?`,
            solution: [`${m(`${x} : ${y} = ` + F(x, y))}`, rel === '<' ? 'המחולק קטן מהמחלק, ולכן התוצאה קטנה מ-1.' : rel === '=' ? 'המחולק שווה למחלק, ולכן התוצאה היא 1.' : 'המחולק גדול מהמחלק, ולכן התוצאה גדולה מ-1.'],
          };
        }
        case 'storyCmpShare': {
          const mode = c.pick(['sameN', 'sameD', 'bench', 'bench']);
          let a1, b1, a2, b2;
          if (mode === 'sameN') { a1 = a2 = c.rnd(2, 5); [b1, b2] = c.sample(HM.range(a1 + 1, 10), 2); }
          else if (mode === 'sameD') { b1 = b2 = c.rnd(4, 10); [a1, a2] = c.sample(HM.range(1, b1 - 1), 2); }
          else { b1 = c.rnd(3, 8); a1 = c.rnd(1, b1 - 1); b2 = c.rnd(2, 6); a2 = c.rnd(b2 + 1, b2 + 4); if (c.chance(0.5)) [a1, b1, a2, b2] = [a2, b2, a1, b1]; }
          const v1 = a1 / b1, v2 = a2 / b2, ans = v1 > v2 ? 0 : v1 < v2 ? 1 : 2;
          const dealt = (k) => (k === 1 ? `${sc.fem ? 'חולקה' : 'חולק'} ${one1}` : `חולקו ${k} ${sc.many}`);
          return {
            type: 'choice', keep: true, answer: ans,
            choices: ['בקבוצה הראשונה', 'בקבוצה השנייה', 'בשתי הקבוצות אותו דבר'],
            prompt: `${sc.place}: בקבוצה הראשונה ${dealt(a1)} שווה בשווה בין ${b1} ${who}, ובקבוצה השנייה ${dealt(a2)} שווה בשווה בין ${b2} ${who}.<br>באיזו קבוצה כל ${whoS} קיבל יותר ${sc.one}?`,
            hint: `${c.g('כתוב', 'כתבי')} לכל קבוצה תרגיל חילוק ושבר, ואז ${c.g('השווה', 'השווי')}.${mode === 'bench' ? ' האם התוצאה קטנה מ-1 או גדולה מ-1?' : ''}`,
            solution: [`בקבוצה הראשונה: ${m(`${a1} : ${b1} = ` + F(a1, b1))}.`, `בקבוצה השנייה: ${m(`${a2} : ${b2} = ` + F(a2, b2))}.`, `${mode === 'bench' ? 'שבר אחד קטן מ-1 והשני גדול מ-1.' : mode === 'sameN' ? 'המונים שווים — השבר עם המכנה הקטן יותר גדול יותר.' : 'המכנים שווים — משווים את המונים.'} ${m(F(a1, b1) + ` ${SIGNH(SIGN(v1, v2))} ` + F(a2, b2))}`],
          };
        }
        case 'share': {
          const p = level === 1 ? c.rnd(3, 6) : c.rnd(3, 10), k = c.rnd(2, p - 1);
          return {
            type: 'fraction', answer: { n: k, d: p },
            prompt: `${shareText(c, sc, k, p)}<br>כמה ${sc.one} קיבל כל ${whoS}?`,
            hint: `${c.g('דמיין', 'דמייני')} שחותכים כל ${sc.one} ל-${p} חלקים שווים. כמה חלקים מקבל כל ${whoS}?`,
            solution: [`חותכים כל ${sc.one} ל-${p} חלקים, וכל ${whoS} מקבל חלק אחד מכל ${sc.one}.`, `כל ${whoS} מקבל ${k} חלקים של ${fr(1, p)}.`, `${m(`${k} : ${p} = ` + F(k, p))}`],
          };
        }
        case 'whichDiv': {
          const p = c.rnd(3, 9), k = c.rnd(2, p - 1);
          return {
            type: 'choice', answer: 0,
            choices: [m(`${k} : ${p}`), m(`${p} : ${k}`), m(`${k} × ${p}`), m(`${p} − ${k}`)],
            prompt: `${shareText(c, sc, k, p)}<br>איזה תרגיל מתאר כמה ${sc.one} קיבל כל ${whoS}?`,
            hint: `מה מחלקים, ובין כמה ${who}? המחולק בא קודם.`,
            solution: [`מחלקים ${k} ${sc.many} בין ${p} ${who}: ${m(`${k} : ${p}`)}.`, `${m(`${k} : ${p} = ` + F(k, p))}`],
          };
        }
        case 'classify': {
          const A = c.pick([0, 1, 2]);
          const pp = A === 0 ? c.rnd(3, 9) : c.rnd(2, 9);
          const kk = A === 1 ? pp : A === 0 ? c.rnd(2, pp - 1) : c.rnd(pp + 1, pp + 6);
          return {
            type: 'choice', keep: true, answer: A,
            choices: [`פחות מ${one1}`, `${one1} בדיוק`, `יותר מ${one1}`],
            prompt: `${shareText(c, sc, kk, pp)}<br>כמה ${sc.one} קיבל כל ${whoS}?`,
            hint: `${c.g('השווה', 'השווי')} את מספר ה${sc.many} למספר ה${who}.`,
            solution: [`כל ${whoS} קיבל ${m(`${kk} : ${pp} = ` + F(kk, pp))}.`, A === 0 ? `יש פחות ${sc.many} מ${who}, ולכן כל ${whoS} קיבל פחות מ${one1}.` : A === 1 ? `מספר ה${sc.many} שווה למספר ה${who}, ולכן כל ${whoS} קיבל ${one1} בדיוק.` : `יש יותר ${sc.many} מ${who}, ולכן כל ${whoS} קיבל יותר מ${one1}.`],
          };
        }
        case 'tf': {
          const t = c.pick(['write', 'write', 'size']);
          if (t === 'write') {
            const truth = c.chance(0.5);
            return {
              type: 'tf', answer: truth,
              prompt: `${m(`${a} : ${bb} = ` + (truth ? F(a, bb) : F(bb, a)))}`,
              hint: 'איזה מספר הופך למונה — המחולק או המחלק?',
              solution: [`המחולק (${a}) הוא המונה, והמחלק (${bb}) הוא המכנה: ${m(`${a} : ${bb} = ` + F(a, bb))}.`, truth ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
            };
          }
          const x = c.rnd(2, 12), y = c.rnd(2, 12), big = c.chance(0.5);
          const truth = big ? x > y : x < y;
          return {
            type: 'tf', answer: truth,
            prompt: `תוצאת החילוק ${m(`${x} : ${y}`)} ${big ? 'גדולה' : 'קטנה'} מ-1.`,
            hint: `${c.g('השווה', 'השווי')} את המחולק למחלק.`,
            solution: [`${m(`${x} : ${y} = ` + F(x, y))}`, x < y ? 'המחולק קטן מהמחלק — התוצאה קטנה מ-1.' : x === y ? 'המחולק שווה למחלק — התוצאה היא 1.' : 'המחולק גדול מהמחלק — התוצאה גדולה מ-1.', truth ? 'הטענה נכונה.' : 'הטענה לא נכונה.'],
          };
        }
        case 'order': {
          const sameB = c.chance(0.5);
          let items;
          if (sameB) { const D = c.rnd(5, 9); items = c.sample(HM.range(1, 2 * D), 4).map((x) => [x, D]); }
          else { const A = c.rnd(1, 5); items = c.sample(HM.range(A + 1, 12), 4).map((y) => [A, y]); }
          const sorted = items.map((x, i) => i).sort((i, j) => items[i][0] / items[i][1] - items[j][0] / items[j][1]);
          return {
            type: 'order', items: items.map(([x, y]) => m(`${x} : ${y}`)), answer: sorted,
            prompt: `${c.g('סדר', 'סדרי')} את תרגילי החילוק לפי התוצאה, ${b('מהקטנה לגדולה')}:`,
            hint: `${c.g('כתוב', 'כתבי')} כל תרגיל כשבר. ${sameB ? 'למכנים יש אותו ערך — ' + c.g('השווה', 'השווי') + ' את המונים.' : 'למונים יש אותו ערך — ככל שהמכנה גדול יותר, השבר קטן יותר.'}`,
            solution: [items.map(([x, y]) => m(`${x} : ${y} = ` + F(x, y))).join(' , '), sorted.map((i) => m(`${items[i][0]} : ${items[i][1]}`)).join(' , ')],
          };
        }
        case 'wholeQuot': {
          const D = c.rnd(2, 9), q = c.rnd(2, 9), slotN = c.chance(0.4);
          return slotN ? {
            type: 'number', answer: q * D,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(F(HM.slot(0), D) + ` = ${q}`)}`,
            hint: `השבר הוא תרגיל חילוק: איזה מספר מחולק ב-${D} נותן ${q}?`,
            solution: [`${m(`${q * D} : ${D} = ${q}`)}`, `${m(F(q * D, D) + ` = ${q}`)}`],
          } : {
            type: 'number', answer: q,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(F(q * D, D) + ` = ${q * D} : ${D} = ` + HM.slot(0))}`,
            hint: 'השבר הוא תרגיל חילוק: המונה מחולק במכנה.',
            solution: [`${m(`${q * D} : ${D} = ${q}`)}`],
          };
        }
        case 'shareBack': {
          const p = c.rnd(3, 9), askP = c.chance(0.5), k = c.rnd(askP ? 1 : 2, p - 1);
          return askP ? {
            type: 'number', answer: p,
            prompt: `${sc.place}, ${c.name} ${c.g('חילק', 'חילקה')} ${k === 1 ? one1 : k + ' ' + sc.many} שווה בשווה, וכל ${whoS} קיבל ${fr(k, p)} ${sc.one}.<br>בין כמה ${who} ${c.g('הוא', 'היא')} ${c.g('חילק', 'חילקה')}?`,
            hint: `${c.g('כתוב', 'כתבי')} תרגיל חילוק שהתוצאה שלו ${fr(k, p)}. מה המחלק?`,
            solution: [`${m(`${k} : ` + c.box() + ' = ' + F(k, p))}`, `המחלק הוא המכנה: ${p}.`, `${m(`${k} : ${p} = ` + F(k, p))}`],
          } : {
            type: 'number', answer: k,
            prompt: `${sc.place}, ${c.name} ${c.g('חילק', 'חילקה')} ${sc.many} שווה בשווה בין ${p} ${who}, וכל ${whoS} קיבל ${fr(k, p)} ${sc.one}.<br>כמה ${sc.many} ${c.name} ${c.g('חילק', 'חילקה')}?`,
            hint: `${c.g('כתוב', 'כתבי')} תרגיל חילוק שהתוצאה שלו ${fr(k, p)}. מה המחולק?`,
            solution: [`${m(c.box() + ` : ${p} = ` + F(k, p))}`, `המחולק הוא המונה: ${k}.`, `${m(`${k} : ${p} = ` + F(k, p))}`],
          };
        }
        case 'cmpTwo': {
          const sameB = c.chance(0.5);
          let x1, y1, x2, y2;
          if (sameB) { y1 = y2 = c.rnd(3, 12); [x1, x2] = c.sample(HM.range(1, y1 + 4), 2); }
          else { x1 = x2 = c.rnd(1, 6); [y1, y2] = c.sample(HM.range(x1 + 1, 12), 2); }
          const sg = SIGN(x1 / y1, x2 / y2);
          return {
            type: 'compare', prompt: cmpPrompt, left: `${x1} : ${y1}`, right: `${x2} : ${y2}`, lv: x1 / y1, rv: x2 / y2, answer: sg,
            hint: `${c.g('כתוב', 'כתבי')} כל תרגיל כשבר, ואז ${c.g('השווה', 'השווי')} בין השברים.`,
            solution: [`${m(`${x1} : ${y1} = ` + F(x1, y1))} , ${m(`${x2} : ${y2} = ` + F(x2, y2))}`, sameB ? 'למכנים יש אותו ערך, לכן משווים את המונים.' : 'למונים יש אותו ערך, לכן השבר עם המכנה הקטן יותר גדול יותר.', `${m(F(x1, y1) + ` ${SIGNH(sg)} ` + F(x2, y2))}`],
          };
        }
      }
    },
  });

  /* ========== שברים גדולים מ-1 ========== */
  // יחידות שבר בבעיות: כל פריט הוא 1/d. fwd = N פריטים ← כמה בסך הכול; inv = כמה פריטים יש ב-w n/d; pl = יחידת התשובה ב-fwd
  const PIECES = [
    { tags: ['baking'], pl: 'פשטידות',
      fwd: (p, N, d) => `${p.name} ${p.g('אפה', 'אפתה')} פשטידות ${p.g('וחתך', 'וחתכה')} כל פשטידה ל-${d} חלקים שווים. בארוחה נאכלו ${N} חלקים.<br>כמה פשטידות נאכלו?`,
      inv: (p, mix, d) => `במתכון של ${p.name} צריך ${mix} כוסות קמח, ויש ${p.g('לו', 'לה')} רק כוס מדידה של ${fr(1, d)} כוס.<br>כמה פעמים ${p.g('הוא צריך', 'היא צריכה')} למלא אותה?`,
      two: (p, A, B, d) => `במתכון של ${p.name} צריך ${A} כוסות קמח ו-${B} כוסות סוכר. יש ${p.g('לו', 'לה')} רק כוס מדידה של ${fr(1, d)} כוס.<br>כמה פעמים בסך הכול ${p.g('הוא צריך', 'היא צריכה')} למלא אותה?` },
    { tags: ['sport'], pl: 'קילומטרים',
      fwd: (p, N, d) => `כל הקפה במסלול היא ${fr(1, d)} קילומטר. ${p.name} ${p.g('רץ', 'רצה')} ${N} הקפות.<br>כמה קילומטרים ${p.g('רץ', 'רצה')} ${p.name}?`,
      inv: (p, mix, d) => `כל הקפה במסלול היא ${fr(1, d)} קילומטר. ${p.name} ${p.g('רוצה', 'רוצה')} לרוץ ${mix} קילומטרים.<br>כמה הקפות ${p.g('עליו', 'עליה')} לרוץ?`,
      two: (p, A, B, d) => `כל הקפה במסלול היא ${fr(1, d)} קילומטר. ביום ראשון ${p.name} ${p.g('רץ', 'רצה')} ${A} קילומטרים, וביום שני ${B} קילומטרים.<br>כמה הקפות ${p.g('רץ', 'רצה')} ${p.name} בסך הכול?` },
    { tags: ['nature'], pl: 'קילומטרים',
      fwd: (p, N, d) => `כל קטע בשביל הטיול הוא ${fr(1, d)} קילומטר. ${p.name} ${p.g('הלך', 'הלכה')} ${N} קטעים.<br>כמה קילומטרים ${p.g('הלך', 'הלכה')} ${p.name}?`,
      inv: (p, mix, d) => `כל קטע בשביל הטיול הוא ${fr(1, d)} קילומטר. ${p.name} ${p.g('הלך', 'הלכה')} ${mix} קילומטרים.<br>כמה קטעים ${p.g('הוא', 'היא')} ${p.g('הלך', 'הלכה')}?`,
      two: (p, A, B, d) => `כל קטע בשביל הוא ${fr(1, d)} קילומטר. ביום הראשון של הטיול ${p.name} ${p.g('הלך', 'הלכה')} ${A} קילומטרים, וביום השני ${B} קילומטרים.<br>כמה קטעים ${p.g('הלך', 'הלכה')} ${p.name} בסך הכול?` },
    { tags: ['reading'], pl: 'שעות',
      fwd: (p, N, d) => `${p.name} ${p.g('קורא', 'קוראת')} כל פרק ב-${fr(1, d)} שעה. השבוע ${p.g('הוא', 'היא')} ${p.g('קרא', 'קראה')} ${N} פרקים.<br>כמה שעות ${p.g('קרא', 'קראה')} ${p.name}?`,
      inv: (p, mix, d) => `${p.name} ${p.g('קורא', 'קוראת')} כל פרק ב-${fr(1, d)} שעה. השבוע ${p.g('הוא', 'היא')} ${p.g('קרא', 'קראה')} ${mix} שעות.<br>כמה פרקים ${p.g('הוא', 'היא')} ${p.g('קרא', 'קראה')}?`,
      two: (p, A, B, d) => `${p.name} ${p.g('קורא', 'קוראת')} כל פרק ב-${fr(1, d)} שעה. ביום שישי ${p.g('הוא', 'היא')} ${p.g('קרא', 'קראה')} ${A} שעות, ובשבת ${B} שעות.<br>כמה פרקים ${p.g('קרא', 'קראה')} ${p.name} בסך הכול?` },
    { tags: ['music'], pl: 'שעות',
      fwd: (p, N, d) => `כל שיעור גיטרה של ${p.name} נמשך ${fr(1, d)} שעה. החודש היו ${p.g('לו', 'לה')} ${N} שיעורים.<br>כמה שעות ${p.g('למד', 'למדה')} ${p.name} גיטרה?`,
      inv: (p, mix, d) => `כל שיעור גיטרה של ${p.name} נמשך ${fr(1, d)} שעה. החודש ${p.g('הוא', 'היא')} ${p.g('למד', 'למדה')} גיטרה ${mix} שעות.<br>כמה שיעורים היו ${p.g('לו', 'לה')}?`,
      two: (p, A, B, d) => `כל שיעור גיטרה של ${p.name} נמשך ${fr(1, d)} שעה. בחודש הראשון ${p.g('הוא', 'היא')} ${p.g('למד', 'למדה')} ${A} שעות, ובחודש השני ${B} שעות.<br>כמה שיעורים היו ${p.g('לו', 'לה')} בסך הכול?` },
    { tags: ['tech'], pl: 'מטרים',
      fwd: (p, N, d) => `בכל צעד הרובוט של ${p.name} מתקדם ${fr(1, d)} מטר. הרובוט עשה ${N} צעדים.<br>כמה מטרים הוא התקדם?`,
      inv: (p, mix, d) => `בכל צעד הרובוט של ${p.name} מתקדם ${fr(1, d)} מטר. הרובוט צריך להתקדם ${mix} מטרים.<br>כמה צעדים עליו לעשות?`,
      two: (p, A, B, d) => `בכל צעד הרובוט של ${p.name} מתקדם ${fr(1, d)} מטר. במסלול הראשון הוא התקדם ${A} מטרים, ובמסלול השני ${B} מטרים.<br>כמה צעדים עשה הרובוט בסך הכול?` },
    { tags: ['animals'], pl: 'קילוגרמים',
      fwd: (p, N, d) => `הכלב של ${p.name} אוכל בכל ארוחה ${fr(1, d)} קילוגרם מזון. החודש הוא אכל ${N} ארוחות.<br>כמה קילוגרמים מזון הוא אכל?`,
      inv: (p, mix, d) => `הכלב של ${p.name} אוכל בכל ארוחה ${fr(1, d)} קילוגרם מזון. בשק נשארו ${mix} קילוגרמים.<br>לכמה ארוחות יספיק המזון?`,
      two: (p, A, B, d) => `הכלב של ${p.name} אוכל בכל ארוחה ${fr(1, d)} קילוגרם מזון. בשק אחד יש ${A} קילוגרמים, ובשק השני ${B} קילוגרמים.<br>לכמה ארוחות יספיקו שני השקים?` },
    { tags: ['space'], pl: 'שעות',
      fwd: (p, N, d) => `כל תצפית בטלסקופ נמשכת ${fr(1, d)} שעה. ${p.name} ${p.g('עשה', 'עשתה')} ${N} תצפיות.<br>כמה שעות ${p.g('צפה', 'צפתה')} ${p.name} בכוכבים?`,
      inv: (p, mix, d) => `כל תצפית בטלסקופ נמשכת ${fr(1, d)} שעה. ${p.name} ${p.g('צפה', 'צפתה')} בכוכבים ${mix} שעות.<br>כמה תצפיות ${p.g('הוא', 'היא')} ${p.g('עשה', 'עשתה')}?`,
      two: (p, A, B, d) => `כל תצפית בטלסקופ נמשכת ${fr(1, d)} שעה. בלילה הראשון ${p.name} ${p.g('צפה', 'צפתה')} בכוכבים ${A} שעות, ובלילה השני ${B} שעות.<br>כמה תצפיות ${p.g('עשה', 'עשתה')} ${p.name} בסך הכול?` },
    { tags: ['games'], pl: 'שעות',
      fwd: (p, N, d) => `כל שלב במשחק לוקח ${fr(1, d)} שעה. ${p.name} ${p.g('שיחק', 'שיחקה')} ${N} שלבים.<br>כמה שעות ${p.g('שיחק', 'שיחקה')} ${p.name}?`,
      inv: (p, mix, d) => `כל שלב במשחק לוקח ${fr(1, d)} שעה. ${p.name} ${p.g('שיחק', 'שיחקה')} ${mix} שעות.<br>כמה שלבים ${p.g('הוא', 'היא')} ${p.g('עבר', 'עברה')}?`,
      two: (p, A, B, d) => `כל שלב במשחק לוקח ${fr(1, d)} שעה. ביום ראשון ${p.name} ${p.g('שיחק', 'שיחקה')} ${A} שעות, וביום שני ${B} שעות.<br>כמה שלבים ${p.g('עבר', 'עברה')} ${p.name} בסך הכול?` },
    { tags: ['art'], pl: 'מטרים',
      fwd: (p, N, d) => `${p.name} ${p.g('גזר', 'גזרה')} ${N} רצועות נייר, כל אחת באורך ${fr(1, d)} מטר, ${p.g('והדביק', 'והדביקה')} אותן בשורה אחת.<br>מה אורך השורה במטרים?`,
      inv: (p, mix, d) => `${p.name} ${p.g('רוצה', 'רוצה')} לקשט קיר באורך ${mix} מטרים ברצועות נייר. כל רצועה באורך ${fr(1, d)} מטר.<br>כמה רצועות ${p.g('הוא צריך', 'היא צריכה')}?`,
      two: (p, A, B, d) => `${p.name} ${p.g('מקשט', 'מקשטת')} שני קירות ברצועות נייר. כל רצועה באורך ${fr(1, d)} מטר. אורך הקיר הראשון ${A} מטרים, ואורך הקיר השני ${B} מטרים.<br>כמה רצועות ${p.g('הוא צריך', 'היא צריכה')} בסך הכול?` },
    { tags: ['kpop'], pl: 'שעות',
      fwd: (p, N, d) => `כל חזרה על הריקוד של הלהקה נמשכת ${fr(1, d)} שעה. השבוע ${p.name} ${p.g('עשה', 'עשתה')} ${N} חזרות.<br>כמה שעות ${p.g('התאמן', 'התאמנה')} ${p.name}?`,
      inv: (p, mix, d) => `כל חזרה על הריקוד של הלהקה נמשכת ${fr(1, d)} שעה. השבוע ${p.name} ${p.g('התאמן', 'התאמנה')} ${mix} שעות.<br>כמה חזרות ${p.g('הוא', 'היא')} ${p.g('עשה', 'עשתה')}?`,
      two: (p, A, B, d) => `כל חזרה על הריקוד של הלהקה נמשכת ${fr(1, d)} שעה. בשבוע הראשון ${p.name} ${p.g('התאמן', 'התאמנה')} ${A} שעות, ובשבוע השני ${B} שעות.<br>כמה חזרות ${p.g('עשה', 'עשתה')} ${p.name} בסך הכול?` },
    { tags: ['magic'], pl: 'ליטרים',
      fwd: (p, N, d) => `בשיעור שיקויים ${p.name} ${p.g('מזג', 'מזגה')} לקלחת ${N} מצקות של מי ירח. בכל מצקת יש ${fr(1, d)} ליטר.<br>כמה ליטרים של מי ירח יש בקלחת?`,
      inv: (p, mix, d) => `בשיעור שיקויים צריך ${mix} ליטרים של מי ירח. ל${p.name} יש מצקת של ${fr(1, d)} ליטר.<br>כמה מצקות ${p.g('הוא צריך', 'היא צריכה')} למזוג?`,
      two: (p, A, B, d) => `בשיעור שיקויים צריך ${A} ליטרים של מי ירח ו-${B} ליטרים של מיץ דרקון. ל${p.name} יש מצקת של ${fr(1, d)} ליטר.<br>כמה מצקות ${p.g('הוא צריך', 'היא צריכה')} למזוג בסך הכול?` },
    { tags: ['squishy'], pl: 'שעות',
      fwd: (p, N, d) => `הכנת סקווישי אחד לוקחת ל${p.name} ${fr(1, d)} שעה. השבוע ${p.g('הוא', 'היא')} ${p.g('הכין', 'הכינה')} ${N} סקווישים.<br>כמה שעות ${p.g('עבד', 'עבדה')} ${p.name}?`,
      inv: (p, mix, d) => `הכנת סקווישי אחד לוקחת ל${p.name} ${fr(1, d)} שעה. השבוע ${p.g('הוא', 'היא')} ${p.g('עבד', 'עבדה')} על סקווישים ${mix} שעות.<br>כמה סקווישים ${p.g('הוא', 'היא')} ${p.g('הכין', 'הכינה')}?`,
      two: (p, A, B, d) => `הכנת סקווישי אחד לוקחת ל${p.name} ${fr(1, d)} שעה. ביום ראשון ${p.g('הוא', 'היא')} ${p.g('עבד', 'עבדה')} ${A} שעות, וביום שני ${B} שעות.<br>כמה סקווישים ${p.g('הכין', 'הכינה')} ${p.name} בסך הכול?` },
  ];
  // השוואה בין שני ילדים: v = פועל [ז, נ], unit = יחידה ברבים, time = כמות זמן
  const CMPU = [
    { tags: ['sport'], v: ['רץ', 'רצה'], unit: 'קילומטרים' },
    { tags: ['nature'], v: ['הלך', 'הלכה'], unit: 'קילומטרים' },
    { tags: ['animals'], v: ['טייל עם הכלב', 'טיילה עם הכלב'], unit: 'קילומטרים' },
    { tags: ['baking'], v: ['אפה', 'אפתה'], unit: 'מגשי עוגיות' },
    { tags: ['reading'], v: ['קרא', 'קראה'], unit: 'שעות', time: true },
    { tags: ['music'], v: ['ניגן', 'ניגנה'], unit: 'שעות', time: true },
    { tags: ['games'], v: ['שיחק', 'שיחקה'], unit: 'שעות', time: true },
    { tags: ['art'], v: ['צייר', 'ציירה'], unit: 'שעות', time: true },
    { tags: ['space'], v: ['צפה בכוכבים', 'צפתה בכוכבים'], unit: 'שעות', time: true },
    { tags: ['tech'], v: ['בנה רובוטים', 'בנתה רובוטים'], unit: 'שעות', time: true },
    { tags: ['kpop'], v: ['התאמן על הריקוד', 'התאמנה על הריקוד'], unit: 'שעות', time: true },
    { tags: ['magic'], v: ['טס על מטאטא', 'טסה על מטאטא'], unit: 'קילומטרים' },
    { tags: ['squishy'], v: ['הכין סקווישים', 'הכינה סקווישים'], unit: 'שעות', time: true },
  ];
  // תמונה של w שלמים ועוד r/d (עיגולים או פסים)
  const wholesPic = (w, r, d, pies) => pies
    ? row(...HM.range(1, w).map(() => V.pie(d, d, { r: 32 })), r ? V.pie(r, d, { r: 32 }) : '')
    : V.bars(HM.range(1, w).map(() => ({ n: d, d, fill: 'f-a' })).concat(r ? [{ n: r, d, fill: 'f-a' }] : []), { h: 30 });
  const toMixedSteps = (N, d) => {
    const w = Math.floor(N / d), r = N % d;
    return [`בכל שלם יש ${fr(d, d)}. ${m(`${N} : ${d} = ${w}`)}${r ? ` ושארית ${r}` : ''}.`, r ? `${w === 1 ? 'שלם אחד' : w + ' שלמים'} ועוד ${fr(r, d)}: ${m(F(N, d) + ' = ' + HM.mixed(w, r, d))}` : `${m(F(N, d) + ` = ${w}`)}`];
  };

  HM.lesson({
    id: 'f-improper',
    learn: (c) => [
      {
        title: 'יותר מפיצה שלמה',
        html: `${c.name} והחברים ${c.g('שלו', 'שלה')} אכלו 5 משולשים, כל אחד רבע פיצה. כמה פיצה הם אכלו? ${fr(5, 4)}.<br>4 רבעים הם פיצה שלמה, ועוד רבע אחד — כלומר ${HM.hl('יותר מפיצה אחת')}!`,
        visual: row(V.pie(4, 4, { r: 46 }), V.pie(1, 4, { r: 46 })),
      },
      {
        title: 'שבר גדול מ-1',
        html: `כשהמונה ${b('גדול')} מהמכנה, השבר ${HM.hl('גדול מ-1')}.<br>ב-${fr(7, 5)} יש 7 חמישיות, ובשלם אחד יש רק 5.<br>• המונה ${b('שווה')} למכנה ← השבר שווה ל-1.<br>• המונה ${b('קטן')} מהמכנה ← השבר קטן מ-1.`,
        visual: wholesPic(1, 2, 5),
      },
      {
        title: 'משבר למספר מעורב',
        html: `מספר כמו ${mx(1, 2, 5)} נקרא ${b('מספר מעורב')}: יש בו ${b('מספר שלם')} ו${b('שבר')}. איך כותבים את ${fr(7, 5)} כמספר מעורב?`,
        steps: [
          `בכל שלם יש 5 חמישיות. כמה שלמים יש ב-7 חמישיות? ${m('7 : 5 = 1')} ושארית 2.`,
          `יש שלם אחד ועוד 2 חמישיות.`,
          `${m(F(7, 5) + ' = ' + HM.mixed(1, 2, 5))} — קוראים: "אחד ושתי חמישיות" ✔`,
        ],
        visual: wholesPic(1, 2, 5),
      },
      {
        title: 'שבר ששווה למספר שלם',
        html: `לפעמים לא נשארת שארית: ${m(F(8, 4) + ' = 8 : 4 = 2')}.<br>8 רבעים הם בדיוק ${b('2 שלמים')}.<br>שבר שווה למספר שלם כשהמונה ${b('מתחלק במכנה')} בלי שארית.`,
        visual: wholesPic(2, 0, 4, true),
      },
      {
        title: 'גם אחרי ה-1',
        html: `${c.g('אתה זוכר', 'את זוכרת')} שהשברים גרים בין המספרים על הישר? גם שברים גדולים מ-1 גרים שם — ${b('אחרי ה-1')}.<br>${m(F(7, 4) + ' = ' + HM.mixed(1, 3, 4))}: מגיעים ל-1, ועוד 3 קטעים של ${fr(1, 4)}.<br>${c.g('שים', 'שימי')} לב: ${m(F(4, 4) + ' = 1')} ו-${m(F(8, 4) + ' = 2')}.`,
        visual: NL({ min: 0, max: 2, den: 4, fracLabels: true, marks: [{ v: 7 / 4 }] }),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, כמה שלמים יש ב-9 רבעים, ומה נשאר?`,
        visual: wholesPic(2, 1, 4, true),
        quiz: {
          type: 'fraction', mixed: true, accept: 'exact', answer: { w: 2, n: 1, d: 4 },
          prompt: `${c.g('כתוב', 'כתבי')} את ${fr(9, 4)} כמספר מעורב.`,
          hint: 'כמה פעמים 4 נכנס ב-9? מה נשאר?',
          solution: toMixedSteps(9, 4),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['readPic', 'toWhole', 'isMore', 'toMixed', 'nlTap', 'storyFrac', 'storyWhole', 'storyFrac']
        : level === 2 ? ['toMixed', 'readPicMixed', 'nlTap', 'nlRead', 'between', 'story', 'story', 'storyWhole']
        : ['order', 'between', 'nlTapMixed', 'pickMixed', 'tf', 'story', 'storyCmp', 'storyCmp'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5]) : level === 2 ? c.pick([2, 3, 4, 5, 6, 8]) : c.pick([3, 4, 5, 6, 7, 8, 9, 10]);
      const w = level === 1 ? c.rnd(1, 2) : level === 2 ? c.rnd(1, 3) : c.rnd(1, 5);
      const r = coprime(c, d), N = w * d + r;
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      switch (kind) {
        case 'readPic':
        case 'readPicMixed': {
          const ww = Math.min(w, 2), dd = Math.min(d, 6), rr = coprime(c, dd), NN = ww * dd + rr, pies = c.chance(0.5);
          const asMixed = kind === 'readPicMixed';
          return {
            type: 'fraction', answer: asMixed ? { w: ww, n: rr, d: dd } : { n: NN, d: dd },
            mixed: asMixed || undefined, accept: asMixed ? 'exact' : undefined,
            prompt: `כל ${pies ? 'עיגול' : 'פס'} הוא שלם אחד. ${c.g('כתוב', 'כתבי')} את כל החלק הצבוע ${asMixed ? 'כמספר מעורב' : 'כשבר'}.`,
            visual: wholesPic(ww, rr, dd, pies),
            hint: asMixed ? `כמה ${pies ? 'עיגולים' : 'פסים'} צבועים לגמרי? ואיזה חלק צבוע ב${pies ? 'עיגול' : 'פס'} האחרון?` : `כל חלק הוא ${fr(1, dd)}. ${c.g('ספור', 'ספרי')} את כל החלקים הצבועים.`,
            solution: asMixed
              ? [`${ww === 1 ? 'שלם אחד צבוע' : ww + ' שלמים צבועים'} לגמרי.`, `באחרון צבוע ${fr(rr, dd)}.`, `התשובה: ${mx(ww, rr, dd)}`]
              : [`בכל שלם יש ${dd} חלקים: ${m(`${ww} × ${dd} = ${ww * dd}`)}.`, `ועוד ${cntPart(rr)}: ${m(`${ww * dd} + ${rr} = ${NN}`)}.`, `התשובה: ${fr(NN, dd)}`],
          };
        }
        case 'toWhole': {
          const q = c.rnd(2, level === 1 ? 4 : 9), dd = c.rnd(2, level === 1 ? 5 : 10);
          return {
            type: 'number', answer: q,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(F(q * dd, dd) + ' = ' + HM.slot(0))}`,
            hint: `בכל שלם יש ${fr(dd, dd)}. כמה פעמים ${dd} נכנס ב-${q * dd}?`,
            solution: [`${m(`${q * dd} : ${dd} = ${q}`)}`, `${m(F(q * dd, dd) + ` = ${q}`)}`],
          };
        }
        case 'isMore': {
          const dd = c.rnd(2, 9), rel = c.pick(['<', '=', '>', '>']);
          const x = rel === '=' ? dd : rel === '<' ? c.rnd(1, dd - 1) : c.rnd(dd + 1, 2 * dd + 3);
          return {
            type: 'compare', prompt: cmpPrompt, left: F(x, dd), right: '1', lv: x / dd, rv: 1, answer: rel,
            hint: `${c.g('השווה', 'השווי')} את המונה למכנה. ${m('1 = ' + F(dd, dd))}.`,
            solution: [`${m('1 = ' + F(dd, dd))}`, rel === '<' ? `המונה ${x} קטן מהמכנה ${dd}, ולכן השבר קטן מ-1.` : rel === '=' ? 'המונה שווה למכנה, ולכן השבר שווה ל-1.' : `המונה ${x} גדול מהמכנה ${dd}, ולכן השבר גדול מ-1.`],
          };
        }
        case 'toMixed':
          return {
            type: 'fraction', mixed: true, accept: 'exact', answer: { w, n: r, d },
            prompt: `${c.g('כתוב', 'כתבי')} את ${fr(N, d)} כמספר מעורב.`,
            hint: `כמה פעמים ${d} נכנס ב-${N}? זה מספר השלמים. השארית היא המונה.`,
            solution: toMixedSteps(N, d),
          };
        case 'nlTap':
        case 'nlTapMixed': {
          const dd = level === 1 ? Math.min(d, 5) : Math.min(d, 6), ww = Math.min(w, level === 1 ? 1 : 2), rr = coprime(c, dd), NN = ww * dd + rr, max = ww + 1 + (level > 1 && c.chance(0.4) ? 1 : 0);
          const asMixed = kind === 'nlTapMixed';
          return {
            type: 'numberline', line: { min: 0, max, den: dd }, answer: NN / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${asMixed ? mx(ww, rr, dd) : fr(NN, dd)}.`,
            hint: `כל קטע הוא ${fr(1, dd)}. ${asMixed ? `${c.g('לך', 'לכי')} ל-${ww}, ומשם עוד ${cntSeg(rr)}.` : `קודם ${c.g('מצא', 'מצאי')} כמה שלמים יש ב-${fr(NN, dd)}.`}`,
            solution: [`${m(F(NN, dd) + ' = ' + HM.mixed(ww, rr, dd))}`, `הולכים ל-${ww}, ומשם עוד ${cntSeg(rr)} של ${fr(1, dd)}.`],
          };
        }
        case 'nlRead': {
          const dd = Math.min(d, 6), ww = Math.min(w, 2), rr = c.rnd(1, dd - 1), max = ww + 1;
          return {
            type: 'fraction', mixed: true, answer: { w: ww, n: rr, d: dd },
            prompt: 'איזה מספר מעורב מסומן על הישר?',
            visual: NL({ min: 0, max, den: dd, marks: [{ v: ww + rr / dd }] }),
            hint: `אחרי איזה מספר שלם נמצאת הנקודה? כמה קטעים של ${fr(1, dd)} יש ממנו עד הנקודה?`,
            solution: [`הנקודה נמצאת אחרי ${ww}.`, `מ-${ww} עד הנקודה יש ${cntSeg(rr)} של ${fr(1, dd)}.`, `התשובה: ${mx(ww, rr, dd)}`],
          };
        }
        case 'storyFrac':
        case 'storyWhole': {
          const sc = c.scene(PIECES), p = c.chance(0.6) ? c.me : c.friend();
          const dd = c.pick(level === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6]);
          if (kind === 'storyWhole') {
            const q = c.rnd(2, level === 1 ? 3 : 6), NN = q * dd;
            return {
              type: 'number', answer: q,
              prompt: sc.fwd(p, NN, dd),
              hint: `${NN} חלקים של ${fr(1, dd)} הם ${fr(NN, dd)}. כמה שלמים יש בזה?`,
              solution: [`${NN} חלקים של ${fr(1, dd)} הם ${fr(NN, dd)}.`, `${m(F(NN, dd) + ` = ${NN} : ${dd} = ${q}`)}`, `התשובה: ${q} ${sc.pl}`],
            };
          }
          const rr = coprime(c, dd), NN = dd + rr;
          return {
            type: 'fraction', answer: { n: NN, d: dd },
            prompt: `${sc.fwd(p, NN, dd)}<br>${c.g('כתוב', 'כתבי')} את התשובה כשבר.`,
            hint: `כל חלק הוא ${fr(1, dd)}. כמה חלקים כאלה יש?`,
            solution: [`${NN} חלקים של ${fr(1, dd)} הם ${fr(NN, dd)}.`, `זה יותר משלם אחד: ${m(F(NN, dd) + ' = ' + HM.mixed(1, rr, dd))}.`],
          };
        }
        case 'storyCmp': {
          const sc = c.scene(CMPU), p1 = c.me, p2 = c.friend(), dd = c.pick([3, 4, 5, 6, 8]);
          const okR = (x) => x % dd && HM.gcd(x % dd, dd) === 1;
          const N2 = c.pick(HM.range(dd + 1, 4 * dd - 1).filter(okR)), N1 = c.chance(0.15) ? N2 : c.pick(HM.range(dd + 1, 4 * dd - 1).filter((x) => x % dd && x !== N2));
          const w2 = Math.floor(N2 / dd), r2 = N2 % dd, ans = N1 > N2 ? 0 : N1 < N2 ? 1 : 2;
          const both = p1.gender === 'f' && p2.gender === 'f' ? 'שתיהן' : 'שניהם';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p1.name, p2.name, `${both} באותה מידה`],
            prompt: `${p1.name} ${p1.g(sc.v[0], sc.v[1])} ${fr(N1, dd)} ${sc.unit}, ו${p2.name} ${p2.g(sc.v[0], sc.v[1])} ${mx(w2, r2, dd)} ${sc.unit}.<br>מי ${sc.v[0]} ${sc.time ? 'יותר זמן' : 'יותר'}?`,
            hint: `${c.g('הפוך', 'הפכי')} את ${fr(N1, dd)} למספר מעורב (או את ${mx(w2, r2, dd)} לשבר), ואז ${c.g('השווה', 'השווי')}.`,
            solution: [`${p1.name}: ${m(F(N1, dd) + ' = ' + HM.mixed(Math.floor(N1 / dd), N1 % dd, dd))}.`, `${p2.name}: ${mx(w2, r2, dd)}.`, ans === 2 ? 'המספרים שווים.' : `${m(HM.mixed(Math.floor(N1 / dd), N1 % dd, dd) + ` ${SIGNH(SIGN(N1, N2))} ` + HM.mixed(w2, r2, dd))}, ולכן ${ans === 0 ? p1.name : p2.name} ${ans === 0 ? p1.g(sc.v[0], sc.v[1]) : p2.g(sc.v[0], sc.v[1])} ${sc.time ? 'יותר זמן' : 'יותר'}.`],
          };
        }
        case 'story': {
          const sc = c.scene(PIECES), p = c.chance(0.6) ? c.me : c.friend();
          const dd = Math.min(d, 6), rr = coprime(c, dd), NN = w * dd + rr;
          return {
            type: 'fraction', mixed: true, answer: { w, n: rr, d: dd },
            prompt: `${sc.fwd(p, NN, dd)}<br>${c.g('כתוב', 'כתבי')} את התשובה כמספר מעורב.`,
            hint: `${NN} פעמים ${fr(1, dd)} הם ${fr(NN, dd)}. כמה שלמים יש בזה?`,
            solution: [`${NN} חלקים של ${fr(1, dd)} הם ${fr(NN, dd)}.`].concat(toMixedSteps(NN, dd)).concat([`התשובה: ${mx(w, rr, dd)} ${sc.pl}`]),
          };
        }
        case 'between': {
          const dd = level === 3 ? c.rnd(3, 12) : d, ww = level === 3 ? c.rnd(2, 9) : w, rr = c.rnd(1, dd - 1), NN = ww * dd + rr;
          return {
            type: 'number', answer: [ww, ww + 1],
            prompt: `${c.g('השלם', 'השלימי')} שני מספרים שלמים עוקבים:<br>${m(HM.slot(0) + ' &lt; ' + F(NN, dd) + ' &lt; ' + HM.slot(1))}`,
            hint: `כמה שלמים יש ב-${fr(NN, dd)}? ${c.g('חלק', 'חלקי')} את ${NN} ב-${dd}.`,
            solution: [`${m(`${NN} : ${dd} = ${ww}`)} ושארית ${rr}.`, `${m(F(NN, dd) + ' = ' + HM.mixed(ww, rr, dd))}, ולכן הוא בין ${ww} ל-${ww + 1}.`],
          };
        }
        case 'order': {
          const dd = c.pick([3, 4, 5, 6, 8]);
          const nums = c.sample(HM.range(dd + 1, 4 * dd - 1), 4);
          const items = nums.map((x) => (x % dd && c.chance(0.5) ? HM.mixed(Math.floor(x / dd), x % dd, dd) : F(x, dd)));
          const sorted = nums.map((x, i) => i).sort((i, j) => nums[i] - nums[j]);
          return {
            type: 'order', items: items.map(m), answer: sorted,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים ${b('מהקטן לגדול')}:`,
            hint: `${c.g('הפוך', 'הפכי')} את כולם לשברים עם המכנה ${dd} (או את כולם למספרים מעורבים), ואז ${c.g('השווה', 'השווי')}.`,
            solution: [nums.map((x, i) => (x % dd && items[i] !== F(x, dd) ? m(HM.mixed(Math.floor(x / dd), x % dd, dd) + ' = ' + F(x, dd)) : null)).filter(Boolean).join(' , ') || `כל המספרים כתובים כשברים עם המכנה ${dd}.`, sorted.map((i) => m(items[i])).join(' , ')],
          };
        }
        case 'pickMixed': {
          const opts = [[w, r, d], [w + 1, r, d], [w, d - r, d], [w, r, N]];
          const seen = new Set(), choices = [];
          opts.forEach(([a1, a2, a3]) => { const k = a1 + ' ' + a2 + '/' + a3; if (seen.has(k) || a2 <= 0 || a2 >= a3) return; seen.add(k); choices.push(mx(a1, a2, a3)); });
          return {
            type: 'choice', choices, answer: 0,
            prompt: `איזה מספר מעורב שווה ל-${fr(N, d)}?`,
            hint: `כמה פעמים ${d} נכנס ב-${N}? מה נשאר?`,
            solution: toMixedSteps(N, d),
          };
        }
        case 'tf': {
          const between = c.chance(0.4), truth = c.chance(0.5);
          if (between) {
            const lo = truth ? w : c.pick([w - 1, w + 1].filter((x) => x >= 0));
            return {
              type: 'tf', answer: lo === w,
              prompt: `${fr(N, d)} נמצא על ישר המספרים בין ${lo} ל-${lo + 1}.`,
              hint: `כמה שלמים יש ב-${fr(N, d)}?`,
              solution: toMixedSteps(N, d).concat([`${fr(N, d)} נמצא בין ${w} ל-${w + 1}, ולכן הטענה ${lo === w ? 'נכונה' : 'לא נכונה'}.`]),
            };
          }
          const wrong = c.pick([[w + 1, r], [w - 1 > 0 ? w - 1 : w + 1, r], [w, d - r !== r ? d - r : (r + 1 < d ? r + 1 : r - 1)]]);
          const [sw, sr] = truth ? [w, r] : wrong;
          const ok = sw === w && sr === r;
          return {
            type: 'tf', answer: ok,
            prompt: `${m(F(N, d) + ' = ' + HM.mixed(sw, sr, d))}`,
            hint: `${c.g('הפוך', 'הפכי')} את ${fr(N, d)} למספר מעורב ו${c.g('השווה', 'השווי')}.`,
            solution: toMixedSteps(N, d).concat([ok ? 'הטענה נכונה.' : 'הטענה לא נכונה.']),
          };
        }
      }
    },
  });

  /* ========== ממספר מעורב לשבר ========== */
  const toImpSteps = (w, n, d) => [
    `${w === 1 ? 'בשלם אחד יש' : `ב-${w} שלמים יש`} ${m(`${w} × ${d} = ${w * d}`)} חלקים של ${fr(1, d)}.`,
    `מוסיפים את ${n === 1 ? 'החלק' : n + ' החלקים'} של השבר: ${m(`${w * d} + ${n} = ${w * d + n}`)}.`,
    `${m(HM.mixed(w, n, d) + ' = ' + F(w * d + n, d))}`,
  ];

  HM.lesson({
    id: 'f-mixed',
    learn: (c) => [
      {
        title: 'שלמים ועוד שבר',
        html: `אחרי מסיבת הכיתה נשארו 2 עוגות שלמות ועוד ${fr(3, 4)} עוגה. כמה עוגה נשארה? ${mx(2, 3, 4)}.<br>${b('מספר מעורב')} הוא בעצם ${HM.hl('תרגיל חיבור')}: ${m(HM.mixed(2, 3, 4) + ' = 2 + ' + F(3, 4))}.<br>קוראים אותו: "שתיים ושלושה רבעים".`,
        visual: wholesPic(2, 3, 4, true),
      },
      {
        title: 'ממספר מעורב לשבר',
        html: `${c.name}, כמה רבעים יש ב-${mx(2, 3, 4)}?`,
        steps: [
          `בכל שלם יש 4 רבעים, ולכן ב-2 שלמים יש ${m('2 × 4 = 8')} רבעים.`,
          `מוסיפים את 3 הרבעים של השבר: ${m('8 + 3 = 11')}.`,
          `${m(HM.mixed(2, 3, 4) + ' = ' + F(11, 4))} ✔`,
        ],
        visual: wholesPic(2, 3, 4),
      },
      {
        title: 'קיצור דרך',
        html: `כדי לכתוב מספר מעורב כשבר:<br>• ${b('המכנה נשאר')} אותו מכנה.<br>• ${b('המונה')} = שלם × מכנה + מונה.<br>לדוגמה ${mx(3, 2, 5)}: ${m('3 × 5 + 2 = 17')}, ולכן ${m(HM.mixed(3, 2, 5) + ' = ' + F(17, 5))}.`,
        visual: wholesPic(3, 2, 5),
      },
      {
        title: 'מספר מעורב על הישר',
        html: `${mx(1, 2, 3)} נמצא ${b('בין 1 ל-2')}: מגיעים ל-1, ומשם עוד 2 קטעים של ${fr(1, 3)}.<br>${c.g('שים', 'שימי')} לב: ${mx(1, 2, 3)} ו-${fr(5, 3)} הם ${HM.hl('אותה נקודה')} על הישר — שני שמות לאותו מספר.`,
        visual: NL({ min: 0, max: 3, den: 3, fracLabels: true, marks: [{ v: 5 / 3 }] }),
      },
      {
        title: 'משווים מספרים מעורבים',
        html: `קודם ${c.g('השווה', 'השווי')} את ${b('השלמים')}: ${m(HM.mixed(3, 1, 4) + ' &gt; ' + HM.mixed(2, 3, 4))}, כי 3 &gt; 2.<br>אם השלמים שווים — ${c.g('השווה', 'השווי')} את השברים: ${m(HM.mixed(2, 3, 5) + ' &gt; ' + HM.mixed(2, 1, 5))}.<br>מספר מעורב מול שבר? ${c.g('כתוב', 'כתבי')} את שניהם ${b('באותה צורה')}: ${m(HM.mixed(1, 1, 4) + ' = ' + F(5, 4) + ' &lt; ' + F(7, 4))}.`,
        visual: NL({ min: 0, max: 2, den: 4, fracLabels: true, marks: [{ v: 5 / 4 }, { v: 7 / 4, cls: 'f-b' }] }),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, כמה שלישים יש ב-${mx(2, 1, 3)}?`,
        visual: wholesPic(2, 1, 3, true),
        quiz: {
          type: 'fraction', accept: 'exact', answer: { n: 7, d: 3 },
          prompt: `${c.g('כתוב', 'כתבי')} את ${mx(2, 1, 3)} כשבר.`,
          hint: 'בכל שלם יש 3 שלישים. כמה שלישים יש ב-2 שלמים? ועוד שליש אחד.',
          solution: toImpSteps(2, 1, 3),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['sumToMixed', 'asSum', 'wholeToFrac', 'toImproperPic', 'nlTap', 'story', 'story', 'storyAdd']
        : level === 2 ? ['toImproper', 'toImproperSlot', 'cmp', 'nlTap', 'tf', 'story', 'story', 'storyCmp']
        : ['order', 'cmpDiff', 'missingPart', 'pick', 'nlRead', 'storyTwo', 'storyTwo', 'storyCmp'];
      const kind = c.pick(kinds);
      const d = level === 1 ? c.pick([2, 3, 4, 5]) : level === 2 ? c.pick([2, 3, 4, 5, 6, 8]) : c.pick([3, 4, 5, 6, 7, 8, 9, 10]);
      const w = level === 1 ? c.rnd(1, 3) : level === 2 ? c.rnd(1, 5) : c.rnd(2, 9);
      const n = coprime(c, d), N = w * d + n;
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      switch (kind) {
        case 'sumToMixed':
          return {
            type: 'fraction', mixed: true, accept: 'exact', answer: { w, n, d },
            prompt: `${c.g('כתוב', 'כתבי')} כמספר מעורב: ${m(`${w} + ` + F(n, d) + ' =')}`,
            visual: wholesPic(w, n, d, true),
            hint: 'מספר מעורב הוא שלמים ועוד שבר — כותבים את השלם, ולידו את השבר.',
            solution: [`${m(`${w} + ` + F(n, d) + ' = ' + HM.mixed(w, n, d))}`],
          };
        case 'asSum': {
          const askW = c.chance(0.5);
          return {
            type: 'number', answer: askW ? w : n,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(HM.mixed(w, n, d) + ' = ' + (askW ? HM.slot(0) + ' + ' + F(n, d) : `${w} + ` + F(HM.slot(0), d)))}`,
            hint: 'מספר מעורב הוא תרגיל חיבור: החלק השלם ועוד השבר.',
            solution: [`${m(HM.mixed(w, n, d) + ` = ${w} + ` + F(n, d))}`],
          };
        }
        case 'wholeToFrac':
          return {
            type: 'number', answer: w * d,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(`${w} = ` + F(HM.slot(0), d))}`,
            visual: wholesPic(w, 0, d, true),
            hint: `בכל שלם יש ${fr(d, d)}. כמה חלקים של ${fr(1, d)} יש ${w === 1 ? 'בשלם אחד' : `ב-${w} שלמים`}?`,
            solution: [`${m(`${w} × ${d} = ${w * d}`)}`, `${m(`${w} = ` + F(w * d, d))}`],
          };
        case 'toImproper':
        case 'toImproperPic':
          return {
            type: 'fraction', accept: 'exact', answer: { n: N, d },
            prompt: `${c.g('כתוב', 'כתבי')} את ${mx(w, n, d)} כשבר${kind === 'toImproperPic' ? ` (${c.g('היעזר', 'היעזרי')} בציור)` : ''}.`,
            visual: kind === 'toImproperPic' ? wholesPic(w, n, d) : undefined,
            hint: `כמה חלקים של ${fr(1, d)} יש בכל שלם? ${c.g('כפול', 'כפלי')} במספר השלמים, ו${c.g('הוסף', 'הוסיפי')} את המונה.`,
            solution: toImpSteps(w, n, d),
          };
        case 'toImproperSlot':
          return {
            type: 'number', answer: N,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(HM.mixed(w, n, d) + ' = ' + F(HM.slot(0), d))}`,
            hint: 'המונה החדש = שלם × מכנה + מונה.',
            solution: toImpSteps(w, n, d),
          };
        case 'nlTap': {
          const dd = Math.min(d, level === 1 ? 4 : 6), ww = Math.min(w, level === 1 ? 2 : 3), nn = coprime(c, dd), max = level === 1 ? ww + 1 : Math.max(ww + 1, 3);
          return {
            type: 'numberline', line: { min: 0, max, den: dd }, answer: (ww * dd + nn) / dd,
            prompt: `${c.g('סמן', 'סמני')} על ישר המספרים את ${mx(ww, nn, dd)}.`,
            hint: `${mx(ww, nn, dd)} נמצא בין ${ww} ל-${ww + 1}. מ-${ww} ${c.g('התקדם', 'התקדמי')} עוד ${cntSeg(nn)} של ${fr(1, dd)}.`,
            solution: [`${m(HM.mixed(ww, nn, dd) + ` = ${ww} + ` + F(nn, dd))}`, `מגיעים ל-${ww}, ומשם עוד ${cntSeg(nn)} של ${fr(1, dd)}.`],
          };
        }
        case 'nlRead': {
          const dd = Math.min(d, 6), ww = Math.min(w, 3), nn = c.rnd(1, dd - 1), NN = ww * dd + nn;
          return {
            type: 'fraction', answer: { n: NN, d: dd },
            prompt: `איזה מספר מסומן על הישר? ${c.g('כתוב', 'כתבי')} אותו ${b('כשבר')} (לא כמספר מעורב).`,
            visual: NL({ min: 0, max: ww + 1, den: dd, marks: [{ v: NN / dd }] }),
            hint: `קודם ${c.g('מצא', 'מצאי')} את המספר המעורב: אחרי איזה שלם הנקודה, וכמה קטעים אחריו. אחר כך ${c.g('הפוך', 'הפכי')} אותו לשבר.`,
            solution: [`הנקודה היא ${mx(ww, nn, dd)}.`].concat(toImpSteps(ww, nn, dd)),
          };
        }
        case 'cmp': {
          const N2 = Math.max(1, N + c.pick([-3, -2, -1, 0, 1, 2, 3])), flip = c.chance(0.5);
          const L = HM.mixed(w, n, d), R = F(N2, d);
          const lv = flip ? N2 / d : N / d, rv = flip ? N / d : N2 / d, sg = SIGN(lv, rv);
          return {
            type: 'compare', prompt: cmpPrompt,
            left: flip ? R : L, right: flip ? L : R, lv, rv, answer: sg,
            hint: `${c.g('כתוב', 'כתבי')} את המספר המעורב כשבר עם המכנה ${d}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: [`${m(HM.mixed(w, n, d) + ' = ' + F(N, d))}`, `${m((flip ? F(N2, d) : F(N, d)) + ` ${SIGNH(sg)} ` + (flip ? F(N, d) : F(N2, d)))}`],
          };
        }
        case 'cmpDiff': {
          const h = c.pick([2, 3, 4, 5]), D = 2 * h, a = coprime(c, h), ww = c.rnd(1, 4), A = ww * h + a;
          const K = Math.max(D + 1, 2 * A + c.pick([-3, -1, 0, 1, 3]));
          const lv = A / h, rv = K / D, sg = SIGN(lv, rv);
          return {
            type: 'compare', prompt: cmpPrompt, left: HM.mixed(ww, a, h), right: F(K, D), lv, rv, answer: sg,
            hint: `${c.g('כתוב', 'כתבי')} את ${mx(ww, a, h)} כשבר, ואז ${c.g('זכור', 'זכרי')}: ${m(F(1, h) + ' = ' + F(2, D))}.`,
            solution: [`${m(HM.mixed(ww, a, h) + ' = ' + F(A, h))}`, `כל ${fr(1, h)} הוא 2 חלקים של ${fr(1, D)}: ${m(F(A, h) + ' = ' + F(2 * A, D))}.`, `${m(F(2 * A, D) + ` ${SIGNH(sg)} ` + F(K, D))}`],
          };
        }
        case 'missingPart': {
          const askW = c.chance(0.5);
          return {
            type: 'number', answer: askW ? w : n,
            prompt: `${c.g('השלם', 'השלימי')}: ${m((askW ? HM.mixed(HM.slot(0), n, d) : HM.mixed(w, HM.slot(0), d)) + ' = ' + F(N, d))}`,
            hint: askW ? `כמה פעמים ${d} נכנס ב-${N}?` : `כמה חלקים של ${fr(1, d)} יש ${w === 1 ? 'בשלם אחד' : `ב-${w} שלמים`}? כמה חסר עד ${N}?`,
            solution: toMixedSteps(N, d),
          };
        }
        case 'pick': {
          const ch = fracChoices({ n: N, d }, [{ n: w * n + d, d }, { n: w + n, d }, { n: w * d, d }, { n: w * d - n, d }, { n: N + d, d }], 4, true);
          return {
            type: 'choice', choices: ch.map((f) => fr(f.n, f.d)), answer: 0,
            prompt: `איזה שבר שווה ל-${mx(w, n, d)}?`,
            hint: 'המונה החדש = שלם × מכנה + מונה. המכנה לא משתנה.',
            solution: toImpSteps(w, n, d),
          };
        }
        case 'tf': {
          const wrongs = [w * n + d, w + n, w * d, N + 1].filter((x) => x !== N && x > 0);
          const truth = c.chance(0.5);
          const X = truth ? N : c.pick(wrongs);
          return {
            type: 'tf', answer: truth, prompt: `${m(HM.mixed(w, n, d) + ' = ' + F(X, d))}`,
            hint: `${c.g('כתוב', 'כתבי')} את ${mx(w, n, d)} כשבר ו${c.g('השווה', 'השווי')}.`,
            solution: toImpSteps(w, n, d).concat([truth ? 'הטענה נכונה.' : `${fr(X, d)} אינו שווה ל-${fr(N, d)}, ולכן הטענה לא נכונה.`]),
          };
        }
        case 'order': {
          const h = c.pick([2, 3, 4]), D = 2 * h;
          const ks = c.sample(HM.range(D + 1, 3 * D - 1).filter((k) => k % D), 4);
          const items = ks.map((k) => {
            const half = k % 2 === 0 && c.chance(0.6), nn = half ? k / 2 : k, dd = half ? h : D, ww = Math.floor(nn / dd), rr = nn % dd;
            return HM.gcd(rr, dd) === 1 && c.chance(0.5) ? HM.mixed(ww, rr, dd) : F(nn, dd);
          });
          const sorted = ks.map((x, i) => i).sort((i, j) => ks[i] - ks[j]);
          return {
            type: 'order', items: items.map(m), answer: sorted,
            prompt: `${c.g('סדר', 'סדרי')} את המספרים ${b('מהקטן לגדול')}:`,
            hint: `${c.g('כתוב', 'כתבי')} את כולם כשברים עם המכנה ${D}. ${c.g('זכור', 'זכרי')}: ${m(F(1, h) + ' = ' + F(2, D))}.`,
            solution: [ks.map((k, i) => (items[i] === F(k, D) ? m(F(k, D)) : m(items[i] + ' = ' + F(k, D)))).join(' , '), sorted.map((i) => m(items[i])).join(' , ')],
          };
        }
        case 'story': {
          const sc = c.scene(PIECES), p = c.chance(0.6) ? c.me : c.friend();
          const dd = level === 1 ? c.pick([2, 3, 4]) : c.pick([2, 3, 4, 5, 6]), ww = level === 1 ? c.rnd(1, 2) : c.rnd(1, 4), nn = coprime(c, dd), NN = ww * dd + nn;
          return {
            type: 'number', answer: NN,
            prompt: sc.inv(p, mx(ww, nn, dd), dd),
            hint: `כמה פעמים ${fr(1, dd)} נכנס ב-${mx(ww, nn, dd)}? ${c.g('כתוב', 'כתבי')} את המספר המעורב כשבר.`,
            solution: toImpSteps(ww, nn, dd).concat([`יש ${NN} חלקים של ${fr(1, dd)}, ולכן התשובה היא ${NN}.`]),
          };
        }
        case 'storyAdd': {
          const sc = c.scene(SHARE.filter((x) => !x.who)), dd = c.pick([2, 3, 4]), nn = coprime(c, dd), ww = c.rnd(1, 3);
          const wholes = ww === 1 ? `${sc.one} ${sc.fem ? 'שלמה אחת' : 'שלם אחד'}` : `${ww} ${sc.many} ${sc.fem ? 'שלמות' : 'שלמים'}`;
          return {
            type: 'fraction', mixed: true, answer: { w: ww, n: nn, d: dd },
            prompt: `${sc.place} נשארו ${wholes} ועוד ${fr(nn, dd)} ${sc.one}.<br>כמה ${sc.one} ${sc.fem ? 'נשארה' : 'נשאר'} בסך הכול? ${c.g('כתוב', 'כתבי')} כמספר מעורב.`,
            visual: wholesPic(ww, nn, dd, true),
            hint: 'מספר מעורב = השלמים ועוד השבר.',
            solution: [`${m(`${ww} + ` + F(nn, dd) + ' = ' + HM.mixed(ww, nn, dd))}`],
          };
        }
        case 'storyCmp': {
          const sc = c.scene(CMPU), p1 = c.me, p2 = c.friend(), dd = level === 2 ? c.pick([2, 3, 4, 5]) : c.pick([4, 5, 6, 8]);
          const pool = HM.range(dd + 1, (level === 2 ? 3 : 5) * dd - 1).filter((x) => x % dd);
          const N1 = c.pick(pool.filter((x) => HM.gcd(x % dd, dd) === 1)), N2 = c.chance(0.15) ? N1 : c.pick(pool.filter((x) => x !== N1));
          const w1 = Math.floor(N1 / dd), r1 = N1 % dd, ans = N1 > N2 ? 0 : N1 < N2 ? 1 : 2;
          const both = p1.gender === 'f' && p2.gender === 'f' ? 'שתיהן' : 'שניהם';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p1.name, p2.name, `${both} באותה מידה`],
            prompt: `${p1.name} ${p1.g(sc.v[0], sc.v[1])} ${mx(w1, r1, dd)} ${sc.unit}, ו${p2.name} ${p2.g(sc.v[0], sc.v[1])} ${fr(N2, dd)} ${sc.unit}.<br>מי ${sc.v[0]} ${sc.time ? 'יותר זמן' : 'יותר'}?`,
            hint: `${c.g('כתוב', 'כתבי')} את ${mx(w1, r1, dd)} כשבר עם המכנה ${dd}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: [`${p1.name}: ${m(HM.mixed(w1, r1, dd) + ' = ' + F(N1, dd))}.`, `${p2.name}: ${fr(N2, dd)}.`, ans === 2 ? 'הכמויות שוות.' : `${m(F(N1, dd) + ` ${SIGNH(SIGN(N1, N2))} ` + F(N2, dd))}, ולכן ${ans === 0 ? p1.name : p2.name} ${ans === 0 ? p1.g(sc.v[0], sc.v[1]) : p2.g(sc.v[0], sc.v[1])} ${sc.time ? 'יותר זמן' : 'יותר'}.`],
          };
        }
        case 'storyTwo': {
          const sc = c.scene(PIECES), p = c.chance(0.6) ? c.me : c.friend(), dd = c.pick([2, 3, 4, 5, 6]);
          const w1 = c.rnd(1, 4), n1 = coprime(c, dd), w2 = c.rnd(1, 4), n2 = coprime(c, dd), N1 = w1 * dd + n1, N2 = w2 * dd + n2;
          return {
            type: 'number', answer: N1 + N2,
            prompt: sc.two(p, mx(w1, n1, dd), mx(w2, n2, dd), dd),
            hint: `${c.g('כתוב', 'כתבי')} כל מספר מעורב כשבר עם המכנה ${dd}. המונים אומרים כמה פעמים ${fr(1, dd)} יש בכל אחד.`,
            solution: [`${m(HM.mixed(w1, n1, dd) + ' = ' + F(N1, dd))}`, `${m(HM.mixed(w2, n2, dd) + ' = ' + F(N2, dd))}`, `בסך הכול: ${m(`${N1} + ${N2} = ${N1 + N2}`)}.`],
          };
        }
      }
    },
  });

  /* ========== הרחבת שברים ========== */
  // שלם שמחולק לחלקים: the = יחיד מיודע (wf = נקבה), pl = רבים מיודע, part = שם החלקים (pf = נקבה), v = [ז, נ], share = אפשר לחלוק בין שניים
  const SPLIT = [
    { tags: ['baking'], the: 'הפיצה', wf: true, pl: 'הפיצות', part: 'משולשים', v: ['אכל', 'אכלה'], share: true },
    { tags: ['baking'], the: 'חפיסת השוקולד', wf: true, pl: 'חפיסות השוקולד', part: 'קוביות', pf: true, v: ['אכל', 'אכלה'], share: true },
    { tags: ['sport'], the: 'האימון', pl: 'האימונים', part: 'תרגילים', v: ['השלים', 'השלימה'] },
    { tags: ['nature'], the: 'הערוגה', wf: true, pl: 'הערוגות', part: 'שורות', pf: true, v: ['שתל', 'שתלה'], share: true },
    { tags: ['art'], the: 'הציור', pl: 'הציורים', part: 'אזורים', v: ['צבע', 'צבעה'], share: true },
    { tags: ['games'], the: 'השלב', pl: 'השלבים', part: 'משימות', pf: true, v: ['השלים', 'השלימה'], share: true },
    { tags: ['reading'], the: 'הספר', pl: 'הספרים', part: 'פרקים', v: ['קרא', 'קראה'] },
    { tags: ['music'], the: 'השיר', pl: 'השירים', part: 'בתים', v: ['למד', 'למדה'] },
    { tags: ['space'], the: 'הפאזל', pl: 'הפאזלים', part: 'חלקים', v: ['הרכיב', 'הרכיבה'], share: true },
    { tags: ['tech'], the: 'התוכנית', wf: true, pl: 'התוכניות', part: 'שורות', pf: true, v: ['כתב', 'כתבה'], share: true },
    { tags: ['animals'], the: 'הכלוב', pl: 'הכלובים', part: 'תאים', v: ['ניקה', 'ניקתה'], share: true },
    { tags: ['kpop'], the: 'אלבום הפוטוקארדים', pl: 'אלבומי הפוטוקארדים', part: 'דפים', v: ['מילא', 'מילאה'], share: true },
    { tags: ['magic'], the: 'ספר הלחשים', pl: 'ספרי הלחשים', part: 'פרקים', v: ['קרא', 'קראה'] },
    { tags: ['squishy'], the: 'מדף הסקווישים', pl: 'מדפי הסקווישים', part: 'תאים', v: ['מילא', 'מילאה'], share: true },
  ];
  const splitText = (sc, k) => `${sc.the} ${sc.wf ? 'מחולקת' : 'מחולק'} ל-${k} ${sc.part} ${sc.pf ? 'שוות' : 'שווים'}`;
  const expandSteps = (a, b, k) => [`כופלים את המונה ואת המכנה ב-${k}:`, `${m(F(a, b) + ' = ' + F(`${a} × ${k}`, `${b} × ${k}`) + ' = ' + F(a * k, b * k))}`];
  const halfSteps = (n, d) => { const s = SIGN(2 * n, d); return [`${m(`${n} × 2 = ${2 * n}`)}`, s === '=' ? `${2 * n} שווה למכנה ${d}, ולכן ${fr(n, d)} הוא בדיוק חצי.` : s === '<' ? `${2 * n} קטן מהמכנה ${d}, ולכן ${fr(n, d)} קטן מחצי.` : `${2 * n} גדול מהמכנה ${d}, ולכן ${fr(n, d)} גדול מחצי.`]; };

  HM.lesson({
    id: 'f-expand',
    learn: (c) => [
      {
        title: 'אותה פיצה, שמות שונים',
        html: `שתי פיצות באותו גודל: אחת חתוכה ל-2 חלקים, והשנייה ל-8.<br>${c.name} ${c.g('אכל', 'אכלה')} חלק אחד מהראשונה — ${fr(1, 2)}. כמה חלקים מהשנייה ${c.g('הוא היה צריך', 'היא הייתה צריכה')} לאכול כדי לאכול אותו דבר?<br>4 חלקים! ${HM.hl(m(F(1, 2) + ' = ' + F(2, 4) + ' = ' + F(4, 8)))} — שמות שונים לאותה כמות.`,
        visual: V.bars([{ n: 1, d: 2 }, { n: 2, d: 4 }, { n: 4, d: 8 }], { labels: [{ n: 1, d: 2 }, { n: 2, d: 4 }, { n: 4, d: 8 }] }),
      },
      {
        title: 'שמות לחצי',
        html: `בכל השמות של חצי, ${b('המונה הוא חצי מהמכנה')} (או: המכנה כפול מהמונה):<br>${m(`${F(1, 2)} = ${F(3, 6)} = ${F(5, 10)} = ${F(8, 16)} = ${F(50, 100)}`)}<br>האם ${fr(7, 14)} הוא חצי? כן! 7 הוא חצי מ-14.`,
        visual: V.bars([{ n: 3, d: 6 }, { n: 5, d: 10 }], { labels: [{ n: 3, d: 6 }, { n: 5, d: 10 }] }),
      },
      {
        title: 'גדול מחצי או קטן מחצי?',
        html: `כדי להשוות שבר לחצי, ${c.g('כפול', 'כפלי')} את המונה ב-2 ו${c.g('השווה', 'השווי')} למכנה:<br>• ${fr(3, 8)}: ${m('3 × 2 = 6')}, ו-6 &lt; 8 ← ${b('קטן מחצי')}.<br>• ${fr(5, 8)}: ${m('5 × 2 = 10')}, ו-10 &gt; 8 ← ${b('גדול מחצי')}.`,
        visual: NL({ min: 0, max: 1, den: 8, marks: [{ v: 3 / 8 }, { v: 0.5, label: { n: 1, d: 2 }, cls: 'f-b' }, { v: 5 / 8 }] }),
      },
      {
        title: 'הרחבת שבר',
        html: `${b('הרחבה')}: כופלים את ${b('המונה')} ואת ${b('המכנה')} ${HM.hl('באותו מספר')}.<br>${m(F(2, 3) + ' = ' + F('2 × 4', '3 × 4') + ' = ' + F(8, 12))}<br>למה זה עובד? חותכים כל חלק ל-4 חלקים קטנים. יש יותר חלקים, אבל ${b('הכמות לא משתנה')}.`,
        visual: V.bars([{ n: 2, d: 3 }, { n: 8, d: 12 }], { labels: [{ n: 2, d: 3 }, { n: 8, d: 12 }] }),
      },
      {
        title: 'הרחבה למכנה מסוים',
        html: `${c.name}, נמצא את המונה החסר: ${m(F(3, 4) + ' = ' + F(HM.box(), 20))}`,
        steps: [
          `פי כמה גדל המכנה? ${m('4 × 5 = 20')} ← פי 5.`,
          `כופלים גם את המונה ב-5: ${m('3 × 5 = 15')}.`,
          `${m(F(3, 4) + ' = ' + F(15, 20))} ✔`,
        ],
        visual: V.bars([{ n: 3, d: 4 }, { n: 15, d: 20 }], { labels: [{ n: 3, d: 4 }, { n: 15, d: 20 }] }),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.g('הרחב', 'הרחיבי')} את ${fr(2, 5)} למכנה 10.`,
        quiz: {
          type: 'number', answer: 4,
          prompt: `${c.g('השלם', 'השלימי')}: ${m(F(2, 5) + ' = ' + F(HM.slot(0), 10))}`,
          hint: `פי כמה גדל המכנה? ${c.g('כפול', 'כפלי')} גם את המונה באותו מספר.`,
          solution: expandSteps(2, 5, 2),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['halfSlot', 'isHalf', 'cmpHalf', 'shadeExpand', 'expandSlot', 'story', 'story', 'storyHalf']
        : level === 2 ? ['expandTo', 'expandBy', 'expandSlot', 'names', 'cmpHalf', 'story', 'story', 'storyHalfCmp']
        : ['notName', 'expandTo', 'byWhat', 'cmpHalfBig', 'shadeExpand', 'storyCmp', 'storyCmp', 'storyTwo'];
      const kind = c.pick(kinds);
      const bb = level === 1 ? c.pick([2, 3, 4, 5]) : level === 2 ? c.pick([2, 3, 4, 5, 6, 8, 10]) : c.pick([3, 4, 5, 6, 7, 8, 9, 12]);
      const a = coprime(c, bb);
      const k = level === 1 ? c.pick([2, 3]) : level === 2 ? c.rnd(2, 6) : c.rnd(3, 9);
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      switch (kind) {
        case 'halfSlot': {
          const h = c.rnd(2, 12), askN = c.chance(0.5);
          return {
            type: 'number', answer: askN ? h : 2 * h,
            prompt: `${c.g('השלם', 'השלימי')} שם נוסף לחצי: ${m(F(1, 2) + ' = ' + (askN ? F(HM.slot(0), 2 * h) : F(h, HM.slot(0))))}`,
            hint: askN ? 'בשמות של חצי, המונה הוא חצי מהמכנה.' : 'בשמות של חצי, המכנה כפול מהמונה.',
            solution: [askN ? `${m(`${2 * h} : 2 = ${h}`)}` : `${m(`${h} × 2 = ${2 * h}`)}`, `${m(F(1, 2) + ' = ' + F(h, 2 * h))}`],
          };
        }
        case 'isHalf': {
          const h = c.rnd(2, 9);
          const ch = fracChoices({ n: h, d: 2 * h }, [{ n: h, d: 2 * h + 1 }, { n: h + 1, d: 2 * h }, { n: h, d: h + 1 }, { n: h - 1, d: 2 * h }, { n: 2 * h, d: h + 2 }], 4, true);
          return {
            type: 'choice', choices: ch.map((f) => fr(f.n, f.d)), answer: 0,
            prompt: `איזה שבר שווה ל-${fr(1, 2)}?`,
            hint: 'בשבר ששווה לחצי, המונה הוא בדיוק חצי מהמכנה.',
            solution: [`${h} הוא חצי מ-${2 * h}, ולכן ${m(F(h, 2 * h) + ' = ' + F(1, 2))}.`],
          };
        }
        case 'cmpHalf':
        case 'cmpHalfBig': {
          if (kind === 'cmpHalfBig' && c.chance(0.5)) {
            const d1 = c.rnd(5, 15), d2 = c.rnd(5, 15), lowFirst = c.chance(0.5);
            const lo = { n: Math.ceil(d1 / 2) - 1, d: d1 }, hi = { n: Math.floor(d2 / 2) + 1, d: d2 };
            const L = lowFirst ? lo : hi, R = lowFirst ? hi : lo, sg = SIGN(L.n / L.d, R.n / R.d);
            return {
              type: 'compare', prompt: cmpPrompt, left: F(L.n, L.d), right: F(R.n, R.d), lv: L.n / L.d, rv: R.n / R.d, answer: sg,
              hint: `${c.g('השווה', 'השווי')} כל שבר לחצי: האם הוא גדול מחצי או קטן מחצי?`,
              solution: [`${fr(lo.n, lo.d)}: ${m(`${lo.n} × 2 = ${2 * lo.n}`)} &lt; ${lo.d} ← קטן מחצי.`, `${fr(hi.n, hi.d)}: ${m(`${hi.n} × 2 = ${2 * hi.n}`)} &gt; ${hi.d} ← גדול מחצי.`, `${m(F(L.n, L.d) + ` ${SIGNH(sg)} ` + F(R.n, R.d))}`],
            };
          }
          const d = kind === 'cmpHalfBig' ? c.rnd(15, 99) : c.rnd(3, 12);
          const n = kind === 'cmpHalfBig' ? Math.max(1, Math.min(d - 1, Math.floor(d / 2) + c.pick([-2, -1, 0, 1, 2]))) : c.rnd(1, d - 1);
          const sg = SIGN(n / d, 0.5);
          return {
            type: 'compare', prompt: cmpPrompt, left: F(n, d), right: F(1, 2), lv: n / d, rv: 0.5, answer: sg,
            hint: `${c.g('כפול', 'כפלי')} את המונה ב-2 ו${c.g('השווה', 'השווי')} למכנה.`,
            solution: halfSteps(n, d),
          };
        }
        case 'shadeExpand': {
          const b1 = level === 1 ? c.pick([2, 3, 4]) : c.pick([3, 4, 5, 6]), a1 = coprime(c, b1), kk = level === 1 ? 2 : c.pick([2, 3, 4].filter((x) => b1 * x <= 20)), D = b1 * kk;
          return {
            type: 'shade', shape: 'bar', parts: D, answer: a1 * kk,
            prompt: `בפס העליון צבוע ${fr(a1, b1)}. ${c.g('צבע', 'צבעי')} את אותה כמות בפס של ${D} חלקים.`,
            visual: V.bar(a1, b1),
            hint: `כל חלק בפס העליון שווה ל-${kk} חלקים בפס של ${D}.`,
            solution: expandSteps(a1, b1, kk).concat([`צריך לצבוע ${a1 * kk} חלקים.`]),
          };
        }
        case 'expandSlot': {
          const askN = c.chance(0.6);
          return {
            type: 'number', answer: askN ? a * k : bb * k,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(F(a, bb) + ' = ' + (askN ? F(HM.slot(0), bb * k) : F(a * k, HM.slot(0))))}`,
            hint: askN ? `פי כמה גדל המכנה? ${c.g('כפול', 'כפלי')} גם את המונה באותו מספר.` : `פי כמה גדל המונה? ${c.g('כפול', 'כפלי')} גם את המכנה באותו מספר.`,
            solution: [askN ? `${m(`${bb} × ${k} = ${bb * k}`)} ← המכנה גדל פי ${k}.` : `${m(`${a} × ${k} = ${a * k}`)} ← המונה גדל פי ${k}.`].concat(expandSteps(a, bb, k).slice(1)),
          };
        }
        case 'expandTo':
          return {
            type: 'fraction', accept: 'exact', answer: { n: a * k, d: bb * k },
            prompt: `${c.g('הרחב', 'הרחיבי')} את ${fr(a, bb)} למכנה ${bb * k}.`,
            hint: `פי כמה צריך להגדיל את המכנה ${bb} כדי לקבל ${bb * k}?`,
            solution: [`${m(`${bb} × ${k} = ${bb * k}`)}`].concat(expandSteps(a, bb, k)),
          };
        case 'expandBy':
          return {
            type: 'fraction', accept: 'exact', answer: { n: a * k, d: bb * k },
            prompt: `${c.g('הרחב', 'הרחיבי')} את ${fr(a, bb)} ב-${k}.`,
            hint: `${c.g('כפול', 'כפלי')} את המונה ואת המכנה ב-${k}.`,
            solution: expandSteps(a, bb, k),
          };
        case 'names': {
          const ch = fracChoices({ n: a * k, d: bb * k }, [{ n: a + k, d: bb + k }, { n: a * k, d: bb }, { n: a, d: bb * k }, { n: a + 1, d: bb + 1 }, { n: a * k, d: bb + k }], 4, true);
          return {
            type: 'choice', choices: ch.map((f) => fr(f.n, f.d)), answer: 0,
            prompt: `איזה שבר שווה ל-${fr(a, bb)}?`,
            hint: 'שבר שווה מקבלים כשכופלים את המונה ואת המכנה באותו מספר. חיבור לא עובד!',
            solution: expandSteps(a, bb, k),
          };
        }
        case 'notName': {
          const ks = c.sample([2, 3, 4, 5, 6, 7], 3), add = c.rnd(1, 4);
          const wrong = { n: a + add, d: bb + add };
          return {
            type: 'choice', answer: 0,
            choices: [fr(wrong.n, wrong.d)].concat(ks.map((x) => fr(a * x, bb * x))),
            prompt: `איזה שבר ${b('אינו')} שווה ל-${fr(a, bb)}?`,
            hint: `${c.g('בדוק', 'בדקי')} בכל שבר: האם המונה והמכנה גדלו פי אותו מספר?`,
            solution: [`${ks.map((x) => fr(a * x, bb * x)).join(', ')} — הרחבות של ${fr(a, bb)}.`, `ב-${fr(wrong.n, wrong.d)} הוסיפו ${add} למונה ולמכנה, וזו לא הרחבה.`],
          };
        }
        case 'byWhat':
          return {
            type: 'number', answer: k,
            prompt: `${m(F(a, bb) + ' = ' + F(a * k, bb * k))}<br>בכמה הרחיבו את השבר?`,
            hint: 'פי כמה גדל המכנה? (המונה גדל פי אותו מספר.)',
            solution: [`${m(`${bb * k} : ${bb} = ${k}`)}`, `הרחיבו ב-${k}.`],
          };
        case 'story':
        case 'storyHalf':
        case 'storyHalfCmp':
        case 'storyCmp':
        case 'storyTwo': {
          const sc = c.scene(kind === 'storyTwo' ? SPLIT.filter((x) => x.share) : SPLIT);
          const p = c.me, f = c.friend(), V1 = (q) => q.g(sc.v[0], sc.v[1]), own = (q) => q.g('שלו', 'שלה');
          if (kind === 'story') {
            const b1 = level === 1 ? c.pick([2, 3, 4]) : c.pick([2, 3, 4, 5, 6]), a1 = coprime(c, b1), kk = level === 1 ? 2 : c.rnd(2, 4), D = b1 * kk;
            return {
              type: 'number', answer: a1 * kk,
              prompt: `${p.name} ${V1(p)} ${fr(a1, b1)} מ${sc.the} ${own(p)}. ${f.name} ${V1(f)} אותו חלק מ${sc.the} ${own(f)}, ${sc.wf ? 'שמחולקת' : 'שמחולק'} ל-${D} ${sc.part} ${sc.pf ? 'שוות' : 'שווים'}.<br>כמה ${sc.part} ${V1(f)} ${f.name}?`,
              hint: `${c.g('הרחב', 'הרחיבי')} את ${fr(a1, b1)} לשבר שהמכנה שלו ${D}.`,
              solution: expandSteps(a1, b1, kk).concat([`${f.name} ${V1(f)} ${a1 * kk} ${sc.part}.`]),
            };
          }
          if (kind === 'storyHalf') {
            const h = c.rnd(2, 8);
            return {
              type: 'number', answer: h,
              prompt: `${splitText(sc, 2 * h)}. ${p.name} ${V1(p)} בדיוק חצי מ${sc.the}.<br>כמה ${sc.part} ${V1(p)} ${p.name}?`,
              hint: `חצי מ-${2 * h} — המונה הוא חצי מהמכנה.`,
              solution: [`${m(F(1, 2) + ' = ' + F(h, 2 * h))}`, `${p.name} ${V1(p)} ${h} ${sc.part}.`],
            };
          }
          if (kind === 'storyHalfCmp') {
            const d = c.rnd(4, 14), n = c.rnd(1, d - 1), sg = SIGN(2 * n, d);
            return {
              type: 'choice', keep: true, answer: sg === '>' ? 0 : sg === '=' ? 1 : 2,
              choices: ['יותר מחצי', 'בדיוק חצי', 'פחות מחצי'],
              prompt: `${p.name} ${V1(p)} ${fr(n, d)} מ${sc.the}.<br>האם ${p.g('הוא', 'היא')} ${V1(p)} יותר מחצי, בדיוק חצי או פחות מחצי?`,
              hint: `${c.g('כפול', 'כפלי')} את המונה ב-2 ו${c.g('השווה', 'השווי')} למכנה.`,
              solution: halfSteps(n, d),
            };
          }
          if (kind === 'storyCmp') {
            const b1 = c.pick([2, 3, 4, 5]), kk = c.pick([2, 3, 4]), b2 = b1 * kk, a1 = coprime(c, b1);
            const a2 = Math.min(b2 - 1, Math.max(1, a1 * kk + c.pick([-1, 0, 1])));
            const swap = c.chance(0.5), P1 = swap ? f : p, P2 = swap ? p : f;
            const v1 = a1 / b1, v2 = a2 / b2, ans = v1 > v2 ? 0 : v1 < v2 ? 1 : 2;
            const both = P1.gender === 'f' && P2.gender === 'f' ? 'שתיהן' : 'שניהם';
            return {
              type: 'choice', keep: true, answer: ans,
              choices: [P1.name, P2.name, `${both} באותה מידה`],
              prompt: `${P1.name} ${V1(P1)} ${fr(a1, b1)} מ${sc.the} ${own(P1)}, ו${P2.name} ${V1(P2)} ${fr(a2, b2)} מ${sc.the} ${own(P2)}. ${sc.pl} של שניהם באותו גודל.<br>מי ${sc.v[0]} יותר?`,
              hint: `${c.g('הרחב', 'הרחיבי')} את ${fr(a1, b1)} למכנה ${b2}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
              solution: expandSteps(a1, b1, kk).concat([`${m(F(a1 * kk, b2) + ` ${SIGNH(SIGN(v1, v2))} ` + F(a2, b2))}`, ans === 2 ? 'השברים שווים — זו אותה כמות.' : `${ans === 0 ? P1.name : P2.name} ${ans === 0 ? V1(P1) : V1(P2)} יותר.`]),
            };
          }
          // storyTwo: שני ילדים, מכנים שונים, כמה חלקים נשארו
          let D, y1, y2, x1, x2, g = 0;
          do {
            D = c.pick([6, 8, 10, 12]);
            const ds = HM.divisors(D).filter((y) => y > 1 && y < D);
            y1 = c.pick(ds); y2 = c.pick(ds); x1 = coprime(c, y1); x2 = coprime(c, y2);
          } while (x1 * D / y1 + x2 * D / y2 >= D && g++ < 50);
          if (x1 * D / y1 + x2 * D / y2 >= D) { D = 12; y1 = 3; x1 = 1; y2 = 4; x2 = 1; }
          const e1 = x1 * D / y1, e2 = x2 * D / y2;
          return {
            type: 'number', answer: D - e1 - e2,
            prompt: `${splitText(sc, D)}. ${p.name} ${V1(p)} ${fr(x1, y1)} מ${sc.the}, ו${f.name} ${V1(f)} ${fr(x2, y2)} מ${sc.the}.<br>כמה ${sc.part} נשארו?`,
            hint: `${c.g('הרחב', 'הרחיבי')} כל שבר למכנה ${D} — כך ${c.g('תדע', 'תדעי')} כמה ${sc.part} כל אחד ${sc.v[0]}.`,
            solution: [`${p.name}: ${m(F(x1, y1) + ' = ' + F(e1, D))} ← ${e1} ${sc.part}.`, `${f.name}: ${m(F(x2, y2) + ' = ' + F(e2, D))} ← ${e2} ${sc.part}.`, `נשארו ${m(`${D} − ${e1} − ${e2} = ${D - e1 - e2}`)} ${sc.part}.`],
          };
        }
      }
    },
  });

  /* ========== צמצום שברים ========== */
  // פס של d חלקים (n צבועים) עם קווים עבים כל k חלקים — המחשה לצמצום
  function groupBar(n, d, k, o) {
    o = o || {};
    const w = 320, h = 52, pad = 4, pw = (w - 2 * pad) / d;
    let s = '';
    for (let i = 0; i < d; i++) { const x = w - pad - (i + 1) * pw; s += S.rect(x, pad, pw, h, { cls: (i < n ? 'f-a' : 'f-w') + ' s-soft', sw: 1.2 }); }
    for (let i = k; i < d; i += k) { const x = w - pad - i * pw; s += S.line(x, pad, x, pad + h, { cls: 's-ink', sw: 3.5 }); }
    s += S.rect(pad, pad, w - 2 * pad, h, { fill: 'none', cls: 's-ink', sw: 3, rx: 6 });
    return S.svg(w, h + 2 * pad, s, { label: `פס של ${d} חלקים בקבוצות של ${k}`, maxw: o.maxw });
  }
  const reduceSteps = (n, d, k) => [`מחלקים את המונה ואת המכנה ב-${k}:`, `${m(F(n, d) + ' = ' + F(`${n} : ${k}`, `${d} : ${k}`) + ' = ' + F(n / k, d / k))}`];
  const fullSteps = (n, d) => {
    const g = HM.gcd(n, d);
    if (g === 1) return [`ל-${n} ול-${d} אין מחלק משותף חוץ מ-1, ולכן ${fr(n, d)} כבר מצומצם.`];
    return [`המספר הגדול ביותר ש-${n} ו-${d} מתחלקים בו הוא ${g}.`].concat(reduceSteps(n, d, g).slice(1)).concat([`ל-${n / g} ול-${d / g} אין עוד מחלק משותף — זה השבר המצומצם.`]);
  };
  // שבר שאפשר לצמצם: a/b מצומצם, מוכפל ב-k
  const mkRed = (c, bs, ks) => { const bb = c.pick(bs), a = coprime(c, bb), k = c.pick(ks); return { a, b: bb, k, n: a * k, d: bb * k }; };

  HM.lesson({
    id: 'f-reduce',
    learn: (c) => [
      {
        title: 'פחות חלקים, אותה כמות',
        html: `${c.name} ${c.g('אכל', 'אכלה')} 6 קוביות מחפיסת שוקולד של 8 קוביות — ${fr(6, 8)} מהחפיסה.<br>אם נאחד כל 2 קוביות לחתיכה אחת, יהיו בחפיסה 4 חתיכות, ו${c.name} ${c.g('אכל', 'אכלה')} 3 מהן — ${fr(3, 4)}.<br>${HM.hl(m(F(6, 8) + ' = ' + F(3, 4)))} — אותה כמות, שם קצר יותר.`,
        visual: groupBar(6, 8, 2) + V.bar(3, 4),
      },
      {
        title: 'מה זה צמצום?',
        html: `${b('צמצום')}: מחלקים את ${b('המונה')} ואת ${b('המכנה')} ${HM.hl('באותו מספר')}.<br>${m(F(6, 8) + ' = ' + F('6 : 2', '8 : 2') + ' = ' + F(3, 4))}<br>צמצום הוא ההפך מהרחבה: במקום לחתוך לחלקים קטנים, ${b('מאחדים')} חלקים לחלקים גדולים. הכמות לא משתנה.`,
        visual: groupBar(4, 12, 4) + V.bar(1, 3),
      },
      {
        title: 'במה אפשר לצמצם?',
        html: `מצמצמים במספר ש${b('גם המונה וגם המכנה')} מתחלקים בו בלי שארית — ${b('מחלק משותף')}.<br>• ${fr(9, 12)}: 9 ו-12 מתחלקים ב-3 ← ${m(F(9, 12) + ' = ' + F(3, 4))}.<br>• ${fr(5, 7)}: אין מספר כזה (חוץ מ-1) ← השבר כבר ${b('מצומצם')}.`,
        visual: groupBar(9, 12, 3),
      },
      {
        title: 'צמצום עד הסוף',
        html: `${c.g('צמצם', 'צמצמי')} את ${fr(12, 18)} עד הסוף.`,
        steps: [
          `12 ו-18 זוגיים — מצמצמים ב-2: ${m(F(12, 18) + ' = ' + F(6, 9))}.`,
          `6 ו-9 מתחלקים ב-3 — מצמצמים ב-3: ${m(F(6, 9) + ' = ' + F(2, 3))}.`,
          `ל-2 ול-3 אין מחלק משותף, ולכן ${fr(2, 3)} הוא ${b('השבר המצומצם')} ✔ (אפשר גם לצמצם ב-6 בבת אחת.)`,
        ],
        visual: groupBar(12, 18, 6),
      },
      {
        title: 'טיפים למציאת מחלק משותף',
        html: `• שני המספרים ${b('זוגיים')}? אפשר לצמצם ב-2.<br>• שניהם מסתיימים ב-0 או ב-5? אפשר לצמצם ב-5.<br>• שניהם בלוח הכפל של 3? אפשר לצמצם ב-3.<br>• המכנה מתחלק במונה? מצמצמים במונה: ${m(F(4, 12) + ' = ' + F(1, 3))}.<br>${c.g('זכור', 'זכרי')}: אחרי כל צמצום ${c.g('בדוק', 'בדקי')} אם אפשר לצמצם שוב.`,
        visual: groupBar(4, 12, 4),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, ${c.g('צמצם', 'צמצמי')} את ${fr(10, 15)} עד הסוף.`,
        visual: groupBar(10, 15, 5),
        quiz: {
          type: 'fraction', accept: 'simplest', answer: { n: 2, d: 3 },
          prompt: `${c.g('צמצם', 'צמצמי')} עד הסוף: ${m(F(10, 15) + ' =')}`,
          hint: '10 ו-15 מסתיימים ב-0 וב-5. במה שניהם מתחלקים?',
          solution: fullSteps(10, 15),
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['shadeReduce', 'reduceBy2', 'reduceSlot', 'canReduce', 'picReduce', 'story', 'story', 'storyTf']
        : level === 2 ? ['reduceBy', 'reduceFull', 'byWhat', 'canReduce', 'pickSimplest', 'story', 'story', 'storyTf']
        : ['reduceFull', 'missing', 'cmpReduce', 'oddReduce', 'pickSimplest', 'storyCmp', 'storyCmp', 'storyLeft'];
      const kind = c.pick(kinds);
      const R = level === 1 ? mkRed(c, [2, 3, 4, 5], [2, 3]) : level === 2 ? mkRed(c, [2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 5]) : mkRed(c, [3, 4, 5, 6, 7, 8, 9], [4, 6, 8, 9, 10, 12]);
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      const sc = c.scene(SPLIT), p = c.me, f = c.friend(), V1 = (q) => q.g(sc.v[0], sc.v[1]);
      switch (kind) {
        case 'shadeReduce': {
          const T = mkRed(c, [2, 3, 4], [2, 3]);
          return {
            type: 'shade', shape: 'bar', parts: T.b, answer: T.a,
            prompt: `בפס העליון צבוע ${fr(T.n, T.d)}. ${c.g('צבע', 'צבעי')} את אותה כמות בפס של ${T.b} חלקים.`,
            visual: groupBar(T.n, T.d, T.k),
            hint: `הקווים העבים מחלקים את הפס העליון ל-${T.b} קבוצות. כל קבוצה שווה לחלק אחד בפס שלך.`,
            solution: reduceSteps(T.n, T.d, T.k).concat([`צריך לצבוע ${cntPart(T.a)}.`]),
          };
        }
        case 'picReduce':
          return {
            type: 'fraction', accept: 'exact', answer: { n: R.a, d: R.b },
            prompt: `הפס מחולק ל-${R.d} חלקים, והקווים העבים מקבצים אותם לקבוצות של ${R.k}. איזה שבר צבוע, אם סופרים רק את הקבוצות?`,
            visual: groupBar(R.n, R.d, R.k),
            hint: `כמה קבוצות יש בסך הכול? כמה מהן צבועות?`,
            solution: [`יש ${R.b} קבוצות, ${R.a === 1 ? 'אחת מהן צבועה' : R.a + ' מהן צבועות'}.`].concat(reduceSteps(R.n, R.d, R.k).slice(1)),
          };
        case 'reduceBy2': {
          const y = c.rnd(2, 8), x = c.rnd(1, y - 1);
          return {
            type: 'fraction', accept: 'exact', answer: { n: x, d: y },
            prompt: `${c.g('צמצם', 'צמצמי')} את ${fr(2 * x, 2 * y)} ב-2.`,
            hint: 'מחלקים את המונה ואת המכנה ב-2.',
            solution: reduceSteps(2 * x, 2 * y, 2),
          };
        }
        case 'reduceBy': {
          const k = c.pick(HM.divisors(HM.gcd(R.n, R.d)).filter((x) => x > 1));
          return {
            type: 'fraction', accept: 'exact', answer: { n: R.n / k, d: R.d / k },
            prompt: `${c.g('צמצם', 'צמצמי')} את ${fr(R.n, R.d)} ב-${k}.`,
            hint: `${c.g('חלק', 'חלקי')} את המונה ואת המכנה ב-${k}.`,
            solution: reduceSteps(R.n, R.d, k),
          };
        }
        case 'reduceSlot': {
          const askN = c.chance(0.6);
          return {
            type: 'number', answer: askN ? R.a : R.b,
            prompt: `${c.g('השלם', 'השלימי')}: ${m(F(R.n, R.d) + ' = ' + (askN ? F(HM.slot(0), R.b) : F(R.a, HM.slot(0))))}`,
            hint: askN ? `פי כמה קטן המכנה? ${c.g('חלק', 'חלקי')} גם את המונה באותו מספר.` : `פי כמה קטן המונה? ${c.g('חלק', 'חלקי')} גם את המכנה באותו מספר.`,
            solution: reduceSteps(R.n, R.d, R.k),
          };
        }
        case 'reduceFull': {
          const T = level === 3 ? mkRed(c, [3, 4, 5, 7, 8, 9], [6, 8, 9, 10, 12]) : R;
          return {
            type: 'fraction', accept: 'simplest', answer: { n: T.a, d: T.b },
            prompt: `${c.g('צמצם', 'צמצמי')} עד הסוף: ${m(F(T.n, T.d) + ' =')}`,
            hint: `${c.g('חפש', 'חפשי')} מספר ששני המספרים מתחלקים בו. אחרי הצמצום ${c.g('בדוק', 'בדקי')} אם אפשר לצמצם שוב.`,
            solution: fullSteps(T.n, T.d),
          };
        }
        case 'byWhat':
          return {
            type: 'number', answer: R.k,
            prompt: `${m(F(R.n, R.d) + ' = ' + F(R.a, R.b))}<br>במה צמצמו את השבר?`,
            hint: 'פי כמה קטן המכנה? (המונה קטן פי אותו מספר.)',
            solution: [`${m(`${R.d} : ${R.b} = ${R.k}`)}`, `צמצמו ב-${R.k}.`],
          };
        case 'canReduce': {
          const yes = c.chance(0.5);
          let n, d;
          if (yes) { n = R.n; d = R.d; }
          else { const ds = level === 1 ? HM.range(5, 15) : HM.range(9, 30); let g = 0; do { d = c.pick(ds); n = c.rnd(2, d - 1); } while (HM.gcd(n, d) !== 1 && g++ < 50); if (HM.gcd(n, d) !== 1) { n = 7; d = 9; } }
          const gg = HM.gcd(n, d);
          return {
            type: 'tf', answer: gg > 1,
            prompt: `אפשר לצמצם את השבר ${fr(n, d)}.`,
            hint: `האם יש מספר (חוץ מ-1) שגם ${n} וגם ${d} מתחלקים בו בלי שארית?`,
            solution: gg > 1 ? [`${n} ו-${d} מתחלקים שניהם ב-${gg}: ${m(F(n, d) + ' = ' + F(n / gg, d / gg))}. הטענה נכונה.`] : [`ל-${n} ול-${d} אין מחלק משותף חוץ מ-1, ולכן השבר כבר מצומצם. הטענה לא נכונה.`],
          };
        }
        case 'pickSimplest': {
          const T = level === 3 ? mkRed(c, [3, 4, 5, 7, 8], [4, 6, 8, 9, 12]) : mkRed(c, [3, 4, 5, 7], [4, 6, 8, 9]);
          const partial = HM.divisors(T.k).filter((x) => x > 1 && x < T.k).map((x) => ({ n: T.n / x, d: T.d / x }));
          const s1 = T.n - T.a;
          const wrong = [{ n: T.a, d: T.d }, { n: T.n - s1, d: T.d - s1 }, { n: T.a + 1, d: T.b + 1 }];
          const ch = fracChoices({ n: T.a, d: T.b }, c.shuffle(partial).slice(0, 2).concat(wrong), 4, false);
          return {
            type: 'choice', choices: ch.map((x) => fr(x.n, x.d)), answer: 0,
            prompt: `מהו השבר ${b('המצומצם עד הסוף')} ששווה ל-${fr(T.n, T.d)}?`,
            hint: `${c.g('צמצם', 'צמצמי')} שוב ושוב, עד שלמונה ולמכנה אין מחלק משותף.`,
            solution: fullSteps(T.n, T.d),
          };
        }
        case 'missing': {
          const askD = c.chance(0.5);
          return {
            type: 'number', answer: askD ? R.d : R.n,
            prompt: `${c.g('השלם', 'השלימי')}: ${m((askD ? F(R.n, HM.slot(0)) : F(HM.slot(0), R.d)) + ' = ' + F(R.a, R.b))}`,
            hint: askD ? `פי כמה ${R.n} גדול מ-${R.a}? המכנה גדל פי אותו מספר.` : `פי כמה ${R.d} גדול מ-${R.b}? המונה גדל פי אותו מספר.`,
            solution: [askD ? `${m(`${R.n} : ${R.a} = ${R.k}`)}` : `${m(`${R.d} : ${R.b} = ${R.k}`)}`, `${m(F(R.n, R.d) + ' = ' + F(R.a, R.b))} (צמצום ב-${R.k}).`],
          };
        }
        case 'cmpReduce': {
          const bb = c.pick([3, 4, 5, 6, 7, 8, 9]), k = c.rnd(2, 6), x = c.rnd(1, bb - 1), y = c.rnd(1, bb - 1), flip = c.chance(0.5);
          const big = F(x * k, bb * k), small = F(y, bb), lv = flip ? y / bb : x / bb, rv = flip ? x / bb : y / bb, sg = SIGN(lv, rv);
          return {
            type: 'compare', prompt: cmpPrompt, left: flip ? small : big, right: flip ? big : small, lv, rv, answer: sg,
            hint: `${c.g('צמצם', 'צמצמי')} את ${fr(x * k, bb * k)} כך שהמכנה יהיה ${bb}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: reduceSteps(x * k, bb * k, k).concat([`${m((flip ? F(y, bb) : F(x, bb)) + ` ${SIGNH(sg)} ` + (flip ? F(x, bb) : F(y, bb)))}`]),
          };
        }
        case 'oddReduce': {
          const reds = [];
          let g = 0;
          while (reds.length < 3 && g++ < 60) { const T = mkRed(c, [2, 3, 4, 5, 7], [3, 5, 7]); const key = T.n + '/' + T.d; if (!reds.some((r) => r.key === key)) reds.push({ n: T.n, d: T.d, k: T.k, key }); }
          let n, d, h = 0; do { d = c.rnd(9, 35); n = c.rnd(2, d - 1); } while ((HM.gcd(n, d) !== 1 || reds.some((r) => r.key === n + '/' + d)) && h++ < 80);
          if (HM.gcd(n, d) !== 1) { n = 8; d = 15; }
          return {
            type: 'choice', answer: 0,
            choices: [fr(n, d)].concat(reds.map((r) => fr(r.n, r.d))),
            prompt: `איזה שבר ${b('אי אפשר')} לצמצם?`,
            hint: `${c.g('חפש', 'חפשי')} לכל שבר מספר ששני חלקיו מתחלקים בו. ${c.g('שים', 'שימי')} לב גם ל-3, ל-5 ול-7 — לא רק ל-2!`,
            solution: reds.map((r) => `${fr(r.n, r.d)}: מתחלקים ב-${r.k}.`).concat([`ל-${n} ול-${d} אין מחלק משותף, ולכן את ${fr(n, d)} אי אפשר לצמצם.`]),
          };
        }
        case 'story': {
          const T = level === 1 ? mkRed(c, [2, 3, 4, 5], [2]) : mkRed(c, [3, 4, 5, 6], [2, 3, 4]);
          return {
            type: 'fraction', accept: 'simplest', answer: { n: T.a, d: T.b },
            prompt: `${splitText(sc, T.d)}. ${p.name} ${V1(p)} ${T.n} ${sc.part}.<br>איזה חלק מ${sc.the} ${p.name} ${V1(p)}? ${c.g('כתוב', 'כתבי')} את התשובה כשבר מצומצם.`,
            hint: `קודם ${c.g('כתוב', 'כתבי')} שבר: ${T.n} מתוך ${T.d}. אחר כך ${c.g('צמצם', 'צמצמי')} עד הסוף.`,
            solution: [`${p.name} ${V1(p)} ${fr(T.n, T.d)} מ${sc.the}.`].concat(fullSteps(T.n, T.d)),
          };
        }
        case 'storyTf': {
          const T = level === 1 ? mkRed(c, [2, 3, 4], [2, 3]) : mkRed(c, [3, 4, 5, 6], [2, 3, 4]);
          const s1 = T.n - T.a;
          const wrongs = [{ n: T.n - s1, d: T.d - s1 }, { n: T.a, d: T.d }, { n: T.a, d: T.b + 1 }].filter((x) => x.d > x.n && x.n * T.d !== T.n * x.d);
          const truth = c.chance(0.5) || !wrongs.length, X = truth ? { n: T.a, d: T.b } : c.pick(wrongs);
          return {
            type: 'tf', answer: truth,
            prompt: `${splitText(sc, T.d)}. ${p.name} ${V1(p)} ${T.n} ${sc.part}.<br>${f.name} ${f.g('אומר', 'אומרת')} ש${p.name} ${V1(p)} ${fr(X.n, X.d)} מ${sc.the}. האם ${f.g('הוא צודק', 'היא צודקת')}?`,
            hint: `${c.g('כתוב', 'כתבי')} את השבר ${T.n} מתוך ${T.d}, ${c.g('צמצם', 'צמצמי')} אותו ו${c.g('השווה', 'השווי')}.`,
            solution: [`${p.name} ${V1(p)} ${fr(T.n, T.d)}.`].concat(reduceSteps(T.n, T.d, T.k).slice(1)).concat([truth ? `${f.name} ${f.g('צודק', 'צודקת')}.` : `${fr(X.n, X.d)} אינו שווה ל-${fr(T.n, T.d)}, ולכן ${f.name} ${f.g('טועה', 'טועה')}.`]),
          };
        }
        case 'storyCmp': {
          const bb = c.pick([3, 4, 5, 6]), x1 = c.rnd(1, bb - 1), x2 = c.chance(0.25) ? x1 : c.rnd(1, bb - 1), [k1, k2] = c.sample([2, 3, 4, 5], 2);
          const n1 = x1 * k1, d1 = bb * k1, n2 = x2 * k2, d2 = bb * k2, ans = x1 > x2 ? 0 : x1 < x2 ? 1 : 2;
          const own = (q) => q.g('שלו', 'שלה');
          const both = p.gender === 'f' && f.gender === 'f' ? 'שתיהן' : 'שניהם';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p.name, f.name, `${both} באותה מידה`],
            prompt: `${p.name} ${V1(p)} ${n1} מתוך ${d1} ${sc.part} ${sc.pf ? 'שוות' : 'שווים'} של ${sc.the} ${own(p)}, ו${f.name} ${V1(f)} ${n2} מתוך ${d2} ${sc.part} של ${sc.the} ${own(f)}. ${sc.pl} של שניהם באותו גודל.<br>מי ${sc.v[0]} חלק גדול יותר?`,
            hint: `${c.g('כתוב', 'כתבי')} לכל אחד שבר, ${c.g('צמצם', 'צמצמי')} את שניהם עד הסוף ו${c.g('השווה', 'השווי')}.`,
            solution: [`${p.name}: ${m(F(n1, d1) + ' = ' + F(x1, bb))}.`, `${f.name}: ${m(F(n2, d2) + ' = ' + F(x2, bb))}.`, ans === 2 ? 'השברים שווים — זה אותו חלק.' : `${m(F(x1, bb) + ` ${SIGNH(SIGN(x1, x2))} ` + F(x2, bb))}, ולכן ${ans === 0 ? p.name : f.name} ${ans === 0 ? V1(p) : V1(f)} חלק גדול יותר.`],
          };
        }
        case 'storyLeft': {
          const T = mkRed(c, [3, 4, 5, 6, 8], [2, 3, 4, 6]);
          const done = T.d - T.n;
          return {
            type: 'fraction', accept: 'simplest', answer: { n: T.a, d: T.b },
            prompt: `${splitText(sc, T.d)}. ${p.name} ${V1(p)} ${done} ${sc.part}.<br>איזה חלק מ${sc.the} ${p.g('נשאר לו', 'נשאר לה')}? ${c.g('כתוב', 'כתבי')} את התשובה כשבר מצומצם.`,
            hint: `קודם ${c.g('חשב', 'חשבי')} כמה ${sc.part} נשארו, ${c.g('כתוב', 'כתבי')} שבר ו${c.g('צמצם', 'צמצמי')} עד הסוף.`,
            solution: [`נשארו ${m(`${T.d} − ${done} = ${T.n}`)} ${sc.part} מתוך ${T.d}: ${fr(T.n, T.d)}.`].concat(fullSteps(T.n, T.d)),
          };
        }
      }
    },
  });

  /* ========== הרחבה וצמצום ========== */
  // שני ישרים זה מתחת לזה (באותו רוחב), לבדיקת שברים שווים
  const twoLines = (d1, v1, d2, v2, labels) => NL({ min: 0, max: 1, den: d1, fracLabels: !!labels, marks: v1 == null ? [] : [{ v: v1 }] }) + NL({ min: 0, max: 1, den: d2, fracLabels: !!labels, marks: v2 == null ? [] : [{ v: v2, cls: 'f-b' }] });
  // a/b מצומצם; d1 = b*k1 (הצורה הנתונה), d2 = b*k2 (היעד), כך ש-d1 לא מחלק את d2
  const mkVia = (c) => {
    let g = 0, bb, a, k1, k2;
    do { bb = c.pick([2, 3, 4, 5]); a = coprime(c, bb); k1 = c.pick([2, 3, 4]); k2 = c.pick([2, 3, 4, 5, 6]); } while ((k2 % k1 === 0 || k1 === k2) && g++ < 50);
    if (k2 % k1 === 0) { k1 = 2; k2 = 3; }
    return { a, b: bb, n1: a * k1, d1: bb * k1, n2: a * k2, d2: bb * k2, k1, k2 };
  };

  HM.lesson({
    id: 'f-expred',
    learn: (c) => [
      {
        title: 'אותה נקודה, שמות שונים',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} על שני הישרים: בעליון כל קטע הוא ${fr(1, 4)}, ובתחתון ${fr(1, 8)}.<br>הנקודה ${fr(1, 4)} בישר העליון נמצאת ${b('בדיוק מעל')} ${fr(2, 8)} בישר התחתון.<br>שברים שנמצאים ${HM.hl('באותה נקודה')} על הישר הם ${b('שברים שווים')}: ${m(F(1, 4) + ' = ' + F(2, 8))}.`,
        visual: twoLines(4, 1 / 4, 8, 2 / 8, true),
      },
      {
        title: 'שני כיוונים',
        html: `${b('הרחבה')}: כופלים את המונה ואת המכנה באותו מספר.<br>${b('צמצום')}: מחלקים את המונה ואת המכנה באותו מספר.<br>${m(F(3, 4) + ' = ' + F(9, 12))}: מ-${fr(3, 4)} ל-${fr(9, 12)} ${b('מרחיבים')} ב-3, ומ-${fr(9, 12)} ל-${fr(3, 4)} ${b('מצמצמים')} ב-3.`,
        visual: V.bars([{ n: 3, d: 4 }, { n: 9, d: 12 }], { labels: [{ n: 3, d: 4 }, { n: 9, d: 12 }] }),
      },
      {
        title: 'שברים שווים על הישר',
        html: `${m(F(2, 3) + ' = ' + F(4, 6))} — שתי הנקודות נמצאות באותו מקום.<br>כשמחלקים כל קטע בישר ל-2 קטעים קטנים, יש פי 2 קטעים (המכנה גדל פי 2), וגם עד הנקודה יש פי 2 קטעים (המונה גדל פי 2) — ${HM.hl('זו בדיוק הרחבה!')}`,
        visual: twoLines(3, 2 / 3, 6, 4 / 6, true),
      },
      {
        title: 'דרך שבר שלישי',
        html: `${c.g('השלם', 'השלימי')}: ${m(F(6, 8) + ' = ' + F(HM.box(), 12))}`,
        steps: [
          `8 לא נכנס ב-12 מספר שלם של פעמים, ולכן קודם מצמצמים: ${m(F(6, 8) + ' = ' + F(3, 4))}.`,
          `עכשיו מרחיבים ב-3: ${m(F(3, 4) + ' = ' + F(9, 12))}.`,
          `${m(F(6, 8) + ' = ' + F(9, 12))} ✔`,
        ],
        visual: V.bars([{ n: 6, d: 8 }, { n: 3, d: 4 }, { n: 9, d: 12 }], { labels: [{ n: 6, d: 8 }, { n: 3, d: 4 }, { n: 9, d: 12 }] }),
      },
      {
        title: 'משווים בעזרת הרחבה',
        html: `מה גדול יותר: ${fr(2, 3)} או ${fr(7, 12)}?<br>מרחיבים את ${fr(2, 3)} למכנה 12: ${m(F(2, 3) + ' = ' + F(8, 12))}.<br>${m(F(8, 12) + ' &gt; ' + F(7, 12))}, ולכן ${m(F(2, 3) + ' &gt; ' + F(7, 12))}.`,
        visual: NL({ min: 0, max: 1, den: 12, marks: [{ v: 7 / 12, cls: 'f-b' }, { v: 8 / 12, label: { n: 2, d: 3 } }] }),
      },
      {
        title: 'בדיקה קצרה',
        html: `${c.name}, הישר מחולק לעשיריות. איפה נמצא ${fr(3, 5)}?`,
        quiz: {
          type: 'numberline', line: { min: 0, max: 1, den: 10 }, answer: 0.6,
          prompt: `${c.g('סמן', 'סמני')} על הישר את ${fr(3, 5)}.`,
          hint: `כמה עשיריות יש בחמישית אחת?`,
          solution: [`${m(F(3, 5) + ' = ' + F(6, 10))}`, 'סופרים 6 קטעים מ-0.'],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['nlTapEq', 'nlReadEq', 'chainSlot', 'tfLine', 'expOrRed', 'story', 'story', 'storyLine']
        : level === 2 ? ['chainSlot', 'via', 'nlTapEq', 'nlReadEq', 'oddOne', 'cmp', 'story', 'storyLine', 'storyReduce', 'storyReduce']
        : ['via', 'nlTapEq', 'order', 'oddOne', 'missingBoth', 'cmp', 'storyReduce', 'storyReduce', 'storyLine', 'storyCmp'];
      const kind = c.pick(kinds);
      const cmpPrompt = `${c.g('השלם', 'השלימי')} את הסימן המתאים: &gt;, &lt; או =`;
      const bb = level === 1 ? c.pick([2, 3, 4]) : c.pick([2, 3, 4, 5, 6]), a = coprime(c, bb);
      const k = level === 1 ? c.pick([2, 3]) : c.pick(level === 2 ? [2, 3, 4] : [2, 3, 4, 6].filter((x) => bb * x <= 24));
      const D = Math.min(bb * k, level === 3 ? 24 : 12) === bb * k ? bb * k : bb * 2;
      const K = D / bb;
      switch (kind) {
        case 'nlTapEq': {
          const dd = level === 3 ? c.pick([8, 10, 12]) : D;
          const bs = HM.divisors(dd).filter((x) => x > 1 && x < dd), b2 = level === 3 ? c.pick(bs) : bb, a2 = level === 3 ? coprime(c, b2) : a, KK = dd / b2;
          return {
            type: 'numberline', line: { min: 0, max: 1, den: dd }, answer: a2 / b2,
            prompt: `${c.g('סמן', 'סמני')} על הישר את ${fr(a2, b2)}. ${c.g('שים', 'שימי')} לב לגודל הקטעים!`,
            hint: `הישר מחולק ל-${dd} קטעים. ${c.g('הרחב', 'הרחיבי')} את ${fr(a2, b2)} לשבר שהמכנה שלו ${dd}.`,
            solution: [`${m(F(a2, b2) + ' = ' + F(a2 * KK, dd))} (הרחבה ב-${KK}).`, `סופרים ${a2 * KK} קטעים מ-0.`],
          };
        }
        case 'nlReadEq': {
          const x = a * K;
          return {
            type: 'fraction', accept: 'simplest', answer: { n: a, d: bb },
            prompt: `איזה שבר מסומן על הישר? ${c.g('כתוב', 'כתבי')} אותו כשבר מצומצם.`,
            visual: NL({ min: 0, max: 1, den: D, marks: [{ v: x / D }] }),
            hint: `קודם ${c.g('קרא', 'קראי')} את השבר לפי הקטעים (מתוך ${D}), ואחר כך ${c.g('צמצם', 'צמצמי')}.`,
            solution: [`הנקודה היא ${fr(x, D)}.`, `${m(F(x, D) + ' = ' + F(a, bb))} (צמצום ב-${K}).`],
          };
        }
        case 'chainSlot': {
          const [k1, k2] = c.sample(level === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6], 2).sort((x, y) => x - y);
          return {
            type: 'number', answer: [a * k1, a * k2],
            prompt: `${c.g('השלם', 'השלימי')} את השברים השווים:<br>${m(F(a, bb) + ' = ' + F(HM.slot(0), bb * k1) + ' = ' + F(HM.slot(1), bb * k2))}`,
            hint: 'בכל שבר: פי כמה גדל המכנה? המונה גדל פי אותו מספר.',
            solution: [`${m(F(a, bb) + ' = ' + F(a * k1, bb * k1))} (הרחבה ב-${k1}).`, `${m(F(a, bb) + ' = ' + F(a * k2, bb * k2))} (הרחבה ב-${k2}).`],
          };
        }
        case 'missingBoth': {
          const T = mkVia(c), k3 = c.pick([2, 3, 5, 6].filter((x) => x !== T.k1 && x !== T.k2));
          return {
            type: 'number', answer: [T.n2, T.b * k3],
            prompt: `${c.g('השלם', 'השלימי')} את השברים השווים:<br>${m(F(T.n1, T.d1) + ' = ' + F(HM.slot(0), T.d2) + ' = ' + F(T.a * k3, HM.slot(1)))}`,
            hint: `קודם ${c.g('צמצם', 'צמצמי')} את ${fr(T.n1, T.d1)} עד הסוף, ואחר כך ${c.g('הרחב', 'הרחיבי')}.`,
            solution: [`${m(F(T.n1, T.d1) + ' = ' + F(T.a, T.b))}`, `${m(F(T.a, T.b) + ' = ' + F(T.n2, T.d2))}`, `${m(F(T.a, T.b) + ' = ' + F(T.a * k3, T.b * k3))}`],
          };
        }
        case 'tfLine': {
          const truth = c.chance(0.5);
          let y = a * K;
          if (!truth) y = y + (y > 1 && c.chance(0.5) ? -1 : 1);
          if (y >= D) y = a * K - 1;
          const ok = y === a * K;
          return {
            type: 'tf', answer: ok,
            prompt: `${m(F(a, bb) + ' = ' + F(y, D))}<br>(${c.g('היעזר', 'היעזרי')} בשני הישרים.)`,
            visual: twoLines(bb, a / bb, D, y / D),
            hint: 'שברים שווים נמצאים באותה נקודה על הישר. האם הנקודות נמצאות זו מעל זו?',
            solution: [`${m(F(a, bb) + ' = ' + F(a * K, D))} (הרחבה ב-${K}).`, ok ? 'הנקודות באותו מקום — הטענה נכונה.' : `${fr(y, D)} נמצא במקום אחר, ולכן הטענה לא נכונה.`],
          };
        }
        case 'expOrRed': {
          const expand = c.chance(0.5), L = expand ? F(a, bb) : F(a * K, D), R = expand ? F(a * K, D) : F(a, bb);
          const ch = [`${expand ? 'הרחבה' : 'צמצום'} ב-${K}`, `${expand ? 'צמצום' : 'הרחבה'} ב-${K}`, `${expand ? 'הרחבה' : 'צמצום'} ב-${K + 1}`, `${expand ? 'הרחבה' : 'צמצום'} ב-${D - bb}`];
          return {
            type: 'choice', answer: 0, choices: ch.filter((x, i) => ch.indexOf(x) === i),
            prompt: `${m(L + ' = ' + R)}<br>מה עשו לשבר הראשון כדי לקבל את השבר השני?`,
            hint: 'המספרים גדלו או קטנו? פי כמה?',
            solution: [expand ? `המונה והמכנה גדלו פי ${K}: ${m(`${bb} × ${K} = ${D}`)}.` : `המונה והמכנה קטנו פי ${K}: ${m(`${D} : ${K} = ${bb}`)}.`, `${expand ? 'זו הרחבה' : 'זה צמצום'} ב-${K}.`],
          };
        }
        case 'via': {
          const T = mkVia(c);
          return {
            type: 'fraction', accept: 'exact', answer: { n: T.n2, d: T.d2 },
            prompt: `${c.g('כתוב', 'כתבי')} את ${fr(T.n1, T.d1)} כשבר שהמכנה שלו ${T.d2}.`,
            hint: `${T.d1} לא נכנס ב-${T.d2} מספר שלם של פעמים. קודם ${c.g('צמצם', 'צמצמי')}, ואחר כך ${c.g('הרחב', 'הרחיבי')}.`,
            solution: [`צמצום ב-${T.k1}: ${m(F(T.n1, T.d1) + ' = ' + F(T.a, T.b))}.`, `הרחבה ב-${T.k2}: ${m(F(T.a, T.b) + ' = ' + F(T.n2, T.d2))}.`],
          };
        }
        case 'oddOne': {
          const ks = c.sample(level === 3 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4], 3), add = c.rnd(1, 3);
          const wrong = { n: a * ks[1] + add, d: bb * ks[1] + add };
          return {
            type: 'choice', answer: 0,
            choices: [fr(wrong.n, wrong.d)].concat(ks.map((x) => fr(a * x, bb * x))),
            prompt: 'איזה שבר אינו שווה לשלושת האחרים?',
            hint: `${c.g('צמצם', 'צמצמי')} כל שבר עד הסוף ו${c.g('השווה', 'השווי')}.`,
            solution: [`${ks.map((x) => fr(a * x, bb * x)).join(', ')} — כולם שווים ל-${fr(a, bb)}.`, `${fr(wrong.n, wrong.d)} אינו שווה להם.`],
          };
        }
        case 'cmp': {
          const b1 = c.pick([2, 3, 4, 5, 6]), kk = c.pick([2, 3, 4].filter((x) => b1 * x <= 24)), b2 = b1 * kk, a1 = c.rnd(1, b1 - 1);
          const a2 = Math.min(b2 - 1, Math.max(1, a1 * kk + c.pick([-2, -1, 0, 1, 2]))), flip = c.chance(0.5);
          const lv = flip ? a2 / b2 : a1 / b1, rv = flip ? a1 / b1 : a2 / b2, sg = SIGN(lv, rv);
          return {
            type: 'compare', prompt: cmpPrompt, left: flip ? F(a2, b2) : F(a1, b1), right: flip ? F(a1, b1) : F(a2, b2), lv, rv, answer: sg,
            hint: `${c.g('הרחב', 'הרחיבי')} את ${fr(a1, b1)} למכנה ${b2}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: [`${m(F(a1, b1) + ' = ' + F(a1 * kk, b2))}`, `${m((flip ? F(a2, b2) : F(a1 * kk, b2)) + ` ${SIGNH(sg)} ` + (flip ? F(a1 * kk, b2) : F(a2, b2)))}`],
          };
        }
        case 'order': {
          const DD = c.pick([12, 24]), xs = c.sample(HM.range(1, DD - 1), 4);
          const items = xs.map((x) => { const r = redF(x, DD); return r.d === DD || c.chance(0.7) ? F(r.n, r.d) : F(x, DD); });
          const sorted = xs.map((x, i) => i).sort((i, j) => xs[i] - xs[j]);
          return {
            type: 'order', items: items.map(m), answer: sorted,
            prompt: `${c.g('סדר', 'סדרי')} את השברים ${b('מהקטן לגדול')}:`,
            hint: `${c.g('הרחב', 'הרחיבי')} את כל השברים למכנה ${DD}, ואז ${c.g('השווה', 'השווי')} את המונים.`,
            solution: [xs.map((x, i) => m(items[i] + (items[i] === F(x, DD) ? '' : ' = ' + F(x, DD)))).join(' , '), sorted.map((i) => m(items[i])).join(' , ')],
          };
        }
        case 'story':
        case 'storyCmp': {
          const sc = c.scene(SPLIT), p = c.me, f = c.friend(), V1 = (q) => q.g(sc.v[0], sc.v[1]), own = (q) => q.g('שלו', 'שלה');
          let x1, y1, x2, y2;
          if (kind === 'story') { y1 = bb; x1 = a; y2 = D; x2 = c.chance(0.5) ? a * K : Math.max(1, Math.min(D - 1, a * K + c.pick([-1, 1]))); }
          else { const ds = c.sample([2, 3, 4, 6], 2); y1 = ds[0]; y2 = ds[1]; x1 = coprime(c, y1); x2 = coprime(c, y2); }
          if (c.chance(0.5)) [x1, y1, x2, y2] = [x2, y2, x1, y1];
          const v1 = x1 / y1, v2 = x2 / y2, ans = Math.abs(v1 - v2) < 1e-9 ? 2 : v1 > v2 ? 0 : 1;
          const L = HM.lcm(y1, y2), both = p.gender === 'f' && f.gender === 'f' ? 'שתיהן' : 'שניהם';
          return {
            type: 'choice', keep: true, answer: ans,
            choices: [p.name, f.name, `${both} באותה מידה`],
            prompt: `${p.name} ${V1(p)} ${fr(x1, y1)} מ${sc.the} ${own(p)}, ו${f.name} ${V1(f)} ${fr(x2, y2)} מ${sc.the} ${own(f)}. ${sc.pl} של שניהם באותו גודל.<br>מי ${sc.v[0]} יותר?`,
            hint: `${c.g('כתוב', 'כתבי')} את שני השברים עם אותו מכנה (${L}) — כמו על ישר שמחולק ל-${L} קטעים.`,
            solution: [[[x1, y1], [x2, y2]].map(([x, y]) => (y === L ? m(F(x, y)) : m(F(x, y) + ' = ' + F(x * L / y, L)))).join(' , '), ans === 2 ? 'השברים שווים — זו אותה כמות.' : `${m(F(x1 * L / y1, L) + ` ${SIGNH(SIGN(v1, v2))} ` + F(x2 * L / y2, L))}, ולכן ${ans === 0 ? p.name + ' ' + V1(p) : f.name + ' ' + V1(f)} יותר.`],
          };
        }
        case 'storyReduce': {
          const sc = c.scene(SPLIT), p = c.me, f = c.friend(), V1 = (q) => q.g(sc.v[0], sc.v[1]), own = (q) => q.g('שלו', 'שלה'), T = mkVia(c);
          return {
            type: 'number', answer: T.n2,
            prompt: `${p.name} ${V1(p)} ${T.n1} מתוך ${T.d1} ${sc.part} של ${sc.the} ${own(p)}. ${f.name} ${V1(f)} אותו חלק מ${sc.the} ${own(f)}, ${sc.wf ? 'שמחולקת' : 'שמחולק'} ל-${T.d2} ${sc.part} ${sc.pf ? 'שוות' : 'שווים'}.<br>כמה ${sc.part} ${V1(f)} ${f.name}?`,
            hint: `${p.name} ${V1(p)} ${fr(T.n1, T.d1)}. ${c.g('צמצם', 'צמצמי')} את השבר עד הסוף, ואחר כך ${c.g('הרחב', 'הרחיבי')} למכנה ${T.d2}.`,
            solution: [`${m(F(T.n1, T.d1) + ' = ' + F(T.a, T.b))} (צמצום ב-${T.k1}).`, `${m(F(T.a, T.b) + ' = ' + F(T.n2, T.d2))} (הרחבה ב-${T.k2}).`, `${f.name} ${V1(f)} ${T.n2} ${sc.part}.`],
          };
        }
        case 'storyLine': {
          const sc = c.scene(TRACKS.filter((t) => !t.stop)), p = c.chance(0.6) ? c.me : c.friend();
          const S1 = trackSubj(sc, p), verb = S1.g(sc.v[0], sc.v[1]), stop = S1.g('עצר', 'עצרה');
          const dd = level === 3 ? c.pick([8, 9, 10, 12]) : D, bs = HM.divisors(dd).filter((x) => x > 1 && x < dd), b2 = level === 3 ? c.pick(bs) : bb, a2 = level === 3 ? coprime(c, b2) : a, KK = dd / b2;
          return {
            type: 'number', answer: a2 * KK,
            prompt: `לאורך ${sc.the} יש שלטים במרחקים שווים: שלט אחרי כל ${fr(1, dd)} מ${sc.the}. ${S1.name} ${verb} ${fr(a2, b2)} מ${sc.the} ו${stop} ליד שלט.<br>ליד איזה שלט ${S1.g('הוא', 'היא')} ${stop}? (השלט הראשון הוא 1.)`,
            visual: NL({ min: 0, max: 1, den: dd }),
            hint: `${c.g('הרחב', 'הרחיבי')} את ${fr(a2, b2)} לשבר שהמכנה שלו ${dd}. המונה הוא מספר השלט.`,
            solution: [`${m(F(a2, b2) + ' = ' + F(a2 * KK, dd))} (הרחבה ב-${KK}).`, `${S1.name} ${stop} ליד השלט ה-${a2 * KK}.`],
          };
        }
      }
    },
  });
})(HM);
