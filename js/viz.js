/* חשבוניה — ספריית המחשות (מחזירה מחרוזות SVG/HTML, ללא DOM)
   צבעים: מחלקות f-a (צבע ראשי), f-b (משני), f-c (הדגשה), f-l (גוון בהיר), f-w (לבן), f-g (ירוק), f-r (אדום), f-y (צהוב)
   קווים: s-ink, s-a, s-b, s-soft */
(function (HM) {
  'use strict';
  const R = (x) => Math.round(x * 100) / 100;

  /* ---------- פרימיטיבים ---------- */
  function attrs(o) {
    if (!o) return '';
    let s = '';
    for (const k in o) {
      if (o[k] === undefined || o[k] === null || o[k] === false) continue;
      const key = k === 'cls' ? 'class' : k === 'sw' ? 'stroke-width' : k === 'dash' ? 'stroke-dasharray' : k === 'anchor' ? 'text-anchor' : k === 'fs' ? 'font-size' : k === 'fw' ? 'font-weight' : k;
      s += ` ${key}="${typeof o[k] === 'number' ? R(o[k]) : o[k]}"`;
    }
    return s;
  }
  const S = {
    svg(w, h, inner, o) {
      o = o || {};
      const label = o.label ? ` aria-label="${HM.esc(o.label)}"` : '';
      const vb = o.viewBox || `0 0 ${R(w)} ${R(h)}`;
      const maxw = o.maxw || w;
      return `<svg class="vz ${o.cls || ''}" viewBox="${vb}" style="width:100%;max-width:${R(maxw)}px;height:auto" role="img"${label} xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
    },
    rect: (x, y, w, h, o) => `<rect${attrs(Object.assign({ x, y, width: w, height: h }, o))}/>`,
    circle: (cx, cy, r, o) => `<circle${attrs(Object.assign({ cx, cy, r }, o))}/>`,
    line: (x1, y1, x2, y2, o) => `<line${attrs(Object.assign({ x1, y1, x2, y2, cls: 's-ink', sw: 2 }, o))}/>`,
    path: (d, o) => `<path${attrs(Object.assign({ d }, o))}/>`,
    poly: (pts, o) => `<polygon${attrs(Object.assign({ points: pts.map((p) => R(p[0]) + ',' + R(p[1])).join(' ') }, o))}/>`,
    polyline: (pts, o) => `<polyline${attrs(Object.assign({ points: pts.map((p) => R(p[0]) + ',' + R(p[1])).join(' '), fill: 'none' }, o))}/>`,
    text: (x, y, t, o) => `<text${attrs(Object.assign({ x, y, anchor: 'middle', cls: 't-ink', fs: 18, 'dominant-baseline': 'middle' }, o))}>${t}</text>`,
    g: (inner, o) => `<g${attrs(o)}>${inner}</g>`,
    // שבר מוערם בתוך SVG
    frac(x, y, n, d, o) {
      o = o || {};
      const fs = o.fs || 16, cls = o.cls || 't-ink';
      const w = Math.max(String(n).length, String(d).length) * fs * 0.62 + 4;
      return S.text(x, y - fs * 0.62, n, { fs, cls, fw: o.fw || 600 }) +
        S.line(x - w / 2, y, x + w / 2, y, { cls: o.lineCls || 's-ink', sw: 1.6 }) +
        S.text(x, y + fs * 0.66, d, { fs, cls, fw: o.fw || 600 });
    },
  };

  /* ---------- שברים ---------- */
  // פס שבר: d חלקים, n צבועים (או shaded: מערך אינדקסים)
  function bar(n, d, o) {
    o = o || {};
    const w = o.w || 320, h = o.h || 52, pad = 4;
    const shaded = o.shaded || HM.range(0, n - 1);
    const pw = (w - pad * 2) / d;
    let s = '';
    for (let i = 0; i < d; i++) {
      const on = shaded.indexOf(i) >= 0;
      // RTL: החלק הראשון מימין
      const x = o.ltr ? pad + i * pw : w - pad - (i + 1) * pw;
      s += S.rect(x, pad, pw, h, { cls: (on ? (o.fill || 'f-a') : 'f-w') + ' s-ink part', sw: 2, rx: 0, 'data-i': i });
      if (o.unitLabels) s += S.frac(x + pw / 2, pad + h / 2, 1, d, { fs: Math.min(14, pw / 2.4), cls: on ? 't-on' : 't-ink' });
    }
    s += S.rect(pad, pad, w - pad * 2, h, { fill: 'none', cls: 's-ink', sw: 3, rx: 6 });
    let lab = '';
    if (o.label) lab = S.text(w / 2, h + pad + 22, o.label, { fs: 16 });
    return S.svg(w, h + pad * 2 + (o.label ? 30 : 0), s + lab, { cls: 'vz-bar' + (o.interactive ? ' vz-int' : ''), label: o.aria || `פס מחולק ל-${d} חלקים`, maxw: o.maxw });
  }

  // כמה פסים זה מתחת לזה (להשוואה)
  function bars(list, o) {
    o = o || {};
    const w = o.w || 320, h = o.h || 40, gap = 14, labW = o.labels ? 60 : 0;
    let s = '', y = 4;
    list.forEach((it, k) => {
      const pw = (w - labW - 8) / it.d;
      for (let i = 0; i < it.d; i++) {
        const on = i < it.n;
        const x = w - 4 - (i + 1) * pw;
        s += S.rect(x, y, pw, h, { cls: (on ? (it.fill || (k % 2 ? 'f-b' : 'f-a')) : 'f-w') + ' s-ink', sw: 1.6 });
      }
      s += S.rect(w - 4 - it.d * pw, y, it.d * pw, h, { fill: 'none', cls: 's-ink', sw: 2.6, rx: 4 });
      if (o.labels) {
        const L = o.labels[k];
        if (L && typeof L === 'object') s += S.frac(labW / 2, y + h / 2, L.n, L.d, { fs: 15 });
        else if (L != null) s += S.text(labW / 2, y + h / 2, L, { fs: 16 });
      }
      y += h + gap;
    });
    return S.svg(w, y - gap + 8, s, { cls: 'vz-bars', label: 'השוואת פסי שברים' });
  }

  // עיגול שבר
  function pie(n, d, o) {
    o = o || {};
    const r = o.r || 70, c = r + 6, size = c * 2;
    const shaded = o.shaded || HM.range(0, n - 1);
    let s = '';
    if (d === 1) s += S.circle(c, c, r, { cls: (shaded.length ? (o.fill || 'f-a') : 'f-w') + ' s-ink part', sw: 2, 'data-i': 0 });
    else for (let i = 0; i < d; i++) {
      // מתחילים מלמעלה ומתקדמים עם כיוון השעון
      const a1 = -Math.PI / 2 + (i * 2 * Math.PI) / d, a2 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / d;
      const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1), x2 = c + r * Math.cos(a2), y2 = c + r * Math.sin(a2);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      const on = shaded.indexOf(i) >= 0;
      s += S.path(`M${R(c)},${R(c)} L${R(x1)},${R(y1)} A${r},${r} 0 ${large} 1 ${R(x2)},${R(y2)} Z`, { cls: (on ? (o.fill || 'f-a') : 'f-w') + ' s-ink part', sw: 2, 'stroke-linejoin': 'round', 'data-i': i });
    }
    s += S.circle(c, c, r, { fill: 'none', cls: 's-ink', sw: 3 });
    return S.svg(size, size, s, { cls: 'vz-pie' + (o.interactive ? ' vz-int' : ''), label: o.aria || `עיגול מחולק ל-${d} חלקים`, maxw: o.maxw || size });
  }

  // רשת: rows x cols, k משבצות צבועות (שורה אחר שורה)
  function grid(k, o) {
    o = o || {};
    const rows = o.rows || 10, cols = o.cols || 10, cell = o.cell || (cols > 10 ? 18 : 26);
    const w = cols * cell + 8, h = rows * cell + 8;
    const shaded = o.shaded || HM.range(0, k - 1);
    let s = '';
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const i = r * cols + q;
      const x = o.ltr ? 4 + q * cell : w - 4 - (q + 1) * cell;
      const on = shaded.indexOf(i) >= 0;
      s += S.rect(x, 4 + r * cell, cell, cell, { cls: (on ? (o.fill || 'f-a') : 'f-w') + ' s-soft part', sw: 1, 'data-i': i });
    }
    s += S.rect(4, 4, cols * cell, rows * cell, { fill: 'none', cls: 's-ink', sw: 2.5, rx: 3 });
    return S.svg(w, h, s, { cls: 'vz-grid' + (o.interactive ? ' vz-int' : ''), label: o.aria || `רשת של ${rows * cols} משבצות`, maxw: o.maxw });
  }

  /* ---------- ישר המספרים ---------- */
  // o: {min,max, den (חלוקה לחלקי יחידה) או step, every (תווית כל כמה סימונים), labels:fn(v,i)->string|{n,d}|null,
  //     marks:[{v,label,cls}], jumps:[{from,to,label}], w, hideLabels, interactive}
  function numberLine(o) {
    o = Object.assign({ min: 0, max: 10, w: 560 }, o || {});
    const den = o.den || 0;
    const step = den ? 1 / den : (o.step || 1);
    const N = Math.round((o.max - o.min) / step);
    // גובה פנוי מעל הישר: קשתות קפיצה, או תוויות של נקודות מסומנות (שבר מוערם צריך יותר מקום)
    const marksL = (o.marks || []).filter((mk) => mk.label != null);
    const padL = 30, padR = 30, w = o.w;
    const y = o.jumps && o.jumps.length ? 92 : marksL.some((mk) => typeof mk.label === 'object') ? 74 : marksL.length ? 54 : 46;
    const X = (v) => padL + ((v - o.min) / (o.max - o.min)) * (w - padL - padR);
    let s = S.line(padL - 18, y, w - padR + 18, y, { sw: 3, cls: 's-ink', 'stroke-linecap': 'round' });
    s += S.path(`M${w - padR + 18},${y} l-9,-6 v12 z`, { cls: 'f-ink' }) + S.path(`M${padL - 18},${y} l9,-6 v12 z`, { cls: 'f-ink' });
    const every = o.every || 1;
    for (let i = 0; i <= N; i++) {
      const v = HM.round(o.min + i * step, 9);
      const x = X(v);
      const whole = Math.abs(v - Math.round(v)) < 1e-9;
      const major = den ? whole : i % every === 0;
      s += S.line(x, y - (major ? 11 : 7), x, y + (major ? 11 : 7), { sw: major ? 2.5 : 1.6, cls: 's-ink' });
      if (o.interactive) s += S.rect(x - Math.max(8, (w / N) / 2), y - 28, Math.max(16, w / N), 56, { fill: 'transparent', cls: 'nl-hit', 'data-v': v, 'data-i': i });
      if (o.hideLabels) continue;
      let lab = o.labels ? o.labels(v, i) : (den ? (whole ? String(Math.round(v)) : (o.fracLabels ? { n: Math.round((v - Math.floor(v)) * den + Math.floor(v) * den), d: den } : null)) : (i % every === 0 ? HM.fmt(v) : null));
      if (lab === null || lab === undefined || lab === '') continue;
      if (typeof lab === 'object') s += S.frac(x, y + 34, lab.n, lab.d, { fs: 14 });
      else s += S.text(x, y + 30, lab, { fs: whole || !den ? 17 : 14, fw: 600 });
    }
    (o.jumps || []).forEach((j) => {
      const x1 = X(j.from), x2 = X(j.to), mx = (x1 + x2) / 2, hh = Math.min(46, Math.abs(x2 - x1) * 0.55 + 12);
      s += S.path(`M${R(x1)},${y - 6} Q${R(mx)},${R(y - 6 - hh * 1.6)} ${R(x2)},${y - 6}`, { fill: 'none', cls: 's-b', sw: 2.6, 'stroke-linecap': 'round' });
      s += S.path(`M${R(x2)},${y - 6} l${x2 > x1 ? -9 : 9},-6 l${x2 > x1 ? 2 : -2},9 z`, { cls: 'f-b' });
      if (j.label) s += S.text(mx, y - 14 - hh * 0.8, j.label, { fs: 15, fw: 700, cls: 't-b' });
    });
    (o.marks || []).forEach((mk) => {
      const x = X(mk.v);
      s += S.circle(x, y, 8, { cls: (mk.cls || 'f-a') + ' s-white', sw: 2.5 });
      if (mk.label != null) {
        if (typeof mk.label === 'object') s += S.frac(x, y - 40, mk.label.n, mk.label.d, { fs: 15, cls: 't-a' });
        else s += S.text(x, y - 26, mk.label, { fs: 17, fw: 800, cls: 't-a' });
      }
    });
    return S.svg(w, y + 60, s, { cls: 'vz-nl' + (o.interactive ? ' vz-int' : ''), label: 'ישר המספרים', maxw: o.maxw || w });
  }

  /* ---------- טבלאות ערך המקום ---------- */
  const PLACES = ['יחידות', 'עשרות', 'מאות', 'אלפים', 'עשרות אלפים', 'מאות אלפים', 'מיליונים', 'עשרות מיליונים', 'מאות מיליונים'];
  // o: {hide:[place indices -> '?'], hl:[place indices], minPlaces}
  function placeValue(num, o) {
    o = o || {};
    const digits = String(Math.floor(num)).split('').reverse();
    const n = Math.max(digits.length, o.minPlaces || 0);
    let head = '', body = '';
    for (let i = n - 1; i >= 0; i--) {
      const hlc = (o.hl || []).indexOf(i) >= 0 ? ' class="pv-hl"' : '';
      head += `<th${hlc}>${PLACES[i].replace(' ', '<br>')}</th>`;
      const d = digits[i] !== undefined ? digits[i] : '0';
      body += `<td${hlc}>${(o.hide || []).indexOf(i) >= 0 ? '<span class="qbox">?</span>' : d}</td>`;
    }
    return `<div class="tbl-wrap"><table class="pv" dir="ltr"><thead><tr>${head}</tr></thead><tbody><tr>${body}</tr></tbody></table></div>`;
  }
  // טבלת עשרוני: "12.305"
  function decTable(str, o) {
    o = o || {};
    const [ip, dp0] = String(str).split('.');
    const dp = (dp0 || '').padEnd(o.places || (dp0 || '').length || 1, ' ');
    const intNames = ['יחידות', 'עשרות', 'מאות', 'אלפים'];
    const decNames = ['עשיריות', 'מאיות', 'אלפיות'];
    let head = '', body = '';
    for (let i = ip.length - 1; i >= 0; i--) { head += `<th>${intNames[i]}</th>`; body += `<td>${ip[ip.length - 1 - i]}</td>`; }
    head += '<th class="pv-dot"></th>'; body += '<td class="pv-dot">.</td>';
    for (let i = 0; i < dp.length; i++) {
      const hlc = (o.hl || []).indexOf(i) >= 0 ? ' class="pv-hl"' : '';
      head += `<th${hlc}>${decNames[i]}</th>`;
      body += `<td${hlc}>${(o.hide || []).indexOf(i) >= 0 ? '<span class="qbox">?</span>' : (dp[i] === ' ' ? '' : dp[i])}</td>`;
    }
    return `<div class="tbl-wrap"><table class="pv pv-dec" dir="ltr"><thead><tr>${head}</tr></thead><tbody><tr>${body}</tr></tbody></table></div>`;
  }

  /* ---------- חישוב במאונך ---------- */
  // rows: מחרוזות מספרים ("12.5","3.75"), op: '+'|'−'|'×', o:{result:string|null(=משבצות), carry:[...], zeros:true להשלים אפסים}
  function column(rows, opSym, o) {
    o = o || {};
    const parts = rows.map((r) => String(r).replace(/,/g, '').split('.'));
    const hasDec = parts.some((p) => p.length > 1) || (o.result && String(o.result).indexOf('.') >= 0);
    const resParts = o.result != null ? String(o.result).split('.') : null;
    const intLen = Math.max(...parts.map((p) => p[0].length), resParts ? resParts[0].length : 0);
    const decLen = Math.max(...parts.map((p) => (p[1] || '').length), resParts ? (resParts[1] || '').length : 0);
    const cols = intLen + (hasDec ? 1 + decLen : 0) + 1; // +1 לסימן הפעולה
    const cellsFor = (p, isRes) => {
      const out = [];
      const ip = p[0].padStart(intLen, ' ');
      for (const ch of ip) out.push(ch === ' ' ? '' : ch);
      if (hasDec) {
        out.push(p.length > 1 || (o.zeros && !isRes) ? '.' : ''); // תוצאה שלמה — בלי נקודה מיותרת
        const dp = (p[1] || '');
        for (let i = 0; i < decLen; i++) out.push(i < dp.length ? dp[i] : (o.zeros && (p.length > 1 || o.zeros === 'all') ? '<span class="col-zero">0</span>' : ''));
      }
      return out;
    };
    let html = `<div class="col-op" dir="ltr" style="grid-template-columns:repeat(${cols},1.15em)">`;
    if (o.carry) { html += '<span></span>'; const cs = o.carry; for (let i = 0; i < cols - 1; i++) html += `<span class="col-carry">${cs[i] || ''}</span>`; }
    rows.forEach((r, k) => {
      html += `<span class="col-sign">${k === rows.length - 1 ? opSym : ''}</span>`;
      cellsFor(parts[k], false).forEach((c) => (html += `<span${c === '.' ? ' class="col-dot"' : ''}>${c}</span>`));
    });
    html += `<span class="col-rule" style="grid-column:1 / span ${cols}"></span>`;
    html += '<span></span>';
    if (resParts) cellsFor(resParts, true).forEach((c) => (html += `<span class="col-res${c === '.' ? ' col-dot' : ''}">${c}</span>`));
    else for (let i = 0; i < cols - 1; i++) html += `<span class="col-res"><span class="qbox sm">${hasDec && i === intLen ? '.' : ''}</span></span>`;
    return html + '</div>';
  }

  /* ---------- טבלה כללית ---------- */
  function table(headers, rows, o) {
    o = o || {};
    let h = headers ? '<thead><tr>' + headers.map((x) => `<th>${x}</th>`).join('') + '</tr></thead>' : '';
    let b = '<tbody>' + rows.map((r) => '<tr>' + r.map((x, i) => (i === 0 && o.rowHead ? `<th>${x}</th>` : `<td>${x}</td>`)).join('') + '</tr>').join('') + '</tbody>';
    return `<div class="tbl-wrap"><table class="dtbl${o.cls ? ' ' + o.cls : ''}">${h}${b}</table></div>`;
  }

  /* ---------- דיאגרמת עמודות ---------- */
  // o: {labels, values, max, step, title, yTitle, hl:[indices], w, h, line: ערך קו ממוצע}
  function barChart(o) {
    const labels = o.labels, vals = o.values, n = vals.length;
    const w = o.w || 520, h = o.h || 300, padT = o.title ? 40 : 18, padB = 54, padR = 44, padL = 14;
    const maxV = o.max || Math.max(...vals) || 1;
    const step = o.step || niceStep(maxV);
    const top = Math.ceil(maxV / step) * step;
    const ch = h - padT - padB, cw = w - padL - padR;
    const Y = (v) => padT + ch - (v / top) * ch;
    let s = '';
    if (o.title) s += S.text(w / 2, 18, o.title, { fs: 17, fw: 700 });
    for (let v = 0; v <= top + 1e-9; v += step) {
      s += S.line(padL, Y(v), w - padR, Y(v), { cls: 's-soft', sw: 1, dash: v ? '4 4' : null });
      s += S.text(w - padR + 22, Y(v), HM.fmt(HM.round(v)), { fs: 13, cls: 't-mute' });
    }
    const slot = cw / n, bw = Math.min(56, slot * 0.62);
    vals.forEach((v, i) => {
      const cx = w - padR - slot * (i + 0.5); // ימין לשמאל
      const hl = (o.hl || []).indexOf(i) >= 0;
      if (v > 0) s += S.rect(cx - bw / 2, Y(v), bw, Y(0) - Y(v), { cls: hl ? 'f-c' : (o.fill || 'f-a'), rx: 6 });
      if (!o.hideValues) s += S.text(cx, Y(v) - 12, HM.fmt(v), { fs: 14, fw: 700 });
      s += S.text(cx, h - padB + 20, labels[i], { fs: n > 7 ? 12 : 14, fw: 600 });
    });
    s += S.line(padL, Y(0), w - padR, Y(0), { sw: 2.5 });
    if (o.line != null) {
      s += S.line(padL, Y(o.line), w - padR, Y(o.line), { cls: 's-b', sw: 3, dash: '8 6' });
      if (o.lineLabel !== false) s += S.text(w - padR + 22, Y(o.line), o.lineLabel || 'ממוצע', { fs: 12, fw: 800, cls: 't-b' });
    }
    if (o.xTitle) s += S.text(w / 2, h - 10, o.xTitle, { fs: 13, cls: 't-mute' });
    return S.svg(w, h, s, { cls: 'vz-chart', label: o.title || 'דיאגרמת עמודות', maxw: w });
  }
  function niceStep(maxV) {
    const raw = maxV / 5, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  /* ---------- מערכים ונקודות ---------- */
  function dots(rows, cols, o) {
    o = o || {};
    const r = o.r || 9, gap = o.gap || 26, w = cols * gap + 10, h = rows * gap + 10;
    let s = '';
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const k = i * cols + j;
      s += S.circle(w - 5 - (j + 0.5) * gap, 5 + (i + 0.5) * gap, r, { cls: (o.hl && k < o.hl ? 'f-c' : (o.fill || 'f-a')) });
    }
    return S.svg(w, h, s, { cls: 'vz-dots', label: `${rows} שורות של ${cols}` });
  }
  // קבוצות: groups קבוצות, בכל אחת size עיגולים
  function groups(count, size, o) {
    o = o || {};
    const per = Math.ceil(Math.sqrt(size)), cell = 16, gw = per * cell + 16, gh = Math.ceil(size / per) * cell + 16;
    const perRow = Math.min(count, o.perRow || 5);
    const w = perRow * (gw + 10), h = Math.ceil(count / perRow) * (gh + 10);
    let s = '';
    for (let g = 0; g < count; g++) {
      const gx = w - (g % perRow + 1) * (gw + 10) + 5, gy = Math.floor(g / perRow) * (gh + 10) + 5;
      s += S.rect(gx, gy, gw, gh, { rx: 12, cls: 'f-l s-a', sw: 2 });
      for (let k = 0; k < size; k++) s += S.circle(gx + 8 + (k % per + 0.5) * cell, gy + 8 + (Math.floor(k / per) + 0.5) * cell, 6, { cls: o.fill || 'f-a' });
    }
    return S.svg(w, h, s, { cls: 'vz-groups', label: `${count} קבוצות של ${size}` });
  }

  /* ---------- גיאומטריה ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const centroid = (pts) => mul(pts.reduce((s, p) => add(s, p), [0, 0]), 1 / pts.length);
  // היטל נקודה P על הישר AB
  const foot = (P, A, B) => { const ab = sub(B, A), t = ((P[0] - A[0]) * ab[0] + (P[1] - A[1]) * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]); return add(A, mul(ab, t)); };

  // מצולע כללי עם סימונים
  // o: {fill:'f-l', labels:[], sides:[text], ticks:[n per side], arrows:[n per side], right:[vertex idx], arcs:[{i,label,cls,r}],
  //     diags:true|[[i,j]], heights:[{from, to:[i,j], label, extend:true}], mirrors:[[p1,p2]], grid:unit, dots:true,
  //     extra: svg string (באותן קואורדינטות), pad, scale, maxw, sideCls:[...]}
  function polygon(pts, o) {
    o = o || {};
    const sc = o.scale || 1;
    pts = pts.map((p) => [p[0] * sc, p[1] * sc]);
    const n = pts.length, C = centroid(pts);
    let s = '';
    // רקע רשת
    let minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
    let minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
    (o.heights || []).forEach((hgt) => { const F = foot(pts[hgt.from], pts[hgt.to[0]], pts[hgt.to[1]]); minX = Math.min(minX, F[0]); maxX = Math.max(maxX, F[0]); minY = Math.min(minY, F[1]); maxY = Math.max(maxY, F[1]); });
    const pad = o.pad != null ? o.pad : 34;
    const vx = minX - pad, vy = minY - pad, vw = maxX - minX + pad * 2, vh = maxY - minY + pad * 2;
    if (o.grid) {
      const u = o.grid * sc;
      for (let x = Math.floor(vx / u) * u; x <= vx + vw; x += u) s += S.line(x, vy, x, vy + vh, { cls: 's-grid', sw: 1 });
      for (let y = Math.floor(vy / u) * u; y <= vy + vh; y += u) s += S.line(vx, y, vx + vw, y, { cls: 's-grid', sw: 1 });
    }
    s += S.poly(pts, { cls: (o.fill || 'f-l') + ' ' + (o.stroke || 's-ink'), sw: o.sw || 3, 'stroke-linejoin': 'round', 'fill-opacity': o.fillOpacity });
    // צלעות צבעוניות
    (o.sideCls || []).forEach((c, i) => { if (c) s += S.line(pts[i][0], pts[i][1], pts[(i + 1) % n][0], pts[(i + 1) % n][1], { cls: c, sw: 5, 'stroke-linecap': 'round' }); });
    // אלכסונים
    let diags = o.diags === true ? (n === 4 ? [[0, 2], [1, 3]] : []) : (o.diags || []);
    diags.forEach((d) => (s += S.line(pts[d[0]][0], pts[d[0]][1], pts[d[1]][0], pts[d[1]][1], { cls: 's-b', sw: 2.5, dash: '7 5' })));
    // קווי סימטריה
    (o.mirrors || []).forEach((mr) => {
      const a = mr[0].map((v) => v * sc), b = mr[1].map((v) => v * sc), u2 = unit(sub(b, a));
      const A = sub(a, mul(u2, 18)), B = add(b, mul(u2, 18));
      s += S.line(A[0], A[1], B[0], B[1], { cls: 's-c', sw: 3, dash: '10 6' });
    });
    // גבהים
    (o.heights || []).forEach((hgt) => {
      const P = pts[hgt.from], A = pts[hgt.to[0]], B = pts[hgt.to[1]], F = foot(P, A, B);
      // הארכת הבסיס אם הרגל מחוץ לקטע
      const t = ((F[0] - A[0]) * (B[0] - A[0]) + (F[1] - A[1]) * (B[1] - A[1])) / Math.pow(len(sub(B, A)), 2);
      if (t < 0 || t > 1) { const E = t < 0 ? A : B; s += S.line(E[0], E[1], F[0], F[1], { cls: 's-soft', sw: 2, dash: '4 4' }); }
      s += S.line(P[0], P[1], F[0], F[1], { cls: hgt.cls || 's-c', sw: 3, dash: '6 4' });
      const u1 = unit(sub(P, F)), u2 = unit(sub(A, F).every((v) => Math.abs(v) < 1e-6) ? sub(B, F) : sub(A, F)), q = 11;
      s += S.path(`M${R(F[0] + u1[0] * q)},${R(F[1] + u1[1] * q)} L${R(F[0] + u1[0] * q + u2[0] * q)},${R(F[1] + u1[1] * q + u2[1] * q)} L${R(F[0] + u2[0] * q)},${R(F[1] + u2[1] * q)}`, { fill: 'none', cls: hgt.cls || 's-c', sw: 2 });
      if (hgt.label) { const M = mul(add(P, F), 0.5), off = mul(u2, -16); s += S.text(M[0] + off[0], M[1] + off[1], hgt.label, { fs: 16, fw: 800, cls: 't-c' }); }
    });
    // זוויות ישרות
    (o.right || []).forEach((i) => {
      const P = pts[i], u1 = unit(sub(pts[(i + n - 1) % n], P)), u2 = unit(sub(pts[(i + 1) % n], P)), q = 14;
      s += S.path(`M${R(P[0] + u1[0] * q)},${R(P[1] + u1[1] * q)} L${R(P[0] + u1[0] * q + u2[0] * q)},${R(P[1] + u1[1] * q + u2[1] * q)} L${R(P[0] + u2[0] * q)},${R(P[1] + u2[1] * q)}`, { fill: 'none', cls: 's-ink', sw: 2 });
    });
    // קשתות זווית
    (o.arcs || []).forEach((a) => {
      const P = pts[a.i], v1 = sub(pts[(a.i + n - 1) % n], P), v2 = sub(pts[(a.i + 1) % n], P), r = a.r || 22;
      s += arcPath(P, v1, v2, r, a.cls || 's-a', a.fill);
      if (a.label != null) {
        const bis = unit(add(unit(v1), unit(v2)));
        s += S.text(P[0] + bis[0] * (r + 16), P[1] + bis[1] * (r + 16), a.label, { fs: 14, fw: 700, cls: 't-a' });
      }
    });
    // סימוני צלעות שוות
    (o.ticks || []).forEach((k, i) => { if (k) s += tickMarks(pts[i], pts[(i + 1) % n], k); });
    (o.arrows || []).forEach((k, i) => { if (k) s += arrowMarks(pts[i], pts[(i + 1) % n], k); });
    // תוויות צלעות
    (o.sides || []).forEach((t, i) => {
      if (t == null || t === '') return;
      const A = pts[i], B = pts[(i + 1) % n], M = mul(add(A, B), 0.5);
      let nrm = unit([-(B[1] - A[1]), B[0] - A[0]]);
      if ((M[0] + nrm[0] - C[0]) * nrm[0] + (M[1] + nrm[1] - C[1]) * nrm[1] < 0) nrm = mul(nrm, -1);
      s += S.text(M[0] + nrm[0] * 20, M[1] + nrm[1] * 20, t, { fs: 16, fw: 700, cls: 't-ink' });
    });
    // קודקודים
    if (o.dots !== false) pts.forEach((p) => (s += S.circle(p[0], p[1], 3.6, { cls: 'f-ink' })));
    (o.labels || []).forEach((t, i) => {
      if (!t) return;
      const dir = unit(sub(pts[i], C));
      s += S.text(pts[i][0] + dir[0] * 20, pts[i][1] + dir[1] * 20, t, { fs: 18, fw: 800, cls: 't-ink' });
    });
    if (o.extra) s += o.extra;
    return S.svg(vw, vh, s, { viewBox: `${R(vx)} ${R(vy)} ${R(vw)} ${R(vh)}`, cls: 'vz-geo', label: o.aria || 'צורה', maxw: o.maxw || Math.min(vw, 360) });
  }
  // forceD: זווית הקשת ברדיאנים (עם סימן) — כשהכיוון חשוב, למשל בזווית שטוחה של 180°
  function arcPath(P, v1, v2, r, cls, fill, forceD) {
    let a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]);
    let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    if (forceD != null) d = forceD;
    const sweep = d > 0 ? 1 : 0, large = Math.abs(d) > Math.PI ? 1 : 0;
    const x1 = P[0] + r * Math.cos(a1), y1 = P[1] + r * Math.sin(a1), x2 = P[0] + r * Math.cos(a1 + d), y2 = P[1] + r * Math.sin(a1 + d);
    const fillPath = fill ? S.path(`M${R(P[0])},${R(P[1])} L${R(x1)},${R(y1)} A${r},${r} 0 ${large} ${sweep} ${R(x2)},${R(y2)} Z`, { cls: fill, 'fill-opacity': 0.35 }) : '';
    return fillPath + S.path(`M${R(x1)},${R(y1)} A${r},${r} 0 ${large} ${sweep} ${R(x2)},${R(y2)}`, { fill: 'none', cls, sw: 2.5 });
  }
  function tickMarks(A, B, k) {
    const M = mul(add(A, B), 0.5), u = unit(sub(B, A)), nrm = [-u[1], u[0]];
    let s = '';
    for (let j = 0; j < k; j++) {
      const off = (j - (k - 1) / 2) * 6, c = add(M, mul(u, off));
      s += S.line(c[0] - nrm[0] * 7, c[1] - nrm[1] * 7, c[0] + nrm[0] * 7, c[1] + nrm[1] * 7, { cls: 's-a', sw: 2.5 });
    }
    return s;
  }
  function arrowMarks(A, B, k) {
    let u = unit(sub(B, A));
    if (u[0] < -1e-6 || (Math.abs(u[0]) < 1e-6 && u[1] < 0)) u = mul(u, -1); // כיוון אחיד לצלעות מקבילות
    const M = mul(add(A, B), 0.5), nrm = [-u[1], u[0]];
    let s = '';
    for (let j = 0; j < k; j++) {
      const c = add(M, mul(u, (j - (k - 1) / 2) * 9 + 4));
      const p1 = add(sub(c, mul(u, 8)), mul(nrm, 6)), p2 = add(sub(c, mul(u, 8)), mul(nrm, -6));
      s += S.polyline([p1, c, p2], { cls: 's-b', sw: 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    }
    return s;
  }

  // צורות מוכנות (קואורדינטות SVG, y כלפי מטה). מחזירות מערך נקודות
  const SH = {
    square: (a) => [[0, 0], [a, 0], [a, a], [0, a]],
    rect: (w, h) => [[0, 0], [w, 0], [w, h], [0, h]],
    // מקבילית: בסיס, גובה, היסט אופקי של הצלע העליונה
    parallelogram: (b, h, off) => [[off, 0], [off + b, 0], [b, h], [0, h]],
    // מעוין עם זווית חדה (מעלות) וצלע. הזוויות החדות בקודקודים 1 ו-3, הקהות ב-0 ו-2
    rhombus: (a, deg) => { const t = (deg || 60) * Math.PI / 180, dx = a * Math.cos(t), dy = a * Math.sin(t); return [[dx, 0], [dx + a, 0], [a, dy], [0, dy]]; },
    rhombusUp: (dw, dh) => [[dw / 2, 0], [dw, dh / 2], [dw / 2, dh], [0, dh / 2]], // מעוין "עומד" לפי אלכסונים
    trapezoid: (bottom, top, h, off) => [[off, 0], [off + top, 0], [bottom, h], [0, h]],
    kite: (w, hTop, hBot) => [[w / 2, 0], [w, hTop], [w / 2, hTop + hBot], [0, hTop]],
    triangle: (kind, s) => {
      s = s || 160;
      switch (kind) {
        case 'right': return [[0, 0], [0, s * 0.8], [s, s * 0.8]];
        case 'obtuse': return [[s * 1.15, 0], [0, s * 0.62], [s * 0.6, s * 0.62]];
        case 'equilateral': return [[s / 2, 0], [s, s * 0.866], [0, s * 0.866]];
        case 'isosceles': return [[s / 2, 0], [s * 0.85, s * 0.95], [s * 0.15, s * 0.95]];
        case 'scalene': return [[s * 0.35, 0], [s, s * 0.8], [0, s * 0.8]];
        default: return [[s * 0.4, 0], [s, s * 0.8], [0, s * 0.8]]; // acute
      }
    },
    regular: (n, r, rotDeg) => { const rot = ((rotDeg == null ? (n % 2 ? -90 : -90 + 180 / n) : rotDeg) * Math.PI) / 180; return HM.range(0, n - 1).map((i) => [r + r * Math.cos(rot + (i * 2 * Math.PI) / n), r + r * Math.sin(rot + (i * 2 * Math.PI) / n)]); },
    rotate: (pts, deg) => { const c = centroid(pts), t = deg * Math.PI / 180; return pts.map((p) => { const d = sub(p, c); return [c[0] + d[0] * Math.cos(t) - d[1] * Math.sin(t), c[1] + d[0] * Math.sin(t) + d[1] * Math.cos(t)]; }); },
  };

  // זווית בודדת: deg מעלות, o:{rot (סיבוב קרן ראשונה), label, len, showDeg}
  function angle(deg, o) {
    o = o || {};
    const L = o.len || 120, rot = (o.rot || 0) * Math.PI / 180;
    const P = [20, 20], a1 = -rot, a2 = -rot - deg * Math.PI / 180;
    const A = [P[0] + L * Math.cos(a1), P[1] + L * Math.sin(a1)], B = [P[0] + L * Math.cos(a2), P[1] + L * Math.sin(a2)];
    let s = S.line(P[0], P[1], A[0], A[1], { sw: 3.5, 'stroke-linecap': 'round' }) + S.line(P[0], P[1], B[0], B[1], { sw: 3.5, 'stroke-linecap': 'round' });
    if (Math.abs(deg - 90) < 0.01 && o.square !== false) {
      const u1 = unit(sub(A, P)), u2 = unit(sub(B, P)), q = 18;
      s += S.path(`M${R(P[0] + u1[0] * q)},${R(P[1] + u1[1] * q)} L${R(P[0] + u1[0] * q + u2[0] * q)},${R(P[1] + u1[1] * q + u2[1] * q)} L${R(P[0] + u2[0] * q)},${R(P[1] + u2[1] * q)}`, { fill: 'none', cls: 's-a', sw: 2.5 });
    } else s += arcPath(P, sub(A, P), sub(B, P), 30, 's-a', 'f-a', -deg * Math.PI / 180);
    const mid = a1 - (deg * Math.PI / 180) / 2;
    const lab = [P[0] + Math.cos(mid) * 54, P[1] + Math.sin(mid) * 54];
    if (o.label) s += S.text(lab[0], lab[1], o.label, { fs: 16, fw: 800, cls: 't-a' });
    s += S.circle(P[0], P[1], 4, { cls: 'f-ink' });
    const arcPts = HM.range(0, 12).map((k) => { const t = a1 - (deg * Math.PI / 180) * (k / 12); return [P[0] + 30 * Math.cos(t), P[1] + 30 * Math.sin(t)]; });
    const xs = [P[0], A[0], B[0]].concat(arcPts.map((q) => q[0]), o.label ? [lab[0] - 14, lab[0] + 14] : []);
    const ys = [P[1], A[1], B[1]].concat(arcPts.map((q) => q[1]), o.label ? [lab[1] - 12, lab[1] + 12] : []);
    const minX = Math.min(...xs) - 20, minY = Math.min(...ys) - 20, w = Math.max(...xs) - minX + 20, h = Math.max(...ys) - minY + 20;
    return S.svg(w, h, s, { viewBox: `${R(minX)} ${R(minY)} ${R(w)} ${R(h)}`, cls: 'vz-geo', label: 'זווית', maxw: o.maxw || 200 });
  }

  // צורה על דף משבצות: pts ביחידות משבצת, o:{w,h (במשבצות), cell, fill, labels, sides}
  function onGrid(shapes, o) {
    o = o || {};
    const cell = o.cell || 28, W = o.w || 10, H = o.h || 7;
    let s = '';
    for (let x = 0; x <= W; x++) s += S.line(x * cell + 6, 6, x * cell + 6, H * cell + 6, { cls: 's-grid', sw: 1 });
    for (let y = 0; y <= H; y++) s += S.line(6, y * cell + 6, W * cell + 6, y * cell + 6, { cls: 's-grid', sw: 1 });
    (Array.isArray(shapes[0][0]) ? shapes : [shapes]).forEach((pts, k) => {
      const P = pts.map((p) => [p[0] * cell + 6, p[1] * cell + 6]);
      s += S.poly(P, { cls: ['f-a', 'f-b', 'f-c', 'f-g'][k % 4] + ' s-ink', 'fill-opacity': 0.55, sw: 2.5, 'stroke-linejoin': 'round' });
    });
    if (o.extra) s += o.extra(cell, 6);
    return S.svg(W * cell + 12, H * cell + 12, s, { cls: 'vz-geo vz-paper', label: 'צורה על דף משבצות', maxw: o.maxw || W * cell + 12 });
  }

  // ריצוף: kind 'square'|'triangle'|'hexagon'|'brick'|'rhombus'|'octagon' (מתומן+ריבוע, דוגמה לריצוף משולב)
  function tiling(kind, o) {
    o = o || {};
    const W = o.w || 300, H = o.h || 200, a = o.size || 40;
    let s = '', k = 0;
    const cls = () => ['f-a', 'f-b', 'f-l', 'f-c'][(k++) % (o.colors || 3)] + ' s-ink';
    if (kind === 'square') for (let y = 0; y < H; y += a) for (let x = 0; x < W; x += a) { k = (x / a + y / a) % 2; s += S.rect(x, y, a, a, { cls: cls(), sw: 2 }); }
    if (kind === 'brick') for (let r = 0, y = 0; y < H; y += a, r++) for (let x = -(r % 2) * a; x < W; x += 2 * a) { k = r % 2; s += S.rect(x, y, 2 * a, a, { cls: cls(), sw: 2 }); }
    if (kind === 'triangle') { const h = a * 0.866; for (let r = 0, y = 0; y < H; y += h, r++) for (let i = -2, x = -(r % 2) * a / 2; x < W + a; x += a / 2, i++) { const up = (i + 2) % 2 === 0; const x0 = x; k = up ? 0 : 1; s += S.poly(up ? [[x0, y + h], [x0 + a / 2, y], [x0 + a, y + h]] : [[x0, y], [x0 + a, y], [x0 + a / 2, y + h]], { cls: cls(), sw: 2 }); } }
    if (kind === 'hexagon') { const r = a / 1.6, hw = r * Math.sqrt(3); for (let row = 0, y = 0; y < H + r; y += r * 1.5, row++) for (let col = 0, x = (row % 2) * hw / 2; x < W + hw; x += hw, col++) { k = (col + row) % 3; s += S.poly(HM.range(0, 5).map((i) => [x + r * Math.cos(Math.PI / 6 + i * Math.PI / 3), y + r * Math.sin(Math.PI / 6 + i * Math.PI / 3)]), { cls: cls(), sw: 2 }); } }
    if (kind === 'rhombus') { const dx = a * 0.5, h = a * 0.866; for (let r = 0, y = 0; y < H + h; y += h, r++) for (let x = -a + (r % 2 ? -dx : 0); x < W + a; x += a) { k = r % 2; s += S.poly([[x + dx, y], [x + dx + a, y], [x + a, y + h], [x, y + h]], { cls: cls(), sw: 2 }); } }
    if (kind === 'octagon') { const t = a / (1 + Math.SQRT2), c = t / Math.SQRT2; for (let y = 0; y < H + a; y += a) for (let x = 0; x < W + a; x += a) { k = 0; s += S.poly([[x + c, y], [x + c + t, y], [x + a, y + c], [x + a, y + c + t], [x + c + t, y + a], [x + c, y + a], [x, y + c + t], [x, y + c]], { cls: cls(), sw: 2 }); k = 1; s += S.poly([[x + a, y + a - c], [x + a + c, y + a], [x + a, y + a + c], [x + a - c, y + a]], { cls: cls(), sw: 2 }); } }
    const cid = 'tclip' + kind + Math.random().toString(36).slice(2, 8); // מזהה ייחודי — כמה ריצופים באותו מסך
    return `<div class="vz-clip">${S.svg(W, H, `<clipPath id="${cid}"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath><g clip-path="url(#${cid})">${s}</g>`, { cls: 'vz-tiling', label: 'ריצוף', maxw: W })}</div>`;
  }

  // ריבוע קסם / טבלת מספרים: cells מערך דו-ממדי (null => '?')
  function magic(cells, o) {
    o = o || {};
    return `<div class="magic" dir="ltr" style="grid-template-columns:repeat(${cells[0].length},1fr)">` + cells.flat().map((v) => `<span class="${v === null ? 'mg-q' : ''}">${v === null ? '?' : v}</span>`).join('') + '</div>';
  }

  // שורת צורות לחוקיות: steps מערך של מספרי משבצות (מסודרות כמגדל/ריבוע) — kind:'stairs'|'square'|'line'|'L'
  function pattern(steps, kind, o) {
    o = o || {};
    const c = o.cell || 14;
    let x = 8, s = '';
    const maxH = Math.max(...steps.map((n) => (kind === 'square' ? Math.sqrt(n) : kind === 'stairs' ? stairsH(n) : kind === 'L' ? Math.ceil((n + 1) / 2) : 1)));
    steps.forEach((n, i) => {
      let cells = [];
      if (kind === 'square') { const k = Math.round(Math.sqrt(n)); for (let a = 0; a < k; a++) for (let b2 = 0; b2 < k; b2++) cells.push([a, b2]); }
      else if (kind === 'stairs') { let col = 0, left = n; while (left > 0) { const hh = Math.min(col + 1, left); for (let r = 0; r < hh; r++) cells.push([col, r]); left -= hh; col++; } }
      else if (kind === 'L') { const arm = Math.ceil((n + 1) / 2); for (let r = 0; r < arm; r++) cells.push([0, r]); for (let a = 1; a < n - arm + 1; a++) cells.push([a, 0]); }
      else for (let a = 0; a < n; a++) cells.push([a, 0]);
      const wCols = Math.max(...cells.map((q) => q[0])) + 1;
      cells.forEach((q) => (s += S.rect(x + q[0] * c, 8 + (maxH - 1 - q[1]) * c, c, c, { cls: 'f-a s-white', sw: 1.5, rx: 2 })));
      s += S.text(x + (wCols * c) / 2, 8 + maxH * c + 18, o.labels ? o.labels[i] : `שלב ${i + 1}`, { fs: 13, cls: 't-mute' });
      x += wCols * c + 26;
    });
    return S.svg(x, maxH * c + 36, s, { cls: 'vz-pattern', label: 'סדרת צורות', viewBox: `0 0 ${x} ${maxH * c + 36}` });
  }
  function stairsH(n) { let col = 0, left = n, h = 0; while (left > 0) { const hh = Math.min(col + 1, left); h = Math.max(h, hh); left -= hh; col++; } return h; }

  // אייקונים קטנים בתוך טקסט (עצמים לספירה) — circle/square/star/heart
  function tokens(n, shape, o) {
    o = o || {};
    const c = 22, perRow = o.perRow || 10, rows = Math.ceil(n / perRow), w = Math.min(n, perRow) * c + 4, h = rows * c + 4;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = w - 2 - (i % perRow + 0.5) * c, y = 2 + (Math.floor(i / perRow) + 0.5) * c;
      const cl = i < (o.hl || 0) ? 'f-c' : 'f-a';
      if (shape === 'square') s += S.rect(x - 8, y - 8, 16, 16, { rx: 3, cls: cl });
      else if (shape === 'star') s += S.path(starPath(x, y, 9, 4), { cls: cl });
      else s += S.circle(x, y, 8, { cls: cl });
    }
    return S.svg(w, h, s, { cls: 'vz-tokens', label: `${n} פריטים`, maxw: w });
  }
  function starPath(cx, cy, R1, r1) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r1 : R1; d += (i ? 'L' : 'M') + R(cx + rr * Math.cos(a)) + ',' + R(cy + rr * Math.sin(a)); }
    return d + 'Z';
  }

  HM.svg = S;
  HM.viz = { bar, bars, pie, grid, numberLine, placeValue, decTable, column, table, barChart, dots, groups, polygon, shapes: SH, angle, onGrid, tiling, magic, pattern, tokens, starPath, PLACES };
})(HM);
