/* Silescrow Cup V 4.2 – js/flaggen-wetter.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

// =====================================================================
// GEZEICHNETE FLAGGEN: flach, kräftige Farben, dicke Kontur, wehender Stoff
// =====================================================================
const FLAGGEN_DEF = {
  'Deutschland':  { h: ['#1a1a1a', '#e3061b', '#ffce00'] },
  'Türkei':       { bg: '#e30a17', sym: 'halbmond' },
  'Spanien':      { h: ['#c60b1e', '#ffc400', '#c60b1e'], hw: [1, 2, 1] },
  'Frankreich':   { v: ['#1f4fbf', '#ffffff', '#ef4135'] },
  'Italien':      { v: ['#0b9a49', '#ffffff', '#d72f3c'] },
  'England':      { bg: '#ffffff', sym: 'kreuz', c: '#d0103a' },
  'Niederlande':  { h: ['#c8102e', '#ffffff', '#1f4fbf'] },
  'Portugal':     { v: ['#0b7a2e', '#e4141f'], vw: [2, 3], sym: 'kreis', c: '#ffd200', x: .4, r: .2 },
  'Belgien':      { v: ['#1a1a1a', '#ffd90c', '#ef3340'] },
  'Kroatien':     { h: ['#e4141f', '#ffffff', '#1f3fa8'], sym: 'schach' },
  'Österreich':   { h: ['#e4141f', '#ffffff', '#e4141f'] },
  'Schweiz':      { bg: '#e4141f', sym: 'plus' },
  'Dänemark':     { bg: '#d0103a', sym: 'nord', c: '#ffffff' },
  'Polen':        { h: ['#ffffff', '#e4141f'] },
  'Brasilien':    { bg: '#0ba14b', sym: 'raute' },
  'Argentinien':  { h: ['#78b9ec', '#ffffff', '#78b9ec'], sym: 'sonne', x: .5, y: .5 },
  'Uruguay':      { streifen: ['#ffffff', '#2f6fd6'], n: 9, sym: 'sonne', x: .17, y: .25, eckeWeiss: true },
  'Kolumbien':    { h: ['#ffd200', '#1f3fa8', '#e4141f'], hw: [2, 1, 1] },
  'Mexiko':       { v: ['#0b7a46', '#ffffff', '#d7232f'], sym: 'adler' },
  'USA':          { sym: 'usa' },
  'Japan':        { bg: '#ffffff', sym: 'kreis', c: '#d0103a', r: .28 },
  'Südkorea':     { bg: '#ffffff', sym: 'korea' },
  'Marokko':      { bg: '#d0103a', sym: 'stern', c: '#0b7a3e', leer: true },
  'Senegal':      { v: ['#0b8a43', '#ffe12e', '#e4141f'], sym: 'stern', c: '#0b8a43' },
  'Nigeria':      { v: ['#0b8a50', '#ffffff', '#0b8a50'] },
  'Ägypten':      { h: ['#d0103a', '#ffffff', '#1a1a1a'], sym: 'kreis', c: '#d4a017', r: .12 },
  'Australien':   { bg: '#1b2f8f', sym: 'australien' },
  'Saudi-Arabien':{ bg: '#0b7a3e', sym: 'saudi' },
  'Iran':         { h: ['#239f40', '#ffffff', '#e4141f'], sym: 'kreis', c: '#e4141f', r: .1 },
  'Kanada':       { v: ['#e4141f', '#ffffff', '#e4141f'], vw: [1, 2, 1], sym: 'ahorn' },
  'Chile':        { sym: 'chile' },
  'Costa Rica':   { h: ['#1f3fa8', '#ffffff', '#e4141f', '#ffffff', '#1f3fa8'], hw: [1, 1, 2, 1, 1] }
};
function stern(g, x, y, r, zacken = 5, innen = .45){
  g.beginPath();
  for (let i = 0; i < zacken * 2; i++){ const a = -Math.PI / 2 + i * Math.PI / zacken, rr = i % 2 ? r * innen : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}
function flaggeMalen(g, name, W, H){
  const d = FLAGGEN_DEF[name] || { bg: '#888' };
  const streifen = (farben, gew, quer) => {
    const sum = (gew || farben.map(() => 1)).reduce((a, b) => a + b, 0); let p = 0;
    farben.forEach((c, i) => { const w = (gew ? gew[i] : 1) / sum; g.fillStyle = c;
      if (quer) g.fillRect(0, p * H, W, w * H + 1); else g.fillRect(p * W, 0, w * W + 1, H); p += w; });
  };
  if (d.bg){ g.fillStyle = d.bg; g.fillRect(0, 0, W, H); }
  if (d.h) streifen(d.h, d.hw, true);
  if (d.v) streifen(d.v, d.vw, false);
  if (d.streifen){ for (let i = 0; i < d.n; i++){ g.fillStyle = d.streifen[i % 2]; g.fillRect(0, i * H / d.n, W, H / d.n + 1); } if (d.eckeWeiss){ g.fillStyle = '#fff'; g.fillRect(0, 0, W * .36, H * 5 / 9); } }
  const x = (d.x || .5) * W, y = (d.y || .5) * H;
  switch (d.sym){
    case 'halbmond':
      g.fillStyle = '#fff'; g.beginPath(); g.arc(W * .4, H * .5, H * .27, 0, Math.PI * 2); g.fill();
      g.fillStyle = d.bg; g.beginPath(); g.arc(W * .45, H * .5, H * .215, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; stern(g, W * .63, H * .5, H * .13); g.fill(); break;
    case 'kreis': g.fillStyle = d.c; g.beginPath(); g.arc(x, y, H * (d.r || .25), 0, Math.PI * 2); g.fill();
      if (name === 'Portugal'){ g.strokeStyle = '#1a1a1a'; g.lineWidth = H * .03; g.stroke(); g.fillStyle = '#e4141f'; g.fillRect(x - H * .1, y - H * .12, H * .2, H * .22); } break;
    case 'kreuz': g.fillStyle = d.c; g.fillRect(W * .42, 0, W * .16, H); g.fillRect(0, H * .38, W, H * .24); break;
    case 'plus': g.fillStyle = '#fff'; g.fillRect(W * .5 - H * .1, H * .2, H * .2, H * .6); g.fillRect(W * .5 - H * .3, H * .4, H * .6, H * .2); break;
    case 'nord': g.fillStyle = d.c; g.fillRect(W * .3, 0, H * .16, H); g.fillRect(0, H * .42, W, H * .16); break;
    case 'raute':
      g.fillStyle = '#ffd200'; g.beginPath(); g.moveTo(W * .5, H * .1); g.lineTo(W * .92, H * .5); g.lineTo(W * .5, H * .9); g.lineTo(W * .08, H * .5); g.closePath(); g.fill();
      g.fillStyle = '#1d3f9e'; g.beginPath(); g.arc(W * .5, H * .5, H * .23, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = H * .05; g.beginPath(); g.arc(W * .5, H * .85, H * .42, -Math.PI * .72, -Math.PI * .28); g.stroke(); break;
    case 'sonne':
      g.fillStyle = '#ffc61a'; for (let i = 0; i < 12; i++){ const a = i * Math.PI / 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - .14) * H * .2, y + Math.sin(a - .14) * H * .2); g.lineTo(x + Math.cos(a + .14) * H * .2, y + Math.sin(a + .14) * H * .2); g.closePath(); g.fill(); }
      g.beginPath(); g.arc(x, y, H * .09, 0, Math.PI * 2); g.fill(); break;
    case 'adler': g.fillStyle = '#8b5a2b'; g.beginPath(); g.ellipse(W * .5, H * .5, H * .13, H * .15, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#0b7a46'; g.lineWidth = H * .035; g.beginPath(); g.arc(W * .5, H * .52, H * .19, Math.PI * .15, Math.PI * .85); g.stroke(); break;
    case 'usa':
      for (let i = 0; i < 13; i++){ g.fillStyle = i % 2 ? '#fff' : '#d0103a'; g.fillRect(0, i * H / 13, W, H / 13 + 1); }
      g.fillStyle = '#1b2f8f'; g.fillRect(0, 0, W * .42, H * 7 / 13);
      g.fillStyle = '#fff'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++){ stern(g, W * (.05 + c * .08) + (r % 2) * W * .04, H * (.07 + r * .12), H * .035); g.fill(); } break;
    case 'korea':
      g.fillStyle = '#d0103a'; g.beginPath(); g.arc(W * .5, H * .5, H * .24, Math.PI, 0); g.fill();
      g.fillStyle = '#1f3fa8'; g.beginPath(); g.arc(W * .5, H * .5, H * .24, 0, Math.PI); g.fill();
      g.fillStyle = '#d0103a'; g.beginPath(); g.arc(W * .5 - H * .12, H * .5, H * .12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1f3fa8'; g.beginPath(); g.arc(W * .5 + H * .12, H * .5, H * .12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1a1a'; [[.18, .2, .6], [.82, .2, -.6], [.18, .8, -.6], [.82, .8, .6]].forEach(([fx, fy, a]) => { g.save(); g.translate(W * fx, H * fy); g.rotate(a); for (let i = -1; i <= 1; i++) g.fillRect(-H * .1, i * H * .05 - H * .015, H * .2, H * .03); g.restore(); }); break;
    case 'stern':
      stern(g, W * .5, H * .52, H * .27, 5, .38);
      if (d.leer){ g.strokeStyle = d.c; g.lineWidth = H * .05; g.stroke(); } else { g.fillStyle = d.c; g.fill(); } break;
    case 'australien':
      g.save(); g.beginPath(); g.rect(0, 0, W * .5, H * .5); g.clip();
      g.strokeStyle = '#fff'; g.lineWidth = H * .1; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * .5, H * .5); g.moveTo(W * .5, 0); g.lineTo(0, H * .5); g.stroke();
      g.strokeStyle = '#d0103a'; g.lineWidth = H * .04; g.stroke();
      g.fillStyle = '#fff'; g.fillRect(W * .2, 0, W * .1, H * .5); g.fillRect(0, H * .2, W * .5, H * .1);
      g.fillStyle = '#d0103a'; g.fillRect(W * .225, 0, W * .05, H * .5); g.fillRect(0, H * .225, W * .5, H * .05); g.restore();
      g.fillStyle = '#fff'; stern(g, W * .25, H * .77, H * .11, 7); g.fill();
      [[.75, .2], [.65, .48], [.86, .42], [.75, .8]].forEach(([fx, fy]) => { stern(g, W * fx, H * fy, H * .07, 7); g.fill(); }); break;
    case 'saudi':
      g.strokeStyle = '#fff'; g.lineWidth = H * .06; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * .22, H * .4); for (let i = 0; i <= 10; i++) g.lineTo(W * (.22 + i * .056), H * (.4 + (i % 2 ? -.06 : .03))); g.stroke();
      g.beginPath(); g.moveTo(W * .25, H * .68); g.lineTo(W * .75, H * .68); g.stroke(); g.beginPath(); g.moveTo(W * .25, H * .68); g.lineTo(W * .3, H * .62); g.stroke(); break;
    case 'ahorn': {
      g.fillStyle = '#e4141f'; const cx = W * .5, cy = H * .48, r = H * .3;
      g.beginPath();
      const p = [[0,-1],[.18,-.55],[.45,-.7],[.38,-.25],[.75,-.35],[.62,0],[.85,.12],[.35,.32],[.4,.5],[.06,.42],[.06,.8],[-.06,.8],[-.06,.42],[-.4,.5],[-.35,.32],[-.85,.12],[-.62,0],[-.75,-.35],[-.38,-.25],[-.45,-.7],[-.18,-.55]];
      p.forEach(([a, b], i) => i ? g.lineTo(cx + a * r, cy + b * r) : g.moveTo(cx + a * r, cy + b * r)); g.closePath(); g.fill(); break; }
    case 'chile':
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H / 2); g.fillStyle = '#d0103a'; g.fillRect(0, H / 2, W, H / 2);
      g.fillStyle = '#1f3fa8'; g.fillRect(0, 0, H / 2, H / 2); g.fillStyle = '#fff'; stern(g, H / 4, H / 4, H * .12); g.fill(); break;
    case 'schach': {
      const s = H * .085, x0 = W * .5 - s * 2.5, y0 = H * .22;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){ g.fillStyle = (r + c) % 2 ? '#fff' : '#e4141f'; g.fillRect(x0 + c * s, y0 + r * s, s, s); }
      g.strokeStyle = '#1f3fa8'; g.lineWidth = H * .025; g.strokeRect(x0, y0, s * 5, s * 5); break; }
  }
}
const flaggenCache = {};
// gezeichnete Flagge als Canvas (wehend, mit dicker Kontur und Glanz)
function zeichneFlagge(name, W = 96, H = 66){
  const key = name + W + 'x' + H; if (flaggenCache[key]) return flaggenCache[key];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rand = Math.max(2, Math.round(H * .07)), w = W - rand * 2, h = H - rand * 2 - H * .08;
  const welle = x => Math.sin(x / w * Math.PI * 1.6 + .4) * H * .045;
  const form = () => {
    g.beginPath();
    for (let x = 0; x <= w; x += 2) g.lineTo(rand + x, rand + H * .04 + welle(x));
    for (let x = w; x >= 0; x -= 2) g.lineTo(rand + x, rand + H * .04 + h + welle(x));
    g.closePath();
  };
  // Schatten
  g.save(); g.translate(2, 3); form(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); g.restore();
  g.save(); form(); g.clip();
  g.translate(rand, rand + H * .04); 
  // Flagge leicht mitwellen: in schmalen Streifen versetzt zeichnen
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; flaggeMalen(tmp.getContext('2d'), name, w, h);
  for (let x = 0; x < w; x += 2) g.drawImage(tmp, x, 0, 2, h, x, welle(x), 2, h);
  g.setTransform(1, 0, 0, 1, 0, 0);
  // Stofffalten: helle und dunkle Bänder
  const gr = g.createLinearGradient(rand, 0, rand + w, 0);
  for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, i % 2 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.2)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(W * .32, H * .26, W * .26, H * .1, -.12, 0, Math.PI * 2); g.fill();
  g.restore();
  form(); g.lineWidth = Math.max(2, H * .065); g.strokeStyle = '#111'; g.lineJoin = 'round'; g.stroke();
  flaggenCache[key] = c; return c;
}
const flaggenURL = {};
function flaggeSrc(name){ return flaggenURL[name] || (flaggenURL[name] = zeichneFlagge(name, 96, 66).toDataURL()); }
function flaggeHTML(name, cls = ''){ return '<img class="cflag ' + cls + '" src="' + flaggeSrc(name) + '" alt="' + name + '">'; }

// ---------- Wetter und Anstoßzeit für ein Spiel auslosen (trocken häufiger als Regen/Schnee) ----------
// V4.5: Jahreszeiten – nach echtem Datum, in der Liga über die Spieltage (Hinrunde Herbst → Winter → Rückrunde Frühling)
function jahreszeitVonMonat(m){ return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'fruehling' : m <= 7 ? 'sommer' : 'herbst'; }   // m: 0 = Januar
function jahreszeitJetzt(){ return jahreszeitVonMonat(new Date().getMonth()); }
function jahreszeitLiga(tag, tage){ const monat = (7 + Math.floor(klemmeG(tag / Math.max(1, tage), 0, .999) * 10)) % 12; return jahreszeitVonMonat(monat); }   // August … Mai
function klemmeG(v, a, b){ return Math.max(a, Math.min(b, v)); }
const JZ_NAME = { winter: 'Winter', fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst' };
function temperatur(jz, wetter, nacht){
  const basis = { winter: 2, fruehling: 13, sommer: 25, herbst: 12 }[jz] ?? 14;
  let t = basis + (Math.random() - .5) * 7;
  if (nacht) t -= 4; if (wetter === 'sonne') t += 4; if (wetter === 'regen') t -= 3;
  if (wetter === 'schnee') t = Math.min(t, -5 + Math.random() * 6);
  return Math.round(t);
}
function wetterAuslosen(jz){
  jz = jz || jahreszeitJetzt();
  const P = { sommer: [.45, .45, .10, 0], herbst: [.55, .15, .27, .03], winter: [.55, .08, .15, .22], fruehling: [.5, .3, .18, .02] }[jz] || [.54, .31, .1, .05];
  const r = Math.random();
  const wetter = r < P[0] ? 'klar' : r < P[0] + P[1] ? 'sonne' : r < P[0] + P[1] + P[2] ? 'regen' : 'schnee';
  const nacht = wetter !== 'sonne' && Math.random() < (jz === 'winter' ? .55 : jz === 'sommer' ? .3 : .4);
  const std = nacht ? (jz === 'winter' ? 17 : 18) + Math.floor(Math.random() * 3) : 13 + Math.floor(Math.random() * 4);
  const min = nacht && std === 18 ? 45 : [0, 15, 30, 45][(Math.random() * 4) | 0];
  return { wetter, nacht, anstoss: String(std).padStart(2, '0') + ':' + String(min).padStart(2, '0'), jz, temp: temperatur(jz, wetter, nacht) };
}
// kleines animiertes Wetter-Symbol (SVG, gezeichnet)
function wetterSymbol(w, nacht){
  const wolke = '<path d="M14 34h26a8 8 0 0 0 0-16 11 11 0 0 0-21-3 8 8 0 0 0-5 19z" fill="#fff" stroke="#111" stroke-width="3" stroke-linejoin="round"/>';
  const sonne = (x, y, r) => '<g class="ws-dreh" style="transform-origin:' + x + 'px ' + y + 'px">' + [0,45,90,135,180,225,270,315].map(a => '<rect x="' + (x - 2) + '" y="' + (y - r - 9) + '" width="4" height="7" rx="2" fill="#ffc61a" stroke="#111" stroke-width="1.5" transform="rotate(' + a + ' ' + x + ' ' + y + ')"/>').join('') + '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#ffd23a" stroke="#111" stroke-width="3"/></g>';
  const mond = '<path class="ws-glueh" d="M40 6a12 12 0 1 0 10 18 10 10 0 1 1-10-18z" fill="#ffe9a6" stroke="#111" stroke-width="2.5"/>';
  let inhalt = '';
  if (w === 'sonne') inhalt = sonne(26, 24, 10);
  else if (w === 'klar') inhalt = (nacht ? '' : sonne(34, 16, 8)) + wolke;
  else if (w === 'regen') inhalt = wolke + [16, 26, 36].map((x, i) => '<line class="ws-fall" style="animation-delay:' + (i * .25) + 's" x1="' + x + '" y1="38" x2="' + (x - 3) + '" y2="46" stroke="#3fa9ff" stroke-width="3" stroke-linecap="round"/>').join('');
  else if (w === 'schnee') inhalt = wolke + [16, 26, 36].map((x, i) => '<circle class="ws-fall" style="animation-delay:' + (i * .3) + 's" cx="' + x + '" cy="42" r="2.6" fill="#fff" stroke="#111" stroke-width="1"/>').join('');
  return '<svg class="wsym" viewBox="0 0 56 50">' + (nacht ? mond : '') + inhalt + '</svg>';
}