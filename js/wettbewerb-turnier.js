/* Silescrow Cup V 4.2 – js/wettbewerb-turnier.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */


// V5.0: Kommentator-Zuordnungsmenü entfernt (Zuordnung ist fest eingebaut, Kommentator läuft weiter)


// =====================================================================
// TURNIER: 7 Teams à 4 Spieler (alle 28) – Viertelfinale, Halbfinale, Finale
// Karten wie in echt: Rot oder Gelb-Rot = Sperre im nächsten Spiel; zwei Gelbe in zwei
// verschiedenen Spielen = Sperre im nächsten Spiel. Ersatz kommt aus ausgeschiedenen Teams.
// =====================================================================
const TURNIER = (() => {
  let t = null;
  const $t = id => document.getElementById(id);
  const KZ = {"Deutschland":"DEU","Türkei":"TÜR","Spanien":"SPA","Frankreich":"FRA","Italien":"ITA","England":"ENG","Niederlande":"NIE","Portugal":"POR","Belgien":"BEL","Kroatien":"KRO","Österreich":"ÖST","Schweiz":"SCH","Dänemark":"DÄN","Polen":"POL","Brasilien":"BRA","Argentinien":"ARG","Uruguay":"URU","Kolumbien":"KOL","Mexiko":"MEX","USA":"USA","Japan":"JAP","Südkorea":"SÜD","Marokko":"MAR","Senegal":"SEN","Nigeria":"NIG","Ägypten":"ÄGY","Australien":"AUS","Saudi-Arabien":"SAU","Iran":"IRA","Kanada":"KAN","Chile":"CHI","Costa Rica":"COS"};
  const kurzP = l => KZ[l[0]] || l[0].slice(0, 3).toUpperCase();
  // V10.1: Mit MEIN SUPERTEAM steht vor deinem Team (S), z. B. (S) TÜR – die Nation selbst bleibt TÜR
  const kurz = l => { const o = t && t.opt && t.opt.superteam && t.opt.land ? (Array.isArray(t.opt.land) ? t.opt.land[0] : t.opt.land) : null; return (o && l && l[0] === o ? '(S) ' : '') + kurzP(l); };
  const DB = i => PLAYER_DATABASE[i];
  const timer = [];
  const spaeter = (f, ms) => timer.push(setTimeout(f, ms));
  const stopp = () => { while (timer.length) clearTimeout(timer.pop()); };
  const WNAME = { klar: 'trocken', sonne: 'Sonne', regen: 'Regen', schnee: 'Schnee' };
  function skalieren(){
    const s = Math.min(innerWidth / 1120, innerHeight / 600);
    $t('tFlaeche').style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  addEventListener('resize', () => { if (!$t('turnier').hidden) skalieren(); });

  const teamNr = land => t.teams.indexOf(land);
  // Aufstellung eines Teams fürs nächste Spiel: gesperrte Spieler durch Nachrücker ersetzen
  function aufstellung(k){
    const leih = (t.leih[k] || {});
    return t.kader[k].map(i => t.gesperrt.has(i) ? (leih[i] != null ? leih[i] : null) : i).filter(i => i != null);
  }
  function info(text, gross){ const i = $t('tInfo'); i.textContent = text; i.classList.toggle('gross', !!gross); i.classList.remove('an'); void i.offsetWidth; i.classList.add('an'); }
  function knoepfe(los, menue){ $t('tLos').textContent = los || ''; $t('tLos').hidden = !los; { const ta = $t('tAuf'); if (ta) ta.hidden = !(los && /ANPFIFF/.test(los)); } $t('tMenue').textContent = menue || 'ZURÜCK'; document.querySelector('.t-knoepfe').classList.add('an'); }
  function chip(id, land){
    const c = $t(id);
    c.className = 't-chip' + (land && teamNr(land) === 0 ? ' du' : '');
    c.innerHTML = land ? flaggeHTML(land[0]) + '<span>' + kurz(land) + '</span>' : '<span class="leer">?</span>';
    if (land){ void c.offsetWidth; c.classList.add('neu'); }
  }
  function aufsteigen(vonId, zuId, land, dauer = 900){
    const flaeche = $t('tFlaeche'), von = $t(vonId), zu = $t(zuId);
    const fb = flaeche.getBoundingClientRect(), sk = fb.width / 1120;
    const a = von.getBoundingClientRect(), b = zu.getBoundingClientRect();
    const klon = von.cloneNode(true); klon.removeAttribute('id'); klon.classList.add('t-flug', 'an'); klon.classList.remove('raus', 'weiter');
    klon.style.left = (a.left - fb.left) / sk + 'px'; klon.style.top = (a.top - fb.top) / sk + 'px';
    flaeche.appendChild(klon);
    const dx = ((b.left + b.width / 2) - (a.left + a.width / 2)) / sk, dy = ((b.top + b.height / 2) - (a.top + a.height / 2)) / sk;
    const an = klon.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx * .5 + 'px,' + (dy * .5 - 60) + 'px) scale(1.12)' },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.85)', opacity: .25 }], { duration: dauer, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
    an.onfinish = () => {
      klon.remove();
      if (zuId === 'tPokal') $t('tPokal').innerHTML = '🏆<div class="t-siegerfl">' + flaggeHTML(land[0]) + '</div>';
      else if (zuId === 'tF1' || zuId === 'tF2') chip(zuId, land);
      else karte(zuId, land, { rechts: $t(zuId).dataset.links === '0', zeigen: true });
      musik.klick && musik.klick();
    };
  }
  function konfetti(){
    const k = $t('tKonfetti'); k.innerHTML = '';
    const farben = ['#ffe234','#ff3fa4','#3fe0ff','#5df07a','#ff8a1f','#ffffff'];
    for (let i = 0; i < 100; i++){ const e = document.createElement('i'); e.style.left = Math.random() * 1120 + 'px'; e.style.background = farben[i % farben.length];
      e.style.animationDuration = (2.2 + Math.random() * 2.4) + 's'; e.style.animationDelay = (Math.random() * 1.6) + 's'; k.appendChild(e); }
  }
  const elfmeter = () => { let a = 3 + Math.floor(Math.random() * 3), b = 3 + Math.floor(Math.random() * 3); if (a === b) Math.random() < .5 ? a++ : b++; return [a, b]; };
  function simulieren(i, j){
    const st = k => { const a = aufstellung(k); return a.reduce((s, x) => s + DB(x).rating, 0) / Math.max(1, a.length) + (k === 0 ? 0 : landBonus(t.teams[k], t.seed || (t.seed = (Math.random() * 1e9) | 0))); };   // V8.0: Länderbonus wie im echten Spiel
    const v = (st(i) - st(j)) / 40;
    const a = Math.max(0, Math.round(Math.random() * 3 + v)), b = Math.max(0, Math.round(Math.random() * 3 - v));
    return { a, b, ie: a === b ? elfmeter() : null };
  }
  const gewinnt = e => e.ie ? e.ie[0] > e.ie[1] : e.a > e.b;
  const ieText = e => e.ie ? e.ie[0] + ':' + e.ie[1] + ' i.E.' : '';
  function sperrenAbsitzen(teams){
    for (const k of teams){ for (const i of t.kader[k]) if (t.gesperrt.has(i) && t.sperreVor.has(i)) t.gesperrt.delete(i); delete t.leih[k]; }
  }
  // freie Nachrücker: Spieler ausgeschiedener Teams, nicht gesperrt, nicht schon verliehen
  function nachruecker(){
    const verliehen = new Set(Object.values(t.leih).flatMap(m => Object.values(m)));
    return [...t.raus].flatMap(k => t.kader[k]).filter(i => !t.gesperrt.has(i) && !verliehen.has(i) && !DB(i).stufe).sort((a, b) => DB(b).rating - DB(a).rating);
  }
  // KI-Teams holen automatisch den stärksten freien Nachrücker
  function kiErsatz(k){
    for (const i of t.kader[k]) if (t.gesperrt.has(i)){ const frei = nachruecker(); if (!frei.length) continue; t.leih[k] = t.leih[k] || {}; t.leih[k][i] = frei[0]; vergebeNr(frei[0], k); }
  }
  function vergebeNr(i, k){
    const belegt = new Set(aufstellung(k).map(x => t.nr[x]).filter(Boolean));
    const vor = ({ DF: [4, 5, 3, 2, 15], MF: [8, 6, 10, 7, 14], ST: [9, 11, 7, 10, 19], TW: [12, 1] }[DB(i).role] || [13]);
    if (!t.nr[i] || belegt.has(t.nr[i])) t.nr[i] = vor.find(x => !belegt.has(x)) || [...Array(99)].map((_, x) => x + 1).find(x => !belegt.has(x));
  }

  function ersatzWaehlen(fehlt, weiter){
    const p = DB(fehlt), frei = nachruecker();
    $t('tErsatzTitel').textContent = 'ERSATZ FÜR ' + p.name;
    $t('tErsatzText').textContent = p.name + ' ist gesperrt. Wähle einen Nachrücker aus einem ausgeschiedenen Team (nur normale Spieler, keine Bronze-, Silber- oder Goldspieler) – er spielt dieses Spiel für dich.';
    const r = $t('tErsatzRaster'); r.innerHTML = '';
    frei.forEach((i, n) => {
      const d = DB(i), b = document.createElement('button'); b.type = 'button'; b.className = 't-ersatzkarte';
      b.style.animation = 'tKarteRein .4s ' + (n * .04) + 's cubic-bezier(.3,1.4,.5,1) both';
      b.innerHTML = '<img src="' + BILDER[d.bild] + '" alt=""><span class="w">' + d.rating + '</span><span>' + d.name + '</span>';
      b.onclick = () => { t.leih[0] = t.leih[0] || {}; t.leih[0][fehlt] = i; vergebeNr(i, 0); $t('tErsatz').hidden = true; musik.klick && musik.klick(); weiter(); };
      r.appendChild(b);
    });
    $t('tErsatz').hidden = false;
  }
  // Konferenz: Ergebnisse der Parallelspiele vorab festlegen, Tore über die Spielzeit verteilen
  function konferenzPlanen(paare){
    return paare.map(([i, j]) => {
      const e = simulieren(i, j), tore = [];
      for (let n = 0; n < e.a; n++) tore.push({ t: 8 + Math.random() * (240 - 16), team: 0 });
      for (let n = 0; n < e.b; n++) tore.push({ t: 8 + Math.random() * (240 - 16), team: 1 });
      tore.sort((x, y) => x.t - y.t);
      return { i, j, e, a: t.teams[i], b: t.teams[j], tore };
    });
  }
  function kartenAuswerten(log){
    const zeilen = [];
    const platzverweis = new Set(log.filter(e => e.typ === 'rot' || e.typ === 'gelbrot').map(e => e.idx));
    for (const e of log){
      if (e.typ === 'rot') zeilen.push({ idx: e.idx, karten: ['r'], text: 'Rote Karte – im nächsten Spiel gesperrt', sperre: true });
      else if (e.typ === 'gelbrot') zeilen.push({ idx: e.idx, karten: ['g', 'r'], text: 'Gelb-Rot – im nächsten Spiel gesperrt', sperre: true });
      else if (e.typ === 'gelb' && !platzverweis.has(e.idx)){
        t.gelb[e.idx] = (t.gelb[e.idx] || 0) + 1;
        if (t.gelb[e.idx] >= 2){ t.gelb[e.idx] = 0; zeilen.push({ idx: e.idx, karten: ['g', 'g'], text: '2. Gelbe Karte im Turnier – im nächsten Spiel gesperrt', sperre: true }); }
        else zeilen.push({ idx: e.idx, karten: ['g'], text: 'Gelbe Karte (1 von 2) – beim nächsten Gelb gesperrt', sperre: false });
      }
    }
    return zeilen;
  }
  function sperrenZeigen(zeilen, weiter){
    if (!zeilen.length) return weiter();
    const liste = $t('tSperrListe'); liste.innerHTML = '';
    zeilen.forEach((z, n) => {
      const d = DB(z.idx), el = document.createElement('div'); el.className = 't-sperrzeile'; el.style.animationDelay = (n * .45) + 's';
      el.innerHTML = '<img class="sperrkopf" src="' + BILDER[d.bild] + '" alt=""><div class="kartenpaar">' + z.karten.map(k => '<span class="kk ' + k + '"></span>').join('') + '</div>' +
        '<div class="txt"><b>' + d.name + '</b><span>' + z.text + '</span></div>' + (z.sperre ? '<span class="stempel" style="animation-delay:' + (n * .45 + .5) + 's">GESPERRT</span>' : '');
      liste.appendChild(el);
      if (z.sperre) spaeter(() => musik.sfx && musik.sfx.pfiff(1), n * 450 + 500);
    });
    $t('tSperre').hidden = false;
    $t('tSperreWeiter').onclick = () => { $t('tSperre').hidden = true; weiter(); };
  }


  // =====================================================================
  // 16 NATIONEN: Achtelfinale → Viertelfinale → Halbfinale → Finale
  // =====================================================================
  const RUNDEN = ['ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'];
  const ZEILE = 49, Y0 = 118, KH = 40;
  const SPALTE = { 0: [12, 958, 150], 1: [178, 802, 140], 2: [334, 646, 140] };
  // Position einer Karte: Runde r, Platz s (links: erste Hälfte, rechts: zweite Hälfte)
  function lage(r, s){
    const n = 16 >> r, halb = n / 2, links = s < halb, idx = links ? s : s - halb, g = 1 << r;
    const cy = Y0 + KH / 2 + (idx * g + (g - 1) / 2) * ZEILE;
    const [xl, xr, w] = SPALTE[r];
    return { x: links ? xl : xr, y: cy - KH / 2, w, cy, links };
  }
  const sid = (r, s) => r >= 3 ? 'tF' + (s + 1) : 'b' + r + '_' + s;
  function karte(id, land, opt = {}){
    const el = $t(id); if (!el) return;
    if (land == null){ el.className = 't-team leer' + (opt.zeigen ? ' an' : '') + (opt.rechts ? ' rechts' : ''); el.innerHTML = '?'; el.onclick = null; return; }
    const k = teamNr(land), istDu = k === 0;
    el.className = 't-team' + (opt.rechts ? ' rechts' : '') + (istDu ? ' du' : '') + (opt.zeigen ? ' an' : '');
    const gesperrtImTeam = t.kader[k].some(i => t.gesperrt.has(i));
    el.innerHTML = flaggeHTML(land[0]) + '<span class="nm">' + kurz(land) + '</span><span class="tr"></span>' + (gesperrtImTeam ? '<span class="sperr" title="Gesperrter Spieler"></span>' : '');
    el.onclick = () => info(land[0] + ': ' + aufstellung(k).map(i => '#' + (t.nr[i] || '?') + ' ' + DB(i).name + (DB(i).stufe === 'gold' ? ' ★' : DB(i).stufe === 'silber' ? ' ☆' : DB(i).stufe === 'bronze' ? ' ◇' : '')).join(', '));
  }
  function tore(id, n, zusatz){ const tr = $t(id) && $t(id).querySelector('.tr'); if (!tr) return; tr.innerHTML = n + (zusatz ? '<small>' + zusatz + '</small>' : ''); tr.classList.add('an'); }
  function zeigeDein(id){
    const d = $t('tDein'), el = $t(id); if (!el) return;
    d.style.left = (parseFloat(el.style.left) + parseFloat(el.style.width || 150) - 70) + 'px';
    d.style.top = (parseFloat(el.style.top || 0) - 14) + 'px';
    if (id.startsWith('tF')){ d.style.left = '505px'; d.style.top = '160px'; }
    d.classList.remove('an'); void d.offsetWidth; d.classList.add('an');
  }
  // Baum aufbauen (Karten, Linien, Finale)
  function baumZeichnen(){
    const b = $t('tBaum'); b.innerHTML = '';
    let svg = '<svg class="t-linien" viewBox="0 0 1120 600" aria-hidden="true">';
    for (let r = 0; r < 3; r++){
      const n = 16 >> r;
      for (let s = 0; s < n; s++){
        const a = lage(r, s), m = Math.floor(s / 2);
        let zx, zy;
        if (r < 2){ const z = lage(r + 1, m); zx = a.links ? z.x : z.x + z.w; zy = z.cy; }
        else { zx = a.links ? 486 : 634; zy = 300 + (a.links ? 0 : 0); }
        const ax = a.links ? a.x + a.w : a.x, mx = (ax + zx) / 2;
        svg += '<path id="L' + r + '_' + s + '" d="M' + ax + ' ' + a.cy + ' H' + mx + ' V' + zy + ' H' + zx + '"/>';
      }
    }
    b.insertAdjacentHTML('beforeend', svg + '</svg>');
    for (let r = 0; r < 3; r++){
      const n = 16 >> r;
      for (let s = 0; s < n; s++){
        const a = lage(r, s), el = document.createElement('div');
        el.id = sid(r, s); el.style.left = a.x + 'px'; el.style.top = a.y + 'px'; el.style.width = a.w + 'px'; el.dataset.links = a.links ? 1 : 0;
        b.appendChild(el);
      }
    }
    [0, 1, 2].forEach(r => { [true, false].forEach(links => {
      const k = document.createElement('div'); k.className = 't-kopf16'; k.textContent = ['ACHTEL', 'VIERTEL', 'HALB'][r] + 'FINALE';
      const [xl, xr, w] = SPALTE[r]; k.style.left = (links ? xl : xr) + 'px'; k.style.width = w + 'px'; b.appendChild(k);
    }); });
  }
  function aufbauen(){
    stopp();
    $t('turnier').hidden = false; skalieren();
    ['tSperre','tErsatz'].forEach(i => $t(i).hidden = true);
    $t('tFinale').classList.remove('an'); $t('tDein').classList.remove('an'); $t('tPokal').classList.remove('sieger'); $t('tPokal').innerHTML = '🏆';
    $t('tInfo').classList.remove('an'); document.querySelector('.t-knoepfe').classList.remove('an'); $t('tKonfetti').innerHTML = '';
    baumZeichnen();
    for (let s = 0; s < 16; s++) karte(sid(0, s), t.teams[t.baum[0][s]], { rechts: s >= 8 });
    for (let r = 1; r < 3; r++) for (let s = 0; s < (16 >> r); s++) karte(sid(r, s), null, { rechts: s >= (8 >> r) });
    chip('tF1', null); chip('tF2', null);
    for (let s = 0; s < 16; s++) spaeter(() => $t(sid(0, s)).classList.add('an'), 200 + s * 70);
    spaeter(() => { for (let r = 1; r < 3; r++) for (let s = 0; s < (16 >> r); s++) $t(sid(r, s)).classList.add('an'); }, 1400);
    spaeter(() => document.querySelectorAll('#tBaum path').forEach(p => p.classList.add('an')), 1600);
    spaeter(() => $t('tFinale').classList.add('an'), 1900);
  }
  // Teams bilden: deine 5 + 15 Nationen à 5 aus allen übrigen Spielern (je ein Torwart, ausgeglichen verteilt)
  function neu(opt){
    const andere = COUNTRY_DATABASE.filter(l => l[0] !== opt.land[0]);
    for (let i = andere.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [andere[i], andere[j]] = [andere[j], andere[i]]; }
    const rest = PLAYER_DATABASE.map((p, i) => i).filter(i => !opt.squad.includes(i));
    const kader = [opt.squad.slice()]; for (let k = 1; k < 16; k++) kader.push([]);
    const tws = rest.filter(i => DB(i).role === 'TW').sort((a, b) => DB(b).rating - DB(a).rating);
    const reihe = [...Array(15)].map((_, k) => k + 1); for (let i = reihe.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
    tws.slice(0, 15).forEach((i, n) => kader[reihe[n]].push(i));
    const feld = rest.filter(i => !kader.some(k => k.includes(i)));
    // V2.63: Jede KI-Mannschaft bekommt genau EINEN Hartspieler (Bronze/Silber/Gold).
    // Die übrigen Plätze werden ausschließlich mit normalen Spielern besetzt.
    kiKaderStufenVerteilen(kader, feld, reihe);
    try { for (let k = 1; k < 16; k++){ const nk = nationKader(andere[k - 1], opt); if (nk && nk.elf.length === TEAM_GROESSE) kader[k] = nk.elf.slice(); } } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V6.0
    const nr = { ...(opt.nummern || {}) };
    kader.slice(1).forEach(k => {
      const belegt = new Set();
      k.slice().sort((a, b) => ((DB(b).role === 'TW') - (DB(a).role === 'TW'))).forEach((i, n) => {
        const vor = n === 0 ? [1] : ({ DF: [4, 5, 3, 2, 15], MF: [8, 6, 10, 7, 14], ST: [9, 11, 7, 10, 19] }[DB(i).role] || [13]);
        const x = vor.find(v => !belegt.has(v)) || [...Array(99)].map((_, v) => v + 1).find(v => !belegt.has(v)); belegt.add(x); nr[i] = x; });
    });
    const plaetze = [0, ...reihe];
    t = { opt, kader, nr, teams: [opt.land, ...andere.slice(0, 15)], baum: [plaetze, [], [], [], []], runde: 0, raus: new Set(),
          gelb: {}, gesperrt: new Set(), sperreVor: new Set(), leih: {},
          wetter: [wetterAuslosen(), wetterAuslosen(), wetterAuslosen(), wetterAuslosen()] };
    if (t.wetter[3].wetter !== 'sonne' && Math.random() < .6){ t.wetter[3].nacht = true; t.wetter[3].anstoss = '20:45'; t.wetter[3].temp = temperatur(t.wetter[3].jz, t.wetter[3].wetter, true); }
    $t('tRunde').textContent = 'TURNIER · 16 NATIONEN';
    aufbauen();
    turnierSpeichern();
    rundeAnsagen(2300);
  }
  // ---- V3.54: Turnier speichern / fortsetzen (Stand zu Beginn der jeweiligen Runde)
  const SAVE_KEY = 'sc_turnier_v1';
  const landIdx = l => l ? COUNTRY_DATABASE.findIndex(x => x[0] === l[0]) : -1;
  const landVon = i => (i != null && i >= 0) ? (COUNTRY_DATABASE[i] || null) : null;
  function turnierSpeichern(){
    try {
      if (!t) return;
      const o = { v: 1, opt: { ...t.opt, land: landIdx(t.opt.land) }, kader: t.kader, nr: t.nr, teams: t.teams.map(landIdx), baum: t.baum, runde: t.runde,
        raus: [...t.raus], gelb: t.gelb, gesperrt: [...t.gesperrt], sperreVor: [...t.sperreVor], leih: t.leih, wetter: t.wetter, erg: t.erg || {},
        halbRaus: (t.halbRaus || []).map(landIdx), finalGegner: landIdx(t.finalGegner), letztes: t.letztes || null };
      LS81.setItem(SAVE_KEY, JSON.stringify(o));
      if (typeof NETZ !== 'undefined' && NETZ.rolle === 'host' && NETZ.partner) NETZ.turnierState(o);
    } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
  }
  function turnierLoeschen(){ try { LS81.removeItem(SAVE_KEY); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } if (typeof NETZ !== 'undefined' && NETZ.rolle === 'host') NETZ.turnierState(null); }
  function turnierLaden(){
    try {
      const r = LS81.getItem(SAVE_KEY); if (!r) return null;
      const o = JSON.parse(r);
      if (!o || o.v !== 1 || !o.opt || !Array.isArray(o.teams) || o.teams.length !== 16 || !Array.isArray(o.baum) || !(o.runde >= 0 && o.runde <= 3)) return null;
      const teams = o.teams.map(landVon); if (teams.some(x => !x)) return null;
      return { opt: { ...o.opt, land: teams[0] }, kader: o.kader, nr: o.nr, teams, baum: o.baum, runde: o.runde, raus: new Set(o.raus || []),
        gelb: o.gelb || {}, gesperrt: new Set(o.gesperrt || []), sperreVor: new Set(o.sperreVor || []), leih: o.leih || {}, wetter: o.wetter, erg: o.erg || {},
        halbRaus: (o.halbRaus || []).map(landVon), finalGegner: landVon(o.finalGegner), letztes: o.letztes || null };
    } catch (e) { typeof __scWarn === 'function' && __scWarn(e); return null; }
  }
  // Bereits gespielte Runden im Baum wieder eintragen (Teams, Tore, Weiter/Raus-Markierung)
  function baumWiederherstellen(){
    const T = t.teams;
    for (let r = 1; r <= Math.min(t.runde, 2); r++) for (let s = 0; s < (16 >> r); s++){
      const k = t.baum[r] && t.baum[r][s]; if (k == null) continue;
      karte(sid(r, s), T[k], { rechts: s >= (8 >> r), zeigen: true });
    }
    if (t.runde >= 3 && t.baum[3]){ chip('tF1', T[t.baum[3][0]]); chip('tF2', T[t.baum[3][1]]); }
    for (let r = 0; r < Math.min(t.runde, 3); r++){
      const erg = (t.erg && t.erg[r]) || [];
      paare(r).forEach(([a, c, s], m) => {
        const e = erg[m]; if (!e) return;
        const sieg = gewinnt(e), idA = sid(r, s), idC = sid(r, s + 1);
        tore(idA, e.a, sieg ? ieText(e) : ''); tore(idC, e.b, !sieg ? ieText(e) : '');
        const w = $t(sieg ? idA : idC), v = $t(sieg ? idC : idA);
        w && w.classList.add('weiter'); v && v.classList.add('raus');
        const lp = $t('L' + r + '_' + (sieg ? s : s + 1)); lp && lp.classList.add('sieg');
      });
    }
  }
  function syncOnline(o){
    // Der Gast übernimmt ausschließlich den veröffentlichten Turnierbaum/-stand.
    try {
      if (!o || o.v !== 1 || !Array.isArray(o.teams) || o.teams.length !== 16 || !Array.isArray(o.baum)) return false;
      LS81.setItem(SAVE_KEY, JSON.stringify(o));
      const x = turnierLaden(); if (!x) return false;
      t = x; $t('turnier').hidden = false; aufbauen(); baumWiederherstellen();
      $t('tLos').hidden = true; if ($t('tAuf')) $t('tAuf').hidden = true;
      $t('tMenue').textContent = 'ZUM SPIEL';
      $t('tMenue').onclick = () => { $t('turnier').hidden = true; };
      return true;
    } catch(e) { typeof __scWarn === 'function' && __scWarn(e); return false; }
  }
  function fortsetzen(){
    const x = turnierLaden(); if (!x) return false;
    t = x;
    $t('tRunde').textContent = 'TURNIER · 16 NATIONEN';
    aufbauen();
    baumWiederherstellen();
    rundeAnsagen(2300);
    return true;
  }
  // V4.1: Online-Cup fortsetzen (Gastgeber + Mitspieler). Gibt true oder einen Fehlertext zurück.
  function fortsetzenOnline(opt){
    const x = turnierLaden(); if (!x) return 'Kein gespeicherter Cup gefunden.';
    if (!x.opt || x.opt.modus !== 'zusammen') return 'Der gespeicherte Cup wurde offline gespielt.';
    // V5.8: Team darf sich geändert haben (z. B. neue Pack-Spieler) – es wird einfach übernommen
    t = x;
    t.kader[0] = opt.squad.slice();
    t.opt = { ...t.opt, squad: opt.squad.slice(), torwart: opt.torwart, menschTorwart: opt.menschTorwart, modus: opt.modus, fernAnzahl: opt.fernAnzahl, plaetze: opt.plaetze, gegnerPlaetze: opt.gegnerPlaetze, nummern: opt.nummern, posi: opt.posi, formation: opt.formation, formSlot: opt.formSlot };
    $t('tRunde').textContent = 'TURNIER · 16 NATIONEN';
    aufbauen();
    baumWiederherstellen();
    turnierSpeichern();   // Baum an den Mitspieler senden
    rundeAnsagen(2300);
    return true;
  }
  const meinPlatz = r => t.baum[r].indexOf(0);
  const gegnerIn = r => { const s = meinPlatz(r); return t.baum[r][s ^ 1]; };
  function rundeAnsagen(verz){
    const r = t.runde, w = t.wetter[r], g = gegnerIn(r);
    spaeter(() => {
      $t('tRunde').textContent = RUNDEN[r];
      zeigeDein(sid(r, meinPlatz(r)));
      const gesp = t.kader[0].filter(i => t.gesperrt.has(i)).map(i => DB(i).name);
      info(RUNDEN[r] + ': ' + kurz(t.teams[0]) + ' gegen ' + kurz(t.teams[g]) + ' · Anstoß ' + w.anstoss + (w.nacht ? ' unter Flutlicht' : '') + (gesp.length ? ' · Gesperrt: ' + gesp.join(', ') + ' → Ersatz wählen' : ''));
    }, verz);
    spaeter(() => knoepfe(RUNDEN[r] + ' ANPFIFF', 'ZURÜCK'), verz + 300);
    $t('tLos').onclick = () => vorSpiel(g, RUNDEN[r], w);
    { const ta = $t('tAuf'); if (ta) ta.onclick = () => { window.__aufDirekt = true; $t('tLos').click(); }; }   // V11.6: AUFSTELLUNG auch im Silescrow Cup
    if (NETZ.rolle === 'host' && NETZ.partner) {
      spaeter(() => { if (t && !$t('turnier').hidden && NETZ.rolle === 'host' && NETZ.partner) $t('tLos').click(); }, verz + 6000);
    }
  }
  function vorSpiel(gegner, runde, w){
    kiErsatz(gegner);
    const offen = t.kader[0].filter(i => t.gesperrt.has(i) && !(t.leih[0] && t.leih[0][i] != null));
    if (offen.length && nachruecker().length) return ersatzWaehlen(offen[0], () => vorSpiel(gegner, runde, w));
    spielen(gegner, runde, w);
  }
  // Paare der aktuellen Runde (Teamnummern)
  function paare(r){ const b = t.baum[r], out = []; for (let s = 0; s < b.length; s += 2) out.push([b[s], b[s + 1], s]); return out; }
  function spielen(k, runde, w){
    stopp();
    const andere = paare(t.runde).filter(([a, c]) => a !== 0 && c !== 0);
    andere.forEach(([a, c]) => { kiErsatz(a); kiErsatz(c); });
    t.konferenz = konferenzPlanen(andere.slice(0, 2).map(([a, c]) => [a, c]));
    $t('turnier').hidden = true;
    t.gegnerNr = k;
    t.elfSieger = null;
    t.sperreVor = new Set(t.gesperrt);
    const squad = t.kader[0].map(i => t.gesperrt.has(i) ? (t.leih[0] && t.leih[0][i]) : i);
    const posiNeu = { ...(t.opt.posi || {}) }; t.kader[0].forEach((i, n) => { if (squad[n] != null && squad[n] !== i && posiNeu[i]) posiNeu[squad[n]] = posiNeu[i]; });
    const tw = t.opt.torwart;
    const eigene = squad.filter(i => i != null);
    const twNeu = squad[tw] != null ? eigene.indexOf(squad[tw]) : -1;
    const g = aufstellung(k);
    const gTw = g.slice().sort((a, b) => ((DB(b).role === 'TW') - (DB(a).role === 'TW')) || (DB(a).rating - DB(b).rating))[0];
    const gegnerIdx = [gTw, ...g.filter(i => i !== gTw)];
    SPIEL.starte({ ...t.opt, posi: posiNeu, squad: eigene, torwart: twNeu >= 0 ? twNeu : Math.min(tw, eigene.length - 1),
      nummern: Object.fromEntries(eigene.map(i => [i, t.nr[i]])), gegnerNummern: Object.fromEntries(gegnerIdx.map(i => [i, t.nr[i]])),
      heim: (t.runde + k) % 2 === 0,   // V8.6: Heimrecht im Pokal – wechselt je nach Runde und Gegner, bleibt nach dem Laden gleich
      gegnerLand: t.teams[k], gegnerBonus: landBonus(t.teams[k], t.seed || (t.seed = (Math.random() * 1e9) | 0)), gegnerIdx, twG: 0, turnier: runde, wetter: w.wetter, nacht: w.nacht, anstoss: w.anstoss, jz: w.jz, temp: w.temp,
      konferenz: t.konferenz.map(m => ({ a: m.a[0], b: m.b[0], ka: kurz(m.a), kb: kurz(m.b), tore: m.tore })) });
  }
  function nachSpiel(tor, log = [], elfSieger = null){
    if (!t) return;
    t.elfSieger = typeof elfSieger === 'number' ? elfSieger : null;
    $t('turnier').hidden = false; skalieren(); stopp();
    $t('tInfo').classList.remove('an'); document.querySelector('.t-knoepfe').classList.remove('an'); $t('tDein').classList.remove('an');
    sperrenAbsitzen([0, t.gegnerNr]);
    const zeilen = kartenAuswerten(log);
    zeilen.filter(z => z.sperre).forEach(z => t.gesperrt.add(z.idx));
    if (t.runde < 3) karte(sid(t.runde, meinPlatz(t.runde)), t.teams[0], { zeigen: true, rechts: !lage(t.runde, meinPlatz(t.runde)).links });
    sperrenZeigen(zeilen, () => ergebnisse(tor));
  }
  function ergebnisse(tor){
    const r = t.runde, T = t.teams;
    const [wir, die] = tor;
    const ich = { a: wir, b: die, ie: wir === die ? (typeof t.elfSieger === 'number' ? (t.elfSieger === 0 ? [1,0] : [0,1]) : elfmeter()) : null };
    t.letztes = [wir, die];   // V6.7: fuer "hat das letzte Spiel ... gewonnen"
    const naechste = [];
    let zeit = 300, binWeiter = false;
    paare(r).forEach(([a, c, s], m) => {
      let e;
      if (a === 0 || c === 0){ e = a === 0 ? ich : { a: ich.b, b: ich.a, ie: ich.ie ? [ich.ie[1], ich.ie[0]] : null }; }
      else { const kf = (t.konferenz || []).find(x => x.i === a && x.j === c); e = kf ? kf.e : simulieren(a, c); sperrenAbsitzen([a, c]); }
      const sieg = gewinnt(e), w = sieg ? a : c, v = sieg ? c : a;
      t.erg = t.erg || {}; (t.erg[r] = t.erg[r] || [])[m] = { a: e.a, b: e.b, ie: e.ie || null };   // V3.54: fürs Speichern
      naechste[m] = w; t.raus.add(v);
      if (w === 0) binWeiter = true;
      if (r === 2) (t.halbRaus = t.halbRaus || [])[m] = T[v];
      if (r === 3){ t.finalGegner = T[a === 0 ? c : a]; }
      const idA = sid(r, s), idC = sid(r, s + 1), eigen = a === 0 || c === 0;
      spaeter(() => {
        if (r < 3){ tore(idA, e.a, sieg ? ieText(e) : ''); tore(idC, e.b, !sieg ? ieText(e) : ''); }
        else { const sp = (id, n) => $t(id).insertAdjacentHTML('beforeend', '<b class="ftor">' + n + '</b>'); sp(idA, e.a); sp(idC, e.b); }
      }, zeit);
      spaeter(() => {
        if (r < 3){ $t(sieg ? idA : idC).classList.add('weiter'); $t(sieg ? idC : idA).classList.add('raus'); const lp = $t('L' + r + '_' + (sieg ? s : s + 1)); lp && lp.classList.add('sieg'); }
        if (r < 3){ const ziel = r + 1 < 3 ? sid(r + 1, m) : 'tF' + (m + 1); aufsteigen(sieg ? idA : idC, ziel, T[w], 700); }
        else aufsteigen(sieg ? idA : idC, 'tPokal', T[w], 1000);
      }, zeit + (eigen ? 700 : 350));
      zeit += eigen ? 1300 : 600;
    });
    t.baum[r + 1] = naechste;
    if (r === 3){
      turnierLoeschen();
      if (binWeiter){
        spaeter(() => KOMMENTAR.ereignis('pokal_sieg', null, true), zeit + 600);
        spaeter(() => { try { if (t.opt && t.opt.land && t.opt.land[0]) KOMMENTAR.landSatz('turnier_sieg_land_' + t.opt.land[0]); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, zeit + 900);   // V6.6: Land nennen
        spaeter(() => { $t('tPokal').classList.add('sieger'); $t('tRunde').textContent = 'TURNIERSIEGER'; info('🏆 TURNIERSIEGER! 🏆', true); konfetti(); musik.sfx && musik.sfx.jubel(true); }, zeit + 400);
        spaeter(siegerehrung, zeit + 1900);
        // FIFA-artige Belohnung: Finale gewonnen = Goldpack.
        spaeter(() => { try { const n = t.opt.stufe === 'leicht' ? 1500 : t.opt.stufe === 'stark' ? 5000 : 3000;   /* V4.0: Pokalsieg zahlt wie der Hall of Fame Cup (1500 / 3000 / 5000) */   /* V3.04 */ STAND.creditsPlus(n); toast('🏆 Pokalsieg: +' + n + ' Crows!'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, zeit + 2300);   // V4.1
      } else {
        spaeter(() => info('VIZEMEISTER – stark gespielt!', true), zeit + 400);
        spaeter(() => KOMMENTAR.ereignis('pokal_aus_f', null, true), zeit + 500);
        // Finale verloren = Silberpack. Es bleibt im Spielstand, bis es geöffnet wird.
        spaeter(() => { try { /* Finale verloren: kein Pack */ } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, zeit + 700);
      }
      spaeter(() => knoepfe('NEUES TURNIER', 'ZURÜCK'), zeit + 1100);
      $t('tLos').onclick = () => neu(t.opt);
      return;
    }
    if (binWeiter && r === 1){
      // Bronze-Packs sind die kleinen Turnierfortschritts-Belohnungen:
      // nach Achtel- und Viertelfinals je ein Pack, deutlich schwächer als Silber.
      const bronzeQuelle = 'halbfinale';
      spaeter(() => { try { const hf = t.opt.stufe === 'leicht' ? 300 : t.opt.stufe === 'stark' ? 800 : 500;   /* V3.04 */ STAND.creditsPlus(hf); toast('Halbfinale erreicht: +' + hf + ' Crows'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, zeit + 700);   // V4.1
    }
    if (!binWeiter){
      turnierLoeschen();
      spaeter(() => info('AUSGESCHIEDEN im ' + RUNDEN[r], true), zeit + 200);
      spaeter(() => KOMMENTAR.ereignis(['turnier_raus', 'pokal_aus_vf', 'pokal_aus_hf'][r] || 'turnier_raus', null, true), zeit + 300);
      spaeter(() => knoepfe('NEUES TURNIER', 'ZURÜCK'), zeit + 800);
      $t('tLos').onclick = () => neu(t.opt);
      return;
    }
    t.runde = r + 1;
    turnierSpeichern();
    if (t.runde === 1) spaeter(() => KOMMENTAR.ereignis('pokal_vf_erreicht', null, true), zeit + 200);
    if (t.runde === 2) spaeter(() => KOMMENTAR.ereignis('pokal_hf_erreicht', null, true), zeit + 200);
    if (t.runde === 3) spaeter(() => KOMMENTAR.ereignis('pokal_f_erreicht', null, true), zeit + 200);
    rundeAnsagen(zeit + 300);
  }

  let ehLauf = 0;
  function siegerehrung(){
    if (!t) return;
    const T = t.teams, sieger = T[0], zweiter = t.finalGegner;
    let dritter = null;
    if (t.halbRaus && t.halbRaus.every(Boolean)){
      const [a, b] = t.halbRaus, e = simulieren(teamNr(a), teamNr(b));
      dritter = gewinnt(e) ? a : b;
    }
    let titel = 1; try { titel = (+LS81.getItem('sc_titel') || 0) + 1; LS81.setItem('sc_titel', titel); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    const el = $t('ehrung');
    $t('ehTitel').innerHTML = flaggeHTML(sieger[0]) + '<span>' + sieger[0].toUpperCase() + '</span>' + flaggeHTML(sieger[0]);
    $t('ehNr').textContent = titel === 1 ? 'Dein erster Titel!' : 'Dein ' + titel + '. Titel!';
    const bild = i => { const d = DB(i); return d && BILDER[d.bild] ? '<img src="' + BILDER[d.bild] + '" alt="' + d.name + '">' : ''; };
    const pokal = (() => { const p0 = document.getElementById('ladePokal'); if (!p0) return '🏆'; const c = p0.cloneNode(true); c.removeAttribute('id'); c.classList.remove('voll'); return c.outerHTML; })();
    // Platz 1: alle vier, der Kapitän (du) in der Mitte hebt den Pokal
    const k1 = (t.kader[0] || []).slice(0, 5);
    const reihe = [k1[3], k1[1], k1[0], k1[2], k1[4]].filter(i => i != null);
    $t('ehT1').innerHTML = reihe.map(i => i === k1[0]
      ? '<div class="sp kapitaen">' + bild(i) + '<div class="eh-pokal">' + pokal + '</div></div>'
      : '<div class="sp">' + bild(i) + '</div>').join('');
    const zwei = land => { const k = t.kader[teamNr(land)] || []; return k.slice(0, 2).map(i => '<div class="sp">' + bild(i) + '</div>').join(''); };
    $t('ehT2').innerHTML = zweiter ? zwei(zweiter) : '';
    $t('ehT3').innerHTML = dritter ? zwei(dritter) : '';
    $t('ehF1').innerHTML = flaggeHTML(sieger[0]) + ' ' + kurzP(sieger);
    $t('ehF2').innerHTML = zweiter ? flaggeHTML(zweiter[0]) + ' ' + kurzP(zweiter) : '';
    $t('ehF3').innerHTML = dritter ? flaggeHTML(dritter[0]) + ' ' + kurzP(dritter) : '';
    // Konfetti
    const kf = $t('ehKonfetti'); kf.innerHTML = '';
    const farben = ['#ffe234','#ff3fa4','#3fe0ff','#5df07a','#ff8a1f','#ffffff'];
    for (let i = 0; i < 90; i++){ const e = document.createElement('i'); e.style.left = Math.random() * 100 + 'vw'; e.style.background = farben[i % farben.length];
      e.style.animationDuration = (2.6 + Math.random() * 2.6) + 's'; e.style.animationDelay = (Math.random() * 3) + 's'; kf.appendChild(e); }
    el.hidden = false;
    const podest = el.querySelector('.eh-podest'), passen = () => { podest.style.setProperty('--sk', 1); const sk = Math.min(1, innerWidth * .98 / podest.scrollWidth); podest.style.setProperty('--sk', sk.toFixed(3)); };
    passen(); setTimeout(passen, 300); addEventListener('resize', passen);
    // neu starten, damit die Animationen von vorn laufen
    el.querySelectorAll('.eh-kopf,.eh-weiter').forEach(x => { x.style.animation = 'none'; void x.offsetWidth; x.style.animation = ''; });
    musik.sfx && musik.sfx.jubel(true);
    spaeter(() => { if (!el.hidden) musik.sfx && musik.sfx.jubel(true); }, 2600);
    spaeter(() => { if (!el.hidden) musik.sfx && musik.sfx.jubel(true); }, 5600);
    feuerwerk();
  }
  function feuerwerk(){
    const cv = $t('ehFeuer'), g = cv.getContext('2d'), lauf = ++ehLauf, teile = [];
    let naechste = 0, vorher = performance.now();
    const groesse = () => { cv.width = innerWidth; cv.height = innerHeight; };
    groesse();
    const farben = ['#ffe234','#ff3fa4','#3fe0ff','#5df07a','#ff8a1f','#ffffff'];
    function bild(jetzt){
      if (lauf !== ehLauf || $t('ehrung').hidden) return;
      const dt = Math.min(.05, (jetzt - vorher) / 1000); vorher = jetzt;
      if (cv.width !== innerWidth || cv.height !== innerHeight) groesse();
      if (jetzt > naechste){
        naechste = jetzt + 450 + Math.random() * 500;
        const x = cv.width * (.12 + Math.random() * .76), y = cv.height * (.12 + Math.random() * .35), f = farben[(Math.random() * farben.length) | 0];
        for (let i = 0; i < 46; i++){ const w = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160; teile.push({ x, y, vx: Math.cos(w) * v, vy: Math.sin(w) * v, l: 1.1 + Math.random() * .6, f }); }
      }
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'lighter';
      for (let i = teile.length - 1; i >= 0; i--){
        const p = teile[i]; p.l -= dt; if (p.l <= 0){ teile.splice(i, 1); continue; }
        p.vy += 70 * dt; p.vx *= .985; p.vy *= .985; p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalAlpha = Math.min(1, p.l); g.fillStyle = p.f; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      requestAnimationFrame(bild);
    }
    requestAnimationFrame(bild);
  }
  $t('ehWeiter').onclick = () => { $t('ehrung').hidden = true; ehLauf++; };

  $t('tMenue').onclick = () => { stopp(); $t('turnier').hidden = true; t = null; SPIEL.beenden(); };
  return { neu, fortsetzen, fortsetzenOnline, nachSpiel, kurz: kurzP, syncOnline, get gespeichert(){ return !!turnierLaden(); }, get info(){ const x = turnierLaden(); return x && x.opt ? { land: x.opt.land, stufe: x.opt.stufe } : null; }, get aktiv(){ return !!t; }, get zustand(){ return t; } };
})();