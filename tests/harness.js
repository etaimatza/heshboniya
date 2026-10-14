/* בדיקות ללא דפדפן ל-jsc:
   tests/run.sh [content-file ...]   (ברירת מחדל: כל js/content/*.js)
   בודק כל שיעור: learn לשני המגדרים, ו-gen ×N לכל רמה — מבנה השאלה, תשובה תקינה, מגוון. */
var window = this;
var console = { log: print, warn: function (m) { print('WARN: ' + m); }, error: function (m) { print('ERROR: ' + m); } };
var args = arguments;
var ROOT = args[0];
var ITER = 160;
load(ROOT + '/js/util.js');
load(ROOT + '/js/viz.js');
load(ROOT + '/js/curriculum.js');
var files = [];
for (var i = 1; i < args.length; i++) files.push(args[i]);
files.forEach(function (f) {
  try { load(f); } catch (e) { print('✗ טעינת קובץ נכשלה: ' + f + '\n   ' + e + (e.line ? ' (שורה ' + e.line + ')' : '')); }
});

var TYPES = ['number', 'choice', 'fraction', 'compare', 'order', 'numberline', 'shade', 'tf'];
var BAD = /undefined|NaN|\[object |Infinity|function \(|=>/;
var totalErr = 0, totalLessons = 0, okLessons = 0;
var profiles = [
  { name: 'מאיה', gender: 'f', interests: ['baking', 'animals'] },
  { name: 'איתי', gender: 'm', interests: ['sport', 'space'] },
  { name: 'נועה', gender: 'f', interests: [] },
];
function strip(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function isInt(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }
function isNum(x) { return typeof x === 'number' && isFinite(x); }

function checkQ(q, errs) {
  function e(msg) { errs.push(msg + ' | ' + strip(q && q.prompt || '').slice(0, 110)); }
  if (!q || typeof q !== 'object') return e('gen לא החזיר אובייקט');
  if (TYPES.indexOf(q.type) < 0) return e('type לא חוקי: ' + q.type);
  if (typeof q.prompt !== 'string' || strip(q.prompt).length < 3) e('prompt חסר');
  var all = [q.prompt, q.visual || '', q.hint || '', (q.solution || []).join(' '), (q.choices || []).join(' '), (q.items || []).join(' '), q.left || '', q.right || '', q.unit || '', (q.labels || []).join(' ')].join(' ');
  if (BAD.test(all)) e('טקסט מכיל undefined/NaN/[object]: ' + (all.match(BAD) || [])[0]);
  if (q.solution && !Array.isArray(q.solution)) e('solution חייב להיות מערך');
  var slots = (q.prompt.match(/data-slot=/g) || []).length;
  switch (q.type) {
    case 'number':
      if (Array.isArray(q.answer)) {
        if (!q.answer.length || !q.answer.every(isNum)) e('answer (מערך) לא מספרי');
        if (slots && slots !== q.answer.length) e('מספר המשבצות (' + slots + ') ≠ מספר התשובות (' + q.answer.length + ')');
        if (!slots && (!q.labels || q.labels.length !== q.answer.length)) e('שאלה מרובת שדות בלי slot וללא labels');
      } else {
        if (!isNum(q.answer)) e('answer לא מספר: ' + q.answer);
        if (slots > 1) e('יותר ממשבצת אחת אבל answer יחיד');
      }
      [].concat(q.answer).forEach(function (a) { if (a < 0) e('תשובה שלילית'); if (!isInt(a) && !q.decimal && Math.abs(a * 1000 - Math.round(a * 1000)) > 1e-6) e('תשובה עשרונית ארוכה מדי: ' + a); });
      break;
    case 'choice':
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6) { e('choices: צריך 2-6'); break; }
      if (!isInt(q.answer) || q.answer < 0 || q.answer >= q.choices.length) e('answer אינדקס לא חוקי: ' + q.answer);
      var seen = {};
      q.choices.forEach(function (ch) { var k = /<svg/.test(ch) ? ch : strip(ch); if (seen[k]) e('תשובה כפולה: ' + strip(ch).slice(0, 30)); seen[k] = 1; if (!k) e('תשובה ריקה'); });
      break;
    case 'tf':
      if (typeof q.answer !== 'boolean') e('tf: answer חייב להיות true/false');
      break;
    case 'fraction':
      var a = q.answer;
      if (!a || !isInt(a.n) || !isInt(a.d) || a.d <= 0 || a.n < 0) e('fraction: answer {n,d} לא חוקי');
      if (a && a.w != null && (!isInt(a.w) || a.w < 0)) e('fraction: w לא חוקי');
      if (q.accept && ['equal', 'exact', 'simplest'].indexOf(q.accept) < 0) e('accept לא חוקי');
      if (q.accept === 'simplest' && a && HM.gcd(a.n, a.d) !== 1 && a.n !== 0) e('accept=simplest אבל התשובה לא מצומצמת');
      if (a && a.w != null && a.n >= a.d) e('מספר מעורב: המונה צריך להיות קטן מהמכנה');
      break;
    case 'compare':
      if (['<', '>', '='].indexOf(q.answer) < 0) e('compare: answer חייב להיות < > =');
      if (!q.left || !q.right) e('compare: חסר left/right');
      if (isNum(q.lv) && isNum(q.rv)) { var exp = Math.abs(q.lv - q.rv) < 1e-9 ? '=' : (q.lv < q.rv ? '<' : '>'); if (exp !== q.answer) e('compare: answer לא תואם ל-lv/rv'); }
      break;
    case 'order':
      if (!Array.isArray(q.items) || q.items.length < 3) e('order: צריך לפחות 3 פריטים');
      else if (!Array.isArray(q.answer) || q.answer.length !== q.items.length || q.answer.slice().sort().join() !== q.items.map(function (_, i) { return i; }).sort().join()) e('order: answer אינו פרמוטציה');
      if (Array.isArray(q.items)) { var s2 = {}; q.items.forEach(function (it) { if (s2[strip(it)]) e('order: פריט כפול'); s2[strip(it)] = 1; }); }
      break;
    case 'numberline':
      var L = q.line || {};
      if (!isNum(L.min) || !isNum(L.max) || L.max <= L.min) { e('numberline: line.min/max'); break; }
      if (!isNum(q.answer) || q.answer < L.min - 1e-9 || q.answer > L.max + 1e-9) e('numberline: answer מחוץ לטווח');
      var st = L.den ? 1 / L.den : (L.step || 1), k = (q.answer - L.min) / st;
      if (Math.abs(k - Math.round(k)) > 1e-6) e('numberline: answer לא על סימון');
      if ((L.max - L.min) / st > 40) e('numberline: יותר מ-40 סימונים');
      break;
    case 'shade':
      if (['bar', 'pie', 'grid'].indexOf(q.shape) < 0) e('shade: shape לא חוקי');
      var parts = q.shape === 'grid' ? (q.rows || 10) * (q.cols || 10) : q.parts;
      if (!isInt(parts) || parts < 1) e('shade: parts');
      if (!isInt(q.answer) || q.answer < 0 || q.answer > parts) e('shade: answer');
      break;
  }
}

function checkLearn(def, c, errs) {
  var cards;
  try { cards = def.learn(c); } catch (ex) { errs.push('learn זרק שגיאה: ' + ex + (ex.line ? ' @' + ex.line : '')); return; }
  if (!Array.isArray(cards) || cards.length < 2) { errs.push('learn: צריך לפחות 2 כרטיסים'); return; }
  cards.forEach(function (cd, i) {
    if (!cd.title) errs.push('כרטיס ' + i + ' בלי title');
    if (!cd.html && !cd.visual && !cd.steps) errs.push('כרטיס ' + i + ' ריק');
    var txt = [cd.title, cd.html || '', cd.visual || '', (cd.steps || []).join(' '), cd.say || ''].join(' ');
    if (BAD.test(txt)) errs.push('כרטיס ' + i + ' מכיל ' + (txt.match(BAD) || [])[0]);
    if (cd.quiz) { var e2 = []; checkQ(cd.quiz, e2); e2.forEach(function (x) { errs.push('quiz בכרטיס ' + i + ': ' + x); }); }
  });
}

var only = null;
HM.WORLDS.forEach(function (w) {
  w.units.forEach(function (u) {
    u.lessons.forEach(function (meta) {
      var def = HM.CONTENT[meta.id];
      if (!def) return;
      totalLessons++;
      var errs = [], stats = {};
      if (typeof def.learn !== 'function') errs.push('חסר learn');
      if (typeof def.gen !== 'function') errs.push('חסר gen');
      profiles.forEach(function (p) {
        var c = HM.makeCtx(p);
        if (typeof def.learn === 'function') checkLearn(def, c, errs);
      });
      if (typeof def.gen === 'function') {
        for (var lvl = 1; lvl <= 3; lvl++) {
          var prompts = {}, types = {};
          for (var it = 0; it < ITER; it++) {
            var c = HM.makeCtx(profiles[it % profiles.length]);
            var q;
            try { q = def.gen(c, lvl); } catch (ex) { errs.push('gen רמה ' + lvl + ' זרק: ' + ex + (ex.line ? ' @' + ex.line : '')); break; }
            checkQ(q, errs);
            if (q) { prompts[(q.prompt || '') + JSON.stringify(q.answer) + (q.visual || '').length] = 1; types[q.type] = (types[q.type] || 0) + 1; }
            if (errs.length > 40) break;
          }
          var distinct = Object.keys(prompts).length;
          stats['L' + lvl] = distinct + ' שונות; ' + Object.keys(types).map(function (t) { return t + ':' + types[t]; }).join(' ');
          if (distinct < 8) errs.push('רמה ' + lvl + ': מגוון נמוך (' + distinct + ' שאלות שונות מתוך ' + ITER + ')');
        }
      }
      var uniq = [], seenE = {};
      errs.forEach(function (x) { var k = x.split(' | ')[0]; if (!seenE[k]) { seenE[k] = 1; uniq.push(x); } });
      if (uniq.length) {
        totalErr += uniq.length;
        print('✗ ' + meta.id + ' — ' + meta.title);
        uniq.slice(0, 12).forEach(function (x) { print('    • ' + x); });
      } else {
        okLessons++;
        print('✓ ' + meta.id + ' — ' + meta.title + '   [' + stats.L1 + ' | ' + stats.L2 + ' | ' + stats.L3 + ']');
      }
    });
  });
});
var missing = HM.LESSON_ORDER.filter(function (id) { return !HM.CONTENT[id]; });
print('\nסיכום: ' + okLessons + '/' + totalLessons + ' שיעורים תקינים, ' + totalErr + ' סוגי שגיאות. חסרים בתוכן: ' + missing.length + ' מתוך ' + HM.LESSON_ORDER.length);
