/* Silescrow Cup V 4.2 – js/liga-online-menue.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

// V4.0: Laufende Liga sperrt Land und Stufe im Hauptmenü; nur NEUE LEAGUE (oder kein Liga-Stand) macht sie wieder wählbar
window.__ligaNeuWahl = false;
function ligaLandVon(l){ if (typeof l === 'number') l = COUNTRY_DATABASE[l]; else if (typeof l === 'string') l = COUNTRY_DATABASE.find(c => c[0] === l); return Array.isArray(l) ? l : null; }
function ligaGesperrt(){
  try {
    if (window.__ligaNeuWahl) return false;
    if (typeof istGastModus === 'function' && istGastModus()) return false;
    if (typeof onlineVerbunden === 'function' && onlineVerbunden()) return false;
    return !!LIGA.info;
  } catch (e) { return false; }
}
window.ligaGesperrt = ligaGesperrt;
function ligaSperreAnwenden(){
  try {
    const g = ligaGesperrt();
    if (ligaSperreAnwenden.vorher !== g){ ligaSperreAnwenden.vorher = g; try { zustand.seite = 1; zeichneKarten(); } catch (e) {} }   // V10.7: Reihenfolge neu aufbauen
    const lk = document.getElementById('landKnopf'), sch = document.querySelector('.einstellungen .schalter.drei');
    if (lk){ lk.classList.toggle('gesperrt', g); lk.setAttribute('aria-disabled', g ? 'true' : 'false'); }
    if (sch){ sch.classList.toggle('gesperrt', g); }
    if (!g) return;
    const li = LIGA.info; if (!li) return;
    let ch = false;
    if (li.stufe && zustand.stufe !== li.stufe){ stufeMarkieren(li.stufe); ch = true; }
    const l = ligaLandVon(li.land);
    if (l && (!zustand.land || zustand.land[0] !== l[0])){ zustand.land = l; $('#landAnz').innerHTML = flaggeHTML(l[0]) + ' ' + l[0]; lk && lk.classList.remove('leer'); ch = true; }
    if (ch){ try { aktualisiere(); } catch (e) {} }
  } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
}
setInterval(ligaSperreAnwenden, 400);
function ligaNeuWahlOeffnen(){
  window.__ligaNeuWahl = true;
  ligaSperreAnwenden();
  toast('🆕 Neue League: Wähle erst ' + TEAM_GROESSE + ' plus ' + BANK_GROESSE + ' Spieler – dann tippe auf LEAGUE.');
}
function ligaNeuStarten(){
  const sb = $('#start');
  if (!sb || sb.disabled) { toast('Wähle zuerst alle ' + TEAM_GROESSE + ' Spieler und ' + BANK_GROESSE + ' Auswechselspieler.'); return; }
  let li = null; try { li = LIGA.info; } catch (e) {}
  gluecksradZeigen(() => {
    try { radMerken(); } catch (e) {}   // V11.12: jede gestartete Liga zählt – auch eine später abgebrochene Liga zeigt nie wieder ein Glücksrad
    window.__ligaModus = true;
    try { sb.click(); } finally { window.__ligaModus = false; window.__ligaNeuWahl = false; try { ligaSperreAnwenden(); } catch (e) {} }
  }, !!(li && li.tag != null && li.tage && li.tag >= li.tage),   // beendete Saison: Rad-Packs bleiben
  (() => { try { return !radGesehen() && SPIELE.n() === 0 && !LIGA.gespeichert && !li; } catch (e) { return false; } })());   // V11.11: Bonus-Rad nur für NEUE Spieler (noch kein Spiel, keine Liga, Rad nie gesehen) beim allerersten LEAGUE-Start
}
/* V3.02: goldener Preisstreifen in den Stufen-Knöpfen – zeigt, wie viele Crows es gibt (nicht beim Freundschaftsspiel) */
function scPokalStreifen(reihe, werte, info){
  if (!reihe || reihe.classList.contains('sc-pokal')) return;
  reihe.classList.add('sc-pokal');
  reihe.querySelectorAll('button').forEach(b => { const st = b.dataset.sf || b.dataset.hs; if (werte[st] == null) return; b.insertAdjacentHTML('beforeend', '<span class="sc-pokal-streifen">🏆 ' + Number(werte[st]).toLocaleString('de-DE') + ' <span class="sc-muenze">C</span></span>'); });
  reihe.insertAdjacentHTML('afterend', '<div class="sc-pokal-info">' + info + '</div>');
}
function stufeFrage(titel, mitLand, weiter){
  const alt = document.getElementById('wahlDialog'); if (alt) alt.remove();
  const o = document.createElement('div'); o.id = 'wahlDialog';
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px';
  const cur = ['leicht', 'mittel', 'stark'].includes(zustand.stufe) ? zustand.stufe : 'mittel';
  o.innerHTML = '<div class="box hofbox" role="dialog" aria-modal="true" style="width:100%"><h2>' + titel + '</h2>' +
    '<div class="hof-stufe"><button type="button" data-sf="leicht">Leicht</button><button type="button" data-sf="mittel">Mittel</button><button type="button" data-sf="stark">Stark</button></div>' +
    (mitLand ? '<div class="hof-knoepfe"><button type="button" id="sfLand" class="hof-n"></button></div>' : '') +
    '<div class="hof-knoepfe"><button type="button" id="sfGo" class="hof-t">▶ WEITER</button><button type="button" id="sfZu" class="hof-zu">ZURÜCK</button></div></div>';
  document.body.appendChild(o);
  if (titel === 'LEAGUE') try { scPokalStreifen(o.querySelector('.hof-stufe'), { leicht: 12000, mittel: 15000, stark: 20000 }, 'Crows für den Meistertitel · 5 Siege in Folge: +200 / 300 / 400'); } catch (e) {}   // V3.03
  else if (titel === 'SILESCROW CUP') try { scPokalStreifen(o.querySelector('.hof-stufe'), { leicht: 1500, mittel: 3000, stark: 5000 }, 'Crows für den Pokalsieg · 5 Siege in Folge: +200 / 300 / 400'); } catch (e) {}   // V3.03
  const marke = st => o.querySelectorAll('[data-sf]').forEach(b => b.classList.toggle('an', b.dataset.sf === st));
  marke(cur); if (cur !== zustand.stufe) stufeMarkieren(cur);
  o.querySelectorAll('[data-sf]').forEach(b => b.addEventListener('click', () => { stufeMarkieren(b.dataset.sf); marke(b.dataset.sf); }));
  let gewaehlt = false;
  const landTxt = () => (gewaehlt && zustand.land && zustand.land[0]) ? flaggeHTML(zustand.land[0]) + ' ' + zustand.land[0] : '🌍 Land wählen';
  const raster = document.getElementById('landRaster');
  const rasterKlick = e => { if (e.target.closest && e.target.closest('.landzelle')) gewaehlt = true; };
  if (mitLand && raster) raster.addEventListener('click', rasterKlick);
  let iv = null;
  if (mitLand){
    const lb = o.querySelector('#sfLand'); lb.innerHTML = landTxt() + ' ▾';
    iv = setInterval(() => {
      if (!document.body.contains(o)){ clearInterval(iv); return; }
      lb.innerHTML = landTxt() + ' ▾';
      const lu = document.getElementById('landUeber');
      if (o.style.display === 'none' && lu && lu.hidden) o.style.display = 'flex';   // Länderfenster zu → Dialog wieder zeigen
    }, 200);
    lb.addEventListener('click', () => { const lu = document.getElementById('landUeber'); if (lu){ o.style.display = 'none'; lu.hidden = false; } });
  }
  const zu = () => { if (iv) clearInterval(iv); if (raster) raster.removeEventListener('click', rasterKlick); o.remove(); };
  o.addEventListener('click', e => { if (e.target === o) zu(); });
  o.querySelector('#sfZu').addEventListener('click', zu);
  o.querySelector('#sfGo').addEventListener('click', () => {
    if (mitLand && !(zustand.land && zustand.land[0])){ toast('Wähle zuerst ein Land.'); return; }
    zu(); try { weiter(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  });
}
window.stufeFrage = stufeFrage;
function wahlDialog(titel, text, labelFort, labelNeu, fortFn, neuFn){
  const alt = document.getElementById('wahlDialog'); if (alt) alt.remove();
  const o = document.createElement('div'); o.id = 'wahlDialog';
  o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px';
  o.innerHTML = '<div class="box hofbox" role="dialog" aria-modal="true" style="width:100%"><h2>' + titel + '</h2>' +
    '<p class="mpklein">' + text + '</p><div class="hof-knoepfe">' +
    '<button type="button" id="wdFort" class="hof-t">' + labelFort + '</button>' +
    '<button type="button" id="wdNeu" class="hof-n">' + labelNeu + '</button>' +
    '<button type="button" id="wdZu" class="hof-zu">ZURÜCK</button></div></div>';
  document.body.appendChild(o);
  const zu = () => o.remove();
  o.addEventListener('click', e => { if (e.target === o) zu(); });
  o.querySelector('#wdZu').addEventListener('click', zu);
  o.querySelector('#wdFort').addEventListener('click', () => { zu(); try { fortFn(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } });
  o.querySelector('#wdNeu').addEventListener('click', () => { zu(); neuFn(); });
}
// V9.4: Team der gespeicherten Liga im Menü wieder markieren (Team, Torwart, Auswechselspieler)
function ligaTeamInsMenue(){
  let li = null; try { li = LIGA.info; } catch (e) {}
  if (!li || !Array.isArray(li.squad) || istGastModus()) return;
  zustand.squad = li.squad.filter(i => PLAYER_DATABASE[i]);
  zustand.torwart = li.torwart != null ? li.torwart : -1;
  if (li.stufe) stufeMarkieren(li.stufe);   // V4.5: Liga fortsetzen = Stufe der Liga
  zustand.ersatz = Array.isArray(li.ersatz) ? li.ersatz.filter(i => PLAYER_DATABASE[i]).slice(0, BANK_GROESSE) : [];
  try { ersatzSpeichern(); } catch (e) {}
  try { aktualisiere(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
}
// V5.7: Ist im Menü eine komplette Elf gewählt, spielt die fortgesetzte Liga mit genau diesem Team (vorher wurde es vom alten Liga-Team überschrieben)
// V5.9: In einer laufenden League bleiben die Spieler vom Liga-Start; dazukommen dürfen nur deine Pack-Spieler (Gold/Silber/Bronze)
function ligaErlaubt(){
  let li = null; try { li = LIGA.info; } catch (e) {}
  if (!li || !Array.isArray(li.squad)) return null;
  const ok = new Set([...li.squad, ...(li.ersatz || [])]);
  try { (STAND.daten.karten || []).forEach(n => { const i = PLAYER_DATABASE.findIndex(x => x.name === n); if (i >= 0 && PLAYER_DATABASE[i].stufe) ok.add(i); }); } catch (e) {}
  return ok;
}
function menueTeamFuerLiga(){
  if (istGastModus() || zustand.squad.length < TEAM_GROESSE) return null;
  const erl = ligaErlaubt();
  if (erl && zustand.squad.some(i => !erl.has(i))){
    const fremd = zustand.squad.filter(i => !erl.has(i)).map(i => PLAYER_DATABASE[i].name);
    setTimeout(() => { try { toast('🔒 In der laufenden League bleiben deine Spieler vom Start – nur Pack-Spieler dürfen dazu. ' + fremd.join(', ') + (fremd.length > 1 ? ' sind' : ' ist') + ' nicht dabei.'); } catch (e) {} }, 900);
    return null;
  }
  zustand.torwart = rolleDu === 'tor' ? 0 : besterTorwart();
  try { positionenAbgleichen(); } catch (e) {}
  const squad = zustand.squad.slice();
  let ersatz = (zustand.ersatz || []).filter(i => PLAYER_DATABASE[i] && !squad.includes(i) && (!erl || erl.has(i)));
  if (erl && ersatz.length < BANK_GROESSE) [...erl].filter(i => !squad.includes(i) && !ersatz.includes(i)).slice(0, BANK_GROESSE - ersatz.length).forEach(i => ersatz.push(i));
  if (!erl) ersatz = ersatzAuffuellen(squad);
  return { squad, torwart: zustand.torwart, menschTorwart: rolleDu === 'tor', nummern: Object.fromEntries(squad.map(i => [i, zustand.nummern[i]])), posi: { ...zustand.posi }, formation: zustand.formation, formSlot: { ...zustand.formSlot }, ersatz: ersatz.slice(0, BANK_GROESSE) };
}
// V5.9: Hinweis, wenn im Menü eine andere Stufe / ein anderes Land gewählt ist als in der laufenden League / im Silescrow Cup
function laufHinweis(info, name){
  if (!info) return;
  const STN = { leicht: 'Leicht', mittel: 'Mittel', stark: 'Stark' };
  let l = info.land; if (typeof l === 'number') l = COUNTRY_DATABASE[l]; else if (typeof l === 'string') l = COUNTRY_DATABASE.find(c => c[0] === l);
  const teile = [];
  if (info.stufe && zustand.stufe && info.stufe !== zustand.stufe) teile.push('auf ' + STN[info.stufe]);
  if (Array.isArray(l) && zustand.land && zustand.land[0] !== l[0]) teile.push('mit ' + l[0]);
  if (teile.length) setTimeout(() => { try { toast('ℹ️ ' + name + ' läuft ' + teile.join(' und ') + ' weiter. Für eine andere Stufe oder ein anderes Land starte neu.'); } catch (e) {} }, 400);
}
function ligaMitMenueTeamFortsetzen(){
  try { laufHinweis(LIGA.info, 'Die League'); } catch (e) {}
  const o = menueTeamFuerLiga();
  if (!o) ligaTeamInsMenue();
  const ok = LIGA.fortsetzen();
  if (ok && o) try { LIGA.teamAusMenue(o); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  return ok;
}
function ligaWahlZeigen(){
  let li = null; try { li = LIGA.info; } catch (e) {}
  const fertig = !!(li && li.tag != null && li.tage && li.tag >= li.tage);   // V7.0: beendete Saison -> LEAGUE FORTSETZEN öffnet die Abschlusstabelle, dort startet NÄCHSTE SAISON automatisch (gleiches Team, Land, Stufe; Rad-Pack bleibt)
  wahlDialog('SILESCROW LEAGUE', fertig ? 'Deine Saison ist beendet. Mit „Liga fortsetzen“ startest du die nächste Saison mit deinem Team – dein Rad-Pack bleibt.' : 'Du hast noch eine gespeicherte League.', '▶ LEAGUE FORTSETZEN', 'NEUE LEAGUE (alte wird ersetzt)', () => { ligaMitMenueTeamFortsetzen(); }, ligaNeuWahlOeffnen);
}
// V5.8: online nur Freundschaftsspiele
const ONLINE_NUR_FREUND = '🌐 Online gibt es nur Freundschaftsspiele. Silescrow Cup und League spielst du offline.';
const onlineVerbunden = () => { try { return !!((NETZ.rolle === 'host' && NETZ.gaeste && NETZ.gaeste.length) || (NETZ.rolle === 'gast' && NETZ.partner)); } catch (e) { return false; } };
setInterval(() => { const on = onlineVerbunden(); ['pokalKnopf', 'ligaKnopf'].forEach(id => { const k = document.getElementById(id); if (k) k.classList.toggle('online-aus', on); });
  // V5.9: Badge an LEAGUE / SILESCROW CUP: Land + Stufe der laufenden Runde
  const txt = x => { if (!x) return 'LÄUFT'; let l = x.land; if (typeof l === 'number') l = COUNTRY_DATABASE[l]; else if (typeof l === 'string') l = COUNTRY_DATABASE.find(c => c[0] === l); const n = Array.isArray(l) ? String(l[0]).slice(0, 3).toUpperCase() : ''; const st = { leicht: 'LEICHT', mittel: 'MITTEL', stark: 'STARK' }[x.stufe] || ''; return [n, st].filter(Boolean).join(' · ') || 'LÄUFT'; };
  let li = null, ti = null; try { li = LIGA.info; } catch (e) {} try { ti = TURNIER.info; } catch (e) {}
  const lk = document.getElementById('ligaKnopf'), pk = document.getElementById('pokalKnopf');
  if (lk && li) lk.dataset.info = txt(li); if (pk && ti) pk.dataset.info = txt(ti);
}, 600);
function modusStart81(m){
  const sb = $('#start');
  if (!sb || sb.disabled){ toast('Wähle zuerst alle ' + TEAM_GROESSE + ' Spieler und ' + BANK_GROESSE + ' Auswechselspieler.'); return; }
  window.__modus81 = m;
  try { sb.click(); } finally { window.__modus81 = null; }
}
// V5.3: neue Gold-/Silber-/Bronze-Karte kommt einfach in deinen Kader (beliebig viele Spieler) – deine Startelf bleibt, wie du sie gewählt hast
function karteInsTeam(i){
  const p = PLAYER_DATABASE[i]; if (!p) return null;
  try { zeichneKarten(); } catch (e) {} try { aktualisiere(); } catch (e) {}
  return p.name + ' ist jetzt in deinem Kader!';
}
// V5.3: Online-Bildschirm „BLAU gegen ROT“ – jeder tippt auf seine Flagge (Superteam oder Nation), ✅ BEREIT, der Gastgeber gibt den ANSTOSS
function vsSeite(seite){
  const L0 = fwOnlineLage(), ichHost = !L0.gast;
  const name = l => { const x = typeof l === 'number' ? COUNTRY_DATABASE[l] : (typeof l === 'string' ? COUNTRY_DATABASE.find(c => c[0] === l) : l); return x || null; };
  if (seite === 0){   // BLAU = Gastgeber
    if (ichHost){ const ok = !!($('#start') && !$('#start').disabled && zustand.land); return { land: zustand.land, art: zustand.teamArt || 'super', wer: (NETZ.name || 'Du') + ' (Gastgeber)', bereit: ok, ich: true }; }
    const t = NETZ.hostTeam; let hn = 'Gastgeber'; try { hn = (NETZ.lobbyGast[0] || {}).name || hn; } catch (e) {}
    return { land: t && name(t.land), art: (t && t.art) || 'super', wer: hn, bereit: !!(t && t.sq && t.sq.length === TEAM_GROESSE && t.land), ich: false };
  }
  // ROT = Gast (Blau gegen Rot) oder KI (zusammen gegen die KI)
  if (!ichHost){ const ok = !!(zustand.squad.length === TEAM_GROESSE && zustand.land); return { land: zustand.land, art: zustand.teamArt || 'super', wer: (NETZ.name || 'Du') + ' (Gast)', bereit: ok, ich: true }; }
  const g = (() => { try { return gegnerTeamGast(); } catch (e) { return null; } })();
  if (g){ const q = g.gt; return { land: q && name(q.land), art: (q && q.art) || 'super', wer: g.nm || 'Gast', bereit: (() => { try { return gegnerTeamOK(g); } catch (e) { return false; } })(), ich: false }; }
  return { land: null, art: 'leer', wer: 'Wartet auf einen Mitspieler …', bereit: false, ich: false, leer: true };   // V8.1: online keine KI-Gegner – nur echte Spieler
}
function vsZeichnen(){
  const o = document.getElementById('vsUeber'); if (!o || o.hidden) return;
  const L0 = fwOnlineLage();
  const karte = (seite, d) => '<div class="vs-seite ' + (seite ? 'rot' : 'blau') + (d.ich ? ' ich' : '') + '"><div class="vs-farbe">' + (seite ? '🔴 ROT' : '🔵 BLAU') + '</div>' +
    '<button type="button" class="vs-flagge" data-seite="' + seite + '"' + (d.ich ? '' : ' disabled') + '>' + (d.land ? flaggeHTML(d.land[0]) : (d.leer ? '👤' : '❔')) + '</button>' +
    '<div class="vs-land">' + (d.land ? d.land[0].toUpperCase() : '–') + '</div>' +
    '<div class="vs-art">' + (d.leer ? 'noch kein Spieler' : d.art === 'nation' ? 'Nation ' + (d.land ? '★'.repeat(NATION_STERNE(d.land[0])) : '') : '⭐ Superteam') + '</div>' +
    '<div class="vs-wer">' + d.wer + '</div>' +
    '<div class="vs-status ' + (d.bereit ? 'ok' : '') + '">' + (d.bereit ? '✅ BEREIT' : (d.leer ? '⏳ wartet …' : d.ich ? '👆 Flagge antippen' : '⏳ wählt …')) + '</div></div>';
  const a = vsSeite(0), b = vsSeite(1), beide = a.bereit && b.bereit;
  { const ow = o.querySelector('#vsOrt'), hw = L0.gast ? !!(NETZ.hostHalle) : halleWahl; if (ow && ow.dataset.sig !== String(hw) + L0.gast){ ow.dataset.sig = String(hw) + L0.gast; if (L0.gast) ortWahlZeichnen(ow, true, hw); else { ortWahlZeichnen(ow, false); try { NETZ.halleSetzen && NETZ.halleSetzen(halleWahl); } catch (e) {} } } }
  o.querySelector('.vs-reihe').innerHTML = karte(0, a) + '<div class="vs-vs">VS</div>' + karte(1, b);
  const los = o.querySelector('#vsLos'); los.hidden = false; los.disabled = L0.gast || !beide;   // V8.1: Gast sieht den Knopf grau
  los.innerHTML = L0.gast ? '⚽ ANSTOSS<small>' + (beide ? 'gleich vom Gastgeber' : 'wartet auf beide Teams') + '</small>' : '⚽ ANSTOSS' + (beide ? '' : '<small>wartet auf beide Teams</small>');
  o.querySelector('.vs-hinweis').textContent = L0.gast ? (a.bereit && b.bereit ? 'Beide bereit – der Gastgeber gibt gleich den Anstoß.' : 'Tippe auf deine Flagge und wähle dein Team.') : (b.leer ? 'Es fehlt noch ein Mitspieler für ROT. Teile den Raumcode – ANSTOSS geht erst, wenn beide Teams bereit sind.' : beide ? 'Alle bereit – ANSTOSS!' : 'Tippe auf deine Flagge. Der Anstoß geht, sobald beide bereit sind.');
  o.querySelectorAll('.vs-flagge').forEach(bt => bt.onclick = () => {
    const seite = +bt.dataset.seite, d = seite ? b : a; if (!d.ich) return;
    o.hidden = true; FW.zurueckVS = true;
    FW.online = false; FW.einseitig = L0.gast ? 'gast' : 'host'; FW.mein = null; FW.schritt = 1; fwZeichnen(); $('#fwUeber').hidden = false;
  });
}
// HALL OF FAME im Online-Fenster: Gastgeber wählt Stadion oder Halle, Gäste sehen die Wahl
setInterval(() => { try {
  const h = document.getElementById('mpOrt'), g = document.getElementById('mpOrtG');
  if (h && h.offsetParent !== null && h.dataset.sig !== String(halleWahl)){ h.dataset.sig = String(halleWahl); ortWahlZeichnen(h, false); try { NETZ.halleSetzen && NETZ.halleSetzen(halleWahl); } catch (e) {} }
  if (g && g.offsetParent !== null){ const w = !!NETZ.hostHalle; if (g.dataset.sig !== String(w)){ g.dataset.sig = String(w); ortWahlZeichnen(g, true, w); } }
} catch (e) {} }, 600);
function vsOeffnen(){
  let o = document.getElementById('vsUeber');
  if (!o){
    o = document.createElement('div'); o.id = 'vsUeber'; o.className = 'anpfiff';
    o.innerHTML = '<div class="box vsbox"><h2>⚔️ ONLINE-SPIEL</h2><div class="vs-reihe"></div><div class="ort-wahl" id="vsOrt"></div><div class="vs-hinweis"></div><div class="mpunten"><button type="button" id="vsZu">ZURÜCK</button><button type="button" id="vsLos">⚽ ANSTOSS</button></div></div>';
    (document.getElementById('menue') || document.body).appendChild(o);
    o.querySelector('#vsZu').onclick = () => { o.hidden = true; };
    o.querySelector('#vsLos').onclick = () => {
      const L0 = fwOnlineLage(); if (L0.gast) return; const a = vsSeite(0), b = vsSeite(1); if (!(a.bereit && b.bereit)) return;
      o.hidden = true;
      window.__halleStart = halleWahl;   // HALL OF FAME
      modusStart81('freund');
    };
    setInterval(vsZeichnen, 500);
  }
  $('#mpUeber').hidden = true; o.hidden = false; vsZeichnen();
}
// V5.3: online – Team/Land wählen und ANSTOSS (im Online-Bereich und im Hauptmenü)
function fwOnlineLage(){ let online = false, gast = false, rot = false; try { online = !!(NETZ.partner || (NETZ.gaeste && NETZ.gaeste.length)); } catch (e) {} try { gast = NETZ.rolle === 'gast' && !!NETZ.partner; } catch (e) {} try { rot = !!gegnerTeamGast(); } catch (e) {} return { online, gast, rot }; }
function fwTeamWaehlenOnline(){ const L0 = fwOnlineLage(); FW.online = false; FW.einseitig = L0.gast ? 'gast' : 'host'; FW.mein = null; FW.schritt = 1; fwZeichnen(); $('#mpUeber').hidden = true; $('#fwUeber').hidden = false; }
function onlineAnstoss(){
  const L0 = fwOnlineLage(); if (L0.gast){ toast('Den Anstoß gibt der Gastgeber.'); return; }
  $('#mpUeber').hidden = true;
  if (L0.rot){ window.__halleStart = halleWahl; modusStart81('freund'); return; }   // Blau gegen Rot
  const sb = $('#start'); if (!sb || sb.disabled){ toast('Wähle zuerst dein Team (Land oder ' + TEAM_GROESSE + ' Spieler).'); return; }
  toast('Online brauchst du einen Mitspieler im Gegnerteam (ROT) – keine KI.');   // V8.1
}
document.querySelectorAll('.mpVs').forEach(b => b.addEventListener('click', vsOeffnen));
// Hauptmenü: online heißt der Freundschafts-Knopf ANSTOSS
setInterval(() => { try { const L0 = fwOnlineLage(), sp = document.querySelector('#freundKnopf span'); if (!sp) return; const t = (L0.online || L0.gast) ? (L0.gast ? 'MEIN TEAM' : 'ANSTOSS') : 'FREUNDSCHAFT'; if (sp.textContent !== t) sp.textContent = t; } catch (e) {} }, 800);
$('#freundKnopf').addEventListener('click', () => {   // V4.6: offline erst Team und Gegner wählen
  let online = false, gast = false, rot = false;
  try { online = !!(NETZ.partner || (NETZ.gaeste && NETZ.gaeste.length)); } catch (e) {}
  try { gast = istGastModus(); } catch (e) {}
  try { rot = !!gegnerTeamGast(); } catch (e) {}
  if (online || gast || rot){ vsOeffnen(); return; }   // V9.0: online immer BLAU gegen ROT – KI-Gegner nur offline
  FW.einseitig = null;
  if (online){ vsOeffnen(); return; }   // V5.3: zusammen gegen die KI – auch über den Online-Bildschirm
  stufeFrage('FREUNDSCHAFT', false, () => { FW.online = false; FW.einseitig = null; fwHalle = false; fwOeffnen(); });
});
// HALL OF FAME: eigener Knopf – offline Freundschaftsspiel oder Hallenturnier, online direkt ins Online-Fenster mit Halle
$('#halleKnopf').addEventListener('click', () => {
  let online = false, gast = false, rot = false;
  try { online = !!(NETZ.partner || (NETZ.gaeste && NETZ.gaeste.length)); } catch (e) {}
  try { gast = istGastModus(); } catch (e) {}
  try { rot = !!gegnerTeamGast(); } catch (e) {}
  if (online || gast || rot){ if (!gast){ halleWahl = true; try { LS81.setItem('silescrowHalle', '1'); NETZ.halleSetzen && NETZ.halleSetzen(true); } catch (e) {} } vsOeffnen(); return; }
  { const b = $('#hofTurnier'); if (b) b.innerHTML = '🏆 HALLENTURNIER' + (window.htLaeuft && window.htLaeuft() ? ' · WEITER' : '') + '<small>8 Teams · Sieger 800 / 1.800 / 3.000 Crows</small>'; }
  { const n = $('#hofNeu'); if (n){ const da = !!(window.htVorhanden && window.htVorhanden()); n.hidden = !da; n.parentNode.classList.toggle('vier', da); } }   // V10.0: NEUES TURNIER, sobald ein Turnier läuft oder beendet ist
  { const t = $('#hofTitel'); if (t) t.innerHTML = (window.HALLE_ICON || '') + 'HALL OF FAME'; }
  try { scPokalStreifen($('#hofStufe'), { leicht: 800, mittel: 1800, stark: 3000 }, 'Crows für den Sieg im Hallenturnier'); } catch (e) {}   // V3.02
  { const sw = ['leicht', 'mittel', 'stark'].includes(zustand.stufe) ? zustand.stufe : 'mittel'; document.querySelectorAll('#hofStufe [data-hs]').forEach(x => x.classList.toggle('an', x.dataset.hs === sw)); }
  $('#hofUeber').hidden = false;
});
document.querySelectorAll('#hofStufe [data-hs]').forEach(b => b.addEventListener('click', () => { stufeMarkieren(b.dataset.hs); document.querySelectorAll('#hofStufe [data-hs]').forEach(x => x.classList.toggle('an', x === b)); }));
$('#hofZu').addEventListener('click', () => { $('#hofUeber').hidden = true; });
$('#hofFreund').addEventListener('click', () => { $('#hofUeber').hidden = true; FW.online = false; FW.einseitig = null; fwHalle = true; fwOeffnen(); });
$('#hofTurnier').addEventListener('click', () => { $('#hofUeber').hidden = true; FW.online = false; FW.einseitig = null; fwHalle = true;
  if (window.htVorhanden && window.htVorhanden()){ window.htOeffnen(); return; }   // V10.0: laufendes oder beendetes Turnier zeigen, sonst erst Teamwahl
  hofTurnierWahl(); });
/* V11.2: Gemerkte Aufstellung wird verwendet – kurzer Bildschirm vor dem Anstoß mit AUFSTELLUNG ÄNDERN */
function vorAufKurz(o, opt0, weiter){
  aufNrCSS();
  let ov = document.getElementById('vorAuf');
  if (!ov){ ov = document.createElement('div'); ov.id = 'vorAuf'; document.getElementById('flaeche').appendChild(ov); }
  ov.style.display = 'flex';
  ov.innerHTML = '<div class="fe-kurz"><div class="fe-kt">📋 AUFSTELLUNG</div><p>Deine gespeicherte Aufstellung ist bereit.</p>' +
    '<div class="fe-kb"><button type="button" class="fe-kz">◀ ZURÜCK</button><button type="button" class="fe-ka">✏️ AUFSTELLUNG ÄNDERN</button><button type="button" class="fe-ko">⚽ ANSTOSS</button></div></div>';
  const zu = () => { ov.style.display = 'none'; ov.innerHTML = ''; };
  ov.querySelector('.fe-ko').addEventListener('click', () => { zu(); weiter(o); });
  ov.querySelector('.fe-ka').addEventListener('click', () => { zu(); vorAufstellung(opt0, weiter, o); });
  ov.querySelector('.fe-kz').addEventListener('click', () => {
    zu();
    window.__htSpiel = null; window.__halleStart = false; window.__ligaModus = false;
    ['fwUeber', 'hofUeber', 'htUeber'].forEach(id => { const e = document.getElementById(id); if (e) e.hidden = true; });
    const m = document.getElementById('menue'); if (m) m.hidden = false;
  });
}
/* VOR JEDEM SPIEL: Aufstellungs-Vorschau wie im Hauptmenü – Stadion (11) oder Halle (Torwart + 4). Gibt true zurück, wenn sie geöffnet wurde. */
function vorAufstellung(opt0, weiter, erzwingen){
  const direkt = !!window.__aufDirekt; window.__aufDirekt = false;   // V11.4: Knopf AUFSTELLUNG im Turnier-Fenster öffnet den Editor sofort
  if (!opt0 || opt0.gast || opt0.aufstDone || opt0.liga || opt0.ligaCC || !Array.isArray(opt0.squad)) return false;   // LEAGUE: Aufstellung kommt vom Knopf im Hauptmenü (Superteam)
  const halle = !!opt0.halle;
  if (opt0.squad.some(i => i == null || !PLAYER_DATABASE[i])) return false;
  if (halle && opt0.fernAnzahl > 0) return false;
  let twI = opt0.torwart != null && opt0.torwart >= 0 ? opt0.squad[opt0.torwart] : null;
  if (twI == null) return false;
  if (!halle && opt0.squad.length !== 11) return false;
  if (halle && opt0.squad.length < 5) return false;
  // MERKEN: Aufstellung wird pro Modus + Team + Kader nur EINMAL abgefragt und danach automatisch wieder verwendet
  const modus = halle ? 'H' : (opt0.turnier ? 'W' : 'F');   // V9.9: jeder Modus (Freundschaft F, Silescrow Cup W, Hall of Fame H) merkt sich seine eigene Aufstellung
  const sig = (halle ? 'H' : (opt0.turnier ? 'W' : 'S')) + '|' + twI + '|' + opt0.squad.join(',');
  const speicher = () => { try { return JSON.parse(LS81.getItem('sc_vorauf') || '{}') || {}; } catch (e) { return {}; } };
  const gemerkt = speicher()[sig];
  const modRec = (() => { const r = speicher()['M|' + modus]; return r && r.formation && FORMEN[r.formation] ? r : null; })();
  if (!erzwingen && gemerkt && Array.isArray(gemerkt.squad) && gemerkt.squad.every(i => PLAYER_DATABASE[i]) && gemerkt.squad[gemerkt.torwart] != null){   // V11.13: auch getauschter Torwart / eigener Spieler bleibt gemerkt
    const o = { ...opt0, aufstDone: true, squad: gemerkt.squad.slice(), torwart: gemerkt.torwart, ersatz: (gemerkt.ersatz || []).filter(i => PLAYER_DATABASE[i]) };
    if (gemerkt.formation && FORMEN[gemerkt.formation]) o.formation = gemerkt.formation;
    if (gemerkt.formSlot) o.formSlot = gemerkt.formSlot;
    if (gemerkt.halleSlots) o.halleSlots = gemerkt.halleSlots.slice();
    if (gemerkt.nummern) o.nummern = { ...(opt0.nummern || {}), ...gemerkt.nummern };
    if (direkt) return vorAufstellung(opt0, weiter, o); if (!window.__onlineMatch){ weiter(o); return true; } vorAufKurz(o, opt0, weiter); return true;   // V11.6: Halle – gespeicherte Aufstellung wird direkt benutzt, Ändern nur über den Knopf AUFSTELLUNG
    //   // V11.2: gemerkte Aufstellung – mit Knopf AUFSTELLUNG ÄNDERN
  }
  if (!direkt && !erzwingen && !window.__onlineMatch && modRec && !halle){   // V9.9: Kader hat sich geändert – Formation + Plätze des Modus gelten trotzdem
    const fs = Object.fromEntries(Object.entries(modRec.formSlot || {}).filter(([k]) => opt0.squad.includes(+k)));
    weiter({ ...opt0, aufstDone: true, formation: modRec.formation, formSlot: fs }); return true;
  }
  if (!direkt && !erzwingen && !window.__onlineMatch) return false;   // V11.6: ANSTOSS öffnet nie den Editor – nur der Knopf AUFSTELLUNG; ohne gespeicherte Aufstellung gilt die Standard-Aufstellung
  const bs = erzwingen || (modRec && !halle ? { ...opt0, formation: modRec.formation, formSlot: Object.fromEntries(Object.entries(modRec.formSlot || {}).filter(([k]) => opt0.squad.includes(+k))) } : opt0);
  let squad = bs.squad.slice();
  let ersatz = (bs.ersatz || []).filter(i => PLAYER_DATABASE[i] && !squad.includes(i));
  try { if (!(window.ligaGesperrt && window.ligaGesperrt())) kartenRest(squad).forEach(i => { if (!ersatz.includes(i)) ersatz.push(i); }); } catch (e) {}   // V11.9
  const nummern = { ...(bs.nummern || {}) };
  const gesp = new Set(squad.slice(1, 1 + Math.max(0, Math.min(3, opt0.fernAnzahl || 0))));   // V11.13: nur Plätze anderer Mitspieler (online) bleiben fest – dich selbst und den Torwart darfst du tauschen
  let formation = FORMEN[bs.formation] ? bs.formation : (FORMEN[zustand.formation] ? zustand.formation : '4-4-2');
  let formSlot = { ...(bs.formSlot || zustand.formSlot || {}) };
  let hk = (opt0.online && window.__onHalleForm && HALLEN_FORMEN[window.__onHalleForm]) ? window.__onHalleForm : hallenFormKey(), hs = [null, null, null, null], bySlot = [];
  const rat = i => autoStaerke(i);   // V3.09: echte Stärke (Training/Pack-Bonus)
  const hallAuto = () => {
    const FH = HALLEN_FORMEN[hk], aus = [null, null, null, null], wahl = [];
    squad.forEach(i => { if (i !== twI && gesp.has(i) && wahl.length < 4) wahl.push(i); });
    squad.filter(i => i !== twI && !wahl.includes(i)).sort((a, b) => rat(b) - rat(a)).forEach(i => { if (wahl.length < 4) wahl.push(i); });
    const reihe = wahl.slice().sort((a, b) => rat(b) - rat(a));
    for (const runde of [0, 1]) for (const i of reihe){
      if (aus.includes(i)) continue;
      const want = PLAYER_DATABASE[i].role === 'TW' ? 'DF' : PLAYER_DATABASE[i].role;
      const k = runde === 0 ? FH.findIndex((f, q) => aus[q] == null && f.rolle === want) : aus.findIndex(x => x == null);
      if (k >= 0) aus[k] = i;
    }
    return aus;
  };
  if (halle) hs = (erzwingen && Array.isArray(erzwingen.halleSlots) && erzwingen.halleSlots.length === 4) ? erzwingen.halleSlots.slice() : hallAuto();
  let ov = document.getElementById('vorAuf');
  if (!ov){ ov = document.createElement('div'); ov.id = 'vorAuf'; document.getElementById('flaeche').appendChild(ov); }
  ov.style.display = 'flex';
  let sel = null, msg = '', nrAend = false, nrSeq = false;
  const posX = fv => 50 + fv * 57, posY = fu => 74 - (fu + .72) / 1.06 * 58;
  const leer = k => halle ? hs[k] == null : bySlot[k] == null;
  const tok = (cls, style, p, lab, attr) => '<button type="button" class="fe-tok ' + cls + '" ' + attr + ' style="' + style + '"><span class="fe-bild">' +
    (p ? '<img src="' + BILDER[p.bild] + '" alt="">' : '<em>+</em>') + (lab ? '<u>' + lab + '</u>' : '') + ((p && lab && posAbzug(p.pos, lab)) ? '<s class="fe-abz">−' + posAbzug(p.pos, lab) + '</s>' : '') + ((p && p.stufe) ? '<i class="fe-stern fs-' + p.stufe + '">★</i>' : '') + (p ? aufNrChip(PLAYER_DATABASE.indexOf(p), nummern[PLAYER_DATABASE.indexOf(p)]) : '') + '</span><b>' + (p ? p.name + ((lab || p.pos) ? ' <small class="fe-pp">' + (lab || p.pos) + '</small>' : '') : 'frei') + '</b></button>';
  function aktion(a, z){
    msg = '';
    if (a.t === 'b' && z.t === 'b') return;
    if (a.t === 's' && z.t === 's'){
      if (a.k === z.k) return;
      if (halle){ const t = hs[a.k]; hs[a.k] = hs[z.k]; hs[z.k] = t; }
      else { const t = bySlot[a.k]; bySlot[a.k] = bySlot[z.k]; bySlot[z.k] = t; formSlot = {}; bySlot.forEach((i, sl) => { if (i != null) formSlot[i] = sl; }); }
      return;
    }
    if (a.t === 't' || z.t === 't'){   // V11.13: Torwart tauschen (Bank/Reserve oder Feldspieler)
      const o = a.t === 't' ? z : a, alt = twI;
      if (o.t === 'b'){
        const sp = squad.indexOf(alt); if (sp >= 0) squad[sp] = o.idx;
        const ep = ersatz.indexOf(o.idx); if (ep >= 0) ersatz[ep] = alt; else ersatz.push(alt);
        if (halle){ const h = hs.indexOf(o.idx); if (h >= 0) hs[h] = null; }
        twI = o.idx; msg = PLAYER_DATABASE[o.idx].name + ' steht jetzt im Tor.'; return;
      }
      if (o.t === 's'){
        const f = halle ? hs[o.k] : bySlot[o.k]; if (f == null || gesp.has(f)) return;
        if (halle) hs[o.k] = alt; else { delete formSlot[f]; formSlot[alt] = o.k; }
        twI = f; msg = PLAYER_DATABASE[f].name + ' steht jetzt im Tor.'; return;
      }
      return;
    }
    const sl = a.t === 's' ? a : z, bn = a.t === 'b' ? a : z;
    const alt = halle ? hs[sl.k] : bySlot[sl.k];
    if (alt != null && gesp.has(alt)){ msg = 'Dein eigener Spieler bleibt im Team – tausche einen KI-Spieler.'; return; }
    if (halle) hs[sl.k] = bn.idx;
    else {
      const pos = squad.indexOf(alt); if (pos < 0) return;
      squad[pos] = bn.idx;
      const ep = ersatz.indexOf(bn.idx); if (ep >= 0) ersatz[ep] = alt;
      if (nummern[alt] != null){ const bnr = nummern[bn.idx]; nummern[bn.idx] = nummern[alt]; if (bnr != null) nummern[alt] = bnr; else delete nummern[alt]; }   // V11.1: Nummern tauschen mit
      delete formSlot[alt]; formSlot[bn.idx] = sl.k;
    }
    msg = PLAYER_DATABASE[bn.idx].name + ' ist jetzt im Team.';
  }
  function zeichne(){
    const _fr0 = feRects(ov);
    if (!halle && !nrAend && !opt0.nummern){ try { startNummern(nummern, twI, squad.filter(i => i !== twI), formation, formSlot, null); nrSeq = true; } catch (e) {} }   // V10.11: Startspieler 1–11
    let toks = tok('TW fix' + (sel && sel.t === 't' ? ' sel' : ''), 'left:50%;top:90%', PLAYER_DATABASE[twI], 'TOR', 'data-fix="1"'), bankIds, chips;
    if (halle){
      HALLEN_FORMEN[hk].forEach((f, k) => {
        const i = hs[k], p = i != null ? PLAYER_DATABASE[i] : null;
        toks += tok(f.rolle + (p ? '' : ' leer') + (sel && sel.t === 's' && sel.k === k ? ' sel' : ''), 'left:' + posX(f.fv).toFixed(1) + '%;top:' + posY(f.fu).toFixed(1) + '%', p, { DF: 'AB', MF: 'MI', ST: 'ST' }[f.rolle], 'data-s="' + k + '"');
      });
      bankIds = ersatz.slice(0, BANK_GROESSE).concat(squad.filter(i => i !== twI && !hs.includes(i)), ersatz.slice(BANK_GROESSE));   // V11.9: erst die 2 Auswechselspieler, darunter Reserve
      chips = Object.keys(HALLEN_FORMEN).map(k => '<button type="button" data-f="' + k + '" class="' + (k === hk ? 'an' : '') + '">' + k + '</button>').join('');
    } else {
      const slots = formSlots(formation), zu = formZuweisen(squad.filter(i => i !== twI), formation, formSlot);
      bySlot = new Array(slots.length).fill(null); zu.forEach((sl, i) => { bySlot[sl] = i; });
      slots.forEach((sd, k) => {
        const i = bySlot[k], p = i != null ? PLAYER_DATABASE[i] : null;
        toks += tok(sd.rolle + (p ? '' : ' leer') + (sel && sel.t === 's' && sel.k === k ? ' sel' : ''), 'left:' + posX(sd.fv).toFixed(1) + '%;top:' + posY(sd.fu).toFixed(1) + '%', p, sd.label, 'data-s="' + k + '"');
      });
      bankIds = ersatz.slice();
      chips = FORM_REIHE.map(k => '<button type="button" data-f="' + k + '" class="' + (k === formation ? 'an' : '') + '">' + k + '</button>').join('');
    }
    aufBankNr(nummern, squad.concat(hs || []).concat(twI != null ? [twI] : []), bankIds);
    const bankHtml = bankMitReserve(bankIds, Math.min(BANK_GROESSE, ersatz.length), i => tok('BK' + (sel && sel.t === 'b' && sel.idx === i ? ' sel' : ''), '', PLAYER_DATABASE[i], '', 'data-b="' + i + '"'), 'Keine Auswechselspieler');
    const linien = '<svg viewBox="0 0 110 150" preserveAspectRatio="none" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"><rect x="3" y="3" width="104" height="144"/><line x1="3" y1="75" x2="107" y2="75"/><circle cx="55" cy="75" r="11"/><rect x="28" y="3" width="54" height="22"/><rect x="28" y="125" width="54" height="22"/><rect x="42" y="3" width="26" height="9"/><rect x="42" y="138" width="26" height="9"/></svg>';
    { const _bs = (ov.querySelector('.fe-bankliste') || {}).scrollTop || 0; Promise.resolve().then(() => { const l = ov.querySelector('.fe-bankliste'); if (l) l.scrollTop = _bs; }); }
    ov.innerHTML = '<div class="fe-box"><div class="fe-title">' + (halle ? (window.HALLE_ICON || '') + ' ' : '📋 ') + 'AUFSTELLUNG</div>' +
      '<div class="fe-bank"><h4>🪑 BANK</h4><div class="fe-bankliste">' + bankHtml + '</div></div>' +
      '<div class="fe-mitte"><div class="fe-pitch">' + linien + toks + '</div></div>' +
      '<div class="fe-seite"><div class="fe-label">FORMATION</div><div class="fe-chips">' + chips + '</div>' + 
      '<div class="fe-hilfe">Spieler antippen oder ziehen und auf einen Platz oder Bankspieler legen. Angriff = oben. Spieler antippen → NUMMER ÄNDERN.' + (halle ? ' In der Halle spielen Torwart + 4 – die Bank darf beliebig oft einwechseln.' : '') + '</div>' +
      '<div class="fe-msg">' + msg + '</div>' +
      '<div class="fe-act"><button type="button" class="fe-zu">◀ ZURÜCK</button><button type="button" class="fe-auto">🔄 AUTOMATISCH</button><button type="button" class="fe-ok">⚽ ANSTOSS</button></div></div></div>';
    feSelHinweis(ov, sel ? (sel.t === 's' ? (halle ? hs[sel.k] : bySlot[sel.k]) : sel.t === 'b' ? sel.idx : twI) : null);
    feAnim(ov, _fr0);
    const nrOeffnen = ix => aufNrWahl(ov, {
      idx: ix, hole: i => nummern[i],
      alle: () => Array.from(new Set([twI].concat(squad, ersatz, halle ? hs.filter(i => i != null) : []))).filter(i => i != null && PLAYER_DATABASE[i]),
      fertig: (n, anderer, altN) => {
        if (anderer != null){ nummern[anderer] = altN; msg = '🔄 #' + n + ' war schon vergeben – getauscht mit ' + PLAYER_DATABASE[anderer].name + ': ' + PLAYER_DATABASE[ix].name + ' trägt jetzt #' + n + ', ' + PLAYER_DATABASE[anderer].name + ' trägt jetzt ' + (altN != null ? '#' + altN : 'keine feste Nummer') + '.'; }
        else msg = PLAYER_DATABASE[ix].name + ' trägt jetzt die #' + n + '.';
        nummern[ix] = n; nrAend = true; sel = null; zeichne();
      }
    });
    aufNrUnterName(ov, sel, q => q.t === 's' ? (halle ? hs[q.k] : bySlot[q.k]) : q.idx, nrOeffnen);
    ov.querySelectorAll('.fe-chips button').forEach(bt => bt.addEventListener('click', () => {
      if (halle){ hk = bt.dataset.f; if (opt0.online) window.__onHalleForm = hk; else { try { LS81.setItem('sc_hallform', hk); } catch (e) {} } }   // V3.07: online nicht speichern
      else { formation = bt.dataset.f; formSlot = {}; }
      sel = null; msg = ''; zeichne();
    }));
    ov.querySelectorAll('.fe-tok[data-s],.fe-tok[data-b],.fe-tok[data-fix]').forEach(el => el.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('.fe-nr')) return;   // V11.1: Nummern-Schild antippen = Nummer ändern
      e.preventDefault();
      const q = el.dataset.fix != null ? { t: 't' } : el.dataset.s != null ? { t: 's', k: +el.dataset.s } : { t: 'b', idx: +el.dataset.b };
      const kann = !(q.t === 's' && leer(q.k));
      const x0 = e.clientX, y0 = e.clientY;
      let bewegt = false, ghost = null, hover = null;
      const box = ov.getBoundingClientRect(), sk = box.width / (ov.offsetWidth || box.width) || 1;
      const ziel = (x, y) => { const t = document.elementFromPoint(x, y); const c = t && t.closest ? t.closest('.fe-tok[data-s],.fe-tok[data-b],.fe-tok[data-fix]') : null; return c && c !== el ? c : null; };
      const qVon = c => c.dataset.fix != null ? { t: 't' } : c.dataset.s != null ? { t: 's', k: +c.dataset.s } : { t: 'b', idx: +c.dataset.b };
      const move = ev => {
        if (!kann) return;
        if (!bewegt && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8){
          bewegt = true; ghost = el.cloneNode(true); ghost.classList.add('fe-ghost'); ghost.removeAttribute('data-s'); ghost.removeAttribute('data-b'); ov.appendChild(ghost); el.style.opacity = .35;
        }
        if (bewegt){
          ghost.style.left = ((ev.clientX - box.left) / sk) + 'px'; ghost.style.top = ((ev.clientY - box.top) / sk) + 'px';
          const h = ziel(ev.clientX, ev.clientY);
          if (h !== hover){ if (hover) hover.classList.remove('ziel'); hover = h; if (hover) hover.classList.add('ziel'); }
        }
      };
      const ende = ev => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', ende); window.removeEventListener('pointercancel', ende);
        if (ghost) ghost.remove();
        if (ev.type === 'pointercancel' && !bewegt){ el.style.opacity = ''; return; }
        if (bewegt){
          const c = ev.type === 'pointercancel' ? null : ziel(ev.clientX, ev.clientY);
          if (c) aktion(q, qVon(c));
          sel = null; zeichne(); return;
        }
        if (sel === null){ if (kann) sel = q; }
        else if (sel.t === q.t && (sel.k === q.k && sel.idx === q.idx)) sel = null;
        else { aktion(sel, q); sel = null; }
        zeichne();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', ende); window.addEventListener('pointercancel', ende);
    }));
    ov.querySelector('.fe-auto').addEventListener('click', () => {
      try {   // V3.09: stärkste Spieler aus Aufstellung + Bank + Reserve
        if (!halle && twI != null && !gesp.has(twI)){   // V10.11: auch das Tor – stärkster Torwart
          const cand = autoTorKandidat(squad.concat(ersatz, (() => { try { return (window.ligaGesperrt && window.ligaGesperrt()) ? [] : kartenRest(squad); } catch (e) { return []; } })()), twI);
          if (cand != null){
            const cp = squad.indexOf(cand), ep = ersatz.indexOf(cand), alt0 = twI, tp = squad.indexOf(alt0);
            if (cp >= 0) squad[cp] = alt0; else if (ep >= 0) ersatz[ep] = alt0; else ersatz.push(alt0);
            if (tp >= 0) squad[tp] = cand;
            const nc = nummern[cand]; if (nummern[alt0] != null) nummern[cand] = nummern[alt0]; if (nc != null) nummern[alt0] = nc; else delete nummern[alt0];
            delete formSlot[cand]; delete formSlot[alt0];
            twI = cand;
          }
        }
        const felder = squad.filter(i => i !== twI), pool = [];
        felder.concat(ersatz, (() => { try { return (window.ligaGesperrt && window.ligaGesperrt()) ? [] : kartenRest(squad); } catch (e) { return []; } })()).forEach(i => { if (i != null && i !== twI && PLAYER_DATABASE[i] && !pool.includes(i) && (gesp.has(i) || !autoVerletzt(i))) pool.push(i); });
        const alleAlt = pool.slice();
        let gew, zu = null;
        if (halle) gew = autoTopListe(pool, 4, gesp);
        else { zu = formBestAutoStark(pool, formation, felder.length, gesp); gew = Object.keys(zu).map(Number); }
        if (gew.length){
          const geht = felder.filter(i => !gew.includes(i)), kommt = gew.filter(i => !felder.includes(i));
          const nrTausch = (alt, neuI) => { if (nummern[alt] != null){ const bnr = nummern[neuI]; nummern[neuI] = nummern[alt]; if (bnr != null) nummern[alt] = bnr; else delete nummern[alt]; } };
          if (halle){
            geht.forEach((alt, q) => { if (kommt[q] != null) nrTausch(alt, kommt[q]); });
            squad = [twI].concat(gew);
          } else {
            geht.forEach((alt, q) => { const neuI = kommt[q]; if (neuI == null) return; const pos = squad.indexOf(alt); if (pos < 0) return; squad[pos] = neuI; nrTausch(alt, neuI); });
          }
          ersatz = alleAlt.filter(i => !gew.includes(i) && !gesp.has(i)).concat(squad.filter(i => i !== twI && !gew.includes(i) && !gesp.has(i) && !alleAlt.includes(i))).sort((a, b) => autoStaerke(b) - autoStaerke(a));
          if (halle) hs = hallAuto(); else formSlot = zu;
        } else if (halle) hs = hallAuto(); else formSlot = formBestAuto(squad.filter(i => i !== twI), formation);
      } catch (e) { console.error('auto', e); if (halle) hs = hallAuto(); else formSlot = formBestAuto(squad.filter(i => i !== twI), formation); }
      sel = null; msg = '🔄 Die stärksten Spieler stehen jetzt in der Aufstellung.'; zeichne();
    });
    ov.querySelector('.fe-zu').addEventListener('click', () => {   // zurück zum Hauptmenü, Spiel wird nicht gestartet
      if (opt0.online){ window.__onHalleOffen = false; ov.style.display = 'none'; ov.innerHTML = ''; try { aktualisiere(); } catch (e) {} return; }   // V3.07
      ov.style.display = 'none'; ov.innerHTML = '';
      window.__htSpiel = null; window.__halleStart = false; window.__ligaModus = false;
      ['fwUeber', 'hofUeber', 'htUeber'].forEach(id => { const e = document.getElementById(id); if (e) e.hidden = true; });
      const m = document.getElementById('menue'); if (m) m.hidden = false;
    });
    ov.querySelector('.fe-ok').addEventListener('click', () => {
      if (opt0.online){   // V3.07: Online-Halle – nur ansehen/einstellen, nichts speichern, nicht starten
        window.__onHalleOffen = false; ov.style.display = 'none'; ov.innerHTML = ''; try { aktualisiere(); } catch (e) {} return;
      }
      let o = { ...opt0, aufstDone: true };
      if (halle){
        const extras = hs.filter(i => i != null && !squad.includes(i)), sq = squad.concat(extras);
        o = { ...o, squad: sq, torwart: sq.indexOf(twI), ersatz: ersatz.filter(i => !extras.includes(i)), halleSlots: hs.slice() };
      } else o = { ...o, squad, torwart: squad.indexOf(twI), ersatz, formation, formSlot };
      if (opt0.nummern || nrAend || nrSeq) o.nummern = nummern;
      try {   // Aufstellung merken
        const sp = speicher(); sp[sig] = { squad: o.squad, torwart: o.torwart, ersatz: o.ersatz, formation: o.formation, formSlot: o.formSlot, halleSlots: o.halleSlots, nummern: (opt0.nummern || nrAend || nrSeq) ? nummern : undefined };
        if (!halle) sp['M|' + modus] = { formation: o.formation, formSlot: o.formSlot };
        const ks = Object.keys(sp).filter(k => k.indexOf('M|') !== 0); if (ks.length > 40) delete sp[ks[0]];
        LS81.setItem('sc_vorauf', JSON.stringify(sp));
      } catch (e) {}
      ov.style.display = 'none'; ov.innerHTML = '';
      weiter(o);
    });
  }
  zeichne();
  return true;
}
window.vorAufstellung = vorAufstellung;
// V3.07: ONLINE + HALL OF FAME – die 4 Feldspieler aus deinen Spielern (Torwart bleibt), ohne etwas zu speichern
function onlineHalleAuswahl(hk){
  const tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
  const feld = zustand.squad.filter(i => i !== tw && PLAYER_DATABASE[i]);
  const FH = HALLEN_FORMEN[hk], aus = [null, null, null, null];
  const reihe = feld.slice().sort((a, b) => autoStaerke(b) - autoStaerke(a)).slice(0, 4);
  for (const runde of [0, 1]) for (const i of reihe){
    if (aus.includes(i)) continue;
    const want = PLAYER_DATABASE[i].role === 'TW' ? 'DF' : PLAYER_DATABASE[i].role;
    const k = runde === 0 ? FH.findIndex((f, q) => aus[q] == null && f.rolle === want) : aus.findIndex(x => x == null);
    if (k >= 0) aus[k] = i;
  }
  return aus;
}
function onlineHalleEditor(){
  // Hallen-Aufstellungsfenster wie offline (Torwart + 4, Bank, Reserve, AUTOMATISCH) – gilt nur für dieses Online-Spiel, nichts wird gespeichert
  const tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null; if (tw == null) return;
  const opt = { squad: zustand.squad.slice(), torwart: zustand.torwart, ersatz: (zustand.ersatz || []).slice(), nummern: { ...(zustand.nummern || {}) }, halle: true, online: true };
  window.__onHalleOffen = true;
  const merkForm = (() => { try { return LS81.getItem('sc_hallform'); } catch (e) { return null; } })();
  vorAufstellung(opt, o => {}, opt);
}
window.onlineHalleEditor = onlineHalleEditor;
function hofTurnierWahl(){   // V10.0: Teamwahl wie überall – MEIN SUPERTEAM oder eine der 32 Nationen
  FW.online = false; FW.einseitig = 'hallenturnier'; fwHalle = true; FW.mein = null; FW.gegner = null; FW.zurueckVS = false; FW.schritt = 1;
  fwZeichnen(); $('#fwUeber').hidden = false;
}
window.hofTurnierWahl = hofTurnierWahl;
function ligaTeamWahl(){   // V2.07: LEAGUE nur mit deinem Superteam – keine erneute Länderwahl mehr (Land kommt aus der Einführung)
  if (!fwSuper()){ toast('Dein Superteam fehlt – wähle im Hauptmenü erst ' + TEAM_GROESSE + ' Spieler.'); return; }
  FW.online = false; FW.einseitig = 'liga'; fwHalle = false; FW.mein = 'super'; FW.gegner = null; FW.zurueckVS = false; FW.schritt = 1;
  ligaMitWahl();
}
function ligaMitWahl(){
  // V11.30: Neue LEAGUE – immer mit deinen eigenen Spielern. Erst Hinweis „Wähle deine 13 Spieler“, dann wählst du im Hauptmenü 11 + 2, dann LEAGUE STARTEN.
  const m = FW.mein;
  $('#fwUeber').hidden = true; FW.einseitig = null;
  let land = null;
  if (m === 'super'){ const su = fwSuper(); land = (su && su.land) || zustand.land || COUNTRY_DATABASE[0]; }
  else land = COUNTRY_DATABASE[m];
  zustand.teamArt = 'super'; zustand.land = land;
  try { $('#landAnz').innerHTML = flaggeHTML(land[0]) + ' ' + land[0]; $('#landKnopf').classList.remove('leer'); } catch (e) {}
  window.__ligaNeuWahl = true;
  const kaderFertig = zustand.squad.length >= TEAM_GROESSE && (zustand.ersatz || []).length >= BANK_GROESSE;   // V11.31: schon gewählter Kader bleibt
  if (!kaderFertig){ zustand.squad = []; zustand.ersatz = []; zustand.torwart = -1; zustand.formSlot = {};
    try { ersatzSpeichern(); formSpeichern(); } catch (e) {}
    zustand.seite = 1; }
  try { zeichneKarten(); aktualisiere(); } catch (e) {}
  if (kaderFertig){   // V11.34: Kader steht -> Liga startet direkt nach Stärke und Land, ohne extra Knopf
    window.__ligaWartet = false;
    setTimeout(() => { const sb = $('#start'); if (sb && sb.disabled){ window.__ligaWartet = true; ligaStartKnopf(); } try { ligaNeuStarten(); } catch (e) { console.error(e); window.__ligaWartet = true; ligaStartKnopf(); } }, 60);
    return;
  }
  window.__ligaWartet = true; ligaStartKnopf();
  try { scGrossHinweis('WÄHLE DEINE ' + TEAM_GROESSE + ' SPIELER', '+ ' + BANK_GROESSE + ' für die Bank', 2000); } catch (e) { toast('Wähle dein Superteam (11 + 2 Bank).'); }   // V3.09: großer Hinweis, geht von selbst weg
}
function ligaStartKnopf(){
  let b = document.getElementById('ligaStartJetzt');
  if (!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'ligaStartJetzt'; b.textContent = '⚽ LEAGUE STARTEN';
    b.style.cssText = 'position:fixed;right:5.5%;bottom:13%;z-index:9000;padding:12px 18px;border:3px solid #000;border-radius:14px;background:linear-gradient(180deg,#ff6fb0,#e0267a);color:#fff;font:900 20px/1 var(--display,Impact),sans-serif;letter-spacing:1px;box-shadow:4px 4px 0 #000;cursor:pointer;display:none';
    b.addEventListener('click', () => { window.__ligaWartet = false; b.style.display = 'none'; ligaNeuStarten(); });
    document.body.appendChild(b);
    setInterval(() => { const menu = document.getElementById('menue'); const zeig = !!window.__ligaWartet && menu && !menu.hidden && fwMenueBereit(); b.style.display = zeig ? 'block' : 'none'; }, 400); }
}
window.wahlDialog = wahlDialog;   // V10.0: eigener Dialog statt confirm() – das native Fenster wirft das Handy aus dem Quermodus
$('#hofNeu').addEventListener('click', () => {   // V10.0: neues Turnier mit neuer Teamwahl (altes wird erst nach der Wahl ersetzt)
  const los = () => { $('#hofUeber').hidden = true; hofTurnierWahl(); };
  if (window.htLaeuft && window.htLaeuft()){
    wahlDialog('NEUES HALLENTURNIER', 'Das laufende Turnier wird ersetzt, sobald du dein Team gewählt hast.', '🆕 NEUES TURNIER', 'TURNIER WEITERSPIELEN', los, () => { $('#hofUeber').hidden = true; window.htOeffnen(); });
    return;
  }
  los();
});
{ const hb = document.querySelector('#halleKnopf .halle-b'); if (hb) hb.innerHTML = window.HALLE_ICON || '🏀'; }
$('#pokalKnopf').addEventListener('click', () => {
  if (onlineVerbunden()){ toast(ONLINE_NUR_FREUND); return; }   // V5.8
  window.__pokalNeu = false;
  // V9.5: erst dein Team wählen (MEIN SUPERTEAM oder eine der 32 Nationen), dann startet der Silescrow Cup
  const waehlen = () => stufeFrage('SILESCROW CUP', false, () => { FW.online = false; FW.einseitig = 'pokal'; fwHalle = false; FW.mein = null; FW.gegner = null; FW.zurueckVS = false; FW.schritt = 1; fwZeichnen(); $('#fwUeber').hidden = false; });
  // V6.6: laufenden Pokal auch ohne fertig gewähltes Team fortsetzen können
  let hat = false; try { hat = TURNIER.gespeichert && !(NETZ.partner || (NETZ.gaeste && NETZ.gaeste.length)); } catch (e) {}
  if (hat){
    wahlDialog('SILESCROW CUP', 'Du hast noch einen gespeicherten Silescrow Cup.', '▶ SILESCROW CUP FORTSETZEN', 'NEUER SILESCROW CUP',
      () => { try { laufHinweis(TURNIER.info, 'Der Silescrow Cup'); } catch (e) {} let ok = false; try { ok = TURNIER.fortsetzen(); } catch (e) { console.error(e); } if (!ok) toast('Pokal konnte nicht fortgesetzt werden.'); },
      () => { window.__pokalNeu = true; waehlen(); });
    return;
  }
  waehlen();
});
$('#ligaKnopf').addEventListener('click', () => {
  if (onlineVerbunden()){ toast(ONLINE_NUR_FREUND); return; }   // V5.8
  // V6.4: Online – nur der Gastgeber startet die Liga (Auswahl neu/fortsetzen kommt dann im Start-Weg)
  if (NETZ.rolle === 'gast' && NETZ.partner) { toast('Nur der Gastgeber startet die Liga – du spielst mit.'); return; }
  if (NETZ.rolle === 'host' && NETZ.gaeste.length > 0) { ligaNeuStarten(); return; }
  let hat = false;
  try { hat = LIGA.gespeichert; } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  const kaderFertig = zustand.squad.length >= TEAM_GROESSE && (zustand.ersatz || []).length >= BANK_GROESSE;   // V11.31
  if (hat && !window.__ligaNeuWahl) ligaWahlZeigen();
  else if (!kaderFertig) toast('👥 Wähle erst ' + TEAM_GROESSE + ' plus ' + BANK_GROESSE + ' Spieler (Startelf + Bank) – dann tippe auf LEAGUE.');
  else stufeFrage('LEAGUE', false, ligaTeamWahl);   // V4.0: nach NEUE LEAGUE startet LEAGUE direkt mit deiner neuen Wahl
});