# חשבוניה: content-writing spec

"חשבוניה" is a Hebrew (RTL) math practice web app for Israeli 5th graders (ages 10–11), following the yearly plan of the ה.ש.ב.ח.ה textbook series plus a few extra topics from the Ministry of Education curriculum. Every child creates a profile with **name, gender (m/f) and interests**. Every sentence addressed to the child must be in the correct grammatical gender. Word problems star the child, their friends, and their interests.

You write **content files**. Each one registers lessons. A lesson is a set of explanation cards (`learn`) and a procedural question generator (`gen`). The app (engine and UI) renders them. You don't touch the engine.

**Reference implementation: read `js/content/fractions-a.js` (lesson `f-part`) before writing anything.** It shows every pattern below. Copy its structure and its quality bar.

---

## 1. Files and rules

- Core (read-only for you): `js/util.js`, `js/viz.js`, `js/curriculum.js`, `tests/*`. **Do not edit them.** If you need a helper, define it locally inside your file's IIFE. If you find a bug in core, work around it and report it in your final message.
- Your file wraps everything in an IIFE:
  ```js
  (function (HM) {
    'use strict';
    const V = HM.viz, S = HM.svg;
    const { frac: F, m, b } = HM;
    HM.lesson({ id: '...', learn: (c) => [...], gen: (c, level) => ({...}) });
  })(HM);
  ```
- **No DOM access** (`document` and `window` are not available in tests). Content returns only strings and objects.
- Lesson ids and titles come from `js/curriculum.js`. Read it for each lesson's `skills` list. Your lesson must teach and practice **every** skill in that list, plus the extra notes in §8.
- Plain modern JS (ES2020). No imports, no libraries.

## 2. Lesson definition

```js
HM.lesson({
  id: 'f-part',                      // must match curriculum.js
  learn: (c) => [card, card, ...],   // 4–7 cards
  gen: (c, level) => question,       // level = 1 | 2 | 3
});
```

### Learn cards
```js
{ title: 'מונה ומכנה',          // short heading
  html: '...',                  // ≤ ~60 words. Use <br>, • bullets, b() for key terms, HM.hl() for a highlight
  visual: V.bar(3, 5),          // optional SVG/HTML illustration (strongly encouraged on most cards)
  steps: ['...', '...'],        // optional: a worked example revealed one step at a time (use on ≥1 card)
  quiz: question,               // optional: a quick check question (type number/choice/tf/compare/fraction)
}
```
- Card 1 hooks with something relatable (a story, a picture). Use the child's name in 1–2 cards (`c.name`), not in every card.
- Teach with pictures: bars, number lines, place-value tables, shapes. Explain **why**, not only how.
- Include at least one worked example (`steps`), and ideally one `quiz` card.
- Explain like a great teacher to a 10-year-old: short sentences, concrete examples, a friendly tone. Name the terms the textbook uses (מונה, מכנה, מחובר, מחסר, מחוסר, הפרש, מכפלה, גורם, מנה, מחולק, מחלק, שארית, …).

### Question object (returned by `gen`)
Common fields:
- `type`: one of `number | choice | fraction | compare | order | numberline | shade | tf`
- `prompt` (HTML, required): the question. ≤ ~40 words.
- `visual` (HTML, optional): an illustration shown under the prompt.
- `hint` (HTML, **required**): shown after the first wrong attempt. Guide; don't reveal the answer.
- `solution` (array of HTML steps, **required**): shown after the second wrong attempt, and on request. Short, clear, 1–4 steps ending with the answer.

Per type:
| type | fields | UI |
|---|---|---|
| `number` | `answer: number` (or `number[]` for several fields), `unit?: 'ס"מ'`, `decimal?: true` (enables "." on the keypad; set it whenever the answer may be non-integer), `labels?: ['מנה','שארית']` (required for several fields **unless** the prompt has slots) | On-screen keypad. If the prompt contains `HM.slot(0)` (and `HM.slot(1)` …), the typed value appears **inside the expression**. Otherwise a big input box. Several fields → `answer` array in slot order. |
| `choice` | `choices: [html,...]` (2–6, all different), `answer: index`, `keep?: true` (don't shuffle; e.g. ordered options), `cols?: 2` (grid; use for pictures) | The engine shuffles unless `keep`. Choices may be SVG. **Distractors must be plausible typical mistakes** (e.g. adding numerators and denominators, forgetting to regroup, place-value slips), not random numbers. |
| `fraction` | `answer: {n,d}` or `{w,n,d}` (mixed), `mixed?: true` (shows a whole-number box), `accept?: 'equal'\|'exact'\|'simplest'` | `equal` (default) accepts any equivalent value. `exact` needs the same n/d. `simplest` needs the fully reduced form (then `answer` must be reduced). For mixed answers use `mixed:true` and `answer:{w,n,d}` with `n<d`. Under `equal` an improper fraction with the same value is also accepted. |
| `compare` | `left`, `right` (HTML; shown LTR), `answer: '<'\|'>'\|'='`, `lv`, `rv` (numeric values; include them whenever possible, the tests check them) | Three big buttons between the two sides. |
| `order` | `items: [html,...]` (3–6, all different), `answer: [indices in the correct order]` | The child taps items into numbered slots. The prompt must say the direction ("מהקטן לגדול"). |
| `numberline` | `line: {min, max, den?\|step?, every?, fracLabels?, labels?(v,i)}`, `answer: value` (must lie on a tick) | The child taps a tick. ≤ 40 ticks. Use `den` for fraction lines (ticks at 1/den). Labels are whole numbers by default; don't label the answer tick. |
| `shade` | `shape: 'bar'\|'pie'\|'grid'`, `parts` (bar/pie), `rows`/`cols` (grid, default 10×10), `answer: count` | The child taps or drags to shade any `count` parts. |
| `tf` | `answer: true\|false` | Buttons נכון / לא נכון. The prompt is a statement. |

### Levels (the app moves the child between them adaptively)
The engine keeps a difficulty position per topic. About 3 correct answers in a row move up a level, and a mistake moves down. The topic's mastery meter can only be filled to 45% with level-1 questions and to 75% with level 2. **Reaching the 80% mastery target requires succeeding at level 3.** So the levels must form a real, gradual ladder:
- **Level 1:** the core skill, small friendly numbers, lots of visuals, one-step stories.
- **Level 2:** standard textbook difficulty, typical textbook word problems.
- **Level 3:** challenge: multi-step, reasoning ("why"), traps, bigger numbers, inverse questions.

### Word problems (שאלות מילוליות): required
Every lesson includes word problems at **all three levels**, roughly 35–45% of generated questions. Example of the expected style (f-quantity): "כמה זה ⁵⁄₇ מתוך 70?" both as a bare exercise and inside a story, with a solution that shows the steps (70 : 7 = 10 → 10 × 5 = 50).

Each lesson's `gen` must mix **≥ 5 different question kinds** across levels, and use **≥ 3 question types**. Prefer interactive types (`shade`, `numberline`, `order`, `compare`) where they fit the skill. Use `number` with slots for "missing number" questions. Every generated question must be **correct and unambiguous**, with exactly one right answer. Guard against degenerate random values (0, 1, equal numbers, negative results, non-integer results where an integer is expected).

## 3. The context `c` (personalization)

```
c.name            child's name ('מאיה')
c.gender          'm' | 'f'
c.g(m, f)         pick the word form for the child's gender: c.g('בחר','בחרי'), c.g('אתה יכול','את יכולה')
c.me              the child as a story character {name, gender, g(m,f)}
c.friend()        random friend {name, gender, g(m,f)}; c.friendM(), c.friendF(); c.buddy() = same gender as the child
c.scene(list)     pick a scenario object, preferring ones whose tags match the child's interests (75%)
c.interests       ids: sport, animals, space, music, baking, games, art, nature, reading, tech, kpop, magic, squishy
c.rnd(a,b) c.pick(arr) c.shuffle(arr) c.sample(arr,k) c.chance(p) c.range(a,b,step)
c.m c.frac c.mixed c.slot c.box c.fmt c.dec c.b c.hl c.seq c.cnt   (same as HM.*)
```

**Word problems:** build scenario lists with `tags` from the interest ids, and give **every interest at least one scenario across the lesson** where it fits naturally.

Three interests were added later. Write them in the kids' own vocabulary:
- `kpop`: a K-pop band, concert tickets, photocards (פוטוקארדים) to collect and trade, albums, light sticks, learning a dance, fan-club members. Don't name real bands.
- `magic`: Harry Potter and magic. A school for wizards, potions class (measuring ingredients), wands, mail owls, flying brooms, spell books, houses competing for points. You may say "כמו בהארי פוטר" occasionally, but use original characters (the child and friends), not the book's characters.
- `squishy`: squishies (סקווישים). Collecting, trading with friends, prices in ₪, shelves and boxes, squishies shaped like food or animals, how long one takes to rise back. The child or a friend is the protagonist. Verbs and adjectives agree with the character: `${f.name} ${f.g('קנה','קנתה')}`.

## 4. Hebrew language rules (critical; the app is judged on this)

1. **Gender agreement everywhere.**
   - Imperatives addressed to the child always go through `c.g`: חשב/חשבי, מצא/מצאי, כתוב/כתבי, בחר/בחרי, סמן/סמני, סדר/סדרי, השלם/השלימי, צבע/צבעי, ספור/ספרי, גע/געי, נסה/נסי, הסתכל/הסתכלי, שים לב/שימי לב, זכור/זכרי, דמיין/דמייני, בדוק/בדקי, חבר/חברי, חסר/חסרי, עגל/עגלי, הקף/הקיפי, לחץ/לחצי, גרור/גררי.
   - Present tense: אתה יודע/את יודעת, אתה יכול/את יכולה.
   - **Never** write slash forms like "בחר/י" or "תלמיד/ה".
   - **Nouns have gender too:** "העוגה מחולקת", "הפס מחולק", "משימות שוות", "חלקים שווים", "שורה אחת", "קטע אחד".
2. **Counting nouns:** use digits for quantities ("3 כדורים"). For exactly 1 use `HM.cnt(n,'כדור','כדורים')` → "כדור אחד" (`fem=true` for feminine nouns → "משימה אחת"). Never "1 קטעים".
3. **Construct state (סמיכות):** "מסלול הריצה", not "המסלול ריצה". "ספר הקריאה של נועה". Write the full definite phrase in the scenario data.
4. Natural, warm, correct Hebrew. No translation-ese. Short sentences. Proofread every template with the sample tool (§7) **for both genders**.
5. Use the textbook's mathematical terms (חיבור, מחובר, סכום, חיסור, מחוסר, מחסר, הפרש, כפל, גורם, מכפלה, חילוק, מחולק, מחלק, מנה, שארית, מונה, מכנה, מספר מעורב, הרחבה, צמצום, מכנה משותף, עשירית, מאית, אלפית, מקבילית, מעוין, אלכסון, גובה, היקף, שטח, …).

## 5. Math notation (Israeli conventions)

- Multiplication `×` (`HM.op.times`), division `:` (`HM.op.div`), minus `−` (`HM.op.minus`), plus `+`.
- Decimal point `.`. Thousands separator `,` → always format numbers ≥ 1000 with `HM.fmt(n)` (e.g. 125,000).
- **Expressions inside Hebrew text must be wrapped in `m()`** so they render left-to-right: ``m(`${a} + ${b} = ` + HM.slot(0))``. Fractions inside expressions: `m(F(3,4) + ' + ' + F(1,4))`. Don't put Hebrew words inside `m()`.
- In HTML strings, write `<` and `>` as `&lt;` and `&gt;`.
- **Sequences of numbers** in Hebrew read right-to-left (the first item is rightmost): use `HM.seq([3, 6, 9, null])` (null → "?") and **don't** wrap them in `m()`. A slot inside a sequence is fine: `HM.seq([3, 6, HM.slot(0)])`.
- Number lines, place-value tables and column arithmetic are LTR (`V.*` handles this).
- **Floating point:** never compute decimals with float arithmetic and print the result. Work in integer units (tenths, hundredths, thousandths) and format with `HM.dec(intValue, places)` → `HM.dec(125,2)` = "1.25". Answers may be floats (the engine compares with tolerance), but build them as `HM.round(x)`.
- Units: ס"מ, מ"מ, מ', ק"מ, סמ"ר, מ"ר, דונם, ק"ג, גרם, ₪, מעלות (°).
- **Degrees inside Hebrew text:** always use `HM.deg(90)` (or `c.deg`). A bare "90°" in RTL text displays as "°90".

## 6. Visuals API (`HM.viz` = `V`, primitives `HM.svg` = `S`)

All return HTML/SVG strings that are theme-colored through CSS classes.
- **Fills:** `f-a` (primary), `f-b` (secondary), `f-c` (accent/highlight), `f-l` (light tint), `f-w` (white), `f-g` (green), `f-r` (red), `f-y` (yellow), `f-ink`.
- **Strokes:** `s-ink`, `s-a`, `s-b`, `s-c`, `s-soft`, `s-grid`, `s-white`.
- **Text:** `t-ink`, `t-a`, `t-b`, `t-c`, `t-mute`, `t-on` (on dark fill).
- Pass classes via `{cls:'f-a s-ink', sw:2}` in `S.*` options. `sw` = stroke-width, `dash` = stroke-dasharray, `fs` = font-size, `fw` = font-weight, `anchor` = text-anchor.

Builders:
- `V.bar(n, d, {unitLabels, shaded:[idx], fill, label, maxw})`: fraction bar (parts go right-to-left).
- `V.bars([{n,d,fill},...], {labels:[{n,d}|'text']})`: stacked bars for comparing.
- `V.pie(n, d, {r, shaded})`: fraction circle.
- `V.grid(k, {rows, cols, cell, shaded})`: 10×10 grid (hundredths/percent) or any rows×cols.
- `V.numberLine({min, max, den|step, every, fracLabels, labels:(v,i)=>string|{n,d}|null, marks:[{v,label,cls}], jumps:[{from,to,label}], w})`.
- `V.placeValue(num, {hide:[placeIdx], hl:[placeIdx], minPlaces})`: Israeli place-value table (0 = יחידות).
- `V.decTable('12.305', {hide:[i], hl:[i], places})`: integer and decimal places table.
- `V.column(['12.5','3.75'], '+', {result:'16.25'|null, carry:[...], zeros:true})`: vertical (column) arithmetic aligned on the decimal point. `result:null` shows empty boxes.
- `V.table(headers, rows, {rowHead})`: generic RTL table (frequency tables, function tables).
- `V.barChart({labels, values, title, hl:[i], line: meanValue, lineLabel, max, step, w, h})`: bar chart (categories right-to-left).
- `V.dots(rows, cols, {hl})`, `V.groups(count, size)`, `V.tokens(n, 'circle'|'square'|'star', {perRow, hl})`.
- `V.magic(cells2D)`: magic square / number grid (null → "?").
- `V.pattern(stepsCounts, 'square'|'stairs'|'line'|'L', {labels})`: growing shape sequences.
- Geometry: `V.polygon(points, {fill, labels:['א','ב','ג','ד'], sides:['5 ס"מ',...], ticks:[k per side], arrows:[k per side], right:[vertexIdx], arcs:[{i,label,cls,fill,r}], diags:true|[[i,j]], heights:[{from, to:[i,j], label}], mirrors:[[[x1,y1],[x2,y2]]], grid: unitPx, extra: svgString, scale, maxw, sideCls:[cls per side]})`
  - Point presets `V.shapes.*`: `square(a)`, `rect(w,h)`, `parallelogram(base,h,offset)`, `rhombus(a,deg)` (acute angles at vertices 1 and 3), `rhombusUp(dw,dh)`, `trapezoid(bottom,top,h,offset)`, `kite(w,hTop,hBot)`, `triangle('right'|'obtuse'|'acute'|'equilateral'|'isosceles'|'scalene', size)`, `regular(n, r, rotDeg)`, `rotate(pts, deg)`. Coordinates are SVG (y points down), roughly 100–260px.
- `V.angle(deg, {rot, label, len})`: a single angle.
- `V.onGrid(polygonsInGridUnits, {w, h, cell, extra:(cell,off)=>svg})`: shapes on squared paper (area/perimeter by counting).
- `V.tiling('square'|'triangle'|'hexagon'|'brick'|'rhombus'|'octagon', {w,h,size})`.
- Primitives: `S.svg(w,h,inner,{label,maxw,viewBox})`, `S.rect`, `S.circle`, `S.line`, `S.path`, `S.poly`, `S.polyline`, `S.text(x,y,txt,{fs,fw,cls,anchor})`, `S.frac(x,y,n,d,{fs})`, `S.g`.
- HTML helpers: `<div class="note">…</div>` (tip callout), `<div class="big">…</div>` (large centered math line), `<div class="row">…</div>` (visuals side by side).
- Keep visuals ≤ ~360px wide for phones (`maxw`). Hebrew text inside SVG works (`S.text`).

## 7. Testing (mandatory before you finish)

```bash
tests/run.sh js/content/<your-file>.js          # validates every lesson: structure, answers, variety, both genders
tests/sample.sh js/content/<your-file>.js <id> 6 # prints cards and sample questions as plain text, for both genders
```
- `run.sh` must report **✓ for every lesson and 0 errors**.
- Use `sample.sh` on **every** lesson and read the output critically: Hebrew grammar (gender, construct state, singular/plural), math correctness, hint/solution quality, no giveaway in the prompt. Fix and re-run.
- jsc paths: the scripts handle the Hebrew path. Always run them from the project root.

## 8. Extra curriculum notes (from the Ministry of Education grade-5 curriculum; include them)

- `n-div2`: also estimate the **number of digits in the quotient**.
- `n-word-a`, `n-word-b`: include **multi-step integrative** problems and **estimating quantities**. Include open questions with one checkable answer (e.g. "which option is possible?").
- `n-divis` (extra lesson): review of divisibility rules for 2, 5, 10, 3, 9 and 6. Use them to decide whether a division leaves a remainder.
- `data-freq`: include relative frequency as a fraction/percent of the whole group.
- `data-double` (extra lesson): **double bar charts** (two groups per category; draw them yourself with `S.*` or adapt `V.barChart`), comparing two groups, and **critical reading** (e.g. a chart whose axis doesn't start at 0, a wrong conclusion).
- `data-mean*`: the mean as levelling the bars (show it on a bar chart with `line:`), estimating a mean, **building a data set with a given mean**, finding a missing value from the mean.
- `f-common`: compare against the benchmarks ½ and 1, find a fraction **between** two fractions.
- `f-addsub-a/b`, `f-mixed-*`: estimate whether a sum is more or less than 1 (or ½).
- `f-times` (extra lesson): whole × fraction as repeated addition (`3 × ⅖ = ⅖+⅖+⅖ = 6/5 = 1⅕`), word problems.
- Decimals lessons: **expanded form** (`1.35 = 1 + 3/10 + 5/100`), the effect of zero digits (0.5 = 0.50; 5.05 ≠ 5.5), "place the decimal point", fraction→decimal by expanding (`3/8 = 375/1000 = 0.375`), checking subtraction by addition, **estimating** sums and differences.
- `g-angles`: also **measuring angles in degrees** with the benchmarks 30°/45°/60°/90°/180°, and the angle types acute, right, obtuse, straight.
- `g-compass` (extra lesson): compass rose (צפון, דרום, מזרח, מערב, plus צפון-מזרח and the other secondary directions), the angle between directions (90° between main directions, 45° to a secondary one), turning right/left by an angle. Draw the rose with `S.*`. Remember: on a map north is up and **east is to the right**.
- `g-regular`: include splitting a polygon into triangles from one vertex (n−2 triangles).
- Area lessons: **inverse problems** (find a side or height from the area), the effect of doubling sides on area, shapes with a given area on a grid, **perimeter vs. area** misconceptions.

## 9. Quality checklist (per lesson)
- [ ] 4–7 learn cards, visuals on most, ≥1 worked example with `steps`, warm gendered Hebrew, uses the child's name once or twice.
- [ ] `gen` covers all the lesson's skills, ≥5 question kinds, ≥3 types, real difficulty progression across levels 1→3.
- [ ] Every question has `hint` and `solution`. Distractors are realistic mistakes.
- [ ] Word problems use `c.scene` with interest tags, the child or friends as characters, and correct gender agreement.
- [ ] `tests/run.sh` passes and `tests/sample.sh` output was proofread for both genders.
