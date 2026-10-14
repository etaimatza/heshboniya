/* הדפסת דוגמאות טקסט לשיעור (לבדיקת ניסוח): tests/sample.sh <file> <lessonId> [count] */
var window = this;
var console = { log: print, warn: print, error: print };
var ROOT = arguments[0], FILE = arguments[1], ID = arguments[2], N = +(arguments[3] || 4);
load(ROOT + '/js/util.js'); load(ROOT + '/js/viz.js'); load(ROOT + '/js/curriculum.js'); load(FILE);
function strip(s) { return String(s || '').replace(/<span class="fr"><span class="fr-n">([^<]*)<\/span><span class="fr-d">([^<]*)<\/span><\/span>/g, '($1/$2)').replace(/<svg[\s\S]*?<\/svg>/g, '[ציור]').replace(/<span class="slot"[^>]*>.*?<\/span><\/span>/g, '[__]').replace(/<br\s*\/?>/g, ' / ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
var def = HM.CONTENT[ID];
if (!def) { print('לא נמצא ' + ID); } else {
  [['f', 'מאיה'], ['m', 'איתי']].forEach(function (p) {
    var c = HM.makeCtx({ name: p[1], gender: p[0], interests: ['sport', 'baking'] });
    print('\n===== ' + ID + ' / ' + p[1] + ' — כרטיסי לימוד =====');
    def.learn(c).forEach(function (cd, i) { print((i + 1) + '. ' + cd.title + ': ' + strip(cd.html) + (cd.steps ? ' || צעדים: ' + cd.steps.map(strip).join(' → ') : '') + (cd.quiz ? ' || בוחן: ' + strip(cd.quiz.prompt) : '')); });
    for (var lvl = 1; lvl <= 3; lvl++) {
      print('--- רמה ' + lvl + ' ---');
      for (var i = 0; i < N; i++) {
        var q = def.gen(c, lvl);
        var ans = q.type === 'choice' ? strip(q.choices[q.answer]) : q.type === 'order' ? q.answer.map(function (k) { return strip(q.items[k]); }).join(' , ') : JSON.stringify(q.answer);
        print('[' + q.type + '] ' + strip(q.prompt) + (q.left ? ' ' + strip(q.left) + ' ? ' + strip(q.right) : '') + (q.choices ? '  {' + q.choices.map(strip).join(' | ') + '}' : '') + '  => ' + ans + (q.unit ? ' ' + q.unit : ''));
        if (q.hint) print('     רמז: ' + strip(q.hint));
        if (q.solution) print('     פתרון: ' + q.solution.map(strip).join(' → '));
      }
    }
  });
}
