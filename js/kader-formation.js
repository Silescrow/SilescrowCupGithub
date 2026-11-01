/* Silescrow Cup V 4.2 – js/kader-formation.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

const PRESSE_STAND = (() => {
  let d = null;
  const lade = () => { if (d) return d; try { d = JSON.parse(LS81.getItem('sc_presse') || 'null'); } catch (e) { d = null; } if (!d || typeof d.b !== 'number') d = { b: 50, g: 0, h: [] }; if (!Array.isArray(d.h)) d.h = []; return d; };
  const speichern = () => { try { LS81.setItem('sc_presse', JSON.stringify(d)); } catch (e) {} anzeigen(); };
  const anzeigen = () => { try { const el = document.getElementById('mBeliebt'); if (!el) return; const b = Math.round(lade().b); el.textContent = '❤️ BELIEBTHEIT ' + b + ' %'; el.title = 'Beliebtheit bei den Fans: mehr Zuschauer und lautere Stimmung'; el.classList.toggle('hoch', b >= 80); el.classList.toggle('tief', b < 30); } catch (e) {} };
  return {
    get b(){ return lade().b; }, get g(){ return lade().g; },
    aendern(db, dg){ lade(); d.b = Math.max(0, Math.min(100, d.b + db)); d.g = Math.max(-4, Math.min(4, d.g + dg)); speichern(); },
    verfall(){ lade(); d.b = Math.max(0, d.b - 2); speichern(); },
    geistNehmen(){ lade(); const g = d.g; d.g = 0; speichern(); return g; },
    gehoert(k){ return lade().h.includes(k); },
    merke(k){ lade(); d.h.push(k); if (d.h.length > 900) d.h.splice(0, d.h.length - 900); speichern(); },
    vergiss(prefix){ lade(); d.h = d.h.filter(x => !x.startsWith(prefix)); speichern(); },
    anzeigen
  };
})();
document.addEventListener('DOMContentLoaded', () => { PRESSE_STAND.anzeigen(); setInterval(() => PRESSE_STAND.anzeigen(), 3000); });
// V5.3: Stärke der Länder (echte Einstufung 2026) – Basisbonus, dazu Zufall pro Liga-Saison bzw. Pokal
const LAND_STUFE = { 'Spanien': 5, 'Argentinien': 5, 'Frankreich': 5, 'England': 5, 'Brasilien': 5, 'Portugal': 4, 'Marokko': 4, 'Niederlande': 4, 'Belgien': 4, 'Deutschland': 4, 'Kroatien': 4,
  'Mexiko': 3, 'Italien': 3, 'Kolumbien': 3, 'Uruguay': 3, 'Schweiz': 3, 'Dänemark': 3, 'Japan': 3, 'USA': 3, 'Senegal': 2, 'Türkei': 4, 'Österreich': 2, 'Südkorea': 2, 'Iran': 2, 'Polen': 2, 'Nigeria': 2, 'Ägypten': 2 };
function landBonus(land, seed){
  const name = Array.isArray(land) ? land[0] : String(land || '');
  let hsh = (seed | 0) ^ 0x9e3779b9; for (const ch of name) hsh = Math.imul(hsh ^ ch.charCodeAt(0), 2654435761) >>> 0;
  const basis = [0, 0, 3, 6, 10, 14][LAND_STUFE[name] || 1];   // V9.6: früher [0, 0, 2, 4, 7, 10]
  return basis + (hsh % 7);   // + 0 … 6 zufällig
}
// V4.1: Nationen nach Sternen (5 / 4 / 3). Standardspieler: 5★ 72–76, 4★ 68–72, 3★ 64–68.
const NATION_STERNE = land => { const st = LAND_STUFE[land] || 1; return st >= 5 ? 5 : st >= 4 ? 4 : 3; };
function nationStandardWert(land, name){
  const c = { 5: 74, 4: 70, 3: 67, 2: 66, 1: 65 }[LAND_STUFE[land] || 1];
  return c - 2 + (nameHash(String(land) + '|' + name) % 5);
}
// Jede Nation hat feste Pack-Spieler: die 10 stärksten Nationen einen Gold-, die 20 stärksten einen Silber-, alle einen Bronze-Spieler
const NATION_KARTEN = (() => {   // V11.8: alle Pack-Spieler sind verteilt – Weltklasse 2 Gold + 1 Silber, stark 1 Gold + 2 Silber, Türkei 3 Silber, mittel 2 Silber + 2 Bronze, schwächer 4 Bronze
  const pos = n => COUNTRY_DATABASE.findIndex(l => l[0] === n);
  const rang = COUNTRY_DATABASE.map(l => l[0]).sort((x, y) => (LAND_STUFE[y] || 1) - (LAND_STUFE[x] || 1) || pos(x) - pos(y));
  const plan = n => { const st = LAND_STUFE[n] || 1; if (n === 'Türkei') return { gold: 0, silber: 3, bronze: 0 };
    return st >= 5 ? { gold: 2, silber: 1, bronze: 0 } : st >= 4 ? { gold: 1, silber: 2, bronze: 0 } : st >= 3 ? { gold: 0, silber: 2, bronze: 2 } : { gold: 0, silber: 0, bronze: 4 }; };
  const nach = st => PLAYER_DATABASE.map((p, i) => i).filter(i => PLAYER_DATABASE[i].stufe === st).sort((x, y) => PLAYER_DATABASE[y].rating - PLAYER_DATABASE[x].rating || x - y);
  const k = {}; rang.forEach(n => k[n] = []);
  for (const st of ['gold', 'silber', 'bronze']){
    const rest = nach(st);
    for (let runde = 0; runde < 4; runde++) rang.forEach(n => { if (plan(n)[st] <= runde || !rest.length) return;
      const hatTW = k[n].some(i => PLAYER_DATABASE[i].role === 'TW');
      let j = rest.findIndex(i => !(hatTW && PLAYER_DATABASE[i].role === 'TW')); if (j < 0) j = 0; k[n].push(rest.splice(j, 1)[0]); });
    rest.forEach((i, q) => { const n = rang[rang.length - 1 - (q % rang.length)]; k[n].push(i); });   // falls je etwas übrig bleibt: auch verteilen
    // höchstens ein Torwart pro Nation: doppelte Torhüter gegen einen Feldspieler derselben Stufe einer Nation ohne Torwart tauschen
    const tw = i => PLAYER_DATABASE[i].role === 'TW';
    rang.forEach(n => { while (k[n].filter(tw).length > 1){ const x = k[n].filter(i => tw(i) && PLAYER_DATABASE[i].stufe === st).pop(); if (x == null) break;
      const m = rang.find(o => o !== n && !k[o].some(tw) && k[o].some(i => PLAYER_DATABASE[i].stufe === st)); if (!m) break;
      const y = k[m].find(i => PLAYER_DATABASE[i].stufe === st); k[n][k[n].indexOf(x)] = y; k[m][k[m].indexOf(y)] = x; } });
  }
  return k;
})();
const PLAYERS_PER_PAGE = 15;   // V9.2: 15 pro Seite, 3 Seiten = 45 sichtbare Spieler
const PLATZ_NAMEN = ["DU","KI 1","KI 2","KI 3"];

// ---------- Zustand (später für Mehrspieler erweiterbar) ----------
const zustand = {
  seite: 1,
  squad: [],            // bis zu 4 Spieler-Indizes; Platz 0 = du, 1–3 = KI
  torwart: -1,          // Index im squad, der im Tor steht
  land: null,
  stufe: 'mittel',
  gastPlaetze: [],       // Gastgeber: Wahlen der Mitspieler [{gid,k,idx}]
  ersteAuswahlGemacht: false // Initialen ersten Spieler nur einmal automatisch markieren
};
// Auswahl: eure Spieler zuerst, dann Bronze-, Silber-, Goldkarten (gesperrt, bis freigespielt); reine KI-Spieler nicht
// V6.8: alle normalen Spieler wählbar (eure + alle übrigen), Bronze/Silber/Gold ganz hinten
const AUSWAHL = PLAYER_DATABASE.map((p, i) => i)
  .sort((a, b) => { const r = i => { const p = PLAYER_DATABASE[i]; return p.stufe ? 1 + ({bronze:1,silber:2,gold:3}[p.stufe]||4) : p.ki ? 1 : 0; }; return (r(a) - r(b)) || a - b; });
// V9.0: nur 30 Spieler sichtbar (eure zuerst); freigespielte Bronze/Silber/Gold-Karten und schon gewählte Spieler bleiben zusätzlich erreichbar
const AUSWAHL_30 = (() => {
  const basis = AUSWAHL.filter(i => !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].eigen);   // V11.9: nur die 28 eigenen Spieler, keine grauen KI-Karten
  const sc = basis.find(i => PLAYER_DATABASE[i].name === 'SILESCROW');   // V9.1: Hauptfigur an erste Stelle
  return (sc == null ? basis : [sc].concat(basis.filter(i => i !== sc))).slice(0, 45);
})();
// V10.3: Im Hauptmenü sind nur Spieler aus DEINEM Kader aktiv (Startelf + Bank + gekaufte/Pack-Karten).
// Solange das Team noch gebaut wird (Startelf/Bank nicht komplett), bleiben alle eigenen Spieler zur Auswahl aktiv.
function kaderTeamListe(){
  let sq = [], er = [];
  try { const li = (window.ligaGesperrt && window.ligaGesperrt()) ? LIGA.info : null;
    if (li && li.squad && li.squad.length){ sq = li.squad; er = li.ersatz || []; } else { sq = zustand.squad || []; er = zustand.ersatz || []; } } catch (e) { sq = zustand.squad || []; er = zustand.ersatz || []; }
  return sq.concat(er).filter((i, k, a) => i != null && PLAYER_DATABASE[i] && a.indexOf(i) === k);
}
function kaderFest(){
  try {
    if (window.ligaGesperrt && window.ligaGesperrt()) return true;
    return (zustand.squad || []).length >= TEAM_GROESSE && (zustand.ersatz || []).length >= BANK_GROESSE;
  } catch (e) { return false; }
}
function kartenAktiv(idx){
  const pz = PLAYER_DATABASE[idx]; if (!pz) return false;
  try { if (((STAND.daten && STAND.daten.verkauft) || []).includes(pz.name)) return false; } catch (e) {}
  let gekauft = false; try { gekauft = !!(STAND.daten && STAND.daten.karten && STAND.daten.karten.includes(pz.name)); } catch (e) {}
  if (gekauft) return true;
  if (!pz.eigen) return false;
  return !kaderFest() || kaderTeamListe().includes(idx);
}
// V11.3: Reihenfolge im Hauptmenü – Pack-Spieler, dann dein Superteam (markiert), dann alle übrigen eigenen Spieler, ganz hinten die gesperrten
function sichtbareAuswahl(){
  const roh = sichtbareAuswahlRoh();
  const pk = [], rest = [], zu = [];
  const mark = new Set((zustand.squad || []).concat(zustand.ersatz || []));
  try { if (window.ligaGesperrt && window.ligaGesperrt() && LIGA.info){ (LIGA.info.squad || []).concat(LIGA.info.ersatz || []).forEach(i => mark.add(i)); } } catch (e) {}
  roh.forEach(i => { let f = true; try { f = kartenAktiv(i); } catch (e) {} if (!f && !PLAYER_DATABASE[i].eigen && !mark.has(i)) return;   // V11.26: dein Kader (Startelf + Bank) bleibt immer sichtbar
      // V11.22: im Hauptmenü nur die 28 Startspieler (nicht verfügbare ausgegraut) und eigene Karten – keine fremden Nationalspieler oder nicht gekauften Packs
    if (PLAYER_DATABASE[i].stufe && f) pk.push(i); else if (f || mark.has(i)) rest.push(i); else zu.push(i); });
  const m = rest.filter(i => mark.has(i)), o = rest.filter(i => !mark.has(i));
  let liga = false; try { liga = !!(window.ligaGesperrt && window.ligaGesperrt() && LIGA.info); } catch (e) {}
  if (liga){ let sq = []; try { sq = (LIGA.info.squad || []).concat(LIGA.info.ersatz || []); } catch (e) {}   // V11.30: nach Liga-Start dein gesamter Kader – Startelf, Bank und alle eigenen Spieler (Reserve), keine fremden
    const eig = roh.filter(i => { try { return kartenAktiv(i); } catch (e) { return false; } });
    let kr = []; try { kr = STAND.kartenReihe(); } catch (e) {}   // V 3.07: Pack-Spieler immer ganz vorn: Gold, Silber, Bronze (je Stufe neueste zuerst), dann Kader, dann Rest
    const rg = i => ({ gold: 0, silber: 1, bronze: 2 })[PLAYER_DATABASE[i].stufe] ?? 3;
    const pf = pk.filter(i => eig.includes(i)).sort((a, b) => (rg(a) - rg(b)) || (kr.indexOf(PLAYER_DATABASE[b].name) - kr.indexOf(PLAYER_DATABASE[a].name)));
    return pf.concat(sq, eig).filter((i, k, a) => PLAYER_DATABASE[i] && a.indexOf(i) === k); }
  let fest = false; try { fest = kaderFest(); } catch (e) {}
  { let kr = []; try { kr = STAND.kartenReihe(); } catch (e) {} const rg = i => ({ gold: 0, silber: 1, bronze: 2 })[PLAYER_DATABASE[i].stufe] ?? 3;   // V 3.07: Gold, Silber, Bronze zuerst
    pk.sort((a, b) => (rg(a) - rg(b)) || (kr.indexOf(PLAYER_DATABASE[b].name) - kr.indexOf(PLAYER_DATABASE[a].name))); }
  return pk.concat(m, o, fest ? [] : zu);   // V11.25: steht das Team, verschwinden die ausgegrauten Spieler
}
function sichtbareAuswahlRoh(){
  // V10.6: freigespielte Pack-Spieler stehen ganz vorne, der neueste zuerst
  const packs = [];
  AUSWAHL.forEach(i => { if (PLAYER_DATABASE[i].stufe){ let ok = false; try { ok = STAND.hatKarte(i); } catch (e) {} if (ok) packs.push(i); } });
  let reihe = []; try { reihe = STAND.kartenReihe(); } catch (e) {}
  const stufeRang = i => ({ gold: 0, silber: 1, bronze: 2 })[PLAYER_DATABASE[i].stufe] ?? 3;   // V11.1: erst Gold, dann Silber, dann Bronze – innerhalb der Stufe der neueste zuerst
  packs.sort((a, b) => (stufeRang(a) - stufeRang(b)) || (reihe.indexOf(PLAYER_DATABASE[b].name) - reihe.indexOf(PLAYER_DATABASE[a].name)));
  const liste = packs.concat(AUSWAHL_30.filter(i => !packs.includes(i)));
  (zustand.squad || []).forEach(i => { if (PLAYER_DATABASE[i] && !liste.includes(i)) liste.push(i); });
  // V10.7: laufende Liga – die Spieler sind gesperrt; dein Kader (Startelf + Bank) steht vorne, alle anderen rutschen nach hinten
  try {
    if (window.ligaGesperrt && window.ligaGesperrt()){
      // V11.0: ganz vorne die Pack-Spieler, dann der Liga-Kader vom Start, dann alle übrigen (gesperrten) Spieler
      let li = null; try { li = LIGA.info; } catch (e) {}
      const quelle = li && li.squad && li.squad.length ? li.squad.concat(li.ersatz || []) : (zustand.squad || []).concat(zustand.ersatz || []);
      const kader = quelle.filter((i, k, a) => PLAYER_DATABASE[i] && !packs.includes(i) && a.indexOf(i) === k);
      const vorn = packs.concat(kader);
      return vorn.concat(liste.filter(i => !vorn.includes(i)));
    }
  } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  // V10.3: steht das Team, kommen die Kader-Spieler (Startelf + Bank) ganz nach vorn, alle anderen dahinter (ausgegraut)
  try { if (kaderFest()){ const team = kaderTeamListe(); const res = (typeof kartenRest === 'function' ? kartenRest(team) : []); const vorn = packs.concat(team.concat(res).filter((i, k, a) => !packs.includes(i) && a.indexOf(i) === k)); return vorn.concat(liste.filter(i => !vorn.includes(i))); } } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  // V11.1: markierte Spieler (Startelf + Bank) rücken direkt hinter die Pack-Spieler nach vorne
  const gew = (zustand.squad || []).concat(zustand.ersatz || []).filter((i, k, a) => i != null && PLAYER_DATABASE[i] && !packs.includes(i) && a.indexOf(i) === k);
  const vorn = packs.concat(gew);
  return vorn.concat(liste.filter(i => !vorn.includes(i)));
}
function seitenAnzahl(){ return Math.max(1, Math.ceil(sichtbareAuswahl().length / PLAYERS_PER_PAGE)); }

const $ = s => document.querySelector(s);
const raster = $('#raster'), plaetzeEl = $('#plaetze');

const gastTeamModus = () => NETZ.rolle === 'gast' && NETZ.partner;
// V6.0: Nur im Online-Cup sieht der Gast das Team des Gastgebers; im Freundschaftsspiel wählt er aus seinen eigenen Karten.
const gastHostAnsicht = () => gastTeamModus() && NETZ.onlineModus === 'cup';
function aktuelleSeitenSpieler(){
  if (gastHostAnsicht()){ const t = NETZ.hostTeam; return t && t.sq ? t.sq.map(i => [i, PLAYER_DATABASE[i]]).filter(x => x[1]) : []; }
  if (zustand.seite > seitenAnzahl()) zustand.seite = seitenAnzahl();
  const a = (zustand.seite - 1) * PLAYERS_PER_PAGE;
  let alle = sichtbareAuswahl();
  // Der stärkste Spieler steht immer ganz vorne (Gesamtwert mit Pack-Bonus und Training); gesperrte Karten bleiben hinten
  try {
    const st = i => { let g = 0; try { g = STAND.gesamt(i) || 0; } catch (e) {} return g || (PLAYER_DATABASE[i] ? PLAYER_DATABASE[i].rating : 0); };
    const fr = i => { try { return STAND.hatKarte(i) ? 1 : 0; } catch (e) { return 1; } };
    const wert = new Map(alle.map(i => [i, st(i)])), frei = new Map(alle.map(i => [i, fr(i)]));
    alle = alle.slice().sort((x, y) => (frei.get(y) - frei.get(x)) || (wert.get(y) - wert.get(x)));
  } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  const need = hinweisRolle();   // V3.1: benötigte Position zuerst, damit sie immer auf der ersten Seite steht
  if (need){ const ja = alle.filter(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role === need), nein = alle.filter(i => !(PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role === need)); alle = ja.concat(nein); }
  return alle.slice(a, a + PLAYERS_PER_PAGE).map(i => [i, PLAYER_DATABASE[i]]);
}

// Schrift im Namensschild verkleinern, bis der Name passt
function namePassen(el){
  const span = el.firstElementChild; span.style.transform = '';
  const platz = el.clientWidth - 8, breite = span.scrollWidth;
  if (breite > platz) span.style.transform = 'translate(-50%,-50%) scaleX(' + (platz / breite).toFixed(3) + ')';
}

// V2.09 Test: nächste fehlende Position im Kartenfenster hervorheben (Torwart, dann Abwehr, Mittelfeld, Sturm)
function hinweisRolle(){
  try {
    if (gastHostAnsicht()) return null;
    const sq = (zustand.squad || []).filter(x => x != null && PLAYER_DATABASE[x]);
    if (sq.length >= TEAM_GROESSE) return null;   // V3.1: Startelf voll – keine Sperre mehr
    // V3.1: Das Spiel setzt den Torwart erst bei voller Elf – vorher zählt ein Spieler mit Torwart-Position im Team
    const hatTW = (zustand.torwart != null && zustand.torwart >= 0) || sq.some(i => PLAYER_DATABASE[i].role === 'TW');
    if (!hatTW) return 'TW';
    const cnt = { DF: 0, MF: 0, ST: 0 };
    sq.forEach(i => { const r = PLAYER_DATABASE[i].role; if (cnt[r] != null) cnt[r]++; });
    if (cnt.DF < 4) return 'DF';
    if (cnt.MF < 4) return 'MF';
    if (cnt.ST < 2) return 'ST';
    return null;
  } catch (e) { return null; }
}
function zeichneKarten(){
  raster.innerHTML = '';
  const hinweis = hinweisRolle();
  for (const [idx, p] of aktuelleSeitenSpieler()){
    const b = document.createElement('button');
    b.type = 'button';
    const gt = gastHostAnsicht() ? NETZ.hostTeam : null, gpos = gt ? gt.sq.indexOf(idx) : -1;
    const frei = gt ? (gpos > 0 && !(NETZ.onlineModus === 'cup' && cupGesperrt(p))) : STAND.hatKarte(idx);
    b.className = 'karte' + (p.stufe ? ' stufe-' + p.stufe : '') + (!frei ? ' gesperrt' : '') + (p.farbe === '#d9dde6' ? ' hell' : '');
    b.style.setProperty('--c', p.farbe);
    b.dataset.idx = idx;
    b.dataset.role = p.role;   // Position nur intern (für die KI), nicht sichtbar
    if (!gastHostAnsicht() && hinweis){ if (p.role === hinweis) b.classList.add('sc-dran'); else b.classList.add('sc-aus'); }   // V3.0: passende Position leuchtet, der Rest wird ausgegraut (wählbar bleibt er)
    b.setAttribute('aria-label', p.name + ', Wert ' + p.rating);
    b.innerHTML =
      '<img src="' + BILDER[p.bild] + '" alt="">' +
      (p.stufe ? '<span class="tier-badge ' + p.stufe + '" aria-label="' + (p.stufe === 'gold' ? 'Gold' : p.stufe === 'silber' ? 'Silber' : 'Bronze') + '">' + (p.stufe === 'gold' || p.stufe === 'silber' ? '★' : '●') + '</span>' : '') +
      '<span class="wert">' + (gt && gt.w ? gt.w[gpos] : (ISTTRAIN(p) || (p.stufe && STAND.hatKarte(idx))) ? STAND.gesamt(idx) : p.rating) + '</span>' + (!frei && !gt ? '<span class="schloss">🔒</span>' : '') + (p.stufe ? '<span class="stern">★</span>' : '') + (faehigkeiten(p).length ? '<span class="fae">' + faeIcons(p) + '</span>' : '') +
      (p.pos ? '<span class="pos-kurz pk-' + p.role + '">' + p.pos + '</span>' : '') + '<span class="marke"></span><span class="neon"></span>' + (p.stufe ? '<span class="kauf-ico" title="Pack-Spieler (gekauft)">🛒</span>' : '') +
      '<span class="name"><span>' + p.name + '</span></span>';
    // V2.79: Die Markierung wird ausschließlich aus dem echten Team-Zustand gesetzt.
    // So gibt es keine Doppelreaktion von pointerdown + click und kein Flackern.
    b.addEventListener('click', () => { if (b.classList.contains('sc-aus') && !gastHostAnsicht()){ const n = { TW: 'einen Torwart', DF: 'einen Abwehrspieler', MF: 'einen Mittelfeldspieler', ST: 'einen Stürmer' }[hinweis] || 'die markierte Position'; toast('Wähle zuerst ' + n + ' – die grün blinkenden Karten sind dran.'); return; } karteGetippt(idx, b); });   // V3.1: nur die markierte Position ist wählbar
    raster.appendChild(b);
  }
  raster.classList.toggle('mitte13', raster.children.length === 13);
  const gtm = gastHostAnsicht();
  $('#seite').textContent = gtm ? 'TEAM DES GASTGEBERS' : 'SEITE ' + zustand.seite + ' / ' + seitenAnzahl();
  $('#zurueck').disabled = gtm || zustand.seite === 1;
  $('#vor').disabled = gtm || zustand.seite === seitenAnzahl();
  zeichneKarten.sig = gtm ? JSON.stringify(NETZ.hostTeam) : 'normal|' + hinweis;   // V3.1: neu zeichnen, sobald die gebrauchte Position wechselt
  raster.querySelectorAll('.name').forEach(namePassen);
  markiereKarten();
}

function maxHost(){ return TEAM_GROESSE; }   // Gastgeber stellt immer das ganze Team; Gäste übernehmen einen Spieler daraus
// V4.2: Freundschaftsspiel + Gegnerteam: Der Gast stellt ein eigenes 5er-Team aus seinen freigeschalteten Karten zusammen.
const gegnerGast = () => NETZ.rolle === 'gast' && NETZ.partner && NETZ.onlineModus === 'freund' && NETZ.teamVon(NETZ.gid) === 1;
const istGastModus = () => NETZ.rolle === 'gast' && NETZ.partner && !gegnerGast();
// Gastgeber: der Gast im Gegnerteam (nur Freundschaftsspiel) und ob sein Team vollständig ist
// V4.5: Doppelte Spieler schon in der Lobby melden
function doppelterSpieler(){ const tg = gegnerTeamGast(); if (!tg || !tg.gt || !tg.gt.sq) return null; const d = tg.gt.sq.find(i => zustand.squad.includes(i)); return d == null ? null : d; }
function doppelterSpielerGast(){ const h = NETZ.hostTeam; if (!h || !h.sq) return null; const d = zustand.squad.find(i => h.sq.includes(i)); return d == null ? null : d; }
// V4.3: Beschriftung des Startknopfs je nach Online-Lage
function startNameOnline(){
  if (NETZ.rolle !== 'host' || !NETZ.gaeste.length) return null;
  if (NETZ.onlineModus === 'freund' && gegnerTeamGast()) return 'FREUNDSCHAFTSSPIEL';
  return null;
}
function startKnopfText(){
  if (TEST_11) return '⚽ 11 GEGEN 11 STARTEN';
  const o = startNameOnline();
  return o === 'FREUNDSCHAFTSSPIEL' ? '⚽ FREUNDSCHAFTSSPIEL STARTEN' : o === 'ONLINE-CUP' ? '🏆 ONLINE-CUP STARTEN' : '🏆 TURNIER STARTEN / LADEN';
}
function gegnerTeamGast(){ if (NETZ.rolle !== 'host' || NETZ.onlineModus !== 'freund') return null; return NETZ.gaeste.find(g => NETZ.teamVon(g.gid) === 1) || null; }
function gegnerTeamOK(g){
  const q = g && g.gt; if (!q || !Array.isArray(q.sq) || q.sq.length !== TEAM_GROESSE) return false;
  if (new Set(q.sq).size !== q.sq.length) return false;
  if (!q.sq.every(i => Number.isInteger(i) && PLAYER_DATABASE[i])) return false;
  return Number.isInteger(q.tw) && q.tw > 0 && q.tw < q.sq.length;
}
// Gast: Team (Spieler, Torwart, Nummern, Positionen, Land) an den Gastgeber melden, nur bei Änderungen
function gegnerTeamMelden(){
  const sq = zustand.squad.slice(), n = sq.length;
  let o = null;
  if (n){
    let tw = zustand.torwart; if (!(tw > 0 && tw < n)) tw = n > 1 ? besterTorwart() : -1;
    o = { sq, tw, nr: Object.fromEntries(sq.map(i => [i, zustand.nummern[i]])),
          ps: Object.fromEntries(sq.map((i, j) => [i, tw === j ? 'TW' : (zustand.posi[i] || null)])),
          er: (zustand.ersatz || []).slice(), land: zustand.land ? COUNTRY_DATABASE.findIndex(l => l[0] === zustand.land[0]) : -1, art: zustand.teamArt || 'super' };
  }
  const sig = JSON.stringify(o); if (gegnerTeamMelden.sig === sig) return;
  gegnerTeamMelden.sig = sig; NETZ.teamMelden(o);
}
const m0 = k => NETZ.hostTeam && NETZ.hostTeam.sq && NETZ.hostTeam.sq.includes(+k.dataset.idx);
// V9.5: Spieler (Team + Auswechselspieler), die der Gegner im Online-Freundschaftsspiel schon gewählt hat
function gegnerAuswahlSet(){
  const set = new Set();
  try {
    let t = null;
    if (gegnerGast()) t = NETZ.hostTeam;
    else if (NETZ.rolle === 'host'){ const tg = gegnerTeamGast(); t = tg && tg.gt; }
    if (t){ (t.sq || []).forEach(i => set.add(i)); (t.er || []).forEach(i => set.add(i)); }
  } catch (e) {}
  return set;
}
function markiereKarten(){
  const gast = istGastModus();
  const gegSet = gast ? new Set() : gegnerAuswahlSet();
  const gp = (!gast && NETZ.rolle === 'host') ? (zustand.gastPlaetze || []) : [];
  raster.classList.toggle('voll', !gast && zustand.squad.length === maxHost());
  raster.querySelectorAll('.karte').forEach(k => {
    const idx = +k.dataset.idx;
    const pos = gast ? -1 : zustand.squad.indexOf(idx);
    const g = gp.find(x => x.idx === idx);
    const mein = gast && NETZ.wahl === idx;
    const fremd = gast && !mein && NETZ.vergebenGast.includes(idx);
    const bk = gast ? -1 : (zustand.ersatz || []).indexOf(idx);   // V2.6: Bank
    { const vz = gast ? 0 : VERLETZT.spiele(idx); k.classList.toggle('verletzt', vz > 0);   // V3.0: Verletzung
      let vk = k.querySelector('.vkreuz');
      if (vz > 0){ if (!vk){ vk = document.createElement('div'); vk.className = 'vkreuz'; k.appendChild(vk); } vk.innerHTML = '<span>✚</span><b>VERLETZT</b><small>noch ' + vz + ' Spiel' + (vz > 1 ? 'e' : '') + '</small>'; }
      else if (vk) vk.remove(); }
    const geg = gegSet.has(idx) && pos < 0 && bk < 0;
    k.classList.toggle('gegnerwahl', geg);
    const an = pos >= 0 || !!g || mein || bk >= 0;
    k.classList.toggle('gewaehlt', an);
    k.dataset.gewaehlt = an ? '1' : '0';
    { const pz = PLAYER_DATABASE[idx]; const besitz = !!pz && kartenAktiv(idx);   // V10.3: nur Spieler aus deinem Kader
      k.classList.toggle('besessen', !gast && besitz); k.classList.toggle('gesperrt', !gast && !besitz); }
    { const bankPhase = !gast && (zustand.squad.length < maxHost() || (zustand.ersatz || []).length < BANK_GROESSE);   // V3.09: Bank-Auswahl – nur wählbare Karten blinken
      let frei = false; try { frei = bankPhase && !an && !k.classList.contains('sc-aus') && !!PLAYER_DATABASE[idx] && kartenAktiv(idx) && VERLETZT.spiele(idx) === 0; } catch (e) {}
      k.classList.toggle('bank-frei', frei); }   // V10.8: nur eigene und tatsächlich erhaltene (Pack/Shop) Karten gelten als besessen
    k.classList.toggle('vergeben', fremd);
    k.classList.toggle('gastsicht', gast && !!m0(k));
    k.setAttribute('aria-pressed', an);
    const m = k.querySelector('.marke');
    const gg = !gast && pos > 0 && (zustand.gastPlaetze || []).find(x => x.idx === idx);
    if (bk >= 0){ m.textContent = 'BANK ' + (bk + 1); return; }
    m.textContent = gast ? (mein ? 'DU' : fremd ? 'VERGEBEN' : gastSlotText(idx)) :
                    pos >= 0 ? (pos === 0 ? '⭐ STAR' : gg ? '👤 SPIELER ' + (gg.k + 1) : ((zustand.torwart === pos ? 'TOR' : formLabel(idx)) || ({ TW: 'TOR', DF: 'ABW', MF: 'MIT', ST: 'STU' }[(PLAYER_DATABASE[idx]||{}).role] || '') || 'SPIELER')) + (zustand.torwart === pos ? ' 🧤' : '') : (geg ? 'GEGNER' : '');
    m.classList.toggle('tor', pos >= 0 && zustand.torwart === pos && !gg);
    m.classList.toggle('mensch', !!gg || mein);
  });
}

// Trikotnummern deines Teams (frei wählbar, Vorschlag nach Position)
zustand.nummern = {}; zustand.nrManuell = new Set();
// Positionen der 3 Feldspieler: je einer Abwehr, Mittelfeld, Sturm (Torwart separat)
const TEAM_GROESSE = 11;   // 8+1-Test (D-Jugend, 9 gegen 9); Hauptspiel: 5
// V11.9: Spieler dürfen beliebig viele Auswechselspieler haben – alle freigeschalteten Pack-Karten, die nicht auf dem Feld stehen
function kartenRest(squad){ try { return (STAND.daten.karten || []).map(n => PLAYER_DATABASE.findIndex(x => x.name === n)).filter(i => i >= 0 && !squad.includes(i)); } catch (e) { return []; } }

// V11.10: Kader = Feld + Bank + ALLE gekauften Spieler (jeder Spieler nur einmal gezählt)
function kaderGesamt(squad, ersatz){
  const s = new Set();
  (squad || []).forEach(i => { if (i != null && PLAYER_DATABASE[i]) s.add(i); });
  (ersatz || []).forEach(i => { if (i != null && PLAYER_DATABASE[i]) s.add(i); });
  try { (STAND.daten.karten || []).forEach(n => { const i = PLAYER_DATABASE.findIndex(x => x.name === n); if (i >= 0) s.add(i); }); } catch (e) {}
  return s.size;
}
// V11.10: Bank-Liste mit RESERVE-SPIELER-Überschrift darunter (alle Aufstellungsfenster)
function bankMitReserve(ids, m, mk, leerTxt){
  const a = ids.slice(0, m), b = ids.slice(m);
  return (a.length ? a.map(mk).join('') : '<div class="fe-bankleer">' + leerTxt + '</div>') +
    '<div class="rk">RESERVE-SPIELER</div>' + (b.length ? b.map(mk).join('') : '<div class="rk-leer">noch keine</div>');
}

const BANK_GROESSE = 2;   // V2.6: zwei Auswechselspieler pro Team
// V6.0: Jede Nation hat einen festen Kader: 11 Spieler + 2 Auswechselspieler (12 KI-Gesichter + 1 Kartenspieler).
// Die Verteilung ist fest (gleicher Startwert) und hängt nur davon ab, welches Land du selbst spielst.
const NATION_KADER_CACHE = {};
function nationKaderAlle(eigenLand){
  const key = eigenLand || '-';
  if (NATION_KADER_CACHE[key]) return NATION_KADER_CACHE[key];
  let h = 20261020 >>> 0;
  const rnd = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const misch = a => { for (let i = a.length - 1; i > 0; i--){ const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const laender = COUNTRY_DATABASE.map(l => l[0]).filter(n => n !== eigenLand).sort();
  const ki = PLAYER_DATABASE.map((p, i) => i).filter(i => (PLAYER_DATABASE[i].ki || PLAYER_DATABASE[i].eigen) && !PLAYER_DATABASE[i].stufe);   // eigene Figuren (70) sind jetzt auch in den KI-Nationen
  const topf = {}; for (const r of ['TW', 'DF', 'MF', 'ST']) topf[r] = misch(ki.filter(i => PLAYER_DATABASE[i].role === r));
  { const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW'); if (sc >= 0){ const tl = topf[PLAYER_DATABASE[sc].role], x = tl.indexOf(sc); if (x >= 0) tl.splice(x, 1); tl.splice(Math.floor(rnd() * laender.length * 2), 0, sc); } }   // Hauptfigur steckt immer in einem KI-Kader (wird bei dir ersetzt, wenn du ihn selbst wählst)
  const k = {}; laender.forEach(n => k[n] = { elf: [], bank: [] });
  const zieh = r => topf[r].length ? topf[r].shift() : null;
  for (const [r, anz] of [['TW', 1], ['DF', 4], ['MF', 4], ['ST', 2]])
    for (let a = 0; a < anz; a++) for (const n of laender){ let i = zieh(r); if (i == null) i = zieh('MF') ?? zieh('DF') ?? zieh('ST') ?? zieh('TW'); if (i != null) k[n].elf.push(i); }
  const rest = misch([...topf.TW, ...topf.DF, ...topf.MF, ...topf.ST]);
  for (const n of laender) if (rest.length) k[n].bank.push(rest.shift());
  k.__frei = rest;
  // V4.9: Hauptfigur SILESCROW spielt fest für die Türkei (getauscht mit einem Türkei-Spieler gleicher Rolle)
  { const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW'), tr = k['Türkei'];
    if (sc >= 0 && tr && !tr.elf.includes(sc)){
      const von = Object.keys(k).find(n => n !== '__frei' && k[n] && (k[n].elf.includes(sc) || k[n].bank.includes(sc)));
      const rolle = PLAYER_DATABASE[sc].role;
      const kand = tr.elf.filter(i => PLAYER_DATABASE[i].role === rolle).sort((a, b) => PLAYER_DATABASE[a].rating - PLAYER_DATABASE[b].rating);
      const raus = kand.length ? kand[0] : tr.elf.find(i => PLAYER_DATABASE[i].role !== 'TW');
      if (raus != null){
        tr.elf[tr.elf.indexOf(raus)] = sc;
        if (von){ const z = k[von]; const ie = z.elf.indexOf(sc), ib = z.bank.indexOf(sc); if (ie >= 0) z.elf[ie] = raus; else if (ib >= 0) z.bank[ib] = raus; }
        else { const f = k.__frei.indexOf(sc); if (f >= 0) k.__frei[f] = raus; else k.__frei.push(raus); }
      }
    } }
  return (NATION_KADER_CACHE[key] = k);
}
// V8.0: Ersatz für Spieler, die du selbst gewählt hast – alle Nationen zusammen, ohne Doppelte, gleiche Rolle zuerst
let NK_ERSATZ_SIG = null, NK_ERSATZ = null;
function nationKaderErsatz(opt, eigen){
  const weg = new Set([...((opt && opt.squad) || []), ...((opt && opt.ersatz) || [])]);
  let wx = {}; try { wx = (STAND.daten && STAND.daten.wechsel) || {}; } catch (e) {}
  const sig = (eigen || '-') + '|' + [...weg].sort((x, y) => x - y).join(',') + '|' + JSON.stringify(wx);
  if (NK_ERSATZ_SIG === sig && NK_ERSATZ) return NK_ERSATZ;
  const alle = nationKaderAlle(null);   // V4.9: Kader der Nationen sind immer gleich – egal, welches Land du selbst spielst
  const frei = alle.__frei.filter(i => !weg.has(i));
  const nimm = rolle => { let x = frei.findIndex(i => PLAYER_DATABASE[i].role === rolle); if (x < 0) x = 0; return x < frei.length ? frei.splice(x, 1)[0] : null; };
  const erg = {};
  for (const n of Object.keys(alle)){
    if (n === '__frei') continue;
    erg[n] = { elf: alle[n].elf.map(i => weg.has(i) ? nimm(PLAYER_DATABASE[i].role) : i).filter(i => i != null),
               bank: alle[n].bank.map(i => weg.has(i) ? nimm(PLAYER_DATABASE[i].role) : i).filter(i => i != null) };
  }
  // V11.13: verkaufte / freigegebene Spieler stehen bei ihrer neuen Nation in der Reserve – die KI stellt selbst auf (Stärkere spielen)
  const staerke = (j, land) => { const p = PLAYER_DATABASE[j]; if (wx[p.name]){ try { return ISTTRAIN(p) ? STAND.gesamt(j) : p.rating; } catch (e) { return p.rating; } } return p.stufe ? p.rating : nationStandardWert(land, p.name); };
  for (const name of Object.keys(wx)){
    const land = wx[name], i = PLAYER_DATABASE.findIndex(p => p.name === name);
    if (i < 0 || weg.has(i) || !erg[land]) continue;
    for (const n of Object.keys(erg)){ if (n === land) continue; const k = erg[n];
      let x = k.elf.indexOf(i); if (x >= 0){ const r = nimm(PLAYER_DATABASE[i].role); if (r != null) k.elf[x] = r; else k.elf.splice(x, 1); }
      x = k.bank.indexOf(i); if (x >= 0) k.bank.splice(x, 1); }
    const z = erg[land];
    if (!z.elf.includes(i) && !z.bank.includes(i)) z.bank.unshift(i);
    const bi = z.bank.indexOf(i);
    if (bi >= 0){ let schw = -1, sw = 1e9;
      z.elf.forEach((j, q) => { const pj = PLAYER_DATABASE[j]; if (pj.role === PLAYER_DATABASE[i].role && !pj.stufe && pj.name !== 'SILESCROW'){ const w = staerke(j, land); if (w < sw){ sw = w; schw = q; } } });
      if (schw >= 0 && staerke(i, land) > sw){ const raus = z.elf[schw]; z.elf[schw] = i; z.bank[bi] = raus; } }
  }
  NK_ERSATZ_SIG = sig; NK_ERSATZ = erg; return erg;
}
function nationKader(land, opt){
  const name = land && (Array.isArray(land) ? land[0] : land);
  const eigen = opt && opt.land ? opt.land[0] : null;
  const k = nationKaderErsatz(opt, eigen)[name];
  if (!k) return null;
  return { elf: k.elf.slice(), bank: k.bank.slice() };
}
window.nationKader = nationKader;
// V5.0: SILESCROW spielt bei der Türkei als Zehner (ZOM) mit der Nummer 10
const SC_ZEHNER_FORM = '4-3-1-2';
function scZehner(land, liste){
  const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW');
  const name = land && (Array.isArray(land) ? land[0] : land);
  if (sc < 0 || name !== 'Türkei' || !Array.isArray(liste) || !liste.includes(sc)) return null;
  const sl = formSlots(SC_ZEHNER_FORM).findIndex(x => x.label === 'ZOM');
  return { sc, form: SC_ZEHNER_FORM, pref: sl >= 0 ? { [sc]: sl } : {} };
}
const TEST_11 = true;
const POS_NAMEN = ['AL', 'AR', 'MIT', 'STU'], POS_ROLLE = { AL: 'DF', AR: 'DF', MIT: 'MF', STU: 'ST' }, POS_RANG = { AL: 0, AR: 0, MIT: 1, STU: 2 }, POS_SEITE = { AL: -1, AR: 1 };
const POS_TEXT = { AL: 'ABW L', AR: 'ABW R', MIT: 'MITTE', STU: 'STURM', TW: 'TOR' };
const POS_KURZ = { AL: 'LV', AR: 'RV', MIT: 'ZM', STU: 'ST', TW: 'TW' };
const EINFACH_TEXT = { TW: 'TORWART', DF: 'ABWEHR', MF: 'MITTELFELD', ST: 'STURM' };   // V6.0
function positionenVerteilen(feld, wunsch){
  const erg = {}, frei = new Set(POS_NAMEN);
  feld.forEach(i => { const w = wunsch && wunsch[i]; if (w && frei.has(w)){ erg[i] = w; frei.delete(w); } });
  const vorliebe = { DF: ['AL', 'AR', 'MIT', 'STU'], MF: ['MIT', 'STU', 'AR', 'AL'], ST: ['STU', 'MIT', 'AR', 'AL'], TW: ['AL', 'AR', 'MIT', 'STU'] };
  const rest = feld.filter(i => !erg[i]).sort((a, b) => (POS_RANG[(vorliebe[PLAYER_DATABASE[a].role] || POS_NAMEN)[0]] || 0) - (POS_RANG[(vorliebe[PLAYER_DATABASE[b].role] || POS_NAMEN)[0]] || 0));
  rest.forEach(i => { const v = vorliebe[PLAYER_DATABASE[i].role] || POS_NAMEN; const w = v.find(x => frei.has(x)) || [...frei][0] || 'MIT'; erg[i] = w; frei.delete(w); });
  return erg;
}
zustand.posi = {};
// ===== V2.4: Formationen (8 Feldspieler + Torwart) =====
// V7.2: Formationen für 10 Feldspieler + Torwart
// V7.4: die 18 wichtigsten Formationen im modernen Fußball (ungefähr nach Beliebtheit)
const FORMEN = { '4-2-3-1': [4, 2, 3, 1], '4-3-3': [4, 3, 3], '4-4-2': [4, 4, 2], '3-4-2-1': [3, 4, 2, 1], '3-4-3': [3, 4, 3], '3-5-2': [3, 5, 2],
  '4-1-4-1': [4, 1, 4, 1], '4-4-1-1': [4, 4, 1, 1], '3-2-4-1': [3, 2, 4, 1], '4-3-1-2': [4, 3, 1, 2], '4-1-2-1-2': [4, 1, 2, 1, 2], '4-2-2-2': [4, 2, 2, 2],
  '3-4-1-2': [3, 4, 1, 2], '4-3-2-1': [4, 3, 2, 1], '3-1-4-2': [3, 1, 4, 2], '4-2-1-3': [4, 2, 1, 3], '5-3-2': [5, 3, 2], '5-4-1': [5, 4, 1] };
const FORM_REIHE = ['4-3-1-2', ...Object.keys(FORMEN).filter(k => k !== '4-3-1-2')];   // V10.0: Lieblingsaufstellung 4-3-1-2 zuerst
zustand.formation = '4-4-2'; zustand.formSlot = {};
try { const v = JSON.parse(LS81.getItem('sc_formation') || 'null'); if (v && FORMEN[v.f]){ zustand.formation = v.f; zustand.formSlot = v.s || {}; } } catch(e){ typeof __scWarn === 'function' && __scWarn(e); }
window.__kapSaved = (() => { try { return LS81.getItem('sc_kapitaen') || ''; } catch (e) { return ''; } })();   // V9.9: Kapitän (Name), Standard = dein Star
function kapitaenName(){ if (window.__kapSaved) return window.__kapSaved; try { const i = zustand.squad[0]; return i != null && PLAYER_DATABASE[i] ? PLAYER_DATABASE[i].name : ''; } catch (e) { return ''; } }
function kapitaenSetzen(name){ window.__kapSaved = name || ''; try { LS81.setItem('sc_kapitaen', window.__kapSaved); } catch (e) {} }
window.kapitaenName = kapitaenName;
function formSpeichern(){ try { LS81.setItem('sc_formation', JSON.stringify({ f: zustand.formation, s: zustand.formSlot })); } catch(e){ typeof __scWarn === 'function' && __scWarn(e); } }
function formLinie(n, rolle){
  const fv = { 1: [0], 2: rolle === 'ST' ? [-.2, .2] : [-.28, .28], 3: rolle === 'DF' ? [-.4, 0, .4] : [-.55, 0, .55], 4: rolle === 'ST' ? [-.6, -.2, .2, .6] : [-.66, -.22, .22, .66], 5: [-.74, -.37, 0, .37, .74] }[n];
  const lab = { DF: { 2: ['IV', 'IV'], 3: ['IV', 'IV', 'IV'], 4: ['LV', 'IV', 'IV', 'RV'], 5: ['LV', 'IV', 'IV', 'IV', 'RV'] }, MF: { 1: ['ZM'], 2: ['ZM', 'ZM'], 3: ['ZM', 'ZM', 'ZM'], 4: ['LM', 'ZM', 'ZM', 'RM'], 5: ['LM', 'ZM', 'ZM', 'ZM', 'RM'] }, ST: { 1: ['ST'], 2: ['ST', 'ST'], 3: ['LA', 'ST', 'RA'], 4: ['LA', 'ST', 'ST', 'RA'], 5: ['LA', 'HL', 'MS', 'HR', 'RA'] } }[rolle][n];
  const basis = { DF: -.64, MF: -.22, ST: .30 }[rolle], slot = { DF: 0, MF: 1, ST: 2 }[rolle];
  return fv.map((v, k) => {
    const rand = n >= 3 && (k === 0 || k === n - 1), mitte = n >= 3 && !rand;
    let fu = basis;
    if (rolle === 'DF') fu = rand ? (n === 5 ? -.54 : -.60) : (mitte ? -.68 : -.66);
    else if (rolle === 'MF') fu = rand ? -.18 : (mitte ? -.26 : -.22);
    else fu = n === 3 ? (rand ? .24 : .32) : n === 5 ? (rand ? .32 : (k === 2 ? .34 : .24)) : .30;   // V10.0: 5er-Sturm (2-3-5): Halbstürmer etwas zurück
    return { fu, fv: v, slot, seite: rand ? (k === 0 ? -1 : 1) : 0, rolle, label: lab[k] };
  });
}
function formSlots(key){
  const f = FORMEN[key] || FORMEN['4-4-2'];
  if (f.length === 3) return [...formLinie(f[0], 'DF'), ...formLinie(f[1], 'MF'), ...formLinie(f[2], 'ST')];
  // V7.2: mehrere Mittelfeld-Reihen (z. B. 4-2-3-1): von defensiv (DM) nach offensiv (OM)
  const mitte = f.slice(1, -1), k = mitte.length, out = [...formLinie(f[0], 'DF')];
  mitte.forEach((n, j) => {
    const fu = -.36 + (.40 * j / (k - 1));
    const erste = j === 0, letzte = j === k - 1;
    formLinie(n, 'MF').forEach((x, q) => {
      x.fu = fu + (x.seite ? .04 : 0);
      if (erste && n <= 2) x.label = 'ZDM';
      else if (letzte) x.label = n === 3 ? ['LA', 'ZOM', 'RA'][q] : n === 1 ? 'ZOM' : n === 2 ? 'ZOM' : (n === 4 && f[f.length - 1] === 1) ? ['LA', 'ZOM', 'ZOM', 'RA'][q] : x.label;
      out.push(x);
    });
  });
  return [...out, ...formLinie(f[f.length - 1], 'ST')];
}
// Wunschplätze (pref: spielerIdx -> Slot) zuerst, Rest automatisch nach Rolle/Stärke. Ergebnis: Map spielerIdx -> Slot-Nr.
// V11.12: genaue Positionen – Abzug, wenn ein Spieler nicht auf seiner Position spielt
const SLOT_POS = { TOR: 'TW', TW: 'TW', IV: 'IV', LV: 'LV', RV: 'RV', ZDM: 'DM', DM: 'DM', ZM: 'ZM', LM: 'ZM', RM: 'ZM', ZOM: 'OM', OM: 'OM', LA: 'LF', HL: 'LF', LF: 'LF', RA: 'RF', HR: 'RF', RF: 'RF', ST: 'MS', MS: 'MS' };
const POS_GRUPPE = { TW: 0, IV: 1, LV: 1, RV: 1, DM: 2, ZM: 2, OM: 2, LF: 3, RF: 3, MS: 3 };
const POS_NACHBAR = { IV: ['LV', 'RV'], LV: ['IV'], RV: ['IV'], DM: ['ZM'], ZM: ['DM', 'OM'], OM: ['ZM'], MS: ['LF', 'RF'], LF: ['MS'], RF: ['MS'] };
function posAbzug(pos, slot){
  const sp = SLOT_POS[slot] || slot; if (!pos || !sp || pos === sp || POS_GRUPPE[sp] == null) return 0;
  const a = POS_GRUPPE[pos], b = POS_GRUPPE[sp];
  if (a === 0 || b === 0) return 40;
  if (a === b) return (POS_NACHBAR[pos] || []).includes(sp) ? 2 : 3;
  return Math.abs(a - b) === 1 ? 8 : 15;
}
function formZuweisen(feldIdx, key, pref){
  const slots = formSlots(key), zu = new Map(), belegt = new Set();
  if (pref) feldIdx.forEach(i => { const sl = pref[i]; if (sl != null && sl >= 0 && sl < slots.length && !belegt.has(sl)){ zu.set(i, sl); belegt.add(sl); } });
  const rest = feldIdx.filter(i => !zu.has(i)).sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating);
  for (const runde of [-1, 0, 1]) for (const i of rest){   // V11.12: zuerst genau passende Position, dann gleiche Gruppe, dann irgendwo
    if (zu.has(i)) continue;
    const r = PLAYER_DATABASE[i].role === 'TW' ? 'DF' : PLAYER_DATABASE[i].role, ps = PLAYER_DATABASE[i].pos;
    let sl = -1, best = 1e9;
    slots.forEach((x, k) => { if (belegt.has(k) || !(runde === 1 || (runde === 0 ? x.rolle === r : (ps && SLOT_POS[x.label] === ps)))) return; const ab = ps ? posAbzug(ps, x.label) : 0; if (ab < best){ best = ab; sl = k; } });
    if (sl >= 0){ zu.set(i, sl); belegt.add(sl); }
  }
  return zu;
}
/* V2.08: AUTOMATISCH = bestmögliche Aufstellung nach Positionen: alle Zuordnungen werden verglichen,
   die mit der kleinsten Gesamt-Abweichung gewinnt, bei Gleichstand die höhere Stärke. */
function formBestAuto(feldIdx, key){
  const slots = formSlots(key), n = feldIdx.length, m = slots.length, out = {};
  if (!n || !m || m > 16) return out;
  const SKIP = 1e6, N = 1 << m;
  const kosten = (i, sl) => { const p = PLAYER_DATABASE[i]; const ab = p.pos ? posAbzug(p.pos, slots[sl].label) : 20; return ab - (p.rating || 0) * 0.01; };
  let cur = new Float64Array(N).fill(Infinity); cur[0] = 0;
  const back = [];
  for (let k = 0; k < n; k++){
    const nxt = new Float64Array(N).fill(Infinity), bk = new Int32Array(N).fill(-2);
    for (let mask = 0; mask < N; mask++){
      if (cur[mask] === Infinity) continue;
      if (cur[mask] + SKIP < nxt[mask]){ nxt[mask] = cur[mask] + SKIP; bk[mask] = -1; }
      for (let sl = 0; sl < m; sl++){
        if (mask & (1 << sl)) continue;
        const nm = mask | (1 << sl), c = cur[mask] + kosten(feldIdx[k], sl);
        if (c < nxt[nm]){ nxt[nm] = c; bk[nm] = sl; }
      }
    }
    back.push(bk); cur = nxt;
  }
  let best = 0; for (let mask = 0; mask < N; mask++) if (cur[mask] < cur[best]) best = mask;
  let mask = best;
  for (let k = n - 1; k >= 0; k--){
    const sl = back[k][mask];
    if (sl >= 0){ out[feldIdx[k]] = sl; mask ^= (1 << sl); }
  }
  return out;
}
/* V3.09: AUTOMATISCH nimmt die STÄRKSTEN Spieler, die möglich sind – aus Aufstellung, Bank UND Reserve (auch neue Pack-Karten).
   Bewertung je Platz = Stärke (mit Training/Pack-Bonus) minus Positions-Abzug. Mitspieler (fest) bleiben immer im Team. */
function autoStaerke(i){
  const p = PLAYER_DATABASE[i]; if (!p) return 0;
  let w = p.rating;
  try { if (ISTTRAIN(p) || (p.stufe && STAND.hatKarte(i))) w = STAND.gesamt(i) || w; } catch (e) {}
  return w || 0;
}
function autoVerletzt(i){ try { return VERLETZT.ist(i); } catch (e) { return false; } }
/* V12: kurzer Hinweis oben im Spielfeld, verschwindet nach ca. 2,5 s von selbst */
function feKurzHinweis(ov, text){
  try {
    const pitch = ov.querySelector('.fe-pitch'); if (!pitch) return;
    pitch.querySelectorAll('.fe-kurzhint').forEach(x => x.remove());
    const h = document.createElement('div'); h.className = 'fe-kurzhint';
    h.style.cssText = 'position:absolute;left:50%;top:3px;transform:translateX(-50%);z-index:70;max-width:94%;box-sizing:border-box;padding:3px 12px;border:2px solid #000;border-radius:8px;background:rgba(11,20,48,.92);color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 13px/1.3 var(--text,Arial);pointer-events:none;transition:opacity .4s';
    h.textContent = '🔄 ' + text;
    pitch.appendChild(h);
    setTimeout(() => { h.style.opacity = '0'; }, 2100);
    setTimeout(() => { h.remove(); }, 2600);
  } catch (e) {}
}
/* V12: Hinweis oben im Spielfeld, sobald ein Spieler ausgewählt ist */
function feSelHinweis(ov, idx){
  try {
    ov.querySelectorAll('.fe-selhint').forEach(x => x.remove());
    const p = idx != null ? PLAYER_DATABASE[idx] : null, pitch = ov.querySelector('.fe-pitch'); if (!p || !pitch) return;
    const h = document.createElement('div'); h.className = 'fe-selhint';
    h.style.cssText = 'position:absolute;left:50%;top:3px;transform:translateX(-50%);z-index:60;max-width:94%;box-sizing:border-box;padding:2px 10px;border:2px solid #000;border-radius:8px;background:rgba(11,20,48,.88);color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:800 12px/1.3 var(--text,Arial);pointer-events:none';
    h.innerHTML = '<span style="color:#ffe234">' + p.name + '</span> – wohin? Platz oder Spieler antippen = TAUSCHEN';
    pitch.appendChild(h);
  } catch (e) {}
}
/* V10.11: AUTOMATISCH-Animation – Spieler gleiten von Bank/Reserve auf ihren Platz in der Startaufstellung (und umgekehrt) */
function feRects(ov){
  const m = {};
  try { ov.querySelectorAll('.fe-tok').forEach(t => { const im = t.querySelector('img'); if (!im) return; const r = t.getBoundingClientRect(); if (r.width) m[im.getAttribute('src')] = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); } catch (e) {}
  return m;
}
function feAnim(ov, vorher){
  try {
    if (!vorher || !ov.animate) return;
    const lst = ov.querySelector('.fe-bankliste'), lr = lst ? lst.getBoundingClientRect() : null;
    let n = 0;
    ov.querySelectorAll('.fe-tok').forEach(t => {
      const im = t.querySelector('img'); if (!im) return;
      const r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const alt = vorher[im.getAttribute('src')];
      let dx, dy, neu = false;
      if (alt){ dx = alt.x - cx; dy = alt.y - cy; }
      else if (lr){ dx = lr.left + lr.width / 2 - cx; dy = lr.top + 20 - cy; neu = true; }   // kam aus der (scrollbaren) Reserve
      else return;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      t.style.position = t.style.position || ''; t.style.zIndex = '50';
      const a = t.animate([{ translate: dx + 'px ' + dy + 'px', scale: '1.15', opacity: neu ? .2 : 1 }, { translate: '0px 0px', scale: '1', opacity: 1 }],
        { duration: 750, delay: (n++) * 90, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      a.onfinish = a.oncancel = () => { t.style.zIndex = ''; };
    });
  } catch (e) {}
}
/* V10.11: stärkster Torwart aus der Liste, falls stärker als der aktuelle (alt); sonst null */
function autoTorKandidat(liste, alt){
  let best = null, bw = alt != null ? autoStaerke(alt) : -1;
  liste.forEach(i => { const q = PLAYER_DATABASE[i]; if (!q || i === alt || autoVerletzt(i) || !(q.pos === 'TW' || q.role === 'TW')) return; const w = autoStaerke(i); if (w > bw){ bw = w; best = i; } });
  return best;
}
/* Wählt aus pool bis zu maxAnz Feldspieler + Plätze (Idx -> Slot). fest = Set von Spielern, die auf jeden Fall bleiben. */
function formBestAutoStark(pool, key, maxAnz, fest){
  const slots = formSlots(key), m = slots.length, out = {};
  let cand = pool.filter((i, k, a) => PLAYER_DATABASE[i] && a.indexOf(i) === k);
  if (!cand.length || !m || m > 16) return out;
  const lim = Math.min(m, maxAnz == null ? m : maxAnz), N = 1 << m;
  /* V10.11: ZUERST die stärksten Spieler wählen (Mitspieler fest, Torhüter nur zur Not), erst danach die Plätze verteilen –
     der Positions-Abzug darf keinen schwächeren Spieler vor einen stärkeren schieben. */
  const istTW = i => { const q = PLAYER_DATABASE[i]; return q.pos === 'TW' || q.role === 'TW'; };
  const rang = (a, b) => ((fest && fest.has(b)) ? 1 : 0) - ((fest && fest.has(a)) ? 1 : 0)
    || (istTW(a) ? 1 : 0) - (istTW(b) ? 1 : 0)
    || autoStaerke(b) - autoStaerke(a) || (PLAYER_DATABASE[b].rating || 0) - (PLAYER_DATABASE[a].rating || 0);
  cand = cand.slice().sort(rang).slice(0, lim);
  const n = cand.length;
  const pc = new Uint8Array(N); for (let x = 1; x < N; x++) pc[x] = pc[x >> 1] + (x & 1);
  const wert = (i, sl) => { const q = PLAYER_DATABASE[i]; const ab = q.pos ? posAbzug(q.pos, slots[sl].label) : 20; return 100000 + (fest && fest.has(i) ? 1000 : 0) + autoStaerke(i) - ab + (q.rating || 0) * 0.001; };   // 100000: jeder gewählte Spieler bekommt einen Platz
  let cur = new Float64Array(N).fill(-Infinity); cur[0] = 0;
  const back = [];
  for (let k = 0; k < n; k++){
    const nxt = Float64Array.from(cur), bk = new Int32Array(N).fill(-1);
    for (let mask = 0; mask < N; mask++){
      if (cur[mask] === -Infinity || pc[mask] >= lim) continue;
      for (let sl = 0; sl < m; sl++){
        if (mask & (1 << sl)) continue;
        const nm = mask | (1 << sl), c = cur[mask] + wert(cand[k], sl);
        if (c > nxt[nm]){ nxt[nm] = c; bk[nm] = sl; }
      }
    }
    back.push(bk); cur = nxt;
  }
  let best = 0; for (let mask = 0; mask < N; mask++) if (cur[mask] > cur[best]) best = mask;
  let mask = best;
  for (let k = n - 1; k >= 0; k--){
    const sl = back[k][mask];
    if (sl >= 0){ out[cand[k]] = sl; mask ^= (1 << sl); }
  }
  return out;
}
/* Stärkste Feldspieler ohne Positionen (Halle). */
function autoTopListe(pool, anz, fest){
  const f = pool.filter((i, k, a) => PLAYER_DATABASE[i] && a.indexOf(i) === k);
  const sicher = f.filter(i => fest && fest.has(i));
  const rest = f.filter(i => !(fest && fest.has(i))).sort((a, b) => autoStaerke(b) - autoStaerke(a));
  return sicher.concat(rest).slice(0, anz);
}
function formFeld(){
  const tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
  return zustand.squad.filter(i => i != null && i !== tw);
}
function formLabel(idx){
  if (zustand.squad.length < 2) return '';
  const sl = formZuweisen(formFeld(), zustand.formation, zustand.formSlot).get(idx);
  return sl == null ? '' : formSlots(zustand.formation)[sl].label;
}
/* V11.1: Trikotnummern in den Aufstellungs-Fenstern + Mini-Aufstellung im Hauptmenü */
function aufNrCSS(){
  if (document.getElementById('aufNrCSS')) return;
  const st = document.createElement('style'); st.id = 'aufNrCSS';
  st.textContent = [
    '#vorAuf .fe-nr,#formEditor .fe-nr{position:absolute;left:-13px;bottom:-6px;z-index:3;min-width:26px;box-sizing:border-box;padding:2px 4px;text-align:center;font:400 14px/1 var(--display,Impact);font-style:normal;color:#0b1430;background:#fff;border:2px solid #000;border-radius:6px;cursor:pointer;box-shadow:1px 2px 0 rgba(0,0,0,.5)}',
    '#vorAuf .fe-nr::after,#formEditor .fe-nr::after{content:"";position:absolute;inset:-9px}',
    '#vorAuf .fe-nr.auto,#formEditor .fe-nr.auto{opacity:.8;background:#d9e2ff}',
    '.fe-nrwahl{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(5,10,30,.8);touch-action:manipulation}',
    '.fe-nrbox{width:min(560px,96%);max-height:96%;overflow:auto;box-sizing:border-box;padding:8px 10px;border:4px solid #000;border-radius:16px;background:linear-gradient(180deg,#26376a,#14204a);color:#fff;font-family:var(--text,Arial)}',
    '.fe-nrt{font:22px/1 var(--display,Impact);color:#ffe234;text-align:center;text-shadow:2px 2px 0 #000;margin-bottom:4px;letter-spacing:.5px}',
    '.fe-nrh{font:800 11px/1.2 var(--text,Arial);text-align:center;color:#c9d6f5;margin-bottom:6px}',
    '.fe-nrg{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px}',
    '.fe-nrg button{min-height:30px;padding:0;border:2px solid #000;border-radius:7px;background:#33456f;color:#fff;font:900 14px/1 var(--text,Arial);cursor:pointer}',
    '.fe-nrg button.belegt{background:#8a6d14;color:#fff3c4}',
    '.fe-nrg button.an{background:#ffe234;color:#0b1430;outline:3px solid #fff;outline-offset:1px}',
    '#formEditor .fe-act .fe-kader{background:#ffe234}',
    '#stUeber{z-index:10000 !important}',
    '#vorAuf .fe-nrunter,#formEditor .fe-nrunter{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:3px;z-index:6;white-space:nowrap;padding:9px 16px;min-height:46px;border:3px solid #000;border-radius:11px;background:#ffe234;color:#0b1430;font:17px/1 var(--display,Impact);cursor:pointer;box-shadow:2px 3px 0 rgba(0,0,0,.55)}',
    '.fe-nrsp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}',
    '.fe-nrsp button{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:44px;padding:3px;border:2px solid #000;border-radius:8px;background:#33456f;color:#fff;cursor:pointer}',
    '.fe-nrsp button b{font:16px/1 var(--display,Impact);color:#ffe234}',
    '.fe-nrsp button span{font:800 11px/1.1 var(--text,Arial);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}',
    '#vorAuf .fe-kurz{margin:auto;width:min(440px,92%);box-sizing:border-box;padding:14px 12px;border:4px solid #000;border-radius:16px;background:linear-gradient(180deg,#26376a,#14204a);color:#fff;text-align:center;font-family:var(--text,Arial)}',
    '#vorAuf .fe-kt{font:24px/1 var(--display,Impact);color:#ffe234;text-shadow:2px 2px 0 #000;margin-bottom:6px}',
    '#vorAuf .fe-kurz p{margin:0 0 10px;font:800 13px/1.3 var(--text,Arial);color:#c9d6f5}',
    '#vorAuf .fe-kb{display:flex;gap:8px}',
    '#vorAuf .fe-kb button{flex:1 1 0;min-height:46px;padding:4px 6px;border:3px solid #000;border-radius:11px;background:#fff;color:#000;font:15px/1.1 var(--display,Impact);cursor:pointer;box-shadow:2px 3px 0 rgba(0,0,0,.5)}',
    '#vorAuf .fe-kb .fe-ko{background:#34d058}',
    '#vorAuf .fe-kb .fe-ka{background:#ffe234}',
    '.fe-nrx{display:block;width:100%;margin-top:8px;min-height:36px;border:3px solid #000;border-radius:10px;background:#fff;color:#000;font:20px/1 var(--display,Impact);cursor:pointer}',
    'html body #menue #flaeche .rechts .plaetze .aufmini{grid-column:1/-1 !important;grid-row:span 3;display:flex;align-items:stretch;gap:8px;padding:5px;box-sizing:border-box;min-height:200px;height:auto !important;border:3px solid #000;border-radius:12px;background:linear-gradient(160deg,#ff3fa4,#7b2cff);color:#fff;cursor:pointer;box-shadow:2px 3px 0 rgba(0,0,0,.5);overflow:hidden}',
    '.aufmini .am-pitch{position:relative;align-self:stretch;flex:0 0 52%;box-sizing:border-box;border:3px solid #000;border-radius:9px;overflow:hidden;background:repeating-linear-gradient(180deg,#47cc5c 0 8.33%,#37b24c 8.33% 16.66%)}',
    '.aufmini .am-pitch svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
    '.aufmini .am-tok{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;--rc:#fff}',
    '.aufmini .am-tok.DF{--rc:#3fa7ff}.aufmini .am-tok.MF{--rc:#ffd21f}.aufmini .am-tok.ST{--rc:#ff4b4b}.aufmini .am-tok.TW{--rc:#2fc94a}',
    '.aufmini .am-bild{display:block;width:24px;height:24px;border-radius:50%;border:2px solid #000;background:#fff;box-shadow:0 0 0 2px var(--rc)}',
    '.aufmini .am-tok.leer .am-bild{border-style:dashed;background:rgba(255,255,255,.3);box-shadow:none}',
    '.aufmini .am-bild img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 18%;display:block}',
    '.aufmini .am-tok i{font:400 11px/1 var(--display,Impact);font-style:normal;margin-top:1px;padding:0 3px;background:#fff;color:#000;border:1.5px solid #000;border-radius:4px}',
    '.aufmini .am-info{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center}',
    '.aufmini .am-t{font:16px/1 var(--display,Impact);color:#ffe234;text-shadow:2px 2px 0 #000;letter-spacing:.5px}',
    '.aufmini .am-f{font:30px/1 var(--display,Impact);color:#fff;-webkit-text-stroke:1.5px #000;paint-order:stroke fill;text-shadow:2px 2px 0 #000}',
    '.aufmini .am-s{font:900 11px/1 var(--text,Arial);white-space:nowrap;padding:5px 8px;border:2px solid #000;border-radius:8px;background:rgba(255,255,255,.92);color:#0b1430;cursor:pointer}',
    '.aufmini .am-b{font:15px/1 var(--display,Impact);white-space:nowrap;padding:6px 8px;border:3px solid #000;border-radius:9px;background:#ffe234;color:#000;box-shadow:2px 3px 0 #000}'
  ].join('\n');
  document.head.appendChild(st);
}
aufNrCSS();
function aufAnsicht(){ return 'mini'; }   // Spielerkacheln zum Blättern gibt es nicht mehr
function aufBankNr(nr, feld, bank){   // V11.14: Bank-/Reservespieler ohne Nummer bekommen eine freie Nummer (12, 13, 14 …), damit im Aufstellungsfenster überall eine Nummer steht
  try {
    const belegt = new Set();
    feld.concat(bank).forEach(i => { if (i != null && Number(nr[i]) > 0) belegt.add(Number(nr[i])); });
    bank.forEach(i => {
      if (i == null || !PLAYER_DATABASE[i] || Number(nr[i]) > 0) return;
      let n = 12; while (belegt.has(n) && n < 99) n++;
      if (belegt.has(n)){ n = 1; while (belegt.has(n) && n < 99) n++; }
      nr[i] = n; belegt.add(n);
    });
  } catch (e) {}
}
function aufNrChip(idx, nr){   // V11.5: kleine Stärke neben dem Spieler (Aufstellung im Hauptmenü, vor dem Spiel, Hall of Fame)
  try {
    const p = PLAYER_DATABASE[idx]; if (!p) return '';
    let w = p.rating;
    try { if (ISTTRAIN(p) || (p.stufe && STAND.hatKarte(idx))) w = STAND.gesamt(idx) || w; } catch (e) {}
    if (w == null || isNaN(w)) return '';
    if (!document.getElementById('aufStCSS')){ const st = document.createElement('style'); st.id = 'aufStCSS';
      st.textContent = '#vorAuf .fe-st,#formEditor .fe-st{position:absolute;left:-20px;top:-13px;z-index:3;min-width:30px;box-sizing:border-box;padding:2px 5px;text-align:center;font:400 19px/1 var(--display,Impact);font-style:normal;color:#fff;background:#ff3fa4;border:2px solid #000;border-radius:8px;text-shadow:1px 1px 0 #000;box-shadow:1px 2px 0 rgba(0,0,0,.5);pointer-events:none}' + '#vorAuf .fe-bankliste .fe-st,#formEditor .fe-bankliste .fe-st{left:-13px !important;top:-9px !important;min-width:24px !important;padding:1px 3px !important;font-size:15px !important}' + '#vorAuf .fe-bankliste,#formEditor .fe-bankliste{padding-top:11px !important;padding-left:14px !important;padding-right:14px !important}'
 + '#vorAuf .fe-box,#formEditor .fe-box{grid-template-columns:178px minmax(0,1fr) 210px !important}' + '#vorAuf .fe-tn,#formEditor .fe-tn{position:absolute;right:-19px;bottom:-2px;z-index:3;width:27px;height:27px;box-sizing:border-box;padding:0;display:flex;align-items:center;justify-content:center;text-align:center;font:400 15px/1 var(--display,Impact);font-style:normal;color:#fff;background:#0b1430;border:2px solid #000;border-radius:50%;box-shadow:1px 1px 0 rgba(0,0,0,.5);pointer-events:none}' + '#vorAuf .fe-bankliste .fe-tn,#formEditor .fe-bankliste .fe-tn{right:-13px !important;bottom:-4px !important;width:22px !important;height:22px !important;font-size:13px !important}';
      document.head.appendChild(st); }
    const nn = (nr != null && nr !== '' && Number(nr) > 0) ? String(Number(nr)) : '–';   // V11.13: aktuelle Trikotnummer ganz klein am Spieler
    return '<i class="fe-st">' + Math.round(w) + '</i><i class="fe-tn">' + nn + '</i>' + (p.name === kapitaenName() ? '<i class="fe-kapb">C</i>' : '');
  } catch (e) { return ''; }
}   // V11.2: kein Nummern-Schild mehr an der Figur – Nummern über den TRIKOTNUMMERN-Button
function aufNrBinden(ov, cb){
  ov.querySelectorAll('.fe-nr').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); cb(+b.dataset.ni); }));
}
/* V11.3: Kleiner Button NUMMER ÄNDERN direkt unter dem Namen des angetippten Spielers (nur beim gewählten Spieler sichtbar) */
function aufNrUnterName(ov, sel, idxVon, oeffne){
  ov.querySelectorAll('.fe-nrunter').forEach(x => x.remove());
  if (!sel) return;
  const el = sel.t === 's' ? ov.querySelector('.fe-tok[data-s="' + sel.k + '"]') : ov.querySelector('.fe-tok[data-b="' + sel.idx + '"]');
  if (!el || el.classList.contains('leer')) return;
  const ix = idxVon(sel); if (ix == null || !PLAYER_DATABASE[ix]) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'fe-nrunter'; b.textContent = '#️⃣ NUMMER ÄNDERN';
  ['pointerdown', 'pointerup', 'mousedown', 'touchstart'].forEach(ev => b.addEventListener(ev, e => e.stopPropagation()));
  b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); oeffne(ix); });
  el.appendChild(b);
}
/* Nummern-Auswahl 1–99 für beide Aufstellungs-Fenster. c = { idx, hole(i), alle(), fertig(n, anderer, altN) } */
function aufNrWahl(ov, c){
  aufNrCSS();
  const roh = c.hole(c.idx), altN = (roh != null && roh !== '' && Number(roh) > 0) ? Number(roh) : null;
  const team = c.alle().filter(i => i !== c.idx);
  const halter = n => { const h = team.find(i => Number(c.hole(i)) === n); return h === undefined ? null : h; };
  let knoepfe = '';
  for (let n = 1; n <= 99; n++){
    const hl = halter(n);
    knoepfe += '<button type="button" data-n="' + n + '" class="' + (n === altN ? 'an ' : '') + (hl != null ? 'belegt' : '') + '"' + (hl != null && altN == null ? ' disabled style="opacity:.4"' : '') + (hl != null ? ' title="' + PLAYER_DATABASE[hl].name + '"' : '') + '>' + n + '</button>';
  }
  const w = document.createElement('div'); w.className = 'fe-nrwahl';
  w.innerHTML = '<div class="fe-nrbox"><div class="fe-nrt">🔢 TRIKOTNUMMER · ' + PLAYER_DATABASE[c.idx].name + '</div>' +
    '<div class="fe-nrh">' + (altN != null ? 'Gelbe Nummern sind vergeben – antippen tauscht die Nummern.' : 'Gelbe Nummern sind schon vergeben.') + '</div>' +
    '<div class="fe-nrg">' + knoepfe + '</div><button type="button" class="fe-nrx">ABBRECHEN</button></div>';
  w.addEventListener('pointerdown', e => e.stopPropagation());
  w.addEventListener('click', e => { e.stopPropagation(); if (e.target === w) w.remove(); });
  w.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const n = +b.dataset.n, hl = halter(n);
    if (hl != null && altN == null) return;
    w.remove(); c.fertig(n, hl, altN);
    if (hl != null) feKurzHinweis(ov, '#' + n + ' getauscht mit ' + PLAYER_DATABASE[hl].name + (altN != null ? ' (jetzt #' + altN + ')' : ''));   // V12
  }));
  w.querySelector('.fe-nrx').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); w.remove(); });
  ov.appendChild(w);
}