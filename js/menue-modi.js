/* Silescrow Cup V 4.2 – js/menue-modi.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */


// ---------- Länder ----------
// ---------- Länder: großes Auswahlfenster mit gezeichnete Flaggen ----------
const landRaster = $('#landRaster');
COUNTRY_DATABASE.forEach((l, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'landzelle'; b.dataset.i = i;
  b.innerHTML = flaggeHTML(l[0]) + '<span>' + l[0] + '</span>';
  b.addEventListener('click', () => {
    zustand.land = l; musik.klick && musik.klick();
    landRaster.querySelectorAll('.landzelle').forEach(z => z.classList.toggle('an', z === b));
    $('#landAnz').innerHTML = flaggeHTML(l[0]) + ' ' + l[0];
    $('#landKnopf').classList.remove('leer');
    aktualisiere();
    setTimeout(() => { $('#landUeber').hidden = true; }, 220);
  });
  landRaster.appendChild(b);
});
$('#landKnopf').addEventListener('click', () => { if (window.ligaGesperrt && window.ligaGesperrt()) { toast('🔒 Die Liga läuft – Land und Stufe sind gesperrt. Neu wählen: LEAGUE → NEUE LEAGUE.'); return; } $('#landUeber').hidden = false; });
// ---------- V4.6: Freundschaftsspiel – erst dein Team, dann der Gegner ----------
// Dein Team ist entweder MEIN SUPERTEAM (deine Spieler mit deinem Land, sonst das Team deiner Liga)
// oder eine Nation der KI – genau mit dem Kader, mit dem sie auch in deiner Liga spielt.
const FW = { schritt: 1, mein: null, gegner: null };   // mein: 'super' oder Länderindex; gegner: Länderindex oder 'zufall'
function fwSterne(n){ return '★'.repeat(NATION_STERNE(n)); }
function fwLiga(){ let li = null; try { li = LIGA.info; } catch (e) {} return li && Array.isArray(li.squad) && li.squad.length ? li : null; }
function fwLigaLand(li){ const l = li && li.land; if (Array.isArray(l)) return l; if (typeof l === 'number') return COUNTRY_DATABASE[l] || null; if (typeof l === 'string') return COUNTRY_DATABASE.find(x => x[0] === l) || null; return null; }
function fwMenueBereit(){ const sb = $('#start'); return !!(sb && !sb.disabled); }   // V5.9: kein Land im Menü nötig
// Superteam: dein gerade gewähltes Team, sonst das Team deiner Liga
// V10.0: Stärke deines Superteams = Durchschnitt der Elf (wie im KADER-Feld des Hauptmenüs); bei laufender Liga die Elf der Liga
function fwSuperStaerke(su){
  try {
    const sq = ((su && su.quelle === 'liga' && su.li && Array.isArray(su.li.squad)) ? su.li.squad : zustand.squad).filter(i => PLAYER_DATABASE[i]);
    if (!sq.length) return '–';
    return Math.round(sq.reduce((x, i) => x + (STAND.gesamt(i) || PLAYER_DATABASE[i].rating), 0) / sq.length);
  } catch (e) { return '–'; }
}
function fwSuper(){
  if (fwMenueBereit()) return { quelle: 'menue', land: zustand.land || COUNTRY_DATABASE[0] };
  const li = fwLiga(), ll = fwLigaLand(li);
  if (li && ll && li.squad.length >= TEAM_GROESSE) return { quelle: 'liga', land: ll, li };
  return null;
}
function fwMeinLand(){
  if (FW.mein === 'super'){ const su = fwSuper(); return su ? su.land[0] : null; }
  return FW.mein != null ? COUNTRY_DATABASE[FW.mein][0] : null;
}
function fwZeichnen(){
  const r = $('#fwRaster'); r.innerHTML = '';
  const zelle = (html, cls, an, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'landzelle ' + (cls || '') + (an ? ' an' : ''); b.innerHTML = html; b.addEventListener('click', fn); r.appendChild(b); };
  const su = fwSuper(), superLand = su ? su.land[0] : (zustand.land ? zustand.land[0] : null);
  if (FW.schritt === 1){
    $('#fwSchritt').textContent = '1/2 · WÄHLE DEIN TEAM';
    const ligaFlagge = FW.einseitig === 'liga';   // V11.30: LEAGUE nur mit Superteam – hier wählst du nur die Flagge
    if (!ligaFlagge) zelle('<i class="fw-krone">' + (window.HALLE_ICON || '👑') + '</i>' + (su ? flaggeHTML(su.land[0]) : '<b>⭐</b>') + '<span>MEIN SUPERTEAM</span><small>' + (su ? 'STÄRKE ' + fwSuperStaerke(su) : 'Superteam noch nicht erstellt') + '</small>', 'fw-super' + (su ? '' : ' fw-aus'), FW.mein === 'super', () => {
      if (!fwSuper()){ toast('Dein Superteam ist noch nicht erstellt – wähle im Hauptmenü ' + TEAM_GROESSE + ' Spieler, oder nimm eine Nation.'); return; }
      FW.mein = 'super'; if (FW.einseitig){ fwEinseitigFertig(); return; }
      FW.schritt = 2; if (FW.gegner != null && FW.gegner !== 'zufall' && COUNTRY_DATABASE[FW.gegner][0] === fwMeinLand()) FW.gegner = null; fwZeichnen();
    });
    // V4.9: alle 32 Nationen wählbar
    COUNTRY_DATABASE.forEach((l, i) => { zelle(flaggeHTML(l[0]) + '<span>' + l[0] + '</span><small>' + (ligaFlagge ? '⭐ SUPERTEAM' : fwSterne(l[0])) + '</small>', '', FW.mein === i, () => {
      FW.mein = i; if (FW.einseitig){ fwEinseitigFertig(); return; }
      FW.schritt = 2; if (FW.gegner === i) FW.gegner = null; fwZeichnen();
    }); });
  } else {
    $('#fwSchritt').textContent = '2/2 · WÄHLE DEN GEGNER';
    const mein = fwMeinLand();
    zelle('<b>🎲</b><span>ZUFALL</span><small>&nbsp;</small>', 'fw-zufall', FW.gegner === 'zufall', () => { FW.gegner = 'zufall'; fwZeichnen(); });
    COUNTRY_DATABASE.forEach((l, i) => { if (FW.mein !== 'super' && l[0] === mein) return; zelle(flaggeHTML(l[0]) + '<span>' + l[0] + '</span><small>' + fwSterne(l[0]) + '</small>', '', FW.gegner === i, () => { FW.gegner = i; fwZeichnen(); }); });
  }
  const links = FW.mein === 'super' ? '⭐ ' + (fwMeinLand() ? flaggeHTML(fwMeinLand()) : '') : FW.mein != null ? flaggeHTML(COUNTRY_DATABASE[FW.mein][0]) + ' ' + TURNIER.kurz(COUNTRY_DATABASE[FW.mein]) : '?';
  const rechts = FW.gegner === 'zufall' ? '🎲' : FW.gegner != null ? flaggeHTML(COUNTRY_DATABASE[FW.gegner][0]) + ' ' + TURNIER.kurz(COUNTRY_DATABASE[FW.gegner]) : '?';
  $('#fwPaar').innerHTML = links + ' <span>gegen</span> ' + rechts;
  $('#fwLos').disabled = !(FW.mein != null && FW.gegner != null);
  $('#fwLos').hidden = !!FW.einseitig;
  { const fa = $('#fwAuf'); if (fa){ fa.disabled = $('#fwLos').disabled; fa.hidden = !(!FW.online && !FW.einseitig); } }   // V11.4: AUFSTELLUNG nur im Hall-of-Fame-Freundschaftsspiel (nicht online)
  if (FW.einseitig){ $('#fwSchritt').textContent = (FW.einseitig === 'pokal' ? 'SILESCROW CUP' : FW.einseitig === 'liga' ? 'LEAGUE' : FW.einseitig === 'hallenturnier' ? 'HALLENTURNIER' : 'ONLINE') + (FW.einseitig === 'liga' ? ' · WÄHLE DEINE FLAGGE (dein Superteam spielt dafür)' : ' · WÄHLE DEIN TEAM'); $('#fwPaar').innerHTML = ''; }
  $('#fwZurueck').textContent = FW.schritt === 2 && !FW.online ? '◀ DEIN TEAM' : 'ZURÜCK';
  if (FW.online) $('#fwSchritt').textContent = 'ONLINE · WÄHLE DEN GEGNER';
  { const ow = $('#fwOrt'); if (ow) ow.hidden = true; }   // HALL OF FAME hat jetzt einen eigenen Knopf im Hauptmenü
  { const t = $('#fwTitel'); if (t) t.innerHTML = fwHalle && (!FW.einseitig || FW.einseitig === 'hallenturnier') ? (window.HALLE_ICON || '') + 'HALL OF FAME' : (FW.einseitig === 'pokal' ? 'SILESCROW CUP' : FW.einseitig === 'liga' ? 'LEAGUE' : 'FREUNDSCHAFTSSPIEL'); }
}
// HALL OF FAME: Spielort für Freundschaftsspiele (offline und online)
let halleWahl = false; try { halleWahl = LS81.getItem('silescrowHalle') === '1'; } catch (e) {}
// V10.0: Hallen-Formationen (4 Feldspieler + Torwart). fu: -1 eigenes Tor … +1 gegnerisches Tor, fv: Breite
const HALLEN_FORMEN = {
  '1-2-1': [{ fu: -.58, fv: 0, slot: 0, seite: 0, rolle: 'DF' }, { fu: -.16, fv: -.62, slot: 1, seite: -1, rolle: 'MF' }, { fu: -.16, fv: .62, slot: 1, seite: 1, rolle: 'MF' }, { fu: .32, fv: 0, slot: 2, seite: 0, rolle: 'ST' }],
  '2-2': [{ fu: -.52, fv: -.45, slot: 0, seite: -1, rolle: 'DF' }, { fu: -.52, fv: .45, slot: 0, seite: 1, rolle: 'DF' }, { fu: .24, fv: -.42, slot: 2, seite: -1, rolle: 'ST' }, { fu: .24, fv: .42, slot: 2, seite: 1, rolle: 'ST' }],
  '2-1-1': [{ fu: -.55, fv: -.42, slot: 0, seite: -1, rolle: 'DF' }, { fu: -.55, fv: .42, slot: 0, seite: 1, rolle: 'DF' }, { fu: -.08, fv: 0, slot: 1, seite: 0, rolle: 'MF' }, { fu: .34, fv: 0, slot: 2, seite: 0, rolle: 'ST' }],
  '1-1-2': [{ fu: -.58, fv: 0, slot: 0, seite: 0, rolle: 'DF' }, { fu: -.12, fv: 0, slot: 1, seite: 0, rolle: 'MF' }, { fu: .30, fv: -.40, slot: 2, seite: -1, rolle: 'ST' }, { fu: .30, fv: .40, slot: 2, seite: 1, rolle: 'ST' }],
  '3-1': [{ fu: -.52, fv: -.6, slot: 0, seite: -1, rolle: 'DF' }, { fu: -.62, fv: 0, slot: 0, seite: 0, rolle: 'DF' }, { fu: -.52, fv: .6, slot: 0, seite: 1, rolle: 'DF' }, { fu: .30, fv: 0, slot: 2, seite: 0, rolle: 'ST' }],
  '1-3': [{ fu: -.55, fv: 0, slot: 0, seite: 0, rolle: 'DF' }, { fu: .22, fv: -.62, slot: 2, seite: -1, rolle: 'ST' }, { fu: .30, fv: 0, slot: 2, seite: 0, rolle: 'ST' }, { fu: .22, fv: .62, slot: 2, seite: 1, rolle: 'ST' }]
};
function hallenFormKey(){ let k = '1-2-1'; try { const v = LS81.getItem('sc_hallform'); if (v && HALLEN_FORMEN[v]) k = v; } catch (e) {} return k; }
let fwHalle = false;   // HALL OF FAME: Freundschaftsspiel wurde über den HALL-OF-FAME-Knopf geöffnet
function ortWahlZeichnen(el, gesperrt, wert){
  if (!el) return;
  if (wert != null){ el.innerHTML = '<button type="button" disabled class="' + (wert ? '' : 'an') + '">🏟️ FREUNDSCHAFT</button><button type="button" disabled class="' + (wert ? 'an' : '') + '">' + (window.HALLE_ICON || '🏀') + ' HALL OF FAME · 5 gegen 5</button>'; return; }   // Gast sieht die Wahl des Gastgebers
  el.innerHTML = '<button type="button" data-h="0" class="' + (halleWahl ? '' : 'an') + '"' + (gesperrt ? ' disabled' : '') + '>🏟️ FREUNDSCHAFT</button><button type="button" data-h="1" class="' + (halleWahl ? 'an' : '') + '"' + (gesperrt ? ' disabled' : '') + '>' + (window.HALLE_ICON || '🏀') + ' HALL OF FAME · 5 gegen 5</button>';
  if (halleWahl && !gesperrt){
    const cur = hallenFormKey();
    el.insertAdjacentHTML('beforeend', '<div class="hallform" style="flex:1 0 100%;display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:6px"><span style="font:800 12px system-ui;color:#ffe234">FORMATION</span>' +
      Object.keys(HALLEN_FORMEN).map(k => '<button type="button" data-hf="' + k + '" class="' + (k === cur ? 'an' : '') + '" style="min-width:48px">' + k + '</button>').join('') + '</div>');
    el.querySelectorAll('[data-hf]').forEach(b => b.onclick = ev => { ev.stopPropagation(); try { LS81.setItem('sc_hallform', b.dataset.hf); } catch (e) {} ortWahlZeichnen(el, gesperrt); });
  }
  el.querySelectorAll('button:not([data-hf])').forEach(b => b.onclick = () => { if (gesperrt) return; halleWahl = b.dataset.h === '1'; try { LS81.setItem('silescrowHalle', halleWahl ? '1' : '0'); } catch (e) {} try { NETZ.halleSetzen && NETZ.halleSetzen(halleWahl); } catch (e) {} ortWahlZeichnen(el, gesperrt); });
}
function fwOeffnen(){ FW.schritt = 1; if (FW.mein === 'super' && !fwSuper()) FW.mein = null; fwZeichnen(); $('#fwUeber').hidden = false; }
$('#fwZurueck').addEventListener('click', () => { if (FW.schritt === 2 && !FW.online){ FW.schritt = 1; fwZeichnen(); } else { $('#fwUeber').hidden = true; if (FW.einseitig === 'hallenturnier') FW.einseitig = null; } });
$('#fwAuf').addEventListener('click', () => { window.__aufDirekt = true; $('#fwLos').click(); });   // V11.4
$('#fwLos').addEventListener('click', () => {
  if (FW.mein == null || FW.gegner == null) return;
  const mein = fwMeinLand(), su = fwSuper(), superLand = su ? su.land[0] : (zustand.land ? zustand.land[0] : null);
  let gl = FW.gegner === 'zufall' ? null : COUNTRY_DATABASE[FW.gegner];
  if (!gl){ const alt = COUNTRY_DATABASE.filter(l => FW.mein === 'super' || l[0] !== mein); gl = alt[(Math.random() * alt.length) | 0]; }
  $('#fwUeber').hidden = true;
  window.__halleStart = FW.online ? halleWahl : fwHalle;   // HALL OF FAME
  if (FW.online && FW.zurueckVS){ FW.zurueckVS = false; FW.vsGegner = gl; vsOeffnen(); return; }   // V5.3: KI-Gegner für den Online-Bildschirm gemerkt
  if (FW.online){ window.__gegnerFreund = gl; try { modusStart81('freund'); } finally { window.__gegnerFreund = null; } return; }
  if (FW.mein === 'super'){
    if (!su){ toast('Wähle zuerst ' + TEAM_GROESSE + ' Spieler im Menü.'); return; }
    if (su.quelle === 'liga'){   // Team der Liga ins Menü holen, die gewählte Stufe bleibt
      const st = zustand.stufe; ligaTeamInsMenue(); stufeMarkieren(st);
      zustand.land = su.land; try { $('#landAnz').innerHTML = flaggeHTML(su.land[0]) + ' ' + su.land[0]; $('#landKnopf').classList.remove('leer'); aktualisiere(); } catch (e) {}
    }
    window.__gegnerFreund = gl; try { modusStart81('freund'); } finally { window.__gegnerFreund = null; } return;
  }
  try { nationFreundschaft(COUNTRY_DATABASE[FW.mein], gl); } catch (e) { console.error('SILESCROW NATIONENSPIEL', e); toast('Startfehler: ' + (e && e.message ? e.message : 'bitte erneut versuchen')); }
});
// Nation der KI: derselbe Kader wie in deiner Liga (11 + Bank), mit ihren Gold-/Silber-/Bronze-Spielern
function nationTeam(land){
  const li = fwLiga(), ll = fwLigaLand(li);
  let basis = li && ll ? { land: ll, squad: li.squad, ersatz: li.ersatz || [] } : { land: zustand.land || null, squad: zustand.squad.slice(), ersatz: (zustand.ersatz || []).slice() };
  if (basis.land && basis.land[0] === land[0]) basis = { land: null, squad: [], ersatz: [] };   // V4.9: dein eigenes Land als Nation – alle 32 Kader ohne Doppelte
  let k = null; try { k = nationKader(land, basis); } catch (e) {}
  if (!k){ const alle = nationKaderAlle(null); k = alle[land[0]] && { elf: alle[land[0]].elf.slice(), bank: alle[land[0]].bank.slice() }; }
  if (!k) throw new Error('Kein Kader für ' + land[0]);
  let elf = k.elf.slice(), bank = k.bank.slice();
  for (const c of (NATION_KARTEN[land[0]] || [])){   // Pack-Spieler der Nation einsetzen (wie in der Liga), der Ersetzte geht auf die Bank
    if (elf.includes(c)) continue;
    const rolle = PLAYER_DATABASE[c].role;
    let wx0 = {}; try { wx0 = STAND.daten.wechsel || {}; } catch (e) {}
    const frei0 = i => !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].name !== 'SILESCROW' && wx0[PLAYER_DATABASE[i].name] !== land[0];   // V11.13: gewechselte Stammspieler werden nicht verdrängt
    let x = elf.findIndex(i => frei0(i) && PLAYER_DATABASE[i].role === rolle);
    if (x < 0 && rolle !== 'TW') x = elf.findIndex(i => !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].name !== 'SILESCROW' && PLAYER_DATABASE[i].role !== 'TW');
    if (x < 0) continue;
    bank.unshift(elf[x]); elf[x] = c;
  }
  { let wx = {}; try { wx = STAND.daten.wechsel || {}; } catch (e) {}   // V11.13: gewechselte Spieler bleiben auf der Bank (nicht abschneiden)
    bank = bank.filter(i => !elf.includes(i)); bank = bank.filter(i => wx[PLAYER_DATABASE[i].name] === land[0]).concat(bank.filter(i => wx[PLAYER_DATABASE[i].name] !== land[0])).slice(0, BANK_GROESSE); }
  { const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW');   // V5.0: die Türkei spielt immer mit SILESCROW
    if (sc >= 0 && land[0] === 'Türkei' && !elf.includes(sc)){ const k2 = elf.filter(i => PLAYER_DATABASE[i].role === 'ST' && !PLAYER_DATABASE[i].stufe).sort((x, y) => PLAYER_DATABASE[x].rating - PLAYER_DATABASE[y].rating)[0]; if (k2 != null){ elf[elf.indexOf(k2)] = sc; bank = bank.filter(i => i !== sc); } } }
  // Du steuerst den besten Stürmer (steht vorne), der Torwart wird markiert
  const st = elf.filter(i => PLAYER_DATABASE[i].role === 'ST').sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating)[0];
  if (st != null){ elf.splice(elf.indexOf(st), 1); elf.unshift(st); }
  const torwart = elf.findIndex(i => PLAYER_DATABASE[i].role === 'TW');
  return { squad: elf, ersatz: bank, torwart, basis };
}
// Online: Nation als dein Team ins Menü laden (der Kader wird wie ein selbst gewähltes Team an den Gegner gemeldet)
function nationInsMenue(land){
  const alle = nationKaderAlle(null), k = alle[land[0]];
  if (!k) throw new Error('Kein Kader für ' + land[0]);
  let elf = k.elf.slice(), bank = k.bank.slice();
  for (const c of (NATION_KARTEN[land[0]] || [])){
    if (elf.includes(c)) continue;
    const rolle = PLAYER_DATABASE[c].role;
    let x = elf.findIndex(i => !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].name !== 'SILESCROW' && PLAYER_DATABASE[i].role === rolle);
    if (x < 0 && rolle !== 'TW') x = elf.findIndex(i => !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].name !== 'SILESCROW' && PLAYER_DATABASE[i].role !== 'TW');
    if (x < 0) continue;
    bank.unshift(elf[x]); elf[x] = c;
  }
  const frei = (alle.__frei || []).filter(i => !elf.includes(i) && !bank.includes(i));
  while (bank.length < BANK_GROESSE && frei.length) bank.push(frei.shift());
  { const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW');   // V5.0: die Türkei spielt immer mit SILESCROW
    if (sc >= 0 && land[0] === 'Türkei' && !elf.includes(sc)){ const k2 = elf.filter(i => PLAYER_DATABASE[i].role === 'ST' && !PLAYER_DATABASE[i].stufe).sort((x, y) => PLAYER_DATABASE[x].rating - PLAYER_DATABASE[y].rating)[0]; if (k2 != null){ elf[elf.indexOf(k2)] = sc; bank = bank.filter(i => i !== sc); } } }
  const st = elf.filter(i => PLAYER_DATABASE[i].role === 'ST').sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating)[0];
  if (st != null){ elf.splice(elf.indexOf(st), 1); elf.unshift(st); }
  rolleDu = 'feld';
  zustand.squad = elf; zustand.torwart = elf.findIndex(i => PLAYER_DATABASE[i].role === 'TW');
  zustand.ersatz = bank.filter(i => !elf.includes(i)).slice(0, BANK_GROESSE); zustand.formSlot = {};
  zustand.land = land; zustand.teamArt = 'nation';
  try { ersatzSpeichern(); } catch (e) {}
  try { $('#landAnz').innerHTML = flaggeHTML(land[0]) + ' ' + land[0]; $('#landKnopf').classList.remove('leer'); } catch (e) {}
  try { aktualisiere(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
}
function pokalMitWahl(){   // V9.5: Silescrow Cup mit MEIN SUPERTEAM oder einer der 32 Nationen
  const m = FW.mein;
  $('#fwUeber').hidden = true; FW.einseitig = null;
  let snap = null;
  if (m === 'super'){
    const su = fwSuper(); if (!su){ toast('Wähle zuerst ' + TEAM_GROESSE + ' Spieler im Menü.'); return; }
    zustand.teamArt = 'super';
    if (su.quelle === 'liga'){ const st = zustand.stufe; ligaTeamInsMenue(); stufeMarkieren(st); zustand.land = su.land; try { $('#landAnz').innerHTML = flaggeHTML(su.land[0]) + ' ' + su.land[0]; $('#landKnopf').classList.remove('leer'); aktualisiere(); } catch (e) {} }
  } else {
    // dein Menü-Team bleibt erhalten: Nation kurz ins Menü laden, Pokal starten, danach dein Team zurückholen
    snap = { squad: zustand.squad, torwart: zustand.torwart, ersatz: zustand.ersatz, formSlot: zustand.formSlot, land: zustand.land, teamArt: zustand.teamArt, rolle: rolleDu };
    try { nationInsMenue(COUNTRY_DATABASE[m]); } catch (e) { toast('Team konnte nicht geladen werden.'); return; }
  }
  window.__pokalNeuOK = !!window.__pokalNeu;
  try { modusStart81('pokal'); }
  finally {
    window.__pokalNeuOK = false; window.__pokalNeu = false;
    if (snap){
      zustand.squad = snap.squad; zustand.torwart = snap.torwart; zustand.ersatz = snap.ersatz; zustand.formSlot = snap.formSlot; zustand.land = snap.land; zustand.teamArt = snap.teamArt; rolleDu = snap.rolle;
      try { ersatzSpeichern(); } catch (e) {}
      try {
        if (snap.land){ $('#landAnz').innerHTML = flaggeHTML(snap.land[0]) + ' ' + snap.land[0]; $('#landKnopf').classList.remove('leer'); }
        else { $('#landAnz').innerHTML = '🌍&nbsp; Land wählen'; $('#landKnopf').classList.add('leer'); }
        aktualisiere();
      } catch (e) {}
    }
  }
}
function fwEinseitigFertig(){
  if (FW.einseitig === 'hallenturnier'){ FW.einseitig = null; $('#fwUeber').hidden = true; window.htOeffnen(true); return; }   // V10.0: Hallenturnier mit gewähltem Team starten
  if (FW.einseitig === 'pokal'){ pokalMitWahl(); return; }
  if (FW.einseitig === 'liga'){ ligaMitWahl(); return; }
  const rolle = FW.einseitig;
  if (FW.mein === 'super'){
    const su = fwSuper(); if (!su){ toast('Wähle zuerst ' + TEAM_GROESSE + ' Spieler im Menü.'); return; }
    zustand.teamArt = 'super';
    if (su.quelle === 'liga'){ const st = zustand.stufe; ligaTeamInsMenue(); stufeMarkieren(st); zustand.land = su.land; try { $('#landAnz').innerHTML = flaggeHTML(su.land[0]) + ' ' + su.land[0]; $('#landKnopf').classList.remove('leer'); aktualisiere(); } catch (e) {} }
  } else {
    try { nationInsMenue(COUNTRY_DATABASE[FW.mein]); } catch (e) { toast('Team konnte nicht geladen werden.'); return; }
  }
  $('#fwUeber').hidden = true;
  try { aktualisiere(); } catch (e) {}
  if (FW.zurueckVS){ FW.zurueckVS = false; vsOeffnen(); return; }   // V5.3: zurück zum Online-Bildschirm
  if (rolle === 'gast'){ toast('Dein Team ist bereit – der Gastgeber gibt den Anstoß.'); return; }
  toast('Dein Team ist bereit – tippe auf ⚽ ANSTOSS.');
}
function nationFreundschaft(meinLand, gegnerLand){
  const t = nationTeam(meinLand);
  const opt = { squad: t.squad, torwart: t.torwart, menschTorwart: false, land: meinLand, stufe: zustand.stufe, modus: null, nummern: {}, fernAnzahl: 0, plaetze: {}, gegnerPlaetze: {},
    posi: {}, formation: zustand.formation, formSlot: {}, wechsel: false, ersatz: t.ersatz, gegnerLand, nationTeam: true,
    ...(() => { const z = scZehner(meinLand, t.squad); return z ? { formation: z.form, formSlot: z.pref, nummern: { [z.sc]: 10 } } : {}; })(), kaderBasis: t.basis, matchSkills: { tem: 0, sch: 0, dri: 0, pas: 0, aus: 0 } };
  window.__ligaModus = false;
  SPIEL.starte(opt);
}
$('#landZu').addEventListener('click', () => { $('#landUeber').hidden = true; });
const landSel = { innerHTML: '', classList: { remove(){} }, addEventListener(){} };   // alte Auswahl entfällt
landSel.innerHTML = '<option value="" disabled selected>🌍  Land wählen</option>' +
  COUNTRY_DATABASE.map((l, i) => '<option value="' + i + '">' + l[1] + '  ' + l[0] + '</option>').join('');
landSel.addEventListener('change', () => {
  zustand.land = COUNTRY_DATABASE[+landSel.value];
  landSel.classList.remove('leer');
  aktualisiere();
});

// ---------- Schalter ----------
document.querySelectorAll('[data-rolle]').forEach(b => b.addEventListener('click', () => {
  rolleDu = b.dataset.rolle;
  if (rolleDu === 'tor') zustand.torwart = zustand.squad.length ? 0 : -1;
  else if (zustand.torwart === 0) zustand.torwart = zustand.squad.length === TEAM_GROESSE ? besterTorwart() : -1;
  aktualisiere();
}));
// Die Steuerung ist immer fest: Du steuerst ausschließlich deinen gewählten Spieler.
zustand.steuer = 'fest';
try { LS81.setItem('sc_steuer', 'fest'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
document.querySelectorAll('[data-stufe]').forEach(b => b.addEventListener('click', () => {
  if (window.ligaGesperrt && window.ligaGesperrt()) { toast('🔒 Die Liga läuft – Land und Stufe sind gesperrt. Neu wählen: LEAGUE → NEUE LEAGUE.'); return; }   // V4.0
  zustand.stufe = b.dataset.stufe;
  document.querySelectorAll('[data-stufe]').forEach(x => x.classList.toggle('an', x === b));
}));
// V4.5: Schwierigkeit der laufenden Liga im Menü markieren
function stufeMarkieren(st){
  if (!['leicht', 'mittel', 'stark'].includes(st)) return;
  zustand.stufe = st;
  document.querySelectorAll('[data-stufe]').forEach(x => x.classList.toggle('an', x.dataset.stufe === st));
}
// V4.6: Jedes Mal, wenn das Hauptmenü erscheint, ist die Stufe der laufenden Liga ausgewählt (danach frei änderbar)
function ligaStufeInsMenue(){ try { const li = LIGA.info; if (li && li.stufe) stufeMarkieren(li.stufe); } catch (e) {} }

document.getElementById('formKnopf').addEventListener('click', function(e){ if (e.target.closest && e.target.closest('.fk-kader')) { superteamZeigen(); } else { formEditorOeffnen(e); } }); formKnopfAktualisieren();
// V4.7: Superteam ansehen – dein aktueller Kader (11 + Bank) mit Werten; ohne gewähltes Team das Team deiner Liga
function superteamZeigen(){
  let sq = zustand.squad.filter(i => PLAYER_DATABASE[i]), tw = zustand.torwart, er = (zustand.ersatz || []).filter(i => PLAYER_DATABASE[i] && !zustand.squad.includes(i)), land = zustand.land, quelle = 'menü', form = zustand.formation;
  if (!sq.length){ let li = null; try { li = LIGA.info; } catch (e) {}
    if (li && Array.isArray(li.squad) && li.squad.length){ sq = li.squad.filter(i => PLAYER_DATABASE[i]); tw = li.torwart; er = (li.ersatz || []).filter(i => PLAYER_DATABASE[i]); land = (typeof fwLigaLand === 'function' ? fwLigaLand(li) : null) || land; quelle = 'liga'; } }
  const W5 = i => { try { return STAND.werte(i) || {}; } catch (e) { return {}; } };
  const G = i => { try { return STAND.gesamt(i); } catch (e) { return PLAYER_DATABASE[i].rating; } };
  const stufe = p => p.stufe === 'gold' ? '★ GOLD' : p.stufe === 'silber' ? '◆ SILBER' : p.stufe === 'bronze' ? '● BRONZE' : '';
  const pos = (i, j) => j === tw ? 'TW' : (formLabel(i) || ({ DF: 'ABW', MF: 'MF', ST: 'ST' }[PLAYER_DATABASE[i].role] || ''));
  const aufOk = (i, posTxt) => { try { return quelle === 'menü' && STAND.hatKarte(i); } catch (e) { return false; } };   // V3.12: auch für DU   // V9.9: Vertrag bei jedem Reserve-Spieler auflösbar
  const marktOk = i => quelle === 'menü';   // V3.12: alle Spieler gleich, auch DU
  const angHtml = () => { if (quelle !== 'menü') return ''; try { return (STAND.daten.markt.ang.length ? '<div class="st-angneu">📩 ANGEBOT ERHALTEN</div>' : '') + STAND.daten.markt.ang.map((a, k) => { const i = PLAYER_DATABASE.findIndex(x => x.name === a.n); if (i < 0) return ''; return '<div class="st-ang">📩 <b>' + a.team + '</b> bietet <b>' + a.preis.toLocaleString('de-DE') + ' Crows</b> für <b>' + a.n + '</b><button type="button" class="ja" data-mja="' + k + '">ANNEHMEN</button><button type="button" class="nein" data-mnein="' + k + '">ABLEHNEN</button></div>'; }).join(''); } catch (e) { return ''; } };
  const aufLeiste = i => { const p = PLAYER_DATABASE[i], kost = STAND.auflKosten(i);
    return '<div class="st-aufl">✂ Vertrag von <b>' + p.name + '</b> auflösen? Kosten: <b>' + kost.toLocaleString('de-DE') + ' Crows</b> (du hast ' + STAND.credits.toLocaleString('de-DE') + ') – der Spieler ist danach weg. (Teurer Spieler = höhere Summe)<button type="button" class="ja" data-aufja="' + i + '">JA, AUFLÖSEN</button><button type="button" class="nein" data-aufnein="1">ABBRECHEN</button></div>'; };
  const minStart = (() => { const f = sq.filter((_, j) => j !== tw).map(G); return f.length ? Math.min(...f) : 0; })();
  const smi = (i, posTxt) => { try { const d = G(i) - minStart; if (PLAYER_DATABASE[i].name === kapitaenName()) return ['😄', 'Kapitän'];   // V9.9: Zufriedenheit nach Einsatz und Stärke
    if (posTxt !== 'BANK' && posTxt !== 'KADER') return ['😄', 'spielt von Anfang an'];
    if (posTxt === 'BANK') return d > 0 ? ['😕', 'Bank – will mehr spielen'] : ['🙂', 'Bank – zufrieden'];
    return d > 0 ? ['😡', 'Reserve – stärker als ein Stammspieler, will spielen'] : d >= -5 ? ['😕', 'Reserve – will mehr spielen'] : ['🙂', 'Reserve – zufrieden']; } catch (e) { return ['🙂', '']; } };
  const zeile = (i, posTxt, cls) => { const p = PLAYER_DATABASE[i], w = W5(i);
    return (() => '')() + zeile0(i, posTxt, cls, p, w) + (superteamZeigen.aufl === i && aufOk(i, posTxt) ? aufLeiste(i) : ''); };
  const zeile0 = (i, posTxt, cls, p, w) => {
    return '<div class="st-zeile ' + (cls || '') + (superteamZeigen.wahl === i ? ' st-wahl' : '') + '" data-i="' + i + '" data-art="' + posTxt + '"><span class="st-pos">' + posTxt + '</span><img src="' + BILDER[p.bild] + '" alt=""><span class="st-name">' + p.name + (faehigkeiten(p).length ? ' <span class="st-fae">' + faeIcons(p) + '</span>' : '') + (i === sq[0] ? ' <small>DU</small>' : '') + (stufe(p) ? ' <small>' + stufe(p) + '</small>' : '') + (p.name === kapitaenName() ? ' <small class="st-kap">©</small>' : '') + (quelle === 'menü' ? '<button type="button" class="st-cap' + (p.name === kapitaenName() ? ' an' : '') + '" data-kap="' + i + '" title="Kapitän bestimmen">©</button>' : '') + (marktOk(i) ? '<button type="button" class="st-mk' + (STAND.aufListe(i) ? ' an' : '') + '" data-mk="' + i + '" title="Transferliste">🏷</button>' : '') + (aufOk(i, posTxt) ? '<button type="button" class="st-ab" data-aufl="' + i + '" title="Vertrag auflösen">✂</button>' : '') + '</span><span class="st-ges">' + G(i) + '</span>' +
      ['sch', 'pas', 'tem', 'aud', 'abw'].map(k => '<span class="st-w">' + (w[k] != null ? w[k] : '–') + '</span>').join('') + '<span class="st-wert">' + (() => { try { return '≈ ' + STAND.marktWert(i).toLocaleString('de-DE'); } catch (e) { return '–'; } })() + '</span><span class="st-smi" title="' + smi(i, posTxt)[1] + '">' + smi(i, posTxt)[0] + '</span></div>'; };
  $('#stTitel').innerHTML = '⭐ SUPERTEAM' + (land ? ' · ' + flaggeHTML(land[0]) + ' ' + land[0].toUpperCase() : '');
  if (!sq.length){
    $('#stInfo').textContent = '';
    $('#stListe').innerHTML = '<div class="st-leer">Du hast noch kein Superteam.<br>Wähle im Menü ' + TEAM_GROESSE + ' Spieler und 2 Auswechselspieler.</div>';
  } else {
    const schnitt = Math.round(sq.reduce((a, i) => a + G(i), 0) / sq.length);
    let kaderN = 0; try { kaderN = (STAND.daten.karten || []).filter(n => { const i = PLAYER_DATABASE.findIndex(x => x.name === n); return i >= 0 && !sq.includes(i) && !er.includes(i); }).length; } catch (e) {}
    $('#stInfo').textContent = (quelle === 'liga' ? 'Team aus deiner Liga · ' : '') + 'Kader ' + kaderGesamt(sq, er) + ' Spieler · Aufstellung ' + form + ' · Stärke Ø ' + schnitt;
    const ordnung = sq.map((i, j) => ({ i, j, r: j === tw ? 0 : ({ DF: 1, MF: 2, ST: 3 }[PLAYER_DATABASE[i].role] || 2) })).sort((a, b) => a.r - b.r);
    $('#stListe').innerHTML = angHtml() + '<div class="st-zeile st-kopf"><span>POS</span><span></span><span>NAME</span><span>GES</span><span class="st-w">SCH</span><span class="st-w">PAS</span><span class="st-w">TEM</span><span class="st-w">AUS</span><span class="st-w">ABW</span><span class="st-wert">WERT <span class="sc-muenze">C</span></span><span class="st-smi">😊</span></div>' +
      ordnung.map(o => zeile(o.i, pos(o.i, o.j))).join('') +
      (er.length ? '<div class="st-trenn rk">🪑 BANKSPIELER</div>' + er.map(i => zeile(i, 'BANK', 'bank')).join('') : '') +
      (() => { let karten = []; try { karten = (STAND.daten.karten || []).map(n => PLAYER_DATABASE.findIndex(x => x.name === n)).filter(i => i >= 0 && !sq.includes(i) && !er.includes(i)); } catch (e) {}
        karten.sort((a, b) => G(b) - G(a));
        return karten.length ? '<div class="st-trenn rk">🪑 RESERVESPIELER (' + karten.length + ')' + (quelle === 'menü' ? ' · antippen zum Einwechseln' : '') + '</div>' + karten.map(i => zeile(i, 'KADER', 'bank kader')).join('') : ''; })();   // V5.3
    { const alle = new Set(); [...sq, ...er].forEach(i => faehigkeiten(PLAYER_DATABASE[i]).forEach(f => alle.add(f))); (STAND.daten.karten || []).forEach(n => { const p = PLAYER_DATABASE.find(x => x.name === n); faehigkeiten(p).forEach(f => alle.add(f)); });
      if (alle.size) $('#stListe').insertAdjacentHTML('beforeend', '<div class="st-legende">' + [...alle].map(f => '<span>' + FAEHIGKEIT[f].i + ' <b>' + FAEHIGKEIT[f].n + '</b> – ' + FAEHIGKEIT[f].t + '</span>').join('') + '</div>'); }
    if (quelle === 'menü') $('#stListe').insertAdjacentHTML('beforeend', '<div class="st-legende"><span>🏷 <b>Transferliste</b> – tippe auf 🏷, um einen Spieler anzubieten. Nach Liga-/Pokalspielen kommen manchmal Angebote: Starke Spieler locken eher Großteams, schwächere eher kleinere Nationen (die zahlen weniger). Der Marktwert richtet sich nach der Stärke und steht rechts als ≈ Crows (WERT). Zufriedenheit: 😄 spielt von Anfang an · 🙂 zufrieden · 😕 will mehr spielen · 😡 ist stärker als ein Stammspieler, sitzt aber draußen. ✂ löst den Vertrag eines Spielers gegen eine Summe auf (außer deinen eigenen).</span></div>');
    if (superteamZeigen.wahl != null) $('#stInfo').textContent = '🔄 ' + PLAYER_DATABASE[superteamZeigen.wahl].name + ' gewählt – jetzt den Spieler antippen, der raus soll';
    if (quelle === 'menü'){
      $('#stListe').querySelectorAll('[data-kap]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const i = +b.dataset.kap; kapitaenSetzen(PLAYER_DATABASE[i].name); superteamZeigen.wahl = null; superteamZeigen(); $('#stInfo').textContent = '© ' + PLAYER_DATABASE[i].name + ' ist jetzt Kapitän'; }));
      $('#stListe').querySelectorAll('[data-mk]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const i = +b.dataset.mk, an = STAND.marktListe(i); superteamZeigen.wahl = null; superteamZeigen(); $('#stInfo').textContent = an ? '🏷 ' + PLAYER_DATABASE[i].name + ' steht auf der Transferliste (Wert ca. ' + STAND.marktWert(i).toLocaleString('de-DE') + ')' : '🏷 ' + PLAYER_DATABASE[i].name + ' ist wieder aus dem Markt'; }));
      $('#stListe').querySelectorAll('[data-mnein]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); STAND.marktAblehnen(+b.dataset.mnein); superteamZeigen(); }));
      $('#stListe').querySelectorAll('[data-mja]').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); const k = +b.dataset.mja, a = STAND.daten.markt.ang[k]; if (!a) return superteamZeigen();
        const i = PLAYER_DATABASE.findIndex(x => x.name === a.n), msg = t => { superteamZeigen(); $('#stInfo').textContent = t; };
        if (i < 0) return superteamZeigen();
        try { const li = LIGA.info; if (li && ((li.squad || []).includes(i) || (li.ersatz || []).includes(i))) return msg('⛔ ' + a.n + ' spielt in deiner laufenden Liga – erst nach der Saison möglich'); } catch (x) {}
        const inSq = zustand.squad.indexOf(i), inEr = zustand.ersatz.indexOf(i); let rep = null;
        if (inSq >= 0 || inEr >= 0){
          const vk = STAND.daten.verkauft || [], ka = STAND.daten.karten || [];
          let cand = PLAYER_DATABASE.map((p, x) => x).filter(x => x !== i && !zustand.squad.includes(x) && !zustand.ersatz.includes(x) && ((PLAYER_DATABASE[x].eigen && !vk.includes(PLAYER_DATABASE[x].name)) || ka.includes(PLAYER_DATABASE[x].name)));
          try { cand = cand.filter(x => !VERLETZT.ist(x)); } catch (x) {}
          cand.sort((p, q) => ((PLAYER_DATABASE[q].role === PLAYER_DATABASE[i].role) - (PLAYER_DATABASE[p].role === PLAYER_DATABASE[i].role)) || (G(q) - G(p)));
          if (!cand.length) return msg('⛔ Kein Ersatzspieler für ' + a.n + ' vorhanden');
          rep = cand[0];
        }
        const r = STAND.marktVerkaufen(k);
        if (r.fehler === 'min') return msg('⛔ Du musst mindestens 13 Spieler im Besitz behalten');
        if (!r.ok) return superteamZeigen();
        if (rep != null){
          if (inSq >= 0) zustand.squad[inSq] = rep; if (inEr >= 0) zustand.ersatz[inEr] = rep;
          ['formSlot', 'nummern', 'posi'].forEach(key => { const o = zustand[key]; if (o && typeof o === 'object' && o[i] != null){ o[rep] = o[i]; delete o[i]; } });
          try { formSpeichern(); } catch (x) {} try { ersatzSpeichern(); } catch (x) {}
        }
        try { musik.auswahl && musik.auswahl(true); } catch (x) {}
        aktualisiere(); try { zeichneKarten(); } catch (x) {} superteamZeigen();
        $('#stInfo').textContent = '💰 ' + r.name + ' an ' + r.team + ' verkauft · +' + r.preis.toLocaleString('de-DE') + ' Crows'; toast('💰 ' + r.name + ' verkauft · +' + r.preis.toLocaleString('de-DE') + ' Crows');
      }));
      $('#stListe').querySelectorAll('[data-aufl]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const i = +b.dataset.aufl; superteamZeigen.aufl = superteamZeigen.aufl === i ? null : i; superteamZeigen.wahl = null; superteamZeigen(); }));
      $('#stListe').querySelectorAll('[data-aufnein]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); superteamZeigen.aufl = null; superteamZeigen(); }));
      $('#stListe').querySelectorAll('[data-aufja]').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); const i = +b.dataset.aufja, p = PLAYER_DATABASE[i];
        try { const li = LIGA.info; if (li && ((li.squad || []).includes(i) || (li.ersatz || []).includes(i))){ superteamZeigen.aufl = null; superteamZeigen(); $('#stInfo').textContent = '⛔ ' + p.name + ' spielt in deiner laufenden Liga – erst nach der Saison möglich'; return; } } catch (x) {}
        let repl = null; const inSq0 = zustand.squad.indexOf(i);
        if (inSq0 >= 0){   // V10.1: Feldspieler auflösen – bester Ersatz rückt nach
          const vk = STAND.daten.verkauft || [], ka = STAND.daten.karten || [];
          let cand = PLAYER_DATABASE.map((q, x) => x).filter(x => x !== i && !zustand.squad.includes(x) && !zustand.ersatz.includes(x) && ((PLAYER_DATABASE[x].eigen && !vk.includes(PLAYER_DATABASE[x].name)) || ka.includes(PLAYER_DATABASE[x].name)));
          try { cand = cand.filter(x => !VERLETZT.ist(x)); } catch (x) {}
          cand.sort((a, b) => ((PLAYER_DATABASE[b].role === PLAYER_DATABASE[i].role) - (PLAYER_DATABASE[a].role === PLAYER_DATABASE[i].role)) || (G(b) - G(a)));
          if (!cand.length){ superteamZeigen.aufl = null; superteamZeigen(); $('#stInfo').textContent = '⛔ Kein Ersatzspieler für ' + p.name + ' vorhanden'; return; }
          repl = cand[0];
        }
        const r = STAND.vertragAufloesen(i);
        if (r.fehler === 'min'){ superteamZeigen.aufl = null; superteamZeigen(); $('#stInfo').textContent = '⛔ Du musst mindestens 13 Spieler im Besitz behalten'; return; }
        if (r.fehler === 'geld'){ $('#stInfo').textContent = '⛔ Nicht genug Crows – dir fehlen ' + (r.preis - STAND.credits).toLocaleString('de-DE'); return; }
        if (!r.ok){ superteamZeigen.aufl = null; superteamZeigen(); return; }
        if (repl != null && inSq0 >= 0){ zustand.squad[inSq0] = repl;
          ['formSlot', 'nummern', 'posi'].forEach(key => { const o = zustand[key]; if (o && typeof o === 'object' && o[i] != null){ o[repl] = o[i]; delete o[i]; } });
          try { formSpeichern(); } catch (x) {} }
        const k = zustand.ersatz.indexOf(i);
        if (k >= 0){ zustand.ersatz.splice(k, 1);   // Bankplatz mit der besten Reserve wieder auffüllen
          try { const rest = (STAND.daten.karten || []).map(n => PLAYER_DATABASE.findIndex(x => x.name === n)).filter(j => j >= 0 && !zustand.squad.includes(j) && !zustand.ersatz.includes(j)).sort((a, b) => G(b) - G(a)); if (rest.length && zustand.ersatz.length < BANK_GROESSE) zustand.ersatz.push(rest[0]); } catch (x) {} }
        try { ersatzSpeichern(); } catch (x) {}
        superteamZeigen.aufl = null; superteamZeigen.wahl = null; try { musik.auswahl && musik.auswahl(true); } catch (x) {}
        aktualisiere(); try { zeichneKarten(); } catch (x) {} superteamZeigen();
        toast('✂ ' + p.name + ' verlassen · −' + r.preis.toLocaleString('de-DE') + ' Crows' + (r.land ? ' · wechselt zu ' + r.land : ''));
      }));
    }
    if (quelle === 'menü') $('#stListe').querySelectorAll('.st-zeile[data-i]').forEach(z => z.addEventListener('click', () => {
      const i = +z.dataset.i, art = z.dataset.art;
      if (art === 'KADER'){ superteamZeigen.wahl = superteamZeigen.wahl === i ? null : i; return superteamZeigen(); }
      const w = superteamZeigen.wahl; if (w == null) return;
      if (art === 'BANK'){ const k = zustand.ersatz.indexOf(i); if (k >= 0) zustand.ersatz[k] = w; }
      else { const k = zustand.squad.indexOf(i); if (k >= 0) zustand.squad[k] = w; }
      try { ersatzSpeichern(); } catch (e) {}
      superteamZeigen.wahl = null; try { musik.auswahl && musik.auswahl(true); } catch (e) {}
      aktualisiere(); try { zeichneKarten(); } catch (e) {} superteamZeigen();
    }));
  }
  $('#stUeber').hidden = false;
}

document.getElementById('stZu').addEventListener('click', () => { superteamZeigen.wahl = null; $('#stUeber').hidden = true; });
$('#zurueck').addEventListener('click', () => { if (zustand.seite > 1){ zustand.seite--; zeichneKarten(); } });
$('#vor').addEventListener('click', () => { if (zustand.seite < seitenAnzahl()){ zustand.seite++; zeichneKarten(); } });

// ---------- Meldung ----------
function toast(t){
  const el = $('#mToast'); el.textContent = t; el.classList.add('zeigen');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('zeigen'), 2400);
}

// ---------- Spiel starten (Anpfiff folgt in Meilenstein 3) ----------
// V3.0: FORTSETZEN ist ein schneller Einstieg in den bereits geladenen Spielstand.
const fortsetzenKnopf = document.getElementById('fortsetzenKnopf');
const menuStatus = document.getElementById('menuStatus');
// V2.6: Laufende Liga / laufender Pokal: Team steht im Menü schon bereit, ein Knopf setzt fort.
function fortsetzenPruefen(){
  if (!fortsetzenKnopf) return;
  let li = null, tu = false;
  try { li = LIGA.info; } catch (e) {}
  try { tu = TURNIER.gespeichert; } catch (e) {}
  const an = false;   // V6.6: kein großer Fortsetzen-Knopf mehr – er hat Freundschaft/Pokal/Liga aus dem Bild geschoben.
  fortsetzenKnopf.hidden = !an; fortsetzenKnopf.style.display = an ? '' : 'none'; fortsetzenKnopf.disabled = !an;
  // Laufender Pokal / laufende Liga bekommen ein kleines ▶ auf ihrer Kachel; Antippen fragt „fortsetzen oder neu“.
  { const pk = document.getElementById('pokalKnopf'), lk = document.getElementById('ligaKnopf');
    pk && pk.classList.toggle('laeuft', !!tu); lk && lk.classList.toggle('laeuft', !!li);
    // V5.9: Badge zeigt, mit welchem Land und welcher Stufe die League / der Silescrow Cup läuft
    { const txt = x => { if (!x) return 'LÄUFT'; let l = x.land; if (typeof l === 'number') l = COUNTRY_DATABASE[l]; else if (typeof l === 'string') l = COUNTRY_DATABASE.find(c => c[0] === l); const n = Array.isArray(l) ? String(l[0]).slice(0, 3).toUpperCase() : ''; const st = { leicht: 'LEICHT', mittel: 'MITTEL', stark: 'STARK' }[x.stufe] || ''; return [n, st].filter(Boolean).join(' · ') || 'LÄUFT'; };
      let ti = null; try { ti = TURNIER.info; } catch (e) {}
      if (lk) lk.dataset.info = txt(li); if (pk) pk.dataset.info = txt(ti); }
    if (tu && pk) pk.classList.remove('aus'); if (li && lk) lk.classList.remove('aus'); }
  fortsetzenKnopf.textContent = li ? '▶ LIGA FORTSETZEN · ' + Math.min(li.tag + 1, li.tage) + '/' + li.tage : '▶ POKAL FORTSETZEN';
  // Team aus der laufenden Liga ins Menü übernehmen (nur wenn gerade keins gewählt ist)
  if (li && li.stufe && !zustand.ligaStufeGesetzt){ zustand.ligaStufeGesetzt = true; stufeMarkieren(li.stufe); }   // V4.5
  const ligaTeamErsteMal = !zustand.ligaTeamGeprueft; zustand.ligaTeamGeprueft = true;   // V9.3: nur einmal übernehmen, sonst kommt das Liga-Team nach dem Abwählen immer wieder zurück
  if (ligaTeamErsteMal && li && li.squad && !zustand.squad.length && !istGastModus()){
    zustand.squad = li.squad.filter(i => PLAYER_DATABASE[i]);
    zustand.torwart = li.torwart != null ? li.torwart : -1;
    if (Array.isArray(li.ersatz)) zustand.ersatz = li.ersatz.slice(0, BANK_GROESSE);
    try { aktualisiere(); } catch (e) {}
  }
}
if (fortsetzenKnopf) {
  fortsetzenKnopf.addEventListener('click', () => {
    let li = null; try { li = LIGA.info; } catch (e) {}
    if (li){ try { ligaMitMenueTeamFortsetzen(); } catch (e) { toast('Liga konnte nicht fortgesetzt werden.'); } return; }
    try { if (TURNIER.gespeichert && TURNIER.fortsetzen()) return; } catch (e) {}
    toast('Nichts zum Fortsetzen gefunden.');
  });
}
setTimeout(() => { try { ersatzLaden(); fortsetzenPruefen(); aktualisiere(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } }, 0);
document.addEventListener('visibilitychange', () => { if (!document.hidden) try { fortsetzenPruefen(); } catch (e) {} });

$('#start').addEventListener('click', () => {
  // Sicherheitsnetz: bei kompletter Teamwahl automatisch fehlende Pflichtwerte setzen.
  if (zustand.squad.length >= TEAM_GROESSE) {
    // V2.63: Der menschliche Spieler und der Torwart werden strikt getrennt.
    // Feldposition STU/MIT/ABW => squad[0] bleibt dein Spieler; ein KI-Spieler geht ins Tor.
    // Nur die ausdrückliche Wahl TOR darf squad[0] zum Torwart machen.
    if (rolleDu === 'tor') zustand.torwart = 0;
    else zustand.torwart = besterTorwart();
    if (!zustand.land || !zustand.land[0]) zustand.land = COUNTRY_DATABASE[0]; // Deutschland
  }
  aktualisiere();
  if (zustand.squad.length < TEAM_GROESSE) { toast('Wähle zuerst alle ' + TEAM_GROESSE + ' Spieler und ' + BANK_GROESSE + ' Auswechselspieler.'); return; }
  // Ein alter Online-Zustand darf den normalen Start nicht blockieren.
  const echterOnlineModus = NETZ.rolle === 'host' && NETZ.modusEff === 'zusammen' && NETZ.gaeste.length > 0;
  const g = echterOnlineModus ? NETZ.gaeste.length : 0;
  const modus = echterOnlineModus ? NETZ.modusEff : null;
  let squad = zustand.squad.slice(), torwart = zustand.torwart;
  const nummern = Object.fromEntries(squad.map(i => [i, zustand.nummern[i]]));
  const plaetze = {}, gegnerPlaetze = {};
  if (modus === 'zusammen'){
    const gp = zustand.gastPlaetze || [];
    if (gp.length !== g || gp.some(x => x.idx == null && !x.gegner)){ toast('Warte, bis alle Mitspieler ihren Spieler gewählt haben.'); return; }
    // Reihenfolge: du, die Spieler der Gäste (nach ihren Plätzen), dann die KI-Spieler – alles aus deinem Team
    const twIdx = torwart >= 0 ? squad[torwart] : null;
    const gpT = gp.filter(x => !x.gegner).sort((a, b) => a.k - b.k), gpG = gp.filter(x => x.gegner).sort((a, b) => a.k - b.k);
    const gs = gpT.map(x => x.idx);
    squad = [squad[0], ...gs, ...squad.slice(1).filter(i => !gs.includes(i))];
    torwart = twIdx == null ? -1 : squad.indexOf(twIdx);
    gpT.forEach(x => { plaetze[x.gid] = 1 + gs.indexOf(x.idx); });
    { const tgx = gegnerTeamGast(), anderG = gpG.filter(x => !tgx || x.gid !== tgx.gid);
      gpG.forEach((x, j) => { plaetze[x.gid] = gs.length + 1 + j; gegnerPlaetze[x.gid] = (tgx && x.gid === tgx.gid) ? 1 : anderG.indexOf(x) + 1; }); }   // V4.3: Gegner-Gäste, Nummer = Rang unter den Gegner-Feldspielern
  }
  // V4.2: Gast im Gegnerteam bringt sein eigenes 5er-Team mit (Freundschaftsspiel)
  let eigenGegner = {};
  { const tg = modus === 'zusammen' ? gegnerTeamGast() : null;
    if (tg){
      if (!gegnerTeamOK(tg)){ toast('Warte, bis ' + (tg.nm || 'dein Gegner') + ' sein Team mit 9 Spielern gewählt hat.'); return; }
      const q = tg.gt, dup = q.sq.find(i => zustand.squad.includes(i));
      if (dup != null){ toast(PLAYER_DATABASE[dup].name + ' steht in beiden Teams – einer von euch muss wechseln.'); return; }
      let gl = q.land >= 0 && COUNTRY_DATABASE[q.land] ? COUNTRY_DATABASE[q.land] : null;
      if (!gl || gl[0] === zustand.land[0]){ const alt = COUNTRY_DATABASE.filter(l => l[0] !== zustand.land[0]); gl = alt[(Math.random() * alt.length) | 0]; }
      const nr = {}; q.sq.forEach(i => { const v = Number(q.nr && q.nr[i]); if (v >= 1 && v <= 99) nr[i] = v; });
      const posi = {}; q.sq.forEach((i, j) => { const v = q.ps && q.ps[i]; if (j !== q.tw && v && POS_NAMEN.includes(v)) posi[i] = v; });
      eigenGegner = { gegnerIdx: q.sq.slice(), twG: q.tw, gegnerNummern: nr, gegnerPosi: posi, gegnerSteuer: { [tg.gid]: q.sq[0] }, gegnerLand: gl };
    } }
  positionenAbgleichen();
  const opt = { ...eigenGegner, squad, torwart, menschTorwart: rolleDu === 'tor', land: zustand.land, superteam: (zustand.teamArt || 'super') === 'super', stufe: zustand.stufe, modus, nummern, fernAnzahl: g, plaetze, gegnerPlaetze, posi: { ...zustand.posi }, formation: zustand.formation, formSlot: { ...zustand.formSlot }, wechsel: false, ersatz: ersatzAuffuellen(squad) };   // V2.6: 9 + 2

  // Das Starter-Pack liegt bereits im Hauptmenü bereit und wird dort geöffnet.
  const los = () => {
    try {
      if (TEST_11 && !window.__ligaModus && window.__modus81 !== 'pokal' && !(modus && opt.gegnerIdx)){   // V9.0: online BLAU gegen ROT nicht als Offline-Spiel starten
        // V2.2: Freundschaftsspiel gegen den Computer (Pokal und Liga haben eigene Knöpfe)
        window.__ligaModus = false;
        try { SPIEL.starte({ ...opt, modus: null, fernAnzahl: 0, plaetze: {}, gegnerPlaetze: {}, ...(window.__gegnerFreund ? { gegnerLand: window.__gegnerFreund } : {}), ...(window.__gegnerFreund && opt.land && window.__gegnerFreund[0] === opt.land[0] ? { kaderBasis: { land: null, squad: opt.squad, ersatz: opt.ersatz || [] } } : {}) }); } catch (err) { console.error('SILESCROW 11ER-TEST FEHLER', err); toast('Startfehler: ' + (err && err.message ? err.message : 'bitte erneut versuchen')); }
        return;
      }
      // V5.8: Online gibt es nur Freundschaftsspiele (kein Silescrow Cup, keine League)
      if (modus && (window.__ligaModus || window.__modus81 === 'pokal')){ window.__ligaModus = false; toast(ONLINE_NUR_FREUND); return; }
      if (window.__ligaModus) {
        window.__ligaModus = false;
        if (modus) {
          // V6.4: Liga online – ihr spielt zusammen in einem Team, Gastgeber startet, Mitspieler sehen die Tabelle
          if (opt.gegnerIdx) { toast('Die Liga spielt ihr zusammen in einem Team – stelle das Gegnerteam im Raum zurück auf BLAU.'); return; }
          const ligaOnlineNeu = () => { try { LIGA.neu(opt); } catch (err) { console.error('SILESCROW ONLINE-LIGA FEHLER', err); toast('Startfehler: ' + (err && err.message ? err.message : 'bitte erneut versuchen')); } };
          if (LIGA.gespeichert) {
            wahlDialog('ONLINE-LEAGUE', 'Es gibt noch eine gespeicherte League. Ihr spielt mit eurem aktuellen Team weiter.', '▶ LIGA FORTSETZEN', 'NEUE LIGA (alte wird ersetzt)',
              () => { let r = false; try { r = LIGA.fortsetzenOnline(opt); } catch (e) { console.error(e); r = 'Fortsetzen nicht möglich.'; } if (r !== true) toast(r); }, ligaOnlineNeu);
          } else ligaOnlineNeu();
          return;
        }
        LIGA.neu(opt);
        return;
      }
      if (modus && opt.gegnerIdx) {
        // V4.2: Gast bringt sein eigenes Team mit -> einzelnes Freundschaftsspiel gegeneinander
        try { SPIEL.starte(opt); } catch (err) { console.error('SILESCROW FREUNDSCHAFTSSPIEL FEHLER', err); toast('Startfehler: ' + (err && err.message ? err.message : 'bitte erneut versuchen')); }
        return;
      }
      if (modus) {
        // V4.1: Online läuft als echtes Turnier (Turnierbaum nach jedem Spiel), nicht mehr als Einzelspiel.
        const onlineNeu = () => {
          try { TURNIER.neu(opt); }
          catch (err) { console.error('SILESCROW ONLINE-TURNIER FEHLER', err); SPIEL.starte(opt); }
        };
        if (TURNIER.gespeichert) {
          wahlDialog('ONLINE SILESCROW CUP', 'Es gibt noch einen gespeicherten Silescrow Cup. Ihr spielt mit eurem aktuellen Team weiter.', '▶ CUP FORTSETZEN', 'NEUER CUP (alter wird ersetzt)',
            () => { let r = false; try { r = TURNIER.fortsetzenOnline(opt); } catch (e) { console.error(e); r = 'Fortsetzen nicht möglich.'; } if (r !== true) toast(r); }, onlineNeu);
        } else onlineNeu();
        return;
      }
      // Turnierstart robust ausführen. Ein beschädigter alter Zustand darf
      // den Anpfiff nicht mehr mit einem generischen Startfehler abbrechen.
      const turnierNeu = () => {
        try {
          TURNIER.neu(opt);
        } catch (err) {
          console.error('SILESCROW TURNIER FEHLER', err);
          // Fallback: direkt ins Spiel mit einem sicheren KI-Gegner.
          const frei = PLAYER_DATABASE.map((p, i) => i).filter(i => !opt.squad.includes(i));
          const pool = frei.slice().sort(() => Math.random() - .5);
          const gegnerIdx = pool.slice(0, TEAM_GROESSE);
          const laender = COUNTRY_DATABASE.filter(l => l[0] !== opt.land[0]);
          const gegnerLand = laender.length ? laender[(Math.random() * laender.length) | 0] : COUNTRY_DATABASE[0];
          SPIEL.starte({ ...opt, gegnerIdx, gegnerLand, turnier: 'ACHTELFINALE' });
        }
      };
      // V3.54: Gespeichertes Turnier fortsetzen oder neu starten
      if (TURNIER.gespeichert && !window.__pokalNeuOK) {
        wahlDialog('SILESCROW CUP', 'Du hast noch einen gespeicherten Silescrow Cup.', '▶ SILESCROW CUP FORTSETZEN', 'NEUER SILESCROW CUP (alter wird ersetzt)',
          () => { try { laufHinweis(TURNIER.info, 'Der Silescrow Cup'); } catch (e) {} let ok = false; try { ok = TURNIER.fortsetzen(); } catch (e) { console.error(e); } if (!ok) turnierNeu(); }, turnierNeu);
      } else turnierNeu();
    } catch (err) {
      console.error('SILESCROW START FEHLER', err);
      toast('Startfehler: ' + (err && err.message ? err.message : 'bitte erneut versuchen'));
    }
  };
  los();
});
$('#anpfiffZu').addEventListener('click', () => { $('#anpfiff').hidden = true; });