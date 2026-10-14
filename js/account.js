/* חשבוניה — מסכי חשבון: ברוכים הבאים, הרשמה וכניסה של הורים, "מי לומד עכשיו?", קוד הילד וניהול המשפחה */
(function (HM) {
  'use strict';
  const App = HM.app;
  const { el, $, $$, sheet, confirmSheet, toast, I, esc } = App.ui;
  const ST = () => HM.store;
  const go = (n, p, o) => App.go(n, p, o);
  const C = HM.cloud;

  HM.legalLinks = () => `<a href="legal/terms.html" target="_blank" rel="noopener">תנאי שימוש</a> · <a href="legal/privacy.html" target="_blank" rel="noopener">מדיניות פרטיות</a> · <a href="legal/accessibility.html" target="_blank" rel="noopener">הצהרת נגישות</a>`;
  const legalFoot = () => `<p class="legal-links center">${HM.legalLinks()}</p>`;
  const busy = (btn, on, label) => { btn.disabled = on; if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = `<span class="spin"></span>${label || ''}`; } else if (btn.dataset.label) btn.innerHTML = btn.dataset.label; };
  const errBox = (box, msg) => { const e = $('.form-err', box); if (e) { e.textContent = msg || ''; e.hidden = !msg; } };
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  /* ================= ברוכים הבאים ================= */
  function screenWelcome() {
    HM.applyTheme('ocean');
    const s = el(`<div class="onb">
      <div class="onb-body">
        <div class="stack center">${HM.art.mascot('wave', { cls: 'hero-mascot' })}<div class="splash-title">חשבוניה</div>
        <p class="splash-sub">תרגול חשבון אישי לכיתה ה׳ — לפי תכנית הלימודים.<br>הסברים, תרגול שמתאים את עצמו, ומד שליטה בכל נושא.</p></div>
      </div>
      <div class="stack">
        <button class="btn block" data-signup>${I('user')}הרשמה להורים</button>
        <button class="btn block sec" data-login>כבר נרשמנו — כניסה</button>
        <button class="link center" data-try>לנסות בלי הרשמה (נשמר רק במכשיר הזה)</button>
        ${legalFoot()}
      </div></div>`);
    $('[data-signup]', s).addEventListener('click', () => go('auth', { mode: 'signup' }));
    $('[data-login]', s).addEventListener('click', () => go('auth', { mode: 'login' }));
    $('[data-try]', s).addEventListener('click', () => go('onboard'));
    return s;
  }

  /* ================= הרשמה / כניסה ================= */
  function screenAuth(params) {
    let mode = params.mode || 'login';
    const s = el('<div class="onb auth"></div>');
    function render() {
      const titles = { signup: 'הרשמה להורים', login: 'כניסה לחשבון', forgot: 'איפוס סיסמה', newpass: 'סיסמה חדשה', sent: 'כמעט סיימנו!' };
      s.innerHTML = `<div class="onb-top"><button class="icon-btn" data-back aria-label="חזרה">${I('back')}</button><span class="grow"></span></div>
        <div class="onb-body"><div class="stack">
          <div class="mascot-tip"><div class="mt-m">${HM.art.mascot(mode === 'sent' ? 'party' : 'happy')}</div><h1>${titles[mode]}</h1></div>
          <form class="auth-form stack" novalidate></form>
        </div></div>${legalFoot()}`;
      $('[data-back]', s).addEventListener('click', () => (mode === 'forgot' ? (mode = 'login', render()) : go(ST().current() ? 'profile' : 'welcome')));
      const f = $('form', s);
      const field = (id, label, type, extra) => `<label class="fld" for="${id}"><span>${label}</span><input id="${id}" type="${type}" ${extra || ''}></label>`;
      if (mode === 'signup') {
        f.innerHTML = `<p class="muted">החשבון שומר את ההתקדמות של הילדים בענן, כך שאפשר לתרגל מכל מכשיר ולעקוב מהטלפון. אחרי ההרשמה מוסיפים את הילדים — הם לא צריכים דוא"ל.</p>
          ${field('a-name', 'איך לקרוא לך? (לא חובה)', 'text', 'autocomplete="given-name" maxlength="40"')}
          ${field('a-email', 'דוא"ל', 'email', 'autocomplete="email" dir="ltr" required')}
          ${field('a-pass', 'סיסמה (לפחות 8 תווים)', 'password', 'autocomplete="new-password" dir="ltr" minlength="8" required')}
          <label class="consent"><input type="checkbox" id="a-ok" required><span>קראתי את <a href="legal/terms.html" target="_blank" rel="noopener">תנאי השימוש</a> ואת <a href="legal/privacy.html" target="_blank" rel="noopener">מדיניות הפרטיות</a> והם מקובלים עליי. אני ההורה או האפוטרופוס של הילדים שאוסיף לחשבון.</span></label>
          <p class="form-err" role="alert" hidden></p>
          <button class="btn block" type="submit">יצירת החשבון</button>
          <button class="link" type="button" data-sw="login">כבר יש לנו חשבון — כניסה</button>`;
      } else if (mode === 'login') {
        f.innerHTML = `${field('a-email', 'דוא"ל', 'email', 'autocomplete="email" dir="ltr" required')}
          ${field('a-pass', 'סיסמה', 'password', 'autocomplete="current-password" dir="ltr" required')}
          <p class="form-err" role="alert" hidden></p>
          <button class="btn block" type="submit">כניסה</button>
          <div class="row-c" style="justify-content:space-between;flex-wrap:wrap"><button class="link" type="button" data-sw="forgot">שכחתי סיסמה</button><button class="link" type="button" data-sw="signup">עוד אין חשבון? הרשמה</button></div>`;
      } else if (mode === 'forgot') {
        f.innerHTML = `<p class="muted">נשלח קישור לאיפוס הסיסמה לכתובת הדוא"ל של החשבון.</p>
          ${field('a-email', 'דוא"ל', 'email', 'autocomplete="email" dir="ltr" required')}
          <p class="form-err" role="alert" hidden></p>
          <button class="btn block" type="submit">שליחת קישור</button>`;
      } else if (mode === 'newpass') {
        f.innerHTML = `${field('a-pass', 'סיסמה חדשה (לפחות 8 תווים)', 'password', 'autocomplete="new-password" dir="ltr" minlength="8" required')}
          <p class="form-err" role="alert" hidden></p>
          <button class="btn block" type="submit">שמירה</button>`;
      } else {
        f.innerHTML = `<p class="lead">שלחנו מייל לאישור הכתובת אל <b dir="ltr">${esc(params.email || '')}</b>.</p>
          <p class="muted">פתחו את המייל ולחצו על הקישור (אם הוא לא מגיע — בדקו גם בתיקיית הספאם). אחר כך חוזרים לכאן ונכנסים לחשבון.</p>
          <p class="form-err" role="alert" hidden></p>
          <button class="btn block" type="button" data-sw="login">לכניסה לחשבון</button>
          <button class="link" type="button" data-resend>לא קיבלנו מייל — שליחה מחדש</button>`;
      }
      $$('[data-sw]', f).forEach((b) => b.addEventListener('click', () => { mode = b.dataset.sw; render(); }));
      const rs = $('[data-resend]', f);
      if (rs) rs.addEventListener('click', async () => {
        try { await C.client.auth.resend({ type: 'signup', email: params.email, options: { emailRedirectTo: location.origin + location.pathname } }); toast('נשלח שוב', 'check'); } catch (e) { errBox(f, C.heError(e)); }
      });
      const first = $('input', f); if (first) setTimeout(() => first.focus(), 80);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('button[type="submit"]', f); if (!btn) return;
        const email = ($('#a-email', f) || {}).value, pass = ($('#a-pass', f) || {}).value;
        errBox(f, '');
        if ((mode === 'signup' || mode === 'login' || mode === 'forgot') && !validEmail((email || '').trim())) return errBox(f, 'כתובת הדוא"ל לא תקינה.');
        if ((mode === 'signup' || mode === 'newpass') && (pass || '').length < 8) return errBox(f, 'הסיסמה צריכה להיות באורך 8 תווים לפחות.');
        if (mode === 'signup' && !$('#a-ok', f).checked) return errBox(f, 'כדי להירשם צריך לאשר את תנאי השימוש ואת מדיניות הפרטיות.');
        busy(btn, true);
        try {
          if (mode === 'signup') {
            const r = await C.signUp({ email: email.trim(), password: pass, name: ($('#a-name', f).value || '').trim() });
            if (r.needsConfirm) { params.email = email.trim(); mode = 'sent'; render(); return; }
            await afterLogin();
          } else if (mode === 'login') { await C.signIn({ email: email.trim(), password: pass }); await afterLogin(); }
          else if (mode === 'forgot') { await C.sendReset(email.trim()); busy(btn, false); toast('אם יש חשבון עם הכתובת הזו — שלחנו אליה קישור', 'check'); mode = 'login'; render(); }
          else if (mode === 'newpass') { await C.setPassword(pass); toast('הסיסמה עודכנה', 'check'); await afterLogin(); }
        } catch (err) { busy(btn, false); errBox(f, err.message || C.heError(err)); }
      });
    }
    render();
    return s;
  }
  async function afterLogin() {
    try { await C.pull(); } catch (e) { console.warn(e); }
    go('family');
  }

  /* ================= מי לומד עכשיו? ================= */
  function screenFamily() {
    HM.applyTheme('ocean');
    const name = C.user && C.user.user_metadata && C.user.user_metadata.display_name;
    const s = el(`<div class="screen family">
      <div class="topbar"><div class="brand grow">${HM.art.logo}חשבוניה</div><button class="btn sm sec" data-parents>${I('chart')}להורים</button></div>
      <h1 class="fam-title">מי לומד עכשיו?</h1>
      <div class="kids-grid" data-kids></div>
      <div data-import></div>
      <div class="fam-actions">
        <button class="btn sec" data-manage>${I('user')}ניהול המשפחה</button>
        <button class="link" data-out>יציאה מהחשבון${C.user ? ` (${esc(name || C.user.email)})` : ''}</button>
      </div>
      ${legalFoot()}</div>`);
    const grid = $('[data-kids]', s);
    function renderKids() {
      const kids = ST().cloudProfiles();
      grid.innerHTML = '';
      if (!kids.length) {
        grid.appendChild(el(`<div class="card empty" style="grid-column:1/-1">${HM.art.mascot('wave', { cls: 'mascot-md' })}<h2>ברוכים הבאים!</h2><p class="muted">כדי להתחיל, מוסיפים את הילדים למשפחה: שם פרטי, דמות וקוד בן 4 ספרות.</p><button class="btn" data-add>${I('plus')}הוספת ילד או ילדה</button></div>`));
        $('[data-add]', grid).addEventListener('click', () => openManage({ add: true }));
        return;
      }
      kids.forEach((k) => {
        const t = HM.THEMES[k.theme] || HM.THEMES[HM.defaultTheme(k.gender)];
        const lv = ST().levelOf(k.xp || 0).level;
        const b = el(`<button class="kid" style="--p:${t.p};--p-l:${t.pl}"><span class="kid-av">${k.avatar}</span><b>${esc(k.name)}</b><small>${k.setupDone ? `רמה ${lv}` : 'חדש בחשבוניה'}</small></button>`);
        b.addEventListener('click', () => { HM.sfx('tap'); pinSheet(k); });
        grid.appendChild(b);
      });
    }
    renderKids();
    // התקדמות שנשמרה במכשיר בלי חשבון — אפשר לצרף לחשבון
    const locals = ST().localProfiles();
    if (locals.length && C.user) {
      const card = el(`<div class="card tint imp"><b>יש במכשיר הזה התקדמות שנשמרה בלי חשבון:</b> ${locals.map((x) => `${x.avatar} ${esc(x.name)}`).join(' · ')}<p class="muted tiny">אפשר לצרף אותה לחשבון המשפחה ולהמשיך מאותה נקודה. אחר כך כדאי לקבוע קוד לכל ילד בניהול המשפחה.</p><button class="btn sm" data-imp>${I('plus')}צירוף לחשבון</button></div>`);
      $('[data-imp]', card).addEventListener('click', async (e) => {
        const btn = e.currentTarget; busy(btn, true);
        try {
          for (const lp of locals) {
            const row = await C.addChild({ name: lp.name.slice(0, 30), gender: lp.gender, avatar: lp.avatar, data: Object.assign(C.payload(lp), { setupDone: true }) });
            ST().removeLocal(lp.id); ST().addFromRow(row);
          }
          toast('ההתקדמות צורפה לחשבון', 'check'); go('family');
        } catch (err) { busy(btn, false); toast(err.message, 'close'); }
      });
      $('[data-import]', s).appendChild(card);
    }
    $('[data-parents]', s).addEventListener('click', () => { const k = ST().cloudProfiles()[0]; if (!k) return openManage({ add: true }); go('parents', { peek: k.id, from: 'family' }); });
    $('[data-manage]', s).addEventListener('click', () => openManage());
    $('[data-out]', s).addEventListener('click', () => confirmSheet('לצאת מהחשבון?', 'ההתקדמות שמורה בענן. כדי להמשיך במכשיר הזה תצטרכו להתחבר שוב.', 'יציאה', 'ביטול', async () => {
      try { await C.signOut(); } catch (e) { /* */ }
      ST().clearCloud(); go(ST().current() ? 'home' : 'welcome');
    }));
    // רענון שקט מהענן
    if (navigator.onLine !== false) C.pull().then(renderKids).catch(() => {});
    return s;
  }

  /* ---------- קוד הילד ---------- */
  let wrong = 0, lockedUntil = 0;
  function pinSheet(k) {
    if (!k.pinHash) return enterChild(k);
    let code = '';
    const box = el(`<div class="stack center pin">
      <span class="kid-av lg">${k.avatar}</span>
      <h2>היי ${esc(k.name)}! מה הקוד שלך?</h2>
      <div class="pin-dots" aria-live="polite">${'<i></i>'.repeat(4)}</div>
      <p class="form-err" role="alert" hidden></p>
      <div class="keypad pin-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((d) => (d === '' ? '<span></span>' : `<button class="key${d === 'del' ? ' fn' : ''}" data-d="${d}" aria-label="${d === 'del' ? 'מחיקה' : d}">${d === 'del' ? I('backspace') : d}</button>`)).join('')}</div>
      <p class="muted tiny">שכחת את הקוד? ההורים יכולים לקבוע קוד חדש בניהול המשפחה.</p></div>`);
    const close = sheet(box);
    const dots = $$('.pin-dots i', box);
    const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < code.length));
    async function press(d) {
      if (Date.now() < lockedUntil) return errBox(box, `יותר מדי ניסיונות. אפשר לנסות שוב בעוד ${Math.ceil((lockedUntil - Date.now()) / 1000)} שניות.`);
      if (d === 'del') code = code.slice(0, -1); else if (code.length < 4) code += d;
      HM.sfx('key'); paint();
      if (code.length === 4) {
        const h = await C.hashPin(k.id, code);
        if (h === k.pinHash) { wrong = 0; close(); enterChild(k); }
        else {
          wrong++; HM.sfx('bad'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
          if (wrong >= 5) { lockedUntil = Date.now() + 30000; wrong = 0; }
          errBox(box, 'הקוד לא נכון. אפשר לנסות שוב.'); code = ''; setTimeout(paint, 250);
        }
      }
    }
    $$('[data-d]', box).forEach((b) => b.addEventListener('click', () => press(b.dataset.d)));
    const onKey = (e) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); };
    document.addEventListener('keydown', onKey);
    const obs = new MutationObserver(() => { if (!document.body.contains(box)) { document.removeEventListener('keydown', onKey); obs.disconnect(); } });
    obs.observe(document.body, { childList: true });
  }
  function enterChild(k) {
    ST().unlock(k.id);
    HM.applyTheme(k.theme || HM.defaultTheme(k.gender));
    HM.sfx('whoosh');
    go(k.setupDone ? 'home' : 'onboard', k.setupDone ? {} : { setup: k.id });
  }

  /* ================= ניהול המשפחה (מוגן בסיסמת ההורה) ================= */
  function openManage(opts) {
    if (!C.user) return go('auth', { mode: 'login' });
    if (C.gateOpen()) return go('manage', opts || {});
    const box = el(`<form class="stack" novalidate><h2>ניהול המשפחה</h2><p class="muted">כדי להיכנס לניהול צריך את סיסמת ההורה.</p>
      <label class="fld" for="g-pass"><span>סיסמה</span><input id="g-pass" type="password" dir="ltr" autocomplete="current-password"></label>
      <p class="form-err" role="alert" hidden></p><button class="btn block" type="submit">כניסה לניהול</button></form>`);
    const close = sheet(box);
    setTimeout(() => $('#g-pass', box).focus(), 80);
    box.addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = $('button', box); busy(btn, true);
      try { await C.verifyPassword($('#g-pass', box).value); close(); go('manage', opts || {}); }
      catch (err) { busy(btn, false); errBox(box, err.message); }
    });
  }
  App.openManage = openManage;

  function screenManage(params) {
    HM.applyTheme('ocean');
    const s = el(`<div class="screen manage">
      <div class="topbar"><button class="icon-btn" data-back aria-label="חזרה">${I('back')}</button><span class="title grow">ניהול המשפחה</span></div>
      <div class="card"><div class="row-c" style="justify-content:space-between;flex-wrap:wrap"><h3>הילדים</h3><button class="btn sm" data-add>${I('plus')}הוספה</button></div><div data-list class="kid-list"></div></div>
      <div class="card set-list">
        <div class="set-row"><div class="grow"><b>החשבון</b><small dir="ltr" style="display:block;text-align:right">${esc(C.user ? C.user.email : '')}</small></div><button class="btn sm sec" data-out>יציאה</button></div>
        <div class="set-row"><div class="grow"><b>שינוי סיסמה</b></div><button class="btn sm sec" data-pass>שינוי</button></div>
        <div class="set-row"><div class="grow"><b>הורדת כל המידע</b><small>קובץ עם כל הנתונים שנשמרו על הילדים</small></div><button class="btn sm sec" data-export>${I('list')}הורדה</button></div>
        <div class="set-row"><div class="grow"><b>מחיקת החשבון</b><small>מוחק לצמיתות את החשבון ואת כל המידע על הילדים</small></div><button class="btn sm bad" data-delacc>מחיקה</button></div>
      </div>${legalFoot()}</div>`);
    $('[data-back]', s).addEventListener('click', () => go('family'));
    const list = $('[data-list]', s);
    function renderList() {
      const kids = ST().cloudProfiles();
      list.innerHTML = kids.length ? '' : '<p class="muted">עוד אין ילדים בחשבון.</p>';
      kids.forEach((k) => {
        const r = el(`<div class="kid-row"><span class="kid-av sm">${k.avatar}</span><div class="grow"><b>${esc(k.name)}</b><small>${k.gender === 'f' ? 'בת' : 'בן'} · ${k.pinHash ? 'יש קוד' : '<span style="color:var(--bad-d)">אין קוד</span>'}</small></div>
          <button class="btn sm sec" data-edit>עריכה</button><button class="btn sm sec" data-pin>קוד</button><button class="icon-btn" data-rm aria-label="מחיקת ${esc(k.name)}">${I('close')}</button></div>`);
        $('[data-edit]', r).addEventListener('click', () => childForm(k, renderList));
        $('[data-pin]', r).addEventListener('click', () => pinForm(k, renderList));
        $('[data-rm]', r).addEventListener('click', () => confirmSheet(`למחוק את ${esc(k.name)}?`, 'כל ההתקדמות, הכוכבים והתגים יימחקו לצמיתות — בענן ובכל המכשירים.', 'מחיקה', 'ביטול', async () => {
          try { await C.removeChild(k.id); ST().removeLocal(k.id); toast('נמחק', 'check'); renderList(); } catch (e) { toast(e.message, 'close'); }
        }));
        list.appendChild(r);
      });
    }
    renderList();
    $('[data-add]', s).addEventListener('click', () => childForm(null, renderList));
    if (params && params.add) setTimeout(() => childForm(null, renderList), 200);
    $('[data-out]', s).addEventListener('click', async () => { try { await C.signOut(); } catch (e) { /* */ } ST().clearCloud(); go(ST().current() ? 'home' : 'welcome'); });
    $('[data-export]', s).addEventListener('click', () => HM.exportData());
    $('[data-pass]', s).addEventListener('click', () => {
      const box = el(`<form class="stack" novalidate><h2>סיסמה חדשה</h2><label class="fld" for="np"><span>לפחות 8 תווים</span><input id="np" type="password" dir="ltr" autocomplete="new-password"></label><p class="form-err" role="alert" hidden></p><button class="btn block" type="submit">שמירה</button></form>`);
      const close = sheet(box);
      box.addEventListener('submit', async (e) => { e.preventDefault(); const v = $('#np', box).value; if (v.length < 8) return errBox(box, 'לפחות 8 תווים.'); try { await C.setPassword(v); close(); toast('הסיסמה עודכנה', 'check'); } catch (err) { errBox(box, err.message); } });
    });
    $('[data-delacc]', s).addEventListener('click', () => {
      const box = el(`<form class="stack" novalidate><h2>מחיקת החשבון</h2><p>החשבון וכל המידע על הילדים יימחקו לצמיתות ולא יהיה אפשר לשחזר אותם. כדאי קודם להוריד את המידע.</p><label class="fld" for="dc"><span>כדי לאשר, כתבו: מחיקה</span><input id="dc" type="text" autocomplete="off"></label><p class="form-err" role="alert" hidden></p><div class="sheet-actions"><button class="btn bad" type="submit">מחיקה לצמיתות</button><button class="btn sec" type="button" data-c>ביטול</button></div></form>`);
      const close = sheet(box);
      $('[data-c]', box).addEventListener('click', close);
      box.addEventListener('submit', async (e) => {
        e.preventDefault(); if ($('#dc', box).value.trim() !== 'מחיקה') return errBox(box, 'צריך לכתוב בדיוק: מחיקה');
        try { await C.deleteAccount(); ST().clearCloud(); close(); toast('החשבון נמחק', 'check'); go(ST().current() ? 'home' : 'welcome'); } catch (err) { errBox(box, err.message); }
      });
    });
    return s;
  }

  // טופס ילד: הוספה או עריכה
  function childForm(k, done) {
    const st = { name: k ? k.name : '', gender: k ? k.gender : null, avatar: k ? k.avatar : HM.AVATARS[0] };
    const box = el('<form class="stack" novalidate></form>');
    let close;
    function render() {
      box.innerHTML = `<h2>${k ? 'עריכת פרטים' : 'הוספת ילד או ילדה'}</h2>
        <label class="fld" for="c-name"><span>שם פרטי</span><input id="c-name" type="text" maxlength="20" autocomplete="off" value="${esc(st.name)}"></label>
        <div><span class="fld-l">הפנייה בתוך האפליקציה</span><div class="seg"><button type="button" data-g="f" class="${st.gender === 'f' ? 'on' : ''}">בת</button><button type="button" data-g="m" class="${st.gender === 'm' ? 'on' : ''}">בן</button></div></div>
        <div><span class="fld-l">דמות</span><div class="pick-grid" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:6px">${HM.AVATARS.map((a) => `<button type="button" class="pick avatar-pick ${st.avatar === a ? 'on' : ''}" data-a="${a}" style="font-size:28px;padding:6px">${a}</button>`).join('')}</div></div>
        ${k ? '' : `<label class="fld" for="c-pin"><span>קוד כניסה — 4 ספרות שהילד יזכור</span><input id="c-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" dir="ltr" autocomplete="off"></label>`}
        <p class="form-err" role="alert" hidden></p>
        <button class="btn block" type="submit">${k ? 'שמירה' : 'הוספה למשפחה'}</button>`;
      $('#c-name', box).addEventListener('input', (e) => (st.name = e.target.value));
      $$('[data-g]', box).forEach((b) => b.addEventListener('click', () => { st.name = $('#c-name', box).value; st.gender = b.dataset.g; render(); }));
      $$('[data-a]', box).forEach((b) => b.addEventListener('click', () => { st.name = $('#c-name', box).value; st.avatar = b.dataset.a; render(); }));
    }
    render();
    close = sheet(box);
    box.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#c-name', box).value.trim(), pinEl = $('#c-pin', box), pin = pinEl ? pinEl.value.trim() : '';
      if (!name) return errBox(box, 'צריך שם פרטי.');
      if (!st.gender) return errBox(box, 'צריך לבחור בת או בן — כדי שנפנה נכון.');
      if (!k && !/^\d{4}$/.test(pin)) return errBox(box, 'הקוד צריך להיות 4 ספרות.');
      const btn = $('button[type="submit"]', box); busy(btn, true);
      try {
        if (k) {
          await C.updateChild(k.id, { name, gender: st.gender, avatar: st.avatar });
          ST().updateById(k.id, (x) => { x.name = name; x.gender = st.gender; x.avatar = st.avatar; });
        } else {
          const row = await C.addChild({ name, gender: st.gender, avatar: st.avatar, data: {} });
          const h = await C.hashPin(row.id, pin);
          await C.updateChild(row.id, { pin_hash: h });
          row.pin_hash = h; ST().addFromRow(row);
        }
        close(); toast(k ? 'נשמר' : `${name} ${st.gender === 'f' ? 'נוספה' : 'נוסף'} למשפחה!`, 'check'); done && done();
      } catch (err) { busy(btn, false); errBox(box, err.message); }
    });
  }
  function pinForm(k, done) {
    const box = el(`<form class="stack" novalidate><h2>קוד חדש ל${esc(k.name)}</h2><label class="fld" for="p1"><span>4 ספרות</span><input id="p1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" dir="ltr" autocomplete="off"></label><p class="form-err" role="alert" hidden></p><button class="btn block" type="submit">שמירה</button></form>`);
    const close = sheet(box);
    setTimeout(() => $('#p1', box).focus(), 80);
    box.addEventListener('submit', async (e) => {
      e.preventDefault(); const pin = $('#p1', box).value.trim();
      if (!/^\d{4}$/.test(pin)) return errBox(box, 'הקוד צריך להיות 4 ספרות.');
      try { const h = await C.hashPin(k.id, pin); await C.updateChild(k.id, { pin_hash: h }); ST().updateById(k.id, (x) => (x.pinHash = h)); close(); toast('הקוד עודכן', 'check'); done && done(); }
      catch (err) { errBox(box, err.message); }
    });
  }

  /* ---------- הורדת כל המידע (זכות עיון) ---------- */
  HM.exportData = function () {
    const out = { app: 'חשבוניה', exportedAt: new Date().toISOString(), account: C.user ? { email: C.user.email, created_at: C.user.created_at } : null, children: ST().all().map((p) => Object.assign({ id: p.id, name: p.name, gender: p.gender, avatar: p.avatar }, C.payload ? C.payload(p) : p)) };
    try {
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'heshboniya-data.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { toast('ההורדה לא נתמכת בדפדפן הזה', 'close'); }
  };

  Object.assign(App.screens, { welcome: screenWelcome, auth: screenAuth, family: screenFamily, manage: screenManage });

  /* ================= אתחול עם חשבונות ================= */
  const withTimeout = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  App.boot = async function () {
    if (!C.init()) return App.localBoot();
    const recovering = /type=recovery/.test(location.hash);
    C.onAuth((event) => {
      if (event === 'PASSWORD_RECOVERY') go('auth', { mode: 'newpass' });
    });
    let sess = null;
    try { sess = await withTimeout(C.session(), 6000); } catch (e) { sess = null; }
    if (recovering) return go('auth', { mode: 'newpass' });
    if (sess) {
      try { await withTimeout(C.pull(), 6000); } catch (e) { /* בלי אינטרנט — עובדים מהמכשיר */ }
      const cur = ST().current();
      if (cur && cur.cloud && ST().isUnlocked(cur.id)) {
        HM.applyTheme(cur.theme);
        return go(cur.setupDone ? 'home' : 'onboard', cur.setupDone ? {} : { setup: cur.id });
      }
      return go('family');
    }
    ST().clearCloud();
    const local = ST().current() || ST().localProfiles()[0];
    if (local) { ST().setCurrent(local.id); HM.applyTheme(local.theme); return go('home'); }
    go('welcome');
  };
})(HM);
