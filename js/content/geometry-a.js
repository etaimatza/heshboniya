/* חשבוניה — אי הצורות, יחידת המרובעים: צלעות, זוויות, כיוונים, משפחת המקביליות, אלכסונים וסימטריה */
(function (HM) {
  'use strict';
  const V = HM.viz, S = HM.svg;
  const { m, b } = HM;

  /* ================= כלי עזר גיאומטריים ================= */
  const L4 = ['א', 'ב', 'ג', 'ד'];
  const RAD = Math.PI / 180;
  const R2 = (x) => Math.round(x * 100) / 100;
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const len = (p) => Math.hypot(p[0], p[1]);
  const unit = (p) => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
  const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
  const rot = (pts, d) => (d ? V.shapes.rotate(pts, d) : pts);
  const scaleP = (pts, k) => pts.map((p) => [p[0] * k, p[1] * k]);
  const rndRot = (c) => c.rnd(0, 35) * 5 * (c.chance(0.5) ? 1 : -1);
  // זווית פנימית בקודקוד i של מצולע קמור (במעלות)
  const angAt = (pts, i) => {
    const n = pts.length, P = pts[i], u = sub(pts[(i + n - 1) % n], P), v = sub(pts[(i + 1) % n], P);
    return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))))) / RAD;
  };
  const angType = (a) => (Math.abs(a - 90) < 1 ? 'right' : Math.abs(a - 180) < 1 ? 'straight' : a < 90 ? 'acute' : 'obtuse');
  const TYPE_HE = { acute: 'חדה', right: 'ישרה', obtuse: 'קהה', straight: 'שטוחה' };
  // הזווית בין שני ישרים (0..90)
  const lineAng = (u, v) => { let a = Math.abs(Math.atan2(u[1], u[0]) - Math.atan2(v[1], v[0])) / RAD % 180; return a > 90 ? 180 - a : a; };
  function convex(p) {
    const n = p.length; let sg = 0;
    for (let i = 0; i < n; i++) {
      const cr = cross(sub(p[(i + 1) % n], p[i]), sub(p[(i + 2) % n], p[(i + 1) % n]));
      if (Math.abs(cr) < 1e-9) return false;
      if (sg && Math.sign(cr) !== sg) return false;
      sg = Math.sign(cr);
    }
    return true;
  }
  // שם צלע לפי שתי אותיות, בסדר האלף-בית (אב, בג, גד, אד)
  const sideNm = (x, y) => (L4.indexOf(x) < L4.indexOf(y) ? x + y : y + x);
  // סידור אותיות אקראי סביב המרובע (מתחילים מקודקוד אקראי, בכיוון אקראי)
  const labelSet = (c) => { const k = c.rnd(0, 3), dir = c.chance(0.5) ? 1 : -1; return [0, 1, 2, 3].map((i) => L4[(k + dir * i + 8) % 4]); };
  const sidesOf = (lab) => [0, 1, 2, 3].map((i) => sideNm(lab[i], lab[(i + 1) % 4]));
  const angName = (x) => `זווית ${x}`;

  // קשת זווית בקודקוד P בין הכיוונים v1, v2
  function arc(P, v1, v2, r, o) {
    o = o || {};
    const a1 = Math.atan2(v1[1], v1[0]), a2 = Math.atan2(v2[1], v2[0]);
    let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const sw = d > 0 ? 1 : 0;
    const x1 = P[0] + r * Math.cos(a1), y1 = P[1] + r * Math.sin(a1), x2 = P[0] + r * Math.cos(a1 + d), y2 = P[1] + r * Math.sin(a1 + d);
    let s = '';
    if (o.fill) s += S.path(`M${R2(P[0])},${R2(P[1])} L${R2(x1)},${R2(y1)} A${r},${r} 0 0 ${sw} ${R2(x2)},${R2(y2)} Z`, { cls: o.fill, 'fill-opacity': 0.35 });
    s += S.path(`M${R2(x1)},${R2(y1)} A${r},${r} 0 0 ${sw} ${R2(x2)},${R2(y2)}`, { fill: 'none', cls: o.cls || 's-a', sw: 2.5 });
    if (o.label != null) {
      let bis = unit(add(unit(v1), unit(v2))); const off = r + (o.off || 17);
      if (o.lrot) { const t = o.lrot * RAD; bis = [bis[0] * Math.cos(t) - bis[1] * Math.sin(t), bis[0] * Math.sin(t) + bis[1] * Math.cos(t)]; }
      s += S.text(P[0] + bis[0] * off, P[1] + bis[1] * off, o.label, { fs: o.fs || 14, fw: 700, cls: o.tcls || 't-a' });
    }
    return s;
  }
  function rightMark(P, v1, v2, q, cls) {
    const u1 = unit(v1), u2 = unit(v2); q = q || 13;
    return S.path(`M${R2(P[0] + u1[0] * q)},${R2(P[1] + u1[1] * q)} L${R2(P[0] + (u1[0] + u2[0]) * q)},${R2(P[1] + (u1[1] + u2[1]) * q)} L${R2(P[0] + u2[0] * q)},${R2(P[1] + u2[1] * q)}`, { fill: 'none', cls: cls || 's-ink', sw: 2 });
  }
  function chevrons(A, B, k, cls) {
    let u = unit(sub(B, A));
    if (u[0] < -1e-6 || (Math.abs(u[0]) < 1e-6 && u[1] < 0)) u = mul(u, -1);
    const M = mid(A, B), nrm = [-u[1], u[0]];
    let s = '';
    for (let j = 0; j < k; j++) {
      const cc = add(M, mul(u, (j - (k - 1) / 2) * 9 + 4));
      s += S.polyline([add(sub(cc, mul(u, 8)), mul(nrm, 6)), cc, add(sub(cc, mul(u, 8)), mul(nrm, -6))], { cls: cls || 's-b', sw: 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    }
    return s;
  }
  function ticks(A, B, k, cls) {
    const M = mid(A, B), u = unit(sub(B, A)), nrm = [-u[1], u[0]];
    let s = '';
    for (let j = 0; j < k; j++) { const cc = add(M, mul(u, (j - (k - 1) / 2) * 6)); s += S.line(cc[0] - nrm[0] * 7, cc[1] - nrm[1] * 7, cc[0] + nrm[0] * 7, cc[1] + nrm[1] * 7, { cls: cls || 's-a', sw: 2.5 }); }
    return s;
  }
  // עוטף ציור ב-SVG שגבולותיו מחושבים מהנקודות
  function fitSvg(inner, pts, o) {
    o = o || {};
    const pad = o.pad != null ? o.pad : 16, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad, w = Math.max(...xs) - minX + pad, h = Math.max(...ys) - minY + pad;
    return S.svg(w, h, inner, { viewBox: `${R2(minX)} ${R2(minY)} ${R2(w)} ${R2(h)}`, cls: 'vz-geo', label: o.label || 'ציור', maxw: o.maxw || Math.min(w, 240) });
  }
  const row = (...xs) => `<div class="row">${xs.join('')}</div>`;
  const dg = (x) => m(x + '°'); // מעלות בתוך טקסט עברי: תמיד משמאל לימין
  const capt = (svg, t) => `<div>${svg}<div class="center"><b>${t}</b></div></div>`;

  /* ---------- זווית בודדת (כולל זווית שטוחה) ---------- */
  // o: {rot: כיוון הקרן הראשונה (מעלות, נגד כיוון השעון מימין), len, len2, label, r, maxw, cap}
  function ang(deg, o) {
    o = o || {};
    const L1 = o.len || 110, L2 = o.len2 || L1, rt = (o.rot || 0) * RAD, r = o.r || 28;
    const dir = (t) => [Math.cos(t), -Math.sin(t)];
    const A = mul(dir(rt), L1), B = mul(dir(rt + deg * RAD), L2);
    let s = S.line(0, 0, A[0], A[1], { sw: 3.5, 'stroke-linecap': 'round' }) + S.line(0, 0, B[0], B[1], { sw: 3.5, 'stroke-linecap': 'round' });
    const pts = [[0, 0], A, B];
    if (Math.abs(deg - 90) < 0.01) s += rightMark([0, 0], A, B, 17, 's-a');
    else {
      const a1 = mul(dir(rt), r), a2 = mul(dir(rt + deg * RAD), r);
      s += S.path(`M0,0 L${R2(a1[0])},${R2(a1[1])} A${r},${r} 0 0 0 ${R2(a2[0])},${R2(a2[1])} Z`, { cls: 'f-a', 'fill-opacity': 0.3 });
      s += S.path(`M${R2(a1[0])},${R2(a1[1])} A${r},${r} 0 0 0 ${R2(a2[0])},${R2(a2[1])}`, { fill: 'none', cls: 's-a', sw: 2.5 });
      for (let t = 0; t <= deg; t += 15) pts.push(mul(dir(rt + t * RAD), r));
    }
    if (o.label) {
      const lp = mul(dir(rt + (deg / 2) * RAD), r + 20 + (deg < 45 ? 22 : 0));
      s += S.text(lp[0], lp[1], o.label, { fs: 17, fw: 800, cls: 't-a' }); pts.push(add(lp, [12, 10]), sub(lp, [12, 10]));
    }
    s += S.circle(0, 0, 4, { cls: 'f-ink' });
    if (o.cap) {
      const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
      const cy = Math.max(...ys) + 24, cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      s += S.text(cx, cy, o.cap, { fs: 16, fw: 700 }); pts.push([cx - 30, cy + 8], [cx + 30, cy + 8]);
    }
    return fitSvg(s, pts, { maxw: o.maxw || 200, label: 'זווית' });
  }

  /* ---------- מד-זווית ---------- */
  // deg: גודל הזווית. o.left: הקרן הראשונה פונה שמאלה (קוראים בסקלה הפנימית)
  function protractor(deg, o) {
    o = o || {};
    const r = 150, cx = r + 22, cy = r + 26, W = 2 * r + 44, H = cy + 18;
    const P = (t, rr) => [cx + rr * Math.cos(t * RAD), cy - rr * Math.sin(t * RAD)];
    let s = S.path(`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z`, { cls: 'f-l s-ink', sw: 2 });
    s += S.path(`M${cx - r + 48},${cy} A${r - 48},${r - 48} 0 0 1 ${cx + r - 48},${cy}`, { fill: 'none', cls: 's-soft', sw: 1 });
    let labs = '';
    for (let t = 0; t <= 180; t += 5) {
      const big = t % 10 === 0, p1 = P(t, r), p2 = P(t, r - (big ? 12 : 6));
      s += S.line(p1[0], p1[1], p2[0], p2[1], { cls: 's-ink', sw: big ? 1.6 : 1 });
      if (big) {
        const q = P(t, r - 23), q2 = P(t, r - 39), dy = t === 0 || t === 180 ? -9 : 0;
        const halo = { cls: 's-white', sw: 3.5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };
        labs += S.text(q[0], q[1] + dy, String(t), Object.assign({ fs: 11, fw: 700 }, halo, { cls: 't-ink s-white' }));
        labs += S.text(q2[0], q2[1] + dy, String(180 - t), Object.assign({ fs: 9.5 }, halo, { cls: 't-mute s-white' }));
      }
    }
    s += S.line(cx - r - 6, cy, cx + r + 6, cy, { cls: 's-ink', sw: 2 });
    if (deg != null) {
      const base = o.left ? 180 : 0, other = o.left ? 180 - deg : deg;
      const lo = Math.min(base, other), hi = Math.max(base, other), ra = 30, p1 = P(lo, ra), p2 = P(hi, ra);
      s += S.path(`M${cx},${cy} L${R2(p1[0])},${R2(p1[1])} A${ra},${ra} 0 0 0 ${R2(p2[0])},${R2(p2[1])} Z`, { cls: 'f-c', 'fill-opacity': 0.45 });
      [base, other].forEach((t) => { const e = P(t, r + 14); s += S.line(cx, cy, e[0], e[1], { cls: 's-c', sw: 3.5, 'stroke-linecap': 'round' }); });
    }
    s += labs;
    s += S.circle(cx, cy, 4.5, { cls: 'f-ink' });
    return S.svg(W, H, s, { cls: 'vz-geo', label: 'מד-זווית', maxw: o.maxw || 340 });
  }

  /* ---------- שעון ---------- */
  function clock(hr, o) {
    o = o || {};
    const R = 80, cx = 92, cy = 92;
    let s = S.circle(cx, cy, R, { cls: 'f-w s-ink', sw: 3.5 });
    for (let k = 0; k < 12; k++) {
      const t = (k * 30 - 90) * RAD, c1 = Math.cos(t), s1 = Math.sin(t);
      s += S.line(cx + c1 * (R - 9), cy + s1 * (R - 9), cx + c1 * R, cy + s1 * R, { sw: 2.5 });
      s += S.text(cx + c1 * (R - 21), cy + s1 * (R - 21), String(k || 12), { fs: 14, fw: 700 });
    }
    const th = (hr * 30 - 90) * RAD;
    s += S.line(cx, cy, cx + Math.cos(th) * 44, cy + Math.sin(th) * 44, { sw: 6, 'stroke-linecap': 'round', cls: 's-a' });
    s += S.line(cx, cy, cx, cy - 64, { sw: 3.5, 'stroke-linecap': 'round', cls: 's-ink' });
    s += S.circle(cx, cy, 5, { cls: 'f-ink' });
    return S.svg(184, 184, s, { cls: 'vz-geo', label: 'שעון', maxw: o.maxw || 170 });
  }

  /* ---------- שני ישרים ---------- */
  // kind: 'par' מקבילים | 'near' כמעט מקבילים | 'perp' מאונכים | 'cross' נחתכים בזווית o.ang
  function twoLines(kind, o) {
    o = o || {};
    const t = (o.rot || 0) * RAD, Lh = 100;
    const dir = (a) => [Math.cos(a), -Math.sin(a)];
    const u = dir(t), segs = [];
    let s = '';
    if (kind === 'par' || kind === 'near') {
      const n = dir(t + Math.PI / 2), gap = 58, s0 = add(mul(u, -Lh), mul(n, gap));
      segs.push([mul(u, -Lh), mul(u, Lh)]);
      segs.push([s0, add(s0, mul(kind === 'par' ? u : dir(t - (o.tilt || 13) * RAD), 2 * Lh))]);
    } else {
      const v = dir(t + (kind === 'perp' ? 90 : o.ang || 60) * RAD);
      if (o.corner) { segs.push([[0, 0], mul(u, 1.6 * Lh)]); segs.push([[0, 0], mul(v, 1.2 * Lh)]); }
      else { segs.push([mul(u, -Lh), mul(u, Lh)]); segs.push([mul(v, -0.8 * Lh), mul(v, 0.8 * Lh)]); }
      if (o.marks && kind === 'perp') s += rightMark([0, 0], u, v, 15, 's-a');
    }
    segs.forEach((sg) => (s += S.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1], { sw: 3.5, 'stroke-linecap': 'round' })));
    if (o.marks && kind === 'par') segs.forEach((sg) => (s += chevrons(sg[0], sg[1], 1)));
    return fitSvg(s, [].concat(...segs), { maxw: o.maxw || 160, label: 'שני ישרים' });
  }

  /* ---------- דף משבצות ---------- */
  const U = 30; // גודל משבצת בפיקסלים
  // gpts: קודקודים ביחידות משבצת. o: {labels, marks, maxw}
  const gridPoly = (gpts, o) => V.polygon(scaleP(gpts, U), Object.assign({ grid: U, pad: 28 }, o || {}));
  // צעדים על דף משבצות בין שתי נקודות (משמאל לימין)
  function stepVec(P, Q) { let v = sub(Q, P); if (v[0] < 0 || (v[0] === 0 && v[1] > 0)) v = mul(v, -1); return v; }
  function stepTxt(v) {
    const parts = [];
    if (v[0]) parts.push(HM.cnt(Math.abs(v[0]), 'משבצת', 'משבצות', true) + ' ימינה');
    if (v[1]) parts.push(HM.cnt(Math.abs(v[1]), 'משבצת', 'משבצות', true) + (v[1] < 0 ? ' למעלה' : ' למטה'));
    if (parts.length < 2) return parts[0] || '';
    return parts[0] + (/^\d/.test(parts[1]) ? ' ו-' : ' ו') + parts[1];
  }
  // מרובע על דף משבצות. kind: 'trap' | 'par' | 'gen' | 'kite' | 'rect'
  function gridQuad(c, kind) {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [2, -1], [1, 2], [1, -2], [3, 1], [3, -1]];
    for (let t = 0; t < 400; t++) {
      let p;
      if (kind === 'kite') {
        const sx = c.rnd(2, 3), h1 = c.rnd(1, 2), h2 = c.rnd(3, 4);
        p = [[0, 0], [sx, h1], [0, h1 + h2], [-sx, h1]];
        if (c.chance(0.5)) p = p.map((q) => [q[1], q[0]]);
        if (c.chance(0.5)) p = p.map((q) => [-q[0], -q[1]]);
      } else {
        const d = c.pick(dirs), a = c.rnd(1, 4);
        const A = [0, 0], B = mul(d, a);
        let w;
        if (kind === 'rect') { const k = c.rnd(1, 3); w = mul([-d[1], d[0]], k); }
        else w = [c.rnd(-3, 3), c.rnd(2, 5)];
        const Dd = add(A, w);
        let C;
        if (kind === 'par' || kind === 'rect') C = add(B, w);
        else if (kind === 'trap') { let c2 = c.rnd(1, 4); if (c2 === a) c2 = a + (a < 3 ? 1 : -1); C = add(Dd, mul(d, c2)); }
        else C = add(Dd, [c.rnd(1, 6), c.rnd(-3, 3)]);
        p = [A, B, C, Dd];
      }
      if (!convex(p)) continue;
      const v = (i) => sub(p[(i + 1) % 4], p[i]);
      if ([0, 1, 2, 3].some((i) => len(v(i)) < 1.9)) continue;
      if ([0, 1, 2, 3].some((i) => { const a = angAt(p, i); return a < 38 || a > 142; })) continue;
      const par02 = Math.abs(cross(v(0), v(2))) < 1e-9, par13 = Math.abs(cross(v(1), v(3))) < 1e-9;
      const want = { trap: [true, false], par: [true, true], rect: [true, true], gen: [false, false], kite: [false, false] }[kind];
      if (par02 !== want[0] || par13 !== want[1]) continue;
      if (!par02 && lineAng(v(0), v(2)) < 12) continue;
      if (!par13 && lineAng(v(1), v(3)) < 12) continue;
      const mx = Math.min(...p.map((q) => q[0])), my = Math.min(...p.map((q) => q[1]));
      p = p.map((q) => [q[0] - mx, q[1] - my]);
      const W = Math.max(...p.map((q) => q[0])), H = Math.max(...p.map((q) => q[1]));
      if (W > 8 || H > 6 || W < 3 || H < 2) continue;
      if (c.chance(0.5)) p = p.map((q) => [W - q[0], q[1]]);
      // מתחילים מקודקוד אקראי כדי שהצלעות המקבילות לא יהיו תמיד אותן צלעות
      const k = kind === 'trap' || kind === 'gen' ? c.rnd(0, 3) : 0;
      return p.slice(k).concat(p.slice(0, k));
    }
    return { trap: [[0, 3], [2, 0], [5, 0], [7, 3]], par: [[0, 3], [2, 0], [7, 0], [5, 3]], rect: [[0, 0], [5, 0], [5, 3], [0, 3]], gen: [[0, 2], [3, 0], [7, 2], [2, 5]], kite: [[2, 0], [4, 1], [2, 5], [0, 1]] }[kind];
  }
  // אילו זוגות של צלעות נגדיות מקבילים: [0-2, 1-3]
  const parPairs = (p) => { const v = (i) => sub(p[(i + 1) % 4], p[i]); return [Math.abs(cross(v(0), v(2))) < 1e-6, Math.abs(cross(v(1), v(3))) < 1e-6]; };

  /* ---------- צורות מוכנות עם הסימונים שלהן ---------- */
  const NAMES = {
    square: { s: 'ריבוע', p: 'ריבועים' }, rect: { s: 'מלבן', p: 'מלבנים' }, rhombus: { s: 'מעוין', p: 'מעוינים' },
    par: { s: 'מקבילית', p: 'מקביליות', f: true }, kite: { s: 'דלתון', p: 'דלתונים' }, trap: { s: 'טרפז שווה-שוקיים', p: 'טרפזים' },
    rtrap: { s: 'טרפז ישר-זווית', p: 'טרפזים' }, quad: { s: 'מרובע', p: 'מרובעים' },
  };
  // מקבילית עם זווית חדה deg בקודקוד 0 (א למטה משמאל, נגד כיוון השעון)
  function parPts(bs, h, deg) { const off = h / Math.tan(deg * RAD); return [[0, h], [bs, h], [bs + off, 0], [off, 0]]; }
  // מעוין: זווית חדה deg בקודקודים 0 ו-2, זווית קהה בקודקודים 1 ו-3
  function rhomPts(a, deg) { const dx = a * Math.cos(deg * RAD), dy = a * Math.sin(deg * RAD); return [[0, dy], [a, dy], [a + dx, 0], [dx, 0]]; }
  // shape(kind,c,o) => {pts, ticks, right, arrows, mirrors}
  function shape(kind, c, o) {
    o = o || {};
    let p, tk = [0, 0, 0, 0], rt = [], ar = [0, 0, 0, 0];
    switch (kind) {
      case 'square': p = V.shapes.square(c.rnd(100, 125)); tk = [1, 1, 1, 1]; rt = [0, 1, 2, 3]; ar = [1, 2, 1, 2]; break;
      case 'rect': p = V.shapes.rect(c.rnd(160, 195), c.rnd(80, 105)); tk = [1, 2, 1, 2]; rt = [0, 1, 2, 3]; ar = [1, 2, 1, 2]; break;
      case 'rhombus': p = rhomPts(c.rnd(105, 125), o.deg || c.pick([50, 55, 60, 65, 70])); tk = [1, 1, 1, 1]; ar = [1, 2, 1, 2]; break;
      case 'par': p = parPts(c.rnd(150, 185), c.rnd(80, 100), o.deg || c.pick([50, 55, 60, 65, 70])); tk = [1, 2, 1, 2]; ar = [1, 2, 1, 2]; break;
      case 'kite': { const w = c.rnd(120, 150); p = V.shapes.kite(w, c.rnd(45, 60), c.rnd(115, 140)); tk = [1, 2, 2, 1]; break; }
      case 'trap': { const bo = c.rnd(180, 210), tp = c.rnd(80, 110), h = c.rnd(80, 100); p = V.shapes.trapezoid(bo, tp, h, (bo - tp) / 2); tk = [0, 1, 0, 1]; ar = [1, 0, 1, 0]; break; }
      case 'rtrap': { const bo = c.rnd(170, 200), tp = c.rnd(90, 120), h = c.rnd(90, 110); p = [[0, 0], [tp, 0], [bo, h], [0, h]]; rt = [0, 3]; ar = [1, 0, 1, 0]; break; }
      default: p = c.pick([[[30, 20], [200, 0], [240, 150], [0, 130]], [[0, 40], [170, 0], [215, 120], [40, 160]], [[20, 0], [210, 30], [190, 160], [0, 120]]]);
    }
    p = rot(p, o.rot || 0);
    const P = p;
    let mir = [];
    if (kind === 'square') mir = [[P[0], P[2]], [P[1], P[3]], [mid(P[0], P[1]), mid(P[2], P[3])], [mid(P[1], P[2]), mid(P[3], P[0])]];
    else if (kind === 'rect') mir = [[mid(P[0], P[1]), mid(P[2], P[3])], [mid(P[1], P[2]), mid(P[3], P[0])]];
    else if (kind === 'rhombus') mir = [[P[0], P[2]], [P[1], P[3]]];
    else if (kind === 'kite') mir = [[P[0], P[2]]];
    else if (kind === 'trap') mir = [[mid(P[0], P[1]), mid(P[2], P[3])]];
    return { kind, pts: p, ticks: tk, right: rt, arrows: ar, mirrors: mir };
  }
  // ציור צורה. o: {labels, marks:true (כל הסימונים) | ticks/right/arrows, mirrors, diags, maxw, fill, sideCls, arcs, extra}
  function draw(sh, o) {
    o = o || {};
    const opt = { maxw: o.maxw || 220, fill: o.fill || 'f-l' };
    if (o.labels) opt.labels = o.labels === true ? L4 : o.labels;
    if (o.marks || o.ticks) opt.ticks = sh.ticks;
    if (o.marks || o.right) opt.right = sh.right;
    if (o.marks || o.arrows) opt.arrows = sh.arrows;
    if (o.mirrors) opt.mirrors = o.mirrors === true ? sh.mirrors : o.mirrors;
    ['diags', 'sideCls', 'arcs', 'extra', 'sides', 'pad'].forEach((k) => { if (o[k] != null) opt[k] = o[k]; });
    return V.polygon(sh.pts, opt);
  }

  /* ---------- שושנת הרוחות ---------- */
  const DIRS = ['צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח', 'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'];
  const dirDiff = (i, j) => { const d = Math.abs(i - j) % 8; return Math.min(d, 8 - d) * 45; };
  // o: {hl:[i], q:i (סימן שאלה), only:[i] (רק התוויות האלה), mainOnly, face:i (חץ), arc:[i,j,label], maxw}
  function rose(o) {
    o = o || {};
    const cx = 170, cy = 160, R = 104;
    const dv = (i, r) => { const a = (i * 45 - 90) * RAD; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const hl = o.hl || [];
    let s = S.circle(cx, cy, R * 0.55, { fill: 'none', cls: 's-soft', sw: 1.5 });
    if (o.arc) {
      const [i, j] = o.arc, ra = 48;
      let d = ((j - i) % 8 + 8) % 8; const cw = d <= 4; if (!cw) d = 8 - d;
      const p1 = dv(i, ra), p2 = dv(j, ra);
      s += S.path(`M${cx},${cy} L${R2(p1[0])},${R2(p1[1])} A${ra},${ra} 0 ${d > 4 ? 1 : 0} ${cw ? 1 : 0} ${R2(p2[0])},${R2(p2[1])} Z`, { cls: 'f-c', 'fill-opacity': 0.5 });
    }
    [1, 3, 5, 7, 0, 2, 4, 6].forEach((i) => {
      const main = i % 2 === 0;
      if (o.mainOnly && !main) return;
      const tip = dv(i, main ? R : R * 0.66), w = main ? 13 : 9, s1 = dv(i - 2, w), s2 = dv(i + 2, w), on = hl.indexOf(i) >= 0;
      s += S.poly([[cx, cy], s1, tip], { cls: (on ? 'f-c' : main ? 'f-a' : 'f-b') + ' s-ink', sw: 1.2, 'stroke-linejoin': 'round' });
      s += S.poly([[cx, cy], tip, s2], { cls: (on ? 'f-c' : 'f-w') + ' s-ink', sw: 1.2, 'stroke-linejoin': 'round' });
    });
    if (o.face != null) {
      const e = dv(o.face, R * 0.52), u = unit(sub(e, [cx, cy])), nn = [-u[1], u[0]];
      s += S.line(cx, cy, e[0] - u[0] * 8, e[1] - u[1] * 8, { cls: 's-c', sw: 6, 'stroke-linecap': 'round' });
      s += S.poly([add(e, mul(u, 6)), add(sub(e, mul(u, 12)), mul(nn, 10)), add(sub(e, mul(u, 12)), mul(nn, -10))], { cls: 'f-c s-ink', sw: 1.5 });
    }
    s += S.circle(cx, cy, 5, { cls: 'f-ink' });
    for (let i = 0; i < 8; i++) {
      const main = i % 2 === 0;
      if (o.mainOnly && !main) continue;
      if (o.only && o.only.indexOf(i) < 0 && o.q !== i) continue;
      const p = dv(i, main ? R + 22 : R * 0.66 + 34);
      if (o.q === i) s += S.text(p[0], p[1], '?', { fs: 24, fw: 800, cls: 't-c' });
      else s += S.text(p[0], p[1], DIRS[i], { fs: main ? 16 : 13, fw: main ? 800 : 700, cls: hl.indexOf(i) >= 0 ? 't-c' : 't-ink' });
    }
    return S.svg(340, 320, s, { cls: 'vz-geo', label: 'שושנת הרוחות', maxw: o.maxw || 280 });
  }
  // מפה קטנה: בית במרכז ומקומות בכיוונים שונים. places: [[dirIdx, name]]
  function mapPic(places, o) {
    o = o || {};
    const W = 340, H = 250, cx = 160, cy = 132;
    let s = S.rect(2, 2, W - 4, H - 4, { rx: 14, cls: 'f-w s-soft', sw: 2 });
    for (let x = 22; x < W; x += 40) s += S.line(x, 4, x, H - 4, { cls: 's-grid', sw: 1 });
    for (let y = 12; y < H; y += 40) s += S.line(4, y, W - 4, y, { cls: 's-grid', sw: 1 });
    const off = [[0, -88], [82, -78], [104, 0], [82, 78], [0, 88], [-82, 78], [-104, 0], [-82, -78]];
    s += S.poly([[cx - 14, cy + 12], [cx - 14, cy - 4], [cx, cy - 16], [cx + 14, cy - 4], [cx + 14, cy + 12]], { cls: 'f-b s-ink', sw: 2, 'stroke-linejoin': 'round' });
    s += S.text(cx, cy + 26, o.home || 'הבית', { fs: 13, fw: 800 });
    places.forEach((pl, k) => {
      const x = cx + off[pl[0]][0], y = cy + off[pl[0]][1];
      s += S.circle(x, y, 9, { cls: (k === 0 ? 'f-c' : 'f-a') + ' s-ink', sw: 2 });
      s += S.text(x, y + (off[pl[0]][1] > 0 ? 21 : -19), pl[1], { fs: 13, fw: 700 });
    });
    // חץ הצפון
    s += S.line(W - 26, 58, W - 26, 22, { sw: 3 }) + S.poly([[W - 26, 14], [W - 33, 27], [W - 19, 27]], { cls: 'f-ink' });
    s += S.text(W - 26, 72, 'צפון', { fs: 12, fw: 800 });
    return S.svg(W, H, s, { cls: 'vz-geo', label: 'מפה', maxw: o.maxw || 330 });
  }

  /* ---------- דיאגרמות הכלה ---------- */
  const ell = (cx, cy, rx, ry, cls) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${cls}" stroke-width="2.5" fill-opacity="0.45"/>`;
  function venn(kind) {
    let s = ell(170, 105, 160, 96, 'f-l s-a') + S.text(170, 28, 'מקביליות', { fs: 16, fw: 800, cls: 't-a' });
    if (kind === 'rect') s += ell(170, 118, 86, 52, 'f-b s-b') + S.text(170, 118, 'מלבנים', { fs: 16, fw: 800 });
    else if (kind === 'rhom') s += ell(170, 118, 86, 52, 'f-c s-c') + S.text(170, 118, 'מעוינים', { fs: 16, fw: 800 });
    else {
      s += ell(132, 118, 82, 56, 'f-b s-b') + ell(208, 118, 82, 56, 'f-c s-c');
      s += S.text(100, 118, 'מלבנים', { fs: 14, fw: 800 }) + S.text(240, 118, 'מעוינים', { fs: 14, fw: 800 }) + S.text(170, 118, 'ריבועים', { fs: 13, fw: 800 });
    }
    return S.svg(340, 210, s, { cls: 'vz-geo', label: 'דיאגרמת הכלה', maxw: 320 });
  }

  /* ================= צלעות במרובעים ================= */
  const Q0 = [[30, 20], [200, 0], [240, 150], [0, 130]];
  HM.lesson({
    id: 'g-sides',
    learn: (c) => [
      {
        title: 'מרובע והשמות שלו',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} סביבך: דף, חלון, מסך — כולם ${b('מרובעים')}.<br>למרובע יש ${b('4 צלעות')} ו-${b('4 קודקודים')}. נותנים לקודקודים שמות לפי הסדר מסביב: א, ב, ג, ד — וקוראים למרובע ${b('אבגד')}.<br>כל צלע נקראת לפי שני הקודקודים שבקצותיה: אב, בג, גד, אד.`,
        visual: V.polygon(Q0, { labels: L4, maxw: 230 }),
      },
      {
        title: 'צלעות סמוכות וצלעות נגדיות',
        html: `${b('צלעות סמוכות')} נפגשות בקודקוד משותף: הצלע אב והצלע בג נפגשות בקודקוד ב.<br>${b('צלעות נגדיות')} עומדות זו מול זו ואין להן קודקוד משותף: הצלע אב והצלע גד.<br>במרובע יש ${b('2 זוגות')} של צלעות נגדיות.`,
        visual: row(capt(V.polygon(Q0, { labels: L4, sideCls: ['s-c', 's-c', '', ''], maxw: 160 }), 'צלעות סמוכות'), capt(V.polygon(Q0, { labels: L4, sideCls: ['s-c', '', 's-c', ''], maxw: 160 }), 'צלעות נגדיות')),
      },
      {
        title: 'ישרים מקבילים',
        html: `${b('ישרים מקבילים')} לא נפגשים אף פעם, גם אם ממשיכים אותם עוד ועוד — כמו שני פסי רכבת. המרחק ביניהם נשאר תמיד אותו מרחק.<br>מסמנים ישרים מקבילים ב${b('חצים קטנים')}, ורושמים: ${b('אב ∥ גד')} (קוראים: "אב מקבילה לגד").`,
        visual: row(twoLines('par', { rot: 20, marks: true, maxw: 150 }), draw(shape('trap', c), { labels: true, arrows: true, maxw: 170 })),
      },
      {
        title: 'ישרים מאונכים',
        html: `${b('ישרים מאונכים')} נפגשים ויוצרים ${b('זווית ישרה')} — כמו הפינה של דף.<br>מסמנים זווית ישרה בריבוע קטן, ורושמים: ${b('אב ⊥ אד')} (קוראים: "אב מאונכת לאד").<br>${c.g('שים לב', 'שימי לב')}: ישרים מאונכים לא חייבים להיות "עומד" ו"שוכב". גם ישרים באלכסון יכולים להיות מאונכים זה לזה.`,
        visual: row(twoLines('perp', { rot: 30, marks: true, maxw: 140 }), draw(shape('rtrap', c), { labels: true, right: true, maxw: 170 })),
      },
      {
        title: 'סרטוט על דף משבצות',
        html: `על דף משבצות קל לבדוק אם צלעות מקבילות: ${c.g('ספור', 'ספרי')} כמה משבצות כל צלע זזה ימינה וכמה למעלה או למטה. ${b('לצלעות מקבילות יש אותו כיוון')} — אותם צעדים, או אותם צעדים כפול מספר.<br>אילו צלעות מקבילות ואילו מאונכות במרובע אבגד?`,
        visual: gridPoly([[1, 1], [5, 1], [7, 4], [1, 4]], { labels: L4 }),
        steps: [
          'הצלע אב: 4 משבצות ימינה, לאורך קו אופקי. הצלע גד: 6 משבצות ימינה, גם היא לאורך קו אופקי.',
          'שתי הצלעות אופקיות — יש להן אותו כיוון, לכן אב ∥ גד.',
          'הצלע אד עומדת על קו אנכי, ולכן היא מאונכת לשתיהן: אד ⊥ אב וגם אד ⊥ גד.',
          'הצלע בג: 2 משבצות ימינה ו-3 למטה — כיוון אחר. היא לא מקבילה לאד ולא מאונכת לאב.',
        ],
      },
      {
        title: 'בדיקה קטנה',
        html: `${c.g('הסתכל', 'הסתכלי')} על המרובע אבגד ו${c.g('ענה', 'עני')}.`,
        visual: V.polygon(Q0, { labels: L4, maxw: 200 }),
        quiz: {
          type: 'tf', prompt: 'הצלע אב והצלע בג הן צלעות נגדיות.', answer: false,
          hint: 'האם יש להן קודקוד משותף?',
          solution: ['לצלע אב ולצלע בג יש קודקוד משותף: ב.', 'לכן הן צלעות סמוכות, לא נגדיות.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: real, story, streets, claim, gridStep
      const kinds = level === 1 ? ['opp', 'adjTF', 'lines', 'perpSide', 'pairs', 'real', 'real', 'story']
        : level === 2 ? ['opp', 'whichPar', 'lines', 'countPar', 'perpSide', 'real', 'story', 'streets']
        : ['whichPar', 'whichPar', 'countPar', 'drawPick', 'lines', 'gridStep', 'streets', 'claim', 'perpSide'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'story': {
          const sc = c.scene([
            { tags: ['sport'], obj: 'מגרש הכדורגל', v: ['רץ', 'רצה'], inf: 'לרוץ' },
            { tags: ['animals'], obj: 'הלול של התרנגולות', v: ['בנה גדר', 'בנתה גדר'], inf: 'לבנות גדר' },
            { tags: ['space'], obj: 'הפאנל הסולארי של החללית', v: ['הדביק פס כסוף', 'הדביקה פס כסוף'], inf: 'להדביק פס כסוף' },
            { tags: ['music'], obj: 'הבמה', v: ['סידר רמקולים', 'סידרה רמקולים'], inf: 'לסדר רמקולים' },
            { tags: ['baking'], obj: 'העוגייה', v: ['שפך שוקולד', 'שפכה שוקולד'], inf: 'לשפוך שוקולד' },
            { tags: ['games'], obj: 'לוח המשחק', v: ['הדביק פס צבעוני', 'הדביקה פס צבעוני'], inf: 'להדביק פס צבעוני' },
            { tags: ['art'], obj: 'מסגרת התמונה', v: ['צבע בזהב', 'צבעה בזהב'], inf: 'לצבוע בזהב' },
            { tags: ['nature'], obj: 'ערוגת הפרחים', v: ['שתל פרחים', 'שתלה פרחים'], inf: 'לשתול פרחים' },
            { tags: ['reading'], obj: 'הסימנייה של הספר', v: ['הדביק סרט', 'הדביקה סרט'], inf: 'להדביק סרט' },
            { tags: ['tech'], obj: 'מסלול הרובוט', v: ['בנה קיר', 'בנתה קיר'], inf: 'לבנות קיר' },
            { tags: ['kpop'], obj: 'רחבת הריקודים בחוג הקיי-פופ', v: ['סימן קו בסרט דביק', 'סימנה קו בסרט דביק'], inf: 'לסמן קו' },
            { tags: ['magic'], obj: 'מגרש התעופה בבית הספר לקוסמים', v: ['טס על מטאטא', 'טסה על מטאטא'], inf: 'לטוס' },
            { tags: ['squishy'], obj: 'המכסה של קופסת הסקווישים', v: ['הדביק מדבקות', 'הדביקה מדבקות'], inf: 'להדביק מדבקות' },
          ]);
          const who = c.chance(0.5) ? c.me : c.friend();
          const lab = labelSet(c), sd = sidesOf(lab), i = c.rnd(0, 3), X = sd[i];
          const askOpp = level === 1 ? c.chance(0.7) : c.chance(0.5);
          const diag = c.pick(['אג', 'בד']);
          const choices = askOpp ? [sd[(i + 2) % 4], sd[(i + 1) % 4], sd[(i + 3) % 4], diag] : [sd[(i + 1 + 2 * c.rnd(0, 1)) % 4], sd[(i + 2) % 4], diag];
          return {
            type: 'choice', visual: V.polygon(rot(c.pick([Q0, [[0, 40], [170, 0], [215, 120], [40, 160]]]), rndRot(c)), { labels: lab, sideCls: [0, 1, 2, 3].map((k) => (k === i ? 's-c' : '')), maxw: 210 }),
            prompt: `${who.name} ${who.g(sc.v[0], sc.v[1])} לאורך הצלע ${X} של ${sc.obj} (בציור). עכשיו ${who.g('הוא רוצה', 'היא רוצה')} ${sc.inf} גם לאורך ${askOpp ? b('הצלע הנגדית') : b('צלע סמוכה')} לצלע ${X}. ${askOpp ? 'איזו צלע זו?' : 'איזו צלע מתאימה?'}`,
            choices, answer: 0,
            hint: `צלע סמוכה נוגעת בצלע ${X} בקודקוד משותף. הצלע הנגדית עומדת מולה ולא נוגעת בה.`,
            solution: [`הצלע ${X} מחברת את הקודקוד ${X[0]} לקודקוד ${X[1]}.`, askOpp ? `הצלע ${choices[0]} לא נוגעת בהם — היא הצלע הנגדית.` : `הצלע ${choices[0]} נוגעת בצלע ${X} בקודקוד משותף — היא סמוכה לה.`],
          };
        }
        case 'streets': {
          const ST = [
            { tags: ['sport'], n: 'רחוב האצטדיון' }, { tags: ['animals'], n: 'רחוב הצבאים' }, { tags: ['space'], n: 'רחוב הכוכבים' },
            { tags: ['music'], n: 'רחוב הכינור' }, { tags: ['baking'], n: 'רחוב האופים' }, { tags: ['games'], n: 'רחוב השחמט' },
            { tags: ['art'], n: 'רחוב הציירים' }, { tags: ['nature'], n: 'רחוב האלונים' }, { tags: ['reading'], n: 'רחוב הסופרים' },
            { tags: ['tech'], n: 'רחוב הממציאים' }, { tags: ['kpop'], n: 'רחוב הרקדנים' }, { tags: ['magic'], n: 'רחוב הקוסמים' },
            { tags: ['squishy'], n: 'רחוב הצעצועים' },
          ];
          const s1 = c.scene(ST), [s2, s3] = c.sample(ST.filter((x) => x !== s1), 2);
          const [A, B, C] = c.shuffle([s1.n, s2.n, s3.n]);
          const who = c.chance(0.5) ? c.me : c.friend();
          const v = c.pick(level === 2 ? ['perp', 'par'] : ['perp', 'par', 'twoPerp', 'twoPerp']);
          const rel = { perp: [`${A} מקביל ל${B}, ו${C} מאונך ל${A}.`, C, B, 1, `${C} מאונך ל${A}, ו${B} הולך באותו כיוון כמו ${A}. לכן ${C} מאונך גם ל${B}.`],
            par: [`${A} מקביל ל${B}, ו${C} מקביל ל${A}.`, C, B, 0, `${B} ו${C} הולכים שניהם באותו כיוון כמו ${A}. לכן הם מקבילים זה לזה.`],
            twoPerp: [`${A} מאונך ל${B}, וגם ${C} מאונך ל${B}.`, A, C, 0, `${A} ו${C} חוצים את ${B} בזווית ישרה — שניהם הולכים באותו כיוון. לכן הם מקבילים זה לזה.`] }[v];
          return {
            type: 'choice', keep: true,
            prompt: `${who.name} ${who.g('מסתכל', 'מסתכלת')} במפת השכונה: ${rel[0]} מה נכון לגבי ${rel[1]} ו${rel[2]}?`,
            choices: ['הם מקבילים זה לזה', 'הם מאונכים זה לזה', 'הם לא מקבילים ולא מאונכים'], answer: rel[3],
            hint: `${c.g('סרטט', 'סרטטי')} את שלושת הרחובות על דף: ${c.g('התחל', 'התחילי')} ברחוב הראשון, ו${c.g('הוסף', 'הוסיפי')} את האחרים לפי הנתונים.`,
            solution: [rel[4]],
          };
        }
        case 'claim': {
          const f = c.friend();
          const st = c.pick([
            ['במרובע, שתי צלעות סמוכות יכולות להיות מקבילות זו לזו', false, 'צלעות סמוכות נפגשות בקודקוד, וישרים מקבילים אף פעם לא נפגשים.'],
            ['שני ישרים שמאונכים לאותו ישר — מקבילים זה לזה', true, 'שניהם יוצרים זווית ישרה עם אותו ישר, ולכן הם הולכים באותו כיוון ולא ייפגשו.'],
            ['אם ישר מאונך לאחד משני ישרים מקבילים, הוא מאונך גם לשני', true, 'שני הישרים המקבילים הולכים באותו כיוון, ולכן הוא חוצה את שניהם באותה זווית — זווית ישרה.'],
            ['במרובע יכולות להיות 3 צלעות שכל שתיים מהן מקבילות', false, 'מבין 3 צלעות של מרובע, תמיד יש שתיים סמוכות — וצלעות סמוכות לא יכולות להיות מקבילות.'],
            ['שני ישרים שלא נפגשים בציור — הם תמיד מקבילים', false, 'אולי הם ייפגשו אם נמשיך אותם. מקבילים הם רק ישרים שהמרחק ביניהם שווה לכל האורך.'],
            ['למרובע יכולים להיות שני זוגות של צלעות מקבילות', true, 'למשל במלבן: כל צלע מקבילה לצלע שמולה.'],
            ['במרובע יש בדיוק 2 זוגות של צלעות נגדיות', true, 'אב מול גד, ובג מול אד.'],
          ]);
          return {
            type: 'tf', prompt: `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?`, answer: st[1],
            hint: `${c.g('נסה', 'נסי')} לסרטט את המצב שבטענה. אם ${c.g('אתה מוצא', 'את מוצאת')} דוגמה שלא מתאימה — הטענה לא נכונה.`,
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
        case 'opp': {
          const lab = labelSet(c), sd = sidesOf(lab), i = c.rnd(0, 3), X = sd[i];
          const askOpp = level === 1 || c.chance(0.6);
          const diag = c.pick(['אג', 'בד']);
          const vis = V.polygon(rot(c.pick([Q0, [[0, 40], [170, 0], [215, 120], [40, 160]]]), rndRot(c)), { labels: lab, sideCls: [0, 1, 2, 3].map((k) => (k === i ? 's-c' : '')), maxw: 220 });
          const choices = askOpp ? [sd[(i + 2) % 4], sd[(i + 1) % 4], sd[(i + 3) % 4], diag] : [sd[(i + 1 + 2 * c.rnd(0, 1)) % 4], sd[(i + 2) % 4], diag];
          return {
            type: 'choice', prompt: `במרובע שבציור, איזו צלע ${askOpp ? b('נגדית') : b('סמוכה')} לצלע ${X}?`, visual: vis, choices, answer: 0,
            hint: `צלע סמוכה נוגעת בצלע ${X} בקודקוד משותף. צלע נגדית לא נוגעת בה בכלל. ו${c.g('זכור', 'זכרי')}: אג ובד הם אלכסונים, לא צלעות.`,
            solution: [`הצלע ${X} מחברת את הקודקוד ${X[0]} לקודקוד ${X[1]}.`, askOpp ? `הצלע ${choices[0]} לא עוברת באף אחד מהם — היא הצלע הנגדית.` : `הצלע ${choices[0]} נפגשת איתה בקודקוד משותף — היא צלע סמוכה.`],
          };
        }
        case 'adjTF': {
          const lab = labelSet(c), sd = sidesOf(lab), i = c.rnd(0, 3), j = (i + c.rnd(1, 3)) % 4;
          const isOpp = (j - i + 4) % 4 === 2, claimOpp = c.chance(0.5);
          const common = L4.find((x) => sd[i].indexOf(x) >= 0 && sd[j].indexOf(x) >= 0);
          return {
            type: 'tf', prompt: `במרובע שבציור, הצלע ${sd[i]} והצלע ${sd[j]} הן צלעות ${claimOpp ? 'נגדיות' : 'סמוכות'}.`,
            visual: V.polygon(rot(Q0, rndRot(c)), { labels: lab, sideCls: [0, 1, 2, 3].map((k) => (k === i || k === j ? 's-c' : '')), maxw: 220 }),
            answer: claimOpp === isOpp,
            hint: `${c.g('בדוק', 'בדקי')} אם לשתי הצלעות יש קודקוד משותף.`,
            solution: isOpp ? [`לצלע ${sd[i]} ולצלע ${sd[j]} אין קודקוד משותף.`, `לכן הן צלעות נגדיות — הטענה ${claimOpp ? 'נכונה' : 'לא נכונה'}.`]
              : [`לצלע ${sd[i]} ולצלע ${sd[j]} יש קודקוד משותף: ${common}.`, `לכן הן צלעות סמוכות — הטענה ${claimOpp ? 'לא נכונה' : 'נכונה'}.`],
          };
        }
        case 'pairs': {
          const v = c.pick([
            { q: 'כמה זוגות של צלעות נגדיות יש במרובע?', a: 2, why: 'אב מול גד, ובג מול אד — 2 זוגות.' },
            { q: 'כמה זוגות של צלעות סמוכות יש במרובע?', a: 4, why: 'בכל קודקוד נפגשות שתי צלעות סמוכות, ויש 4 קודקודים — 4 זוגות.' },
            { q: `לכמה צלעות סמוכה הצלע ${c.pick(['אב', 'בג', 'גד', 'אד'])}?`, a: 2, why: 'היא נפגשת עם צלע אחת בכל קצה שלה — 2 צלעות סמוכות.' },
            { q: 'כמה קודקודים יש למרובע?', a: 4, why: 'למרובע יש 4 צלעות ו-4 קודקודים.' },
          ]);
          return {
            type: 'number', prompt: v.q, answer: v.a, visual: V.polygon(rot(Q0, rndRot(c)), { labels: L4, maxw: 200 }),
            hint: `${c.g('היעזר', 'היעזרי')} בציור: ${c.g('עבור', 'עברי')} על הצלעות אחת אחת.`,
            solution: [v.why],
          };
        }
        case 'lines': {
          const askPar = c.chance(0.5), r = () => rndRot(c);
          const mw = { maxw: 150 };
          const choices = askPar
            ? [twoLines('par', Object.assign({ rot: r() }, mw)), twoLines('near', Object.assign({ rot: r(), tilt: level === 3 ? 9 : 14 }, mw)), twoLines('perp', Object.assign({ rot: r() }, mw)), twoLines('cross', Object.assign({ rot: r(), ang: c.pick([35, 45, 140]) }, mw))]
            : [twoLines('perp', Object.assign({ rot: r(), corner: c.chance(0.4) }, mw)), twoLines('cross', Object.assign({ rot: r(), ang: level === 3 ? c.pick([72, 108]) : c.pick([60, 120]) }, mw)), twoLines('par', Object.assign({ rot: r() }, mw)), twoLines('cross', Object.assign({ rot: r(), ang: c.pick([30, 40, 150]), corner: true }, mw))];
          return {
            type: 'choice', cols: 2, prompt: `באיזה ציור שני הישרים ${b(askPar ? 'מקבילים' : 'מאונכים')} זה לזה?`, choices, answer: 0,
            hint: askPar ? 'ישרים מקבילים שומרים כל הזמן על אותו מרחק ביניהם — הם לא מתקרבים ולא מתרחקים.' : `ישרים מאונכים נפגשים בזווית ישרה. ${c.g('דמיין', 'דמייני')} את הפינה של דף בין שני הישרים.`,
            solution: askPar ? ['בציור הנכון המרחק בין הישרים שווה לכל האורך.', 'בציור "הכמעט מקביל" הישרים מתקרבים — אם נמשיך אותם, הם ייפגשו.']
              : ['בציור הנכון הישרים נפגשים בזווית ישרה (' + dg(90) + '), גם אם הם עומדים באלכסון.', 'בציורים האחרים הזווית חדה או קהה, או שהישרים בכלל לא נפגשים.'],
          };
        }
        case 'real': {
          const sc = c.scene([
            { tags: ['sport'], t: 'את שני העמודים של שער הכדורגל', a: 0 },
            { tags: ['sport'], t: 'את קו הצד ואת קו השער במגרש הכדורגל', a: 1 },
            { tags: ['animals'], t: 'את שני הסורגים הסמוכים בכלוב של התוכי', a: 0 },
            { tags: ['space'], t: 'את עמוד האנטנה הישר ואת הגג השטוח של מצפה הכוכבים', a: 1 },
            { tags: ['music'], t: 'את שני המיתרים הסמוכים בגיטרה', a: 0 },
            { tags: ['music'], t: 'את שני הקווים התחתונים בחמשת התווים', a: 0 },
            { tags: ['baking'], t: 'את החריץ לאורך ואת החריץ לרוחב בטבלת השוקולד', a: 1, f: false },
            { tags: ['games'], t: 'את שני הקווים האופקיים בלוח של איקס-עיגול', a: 0 },
            { tags: ['games'], t: 'את הקו האופקי ואת הקו האנכי בלוח של איקס-עיגול', a: 1 },
            { tags: ['art'], t: 'את שני הלהבים של מספריים פתוחים קצת', a: 2 },
            { tags: ['art'], t: 'את שתי הצלעות הנגדיות של מסגרת התמונה המלבנית', a: 0, f: true },
            { tags: ['nature'], t: 'את שתי מסילות הרכבת בשביל הטיול', a: 0, f: true },
            { tags: ['nature'], t: 'את הגזע של עץ ישר ואת הקרקע המישורית', a: 1 },
            { tags: ['reading'], t: 'את שתי השורות הסמוכות בדף המחברת', a: 0, f: true },
            { tags: ['reading'], t: 'את הקצה העליון ואת הקצה הימני של דף בספר', a: 1 },
            { tags: ['tech'], t: 'את שני המחוגים בשעון כשהשעה 2:00', a: 2 },
            { tags: ['tech'], t: 'את שני הפסים של המסילה שעליה נוסע הרובוט', a: 0 },
            { tags: ['kpop'], t: 'את שני מקלות האור שמעריצים מחזיקים זה ליד זה, ישר למעלה', a: 0 },
            { tags: ['magic'], t: 'את השרביט שמצביע ישר למעלה ואת הרצפה הישרה של כיתת הקסמים', a: 1 },
            { tags: ['magic'], t: 'את שני המטאטאים שעפים זה לצד זה, בדיוק באותו כיוון', a: 0 },
            { tags: ['squishy'], t: 'את שני המדפים בארון הסקווישים', a: 0 },
          ]);
          const who = c.chance(0.5) ? c.me : c.friend();
          const f = !!sc.f;
          const choices = f ? ['מקבילות זו לזו', 'מאונכות זו לזו', 'לא מקבילות ולא מאונכות'] : ['מקבילים זה לזה', 'מאונכים זה לזה', 'לא מקבילים ולא מאונכים'];
          const why = ['הם לא נפגשים אף פעם והמרחק ביניהם קבוע — מקבילים.', 'הם נפגשים בזווית ישרה, כמו פינה של דף — מאונכים.', 'הם נפגשים, אבל לא בזווית ישרה — לא מקבילים ולא מאונכים.'][sc.a];
          return {
            type: 'choice', keep: true, prompt: `${who.name} ${who.g('רואה', 'רואה')} ${sc.t}. ${c.g('בחר', 'בחרי')} את התיאור המתאים:`, choices, answer: sc.a,
            hint: `${c.g('שאל', 'שאלי')} את עצמך: האם הם נפגשים? ואם כן — האם בזווית ישרה?`,
            solution: [why],
          };
        }
        case 'perpSide': {
          // טרפז ישר-זווית: זוויות ישרות בקודקודים 0 ו-3; צלע 3 מאונכת לצלעות 0 ו-2
          const lab = labelSet(c), sd = sidesOf(lab), sh = shape('rtrap', c, { rot: rndRot(c) });
          const marks = level < 3;
          const askPerp = c.chance(0.65);
          let prompt, choices, sol;
          if (askPerp) {
            const base = c.chance(0.5) ? 0 : 2;
            prompt = `איזו צלע ${b('מאונכת')} לצלע ${sd[base]}?`;
            choices = [sd[3], sd[(base + 2) % 4], sd[1]];
            sol = [`הצלע ${sd[3]} נפגשת עם הצלע ${sd[base]} בזווית ישרה — הן מאונכות.`, `הצלע ${sd[(base + 2) % 4]} מקבילה לצלע ${sd[base]}, לא מאונכת לה.`];
          } else {
            prompt = `איזו צלע ${b('מקבילה')} לצלע ${sd[0]}?`;
            choices = [sd[2], sd[3], sd[1]];
            sol = [`הצלע ${sd[2]} והצלע ${sd[0]} מאונכות שתיהן לצלע ${sd[3]} — לכן הן מקבילות זו לזו.`, `הצלע ${sd[3]} מאונכת לצלע ${sd[0]}, לא מקבילה לה.`];
          }
          return {
            type: 'choice', prompt: `במרובע שבציור ${marks ? 'מסומנות הזוויות הישרות' : 'יש שתי זוויות ישרות'}. ${prompt}`,
            visual: draw(sh, { labels: lab, right: marks, maxw: 220 }), choices, answer: 0,
            hint: askPerp ? 'צלעות מאונכות נפגשות בזווית ישרה.' : `צלעות מקבילות לא נפגשות. ${c.g('חפש', 'חפשי')} צלע שעומדת "מול" הצלע, באותו כיוון.`,
            solution: sol,
          };
        }
        case 'whichPar':
        case 'countPar': {
          const k = c.pick(level === 2 ? ['trap', 'trap', 'par', 'gen', 'rect'] : ['trap', 'par', 'gen', 'kite', 'trap']);
          const gp = gridQuad(c, k), lab = labelSet(c), sd = sidesOf(lab), pp = parPairs(gp);
          const nPar = (pp[0] ? 1 : 0) + (pp[1] ? 1 : 0);
          const v = (i) => stepVec(gp[i], gp[(i + 1) % 4]);
          const pairTxt = (i) => {
            const a = v(i), bb = v(i + 2), same = a[0] === bb[0] && a[1] === bb[1];
            if (pp[i]) return same ? `לצלע ${sd[i]} ולצלע ${sd[i + 2]} יש אותם צעדים (${stepTxt(a)}) — הן מקבילות.` : `הצלע ${sd[i]}: ${stepTxt(a)}. הצלע ${sd[i + 2]}: ${stepTxt(bb)}. אותו כיוון — הן מקבילות.`;
            return `הצלע ${sd[i]}: ${stepTxt(a)}. הצלע ${sd[i + 2]}: ${stepTxt(bb)}. כיוונים שונים — הן לא מקבילות.`;
          };
          const sol = [pairTxt(0), pairTxt(1)];
          const hint = `${c.g('ספור', 'ספרי')} לכל צלע כמה משבצות היא זזה ימינה וכמה למעלה או למטה. לצלעות מקבילות יש אותו כיוון.`;
          const vis = gridPoly(gp, { labels: lab });
          if (kind === 'countPar') {
            return { type: 'number', prompt: 'כמה זוגות של צלעות מקבילות יש במרובע שעל דף המשבצות?', visual: vis, answer: nPar, hint, solution: sol.concat([`בסך הכול: ${nPar === 1 ? 'זוג אחד' : nPar + ' זוגות'}.`]) };
          }
          const choices = [`${sd[0]} ∥ ${sd[2]}`, `${sd[1]} ∥ ${sd[3]}`, `שני הזוגות: ${sd[0]} ∥ ${sd[2]} וגם ${sd[1]} ∥ ${sd[3]}`, 'אין במרובע צלעות מקבילות'];
          return {
            type: 'choice', keep: true, prompt: 'אילו צלעות במרובע מקבילות זו לזו?', visual: vis, choices,
            answer: nPar === 2 ? 2 : nPar === 0 ? 3 : pp[0] ? 0 : 1, hint, solution: sol,
          };
        }
        case 'drawPick': {
          const want = c.pick(['one', 'two', 'none']);
          const mk = (k) => gridPoly(gridQuad(c, k), { maxw: 150, pad: 14 });
          const order = want === 'one' ? ['trap', 'par', 'gen', 'kite'] : want === 'two' ? ['par', 'trap', 'gen', 'kite'] : ['gen', 'trap', 'par', 'rect'];
          let choices = order.map(mk);
          for (let t = 0; t < 10 && choices.some((x, k) => choices.indexOf(x) !== k); t++) choices = order.map(mk);
          const who = c.friend();
          const txt = { one: b('בדיוק זוג אחד') + ' של צלעות מקבילות', two: b('שני זוגות') + ' של צלעות מקבילות', none: 'צלעות מקבילות' }[want];
          return {
            type: 'choice', cols: 2, prompt: `${who.name} ${who.g('סרטט', 'סרטטה')} מרובע ${want === 'none' ? b('שאין לו') : 'שיש לו'} ${txt}. איזה סרטוט ${who.g('שלו', 'שלה')}?`,
            choices, answer: 0,
            hint: `${c.g('בדוק', 'בדקי')} בכל סרטוט את שני הזוגות של הצלעות הנגדיות: לפי המשבצות, האם הן הולכות באותו כיוון?`,
            solution: [{ one: 'בסרטוט הנכון זוג אחד של צלעות נגדיות הולך באותו כיוון, והזוג השני לא.', two: 'בסרטוט הנכון כל צלע מקבילה לצלע שמולה — שני זוגות.', none: 'בסרטוט הנכון אין אף זוג של צלעות נגדיות שהולכות באותו כיוון.' }[want], 'בשאר הסרטוטים מספר הזוגות המקבילים שונה.'],
          };
        }
        case 'gridStep': {
          let A, B, Dd;
          for (let t = 0; t < 50; t++) {
            const dx = c.rnd(2, 4), dy = c.rnd(1, 3), wx = c.rnd(-1, 2), wy = c.rnd(2, 3);
            A = [1 + Math.max(0, -wx), 1 + dy]; B = [A[0] + dx, A[1] - dy]; Dd = [A[0] + wx, A[1] + wy];
            if (Math.abs(cross(sub(B, A), sub(Dd, A))) > 2) break;
          }
          const W = Math.max(A[0], B[0], Dd[0] + B[0] - A[0]) + 2, H = Math.max(A[1], Dd[1]) + 2;
          let s = '';
          for (let x = 0; x <= W; x++) s += S.line(x * U, 0, x * U, H * U, { cls: 's-grid', sw: 1 });
          for (let y = 0; y <= H; y++) s += S.line(0, y * U, W * U, y * U, { cls: 's-grid', sw: 1 });
          s += S.line(A[0] * U, A[1] * U, B[0] * U, B[1] * U, { sw: 3.5, 'stroke-linecap': 'round' });
          s += S.line(A[0] * U, A[1] * U, Dd[0] * U, Dd[1] * U, { sw: 3.5, 'stroke-linecap': 'round' });
          [[A, 'א', [-14, 10]], [B, 'ב', [12, -10]], [Dd, 'ד', [-14, 12]]].forEach(([p, t, o]) => { s += S.circle(p[0] * U, p[1] * U, 5, { cls: 'f-ink' }) + S.text(p[0] * U + o[0], p[1] * U + o[1], t, { fs: 18, fw: 800 }); });
          const vis = S.svg(W * U, H * U, s, { cls: 'vz-geo', label: 'דף משבצות', maxw: 260 });
          const dx = B[0] - A[0], dy = A[1] - B[1];
          return {
            type: 'number', answer: [dx, dy], labels: ['ימינה', 'למעלה'],
            prompt: `${c.name} ${c.g('רוצה', 'רוצה')} להשלים את המרובע אבגד כך שהצלע גד תהיה ${b('מקבילה לצלע אב ושווה לה באורך')}. כמה משבצות ימינה וכמה משבצות למעלה צריך לזוז מהנקודה ד כדי להגיע לנקודה ג?`,
            visual: vis,
            hint: `${c.g('ספור', 'ספרי')} את הצעדים מ-א ל-ב. כדי שגד תהיה מקבילה ושווה לאב, צריך לזוז מ-ד בדיוק אותם צעדים.`,
            solution: [`מ-א ל-ב: ${stepTxt([dx, -dy])}.`, `מ-ד זזים אותם צעדים: ${dx} ימינה ו-${dy} למעלה.`],
          };
        }
      }
    },
  });

  /* ================= זוויות ================= */
  const TYPE_CH = ['זווית חדה', 'זווית ישרה', 'זווית קהה', 'זווית שטוחה'];
  const TYPE_IDX = { acute: 0, right: 1, obtuse: 2, straight: 3 };
  HM.lesson({
    id: 'g-angles',
    learn: (c) => [
      {
        title: 'מה זו זווית?',
        html: `כש${c.g('אתה פותח', 'את פותחת')} מספריים, ספר או דלת — נוצרת ${b('זווית')}.<br>זווית בנויה משתי ${b('שוקיים')} (קרניים) שיוצאות מנקודה אחת — ${b('קודקוד הזווית')}.<br>ככל שהשוקיים "פתוחות" יותר — הזווית גדולה יותר.`,
        visual: ang(50, { rot: 10, len: 130, maxw: 210 }),
      },
      {
        title: 'סוגי זוויות',
        html: `• ${b('זווית ישרה')} — כמו פינה של דף: ${dg(90)}.<br>• ${b('זווית חדה')} — קטנה מזווית ישרה.<br>• ${b('זווית קהה')} — גדולה מזווית ישרה וקטנה מזווית שטוחה.<br>• ${b('זווית שטוחה')} — שתי השוקיים על קו ישר אחד: ${dg(180)}.`,
        visual: row(ang(40, { len: 70, cap: 'חדה', maxw: 90 }), ang(90, { len: 70, cap: 'ישרה', maxw: 90 }), ang(130, { len: 70, cap: 'קהה', maxw: 110 }), ang(180, { len: 60, cap: 'שטוחה', maxw: 120 })),
      },
      {
        title: 'מודדים במעלות',
        html: `את גודל הזווית מודדים ב${b('מעלות')} (°). סיבוב שלם הוא ${dg(360)}, חצי סיבוב (זווית שטוחה) — ${dg(180)}, ורבע סיבוב (זווית ישרה) — ${dg(90)}.<br>כדאי להכיר ${b('זוויות מוכרות')}: ${dg(30)}, ${dg(45)} (חצי מזווית ישרה), ${dg(60)}, ${dg(90)} ו-${dg(180)}. בעזרתן אומדים כל זווית.`,
        visual: row(ang(30, { len: 70, label: '30°', maxw: 100 }), ang(45, { len: 70, label: '45°', maxw: 100 }), ang(60, { len: 70, label: '60°', maxw: 100 })),
      },
      {
        title: 'מודדים במד-זווית',
        html: `${c.name}, ${c.g('בוא', 'בואי')} נמדוד יחד את הזווית שבציור. במד-זווית יש ${b('שתי סקלות')}: אחת מתחילה ב-0 מימין, והשנייה ב-0 משמאל.`,
        visual: protractor(120),
        steps: [
          `${c.g('הנח', 'הניחי')} את מרכז מד-הזווית על קודקוד הזווית.`,
          `${c.g('יישר', 'יישרי')} את קו הבסיס עם אחת השוקיים. כאן היא עוברת דרך ה-0 שמימין (הסקלה החיצונית).`,
          `${c.g('קרא', 'קראי')} באותה סקלה את המספר שהשוק השנייה עוברת דרכו: 120.`,
          `${c.g('בדוק', 'בדקי')} שזה הגיוני: הזווית קהה, ולכן היא גדולה מ-${dg(90)}. התשובה: ${dg(120)} ✔`,
        ],
      },
      {
        title: 'אורך השוקיים לא משנה!',
        html: `איזו זווית גדולה יותר? ${c.g('אל תתבלבל', 'אל תתבלבלי')}: גודל הזווית הוא ${b('כמה היא פתוחה')}, ולא כמה ארוכות השוקיים.<br>לזווית א יש שוקיים ארוכות, אבל זווית ב פתוחה יותר — ${b('זווית ב גדולה יותר')}.`,
        visual: row(ang(35, { len: 150, label: 'א', maxw: 170 }), ang(70, { len: 60, label: 'ב', maxw: 100 })),
      },
      {
        title: 'זוויות במצולע',
        html: `בכל קודקוד של מצולע יש זווית. במרובע אבגד יש 4 זוויות: זווית א, זווית ב, זווית ג וזווית ד.<br>${b('זוויות נגדיות')} במרובע הן זוויות שעומדות זו מול זו: ${HM.hl('זווית א וזווית ג')}, וגם ${HM.hl('זווית ב וזווית ד')}.`,
        visual: V.polygon(Q0, { labels: L4, maxw: 220, arcs: [{ i: 0, cls: 's-a', fill: 'f-a' }, { i: 2, cls: 's-a', fill: 'f-a' }, { i: 1, cls: 's-b', fill: 'f-b' }, { i: 3, cls: 's-b', fill: 'f-b' }] }),
        quiz: {
          type: 'choice', prompt: 'איזו זווית נגדית לזווית ב?', choices: ['זווית ד', 'זווית א', 'זווית ג'], answer: 0,
          hint: 'זוויות נגדיות עומדות זו מול זו, ואין ביניהן צלע משותפת.',
          solution: ['זווית ב עומדת מול זווית ד.', 'זווית א וזווית ג סמוכות לזווית ב — יש להן צלע משותפת איתה.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: real, clockType, clock, slice, door, claimAng
      const kinds = level === 1 ? ['type', 'measure', 'estimate', 'opp', 'real', 'real', 'clockType']
        : level === 2 ? ['type', 'measure', 'cmp', 'polyType', 'estimate', 'count', 'real', 'clock', 'slice', 'claimAng']
        : ['measure', 'order', 'cmp', 'count', 'tf', 'polyType', 'clock', 'slice', 'door', 'claimAng'];
      const kind = c.pick(kinds);
      switch (kind) {
        case 'clockType': {
          const hr = c.pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 11]);
          const k = Math.min(hr, 12 - hr), t = k === 3 ? 'right' : k === 6 ? 'straight' : k < 3 ? 'acute' : 'obtuse';
          const who = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'choice', keep: true, prompt: `${who.name} ${who.g('מסתכל', 'מסתכלת')} בשעון. השעה ${hr}:00. איזו זווית יש בין שני המחוגים?`, visual: clock(hr),
            choices: TYPE_CH, answer: TYPE_IDX[t],
            hint: 'בשעה 3:00 המחוגים יוצרים זווית ישרה (רבע מהשעון). האם כאן הם פתוחים פחות, באותה מידה או יותר?',
            solution: [{ acute: 'המחוגים קרובים זה לזה — פתוחים פחות מרבע של השעון. זו זווית חדה.', right: 'בין המחוגים יש בדיוק רבע מהשעון — זווית ישרה.', obtuse: 'בין המחוגים יש יותר מרבע של השעון, אבל פחות מחצי — זווית קהה.', straight: 'המחוגים מצביעים לכיוונים הפוכים, על קו ישר אחד — זווית שטוחה.' }[t]],
          };
        }
        case 'door': {
          const sc = c.scene([
            { tags: ['tech'], obj: 'המסך של המחשב הנייד', f: false, v: ['פתח', 'פתחה'] },
            { tags: ['nature'], obj: 'השער של הגינה', f: false, v: ['פתח', 'פתחה'] },
            { tags: ['music'], obj: 'המכסה של הפסנתר', f: false, v: ['פתח', 'פתחה'] },
            { tags: ['baking'], obj: 'הדלת של התנור', f: true, v: ['פתח', 'פתחה'] },
            { tags: ['animals'], obj: 'הדלת של הכלוב', f: true, v: ['פתח', 'פתחה'] },
            { tags: ['reading', 'art'], obj: 'הכריכה של הספר', f: true, v: ['פתח', 'פתחה'] },
            { tags: ['sport', 'games', 'space'], obj: 'הדלת של חדר ההלבשה', f: true, v: ['פתח', 'פתחה'] },
            { tags: ['kpop'], obj: 'המכסה של קופסת האלבום', f: false, v: ['פתח', 'פתחה'] },
            { tags: ['magic'], obj: 'הכריכה של ספר הלחשים', f: true, v: ['פתח', 'פתחה'] },
            { tags: ['squishy'], obj: 'המכסה של קופסת הסקווישים', f: false, v: ['פתח', 'פתחה'] },
          ]);
          const who = c.chance(0.5) ? c.me : c.friend();
          const a = c.pick([30, 45, 60, 90]), more = c.pick([15, 30, 45]), less = c.pick([10, 15, 20, 25]);
          const tot = a + more - less;
          return {
            type: 'number', unit: '°', answer: tot,
            prompt: `${who.name} ${who.g(sc.v[0], sc.v[1])} את ${sc.obj} בזווית של ${dg(a)}. אחר כך ${who.g('הוא פתח', 'היא פתחה')} ${sc.f ? 'אותה' : 'אותו'} עוד ${dg(more)}, ובסוף ${who.g('סגר', 'סגרה')} ${sc.f ? 'אותה' : 'אותו'} קצת — ב-${dg(less)}. מה גודל הזווית עכשיו?`,
            hint: 'פתיחה מגדילה את הזווית, וסגירה מקטינה אותה. ' + c.g('חשב', 'חשבי') + ' שלב אחרי שלב.',
            solution: [`אחרי הפתיחה הנוספת: ${m(`${a}° + ${more}° = ${a + more}°`)}.`, `אחרי הסגירה: ${m(`${a + more}° − ${less}° = ${tot}°`)}.`, `הזווית עכשיו ${dg(tot)} — זווית ${TYPE_HE[angType(tot)]}.`],
          };
        }
        case 'claimAng': {
          const f = c.friend();
          const eq = c.chance(0.3);
          const a1 = c.rnd(6, 26) * 5, a2 = eq ? a1 : a1 + (c.chance(0.5) ? 1 : -1) * c.pick([20, 25, 30]);
          const A2 = a2 < 15 || a2 > 165 ? a1 + (a1 < 90 ? 25 : -25) : a2;
          const longA = c.chance(0.5); // לזווית א שוקיים ארוכות
          const claimA = longA; // החבר טוען שהזווית עם השוקיים הארוכות גדולה יותר
          const bigA = a1 > A2, right = eq ? false : claimA === bigA;
          const longName = longA ? 'א' : 'ב';
          return {
            type: 'tf', prompt: `${f.name} ${f.g('אומר', 'אומרת')}: "זווית ${longName} גדולה יותר, כי השוקיים שלה ארוכות יותר". ${c.g('קבע', 'קבעי')}: האם המסקנה של ${f.name} נכונה?`,
            visual: row(ang(a1, { len: longA ? 130 : 60, label: 'א', maxw: 150 }), ang(A2, { len: longA ? 60 : 130, label: 'ב', maxw: 150 })),
            answer: right,
            hint: 'גודל הזווית הוא כמה היא פתוחה — לא האורך של השוקיים. ' + c.g('השווה', 'השווי') + ' רק את הפתיחה.',
            solution: [`אורך השוקיים לא קובע את גודל הזווית.`, eq ? 'שתי הזוויות פתוחות באותה מידה — הן שוות. לכן המסקנה לא נכונה.' : `זווית ${bigA ? 'א' : 'ב'} פתוחה יותר — היא הגדולה. ${right ? 'במקרה הזה המסקנה נכונה, אבל הנימוק לא נכון!' : 'לכן המסקנה לא נכונה.'}`],
          };
        }
        case 'type': {
          const t = c.pick(['acute', 'acute', 'right', 'obtuse', 'obtuse', 'straight']);
          const deg = t === 'acute' ? (level === 1 ? c.rnd(4, 11) * 5 : c.rnd(12, 15) * 5) : t === 'obtuse' ? (level === 1 ? c.rnd(25, 33) * 5 : c.rnd(21, 24) * 5) : t === 'right' ? 90 : 180;
          return {
            type: 'choice', keep: true, prompt: 'איזו זווית מופיעה בציור?', visual: ang(deg, { rot: c.rnd(0, 71) * 5, maxw: 190 }), choices: TYPE_CH, answer: TYPE_IDX[t],
            hint: `${c.g('השווה', 'השווי')} לזווית ישרה (פינה של דף): האם הזווית קטנה ממנה, שווה לה או גדולה ממנה? ואם השוקיים על קו ישר אחד — זו זווית שטוחה.`,
            solution: [{ acute: 'הזווית קטנה מפינה של דף — היא חדה.', right: 'הזווית בדיוק כמו פינה של דף (מסומנת בריבוע קטן) — היא ישרה.', obtuse: 'הזווית גדולה מפינה של דף, אבל השוקיים לא על קו ישר — היא קהה.', straight: 'שתי השוקיים יוצרות קו ישר אחד — זו זווית שטוחה, ' + dg(180) + '.' }[t]],
          };
        }
        case 'measure': {
          const left = level === 3 ? c.chance(0.7) : level === 2 && c.chance(0.25);
          const deg = level === 1 ? c.rnd(1, 17) * 10 : c.rnd(2, 34) * 5;
          const tp = TYPE_HE[angType(deg)];
          return {
            type: 'number', unit: '°', answer: deg, prompt: 'מה גודל הזווית שבציור?', visual: protractor(deg, { left }),
            hint: `${c.g('מצא', 'מצאי')} את השוק שעוברת דרך 0, ו${c.g('קרא', 'קראי')} ${b('באותה סקלה')} את המספר שהשוק השנייה עוברת דרכו. ${c.g('בדוק', 'בדקי')}: הזווית חדה או קהה?`,
            solution: [`השוק התחתונה עוברת דרך ה-0 של הסקלה ${left ? 'הפנימית (0 משמאל)' : 'החיצונית (0 מימין)'}.`, `באותה סקלה, השוק השנייה עוברת דרך ${deg}.`, `הזווית ${tp}, ולכן ${dg(deg)} הגיוני.`],
          };
        }
        case 'estimate': {
          const BM = [30, 45, 60, 90, 120, 135, 150];
          const deg = c.pick(BM);
          const pool = BM.concat([180]).filter((x) => x !== deg && Math.abs(x - deg) >= 25);
          const ds = [];
          if (pool.indexOf(180 - deg) >= 0) ds.push(180 - deg);
          pool.slice().sort((x, y) => Math.abs(x - deg) - Math.abs(y - deg)).forEach((x) => { if (ds.length < 3 && ds.indexOf(x) < 0) ds.push(x); });
          const vals = [deg].concat(ds).sort((x, y) => x - y);
          return {
            type: 'choice', keep: true, prompt: `${c.g('אמוד', 'אמדי')}: מה בערך גודל הזווית?`, visual: ang(deg, { rot: c.rnd(-10, 40) * 5, maxw: 190 }),
            choices: vals.map(dg), answer: vals.indexOf(deg),
            hint: `${c.g('השווה', 'השווי')} לזווית ישרה (${dg(90)}): האם הזווית קטנה ממנה או גדולה ממנה? חצי מזווית ישרה הוא ${dg(45)}.`,
            solution: [deg < 90 ? 'הזווית חדה, ולכן היא קטנה מ-' + dg(90) + '.' : deg === 90 ? 'הזווית ישרה, כמו פינה של דף.' : 'הזווית קהה, ולכן היא גדולה מ-' + dg(90) + '.', `הכי קרוב: ${dg(deg)}.`],
          };
        }
        case 'opp': {
          const lab = labelSet(c), i = c.rnd(0, 3), X = lab[i];
          const choices = [lab[(i + 2) % 4], lab[(i + 1) % 4], lab[(i + 3) % 4]].map(angName);
          return {
            type: 'choice', prompt: `במרובע שבציור, איזו זווית ${b('נגדית')} ל${angName(X)}?`,
            visual: V.polygon(rot(Q0, rndRot(c)), { labels: lab, maxw: 210, arcs: [{ i, cls: 's-a', fill: 'f-a' }] }), choices, answer: 0,
            hint: 'זוויות נגדיות עומדות זו מול זו. לזווית סמוכה יש צלע משותפת עם הזווית.',
            solution: [`${angName(X)} עומדת מול ${choices[0]} — הן זוויות נגדיות.`, `${choices[1]} ו${choices[2]} סמוכות ל${angName(X)}.`],
          };
        }
        case 'real': {
          const sc = c.scene([
            { tags: ['reading'], t: 'ספר פתוח לגמרי שמונח שטוח על השולחן', q: 'בין שתי הכריכות', a: 3, why: 'שתי הכריכות יוצרות קו ישר אחד — זווית שטוחה, ' + dg(180) + '.' },
            { tags: ['tech'], t: 'מחשב נייד פתוח, שהמסך שלו נוטה מעט לאחור', q: 'בין המסך למקלדת', a: 2, why: 'המסך פתוח יותר מפינה ישרה, אבל לא שטוח לגמרי — זווית קהה.' },
            { tags: ['sport'], t: 'את הפינה של מגרש הכדורסל', q: 'בין שני הקווים שנפגשים בפינה', a: 1, why: 'הקווים במגרש נפגשים כמו פינה של דף — זווית ישרה.' },
            { tags: ['animals'], t: 'תנין שפותח את הפה רק קצת', q: 'בין שתי הלסתות', a: 0, why: 'הפה פתוח פחות מפינה ישרה — זווית חדה.' },
            { tags: ['space'], t: 'טלסקופ שמכוון ישר למעלה, אל הכוכבים, על רצפה ישרה', q: 'בין הטלסקופ לרצפה', a: 1, why: 'משהו שעומד ישר למעלה על רצפה ישרה יוצר איתה זווית ישרה.' },
            { tags: ['music'], t: 'פסנתר שהמכסה שלו פתוח רק מעט', q: 'בין המכסה לפסנתר', a: 0, why: 'המכסה פתוח פחות מפינה ישרה — זווית חדה.' },
            { tags: ['baking'], t: 'משולש פיצה מתוך פיצה שחתכו ל-8 משולשים שווים', q: 'בחוד של המשולש', a: 0, why: 'זה חצי מזווית ישרה (' + dg(45) + ') — זווית חדה.' },
            { tags: ['games'], t: 'שעון במשחק שמראה בדיוק 6:00', q: 'בין שני המחוגים', a: 3, why: 'המחוגים מצביעים על 12 ועל 6 — הם על קו ישר אחד, זווית שטוחה.' },
            { tags: ['art'], t: 'מספריים שפתוחים קצת', q: 'בין שני הלהבים', a: 0, why: 'הלהבים פתוחים פחות מפינה ישרה — זווית חדה.' },
            { tags: ['nature'], t: 'עץ ישר שצומח על קרקע מישורית', q: 'בין הגזע לקרקע', a: 1, why: 'גזע ישר על קרקע ישרה יוצר זווית ישרה.' },
            { tags: ['kpop'], t: 'רקדן בחוג קיי-פופ שפותח את הרגליים רק מעט בצעד ריקוד', q: 'בין שתי הרגליים', a: 0, why: 'הרגליים פתוחות פחות מפינה ישרה — זווית חדה.' },
            { tags: ['magic'], t: 'מטאטא מעופף שעומד זקוף לגמרי על רצפה ישרה', q: 'בין המטאטא לרצפה', a: 1, why: 'משהו שעומד זקוף על רצפה ישרה יוצר איתה זווית ישרה.' },
            { tags: ['magic'], t: 'שני שרביטים שמונחים על השולחן זה בהמשך של זה, על קו ישר אחד', q: 'בין שני השרביטים', a: 3, why: 'השרביטים יוצרים קו ישר אחד — זווית שטוחה, ' + dg(180) + '.' },
            { tags: ['squishy'], t: 'קופסת סקווישים שהמכסה שלה פתוח רק קצת', q: 'בין המכסה לקופסה', a: 0, why: 'המכסה פתוח פחות מפינה ישרה — זווית חדה.' },
            { tags: [], t: 'שעון שמראה בדיוק 4:00', q: 'בין שני המחוגים', a: 2, why: 'בין 12 ל-4 יש יותר מרבע של השעון (רבע = 3 שעות) — זווית קהה.' },
          ]);
          const who = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'choice', keep: true, prompt: `${who.name} ${who.g('רואה', 'רואה')} ${sc.t}. איזו זווית יש ${sc.q}?`, choices: TYPE_CH, answer: sc.a,
            hint: `${c.g('דמיין', 'דמייני')} את הזווית ו${c.g('השווה', 'השווי')} אותה לפינה של דף (זווית ישרה).`,
            solution: [sc.why],
          };
        }
        case 'cmp': {
          const eq = level === 3 && c.chance(0.3);
          const a1 = c.rnd(5, 30) * 5;
          let a2 = eq ? a1 : a1 + (c.chance(0.5) ? 1 : -1) * (level === 3 ? c.pick([15, 20]) : c.pick([25, 30, 40]));
          if (a2 < 15 || a2 > 165) a2 = a1 + (a1 > 90 ? -1 : 1) * 30;
          const big = a1 > a2 ? 0 : 1;
          const lens = big === 0 ? [60, 125] : [125, 60];
          if (eq) { lens[0] = 60; lens[1] = 125; }
          const rt = c.rnd(0, 4) * 5;
          return {
            type: 'compare', prompt: `${c.g('השווה', 'השווי')} בין שתי הזוויות: &gt;, &lt; או =`,
            left: ang(a1, { rot: rt, len: lens[0], maxw: 130 }), right: ang(a2, { rot: rt, len: lens[1], maxw: 130 }), lv: a1, rv: a2,
            answer: a1 === a2 ? '=' : a1 < a2 ? '<' : '>',
            hint: 'גודל הזווית הוא כמה היא פתוחה. אורך השוקיים לא משנה!',
            solution: [eq ? 'שתי הזוויות פתוחות באותה מידה — הן שוות, למרות שהשוקיים באורכים שונים.' : `הזווית ${a1 > a2 ? 'השמאלית' : 'הימנית'} פתוחה יותר, גם אם השוקיים שלה קצרות יותר.`, eq ? `שתיהן ${dg(a1)}.` : `השמאלית: ${dg(a1)}, הימנית: ${dg(a2)}.`],
          };
        }
        case 'order': {
          let degs;
          do { degs = c.sample(HM.range(4, 33).map((x) => x * 5), 4); } while (degs.some((x, i) => degs.some((y, j) => i !== j && Math.abs(x - y) < 20)));
          const lens = c.shuffle([55, 75, 95, 115]);
          const items = degs.map((d, i) => ang(d, { rot: c.rnd(0, 6) * 5, len: lens[i], label: L4[i], maxw: 120 }));
          const sorted = degs.map((_, i) => i).sort((i, j) => degs[i] - degs[j]);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את הזוויות ${b('מהקטנה לגדולה')}:`, items, answer: sorted,
            hint: 'אורך השוקיים לא משנה — רק כמה הזווית פתוחה. מה חדה ומה קהה?',
            solution: [`הסדר: ${sorted.map((i) => L4[i]).join(', ')}.`, sorted.map((i) => `${L4[i]}: ${dg(degs[i])}`).join(' · ')],
          };
        }
        case 'polyType': {
          const lab = labelSet(c), sh = shape('rtrap', c, { rot: rndRot(c) });
          const angs = sh.pts.map((_, i) => angAt(sh.pts, i));
          const askAcute = c.chance(0.5);
          const target = angs.findIndex((a) => (askAcute ? a < 85 : a > 95));
          return {
            type: 'choice', keep: true, prompt: `איזו זווית במרובע שבציור היא ${b(askAcute ? 'חדה' : 'קהה')}?`,
            visual: draw(sh, { labels: lab, right: level === 2, maxw: 220 }), choices: L4.map(angName), answer: L4.indexOf(lab[target]),
            hint: `${c.g('השווה', 'השווי')} כל זווית לפינה של דף. ${askAcute ? 'זווית חדה קטנה ממנה.' : 'זווית קהה גדולה ממנה.'}`,
            solution: [`במרובע יש שתי זוויות ישרות, זווית חדה אחת וזווית קהה אחת.`, `${angName(lab[target])} ${askAcute ? 'קטנה' : 'גדולה'} מזווית ישרה — היא ${askAcute ? 'החדה' : 'הקהה'}.`],
          };
        }
        case 'count': {
          const w = c.rnd(150, 180), hh = c.rnd(90, 115);
          const pick = c.pick(['house', 'rtrap', 'par', 'rect', 'rtri', 'otri', 'hex', 'pent']);
          let pts;
          if (pick === 'house') { const th = c.pick([20, 25, 30, 55, 60, 65]), r = (w / 2) * Math.tan(th * RAD); pts = [[0, hh + r], [0, r], [w / 2, 0], [w, r], [w, hh + r]]; }
          else if (pick === 'rtrap') pts = shape('rtrap', c).pts;
          else if (pick === 'par') pts = parPts(c.rnd(150, 180), c.rnd(80, 100), c.pick([50, 55, 60, 65, 70]));
          else if (pick === 'rect') pts = V.shapes.rect(w, hh);
          else if (pick === 'rtri') pts = V.shapes.triangle('right', 170);
          else if (pick === 'otri') pts = V.shapes.triangle('obtuse', 170);
          else if (pick === 'hex') pts = V.shapes.regular(6, 85);
          else pts = V.shapes.regular(5, 90);
          pts = rot(pts, rndRot(c));
          const types = pts.map((_, i) => angType(angAt(pts, i)));
          const t = c.pick(['acute', 'right', 'obtuse']);
          const n = types.filter((x) => x === t).length;
          const rights = types.map((x, i) => (x === 'right' ? i : -1)).filter((i) => i >= 0);
          const PL = { acute: 'חדות', right: 'ישרות', obtuse: 'קהות' };
          const parts = ['acute', 'right', 'obtuse'].map((x) => { const k = types.filter((y) => y === x).length; return k === 0 ? null : k === 1 ? `${TYPE_HE[x]} אחת` : `${k} ${PL[x]}`; }).filter(Boolean);
          return {
            type: 'number', answer: n, prompt: `כמה זוויות ${b(PL[t])} יש במצולע שבציור?`,
            visual: V.polygon(pts, { right: level === 2 ? rights : [], maxw: 210 }),
            hint: `${c.g('עבור', 'עברי')} על הקודקודים אחד אחד, ו${c.g('השווה', 'השווי')} כל זווית לפינה של דף.`,
            solution: [`במצולע יש ${pts.length} זוויות: ${parts.join(', ')}.`, n === 0 ? `אין בו זוויות ${PL[t]}. התשובה: 0.` : `התשובה: ${n}.`],
          };
        }
        case 'clock': {
          const hr = level === 2 ? c.pick([1, 2, 3, 6, 9, 10, 11]) : c.pick([4, 5, 7, 8, 1, 11]);
          const k = Math.min(hr, 12 - hr), deg = k * 30;
          const w = c.chance(0.5) ? c.me : c.friend();
          const act = c.scene([
            { tags: ['sport'], v: ['הגיע לאימון', 'הגיעה לאימון'] }, { tags: ['music'], v: ['התחיל לנגן', 'התחילה לנגן'] },
            { tags: ['kpop'], v: ['התחיל להתאמן על הריקוד של הלהקה', 'התחילה להתאמן על הריקוד של הלהקה'] }, { tags: ['magic'], v: ['נכנס לשיעור שיקויים', 'נכנסה לשיעור שיקויים'] },
            { tags: ['squishy'], v: ['יצא לקנות סקוויש חדש', 'יצאה לקנות סקוויש חדש'] }, { tags: ['nature'], v: ['יצא לטיול', 'יצאה לטיול'] },
            { tags: ['reading'], v: ['התחיל לקרוא ספר', 'התחילה לקרוא ספר'] }, { tags: ['games'], v: ['התחיל לשחק', 'התחילה לשחק'] },
            { tags: ['baking'], v: ['הכניס עוגה לתנור', 'הכניסה עוגה לתנור'] }, { tags: ['art'], v: ['התחיל לצייר', 'התחילה לצייר'] },
            { tags: ['space'], v: ['התחיל לצפות בכוכבים', 'התחילה לצפות בכוכבים'] }, { tags: ['animals'], v: ['האכיל את הכלב', 'האכילה את הכלב'] },
            { tags: ['tech'], v: ['הדליק את הרובוט', 'הדליקה את הרובוט'] },
          ]);
          return {
            type: 'number', unit: '°', answer: deg, prompt: `${w.name} ${w.g(act.v[0], act.v[1])} בשעה ${hr}:00 בדיוק. מה גודל הזווית הקטנה בין שני המחוגים של השעון בשעה הזאת?`, visual: clock(hr),
            hint: 'סיבוב שלם של השעון הוא ' + dg(360) + ', והוא מחולק ל-12 חלקים שווים. כמה מעלות יש בין שני מספרים סמוכים?',
            solution: [m('360° : 12 = 30°') + ' — בין שני מספרים סמוכים בשעון.', k === 1 ? `בין המחוגים יש רווח אחד כזה: ${dg(30)}.` : `בין המחוגים יש ${k} רווחים כאלה: ${m(`${k} × 30° = ${deg}°`)}.`],
          };
        }
        case 'slice': {
          const sc = c.scene([
            { tags: ['baking'], obj: 'פיצה עגולה', v: ['חותך', 'חותכת'] },
            { tags: ['baking'], obj: 'עוגה עגולה', v: ['חותך', 'חותכת'] },
            { tags: ['games'], obj: 'גלגל מזל עגול למשחק', v: ['מחלק', 'מחלקת'] },
            { tags: ['art'], obj: 'עיגול של נייר צבעוני', v: ['גוזר', 'גוזרת'] },
            { tags: ['nature'], obj: 'ערוגה עגולה בגינה', v: ['מחלק', 'מחלקת'] },
            { tags: ['kpop'], obj: 'עוגה עגולה לכבוד ההופעה של הלהקה', v: ['חותך', 'חותכת'] },
            { tags: ['magic'], obj: 'מפה עגולה של בית הספר לקוסמים', v: ['מחלק', 'מחלקת'] },
            { tags: ['squishy'], obj: 'מדבקה עגולה לקופסת הסקווישים', v: ['גוזר', 'גוזרת'] },
          ]);
          const n = level === 2 ? c.pick([2, 4, 8]) : c.pick([3, 6, 8, 12]);
          const who = c.chance(0.5) ? c.me : c.friend();
          return {
            type: 'number', unit: '°', answer: 360 / n,
            prompt: `${who.name} ${who.g(sc.v[0], sc.v[1])} ${sc.obj} ל-${n} חלקים שווים, בקווים שיוצאים מהמרכז. מה גודל הזווית של כל חלק, ליד המרכז?`,
            hint: `סיבוב שלם סביב המרכז הוא ${dg(360)}. ${c.g('חלק', 'חלקי')} אותו ל-${n} חלקים שווים.`,
            solution: [`סביב המרכז יש ${dg(360)}.`, m(`360° : ${n} = ${360 / n}°`)],
          };
        }
        case 'tf': {
          const x = c.rnd(3, 35) * 5, claim = c.pick(['acute', 'right', 'obtuse']);
          const st = c.pick([
            [`זווית של ${dg(x)} היא זווית ${TYPE_HE[claim]}.`, angType(x) === claim, `${dg(x)} ${x < 90 ? 'קטן מ-' + dg(90) + ', ולכן זו זווית חדה' : x === 90 ? 'זו בדיוק זווית ישרה' : 'גדול מ-' + dg(90) + ' וקטן מ-' + dg(180) + ', ולכן זו זווית קהה'}.`],
            ['כל זווית קהה גדולה מכל זווית חדה.', true, 'זווית חדה קטנה מ-' + dg(90) + ', וזווית קהה גדולה מ-' + dg(90) + '.'],
            ['שתי זוויות ישרות יחד יוצרות זווית שטוחה.', true, m('90° + 90° = 180°') + ' — זווית שטוחה.'],
            ['אם מאריכים את השוקיים של זווית, הזווית גדלה.', false, 'גודל הזווית תלוי רק בכמה היא פתוחה, לא באורך השוקיים.'],
            ['זווית של ' + dg(45) + ' היא חצי מזווית ישרה.', true, m('90° : 2 = 45°')],
            ['בכל מרובע, הזוויות הנגדיות שוות זו לזו.', false, 'לא בכל מרובע. למשל, בטרפז ישר-זווית יש זווית ישרה מול זווית קהה.'],
            ['במרובע אבגד, זווית א וזווית ג הן זוויות נגדיות.', true, 'זווית א עומדת מול זווית ג.'],
            ['במרובע אבגד, זווית ב וזווית ג הן זוויות נגדיות.', false, 'לזווית ב ולזווית ג יש צלע משותפת (בג) — הן סמוכות.'],
            ['זווית שטוחה גדולה פי 2 מזווית ישרה.', true, m('2 × 90° = 180°')],
          ]);
          return {
            type: 'tf', prompt: st[0], answer: st[1],
            hint: `${c.g('זכור', 'זכרי')}: ישרה = ${dg(90)}, שטוחה = ${dg(180)}. חדה קטנה מ-${dg(90)}, וקהה בין ${dg(90)} ל-${dg(180)}.`,
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= שושנת הרוחות וכיוונים ================= */
  const PLACES = [
    { tags: ['sport'], n: 'מגרש הכדורגל' }, { tags: ['animals'], n: 'גן החיות' }, { tags: ['space'], n: 'מצפה הכוכבים' },
    { tags: ['music'], n: 'אולם הקונצרטים' }, { tags: ['baking'], n: 'המאפייה', f: true }, { tags: ['games'], n: 'חנות המשחקים', f: true },
    { tags: ['art'], n: 'המוזיאון' }, { tags: ['nature'], n: 'החורשה', f: true }, { tags: ['reading'], n: 'הספרייה', f: true },
    { tags: ['tech'], n: 'מעבדת הרובוטים', f: true }, { tags: ['kpop'], n: 'חנות האלבומים', f: true },
    { tags: ['magic'], n: 'מגדל הקוסמים' }, { tags: ['squishy'], n: 'חנות הסקווישים', f: true },
  ];
  // מסיחים לכיוון: היפוך מזרח-מערב, הכיוון ההפוך, כיוון שכן
  const dirChoices = (c, i) => {
    const out = [i], push = (x) => { x = ((x % 8) + 8) % 8; if (out.indexOf(x) < 0) out.push(x); };
    push((8 - i) % 8); push(i + 4); push(i + c.pick([1, -1])); push(i + 2); push(i - 2);
    return out.slice(0, 4);
  };
  HM.lesson({
    id: 'g-compass',
    learn: (c) => [
      {
        title: 'שושנת הרוחות',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} שאנחנו בטיול ומחפשים את הדרך במפה. ${b('שושנת הרוחות')} מראה את ${b('4 הכיוונים הראשיים')}: צפון, מזרח, דרום ומערב.<br>במפה ${b('הצפון תמיד למעלה')}, ${b('המזרח מימין')}, הדרום למטה והמערב משמאל.<br>טיפ: השמש ${b('זורחת')} במזרח ושוקעת במערב.`,
        visual: rose({ mainOnly: true }),
      },
      {
        title: 'הכיוונים המשניים',
        html: `בין כל שני כיוונים ראשיים יש ${b('כיוון משני')}, ושמו מורכב משני השמות: בין צפון למזרח — ${b('צפון-מזרח')}.<br>יש 4 כיוונים משניים: צפון-מזרח, דרום-מזרח, דרום-מערב וצפון-מערב.<br>בסך הכול בשושנה 8 כיוונים.`,
        visual: rose({}),
      },
      {
        title: 'זוויות בין כיוונים',
        html: `• בין שני כיוונים ראשיים סמוכים (צפון ומזרח) יש ${b('זווית ישרה')} — ${dg(90)}.<br>• בין כיוון ראשי לכיוון המשני שלידו יש ${dg(45)} — חצי מזווית ישרה.<br>• בין שני כיוונים הפוכים (צפון ודרום) יש ${b('' + dg(180) + '')} — זווית שטוחה.`,
        visual: rose({ arc: [0, 2], hl: [0, 2] }),
      },
      {
        title: 'מסתובבים ימינה ושמאלה',
        html: `${b('ימינה')} — עם כיוון השעון. ${b('שמאלה')} — נגד כיוון השעון.<br>אם ${c.g('אתה פונה', 'את פונה')} לצפון ו${c.g('מסתובב', 'מסתובבת')} ימינה ב-${dg(90)}, ${c.g('אתה פונה', 'את פונה')} עכשיו למזרח. סיבוב שמאלה ב-${dg(90)} מצפון — ופונים למערב.<br>סיבוב של ${dg(180)} (חצי סיבוב) — ופונים לכיוון ההפוך.`,
        visual: rose({ face: 0, arc: [0, 2], hl: [2] }),
      },
      (() => {
        const f = c.friend();
        return {
          title: 'דוגמה פתורה',
          html: `${f.name} ${f.g('פונה', 'פונה')} למערב. ${f.g('הוא מסתובב', 'היא מסתובבת')} ימינה ב-${dg(90)}, ואחר כך עוד ${dg(45)} ימינה. לאן ${f.g('הוא פונה', 'היא פונה')} עכשיו?`,
          visual: rose({ face: 6 }),
          steps: [
            'ימינה — עם כיוון השעון. ממערב, ' + dg(45) + ' ימינה מגיעים לצפון-מערב, ועוד ' + dg(45) + ' — לצפון.',
            `אחרי ${dg(90)} ${f.g('הוא פונה', 'היא פונה')} לצפון.`,
            'עוד ' + dg(45) + ' ימינה: מצפון לצפון-מזרח.',
            `התשובה: צפון-מזרח (בסך הכול ${f.g('הסתובב', 'הסתובבה')} ${dg(135)} ימינה).`,
          ],
        };
      })(),
      {
        title: 'בדיקה קטנה',
        html: `${c.g('הסתכל', 'הסתכלי')} שוב בשושנת הרוחות ו${c.g('ענה', 'עני')}.`,
        visual: rose({ maxw: 220 }),
        quiz: {
          type: 'choice', prompt: 'מהו הכיוון ההפוך למזרח?', choices: ['מערב', 'צפון', 'דרום', 'צפון-מזרח'], answer: 0,
          hint: 'הכיוון ההפוך נמצא בצד השני של השושנה — ' + dg(180) + ' מהכיוון.',
          solution: ['המזרח מימין, ומולו — בצד שמאל — המערב.'],
        },
      },
    ],
    gen: (c, level) => {
      const kinds = level === 1 ? ['name', 'opp', 'turn', 'between', 'map']
        : level === 2 ? ['name', 'between', 'turn', 'map', 'tf', 'opp', 'turn']
        : ['turn', 'howTurn', 'inverse', 'count45', 'between', 'between', 'tf', 'tf', 'tf'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      const youFace = who === c.me ? c.g('אתה פונה', 'את פונה') : `${who.name} ${who.g('פונה', 'פונה')}`;
      switch (kind) {
        case 'name': {
          const i = level === 1 ? c.rnd(0, 7) : c.pick([1, 2, 3, 5, 6, 7]);
          const ch = dirChoices(c, i);
          return {
            type: 'choice', prompt: 'איזה כיוון מסומן בשושנת הרוחות בסימן שאלה?', visual: rose({ q: i, hl: [i], only: level === 1 ? null : [0] }),
            choices: ch.map((x) => DIRS[x]), answer: 0,
            hint: `${c.g('זכור', 'זכרי')}: צפון למעלה, מזרח מימין, דרום למטה, מערב משמאל. כיוון משני נמצא בדיוק באמצע בין שני כיוונים ראשיים.`,
            solution: [i % 2 === 0 ? `הכיוון המסומן הוא כיוון ראשי: ${DIRS[i]}.` : `הכיוון המסומן נמצא באמצע בין ${DIRS[i - 1]} ל${DIRS[(i + 1) % 8]} — ${DIRS[i]}.`],
          };
        }
        case 'opp': {
          const i = c.rnd(0, 7), o = (i + 4) % 8;
          const ch = dirChoices(c, o);
          return {
            type: 'choice', prompt: `מהו הכיוון ההפוך ל${DIRS[i]}?`, visual: level === 1 ? rose({ hl: [i], maxw: 220 }) : undefined,
            choices: ch.map((x) => DIRS[x]), answer: 0,
            hint: 'הכיוון ההפוך נמצא בצד השני של השושנה — חצי סיבוב (' + dg(180) + ').',
            solution: [`חצי סיבוב מ${DIRS[i]} מגיע ל${DIRS[o]}.`, i % 2 ? 'בכיוון משני מחליפים את שני החלקים: צפון ↔ דרום, מזרח ↔ מערב.' : 'צפון ↔ דרום, מזרח ↔ מערב.'],
          };
        }
        case 'between': {
          const i = c.rnd(0, 7), k = level === 1 ? c.pick([2, 2, 4, 1]) : c.rnd(1, 4), j = (i + (c.chance(0.5) ? k : 8 - k)) % 8;
          const deg = dirDiff(i, j);
          return {
            type: 'number', unit: '°', answer: deg,
            prompt: `מה גודל הזווית ${deg === 180 ? '' : 'הקטנה '}בין הכיוון ${DIRS[i]} לכיוון ${DIRS[j]}?`,
            visual: level < 3 ? rose({ hl: [i, j], arc: [i, j] }) : undefined,
            hint: `בין כל שני כיוונים סמוכים בשושנה יש ${dg(45)}. ${c.g('ספור', 'ספרי')} כמה "קפיצות" יש מ${DIRS[i]} ל${DIRS[j]}.`,
            solution: [`מ${DIRS[i]} ל${DIRS[j]} יש ${deg / 45 === 1 ? 'קפיצה אחת' : deg / 45 + ' קפיצות'} של ${dg(45)}.`, m(`${deg / 45} × 45° = ${deg}°`)],
          };
        }
        case 'turn': {
          let i, steps, right;
          if (level === 1) { i = c.pick([0, 2, 4, 6]); steps = c.pick([2, 2, 4]); }
          else if (level === 2) { i = c.rnd(0, 7); steps = c.pick([1, 2, 4, 3]); }
          else { i = c.rnd(0, 7); steps = c.pick([3, 1, 2]); }
          right = c.chance(0.5);
          if (level === 3 && c.chance(0.6)) {
            // שני סיבובים
            const s1 = c.pick([2, 1]), s2 = c.pick([1, 2, 3]), r1 = c.chance(0.5), r2 = c.chance(0.5);
            const fin = (i + (r1 ? s1 : -s1) + (r2 ? s2 : -s2) + 16) % 8;
            const wrong = (i + (r1 ? -s1 : s1) + (r2 ? -s2 : s2) + 16) % 8;
            const ch = [fin]; [wrong, (fin + 4) % 8, (fin + 1) % 8, (fin + 7) % 8].forEach((x) => { if (ch.indexOf(x) < 0 && ch.length < 4) ch.push(x); });
            const mid1 = (i + (r1 ? s1 : -s1) + 8) % 8;
            return {
              type: 'choice', prompt: `${youFace} ל${DIRS[i]}. ${who === c.me ? c.g('אתה מסתובב', 'את מסתובבת') : who.g('הוא מסתובב', 'היא מסתובבת')} ${r1 ? 'ימינה' : 'שמאלה'} ב-${dg(s1 * 45)}, ואחר כך ${r2 ? 'ימינה' : 'שמאלה'} ב-${dg(s2 * 45)}. לאיזה כיוון ${who === c.me ? c.g('אתה פונה', 'את פונה') : who.g('הוא פונה', 'היא פונה')} עכשיו?`,
              choices: ch.map((x) => DIRS[x]), answer: 0,
              hint: `${c.g('עשה', 'עשי')} את הסיבובים אחד אחרי השני. ימינה — עם כיוון השעון, שמאלה — נגד כיוון השעון. כל ${dg(45)} זה צעד אחד בשושנה.`,
              solution: [`אחרי הסיבוב הראשון: ${DIRS[mid1]}.`, `אחרי הסיבוב השני: ${DIRS[fin]}.`],
            };
          }
          const fin = (i + (right ? steps : -steps) + 8) % 8, wrong = (i + (right ? -steps : steps) + 8) % 8;
          const ch = [fin]; [wrong, (fin + 4) % 8, (fin + (right ? -1 : 1) + 8) % 8, (fin + (right ? 1 : -1) + 8) % 8].forEach((x) => { if (ch.indexOf(x) < 0 && ch.length < 4) ch.push(x); });
          return {
            type: 'choice', prompt: `${youFace} ל${DIRS[i]} ו${who === c.me ? c.g('מסתובב', 'מסתובבת') : who.g('מסתובב', 'מסתובבת')} ${b(right ? 'ימינה' : 'שמאלה')} ב-${dg(steps * 45)}. לאיזה כיוון ${who === c.me ? c.g('אתה פונה', 'את פונה') : who.g('הוא פונה', 'היא פונה')} עכשיו?`,
            visual: level === 1 ? rose({ face: i }) : undefined, choices: ch.map((x) => DIRS[x]), answer: 0,
            hint: `${right ? 'ימינה — עם כיוון השעון' : 'שמאלה — נגד כיוון השעון'}. כל ${dg(45)} זה צעד אחד בשושנה, ו-${dg(90)} הם שני צעדים.`,
            solution: [steps === 1 ? `${dg(45)} הם צעד אחד בשושנה, ${right ? 'עם כיוון השעון' : 'נגד כיוון השעון'}.` : `${dg(steps * 45)} הם ${steps} צעדים של ${dg(45)}, ${right ? 'עם כיוון השעון' : 'נגד כיוון השעון'}.`, `מ${DIRS[i]} מגיעים ל${DIRS[fin]}.`],
          };
        }
        case 'howTurn': {
          const i = c.rnd(0, 7), k = c.pick([1, 2, 3]), right = c.chance(0.5), j = (i + (right ? k : -k) + 8) % 8;
          const opt = (r, kk) => `${r ? 'ימינה' : 'שמאלה'} ב-${dg(kk * 45)}`;
          const ch = [opt(right, k), opt(!right, k), opt(right, k === 3 ? 1 : k + 1), opt(!right, 4 - k === k ? 3 : 4 - k)];
          const uniq = ch.filter((x, ix) => ch.indexOf(x) === ix);
          return {
            type: 'choice', prompt: `${youFace} ל${DIRS[i]} ${who === c.me ? c.g('ורוצה', 'ורוצה') : who.g('ורוצה', 'ורוצה')} לפנות ל${DIRS[j]}. איך ${who === c.me ? c.g('כדאי לך', 'כדאי לך') : 'כדאי ל' + who.name} להסתובב, בסיבוב הקצר ביותר?`,
            choices: uniq, answer: 0,
            hint: `${c.g('מצא', 'מצאי')} את שני הכיוונים בשושנה. ${c.g('ספור', 'ספרי')} צעדים של ${dg(45)}, ו${c.g('בדוק', 'בדקי')} אם הדרך הקצרה היא עם כיוון השעון (ימינה) או נגדו (שמאלה).`,
            solution: [`מ${DIRS[i]} ל${DIRS[j]} יש ${k === 1 ? 'צעד אחד' : k + ' צעדים'} ${right ? 'עם כיוון השעון' : 'נגד כיוון השעון'}.`, `לכן: ${opt(right, k)}.`],
          };
        }
        case 'inverse': {
          const j = c.rnd(0, 7), k = c.pick([1, 2, 3, 4]), right = c.chance(0.5), i = (j - (right ? k : -k) + 16) % 8;
          const ch = [i]; [(j + (right ? k : -k) + 16) % 8, (i + 4) % 8, (i + 1) % 8, (i + 7) % 8].forEach((x) => { if (ch.indexOf(x) < 0 && ch.length < 4) ch.push(x); });
          return {
            type: 'choice', prompt: `${who.name} ${who.g('הסתובב', 'הסתובבה')} ${right ? 'ימינה' : 'שמאלה'} ב-${dg(k * 45)}, ועכשיו ${who.g('הוא פונה', 'היא פונה')} ל${DIRS[j]}. לאיזה כיוון ${who.g('הוא פנה', 'היא פנתה')} לפני הסיבוב?`,
            choices: ch.map((x) => DIRS[x]), answer: 0,
            hint: `${c.g('חזור', 'חזרי')} אחורה: ${c.g('עשה', 'עשי')} את אותו סיבוב בכיוון ההפוך — ${right ? 'שמאלה' : 'ימינה'} ב-${dg(k * 45)}.`,
            solution: [`הולכים אחורה מ${DIRS[j]}: ${right ? 'שמאלה' : 'ימינה'} ב-${dg(k * 45)}.`, `מגיעים ל${DIRS[i]} — לשם ${who.g('הוא פנה', 'היא פנתה')} בהתחלה.`],
          };
        }
        case 'count45': {
          const i = c.rnd(0, 7), k = c.rnd(2, 7), j = (i + k) % 8;
          return {
            type: 'number', answer: k,
            prompt: `${who.name} ${who.g('פונה', 'פונה')} ל${DIRS[i]} ו${who.g('מסתובב', 'מסתובבת')} ${b('ימינה')} כל פעם ב-${dg(45)}. אחרי כמה סיבובים כאלה ${who.g('הוא יפנה', 'היא תפנה')} לראשונה ל${DIRS[j]}?`,
            hint: 'ימינה — עם כיוון השעון. כל סיבוב של ' + dg(45) + ' מקדם צעד אחד בשושנה.',
            solution: [`${c.g('ספור', 'ספרי')} עם כיוון השעון: ${HM.range(0, k).map((t) => DIRS[(i + t) % 8]).join(' ← ')}.`, `${k} סיבובים (${dg(k * 45)}).`],
          };
        }
        case 'map': {
          const pl = c.scene(PLACES), i = c.rnd(0, 7);
          const others = c.sample(PLACES.filter((p) => p !== pl), 2), od = c.sample(HM.range(0, 7).filter((x) => x !== i), 2);
          const ch = dirChoices(c, i);
          return {
            type: 'choice', prompt: `באיזה כיוון ${pl.f ? 'נמצאת' : 'נמצא'} ${pl.n} ביחס לבית של ${c.name}?`,
            visual: mapPic([[i, pl.n]].concat(level === 1 ? [] : others.map((p, k) => [od[k], p.n])), { home: `הבית של ${c.name}` }),
            choices: ch.map((x) => DIRS[x]), answer: 0,
            hint: `${c.g('הסתכל', 'הסתכלי')} על חץ הצפון: צפון למעלה, ולכן מזרח מימין ומערב משמאל.`,
            solution: [`במפה, ${pl.n} ${pl.f ? 'נמצאת' : 'נמצא'} ${['מעל הבית', 'מעל הבית ומימין לו', 'מימין לבית', 'מתחת לבית ומימין לו', 'מתחת לבית', 'מתחת לבית ומשמאל לו', 'משמאל לבית', 'מעל הבית ומשמאל לו'][i]}.`, `לכן ${pl.f ? 'היא נמצאת' : 'הוא נמצא'} מ${DIRS[i]} לבית.`],
          };
        }
        case 'tf': {
          const i = c.rnd(0, 7), k = c.rnd(1, 4), j = (i + k) % 8, real = dirDiff(i, j);
          const st = c.pick(['ang', 'ang', 'turn']);
          if (st === 'ang') {
            const claim = c.chance(0.5) ? real : c.pick([real + 45, real - 45, real === 90 ? 45 : 90].filter((x) => x > 0 && x <= 180 && x !== real));
            return {
              type: 'tf', prompt: `הזווית ${real === 180 ? '' : 'הקטנה '}בין הכיוון ${DIRS[i]} לכיוון ${DIRS[j]} היא ${dg(claim)}.`, answer: claim === real,
              hint: 'בין כל שני כיוונים סמוכים בשושנה יש ' + dg(45) + '.',
              solution: [`מ${DIRS[i]} ל${DIRS[j]} יש ${real / 45 === 1 ? 'קפיצה אחת' : real / 45 + ' קפיצות'} של ${dg(45)}: ${dg(real)}.`, `לכן הטענה ${claim === real ? 'נכונה' : 'לא נכונה'}.`],
            };
          }
          const right = c.chance(0.5), fin = (i + (right ? k : -k) + 8) % 8, claimDir = c.chance(0.5) ? fin : (i + (right ? -k : k) + 8) % 8;
          const ok = claimDir === fin;
          return {
            type: 'tf', prompt: `מי שפונה ל${DIRS[i]} ומסתובב ${right ? 'ימינה' : 'שמאלה'} ב-${dg(k * 45)} — פונה ל${DIRS[claimDir]}.`, answer: ok,
            hint: 'ימינה — עם כיוון השעון, שמאלה — נגד כיוון השעון. כל ' + dg(45) + ' זה צעד אחד בשושנה.',
            solution: [`${right ? 'ימינה' : 'שמאלה'} ב-${dg(k * 45)} מ${DIRS[i]} מגיעים ל${DIRS[fin]}.`, `לכן הטענה ${ok ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= עזרים לשיעורי המקביליות ================= */
  // סרטוט על דף משבצות: נקודות ביחידות משבצת. segs: [[p,q]], pts: [[p, 'א', [dx,dy]]]
  function gridSketch(W, H, segs, pts, o) {
    o = o || {};
    let s = '';
    for (let x = 0; x <= W; x++) s += S.line(x * U, 0, x * U, H * U, { cls: 's-grid', sw: 1 });
    for (let y = 0; y <= H; y++) s += S.line(0, y * U, W * U, y * U, { cls: 's-grid', sw: 1 });
    segs.forEach(([p, q, dash]) => (s += S.line(p[0] * U, p[1] * U, q[0] * U, q[1] * U, { sw: 3.5, 'stroke-linecap': 'round', dash: dash ? '7 6' : null, cls: dash ? 's-soft' : 's-ink' })));
    pts.forEach(([p, t, off]) => { s += S.circle(p[0] * U, p[1] * U, 5, { cls: 'f-ink' }); if (t) s += S.text(p[0] * U + off[0], p[1] * U + off[1], t, { fs: 18, fw: 800 }); });
    return S.svg(W * U, H * U, s, { cls: 'vz-geo', label: 'דף משבצות', maxw: o.maxw || 260 });
  }
  // היסט לתווית של קודקוד: הרחק ממרכז הצורה
  const labOff = (p, C) => { const u2 = unit(sub(p, C)); return [u2[0] * 16, u2[1] * 16 + 5]; };

  // מקבילית עם מידות (a = צלע אב, b = צלע בג, deg = זווית א החדה) — לציור בקנה מידה סביר
  function parFig(a, b, deg, o) {
    o = o || {};
    const base = 175, sl = Math.max(70, Math.min(150, (base * b) / a));
    let p = parPts(base, sl * Math.sin(deg * RAD), deg);
    p = rot(p, o.rot || 0);
    return p;
  }

  // שאלות היקף מילוליות — משותף למקבילית, מלבן, מעוין וריבוע
  const PERIM = [
    { tags: ['nature'], u: "מ'", f: true, obj: (w) => `ערוגת הירקות של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('בונה', 'בונה')} גדר מסביב לערוגת ירקות בצורת ${shp}, ${d}. כמה מטרים של גדר ${w.g('הוא צריך', 'היא צריכה')}?` },
    { tags: ['animals'], u: "מ'", f: true, obj: (w) => `מכלאת העיזים של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('בונה', 'בונה')} גדר למכלאה של העיזים. המכלאה בצורת ${shp}, ${d}. כמה מטרים של גדר צריך כדי להקיף אותה?` },
    { tags: ['sport'], u: "מ'", f: false, r: true, obj: (w) => `המגרש שבו ${w.name} ${w.g('מתאמן', 'מתאמנת')}`, run: (w, shp, d, k) => `${w.name} ${w.g('רץ', 'רצה')} ${k > 1 ? k + ' סיבובים' : 'סיבוב אחד'} מסביב למגרש בצורת ${shp}, ${d}. כמה מטרים ${w.g('הוא רץ', 'היא רצה')}?` },
    { tags: ['art'], u: 'ס"מ', f: true, obj: (w) => `התמונה של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('מדביק', 'מדביקה')} סרט זהב מסביב לתמונה בצורת ${shp}, ${d}. כמה סנטימטרים של סרט ${w.g('הוא צריך', 'היא צריכה')}?` },
    { tags: ['baking'], u: 'ס"מ', f: true, obj: (w) => `העוגייה של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('אופה', 'אופה')} עוגייה בצורת ${shp}, ${d}, ו${w.g('מקשט', 'מקשטת')} בשוקולד את כל השוליים שלה. מה האורך של כל השוליים יחד?` },
    { tags: ['music'], u: "מ'", f: true, obj: (w) => `הבמה שעליה ${w.name} ${w.g('מופיע', 'מופיעה')}`, run: (w, shp, d) => `${w.name} ${w.g('תולה', 'תולה')} שרשרת נורות לאורך כל השוליים של במה בצורת ${shp}, ${d}. כמה מטרים של שרשרת צריך?` },
    { tags: ['space'], u: 'ס"מ', f: false, obj: () => 'הפאנל הסולארי של החללית', run: (w, shp, d) => `לחללית של ${w.name} יש פאנל סולארי בצורת ${shp}, ${d}. ${w.g('הוא מדביק', 'היא מדביקה')} פס כסוף מסביב לפאנל. מה אורך הפס?` },
    { tags: ['reading'], u: 'ס"מ', f: true, obj: (w) => `הסימנייה של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('גוזר', 'גוזרת')} סימנייה בצורת ${shp}, ${d}, ו${w.g('מקיף', 'מקיפה')} אותה בחוט צבעוני. כמה סנטימטרים של חוט צריך?` },
    { tags: ['tech'], u: "מ'", f: false, r: true, obj: (w) => `המשטח שעליו נוסע הרובוט של ${w.name}`, run: (w, shp, d, k) => `הרובוט של ${w.name} נוסע ${k > 1 ? k + ' סיבובים' : 'סיבוב אחד'} לאורך השוליים של משטח בצורת ${shp}, ${d}. כמה מטרים נוסע הרובוט?` },
    { tags: ['kpop'], u: "מ'", f: true, obj: (w) => `רחבת הריקודים שבה ${w.name} ${w.g('מתאמן', 'מתאמנת')} על הריקוד של הלהקה`, run: (w, shp, d) => `${w.name} ${w.g('מסמן', 'מסמנת')} בסרט דביק את השוליים של רחבת ריקודים בצורת ${shp}, ${d}, כדי להתאמן על הריקוד של הלהקה. כמה מטרים של סרט ${w.g('הוא צריך', 'היא צריכה')}?` },
    { tags: ['magic'], u: "מ'", f: false, r: true, obj: () => 'מגרש התעופה בבית הספר לקוסמים', run: (w, shp, d, k) => `${w.name} ${w.g('טס', 'טסה')} על מטאטא ${k > 1 ? k + ' סיבובים' : 'סיבוב אחד'} מסביב למגרש תעופה בצורת ${shp}, ${d}. כמה מטרים ${w.g('הוא טס', 'היא טסה')}?` },
    { tags: ['squishy'], u: 'ס"מ', f: false, obj: (w) => `מדף הסקווישים של ${w.name}`, run: (w, shp, d) => `${w.name} ${w.g('מדביק', 'מדביקה')} פס נצנצים מסביב למדף הסקווישים ${w.g('שלו', 'שלה')}. המדף בצורת ${shp}, ${d}. כמה סנטימטרים של פס צריך?` },
    { tags: ['games'], u: "מ'", f: false, r: true, obj: (w) => `האגם במשחק של ${w.name}`, run: (w, shp, d, k) => `במשחק מחשב, הדמות של ${w.name} מקיפה אגם בצורת ${shp}, ${d}. כמה מטרים הולכת הדמות ב${k > 1 ? '-' + k + ' סיבובים' : 'סיבוב אחד'}?` },
  ];
  // מידות לפי יחידה ורמה
  const dims = (c, sc, level) => {
    const big = sc.u === "מ'";
    const a = big ? c.rnd(level === 1 ? 6 : 10, level === 1 ? 15 : 45) : c.rnd(level === 1 ? 4 : 6, level === 1 ? 10 : 25);
    const bb = c.rnd(Math.max(2, Math.floor(a / 3)), a - 1);
    return [a, bb];
  };
  const pron = (f) => (f ? 'היא' : 'הוא');
  const poss = (f) => (f ? 'שלה' : 'שלו');

  /* ================= המקבילית ================= */
  HM.lesson({
    id: 'g-parallelogram',
    learn: (c) => [
      {
        title: 'מלבן שנדחף הצידה',
        html: `${c.name}, ${c.g('דמיין', 'דמייני')} מסגרת של מלבן שבנויה מארבעה מקלות ומחוברת בפינות. אם דוחפים אותה הצידה, היא "נוטה" — אבל הצלעות הנגדיות ${b('נשארות מקבילות')}!<br>הצורה החדשה נקראת ${b('מקבילית')}.`,
        visual: row(draw(shape('rect', c), { arrows: true, maxw: 150 }), draw({ pts: parPts(165, 95, 60), arrows: [1, 2, 1, 2] }, { arrows: true, maxw: 170 })),
      },
      {
        title: 'הגדרת המקבילית',
        html: `${b('מקבילית')} היא מרובע שיש בו ${b('שני זוגות של צלעות מקבילות')}: אב ∥ גד, וגם בג ∥ אד.<br>החצים מסמנים את הצלעות המקבילות: חץ אחד לזוג הראשון, שני חצים לזוג השני.`,
        visual: draw({ pts: parPts(175, 95, 60), arrows: [1, 2, 1, 2] }, { labels: true, arrows: true, maxw: 240 }),
      },
      {
        title: 'צלעות נגדיות שוות',
        html: `במקבילית ${b('הצלעות הנגדיות שוות')} זו לזו.<br>אם אב = 7 ס"מ, אז גם גד = 7 ס"מ. אם בג = 4 ס"מ, אז גם אד = 4 ס"מ.<br>הקווים הקטנים על הצלעות מסמנים צלעות שוות.`,
        visual: draw({ pts: parFig(7, 4, 60), ticks: [1, 2, 1, 2] }, { labels: true, ticks: true, sides: ['7 ס"מ', '4 ס"מ', '', ''], maxw: 240 }),
      },
      {
        title: 'הזוויות במקבילית',
        html: `• ${b('זוויות נגדיות שוות')}: זווית א = זווית ג, וזווית ב = זווית ד.<br>• ${b('שתי זוויות סמוכות')} (ליד אותה צלע) משלימות זו את זו ל-${dg(180)}.<br>בציור: ${m('60° + 120° = 180°')}.`,
        visual: V.polygon(parPts(175, 95, 60), { labels: L4, maxw: 240, arcs: [{ i: 0, label: '60°', fill: 'f-a' }, { i: 1, label: '120°', cls: 's-b', fill: 'f-b' }, { i: 2, label: '60°', fill: 'f-a' }, { i: 3, label: '120°', cls: 's-b', fill: 'f-b' }] }),
      },
      {
        title: 'דוגמה פתורה',
        html: `במקבילית אבגד: אב = 9 ס"מ, בג = 5 ס"מ, וזווית א היא ${dg(70)}. ${c.g('מצא', 'מצאי')} את אורך הצלע גד, את זווית ג ואת זווית ב.`,
        visual: V.polygon(parFig(9, 5, 70), { labels: L4, sides: ['9 ס"מ', '5 ס"מ', '?', ''], maxw: 230, arcs: [{ i: 0, label: '70°', fill: 'f-a' }] }),
        steps: [
          'הצלע גד נגדית לצלע אב, ולכן גם אורכה 9 ס"מ.',
          `זווית ג נגדית לזווית א, ולכן גם היא ${dg(70)}.`,
          `זווית ב סמוכה לזווית א, ולכן הן משלימות ל-${dg(180)}: ${m('180° − 70° = 110°')}.`,
        ],
      },
      {
        title: 'בונים מקבילית על דף משבצות',
        html: `נתונות הצלעות אב ואד. כדי למצוא את ג: ${c.g('ספור', 'ספרי')} כמה משבצות זזים מ-א ל-ד, ו${c.g('זוז', 'זוזי')} ${b('בדיוק אותם צעדים')} מהנקודה ב.<br>כאן: מ-א ל-ד — 2 ימינה ו-3 למעלה. מ-ב זזים גם 2 ימינה ו-3 למעלה — ושם נמצאת ג.`,
        visual: gridSketch(9, 5, [[[1, 4], [6, 4]], [[1, 4], [3, 1]], [[6, 4], [8, 1], true], [[3, 1], [8, 1], true]], [[[1, 4], 'א', [-12, 14]], [[6, 4], 'ב', [12, 14]], [[8, 1], 'ג', [12, -10]], [[3, 1], 'ד', [-12, -10]]]),
        quiz: {
          type: 'tf', prompt: 'כל מרובע שיש בו זוג אחד של צלעות מקבילות הוא מקבילית.', answer: false,
          hint: 'כמה זוגות של צלעות מקבילות צריך במקבילית?',
          solution: ['במקבילית צריך שני זוגות של צלעות מקבילות.', 'מרובע עם זוג אחד בלבד (טרפז) אינו מקבילית.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: storySide, storyAng, perim, perimInv, claim
      const kinds = level === 1 ? ['side', 'angOpp', 'isPar', 'storySide', 'storyAng']
        : level === 2 ? ['angAdj', 'angMix', 'tf', 'isParGrid', 'build', 'perim', 'storyAng']
        : ['angDiff', 'notPar', 'angSum', 'perimInv', 'perim3', 'claim', 'angDiff'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'side': {
          const a = c.rnd(5, 14), bb = c.rnd(3, a - 1), ask = c.rnd(2, 3);
          const deg = c.pick([55, 60, 65, 70]);
          const sides = [`${a} ס"מ`, `${bb} ס"מ`, '', ''];
          sides[ask] = '?';
          const ans = ask === 2 ? a : bb, nm = ask === 2 ? 'גד' : 'אד', given = ask === 2 ? 'אב' : 'בג';
          return {
            type: 'number', unit: 'ס"מ', answer: ans, prompt: `במקבילית אבגד, אב = ${a} ס"מ ובג = ${bb} ס"מ. מה אורך הצלע ${nm}?`,
            visual: V.polygon(parFig(a, bb, deg, { rot: c.pick([0, 0, -15, 15, 180]) }), { labels: L4, sides, maxw: 230 }),
            hint: `במקבילית, הצלעות הנגדיות שוות. איזו צלע נגדית לצלע ${nm}?`,
            solution: [`הצלע ${nm} נגדית לצלע ${given}.`, `לכן ${nm} = ${ans} ס"מ.`],
          };
        }
        case 'angOpp':
        case 'angAdj':
        case 'angMix': {
          const deg = c.pick([40, 45, 50, 55, 60, 65, 70, 75]);
          const giveObt = c.chance(0.4), given = giveObt ? 180 - deg : deg;
          const gi = giveObt ? c.pick([1, 3]) : c.pick([0, 2]);
          const adj = kind === 'angAdj' || (kind === 'angMix' && c.chance(0.6));
          const ai = adj ? (gi + c.pick([1, 3])) % 4 : (gi + 2) % 4;
          const ans = adj ? 180 - given : given;
          const arcs = [{ i: gi, label: given + '°', fill: 'f-a' }, { i: ai, label: '?', cls: 's-c', fill: 'f-c', tcls: 't-c' }];
          return {
            type: 'number', unit: '°', answer: ans, prompt: `במקבילית אבגד, ${angName(L4[gi])} היא ${dg(given)}. מה גודל ${angName(L4[ai])}?`,
            visual: V.polygon(rot(parPts(175, 95, deg), c.pick([0, 0, 12, -12])), { labels: L4, arcs, maxw: 230 }),
            hint: adj ? `${angName(L4[gi])} ו${angName(L4[ai])} סמוכות — ליד אותה צלע. כמה הן ביחד?` : `${angName(L4[gi])} ו${angName(L4[ai])} נגדיות. מה ${c.g('אתה יודע', 'את יודעת')} על זוויות נגדיות במקבילית?`,
            solution: adj ? [`הזוויות סמוכות, ולכן הן משלימות ל-${dg(180)}.`, m(`180° − ${given}° = ${ans}°`)] : ['במקבילית, זוויות נגדיות שוות.', `${angName(L4[ai])} = ${dg(ans)}`],
          };
        }
        case 'isPar':
        case 'isParGrid': {
          const grid = kind === 'isParGrid';
          const mk = (k) => (grid ? gridPoly(gridQuad(c, k), { maxw: 150, pad: 14 }) : draw(shape(k === 'gen' ? 'quad' : k, c, { rot: rndRot(c) }), { arrows: true, maxw: 150 }));
          const kinds2 = grid ? ['par', 'trap', 'gen', 'kite'] : ['par', 'trap', 'kite', 'rtrap'];
          let choices = kinds2.map(mk);
          for (let t = 0; t < 10 && choices.some((x, k) => choices.indexOf(x) !== k); t++) choices = kinds2.map(mk);
          return {
            type: 'choice', cols: 2, prompt: grid ? 'איזה מרובע על דף המשבצות הוא מקבילית?' : 'איזה מרובע הוא מקבילית? (החצים מסמנים צלעות מקבילות)', choices, answer: 0,
            hint: grid ? `${c.g('בדוק', 'בדקי')} בכל מרובע: האם כל צלע הולכת באותם צעדים כמו הצלע שמולה?` : 'במקבילית יש שני זוגות של צלעות מקבילות — חץ אחד וגם שני חצים.',
            solution: ['במקבילית צריך שני זוגות של צלעות מקבילות.', grid ? 'רק במרובע הנכון, כל צלע זזה על המשבצות בדיוק כמו הצלע שמולה.' : 'בטרפזים יש רק זוג אחד, ובדלתון אין צלעות מקבילות בכלל.'],
          };
        }
        case 'storySide': {
          const sc = c.scene(PERIM), [a] = dims(c, sc, 1), f = sc.f;
          const obj = sc.obj(who);
          return {
            type: 'number', unit: sc.u, answer: a,
            prompt: `${obj} ${pron(f)} בצורת מקבילית. אורך אחת הצלעות ${poss(f)} ${a} ${sc.u}. מה אורך הצלע שמולה?`,
            hint: 'במקבילית, הצלעות הנגדיות שוות.',
            solution: ['הצלע שמולה היא הצלע הנגדית.', `במקבילית צלעות נגדיות שוות, ולכן גם אורכה ${a} ${sc.u}.`],
          };
        }
        case 'storyAng': {
          const sc = c.scene([
            { tags: ['art', 'reading'], t: (w) => `${w.name} ${w.g('גזר', 'גזרה')} מקבילית מנייר צבעוני ו${w.g('מדד', 'מדדה')} במד-זווית את אחת הזוויות שלה` },
            { tags: ['baking'], t: (w) => `${w.name} ${w.g('חתך', 'חתכה')} מהבצק עוגייה בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלה` },
            { tags: ['games', 'tech'], t: (w) => `${w.name} ${w.g('בנה', 'בנתה')} במשחק מחשב אריח בצורת מקבילית, והמשחק הראה את אחת הזוויות שלו` },
            { tags: ['sport', 'nature', 'animals'], t: (w) => `${w.name} ${w.g('סימן', 'סימנה')} בגינה ערוגה בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלה` },
            { tags: ['music', 'space'], t: (w) => `${w.name} ${w.g('עיצב', 'עיצבה')} כרטיס הזמנה בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלו` },
            { tags: ['kpop'], t: (w) => `${w.name} ${w.g('גזר', 'גזרה')} פוטוקארד בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלו` },
            { tags: ['magic'], t: (w) => `${w.name} ${w.g('צייר', 'ציירה')} בשיעור קסמים סמל בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלו` },
            { tags: ['squishy'], t: (w) => `${w.name} ${w.g('קנה', 'קנתה')} סקוויש שטוח בצורת מקבילית ו${w.g('מדד', 'מדדה')} את אחת הזוויות שלו` },
          ]);
          const x = c.pick([50, 55, 60, 65, 70, 110, 115, 120, 125, 130]);
          const opp = level === 1 ? true : c.chance(0.4);
          const ans = opp ? x : 180 - x;
          return {
            type: 'number', unit: '°', answer: ans,
            prompt: `${sc.t(who)}: ${dg(x)}. מה גודל הזווית ${b(opp ? 'הנגדית' : 'הסמוכה')} לה?`,
            hint: opp ? 'במקבילית, זוויות נגדיות שוות.' : `במקבילית, שתי זוויות סמוכות משלימות ל-${dg(180)}.`,
            solution: opp ? ['זוויות נגדיות במקבילית שוות.', `לכן גם הזווית הנגדית היא ${dg(x)}.`] : [`זוויות סמוכות במקבילית משלימות ל-${dg(180)}.`, m(`180° − ${x}° = ${ans}°`)],
          };
        }
        case 'perim':
        case 'perim3': {
          const sc = c.scene(PERIM), [a, bb] = dims(c, sc, level);
          const k = kind === 'perim3' && sc.r ? c.rnd(2, 4) : 1;
          const P = 2 * (a + bb);
          const multi = kind === 'perim3' && !sc.r;
          if (multi) {
            // רב-שלבי: ידועה צלע אחת, והצלע השנייה גדולה/קטנה ממנה
            const d = a - bb;
            return {
              type: 'number', unit: sc.u, answer: P,
              prompt: sc.run(who, 'מקבילית', `שאחת הצלעות שלה ${a} ${sc.u}, והצלע הסמוכה לה קצרה ממנה ב-${d} ${sc.u}`),
              hint: `קודם ${c.g('מצא', 'מצאי')} את אורך הצלע הקצרה. אחר כך ${c.g('זכור', 'זכרי')}: במקבילית יש 2 צלעות מכל אורך.`,
              solution: [`הצלע הקצרה: ${m(`${a} − ${d} = ${bb}`)}.`, `ההיקף: ${m(`${a} + ${bb} + ${a} + ${bb} = ${P}`)} ${sc.u}.`],
            };
          }
          return {
            type: 'number', unit: sc.u, answer: P * k,
            prompt: sc.run(who, 'מקבילית', `עם צלעות של ${a} ${sc.u} ו-${bb} ${sc.u}`, k),
            hint: `במקבילית יש 2 צלעות של ${a} ו-2 צלעות של ${bb}. ${c.g('חבר', 'חברי')} את כל הצלעות${k > 1 ? ', ואחר כך ' + c.g('חשב', 'חשבי') + ' כמה זה ב-' + k + ' סיבובים' : ''}.`,
            solution: [`ההיקף: ${m(`${a} + ${bb} + ${a} + ${bb} = ${P}`)} ${sc.u}.`].concat(k > 1 ? [`${k} סיבובים: ${m(`${k} × ${P} = ${P * k}`)} ${sc.u}.`] : []),
          };
        }
        case 'perimInv': {
          const sc = c.scene(PERIM), [a, bb] = dims(c, sc, 2), P = 2 * (a + bb), f = sc.f;
          return {
            type: 'number', unit: sc.u, answer: bb,
            prompt: `${sc.obj(who)} ${pron(f)} בצורת מקבילית, וההיקף ${poss(f)} ${P} ${sc.u}. אורך אחת הצלעות ${a} ${sc.u}. מה אורך הצלע הסמוכה לה?`,
            hint: 'ההיקף הוא סכום של 2 צלעות ארוכות ו-2 צלעות קצרות. כמה הן צלע אחת מכל סוג ביחד?',
            solution: [`צלע אחת מכל סוג ביחד — חצי מההיקף: ${m(`${P} : 2 = ${a + bb}`)}.`, `הצלע הסמוכה: ${m(`${a + bb} − ${a} = ${bb}`)} ${sc.u}.`],
          };
        }
        case 'angDiff': {
          const v = c.pick(['diff', 'times']);
          if (v === 'diff') {
            const d = c.pick([20, 30, 40, 50, 60, 70, 80, 100]), big = (180 + d) / 2, small = (180 - d) / 2;
            const askBig = c.chance(0.5);
            return {
              type: 'number', unit: '°', answer: askBig ? big : small,
              prompt: `במקבילית אבגד, זווית א גדולה ב-${dg(d)} מזווית ב. מה גודל ${askBig ? 'זווית א' : 'זווית ב'}?`,
              hint: `זווית א וזווית ב סמוכות, ולכן יחד הן ${dg(180)}. ${c.g('נסה', 'נסי')} להוריד את ההפרש ולחלק לשניים.`,
              solution: [`זווית א + זווית ב = ${dg(180)}, וזווית א גדולה ב-${dg(d)}.`, `זווית ב: ${m(`(180° − ${d}°) : 2 = ${small}°`)}.`, `זווית א: ${m(`${small}° + ${d}° = ${big}°`)}.`],
            };
          }
          const k = c.pick([2, 3, 5]), small = 180 / (k + 1), big = 180 - small;
          return {
            type: 'number', unit: '°', answer: big,
            prompt: `במקבילית אבגד, זווית ב גדולה פי ${k} מזווית א. מה גודל זווית ב?`,
            hint: `זווית א וזווית ב סמוכות — יחד ${dg(180)}. אם זווית א היא "חלק אחד", כמה חלקים יש בזווית ב? וכמה חלקים ביחד?`,
            solution: [`יחד יש ${k + 1} חלקים שווים, והם ${dg(180)}: ${m(`180° : ${k + 1} = ${small}°`)} — זו זווית א.`, `זווית ב: ${m(`${k} × ${small}° = ${big}°`)}.`],
          };
        }
        case 'angSum': {
          const x = c.pick([40, 50, 55, 60, 65, 70, 75, 80]), obt = c.chance(0.5), a1 = obt ? 180 - x : x;
          const pair = obt ? ['ב', 'ד'] : ['א', 'ג'], ask = obt ? c.pick(['א', 'ג']) : c.pick(['ב', 'ד']);
          return {
            type: 'number', unit: '°', answer: 180 - a1,
            prompt: `במקבילית אבגד, הסכום של זווית ${pair[0]} ושל זווית ${pair[1]} הוא ${dg(2 * a1)}. מה גודל זווית ${ask}?`,
            visual: V.polygon(parPts(175, 95, x), { labels: L4, maxw: 220 }),
            hint: `זווית ${pair[0]} וזווית ${pair[1]} נגדיות — הן שוות. ${c.g('מצא', 'מצאי')} קודם כל אחת מהן.`,
            solution: [`זוויות נגדיות שוות: ${m(`${2 * a1}° : 2 = ${a1}°`)}.`, `זווית ${ask} סמוכה להן: ${m(`180° − ${a1}° = ${180 - a1}°`)}.`],
          };
        }
        case 'notPar': {
          const ks = ['trap', 'rect', 'rhombus', 'square'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: rndRot(c) }), { marks: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: `איזה מרובע ${b('אינו')} מקבילית?`, choices, answer: 0,
            hint: `${c.g('ספור', 'ספרי')} בכל מרובע את זוגות הצלעות המקבילות. ${c.g('זכור', 'זכרי')}: גם מלבן, מעוין וריבוע הם מקביליות מיוחדות!`,
            solution: ['במלבן, במעוין ובריבוע יש שני זוגות של צלעות מקבילות — כולם מקביליות.', 'בטרפז יש רק זוג אחד של צלעות מקבילות — הוא אינו מקבילית.'],
          };
        }
        case 'build': {
          let A, Bp, Dp, W, H;
          for (let t = 0; t < 60; t++) {
            const v1 = [c.rnd(3, 5), c.pick([0, 0, 1, -1])], v2 = [c.rnd(-1, 3), -c.rnd(2, 3)];
            if (v2[0] === 0) v2[0] = 1;
            const xs = [0, v1[0], v2[0], v1[0] + v2[0]], ys = [0, v1[1], v2[1], v1[1] + v2[1]];
            const mx = Math.min(...xs), my = Math.min(...ys);
            A = [1 - mx, 1 - my]; Bp = add(A, v1); Dp = add(A, v2);
            W = Math.max(...xs) - mx + 2; H = Math.max(...ys) - my + 2;
            if (W <= 10 && H <= 6 && Math.abs(cross(v1, v2)) >= 6) break;
          }
          const fromB = c.chance(0.5);
          const v = fromB ? sub(Dp, A) : sub(Bp, A); // הצעד הנדרש
          const C0 = add(Bp, sub(Dp, A)), Cc = [A, Bp, C0, Dp].reduce((s2, p) => add(s2, mul(p, 0.25)), [0, 0]);
          const lbl = [v[0] >= 0 ? 'ימינה' : 'שמאלה', v[1] <= 0 ? 'למעלה' : 'למטה'];
          const ans = [Math.abs(v[0]), Math.abs(v[1])];
          return {
            type: 'number', answer: ans, labels: lbl.map((x) => `משבצות ${x}`),
            prompt: `${who.name} ${who.g('בונה', 'בונה')} מקבילית אבגד על דף משבצות. ${who.g('הוא כבר סרטט', 'היא כבר סרטטה')} את הצלע אב ואת הצלע אד. כמה משבצות ${lbl[0]} וכמה ${lbl[1]} צריך לזוז ${fromB ? 'מהנקודה ב' : 'מהנקודה ד'} כדי להגיע לקודקוד ג?`,
            visual: gridSketch(W, H, [[A, Bp], [A, Dp]], [[A, 'א', labOff(A, Cc)], [Bp, 'ב', labOff(Bp, Cc)], [Dp, 'ד', labOff(Dp, Cc)]]),
            hint: `${fromB ? 'הצלע בג צריכה להיות מקבילה לאד ושווה לה' : 'הצלע דג צריכה להיות מקבילה לאב ושווה לה'}. ${c.g('ספור', 'ספרי')} את הצעדים ${fromB ? 'מ-א ל-ד' : 'מ-א ל-ב'}.`,
            solution: [`${fromB ? 'מ-א ל-ד' : 'מ-א ל-ב'}: ${stepTxt([v[0], v[1]])}.`, `מזיזים אותם צעדים ${fromB ? 'מ-ב' : 'מ-ד'}: ${ans[0]} ${lbl[0]} ו-${ans[1]} ${lbl[1]}.`],
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['בכל מקבילית, הצלעות הנגדיות שוות זו לזו', true, 'זו אחת התכונות של המקבילית.'],
            ['בכל מקבילית, כל הזוויות שוות זו לזו', false, `לא בכל מקבילית: יכולות להיות בה זוויות של ${dg(60)} ושל ${dg(120)}.`],
            ['בכל מקבילית, שתי צלעות סמוכות שוות זו לזו', false, 'לא בהכרח. במקבילית יכולות להיות צלעות של 7 ס"מ ו-4 ס"מ.'],
            [`במקבילית, סכום של שתי זוויות סמוכות הוא ${dg(180)}`, true, 'זוויות סמוכות במקבילית משלימות זו את זו ל-' + dg(180) + '.'],
            ['מרובע שיש בו רק זוג אחד של צלעות מקבילות הוא מקבילית', false, 'במקבילית צריך שני זוגות של צלעות מקבילות. מרובע עם זוג אחד הוא טרפז.'],
            ['במקבילית, שתי זוויות סמוכות יכולות להיות שתיהן קהות', false, `שתי זוויות קהות יחד גדולות מ-${dg(180)}, אבל זוויות סמוכות במקבילית הן בדיוק ${dg(180)}.`],
            ['אם במקבילית יש זווית ישרה אחת — כל הזוויות בה ישרות', true, `הזווית הנגדית שווה לה (${dg(90)}), והזוויות הסמוכות הן ${m('180° − 90° = 90°')}.`],
            ['במקבילית יכולות להיות 3 זוויות חדות', false, 'במקבילית, ליד כל זווית חדה יש זווית קהה (יחד ' + dg(180) + '), ולכן יש בה לכל היותר 2 זוויות חדות.'],
            ['במקבילית, זוויות נגדיות שוות זו לזו', true, 'זו אחת התכונות של המקבילית.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: `${c.g('היזכר', 'היזכרי')} בתכונות המקבילית: צלעות נגדיות מקבילות ושוות, זוויות נגדיות שוות, וזוויות סמוכות משלימות ל-${dg(180)}. ${c.g('נסה', 'נסי')} גם לסרטט דוגמה.`,
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= המלבן ================= */
  HM.lesson({
    id: 'g-rectangle',
    learn: (c) => [
      {
        title: 'מלבנים מסביבנו',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} על דלת, על מסך של טלפון או על ספר — כולם ${b('מלבנים')}.<br>מה מיוחד בהם? בכל פינה יש ${b('זווית ישרה')}.`,
        visual: draw(shape('rect', c), { labels: true, right: true, maxw: 230 }),
      },
      {
        title: 'הגדרת המלבן',
        html: `${b('מלבן')} הוא ${b('מקבילית שיש בה זווית ישרה')}.<br>למה מספיקה זווית ישרה אחת? ${c.g('עקוב', 'עקבי')} אחרי הצעדים:`,
        visual: draw({ pts: V.shapes.rect(180, 100), right: [0] }, { labels: true, right: true, maxw: 220 }),
        steps: [
          `במקבילית אבגד, זווית א היא ${dg(90)}.`,
          `זווית ג נגדית לזווית א, ולכן גם היא ${dg(90)}.`,
          `זווית ב סמוכה לזווית א: ${m('180° − 90° = 90°')}. וזווית ד נגדית לזווית ב — גם ${dg(90)}.`,
          'כל 4 הזוויות ישרות — זה מלבן!',
        ],
      },
      {
        title: 'תכונות המלבן',
        html: `במלבן יש את ${b('כל התכונות של המקבילית')}: צלעות נגדיות מקבילות ושוות, וזוויות נגדיות שוות.<br>ועוד: ${b('כל 4 הזוויות ישרות')}, ולכן כל שתי צלעות סמוכות ${b('מאונכות')} זו לזו.`,
        visual: draw(shape('rect', c), { labels: true, marks: true, maxw: 230 }),
      },
      {
        title: 'המלבן הוא מקבילית מיוחדת',
        html: `${b('כל מלבן הוא מקבילית')} — יש בו שני זוגות של צלעות מקבילות.<br>אבל ${b('לא כל מקבילית היא מלבן')} — רק מקבילית שיש בה זווית ישרה.<br>בציור: קבוצת המלבנים נמצאת כולה בתוך קבוצת המקביליות.`,
        visual: venn('rect'),
      },
      {
        title: 'מלבן "עקום" הוא עדיין מלבן',
        html: `גם אם מסובבים מלבן, הוא נשאר מלבן — הזוויות שלו עדיין ישרות.<br>${c.g('אל תסמוך', 'אל תסמכי')} על איך שהצורה "עומדת". ${c.g('בדוק', 'בדקי')} את הזוויות ואת הצלעות.`,
        visual: draw(shape('rect', c, { rot: 28 }), { labels: true, right: true, maxw: 220 }),
        quiz: {
          type: 'tf', prompt: 'מלבן שמסובבים אותו באלכסון כבר אינו מלבן.', answer: false,
          hint: 'האם הזוויות משתנות כשמסובבים את הצורה?',
          solution: ['כשמסובבים צורה, הזוויות והצלעות שלה לא משתנות.', 'לכן היא נשארת מלבן.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: storySide, perim, perimInv, claim, wire
      const kinds = level === 1 ? ['side', 'angle', 'isRect', 'storySide', 'perim']
        : level === 2 ? ['isRect', 'tf', 'diagSplit', 'name', 'cmpPerim', 'perim', 'perimInv']
        : ['enough', 'diagSplit', 'cmpPerim', 'perimInv', 'wire', 'claim', 'diagSplit'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'side': {
          const a = c.rnd(6, 15), bb = c.rnd(3, a - 2), lab = labelSet(c), sd = sidesOf(lab), ask = c.rnd(2, 3);
          const sides = [`${a} ס"מ`, `${bb} ס"מ`, '', ''];
          sides[ask] = '?';
          const ans = ask === 2 ? a : bb;
          return {
            type: 'number', unit: 'ס"מ', answer: ans, prompt: `במלבן שבציור, מה אורך הצלע ${sd[ask]}?`,
            visual: V.polygon(rot(V.shapes.rect(180, 180 * bb / a < 70 ? 70 : 180 * bb / a), c.pick([0, 0, 20, -20])), { labels: lab, sides, maxw: 230 }),
            hint: 'במלבן, כמו בכל מקבילית, הצלעות הנגדיות שוות.',
            solution: [`הצלע ${sd[ask]} נגדית לצלע ${sd[ask - 2]}.`, `לכן אורכה ${ans} ס"מ.`],
          };
        }
        case 'angle': {
          const lab = labelSet(c), i = c.rnd(0, 3);
          return {
            type: 'number', unit: '°', answer: 90, prompt: `מה גודל ${angName(lab[i])} במלבן שבציור?`,
            visual: V.polygon(rot(V.shapes.rect(c.rnd(160, 190), c.rnd(80, 110)), rndRot(c)), { labels: lab, maxw: 220, arcs: [{ i, label: '?', cls: 's-c', fill: 'f-c', tcls: 't-c' }] }),
            hint: 'מה מיוחד בזוויות של מלבן?',
            solution: ['במלבן כל 4 הזוויות ישרות.', `לכן ${angName(lab[i])} היא ${dg(90)}.`],
          };
        }
        case 'isRect': {
          const marks = level === 1;
          const ks = ['rect', 'par', 'rtrap', 'rhombus'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: rndRot(c), deg: k === 'par' ? c.pick([70, 75]) : null }), { right: true, ticks: marks, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: 'איזה מרובע הוא מלבן? (הזוויות הישרות מסומנות בריבוע קטן)', choices, answer: 0,
            hint: 'במלבן כל 4 הזוויות ישרות. ' + c.g('ספור', 'ספרי') + ' את סימני הזווית הישרה בכל מרובע.',
            solution: ['במלבן הנכון יש 4 זוויות ישרות.', 'בטרפז יש רק 2 זוויות ישרות, ובמקבילית ובמעוין הנטויים אין זוויות ישרות.'],
          };
        }
        case 'storySide': {
          const sc = c.scene(PERIM), [a, bb] = dims(c, sc, 1), f = sc.f;
          const long = c.chance(0.5);
          return {
            type: 'number', unit: sc.u, answer: long ? a : bb,
            prompt: `${sc.obj(who)} ${pron(f)} בצורת מלבן, באורך ${a} ${sc.u} וברוחב ${bb} ${sc.u}. מה אורך הצלע שנמצאת מול ${long ? 'הצלע הארוכה' : 'הצלע הקצרה'}?`,
            hint: 'במלבן, הצלעות הנגדיות שוות.',
            solution: ['במלבן, כל צלע שווה לצלע שמולה.', `לכן אורך הצלע ${long ? a : bb} ${sc.u}.`],
          };
        }
        case 'perim': {
          const sc = c.scene(PERIM), [a, bb] = dims(c, sc, level), P = 2 * (a + bb);
          return {
            type: 'number', unit: sc.u, answer: P,
            prompt: sc.run(who, 'מלבן', `באורך ${a} ${sc.u} וברוחב ${bb} ${sc.u}`, 1),
            hint: `ההיקף הוא סכום כל 4 הצלעות: 2 צלעות של ${a} ו-2 צלעות של ${bb}.`,
            solution: [m(`${a} + ${bb} + ${a} + ${bb} = ${P}`), `ההיקף: ${P} ${sc.u}.`],
          };
        }
        case 'perimInv': {
          const sc = c.scene(PERIM), [a, bb] = dims(c, sc, 2), P = 2 * (a + bb), f = sc.f;
          return {
            type: 'number', unit: sc.u, answer: bb,
            prompt: `${sc.obj(who)} ${pron(f)} בצורת מלבן, וההיקף ${poss(f)} ${P} ${sc.u}. האורך ${poss(f)} ${a} ${sc.u}. מה הרוחב ${poss(f)}?`,
            hint: 'חצי מההיקף הוא אורך אחד ועוד רוחב אחד.',
            solution: [`חצי מההיקף: ${m(`${P} : 2 = ${a + bb}`)}.`, `הרוחב: ${m(`${a + bb} − ${a} = ${bb}`)} ${sc.u}.`],
          };
        }
        case 'wire': {
          const sc = c.scene([
            { tags: ['art', 'tech'], t: (w, L) => `${w.name} ${w.g('כופף', 'כופפת')} חוט ברזל באורך ${L} ס"מ למלבן, בלי שיישאר חוט מיותר` },
            { tags: ['nature', 'animals', 'sport'], t: (w, L) => `${w.name} ${w.g('קנה', 'קנתה')} ${L} מטרים של גדר, ו${w.g('הקיף', 'הקיפה')} בכולם חלקה בצורת מלבן` },
            { tags: ['baking', 'music', 'games', 'reading', 'space', 'kpop', 'squishy'], t: (w, L) => `${w.name} ${w.g('הדביק', 'הדביקה')} סרט באורך ${L} ס"מ בדיוק מסביב לקופסה בצורת מלבן` },
            { tags: ['magic'], t: (w, L) => `${w.name} ${w.g('כופף', 'כופפה')} שרביט קסמים גמיש באורך ${L} ס"מ למלבן, בלי שיישאר חלק מיותר` },
          ]);
          const bb = c.rnd(4, 12), a = bb + c.rnd(2, 9), L = 2 * (a + bb), d = a - bb;
          return {
            type: 'number', answer: bb, unit: sc.tags[0] === 'nature' ? "מ'" : 'ס"מ',
            prompt: `${sc.t(who, L)}. האורך של המלבן גדול מהרוחב ב-${d}. מה הרוחב של המלבן?`,
            hint: `חצי מההיקף הוא אורך + רוחב. אם האורך גדול מהרוחב ב-${d}, מה יקרה אם ${c.g('תוריד', 'תורידי')} את ההפרש ו${c.g('תחלק', 'תחלקי')} לשניים?`,
            solution: [`אורך + רוחב = ${m(`${L} : 2 = ${a + bb}`)}.`, `בלי ההפרש: ${m(`${a + bb} − ${d} = ${2 * bb}`)}, ושני רוחבים שווים: ${m(`${2 * bb} : 2 = ${bb}`)}.`, `בדיקה: האורך ${a}, והיקף ${m(`2 × (${a} + ${bb}) = ${L}`)} ✔`],
          };
        }
        case 'cmpPerim': {
          let a1, b1, a2, b2;
          const eq = c.chance(level === 3 ? 0.4 : 0.25);
          a1 = c.rnd(5, 12); b1 = c.rnd(2, a1 - 1);
          if (eq) { const t = c.rnd(1, Math.min(b1 - 1, 3)) || 1; a2 = a1 + t; b2 = b1 - t; if (b2 < 1) { a2 = a1 - 1; b2 = b1 + 1; } }
          else { a2 = c.rnd(4, 13); b2 = c.rnd(2, a2 - 1); if (a2 + b2 === a1 + b1) b2 = b2 > 2 ? b2 - 1 : b2 + 1; }
          const P1 = 2 * (a1 + b1), P2 = 2 * (a2 + b2);
          const fig = (a, bb) => V.polygon(V.shapes.rect(a * 14, bb * 14), { sides: [`${a}`, `${bb}`, '', ''], maxw: 140, pad: 26 });
          return {
            type: 'compare', prompt: `${c.g('השווה', 'השווי')} בין ההיקפים של שני המלבנים (המידות בס"מ): &gt;, &lt; או =`,
            left: fig(a1, b1), right: fig(a2, b2), lv: P1, rv: P2, answer: P1 === P2 ? '=' : P1 < P2 ? '<' : '>',
            hint: `${c.g('חשב', 'חשבי')} את ההיקף של כל מלבן: אורך + רוחב, ופעמיים.`,
            solution: [`המלבן השמאלי: ${m(`2 × (${a1} + ${b1}) = ${P1}`)} ס"מ.`, `המלבן הימני: ${m(`2 × (${a2} + ${b2}) = ${P2}`)} ס"מ.`].concat(P1 === P2 ? ['ההיקפים שווים, למרות שהמלבנים שונים!'] : []),
          };
        }
        case 'diagSplit': {
          const x = c.pick([25, 30, 35, 40, 50, 55, 60]);
          let w = 180, h = w * Math.tan(x * RAD); if (h > 190) { w = (w * 190) / h; h = 190; }
          const lab = labelSet(c), p = rot([[0, h], [w, h], [w, 0], [0, 0]], c.pick([0, 0, 15, -15, 180]));
          const P0 = p[0], v1 = sub(p[1], P0), v2 = sub(p[2], P0), v3 = sub(p[3], P0);
          const extra = arc(P0, v1, v2, 34, { label: x + '°', fill: 'f-a', off: 20 }) + arc(P0, v2, v3, 48, { label: '?', cls: 's-c', fill: 'f-c', tcls: 't-c', off: 14 });
          const sd = sidesOf(lab), dn = sideNm(lab[0], lab[2]);
          return {
            type: 'number', unit: '°', answer: 90 - x,
            prompt: `במלבן שבציור מסורטט האלכסון ${dn}. הזווית בין האלכסון לצלע ${sd[0]} היא ${dg(x)}. מה גודל הזווית בין האלכסון לצלע ${sd[3]}?`,
            visual: V.polygon(p, { labels: lab, diags: [[0, 2]], extra, maxw: 230 }),
            hint: `שתי הזוויות יחד יוצרות את ${angName(lab[0])} של המלבן. מה גודלה?`,
            solution: [`${angName(lab[0])} במלבן היא זווית ישרה: ${dg(90)}.`, m(`90° − ${x}° = ${90 - x}°`)],
          };
        }
        case 'name': {
          const v = c.pick([
            ['מרובע שיש בו 4 זוויות ישרות', 0], ['מקבילית שיש בה זווית ישרה', 0],
            ['מרובע שכל צלעותיו שוות, אבל הזוויות שלו אינן ישרות', 1], ['מרובע שיש בו רק זוג אחד של צלעות מקבילות', 2],
          ]);
          return {
            type: 'choice', keep: true, prompt: `${who.name} ${who.g('סרטט', 'סרטטה')} ${v[0]}. מה השם המתאים לצורה?`,
            choices: ['מלבן', 'מעוין', 'טרפז', 'דלתון'], answer: v[1],
            hint: `${c.g('היזכר', 'היזכרי')} בהגדרות: מלבן — מקבילית עם זווית ישרה; מעוין — כל הצלעות שוות; טרפז — בדיוק זוג אחד של צלעות מקבילות.`,
            solution: [['במרובע עם 4 זוויות ישרות כל צלע מקבילה לצלע שמולה — זו מקבילית עם זוויות ישרות: מלבן.', 'מקבילית עם זווית ישרה היא בדיוק ההגדרה של מלבן.', 'מרובע שכל צלעותיו שוות הוא מעוין. כי הזוויות לא ישרות, הוא לא ריבוע.', 'מרובע עם זוג אחד בלבד של צלעות מקבילות הוא טרפז.'][v[0] === 'מרובע שיש בו 4 זוויות ישרות' ? 0 : v[0] === 'מקבילית שיש בה זווית ישרה' ? 1 : v[1] === 1 ? 2 : 3]],
          };
        }
        case 'enough': {
          return {
            type: 'choice', prompt: `ידוע שהמרובע אבגד הוא מקבילית. איזה מידע נוסף מספיק כדי לדעת ${b('בוודאות')} שהוא מלבן?`,
            choices: [`זווית א היא ${dg(90)}`, 'אב = גד', 'זווית א = זווית ג', 'אב ∥ גד'], answer: 0,
            hint: 'שלושה מהנתונים נכונים בכל מקבילית — הם לא מוסיפים מידע חדש. איזה נתון מיוחד רק למלבן?',
            solution: ['בכל מקבילית: אב = גד, אב ∥ גד, וזווית א = זווית ג.', 'מקבילית עם זווית ישרה היא מלבן — לכן מספיק לדעת שזווית א ישרה.'],
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['כל מלבן הוא מקבילית', true, 'למלבן יש שני זוגות של צלעות מקבילות.'],
            ['כל מקבילית היא מלבן', false, `מקבילית עם זוויות של ${dg(60)} ו-${dg(120)} אינה מלבן.`],
            ['מקבילית שיש בה זווית ישרה אחת היא מלבן', true, 'אם זווית אחת ישרה — כל הזוויות ישרות.'],
            ['מרובע שיש בו 2 זוויות ישרות הוא תמיד מלבן', false, 'בטרפז ישר-זווית יש 2 זוויות ישרות, והוא אינו מלבן.'],
            ['במלבן, כל הצלעות שוות', false, 'במלבן רק הצלעות הנגדיות שוות. למשל: 8 ס"מ ו-3 ס"מ.'],
            ['במלבן, כל שתי צלעות סמוכות מאונכות זו לזו', true, 'הן נפגשות בזווית ישרה.'],
            ['מלבן שמסובבים אותו כבר אינו מלבן', false, 'סיבוב לא משנה את הזוויות ואת הצלעות.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: 'מלבן הוא מקבילית שיש בה זווית ישרה. ' + c.g('נסה', 'נסי') + ' לחשוב על דוגמה נגדית.',
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= המעוין ================= */
  HM.lesson({
    id: 'g-rhombus',
    learn: (c) => [
      {
        title: 'צורת היהלום',
        html: `${c.name}, ${c.g('אתה זוכר', 'את זוכרת')} את הצורה של היהלום בחפיסת קלפים? זו צורה של ${b('מעוין')}.<br>במעוין ${b('כל 4 הצלעות שוות')} זו לזו.`,
        visual: draw({ pts: V.shapes.rhombusUp(150, 210), ticks: [1, 1, 1, 1] }, { ticks: true, maxw: 170 }),
      },
      {
        title: 'הגדרת המעוין',
        html: `${b('מעוין')} הוא מרובע ${b('שכל צלעותיו שוות')}.<br>מסמנים צלעות שוות בקו קטן על כל צלע.<br>ההיקף של מעוין הוא ${b('4 פעמים')} אורך הצלע: אם הצלע 5 ס"מ, ההיקף ${m('4 × 5 = 20')} ס"מ.`,
        visual: draw({ pts: rhomPts(120, 60), ticks: [1, 1, 1, 1] }, { labels: true, ticks: true, sides: ['5 ס"מ', '', '', ''], maxw: 230 }),
      },
      {
        title: 'כל מעוין הוא מקבילית',
        html: `במעוין, הצלעות הנגדיות ${b('מקבילות')} — לכן ${b('כל מעוין הוא מקבילית')}.<br>ולכן יש לו את כל התכונות של המקבילית: זוויות נגדיות שוות, וזוויות סמוכות משלימות ל-${dg(180)}.`,
        visual: V.polygon(rhomPts(120, 60), { labels: L4, arrows: [1, 2, 1, 2], maxw: 230, arcs: [{ i: 0, label: '60°', fill: 'f-a' }, { i: 1, label: '120°', cls: 's-b', fill: 'f-b' }, { i: 2, label: '60°', fill: 'f-a' }, { i: 3, label: '120°', cls: 's-b', fill: 'f-b' }] }),
      },
      {
        title: 'לא כל מקבילית היא מעוין',
        html: `מקבילית שבה ${b('שתי צלעות סמוכות שוות')} היא מעוין: הצלעות הנגדיות שוות לצלעות הסמוכות, וכך כל 4 הצלעות שוות.<br>מקבילית "רגילה", עם צלע ארוכה וצלע קצרה, ${b('אינה')} מעוין.`,
        visual: venn('rhom'),
      },
      {
        title: 'דוגמה פתורה',
        html: `במעוין אבגד: אב = 6 ס"מ, וזווית א היא ${dg(50)}. ${c.g('מצא', 'מצאי')} את ההיקף, את זווית ג ואת זווית ב.`,
        visual: V.polygon(rhomPts(120, 50), { labels: L4, ticks: [1, 1, 1, 1], sides: ['6 ס"מ', '', '', ''], maxw: 230, arcs: [{ i: 0, label: '50°', fill: 'f-a' }] }),
        steps: [
          `כל הצלעות שוות, ולכן ההיקף: ${m('4 × 6 = 24')} ס"מ.`,
          `זווית ג נגדית לזווית א: ${dg(50)}.`,
          `זווית ב סמוכה לזווית א: ${m('180° − 50° = 130°')}.`,
        ],
      },
      {
        title: 'מעוין עומד ומעוין שוכב',
        html: `מעוין יכול "לעמוד על קודקוד" או "לשכב על צלע" — זה אותו מעוין! מה שקובע הוא ש${b('כל הצלעות שוות')}.`,
        visual: row(draw({ pts: V.shapes.rhombusUp(110, 160), ticks: [1, 1, 1, 1] }, { ticks: true, maxw: 120 }), draw({ pts: rhomPts(110, 55), ticks: [1, 1, 1, 1] }, { ticks: true, maxw: 170 })),
        quiz: {
          type: 'tf', prompt: 'כל מקבילית היא מעוין.', answer: false,
          hint: 'האם בכל מקבילית כל הצלעות שוות?',
          solution: ['במקבילית רק הצלעות הנגדיות שוות.', 'מקבילית עם צלעות של 7 ס"מ ו-4 ס"מ אינה מעוין.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: storyPerim, perimInv, storyAng, claim, mixPerim
      const kinds = level === 1 ? ['side', 'perim', 'isRhom', 'angOpp', 'storyPerim', 'storyPerim', 'storyAng']
        : level === 2 ? ['angAdj', 'tf', 'isRhom', 'perimInv', 'storyAng', 'perimInvStory', 'sideFromPar', 'storyAng']
        : ['enough', 'claim', 'angRatio', 'mixPerim', 'mixPerim', 'angRatio', 'sideFromPar'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'side': {
          const a = c.rnd(3, 15), lab = labelSet(c), sd = sidesOf(lab), ask = c.rnd(1, 3);
          const sides = [`${a} ס"מ`, '', '', '']; sides[ask] = '?';
          return {
            type: 'number', unit: 'ס"מ', answer: a, prompt: `במעוין שבציור, אורך הצלע ${sd[0]} הוא ${a} ס"מ. מה אורך הצלע ${sd[ask]}?`,
            visual: V.polygon(rot(rhomPts(115, c.pick([55, 60, 65])), rndRot(c)), { labels: lab, sides, ticks: [1, 1, 1, 1], maxw: 230 }),
            hint: 'מה מיוחד בצלעות של מעוין?',
            solution: ['במעוין כל הצלעות שוות.', `לכן ${sd[ask]} = ${a} ס"מ.`],
          };
        }
        case 'perim':
        case 'perimInv': {
          const a = level === 1 ? c.rnd(2, 10) : c.rnd(6, 25), P = 4 * a, inv = kind === 'perimInv';
          return {
            type: 'number', unit: 'ס"מ', answer: inv ? a : P,
            prompt: inv ? `ההיקף של מעוין הוא ${P} ס"מ. מה אורך הצלע שלו?` : `אורך הצלע של מעוין הוא ${a} ס"מ. מה ההיקף שלו?`,
            visual: V.polygon(rot(rhomPts(115, 60), rndRot(c)), { ticks: [1, 1, 1, 1], sides: [inv ? '?' : `${a} ס"מ`, '', '', ''], maxw: 210 }),
            hint: inv ? 'ההיקף מורכב מ-4 צלעות שוות.' : 'ההיקף הוא סכום כל הצלעות, וכל 4 הצלעות שוות.',
            solution: inv ? ['ההיקף הוא 4 צלעות שוות.', m(`${P} : 4 = ${a}`) + ' ס"מ'] : ['ההיקף הוא 4 צלעות שוות.', m(`4 × ${a} = ${P}`) + ' ס"מ'],
          };
        }
        case 'isRhom': {
          const ks = ['rhombus', 'kite', 'par', 'rect'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: rndRot(c) }), { ticks: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: 'איזה מרובע הוא מעוין? (קווים קטנים זהים מסמנים צלעות שוות)', choices, answer: 0,
            hint: 'במעוין כל 4 הצלעות שוות — על כל הצלעות מופיע אותו סימן.',
            solution: ['במעוין הנכון יש את אותו סימן על כל 4 הצלעות.', 'בדלתון, במקבילית ובמלבן יש שני סוגים של צלעות.'],
          };
        }
        case 'angOpp':
        case 'angAdj': {
          const deg = c.pick([40, 50, 55, 60, 65, 70, 75]), lab = labelSet(c);
          const gi = c.rnd(0, 3), given = gi % 2 === 0 ? deg : 180 - deg; // ב-rhomPts זווית חדה בקודקודים 0 ו-2
          const adj = kind === 'angAdj';
          const ai = adj ? (gi + 1) % 4 : (gi + 2) % 4, ans = adj ? 180 - given : given;
          return {
            type: 'number', unit: '°', answer: ans, prompt: `במעוין שבציור, ${angName(lab[gi])} היא ${dg(given)}. מה גודל ${angName(lab[ai])}?`,
            visual: V.polygon(rot(rhomPts(115, deg), c.pick([0, 0, 15, -15])), { labels: lab, ticks: [1, 1, 1, 1], maxw: 230, arcs: [{ i: gi, label: given + '°', fill: 'f-a' }, { i: ai, label: '?', cls: 's-c', fill: 'f-c', tcls: 't-c' }] }),
            hint: `מעוין הוא מקבילית. מה ${c.g('אתה יודע', 'את יודעת')} על זוויות ${adj ? 'סמוכות' : 'נגדיות'} במקבילית?`,
            solution: adj ? [`הזוויות סמוכות, ולכן יחד ${dg(180)}.`, m(`180° − ${given}° = ${ans}°`)] : ['זוויות נגדיות במעוין (כמו בכל מקבילית) שוות.', `${angName(lab[ai])} = ${dg(ans)}`],
          };
        }
        case 'storyPerim':
        case 'perimInvStory': {
          const sc = c.scene(PERIM), inv = kind === 'perimInvStory';
          const a = sc.u === "מ'" ? c.rnd(level === 1 ? 3 : 6, level === 1 ? 12 : 30) : c.rnd(level === 1 ? 2 : 4, level === 1 ? 10 : 20), P = 4 * a, f = sc.f;
          return {
            type: 'number', unit: sc.u, answer: inv ? a : P,
            prompt: inv ? `${sc.obj(who)} ${pron(f)} בצורת מעוין, וההיקף ${poss(f)} ${P} ${sc.u}. מה אורך כל צלע?` : sc.run(who, 'מעוין', `עם 4 צלעות של ${a} ${sc.u} כל אחת`, 1),
            hint: inv ? 'במעוין 4 צלעות שוות. ' + c.g('חלק', 'חלקי') + ' את ההיקף ל-4.' : 'במעוין 4 צלעות שוות. ' + c.g('חבר', 'חברי') + ' את כולן — או ' + c.g('כפול', 'כפלי') + ' ב-4.',
            solution: inv ? [m(`${P} : 4 = ${a}`), `אורך כל צלע: ${a} ${sc.u}.`] : [m(`4 × ${a} = ${P}`), `התשובה: ${P} ${sc.u}.`],
          };
        }
        case 'storyAng': {
          const sc = c.scene([
            { tags: ['art', 'games'], t: (w) => `${w.name} ${w.g('מעצב', 'מעצבת')} אריח בצורת מעוין לפסיפס` },
            { tags: ['sport', 'nature', 'space'], t: (w) => `${w.name} ${w.g('בונה', 'בונה')} עפיפון בצורת מעוין` },
            { tags: ['baking', 'music', 'animals', 'reading', 'tech'], t: (w) => `${w.name} ${w.g('גוזר', 'גוזרת')} מדבקה בצורת מעוין` },
            { tags: ['kpop'], t: (w) => `${w.name} ${w.g('מעצב', 'מעצבת')} תג בצורת מעוין למועדון המעריצים של הלהקה` },
            { tags: ['magic'], t: (w) => `${w.name} ${w.g('מצייר', 'מציירת')} על ספר הלחשים סמל בצורת מעוין` },
            { tags: ['squishy'], t: (w) => `${w.name} ${w.g('קונה', 'קונה')} סקוויש שטוח בצורת מעוין` },
          ]);
          const x = c.pick([40, 50, 60, 70, 110, 120, 130, 140]), adj = level > 1 && c.chance(0.6), ans = adj ? 180 - x : x;
          return {
            type: 'number', unit: '°', answer: ans,
            prompt: `${sc.t(who)}. אחת הזוויות של המעוין היא ${dg(x)}. מה גודל הזווית ${b(adj ? 'הסמוכה' : 'הנגדית')} לה?`,
            hint: 'מעוין הוא מקבילית, ולכן יש לו את התכונות של זוויות המקבילית.',
            solution: adj ? [`זוויות סמוכות במעוין משלימות ל-${dg(180)}.`, m(`180° − ${x}° = ${ans}°`)] : ['זוויות נגדיות במעוין שוות.', `התשובה: ${dg(x)}.`],
          };
        }
        case 'sideFromPar': {
          const a = c.rnd(4, 15);
          return {
            type: 'number', unit: 'ס"מ', answer: 4 * a,
            prompt: `במקבילית אבגד, אב = ${a} ס"מ וגם בג = ${a} ס"מ. מה ההיקף של המקבילית?`,
            visual: V.polygon(rhomPts(115, 60), { labels: L4, sides: [`${a} ס"מ`, `${a} ס"מ`, '', ''], maxw: 220 }),
            hint: 'במקבילית צלעות נגדיות שוות. מה זה אומר כשגם שתי צלעות סמוכות שוות?',
            solution: [`גד = אב = ${a}, ואד = בג = ${a} — כל הצלעות שוות: זה מעוין!`, `ההיקף: ${m(`4 × ${a} = ${4 * a}`)} ס"מ.`],
          };
        }
        case 'enough': {
          return {
            type: 'choice', prompt: `ידוע שהמרובע אבגד הוא מקבילית. איזה מידע נוסף מספיק כדי לדעת ${b('בוודאות')} שהוא מעוין?`,
            choices: ['אב = בג', 'אב = גד', 'זווית א = זווית ג', 'אב ∥ גד'], answer: 0,
            hint: 'שלושה מהנתונים נכונים בכל מקבילית. איזה נתון מיוחד למעוין?',
            solution: ['בכל מקבילית: אב = גד, אב ∥ גד, וזווית א = זווית ג.', 'אם גם שתי צלעות סמוכות שוות (אב = בג), אז כל הצלעות שוות — מעוין.'],
          };
        }
        case 'angRatio': {
          const k = c.pick([2, 3, 4, 5]), small = 180 / (k + 1), big = 180 - small, askBig = c.chance(0.5);
          return {
            type: 'number', unit: '°', answer: askBig ? big : small,
            prompt: `במעוין אבגד, זווית ב גדולה פי ${k} מזווית א. מה גודל ${askBig ? 'זווית ב' : 'זווית א'}?`,
            hint: `זווית א וזווית ב סמוכות — יחד ${dg(180)}. ${c.g('חשוב', 'חשבי')} על זווית א כעל "חלק אחד".`,
            solution: [`יחד ${k + 1} חלקים שווים = ${dg(180)}.`, `זווית א: ${m(`180° : ${k + 1} = ${small}°`)}.`, `זווית ב: ${m(`${k} × ${small}° = ${big}°`)}.`],
          };
        }
        case 'mixPerim': {
          const a = c.rnd(4, 15), bb = c.rnd(2, 12), s2 = a + bb;
          const sc = c.scene([
            { tags: ['art', 'reading'], t: (w) => `${w.name} ${w.g('כופף', 'כופפת')} חוט אחד למלבן`, t2: 'מאותו אורך חוט בדיוק אפשר לכופף גם מעוין' },
            { tags: ['nature', 'animals', 'sport'], t: (w) => `${w.name} ${w.g('הקיף', 'הקיפה')} בגדר חלקה בצורת מלבן`, t2: 'עם אותה כמות גדר בדיוק אפשר להקיף גם חלקה בצורת מעוין' },
            { tags: ['baking', 'music', 'games', 'tech', 'space', 'kpop', 'magic', 'squishy'], t: (w) => `${w.name} ${w.g('הדביק', 'הדביקה')} סרט מסביב לכרטיס בצורת מלבן`, t2: 'סרט באותו אורך בדיוק מתאים גם למסביב של כרטיס בצורת מעוין' },
          ]);
          const u = sc.tags[0] === 'nature' ? "מ'" : 'ס"מ';
          return {
            type: 'number', answer: s2, unit: u,
            prompt: `${sc.t(who)} באורך ${a} ${u} וברוחב ${bb} ${u}. ${sc.t2}. מה אורך הצלע של המעוין?`,
            hint: 'להיקף של שתי הצורות אותו אורך. ' + c.g('חשב', 'חשבי') + ' קודם את ההיקף של המלבן.',
            solution: [`היקף המלבן: ${m(`2 × (${a} + ${bb}) = ${2 * s2}`)} ${u}.`, `למעוין 4 צלעות שוות: ${m(`${2 * s2} : 4 = ${s2}`)} ${u}.`],
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['כל מעוין הוא מקבילית', true, 'במעוין הצלעות הנגדיות מקבילות.'],
            ['כל מקבילית היא מעוין', false, 'מקבילית עם צלעות של 7 ס"מ ו-4 ס"מ אינה מעוין.'],
            ['מקבילית שיש בה שתי צלעות סמוכות שוות היא מעוין', true, 'הצלעות הנגדיות שוות לסמוכות, ולכן כל 4 הצלעות שוות.'],
            ['מרובע שיש בו שני זוגות של צלעות שוות הוא תמיד מעוין', false, 'גם במלבן של 8 ס"מ על 3 ס"מ יש שני זוגות של צלעות שוות, והוא אינו מעוין.'],
            ['במעוין, כל הזוויות שוות', false, `במעוין יכולות להיות זוויות של ${dg(60)} ושל ${dg(120)}.`],
            ['במעוין יכולה להיות זווית ישרה', true, 'מעוין עם זווית ישרה הוא ריבוע — והריבוע הוא גם מעוין.'],
            ['במעוין, הזוויות הנגדיות שוות', true, 'מעוין הוא מקבילית, ובמקבילית זוויות נגדיות שוות.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: 'מעוין הוא מרובע שכל צלעותיו שוות, וכל מעוין הוא מקבילית. ' + c.g('נסה', 'נסי') + ' לחשוב על דוגמה נגדית.',
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= הריבוע ================= */
  HM.lesson({
    id: 'g-square',
    learn: (c) => [
      {
        title: 'הריבוע',
        html: `${c.name}, ${c.g('הסתכל', 'הסתכלי')} על לוח שחמט: כל משבצת בו היא ${b('ריבוע')}.<br>בריבוע ${b('כל הצלעות שוות')} ו${b('כל הזוויות ישרות')}.`,
        visual: draw(shape('square', c), { labels: true, ticks: true, right: true, maxw: 200 }),
      },
      {
        title: 'הריבוע הוא מלבן מיוחד',
        html: `לריבוע יש 4 זוויות ישרות — לכן ${b('כל ריבוע הוא מלבן')}.<br>מה מיוחד בו? ${b('הצלעות הסמוכות שוות')}. מלבן שהצלעות הסמוכות בו שוות — הוא ריבוע.`,
        visual: row(draw(shape('rect', c), { right: true, ticks: true, maxw: 150 }), draw(shape('square', c), { right: true, ticks: true, maxw: 110 })),
      },
      {
        title: 'הריבוע הוא מעוין מיוחד',
        html: `לריבוע יש 4 צלעות שוות — לכן ${b('כל ריבוע הוא מעוין')}.<br>מה מיוחד בו? ${b('יש בו זווית ישרה')}. מעוין שיש בו זווית ישרה — הוא ריבוע.`,
        visual: row(draw(shape('rhombus', c, { deg: 60 }), { ticks: true, maxw: 160 }), draw(shape('square', c), { right: true, ticks: true, maxw: 110 })),
      },
      {
        title: 'ריבוע שעומד על קודקוד',
        html: `אם מסובבים ריבוע ב-${dg(45)}, הוא נראה כמו "יהלום" — אבל ${b('הוא עדיין ריבוע')}! הצלעות עדיין שוות, והזוויות עדיין ישרות.<br>(והוא גם מעוין — כמו כל ריבוע.)`,
        visual: draw(shape('square', c, { rot: 45 }), { labels: true, ticks: true, right: true, maxw: 200 }),
      },
      {
        title: 'הריבוע במשפחה',
        html: `הריבוע נמצא ${b('גם')} בקבוצת המלבנים ${b('וגם')} בקבוצת המעוינים — הוא החלק המשותף שלהן. ולכן הוא גם מקבילית.`,
        visual: venn('full'),
      },
      {
        title: 'דוגמה פתורה',
        html: `${c.name} ${c.g('רוצה', 'רוצה')} להקיף בסרט ריבוע שההיקף שלו 36 ס"מ. מה אורך כל צלע?`,
        steps: ['לריבוע 4 צלעות שוות.', `${m('36 : 4 = 9')} — כל צלע 9 ס"מ.`, `בדיקה: ${m('4 × 9 = 36')} ✔`],
        quiz: {
          type: 'number', unit: 'ס"מ', prompt: 'אורך הצלע של ריבוע הוא 7 ס"מ. מה ההיקף שלו?', answer: 28,
          hint: 'ההיקף הוא 4 צלעות שוות.',
          solution: [m('4 × 7 = 28') + ' ס"מ'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: storyPerim, perimInvStory, claim, multi, countSq
      const kinds = level === 1 ? ['isSq', 'side', 'perim', 'rotTF', 'storyPerim', 'storyPerim', 'storyPerim']
        : level === 2 ? ['isSq', 'need', 'tf', 'perimInv', 'rotClaim', 'perimInvStory', 'storyPerim']
        : ['names', 'need', 'claim', 'multi', 'countSq', 'perimInvStory', 'tf'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'isSq': {
          const ks = ['square', 'rhombus', 'rect', 'par'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: k === 'square' ? c.pick([45, 30, -20, 15]) : rndRot(c), deg: k === 'rhombus' ? c.pick([60, 65, 70]) : null }), { ticks: true, right: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: 'איזה מרובע הוא ריבוע? (קווים זהים — צלעות שוות; ריבוע קטן — זווית ישרה)', choices, answer: 0,
            hint: 'בריבוע צריכים להתקיים שני דברים: כל הצלעות שוות, וכל הזוויות ישרות. איך שהצורה מסובבת לא משנה.',
            solution: ['בריבוע הנכון — אותו סימן על כל הצלעות וגם 4 זוויות ישרות.', 'במעוין הצלעות שוות אבל הזוויות לא ישרות; במלבן הזוויות ישרות אבל הצלעות לא כולן שוות.'],
          };
        }
        case 'side': {
          const a = c.rnd(3, 15), lab = labelSet(c), sd = sidesOf(lab), ask = c.rnd(1, 3);
          const sides = [`${a} ס"מ`, '', '', '']; sides[ask] = '?';
          return {
            type: 'number', unit: 'ס"מ', answer: a, prompt: `בריבוע שבציור, הצלע ${sd[0]} היא ${a} ס"מ. מה אורך הצלע ${sd[ask]}?`,
            visual: V.polygon(rot(V.shapes.square(120), rndRot(c)), { labels: lab, sides, ticks: [1, 1, 1, 1], right: [0, 1, 2, 3], maxw: 210 }),
            hint: 'מה מיוחד בצלעות של ריבוע?', solution: ['בריבוע כל הצלעות שוות.', `לכן ${sd[ask]} = ${a} ס"מ.`],
          };
        }
        case 'perim':
        case 'perimInv': {
          const a = level === 1 ? c.rnd(2, 10) : c.rnd(6, 25), P = 4 * a, inv = kind === 'perimInv';
          return {
            type: 'number', unit: 'ס"מ', answer: inv ? a : P,
            prompt: inv ? `ההיקף של ריבוע הוא ${P} ס"מ. מה אורך הצלע שלו?` : `אורך הצלע של ריבוע הוא ${a} ס"מ. מה ההיקף שלו?`,
            hint: 'לריבוע 4 צלעות שוות.',
            solution: inv ? [m(`${P} : 4 = ${a}`) + ' ס"מ'] : [m(`4 × ${a} = ${P}`) + ' ס"מ'],
          };
        }
        case 'storyPerim':
        case 'perimInvStory': {
          const sc = c.scene(PERIM), inv = kind === 'perimInvStory';
          const a = sc.u === "מ'" ? c.rnd(level === 1 ? 3 : 6, level === 1 ? 12 : 35) : c.rnd(level === 1 ? 2 : 4, level === 1 ? 10 : 25), P = 4 * a, f = sc.f;
          if (inv && level === 3) {
            // רב-שלבי: ריבוע וגם מלבן עם אותו היקף
            const w2 = c.rnd(2, Math.max(2, a - 2)), l2 = 2 * a - w2;
            return {
              type: 'number', unit: sc.u, answer: a,
              prompt: `${sc.obj(who)} ${pron(f)} בצורת ריבוע. ההיקף ${poss(f)} שווה להיקף של מלבן באורך ${l2} ${sc.u} וברוחב ${w2} ${sc.u}. מה אורך הצלע של הריבוע?`,
              hint: `${c.g('חשב', 'חשבי')} קודם את ההיקף של המלבן. ואז — לריבוע 4 צלעות שוות.`,
              solution: [`היקף המלבן: ${m(`2 × (${l2} + ${w2}) = ${P}`)}.`, `צלע הריבוע: ${m(`${P} : 4 = ${a}`)} ${sc.u}.`],
            };
          }
          return {
            type: 'number', unit: sc.u, answer: inv ? a : P,
            prompt: inv ? `${sc.obj(who)} ${pron(f)} בצורת ריבוע, וההיקף ${poss(f)} ${P} ${sc.u}. מה אורך כל צלע?` : sc.run(who, 'ריבוע', `עם צלע של ${a} ${sc.u}`, 1),
            hint: inv ? 'לריבוע 4 צלעות שוות. ' + c.g('חלק', 'חלקי') + ' את ההיקף ל-4.' : 'לריבוע 4 צלעות שוות. ' + c.g('כפול', 'כפלי') + ' את אורך הצלע ב-4.',
            solution: inv ? [m(`${P} : 4 = ${a}`), `כל צלע: ${a} ${sc.u}.`] : [m(`4 × ${a} = ${P}`), `התשובה: ${P} ${sc.u}.`],
          };
        }
        case 'rotTF':
        case 'rotClaim': {
          const f = c.friend();
          const v = kind === 'rotTF' ? c.pick([['הצורה שבציור היא ריבוע', true], ['הצורה שבציור אינה ריבוע, כי היא עומדת על קודקוד', false]])
            : c.pick([['זה לא ריבוע — זה מעוין', false, 'הצורה היא ריבוע (וכל ריבוע הוא גם מעוין), ולכן "לא ריבוע" לא נכון.'], ['הצורה היא גם ריבוע וגם מעוין', true, 'כל ריבוע הוא גם מעוין.'], ['הצורה היא גם מלבן', true, 'יש בה 4 זוויות ישרות, ולכן היא מלבן — ריבוע הוא מלבן מיוחד.']]);
          return {
            type: 'tf', prompt: kind === 'rotTF' ? `${v[0]}.` : `${f.name} ${f.g('מסתכל', 'מסתכלת')} בציור ${f.g('ואומר', 'ואומרת')}: "${v[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?`,
            visual: draw(shape('square', c, { rot: c.pick([45, 40, 50]) }), { ticks: true, right: true, maxw: 190 }), answer: v[1],
            hint: `${c.g('בדוק', 'בדקי')} את הסימונים: האם כל הצלעות שוות? האם כל הזוויות ישרות? הסיבוב לא משנה את הצורה.`,
            solution: [v[2] || 'כל הצלעות שוות וכל הזוויות ישרות — זה ריבוע, גם כשהוא עומד על קודקוד.', `לכן הטענה ${v[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
        case 'need': {
          const fromRect = c.chance(0.5);
          const opts = fromRect ? ['שתי צלעות סמוכות שוות', 'זווית ישרה', 'צלעות נגדיות מקבילות', 'צלעות נגדיות שוות'] : ['זווית ישרה', 'שתי צלעות סמוכות שוות', 'צלעות נגדיות מקבילות', 'זוויות נגדיות שוות'];
          return {
            type: 'choice', prompt: `מה צריך להוסיף ל${fromRect ? 'מלבן' : 'מעוין'} כדי שיהיה ${b('ריבוע')}?`, choices: opts, answer: 0,
            hint: `מה כבר יש בכל ${fromRect ? 'מלבן' : 'מעוין'}? ומה עוד חסר כדי שיהיה ריבוע?`,
            solution: fromRect ? ['בכל מלבן כבר יש זוויות ישרות וצלעות נגדיות מקבילות ושוות.', 'חסר רק שהצלעות הסמוכות יהיו שוות — ואז כל הצלעות שוות.'] : ['בכל מעוין כבר כל הצלעות שוות, והצלעות הנגדיות מקבילות.', 'חסרה רק זווית ישרה — ואז כל הזוויות ישרות.'],
          };
        }
        case 'names':
          return {
            type: 'choice', prompt: 'אילו שמות מתאימים לכל ריבוע?',
            choices: ['מקבילית, מלבן ומעוין', 'רק מלבן', 'רק מעוין', 'מלבן ומעוין, אבל לא מקבילית'], answer: 0,
            hint: 'לריבוע יש שני זוגות של צלעות מקבילות, 4 זוויות ישרות ו-4 צלעות שוות. לאיזו הגדרה הוא מתאים?',
            solution: ['שני זוגות של צלעות מקבילות — מקבילית.', '4 זוויות ישרות — מלבן. 4 צלעות שוות — מעוין.'],
          };
        case 'multi': {
          const a = c.rnd(5, 15), w2 = c.rnd(2, a - 2), l2 = 2 * a - w2;
          const sc = c.scene([
            { tags: ['art', 'reading', 'games'], t: (w) => `${w.name} ${w.g('כופף', 'כופפת')} חוט למלבן באורך ${l2} ס"מ וברוחב ${w2} ס"מ. אחר כך ${w.g('הוא פתח', 'היא פתחה')} את החוט ו${w.g('כופף', 'כופפה')} אותו לריבוע` },
            { tags: ['nature', 'animals', 'sport'], t: (w) => `${w.name} ${w.g('בנה', 'בנתה')} גדר סביב חצר בצורת מלבן באורך ${l2} מ' וברוחב ${w2} מ'. אחר כך ${w.g('הוא העביר', 'היא העבירה')} את כל הגדר לחצר בצורת ריבוע` },
            { tags: ['baking', 'music', 'tech', 'space', 'kpop', 'magic', 'squishy'], t: (w) => `${w.name} ${w.g('הדביק', 'הדביקה')} סרט מסביב לקופסה בצורת מלבן באורך ${l2} ס"מ וברוחב ${w2} ס"מ. סרט באותו אורך בדיוק ${w.g('הוא הדביק', 'היא הדביקה')} מסביב לקופסה בצורת ריבוע` },
          ]);
          const u = sc.tags[0] === 'nature' ? "מ'" : 'ס"מ';
          return {
            type: 'number', unit: u, answer: a, prompt: `${sc.t(who)}. מה אורך הצלע של הריבוע?`,
            hint: 'לשתי הצורות אותו היקף. ' + c.g('חשב', 'חשבי') + ' את ההיקף של המלבן, ואז ' + c.g('חלק', 'חלקי') + ' ל-4.',
            solution: [`היקף המלבן: ${m(`2 × (${l2} + ${w2}) = ${4 * a}`)}.`, `צלע הריבוע: ${m(`${4 * a} : 4 = ${a}`)} ${u}.`],
          };
        }
        case 'countSq': {
          const [r, cc] = c.pick([[2, 2], [2, 3], [3, 3], [1, 4], [2, 4]]);
          let n = 0; for (let k = 1; k <= Math.min(r, cc); k++) n += (r - k + 1) * (cc - k + 1);
          const cell = 40;
          let s = '';
          for (let i = 0; i < r; i++) for (let j = 0; j < cc; j++) s += S.rect(4 + j * cell, 4 + i * cell, cell, cell, { cls: 'f-l s-ink', sw: 2.5 });
          const vis = S.svg(cc * cell + 8, r * cell + 8, s, { cls: 'vz-geo', label: 'ריבועים', maxw: cc * cell * 1.3 });
          const sizes = HM.range(1, Math.min(r, cc)).map((k) => `${(r - k + 1) * (cc - k + 1)} ריבועים של ${k} × ${k}`.replace(/^1 ריבועים/, 'ריבוע אחד'));
          return {
            type: 'number', answer: n, prompt: `כמה ריבועים יש בציור ${b('בסך הכול')}? (${c.g('ספור', 'ספרי')} גם ריבועים גדולים שבנויים מכמה משבצות)`,
            visual: vis,
            hint: `${c.g('ספור', 'ספרי')} קודם את הריבועים הקטנים, ואחר כך ${c.g('חפש', 'חפשי')} ריבועים של 2 × 2 משבצות${Math.min(r, cc) > 2 ? ' ושל 3 × 3' : ''}.`,
            solution: sizes.concat([`בסך הכול: ${n} ריבועים.`]),
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['כל ריבוע הוא מלבן', true, 'לריבוע יש 4 זוויות ישרות.'],
            ['כל מלבן הוא ריבוע', false, 'מלבן של 8 ס"מ על 3 ס"מ אינו ריבוע.'],
            ['כל ריבוע הוא מעוין', true, 'לריבוע יש 4 צלעות שוות.'],
            ['כל מעוין הוא ריבוע', false, `מעוין עם זוויות של ${dg(60)} ו-${dg(120)} אינו ריבוע.`],
            ['מעוין שיש בו זווית ישרה הוא ריבוע', true, 'אם זווית אחת ישרה — כולן ישרות, וכל הצלעות כבר שוות.'],
            ['מלבן שיש בו שתי צלעות סמוכות שוות הוא ריבוע', true, 'הצלעות הנגדיות שוות לסמוכות, ולכן כל הצלעות שוות, וכל הזוויות כבר ישרות.'],
            ['מרובע שכל צלעותיו שוות הוא תמיד ריבוע', false, 'הוא יכול להיות מעוין "נוטה", בלי זוויות ישרות.'],
            ['ריבוע שמסובבים אותו ב-45° הופך למעוין שאינו ריבוע', false, 'סיבוב לא משנה צלעות וזוויות — הוא נשאר ריבוע.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: 'ריבוע הוא גם מלבן וגם מעוין. אבל האם כל מלבן או כל מעוין הוא ריבוע? ' + c.g('חפש', 'חפשי') + ' דוגמה נגדית.',
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= משפחת המקביליות ================= */
  // מחלקות: מרובע, מקבילית, מלבן, מעוין, ריבוע
  const CLS = {
    Q: { s: 'מרובע', p: 'מרובעים' }, P: { s: 'מקבילית', p: 'מקביליות', f: true }, R: { s: 'מלבן', p: 'מלבנים' },
    H: { s: 'מעוין', p: 'מעוינים' }, S: { s: 'ריבוע', p: 'ריבועים' },
  };
  // לאילו מחלקות שייכת כל צורה
  const MEMBER = { square: 'QPRHS', rect: 'QPR', rhombus: 'QPH', par: 'QP', trap: 'Q', kite: 'Q' };
  const SUBSET = { S: 'SRHPQ', R: 'RPQ', H: 'HPQ', P: 'PQ', Q: 'Q' };
  // דוגמה נגדית קצרה ל"כל X הוא Y"
  const COUNTER = {
    PR: `מקבילית עם זוויות של ${dg(60)} ו-${dg(120)} אינה מלבן`, PH: 'מקבילית עם צלעות של 7 ס"מ ו-4 ס"מ אינה מעוין', PS: 'מקבילית "נוטה" עם צלעות שונות אינה ריבוע',
    RS: 'מלבן של 8 ס"מ על 3 ס"מ אינו ריבוע', RH: 'מלבן של 8 ס"מ על 3 ס"מ אינו מעוין', HS: `מעוין עם זוויות של ${dg(60)} ו-${dg(120)} אינו ריבוע`, HR: `מעוין עם זוויות של ${dg(60)} ו-${dg(120)} אינו מלבן`,
    QP: 'טרפז הוא מרובע, אבל אינו מקבילית', QR: 'טרפז הוא מרובע, אבל אינו מלבן', QH: 'טרפז הוא מרובע, אבל אינו מעוין', QS: 'טרפז הוא מרובע, אבל אינו ריבוע',
  };
  function relStatement(c, level) {
    const keys = level === 1 ? [['S', 'R'], ['S', 'H'], ['R', 'P'], ['H', 'P'], ['R', 'S'], ['H', 'S'], ['P', 'R'], ['P', 'H']]
      : [['S', 'R'], ['S', 'H'], ['R', 'P'], ['H', 'P'], ['S', 'P'], ['R', 'S'], ['H', 'S'], ['P', 'R'], ['P', 'H'], ['R', 'H'], ['H', 'R'], ['Q', 'P'], ['P', 'Q']];
    const [x, y] = c.pick(keys), X = CLS[x], Y = CLS[y];
    const sub2 = SUBSET[x].indexOf(y) >= 0;
    const form = level === 1 ? 'all' : c.pick(['all', 'all', 'some', 'someNot']);
    if (form === 'all') return { t: `כל ${X.s} ${X.f ? 'היא' : 'הוא'} ${Y.s}`, a: sub2, why: sub2 ? `ל${X.s} יש את כל התכונות של ${Y.s}.` : `דוגמה נגדית: ${COUNTER[x + y]}.` };
    if (form === 'some') {
      // כל הזוגות שבחרנו נחתכים (מלבן ומעוין — בריבוע)
      const why = sub2 ? `כל ${X.s} ${X.f ? 'היא' : 'הוא'} ${Y.s}, אז בוודאי יש כאלה.`
        : SUBSET[y].indexOf(x) >= 0 ? `למשל: כל ${Y.s} ${Y.f ? 'היא' : 'הוא'} ${X.s}.` : 'למשל הריבוע — הוא גם מלבן וגם מעוין.';
      return { t: `יש ${X.p} ש${X.f ? 'הן' : 'הם'} ${Y.p}`, a: true, why };
    }
    return { t: `יש ${X.p} ש${X.f ? 'אינן' : 'אינם'} ${Y.p}`, a: !sub2, why: sub2 ? `כל ${X.s} ${X.f ? 'היא' : 'הוא'} ${Y.s} — אין אף ${X.s} ש${X.f ? 'אינה' : 'אינו'} ${Y.s}.` : `למשל: ${COUNTER[x + y]}.` };
  }
  // עץ המשפחה
  function familyTree() {
    const box = (x, y, t, on) => S.rect(x - 44, y - 16, 88, 32, { rx: 10, cls: on ? 'f-l s-a' : 'f-w s-soft', sw: 2.5 }) + S.text(x, y + 1, t, { fs: 15, fw: 800, cls: on ? 't-a' : 't-mute' });
    const ln = (x1, y1, x2, y2, dash) => S.line(x1, y1, x2, y2, { cls: dash ? 's-soft' : 's-a', sw: 2.5, dash: dash ? '5 5' : null });
    let s = ln(170, 36, 100, 84, true) + ln(170, 36, 240, 84) + ln(240, 100, 175, 148) + ln(240, 100, 305, 148) + ln(175, 164, 240, 212) + ln(305, 164, 240, 212);
    s += box(170, 22, 'מרובע', false) + box(100, 100, 'טרפז', false) + box(240, 100, 'מקבילית', true) + box(175, 164, 'מלבן', true) + box(305, 164, 'מעוין', true) + box(240, 226, 'ריבוע', true);
    return S.svg(354, 248, s, { cls: 'vz-geo', label: 'עץ המשפחה של המרובעים', maxw: 340 });
  }
  const PROPS = [
    ['שני זוגות של צלעות מקבילות', 0], ['צלעות נגדיות שוות', 0], ['זוויות נגדיות שוות', 0],
    ['כל הזוויות ישרות', 1], ['כל הצלעות שוות', 2], ['כל הצלעות שוות וגם כל הזוויות ישרות', 3],
  ];
  const PROP_CH = ['מקבילית, מלבן, מעוין וריבוע', 'רק מלבן וריבוע', 'רק מעוין וריבוע', 'רק ריבוע'];
  const COLLECT = [
    { tags: ['squishy'], n: 'סקווישים שטוחים' }, { tags: ['kpop'], n: 'פוטוקארדים' }, { tags: ['magic'], n: 'קלפי לחשים' },
    { tags: ['baking'], n: 'עוגיות' }, { tags: ['art'], n: 'מדבקות' }, { tags: ['games'], n: 'אריחים למשחק' },
    { tags: ['sport'], n: 'דגלונים של קבוצות' }, { tags: ['animals'], n: 'מגנטים של בעלי חיים' }, { tags: ['space'], n: 'חלונות לדגם של חללית' },
    { tags: ['music'], n: 'כרטיסים להופעה' }, { tags: ['nature'], n: 'אבנים לשביל בגינה' }, { tags: ['reading'], n: 'סימניות' },
    { tags: ['tech'], n: 'חלקים לבניית רובוט' },
  ];
  const RIDDLE_OBJ = [
    { tags: ['sport'], v: ['עיצב', 'עיצבה'], o: 'דגל לקבוצה' }, { tags: ['animals'], v: ['הכין', 'הכינה'], o: 'שלט לכלוב של הארנב' },
    { tags: ['space'], v: ['עיצב', 'עיצבה'], o: 'חלון לחללית' }, { tags: ['music'], v: ['עיצב', 'עיצבה'], o: 'כרטיס להופעה' },
    { tags: ['baking'], v: ['אפה', 'אפתה'], o: 'עוגייה' }, { tags: ['games'], v: ['בנה', 'בנתה'], o: 'אריח במשחק' },
    { tags: ['art'], v: ['הכין', 'הכינה'], o: 'מסגרת לציור' }, { tags: ['nature'], v: ['מצא', 'מצאה'], o: 'אבן שטוחה בטיול' },
    { tags: ['reading'], v: ['גזר', 'גזרה'], o: 'סימנייה' }, { tags: ['tech'], v: ['בנה', 'בנתה'], o: 'מסך לרובוט' },
    { tags: ['kpop'], v: ['קנה', 'קנתה'], o: 'פוטוקארד' }, { tags: ['magic'], v: ['מצא', 'מצאה'], o: 'ספר לחשים' },
    { tags: ['squishy'], v: ['קנה', 'קנתה'], o: 'סקוויש שטוח' },
  ];
  const RIDDLES = [
    ['במרובע יש 4 זוויות ישרות ו-4 צלעות שוות', 0, 'כל הזוויות ישרות וכל הצלעות שוות — ריבוע.', 1],
    ['כל 4 הצלעות של המרובע שוות, אבל אין בו זוויות ישרות', 2, 'כל הצלעות שוות — מעוין. אין זוויות ישרות, ולכן זה לא ריבוע.', 1],
    ['במרובע יש 4 זוויות ישרות, ויש בו צלע ארוכה וצלע קצרה', 1, 'כל הזוויות ישרות — מלבן. הצלעות לא כולן שוות, ולכן זה לא ריבוע.', 1],
    ['במרובע יש רק זוג אחד של צלעות מקבילות', 4, 'מרובע עם זוג אחד בלבד של צלעות מקבילות הוא טרפז.', 1],
    ['במרובע יש שני זוגות של צלעות מקבילות, אין בו זוויות ישרות, והצלעות הסמוכות בו אינן שוות', 3, 'שני זוגות של צלעות מקבילות — מקבילית. אין זוויות ישרות ואין צלעות סמוכות שוות, אז היא לא מלבן ולא מעוין.', 2],
    ['המרובע הוא מקבילית שיש בה זווית ישרה ושתי צלעות סמוכות שוות', 0, 'מקבילית עם זווית ישרה היא מלבן, ומלבן עם צלעות סמוכות שוות הוא ריבוע.', 2],
    ['המרובע הוא גם מלבן וגם מעוין', 0, 'הצורה היחידה שהיא גם מלבן וגם מעוין היא הריבוע.', 2],
    ['המרובע הוא מקבילית שיש בה זווית ישרה, אבל הצלעות הסמוכות בה אינן שוות', 1, 'מקבילית עם זווית ישרה היא מלבן. הצלעות הסמוכות לא שוות, ולכן זה לא ריבוע.', 2],
  ];
  const FAM_NAMES = ['ריבוע', 'מלבן', 'מעוין', 'מקבילית', 'טרפז'];

  HM.lesson({
    id: 'g-family',
    learn: (c) => [
      {
        title: 'עץ המשפחה של המרובעים',
        html: `${c.name}, למרובעים יש משפחה! בראש העץ — ${b('המרובע')}. מתחתיו — ${b('המקבילית')}. למקבילית יש שני "ילדים": ${b('המלבן')} ו${b('המעוין')}.<br>והריבוע? הוא ${b('גם מלבן וגם מעוין')}, ולכן הוא מתחת לשניהם.`,
        visual: familyTree(),
      },
      {
        title: 'מה כל אחד מוסיף?',
        html: `כל צורה ${b('מקבלת')} את כל התכונות של הצורה שמעליה בעץ ומוסיפה תכונה משלה:<br>• ${b('מקבילית')}: מרובע עם שני זוגות של צלעות מקבילות.<br>• ${b('מלבן')}: מקבילית + זווית ישרה.<br>• ${b('מעוין')}: מקבילית + שתי צלעות סמוכות שוות.<br>• ${b('ריבוע')}: גם מלבן וגם מעוין.`,
        visual: row(draw(shape('par', c), { arrows: true, maxw: 120 }), draw(shape('rect', c), { right: true, maxw: 110 }), draw(shape('rhombus', c), { ticks: true, maxw: 120 }), draw(shape('square', c), { ticks: true, right: true, maxw: 80 })),
      },
      {
        title: 'טבלת התכונות',
        html: `מה מתקיים ${b('תמיד')} בכל צורה? (✔ — תמיד, ✘ — לא תמיד)`,
        visual: V.table(['תכונה', 'מקבילית', 'מלבן', 'מעוין', 'ריבוע'], [
          ['צלעות נגדיות מקבילות', '✔', '✔', '✔', '✔'], ['צלעות נגדיות שוות', '✔', '✔', '✔', '✔'], ['זוויות נגדיות שוות', '✔', '✔', '✔', '✔'],
          ['כל הזוויות ישרות', '✘', '✔', '✘', '✔'], ['כל הצלעות שוות', '✘', '✘', '✔', '✔'],
        ], { rowHead: true }),
      },
      {
        title: '"כל" או "יש"?',
        html: `"${b('כל')} ריבוע הוא מלבן" — נכון: לכל ריבוע יש 4 זוויות ישרות.<br>"כל מלבן הוא ריבוע" — לא נכון! כדי להראות את זה מספיקה ${b('דוגמה נגדית')} אחת.<br>"${b('יש')} מלבנים שהם ריבועים" — נכון.<br>האם כל מעוין הוא מלבן?`,
        visual: draw(shape('rhombus', c, { deg: 60 }), { ticks: true, maxw: 200, arcs: [{ i: 0, label: '60°', fill: 'f-a' }, { i: 1, label: '120°', cls: 's-b', fill: 'f-b' }] }),
        steps: [`כדי להיות מלבן, צריך שכל הזוויות יהיו ישרות.`, `למעוין שבציור יש זוויות של ${dg(60)} ושל ${dg(120)} — הן לא ישרות.`, 'מצאנו מעוין שאינו מלבן — דוגמה נגדית. לכן "כל מעוין הוא מלבן" לא נכון.'],
      },
      {
        title: 'מחוץ למשפחה',
        html: `לא כל מרובע הוא מקבילית.<br>• ${b('טרפז')} — יש בו רק זוג אחד של צלעות מקבילות.<br>• ${b('דלתון')} — יש בו שני זוגות של צלעות סמוכות שוות. לדלתון שבציור אין צלעות מקבילות, ולכן הוא אינו מקבילית.`,
        visual: row(capt(draw(shape('trap', c), { arrows: true, maxw: 160 }), 'טרפז'), capt(draw(shape('kite', c), { ticks: true, maxw: 120 }), 'דלתון')),
        quiz: {
          type: 'tf', prompt: 'כל ריבוע הוא מקבילית.', answer: true,
          hint: 'האם בריבוע יש שני זוגות של צלעות מקבילות?',
          solution: ['בריבוע כל צלע מקבילה לצלע שמולה — שני זוגות.', 'לכן כל ריבוע הוא מקבילית.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: riddle, countShapes, whoRight, claim
      const kinds = level === 1 ? ['riddle', 'isFam', 'countShapes', 'odd', 'isFam']
        : level === 2 ? ['table', 'order', 'rel', 'riddle', 'both', 'countShapes', 'riddle']
        : ['claim', 'countShapes', 'whoRight', 'table', 'rel', 'order', 'table'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'riddle': {
          const pool = RIDDLES.filter((r) => (level === 1 ? r[3] === 1 : true));
          const r = c.pick(pool), sc = c.scene(RIDDLE_OBJ);
          return {
            type: 'choice', keep: true,
            prompt: `${who.name} ${who.g(sc.v[0], sc.v[1])} ${sc.o} בצורת מרובע. ${r[0]}. מה השם המדויק ביותר של הצורה?`,
            choices: FAM_NAMES, answer: r[1],
            hint: `${c.g('עבור', 'עברי')} על התכונות אחת אחת: צלעות מקבילות? זוויות ישרות? צלעות שוות?`,
            solution: [r[2]],
          };
        }
        case 'isFam':
        case 'rel':
        case 'claim': {
          const st = relStatement(c, kind === 'isFam' ? 1 : 2);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st.t}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st.t}.`, answer: st.a,
            hint: `${c.g('היעזר', 'היעזרי')} בעץ המשפחה: מה שנמצא ${b('מתחת')} לצורה בעץ הוא מקרה מיוחד שלה. ואם הטענה לא נכונה — ${c.g('חפש', 'חפשי')} דוגמה נגדית.`,
            solution: [st.why, `לכן הטענה ${st.a ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
        case 'table': {
          const pr = level === 3 ? c.pick(PROPS.slice(3).concat([PROPS[1]])) : c.pick(PROPS.slice(0, 5));
          return {
            type: 'choice', keep: true, prompt: `לאילו צורות במשפחת המקביליות יש ${b('תמיד')} את התכונה: "${pr[0]}"?`,
            choices: PROP_CH, answer: pr[1],
            hint: `${c.g('היזכר', 'היזכרי')} בטבלת התכונות. תכונה של המקבילית עוברת לכל המשפחה. מלבן מוסיף זוויות ישרות, ומעוין מוסיף צלעות שוות.`,
            solution: [['זו תכונה של כל מקבילית — ולכן גם של המלבן, המעוין והריבוע.', 'כל הזוויות ישרות רק במלבן ובריבוע (הריבוע הוא מלבן מיוחד).', 'כל הצלעות שוות רק במעוין ובריבוע (הריבוע הוא מעוין מיוחד).', 'גם צלעות שוות וגם זוויות ישרות — רק בריבוע.'][pr[1]]],
          };
        }
        case 'order': {
          const chain = c.pick([['מרובע', 'מקבילית', 'מלבן', 'ריבוע'], ['מרובע', 'מקבילית', 'מעוין', 'ריבוע']]);
          const items = c.shuffle(chain);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את השמות ${b('מהכללי ביותר למיוחד ביותר')} (כל שם הוא מקרה מיוחד של השם שלפניו):`,
            items, answer: chain.map((x) => items.indexOf(x)),
            hint: 'הכללי ביותר הוא זה שכולל את כל האחרים. ' + c.g('שאל', 'שאלי') + ': מי מהם הוא סוג של מי?',
            solution: [chain.join(' ← '), `כל ${chain[3]} הוא ${chain[2]}, כל ${chain[2]} הוא ${chain[1] === 'מקבילית' ? 'מקבילית' : chain[1]}, וכל מקבילית היא מרובע.`],
          };
        }
        case 'odd': {
          const ks = ['trap', 'rect', 'rhombus', 'par'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: rndRot(c) }), { arrows: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: `איזה מרובע ${b('אינו')} חלק ממשפחת המקביליות? (החצים מסמנים צלעות מקבילות)`, choices, answer: 0,
            hint: 'במשפחת המקביליות יש לכל צורה שני זוגות של צלעות מקבילות.',
            solution: ['למלבן, למעוין ולמקבילית יש שני זוגות של צלעות מקבילות.', 'לטרפז יש רק זוג אחד — הוא לא במשפחה.'],
          };
        }
        case 'both': {
          const ks = ['square', 'rect', 'rhombus', 'par'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: k === 'square' ? c.pick([45, 30, -30]) : rndRot(c) }), { ticks: true, right: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: `איזו צורה היא ${b('גם מלבן וגם מעוין')}?`, choices, answer: 0,
            hint: 'מלבן — כל הזוויות ישרות. מעוין — כל הצלעות שוות. איזו צורה מקיימת את שני התנאים?',
            solution: ['בצורה הנכונה כל הזוויות ישרות וגם כל הצלעות שוות — זה ריבוע, גם כשהוא מסובב.'],
          };
        }
        case 'countShapes': {
          const sc = c.scene(COLLECT);
          const target = level === 1 ? c.pick(['R', 'H']) : c.pick(level === 2 ? ['R', 'H', 'P'] : ['P', 'R', 'H']);
          let pool = level === 1 ? ['rect', 'rhombus', 'par', 'trap', 'kite'] : ['square', 'rect', 'rhombus', 'par', 'trap', 'kite'];
          let set = c.sample(pool.concat(c.sample(pool, 2)), 6);
          if (level > 1 && set.indexOf('square') < 0) set[c.rnd(0, 5)] = 'square';
          if (!set.some((k) => MEMBER[k].indexOf(target) >= 0)) set[c.rnd(0, 5)] = target === 'R' ? 'rect' : target === 'H' ? 'rhombus' : 'par';
          const n = set.filter((k) => MEMBER[k].indexOf(target) >= 0).length;
          const vis = row(...set.map((k) => draw(shape(k, c, { rot: rndRot(c) }), { ticks: true, right: true, arrows: k === 'trap' || k === 'par', maxw: 78, pad: 14 })));
          const nm = { R: 'מלבנים', H: 'מעוינים', P: 'מקביליות' }[target];
          const sq = set.filter((k) => k === 'square').length;
          return {
            type: 'number', answer: n,
            prompt: `${who.name} ${who.g('סידר', 'סידרה')} על השולחן ${sc.n} בצורות שבציור. כמה מהצורות הן ${b(nm)}?`,
            visual: vis,
            hint: `${c.g('היעזר', 'היעזרי')} בסימונים: קווים קטנים — צלעות שוות, ריבוע קטן — זווית ישרה, חצים — צלעות מקבילות. ${level > 1 ? c.g('זכור', 'זכרי') + ' שגם ריבוע הוא ' + (target === 'P' ? 'מקבילית' : target === 'R' ? 'מלבן' : 'מעוין') + '!' : ''}`,
            solution: [target === 'P' ? 'מקביליות הן: מקבילית, מלבן, מעוין וריבוע — לא טרפז ולא דלתון.' : target === 'R' ? 'מלבנים הם: מלבן וגם ריבוע.' : 'מעוינים הם: מעוין וגם ריבוע.', `${sq ? `בציור יש ${HM.cnt(sq, 'ריבוע', 'ריבועים')}, וגם ${sq === 1 ? 'הוא נספר' : 'הם נספרים'}. ` : ''}בסך הכול: ${n}.`],
          };
        }
        case 'whoRight': {
          const k = c.pick(['square', 'rect', 'rhombus', 'par']);
          const f1 = c.friendM(), f2 = c.friendF();
          const names = ['ריבוע', 'מלבן', 'מעוין', 'מקבילית'], codes = ['S', 'R', 'H', 'P'];
          let i1 = c.rnd(0, 3), i2 = c.rnd(0, 3); while (i2 === i1) i2 = c.rnd(0, 3);
          const t1 = MEMBER[k].indexOf(codes[i1]) >= 0, t2 = MEMBER[k].indexOf(codes[i2]) >= 0;
          const ans = t1 && t2 ? 2 : t1 ? 0 : t2 ? 1 : 3;
          const ok = (t, nm) => `${t ? 'צודק' : 'לא צודק'}: הצורה ${t ? 'היא' : 'אינה'} ${nm}.`;
          return {
            type: 'choice', keep: true,
            prompt: `${f1.name} אומר: "הצורה שבציור היא ${names[i1]}". ${f2.name} אומרת: "הצורה שבציור היא ${names[i2]}". מי צודק?`,
            visual: draw(shape(k, c, { rot: rndRot(c) }), { ticks: true, right: true, arrows: true, maxw: 190 }),
            choices: [`רק ${f1.name}`, `רק ${f2.name}`, 'שניהם צודקים', 'אף אחד מהם'], answer: ans,
            hint: `${c.g('זהה', 'זהי')} את הצורה לפי הסימונים, ואז ${c.g('בדוק', 'בדקי')} כל טענה בנפרד. ${c.g('זכור', 'זכרי')}: לצורה יכולים להיות כמה שמות נכונים!`,
            solution: [`הצורה היא ${NAMES[k].s}.`, `${f1.name} ${ok(t1, names[i1])}`, `${f2.name} ${ok(t2, names[i2]).replace('לא צודק', 'לא צודקת').replace(/^צודק/, 'צודקת')}`],
          };
        }
      }
    },
  });

  /* ================= אלכסונים וסימטריה שיקופית ================= */
  // שיקוף נקודה בישר AB
  const reflect = (P, A, B) => { const d = unit(sub(B, A)), v = sub(P, A), t = v[0] * d[0] + v[1] * d[1], F = add(A, mul(d, t)); return sub(mul(F, 2), P); };
  const MIR_N = { square: 4, rect: 2, rhombus: 2, kite: 1, trap: 1, par: 0 };
  const SHAPE_NAME = { square: 'ריבוע', rect: 'מלבן', rhombus: 'מעוין', kite: 'דלתון', trap: 'טרפז שווה-שוקיים', par: 'מקבילית' };
  const DEF = { square: 'הריבוע', rect: 'המלבן', rhombus: 'המעוין', kite: 'הדלתון', trap: 'הטרפז שווה-השוקיים', par: 'המקבילית' };
  // צורה עם קו מקווקו: kind + סוג הקו. מחזיר {svg, ok}
  function withLine(c, kind, lineType, o) {
    o = o || {};
    const sh = shape(kind, c, { rot: o.rot != null ? o.rot : rndRot(c), deg: kind === 'rhombus' ? c.pick([55, 60, 65]) : null }), P = sh.pts;
    let L;
    if (lineType === 'mirror') L = c.pick(sh.mirrors);
    else if (lineType === 'diag') L = c.pick([[P[0], P[2]], [P[1], P[3]]]);
    else if (lineType === 'mid') L = c.pick([[mid(P[0], P[1]), mid(P[2], P[3])], [mid(P[1], P[2]), mid(P[3], P[0])]]);
    else { const lerp = (p, q, t) => add(mul(p, 1 - t), mul(q, t)); L = kind === 'kite' ? [lerp(P[0], P[1], 0.35), lerp(P[2], P[1], 0.35)] : [lerp(P[0], P[1], 0.3), lerp(P[3], P[2], 0.3)]; } // קו מקביל לקו סימטריה, אבל לא באמצע
    const ok = sh.mirrors.some((mm) => (lineAng(sub(mm[1], mm[0]), sub(L[1], L[0])) < 0.5 && Math.abs(cross(sub(L[0], mm[0]), unit(sub(mm[1], mm[0])))) < 0.5));
    const ghost = o.ghost ? S.poly(P.map((p) => reflect(p, L[0], L[1])), { fill: 'none', cls: 's-c', sw: 2, dash: '4 4' }) : '';
    return { svg: draw(sh, { mirrors: [L], ticks: o.marks, right: o.marks, maxw: o.maxw || 200, extra: ghost }), ok };
  }

  HM.lesson({
    id: 'g-diag-mirror',
    learn: (c) => [
      {
        title: 'קו סימטריה',
        html: `${c.name}, ${c.g('קפל', 'קפלי')} דף לאורך קו. אם שני החצאים נופלים זה על זה ${b('בדיוק')} — הקו הוא ${b('קו סימטריה')}.<br>לצורה כזאת יש ${b('סימטריה שיקופית')}: כל חצי הוא כמו השתקפות במראה של החצי השני — כמו כנפיים של פרפר.`,
        visual: draw(shape('kite', c), { mirrors: true, ticks: true, maxw: 170 }),
      },
      {
        title: 'מלבן וריבוע',
        html: `ל${b('מלבן')} יש ${b('2 קווי סימטריה')}: הקווים שעוברים באמצע הצלעות הנגדיות.<br>ל${b('ריבוע')} יש ${b('4 קווי סימטריה')}: שני הקווים האלה, וגם שני האלכסונים.`,
        visual: row(capt(draw(shape('rect', c), { mirrors: true, maxw: 160 }), '2 קווים'), capt(draw(shape('square', c), { mirrors: true, maxw: 120 }), '4 קווים')),
      },
      {
        title: 'האלכסון של המלבן — לא קו סימטריה!',
        html: `טעות נפוצה: לחשוב שהאלכסון של המלבן הוא קו סימטריה. אם מקפלים מלבן לאורך האלכסון, החצאים ${b('לא')} נופלים זה על זה — המסגרת המקווקוות הדקה מראה איפה החצי המקופל נוחת.<br>במעוין, לעומת זאת, ${b('האלכסונים הם קווי הסימטריה')} — 2 קווים.`,
        visual: row(draw({ pts: V.shapes.rect(180, 100) }, { mirrors: [[[0, 0], [180, 100]]], extra: S.poly(V.shapes.rect(180, 100).map((p) => reflect(p, [0, 0], [180, 100])), { fill: 'none', cls: 's-c', sw: 2, dash: '4 4' }), maxw: 170 }), capt(draw(shape('rhombus', c, { deg: 60 }), { mirrors: true, maxw: 160 }), 'מעוין: 2 קווים')),
      },
      {
        title: 'דלתון, טרפז ומקבילית',
        html: `• ל${b('דלתון')} יש קו סימטריה ${b('אחד')} — האלכסון הראשי.<br>• ל${b('טרפז שווה-שוקיים')} יש קו סימטריה ${b('אחד')} — דרך האמצע של שני הבסיסים.<br>• ל${b('מקבילית')} (שאינה מלבן או מעוין) ${b('אין')} קווי סימטריה בכלל: בכל קיפול, החצאים לא נופלים זה על זה.`,
        visual: row(draw(shape('kite', c), { mirrors: true, maxw: 100 }), draw(shape('trap', c), { mirrors: true, maxw: 140 }), draw({ pts: parPts(160, 90, 60) }, { mirrors: [[mid(parPts(160, 90, 60)[0], parPts(160, 90, 60)[1]), mid(parPts(160, 90, 60)[2], parPts(160, 90, 60)[3])]], extra: S.poly(parPts(160, 90, 60).map((p) => reflect(p, mid(parPts(160, 90, 60)[0], parPts(160, 90, 60)[1]), mid(parPts(160, 90, 60)[2], parPts(160, 90, 60)[3]))), { fill: 'none', cls: 's-c', sw: 2, dash: '4 4' }), maxw: 150 })),
      },
      {
        title: 'האלכסונים במעוין ובריבוע',
        html: `במעוין ובריבוע האלכסונים הם קווי סימטריה, ולכן:<br>• הם ${b('מאונכים')} זה לזה (זווית ישרה במפגש).<br>• הם ${b('חוצים זה את זה')} — כל אלכסון נחתך לשני חלקים שווים.<br>• הם ${b('חוצים את הזוויות')} — כל זווית מתחלקת לשני חלקים שווים.<br>בריבוע, האלכסונים גם ${b('שווים')} זה לזה.`,
        visual: (() => { const P = rhomPts(130, 60), O = mul(add(P[0], P[2]), 0.5); return V.polygon(P, { labels: L4, diags: true, maxw: 240, extra: rightMark(O, sub(P[1], O), sub(P[2], O), 11, 's-a') + ticks(P[0], O, 1) + ticks(O, P[2], 1) + ticks(P[1], O, 2) + ticks(O, P[3], 2) }); })(),
      },
      {
        title: 'דוגמה פתורה',
        html: `במעוין אבגד, זווית א היא ${dg(70)}. מסרטטים את האלכסון אג. מה גודל הזווית בין האלכסון אג לצלע אב?`,
        visual: (() => { const P = rhomPts(130, 70); const A = P[0]; return V.polygon(P, { labels: L4, diags: [[0, 2]], maxw: 220, extra: arc(A, sub(P[3], A), sub(P[1], A), 30, { label: '70°', fill: 'f-a', off: 20, lrot: -28 }) }); })(),
        steps: ['האלכסון אג הוא קו סימטריה של המעוין.', 'לכן הוא חוצה את זווית א לשני חלקים שווים.', `${m('70° : 2 = 35°')} — הזווית בין האלכסון לצלע אב היא ${dg(35)}.`],
        quiz: {
          type: 'number', unit: '°', prompt: 'בריבוע מסרטטים אלכסון. מה גודל הזווית בין האלכסון לצלע?', answer: 45,
          hint: 'האלכסון של הריבוע חוצה את הזווית הישרה לשני חלקים שווים.',
          solution: [m('90° : 2 = 45°')],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: fold, foldCount, foldAngle, claim
      const kinds = level === 1 ? ['count', 'isMirror', 'fold', 'count', 'fold']
        : level === 2 ? ['pickMirror', 'count', 'diagProps', 'angleHalf', 'foldCount', 'tf', 'fold', 'foldCount']
        : ['order', 'claim', 'angleHalf3', 'complete', 'pickMirror', 'diagProps', 'foldAngle', 'claim'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      const FOLD = [
        { tags: ['art'], o: 'דף נייר צבעוני' }, { tags: ['reading'], o: 'סימנייה', f: true }, { tags: ['kpop'], o: 'פוסטר של הלהקה' },
        { tags: ['magic'], o: 'מפה של בית הספר לקוסמים', f: true }, { tags: ['baking'], o: 'מפית', f: true }, { tags: ['music'], o: 'כרטיס להופעה' },
        { tags: ['games'], o: 'קלף משחק' }, { tags: ['sport'], o: 'דגל של הקבוצה' }, { tags: ['nature'], o: 'מפת טיולים', f: true },
        { tags: ['space'], o: 'מפת כוכבים', f: true }, { tags: ['animals'], o: 'כרטיס עם ציור של פרפר' }, { tags: ['tech'], o: 'שרטוט של רובוט' },
        { tags: ['squishy'], o: 'חתיכת קרטון מאריזה של סקוויש', f: true },
      ];
      switch (kind) {
        case 'count': {
          const k = level === 1 ? c.pick(['square', 'rect', 'kite', 'trap', 'rhombus']) : c.pick(['square', 'rect', 'kite', 'trap', 'rhombus', 'par', 'par']);
          const named = level === 1;
          return {
            type: 'number', answer: MIR_N[k],
            prompt: named ? `כמה קווי סימטריה יש ל${SHAPE_NAME[k]}?` : 'כמה קווי סימטריה יש למרובע שבציור? (הסימונים מראים צלעות שוות וזוויות ישרות)',
            visual: draw(shape(k, c, { rot: named ? 0 : rndRot(c) }), { ticks: true, right: true, arrows: k === 'trap' || k === 'par', maxw: 190 }),
            hint: `${c.g('דמיין', 'דמייני')} שגוזרים את הצורה ומקפלים אותה. לאורך אילו קווים שני החצאים ייפלו זה על זה בדיוק? ${c.g('בדוק', 'בדקי')} גם את האלכסונים וגם את הקווים שעוברים באמצע הצלעות.`,
            solution: [{ square: 'לריבוע 4 קווי סימטריה: 2 אלכסונים ו-2 קווים דרך אמצעי הצלעות.', rect: 'למלבן 2 קווי סימטריה — דרך אמצעי הצלעות הנגדיות. האלכסונים אינם קווי סימטריה.', rhombus: 'למעוין 2 קווי סימטריה — שני האלכסונים.', kite: 'לדלתון קו סימטריה אחד — האלכסון שעובר בין הצלעות השוות.', trap: 'לטרפז שווה-שוקיים קו סימטריה אחד — דרך האמצע של שני הבסיסים.', par: 'למקבילית (שאינה מלבן או מעוין) אין אף קו סימטריה.' }[k], `התשובה: ${MIR_N[k]}.`],
          };
        }
        case 'isMirror':
        case 'fold': {
          const opts = level === 1 ? [['rect', 'mirror'], ['square', 'mirror'], ['kite', 'mirror'], ['rhombus', 'mirror'], ['rect', 'off'], ['square', 'off'], ['kite', 'off']]
            : [['rect', 'diag'], ['par', 'diag'], ['par', 'mid'], ['rhombus', 'mid'], ['rect', 'mirror'], ['rhombus', 'mirror'], ['trap', 'mirror'], ['kite', 'mirror']];
          const [k, lt] = c.pick(opts);
          const w = withLine(c, k, lt, { marks: true });
          const sc = c.scene(FOLD);
          return {
            type: 'tf', visual: w.svg, answer: w.ok,
            prompt: kind === 'fold' ? `${who.name} ${who.g('גזר', 'גזרה')} ${sc.o} בצורת ${SHAPE_NAME[k]}, כמו בציור, ${who.g('ורוצה', 'ורוצה')} לקפל ${sc.f ? 'אותה' : 'אותו'} לאורך הקו המקווקו. הטענה: "שני החצאים ייפלו זה על זה בדיוק".` : `הקו המקווקו הוא קו סימטריה של ${DEF[k]}.`,
            hint: `${c.g('דמיין', 'דמייני')} שמקפלים לאורך הקו: האם כל קודקוד נוחת בדיוק על קודקוד בצד השני?`,
            solution: w.ok ? ['בקיפול לאורך הקו, כל חצי נופל בדיוק על החצי השני.', 'לכן זה קו סימטריה — הטענה נכונה.'] : [{ diag: 'בקיפול לאורך האלכסון, הקודקודים לא נוחתים זה על זה — החצי המקופל "בורח" החוצה.', mid: 'בקיפול לאורך הקו הזה, הצלעות הנטויות לא נופלות זו על זו.', off: 'הקו לא עובר באמצע הצורה — חצי אחד גדול מהשני.' }[lt], 'לכן זה לא קו סימטריה — הטענה לא נכונה.'],
          };
        }
        case 'pickMirror': {
          const good = c.pick([['rect', 'mirror'], ['rhombus', 'mirror'], ['trap', 'mirror'], ['square', 'diag']]);
          const bads = c.sample([['rect', 'diag'], ['par', 'diag'], ['par', 'mid'], ['rhombus', 'mid']], 3);
          const choices = [good].concat(bads).map(([k, lt]) => withLine(c, k, lt, { maxw: 150 }).svg);
          return {
            type: 'choice', cols: 2, prompt: 'באיזה ציור הקו המקווקו הוא קו סימטריה של הצורה?', choices, answer: 0,
            hint: `${c.g('דמיין', 'דמייני')} קיפול לאורך הקו בכל ציור. ${c.g('זכור', 'זכרי')}: האלכסון של מלבן אינו קו סימטריה, ולמקבילית אין קווי סימטריה בכלל.`,
            solution: ['בציור הנכון, כל חצי הוא השתקפות של החצי השני.', 'האלכסון של המלבן, הקווים במקבילית, והקו דרך אמצעי הצלעות במעוין — אינם קווי סימטריה.'],
          };
        }
        case 'diagProps': {
          const base = ['מלבן שאינו ריבוע', 'מקבילית', 'טרפז שווה-שוקיים'];
          const SOL_R = 'במעוין האלכסונים הם קווי סימטריה: הם מאונכים זה לזה וחוצים את הזוויות. במלבן שאינו ריבוע, במקבילית ובטרפז זה לא קורה.';
          const v = level === 3 ? c.pick([
            ['שווים זה לזה וגם מאונכים זה לזה', 'ריבוע', ['מעוין שאינו ריבוע', 'מלבן שאינו ריבוע', 'מקבילית'], 'אלכסונים מאונכים — במעוין ובריבוע. אלכסונים שווים — במלבן ובריבוע. את שתי התכונות יחד יש רק לריבוע.'],
            ['הם קווי סימטריה, אבל אינם שווים זה לזה', 'מעוין שאינו ריבוע', ['ריבוע', 'מלבן שאינו ריבוע', 'מקבילית'], 'במעוין האלכסונים הם קווי סימטריה. בריבוע הם גם שווים, ובמעוין שאינו ריבוע — לא.'],
          ]) : c.pick([['הם קווי סימטריה של הצורה', 'מעוין', base, SOL_R], ['מאונכים זה לזה', 'מעוין', base, SOL_R], ['חוצים את הזוויות של הצורה', 'מעוין', base, SOL_R]]);
          return {
            type: 'choice', prompt: `באיזה מרובע ${b('שני')} האלכסונים ${v[0]}?`, choices: [v[1]].concat(v[2]), answer: 0,
            hint: 'במעוין (וגם בריבוע) האלכסונים הם קווי סימטריה — ולכן הם מאונכים וחוצים את הזוויות. בריבוע הם גם שווים.',
            solution: [v[3]],
          };
        }
        case 'angleHalf': {
          const sq = c.chance(0.25), x = sq ? 90 : c.pick([40, 50, 60, 70, 80, 100, 110, 120, 130, 140]);
          const P = rot(sq ? V.shapes.square(130) : rhomPts(130, x < 90 ? x : 180 - x), c.pick([0, 10, -10])), vi = sq ? 0 : x < 90 ? 0 : 1;
          const A = P[vi], prev = P[(vi + 3) % 4], next = P[(vi + 1) % 4], opp = P[(vi + 2) % 4];
          const lab = labelSet(c), nm = SHAPE_NAME[sq ? 'square' : 'rhombus'];
          const extra = arc(A, sub(prev, A), sub(next, A), 36, { label: sq ? '' : x + '°', fill: 'f-a', off: 20, lrot: -26 }) + arc(A, sub(next, A), sub(opp, A), 52, { label: '?', cls: 's-c', tcls: 't-c', off: 12 });
          return {
            type: 'number', unit: '°', answer: x / 2,
            prompt: sq ? `בריבוע שבציור מסורטט אלכסון. מה גודל הזווית בין האלכסון לצלע ${sideNm(lab[vi], lab[(vi + 1) % 4])}?` : `ב${nm} שבציור, ${angName(lab[vi])} היא ${dg(x)}. מה גודל הזווית בין האלכסון ${sideNm(lab[vi], lab[(vi + 2) % 4])} לצלע ${sideNm(lab[vi], lab[(vi + 1) % 4])}?`,
            visual: V.polygon(P, { labels: lab, diags: [[vi, (vi + 2) % 4]], extra, maxw: 220 }),
            hint: `האלכסון של ה${nm} הוא קו סימטריה, ולכן הוא חוצה את הזווית לשני חלקים שווים.`,
            solution: [`האלכסון חוצה את ${sq ? 'הזווית הישרה' : angName(lab[vi])}.`, m(`${x}° : 2 = ${x / 2}°`)],
          };
        }
        case 'angleHalf3':
        case 'foldAngle': {
          const x = c.pick([40, 50, 60, 70, 80]), y = 180 - x; // זווית א חדה, זווית ב קהה
          const half = y / 2;
          const sc = c.scene(FOLD);
          const P = rhomPts(130, x), lab = L4; // א בקודקוד 0 (חדה), ב בקודקוד 1 (קהה)
          return {
            type: 'number', unit: '°', answer: half,
            prompt: kind === 'foldAngle'
              ? `${who.name} ${who.g('גזר', 'גזרה')} ${sc.o} בצורת מעוין אבגד, שבו זווית א היא ${dg(x)}. ${who.g('הוא קיפל', 'היא קיפלה')} את המעוין לאורך האלכסון בד. מה גודל הזווית בין קו הקיפול לצלע אב?`
              : `במעוין אבגד, זווית א היא ${dg(x)}. מה גודל הזווית בין האלכסון בד לצלע אב?`,
            visual: kind === 'foldAngle' ? undefined : V.polygon(P, { labels: lab, diags: [[1, 3]], maxw: 220, extra: arc(P[0], sub(P[3], P[0]), sub(P[1], P[0]), 28, { label: x + '°', fill: 'f-a', off: 22 }) }),
            hint: `קודם ${c.g('מצא', 'מצאי')} את זווית ב (היא סמוכה לזווית א). האלכסון בד חוצה אותה.`,
            solution: [`זווית ב סמוכה לזווית א: ${m(`180° − ${x}° = ${y}°`)}.`, `האלכסון בד הוא קו סימטריה וחוצה את זווית ב: ${m(`${y}° : 2 = ${half}°`)}.`],
          };
        }
        case 'foldCount': {
          const sc = c.scene(FOLD), k = c.pick(['square', 'rect', 'rhombus', 'kite', 'trap', 'par']);
          return {
            type: 'number', answer: MIR_N[k],
            prompt: `${who.name} ${who.g('גזר', 'גזרה')} ${sc.o} בצורת ${SHAPE_NAME[k]}. בכמה דרכים שונות ${who.g('הוא יכול', 'היא יכולה')} לקפל ${sc.f ? 'אותה' : 'אותו'} לשני חצאים שנופלים זה על זה בדיוק?`,
            visual: draw(shape(k, c, { rot: rndRot(c) }), { ticks: true, right: true, maxw: 180 }),
            hint: 'כל דרך קיפול כזאת היא קו סימטריה. ' + c.g('ספור', 'ספרי') + ' את קווי הסימטריה של הצורה.',
            solution: [`ל${SHAPE_NAME[k]} יש ${MIR_N[k] === 0 ? 'אפס' : MIR_N[k] === 1 ? 'קו סימטריה אחד' : MIR_N[k] + ' קווי סימטריה'}${k === 'par' ? ' — בשום קיפול החצאים לא נופלים זה על זה' : ''}.`, `התשובה: ${MIR_N[k]}.`],
          };
        }
        case 'order': {
          const pick1 = c.pick(['kite', 'trap']), pick2 = c.pick(['rect', 'rhombus']);
          const ks = c.shuffle(['par', pick1, pick2, 'square']);
          const items = ks.map((k) => SHAPE_NAME[k]);
          const ans = ks.map((_, i) => i).sort((i, j) => MIR_N[ks[i]] - MIR_N[ks[j]]);
          return {
            type: 'order', prompt: `${c.g('סדר', 'סדרי')} את הצורות לפי מספר קווי הסימטריה, ${b('מהמעט ביותר לרב ביותר')}:`, items, answer: ans,
            hint: 'לאיזו צורה אין קווי סימטריה בכלל? ולאיזו יש הכי הרבה?',
            solution: [ans.map((i) => `${items[i]} (${MIR_N[ks[i]]})`).join(' ← ')],
          };
        }
        case 'complete': {
          // חצי צורה מימין לקו אנכי; אפשרויות להשלמה
          let half;
          for (let t = 0; t < 30; t++) {
            const h = c.rnd(4, 5), pts = [[0, 0]];
            for (let y = 1; y < h; y++) pts.push([c.rnd(1, 3), y]);
            pts.push([0, h]);
            if (pts.slice(1, -1).some((p, i, arr) => i > 0 && p[0] !== arr[i - 1][0])) { half = pts; break; }
          }
          if (!half) half = [[0, 0], [2, 1], [3, 2], [1, 3], [2, 4], [0, 5]];
          const H = half[half.length - 1][1], Wd = 4, ax = Wd;
          const mirX = (p) => [ax - p[0], p[1] + 1], given = (p) => [ax + p[0], p[1] + 1];
          const correct = half.map(mirX);
          const turned = half.map((p) => [ax - p[0], H - p[1] + 1]);
          const shifted = half.map((p) => [ax - p[0] + (p[1] === 0 || p[1] === H ? 0 : 1), p[1] + 1]);
          const copy = half.map((p) => [p[0], p[1] + 1]);
          const pic = (comp) => {
            let s = '';
            for (let x = 0; x <= 2 * Wd; x++) s += S.line(x * 24, 0, x * 24, (H + 2) * 24, { cls: 's-grid', sw: 1 });
            for (let y = 0; y <= H + 2; y++) s += S.line(0, y * 24, 2 * Wd * 24, y * 24, { cls: 's-grid', sw: 1 });
            s += S.line(ax * 24, 0, ax * 24, (H + 2) * 24, { cls: 's-c', sw: 3, dash: '8 5' });
            s += S.polyline(half.map(given).map((p) => [p[0] * 24, p[1] * 24]), { cls: 's-ink', sw: 3.5, 'stroke-linejoin': 'round' });
            s += S.polyline(comp.map((p) => [p[0] * 24, p[1] * 24]), { cls: 's-a', sw: 3.5, 'stroke-linejoin': 'round' });
            return S.svg(2 * Wd * 24, (H + 2) * 24, s, { cls: 'vz-geo', label: 'השלמה לצורה סימטרית', maxw: 150 });
          };
          const choices = [pic(correct), pic(turned), pic(shifted), pic(copy)].filter((x, i, arr) => arr.indexOf(x) === i);
          return {
            type: 'choice', cols: 2, prompt: `${c.g('השלם', 'השלימי')} את הצורה כך שהקו המקווקו יהיה קו סימטריה. באיזה ציור ההשלמה נכונה?`, choices, answer: 0,
            hint: 'כל נקודה בצד אחד צריכה להיות באותו גובה ובאותו מרחק מהקו — אבל בצד השני, כמו במראה.',
            solution: ['בהשלמה הנכונה, כל קודקוד נמצא באותו גובה ובאותו מספר משבצות מהקו המקווקו כמו בצד השני.', 'בשאר הציורים הצורה הועתקה, הפוכה או זזה.'],
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['האלכסונים של מלבן הם קווי סימטריה שלו', false, 'בקיפול מלבן לאורך האלכסון, החצאים לא נופלים זה על זה. קווי הסימטריה של המלבן עוברים דרך אמצעי הצלעות.'],
            ['למקבילית שאינה מלבן או מעוין אין קווי סימטריה', true, 'בשום קיפול של מקבילית כזו החצאים לא נופלים זה על זה.'],
            ['במעוין, האלכסונים מאונכים זה לזה', true, 'האלכסונים של המעוין הם קווי סימטריה, והם נפגשים בזווית ישרה.'],
            ['במעוין, האלכסונים תמיד שווים זה לזה', false, 'במעוין "נוטה" אלכסון אחד ארוך והשני קצר. רק בריבוע הם שווים.'],
            ['לדלתון יש 2 קווי סימטריה', false, 'לדלתון (שאינו מעוין) יש קו סימטריה אחד בלבד.'],
            ['לריבוע יש יותר קווי סימטריה מאשר למלבן שאינו ריבוע', true, 'לריבוע 4 קווי סימטריה, ולמלבן כזה 2.'],
            ['במעוין, כל אלכסון חוצה את הזוויות שהוא עובר דרכן', true, 'האלכסון הוא קו סימטריה, ולכן הוא מחלק כל זווית כזו לשני חלקים שווים.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: `${c.g('דמיין', 'דמייני')} שגוזרים את הצורה ומקפלים אותה. ${c.g('סרטט', 'סרטטי')} את האלכסונים ו${c.g('בדוק', 'בדקי')}.`,
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });

  /* ================= אלכסונים וסימטריה סיבובית ================= */
  const ROT_N = { square: 4, rect: 2, rhombus: 2, par: 2, kite: 1, trap: 1 };
  const ROT_CH = [dg(90), dg(180), dg(45), 'אין לה סימטריה סיבובית'];
  // שבשבת עם n כנפיים זהות (רק סימטריה סיבובית)
  function pinwheel(n, o) {
    o = o || {};
    const R = 90, C = [100, 100], step = 360 / n;
    const P = (a, r) => [C[0] + r * Math.cos((a - 90) * RAD), C[1] + r * Math.sin((a - 90) * RAD)];
    let s = '';
    for (let k = 0; k < n; k++) { const a = k * step; s += S.poly([C, P(a, R), P(a + step * 0.55, R * 0.5)], { cls: 'f-a s-ink', sw: 2, 'stroke-linejoin': 'round' }); }
    s += S.circle(C[0], C[1], 7, { cls: 'f-c s-ink', sw: 2 });
    return S.svg(200, 200, s, { cls: 'vz-geo', label: 'שבשבת', maxw: o.maxw || 160 });
  }
  // מקבילית/מלבן/מעוין עם אלכסונים ונקודת המפגש ה
  function diagFig(P, o) {
    o = o || {};
    const O = mul(add(P[0], P[2]), 0.5);
    let ex = S.circle(O[0], O[1], 4.5, { cls: 'f-ink' });
    const C0 = P.reduce((s2, p) => add(s2, mul(p, 0.25)), [0, 0]);
    const dO = unit(sub(mid(P[0], P[1]), C0));
    ex += S.text(O[0] + dO[0] * 18, O[1] + dO[1] * 18, 'ה', { fs: 17, fw: 800 });
    if (o.ticks) ex += ticks(P[0], O, 1) + ticks(O, P[2], 1) + ticks(P[1], O, 2) + ticks(O, P[3], 2);
    (o.segLabels || []).forEach(([i, t]) => { const M = mid(P[i], O), nn = unit([-(O[1] - P[i][1]), O[0] - P[i][0]]); ex += S.text(M[0] + nn[0] * 14, M[1] + nn[1] * 14, t, { fs: 14, fw: 800, cls: 't-c' }); });
    if (o.right) ex += rightMark(O, sub(P[1], O), sub(P[2], O), 11, 's-a');
    return V.polygon(P, { labels: o.labels || L4, diags: true, extra: ex, maxw: o.maxw || 240 });
  }
  const SPIN = [
    { tags: ['tech'], t: (w, n) => `למאוורר של ${w.name} יש ${n} כנפיים זהות` }, { tags: ['nature'], t: (w, n) => `${w.name} ${w.g('מצא', 'מצאה')} בטיול פרח עם ${n} עלי כותרת זהים` },
    { tags: ['space'], t: (w, n) => `ללוויין שבדגם של ${w.name} יש ${n} לוחות סולאריים זהים מסביב` }, { tags: ['sport'], t: (w, n) => `לגלגל האופניים של ${w.name} יש ${n} חישורים במרחקים שווים` },
    { tags: ['games'], t: (w, n) => `לספינר של ${w.name} יש ${n} כנפיים זהות` }, { tags: ['art'], t: (w, n) => `${w.name} ${w.g('צייר', 'ציירה')} מנדלה עם ${n} עלים זהים מסביב למרכז` },
    { tags: ['reading'], t: (w, n) => `בספר של ${w.name} יש ציור של פתית שלג עם ${n} זרועות זהות` }, { tags: ['kpop'], t: (w, n) => `בראש מקל האור של ${w.name} יש כוכב עם ${n} קרניים זהות` },
    { tags: ['magic'], t: (w, n) => `בקצה השרביט של ${w.name} יש כוכב קסם עם ${n} קרניים זהות` }, { tags: ['squishy'], t: (w, n) => `ל${w.name} יש סקוויש בצורת פרח עם ${n} עלי כותרת זהים` },
    { tags: ['baking'], t: (w, n) => `${w.name} ${w.g('קישט', 'קישטה')} עוגה עגולה ב-${n} תותים, במרחקים שווים מסביב למרכז` },
    { tags: ['music'], t: (w, n) => `על התוף של ${w.name} יש קישוט של כוכב עם ${n} קרניים זהות` }, { tags: ['animals'], t: (w, n) => `${w.name} ${w.g('ראה', 'ראתה')} בים כוכב ים עם ${n} זרועות זהות` },
  ];
  const fixedN = (sc, n) => (sc.tags[0] === 'animals' ? 5 : sc.tags[0] === 'sport' && n < 4 ? n * 3 : n);

  HM.lesson({
    id: 'g-diag-rot',
    learn: (c) => [
      {
        title: 'סימטריה סיבובית',
        html: `${c.name}, ${c.g('סובב', 'סובבי')} שבשבת: אחרי רבע סיבוב היא נראית ${b('בדיוק')} כמו בהתחלה!<br>לצורה יש ${b('סימטריה סיבובית')} אם אפשר לסובב אותה סביב המרכז שלה, ${b('בפחות מסיבוב שלם')}, כך שהיא תיראה בדיוק כמו בהתחלה.`,
        visual: pinwheel(4),
      },
      {
        title: 'הריבוע: רבע סיבוב',
        html: `ריבוע שמסובבים אותו ב-${dg(90)} (רבע סיבוב) סביב המרכז — נראה בדיוק אותו דבר.<br>במהלך סיבוב שלם הוא חוזר להיראות כמו בהתחלה ${b('4 פעמים')}: אחרי ${dg(90)}, ${dg(180)}, ${dg(270)} ו-${dg(360)}.<br>מלבן לעומתו צריך ${b('חצי סיבוב')} — ${dg(180)}.`,
        visual: row(draw(shape('square', c), { labels: true, maxw: 140 }), draw(shape('rect', c), { labels: true, maxw: 170 })),
      },
      {
        title: 'למקבילית יש סימטריה סיבובית',
        html: `למקבילית ${b('אין')} קו סימטריה — אבל ${b('יש לה סימטריה סיבובית')}!<br>אם מסובבים אותה ב-${dg(180)} סביב הנקודה שבה האלכסונים נפגשים, היא נופלת בדיוק על עצמה: קודקוד א מגיע למקום של קודקוד ג, וקודקוד ב — למקום של קודקוד ד.`,
        visual: diagFig(parPts(180, 100, 60), {}),
      },
      {
        title: 'האלכסונים במקבילית חוצים זה את זה',
        html: `בגלל חצי הסיבוב, נקודת המפגש ה היא ${b('האמצע של כל אחד מהאלכסונים')}: האלכסונים ${b('חוצים זה את זה')}.<br>כלומר: אה = הג, וגם בה = הד.`,
        visual: diagFig(parPts(180, 100, 60), { ticks: true }),
      },
      {
        title: 'האלכסונים בכל המשפחה',
        html: 'בכל המקביליות האלכסונים חוצים זה את זה. במלבן הם גם שווים, ובמעוין הם גם מאונכים:',
        visual: V.table(['האלכסונים...', 'מקבילית', 'מלבן', 'מעוין', 'ריבוע'], [
          ['חוצים זה את זה', '✔', '✔', '✔', '✔'], ['שווים זה לזה', '✘', '✔', '✘', '✔'], ['מאונכים זה לזה', '✘', '✘', '✔', '✔'],
        ], { rowHead: true }),
      },
      {
        title: 'דוגמה פתורה',
        html: `במקבילית אבגד האלכסונים נפגשים בנקודה ה. אה = 5 ס"מ, ובה = 3 ס"מ. מה אורך האלכסון אג, ומה אורך האלכסון בד?`,
        visual: diagFig(parPts(180, 100, 60), { segLabels: [[0, '5'], [1, '3']] }),
        steps: ['האלכסונים במקבילית חוצים זה את זה, ולכן ה היא האמצע של כל אלכסון.', `הג = אה = 5 ס"מ, ולכן האלכסון אג הוא ${m('5 + 5 = 10')} ס"מ.`, 'הד = בה = 3 ס"מ, ולכן האלכסון בד הוא 6 ס"מ.'],
        quiz: {
          type: 'tf', prompt: 'למקבילית (שאינה מלבן או מעוין) יש קו סימטריה.', answer: false,
          hint: 'מה קורה כשמקפלים מקבילית?',
          solution: ['למקבילית כזו אין קו סימטריה — רק סימטריה סיבובית של חצי סיבוב.'],
        },
      },
    ],
    gen: (c, level) => {
      // שאלות מילוליות: spin, spinDeg, diagStory, claim
      const kinds = level === 1 ? ['halfTurn', 'diagLen1', 'spin', 'minAngle', 'spin']
        : level === 2 ? ['minAngle', 'times', 'spinDeg', 'diagRect', 'propTable', 'tf', 'spinDeg', 'diagStory']
        : ['pickRot', 'claim', 'diagMulti', 'propTable', 'times', 'diagLen3', 'claim'];
      const kind = c.pick(kinds);
      const who = c.chance(0.5) ? c.me : c.friend();
      switch (kind) {
        case 'halfTurn': {
          const k = c.pick(['square', 'rect', 'rhombus', 'par', 'kite', 'trap']), quarter = c.chance(0.3);
          const ans = quarter ? k === 'square' : ROT_N[k] >= 2;
          return {
            type: 'tf', prompt: `אם מסובבים את ${DEF[k]} שבציור ב-${dg(quarter ? 90 : 180)} (${quarter ? 'רבע סיבוב' : 'חצי סיבוב'}) סביב המרכז ${k === 'par' ? 'שלה, היא נראית' : 'שלו, הוא נראה'} בדיוק כמו בהתחלה.`,
            visual: draw(shape(k, c), { ticks: true, right: true, maxw: 190 }), answer: ans,
            hint: `${c.g('דמיין', 'דמייני')} שהצורה מסתובבת. ${quarter ? 'ברבע סיבוב, צלע "שוכבת" הופכת ל"עומדת".' : 'בחצי סיבוב, החלק העליון מגיע למטה והחלק הימני — שמאלה.'} האם היא תיפול בדיוק על עצמה?`,
            solution: [ans ? `כן: ${quarter ? 'לריבוע כל הצלעות שוות וכל הזוויות ישרות, ולכן ברבע סיבוב הוא נופל על עצמו.' : 'בחצי סיבוב כל קודקוד מגיע למקום של הקודקוד שמולו, והצורה נופלת בדיוק על עצמה.'}` : `לא: ${quarter ? `${DEF[k]} ${k === 'par' ? 'צריכה' : 'צריך'} ${ROT_N[k] === 2 ? 'חצי סיבוב' : 'סיבוב שלם'} כדי לחזור להיראות אותו דבר.` : `${DEF[k]} ${k === 'kite' ? 'עומד על החוד הארוך' : 'עומד על הבסיס הארוך'} — אחרי חצי סיבוב הוא נראה הפוך.`}`, `לכן הטענה ${ans ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
        case 'minAngle': {
          const k = level === 1 ? c.pick(['square', 'rect', 'square', 'rect', 'kite']) : c.pick(['square', 'rect', 'rhombus', 'par', 'kite', 'trap']);
          const ans = ROT_N[k] === 4 ? 0 : ROT_N[k] === 2 ? 1 : 3;
          return {
            type: 'choice', keep: true, prompt: 'מה הסיבוב הקטן ביותר סביב המרכז, שאחריו הצורה נראית בדיוק כמו בהתחלה?',
            visual: draw(shape(k, c, { rot: level === 1 ? 0 : rndRot(c) }), { ticks: true, right: true, maxw: 190 }), choices: ROT_CH, answer: ans,
            hint: `${c.g('נסה', 'נסי')} קודם רבע סיבוב (${dg(90)}), ואחר כך חצי סיבוב (${dg(180)}). אם גם זה לא עובד — אין לה סימטריה סיבובית.`,
            solution: [{ 0: 'לריבוע מספיק רבע סיבוב — ' + dg(90) + '.', 1: `ל${SHAPE_NAME[k]} רבע סיבוב לא מספיק, אבל בחצי סיבוב (${dg(180)}) ${k === 'par' ? 'היא נופלת' : 'הוא נופל'} בדיוק על ${k === 'par' ? 'עצמה' : 'עצמו'}.`, 3: `${DEF[k]} חוזר להיראות אותו דבר רק אחרי סיבוב שלם — אין לו סימטריה סיבובית.` }[ans]],
          };
        }
        case 'times': {
          const v = c.pick(level === 3 ? [['square', 4], ['rect', 2], ['kite', 1], ['tri', 3], ['hex', 6], ['pent', 5]] : [['square', 4], ['rect', 2], ['rhombus', 2], ['par', 2], ['kite', 1]]);
          const vis = v[0] === 'tri' ? V.polygon(V.shapes.regular(3, 80), { ticks: [1, 1, 1], maxw: 170 }) : v[0] === 'hex' ? V.polygon(V.shapes.regular(6, 80), { ticks: [1, 1, 1, 1, 1, 1], maxw: 170 }) : v[0] === 'pent' ? V.polygon(V.shapes.regular(5, 80), { ticks: [1, 1, 1, 1, 1], maxw: 170 }) : draw(shape(v[0], c, { rot: rndRot(c) }), { ticks: true, right: true, maxw: 180 });
          return {
            type: 'number', answer: v[1],
            prompt: `מסובבים את הצורה סיבוב שלם סביב המרכז שלה. כמה פעמים במהלך הסיבוב היא נראית בדיוק כמו בהתחלה? (${c.g('ספור', 'ספרי')} גם את הפעם שבסוף הסיבוב)`,
            visual: vis,
            hint: `${c.g('חשוב', 'חשבי')} מה הסיבוב הקטן ביותר שמחזיר את הצורה לעצמה, וכמה סיבובים כאלה יש בסיבוב שלם (${dg(360)}).`,
            solution: [v[1] === 1 ? 'הצורה נראית כמו בהתחלה רק בסוף הסיבוב השלם.' : `הסיבוב הקטן ביותר: ${m(`360° : ${v[1]} = ${360 / v[1]}°`)}.`, `התשובה: ${v[1]}.`],
          };
        }
        case 'spin':
        case 'spinDeg': {
          const sc = c.scene(SPIN), n = fixedN(sc, kind === 'spin' ? c.pick([4, 8, 4]) : c.pick([3, 4, 5, 6, 8]));
          if (kind === 'spin') {
            const vals = [360 / n, 180, 90, 360, 45].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 4).sort((x, y) => x - y);
            return {
              type: 'choice', keep: true, prompt: `${sc.t(who, n)}. מסובבים את הצורה סביב המרכז שלה. מה הסיבוב הקטן ביותר שאחריו היא נראית בדיוק כמו בהתחלה?`,
              visual: pinwheel(n), choices: vals.map(dg), answer: vals.indexOf(360 / n),
              hint: `סיבוב שלם הוא ${dg(360)}. ${c.g('חלק', 'חלקי')} אותו ל-${n} חלקים שווים.`,
              solution: [m(`360° : ${n} = ${360 / n}°`), `אחרי ${dg(360 / n)} כל חלק מגיע בדיוק למקום של החלק הבא.`],
            };
          }
          return {
            type: 'number', unit: '°', answer: 360 / n,
            prompt: `${sc.t(who, n)}. בכמה מעלות לכל הפחות צריך לסובב את הצורה סביב המרכז, כדי שתיראה בדיוק כמו בהתחלה?`,
            visual: level === 2 && c.chance(0.5) ? pinwheel(n) : undefined,
            hint: `סיבוב שלם הוא ${dg(360)}, ויש ${n} חלקים זהים. ${c.g('חלק', 'חלקי')} את ${dg(360)} ל-${n}.`,
            solution: [m(`360° : ${n} = ${360 / n}°`), `אחרי ${dg(360 / n)} כל חלק מגיע בדיוק למקום של החלק הבא.`],
          };
        }
        case 'diagLen1':
        case 'diagRect':
        case 'diagLen3': {
          const rect = kind === 'diagRect';
          const P = rect ? V.shapes.rect(190, 110) : parPts(185, 100, c.pick([55, 60, 65]));
          if (kind === 'diagLen3') {
            const ae = c.rnd(5, 15), d = c.rnd(1, ae - 2), be = ae - d;
            return {
              type: 'number', unit: 'ס"מ', answer: 2 * be,
              prompt: `במקבילית אבגד האלכסונים נפגשים בנקודה ה. האלכסון אג הוא ${2 * ae} ס"מ, והקטע בה קצר ב-${d} ס"מ מהקטע אה. מה אורך האלכסון בד?`,
              visual: diagFig(P),
              hint: `${c.g('מצא', 'מצאי')} קודם את אה (חצי מאג). אחר כך את בה, ו${c.g('זכור', 'זכרי')} שבד כפול ממנו.`,
              solution: [`אה: ${m(`${2 * ae} : 2 = ${ae}`)}.`, `בה: ${m(`${ae} − ${d} = ${be}`)}.`, `בד: ${m(`2 × ${be} = ${2 * be}`)} ס"מ.`],
            };
          }
          if (rect) {
            const x = c.rnd(3, 15), ask = c.pick(['בה', 'גה', 'דה']);
            return {
              type: 'number', unit: 'ס"מ', answer: x,
              prompt: `במלבן אבגד האלכסונים נפגשים בנקודה ה. האלכסון אג הוא ${2 * x} ס"מ. מה אורך הקטע ${ask}?`,
              visual: diagFig(P, { maxw: 230 }),
              hint: 'במלבן האלכסונים שווים, והם חוצים זה את זה.',
              solution: [`האלכסונים שווים: גם בד = ${2 * x} ס"מ.`, `הם חוצים זה את זה, ולכן כל חצי: ${m(`${2 * x} : 2 = ${x}`)} ס"מ.`],
            };
          }
          const x = c.rnd(2, 12), inv = c.chance(0.5);
          return {
            type: 'number', unit: 'ס"מ', answer: inv ? x : 2 * x,
            prompt: inv ? `במקבילית אבגד האלכסונים נפגשים בנקודה ה. האלכסון אג הוא ${2 * x} ס"מ. מה אורך הקטע אה?` : `במקבילית אבגד האלכסונים נפגשים בנקודה ה. הקטע אה הוא ${x} ס"מ. מה אורך האלכסון אג?`,
            visual: diagFig(P, { ticks: true, segLabels: inv ? [] : [[0, String(x)]] }),
            hint: 'במקבילית, האלכסונים חוצים זה את זה — ה היא האמצע של כל אלכסון.',
            solution: inv ? [`ה היא האמצע של אג.`, m(`${2 * x} : 2 = ${x}`) + ' ס"מ'] : [`ה היא האמצע של אג, ולכן גם הג = ${x} ס"מ.`, m(`${x} + ${x} = ${2 * x}`) + ' ס"מ'],
          };
        }
        case 'diagStory':
        case 'diagMulti': {
          const sc = c.scene([
            { tags: ['nature', 'animals', 'sport'], t: (w) => `${w.name} ${w.g('בונה', 'בונה')} שער לגינה בצורת מלבן, ו${w.g('מחזק', 'מחזקת')} אותו בשני מוטות לאורך האלכסונים` },
            { tags: ['art', 'space', 'magic', 'kpop'], kite: true, t: (w) => `${w.name} ${w.g('בונה', 'בונה')} עפיפון בצורת מעוין משני מקלות, שהם האלכסונים של המעוין` },
            { tags: ['tech', 'games', 'reading', 'music', 'baking', 'squishy'], t: (w) => `${w.name} ${w.g('בונה', 'בונה')} מדף בצורת מלבן, ו${w.g('מחזק', 'מחזקת')} אותו בשני מוטות לאורך האלכסונים` },
          ]);
          if (kind === 'diagStory') {
            if (sc.kite) {
              return {
                type: 'number', unit: '°', answer: 90, prompt: `${sc.t(who)}. באיזו זווית נפגשים שני המקלות?`,
                hint: `מה ${c.g('אתה יודע', 'את יודעת')} על האלכסונים של מעוין?`,
                solution: ['במעוין האלכסונים מאונכים זה לזה.', `לכן המקלות נפגשים בזווית ישרה: ${dg(90)}.`],
              };
            }
            const x = c.rnd(10, 45);
            return {
              type: 'number', unit: 'ס"מ', answer: x,
              prompt: `${sc.t(who)}. כל מוט באורך ${2 * x} ס"מ, והמוטות נפגשים בנקודה ה. מה המרחק מהנקודה ה לכל אחת מהפינות?`,
              hint: 'במלבן, האלכסונים שווים וחוצים זה את זה.',
              solution: ['האלכסונים חוצים זה את זה, ולכן ה היא האמצע של כל מוט.', m(`${2 * x} : 2 = ${x}`) + ' ס"מ'],
            };
          }
          if (sc.kite) {
            const a = c.rnd(10, 30), bb = c.rnd(6, a - 2);
            return {
              type: 'number', unit: 'ס"מ', answer: 2 * (a + bb),
              prompt: `${sc.t(who)}. המקלות נפגשים בנקודה ה. מהנקודה ה עד קצה אחד של המקל הארוך יש ${a} ס"מ, ועד קצה אחד של המקל הקצר — ${bb} ס"מ. כמה סנטימטרים של מקלות ${who.g('הוא צריך', 'היא צריכה')} בסך הכול?`,
              hint: `במעוין, האלכסונים חוצים זה את זה — ה היא האמצע של כל מקל. ${c.g('חשב', 'חשבי')} את האורך של כל מקל, ואז ${c.g('חבר', 'חברי')}.`,
              solution: [`המקל הארוך: ${m(`2 × ${a} = ${2 * a}`)} ס"מ. המקל הקצר: ${m(`2 × ${bb} = ${2 * bb}`)} ס"מ.`, `ביחד: ${m(`${2 * a} + ${2 * bb} = ${2 * (a + bb)}`)} ס"מ.`],
            };
          }
          const x = c.rnd(12, 60);
          return {
            type: 'number', unit: 'ס"מ', answer: 4 * x,
            prompt: `${sc.t(who)}. המוטות נפגשים בנקודה ה, והמרחק מ-ה עד פינה אחת הוא ${x} ס"מ. כמה סנטימטרים של מוטות ${who.g('הוא צריך', 'היא צריכה')} בסך הכול?`,
            hint: 'במלבן, האלכסונים שווים וחוצים זה את זה. מה האורך של מוט אחד?',
            solution: [`ה היא האמצע של כל מוט, ולכן כל מוט: ${m(`2 × ${x} = ${2 * x}`)} ס"מ.`, `שני המוטות שווים: ${m(`2 × ${2 * x} = ${4 * x}`)} ס"מ.`],
          };
        }
        case 'propTable': {
          const v = level === 3 ? c.pick([['שווים זה לזה וגם מאונכים זה לזה', 3, 'שווים — רק במלבן ובריבוע. מאונכים — רק במעוין ובריבוע. שניהם יחד — רק בריבוע.'], ['מאונכים זה לזה וגם חוצים זה את זה', 2, 'חוצים זה את זה — בכל המשפחה. מאונכים — רק במעוין ובריבוע. לכן שניהם יחד — במעוין ובריבוע.'], ['שווים זה לזה וגם חוצים זה את זה', 1, 'חוצים זה את זה — בכל המשפחה. שווים — רק במלבן ובריבוע. לכן שניהם יחד — במלבן ובריבוע.']])
            : c.pick([['חוצים זה את זה', 0, 'בכל מקבילית האלכסונים חוצים זה את זה — ולכן בכל המשפחה.'], ['שווים זה לזה', 1, 'אלכסונים שווים — במלבן, וגם בריבוע (שהוא מלבן מיוחד).'], ['מאונכים זה לזה', 2, 'אלכסונים מאונכים — במעוין, וגם בריבוע (שהוא מעוין מיוחד).']]);
          return {
            type: 'choice', keep: true, prompt: `באילו מרובעים במשפחת המקביליות האלכסונים ${b(v[0])} תמיד?`, choices: ['מקבילית, מלבן, מעוין וריבוע', 'רק מלבן וריבוע', 'רק מעוין וריבוע', 'רק ריבוע'], answer: v[1],
            hint: 'בכל מקבילית האלכסונים חוצים זה את זה. מלבן מוסיף "שווים", ומעוין מוסיף "מאונכים".',
            solution: [v[2]],
          };
        }
        case 'pickRot': {
          const ks = ['par', 'kite', 'rect', 'trap'];
          const choices = ks.map((k) => draw(shape(k, c, { rot: rndRot(c) }), { ticks: true, right: true, maxw: 150 }));
          return {
            type: 'choice', cols: 2, prompt: `לאיזו צורה יש ${b('סימטריה סיבובית')}, אבל ${b('אין')} לה אף קו סימטריה?`, choices, answer: 0,
            hint: 'לכל צורה ' + c.g('שאל', 'שאלי') + ' שתי שאלות: האם חצי סיבוב מחזיר אותה לעצמה? האם יש קיפול שבו החצאים נופלים זה על זה?',
            solution: ['למקבילית יש סימטריה סיבובית של חצי סיבוב, ואין לה קו סימטריה.', 'לדלתון ולטרפז שווה-השוקיים יש קו סימטריה בלי סימטריה סיבובית, ולמלבן יש את שתיהן.'],
          };
        }
        case 'tf':
        case 'claim': {
          const st = c.pick([
            ['למקבילית יש סימטריה סיבובית', true, 'בחצי סיבוב סביב נקודת המפגש של האלכסונים, המקבילית נופלת על עצמה.'],
            ['בכל מקבילית, האלכסונים שווים זה לזה', false, 'רק במלבן (ובריבוע) האלכסונים שווים. במקבילית "נוטה" אלכסון אחד ארוך יותר.'],
            ['בכל מקבילית, האלכסונים חוצים זה את זה', true, 'נקודת המפגש היא האמצע של כל אחד מהאלכסונים.'],
            ['במלבן, האלכסונים מאונכים זה לזה', false, 'במלבן שאינו ריבוע האלכסונים נפגשים בזווית שאינה ישרה.'],
            ['לדלתון יש סימטריה סיבובית', false, 'דלתון חוזר להיראות כמו בהתחלה רק אחרי סיבוב שלם.'],
            ['כל צורה שיש לה סימטריה סיבובית — יש לה גם קו סימטריה', false, 'למקבילית יש סימטריה סיבובית, ואין לה קו סימטריה.'],
            ['לריבוע יש סימטריה סיבובית של רבע סיבוב', true, `בסיבוב של ${dg(90)} הריבוע נופל בדיוק על עצמו.`],
            ['במעוין, האלכסונים מאונכים זה לזה', true, 'האלכסונים של המעוין נפגשים בזווית ישרה.'],
          ]);
          const f = c.friend();
          return {
            type: 'tf', prompt: kind === 'claim' ? `${f.name} ${f.g('אומר', 'אומרת')}: "${st[0]}". ${c.g('קבע', 'קבעי')}: נכון או לא נכון?` : `${st[0]}.`, answer: st[1],
            hint: `${c.g('סרטט', 'סרטטי')} את הצורה ואת האלכסונים שלה. ${c.g('דמיין', 'דמייני')} גם סיבוב וגם קיפול.`,
            solution: [st[2], `לכן הטענה ${st[1] ? 'נכונה' : 'לא נכונה'}.`],
          };
        }
      }
    },
  });
})(HM);
