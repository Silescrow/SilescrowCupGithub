/* Silescrow Cup V 4.2 – js/start-konfig-musik.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

// ===== VERSION (zentral – nur hier ändern) =====
const ALLE_STEUERN = true;   // Testversion „Alle 8 steuern“: true
const SPIEL_VERSION = 'V 4.2';   // V3.08: Auto-Save aus den Speicherplätzen entfernt (versteckt), Reset löscht ihn mit Warnhinweis
//   // V3.07: ONLINE + HALL OF FAME – Aufstellung zeigt Torwart + 4 (Hallen-Formationen), Rest auf Bank/Reserve, wird nicht gespeichert, Stadion-/Offline-Aufstellung bleibt unberührt.  V3.10: Spielstand-Fenster: Mülleimer zum Löschen, Superteam+Land in den Plätzen, ALLES ZURÜCKSETZEN entfernt.  V3.09: AUTOMATISCH im Aufstellungsfenster nimmt immer die stärksten Spieler aus Aufstellung, Bank und Reserve (auch neue Pack-Karten)   // V11.44: MVP-Fenster per Finger scrollbar, Skill-Fenster mit WEITER + ZURÜCK, Freistoß-Mauer öfter und größer   // V11.43: KI-Gegner sprinten hinterher, wenn du sprintest   // V11.42: KI sprintet öfter, Anzeigetafel noch 8 px weiter links   // V11.41: obere Knöpfe 40 px, Anzeigetafel noch 10 px weiter links   // V11.40: Wetter-Box kleiner, Anzeigetafel samt Online-/Konferenz-Leiste 22 px weiter links   // V11.39: obere HUD-Teile (Tafel, Wetter, Knöpfe) von +30 % auf ca. +15 % zurück   // V11.38: HUD-Stile jetzt am Dateiende (wirkten vorher nicht), Abstände oben/unten größer, Tasten 81 %   // V11.37: Einstellungs-Knopf wieder mit Zahnrad-Symbol wie vorher, Aktionstasten weitere 5 % kleiner   // V11.36: Aktionstasten 10 % kleiner, Einstellungs-Knopf als Symbol wie Vollbild, Wetter überlappt nichts, FPS unten mittig   // V11.35: HUD (Tafel, Tasten, Joystick, Knöpfe oben rechts, FPS) ca. 30 % größer   // V10.0: Halle – in allen Grafikstufen nur noch wenige Zuschauer (mehr FPS);   // V9.9: Wechseln im Aufstellungs-Fenster im Spiel (kein extra AUSWECHSELN-Knopf mehr); Spielende: kein Abklatschen/Hinlegen mehr, Sieger jubeln und umarmen sich, Verlierer Kopf runter; Kapitän (© in Kaderliste, C in der Aufstellung, © im Spiel); FPS-Anzeige nur „FPS Zahl“; Grafik ohne Auflösungsangaben; jeder Modus (Freundschaft, Silescrow Cup, Hall of Fame) merkt sich seine eigene Aufstellung; Kaderliste zeigt den ungefähren Marktwert (≈ Crows) und die Zufriedenheit (Smiley) jedes Spielers; Aufstellung im Spiel sieht aus wie im Hauptmenü (Bank, Feld, Formationen);   // V11.8: MENÜ-Knopf im Turnier wieder gelb;   // V11.7: Turnier-Buttons/Banner/DEIN SPIEL ohne dunkle Schrift auf Gelb;   // V11.3: kleiner Button NUMMER ÄNDERN unter dem gewählten Spieler, Meldung beim Tauschen;
// V11.5: Hallen-Zuschauer auf beiden Seiten und in den Ecken, jeder Fan sieht anders aus   // V11.2: TRIKOTNUMMERN-Button statt Schild, AUFSTELLUNG ÄNDERN vor dem Anstoß   // V11.0: Bronze/Silber/Gold auf Menü-Karten nur als kleines Symbol;   // V10.9: Kader-Karten im Hauptmenü leuchten gelb;   // V11.0: laufende Liga – Pack-Spieler ganz vorne, dann dein Liga-Kader, gesperrte Spieler hinten;   // V10.7: laufende Liga – dein Kader steht im Hauptmenü vorne, gesperrte Spieler hinten;   // V10.6: neue Pack-Spieler stehen im Hauptmenü ganz vorne (neuester zuerst);   // V10.5: (S) vor deinem Superteam in Silescrow Cup, Hall of Fame und Liga; laufende Liga sperrt die Spielerwahl im Hauptmenü;   // V10.2: laufende Liga sperrt die Spielerwahl im Hauptmenü (Tausch nur über KADER, frei wieder nach NEUE LEAGUE);   // V10.1: dein Superteam steht in Silescrow Cup, Hall of Fame und Liga als (S) vor dem Landesnamen, z. B. (S) TÜR – die Nation ist nie dein Gegner, solange dein Superteam dieses Land hat;   // V10.0: HALLENTURNIER – vor dem Start dein Team wählen (MEIN SUPERTEAM oder eine der 32 Nationen); // V4.0: LIGA – laufende Liga sperrt Land und Stufe im Hauptmenü, NEUE LEAGUE macht sie wieder wählbar;  // V9.5: SILESCROW CUP – vor dem Start dein Team wählen (MEIN SUPERTEAM oder eine der 32 Nationen); LEAGUE bleibt bei deiner Spielerwahl im Hauptmenü;   // V9.1: erster Start auf Grafik MITTEL; online – SPIEL VERLASSEN im ⚙-Fenster, Spiel pausiert, wenn ein Mitspieler geht;   // V9.1: Grafik AUTO entfernt; NIEDRIG ohne Tunnel/Bank, Fan-Animation und Sterne, KI halb so oft; MITTEL/HOCH/ULTRA immer volle Qualität ohne Absenken;   // V9.0: online springt die Steuerung nach dem Pass/bei Ballgewinn automatisch wie offline; Sprach-Chat (🎤) für Online-Spiele; Online-Leiste unter der Tafel; bei Verbindungsabbruch wartet das Spiel (keine KI-Übernahme); Gast-Erkennung korrigiert (Gast auf ROT startet mit), WLAN-Symbol im Spiel, Controller-Symbol mit Online-Name über dem Kopf, grauer ANSTOSS-Knopf beim Gast;   // V8.1: Online-Freundschaft nur mit echten Spielern (keine KI auf ROT, ANSTOSS gesperrt bis beide bereit), Online-Anzeige im Spiel;   // V8.0+: Grafik in den Einstellungen im Hauptmenü, Zahnrad-Symbol, Kommentator-Test entfernt, Update-Prüfung mit Zeitstempel;   // Einstellungs-Knopf im Hauptmenü als gezeichnetes Zahnrad (⚙ wurde auf manchen Handys nicht erkannt);   // V8.0: Stand von V7.9 (Glücksrad, Training mit 3 Punkten, Wechsel mit Schiri-Tafel, Rudelbildung, schwächerer Pass-Magnet);   // V7.0: Glücksrad bei neuer Liga (Gold 1 %, Silber 6 %, Bronze 20 %, Crows, Nieten);   // V7.0: Training – vor jedem Spiel immer 3 Punkte (1 Punkt pro Schritt), Plus-Knöpfe immer drückbar mit Hinweis;   // V6.0 (neu): Online-Menschen haben ein kleines weißes Controller-Symbol auf Teamfarbe (BLAU/ROT) über dem Kopf;   // V5.9: LEAGUE/SILESCROW CUP zeigen Land + Stufe der laufenden Runde, Hinweis beim Fortsetzen mit anderer Stufe/anderem Land, Freundschaftsspiel ohne Land im Menü;   // V5.8: Online nur Freundschaftsspiele (Silescrow Cup und League grau, solange jemand verbunden ist);   // V5.7: Liga fortsetzen spielt mit deinem aktuellen Menü-Team (eingewechselte Pack-Spieler spielen mit);   // V5.6: NEUES SPIEL aus dem Hauptmenü entfernt (neu anfangen über LEAGUE / SILESCROW CUP, alles löschen in den Einstellungen);   // V5.5: Spieler antippen = Nummer/Position/Raus, Nummern tauschen, Siegesserie (5 Siege = +1.000), Liga Platz 4 bekommt Crows, rechtes Menü passt bei 16:9;   // V5.4: Fähigkeits-Symbole direkt neben dem Spielernamen in der Kaderliste;   // V5.3: Online-Bildschirm BLAU gegen ROT; neue Pack-Karten kommen automatisch ins Superteam; online Team/Land wählen und ANSTOSS im Online-Bereich und im Hauptmenü;   // V5.2: Transfersystem (Stars der Nationen) entfernt, Pack-Original +5, Kopie der Nation −5; Notbremse – unter ca. 42 FPS wird in jeder Grafikeinstellung automatisch abgesenkt;   // V5.1: AUTO-Grafik (Leistungstest im Ladebildschirm, Ziel 60 FPS bzw. 90 FPS auf 120-Hz-Displays), unsichtbare Figuren/Pfützen werden nicht mehr gezeichnet;   // V5.0: SILESCROW bei der Türkei als Zehner (#10), immer in der Startelf gegen die KI-Türkei, trainierbar bis 135; Spezialfähigkeiten entfernt; MEIN SUPERTEAM mit gelbem Lichtstreifen, der als Schlange um den Knopf läuft;   // V5.0: SILESCROW LEAGUE + LEAGUE 2 (simuliert, ausgeglichen nach Sternen), SILESCROW CHAMPIONS CUP mit Auslosung (Top 4 beider Ligen), Pokal heißt SILESCROW CUP; SILESCROW spielt für die Türkei;   // V4.9: Freundschaftsspiel mit allen 32 Nationen; Superteam-Übersicht – Spaltenüberschriften bleiben beim Scrollen sichtbar;   // V4.8: Knopf heißt MEIN SUPERTEAM;   // V4.7: Knopf SUPERTEAM im Menü zeigt deinen Kader mit Werten;   // V4.6: Freundschaftsspiel: erst dein Team (Mein Superteam oder eine der 32 Nationen), dann der Gegner; Stufe der laufenden Liga ist im Menü ausgewählt;   // V4.5: Schwierigkeit der laufenden Liga ist im Menü markiert;   // V4.4: neue Lieder für Ladebildschirm und Hauptmenü (Suno);   // V4.3: Torwart darf den 16er immer verlassen; Abstoß und Ball am Fuß mit normalem SCHUSS/PASS, Abschlag aus der Hand;   // V4.2: Pressekonferenz mit Tisch, Mikrofonen und SILESCROW-TV-Wand, dein Star sitzt mit am Tisch;   // V4.1:   // V4.1: Crows + Pack-Shop (3 ziehen, 1 wählen), neues Training (Sieg 5 / Unentschieden 3 / Niederlage 1, max. 110), Ausdauer statt Dribbling, sanfte Tempo-Kurve mit Antritt, Nationen nach Sternen mit Gold-/Silber-/Bronze-Spielern, Einzelkauf von Stars (Original +2), schneller Wechsel zum Pass-Empfänger, leichter Pass-Magnet;   // V10.0: Aufstellungsfeld breiter, 4-3-1-2 als erste Formation;   // V10.0: 147 Seitenbilder (nach links schauend) in den Originalbildern gespiegelt eingebaut;   // V10.0: Köpfe schauen bei Diagonal-Läufen in Laufrichtung (Rückansicht nur noch bei fast reinem Weglaufen);   // V9.8: Flanken fliegen weiter (bis 38 m) und kommen trotz Luftwiderstand am Ziel an;   // V9.6: größere Stärkeunterschiede zwischen den Nationen (Länder-Bonus: Stufe 5 = +14 bis +20, Stufe 4 = +10 bis +16, Stufe 3 = +6 bis +12, Stufe 2 = +3 bis +9, übrige = +0 bis +6);   // V9.5: Online-Freundschaftsspiel Blau gegen Rot: die vom Gegner gewählten Spieler (11 + 2 Auswechselspieler) sind in der Spielerauswahl sichtbar als GEGNER markiert und nicht wählbar, bei Gastgeber und Gast;   // V9.4: Beim Fortsetzen der Liga werden die zu Beginn der Liga gewählten Spieler (Team, Torwart, Auswechselspieler) im Menü wieder markiert;   // V9.3: Das Liga-Team wird nur noch einmal beim Start ins Menü übernommen; danach kann man alle Spieler abwählen und frei ein anderes Team (z. B. für den Pokal) wählen;   // V9.2: Spielerauswahl mit 15 Spielern pro Seite und 45 sichtbaren Spielern (3 Seiten);   // V9.1: SILESCROW (Hauptfigur) steht in der Spielerauswahl an erster Stelle;   // V9.0: Spielerauswahl im Hauptmenü zeigt nur 30 Spieler auf 3 Seiten (10 pro Seite), der Rest ist verborgen; freigespielte Bronze-/Silber-/Gold-Karten und bereits gewählte Spieler bleiben erreichbar;   // V8.0: alle normalen Figuren Stärke 70 und trainierbar, eigene Figuren in KI-Nationen, SILESCROW immer in einem KI-Kader;   // V6.0: 20 weitere Gegenspieler (Durchgang 15);   // V5.9: 11 gegen 11 ist das Hauptspiel, du steuerst alle Feldspieler;   // V5.6: Einlauf ohne Ruckler (Zuschauer schrittweise), Kamera wackelt nicht mehr, kluge Laufwege im Angriff, strenges Abseits mit Fahne; Spielfeldlinien-Fix (Linienrichter überschrieben sie); Pressekonferenz (Antworten wählen, Beliebtheit, Teamgeist), Trage, halbautomatischer Wechsel, Mitzieh-Effekt, Länderstärke; V5.3: Zuschauer = gleiche Figuren wie die Spieler, in 2.5D (jede Reihe eigene Ebene), Torjubel mit Armen hoch; V5.2: neue Tribünen (Haupttribüne + hinterm Tor), Zuschauer sitzen exakt auf jedem Sitz; V5.1: Tornetz mit Sechseck-Maschen, realistische Einschläge (Ball beult das Netz aus und wird weich abgebremst); V5.0: Fans sind echte Spielfiguren und sitzen realistisch (Unterschenkel von der Reihe davor verdeckt, gleich groß), Bankspieler sitzen, Aufstellungs-Bank nur mit den 2 Auswechselspielern; V4.9: Kamera „Klassisch Plus“ (fährt mit, leichter Schwenk zum Tor, schaut voraus), volle TV-Kamera entfernt, Ball etwas größer, Tribünen hinter den Toren sichtbar, Ball im Aus fliegt frei weiter (neuer Ball für den Standard); V4.8: Gegner-Trainer spricht nicht mehr; V4.7: TV-Kamera (schwenkt und zoomt, im Grafikmenü umschaltbar), Fans sitzen richtig; V4.6: neues Stadion aus Bildern (Haupttribüne, Kurven, Flutlicht) mit Fans auf den Plätzen; V4.5: Jahreszeiten (Wetter, Rasenfarbe, Herbstlaub/Raureif, Trainer zu Hitze/Kälte) + Temperatur neben dem Wettersymbol, Anstoß/Standards: Gegner-Mensch hält Abstand, Ball kleiner; V4.4: realistische Ballphysik (echte Schwerkraft, Luftwiderstand, Magnus-Drall, Aufprall/Rollen je nach Wetter), jeder Schuss mit Drall, Ball rollt nach dem Aus weiter; V4.3: Trainer-Blasen in der oberen Leiste neben dem Spielstand; V4.2: Trainer-Sprechblasen immer oben und kleiner; V4.1: Grafikstufe ULTRA (Faktor 2,5), Rasen heller und sanfter (Variante C), nur noch 2K-Textur, auch auf MEDIUM; V4.0: Ruckeln behoben – Rasentextur ohne Overlay-Mischen (vorab gebacken, nur HIGH), Bankfiguren nur im Bild zeichnen, Sprechblasen-Text zwischengespeichert; V3.9: Versionsanzeige jetzt „V 3.9“ (statt 8+1-TEST); V3.8: neue Rasentextur aus 4K-Vorlage (2K auf HIGH, 1K auf MEDIUM); V3.7: echte Musik (Ladebildschirm + Hauptmenü), Rasentextur 2K; V3.6: Online-Knopf wieder da (Freundschaft und Online-Cup mit Raumcode); V3.5: Auswechselspieler tragen beim Aufwärmen Leibchen (Neonfarbe je Team); V3.4: Bankspieler und Trainer als echte Figuren mit Beinen (Trainer im Trainingsanzug); V3.3: Auswechselspieler stehen als ganze Figuren vor der Bank und wärmen sich auf; V3.2: Elfmeter bei Foul im Strafraum, Abwehr steht höher (Abseitsfalle); V3.1: offene Bänke, Trainer neben der Bank (jeder sieht anders aus) mit Sprechblasen – 510 Sätze passend zur Spielsituation; V3.0: Auswechselbank 9 + 2 (du und KI wechseln, max. 2), Spielertunnel mit Bänken, Rasentextur, Liga direkt fortsetzen, Ton + Hinweis bei der Kartenwahl, Standards immer zuerst durch den Menschen; Testversion auf Basis von V 8.6; V2.5: Aufstellung hochkant + Bank, Drall-Schüsse, KI hält Positionen; V2.4: Formationswahl + Spieler tauschen; V2.3: Nummernfenster im Bild; V2.2: Menü mit Freundschaftsspiel/Pokal/Liga; V2.1: Elfmeterschießen mit eigenem Schuss; V2.0: Ecken/Freistöße immer menschlicher Schütze; Menü-Fix 16:9
window.__scHaken = () => document.querySelectorAll('.qbadge,.pbadge,.version,.m-version').forEach(e => { if (!e.querySelector('.sc-akt')) e.insertAdjacentHTML('beforeend', ' <span class="sc-akt" title="Neueste Version">✓</span>'); });   // V3.0
document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.qbadge,.pbadge,.version,.m-version').forEach(e => { e.textContent = SPIEL_VERSION; if (window.__scAktuell) window.__scHaken(); }));
const STADION_GRUND = 'audio/stadion_grund.mp3';
const STADION_SPANNUNG = 'audio/stadion_spannung.mp3';
const TOR_JUBEL = 'audio/tor_jubel.mp3';
// V6.0: dramatische Fan-Reaktion beim Tor (zusätzlich zum Jubel). Auf false setzen = wie vorher.
const TOR_DRAMA_AN = true;
const TOR_DRAMA = 'audio/tor_drama.mp3';
// Tor-Jubel für DEIN Tor (14 s). TOR_DRAMA (oben) = Missed-Chance-Reaktion: Pfosten, Latte, knapp vorbei und Gegentor.
const TOR_CHEER = 'audio/tor_cheer.mp3';
// =====================================================================
// MUSIK  (eigene Kompositionen, live im Browser erzeugt – keine Dateien nötig)
//   'laden' : treibender Ladebildschirm-Beat (132 BPM, A-Moll)
//   'menue' : fröhliche Menü-Melodie (112 BPM, C-Dur, 8 Takte)
// Browser erlauben Ton erst nach dem ersten Antippen -> Start beim ersten Tippen
// =====================================================================
// V3.7: echte Musik (Suno, Silescrow): Ladebildschirm „Loading Matchday“, Hauptmenü „Pitch Perfect“
const MUSIK_DATEIEN = { laden: 'audio/laden.mp3', menue: 'audio/menue.mp3' };
const musik = (() => {
  let ctx = null, master = null, musikBus = null, rauschen = null;
  let aktuell = null, gewuenscht = 'laden', timer = null;
  let naechsterSchritt = 0, schrittZeit = 0, spurGain = null;
  let stumm = false, entsperrtUm = 0;
  const puffer = {}; let probe = null;   // V3.7: dekodierte Songs, laufende Wiedergabe
  const LAUT = 0.32;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const komp = ctx.createDynamicsCompressor();
    komp.threshold.value = -14; komp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = stumm ? 0 : LAUT;
    master.connect(komp); komp.connect(ctx.destination);
    // Rauschen für Schlagzeug
    rauschen = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = rauschen.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // V3.7: Songs dekodieren; sobald fertig, ersetzt der Song das live erzeugte Stück
    for (const name in MUSIK_DATEIEN){
      try {
        fetch(MUSIK_DATEIEN[name]).then(x => x.arrayBuffer()).then(buf => new Promise((ok, nein) => ctx.decodeAudioData(buf, ok, nein))).then(ab => {
          puffer[name] = ab;
          if (aktuell === name){ aktuell = null; starteStueck(name); }
        }).catch(e => { typeof __scWarn === 'function' && __scWarn(e); });
      } catch (e) {}
    }
    return true;
  }
  // V3.7: Song in Dauerschleife – am Ende sanft überblenden und von vorn beginnen
  function songStarten(name, ziel){
    const ab = puffer[name], LAUT_SONG = .95, X = 2.5;
    const sp = { name, timer: null, quellen: [] };
    const einmal = (t0, fadeIn) => {
      const q = ctx.createBufferSource(); q.buffer = ab;
      const g = ctx.createGain(); g.gain.setValueAtTime(fadeIn ? 0.0001 : LAUT_SONG, t0);
      if (fadeIn) g.gain.exponentialRampToValueAtTime(LAUT_SONG, t0 + X);
      const ende = t0 + ab.duration;
      g.gain.setValueAtTime(LAUT_SONG, ende - X); g.gain.exponentialRampToValueAtTime(0.0001, ende);
      q.connect(g); g.connect(ziel); q.start(t0); q.stop(ende + .05);
      sp.quellen.push(q); if (sp.quellen.length > 3) sp.quellen.shift();
      sp.timer = setTimeout(() => { if (probe === sp) einmal(ctx.currentTime + Math.max(0, ende - X - ctx.currentTime), true); }, Math.max(0, (ende - X - ctx.currentTime) * 1000 - 300));
    };
    einmal(ctx.currentTime + .05, false);
    return sp;
  }
  function songStoppen(){
    if (!probe) return;
    const sp = probe; probe = null; clearTimeout(sp.timer);
    setTimeout(() => { for (const q of sp.quellen) try { q.stop(); } catch (e) {} }, 1300);
  }

  // ---------- Instrumente ----------
  function huelle(g, t, a, peak, dauer){
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  }
  function kick(t, ziel){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    huelle(g, t, .003, .9, .28); o.connect(g); g.connect(ziel); o.start(t); o.stop(t + .3);
  }
  function snare(t, ziel){
    const n = ctx.createBufferSource(); n.buffer = rauschen;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1300;
    const g = ctx.createGain(); huelle(g, t, .002, .38, .17);
    n.connect(f); f.connect(g); g.connect(ziel); n.start(t); n.stop(t + .2);
    const o = ctx.createOscillator(), g2 = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190;
    huelle(g2, t, .002, .3, .09); o.connect(g2); g2.connect(ziel); o.start(t); o.stop(t + .1);
  }
  function hat(t, ziel, offen){
    const n = ctx.createBufferSource(); n.buffer = rauschen;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = ctx.createGain(); huelle(g, t, .001, offen ? .12 : .09, offen ? .16 : .045);
    n.connect(f); f.connect(g); g.connect(ziel); n.start(t, Math.random() * .5); n.stop(t + .2);
  }
  function bass(t, m, dauer, ziel){
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = o2.frequency.value = hz(m);
    const g2 = ctx.createGain(); g2.gain.value = .25;
    huelle(g, t, .005, .5, dauer);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(ziel);
    o.start(t); o2.start(t); o.stop(t + dauer + .05); o2.stop(t + dauer + .05);
  }
  function lead(t, m, dauer, ziel, laut = .17, typ = 'square'){
    const o = ctx.createOscillator(), g = ctx.createGain();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3200;
    o.type = typ; o.frequency.value = hz(m);
    const vib = ctx.createOscillator(), vg = ctx.createGain();   // leichtes Vibrato
    vib.frequency.value = 5.5; vg.gain.value = hz(m) * .006; vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(laut, t + .012);
    g.gain.setValueAtTime(laut, t + Math.max(.02, dauer - .05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(f); f.connect(ziel);
    o.start(t); vib.start(t); o.stop(t + dauer + .05); vib.stop(t + dauer + .05);
  }
  function flaeche(t, akkord, dauer, ziel){
    akkord.forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = (i - 1) * 6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(.035, t + .15);
      g.gain.setValueAtTime(.035, t + dauer - .2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      o.connect(g); g.connect(f); f.connect(ziel); o.start(t); o.stop(t + dauer + .05);
    });
  }

  // ---------- moderne Instrumente ----------
  function kick2(t, ziel){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(48, t + .09);
    g.gain.setValueAtTime(1.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .38);
    o.connect(g); g.connect(ziel); o.start(t); o.stop(t + .4);
    // Klick für Druck
    const n = ctx.createBufferSource(); n.buffer = rauschen;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3500;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(.25, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + .012);
    n.connect(f); f.connect(g2); g2.connect(ziel); n.start(t); n.stop(t + .02);
  }
  function clap(t, ziel, hall){
    [0, .011, .022].forEach((d, i) => {
      const n = ctx.createBufferSource(); n.buffer = rauschen;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = .9;
      const g = ctx.createGain(); const laut = i === 2 ? .5 : .35;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(laut, t + d + .002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + (i === 2 ? .2 : .03));
      n.connect(f); f.connect(g); g.connect(ziel); if (i === 2) g.connect(hall);
      n.start(t + d, Math.random() * .5); n.stop(t + d + .25);
    });
  }
  function sub(t, m, dauer, ziel){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.42, t + .02);
    g.gain.setValueAtTime(.42, t + dauer - .08); g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(ziel); o.start(t); o.stop(t + dauer + .02);
  }
  function supersaw(t, akkord, dauer, ziel, hall){
    const sum = ctx.createGain(); sum.gain.value = 1;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = .7;
    sum.connect(f); f.connect(ziel); f.connect(hall);
    akkord.forEach(m => {
      [-18, -8, 0, 8, 18].forEach((dt, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt;
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(.011, t + .06);
        g.gain.setValueAtTime(.011, t + dauer - .12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
        o.connect(g);
        if (pan){ pan.pan.value = (i - 2) * .35; g.connect(pan); pan.connect(sum); } else g.connect(sum);
        o.start(t); o.stop(t + dauer + .02);
      });
    });
  }
  function pluck(t, m, dauer, ziel, echo, hall){
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + .22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(.45, dauer + .15));
    [-7, 7].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt;
      o.connect(f); o.start(t); o.stop(t + .5); });
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = hz(m + 12);
    const g3 = ctx.createGain(); g3.gain.value = .5; o3.connect(g3); g3.connect(f); o3.start(t); o3.stop(t + .5);
    f.connect(g); g.connect(ziel); g.connect(echo); g.connect(hall);
  }
  function riser(t, dauer, ziel){
    const n = ctx.createBufferSource(); n.buffer = rauschen; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(9000, t + dauer);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + dauer);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer + .05);
    n.connect(f); f.connect(g); g.connect(ziel); n.start(t); n.stop(t + dauer + .1);
  }

  // ---------- Stücke (Schritt = Sechzehntel) ----------
  const STUECKE = {
    laden: {
      bpm: 132, takte: 4,
      akkorde: [[57,60,64],[53,57,60],[48,52,55],[55,59,62]],   // Am  F  C  G
      bassTon: [45, 41, 48, 43],
      schritt(s, t, z, st){
        const takt = Math.floor(s / 16) % 4, p = s % 16, sech = 60 / st.bpm / 4;
        if (p % 4 === 0) kick(t, z);
        if (p === 4 || p === 12) snare(t, z);
        if (p % 2 === 1) hat(t, z, p === 15);
        if (p % 2 === 0) bass(t, st.bassTon[takt] + (p === 6 || p === 14 ? 12 : 0), sech * 1.8, z);
        // Arpeggio im Sechzehntel-Takt
        const a = st.akkorde[takt], folge = [0,1,2,1];
        lead(t, a[folge[p % 4]] + 12 + (p >= 8 ? 12 : 0), sech * .9, z, .055);
        if (p === 0) flaeche(t, st.akkorde[takt], sech * 16, z);
      }
    },
    // ---------- Modernes Menü-Stück: Future-House, 122 BPM, f-Moll ----------
    // Supersaw-Flächen mit Sidechain-Pumpen, Sub-Bass, Clap, Off-Beat-Hats,
    // Pluck-Melodie mit Echo und Hall. Erster Durchlauf: Filter öffnet sich langsam (Intro).
    stille: { bpm: 120, takte: 1, schritt(){} },
    menue: {
      bpm: 122, takte: 8,
      akkorde: [[65,68,72,75],[61,65,68,72],[63,68,72,75],[63,67,70,74],
                [65,68,72,75],[61,65,68,72],[63,68,72,75],[63,67,70,74]],   // Fm7 Dbmaj7 Ab Eb
      bassTon: [41, 37, 44, 39, 41, 37, 44, 39],
      melodie: (() => {
        const a = [
          [0,84,2],[3,80,1],[4,84,2],[6,87,2],[8,84,3],[11,82,1],[12,80,2],[14,77,2],
          [16,77,2],[19,80,1],[20,84,2],[22,80,2],[24,77,4],[28,75,2],[30,77,2],
          [32,87,2],[35,84,1],[36,87,2],[38,89,2],[40,87,3],[43,84,1],[44,80,4],
          [48,79,2],[51,82,1],[52,87,2],[54,82,2],[56,79,4],[60,82,2],[62,84,2]
        ];
        const b = a.filter(n => n[0] < 48).map(([s,m,l]) => [s + 64, m, l]);
        const schluss = [[112,82,2],[114,84,2],[116,87,2],[118,89,2],[120,87,4],[124,84,4]];
        return a.concat(b, schluss);
      })(),
      fx: null,
      effekte(z){
        if (this.fx && this.fx.z === z) return this.fx;
        // Hall (künstlicher Raum)
        const hall = ctx.createConvolver(), len = ctx.sampleRate * 2.2;
        const ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
        hall.buffer = ir;
        const hallGain = ctx.createGain(); hallGain.gain.value = .32; hall.connect(hallGain); hallGain.connect(z);
        // Echo (punktierte Achtel)
        const echo = ctx.createDelay(1); echo.delayTime.value = 60 / this.bpm * .75;
        const fb = ctx.createGain(); fb.gain.value = .33;
        const echoFilter = ctx.createBiquadFilter(); echoFilter.type = 'lowpass'; echoFilter.frequency.value = 2600;
        echo.connect(echoFilter); echoFilter.connect(fb); fb.connect(echo);
        const echoOut = ctx.createGain(); echoOut.gain.value = .35; echoFilter.connect(echoOut); echoOut.connect(z);
        // Sidechain-Pumpe für Flächen und Bass
        const pumpe = ctx.createGain(); pumpe.connect(z);
        // Intro-Filter für Flächen
        const introFilter = ctx.createBiquadFilter(); introFilter.type = 'lowpass'; introFilter.frequency.value = 20000;
        introFilter.connect(pumpe);
        this.fx = { z, hall, echo, pumpe, introFilter };
        return this.fx;
      },
      schritt(s, t, z, st){
        const fx = st.effekte(z);
        const intro = s < 64;                       // erste 4 Takte: Intro
        const ges = s % 128, takt = Math.floor(ges / 16), p = ges % 16, sech = 60 / st.bpm / 4;
        const lied = intro ? Math.floor(s / 16) : takt;

        if (s === 0){                               // Filter öffnet sich im Intro
          fx.introFilter.frequency.setValueAtTime(1000, t);
          fx.introFilter.frequency.exponentialRampToValueAtTime(14000, t + sech * 64);
        }
        // --- Schlagzeug ---
        const fill = takt === 7 && p >= 12;
        if (!intro && p % 4 === 0 && !(takt === 7 && p === 12)){
          kick2(t, z);
          fx.pumpe.gain.cancelScheduledValues(t);
          fx.pumpe.gain.setValueAtTime(.22, t);
          fx.pumpe.gain.linearRampToValueAtTime(1, t + sech * 3.2);
        }
        if ((p === 4 || p === 12) && (!intro || s >= 48)) clap(t, z, fx.hall);
        if (p % 4 === 2) hat(t, z, true);                       // Off-Beat (offen)
        if (!intro && p % 2 === 1) hat(t, z, false);            // Sechzehntel leise
        if (fill) { hat(t, z, false); hat(t + sech / 2, z, false); }   // Hi-Hat-Rolle
        if (intro && s === 60) riser(t, sech * 4, z);

        // --- Bass: Sub lang + Off-Beat-Bass ---
        if (!intro){
          if (p === 0) sub(t, st.bassTon[takt], sech * 15, fx.pumpe);
          if (p % 4 === 2) bass(t, st.bassTon[takt] + 12, sech * 1.4, fx.pumpe);
        }
        // --- Supersaw-Flächen ---
        if (p === 0) supersaw(t, st.akkorde[lied % 8], sech * 16, fx.introFilter, fx.hall);
        // --- Pluck-Melodie (ab Takt 3 des Intros) ---
        if (!intro || s >= 32){
          for (const [ms, m, l] of st.melodie) if (ms === ges) pluck(t, m, sech * l, z, fx.echo, fx.hall);
        }
      }
    }

  };

  function planer(){
    const st = STUECKE[aktuell]; if (!st) return;
    const sech = 60 / st.bpm / 4;
    while (schrittZeit < ctx.currentTime + 0.15){
      st.schritt(naechsterSchritt, schrittZeit, spurGain, st);
      naechsterSchritt++; schrittZeit += sech;
    }
  }

  function starteStueck(name){
    if (!ctx || aktuell === name) return;
    // altes Stück ausblenden
    if (spurGain){ const alt = spurGain; alt.gain.setTargetAtTime(0.0001, ctx.currentTime, .15); setTimeout(() => alt.disconnect(), 1200); }
    clearInterval(timer);
    songStoppen();
    aktuell = name;
    spurGain = ctx.createGain(); spurGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    spurGain.gain.setTargetAtTime(name === 'menue' ? 2.2 : 1, ctx.currentTime, .12); spurGain.connect(master);   // V8.8: Hauptmenü-Musik lauter (2,2-fach)
    if (puffer[name]){ probe = songStarten(name, spurGain); return; }   // V3.7: echter Song
    // V6.4: alte eingebaute Melodie entfernt – es laufen nur noch die eigenen MP3s (bis sie geladen sind: Stille)
  }

  function freischalten(){
    const neu = !ctx;
    if (!init()) return;
    if (neu) entsperrtUm = performance.now();
    if (ctx.state === 'suspended') ctx.resume();
    starteStueck(gewuenscht);
    knoepfeAktualisieren();
  }
  // erster Fingertipp irgendwo startet den Ton
  ['pointerdown','keydown','touchstart'].forEach(ev =>
    addEventListener(ev, freischalten, {once:false, passive:true}));

  // Tab im Hintergrund -> Ton pausieren
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  function knoepfeAktualisieren(){
    document.querySelectorAll('[data-musik]').forEach(b => {
      b.classList.toggle('aus', stumm);
      b.classList.toggle('wartet', !ctx && !stumm);
      b.setAttribute('aria-label', stumm ? 'Musik einschalten' : 'Musik ausschalten');
      b.setAttribute('aria-pressed', !stumm);
    });
  }

  return {
    // ---------- Stadion-Geräusche (live erzeugt) ----------
    sfx: (() => {
      // ==========================================================
      // STADION-KLANG (alles live erzeugt): Grundrauschen der Menge, Gemurmel,
      // Klatsch-Rhythmen mit Trommel, Pfiffe der Fans, Spannung vor dem Tor,
      // "Ohhh" bei knappen Chancen, Jubel bei Toren, "Buuuh" bei Fouls
      // ==========================================================
      let menge = null, babbelT = null, chantT = null;
      const ok = () => ctx && ctx.state === 'running';
      const rausch = (t, dauer, typ, freq, q, laut, ziel) => {
        const n = ctx.createBufferSource(); n.buffer = rauschen;
        const f = ctx.createBiquadFilter(); f.type = typ; f.frequency.value = freq; f.Q.value = q;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, laut), t + .02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
        n.connect(f); f.connect(g); g.connect(ziel || master); n.loop = dauer > 1; n.start(t, Math.random() * .5); n.stop(t + dauer + .05);
        return f;
      };
      // Viele Stimmen singen/rufen einen Vokal (Formanten) – klingt wie eine Menschenmenge
      const VOKAL = { o: [430, 820, 2600], a: [760, 1250, 2650], u: [320, 760, 2500], e: [480, 1750, 2600] };
      function chor(vokal, t, dauer, laut, tiefe, hoehe, glide, anzahl = 14, ziel){
        const f = VOKAL[vokal], aus = ctx.createGain(); aus.gain.value = 1; aus.connect(ziel || master);
        const forms = f.map((fr, i) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = i === 0 ? 5 : 7;
          const bg = ctx.createGain(); bg.gain.value = [1, .55, .18][i]; b.connect(bg); bg.connect(aus); return b; });
        const sum = ctx.createGain(); sum.gain.value = 1; forms.forEach(b => sum.connect(b));
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(laut, t + Math.min(.25, dauer * .2));
        env.gain.setTargetAtTime(laut * .7, t + dauer * .35, dauer * .2);
        env.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
        env.connect(sum);
        for (let i = 0; i < anzahl; i++){
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          const fq = tiefe + Math.random() * (hoehe - tiefe), start = t + Math.random() * .12;
          o.frequency.setValueAtTime(fq, start); o.frequency.exponentialRampToValueAtTime(fq * glide, t + dauer);
          const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 4 + Math.random() * 3; vg.gain.value = fq * .025;
          vib.connect(vg); vg.connect(o.frequency);
          const og = ctx.createGain(); og.gain.value = .9 / anzahl;
          o.connect(og); og.connect(env); o.start(start); vib.start(start); o.stop(t + dauer + .05); vib.stop(t + dauer + .05);
        }
        // Atem-/Stimmrauschen dazu
        rausch(t, dauer, 'bandpass', f[1], .8, laut * .35, ziel || master);
      }
      function klatschen(t, laut, ziel){
        for (let i = 0; i < 9; i++) rausch(t + Math.random() * .035, .07, 'bandpass', 1400 + Math.random() * 1800, 1.4, laut * (.5 + Math.random() * .5), ziel);
      }
      function trommel(t, laut, ziel){
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + .18);
        g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .3); o.connect(g); g.connect(ziel || master); o.start(t); o.stop(t + .32);
      }
      function fanPfiff(t, laut, ziel){
        const o = ctx.createOscillator(), g = ctx.createGain(); const f0 = 1800 + Math.random() * 900;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (Math.random() < .5 ? 1.4 : .7), t + .45);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + .03); g.gain.exponentialRampToValueAtTime(0.0001, t + .5);
        o.connect(g); g.connect(ziel || master); o.start(t); o.stop(t + .55);
      }
      return {
        stadion(an, regen){
          if (!ctx) init();
          if (!ctx) return;
          if (menge){ const m = menge; m.g.gain.setTargetAtTime(0.0001, ctx.currentTime, .3); setTimeout(() => { try { m.quellen.forEach(q => q.stop()); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, 1500); menge = null; }
          clearInterval(babbelT); clearInterval(chantT);
          if (!an) return;
          const t = ctx.currentTime;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(window.__fanLaut || 1, t, .8); g.connect(master);
          const quellen = [];
          // tiefes Grundrauschen (weit weg, viele Menschen)
          const n1 = ctx.createBufferSource(); n1.buffer = rauschen; n1.loop = true;
          const f1 = ctx.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 520;
          const g1 = ctx.createGain(); g1.gain.value = .2; n1.connect(f1); f1.connect(g1); g1.connect(g); n1.start(); quellen.push(n1);
          // Stimmband (Menge redet und ruft)
          const n2 = ctx.createBufferSource(); n2.buffer = rauschen; n2.loop = true;
          const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 950; f2.Q.value = .5;
          const g2 = ctx.createGain(); g2.gain.value = .1; n2.connect(f2); f2.connect(g2); g2.connect(g); n2.start(t, .37); quellen.push(n2);
          // langsames Auf und Ab
          const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .09; lg.gain.value = .035; lfo.connect(lg); lg.connect(g2.gain); lfo.start(); quellen.push(lfo);
          let r = null;
          if (regen){ r = ctx.createBufferSource(); r.buffer = rauschen; r.loop = true; const rf = ctx.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 3000;
            const rg = ctx.createGain(); rg.gain.value = .07; r.connect(rf); rf.connect(rg); rg.connect(g); r.start(); quellen.push(r); }
          const spannungsG = ctx.createGain(); spannungsG.gain.value = 0; spannungsG.connect(g);
          const n3 = ctx.createBufferSource(); n3.buffer = rauschen; n3.loop = true;
          const f3 = ctx.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 1300; f3.Q.value = .7;
          n3.connect(f3); f3.connect(spannungsG); n3.start(t, .11); quellen.push(n3);
          menge = { g, g2, f2, spannungsG, f3, quellen, spannung: 0, echt: false };
          // echte Stadion-Aufnahme (deine Datei): Grundstimmung + Anfeuern-Schicht, nahtlos in Schleife
          const dek = url => fetch(url).then(r => r.arrayBuffer()).then(ab => new Promise(ok2 => ctx.decodeAudioData(ab, ok2, () => ok2(null)))).catch(() => null);
          const diese = menge;
          Promise.all([dek(STADION_GRUND), dek(STADION_SPANNUNG)]).then(([bg, bs]) => {
            if (menge !== diese || !bg) return;
            const z = ctx.currentTime + .05;
            const schleife = (buf, laut) => { const q = ctx.createBufferSource(); q.buffer = buf; q.loop = true; q.loopStart = .06; q.loopEnd = buf.duration - .06;
              const gg = ctx.createGain(); gg.gain.value = laut; q.connect(gg); gg.connect(g); q.start(z, .06 + Math.random() * (buf.duration - 1)); quellen.push(q); return gg; };
            diese.echtG = schleife(bg, 0.0001); diese.echtG.gain.setTargetAtTime(.95, z, .8);
            if (bs){ diese.echtS = schleife(bs, 0.0001); }
            // künstliches Rauschen und Gemurmel ausblenden
            g1.gain.setTargetAtTime(0.0001, z, .8); g2.gain.setTargetAtTime(0.0001, z, .8); spannungsG.gain.setTargetAtTime(0.0001, z, .8);
            diese.echt = true;
          });
          // Gemurmel: kurze Stimmfetzen aus der Menge
          babbelT = setInterval(() => {
            if (!ok() || !menge || menge.echt) return;
            const z = ctx.currentTime;
            for (let i = 0; i < 2; i++){
              const v = ['o', 'a', 'e', 'u'][(Math.random() * 4) | 0], fr = VOKAL[v][1] * (.8 + Math.random() * .5);
              rausch(z + Math.random() * .08, .12 + Math.random() * .25, 'bandpass', fr, 3 + Math.random() * 4, .012 + Math.random() * .018 + menge.spannung * .02, menge.g);
            }
            if (Math.random() < .012) fanPfiff(z, .03, menge.g);
          }, 90);
          // Fangesänge: Klatsch-Rhythmus mit Trommel, ab und zu ein langgezogener Chor
          chantT = setInterval(() => {
            if (!ok() || !menge || menge.echt || Math.random() < .35) return;
            const z = ctx.currentTime + .05;
            if (Math.random() < .6){
              // "Bum – bum – bum-bum-bum" (Klatschen + Trommel)
              [0, .55, 1.1, 1.38, 1.66].forEach((d, i) => { klatschen(z + d, .09, menge.g); trommel(z + d, .22, menge.g); });
              [0, .55, 1.1, 1.38, 1.66].forEach(d => { klatschen(z + 2.2 + d, .08, menge.g); trommel(z + 2.2 + d, .2, menge.g); });
            } else {
              // Chor: "Ooo-oo-oooh"
              chor('o', z, 1.1, .05, 160, 260, 1.05, 16, menge.g);
              chor('o', z + 1.15, .9, .05, 180, 300, .98, 16, menge.g);
              chor('a', z + 2.1, 1.6, .055, 170, 280, .92, 16, menge.g);
            }
          }, 9000);
        },
        // 0 = Ruhe, 1 = Ball kurz vor dem Tor: Menge wird lauter und heller
        spannung(x){
          if (!menge || !ok()) return;
          x = Math.max(0, Math.min(1, x));
          if (Math.abs(x - menge.spannung) < .04) return;
          menge.spannung = x;
          const t = ctx.currentTime;
          if (menge.echt){
            menge.echtS && menge.echtS.gain.setTargetAtTime(x * 1.3, t, .4);
            menge.echtG && menge.echtG.gain.setTargetAtTime(.95 + x * .25, t, .45);
            return;
          }
          menge.spannungsG.gain.setTargetAtTime(x * .16, t, .35);
          menge.f3.frequency.setTargetAtTime(1100 + x * 900, t, .4);
          menge.g2.gain.setTargetAtTime(.1 + x * .06, t, .5);
        },
        pfiff(anzahl){
          if (!ok()) return;
          for (let i = 0; i < anzahl; i++){
            const t = ctx.currentTime + i * .55, lang = anzahl === 3 && i === 2 ? .9 : .35;
            const o = ctx.createOscillator(), g = ctx.createGain(), tr = ctx.createOscillator(), tg = ctx.createGain();
            o.frequency.value = 2650; tr.frequency.value = 28; tg.gain.value = 120; tr.connect(tg); tg.connect(o.frequency);
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .02); g.gain.setValueAtTime(.16, t + lang - .05); g.gain.exponentialRampToValueAtTime(0.0001, t + lang);
            o.connect(g); g.connect(master); o.start(t); tr.start(t); o.stop(t + lang + .05); tr.stop(t + lang + .05);
          }
        },
        schuss(kraft){
          if (!isFinite(kraft)) kraft = .6;
          if (!ok()) return; const t = ctx.currentTime;
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + .08);
          g.gain.setValueAtTime(.5 * kraft, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .12); o.connect(g); g.connect(master); o.start(t); o.stop(t + .15);
          rausch(t, .05, 'bandpass', 1800, 1, .18 * kraft);
        },
        pfosten(){ if (!ok()) return; const t = ctx.currentTime;
          [1180, 1770].forEach(fq => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = fq; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .5); o.connect(g); g.connect(master); o.start(t); o.stop(t + .55); }); },
        rutschen(){ if (!ok()) return; rausch(ctx.currentTime, .35, 'bandpass', 900, .8, .12); },
        // knappe Chance: die ganze Menge "Ohhhhh"
        oh(){
          if (!ok()) return;
          if (TOR_DRAMA_AN){
            this.torVorladen();
            const jetzt = ctx.currentTime;
            if (this._ohT && jetzt - this._ohT < 2) return;   // Pfosten + knapp vorbei nicht doppelt übereinander
            this._ohT = jetzt;
            const bus = this.torBus();
            const los = b => { if (!b){ this.ohSynth(); return; } const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b; g.gain.value = .85; q.connect(g); g.connect(bus); q.start(ctx.currentTime + .02); };
            if (this._dramaB) los(this._dramaB); else if (this._dramaP) this._dramaP.then(los); else this.ohSynth();
            return;
          }
          this.ohSynth();
        },
        ohSynth(){
          if (!ok()) return; const t = ctx.currentTime + .03;
          chor('o', t, 2.1, .45, 120, 240, .82, 22);
          chor('o', t + .05, 1.9, .25, 220, 380, .8, 12);
          rausch(t, 1.8, 'bandpass', 600, .6, .1);
        },
        // echte Stadion-Aufnahme beim Tor (vorab dekodiert, damit sie sofort startet)
        torVorladen(){
          if (!ctx || this._torP) return;
          this._torP = fetch(TOR_JUBEL).then(r => r.arrayBuffer()).then(ab => new Promise(okk => ctx.decodeAudioData(ab, b => { this._torB = b; okk(b); }, () => okk(null)))).catch(() => null);
          if (TOR_DRAMA_AN){
            const dek64 = (url, fertig) => new Promise(okk => { try {
              fetch(url).then(r => r.arrayBuffer()).then(ab => ctx.decodeAudioData(ab, b => { fertig(b); okk(b); }, () => okk(null))).catch(() => okk(null));
            } catch(e){ typeof __scWarn==='function'&&__scWarn(e); okk(null); } });
            if (!this._dramaP) this._dramaP = dek64(TOR_DRAMA, b => { this._dramaB = b; });
            if (!this._cheerP) this._cheerP = dek64(TOR_CHEER, b => { this._cheerB = b; });
          }
        },
        torBus(){
          if (!this._torBus){ this._torBus = ctx.createDynamicsCompressor(); this._torBus.threshold.value = -10; this._torBus.ratio.value = 6; const mk = ctx.createGain(); mk.gain.value = 2.0; this._torBus.connect(mk); mk.connect(ctx.destination); }
          return this._torBus;
        },
        // Dein Tor = Tor-Jubel (TOR_CHEER), Gegentor = enttäuschte Missed-Chance-Reaktion (TOR_DRAMA). Alter Jubel nur als Rückfall.
        torJubel(laut){
          if (!ok()) return false;
          this.torVorladen();
          const bus = this.torBus();
          const spiele = (b, pegel) => { if (!b) return; const q = ctx.createBufferSource(), g = ctx.createGain(); q.buffer = b;
            g.gain.value = laut * pegel; q.connect(g); g.connect(bus); q.start(ctx.currentTime + .02); };
          const alterJubel = () => { if (this._torB) spiele(this._torB, 1); else this._torP.then(b => spiele(b, 1)); };
          if (TOR_DRAMA_AN){
            const eigen = laut > .8, P = eigen ? this._cheerP : this._dramaP, B = eigen ? this._cheerB : this._dramaB, pegel = eigen ? .9 : 1.4;
            if (P){ const los = b => { if (b) spiele(b, pegel); else alterJubel(); }; if (B) los(B); else P.then(los); return true; }
          }
          alterJubel(); return true;
        },
        // Kulisse reagiert aufs Tor: eigenes Tor = Menge dreht auf, Gegentor = kurz Stille/Raunen
        kulisseSchub(eigen){
          if (!menge || !ok()) return; const m = menge, t = ctx.currentTime;
          m.g.gain.cancelScheduledValues(t);
          m.g.gain.setTargetAtTime(eigen ? 1.5 : .55, t, .25);
          setTimeout(() => { try { if (menge === m) m.g.gain.setTargetAtTime(1, ctx.currentTime, eigen ? 2.2 : 1.4); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, eigen ? 6500 : 2500);
        },
        jubel(gross){ if (!ok()) return; const t = ctx.currentTime;
          try { this.kulisseSchub(gross); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
          // Tor: echte Jubel-Aufnahme (eigenes Tor laut, Gegentor etwas leiser)
          if (this.torJubel(gross ? 1.1 : .55)) return;
          if (gross){
            chor('a', t, 3.6, .5, 160, 360, 1.12, 24);
            chor('e', t + .3, 3.2, .2, 250, 450, 1.05, 12);
            const f = rausch(t, 4.2, 'bandpass', 900, .5, .45); f.frequency.exponentialRampToValueAtTime(1500, t + .8);
            rausch(t + .1, 3.4, 'highpass', 2500, .5, .12);
            for (let i = 0; i < 7; i++) fanPfiff(t + .3 + Math.random() * 2.5, .06);
            for (let i = 0; i < 10; i++) klatschen(t + 1.2 + i * .28, .1);
          } else {
            // Gegentor: enttäuschtes Raunen, ein paar Gästefans jubeln
            chor('o', t, 1.6, .12, 110, 200, .85, 14);
            const f = rausch(t + .2, 2.2, 'bandpass', 1100, .6, .14); f.frequency.exponentialRampToValueAtTime(1300, t + .8);
          }
        },
        // Foul: Pfiffe und "Buuuh"
        buh(){ if (!ok()) return; const t = ctx.currentTime + .1;
          chor('u', t, 1.8, .26, 100, 190, .9, 16);
          for (let i = 0; i < 4; i++) fanPfiff(t + Math.random() * 1.2, .05);
        }
      };
    })(),
    spiele(name){ gewuenscht = name; if (ctx) starteStueck(name); },
    umschalten(){
      // erster Tipp auf den Knopf hat die Musik gerade erst gestartet -> nicht gleich wieder ausschalten
      if (!stumm && performance.now() - entsperrtUm < 500){ knoepfeAktualisieren(); return true; }
      stumm = !stumm;
      try { LS81.setItem('silescrow_musik', stumm ? 'aus' : 'an'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      if (init()){
        if (ctx.state === 'suspended') ctx.resume();
        master.gain.setTargetAtTime(stumm ? 0 : LAUT, ctx.currentTime, .08);
        starteStueck(gewuenscht);
      }
      knoepfeAktualisieren();
      return !stumm;
    },
    // kurzer Jingle, wenn der Ladebalken voll ist
    bereit(){
      if (!ctx || stumm) return;
      const t = ctx.currentTime + .02, z = master;
      [[0,72],[.09,76],[.18,79],[.27,84]].forEach(([d, m]) => lead(t + d, m, .16, z, .12));
      lead(t + .36, 88, .5, z, .12);
    },
    klick(){
      if (!ctx || stumm) return;
      lead(ctx.currentTime + .005, 96, .06, master, .05, 'triangle');
    },
    // V2.6: deutlicher Ton beim Auswählen (hoch) bzw. Abwählen (tief) einer Spielerkarte – startet den Ton bei Bedarf selbst
    auswahl(an){
      try { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return; }
      if (stumm) return;
      const t = ctx.currentTime + .01;
      if (an){ lead(t, 79, .09, master, .16, 'triangle'); lead(t + .07, 86, .14, master, .16, 'triangle'); }
      else { lead(t, 74, .09, master, .13, 'triangle'); lead(t + .07, 67, .13, master, .13, 'triangle'); }
    },
    // Sprachsatz des Kommentators: einmal dekodieren, dann über die (bereits freigeschaltete) Audio-Engine abspielen.
    // Die Menge wird währenddessen etwas leiser, damit man die Stimme gut versteht.
    sprache: (() => {
      const cache = {}; let quelle = null, endeZeit = 0, stimmG = null;
      const dekodiere = (id, url) => {
        if (cache[id]) return cache[id];
        return cache[id] = fetch(url).then(r => r.arrayBuffer()).then(ab => new Promise((ok, fehler) => ctx.decodeAudioData(ab, ok, fehler)));
      };
      return {
        spricht(){ return !!ctx && ctx.currentTime < endeZeit; },
        vorladen(id, url){ try { if (ctx && url && !cache[id]) dekodiere(id, url).catch(() => { delete cache[id]; }); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } },   // V6.9: nächsten Satz schon dekodieren, solange der aktuelle läuft
        stopp(){ if (quelle){ try { quelle.stop(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} quelle = null; endeZeit = 0; if (master) master.gain.setTargetAtTime(stumm ? 0 : LAUT, ctx.currentTime, .2); } },
        async spiele(id, url){
          if (!init()) return false;
          if (ctx.state === 'suspended') { try { await ctx.resume(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
          let puffer; try { puffer = await dekodiere(id, url); } catch (e) { return false; }
          this.stopp();
          if (!stimmG){
            // V5.1: Limiter, damit lauter gestellte Sätze nicht übersteuern
            const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .12;
            lim.connect(ctx.destination);
            stimmG = ctx.createGain(); stimmG.gain.value = 1; stimmG.connect(lim);
          }
          // V5.1: jeden Satz auf gleiche Lautstärke (RMS) bringen – leise Sätze werden angehoben
          if (puffer._g === undefined){
            const d = puffer.getChannelData(0); let sum = 0, n = 0;
            for (let i = 0; i < d.length; i += 3){ const v = d[i]; if (Math.abs(v) > .01){ sum += v * v; n++; } }
            const rms = n ? Math.sqrt(sum / n) : .1;
            puffer._g = Math.max(.8, Math.min(4, .22 / rms));
          }
          const q = ctx.createBufferSource(); q.buffer = puffer;
          const sg = ctx.createGain(); sg.gain.value = puffer._g * 1.5; q.connect(sg); sg.connect(stimmG);
          const t = ctx.currentTime + .02; q.start(t); quelle = q; endeZeit = t + puffer.duration;
          master.gain.setTargetAtTime((stumm ? 0 : LAUT) * .3, t, .15);
          master.gain.setTargetAtTime(stumm ? 0 : LAUT, t + puffer.duration, .4);
          q.onended = () => { if (quelle === q) quelle = null; };
          return true;
        }
      };
    })(),
    knoepfeAktualisieren,
    entsperrt(){ return !!ctx && ctx.state === 'running'; },
    get song(){ return probe ? probe.name : null; }, get songsGeladen(){ return Object.keys(puffer); },
    // Versuch, die Musik sofort ohne Fingertipp zu starten (klappt, wenn der Browser es erlaubt)
    versuche(){
      return new Promise(fertig => {
        if (!init()) return fertig(false);
        starteStueck(gewuenscht);
        const p = ctx.resume ? ctx.resume() : null;
        let erledigt = false;
        const ende = ok => { if (!erledigt){ erledigt = true; fertig(ok); } };
        if (p && p.then) p.then(() => ende(ctx.state === 'running')).catch(() => ende(false));
        setTimeout(() => ende(ctx.state === 'running'), 350);
      });
    }
  };
})();