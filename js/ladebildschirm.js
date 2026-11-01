/* Silescrow Cup V 4.2 – js/ladebildschirm.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */



// ===== Ladesimulation: Balken füllt sich, der Ball rollt an der Kante mit =====
const fuellung = document.getElementById('fuellung');
const ball = document.getElementById('ball');
const ballDreh = document.getElementById('ballDreh');
const balken = document.querySelector('.balken');
const status = document.getElementById('status');
const weiter = { classList:{add(){},remove(){}}, textContent:'' };  // Knopf entfällt: es geht automatisch weiter

// Lade-Texte nacheinander (Schwelle in Prozent)
const schritte = [
  [0,  'Rasen wird gemäht …'],
  [22, 'Tornetze werden gespannt …'],
  [45, 'Ball wird aufgepumpt …'],
  [68, 'Spieler schnüren die Schuhe …'],
  [88, 'Schiedsrichter pfeift sich warm …']
];
const DAUER = 4200;           // Gesamtdauer in ms (ruhiges Tempo)
let start = null, fertig = false;

function setze(p){
  const innen = balken.clientWidth - 10;               // 5 px Rand links und rechts
  const breite = Math.max(0, innen * p / 100);
  fuellung.style.width = breite + 'px';
  ball.style.left = (5 + breite) + 'px';
  // Abrollen: Drehwinkel passend zur zurückgelegten Strecke
  const umfang = Math.PI * (ball.clientWidth || 60);
  ballDreh.setAttribute('transform', 'rotate(' + (breite / umfang * 360) + ' 50 50)');
  balken.setAttribute('aria-valuenow', Math.round(p));
  const text = schritte.filter(s => p >= s[0]).pop()[1];
  if (!fertig && status.textContent !== text) status.textContent = text;
}

function tick(t){
  if (start === null) start = t;
  const x = Math.min(1, (t - start) / DAUER);
  // leicht stockender Verlauf, damit es nach echtem Laden aussieht
  const p = 100 * (x - Math.sin(x * Math.PI * 4) * 0.035 * (1 - x));
  setze(Math.max(0, Math.min(100, p)));
  if (x < 1) requestAnimationFrame(tick); else bereit();
}

function bereit(){
  fertig = true;
  setze(100);
  status.textContent = 'Bereit zum Anpfiff!';
  musik.bereit();
  status.classList.add('bereit');
  const pk = document.getElementById('ladePokal'); pk && pk.classList.add('voll');
  // V7.6: wieder automatisch weiter ins Hauptmenü (ohne „Tippen zum Start“)
  setTimeout(() => { if (!document.getElementById('laden').hidden) zeigeMenue(); }, 900);
}



addEventListener('resize', () => { if (fertig) setze(100); });   // beim Drehen den vollen Balken neu ausmessen
try { const fq = document.querySelector('#laden .qfigur'), fo = document.querySelector('#laden .figur img'); if (fq && fo) fq.src = fo.src; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
document.getElementById('laden').addEventListener('pointerup', e => { if (!e.target.closest('.vollbild') && typeof vollbildAn === 'function') vollbildAn(); });
document.getElementById('laden').addEventListener('click', e => { const l = document.getElementById('laden'); if (fertig && !e.target.closest('.vollbild') && !l.hidden) zeigeMenue(); });
// Vollbild automatisch beim Spielstart (Browser erlauben das nur direkt nach einem Tippen)
// V3.18: doppelte (tote) Definition von vollbildAn entfernt – es gilt die Fassung weiter unten.
document.addEventListener('click', e => {
  const k = e.target.closest && e.target.closest('#start, #tLos, #nochmal, #turnierWeiter');
  if (k && !k.disabled) vollbildAn();
}, true);
// Neustart des Ladebildschirms (z. B. nach BEENDEN im Menü)
// V5.0: Leistungstest im Ladebildschirm – misst Bildwiederholrate (Hz) und wie schnell das Handy ein typisches Spielbild zeichnet
window.LEISTUNG = (() => { try { return JSON.parse(LS81.getItem('sc_leistung') || 'null'); } catch (e) { return null; } })();
function leistungMessen(){
  if (window.__leistungLaeuft) return; window.__leistungLaeuft = true;
  const zeiten = []; let letzte = 0, n = 0;
  const hzMessen = t => { if (letzte) zeiten.push(t - letzte); letzte = t; if (++n < 45) requestAnimationFrame(hzMessen); else weiter2(); };
  requestAnimationFrame(hzMessen);
  function weiter2(){
    try {
      zeiten.sort((a, b) => a - b); const med = zeiten[(zeiten.length / 2) | 0] || 16.7, hz = Math.round(1000 / med);
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 432; const g = cv.getContext('2d');
      const bild = document.createElement('canvas'); bild.width = 64; bild.height = 96; { const b = bild.getContext('2d'); b.fillStyle = '#e8343c'; b.fillRect(8, 30, 48, 50); b.fillStyle = '#f2c9a0'; b.beginPath(); b.arc(32, 18, 16, 0, 7); b.fill(); }
      const runde = () => {
        g.fillStyle = '#4caf50'; g.fillRect(0, 0, 960, 432);
        g.strokeStyle = '#fff'; g.lineWidth = 2; for (let i = 0; i < 220; i++){ g.beginPath(); g.moveTo((i * 37) % 960, (i * 13) % 432); g.lineTo((i * 37 + 40) % 960, (i * 13 + 9) % 432); g.stroke(); }
        g.lineCap = 'round';
        for (let f = 0; f < 26; f++){ const x = 30 + f * 35, y = 200 + (f % 5) * 30;
          g.save(); g.translate(x, y);
          for (let l = 0; l < 8; l++){ g.strokeStyle = l % 2 ? '#111' : '#2a64e0'; g.lineWidth = 7 - (l % 2) * 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, 14 + l, l * 2 - 6, 30); g.stroke(); }
          for (let e = 0; e < 4; e++){ g.fillStyle = e % 2 ? '#000' : '#f2c9a0'; g.beginPath(); g.ellipse(0, -20 + e * 6, 9, 6, 0, 0, 7); g.fill(); }
          g.drawImage(bild, -16, -60, 32, 48); g.restore(); }
        g.getImageData(0, 0, 1, 1);   // auf das Ende des Zeichnens warten
      };
      runde(); runde();
      const ms = []; for (let i = 0; i < 8; i++){ const t0 = performance.now(); runde(); ms.push(performance.now() - t0); }
      ms.sort((a, b) => a - b); const score = +ms[3].toFixed(2);
      // Startstufe für AUTO (0 = 1080p … 8 = 312p); im Spiel wird jede Sekunde nachgeregelt
      const stufe = score < 3 ? 0 : score < 5 ? 1 : score < 7 ? 2 : score < 10 ? 4 : score < 14 ? 5 : 6;
      window.LEISTUNG = { hz, score, stufe, t: Date.now() };
      try { LS81.setItem('sc_leistung', JSON.stringify(window.LEISTUNG)); } catch (e) {}
    } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  }
}
function starteLaden(){
  try { setTimeout(leistungMessen, 700); } catch (e) {}   // V5.0
  // V3.20 Fix: $ ist beim ersten Aufruf noch nicht definiert -> der Ladebildschirm brach nach ~1,2 s ab. Daher direkt getElementById.
  window.__ladenHaupt = true;
  const ladeOverlay = document.getElementById('laden');
  ladeOverlay.hidden = false;
  ladeOverlay.style.display = '';
  ladeOverlay.style.visibility = '';
  ladeOverlay.style.pointerEvents = '';
  musik.spiele('laden');
  start = null; fertig = false;
  status.classList.remove('bereit');
  const pk0 = document.getElementById('ladePokal'); pk0 && pk0.classList.remove('voll');
  setze(0);
  weiter.classList.remove('da');
  // Musik sofort starten (blockiert der Browser das, startet sie beim ersten Antippen)
  if (!musik.entsperrt()) musik.versuche();
  ladenLos();
}
function ladenLos(){
  status.textContent = schritte[0][1];
  setTimeout(() => requestAnimationFrame(tick), 500);
}

// V3.16: Vollbild-Fix – doppelte Button-Handler entfernt. V3.x hatte den Vollbild-Toggle mehrfach registriert; ein Tap konnte dadurch direkt wieder aus dem Vollbild herausgehen.
// Wichtig: requestFullscreen wird ohne await und direkt aus der Benutzeraktion
// ausgelöst. Das ist auf Android/Chrome für lokale HTML-Dateien entscheidend.
function vollbildAn(){
  try {
    const d = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const req = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen ? d.webkitRequestFullscreen() : null;
    if (req && req.then) req.then(() => {
      try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      try { skaliere(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    }).catch(() => {});
  } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
}

function vollbildUmschalten(){
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
      return;
    }
    vollbildAn();
  } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
}

function vollbildIconAktualisieren(){
  const aktiv = !!(document.fullscreenElement || document.webkitFullscreenElement);
  document.querySelectorAll('#vollbild,#mVollbild,#spielVollbild').forEach(b => {
    if (!b) return;
    b.setAttribute('aria-label', aktiv ? 'Vollbild beenden' : 'Vollbild');
    b.title = aktiv ? 'Vollbild beenden' : 'Vollbild';
  });
}
function vollbildAenderung(){
  vollbildIconAktualisieren();
  try { skaliere(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  try { if (typeof resize === 'function') resize(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
}
document.addEventListener('fullscreenchange', vollbildAenderung);
document.addEventListener('webkitfullscreenchange', vollbildAenderung);

const _vfStart = document.getElementById('vollbild');
if (_vfStart) _vfStart.addEventListener('click', vollbildUmschalten);
const _vfMenu = document.getElementById('mVollbild');
if (_vfMenu) _vfMenu.addEventListener('click', vollbildUmschalten);
const _vfGame = document.getElementById('spielVollbild');
if (_vfGame) _vfGame.addEventListener('click', vollbildUmschalten);

// Wie in den älteren Versionen: Tippen auf den Ladebildschirm versucht sofort
// den Vollbildmodus, noch bevor weitere UI-Aktionen ausgeführt werden.
document.getElementById('laden').addEventListener('pointerup', e => {
  if (!e.target.closest('.vollbild') && typeof vollbildAn === 'function') vollbildAn();
});

// Auch beim eigentlichen Spielstart bleibt der Vollbildaufruf direkt in der
// Benutzeraktion.
document.addEventListener('click', e => {
  const k = e.target.closest && e.target.closest('#start, #tLos, #nochmal, #turnierWeiter');
  if (k && !k.disabled) vollbildAn();
}, true);

// Logo passend zur verfügbaren Breite skalieren (egal welche Schrift geladen ist)
const logo = document.querySelector('.logo');
function logoAnpassen(){
  const quer = matchMedia('(orientation:landscape) and (max-height:560px)').matches;
  const ziel = quer ? innerWidth * 0.6 : Math.min(innerWidth * 0.92, 720);
  logo.style.fontSize = '100px';
  const breite = logo.scrollWidth;
  logo.style.fontSize = Math.min(quer ? innerHeight * 0.3 : 150, 100 * ziel / breite) + 'px';
}
logoAnpassen();
try { document.fonts && document.fonts.ready.then(logoAnpassen); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
document.fonts && document.fonts.ready.then(logoAnpassen);
addEventListener('resize', () => { logoAnpassen(); if (fertig) setze(100); });
// Start robust: der Ladebildschirm startet immer, auch wenn optionale Audio-/UI-Elemente fehlen.
try { starteLaden(); } catch (e) {
  try {
    const l = document.getElementById('laden');
    if (l) { l.hidden = false; l.style.display = ''; }
    setTimeout(() => { try { zeigeMenue(); } catch(_){typeof __scWarn==='function'&&__scWarn(_)} }, 1200);
  } catch(_){typeof __scWarn==='function'&&__scWarn(_)}
}