/* חשבוניה — צלילים (מסונתזים), הקראה בעברית וקונפטי */
(function (HM) {
  'use strict';
  let ac = null;
  const soundOn = () => { const p = HM.store && HM.store.current(); return !p || p.settings.sound !== false; };
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + start;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const SFX = {
    tap: () => tone(660, 0, 0.06, 'triangle', 0.08),
    key: () => tone(520 + Math.random() * 60, 0, 0.05, 'triangle', 0.06),
    good: () => { tone(784, 0, 0.12, 'triangle', 0.16); tone(1175, 0.09, 0.22, 'triangle', 0.16); },
    combo: () => { tone(784, 0, 0.1, 'triangle', 0.14); tone(988, 0.07, 0.1, 'triangle', 0.14); tone(1319, 0.14, 0.26, 'triangle', 0.16); },
    bad: () => { tone(300, 0, 0.18, 'sawtooth', 0.07, 210); tone(220, 0.12, 0.25, 'triangle', 0.1, 160); },
    soft: () => tone(440, 0, 0.12, 'sine', 0.1, 520),
    star: () => tone(1046, 0, 0.18, 'triangle', 0.14, 1568),
    win: () => { [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.14)); tone(1568, 0.5, 0.5, 'sine', 0.1); },
    level: () => { [392, 523, 659, 784, 1046, 1319, 1568].forEach((f, i) => tone(f, i * 0.07, 0.25, 'square', 0.05)); },
    whoosh: () => tone(200, 0, 0.25, 'sine', 0.06, 900),
  };
  HM.sfx = (name) => { if (!soundOn()) return; try { (SFX[name] || SFX.tap)(); } catch (e) { /* אין שמע */ } };

  /* ---------- הקראה ----------
     בחירת קול לפי מגדר: לבנות קול נשי, לבנים קול גברי — כשקיים במכשיר.
     קולות עבריים מוכרים: Carmit (macOS/iOS, נשי), Hila/Avri (Microsoft Edge, טבעיים, נשי/גברי), Asaf (Windows, גברי). */
  const FEMALE = /carmit|hila|כרמית|הילה|female|woman|girl/i;
  const MALE = /asaf|avri|אסף|אברי|male|\bman\b|boy/i;
  // רק קולות טבעיים (למשל הילה ואברי ב-Microsoft Edge). קול המערכת הרובוטי לא בשימוש בכלל
  const NATURAL = /natural|online|neural|premium/i;
  let voicesCache = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return [];
    voicesCache = window.speechSynthesis.getVoices().filter((v) => /^(he|iw)/i.test(v.lang) && NATURAL.test(v.name));
    return voicesCache;
  }
  if ('speechSynthesis' in window) { loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }
  const voiceGender = (v) => (MALE.test(v.name) && !/female/i.test(v.name) ? 'm' : FEMALE.test(v.name) ? 'f' : null);
  HM.hebrewVoices = () => (voicesCache.length ? voicesCache : loadVoices()).map((v) => ({ name: v.name, gender: voiceGender(v), natural: NATURAL.test(v.name) }));
  // הקול שייבחר לפרופיל: בחירה ידנית, אחרת לפי מגדר (עדיפות לקולות טבעיים)
  function pickVoice(p) {
    const vs = voicesCache.length ? voicesCache : loadVoices();
    if (!vs.length) return null;
    const pref = p && p.settings && p.settings.voice;
    if (pref) { const v = vs.find((x) => x.name === pref); if (v) return v; }
    const g = p && p.gender === 'f' ? 'f' : 'm';
    const same = vs.filter((v) => voiceGender(v) === g);
    return same.find((v) => NATURAL.test(v.name)) || same[0] || vs.find((v) => NATURAL.test(v.name)) || vs[0];
  }
  HM.currentVoice = () => { const v = pickVoice(HM.store && HM.store.current()); return v ? { name: v.name, gender: voiceGender(v) } : null; };
  HM.hasVoiceFor = (gender) => HM.hebrewVoices().some((v) => v.gender === gender);
  HM.canSpeak = () => 'speechSynthesis' in window && !!pickVoice(null);

  // שברים במילים: 3/4 => "שלושה רבעים", 1/2 => "חצי", 2/5 => "שתי חמישיות"
  const FR = { 2: ['חצי', 'חצאים', 1], 3: ['שליש', 'שלישים', 1], 4: ['רבע', 'רבעים', 1], 5: ['חמישית', 'חמישיות', 0], 6: ['שישית', 'שישיות', 0], 7: ['שביעית', 'שביעיות', 0], 8: ['שמינית', 'שמיניות', 0], 9: ['תשיעית', 'תשיעיות', 0], 10: ['עשירית', 'עשיריות', 0], 100: ['מאית', 'מאיות', 0], 1000: ['אלפית', 'אלפיות', 0] };
  const MNUM = ['', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
  const FNUM = ['', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  function fracWords(n, d) {
    n = +n; d = +d;
    const f = FR[d];
    if (!f || !(n >= 0)) return ` ${n} חלקי ${d} `;
    if (n === 1) return f[0];
    if (n < 10) return `${f[2] ? MNUM[n] : FNUM[n]} ${f[1]}`;
    return `${n} ${f[1]}`;
  }
  HM.speechText = function (html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('svg, .ck').forEach((s) => s.remove());
    div.querySelectorAll('.mixed').forEach((mx) => {
      const w = mx.querySelector('.mx-w'), n = mx.querySelector('.fr-n'), d = mx.querySelector('.fr-d');
      mx.replaceWith(` ${w ? w.textContent : ''} ו${fracWords(n && n.textContent, d && d.textContent)} `);
    });
    div.querySelectorAll('.fr').forEach((f) => { const n = f.querySelector('.fr-n'), d = f.querySelector('.fr-d'); f.replaceWith(` ${fracWords(n ? n.textContent : '', d ? d.textContent : '')} `); });
    div.querySelectorAll('.slot, .qbox').forEach((s) => s.replaceWith(' כמה '));
    div.querySelectorAll('br').forEach((b) => b.replaceWith('. '));
    let t = div.textContent;
    t = t.replace(/(\d),(\d{3})/g, '$1$2')
      .replace(/(\d)\s*×\s*(\d)/g, '$1 כפול $2').replace(/×/g, ' כפול ')
      .replace(/(\d)\s*:\s*(\d)/g, '$1 לחלק ל-$2')
      .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 פחות $2').replace(/\s−\s/g, ' פחות ')
      .replace(/\+/g, ' ועוד ').replace(/=/g, ' שווה ')
      .replace(/(\S)\s*<\s*(\S)/g, '$1 קטן מ-$2').replace(/(\S)\s*>\s*(\S)/g, '$1 גדול מ-$2')
      .replace(/(\d)\s*%/g, '$1 אחוז').replace(/₪/g, ' שקלים').replace(/°/g, ' מעלות')
      .replace(/סמ"ר/g, 'סנטימטר רבוע').replace(/מ"ר/g, 'מטר רבוע').replace(/ס"מ/g, 'סנטימטר').replace(/מ"מ/g, 'מילימטר').replace(/ק"מ/g, 'קילומטר').replace(/ק"ג/g, 'קילוגרם');
    return t.replace(/\s+/g, ' ').trim();
  };
  HM.speak = function (html, opts) {
    const p = HM.store && HM.store.current();
    const v = pickVoice(p);
    if (!('speechSynthesis' in window) || !v) return false;
    const s = window.speechSynthesis;
    if (s.speaking && !(opts && opts.force)) { s.cancel(); return true; }
    s.cancel();
    let text = opts && opts.plain ? html : HM.speechText(html);
    // שם הילד לא נשלח לשירות ההקראה (מדיניות פרטיות, סעיף 8)
    if (p && p.name && p.name.length > 1) text = text.split(p.name).join('');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = v.lang || 'he-IL'; u.voice = v;
    const slow = p && p.settings && p.settings.rate === 'slow';
    const natural = NATURAL.test(v.name);
    u.rate = (slow ? 0.82 : 0.97) * (natural ? 1 : 0.98);
    // קול צעיר: הרמה עדינה של הגובה בקולות המערכת (הקולות הטבעיים כבר צעירים)
    u.pitch = natural ? 1.0 : 1.12;
    s.speak(u); return true;
  };
  HM.stopSpeak = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };

  /* ---------- קונפטי ---------- */
  HM.confetti = function (power) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cv = document.getElementById('confetti');
    if (!cv) { cv = document.createElement('canvas'); cv.id = 'confetti'; document.body.appendChild(cv); }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const cs = getComputedStyle(document.documentElement);
    const cols = ['--p', '--s', '--a', '--good'].map((v) => cs.getPropertyValue(v).trim() || '#ffc21a').concat(['#ff7f9e', '#59c3f5']);
    const N = Math.round(90 * (power || 1));
    const parts = Array.from({ length: N }, (_, i) => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.42,
      vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      w: 8 + Math.random() * 8, h: 5 + Math.random() * 6, c: cols[i % cols.length], shape: i % 3,
    }));
    let frame = 0;
    (function tick() {
      g.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
        if (p.shape === 0) g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else if (p.shape === 1) { g.beginPath(); g.arc(0, 0, p.h / 1.5, 0, 7); g.fill(); }
        else { g.beginPath(); g.moveTo(0, -p.h); g.lineTo(p.w / 2, p.h / 2); g.lineTo(-p.w / 2, p.h / 2); g.fill(); }
        g.restore();
      });
      if (++frame < 170) requestAnimationFrame(tick); else g.clearRect(0, 0, innerWidth, innerHeight);
    })();
  };

  /* ---------- רטט ---------- */
  HM.buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms || 30); } catch (e) { /* לא נתמך */ } };
})(HM);
