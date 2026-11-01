/* Silescrow Cup V 4.2 – js/multiplayer-menue.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */



// ---------- Multiplayer-Fenster im Menü ----------
const mp = {
  ueber: $('#mpUeber'), start: $('#mpStart'), host: $('#mpHost'), gast: $('#mpGast'),
  zeige(teil){ this.start.hidden = teil !== 'start'; this.host.hidden = teil !== 'host'; this.gast.hidden = teil !== 'gast'; }
};
const mpEsc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const teamTag = t => t === 1 ? ' <b style="color:#ff7b7b">🔴 ROT</b>' : ' <b style="color:#6fb2ff">🔵 BLAU</b>';   // V4.9
function mpAnzeigen(){
  const r = NETZ.rolle, pille = $('#mpPille');
  $('#mpVerlassen').hidden = !r;
  if (r){
    pille.hidden = false;
    pille.textContent = 'Raum ' + NETZ.code + (r === 'host' ? (NETZ.partner ? ' · ' + NETZ.anzahl + ' von 4 ✔' : ' · warte …') : (NETZ.partner ? ' · Gast ✔' : ' · suche …'));
  } else pille.hidden = true;
  if (r === 'host'){
    $('#mpCode').textContent = NETZ.code;
    const st = $('#mpStatusH'), n = NETZ.gaeste.length;
    st.textContent = n ? (NETZ.anzahl + ' von 4 Spielern im Raum. Team wählen und ' + (startNameOnline() || 'TURNIER') + ' STARTEN.') : 'Warte auf Mitspieler …';
    st.classList.toggle('ok', n > 0);
    { const d = doppelterSpieler(); if (d != null){ st.textContent = '⚠️ ' + PLAYER_DATABASE[d].name + ' steht in beiden Teams – einer von euch muss wechseln.'; st.classList.remove('ok'); } }
    const cup = NETZ.onlineModus === 'cup';
    $('#mpModusF').classList.toggle('an', !cup); $('#mpModusC').classList.toggle('an', cup);
    $('#mpRegel').textContent = cup ? 'Online-Cup: Gäste übernehmen nur Spieler aus deinem Team. Gold und Silber sind für sie gesperrt. Der Rest ist KI.' : 'Freundschaftsspiel: Jeder Gast wählt einen Spieler aus seinen eigenen Karten. Er ersetzt einen KI-Spieler in deinem Team.';
    const liste = $('#mpListe');
    liste.innerHTML = '<div class="du"><span>1 · ' + mpEsc(NETZ.name || 'Du') + ' (Gastgeber)' + teamTag(0) + '</span><span>Mensch</span></div>' + NETZ.gaeste.map(g => {
      const gp = (zustand.gastPlaetze || []).find(x => x.gid === g.gid);
      const gegner = NETZ.teamVon(g.gid) === 1;
      const sp = gegner ? (NETZ.onlineModus === 'freund' ? (gegnerTeamOK(g) ? 'Gegnerteam ✔ bereit' : 'Gegnerteam · wählt ' + ((g.gt && g.gt.sq && g.gt.sq.length) || 0) + '/' + TEAM_GROESSE) : 'Gegnerteam') : (gp && gp.idx != null ? PLAYER_DATABASE[gp.idx].name : 'wählt …');
      return '<div><span>' + (g.k + 1) + ' · ' + mpEsc(g.nm || ('Gast ' + g.k)) + teamTag(gegner ? 1 : 0) + '</span><span>' + (gegner ? '⚔️ ' : '👤 ') + mpEsc(sp) + ' <button type="button" class="tzb" data-gid="' + mpEsc(g.gid) + '" style="margin-left:6px;padding:2px 8px;border-radius:8px;border:2px solid #0a1230;background:#33456f;color:#fff;font:800 14px var(--text)">' + (gegner ? '→ BLAU' : '→ ROT') + '</button></span></div>';
    }).join('');
  }
  if (r === 'gast'){
    const st = $('#mpStatusG');
    st.textContent = !NETZ.partner ? 'Suche Raum ' + NETZ.code + ' …' :
      NETZ.meinPlatz === 'voll' ? 'Der Raum ist voll (4 von 4). Du kannst nicht mitspielen.' :
      NETZ.meinPlatz ? 'Verbunden als Spieler ' + (NETZ.meinPlatz + 1) + '! Tippe FERTIG, wähle deinen Spieler und warte auf den Anpfiff.' :
      'Verbunden! Dein Platz wird zugeteilt …';
    st.classList.toggle('ok', NETZ.partner && !!NETZ.meinPlatz && NETZ.meinPlatz !== 'voll');
    $('#mpRegelG').textContent = NETZ.partner && NETZ.teamVon(NETZ.gid) === 1 ? (NETZ.onlineModus === 'freund' ? 'Du spielst im GEGNERTEAM: Wähle 9 Spieler aus deinen eigenen Karten, der erste bist du. Der Gastgeber startet das Spiel.' : 'Du spielst im GEGNERTEAM. Dein Spieler wird beim Anpfiff automatisch gewählt.') : NETZ.partner ? (NETZ.onlineModus === 'cup' ? 'Online-Cup: Gold- und Silberspieler sind für dich gesperrt.' : 'Freundschaftsspiel: Du wählst einen Spieler aus deinen eigenen Karten.') : '';
    { const tb = $('#mpTeamG');   // V4.9: großes Team-Banner
      if (NETZ.partner && NETZ.meinPlatz && NETZ.meinPlatz !== 'voll'){ const t = NETZ.teamVon(NETZ.gid); tb.hidden = false; tb.textContent = 'Du bist in TEAM ' + (t ? '🔴 ROT' : '🔵 BLAU'); tb.style.background = t ? '#7a1c24' : '#14357a'; }
      else tb.hidden = true; }
    $('#mpListeG').innerHTML = NETZ.partner ? NETZ.lobbyGast.map((e, i) => '<div' + (e.ich ? ' class="du"' : '') + '><span>' + (i + 1) + ' · ' + mpEsc(e.name) + (e.host ? ' (Gastgeber)' : '') + (e.ich ? ' (Du)' : '') + teamTag(e.team) + '</span><span>Mensch</span></div>').join('') : '';
  }
  // Menü (Spielerwahl) nachführen, solange kein Spiel läuft
  if (r && $('#spiel').hidden && !$('#menue').hidden) { try { aktualisiere(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
}
NETZ.beiAenderung = mpAnzeigen;
{ // V3.64: Name merken und weitergeben
  const feld = $('#mpName'), KEY = 'silescrow_mp_name';
  try { feld.value = LS81.getItem(KEY) || ''; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  NETZ.setName(feld.value);
  feld.addEventListener('input', () => {
    feld.value = feld.value.replace(/[<>&"'`\\]/g, '');
    NETZ.setName(feld.value);
    try { LS81.setItem(KEY, NETZ.name); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  });
}
// Sichtbar machen, wenn jemand beitritt oder geht – im Menü und im Spiel
NETZ.beiWechsel = (n, rolle, alt) => {
  const mehr = n > (alt || 0);
  const text = rolle === 'host'
    ? (mehr ? '👥 Mitspieler beigetreten: ' + (n + 1) + ' von 4 im Raum ' + NETZ.code : '👋 Ein Mitspieler hat den Raum verlassen (' + (n + 1) + ' von 4)')
    : (mehr ? '✅ Du bist Gast im Raum ' + NETZ.code + ' – wähle deinen Spieler!' : '⚠️ Verbindung zum Gastgeber unterbrochen');
  if (!$('#spiel').hidden) SPIEL.hinweis(text, 3);
  else toast(text);
  const pille = $('#mpPille'); pille.classList.remove('blink'); void pille.offsetWidth; if (mehr) pille.classList.add('blink');
  if (mehr) musik.bereit();
};
$('#mpKnopf').addEventListener('click', () => {
  mp.ueber.hidden = false;
  mp.zeige(NETZ.rolle === 'host' ? 'host' : NETZ.rolle === 'gast' ? 'gast' : 'start');
  mpAnzeigen();
});
$('#mpZu').addEventListener('click', () => { mp.ueber.hidden = true; });
$('#mpModusF').addEventListener('click', () => { NETZ.setOnlineModus('freund'); mpAnzeigen(); });
$('#mpModusC').addEventListener('click', () => { NETZ.setOnlineModus('cup'); mpAnzeigen(); });
$('#mpListe').addEventListener('click', e => { const b = e.target.closest('.tzb'); if (!b) return; NETZ.setGastTeam(b.dataset.gid, NETZ.teamVon(b.dataset.gid) === 1 ? 0 : 1); mpAnzeigen(); });
$('#mpVerlassen').addEventListener('click', async () => { await NETZ.verlassen(); mp.zeige('start'); });
const mpFehler = e => {
  const m = e && e.message;
  if (m === 'nicht-gefunden') return 'Raum nicht gefunden. Code prüfen – der Gastgeber muss den Raum offen haben.';
  if (m === 'zeit') return 'Keine Verbindung. Internet prüfen und noch einmal versuchen.';
  if (m === 'code-belegt') return 'Raumcode war belegt. Bitte noch einmal „Raum erstellen“.';
  if (m === 'kein-raum') return 'Online geht nur, wenn die Seite im Internet geöffnet ist (nicht als Datei).';
  return 'Verbindung nicht möglich. Internet prüfen und noch einmal versuchen.';
};
$('#mpErstellen').addEventListener('click', async () => {
  mp.zeige('host'); $('#mpCode').textContent = '····'; $('#mpStatusH').textContent = 'Raum wird erstellt …';
  try { await NETZ.erstellen(); }
  catch (e) { $('#mpStatusH').textContent = mpFehler(e); }
});
$('#mpBeitreten').addEventListener('click', () => { mp.zeige('gast'); $('#mpStatusG').textContent = ''; setTimeout(() => $('#mpEingabe').focus(), 50); });
$('#mpEingabe').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
const mpBeitreten = async () => {
  const c = $('#mpEingabe').value;
  if (c.length !== 4){ $('#mpStatusG').textContent = 'Der Code hat 4 Ziffern.'; return; }
  $('#mpStatusG').textContent = 'Verbinde …';
  try { await NETZ.beitreten(c); }
  catch (e) { $('#mpStatusG').textContent = mpFehler(e); }
};
$('#mpLos').addEventListener('click', mpBeitreten);
$('#mpEingabe').addEventListener('keydown', e => { if (e.key === 'Enter') mpBeitreten(); });


// ---------- Zeichenfläche passend skalieren ----------
const flaeche = $('#flaeche');
function skaliere(){
  // V8.0: oben/unten immer voll; breite Handys: Menü halb so viel breiter wie möglich (schmale Seitenränder);
  // 16:9: max. 8 % Höhenstreckung; Tablets: unverzerrt mit Rand oben/unten
  const voll = Math.max(1120, Math.round(600 * innerWidth / Math.max(1, innerHeight)));
  const W = Math.round(1120 + (voll - 1120) * .5);
  flaeche.style.width = W + 'px'; flaeche.style.setProperty('--fw', W + 'px');
  const sh = innerHeight / 600;
  let sx, sy;
  if (W * sh <= innerWidth){ sx = sy = sh; }
  else { sx = innerWidth / W; sy = Math.min(sh, sx * 1.08); }
  flaeche.style.transform = 'translate(-50%,-50%) scale(' + sx + ',' + sy + ')';
}
addEventListener('resize', skaliere);

// Logo und Untertitel in 240 px einpassen (egal welche Schrift geladen ist)
function logoMenuePassen(){
  document.querySelectorAll('.m-logo b, .m-logo small').forEach(el => {
    el.style.transform=''; const w = el.scrollWidth;
    if (w > 240) { el.style.transform = 'scaleX(' + (240 / w).toFixed(3) + ')'; el.style.transformOrigin = 'left center'; }
  });
}
document.fonts && document.fonts.ready.then(() => { if (!$('#menue').hidden) { logoMenuePassen(); zeichneKarten(); zeichnePlaetze(); } });

function markiereErstenSpielerBeimStart(){
  // V2.82: Initiale Auswahl ist ein eigener, einmaliger Zustand.
  // Ein späteres Abwählen führt deshalb niemals zu einer automatischen
  // Wiederwahl beim nächsten Aktualisieren oder Neuzeichnen.
  // V2.83: Keine automatische Vorauswahl mehr – der Spieler wählt selbst.
  return;
  if (istGastModus() || zustand.ersteAuswahlGemacht || zustand.squad.length > 0) return;
  const erster = AUSWAHL[0];
  if (erster == null || !STAND.hatKarte(erster)) return;

  zustand.ersteAuswahlGemacht = true;
  zustand.torwart = -1;
  rolleDu = 'feld';
  zustand.squad.push(erster);
  zustand.nummern[erster] = vorschlagNummer(erster) || 9;
  zustand.nrManuell.delete(erster);
  zustand.posManuell = zustand.posManuell || {};
  zustand.posManuell[erster] = 'STU';
  positionenAbgleichen();
}

function zeigeMenue(){
  const ladeOverlay = $('#laden');
  ladeOverlay.hidden = true;
  ladeOverlay.style.display = 'none';
  ladeOverlay.style.visibility = 'hidden';
  ladeOverlay.style.pointerEvents = 'none';
  $('#menue').hidden = false;
  musik.spiele('menue');
  try { ligaStufeInsMenue(); } catch (e) {}   // V4.6
  skaliere();
  logoMenuePassen();
  markiereErstenSpielerBeimStart();
  zeichneKarten();
  aktualisiere();
  try { if (!window.__elfHinweisGezeigt && !istGastModus() && zustand.squad.length === 0){ window.__elfHinweisGezeigt = true; setTimeout(() => { try { scGrossHinweis('WÄHLE DEINE ' + TEAM_GROESSE + ' SPIELER', '+ ' + BANK_GROESSE + ' für die Bank', 2000); } catch (e) {} }, 350); } } catch (e) {}   // V3.09
}

$('#beenden').addEventListener('click', () => {
  $('#anpfiff').hidden = true;
  $('#menue').hidden = true;
  $('#laden').hidden = false;
  starteLaden();
});