/* חשבוניה — מנוע השאלות: הצגת אזור התשובה, קלט, בדיקה וחשיפת פתרון */
(function (HM) {
  'use strict';
  const A = () => HM.art;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  const near = (a, b) => Math.abs(a - b) < 1e-6;

  function fmtTyped(s) {
    if (!s) return '';
    const neg = s[0] === '-'; if (neg) s = s.slice(1);
    let [ip, dp] = s.split('.');
    if (ip.length > 3) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + ip + (s.indexOf('.') >= 0 ? '.' + (dp || '') : '');
  }

  function keypad(fnKey, onKey) {
    const kp = h('div', 'keypad');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', fnKey || '', '0', 'del'];
    keys.forEach((k) => {
      const b = h('button', 'key' + (k === 'del' || k === 'next' || k === '.' ? ' fn' : ''));
      b.type = 'button';
      if (k === 'del') { b.innerHTML = A().icon('backspace'); b.setAttribute('aria-label', 'מחיקה'); }
      else if (k === 'next') { b.innerHTML = A().icon('swap'); b.setAttribute('aria-label', 'לשדה הבא'); }
      else if (k === '') { b.disabled = true; b.style.visibility = 'hidden'; }
      else b.textContent = k;
      b.dataset.k = k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('pressed'); onKey(k); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => b.classList.remove('pressed')));
      b.addEventListener('click', (e) => { if (e.detail === 0) onKey(k); }); // מקלדת/נגישות
      kp.appendChild(b);
    });
    return kp;
  }

  /* ---------- קלט מספרי (שדה אחד או יותר, כולל משבצות בתוך התרגיל) ---------- */
  function mountNumber(card, area, q, api) {
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    const nF = answers.length;
    const allowDot = q.decimal || answers.some((a) => !Number.isInteger(a));
    const vals = Array(nF).fill('');
    let focus = 0, locked = false;
    const slots = Array.from(card.querySelectorAll('.q-prompt .slot, .q-vis .slot')).sort((a, b) => (+a.dataset.slot || 0) - (+b.dataset.slot || 0));
    let displays;
    if (slots.length >= nF) {
      displays = slots.slice(0, nF).map((s) => s);
      displays.forEach((d, i) => d.addEventListener('click', () => { if (!locked) { focus = i; render(); } }));
    } else if (nF === 1) {
      const d = h('div', 'num-display focus');
      d.innerHTML = '<span class="v"></span>' + (q.unit ? `<span class="unit">${q.unit}</span>` : '');
      area.appendChild(d); displays = [d];
    } else {
      const wrap = h('div', 'multi-fields');
      displays = answers.map((_, i) => {
        const mf = h('div', 'mf'); const lab = h('span', '', (q.labels && q.labels[i]) || '');
        const d = h('div', 'num-display'); d.innerHTML = '<span class="v"></span>';
        d.addEventListener('click', () => { if (!locked) { focus = i; render(); } });
        mf.appendChild(lab); mf.appendChild(d); wrap.appendChild(mf); return d;
      });
      area.appendChild(wrap);
    }
    const valEl = (d) => d.querySelector('.slot-v') || d.querySelector('.v');
    function render() {
      displays.forEach((d, i) => {
        valEl(d).textContent = fmtTyped(vals[i]);
        d.classList.toggle('focus', i === focus && !locked);
        if (d.classList.contains('num-display') && !vals[i] && !d.querySelector('.ph')) { /* placeholder */ }
      });
      api.changed();
    }
    function onKey(k) {
      if (locked) return;
      HM.sfx('key');
      let v = vals[focus];
      if (k === 'del') v = v.slice(0, -1);
      else if (k === 'next') { focus = (focus + 1) % nF; render(); return; }
      else if (k === '.') { if (!allowDot || v.indexOf('.') >= 0) return; v = (v || '0') + '.'; }
      else if (/^\d$/.test(k)) { if (v.replace(/\D/g, '').length >= 10) return; if (v === '0') v = ''; v += k; }
      vals[focus] = v; render();
    }
    area.appendChild(keypad(allowDot ? '.' : nF > 1 ? 'next' : '', onKey));
    render();
    return {
      canCheck: () => vals.every((v) => v !== '' && v !== '.'),
      check() {
        let ok = true;
        vals.forEach((v, i) => { const good = near(parseFloat(v), answers[i]); ok = ok && good; displays[i].classList.toggle('no', !good); displays[i].classList.toggle('ok', good); });
        return ok;
      },
      reveal() { answers.forEach((a, i) => { vals[i] = String(HM.round(a)); displays[i].classList.remove('no'); displays[i].classList.add('ok'); }); locked = true; render(); },
      lock() { locked = true; render(); },
      retry() { vals.forEach((v, i) => { if (!near(parseFloat(v), answers[i])) vals[i] = ''; displays[i].classList.remove('no', 'ok'); }); focus = Math.max(0, vals.findIndex((v) => v === '')); locked = false; render(); },
      key(k) { if (k === 'Backspace') onKey('del'); else if (k === 'ArrowDown' || k === 'ArrowUp') onKey('next'); else if (k === '.' || k === ',') onKey('.'); else if (/^\d$/.test(k)) onKey(k); },
    };
  }

  /* ---------- בחירה (כולל נכון/לא נכון) ---------- */
  function mountChoice(card, area, q, api) {
    const isTF = q.type === 'tf';
    const choices = isTF ? ['נכון', 'לא נכון'] : q.choices;
    const correct = isTF ? (q.answer ? 0 : 1) : q.answer;
    const order = isTF || q.keep ? choices.map((_, i) => i) : HM.shuffle(choices.map((_, i) => i));
    const hasSvg = choices.some((c) => /<svg/.test(c));
    const wrap = h('div', isTF ? 'tf-row' : 'choices' + (q.cols === 2 || hasSvg || (choices.length === 4 && choices.every((c) => c.replace(/<[^>]+>/g, '').length < 14)) ? ' c2' : ''));
    let sel = null, locked = false;
    const btns = order.map((ci, pos) => {
      const b = h('button', 'choice', (isTF ? '' : `<span class="ck">${LETTERS[pos]}</span>`) + choices[ci]);
      b.type = 'button'; b.dataset.ci = ci;
      b.addEventListener('click', () => { if (locked || b.disabled) return; HM.sfx('tap'); sel = ci; btns.forEach((x) => x.classList.toggle('sel', x === b)); api.changed(); });
      wrap.appendChild(b); return b;
    });
    area.appendChild(wrap);
    const byCi = (ci) => btns.find((b) => +b.dataset.ci === ci);
    return {
      maxTries: choices.length <= 2 ? 1 : 2,
      canCheck: () => sel !== null,
      check() { const ok = sel === correct; const b = byCi(sel); b.classList.remove('sel'); b.classList.add(ok ? 'ok' : 'no'); return ok; },
      reveal() { locked = true; byCi(correct).classList.add('ok'); btns.forEach((b) => b.classList.remove('sel')); },
      lock() { locked = true; },
      retry() { const b = byCi(sel); if (b) { b.classList.remove('no', 'sel'); b.classList.add('dim'); b.disabled = true; } sel = null; locked = false; api.changed(); },
      key(k) { const i = '1234'.indexOf(k); if (i >= 0 && btns[i]) btns[i].click(); },
    };
  }

  /* ---------- שבר / מספר מעורב ---------- */
  function mountFraction(card, area, q, api) {
    const mixed = !!q.mixed;
    const fields = mixed ? ['w', 'n', 'd'] : ['n', 'd'];
    const vals = { w: '', n: '', d: '' };
    let focus = mixed ? 0 : 0, locked = false;
    const wrap = h('div', 'frac-in');
    const boxes = {};
    const mk = (f, cls) => { const b = h('div', 'fi-box' + (cls ? ' ' + cls : '')); b.addEventListener('click', () => { if (!locked) { focus = fields.indexOf(f); render(); } }); boxes[f] = b; return b; };
    if (mixed) { const ws = h('div', 'fi-stack'); ws.appendChild(mk('w', 'w')); ws.appendChild(h('span', 'fi-lbl', 'שלמים')); wrap.appendChild(ws); }
    const st = h('div', 'fi-stack'); st.appendChild(mk('n')); st.appendChild(h('div', 'fi-bar')); st.appendChild(mk('d'));
    wrap.appendChild(st);
    area.appendChild(wrap);
    function render() {
      fields.forEach((f, i) => { boxes[f].textContent = vals[f]; boxes[f].classList.toggle('fi-empty', !vals[f]); boxes[f].classList.toggle('focus', i === focus && !locked); });
      api.changed();
    }
    function onKey(k) {
      if (locked) return;
      HM.sfx('key');
      const f = fields[focus];
      if (k === 'del') { if (!vals[f] && focus > 0) { focus--; } else vals[f] = vals[f].slice(0, -1); }
      else if (k === 'next') focus = (focus + 1) % fields.length;
      else if (/^\d$/.test(k)) { if (vals[f].length >= 4) return; if (vals[f] === '0') vals[f] = ''; vals[f] += k; }
      render();
    }
    area.appendChild(keypad('next', onKey));
    render();
    const value = () => { const w = +vals.w || 0, n = +vals.n || 0, d = +vals.d; return d ? w + n / d : (vals.n === '' && vals.d === '' ? w : NaN); };
    const ansVal = () => (q.answer.w || 0) + q.answer.n / q.answer.d;
    return {
      canCheck: () => (vals.n !== '' && vals.d !== '') || (mixed && vals.w !== '' && vals.n === '' && vals.d === ''),
      check() {
        const a = q.answer, mode = q.accept || 'equal';
        const v = value();
        let ok = near(v, ansVal());
        if (ok && mode === 'exact') ok = +vals.n === a.n && +vals.d === a.d && (+vals.w || 0) === (a.w || 0);
        if (ok && mode === 'simplest') { const n = +vals.n, d = +vals.d; ok = (vals.n === '' || HM.gcd(n, d) === 1) && (!mixed || n < d || vals.n === ''); }
        fields.forEach((f) => boxes[f].classList.add(ok ? 'ok' : 'no'));
        return ok;
      },
      reveal() { const a = q.answer; vals.w = mixed ? String(a.w || 0) : ''; vals.n = String(a.n); vals.d = String(a.d); locked = true; render(); },
      lock() { locked = true; render(); },
      retry() { vals.w = ''; vals.n = ''; vals.d = ''; focus = 0; locked = false; fields.forEach((f) => boxes[f].classList.remove('ok', 'no')); render(); },
      key(k) { if (k === 'Backspace') onKey('del'); else if (['/', '.', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(k) >= 0) onKey('next'); else if (/^\d$/.test(k)) onKey(k); },
    };
  }

  /* ---------- השוואה ---------- */
  function mountCompare(card, area, q, api) {
    const row = h('div', 'cmp');
    row.innerHTML = `<div class="side">${q.left}</div><div class="mid" aria-live="polite"></div><div class="side">${q.right}</div>`;
    const mid = row.querySelector('.mid');
    area.appendChild(row);
    const btnRow = h('div', 'cmp-btns');
    let sel = null, locked = false;
    const syms = ['<', '=', '>'];
    const btns = syms.map((s) => {
      const b = h('button', 'choice', s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
      b.type = 'button'; b.setAttribute('aria-label', s === '<' ? 'קטן מ' : s === '>' ? 'גדול מ' : 'שווה');
      b.addEventListener('click', () => { if (locked || b.disabled) return; HM.sfx('tap'); sel = s; mid.textContent = s; mid.classList.add('set'); btns.forEach((x) => x.classList.toggle('sel', x === b)); api.changed(); });
      btnRow.appendChild(b); return b;
    });
    area.appendChild(btnRow);
    return {
      canCheck: () => sel !== null,
      check() { const ok = sel === q.answer; btns[syms.indexOf(sel)].classList.add(ok ? 'ok' : 'no'); mid.style.color = ok ? 'var(--good-d)' : 'var(--bad-d)'; return ok; },
      reveal() { locked = true; mid.textContent = q.answer; mid.style.color = 'var(--good-d)'; btns.forEach((b) => b.classList.remove('sel')); btns[syms.indexOf(q.answer)].classList.add('ok'); },
      lock() { locked = true; },
      retry() { const b = btns[syms.indexOf(sel)]; b.classList.remove('no', 'sel'); b.classList.add('dim'); b.disabled = true; sel = null; mid.textContent = ''; mid.style.color = ''; mid.classList.remove('set'); locked = false; api.changed(); },
      key(k) { const i = syms.indexOf(k); if (i >= 0) btns[i].click(); },
    };
  }

  /* ---------- סידור ---------- */
  function mountOrder(card, area, q, api) {
    const n = q.items.length;
    let pool;
    do { pool = HM.shuffle(q.items.map((_, i) => i)); } while (n > 2 && pool.join() === q.answer.join());
    const placed = Array(n).fill(null);
    let locked = false;
    const slotsEl = h('div', 'order-slots');
    const slotEls = placed.map((_, i) => { const s = h('button', 'oslot'); s.type = 'button'; s.dataset.n = i + 1; s.setAttribute('aria-label', `מקום ${i + 1} — ריק`); s.addEventListener('click', () => { if (locked || placed[i] === null) return; HM.sfx('tap'); placed[i] = null; render(); }); slotsEl.appendChild(s); return s; });
    const poolEl = h('div', 'order-pool');
    const chips = pool.map((ii) => { const b = h('button', 'choice', q.items[ii]); b.type = 'button'; b.dataset.i = ii; b.addEventListener('click', () => { if (locked) return; const e = placed.indexOf(null); if (e < 0) return; HM.sfx('tap'); placed[e] = ii; render(); }); poolEl.appendChild(b); return b; });
    area.appendChild(h('div', 'order-dir', 'ראשון <b>1</b> ← … ← אחרון <b>' + n + '</b>'));
    area.appendChild(slotsEl); area.appendChild(poolEl);
    function render() {
      slotEls.forEach((s, i) => { s.innerHTML = placed[i] === null ? '' : q.items[placed[i]]; s.classList.toggle('filled', placed[i] !== null); s.setAttribute('aria-label', placed[i] === null ? `מקום ${i + 1} — ריק` : `מקום ${i + 1}: ${s.textContent.trim()} (לחיצה מחזירה)`); });
      chips.forEach((c) => c.classList.toggle('used', placed.indexOf(+c.dataset.i) >= 0));
      api.changed();
    }
    render();
    return {
      canCheck: () => placed.every((x) => x !== null),
      check() { let ok = true; placed.forEach((x, i) => { const g = x === q.answer[i]; ok = ok && g; slotEls[i].classList.add(g ? 'ok' : 'no'); }); return ok; },
      reveal() { q.answer.forEach((x, i) => (placed[i] = x)); locked = true; render(); slotEls.forEach((s) => { s.classList.remove('no'); s.classList.add('ok'); }); },
      lock() { locked = true; },
      retry() { placed.forEach((x, i) => { if (x !== q.answer[i]) placed[i] = null; }); slotEls.forEach((s) => s.classList.remove('ok', 'no')); locked = false; render(); },
      key() {},
    };
  }

  /* ---------- ישר המספרים ---------- */
  function mountNumberline(card, area, q, api) {
    const wrap = h('div', 'nl-wrap', HM.viz.numberLine(Object.assign({}, q.line, { interactive: true, marks: [] })));
    area.appendChild(wrap);
    const svg = wrap.querySelector('svg');
    let val = null, locked = false, marker = null;
    const NS = 'http://www.w3.org/2000/svg';
    function place(rect, cls) {
      const x = +rect.getAttribute('x') + +rect.getAttribute('width') / 2, y = +rect.getAttribute('y') + 28;
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = `<path d="M${x},${y - 10} l-11,-20 h22 z" class="${cls || 'f-c'} s-ink" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="7" class="${cls || 'f-c'} s-ink" stroke-width="2.5"/>`;
      svg.appendChild(g); return g;
    }
    const hits = Array.from(svg.querySelectorAll('.nl-hit'));
    let idx = -1;
    const live = h('p', 'sr-only'); live.setAttribute('aria-live', 'polite');
    const choose = (r) => { if (locked) return; HM.sfx('tap'); if (marker) marker.remove(); marker = place(r); val = +r.dataset.v; idx = hits.indexOf(r); live.textContent = `הסימון על קו מספר ${idx + 1} מתוך ${hits.length}`; api.changed(); };
    hits.forEach((r) => r.addEventListener('click', () => choose(r)));
    // מקלדת וכפתורים: הזזת הסימון ימינה ושמאלה (הישר עולה משמאל לימין)
    const move = (d) => { if (!hits.length) return; choose(hits[Math.max(0, Math.min(hits.length - 1, (idx < 0 ? Math.floor(hits.length / 2) - d : idx) + d))]); };
    const ctrls = h('div', 'a11y-ctrls');
    const bl = h('button', 'btn sm sec', '◀ שמאלה'); bl.type = 'button'; bl.addEventListener('click', () => move(-1));
    const br = h('button', 'btn sm sec', 'ימינה ▶'); br.type = 'button'; br.addEventListener('click', () => move(1));
    ctrls.appendChild(bl); ctrls.appendChild(br); area.appendChild(ctrls); area.appendChild(live);
    const hitFor = (v) => hits.find((r) => near(+r.dataset.v, v));
    return {
      canCheck: () => val !== null,
      check() { const ok = near(val, q.answer); if (!ok && marker) marker.querySelectorAll('path,circle').forEach((e) => e.setAttribute('class', 'f-r s-ink')); else if (marker) marker.querySelectorAll('path,circle').forEach((e) => e.setAttribute('class', 'f-g s-ink')); return ok; },
      reveal() { locked = true; const r = hitFor(q.answer); if (r) place(r, 'f-g'); },
      lock() { locked = true; },
      retry() { if (marker) marker.remove(); marker = null; val = null; idx = -1; locked = false; api.changed(); },
      key(k) { if (k === 'ArrowRight') move(1); else if (k === 'ArrowLeft') move(-1); else if (k === 'Home') choose(hits[0]); else if (k === 'End') choose(hits[hits.length - 1]); },
    };
  }

  /* ---------- צביעה ---------- */
  function mountShade(card, area, q, api) {
    const total = q.shape === 'grid' ? (q.rows || 10) * (q.cols || 10) : q.parts;
    let svgHtml;
    if (q.shape === 'pie') svgHtml = HM.viz.pie(0, q.parts, { interactive: true, shaded: [], r: 90 });
    else if (q.shape === 'grid') svgHtml = HM.viz.grid(0, { rows: q.rows || 10, cols: q.cols || 10, interactive: true, shaded: [], cell: (q.cols || 10) > 10 ? 18 : 28 });
    else svgHtml = HM.viz.bar(0, q.parts, { interactive: true, shaded: [], h: 70, w: 340 });
    const wrap = h('div', 'shade-wrap', svgHtml);
    const info = h('div', 'shade-count');
    const clear = h('button', 'link', 'ניקוי'); clear.type = 'button';
    const addB = h('button', 'btn sm sec', '+ צביעת חלק'); addB.type = 'button';
    const subB = h('button', 'btn sm sec', '− ביטול חלק'); subB.type = 'button';
    const row = h('div', 'row-c a11y-ctrls'); row.appendChild(addB); row.appendChild(subB); row.appendChild(info); row.appendChild(clear);
    info.setAttribute('aria-live', 'polite');
    wrap.appendChild(row);
    area.appendChild(wrap);
    const parts = Array.from(wrap.querySelectorAll('.part'));
    let locked = false, painting = null;
    const count = () => parts.filter((p) => p.classList.contains('picked')).length;
    const g = HM.store.ctx().g;
    function render() { info.textContent = `${g('צבעת', 'צבעת')} ${count()} מתוך ${total}`; api.changed(); }
    const setPart = (p, on) => { if (p.classList.contains('picked') !== on) { p.classList.toggle('picked', on); HM.sfx('key'); } };
    wrap.addEventListener('pointerdown', (e) => {
      const p = e.target.closest('.part'); if (!p || locked) return;
      e.preventDefault(); painting = !p.classList.contains('picked'); setPart(p, painting); render();
    });
    wrap.addEventListener('pointermove', (e) => {
      if (painting === null || locked) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const p = el && el.closest && el.closest('.part'); if (p && parts.indexOf(p) >= 0) { setPart(p, painting); render(); }
    });
    const end = () => { painting = null; };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    clear.addEventListener('click', () => { if (locked) return; parts.forEach((p) => p.classList.remove('picked')); render(); });
    const addOne = () => { if (locked) return; const p = parts.find((x) => !x.classList.contains('picked')); if (p) { setPart(p, true); render(); } };
    const subOne = () => { if (locked) return; const on = parts.filter((x) => x.classList.contains('picked')); if (on.length) { setPart(on[on.length - 1], false); render(); } };
    addB.addEventListener('click', addOne); subB.addEventListener('click', subOne);
    render();
    return {
      canCheck: () => count() > 0,
      check() { return count() === q.answer; },
      reveal() { locked = true; parts.forEach((p, i) => p.classList.toggle('picked', i < q.answer)); render(); info.textContent = `צריך לצבוע ${q.answer} מתוך ${total}`; },
      lock() { locked = true; },
      retry() { locked = false; render(); },
      key(k) { if (k === '+' || k === 'ArrowUp' || k === 'ArrowRight') addOne(); else if (k === '-' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'Backspace') subOne(); },
      destroy() { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); },
    };
  }

  const MOUNT = { number: mountNumber, choice: mountChoice, tf: mountChoice, fraction: mountFraction, compare: mountCompare, order: mountOrder, numberline: mountNumberline, shade: mountShade };

  // טקסט התשובה הנכונה (HTML) — לחלונית המשוב
  function answerHTML(q) {
    switch (q.type) {
      case 'number': {
        const as = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (as.length === 1) return HM.m(HM.fmt(as[0])) + (q.unit ? ' ' + q.unit : '');
        return as.map((a, i) => ((q.labels && q.labels[i]) ? q.labels[i] + ': ' : '') + HM.m(HM.fmt(a))).join(' , ');
      }
      case 'choice': return q.choices[q.answer];
      case 'tf': return q.answer ? 'נכון' : 'לא נכון';
      case 'fraction': { const a = q.answer; return HM.m(a.w ? HM.mixed(a.w, a.n, a.d) : HM.frac(a.n, a.d)); }
      case 'compare': return HM.m(`${q.left} ${q.answer === '<' ? '&lt;' : q.answer === '>' ? '&gt;' : '='} ${q.right}`);
      case 'order': return q.answer.map((i) => q.items[i]).join(' , ');
      case 'numberline': { const d = q.line && q.line.den; if (d) { const n = Math.round(q.answer * d); const w = Math.floor(n / d); return HM.m(n % d === 0 ? String(n / d) : w ? HM.mixed(w, n % d, d) : HM.frac(n, d)); } return HM.m(HM.fmt(q.answer)); }
      case 'shade': return `${q.answer} חלקים צבועים`;
    }
    return '';
  }

  HM.engine = {
    mount(card, area, q, onChange) {
      const api = { changed: () => onChange && onChange() };
      const fn = MOUNT[q.type] || mountNumber;
      const ctl = fn(card, area, q, api);
      ctl.maxTries = ctl.maxTries || 2;
      return ctl;
    },
    answerHTML,
  };
})(HM);
