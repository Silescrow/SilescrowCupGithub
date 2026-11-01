/* Silescrow Cup V 4.2 – js/patches/25-hallenturnierjs.js */

// =====================================================================
// HALL OF FAME CUP – kleines Hallenturnier (nur offline): 8 Teams, 2 Gruppen à 4, Halbfinale, Finale.
// Jedes Spiel 2 Minuten in der Halle. Gruppe: Unentschieden möglich. K.-o.: bei Gleichstand direkt Elfmeterschießen.
// Turniersieg: 5000 Crows. Der Stand wird auf dem Gerät gespeichert.
// =====================================================================
(function(){
  const KEY = 'silescrowHT'; const PREISE = { leicht: 800, mittel: 1800, stark: 3000 };   /* V3.04 */ const stufeJetzt = () => { try { return PREISE[zustand.stufe] ? zustand.stufe : 'mittel'; } catch (e) { return 'mittel'; } }; const preisJetzt = () => PREISE[(T && PREISE[T.stufe]) ? T.stufe : stufeJetzt()];
  const RUNDEN = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  let T = null; try { T = JSON.parse(LS81.getItem(KEY) || 'null'); } catch (e) { T = null; }
  const speichern = () => { try { if (T) LS81.setItem(KEY, JSON.stringify(T)); else LS81.removeItem ? LS81.removeItem(KEY) : LS81.setItem(KEY, 'null'); } catch (e) {} };
  const land = n => COUNTRY_DATABASE.find(l => l[0] === n) || null;
  const flagge = n => { try { return flaggeHTML(n); } catch (e) { return ''; } };
  const sterne = n => { try { return NATION_STERNE(n); } catch (e) { return 3; } };
  const sag = tag => { try { if (typeof KOMMENTAR !== 'undefined') KOMMENTAR.ereignis(tag, null, true); } catch (e) {} };
  // Torzahl (Poisson) – stärkere Nation trifft öfter
  const tore = (a, b) => { const lam = Math.max(.35, Math.min(3.6, 1.55 + (sterne(a) - sterne(b)) * .38)); let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };
  function simulieren(sp){
    sp.ta = tore(sp.a, sp.b); sp.tb = tore(sp.b, sp.a); sp.gespielt = true;
    if (sp.ko && sp.ta === sp.tb){ const pa = .5 + (sterne(sp.a) - sterne(sp.b)) * .06; sp.elf = Math.random() < pa ? 0 : 1; }
  }
  const sieger = sp => sp.ta > sp.tb ? sp.a : sp.tb > sp.ta ? sp.b : (sp.elf === 0 ? sp.a : sp.b);
  const verlierer = sp => sieger(sp) === sp.a ? sp.b : sp.a;
  function tabelle(g){
    const z = {}; T.gruppen[g].forEach(n => z[n] = { n, sp: 0, s: 0, u: 0, nl: 0, tp: 0, tm: 0, pkt: 0 });
    T.spiele.filter(sp => sp.g === g && sp.gespielt).forEach(sp => {
      const A = z[sp.a], B = z[sp.b]; A.sp++; B.sp++; A.tp += sp.ta; A.tm += sp.tb; B.tp += sp.tb; B.tm += sp.ta;
      if (sp.ta > sp.tb){ A.s++; B.nl++; A.pkt += 3; } else if (sp.tb > sp.ta){ B.s++; A.nl++; B.pkt += 3; } else { A.u++; B.u++; A.pkt++; B.pkt++; }
    });
    return Object.values(z).sort((x, y) => y.pkt - x.pkt || (y.tp - y.tm) - (x.tp - x.tm) || y.tp - x.tp || T.los[x.n] - T.los[y.n]);
  }
  function neu(meinWahl, meinLand){
    const andere = COUNTRY_DATABASE.map(l => l[0]).filter(n => n !== meinLand).sort(() => Math.random() - .5).slice(0, 7);
    const ga = [meinLand, ...andere.slice(0, 3)], gb = andere.slice(3, 7);
    T = { mein: meinWahl, ich: meinLand, gruppen: [ga, gb], runde: 0, phase: 'gruppe', spiele: [], los: {}, fertig: false, belohnt: false, nr: 0 };
    [...ga, ...gb].forEach(n => T.los[n] = Math.random());
    RUNDEN.forEach((r, ri) => [0, 1].forEach(g => r.forEach(([i, j]) => T.spiele.push({ id: 'g' + ri + g + i + j, g, r: ri, a: T.gruppen[g][i], b: T.gruppen[g][j], gespielt: false }))));
    speichern(); sag('ht_start');
  }
  const meinSpiel = () => T.spiele.find(sp => !sp.gespielt && (sp.a === T.ich || sp.b === T.ich) && (T.phase === 'gruppe' ? sp.r === T.runde : sp.ko === T.phase));
  function weiterschalten(){
    if (T.phase === 'gruppe'){
      if (T.spiele.some(sp => sp.r === T.runde && sp.g != null && !sp.gespielt)) return;
      if (T.runde < 2){ T.runde++; return; }
      const A = tabelle(0), B = tabelle(1);
      T.hf = [{ id: 'hf1', ko: 'hf', a: A[0].n, b: B[1].n, gespielt: false }, { id: 'hf2', ko: 'hf', a: B[0].n, b: A[1].n, gespielt: false }];
      T.spiele.push(...T.hf); T.phase = 'hf';
      if (!T.hf.some(sp => sp.a === T.ich || sp.b === T.ich)){ T.raus = 'gruppe'; restSimulieren(); }
      return;
    }
    if (T.phase === 'hf'){
      if (T.spiele.some(sp => sp.ko === 'hf' && !sp.gespielt)) return;
      const f = { id: 'f', ko: 'finale', a: sieger(T.hf[0]), b: sieger(T.hf[1]), gespielt: false };
      T.spiele.push(f); T.phase = 'finale';
      if (f.a !== T.ich && f.b !== T.ich){ if (!T.raus) T.raus = 'hf'; restSimulieren(); }
      return;
    }
    if (T.phase === 'finale'){
      const f = T.spiele.find(sp => sp.ko === 'finale');
      if (f && f.gespielt){ T.fertig = true; T.champion = sieger(f); if (T.champion !== T.ich && !T.raus) T.raus = 'f'; }
    }
  }
  function restSimulieren(){
    let n = 0;
    while (!T.fertig && n++ < 10){ T.spiele.filter(sp => !sp.gespielt && (T.phase === 'gruppe' ? sp.r === T.runde : sp.ko === T.phase)).forEach(simulieren); weiterschalten(); }
  }
  // Ergebnis deines Spiels (kommt vom Spiel am Abpfiff)
  window.__htErgebnis = function(e){
    if (!T || !e) return;
    const sp0 = T.spiele.find(x => x.id === e.id); if (!sp0 || sp0.gespielt) return;
    window.__htZeigen = true;   // V11.4: Tabelle nach JEDEM Hallenturnier-Spiel zeigen, auch wenn unten etwas schiefgeht
    try { htErgebnisKern(e); } catch (x) { console.error(x); try { speichern(); } catch (y) {} }
  };
  function htErgebnisKern(e){
    const sp = T.spiele.find(x => x.id === e.id); if (!sp || sp.gespielt) return;
    const ichA = sp.a === T.ich;
    sp.ta = ichA ? e.tore[0] : e.tore[1]; sp.tb = ichA ? e.tore[1] : e.tore[0]; sp.gespielt = true;
    if (sp.ko && sp.ta === sp.tb){ const ichGew = e.elf === 0; sp.elf = (ichGew === ichA) ? 0 : 1; }
    // die anderen Spiele derselben Runde
    T.spiele.filter(x => !x.gespielt && (sp.ko ? x.ko === sp.ko : x.r === sp.r && x.g != null)).forEach(simulieren);
    const vorher = T.phase; weiterschalten();
    // Kommentatorin: Punkte / weiter / Titel / raus
    const ich = ichA ? sp.ta : sp.tb, die = ichA ? sp.tb : sp.ta;
    if (!sp.ko){ sag(ich > die ? 'ht_punkte3' : ich === die ? 'ht_punkte1' : 'ht_punkte0'); if (vorher === 'gruppe' && T.phase === 'hf') setTimeout(() => sag(T.raus ? 'ht_raus_gruppe' : 'ht_weiter'), 2600); }
    else if (sieger(sp) === T.ich) sag(sp.ko === 'finale' ? 'ht_sieg' : 'ht_finale');
    else sag(sp.ko === 'finale' ? 'ht_raus_f' : 'ht_raus_hf');
    if (T.fertig && T.champion === T.ich && !T.belohnt){ T.belohnt = true; const PREIS = preisJetzt(); try { STAND.creditsPlus(PREIS); } catch (x) {} setTimeout(() => { try { toast('🏆 HALL OF FAME CUP gewonnen: +' + PREIS.toLocaleString('de-DE') + ' Crows!'); } catch (x) {} }, 900); }
    speichern(); window.__htZeigen = true;
  };
  const nm = n => (T && T.mein === 'super' && n === T.ich ? '(S) ' : '') + n;   // V10.1: dein Superteam heißt in der Hall of Fame z. B. (S) Türkei
  function zeile(r, i, weiter){ return '<tr class="' + (r.n === T.ich ? 'ich ' : '') + (weiter ? 'htw' : '') + '"><td>' + (i + 1) + '</td><td class="n">' + flagge(r.n) + ' ' + nm(r.n) + '</td><td>' + r.sp + '</td><td>' + r.s + '-' + r.u + '-' + r.nl + '</td><td>' + r.tp + ':' + r.tm + '</td><td><b>' + r.pkt + '</b></td></tr>'; }
  const erg = sp => sp.gespielt ? sp.ta + ':' + sp.tb + (sp.elf != null ? ' n.E.' : '') : '–:–';
  const paar = sp => '<span class="' + (sp.a === T.ich || sp.b === T.ich ? 'ich' : '') + '">' + flagge(sp.a) + ' ' + nm(sp.a) + ' <b>' + erg(sp) + '</b> ' + nm(sp.b) + ' ' + flagge(sp.b) + '</span>';
  function zeichnen(){
    const box = document.querySelector('#htUeber .htbox'); if (!box || !T) return;
    const rundeTxt = T.fertig ? 'TURNIER BEENDET' : T.phase === 'gruppe' ? 'GRUPPENPHASE · SPIELTAG ' + (T.runde + 1) + ' VON 3' : T.phase === 'hf' ? 'HALBFINALE' : 'FINALE';
    let h = '<h2>' + (window.HALLE_ICON || '🏀') + ' HALL OF FAME CUP</h2><div class="ht-runde">' + rundeTxt + ' · Sieger: ' + preisJetzt().toLocaleString('de-DE') + ' Crows</div><div class="ht-gruppen">';
    [0, 1].forEach(g => { const tb = tabelle(g); h += '<div class="ht-gruppe"><b class="titel">GRUPPE ' + (g ? 'B' : 'A') + '</b><table><tr><th>#</th><th style="text-align:left">Team</th><th>Sp</th><th>S-U-N</th><th>Tore</th><th>Pkt</th></tr>' + tb.map((r, i) => zeile(r, i, i < 2)).join('') + '</table></div>'; });
    h += '</div>';
    const r = T.phase === 'gruppe' ? T.runde : 2, gs = T.spiele.filter(sp => sp.g != null && (sp.r === r || (T.phase === 'gruppe' && sp.r === T.runde - 1 && !meinSpiel())));
    if (T.phase === 'gruppe') h += '<div class="ht-spiele">' + T.spiele.filter(sp => sp.g != null && sp.r <= T.runde && sp.r >= T.runde - 1).sort((x, y) => x.r - y.r).map(paar).join('') + '</div>';
    if (T.hf){ h += '<div class="ht-ko">' + T.hf.map((sp, i) => '<div><i>HALBFINALE ' + (i + 1) + '</i>' + flagge(sp.a) + ' ' + nm(sp.a) + ' <b>' + erg(sp) + '</b> ' + nm(sp.b) + ' ' + flagge(sp.b) + '</div>').join('');
      const f = T.spiele.find(sp => sp.ko === 'finale'); if (f) h += '<div><i>🏆 FINALE</i>' + flagge(f.a) + ' ' + nm(f.a) + ' <b>' + erg(f) + '</b> ' + nm(f.b) + ' ' + flagge(f.b) + '</div>';
      h += '</div>'; }
    const m = !T.fertig && !T.raus ? meinSpiel() : null;
    if (T.fertig) h += T.champion === T.ich ? '<div class="ht-sieg">🏆 DU GEWINNST DEN HALL OF FAME CUP! +' + preisJetzt().toLocaleString('de-DE') + ' Crows</div>' : '<div class="ht-sieg">' + flagge(T.champion) + ' ' + nm(T.champion) + ' gewinnt den Cup.<br><small>' + (T.raus === 'gruppe' ? 'Für dich war in der Gruppe Schluss.' : T.raus === 'hf' ? 'Für dich war im Halbfinale Schluss.' : 'Knapp – du hast das Finale verloren.') + '</small></div>';
    else if (m){ const geg = m.a === T.ich ? m.b : m.a; h += '<div class="ht-naechstes">' + (T.phase === 'gruppe' ? 'Dein ' + (T.runde + 1) + '. Gruppenspiel' : T.phase === 'hf' ? 'Dein Halbfinale' : 'Dein FINALE') + ': ' + flagge(T.ich) + ' ' + nm(T.ich) + ' gegen ' + geg + ' ' + flagge(geg) + ' <small>(2 Min.' + (m.ko ? ', bei Gleichstand Elfmeterschießen' : '') + ')</small></div>'; }
    h += '<div class="ht-knoepfe"><button type="button" class="ht-zu">ZURÜCK</button>' + (m ? '<button type="button" class="ht-auf">📋 AUFSTELLUNG</button><button type="button" class="ht-los">▶ SPIELEN</button>' : '') + (T.fertig ? '<button type="button" class="ht-neu ht-los">🔄 NEUES TURNIER</button>' : '') + '</div>';
    box.innerHTML = h;
    const q = s => box.querySelector(s);
    if (q('.ht-los:not(.ht-neu)')) q('.ht-los:not(.ht-neu)').onclick = spielen;
    if (q('.ht-neu')) q('.ht-neu').onclick = () => { document.getElementById('htUeber').hidden = true; if (window.hofTurnierWahl) window.hofTurnierWahl(); };   // V10.0: neue Teamwahl
    if (q('.ht-auf')) q('.ht-auf').onclick = () => { window.__aufDirekt = true; spielen(); };   // V11.4
    q('.ht-zu').onclick = () => { document.getElementById('htUeber').hidden = true; };
    if (q('.ht-ab')) q('.ht-ab').onclick = () => {   // V10.0: eigener Dialog statt confirm() (Quermodus bleibt)
      const abbr = () => { T = null; speichern(); document.getElementById('htUeber').hidden = true; toast('Hallenturnier abgebrochen.'); };
      if (window.wahlDialog) window.wahlDialog('HALLENTURNIER', 'Willst du das Turnier wirklich abbrechen?', 'TURNIER ABBRECHEN', 'WEITERSPIELEN', abbr, () => {}); else abbr();
    };
  }
  function spielen(){
    const m = meinSpiel(); if (!m) return;
    const geg = m.a === T.ich ? m.b : m.a, gi = COUNTRY_DATABASE.findIndex(l => l[0] === geg);
    if (T.mein === 'super' && !fwSuper()){ toast('Dein Superteam ist nicht mehr vollständig – wähle 11 Spieler.'); return; }
    document.getElementById('htUeber').hidden = true;
    const ansage = T.phase === 'gruppe' ? 'ht_spiel' + (T.runde + 1) : T.phase === 'hf' ? 'ht_hf' : 'ht_finale';
    window.__htSpiel = { id: m.id, ko: !!m.ko, ansage };
    const alt = fwHalle; fwHalle = true;
    FW.mein = T.mein; FW.gegner = gi; FW.online = false; FW.zurueckVS = false; FW.einseitig = null;
    try { FW.schritt = 2; const fl = document.getElementById('fwLos'); fl.disabled = false; fl.hidden = false; fl.click(); } finally { fwHalle = alt; }
  }
  window.htOeffnen = function(neuStart){
    if (neuStart){ T = null; }   // V10.0: neue Teamwahl = neues Turnier
    if (typeof onlineVerbunden === 'function' && onlineVerbunden()){ toast('Das Hallenturnier gibt es nur offline.'); return; }
    if (!T || !T.gruppen){
      if (FW.mein == null){ toast('Wähle zuerst dein Team (oben links im Fenster).'); return; }
      const ml = typeof fwMeinLand === 'function' ? fwMeinLand() : null; if (!ml){ toast('Wähle zuerst dein Team.'); return; }
      neu(FW.mein, ml);
    }
    try { document.getElementById('fwUeber').hidden = true; } catch (e) {}
    zeichnen(); document.getElementById('htUeber').hidden = false;
  };
  window.htLaeuft = () => !!(T && T.gruppen && !T.fertig);
  window.htVorhanden = () => !!(T && T.gruppen);   // V10.0
  // nach deinem Turnierspiel: zurück ins Menü -> Turnierübersicht öffnen
  const tabelleZeigen = () => { try { if (T && T.gruppen){ zeichnen(); document.getElementById('htUeber').hidden = false; } } catch (x) { console.error(x); } };
  document.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest && ev.target.closest('#zumMenue'); if (!t || !window.__htZeigen) return;
    window.__htZeigen = false;
    tabelleZeigen();   // V11.4: sofort anzeigen
    setTimeout(() => { const u = document.getElementById('htUeber'); if (u && u.hidden) tabelleZeigen(); }, 450);   // falls beim Wechsel ins Menü etwas dazwischenfunkt
  }, true);
})();
