/* Silescrow Cup V 4.2 – js/gluecksrad.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

// V3.52: Liga-Auswahl mit klaren Knöpfen statt Browser-Dialog (OK / Abbrechen)
// V7.0: GLÜCKSRAD bei neuer Liga (Regenbogen-Design) – Gold 1 %, Silber 6 %, Bronze 20 %, Crows 23 % (1000 / 2000 / 5000), Niete 50 %
function radGesehen(){   // V11.10: Rad nur einmal im ganzen Spiel – mehrfach abgesichert
  if (window.__radNie) return true;
  try { if (LS81.getItem('radEinmalig') === '1') return true; } catch (e) {}
  try { if (window.localStorage.getItem('sc_radNie') === '1') return true; } catch (e) {}
  try { if (window.sessionStorage.getItem('sc_radNie') === '1') return true; } catch (e) {}
  try { if (String(window.name).indexOf('scRadNie') >= 0) return true; } catch (e) {}
  try { if (STAND.daten.radNie) return true; } catch (e) {}
  return false;
}
function radMerken(){
  window.__radNie = true;
  try { LS81.setItem('radEinmalig', '1'); } catch (e) {}
  try { window.localStorage.setItem('sc_radNie', '1'); } catch (e) {}
  try { window.sessionStorage.setItem('sc_radNie', '1'); } catch (e) {}
  try { if (String(window.name).indexOf('scRadNie') < 0) window.name = window.name + ' scRadNie'; } catch (e) {}
  try { STAND.daten.radNie = true; LS81.setItem('sc_stand', JSON.stringify(STAND.daten)); } catch (e) {}
}
function gluecksradZeigen(weiter, behalten, erstEintritt){
  const alt = document.getElementById('gluecksrad'); if (alt) alt.remove();
  if (!erstEintritt){ try { weiter(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } return; }   // V11.10: Rad kommt NUR beim allerersten Betreten des Spiels – nie bei Liga, Saison oder Neustart
  const __einmal = radGesehen();
  if (__einmal){ try { weiter(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } return; }   // V11.9: Glücksrad nur beim allerersten Mal im Spiel
  if (window.__radGedreht){ try { weiter(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } return; }   // schon gedreht, Liga wurde aber noch nicht gestartet: kein zweites Mal drehen
  radMerken();   // V11.10: Glücksrad erscheint nie wieder, auch nicht nach Abbruch und Neustart der Liga
  const SEG = [{ t: 'gold' }, { t: 'niete' }, { t: 'cr', v: 1000 }, { t: 'bronze' }, { t: 'silber' }, { t: 'niete' }, { t: 'cr', v: 2000 }, { t: 'bronze' },
               { t: 'frage' }, { t: 'niete' }, { t: 'cr', v: 4000 }, { t: 'bronze' }, { t: 'nochmal' }, { t: 'niete' }];   // V11.19: 14 Felder – Gold und Silber nur je einmal, 4 Nieten, ? (Silber/Gold), NOCHMAL   // V11.16: Silber 2×, Bronze 3× · V11.17: Feld NOCHMAL DREHEN   // V11.16: höhere Crow-Felder
  const W = 360 / SEG.length, f = x => x.toFixed(2);
  const stern = (cx, cy, r, ri) => { const p = []; for (let i = 0; i < 10; i++){ const a = Math.PI / 5 * i, q = i % 2 ? ri : r; p.push(f(cx + q * Math.sin(a)) + ',' + f(cy - q * Math.cos(a))); } return p.join(' '); };
  const pt = (r, t) => f(r * Math.sin(t)) + ' ' + f(-r * Math.cos(t));
  const inhalt = g => {
    if (g.t === 'frage') return '<rect x="-11" y="-89" width="22" height="28" rx="3" fill="url(#grFrage)" stroke="#000" stroke-width="1.8"/>' +
      '<text y="-67" text-anchor="middle" font-size="21" fill="#fff" style="font-family:Arial,sans-serif;font-weight:900;paint-order:stroke;stroke:#000;stroke-width:3px">?</text>' +
      '';
    if (g.t === 'nochmal') return '<circle cy="-76" r="11" fill="#fff" stroke="#000" stroke-width="2"/><path d="M-5.5 -79A6 6 0 1 1 -4 -72" fill="none" stroke="#1a8f3c" stroke-width="2.6" stroke-linecap="round"/><polygon points="-9,-80 -2.5,-81 -5.5,-75" fill="#1a8f3c"/>' +
      '<text y="-53" text-anchor="middle" font-size="7.2" fill="#fff" style="font-family:Arial,sans-serif;font-weight:900;paint-order:stroke;stroke:#000;stroke-width:2.6px;stroke-linejoin:round">NOCHMAL</text>';
    if (g.t === 'niete') return '<path d="M-7 -81L7 -65M7 -81L-7 -65" stroke="#000" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M-7 -81L7 -65M7 -81L-7 -65" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none"/>';
    if (g.t === 'cr') return '<circle cy="-77" r="10" fill="#ffcf33" stroke="#000" stroke-width="1.8"/><circle cy="-77" r="6.4" fill="none" stroke="#b8860b" stroke-width="1.5"/><text y="-73" text-anchor="middle" font-size="11" font-weight="800" fill="#8a5a00" font-family="Arial,sans-serif">C</text>' +
      '<text y="-52" text-anchor="middle" font-size="' + (g.v >= 10000 ? 10 : 11.5) + '" fill="#fff" style="font-family:Arial,sans-serif;font-weight:900;paint-order:stroke;stroke:#000;stroke-width:3.4px;stroke-linejoin:round">' + String(g.v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '</text>';
    const col = { gold: '#ffcf33', silber: '#d5dbe8', bronze: '#cd7f32' }[g.t];
    return '<rect x="-9" y="-88" width="18" height="26" rx="2.5" fill="' + col + '" stroke="#000" stroke-width="1.8"/><rect x="-9" y="-88" width="18" height="4.5" fill="#000" opacity=".28"/><rect x="-9" y="-66.5" width="18" height="4.5" fill="#000" opacity=".28"/><polygon points="' + stern(0, -75, 6.2, 2.8) + '" fill="#fff" stroke="#000" stroke-width="1"/>';
  };
  let rad = '<defs><linearGradient id="grFrage" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#d5dbe8"/><stop offset=".5" stop-color="#ffcf33"/></linearGradient></defs><circle r="111" fill="#ffffff" stroke="#000" stroke-width="3.5"/><circle r="99" fill="#000"/>';
  SEG.forEach((g, i) => {   // V11.16: erst alle Felder, dann alle Beschriftungen (sonst überdeckt das nächste Feld die Zahl)
    const a0 = i * W * Math.PI / 180, a1 = (i + 1) * W * Math.PI / 180;
    rad += '<path d="M0 0L' + pt(97, a0) + 'A97 97 0 0 1 ' + pt(97, a1) + 'Z" fill="hsl(' + Math.round(i * 360 / SEG.length) + ',85%,58%)" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>';
  });
  SEG.forEach((g, i) => { rad += '<g transform="rotate(' + f((i + 0.5) * W) + ')">' + inhalt(g) + '</g>'; });
  let l1 = '', l2 = '';
  for (let i = 0; i < 24; i++){
    const a = i * Math.PI / 12, x = 105 * Math.sin(a), y = -105 * Math.cos(a);
    const e = '<polygon points="' + stern(x, y, 5.6, 2.4) + '" fill="' + (i % 2 ? '#ffe234' : '#ffffff') + '" stroke="#000" stroke-width=".9"/>';
    if (i % 2) l2 += e; else l1 += e;
  }
  rad += '<g class="gr-l1">' + l1 + '</g><g class="gr-l2">' + l2 + '</g><circle r="15" fill="#fff" stroke="#000" stroke-width="3"/><circle r="5" fill="#000" opacity=".3"/>';
  const o = document.createElement('div'); o.id = 'gluecksrad';
  o.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:10px;overflow:auto';
  o.innerHTML = '<style>#gluecksrad .gr-l1{animation:grb 0.7s steps(1) infinite}#gluecksrad .gr-l2{animation:grb 0.7s steps(1) infinite reverse}@keyframes grb{0%{opacity:1}50%{opacity:.25}100%{opacity:1}}'
    + '#gluecksrad .gr-box>*:not(.gr-rad){grid-column:2}#gluecksrad .gr-box{max-height:calc(100vh - 20px);box-sizing:border-box}'
    + '@media (orientation:landscape) and (max-height:620px){#gluecksrad .gr-box{display:grid;grid-template-columns:min(calc(100vh - 60px),340px) 1fr;column-gap:16px;align-items:center;width:min(96vw,780px)!important;align-content:center}#gluecksrad .gr-rad{grid-column:1;grid-row:1 / span 6;width:100%!important;margin:0!important}}'
    + '@media not ((orientation:landscape) and (max-height:620px)){#gluecksrad .gr-box>*{grid-column:auto}}</style>' +
    '<div class="gr-box" style="width:min(94vw,620px);background:#0c173d;color:#fff;border:3px solid #000;border-radius:18px;box-shadow:6px 6px 0 #000;padding:14px;text-align:center;font-family:var(--text,Arial,sans-serif)">' +
    '<div style="font:400 34px/1 var(--display,Impact);color:#ffe234;letter-spacing:1px;text-shadow:2px 2px 0 #000">GLÜCKSRAD</div>' +
    '<div style="font-weight:700;color:#cbd7f3;margin:4px 0 8px;font-size:14px">Willkommen – du darfst das Rad 2× drehen! Gold ist sehr selten, Silber selten, Bronze realistisch.</div>' +
    '<div class="gr-rad" style="position:relative;width:min(64vmin,330px);margin:0 auto">' +
      '<svg id="grSvg" viewBox="-124 -124 248 248" style="width:100%;display:block;transition:transform 5.2s cubic-bezier(.12,.62,.08,1)">' + rad + '</svg>' +
      '<svg viewBox="-124 -124 248 248" style="position:absolute;left:0;top:0;width:100%;pointer-events:none"><polygon points="-11,-123 11,-123 0,-97" fill="#ff3b3b" stroke="#000" stroke-width="3" stroke-linejoin="round"/></svg></div>' +
    '<div id="grText" style="min-height:46px;margin:10px 0 4px;font-weight:900;font-size:18px;line-height:1.25"></div>' +
    '<button type="button" id="grDreh" style="width:100%;height:50px;border:3px solid #000;border-radius:12px;background:#ffe234;color:#10162e;font:900 22px/1 var(--text,Arial,sans-serif);box-shadow:3px 3px 0 #000;cursor:pointer">🎡 DREHEN</button>' +
    '<button type="button" id="grZu" style="width:100%;height:40px;margin-top:8px;border:2px solid #000;border-radius:10px;background:#33456f;color:#fff;font:800 15px/1 var(--text,Arial,sans-serif);cursor:pointer">ABBRECHEN</button></div>';
  document.body.appendChild(o);
  const svg = o.querySelector('#grSvg'), txt = o.querySelector('#grText'), dreh = o.querySelector('#grDreh'), zu = o.querySelector('#grZu');
  let gedreht = false, winkel = 0, drehNr = 0, erstMsg = '';   // 2 Drehungen hintereinander
  zu.addEventListener('click', () => { if (!gedreht) o.remove(); });
  dreh.addEventListener('click', () => {
    if (gedreht) return; gedreht = true; window.__radGedreht = true; radMerken(); zu.hidden = true; dreh.disabled = true; dreh.style.opacity = '.5';
    if (drehNr > 0) txt.innerHTML = '<small style="color:#cbd7f3">1. Drehung</small><br>' + erstMsg;
    const r = Math.random() * 100;
    const typ = r < 1 ? 'gold' : r < 6 ? 'silber' : r < 36 ? 'bronze' : r < 74 ? 'cr' : r < 84 ? 'nochmal' : r < 88 ? 'frage' : 'niete';   // V3.05: Gold 1 %, Silber 5 %, Bronze 30 %, Crows 38 %, Nochmal 10 %, ? 4 %, Niete 12 % (Gold gesamt weiter 2 %)
    let wert = 0; if (typ === 'cr'){ const q = Math.random() * 100; wert = q < 60 ? 1000 : q < 90 ? 2000 : 4000; }   // V11.20
    const kand = SEG.map((g, i) => i).filter(i => SEG[i].t === typ && (typ !== 'cr' || SEG[i].v === wert));
    const idx = kand[(Math.random() * kand.length) | 0];
    const versatz = (Math.random() - 0.5) * W * 0.7;
    svg.style.transform = 'rotate(' + (winkel + 360 * 6 - ((idx + 0.5) * W + versatz)) + 'deg)';
    setTimeout(() => {
      if (typ === 'nochmal'){   // V11.17: gleich noch einmal drehen
        txt.innerHTML = '<span style="color:#58e070">🔄 NOCHMAL DREHEN!</span>';
        try { musik.sfx.jubel(true); } catch (e) {}
        gedreht = false; dreh.disabled = false; dreh.style.opacity = ''; dreh.innerHTML = '🔄 NOCHMAL DREHEN';
        winkel += 360 * 6; return;
      }
      const packTyp = typ === 'frage' ? (Math.random() < .25 ? 'gold' : 'silber') : typ;   // V11.18: Fragezeichen = Silber (75 %) oder Gold (25 %)
      let g = {}; try { g = STAND.radGewinn(packTyp === 'gold' || packTyp === 'silber' || packTyp === 'bronze' ? packTyp : null, typ === 'cr' ? wert : 0, drehNr > 0 ? true : !!behalten, drehNr > 0); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
      const NAMEN = { gold: '🥇 GOLD-PACK', silber: '🥈 SILBER-PACK', bronze: '🥉 BRONZE-PACK' };
      const zt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      let msg;
      if (g.pack) msg = '<span style="color:#ffe234">' + (typ === 'frage' ? '❓ Überraschung: ' : '') + NAMEN[g.pack] + ' gewonnen!</span><br><small style="font-weight:700;color:#cbd7f3">Du findest es im Pack-Shop bei „Deine ungeöffneten Packs“. Achtung: Es verfällt, wenn du mitten in der Liga neu startest. Nach einer beendeten Saison bleibt es.</small>';
      else if (g.ersatz) msg = '<span style="color:#ffe234">' + NAMEN[packTyp] + (g.voll ? ' – du hast noch ein ungeöffnetes Rad-Pack!' : ' – aber du hast schon alle Spieler!') + '</span><br><small style="font-weight:700;color:#cbd7f3">Dafür: <span class="sc-muenze">C</span> ' + zt(g.cr) + ' Crows.</small>';
      else if (g.cr) msg = '<span style="color:#58e070"><span class="sc-muenze">C</span> +' + zt(g.cr) + ' Crows!</span>';
      else msg = '<span style="color:#9fb0d7">Niete – diesmal nichts. Viel Glück im Spiel!</span>';
      drehNr++;
      try { if (g.pack || g.ersatz || g.cr >= 2000) musik.sfx.jubel(true); } catch (e) {}
      if (drehNr < 2){   // erste Drehung fertig: gleich ein zweites Mal drehen
        erstMsg = msg; txt.innerHTML = '<small style="color:#cbd7f3">1. Drehung</small><br>' + msg;
        gedreht = false; dreh.disabled = false; dreh.style.opacity = ''; dreh.innerHTML = '🎡 ZWEITE DREHUNG';
        winkel += 360 * 6; return;
      }
      txt.innerHTML = '<small style="color:#cbd7f3">1. Drehung</small><br>' + erstMsg + '<br><small style="color:#cbd7f3">2. Drehung</small><br>' + msg;
      dreh.style.display = 'none';   // V10.8: kein Weiter-Knopf mehr – das Rad verschwindet nach dem Drehen von selbst
      setTimeout(() => { o.remove(); try { weiter(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } }, 4200);
    }, 5400);
  });
}