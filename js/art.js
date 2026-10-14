/* חשבוניה — איורים: הקמע נומי, אייקונים, איורי עולמות, תגים */
(function (HM) {
  'use strict';

  /* ---------- נומי ---------- */
  // mood: happy | wow | think | oops | party | wave | sleep
  function mascot(mood, o) {
    mood = mood || 'happy'; o = o || {};
    const stroke = 'stroke="var(--ink)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
    let eyes, mouth, arms, brows = '', extra = '';
    const eye = (x, y, look) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="18" fill="#fff" ${stroke}/><circle cx="${x + (look ? look[0] : 2)}" cy="${y + (look ? look[1] : 3)}" r="8" fill="var(--ink)"/><circle cx="${x + (look ? look[0] : 2) + 3}" cy="${y + (look ? look[1] : 3) - 4}" r="3" fill="#fff"/>`;
    if (mood === 'party' || mood === 'sleep') {
      eyes = mood === 'sleep'
        ? `<path d="M64 92 q12 8 24 0 M112 92 q12 8 24 0" fill="none" ${stroke}/>`
        : `<path d="M62 96 q14 -18 28 0 M110 96 q14 -18 28 0" fill="none" ${stroke}/>`;
    } else if (mood === 'think') {
      eyes = eye(76, 90, [-3, -5]) + eye(124, 90, [-3, -5]);
    } else if (mood === 'oops') {
      eyes = eye(76, 92, [0, 2]) + eye(124, 92, [0, 2]);
      brows = `<path d="M60 68 l26 8 M140 68 l-26 8" fill="none" ${stroke}/>`;
    } else eyes = eye(76, 90) + eye(124, 90);
    switch (mood) {
      case 'wow': mouth = `<ellipse cx="100" cy="128" rx="11" ry="13" fill="var(--ink)"/><ellipse cx="100" cy="133" rx="6" ry="5" fill="#ff7b8f"/>`; break;
      case 'think': mouth = `<path d="M88 130 q12 -6 24 2" fill="none" ${stroke}/>`; break;
      case 'oops': mouth = `<path d="M84 134 q16 -12 32 0" fill="none" ${stroke}/>`; break;
      case 'sleep': mouth = `<ellipse cx="100" cy="128" rx="7" ry="5" fill="var(--ink)"/>`; extra = `<text x="150" y="52" font-family="var(--f-display)" font-weight="700" font-size="26" fill="var(--ink-2)">z</text><text x="166" y="34" font-family="var(--f-display)" font-weight="700" font-size="18" fill="var(--ink-3)">z</text>`; break;
      default: mouth = `<path d="M80 122 q20 22 40 0 z" fill="var(--ink)" ${stroke}/><path d="M89 131 q11 8 22 0" fill="#ff7b8f"/>`;
    }
    if (mood === 'party') arms = `<path d="M44 118 q-22 -22 -18 -50" fill="none" ${stroke}/><path d="M156 118 q22 -22 18 -50" fill="none" ${stroke}/><circle cx="26" cy="64" r="9" class="f-c" ${stroke}/><circle cx="174" cy="64" r="9" class="f-c" ${stroke}/>`;
    else if (mood === 'wave') arms = `<path d="M46 132 q-18 6 -24 22" fill="none" ${stroke}/><path d="M156 120 q24 -16 22 -44" fill="none" ${stroke}/><circle cx="178" cy="72" r="9" class="f-a" ${stroke}/>`;
    else if (mood === 'think') arms = `<path d="M46 134 q-16 8 -20 24" fill="none" ${stroke}/><path d="M152 136 q-10 6 -30 2" fill="none" ${stroke}/><circle cx="118" cy="138" r="8" class="f-a" ${stroke}/>`;
    else arms = `<path d="M46 132 q-18 6 -24 22" fill="none" ${stroke}/><path d="M154 132 q18 6 24 22" fill="none" ${stroke}/>`;
    const svg = `<svg class="mascot ${o.cls || ''}" viewBox="0 0 200 200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="190" rx="54" ry="7" fill="var(--ink)" opacity=".12"/>
      <g class="m-body">
        <path d="M100 46 V26" ${stroke} fill="none"/>
        <path d="M100 6 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" class="f-c" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
        ${arms}
        <ellipse cx="74" cy="178" rx="17" ry="10" class="f-a" ${stroke}/><ellipse cx="126" cy="178" rx="17" ry="10" class="f-a" ${stroke}/>
        <path d="M100 42 C150 42 166 80 166 116 C166 156 138 176 100 176 C62 176 34 156 34 116 C34 80 50 42 100 42 Z" class="f-a" ${stroke}/>
        <path d="M100 52 C136 52 152 76 156 100" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="100" cy="150" rx="34" ry="20" class="f-l"/>
        <path d="M100 141 v18 M91 150 h18" stroke="var(--p-d)" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse cx="58" cy="116" rx="10" ry="6" fill="#ff8fa3" opacity=".55"/><ellipse cx="142" cy="116" rx="10" ry="6" fill="#ff8fa3" opacity=".55"/>
        ${brows}<g class="m-eyes">${eyes}</g>${mouth}
      </g>${extra}</svg>`;
    return svg;
  }

  /* ---------- אייקונים (24×24, קו) ---------- */
  const P = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra || ''}</svg>`;
  const ICONS = {
    home: P('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    map: P('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
    bolt: P('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    redo: P('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>'),
    user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'),
    close: P('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    back: P('<path d="M9 5l7 7-7 7"/>'),
    next: P('<path d="M15 5l-7 7 7 7"/>'),
    speaker: P('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
    mute: P('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 5M22 9l-5 5"/>'),
    bulb: P('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'),
    book: P('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
    pencil: P('<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>'),
    lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    play: P('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    trophy: P('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M10 14v3h4v-3M8 21h8M9 17h6"/>'),
    gear: P('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
    chart: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    sparkle: P('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'),
    target: P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
    clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    list: P('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'),
    backspace: P('<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M12 9l5 6M17 9l-5 6"/>'),
    swap: P('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
    calendar: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z" fill="var(--a)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    starOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z" fill="#e3e8ef" stroke="var(--ink-3)" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#ff7a1a" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 13c1 1.5 3 2.5 3 5a3 3 0 0 1-6 0c0-1.5 1-2.5 3-5z" fill="#ffd84d"/></svg>',
    flameOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#dfe5ee" stroke="var(--ink-3)" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    gem: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9z" fill="var(--p)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 9h20M9 3l3 18 3-18" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" opacity=".5"/></svg>',
  };
  const icon = (name) => ICONS[name] || '';

  /* ---------- אייקונים לתחומי עניין (צבעוניים) ---------- */
  const st = 'stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  const INT_ICONS = {
    ball: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#fff" ${st}/><path d="M16 9l5 3.6-1.9 6h-6.2L11 12.6z" fill="var(--ink)"/><path d="M16 4v5M21 12.6l6-2M19 18.6l3.5 5M13 18.6l-3.5 5M11 12.6l-6-2" ${st} fill="none"/></svg>`,
    paw: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="21" rx="7" ry="6" fill="#f4a261" ${st}/><circle cx="8" cy="13" r="3" fill="#f4a261" ${st}/><circle cx="13" cy="8" r="3" fill="#f4a261" ${st}/><circle cx="19" cy="8" r="3" fill="#f4a261" ${st}/><circle cx="24" cy="13" r="3" fill="#f4a261" ${st}/></svg>`,
    rocket: `<svg viewBox="0 0 32 32"><path d="M16 3c5 4 6 10 4 17h-8C10 13 11 7 16 3z" fill="#e8eef7" ${st}/><circle cx="16" cy="12" r="2.6" fill="#59c3f5" ${st}/><path d="M12 20l-4 5 5-1M20 20l4 5-5-1" fill="#ff7f9e" ${st}/><path d="M14 23h4l-2 6z" fill="#ffb547" ${st}/></svg>`,
    note: `<svg viewBox="0 0 32 32"><path d="M12 24V7l14-3v17" fill="none" ${st}/><ellipse cx="9" cy="24" rx="4" ry="3.2" fill="#b07cff" ${st}/><ellipse cx="23" cy="21" rx="4" ry="3.2" fill="#b07cff" ${st}/><path d="M12 11l14-3" ${st}/></svg>`,
    cake: `<svg viewBox="0 0 32 32"><rect x="5" y="15" width="22" height="12" rx="3" fill="#ffd1dc" ${st}/><path d="M5 19c3 2 5-2 7.5 0s5-2 7.5 0 4 0 7-2" fill="none" ${st}/><path d="M16 15V9" ${st}/><path d="M16 4c2 2 2 4 0 5-2-1-2-3 0-5z" fill="#ffb547" ${st}/></svg>`,
    pad: `<svg viewBox="0 0 32 32"><path d="M7 10h18a5 5 0 0 1 5 5v4a4 4 0 0 1-7 2.6L21 20H11l-2 1.6A4 4 0 0 1 2 19v-4a5 5 0 0 1 5-5z" fill="#8fd85a" ${st}/><path d="M9 13v5M6.5 15.5h5" ${st}/><circle cx="22" cy="14" r="1.6" fill="var(--ink)"/><circle cx="25" cy="17" r="1.6" fill="var(--ink)"/></svg>`,
    brush: `<svg viewBox="0 0 32 32"><path d="M26 4L14 17l3 3L28 7z" fill="#ffb547" ${st}/><path d="M13 18c-4 0-6 3-6 6 0 2-2 3-3 3 4 1 10 0 11-5z" fill="#ff7f9e" ${st}/></svg>`,
    tree: `<svg viewBox="0 0 32 32"><path d="M16 3l9 12h-5l6 8H6l6-8H7z" fill="#8fd85a" ${st}/><path d="M16 23v6" ${st}/></svg>`,
    book: `<svg viewBox="0 0 32 32"><path d="M4 7c4-2 8-2 12 1v19c-4-3-8-3-12-1z" fill="#59c3f5" ${st}/><path d="M28 7c-4-2-8-2-12 1v19c4-3 8-3 12-1z" fill="#ffd84d" ${st}/></svg>`,
    bot: `<svg viewBox="0 0 32 32"><rect x="7" y="10" width="18" height="15" rx="4" fill="#cfd8e6" ${st}/><circle cx="12.5" cy="17" r="2.3" fill="var(--ink)"/><circle cx="19.5" cy="17" r="2.3" fill="var(--ink)"/><path d="M13 21.5h6M16 10V6" ${st}/><circle cx="16" cy="5" r="2" fill="#ff7f9e" ${st}/><path d="M7 17H4M25 17h3" ${st}/></svg>`,
    // קיי-פופ: לייטסטיק עם לב
    mic: `<svg viewBox="0 0 32 32"><path d="M15 17l-6 11" ${st}/><rect x="7.5" y="25" width="5" height="4" rx="1.5" transform="rotate(29 10 27)" fill="#b07cff" ${st}/><circle cx="18.5" cy="11" r="8" fill="#e8e1ff" ${st}/><path d="M18.5 15.6c-3.6-2.3-5.2-4.2-5.2-6a2.6 2.6 0 0 1 5.2-.6 2.6 2.6 0 0 1 5.2.6c0 1.8-1.6 3.7-5.2 6z" fill="#ff5c9a" ${st}/><path d="M28 4l1 2M30 9h-2M5 9l2 1" ${st}/></svg>`,
    // קסמים: שרביט עם ניצוצות
    wand: `<svg viewBox="0 0 32 32"><path d="M6 27L21 12" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><path d="M6 27L21 12" stroke="#8a5a3c" stroke-width="2.6" stroke-linecap="round"/><path d="M24 3l1.6 3.4L29 8l-3.4 1.6L24 13l-1.6-3.4L19 8l3.4-1.6z" fill="#ffd84d" ${st}/><circle cx="27" cy="19" r="1.6" fill="#ffd84d" ${st}/><circle cx="13" cy="6" r="1.4" fill="#ffd84d" ${st}/></svg>`,
    // סקוויש: לחמניה חמודה עם פנים
    squish: `<svg viewBox="0 0 32 32"><path d="M4 21c0-7 5.4-12 12-12s12 5 12 12c0 3.3-2.7 5-6 5H10c-3.3 0-6-1.7-6-5z" fill="#ffc6dd" ${st}/><path d="M10 13c2-1.6 4-2.2 6-2.2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19" r="1.5" fill="var(--ink)"/><circle cx="20" cy="19" r="1.5" fill="var(--ink)"/><path d="M14.5 21.5q1.5 1.3 3 0" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="9.5" cy="21.5" rx="1.6" ry="1" fill="#ff7f9e"/><ellipse cx="22.5" cy="21.5" rx="1.6" ry="1" fill="#ff7f9e"/></svg>`,
  };

  /* ---------- נוף לצד הדרך בכל עולם (48×48) ---------- */
  const so = 'stroke="#1b2a3d" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
  const SCENERY = {
    naturals: [
      `<svg viewBox="0 0 48 48"><path d="M24 30v14" ${so}/><ellipse cx="24" cy="17" rx="12" ry="14" fill="#ffb547" ${so}/><path d="M21 31h6l-3 4z" fill="#ffb547" ${so}/><text x="24" y="23" text-anchor="middle" font-family="Fredoka, Rubik, sans-serif" font-weight="700" font-size="17" fill="#1b2a3d">7</text></svg>`,
      `<svg viewBox="0 0 48 48"><rect x="9" y="12" width="20" height="32" rx="3" fill="#fff3df" ${so}/><rect x="29" y="22" width="12" height="22" rx="3" fill="#ffd6a0" ${so}/><path d="M14 18h4M20 18h4M14 25h4M20 25h4M14 32h4M20 32h4M33 28h4M33 35h4" stroke="#e08600" stroke-width="3" stroke-linecap="round"/></svg>`,
      `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#fff" ${so}/><path d="M24 15v18M15 24h18" stroke="#e08600" stroke-width="5" stroke-linecap="round"/></svg>`,
    ],
    fractions: [
      `<svg viewBox="0 0 48 48"><path d="M8 12c10-5 22-5 32 0L24 44z" fill="#ffd27a" ${so}/><path d="M8 12c10-5 22-5 32 0l-2.5 5c-8.5-3.6-18.5-3.6-27 0z" fill="#e8a24a" ${so}/><circle cx="22" cy="24" r="3" fill="#e0456c"/><circle cx="28" cy="31" r="2.6" fill="#e0456c"/><circle cx="19" cy="17" r="2.2" fill="#3f9b3a"/></svg>`,
      `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="#fff" ${so}/><path d="M24 24V7a17 17 0 0 1 17 17z" fill="#ff7f9e" ${so}/><path d="M24 24L12 36" ${so}/></svg>`,
      `<svg viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="10" fill="#fff" ${so}/><text x="24" y="22" text-anchor="middle" font-family="Fredoka, Rubik, sans-serif" font-weight="700" font-size="13" fill="#e0456c">1</text><path d="M17 25.5h14" stroke="#1b2a3d" stroke-width="2.4" stroke-linecap="round"/><text x="24" y="37" text-anchor="middle" font-family="Fredoka, Rubik, sans-serif" font-weight="700" font-size="13" fill="#e0456c">2</text></svg>`,
    ],
    decimals: [
      `<svg viewBox="0 0 48 48"><ellipse cx="24" cy="27" rx="21" ry="6" fill="none" stroke="#1b2a3d" stroke-width="6"/><ellipse cx="24" cy="27" rx="21" ry="6" fill="none" stroke="#ffd84d" stroke-width="3"/><circle cx="24" cy="24" r="11" fill="#7ad4ff" ${so}/><path d="M5 27a21 6 0 0 0 38 0" fill="none" stroke="#1b2a3d" stroke-width="6"/><path d="M5 27a21 6 0 0 0 38 0" fill="none" stroke="#ffd84d" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 48 48"><path d="M24 5l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L24 33.7l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z" fill="#ffd84d" ${so}/></svg>`,
      `<svg viewBox="0 0 48 48"><path d="M30 18L8 40" stroke="#bfe6ff" stroke-width="7" stroke-linecap="round"/><circle cx="33" cy="15" r="9" fill="#59c3f5" ${so}/><circle cx="31" cy="13" r="2.4" fill="#fff"/><text x="13" y="20" font-family="Fredoka, Rubik, sans-serif" font-weight="700" font-size="13" fill="#1597d4">.5</text></svg>`,
    ],
    geometry: [
      `<svg viewBox="0 0 48 48"><path d="M24 4l13 20h-7l9 13H9l9-13h-7z" fill="#8fd85a" ${so}/><path d="M24 37v8" ${so}/></svg>`,
      `<svg viewBox="0 0 48 48"><rect x="11" y="22" width="26" height="20" fill="#ff9f6b" ${so}/><path d="M7 24L24 8l17 16z" fill="#ff7f9e" ${so}/><rect x="20" y="30" width="8" height="12" fill="#fff" ${so}/></svg>`,
      `<svg viewBox="0 0 48 48"><path d="M24 4l14 15-14 25-14-25z" fill="#59c3f5" ${so}/><path d="M24 4v40M10 19h28" stroke="#1b2a3d" stroke-width="1.6" opacity=".5"/></svg>`,
    ],
  };

  /* ---------- איורי עולמות (300×140) ---------- */
  const k = 'stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"';
  const WORLD_ART = {
    city: `<svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="240" cy="38" r="20" fill="#fff3c4" ${k}/>
      <path d="M0 140V112h300v28z" fill="#e08600" opacity=".35"/>
      <rect x="22" y="58" width="48" height="84" rx="4" fill="#fff" ${k}/><rect x="78" y="34" width="56" height="108" rx="4" fill="#ffe2ad" ${k}/>
      <rect x="142" y="70" width="44" height="72" rx="4" fill="#fff" ${k}/><rect x="194" y="48" width="58" height="94" rx="4" fill="#ffe2ad" ${k}/><rect x="258" y="80" width="36" height="62" rx="4" fill="#fff" ${k}/>
      <g font-family="Fredoka, Rubik, sans-serif" font-weight="700" fill="#1b2a3d" text-anchor="middle">
        <text x="46" y="92" font-size="26">7</text><text x="106" y="74" font-size="30">1</text><text x="106" y="112" font-size="30">0</text>
        <text x="164" y="108" font-size="24">+</text><text x="223" y="86" font-size="28">3</text><text x="223" y="124" font-size="28">×</text><text x="276" y="114" font-size="22">5</text></g>
      <path d="M90 34v-12M120 34v-16" ${k}/></svg>`,
    pie: `<svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="140" cy="76" r="54" fill="#ffe08a" ${k}/><circle cx="140" cy="76" r="44" fill="#ff9f6b" stroke="#1b2a3d" stroke-width="2"/>
      <path d="M140 76 L140 32 A44 44 0 0 1 184 76 Z" fill="#ff7f9e" stroke="#1b2a3d" stroke-width="2"/>
      <path d="M140 76 L184 76 M140 76 L140 120 M140 76 L96 76 M140 76 L140 32" stroke="#1b2a3d" stroke-width="2.5"/>
      <g transform="translate(26 -10)"><path d="M196 70 L196 30 A40 40 0 0 1 236 70 Z" fill="#ffe08a" ${k}/><path d="M200 66 L200 38 A30 30 0 0 1 228 66 Z" fill="#ff9f6b"/></g>
      <circle cx="122" cy="96" r="5" fill="#c9374f"/><circle cx="160" cy="98" r="5" fill="#c9374f"/><circle cx="118" cy="60" r="5" fill="#c9374f"/><circle cx="158" cy="56" r="4" fill="#3f9b3a"/>
      <g font-family="Fredoka, Rubik, sans-serif" font-weight="700" fill="#1b2a3d" text-anchor="middle"><text x="48" y="64" font-size="28">3</text><path d="M34 72h28" stroke="#1b2a3d" stroke-width="3.5"/><text x="48" y="100" font-size="28">4</text></g></svg>`,
    planet: `<svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g fill="#fff"><circle cx="30" cy="30" r="3"/><circle cx="270" cy="24" r="2.5"/><circle cx="250" cy="110" r="3"/><circle cx="60" cy="112" r="2"/></g>
      <path d="M262 52l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff3c4" stroke="#1b2a3d" stroke-width="2"/>
      <ellipse cx="150" cy="78" rx="96" ry="22" fill="none" stroke="#1b2a3d" stroke-width="9"/><ellipse cx="150" cy="78" rx="96" ry="22" fill="none" stroke="#ffd84d" stroke-width="5"/>
      <circle cx="150" cy="70" r="46" fill="#7ad4ff" ${k}/><path d="M118 52c10-8 24-6 30 2s20 6 26-2" fill="none" stroke="#1597d4" stroke-width="5" stroke-linecap="round"/><circle cx="168" cy="86" r="8" fill="#1597d4"/><circle cx="132" cy="88" r="5" fill="#1597d4"/>
      <path d="M58 82 a96 22 0 0 0 184 0" fill="none" stroke="#1b2a3d" stroke-width="9"/><path d="M58 82 a96 22 0 0 0 184 0" fill="none" stroke="#ffd84d" stroke-width="5"/>
      <g font-family="Fredoka, Rubik, sans-serif" font-weight="700" fill="#1b2a3d"><text x="20" y="80" font-size="24">0.5</text><text x="236" y="136" font-size="20">1.25</text></g></svg>`,
    island: `<svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="252" cy="34" r="20" fill="#ffe46b" ${k}/>
      <path d="M0 112c20-6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0 40 6 60 0v28H0z" fill="#59c3f5" stroke="#1b2a3d" stroke-width="2.5"/>
      <path d="M40 116c20-26 200-26 220 0z" fill="#ffe2a6" ${k}/>
      <path d="M90 104 L128 40 L166 104 Z" fill="#8fd85a" ${k}/><path d="M118 56l10-16 10 16-5 3-5-4-5 4z" fill="#fff"/>
      <rect x="176" y="70" width="38" height="34" fill="#ff9f6b" ${k}/><path d="M172 72 L195 50 L218 72 Z" fill="#ff7f9e" ${k}/><rect x="189" y="84" width="12" height="20" fill="#fff" stroke="#1b2a3d" stroke-width="2.5"/>
      <path d="M64 104v-26" ${k}/><path d="M64 80c-12-8-20-4-24 2M64 80c10-10 20-8 24-2M64 80c-2-12-10-16-16-14" fill="none" stroke="#3f9b3a" stroke-width="5" stroke-linecap="round"/>
      <polygon points="232,104 246,86 260,104" fill="#ffd84d" ${k}/></svg>`,
  };

  /* ---------- תגים ---------- */
  // glyph: מחרוזת SVG פנימית במרכז 50,50 (בקירוב 34×34)
  const GLYPHS = {
    first: '<path d="M38 64l12-30 12 30-12-7z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    perfect: '<path d="M50 30l5.5 11.5 12.5 1.5-9.2 8.6 2.4 12.4L50 58l-11.2 6 2.4-12.4L32 43l12.5-1.5z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    fire: '<path d="M50 28c2 7 12 11 12 22a12 12 0 0 1-24 0c0-6 3-9 6-11 0 4 2 6 4 6 0-6-2-11 2-17z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    check: '<path d="M35 51l10 10 20-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
    book: '<path d="M32 36c6-3 12-3 18 1v26c-6-4-12-4-18-1zM68 36c-6-3-12-3-18 1v26c6-4 12-4 18-1z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    bolt: '<path d="M54 28L38 52h11l-3 20 16-24H51z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    redo: '<path d="M36 50a14 14 0 1 0 5-10.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M36 33v10h10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    owl: '<circle cx="42" cy="48" r="8" fill="#fff" stroke="#1b2a3d" stroke-width="3"/><circle cx="58" cy="48" r="8" fill="#fff" stroke="#1b2a3d" stroke-width="3"/><circle cx="42" cy="48" r="3" fill="#1b2a3d"/><circle cx="58" cy="48" r="3" fill="#1b2a3d"/><path d="M47 58l3 4 3-4z" fill="#ffd84d" stroke="#1b2a3d" stroke-width="2"/>',
    sun: '<circle cx="50" cy="50" r="10" fill="#fff" stroke="#1b2a3d" stroke-width="3"/><path d="M50 30v6M50 64v6M30 50h6M64 50h6M36 36l4 4M60 60l4 4M64 36l-4 4M36 64l4-4" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    hundred: '<text x="50" y="59" text-anchor="middle" font-family="Fredoka, Rubik, sans-serif" font-weight="700" font-size="25" fill="#fff" stroke="#1b2a3d" stroke-width="1.5">100</text>',
    city: '<path d="M33 66V44h10v22M45 66V34h11v32M58 66V48h9v18" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    pie: '<circle cx="50" cy="50" r="15" fill="#fff" stroke="#1b2a3d" stroke-width="3"/><path d="M50 50V35a15 15 0 0 1 15 15z" fill="#ffd84d" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
    planet: '<circle cx="50" cy="50" r="12" fill="#fff" stroke="#1b2a3d" stroke-width="3"/><ellipse cx="50" cy="52" rx="22" ry="6" fill="none" stroke="#1b2a3d" stroke-width="3"/>',
    shapes: '<path d="M32 62l10-20 10 20z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/><rect x="54" y="44" width="16" height="16" fill="#fff" stroke="#1b2a3d" stroke-width="3"/>',
    crown: '<path d="M32 62l-2-24 11 9 9-14 9 14 11-9-2 24z" fill="#fff" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round"/>',
  };
  function badgeArt(glyph, color) {
    return `<svg class="bdg" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M30 70l-8 26 14-6 8 10 8-24zM70 70l8 26-14-6-8 10-8-24z" fill="${color}" stroke="#1b2a3d" stroke-width="3" stroke-linejoin="round" opacity=".85"/>
      <circle cx="50" cy="50" r="34" fill="${color}" stroke="#1b2a3d" stroke-width="4"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="4 5"/>
      ${GLYPHS[glyph] || GLYPHS.check}</svg>`;
  }

  // לוגו קטן: ריבוע משבצות עם +
  const logo = `<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="5" width="42" height="40" rx="12" fill="var(--ink)"/><rect x="3" y="3" width="42" height="40" rx="12" fill="var(--p)" stroke="var(--ink)" stroke-width="3"/><path d="M24 13v20M14 23h20" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/><circle cx="36" cy="12" r="5" fill="var(--a)" stroke="var(--ink)" stroke-width="2.5"/></svg>`;

  HM.art = { mascot, icon, ICONS, INT_ICONS, WORLD_ART, SCENERY, badgeArt, logo };
})(HM);
