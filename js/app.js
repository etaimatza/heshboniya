/* חשבוניה — האפליקציה: מסכים, ניווט וזרימת למידה */
(function (HM) {
  'use strict';
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const I = (n) => HM.art.icon(n);
  const ST = () => HM.store;
  const P = () => HM.store.current();
  const C = () => HM.store.ctx();
  const esc = HM.esc;
  const root = () => document.getElementById('app');
  const worldOf = (id) => HM.WORLDS.find((w) => w.id === id);
  const HUE = { amber: 'w-amber', rose: 'w-rose', sky: 'w-sky', lime: 'w-lime' };

  const App = { keyHandler: null, cleanup: null, screen: null };
  HM.app = App;

  /* ---------- ניווט ---------- */
  function go(name, params, opts) {
    HM.stopSpeak();
    if (App.cleanup) { try { App.cleanup(); } catch (e) { /* */ } App.cleanup = null; }
    App.keyHandler = null;
    App.screen = name; App.params = params || {};
    const r = root();
    r.innerHTML = '';
    const scr = SCREENS[name](params || {});
    r.appendChild(scr);
    const tabs = { home: 'home', review: 'review', sprintIntro: 'sprint', profile: 'profile', report: 'profile' };
    if (tabs[name]) r.appendChild(tabbar(tabs[name]));
    if (!opts || !opts.keepScroll) window.scrollTo(0, 0);
    try { if (['home', 'review', 'sprintIntro', 'profile'].indexOf(name) >= 0) history.replaceState(null, '', '#' + name); } catch (e) { /* */ }
  }
  App.go = go;

  function tabbar(active) {
    const mc = Object.values(ST().mistakeCounts()).reduce((s, x) => s + x, 0);
    const t = el(`<div class="tabbar"><nav aria-label="ניווט ראשי">
      <button class="tab ${active === 'home' ? 'on' : ''}" data-go="home">${I('map')}<span>המפה</span></button>
      <button class="tab ${active === 'sprint' ? 'on' : ''}" data-go="sprintIntro">${I('bolt')}<span>אתגרים</span></button>
      <button class="tab ${active === 'review' ? 'on' : ''}" data-go="review">${I('redo')}<span>טעויות</span>${mc ? `<span class="badge">${mc > 99 ? '99+' : mc}</span>` : ''}</button>
      <button class="tab ${active === 'profile' ? 'on' : ''}" data-go="profile">${I('user')}<span>${C().g('הפרופיל שלי', 'הפרופיל שלי')}</span></button>
    </nav></div>`);
    $$('.tab', t).forEach((b) => b.addEventListener('click', () => { HM.sfx('tap'); go(b.dataset.go); }));
    return t;
  }

  function toast(html, iconName) {
    const t = el(`<div class="toast" role="status">${iconName ? I(iconName) : ''}<span>${html}</span></div>`);
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 2600);
  }
  App.toast = toast;

  function sheet(contentEl, onClose) {
    const bg = el('<div class="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div></div></div>');
    $('.sheet', bg).appendChild(contentEl);
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc1); if (onClose) onClose(); };
    const esc1 = (e) => { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
    document.addEventListener('keydown', esc1);
    document.body.appendChild(bg);
    return close;
  }

  function confirmSheet(title, text, yes, no, onYes) {
    const box = el(`<div class="stack"><h2>${title}</h2><p class="muted">${text}</p><div class="sheet-actions"><button class="btn bad" data-y>${yes}</button><button class="btn sec" data-n>${no}</button></div></div>`);
    const close = sheet(box);
    $('[data-y]', box).addEventListener('click', () => { close(); onYes(); });
    $('[data-n]', box).addEventListener('click', close);
  }

  const speakBtn = (getHtml) => {
    const p = P();
    if (!HM.canSpeak() || (p && p.settings.tts === false)) return null;
    const b = el(`<button class="icon-btn speak" aria-label="הקראה">${I('speaker')}</button>`);
    b.addEventListener('click', () => HM.speak(getHtml()));
    return b;
  };

  /* ================= פתיחה והרשמה ================= */
  function screenOnboard(params) {
    const setupP = params.setup ? ST().byId(params.setup) : null;
    const st = setupP
      ? { step: 3, name: setupP.name, gender: setupP.gender, avatar: setupP.avatar, theme: setupP.theme || HM.defaultTheme(setupP.gender), interests: (setupP.interests || []).slice() }
      : { step: 0, name: '', gender: null, avatar: null, theme: null, interests: [] };
    if (setupP) HM.applyTheme(st.theme);
    const wrap = el('<div class="onb"></div>');
    const STEPS = 5;
    function render() {
      const c = HM.makeCtx({ name: st.name || 'חבר', gender: st.gender || 'm' });
      const g = (m, f) => (st.gender === 'f' ? f : st.gender === 'm' ? m : m + '/' + f);
      wrap.innerHTML = '';
      const top = el(`<div class="onb-top">${st.step > 0 || params.adding || setupP ? `<button class="icon-btn" data-back aria-label="חזרה">${I('back')}</button>` : '<span style="width:46px"></span>'}<div class="onb-dots">${st.step > 0 ? Array.from({ length: STEPS }, (_, i) => `<i class="${i < st.step ? 'on' : ''}"></i>`).join('') : ''}</div><span style="width:46px"></span></div>`);
      wrap.appendChild(top);
      const back = $('[data-back]', top);
      if (back) back.addEventListener('click', () => { HM.sfx('tap'); if (setupP && st.step <= 3) return go('family'); if (st.step === 0) go(P() ? 'profile' : (App.screens.welcome ? 'welcome' : 'onboard')); else { st.step--; render(); } });
      const body = el('<div class="onb-body"></div>');
      let foot = null;
      if (st.step === 0) {
        body.appendChild(el(`<div class="stack center">${HM.art.mascot('wave', { cls: 'hero-mascot' })}<div class="splash-title">חשבוניה</div><p class="splash-sub">כל החשבון של כיתה ה׳ — במסע אחד מגניב.<br>שברים, עשרוניים, צורות ומספרים ענקיים.</p></div>`));
        foot = el(`<button class="btn block">יוצאים לדרך!</button>`);
        foot.addEventListener('click', () => { HM.sfx('whoosh'); st.step = 1; render(); });
      } else if (st.step === 1) {
        body.appendChild(el(`<div class="stack"><div class="mascot-tip"><div class="mt-m">${HM.art.mascot('happy')}</div><div class="bubble">היי! אני <b>נומי</b>, ואני אלווה אותך במסע.</div></div><h1>איך קוראים לך?</h1><input class="field" id="onb-name" maxlength="16" autocomplete="off" placeholder="השם שלי" value="${esc(st.name)}"><p class="muted tiny center">השם יופיע בהסברים ובתרגילים.</p></div>`));
        foot = el(`<button class="btn block" ${st.name.trim() ? '' : 'disabled'}>המשך</button>`);
        const inp = $('#onb-name', body);
        inp.addEventListener('input', () => { st.name = inp.value; foot.disabled = !st.name.trim(); });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && st.name.trim()) foot.click(); });
        setTimeout(() => inp.focus(), 80);
        foot.addEventListener('click', () => { st.name = st.name.trim(); HM.sfx('tap'); st.step = 2; render(); });
      } else if (st.step === 2) {
        const card = (gen, label, theme) => { const t = HM.THEMES[theme]; return `<button class="pick ${st.gender === gen ? 'on' : ''}" data-g="${gen}" style="--p:${t.p};--p-l:${t.pl};--p-d:${t.pd};--a:${t.a}"><span class="pick-art">${HM.art.mascot(gen === 'f' ? 'party' : 'wave')}</span>${label}</button>`; };
        body.appendChild(el(`<div class="stack"><h1>נעים מאוד, ${esc(st.name)}!</h1><p class="lead">כדי שנדבר אליך נכון, נשמח לדעת:</p><div class="pick-grid">${card('m', 'אני בן', 'ocean')}${card('f', 'אני בת', 'berry')}</div></div>`));
        $$('.pick', body).forEach((b) => b.addEventListener('click', () => {
          HM.sfx('tap'); st.gender = b.dataset.g; if (!st.theme || !params.keepTheme) st.theme = HM.defaultTheme(st.gender); HM.applyTheme(st.theme); render();
        }));
        foot = el(`<button class="btn block" ${st.gender ? '' : 'disabled'}>המשך</button>`);
        foot.addEventListener('click', () => { HM.sfx('tap'); st.step = 3; render(); });
      } else if (st.step === 3) {
        const themeIds = Object.keys(HM.THEMES).sort((a, b) => (HM.THEMES[a].g === st.gender ? 0 : 1) - (HM.THEMES[b].g === st.gender ? 0 : 1));
        body.appendChild(el(`<div class="stack"><h1>${setupP ? `היי ${esc(st.name)}! ` : ''}${g('בחר', 'בחרי')} דמות וצבע</h1>
          <div class="pick-grid c3" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:8px">${HM.AVATARS.map((a) => `<button class="pick avatar-pick ${st.avatar === a ? 'on' : ''}" data-a="${a}" aria-label="דמות">${a}</button>`).join('')}</div>
          <p class="muted" style="margin-top:6px">${g('הצבעים של האפליקציה שלך', 'הצבעים של האפליקציה שלך')}:</p>
          <div class="themes">${themeIds.map((id) => { const t = HM.THEMES[id]; return `<button class="theme-c ${st.theme === id ? 'on' : ''}" data-t="${id}"><span class="theme-sw"><i style="background:${t.p}"></i><i style="background:${t.s}"></i><i style="background:${t.a}"></i></span>${t.name}</button>`; }).join('')}</div></div>`));
        $$('[data-a]', body).forEach((b) => b.addEventListener('click', () => { HM.sfx('tap'); st.avatar = b.dataset.a; render(); }));
        $$('[data-t]', body).forEach((b) => b.addEventListener('click', () => { HM.sfx('tap'); st.theme = b.dataset.t; HM.applyTheme(st.theme); render(); }));
        if (!st.avatar) st.avatar = null;
        foot = el(`<button class="btn block" ${st.avatar ? '' : 'disabled'}>המשך</button>`);
        foot.addEventListener('click', () => { HM.sfx('tap'); st.step = 4; render(); });
      } else if (st.step === 4) {
        body.appendChild(el(`<div class="stack"><h1>מה ${g('אתה הכי אוהב', 'את הכי אוהבת')}?</h1><p class="lead">${g('בחר', 'בחרי')} עד 3 נושאים — נשתמש בהם בשאלות הסיפור.</p>
          <div class="int-grid">${HM.INTERESTS.map((x) => `<button class="int ${st.interests.indexOf(x.id) >= 0 ? 'on' : ''}" data-i="${x.id}">${HM.art.INT_ICONS[x.icon]}<span>${x.label}</span></button>`).join('')}</div></div>`));
        $$('[data-i]', body).forEach((b) => b.addEventListener('click', () => {
          const id = b.dataset.i, k = st.interests.indexOf(id);
          if (k >= 0) st.interests.splice(k, 1); else { if (st.interests.length >= 3) st.interests.shift(); st.interests.push(id); }
          HM.sfx('tap'); render();
        }));
        foot = el(`<button class="btn block">${st.interests.length ? 'המשך' : 'דילוג'}</button>`);
        foot.addEventListener('click', () => { HM.sfx('tap'); st.step = 5; render(); });
      } else {
        body.appendChild(el(`<div class="stack center">${HM.art.mascot('party').replace('<svg ', '<svg style="width:200px;margin:0 auto;display:block" ')}<h1>${g('מוכן', 'מוכנה')}, ${esc(st.name)}?</h1><p class="lead">בחשבוניה יש ארבעה עולמות — אחד לכל ספר בכיתה ה׳. בכל נושא ${g('תלמד', 'תלמדי')} עם הסברים ודוגמאות, ${g('תתרגל', 'תתרגלי')} ${g('ותאסוף', 'ותאספי')} כוכבים.</p></div>`));
        foot = el(`<button class="btn block acc">למפה של חשבוניה!</button>`);
        foot.addEventListener('click', () => {
          if (setupP) ST().update((x) => { x.avatar = st.avatar; x.theme = st.theme; x.interests = st.interests; x.setupDone = true; x.created = x.created || Date.now(); });
          else ST().create({ name: st.name, gender: st.gender, avatar: st.avatar, theme: st.theme, interests: st.interests });
          HM.applyTheme(st.theme); HM.sfx('win'); HM.confetti(1); go('home');
        });
      }
      wrap.appendChild(body);
      if (foot) wrap.appendChild(foot);
    }
    render();
    return wrap;
  }

  /* ================= בחירת פרופיל ================= */
  function screenProfiles() {
    const all = ST().all();
    const s = el(`<div class="screen"><div class="topbar"><div class="brand">${HM.art.logo}חשבוניה</div></div><h1 style="margin-bottom:16px">מי לומד עכשיו?</h1><div class="profiles"></div></div>`);
    const grid = $('.profiles', s);
    all.forEach((p) => {
      const t = HM.THEMES[p.theme] || HM.THEMES.ocean;
      const b = el(`<button class="pick" style="--p:${t.p};--p-l:${t.pl}"><span class="avatar lg" style="background:${t.pl}">${p.avatar}</span>${esc(p.name)}<small>רמה ${ST().levelOf(p.xp).level}</small></button>`);
      b.addEventListener('click', () => { ST().setCurrent(p.id); HM.applyTheme(p.theme); HM.sfx('tap'); go('home'); });
      grid.appendChild(b);
    });
    const add = el(`<button class="pick"><span class="avatar lg">${I('plus')}</span>פרופיל חדש</button>`);
    add.addEventListener('click', () => go('onboard', { adding: true }));
    grid.appendChild(add);
    return s;
  }

  /* ================= בית ================= */
  // הנושא שבמרכז הבית: מה שלומדים עכשיו בכיתה (אם סומן), אחרת הנושא הבא שעוד לא נשלט
  function focusLessons() {
    const p = P();
    const cls = (p.classNow || []).filter((id) => HM.LESSONS[id]);
    return { cls, ids: cls.length ? cls : [ST().nextLesson()].filter(Boolean) };
  }
  function screenHome(params) {
    const p = P(), c = C(), g = c.g;
    const lv = ST().levelOf(p.xp);
    const streak = ST().streakAlive();
    const daily = ST().dailyXP(), goal = p.goal || 50;
    const fl = focusLessons();
    let cur = (params && params.focus && fl.ids.indexOf(params.focus) >= 0) ? params.focus : fl.ids[0];
    const hour = new Date().getHours();
    const hello = hour < 5 ? 'לילה טוב' : hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : hour < 21 ? 'ערב טוב' : 'לילה טוב';
    const s = el(`<div class="screen wide home">
      <div class="home-head">
        <div class="who"><button class="avatar" data-prof aria-label="הפרופיל שלי">${p.avatar}</button><div class="greet">${hello}, ${esc(p.name)}!<small>רמה ${lv.level} · ${ST().titleOf(lv.level, p.gender)}</small></div></div>
        <button class="parent-link" data-parents>${I('chart')}<span>להורים</span></button>
        <span class="pill" title="ימים ברצף">${streak ? I('flame') : I('flameOff')}<span dir="ltr">${streak}</span></span>
      </div>
      <section class="hero2" data-hero></section>
      <div class="sec-title"><h2>העולמות</h2></div>
      <div class="worlds"></div>
    </div>`);
    $('[data-prof]', s).addEventListener('click', () => go('profile'));
    $('[data-parents]', s).addEventListener('click', () => { HM.sfx('tap'); go('parents'); });
    const hero = $('[data-hero]', s);
    function renderHero() {
      if (!cur) { hero.innerHTML = '<p>כל הנושאים מחכים לך!</p>'; return; }
      const L = HM.LESSONS[cur], w = worldOf(L.world), st = ST().lesson(cur);
      const fresh = !st.sessions && !st.learned;
      const inClass = fl.cls.indexOf(cur) >= 0;
      hero.innerHTML = `
        <div class="h2-mascot">${HM.art.mascot(st.mastery >= HM.MASTERY.target ? 'party' : 'wave')}</div>
        <div class="h2-top"><span class="h2-kicker">${inClass ? `${I('calendar')}בכיתה לומדים עכשיו` : `${I('target')}${g('הנושא הבא שלך', 'הנושא הבא שלך')}`}</span><span class="chip ${HUE[w.hue]}" style="background:var(--w-l)">${w.title}</span></div>
        <h1 class="h2-title">${L.title}</h1>
        ${fl.cls.length > 1 ? `<div class="h2-tabs">${fl.cls.map((id) => `<button class="${id === cur ? 'on' : ''}" data-f="${id}">${HM.LESSONS[id].title}</button>`).join('')}</div>` : ''}
        <div class="h2-meter"><span>מד השליטה</span><div class="grow">${masteryBar(st.mastery || 0, st.mastery || 0)}</div><b dir="ltr">${Math.round(st.mastery || 0)}%</b></div>
        <div class="h2-actions">
          <button class="btn acc" data-go>${fresh ? `${I('book')}להתחיל ללמוד` : `${I('pencil')}להמשיך לתרגל`}</button>
          ${fresh ? '' : `<button class="btn sec" data-learn>${I('book')}הסבר</button>`}
        </div>
        <div class="h2-foot"><button class="link" data-pick>${fl.cls.length ? 'בכיתה לומדים משהו אחר?' : 'מה לומדים עכשיו בכיתה?'}</button><span class="h2-goal" title="היעד היומי">היום: <b dir="ltr">${daily}/${goal}</b> נקודות <span class="mini-bar"><i style="width:${Math.min(100, daily / goal * 100)}%"></i></span></span></div>`;
      $('[data-go]', hero).addEventListener('click', () => { HM.sfx('whoosh'); go(fresh ? 'learn' : 'practice', fresh ? { id: cur } : { mode: 'practice', lessonId: cur }); });
      const lb = $('[data-learn]', hero); if (lb) lb.addEventListener('click', () => go('learn', { id: cur }));
      $('[data-pick]', hero).addEventListener('click', () => classPicker(() => go('home')));
      $$('[data-f]', hero).forEach((b) => b.addEventListener('click', () => { cur = b.dataset.f; HM.sfx('tap'); renderHero(); }));
    }
    renderHero();
    const grid = $('.worlds', s);
    HM.WORLDS.forEach((w) => {
      const pr = ST().worldProgress(w.id);
      const mastered = w.units.reduce((n, u) => n + u.lessons.filter((l) => (ST().lesson(l.id).mastery || 0) >= HM.MASTERY.target).length, 0);
      const total = w.units.reduce((n, u) => n + u.lessons.length, 0);
      const b = el(`<button class="world-card ${HUE[w.hue]}"><div class="wart">${HM.art.WORLD_ART[w.art]}</div><div class="wbody"><h3>${w.title}</h3><div class="wprog"><div class="bar-track"><div class="bar-fill" style="width:${Math.round(pr.pct * 100)}%"></div></div><span dir="ltr">${mastered}/${total}</span></div></div></button>`);
      b.addEventListener('click', () => { HM.sfx('whoosh'); go('world', { id: w.id }); });
      grid.appendChild(b);
    });
    return s;
  }

  /* ---------- בחירת הנושא שלומדים בכיתה ---------- */
  function classPicker(onDone) {
    const p = P(), g = C().g;
    const sel = (p.classNow || []).filter((id) => HM.LESSONS[id]);
    let wid = sel.length ? HM.LESSONS[sel[0]].world : HM.WORLDS[0].id;
    const box = el('<div class="stack picker"></div>');
    let close;
    function render() {
      const w = worldOf(wid);
      const sugg = p.book === 'hashbacha' ? HM.lessonsNow().filter((id) => HM.LESSONS[id]) : [];
      box.innerHTML = `<h2>מה לומדים עכשיו בכיתה?</h2>
        <p class="muted">${g('בחר', 'בחרי')} עד 3 נושאים. הם יופיעו ראשונים במסך הבית ויסומנו במפה. ${g('לא בטוח', 'לא בטוחה')}? אפשר להציץ במחברת או בספר.</p>
        ${sugg.length ? `<div class="note">לפי לוח הזמנים של ה.ש.ב.ח.ה כנראה לומדים עכשיו: ${sugg.map((id) => `<button class="chip" data-add="${id}">${HM.LESSONS[id].title}</button>`).join(' ')}</div>` : ''}
        <div class="seg seg-w">${HM.WORLDS.map((x) => `<button data-w="${x.id}" class="${x.id === wid ? 'on' : ''}">${x.title}</button>`).join('')}</div>
        <div class="pk-list">${w.units.map((u) => `<div class="pk-unit"><b>${u.title}</b>${u.lessons.map((l) => `<button class="pk ${sel.indexOf(l.id) >= 0 ? 'on' : ''}" data-l="${l.id}"><span class="pk-box">${sel.indexOf(l.id) >= 0 ? I('check') : ''}</span>${l.title}</button>`).join('')}</div>`).join('')}</div>
        <div class="sheet-actions"><button class="btn" data-save>${g('שמור', 'שמרי')}${sel.length ? ` (${sel.length})` : ''}</button><button class="btn sec" data-clear>${sel.length ? 'ניקוי הבחירה' : 'ביטול'}</button></div>`;
      $$('[data-w]', box).forEach((b) => b.addEventListener('click', () => { wid = b.dataset.w; render(); }));
      const toggle = (id) => { const i = sel.indexOf(id); if (i >= 0) sel.splice(i, 1); else { if (sel.length >= 3) sel.shift(); sel.push(id); } HM.sfx('tap'); render(); };
      $$('[data-l]', box).forEach((b) => b.addEventListener('click', () => toggle(b.dataset.l)));
      $$('[data-add]', box).forEach((b) => b.addEventListener('click', () => { if (sel.indexOf(b.dataset.add) < 0) toggle(b.dataset.add); }));
      $('[data-save]', box).addEventListener('click', () => { ST().update((x) => (x.classNow = sel.slice())); close(); toast('נשמר!', 'check'); if (onDone) onDone(); });
      $('[data-clear]', box).addEventListener('click', () => { if (sel.length) { sel.length = 0; render(); } else close(); });
    }
    render();
    close = sheet(box);
  }
  App.classPicker = classPicker;

  /* ================= עולם — דרך שהדמות מתקדמת בה ================= */
  // נקודות חלקות (Catmull-Rom → Bezier) ב-viewBox של 0..100 רוחב
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  function screenWorld({ id }) {
    const w = worldOf(id), c = C(), g = c.g, p = P();
    const nextId = ST().nextLesson(id);
    const now = p.classNow || [];
    const allIds = w.units.reduce((a, u) => a.concat(u.lessons.map((l) => l.id)), []);
    const curIdx = allIds.indexOf(nextId);
    const allDone = allIds.filter(HM.hasContent).every((x) => (ST().lesson(x).mastery || 0) >= HM.MASTERY.target);
    const s = el(`<div class="screen ${HUE[w.hue]}">
      <div class="topbar"><button class="icon-btn" data-back aria-label="חזרה למפה">${I('back')}</button><span class="title grow">${w.title}</span><span class="pill">${I('star')}<span dir="ltr">${ST().worldProgress(id).stars}</span></span></div>
      <div class="w-hero"><div class="wh-t"><h1>${w.title}</h1><p>מתוך הספר "${w.book}"</p></div><div class="wart">${HM.art.WORLD_ART[w.art].replace('xMidYMax meet', 'xMidYMid slice')}</div></div>
      <div class="journey"></div></div>`);
    $('[data-back]', s).addEventListener('click', () => go('home'));
    const journey = $('.journey', s);
    // קישוטים לצד הדרך: תחומי העניין של הילד/ה לסירוגין עם נוף העולם
    const ints = (p.interests || []).map((i) => (HM.INTERESTS.find((x) => x.id === i) || {}).icon).filter(Boolean);
    const scenery = HM.art.SCENERY[w.id] || [];
    let decoK = 0;
    const nextDeco = () => { const pool = ints.length ? (decoK % 2 === 0 ? ints.map((x) => HM.art.INT_ICONS[x]) : scenery) : scenery; const v = pool[Math.floor(decoK / 2) % pool.length]; decoK++; return v; };
    const OFF = [50, 74, 50, 26]; // מרחק מימין, באחוזים
    const ROW = 124;
    let gIdx = 0;
    w.units.forEach((u, ui) => {
      const lessons = u.lessons;
      const doneN = lessons.filter((l) => (ST().lesson(l.id).mastery || 0) >= HM.MASTERY.target).length;
      const H = lessons.length * ROW + 40;
      const leg = el(`<section class="leg"><div class="leg-sign"><span class="un">${ui + 1}</span><div class="grow"><h2>${u.title}</h2><small>${doneN} מתוך ${lessons.length} נושאים בשליטה</small></div>${doneN === lessons.length ? `<span class="leg-done">${I('check')}</span>` : ''}</div><div class="road" style="height:${H}px"></div></section>`);
      const road = $('.road', leg);
      const pts = [[50, 0]].concat(lessons.map((_, i) => [100 - OFF[i % 4], 20 + i * ROW + 44])).concat([[50, H]]);
      // כמה מהדרך כבר עברנו ביחידה הזאת
      const legStart = gIdx, legEnd = gIdx + lessons.length - 1;
      let travelPts = null;
      if (allDone || curIdx > legEnd) travelPts = pts;
      else if (curIdx >= legStart) travelPts = pts.slice(0, curIdx - legStart + 2);
      const dAll = smoothPath(pts);
      road.innerHTML = `<svg class="road-svg" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${dAll}" class="rd-edge" vector-effect="non-scaling-stroke"/>
        <path d="${dAll}" class="rd-surface" vector-effect="non-scaling-stroke"/>
        ${travelPts && travelPts.length > 1 ? `<path d="${smoothPath(travelPts)}" class="rd-traveled" vector-effect="non-scaling-stroke"/>` : ''}
        <path d="${dAll}" class="rd-dash" vector-effect="non-scaling-stroke"/></svg>`;
      lessons.forEach((L, i) => {
        const st = ST().lesson(L.id);
        const has = HM.hasContent(L.id);
        const mastered = (st.mastery || 0) >= HM.MASTERY.target;
        const cls = !has ? 'soon' : L.id === nextId && !allDone ? 'cur' : mastered ? 'done' : '';
        const icon = !has ? I('lock') : mastered ? I('check') : L.id === nextId ? I('play') : (st.sessions || st.learned ? I('pencil') : I('book'));
        const y = 20 + i * ROW;
        const node = el(`<button class="node ${cls}" style="right:${OFF[i % 4]}%;top:${y}px" aria-label="${esc(L.title)}" data-id="${L.id}">
          <span class="nb">${icon}${now.indexOf(L.id) >= 0 ? '<span class="now-flag">בכיתה</span>' : ''}<span class="stars">${has && st.sessions ? [1, 2, 3].map((k) => (st.stars >= k ? I('star') : I('starOff'))).join('') : ''}</span></span>
          <span class="nl">${L.title}${L.extra ? ' <span class="tag-extra">משרד החינוך</span>' : ''}</span></button>`);
        node.addEventListener('click', () => { HM.sfx('tap'); lessonSheet(L.id); });
        road.appendChild(node);
        // קישוט בצד השני של הדרך
        const off = OFF[i % 4];
        const decoRight = off === 74 ? 12 : off === 26 ? 78 : (i % 8 === 0 ? 84 : 6);
        const deco = nextDeco();
        if (deco) road.appendChild(el(`<span class="deco" style="right:${decoRight}%;top:${y + 18}px;--r:${(i % 2 ? 1 : -1) * (6 + (i * 7) % 10)}deg;animation-delay:${(i % 5) * 0.4}s" aria-hidden="true">${deco}</span>`));
      });
      gIdx += lessons.length;
      journey.appendChild(leg);
    });
    // סוף המסע
    journey.appendChild(el(`<div class="finish ${allDone ? 'won' : ''}"><span class="fin-ic">${I('trophy')}</span><b>${allDone ? `${g('סיימת', 'סיימת')} את ${w.title}!` : 'סוף המסע'}</b><small>${allDone ? 'כל הנושאים בשליטה' : 'כל נושא בשליטה מקרב אותך לכאן'}</small></div>`));
    // הדמות על הדרך
    const trav = el(`<div class="traveler" aria-hidden="true"><span class="tv-tag">${g('אתה כאן', 'את כאן')}</span><span class="tv-av">${p.avatar}</span></div>`);
    journey.appendChild(trav);
    function spotFor(lessonId) {
      const target = lessonId ? $(`.node[data-id="${lessonId}"] .nb`, journey) : $('.finish .fin-ic', journey);
      if (!target) return null;
      const jr = journey.getBoundingClientRect(), nr = target.getBoundingClientRect();
      const cx = nr.left - jr.left + nr.width / 2, top = nr.top - jr.top;
      const side = cx > jr.width * 0.58 ? -1 : 1;
      return { x: cx + side * 72, y: top - 12 };
    }
    const place = (pt) => { trav.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, 0)`; };
    function layout(animate) {
      const curTarget = allDone ? null : nextId;
      const to = spotFor(curTarget);
      if (!to) { trav.hidden = true; return; }
      trav.hidden = false;
      const last = (p.pos || {})[id];
      if (animate && last && last !== curTarget && (curTarget === null || allIds.indexOf(last) < allIds.indexOf(curTarget))) {
        const from = spotFor(last);
        if (from) {
          trav.classList.remove('moving'); place(from); void trav.offsetWidth;
          setTimeout(() => {
            trav.classList.add('moving'); place(to); HM.sfx('whoosh');
            setTimeout(() => { trav.classList.remove('moving'); trav.classList.add('arrived'); HM.sfx('star'); setTimeout(() => trav.classList.remove('arrived'), 900); }, 1300);
            const tgt = curTarget ? $(`.node[data-id="${curTarget}"]`, journey) : $('.finish', journey);
            if (tgt) tgt.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 450);
        } else place(to);
      } else place(to);
      if (last !== (curTarget || '__end')) ST().update((x) => { x.pos = x.pos || {}; x.pos[id] = curTarget || '__end'; });
    }
    const onResize = () => layout(false);
    setTimeout(() => {
      layout(true);
      const cur = $('.node.cur', s);
      if (cur && cur.getBoundingClientRect().top > innerHeight * 0.75) cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    window.addEventListener('resize', onResize);
    App.cleanup = () => window.removeEventListener('resize', onResize);
    return s;
  }

  /* ================= גיליון נושא ================= */
  function lessonSheet(id) {
    const L = HM.LESSONS[id], w = worldOf(L.world), st = ST().lesson(id), g = C().g;
    const has = HM.hasContent(id);
    const box = el(`<div class="${HUE[w.hue]}">
      <div class="row-c" style="justify-content:space-between"><span class="chip" style="background:var(--w-l)">${w.title} · ${L.unitTitle}</span>${L.extra ? '<span class="tag-extra">מתכנית משרד החינוך</span>' : ''}</div>
      <h2 style="margin-top:10px">${L.title}</h2>
      <div class="sheet-meta">${(P().classNow || []).indexOf(id) >= 0 ? `<span class="chip acc">${I('calendar')}לומדים עכשיו בכיתה</span>` : ''}${P().book === 'hashbacha' && L.pages ? `<span class="chip plain">${I('book')}ה.ש.ב.ח.ה, עמודים ${L.pages}</span>` : ''}</div>
      <ul class="skills">${L.skills.map((x) => `<li>${I('check')}<span>${x}</span></li>`).join('')}</ul>
      ${has ? `<div class="mastery"><span class="row-c" style="gap:2px">${[1, 2, 3].map((k) => (st.stars >= k ? I('star') : I('starOff')).replace('<svg', '<svg style="width:24px;height:24px"')).join('')}</span><div class="grow">${masteryBar(st.mastery || 0, st.mastery || 0)}</div><span dir="ltr">${Math.round(st.mastery || 0)}%</span></div><p class="muted tiny">${(st.mastery || 0) >= HM.MASTERY.target ? 'הגעת לרף השליטה בנושא הזה!' : `רף השליטה: ${HM.MASTERY.target}%. השאלות מתחילות קלות ומתקשות ככל ש${g('תצליח', 'תצליחי')}.`}</p>` : `<p class="note">הנושא הזה עוד בהכנה — בקרוב!</p>`}
      ${has ? `<div class="sheet-actions"><button class="btn ${st.learned ? 'sec' : ''}" data-learn>${I('book')}ללמוד</button><button class="btn ${st.learned ? '' : 'sec'}" data-prac>${I('pencil')}לתרגל</button></div>` : ''}
    </div>`);
    const close = sheet(box);
    const lb = $('[data-learn]', box), pb = $('[data-prac]', box);
    if (lb) lb.addEventListener('click', () => { close(); HM.sfx('whoosh'); go('learn', { id }); });
    if (pb) pb.addEventListener('click', () => { close(); HM.sfx('whoosh'); go('practice', { mode: 'practice', lessonId: id }); });
  }
  App.lessonSheet = lessonSheet;

  /* ================= למידה ================= */
  function screenLearn({ id }) {
    const c = C(), g = c.g, def = HM.CONTENT[id], L = HM.LESSONS[id];
    let cards = [];
    try { cards = def.learn(c) || []; } catch (e) { console.error(e); cards = [{ title: L.title, html: 'אופס, משהו השתבש בהסבר הזה.' }]; }
    let idx = 0, stepShown = 0, quizDone = false, quizCtl = null;
    const s = el(`<div class="screen full"><div class="lp-top"><button class="icon-btn" data-x aria-label="סגירה">${I('close')}</button><div class="prog"><i></i></div></div><div data-card></div><div class="check-zone"><div class="row-c"><button class="btn sec" data-prev aria-label="הקודם">${I('back')}</button><button class="btn grow" data-next></button></div></div></div>`);
    $('[data-x]', s).addEventListener('click', () => go('world', { id: L.world }));
    const holder = $('[data-card]', s), nextB = $('[data-next]', s), prevB = $('[data-prev]', s);
    function render() {
      const cd = cards[idx];
      $('.prog > i', s).style.width = Math.round(((idx + 1) / cards.length) * 100) + '%';
      stepShown = 0; quizDone = !cd.quiz; quizCtl = null;
      const card = el(`<article class="card lcard"><div class="lc-head"><span class="lc-n">${idx + 1}/${cards.length}</span><h2>${cd.title}</h2></div>${cd.html ? `<div class="lc-html">${cd.html}</div>` : ''}${cd.visual ? `<div class="lc-vis">${cd.visual}</div>` : ''}${cd.steps ? '<div class="steps"></div>' : ''}${cd.quiz ? '<div class="mini-quiz"></div>' : ''}</article>`);
      const sb = speakBtn(() => [cd.title, cd.html || '', (cd.steps || []).slice(0, stepShown).join('. ')].join('. '));
      if (sb) $('.lc-head', card).appendChild(sb);
      autoRead([cd.title, cd.html || ''].join('. '));
      holder.innerHTML = ''; holder.appendChild(card);
      if (cd.quiz) mountMiniQuiz($('.mini-quiz', card), cd.quiz, () => { quizDone = true; update(); });
      update();
      prevB.disabled = idx === 0;
    }
    function update() {
      const cd = cards[idx];
      if (cd.steps && stepShown < cd.steps.length) nextB.innerHTML = stepShown === 0 ? `${I('bulb')}${g('הראה לי את הפתרון', 'הראי לי את הפתרון')}` : 'הצעד הבא';
      else if (!quizDone) nextB.textContent = 'דילוג';
      else nextB.innerHTML = idx < cards.length - 1 ? `הבא ${I('next')}` : `${I('pencil')}${g('בוא נתרגל!', 'בואי נתרגל!')}`;
    }
    nextB.addEventListener('click', () => {
      const cd = cards[idx];
      if (cd.steps && stepShown < cd.steps.length) {
        const stepsEl = $('.steps', holder);
        stepsEl.appendChild(el(`<div class="step"><div>${cd.steps[stepShown]}</div></div>`));
        stepShown++; HM.sfx('soft'); update();
        stepsEl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (!quizDone) { quizDone = true; }
      if (idx < cards.length - 1) { idx++; HM.sfx('tap'); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else { ST().markLearned(id); HM.sfx('whoosh'); go('practice', { mode: 'practice', lessonId: id }); }
    });
    prevB.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
    App.keyHandler = (e) => {
      if (quizCtl && quizCtl.key && !quizDone) { if (e.key === 'Enter') { const b = $('.mini-quiz .btn', holder); if (b && !b.disabled) b.click(); return; } quizCtl.key(e.key); return; }
      if (e.key === 'Enter' || e.key === 'ArrowLeft') nextB.click();
      if (e.key === 'ArrowRight') prevB.click();
    };
    function mountMiniQuiz(box, q, onDone) {
      box.innerHTML = `<div class="q-meta">${I('target').replace('<svg', '<svg style="width:18px;height:18px"')} בדיקה קטנה</div><div class="q-prompt" style="font-size:19px">${q.prompt}</div>${q.visual ? `<div class="q-vis">${q.visual}</div>` : ''}<div class="ans"></div><div data-fb></div><button class="btn block s2" disabled>בדיקה</button>`;
      const btn = $('.btn', box), fb = $('[data-fb]', box);
      let tries = 0;
      const ctl = HM.engine.mount(box, $('.ans', box), q, () => { btn.disabled = !ctl.canCheck(); });
      quizCtl = ctl;
      btn.addEventListener('click', () => {
        if (!ctl.canCheck()) return;
        tries++;
        const ok = ctl.check();
        if (ok) { HM.sfx('good'); fb.innerHTML = `<p class="note" style="background:var(--good-l);border-color:var(--good)"><b>${pickPraise(C())}</b></p>`; ctl.lock(); btn.remove(); onDone(); }
        else if (tries < ctl.maxTries) { HM.sfx('soft'); fb.innerHTML = `<p class="note"><b>כמעט!</b> ${q.hint || g('נסה שוב', 'נסי שוב')}</p>`; setTimeout(() => { ctl.retry(); btn.disabled = !ctl.canCheck(); }, 700); }
        else { HM.sfx('bad'); ctl.reveal(); fb.innerHTML = `<p class="note" style="background:var(--bad-l);border-color:var(--bad)">התשובה: ${HM.engine.answerHTML(q)}${q.solution ? '<br>' + q.solution.join('<br>') : ''}</p>`; btn.remove(); onDone(); }
      });
    }
    render();
    return s;
  }

  /* ================= תרגול ================= */
  const PRAISE = (g) => ['מעולה!', 'כל הכבוד!', g('אלוף!', 'אלופה!'), 'בול!', 'מצוין!', 'נכון מאוד!', 'יופי של תשובה!', g('תותח!', 'תותחית!'), 'מדויק!', g('איזה גאון!', 'איזו גאונה!')];
  function pickPraise(c) { return HM.pick(PRAISE(c.g)); }

  function startMixed() {
    const pool = HM.LESSON_ORDER.filter((id) => HM.hasContent(id) && (ST().lesson(id).stars > 0 || ST().lesson(id).learned));
    go('practice', { mode: 'mixed', pool: pool.length >= 1 ? pool : HM.lessonsNow().filter(HM.hasContent).concat([ST().nextLesson()]).filter(Boolean) });
  }

  function screenPractice(params) {
    const c = C(), g = c.g, p = P();
    const mode = params.mode, MS = HM.MASTERY;
    let queue = null;
    if (mode === 'review') queue = HM.shuffle(p.mistakes.filter((m) => HM.hasContent(m.l))).slice(0, 10);
    const L = params.lessonId ? HM.LESSONS[params.lessonId] : null;
    // תרגול נושא: ממשיכים עד רף השליטה (או עד 12 שאלות בסבב). נושא שכבר נשלט: סבב חיזוק קצר
    const m0 = mode === 'practice' ? (ST().lesson(params.lessonId).mastery || 0) : 0;
    const maintain = mode === 'practice' && m0 >= MS.target;
    const total = mode === 'review' ? queue.length : mode === 'practice' ? (maintain ? 8 : 12) : 10;
    const S = { i: 0, streak: 0, wrongRun: 0, best: 0, results: [], t0: Date.now(), seen: new Set(), tries: 0, q: null, ctl: null, lessonOfQ: null, phase: 'answer', mastery: m0, reached: false };
    if (!total) { setTimeout(() => go('review'), 0); return el('<div></div>'); }
    const meter = mode === 'practice'
      ? `<div class="mmeter" title="מד השליטה בנושא"><div class="prog"><i style="width:${m0}%"></i></div><span class="mm-flag" style="right:${MS.target}%">${I('target')}</span><span class="mm-txt" dir="ltr">${Math.round(m0)}%</span></div>`
      : `<div class="prog"><i style="width:0"></i></div>`;
    const s = el(`<div class="screen full"><div class="pq-top"><button class="icon-btn" data-x aria-label="יציאה">${I('close')}</button>${meter}<div class="combo" aria-live="polite"></div></div>${mode === 'practice' ? `<div class="mm-cap">${maintain ? 'סבב חיזוק — כבר הגעת לרף השליטה בנושא' : `מד השליטה: ${g('הגע', 'הגיעי')} לדגל כדי לשלוט בנושא`}</div>` : ''}<div class="qwrap"></div><div class="check-zone"><button class="btn block" data-check disabled>בדיקה</button></div></div>`);
    const wrap = $('.qwrap', s), checkB = $('[data-check]', s), prog = $('.prog > i', s), combo = $('.combo', s), mmTxt = $('.mm-txt', s);
    let fbEl = null;
    $('[data-x]', s).addEventListener('click', () => {
      if (!S.results.length) return leave();
      confirmSheet(g('לצאת מהתרגול?', 'לצאת מהתרגול?'), mode === 'practice' ? 'מד השליטה שמור — אפשר להמשיך מאותה נקודה בפעם הבאה.' : 'הסבב הזה לא יסתיים.', 'יציאה', g('אני ממשיך!', 'אני ממשיכה!'), () => { finish(true); });
    });
    function leave() { if (mode === 'practice') go('world', { id: L.world }); else go(mode === 'review' ? 'review' : 'home'); }

    function makeQ() {
      let lessonId, level;
      if (mode === 'practice') lessonId = params.lessonId;
      else if (mode === 'review') lessonId = queue[S.i].l;
      else lessonId = HM.pick(params.pool);
      level = mode === 'review' ? Math.min(queue[S.i].v, ST().levelFor(lessonId) + 1) : ST().levelFor(lessonId);
      if (maintain) level = Math.max(2, level);
      const def = HM.CONTENT[lessonId];
      let q = null;
      for (let k = 0; k < 14; k++) {
        try { q = def.gen(c, level); } catch (e) { console.error(lessonId, e); q = null; continue; }
        const key = (q.prompt || '') + JSON.stringify(q.answer) + (q.left || '') + (q.right || '');
        if (!S.seen.has(key)) { S.seen.add(key); break; }
      }
      q.level = level;
      return { q, lessonId };
    }

    function setMeter(m) {
      if (mode !== 'practice') { prog.style.width = Math.round((S.i / total) * 100) + '%'; return; }
      prog.style.width = Math.min(100, m) + '%';
      prog.style.background = m >= MS.target ? 'var(--good)' : '';
      if (mmTxt) mmTxt.textContent = Math.round(m) + '%';
    }

    function renderQ() {
      S.phase = 'answer'; S.tries = 0;
      const { q, lessonId } = makeQ();
      S.q = q; S.lessonOfQ = lessonId;
      setMeter(S.mastery);
      const sub = mode === 'practice' ? L.title : HM.LESSONS[lessonId].title;
      const lvlName = ['', 'רמה 1 · בסיס', 'רמה 2 · מתקדם', 'רמה 3 · אתגר'][q.level];
      const card = el(`<article class="card qcard"><div class="q-meta"><span class="grow">${sub}</span><span class="q-lvl" title="${lvlName}">${[1, 2, 3].map((k) => `<i class="${q.level >= k ? 'on' : ''}"></i>`).join('')}</span><span class="tiny">${lvlName.split(' · ')[1]}</span></div><div class="q-prompt">${q.prompt}</div>${q.visual ? `<div class="q-vis">${q.visual}</div>` : ''}<div class="ans"></div></article>`);
      const sb = speakBtn(() => q.prompt + (q.type === 'tf' ? '. נכון או לא נכון?' : ''));
      if (sb) $('.q-meta', card).appendChild(sb);
      autoRead(q.prompt + (q.type === 'tf' ? '. נכון או לא נכון?' : ''));
      wrap.innerHTML = ''; wrap.appendChild(card);
      if (S.ctl && S.ctl.destroy) S.ctl.destroy();
      S.ctl = HM.engine.mount(card, $('.ans', card), q, () => { checkB.disabled = !(S.ctl && S.ctl.canCheck()) || S.phase !== 'answer'; });
      checkB.disabled = true; checkB.textContent = 'בדיקה';
      checkB.style.visibility = '';
    }

    function feedback(kind, title, bodyHtml, btnText, onBtn, mood) {
      if (fbEl) fbEl.remove();
      fbEl = el(`<div class="fb ${kind}" role="status"><div class="fb-in"><div class="fb-head"><div class="fb-m">${HM.art.mascot(mood)}</div><div class="grow"><div class="fb-title">${title}</div>${bodyHtml ? `<div class="fb-text">${bodyHtml}</div>` : ''}</div></div><div data-extra></div><button class="btn">${btnText}</button></div></div>`);
      $('.btn', fbEl).addEventListener('click', () => { fbEl.remove(); fbEl = null; onBtn(); });
      document.body.appendChild(fbEl);
      checkB.style.visibility = 'hidden';
      return fbEl;
    }
    function solHTML(q) { return q.solution && q.solution.length ? `<div class="fb-sol"><ol>${q.solution.map((x) => `<li>${x}</li>`).join('')}</ol></div>` : ''; }

    function record(ok) {
      const q = S.q;
      const before = S.mastery;
      const r = ST().answer(S.lessonOfQ, q.level, ok, S.tries);
      if (mode === 'practice') S.mastery = r.mastery;
      S.results.push({ ok, tries: S.tries, level: q.level });
      setMeter(S.mastery);
      const nextLevel = r.level;
      let note = '';
      if (mode === 'practice' && nextLevel > q.level) note = `${I('sparkle').replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"')} עולים לרמה ${nextLevel}!`;
      else if (mode === 'practice' && nextLevel < q.level) note = 'נתרגל רגע ברמה קלה יותר';
      if (mode === 'practice' && !maintain && before < MS.target && S.mastery >= MS.target) S.reached = true;
      return note;
    }

    function doCheck() {
      if (S.phase !== 'answer' || !S.ctl || !S.ctl.canCheck()) return;
      const q = S.q;
      S.tries++;
      const ok = S.ctl.check();
      if (ok) {
        S.ctl.lock(); S.phase = 'fb';
        S.streak++; S.wrongRun = 0; S.best = Math.max(S.best, S.streak);
        const note = record(true);
        if (mode === 'review') ST().fixMistake(S.lessonOfQ);
        const big = S.streak >= 3 && S.streak % 3 === 0;
        HM.sfx(big ? 'combo' : 'good'); HM.buzz(20);
        if (big) HM.confetti(0.5);
        combo.innerHTML = S.streak >= 2 ? `${I('flame')}${S.streak}` : '';
        let msg = big ? `${S.streak} ${g('ברצף! אתה בוער!', 'ברצף! את בוערת!')}` : (S.tries === 2 ? 'יפה שתיקנת!' : '');
        if (note) msg = msg ? msg + '<br>' + note : note;
        if (S.reached) msg = `${g('הגעת', 'הגעת')} לרף השליטה בנושא!`;
        const f = feedback('good', S.reached ? g('אתה שולט בזה!', 'את שולטת בזה!') : pickPraise(c), msg, S.reached ? 'לסיכום' : 'ממשיכים', next, big || S.reached ? 'party' : 'happy');
        if (S.reached) { HM.sfx('win'); HM.confetti(1.4); }
        if (q.solution && q.solution.length) {
          const t = el(`<button class="link" style="align-self:flex-start">${g('איך פותרים? הראה לי', 'איך פותרים? הראי לי')}</button>`);
          t.addEventListener('click', () => { t.replaceWith(el(solHTML(q))); });
          $('[data-extra]', f).appendChild(t);
        }
      } else if (S.tries < S.ctl.maxTries) {
        S.phase = 'fb';
        HM.sfx('soft'); HM.buzz([20, 40, 20]);
        const card = $('.qcard', wrap); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        feedback('try', 'כמעט!', q.hint || g('בדוק שוב את החישוב.', 'בדקי שוב את החישוב.'), 'אנסה שוב', () => { S.phase = 'answer'; S.ctl.retry(); checkB.style.visibility = ''; checkB.disabled = !S.ctl.canCheck(); }, 'think');
      } else {
        S.phase = 'fb';
        S.ctl.reveal();
        S.streak = 0; S.wrongRun++; combo.innerHTML = '';
        const note = record(false);
        if (mode !== 'review') ST().addMistake(S.lessonOfQ, q.level);
        HM.sfx('bad');
        const f = feedback('bad', HM.pick(['לא נורא!', 'זה בסדר לטעות', 'כמעט היה שם']), `התשובה הנכונה: <b>${HM.engine.answerHTML(q)}</b>${note ? '<br>' + note : ''}`, 'הבנתי, ממשיכים', next, 'oops');
        if (q.solution) $('[data-extra]', f).appendChild(el(solHTML(q)));
        if (S.wrongRun >= 2 && mode === 'practice') {
          const b = el(`<button class="link" style="align-self:flex-start">${I('book').replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-4px"')} ${g('רוצה', 'רוצה')} לחזור רגע להסבר?</button>`);
          b.addEventListener('click', () => { if (fbEl) fbEl.remove(); fbEl = null; finish(false, { toLearn: true }); });
          $('[data-extra]', f).appendChild(b);
        }
      }
    }
    function next() {
      S.i++;
      checkB.style.visibility = '';
      if (S.reached || S.i >= total) return finish();
      renderQ();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function finish(quit, opts) {
      if (!S.results.length) return quit ? leave() : go('learn', { id: params.lessonId });
      const sum = ST().finishSession({ lessonId: params.lessonId, mode, results: S.results, seconds: (Date.now() - S.t0) / 1000 });
      sum.masteryBefore = m0; sum.reached = S.reached; sum.maintain = maintain;
      if (opts && opts.toLearn) { toast('ההתקדמות נשמרה', 'check'); return go('learn', { id: params.lessonId }); }
      go('results', { sum, mode, lessonId: params.lessonId, seconds: (Date.now() - S.t0) / 1000, pool: params.pool });
    }
    checkB.addEventListener('click', doCheck);
    App.keyHandler = (e) => {
      if (fbEl) { if (e.key === 'Enter') { e.preventDefault(); $('.btn', fbEl).click(); } return; }
      if (e.key === 'Enter') { e.preventDefault(); doCheck(); return; }
      if (e.key === 'Tab' || e.key === ' ' || e.key === '/') e.preventDefault();
      if (S.ctl && S.ctl.key) S.ctl.key(e.key);
    };
    App.cleanup = () => { if (fbEl) fbEl.remove(); if (S.ctl && S.ctl.destroy) S.ctl.destroy(); };
    renderQ();
    return s;
  }

  /* ================= תוצאות ================= */
  function masteryBar(before, after) {
    const T = HM.MASTERY.target;
    return `<div class="mres"><div class="mres-track"><i class="mres-old" style="width:${Math.min(before, after)}%"></i><i class="mres-new" style="width:${after}%;${after >= T ? 'background:var(--good)' : ''}"></i><span class="mres-flag" style="right:${T}%">${I('target')}</span></div></div>`;
  }
  function screenResults({ sum, mode, lessonId, seconds, pool }) {
    const c = C(), g = c.g, T = HM.MASTERY.target;
    const practice = mode === 'practice';
    const after = practice ? sum.mastery : 0, before = practice ? (sum.masteryBefore || 0) : 0;
    const reached = practice && after >= T;
    let title;
    if (practice) title = sum.reached ? g('אתה שולט בנושא!', 'את שולטת בנושא!') : sum.maintain ? (sum.pct >= 0.7 ? 'חיזוק מצוין!' : 'טוב שחזרנו לזה') : after > before ? 'התקדמות יפה!' : g('אימון טוב!', 'אימון טוב!');
    else title = sum.pct >= 0.7 ? 'כל הכבוד!' : 'יפה מאוד!';
    const mood = sum.reached || sum.pct >= 0.7 ? 'party' : sum.pct >= 0.4 ? 'happy' : 'wave';
    const mm = Math.floor(seconds / 60), ss = Math.round(seconds % 60);
    const nextId = practice ? (() => { const i = HM.LESSON_ORDER.indexOf(lessonId); return HM.LESSON_ORDER.slice(i + 1).find((x) => HM.hasContent(x) && HM.LESSONS[x].world === HM.LESSONS[lessonId].world); })() : null;
    const left = Math.max(0, Math.ceil(T - after));
    const s = el(`<div class="screen"><div class="res">
      ${HM.art.mascot(mood).replace('<svg ', '<svg style="width:150px" ')}
      <h1>${title}</h1>
      ${practice ? `<div class="res-stars">${[1, 2, 3].map((k) => (k <= sum.stars ? I('star') : I('starOff')).replace('<svg', `<svg class="${k === 2 ? 's2' : ''}"`)).join('')}</div>` : ''}
      ${practice ? `<div class="card mres-card"><div class="row-c" style="justify-content:space-between"><b>מד השליטה בנושא</b><span class="mres-num" dir="ltr">${Math.round(before)}% → ${Math.round(after)}%</span></div>${masteryBar(before, after)}<p class="muted tiny">${reached ? `${g('הגעת', 'הגעת')} לרף השליטה (${T}%). הנושא יופיע מדי פעם בתרגול המעורב כדי לשמור על הכושר.` : `עוד ${left}% עד רף השליטה. ${after < HM.MASTERY.caps[1] ? 'ממשיכים לצבור בטחון ברמה הבסיסית, ואז השאלות יתקדמו.' : after < HM.MASTERY.caps[2] ? 'השאלות כבר ברמה מתקדמת — עוד קצת ומגיעים לאתגר.' : 'נשאר רק להצליח בשאלות האתגר!'}`}</p></div>` : `<p class="muted">${sum.correct} תשובות נכונות מתוך ${sum.n || ''}</p>`}
      <div class="res-grid"><div class="stat xp"><b dir="ltr">+${sum.xp}</b><small>נקודות</small></div><div class="stat acc"><b dir="ltr">${Math.round(sum.pct * 100)}%</b><small>הצלחה בסבב</small></div><div class="stat tm"><b dir="ltr">${mm}:${String(ss).padStart(2, '0')}</b><small>זמן</small></div></div>
      <div data-extra class="stack" style="width:100%;max-width:420px"></div>
      <div class="res-actions"></div></div></div>`);
    const extra = $('[data-extra]', s), acts = $('.res-actions', s);
    if (sum.levelUp) extra.appendChild(el(`<div class="new-badge">${HM.art.badgeArt('crown', '#ffc21a')}<div><b>${g('עלית', 'עלית')} לרמה ${sum.level.level}!</b><br><span class="muted tiny">${ST().titleOf(sum.level.level, c.gender)}</span></div></div>`));
    sum.newBadges.forEach((b) => extra.appendChild(el(`<div class="new-badge">${HM.art.badgeArt(b.glyph, b.color)}<div><b>תג חדש: ${b.name(g)}</b><br><span class="muted tiny">${b.desc(g)}</span></div></div>`)));
    if (sum.streakUp && ST().streakAlive() > 1) extra.appendChild(el(`<div class="new-badge">${HM.art.badgeArt('fire', '#ff8a3d')}<div><b>${ST().streakAlive()} ימים ברצף!</b><br><span class="muted tiny">${g('תחזור מחר כדי לשמור על האש', 'תחזרי מחר כדי לשמור על האש')}</span></div></div>`));
    const btn = (txt, cls, fn) => { const b = el(`<button class="btn block ${cls || ''}">${txt}</button>`); b.addEventListener('click', () => { HM.sfx('tap'); fn(); }); acts.appendChild(b); };
    if (practice) {
      if (!reached) btn(`${I('pencil')}${g('ממשיכים לתרגל עד הרף', 'ממשיכות לתרגל עד הרף')}`, '', () => go('practice', { mode: 'practice', lessonId }));
      if (reached && nextId) btn(`${I('play')}לנושא הבא: ${HM.LESSONS[nextId].title}`, '', () => lessonSheet(nextId));
      if (!reached && sum.pct < 0.5) btn(`${I('book')}חזרה להסבר`, 'sec', () => go('learn', { id: lessonId }));
      if (reached) btn(`${I('redo')}עוד סבב חיזוק`, 'sec', () => go('practice', { mode: 'practice', lessonId }));
      btn(`${I('map')}חזרה למפה`, 'sec', () => go('world', { id: HM.LESSONS[lessonId].world }));
    } else if (mode === 'mixed') {
      btn(`${I('sparkle')}עוד סבב מעורב`, '', () => go('practice', { mode: 'mixed', pool }));
      btn(`${I('map')}למפה`, 'sec', () => go('home'));
    } else {
      btn(`${I('redo')}לרשימת הטעויות`, '', () => go('review'));
      btn(`${I('map')}למפה`, 'sec', () => go('home'));
    }
    setTimeout(() => { if (sum.reached || sum.pct >= 0.7) { HM.sfx('win'); HM.confetti(sum.reached ? 1.6 : 1); } else HM.sfx('star'); if (sum.levelUp) setTimeout(() => HM.sfx('level'), 900); }, 250);
    return s;
  }

  /* ================= טעויות ================= */
  function screenReview() {
    const p = P(), g = C().g;
    const counts = ST().mistakeCounts();
    const ids = Object.keys(counts).filter((id) => HM.LESSONS[id]).sort((a, b) => counts[b] - counts[a]);
    const s = el(`<div class="screen"><div class="topbar"><span class="title grow">חזרה על טעויות</span></div><div data-body class="stack"></div></div>`);
    const body = $('[data-body]', s);
    if (!ids.length) {
      body.appendChild(el(`<div class="card empty">${HM.art.mascot('sleep', { cls: 'mascot-md' })}<h2>אין טעויות פתוחות</h2><p class="muted">${g('כל שאלה שתטעה בה תחכה כאן, ותוכל לתקן אותה מתי שתרצה.', 'כל שאלה שתטעי בה תחכה כאן, ותוכלי לתקן אותה מתי שתרצי.')}</p><button class="btn" data-home>${I('map')}למפה</button></div>`));
      $('[data-home]', body).addEventListener('click', () => go('home'));
      return s;
    }
    body.appendChild(el(`<div class="card tint"><div class="mascot-tip"><div class="mt-m">${HM.art.mascot('think')}</div><div class="bubble">טעויות הן הדרך הכי טובה ללמוד! ${g('בוא נתקן', 'בואי נתקן')} — על כל תשובה נכונה, שאלה יורדת מהרשימה.</div></div><button class="btn block" style="margin-top:14px" data-go>${I('redo')}${g('תקן', 'תקני')} ${Math.min(10, p.mistakes.length)} שאלות</button></div>`));
    $('[data-go]', body).addEventListener('click', () => go('practice', { mode: 'review' }));
    const list = el('<div class="card"></div>');
    ids.forEach((id) => {
      const L = HM.LESSONS[id], w = worldOf(L.world);
      const r = el(`<div class="mist-row ${HUE[w.hue]}"><span class="cnt-bubble">${counts[id]}</span><div class="grow"><b>${L.title}</b><br><span class="muted tiny">${w.title}</span></div><button class="btn sm sec">${I('book')}הסבר</button></div>`);
      $('.btn', r).addEventListener('click', () => go('learn', { id }));
      list.appendChild(r);
    });
    body.appendChild(list);
    return s;
  }

  /* ================= אתגר מהיר ================= */
  function sprintQ(level) {
    const r = HM.rnd, t = HM.op.times, dv = HM.op.div, mi = HM.op.minus;
    const kinds = level < 2 ? ['mul', 'mul', 'add', 'sub', 'div'] : level < 3 ? ['mul', 'div', 'add', 'sub', 'ten', 'half'] : ['mul', 'div', 'big', 'ten', 'dec', 'half'];
    switch (HM.pick(kinds)) {
      case 'mul': { const a = r(2, level < 2 ? 9 : 12), b = r(2, level < 2 ? 9 : 12); return { text: `${a} ${t} ${b}`, ans: a * b }; }
      case 'div': { const a = r(2, 10), b = r(2, 10); return { text: `${a * b} ${dv} ${a}`, ans: b }; }
      case 'add': { const a = r(11, 69), b = r(11, 29); return { text: `${a} + ${b}`, ans: a + b }; }
      case 'sub': { const a = r(30, 99), b = r(11, a - 5); return { text: `${a} ${mi} ${b}`, ans: a - b }; }
      case 'ten': { const a = r(3, 99), k = HM.pick([10, 100]); return { text: `${a} ${t} ${k}`, ans: a * k }; }
      case 'half': { const a = r(2, 40) * 2; return { text: `חצי של ${a} = ?`, ans: a / 2, word: true }; }
      case 'big': { const a = r(101, 499), b = r(101, 499); return { text: `${a} + ${b}`, ans: a + b }; }
      default: { const a = r(1, 8), b = r(1, 9 - a); return { text: `0.${a} + 0.${b}`, ans: HM.round((a + b) / 10), dec: true }; }
    }
  }
  function screenSprintIntro() {
    const p = P(), g = C().g;
    const s = el(`<div class="screen"><div class="topbar"><span class="title grow">אתגרים</span></div>
      <div class="stack">
        <div class="card stack center">${HM.art.mascot('wow').replace('<svg ', '<svg style="width:120px;margin:0 auto" ')}
          <h2>אתגר 60 שניות</h2>
          <p class="muted">חשבון בעל-פה: כפל, חילוק, חיבור וחיסור. ${g('הקלד', 'הקלידי')} את התשובה — כשהיא נכונה עוברים מיד לתרגיל הבא.</p>
          <div class="row" style="gap:10px"><span class="pill">${I('trophy')}השיא שלך: <span dir="ltr">${p.stats.sprintBest || 0}</span></span></div>
          <button class="btn acc block" data-go>${I('bolt')}מתחילים!</button></div>
        <div class="card list-card"><span class="qa-ic" style="background:var(--s-l);width:52px;height:52px;border-radius:16px;border:2px solid var(--ink);display:grid;place-items:center">${I('sparkle')}</span><div class="grow"><b>תרגול מעורב</b><br><span class="muted tiny">10 שאלות מכל הנושאים ${g('שלמדת', 'שלמדת')} — כדי לא לשכוח</span></div><button class="btn sm" data-mix>${I('play')}</button></div>
      </div></div>`);
    $('[data-go]', s).addEventListener('click', () => { HM.sfx('whoosh'); go('sprint'); });
    $('[data-mix]', s).addEventListener('click', () => { HM.sfx('whoosh'); startMixed(); });
    return s;
  }
  function screenSprint() {
    const g = C().g, DUR = 60;
    let score = 0, val = '', q = null, left = DUR, t0 = Date.now(), timer = null, misses = 0, done = false;
    const s = el(`<div class="screen full"><div class="sprint-top"><button class="icon-btn" data-x aria-label="יציאה">${I('close')}</button><div class="grow"></div><div class="sprint-score" aria-live="polite">0</div><div class="timer"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" fill="#fff" stroke="#e3e8ef" stroke-width="4"/><circle class="tr" cx="18" cy="18" r="15.5" fill="none" stroke="var(--p)" stroke-width="4" stroke-linecap="round" stroke-dasharray="97.4 97.4"/></svg><b>60</b></div></div>
      <div class="card qcard"><div class="sprint-q"></div><div class="num-display focus" style="margin:0 auto"><span class="v"></span></div></div><div class="ans" style="margin-top:14px"></div><div class="center" style="margin-top:12px"><button class="link" data-skip>דילוג</button></div></div>`);
    const qEl = $('.sprint-q', s), vEl = $('.num-display .v', s), scEl = $('.sprint-score', s), tr = $('.tr', s), tb = $('.timer b', s), card = $('.qcard', s);
    function newQ() { q = sprintQ(1 + Math.min(2, Math.floor(score / 6))); val = ''; qEl.innerHTML = q.word ? q.text : HM.m(q.text + ' ='); vEl.textContent = ''; }
    function onKey(k) {
      if (done) return;
      if (k === 'del') val = val.slice(0, -1);
      else if (k === '.') { if (val.indexOf('.') < 0) val = (val || '0') + '.'; }
      else if (/^\d$/.test(k) && val.length < 7) val += k;
      vEl.textContent = val;
      const target = String(q.ans);
      if (val && Math.abs(parseFloat(val) - q.ans) < 1e-9 && val[val.length - 1] !== '.') {
        score++; scEl.textContent = score; HM.sfx('good'); card.classList.remove('flash-ok'); void card.offsetWidth; card.classList.add('flash-ok'); newQ();
      } else if (val.replace('.', '').length >= target.replace('.', '').length && val !== target.slice(0, val.length)) {
        misses++; HM.sfx('soft'); card.classList.remove('flash-no'); void card.offsetWidth; card.classList.add('flash-no'); setTimeout(() => { if (!done) { val = ''; vEl.textContent = ''; } }, 250);
      } else HM.sfx('key');
    }
    $('.ans', s).appendChild((function () {
      const kp = document.createElement('div'); kp.className = 'keypad';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].forEach((k) => {
        const b = document.createElement('button'); b.className = 'key' + (k === 'del' || k === '.' ? ' fn' : ''); b.type = 'button';
        b.innerHTML = k === 'del' ? I('backspace') : k;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); onKey(k); });
        kp.appendChild(b);
      });
      return kp;
    })());
    $('[data-skip]', s).addEventListener('click', () => { if (!done) { misses++; newQ(); } });
    $('[data-x]', s).addEventListener('click', () => { done = true; go('sprintIntro'); });
    function end() {
      done = true; clearInterval(timer);
      const sum = ST().finishSession({ mode: 'sprint', results: Array.from({ length: score }, () => ({ ok: true, tries: 1, level: 1 })), seconds: DUR, sprintScore: score });
      const box = el(`<div class="res">${HM.art.mascot(score >= 10 ? 'party' : 'happy').replace('<svg ', '<svg style="width:140px" ')}<h1>${score} ${score === 1 ? 'תרגיל' : 'תרגילים'}!</h1><p class="muted">${sum.newBest ? g('שיא חדש! אתה מהיר כמו ברק.', 'שיא חדש! את מהירה כמו ברק.') : `השיא שלך: ${P().stats.sprintBest}`}</p><div class="res-grid"><div class="stat xp"><b dir="ltr">+${sum.xp}</b><small>נקודות</small></div><div class="stat acc"><b>${score}</b><small>נכונים</small></div><div class="stat tm"><b>${misses}</b><small>דילוגים וטעויות</small></div></div><div data-b class="stack" style="width:100%;max-width:420px"></div><div class="res-actions"><button class="btn acc block" data-a>${I('bolt')}עוד פעם!</button><button class="btn sec block" data-h>${I('map')}למפה</button></div></div>`);
      sum.newBadges.forEach((b) => $('[data-b]', box).appendChild(el(`<div class="new-badge">${HM.art.badgeArt(b.glyph, b.color)}<div><b>תג חדש: ${b.name(g)}</b></div></div>`)));
      s.innerHTML = ''; s.appendChild(box);
      $('[data-a]', box).addEventListener('click', () => go('sprint'));
      $('[data-h]', box).addEventListener('click', () => go('home'));
      HM.sfx(score >= 8 ? 'win' : 'star'); if (sum.newBest || score >= 12) HM.confetti(1.2);
    }
    timer = setInterval(() => {
      left = Math.max(0, DUR - (Date.now() - t0) / 1000);
      tb.textContent = Math.ceil(left); tr.setAttribute('stroke-dasharray', `${(left / DUR * 97.4).toFixed(1)} 97.4`);
      if (left <= 10) tr.setAttribute('stroke', 'var(--bad)');
      if (left <= 0) end();
    }, 200);
    App.cleanup = () => { done = true; clearInterval(timer); };
    App.keyHandler = (e) => { if (e.key === 'Backspace') onKey('del'); else if (e.key === '.' || /^\d$/.test(e.key)) onKey(e.key); };
    newQ();
    return s;
  }

  /* ---------- קול ---------- */
  function voiceNote(p) {
    const v = HM.currentVoice();
    if (!v) return 'לא נמצא קול עברי';
    if (!HM.hasVoiceFor(p.gender)) return `במכשיר הזה יש רק ${p.gender === 'f' ? 'קול גברי' : 'קול נשי'} בעברית. בדפדפן Microsoft Edge במחשב יש קולות טבעיים: הילה (נשי) ואברי (גברי).`;
    return `עכשיו מקריא: ${v.name.replace(/^Microsoft /, '').replace(/ - Hebrew.*$/, '')}`;
  }
  function sampleVoice() {
    const p = P();
    HM.speak(`היי ${p.name}! ככה אני ${p.gender === 'f' ? 'מקריאה' : 'מקריא'} לך. כמה זה שלושה רבעים מתוך עשרים? חמש-עשרה!`, { plain: true, force: true });
  }
  const autoRead = (html) => { const p = P(); if (p && p.settings.autoRead && p.settings.tts !== false && HM.canSpeak()) setTimeout(() => HM.speak(html, { force: true }), 350); };

  /* ================= פרופיל ================= */
  function screenProfile() {
    const p = P(), c = C(), g = c.g;
    const lv = ST().levelOf(p.xp);
    const themeIds = Object.keys(HM.THEMES).sort((a, b) => (HM.THEMES[a].g === p.gender ? 0 : 1) - (HM.THEMES[b].g === p.gender ? 0 : 1));
    const hrs = Math.floor(p.stats.seconds / 3600), mins = Math.round((p.stats.seconds % 3600) / 60);
    const s = el(`<div class="screen"><div class="topbar"><span class="title grow">הפרופיל שלי</span></div>
      <div class="card"><div class="prof-head"><span class="avatar lg">${p.avatar}</span><div class="grow"><h1>${esc(p.name)}</h1><div class="muted">${ST().titleOf(lv.level, p.gender)} · רמה ${lv.level}</div><div class="lvl-bar"><div class="bar-track"><div class="bar-fill" style="width:${Math.round(lv.into / lv.need * 100)}%;background:var(--a)"></div></div><span>${lv.into}/${lv.need}</span></div></div></div></div>
      <div class="res-grid" style="max-width:none;margin-top:14px;grid-template-columns:repeat(4,minmax(0,1fr))"><div class="stat"><b>${ST().totalStars(p)}</b><small>כוכבים</small></div><div class="stat"><b>${HM.fmt(p.stats.correct)}</b><small>תשובות נכונות</small></div><div class="stat"><b>${p.streak.best}</b><small>רצף שיא</small></div><div class="stat"><b>${hrs ? hrs + ':' + String(mins).padStart(2, '0') : mins + `'`}</b><small>${hrs ? 'שעות' : 'דקות'} תרגול</small></div></div>
      <div class="sec-title"><h2>התגים שלי</h2><span class="muted tiny">${Object.keys(p.badges).length}/${HM.BADGES.length}</span></div>
      <div class="badges">${HM.BADGES.map((b) => `<div class="badge-c ${p.badges[b.id] ? '' : 'locked'}" title="${esc(b.desc(g))}">${HM.art.badgeArt(b.glyph, b.color)}<span>${b.name(g)}</span></div>`).join('')}</div>
      <div class="sec-title"><h2>הגדרות</h2></div>
      <div class="card set-list">
        <div class="set-row"><div class="grow"><b>צלילים</b><small>צלילי הצלחה ומקלדת</small></div><input type="checkbox" class="switch" id="set-sound" ${p.settings.sound !== false ? 'checked' : ''} aria-label="צלילים"></div>
        ${HM.canSpeak() ? `<div class="set-row"><div class="grow"><b>הקראה בקול</b><small>כפתור רמקול ליד כל הסבר ושאלה</small></div><input type="checkbox" class="switch" id="set-tts" ${p.settings.tts !== false ? 'checked' : ''} aria-label="הקראה"></div>
        <div class="set-row"><div class="grow"><b>הקראה אוטומטית</b><small>כל שאלה והסבר יוקראו מיד כשהם מופיעים</small></div><input type="checkbox" class="switch" id="set-auto" ${p.settings.autoRead ? 'checked' : ''} aria-label="הקראה אוטומטית"></div>
        <div class="set-row" style="flex-wrap:wrap"><div class="grow" style="min-width:180px"><b>הקול המקריא</b><small>${voiceNote(p)}</small></div>
          <select class="sel" id="set-voice" aria-label="קול"><option value="">אוטומטי — ${p.gender === 'f' ? 'קול נשי' : 'קול גברי'} אם יש</option>${HM.hebrewVoices().map((v) => `<option value="${esc(v.name)}" ${p.settings.voice === v.name ? 'selected' : ''}>${esc(v.name.replace(/^Microsoft /, '').replace(/ - Hebrew.*$/, ''))}${v.gender ? (v.gender === 'f' ? ' · נשי' : ' · גברי') : ''}</option>`).join('')}</select>
          <div class="seg"><button data-rate="normal" class="${p.settings.rate !== 'slow' ? 'on' : ''}">רגיל</button><button data-rate="slow" class="${p.settings.rate === 'slow' ? 'on' : ''}">לאט</button></div>
          <button class="btn sm sec" data-try>${I('speaker')}השמעה</button></div>` : ''}
        <div class="set-row"><div class="grow"><b>יעד יומי</b><small>נקודות ביום</small></div><div class="seg">${[30, 50, 100].map((v) => `<button data-goal="${v}" class="${(p.goal || 50) === v ? 'on' : ''}">${v}</button>`).join('')}</div></div>
        <div class="set-row" style="flex-direction:column;align-items:stretch"><div><b>צבעי האפליקציה</b></div><div class="themes">${themeIds.map((id) => { const t = HM.THEMES[id]; return `<button class="theme-c ${p.theme === id ? 'on' : ''}" data-t="${id}"><span class="theme-sw"><i style="background:${t.p}"></i><i style="background:${t.s}"></i><i style="background:${t.a}"></i></span>${t.name}</button>`; }).join('')}</div></div>
        <div class="set-row"><div class="grow"><b>פרטים אישיים</b><small>שם, דמות ותחומי עניין</small></div><button class="btn sm sec" data-edit>${I('pencil')}עריכה</button></div>
        <div class="set-row"><div class="grow"><b>מה לומדים עכשיו בכיתה</b><small>${(p.classNow || []).filter((id) => HM.LESSONS[id]).map((id) => HM.LESSONS[id].title).join(' · ') || 'עוד לא נבחר'}</small></div><button class="btn sm sec" data-class>${I('calendar')}בחירה</button></div>
        <div class="set-row" style="flex-wrap:wrap"><div class="grow" style="min-width:180px"><b>ספרי הלימוד בכיתה</b><small>עם ה.ש.ב.ח.ה יופיעו גם מספרי העמודים בספר והצעות לפי לוח הזמנים</small></div><div class="seg"><button data-book="hashbacha" class="${p.book === 'hashbacha' ? 'on' : ''}">ה.ש.ב.ח.ה</button><button data-book="other" class="${p.book !== 'hashbacha' ? 'on' : ''}">ספרים אחרים</button></div></div>
        <div class="set-row"><div class="grow"><b>אזור ההורים</b><small>התקדמות, הסבר על האפליקציה, החומר והמלצות לתרגול</small></div><button class="btn sm sec" data-report>${I('chart')}להורים</button></div>
        <div class="set-row"><div class="grow"><b>מי לומד עכשיו?</b><small>${p.cloud ? 'מעבר לילד אחר במשפחה' : 'כמה ילדים על אותו מכשיר'}</small></div><button class="btn sm sec" data-switch>${I('swap')}החלפה</button></div>
        ${HM.cloud && HM.cloud.enabled ? '' : '<!--'}<div class="set-row"><div class="grow"><b>חשבון המשפחה</b><small>${p.cloud ? 'ההתקדמות נשמרת בענן ומסונכרנת בין המכשירים' : 'עכשיו ההתקדמות נשמרת רק במכשיר הזה. הורים יכולים להירשם ולשמור אותה בענן'}</small></div><button class="btn sm sec" data-account>${I('user')}${p.cloud ? 'ניהול' : 'הרשמה להורים'}</button></div>${HM.cloud && HM.cloud.enabled ? '' : '-->'}
      </div>
      <p class="center" style="margin-top:18px"><button class="link" data-del style="color:var(--bad-d)">מחיקת הפרופיל</button></p>
    </div>`);
    $('#set-sound', s).addEventListener('change', (e) => { ST().update((x) => (x.settings.sound = e.target.checked)); HM.sfx('tap'); });
    const ttsSw = $('#set-tts', s); if (ttsSw) ttsSw.addEventListener('change', (e) => ST().update((x) => (x.settings.tts = e.target.checked)));
    const auto = $('#set-auto', s); if (auto) auto.addEventListener('change', (e) => ST().update((x) => (x.settings.autoRead = e.target.checked)));
    const sel = $('#set-voice', s); if (sel) sel.addEventListener('change', () => { ST().update((x) => (x.settings.voice = sel.value)); sampleVoice(); });
    $$('[data-rate]', s).forEach((b) => b.addEventListener('click', () => { ST().update((x) => (x.settings.rate = b.dataset.rate)); $$('[data-rate]', s).forEach((y) => y.classList.toggle('on', y === b)); sampleVoice(); }));
    const tr = $('[data-try]', s); if (tr) tr.addEventListener('click', sampleVoice);
    $$('[data-goal]', s).forEach((b) => b.addEventListener('click', () => { ST().update((x) => (x.goal = +b.dataset.goal)); HM.sfx('tap'); go('profile', {}, { keepScroll: true }); }));
    $$('[data-t]', s).forEach((b) => b.addEventListener('click', () => { ST().update((x) => (x.theme = b.dataset.t)); HM.applyTheme(b.dataset.t); HM.sfx('tap'); go('profile', {}, { keepScroll: true }); }));
    $('[data-report]', s).addEventListener('click', () => go('parents'));
    $('[data-class]', s).addEventListener('click', () => classPicker(() => go('profile', {}, { keepScroll: true })));
    $$('[data-book]', s).forEach((b) => b.addEventListener('click', () => { ST().update((x) => (x.book = b.dataset.book)); HM.sfx('tap'); go('profile', {}, { keepScroll: true }); }));
    $('[data-switch]', s).addEventListener('click', () => go(p.cloud ? 'family' : 'profiles'));
    const acc = $('[data-account]', s); if (acc) acc.addEventListener('click', () => (p.cloud ? App.openManage && App.openManage() : go('auth', { mode: 'signup' })));
    if (p.cloud) { const dl = $('[data-del]', s); if (dl) dl.parentElement.remove(); }
    $('[data-edit]', s).addEventListener('click', editProfile);
    $('[data-del]', s).addEventListener('click', () => confirmSheet(`למחוק את הפרופיל של ${esc(p.name)}?`, 'כל הכוכבים, התגים וההתקדמות יימחקו מהמכשיר הזה. אי אפשר לבטל את זה.', 'מחיקה', 'ביטול', () => {
      ST().remove(p.id); const n = P(); if (n) { HM.applyTheme(n.theme); go('home'); } else go('onboard');
    }));
    return s;
  }

  function editProfile() {
    const p = P();
    const st = { name: p.name, avatar: p.avatar, gender: p.gender, interests: p.interests.slice() };
    const box = el('<div class="stack"></div>');
    let close;
    function render() {
      const g = (m, f) => (st.gender === 'f' ? f : m);
      box.innerHTML = `<h2>עריכת פרטים</h2>
        <input class="field" id="ed-name" maxlength="16" value="${esc(st.name)}" aria-label="שם">
        <div class="seg" style="align-self:center"><button data-g="m" class="${st.gender === 'm' ? 'on' : ''}">בן</button><button data-g="f" class="${st.gender === 'f' ? 'on' : ''}">בת</button></div>
        <div class="pick-grid" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:6px">${HM.AVATARS.map((a) => `<button class="pick avatar-pick ${st.avatar === a ? 'on' : ''}" data-a="${a}" style="font-size:30px;padding:6px">${a}</button>`).join('')}</div>
        <p class="muted tiny">תחומי עניין (עד 3):</p>
        <div class="int-grid">${HM.INTERESTS.map((x) => `<button class="int ${st.interests.indexOf(x.id) >= 0 ? 'on' : ''}" data-i="${x.id}">${HM.art.INT_ICONS[x.icon]}<span>${x.label}</span></button>`).join('')}</div>
        <button class="btn block" data-save>${g('שמור', 'שמרי')}</button>`;
      $('#ed-name', box).addEventListener('input', (e) => (st.name = e.target.value));
      $$('[data-g]', box).forEach((b) => b.addEventListener('click', () => { st.gender = b.dataset.g; render(); }));
      $$('[data-a]', box).forEach((b) => b.addEventListener('click', () => { st.avatar = b.dataset.a; render(); }));
      $$('[data-i]', box).forEach((b) => b.addEventListener('click', () => { const i = st.interests.indexOf(b.dataset.i); if (i >= 0) st.interests.splice(i, 1); else { if (st.interests.length >= 3) st.interests.shift(); st.interests.push(b.dataset.i); } render(); }));
      $('[data-save]', box).addEventListener('click', () => {
        const genderChanged = st.gender !== p.gender;
        ST().update((x) => { x.name = st.name.trim() || x.name; x.avatar = st.avatar; x.gender = st.gender; x.interests = st.interests; if (genderChanged && HM.THEMES[x.theme].g !== st.gender) x.theme = HM.defaultTheme(st.gender); });
        HM.applyTheme(P().theme); close(); toast('נשמר!', 'check'); go('profile');
      });
    }
    render();
    close = sheet(box);
  }

  /* ================= דוח התקדמות ================= */
  function screenReport() {
    const p = P();
    const s = el(`<div class="screen"><div class="topbar"><button class="icon-btn" data-back aria-label="חזרה">${I('back')}</button><span class="title grow">דוח התקדמות — ${esc(p.name)}</span></div><div class="stack" data-b></div></div>`);
    $('[data-back]', s).addEventListener('click', () => go('profile'));
    const b = $('[data-b]', s);
    const allIds = HM.LESSON_ORDER;
    const practiced = allIds.filter((id) => ST().lesson(id).sessions > 0);
    const strong = practiced.filter((id) => ST().lesson(id).mastery >= 80);
    const weak = practiced.filter((id) => ST().lesson(id).mastery < 50);
    b.appendChild(el(`<div class="res-grid" style="max-width:none"><div class="stat"><b>${practiced.length}/${allIds.length}</b><small>נושאים שתורגלו</small></div><div class="stat acc"><b>${strong.length}</b><small>בשליטה (80%+)</small></div><div class="stat" style="background:var(--bad-l)"><b>${weak.length}</b><small>כדאי לחזק</small></div></div>`));
    if (weak.length) b.appendChild(el(`<div class="card tint"><b>כדאי לחזק:</b> ${weak.map((id) => HM.LESSONS[id].title).join(' · ')}</div>`));
    HM.WORLDS.forEach((w) => {
      const card = el(`<div class="card ${HUE[w.hue]}"><h2 style="margin-bottom:8px">${w.title}</h2><table class="report"><tbody></tbody></table></div>`);
      const tb = $('tbody', card);
      w.units.forEach((u) => {
        tb.appendChild(el(`<tr class="rp-unit"><td colspan="3">${u.title}</td></tr>`));
        u.lessons.forEach((L) => {
          const st = ST().lesson(L.id);
          tb.appendChild(el(`<tr><td>${L.title}${L.extra ? ' <span class="tag-extra">משרד החינוך</span>' : ''}<br><span class="muted tiny">${st.sessions ? `${st.sessions} תרגולים` : (st.learned ? 'נלמד, טרם תורגל' : 'טרם התחיל')}</span></td><td class="rp-bar"><div class="bar-track"><div class="bar-fill" style="width:${st.mastery || 0}%;background:${(st.mastery || 0) >= 80 ? 'var(--good)' : (st.mastery || 0) >= 50 ? 'var(--a)' : 'var(--bad)'}"></div></div></td><td style="white-space:nowrap">${[1, 2, 3].map((k) => (st.stars >= k ? I('star') : I('starOff')).replace('<svg', '<svg style="width:16px;height:16px"')).join('')}</td></tr>`));
        });
      });
      b.appendChild(card);
    });
    return s;
  }

  /* ================= אזור ההורים ================= */
  const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  function relDay(ts) {
    if (!ts) return 'טרם תורגל';
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(ts); d1.setHours(0, 0, 0, 0);
    const n = Math.round((d0 - d1) / 86400000);
    return n <= 0 ? 'היום' : n === 1 ? 'אתמול' : n < 7 ? `לפני ${n} ימים` : `${d1.getDate()}.${d1.getMonth() + 1}`;
  }
  const mins = (sec) => Math.round((sec || 0) / 60);
  function lastDays(p, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = ST().todayKey(d);
      out.push({ d, k, v: (p.days && p.days[k]) || { q: 0, c: 0, sec: 0, s: 0 } });
    }
    return out;
  }
  const WORLD_BLURB = {
    naturals: 'מספרים גדולים עד מיליונים, ארבע פעולות החשבון כולל חילוק ארוך, סדר פעולות, בעיות מילוליות, מספרים ראשוניים וחזקות, חוקיות בסדרות, השיטה הרומית — וחקר נתונים: שכיח, ממוצע ודיאגרמות.',
    fractions: 'משמעות השבר, שבר מכמות ("כמה זה 5/7 מתוך 70"), שברים גדולים מ-1 ומספרים מעורבים, הרחבה וצמצום, מכנה משותף, חיבור וחיסור של שברים ומספרים מעורבים כולל חיסור בהמרה, וכפל שבר במספר שלם.',
    decimals: 'עשיריות, מאיות ואלפיות, השוואה וסידור, חיבור וחיסור (גם במאונך), מעבר בין שברים פשוטים לעשרוניים, המרת יחידות מידה, עיגול, והיכרות ראשונה עם אחוזים.',
    geometry: 'מרובעים ותכונותיהם (מקבילית, מלבן, מעוין, ריבוע), זוויות ומעלות, שושנת הרוחות, אלכסונים וסימטריה, מצולעים משוכללים וריצוף, גבהים במשולש ובמקבילית, והיקף ושטח של מלבן, מקבילית, משולש וטרפז.',
  };

  function screenParents(params) {
    if (params && params.peek) ST().peek(params.peek);
    App.cleanup = () => ST().peek(null);
    const p = P(), c = C(), g = c.g, nm = esc(p.name);
    const kids = ST().all();
    let tab = (params && params.tab) || 'progress';
    const s = el(`<div class="screen parents">
      <div class="topbar"><button class="icon-btn" data-back aria-label="חזרה">${I('back')}</button><span class="title grow">להורים</span>${HM.cloud && HM.cloud.user ? `<button class="btn sm sec" data-manage>${I('user')}ניהול המשפחה</button>` : ''}</div>
      ${kids.length > 1 ? `<div class="kid-chips" role="tablist" aria-label="בחירת ילד">${kids.map((x) => `<button data-kid="${x.id}" class="${x.id === p.id ? 'on' : ''}"><span>${x.avatar}</span>${esc(x.name)}</button>`).join('')}</div>` : ''}
      <div class="seg par-tabs" role="tablist">
        <button data-tab="progress">התקדמות</button><button data-tab="how">איך זה עובד</button><button data-tab="material">החומר</button><button data-tab="practice">כמה לתרגל</button>
      </div>
      <div data-body class="stack" style="margin-top:14px"></div></div>`);
    $('[data-back]', s).addEventListener('click', () => { ST().peek(null); go((params && params.from) || (P() ? 'home' : 'family')); });
    const mg = $('[data-manage]', s); if (mg) mg.addEventListener('click', () => App.openManage && App.openManage());
    $$('[data-kid]', s).forEach((b) => b.addEventListener('click', () => { HM.sfx('tap'); go('parents', { tab, peek: b.dataset.kid, from: params && params.from }); }));
    const body = $('[data-body]', s);
    function render() {
      $$('[data-tab]', s).forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
      body.innerHTML = '';
      ({ progress: tabProgress, how: tabHow, material: tabMaterial, practice: tabPractice })[tab](body);
    }
    $$('[data-tab]', s).forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; HM.sfx('tap'); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));

    /* ---------- התקדמות ---------- */
    function tabProgress(box) {
      const week = lastDays(p, 7), two = lastDays(p, 14);
      const wq = week.reduce((a, d) => a + d.v.q, 0), wc = week.reduce((a, d) => a + d.v.c, 0), ws = week.reduce((a, d) => a + d.v.sec, 0);
      const activeDays = week.filter((d) => d.v.s > 0).length;
      const all = HM.LESSON_ORDER.filter((id) => HM.hasContent(id));
      const T = HM.MASTERY.target;
      const mastered = all.filter((id) => (ST().lesson(id).mastery || 0) >= T);
      const inProg = all.filter((id) => ST().lesson(id).sessions > 0 && (ST().lesson(id).mastery || 0) < T);
      const overall = p.stats.answered ? Math.round((p.stats.correct / p.stats.answered) * 100) : null;
      box.appendChild(el(`<div class="card par-hello"><div class="row-c"><span class="avatar lg" style="width:72px;height:72px;font-size:42px">${p.avatar}</span><div class="grow"><h2>ההתקדמות של ${nm}</h2><p class="muted">רמה ${ST().levelOf(p.xp).level} · ${HM.fmt(p.xp)} נקודות · ${p.stats.sessions} סבבי תרגול מאז ההתחלה</p></div></div></div>`));
      box.appendChild(el(`<div class="kpis">
        <div class="kpi"><b dir="ltr">${mins(ws)}</b><span>דקות תרגול השבוע</span></div>
        <div class="kpi"><b dir="ltr">${wq}</b><span>שאלות השבוע</span></div>
        <div class="kpi"><b dir="ltr">${wq ? Math.round((wc / wq) * 100) + '%' : '—'}</b><span>הצלחה השבוע</span></div>
        <div class="kpi"><b dir="ltr">${activeDays}/7</b><span>ימים עם תרגול</span></div>
        <div class="kpi good"><b dir="ltr">${mastered.length}</b><span>נושאים בשליטה</span></div>
        <div class="kpi warn"><b dir="ltr">${inProg.length}</b><span>נושאים בתהליך</span></div>
        <div class="kpi"><b dir="ltr">${overall == null ? '—' : overall + '%'}</b><span>הצלחה מאז ההתחלה</span></div>
        <div class="kpi"><b dir="ltr">${ST().streakAlive()}</b><span>ימים ברצף (שיא: ${p.streak.best})</span></div>
      </div>`));
      // גרף פעילות 14 יום
      const maxM = Math.max(20, ...two.map((d) => mins(d.v.sec)));
      const goalLine = 15;
      box.appendChild(el(`<div class="card"><div class="row-c" style="justify-content:space-between;flex-wrap:wrap"><h3>דקות תרגול ב-14 הימים האחרונים</h3><span class="muted tiny">הקו המקווקו: 15 דקות, ההמלצה ליום תרגול</span></div>
        <div class="act-chart"><span class="act-goal" style="bottom:${(goalLine / maxM) * 100}%"></span>${two.map((d) => { const mm = mins(d.v.sec); return `<div class="act-col" title="${d.d.getDate()}.${d.d.getMonth() + 1}: ${mm} דקות, ${d.v.q} שאלות"><span class="act-v">${mm || ''}</span><i style="height:${Math.max(mm ? 4 : 0, (mm / maxM) * 100)}%" class="${d.k === ST().todayKey() ? 'today' : ''}"></i><small>${DAY_LETTERS[d.d.getDay()]}<br>${d.d.getDate()}.${d.d.getMonth() + 1}</small></div>`; }).join('')}</div>
        ${p.stats.sessions && !p.days ? '<p class="muted tiny">היומן היומי מתחיל להיאסף מהיום — התרגולים הקודמים מופיעים בסיכומים הכלליים.</p>' : ''}</div>`));
      // תובנות
      const ins = [];
      if (activeDays < 4) ins.push(`<li>${I('calendar')}<span>${activeDays === 0 ? `${nm} לא ${g('תרגל', 'תרגלה')} בשבוע האחרון.` : `${nm} ${g('תרגל', 'תרגלה')} ${activeDays === 1 ? 'יום אחד' : activeDays + ' ימים'} בשבוע האחרון.`} ההמלצה היא 4–5 ימים בשבוע, 15–20 דקות בכל פעם.</span></li>`);
      else ins.push(`<li>${I('flame')}<span>${activeDays} ימי תרגול בשבוע האחרון — קצב מצוין.</span></li>`);
      const weak = all.filter((id) => ST().lesson(id).sessions > 0 && (ST().lesson(id).mastery || 0) < 50).sort((a, b) => (ST().lesson(a).mastery || 0) - (ST().lesson(b).mastery || 0)).slice(0, 4);
      if (weak.length) ins.push(`<li>${I('target')}<span><b>כדאי לחזק:</b> ${weak.map((id) => `${HM.LESSONS[id].title} (${Math.round(ST().lesson(id).mastery || 0)}%)`).join(' · ')}</span></li>`);
      const recent = mastered.filter((id) => ST().lesson(id).masteredAt && Date.now() - ST().lesson(id).masteredAt < 14 * 86400000);
      if (recent.length) ins.push(`<li>${I('star')}<span><b>הגיע לרף השליטה לאחרונה:</b> ${recent.map((id) => HM.LESSONS[id].title).join(' · ')}</span></li>`.replace('הגיע', g('הגיע', 'הגיעה')));
      const mc = ST().mistakeCounts(), mTot = Object.values(mc).reduce((a, b) => a + b, 0);
      if (mTot) ins.push(`<li>${I('redo')}<span>${mTot} שאלות מחכות בלשונית "טעויות". כדאי לעבור עליהן פעם-פעמיים בשבוע.</span></li>`);
      const cls = (p.classNow || []).filter((id) => HM.LESSONS[id]);
      if (cls.length) ins.push(`<li>${I('book')}<span><b>בכיתה עכשיו:</b> ${cls.map((id) => `${HM.LESSONS[id].title} — ${Math.round(ST().lesson(id).mastery || 0)}% שליטה`).join(' · ')}</span></li>`);
      else ins.push(`<li>${I('book')}<span>עוד לא סומן מה לומדים עכשיו בכיתה. כדאי לסמן במסך הבית ("מה לומדים עכשיו בכיתה?") — כך התרגול יתמקד בחומר הנוכחי.</span></li>`);
      box.appendChild(el(`<div class="card"><h3>מה כדאי לדעת</h3><ul class="insights">${ins.join('')}</ul></div>`));
      // טבלת נושאים
      const tbl = el(`<div class="card"><h3>כל הנושאים</h3><p class="muted tiny" style="margin-bottom:8px">מד השליטה: רף השליטה הוא ${T}%. "הצלחה" = אחוז התשובות הנכונות בנושא.</p><div data-w></div></div>`);
      HM.WORLDS.forEach((w, wi) => {
        const det = el(`<details class="acc ${HUE[w.hue]}" ${wi === 0 ? 'open' : ''}><summary><span class="acc-dot"></span><b>${w.title}</b><span class="muted tiny">${w.units.reduce((n, u) => n + u.lessons.filter((l) => (ST().lesson(l.id).mastery || 0) >= T).length, 0)} מתוך ${w.units.reduce((n, u) => n + u.lessons.length, 0)} בשליטה</span></summary><table class="report"><tbody></tbody></table></details>`);
        const tb = $('tbody', det);
        w.units.forEach((u) => {
          tb.appendChild(el(`<tr class="rp-unit"><td colspan="4">${u.title}</td></tr>`));
          u.lessons.forEach((L) => {
            const st = ST().lesson(L.id), m0 = Math.round(st.mastery || 0);
            const acc = st.q ? Math.round((st.c / st.q) * 100) + '%' : '—';
            tb.appendChild(el(`<tr><td>${L.title}${L.extra ? ' <span class="tag-extra">משרד החינוך</span>' : ''}<br><span class="muted tiny">${st.sessions ? `${st.sessions} סבבים · ${relDay(st.lastAt || st.last)}` : (st.learned ? 'קרא/ה את ההסבר, טרם תרגל/ה'.replace('קרא/ה', g('קרא', 'קראה')).replace('תרגל/ה', g('תרגל', 'תרגלה')) : 'טרם התחיל')}</span></td><td class="rp-bar"><div class="bar-track"><div class="bar-fill" style="width:${m0}%;background:${m0 >= T ? 'var(--good)' : m0 >= 50 ? 'var(--a)' : m0 > 0 ? 'var(--bad)' : 'transparent'}"></div></div></td><td class="num" dir="ltr">${m0}%</td><td class="num muted" dir="ltr">${acc}</td></tr>`));
          });
        });
        $('[data-w]', tbl).appendChild(det);
      });
      box.appendChild(tbl);
      // תרגולים אחרונים
      const log = (p.log || []).slice(0, 8);
      const modeName = { practice: 'תרגול', review: 'חזרה על טעויות', mixed: 'תרגול מעורב', sprint: 'אתגר 60 שניות' };
      box.appendChild(el(`<div class="card"><h3>תרגולים אחרונים</h3>${log.length ? `<table class="report log"><tbody>${log.map((x) => `<tr><td>${x.l && HM.LESSONS[x.l] ? HM.LESSONS[x.l].title : modeName[x.m] || ''}<br><span class="muted tiny">${relDay(x.t)}, ${new Date(x.t).toTimeString().slice(0, 5)}</span></td><td class="num" dir="ltr">${x.c}/${x.n}</td><td class="num muted">${Math.max(1, mins(x.sec))} דק׳</td><td class="num" dir="ltr">${x.ma != null ? Math.round(x.ma) + '%' : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">עוד אין תרגולים ביומן.</p>'}</div>`));
      const foot = el(`<div class="card par-foot"><p class="muted tiny">${p.cloud ? 'הנתונים נשמרים בחשבון המשפחה ומסונכרנים בין המכשירים.' : 'הנתונים נשמרים רק בדפדפן במכשיר הזה.'}</p><div class="row-c" style="flex-wrap:wrap"><button class="btn sm sec" data-export>${I('list')}הורדת כל המידע</button><span class="legal-links">${HM.legalLinks ? HM.legalLinks() : ''}</span></div></div>`);
      $('[data-export]', foot).addEventListener('click', () => HM.exportData && HM.exportData());
      box.appendChild(foot);
    }

    /* ---------- איך זה עובד ---------- */
    function tabHow(box) {
      const T = HM.MASTERY;
      const sec = (ic, title, html) => `<div class="card how"><div class="how-ic">${I(ic)}</div><div class="grow"><h3>${title}</h3><div class="how-t">${html}</div></div></div>`;
      box.innerHTML = [
        sec('map', 'המבנה', `חשבוניה בנויה מארבעה עולמות — אחד לכל ספר בכיתה ה׳: <b>עיר המספרים</b> (מספרים טבעיים וחקר נתונים), <b>ממלכת השברים</b>, <b>כוכב העשרוניים</b> ו<b>אי הצורות</b> (גיאומטריה). בכל עולם יש יחידות, ובכל יחידה נושאים לפי סדר הלימוד.`),
        sec('book', 'שלושה שלבים בכל נושא', `<b>1. הסבר:</b> כרטיסים קצרים עם המחשות, דוגמה פתורה שנחשפת צעד אחר צעד, ולעיתים שאלת בדיקה קטנה.<br><b>2. תרגול:</b> שאלות שנוצרות מחדש בכל פעם — כך אי אפשר "לזכור תשובות", ויש אינסוף תרגול.<br><b>3. סיכום:</b> כוכבים, מד שליטה והמלצה להמשך.`),
        sec('sparkle', 'התרגול מתאים את עצמו', `השאלות מתחילות ברמה 1 (בסיס). אחרי כ-3 תשובות נכונות ברצף עולים רמה, ואחרי טעות חוזרים לשאלות קלות יותר. כך ${nm} ${g('מתרגל', 'מתרגלת')} תמיד מעט מעל מה ש${g('הוא', 'היא')} כבר ${g('יודע', 'יודעת')} — לא קל מדי ולא מתסכל. המיקום נשמר, והתרגול הבא ממשיך מאותה נקודה.`),
        sec('target', 'מד השליטה', `לכל נושא מד מ-0% עד 100%. שאלות ברמה 1 ממלאות אותו עד ${T.caps[1]}%, ברמה 2 עד ${T.caps[2]}%, ורק הצלחה בשאלות האתגר (רמה 3) מביאה ל<b>רף השליטה — ${T.target}%</b>. טעות מורידה מעט מהמד, כדי שישקף את המצב העדכני.<br>כוכבים: ★ ב-${T.stars[0]}%, ★★ ב-${T.stars[1]}%, ★★★ ב-${T.stars[2]}%.`),
        sec('bulb', 'כשטועים', `טעות ראשונה — רמז שמכוון בלי לגלות את התשובה. טעות שנייה — התשובה הנכונה ופתרון מלא שלב אחר שלב. כל טעות נשמרת בלשונית <b>טעויות</b>; תשובה נכונה בחזרה מוציאה אותה מהרשימה. אחרי שתי טעויות ברצף מוצע לחזור להסבר.`),
        sec('user', 'התאמה אישית', `הפנייה לפי שם ומגדר בכל משפט, ערכת צבעים לבחירה, שאלות מילוליות שנבנות סביב תחומי העניין שנבחרו (מכדורגל ועד קיי-פופ, הארי פוטר וסקווישים), והנושאים שלומדים כרגע בכיתה מופיעים ראשונים.`),
        sec('trophy', 'מוטיבציה', `נקודות, רמות, תגים, יעד יומי, רצף ימים ואתגר 60 שניות — כדי לבנות הרגל של תרגול קצר וקבוע, בלי תחרות מול ילדים אחרים.`),
        sec('lock', 'פרטיות', `אין הרשמה ואין חשבון. כל הנתונים נשמרים <b>רק בדפדפן במכשיר הזה</b> ולא נשלחים לשום מקום. מחיקת נתוני הדפדפן תמחק גם את ההתקדמות. אפשר כמה פרופילים (כמה ילדים) על אותו מכשיר.`),
      ].join('');
    }

    /* ---------- החומר ---------- */
    function tabMaterial(box) {
      box.appendChild(el(`<div class="card"><h3>על החומר</h3><p class="how-t">התכנים בנויים לפי פריסת תכנית הלימודים לכיתה ה׳ של סדרת ה.ש.ב.ח.ה, התואמת את תכנית משרד החינוך במתמטיקה (2006), שעדיין בתוקף בכיתה ה׳. נוספו 4 נושאים מתכנית המשרד שלא מופיעים בפריסה, והם מסומנים <span class="tag-extra">משרד החינוך</span>.<br>גם בכיתות שלומדות מספרים אחרים הנושאים זהים — רק הסדר עשוי להיות שונה. לכן אפשר לסמן במסך הבית מה לומדים עכשיו בכיתה.</p></div>`));
      HM.WORLDS.forEach((w, wi) => {
        const n = w.units.reduce((a, u) => a + u.lessons.length, 0);
        const det = el(`<details class="acc card ${HUE[w.hue]}" ${wi === 0 ? 'open' : ''}><summary><span class="acc-dot"></span><b>${w.title}</b><span class="muted tiny">${n} נושאים · מתוך הספר "${w.book}"</span></summary><p class="how-t" style="margin:8px 0 4px">${WORLD_BLURB[w.id]}</p></details>`);
        w.units.forEach((u) => {
          det.appendChild(el(`<div class="mat-unit"><h4>${u.title}</h4>${u.lessons.map((L) => `<div class="mat-l"><b>${L.title}</b>${L.extra ? ' <span class="tag-extra">משרד החינוך</span>' : ''}${p.book === 'hashbacha' && L.pages ? ` <span class="muted tiny">· עמ' ${L.pages}</span>` : ''}<span class="muted">${L.skills.join(' · ')}</span></div>`).join('')}</div>`));
        });
        box.appendChild(det);
      });
    }

    /* ---------- כמה לתרגל ---------- */
    function tabPractice(box) {
      const he = g('הוא', 'היא');
      box.innerHTML = `
        <div class="card rec"><div class="rec-big"><b dir="ltr">15–20</b><span>דקות ביום</span></div><div class="rec-big"><b dir="ltr">4–5</b><span>ימים בשבוע</span></div><p class="how-t">סבב תרגול אחד (10–12 שאלות) לוקח בערך 8–12 דקות. כלומר שניים-שלושה סבבים ביום רגיל, או סבב אחד ביום עמוס. היעד היומי (בפרופיל: 30, 50 או 100 נקודות) עוזר לשמור על הקצב — 50 נקודות הן בערך סבב תרגול אחד.</p></div>
        <div class="card"><h3>למה קצר ותכוף?</h3><p class="how-t">תרגול שמתפזר על פני כמה ימים נשמר בזיכרון טוב יותר מתרגול ארוך ומרוכז ביום אחד. גם הריכוז של ילדים בגיל הזה טוב יותר בפרקי זמן קצרים — עדיף לסיים כש${he} עוד ${g('נהנה', 'נהנית')}.</p></div>
        <div class="card"><h3>שבוע תרגול מומלץ</h3><ol class="how-list">
          <li><b>ברוב הימים</b> — הנושא שלומדים עכשיו בכיתה, עד שמגיעים לרף השליטה (${HM.MASTERY.target}%).</li>
          <li><b>פעם-פעמיים בשבוע</b> — חזרה על טעויות.</li>
          <li><b>פעם בשבוע</b> — תרגול מעורב (בלשונית "אתגרים"), כדי לא לשכוח נושאים שכבר נלמדו.</li>
          <li><b>כחימום</b> — אתגר 60 שניות, לשמירה על עובדות כפל וחילוק בעל-פה.</li></ol></div>
        <div class="card"><h3>איך לעזור בבית</h3><ul class="how-list">
          <li>בנושא חדש — לשבת יחד בדקות הראשונות ולעבור יחד על כרטיסי ההסבר.</li>
          <li>לבקש מ${nm} להסביר איך ${g('פתר', 'פתרה')}. הסבר בקול מחזק את ההבנה.</li>
          <li>לשבח מאמץ והתמדה, לא מהירות או "כישרון".</li>
          <li>טעויות הן חלק מהלמידה. כדאי לעבור יחד על לשונית הטעויות ועל הפתרונות המלאים.</li>
          <li>לפני מבחן — לתרגל את נושאי המבחן עד רף השליטה, ובסוף סבב תרגול מעורב.</li></ul></div>
        <div class="card"><h3>מתי כדאי לעצור ולבדוק</h3><ul class="how-list">
          <li>תסכול שחוזר על עצמו, או רצון לוותר באמצע סבב.</li>
          <li>אחוז הצלחה מתחת ל-50% לאורך כמה סבבים באותו נושא, או מד שליטה שתקוע ברמה 1 אחרי שני סבבים.</li>
          <li>במצבים כאלה כדאי לחזור יחד להסבר, לפתור כמה שאלות ביחד, ואם צריך — להתייעץ עם המורה.</li></ul>
          <p class="muted tiny" style="margin-top:8px">כל הנתונים האלה מופיעים בלשונית "התקדמות".</p></div>`;
    }
    render();
    return s;
  }

  const SCREENS = { onboard: screenOnboard, profiles: screenProfiles, home: screenHome, world: screenWorld, learn: screenLearn, practice: screenPractice, results: screenResults, review: screenReview, sprintIntro: screenSprintIntro, sprint: screenSprint, profile: screenProfile, report: screenParents, parents: screenParents };

  /* ---------- הפעלה ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (document.querySelector('.sheet-bg')) return;
    if (App.keyHandler) App.keyHandler(e);
  });
  function localBoot() {
    const p = P();
    if (p) { HM.applyTheme(p.theme); const h = (location.hash || '').slice(1); go(['review', 'sprintIntro', 'profile'].indexOf(h) >= 0 ? h : 'home'); }
    else { HM.applyTheme('ocean'); go('onboard'); }
  }
  App.localBoot = localBoot;
  App.boot = localBoot; // מודול החשבונות (account.js) מחליף את זה באתחול עם ענן
  App.ui = { el, $, $$, sheet, confirmSheet, toast, I, esc, tabbar };
  App.screens = SCREENS;
  const start = () => App.boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})(HM);
