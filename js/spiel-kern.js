/* Silescrow Cup V 4.2 – js/spiel-kern.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

// =====================================================================
// LIVE-SPIEL  V 2.8   (Three.js r128)
// 4 gegen 4: 1 Torwart + 3 Feldspieler, Schiedsrichter, Zufallswetter,
// Freistöße mit Mauer, nachgebende Tornetze, ruhiges Spieltempo
// =====================================================================
const SPIEL = (() => {
  // ---------- Maße (1 Einheit ≈ 1 m, kleines 4-gegen-4-Feld) ----------
  let L = 80, B = 52, HL = L / 2, HB = B / 2;   // HALL OF FAME: Maße sind veränderlich (Halle 40 × 22)   // 8+1-Test: D-Jugend-Feld 70 × 50 m (Hauptspiel 44 × 26)
  let KZ = HB / 13;                            // 11er-Test: Maßstab gegenüber dem alten Feld (Breite)
  let TB = 4.2, TH = 2.7, TT = 2.0;          // Tor: halbe Breite, Höhe, Tiefe (D-Jugend: 5 × 2 m)
  let STR_T = 13, STR_B = 15;              // Strafraum: 12 m tief (D-Jugend), halbe Breite = Torhälfte + 12 m
  let ELF_P = 9;                             // D-Jugend: Strafstoßpunkt 8 m
  let KREIS = 7, BANDE_X = HL + 6, BANDE_Z = HB + 6;   // HALL OF FAME: Mittelkreis, Bande der Halle
  function feldSetzen(halle){
    if (halle){ L = 40; B = 22; TB = 2.7; TH = 2.6; TT = 1.0; STR_T = 6; STR_B = 7.5; ELF_P = 6; KREIS = 3; }
    else { L = 80; B = 52; TB = 4.2; TH = 2.7; TT = 2.0; STR_T = 13; STR_B = 15; ELF_P = 9; KREIS = 7; }
    SPIELZEIT = halle ? 180 : 240; HALBZEIT = SPIELZEIT / 2; MIN_FAKTOR = 45 * 60 / HALBZEIT; VERLAENGERUNG = halle ? 40 : 80;   // HALL OF FAME: 2 Minuten (2 × 1 Minute)
    HL = L / 2; HB = B / 2; KZ = HB / 13; BANDE_X = HL + (halle ? 2.2 : .45); BANDE_Z = HB + (halle ? 2.2 : .55);
    TUN_Z0 = -(HB + 1.15); TUN_Z1 = -(HB + 4.6); TUN_RAUS = -(HB + 3.3); TUN_SICHT = -(HB + 2.35); AUFSTELL_Z = -(HB - (halle ? 3 : 7));
  }
  const BALL_R = 0.19, G = 9.81;   // V4.5: Ball kleiner (echter Ball wäre 0,105 – etwas größer, damit man ihn gut sieht)   // V4.4: echte Erdbeschleunigung (vorher 18)
  // V4.4: Ballphysik nach echtem Vorbild (Ball Gr. 4: r 0,105 m, 0,36 kg; Luftdichte 1,2)
  const PH_KD = .5 * 1.2 * Math.PI * .105 * .105 / .36;   // Luftwiderstand: a = PH_KD * cd * v²
  const PH_KM = .5 * 1.2 * Math.PI * .105 * .105 * .105 / .36;   // Magnus: a = PH_KM * (ω × v)
  const cdVon = v => v < 8 ? .45 : v > 14 ? .24 : .45 - (v - 8) / 6 * .21;   // „Drag-Crisis“: schnelle Bälle haben weniger Luftwiderstand
  // Flugzeit über eine Strecke mit Luftwiderstand (für die Zielberechnung)
  const flugZeit = (dist, v0) => { const k = PH_KD * cdVon(v0); return k * dist < 1e-4 ? dist / v0 : (Math.exp(k * dist) - 1) / (k * v0); };
  function spinSetzen(b, seite, oben){   // seite: Drall um die Hochachse (rad/s, + = Kurve nach links), oben: + Rückwärts-/− Vorwärtsdrall
    const h = Math.hypot(b.v.x, b.v.z) || 1, ux = b.v.x / h, uz = b.v.z / h;
    b.spin = { x: -uz * (oben || 0), y: seite || 0, z: ux * (oben || 0) };
    b.dvx = b.v.x; b.dvz = b.v.z;   // gilt nicht als fremde Berührung
  }
  let SPIELZEIT = 240, HALBZEIT = 120;      // V7.7: 2 Halbzeiten à 2 Minuten
  let MIN_FAKTOR = 45 * 60 / HALBZEIT;      // Spielsekunden je echter Sekunde
  let VERLAENGERUNG = 80;   // V7.8: 2 × 15 Minuten im selben Tempo wie das Spiel
  const FARBE = ['#2a64e0', '#e0343c'];          // Hosen/Ringe: dein Team blau, Gegner rot
  const KUERZEL = {"Deutschland":"DEU","Türkei":"TÜR","Spanien":"SPA","Frankreich":"FRA","Italien":"ITA","England":"ENG","Niederlande":"NIE","Portugal":"POR","Belgien":"BEL","Kroatien":"KRO","Österreich":"ÖST","Schweiz":"SCH","Dänemark":"DÄN","Polen":"POL","Brasilien":"BRA","Argentinien":"ARG","Uruguay":"URU","Kolumbien":"KOL","Mexiko":"MEX","USA":"USA","Japan":"JAP","Südkorea":"SÜD","Marokko":"MAR","Senegal":"SEN","Nigeria":"NIG","Ägypten":"ÄGY","Australien":"AUS","Saudi-Arabien":"SAU","Iran":"IRA","Kanada":"KAN","Chile":"CHI","Costa Rica":"COS"};
  const STUFE = { leicht:{tempo:.76,reaktion:.9,genau:.38,tw:.61,zweikampf:.45},
                  mittel:{tempo:.95,reaktion:.38,genau:.75,tw:.9,zweikampf:.95},
                  stark: {tempo:1.03,reaktion:.22,genau:.9, tw:.98,zweikampf:1.12} };

  class Vec3 {
    constructor(x=0,y=0,z=0){ this.x=x; this.y=y; this.z=z; }
    set(x,y,z){ this.x=x; this.y=y; this.z=z; return this; }
    copy(v){ this.x=v.x; this.y=v.y; this.z=v.z; return this; }
    clone(){ return new Vec3(this.x,this.y,this.z); }
    add(v){ this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
    sub(v){ this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
    addScaledVector(v,k){ this.x+=v.x*k; this.y+=v.y*k; this.z+=v.z*k; return this; }
    multiplyScalar(k){ this.x*=k; this.y*=k; this.z*=k; return this; }
    setScalar(k){ this.x=this.y=this.z=k; return this; }
    setY(y){ this.y=y; return this; }
    length(){ return Math.hypot(this.x,this.y,this.z); }
    lengthSq(){ return this.x*this.x+this.y*this.y+this.z*this.z; }
    normalize(){ const l=this.length()||1; return this.multiplyScalar(1/l); }
    dot(v){ return this.x*v.x+this.y*v.y+this.z*v.z; }
    lerp(v,a){ this.x+=(v.x-this.x)*a; this.y+=(v.y-this.y)*a; this.z+=(v.z-this.z)*a; return this; }
    distanceTo(v){ return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z); }
    applyAxisAngle(ax,a){ const c=Math.cos(a), s=Math.sin(a); const x=this.x*c+this.z*s, z=-this.x*s+this.z*c; this.x=x; this.z=z; return this; }
  }
  const V = (x=0,y=0,z=0) => new Vec3(x,y,z);
  const zufall = (a,b) => a + Math.random() * (b - a);
  const klemme = (v,a,b) => Math.max(a, Math.min(b, v));
  const d2 = (a,b) => Math.hypot(a.x - b.x, a.z - b.z);

  let laeuft = false, pausiert = false, rafId = 0;
  let welt = {};          // alle Spielobjekte
  let s = null;           // Spielzustand
  const $s = id => document.getElementById(id);

  // V3.0 STABILITÄTSFIX: alle Spiel-Timer gehören zum aktuellen Match.
  // Beim Abpfiff, Neustart oder Menüwechsel werden sie gemeinsam beendet,
  // damit keine alten Callbacks mehr auf einen neuen Spielzustand zugreifen.
  function spielTimer(fn, ms){
    if (!s) return 0;
    if (!s._timerIds) s._timerIds = [];
    let id = 0;
    id = setTimeout(() => {
      if (!s || !s._timerIds) return;
      const i = s._timerIds.indexOf(id);
      if (i < 0) return;
      s._timerIds.splice(i, 1);
      try { fn(); } catch (e) { console.error('SILESCROW Spiel-Timer:', e); }
    }, ms);
    s._timerIds.push(id);
    return id;
  }
  function spielTimerStop(){
    if (!s || !s._timerIds) return;
    for (const id of s._timerIds) clearTimeout(id);
    s._timerIds.length = 0;
  }

  // =================================================================
  // Bilder und Muster (Canvas, keine externe 3D-Bibliothek nötig)
  // =================================================================
  function leinwand(w, h, malen){
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    malen(c.getContext('2d'), w, h); return c;
  }
  function bandenBild(text, farbe1, farbe2){
    return leinwand(512, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, farbe1); gr.addColorStop(1, farbe2);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; g.font = 'bold 40px "Bangers", Impact, "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w/2, h/2 + 2);
    });
  }
  function publikumBild(wetter){
    const regen = wetter === 'regen';
    return leinwand(240, 120, (g, w, h) => {
      g.fillStyle = regen ? '#222a3e' : wetter === 'schnee' ? '#3a4566' : '#26314f'; g.fillRect(0,0,w,h);
      const farben = ['#e8343c','#2a64e0','#ffe234','#ffffff','#2fc94a','#ff8a1f','#8b45d6','#f2d0b5','#7a4a2a','#111'];
      for (let r = 0; r < 10; r++) for (let i = 0; i < 24; i++){
        const x = i * 10 + (r % 2) * 5 + zufall(-1.5, 1.5), y = r * 12 + 3;
        g.fillStyle = farben[(Math.random()*farben.length)|0]; g.fillRect(x, y + 4, 7, 7);
        g.fillStyle = ['#f2d0b5','#c8956b','#7a4a2a','#e8c4a0'][(Math.random()*4)|0];
        g.beginPath(); g.arc(x + 3.5, y + 2, 3, 0, Math.PI*2); g.fill();
      }
      if (regen){ g.fillStyle = 'rgba(30,40,60,.35)'; g.fillRect(0, 0, w, h); }
      if (wetter === 'schnee'){ g.fillStyle = 'rgba(230,240,255,.18)'; g.fillRect(0, 0, w, h); }
      if (wetter === 'sonne'){ g.fillStyle = 'rgba(255,220,140,.12)'; g.fillRect(0, 0, w, h); }
    });
  }
  const BALL_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">   <defs>     <radialGradient id="bk" cx="34%" cy="28%" r="78%">       <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#ffffff"/>       <stop offset=".9" stop-color="#eceef1"/><stop offset="1" stop-color="#cfd3d9"/>     </radialGradient>     <radialGradient id="pk" cx="45%" cy="30%" r="75%">       <stop offset="0" stop-color="#4a4a4e"/><stop offset=".5" stop-color="#1c1c1f"/><stop offset="1" stop-color="#050506"/>     </radialGradient>     <radialGradient id="glanz" cx="32%" cy="26%" r="40%">       <stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>     </radialGradient>     <radialGradient id="rand" cx="50%" cy="50%" r="50%">       <stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#20242c" stop-opacity=".18"/>     </radialGradient>     <clipPath id="kreis"><circle cx="50" cy="50" r="44"/></clipPath>   </defs>   <circle cx="50" cy="50" r="44" fill="url(#bk)"/>   <g clip-path="url(#kreis)">     <g fill="url(#pk)" stroke="#000" stroke-width=".4" stroke-linejoin="round">       <polygon points="27.5,22.4 36,11.2 53.3,11.5 54.6,24.8 37.1,30.6"/>       <polygon points="70.6,38.2 80.3,32.1 89.8,45.1 82.2,59.9 71.5,54.6"/>       <polygon points="23.4,58.8 35.1,49.1 50.8,58.5 47.3,75 28.8,75"/>       <polygon points="2,39.4 13,32.1 14.2,45.4 10.2,58.5 2,55"/>       <polygon points="56.1,92.5 61.4,85.7 73.5,81.1 81.1,78.5 82,88 68.2,97"/>       <polygon points="64.9,8.3 71.2,9.9 84.1,20.4 82.2,22.4 71.2,14.8"/>       <polygon points="10,72.8 21.5,80.3 27.5,86.7 19.7,90 8,82"/>     </g>     <g fill="#fff" opacity=".35">       <path d="M38,15 Q46,12.5 51,14 Q46,15.5 39,17.5 Z"/><path d="M36,53 Q42,51 46,56 Q41,55 37,56 Z"/>       <path d="M74,38 Q79,35.5 82,37 Q78,38.5 75,40.5 Z"/>     </g>     <circle cx="50" cy="50" r="44" fill="url(#glanz)"/>     <circle cx="50" cy="50" r="44" fill="url(#rand)"/>   </g> </svg> ');
  const bildCache = {};
  function neuesBild(daten){ const i = new Image(); i.src = daten; return i; }
  function bild(daten){
    if (bildCache[daten]) return bildCache[daten];
    const i = new Image(); i.src = daten; return bildCache[daten] = i;
  }

  // =================================================================
  // Welt aufbauen
  // =================================================================
  function baueWelt(wetter){
    const regen = wetter === 'regen';
    welt.wetter = wetter;
    welt.publikum = publikumBild(wetter);
    welt.banden = [['SILESCROW CUP','#0e1b47','#2a64e0'],['SAISON 01','#e8343c','#ff8a1f'],['TORFABRIK','#111','#444'],
                   ['ANSTOSS','#2fa83a','#16968f'],['SUPERTEAM','#8b45d6','#ff3fa4'],['ANPFIFF','#0e1b47','#16968f']]
                   .map(([t, a, b]) => bandenBild(t, a, b));
    // Linien des Spielfelds als Punktlisten (Weltkoordinaten, Boden)
    const L_ = [];
    const kreis = (cx, cz, r, a0 = 0, a1 = Math.PI*2, n = 40) => { const p = []; for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a)*r, cz + Math.sin(a)*r]); } return p; };
    L_.push([[-HL,-HB],[HL,-HB],[HL,HB],[-HL,HB],[-HL,-HB]]);
    L_.push([[0,-HB],[0,HB]]);
    L_.push(kreis(0, 0, KREIS));
    if (s && s.halle) for (const sx of [-1, 1]){   // HALL OF FAME: Hallen-Torraum (6-m-Bogen wie im Futsal)
      const gx = sx * HL, bogen = [];
      for (let i = 0; i <= 12; i++){ const th = i / 12 * Math.PI / 2; bogen.push([gx - sx * 6 * Math.sin(th), -TB - 6 * Math.cos(th)]); }
      for (let i = 12; i >= 0; i--){ const th = i / 12 * Math.PI / 2; bogen.push([gx - sx * 6 * Math.sin(th), TB + 6 * Math.cos(th)]); }
      L_.push(bogen);
    }
    else for (const sx of [-1, 1]){
      const gx = sx * HL;
      L_.push([[gx,-STR_B],[gx - sx*STR_T,-STR_B],[gx - sx*STR_T,STR_B],[gx,STR_B]]);
      L_.push([[gx,-TB-4],[gx - sx*4,-TB-4],[gx - sx*4,TB+4],[gx,TB+4]]);   // Torraum 4 m
      const a = sx > 0 ? Math.PI : 0;
      L_.push(kreis(gx - sx*ELF_P, 0, 6, a - 0.45*Math.PI, a + 0.45*Math.PI, 24).filter(([x]) => (x - gx) * sx < -STR_T + .01));
      for (const sz of [-1, 1]) L_.push(kreis(gx, sz*HB, .8, sz > 0 ? (sx > 0 ? Math.PI : 1.5*Math.PI) : (sx > 0 ? .5*Math.PI : 0), sz > 0 ? (sx > 0 ? 1.5*Math.PI : 2*Math.PI) : (sx > 0 ? Math.PI : .5*Math.PI), 8));
    }
    welt.linien = L_.filter(l => l.length > 1);
    welt.punkte = s && s.halle ? [[0,0],[-HL+ELF_P,0],[HL-ELF_P,0],[-HL+10,0],[HL-10,0]] : [[0,0],[-HL+ELF_P,0],[HL-ELF_P,0]];
    // Pfützen bei Regen
    welt.pfuetzen = regen ? Array.from({length: 22}, () => [zufall(-HL, HL), zufall(-HB, HB), zufall(.6, 2.2)]) : [];
    welt.schneeflecken = wetter === 'schnee' ? Array.from({length: 46}, () => [zufall(-HL - 3, HL + 3), zufall(-HB - 2, HB + 2), zufall(.8, 3.2)]) : [];
    welt.schnee = wetter === 'schnee' ? { flocken: Array.from({length: 170}, () => [Math.random(), Math.random(), zufall(.5, 1.3), Math.random() * 6]) } : null;
    welt.tore = [baueTor(-1), baueTor(1)];
    welt.ball = baueBall();
    welt.regen = regen ? baueRegen() : null;
  }


  // =================================================================
  // Publikum: kleine Figuren wie die Spieler – mit Jacken, T-Shirts, Schals und Fahnen
  // Zwei Bilder im Wechsel ergeben Wippen und wehende Fahnen
  // =================================================================
  function publikumFiguren(wetter, kits, laender, fertigCb){
    const keys = Object.keys(SPRITE_META);
    const bilder = keys.map(k => neuesBild(SPRITES[k + '_v']));
    let offen = bilder.length;
    const eins = () => { if (--offen === 0){ try { fertigCb(bauen()); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} } };
    bilder.forEach(i => { if (i.complete && i.naturalWidth) eins(); else { i.addEventListener('load', eins, { once: true }); i.addEventListener('error', eins, { once: true }); } });
    function bauen(){
      const zufallsFarben = ['#1b1b1b', '#4a4f5c', '#1d2b5a', '#2f7a33', '#ff8a1f', '#8b45d6', '#e8e8e8', '#7a4a2a', '#19a5a5', '#c9a227'];
      const dunkel = (hex, f) => { const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0x26314f; const c = x => Math.round(x * f + 18 * (1 - f));
        return 'rgb(' + c(n >> 16 & 255) + ',' + c(n >> 8 & 255) + ',' + c(n & 255) + ')'; };
      // Varianten je Block: Heimfans fast alle in Heimfarben, Gästefans in Gästefarben, Mitte gemischt
      const gruppeVarianten = gruppe => {
        const liste = [];
        for (let v = 0; v < 40; v++){
          const k = (v * 7 + gruppe.length) % keys.length, img = bilder[k];
          if (!img.naturalWidth) continue;
          const r = Math.random();
          const team = gruppe === 'heim' ? (r < .85 ? 0 : -1) : gruppe === 'gast' ? (r < .85 ? 1 : -1) : (r < .3 ? 0 : r < .6 ? 1 : -1);
          const farbe = team >= 0 ? (Math.random() < .8 ? kits[team].t : kits[team].h) : zufallsFarben[(Math.random() * zufallsFarben.length) | 0];
          const c = trikotBild(img, SPRITE_META[keys[k]], { t: farbe, h: '#222', n: farbe, land: null }, '', false);
          // Licht von oben links, Schatten rechts unten – nur auf der Figur (wirkt plastisch)
          try { const cg = c.getContext('2d'), lg = cg.createLinearGradient(0, 0, c.width, c.height);
            lg.addColorStop(0, 'rgba(255,255,255,.16)'); lg.addColorStop(.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.30)');
            cg.save(); cg.globalCompositeOperation = 'source-atop'; cg.fillStyle = lg; cg.fillRect(0, 0, c.width, c.height); cg.restore(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
          liste.push({ c, team, jacke: Math.random() < .4, schal: team >= 0 && Math.random() < .35, fahne: team >= 0 && Math.random() < (gruppe === 'mix' ? .12 : .32) });
        }
        return liste;
      };
      const W = 1024, H = 156, FW = 34, FH = 44;
      const hash = (a, b) => { let x = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; x = (x ^ (x >>> 13)) * 1274126177; return Math.abs(x ^ (x >>> 16)); };
      const tafel = (gruppe, varianten, transp) => [0, 1].map(fr => leinwand(W, H, (g) => {
        const nacht = s && s.nacht;
        // Sitzschalen in der Farbe des Blocks
        const grund = gruppe === 'heim' ? dunkel(kits[0].t, .42) : gruppe === 'gast' ? dunkel(kits[1].t, .42) : '#2a3350';
        if (!transp) g.fillStyle = grund, g.fillRect(0, 0, W, H);
        // Stufen: helle Betonkante oben, dunkler Schatten unten in jeder Reihe
        if (!transp) for (let r = 0; r < 5; r++){
          const y = 4 + r * 30;
          g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, y + 18, W, 12);
          g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, y, W, 3);
        }
        for (let r = 0; r < 4; r++){
          for (let c = 0; c < 31; c++){
            const x = c * 33 + (r % 2) * 16 - 8, y = 2 + r * 31;
            const v = varianten[hash(r, c) % varianten.length]; if (!v) continue;
            if (gruppe === 'mix' && hash(c, r + 9) % 6 === 0) continue;        // ein paar freie Plätze in der Mitte
            const wipp = ((c + r + fr) % 2) ? -2.5 : 0;
            const w = FW, hh = FH * .95;
            // Schatten auf der Stufe (wirkt räumlich)
            g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x + w * .5 + 3, y + hh * .98, w * .42, 4, 0, 0, Math.PI * 2); g.fill();
            if (v.fahne){
              const land = laender[v.team];
              const sx = x + w * .82, sy = y + wipp + hh * .55;
              g.strokeStyle = '#c9b08a'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + (fr ? 4 : -2), sy - 30); g.stroke();
              const fl = zeichneFlagge(land[0], 48, 33);
              g.save(); g.translate(sx + (fr ? 4 : -2), sy - 30); g.rotate(fr ? .12 : -.08);
              g.drawImage(fl, 0, 0, 24, 17); g.restore();
            }
            g.drawImage(v.c, x, y + wipp, w, hh);
            const brust = y + wipp + hh * .78;
            if (v.jacke){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + w * .48, brust - 4, 1.6, hh * .24); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + w * .3, brust - 6, w * .4, 2); }
            if (v.schal){
              const k = kits[v.team];
              for (let i = 0; i < 6; i++){ g.fillStyle = i % 2 ? k.t : (k.h === k.t ? '#ffffff' : k.h); g.fillRect(x + w * .22 + i * w * .095, brust - 9, w * .095 + .5, 4); }
            }
            // Arme hoch beim Jubeln (Bild 1)
            if (fr && (hash(c, r) % 5 === 0)){ g.strokeStyle = '#f0c8a0'; g.lineWidth = 3; g.lineCap = 'round';
              g.beginPath(); g.moveTo(x + w * .2, brust - 4); g.lineTo(x + w * .08, y + wipp + 4); g.moveTo(x + w * .8, brust - 4); g.lineTo(x + w * .92, y + wipp + 4); g.stroke(); }
          }
        }
        if (transp) g.globalCompositeOperation = 'source-atop';
        if (wetter === 'regen'){ g.fillStyle = 'rgba(20,30,50,.3)'; g.fillRect(0, 0, W, H); }
        if (wetter === 'schnee'){ g.fillStyle = 'rgba(230,240,255,.15)'; g.fillRect(0, 0, W, H); }
        if (nacht){ g.fillStyle = 'rgba(0,6,24,.25)'; g.fillRect(0, 0, W, H); }
        g.globalCompositeOperation = 'source-over';
      }));
      const vH = gruppeVarianten('heim'), vG = gruppeVarianten('gast'), vM = gruppeVarianten('mix');
      return { heim: tafel('heim', vH), gast: tafel('gast', vG), mix: tafel('mix', vM), heimT: tafel('heim', vH, true), gastT: tafel('gast', vG, true), mixT: tafel('mix', vM, true), varianten: { heim: vH, gast: vG, mix: vM }, laender };
    }
  }

  // ---------- Tor mit nachgebendem Netz ----------
  function baueTor(seite){
    const NZ = 33, NY = 13, NX = 8;   // V5.1: feineres Netz mit Sechseck-Maschen
    const netz = { seite, NZ, NY, NX, verschiebung: new Float32Array(NZ*NY), geschw: new Float32Array(NZ*NY),
                   dach: new Float32Array(NZ*NX), dachV: new Float32Array(NZ*NX) };
    const segmente = [];
    // V5.1: Sechseck-Maschen (Wabenmuster): Zickzack-Reihen, nur jede zweite Querverbindung
    for (let j = 0; j < NY; j++) for (let i = 0; i < NZ - 1; i++) segmente.push(['r', i, j, 'r', i+1, j]);
    for (let i = 0; i < NZ; i++) for (let j = 0; j < NY - 1; j++) if ((i + j) % 2 === 0 || i === 0 || i === NZ - 1) segmente.push(['r', i, j, 'r', i, j+1]);
    for (let k = 0; k < NX; k++) for (let i = 0; i < NZ - 1; i++) segmente.push(['d', i, k, 'd', i+1, k]);
    for (let i = 0; i < NZ; i++) for (let k = 0; k < NX - 1; k++) if ((i + k) % 2 === 0 || i === 0 || i === NZ - 1) segmente.push(['d', i, k, 'd', i, k+1]);
    netz.seiten = { [-1]: [], [1]: [] };
    for (const iz of [0, NZ - 1]){
      const liste = netz.seiten[iz === 0 ? -1 : 1];
      for (let j = 0; j < NY; j++) for (let k = 0; k < NX - 1; k++) liste.push(['s', iz, j, k, 's', iz, j, k+1]);
      for (let k = 0; k < NX; k++) for (let j = 0; j < NY - 1; j++) if ((j + k) % 2 === 0 || k === 0 || k === NX - 1) liste.push(['s', iz, j, k, 's', iz, j+1, k]);
    }
    netz.segmente = segmente;
    netz.x0 = seite * HL;
    return netz;
  }
  function netzPunkt(netz, typ, a, b, c){
    const { x0, seite, NZ, NY, NX } = netz;
    if (typ === 'r'){
      const zig = (b > 0 && b < NY - 1) ? ((a + b) % 2 === 0 ? 1 : -1) * TH / (NY - 1) * .25 : 0;   // Waben-Zickzack
      const z = -TB + 2*TB * a/(NZ-1), y = TH * b/(NY-1) + zig;
      const dx = netz.verschiebung[b*NZ + a];
      return [x0 + seite*(TT + dx), y, z];
    }
    if (typ === 'd'){
      const zig = (b > 0 && b < NX - 1) ? ((a + b) % 2 === 0 ? 1 : -1) * .25 / (NX - 1) : 0;
      const z = -TB + 2*TB * a/(NZ-1), t = b/(NX-1) + zig;
      const dy = netz.dach[b*NZ + a];
      const dxR = netz.verschiebung[(NY-1)*NZ + a] * t;
      return [x0 + seite*(TT*t + dxR), TH + dy, z];
    }
    const zig = (b > 0 && b < NY - 1 && c > 0 && c < NX - 1) ? ((b + c) % 2 === 0 ? 1 : -1) * TH / (NY - 1) * .25 : 0;
    const z = a === 0 ? -TB : TB, y = TH * b/(NY-1) + zig, t = c/(NX-1);
    const dx = netz.verschiebung[b*NZ + a] * t;
    return [x0 + seite*(TT*t + dx), y, z];
  }
  function aktualisiereNetz(netz, dt){
    const n = netz.verschiebung.length, v = netz.geschw, d = netz.verschiebung;
    if (dt <= 0) return;
    const neu = new Float32Array(n);
    for (let j = 0; j < netz.NY; j++) for (let i = 0; i < netz.NZ; i++){
      const k = j*netz.NZ + i;
      let nb = 0, cnt = 0;
      if (i > 0){ nb += d[k-1]; cnt++; } if (i < netz.NZ-1){ nb += d[k+1]; cnt++; }
      if (j > 0){ nb += d[k-netz.NZ]; cnt++; } if (j < netz.NY-1){ nb += d[k+netz.NZ]; cnt++; }
      const a = -55*d[k] + 30*(nb/cnt - d[k]) - 4.5*v[k];
      neu[k] = v[k] + a*dt;
    }
    for (let k = 0; k < n; k++){ v[k] = neu[k]; d[k] += v[k]*dt; }
    for (let i = 0; i < netz.NZ; i++){ d[i] *= .2; }
    for (let k = 0; k < netz.dach.length; k++){ netz.dachV[k] += (-60*netz.dach[k] - 5*netz.dachV[k])*dt; netz.dach[k] += netz.dachV[k]*dt; }
  }
  function netzStoss(netz, z, y, staerke){
    for (let j = 0; j < netz.NY; j++) for (let i = 0; i < netz.NZ; i++){
      const pz = -TB + 2*TB * i/(netz.NZ-1), py = TH * j/(netz.NY-1);
      const w = Math.exp(-((pz - z)**2 + (py - y)**2) / 0.9);
      netz.geschw[j*netz.NZ + i] += staerke * w;
    }
  }

  // ---------- Ball ----------
  function baueBall(){
    return { bild: bild(BALL_SVG), rot: 0, spurPunkte: [], p: V(0, BALL_R, 0), v: V(), besitzer: null, letzter: null, letzteTeam: 0, schussVon: null, passZiel: null };
  }

  // ---------- Regen (Bildschirm-Partikel) ----------
  function baueRegen(){
    return { tropfen: Array.from({length: 260}, () => [Math.random(), Math.random(), zufall(.6, 1.2)]), spritzer: [] };
  }

  // =================================================================
  // Trikots der Länder: Farbe, Hose, Rückennummer-Farbe, Muster, Auswärtstrikot
  // =================================================================
  // Trikot-Sets aller Länder (Heim/Auswärts, Hose, Stutzen, Schuhe, TW-Handschuhe) – wie auf den Trikot-Blättern
  const TRIKOTS = {"Deutschland": {"heim": {"t": "#ffffff", "kragen": "#111", "n": "#111", "h": "#111", "s": "#ffffff", "sBand": ["#111", "#dd0000", "#ffce00"], "muster": "brustband", "band": ["#111", "#dd0000", "#ffce00"]}, "aus": {"t": "#d0141c", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#ffffff", "sBand": ["#d0141c"], "muster": "schraeg", "m2": "#b30f17"}, "schuh": ["#111", "#d0141c", "#111"], "hand": ["#efe8d8", "#222"]}, "Türkei": {"heim": {"t": "#d7141a", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#d7141a", "sBand": ["#ffffff"], "muster": "querband", "m2": "#b80f15"}, "aus": {"t": "#ffffff", "kragen": "#d7141a", "n": "#d7141a", "h": "#ffffff", "s": "#ffffff", "sBand": ["#d7141a"], "muster": ""}, "schuh": ["#d7141a", "#ffffff", "#111"], "hand": ["#111", "#d7141a"]}, "Spanien": {"heim": {"t": "#c8102e", "kragen": "#ffc400", "n": "#ffc400", "h": "#c8102e", "s": "#c8102e", "sBand": ["#ffc400"], "muster": "seitenzacken", "m2": "#ffc400", "m3": "#5b2a86", "hStreifen": "#ffc400"}, "aus": {"t": "#ffffff", "kragen": "#c8102e", "n": "#c8102e", "h": "#c8102e", "s": "#ffffff", "sBand": ["#c8102e"], "muster": ""}, "schuh": ["#c8102e", "#ffd400", "#111"], "hand": ["#c8102e", "#ffc400"]}, "Frankreich": {"heim": {"t": "#1b2a5c", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#e1252f", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#1b2a5c", "n": "#1b2a5c", "h": "#ffffff", "s": "#ffffff", "sBand": ["#1b2a5c", "#e1252f"], "muster": ""}, "schuh": ["#1b2a5c", "#ffffff", "#e1252f"], "hand": ["#1b2a5c", "#e1252f"]}, "Italien": {"heim": {"t": "#1f5fbf", "kragen": "#13234f", "n": "#d4a84a", "h": "#1f5fbf", "s": "#1f5fbf", "sBand": ["#0b9a49", "#ffffff", "#d72f3c"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#13234f", "n": "#1f5fbf", "h": "#1f5fbf", "s": "#ffffff", "sBand": ["#1f5fbf"], "muster": ""}, "schuh": ["#1f5fbf", "#d4a84a", "#111"], "hand": ["#9aa3ad", "#1f5fbf"]}, "England": {"heim": {"t": "#ffffff", "kragen": "#1b2a5c", "n": "#1b2a5c", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#c8102e"], "muster": ""}, "aus": {"t": "#1b2a5c", "kragen": "#c8102e", "n": "#ffffff", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#c8102e"], "muster": "schraeg", "m2": "#24376e"}, "schuh": ["#ffffff", "#1b2a5c", "#111"], "hand": ["#9aa3ad", "#555"]}, "Niederlande": {"heim": {"t": "#f36c21", "kragen": "#111", "n": "#111", "h": "#ffffff", "s": "#f36c21", "sBand": ["#111"], "muster": ""}, "aus": {"t": "#1d2a6b", "kragen": "#f36c21", "n": "#f36c21", "h": "#1d2a6b", "s": "#1d2a6b", "sBand": ["#f36c21"], "muster": "schraeg", "m2": "#24337e"}, "schuh": ["#f36c21", "#111", "#ffffff"], "hand": ["#f36c21", "#1d2a6b"]}, "Portugal": {"heim": {"t": "#d0161e", "kragen": "#0b6e3a", "n": "#ffffff", "h": "#0b6e3a", "s": "#0b6e3a", "sBand": ["#d0161e"], "muster": "diagonal", "m2": "#a80f15"}, "aus": {"t": "#ffffff", "kragen": "#0b6e3a", "n": "#d0161e", "h": "#ffffff", "s": "#ffffff", "sBand": ["#0b6e3a", "#d0161e"], "muster": "quer", "m2": "#d0161e", "m3": "#0b6e3a"}, "schuh": ["#d0161e", "#0b6e3a", "#111"], "hand": ["#0b6e3a", "#d0161e"]}, "Belgien": {"heim": {"t": "#c8102e", "kragen": "#111", "n": "#ffd400", "h": "#c8102e", "s": "#c8102e", "sBand": ["#111", "#ffd400"], "muster": "schraeg", "m2": "#7a0f12"}, "aus": {"t": "#bfe0f2", "kragen": "#c8102e", "n": "#111", "h": "#111", "s": "#111", "sBand": ["#c8102e"], "muster": ""}, "schuh": ["#c8102e", "#ffffff", "#111"], "hand": ["#111", "#ffd400"]}, "Kroatien": {"heim": {"t": "#e4141f", "kragen": "#1f3fa8", "n": "#1f3fa8", "h": "#ffffff", "s": "#1f3fa8", "sBand": ["#ffffff"], "muster": "karo", "m2": "#ffffff", "nRand": "#ffffff"}, "aus": {"t": "#1b2350", "kragen": "#e4141f", "n": "#ffffff", "h": "#1b2350", "s": "#1b2350", "sBand": ["#e4141f"], "muster": ""}, "schuh": ["#e4141f", "#ffffff", "#1f3fa8"], "hand": ["#1f3fa8", "#e4141f"]}, "Österreich": {"heim": {"t": "#e4141f", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#e4141f", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#e4141f", "n": "#e4141f", "h": "#111", "s": "#ffffff", "sBand": ["#e4141f"], "muster": ""}, "schuh": ["#e4141f", "#ffffff", "#111"], "hand": ["#111", "#e4141f"]}, "Schweiz": {"heim": {"t": "#e4141f", "kragen": "#ffffff", "n": "#ffffff", "h": "#e4141f", "s": "#e4141f", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#e4141f", "n": "#e4141f", "h": "#ffffff", "s": "#ffffff", "sBand": ["#e4141f"], "muster": ""}, "schuh": ["#e4141f", "#ffffff", "#111"], "hand": ["#ffffff", "#e4141f"]}, "Dänemark": {"heim": {"t": "#c8102e", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#c8102e", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#c8102e", "n": "#c8102e", "h": "#c8102e", "s": "#ffffff", "sBand": ["#c8102e"], "muster": ""}, "schuh": ["#ffffff", "#c8102e", "#111"], "hand": ["#111", "#c8102e"]}, "Polen": {"heim": {"t": "#ffffff", "kragen": "#dc143c", "n": "#dc143c", "h": "#dc143c", "s": "#ffffff", "sBand": ["#dc143c"], "muster": ""}, "aus": {"t": "#dc143c", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#dc143c", "sBand": ["#ffffff"], "muster": ""}, "schuh": ["#ffffff", "#dc143c", "#111"], "hand": ["#dc143c", "#ffffff"]}, "Brasilien": {"heim": {"t": "#ffd21f", "kragen": "#0b8a3e", "n": "#0b8a3e", "h": "#1f3fa8", "s": "#ffffff", "sBand": ["#0b8a3e", "#ffd21f"], "muster": ""}, "aus": {"t": "#1f3fa8", "kragen": "#ffd21f", "n": "#ffd21f", "h": "#ffffff", "s": "#1f3fa8", "sBand": ["#ffd21f"], "muster": "schraeg", "m2": "#2a4fc0"}, "schuh": ["#ffd21f", "#0b8a3e", "#1f3fa8"], "hand": ["#0b8a3e", "#ffd21f"]}, "Argentinien": {"heim": {"t": "#ffffff", "kragen": "#111", "n": "#111", "h": "#111", "s": "#ffffff", "sBand": ["#74b8ea"], "muster": "streifen", "m2": "#74b8ea"}, "aus": {"t": "#1b2a5c", "kragen": "#74b8ea", "n": "#74b8ea", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#74b8ea"], "muster": ""}, "schuh": ["#74b8ea", "#ffffff", "#111"], "hand": ["#74b8ea", "#1b2a5c"]}, "Uruguay": {"heim": {"t": "#5aa8e0", "kragen": "#111", "n": "#ffffff", "h": "#111", "s": "#111", "sBand": ["#5aa8e0"], "muster": "", "nRand": "#111"}, "aus": {"t": "#ffffff", "kragen": "#5aa8e0", "n": "#5aa8e0", "h": "#ffffff", "s": "#ffffff", "sBand": ["#5aa8e0"], "muster": ""}, "schuh": ["#5aa8e0", "#ffffff", "#111"], "hand": ["#111", "#5aa8e0"]}, "Kolumbien": {"heim": {"t": "#ffd200", "kragen": "#1f3fa8", "n": "#1f3fa8", "h": "#1f3fa8", "s": "#d7141a", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#1b2a5c", "kragen": "#ffd200", "n": "#ffd200", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#ffd200"], "muster": ""}, "schuh": ["#ffd200", "#1f3fa8", "#d7141a"], "hand": ["#1f3fa8", "#ffd200"]}, "Mexiko": {"heim": {"t": "#0b6b3a", "kragen": "#d7232f", "n": "#ffffff", "h": "#ffffff", "s": "#d7232f", "sBand": ["#ffffff"], "muster": "schraeg", "m2": "#0a5c32"}, "aus": {"t": "#1a1a1a", "kragen": "#0b6b3a", "n": "#0b8a4a", "h": "#1a1a1a", "s": "#1a1a1a", "sBand": ["#0b8a4a"], "muster": ""}, "schuh": ["#0b6b3a", "#ffffff", "#d7232f"], "hand": ["#d7232f", "#0b6b3a"]}, "USA": {"heim": {"t": "#ffffff", "kragen": "#1b2a5c", "n": "#1b2a5c", "h": "#1b2a5c", "s": "#ffffff", "sBand": ["#c8102e", "#1b2a5c"], "muster": ""}, "aus": {"t": "#1b2a5c", "kragen": "#c8102e", "n": "#ffffff", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#c8102e"], "muster": ""}, "schuh": ["#ffffff", "#1b2a5c", "#c8102e"], "hand": ["#1b2a5c", "#c8102e"]}, "Japan": {"heim": {"t": "#1b2f8f", "kragen": "#d0103a", "n": "#ffffff", "h": "#ffffff", "s": "#1b2f8f", "sBand": ["#d0103a"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#1b2f8f", "n": "#1b2f8f", "h": "#ffffff", "s": "#ffffff", "sBand": ["#1b2f8f"], "muster": ""}, "schuh": ["#1b2f8f", "#ffffff", "#d0103a"], "hand": ["#1b2f8f", "#ffffff"]}, "Südkorea": {"heim": {"t": "#d0103a", "kragen": "#111", "n": "#ffffff", "h": "#111", "s": "#d0103a", "sBand": ["#111"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#111", "n": "#111", "h": "#ffffff", "s": "#ffffff", "sBand": ["#d0103a", "#1f3fa8"], "muster": ""}, "schuh": ["#d0103a", "#111", "#ffffff"], "hand": ["#111", "#d0103a"]}, "Marokko": {"heim": {"t": "#c1272d", "kragen": "#0b7a3e", "n": "#ffffff", "h": "#0b7a3e", "s": "#c1272d", "sBand": ["#0b7a3e"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#c1272d", "n": "#c1272d", "h": "#ffffff", "s": "#ffffff", "sBand": ["#0b7a3e"], "muster": ""}, "schuh": ["#c1272d", "#0b7a3e", "#111"], "hand": ["#0b7a3e", "#c1272d"]}, "Senegal": {"heim": {"t": "#ffffff", "kragen": "#0b8a43", "n": "#0b8a43", "h": "#ffffff", "s": "#ffffff", "sBand": ["#0b8a43", "#fdef42", "#e31b23"], "muster": ""}, "aus": {"t": "#0b8a43", "kragen": "#fdef42", "n": "#fdef42", "h": "#0b8a43", "s": "#0b8a43", "sBand": ["#fdef42"], "muster": ""}, "schuh": ["#ffffff", "#0b8a43", "#fdef42"], "hand": ["#0b8a43", "#fdef42"]}, "Nigeria": {"heim": {"t": "#0b8a50", "kragen": "#ffffff", "n": "#ffffff", "h": "#0b8a50", "s": "#0b8a50", "sBand": ["#ffffff"], "muster": "schraeg", "m2": "#14a862"}, "aus": {"t": "#ffffff", "kragen": "#0b8a50", "n": "#0b8a50", "h": "#ffffff", "s": "#ffffff", "sBand": ["#0b8a50"], "muster": ""}, "schuh": ["#0b8a50", "#ffffff", "#111"], "hand": ["#0b8a50", "#ffffff"]}, "Ägypten": {"heim": {"t": "#c8102e", "kragen": "#ffffff", "n": "#ffffff", "h": "#ffffff", "s": "#111", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#c8102e", "n": "#c8102e", "h": "#111", "s": "#ffffff", "sBand": ["#c8102e"], "muster": ""}, "schuh": ["#c8102e", "#d4a017", "#111"], "hand": ["#111", "#d4a017"]}, "Australien": {"heim": {"t": "#ffcd00", "kragen": "#0b6b3a", "n": "#0b6b3a", "h": "#0b6b3a", "s": "#ffcd00", "sBand": ["#0b6b3a"], "muster": ""}, "aus": {"t": "#1b2a5c", "kragen": "#ffcd00", "n": "#ffcd00", "h": "#1b2a5c", "s": "#1b2a5c", "sBand": ["#ffcd00"], "muster": ""}, "schuh": ["#ffcd00", "#0b6b3a", "#111"], "hand": ["#0b6b3a", "#ffcd00"]}, "Saudi-Arabien": {"heim": {"t": "#ffffff", "kragen": "#0b7a3e", "n": "#0b7a3e", "h": "#ffffff", "s": "#ffffff", "sBand": ["#0b7a3e"], "muster": ""}, "aus": {"t": "#0b7a3e", "kragen": "#ffffff", "n": "#ffffff", "h": "#0b7a3e", "s": "#0b7a3e", "sBand": ["#ffffff"], "muster": "schraeg", "m2": "#0a6b36"}, "schuh": ["#ffffff", "#0b7a3e", "#111"], "hand": ["#0b7a3e", "#ffffff"]}, "Iran": {"heim": {"t": "#ffffff", "kragen": "#e4141f", "n": "#e4141f", "h": "#ffffff", "s": "#ffffff", "sBand": ["#239f40", "#e4141f"], "muster": ""}, "aus": {"t": "#e4141f", "kragen": "#ffffff", "n": "#ffffff", "h": "#e4141f", "s": "#e4141f", "sBand": ["#ffffff"], "muster": ""}, "schuh": ["#ffffff", "#239f40", "#e4141f"], "hand": ["#239f40", "#e4141f"]}, "Kanada": {"heim": {"t": "#d52b1e", "kragen": "#ffffff", "n": "#ffffff", "h": "#d52b1e", "s": "#d52b1e", "sBand": ["#ffffff"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#d52b1e", "n": "#d52b1e", "h": "#ffffff", "s": "#ffffff", "sBand": ["#d52b1e"], "muster": ""}, "schuh": ["#d52b1e", "#ffffff", "#111"], "hand": ["#111", "#d52b1e"]}, "Chile": {"heim": {"t": "#d0103a", "kragen": "#1f3fa8", "n": "#ffffff", "h": "#1f3fa8", "s": "#ffffff", "sBand": ["#d0103a"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#d0103a", "n": "#d0103a", "h": "#ffffff", "s": "#ffffff", "sBand": ["#1f3fa8"], "muster": ""}, "schuh": ["#d0103a", "#1f3fa8", "#ffffff"], "hand": ["#1f3fa8", "#d0103a"]}, "Costa Rica": {"heim": {"t": "#d0103a", "kragen": "#1f3fa8", "n": "#ffffff", "h": "#1f3fa8", "s": "#ffffff", "sBand": ["#1f3fa8"], "muster": ""}, "aus": {"t": "#ffffff", "kragen": "#1f3fa8", "n": "#1f3fa8", "h": "#ffffff", "s": "#ffffff", "sBand": ["#d0103a"], "muster": ""}, "schuh": ["#d0103a", "#1f3fa8", "#ffffff"], "hand": ["#1f3fa8", "#d0103a"]}};
  const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const farbAbstand = (a, b) => { const x = hex2rgb(a), y = hex2rgb(b); return Math.hypot(x[0]-y[0], x[1]-y[1], x[2]-y[2]); };
  const helligkeit = h => { const [r,g,b] = hex2rgb(h); return .299*r + .587*g + .114*b; };

  // Trikot eines Landes; Auswärtstrikot, wenn es dem Gegner zu ähnlich ist
  function trikotFuer(land, gegenTrikot){
    const set = TRIKOTS[land[0]] || { heim: { t:'#2a64e0', kragen:'#ffffff', n:'#ffffff', h:'#ffffff', s:'#2a64e0', sBand:[] }, aus: { t:'#ffffff', kragen:'#2a64e0', n:'#2a64e0', h:'#ffffff', s:'#ffffff', sBand:[] }, schuh:['#222','#fff'], hand:['#eee','#333'] };
    const zuNah = (a, b) => farbAbstand(a.t, b.t) < 110;
    let auswaerts = false, basis = set.heim;
    if (gegenTrikot && zuNah(set.heim, gegenTrikot)){ basis = set.aus; auswaerts = true; }
    const kit = { ...basis, schuh: auswaerts ? [basis.t, basis.kragen, '#111'] : set.schuh, hand: set.hand, auswaerts, flagge: land[1], land: land[0] };
    kit.ring = kit.t;
    return kit;
  }
  // Torwart-Trikot: eine Farbe, die sich von beiden Teams abhebt
  function torwartTrikot(kits, team){
    const wahl = ['#2fc94a', '#ffd23a', '#8b45d6', '#ff8a1f', '#151515', '#19a5a5'];
    const t = wahl.find(c => kits.every(k => farbAbstand(c, k.t) > 120)) || wahl[0];
    return { ...kits[team], t, h: helligkeit(t) > 150 ? '#151515' : t, s: t, sBand: [], hStreifen: null, kragen: helligkeit(t) > 150 ? '#151515' : '#ffffff', n: helligkeit(t) > 150 ? '#111111' : '#ffffff', nRand: null, muster: null };
  }
  const NUMMERN = { TW:[1,12], DF:[4,5,3,2,15], MF:[8,6,10,7,14], ST:[9,11,7,10,19] };
  function naechsteNummer(team, rolle){
    s.nummern = s.nummern || [new Set(), new Set()];
    const n = (NUMMERN[rolle] || [13]).find(x => !s.nummern[team].has(x)) || (20 + s.nummern[team].size);
    s.nummern[team].add(n); return n;
  }

  // Oberkörper-Bild in Teamfarbe umfärben, Flagge und Nummer aufdrucken
  function trikotBild(img, meta, kit, nummer, rueck, hautRGB){
    const w = img.naturalWidth, hgt = img.naturalHeight, sk = hgt / meta.h;
    const c = document.createElement('canvas'); c.width = w; c.height = hgt;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, hgt), px = d.data;
    const seite = rueck === 'seite'; if (seite) rueck = false;
    const hals = Math.round((meta.kinn + (rueck ? 2 : seite ? 4 : 6)) * sk);
    const [kr, kg, kb] = hex2rgb(kit.t), [mr, mg, mb] = kit.m2 ? hex2rgb(kit.m2) : [kr, kg, kb], m3rgb = kit.m3 ? hex2rgb(kit.m3) : [mr, mg, mb];
    // mittlere Helligkeit des alten Trikots (für die Schattierung)
    let summe = 0, anz = 0;
    for (let y = hals; y < hgt; y++) for (let x = Math.round(w*.3); x < w*.7; x++){ const i = (y*w + x)*4; if (px[i+3] > 200){ summe += .299*px[i] + .587*px[i+1] + .114*px[i+2]; anz++; } }
    const mittel = anz ? summe / anz : 150;
    const hautRegel = (r, gg, b) => r > 80 && gg > 40 && b > 25 && r > gg && gg > b && r - b > 30 && r - gg < 75 && r - gg > 8 && (r - b) / r < .62;
    // Hautfarbe aus dem Gesicht (Vorderbild) -> Arme sicher erkennen, Trikotfarben nicht verwechseln
    const haut = hautRGB ? (r, gg, b) => { const l = (r + gg + b) / (hautRGB[0] + hautRGB[1] + hautRGB[2] + 1);
        return l > .45 && l < 1.45 && Math.abs(r / (gg + 1) - hautRGB[0] / (hautRGB[1] + 1)) < .22 && Math.abs(gg / (b + 1) - hautRGB[1] / (hautRGB[2] + 1)) < .3; } : hautRegel;
    for (let y = hals; y < hgt; y++){
      const ry = (y - hals) / (hgt - hals);
      for (let x = 0; x < w; x++){
        const i = (y*w + x)*4; if (px[i+3] < 20) continue;
        const rx = x / w, mitte = !seite && rx > .22 && rx < .78 && !(ry > .45 && (rx < .27 || rx > .73));
        if (!mitte && haut(px[i], px[i+1], px[i+2])){ px[i+3] = 0; continue; }   // Arme entfernen – sie werden im Spiel animiert gezeichnet
        const l = .299*px[i] + .587*px[i+1] + .114*px[i+2];
        const f = klemme(.62 + .45 * (l / mittel - 1) + .38, .55, 1.25);
        let r = kr, gg = kg, b = kb;
        const mu = kit.muster, setz = c => { r = c[0]; gg = c[1]; b = c[2]; }, mix = (c, a) => { r = r + (c[0] - r) * a; gg = gg + (c[1] - gg) * a; b = b + (c[2] - b) * a; };
        if (mu === 'streifen' && Math.floor(rx * 9) % 2 === 1) setz([mr, mg, mb]);
        if ((mu === 'karo' || mu === 'kariert') && (Math.floor(rx * 8) + Math.floor(ry * 5)) % 2 === 1) setz([mr, mg, mb]);
        if (mu === 'quer' && ry > .12 && Math.floor(ry * 9) % 2 === 1) setz(Math.floor(ry * 9) % 4 === 1 ? [mr, mg, mb] : m3rgb);
        if (mu === 'querband' && ry > .28 && ry < .44) mix([mr, mg, mb], .85);
        if (mu === 'diagonal' && rx + ry * .8 > .85 && rx + ry * .8 < 1.05) mix([mr, mg, mb], .9);
        if (mu === 'schraeg' && Math.floor((rx + ry * .55) * 5) % 2 === 0) mix([mr, mg, mb], .6);
        if (mu === 'brustband' && !rueck && !seite && kit.band && rx > .5 && rx < .62){ setz(hex2rgb(kit.band[Math.min(kit.band.length - 1, Math.floor((rx - .5) / .12 * kit.band.length))])); }
        if (mu === 'seitenzacken' && !rueck && (rx < .2 || seite && rx > .62)){ const zz = (ry * 9) % 1; if (zz < .5 && Math.abs((seite && rx > .62 ? 1 - rx : rx) - .12) < .08 * (1 - zz * 2)) setz(Math.floor(ry * 9) % 2 ? [mr, mg, mb] : m3rgb); }
        px[i] = klemme(r * f, 0, 255); px[i+1] = klemme(gg * f, 0, 255); px[i+2] = klemme(b * f, 0, 255);
      }
    }
    g.putImageData(d, 0, 0);
    // Kragen-Linie
    g.strokeStyle = kit.kragen || kit.n; g.globalAlpha = .95; g.lineWidth = Math.max(1.5, w * .032);
    if (!seite){ g.beginPath(); g.moveTo(w*.38, hals + w*.01); g.quadraticCurveTo(w*.5, hals + w*.06, w*.62, hals + w*.01); g.stroke(); }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (rueck){
      // große Rückennummer
      g.font = 'bold ' + Math.round(w * .46) + 'px "Bangers", Impact, "Arial Black", sans-serif';
      g.lineJoin = 'round'; g.lineWidth = Math.max(2, w * (kit.nRand ? .08 : .05)); g.strokeStyle = kit.nRand || 'rgba(0,0,0,.55)';
      g.save(); g.globalCompositeOperation = 'source-atop';
      g.strokeText(String(nummer), w * .5, hals + (hgt - hals) * .56);
      g.fillStyle = kit.n; g.fillText(String(nummer), w * .5, hals + (hgt - hals) * .56);
      g.restore();
    } else if (!seite) {
      // Flagge auf der Brust (links vom Spieler aus gesehen) und kleine Nummer
      if (kit.land){
        const fl = zeichneFlagge(kit.land, 96, 66), fw = w * .25, fh = fw * 66 / 96;
        const fx = w * .51, fy = hals + (hgt - hals) * .22;
        g.save(); g.globalCompositeOperation = 'source-atop';      // nur dort zeichnen, wo Trikot ist
        g.drawImage(fl, fx, fy, fw, fh); g.restore();
      }
      g.font = 'bold ' + Math.round(w * .27) + 'px "Bangers", Impact, "Arial Black", sans-serif';
      g.lineJoin = 'round'; g.lineWidth = Math.max(2, w * .035); g.strokeStyle = 'rgba(0,0,0,.5)';
      g.save(); g.globalCompositeOperation = 'source-atop';
      g.strokeText(String(nummer), w * .37, hals + (hgt - hals) * .52);
      g.fillStyle = kit.n; g.fillText(String(nummer), w * .37, hals + (hgt - hals) * .52);
      g.restore();
    }
    return c;
  }
  // =================================================================
  // KÖRPER: Kopf aus dem Figurenbild, Körper (Hals bis Fuß) neu gezeichnet –
  // Trikot, Hose, Stutzen und Schuhe passen damit immer genau zusammen
  // =================================================================
  // Kopf aus dem Figurenbild ausschneiden (bis knapp unter das Kinn)
  // Kinn pro Figur und Ansicht (automatisch erkannt, lange Haare von Hand) und Kopf-Maßstab pro Figur
  const KOPF_KINN = {"a11_r":93,"a11_s":95,"a11_v":94,"a12_r":93,"a12_s":94,"a12_v":94,"a13_r":92,"a13_s":94,"a13_v":94,"a14_r":93,"a14_s":94,"a14_v":95,"a15_r":92,"a15_s":95,"a15_v":93,"a16_r":93,"a16_s":95,"a16_v":94,"a17_r":93,"a17_s":95,"a17_v":93,"a21_r":93,"a21_s":95,"a21_v":93,"a22_r":94,"a22_s":94,"a22_v":94,"a23_r":93,"a23_s":95,"a23_v":93,"a24_r":93,"a24_s":95,"a24_v":93,"a25_r":94,"a25_s":95,"a25_v":94,"a26_r":94,"a26_s":95,"a26_v":93,"a27_r":93,"a27_s":95,"a27_v":94,"a31_r":94,"a31_s":95,"a31_v":94,"a32_r":96,"a32_s":95,"a32_v":96,"a33_r":93,"a33_s":95,"a33_v":95,"a34_r":93,"a34_s":95,"a34_v":94,"a35_r":93,"a35_s":95,"a35_v":94,"a36_r":93,"a36_s":95,"a36_v":94,"a37_r":93,"a37_s":95,"a37_v":94,"a41_r":93,"a41_s":95,"a41_v":93,"a42_r":106,"a42_s":94,"a42_v":93,"a43_r":108,"a43_s":95,"a43_v":94,"a44_r":94,"a44_s":94,"a44_v":93,"a45_r":94,"a45_s":94,"a45_v":94,"a46_r":93,"a46_s":94,"a46_v":94,"a47_r":94,"a47_s":95,"a47_v":93,"b11_r":93,"b11_s":95,"b11_v":93,"b12_r":92,"b12_s":94,"b12_v":93,"b13_r":92,"b13_s":94,"b13_v":93,"b14_r":97,"b14_s":96,"b14_v":96,"b15_r":93,"b15_s":94,"b15_v":93,"b16_r":92,"b16_s":95,"b16_v":92,"b17_r":93,"b17_s":95,"b17_v":93,"b21_r":94,"b21_s":94,"b21_v":93,"b22_r":92,"b22_s":94,"b22_v":92,"b23_r":92,"b23_s":94,"b23_v":92,"b24_r":95,"b24_s":96,"b24_v":96,"b25_r":98,"b25_s":97,"b25_v":97,"b26_r":94,"b26_s":94,"b26_v":93,"b27_r":93,"b27_s":94,"b27_v":92,"b31_r":93,"b31_s":95,"b31_v":93,"b32_r":97,"b32_s":97,"b32_v":97,"b33_r":92,"b33_s":94,"b33_v":92,"b34_r":92,"b34_s":94,"b34_v":92,"b35_r":94,"b35_s":94,"b35_v":93,"b36_r":93,"b36_s":95,"b36_v":92,"b37_r":93,"b37_s":94,"b37_v":92,"b41_r":92,"b41_s":94,"b41_v":92,"b42_r":92,"b42_s":94,"b42_v":93,"b43_r":97,"b43_s":96,"b43_v":97,"b44_r":93,"b44_s":94,"b44_v":92,"b45_r":92,"b45_s":95,"b45_v":93,"b46_r":92,"b46_s":93,"b46_v":94,"b47_r":94,"b47_s":93,"b47_v":93,"c11_r":93,"c11_s":95,"c11_v":93,"c12_r":94,"c12_s":94,"c12_v":93,"c13_r":94,"c13_s":83,"c13_v":82,"c14_r":94,"c14_s":95,"c14_v":94,"c15_r":94,"c15_s":95,"c15_v":93,"c16_r":93,"c16_s":95,"c16_v":93,"c17_r":93,"c17_s":95,"c17_v":93,"c21_r":94,"c21_s":95,"c21_v":93,"c22_r":94,"c22_s":95,"c22_v":92,"c23_r":99,"c23_s":98,"c23_v":98,"c24_r":92,"c24_s":92,"c24_v":90,"c25_r":94,"c25_s":94,"c25_v":93,"c26_r":93,"c26_s":93,"c26_v":93,"c27_r":94,"c27_s":94,"c27_v":92,"c31_r":94,"c31_s":95,"c31_v":93,"c32_r":93,"c32_s":95,"c32_v":93,"c33_r":93,"c33_s":94,"c33_v":94,"c34_r":93,"c34_s":94,"c34_v":93,"c35_r":97,"c35_s":97,"c35_v":98,"c36_r":93,"c36_s":92,"c36_v":92,"c37_r":94,"c37_s":93,"c37_v":92,"c41_r":94,"c41_s":94,"c41_v":93,"c42_r":107,"c42_s":96,"c42_v":97,"c43_r":97,"c43_s":96,"c43_v":92,"c44_r":94,"c44_s":94,"c44_v":93,"c45_r":93,"c45_s":95,"c45_v":93,"c46_r":94,"c46_s":93,"c46_v":93,"c47_r":94,"c47_s":95,"c47_v":93,"st11_d":117,"st11_r":120,"st11_v":121,"st12_d":118,"st12_r":120,"st12_v":117,"st13_d":115,"st13_r":116,"st13_v":120,"st14_d":115,"st14_r":117,"st14_v":119,"st15_d":118,"st15_r":121,"st15_v":122,"st16_d":116,"st16_r":116,"st16_v":118,"st17_d":120,"st17_r":121,"st17_v":124,"st21_d":122,"st21_r":122,"st21_v":124,"st22_d":125,"st22_r":122,"st22_v":124,"st23_d":118,"st23_r":123,"st23_v":119,"st24_d":120,"st24_r":122,"st24_v":115,"st25_d":119,"st25_r":122,"st25_v":119,"st26_d":117,"st26_r":123,"st26_v":119,"st27_d":122,"st27_r":123,"st27_v":114,"st31_d":129,"st31_r":129,"st31_v":126,"st32_d":128,"st32_r":130,"st32_v":125,"st33_d":129,"st33_r":129,"st33_v":124,"st34_d":128,"st34_r":129,"st34_v":125,"st35_d":127,"st35_r":130,"st35_v":125,"st36_d":127,"st36_r":130,"st36_v":125,"st37_d":125,"st37_r":128,"st37_v":117,"st41_d":95,"st41_r":107,"st41_v":95,"st42_d":97,"st42_r":109,"st42_v":97,"st43_d":96,"st43_r":108,"st43_v":96,"st44_d":108,"st44_r":108,"st44_v":109,"st45_d":97,"st45_r":108,"st45_v":97,"st46_d":110,"st46_r":109,"st46_v":111,"st47_d":97,"st47_r":108,"st47_v":97,"st51_d":98,"st51_r":108,"st51_v":95,"st52_d":97,"st52_r":95,"st52_v":96,"st53_d":96,"st53_r":97,"st53_v":96,"st54_d":96,"st54_r":98,"st54_v":97,"st55_d":95,"st55_r":98,"st55_v":95,"st56_d":97,"st56_r":95,"st56_v":96,"st57_d":98,"st57_r":96,"st57_v":97,"n001_v":120,"n001_s":122,"n001_r":121,"n002_v":121,"n002_s":128,"n002_r":119,"n003_v":116,"n003_s":118,"n003_r":117,"n004_v":117,"n004_s":118,"n004_r":117,"n005_v":119,"n005_s":125,"n005_r":117,"n006_v":116,"n006_s":120,"n006_r":117,"n007_v":116,"n007_s":117,"n007_r":116,"n008_v":113,"n008_s":116,"n008_r":114,"n009_v":115,"n009_s":118,"n009_r":115,"n010_v":113,"n010_s":115,"n010_r":112,"n011_v":113,"n011_s":113,"n011_r":113,"n012_v":117,"n012_s":124,"n012_r":116,"n013_v":109,"n013_s":111,"n013_r":108,"n014_v":122,"n014_s":124,"n014_r":121,"n015_v":107,"n015_s":110,"n015_r":107,"n016_v":111,"n016_s":117,"n016_r":111,"n017_v":103,"n017_s":106,"n017_r":103,"n018_v":109,"n018_s":110,"n018_r":109,"n019_v":108,"n019_s":110,"n019_r":110,"n020_v":108,"n020_s":110,"n020_r":110,"n021_v":108,"n021_s":111,"n021_r":111,"n022_v":107,"n022_s":110,"n022_r":110,"n023_v":108,"n023_s":110,"n023_r":110,"n024_v":107,"n024_s":109,"n024_r":110,"n025_v":108,"n025_s":111,"n025_r":111,"n026_v":105,"n026_s":107,"n026_r":105,"n027_v":111,"n027_s":112,"n027_r":111,"n028_v":118,"n028_s":118,"n028_r":116,"n029_v":108,"n029_s":109,"n029_r":107,"n030_v":108,"n030_s":109,"n030_r":107,"n031_v":106,"n031_s":108,"n031_r":106,"n032_v":108,"n032_s":109,"n032_r":107,"n033_v":107,"n033_s":108,"n033_r":107,"n034_v":105,"n034_s":105,"n034_r":104,"n035_v":106,"n035_s":107,"n035_r":106,"n036_v":107,"n036_s":109,"n036_r":108,"n037_v":104,"n037_s":105,"n037_r":103,"n038_v":105,"n038_s":106,"n038_r":107,"n039_v":118,"n039_s":109,"n039_r":116,"n040_v":107,"n040_s":108,"n040_r":106,"n041_v":107,"n041_s":108,"n041_r":107,"n042_v":107,"n042_s":108,"n042_r":107,"n043_v":107,"n043_s":108,"n043_r":116,"n044_v":109,"n044_s":111,"n044_r":109,"n045_v":104,"n045_s":107,"n045_r":104,"n046_v":110,"n046_s":112,"n046_r":109,"n047_v":110,"n047_s":113,"n047_r":111,"n048_v":110,"n048_s":113,"n048_r":110,"n049_v":107,"n049_s":110,"n049_r":108,"n050_v":109,"n050_s":111,"n050_r":108,"n051_v":109,"n051_s":111,"n051_r":108,"n052_v":106,"n052_s":107,"n052_r":111,"n053_v":112,"n053_s":110,"n053_r":111,"n054_v":117,"n054_s":120,"n054_r":116,"n055_v":108,"n055_s":108,"n055_r":108,"n056_v":108,"n056_s":110,"n056_r":108,"n057_v":107,"n057_s":109,"n057_r":106,"n058_v":108,"n058_s":111,"n058_r":108,"n059_v":103,"n059_s":104,"n059_r":102,"n060_v":108,"n060_s":111,"n060_r":117,"n061_v":105,"n061_s":107,"n061_r":105,"n062_v":102,"n062_s":104,"n062_r":110,"n063_v":106,"n063_s":108,"n063_r":106,"n064_v":106,"n064_s":108,"n064_r":106,"n065_v":103,"n065_s":105,"n065_r":103,"n066_v":107,"n066_s":108,"n066_r":117,"n067_v":106,"n067_s":108,"n067_r":106,"n068_v":106,"n068_s":108,"n068_r":106,"n069_v":107,"n069_s":109,"n069_r":107,"n070_v":109,"n070_s":111,"n070_r":117,"n071_v":110,"n071_s":112,"n071_r":119,"n072_v":109,"n072_s":110,"n072_r":111,"n073_v":109,"n073_s":110,"n073_r":108,"n074_v":107,"n074_s":108,"n074_r":108,"n075_v":106,"n075_s":107,"n075_r":109,"n076_v":106,"n076_s":107,"n076_r":109,"n077_v":107,"n077_s":108,"n077_r":106,"n078_v":104,"n078_s":106,"n078_r":105,"n079_v":106,"n079_s":108,"n079_r":109,"n080_v":106,"n080_s":128,"n080_r":109,"n081_v":106,"n081_s":108,"n081_r":106,"n082_v":102,"n082_s":104,"n082_r":106,"n083_v":113,"n083_s":113,"n083_r":106,"n084_v":104,"n084_s":107,"n084_r":114,"n085_v":107,"n085_s":109,"n085_r":108,"n086_v":105,"n086_s":107,"n086_r":100,"n087_v":107,"n087_s":109,"n087_r":106,"n088_v":106,"n088_s":123,"n088_r":106,"n089_v":109,"n089_s":110,"n089_r":108,"n090_v":108,"n090_s":109,"n090_r":107,"n091_v":108,"n091_s":110,"n091_r":107,"n092_v":105,"n092_s":107,"n092_r":104,"n093_v":116,"n093_s":122,"n093_r":117,"n094_v":109,"n094_s":111,"n094_r":108,"n095_v":109,"n095_s":112,"n095_r":109,"n096_v":103,"n096_s":105,"n096_r":103,"n097_v":127,"n097_s":109,"n097_r":119,"n098_v":98,"n098_s":98,"n098_r":99,"n099_v":98,"n099_s":98,"n099_r":108,"n100_v":106,"n100_s":111,"n100_r":107,"n101_v":104,"n101_s":108,"n101_r":110,"n102_v":114,"n102_s":114,"n102_r":114,"n103_v":103,"n103_s":107,"n103_r":102,"n104_v":104,"n104_s":108,"n104_r":108,"n105_v":105,"n105_s":108,"n105_r":109,"n106_v":106,"n106_s":110,"n106_r":101,"n107_v":128,"n107_s":127,"n107_r":119,"n108_v":109,"n108_s":109,"n108_r":109,"n109_v":107,"n109_s":107,"n109_r":107,"n110_v":105,"n110_s":105,"n110_r":105,"n111_v":106,"n111_s":107,"n111_r":108,"n112_v":108,"n112_s":108,"n112_r":109,"n113_v":108,"n113_s":108,"n113_r":108,"n114_v":107,"n114_s":107,"n114_r":108,"n115_v":115,"n115_s":119,"n115_r":118,"n116_v":107,"n116_s":110,"n116_r":108,"n117_v":105,"n117_s":116,"n117_r":115,"n118_v":106,"n118_s":110,"n118_r":109,"n119_v":107,"n119_s":113,"n119_r":109,"n120_v":105,"n120_s":108,"n120_r":107,"n121_v":107,"n121_s":108,"n121_r":108,"n122_v":98,"n122_s":98,"n122_r":109,"n123_v":105,"n123_s":105,"n123_r":105,"n124_v":106,"n124_s":108,"n124_r":106,"n125_v":105,"n125_s":108,"n125_r":106,"n126_v":105,"n126_s":110,"n126_r":112,"n127_v":100,"n127_s":101,"n127_r":111,"n128_v":108,"n128_s":111,"n128_r":108,"n129_v":105,"n129_s":107,"n129_r":104,"n130_v":106,"n130_s":110,"n130_r":106,"n131_v":108,"n131_s":111,"n131_r":106,"n132_v":107,"n132_s":111,"n132_r":106,"n133_v":118,"n133_s":118,"n133_r":115,"n134_v":104,"n134_s":106,"n134_r":109,"n135_v":106,"n135_s":110,"n135_r":106,"n136_v":105,"n136_s":109,"n136_r":103,"n137_v":107,"n137_s":110,"n137_r":107,"n138_v":99,"n138_s":102,"n138_r":101,"n139_v":100,"n139_s":102,"n139_r":101,"n140_v":95,"n140_s":96,"n140_r":96,"n141_v":95,"n141_s":127,"n141_r":97,"n142_v":100,"n142_s":108,"n142_r":104,"n143_v":97,"n143_s":100,"n143_r":99,"n144_v":83,"n144_s":99,"n144_r":98,"n145_v":104,"n145_s":110,"n145_r":102,"n146_v":98,"n146_s":100,"n146_r":100,"n147_v":95,"n147_s":96,"n147_r":97,"n148_v":97,"n148_s":100,"n148_r":100,"n149_v":97,"n149_s":100,"n149_r":100,"n150_v":96,"n150_s":98,"n150_r":98,"n151_v":98,"n151_s":101,"n151_r":100,"n152_v":94,"n152_s":97,"n152_r":97,"n153_v":96,"n153_s":99,"n153_r":98,"n154_v":97,"n154_s":101,"n154_r":101,"n155_v":93,"n155_s":95,"n155_r":95,"n156_v":96,"n156_s":98,"n156_r":98,"n157_v":97,"n157_s":101,"n157_r":102,"n158_v":95,"n158_s":99,"n158_r":99,"n159_v":96,"n159_s":98,"n159_r":98,"n160_v":94,"n160_s":104,"n160_r":103,"n161_v":95,"n161_s":97,"n161_r":98,"n162_v":93,"n162_s":96,"n162_r":96,"n163_v":95,"n163_s":100,"n163_r":100,"n164_v":94,"n164_s":98,"n164_r":97,"n165_v":100,"n165_s":104,"n165_r":104,"n166_v":95,"n166_s":99,"n166_r":99,"n167_v":96,"n167_s":98,"n167_r":98,"n168_v":102,"n168_s":108,"n168_r":105,"n169_v":97,"n169_s":100,"n169_r":100,"n170_v":106,"n170_s":110,"n170_r":109,"n171_v":94,"n171_s":97,"n171_r":99,"n172_v":97,"n172_s":101,"n172_r":101,"n173_v":98,"n173_s":103,"n173_r":102,"n174_v":97,"n174_s":102,"n174_r":101,"n175_v":96,"n175_s":100,"n175_r":101,"n176_v":101,"n176_s":100,"n176_r":97,"n177_v":101,"n177_s":107,"n177_r":98,"n178_v":95,"n178_s":105,"n178_r":102,"n179_v":97,"n179_s":96,"n179_r":93,"n180_v":99,"n180_s":101,"n180_r":97,"n181_v":99,"n181_s":100,"n181_r":97,"n182_v":94,"n182_s":101,"n182_r":106,"n183_v":94,"n183_s":103,"n183_r":79,"n184_v":96,"n184_s":97,"n184_r":96,"n185_v":95,"n185_s":97,"n185_r":96,"n186_v":100,"n186_s":100,"n186_r":109,"n187_v":94,"n187_s":103,"n187_r":103,"n188_v":93,"n188_s":103,"n188_r":102,"n189_v":96,"n189_s":95,"n189_r":108,"n190_v":105,"n190_s":119,"n190_r":103,"n191_v":95,"n191_s":104,"n191_r":108,"n192_v":96,"n192_s":106,"n192_r":106,"n193_v":94,"n193_s":105,"n193_r":105,"n194_v":96,"n194_s":106,"n194_r":106,"n195_v":97,"n195_s":97,"n195_r":108,"n196_v":95,"n196_s":106,"n196_r":106,"n197_v":96,"n197_s":104,"n197_r":105,"n198_v":92,"n198_s":101,"n198_r":101,"n199_v":93,"n199_s":101,"n199_r":101,"n200_v":100,"n200_s":100,"n200_r":107,"n201_v":94,"n201_s":102,"n201_r":101,"n202_v":94,"n202_s":103,"n202_r":102,"n203_v":93,"n203_s":101,"n203_r":101,"n204_v":96,"n204_s":103,"n204_r":103,"n205_v":95,"n205_s":102,"n205_r":102,"n206_v":96,"n206_s":103,"n206_r":103,"n207_v":97,"n207_s":116,"n207_r":116,"n208_v":95,"n208_s":115,"n208_r":114,"n209_v":98,"n209_s":121,"n209_r":121,"n210_v":103,"n210_s":121,"n210_r":121,"n211_v":97,"n211_s":110,"n211_r":111,"n212_v":93,"n212_s":105,"n212_r":106,"n213_v":93,"n213_s":107,"n213_r":106,"n214_v":94,"n214_s":107,"n214_r":107,"n215_v":98,"n215_s":111,"n215_r":110,"n216_v":108,"n216_s":107,"n216_r":123,"n217_v":96,"n217_s":107,"n217_r":107,"n218_v":95,"n218_s":107,"n218_r":108,"n219_v":99,"n219_s":109,"n219_r":112,"n220_v":105,"n220_s":107,"n220_r":120,"n221_v":97,"n221_s":109,"n221_r":110,"n222_v":97,"n222_s":110,"n222_r":109,"n223_v":94,"n223_s":107,"n223_r":108,"n224_v":93,"n224_s":107,"n224_r":114,"n225_v":96,"n225_s":108,"n225_r":104,"n226_v":98,"n226_s":109,"n226_r":106,"n227_v":95,"n227_s":106,"n227_r":103,"n228_v":94,"n228_s":106,"n228_r":102,"n229_v":95,"n229_s":106,"n229_r":102,"n230_v":93,"n230_s":105,"n230_r":100,"n231_v":95,"n231_s":108,"n231_r":99,"n232_v":96,"n232_s":105,"n232_r":98,"n233_v":96,"n233_s":106,"n233_r":97,"n234_v":94,"n234_s":106,"n234_r":97,"n235_v":95,"n235_s":102,"n235_r":97,"n236_v":97,"n236_s":113,"n236_r":100,"n237_v":98,"n237_s":116,"n237_r":101,"n238_v":98,"n238_s":116,"n238_r":101,"n239_v":93,"n239_s":114,"n239_r":105,"n240_v":93,"n240_s":114,"n240_r":96,"n241_v":102,"n241_s":115,"n241_r":105,"n242_v":94,"n242_s":109,"n242_r":97,"n243_v":97,"n243_s":112,"n243_r":98,"n244_v":97,"n244_s":112,"n244_r":97,"n245_v":94,"n245_s":111,"n245_r":93,"n246_v":97,"n246_s":111,"n246_r":97,"n247_v":97,"n247_s":97,"n247_r":106,"n248_v":97,"n248_s":112,"n248_r":96,"n249_v":95,"n249_s":113,"n249_r":97,"n250_v":96,"n250_s":110,"n250_r":96,"n251_v":95,"n251_s":113,"n251_r":97,"n252_v":97,"n252_s":90,"n252_r":96,"n253_v":96,"n253_s":112,"n253_r":96,"n254_v":100,"n254_s":100,"n254_r":96,"n255_v":96,"n255_s":114,"n255_r":95,"n256_v":93,"n256_s":113,"n256_r":93,"n257_v":96,"n257_s":113,"n257_r":96,"n258_v":95,"n258_s":111,"n258_r":95,"n259_v":96,"n259_s":114,"n259_r":95,"n260_v":95,"n260_s":111,"n260_r":96,"n261_v":95,"n261_s":113,"n261_r":96,"n262_v":93,"n262_s":112,"n262_r":95,"n263_v":97,"n263_s":108,"n263_r":96,"n264_v":96,"n264_s":109,"n264_r":97,"n265_v":101,"n265_s":99,"n265_r":100,"n266_v":99,"n266_s":110,"n266_r":98,"n267_v":92,"n267_s":103,"n267_r":93,"n268_v":96,"n268_s":106,"n268_r":96,"n269_v":105,"n269_s":101,"n269_r":104,"n270_v":95,"n270_s":106,"n270_r":95,"n271_v":93,"n271_s":103,"n271_r":92,"n272_v":97,"n272_s":105,"n272_r":98,"n273_v":100,"n273_s":105,"n273_r":96,"n274_v":98,"n274_s":107,"n274_r":98,"n275_v":97,"n275_s":104,"n275_r":98,"n276_v":94,"n276_s":104,"n276_r":93,"n277_v":98,"n277_s":106,"n277_r":99,"n278_v":95,"n278_s":105,"n278_r":95,"n279_v":95,"n279_s":114,"n279_r":95,"n280_v":99,"n280_s":106,"n280_r":98,"n281_v":96,"n281_s":105,"n281_r":95,"n282_v":96,"n282_s":108,"n282_r":96,"n283_v":100,"n283_s":107,"n283_r":97,"n284_v":98,"n284_s":108,"n284_r":97,"n285_v":99,"n285_s":109,"n285_r":97,"n286_v":100,"n286_s":108,"n286_r":96,"n287_v":98,"n287_s":109,"n287_r":97,"n288_v":100,"n288_s":108,"n288_r":95,"n289_v":99,"n289_s":107,"n289_r":97,"n290_v":98,"n290_s":108,"n290_r":98,"n291_v":99,"n291_s":107,"n291_r":97,"n292_v":97,"n292_s":110,"n292_r":97,"n293_v":98,"n293_s":114,"n293_r":97,"n294_v":98,"n294_s":106,"n294_r":97,"n295_v":97,"n295_s":103,"n295_r":96,"n296_v":96,"n296_s":104,"n296_r":94,"n297_v":97,"n297_s":98,"n297_r":93,"n298_v":93,"n298_s":103,"n298_r":97,"n299_v":97,"n299_s":106,"n299_r":97,"n300_v":97,"n300_s":106,"n300_r":98,"n301_v":98,"n301_s":105,"n301_r":100,"n302_v":98,"n302_s":103,"n302_r":97,"n303_v":97,"n303_s":100,"n303_r":97,"n304_v":98,"n304_s":105,"n304_r":98,"n305_v":98,"n305_s":105,"n305_r":97,"n306_v":97,"n306_s":107,"n306_r":98,"n307_v":98,"n307_s":107,"n307_r":98,"n308_v":98,"n308_s":106,"n308_r":98,"n309_v":95,"n309_s":104,"n309_r":95,"n310_v":97,"n310_s":106,"n310_r":97,"n311_v":98,"n311_s":104,"n311_r":98,"n312_v":98,"n312_s":106,"n312_r":96,"n313_v":98,"n313_s":108,"n313_r":99,"n314_v":98,"n314_s":104,"n314_r":98,"n315_v":98,"n315_s":107,"n315_r":98,"n316_v":98,"n316_s":107,"n316_r":99,"n317_v":98,"n317_s":108,"n317_r":99,"n328_v":98,"n328_s":108,"n328_r":98,"n329_v":96,"n329_s":103,"n329_r":97,"n330_v":96,"n330_s":104,"n330_r":95,"n331_v":93,"n331_s":101,"n331_r":93,"n332_v":95,"n332_s":105,"n332_r":95,"n333_v":98,"n333_s":98,"n333_r":99,"n334_v":94,"n334_s":104,"n334_r":94,"n335_v":96,"n335_s":103,"n335_r":94,"n336_v":96,"n336_s":105,"n336_r":96,"n337_v":95,"n337_s":96,"n337_r":93,"n338_v":94,"n338_s":103,"n338_r":95,"n339_v":94,"n339_s":104,"n339_r":95,"n340_v":95,"n340_s":106,"n340_r":94,"n341_v":94,"n341_s":107,"n341_r":94,"n342_v":95,"n342_s":107,"n342_r":95,"n343_v":96,"n343_s":107,"n343_r":96,"n344_v":95,"n344_s":106,"n344_r":90,"n345_v":96,"n345_s":105,"n345_r":94,"n346_v":96,"n346_s":107,"n346_r":94,"n347_v":95,"n347_s":105,"n347_r":94,"n348_v":96,"n348_s":109,"n348_r":96,"n349_v":97,"n349_s":108,"n349_r":95,"n350_v":97,"n350_s":107,"n350_r":96,"n351_v":95,"n351_s":105,"n351_r":96,"n352_v":96,"n352_s":107,"n352_r":95,"n353_v":98,"n353_s":98,"n353_r":98,"n354_v":95,"n354_s":105,"n354_r":95,"n355_v":95,"n355_s":85,"n355_r":95,"n356_v":95,"n356_s":106,"n356_r":94,"n357_v":95,"n357_s":99,"n357_r":93,"n358_v":95,"n358_s":102,"n358_r":95,"n359_v":94,"n359_s":96,"n359_r":94,"n360_v":94,"n360_s":105,"n360_r":92,"n361_v":94,"n361_s":100,"n361_r":94,"n362_v":96,"n362_s":97,"n362_r":95,"n363_v":95,"n363_s":104,"n363_r":96,"n364_v":95,"n364_s":102,"n364_r":94,"n365_v":95,"n365_s":100,"n365_r":96,"n366_v":96,"n366_s":103,"n366_r":95,"n367_v":93,"n367_s":96,"n367_r":93,"n368_v":98,"n368_s":103,"n368_r":97,"n369_v":92,"n369_s":85,"n369_r":92,"n370_v":94,"n370_s":102,"n370_r":95,"n371_v":96,"n371_s":102,"n371_r":96,"n372_v":93,"n372_s":102,"n372_r":94,"n373_v":95,"n373_s":101,"n373_r":95,"n374_v":93,"n374_s":98,"n374_r":92,"n375_v":96,"n375_s":102,"n375_r":95,"n376_v":95,"n376_s":102,"n376_r":95,"n377_v":96,"n377_s":102,"n377_r":96,"n378_v":94,"n378_s":103,"n378_r":95,"n379_v":92,"n379_s":100,"n379_r":91,"n380_v":94,"n380_s":103,"n380_r":95,"n381_v":94,"n381_s":104,"n381_r":94,"n382_v":97,"n382_s":105,"n382_r":97,"n383_v":95,"n383_s":105,"n383_r":96,"n384_v":96,"n384_s":105,"n384_r":97,"n385_v":95,"n385_s":106,"n385_r":96,"n386_v":92,"n386_s":103,"n386_r":93,"n387_v":97,"n387_s":105,"n387_r":97,"n388_v":98,"n388_s":106,"n388_r":97,"n389_v":96,"n389_s":105,"n389_r":96,"n390_v":95,"n390_s":106,"n390_r":96,"n391_v":96,"n391_s":102,"n391_r":96,"n392_v":92,"n392_s":100,"n392_r":102,"n393_v":97,"n393_s":102,"n393_r":107,"n394_v":95,"n394_s":101,"n394_r":104,"n395_v":96,"n395_s":101,"n395_r":106,"n396_v":94,"n396_s":104,"n396_r":105,"n397_v":95,"n397_s":104,"n397_r":95,"n398_v":96,"n398_s":104,"n398_r":94,"n399_v":94,"n399_s":105,"n399_r":94,"n400_v":93,"n400_s":103,"n400_r":95,"n401_v":93,"n401_s":101,"n401_r":95,"n402_v":97,"n402_s":102,"n402_r":98,"n403_v":95,"n403_s":103,"n403_r":98,"n404_v":92,"n404_s":101,"n404_r":94,"n405_v":94,"n405_s":104,"n405_r":96,"st61_v":126,"st61_s":125,"st61_r":126,"st62_v":145,"st62_s":125,"st62_r":133,"st63_v":127,"st63_s":122,"st63_r":124,"st64_v":127,"st64_s":124,"st64_r":127,"st65_v":128,"st65_s":125,"st65_r":127,"st66_v":127,"st66_s":124,"st66_r":126,"st71_v":126,"st71_s":123,"st71_r":122,"st72_v":122,"st72_s":116,"st72_r":119,"st73_v":125,"st73_s":121,"st73_r":122,"st74_v":125,"st74_s":120,"st74_r":121,"st75_v":123,"st75_s":118,"st75_r":119,"st76_v":122,"st76_s":117,"st76_r":119,"st77_v":123,"st77_s":117,"st77_r":119,"st78_v":120,"st78_s":116,"st78_r":124,"st81_v":145,"st81_s":145,"st81_r":145,"st82_v":145,"st82_s":145,"st82_r":145,"st83_v":145,"st83_s":145,"st83_r":145,"st84_v":123,"st84_s":145,"st84_r":145,"st85_v":125,"st85_s":124,"st85_r":123,"st86_v":123,"st86_s":122,"st86_r":122,"st87_v":124,"st87_s":123,"st87_r":123,"st88_v":145,"st88_s":111,"st88_r":109};
  const KOPF_SKAL = {"a11":0.989,"a12":0.989,"a13":0.989,"a14":0.979,"a15":1.0,"a16":0.989,"a17":1.0,"a21":1.0,"a22":0.989,"a23":1.0,"a24":1.0,"a25":0.989,"a26":1.0,"a27":0.989,"a31":0.989,"a32":1.0,"a33":0.979,"a34":0.989,"a35":0.989,"a36":0.989,"a37":0.989,"a41":1.0,"a42":1.0,"a43":0.989,"a44":1.0,"a45":0.989,"a46":0.989,"a47":1.0,"b11":1.0,"b12":1.0,"b13":1.0,"b14":1.0,"b15":1.0,"b16":1.011,"b17":1.0,"b21":1.0,"b22":1.011,"b23":1.011,"b24":0.969,"b25":1.0,"b26":1.0,"b27":1.011,"b31":1.0,"b32":1.0,"b33":1.011,"b34":1.011,"b35":1.0,"b36":1.011,"b37":1.011,"b41":1.011,"b42":1.0,"b43":1.0,"b44":1.011,"b45":1.0,"b46":0.989,"b47":1.0,"c11":1.0,"c12":1.0,"c13":1.134,"c14":0.989,"c15":1.0,"c16":1.0,"c17":1.0,"c21":1.0,"c22":1.011,"c23":0.99,"c24":1.033,"c25":1.0,"c26":1.0,"c27":1.011,"c31":1.0,"c32":1.0,"c33":0.989,"c34":1.0,"c35":0.99,"c36":1.011,"c37":1.011,"c41":1.0,"c42":1.0,"c43":1.011,"c44":1.0,"c45":1.0,"c46":1.0,"c47":1.0,"st11":0.78,"st12":0.78,"st13":0.78,"st14":0.78,"st15":0.78,"st16":0.78,"st17":0.78,"st21":0.78,"st22":0.78,"st23":0.78,"st24":0.78,"st25":0.78,"st26":0.78,"st27":0.78,"st31":0.78,"st32":0.78,"st33":0.78,"st34":0.78,"st35":0.78,"st36":0.78,"st37":0.78,"st41":0.95,"st42":0.95,"st43":0.95,"st44":0.95,"st45":0.95,"st46":0.78,"st47":0.95,"st51":0.87,"st52":0.87,"st53":0.87,"st54":0.87,"st55":0.87,"st56":0.87,"st57":0.87,"n001":0.82,"n002":0.82,"n003":0.82,"n004":0.82,"n005":0.82,"n006":0.82,"n007":0.82,"n008":0.832,"n009":0.82,"n010":0.832,"n011":0.832,"n012":0.82,"n013":0.862,"n014":0.82,"n015":0.879,"n016":0.847,"n017":0.913,"n018":0.862,"n019":0.87,"n020":0.87,"n021":0.87,"n022":0.879,"n023":0.87,"n024":0.879,"n025":0.87,"n026":0.895,"n027":0.847,"n028":0.82,"n029":0.87,"n030":0.87,"n031":0.887,"n032":0.87,"n033":0.879,"n034":0.895,"n035":0.887,"n036":0.879,"n037":0.904,"n038":0.895,"n039":0.82,"n040":0.879,"n041":0.879,"n042":0.879,"n043":0.879,"n044":0.862,"n045":0.904,"n046":0.855,"n047":0.855,"n048":0.855,"n049":0.879,"n050":0.862,"n051":0.862,"n052":0.887,"n053":0.839,"n054":0.82,"n055":0.87,"n056":0.87,"n057":0.879,"n058":0.87,"n059":0.913,"n060":0.87,"n061":0.895,"n062":0.922,"n063":0.887,"n064":0.887,"n065":0.913,"n066":0.879,"n067":0.887,"n068":0.887,"n069":0.879,"n070":0.862,"n071":0.855,"n072":0.862,"n073":0.862,"n074":0.879,"n075":0.887,"n076":0.887,"n077":0.879,"n078":0.904,"n079":0.887,"n080":0.887,"n081":0.887,"n082":0.922,"n083":0.832,"n084":0.904,"n085":0.879,"n086":0.895,"n087":0.879,"n088":0.887,"n089":0.862,"n090":0.87,"n091":0.87,"n092":0.895,"n093":0.82,"n094":0.862,"n095":0.862,"n096":0.913,"n097":0.82,"n098":0.99,"n099":0.99,"n100":0.887,"n101":0.904,"n102":0.825,"n103":0.913,"n104":0.904,"n105":0.895,"n106":0.887,"n107":0.82,"n108":0.862,"n109":0.879,"n110":0.895,"n111":0.887,"n112":0.87,"n113":0.87,"n114":0.879,"n115":0.82,"n116":0.879,"n117":0.895,"n118":0.887,"n119":0.879,"n120":0.895,"n121":0.879,"n122":0.99,"n123":0.895,"n124":0.887,"n125":0.895,"n126":0.895,"n127":0.97,"n128":0.87,"n129":0.895,"n130":0.887,"n131":0.87,"n132":0.879,"n133":0.82,"n134":0.904,"n135":0.887,"n136":0.895,"n137":0.879,"n138":0.949,"n139":0.94,"n140":0.989,"n141":0.989,"n142":0.94,"n143":0.969,"n144":1.05,"n145":0.904,"n146":0.959,"n147":0.989,"n148":0.969,"n149":0.969,"n150":0.979,"n151":0.959,"n152":1.0,"n153":0.979,"n154":0.969,"n155":1.011,"n156":0.979,"n157":0.969,"n158":0.989,"n159":0.979,"n160":1.0,"n161":0.989,"n162":1.011,"n163":0.989,"n164":1.0,"n165":0.94,"n166":0.989,"n167":0.979,"n168":0.922,"n169":0.969,"n170":0.887,"n171":1.0,"n172":0.969,"n173":0.959,"n174":0.969,"n175":0.979,"n176":0.931,"n177":0.931,"n178":0.989,"n179":0.969,"n180":0.949,"n181":0.949,"n182":1.0,"n183":1.0,"n184":0.979,"n185":0.989,"n186":0.94,"n187":1.0,"n188":1.011,"n189":1.0,"n190":0.895,"n191":0.989,"n192":0.979,"n193":1.0,"n194":0.979,"n195":1.0,"n196":0.989,"n197":0.979,"n198":1.022,"n199":1.011,"n200":0.97,"n201":1.0,"n202":1.0,"n203":1.011,"n204":0.979,"n205":0.989,"n206":0.979,"n207":0.969,"n208":0.989,"n209":0.959,"n210":0.913,"n211":0.969,"n212":1.011,"n213":1.011,"n214":1.0,"n215":0.959,"n216":0.87,"n217":0.979,"n218":0.989,"n219":0.949,"n220":0.895,"n221":0.969,"n222":0.969,"n223":1.0,"n224":1.011,"n225":0.979,"n226":0.959,"n227":0.989,"n228":1.0,"n229":0.989,"n230":1.011,"n231":0.989,"n232":0.979,"n233":0.979,"n234":1.0,"n235":0.989,"n236":0.969,"n237":0.959,"n238":0.959,"n239":1.011,"n240":1.011,"n241":0.922,"n242":1.0,"st61":0.78,"st62":0.78,"st63":0.78,"st64":0.78,"st65":0.78,"st66":0.78,"st71":0.78,"st72":0.78,"st73":0.78,"st74":0.78,"st75":0.78,"st76":0.78,"st77":0.78,"st78":0.78,"st81":0.78,"st82":0.78,"st83":0.78,"st84":0.78,"st85":0.78,"st86":0.78,"st87":0.78,"st88":0.78};
  // V10.0: Seitenbilder (_s), deren Gesicht im Bild nach LINKS schaut (automatisch erkannt + geprüft). Alle anderen schauen nach rechts.
  const KOPF_ANSICHT = {"st11_s":1.25,"st12_s":1.208,"st13_s":1.24,"st14_s":1.229,"st15_s":1.26,"st16_s":1.219,"st17_s":1.281,"st21_s":1.268,"st22_s":1.268,"st23_s":1.216,"st24_s":1.175,"st25_s":1.216,"st26_s":1.216,"st27_s":1.165,"st31_s":1.3,"st32_s":1.292,"st33_s":1.281,"st34_s":1.292,"st35_s":1.292,"st36_s":1.292,"st37_s":1.208,"st44_s":1.125,"st46_s":1.146,"n039_s":1.083,"n083_r":1.066,"n097_s":1.167,"n097_r":1.068,"n107_r":1.076,"n183_r":1.177,"n252_s":1.078,"n288_r":1.064,"n355_s":1.119,"n369_s":1.082,"st62_s":1.16,"st62_r":1.098,"st72_s":1.061,"st88_s":1.3,"st88_r":1.3,"n141_s":0.85,"n239_s":0.85,"n207_s":0.85,"n207_r":0.85,"n209_s":0.85,"n209_r":0.85,"n224_r":0.85,"n240_s":0.85,"n256_s":0.85,"n208_r":0.85,"n208_s":0.85,"n261_s":0.85,"n259_s":0.85,"n279_s":0.85,"n080_s":0.85,"n144_s":0.85,"n257_s":0.85,"n255_s":0.85,"n251_s":0.85,"n236_s":0.85,"n144_r":0.85,"n238_s":0.85,"n258_s":0.85,"n260_s":0.85,"n262_s":0.85,"n210_r":0.85,"n210_s":0.85,"n237_s":0.85,"n293_s":0.85,"n243_s":0.85,"n253_s":0.85,"st84_r":0.85,"n225_s":0.85,"n244_s":0.85,"n245_s":0.85,"st84_s":0.85,"n223_r":0.86,"n211_r":0.86,"n246_s":0.86,"n242_s":0.86,"n234_s":0.86,"n249_s":0.86,"n264_s":0.86,"n213_s":0.86,"n224_s":0.86,"n342_s":0.86,"a43_r":0.86,"n341_s":0.86,"c13_r":0.87,"n212_r":0.87,"n216_r":0.87,"n290_s":0.87,"n088_s":0.87,"n241_s":0.87,"n191_r":0.87,"n182_r":0.87,"n231_s":0.87,"n250_s":0.87,"n292_s":0.87,"n212_s":0.87,"n215_s":0.87,"n223_s":0.87,"n348_s":0.87,"n211_s":0.88,"n213_r":0.88,"n219_r":0.88,"n220_r":0.88,"n189_r":0.88,"n221_s":0.88,"n239_r":0.88,"n282_s":0.88,"n347_s":0.88,"n214_s":0.88,"n248_s":0.88,"n317_s":0.88,"n339_s":0.88,"n334_s":0.88,"n343_s":0.88,"n378_s":0.88,"n381_s":0.88,"n338_s":0.88,"n352_s":0.88,"n386_s":0.88,"n230_s":0.88,"n263_s":0.88,"st51_r":0.88,"n217_s":0.88,"a42_r":0.88,"n214_r":0.89,"n218_r":0.89,"n215_r":0.89,"n221_r":0.89,"n160_s":0.89,"n188_s":0.89,"n190_s":0.89,"n193_r":0.89,"n183_s":0.89,"n349_s":0.89,"n350_s":0.89,"st42_r":0.89,"st43_r":0.89,"c42_r":0.89,"n099_r":0.89,"n195_r":0.89,"n218_s":0.89,"n228_s":0.89,"n274_s":0.89,"n287_s":0.89,"n328_s":0.89,"n329_s":0.89,"n405_s":0.89,"n222_s":0.89,"n332_s":0.89,"n360_s":0.89,"n232_s":0.89,"n267_s":0.89,"n219_s":0.89,"n233_s":0.89,"n396_r":0.89,"n127_r":0.89,"n227_s":0.89,"n285_s":0.89,"st41_r":0.89,"n271_s":0.89,"n298_s":0.89,"b35_r":1.12};   // V11.46: Ausgleich, wo der Kopf von der Seite/hinten kleiner wirkte
  const SEITE_LINKS = new Set([]);   // V10.0: leer – die Seitenbilder wurden direkt korrigiert (alle schauen nach rechts)
  function kopfBild(img, meta, key){
    const w = img.naturalWidth, H = img.naturalHeight, sk = H / meta.h;
    const kinnY = (key && KOPF_KINN[key] != null) ? KOPF_KINN[key] : meta.kinn;
    const schnitt = Math.round((kinnY + 2) * sk);
    const c = document.createElement('canvas'); c.width = w; c.height = schnitt;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    // weicher Übergang am Kinn
    const d = g.getImageData(0, schnitt - 4, w, 4), px = d.data;
    for (let y = 0; y < 4; y++) for (let x = 0; x < w; x++){ const i = (y * w + x) * 4; px[i + 3] = px[i + 3] * (1 - y / 4); }
    g.putImageData(d, 0, schnitt - 4);
    c.voll = H;
    const basis = key ? key.replace(/_[vrsd]$/, '') : '';
    c.skal = (KOPF_SKAL[basis] || 1) * ((key && KOPF_ANSICHT[key]) || 1);   // V11.46: Seiten-/Hinterkopf so groß wie von vorne
    return c;
  }
  // Trikot-Textur für den Oberkörper (vorn, hinten, seitlich) – mit Muster, Kragen, Nummer und Flagge
  function torsoTextur(kit, nummer, ansicht, haut, stufe){
    const W = 128, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = kit.t; g.fillRect(0, 0, W, H);
    const m2 = kit.m2 || kit.t, m3 = kit.m3 || m2, mu = kit.muster;
    if (mu === 'streifen'){ g.fillStyle = m2; for (let i = 1; i < 9; i += 2) g.fillRect(i * W / 9, 0, W / 9, H); }
    if (mu === 'karo' || mu === 'kariert'){ g.fillStyle = m2; for (let r = 0; r < 6; r++) for (let q = 0; q < 8; q++) if ((r + q) % 2) g.fillRect(q * W / 8, r * H / 6, W / 8, H / 6); }
    if (mu === 'quer') for (let i = 1; i < 9; i += 2){ g.fillStyle = (i % 4 === 1) ? m2 : m3; g.fillRect(0, H * .12 + i * H / 10, W, H / 14); }
    if (mu === 'querband'){ g.globalAlpha = .85; g.fillStyle = m2; g.fillRect(0, H * .3, W, H * .14); g.globalAlpha = 1; }
    if (mu === 'diagonal'){ g.globalAlpha = .9; g.fillStyle = m2; g.beginPath(); g.moveTo(0, H * .98); g.lineTo(W, H * .38); g.lineTo(W, H * .56); g.lineTo(0, H * 1.16); g.fill(); g.globalAlpha = 1; }
    if (mu === 'schraeg'){ g.globalAlpha = .55; g.fillStyle = m2; for (let i = -3; i < 6; i++){ g.beginPath(); g.moveTo(i * 30, H); g.lineTo(i * 30 + 14, H); g.lineTo(i * 30 + 74, 0); g.lineTo(i * 30 + 60, 0); g.fill(); } g.globalAlpha = 1; }
    if (mu === 'brustband' && ansicht === 'v' && kit.band) kit.band.forEach((fb, i) => { g.fillStyle = fb; g.fillRect(W * .55 + i * 7, 0, 7, H); });
    if (mu === 'seitenzacken' && ansicht !== 'r') for (let i = 0; i < 7; i++){ g.fillStyle = i % 2 ? m2 : m3; g.beginPath(); g.moveTo(0, 10 + i * 17); g.lineTo(18, 18 + i * 17); g.lineTo(0, 26 + i * 17); g.fill(); }
    // Kragen
    const kr = kit.kragen || kit.n;
    if (ansicht === 'v'){
      g.fillStyle = kr; g.beginPath(); g.moveTo(42, 0); g.lineTo(64, 26); g.lineTo(86, 0); g.fill();
      g.fillStyle = haut || '#e8b98f'; g.beginPath(); g.moveTo(52, 0); g.lineTo(64, 15); g.lineTo(76, 0); g.fill();
    } else if (ansicht === 'r'){
      g.fillStyle = kr; g.beginPath(); g.ellipse(64, 0, 24, 9, 0, 0, Math.PI); g.fill();
    } else { g.fillStyle = kr; g.fillRect(20, 0, 34, 7); }
    // Licht und Schatten (rund wirkender Körper)
    const sh = g.createLinearGradient(0, 0, W, 0);
    sh.addColorStop(0, 'rgba(0,0,0,.26)'); sh.addColorStop(.22, 'rgba(0,0,0,0)'); sh.addColorStop(.42, 'rgba(255,255,255,.1)'); sh.addColorStop(.78, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.26)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H);
    const sv = g.createLinearGradient(0, 0, 0, H); sv.addColorStop(.7, 'rgba(0,0,0,0)'); sv.addColorStop(1, 'rgba(0,0,0,.16)');
    g.fillStyle = sv; g.fillRect(0, 0, W, H);
    // Nummer und Flagge
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (nummer !== '' && nummer != null){
      if (ansicht === 'r'){
        g.font = 'bold 74px "Bangers", Impact, "Arial Black", sans-serif';
        g.lineWidth = kit.nRand ? 9 : 6; g.strokeStyle = kit.nRand || 'rgba(0,0,0,.45)'; g.strokeText(String(nummer), 64, 72);
        g.fillStyle = kit.n; g.fillText(String(nummer), 64, 72);
      } else if (ansicht === 'v'){
        g.font = 'bold 30px "Bangers", Impact, "Arial Black", sans-serif';
        g.lineWidth = 4; g.strokeStyle = kit.nRand || 'rgba(0,0,0,.45)'; g.strokeText(String(nummer), 38, 50);
        g.fillStyle = kit.n; g.fillText(String(nummer), 38, 50);
        if (kit.land) g.drawImage(zeichneFlagge(kit.land, 96, 66), 74, 36, 32, 22);
      }
    }
    // Gold- oder Silberstern der Sternspieler (auf der Brust, hinten unter dem Kragen)
    if (stufe === 'gold' || stufe === 'silber'){
      const cx = ansicht === 'v' ? 96 : ansicht === 'r' ? 64 : 62, cy = ansicht === 'v' ? 18 : ansicht === 'r' ? 21 : 30, R = 12;
      const gr = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      if (stufe === 'gold'){ gr.addColorStop(0, '#fff6b0'); gr.addColorStop(.45, '#ffd21f'); gr.addColorStop(1, '#c98a00'); }
      else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#cfd6e2'); gr.addColorStop(1, '#8a94a6'); }
      g.beginPath();
      for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .45 : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(40,30,0,.55)'; g.stroke();
    }
    return c;
  }
  function trikotVorbereiten(f, bildKey, kit, nummer){
    const meta = SPRITE_META[bildKey];
    const hautVon = img => {
      try {
        const w = img.naturalWidth, hh = img.naturalHeight, sk = hh / meta.h;
        const c = document.createElement('canvas'); c.width = w; c.height = hh; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const y0 = Math.round((meta.kinn - 30) * sk), y1 = Math.round((meta.kinn - 12) * sk);
        const d = g.getImageData(Math.round(w * .3), y0, Math.max(1, Math.round(w * .4)), Math.max(1, y1 - y0)).data;
        const werte = [];
        for (let i = 0; i < d.length; i += 4) if (d[i+3] > 200) werte.push([d[i], d[i+1], d[i+2], d[i] + d[i+1] + d[i+2]]);
        werte.sort((a, b) => a[3] - b[3]);
        const mitte = werte.slice(Math.floor(werte.length * .3), Math.floor(werte.length * .8));   // Augen/Glanz ignorieren
        if (!mitte.length) return null;
        return [0, 1, 2].map(k => mitte.reduce((s, v) => s + v[k], 0) / mitte.length);
      } catch (e) { return null; }
    };
    const machen = () => {
      try {
        const hautRGB = f.bildV.naturalWidth ? hautVon(f.bildV) : null;
        if (hautRGB) f.hautFarbe = 'rgb(' + hautRGB.map(v => Math.round(Math.min(255, v * 1.04))).join(',') + ')';
        if (f.bildV.naturalWidth) f.kopfV = kopfBild(f.bildV, meta, bildKey + '_v');
        if (f.bildR.naturalWidth) f.kopfR = kopfBild(f.bildR, meta, bildKey + '_r');
        if (f.bildS && f.bildS.naturalWidth) f.kopfS = kopfBild(f.bildS, SPRITE_META[f.seiteKey] || meta, f.seiteKey + '_s');
        if (f.bildD && f.bildD.naturalWidth) f.kopfD = kopfBild(f.bildD, meta, bildKey + '_d');
        // V10.0: Bei st12 / st21 / st44 zeigt das Seitenbild nur Zöpfe/Dreadlocks von hinten (kein Gesicht) -> Schrägansicht mit Gesicht verwenden
        /* V8.0: Kairo, Zion, Jabari haben jetzt echte Seitenbilder (Profil nach rechts) */
        f.kopfSLinks = SEITE_LINKS.has(f.seiteKey);
        const st_ = f.daten && f.daten.stufe; f.torsoV = torsoTextur(kit, nummer, 'v', f.hautFarbe, st_); f.torsoR = torsoTextur(kit, nummer, 'r', f.hautFarbe, st_); f.torsoS = torsoTextur(kit, nummer, 's', f.hautFarbe, st_);
      } catch (e) { console.error('Trikot', e && e.message); }
    };
    let offen = 4;
    const fertig = () => { if (--offen === 0) machen(); };
    [f.bildV, f.bildR, f.bildS, f.bildD].forEach(i => { if (!i){ fertig(); return; } if (i.complete && i.naturalWidth) fertig(); else { i.addEventListener('load', fertig, { once: true }); i.addEventListener('error', fertig, { once: true }); } });
  }

  // =================================================================
  // Spieler und Schiedsrichter
  // =================================================================
  const OBERKOERPER_H = 1.18;     // Höhe des Oberkörper-Bildes in Metern
  function baueFigur(bildKey, hosenFarbe, team){
    const meta = SPRITE_META[bildKey];
    return {
      gruppe: { visible: true },
      bildV: neuesBild(SPRITES[bildKey + '_v']), bildR: neuesBild(SPRITES[bildKey + '_r']),
      bildS: neuesBild(SPRITES[(SEITE_VON[bildKey] || bildKey) + '_s']), seiteKey: SEITE_VON[bildKey] || bildKey,
      bildD: SPRITES[bildKey + '_d'] ? neuesBild(SPRITES[bildKey + '_d']) : null,
      breite: OBERKOERPER_H * meta.w / meta.h,
      hose: hosenFarbe, hautFarbe: '#f0c8a0', zeichen: { y: .4, rot: 0, dz: 0, schwung: 0, rueck: false }
    };
  }

  // Werte im Spiel: trainierte Werte (eigene Spieler), sonst Stärke; über 100 nur halb so stark wirksam
  const GEGNER_FAKTOR = { leicht: .55, mittel: .8, stark: 1 };
  function werteFuer(daten, team){
    const i = PLAYER_DATABASE.indexOf(daten), vor = s && s.optionen && s.optionen.werte && s.optionen.werte[i];
    const basis = vor ? { ...vor } : (team === 0 && i >= 0 && (ISTTRAIN(daten) || (daten.stufe && STAND.hatKarte(i))) && !(s && (s.fern || s.gast)) ? STAND.werte(i) : { abw: daten.rating, pas: daten.rating, sch: daten.rating, aud: daten.rating, dri: daten.rating, tem: daten.rating });
    if (basis.aud == null) basis.aud = basis.dri != null ? basis.dri : daten.rating;   // V4.1: Ausdauer (ältere Online-Daten kennen sie noch nicht)
    // V5.3: Mitzieh-Effekt – dein Star (erster Spieler der Aufstellung) zieht das Team mit: 30 % seines Trainings gehen an alle Mitspieler
    if (team === 0 && !vor && s && s.optionen && !(s.fern || s.gast)){
      const star = Array.isArray(s.optionen.squad) ? s.optionen.squad[0] : -1;
      if (star >= 0 && star !== i && PLAYER_DATABASE[star] && ISTTRAIN(PLAYER_DATABASE[star])){
        const zw = STAND.zuwachs(star) || {};   // V4.1: nur das, was der Star wirklich dazutrainiert hat
        for (const k of ['tem', 'sch', 'dri', 'pas', 'abw', 'aud']) if (zw[k] > 0) basis[k] = (basis[k] || daten.rating) + Math.round(zw[k] * .3);
      }
      // Teamgeist aus der letzten Pressekonferenz (nur ein Spiel lang)
      const tg = s.teamgeist || 0;
      if (tg) for (const k of ['tem', 'sch', 'dri', 'pas', 'abw', 'aud']) basis[k] = (basis[k] || daten.rating) + tg;
    }
    // V5.3: Gegnerländer in Liga/Pokal unterschiedlich stark (echte Einstufung + Zufall pro Saison/Pokal)
    // V4.1: Standardspieler der Gegnernation nach Sternen (5★ 72–76, 4★ 68–72, 3★ 64–68); Gold/Silber/Bronze behalten ihren Kartenwert
    // V5.2: Hast du diese Gold-/Silber-/Bronze-Karte gezogen, spielt die Nation nur mit einer schwächeren Kopie (−5)
    if (team === 1 && !vor && daten.stufe && !(s && (s.fern || s.gast))){ let hat = false; try { hat = STAND.daten.karten.includes(daten.name); } catch (e) {}
      if (hat) for (const k of ['tem', 'sch', 'dri', 'pas', 'abw', 'aud']) basis[k] = (basis[k] != null ? basis[k] : daten.rating) - KOPIE_MALUS; }   // V3.05: −20
    if (team === 1 && !vor && s && s.gegner && !daten.stufe){
      let v = nationStandardWert(s.gegner[0], daten.name);
      try { const wx = STAND.daten.wechsel || {}; if (wx[daten.name] === s.gegner[0]) v = Math.max(v, ISTTRAIN(daten) ? STAND.gesamt(i) : daten.rating); } catch (e) {}   // V11.13: gewechselter Spieler behält seine Stärke
      for (const k of ['tem', 'sch', 'dri', 'pas', 'abw', 'aud']) basis[k] = v;
    }
    // Match-Skills gelten nur für dein Team und nur für dieses eine Spiel.
    if (team === 0 && s && s.optionen && s.optionen.matchSkills){
      const ms = s.optionen.matchSkills;
      // V8.0: dein Star (erster Spieler der Aufstellung) bekommt die Punkte voll (+4 je Punkt), alle Mitspieler nur 30 % davon
      const stern = Array.isArray(s.optionen.squad) ? s.optionen.squad[0] : -1;
      const anteil = (stern >= 0 && i !== stern) ? .3 : 1;
      const mp = v => Math.round((+v || 0) * 4 * anteil);
      basis.tem += mp(ms.tem);
      basis.sch += mp(ms.sch);
      basis.dri += mp(ms.dri);
      basis.pas += mp(ms.pas);
      basis.aus += mp(ms.aus);
    }
    // V11.12: Abzug, wenn dein Spieler nicht auf seiner Position steht
    if (team === 0 && !vor && s && s.posAbzug && i >= 0 && s.posAbzug[i]){ const ab = s.posAbzug[i]; for (const k of ['tem', 'sch', 'dri', 'pas', 'abw', 'aud']) if (basis[k] != null) basis[k] -= ab; }
    return basis;
  }
  function spezialFuer(daten){
    return [];   // V5.0: Spezialfähigkeiten (Feuerschuss, Turbo, Zauberpass …) sind vorerst komplett entfernt
  }
  function effWert(x, team){
    let e = x <= 100 ? x : 100 + (x - 100) * .5;
    if (team === 1 && s && !(s.optionen && s.optionen.modus)) e = 70 + (e - 70) * (GEGNER_FAKTOR[s.stufe] || .8);
    return e;
  }
  // V5.3: Star-Bonus – nach Tor oder Vorlage deines Stars spielt das Team 40 Sekunden mit Schwung
  const istStar = p => !!(p && p.team === 0 && s && s.optionen && Array.isArray(s.optionen.squad) && p.daten === PLAYER_DATABASE[s.optionen.squad[0]]);
  const schwung = p => (p.team === 0 && s && s.schwungBis != null && s.zeit > s.schwungBis && !istStar(p)) ? 6 : 0;
  const W = (p, k) => effWert((p.w ? p.w[k] : p.rating) + schwung(p), p.team);
  const CONTROLLER_BILD = (() => { const im = new Image(); im.src = 'images/src.png'; return im; })();   // V8.1
  const spezAn = (p, k) => false;   // V5.0: keine Spezialfähigkeiten
  const hatFae = (p, f) => !!(p && p.fae && p.fae.includes(f));   // V6.1: umbenannt (vorher 'kann' – kollidierte mit der Torwart-Variable 'kann' in paraden → Absturz)   // V5.3: realistische Fähigkeiten (FAEHIGKEIT)
  // Neon-Fußballschuhe: jeder Spieler hat seine feste Farbe, nie ähnlich wie Trikot oder Stutzen
  const NEON = [['#ff2fa0','#ffffff'],['#1e7bff','#ffffff'],['#ff7a00','#111'],['#f5ff1f','#111'],['#00e5d4','#111'],['#a54bff','#ffffff']];
  const neonRgb = c => { c = String(c || '#000').replace('#',''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const neonAbstand = (a, b) => { const x = neonRgb(a), y = neonRgb(b), r = (x[0] + y[0]) / 2;
    return Math.sqrt((2 + r / 256) * (x[0]-y[0]) ** 2 + 4 * (x[1]-y[1]) ** 2 + (2 + (255 - r) / 256) * (x[2]-y[2]) ** 2); };
  function neonSchuh(name, kit){
    let hsh = 0; for (const ch of String(name || '')) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const vergleich = [kit.t, kit.s || kit.h].filter(Boolean);
    let best = null, bestA = -1;
    for (let i = 0; i < NEON.length; i++){
      const c = NEON[(hsh + i) % NEON.length], a = Math.min(...vergleich.map(v => neonAbstand(c[0], v)));
      if (a > 260) return c.slice();
      if (a > bestA){ bestA = a; best = c; }
    }
    return best.slice();
  }
  // V4.1: sanfte Tempo-Kurve (70 = normal, 100 ≈ +9 %, über 100 nur noch wenig) und Antritt (schnelle Spieler beschleunigen spürbar schneller)
  const TEMPO_KURVE = [[40, .84], [55, .90], [65, .96], [70, 1], [80, 1.03], [90, 1.06], [95, 1.08], [100, 1.09], [120, 1.12], [160, 1.15]];
  function laufFaktor41(e){
    const K = TEMPO_KURVE; if (!(e > K[0][0])) return K[0][1]; if (e >= K[K.length - 1][0]) return K[K.length - 1][1];
    for (let j = 1; j < K.length; j++) if (e <= K[j][0]){ const [x0, y0] = K[j - 1], [x1, y1] = K[j]; return y0 + (y1 - y0) * (e - x0) / (x1 - x0); }
    return 1;
  }
  const antrittFaktor = f => Math.max(.65, Math.min(1.35, 1 + (f - 1) * 3));
  // V4.1: Ausdauer-Wert – 70 = normal, 100 = Leiste hält etwa 30 % länger
  function ausdauerMax(daten, team){ const w = werteFuer(daten, team); return Math.round(100 * Math.max(.7, Math.min(1.5, 1 + (effWert(w.aud != null ? w.aud : (w.dri != null ? w.dri : daten.rating), team) - 70) * .01))); }
  function neuerSpieler(daten, team, rolle, slot){
    const kit = rolle === 'TW' ? torwartTrikot(s.kits, team) : s.kits[team];
    const f = baueFigur(daten.bild, kit.h, team);
    const vorgabe = s.nummernVorgabe && s.nummernVorgabe[team] && +s.nummernVorgabe[team][PLAYER_DATABASE.indexOf(daten)];
    const nummer = vorgabe || naechsteNummer(team, rolle);
    f.ringFarbe = s.kits[team].t; f.nummer = nummer; f.trikot = kit.t; f.socke = kit.s || kit.h; f.sockeBand = kit.sBand || []; f.schuh = neonSchuh(daten.name, kit); f.hand = kit.hand; f.hStreifen = kit.hStreifen; f.kragen = kit.kragen; f.kit = kit;
    const st = STUFE[s.stufe];
    const ki = team === 1 ? st.tempo : 1;
    const p = {
      daten, name: daten.name, rating: daten.rating, team, rolle, slot, ...f,
      w: werteFuer(daten, team), spezArten: spezialFuer(daten), spezLade: 0, spezT: 0, fae: faehigkeiten(daten),
      maxAusdauer: Math.round(ausdauerMax(daten, team) * (faehigkeiten(daten).includes('welt') ? 1.2 : 1)), ausdauer: Math.round(ausdauerMax(daten, team) * (faehigkeiten(daten).includes('welt') ? 1.2 : 1)), antritt: antrittFaktor(laufFaktor41(effWert(werteFuer(daten, team).tem, team))),
      p: V(), v: V(), blick: V(team === 0 ? 1 : -1, 0, 0),
      tempo: 4.1 * laufFaktor41(effWert(werteFuer(daten, team).tem, team)) * ki * (s.wetter === 'schnee' ? .92 : 1) * (faehigkeiten(daten).includes('antritt') ? 1.04 : 1),
      laufPhase: Math.random()*6, sperre: 0, gefallen: 0, grae: 0, graeBall: false,
      gelb: 0, aktiv: true, ziel: V(), wanderT: 0, wander: V(), denkT: Math.random()*.5, warteT: 0, sprung: 0, jubel: 0, hecht: 0, hechtSeite: 1
    };
    s.spieler.push(p);
    trikotVorbereiten(p, daten.bild, kit, nummer);
    return p;
  }

  function baueSchiri(){
    const daten = { name: 'SCHIRI', rating: 75, bild: 'a31' };
    const f = baueFigur('a31', '#111111', 2);
    f.schiri = true;
    const sch = { ...f, daten, p: V(0, 0, HB - 4), v: V(), blick: V(0, 0, -1), laufPhase: 0, karteFarbe: '#ffe234', karteT: 0, tempo: 4.6, sprung: 0, jubel: 0, gefallen: 0, grae: 0 };
    trikotVorbereiten(sch, 'a31', { t: '#1a1a1a', kragen: '#ffffff', n: '#ffffff', h: '#111', s: '#111', sBand: [], schuh: ['#111'], land: null }, '');
    return sch;
  }
  // =================================================================
  // Hilfen für Positionen
  // =================================================================
  const richt = team => ((team === 0) !== !!(s && s.getauscht)) ? 1 : -1;   // Angriffsrichtung (x), nach der Halbzeit getauscht
  const torX  = team => -richt(team) * HL;                  // eigenes Tor
  const imStrafraum = (pos, team) => Math.abs(pos.x - torX(team)) < STR_T + .2 && Math.abs(pos.z) < STR_B + .2;
  const aktiv = () => s.spieler.filter(p => p.aktiv);
  const teamSp = t => s.spieler.filter(p => p.aktiv && p.team === t);
  const torwartVon = t => s.spieler.find(p => p.team === t && p.rolle === 'TW' && p.aktiv);
  const imFeld = v => { const mx = s && s.halle ? HL + 1.2 : HL + .8, mz = s && s.halle ? HB + 1.2 : HB + .8; v.x = klemme(v.x, -mx, mx); v.z = klemme(v.z, -mz, mz); return v; };

  // V5.5: Raumsuche für Mittelfeld und Sturm – freie Räume erkennen, Passlinie öffnen, auf Höhe der Abseitslinie lauern
  function raumSuchen(p, basis){
    const jetzt = s.zeit;
    if (p.rsRaum && p.rsT != null && Math.abs(p.rsT - jetzt) < .5 && d2(p.rsRaum.basis, basis) < 4) return p.rsRaum.ziel.clone();   // eigene Variablen (raumT gehört dem Freilaufen)
    const b = welt.ball, dir = richt(p.team), traeger = b.besitzer && b.besitzer.team === p.team ? b.besitzer : null;
    const gegner = s.spieler.filter(q => q.aktiv && q.team !== p.team);
    const linie = Math.max(abseitsLinie(p.team), b.p.x * dir, 0);   // weiter vorne als das wäre Abseits
    const risiko = (p.raumRisiko != null) ? p.raumRisiko : (p.raumRisiko = Math.random() < .12 ? .7 : -.6);   // manche verschätzen sich
    let best = null, bestW = -1e9;
    for (let i = 0; i < 11; i++){
      const w0 = i === 0 ? 0 : (i / 10) * Math.PI * 2, rr = i === 0 ? 0 : (i % 2 ? 3.2 : 6);
      const c = V(basis.x + Math.cos(w0) * rr * 1.2, 0, basis.z + Math.sin(w0) * rr);
      c.x = klemme(c.x, -HL + 1, HL - 1); c.z = klemme(c.z, -HB + 1, HB - 1);
      const cx = c.x * dir;
      let frei = 9; for (const q of gegner) frei = Math.min(frei, d2(q.p, c));
      let w = Math.min(frei, 7) * 1.1;
      if (traeger){   // Passlinie: kein Gegner nah an der Linie Ballführer → Punkt
        const ax = traeger.p.x, az = traeger.p.z, dx = c.x - ax, dz = c.z - az, L2 = dx * dx + dz * dz || 1;
        let lane = 9; for (const q of gegner){ const t = klemme(((q.p.x - ax) * dx + (q.p.z - az) * dz) / L2, 0, 1); lane = Math.min(lane, Math.hypot(ax + dx * t - q.p.x, az + dz * t - q.p.z)); }
        w += Math.min(lane, 4) * .9;
        const dist = Math.sqrt(L2); if (dist > 26) w -= (dist - 26) * .4; if (dist < 5) w -= (5 - dist) * .6;
      }
      w += klemme(cx - basis.x * dir, -6, 8) * .35;                  // Raumgewinn nach vorn
      w -= d2(c, basis) * .22;                                        // nicht zu weit von der Formation weg
      if (cx > linie + risiko) w -= 8 + (cx - linie) * 2;             // Abseits vermeiden
      if (w > bestW){ bestW = w; best = c; }
    }
    // auf Höhe der Abseitslinie lauern statt dahinter zu stehen
    if (best.x * dir > linie + risiko) best.x = (linie + risiko - .2) * dir;
    p.rsRaum = { ziel: best.clone(), basis: basis.clone() }; p.rsT = jetzt;
    if (Math.random() < .02) p.raumRisiko = null;   // gelegentlich neu einschätzen
    return best;
  }
  function basisPosition(p){
    const dir = richt(p.team), b = welt.ball.p;
    const bu = klemme(b.x * dir / HL, -1, 1), bv = klemme(b.z / HB, -1, 1);
    if (p.rolle === 'TW'){
      // auf der Linie Torzentrum–Ball stehen, je näher der Ball, desto weiter heraus (Winkel verkürzen)
      const gx = torX(p.team), dist = Math.hypot(b.x - gx, b.z);
      const r = klemme(dist * .12, .6, 2.4);
      const ux = (b.x - gx) / (dist || 1), uz = b.z / (dist || 1);
      return V(gx + ux * r * (ux * dir > 0 ? 1 : 0) + dir * (ux * dir > 0 ? 0 : .6), 0, klemme(uz * r + b.z * .08, -TB + .3, TB - .3));
    }
    const eigenBall = s.besitzTeam === p.team;
    let u, v;
    if (p.fu != null){
      // 11er-Test: Formation verschiebt sich mit dem Ball (Block rückt vor/zurück und zur Ballseite)
      const lo = p.slot === 0 ? -.88 : p.slot === 1 ? -.66 : -.28, hi = p.slot === 0 ? .22 : p.slot === 1 ? .66 : .88;
      const verteidigt = s.besitzTeam != null && !eigenBall;
      u = klemme(verteidigt ? (p.slot === 0 ? p.fu * .62 + bu * .42 - .02 : p.fu * .8 + bu * .34 - .08) :   // V3.2: Abwehr steht höher (Abseitsfalle)
                        p.fu + bu * .3 + (eigenBall ? .16 : -.06), lo, hi);
      v = klemme(verteidigt ? p.fv * .85 + bv * .26 : p.fv * .97 + bv * .15, -.93, .93);
      const ziel = V(u * HL * dir, 0, v * HB).add(p.wander);
      for (const q of s.spieler) if (q.aktiv && q.team !== p.team){
        const d = d2(q.p, ziel);
        if (d < 3){ const weg = V(ziel.x - q.p.x, 0, ziel.z - q.p.z).normalize().multiplyScalar(3 - d); ziel.add(weg); }
      }
      if (eigenBall && p.slot >= 1 && s.phase === 'spiel') return imFeld(raumSuchen(p, ziel));   // V5.5: kluge Laufwege im Angriff
      return imFeld(ziel);
    }
    if (p.slot === 0){ u = klemme(bu * .55 - .42, -.78, .1);  v = p.seite ? bv * .3 + p.seite * .42 : bv * .45; }
    else if (p.slot === 1){ u = klemme(bu * .7 - .02, -.55, .6); v = bv * .5 + (bv > 0 ? -.38 : .38); }
    else { u = klemme(bu * .5 + .42, .05, .84); v = -bv * .35 + (p.team ? -.12 : .12); }
    u += eigenBall ? .2 : -.16;
    const ziel = V(u * HL * dir, 0, v * HB).add(p.wander);
    // Freiraum suchen: weg vom nächsten Gegner
    for (const q of s.spieler) if (q.aktiv && q.team !== p.team){
      const d = d2(q.p, ziel);
      if (d < 2.6){ const weg = V(ziel.x - q.p.x, 0, ziel.z - q.p.z).normalize().multiplyScalar(2.6 - d); ziel.add(weg); }
    }
    return imFeld(ziel);
  }

  // V3.50: Einlauf - Spieler laufen ein, stehen kurz nebeneinander, laufen dann zum Anstoss
  const EIN_STEH = 5.0, EIN_LAUF = 2.2, EIN_T = 7.3;
  // V3.0: Spielertunnel auf der Gegengeraden (Mitte), Bänke links und rechts daneben
  let TUN_X = 2.2, TUN_Z0 = -(HB + 1.15), TUN_Z1 = -(HB + 4.6), TUN_H = 2.7, TUN_RAUS = -(HB + 3.3), TUN_SICHT = -(HB + 2.35), AUFSTELL_Z = -(HB - 7);
  const imTunnel = p => p.p.z < TUN_SICHT && Math.abs(p.p.x) < TUN_X + .3;
  function einlaufStart(zweite){
    if (!s || s.gast) return false;
    anstossPositionen(s.naechsterAnstoss);
    const teams = [[], []];
    const liga = !!(s.optionen && s.optionen.liga) || !!zweite;
    for (const p of s.spieler){ if (!p.aktiv) continue; p.eiAb = null; p.eiZiel = { x: p.p.x, z: p.p.z }; teams[p.team].push(p); }
    teams.forEach((liste, tm) => {
      const n = liste.length;
      liste.forEach((p, i) => {
        const rang = n - 1 - i, x = (tm === 0 ? -1 : 1) * (1.3 + 1.7 * rang);
        p.eiSlot = { x, z: AUFSTELL_Z }; p.eiStart = { x: (tm === 0 ? -1 : 1) * .65, z: TUN_RAUS - i * .15 }; p.eiDelay = i * .22; p.eiSpeed = 6;   // V3.0: aus dem Tunnel
        // Liga: nur einlaufen, kein Aufstellen/Hymne - direkt auf die Anstoss-Position
        if (liga){ p.eiSlot = { x: p.eiZiel.x, z: p.eiZiel.z }; p.eiDelay = i * .12; p.eiSpeed = 8; }
        p.p.set(p.eiStart.x, 0, p.eiStart.z); p.v.set(0, 0, 0); p.blick.set(0, 0, -1);
        p.grae = 0; p.gefallen = 0; p.sperre = 0; p.hecht = 0; p.sprung = 0; p.jubel = 0;
      });
    });
    if (welt.schiri){ welt.schiri.p.set(0, 0, TUN_RAUS + .4); welt.schiri.v.set(0, 0, 0); }
    s.einlauf = { t: 0, zweite: !!zweite };
    s.phase = 'start'; s.phaseT = EIN_T; s.std = null;
    if (typeof KOMMENTAR !== 'undefined' && !zweite){ KOMMENTAR.neuesSpiel(); KOMMENTAR.setKontext(() => { const sx = s; return sx ? { tore: sx.tore, ich: sx.lokalTeam || 0, phase: sx.phase === 'ausklang' ? 'ende' : sx.phase, anfang: (sx.phase === 'start' && !sx.halbzeitGewesen) || (!sx.halbzeitGewesen && sx.tore[0] + sx.tore[1] === 0 && SPIELZEIT - sx.zeit < 8 && (sx.phase === 'standard' || sx.phase === 'spiel')), modus: (sx.optionen && sx.optionen.liga) ? 'liga' : (sx.optionen && sx.optionen.turnier) ? 'pokal' : 'freund', sieger: typeof sx.elfmeterSieger === 'number' ? sx.elfmeterSieger : -2, halle: !!sx.halle, pause: (typeof pausiert !== 'undefined') && !!pausiert } : null; }); KOMMENTAR.setLiga(liga, liga && typeof LIGA !== 'undefined' && LIGA.status ? LIGA.status() : null, () => (typeof LIGA !== 'undefined' && LIGA.status ? LIGA.status() : null)); KOMMENTAR.ereignis(liga ? 'einlauf_liga' : 'einlauf', null, true); try { if (s.optionen && s.optionen.heim === false) KOMMENTAR.setPaarung(s.gegner && s.gegner[0], s.land && s.land[0]); else KOMMENTAR.setPaarung(s.land && s.land[0], s.gegner && s.gegner[0]);   /* V8.6: Heimteam zuerst, auswärts zuerst der Gegner */ } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } if (liga && !s.gast) KOMMENTAR.ligaAnsage(); else if (!liga && !s.gast && s.optionen && s.optionen.turnier) { try { const tz = (typeof TURNIER !== 'undefined') ? TURNIER.zustand : null; if (tz && tz.letztes && tz.runde >= 1 && tz.opt && tz.opt.land) KOMMENTAR.pokalAnsage(tz.opt.land[0], tz.letztes[0], tz.letztes[1]); else KOMMENTAR.paarungAnsage(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } } else if (!s.gast) KOMMENTAR.paarungAnsage(); }
    if (liga){
      let mx = 0;
      for (const p of s.spieler){ if (!p.aktiv) continue; mx = Math.max(mx, p.eiDelay + Math.hypot(p.eiSlot.x - p.eiStart.x, p.eiSlot.z - p.eiStart.z) / p.eiSpeed); }
      s.einlauf.liga = true; s.einlauf.ende = mx; s.phaseT = mx + .5;
    }
    return true;
  }
  function einlaufSchritt(p, dt){
    const e = s.einlauf, t = e.t;
    if (!p.eiSlot) return;
    const ax = p.p.x, az = p.p.z;
    const dx = p.eiSlot.x - p.eiStart.x, dz = p.eiSlot.z - p.eiStart.z, dist = Math.hypot(dx, dz) || 1;
    const a = klemme((t - p.eiDelay) * p.eiSpeed / dist, 0, 1);
    let x = p.eiStart.x + dx * a, z = p.eiStart.z + dz * a, fertig = false;
    if (e.liga) fertig = a >= 1;
    else if (t > EIN_STEH){
      if (!p.eiAb) p.eiAb = { x: ax, z: az };   // V3.0: vom tatsächlichen Platz aus loslaufen (kein Springen)
      const u0 = klemme((t - EIN_STEH) / EIN_LAUF, 0, 1), u = u0 * u0 * (3 - 2 * u0);
      x = p.eiAb.x + (p.eiZiel.x - p.eiAb.x) * u; z = p.eiAb.z + (p.eiZiel.z - p.eiAb.z) * u; fertig = u0 >= 1;
    }
    p.p.set(x, 0, z);
    if (dt > 0) p.v.set((x - ax) / dt, 0, (z - az) / dt);
    const sp = Math.hypot(p.v.x, p.v.z);
    if (fertig){ p.blick.set(richt(p.team), 0, 0); p.v.set(0, 0, 0); }
    else if (sp > .5) p.blick.set(p.v.x / sp, 0, p.v.z / sp);
    else if (!e.liga && t < EIN_STEH) p.blick.set(0, 0, 1);
  }
  function einlaufSchiri(dt){
    const sch = welt.schiri, t = s.einlauf.t, zEnd = s.einlauf.liga ? -3 : AUFSTELL_Z, z = Math.min(zEnd, TUN_RAUS + .4 + (s.einlauf.liga ? 8 : 4.2) * t), alt = sch.p.z;
    sch.p.set(0, 0, z);
    sch.v.set(0, 0, dt > 0 ? (z - alt) / dt : 0);
    sch.blick.set(0, 0, 1);
  }

  // =====================================================================
  // V6.2: Szene nach dem Abpfiff (ca. 12 s; Pokalsieg im Finale / Liga-Meister ca. 20 s)
  // Reaktion (Sieger jubeln und umarmen sich, Verlierer frustriert – manchmal sauer am Boden,
  // bei Remis müde) → Handschlag an der Mittellinie → Abgang in den Tunnel.
  // Pokalsieg / Meisterschaft: dein Team stellt sich aufs Podest, der Kapitän hebt Pokal bzw. Schale.
  // Jederzeit über „ÜBERSPRINGEN“ (unten) abkürzbar. Läuft beim Gastgeber bzw. offline.
  // =====================================================================
  const istAusklang = () => !!(s && s.phase === 'ausklang');
  const AUS_T = 12, AUS_T_FEIER = 20, PODEST_Z = -3.2, PODEST_H = .55;
  const HS_ABSTAND = 1.1, HS_MITTE = 1.0, HS_LANE = .5, HS_TEMPO = 1.45;   // V7.0: Handschlag-Reihen: Abstand in der Reihe, Abstand der ersten Spieler zur Mitte, Seitenabstand der beiden Reihen (Hände reichen sich), Gehtempo
  function ausklangKnopf(an){
    let k = document.getElementById('ausklangSkip');
    if (!k && an){
      k = document.createElement('button'); k.id = 'ausklangSkip'; k.type = 'button'; k.className = 'skipUnten'; k.textContent = 'ÜBERSPRINGEN ▸▸';
      k.addEventListener('click', ev => { ev.stopPropagation(); ausklangEnde(); });
      ($s('spiel') || document.body).appendChild(k);
    }
    if (k) k.hidden = !an;
  }
  function ausklangStart(elfWinner){
    try { const b = welt.ball; if (b && b.p.y > BALL_R){ b.besitzer = null; b.v.set(0, 0, 0); b.p.y = BALL_R; b.flanke = false; } } catch (e) {}   // V7.7
    if (!s || s.gast || s.ausklang || s.ausklangFertig || !laeuft) return false;
    const elf = (s.elfmeter && typeof elfWinner === 'number') ? elfWinner : null;
    const sieger = elf != null ? elf : (s.tore[0] > s.tore[1] ? 0 : s.tore[1] > s.tore[0] ? 1 : -1);
    const ich = s.lokalTeam || 0, o = s.optionen || {};
    let feier = null;
    if (o.turnier === 'FINALE' && !o.liga && sieger === ich) feier = 'pokal';
    else if (o.liga && typeof LIGA !== 'undefined' && LIGA.meisterVorab && LIGA.meisterVorab(s.tore.slice())) feier = 'schale';
    else if (o.halle && o.htFinale && sieger === ich) feier = 'pokal';   // V3.05: auch das gewonnene Hallenturnier-Finale wird gefeiert
    const tR = feier ? 5 : 3.4;   // V7.0: Reaktion bis tR; Aufstellen bis tF und Handschlag bis tH werden unten nach Spielerzahl und Abstand berechnet
    const sp = aktiv(), teams = [sp.filter(p => p.team === 0), sp.filter(p => p.team === 1)];
    const zufall = a => a[Math.floor(Math.random() * a.length)];
    for (const p of sp){
      p.grae = 0; p.gefallen = 0; p.sperre = 0; p.hecht = 0; p.sprung = 0; p.jubel = 0; p.jubelArt = null;
      p.ak = { liegt: 0, art: null, wackel: Math.random() * 6, ph: 0 };
    }
    const feld = tm => teams[tm].filter(p => p.rolle !== 'TW');
    if (sieger >= 0){
      // Verlierer: einer (manchmal zwei) liegt sauer am Boden, andere greifen sich an den Kopf
      const v = feld(1 - sieger); const anz = v.length ? (Math.random() < .35 && v.length > 1 ? 2 : 1) : 0;
      /* V9.9: keiner wirft sich mehr auf den Boden */
      for (const p of teams[1 - sieger]) p.ak.runter = true;   // V9.9: Verlierer lassen den Kopf hängen   // V7.0: steht vor Ende der Reaktion wieder auf, sonst rennt er dem Rest hinterher
      for (const p of teams[1 - sieger]) p.ak.art = Math.random() < .5 ? 'kopf' : null;
      // Sieger: Arme hoch, Fäuste – und je zwei fallen sich in die Arme
      for (const p of teams[sieger]) p.ak.art = zufall(['hoch', 'hoch', 'faust']);
      const w = teams[sieger].slice().sort(() => Math.random() - .5);
      for (let i = 0; i + 1 < w.length; i += 2){ w[i].ak.partner = w[i + 1]; w[i + 1].ak.partner = w[i]; }
    } else {
      // Remis: ein bis zwei setzen sich erschöpft hin, einige verschränken die Arme, manche geben sich schon die Hand
      const alle = [...feld(0), ...feld(1)].sort(() => Math.random() - .5);
      for (const p of sp) p.ak.art = Math.random() < .45 ? 'kreuz' : null;
    }
    // V7.0: Reihenfolge der Handschlag-Reihen nach der aktuellen Position (wer schon näher an der Mitte steht, steht vorne) – weniger Gewusel beim Aufstellen
    let maxD = 0, nMax = 0;
    teams.forEach((liste, tm) => {
      const dir = richt(tm);   // V5.3: jedes Team bleibt auf der Seite, auf der es gerade spielt (nach dem Seitenwechsel getauscht)
      liste.slice().sort((a, c) => dir * (c.p.x - a.p.x)).forEach((p, i) => {
        p.ak.reihe = i; p.ak.n = liste.length;
        p.ak.slot = [-dir * (HS_MITTE + HS_ABSTAND * i), tm === 0 ? -HS_LANE : HS_LANE];
        maxD = Math.max(maxD, Math.hypot(p.ak.slot[0] - p.p.x, p.ak.slot[1] - p.p.z));
      });
      nMax = Math.max(nMax, liste.length);
    });
    const tForm = klemme(maxD / 5 + .6, 2.8, 6.5), Lw = 2 * HS_MITTE + nMax * HS_ABSTAND + .5;
    const tF = tR, tH = tR + 8, T = feier ? tH + 10.5 : tH + 3.8;   // V9.9: kein Aufstellen/Handschlag mehr – nach der Reaktion laufen alle 8 s locker hin und her   // Aufstellen bis tF, Handschlag bis tH, danach Abgang bzw. Podest
    // Podest: Kapitän (erster Feldspieler deines Teams) in die Mitte, die anderen links/rechts daneben
    let kapitaen = null;
    if (feier){
      const mein = teams[ich];
      kapitaen = mein.find(p => p.rolle !== 'TW') || mein[0] || null;
      const rest = mein.filter(p => p !== kapitaen);
      if (kapitaen) kapitaen.ak.podX = 0;
      rest.forEach((p, i) => { const k = Math.floor(i / 2) + 1; p.ak.podX = (i % 2 ? 1 : -1) * 1.15 * k; });
      // Sieger umarmen sich nach einem Pokalsieg erst vor den Fans – bei der Meisterschaft (evtl. nicht gewonnen) nur dein Team
    }
    const b = welt.ball; b.v.set(0, 0, 0); if (b.besitzer) b.besitzer = null;
    s.ausklang = { t: 0, T, tR, tF, tH, Lw, sieger, ich, feier, kapitaen, elf, kx: 0, kz: 0, konf: [], gesagt: false };
    s.phase = 'ausklang'; s.std = null;
    ausklangKnopf(true);
    try { musik.sfx && musik.sfx.pfiff(3); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    s.abpfiffGesagt = true;
    (typeof KOMMENTAR !== 'undefined') && KOMMENTAR.ereignis(s.tore[0] !== s.tore[1] ? 'abpfiff_sieg' : 'abpfiff', null, true);
    return true;
  }
  function ausklangGehe(p, x, z, tempo, dt){
    const dx = x - p.p.x, dz = z - p.p.z, d = Math.hypot(dx, dz);
    if (d < .05 || dt <= 0){ p.v.set(0, 0, 0); return true; }
    const st = Math.min(d, tempo * dt);
    p.p.set(p.p.x + dx / d * st, 0, p.p.z + dz / d * st);
    p.v.set(dx / d * st / dt, 0, dz / d * st / dt);
    if (d > .12) p.blick.set(dx / d, 0, dz / d);
    return d < .3;
  }
  function ausklangSchritt(dt){
    const a = s.ausklang; if (!a) return;
    a.t += dt;
    const t = a.t, sp = aktiv();
    const podestZeit = a.feier && t >= a.tH;
    let sx = 0, sz = 0, n = 0;
    for (const p of sp){
      const k = p.ak || (p.ak = { liegt: 0, ph: 0 });
      const sieg = a.sieger >= 0 && p.team === a.sieger, verl = a.sieger >= 0 && p.team !== a.sieger;
      const aufsPodest = podestZeit && p.team === a.ich && k.podX != null;
      p.jubelArt = null;
      let phSoll = 0;
      if (k.liegt && t < k.liegt){
        // am Boden liegen: sauer (trommelt auf den Rasen) oder erschöpft
        p.gefallen = .4; p.v.set(0, 0, 0);
        if (k.sauer){ k.wackel += dt; p.blick.set(Math.sin(k.wackel * 9) > 0 ? 1 : -1, 0, .2); }
      } else {
        p.gefallen = 0;
        let zx, zz, tempo, blickZ = null, blickX = null;
        if (t < a.tR){
          // Reaktion
          if (sieg && k.partner && k.partner.ak && !(k.partner.ak.liegt > t)){
            // Umarmung: beide gehen aufeinander zu
            const q = k.partner, mx = (p.p.x + q.p.x) / 2, mz = (p.p.z + q.p.z) / 2, dx = p.p.x - q.p.x, dz = p.p.z - q.p.z, d = Math.hypot(dx, dz) || 1;
            zx = mx + dx / d * .32; zz = mz + dz / d * .32; tempo = 5;
            if (d < .9){ p.jubelArt = 'umarmen'; p.blick.set(-dx / d, 0, -dz / d); p.jubel = .4; }
            else p.jubelArt = k.art;
          } else if (a.feier === 'pokal' && sieg){ zx = klemme(p.p.x, -HL + 4, HL - 4); zz = -(HB - 1.2); tempo = 6; p.jubelArt = k.art || 'hoch'; p.jubel = .5; }
          else { zx = p.p.x; zz = p.p.z; tempo = verl ? .9 : 1.2; p.jubelArt = k.art; if (sieg) p.jubel = .5; blickZ = 1; }
        } else if (t < a.tH){
          // V9.9: kein Abklatschen/Handschlag – alle laufen locker hin und her; Sieger jubeln weiter, Verlierer gehen langsam mit hängendem Kopf
          k.wT = (k.wT || 0) - dt;
          if (k.wT <= 0 || k.wx == null){ k.wT = 1.5 + Math.random() * 2; k.wx = klemme(p.p.x + (Math.random() * 2 - 1) * 7, -HL + 3, HL - 3); k.wz = klemme(p.p.z + (Math.random() * 2 - 1) * 5, -HB + 2, HB - 3); }
          zx = k.wx; zz = k.wz; tempo = verl ? 1.1 : (sieg ? 2.1 : 1.4);
          p.jubelArt = k.art; if (sieg) p.jubel = .5;
        } else if (aufsPodest){
          // Podest: hinlaufen, hinaufsteigen, zum Publikum schauen, Pokal / Schale hochheben
          zx = k.podX; zz = PODEST_Z; tempo = 5;
          if (Math.abs(p.p.x - zx) < .35 && Math.abs(p.p.z - zz) < .35){ phSoll = PODEST_H; blickZ = 1;
            if (t > a.tH + 2.6){ p.jubelArt = p === a.kapitaen ? 'hoch' : (k.art && k.art !== 'kopf' ? k.art : 'hoch'); p.jubel = .5; } }
        } else {
          // Abgang in den Tunnel (Sieger zuerst noch kurz winkend)
          const i = k.reihe || 0; zx = -richt(p.team) * .6; zz = TUN_Z1 + .3 - i * .05; tempo = sieg ? 3.6 : 3;
          if (sieg && t < a.tH + 1.5) p.jubelArt = 'hoch';
        }
        const angekommen = ausklangGehe(p, zx, zz, tempo, dt);
        if (angekommen && blickZ != null) p.blick.set(0, 0, blickZ);
        else if (angekommen && blickX != null) p.blick.set(blickX, 0, 0);
      }
      k.ph += (phSoll - k.ph) * Math.min(1, dt * 7);
      sx += p.p.x; sz += p.p.z; n++;
    }
    // Schiedsrichter: wartet am Ende der Reihe, geht danach in den Tunnel
    const sch = welt.schiri;
    if (sch){
      const zx = t < a.tH ? 0 : .2, zz = t < a.tR ? sch.p.z : t < a.tH ? -2.4 : TUN_Z1 + .3;
      const dx = zx - sch.p.x, dz = zz - sch.p.z, d = Math.hypot(dx, dz);
      if (d > .05 && dt > 0){ const st = Math.min(d, 3.2 * dt); sch.p.set(sch.p.x + dx / d * st, 0, sch.p.z + dz / d * st); sch.v.set(dx / d * st / dt, 0, dz / d * st / dt); sch.blick.set(dx / d, 0, dz / d); }
      else sch.v.set(0, 0, 0);
    }
    if (podestZeit){ a.kx = 0; a.kz = PODEST_Z + .4; }
    else if (n){ a.kx = sx / n; a.kz = klemme(sz / n, -HB, HB - 1); }
    // Pokal hochheben: Kommentator + Konfetti + Jubel
    if (podestZeit && t > a.tH + 2.6 && !a.gesagt){
      a.gesagt = true;
      try { window.scFeierBanner && window.scFeierBanner(a.feier, s.stufe, !!(s.optionen && s.optionen.halle)); } catch(e){}   // V3.05
      try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(true); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      (typeof KOMMENTAR !== 'undefined') && KOMMENTAR.ereignis(a.feier === 'pokal' ? 'turnier_sieg' : 'meister', null, true);
      try { const lnd = a.ich === 0 ? s.land : s.gegner; if (typeof KOMMENTAR !== 'undefined' && lnd && lnd[0]) KOMMENTAR.landSatz((a.feier === 'pokal' ? 'turnier_sieg_land_' : 'meister_land_') + lnd[0]); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V6.6: Land nennen
    }
    if (podestZeit && t > a.tH + 2.6 && a.konf.length < 260){
      for (let i = 0; i < 6; i++) a.konf.push({ x: Math.random(), y: -.05 - Math.random() * .1, vy: .12 + Math.random() * .16, vx: (Math.random() - .5) * .06, r: Math.random() * 6, vr: (Math.random() - .5) * 8, f: ['#ffe234', '#ff3fa4', '#2ad4ff', '#ffffff', '#7dff6a', '#ff9a2a'][i] });
    }
    for (const c of a.konf){ c.y += c.vy * dt; c.x += c.vx * dt; c.r += c.vr * dt; }
    if (a.konf.length > 200) a.konf = a.konf.filter(c => c.y < 1.1);
    if (t >= a.T) ausklangEnde();
  }
  function ausklangEnde(){
    if (!s || !s.ausklang) return;
    const elf = s.ausklang.elf;
    s.ausklang = null; s.ausklangFertig = true;
    for (const p of s.spieler){ p.gefallen = 0; p.jubel = 0; p.jubelArt = null; if (p.ak) p.ak.ph = 0; }
    ausklangKnopf(false);
    try { window.scFeierWeg && window.scFeierWeg(); } catch(e){}   // V3.05
    try { if (presseStart(elf)) return; } catch (e) { typeof __scWarn === 'function' && __scWarn(e); presseAufraeumen(); }   // V5.3: erst die Pressekonferenz
    ende(elf != null ? elf : undefined);
  }
  // ===== V5.3: Pressekonferenz mit deinem Trainer – du wählst die Antworten =====
  const PRESSE_KIT = { t: '#d6e6ff', kragen: '#2b3245', n: '#2b3245', h: '#2b3245', s: '#2b3245', sBand: [], schuh: [['#1b1b1b']], land: null };
  const PZ = () => -(HB - 1.0);   // Interview-Wand am Spielfeldrand
  const presseZufall = a => a[(Math.random() * a.length) | 0];
  function presseWand(){
    if (welt.presseWand) return welt.presseWand;
    welt.presseWand = leinwand(640, 384, g => {
      g.fillStyle = '#f4f6fb'; g.fillRect(0, 0, 640, 384);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let y = 0; y < 6; y++) for (let x = 0; x < 5; x++){
        const cx = 64 + x * 128 + (y % 2 ? 64 : 0), cy = 32 + y * 64;
        if ((x + y) % 2){ g.fillStyle = '#0c173d'; g.font = '900 22px system-ui,sans-serif'; g.fillText('SILESCROW', cx, cy - 9); g.fillStyle = '#e0262c'; g.font = '900 17px system-ui,sans-serif'; g.fillText('TV', cx, cy + 12); }
        else { g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(cx, cy, 18, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#0c173d'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#0c173d'; g.font = '900 13px system-ui,sans-serif'; g.fillText('TV', cx, cy + 1); }
      }
      g.fillStyle = '#0c173d'; g.fillRect(0, 372, 640, 12);
    });
    return welt.presseWand;
  }
  // Situation des Spiels -> Kategorien für die drei Fragen
  function presseLage(elf){
    const ich = s.lokalTeam || 0, wir = s.tore[ich], die = s.tore[1 - ich], o = s.optionen || {};
    const mein = s.spieler.filter(p => p.team === ich), elfS = typeof elf === 'number' ? elf : (typeof s.elfmeterSieger === 'number' ? s.elfmeterSieger : null);
    let k1, klasse;
    if (elfS != null && wir === die){ k1 = elfS === ich ? 'elf_sieg' : 'elf_niederlage'; klasse = elfS === ich ? 'sieg' : 'niederlage'; }
    else if (wir > die){ k1 = wir - die >= 3 ? 'sieg_hoch' : wir - die === 1 ? 'sieg_knapp' : 'sieg'; klasse = wir - die >= 3 ? 'sieg_gross' : 'sieg'; }
    else if (wir === die){ k1 = wir === 0 ? 'remis_torlos' : 'remis'; klasse = 'remis'; }
    else { k1 = die - wir >= 3 ? 'niederlage_hoch' : die - wir === 1 ? 'niederlage_knapp' : 'niederlage'; klasse = die - wir >= 3 ? 'niederlage_gross' : 'niederlage'; }
    if (o.turnier === 'FINALE' && !o.liga){ k1 = klasse.startsWith('sieg') ? 'finale_sieg' : 'finale_niederlage'; if (klasse.startsWith('sieg')) klasse = 'sieg_gross'; }
    const st = p => p.st || {};
    const schuetze = mein.filter(p => (st(p).tore || 0) > 0).sort((a, c) => st(c).tore - st(a).tore)[0];
    const tw = mein.find(p => p.rolle === 'TW');
    const verl = mein.find(p => p.verletzt === 'schwer') || mein.find(p => p.verletzt);
    const rot = (s.kartenLog || []).find(x => x.team === ich && x.typ !== 'gelb');
    const k2 = [];
    if (schuetze) k2.push(st(schuetze).tore >= 2 ? 'doppelpack' : 'torschuetze');
    if (verl) k2.push('verletzung');
    if (rot) k2.push('rot');
    if (tw && (st(tw).paraden || 0) >= 3) k2.push('torwart');
    if (die === 0) k2.push('zu_null');
    if ((s.stat.fouls[0] + s.stat.fouls[1]) >= 6 || (s.kartenLog || []).length >= 3) k2.push('schiri');
    k2.push('gegner');
    const k3 = [o.liga ? 'liga' : (o.turnier && o.turnier !== 'FINALE' ? 'pokal' : 'naechstes'), 'fans', 'team', 'naechstes'];
    const zahl = n => ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben'][n] || String(n);
    let platz = '';
    try { if (o.liga && typeof LIGA !== 'undefined' && LIGA.meinPlatz) platz = LIGA.meinPlatz() + '.'; } catch (e) {}
    const vars = { G: (ich === 0 ? s.gegner : s.land)[0], L: (ich === 0 ? s.land : s.gegner)[0], E: wir + ':' + die, T: schuetze ? schuetze.name : '', N: schuetze ? zahl(st(schuetze).tore) : '',
      V: verl ? verl.name : '', R: rot ? rot.name : '', TW: tw ? tw.name : '', P: platz || 'gut', RU: o.turnier || '' };
    if (!platz && k3[0] === 'liga') k3[0] = 'naechstes';
    return { ich, klasse, fragen: [k1, k2[0], k2.length > 1 && Math.random() < .5 ? k2[1] : presseZufall(k3)], vars };
  }
  const presseFuellen = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : '');
  // ungehörten Kern wählen (merkt sich die Auswahl), sonst die Liste zurücksetzen
  function presseKern(prefix, liste){
    let frei = liste.map((_, i) => i).filter(i => !PRESSE_STAND.gehoert(prefix + i));
    if (!frei.length){ PRESSE_STAND.vergiss(prefix); frei = liste.map((_, i) => i); }
    const i = presseZufall(frei); PRESSE_STAND.merke(prefix + i); return liste[i];
  }
  function presseFrage(kat, vars){
    const D = PRESSE_DATEN, kern = presseKern('F|' + kat + '|', D.fragen[kat]);
    let ein = presseZufall(D.ein);
    let t = ein + kern;
    if (/^[A-ZÄÖÜ{]/.test(kern) && /[,–] $/.test(ein) && !/^(Sie|\{)/.test(kern) && !/^[A-ZÄÖÜ][a-zäöüß]+ (gegen|im|Ihr|mit)/.test(kern)) t = ein.replace(/[,–] $/, ': ') + kern;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return presseFuellen(t, vars);
  }
  function presseAntwort(kat, ton, vars){
    const D = PRESSE_DATEN, kern = presseKern('A|' + kat + '|' + ton + '|', D.kerne[kat][ton]);
    return presseFuellen(presseZufall(D.anfang[ton]) + kern + presseZufall(D.schluss[ton]), vars).replace(/\s+/g, ' ').trim();
  }
  // Wirkung der Antworten: Beliebtheit (Fans) und Teamgeist (nächstes Spiel)
  const PRESSE_WIRKUNG = {
    b: { sieg_gross: [1, 1], sieg: [2, 1], remis: [2, 1], niederlage: [2, 1], niederlage_gross: [3, 1] },
    s: { sieg_gross: [3, 1], sieg: [2, 1], remis: [1, 1], niederlage: [-1, 2], niederlage_gross: [-2, 2] },
    f: { sieg_gross: [4, 0], sieg: [2, 0], remis: [-2, -1], niederlage: [-4, -1], niederlage_gross: [-5, -1] } };
  function presseStart(elf){
    if (!s || s.gast || s.fern || s.presseFertig || (s.optionen && s.optionen.modus === 'zusammen')) return false;
    if (s.optionen && s.optionen.htSpiel && s.optionen.htAnsage !== 'ht_finale') return false;   // HALLENTURNIER: Pressekonferenz nur nach dem Finale
    const tr = s.trainer && s.trainer[s.lokalTeam || 0];
    if (!tr || !tr.fig) return false;
    s.presseFertig = true;
    PRESSE_STAND.verfall();   // ohne gute Antworten sinkt die Beliebtheit langsam
    const lage = presseLage(elf), keys = Object.keys(SPRITE_META).filter(k => SPRITES[k + '_v']);
    const rep = randFigur(presseZufall(keys), 0, PRESSE_KIT, '');
    const z = PZ();
    rep.p.set(1.15, 0, z + 1.45); rep.blick.set(-1, 0, -.35);
    // V4.2: dein Star sitzt neben dem Trainer am Pressetisch
    let star = null;
    try { const ix = s.optionen && Array.isArray(s.optionen.squad) ? s.optionen.squad[lage.ich === (s.lokalTeam || 0) ? 0 : 0] : -1, dd = PLAYER_DATABASE[ix];
      if (dd && SPRITES[dd.bild + '_v']){ star = randFigur(dd.bild, lage.ich, (s.kits && s.kits[lage.ich]) || PRESSE_KIT, ''); star.daten = dd; star.name = dd.name; star.p.set(-1.2, 0, z + 1.0); star.blick.set(.4, 0, .9); } } catch (e) { star = null; }
    s.presse = { elf, lage, team: lage.ich, rep, star, nr: 0, stufe: 'frage', t: 0, frage: '', antwort: '', db: 0, dg: 0, bVor: Math.round(PRESSE_STAND.b) };
    s.phase = 'presse';
    try { aktualisiereTafel(); } catch (e) {}
    try { musik.sfx && musik.sfx.stadion(false); } catch (e) {}
    presseNaechsteFrage();
    return true;
  }
  function presseNaechsteFrage(){
    const P0 = s.presse; if (!P0) return;
    const kat = P0.lage.fragen[P0.nr];
    P0.kat = kat; P0.frage = presseFrage(kat, P0.lage.vars); P0.antwort = ''; P0.stufe = 'frage'; P0.t = 0;
    P0.wahl = ['b', 's', 'f'].map(ton => ({ ton, text: presseAntwort(kat, ton, P0.lage.vars) }));
    presseUI();
  }
  function presseWaehlen(i){
    const P0 = s.presse; if (!P0 || P0.stufe !== 'frage') return;
    const w = P0.wahl[i]; if (!w) return;
    let [db, dg] = PRESSE_WIRKUNG[w.ton][P0.lage.klasse] || [0, 0];
    if (P0.kat === 'verletzung' && w.ton === 'f') db -= 1;
    if (P0.kat === 'fans' && w.ton !== 'f') db += 1;
    if (Math.random() < .25) db += Math.random() < .5 ? -1 : 1;
    P0.db += db; P0.dg += dg;
    PRESSE_STAND.aendern(db, dg);
    P0.antwort = w.text; P0.stufe = 'antwort'; P0.t = 0; P0.letzte = { db, dg };
    try { musik.auswahl && musik.auswahl(true); } catch (e) {}
    presseUI();
  }
  function presseSchritt(dt){
    const P0 = s.presse; if (!P0) return;
    P0.t += dt;
    const rep = P0.rep; rep.v.set(0, 0, 0); animiereFigur(rep, dt, 0);
    if (P0.star){ const st = P0.star; st.v.set(0, 0, 0); animiereFigur(st, dt, 0); st.zeichen.pose = 'sitzen'; st.zeichen.huefteFest = .32; st.zeichen.intens = 0; }
    // Reporter hält das Mikrofon hin, nickt beim Zuhören
    rep.zeichen.armPose = null;
    if (P0.stufe === 'antwort' && (P0.weiter || P0.t > Math.min(3.5, 1.5 + P0.antwort.length / 45))){   // V5.8: kürzere Pause, WEITER-Knopf
      P0.weiter = false;
      P0.nr++;
      if (P0.nr >= 3){ P0.stufe = 'ende'; presseUI(); }
      else presseNaechsteFrage();
    }
  }
  function presseTrainer(tr, dt){
    const o = tr.fig, P0 = s.presse, z = PZ();
    o.p.set(-.15, 0, z + 1.0); o.v.set(0, 0, 0);
    o.blick.set(.55, 0, .85);
    o.jubel = 0;
    animiereFigur(o, dt, 0);
    o.zeichen.pose = 'sitzen'; o.zeichen.huefteFest = .32; o.zeichen.intens = 0;   // V4.2: sitzt am Pressetisch
    if (P0 && P0.stufe === 'antwort' && P0.wahlTon === 's') o.zeichen.armPose = 'faust';
    tr.x = o.p.x; tr.z = o.p.z;
    const k = P(o.p.x, 1.62, o.p.z); tr.kopf = { x: k.x, y: k.y, s: k.s };
  }
  function presseZeichnen(liste, g){
    const P0 = s.presse; if (!P0) return;
    const z = PZ(), wand = presseWand();
    liste.push([z - .02, () => zeichneBildFlaeche(g, wand, [-2.55, 0, z], [1.35, 0, z], [-2.55, 2.2, z], 4, 2)]);
    // V4.2: zwei TV-Kameras auf Stativen filmen den Pressetisch
    for (const [kx, kz, dir] of [[-2.45, z + 2.1, .35], [2.35, z + 2.5, -.45]]){
      liste.push([kz, () => {
        const fuss = [[-.32, .22], [.32, .22], [0, -.34]].map(([dx, dz]) => P(kx + dx, 0, kz + dz)), kopf = P(kx, 1.22, kz);
        g.strokeStyle = '#2b2b2b'; g.lineWidth = Math.max(2, kopf.s * .03); g.lineCap = 'round';
        for (const f of fuss){ g.beginPath(); g.moveTo(kopf.x, kopf.y); g.lineTo(f.x, f.y); g.stroke(); }
        const hl = P(kx - .05 - dir * .3, 1.2, kz + .35), hr = P(kx + .05 + dir * .3, 1.42, kz - .45);   // Kamera-Körper (Rücken zu uns, Objektiv zum Tisch)
        const w = kopf.s * .34, h = kopf.s * .22;
        g.fillStyle = '#1d1f24'; g.beginPath(); g.roundRect ? g.roundRect(kopf.x - w / 2, kopf.y - h * 1.05, w, h, h * .18) : g.rect(kopf.x - w / 2, kopf.y - h * 1.05, w, h); g.fill();
        g.fillStyle = '#3a3d45'; g.fillRect(kopf.x - w * .42, kopf.y - h * .95, w * .84, h * .22);
        // Objektiv zeigt zu den Spielern am Tisch: Rohr + Sonnenblende zur Tischseite
        { const bx = kopf.x + dir * w * .5, by = kopf.y - h * .55, L = w * .5, R = h * .3;
          g.fillStyle = '#121317'; g.fillRect(dir > 0 ? bx : bx - L, by - R, L, R * 2);
          g.fillStyle = '#26282e'; g.beginPath(); const ex = bx + dir * L; g.moveTo(ex, by - R); g.lineTo(ex + dir * L * .35, by - R * 1.45); g.lineTo(ex + dir * L * .35, by + R * 1.45); g.lineTo(ex, by + R); g.closePath(); g.fill();
          g.fillStyle = '#5b7fd6'; g.beginPath(); g.ellipse(ex + dir * L * .35, by, R * .25, R * 1.25, 0, 0, Math.PI * 2); g.fill(); }   // Glas
        g.fillStyle = '#e0262c'; g.beginPath(); g.arc(kopf.x - w * .36, kopf.y - h * .82, Math.max(1.5, h * .08), 0, Math.PI * 2); g.fill();   // Aufnahme-Licht
        g.fillStyle = '#fff'; g.font = '900 ' + Math.max(6, h * .3) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SILESCROW TV', kopf.x, kopf.y - h * .45);
        g.fillStyle = '#2b2b2b'; g.fillRect(kopf.x - w * .5, kopf.y - h * 1.32, w * .35, h * .25);   // Sucher
      }]);
    }
    // V4.2: Pressetisch mit SILESCROW-TV-Blende und Tischmikrofonen
    if (P0.star) liste.push([P0.star.p.z, () => zeichneFigur(g, P0.star)]);
    const tz = z + 1.75, tzH = z + .8, x0 = -1.85, x1 = .62, th = .8;
    if (!welt.presseTisch) welt.presseTisch = leinwand(512, 168, c => {
      const gr = c.createLinearGradient(0, 0, 0, 168); gr.addColorStop(0, '#16275e'); gr.addColorStop(1, '#0a1230');
      c.fillStyle = gr; c.fillRect(0, 0, 512, 168); c.fillStyle = '#ffd23a'; c.fillRect(0, 0, 512, 12); c.fillStyle = '#e0262c'; c.fillRect(0, 12, 512, 4);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.font = '900 58px system-ui,sans-serif'; c.fillText('SILESCROW', 220, 92);
      c.fillStyle = '#e0262c'; c.fillRect(392, 60, 92, 64); c.fillStyle = '#fff'; c.font = '900 50px system-ui,sans-serif'; c.fillText('TV', 438, 94);
    });
    liste.push([tz, () => {
      // Tischplatte
      const a = P(x0, th, tz), b = P(x1, th, tz), c = P(x1, th, tzH), d = P(x0, th, tzH);
      g.fillStyle = '#263a7a'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fill();
      g.strokeStyle = '#0a1230'; g.lineWidth = Math.max(1, a.s * .02); g.stroke();
      // Blende vorne
      { const u0 = P(x0, -.12, tz), u1 = P(x1, -.12, tz), o0 = P(x0, th, tz), o1 = P(x1, th, tz); g.fillStyle = '#0a1230'; g.beginPath(); g.moveTo(u0.x, u0.y); g.lineTo(u1.x, u1.y); g.lineTo(o1.x, o1.y); g.lineTo(o0.x, o0.y); g.closePath(); g.fill(); }   // Blende bis zum Boden, keine Beine sichtbar
      zeichneBildFlaeche(g, welt.presseTisch, [x0, 0, tz], [x1, 0, tz], [x0, th, tz], 3, 1);
      // Tischmikrofone vor Star und Trainer
      const plaetze = [-.15]; if (P0.star) plaetze.push(P0.star.p.x);
      for (const px of plaetze){
        const f = P(px + .22, th, z + 1.16), o = P(px + .14, th + .3, z + 1.1);
        g.fillStyle = '#1b1b1b'; g.beginPath(); g.ellipse(f.x, f.y, Math.max(3, f.s * .07), Math.max(1.5, f.s * .025), 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#2a2a2a'; g.lineWidth = Math.max(2, f.s * .018); g.lineCap = 'round'; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(o.x, o.y); g.stroke();
        const w = o.s * .1; g.fillStyle = '#e0262c'; g.fillRect(o.x - w / 2, o.y + w * .15, w, w * .8);
        g.fillStyle = '#fff'; g.font = '900 ' + Math.max(6, w * .42) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TV', o.x, o.y + w * .55);
        g.fillStyle = '#333'; g.beginPath(); g.arc(o.x, o.y, Math.max(2.5, o.s * .045), 0, Math.PI * 2); g.fill();
      }
      // Namensschilder
      const schild = (px, txt) => { const q = P(px, th + .07, tz - .06), w = q.s * .5, h = q.s * .12; g.fillStyle = '#fff'; g.fillRect(q.x - w / 2, q.y - h, w, h); g.strokeStyle = '#0a1230'; g.lineWidth = 1; g.strokeRect(q.x - w / 2, q.y - h, w, h);
        g.fillStyle = '#0c173d'; g.font = '900 ' + Math.max(6, h * .62) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, q.x, q.y - h / 2); };
      schild(-.15 - .25, 'TRAINER'); if (P0.star) schild(P0.star.p.x - .25, P0.star.name);
    }]);
    liste.push([P0.rep.p.z, () => {
      zeichneFigur(g, P0.rep);
      // V4.2: kein Handmikrofon mehr – die Mikrofone stehen auf dem Tisch
    }]);
  }
  function presseKamera(){
    const z = PZ();
    kam.pos.set(.5, 1.75, z + 7.4); kamZiel.set(.45, 1.1, z + 1.1);
  }
  function presseAufraeumen(){
    const el = document.getElementById('presseUeber'); if (el) el.hidden = true;
    if (s) s.presse = null;
  }
  function presseEnde(){
    const P0 = s && s.presse; if (!P0) return;
    const elf = P0.elf; presseAufraeumen();
    ende(elf != null ? elf : undefined);
  }
  function presseUI(){
    const P0 = s.presse;
    let el = document.getElementById('presseUeber');
    if (!el){
      el = document.createElement('div'); el.id = 'presseUeber';
      ($s('spiel') || document.body).appendChild(el);
      el.addEventListener('click', ev => {
        const bt = ev.target.closest && ev.target.closest('button'); if (!bt) return; ev.stopPropagation();
        if (bt.dataset.w != null){ if (s.presse) s.presse.wahlTon = s.presse.wahl[+bt.dataset.w].ton; presseWaehlen(+bt.dataset.w); }
        else if (bt.classList.contains('p-naechste')){ if (s.presse) s.presse.weiter = true; }
        else if (bt.classList.contains('p-skip') || bt.classList.contains('p-weiter')) presseEnde();
      });
    }
    if (!P0){ el.hidden = true; return; }
    el.hidden = false;
    const tr = s.trainer[P0.team], land = (P0.team === 0 ? s.land : s.gegner);
    const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const kopf = '<div class="p-bauch"><b>🎙️ PRESSE</b><span>' + (land[1] || '') + ' TRAINER · ' + esc(land[0]) + ' · ' + s.tore[0] + ':' + s.tore[1] + '</span></div><button type="button" class="p-skip">ÜBERSPRINGEN ▸▸</button>';
    if (P0.stufe === 'ende'){
      const b = Math.round(PRESSE_STAND.b), d = b - P0.bVor;
      el.innerHTML = kopf + '<div class="p-ende"><h3>PRESSEKONFERENZ BEENDET</h3>❤️ Beliebtheit: ' + P0.bVor + ' % → <b>' + b + ' %</b> (' + (d >= 0 ? '+' : '') + d + ')<br>💪 Teamgeist fürs nächste Spiel: <b>' + (PRESSE_STAND.g > 0 ? '+' : '') + PRESSE_STAND.g + '</b>'
        + '<br><small>Mehr Beliebtheit = vollere Tribünen und lautere Fans</small><br><button type="button" class="p-weiter">WEITER ▸</button></div>';
      return;
    }
    let html = kopf + '<div class="p-frage"><small>🎙️ REPORTER · FRAGE ' + (P0.nr + 1) + '/3</small>' + esc(P0.frage) + '</div>';
    if (P0.stufe === 'frage'){
      const TON = { b: '🙂 BESCHEIDEN', s: '😎 SELBSTBEWUSST', f: '🔥 FRECH' };
      html += '<div class="p-wahl">' + P0.wahl.map((w, i) => '<button type="button" class="t-' + w.ton + '" data-w="' + i + '"><i>' + TON[w.ton] + '</i>' + esc(w.text) + '</button>').join('') + '</div>';
    } else {
      const l = P0.letzte || { db: 0, dg: 0 };
      html += '<div class="p-antwort"><small>💬 TRAINER</small>' + esc(P0.antwort) + '</div>';
      html += '<div class="p-wahl"><button type="button" class="p-naechste" style="flex:0 0 auto;margin-left:auto;text-align:center">' + (P0.nr >= 2 ? 'FERTIG ▸' : 'NÄCHSTE FRAGE ▸') + '</button></div>';
      html += '<div class="p-wirkung">❤️ ' + (l.db >= 0 ? '+' : '') + l.db + '  ·  💪 ' + (l.dg >= 0 ? '+' : '') + l.dg + '</div>';
    }
    el.innerHTML = html;
  }
  // ---- Zeichnen: Podest, Pokal / Schale, Konfetti (V6.2)
  function ausklangZeichnen(liste, g){
    const a = s.ausklang; if (!a || !a.feier || a.t < a.tH - .5) return;
    liste.push([PODEST_Z - .8, () => zeichnePodest(g, a.feier)]);
    const kp = a.kapitaen;
    if (kp && kp.ak && kp.ak.ph > PODEST_H * .8 && a.t > a.tH + 2.2){
      const hoch = klemme((a.t - a.tH - 2.2) / .6, 0, 1), wipp = Math.sin(a.t * 6) * .06 * hoch;
      liste.push([kp.p.z + .05, () => zeichnePokal(g, kp.p.x, PODEST_H + 1.7 + (a.feier === 'schale' ? .3 : 0) + .5 * hoch + wipp, kp.p.z + .1, a.feier)]);
    }
    if (a.konf.length) liste.push([1e6, () => {
      g.save();
      for (const c of a.konf){ g.save(); g.translate(c.x * kam.w, c.y * kam.h); g.rotate(c.r); g.fillStyle = c.f; g.fillRect(-4, -2.5, 8, 5); g.restore(); }
      g.restore();
    }]);
  }
  function zeichnePodest(g, art){
    const x0 = -3.9, x1 = 3.9, z0 = PODEST_Z - .75, z1 = PODEST_Z + .75, h = PODEST_H;
    g.save();
    // Oberseite
    vieleck(g, [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]]); g.closePath(); g.fillStyle = '#e9edf7'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#0b1430'; g.stroke();
    // Vorderseite
    vieleck(g, [[x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1]]); g.closePath();
    const o = P(0, h, z1), u = P(0, 0, z1), gr = g.createLinearGradient(0, o.y, 0, u.y); gr.addColorStop(0, '#1d3a8f'); gr.addColorStop(1, '#0e1b47');
    g.fillStyle = gr; g.fill(); g.stroke();
    // goldene Kante und Schrift
    vieleck(g, [[x0, h, z1], [x1, h, z1], [x1, h - .07, z1], [x0, h - .07, z1]]); g.closePath(); g.fillStyle = '#ffd34a'; g.fill();
    const m = P(0, h * .42, z1), fs = Math.max(8, m.s * .3);
    g.font = '900 ' + fs + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffe234'; g.fillText(art === 'pokal' ? ((s && s.optionen && s.optionen.halle) ? 'HALL OF FAME · SIEGER' : 'SILESCROW CUP · SIEGER') : 'LEAGUE · MEISTER', m.x, m.y);   // V3.05
    g.restore();
  }
  function zeichnePokal(g, x, y, z, art){
    const m = P(x, y, z), u = m.s;   // u = Pixel pro Meter
    g.save(); g.translate(m.x, m.y); g.lineJoin = 'round';
    const rand = '#3b2a00';
    if (art === 'schale'){
      // Meisterschale: silberne runde Schale mit Ringen
      const r = .58 * u;
      const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.6, '#c9d2e0'); gr.addColorStop(1, '#8a96aa');
      g.beginPath(); g.ellipse(0, 0, r, r * .92, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1.5, u * .03); g.strokeStyle = '#4a5468'; g.stroke();
      for (const k of [.72, .45]){ g.beginPath(); g.ellipse(0, 0, r * k, r * k * .92, 0, 0, Math.PI * 2); g.strokeStyle = 'rgba(74,84,104,.7)'; g.lineWidth = Math.max(1, u * .02); g.stroke(); }
      g.beginPath(); g.ellipse(0, 0, r * .2, r * .18, 0, 0, Math.PI * 2); g.fillStyle = '#ffd34a'; g.fill();
    } else {
      // Pokal: goldener Becher mit zwei Henkeln, Stiel und dunklem Sockel
      const w = .4 * u, hB = .52 * u;
      const gold = g.createLinearGradient(-w, 0, w, 0); gold.addColorStop(0, '#b8860b'); gold.addColorStop(.35, '#ffe98a'); gold.addColorStop(.6, '#ffd34a'); gold.addColorStop(1, '#a87400');
      g.lineWidth = Math.max(1.5, u * .03); g.strokeStyle = rand;
      // Henkel
      for (const sgn of [-1, 1]){ g.beginPath(); g.ellipse(sgn * w * 1.05, -hB * .55, w * .42, hB * .32, 0, 0, Math.PI * 2); g.lineWidth = Math.max(2.5, u * .06); g.strokeStyle = '#d9a514'; g.stroke(); }
      g.lineWidth = Math.max(1.5, u * .03); g.strokeStyle = rand;
      // Becher
      g.beginPath(); g.moveTo(-w, -hB); g.lineTo(w, -hB); g.quadraticCurveTo(w * .95, -hB * .1, w * .18, 0); g.lineTo(-w * .18, 0); g.quadraticCurveTo(-w * .95, -hB * .1, -w, -hB); g.closePath(); g.fillStyle = gold; g.fill(); g.stroke();
      // Stiel + Sockel
      g.beginPath(); g.rect(-w * .14, 0, w * .28, hB * .28); g.fillStyle = gold; g.fill(); g.stroke();
      g.beginPath(); g.rect(-w * .55, hB * .28, w * 1.1, hB * .22); g.fillStyle = '#20232b'; g.fill(); g.stroke();
      // Glanz
      g.beginPath(); g.ellipse(-w * .45, -hB * .6, w * .1, hB * .25, -.2, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
    }
    g.restore();
  }

  function anstossPositionen(team){
    for (const p of s.spieler){
      if (!p.aktiv) continue;
      const dir = richt(p.team);
      let x, z;
      if (p.rolle === 'TW'){ x = torX(p.team) + dir * .7; z = 0; }
      else if (p.fu != null){
        // 11er-Test: Formation in der eigenen Hälfte; Gegner außerhalb des Mittelkreises
        if (p.slot === 2 && p.team === team){ const erster = !teamSp(p.team).some(q => q !== p && q.slot === 2 && q.fv < p.fv); x = erster ? -dir * .9 : -dir * 2.6; z = erster ? .4 : -3.2; }
        else if (p.slot === 2){ x = -dir * Math.min(8, KREIS + 1.2); z = p.fv * HB * .7; }
        else { x = dir * HL * Math.min(p.fu, -.06); z = p.fv * HB * .85; { const rk = KREIS + .6; if (Math.hypot(x, z) < rk) x = -dir * Math.sqrt(Math.max(0, rk * rk - z * z)); } }
      }
      else if (p.slot === 0){ x = -dir * HL * .55; z = (p.seite || 0) * 5; }
      else if (p.slot === 1){ x = -dir * HL * (p.team === team ? .22 : .45); z = p.team ? -5 : 5; }
      else { x = -dir * (p.team === team ? .9 : HL * .45); z = p.team === team ? .4 : 3; }
      p.p.set(x, 0, z); p.v.set(0, 0, 0); p.blick.set(dir, 0, 0); p.grae = 0; p.gefallen = 0; p.sperre = 0;
    }
  }

  // =================================================================
  // Ball: Schüsse und Pässe
  // =================================================================
  function ballLos(von){
    const b = welt.ball;
    b.abseits = null;
    b.besitzer = null; b.letzter = von; b.letzteTeam = von.team; von.sperre = .32; b.twCheck = null; b.drall = 0; b.spin = null;
  }
  // Abseits: Mitspieler ist in der gegnerischen Hälfte, näher an der Torlinie als Ball und vorletzter Gegner
  function abseitsLinie(team){                       // x (in Angriffsrichtung von team) des vorletzten Gegners
    const dir = richt(team), xs = teamSp(1 - team).map(g => g.p.x * dir).sort((a, c) => c - a);
    return xs.length > 1 ? xs[1] : -1e9;
  }
  function imAbseits(m, ballX){
    const dir = richt(m.team), mx = m.p.x * dir;
    return mx > .3 && mx > ballX * dir + .05 && mx > abseitsLinie(m.team) + .05;   // V5.5: Linienrichter erkennen auch knappes Abseits (5 cm)
  }
  function abseits(p){
    const b = welt.ball;
    if (s.phase !== 'spiel') return;
    s.abseitsFahne = { x: p.p.x, bis: performance.now() + 2200 };   // V5.5: Linienrichter hebt die Fahne
    s.phase = 'pfiff'; s.phaseT = 1.6;
    musik.sfx && musik.sfx.pfiff(1);
    b.besitzer = null; b.v.set(0, 0, 0); b.abseits = null;
    const ort = p.p.clone(); ort.x = klemme(ort.x, -HL + 1, HL - 1); ort.z = klemme(ort.z, -HB + 1, HB - 1);
    s.foulDaten = { taeter: p, team: 1 - p.team, ort, karte: null };
    meldung('ABSEITS!', p.name + ' stand im Abseits', null, 1.8);
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('abseits', p.name, true);
  }
  // Statistik je Spieler (für Bewertung und MVP nach dem Spiel)
  function pst(p){ return p.st || (p.st = { tore: 0, vorlagen: 0, schuesse: 0, aufsTor: 0, paesse: 0, passOk: 0, ballGew: 0, paraden: 0, gegentore: 0, fouls: 0, gelb: 0, rot: 0 }); }
  function passen(p, m, hoch, kraft = 0){   // V5.4: kraft 0..1 = PASS gehalten -> schneller und weiter, etwas ungenauer
    const b = welt.ball, st = STUFE[s.stufe];
    const genau = Math.min(1, (spezAn(p, 'pas') ? 1 : (p.team === 1 ? st.genau : .85) * (.85 + (W(p, 'pas') - 70) * .012)) * (hatFae(p, 'pass') ? 1.15 : 1));
    const vor = Math.min(1.1, d2(p.p, m.p) / 11);
    const ziel = m.p.clone().addScaledVector(m.v, .45 + vor * .45);
    const weg = V(ziel.x - b.p.x, 0, ziel.z - b.p.z), dist = weg.length();
    {   // V5.8: Fehlpässe - Passwert, Entfernung und Gegnerdruck bestimmen die Streuung
      const skill = klemme((W(p, 'pas') - 50) / 40, 0, 1);                          // 0 = Passwert 50 (schwach), 1 = Passwert 90 (stark)
      let maxW = spezAn(p, 'pas') ? 0 : (18 - 16.5 * skill) * Math.PI / 180 * (hatFae(p, 'pass') ? .45 : 1);          // schwach bis ca. 18 Grad, stark nur ca. 1,5 Grad
      if (p.team === 1) maxW *= (1.5 - st.genau * .67);                               // KI-Stufe: leicht ungenauer, stark genauer
      maxW *= 1 + klemme((dist - 10) / 20, 0, 1) * .6;                                // lange Pässe ungenauer
      let nahG = 99; for (const q of teamSp(1 - p.team)) nahG = Math.min(nahG, d2(q.p, p.p));
      if (nahG < 3) maxW *= 1 + (3 - nahG) / 3 * .8;                                  // Gegner direkt am Ball: mehr Fehler
      maxW = Math.min(maxW * (1 + kraft * .4), .61);                                  // maximal ca. 35 Grad
      weg.normalize().applyAxisAngle(V(0,1,0), (Math.random() - .5) * 2 * maxW);
    }
    if (hoch){
      const tempo = klemme(dist * .9 + 4, 8, 15) * (1 + kraft * .45), T = flugZeit(dist, tempo);
      b.v.copy(weg.multiplyScalar(tempo)); b.v.y = .5 * G * T * .95;
    } else {
      const tempo = klemme(dist * 1.15 + 5, 7.5, 16) * (spezAn(p, 'pas') ? 1.15 : 1) * (1 + kraft * .6);
      b.v.copy(weg.multiplyScalar(tempo)); b.v.y = dist > 12 ? 1.6 : 0;
    }
    ballLos(p); b.passZiel = m; b.schussVon = null; b.passVon = p; pst(p).paesse++;
    // V4.1: Steuerung springt sofort zum Empfänger (nicht erst bei der Ballannahme)
    // V9.0: auch online – jeder Mensch, der allein in seinem Team ist, springt nach dem Pass auf den Empfänger (wie in der Liga)
    try { if (ALLE_STEUERN && !s.gast && m && m.team === p.team && m.aktiv && m.rolle !== 'TW' && !istMensch(m)){ for (const k of menschen()){ if (k.steuer === p && (!s.fern || wechselErlaubt(k))){ steuerWechsel(k, m); k.autoT = performance.now() + 380; break; } } } } catch (e) {}
    spinSetzen(b, (Math.random() - .5) * (hoch ? 22 : 8), hoch ? 8 : 0);   // V4.4: leichter Drall, hohe Pässe mit etwas Rückwärtsdrall
    if (p.rolle !== 'TW' && s.phase === 'spiel'){
      // Doppelpass: nach dem Abspiel diagonal nach vorn in den freien Raum starten (Abwehr nur bis zur Mitte)
      const dirP = richt(p.team), linie = abseitsLinie(p.team);
      let tx = p.p.x + dirP * zufall(4.5, 7.5);
      if (p.slot === 0) tx = Math.min(tx * dirP, HL * .1) * dirP;
      tx = Math.min(tx * dirP, linie - .6) * dirP;
      p.raumZiel = imFeld(V(tx, 0, klemme(p.p.z * .55 + (m.p.z > p.p.z ? -2 : 2), -HB + 2, HB - 2))); p.raumT = 1.3;
    }
    // Abseits prüfen (nicht bei Einwurf, Ecke, Abstoß)
    b.abseits = (s.phase === 'spiel' || (s.std && s.std.typ === 'freistoss')) && imAbseits(m, b.p.x) ? m : null;
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('pass', p.name);
    musik.sfx && musik.sfx.schuss(.35);
    for (const k of menschen()) if (!k.fest && !s.fern && k.team === p.team && (p === k.steuer || s.std || ALLE_STEUERN) && !istMensch(m) && m.rolle !== 'TW') k.steuer = m;   // alle steuern: sofort beim Abspiel auf den Empfänger
    // V5.2: Spielst du als Feldspieler selbst ab, wechselt die Steuerung automatisch auf den Empfänger (nie auf den Torwart, nie bei KI-Pässen)
    // V6.2: Kein automatischer Wechsel mehr nach dem Pass - du spielst immer deinen festen Spieler, der Rest ist KI. Wechsel nur per PASS-Taste (passWechsel), wenn du nicht am Ball bist.
  }
  function schiessen(p, kraft, zielZ, zielY, effet){
    const b = welt.ball, dir = richt(p.team), gx = dir * (HL + .4);
    // Weitschüsse: ab ca. 10 m vor dem Tor streut der Schuss seitlich und in der Höhe (mehr vorbei / drüber)
    const weit = klemme((Math.abs(gx - b.p.x) - 10) / 12, 0, 1);
    // V5.3: Finesse-Schuss – ohne eigenen Effet dreht er den Ball automatisch ins lange Eck
    if (hatFae(p, 'finesse') && !effet && Math.abs(gx - b.p.x) > 8){ const lang = -(Math.sign(b.p.z) || 1); zielZ = lang * (TB - .55); effet = lang * 2.6; zeigeHinweis('🌀 FINESSE!', .9); }
    if (weit > 0){
      const ruhig = hatFae(p, 'schuss') || hatFae(p, 'finesse') ? .55 : 1;
      zielZ += (Math.random() - .5) * weit * 7.5 * ruhig;
      zielY = Math.max(.1, zielY + (Math.random() - .35) * weit * 4.2 * ruhig);
    }
    b.schussX0 = b.p.x;
    const feuer = spezAn(p, 'sch');
    const tempo = (12.5 + kraft * 12.5) * (.9 + (W(p, 'sch') - 70) * .01) * (feuer ? 1.3 : 1) * (hatFae(p, 'schuss') ? 1.1 : 1);
    let weg = V(gx - b.p.x, 0, zielZ - b.p.z), dist = weg.length(), T = flugZeit(dist, tempo), drall = 0;
    if (effet && dist > 5){
      // V2.5: Angedrehter Schuss – Startrichtung geht am Ziel vorbei, der Drall holt den Ball zurück aufs Ziel
      const aZ = Math.atan2(zielZ - b.p.z, gx - b.p.x);
      const half = klemme(Math.atan2(zielZ + effet - b.p.z, gx - b.p.x) - aZ, -.32, .32) * -1;   // Halbe Gesamtdrehung (Start -> Ziel)
      const aS = aZ - half, ah = Math.abs(half);
      const bogen = ah > .01 ? dist * ah / Math.sin(ah) : dist;
      T = flugZeit(bogen, tempo); drall = 2 * half / T;
      weg = V(Math.cos(aS), 0, Math.sin(aS));
      zielY = Math.max(zielY, .5);
    }
    b.v.copy(weg.normalize().multiplyScalar(tempo));
    b.v.y = klemme((zielY - BALL_R + .5 * G * T * T) / T, 0, 14);
    ballLos(p); b.passZiel = null; b.schussVon = p; b.spurPunkte.length = 0; b.passVon = null; b.feuer = feuer;
    b.drall = 0; b.dvx = b.v.x; b.dvz = b.v.z;
    // V4.4: Drall = Magnus-Effekt. Jeder Schuss hat etwas Seitendrall (kein Schuss fliegt ganz gerade),
    // harte Schüsse bekommen Vorwärtsdrall (senken sich), Heber Rückwärtsdrall.
    { const grund = (Math.random() < .5 ? -1 : 1) * (6 + Math.random() * 16) * (.5 + kraft * .6);
      const seite = drall ? klemme(drall / PH_KM, -95, 95) : grund;
      const oben = zielY > 1.9 && kraft < .6 ? 18 : kraft > .75 ? -14 * kraft : -4;
      spinSetzen(b, seite, oben); }
    if (feuer){ p.spezT = 0; zeigeHinweis('🔥 FEUERSCHUSS!', 1.2); }
    s.stat.schuesse[p.team]++; pst(p).schuesse++;
    musik.sfx && musik.sfx.schuss(.6 + kraft * .4);
    s.letzterSchuetze = p.name;
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(b.p.y > .6 ? 'volley' : Math.abs(b.p.x - richt(p.team) * HL) > 15 ? 'schuss_weit' : 'schuss', p.name);
  }
  function kiSchuss(p){
    const st = STUFE[s.stufe], genau = (p.team === 1 ? st.genau : .78) * (.8 + (W(p, 'sch') - 70) * .015);
    const tw = torwartVon(1 - p.team);
    const seite = tw ? (tw.p.z > 0 ? -1 : 1) : (Math.random() < .5 ? -1 : 1);
    let z = seite * zufall(TB - 1.9, TB - .2), y = zufall(.25, 1.6);
    z += (Math.random() - .5) * (1.15 - genau) * 5.5; y += (Math.random() - .3) * (1.15 - genau) * 2.2;
    // V2.5: Manche Schüsse werden angedreht (Bogenschuss ins lange Eck)
    const dTor = Math.hypot(richt(p.team) * HL - p.p.x, p.p.z);
    let effet = 0;
    const pEff = klemme((dTor - 7) / 16, 0, 1) * .6 + (Math.abs(p.p.z) > 4 && dTor > 8 ? .15 : 0);
    if (dTor > 7 && Math.random() < pEff * (.6 + (W(p, 'sch') - 70) * .012)){
      effet = seite * zufall(1.6, 3.8) * (1 + (Math.random() - .5) * (1.15 - genau));
    }
    schiessen(p, zufall(.45, .9), z, y, effet);
  }
  // Schuss des Nutzers: Richtung vom Joystick, Kraft vom Aufladen
  function nutzerSchuss(p, kraft, ziel){
    const dir = richt(p.team), gx = dir * HL;
    let z;
    // V9.3: Stick seitlich = Ecke wählen (schräg = genau ins Eck, ganz seitlich = knapp am Pfosten vorbei möglich), sonst Richtung Tormitte
    if (ziel && ziel.length() > .3){ const zl = ziel.z / Math.max(.01, Math.hypot(ziel.x, ziel.z)); z = zl * (TB + .3) * 1.25; }
    else z = p.p.z * .3;
    const zRoh = z, dTor = Math.hypot(gx - p.p.x, p.p.z);
    // V9.3: Schüsse gehen Richtung Tor (Weit- und Nahschuss); Streuung je nach Entfernung und Schusswert – daneben oder drüber ist möglich
    const streu = (.35 + Math.min(dTor, 35) * .028) * (1.15 - Math.min(1, W(p, 'sch') / 120));
    z = klemme(z, -(TB + .5), TB + .5) + (Math.random() - .5) * 3.2 * streu;
    z = klemme(z, -(TB + 2.2), TB + 2.2);
    const y = Math.max(.2, .25 + kraft * 1.45 + (kraft > .88 ? Math.random() * 1.1 : 0) + (Math.random() - .5) * .35);   // volle Kraft: kann über das Tor gehen
    // V2.5: Zielst du mit dem Stick am Pfosten vorbei, dreht der Ball ins Tor (angedrehter Schuss)
    schiessen(p, kraft, z, y);   // V9.3: kein stark angedrehter Schuss mehr (flog oft weit am Tor vorbei)
  }
  function passZiel(p, richtung){
    let bester = null, wert = -1e9;
    for (const m of teamSp(p.team)){
      if (m === p) continue;
      const weg = V(m.p.x - p.p.x, 0, m.p.z - p.p.z), d = weg.length(); weg.normalize();
      const w = richtung ? weg.dot(richtung) * 6 - d * .12 : passWert(p, m);
      if (w > wert){ wert = w; bester = m; }
    }
    return bester;
  }
  function passWert(p, m){
    const dir = richt(p.team), d = d2(p.p, m.p);
    let w = (m.p.x - p.p.x) * dir * .45;
    let frei = 9; for (const q of teamSp(1 - p.team)) frei = Math.min(frei, d2(q.p, m.p));
    w += Math.min(frei, 5) * .8;
    // Passweg blockiert?
    for (const q of teamSp(1 - p.team)){
      const ab = V(m.p.x - p.p.x, 0, m.p.z - p.p.z), ap = V(q.p.x - p.p.x, 0, q.p.z - p.p.z);
      const t = klemme(ap.dot(ab) / ab.lengthSq(), 0, 1);
      const abstand = ap.sub(ab.multiplyScalar(t)).length();
      if (abstand < 1.1 && t > .1 && t < .95) w -= 6;
    }
    if (d > 15) w -= (d - 15) * .8; if (d < 3) w -= 3;
    if (m.rolle === 'TW') w -= 4;
    if (istMensch(m)) w += 3.2;                                   // Mensch bevorzugt anspielen
    if (imAbseits(m, p.p.x)) w -= 12;                              // nicht ins Abseits spielen
    return w;
  }
  // =================================================================
  // KI
  // =================================================================
  function naechster(team, pos, ohne){
    let best = null, bd = 1e9;
    for (const p of teamSp(team)){ if (p === ohne || p.rolle === 'TW') continue; let d = d2(p.p, pos); if (p.fu != null) d += Math.max(0, d2(basisPosition(p), pos) - (p.slot === 0 ? 11 : p.slot === 1 ? 13 : 15)) * .6; if (d < bd){ bd = d; best = p; } }
    return best;
  }
  function ballVorhersage(t){
    const b = welt.ball, k = Math.exp(-.8 * t);
    return V(b.p.x + b.v.x * (1 - k) / .8, 0, b.p.z + b.v.z * (1 - k) / .8);
  }

  // V5.3: Kopfball – wo kommt die Flanke in Kopfhöhe (ca. 1,7 m) herunter? (mit Schwerkraft und Luftwiderstand, alle 0,1 s neu)
  function kopfPunkt(){
    const b = welt.ball;
    if (!b.flanke || b.besitzer) return null;
    if (b.kopfP && s.zeit - b.kopfP.t < .1) return b.kopfP.p;
    let x = b.p.x, y = b.p.y, z = b.p.z, vx = b.v.x, vy = b.v.y, vz = b.v.z, t = 0;
    for (; t < 3.5; t += .03){
      const v = Math.hypot(vx, vy, vz), f = 1 / (1 + PH_KD * cdVon(v) * v * .03);
      vx *= f; vz *= f; vy -= G * .03; x += vx * .03; y += vy * .03; z += vz * .03;
      if (vy < 0 && y < 1.7) break;
    }
    const pk = V(klemme(x, -HL, HL), 0, klemme(z, -HB, HB));
    b.kopfP = { t: s.zeit, p: pk, dauer: t };
    return pk;
  }
  // die zwei nächsten KI-Feldspieler pro Team laufen zum Kopfball-Punkt (Angreifer und Verteidiger)
  function kopfLaeufer(p){
    const ziel = kopfPunkt(); if (!ziel) return null;
    const b = welt.ball;
    if (b.kopfL && b.kopfL.t === s.zeit){ const i = b.kopfL.l.indexOf(p); return i < 0 ? null : ziel.clone().add(V(0, 0, b.kopfL.o[i])); }
    const l = [], o = [];
    for (const t of [0, 1]){
      const kand = teamSp(t).filter(q => q.aktiv !== false && q.rolle !== 'TW' && !istMensch(q) && q.gefallen <= 0).sort((a, q) => d2(a.p, ziel) - d2(q.p, ziel));
      kand.slice(0, 2).forEach((q, n) => { if (d2(q.p, ziel) < 22){ l.push(q); o.push(n === 0 ? 0 : (ziel.z > 0 ? -1.6 : 1.6)); } });
    }
    b.kopfL = { t: s.zeit, l, o };
    const i = l.indexOf(p); return i < 0 ? null : ziel.clone().add(V(0, 0, o[i]));
  }

  function kiZiel(p, dt){
    const b = welt.ball, st = STUFE[s.stufe], dir = richt(p.team);
    p.wanderT -= dt;
    if (p.wanderT <= 0){
      p.wanderT = zufall(2.2, 4.5);
      if (Math.random() < .2) p.wander.set(0, 0, 0);            // manchmal einfach stehen bleiben
      else p.wander.set(zufall(-2.8, 2.8), 0, zufall(-3, 3));
      if (p.fu != null) p.wander.multiplyScalar(.12);   // 11er-Test: Formation halten, nur wenig wandern
    }
    // Standardsituation
    if (s.phase === 'standard') return standardZiel(p);
    if (s.phase !== 'spiel') return p.p.clone();

    if (p.rolle === 'TW') return torwartZiel(p, dt);

    // Ball frei: Jäger holt ihn
    if (!b.besitzer){
      if (b.flanke && b.p.y > .6){ const kz = kopfLaeufer(p); if (kz) return kz; }   // V5.3: zur Flanke in Kopfhöhe laufen
      if (b.passZiel === p) return ballVorhersage(Math.min(1, d2(p.p, b.p) / (p.tempo * 1.4)));
      // Pass zu einem Mitspieler unterwegs: schon jetzt in den freien Raum starten
      if (b.passZiel && b.passZiel.team === p.team && b.passZiel.aktiv) return freiraum(p, b.passZiel, dt);
      const jaeger = jaegerVon(p.team);
      if (jaeger === p){
        const t = Math.min(1.1, d2(p.p, b.p) / (p.tempo * 1.2));
        return ballVorhersage(t);
      }
      return basisPosition(p);
    }
    const halter = b.besitzer;
    if (halter === p) return besitzerZiel(p, dt);
    if (halter.team !== p.team){
      // Verteidigen: einer presst, einer sichert ab
      const presser = naechster(p.team, halter.p, menschImTeam(p.team));
      if (presser === p){
        const zuTor = V(torX(p.team) - halter.p.x, 0, -halter.p.z).normalize();
        return halter.p.clone().addScaledVector(zuTor, .55);
      }
      const helfer = naechster(p.team, halter.p, presser);
      if (helfer === p && !istMensch(p) && s.druck && s.druck[p.team] > 0) return halter.p.clone();   // Doppel-Pressing auf Knopfdruck
      if (p.fu != null){
        // 11er-Test: zweiter Mann hilft nur, wenn er nah dran ist; alle anderen Raumdeckung in ihrer Zone
        if (helfer === p && !istMensch(p) && d2(p.p, halter.p) < 9 && p.slot !== 2){
          const t = .45; return V(halter.p.x * (1 - t) + torX(p.team) * t, 0, halter.p.z * (1 - t) + p.p.z * t * .3);
        }
        return raumDeckung(p, halter, presser);
      }
      // Gefahr hinten (Gegner in unserer Hälfte oder in Überzahl): zurücklaufen und Gegner torseitig decken
      const deck = deckungsZiel(p, halter, presser);
      if (deck) return deck;
      if (helfer === p && !istMensch(p)){
        const t = .55; return V(halter.p.x * (1 - t) + torX(p.team) * t, 0, halter.p.z * (1 - t));
      }
      return basisPosition(p);
    }
    // eigenes Team hat den Ball: selbstständig in den freien Raum laufen und anbieten
    return freiraum(p, halter, dt);
  }

  // 11er-Test: Raumdeckung – jeder deckt nur Gegner in seiner Zone (rund um seine Formationsposition)
  let zonenCache = { t: -1, team: -1, map: null };
  function raumDeckung(p, halter, presser){
    const dir = richt(p.team), eigTor = torX(p.team);
    if (zonenCache.t !== s.zeit || zonenCache.team !== p.team){
      const meine = teamSp(p.team).filter(m => m.rolle !== 'TW' && m !== presser && m.fu != null);
      const gegner = teamSp(1 - p.team).filter(g => g.rolle !== 'TW' && g !== halter);
      const anker = new Map(meine.map(m => [m, basisPosition(m)]));
      const paare = [];
      for (const m of meine) for (const g of gegner){
        const d = d2(anker.get(m), g.p), weite = m.slot === 0 ? 10 : m.slot === 1 ? 9 : 6;
        if (d < weite) paare.push([d, m, g]);
      }
      paare.sort((a, c) => a[0] - c[0]);
      const map = new Map(), vergeben = new Set();
      for (const [, m, g] of paare){ if (map.has(m) || vergeben.has(g)) continue; map.set(m, g); vergeben.add(g); }
      zonenCache = { t: s.zeit, team: p.team, map, anker };
    }
    const anker = (zonenCache.anker && zonenCache.anker.get(p)) || basisPosition(p);
    const g = zonenCache.map.get(p);
    let ziel = anker.clone();
    if (g){
      // torseitig vor den Gegner, aber nicht zu weit weg von der eigenen Position
      const zuTor = V(eigTor - g.p.x, 0, -g.p.z).normalize();
      const mark = g.p.clone().addScaledVector(zuTor, 1.6);
      const anteil = p.slot === 0 ? .6 : p.slot === 1 ? .48 : .34;
      ziel = anker.clone().lerp(mark, anteil);
      const weg = ziel.clone().sub(anker); if (weg.length() > 6) ziel = anker.clone().addScaledVector(weg.normalize(), 6);
    }
    // Abwehr bleibt hinter dem Ball (torseitig)
    if (p.slot === 0 && (ziel.x - halter.p.x) * dir > -1.5) ziel.x = halter.p.x - dir * 1.5;
    return imFeld(ziel);
  }
  // Deckung: Angreifer nach Gefährlichkeit auf die Verteidiger verteilen (pro Bild einmal je Team)
  let deckCache = { t: -1, team: -1, map: null };
  function deckungsZiel(p, halter, presser){
    const eigTor = torX(p.team), dir = richt(p.team);
    const inUnsererHaelfte = (halter.p.x - 0) * dir < 4;                         // Ball bei uns hinten oder Mitte
    const angreifer = teamSp(1 - p.team).filter(g => g !== halter && g.rolle !== 'TW');
    const vorne = angreifer.filter(g => Math.abs(g.p.x - eigTor) < Math.abs(halter.p.x - eigTor) + 3);
    const gefahr = inUnsererHaelfte || vorne.length >= 2;
    if (!gefahr) return null;
    const jetzt = s.zeit;
    if (deckCache.t !== jetzt || deckCache.team !== p.team){
      const tief = (halter.p.x - eigTor) * dir < 10;   // Ball nah am eigenen Tor: alle helfen
      const verteidiger = teamSp(p.team).filter(m => m.rolle !== 'TW' && m !== presser && !istMensch(m) && (m.slot !== 2 || tief));
      const sortiert = angreifer.slice().sort((a, b) => Math.abs(a.p.x - eigTor) - Math.abs(b.p.x - eigTor));
      const map = new Map(), frei = verteidiger.slice();
      for (const a of sortiert){
        if (!frei.length) break;
        let best = 0, bd = 1e9; frei.forEach((m, i) => { const d = d2(m.p, a.p); if (d < bd){ bd = d; best = i; } });
        map.set(frei[best], a); frei.splice(best, 1);
      }
      deckCache = { t: jetzt, team: p.team, map };
    }
    const a = deckCache.map.get(p);
    const tor = V(eigTor, 0, 0);
    if (a){
      // torseitig zwischen Gegner und eigenem Tor, leicht zur Ballseite
      const zuTor = tor.clone().sub(a.p).setY(0).normalize();
      const ziel = a.p.clone().addScaledVector(zuTor, 1.7);
      ziel.z += (halter.p.z - ziel.z) * .15;
      // immer hinter den Ball (torseitig) zurückarbeiten
      if ((ziel.x - halter.p.x) * dir > -1.5) ziel.x = halter.p.x - dir * 1.5;
      return imFeld(ziel);
    }
    // niemand zu decken: Raum vor dem Tor zwischen Ball und Tor schließen
    const zx = (halter.p.x - eigTor) * dir > 8 ? halter.p.x - dir * 4 : eigTor + dir * 4;
    return imFeld(V(zx, 0, halter.p.z * .35));
  }
  // Bewertet Punkte rund um die Rollenposition: frei von Gegnern, Passweg offen,
  // Raumgewinn nach vorn, Abstand zu Mitspielern – mit Trägheit, damit die KI nicht zappelt
  function raumWert(p, halter, q, anker){
    const dir = richt(p.team);
    let frei = 8; for (const g of teamSp(1 - p.team)) frei = Math.min(frei, d2(g.p, q));
    let w = Math.min(frei, 6) * 1.0;
    // Passweg vom Ballführer frei?
    let weg = 6;
    const ab = V(q.x - halter.p.x, 0, q.z - halter.p.z), lsq = ab.lengthSq() || 1;
    for (const g of teamSp(1 - p.team)){
      const ap = V(g.p.x - halter.p.x, 0, g.p.z - halter.p.z), t = klemme(ap.dot(ab) / lsq, 0, 1);
      if (t > .05 && t < .97) weg = Math.min(weg, ap.sub(ab.clone().multiplyScalar(t)).length());
    }
    w += Math.min(weg, 3) * 1.4;
    w += klemme((q.x - halter.p.x) * dir, -6, 10) * .28;            // nach vorn anbieten
    const dh = d2(q, halter.p); if (dh < 5) w -= (5 - dh) * .9; if (dh > 13) w -= (dh - 13) * .6;
    for (const m of teamSp(p.team)) if (m !== p && m !== halter && m.rolle !== 'TW'){ const dm = d2(m.p, q); if (dm < 6) w -= (6 - dm) * .6; }
    { const dirA = richt(p.team), linie = abseitsLinie(p.team); if (q.x * dirA > .3 && q.x * dirA > halter.p.x * dirA && q.x * dirA > linie - .4) w -= 7; }   // nicht ins Abseits laufen
    let leer = 9; for (const m of s.spieler) if (m.aktiv && m !== p) leer = Math.min(leer, d2(m.p, q));
    w += Math.min(leer, 6) * .35;                                    // Zonen ohne Spieler bevorzugen
    w -= d2(q, anker) * (p.fu != null ? .9 : .16);                  // Position halten, nicht ganz verlassen (11er: deutlich stärker)
    if (p.fu != null && d2(q, anker) > 6.5) w -= 20;                  // 11er-Test: eigene Zone nicht verlassen
    if (Math.abs(q.x - torX(p.team)) < 7) w -= 3;                     // nicht vor dem eigenen Tor
    return w;
  }
  function freiraum(p, halter, dt){
    p.raumT = (p.raumT || 0) - dt;
    const anker = basisPosition(p);
    if (p.raumT <= 0 || !p.raumZiel){
      p.raumT = zufall(.45, .8);
      const dir = richt(p.team);
      const kand = [anker.clone()];
      const elf = p.fu != null;
      for (const r of (elf ? [1.5, 3, 4.5] : [3, 6, 9])) for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + r * .3; kand.push(imFeld(V(anker.x + Math.cos(a) * r, 0, anker.z + Math.sin(a) * r))); }
      // 11er-Test: nur die zwei nächsten Mittelfeldspieler kommen kurz zum Ball
      const kurz = !elf || teamSp(p.team).filter(m => m.slot === 1 && m !== halter).sort((a, c) => d2(a.p, halter.p) - d2(c.p, halter.p)).slice(0, 2).includes(p);
      // Mittelfeld: kurze Anspielstation schräg neben/vor dem Ballführer
      if (p.slot === 1 && kurz) for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; kand.push(imFeld(V(halter.p.x + Math.cos(a) * 7, 0, halter.p.z + Math.sin(a) * 6))); }
      // Stürmer: Lauf in die Tiefe
      if (p.slot === 2 || p.rolle === 'ST') kand.push(imFeld(V(halter.p.x + dir * zufall(6, 11), 0, klemme(halter.p.z + zufall(-6, 6), -HB + 2, HB - 2))));
      // leere Zonen im ganzen Angriffsdrittel erkennen (wo kein Spieler steht)
      for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 4; iz++){
        const qx = halter.p.x + dir * (-4 + ix * 4.5), qz = -HB + 3 + iz * (B - 6) / 3;
        if (elf && d2(V(qx, 0, qz), anker) > 6) continue;   // 11er-Test: nur Zonen in der Nähe der eigenen Position
        kand.push(V(qx, 0, qz));
      }
      // hinter die letzte Abwehrlinie starten, wenn der Ballführer nach vorn schaut und Zeit hat
      let letzte = -1e9; for (const g of teamSp(1 - p.team)) if (g.rolle !== 'TW') letzte = Math.max(letzte, g.p.x * dir);
      let druckH = 99; for (const g of teamSp(1 - p.team)) druckH = Math.min(druckH, d2(g.p, halter.p));
      if (halter.blick.x * dir > .3 && druckH > 2.2 && (p.rolle !== 'DF' || p.slot === 2)) kand.push(imFeld(V(dir * (letzte + zufall(2, 5)), 0, klemme(p.p.z + zufall(-4, 4), -HB + 2, HB - 2))));
      let best = null, bw = -1e9;
      for (const q of kand){ q.x = klemme(q.x, -HL + 1.5, HL - 1.5); q.z = klemme(q.z, -HB + 1.2, HB - 1.2); const w = raumWert(p, halter, q, anker); if (w > bw){ bw = w; best = q; } }
      const alt = p.raumZiel ? raumWert(p, halter, p.raumZiel, anker) : -1e9;
      if (!p.raumZiel || bw > alt + .8) p.raumZiel = best;
    }
    const z = p.raumZiel.clone(), dir = richt(p.team), hx = halter.p.x * dir;
    if (p.slot === 0 && p.rolle !== 'ST'){
      // Abwehr: bleibt hinter dem Ball, rückt höchstens bis knapp über die Mittellinie
      const maxX = Math.min(hx - 5, HL * .15);
      if (z.x * dir > maxX) z.x = maxX * dir;
    } else if (p.slot === 1){
      // Mittelfeld: in Reichweite des Ballführers, zwischen Abwehr und Sturm
      const x = klemme(z.x * dir, hx - 7, hx + 9); z.x = x * dir;
    } else if (p.slot === 2 || p.rolle === 'ST'){
      // Sturm: bleibt vorne als Anspielstation
      const minX = Math.max(hx - 2.5, -HL * .05);
      if (z.x * dir < minX) z.x = minX * dir;
    }
    if (p.fu != null){ const ak = basisPosition(p), dd = d2(z, ak); if (dd > 7.5){ z.x = ak.x + (z.x - ak.x) * 7.5 / dd; z.z = ak.z + (z.z - ak.z) * 7.5 / dd; } }   // V2.5: Formation halten
    return imFeld(z);
  }
  function jaegerVon(team){
    const b = welt.ball;
    let best = null, bd = 1e9;
    for (const p of teamSp(team)){
      if (p.rolle === 'TW' && !imStrafraum(b.p, team)) continue;
      let d = d2(p.p, b.p) / p.tempo;
      if (p.fu != null && p.rolle !== 'TW') d += Math.max(0, d2(basisPosition(p), b.p) - (p.slot === 0 ? 11 : p.slot === 1 ? 13 : 15)) * .16;   // V2.5: eigene Zone bevorzugen
      if (d < bd){ bd = d; best = p; }
    }
    // im eigenen Team jagt der gesteuerte Spieler selbst – KI hilft nur, wenn deutlich näher
    const hs = menschImTeam(team);
    if (hs && best !== hs){
      const ds = d2(hs.p, b.p) / hs.tempo;
      if (ds < bd * 1.6) return null;
    }
    return best;
  }

  function besitzerZiel(p, dt){
    const b = welt.ball, st = STUFE[s.stufe], dir = richt(p.team);
    const reaktion = p.team === 1 ? st.reaktion : .35;
    p.besitzZeit = (p.besitzZeit || 0) + dt;
    p.denkT -= dt;
    const gx = dir * HL, dist = Math.hypot(gx - p.p.x, p.p.z);
    let druck = 99; for (const q of teamSp(1 - p.team)) druck = Math.min(druck, d2(q.p, p.p));
    if (p.rolle === 'TW'){
      let druckTW = 99; for (const q of teamSp(1 - p.team)) druckTW = Math.min(druckTW, d2(q.p, p.p));
      if (p.besitzZeit > .8){
        const m = passZiel(p), w = m ? passWert(p, m) : -99;
        if (m && (w > 1.5 || p.besitzZeit > 2.4 || druckTW < 3.5)){
          // frei → kurz abwerfen; unter Druck oder niemand frei → weiter Abschlag zum am weitesten vorn freien Mitspieler
          if (w > 1.5 && druckTW > 3.5){ welt.ball.p.y = 1.1; passen(p, m, d2(p.p, m.p) > 14); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('abwurf', p.name); }
          else { const weit = teamSp(p.team).filter(q => q !== p).sort((a, c) => (c.p.x - a.p.x) * dir)[0] || m; passen(p, weit, true); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('abschlag', p.name); }
        }
      }
      return p.p.clone();
    }
    if (p.denkT <= 0){
      p.denkT = reaktion * zufall(.7, 1.3);
      if (!istMensch(p) && Math.abs(p.p.x + dir * HL) < 9 && druck < 1.7 && Math.random() < .3){
        welt.ball.letzter = p; p.sperre = .35; p.besitzZeit = 0; zurEcke(p.team); zeigeHinweis('Ins Aus geklärt!', 1.1);
        return p.p.clone();
      }
      let frei = true;
      for (const q of teamSp(1 - p.team)){ if (q.rolle === 'TW') continue; const ab = V(q.p.x - p.p.x, 0, q.p.z - p.p.z); if (ab.length() < 2.2 && ab.x * dir > 0) frei = false; }
      // 11er-Test: auf dem großen Feld auch aus etwas größerer Entfernung und spitzerem Winkel schießen
      const lust = dist < 9 ? .88 : dist < 14 ? .58 : dist < 19 ? .26 : dist < 24 ? .07 : 0;
      const winkel = Math.abs(p.p.z) < 12 - Math.max(0, 7 - dist) * .5;
      if (winkel && Math.random() < lust * (frei ? 1 : .45)){ kiSchuss(p); return p.p.clone(); }
      const m = passZiel(p), w = m ? passWert(p, m) : -99;
      const zuDir = m && istMensch(m) && w > 4.5 && p.besitzZeit > .35;
      if ((druck < 1.8 && w > -1) || (w > 3.5 && Math.random() < .3) || (zuDir && Math.random() < .55) || p.besitzZeit > 4.5){
        if (m){ passen(p, m, d2(p.p, m.p) > 13 && Math.random() < .5); return p.p.clone(); }
      }
    }
    // dribbeln: Richtung Tor, Gegnern ausweichen
    const ziel = V(gx, 0, p.p.z * .6);
    const weg = ziel.sub(p.p).setY(0).normalize();
    for (const q of teamSp(1 - p.team)){
      const ab = V(q.p.x - p.p.x, 0, q.p.z - p.p.z), d = ab.length();
      if (d < 3.2 && ab.dot(weg) > 0){ const seite = V(-weg.z, 0, weg.x); weg.addScaledVector(seite, (ab.dot(seite) > 0 ? -1 : 1) * (3.2 - d) * .45); }
    }
    weg.normalize();
    return p.p.clone().addScaledVector(weg, 3);
  }

  // V6.1 M2: Stellschrauben für die Torwartstärke (alles hier nachjustieren)
  //   reaktion  : Faktor auf die Reaktionszeit bei Schüssen (kleiner = reagiert früher)         alt 1.0
  //   fenster   : Faktor auf die Vorausschau-Zeit (größer = beginnt bei Weitschüssen früher)    alt 1.0
  //   tempo     : Laufgeschwindigkeit des Torwarts, wenn er einen Schuss abdeckt                alt 1.0
  //   reich     : zusätzliche Reichweite der Parade (in Metern)                                 alt 0
  //   chance    : zusätzliche Paradenchance (0.10 = +10 Prozentpunkte)                          alt 0
  //   weitschuss: Extra-Chance bei Schüssen aus großer Distanz                                  alt 0
  //   deckel    : höchste Paradenchance (Tore bleiben möglich, solange deckel < 1)              alt .92
  const TW_TUNING = { reaktion: .5, fenster: 1.5, tempo: 1.25, reich: .35, chance: .08, weitschuss: .18, deckel: .93 };
  function torwartZiel(p, dt){
    const b = welt.ball, dir = richt(p.team), st = STUFE[s.stufe];
    const tw = p.team === 1 ? st.tw : .86;
    const gx = torX(p.team);
    const imBox = q => imFeld(V(klemme(q.x, Math.min(gx, gx + dir * (STR_T + .5)), Math.max(gx, gx + dir * (STR_T + .5))), 0, klemme(q.z, -STR_B - .5, STR_B + .5)));
    // freier Ball: berechnen, wer zuerst dran ist (Torwart gegen nächsten Gegner)
    if (!b.besitzer && b.v.x * dir < 4){
      const ziel = ballVorhersage(.5);
      const inZone = Math.abs(ziel.x - gx) < STR_T + 7 && Math.abs(ziel.z) < STR_B + 3;   // V6.8: auch knapp vor dem 16er
      if (inZone){
        const tTw = d2(p.p, ziel) / (p.tempo * 1.25);
        let tGeg = 99; for (const g of teamSp(1 - p.team)) tGeg = Math.min(tGeg, d2(g.p, ziel) / g.tempo);
        const draussen = !imStrafraum(ziel, p.team);
        // V6.8: Ein freier Ball vor dem Strafraum darf der Torwart mit dem Fuß spielen und dafür rauslaufen – aber nur, wenn er klar zuerst dran ist
        if (draussen ? tTw < tGeg * .7 : (tTw < tGeg * .85 || (imStrafraum(b.p, p.team) && b.v.length() < 7))){ p.holt = true; return draussen ? imFeld(ziel.clone()) : imBox(ziel); }
      }
    }
    p.holt = false; p.huetet = false;
    if (b.besitzer === p) return besitzerZiel(p, dt);
    // Stürmer läuft allein aufs Tor zu: herauslaufen und Winkel zumachen
    const h = b.besitzer;
    if (h && h.team !== p.team && imStrafraum(h.p, p.team)){
      let deckung = false;
      for (const m of teamSp(p.team)) if (m !== p && Math.abs(m.p.x - torX(p.team)) < Math.abs(h.p.x - torX(p.team)) && d2(m.p, h.p) < 3) deckung = true;
      if (!deckung) return h.p.clone().addScaledVector(V(torX(p.team) - h.p.x, 0, -h.p.z).normalize(), 1.2);
    }
    // Flanke in den Strafraum: abfangen
    if (!b.besitzer && b.flanke && imStrafraum(b.p, p.team) && b.p.y > .8) return ballVorhersage(.35);
    // Schuss aufs Tor: Kreuzungspunkt vorhersagen (mit Reaktionszeit)
    const aufsTor = b.v.x * dir < -4 && !b.besitzer;
    if (aufsTor){
      p.reaktT = (p.reaktT || 0) + dt;
      if (p.reaktT > (1.15 - tw) * .45 * TW_TUNING.reaktion){
        const t = (p.p.x - b.p.x) / b.v.x;
        if (t > 0 && t < 1.6 * TW_TUNING.fenster){
          const z = klemme(b.p.z + b.v.z * t, -TB - .2, TB + .2);
          p.huetet = true;
          return V(torX(p.team) + dir * .7, 0, z);
        }
      }
    } else p.reaktT = 0;
    return imBox(basisPosition(p));
  }

  // Positionen bei Standards
  function standardZiel(p){
    const sd = s.std, dir = richt(p.team);
    if (p === sd.schuetze) return p.p.clone();
    if (p.mauer) return p.mauer.clone();
    if (sd.elf){   // V3.2: Elfmeter
      const gx = richt(sd.team) * HL;
      if (p.rolle === 'TW') return p.team === sd.team ? V(torX(p.team) + dir * .7, 0, 0) : V(gx - richt(sd.team) * .2, 0, 0);
      const z = basisPosition(p);
      if (Math.abs(z.x - gx) < STR_T + 1.5) z.x = gx - richt(sd.team) * (STR_T + 1.5 + (p.team === sd.team ? 0 : 1));
      return z;
    }
    if (p.rolle === 'TW') return V(torX(p.team) + dir * .7, 0, klemme(sd.ort.z * .35, -TB + .5, TB - .5));
    let z = basisPosition(p);
    if (sd.typ === 'anstoss'){
      // V3.17: Beim Anstoß bleiben alle Feldspieler in der eigenen Hälfte;
      // das Team ohne Anstoß hält zusätzlich ca. 9 m Abstand zum Ball (Mittelkreis).
      if (z.x * dir > -.9) z.x = -dir * .9;
      if (p.team !== sd.team){
        const dz = z.z - sd.ort.z, rk = s.halle ? KREIS + 1 : 9, dx = Math.sqrt(Math.max(0, rk * rk - dz * dz));
        if (-z.x * dir < dx) z.x = -dir * dx;
      }
      return z;
    }
    if (sd.typ === 'ecke'){
      const angr = sd.team, gx = richt(angr) * HL, seite = Math.sign(sd.ort.z) || 1, rein = -richt(angr);
      if (p.fu != null){
        // 11er-Test: 6 Angreifer im Strafraum, der Rest sichert ab; Verteidiger decken Raum, zwei Stürmer bleiben vorne
        if (p.team === angr){
          const liste = teamSp(angr).filter(q => q !== sd.schuetze && q.rolle !== 'TW').sort((a, c) => c.fu - a.fu || a.fv - c.fv);
          const i = liste.indexOf(p);
          const plaetze = [[2.2, seite * 1.8], [3, -seite * 2.4], [5.5, 0], [7.5, seite * 4.5], [9.5, -seite * 3.5], [13.5, seite * 1]];
          if (i >= 0 && i < plaetze.length) return V(gx + rein * plaetze[i][0], 0, plaetze[i][1]);
          const k = Math.max(0, i - plaetze.length);
          return V(gx + rein * (HL * .55 + (k % 2) * 6), 0, (k % 3 - 1) * HB * .35);
        }
        const liste = teamSp(p.team).filter(q => q.rolle !== 'TW').sort((a, c) => a.fu - c.fu || a.fv - c.fv);
        const i = liste.indexOf(p);
        const plaetze = [[.6, seite * (TB - .4)], [.6, -seite * (TB - .4)], [2.6, seite * 1.4], [3.2, -seite * 2], [5.8, seite * .6], [6.5, -seite * 3.8], [8.5, seite * 3.2], [11.5, 0]];
        if (i >= 0 && i < plaetze.length) return V(gx + rein * plaetze[i][0], 0, plaetze[i][1]);
        return V(gx + rein * (HL * .62), 0, (i % 2 ? 1 : -1) * 5);
      }
      if (p.team === angr){
        // erster Pfosten, zweiter Pfosten, Elfmeterpunkt, Strafraumgrenze
        const plaetze = [[2.2, seite * 1.6], [2.8, -seite * 2.2], [4.8, 0], [8.5, -seite * 3]];
        const i = teamSp(angr).filter(q => q !== sd.schuetze && q.rolle !== 'TW').indexOf(p);
        const pl = plaetze[Math.max(0, i) % plaetze.length];
        z = V(gx + rein * pl[0], 0, pl[1]);
      } else {
        // Verteidiger: einer am ersten Pfosten, die anderen decken torseitig
        const verteidiger = teamSp(p.team).filter(q => q.rolle !== 'TW');
        const i = verteidiger.indexOf(p);
        if (i === 0) z = V(gx + rein * .6, 0, seite * (TB - .4));
        else z = V(gx + rein * (i === 1 ? 2.2 : 4.2), 0, i === 1 ? -seite * 1.2 : seite * .5);
      }
      return z;
    }
    // Abstand zum Ball (Gegner mind. 4 m)
    if (p.team !== sd.team){
      const d = d2(z, sd.ort);
      if (d < 4.5){ const weg = V(z.x - sd.ort.x, 0, z.z - sd.ort.z); if (weg.lengthSq() < .01) weg.set(-dir, 0, 0); z.addScaledVector(weg.normalize(), 4.5 - d); }
    }
    return z;
  }

  // =================================================================
  // Bewegung
  // =================================================================
  // Torschütze wählt seinen Jubel per Taste: SCHUSS = Faust, PASS = Umarmung, FLANKE = Siu
  function jubelTaste(k, art){
    const j = s && s.phase === 'tor' && s.jubelDaten, q = k && k.steuer;
    if (!j || !q || j.schuetze !== q || j.t > 4.2) return false;
    j.art = art; j.gerutscht = true; j.mitArt = art === 'umarmen' ? 'umarmen' : (j.mitArt === 'umarmen' ? 'hoch' : j.mitArt);
    q.jubelArt = art; return true;
  }
  function jubelEnde(){ s.jubelDaten = null; for (const p of s.spieler){ p.jubelArt = null; p.salto = 0; if (p.grae > 0){ p.grae = 0; p.v.set(0, 0, 0); } } }
  function jubelWunsch(p, dt){
    const j = s.jubelDaten, sc = j.schuetze;
    if (p === sc){
      const weg = V(j.ziel.x - p.p.x, 0, j.ziel.z - p.p.z), d = weg.length();
      if (j.art === 'rutscher' && !j.gerutscht && (d < 3.2 || j.t > 1.3)){
        j.gerutscht = true; const n = d > .1 ? weg.normalize() : p.blick.clone();
        p.blick.copy(n); p.v.set(n.x * 7.5, 0, n.z * 7.5); p.grae = .9; p.graeBall = true; p.jubelArt = 'hoch';
        return null;
      }
      if (j.art === 'superman' && !j.gerutscht && (d < 3.2 || j.t > 1.3)){   // V4.6: Bauchrutscher
        j.gerutscht = true; const n = d > .1 ? weg.normalize() : p.blick.clone();
        p.blick.copy(n); p.v.set(n.x * 7.5, 0, n.z * 7.5); p.gefallen = 1.3; p.jubelArt = 'hoch';
        return null;
      }
      if (j.art === 'salto' && d < .9 && !(p.salto > 0) && j.t >= (j.nextS || 0) && (j.nSalto || 0) < 1){ p.salto = .9; j.nextS = j.t + 1.4; j.nSalto = (j.nSalto || 0) + 1; }   // V4.6: Salto
      if (p.grae > 0 || p.gefallen > 0) return null;
      if (d > .4) return weg.normalize().multiplyScalar(Math.min(7.2, d * 2.2));
      p.blick.set(0, 0, 1);                               // zur Kamera drehen
      return V();
    }
    if (p.team === j.team && (j.t > .45 || p === j.vorlage)){
      // Mitspieler laufen zum Torschützen und stellen sich um ihn herum
      const mit = teamSp(j.team).filter(q => q !== sc && q.rolle !== 'TW');
      const i = mit.indexOf(p); if (i < 0) return p.rolle === 'TW' ? V() : null;
      const w = (i - (mit.length - 1) / 2) * 1.1 + Math.PI / 2;
      const eng = j.art === 'umarmen' || p === j.vorlage;   // Umarmung: Mitspieler stehen ganz dicht am Torschützen
      const ziel = V(sc.p.x - Math.cos(w) * (eng ? .62 : 1.0), 0, sc.p.z - Math.sin(w) * (eng ? .5 : .8));
      const weg = V(ziel.x - p.p.x, 0, ziel.z - p.p.z), d = weg.length();
      if (d < (eng ? 1.1 : 1.6)){ p.jubelArt = p === j.vorlage ? 'umarmen' : (j.mitArt || 'hoch'); p.jubel = Math.max(p.jubel, .6); }
      if (d > .3) return weg.normalize().multiplyScalar(Math.min(p === j.vorlage ? 8.6 : 7.4, d * 2.5));
      const zu = V(sc.p.x - p.p.x, 0, sc.p.z - p.p.z); if (zu.lengthSq() > .01) p.blick.copy(zu.normalize());
      return V();
    }
    if (p.team !== j.team && p.rolle === 'TW'){   // Torwart sinkt zu Boden
      if (!j.twDown && j.t > .2){ j.twDown = true; if (!istMensch(p)){ p.gefallen = 2.4; p.v.set(0, 0, 0); } }
      return null;
    }
    if (p.team !== j.team){   // Gegner trotten enttäuscht aus, manche greifen sich an den Kopf
      if (s.spieler.indexOf(p) % 2 === 0) p.jubelArt = 'kopf';
      return V(p.v.x * .3, 0, p.v.z * .3);
    }
    return null;
  }
  // V3.18: Ausdauer – je länger das Spiel läuft, desto stärker sinkt die Laufleistung.
  // V4.1: Der Ausdauer-Wert bestimmt, wie lange die Leiste hält.
  function ausdauerFaktor(p){
    const max = Math.max(1, p.maxAusdauer || 100), a = Math.max(0, Math.min(max, p.ausdauer == null ? max : p.ausdauer));
    // Unter 60 % wird das Tempo spürbar reduziert, gegen Ende deutlich stärker.
    const q = a / max;
    return .65 + .35 * Math.pow(q, .72);   // V5.2: ganz leer = 65 % Tempo (vorher 52 %)
  }
  // V5.3: Sprint-Bonus schrumpft mit sinkender Ausdauer (frisch +38 %, bei 20 % Ausdauer nur noch etwa +10 %)
  function sprintFaktor(p){
    const max = Math.max(1, p.maxAusdauer || 100), q = Math.max(0, Math.min(1, (p.ausdauer == null ? max : p.ausdauer) / max));
    return 1 + .38 * Math.max(0, Math.min(1, (q - .05) / .55));
  }
  function aktualisiereAusdauer(p, dt, laufTempo, sprintAktiv){
    if (!p || p.rolle === 'TW' && p.ausdauer == null) return;
    if (s.phase !== 'spiel') return;
    const max = Math.max(1, p.maxAusdauer || 100);
    const grund = Math.max(0, Math.min(1.4, laufTempo / Math.max(.1, p.tempo)));
    if (grund > .08){
      // Dauerlauf verbraucht moderat, Sprint deutlich mehr. Keine automatische Voll-Erholung.
      // V5.3: keine Erholung im Spiel (auch nicht im Stand). Joggen ca. 0,35/s, Sprint ca. 0,85/s -> um die 80. Minute sind die meisten müde
      p.ausdauer = Math.max(0, (p.ausdauer == null ? max : p.ausdauer) - dt * (grund * .35 + (sprintAktiv ? .37 : 0)));
    }
  }

  function bewege(p, dt, wunsch, sprint){
    if (p.hecht > 0){
      // Während des Hechts wird die manuelle Dive-Bewegung nicht vom Joystick überschrieben.
      p.v.multiplyScalar(Math.exp(-2.0 * dt));
    } else if (p.gefallen > 0){ p.gefallen -= dt; p.v.multiplyScalar(Math.exp(-6 * dt)); }
    else if (p.grae > 0){
      p.grae -= dt; p.v.multiplyScalar(Math.exp(-2.2 * dt));
      if (p.grae <= 0) p.sperre = Math.max(p.sperre, .45);
    } else if (p.sperre > .3 && !welt.ball.besitzer){ p.v.multiplyScalar(Math.exp(-5 * dt)); }
    else if (wunsch){
      const beschl = (p.rolle === 'TW' ? 10 : 7) * (p.antritt || 1);   // V4.1: Antritt je nach Tempo
      p.v.x += (wunsch.x - p.v.x) * Math.min(1, beschl * dt);
      p.v.z += (wunsch.z - p.v.z) * Math.min(1, beschl * dt);
      const sp = Math.hypot(wunsch.x, wunsch.z);
      const sprintAktiv = !!sprint || (sp > p.tempo * 1.08);
      aktualisiereAusdauer(p, dt, sp, sprintAktiv);
      if (p.rolle === 'TW' && welt.ball.besitzer !== p && (s.phase === 'spiel' || s.phase === 'standard' || s.phase === 'pfiff')){
        // Torwart behält den Ball im Blick und läuft seitlich/rückwärts statt sich zum Netz zu drehen
        const bx = welt.ball.p.x - p.p.x, bz = welt.ball.p.z - p.p.z, bl = Math.hypot(bx, bz);
        if (bl > .3) p.blick.set(bx / bl, 0, bz / bl);
      } else if (sp > .4) p.blick.set(wunsch.x / sp, 0, wunsch.z / sp);
    } else if (p.rolle === 'TW' && welt.ball.besitzer !== p && s.phase === 'spiel' && !(p.gefallen > 0) && !(p.grae > 0)){
      const bx = welt.ball.p.x - p.p.x, bz = welt.ball.p.z - p.p.z, bl = Math.hypot(bx, bz);
      if (bl > .3) p.blick.set(bx / bl, 0, bz / bl);
    }
    p.sperre = Math.max(0, p.sperre - dt);
    p.p.x += p.v.x * dt; p.p.z += p.v.z * dt;
    imFeld(p.p);
    // Ein menschlicher Torwart bleibt in seinem Strafraum, kann dort aber frei seitlich hechten.
    // V6.7: Mit dem Ball am Fuß darf der Torwart den Strafraum verlassen (in den Händen trägt er ihn nur im 16er,
    // draußen legt er ihn automatisch auf den Boden). Ist er draußen, läuft er ohne Zurückspringen wieder hinein.
    const twFrei = p.rolle === 'TW' && istMensch(p);   // V4.3: dein Torwart darf den Strafraum immer verlassen (auch ohne Ball)
    if (p.rolle === 'TW') p.twDraussen = twFrei && !imStrafraum(p.p, p.team);
    if (p.rolle === 'TW' && istMensch(p) && !twFrei){
      const dir = richt(p.team), gx = torX(p.team);
      const x1 = gx - dir * .65, x2 = gx + dir * (STR_T - .25);
      p.p.x = klemme(p.p.x, Math.min(x1, x2), Math.max(x1, x2));
      p.p.z = klemme(p.p.z, -STR_B + .15, STR_B - .15);
    }
  }
  // V11.43: Wer von den Menschen gerade sprintet (pro Spielzeit-Tick nur einmal ermittelt)
  const _msp = { z: null, liste: [] };
  function menschenSprinter(){
    if (_msp.z === s.zeit) return _msp.liste;
    _msp.z = s.zeit; _msp.liste = [];
    try { for (const q of aktiv()){ const k = kontrolleVon(q); if (k && k.sprint && !(autopilot && k === lokal) && k.richtung().length() > .12) _msp.liste.push(q); } } catch (e) {}
    return _msp.liste;
  }
  function kiWunsch(p, ziel){
    const weg = V(ziel.x - p.p.x, 0, ziel.z - p.p.z), d = weg.length();
    if (d < .25) return V();
    let tempo = p.tempo * ausdauerFaktor(p) * (d < 1.4 ? d / 1.4 : 1);
    // Sprint, wenn es eilig ist
    if (d > 2.5 && (welt.ball.besitzer == null || welt.ball.besitzer.team !== p.team)) tempo *= 1.3;   // V11.45: noch öfter und schneller   // V11.42: KI sprintet öfter (vorher erst ab 6 m Abstand)
    else if (d > 4 && p.rolle !== 'TW' && welt.ball.besitzer && welt.ball.besitzer.team === p.team && welt.ball.besitzer !== p) tempo *= 1.25;   // V11.45   // V11.42: auch Freilaufen in den Raum bei eigenem Ballbesitz
    if (d > 3 && welt.ball.besitzer && welt.ball.besitzer.team !== p.team && Math.abs(ziel.x - torX(p.team)) < Math.abs(p.p.x - torX(p.team)) - 2) tempo *= 1.12;   // Rückwärtssprint
    if (p.rolle !== 'TW' && d > 2 && tempo === p.tempo * ausdauerFaktor(p) * (d < 1.4 ? d / 1.4 : 1)){   // V11.43: sprintet ein Mensch, sprinten die Gegner in der Nähe hinterher (Ballführer: 16 m, sonst 9 m)
      const hl = menschenSprinter();
      for (let i = 0; i < hl.length; i++){ const h = hl[i]; if (h.team === p.team) continue;
        if (Math.hypot(h.p.x - p.p.x, h.p.z - p.p.z) < (welt.ball.besitzer === h ? 16 : 9)){ tempo *= 1.3; break; } }
    }
    if (welt.ball.besitzer === p) tempo *= (d > 3 && p.rolle !== 'TW' && (p.ausdauer == null || p.ausdauer > (p.maxAusdauer || 100) * .25)) ? 1.15 : .92;   // V11.45: KI sprintet auch mit Ball (Tempodribbling), solange Ausdauer da ist
    if (p.rolle === 'TW' && p.holt) tempo *= 1.3;
    if (p.rolle === 'TW' && p.huetet) tempo *= TW_TUNING.tempo;   // V6.1 M2
    return weg.multiplyScalar(tempo / d);
  }
  function abstossen(){
    const ps = aktiv();
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++){
      const a = ps[i], b = ps[j], dx = b.p.x - a.p.x, dz = b.p.z - a.p.z, d = Math.hypot(dx, dz);
      if (d < .62 && d > .001){ const k = (.62 - d) / 2 / d; a.p.x -= dx * k; a.p.z -= dz * k; b.p.x += dx * k; b.p.z += dz * k; }
    }
  }
  // =================================================================
  // Ballphysik, Zweikämpfe, Regeln
  // =================================================================
  function ballSchritt(dt){
    const b = welt.ball, st = STUFE[s.stufe];
    if (b.besitzer){
      const p = b.besitzer; b.drall = 0;
      // Dribbeln: Ball rollt vor dem Fuß, wird immer wieder angetippt
      const vor = .48 + Math.min(.35, Math.hypot(p.v.x, p.v.z) * .06);
      const ziel = V(p.p.x + p.blick.x * vor, BALL_R, p.p.z + p.blick.z * vor);
      ziel.x = klemme(ziel.x, -HL + .3, HL - .3); ziel.z = klemme(ziel.z, -HB + .3, HB - .3);
      if (p.rolle === 'TW' && imStrafraum(p.p, p.team)) ziel.y = .75;          // Torwart hält den Ball in den Händen
      b.v.set((ziel.x - b.p.x) * 12 + p.v.x * .3, 0, (ziel.z - b.p.z) * 12 + p.v.z * .3);
      b.p.x += b.v.x * dt; b.p.z += b.v.z * dt; b.p.y += (ziel.y - b.p.y) * Math.min(1, 12 * dt);
      b.letzteTeam = p.team; b.letzter = p;
    } else {
      if (b.ausT > 0) b.ausT -= dt;
      // V4.4: realistische Ballphysik
      // fremde Berührung (Parade, Abpraller, Pfosten …) nimmt dem Ball den Großteil des Dralls
      if (b.spin && b.dvx !== undefined && Math.hypot(b.v.x - b.dvx, b.v.z - b.dvz) > 1.5){ b.spin.x *= .25; b.spin.y *= .25; b.spin.z *= .25; }
      const amBoden = b.p.y <= BALL_R + .02 && Math.abs(b.v.y) < .5;
      // Luftwiderstand (quadratisch, mit Drag-Crisis)
      { const v = b.v.length(); if (v > .05){ const k = PH_KD * cdVon(v) * v * dt; const f = 1 / (1 + k); b.v.x *= f; b.v.z *= f; if (!amBoden) b.v.y *= f; } }
      // Magnus-Effekt: a = k · (ω × v) – Kurve (Seitendrall), Absenken (Vorwärtsdrall), Schweben (Rückwärtsdrall)
      if (b.spin){
        const w = b.spin, vx = b.v.x, vy = b.v.y, vz = b.v.z;
        b.v.x += PH_KM * (w.y * vz - w.z * vy) * dt;
        if (!amBoden) b.v.y += PH_KM * (w.z * vx - w.x * vz) * dt;
        b.v.z += PH_KM * (w.x * vy - w.y * vx) * dt;
        const ab = Math.exp(-(amBoden ? 3.5 : .12) * dt); w.x *= ab; w.y *= ab; w.z *= ab;
        if (Math.abs(w.x) + Math.abs(w.y) + Math.abs(w.z) < .5) b.spin = null;
      }
      b.v.y -= G * dt;
      b.p.addScaledVector(b.v, dt);
      if (b.p.y < BALL_R){
        b.p.y = BALL_R;
        // Aufprall: Sprungkraft je nach Platz (nass = flacher, Schnee = kaum), Rasen bremst und frisst Drall
        const e = welt.regen ? .5 : welt.wetter === 'schnee' ? .32 : welt.wetter === 'sonne' ? .64 : .6;
        if (b.v.y < -1.1){
          b.v.y *= -e;
          const tang = welt.regen ? .9 : welt.wetter === 'schnee' ? .7 : .84;
          b.v.x *= tang; b.v.z *= tang;
          if (b.spin){ // Rückwärtsdrall bremst beim Aufsetzen, Vorwärtsdrall lässt den Ball wegspringen
            const h = Math.hypot(b.v.x, b.v.z) || 1, rueck = (b.spin.x * -b.v.z + b.spin.z * b.v.x) / h;
            const f = klemme(1 - rueck * .006, .7, 1.15); b.v.x *= f; b.v.z *= f;
            b.spin.x *= .55; b.spin.y *= .7; b.spin.z *= .55;
          }
        } else b.v.y = 0;
      }
      if (b.p.y <= BALL_R + .01){
        // Rollen: Rollwiderstand (Rasen) + etwas Dämpfung; nasser Rasen ist schneller, Schnee bremst stark
        const mu = welt.regen ? .072 : welt.wetter === 'schnee' ? .21 : welt.wetter === 'sonne' ? .094 : .106;   // V5.7: Ball rollt etwas schneller
        const sp = Math.hypot(b.v.x, b.v.z);
        if (sp < .12){ b.v.x = 0; b.v.z = 0; }
        else { const r = Math.max(0, sp - (mu * 9.81 + sp * .1) * dt) / sp; b.v.x *= r; b.v.z *= r; }
      }
      // V4.4: Ball im Aus rollt/fliegt weiter bis zu den Banden und prallt dort ab
      // V4.9: im Aus keine Banden mehr – der Ball fliegt/rollt frei weiter wie auf dem Platz
      pfostenKollision(b);
      // V5.3: einmal an der Torlinie festlegen, ob der Ball INS Tor ging (unter der Latte, zwischen den Pfosten) – Netz und Schiri entscheiden gleich
      if (Math.abs(b.p.x) <= HL) b.innen = null;
      else if (b.innen == null) b.innen = Math.abs(b.p.z) < TB - BALL_R * .5 && b.p.y < TH;
      if (s.phase === 'tor' || Math.abs(b.p.x) > HL) netzKollision(b, dt);
    }
    b.dvx = b.v.x; b.dvz = b.v.z;
    // Ballrotation
    const sp = Math.hypot(b.v.x, b.v.z);
    if (sp > .05) b.rot += (b.v.x >= 0 ? 1 : -1) * sp * dt / BALL_R * .5;
  }

  function pfostenKollision(b){
    for (const sx of [-1, 1]){
      const x0 = sx * HL;
      for (const z0 of [-TB, TB]){
        const dx = b.p.x - x0, dz = b.p.z - z0, d = Math.hypot(dx, dz);
        if (d < BALL_R + .09 && b.p.y < TH + .1){
          const nx = dx / d, nz = dz / d, vn = b.v.x * nx + b.v.z * nz;
          if (vn < 0){ b.v.x -= 1.7 * vn * nx; b.v.z -= 1.7 * vn * nz; b.p.x = x0 + nx * (BALL_R + .1); b.p.z = z0 + nz * (BALL_R + .1); musik.sfx && musik.sfx.pfosten(); if (b.schussVon){ musik.sfx && musik.sfx.oh(); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('pfosten', b.schussVon.name, true); } }
        }
      }
      // Latte
      if (Math.abs(b.p.z) < TB){
        const dx = b.p.x - x0, dy = b.p.y - TH, d = Math.hypot(dx, dy);
        if (d < BALL_R + .09){
          const nx = dx / d, ny = dy / d, vn = b.v.x * nx + b.v.y * ny;
          if (vn < 0){ b.v.x -= 1.7 * vn * nx; b.v.y -= 1.7 * vn * ny; musik.sfx && musik.sfx.pfosten(); if (b.schussVon){ musik.sfx && musik.sfx.oh(); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('latte', b.schussVon.name, true); } }
        }
      }
    }
  }
  // V5.1: Netz als weiche Feder – der Ball beult das Netz aus (die Maschen folgen ihm), wird abgebremst und fällt dann herunter
  function netzBeule(netz, z, y, tief){
    for (let j = 0; j < netz.NY; j++) for (let i = 0; i < netz.NZ; i++){
      const pz = -TB + 2*TB * i/(netz.NZ-1), py = TH * j/(netz.NY-1);
      const w = Math.exp(-((pz - z)**2 + (py - y)**2) / .45);
      const k = j*netz.NZ + i, soll = tief * w;
      if (netz.verschiebung[k] < soll){ netz.verschiebung[k] = soll; netz.geschw[k] = Math.max(0, netz.geschw[k]); }
    }
  }
  function netzKollision(b, dt){
    dt = dt || .016;
    const sx = Math.sign(b.p.x), netz = welt.tore[sx > 0 ? 1 : 0];
    // V5.3: Ball ging drüber oder vorbei – er prallt von AUSSEN am Dach-/Seitennetz ab und landet nie im Tor
    if (b.innen === false && s.phase !== 'tor'){
      const ax = Math.abs(b.p.x), az = Math.abs(b.p.z);
      if (ax > HL && ax < HL + TT + BALL_R){
        if (az < TB && b.p.y < TH + BALL_R && b.p.y > TH - .45){ b.p.y = TH + BALL_R; if (b.v.y < 0) b.v.y = -b.v.y * .25; const f = Math.exp(-2.5 * dt); b.v.x *= f; b.v.z *= f; }
        else if (b.p.y < TH + BALL_R && az < TB + BALL_R && az > TB - .45){ b.p.z = Math.sign(b.p.z) * (TB + BALL_R); if (b.v.z * Math.sign(b.p.z) < 0) b.v.z *= -.15; b.v.x *= .8; }
      }
      return;
    }
    if (Math.abs(b.p.z) > TB + .5 || b.p.y > TH + .9) return;
    const hinten = HL + TT - BALL_R;
    if (Math.abs(b.p.x) > hinten && Math.abs(b.p.z) < TB){
      const tief = Math.abs(b.p.x) - hinten, vAus = b.v.x * sx;   // Eindringtiefe, Geschwindigkeit nach außen
      if (!b.imNetz){ b.imNetz = true; netzStoss(netz, b.p.z, b.p.y, Math.min(9, Math.abs(b.v.x) * .25)); musik.sfx && musik.sfx.netz && musik.sfx.netz(); }
      // Feder + Dämpfung bremsen den Ball im Netz ab, seitlich bremst die Reibung an den Maschen
      const a = -150 * tief - 34 * vAus;
      b.v.x += sx * a * dt;
      if (b.v.x * sx < -1.1) b.v.x = -sx * 1.1;   // Netz gibt den Ball nur langsam wieder frei
      const reib = Math.exp(-4 * dt); b.v.z *= reib; if (b.v.y > 0) b.v.y *= reib;
      if (b.spin){ b.spin.x *= .9; b.spin.y *= .9; b.spin.z *= .9; }
      const maxT = .9; if (tief > maxT){ b.p.x = sx * (hinten + maxT); if (vAus > 0) b.v.x = 0; }
      netzBeule(netz, b.p.z, klemme(b.p.y, 0, TH), Math.min(maxT, tief) + .05);
    } else if (b.imNetz && Math.abs(b.p.x) < hinten - .05) b.imNetz = false;
    if (Math.abs(b.p.x) > HL + .1){
      if (Math.abs(b.p.z) > TB - BALL_R && Math.abs(b.p.z) < TB + .3){ b.p.z = Math.sign(b.p.z) * (TB - BALL_R); b.v.z *= -.15; b.v.x *= .8; }
      // Dachnetz: gibt nach oben nach und drückt den Ball zurück
      const oben = TH - BALL_R;
      if (b.p.y > oben && Math.abs(b.p.z) < TB){
        const tief = b.p.y - oben;
        b.v.y += (-150 * tief - 30 * b.v.y) * dt; if (b.v.y < -2) b.v.y = Math.max(b.v.y, -2); b.v.x *= Math.exp(-2 * dt); b.v.z *= Math.exp(-2 * dt);
        if (tief > .5){ b.p.y = oben + .5; if (b.v.y > 0) b.v.y = 0; }
        const i = Math.round((b.p.z + TB) / (2 * TB) * (netz.NZ - 1)), kk = Math.round(klemme((Math.abs(b.p.x) - HL) / TT, 0, 1) * (netz.NX - 1));
        for (let q = -2; q <= 2; q++){ const ii = i + q; if (ii < 0 || ii >= netz.NZ) continue; const idx = kk * netz.NZ + ii; netz.dach[idx] = Math.max(netz.dach[idx], tief * Math.exp(-q * q / 2)); }
      }
    }
  }

  function zweikaempfe(dt){
    const b = welt.ball, st = STUFE[s.stufe];
    if (s.phase !== 'spiel') return;
    // V4.1: leichter Pass-Magnet – ein knapp ungenauer flacher Pass dreht sich sanft zum Empfänger (bis ca. 35° Abweichung, höchstens ca. 50°/s).
    // Größere Fehlpässe bleiben Fehlpässe.
    if (!b.besitzer && b.passZiel && b.passZiel.aktiv && b.p.y < .6 && !(b.ausT > 0) && b.passVon && b.passZiel.team === b.passVon.team){
      const mz = b.passZiel, dx = mz.p.x - b.p.x, dz = mz.p.z - b.p.z, dist = Math.hypot(dx, dz), sp = Math.hypot(b.v.x, b.v.z);
      if (dist > .3 && dist < 9 && sp > 1.5){   // V4.0: Pass-Magnet etwas größer
        const vx = b.v.x / sp, vz = b.v.z / sp, tx = dx / dist, tz = dz / dist, cos = vx * tx + vz * tz;
        if (cos > .9){   // V7.2: Magnet viel schwächer (nur noch bis ca. 20° Abweichung, höchstens ca. 12°/s) – kein Schlangen-Bogen mehr
          const dreh = Math.min(Math.acos(Math.min(1, cos)), .4 * dt) * ((vx * tz - vz * tx) > 0 ? 1 : -1), cw = Math.cos(dreh), sw = Math.sin(dreh);
          b.v.x = sp * (vx * cw - vz * sw); b.v.z = sp * (vx * sw + vz * cw);
        }
      }
    }
    // Ballannahme / Abfangen bei freiem Ball (nicht, während der Ball zur Ecke ins Aus fliegt)
    if (!b.besitzer && !(b.ausT > 0)){
      for (const p of aktiv()){
        if (p.sperre > 0 || p.gefallen > 0) continue;
        const d = d2(p.p, b.p), istTW = p.rolle === 'TW' && imStrafraum(p.p, p.team);
        const reich = istTW ? (b.flanke ? 1.1 : .85) : (b.passZiel === p ? 1.25 : .58) * (hatFae(p, 'welt') ? 1.18 : 1), hoehe = istTW ? 2.6 : .8;   // V4.0: Pass-Empfänger nimmt noch weiter an (1,25 statt 0,85)   // V4.1: Pass-Empfänger nimmt etwas weiter an
        if (d < reich && b.p.y < hoehe){
          if (istTW && b.v.x * richt(p.team) < -6){ continue; }              // Schuss aufs Tor: Parade-Prüfung unten
          const rel = Math.hypot(b.v.x - p.v.x, b.v.z - p.v.z);
          const grenze = 9 + (W(p, 'dri') - 70) * .25 + (b.passZiel === p ? 4 : 0);
          if (rel < grenze + (b.passZiel === p ? 8 : 0) || Math.random() < (b.passZiel === p ? .9 : .3)){ uebernehmen(p); break; }   // V4.0: Pass-Empfänger nimmt den Ball fast immer an (prallt nur selten ab)
          else {
            const eigTor = -richt(p.team) * HL;
            if (p.rolle !== 'TW' && Math.abs(b.p.x - eigTor) < 15 && b.v.x * Math.sign(eigTor) > 2 && Math.random() < .45){
              b.letzter = p; p.sperre = .3; zurEcke(p.team); zeigeHinweis('Geblockt – Ecke!', 1.2);
            } else { b.v.multiplyScalar(-.25); b.v.x += zufall(-2, 2); b.v.z += zufall(-2, 2); b.letzter = p; b.letzteTeam = p.team; p.sperre = .2; }
          }
        }
      }
    }
    // Kopfball nach Flanke
    if (!b.besitzer && b.flanke && b.p.y > .8 && b.p.y < 2.9){
      // V5.3: Spieler springen zum Ball – mehr Reichweite; wer am nächsten dran ist, gewinnt das Kopfballduell
      const kopfKand = aktiv().filter(p => !(p.sperre > 0 || p.gefallen > 0 || p.rolle === 'TW') && d2(p.p, b.p) < (istMensch(p) ? 1.6 : 1.4) + (hatFae(p, 'kopf') ? .45 : 0)).sort((a, q) => d2(a.p, b.p) / (hatFae(a, 'kopf') ? 1.7 : 1) - d2(q.p, b.p) / (hatFae(q, 'kopf') ? 1.7 : 1));
      for (const p of kopfKand){
        {
          p.sprung = .5; b.flanke = false; b.letzter = p; b.letzteTeam = p.team; b.passZiel = null;
          const gx = richt(p.team) * HL, zumTor = Math.abs(p.p.x - gx) < 12;
          // Gesteuerter Spieler: Kopfball geht dorthin, wohin du den Joystick hältst (nicht mehr zufällig / KI)
          const kMensch = menschen().find(q => q.steuer === p), rJ = kMensch ? kMensch.richtung() : null;
          if (rJ && rJ.length() > .3){
            const w = V(rJ.x, 0, rJ.z).normalize(), aufTor = w.x * richt(p.team) > .45 && Math.abs(p.p.x - gx) < 20;
            if (aufTor){ b.v.set(w.x * zufall(11, 14), zufall(-2.5, .5), w.z * zufall(11, 14)); b.schussVon = p; b.schussX0 = b.p.x; s.stat.schuesse[p.team]++; zeigeHinweis('Kopfball!', 1); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(b.ausEcke ? 'kopfball_ecke' : 'schuss', p.name, true); }
            else { b.v.set(w.x * 9, 4, w.z * 9); }
            musik.sfx && musik.sfx.schuss(.4);
            break;
          }
          if (zumTor){ const kopfG = hatFae(p, 'kopf'), vol = hatFae(p, 'volley') && b.p.y < 1.5;
            const zz = kopfG || vol ? (Math.random() < .5 ? -1 : 1) * zufall(TB - 1.2, TB - .4) : klemme(zufall(-TB + .4, TB - .4), -TB, TB), w = V(gx - b.p.x, 0, zz - b.p.z).normalize();
            const vv = vol ? zufall(17, 21) : kopfG ? zufall(13, 16) : zufall(11, 14);
            b.v.set(w.x * vv, vol ? zufall(-.5, 1.5) : zufall(-2.5, .5), w.z * vv); if (vol) zeigeHinweis('🦶 VOLLEY!', 1); b.schussVon = p; b.schussX0 = b.p.x; s.stat.schuesse[p.team]++; zeigeHinweis('Kopfball!', 1); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(b.ausEcke ? 'kopfball_ecke' : 'schuss', p.name, true); }
          else { const w = V(-richt(1 - p.team) * 1, 0, zufall(-.5, .5)).normalize(); b.v.set(w.x * 9, 4, w.z * 9); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('klaeren', p.name); }
          musik.sfx && musik.sfx.schuss(.4);
          break;
        }
      }
    }
    if (b.flanke && (b.besitzer || b.p.y <= BALL_R + .02)){ b.flanke = false; b.ausEcke = false; }
    paraden(dt);
    // Zweikampf im Stehen
    if (b.besitzer){
      const h = b.besitzer;
      for (const p of teamSp(1 - h.team)){
        if (p.sperre > 0 || p.gefallen > 0 || p.grae > 0) continue;
        if (d2(p.p, h.p) < .72){
          let rate = .85 * Math.pow(W(p, 'abw') / W(h, 'dri'), 3) * (p.team === 1 ? st.zweikampf : 1);
          if (spezAn(p, 'abw')) rate *= 3; if (spezAn(h, 'dri')) rate *= .15; if (hatFae(p, 'zweikampf')) rate *= 1.5;
          if (istMensch(p)) rate *= 1.35;
          if (h.rolle === 'TW' && imStrafraum(h.p, h.team)) rate = 0;
          if (Math.random() < rate * dt){
            if (Math.random() < .06){ foul(p, h); return; }
            ballLos(h); h.sperre = .55;
            b.v.set(p.blick.x * 3 + zufall(-1, 1), 0, p.blick.z * 3 + zufall(-1, 1));
            b.letzter = p; b.letzteTeam = p.team; p.sperre = .1;
            break;
          }
        }
      }
    }
    // Tackling (normaler Zweikampf, ohne zu Boden zu gehen)
    for (const p of aktiv()){
      if (!(p.tackleT > 0)) continue;
      p.tackleT -= dt;
      const h = b.besitzer;
      if (h && h.team !== p.team && d2(p.p, h.p) < 1.05){
        p.tackleT = 0;
        let chance = klemme(.55 + (W(p, 'abw') - W(h, 'dri')) * .02 + (s.stufe === 'leicht' ? .15 : s.stufe === 'stark' ? -.1 : 0), .25, .88);
        if (spezAn(p, 'abw')) chance = .95; if (spezAn(h, 'dri')) chance = .12; if (hatFae(p, 'zweikampf')) chance = Math.min(.93, chance + .18);
        const vonHinten = p.blick.dot(h.blick) > .5;
        if (Math.random() < chance){
          ballLos(h); h.sperre = .55;
          b.v.set(p.blick.x * 2.5, 0, p.blick.z * 2.5); b.letzter = p; b.letzteTeam = p.team;
          uebernehmen(p); zeigeHinweis('Ball erobert!', 1); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('tackle', p.name);
        } else if (vonHinten && Math.random() < .25){ foul(p, h, true); return; }
        else { p.sperre = .6; p.v.multiplyScalar(.3); if (Math.random() < .4) (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('weiterlaufen', null); }
      } else if (p.tackleT <= 0){ p.sperre = Math.max(p.sperre, .35); }
    }
    // Grätschen
    for (const p of aktiv()){
      if (p.grae <= 0 || s.phase === 'tor') continue;
      if (!p.graeBall && d2(p.p, b.p) < .85 && b.p.y < .6){
        p.graeBall = true;
        if (b.besitzer && b.besitzer.team !== p.team){ const h = b.besitzer; ballLos(h); h.sperre = .7; h.gefallen = .5; }
        else if (b.besitzer === null) {}
        if (b.besitzer !== p){
          b.besitzer = null; b.v.set(p.blick.x * 6 + zufall(-1.5, 1.5), .5, p.blick.z * 6 + zufall(-1.5, 1.5));
          b.letzter = p; b.letzteTeam = p.team; b.passZiel = null;
        }
      }
      for (const q of teamSp(1 - p.team)){
        if (q.gefallen > 0 || p.graeOpfer === q) continue;
        if (d2(p.p, q.p) < .7){
          p.graeOpfer = q; q.gefallen = 1.1;
          const vonHinten = p.blick.dot(q.blick) > .45;
          if (!p.graeBall && Math.random() < (vonHinten ? .92 : .7)){ foul(p, q, vonHinten); return; }
          if (b.besitzer === q){ ballLos(q); b.v.set(q.v.x * .5, 0, q.v.z * .5); }
        }
      }
    }
  }
  function uebernehmen(p){
    const b = welt.ball;
    if (b.abseits === p && s.phase === 'spiel'){ abseits(p); return; }
    b.abseits = null;
    if (s.phase === 'spiel'){
      const pv = b.passVon;
      if (pv && pv !== p){ if (pv.team === p.team){ pst(pv).passOk++; b.assistVon = pv; pv.spezLade = Math.min(1, (pv.spezLade || 0) + .1); } else b.assistVon = null; }
      else if (!pv && b.letzteTeam != null && b.letzteTeam !== p.team){ if (p.rolle !== 'TW') pst(p).ballGew++; b.assistVon = null; }
      if (pv && pv.team !== p.team && p.rolle !== 'TW') pst(p).ballGew++;
    }
    b.passVon = null; b.feuer = false;
    b.besitzer = p; b.passZiel = null; b.schussVon = null; b.twCheck = null; p.besitzZeit = 0; p.denkT = STUFE[s.stufe].reaktion * .6;
    b.letzter = p; b.letzteTeam = p.team;
    if (s.phase === 'spiel') (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('ball', p.name);
    if (!lokal.fest && !s.fern && !istMensch(p) && lokal.steuer && lokal.steuer.team === p.team) s.steuer = p;       // Ballführer wird automatisch gesteuert (nur allein)
    else if (s.fern && !s.gast && !istMensch(p) && p.rolle !== 'TW'){ try { for (const k of menschen()){ if (k.steuer && k.steuer.team === p.team && wechselErlaubt(k)){ steuerWechsel(k, p); break; } } } catch (e) {} }   // V9.0: online ebenso
  }
  function grae(p){
    if (p.grae > 0 || p.gefallen > 0 || p.sperre > .2) return;
    p.grae = .55; p.graeBall = false; p.graeOpfer = null;
    const sp = 8.2; p.v.set(p.blick.x * sp, 0, p.blick.z * sp);
    musik.sfx && musik.sfx.rutschen();
  }

  // Torwart: echte manuelle Parade. Die Richtung kommt vom Joystick;
  // ohne Joystick geht der Hecht automatisch zur Ballrichtung.
  function torwartHecht(k = lokal){
    if (!s || s.phase !== 'spiel' || !k || !k.steuer) return;
    const p = k.steuer;
    if (p.rolle !== 'TW' || p.gefallen > 0 || p.grae > 0 || p.hecht > 0) return;
    const b = welt.ball;
    const r0 = k.richtung();
    let r = r0.length() > .22 ? r0.normalize() : V(b.p.x - p.p.x, 0, b.p.z - p.p.z);
    if (r.length() < .12) r = p.blick.clone();
    r.normalize();

    // Nahen, kontrollierbaren Ball direkt sichern: HECHT wird zum Fangversuch.
    const dist = d2(p.p, b.p);
    const ballTempo = Math.hypot(b.v.x, b.v.z);
    if (!b.besitzer && imStrafraum(p.p, p.team) && dist < 1.7 && b.p.y < 2.15 && ballTempo < 18){
      p.hecht = .45; p.hechtSeite = Math.sign(r.z) || 1;
      uebernehmen(p);
      b.p.y = .75; b.v.set(0, 0, 0);
      zeigeHinweis('GEHALTEN!');
      (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('fang', p.name, true);
      return;
    }

    // Torwart-Hecht: seitlich stark, vor/zurück nur leicht, damit er im Strafraum bleibt.
    const dir = richt(p.team);
    const dx = klemme(r.x, -.38, .38);
    const dz = r.z;
    const speed = 7.8 * Math.max(.72, Math.min(1, Math.hypot(dx, dz)));
    p.hecht = .6;
    p.hechtSeite = Math.sign(dz || (b.p.z - p.p.z)) || 1;
    p.blick.copy(r);
    p.v.set(dx * speed, 0, dz * speed);
    p.sperre = Math.max(p.sperre, .08);
    if (!b.besitzer && b.v.length() > 4) zeigeHinweis('HECHT!');
  }

  // V4.3: Torwart spielt wie ein Feldspieler, wenn er den Ball am Fuß hat (Abstoß) oder außerhalb des Strafraums ist.
  function twAmFuss(c){
    return !!(c && c.rolle === 'TW' && s && ((s.phase === 'standard' && s.std && s.std.schuetze === c) || !imStrafraum(c.p, c.team)));
  }
  function twMitBall(c){ return !!(c && c.rolle === 'TW' && welt.ball.besitzer === c); }
  // Der Torwart ist nur steuerbar, wenn er den Ball in der Hand hat (Abwurf) oder bei Abstößen – sonst spielt die KI
  function twSteuerbar(c){ return !c || c.rolle !== 'TW' || !s || twMitBall(c) || (s.phase === 'standard' && !!s.std && s.std.schuetze === c); }
  // Torwart mit Ball: sicherer Abwurf in Joystick-Richtung.
  function torwartAbwurf(k = lokal){
    if (!s || s.phase !== 'spiel' || !k || !k.steuer) return;
    const p = k.steuer, b = welt.ball;
    if (p.rolle !== 'TW' || b.besitzer !== p) return;
    let r = k.richtung();
    if (r.length() < .22) r = p.blick.clone();
    if (r.length() < .12) r = V(richt(p.team), 0, 0);
    r.normalize();
    const dist = 9.5;
    ballLos(p);
    b.besitzer = null;
    b.passZiel = null; b.schussVon = null; b.passVon = p; b.flanke = false;
    b.p.set(p.p.x + r.x * .45, 1.05, p.p.z + r.z * .45);
    b.v.set(r.x * dist, 3.8, r.z * dist);
    b.ausT = .1; p.sperre = .2;
    zeigeHinweis('ABWURF!');
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('abwurf', p.name, true);
    musik.sfx && musik.sfx.schuss(.35);
  }

  // Torwartparaden
  function paraden(dt){
    const b = welt.ball, st = STUFE[s.stufe];
    if (b.besitzer) return;
    for (const t of [0, 1]){
      const tw = torwartVon(t); if (!tw || tw.gefallen > 0) continue;
      const dir = richt(t);
      if (b.v.x * dir > -6) continue;                      // nicht aufs eigene Tor
      if (b.twCheck === tw) continue;
      const brust = V(tw.p.x, .75, tw.p.z);
      const d = b.p.distanceTo(brust);
      const kann = (t === 1 ? st.tw : (istMensch(tw) ? .93 : .9)) * (.85 + (W(tw, 'abw') - 70) * .012);
      const reich = 1.25 + .9 * kann + TW_TUNING.reich;          // Torwart erreicht Bälle Richtung Ecke, aber nicht jeden Winkel
      if (d < reich + .25){
        b.twCheck = tw;
        const tempo = b.v.length();
        // Wo kreuzt der Ball die Torlinie? Je näher der Torwart daran steht, desto sicherer die Parade
        const tLinie = (tw.p.x - b.p.x) / (b.v.x || 1e-3);
        const zKreuz = tLinie > 0 ? b.p.z + b.v.z * tLinie : b.p.z;
        const fehler = Math.abs(zKreuz - tw.p.z), hoch = Math.max(0, b.p.y - 1.6);
        const weitW = (b.schussVon && b.schussX0 != null) ? klemme((Math.abs(b.p.x - b.schussX0) - 10) / 12, 0, 1) : 0;   // Weitschuss: Torwart hat mehr Zeit
        const chance = klemme(kann * (1.42 - tempo / 42) - fehler * .15 - hoch * .23 + weitW * (.22 + TW_TUNING.weitschuss) + .05 + TW_TUNING.chance, .2, TW_TUNING.deckel) * (b.feuer ? .45 : 1) * (hatFae(b.schussVon, 'schuss') ? .85 : 1) * (hatFae(b.schussVon, 'elfer') && s.so && s.so.an ? .65 : 1);   // Torwart stark, aber schlagbar
        tw.hecht = .6; tw.hechtSeite = Math.sign(b.p.z - tw.p.z) || 1;
        if (Math.random() < chance * (s.so && s.so.an ? (fehler > 1.2 ? .42 : .8) : 1)){   // V9.3: Elfmeter – Ecken sind schwer zu halten
          s.stat.paraden[t]++; pst(tw).paraden++; if (b.schussVon && b.schussVon.team !== t) pst(b.schussVon).aufsTor++;
          
          if (tempo < 17 && fehler < 1.45 && hoch < .9 && (istMensch(tw) || Math.random() < .55)){ uebernehmen(tw); b.p.y = .75; b.v.set(0, 0, 0); zeigeHinweis('GEHALTEN!'); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('fang', tw.name, true); }
          else if (Math.random() < .42){
            b.letzter = tw; tw.sperre = .5; b.twCheck = tw; zurEcke(t); zeigeHinweis(s.halle ? 'Abgewehrt!' : 'Zur Ecke abgewehrt!'); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('parade_ecke', tw.name, true);
          }
          else {
            b.v.x = -b.v.x * .35; b.v.z = b.v.z * .4 + zufall(-3, 3); b.v.y = zufall(2, 5);
            b.letzter = tw; b.letzteTeam = t; tw.sperre = .4; zeigeHinweis('Pariert!'); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('parade', tw.name, true);
          }
          musik.sfx && musik.sfx.oh();
        }
      }
    }
  }

  // Ball wird zur Ecke abgefälscht: über die eigene Torlinie neben den Pfosten oder über die Latte
  function zurEcke(verteidiger){
    const b = welt.ball, gx = -richt(verteidiger) * HL, sx = Math.sign(gx);
    const dx = Math.max(.4, Math.abs(gx - b.p.x)), t = klemme(dx / 7, .2, .7);
    const zs = Math.sign(b.p.z) || (Math.random() < .5 ? -1 : 1);
    const zZiel = zs * zufall(TB + 1, TB + 4);
    const vz = (zZiel - b.p.z) / t;
    b.besitzer = null; b.v.x = sx * (dx + .8) / t;
    if (Math.abs(vz) < 15 && Math.random() < .7){ b.v.z = vz; b.v.y = zufall(1.5, 3.5); }
    else { b.v.z = b.v.z * .25; b.v.y = (TH + .8 - b.p.y + G * t * t / 2) / t; }      // über die Latte
    b.schussVon = null; b.passZiel = null; b.flanke = false; b.ausT = t + .4;
    b.letzteTeam = verteidiger;
  }
  // Aus, Ecke, Abstoß, Tor
  // HALL OF FAME: Bande rundherum hinter den Linien (V10.0: Aus, Einwurf, Ecke und Abstoß gelten wie im Stadion)
  function hallenBande(b){
    if (b.besitzer) return;
    const R = BALL_R, imTor = Math.abs(b.p.z) < TB - R * .5 && b.p.y < TH;
    let stoss = 0;
    if (Math.abs(b.p.z) > BANDE_Z - R){ const sz = Math.sign(b.p.z); b.p.z = sz * (BANDE_Z - R); if (b.v.z * sz > 0){ stoss = Math.abs(b.v.z); b.v.z = -b.v.z * .62; b.v.x *= .92; } }
    if (Math.abs(b.p.x) > BANDE_X - R && !imTor){
      const sx = Math.sign(b.p.x); b.p.x = sx * (BANDE_X - R);
      if (b.v.x * sx > 0){ stoss = Math.max(stoss, Math.abs(b.v.x)); b.v.x = -b.v.x * .62; b.v.z *= .92; }
    }
    if (b.p.y > 9 && b.v.y > 0) b.v.y = -b.v.y * .5;   // Hallendecke
    if (stoss > 7 && s.phase === 'spiel') try { (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('bande', null); } catch (e) {}   // Kommentatorin: Ball an der Bande
    if (stoss > 2){ if (b.spin){ b.spin.x *= .4; b.spin.y *= .4; b.spin.z *= .4; } b.dvx = b.v.x; b.dvz = b.v.z; b.passZiel = null; b.flanke = false; b.ausEcke = false; if (stoss > 9) b.schussVon = null; }
  }
  function regelPruefung(){
    const b = welt.ball;
    if (s.halle){   // V10.0: Halle hat jetzt Aus, Einwurf, Ecke und Abstoß wie das Stadion; die Bande fängt den Ball nur hinter der Linie ab
      hallenBande(b);
      if (s.phase === 'aus' && !b.besitzer){ b.v.x *= .9; b.v.z *= .9; }   // nach dem Aus rollt der Ball kurz aus, springt nicht quer durch die Halle
      if (s.phase !== 'spiel') return;
      if (Math.abs(b.p.x) > HL + BALL_R && Math.abs(b.p.z) < TB - BALL_R * .5 && b.p.y < TH){ const seite = Math.sign(b.p.x), angreifer = richt(0) === seite ? 0 : 1; return tor(angreifer); }
    } else if (s.phase !== 'spiel') return;
    if (Math.abs(b.p.z) > HB + BALL_R + (s.halle ? 0 : .45)){   // V10.0: Seitenlinie großzügiger
      return ausVormerken('einwurf', 1 - b.letzteTeam, V(klemme(b.p.x, -HL + 1, HL - 1), 0, Math.sign(b.p.z) * HB));
    }
    if (Math.abs(b.p.x) > HL + BALL_R){
      const seite = Math.sign(b.p.x), angreifer = richt(0) === seite ? 0 : 1, verteidiger = 1 - angreifer;
      if (b.innen != null ? b.innen : (Math.abs(b.p.z) < TB - BALL_R * .5 && b.p.y < TH)) return tor(angreifer);
      if (b.schussVon && Math.abs(b.p.z) < TB + 2.6 && b.p.y < TH + 1.6){ musik.sfx && musik.sfx.oh(); zeigeHinweis('Knapp vorbei!', 1.2); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(b.p.y > TH + .1 ? 'drueber' : 'knapp', b.schussVon && b.schussVon.name, true); }
      if (b.letzteTeam === verteidiger) return ausVormerken('ecke', angreifer, V(seite * (HL - .3), 0, Math.sign(b.p.z || 1) * (HB - .3)));
      return ausVormerken('abstoss', verteidiger, V(seite * (HL - 2.2), 0, 0));
    }
  }
  // V4.4: Der Ball rollt bzw. fliegt nach dem Aus weiter; erst danach geht es mit Einwurf, Ecke oder Abstoß weiter
  function ausVormerken(typ, team, ort){
    if (s.so && s.so.an && !s.so.fertig) return soErgebnis(typ === 'ecke' ? 'gehalten' : 'daneben');   // V7.9
    if (s.gast) return standard(typ, team, ort);
    const b = welt.ball;
    s.phase = 'aus'; s.ausDaten = { typ, team, ort };
    const v = Math.hypot(b.v.x, b.v.z);
    s.phaseT = klemme(.7 + v * .06, .9, 1.8);
    b.besitzer = null; b.passZiel = null;
  }

  // ---------- Halbzeit: Pfiff, Zwischenstand, Seitenwechsel ----------
  // V6.2: Nachspielzeit – wächst mit Unterbrechungen (Tore, Fouls, Karten, Wechsel, Verletzungen)
  function nachspielPlus(min){ if (!s || s.gast || !s.nsSoll || (s.so && s.so.an)) return; s.nsSoll[s.verlaengerung ? 2 + (s.vHalb || 0) : ((s.halbzeitGewesen || s.halle) ? 1 : 0)] += min; }   // V7.9: auch in der Verlängerung (Halbzeit 3 und 4)
  function nachspielStart(h){
    const et = h >= 2;
    const roh = (et ? .4 : 1) + (s.nsSoll ? (s.nsSoll[h] || 0) : 0) + Math.random() * .8;
    const min = Math.max(1, Math.min(et ? 2 : (h ? 6 : 4), Math.round(roh)));
    s.ns = { halb: h, min, t: 0, warte: 0 };
    try { zeigeHinweis('NACHSPIELZEIT +' + min, 2.2); } catch (e) {}
  }
  window.__nachspielEreignis = typ => {
    if (/^(tor|fuehrung|ausbau|anschluss|ausgleich|aufholjagd)$/.test(typ)) nachspielPlus(.5);
    else if (/^foul/.test(typ)) nachspielPlus(.2);
    else if (/^gelb/.test(typ)) nachspielPlus(.3);
    else if (/^rot/.test(typ)) nachspielPlus(.5);
    else if (typ === 'elfmeter') nachspielPlus(.3);
  };
  function halbzeit(){
    const b = welt.ball;
    // V3.0: erst gehen alle in den Tunnel (nur offline / Gastgeber ohne Mitspieler), dann die Halbzeit-Tafel
    if (!s.fern && !s.gast && s.phase !== 'hzGang'){
      s.phase = 'hzGang'; s.phaseT = 4.2; s.halbzeitGewesen = true; s.std = null;
      b.besitzer = null; b.v.set(0, 0, 0); b.p.y = BALL_R; b.flanke = false;   // V7.7: Ball liegt beim Gang in die Kabine auf dem Rasen
      musik.sfx && musik.sfx.pfiff(2);
      (typeof KOMMENTAR !== 'undefined') && KOMMENTAR.ereignis('halbzeit', null, true);
      s.hzPfiffSchon = true;
      return;
    }
    s.phase = 'halbzeit'; s.halbzeitGewesen = true; s.std = null;
    b.besitzer = null; b.v.set(0, 0, 0);
    for (const p of s.spieler){ p.v.set(0, 0, 0); p.grae = 0; p.spezT = 0; }
    if (!s.hzPfiffSchon){ musik.sfx && musik.sfx.pfiff(2);
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('halbzeit', null, true); }
    try { kiWechselHalbzeit(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
    halbzeitZeigen();
    clearTimeout(s.hzUhr); s.hzUhr = spielTimer(() => { if (s && s.phase === 'halbzeit' && !s.gast) zweiteHalbzeit(); }, 12000);
  }
  function halbzeitZeigen(){
    const [a, c] = s.tore, st = s.stat;
    $s('hzStand').innerHTML = flaggeHTML(s.land[0]) + ' ' + a + ' – ' + c + ' ' + flaggeHTML(s.gegner[0]);
    const zeile = (n, x, y) => '<div><b>' + x + '</b><span>' + n + '</span><b>' + y + '</b></div>';
    $s('hzStat').innerHTML = zeile('Schüsse', st.schuesse[0], st.schuesse[1]) + zeile('Paraden', st.paraden[0], st.paraden[1]) + zeile('Fouls', st.fouls[0], st.fouls[1]);
    $s('hzWeiter').hidden = !!s.gast;
    $s('hzHinweis').textContent = s.gast ? 'Der Gastgeber pfeift die 2. Halbzeit an …' : 'Seitenwechsel – in der 2. Halbzeit spielst du auf das andere Tor.';
    $s('hzUeber').hidden = false;
    try { wechselKnoepfe(); } catch (e) {}
  }
  function zweiteHalbzeit(){
    if (!s || s.phase !== 'halbzeit') return;
    clearTimeout(s.hzUhr);
    $s('hzUeber').hidden = true;
    { const wu = document.getElementById('wechselUeber'); if (wu) wu.hidden = true; }
    s.getauscht = true;
    // V3.31: In der Halbzeitpause erholen sich alle Spieler ein bisschen (+25 % der Maximal-Ausdauer, V5.3).
    for (const q of s.spieler){ if (q.ausdauer != null){ const mx = Math.max(1, q.maxAusdauer || 100); q.ausdauer = Math.min(mx, q.ausdauer + mx * .25); } }
    s.naechsterAnstoss = 1 - (s.ersterAnstoss || 0);
    meldung('2. HALBZEIT', 'Seitenwechsel', null, 1.8);
    musik.sfx && musik.sfx.pfiff(1);
    s.jubelDaten = null; s.wdhPlan = null;
    // V3.51: Kein Einlauf/Aufstellung (Hymnen-Szene) mehr zur 2. Halbzeit - direkt zum Anstoss
    s.einlauf = null;
    try { wechselAusfuehrenAlle(true); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
    anstossPositionen(s.naechsterAnstoss);
    if (!s.fern && !s.gast && einlaufStart(true)) return;   // V3.0: zur 2. Halbzeit aus dem Tunnel
    s.phase = 'tor'; s.phaseT = .01;
  }
  // V3.0: Gang in die Kabine zur Halbzeit
  function hzGangSchritt(dt){
    s.phaseT -= dt;
    const alle = s.spieler.filter(p => p.aktiv);
    alle.sort((a, c) => Math.hypot(a.p.x, a.p.z - TUN_Z0) - Math.hypot(c.p.x, c.p.z - TUN_Z0));
    alle.forEach((p, i) => {
      p.grae = 0; p.gefallen = 0; p.sperre = 0; p.hecht = 0; p.sprung = 0; p.jubel = 0;
      const zx = Math.abs(p.p.z - TUN_Z0) > 3 ? (p.team === 0 ? -1 : 1) * (.6 + Math.min(4, Math.abs(p.p.z - TUN_Z0) * .12)) : (p.team === 0 ? -.6 : .6);
      ausklangGehe(p, zx, Math.abs(p.p.z - TUN_Z0) > 3 ? TUN_Z0 + .8 : TUN_Z1 + .3, 7.5, dt);
    });
    const sch = welt.schiri; if (sch) ausklangGehe(sch, 0, sch.p.z - TUN_Z0 > 3 ? TUN_Z0 + .8 : TUN_Z1 + .3, 7.5, dt);
    const drin = alle.every(p => imTunnel(p));
    if (s.phaseT <= 0 || drin){ halbzeit(); }
  }
  function tor(team){
    if (s.so && s.so.an && !s.so.fertig) return soErgebnis(team === s.so.team ? 'tor' : 'daneben');   // V7.9: Elfmeterschießen – zählt nicht im Spielstand
    const b = welt.ball;
    s.tore[team]++; s.phase = 'tor'; s.phaseT = 3.4; s.besitzTeam = null; s.letztTorTeam = team;
    zurueckZumHeimSpieler();   // V8.5
    b.besitzer = null;
    try { if (typeof KOMMENTAR !== 'undefined') KOMMENTAR.setTorOrt(Math.abs(b.p.z) > TB * .66 || b.p.y > TH * .75 ? 'ecke' : 'mitte'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V4.0: Ball in die Ecke oder mittig?
    const schuetze = b.letzter && b.letzter.team === team ? b.letzter : null;
    if (schuetze){ pst(schuetze).tore++; pst(schuetze).aufsTor++; if (b.assistVon && b.assistVon.team === team && b.assistVon !== schuetze) pst(b.assistVon).vorlagen++; }
    if (!s.gast && (istStar(schuetze) || (b.assistVon && b.assistVon !== schuetze && b.assistVon.team === team && istStar(b.assistVon)))){
      s.schwungBis = s.zeit - 40; spielTimer(() => { if (s) zeigeHinweis('⭐ ' + (istStar(schuetze) ? schuetze.name : b.assistVon.name) + ' reißt das Team mit – mehr Schwung!', 2.6); }, 2200);
    }
    { const twg = torwartVon(1 - team); if (twg) pst(twg).gegentore++; }
    const vorlageGeber = (b.assistVon && b.assistVon.team === team && b.assistVon !== schuetze && b.assistVon.rolle !== 'TW') ? b.assistVon : null;
    b.assistVon = null; b.passVon = null;
    s.wdhPlan = { t: aufnahmeUhr };
    meldung('TOR!', schuetze ? schuetze.name : 'Eigentor');
    { const vorher = s.tore[team] - 1, gegner = s.tore[1 - team];
      s.maxRueck = s.maxRueck || [0, 0];
      let typK = vorher < gegner ? (s.maxRueck[team] >= 2 && s.tore[team] >= gegner ? 'aufholjagd' : s.tore[team] === gegner ? 'ausgleich' : 'anschluss') : (vorher === gegner ? 'fuehrung' : 'ausbau');
      if ((typK === 'fuehrung' || typK === 'ausbau' || typK === 'anschluss') && Math.random() < .4) typK = 'tor';
      if (typeof KOMMENTAR !== 'undefined' && !s.gast){ KOMMENTAR.ereignis(typK, schuetze ? schuetze.name : null, true); KOMMENTAR.stand(s.tore[0], s.tore[1], vorher === gegner ? (team === 0 ? s.land[0] : s.gegner[0]) : null, (vorher > gegner && Math.random() < .6) ? (team === 0 ? s.land[0] : s.gegner[0]) : null); }
      s.maxRueck[1 - team] = Math.max(s.maxRueck[1 - team], s.tore[team] - s.tore[1 - team]); }
    for (const p of teamSp(team)) p.jubel = 2.6;
    // Jubel: Torschütze läuft Richtung Eckfahne/Kamera, Mitspieler laufen zu ihm, Kamera fährt nah heran
    s.phaseT = 4.6;
    if (schuetze){
      // V4.6: viele zufällige Torjubel (Torschütze) und Gruppenjubel (Mitspieler)
      // 40 Torjubel = 4 Laufziele x (9 Posen + Knie-Rutscher); Mitspieler laufen jeweils zum Torschützen
      const POSEN = ['hoch', 'faust', 'flieger', 'siu', 'herz', 'muskel', 'ohr', 'kreuz', 'umarmen'];
      const ZIELE = ['ecke', 'fans', 'kamera', 'mitte'];
      const katalog = []; for (const zl of ZIELE) for (const ar of [...POSEN, 'rutscher']) katalog.push({ zl, ar });
      const pick = a => a[(Math.random() * a.length) | 0];
      const vT = s.tore[team] - 1, gT = s.tore[1 - team], dT = s.tore[team] - gT;
      const sigH = n => { let h = 7; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
      const hh = sigH(schuetze.name), alle = [...POSEN, 'rutscher'];
      let wahl;
      if (Math.random() < .6) wahl = { zl: ZIELE[hh % ZIELE.length], ar: alle[(hh >> 3) % alle.length] };      // eigener Erkennungsjubel des Spielers
      else if (vT <= gT) wahl = { ar: pick(['hoch', 'faust', 'flieger', 'umarmen', 'siu', 'rutscher', 'rutscher', 'herz']), zl: pick(['fans', 'fans', 'ecke', 'ecke', 'kamera']) };   // Ausgleich / Rückstand verkürzt / Führung: wild
      else if (dT >= 3) wahl = { ar: pick(['hoch', 'faust', 'kreuz', 'muskel', 'herz', 'umarmen']), zl: pick(['mitte', 'mitte', 'kamera']) };                                      // klare Führung: ruhiger
      else wahl = katalog[(Math.random() * katalog.length) | 0];
      const art = wahl.ar, zielArt = wahl.zl;
      const mitArten = ['hoch', 'faust'];   // Mitspieler: Arme hoch / Faust, wie im echten Spiel
      const dirT = richt(team), sx = schuetze.p.x, sz = schuetze.p.z;
      let zx, zz;
      if (zielArt === 'ecke'){ zx = sx + dirT * Math.min(12, Math.max(3, HL - sx * dirT - 2.5)); zz = HB - 2.5; }          // zur Eckfahne
      else if (zielArt === 'fans'){ zx = sx + dirT * 3; zz = HB - 1.2; }                                                   // zu den Zuschauern an der Bande
      else if (zielArt === 'kamera'){ zx = sx + dirT * 3; zz = sz * .3 + HB - 5; }                                         // Richtung Kamera
      else { zx = sx + dirT * 1.5; zz = sz * .6; }                                                                         // bleibt in der Nähe
      zx = klemme(zx, -HL + 2, HL - 2); zz = klemme(zz, -HB + 2, HB - 1);
      const mitArt = art === 'umarmen' ? 'umarmen' : ((art === 'hoch' || art === 'faust') && Math.random() < .6 ? art : mitArten[(Math.random() * mitArten.length) | 0]);
      s.jubelDaten = { schuetze, art, zielArt, team, t: 0, ziel: V(zx, 0, zz), gerutscht: false, mitArt, vorlage: vorlageGeber };
      schuetze.jubelArt = art === 'rutscher' ? 'hoch' : art;
      { const ks = kontrolleVon(schuetze); if (ks) hinweisFuer(ks, 'Joystick = laufen · SCHUSS = Faust · PASS = Umarmung · FLANKE = Siu', 3); }   // Torschütze darf kurz selbst laufen
    } else s.jubelDaten = null;
    musik.sfx && musik.sfx.jubel(team === lokal.team);
    musik.sfx && musik.sfx.pfiff(1);
    s.naechsterAnstoss = 1 - team;
    aktualisiereTafel();
  }

  function foul(taeter, opfer, vonHinten){
    if (s.phase !== 'spiel') return;
    const b = welt.ball;
    // V5.5: Verletzung vorab auswürfeln (schwere Verletzung = immer Pfiff)
    const verlArt = (!s.gast && !opfer.verletzt && Math.random() < (vonHinten ? .2 : .07)) ? (Math.random() < .45 ? 'schwer' : 'leicht') : null;
    // V5.5: Vorteil – Foul ohne Ball, und das gefoulte Team hat den Ball: weiterspielen (nicht im Strafraum, nicht bei schwerer Verletzung)
    const hb = b.besitzer;
    if (hb && hb.team === opfer.team && hb !== opfer && verlArt !== 'schwer' && !imStrafraum(opfer.p, taeter.team)){
      s.stat.fouls[taeter.team]++; pst(taeter).fouls++;
      opfer.gefallen = 1.1;
      let karte = null;
      if (vonHinten && Math.random() < .05) karte = 'rot';
      else if (Math.random() < (vonHinten ? .6 : .22)){ taeter.gelb++; karte = taeter.gelb >= 2 ? 'gelbrot' : 'gelb'; }
      if (karte){ pst(taeter)[karte === 'gelb' ? 'gelb' : 'rot']++; s.kartenLog = s.kartenLog || []; s.kartenLog.push({ idx: PLAYER_DATABASE.indexOf(taeter.daten), name: taeter.name, team: taeter.team, typ: karte });
        const sch = welt.schiri; sch.karteFarbe = karte === 'gelb' ? '#ffe234' : '#e0262c'; sch.karteT = 2.0;
        if (karte !== 'gelb'){ taeter.aktiv = false; taeter.gruppe.visible = false; for (const k of menschen()) if (k.steuer === taeter){ const n = teamSp(taeter.team).find(q => q.rolle !== 'TW'); if (n) k.steuer = n; } } }
      meldung('VORTEIL!', karte ? (karte === 'gelb' ? 'GELBE KARTE · ' : karte === 'gelbrot' ? 'GELB-ROT · ' : 'ROTE KARTE · ') + taeter.name : 'Weiterspielen', karte === 'gelb' ? 'gelb' : karte ? 'rot' : null, 1.8);
      try { musik.sfx && musik.sfx.pfiff && musik.sfx.pfiff(0); } catch (e) {}
      if (verlArt) verletzung(opfer, verlArt);
      return;
    }
    s.phase = 'pfiff'; s.phaseT = 2.0; s.stat.fouls[taeter.team]++; pst(taeter).fouls++;
    musik.sfx && musik.sfx.pfiff(1);
    b.besitzer = null; b.v.set(0, 0, 0);
    opfer.gefallen = 1.3;
    let karte = null;
    if (vonHinten && Math.random() < .05) karte = 'rot';                                   // glatt Rot (selten)
    else if (Math.random() < (vonHinten ? .6 : .22)){ taeter.gelb++; karte = taeter.gelb >= 2 ? 'gelbrot' : 'gelb'; }
    if (karte){ pst(taeter)[karte === 'gelb' ? 'gelb' : 'rot']++; s.kartenLog = s.kartenLog || []; s.kartenLog.push({ idx: PLAYER_DATABASE.indexOf(taeter.daten), name: taeter.name, team: taeter.team, typ: karte }); }
    const ort = opfer.p.clone();
    // im Strafraum: Freistoß an die Strafraumgrenze legen
    const elf = imStrafraum(ort, taeter.team);   // V3.2: Foul im Strafraum = Elfmeter
    if (elf){ ort.x = torX(taeter.team) + richt(taeter.team) * ELF_P; ort.z = 0; }
    ort.x = klemme(ort.x, -HL + 1, HL - 1); ort.z = klemme(ort.z, -HB + 1, HB - 1);
    s.foulDaten = { taeter, team: opfer.team, ort, elf, karte: karte === 'gelbrot' ? 'rot' : karte };
    // V7.5: Rudelbildung – nach Karten fast immer, sonst bei etwa jedem dritten Foul laufen KI-Spieler zum Schiedsrichter
    try {
      if (Math.random() < (karte ? .9 : .33)){
        const kand = s.spieler.filter(q => q.aktiv && q.rolle !== 'TW' && q !== opfer && !kontrolleVon(q)).sort((a, c) => d2(a.p, ort) - d2(c.p, ort));
        const wahl = kand.slice(0, karte === 'rot' || karte === 'gelbrot' ? 4 : karte ? 3 : 2);
        wahl.forEach((q, i) => { q.rudel = { t: 2.8, i, n: wahl.length }; });
        if (wahl.length) s.phaseT = Math.max(s.phaseT, 3.4);
      }
    } catch (e) {}
    musik.sfx && musik.sfx.buh && musik.sfx.buh();
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(karte === 'gelb' ? 'gelb' : (karte === 'rot' || karte === 'gelbrot') ? 'rot' : 'foul', taeter.name, !!karte);
    if (karte) spielTimer(() => { if (s && !s.gast && typeof KOMMENTAR !== 'undefined') KOMMENTAR.ereignis('beschwerde', taeter.name); }, 2600);
    meldung(elf ? 'ELFMETER!' : 'FOUL!', karte ? (karte === 'rot' ? 'ROTE KARTE · ' : karte === 'gelbrot' ? 'GELB-ROT · ' : 'GELBE KARTE · ') + taeter.name : (elf ? 'Foul im Strafraum' : 'Freistoß'), karte === 'gelbrot' ? 'rot' : karte);
    if (karte === 'gelbrot') karte = 'rot';   // Platzverweis wie Rot
    if (karte){ const sch = welt.schiri; sch.karteFarbe = karte === 'rot' ? '#e0262c' : '#ffe234'; sch.karteT = 2.0; }
    // V3.0: Verletzung – bei Fouls von hinten häufiger
    if (verlArt) verletzung(opfer, verlArt);
  }
  function verletzung(p, art){
    p.verletzt = art; p.tempo *= art === 'schwer' ? .72 : .88;
    p.gefallen = 3.2; s.phaseT = Math.max(s.phaseT, 3.4);
    const idx = PLAYER_DATABASE.indexOf(p.daten);
    if (p.team === 0 && idx >= 0 && s.neuVerletzt) s.neuVerletzt[idx] = art === 'schwer' ? 2 + (Math.random() < .5 ? 1 : 0) : 1;
    if (art === 'schwer' && s.mussRaus) s.mussRaus.push(p);
    if (art === 'schwer' && !s.gast) s.trageFall = p;   // V5.3: wird nach dem Pfiff mit der Trage vom Platz gebracht
    try { trainerSag(p.team, 'verletzt', p.name, null, true); } catch (e) {}
    spielTimer(() => { if (s && p.aktiv) meldung('✚ VERLETZT', p.name + (art === 'schwer' ? ' – muss raus' : ' – spielt angeschlagen weiter'), null, 2.4); }, 1500);
  }

  // ---------- V5.3: Sanitäter mit Trage ----------
  const SANI_KIT = { t: '#ffffff', kragen: '#e0262c', n: '#e0262c', h: '#e0262c', s: '#ffffff', sBand: ['#e0262c'], schuh: [['#1b1b1b']], land: null };
  function trageStart(p){
    try { nachspielPlus(1); } catch (e) {}   // V6.2
    const keys = Object.keys(SPRITE_META).filter(k => SPRITES[k + '_v']);
    const sani = [0, 1, 2, 3].map(i => randFigur(keys[(Math.random() * keys.length) | 0], 0, SANI_KIT, '+'));   // V5.5: vier Sanitäter
    const bx = (p.team === 0 ? -1 : 1) * 5, start = V(bx, 0, -(HB + 1.6));
    // Trage liegt quer (entlang x) – so passt sie zum liegenden Spieler
    const seite = p.p.x >= start.x ? -1 : 1;   // Sanitäter kommen von der Bankseite
    const ziel = V(p.p.x, 0, p.p.z - .75);
    s.trage = { p, sani, stufe: 'hin', t: 0, m: start.clone(), start, ziel, h: .12, ort: p.p.clone(), seite };
    for (const o of sani){ o.p.copy(start); }
    p.gefallen = 99; p.v.set(0, 0, 0);
    s.phase = 'trage'; s.phaseT = 99;
    meldung('✚ SANITÄTER', p.name + ' wird behandelt', null, 2.4);
    try { trainerSag(p.team, 'verletzt', p.name, null, true); } catch (e) {}
  }
  function trageSchritt(dt){
    const T = s.trage; if (!T) return;
    T.t += dt;
    const p = T.p, L = 1.05;
    const geh = (zx, zz, tempo) => { const dx = zx - T.m.x, dz = zz - T.m.z, d = Math.hypot(dx, dz); if (d < .05) return [0, 0, true]; const st = Math.min(d, tempo * dt); T.m.x += dx / d * st; T.m.z += dz / d * st; return [dx / d * st / Math.max(dt, 1e-3), dz / d * st / Math.max(dt, 1e-3), d < .08]; };
    let vx = 0, vz = 0, an = false, blick = null;
    if (T.stufe === 'hin' || T.stufe === 'behandeln') p.p.copy(T.ort);
    if (T.stufe === 'hin'){
      [vx, vz, an] = geh(T.ziel.x, T.ziel.z, 4.6); T.h = .75;   // leere Trage wird in Hüfthöhe getragen
      if (an){ T.stufe = 'behandeln'; T.t = 0; }
    } else if (T.stufe === 'behandeln'){
      blick = [0, 1];   // zum Verletzten
      T.h = Math.max(.12, .75 - T.t * 1.4);   // Trage neben ihm abstellen
      if (T.t > 2.2){ T.stufe = 'heben'; T.t = 0; T.von = T.ort.clone(); }
    } else if (T.stufe === 'heben'){
      blick = [0, 1];
      const u = klemme(T.t / .9, 0, 1);
      p.p.set(T.von.x + (T.m.x - T.von.x) * u, 0, T.von.z + (T.m.z - T.von.z) * u);
      T.h = .12 + .68 * klemme((T.t - .9) / .6, 0, 1);
      if (T.t > 1.6){ T.stufe = 'tragen'; T.t = 0; try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(false); } catch (e) {} }
    } else if (T.stufe === 'tragen'){
      [vx, vz, an] = geh(T.start.x, T.start.z - 1.2, 3.0);
      p.p.set(T.m.x, 0, T.m.z);
      if (an){ T.stufe = 'ablegen'; T.t = 0; }
    } else if (T.stufe === 'ablegen'){
      T.h = Math.max(.12, .8 - T.t * 1.2);
      if (T.t > .9) trageEnde();
      if (!s.trage) return;
    }
    // Sanitäter: je zwei vorne und hinten an den Griffen der Trage
    T.sani.forEach((o, i) => {
      const sx = (i < 2 ? -1 : 1) * L, sz = (i % 2 ? 1 : -1) * .42;
      o.p.set(T.m.x + sx, 0, T.m.z + sz);
      o.v.set(vx, 0, vz);
      if (blick) o.blick.set(blick[0], 0, blick[1]);
      else if (Math.hypot(vx, vz) > .2) o.blick.set(vx, 0, vz).normalize();
      animiereFigur(o, dt, 0);
      if (T.stufe === 'behandeln' || T.stufe === 'heben') o.zeichen.huefteFest = T.stufe === 'behandeln' ? .32 : null, o.zeichen.pose = T.stufe === 'behandeln' ? 'sitzen' : null;   // knien beim Behandeln
    });
    p.gefallen = 99; p.v.set(0, 0, 0); p.blick.set(1, 0, 0);
  }
  function trageEnde(){
    const T = s.trage; if (!T) return;
    s.trage = null; s.trageFall = null;
    const p = T.p;
    p.gefallen = 0; p.p.set(T.start.x, 0, -HB + .35); p.blick.set(0, 0, 1);   // wartet an der Seitenlinie auf den Wechsel
    const f = s.foulDaten;
    if (f){ s.elfNaechster = !!f.elf; standard('freistoss', f.team, f.ort); }
    else standard('anstoss', s.naechsterAnstoss, V());
  }
  function zeichneTrage(liste, g){
    const T = s.trage; if (!T) return;
    const m = T.m, h = T.h, L = .95, B = .3;
    liste.push([m.z, () => {
      // Stangen und Tuch
      g.fillStyle = '#f2f2f2'; vieleck(g, [[m.x - L, h, m.z - B], [m.x + L, h, m.z - B], [m.x + L, h, m.z + B], [m.x - L, h, m.z + B]]); g.fill();
      g.fillStyle = '#e0262c'; vieleck(g, [[m.x - .12, h + .005, m.z - .1], [m.x + .12, h + .005, m.z - .1], [m.x + .12, h + .005, m.z + .1], [m.x - .12, h + .005, m.z + .1]]); g.fill();
      g.strokeStyle = '#3a3f4a'; g.lineWidth = Math.max(1.5, P(m.x, h, m.z).s * .05); g.lineCap = 'round';
      for (const dz of [-B, B]){ const a = P(m.x - L - .2, h, m.z + dz), b = P(m.x + L + .2, h, m.z + dz); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      // der Verletzte liegt auf der Trage (Position hier festlegen – sonst schiebt ihn die Aufstellung weg)
      const p = T.p, alt = p.zeichen.y, auf = T.stufe === 'tragen' || T.stufe === 'ablegen' || (T.stufe === 'heben' && T.t > .9);
      if (auf) p.p.set(m.x, 0, m.z); else if (T.stufe === 'hin' || T.stufe === 'behandeln') p.p.copy(T.ort);
      else if (T.stufe === 'heben'){ const u = klemme(T.t / .9, 0, 1); p.p.set(T.ort.x + (m.x - T.ort.x) * u, 0, T.ort.z + (m.z - T.ort.z) * u); }
      p.zeichen.y = auf ? h + .02 : 0; zeichneFigur(g, p); p.zeichen.y = alt;
    }]);
    for (const o of T.sani) liste.push([o.p.z + .01, () => zeichneFigur(g, o)]);
  }

  // ---------- Standardsituationen ----------
  function standard(typ, team, ort){
    const b = welt.ball;
    s.phase = 'standard'; s.besitzTeam = team;
    const elfStoss = typ === 'freistoss' && !!s.elfNaechster; s.elfNaechster = false;   // V3.2
    for (const p of s.spieler) p.mauer = null;
    if (!(typ === 'anstoss' && !s.halbzeitGewesen && s.tore[0] + s.tore[1] === 0 && s.zeit >= SPIELZEIT - .5)) try { wechselAusfuehrenAlle(false); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V3.0
    zurueckZumHeimSpieler();   // V8.5
    let schuetze;
    if (typ === 'abstoss') schuetze = torwartVon(team) || naechster(team, ort);
    else if (typ === 'anstoss') schuetze = teamSp(team).find(p => p.slot === 2) || naechster(team, ort);
    else schuetze = naechster(team, ort) || teamSp(team)[0];
    { const hm = menschImTeam(team); if (hm && hm.rolle !== 'TW' && typ !== 'anstoss' && typ !== 'abstoss' && d2(hm.p, ort) < 12) schuetze = hm; }
    // V1.2 (8+1-Test): Ecken und Freistöße führt immer ein menschlicher Spieler aus (der Mensch des Teams, dessen Figur am nächsten zum Ball steht; Torwart-Figuren werden übersprungen)
    // V3.0: Ecken, Freistöße und Einwürfe führt IMMER zuerst der Mensch aus. Steuerst du den Torwart,
    // übernimmst du für diese Ausführung kurz den nächsten Feldspieler und bist danach wieder im Tor.
    if (typ === 'ecke' || typ === 'freistoss' || typ === 'einwurf'){
      const ks = menschen().filter(k => k.team === team && k.steuer && k.steuer.aktiv);
      const kand = ks.filter(k => k.steuer.rolle !== 'TW').map(k => k.steuer).sort((a, c) => d2(a.p, ort) - d2(c.p, ort));
      if (kand.length) schuetze = kand[0];
      else if (ks.length){
        const k = ks[0], tw = k.steuer, eigeneHaelfte = (ort.x - torX(team)) * richt(team) < HL * .55;
        if (typ === 'freistoss' && eigeneHaelfte && d2(tw.p, ort) < 18) schuetze = tw;   // Torwart schießt selbst
        else {
          const fs = teamSp(team).filter(p => p.rolle !== 'TW' && !menschen().some(q => q.steuer === p)).sort((a, c) => d2(a.p, ort) - d2(c.p, ort))[0];
          if (fs){ schuetze = fs; k.stdTorwart = tw; k.stdSchuetze = fs; k.stdT = 0; k.steuer = fs; k.lade = -1; }
        }
      }
    }
    if (schuetze && schuetze.wartet){ const alt = teamSp(team).filter(p => !p.wartet && p.rolle !== 'TW').sort((a, c) => d2(a.p, ort) - d2(c.p, ort))[0]; if (alt) schuetze = alt; }   // V7.9
    const dir = richt(team);
    s.std = { typ, team, ort: ort.clone(), schuetze, t: 0, ziel: V(dir, 0, 0), elf: elfStoss };
    b.besitzer = null; b.v.set(0, 0, 0); b.p.set(ort.x, BALL_R, ort.z); b.passZiel = null; b.schussVon = null;
    // Schütze hinter den Ball
    const hinter = typ === 'einwurf' ? V(0, 0, Math.sign(ort.z) * (s.halle ? .22 : .55)) : V(-dir * .55, 0, 0);
    schuetze.p.set(ort.x + hinter.x, 0, ort.z + hinter.z); schuetze.v.set(0, 0, 0);
    schuetze.blick.set(-hinter.x, 0, -hinter.z).normalize(); schuetze.grae = 0; schuetze.gefallen = 0;
    if (typ === 'einwurf') s.std.ziel.set(dir * .7, 0, -Math.sign(ort.z) * .7).normalize();
    // Mauer beim Freistoß in Tornähe  (V11.44: bis ca. 32 m vor dem Tor, je nach Entfernung 2–4 Spieler, etwas weiter vom Ball weg)
    if (typ === 'freistoss'){
      const gx = dir * HL, dist = Math.hypot(gx - ort.x, ort.z);
      s.std.ziel.set(gx - ort.x, 0, -ort.z).normalize();
      const mSk = s.halle ? .75 : 1;
      if (dist < 32 * mSk && !s.std.elf){
        const zuTor = s.std.ziel.clone(), quer = V(-zuTor.z, 0, zuTor.x);
        const nM = Math.min(s.halle ? 2 : 4, dist < 19 * mSk ? 4 : dist < 26 * mSk ? 3 : 2), abst = 5.4 * mSk;
        const verteidiger = teamSp(1 - team).filter(p => p.rolle !== 'TW').sort((a, c) => d2(a.p, ort) - d2(c.p, ort)).slice(0, nM);
        verteidiger.forEach((p, i) => {
          const off = (i - (verteidiger.length - 1) / 2) * .78;
          p.mauer = imFeld(V(ort.x + zuTor.x * abst + quer.x * off, 0, ort.z + zuTor.z * abst + quer.z * off));
          p.p.copy(p.mauer); p.v.set(0, 0, 0); p.blick.set(-zuTor.x, 0, -zuTor.z);
        });
        s.std.mauer = verteidiger;
      }
    }
    if (typ === 'anstoss') anstossPositionen(team), schuetze.p.set(-dir * .45, 0, 0), b.p.set(0, BALL_R, 0);
    try { if (!s.gast) trainerStandard(typ, team, schuetze); } catch (e) {}   // V3.0
    const namen = { anstoss: 'ANSTOSS', einwurf: 'EINWURF', ecke: 'ECKE', abstoss: 'ABSTOSS', freistoss: 'FREISTOSS' };
    if (typ === 'ecke') (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('ecke', null);
    if (typ === 'einwurf') (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('einwurf', null);
    if (typ === 'abstoss') (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('abstoss', null);
    if (typ === 'freistoss'){ const torN = Math.abs(ort.x - richt(team) * HL) < 22 && Math.abs(ort.z) < 10; (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(torN ? (Math.random() < .5 ? 'freistoss_gut' : 'mauer') : 'freistoss_ausf', null, torN); }
    if (s.std.elf){   // V3.2: Elfmeter – alle außer Schütze und Torwart raus aus dem Strafraum
      const gx = dir * HL;
      for (const q of aktiv()){ if (q === schuetze || q.rolle === 'TW') continue; if (Math.abs(q.p.x - gx) < STR_T + 1.2 && Math.abs(q.p.z) < STR_B + 1){ q.p.x = gx - dir * (STR_T + 1.6 + Math.random() * 2); q.v.set(0, 0, 0); } }
      const tw = torwartVon(1 - team); if (tw){ tw.p.set(gx - dir * .2, 0, 0); tw.v.set(0, 0, 0); tw.blick.set(-dir, 0, 0); }
    }
    if (typ !== 'anstoss') meldung(s.std.elf ? 'ELFMETER' : namen[typ], team === 0 ? s.land[0] : s.gegner[0], null, 1.2);
    for (const k of menschen()) if (k.team === team){ if ((!k.fest || k.stdSchuetze === schuetze) && !s.fern && k === lokal) k.steuer = schuetze; k.lade = -1; }
    if (lokal.steuer === schuetze){
      zeigeHinweis(typ === 'ecke' ? 'Pfeil = Flugrichtung · Joystick zielt · SCHUSS = hohe Flanke · PASS = normale Flanke' : (typ === 'abstoss' ? 'Joystick zielt · SCHUSS = weiter Abstoß · PASS = kurz abspielen' : typ === 'einwurf' ? 'Joystick zielt · PASS wirft/spielt ab' : 'Joystick zielt · SCHUSS halten = Schuss · PASS = Pass'), 3);
      const eg = $s('eckenGuideHinweis'); if (eg) eg.classList.toggle('zeigen', typ === 'ecke');
    } else {
      const eg = $s('eckenGuideHinweis'); if (eg) eg.classList.remove('zeigen');
    }
  }
  // V2.57: Zielpunkt für Ecken. Der Joystick bestimmt die Richtung, der Zielpunkt
  // wird auf eine sinnvolle Zone im gegnerischen Strafraum begrenzt.
  function eckenZielpunkt(sd){
    const dir = richt(sd.team), o = sd.ort, v = sd.ziel.clone();
    if (v.length() < .2) v.set(-dir, 0, 0);
    v.y = 0; v.normalize();
    const dist = 13.5;
    let tx = o.x + v.x * dist, tz = o.z + v.z * dist;
    // Angriffshälfte: zwischen ca. 3 und 18 m vor dem Tor, quer bis etwas außerhalb des Fünfers.
    tx = klemme(tx * dir, HL - 19, HL - 2.2) * dir;
    tz = klemme(tz, -STR_B - 3.5, STR_B + 3.5);
    return V(tx, 0, tz);
  }

  function eckeAusfuehren(p, kraft, hoch){
    const b = welt.ball, sd = s.std, ziel = eckenZielpunkt(sd);
    const weg = V(ziel.x - b.p.x, 0, ziel.z - b.p.z), dist = Math.max(.5, weg.length());
    const tempo = klemme(11.5 + kraft * 7.5, 11.5, 19);
    const T = flugZeit(dist, tempo);
    b.v.copy(weg.normalize().multiplyScalar(tempo));
    // Deutlich sichtbare Flanke: mehr Kraft = höherer Bogen.
    const zielY = hoch ? 4.0 + kraft * 3.0 : 3.0 + kraft * 2.2;   // V7.6: Ecken höher
    b.v.y = klemme((zielY - BALL_R + .5 * G * T * T) / T, 4.5, 18);
    ballLos(p); b.passZiel = null; b.schussVon = null; b.passVon = p;
    b.flanke = true; b.ausEcke = true; b.schussX0 = b.p.x;
    { const rein = Math.sign(-b.p.z) || 1, dir = richt(p.team); spinSetzen(b, (Math.random() < .55 ? 1 : -1) * rein * dir * (25 + Math.random() * 20), 6); }   // V4.4: Ecke mit Effet (rein- oder rausdrehend)
    pst(p).paesse++;
    musik.sfx && musik.sfx.schuss(.5 + kraft * .35);
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('ecke_ausf', null);
  }

  function zeichneEckenGuide(g){
    const sd = s && s.phase === 'standard' ? s.std : null;
    if (!sd || sd.typ !== 'ecke' || !sd.schuetze || !istMensch(sd.schuetze)) return;
    const start = P(sd.ort.x, .18, sd.ort.z);
    const ziel3 = eckenZielpunkt(sd);
    const ziel = P(ziel3.x, 0.18, ziel3.z);
    const dx = ziel.x - start.x, dy = ziel.y - start.y, len = Math.hypot(dx, dy);
    if (len < 8) return;
    const a = Math.atan2(dy, dx), pulse = .82 + Math.sin(performance.now() * .006) * .08;
    g.save();
    g.globalAlpha = pulse;
    g.strokeStyle = '#ffe234'; g.fillStyle = '#ffe234';
    g.lineWidth = Math.min(7, Math.max(3, .25 * start.s)); g.lineCap = 'round'; g.setLineDash([10, 7]);
    g.beginPath(); g.moveTo(start.x, start.y); g.lineTo(ziel.x, ziel.y); g.stroke(); g.setLineDash([]);
    g.translate(ziel.x, ziel.y); g.rotate(a);
    const hs = Math.min(26, Math.max(10, 1.1 * ziel.s));   // V3.16: Pfeilspitze in Bildschirm-Pixeln begrenzt (war riesig)
    g.beginPath(); g.moveTo(hs, 0); g.lineTo(-hs * .65, -hs * .58); g.lineTo(-hs * .42, 0); g.lineTo(-hs * .65, hs * .58); g.closePath(); g.fill();
    g.restore();
    g.save(); g.globalAlpha = .95; g.strokeStyle = '#ffe234'; g.fillStyle = 'rgba(10,18,51,.72)';
    g.lineWidth = Math.min(4, Math.max(2, .12 * ziel.s)); g.beginPath(); g.arc(ziel.x, ziel.y, Math.min(18, Math.max(7, .8 * ziel.s)), 0, Math.PI * 2); g.fill(); g.stroke();
    g.restore();
  }

  function standardAusfuehren(art, kraft){
    if (s.wStopp) return;   // V7.9
    if (!(kraft >= 0)) kraft = .7;
    const sd = s.std, p = sd.schuetze, b = welt.ball;
    if (s.so && s.so.an && sd.typ === 'freistoss') art = 'schuss';   // V7.9: beim Elfmeterschießen wird immer geschossen
    // Ecken werden für menschliche Schützen direkt auf den gewählten Zielpunkt gespielt,
    // statt blind den nächstbesten Mitspieler anzupassen. Dadurch entspricht die Flugbahn dem Pfeil.
    if (sd.typ === 'ecke' && istMensch(p) && art !== 'pass'){   // V6.0: PASS bei der Ecke = kurzer Pass, FLANKE/SCHUSS = Flanke
      eckeAusfuehren(p, klemme(kraft, .15, 1), art === 'schuss');
      for (const q of s.spieler) q.mauer = null;
      const eg = $s('eckenGuideHinweis'); if (eg) eg.classList.remove('zeigen');
      s.std = null; s.phase = 'spiel';
      return;
    }
    if (sd.typ === 'einwurf') b.p.set(p.p.x, 2.4, Math.sign(sd.ort.z || 1) * (HB - .35)); else b.p.set(sd.ort.x, BALL_R, sd.ort.z);
    if (sd.typ === 'einwurf'){ p.wurf = .45; }
    if (art === 'schuss' && sd.typ !== 'einwurf' && sd.typ !== 'abstoss'){
      if (istMensch(p)) nutzerSchuss(p, kraft, sd.ziel); else kiSchuss(p);
    } else {
      let m = istMensch(p) ? passZiel(p, sd.ziel) : passZiel(p);
      if (sd.typ === 'ecke' && !istMensch(p)){ const im = teamSp(p.team).filter(q => q !== p && q.rolle !== 'TW' && Math.abs(q.p.x - richt(p.team) * HL) < 9); if (im.length) m = im.sort((a, c) => (istMensch(c) - istMensch(a)) || (Math.abs(a.p.z) - Math.abs(c.p.z)))[0]; }
      if (!m) m = teamSp(p.team).find(q => q !== p);
      passen(p, m, (sd.typ === 'ecke' && !(istMensch(p) && art === 'pass')) || (art === 'schuss') || (sd.typ === 'abstoss' && d2(p.p, m.p) > 12));
      if (sd.typ === 'ecke' && !(istMensch(p) && art === 'pass')){ b.flanke = true; b.ausEcke = true; b.v.y = Math.max(b.v.y, 6.5); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('ecke_ausf', null); }
      if (sd.typ === 'einwurf'){ b.v.y = Math.max(b.v.y, 1.5); b.v.multiplyScalar(.9); }
    }
    if (sd.mauer) sd.mauer.forEach(w => { w.sprung = .5; });
    for (const q of s.spieler) q.mauer = null;
    if (sd.typ === 'anstoss') musik.sfx && musik.sfx.pfiff(1);
    if (sd.typ === 'anstoss' && !musik.sprache.spricht()){
      const wt = s.nacht ? 'wetter_nacht' : s.wetter === 'regen' ? 'wetter_regen' : s.wetter === 'schnee' ? 'wetter_schnee' : s.wetter === 'sonne' ? 'wetter_sonne' : null;
      (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(wt && s.tore[0] + s.tore[1] === 0 && !s.wetterGesagt ? wt : 'anstoss', null, true); s.wetterGesagt = true;
    }
    if (sd.typ === 'freistoss') (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(art === 'schuss' ? 'freistoss_schuss' : 'freistoss_ausf', p.name, art === 'schuss');
    s.std = null; s.phase = 'spiel';
  }
  function standardKI(dt){
    const sd = s.std; if (!sd) return;
    if (s.wStopp) return;   // V7.9: Schiri hält das Spiel wegen Auswechslung an
    sd.t += dt;
    // Test-Versionen (großes Feld): bei Ecken und Freistößen warten, bis die Mitspieler stehen (höchstens 3,5 s)
    const bereit = (s.so && s.so.an) || sd.t > 3.5 || sd.typ === 'einwurf' || sd.typ === 'abstoss' || sd.typ === 'anstoss' || !(sd.schuetze && sd.schuetze.fu != null) ||
      teamSp(sd.team).every(q => q === sd.schuetze || q.rolle === 'TW' || d2(q.p, standardZiel(q)) < 2.2);
    if ((!istMensch(sd.schuetze) || autopilot) && sd.t > 1.7 && bereit){
      const gx = richt(sd.team) * HL, dist = Math.hypot(gx - sd.ort.x, sd.ort.z);
      if (sd.typ === 'freistoss' && (sd.elf || (dist < 21 && Math.random() < .75))) standardAusfuehren('schuss');
      else standardAusfuehren('pass');
    }
    // Anstoß des eigenen Teams nach 6 s automatisch
    // Eigener Standard: nach einer Weile automatisch abspielen, damit das Spiel weiterläuft
    const ks = sd && kontrolleVon(sd.schuetze);
    if (sd && s.std === sd && ks && sd.t > (sd.typ === 'anstoss' ? 6 : 9) && ks.lade < 0) standardAusfuehren('pass');
  }
  // =================================================================
  // Eingabe (Touch + Tastatur)
  // =================================================================
  const eingabe = { x: 0, z: 0, sprint: false, schuss: false, tasten: {} };
  // Menschliche Steuerungen: lokal (dieses Gerät) und fern (Mitspieler im Raum)
  const lokal = {
    name: 'lokal', passLade: -1, fest: true,      // true: du steuerst immer deinen gewählten Spieler; false: Steuerung wechselt zum Ballführer
    get steuer(){ return s ? s.steuer : null; }, set steuer(v){ if (s) s.steuer = v; },
    get lade(){ return s ? s.lade : -1; }, set lade(v){ if (s) s.lade = v; },
    get team(){ return s && s.steuer ? s.steuer.team : (s ? s.lokalTeam : 0); },
    richtung(){ return eingabeRichtung(); }, get sprint(){ return eingabe.sprint; }
  };
  const neuerFern = nr => ({
    name: 'fern' + nr, fest: true, steuer: null, lade: -1, team: 1, ein: { x: 0, z: 0, sp: false },
    richtung(){ let x = this.ein.x || 0, z = this.ein.z || 0; const m = Math.hypot(x, z); if (m > 1){ x /= m; z /= m; } return V(x, 0, z); },
    get sprint(){ return !!this.ein.sp; }
  });
  const fernKs = [neuerFern(1), neuerFern(2), neuerFern(3)];     // bis zu 3 Mitspieler (Gäste)
  const menschen = () => (s && s.fern ? [lokal, ...fernKs] : [lokal]).filter(k => k.steuer);
  // Hinweis (z. B. 'FLANKE!') nur für den, der die Taste gedrückt hat: Gastgeber direkt, Gast über den Zustandsabgleich
  let hnId = 0, hnDaten = null, rasenTeile = [];
  function hinweisFuer(k, t, d){
    if (k === lokal){ zeigeHinweis(t, d); return; }
    const nr = fernKs.indexOf(k);
    if (nr >= 0) hnDaten = { id: ++hnId, nr, t, d, zeit: performance.now() };
  }
  // V5.5: Spielerwechsel pro Mensch. Erlaubt nur, wenn kein anderer Mensch im selben Team ist (Gegeneinander) und kein Torwart gesteuert wird.
  const wechselErlaubt = k => k === lokal ? !!(s && s.wechselOK) : !!(s && s.fernWechsel && s.fernWechsel[fernKs.indexOf(k)]);
  function steuerWechsel(k, n){
    const alt = k.steuer; if (!n || n === alt) return;
    if (alt && !k.heim) k.heim = alt;   // V8.5: der im Menü gewählte Spieler, zu dem es nach Aus/Tor zurückgeht
    if (alt && alt.onlineName){
      const nm = alt.onlineName, ia = s.spieler.indexOf(alt), inn = s.spieler.indexOf(n);
      alt.onlineName = ''; n.onlineName = nm;
      mnListe = mnListe.filter(e => e[0] !== ia && e[0] !== inn); mnListe.push([ia, ''], [inn, nm]);
    }
    k.steuer = n; k.lade = -1;
    if (s.andereMenschen){ const ix = s.andereMenschen.indexOf(alt); if (ix >= 0) s.andereMenschen[ix] = n; }   // V6.1: Markierung der Online-Figur wandert mit
    if (s.fernSpieler === alt) s.fernSpieler = n;
  }
  // V8.5: Nach Aus (Einwurf, Ecke, Abstoss, Freistoss, Anstoss) und nach einem Tor steuert jeder Mensch wieder seinen gewählten Spieler.
  function zurueckZumHeimSpieler(){
    if (!s || ALLE_STEUERN) return;
    for (const k of menschen()){
      const h = k.heim; if (!h || h === k.steuer || !h.aktiv || h.rolle === 'TW') continue;
      if (menschen().some(q => q !== k && q.steuer === h)) continue;   // gehoert gerade einem anderen Menschen
      steuerWechsel(k, h);
    }
  }
  const istMensch = p => !!p && menschen().some(k => k.steuer === p && twSteuerbar(p));   // Torwart zählt nur als Mensch, wenn er steuerbar ist
  const kontrolleVon = p => menschen().find(k => k.steuer === p && twSteuerbar(p)) || null;   // Torwart: sonst KI
  const menschImTeam = t => { const k = menschen().find(k => k.team === t); return k ? k.steuer : null; };
  let joyId = null, joyMitte = { x: 0, y: 0 };
  function joystickEinrichten(){
    const zone = $s('joy'), basis = $s('joyBasis'), knauf = $s('joyKnauf');
    const ruhe = () => { const r = zone.getBoundingClientRect(); const W = r.width || innerWidth * .46, H = r.height || innerHeight * .62; basis.style.left = Math.max(100, W * .3) + 'px'; basis.style.top = Math.min(H - 80, H * .62) + 'px'; knauf.style.transform = ''; };
    window.__joyRuhe = ruhe;
    ruhe();
    zone.addEventListener('pointerdown', e => {
      if (joyId !== null) return; joyId = e.pointerId; zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect(); joyMitte = { x: e.clientX, y: e.clientY };
      basis.style.left = (e.clientX - r.left) + 'px'; basis.style.top = (e.clientY - r.top) + 'px';
      e.preventDefault();
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== joyId) return;
      let dx = e.clientX - joyMitte.x, dy = e.clientY - joyMitte.y; const d = Math.hypot(dx, dy), max = 52;
      if (d > max){ dx *= max / d; dy *= max / d; }
      knauf.style.transform = `translate(${dx}px,${dy}px)`;
      eingabe.x = dx / max; eingabe.z = dy / max;
    });
    const los = e => { if (e.pointerId !== joyId) return; joyId = null; eingabe.x = 0; eingabe.z = 0; ruhe(); };
    zone.addEventListener('pointerup', los); zone.addEventListener('pointercancel', los);
    addEventListener('resize', () => { if (joyId === null) ruhe(); });

    const knopf = (id, runter, hoch) => {
      const el = $s(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('gedrueckt'); runter && runter(); });
      const auf = () => { if (!el.classList.contains('gedrueckt')) return; el.classList.remove('gedrueckt'); hoch && hoch(); };
      el.addEventListener('pointerup', auf); el.addEventListener('pointercancel', auf);
    };
    knopf('kSchuss', schussRunter, schussHoch);
    knopf('kPass', passRunter, passHoch);
    knopf('kFlanke', () => flankeRunter(), () => flankeHoch());
    knopf('kSpezial', () => spezialAusloesen(lokal));
    knopf('kSprint', () => eingabe.sprint = true, () => eingabe.sprint = false);
    knopf('kWechsel', () => spielerWechseln());   // V5.1

    addEventListener('keydown', e => {
      if (!laeuft || e.repeat) return;
      eingabe.tasten[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyJ') schussRunter();
      if (e.code === 'KeyK') passRunter();
      if (e.code === 'KeyE') spezialAusloesen(lokal);
      if (e.code === 'KeyU') flankeRunter();   // V7.0 M3
      if (e.code === 'KeyQ') spielerWechseln();   // V5.1
      if (e.code === 'ShiftLeft' || e.code === 'KeyL') eingabe.sprint = true;
      if (e.code === 'Escape' || e.code === 'KeyP') pause(!pausiert);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => {
      eingabe.tasten[e.code] = false;
      if (e.code === 'Space' || e.code === 'KeyJ') schussHoch();
      if (e.code === 'KeyK') passHoch();
      if (e.code === 'KeyU') flankeHoch();
      if (e.code === 'ShiftLeft' || e.code === 'KeyL') eingabe.sprint = false;
    });
  }
  function eingabeRichtung(){
    const t = eingabe.tasten;
    let x = eingabe.x, z = eingabe.z;
    if (t.ArrowLeft || t.KeyA) x = -1; if (t.ArrowRight || t.KeyD) x = 1;
    if (t.ArrowUp || t.KeyW) z = -1; if (t.ArrowDown || t.KeyS) z = 1;
    const m = Math.hypot(x, z); if (m > 1){ x /= m; z /= m; }
    return V(x, 0, z);
  }
  // V5.1: Spielerwechsel im Einzelspieler (nur wenn du einen Feldspieler gewählt hast).
  // Nur eigene Feldspieler sind wählbar – der Torwart wird nie automatisch übernommen.
  // Tipp = Ballführer, sonst Mitspieler, der dem Ball am nächsten ist; mit gehaltenem Joystick/Pfeiltasten = Mitspieler in dieser Richtung.
  // Der bisherige Spieler fällt sofort an die KI zurück, der neue wird über s.steuer menschlich gesteuert (kontrolleVon/istMensch).
  function wechselZiel(richtung, k = lokal){
    const c = k.steuer, b = welt.ball, ref = (c && c.aktiv) ? c.p : b.p;
    const kand = teamSp(c ? c.team : s.lokalTeam).filter(p => p.rolle !== 'TW' && p !== c && !istMensch(p));
    if (!kand.length) return null;
    if (richtung && richtung.length() > .5){
      const r = richtung.clone().normalize(); let best = -1e9, n = null;
      for (const p of kand){
        const dx = p.p.x - ref.x, dz = p.p.z - ref.z, d = Math.hypot(dx, dz) || .01, dot = (dx * r.x + dz * r.z) / d;
        if (dot < .35) continue;
        const w = dot * 2 - d / 25; if (w > best){ best = w; n = p; }
      }
      if (n) return n;
    }
    if (b.besitzer && kand.includes(b.besitzer)) return b.besitzer;
    return kand.slice().sort((a, q) => d2(a.p, b.p) - d2(q.p, b.p))[0];
  }
  function spielerWechseln(k = lokal){
    return;   // V6.3: manueller Wechsel abgeschafft (auch Taste Q und Gast-Anfrage)
    if (!s || !laeuft || pausiert || s.phase !== 'spiel') return;
    if (s.gast && k === lokal){ if (s.wechselOK) NETZ.taste('wx'); return; }   // V5.5: Gast fragt den Gastgeber
    if (!wechselErlaubt(k)) return;
    const n = wechselZiel(k.richtung(), k); if (!n) return;
    steuerWechsel(k, n);
    if (k === lokal) zeigeHinweis(n.name, 1);
  }
  function wechselAuto(k = lokal){ const n = wechselZiel(null, k); if (n) steuerWechsel(k, n); }   // z. B. wenn der gesteuerte Spieler vom Platz fliegt
  function verteidigung(team = lokal.team){ const b = welt.ball; return s.phase === 'spiel' && b.besitzer && b.besitzer.team !== team; }

  // Spezialfähigkeit: lädt sich im Spiel auf, dann 6 Sekunden aktiv (alle freigespielten Fähigkeiten des Spielers)
  function spezialSpieler(k){ if (k === lokal) return s.steuer || s.du; return k.steuer; }   // V5.1: folgt dem gesteuerten Spieler
  function spezialAusloesen(k = lokal){ return;   // V5.0: entfernt
    if (!s || s.phase !== 'spiel') return;
    if (s.gast && k === lokal){ NETZ.taste('sz'); return; }
    const p = spezialSpieler(k); if (!p || !p.spezArten || !p.spezArten.length || p.spezLade < 1) return;
    p.spezLade = 0; p.spezT = 6;
    const namen = p.spezArten.map(a => SPEZIAL[a].icon + ' ' + SPEZIAL[a].name).join('  ');
    zeigeHinweis(namen + '!', 1.6); musik.sfx && musik.sfx.jubel && musik.sfx.pfiff(1);
  }
  // V7.0 M3: FLANKE – hoher Ball dorthin, wohin man schaut (Joystick-Richtung, sonst Blickrichtung).
  // Kurz tippen = kurze, flache Flanke. Länger halten = weiter UND höher (volle Ladung nach ca. 0,8 s).
  // Wer zuerst am Ball ist, köpft (bestehende Kopfball-Logik). Stellschrauben stehen in FLANKE.
  const FLANKE = { distMin: 8, distMax: 38, zeitMin: 1.25, zeitMax: 2.5, ladeZeit: .8 }   // V9.8: Flanke fliegt bis 38 m weit (vorher 22 m) und landet trotz Luftwiderstand genau am Ziel;   // V7.6: höhere Flanken (längere Flugzeit = höherer Bogen);
  function flankeEcke(k){   // V6.0: Ecke - Schütze ist am Ball und es ist eine Ecke
    return !!(s && laeuft && !pausiert && k && k.steuer && s.phase === 'standard' && s.std && s.std.typ === 'ecke' && s.std.schuetze === k.steuer);
  }
  function flankeAbstoss(k){   // V2.05: Torwart darf beim Abstoß auch FLANKE spielen
    return !!(s && laeuft && !pausiert && k && k.steuer && s.phase === 'standard' && s.std && s.std.typ === 'abstoss' && s.std.schuetze === k.steuer);
  }
  function flankeMitBall(k){
    if (flankeEcke(k) || flankeAbstoss(k)) return true;
    if (!s || !laeuft || pausiert || !k || !k.steuer || s.phase !== 'spiel') return false;
    const c = k.steuer, b = welt.ball;
    return (c.rolle !== 'TW' || twAmFuss(c) || twMitBall(c)) && (b.besitzer === c || (!b.besitzer && d2(c.p, b.p) < 1.2 && b.p.y < 1));   // V4.3
  }
  function flankeRunter(k = lokal){
    if (s && s.gast && k === lokal){ k.flLade = 0; k.flStart = performance.now(); return; }
    if (jubelTaste(k, 'siu')) return;
    if (flankeAnfordern(k)) return;   // KI hat den Ball: Flanke anfordern
    if (flankeMitBall(k)) k.flLade = 0;
  }
  function flankeHoch(k = lokal){
    if (k.flLade == null || k.flLade < 0) return;
    const kr = k.flLade; k.flLade = -1;
    if (s && s.gast && k === lokal){ NETZ.taste(performance.now() - (k.flStart || 0) > 350 ? 'fh' : 'fl'); return; }
    flankeKnopf(k, kr);
  }
  // Gemeinsamer Flankenschlag (Mensch und KI): hoher Ball von 'c' zum Punkt 'ziel'; zwei KI-Mitspieler laufen zum Landepunkt
  function flankeSchlag(c, ziel, T, k){
    const b = welt.ball;
    if (!b.besitzer) b.letzter = c;
    const weg = V(ziel.x - b.p.x, 0, ziel.z - b.p.z);
    // V9.8: Luftwiderstand einrechnen, damit die Flanke wirklich bis zum Ziel fliegt (vorher landete sie zu kurz)
    { const dd = Math.hypot(weg.x, weg.z) || 1; let v0 = dd / T;
      for (let i = 0; i < 4; i++){ const kk = PH_KD * cdVon(v0); v0 = kk * dd < 1e-4 ? dd / T : (Math.exp(kk * dd) - 1) / (kk * T); }
      b.v.copy(weg.multiplyScalar(v0 / dd)); }
    b.v.y = klemme((1.5 - BALL_R + .5 * G * T * T) / T * 1.06, 4, 20);
    ballLos(c); b.passZiel = null; b.schussVon = null; b.passVon = c;
    b.flanke = true; b.ausEcke = false; b.schussX0 = b.p.x;
    pst(c).paesse++;
    if (ziel.x * richt(c.team) > 0){
      let n = 0;
      for (const m of teamSp(c.team).filter(q => q !== c && q.rolle !== 'TW' && !istMensch(q)).sort((a, q) => d2(a.p, ziel) - d2(q.p, ziel))){
        if (n >= 2) break;
        m.raumZiel = imFeld(V(ziel.x, 0, klemme(ziel.z + (n === 0 ? 0 : (ziel.z > 0 ? -2.6 : 2.6)), -HB + 1, HB - 1))); m.raumT = T + .8; n++;
      }
    }
    if (k) hinweisFuer(k, 'FLANKE!', .9);
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('pass', c.name);
    musik.sfx && musik.sfx.schuss(.5);
  }
  // V6.0: FLANKE anfordern - hat ein KI-Mitspieler den Ball, versucht er jetzt eine Flanke (wie PASS-Anforderung beim Pass)
  function flankeAnfordern(k){
    if (!s || !laeuft || pausiert || !k || !k.steuer || s.phase !== 'spiel') return false;
    const c = k.steuer, b = welt.ball, h = b.besitzer;
    if (!h || h === c || h.team !== c.team || istMensch(h) || h.rolle === 'TW' || c.rolle === 'TW') return false;
    const dir = richt(c.team), gx = dir * HL;
    // Ziel: immer in Richtung des angeforderten Spielers (mit leichtem Vorhalt), egal in welcher Spielfeldhälfte
    k.steuer = c;   // du bleibst der aktive Spieler
    const zeitFuer = d => klemme(FLANKE.zeitMin + (d - FLANKE.distMin) / (FLANKE.distMax - FLANKE.distMin) * (FLANKE.zeitMax - FLANKE.zeitMin), FLANKE.zeitMin, FLANKE.zeitMax);
    const zielBei = t => V(klemme(c.p.x + c.v.x * t, -HL + 1, HL - 1), 0, klemme(c.p.z + c.v.z * t, -HB + 1, HB - 1));
    // Vorhalt = Flugzeit des Balls, damit die Flanke dort ankommt, wo du in diesem Moment bist
    let ziel = zielBei(.5), T = zeitFuer(d2(h.p, ziel));
    ziel = zielBei(T); T = zeitFuer(d2(h.p, ziel));
    flankeSchlag(h, ziel, T, k);
    return true;
  }
  function flankeKnopf(k = lokal, kraft = .5){
    if (jubelTaste(k, 'siu')) return;
    if (flankeAnfordern(k)) return;
    if (!flankeMitBall(k)) return;
    const c = k.steuer, b = welt.ball, r = k.richtung();
    if (flankeEcke(k)){   // Ecke: Joystick (sonst Blickrichtung) bestimmt das Ziel, Haltezeit die Höhe
      s.std.ziel.copy(r.length() > .3 ? r.clone().normalize() : c.blick.clone());
      standardAusfuehren('schuss', klemme(kraft, .15, 1)); return;
    }
    const ri = r.length() > .3 ? r.clone().normalize() : c.blick.clone();
    ri.y = 0; if (ri.length() < .1) ri.set(richt(c.team), 0, 0); ri.normalize();
    kraft = klemme(kraft, 0, 1);
    if (flankeAbstoss(k)){ s.std.ziel.copy(ri); standardAusfuehren('pass', kraft); if (s.phase !== 'spiel') return; }   // V2.05: Abstoß als hohe Flanke
    const dist = FLANKE.distMin + (FLANKE.distMax - FLANKE.distMin) * kraft;
    if (c.rolle === 'TW' && b.besitzer === c){ b.p.set(c.p.x + ri.x * .45, 1.05, c.p.z + ri.z * .45); b.ausT = .1; }   // V2.05: Flanke aus der Hand wie beim Abwurf vor dem Torwart starten
    const ziel = V(klemme(b.p.x + ri.x * dist, -HL + 1, HL - 1), 0, klemme(b.p.z + ri.z * dist, -HB + 1, HB - 1));
    flankeSchlag(c, ziel, FLANKE.zeitMin + (FLANKE.zeitMax - FLANKE.zeitMin) * kraft, k);
  }
  function schussRunter(k = lokal){
    if (s && s.gast && k === lokal){ NETZ.taste('sR'); s.lade = 0; return; }
    if (jubelTaste(k, 'faust')) return;
    if (!laeuft || pausiert || !k.steuer) return;
    const c = k.steuer, b = welt.ball;
    if (c.rolle === 'TW' && !twSteuerbar(c)) return;   // Torwart nur mit Ball in der Hand / beim Abstoß steuerbar, sonst KI   // V4.3
    if (s.phase === 'standard' && s.std && s.std.schuetze === c){ k.lade = 0; return; }
    if (s.phase !== 'spiel') return;
    if (b.besitzer === c || (!b.besitzer && d2(c.p, b.p) < 1.3)){ k.lade = 0; return; }
    if (b.besitzer && b.besitzer.team === c.team && !istMensch(b.besitzer)){
      // Schuss anfordern: der KI-Mitspieler mit Ball zieht ab
      const kiSp = b.besitzer; kiSchuss(kiSp); if (k === lokal) zeigeHinweis('Schuss!', 1); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('schuss_anfordern', kiSp.name, true); return;   // V3.16: Besitzer vorher merken (nach dem Schuss ist er null)
    }
    if (verteidigung(c.team) || !b.besitzer) grae(c);
  }
  function schussHoch(k = lokal){
    if (s && s.gast && k === lokal){ if (s.lade >= 0) NETZ.taste('sH'); s.lade = -1; return; }
    if (s && k && k.steuer && k.steuer.rolle === 'TW' && !twAmFuss(k.steuer) && !twMitBall(k.steuer)){ k.lade = -1; return; }   // V4.3
    if (s == null || k.lade < 0) return;
    const kraft = klemme(k.lade, .15, 1); k.lade = -1;
    const c = k.steuer, b = welt.ball, r = k.richtung(), ziel = r.length() > .3 ? r.normalize() : c.blick.clone();
    if (s.phase === 'standard' && s.std && s.std.schuetze === c){ s.std.ziel.copy(ziel); standardAusfuehren('schuss', kraft); return; }
    if (s.phase !== 'spiel') return;
    if (b.besitzer === c || (!b.besitzer && d2(c.p, b.p) < 1.4 && b.p.y < 1.2)){
      if (!b.besitzer) b.letzter = c;
      // V4.3: Torwart schießt den Ball weit nach vorne (Abschlag) – wie ein langer Ball eines Feldspielers
      if (c.rolle === 'TW' && Math.abs(c.p.x - richt(c.team) * HL) > 30){ const m = passZiel(c, ziel); if (m){ passen(c, m, true, kraft); zeigeHinweis('ABSCHLAG!'); } return; }
      // Schuss Richtung gegnerisches Tor, sonst weiter Ball in Laufrichtung
      nutzerSchuss(c, kraft, ziel);   // V9.3: SCHUSS geht immer aufs Tor (auch Weitschuss, auch wenn der Stick woanders hin zeigt)
    }
  }
  // V5.4: PASS gedrückt halten = stärkerer Pass (nur mit Ball im laufenden Spiel). Kurzes Tippen = normaler Pass wie bisher.
  function passMitBall(k){
    if (!s || !laeuft || pausiert || !k.steuer || s.phase !== 'spiel') return false;
    const c = k.steuer, b = welt.ball;
    return (c.rolle !== 'TW' || twAmFuss(c)) && (b.besitzer === c || (!b.besitzer && d2(c.p, b.p) < 1.2 && b.p.y < 1));   // V4.3
  }
  function passRunter(k = lokal){
    if (s && s.gast) { passKnopf(k); return; }
    if (passMitBall(k)){ k.passLade = 0; return; }
    passKnopf(k);
  }
  function passHoch(k = lokal){
    if (k.passLade < 0) return;
    const kr = k.passLade; k.passLade = -1;
    if (passMitBall(k)) passKnopf(k, kr < .2 ? 0 : kr);
  }
  // V5.7: Wechsel im PASS-/TACKLE-Knopf. Joystick gehalten = Mitspieler in dieser Richtung, sonst der Mitspieler, der naeher am Ball ist.
  // V8.4: EINE gemeinsame Bedingung fuer Anzeige UND Wechsel: Die Taste wechselt nur, wenn sie WECHSEL anzeigt.
  // Bedingung: dein Spieler ist mehr als 11 m vom Ball weg, hat den Ball nicht, und ein freier Feldspieler ist deutlich naeher am Ball.
  function wechselMoeglich(k){
    const c = k && k.steuer;
    if (!c || !s || !c.aktiv || c.rolle === 'TW' || s.phase !== 'spiel' || !wechselErlaubt(k)) return false;
    const b = welt.ball; if (b.besitzer === c) return false;
    const mein = d2(c.p, b.p); if (mein < (ALLE_STEUERN ? 3 : 11)) return false;
    return teamSp(c.team).some(p => p !== c && p.rolle !== 'TW' && !istMensch(p) && d2(p.p, b.p) < mein - 3);
  }
  function passWechsel(k){
    if (!wechselMoeglich(k)) return false;
    const jetzt = performance.now(); if (k.wechselSperre && jetzt < k.wechselSperre) return false;
    const n = wechselZiel(k.richtung(), k); if (!n) return false;
    k.wechselSperre = jetzt + 500;
    steuerWechsel(k, n);
    if (k === lokal) zeigeHinweis(n.name, 1);
    return true;
  }
  function passKnopf(k = lokal, kraft = 0){
    if (s && s.gast && k === lokal){ NETZ.taste('pa'); return; }
    if (jubelTaste(k, 'umarmen')) return;
    if (!laeuft || pausiert || !k.steuer) return;
    const c = k.steuer, b = welt.ball, r = k.richtung();
    if (c.rolle === 'TW' && !twSteuerbar(c)) return; if (c.rolle === 'TW' && !twAmFuss(c)){ torwartAbwurf(k); return; }   // V4.3: am Fuß / außerhalb des 16ers normaler Pass
    const richtung = r.length() > .3 ? r.normalize() : c.blick.clone();
    if (s.phase === 'standard' && s.std && s.std.schuetze === c){ s.std.ziel.copy(richtung); standardAusfuehren('pass'); return; }
    if (s.phase !== 'spiel') return;
    if (passWechsel(k)) return;   // V8.4: nur wenn die Taste WECHSEL zeigt
    if (b.besitzer === c || (!b.besitzer && d2(c.p, b.p) < 1.2 && b.p.y < 1)){
      const m = passZiel(c, richtung); if (m){ if (!b.besitzer) b.letzter = c; passen(c, m, false, kraft); }
      return;
    }
    if (b.besitzer && b.besitzer.team === c.team && b.besitzer !== c){
      // Pass anfordern: Mitspieler mit Ball spielt zu dir
      if (!istMensch(b.besitzer)){ passen(b.besitzer, c, d2(b.besitzer.p, c.p) > 13); if (k === lokal) zeigeHinweis('Pass!'); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('pass_anfordern', c.name); }
      k.steuer = c; return;
    }
    // Verteidigung: normaler Zweikampf (Tackling) – kurzer Ausfallschritt zum Ball
    if (b.besitzer && b.besitzer.team !== c.team){
      if (c.sperre > .2 || c.tackleT > 0) return;
      if (d2(c.p, b.besitzer.p) > (ALLE_STEUERN ? 3 : 11) && passWechsel(k)) return;   // V8.3: Wechsel erst ab 11 m (alle steuern: ab 3 m)
      const h = b.besitzer, weg = V(h.p.x - c.p.x, 0, h.p.z - c.p.z), d = weg.length();
      if (d < 2.6){ weg.normalize(); c.blick.copy(weg); c.v.set(weg.x * 6.5, 0, weg.z * 6.5); }
      c.tackleT = .32;
      return;
    }
    if (!b.besitzer && d2(c.p, b.p) > (ALLE_STEUERN ? 3 : 11) && passWechsel(k)) return;   // V8.3: Wechsel erst ab 11 m
    if (k.fest || s.fern) return;
    let n = naechster(c.team, b.p, c) || torwartVon(c.team);
    if (n && istMensch(n)) n = null;
    if (n){ k.steuer = n; }
  }

  // =================================================================
  // Hauptschleife
  // =================================================================
  let zuletzt = 0, tempoFaktor = 1, autopilot = false;
  // ---------- Torwiederholung: die letzten Sekunden werden laufend mitgeschnitten ----------
  let aufnahmeUhr = 0; const aufnahme = [];
  function aufnehmen(dt){
    aufnahmeUhr += dt;
    if (aufnahme.length && aufnahmeUhr - aufnahme[aufnahme.length - 1].t < 1 / 30) return;
    const b = welt.ball;
    aufnahme.push({ t: aufnahmeUhr,
      pl: s.spieler.map(p => [p.p.x, p.p.z, p.v.x, p.v.z, p.blick.x, p.blick.z, p.grae, p.gefallen, p.hecht || 0, p.hechtSeite || 0, p.jubel, p.sprung, p.aktiv ? 1 : 0]),
      b: [b.p.x, b.p.y, b.p.z, b.v.x, b.v.y, b.v.z, b.rot], bo: b.besitzer ? s.spieler.indexOf(b.besitzer) : -1, sv: b.schussVon ? 1 : 0 });
    while (aufnahme.length && aufnahme[0].t < aufnahmeUhr - 7) aufnahme.shift();
  }
  function wdhAnzeige(an){ const el = document.getElementById('wdhLabel'); if (el && el.hidden === !!an) el.hidden = !an; const sk = document.getElementById('wdhSkip'); if (sk) sk.hidden = !an || !!(s && s.gast); const sp = document.getElementById('spiel'); if (sp) sp.classList.toggle('replay', !!an); }
  function wdhStarten(){
    const plan = s.wdhPlan; s.wdhPlan = null;
    const fr = aufnahme.filter(f => f.t >= plan.t - 3.4 && f.t <= plan.t + .9);
    if (fr.length < 12) return false;
    s.wdh = { fr, uhr: fr[0].t, ende: fr[fr.length - 1].t, i: 0, aktiv: s.spieler.map(p => p.aktiv) };
    s.phase = 'wiederholung'; welt.ball.spurPunkte.length = 0;
    wdhAnzeige(true);
    return true;
  }
  function wdhSchritt(dt){
    const w = s.wdh; if (!w) return;
    w.uhr += dt * .6;
    if (w.uhr >= w.ende) return wdhEnde();
    while (w.i < w.fr.length - 2 && w.fr[w.i + 1].t <= w.uhr) w.i++;
    const A = w.fr[w.i], B = w.fr[w.i + 1], a = klemme((w.uhr - A.t) / Math.max(1e-4, B.t - A.t), 0, 1), L = (x, y) => x + (y - x) * a;
    A.pl.forEach((d, k) => {
      const p = s.spieler[k], e = B.pl[k]; if (!p || !e) return;
      p.p.x = L(d[0], e[0]); p.p.z = L(d[1], e[1]); p.v.set(L(d[2], e[2]) * .6, 0, L(d[3], e[3]) * .6);
      if (e[4] || e[5]) p.blick.set(e[4], 0, e[5]);
      p.grae = d[6]; p.gefallen = d[7]; p.hecht = d[8]; p.hechtSeite = d[9]; p.jubel = d[10]; p.sprung = d[11];
      const akt = !!d[12]; if (p.aktiv !== akt){ p.aktiv = akt; p.gruppe.visible = akt; }
    });
    const b = welt.ball, q = A.b, u = B.b;
    b.p.set(L(q[0], u[0]), L(q[1], u[1]), L(q[2], u[2])); b.v.set(L(q[3], u[3]), L(q[4], u[4]), L(q[5], u[5])); b.rot = L(q[6], u[6]);
    b.besitzer = A.bo >= 0 ? s.spieler[A.bo] : null; b.schussVon = A.sv ? true : null;
    for (const n of welt.tore) aktualisiereNetz(n, dt);
    if (Math.abs(b.p.x) > HL + .3 && Math.abs(b.p.z) < TB && b.p.y < TH){ const netz = welt.tore[b.p.x > 0 ? 1 : 0]; netzStoss(netz, b.p.z, b.p.y, Math.abs(b.v.x) * .02); }
  }
  function wdhEnde(){
    const w = s.wdh; if (!w) return;
    s.wdh = null; wdhAnzeige(false); jubelEnde();
    s.spieler.forEach((p, k) => { p.aktiv = w.aktiv[k]; p.gruppe.visible = p.aktiv; p.jubel = 0; p.gefallen = 0; p.hecht = 0; p.grae = 0; p.sprung = 0; p.v.set(0, 0, 0); });
    const b = welt.ball; b.besitzer = null; b.schussVon = null; b.spurPunkte.length = 0;
    s.phase = 'tor';
    standard('anstoss', s.naechsterAnstoss, V());
  }
  // V2.73: feste Grafikprofile + automatische Feinabsenkung innerhalb des Profils.
  // LOW ist für ältere Smartphones optimiert; HIGH nutzt bewusst höhere Canvas-Auflösung.
  const grafik = { modus: (function(){ let m = null; try { m = LS81.getItem('silescrowGrafik'); } catch (e) {}
    if (!m || m === 'auto'){ m = 'high'; try { LS81.setItem('silescrowGrafik', m); } catch (e) {} }   // V9.1: erster Start (und frühere AUTO-Nutzer) immer auf MITTEL
    return m; })() };   // V9.1: kein AUTO mehr   // V5.0: AUTO ist Standard   // V3.16: kein Absturz, wenn der Browser Speicher sperrt
  const GRAFIK = {
    // V5.5: feste Bildhöhe (480p / 540p / 720p / 1080p) – auf jedem Gerät gleich; bei zu wenig FPS stufenweise niedriger
    low:    { hoehe: 480,  auto: [1, .9, .8, .72, .65], wetter: false, licht: false, schatten: false, spur: false, text: 'Niedrig: maximale Leistung, reduzierte Effekte.' },
    medium: { hoehe: 540,  auto: [1, .9, .8, .72, .65], wetter: true,  licht: true,  schatten: true,  spur: true,  text: 'Mittel: ausgewogen, alle Effekte, für ältere Handys.' },
    high:   { hoehe: 720,  auto: [1, .88, .76, .66, .56], wetter: true,  licht: true,  schatten: true,  spur: true,  text: 'Hoch: scharf und flüssig, für die meisten Handys.' },
    ultra:  { hoehe: 1080, auto: [1, .86, .74, .64, .54], wetter: true,  licht: true,  schatten: true,  spur: true,  text: 'Ultra: volle Schärfe – nur für starke Handys.' },
    // V5.0: AUTO – eine durchgehende Leiter von 1080p bis 312p; Startpunkt aus dem Leistungstest im Ladebildschirm, im Spiel jede Sekunde nachgeregelt
    auto:   { hoehe: 1080, auto: [1, .833, .667, .574, .5, .444, .389, .333, .289], wetter: true, licht: true, schatten: true, spur: true, text: 'Auto: das Spiel misst dein Handy und wählt selbst die beste Einstellung.' }
  };
  const fps = { summe: 0, n: 0, stufe: 0, arbeit: 0, ruhe: 0, not: 0 };   // V5.2: not = Notbremse unter 40 FPS (gilt für jede Grafikeinstellung)
  const NOT_FAKTOR = [1, .85, .72, .6, .5, .42];
  const autoStart = () => { let st = null; try { st = LS81.getItem('sc_auto_stufe'); } catch (e) {} const l = window.LEISTUNG; return st != null && st !== '' ? Math.max(0, Math.min(8, +st)) : (l && l.stufe != null ? l.stufe : 3); };
  if (grafik.modus === 'auto') fps.stufe = autoStart();
  // Ziel-FPS: 60 – auf 90/120-Hz-Displays 90 (bzw. bis 85 bei 90 Hz)
  const zielMs = () => { const hz = (window.LEISTUNG && window.LEISTUNG.hz) || 60; return 1000 / (hz >= 100 ? 90 : hz >= 85 ? 85 : 60); };   // V6.3: arbeit = Rechenzeit pro Bild, ruhe = Wartezeit nach einer Änderung
  function grafikProfil(){ const pr = GRAFIK[grafik.modus] || GRAFIK.medium; return pr; }
  function grafikDpr(){ const pr = grafikProfil(), kurz = Math.max(1, Math.min(innerWidth, innerHeight)); return pr.hoehe / kurz * pr.auto[Math.min(fps.stufe, pr.auto.length - 1)] * NOT_FAKTOR[Math.min(fps.not, NOT_FAKTOR.length - 1)]; }
  function grafikEffekt(name){
    // V6.3: wenn 60 FPS sonst nicht zu halten sind, fallen zuerst Spur/Schatten, dann Wetter/Licht weg
    const auto = grafik.modus === 'auto';
    if (fps.not > 0 && (name === 'spur' || name === 'schatten' || name === 'wetter' || name === 'licht')) return false;   // V5.2: Notbremse
    if (fps.stufe >= (auto ? 6 : 3) && (name === 'spur' || name === 'schatten')) return false;
    if (fps.stufe >= (auto ? 7 : 4) && (name === 'wetter' || name === 'licht')) return false;
    return !!grafikProfil()[name];
  }
  function grafikUI(){
    const ueber = document.getElementById('grafikUeber');
    if (!ueber) return;
    ueber.querySelectorAll('[data-grafik]').forEach(b => b.classList.toggle('an', b.dataset.grafik === grafik.modus));
    const h = document.getElementById('grafikHinweis');
    if (h) h.textContent = grafikProfil().text + (grafik.modus === 'auto' ? ' Gerade: ' + Math.round(grafikProfil().hoehe * grafikProfil().auto[Math.min(fps.stufe, 8)]) + 'p' + (window.LEISTUNG ? ' · Display ' + window.LEISTUNG.hz + ' Hz' : '') + '.' : '');
    const sp = document.getElementById('spiel');
    if (sp) sp.classList.toggle('grafik-low', grafik.modus === 'low');
  }
  function grafikSetzen(modus){
    if (!GRAFIK[modus]) return;
    grafik.modus = modus; fps.stufe = modus === 'auto' ? autoStart() : 0; fps.not = 0; fps.summe = 0; fps.n = 0; fps.arbeit = 0; fps.ruhe = 0;
    try { LS81.setItem('silescrowGrafik', modus); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    grafikUI();
    dispatchEvent(new Event('resize'));
  }
  function grafikOeffnen(an){
    const ueber = document.getElementById('grafikUeber');
    if (!ueber) return;
    { const v = document.getElementById('grafikVerlassen'); if (v) v.hidden = !(an && s && laeuft && (s.gast || (s.optionen && (s.optionen.fern || s.optionen.modus)))); }   // V9.1
    if (an) grafikUI();
    ueber.hidden = !an;
  }
  // V6.3: Ziel = mindestens 60 FPS. Alle 60 Bilder wird geprüft:
  //  - unter ca. 57 FPS → eine Stufe einfacher (niedrigere Auflösung, ab Stufe 3/4 weniger Effekte)
  //  - stabil 60 FPS und viel Luft bei der Rechenzeit → eine Stufe zurück nach oben
  //  Nach jeder Änderung 2 Sekunden Ruhe, damit es nicht hin- und herspringt.
  function fpsPruefen(ms){
    if (ms > 250) return;
    fps.summe += ms; fps.n++;
    if (fps.n < 60 && fps.summe < 1000) return;   // alle 60 Bilder bzw. spätestens jede Sekunde
    const mittel = fps.summe / fps.n, arbeit = fps.arbeit / fps.n; fps.summe = 0; fps.n = 0; fps.arbeit = 0;
    fps.letzteArbeit = fps.letzteArbeit ? fps.letzteArbeit * .5 + arbeit * .5 : arbeit;   // V5.5: für die Anzeige „möglich“
    const jetzt = performance.now(); if (jetzt < fps.ruhe) return;
    if (grafik.modus !== 'low'){ if (fps.stufe || fps.not){ fps.stufe = 0; fps.not = 0; dispatchEvent(new Event('resize')); } return; }   // V9.1: MITTEL/HOCH/ULTRA immer volle Qualität – nur NIEDRIG regelt nach
    const max = grafikProfil().auto.length - 1, alt = fps.stufe, altNot = fps.not, auto = grafik.modus === 'auto', z = auto ? zielMs() : 16.7;
    // V5.2: Notbremse – fällt das Spiel unter ca. 42 FPS, wird (in jeder Einstellung) sofort weiter abgesenkt, bis es wieder flüssig ist
    if (mittel > 23.5 && (fps.stufe >= max || !auto) && fps.not < NOT_FAKTOR.length - 1){ fps.not++; if (auto && fps.stufe < max) fps.stufe++; }
    else if (mittel > z * 1.05 + .3 && fps.stufe < max) fps.stufe++;
    else if (fps.not > 0 && mittel < 18.5 && arbeit < 9) fps.not--;
    else if (mittel < z * 1.03 && arbeit < z * .36 && fps.stufe > 0) fps.stufe--;
    if (altNot !== fps.not){ fps.ruhe = jetzt + (fps.not > altNot ? 1000 : 6000); dispatchEvent(new Event('resize')); return; }
    if (alt !== fps.stufe){ fps.ruhe = jetzt + (fps.stufe > alt ? 1500 : 5000); dispatchEvent(new Event('resize')); if (auto) try { LS81.setItem('sc_auto_stufe', String(fps.stufe)); } catch (e) {} }   // nach oben vorsichtiger, damit nichts flackert
  }
  function schleife(t){
    // V3.0 STABILITÄTSFIX: nach dem Abpfiff keine endlose RAF-Kette mehr.
    if (!laeuft){ rafId = 0; return; }
    rafId = requestAnimationFrame(schleife);
    const t0 = performance.now();
    try { schleifeKern(t); } catch (e) { schleifeFehler(e); }
    fps.arbeit += performance.now() - t0;   // V6.3: Rechenzeit pro Bild
  }
  // V3.16: Fehler in einem Einzelbild werden gemeldet, das Spiel läuft weiter
  let _sfLetzter = 0;
  function schleifeFehler(e){
    const n = Date.now(); console.error(e);
    if (n - _sfLetzter < 2000) return;
    _sfLetzter = n;
    try { dispatchEvent(new ErrorEvent('error', { message: 'Spielschleife: ' + (e && e.message ? e.message : e), lineno: 0, colno: 0 })); } catch(x){typeof __scWarn==='function'&&__scWarn(x)}
  }
  function schleifeKern(t){
    if (zuletzt) fpsPruefen(t - zuletzt);
    const dt = Math.min(.05, (t - (zuletzt || t)) / 1000) * tempoFaktor; zuletzt = t;
    if (s && s.gast && laeuft){ gastSchritt(dt); }
    else if (!pausiert && laeuft && s && s.phase === 'wiederholung'){ wdhSchritt(dt); }
    else if (!pausiert && laeuft && s){
      const n = Math.max(1, Math.ceil(dt / .02));
      for (let i = 0; i < n && laeuft; i++) schritt(dt / n);
      if (laeuft && s.phase !== 'wiederholung') aufnehmen(dt);
    }
    // ende() kann innerhalb von schritt() laeuft=false setzen. Dann nicht mehr
    // in Rendering/Netzwerk auf den alten Spielzustand zugreifen.
    if (!laeuft || !s){ rafId = 0; return; }
    darstellen(dt);
    { const kino = !!(s && (s.phase === 'tor' || s.phase === 'wiederholung' || s.phase === 'ausklang' || s.phase === 'presse' || s.phase === 'trage')), sp = document.getElementById('spiel'); if (sp && sp.classList.contains('kino') !== kino) sp.classList.toggle('kino', kino); if (sp) sp.classList.toggle('ausklangAn', !!(s && s.phase === 'ausklang')); }
    if (s && s.fern) sendeZustand();
  }

  function alleSteuernSchritt(){
    if (!ALLE_STEUERN || s.phase !== 'spiel' || s.gast) return;
    const b = welt.ball, jetzt = performance.now();
    for (const k of menschen()){   // V9.2: auch online für jeden Menschen, der allein im Team ist
      if (s.fern && !wechselErlaubt(k)) continue;
      const c = k.steuer; if (!c || !c.aktiv || c.rolle === 'TW') continue;
      if (k.autoT && jetzt < k.autoT) continue;
      if (b.besitzer && b.besitzer.team === c.team) continue;               // eigener Ballbesitz: Wechsel passiert bei der Ballannahme
      if (!b.besitzer && b.letzteTeam === c.team && b.v.length() > 6) continue;   // eigener Pass unterwegs
      if (c.tackleT > 0 || c.grae > 0) continue;
      const kand = teamSp(c.team).filter(p => p !== c && p.rolle !== 'TW' && !istMensch(p));
      if (!kand.length) continue;
      const n = kand.sort((a, q) => d2(a.p, b.p) - d2(q.p, b.p))[0];
      const dn = d2(n.p, b.p), dc = d2(c.p, b.p);
      // V9.2: schneller umschalten, größerer Umkreis: schon wechseln, wenn ein Mitspieler 2 m näher ist (vorher 4 m)
      if (dn < dc - 2 || (dc > 14 && dn < dc * .8)){ steuerWechsel(k, n); k.autoT = jetzt + 320; }
    }
  }
  // V9.2: Spielunterbrechung wie im echten Spiel (Abpfiff nach 90, Halbzeit der Verlängerung bei 105, Abpfiff nach 120) – Spiel ruht, dann geht es weiter
  function unterbrechung(titel, text, dauer, pfiffe, weiter){
    const b = welt.ball;
    s.phase = 'unterbr'; s.unterbr = { t: dauer, weiter }; s.std = null; s.ns = null;
    b.besitzer = null; b.v.set(0, 0, 0); b.p.y = BALL_R; b.flanke = false; b.ausEcke = false; b.passZiel = null; b.schussVon = null;
    for (const p of s.spieler){ p.v.set(0, 0, 0); p.grae = 0; p.spezT = 0; }
    try { musik.sfx && musik.sfx.pfiff(pfiffe); } catch (e) {}
    meldung(titel, text, null, Math.max(2, dauer - .6));
  }
  function unterbrSchritt(dt){
    const u = s.unterbr; if (!u){ s.phase = 'spiel'; return; }
    for (const p of s.spieler) if (p.aktiv){ p.v.multiplyScalar(Math.max(0, 1 - dt * 6)); }
    if (s.gast) return;
    u.t -= dt;
    if (u.t <= 0){ s.unterbr = null; s.phase = 'spiel'; u.weiter(); }
  }
  function schritt(dt){
    const b = welt.ball, c = s.steuer;
    if (s.phase === 'unterbr'){ unterbrSchritt(dt); return; }
    try { alleSteuernSchritt(); } catch (e) {}
    if (s.phase === 'ausklang'){ ausklangSchritt(dt); return; }   // V6.2
    if (s.phase === 'presse'){ presseSchritt(dt); return; }   // V5.3
    if (s.phase === 'hzGang'){ hzGangSchritt(dt); return; }   // V3.0
    try { altBallSchritt(dt); } catch (e) { s.ballAlt = null; }
    if (s.kiWechselT > 0) s.kiWechselT -= dt;
    try { trainerSchritt(dt); } catch (e) {}
    try { wechselTippPruefen(dt); } catch (e) {}
    // V3.0: nach der Standard-Ausführung wieder in den eigenen Torwart zurück
    if (lokal.stdSchuetze && s.phase !== 'standard'){
      lokal.stdT = (lokal.stdT || 0) + dt;
      if ((welt.ball.besitzer !== lokal.stdSchuetze && lokal.stdT > .4) || lokal.stdT > 6){
        const tw = lokal.stdTorwart; lokal.stdSchuetze = lokal.stdTorwart = null;
        if (tw && tw.aktiv && s.steuer && s.steuer.rolle !== 'TW') { s.steuer = tw; s.lade = -1; }
      }
    }
    // Phasen
    if (s.so && s.so.an){ if (s.phase === 'spiel') soSpielSchritt(dt); }   // V7.9: Elfmeterschießen auf dem Platz
    else if (s.phase === 'spiel' && s.ns){
      // V6.2: Nachspielzeit läuft (1 Spielminute = 2 echte Sekunden). Die letzte Aktion (Ecke, Freistoß, Angriff am Strafraum) darf noch zu Ende gespielt werden.
      s.ns.t += dt;
      if (!s.gast && s.ns.t >= s.ns.min * (SPIELZEIT / 90)){
        const b = welt.ball, aktion = !!s.std || (b && b.p && Math.abs(b.p.x) > L / 2 - 20);
        if (aktion && s.ns.warte < 5) s.ns.warte += dt;
        else {
          const h = s.ns.halb; s.ns = null;
          if (h === 0) return halbzeit();
          if (h === 2 && !s.halle) return unterbrechung('HALBZEIT', 'Verlängerung · Seitenwechsel', 2.6, 2, verlaengerungHalbzeit);   // V9.2   // V7.9
          if (h === 3 || (h === 2 && s.halle)){ (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('verl_ende', null, true); if (s.tore[0] === s.tore[1]) return unterbrechung('ABPFIFF', 'Unentschieden nach 120 Minuten – Elfmeterschießen!', 3, 3, elfmeterschiessenStart); return ende(); }   // V9.2
          if (s.optionen && s.optionen.htSpiel){ if (s.tore[0] === s.tore[1] && s.optionen.htKO) return unterbrechung('ABPFIFF', 'Unentschieden – direkt ins Elfmeterschießen!', 3, 3, elfmeterschiessenStart); return ende(); }   // HALLENTURNIER: Gruppe = Remis möglich, K.-o. = sofort Elfmeter
          if (s.tore[0] === s.tore[1] && !(s.optionen && s.optionen.liga)) return unterbrechung('ABPFIFF', 'Unentschieden – gleich geht es in die Verlängerung', 3.2, 3, verlaengerungStart);   // V9.2
          return ende();
        }
      }
    } else if (s.phase === 'spiel'){
      const vor = s.zeit; s.zeit -= dt;
      if (s.zeit <= 0 && !s.verlaengerung && !s.nsFertig1){ s.zeit = 0; s.nsFertig1 = true; nachspielStart(1); return; }   // V6.2
      if (s.zeit <= 0){
        s.zeit = 0;
        if (s.verlaengerung){
          const hv = s.vHalb || 0; if (!s.nsFertigV) s.nsFertigV = [false, false];
          if (!s.gast && !s.nsFertigV[hv]){ s.nsFertigV[hv] = true; nachspielStart(2 + hv); return; }   // V7.9: Nachspielzeit je Verlängerungshälfte
          if (hv === 0 && !s.halle) return unterbrechung('HALBZEIT', 'Verlängerung · Seitenwechsel', 2.6, 2, verlaengerungHalbzeit);   // V9.2
          (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('verl_ende', null, true);   // V6.1
          if (s.tore[0] === s.tore[1]) return unterbrechung('ABPFIFF', 'Unentschieden nach 120 Minuten – Elfmeterschießen!', 3, 3, elfmeterschiessenStart);   // V9.2
          return ende();
        }
        if (s.optionen && s.optionen.htSpiel){ if (s.tore[0] === s.tore[1] && s.optionen.htKO) return unterbrechung('ABPFIFF', 'Unentschieden – direkt ins Elfmeterschießen!', 3, 3, elfmeterschiessenStart); return ende(); }   // HALLENTURNIER: Gruppe = Remis möglich, K.-o. = sofort Elfmeter
          if (s.tore[0] === s.tore[1] && !(s.optionen && s.optionen.liga)) return unterbrechung('ABPFIFF', 'Unentschieden – gleich geht es in die Verlängerung', 3.2, 3, verlaengerungStart);   // V9.2
        return ende();
      }
      if (!s.halle && !s.verlaengerung && !s.halbzeitGewesen && vor > HALBZEIT && s.zeit <= HALBZEIT){ s.zeit = HALBZEIT; if (!s.nsFertig0){ s.nsFertig0 = true; nachspielStart(0); return; } return halbzeit(); }   // V6.2: erst Nachspielzeit
      // Schlussphase kommentieren
      if (vor > 30 && s.zeit <= 30){ const diff = Math.abs(s.tore[0] - s.tore[1]); (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(diff >= 2 ? 'entschieden' : diff <= 1 && Math.random() < .5 ? 'spannend' : 'schlussphase', null, true); }
      if (vor > 60 && s.zeit <= 60) (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('minute', null, true);
      if (vor > 20 && s.zeit <= 20) (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('uhr', null, false);
      if (vor > 9 && s.zeit <= 9) (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('letzte', null, true);
    }
    if (s.phase === 'tor' || s.phase === 'pfiff' || s.phase === 'start' || s.phase === 'aus'){
      s.phaseT -= dt; if (s.phase === 'tor' && s.jubelDaten) s.jubelDaten.t += dt;
      if (s.phase === 'tor' && s.phaseT <= 0) jubelEnde();
      if (s.phaseT <= 0){
        if (s.phase === 'aus'){ const a = s.ausDaten; s.ausDaten = null; const b0 = welt.ball;
          if (Math.hypot(b0.p.x - a.ort.x, b0.p.z - a.ort.z) > 2) s.ballAlt = { p: b0.p.clone(), v: b0.v.clone(), spin: b0.spin ? { ...b0.spin } : null, rot: b0.rot || 0, t: 0, ruhe: 0 };
          standard(a.typ, a.team, a.ort); }
        else if (s.phase === 'pfiff'){ const f = s.foulDaten; if (f.karte === 'rot'){ f.taeter.aktiv = false; f.taeter.gruppe.visible = false; }
          if (s.trageFall && s.trageFall.aktiv && !s.gast) trageStart(s.trageFall);   // V5.3: erst die Trage, dann der Freistoß
          else { s.elfNaechster = !!f.elf; standard('freistoss', f.team, f.ort); } }
        else if (s.phase === 'tor' && s.wdhPlan && wdhStarten()){ /* erst die Wiederholung */ }
        else { s.einlauf = null; standard('anstoss', s.phase === 'start' ? s.naechsterAnstoss : s.naechsterAnstoss, V()); }
      }
    }
    if (s.phase === 'trage') trageSchritt(dt);
    if (s.wStopp) wechselStoppSchritt(dt);   // V7.9
    if (s.phase === 'standard') standardKI(dt);
    s.besitzTeam = b.besitzer ? b.besitzer.team : (s.phase === 'standard' && s.std ? s.std.team : s.besitzTeam);
    if (s.lade >= 0) s.lade = Math.min(1, s.lade + dt / .9);
    if (lokal.flLade >= 0) lokal.flLade = ((s.phase === 'spiel' || s.phase === 'standard') && !pausiert) ? Math.min(1, lokal.flLade + dt / FLANKE.ladeZeit) : -1;   // V7.0
    if (lokal.passLade >= 0) lokal.passLade = (s.phase === 'spiel' && !pausiert) ? Math.min(1, lokal.passLade + dt / .7) : -1;   // V5.4
    if (s.druck){ s.druck[0] = Math.max(0, s.druck[0] - dt); s.druck[1] = Math.max(0, s.druck[1] - dt); }
    if (s.phase === 'spiel' && (typeof KOMMENTAR !== 'undefined')){
      KOMMENTAR.tick(dt);
      // Torchance: Ballführer kommt gefährlich vors gegnerische Tor
      s.chanceT = (s.chanceT || 0) - dt; const bb = b.besitzer;
      if (bb && !s.gast && bb.rolle !== 'TW' && s.chanceT <= 0 && Math.abs(bb.p.x - richt(bb.team) * HL) < 24 && Math.abs(bb.p.z) < 11){ s.chanceT = 9; KOMMENTAR.ereignis('chance', bb.name); }
    }
    if (s.phase === 'spiel') for (const q of s.spieler){ if (q.spezArten && q.spezArten.length){ q.spezLade = Math.min(1, (q.spezLade || 0) + dt / 28); if (q.spezT > 0) q.spezT -= dt; } }
    if (s.fern) for (const fk of fernKs) if (fk.lade >= 0) fk.lade = Math.min(1, fk.lade + dt / .9);

    // Spieler
    if (!s.gast) for (const k of menschen()) if (wechselErlaubt(k) && k.steuer && !k.steuer.aktiv) wechselAuto(k);   // V5.1/V5.5
    if (s.einlauf && s.phase === 'start') s.einlauf.t += dt;
    for (const p of aktiv()){
      if (p.wartet){ p.v.set(0, 0, 0); continue; }   // V7.9: Einwechselspieler steht an der Linie
      if (s.einlauf && s.phase === 'start'){ einlaufSchritt(p, dt); continue; }
      let wunsch = null;
      const k = kontrolleVon(p);
      // Torjubel: Der Torschütze darf in den ersten ca. 2,4 s selbst laufen (z. B. zu den Zuschauern); danach übernimmt der automatische Jubel
      let manuellJetzt = false;
      { const jD = s.jubelDaten;
        if (k && s.phase === 'tor' && jD && jD.schuetze === p && jD.t < 2.4 && !(autopilot && k === lokal) && p.grae <= 0 && p.gefallen <= 0){
          const r = k.richtung();
          if (r.length() > .12){ manuellJetzt = true; jD.manuell = true; jD.ziel.set(p.p.x, 0, p.p.z); wunsch = r.clone().normalize().multiplyScalar(p.tempo * 1.05 * Math.min(1, r.length())); }
        } }
      if (manuellJetzt){ /* Bewegungswunsch kommt vom Joystick */ }
      else if (k && !(autopilot && k === lokal) && s.phase !== 'tor'){
        if (s.phase === 'standard' && s.std && s.std.schuetze === p){
          const r = k.richtung(); if (r.length() > .3) s.std.ziel.copy(r.normalize());
          p.blick.copy(s.std.ziel); wunsch = V();
        } else if (s.phase === 'spiel' || s.phase === 'standard'){
          const r = k.richtung(), m = Math.min(1, r.length());
          const tempo = p.tempo * ausdauerFaktor(p) * (k.sprint ? sprintFaktor(p) : 1) * (k.lade >= 0 ? .75 : 1) * (s.stufe === 'leicht' ? 1.08 : 1) * (spezAn(p, 'tem') ? 1.35 : 1) * (k.sprint && hatFae(p, 'antritt') ? 1.08 : 1);
          wunsch = m > .12 ? r.normalize().multiplyScalar(tempo * m) : V();
          // V4.1: Lässt du den Stick los, läuft der Pass-Empfänger von selbst dem Ball entgegen
          if (m <= .35 && s.phase === 'spiel' && !b.besitzer && b.passZiel === p){ try { wunsch = kiWunsch(p, kiZiel(p, dt)); } catch (e) {} }   // V4.0: Empfänger läuft auch bei leichtem Stick-Druck von selbst zum Ball
          if (s.phase === 'standard') wunsch.multiplyScalar(.8);
        }
      } else {
        let ziel;
        if (grafikProfil() === GRAFIK.low && p.kiZ && (p.kiN = (p.kiN || 0) + 1) % 2){ ziel = p.kiZ; p.kiDt = (p.kiDt || 0) + dt; }   // V9.1: NIEDRIG – KI halb so oft
        else { ziel = kiZiel(p, dt + (p.kiDt || 0)); p.kiDt = 0; p.kiZ = ziel; }
        wunsch = kiWunsch(p, ziel);
        if (s.phase === 'tor'){ wunsch.multiplyScalar(.5); }
        // KI grätscht manchmal
        const h = b.besitzer;
        if (s.phase === 'spiel' && h && h.team !== p.team && p.rolle !== 'TW' && p.grae <= 0){
          const d = d2(p.p, h.p), vorne = V(h.p.x - p.p.x, 0, h.p.z - p.p.z).normalize().dot(p.blick);
          const lust = (p.team === 1 ? STUFE[s.stufe].zweikampf : .7) * .32;
          if (d > 1 && d < 2 && vorne > .8 && Math.random() < lust * dt){ p.blick.set(h.p.x - p.p.x, 0, h.p.z - p.p.z).normalize(); grae(p); }
        }
      }
      if (s.phase === 'tor' && s.jubelDaten && !manuellJetzt){ const jw = jubelWunsch(p, dt); if (jw) wunsch = jw; }
      if (s.so && s.so.an && (p.rolle !== 'TW' || p.team === s.so.team)) wunsch = V();   // V7.9: Elfmeterschießen – alle Feldspieler bleiben stehen
      if (p.rudel){ if (s.phase !== 'pfiff' || p.rudel.t <= 0) p.rudel = null; else wunsch = rudelWunsch(p, dt); }   // V7.5
      bewege(p, dt, wunsch);
      if (p.besitzer) {}
    }
    abstossen();
    // V4.5: Bei Anstoß und Standards des Gegners darfst du nicht an den Ball: eigene Hälfte + außerhalb des Mittelkreises bzw. Abstand zum Ball
    if (s.phase === 'standard' && s.std){
      const sd = s.std;
      for (const k of menschen()){
        const p = k.steuer; if (!p || p.team === sd.team || p.mauer) continue;
        if (sd.typ === 'anstoss'){
          const dir = richt(p.team); if (p.p.x * dir > -.4) p.p.x = -dir * .4;
          const d = Math.hypot(p.p.x, p.p.z), R = 7.3; if (d < R){ const f = R / (d || 1); p.p.x *= f; p.p.z *= f; if (p.p.x * dir > -.4) p.p.x = -dir * .4; }
        } else {
          const R = sd.typ === 'einwurf' ? 2 : sd.typ === 'abstoss' ? 7 : 6;
          const dx = p.p.x - sd.ort.x, dz = p.p.z - sd.ort.z, d = Math.hypot(dx, dz);
          if (d < R){ p.p.x = sd.ort.x + dx / (d || 1) * R; p.p.z = sd.ort.z + dz / (d || 1) * R; }
        }
      }
    }
    // Standard: Schütze und Mauer fixieren, Ball liegt
    if (s.phase === 'standard' && s.std){
      const sd = s.std; b.p.set(sd.ort.x, BALL_R, sd.ort.z); b.v.set(0, 0, 0);
      if (sd.typ === 'einwurf'){ const w = sd.schuetze; b.p.set(w.p.x + w.blick.x * .12, 2.1, w.p.z + .08); }   // Ball über dem Kopf, in beiden Händen
      if (!istMensch(sd.schuetze)){ sd.schuetze.v.set(0, 0, 0); sd.schuetze.blick.copy(sd.ziel); }
      const hinter = sd.typ === 'einwurf' ? V(0, 0, Math.sign(sd.ort.z) * (s.halle ? .22 : .55)) : sd.ziel.clone().multiplyScalar(-.55);
      sd.schuetze.p.set(sd.ort.x + hinter.x, 0, sd.ort.z + hinter.z);
      if (sd.mauer) sd.mauer.forEach(w => { if (w.mauer){ w.p.copy(w.mauer); w.v.set(0, 0, 0); } });
    } else ballSchritt(dt);
    if (!(s.einlauf && s.phase === 'start')){ zweikaempfe(dt); regelPruefung(); }
    schiriSchritt(dt);
    abgangSchritt(dt);
    for (const n of welt.tore) aktualisiereNetz(n, dt);
  }

  // V7.4: Ausgewechselter Spieler läuft zur Seitenlinie vor die Bank und ist dann weg
  // V7.5: Spieler laufen zum Schiedsrichter und umringen ihn im Halbkreis
  function rudelWunsch(p, dt){
    const r = p.rudel, sch = welt.schiri; r.t -= dt;
    if (!sch) return V();
    const w = Math.PI * (.2 + .6 * (r.n > 1 ? r.i / (r.n - 1) : .5)), zx = sch.p.x + Math.cos(w) * 1.7 * (p.team === 0 ? -1 : 1), zz = sch.p.z + Math.sin(w) * 1.7;
    const dx = zx - p.p.x, dz = zz - p.p.z, d = Math.hypot(dx, dz);
    if (d < .35){ p.blick.set(sch.p.x - p.p.x, 0, sch.p.z - p.p.z); if (p.blick.lengthSq() > 1e-4) p.blick.normalize(); return V(); }
    return V(dx / d * p.tempo * 1.05, 0, dz / d * p.tempo * 1.05);
  }
  function abgangSchritt(dt){
    if (!s.abgang || !s.abgang.length) return;
    for (let i = s.abgang.length - 1; i >= 0; i--){
      const o = s.abgang[i], zx = (o.team === 0 ? -1 : 1) * (5 + 1.5), zz = -HB - .5;
      const dx = zx - o.p.x, dz = zz - o.p.z, d = Math.hypot(dx, dz);
      if ((d < .6 || !(dt > 0)) && s.halle){ s.abgang.splice(i, 1); halleZurBank(o.team, o.daten); continue; }   // HALL OF FAME: zurück auf die Bank, kann wieder rein
      if (d < .6 || !(dt > 0)){ s.abgang.splice(i, 1); try { if (s.rausFig) s.rausFig[o.team].push(randFigur(o.daten.bild, o.team, s.kits[o.team], '')); } catch (e) {} continue; }   // V7.6: erst nach dem Weg zur Bank sitzt er dort
      o.v.set(dx / d * 6.5, 0, dz / d * 6.5);   // V9.3: zügig vom Platz o.blick.set(dx / d, 0, dz / d);
      o.p.addScaledVector(o.v, dt);
      try { animiereFigur(o, dt, false); } catch (e) {}
    }
  }
  function schiriSchritt(dt){
    const sch = welt.schiri, b = welt.ball;
    if (s.einlauf && s.phase === 'start'){ einlaufSchiri(dt); return; }
    let ziel;
    if (sch.tafelT > 0){   // V7.6: Tafel läuft erst ab Ankunft an der Bank (höchstens 12 s warten), für beide Teams
      const bxS = sch.bankX || -5; sch.tafelW = (sch.tafelW == null ? 12 : sch.tafelW) - dt;
      ziel = V(bxS - Math.sign(bxS) * 3, 0, -HB + 1.1); sch.tafelAn = Math.hypot(ziel.x - sch.p.x, ziel.z - sch.p.z) < 2.4;
      if (sch.tafelAn) sch.tafelT -= dt;
      if (sch.tafelT <= 0 || sch.tafelW <= 0){ sch.tafel = null; sch.tafelAn = false; sch.tafelT = 0; sch.tafelW = null; } }
    else if (s.phase === 'pfiff' && s.foulDaten) ziel = s.foulDaten.ort.clone().add(V(1.2, 0, 1.2));
    else ziel = V(klemme(b.p.x - Math.sign(b.p.x || 1) * 3, -HL + 4, HL - 4), 0, klemme(b.p.z + (b.p.z < 0 ? 5 : -5), -HB + 1.5, HB - 1.5));
    const weg = V(ziel.x - sch.p.x, 0, ziel.z - sch.p.z), d = weg.length();
    const tempo = (s.phase === 'pfiff' || sch.tafelT > 0) ? 9 : sch.tempo * (d > 3 ? 1 : d / 3);
    if (d > .3){ weg.multiplyScalar(tempo / d); sch.v.lerp(weg, Math.min(1, 4 * dt)); } else sch.v.multiplyScalar(.8);
    sch.p.addScaledVector(sch.v, dt);
    const sp = Math.hypot(sch.v.x, sch.v.z); if (sp > .5) sch.blick.set(sch.v.x / sp, 0, sch.v.z / sp);
    if (sch.karteT > 0) sch.karteT -= dt;
  }

  // =================================================================
  // Darstellung: eigene 3D-Projektion auf Canvas (Perspektivkamera)
  // =================================================================
  const kamZiel = V(), kamPos = V();
  const kam = { pos: V(0, 15, 17.5), fov: 36, f: 1, w: 1, h: 1, r: [1,0,0], u: [0,1,0], v: [0,0,-1] };
  let ctx2 = null, dpr = 1;

  function kameraRechnen(){
    const fx = kamZiel.x - kam.pos.x, fy = kamZiel.y - kam.pos.y, fz = kamZiel.z - kam.pos.z;
    const fl = Math.hypot(fx, fy, fz); const v = [fx/fl, fy/fl, fz/fl];
    // rechts = v × oben(0,1,0)
    let r = [-v[2], 0, v[0]]; const rl = Math.hypot(r[0], r[2]) || 1; r = [r[0]/rl, 0, r[2]/rl];
    const u = [r[1]*v[2] - r[2]*v[1], r[2]*v[0] - r[0]*v[2], r[0]*v[1] - r[1]*v[0]];
    kam.r = r; kam.u = u; kam.v = v;
    kam.f = (kam.h / 2) / Math.tan(kam.fov * Math.PI / 360);
  }
  // Welt -> Bildschirm (CSS-Pixel). s = Pixel pro Meter in dieser Tiefe
  function P(x, y, z){
    const dx = x - kam.pos.x, dy = y - kam.pos.y, dz = z - kam.pos.z;
    const zc = Math.max(.3, dx*kam.v[0] + dy*kam.v[1] + dz*kam.v[2]);
    const xc = dx*kam.r[0] + dy*kam.r[1] + dz*kam.r[2];
    const yc = dx*kam.u[0] + dy*kam.u[1] + dz*kam.u[2];
    const k = kam.f / zc;
    return { x: kam.w/2 + xc*k, y: kam.h/2 - yc*k, s: k, t: zc };
  }
  // 11er-Test: Tiefe vor der Kamera (ohne Begrenzung) – für das Abschneiden hinter der Kamera
  const NAH = .6;
  function tiefe(x, y, z){ return (x - kam.pos.x)*kam.v[0] + (y - kam.pos.y)*kam.v[1] + (z - kam.pos.z)*kam.v[2]; }
  function vieleck(g, punkte){            // punkte: [[x,y,z], ...]
    g.beginPath();
    // 11er-Test: Flächen an der Kamera abschneiden (großes Feld reicht sonst hinter die Kamera und wird verzerrt)
    let liste = punkte;
    const tz = punkte.map(q => tiefe(q[0], q[1], q[2]));
    if (tz.some(t => t < NAH)){
      liste = [];
      for (let i = 0; i < punkte.length; i++){
        const a = punkte[i], b = punkte[(i + 1) % punkte.length], ta = tz[i], tb = tz[(i + 1) % punkte.length];
        if (ta >= NAH) liste.push(a);
        if ((ta >= NAH) !== (tb >= NAH)){ const f = (NAH - ta) / (tb - ta); liste.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]); }
      }
      if (liste.length < 3) return;
    }
    liste.forEach((q, i) => { const a = P(q[0], q[1], q[2]); i ? g.lineTo(a.x, a.y) : g.moveTo(a.x, a.y); });
    g.closePath();
  }

  // ---------- Figur: Zustand für das Zeichnen fortschreiben ----------
  function animiereFigur(f, dt, gesteuert){
    const z = f.zeichen;
    const sp = Math.hypot(f.v.x, f.v.z);
    // Blickrichtung als Winkel, weich nachgeführt (max. ~1,6 Umdrehungen pro Sekunde)
    let soll = Math.atan2(f.blick.z, f.blick.x);
    // V5.3: Wer schnell rückwärts zum Blick läuft (z. B. KI sprintet zurück in die Abwehr), dreht sich in Laufrichtung –
    // sonst sah es aus, als liefe er mit umgedrehtem Kopf. Langsames Zurückweichen (Abwehr) bleibt zum Ball gedreht.
    // V11.2: Feldspieler schauen schon beim normalen Laufen in Laufrichtung, sobald sie seitlich oder rückwärts zum Blick laufen
    // (vorher erst ab Sprint und fast genau rückwärts – dann liefen viele mit umgedrehtem Kopf). Torhüter bleiben zum Ball gedreht.
    const istTW = f.rolle === 'TW';
    const spMin = istTW ? 2.3 : 1.1, dotMax = istTW ? -.15 : .3, wechsel = istTW ? .15 : .06;
    if (sp > spMin && !(f.gefallen > 0) && !(f.grae > 0) && !(f.hecht > 0)){
      const bl = Math.hypot(f.blick.x, f.blick.z) || 1, dot = (f.v.x * f.blick.x + f.v.z * f.blick.z) / (sp * bl);
      if (dot < dotMax) f.rueckLauf = Math.min(.35, (f.rueckLauf || 0) + dt); else f.rueckLauf = Math.max(0, (f.rueckLauf || 0) - dt * 2);
    } else f.rueckLauf = Math.max(0, (f.rueckLauf || 0) - dt * 2);
    if (f.rueckLauf > wechsel) soll = Math.atan2(f.v.z, f.v.x);
    if (f.dreh == null) f.dreh = soll;
    let diff = soll - f.dreh; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const schritt = diff * (1 - Math.exp(-14 * dt));
    f.dreh += Math.sign(schritt) * Math.min(Math.abs(schritt), 10 * dt);
    const dx = Math.cos(f.dreh), dzw = Math.sin(f.dreh);
    z.dx = dx; z.dzw = dzw;
    const tempoAnteil = Math.min(1, sp / 3.5);
    // Laufzyklus: Intensität (Gehen → Rennen) weich, Schrittfrequenz passend zum Tempo
    const intSoll = klemme(sp / 5.2, 0, 1);
    z.intens = z.intens == null ? intSoll : z.intens + (intSoll - z.intens) * (1 - Math.exp(-9 * dt));
    if (sp > .15) f.laufPhase += 2 * Math.PI * (1.05 + .27 * sp) * dt;
    else { // zurück in die Grundstellung
      const ziel = Math.round(f.laufPhase / Math.PI) * Math.PI; f.laufPhase += (ziel - f.laufPhase) * (1 - Math.exp(-8 * dt)); }
    z.phase = f.laufPhase;
    z.rueck = dzw < 0;
    const alt = z.ansicht || 'v';
    // Fix: Rückansicht (Hinterkopf) nur, wenn die Figur wirklich fast genau von der Kamera weg läuft;
    // bei Diagonalen (z. B. nach links oben) Seitenansicht in Laufrichtung, damit der Kopf nicht "umgedreht" wirkt.
    let neu = dzw > .55 ? 'v' : dzw < -.85 ? 'r' : dzw < -.42 ? ((alt === 'r' && dzw < -.7) ? 'r' : 's') : (Math.abs(dzw) < .42 ? 's' : alt);
    if (alt === 's' && Math.abs(dzw) < .62) neu = 's';
    z.ansicht = neu;
    // Körperbreite: von vorn/hinten voll, von der Seite schmaler (Drehung des Oberkörpers)
    const breitSoll = (z.ansicht === 's') ? 1 : .8 + .2 * Math.abs(dzw);
    z.breit = z.breit == null ? breitSoll : z.breit + (breitSoll - z.breit) * (1 - Math.exp(-18 * dt));
    let y = 0;   // zusätzliche Höhe (Sprung/Jubel); Hüfthöhe kommt aus den Beinen
    // in die Laufrichtung lehnen (nur sichtbar von der Seite), von vorn leichtes Wiegen
    const lehneSoll = dx * .13 * z.intens;
    z.lehne = z.lehne == null ? lehneSoll : z.lehne + (lehneSoll - z.lehne) * (1 - Math.exp(-8 * dt));
    let rot = z.lehne + Math.sin(f.laufPhase) * .045 * z.intens * Math.abs(dzw), dz = 0;
    if (f.wurf > 0) f.wurf -= dt;
    if (f.jubel > 0){ f.jubel -= dt; if (f.jubelArt && sp < 1.5) y += Math.abs(Math.sin(f.jubel * 5.5)) * .24; }   // ruhige Jubelsprünge, nicht mehr beim Hinlaufen
    if (f.sprung > 0){ f.sprung -= dt; y += Math.sin((.5 - f.sprung) / .5 * Math.PI) * .4; }
    if (s && s.phase === 'ausklang' && f.ak && f.ak.ph > .01) y += f.ak.ph;   // V6.2: auf dem Podest
    z.liegt = 0; z.pose = null; z.huefteFest = null;
    if (f.grae > 0){ rot = -(dx >= 0 ? 1 : -1) * .7; z.pose = 'grae'; z.huefteFest = .14; }
    if (f.gefallen > 0){ rot = (f.blick.x >= 0 ? -1 : 1) * 1.45; z.huefteFest = .05; z.liegt = 1; }
    if (f.hecht > 0){ f.hecht -= dt; const k = Math.sin(Math.min(1, (.6 - f.hecht) / .25) * Math.PI / 2); rot = f.hechtSeite * 1.25 * k; z.huefteFest = .43 - .3 * k; dz = f.hechtSeite * .5 * k; z.liegt = k; }
    if (f.salto > 0){ f.salto -= dt; const k = 1 - Math.max(0, f.salto) / .9; y += Math.sin(k * Math.PI) * 1.1; rot = -(f.blick.x >= 0 ? 1 : -1) * k * Math.PI * 2; z.pose = 'salto'; z.huefteFest = null; }
    else if (s && s.phase === 'tor' && f.jubelArt === 'tanz'){ z.pose = 'tanz'; rot = Math.sin(performance.now() / 90) * .2; }
    else if (s && s.phase === 'tor' && f.jubelArt === 'wiegen'){ z.pose = 'wiegen'; rot = Math.sin(performance.now() / 260) * .14; }
    if (s && s.phase === 'ausklang' && f.ak && f.ak.runter) rot = (f.blick.x >= 0 ? 1 : -1) * .2;   // V9.9: Verlierer beugen sich nach vorn, Kopf runter
    z.armPose = (s && (s.phase === 'tor' || s.phase === 'wiederholung' || s.phase === 'ausklang') && f.jubelArt) ? f.jubelArt : null;
    z.y = y; z.rot = rot; z.dz = dz; z.gesteuert = gesteuert;
  }

  const SCHATTEN = leinwand(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  // V3.0: echte Rasentextur (nur Grasstruktur, Farbe kommt weiter von den Mähstreifen)
  const RASEN_2K = 'images/rasen_2k.webp';
  // V3.7: Rasentextur in 2K (HIGH) bzw. 1K (MEDIUM)
  const RASEN_BILD = new Image(); RASEN_BILD.src = RASEN_2K; RASEN_BILD.stufe = 2;   // V4.1: nur noch 2K
  const RASEN_KACHEL = 5;   // Meter pro Texturkachel
  // V4.0: Rasen „gebacken“ – Mähstreifen und Grastextur werden EINMAL pro Spiel in ein Kachelbild gerechnet
  // (8 m = ein heller + ein dunkler Streifen). Danach wird pro Bild nur noch ganz normal gezeichnet (schnell).
  const BACK_M = 8;
  let backKey = null, backMuster = null, backBild = null;
  function hexZuRGB(c){ const n = parseInt(String(c).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rasenBacken(g, fHell, fDunkel, alpha){
    const hoch = grafikProfil().hoehe >= 720, N = hoch ? 1024 : 768;
    const key = fHell + fDunkel + alpha + N + (RASEN_BILD.stufe || 0);
    if (backKey === key && backMuster) return backMuster;
    if (!RASEN_BILD.complete || !RASEN_BILD.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(RASEN_BILD, 0, 0, N, N);
    const id = x.getImageData(0, 0, N, N), d = id.data, A = hexZuRGB(fHell), B = hexZuRGB(fDunkel);
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++){
      const i = (yy * N + xx) * 4, t = 128 + (d[i] - 128) * .7, basis = xx < N / 2 ? A : B;   // sanftere Struktur
      for (let k = 0; k < 3; k++){
        const b = basis[k], ov = b < 128 ? 2 * b * t / 255 : 255 - 2 * (255 - b) * (255 - t) / 255;
        d[i + k] = b + (ov - b) * alpha;
      }
      d[i + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    backBild = c; backMuster = g.createPattern(c, 'repeat'); backKey = key;
    return backMuster;
  }
  function zeichneRasenGebacken(g, zF, zN, fHell, fDunkel, alpha){
    const pr = grafikProfil(); if (!window.__rasenImmer && (pr === GRAFIK.low || fps.stufe >= 2)) return false;   // V4.1: MEDIUM und HIGH
    const mu = rasenBacken(g, fHell, fDunkel, alpha); if (!mu || !mu.setTransform) return false;
    const N = backBild.width, W = kam.w, H = kam.h, k = BACK_M / N, x0 = -HL - 4, xl = -HL - 4, xr = HL + 4;
    // V4.7: Bildschirmpunkt -> Punkt auf dem Boden (Strahl von der Kamera) – funktioniert auch bei geschwenkter Kamera
    const W2 = W / 2, H2 = H / 2, f = kam.f, R = kam.r, U = kam.u, Vv = kam.v, C = kam.pos;
    const boden = (sx, sy) => { const a = (sx - W2) / f, b = -(sy - H2) / f;
      const dx = Vv[0] + R[0] * a + U[0] * b, dy = Vv[1] + R[1] * a + U[1] * b, dz = Vv[2] + R[2] * a + U[2] * b;
      if (dy > -1e-4) return null; const t = -C.y / dy; return [C.x + dx * t, C.z + dz * t]; };
    // Zeilenbereich aus den Feldecken
    let y0 = H, y1 = 0;
    for (const [x, z] of [[xl, zF], [xr, zF], [xl, zN], [xr, zN]]){ if (tiefe(x, 0, z) < NAH){ y1 = H; continue; } const q = P(x, 0, z); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1));
    if (y1 <= y0) return true;
    const band = pr.hoehe >= 720 ? 2 : 3, M = new DOMMatrix();
    g.save();
    vieleck(g, [[xl, 0, zF], [xr, 0, zF], [xr, 0, zN], [xl, 0, zN]]); g.clip();   // nur auf dem Spielfeld
    g.fillStyle = mu;
    for (let y = y0; y < y1; y += band){
      const yc = y + band / 2, A = boden(0, yc), B = boden(W, yc), Cc = boden(0, yc + 1);
      if (!A || !B || !Cc) continue;
      // affine Abbildung Welt (X,Z) -> Bildschirm aus 3 Punkten: A->(0,yc), B->(W,yc), Cc->(0,yc+1)
      const det = A[0] * (B[1] - Cc[1]) - A[1] * (B[0] - Cc[0]) + (B[0] * Cc[1] - B[1] * Cc[0]);
      if (Math.abs(det) < 1e-9) continue;
      const loese = (sa, sb, sc) => {   // Cramer
        const m1 = (sa * (B[1] - Cc[1]) - A[1] * (sb - sc) + (sb * Cc[1] - B[1] * sc)) / det;
        const m2 = (A[0] * (sb - sc) - sa * (B[0] - Cc[0]) + (B[0] * sc - sb * Cc[0])) / det;
        const m3 = (A[0] * (B[1] * sc - sb * Cc[1]) - A[1] * (B[0] * sc - sb * Cc[0]) + sa * (B[0] * Cc[1] - B[1] * Cc[0])) / det;
        return [m1, m2, m3]; };
      const mx = loese(0, W, 0), my = loese(yc, yc, yc + 1);
      M.a = mx[0] * k; M.b = my[0] * k; M.c = mx[1] * k; M.d = my[1] * k; M.e = mx[0] * x0 + mx[2]; M.f = my[0] * x0 + my[2];
      mu.setTransform(M);
      g.fillRect(0, y, W, band + .5);
    }
    g.restore();
    return true;
  }
  const PFUETZE = leinwand(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(200,225,255,.32)'); gr.addColorStop(.7, 'rgba(140,180,210,.16)'); gr.addColorStop(1, 'rgba(140,180,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const SCHNEEFLECK = leinwand(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(250,252,255,.85)'); gr.addColorStop(.55, 'rgba(240,246,255,.55)'); gr.addColorStop(1, 'rgba(240,246,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  function zeichneSchatten(g, x, z, r, a){
    const m = P(x, 0, z), rr = r * m.s;
    if (s && s.nacht){
      g.globalAlpha = a * .42;
      for (const [ox, oy] of [[-.55, -.18], [.55, -.18], [-.45, .16], [.45, .16]]) g.drawImage(SCHATTEN, m.x - rr * 1.15 + ox * rr, m.y - rr * .42 + oy * rr, 2.3 * rr, 2 * rr * .42);
      g.globalAlpha = 1; return;
    }
    if (s && s.sonne){
      g.globalAlpha = Math.min(1, a * 1.7);
      g.drawImage(SCHATTEN, m.x - rr * .4, m.y - rr * .5, 2.6 * rr, 2 * rr * .5);
    } else { g.globalAlpha = s && s.schnee ? a * .7 : a; g.drawImage(SCHATTEN, m.x - rr, m.y - rr * .42, 2 * rr, 2 * rr * .42); }
    g.globalAlpha = 1;
  }

  const spielStand = () => s;
  function zeichneFigur(g, f){
    const z = f.zeichen, px = f.p.x, pz = f.p.z + z.dz;
    const fuss = P(px, f.podest || 0, pz), k = fuss.s;
    // Nur der eigene, fest gesteuerte Spieler bekommt einen Kreis/Marker.
    // Alle anderen Spieler – auch KI und Mitspieler – bleiben ohne Kreis unter den Füßen.
    if (!f.schiri && z.gesteuert && !istAusklang()){   // V6.2: in der Szene nach dem Abpfiff kein Steuer-Kreis
      g.save(); g.translate(fuss.x, fuss.y); g.scale(1, .42);
      g.lineWidth = .1 * k;
      // V3.32: Ring wird mit sinkender Ausdauer orange, dann rot (pulsiert kurz vor Schluss)
      let ringFarbe = z.gesteuert === 1 ? '#ffe234' : '#3fe0ff';
      if (z.gesteuert === 1 && f.ausdauer != null){
        const qa = Math.max(0, Math.min(1, f.ausdauer / Math.max(1, f.maxAusdauer || 100)));
        if (qa < .3){ ringFarbe = '#ff2a2a'; g.lineWidth = .1 * k * (1.15 + Math.sin(performance.now() / 120) * .25); }
        else if (qa < .62) ringFarbe = '#ff9a1f';
      }
      g.strokeStyle = ringFarbe;
      g.beginPath(); g.arc(0, 0, .58 * k, 0, Math.PI*2); g.stroke();
      const puls = 1 + Math.sin(performance.now() / 180) * .035;
      g.scale(puls, puls);
      const a = Math.atan2(f.blick.z, f.blick.x);
      g.rotate(a); g.fillStyle = (ringFarbe === '#ffe234' || ringFarbe === '#3fe0ff') ? '#ffe234' : ringFarbe;
      g.beginPath(); g.moveTo(.95*k, 0); g.lineTo(.68*k, -.17*k); g.lineTo(.68*k, .17*k); g.closePath(); g.fill();
      g.restore();
    }
    const GR = 1.4 * (f.skal || 1);   // Figuren etwas größer als echt (wie in Handy-Fußballspielen)
    const s = k * GR, CV = .79, CZ = .61;
    const ddx = z.dx == null ? 1 : z.dx, ddz = z.dzw == null ? 0 : z.dzw;
    // ----- Beine: 2-Gelenk-Modell mit echtem Laufzyklus -----
    const L1 = .265, L2 = .265, inten = z.intens || 0, ph = z.phase || 0;   // Beine etwas länger
    const A = .16 + .52 * inten;
    const bein = seite => {
      const phi = ph + (seite > 0 ? 0 : Math.PI);
      let th = A * Math.sin(phi);
      const vor = Math.cos(phi);
      let ka = .1 * inten + inten * 1.35 * Math.pow(Math.max(0, vor), 1.2) + (vor < 0 ? .08 * inten : 0);
      if (z.pose === 'grae'){ th = seite > 0 ? 1.35 : 1.05; ka = seite > 0 ? 0 : 1.1; }
      if (z.pose === 'sitzen'){ th = 1.5; ka = 1.5; }   // V5.0: sitzen – Oberschenkel nach vorn, Unterschenkel senkrecht
      return { seite, th, ka };
    };
    const beine = [bein(1), bein(-1)];
    const unten = b => L1 * Math.cos(b.th) + L2 * Math.cos(b.th - b.ka);
    let huefteH = z.huefteFest != null ? z.huefteFest : Math.max(unten(beine[0]), unten(beine[1]));
    huefteH += z.y || 0;
    const bild2 = (wx, wy, wz) => [wx * s, -wy * s * CV + wz * s * CZ];
    const hx = fuss.x, hy = fuss.y - huefteH * s * CV;
    // ----- Proportionen (Welt-Einheiten über der Hüfte) -----
    const SCHULTER = .44, TAILLE = .05;
    const seitenAnsicht = z.ansicht === 's', hintenAnsicht = z.ansicht === 'r';
    const bs = z.breit || 1;
    const yT = -SCHULTER * s * CV - .03 * s, yW = -TAILLE * s * CV;               // Schultern / Taille
    const SW = (seitenAnsicht ? .27 : .44 * bs) * s, WW = (seitenAnsicht ? .25 : .36 * bs) * s;
    const KONTUR = 'rgba(28,22,34,.6)', haut = f.hautFarbe;
    const figLow = grafikProfil() === GRAFIK.low;
    const glied = (pts, farbe, breite, rand = .026) => {   // Körperteil mit dicker Kontur
      g.lineCap = 'round'; g.lineJoin = 'round';
      const pfad = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
      if (!figLow){ g.strokeStyle = KONTUR; g.lineWidth = breite + rand * s; pfad(); g.stroke(); }   // V9.2: NIEDRIG ohne Extra-Kontur (halb so viele Linien)
      g.strokeStyle = farbe; g.lineWidth = breite; pfad(); g.stroke();
    };
    const zwischen = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    g.save();
    g.translate(hx, hy);
    const ganzDrehen = z.liegt >= .5 || z.pose === 'grae' || z.pose === 'salto' || z.pose === 'tanz' || z.pose === 'wiegen';
    if (ganzDrehen) g.rotate(z.rot);
    // ----- Arme: gegengleich zu den Beinen, beim Sprint angewinkelt -----
    const LO = .17, LU = .17, SY = SCHULTER - .03;
    const arme = [1, -1].map(seite => {
      const phi = ph + (seite > 0 ? Math.PI : 0);
      const al = (.12 + .7 * inten) * Math.sin(phi) + .08 * inten;
      const ka = .3 + 1.05 * inten + .15 * inten * Math.cos(phi);
      const lat = seitenAnsicht ? .05 : .2 * bs + .02;
      const lx = -ddz * seite * lat, lz = ddx * seite * lat;
      const ex = lx + ddx * Math.sin(al) * LO - ddz * seite * .03, ey = SY - Math.cos(al) * LO, ez = lz + ddz * Math.sin(al) * LO + ddx * seite * .03;
      const a2 = al + ka;
      const hx2 = ex + ddx * Math.sin(a2) * LU - ddz * seite * .02, hy2 = ey - Math.cos(a2) * LU, hz2 = ez + ddz * Math.sin(a2) * LU + ddx * seite * .02;
      const pose = z.armPose;
      if (pose === 'fan'){   // V5.3: Zuschauer-Jubel – beide Arme weit nach oben in V-Form, Hände deutlich über dem Kopf
        const aus = Math.max(.12, Math.abs(lx) || .12) * Math.sign(lx || seite), az = lz;
        return { s: bild2(lx, SY, lz), e: bild2(aus * 1.55, SY + .2, az), h: bild2(aus * 2.1, SY + .47, az), tiefe: lz };
      }
      if (pose && pose !== 'hoch' && pose !== 'faust' && pose !== 'flieger' && pose !== 'salto'){   // V4.6: weitere Jubelposen
        const ox = -ddz * seite, oz = ddx * seite, tt = performance.now();
        const hochArm = () => { const wk = Math.sin(tt / 120 + seite) * .04, ey2 = SY + LO * .95; return { s: bild2(lx, SY, lz), e: bild2(lx * 1.3, ey2, lz * 1.3), h: bild2(lx * 1.5 + wk, ey2 + LU * .95, lz * 1.5), tiefe: lz }; };
        if (pose === 'siu') return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO * .75, SY - .13, lz + oz * LO * .75), h: bild2(lx + ox * (LO + LU) * .72, SY - .3, lz + oz * (LO + LU) * .72), tiefe: lz };
        if (pose === 'herz') return { s: bild2(lx, SY, lz), e: bild2(lx * 1.25, SY + LO * .8, lz), h: bild2(lx * .12, SY + LO + LU * .85, lz), tiefe: lz };
        if (pose === 'muskel') return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO, SY - .02, lz + oz * LO), h: bild2(lx + ox * LO * 1.08, SY + LU * .95, lz + oz * LO * 1.08), tiefe: lz };
        if (pose === 'ohr' && seite > 0) return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO * .85, SY + .02, lz + oz * LO * .85), h: bild2(lx + ox * .1, SY + .27, lz + oz * .1), tiefe: lz };
        if (pose === 'tanz'){
          if (Math.sin(tt / 110 + (seite > 0 ? 0 : Math.PI)) > 0) return hochArm();
          return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO * .5, SY - .14, lz + oz * LO * .5), h: bild2(lx + ox * LO * .6, SY - .3, lz + oz * LO * .6), tiefe: lz };
        }
        if (pose === 'roboter'){
          const st = (Math.floor(tt / 350) + (seite > 0 ? 0 : 1)) % 2;
          return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO, SY - .02, lz + oz * LO), h: st ? bild2(lx + ox * LO, SY + LU, lz + oz * LO) : bild2(lx + ox * (LO + LU), SY - .02, lz + oz * (LO + LU)), tiefe: lz };
        }
        if (pose === 'wiegen'){ const sw = Math.sin(tt / 260) * .06; return { s: bild2(lx, SY, lz), e: bild2(lx * .35, SY - .14, lz), h: bild2(-lx * .7 + sw, SY - .1, lz), tiefe: lz }; }
        if (pose === 'hand' && seite > 0) return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO * .85 + ddx * .1, SY - .13, lz + oz * LO * .85 + ddz * .1), h: bild2(lx + ox * (LO + LU) * .9 + ddx * .2, SY - .2, lz + oz * (LO + LU) * .9 + ddz * .2), tiefe: lz };   // V7.0: Handschlag – rechter Arm seitlich zum Gegner ausgestreckt
        if (pose === 'kopf') return { s: bild2(lx, SY, lz), e: bild2(lx * 1.4, SY + LO * .5, lz * 1.4), h: bild2(lx * .6, SY + LO * .85 + LU * .35, lz * .6), tiefe: lz };   // Hände an den Kopf
        if (pose === 'umarmen') return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO * .85, SY - .03, lz + oz * LO * .85), h: bild2(lx + ox * (LO * .85 + LU * .55), SY + .1, lz + oz * (LO * .85 + LU * .55)), tiefe: lz };   // Arme um die Schultern der Mitspieler
        if (pose === 'kreuz') return { s: bild2(lx, SY, lz), e: bild2(lx * .8, SY - .13, lz), h: bild2(-lx * .7, SY - .1, lz), tiefe: lz };
      }
      if (pose === 'hoch' || pose === 'salto' || (pose === 'faust' && seite > 0)){
        // Arm(e) nach oben gestreckt
        const wk = Math.sin(performance.now() / 120 + seite) * .04;
        const ey2 = SY + LO * .95;
        return { s: bild2(lx, SY, lz), e: bild2(lx * 1.3, ey2, lz * 1.3), h: bild2(lx * 1.5 + wk, ey2 + LU * .95, lz * 1.5), tiefe: lz };
      }
      if (pose === 'flieger'){
        // Arme seitlich ausgebreitet wie ein Flugzeug
        const ox = -ddz * seite, oz = ddx * seite;
        return { s: bild2(lx, SY, lz), e: bild2(lx + ox * LO, SY - .02, lz + oz * LO), h: bild2(lx + ox * (LO + LU), SY - .05 + seite * .03, lz + oz * (LO + LU)), tiefe: lz };
      }
      return { s: bild2(lx, SY, lz), e: bild2(ex, ey, ez), h: bild2(hx2, hy2, hz2), tiefe: lz };
    }).sort((p1, p2) => p1.tiefe - p2.tiefe);
    const trikotF = f.schiri ? '#1a1a1a' : (f.trikot || f.hose);
    const zeichneArm = q => {
      const m = zwischen(q.s, q.e, .55);
      glied([m, q.e, q.h], haut, .072 * s);                                      // Unterarm (Haut)
      glied([q.s, m], trikotF, .1 * s);                                           // Ärmel
      if (f.kragen && !f.schiri){ g.strokeStyle = f.kragen; g.lineWidth = .1 * s; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(...zwischen(q.s, m, .78)); g.lineTo(m[0], m[1]); g.stroke(); }
      const tw = f.rolle === 'TW';
      g.fillStyle = KONTUR; g.beginPath(); g.arc(q.h[0], q.h[1], (tw ? .066 : .05) * s + .013 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = tw ? ((f.hand && f.hand[0]) || '#f4f4f4') : haut; g.beginPath(); g.arc(q.h[0], q.h[1], (tw ? .066 : .05) * s, 0, Math.PI * 2); g.fill();
    };
    const armeHinten = arme.filter(q => q.tiefe < -.05), armeVorn = arme.filter(q => q.tiefe >= -.05);
    armeHinten.forEach(zeichneArm);
    // ----- Beine -----
    if (z.liegt < .5){
      const punkte = beine.map(b => {
        const lx = -ddz * b.seite * .11 * (seitenAnsicht ? 1 : bs), lz = ddx * b.seite * .11;
        const kx = lx + ddx * Math.sin(b.th) * L1, ky = -Math.cos(b.th) * L1, kz = lz + ddz * Math.sin(b.th) * L1;
        const a2 = b.th - b.ka;
        const fx = kx + ddx * Math.sin(a2) * L2, fy = ky - Math.cos(a2) * L2, fz = kz + ddz * Math.sin(a2) * L2;
        const tx = fx + ddx * .1, ty = fy - .015, tz = fz + ddz * .1;
        return { b, h: bild2(lx, -.02, lz), k: bild2(kx, ky, kz), f: bild2(fx, fy, fz), t: bild2(tx, ty, tz), tiefe: fz };
      }).sort((p1, p2) => p1.tiefe - p2.tiefe);
      const socke = f.schiri ? '#111' : (f.socke || f.hose);
      punkte.forEach((q, i) => {
        const hinten = i === 0 && punkte.length > 1;
        const m = zwischen(q.k, q.f, .3);
        glied([q.h, q.k, m], haut, .12 * s);                                      // Oberschenkel + Knie
        glied([m, q.f], socke, .105 * s);                                          // Stutzen
        if (!f.schiri) (f.sockeBand || []).forEach((fb, bi) => { g.strokeStyle = fb; g.lineWidth = .105 * s; g.lineCap = 'butt';
          g.beginPath(); g.moveTo(...zwischen(m, q.f, .05 + bi * .1)); g.lineTo(...zwischen(m, q.f, .12 + bi * .1)); g.stroke(); });
        const sch = f.schiri ? ['#161616'] : (f.schuh || ['#161616']);
        {   // Fußballschuh: abgerundeter Schuh mit Sohle, Stollen und Glanz
          const fx = q.f[0], fy = q.f[1], tx = q.t[0], ty = q.t[1];
          const dxs = tx - fx, dys = ty - fy, len = Math.hypot(dxs, dys);
          const lang = Math.max(len * 1.35, .12 * s), hoch = .075 * s, wi = Math.atan2(dys, dxs) * (len > .03 * s ? 1 : 0);
          const cx = fx + dxs * .45, cy = fy + .012 * s + dys * .45;
          g.save(); g.translate(cx, cy); g.rotate(len > .03 * s ? wi : 0);
          const bw = len > .03 * s ? lang : .125 * s;
          g.beginPath(); g.ellipse(0, 0, bw / 2, hoch / 2, 0, 0, Math.PI * 2);
          g.fillStyle = sch[0]; g.fill(); g.lineWidth = .016 * s; g.strokeStyle = KONTUR; g.stroke();
          g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(-bw / 2 + .01 * s, hoch * .18, bw - .02 * s, hoch * .28);      // Sohle
          g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-bw * .08, -hoch * .18, bw * .28, hoch * .14, 0, 0, Math.PI * 2); g.fill();   // Glanz
          g.restore();
        }
        if (sch[1]){ g.strokeStyle = sch[1]; g.lineWidth = .025 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(q.f[0], q.f[1] - .012 * s); g.lineTo(...zwischen(q.f, q.t, .75)); g.stroke(); }
        if (hinten){ g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = .11 * s; g.beginPath(); g.moveTo(q.h[0], q.h[1]); g.lineTo(q.k[0], q.k[1]); g.lineTo(q.f[0], q.f[1]); g.stroke(); }
      });
    }
    if (!ganzDrehen) g.rotate(z.rot * .7);   // nur der Oberkörper lehnt sich
    // ----- Hose -----
    {
      const ob = WW * 1.04, un = (seitenAnsicht ? .3 : .44 * bs) * s, yo = yW - .03 * s, yu = .12 * s * CV;
      g.beginPath();
      g.moveTo(-ob / 2, yo); g.lineTo(ob / 2, yo); g.lineTo(un / 2, yu);
      if (!seitenAnsicht){ g.lineTo(.03 * s, yu); g.lineTo(0, yu - .05 * s); g.lineTo(-.03 * s, yu); }
      g.lineTo(-un / 2, yu); g.closePath();
      g.fillStyle = f.schiri ? '#111' : f.hose; g.fill();
      g.lineWidth = .022 * s; g.strokeStyle = KONTUR; g.lineJoin = 'round'; g.stroke();
      if (f.hStreifen && !f.schiri){ g.strokeStyle = f.hStreifen; g.lineWidth = .025 * s;
        g.beginPath(); g.moveTo(-ob / 2 + .02 * s, yo + .01 * s); g.lineTo(-un / 2 + .02 * s, yu - .01 * s); g.moveTo(ob / 2 - .02 * s, yo + .01 * s); g.lineTo(un / 2 - .02 * s, yu - .01 * s); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-ob / 2, yo, ob, .03 * s);
    }
    // ----- Hals -----
    g.fillStyle = haut; g.strokeStyle = KONTUR; g.lineWidth = .02 * s;
    g.beginPath(); g.rect(-.06 * s * (seitenAnsicht ? .9 : bs), yT - .07 * s, .12 * s * (seitenAnsicht ? .9 : bs), .1 * s); g.fill(); g.stroke();
    // ----- Oberkörper mit Trikot -----
    {
      const tex = f.schiri ? null : (seitenAnsicht ? f.torsoS : hintenAnsicht ? f.torsoR : f.torsoV);
      const rund = .07 * s;
      const pfad = () => { g.beginPath(); g.moveTo(-WW / 2, yW); g.lineTo(-SW / 2, yT + rund); g.quadraticCurveTo(-SW / 2, yT, -SW / 2 + rund, yT);
        g.lineTo(SW / 2 - rund, yT); g.quadraticCurveTo(SW / 2, yT, SW / 2, yT + rund); g.lineTo(WW / 2, yW); g.quadraticCurveTo(0, yW + .03 * s, -WW / 2, yW); g.closePath(); };
      g.save(); pfad(); g.clip();
      if (tex){ if (seitenAnsicht && ddx < 0){ g.scale(-1, 1); } g.drawImage(tex, -SW / 2, yT, SW, yW - yT + .03 * s); }
      else { g.fillStyle = trikotF; g.fillRect(-SW / 2, yT, SW, yW - yT + .03 * s); }
      g.restore();
      pfad(); g.lineWidth = .024 * s; g.strokeStyle = KONTUR; g.lineJoin = 'round'; g.stroke();
    }
    // ----- Kopf aus dem Figurenbild -----
    // schräg von vorn: eigene Kopfansicht (falls vorhanden), sonst Vorderansicht
    const schraeg = false;   // V8.0: Schrägbilder abgeschaltet – nur vorne, hinten oder seitlich
    const kopf = seitenAnsicht && f.kopfS ? f.kopfS : hintenAnsicht ? f.kopfR : schraeg ? f.kopfD : f.kopfV;
    const hoehe = OBERKOERPER_H * s * CV;
    let kopfOben = yT - .55 * s;
    const kopfZeichnen = () => {
      if (!kopf) return;
      const norm = kopf.skal || 1;     // alle Köpfe gleich groß (Maßstab pro Figur)
      const kh = hoehe * kopf.height / kopf.voll * norm, kw = kh * kopf.width / kopf.height;
      const unterkante = yT + .025 * s;
      kopfOben = unterkante - kh;
      g.save();
      if (seitenAnsicht){ if ((ddx < 0) !== !!(f.kopfSLinks && kopf === f.kopfS)) g.scale(-1, 1); g.drawImage(kopf, -kw / 2 + .03 * s, kopfOben, kw, kh); }
      else if (schraeg){ if (ddx < 0) g.scale(-1, 1); g.drawImage(kopf, -kw / 2 + .015 * s, kopfOben, kw, kh); }
      else { g.transform(1, 0, -ddx * .06 * (1 - Math.abs(ddz)), 1, ddx * .03 * s * (1 - Math.abs(ddz)), 0); g.drawImage(kopf, -kw * bs / 2, kopfOben, kw * bs, kh); }
      g.restore();
    };
    // ----- vordere Arme (beim Einwurf beide Arme über den Kopf) -----
    const sp0 = spielStand(); const wirft = sp0 && sp0.std && sp0.std.typ === 'einwurf' && sp0.std.schuetze === f;
    if (wirft || f.wurf > 0){
      kopfZeichnen();
      const bw = welt.ball, bpz = P(bw.p.x, bw.p.y, bw.p.z), rb = BALL_R * 1.3 * bpz.s;
      const cr = Math.cos(-z.rot), sr = Math.sin(-z.rot);
      let bx = (bpz.x - hx) * cr - (bpz.y - hy) * sr, by = (bpz.x - hx) * sr + (bpz.y - hy) * cr;
      if (!wirft){ const t = 1 - f.wurf / .45; bx = (seitenAnsicht ? (ddx >= 0 ? 1 : -1) * .25 * s : 0) * t; by = kopfOben + t * .5 * s; }
      const sb = seitenAnsicht ? .05 * s : SW / 2 - .04 * s;
      [-1, 1].forEach(sei => {
        const a = [sei * sb, yT + .05 * s];
        let hx0 = bx + sei * rb * .85, hy0 = by + rb * .15;
        { const dxm = hx0 - a[0], dym = hy0 - a[1], dl = Math.hypot(dxm, dym), mx = .33 * s;   // V7.0: Armlänge begrenzen, sonst werden die Arme zum hoch gehaltenen Ball unnatürlich lang gezogen
          if (dl > mx){ hx0 = a[0] + dxm / dl * mx; hy0 = a[1] + dym / dl * mx; } }
        const hnd = [hx0, hy0];
        const e = [(a[0] + hnd[0]) / 2 + sei * .11 * s, (a[1] + hnd[1]) / 2];
        const m = zwischen(a, e, .5);
        glied([m, e, hnd], haut, .072 * s); glied([a, m], trikotF, .1 * s);
        g.fillStyle = KONTUR; g.beginPath(); g.arc(hnd[0], hnd[1], .063 * s, 0, Math.PI * 2); g.fill();
        g.fillStyle = haut; g.beginPath(); g.arc(hnd[0], hnd[1], .05 * s, 0, Math.PI * 2); g.fill();
      });
    } else { armeVorn.forEach(zeichneArm); kopfZeichnen(); }
    // V7.4: Wechseltafel beim Schiedsrichter (Raus rot, Rein grün)
    if (f.schiri && f.tafelAn && f.tafel){
      const bx0 = .12 * s, by0 = kopfOben - .62 * s, bw = .62 * s, bh = .56 * s;
      g.fillStyle = '#0a0a0a'; g.strokeStyle = '#777'; g.lineWidth = Math.max(1, .025 * s);
      g.fillRect(bx0, by0, bw, bh); g.strokeRect(bx0, by0, bw, bh);
      g.font = '900 ' + Math.max(8, .22 * s) + 'px Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ff2b2b'; g.fillText('▼' + (f.tafel.raus || ''), bx0 + bw / 2, by0 + bh * .28);
      g.fillStyle = '#25ff5a'; g.fillText('▲' + (f.tafel.rein || ''), bx0 + bw / 2, by0 + bh * .74);
      glied([[SW / 2 - .03 * s, yT + .05 * s], [.4 * s, kopfOben + .1 * s]], haut, .07 * s);
    }
    // Karte beim Schiedsrichter
    if (f.schiri && f.karteT > 0){
      g.fillStyle = f.karteFarbe; g.strokeStyle = '#000'; g.lineWidth = Math.max(1, .02 * s);
      g.fillRect(.22 * s, kopfOben - .3 * s, .26 * s, .36 * s); g.strokeRect(.22 * s, kopfOben - .3 * s, .26 * s, .36 * s);
      glied([[SW / 2 - .03 * s, yT + .05 * s], [.33 * s, kopfOben + .04 * s]], haut, .07 * s);
    }
    g.restore();
    // V5.3: Kartenspieler tragen einen winzigen Stern über dem Kopf (Gold / Silber / Bronze)
    const stufeStern = !f.schiri && z.liegt < .5 && f.daten && f.daten.stufe;
    if (stufeStern){
      const farbe = { gold: '#ffd23a', silber: '#dfe4ee', bronze: '#d08a4a' }[f.daten.stufe] || '#ffd23a';
      const sx0 = hx, sy0 = hy + kopfOben - .1 * s, R = Math.max(2.6, .06 * s);
      g.beginPath();
      for (let q = 0; q < 10; q++){ const w = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? R * .45 : R; g.lineTo(sx0 + Math.cos(w) * rr, sy0 + Math.sin(w) * rr); }
      g.closePath(); g.fillStyle = farbe; g.fill(); g.lineWidth = Math.max(1, R * .28); g.strokeStyle = 'rgba(0,0,0,.75)'; g.stroke();
    }
    // V2.84: Position für den kleinen Namen über dem Kopf merken (gezeichnet nach allen Figuren).
    if (f.fan) f.kopfInfo = [hx, hy, kopfOben, yT + .025 * s, s, SW, ganzDrehen ? z.rot : z.rot * .7];   // V11.5: Kopfposition für Schal/Mütze der Zuschauer
    f.labelName = f.onlineName || f.name;   // V5.1: bei Online-Spielern der eingegebene Name
    f.namePos = (!f.schiri && f.labelName && (z.gesteuert === 1 || (z.gesteuert === 2 && f.onlineName))) ? [hx, hy + kopfOben - .14 * s, k] : null;
  }

  function zeichneTorTeil(g, netz, teil){
    const sx = netz.seite, x0 = netz.x0;
    const linie = (a, b, breite, farbe) => {
      const p1 = P(a[0], a[1], a[2]), p2 = P(b[0], b[1], b[2]);
      g.strokeStyle = farbe; g.lineWidth = Math.max(1, breite * (p1.s + p2.s) / 2);
      g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
    };
    const netzLinien = segs => {
      g.strokeStyle = 'rgba(255,255,255,.66)'; g.lineWidth = 1; g.lineJoin = 'round'; g.beginPath();
      for (const sg of segs){
        let a, b;
        if (sg[0] === 's'){ a = netzPunkt(netz, 's', sg[1], sg[2], sg[3]); b = netzPunkt(netz, 's', sg[5], sg[6], sg[7]); }
        else { a = netzPunkt(netz, sg[0], sg[1], sg[2]); b = netzPunkt(netz, sg[3], sg[4], sg[5]); }
        const p1 = P(a[0], a[1], a[2]), p2 = P(b[0], b[1], b[2]);
        g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y);
      }
      g.stroke();
    };
    g.lineCap = 'round';
    if (teil === 'hinten'){
      // hintere Rahmenstangen, Netz (Rückwand, Dach, ferne Seite), ferner Pfosten
      for (const z of [-TB, TB]){
        linie([x0 + sx*TT, 0, z], [x0 + sx*TT, TH, z], .05, '#dfe3ea');
        linie([x0, TH, z], [x0 + sx*TT, TH, z], .05, '#dfe3ea');
        linie([x0, .02, z], [x0 + sx*TT, .02, z], .05, '#dfe3ea');
      }
      linie([x0 + sx*TT, TH, -TB], [x0 + sx*TT, TH, TB], .05, '#dfe3ea');
      netzLinien(netz.segmente);
      netzLinien(netz.seiten[-1]);
      linie([x0, 0, -TB], [x0, TH, -TB], .12, '#ffffff');
      linie([x0, TH, -TB - .06], [x0, TH, TB + .06], .12, '#ffffff');
    } else {
      netzLinien(netz.seiten[1]);
      linie([x0, 0, TB], [x0, TH, TB], .12, '#ffffff');
    }
  }

  function zeichneBall(g){
    const b = welt.ball;
    // Schussspur
    if (b.spurPunkte.length > 2){
      g.lineCap = 'round';
      for (let i = 1; i < b.spurPunkte.length; i++){
        const a = b.spurPunkte[i - 1], c = b.spurPunkte[i], p1 = P(a.x, a.y, a.z), p2 = P(c.x, c.y, c.z);
        g.strokeStyle = b.feuer ? 'rgba(255,' + Math.round(140 + 100 * (1 - i / b.spurPunkte.length)) + ',40,' + (.95 * (1 - i / b.spurPunkte.length)) + ')' : 'rgba(255,255,255,' + (.75 * (1 - i / b.spurPunkte.length)) + ')';
        g.lineWidth = Math.max(1, BALL_R * 1.4 * p1.s * (1 - i / b.spurPunkte.length));
        g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
      }
    }
    const m = P(b.p.x, b.p.y, b.p.z), r = BALL_R * 1.3 * m.s;
    if (b.bild.complete && b.bild.naturalWidth){
      g.save(); g.translate(m.x, m.y); g.rotate(b.rot); g.drawImage(b.bild, -r, -r, 2*r, 2*r); g.restore();
    } else { g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x, m.y, r, 0, Math.PI*2); g.fill(); }
  }


  // V4.9: Der ins Aus gegangene Ball fliegt/rollt frei weiter (gleiche Physik), bis er liegt – dann holt ihn der Balljunge
  function altBallSchritt(dt){
    const a = s.ballAlt; if (!a) return;
    a.t += dt;
    const amBoden = a.p.y <= BALL_R + .02 && Math.abs(a.v.y) < .5;
    { const v = a.v.length(); if (v > .05){ const k = PH_KD * cdVon(v) * v * dt, f = 1 / (1 + k); a.v.x *= f; a.v.z *= f; if (!amBoden) a.v.y *= f; } }
    if (a.spin){ const w = a.spin, vx = a.v.x, vy = a.v.y, vz = a.v.z;
      a.v.x += PH_KM * (w.y * vz - w.z * vy) * dt; if (!amBoden) a.v.y += PH_KM * (w.z * vx - w.x * vz) * dt; a.v.z += PH_KM * (w.x * vy - w.y * vx) * dt;
      const ab = Math.exp(-(amBoden ? 3.5 : .12) * dt); w.x *= ab; w.y *= ab; w.z *= ab; }
    a.v.y -= G * dt; a.p.addScaledVector(a.v, dt);
    if (a.p.y < BALL_R){ a.p.y = BALL_R; const e = welt.regen ? .5 : welt.wetter === 'schnee' ? .32 : .6;
      if (a.v.y < -1.1){ a.v.y *= -e; a.v.x *= .84; a.v.z *= .84; if (a.spin){ a.spin.x *= .55; a.spin.y *= .7; a.spin.z *= .55; } } else a.v.y = 0; }
    if (a.p.y <= BALL_R + .01){ const mu = welt.regen ? .085 : welt.wetter === 'schnee' ? .24 : .12, sp = Math.hypot(a.v.x, a.v.z);
      if (sp < .12){ a.v.x = 0; a.v.z = 0; } else { const q = Math.max(0, sp - (mu * 9.81 + sp * .1) * dt) / sp; a.v.x *= q; a.v.z *= q; } }
    a.rot += Math.hypot(a.v.x, a.v.z) * dt / BALL_R * .5 * (a.v.x >= 0 ? 1 : -1);
    if (Math.hypot(a.v.x, a.v.z) < .05 && a.p.y <= BALL_R + .02) a.ruhe += dt;
    if (a.ruhe > 2.5 || a.t > 12 || Math.abs(a.p.x) > HL + 40 || Math.abs(a.p.z) > HB + 40) s.ballAlt = null;
  }
  function zeichneAltBall(g){
    const a = s.ballAlt, b = welt.ball; if (!a || tiefe(a.p.x, a.p.y, a.p.z) < NAH) return;
    const m = P(a.p.x, a.p.y, a.p.z), r = BALL_R * 1.3 * m.s;
    g.save(); g.globalAlpha = a.ruhe > 1.5 ? Math.max(0, 1 - (a.ruhe - 1.5)) : 1;
    if (b.bild && b.bild.complete && b.bild.naturalWidth){ g.translate(m.x, m.y); g.rotate(a.rot); g.drawImage(b.bild, -r, -r, 2 * r, 2 * r); }
    else { g.fillStyle = '#fff'; g.beginPath(); g.arc(m.x, m.y, r, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  function linienZeichnen(g){
    g.strokeStyle = 'rgba(255,255,255,.93)'; g.lineCap = 'round'; g.lineJoin = 'round';
    // 11er-Test: Linien in kurze Stücke teilen – jedes Stück bekommt seine eigene Breite, Stücke hinter der Kamera fallen weg
    for (const l of welt.linien){
      for (let i = 0; i + 1 < l.length; i++){
        const [x0, z0] = l[i], [x1, z1] = l[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2.5));
        for (let j = 0; j < n; j++){
          let ax = x0 + (x1 - x0) * j / n, az = z0 + (z1 - z0) * j / n, bx = x0 + (x1 - x0) * (j + 1) / n, bz = z0 + (z1 - z0) * (j + 1) / n;
          const ta = tiefe(ax, 0, az), tb = tiefe(bx, 0, bz);
          if (ta < NAH && tb < NAH) continue;
          if (ta < NAH){ const f = (NAH - ta) / (tb - ta); ax += (bx - ax) * f; az += (bz - az) * f; }
          else if (tb < NAH){ const f = (NAH - ta) / (tb - ta); bx = ax + (bx - ax) * f; bz = az + (bz - az) * f; }
          const a = P(ax, 0, az), b = P(bx, 0, bz);
          g.lineWidth = Math.max(1.5, .21 * (a.s + b.s) / 2); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
      }
    }
    g.fillStyle = '#fff';
    for (const [x, z] of welt.punkte){ const a = P(x, 0, z); g.beginPath(); g.ellipse(a.x, a.y, .2 * a.s, .09 * a.s, 0, 0, Math.PI*2); g.fill(); }
  }

  // =================================================================
  // HALL OF FAME: Turnhalle – Holzboden, Bande rundherum, Sprossenwände, Fensterband, Hallenlicht
  // =================================================================
  function zeichneHalle(g){
    const W = kam.w, H = kam.h, low = grafikProfil() === GRAFIK.low;
    const WX = HL + 7, WZ = -(HB + 7), WH = 10, VZ = HB + 40;
    const hg = g.createLinearGradient(0, 0, 0, H); hg.addColorStop(0, '#20263a'); hg.addColorStop(1, '#2e3650');
    g.fillStyle = hg; g.fillRect(0, 0, W, H);
    for (const sx of [-1, 1]){
      g.fillStyle = '#d9d2c2'; vieleck(g, [[sx * WX, 0, WZ], [sx * WX, 0, VZ], [sx * WX, WH, VZ], [sx * WX, WH, WZ]]); g.fill();
      g.fillStyle = '#2f5fae'; vieleck(g, [[sx * WX, 0, WZ], [sx * WX, 0, VZ], [sx * WX, 2.2, VZ], [sx * WX, 2.2, WZ]]); g.fill();
    }
    g.fillStyle = '#ece6d8'; vieleck(g, [[-WX, 0, WZ], [WX, 0, WZ], [WX, WH, WZ], [-WX, WH, WZ]]); g.fill();
    g.fillStyle = '#2f5fae'; vieleck(g, [[-WX, 0, WZ], [WX, 0, WZ], [WX, 2.2, WZ], [-WX, 2.2, WZ]]); g.fill();   // Prallschutz
    g.fillStyle = 'rgba(255,255,255,.35)'; vieleck(g, [[-WX, 2.2, WZ], [WX, 2.2, WZ], [WX, 2.32, WZ], [-WX, 2.32, WZ]]); g.fill();
    for (let x = -WX + 1.5; x < WX - 3; x += 4.2){   // Fensterband oben
      const fg = g.createLinearGradient(0, P(0, 8.8, WZ).y, 0, P(0, 6.2, WZ).y); fg.addColorStop(0, '#bfe3ff'); fg.addColorStop(1, '#7fb6e6');
      g.fillStyle = fg; vieleck(g, [[x, 6.2, WZ], [x + 3.4, 6.2, WZ], [x + 3.4, 8.8, WZ], [x, 8.8, WZ]]); g.fill();
      g.strokeStyle = '#8e97a8'; g.lineWidth = 1.2; g.stroke();
      const m0 = P(x + 1.7, 6.2, WZ), m1 = P(x + 1.7, 8.8, WZ); g.beginPath(); g.moveTo(m0.x, m0.y); g.lineTo(m1.x, m1.y); g.stroke();
    }
    if (!low) for (let x = -WX + 1; x < WX - 1.5; x += 2.6){   // Sprossenwände (Holz)
      if (Math.abs(x + .5) < 2.2) continue;   // Platz für die Hallentür
      g.strokeStyle = '#b07a3e'; g.lineWidth = Math.max(1, .09 * P(x, 1, WZ).s);
      for (const xx of [x, x + 1]){ const a = P(xx, 0, WZ), b = P(xx, 2.9, WZ); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      g.strokeStyle = '#d29a55'; g.lineWidth = Math.max(1, .05 * P(x, 1, WZ).s); g.beginPath();
      for (let y = .3; y < 2.9; y += .26){ const a = P(x, y, WZ), b = P(x + 1, y, WZ); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
      g.stroke();
    }
    g.fillStyle = '#1b2236'; vieleck(g, [[-1.3, 0, WZ + .02], [1.3, 0, WZ + .02], [1.3, 2.6, WZ + .02], [-1.3, 2.6, WZ + .02]]); g.fill();   // Hallentür
    { const a = P(0, 2.95, WZ + .02); if (a.s > 2){ g.fillStyle = '#ffe234'; g.font = '900 ' + Math.max(7, .42 * a.s) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HALL OF FAME', a.x, a.y); } }
    for (let x = -HL + 2; x <= HL - 2; x += 8){ const a = P(x, 9.4, WZ + .3); g.fillStyle = 'rgba(255,250,225,.95)'; g.fillRect(a.x - .9 * a.s, a.y - .12 * a.s, 1.8 * a.s, .24 * a.s); }   // Hallenlampen
    // Holzboden (Dielen längs)
    g.fillStyle = '#d6a461'; vieleck(g, [[-WX, 0, WZ], [WX, 0, WZ], [WX, 0, VZ], [-WX, 0, VZ]]); g.fill();
    g.fillStyle = '#cc9a55';
    for (let z = WZ, i = 0; z < VZ; z += 1.2, i++){ if (i % 2) continue; vieleck(g, [[-WX, 0, z], [WX, 0, z], [WX, 0, z + 1.2], [-WX, 0, z + 1.2]]); g.fill(); }
    // V3.07: Turnhalle – blauer Boden: Rand dunkelblau, Spielfläche blau, Torräume dunkler
    g.fillStyle = '#143a82'; vieleck(g, [[-BANDE_X, 0, -BANDE_Z], [BANDE_X, 0, -BANDE_Z], [BANDE_X, 0, BANDE_Z], [-BANDE_X, 0, BANDE_Z]]); g.fill();
    g.fillStyle = '#2f6fd6'; vieleck(g, [[-HL, 0, -HB], [HL, 0, -HB], [HL, 0, HB], [-HL, 0, HB]]); g.fill();
    g.fillStyle = '#2a64c6'; for (let x = -HL, i = 0; x < HL; x += 1.0, i++){ if (i % 2) continue; vieleck(g, [[x, 0, -HB], [Math.min(HL, x + 1.0), 0, -HB], [Math.min(HL, x + 1.0), 0, HB], [x, 0, HB]]); g.fill(); }   // V11.4: Streifen quer
    g.fillStyle = 'rgba(20,58,130,.88)';   // Torräume (blau)
    for (const sx of [-1, 1]){ const gx = sx * HL, pts = [[gx, 0, -TB - 6]];
      for (let i = 0; i <= 10; i++){ const th = i / 10 * Math.PI / 2; pts.push([gx - sx * 6 * Math.sin(th), 0, -TB - 6 * Math.cos(th)]); }
      for (let i = 10; i >= 0; i--){ const th = i / 10 * Math.PI / 2; pts.push([gx - sx * 6 * Math.sin(th), 0, TB + 6 * Math.cos(th)]); }
      vieleck(g, pts); g.fill(); }
    linienZeichnen(g);
    if (!low){   // V11.4: glänzender Boden – schräge Lichtbahnen und Lampenspiegelungen
      [[-HL + 3, .10], [-4, .13], [9, .09]].forEach(([x0, al]) => { g.fillStyle = 'rgba(255,255,255,' + al + ')'; vieleck(g, [[x0, 0, -HB], [x0 + 2.2, 0, -HB], [x0 + 9.2, 0, HB], [x0 + 7, 0, HB]]); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let x = -HL + 2; x <= HL - 2; x += 8){ vieleck(g, [[x - .7, 0, -2.2], [x + .7, 0, -2.2], [x + .7, 0, 2.2], [x - .7, 0, 2.2]]); g.fill(); }
    }
    // V11.4: in der Halle keine Bank
    try { halleStufen(g); if (s.zuschauerHg) for (const o of s.zuschauerHg) if (fanSichtbar(o)) zeichneZuschauer(g, o); } catch (e) {}   // V11.5: Stufen sowie Fans an den Seiten und in den Ecken
    // Bande: hinten mit Werbung, an den Stirnseiten blau/rot (Lücke für das Tor), darüber ein feines Netz
    let n = 0;
    g.fillStyle = 'rgba(255,255,255,.07)'; vieleck(g, [[-BANDE_X, 1, -BANDE_Z], [BANDE_X, 1, -BANDE_Z], [BANDE_X, 4, -BANDE_Z], [-BANDE_X, 4, -BANDE_Z]]); g.fill();
    { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; const a = P(-BANDE_X, 4, -BANDE_Z), b = P(BANDE_X, 4, -BANDE_Z); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    for (const sx of [-1, 1]){
      const x = sx * BANDE_X;
      for (const [z0, z1] of [[-BANDE_Z, -TB - .05], [TB + .05, BANDE_Z]]){
        g.fillStyle = sx < 0 ? '#1f4fa8' : '#c8323a'; vieleck(g, [[x, 0, z0], [x, 0, z1], [x, 1, z1], [x, 1, z0]]); g.fill();
        g.fillStyle = 'rgba(255,255,255,.3)'; vieleck(g, [[x, .9, z0], [x, .9, z1], [x, 1, z1], [x, 1, z0]]); g.fill();
        g.fillStyle = 'rgba(255,255,255,.06)'; vieleck(g, [[x, 1, z0], [x, 1, z1], [x, 4, z1], [x, 4, z0]]); g.fill();
      }
    }
  }
  // V11.4: Werbetafeln hinten – werden zwischen die Figuren sortiert, damit Auswechselspieler HINTER der Tafel stehen (Lücken = Wechsel-Durchgänge)
  function halleBandeHinten(g){
    const z = -BANDE_Z, tore = [[-6.2, -3.8], [3.8, 6.2]];
    let n = 0;
    for (let x = -BANDE_X; x < BANDE_X - .1; x += 4, n++){
      const x1 = Math.min(BANDE_X, x + 4), img = welt.banden[n % welt.banden.length], a = P(x, 1.0, z), b = P(x1, 0, z);
      let teile = [[x, x1]];
      for (const [g0, g1] of tore){ const neu = []; for (const [p0, p1] of teile){ if (g1 <= p0 || g0 >= p1){ neu.push([p0, p1]); continue; } if (g0 > p0) neu.push([p0, g0]); if (g1 < p1) neu.push([g1, p1]); } teile = neu; }
      for (const [p0, p1] of teile){
        const f0 = (p0 - x) / (x1 - x), f1 = (p1 - x) / (x1 - x);
        g.drawImage(img, f0 * img.width, 0, (f1 - f0) * img.width, img.height, a.x + (b.x - a.x) * f0, a.y, (b.x - a.x) * (f1 - f0), b.y - a.y);
      }
    }
  }
  // V11.4: Wechsel-Durchgänge in der Absperrung und Anzeigetafel an der Hallenwand
  function halleZusatz(g){
    for (const sx of [-1, 1]){
      const gx = sx * 5, z = -BANDE_Z;
      g.strokeStyle = '#ffe234'; g.lineWidth = 3;
      for (const xx of [gx - 1.2, gx + 1.2]){ const a = P(xx, 0, z), b = P(xx, 1.3, z); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      const t = P(gx, 1.6, z); if (t.s > 2){ g.fillStyle = sx < 0 ? '#5b8cff' : '#ff6b72'; g.font = '900 ' + Math.max(7, .3 * t.s) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WECHSEL', t.x, t.y); }
    }
    const WZ = -(HB + 7), a = P(-3.6, 5.8, WZ + .03), b = P(3.6, 3.6, WZ + .03);
    g.fillStyle = '#0b1020'; g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    g.strokeStyle = '#ffe234'; g.lineWidth = 2; g.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    const sek = Math.max(0, Math.ceil(s.zeit)), zt = Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0');
    const kz = n => (typeof KUERZEL !== 'undefined' && KUERZEL[n]) || '';
    const c = P(0, 4.7, WZ + .03), h = b.y - a.y;
    g.fillStyle = '#ffe234'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 ' + Math.max(8, h * .4) + 'px system-ui,sans-serif'; g.fillText(kz(s.land[0]) + ' ' + s.tore[0] + ' : ' + s.tore[1] + ' ' + kz(s.gegner[0]), c.x, a.y + h * .36);
    g.fillStyle = '#ff5a4d'; g.font = '900 ' + Math.max(8, h * .3) + 'px system-ui,sans-serif'; g.fillText(zt, c.x, a.y + h * .78);
  }
  function zeichneUmgebung(g){
    if (s.halle){ zeichneHalle(g); try { halleZusatz(g); } catch (e) {} return; }   // HALL OF FAME
    const W = kam.w, H = kam.h, regen = s.regen, schnee = s.schnee, sonne = s.sonne;
    // Hintergrund (Stadion-Dunkel oben)
    const hg = g.createLinearGradient(0, 0, 0, H);
    if (s.nacht){ hg.addColorStop(0, '#04060f'); hg.addColorStop(1, '#0c1430'); }
    else { hg.addColorStop(0, regen ? '#3c4656' : schnee ? '#5a6680' : sonne ? '#3a6fb0' : '#203050'); hg.addColorStop(1, regen ? '#2f3a49' : schnee ? '#46516b' : sonne ? '#2a5a98' : '#1a2440'); }
    g.fillStyle = hg; g.fillRect(0, 0, W, H);
    if (s.nacht && !regen && welt.sterne && grafikProfil() !== GRAFIK.low){ g.fillStyle = 'rgba(255,255,255,.7)'; for (const [x, y, r] of welt.sterne){ g.fillRect(x * W, y * H, 1 + r, 1 + r); } }
    // Tribünen wie im Stadion: Heimblock links, Gästeblock rechts, gemischte Mitte, Dach über der Haupttribüne
    let skal = 22, mHeim, mGast, mMix;
    if (welt.fans && welt.fans.heim && grafikProfil() !== GRAFIK.low){
      if (!welt.fanMuster || welt.fanMuster.quelle !== welt.fans){
        const mk = l => l.map(c => g.createPattern(c, 'repeat'));
        welt.fanMuster = { quelle: welt.fans, heim: mk(welt.fans.heim), gast: mk(welt.fans.gast), mix: mk(welt.fans.mix) };
      }
      const takt = s.phase === 'tor' ? 150 : 520, f = Math.floor(performance.now() / takt) % 2;
      mHeim = welt.fanMuster.heim[f]; mGast = welt.fanMuster.gast[f]; mMix = welt.fanMuster.mix[f]; skal = 36;
    } else mHeim = mGast = mMix = welt.muster || (welt.muster = g.createPattern(welt.publikum, 'repeat'));
    const mt = new DOMMatrix(); const m0 = P(0, 2, -(HB + 6)); mt.translateSelf(m0.x, 0).scaleSelf(m0.s / skal, m0.s / skal);
    for (const m of [mHeim, mGast, mMix]) m.setTransform && m.setTransform(mt);
    const XA = -HL - 14, XE = HL + 14, MB = 7;      // Mitte: -7 … 7
    const blocke = [[XA, -MB - .6, mHeim], [-MB + .6, MB - .6, mMix], [MB + .6, XE, mGast]];
    const beton = regen ? '#5b6270' : '#8a92a3', betonD = regen ? '#3b414c' : '#5d6475';
    // V4.9: Boden außerhalb ZUERST – sonst verdeckt er die Tribünen hinter den Toren
    g.fillStyle = regen ? '#245a2a' : schnee ? '#5f8a62' : sonne ? '#3a8d33' : '#2f7a33';
    vieleck(g, [[-HL - 60, 0, -(HB + 3.5)], [HL + 60, 0, -(HB + 3.5)], [HL + 60, 0, HB + 70], [-HL - 60, 0, HB + 70]]); g.fill();   // V4.7: bis hinter die Kamera
    if (stadionBereit()){ try { zeichneStadion(g); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } }
    else {
    // Rückwand hinter der obersten Reihe
    g.fillStyle = betonD;
    vieleck(g, [[XA, 6.4, -(HB + 8.8)], [XE, 6.4, -(HB + 8.8)], [XE, 8.6, -(HB + 9.4)], [XA, 8.6, -(HB + 9.4)]]); g.fill();
    for (let st = 2; st >= 0; st--){
      const zf = -(HB + 4 + st * 2.4), y0 = st * 1.9, y1 = y0 + 2.6;
      for (const [xa, xb, m] of blocke){
        g.fillStyle = m; vieleck(g, [[xa, y0, zf + 1.3], [xb, y0, zf + 1.3], [xb, y1, zf], [xa, y1, zf]]); g.fill();
      }
      // Treppen zwischen den Blöcken
      g.fillStyle = beton;
      for (const xt of [-MB, MB]) { vieleck(g, [[xt - .6, y0, zf + 1.3], [xt + .6, y0, zf + 1.3], [xt + .6, y1, zf], [xt - .6, y1, zf]]); g.fill(); }
      // Betonkante vorne am Rang
      g.fillStyle = beton;
      vieleck(g, [[XA, y0 - .35, zf + 1.35], [XE, y0 - .35, zf + 1.35], [XE, y0, zf + 1.3], [XA, y0, zf + 1.3]]); g.fill();
    }
    // Dach mit Stützen über der Haupttribüne
    g.strokeStyle = '#4a5160'; g.lineWidth = Math.max(1.5, .18 * m0.s);
    for (let x = XA + 4; x <= XE - 4; x += 12){ const u = P(x, 6.4, -(HB + 8.8)), o = P(x, 9.2, -(HB + 8.6)); g.beginPath(); g.moveTo(u.x, u.y); g.lineTo(o.x, o.y); g.stroke(); }
    g.fillStyle = s.nacht ? '#1a1f2c' : '#3d4452';
    vieleck(g, [[XA, 9.2, -(HB + 9.6)], [XE, 9.2, -(HB + 9.6)], [XE, 9.0, -(HB + 4.6)], [XA, 9.0, -(HB + 4.6)]]); g.fill();
    g.fillStyle = s.nacht ? '#d8e2ff' : '#c9ced8';
    vieleck(g, [[XA, 9.0, -(HB + 4.6)], [XE, 9.0, -(HB + 4.6)], [XE, 8.75, -(HB + 4.5)], [XA, 8.75, -(HB + 4.5)]]); g.fill();
    // Seitentribünen: links Heimfans, rechts Gästefans
    for (const sx of [-1, 1]) for (let st = 1; st >= 0; st--){
      const xf = sx * (HL + 6 + st * 2.4), y0 = st * 1.9, y1 = y0 + 2.6;
      g.fillStyle = sx < 0 ? mHeim : mGast;
      vieleck(g, [[xf - sx*1.3, y0, -(HB + 6)], [xf - sx*1.3, y0, HB + 3], [xf, y1, HB + 3], [xf, y1, -(HB + 6)]]); g.fill();
      g.fillStyle = beton;
      vieleck(g, [[xf - sx*1.35, y0 - .35, -(HB + 6)], [xf - sx*1.35, y0 - .35, HB + 3], [xf - sx*1.3, y0, HB + 3], [xf - sx*1.3, y0, -(HB + 6)]]); g.fill();
    }
    // Flutlichtmasten
    for (const sx of [-1, 1]){
      const a = P(sx * (HL + 8), 0, -(HB + 10)), b = P(sx * (HL + 8), 16, -(HB + 10));
      g.strokeStyle = '#9aa3b5'; g.lineWidth = Math.max(2, .3 * a.s); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.fillStyle = s.nacht ? '#ffffff' : regen ? '#fff6d0' : '#fffbe8'; g.fillRect(b.x - 1.5 * b.s, b.y - .8 * b.s, 3 * b.s, 1.6 * b.s);
    }
    }
    // Rasen mit Mähstreifen (Boden außerhalb wird schon vor den Tribünen gezeichnet)
    const breite = 4, zN = HB + 3, zF = -(HB + 3);
    const jzTon = { sommer: ['#7ed84f', .12], herbst: ['#9aa24a', .16], winter: ['#9fb8a6', .2], fruehling: ['#6fe07a', .08] }[s.jz] || null;   // V4.5: Rasen je Jahreszeit
    const mische = (c, z) => { if (!z || schnee) return c; const a = hexZuRGB(c), b = hexZuRGB(z[0]); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * z[1]).toString(16).padStart(2, '0')).join(''); };
    const fHell = mische(regen ? '#3f9a45' : schnee ? '#86b585' : sonne ? '#74d35e' : '#63c454', jzTon), fDunkel = mische(regen ? '#35893b' : schnee ? '#78a878' : sonne ? '#62c250' : '#52b245', jzTon);   // V4.1: heller (Variante C)
    let gebacken = false;
    try { gebacken = zeichneRasenGebacken(g, zF, zN, fHell, fDunkel, schnee ? .28 : s.nacht ? .33 : regen ? .38 : .35); } catch (e) { gebacken = false; }
    if (!gebacken) for (let i = 0, x = -HL - 4; x < HL + 4; i++, x += breite){
      g.fillStyle = (i % 2) ? fDunkel : fHell;
      vieleck(g, [[x, 0, zF], [x + breite, 0, zF], [x + breite, 0, zN], [x, 0, zN]]); g.fill();
    }
    // V4.5: Herbstlaub am Spielfeldrand, im Winter Raureif an den Seiten
    if (s.jz === 'herbst' || (s.jz === 'winter' && !schnee)){
      if (!welt.laub){ welt.laub = []; const n = s.jz === 'herbst' ? 110 : 60;
        for (let i = 0; i < n; i++){ const seite = Math.random() < .55 ? 1 : -1, x = (Math.random() * 2 - 1) * (HL + 3);
          const z = seite > 0 ? HB + .3 + Math.random() * 2.6 : -(HB + .2 + Math.random() * 1.2);
          welt.laub.push([x, Math.random() < .12 ? (Math.random() * 2 - 1) * HB * .9 : z, Math.random() * Math.PI, ['#c8642a', '#d9a02e', '#a4471f', '#e0b84a', '#8a5a2b'][(Math.random() * 5) | 0]]); } }
      const frost = s.jz === 'winter';
      for (const [x, z, w, f] of welt.laub){ if (tiefe(x, 0, z) < NAH) continue; const m = P(x, 0, z), rr = (frost ? .5 : .16) * m.s; if (rr < .6) continue;
        g.fillStyle = frost ? 'rgba(235,245,255,.35)' : f; g.beginPath(); g.ellipse(m.x, m.y, rr, rr * .45, w, 0, Math.PI * 2); g.fill(); }
    }
    // Pfützen
    // V5.0 Leistung: nur sichtbare Pfützen/Schneeflecken zeichnen (vorher wurden sie auch direkt an der Kamera riesig gemalt)
    const sichtbar = (x0, y0, w, h) => x0 + w > 0 && y0 + h > 0 && x0 < kam.w && y0 < kam.h;
    for (const [x, z, r] of welt.pfuetzen){
      if (tiefe(x, 0, z) < NAH + 1) continue;
      const m = P(x, 0, z), rr = r * m.s, x0 = m.x - rr * 1.6, y0 = m.y - rr * .55;
      if (!sichtbar(x0, y0, rr * 3.2, rr * 1.1)) continue;
      g.drawImage(PFUETZE, x0, y0, rr * 3.2, rr * 1.1);
    }
    for (const [x, z, r] of welt.schneeflecken){
      if (tiefe(x, 0, z) < NAH + 1) continue;
      const m = P(x, 0, z), rr = r * m.s, x0 = m.x - rr * 1.5, y0 = m.y - rr * .5;
      if (!sichtbar(x0, y0, rr * 3, rr)) continue;
      g.drawImage(SCHNEEFLECK, x0, y0, rr * 3, rr);
    }
    linienZeichnen(g);
    // Werbebanden hinten
    let n = 0;
    for (let x = -HL - 2; x < HL + 2; x += 7.4){
      if (x + 7.2 > -TUN_X - .4 && x < TUN_X + .4){ n++; continue; }   // V3.0: Platz für Tunnel und Bänke
      const z = -(HB + 1.6), a = P(x, .9, z), b = P(x + 7.2, 0, z);
      g.drawImage(welt.banden[n++ % welt.banden.length], a.x, a.y, b.x - a.x, b.y - a.y);
    }
    if (grafikProfil() !== GRAFIK.low) try { zeichneTunnelUndBank(g); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V9.1: auf NIEDRIG kein Tunnel/Bank
    // (Nacht) Licht und Dunkel am Spielfeldrand
    if (s.nacht){
      const m = P(kamZiel.x, 0, kamZiel.z);
      const gr = g.createRadialGradient(m.x, m.y, H * .15, m.x, m.y, Math.max(W, H) * .85);
      gr.addColorStop(0, 'rgba(0,6,24,0)'); gr.addColorStop(.55, 'rgba(0,6,24,.25)'); gr.addColorStop(1, 'rgba(0,6,24,.7)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // Tribüne dunkler, Blitzlichter im Publikum
      const t1 = P(0, 2.5, -(HB + 6));
      g.fillStyle = 'rgba(0,4,18,.5)'; g.fillRect(0, 0, W, Math.max(0, t1.y));
      g.fillStyle = 'rgba(0,8,30,.26)'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) if (Math.random() < .35){
        const q = P(zufall(-HL - 12, HL + 12), zufall(1, 7), -(HB + 5 + zufall(0, 4)));
        const r = 2 + Math.random() * 4;
        const fg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 3); fg.addColorStop(0, 'rgba(255,255,255,.95)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = fg; g.fillRect(q.x - r * 3, q.y - r * 3, r * 6, r * 6);
      }
    }
    // Banden hinter den Toren
    for (const sx of [-1, 1]){
      const x = sx * (HL + 3.2);
      g.fillStyle = sx < 0 ? '#2a64e0' : '#e8343c';
      vieleck(g, [[x, 0, -HB - 1.6], [x, 0, HB - 1], [x, .9, HB - 1], [x, .9, -HB - 1.6]]); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)';
      vieleck(g, [[x, .55, -HB - 1.6], [x, .55, HB - 1], [x, .65, HB - 1], [x, .65, -HB - 1.6]]); g.fill();
    }
  }

  // Pfeil am Bildrand zeigt, wo dein Spieler ist, wenn er gerade nicht zu sehen ist


  // V4.6: Stadion aus Bildern (Haupttribüne, Kurven hinter den Toren, Flutlichtmasten) – Fans in Teamfarben sitzen auf den Plätzen
  const STADION = {
    haupt: neuesBild('images/haupt.webp'), hauptM: neuesBild('images/hauptm.webp'),
    kurve: neuesBild('images/kurve.webp'), kurveM: neuesBild('images/kurvem.webp'),
    licht: neuesBild('images/licht.webp')
  };
  const SITZE = {"haupt":[[154.1,166.9,24.5,18.0],[180.5,166.9,24.5,18.0],[207.9,166.9,23.8,18.0],[234.3,166.9,23.8,18.7],[261.4,166.9,23.8,18.0],[287.8,166.9,23.8,18.0],[314.9,166.9,23.8,18.0],[341.9,166.9,23.8,18.0],[368.4,166.9,23.8,18.0],[581.4,166.9,23.2,18.0],[608.5,166.9,23.2,18.0],[634.9,166.9,23.2,18.0],[661.3,166.9,23.2,18.7],[687.4,166.9,22.6,18.0],[713.9,166.9,22.6,18.7],[740.6,166.9,23.2,18.7],[767.0,166.9,23.2,18.0],[974.9,166.9,23.8,18.0],[1001.3,166.9,23.8,18.0],[1027.8,166.9,23.8,18.7],[1054.2,166.9,23.8,18.7],[1080.3,166.9,23.2,18.0],[1106.7,166.9,24.5,18.7],[396.4,167.6,20.6,16.1],[421.9,167.6,23.8,16.1],[448.6,167.6,23.2,16.1],[475.0,167.6,23.2,16.1],[501.5,167.6,23.2,16.1],[527.9,167.6,23.2,17.4],[554.0,167.6,22.6,16.1],[793.1,167.6,22.6,17.4],[818.6,167.6,23.2,16.1],[844.4,167.6,23.2,17.4],[869.5,167.6,23.2,17.4],[895.6,167.6,22.6,17.4],[921.1,167.6,23.2,17.4],[947.2,167.6,22.6,16.8],[1133.1,167.6,23.2,16.1],[1158.6,167.6,23.8,17.4],[1183.4,167.6,21.9,17.4],[1209.9,167.6,24.5,17.4],[1236.0,167.6,23.8,17.4],[147.9,191.4,25.1,20.0],[229.8,191.4,25.1,20.0],[256.5,191.4,24.5,20.0],[311.3,191.4,24.5,20.0],[365.5,191.4,24.5,20.0],[581.7,191.4,23.8,20.0],[608.1,191.4,23.8,20.0],[634.9,191.4,23.2,20.0],[661.3,191.4,23.2,20.0],[687.4,191.4,22.6,20.0],[713.9,191.4,23.8,20.0],[740.6,191.4,23.2,20.0],[767.0,191.4,23.2,20.0],[976.5,191.4,24.5,20.0],[1030.3,191.4,23.8,20.0],[1057.1,191.4,24.5,20.0],[1083.5,191.4,24.5,20.0],[1110.3,191.4,25.1,20.0],[174.7,192.1,25.8,19.3],[202.1,192.1,25.1,19.3],[283.9,192.1,25.1,19.3],[338.4,192.1,24.5,19.3],[393.5,192.1,23.8,19.3],[420.3,192.1,24.5,19.3],[447.0,192.1,23.8,17.4],[473.8,192.1,24.5,19.3],[500.5,192.1,23.8,19.3],[527.3,192.1,24.5,19.3],[553.7,192.1,24.5,19.3],[793.5,192.1,23.2,19.3],[819.2,192.1,23.2,18.7],[845.0,192.1,23.2,19.3],[870.8,192.1,23.2,17.4],[896.9,192.1,23.8,19.3],[922.7,192.1,23.8,19.3],[948.8,192.1,24.5,19.3],[1003.6,192.1,24.5,19.3],[1137.3,192.1,23.8,19.3],[1163.4,192.1,24.5,19.3],[1189.5,192.1,25.1,19.3],[1215.7,192.1,24.5,18.7],[1241.8,192.1,25.1,19.3],[140.2,217.9,26.4,20.6],[168.2,217.9,25.8,20.0],[195.9,217.9,25.8,20.6],[223.3,217.9,26.4,20.0],[251.1,217.9,25.1,20.6],[278.8,217.9,25.1,20.6],[305.8,217.9,25.1,20.0],[333.6,217.9,25.1,20.6],[361.3,217.9,25.1,20.0],[390.0,217.9,24.5,20.0],[417.4,217.9,25.1,20.6],[444.8,217.9,24.5,20.6],[498.9,217.9,24.5,20.6],[581.1,217.9,23.8,20.0],[608.1,217.9,23.8,20.6],[634.6,217.9,23.8,20.6],[661.0,217.9,23.8,20.0],[687.4,217.9,23.8,20.0],[713.9,217.9,23.8,20.6],[740.6,217.9,23.2,20.0],[767.4,217.9,23.8,20.0],[872.4,217.9,23.8,20.6],[925.0,217.9,24.5,20.0],[979.7,217.9,24.5,20.6],[1006.8,217.9,24.5,20.6],[1033.9,217.9,24.5,20.6],[1061.3,217.9,25.1,20.6],[1088.0,217.9,24.5,20.6],[1114.8,217.9,25.1,20.6],[471.8,218.5,24.5,20.0],[526.0,218.5,24.5,20.0],[553.0,218.5,24.5,20.0],[794.4,218.5,23.8,20.0],[820.2,218.5,23.8,20.0],[846.3,218.5,24.5,20.0],[898.5,218.5,24.5,20.0],[951.4,218.5,24.5,20.0],[1142.5,218.5,25.1,19.3],[1168.9,218.5,25.1,20.0],[1195.3,218.5,25.1,20.0],[1222.1,218.5,25.8,19.3],[1249.2,218.5,25.8,20.0],[132.5,244.9,26.4,20.6],[160.2,244.9,26.4,20.6],[188.5,244.9,26.4,20.6],[216.9,244.9,26.4,20.6],[244.9,244.9,25.8,20.6],[273.0,244.9,26.4,20.6],[301.0,244.9,25.8,20.6],[329.1,244.9,25.1,20.6],[356.8,244.9,25.1,20.6],[385.8,244.9,25.1,20.6],[413.5,244.9,25.1,20.6],[441.2,244.9,25.1,20.6],[468.9,244.9,25.1,20.6],[496.6,244.9,25.1,20.6],[524.4,244.9,25.1,20.6],[551.7,244.9,24.5,20.6],[580.1,244.9,24.5,20.6],[607.5,244.9,23.8,20.6],[633.9,244.9,23.8,20.6],[660.7,244.9,24.5,20.6],[687.4,244.9,23.8,20.6],[714.2,244.9,24.5,20.6],[740.9,244.9,23.8,20.6],[767.7,244.9,24.5,20.6],[795.4,244.9,24.5,20.6],[821.5,244.9,23.8,20.6],[848.3,244.9,24.5,20.6],[874.7,244.9,24.5,20.6],[901.1,244.9,24.5,20.6],[927.5,244.9,24.5,20.6],[954.6,244.9,24.5,20.6],[983.0,244.9,25.8,20.6],[1010.0,244.9,24.5,20.6],[1037.8,244.9,25.8,20.6],[1065.5,244.9,25.8,20.6],[1092.2,244.9,25.1,20.6],[1119.6,244.9,25.8,20.6],[1147.3,244.9,25.8,20.6],[1174.4,244.9,25.8,20.6],[1228.5,244.9,25.8,20.6],[1255.9,244.9,26.4,20.6],[1201.5,245.6,25.8,20.0],[124.1,272.0,26.4,21.3],[210.1,272.0,27.1,21.3],[267.2,272.0,26.4,21.3],[323.9,272.0,26.4,21.3],[579.5,272.0,24.5,21.3],[985.9,272.0,25.1,21.3],[1069.3,272.0,25.8,21.9],[152.8,272.7,27.1,20.6],[181.8,272.7,27.1,21.3],[238.5,272.7,27.1,20.6],[295.5,272.7,26.4,20.6],[352.6,272.7,25.8,20.6],[381.9,272.7,26.4,20.6],[409.9,272.7,25.8,20.6],[438.3,272.7,25.8,20.6],[466.7,272.7,25.8,20.6],[494.4,272.7,25.8,20.6],[522.4,272.7,25.1,20.6],[550.5,272.7,25.8,20.6],[606.5,272.7,24.5,20.6],[633.6,272.7,24.5,20.6],[660.7,272.7,24.5,20.6],[687.4,272.7,23.8,21.3],[714.2,272.7,24.5,20.6],[741.3,272.7,24.5,20.6],[768.3,272.7,24.5,20.6],[796.0,272.7,24.5,20.6],[822.5,272.7,24.5,20.6],[849.5,272.7,24.5,20.6],[876.3,272.7,25.1,21.3],[903.4,272.7,25.1,19.3],[930.4,272.7,25.1,21.3],[957.5,272.7,25.1,20.6],[1013.9,272.7,25.8,20.6],[1041.9,272.7,26.4,20.6],[1096.7,272.7,26.4,20.6],[1124.4,272.7,26.4,20.6],[1152.5,272.7,25.8,20.6],[1180.2,272.7,25.8,20.6],[1208.2,272.7,26.4,21.3],[1236.0,272.7,26.4,21.3],[1263.7,272.7,26.4,20.6],[115.4,300.4,27.1,21.9],[144.7,300.4,27.7,21.9],[174.0,300.4,27.1,21.9],[203.0,300.4,27.1,21.9],[232.0,300.4,27.1,21.9],[261.4,300.4,26.4,21.9],[290.1,300.4,27.1,21.9],[319.1,300.4,27.1,21.9],[348.4,300.4,26.4,21.9],[578.2,300.4,24.5,21.9],[605.2,300.4,24.5,21.9],[632.6,300.4,25.1,21.9],[660.0,300.4,24.5,21.9],[687.1,300.4,24.5,21.9],[714.2,300.4,24.5,21.9],[741.6,300.4,25.1,21.9],[769.0,300.4,24.5,21.9],[989.4,300.4,25.8,21.9],[1017.4,300.4,25.1,21.9],[1044.8,300.4,24.5,19.3],[1073.5,300.4,26.4,21.9],[1101.2,300.4,26.4,21.9],[1128.3,300.4,25.1,19.3],[378.0,301.0,26.4,21.3],[406.7,301.0,25.8,21.3],[435.4,301.0,26.4,21.3],[463.8,301.0,26.4,21.3],[492.4,301.0,25.8,21.3],[520.8,301.0,25.8,21.3],[549.2,301.0,25.8,21.3],[797.0,301.0,25.1,21.3],[823.8,301.0,24.5,21.3],[851.2,301.0,25.1,21.3],[878.2,301.0,25.1,21.3],[905.9,301.0,25.1,21.3],[933.3,301.0,25.8,21.3],[960.4,301.0,25.8,21.3],[1158.0,301.0,26.4,21.3],[1186.3,301.0,26.4,21.3],[1214.7,301.0,26.4,21.3],[1242.7,301.0,27.1,21.3],[1271.1,301.0,27.1,21.3],[106.7,329.4,27.7,21.9],[136.3,329.4,27.7,22.6],[166.0,329.4,27.7,22.6],[195.6,329.4,27.7,22.6],[225.3,329.4,27.7,22.6],[254.6,329.4,27.1,21.9],[284.9,329.4,25.8,19.3],[313.6,329.4,26.4,21.9],[343.2,329.4,26.4,22.6],[577.2,329.4,25.1,21.9],[604.9,329.4,25.1,21.9],[632.6,329.4,25.1,21.9],[660.0,329.4,24.5,22.6],[687.1,329.4,24.5,21.9],[714.5,329.4,25.1,21.9],[741.9,329.4,24.5,22.6],[769.3,329.4,25.1,21.9],[992.6,329.4,25.8,21.9],[1021.0,329.4,25.8,22.6],[1049.0,329.4,26.4,22.6],[1077.4,329.4,26.4,21.9],[1105.8,329.4,26.4,22.6],[1134.1,329.4,26.4,22.6],[373.5,330.0,26.4,21.9],[402.9,330.0,27.1,21.3],[432.2,330.0,26.4,21.9],[460.9,330.0,25.8,21.9],[489.5,330.0,26.4,21.3],[518.9,330.0,25.8,21.9],[547.2,330.0,25.8,21.9],[797.7,330.0,25.1,21.9],[825.4,330.0,25.1,21.9],[852.4,330.0,25.1,21.9],[880.2,330.0,25.1,21.9],[907.9,330.0,25.1,21.3],[935.3,330.0,25.8,21.9],[963.0,330.0,25.8,21.3],[1163.4,330.0,27.1,21.9],[1192.4,330.0,27.1,21.9],[1221.5,330.0,27.1,21.9],[1250.5,330.0,27.1,21.9],[1279.5,330.0,27.1,21.9],[98.3,359.0,27.7,21.9],[127.9,359.0,27.7,21.9],[158.2,359.0,27.7,21.9],[187.9,359.0,27.7,21.9],[218.2,359.0,27.7,21.9],[248.5,359.0,27.7,21.9],[278.5,359.0,27.1,21.9],[308.4,359.0,26.4,21.9],[338.1,359.0,26.4,21.9],[369.0,359.0,26.4,21.9],[398.7,359.0,26.4,21.9],[428.3,359.0,26.4,21.9],[458.0,359.0,26.4,21.9],[487.3,359.0,27.1,21.9],[516.9,359.0,27.1,21.9],[546.3,359.0,26.4,21.9],[575.9,359.0,25.1,21.9],[604.0,359.0,25.8,21.9],[632.0,359.0,25.1,21.9],[659.7,359.0,25.1,21.9],[686.8,359.0,25.1,21.9],[714.5,359.0,25.1,21.9],[742.2,359.0,25.1,21.9],[769.9,359.0,25.1,21.9],[798.9,359.0,25.1,21.9],[826.3,359.0,25.8,21.9],[854.1,359.0,25.8,21.9],[882.1,359.0,26.4,21.9],[910.1,359.0,25.8,21.9],[937.8,359.0,25.8,21.9],[965.9,359.0,26.4,21.9],[996.2,359.0,26.4,21.9],[1024.5,359.0,26.4,21.9],[1052.9,359.0,26.4,21.9],[1081.6,359.0,27.1,21.9],[1110.3,359.0,26.4,21.9],[1139.0,359.0,27.1,21.9],[1168.9,359.0,27.7,21.9],[1198.3,359.0,27.1,21.9],[1227.6,359.0,27.7,21.9],[1257.2,359.0,27.7,21.9],[1286.6,359.0,27.1,21.9]],"kurve":[[182.7,154.1,26.4,20.0],[211.1,154.1,26.4,20.0],[239.8,154.1,25.8,20.0],[267.8,154.1,26.4,20.0],[296.8,154.1,26.4,20.0],[325.2,154.1,26.4,20.0],[353.9,154.1,25.8,20.0],[559.8,154.1,25.1,20.0],[588.5,154.1,24.5,20.0],[616.2,154.1,24.5,20.0],[643.9,154.1,24.5,20.0],[672.6,154.1,25.1,20.0],[701.6,154.1,25.1,20.0],[889.8,154.1,25.1,20.0],[918.5,154.1,25.8,20.0],[947.2,154.1,25.1,20.0],[975.9,154.1,25.8,20.0],[1004.2,154.1,25.8,20.0],[1032.9,154.1,26.4,20.0],[383.8,154.7,26.4,19.3],[413.5,154.7,26.4,19.3],[442.5,154.7,26.4,19.3],[471.5,154.7,26.4,19.3],[500.5,154.7,26.4,19.3],[529.2,154.7,25.8,19.3],[732.9,154.7,25.8,19.3],[763.5,154.7,26.4,19.3],[794.8,154.7,27.1,19.3],[826.7,154.7,27.7,19.3],[858.2,154.7,27.7,19.3],[1063.2,154.7,26.4,19.3],[1092.9,154.7,27.7,19.3],[1122.5,154.7,27.7,19.3],[1152.8,154.7,27.7,19.3],[1182.5,154.7,27.7,19.3],[1212.1,154.7,27.7,19.3],[176.6,181.1,27.1,20.0],[205.0,181.1,27.1,20.6],[234.0,181.1,27.1,20.0],[262.0,181.1,26.4,20.0],[291.0,181.1,27.7,20.6],[319.7,181.1,27.1,20.6],[349.0,181.1,27.7,20.0],[558.2,181.1,25.8,20.6],[587.5,181.1,25.1,20.6],[615.6,181.1,24.5,20.0],[643.9,181.1,24.5,20.0],[672.3,181.1,24.5,20.6],[701.3,181.1,25.8,20.6],[891.1,181.1,25.1,20.0],[920.1,181.1,25.1,20.6],[949.4,181.1,25.8,20.0],[978.5,181.1,25.8,20.0],[1006.8,181.1,25.8,20.6],[1035.5,181.1,26.4,20.0],[380.6,181.8,27.7,20.0],[410.3,181.8,27.7,20.0],[439.9,181.8,26.4,20.0],[468.9,181.8,26.4,20.0],[497.9,181.8,26.4,20.0],[527.3,181.8,27.1,20.0],[732.9,181.8,27.1,20.0],[763.8,181.8,27.1,20.0],[795.1,181.8,27.7,20.0],[827.3,181.8,27.7,20.0],[858.9,181.8,27.7,20.0],[1066.8,181.8,27.1,20.0],[1097.1,181.8,28.4,20.0],[1127.3,181.8,28.4,20.0],[1158.3,181.8,28.4,20.0],[1188.6,181.8,28.4,20.0],[1217.9,181.8,29.0,20.0],[169.2,208.8,27.7,20.0],[198.5,208.8,27.1,20.0],[226.9,208.8,27.1,20.0],[256.2,208.8,27.7,20.0],[285.2,208.8,27.7,20.0],[314.5,208.8,27.1,20.0],[344.2,208.8,27.1,20.6],[375.8,208.8,28.4,20.6],[406.4,208.8,27.7,20.6],[436.7,208.8,27.7,20.6],[466.0,208.8,27.1,20.6],[495.7,208.8,27.1,20.6],[525.3,208.8,27.1,20.6],[557.2,208.8,26.4,20.0],[586.6,208.8,25.8,20.0],[614.9,208.8,24.5,20.0],[643.3,208.8,24.5,20.0],[672.0,208.8,25.1,20.0],[701.6,208.8,25.1,20.0],[733.2,208.8,26.4,20.6],[764.1,208.8,27.7,20.6],[795.7,208.8,27.7,20.6],[827.9,208.8,27.7,20.6],[859.9,208.8,28.4,20.6],[892.4,208.8,25.1,20.0],[921.7,208.8,25.8,20.0],[951.4,208.8,25.8,20.0],[980.4,208.8,25.8,20.0],[1009.4,208.8,25.8,20.0],[1038.7,208.8,26.4,20.0],[1070.3,208.8,27.7,20.6],[1100.9,208.8,28.4,20.6],[1131.9,208.8,28.4,20.6],[1162.8,208.8,28.4,20.6],[1194.1,208.8,29.0,20.6],[1224.7,208.8,29.7,20.6],[161.8,236.6,28.4,20.6],[191.1,236.6,27.7,20.6],[220.1,236.6,27.7,20.6],[249.1,236.6,27.7,20.6],[278.8,236.6,27.7,20.6],[308.4,236.6,27.7,20.6],[338.7,236.6,27.7,20.6],[555.3,236.6,26.4,20.6],[585.3,236.6,25.8,20.6],[613.6,236.6,25.8,20.6],[643.0,236.6,25.1,20.6],[672.0,236.6,25.1,20.6],[701.3,236.6,25.8,20.6],[893.7,236.6,26.4,20.6],[924.0,236.6,26.4,20.6],[953.6,236.6,26.4,20.6],[983.0,236.6,27.1,20.6],[1012.6,236.6,27.1,20.6],[1042.6,236.6,27.7,20.6],[370.6,237.2,28.4,20.0],[401.9,237.2,29.0,20.0],[432.5,237.2,28.4,20.0],[463.1,237.2,27.7,20.0],[493.4,237.2,27.7,20.0],[523.1,237.2,27.7,20.0],[733.2,237.2,27.7,20.0],[764.1,237.2,27.7,20.0],[796.4,237.2,29.0,20.0],[828.9,237.2,28.4,20.0],[861.1,237.2,28.4,20.0],[1074.5,237.2,28.4,20.0],[1105.4,237.2,29.7,20.0],[1136.7,237.2,29.0,20.0],[1168.0,237.2,29.7,20.0],[1199.5,237.2,29.7,20.0],[1231.8,237.2,29.7,20.0],[153.7,264.9,27.7,20.6],[183.1,264.9,27.1,20.6],[212.4,264.9,27.7,20.6],[242.0,264.9,27.7,20.6],[272.0,264.9,28.4,20.6],[301.7,264.9,28.4,20.6],[332.6,264.9,28.4,20.6],[365.1,264.9,29.0,20.6],[396.7,264.9,29.0,20.6],[428.3,264.9,29.0,20.6],[459.3,264.9,27.7,20.6],[490.8,264.9,27.7,20.6],[521.5,264.9,28.4,20.6],[554.0,264.9,26.4,20.6],[583.7,264.9,26.4,20.6],[613.0,264.9,25.8,20.6],[642.0,264.9,25.8,20.6],[671.6,264.9,25.8,20.6],[701.6,264.9,26.4,20.6],[733.5,264.9,27.1,20.6],[764.8,264.9,27.7,20.6],[797.0,264.9,27.7,20.6],[829.6,264.9,28.4,20.6],[862.4,264.9,28.4,20.6],[895.9,264.9,27.1,20.6],[926.6,264.9,26.4,20.6],[956.9,264.9,26.4,20.6],[986.8,264.9,27.1,20.6],[1017.1,264.9,27.1,20.6],[1047.4,264.9,28.4,20.6],[1079.7,264.9,28.4,20.6],[1111.2,264.9,29.7,20.6],[1142.8,264.9,29.7,20.6],[1174.7,264.9,30.3,20.6],[1207.3,264.9,29.7,20.6],[1238.9,264.9,30.9,20.6],[205.0,292.6,28.4,21.3],[295.9,292.6,28.4,21.3],[641.7,292.6,26.4,21.3],[671.6,292.6,25.8,21.3],[701.6,292.6,26.4,21.3],[897.6,292.6,27.7,21.3],[990.4,292.6,27.7,21.3],[1021.0,292.6,28.4,21.3],[145.3,293.3,29.0,20.6],[175.6,293.3,27.7,20.6],[235.3,293.3,27.1,20.6],[265.6,293.3,28.4,20.6],[326.8,293.3,28.4,20.6],[360.0,293.3,29.0,20.6],[392.2,293.3,29.0,20.6],[424.1,293.3,29.7,20.6],[455.7,293.3,28.4,20.6],[487.6,293.3,29.0,20.6],[518.9,293.3,28.4,20.6],[551.7,293.3,27.1,20.6],[582.4,293.3,26.4,20.6],[612.3,293.3,25.8,20.6],[733.8,293.3,27.7,20.6],[765.4,293.3,27.7,20.6],[797.7,293.3,29.0,20.6],[830.5,293.3,29.0,20.6],[863.4,293.3,29.0,20.6],[929.1,293.3,27.7,20.6],[960.1,293.3,27.7,20.6],[1051.9,293.3,28.4,20.6],[1084.5,293.3,29.0,20.6],[1116.1,293.3,30.3,20.6],[1148.3,293.3,30.3,20.6],[1181.2,293.3,30.3,20.6],[1213.4,293.3,30.3,20.6],[1245.3,293.3,30.9,21.3],[137.6,321.6,29.0,20.6],[167.9,321.6,27.7,20.6],[197.9,321.6,28.4,20.6],[228.8,321.6,28.4,20.6],[259.1,321.6,28.4,20.6],[290.1,321.6,28.4,20.6],[321.3,321.6,29.0,21.3],[354.8,321.6,29.0,21.3],[387.4,321.6,29.7,21.3],[419.6,321.6,29.7,21.3],[452.2,321.6,29.0,21.3],[484.7,321.6,28.4,21.3],[516.9,321.6,28.4,21.3],[550.1,321.6,27.7,20.6],[580.8,321.6,27.1,20.6],[611.4,321.6,26.4,20.6],[641.3,321.6,27.1,20.6],[671.3,321.6,26.4,20.6],[701.6,321.6,26.4,20.6],[733.8,321.6,27.7,21.3],[766.1,321.6,29.0,21.3],[798.3,321.6,29.0,21.3],[831.8,321.6,29.0,21.3],[865.0,321.6,29.7,21.3],[899.2,321.6,28.4,20.6],[931.1,321.6,27.7,20.6],[962.7,321.6,27.7,20.6],[993.6,321.6,27.7,20.6],[1024.2,321.6,28.4,20.6],[1055.5,321.6,29.0,20.6],[1088.7,321.6,29.7,21.3],[1121.2,321.6,30.3,21.3],[1154.1,321.6,30.3,21.3],[1187.0,321.6,30.3,21.3],[1219.8,321.6,31.6,21.3],[1253.4,321.6,30.3,21.3],[579.5,349.4,28.4,21.3],[701.6,349.4,26.4,21.3],[1027.4,349.4,28.4,21.3],[1059.0,349.4,28.4,21.9],[129.9,350.0,29.0,20.6],[160.8,350.0,29.0,20.6],[191.1,350.0,29.0,20.6],[222.1,350.0,29.0,20.6],[253.0,350.0,29.0,20.6],[284.3,350.0,29.7,20.6],[315.2,350.0,29.7,21.3],[349.4,350.0,29.7,21.3],[382.6,350.0,30.3,21.3],[415.4,350.0,30.3,21.3],[448.3,350.0,30.3,21.3],[481.5,350.0,29.7,21.3],[514.7,350.0,29.0,21.3],[548.2,350.0,27.7,21.3],[610.1,350.0,27.7,20.6],[641.0,350.0,26.4,20.6],[671.3,350.0,26.4,20.6],[734.2,350.0,28.4,21.3],[766.7,350.0,29.0,21.3],[799.3,350.0,29.7,21.3],[833.4,350.0,29.7,21.3],[866.9,350.0,29.7,21.3],[901.1,350.0,28.4,21.3],[933.3,350.0,28.4,21.3],[964.9,350.0,28.4,20.6],[996.2,350.0,29.0,20.6],[1093.2,350.0,30.9,21.3],[1126.4,350.0,30.3,21.3],[1159.9,350.0,30.3,21.3],[1192.8,350.0,31.6,21.3],[1226.9,350.0,31.6,21.3],[1260.8,350.0,30.9,21.3]]};   // V5.2: Sitze aus den neuen Tribünenbildern (Haupttribüne 8 × 42, hinterm Tor 8 × 36)
  const stadionBereit = () => Object.values(STADION).every(i => i.complete && i.naturalWidth);
  // V5.3: Zuschauer = dieselben Figuren wie die Spieler (Kopf aus den Figurenblättern, Körper vom Spiel gezeichnet), einmal pro Spiel in ihren Posen gerendert
  function figurAlsBild(o, sitz, arme){
    const W = 110, H = 170, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });   // V5.5: Auslesen ohne Bremse
    const alt = { px: kam.pos.x, py: kam.pos.y, pz: kam.pos.z, r: kam.r, u: kam.u, v: kam.v, f: kam.f, w: kam.w, h: kam.h };
    const PX = 34;   // Pixel pro Meter in der Bildmitte
    kam.w = W; kam.h = H; kam.pos.set(0, .9, 12); kam.r = [1, 0, 0]; kam.u = [0, 1, 0]; kam.v = [0, 0, -1]; kam.f = 12 * PX;
    try {
      o.p.set(0, 0, 0); o.v.set(0, 0, 0); o.blick.set(0, 0, 1);
      animiereFigur(o, .2, 0);
      o.zeichen.intens = 0; o.zeichen.pose = sitz ? 'sitzen' : null; o.zeichen.huefteFest = sitz ? .32 : null; o.zeichen.ansicht = 'v'; o.zeichen.dx = 0; o.zeichen.dzw = 1;
      o.zeichen.armPose = arme || null;
      zeichneFigur(g, o);
    } finally {
      kam.pos.set(alt.px, alt.py, alt.pz); kam.r = alt.r; kam.u = alt.u; kam.v = alt.v; kam.f = alt.f; kam.w = alt.w; kam.h = alt.h;
    }
    const fussY = H / 2 + .9 * PX, s = PX, hueftY = fussY - (sitz ? .32 : .53) * s * 1.4 * .79;
    // sitzend: nur bis knapp unter die Knie zeigen – die Unterschenkel verdeckt die Reihe davor (wie im echten Stadion)
    let oben = H; { const d = g.getImageData(0, 0, W, H).data; for (let y = 0; y < H && oben === H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20){ oben = y; break; } }
    return { c, fussY, hueftY, s, oben };
  }
  function fanSpriteListe(){
    if (welt.fanSprites && welt.fanSprites.fertig) return welt.fanSprites;
    if (!welt.fanSprites){
      const keys = Object.keys(SPRITE_META).filter(k => SPRITES[k + '_v']);
      const ALLTAG = ['#1b1b1b', '#4a4f5c', '#1d2b5a', '#2f7a33', '#ff8a1f', '#8b45d6', '#e8e8e8', '#7a4a2a', '#19a5a5', '#c9a227'];
      const kitFuer = (team, i) => {
        const k = team >= 0 ? s.kits[team] : null;
        const t = k ? (i % 5 === 4 ? k.h : k.t) : ALLTAG[i % ALLTAG.length];
        return { t, kragen: k ? (k.kragen || k.n) : '#ffffff', n: k ? k.n : '#ffffff', h: k ? k.h : ['#1f2a44', '#2b2b2b', '#3a4f7a'][i % 3], s: k ? (k.s || k.h) : '#222', sBand: [], schuh: [['#f4f4f4'], ['#1b1b1b'], ['#c0392b']][i % 3], land: null };
      };
      const gruppe = (team, n, seed) => Array.from({ length: n }, (_, i) => {
        const key = keys[(i * 7 + seed * 13) % keys.length];
        const tm = team === 'mix' ? (i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : -1) : (i % 7 === 6 ? -1 : team);
        return randFigur(key, Math.max(0, tm), kitFuer(tm, i), '');
      });
      welt.fanSprites = { fertig: false, figuren: { heim: gruppe(0, 16, 1), gast: gruppe(1, 16, 2), mix: gruppe('mix', 16, 3) } };
      return null;
    }
    const fs = welt.fanSprites, alle = [...fs.figuren.heim, ...fs.figuren.gast, ...fs.figuren.mix];
    if (!alle.every(o => o.torsoV && o.kopfV)) return null;   // Trikots/Köpfe noch nicht fertig
    // V5.5: Figuren einzeln mit Zeitbudget (ca. 4 ms pro Bild) – kein Einbruch beim Einlaufen
    const t0 = performance.now();
    for (const gr of ['heim', 'gast', 'mix']){
      const fertig = fs['_' + gr] || (fs['_' + gr] = []);
      while (fertig.length < fs.figuren[gr].length){
        if (performance.now() - t0 > 4) return null;
        const o = fs.figuren[gr][fertig.length]; fertig.push({ sitz: figurAlsBild(o, true), jubel: figurAlsBild(o, false, 'fan') });
      }
      fs[gr] = fertig;
    }
    fs.fertig = true;
    return fs;
  }
  const fanHash = (a, b) => { let x = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; x = (x ^ (x >>> 13)) * 1274126177; return Math.abs(x ^ (x >>> 16)); };
  // Bild 0 = ruhig sitzen, 1 und 2 = Torjubel (aufstehen, beide Arme hoch – zwei Gruppen im Wechsel, damit es lebendig wirkt)
  const fanJubelt = (hz, fr) => fr === 0 ? false : fr === 1 ? (hz >> 13) % 100 < 75 : (hz >> 17) % 100 < 75;
  // 2.5D: jede Sitzreihe wird ein eigenes, aufrechtes Bild, das auf seiner Stufe steht (Unterkante = Sitzkante)
  function fanReihen(img, sitze, gruppe, leer, seed){
    const liste = welt.fanSprites[gruppe], iw = img.naturalWidth, ih = img.naturalHeight;
    const q = sitze.map(x => x[3]).sort((a, b) => a - b), pm = (q[q.length >> 1] || 10) / .5;   // Pixel pro Meter (Sitz ~0,5 m hoch)
    const reihen = [];
    sitze.forEach((z, i) => { const r = reihen[reihen.length - 1]; if (r && Math.abs(z[1] - r.y) < z[3] * .5) r.l.push([z, i]); else reihen.push({ y: z[1], l: [[z, i]] }); });
    return reihen.map((r, ri) => {
      const vorne = ri === reihen.length - 1;   // vorderste Reihe: Brüstung verdeckt die Beine
      const fans = []; let unten = 0, hoch = 0, tief = 0;
      const sitzPlaetze = r.l.map(([q]) => q);
      r.l.forEach(([[x, y, sw, sh], i]) => {
        unten += y + sh * .97;
        const hz = fanHash(i + seed * 1000, 17);
        if (hz % 100 < leer * 100) return;
        const fan = liste[(hz >> 3) % liste.length], sk = pm / fan.sitz.s * .95;
        hoch = Math.max(hoch, (fan.jubel.fussY - fan.jubel.oben) * sk, (fan.sitz.hueftY - fan.sitz.oben) * sk + sh * .1);
        if (!vorne) tief = Math.max(tief, (fan.sitz.fussY - fan.sitz.hueftY) * sk - sh * .07);   // Sitzbeine bis zu den Schuhen
        fans.push({ x, hz, fan, sk, sh });
      });
      unten /= r.l.length; hoch = Math.ceil(hoch) + 2; tief = Math.ceil(Math.max(0, tief));
      const H = hoch + tief;   // Sitzkante liegt bei y = hoch, darunter die Beine
      const machen = () => [0, 1, 2].map(fr => leinwand(iw, H, g => {
        // die eigenen Sitze dieser Reihe: stehen vor den Beinen der Reihe dahinter (Lehnen verdecken die Unterschenkel)
        for (const [x, y, sw, sh] of sitzPlaetze) g.drawImage(img, x - sw / 2, y, sw, sh, x - sw / 2, hoch - sh * .97, sw, sh);
        for (const f of fans){
          const steht = fanJubelt(f.hz, fr), b = steht ? f.fan.jubel : f.fan.sitz, k = f.sk;
          const ay = steht ? b.fussY : b.hueftY, zielY = steht ? hoch : hoch - f.sh * .07;   // stehend: Füße auf der Sitzkante, sitzend: Hüfte auf der Sitzfläche
          g.drawImage(b.c, f.x - b.c.width / 2 * k, zielY - ay * k, b.c.width * k, b.c.height * k);
        }
        if (vorne) g.clearRect(0, hoch, iw, H);
      }));
      const reihe = { v: 1 - unten / ih, hochAnteil: H / iw, tiefAnteil: tief / iw, bilder: null };
      (welt.fanJobs || (welt.fanJobs = [])).push(() => { reihe.bilder = machen(); });   // V5.5: wird nach und nach gezeichnet
      return reihe;
    });   // Reihen von oben (hinten) nach unten (vorne) – hinterste Reihe wird zuerst gezeichnet
  }
  function stadionFans(){
    if (welt.stadionFans) return welt.stadionFans;
    if (!stadionBereit() || !s || !s.kits || !fanSpriteListe()) return null;
    const ff = s.fanFuellung || { heim: .9, gast: .9, mix: .8 }, leer = gr => klemme(1 - ff[gr], .03, .92);   // V5.3: Beliebtheit / Heim-Auswärts
    // V5.5: Tribünen nacheinander aufbauen (eine pro Bild), bis dahin werden sie ohne Fans gezeichnet
    const bau = welt.fanBau || (welt.fanBau = { haupt: {}, kurve: {}, n: 0 });
    const auftraege = [['haupt', 'heim', 1], ['haupt', 'mix', 2], ['haupt', 'gast', 3], ['kurve', 'heim', 4], ['kurve', 'gast', 5]];
    while (bau.n < auftraege.length){ const [tr, gr, seed] = auftraege[bau.n], kurve = tr === 'kurve'; bau[tr][gr] = fanReihen(kurve ? STADION.kurve : STADION.haupt, kurve ? SITZE.kurve : SITZE.haupt, gr, leer(gr) * (kurve ? .7 : 1), seed); bau.n++; }
    // Reihenbilder mit Zeitbudget abarbeiten (ca. 4 ms pro Bild)
    const t0 = performance.now(), jobs = welt.fanJobs || [];
    while (jobs.length && performance.now() - t0 < 4) jobs.shift()();
    if (!jobs.length) welt.stadionFans = bau;
    return bau;
  }
  // Bild auf eine schräge Fläche im Raum legen (A = unten links, B = unten rechts, C = oben links), in kleinen Stücken
  function zeichneBildFlaeche(g, img, A, B, C, nx, ny){
    const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight, W = kam.w, H = kam.h;
    const pt = (u, v) => [A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v, A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v, A[2] + (B[2] - A[2]) * u + (C[2] - A[2]) * v];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){
      const u0 = i / nx, u1 = (i + 1) / nx, v0 = j / ny, v1 = (j + 1) / ny;
      const w00 = pt(u0, v1), w10 = pt(u1, v1), w01 = pt(u0, v0), w11 = pt(u1, v0);
      if (tiefe(...w00) < NAH || tiefe(...w10) < NAH || tiefe(...w01) < NAH || tiefe(...w11) < NAH) continue;
      const a = P(...w00), b = P(...w10), c = P(...w01), d = P(...w11);
      const mnx = Math.min(a.x, b.x, c.x, d.x), mxx = Math.max(a.x, b.x, c.x, d.x), mny = Math.min(a.y, b.y, c.y, d.y), mxy = Math.max(a.y, b.y, c.y, d.y);
      if (mxx < 0 || mnx > W || mxy < 0 || mny > H) continue;
      // Parallelogramm aus den Kantenmitten (gleicht die Perspektive im Stück aus), minimal überlappend
      const ux = (b.x + d.x - a.x - c.x) / 2, uy = (b.y + d.y - a.y - c.y) / 2, vx = (c.x + d.x - a.x - b.x) / 2, vy = (c.y + d.y - a.y - b.y) / 2;
      const ox = (a.x + b.x + c.x + d.x) / 4 - (ux + vx) / 2, oy = (a.y + b.y + c.y + d.y) / 4 - (uy + vy) / 2;
      g.save(); g.transform(ux, uy, vx, vy, ox - (ux + vx) * .006, oy - (uy + vy) * .006);
      g.drawImage(img, u0 * iw, (1 - v1) * ih, iw / nx, ih / ny, 0, 0, 1.012, 1.012);
      g.restore();
    }
  }
  function zeichneStadion(g){
    const fans = stadionFans(), fein = grafikProfil() === GRAFIK.low ? .6 : 1;
    // Torjubel: die Fans der Mannschaft, die getroffen hat, springen auf und reißen die Arme hoch – die anderen bleiben sitzen
    const jubelFr = s.phase === 'tor' ? 1 + Math.floor(performance.now() / 260) % 2 : 0, torTeam = s.letztTorTeam;
    const frFuer = gruppe => !jubelFr ? 0 : gruppe === 'mix' ? jubelFr : ((gruppe === 'heim') === (torTeam === 0) ? jubelFr : 0);
    const reihenNx = Math.max(2, Math.round(3 * fein));   // V5.5: weniger Teilstücke pro Reihe (spart Zeichenarbeit)
    // Flutlichtmasten hinter der Haupttribüne
    for (const sx of [-1, 1]){
      const x = sx * (HL + 11), z = -(HB + 11), hoch = 21, br = hoch * STADION.licht.naturalWidth / STADION.licht.naturalHeight;
      zeichneBildFlaeche(g, STADION.licht, [x - br / 2, 0, z], [x + br / 2, 0, z], [x - br / 2, hoch, z], 1, 2);
      if (s.nacht){ const q = P(x, hoch - 2.5, z), r0 = 7 * q.s; const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r0); gr.addColorStop(0, 'rgba(255,250,210,.55)'); gr.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = gr; g.fillRect(q.x - r0, q.y - r0, r0 * 2, r0 * 2); }
    }
    // Haupttribüne: drei Abschnitte (links Heim, Mitte gemischt, rechts Gäste)
    const XA = -HL - 14, XE = HL + 14, n = 3, bw = (XE - XA) / n, zu = -(HB + 4.4), zo = -(HB + 9.8), yo = 9.5;   // Seitenverhältnis wie das Bild (3:1)
    const gruppen = ['heim', 'mix', 'gast'];
    for (let i = 0; i < n; i++){
      const x0 = XA + i * bw;
      zeichneBildFlaeche(g, STADION.haupt, [x0, 0, zu], [x0 + bw, 0, zu], [x0, yo, zo], Math.round(6 * fein), Math.round(3 * fein));
      if (fans){ const fr = frFuer(gruppen[i]); for (const r of (fans.haupt[gruppen[i]] || [])){ if (!r.bilder) continue;
        const Y = r.v * yo - r.tiefAnteil * bw, Z = zu + r.v * (zo - zu), H = r.hochAnteil * bw;
        zeichneBildFlaeche(g, r.bilder[fr], [x0, Y, Z], [x0 + bw, Y, Z], [x0, Y + H, Z], reihenNx, 1);
      } }
    }
    // Tribünen hinter den Toren (links Heimfans, rechts Gästefans), je zwei Stücke entlang der Torlinie
    for (const sx of [-1, 1]){
      const gr = sx < 0 ? 'heim' : 'gast', reihen = fans ? (fans.kurve[gr] || null) : null, fr = frFuer(gr);
      const xu = sx * (HL + 4.6), xo = sx * (HL + 9.6), z0 = -(HB + 6), z1 = HB + 5, stueck = (z1 - z0) / 2, hk = 8.5;
      for (let k = 0; k < 2; k++){
        let za = z0 + k * stueck, zb = za + stueck;
        if (sx < 0){ const t = za; za = zb; zb = t; }   // Bild immer vom Spielfeld aus gesehen richtig herum
        zeichneBildFlaeche(g, STADION.kurve, [xu, 0, za], [xu, 0, zb], [xo, hk, za], Math.round(10 * fein), Math.round(3 * fein));
        if (reihen) for (const r of reihen){ if (!r.bilder) continue;
          const X = xu + r.v * (xo - xu), Y = r.v * hk - r.tiefAnteil * stueck, H = r.hochAnteil * stueck;
          zeichneBildFlaeche(g, r.bilder[fr], [X, Y, za], [X, Y, zb], [X, Y + H, za], reihenNx, 1);
        }
      }
    }
  }
  // V3.0: Spielertunnel (Mitte Gegengerade) und die beiden Auswechselbänke daneben
  const bankBilder = {};
  function bankBild(key){ if (!bankBilder[key] && SPRITES[key + '_v']) bankBilder[key] = neuesBild(SPRITES[key + '_v']); return bankBilder[key]; }
  function zeichneTunnelUndBank(g){
    const nacht = s.nacht, X = TUN_X, Z0 = TUN_Z0, Z1 = TUN_Z1, Hh = TUN_H;
    const wand = nacht ? '#2a3350' : '#4a5677', wandH = nacht ? '#36416a' : '#64739a', dach = nacht ? '#1d2440' : '#33405f';
    if (!s.halle){   // HALL OF FAME: kein Spielertunnel in der Halle
    // Seitenwände (aus Kamerasicht sieht man die Innenseiten)
    g.fillStyle = wand;
    vieleck(g, [[-X, 0, Z1], [-X, 0, Z0], [-X, Hh, Z0], [-X, Hh, Z1]]); g.fill();
    vieleck(g, [[X, 0, Z1], [X, 0, Z0], [X, Hh, Z0], [X, Hh, Z1]]); g.fill();
    // dunkles Inneres
    const ig = P(0, 0, Z1), io = P(0, Hh, Z1);
    const gr = g.createLinearGradient(0, io.y, 0, ig.y); gr.addColorStop(0, '#05070f'); gr.addColorStop(1, '#1a2034');
    g.fillStyle = gr; vieleck(g, [[-X + .25, 0, Z1], [X - .25, 0, Z1], [X - .25, Hh - .2, Z1], [-X + .25, Hh - .2, Z1]]); g.fill();
    // Boden im Tunnel
    g.fillStyle = nacht ? '#2b2f3c' : '#5b5f6b';
    vieleck(g, [[-X, 0, Z1], [X, 0, Z1], [X, 0, Z0], [-X, 0, Z0]]); g.fill();
    // Licht vom Spielfeld in den Tunnel
    g.fillStyle = 'rgba(255,255,255,.07)'; vieleck(g, [[-X, .02, Z0], [X, .02, Z0], [X * .7, .02, Z1], [-X * .7, .02, Z1]]); g.fill();
    // Dach und Stirnseite mit Schriftzug
    g.fillStyle = dach; vieleck(g, [[-X - .25, Hh, Z1], [X + .25, Hh, Z1], [X + .25, Hh, Z0 + .15], [-X - .25, Hh, Z0 + .15]]); g.fill();
    g.fillStyle = wandH; vieleck(g, [[-X - .25, Hh - .5, Z0 + .15], [X + .25, Hh - .5, Z0 + .15], [X + .25, Hh + .05, Z0 + .15], [-X - .25, Hh + .05, Z0 + .15]]); g.fill();
    { const a = P(0, Hh - .22, Z0 + .15), k = a.s; if (k > 2){ g.fillStyle = '#ffe234'; g.font = '900 ' + Math.max(7, .32 * k) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SILESCROW', a.x, a.y); } }
    // Pfosten vorne
    g.fillStyle = wandH;
    for (const sx of [-1, 1]){ vieleck(g, [[sx * (X + .25), 0, Z0 + .15], [sx * X, 0, Z0 + .15], [sx * X, Hh, Z0 + .15], [sx * (X + .25), Hh, Z0 + .15]]); g.fill(); }
    }
    // V3.0: offene Bänke (Sitzbank mit niedriger Lehne, kleines Glasdach) – die Spieler sitzen sichtbar davor
    for (const team of [0, 1]){
      const sx = team === 0 ? -1 : 1, xa = sx * (X + 1.1), xe = sx * (X + 5.6), zl = -(HB + 1.75), zs = -(HB + 1.35);
      const lo = Math.min(xa, xe), hi = Math.max(xa, xe);
      const kit = s.kits && s.kits[team] ? s.kits[team] : { t: team ? '#e8343c' : '#2a64e0' };
      // kleines Glasdach auf zwei Stangen
      g.strokeStyle = nacht ? '#8090b8' : '#aab4c8'; g.lineWidth = 1.5;
      for (const xs of [lo + .1, hi - .1]){ const a = P(xs, 0, zl), b = P(xs, 1.95, zl); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      g.fillStyle = 'rgba(200,230,255,.16)'; vieleck(g, [[lo, 1.95, zl - .1], [hi, 1.95, zl - .1], [hi, 1.8, zs + .5], [lo, 1.8, zs + .5]]); g.fill();
      g.strokeStyle = 'rgba(230,240,255,.5)'; g.lineWidth = 1; g.stroke();
      // niedrige Lehne in Teamfarbe
      g.fillStyle = kit.t || '#555'; vieleck(g, [[lo, .3, zl], [hi, .3, zl], [hi, .85, zl], [lo, .85, zl]]); g.fill();
      g.fillStyle = 'rgba(0,0,0,.3)'; vieleck(g, [[lo, .3, zl], [hi, .3, zl], [hi, .37, zl], [lo, .37, zl]]); g.fill();
      // Sitzfläche
      g.fillStyle = nacht ? '#2b3350' : '#3b4566'; vieleck(g, [[lo, .3, zl], [hi, .3, zl], [hi, .3, zs], [lo, .3, zs]]); g.fill();
    }
  }
  let uhrCache = '';
  function zeigeEigenenSpieler(g){
    const c = s.steuer; if (!c || !c.aktiv) return;
    const W = kam.w, H = kam.h, q = P(c.p.x, 1.1, c.p.z), rand = 34;
    if (q.x > rand && q.x < W - rand && q.y > 70 && q.y < H - rand) return;
    const x = klemme(q.x, rand, W - rand), y = klemme(q.y, 76, H - rand);
    const a = Math.atan2(q.y - y, q.x - x);
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(10,18,51,.85)'; g.strokeStyle = '#ffe234'; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, 19, 0, Math.PI * 2); g.fill(); g.stroke();
    g.save(); g.rotate(a); g.fillStyle = '#ffe234'; g.beginPath(); g.moveTo(30, 0); g.lineTo(19, -8); g.lineTo(19, 8); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#fff'; g.font = 'bold 17px "Bangers", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(c.nummer || ''), 0, 1);
    g.restore();
  }
  function zeichneFlutlicht(g){
    const W = kam.w, H = kam.h;
    g.save(); g.globalCompositeOperation = 'lighter';
    // Flutlicht-Strahler oben in den Ecken (auch wenn die Masten außerhalb des Bildes stehen)
    for (const fx of [.06, .94]){
      const gl = g.createRadialGradient(W * fx, -H * .02, 0, W * fx, -H * .02, H * .55);
      gl.addColorStop(0, 'rgba(255,252,230,.55)'); gl.addColorStop(.2, 'rgba(255,248,210,.22)'); gl.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = gl; g.fillRect(0, 0, W, H * .6);
    }
    for (const sx of [-1, 1]){
      const b = P(kamZiel.x + sx * 17, 10.5, -(HB + 5));
      // Lichtkegel auf den Rasen
      const z1 = P(sx * (HL * .2), 0, -HB * .2), z2 = P(sx * (HL * .9), 0, HB * .6);
      const kg = g.createLinearGradient(b.x, b.y, (z1.x + z2.x) / 2, (z1.y + z2.y) / 2);
      kg.addColorStop(0, 'rgba(255,250,225,.22)'); kg.addColorStop(1, 'rgba(255,250,225,0)');
      g.fillStyle = kg; g.beginPath(); g.moveTo(b.x - 1.5 * b.s, b.y); g.lineTo(z1.x, z1.y); g.lineTo(z2.x, z2.y); g.lineTo(b.x + 1.5 * b.s, b.y); g.closePath(); g.fill();
      // Mast
      const fussM = P(kamZiel.x + sx * 17, 0, -(HB + 5));
      g.save(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#3a4260'; g.lineWidth = Math.max(2, .35 * b.s);
      g.beginPath(); g.moveTo(fussM.x, fussM.y); g.lineTo(b.x, b.y); g.stroke(); g.restore();
      // Glühen der Lampen
      const r = Math.max(30, 6 * b.s);
      const gl = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      gl.addColorStop(0, 'rgba(255,255,240,.95)'); gl.addColorStop(.25, 'rgba(255,248,210,.45)'); gl.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = gl; g.fillRect(b.x - r, b.y - r, 2 * r, 2 * r);
      // kleine Lampenreihe
      g.fillStyle = 'rgba(255,255,255,.95)';
      for (let i = -2; i <= 2; i++) for (let j = 0; j < 2; j++) g.fillRect(b.x + i * .55 * b.s - .2 * b.s, b.y - .5 * b.s + j * .6 * b.s, .4 * b.s, .35 * b.s);
    }
    g.restore();
  }
  function zeichneWetter(g, dt){
    const W = kam.w, H = kam.h;
    if (welt.wetter === 'sonne'){
      // warmes, helles Licht mit Blendung oben rechts
      g.fillStyle = 'rgba(255,214,120,.07)'; g.fillRect(0, 0, W, H);
      const t = performance.now() / 1000;
      const gr = g.createRadialGradient(W * .9, -H * .05, 0, W * .9, -H * .05, H * .9);
      gr.addColorStop(0, 'rgba(255,250,220,.55)'); gr.addColorStop(.25, 'rgba(255,236,170,.22)'); gr.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    if (welt.schnee){
      g.fillStyle = 'rgba(225,235,250,.12)'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (const f of welt.schnee.flocken){
        f[1] += dt * .1 * f[2]; f[3] += dt * 1.4;
        if (f[1] > 1.02){ f[1] = -.02; f[0] = Math.random(); }
        const x = (f[0] + Math.sin(f[3]) * .012) * W, y = f[1] * H, r = 1.2 + f[2] * 1.8;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    }
    zeichneRegen(g, dt);
  }
  function zeichneRegen(g, dt){
    const r = welt.regen; if (!r) return;
    const W = kam.w, H = kam.h;
    g.fillStyle = 'rgba(40,58,80,.16)'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(210,228,255,.45)'; g.lineWidth = 1.2; g.beginPath();
    for (const t of r.tropfen){
      t[1] += dt * 1.25 * t[2]; t[0] += dt * .12;
      if (t[1] > 1){ t[1] -= 1; t[0] = Math.random(); if (Math.random() < .25) r.spritzer.push([Math.random() * W, H * (.35 + Math.random() * .62), 0]); }
      if (t[0] > 1) t[0] -= 1;
      const x = t[0] * W, y = t[1] * H, l = 14 * t[2];
      g.moveTo(x, y); g.lineTo(x - l * .18, y - l);
    }
    g.stroke();
    g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = 1;
    r.spritzer = r.spritzer.filter(sp => { sp[2] += dt; if (sp[2] > .3) return false;
      g.beginPath(); g.ellipse(sp[0], sp[1], 2 + sp[2] * 22, 1 + sp[2] * 7, 0, 0, Math.PI*2); g.stroke(); return true; });
  }

  // Kamera: folgt dem Ball mit Vorausblick, bezieht den eigenen Spieler ein,
  // gleitet frame-unabhängig (kritisch gedämpft) und zoomt bei schnellen Bällen leicht heraus
  const kamF = { x: 0, z: 0, vx: 0, vz: 0, zoom: 1 };
  const KAM_H = 16, KAM_Z = 19;   // 11er-Test: flacher Blick wie im Hauptspiel (ca. 40°), aber weiter weg (Hauptspiel: 12.9 / 15.7)
  // Kamera-Zoom per Plus/Minus (größer = weiter weg), bleibt gespeichert
  const ZOOM_STUFEN = [.8, .9, 1, 1.15, 1.3, 1.5, 1.75];
  const JUBEL_ARTEN = ['', 'hoch', 'faust', 'flieger', 'salto', 'siu', 'herz', 'muskel', 'ohr', 'tanz', 'roboter', 'wiegen', 'kreuz', 'umarmen', 'kopf'];   // V4.6: für die Übertragung zum Mitspieler
  const zoomStufe = 3;   // feste Kamerahöhe (etwas weiter weg als früher), keine Zoom-Knöpfe mehr
  // V4.7: Kamera-Art (TV schwenkend oder klassisch mitfahrend), im Grafikmenü umschaltbar
  const kamTV = { x: 0 };
  function kameraFuehren(dt){
    const b = welt.ball;
    let fx, fz;
    if (s.phase === 'standard' && s.std){
      fx = s.std.ort.x; fz = s.std.ort.z;
      // V3.16: Ecke – Kamera schaut in den Strafraum, damit die Mitspieler sichtbar sind
      if (s.std.typ === 'ecke'){ fx = s.std.ort.x - (s.std.ort.x < 0 ? -1 : 1) * (s.std.ort.z > 0 ? 4 : 9); fz = s.std.ort.z * (s.std.ort.z > 0 ? .58 : .4); }   // nahe Ecke: Kamera zur Fahne; ferne Ecke: mehr Strafraum, weniger Tribüne   // 11er-Test: Ecke – Schütze und Strafraum zusammen im Bild
    }
    else if (s.phase === 'tor' && s.jubelDaten && s.jubelDaten.t > .35){ const q = s.jubelDaten.schuetze; fx = q.p.x; fz = q.p.z; }
    else if (s.phase === 'ausklang' && s.ausklang){ fx = s.ausklang.kx; fz = s.ausklang.kz; }   // V6.2
    else if (s.wStopp && s.wStopp.liste && s.wStopp.liste.length && s.wStopp.liste[0].q.aktiv && s.phase === 'spiel'){ const q = s.wStopp.liste[0].q; fx = q.p.x; fz = q.p.z * 1.05; }   // V9.2: Einwechslung – Kamera beim Spieler, der reinkommt
    else if (s.phase === 'trage' && s.trage){ fx = s.trage.m.x; fz = s.trage.m.z * .7; }   // V5.3: Kamera bei der Trage
    else if ((s.einlauf && s.phase === 'start') || s.phase === 'hzGang'){   // V3.0: Kamera bei den Spielern (Tunnel)
      let sx = 0, sz = 0, n = 0; for (const p of s.spieler) if (p.aktiv && !imTunnel(p)){ sx += p.p.x; sz += p.p.z; n++; }
      fx = n ? sx / n : 0; fz = n ? sz / n : TUN_Z0;
    }
    else {
      // direkt am Ball, nur ein kleiner Vorausblick in Flugrichtung
      fx = b.p.x + b.v.x * .12; fz = b.p.z + b.v.z * .08;
      if (!b.besitzer && Math.hypot(b.v.x, b.v.z) > 6){ fx = b.p.x + b.v.x * .28; fz = b.p.z + b.v.z * .2; }   // V4.9: Pass/Schuss – vorausschauen
      else if (b.besitzer){ fx += b.besitzer.v.x * .35; fz += b.besitzer.v.z * .2; }   // Dribbeln: Platz in Laufrichtung
      if (b.p.y > .8 && !b.besitzer){ fx = b.p.x + b.v.x * .3; fz = b.p.z + b.v.z * .25; }
      if (b.ausEcke && !b.besitzer){ fx = Math.sign(b.p.x || 1) * (HL - 10); fz = klemme(b.p.z * .25, -5, 5); }   // V9.2: Ball kommt von der Ecke – Kamera in den Strafraum   // 11er-Test: hohe Bälle (Ecke, Flanke) – Kamera schaut dorthin, wo der Ball landet
    }
    const sp = Math.hypot(b.v.x, b.v.z);
    let zoomSoll = 1 + klemme((sp - 8) / 40, 0, .12) + (s.phase === 'tor' ? .06 : 0);
    const aspekt = kam.w / Math.max(1, kam.h);
    const breiteBei = zm => Math.hypot(KAM_H, KAM_Z) * zm * Math.tan((kam.fovBasis || kam.fov) * Math.PI / 360) * aspekt * .92;
    // Eigenen Spieler im Bild halten: Kamera schiebt sich Richtung Spieler, bei großem Abstand etwas herauszoomen
    const online = !!(s.fern || s.gast || window.__onlineMatch);   // V9.2: online folgt die Kamera dem Ball statt zwischen den Menschen zu springen
    const ich = !online && s.steuer && s.steuer.aktiv ? s.steuer : null;
    if (ich && !s.wStopp && !(s.phase === 'standard' && s.std) && s.phase !== 'wiederholung' && s.phase !== 'ausklang' && !(s.einlauf && s.phase === 'start') && !(s.phase === 'tor' && s.jubelDaten)){
      // V5.5: benötigten Zoom direkt aus dem Abstand berechnen (vorher hing er vom aktuellen Zoom ab und schaukelte sich auf → Bild wackelte)
      const abx = ich.p.x - fx, b1 = breiteBei(1) * .7;
      zoomSoll = Math.max(zoomSoll, Math.min(1.32, Math.abs(abx) / (b1 * 1.6)));
      const lim = b1 * Math.max(1, Math.min(1.32, zoomSoll));
      if (Math.abs(abx) > lim) fx += abx - Math.sign(abx) * lim;
      const abz = ich.p.z - fz, limZ = 6.5 * kamF.zoom;
      if (Math.abs(abz) > limZ) fz += abz - Math.sign(abz) * limZ;
    }
    if (s.phase === 'spiel' && b.ausEcke && !b.besitzer) zoomSoll = Math.max(zoomSoll, 1.5);   // V9.2: Flanke aus der Ecke – ganzer Strafraum im Bild
    if (s.phase === 'wiederholung') zoomSoll = .78;          // Wiederholung: näher am Ball
    if (s.phase === 'standard' && s.std && s.std.typ === 'ecke') zoomSoll = Math.max(zoomSoll, 2.0);
    if (s.phase === 'standard' && s.std && s.std.typ === 'einwurf') zoomSoll = Math.max(zoomSoll, 1.55);   // V10.0: Einwurf weiter heraus
    if (s.phase === 'aus') zoomSoll = Math.max(zoomSoll, 1.4);   // V10.0: Ball im Aus – Seitenlinie und Auslauf im Bild   // V9.2: Ecke weiter heraus   // V3.16: Ecke weit herauszoomen (V5.3: noch etwas weiter)
    // Jubel: sanfte Kamerafahrt – leicht näher am Torschützen, aber so weit weg, dass auch die Mitspieler im Bild bleiben
    if (s.phase === 'tor' && s.jubelDaten && s.jubelDaten.t > .35){
      const j = s.jubelDaten, q = j.schuetze; let maxD = 0;
      for (const m of teamSp(j.team)) if (m !== q && m.rolle !== 'TW') maxD = Math.max(maxD, d2(m.p, q.p));
      zoomSoll = klemme(.72 + maxD * .02, .72, .98);
    }
    const schussAufsTor = s.phase === 'spiel' && b.schussVon && !b.besitzer && sp > 11 && Math.abs(b.p.x) > HL - 17;
    if (schussAufsTor) zoomSoll *= .78;   // V4.6: beim Torschuss näher heranzoomen
    if (s.phase === 'ausklang' && s.ausklang && s.ausklang.feier && s.ausklang.t > s.ausklang.tH) zoomSoll = .8;   // V6.2: Podest näher zeigen
    zoomSoll *= ZOOM_STUFEN[zoomStufe];
    if (s.halle) zoomSoll *= .9;   // HALL OF FAME: etwas näher dran
    kamF.zoom += (zoomSoll - kamF.zoom) * (1 - Math.exp(-(schussAufsTor ? 3.6 : (s.phase === 'tor' && s.jubelDaten && s.jubelDaten.t > .35) ? 1.3 : s.phase === 'tor' ? 3.6 : 2.2) * dt));   // Jubel: langsames, weiches Heranfahren
    const halbBreite = breiteBei(kamF.zoom);
    const randX = Math.max(0, HL + 6.5 - halbBreite);   // darf bis hinter das Tor schauen, damit der Ball mittig bleibt
    const std = s.phase === 'standard' && s.std;
    const jubelKam = s.phase === 'tor' && s.jubelDaten && s.jubelDaten.t > .35;
    const tunKam = (s.einlauf && s.phase === 'start') || s.phase === 'hzGang';
    const zx = klemme(fx, -randX, randX), zz = tunKam ? klemme(fz * .8 - 1, -15 * KZ, 6 * KZ) : jubelKam ? klemme(fz - 1.9, -13 * KZ, 12 * KZ) : std ? (std.typ === 'ecke' ? klemme(std.ort.z * (std.ort.z > 0 ? .58 : .4), -12 * KZ, 12 * KZ) : std.typ === 'einwurf' ? klemme(fz * .9 + (fz < 0 ? -1.8 : 2.4), -14 * KZ, 14 * KZ) : klemme(fz * .7 - .4, -6.5 * KZ, 7.5 * KZ)) : klemme(fz * (fz > 0 ? (s.phase === 'aus' ? .92 : .84) : (s.phase === 'aus' ? .8 : .72)) - (s.phase === 'aus' ? 0 : .8), (s.wStopp || s.phase === 'aus' ? -13 : -6) * KZ, (s.phase === 'aus' ? 13 : 9) * KZ);   // V9.2: unten bis über die Seitenlinie   // 11er-Test: Kamera erreicht auch die breiten Seiten
    // gedämpfte Feder (kein Nachwippen, kein Ruckeln)
    const bsp = Math.hypot(b.v.x, b.v.z);
    const w = 6 + Math.min(bsp, 25) * .22 + (b.p.y > .8 && !b.besitzer ? 2.5 : 0), k = w * w, d = 2 * w;   // 11er-Test: bei hohen Bällen straffer folgen     // straffer, bei schnellen Bällen noch straffer
    const dtk = Math.min(dt, .033);
    for (let i = 0, n = Math.max(1, Math.ceil(dt / dtk)); i < n; i++){
      const st = dt / n;
      kamF.vx += (k * (zx - kamF.x) - d * kamF.vx) * st; kamF.x += kamF.vx * st;
      kamF.vz += (k * (zz - kamF.z) - d * kamF.vz) * st; kamF.z += kamF.vz * st;
    }
    kamZiel.set(kamF.x, 0, kamF.z);
    // V4.9: „Klassisch Plus“ – Kamera fährt mit, dreht sich aber leicht (max. ca. 10°) zum Tor hin; der Ball bleibt in der Bildmitte
    kam.fov = kam.fovBasis || kam.fov;
    // V9.3: TV-KAMERA – wie bei einer Fernsehübertragung: Kamera steht hoch auf der Haupttribüne, fährt nur langsam auf einer Schiene mit,
    // schwenkt zum Ball und zoomt mit der Brennweite (statt mitzufahren). Jubel, Wiederholung, Einlauf, Trage und Abschluss bleiben Nah-Kameras.
    const dk = Math.min(dt, .05);
    let cx, cy, cz;
    { const soll = klemme(kamF.x / HL, -1, 1) * .17;   // klassische Nah-Kamera (~10° gedreht)
      kamTV.x += (soll - kamTV.x) * (1 - Math.exp(-2.2 * dk));
      const d = KAM_Z * kamF.zoom, w = kamTV.x;
      cx = kamF.x - Math.sin(w) * d; cy = KAM_H * kamF.zoom; cz = kamF.z + Math.cos(w) * d; }
    const tvPhase = !(s.phase === 'wiederholung' || s.phase === 'ausklang' || s.phase === 'presse' || s.phase === 'trage' || s.phase === 'hzGang' || jubelKam || tunKam);
    kamTV.mix = kamTV.mix == null ? (tvPhase ? 1 : 0) : kamTV.mix + ((tvPhase ? 1 : 0) - kamTV.mix) * (1 - Math.exp(-2.4 * dk));
    { // Kamerawagen auf der Schiene: folgt dem Ball nur zu ~40 %, sehr weich
      const railSoll = klemme(kamF.x * .4, -HL * .42, HL * .42);
      if (kamTV.rail == null) kamTV.rail = railSoll;
      kamTV.railV = (kamTV.railV || 0) + ((railSoll - kamTV.rail) * 2.2 - (kamTV.railV || 0) * 2.6) * dk;   // gedämpfte Feder – der Wagen beschleunigt und bremst sanft
      kamTV.rail += kamTV.railV * dk;
      // Kameramann: kleines, ruhiges Nachwackeln (Handführung), beim Torschuss etwas mehr
      kamTV.t = (kamTV.t || 0) + dk;
      const wack = (schussAufsTor ? .12 : .045) * (s.phase === 'spiel' ? 1 : .4);
      const ox = Math.sin(kamTV.t * 1.3) * wack + Math.sin(kamTV.t * 3.1) * wack * .4, oz = Math.cos(kamTV.t * 1.7) * wack * .6;
      const tvZ = HB + (s.halle ? 14 : 23) + kamF.z * .12, tvH = s.halle ? 13.5 : 21;
      const tx = kamTV.rail, ty = tvH, tz = tvZ;
      // Brennweite: gleiche Bildbreite am Ball wie die Nah-Kamera
      const dTV = Math.hypot(kamF.x - tx, ty, kamF.z - tz), d0 = Math.hypot(KAM_H, KAM_Z) * kamF.zoom;
      const fovTV = klemme(2 * Math.atan(Math.tan(kam.fov * Math.PI / 360) * d0 / dTV) * 180 / Math.PI, 14, kam.fov * 1.35);
      const m = kamTV.mix;
      kam.pos.set(cx + (tx - cx) * m, cy + (ty - cy) * m, cz + (tz - cz) * m);
      kam.fov = kam.fov + (fovTV - kam.fov) * m;
      if (m > .01) kamZiel.set(kamF.x + ox * m, 0, kamF.z + oz * m);
    }
  }
  function darstellen(dt){
    if (!s || !ctx2) return;
    const g = ctx2, b = welt.ball;
    // Schussspur sammeln
    const schnell = !b.besitzer && b.v.length() > 11 && b.schussVon;
    if (schnell){ b.spurPunkte.unshift(b.p.clone()); if (b.spurPunkte.length > 14) b.spurPunkte.pop(); }
    else if (b.spurPunkte.length) b.spurPunkte.pop();

    for (const p of s.spieler) if (p.aktiv) animiereFigur(p, dt, p === s.steuer ? 1 : ((s.fernSpieler === p || (s.andereMenschen && s.andereMenschen.includes(p))) ? 2 : 0));
    const sch = welt.schiri; animiereFigur(sch, dt, false);
    // V5.5: Linienrichter folgen dem Ball nur ein Stück, bleiben in der Nähe ihrer Eckfahne
    if (welt.linienRichter) for (const l of welt.linienRichter){
      const sx = l.seite, lo = sx < 0 ? -HL + .8 : HL - 9, hi = sx < 0 ? -HL + 9 : HL - .8;
      const zx = klemme(b.p.x, lo, hi), zz = sx * (HB + .7), dx = zx - l.p.x, d = Math.abs(dx);
      const tempo = d > 2 ? 4.2 : 2.2;
      if (d > .1 && dt > 0){ const st = Math.min(d, tempo * dt); l.p.x += Math.sign(dx) * st; l.v.set(Math.sign(dx) * st / dt, 0, 0); l.blick.set(Math.sign(dx), 0, -sx * .9).normalize(); }
      else { l.v.set(0, 0, 0); l.blick.set(0, 0, -sx); }
      l.p.z = zz; animiereFigur(l, dt, false);
    }
    try { bankFigurenSchritt(dt); } catch (e) {}

    // Kamera folgt dem Ball (seitlich, erhöht)
    kameraFuehren(dt);
    if (s.phase === 'presse' && s.presse) presseKamera();
    if (window.__kamTest){ const t = window.__kamTest; kam.pos.set(t[0], t[1], t[2]); kamZiel.set(t[3], t[4], t[5]); }   // nur für Test-Screenshots
    kameraRechnen();
    if (musik.sfx && musik.sfx.spannung && s.phase === 'spiel'){ const nah = Math.max(0, (Math.abs(b.p.x) - 9) / 11), sp = b.schussVon ? .4 : 0; musik.sfx.spannung(Math.min(1, nah * (Math.abs(b.p.z) < 10 ? 1 : .5) + sp)); }

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    zeichneUmgebung(g);
    // V5.0 Leistung: Figuren außerhalb des Bildes gar nicht erst zeichnen (gleiches Bild, viel weniger Arbeit)
    const figImBild = (x, z) => { if (tiefe(x, 0, z) < NAH) return false; const f = P(x, 0, z), r = 1.6 * f.s, h = 3.2 * f.s; return f.x + r > -20 && f.x - r < kam.w + 20 && f.y + r * .5 > -20 && f.y - h < kam.h + 20; };
    // Schatten
    if (grafikEffekt('schatten')) {
      for (const p of s.spieler) if (p.aktiv && !imTunnel(p) && figImBild(p.p.x, p.p.z + p.zeichen.dz)) zeichneSchatten(g, p.p.x, p.p.z + p.zeichen.dz, .5, .38);
      if (!imTunnel(sch)) zeichneSchatten(g, sch.p.x, sch.p.z, .5, .38);
      if (!(s.phase === 'ausklang' && s.ausklang && s.ausklang.t > s.ausklang.tR)) zeichneSchatten(g, b.p.x, b.p.z, .32 + b.p.y * .05, Math.max(.12, .45 - b.p.y * .06));
    }
    // Objekte nach Tiefe sortiert (hinten zuerst)
    const liste = [];
    if (!s.presse) for (const p of s.spieler) if (p.aktiv && p.gruppe.visible && !imTunnel(p) && !(s.trage && s.trage.p === p) && (p.zeichen.gesteuert || figImBild(p.p.x, p.p.z + p.zeichen.dz))) liste.push([p.p.z + p.zeichen.dz, () => zeichneFigur(g, p)]);
    if (s.abgang) for (const o of s.abgang) if (figImBild(o.p.x, o.p.z + o.zeichen.dz)) liste.push([o.p.z + o.zeichen.dz, () => zeichneFigur(g, o)]);
    if (s.trage) zeichneTrage(liste, g);
    if (s.presse) presseZeichnen(liste, g);
    if (!imTunnel(sch) && !s.presse && figImBild(sch.p.x, sch.p.z)) liste.push([sch.p.z, () => zeichneFigur(g, sch)]);
    if (welt.linienRichter && !s.presse && s.phase !== 'ausklang' && !s.einlauf) for (const l of welt.linienRichter) if (figImBild(l.p.x, l.p.z)) liste.push([l.p.z, () => {
      zeichneFigur(g, l);
      // Fahne: im Aus hochgehalten, sonst gesenkt
      const af = s.abseitsFahne, hoch = (s.phase === 'aus' && Math.sign(welt.ball.p.x) === Math.sign(l.p.x)) || (af && performance.now() < af.bis && Math.sign(af.x) === Math.sign(l.p.x)), hx = l.p.x + .28, z0 = l.p.z;
      const a = P(hx, hoch ? 1.55 : .95, z0), e = P(hx + (hoch ? .05 : .12), hoch ? 2.25 : .45, z0);
      g.strokeStyle = '#2b2b2b'; g.lineWidth = Math.max(1.2, a.s * .025); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(e.x, e.y); g.stroke();
      const f1 = P(hx + (hoch ? .05 : .12), hoch ? 2.25 : .45, z0), f2 = P(hx + (hoch ? .4 : .36), hoch ? 2.1 : .62, z0), f3 = P(hx + (hoch ? .06 : .13), hoch ? 1.95 : .66, z0);
      g.fillStyle = '#ffe234'; g.beginPath(); g.moveTo(f1.x, f1.y); g.lineTo(f2.x, f2.y); g.lineTo(f3.x, f3.y); g.closePath(); g.fill();
      g.fillStyle = '#e0262c'; const fm = P(hx + (hoch ? .2 : .22), hoch ? 2.1 : .58, z0); g.fillRect(fm.x - fm.s * .04, fm.y - fm.s * .04, fm.s * .08, fm.s * .08);
    }]);
    if (s.ballAlt){ liste.push([s.ballAlt.p.z + .01, () => zeichneAltBall(g)]); if (grafikEffekt('schatten')) zeichneSchatten(g, s.ballAlt.p.x, s.ballAlt.p.z, .32 + s.ballAlt.p.y * .05, Math.max(.12, .45 - s.ballAlt.p.y * .06)); }
    if (s.halle) liste.push([-BANDE_Z + .02, () => halleBandeHinten(g)]);
    if (s.halle && s.zuschauerVorn) for (const o of s.zuschauerVorn) if (fanSichtbar(o)) liste.push([o.p.z, () => zeichneZuschauer(g, o)]);
    if (s.bankFig){ const imBild = o => { const q = P(o.p.x, 1, o.p.z); return q.x > -60 && q.x < kam.w + 60 && q.y > -80 && q.y < kam.h + 80; };
      for (const team of [0, 1]){ for (const o of s.bankFig[team].concat(s.rausFig[team])) if (imBild(o)) liste.push([o.p.z, () => zeichneFigur(g, o)]); const tr = s.trainer && s.trainer[team]; if (tr && tr.fig && imBild(tr.fig)) liste.push([tr.fig.p.z, () => zeichneFigur(g, tr.fig)]); } }
    if (!s.presse && !(s.phase === 'ausklang' && s.ausklang && s.ausklang.t > s.ausklang.tR)) liste.push([b.p.z + .01, () => zeichneBall(g)]);   // V6.2: Ball nach der Reaktion ausblenden
    if (s.phase === 'ausklang' && s.ausklang) ausklangZeichnen(liste, g);   // V6.2: Podest, Pokal, Konfetti
    for (const netz of welt.tore){
      const mi = P(netz.x0, 1, 0);
      if (mi.x < -mi.s * 6 || mi.x > kam.w + mi.s * 6) continue;     // nicht sichtbar
      liste.push([-TB - .3, () => zeichneTorTeil(g, netz, 'hinten')]);
      liste.push([TB, () => zeichneTorTeil(g, netz, 'vorn')]);
    }
    // Rasenspritzer beim Rutschen (Torjubel): kleine grüne und braune Teilchen
    if (s.phase === 'tor'){
      for (const p of s.spieler){
        if (!p.aktiv || !(p.grae > 0 || p.gefallen > 1) || Math.hypot(p.v.x, p.v.z) < 2.2 || rasenTeile.length > 160) continue;
        for (let i = 0; i < 2; i++) rasenTeile.push({ x: p.p.x + p.v.x * .05, y: .06, z: p.p.z, vx: -p.v.x * .12 + (Math.random() - .5) * 1.6, vy: 1.4 + Math.random() * 1.8, vz: (Math.random() - .5) * 1.6, t: 0, l: .5 + Math.random() * .3, gruen: Math.random() < .65 });
      }
    }
    if (rasenTeile.length){
      for (const q of rasenTeile){ q.t += dt; q.vy -= 9 * dt; q.x += q.vx * dt; q.y = Math.max(0, q.y + q.vy * dt); q.z += q.vz * dt; if (q.y <= 0){ q.vy *= -.15; q.vx *= .6; q.vz *= .6; } }
      rasenTeile = rasenTeile.filter(q => q.t < q.l);
      if (rasenTeile.length){
        const zm = rasenTeile.reduce((a, q) => a + q.z, 0) / rasenTeile.length + .3;
        liste.push([zm, () => { for (const q of rasenTeile){ const m = P(q.x, q.y, q.z); g.globalAlpha = Math.max(0, 1 - q.t / q.l); g.fillStyle = q.gruen ? '#3f8f35' : '#b99a63'; g.beginPath(); g.arc(m.x, m.y, Math.max(1, .045 * m.s), 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }]);
      }
    }
    liste.sort((a, c) => a[0] - c[0]);
    for (const [, f] of liste) f();
    // V3.0: rotes Kreuz über verletzten Spielern
    for (const p of s.spieler){
      if (!p.aktiv || !p.verletzt || imTunnel(p)) continue;
      const q = P(p.p.x, 2.25, p.p.z), r0 = Math.max(6, .2 * q.s);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y, r0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e0262c'; g.lineWidth = Math.max(1.5, r0 * .18); g.stroke();
      g.fillStyle = '#e0262c'; g.fillRect(q.x - r0 * .6, q.y - r0 * .2, r0 * 1.2, r0 * .4); g.fillRect(q.x - r0 * .2, q.y - r0 * .6, r0 * .4, r0 * 1.2);
    }
    // V2.84: Name des aktiven Spielers – immer vor allen anderen Figuren sichtbar.
    for (const p of s.spieler){
      if (!p.aktiv || !p.namePos || !p.gruppe.visible) continue;
      const [nx, ny, nk] = p.namePos, fs = Math.max(11, Math.min(17, .38 * nk));
      g.save();
      g.font = '800 ' + fs.toFixed(1) + 'px "Bangers", Impact, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.lineWidth = Math.max(3, fs * .24); g.strokeStyle = 'rgba(10,18,51,.95)'; g.fillStyle = '#ffe234';
      if (p.onlineName){
        // V5.10: Online-Menschen: kleines weißes Controller-Symbol auf Teamfarbe (BLAU / ROT)
        // V9.0: Spielername (gelb) bleibt sichtbar, Controller + Online-Name sitzen darüber
        g.strokeText(p.daten && p.daten.name || p.name, nx, ny); g.fillText(p.daten && p.daten.name || p.name, nx, ny);
        const r = Math.max(7, fs * .62), cy = ny - fs - r * .55;
        g.fillStyle = p.team === 0 ? '#1e7bff' : '#e0262c'; g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, r * .16);
        g.beginPath(); g.arc(nx, cy, r, 0, Math.PI * 2); g.fill(); g.stroke();
        // V8.1: Controller-Symbol (weiß) aus Bild
        { const ci = CONTROLLER_BILD; if (ci.complete && ci.naturalWidth){ const cw2 = r * 1.5, ch2 = cw2 * ci.naturalHeight / ci.naturalWidth; g.drawImage(ci, nx - cw2 / 2, cy - ch2 / 2, cw2, ch2); } }
        // V9.0: Online-Name steht jetzt an der Anzeigetafel (unter der Flagge), über dem Kopf nur Spielername + Controller
      } else { const kt = (p.team === 0 && p.daten && p.daten.name === window.kapitaenName()) ? ' ©' : ''; g.strokeText((p.labelName || p.name) + kt, nx, ny); g.fillText((p.labelName || p.name) + kt, nx, ny); }   // V9.9: © hinter dem Kapitän
      g.restore();
    }
    // Im Spielfeld keine kleinen Namen/Tier-Symbole über den Köpfen.
    if (s.nacht && grafikEffekt('licht')) zeichneFlutlicht(g);
    if (grafikEffekt('wetter')) zeichneWetter(g, dt);
    zeigeEigenenSpieler(g);
    try { zeichneTrainerBlasen(g); } catch (e) {}   // V4.2: ganz oben, über Namen und Figuren
    zeichneEckenGuide(g);
    hudAktualisieren();
  }

  function aufBildschirm(pos){
    const a = P(pos.x, pos.y, pos.z);
    return { x: a.x, y: a.y };
  }
  let letzteMinute = -1;
  function konferenzZeigen(){
    const el = $s('konferenz'); if (!el) return;
    const k = (s.optionen && s.optionen.konferenz) || [];
    if (!k.length){ if (el.childElementCount) el.innerHTML = ''; return; }
    if (el.childElementCount !== k.length || !s.konfStand || s.konfStand.length !== k.length){
      el.innerHTML = k.map((m, i) => '<div class="kz" data-i="' + i + '">' + flaggeHTML(m.a) + m.ka + ' <b>0:0</b> ' + m.kb + flaggeHTML(m.b) + '</div>').join('');
      s.konfStand = k.map(() => '0:0');
    }
    const lauf = SPIELZEIT - s.zeit;
    k.forEach((m, i) => {
      let a = 0, b = 0; for (const tr of m.tore) if (tr.t <= lauf) tr.team === 0 ? a++ : b++;
      const st = a + ':' + b;
      if (st !== s.konfStand[i]){
        s.konfStand[i] = st; const z = el.children[i]; z.querySelector('b').textContent = st;
        z.classList.remove('tor'); void z.offsetWidth; z.classList.add('tor');
        zeigeHinweis('Tor im anderen Spiel: ' + m.ka + ' ' + st + ' ' + m.kb, 1.6);
      }
    });
  }
  function hudAktualisieren(){
    if (s && !s.gast) konferenzZeigen();
    const c = s.steuer;
    const zweite = s.halbzeitGewesen && s.phase !== 'halbzeit';
    // Spieluhr als aufwärts laufende Fußballzeit: 1. Halbzeit 00:00–45:00,
    // 2. Halbzeit 45:00–90:00. Die interne Echtzeit bleibt unverändert.
    let anzeigeZeit;
    if (s.verlaengerung) {
      anzeigeZeit = (90 + (s.vHalb ? 15 : 0)) * 60 + Math.max(0, Math.ceil((VERLAENGERUNG / 2 - s.zeit) * MIN_FAKTOR));   // V7.8: Uhr läuft von 90 bis 120 weiter
    } else if (zweite) {
      anzeigeZeit = 45 * 60 + Math.max(0, Math.ceil((HALBZEIT - s.zeit) * MIN_FAKTOR));
    } else {
      anzeigeZeit = Math.max(0, Math.ceil((SPIELZEIT - s.zeit) * MIN_FAKTOR));
    }
    if (s.halle) anzeigeZeit = Math.max(0, Math.ceil(s.zeit));   // V11.4: Halle 12 Minuten, runter
    const m = Math.floor(anzeigeZeit / 60), sek = anzeigeZeit % 60;
    const txt = s.verlaengerung ? m + ':' + String(sek).padStart(2, '0') : (s.phase === 'halbzeit' ? 'HZ ' : zweite ? '2. ' : '1. ') + m + ':' + String(sek).padStart(2, '0') + '  ' + (s.nacht ? '🌙' : '') + ({ regen: '☔', schnee: '❄️', sonne: '☀️', klar: '⛅' }[s.wetter] || '⛅');
    const tmp = s.temp != null ? '<small class="temp">' + (s.temp < 0 ? '−' + Math.abs(s.temp) : s.temp) + '°</small>' : '';
    // V5.8: Spielzeit steht jetzt in der Anzeigetafel, darunter nur noch Wetter und Temperatur
    const zeitTxt = s.elfmeter ? 'ELFMETER' : (s.verlaengerung && !s.ns) ? m + ':' + String(sek).padStart(2, '0') : s.phase === 'halbzeit' ? 'HZ' : s.ns ? (() => { const g = ([45, 90, 105, 120][s.ns.halb] || 90) * 60 + Math.floor(s.ns.t * MIN_FAKTOR); return Math.floor(g / 60) + ':' + String(g % 60).padStart(2, '0') + ' +' + s.ns.min; })() : m + ':' + String(sek).padStart(2, '0');   // V7.8: Uhr läuft in der Nachspielzeit weiter, z. B. „91:20 +3“   // V6.2: Nachspielzeit „90 +3“
    const wetterTxt = s.halle ? '<span style="font-size:.66em;letter-spacing:.3px;white-space:nowrap">' + (window.HALLE_ICON || '🏀') + 'HALL OF FAME</span> ' : (s.nacht ? '🌙' : '') + ({ regen: '☔', schnee: '❄️', sonne: '☀️', klar: '⛅' }[s.wetter] || '⛅');
    if (uhrCache !== zeitTxt + wetterTxt + tmp){ uhrCache = zeitTxt + wetterTxt + tmp; $s('minute').textContent = zeitTxt; $s('uhr').innerHTML = wetterTxt + tmp; }
    // Knopf-Belegung: Torwart bekommt eine eigene Steuerung.
    const istTW = !!(c && c.rolle === 'TW' && !twAmFuss(c));   // V4.3: am Fuß / außerhalb des 16ers normale Knöpfe
    const twHand = istTW && twMitBall(c);
    const vert = s.gast ? (s.gastBall != null && s.gastBall >= 0 && s.spieler[s.gastBall].team !== lokal.team) : verteidigung();
    $s('aktionen').classList.toggle('verteidigung', vert && !istTW);
    const kS = twHand ? 'SCHUSS' : istTW ? 'HECHT' : (vert ? 'GRÄTSCHE' : 'SCHUSS');
    // V5.8: Der Knopf zeigt WECHSEL, sobald er wirklich wechselt (weit vom Ball weg und ein Mitspieler ist naeher dran)
    let wj = false;
    if (!istTW && c && wechselMoeglich(lokal)) wj = true;   // V8.4: Anzeige und Wechsel nutzen dieselbe Bedingung
    const kP = istTW ? 'ABWURF' : (wj ? 'WECHSEL' : (vert ? 'STÖREN' : 'PASS'));
    if ($s('kSchuss').textContent !== kS){ $s('kSchuss').textContent = kS; $s('kSchuss').style.fontSize = kS.length > 6 ? '14px' : ''; }
    if ($s('kPass').textContent !== kP) $s('kPass').textContent = kP;
    { // V7.0: Dosierbalken unter den Tasten
      const dos = (id, v) => { const el = $s(id); const an = v > .02; if (el.classList.contains('an') !== an) el.classList.toggle('an', an); if (an) el.firstChild.style.width = Math.round(Math.min(1, v) * 100) + '%'; };
      dos('dosisS', s.lade >= 0 && (!istTW || twHand) ? s.lade : 0);
      dos('dosisF', lokal.flLade > 0 ? lokal.flLade : 0);
      dos('dosisP', lokal.passLade > 0 ? lokal.passLade : 0);
    }
    { // V6.1 M3: Flanke-Knopf – für den Torwart weg, sonst gedimmt, solange man den Ball nicht hat
      const kf = $s('kFlanke'), twX = !!(c && c.rolle === 'TW' && !twMitBall(c) && !(s.phase === 'standard' && s.std && s.std.schuetze === c)); if (kf.hidden !== twX) kf.hidden = twX;   // V4.3: Torwart nie mit FLANKE
      const hatBall = !!((c && welt.ball.besitzer === c && s.phase === 'spiel') || flankeEcke(lokal) || !!(c && s.phase === 'spiel' && welt.ball.besitzer && welt.ball.besitzer !== c && welt.ball.besitzer.team === c.team && !istMensch(welt.ball.besitzer) && welt.ball.besitzer.rolle !== 'TW'));
      /* V6.0: Flanke-Taste wird nie gedimmt (wie die anderen Tasten) */
    }
    { const sp = s.steuer || s.du, kz = $s('kSpezial');   // V5.1
      { const kw = $s('kWechsel'), zeig = false; /* V5.7: Wechsel ist im PASS-Knopf integriert */ if (kw.hidden === zeig) kw.hidden = !zeig; }
      const hat = !!(sp && sp.spezArten && sp.spezArten.length);
      if (kz.hidden === hat) kz.hidden = !hat;
      if (hat){
        const l = sp.spezLade || 0, aktiv = sp.spezT > 0;
        kz.style.setProperty('--l', Math.round(Math.min(1, l) * 100) + '%');
        kz.classList.toggle('voll', l >= 1); kz.classList.toggle('aktiv', aktiv);
        const ic = sp.spezArten.map(a => SPEZIAL[a].icon).join('');
        if ($s('kSpezialIcon').textContent !== ic) $s('kSpezialIcon').textContent = ic;
      } }
    // Kein Spielername über dem Kopf. Nur der Kraftbalken des gesteuerten Spielers bleibt sichtbar.
    if (c && c.aktiv){
      const oben = aufBildschirm(V(c.p.x, 2.0, c.p.z));
      const kr = $s('kraft');
      const kv = s.lade >= 0 ? s.lade : (lokal.flLade > .05 ? lokal.flLade : (lokal.passLade > .2 ? lokal.passLade : -1));   // V5.4: auch beim Pass laden
      if (kv >= 0){ kr.style.display = 'block'; kr.style.left = oben.x + 'px'; kr.style.top = (oben.y - 14) + 'px'; $s('kraftI').style.width = (kv * 100) + '%'; }
      else kr.style.display = 'none';
    }
  }
  function aktualisiereTafel(){
    $s('stand').textContent = s.tore[0] + ' – ' + s.tore[1];
  }
  let meldungT = 0;
  let meldungNr = 0, letzteMeldung = null;
  function meldung(gross, klein, karte, dauer = 2.2){
    letzteMeldung = [++meldungNr, gross, klein || '', karte || '', dauer];
    $s('meldungB').textContent = gross;
    const sm = $s('meldungS');
    sm.innerHTML = '';
    if (karte){ const k = document.createElement('span'); k.className = 'karte-anz'; k.style.background = karte === 'rot' ? '#e0262c' : '#ffe234'; sm.appendChild(k); }
    sm.appendChild(document.createTextNode(klein || '')); sm.style.display = klein ? 'inline-block' : 'none';
    const el = $s('meldung'); el.classList.add('zeigen');
    clearTimeout(meldungT); meldungT = setTimeout(() => el.classList.remove('zeigen'), dauer * 1000);
  }
  let hinweisT = 0;
  function zeigeHinweis(t, dauer = 1.4){
    const el = $s('hinweisSpiel'); el.textContent = t; el.classList.add('zeigen');
    clearTimeout(hinweisT); hinweisT = setTimeout(() => el.classList.remove('zeigen'), dauer * 1000);
  }
  // =================================================================
  // Start, Pause, Ende
  // =================================================================
  function rendererBereit(){
    if (ctx2) return;
    const cv = $s('spielCanvas');
    ctx2 = cv.getContext('2d', { alpha: false });   // V9.2: undurchsichtige Leinwand – weniger Arbeit beim Zusammensetzen des Bildes
    const groesse = () => {
      const w = innerWidth, h = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, grafikDpr());
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      kam.w = w; kam.h = h;
      kam.fov = w / h < 1.5 ? 44 : 36; kam.fovBasis = kam.fov;            // schmalere Bildschirme etwas weiter
    };
    groesse(); addEventListener('resize', groesse);
    joystickEinrichten();
    $s('pauseKnopf').addEventListener('click', () => pause(true));
    $s('spielSimulieren').addEventListener('click', () => spielZuEndeSimulieren());
    // V6.1: Einstellungen = Pause (offline). Online läuft das Spiel weiter, dann gibt es nur die Grafik.
    const onlineSpiel = () => !!(s && (s.gast || (s.optionen && (s.optionen.gast || s.optionen.fern || s.optionen.modus))));
    $s('grafikKnopf').addEventListener('click', () => { if (onlineSpiel() || !laeuft) grafikOeffnen(true); else pause(true); });
    { const pg = $s('pauseGrafik'); if (pg) pg.addEventListener('click', () => grafikOeffnen(true)); }
    $s('grafikZu').addEventListener('click', () => grafikOeffnen(false));
    // V9.1: Online-Spiel verlassen – Gastgeber: alle zurück ins Menü; Gast: verlässt den Raum, beim Gastgeber pausiert das Spiel
    { const v = document.getElementById('grafikVerlassen'); if (v) v.addEventListener('click', async () => {
      if (!(await window.jaNeinDialog(s && s.gast ? 'SPIEL VERLASSEN?' : 'SPIEL BEENDEN?', s && s.gast ? 'Du verlässt den Raum, beim Gastgeber wird pausiert.' : 'Das Spiel wird für alle beendet, ihr kommt zurück ins Hauptmenü.', s && s.gast ? 'SPIEL VERLASSEN' : 'SPIEL BEENDEN', 'WEITERSPIELEN'))) return;   // V10.0
      grafikOeffnen(false);
      const warGast = !!(s && s.gast);
      try { beenden(); } catch (e) {}
      if (warGast){ try { await NETZ.verlassen(); } catch (e) {} }
    }); }
    document.querySelectorAll('[data-grafik]').forEach(b => b.addEventListener('click', () => grafikSetzen(b.dataset.grafik)));
    grafikUI();
    $s('weiterSpielen').addEventListener('click', () => pause(false));
    $s('aufgeben').addEventListener('click', () => beenden());
    $s('nochmal').addEventListener('click', () => { const o = { ...s.optionen }; delete o.matchSkills; window.__trainingSig = null; beenden(false); starte(o); });
    { const rvb = $s('revanche'); if (rvb) rvb.addEventListener('click', () => { try { NETZ.revanche(); rvb.textContent = '⏳ Anfrage gesendet'; rvb.disabled = true; } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }); }   // V4.5
    $s('turnierWeiter').addEventListener('click', () => { const tore = s.tore.slice(), karten = (s.kartenLog || []).slice(), elfSieger = s.elfmeterSieger;
      const istCC = !!(s.optionen && s.optionen.ligaCC);
      const ligaSp = (s.optionen && s.optionen.liga) ? s.spieler.map(p => ({ idx: PLAYER_DATABASE.indexOf(p.daten), team: p.team, tore: (p.st && p.st.tore) || 0, vorlagen: (p.st && p.st.vorlagen) || 0 })) : null;
      beenden(false);
      if (istCC){ LIGA.ccNachSpiel(tore, elfSieger); return; }   // V5.0
      if (ligaSp) LIGA.nachSpiel(tore, ligaSp, karten); else TURNIER.nachSpiel(tore, karten, elfSieger); });
    $s('zumMenue').addEventListener('click', () => beenden());
    $s('hzWeiter').addEventListener('click', () => zweiteHalbzeit());
    document.addEventListener('visibilitychange', () => { if (document.hidden && laeuft && !pausiert && s.phase !== 'ende') pause(true); });
  }

  let letztesWetter = null;

  // KI-Regel V2.63:
  // Jede KI-Mannschaft bekommt GENAU EINEN Hartspieler – zufällig Bronze, Silber oder Gold.
  // Alle übrigen Spieler sind normale Spieler ohne Kartenstufe. Die KI bekommt also
  // niemals gleichzeitig mehrere Hartspieler oder eine Mischung aus mehreren Stufen.
  // V5.3: jedes KI-Team hat genau einen Kartenspieler – starke Nationen Gold, mittlere Silber, schwache Bronze
  function karteFuerGegner(liste, land, opt){
    liste = liste.slice();
    const name = land && (Array.isArray(land) ? land[0] : land), karten = NATION_KARTEN[name] || [];
    const belegt = new Set([...((opt && opt.squad) || []), ...((opt && opt.ersatz) || [])]), ersetzt = new Set();
    const frei = (i, j) => !ersetzt.has(j) && PLAYER_DATABASE[i] && !PLAYER_DATABASE[i].stufe && PLAYER_DATABASE[i].name !== 'SILESCROW';   // V5.0: die Hauptfigur wird nie durch eine Karte ersetzt
    for (const c of karten){
      if (liste.includes(c)) continue;   // auch wenn du das Original hast: die Nation spielt mit ihrer Kopie (−2)
      const rolle = PLAYER_DATABASE[c].role;
      let platz = liste.findIndex((i, j) => frei(i, j) && PLAYER_DATABASE[i].role === rolle);
      if (platz < 0 && rolle !== 'TW') platz = liste.findIndex((i, j) => frei(i, j) && PLAYER_DATABASE[i].role !== 'TW');
      if (platz < 0) continue;
      liste[platz] = c; ersetzt.add(platz);
    }
    return liste;
  }
  function zufallsHartspieler(pool){
    const hart = pool.filter(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].stufe);
    if (!hart.length) return -1;
    return hart[(Math.random() * hart.length) | 0];
  }

  function normaleSpieler(pool){
    return pool.filter(i => PLAYER_DATABASE[i] && !PLAYER_DATABASE[i].stufe);
  }

  function kiKaderMitStufen(pool, anzahl){
    if (anzahl > 5){
      // 11er-Test: ohne Doppelte, nach Rollen 1 TW, 4 Abwehr, 4 Mitte, 2 Sturm (höchstens ein Hartspieler)
      const misch = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
      const hart = zufallsHartspieler(pool), genommen = hart >= 0 ? [hart] : [];
      const rest = misch(normaleSpieler(pool));
      const soll = anzahl >= 11 ? { TW: 1, DF: 4, MF: 4, ST: 2 } : { TW: 1, DF: 3, MF: 3, ST: 2 };
      if (hart >= 0){ const r0 = PLAYER_DATABASE[hart].role; if (soll[r0]) soll[r0]--; }
      for (const rl of ['TW', 'DF', 'MF', 'ST']) for (const i of rest) if (soll[rl] > 0 && PLAYER_DATABASE[i].role === rl && !genommen.includes(i)){ genommen.push(i); soll[rl]--; }
      for (const i of rest){ if (genommen.length >= anzahl) break; if (!genommen.includes(i)) genommen.push(i); }
      return genommen.slice(0, anzahl);
    }
    const normal = normaleSpieler(pool);
    const hart = zufallsHartspieler(pool);
    const genommen = [];
    if (hart >= 0) genommen.push(hart);
    while (genommen.length < anzahl){
      if (!normal.length) break;
      genommen.push(normal[(Math.random() * normal.length) | 0]);
    }
    // Falls der normale Pool kleiner als der gewünschte Kader ist, darf die KI
    // normale Spieler wiederverwenden – aber niemals einen zweiten Hartspieler.
    while (genommen.length < anzahl && normal.length){
      genommen.push(normal[genommen.length % normal.length]);
    }
    return genommen.slice(0, anzahl);
  }

  function kiKaderStufenVerteilen(kader, feld, reihe){
    const normal = normaleSpieler(feld);
    const hart = feld.filter(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].stufe);
    // Pro KI-Team genau EIN Hartspieler. Bronze/Silber/Gold wird pro Team neu zufällig gewählt.
    reihe.forEach(k => {
      if (kader[k].length >= 5) return;
      // V3.50: Wer schon einen Hartspieler hat (z.B. als Torwart), bekommt keinen zweiten.
      if (kader[k].some(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].stufe)) return;
      if (hart.length){
        const hi = (Math.random() * hart.length) | 0;
        kader[k].push(hart.splice(hi, 1)[0]);
      }
    });
    // Danach ausschließlich normale Spieler auffüllen. Wiederverwendung ist erlaubt,
    // damit alle 15 KI-Teams vollständig bleiben, ohne weitere Hartspieler einzubauen.
    let runde = 0;
    while (true){
      const offen = reihe.filter(k => kader[k].length < 5);
      if (!offen.length || !normal.length) break;
      const ordnung = runde % 2 ? offen.slice().reverse() : offen;
      for (const k of ordnung){
        if (kader[k].length >= 5) continue;
        kader[k].push(normal[(runde + kader[k].length + k) % normal.length]);
      }
      runde++;
      if (runde > 20) break;
    }
  }
  // V3.19: Turnierstart-Fix – TURNIER.neu() liegt in einem anderen Bereich und brauchte Zugriff auf diese Funktion.
  window.kiKaderStufenVerteilen = kiKaderStufenVerteilen;

  function starte(opt){
    if (window.__halleStart){ window.__halleStart = false; if (!opt.gast && !opt.turnier && !opt.liga && !window.__ligaModus && window.__modus81 !== 'pokal') opt = { ...opt, halle: true }; }   // HALL OF FAME: nur Freundschaftsspiele
    if (window.__htSpiel){ const h = window.__htSpiel; window.__htSpiel = null; if (opt.halle) opt = { ...opt, htSpiel: h.id, htKO: !!h.ko, htFinale: h.ko === 'finale', htAnsage: h.ansage || null }; }   // HALLENTURNIER
    try { window.__onlineMatch = !!(typeof onlineVerbunden === 'function' && onlineVerbunden()); } catch (e) { window.__onlineMatch = false; }   // V8.1
    // V3.0 STABILITÄTSFIX: ein altes Match darf keinen Callback ins neue Match schicken.
    spielTimerStop();
    if (window.__aufDirekt && !opt.gast && !opt.aufstDone){   // V11.4: Knopf AUFSTELLUNG im Turnier-Fenster – erst die Aufstellung, danach das Skill-Fenster
      let offen = false; try { offen = !!(window.vorAufstellung && window.vorAufstellung(opt, starte)); } catch (e) { console.error('SILESCROW AUFSTELLUNG', e); }
      window.__aufDirekt = false; if (offen) return;
    }
    // Vor jedem neuen Spiel darf der Gastgeber genau 5 Match-Skill-Punkte verteilen.
    // Gäste übernehmen die bereits synchronisierten Punkte des Hosts.
    // V4.1: Vor dem Spiel kann der Star seine gesammelten Trainingspunkte verteilen (nur wenn welche da sind)
    if (!opt.gast && !opt.matchSkills && typeof MATCH_SKILLS !== 'undefined') {
      const stern = Array.isArray(opt.squad) ? opt.squad[0] : -1;
      let hat = false;
      // V7.7: Liga/Turnier – dasselbe Spiel nach Menü/Einstellungen fortsetzen: keine neuen 3 Trainingspunkte, kein Dialog
      const sigT = opt.turnier ? JSON.stringify([opt.turnier, opt.gegnerLand || '', (opt.gegnerIdx || []).join(','), stern]) : null;
      try { hat = false; /* V11.4: Skill-Fenster kommt jetzt nach dem Spiel (siehe endeKern) */ if (hat && sigT && window.__trainingSig === sigT) hat = false; else if (hat) STAND.punkteSetzen(stern, 3); } catch (e) {}
      if (hat){ MATCH_SKILLS.zeigen(opt, () => { window.__trainingSig = sigT; starte({ ...opt, matchSkills: { tem: 0, sch: 0, dri: 0, pas: 0, aus: 0 } }); }); return; }
      opt = { ...opt, matchSkills: { tem: 0, sch: 0, dri: 0, pas: 0, aus: 0 } };
    }
    // V3.0: Verletzte Spieler deines Teams können nicht spielen – ein Bankspieler (sonst die beste freie Karte) springt ein
    if (!opt.gast && Array.isArray(opt.squad) && opt.squad.some(i => VERLETZT.ist(i))){
      const sq = opt.squad.slice(), er = (opt.ersatz || []).slice(), ersetzt = [];
      const pool = () => er.filter(i => !VERLETZT.ist(i) && !sq.includes(i)).concat(AUSWAHL.filter(i => STAND.hatKarte(i) && !VERLETZT.ist(i) && !sq.includes(i) && !er.includes(i)).sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating), PLAYER_DATABASE.map((_, i) => i).filter(i => PLAYER_DATABASE[i].ki && !sq.includes(i) && !er.includes(i)));
      sq.forEach((i, k) => { if (!VERLETZT.ist(i)) return; const n = pool()[0]; if (n == null) return; sq[k] = n; const bi = er.indexOf(n); if (bi >= 0) er.splice(bi, 1); ersetzt.push(PLAYER_DATABASE[i].name + ' → ' + PLAYER_DATABASE[n].name); });
      opt = { ...opt, squad: sq, ersatz: er.filter(i => !VERLETZT.ist(i)) };
      if (ersetzt.length) setTimeout(() => { try { zeigeHinweis('✚ Verletzt: ' + ersetzt.join(' · '), 4.5); } catch (e) {} }, 1800);
    }
    if (!opt.gast && !opt.aufstDone){   // VOR JEDEM SPIEL: Aufstellung ansehen/ändern
      let offen = false; try { offen = !!(window.vorAufstellung && window.vorAufstellung(opt, starte)); } catch (e) { console.error('SILESCROW AUFSTELLUNG', e); }
      if (offen) return;
    }
    rendererBereit();
    welt = {};
    feldSetzen(!!opt.halle);   // HALL OF FAME
    if (opt.halle) opt = { ...opt, wetter: 'klar', nacht: false, temp: 21 };   // in der Halle gibt es kein Wetter
    const wa = opt.wetter ? { wetter: opt.wetter, nacht: opt.nacht, anstoss: opt.anstoss, jz: opt.jz, temp: opt.temp } : wetterAuslosen();
    const jz = wa.jz || jahreszeitJetzt();
    const wetter = wa.wetter, anstoss = wa.anstoss || '15:30';
    const regen = wetter === 'regen';
    const nacht = wa.nacht != null ? !!wa.nacht : false;
    const temp = wa.temp != null ? wa.temp : temperatur(jz, wetter, nacht);   // V4.5
    // Gegner: genau EIN Hartspieler (Bronze/Silber/Gold), alle anderen sind normale Spieler.
    const frei = PLAYER_DATABASE.map((p, i) => i).filter(i => !opt.squad.includes(i));
    for (let i = frei.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [frei[i], frei[j]] = [frei[j], frei[i]]; }
    const laender = COUNTRY_DATABASE.filter(l => l[0] !== opt.land[0]);
    const gegnerLand = opt.gegnerLand || laender[(Math.random() * laender.length) | 0];
    // V6.0: fester Kader der Gegnernation (11 + 2 Bank)
    let natK = null; if (!opt.gast && !opt.modus && !opt.fern) try { natK = nationKader(gegnerLand, opt.kaderBasis || opt); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V4.6: Nationenspiel – Gegner mit seinem Liga-Kader
    let gegnerIdx = opt.gegnerIdx || (natK && natK.elf.length === TEAM_GROESSE ? natK.elf.slice() : kiKaderMitStufen(frei, TEAM_GROESSE));
    const vorKarte = gegnerIdx.slice();
    if (!opt.gast && !opt.modus) try { gegnerIdx = karteFuerGegner(gegnerIdx, gegnerLand, natK && opt.gegnerBonus == null ? { ...opt, gegnerBonus: 1 } : opt); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }
    { // V5.0: gegen die KI-Türkei steht SILESCROW immer in der Startelf (auch wenn er in deinem Team ist)
      const sc = PLAYER_DATABASE.findIndex(p => p.name === 'SILESCROW'), gName = gegnerLand && (Array.isArray(gegnerLand) ? gegnerLand[0] : gegnerLand);
      if (sc >= 0 && gName === 'Türkei' && !gegnerIdx.includes(sc) && !opt.gast && !opt.modus){
        const kand = gegnerIdx.map((i, j) => ({ i, j })).filter(o => PLAYER_DATABASE[o.i].role !== 'TW');
        const raus = kand.filter(o => PLAYER_DATABASE[o.i].role === 'ST' && !PLAYER_DATABASE[o.i].stufe).sort((x, y) => PLAYER_DATABASE[x.i].rating - PLAYER_DATABASE[y.i].rating)[0]
          || kand.filter(o => !PLAYER_DATABASE[o.i].stufe).sort((x, y) => PLAYER_DATABASE[x.i].rating - PLAYER_DATABASE[y.i].rating)[0] || kand[0];
        if (raus){ gegnerIdx = gegnerIdx.slice(); gegnerIdx[raus.j] = sc; }
      } }
    { const z = scZehner(gegnerLand, gegnerIdx);   // V5.0: Türkei mit SILESCROW als Zehner (#10)
      if (z){ const gn = { ...(opt.gegnerNummern || {}) }; Object.keys(gn).forEach(k => { if (+gn[k] === 10) delete gn[k]; }); gn[z.sc] = 10; opt = { ...opt, gegnerNummern: gn, gegnerForm: z.form, gegnerFormSlot: z.pref }; } }
    // HALL OF FAME: 5 gegen 5 (Torwart + 4) – der Rest sitzt auf der Bank und kann beliebig oft eingewechselt werden
    const halleRest = [[], []];
    if (opt.halle){
      const fuenf = (liste, twI, muss) => {
        const tw = liste[twI], keep = [];
        muss.forEach(i => { if (i != null && liste.includes(i) && !keep.includes(i) && keep.length < 5) keep.push(i); });
        if (tw != null && !keep.includes(tw)) keep.push(tw);
        liste.filter(i => !keep.includes(i) && PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role !== 'TW').sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating).forEach(i => { if (keep.length < 5) keep.push(i); });
        liste.filter(i => !keep.includes(i)).forEach(i => { if (keep.length < 5) keep.push(i); });
        const neu = liste.filter(i => keep.includes(i));
        return { neu, tw: Math.max(0, neu.indexOf(tw)), rest: liste.filter(i => !keep.includes(i)) };
      };
      if (opt.squad.length > 5){
        let muss0 = opt.modus === 'zusammen' ? opt.squad.slice(0, 1 + Math.max(0, Math.min(3, opt.fernAnzahl || 0))) : [opt.squad[0]];
        if (opt.halleSlots){ const twS = opt.squad[opt.torwart != null && opt.torwart >= 0 ? opt.torwart : 0]; muss0 = opt.halleSlots.filter(i => i != null && i !== twS && opt.squad.includes(i)); }   // gewählte Hallen-Aufstellung
        const r0 = fuenf(opt.squad, opt.torwart != null && opt.torwart >= 0 ? opt.torwart : 0, muss0);
        halleRest[0] = r0.rest; opt = { ...opt, squad: r0.neu, torwart: r0.tw };
      }
      if (gegnerIdx.length > 5){
        let tg = opt.twG; if (tg == null){ let bw = -1; tg = 0; gegnerIdx.forEach((idx, i) => { const p = PLAYER_DATABASE[idx]; const w = (p.role === 'TW' ? 100 : 0) + (100 - p.rating); if (w > bw){ bw = w; tg = i; } }); }
        const r1 = fuenf(gegnerIdx, tg, Object.values(opt.gegnerSteuer || {}));
        halleRest[1] = r1.rest; gegnerIdx = r1.neu; opt = { ...opt, twG: r1.tw };
      }
    }
    const natBank = natK ? [...vorKarte.filter(i => !gegnerIdx.includes(i) && PLAYER_DATABASE[i] && !PLAYER_DATABASE[i].stufe), ...natK.bank] : null;
    lokal.heim = null; for (const fk of fernKs) fk.heim = null;   // V8.5
    for (const fk of fernKs){ fk.steuer = null; fk.ki = null; fk.lade = -1; fk.ein = { x: 0, z: 0, sp: false }; } fernTasten = [null, null, null];
    aufnahme.length = 0; aufnahmeUhr = 0; wdhAnzeige(false);
    s = { optionen: opt, stufe: opt.stufe, spieler: [], tore: [0, 0], zeit: SPIELZEIT, phase: 'start', phaseT: 1.4,
          land: opt.land, gegner: gegnerLand, regen, wetter, nacht, anstoss, schnee: wetter === 'schnee', sonne: wetter === 'sonne', stat: { schuesse: [0, 0], paraden: [0, 0], fouls: [0, 0] }, steuer: null, lade: -1, std: null, besitzTeam: null, naechsterAnstoss: 0, ersterAnstoss: 0, getauscht: false, halbzeitGewesen: false, verlaengerung: false, elfmeter: false, elf: null, _timerIds: [] };
    s.kits = [];
    s.halle = !!opt.halle;   // HALL OF FAME
    s.nsSoll = [0, 0, 0, 0]; s.ns = null; s.nsFertig0 = false; s.nsFertig1 = false;   // V6.2: Nachspielzeit
    s.teamgeist = (!opt.gast && !opt.fern && opt.modus !== 'zusammen') ? Math.round(PRESSE_STAND.geistNehmen() * 1.5) : 0;   // V5.3: aus der letzten Pressekonferenz
    { const bel = PRESSE_STAND.b / 100, auswaerts = opt.heim === false;   // V5.3: Beliebtheit füllt das Stadion, auswärts weniger eigene Fans
      const mein = (.25 + .7 * bel) * (auswaerts ? .45 : 1), gast = auswaerts ? .92 : .55;
      s.fanFuellung = { heim: mein, gast, mix: (mein + gast) / 2 };
      window.__fanLaut = .5 + .7 * Math.max(mein, auswaerts ? .5 : 0); }
    s.jz = jz; s.temp = temp;   // V4.5: Jahreszeit und Temperatur
    s.kits[0] = trikotFuer(opt.land, null);
    s.kits[1] = trikotFuer(gegnerLand, s.kits[0]);
    s.kartenLog = [];
    s.nummernVorgabe = [opt.nummern || {}, opt.gegnerNummern || {}];
    s.nummern = [new Set(Object.values(s.nummernVorgabe[0]).map(Number)), new Set(Object.values(s.nummernVorgabe[1]).map(Number))];
    baueWelt(wetter);
    welt.nacht = nacht;
    welt.fans = null;
    if (!s.halle) { const wl = welt; publikumFiguren(wetter, s.kits, [opt.land, gegnerLand], frames => { if (welt === wl) wl.fans = frames; }); }
    welt.sterne = Array.from({length: 60}, () => [Math.random(), Math.random() * .3, Math.random()]);
    welt.schiri = baueSchiri();
    // V5.5: zwei Linienrichter mit Fahne – lauern nahe den Eckfahnen (einer gegenüber links, einer vorne rechts)
    welt.linienRichter = [['b16', -1], ['c13', 1]].map(([key, seite]) => {
      const f = baueFigur(key, '#111111', 2); f.schiri = true;
      const o = { ...f, daten: { name: 'LINIE', rating: 75, bild: key }, p: V(seite * (HL - 3), 0, seite * (HB + .7)), v: V(), blick: V(0, 0, -seite), laufPhase: 0, karteFarbe: '#ffe234', karteT: 0, tempo: 4, sprung: 0, jubel: 0, gefallen: 0, grae: 0, seite };
      trikotVorbereiten(o, key, { t: '#1a1a1a', kragen: '#ffe234', n: '#ffffff', h: '#111', s: '#111', sBand: [], schuh: ['#111'], land: null }, '');
      return o;
    });
    if (s.halle) welt.linienRichter = [];   // HALL OF FAME: keine Linienrichter
    const rang = { DF: 0, TW: 0, MF: 1, ST: 2 };
    const teamAufbauen = (idxListe, team, twIndex, posi, formKey, formPref) => {
      const sp = [];
      const eigenAbzug = team === 0 && !s.fern && !s.gast;
      if (eigenAbzug){ s.posAbzug = {}; const tw = PLAYER_DATABASE[idxListe[twIndex]]; if (tw) s.posAbzug[idxListe[twIndex]] = posAbzug(tw.pos, 'TW'); }
      sp.push(neuerSpieler(PLAYER_DATABASE[idxListe[twIndex]], team, 'TW', -1));
      const feldIdx = idxListe.filter((_, i) => i !== twIndex);
      if (feldIdx.length > 4 || (s.halle && feldIdx.length === 4)){
        // 11er-Test 1.0: Formation 4-4-2 – jede Position hat einen Anker (fu: -1 eigenes Tor … +1 gegnerisches Tor, fv: -1 … +1 Breite)
        const fKey = (FORMEN[formKey] && FORMEN[formKey].reduce((a, b) => a + b, 0) === feldIdx.length) ? formKey : '4-4-2';   // V7.2
        const FORM = feldIdx.length === 4 ? HALLEN_FORMEN[(team === 0 && !s.gast && !s.fern) ? hallenFormKey() : '1-2-1'].map(f => ({ ...f })) : feldIdx.length === 10 ? formSlots(fKey) : feldIdx.length < 0 ? [
          // 8+1-Test: 3-3-2
          { fu: -.60, fv: -.55, slot: 0, seite: -1, rolle: 'DF' }, { fu: -.68, fv: 0, slot: 0, seite: 0, rolle: 'DF' }, { fu: -.60, fv: .55, slot: 0, seite: 1, rolle: 'DF' },
          { fu: -.18, fv: -.58, slot: 1, seite: -1, rolle: 'MF' }, { fu: -.26, fv: 0, slot: 1, seite: 0, rolle: 'MF' }, { fu: -.18, fv: .58, slot: 1, seite: 1, rolle: 'MF' },
          { fu: .30, fv: -.2, slot: 2, seite: 0, rolle: 'ST' }, { fu: .30, fv: .2, slot: 2, seite: 0, rolle: 'ST' }] : [
          { fu: -.60, fv: -.66, slot: 0, seite: -1, rolle: 'DF' }, { fu: -.68, fv: -.22, slot: 0, seite: 0, rolle: 'DF' },
          { fu: -.68, fv: .22, slot: 0, seite: 0, rolle: 'DF' },   { fu: -.60, fv: .66, slot: 0, seite: 1, rolle: 'DF' },
          { fu: -.14, fv: -.64, slot: 1, seite: -1, rolle: 'MF' }, { fu: -.26, fv: -.20, slot: 1, seite: 0, rolle: 'MF' },
          { fu: -.26, fv: .20, slot: 1, seite: 0, rolle: 'MF' },   { fu: -.14, fv: .64, slot: 1, seite: 1, rolle: 'MF' },
          { fu: .30, fv: -.18, slot: 2, seite: 0, rolle: 'ST' },   { fu: .30, fv: .18, slot: 2, seite: 0, rolle: 'ST' }];
        const frei = FORM.slice(), zu = new Map();
        if (feldIdx.length === 10 && (team === 0 || (formPref && Object.keys(formPref).length))){ formZuweisen(feldIdx, fKey, formPref).forEach((sl, i) => zu.set(i, FORM[sl])); }
        if (team === 0 && s.halle && feldIdx.length === 4 && opt.halleSlots){ opt.halleSlots.forEach((i, k) => { if (feldIdx.includes(i) && FORM[k]) zu.set(i, FORM[k]); }); }   // Plätze aus der Aufstellungs-Vorschau
        const nachRolle = feldIdx.map(i => PLAYER_DATABASE[i]).map((d, k) => ({ d, i: feldIdx[k] })).sort((a, b) => b.d.rating - a.d.rating);
        for (const runde of [0, 1]) for (const e of nachRolle){
          if (zu.has(e.i)) continue;
          const want = e.d.role === 'TW' ? 'DF' : e.d.role;
          const j = runde === 0 ? frei.findIndex(f => f.rolle === want) : 0;
          if (j >= 0 && frei.length){ zu.set(e.i, frei[j]); frei.splice(j, 1); }
        }
        feldIdx.forEach(i => { const f = zu.get(i); if (!f) return; if (eigenAbzug) s.posAbzug[i] = posAbzug(PLAYER_DATABASE[i].pos, f.label || ({ DF: 'IV', MF: 'ZM', ST: 'MS' })[f.rolle]); const q = neuerSpieler(PLAYER_DATABASE[i], team, f.rolle, f.slot); q.seite = f.seite; q.fu = f.fu; q.fv = f.fv; sp.push(q); });
      } else if (posi){
        // gewählte Positionen: Abwehr (Slot 0), Mittelfeld (Slot 1), Sturm (Slot 2)
        const pv = positionenVerteilen(feldIdx, posi);
        feldIdx.slice().sort((a, b) => POS_RANG[pv[a]] - POS_RANG[pv[b]]).forEach(i => { const q = neuerSpieler(PLAYER_DATABASE[i], team, POS_ROLLE[pv[i]], POS_RANG[pv[i]]); q.seite = POS_SEITE[pv[i]] || 0; sp.push(q); });
      } else {
        const feld = feldIdx.map(i => PLAYER_DATABASE[i]).sort((a, b) => rang[a.role] - rang[b.role] || b.rating - a.rating);
        const slots = feld.length >= 4 ? [0, 0, 1, 2] : [0, 1, 2], seiten = feld.length >= 4 ? [-1, 1, 0, 0] : [0, 0, 0];
        feld.slice(0, 4).forEach((d, k) => { const q = neuerSpieler(d, team, d.role === 'TW' ? 'DF' : d.role, slots[k]); q.seite = seiten[k]; sp.push(q); });
      }
      return sp;
    };
    teamAufbauen(opt.squad, 0, opt.torwart, opt.posi || null, opt.formation || zustand.formation, opt.formSlot || zustand.formSlot);
    lokal.fest = !ALLE_STEUERN;   // Testversion: Steuerung wechselt wie bei FC zum wichtigen Spieler
    let twG = 0, bestW = -1;
    gegnerIdx.forEach((idx, i) => { const p = PLAYER_DATABASE[idx]; const w = (p.role === 'TW' ? 100 : 0) + (100 - p.rating); if (w > bestW){ bestW = w; twG = i; } });
    if (opt.twG != null) twG = opt.twG;
    teamAufbauen(gegnerIdx, 1, twG, opt.gegnerPosi && Object.keys(opt.gegnerPosi).length ? opt.gegnerPosi : null, opt.gegnerForm, opt.gegnerFormSlot);
    // V2.63: Steuerziel ist NICHT automatisch der Torwart.
    // Im Einzelspieler ist immer der zuerst gewählte Spieler (squad[0]) der Mensch.
    // Nur bei ausdrücklich gewähltem TOR darf dieser erste Spieler als TW gesteuert werden.
    const menschSpieler = s.spieler.find(p => p.team === 0 && p.daten === PLAYER_DATABASE[opt.squad[0]]);
    const menschTorwart = !!opt.menschTorwart;
    s.du = menschTorwart
      ? (s.spieler.find(p => p.team === 0 && p.rolle === 'TW' && p.daten === PLAYER_DATABASE[opt.squad[0]]) || menschSpieler)
      : menschSpieler;
    if (!s.du) s.du = s.spieler.find(p => p.team === 0 && p.daten === PLAYER_DATABASE[opt.squad[0]]) || s.spieler.find(p => p.team === 0);
    // V5.1: Ohne ausdrückliche Torwart-Wahl steuert der Mensch nie den Torwart.
    if (!menschTorwart && s.du && s.du.rolle === 'TW'){ const f = s.spieler.find(p => p.team === 0 && p.rolle !== 'TW'); if (f) s.du = f; }
    s.steuer = s.du; s.lokalTeam = 0;
    // V3.0: Auswechselbank – je Team 2 Spieler, max. 2 Wechsel
    {
      const im = i => opt.squad.includes(i) || gegnerIdx.includes(i);
      let e0 = Array.isArray(opt.ersatz) ? opt.ersatz.filter(i => PLAYER_DATABASE[i] && !im(i) && !VERLETZT.ist(i)) : [];
      if (e0.length < 2 && typeof ersatzAuffuellen === 'function'){ try { e0 = e0.concat(ersatzAuffuellen(opt.squad).filter(i => !im(i) && !e0.includes(i))); } catch (e) {} }
      let e1 = (Array.isArray(opt.gegnerErsatz) ? opt.gegnerErsatz : (natBank || [])).filter(i => PLAYER_DATABASE[i] && !im(i) && !e0.includes(i));
      for (const i of frei){ if (e1.length >= 2) break; if (!im(i) && !e0.includes(i) && !e1.includes(i)) e1.push(i); }
      if (s.halle){ e0 = halleRest[0].concat(e0.filter(i => !halleRest[0].includes(i))); e1 = halleRest[1].concat(e1.filter(i => !halleRest[1].includes(i))); }
      s.bank = s.halle ? [e0.slice(0, 12), e1.slice(0, 12)] : [e0.slice(0, 2), e1.slice(0, 2)];   // Halle: alle aus dem Kader können rein
      if (s.halle && opt.halleBank) s.bank = opt.halleBank.map(b => b.slice());   // Gast: Bank wie beim Gastgeber
      s.wechselN = [0, 0]; s.wechselPlan = [[], []]; s.trainer = null; s.raus = [[], []]; s.kiWechselT = 0; s.wechselTippT = {}; s.mussRaus = []; s.neuVerletzt = {};
    }
    try { trainerWaehlen(opt, gegnerIdx); bankFigurenAufbauen(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V3.0 / V3.4
    // Mehrspieler: zweiter Mensch steuert einen festen Spieler
    s.fern = false; s.fernSpieler = null; s.gast = !!opt.gast; s.endeGezeigt = false;
    // V5.1: Spielerwechsel nur im Einzelspieler mit Feldspieler (nicht als Torwart, nicht online/lokal mit Mitspielern)
    s.fernWechsel = [false, false, false]; s.meinFernNr = null;
    s.wechselOK = !s.gast && opt.modus !== 'zusammen' && !menschTorwart && !!s.du && s.du.rolle !== 'TW' && !(NETZ && (NETZ.rolle === 'host' || NETZ.rolle === 'gast'));
    // Zufallssimulation nur im echten Einzelspieler-Modus anbieten.
    // Im Online-Spiel (Host/Gast) und lokalen Mehrspieler-Modus ausblenden.
    $s('spielSimulieren').hidden = true;   // V5.3: Vorspulen entfernt
    s.andereMenschen = []; mnListe = [];
    const anzG = Math.max(1, Math.min(3, opt.fernAnzahl || 1));
    if (opt.modus === 'zusammen'){
      const fp = k => s.spieler.find(p => p.team === 0 && p.daten === PLAYER_DATABASE[opt.squad[k]]);
      // V4.3: Gäste können auch im Gegnerteam (Team 1) spielen. Sie steuern einen festen Gegner-Feldspieler (nach Wertung sortiert, ohne Torwart).
      const pl = opt.plaetze || {}, gpl = opt.gegnerPlaetze || {}, gids = Object.keys(pl);
      const beanspr = Object.values(opt.gegnerSteuer || {});   // V4.2: feste Spieler von Gästen mit eigenem Team
      const gegnerFeld = j => s.spieler.map((p, i) => ({ p, i })).filter(x => x.p.team === 1 && x.p.rolle !== 'TW' && !beanspr.some(v => PLAYER_DATABASE[v] === x.p.daten)).sort((a, b) => b.p.rating - a.p.rating || a.i - b.i).map(x => x.p)[j - 1] || null;
      const spielerFuer = gid => gpl[gid] ? ((opt.gegnerSteuer && opt.gegnerSteuer[gid] != null) ? (s.spieler.find(p => p.team === 1 && p.daten === PLAYER_DATABASE[opt.gegnerSteuer[gid]]) || null) : gegnerFeld(gpl[gid])) : fp(pl[gid]);
      if (gids.length){
        if (s.gast){
          const eigener = spielerFuer(NETZ.gid);
          if (eigener){ s.steuer = eigener; s.lokalTeam = gpl[NETZ.gid] ? 1 : 0; s.fernSpieler = s.du; s.andereMenschen = [s.du]; gids.forEach(g2 => { const q = spielerFuer(g2); if (q && q !== eigener) s.andereMenschen.push(q); });
            s.meinFernNr = (pl[NETZ.gid] || 1) - 1;   // V5.5: Wechsel nur, wenn ich allein in meinem Team bin (Gegeneinander) und kein Torwart
            { const n1 = gids.filter(g2 => gpl[g2]).length, n0 = 1 + gids.length - n1; s.wechselOK = ((gpl[NETZ.gid] ? n1 : n0) === 1) && eigener.rolle !== 'TW'; } }
        } else {
          gids.forEach(g2 => {
            const k = fernKs[pl[g2] - 1], q = spielerFuer(g2); if (!k || !q) return;
            k.steuer = q; k.team = gpl[g2] ? 1 : 0; s.andereMenschen.push(q);
            gastNameEintragen(q, NETZ.gaeste.find(x => x.gid === g2));   // V5.1
            if (gpl[g2]) q.tempo /= (STUFE[s.stufe].tempo || 1);   // Mensch im Gegnerteam spielt ohne KI-Tempo-Abzug
          });
          s.fern = fernKs.some(k => k.steuer); s.fernSpieler = (fernKs.find(k => k.steuer) || {}).steuer || null; hostNameEintragen();
          // V5.5: Gegeneinander - jeder Mensch, der allein in seinem Team ist, darf wechseln (nie auf den Torwart)
          { const nT = [0, 0]; nT[0] = 1; fernKs.forEach(k => { if (k.steuer) nT[k.team]++; });
            s.wechselOK = nT[0] === 1 && !menschTorwart && !!s.du && s.du.rolle !== 'TW';
            fernKs.forEach((k, i) => { s.fernWechsel[i] = !!(k.steuer && nT[k.team] === 1 && k.steuer.rolle !== 'TW'); }); }
        }
      } else if (s.gast){
        const mein = Math.max(1, Math.min(3, opt.meinPlatz || 1)), eigener = fp(mein);
        if (eigener){ s.steuer = eigener; s.lokalTeam = 0; s.fernSpieler = s.du; s.andereMenschen = [s.du]; for (let k = 1; k <= anzG; k++){ const q = fp(k); if (q && q !== eigener) s.andereMenschen.push(q); } s.meinFernNr = mein - 1; }
      } else {
        for (let k = 1; k <= anzG; k++){ const q = fp(k); if (q){ fernKs[k - 1].steuer = q; fernKs[k - 1].team = 0; s.andereMenschen.push(q); gastNameEintragen(q, NETZ.gaeste.find(x => x.k === k)); } }
        s.fern = fernKs.some(k => k.steuer); s.fernSpieler = fernKs[0].steuer; hostNameEintragen();
      }

    }
    s.setup = { id: opt.setupId || (Date.now() % 1e9), squad: opt.squad, torwart: opt.torwart, menschTorwart: !!opt.menschTorwart,
                land: COUNTRY_DATABASE.findIndex(l => l[0] === opt.land[0]), gland: COUNTRY_DATABASE.findIndex(l => l[0] === gegnerLand[0]), heim: opt.heim,
                stufe: opt.stufe, regen, wetter, nacht, anstoss, jz, temp, nummern: opt.nummern || {}, gegnerNummern: opt.gegnerNummern || {}, gegnerIdx, twG, gegnerPosi: opt.gegnerPosi || null, gegnerSteuer: opt.gegnerSteuer || null, modus: opt.modus || null, plaetze: opt.plaetze || {}, gegnerPlaetze: opt.gegnerPlaetze || {}, fernAnzahl: anzG, posi: opt.posi || null, werte: opt.werte || null, spezial: opt.spezial || null, matchSkills: opt.matchSkills || null, halle: !!opt.halle, bank: s.halle ? s.bank.map(b => b.slice()) : null };
    if (s.fern) NETZ.setup(s.setup);
    anstossPositionen(0);
    welt.ball.p.set(0, BALL_R, 0);
    welt.schiri.p.set(0, 0, HB - 5);
    einlaufStart();
    kamTV.x = 0; kamTV.rail = null; kamTV.railV = 0; kamTV.mix = null; kamZiel.set(0, 0, -.8); kam.pos.set(0, KAM_H, KAM_Z); kamF.x = 0; kamF.z = -.8; kamF.vx = kamF.vz = 0; kamF.zoom = ZOOM_STUFEN[zoomStufe];
    // Anzeige
    $s('flA').innerHTML = flaggeHTML(opt.land[0]); $s('kuA').textContent = KUERZEL[opt.land[0]] || opt.land[0].slice(0, 3).toUpperCase();
    $s('flB').innerHTML = flaggeHTML(gegnerLand[0]); $s('kuB').textContent = KUERZEL[gegnerLand[0]] || gegnerLand[0].slice(0, 3).toUpperCase();
    aktualisiereTafel();
    $s('endeUeber').hidden = true; $s('pauseUeber').hidden = true;
    $s('spiel').hidden = false;
    window.__joyRuhe && window.__joyRuhe();
    laeuft = true; pausiert = false; zuletzt = 0;
    if (opt.htAnsage) spielTimer(() => { try { if (s && s.optionen === opt && typeof KOMMENTAR !== 'undefined') KOMMENTAR.ereignis(opt.htAnsage, null, true); } catch (e) {} }, 2600);   // Kommentatorin: Turnierrunde
    meldung(opt.htSpiel ? (opt.htKO ? (opt.htAnsage === 'ht_finale' ? 'HALL OF FAME CUP · FINALE' : 'HALL OF FAME CUP · HALBFINALE') : 'HALL OF FAME CUP') : opt.turnier || ({ regen: 'REGENSPIEL', schnee: 'SCHNEESPIEL', sonne: 'SONNENSCHEIN' }[wetter] || 'ANPFIFF'), 'Anstoß ' + anstoss + (nacht ? ' · Flutlicht · ' : ' · ') + (opt.heim === false ? (KUERZEL[gegnerLand[0]] || '') + ' gegen ' + (KUERZEL[opt.land[0]] || '') : (KUERZEL[opt.land[0]] || '') + ' gegen ' + (KUERZEL[gegnerLand[0]] || '')), null, 1.6);   // V8.6: Heimteam zuerst
    musik.spiele('stille'); musik.sfx && musik.sfx.stadion(true, regen); musik.sfx && musik.sfx.torVorladen && musik.sfx.torVorladen();
    if (!opt.gast) spielTimer(() => { if (s && s.optionen === opt && typeof KOMMENTAR !== 'undefined') KOMMENTAR.ereignis(opt.turnier === 'VIERTELFINALE' ? 'runde_vf' : opt.turnier === 'HALBFINALE' ? 'runde_hf' : opt.turnier === 'FINALE' ? 'runde_f' : 'begruessung', null, true); }, 400);
    if (!rafId) rafId = requestAnimationFrame(schleife);
  }


  // =================================================================
  // Mehrspieler: Zustand senden (Gastgeber) und anzeigen (Gast)
  // =================================================================
  const r2 = v => Math.round(v * 100) / 100;
  let sendeT = 0, seq = 0, fernTasten = [null, null, null];
  // V5.1: Kommentator auf allen Handys – Gastgeber hängt den zuletzt gesprochenen Satz an den Zustand (Nr, Satz, Alter in ms)
  let kmNr = 0, kmLetzt = null, kmZeit = 0;
  // V5.1: Namen der Online-Spieler über dem Kopf – Liste [Spielerindex, Name], vom Gastgeber im Zustand mitgeschickt
  let mnListe = [];
  function hostNameEintragen(){ if (s && s.fern && s.steuer){ const nm = NETZ.name || 'Gastgeber'; s.steuer.onlineName = nm; mnListe.push([s.spieler.indexOf(s.steuer), nm]); } }   // V5.10: auch ohne eingetragenen Namen bekommt der Gastgeber das Symbol
  function gastNameEintragen(q, gx){ if (!q || !gx) return; const nm = gx.nm || ('Gast ' + gx.k); q.onlineName = nm; mnListe.push([s.spieler.indexOf(q), nm]); }
  if (typeof KOMMENTAR !== 'undefined') KOMMENTAR.setSenden(id => {
    if (!s || !s.fern) return;
    kmLetzt = [++kmNr, id]; kmZeit = performance.now();
    try { sendeT = 0; sendeZustand(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // sofort senden, damit alle gleichzeitig hören
  });
  function sendeZustand(){
    const jetzt = performance.now(); if (jetzt - sendeT < 45) return; sendeT = jetzt;
    const b = welt.ball, sch = welt.schiri;
    const pl = s.spieler.map(p => [r2(p.p.x), r2(p.p.z), r2(p.v.x), r2(p.v.z), r2(p.blick.x), r2(p.blick.z),
      r2(Math.max(0, p.grae)), r2(Math.max(0, p.gefallen)), r2(Math.max(0, p.hecht || 0)), p.hechtSeite || 0,
      r2(Math.max(0, p.jubel)), r2(Math.max(0, p.sprung)), p.aktiv ? 1 : 0, r2(p.spezLade || 0), r2(Math.max(0, p.spezT || 0)), Math.max(0, JUBEL_ARTEN.indexOf(p.jubelArt || '')), r2(Math.max(0, p.salto || 0))]);
    NETZ.zustand({ q: ++seq, id: s.setup.id, ph: s.phase, t: r2(s.zeit), ns: s.ns ? [s.ns.halb, s.ns.min] : 0, sc: s.tore, pl, gt: s.getauscht ? 1 : 0, hg: s.halbzeitGewesen ? 1 : 0, stt: s.phase === 'halbzeit' ? s.stat : undefined, et: s.verlaengerung ? 1 : 0, eh: s.vHalb ? 1 : 0,
      b: [r2(b.p.x), r2(b.p.y), r2(b.p.z), r2(b.v.x), r2(b.v.y), r2(b.v.z)],
      bo: b.besitzer ? s.spieler.indexOf(b.besitzer) : -1,
      sr: [r2(sch.p.x), r2(sch.p.z), r2(sch.v.x), r2(sch.v.z), r2(Math.max(0, sch.karteT)), sch.karteFarbe],
      wc: s.wcLog || 0, tf: sch.tafel ? [sch.tafel.raus || 0, sch.tafel.rein || 0, sch.tafelAn ? 1 : 0] : 0,   // V7.9
      hs: s.spieler.indexOf(s.steuer), fk: fernKs.map(k => k.steuer ? s.spieler.indexOf(k.steuer) : -1), mh: [s.steuer, ...fernKs.map(k => k.steuer)].filter(Boolean).map(p => s.spieler.indexOf(p)), m: letzteMeldung, pa: pausiert ? 1 : 0, km: kmLetzt ? [kmLetzt[0], kmLetzt[1], Math.round(performance.now() - kmZeit)] : null, mn: mnListe,
      el: s.elf && s.so ? [s.elf.treffer, s.elf.schuesse.map(a => a.map(x => x ? 1 : 0)), s.elf.aktiv ? 1 : 0, s.so.schuetze ? s.spieler.indexOf(s.so.schuetze) : -1] : 0,   // V9.2
      hn: hnDaten ? [hnDaten.id, hnDaten.nr, hnDaten.t, hnDaten.d, Math.round(performance.now() - hnDaten.zeit)] : null });
  }
  // Eingaben des Mitspielers (aus dessen Raum-Status)
  function fernEingabe(e, nr = 0){
    const k = fernKs[nr];
    if (!s || !s.fern || !e || !k || !k.steuer) return;
    k.ein = { x: +e.x || 0, z: +e.z || 0, sp: !!e.sp };
    const t = e.t || {};
    if (!fernTasten[nr]){ fernTasten[nr] = { sR: t.sR || 0, sH: t.sH || 0, pa: t.pa || 0, sz: t.sz || 0, wx: t.wx || 0, fl: t.fl || 0, fh: t.fh || 0 }; return; }
    if ((t.sz || 0) > (fernTasten[nr].sz || 0)){ fernTasten[nr].sz = t.sz; spezialAusloesen(k); }
    const ft = fernTasten[nr];
    if ((t.wx || 0) > (ft.wx || 0)){ ft.wx = t.wx; spielerWechseln(k); }   // V5.5
    if ((t.sR || 0) > ft.sR){ ft.sR = t.sR; schussRunter(k); }
    if ((t.sH || 0) > ft.sH){ ft.sH = t.sH; schussHoch(k); }
    if ((t.pa || 0) > ft.pa){ ft.pa = t.pa; passKnopf(k); }
    if ((t.fl || 0) > (ft.fl || 0)){ ft.fl = t.fl; flankeKnopf(k, .35); }   // V7.0 M3
    if ((t.fh || 0) > (ft.fh || 0)){ ft.fh = t.fh; flankeKnopf(k, 1); }
  }
  // V4.1: Mitspieler getrennt -> die KI spielt seine Figur; kommt er zurück, bekommt er sie wieder
  // V4.5: Verbindung weg -> das Spiel wartet bis zu 20 s auf die Rückkehr, danach übernimmt die KI
  const graceT = {};
  function kiUebernimmt(nr){
    const k = fernKs[nr]; if (!k || !k.steuer) return;
    const name = k.steuer.name || 'Mitspieler';
    k.ki = k.steuer; k.steuer = null; k.lade = -1;
    try { zeigeHinweis(name + ' getrennt – KI übernimmt', 3); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  function graceEnde(nr, zurueck){
    const g = graceT[nr]; if (!g) return;
    clearInterval(g.t); delete graceT[nr];
    const k = fernKs[nr];
    if (!zurueck) kiUebernimmt(nr);
    if (g.eigen && Object.keys(graceT).length === 0 && laeuft && pausiert) pause(false);
    if (zurueck && k && k.steuer){ try { zeigeHinweis((k.steuer.name || 'Mitspieler') + ' ist wieder da', 3); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
  }
  function graceAlle(){ Object.keys(graceT).forEach(n => { clearInterval(graceT[n].t); delete graceT[n]; }); }
  function fernWeg(nr){
    const k = fernKs[nr]; if (!k) return;
    k.ein = { x: 0, z: 0, sp: false };
    if (!k.steuer || graceT[nr]) return;
    if (laeuft && s && s.phase !== 'ende'){
      // V9.0: keine KI-Übernahme – das Spiel wartet (ohne Zeitlimit), bis der Mitspieler wieder da ist
      const name = (k.steuer.onlineName || k.steuer.name || 'Mitspieler'), g = graceT[nr] = { rest: 0, eigen: !pausiert };
      if (g.eigen) pause(true, true);   // V9.1: auch online pausieren
      const zeigen = () => { try { $s('pauseInfo').textContent = '⏸ ' + name + ' hat die Verbindung verloren – warte auf die Rückkehr … (' + g.rest + ' s)'; } catch(e){typeof __scWarn==='function'&&__scWarn(e)} };
      zeigen();
      g.t = setInterval(() => { g.rest++; zeigen(); }, 1000);
      return;
    }
  }
  function fernZurueck(nr){
    if (graceT[nr]){ graceEnde(nr, true); return; }
    const k = fernKs[nr]; if (!k || k.steuer || !k.ki) return;
    k.steuer = k.ki; k.ki = null; fernTasten[nr] = null;
    try { zeigeHinweis((k.steuer.name || 'Mitspieler') + ' ist wieder da', 3); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  let gastZiel = null, gastZeit = 0, gastLetzteM = 0, gastKm = null, gastHn = null;
  setInterval(() => { try { if (s && s.gast && laeuft && gastZeit && performance.now() - gastZeit > 1500) zeigeHinweis('⏸ Spiel pausiert – warte auf Mitspieler …', 1.2); } catch (e) {} }, 1000);   // V9.1
  function gastEmpfang(z){
    if (!s || !s.gast || !z || z.id !== s.setup.id) return;
    // V5.1: Kommentator-Satz vom Gastgeber gleichzeitig abspielen (alte Sätze > 2,5 s werden übersprungen)
    if (z.km && z.km[0] !== gastKm){ gastKm = z.km[0]; if ((z.km[2] | 0) < 2500){ try { KOMMENTAR.gastSpiele(z.km[1]); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} } }
    // Hinweis (z. B. 'FLANKE!') nur beim Gast, der die Taste gedrückt hat; alte Hinweise (> 1,5 s) werden übersprungen
    if (z.hn && z.hn[0] !== gastHn){ gastHn = z.hn[0]; if (z.hn[1] === s.meinFernNr && (z.hn[4] | 0) < 1500) zeigeHinweis(z.hn[2], z.hn[3]); }
    if (z.mn){ for (const e of z.mn){ const q = s.spieler[e[0]]; if (q && q.onlineName !== e[1]) q.onlineName = e[1]; } }   // V5.1: Namen der Online-Spieler
    if (gastZiel && z.q <= gastZiel.q) return;
    gastZiel = z; gastZeit = performance.now();
  }
  function gastSchritt(dt){
    if (s.lade >= 0) s.lade = Math.min(1, s.lade + dt / .9);
    const r = eingabeRichtung(); NETZ.eingabe({ x: r2(r.x), z: r2(r.z), sp: eingabe.sprint ? 1 : 0 });
    for (const n of welt.tore) aktualisiereNetz(n, dt);
    try { abgangSchritt(dt); } catch (e) {}   // V7.9
    { const zw = gastZiel; if (zw && zw.wc){ s.wcAnz = s.wcAnz || 0; while (s.wcAnz < zw.wc.length){ const we = zw.wc[s.wcAnz++]; try { gastWechsel(we); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } } } }   // V7.9: Wechsel des Gastgebers nachbauen
    const z = gastZiel; if (!z) return;
    const alter = Math.min(.25, (performance.now() - gastZeit) / 1000), a = Math.min(1, dt * 14);
    z.pl.forEach((d, i) => {
      const p = s.spieler[i]; if (!p) return;
      const zx = d[0] + d[2] * alter, zz = d[1] + d[3] * alter;
      if (Math.hypot(p.p.x - zx, p.p.z - zz) > 3){ p.p.x = zx; p.p.z = zz; } else { p.p.x += (zx - p.p.x) * a; p.p.z += (zz - p.p.z) * a; }
      p.v.set(d[2], 0, d[3]); if (d[4] || d[5]) p.blick.set(d[4], 0, d[5]);
      p.grae = d[6]; p.gefallen = d[7]; p.hecht = d[8]; p.hechtSeite = d[9]; p.jubel = d[10]; p.sprung = d[11]; p.spezLade = d[13] || 0; p.spezT = d[14] || 0; p.jubelArt = JUBEL_ARTEN[d[15] | 0] || null; p.salto = d[16] || 0;
      const akt = !!d[12]; if (p.aktiv !== akt){ p.aktiv = akt; p.gruppe.visible = akt; }
    });
    const b = welt.ball, q = z.b;
    const zx = q[0] + q[3] * alter, zz = q[2] + q[5] * alter, zy = Math.max(BALL_R, q[1] + q[4] * alter - .5 * G * alter * alter * (q[1] > BALL_R + .05 ? 1 : 0));
    if (Math.hypot(b.p.x - zx, b.p.z - zz) > 3){ b.p.set(zx, zy, zz); } else { b.p.x += (zx - b.p.x) * a; b.p.z += (zz - b.p.z) * a; b.p.y += (zy - b.p.y) * a; }
    b.v.set(q[3], q[4], q[5]);
    const sp = Math.hypot(q[3], q[5]); if (sp > .05) b.rot += (q[3] >= 0 ? 1 : -1) * sp * dt / BALL_R * .5;
    b.besitzer = z.bo >= 0 ? s.spieler[z.bo] : null; s.gastBall = z.bo;
    b.schussVon = (!b.besitzer && sp > 11) ? true : null;
    if (Math.abs(b.p.x) > HL + .3 && Math.abs(b.p.z) < TB && b.p.y < TH){ const netz = welt.tore[b.p.x > 0 ? 1 : 0]; netzStoss(netz, b.p.z, b.p.y, Math.abs(b.v.x) * .02); }
    const sch = welt.schiri, w = z.sr;
    sch.p.x += (w[0] + w[2] * alter - sch.p.x) * a; sch.p.z += (w[1] + w[3] * alter - sch.p.z) * a; sch.v.set(w[2], 0, w[3]);
    const ssp = Math.hypot(w[2], w[3]); if (ssp > .5) sch.blick.set(w[2] / ssp, 0, w[3] / ssp);
    sch.karteT = w[4]; sch.karteFarbe = w[5];
    if (z.tf){ sch.tafel = { raus: z.tf[0], rein: z.tf[1] }; sch.tafelAn = !!z.tf[2]; } else { sch.tafel = null; sch.tafelAn = false; }   // V7.9
    if (z.ph === 'halbzeit' && s.phase !== 'halbzeit'){ s.phase = z.ph; s.stat = z.stt || s.stat; halbzeitZeigen(); }
    if (z.ph !== 'halbzeit' && s.phase === 'halbzeit') $s('hzUeber').hidden = true;
    s.phase = z.ph; s.zeit = z.t; s.ns = z.ns ? { halb: z.ns[0], min: z.ns[1], t: 0, warte: 0 } : null; s.getauscht = !!z.gt; s.halbzeitGewesen = !!z.hg; s.verlaengerung = !!z.et; s.vHalb = z.eh ? 1 : 0; wdhAnzeige(z.ph === 'wiederholung');
    if (s.tore[0] !== z.sc[0] || s.tore[1] !== z.sc[1]){ s.tore = z.sc.slice(); aktualisiereTafel(); }
    if (z.fk && s.meinFernNr != null){ const ix = z.fk[s.meinFernNr]; if (ix >= 0 && s.spieler[ix] && s.spieler[ix] !== s.steuer){ s.steuer = s.spieler[ix]; s.lade = -1; try { zeigeHinweis(s.steuer.name, 1); } catch(e){} } }   // V5.5
    if (z.hs >= 0) s.fernSpieler = s.spieler[z.hs];
    if (z.mh) s.andereMenschen = z.mh.map(i => s.spieler[i]).filter(q => q && q !== s.steuer);
    if (z.m && z.m[0] !== gastLetzteM){
      const neu = gastLetzteM !== 0; gastLetzteM = z.m[0];
      if (neu){
        meldung(z.m[1], z.m[2], z.m[3] || null, z.m[4]);
        if (z.m[1] === 'TOR!'){ musik.sfx && musik.sfx.jubel(true); musik.sfx && musik.sfx.pfiff(1); }
        if (z.m[1] === 'FOUL!'){ musik.sfx && musik.sfx.pfiff(2); }
      }
    }
    if (z.el){ s.elfmeter = true; s.elf = { treffer: z.el[0], schuesse: z.el[1].map(a => a.map(x => !!x)), aktiv: !!z.el[2] }; const sig = JSON.stringify(z.el); if (sig !== s.elfSig){ s.elfSig = sig; try { soAnzeige(s.spieler[z.el[3]]); } catch (e) {} } }   // V9.2: Elfmeter-Anzeige beim Gast
    if (z.ph === 'ende' && !s.endeGezeigt){ s.endeGezeigt = true; s.phase = 'spiel'; ende(); }   // V6.2: Phase kurz zurücksetzen, sonst bricht endeKern() sofort ab und der Gast sieht kein Ergebnis
  }
  function starteGast(su){
    const opt = { squad: su.squad, torwart: su.torwart, menschTorwart: !!su.menschTorwart, land: COUNTRY_DATABASE[su.land], stufe: su.stufe, regen: su.regen, wetter: su.wetter, nacht: su.nacht, anstoss: su.anstoss, jz: su.jz, temp: su.temp, nummern: su.nummern, gegnerNummern: su.gegnerNummern,
                  gegnerIdx: su.gegnerIdx, twG: su.twG, gegnerPosi: su.gegnerPosi || null, gegnerSteuer: su.gegnerSteuer || null, gegnerLand: COUNTRY_DATABASE[su.gland], heim: su.heim, modus: su.modus, gast: true, setupId: su.id,
                  meinPlatz: su.plaetze && su.plaetze[NETZ.gid], fernAnzahl: su.fernAnzahl, plaetze: su.plaetze, gegnerPlaetze: su.gegnerPlaetze || {}, posi: su.posi || null, werte: su.werte || null, spezial: su.spezial || null, matchSkills: su.matchSkills || null, halle: !!su.halle, halleBank: su.bank || null };
    gastZiel = null; gastLetzteM = 0; gastKm = null; gastHn = null;
    try { const tb = document.getElementById('turnier'); if (tb) tb.hidden = true; const lb = document.getElementById('liga'); if (lb) lb.hidden = true; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V4.1: Baum beim Gast schließen, wenn das nächste Spiel startet
    starte(opt);
    s.gast = true;
    if (s.steuer) spielTimer(() => { if (s && s.steuer) zeigeHinweis('Du spielst fest: ' + s.steuer.name, 4); }, 600);
  }

  document.getElementById('wdhSkip').addEventListener('click', e => { e.stopPropagation(); if (s && !s.gast && s.phase === 'wiederholung') wdhEnde(); });
  function verlaengerungStart(){
    if (!s || s.gast) { if (s && s.gast) return; }
    // V7.9: 2 × 15 Minuten mit Anstoß, Nachspielzeit und Seitenwechsel
    s.verlaengerung = true; s.vHalb = 0; s.nsFertigV = [false, false]; s.zeit = s.halle ? VERLAENGERUNG : VERLAENGERUNG / 2; s.halbzeitGewesen = true;
    s.besitzTeam = null; s.vAnstoss = Math.random() < .5 ? 0 : 1; s.naechsterAnstoss = s.vAnstoss;
    s.jubelDaten = null; s.wdhPlan = null; s.std = null; s.einlauf = null; s.ns = null;
    meldung('VERLÄNGERUNG', s.halle ? '4 Minuten – entscheidet dieses Spiel!' : '2 × 15 Minuten – entscheidet dieses Spiel!', null, 2.6);
    (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('verl_start', null, true);   // V6.1
    musik.sfx && musik.sfx.pfiff(2);
    anstossPositionen(s.naechsterAnstoss);
    s.phase = 'tor'; s.phaseT = .01;   // geht über den normalen Anstoß weiter
  }
  function verlaengerungHalbzeit(){
    if (!s) return;
    s.vHalb = 1; s.zeit = VERLAENGERUNG / 2; s.getauscht = !s.getauscht;
    s.naechsterAnstoss = 1 - (s.vAnstoss || 0);
    s.jubelDaten = null; s.wdhPlan = null; s.std = null; s.einlauf = null; s.ns = null;
    for (const q of s.spieler){ q.v.set(0, 0, 0); q.grae = 0; if (q.ausdauer != null){ const mx = Math.max(1, q.maxAusdauer || 100); q.ausdauer = Math.min(mx, q.ausdauer + mx * .1); } }
    meldung('VERLÄNGERUNG', '2. Halbzeit · Seitenwechsel', null, 2.2);
    musik.sfx && musik.sfx.pfiff(2);
    anstossPositionen(s.naechsterAnstoss);
    s.phase = 'tor'; s.phaseT = .01;
  }

  // =================================================================
  // V7.9: ELFMETERSCHIESSEN AUF DEM PLATZ
  // Schütze am Elfmeterpunkt, Torwart im Tor, Elfmeter-Anzeige oben. Der Spielstand bleibt unverändert.
  // Online (Gast/Mitspieler) bleibt der bisherige automatische Ablauf (elfmeterschiessenStartAlt).
  // =================================================================
  function elfmeterschiessenStart(){
    if (!s) return;
    if (s.gast) return;   // V9.2: online schießt jeder selbst – der Gastgeber rechnet, der Gast sieht alles auf dem Platz
    clearTimeout(s.elfTimer);
    s.elfmeter = true; s.phase = 'elfmeter'; s.std = null; s.ns = null;
    s.elf = { runde: 0, treffer: [0, 0], schuesse: [[], []], aktiv: true, schuetzen: [elfAutoSchuetzen(0), elfAutoSchuetzen(1)] };
    s.so = { an: true, kick: false, fertig: true, team: 0, t: 0, ruhe: 0, schuetze: null, origTW: (lokal.steuer && lokal.steuer.rolle === 'TW') ? lokal.steuer : null };
    { const b = welt.ball; b.besitzer = null; b.v.set(0, 0, 0); b.p.set(0, BALL_R, 0); b.passZiel = null; b.schussVon = null; }
    for (const q of aktiv()){ q.v.set(0, 0, 0); q.grae = 0; q.gefallen = 0; }
    const lt = s.lokalTeam || 0;
    const los = () => {
      const ov = $s('elfmeterUeber'); if (ov) ov.hidden = true;
      soAnzeige();
      meldung('ELFMETERSCHIESSEN', 'je 5 Schützen – danach Sudden Death', null, 2.4);
      try { (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('elf_start', null, true); } catch (e) {}
      musik.sfx && musik.sfx.pfiff(2);
      s.elfTimer = spielTimer(soNaechsterSchuss, 2600);
    };
    if (!autopilot && !s.fern){
      $s('elfStand').textContent = ''; $s('elfShots').innerHTML = '';
      { const ew = $s('elfWahl'); if (ew) ew.hidden = true; }
      $s('elfmeterUeber').hidden = false;
      return elfSchuetzenWahl(lt, liste => { s.elf.schuetzen[lt] = liste; los(); });
    }
    los();
  }
  function soEntschieden(){
    const e = s.elf, n0 = e.schuesse[0].length, n1 = e.schuesse[1].length, t0 = e.treffer[0], t1 = e.treffer[1];
    if (n0 >= 5 && n1 >= 5) return (n0 === n1 && t0 !== t1) ? (t0 > t1 ? 0 : 1) : -1;   // Sudden Death: nur nach vollen Runden
    const r0 = 5 - n0, r1 = 5 - n1;
    if (t0 > t1 + r1) return 0;
    if (t1 > t0 + r0) return 1;
    return -1;
  }
  function soNaechsterSchuss(){
    if (!s || !s.so || !s.so.an || !s.elf || !s.elf.aktiv) return;
    const e = s.elf, w = soEntschieden();
    if (w >= 0) return soEnde(w);
    soSchussStart(e.schuesse[0].length <= e.schuesse[1].length ? 0 : 1);
  }
  function soSchussStart(team){
    s.getauscht = team === 1;   // V9.3: alle Elfmeter auf dasselbe Tor (rechts) – Seiten werden je Schuss passend gesetzt
    const e = s.elf, dir = richt(team), gx = dir * HL, ort = V(gx - dir * ELF_P, 0, 0);
    s.so.team = team; s.so.kick = false; s.so.fertig = false; s.so.t = 0; s.so.ruhe = 0; s.so.schuetze = null;
    s.elfNaechster = true;
    standard('freistoss', team, ort);
    const sd = s.std; if (!sd) return;
    // gewählter Schütze (Reihenfolge der 5 Schützen, danach wieder von vorn)
    const liste = (e.schuetzen[team] || []).filter(p => p.aktiv), n = e.schuesse[team].length;
    let sh = liste.length ? liste[n % liste.length] : sd.schuetze;
    if (!sh || !sh.aktiv) sh = sd.schuetze;
    sd.schuetze = sh; s.so.schuetze = sh;
    sh.p.set(ort.x - dir * .55, 0, ort.z); sh.v.set(0, 0, 0); sh.blick.set(dir, 0, 0); sh.grae = 0; sh.gefallen = 0;
    // alle anderen Feldspieler warten an der Mittellinie, die Torhüter stehen im Tor
    const zaehler = [0, 0];
    for (const q of aktiv()){
      if (q === sh) continue;
      if (q.rolle === 'TW'){
        if (q.team !== team){ q.p.set(gx - dir * .2, 0, 0); q.v.set(0, 0, 0); q.blick.set(-dir, 0, 0); }
        else { q.p.set((q.team === 0 ? -1 : 1) * 4.5, 0, -8); q.v.set(0, 0, 0); q.blick.set(dir, 0, 0); }   // V9.3: Torwart des Schützenteams wartet an der Mittellinie
        continue;
      }
      const j = zaehler[q.team]++;
      q.p.set((q.team === 0 ? -1 : 1) * 1.8, 0, -8 + j * 1.6); q.v.set(0, 0, 0); q.blick.set(dir, 0, 0); q.grae = 0; q.gefallen = 0; q.mauer = null;
    }
    // Steuerung: dein Team schießt selbst; verteidigt dein Team, bleibt ein ausdrücklich gewählter Torwart in deiner Hand
    const lt = s.lokalTeam || 0;
    if (!autopilot && s.fern){
      // V9.2: online – der Mensch im schießenden Team schießt selbst, der Mensch im anderen Team steht im Tor
      const tw = aktiv().find(q => q.rolle === 'TW' && q.team !== team);
      let hatS = false, hatT = false;
      for (const k of menschen()){
        if (k.team === team && !hatS){ hatS = true; if (k.steuer !== sh) steuerWechsel(k, sh); k.lade = -1; }
        else if (k.team !== team && tw && !hatT){ hatT = true; if (k.steuer !== tw) steuerWechsel(k, tw); k.lade = -1; }
        else if (k.steuer === sh || k.steuer === tw){ const frei = aktiv().find(q => q.team === k.team && q !== sh && q.rolle !== 'TW' && !istMensch(q)); if (frei) steuerWechsel(k, frei); }
      }
      for (const k of menschen()) if (k.steuer === sh) hinweisFuer(k, 'Joystick zielt · SCHUSS halten = Schuss', 3.2);
    }
    else if (!autopilot){
      if (team === lt){ lokal.steuer = sh; lokal.lade = -1; zeigeHinweis('Joystick zielt · SCHUSS halten = Schuss', 3.2); }
      else if (s.so.origTW && s.so.origTW.aktiv){ lokal.steuer = s.so.origTW; lokal.lade = -1; }
    }
    soAnzeige(sh);
    try { const nn = e.schuesse[0].length + e.schuesse[1].length; (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis((nn >= 7 && Math.random() < .5) ? 'elf_spannung' : 'elf_anlauf', null, true); } catch (x) {}
  }
  // läuft in jedem Bild, solange der Ball nach dem Schuss unterwegs ist
  function soSpielSchritt(dt){
    const so = s.so, b = welt.ball; if (!so || so.fertig) return;
    if (!so.kick && so.schuetze && !istMensch(so.schuetze)) soKiZiel();   // V7.9: KI zielt in die Ecken (sonst hält der Torwart fast alles)
    so.kick = true; so.t += dt;
    if (b.besitzer) return soErgebnis('gehalten');
    const v = Math.hypot(b.v.x, b.v.z);
    if (so.t > 1 && v < .8 && b.p.y < .7) so.ruhe += dt; else so.ruhe = 0;
    const imFeld = Math.abs(b.p.x) < HL && Math.abs(b.p.z) < HB;
    if (so.ruhe > .6) return soErgebnis(imFeld && b.letzteTeam !== so.team ? 'gehalten' : 'daneben');
    if (so.t > 6) return soErgebnis(imFeld && b.letzteTeam !== so.team ? 'gehalten' : 'daneben');
  }
  function soKiZiel(){
    const so = s.so, b = welt.ball, dir = richt(so.team), gx = dir * HL, sh = so.schuetze;
    const w = (sh && sh.daten && sh.daten.rating) || 70;
    const vorbei = Math.random() < klemme(.13 - (w - 70) * .004, .04, .2) * (hatFae(sh, 'elfer') ? .25 : 1);
    const seite = Math.random() < .5 ? -1 : 1;
    const zt = seite * (vorbei ? TB + .7 : TB - .55 - Math.random() * .5);
    const yt = (vorbei && Math.random() < .5) ? TH + .6 : .35 + Math.random() * Math.max(.2, TH - .8);
    const dx = gx - b.p.x, dz = zt - b.p.z, dist = Math.max(1, Math.hypot(dx, dz)), v = 19 + Math.random() * 4, T = dist / v;
    b.v.set(dx / dist * v, (yt - b.p.y + G * T * T / 2) / T, dz / dist * v);
  }
  function soErgebnis(art){
    if (!s || !s.so || !s.so.an || s.so.fertig || !s.elf) return;
    const so = s.so, e = s.elf, team = so.team, tor = art === 'tor', sh = so.schuetze;
    so.fertig = true; so.kick = false;
    e.schuesse[team].push(tor); if (tor) e.treffer[team]++;
    s.phase = 'elfPause'; s.std = null; s.phaseT = 0; s.besitzTeam = null;
    welt.ball.besitzer = null;
    if (tor && sh){ sh.jubel = 2.6; }
    soAnzeige();
    const stand = e.treffer[0] + ' – ' + e.treffer[1];
    try { (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(tor ? 'elf_tor' : art === 'gehalten' ? 'elf_gehalten' : 'elf_vorbei', null, true); } catch (x) {}
    meldung(tor ? 'TOOOR!' : (art === 'gehalten' ? 'GEHALTEN!' : 'VORBEI!'), (sh && sh.name ? sh.name + ' · ' : '') + stand, null, 1.8);
    try { if (musik.sfx){ if (tor) musik.sfx.jubel && musik.sfx.jubel(true); else musik.sfx.oh && musik.sfx.oh(); } } catch (x) {}
    s.elfTimer = spielTimer(soNaechsterSchuss, tor ? 2800 : 2300);
  }
  function soEnde(winner){
    if (!s || !s.so) return;
    const e = s.elf; e.aktiv = false; s.so.fertig = true; s.phase = 'elfPause';
    s.elfmeterSieger = winner;
    soAnzeige();
    try { (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(s.fern ? 'elf_ende' : (winner === (s.lokalTeam || 0) ? 'elf_sieg' : 'elf_nied'), null, true); } catch (x) {}
    const ich = s.lokalTeam || 0;
    if (s.fern) meldung((winner === 0 ? s.land[0] : s.gegner[0]).toUpperCase() + ' GEWINNT!', 'Elfmeterschießen ' + e.treffer[0] + ' – ' + e.treffer[1], null, 2.6); else   // V9.2: online neutral (der Gast sieht dieselbe Meldung)
    meldung(winner === ich ? 'SIEG! 🏆' : 'NIEDERLAGE', 'Elfmeterschießen ' + e.treffer[0] + ' – ' + e.treffer[1], null, 2.6);
    s.elfTimer = spielTimer(() => {
      if (!s || !s.elf || s.phase === 'ende') return;
      const eb = $s('elfBar'); if (eb) eb.hidden = true;
      s.so = null;
      ende(winner);
    }, 2900);
  }
  // Elfmeter-Anzeige oben im Bild: Flaggen, Stand und je ein Punkt pro Schuss (grün = Tor, rot = verschossen)
  function soAnzeige(sh){
    const eb = $s('elfBar'); if (!eb || !s || !s.elf) return;
    const e = s.elf, punkte = t => {
      const n = Math.max(5, e.schuesse[t].length);
      let h = '';
      for (let i = 0; i < n; i++){ const r = e.schuesse[t][i]; h += '<i class="' + (r === true ? 'ok' : r === false ? 'no' : '') + '"></i>'; }
      return h;
    };
    $s('ebFlA').innerHTML = flaggeHTML(s.land[0]); $s('ebFlB').innerHTML = flaggeHTML(s.gegner[0]);
    $s('ebA').innerHTML = punkte(0); $s('ebB').innerHTML = punkte(1);
    $s('ebStand').textContent = e.treffer[0] + ' – ' + e.treffer[1];
    const n0 = e.schuesse[0].length, n1 = e.schuesse[1].length;
    $s('ebInfo').textContent = e.aktiv ? ((Math.max(n0, n1) >= 5 && n0 === n1 ? 'Sudden Death · ' : '') + (sh && sh.name ? sh.name + ' schießt' : '')) : 'Entschieden';
    eb.hidden = false;
  }

  function elfmeterschiessenStartAlt(){
    s.elfmeter = true; s.phase = 'elfmeter'; s.elf = {runde:0, treffer:[0,0], schuesse:[[],[]], aktiv:true};
    $s('elfStand').textContent = '0 – 0';
    $s('elfText').textContent = 'Elfmeterschießen – 5 Schüsse pro Team.';
    $s('elfShots').innerHTML = '';
    { const ew = $s('elfWahl'); if (ew) ew.hidden = true; }
    $s('elfmeterUeber').hidden = false;
    clearTimeout(s.elfTimer);
    // V7.8: Schützen – je Team 5 in fester Reihenfolge; offline wählst du deine 5 selbst aus
    const lt = s.lokalTeam || 0, auto = tm => elfAutoSchuetzen(tm);
    s.elf.schuetzen = [auto(0), auto(1)];
    const mensch = !s.fern && !s.gast && !autopilot;
    if (mensch) return elfSchuetzenWahl(lt, liste => { s.elf.schuetzen[lt] = liste; $s('elfText').textContent = 'Elfmeterschießen – 5 Schüsse pro Team.'; s.elfTimer = spielTimer(() => elfSchuss(0), 600); });
    s.elfTimer = spielTimer(() => elfSchuss(0), 700);
  }
  function elfAutoSchuetzen(team){
    const sp = s.spieler.filter(p => p.team === team && p.aktiv);
    const wert = p => (p.daten.rating || 70) + (p.rolle === 'ST' ? 6 : p.rolle === 'MF' ? 3 : p.rolle === 'TW' ? -15 : 0);
    return sp.sort((a, b) => wert(b) - wert(a)).slice(0, 5);
  }
  function elfSchuetze(team){ const l = s.elf && s.elf.schuetzen && s.elf.schuetzen[team]; if (!l || !l.length) return null; return l[(s.elf.runde || 0) % l.length]; }
  function elfSchuetzenWahl(team, fertig){
    const box = document.querySelector('#elfmeterUeber .elfbox'); if (!box) return fertig(elfAutoSchuetzen(team));
    let w = $s('elfSchuetzen'); if (w) w.remove();
    w = document.createElement('div'); w.id = 'elfSchuetzen'; box.appendChild(w);
    const sp = s.spieler.filter(p => p.team === team && p.aktiv);
    const wahl = [];
    $s('elfText').textContent = 'Wähle deine 5 Schützen – in der Reihenfolge, in der sie schießen.';
    const zeichnen = () => {
      w.innerHTML = '<div class="es-liste">' + sp.map((p, i) => { const n = wahl.indexOf(p); return '<button type="button" data-i="' + i + '" class="' + (n >= 0 ? 'an' : '') + '">' + (n >= 0 ? '<i>' + (n + 1) + '</i>' : '') + '<b>' + p.daten.name + '</b><small>' + (p.rolle || '') + ' · ' + (p.daten.rating || 70) + '</small></button>'; }).join('') + '</div>' +
        '<div class="es-knoepfe"><button type="button" class="es-auto">🔄 AUTOMATISCH</button><button type="button" class="es-los"' + (wahl.length === 5 ? '' : ' disabled') + '>▶ LOS (' + wahl.length + '/5)</button></div>';
    };
    zeichnen();
    w.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('button'); if (!b) return;
      if (b.classList.contains('es-auto')){ wahl.length = 0; wahl.push(...elfAutoSchuetzen(team)); zeichnen(); return; }
      if (b.classList.contains('es-los')){ if (wahl.length !== 5) return; w.remove(); fertig(wahl.slice()); return; }
      const p = sp[+b.dataset.i]; const n = wahl.indexOf(p);
      if (n >= 0) wahl.splice(n, 1); else if (wahl.length < 5) wahl.push(p);
      zeichnen();
    });
  }

  // V2.3: Nummernfenster im Bild; V2.2: Menü mit Freundschaftsspiel/Pokal/Liga; V2.1: Elfmeterschießen – dein Team schießt selbst (du wählst die Torecke), das Gegnerteam schießt per KI.
  // Online (Gast/Mitspieler) bleibt es beim bisherigen automatischen Ablauf.
  function elfWahl(team, cb){
    const sch = elfSchuetze(team), bonus = sch ? klemme(((sch.daten.rating || 70) - 72) * .006, -.08, .1) : 0;   // V7.8: bessere Schützen treffen öfter
    const basis = (team === (s.lokalTeam || 0) ? .76 : .71) + bonus;
    if (sch) $s('elfText').textContent = sch.daten.name + ' läuft an …';
    s.elf.vorbei = false;
    const mensch = team === (s.lokalTeam || 0) && !s.fern && !s.gast && !autopilot;
    if (!mensch) return cb(Math.random() < basis);
    const box = document.querySelector('#elfmeterUeber .elfbox'); if (!box) return cb(Math.random() < basis);
    let w = $s('elfWahl');
    if (!w){
      w = document.createElement('div'); w.id = 'elfWahl';
      w.innerHTML = '<div class="et"></div><div class="etor"></div>';
      box.appendChild(w);
      const g = w.querySelector('.etor');
      ['↖', '↑', '↗', '↙', '↓', '↘'].forEach((pf, i) => { const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = pf; bt.dataset.i = i; g.appendChild(bt); });
    }
    w.querySelector('.et').textContent = '⚽ ' + (sch ? sch.daten.name : 'DU') + ' SCHIESST! Wohin?';
    w.hidden = false;
    const gesamt = s.elf;
    const klick = e => {
      const bt = e.target.closest && e.target.closest('button'); if (!bt) return;
      w.removeEventListener('click', klick); w.hidden = true;
      if (!s || s.elf !== gesamt || !s.elf.aktiv) return;
      const i = +bt.dataset.i, col = i % 3, row = (i / 3) | 0;            // row 0 = oben
      const daneben = Math.random() < Math.max(.01, ((col !== 1 && row === 0) ? .14 : .05) - bonus * .5);   // obere Ecken sind riskanter
      const q = Math.random(), tCol = q < .4 ? 0 : q < .6 ? 1 : 2, tRow = Math.random() < .5 ? 0 : 1;   // Torwart springt
      const gehalten = tCol === col && Math.random() < (tRow === row ? .85 : .4);
      s.elf.vorbei = daneben;
      cb(!daneben && !gehalten);
    };
    w.addEventListener('click', klick);
  }
  function elfSchuss(team){
    if (!s || !s.elf || !s.elf.aktiv) return;
    elfWahl(team, tor => elfSchussFertig(team, tor));
  }
  function elfSchussFertig(team, tor){
    if (!s || !s.elf || !s.elf.aktiv) return;
    const r = s.elf.runde, max = 5;
    const remainingA = max - r, remainingB = max - r;
    s.elf.schuesse[team].push(tor);
    if (tor) s.elf.treffer[team]++;
    const wrap = $s('elfShots');
    for (let i=wrap.children.length;i<r*2+team+1;i++){
      const d=document.createElement('span'); d.className='elfshot'; d.textContent='•'; wrap.appendChild(d);
    }
    const idx = r*2+team, el = wrap.children[idx];
    if (el){ el.classList.add(tor?'ok':'no'); el.textContent=tor?'✓':'×'; }
    $s('elfStand').textContent = s.elf.treffer[0] + ' – ' + s.elf.treffer[1];
    $s('elfText').textContent = tor ? 'TOOOR! Elfmeter verwandelt.' : (s.elf.vorbei ? 'Vorbei! Daneben geschossen.' : 'Gehalten! Der Torwart bleibt Sieger.');
    const doneEarly = r < 4 && (s.elf.treffer[0] > s.elf.treffer[1] + (4-r) || s.elf.treffer[1] > s.elf.treffer[0] + (4-r));
    if (doneEarly){ return spielTimer(elfmeterEnde, 850); }
    if (team === 0) return spielTimer(() => elfSchuss(1), 650);
    if (r < 4) { s.elf.runde++; return spielTimer(() => elfSchuss(0), 650); }
    if (s.elf.treffer[0] !== s.elf.treffer[1]) return spielTimer(elfmeterEnde, 900);
    // Sudden Death: jeweils ein Schuss, bis einer vorne liegt.
    s.elf.runde = 5; return spielTimer(() => elfSchussSudden(0), 700);
  }

  function elfSchussSudden(team){
    if (!s || !s.elf || !s.elf.aktiv) return;
    elfWahl(team, tor => elfSuddenFertig(team, tor));
  }
  function elfSuddenFertig(team, tor){
    if (!s || !s.elf || !s.elf.aktiv) return;
    s.elf.schuesse[team].push(tor); if (tor) s.elf.treffer[team]++;
    const wrap=$s('elfShots'), d=document.createElement('span'); d.className='elfshot '+(tor?'ok':'no'); d.textContent=tor?'✓':'×'; wrap.appendChild(d);
    $s('elfStand').textContent=s.elf.treffer[0]+' – '+s.elf.treffer[1];
    $s('elfText').textContent=tor?'Sudden Death: verwandelt!':'Sudden Death: verschossen!';
    if (team===1 && s.elf.treffer[0]!==s.elf.treffer[1]) return spielTimer(elfmeterEnde,900);
    if (team===1){ return spielTimer(()=>elfSchussSudden(0),650); }
    return spielTimer(()=>elfSchussSudden(1),650);
  }

  function elfmeterEnde(){
    if (!s || !s.elf) return;
    s.elf.aktiv=false;
    const a=s.elf.treffer[0], b=s.elf.treffer[1];
    // Bei Gleichstand (z.B. theoretisch) weiter Sudden Death.
    if (a===b){ s.elf.aktiv=true; return elfSchussSudden(0); }
    const winner = a>b ? 0 : 1;
    // Elfmetertore werden als Endstand nur für die Entscheidung angezeigt; reguläre Tore bleiben erhalten.
    s.elfmeterSieger=winner;
    $s('elfText').textContent=(winner === (s.lokalTeam||0) ? 'Sieg nach Elfmeterschießen! 🏆' : 'Niederlage nach Elfmeterschießen.');
    spielTimer(()=>{ if (s && s.phase === 'elfmeter'){ $s('elfmeterUeber').hidden=true; ende(winner); } }, 1100);
  }

  // Kleines ⏩-Symbol: nur Offline-Einzelspieler, mit zufälligem Endergebnis.
  // Multiplayer-Ergebnisse dürfen ausschließlich aus dem echten gemeinsamen Spiel stammen.
  async function spielZuEndeSimulieren(){
    if (!s || s.phase === 'ende' || !['spiel','halbzeit','start','pfiff','tor','wiederholung','trage'].includes(s.phase)) return;
    const onlineAktiv = !!s.gast || !!s.fern || (NETZ && (NETZ.rolle === 'host' || NETZ.rolle === 'gast'));
    const lokalerMehrspieler = !!(s.optionen && s.optionen.modus === 'zusammen');
    if (onlineAktiv || lokalerMehrspieler || (s.optionen && s.optionen.turnier && NETZ && (NETZ.rolle === 'host' || NETZ.rolle === 'gast'))) return;
    if (!(await window.jaNeinDialog('SPIEL VORSPULEN?', 'Die bisherigen Tore bleiben, für die Restzeit wird zufällig weitergespielt – das Ergebnis kann sich noch drehen.', 'VORSPULEN', 'WEITERSPIELEN'))) return;   // V10.0
    clearTimeout(s.hzUhr);
    if (s.phase === 'halbzeit') $s('hzUeber').hidden = true;
    // V6.2: Bereits gefallene Tore bleiben stehen. Für die restliche Spielzeit werden zufällige Tore
    // für beide Teams dazugewürfelt (früh vorgespult = mehr möglich, kurz vor Schluss = meist wenig).
    // Das Spiel kann sich dabei noch drehen – auch eine Niederlage ist möglich.
    const restAnteil = s.phase === 'halbzeit' ? HALBZEIT / SPIELZEIT : Math.max(0, Math.min(1, (s.zeit || 0) / SPIELZEIT));
    const restTore = () => {   // Poisson-Verteilung, im ganzen Spiel im Schnitt ca. 1,6 Tore pro Team
      const grenze = Math.exp(-1.6 * restAnteil); let k = 0, p = Math.random();
      while (p > grenze && k < 6){ k++; p *= Math.random(); }
      return k;
    };
    s.tore[0] += restTore();
    s.tore[1] += restTore();
    // Offline-Simulation endet direkt; die vorhandene Ergebnis-/Turnierlogik bleibt zuständig.
    s.zeit = 0;
    if (s.phase !== 'spiel') s.phase = 'spiel';
    ende();
  }

  // =====================================================================
  // V3.0: Auswechslungen (9 + 2). Je Team höchstens 2 Wechsel, nur bei Unterbrechung
  // (Ballaus, Foul, Tor, Halbzeit). Der Eingewechselte hat volle Ausdauer.
  // Dein Team: nur du entscheidest (Pause ⏸ → 🔄 WECHSEL). Das Gegnerteam wechselt per KI.
  // =====================================================================
  const WECHSEL_MAX = 2;
  const wechselAn = () => !!(s && s.bank && !s.gast);   // V7.9: auch online (Gastgeber rechnet, Gäste bekommen die Wechsel mit)
  const wechselMax = () => s && s.halle ? 99 : WECHSEL_MAX;   // HALL OF FAME: beliebig oft wechseln
  const wechselRest = t => wechselMax() - s.wechselN[t] - s.wechselPlan[t].length;
  let wTafelT = 0, wechselHZ = false;   // V7.6: wechselHZ = Wechsel in der Halbzeitpause (ohne Laufweg)
  function wechselTafel(raus, rein, dauer = 5){
    try {
      const el = $s('wTafel'); if (!el) return;
      $s('wtRausNr').textContent = raus.nummer || '';  $s('wtRausName').textContent = raus.name || '';
      $s('wtReinNr').textContent = rein.nummer || '';  $s('wtReinName').textContent = rein.name || '';
      el.classList.add('zeigen');
      clearTimeout(wTafelT); wTafelT = setTimeout(() => el.classList.remove('zeigen'), dauer * 1000);
    } catch (e) {}
  }
  // V7.9: Schiri unterbricht das Spiel: Ausgewechselter geht, Schiri zeigt die Tafel, dann pfeift er und der Einwechselspieler darf aufs Feld
  function wechselStoppSchritt(dt){
    const w = s.wStopp; if (!w) return;
    const sch = welt.schiri; w.t += dt;
    if (!w.frei){
      if (sch && sch.tafelAn) w.an += dt;
      if (sch){ sch.tafelT = Math.max(sch.tafelT || 0, 3); sch.tafelW = Math.max(sch.tafelW || 0, 6); }   // Tafel bleibt oben, bis der Schiri pfeift
      const unterwegs = (s.abgang || []).some(o => w.liste.some(e => e.raus === o));
      if ((w.an > .35 && w.t > .9) || w.t > 3.2 || (w.an > 0 && !unterwegs)){   // V9.3: Wechsel deutlich schneller
        w.frei = true; w.fT = 0;
        try { musik.sfx && musik.sfx.pfiff(1); } catch (e) {}
        w.liste.forEach(e => { e.q.wartet = false; });
      }
    } else {
      w.fT += dt;
      if (w.fT > 1.4 || w.liste.every(e => !e.q.aktiv || e.q.p.z > -HB + 1.5)) s.wStopp = null;
    }
  }
  // V7.9: Online-Gast: Wechsel des Gastgebers nachbauen
  function gastWechsel(e){
    const i = e[0], di = e[1], nr = e[2], team = e[3], hz = e[4];
    const raus = s.spieler[i], daten = PLAYER_DATABASE[di]; if (!raus || !daten) return;
    if (s.halle && s.bank){ const bi = s.bank[team].indexOf(di); if (bi >= 0) s.bank[team].splice(bi, 1); if (s.bankFig) s.bankFig[team] = s.bankFig[team].filter(o => o.idx !== di); if (hz) halleZurBank(team, raus.daten); }
    const nv = s.nummernVorgabe || (s.nummernVorgabe = [{}, {}]); nv[team] = Object.assign({}, nv[team] || {}); nv[team][di] = nr;
    const q = neuerSpieler(daten, team, raus.rolle, raus.slot);
    s.spieler.splice(s.spieler.indexOf(q), 1); s.spieler[i] = q;
    q.seite = raus.seite; q.fu = raus.fu; q.fv = raus.fv;
    q.p.set((team === 0 ? -1 : 1) * 5, 0, -HB + .3); q.blick.set(0, 0, 1);
    raus.aktiv = false;
    if (!hz){ raus.v.set(0, 0, 0); (s.abgang || (s.abgang = [])).push(raus); }
    if (welt.ball.besitzer === raus) welt.ball.besitzer = null;
    if (s.steuer === raus) s.steuer = q;
    if (s.fernSpieler === raus) s.fernSpieler = q;
    try { wechselTafel(raus, q); } catch (x) {}
  }
  function wechselAusfuehren(team, raus, reinIdx){
    if (!raus || !raus.aktiv || s.wechselN[team] >= wechselMax()) return null;
    const bi = s.bank[team].indexOf(reinIdx); if (bi < 0) return null;
    const daten = PLAYER_DATABASE[reinIdx];
    const q = neuerSpieler(daten, team, raus.rolle, raus.slot);
    s.spieler.splice(s.spieler.indexOf(q), 1);
    const idx = s.spieler.indexOf(raus); if (idx < 0) return null;
    s.spieler[idx] = q;
    q.seite = raus.seite; q.fu = raus.fu; q.fv = raus.fv;
    // kommt an der Seitenlinie vor der Bank aufs Feld
    const bx = (team === 0 ? -1 : 1) * 5;
    q.p.set(bx, 0, -HB + .3); q.blick.set(0, 0, 1);
    raus.aktiv = false;
    const b = welt.ball;
    if (b.besitzer === raus) b.besitzer = null;
    if (b.passVon === raus) b.passVon = null;
    if (s.std && s.std.schuetze === raus){
      if (wechselHZ){ s.std.schuetze = q; q.p.copy(raus.p); q.blick.copy(raus.blick); }
      else if (s.phase === 'standard'){ const alt = teamSp(team).filter(p => p !== q && p !== raus && p.rolle !== 'TW').sort((a, c) => d2(a.p, raus.p) - d2(c.p, raus.p))[0]; if (alt) s.std.schuetze = alt; }   // V7.9: Einwechselspieler wartet an der Linie
    }
    for (const k of menschen()){
      if (k.steuer === raus){ k.steuer = q; k.lade = -1; }
      if (k.heim === raus) k.heim = q;
      if (k.stdTorwart === raus) k.stdTorwart = q;
    }
    if (s.du === raus) s.du = q;
    if (s.steuer === raus) s.steuer = q;
    s.bank[team].splice(bi, 1);
    s.raus[team].push(raus.daten.bild);
    const echtzeit = !wechselHZ;
    (s.wcLog || (s.wcLog = [])).push([idx, PLAYER_DATABASE.indexOf(daten), q.nummer, team, echtzeit ? 0 : 1]);   // V7.9: für die Online-Gäste
    if (echtzeit){ q.wartet = true; q.v.set(0, 0, 0); (s.wStopp || (s.wStopp = { liste: [], t: 0, an: 0, frei: false, fT: 0 })).liste.push({ raus, q }); }   // V7.9: Einwechselspieler wartet an der Linie, Spiel ruht   // V7.6: Rausgehender läuft sichtbar zur Bank, Eingewechselter läuft von der Bank aufs Feld
    if (!echtzeit && s.halle) halleZurBank(team, raus.daten);
    else if (!echtzeit){ try { if (s.rausFig) s.rausFig[team].push(randFigur(raus.daten.bild, team, s.kits[team], '')); } catch (e) {} }
    s.wechselN[team]++, nachspielPlus(.4);
    if (s.halle) try { (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis('wechsel', null, true); } catch (e) {}
    const land = team === 0 ? s.land[0] : s.gegner[0];
    if (!s.schnellModus) meldung('WECHSEL', '▼ ' + raus.name + '   ▲ ' + q.name, null, 2.4);
    wechselTafel(raus, q);
    if (echtzeit){   // V7.6: für beide Teams: Schiri zeigt die Tafel an der Bank, Rausgehender läuft dorthin
      raus.v.set(0, 0, 0); (s.abgang || (s.abgang = [])).push(raus);
      const sch = welt.schiri; if (sch){ sch.tafel = { raus: raus.nummer, rein: q.nummer }; sch.tafelT = 4; sch.tafelW = 12; sch.tafelAn = false; sch.bankX = bx; }
    }
    try { trainerSag(team, 'wechsel', raus.name, q.name, true); } catch (e) {}
    try { musik.sfx && musik.sfx.pfiff(1); } catch (e) {}
    return q;
  }
  function wechselAusfuehrenAlle(halbzeitPause, live){
    wechselHZ = !!halbzeitPause && !live;
    try { wechselAusfuehrenAlle2(halbzeitPause); } finally { wechselHZ = false; }
  }
  function wechselAusfuehrenAlle2(halbzeitPause){
    if (!wechselAn()) return;
    // V3.0: schwer Verletzte müssen raus
    if (s.mussRaus && s.mussRaus.length){
      const liste = s.mussRaus.splice(0);
      for (const p of liste){
        if (!p.aktiv || s.wechselPlan[p.team].some(w => w.raus === p)) continue;
        const kannWechseln = wechselRest(p.team) > 0 && s.bank[p.team].length;
        if (p.team === 1 || !kannWechseln){
          if (kannWechseln){
            const passt = i => PLAYER_DATABASE[i].role === p.rolle ? 2 : PLAYER_DATABASE[i].role !== 'TW' ? 1 : 0;
            const rein = s.bank[1].slice().sort((a, c) => passt(c) - passt(a) || PLAYER_DATABASE[c].rating - PLAYER_DATABASE[a].rating)[0];
            s.wechselPlan[1].push({ raus: p, rein });
          } else if (p.rolle !== 'TW'){
            // kein Wechsel mehr frei: der Verletzte geht vom Platz, das Team spielt in Unterzahl
            p.aktiv = false; p.gruppe.visible = false;
            for (const k of menschen()) if (k.steuer === p){ const n = teamSp(p.team).sort((a, c) => d2(a.p, p.p) - d2(c.p, p.p)).find(q => q.rolle !== 'TW'); if (n){ k.steuer = n; k.lade = -1; } if (k.heim === p) k.heim = n; }
            if (s.du === p) s.du = s.steuer;
            meldung('✚ VERLETZT', p.name + ' kann nicht weiter – Unterzahl', null, 2.6);
          }
        } else {
          // dein Team: du entscheidest – das Wechselfenster geht mit dem Verletzten auf
          s.zwangWechsel = p;
        }
      }
    }
    for (const t of [0, 1]){
      const plan = s.wechselPlan[t]; s.wechselPlan[t] = [];
      for (const w of plan) wechselAusfuehren(t, w.raus, w.rein);
    }
    if (!halbzeitPause) kiWechselPruefen();
    if (s.zwangWechsel){ const p = s.zwangWechsel; s.zwangWechsel = null; if (p.aktiv) spielTimer(() => { if (s && p.aktiv && s.phase === 'standard') wechselFenster(false, p); }, 900); }
  }
  // Wählt für die KI: wer raus, wer rein
  function kiWechselWahl(team, grund){
    if (!s.bank[team].length || wechselRest(team) <= 0) return null;
    const feld = teamSp(team).filter(p => !s.wechselPlan[team].some(w => w.raus === p));
    const mensch = p => menschen().some(k => k.steuer === p) || p === s.du;
    let raus = null;
    if (grund === 'muede'){
      raus = feld.filter(p => p.rolle !== 'TW' && !mensch(p) && p.ausdauer / Math.max(1, p.maxAusdauer) < .38).sort((a, c) => a.ausdauer / a.maxAusdauer - c.ausdauer / c.maxAusdauer)[0];
    } else if (grund === 'gelb'){
      raus = feld.find(p => p.rolle !== 'TW' && !mensch(p) && p.gelb >= 1);
    } else if (grund === 'offensiv'){
      raus = feld.filter(p => p.rolle === 'DF' && !mensch(p)).sort((a, c) => a.rating - c.rating)[0];
    } else if (grund === 'frisch'){
      raus = feld.filter(p => p.rolle !== 'TW' && !mensch(p)).sort((a, c) => a.ausdauer / a.maxAusdauer - c.ausdauer / c.maxAusdauer || a.rating - c.rating)[0];
    }
    if (!raus) return null;
    const bank = s.bank[team].filter(i => !s.wechselPlan[team].some(w => w.rein === i));
    if (!bank.length) return null;
    const passt = i => { const r = PLAYER_DATABASE[i].role; return grund === 'offensiv' ? (r === 'ST' ? 2 : r === 'MF' ? 1 : 0) : (r === raus.rolle ? 2 : r !== 'TW' ? 1 : 0); };
    const rein = bank.slice().sort((a, c) => passt(c) - passt(a) || PLAYER_DATABASE[c].rating - PLAYER_DATABASE[a].rating)[0];
    return { raus, rein };
  }
  // KI-Trainer (Gegnerteam), bei jeder Unterbrechung
  function kiWechselPruefen(){
    if (!wechselAn() || s.phase === 'halbzeit') return;
    const t = 1, rest = s.zeit, zweite = !!s.halbzeitGewesen;
    if (wechselRest(t) <= 0 || !s.bank[t].length || s.kiWechselT > 0) return;
    let w = kiWechselWahl(t, 'muede');
    if (!w && zweite && Math.random() < .5) w = kiWechselWahl(t, 'gelb');
    if (!w && zweite && rest < 55 && s.tore[1] < s.tore[0]) w = kiWechselWahl(t, 'offensiv');
    if (!w && zweite && rest < 40 && Math.random() < .5) w = kiWechselWahl(t, 'frisch');
    if (w){ wechselAusfuehren(t, w.raus, w.rein); s.kiWechselT = 12; }
  }
  // Halbzeit: die KI wechselt manchmal schon in der Pause
  function kiWechselHalbzeit(){
    if (!wechselAn()) return;
    const w = kiWechselWahl(1, 'muede') || (Math.random() < .35 ? kiWechselWahl(1, 'frisch') : null);
    if (w){ s.wechselPlan[1].push(w); }
  }
  // Tipp für dein Team, wenn ein Spieler platt ist (du entscheidest selbst)
  // V7.3: Schnellwechsel – solange jemand müde ist (unter 30 % Ausdauer), erscheint alle 20 Sekunden für 6 Sekunden
  // ein Knopf unter dem Einstellungsbutton. Ein Tipp plant den passenden Wechsel ein (Ausführung wie gewohnt bei der nächsten Unterbrechung).
  let schnellT = 0, schnellVor = null;
  function schnellKnopf(){
    let k = document.getElementById('schnellWechsel');
    if (!k){
      k = document.createElement('button'); k.type = 'button'; k.id = 'schnellWechsel'; k.hidden = true;
      k.style.cssText = 'position:absolute;right:8px;top:calc(52px + env(safe-area-inset-top,0px));z-index:7;background:rgba(10,18,51,.92);color:#fff;border:2px solid #ffe234;border-radius:10px;padding:5px 8px;font:700 11px sans-serif;text-align:center;cursor:pointer;pointer-events:auto';
      k.onclick = () => {
        const v = schnellVor; k.hidden = true; schnellVor = null; clearTimeout(schnellT);
        if (!v || !s || wechselRest(0) <= 0 || !v.raus.aktiv || !s.bank[0].includes(v.rein)) return;
        s.wechselPlan[0].push({ raus: v.raus, rein: v.rein });   // V7.9: Wechsel erst bei der nächsten Unterbrechung, dann hält der Schiri das Spiel an
        try { zeigeHinweis('Wechsel bei der nächsten Unterbrechung', 2); } catch (x) {}
        try { musik.auswahl && musik.auswahl(true); } catch (x) {}
      };
      ($s('spiel') || document.body).appendChild(k);
    }
    return k;
  }
  function wechselTippPruefen(dt){
    if (!wechselAn() || s.phase !== 'spiel' || wechselRest(0) <= 0 || !s.bank[0].length) return;
    s.schnellUhr = (s.schnellUhr || 0) + dt; if (s.schnellUhr < 20) return; s.schnellUhr = 0;
    const geplant = s.wechselPlan[0];
    const m = teamSp(0).filter(p => p.aktiv && p.rolle !== 'TW' && !geplant.some(x => x.raus === p) && p.ausdauer / Math.max(1, p.maxAusdauer) < .3)
      .sort((a, c) => a.ausdauer / Math.max(1, a.maxAusdauer) - c.ausdauer / Math.max(1, c.maxAusdauer));
    const bank = s.bank[0].filter(i => !geplant.some(x => x.rein === i));
    if (!m.length || !bank.length) return;
    const raus = m[0];
    const passt = i => PLAYER_DATABASE[i].role === raus.rolle ? 2 : (PLAYER_DATABASE[i].role !== 'TW') !== (raus.rolle === 'TW') ? 1 : 0;
    const rein = bank.slice().sort((a, c) => passt(c) - passt(a) || PLAYER_DATABASE[c].rating - PLAYER_DATABASE[a].rating)[0];
    schnellVor = { raus, rein };
    const k = schnellKnopf();
    k.innerHTML = '<div style="opacity:.9">🔋 <b>' + raus.name + '</b> müde ▶ <b>' + PLAYER_DATABASE[rein].name + '</b></div><div style="margin-top:3px;background:#ffe234;color:#0b1430;border-radius:6px;padding:3px 8px;font-weight:900">🔄 WECHSELN</div>';
    k.hidden = false; clearTimeout(schnellT);
    schnellT = setTimeout(() => { k.hidden = true; schnellVor = null; }, 6000);
  }

  // ---------- Wechsel-Fenster (für dein Team) ----------
  function wechselFenster(beiHalbzeit, vorwahl, mitPause){
    if (!wechselAn()) return;
    const zwang = (!!vorwahl || !!mitPause) && !pausiert; if (zwang) pausiert = true;
    let w = document.getElementById('wechselUeber');
    if (!w){
      w = document.createElement('div'); w.id = 'wechselUeber'; w.className = 'ueber'; w.hidden = true;
      w.innerHTML = '<div class="box wbox"><h2>🔄 WECHSEL</h2><p class="winfo"></p><div class="wspalten"><div><h3>▼ RAUS</h3><div class="wraus"></div></div><div><h3>▲ REIN</h3><div class="wrein"></div></div></div>'
        + '<div class="reihe-k"><button type="button" class="wok">WECHSELN</button><button type="button" class="zweit wzu">ZURÜCK</button></div></div>';
      ($s('spiel') || document.body).appendChild(w);
    }
    const wahl = { raus: vorwahl || null, rein: null };
    // V5.3: halbautomatisch – der passende Wechsel ist schon ausgewählt, ein Tipp auf WECHSELN genügt
    const vorschlag = () => {
      if (wechselRest(0) <= 0) return null;
      const geplant = s.wechselPlan[0], feld = teamSp(0).filter(p => !geplant.some(x => x.raus === p));
      const raus = (vorwahl && vorwahl.aktiv && feld.includes(vorwahl)) ? vorwahl
        : feld.filter(p => p.rolle !== 'TW').sort((a, c) => (c.verletzt ? 1 : 0) - (a.verletzt ? 1 : 0) || a.ausdauer / Math.max(1, a.maxAusdauer) - c.ausdauer / Math.max(1, c.maxAusdauer))[0];
      const bank = s.bank[0].filter(i => !geplant.some(x => x.rein === i));
      if (!raus || !bank.length) return null;
      const passt = i => { const ro = PLAYER_DATABASE[i].role; return ro === raus.rolle ? 2 : (ro !== 'TW') !== (raus.rolle === 'TW') ? 1 : 0; };
      return { raus, rein: bank.slice().sort((a, c) => passt(c) - passt(a) || PLAYER_DATABASE[c].rating - PLAYER_DATABASE[a].rating)[0] };
    };
    let vs = vorschlag(); if (vs){ wahl.raus = vs.raus; wahl.rein = vs.rein; }
    const balken = p => { const q = Math.max(0, Math.min(1, p.ausdauer / Math.max(1, p.maxAusdauer))); return '<i class="wbar"><i style="width:' + Math.round(q * 100) + '%;background:' + (q < .3 ? '#ff3b3b' : q < .62 ? '#ff9a1f' : '#3fdc5a') + '"></i></i>'; };
    const zeichne = () => {
      const rest = wechselRest(0);
      const vText = vs && wahl.raus === vs.raus && wahl.rein === vs.rein ? '★ Vorschlag: ' + vs.raus.name + ' ▶ ' + PLAYER_DATABASE[vs.rein].name + ' – einfach WECHSELN tippen. ' : '';
      w.querySelector('.winfo').textContent = vText + (vorwahl && vorwahl.aktiv && wahl.raus === vorwahl ? '✚ ' + vorwahl.name + ' ist verletzt. ' : '') + (rest > 0 ? (s.halle ? 'Halle: beliebig oft wechseln · ' : 'Noch ' + rest + ' von ' + WECHSEL_MAX + ' Wechseln · ') + (beiHalbzeit ? 'gilt ab der 2. Halbzeit' : s.phase === 'standard' ? 'erfolgt sofort' : 'erfolgt bei der nächsten Unterbrechung') : 'Keine Wechsel mehr möglich.');
      const geplant = s.wechselPlan[0];
      w.querySelector('.wraus').innerHTML = teamSp(0).map((p, i) => {
        const pl = geplant.some(x => x.raus === p);
        return '<button type="button" data-r="' + s.spieler.indexOf(p) + '" class="' + (wahl.raus === p ? 'an' : '') + (pl ? ' geplant' : '') + '"' + (pl ? ' disabled' : '') + '><b>' + p.name + '</b><small>' + p.rolle + ' · ' + p.rating + (p.gelb ? ' · 🟨' : '') + (p.verletzt ? ' · ✚' : '') + (p === s.du ? ' · DU' : '') + '</small>' + balken(p) + '</button>';
      }).join('');
      w.querySelector('.wrein').innerHTML = s.bank[0].length ? s.bank[0].map(i => {
        const d = PLAYER_DATABASE[i], pl = geplant.some(x => x.rein === i);
        return '<button type="button" data-e="' + i + '" class="' + (wahl.rein === i ? 'an' : '') + (pl ? ' geplant' : '') + '"' + (pl ? ' disabled' : '') + '><b>' + d.name + '</b><small>' + d.role + ' · ' + d.rating + (pl ? ' · kommt' : '') + '</small></button>';
      }).join('') : '<p class="wleer">Bank ist leer.</p>';
      w.querySelector('.wok').disabled = !(wahl.raus && wahl.rein != null && rest > 0);
    };
    w.onclick = e => {
      const bt = e.target.closest && e.target.closest('button'); if (!bt || bt.disabled) return;
      if (bt.dataset.r != null){ wahl.raus = s.spieler[+bt.dataset.r]; zeichne(); }
      else if (bt.dataset.e != null){ wahl.rein = +bt.dataset.e; zeichne(); }
      else if (bt.classList.contains('wok')){
        s.wechselPlan[0].push({ raus: wahl.raus, rein: wahl.rein });
        if (s.phase === 'standard' && s.std) wechselAusfuehrenAlle(true, true);   // steht der Ball gerade, sofort (V7.9: mit Schiri-Stopp)
        else zeigeHinweis('🔄 Wechsel erfolgt bei der nächsten Unterbrechung', 2.4);
        wahl.raus = null; wahl.rein = null; vs = vorschlag(); if (vs){ wahl.raus = vs.raus; wahl.rein = vs.rein; } zeichne();
        try { musik.auswahl && musik.auswahl(true); } catch (x) {}
        if (zwang){ w.hidden = true; pausiert = false; }
      }
      else if (bt.classList.contains('wzu')){
        w.hidden = true;
        if (zwang) pausiert = false;
        if (beiHalbzeit && s && s.phase === 'halbzeit'){ clearTimeout(s.hzUhr); s.hzUhr = spielTimer(() => { if (s && s.phase === 'halbzeit' && !s.gast) zweiteHalbzeit(); }, 9000); }
      }
    };
    if (beiHalbzeit) clearTimeout(s.hzUhr);
    zeichne(); w.hidden = false;
  }
  function wechselKnoepfe(){
    const an = wechselAn();
    for (const [box, id, fid] of [['pauseUeber', 'pauseWechsel', 'pauseForm'], ['hzUeber', 'hzWechsel', 'hzForm']]){
      const ue = $s(box); if (!ue) continue;
      let k = document.getElementById(id);
      if (!k){
        const reihe = ue.querySelector('.reihe-k'); if (!reihe) continue;
        k = document.createElement('button'); k.type = 'button'; k.id = id; k.className = 'zweit wechselKnopf';
        k.addEventListener('click', ev => { ev.stopPropagation(); wechselFenster(id === 'hzWechsel'); });
        reihe.insertBefore(k, reihe.firstChild);
      }
      let f = document.getElementById(fid);
      if (!f){ f = document.createElement('button'); f.type = 'button'; f.id = fid; f.className = 'zweit wechselKnopf'; f.textContent = '📋 AUFSTELLUNG';
        f.addEventListener('click', ev => { ev.stopPropagation(); formLiveFenster(id === 'hzWechsel'); }); k.parentNode.insertBefore(f, k); }
      const imEditor = formLiveMoeglich();   // V9.9: Wechseln geht jetzt im Aufstellungs-Fenster – der extra AUSWECHSELN-Knopf erscheint nur, wenn dieses Fenster nicht möglich ist (z. B. Halle, Unterzahl)
      f.hidden = !an || !imEditor;
      k.hidden = !an || imEditor;
      if (an) k.textContent = (s.halle ? '🔄 AUSWECHSELN' : '🔄 AUSWECHSELN (' + Math.max(0, wechselRest(0)) + '/' + WECHSEL_MAX + ')');
    }
  }

  // ---------- Formation mitten im Spiel ändern (Pause-Fenster → AUFSTELLUNG) ----------
  function formFeldSpieler(){ return s ? teamSp(0).filter(p => p.aktiv && p.rolle !== 'TW') : []; }
  function formLiveMoeglich(){
    try { const on = !!(s && (s.gast || (s.optionen && (s.optionen.gast || s.optionen.fern || s.optionen.modus)))); return !!(s && s.bank && !s.halle && !on && formFeldSpieler().length === 10); } catch (e) { return false; }
  }
  function formLiveAnwenden(key, pref){
    const feld = formFeldSpieler(); if (feld.length !== 10 || !FORMEN[key]) return false;
    const idx = feld.map(p => PLAYER_DATABASE.indexOf(p.daten));
    const zu = formZuweisen(idx, key, pref || null), FORM = formSlots(key);
    feld.forEach((p, k) => { const f = FORM[zu.get(idx[k])]; if (!f) return; p.rolle = f.rolle; p.slot = f.slot; p.seite = f.seite; p.fu = f.fu; p.fv = f.fv; });
    s.formLive = key; return true;
  }
  // Das gleiche Aufstellungs-Fenster wie im Hauptmenü – Formation gilt sofort, Wechsel (Bankspieler auf einen Platz ziehen) werden wie beim alten WECHSEL-Fenster eingeplant
  function formLiveFenster(beiHalbzeit){
    if (!formLiveMoeglich()) return;
    const feld = formFeldSpieler(), idx = feld.map(p => PLAYER_DATABASE.indexOf(p.daten));
    const tw = teamSp(0).find(p => p.rolle === 'TW'), twIdx = tw ? PLAYER_DATABASE.indexOf(tw.daten) : -1;
    if (twIdx < 0 || idx.some(i => i < 0)) return;
    const snap = { squad: zustand.squad, torwart: zustand.torwart, ersatz: zustand.ersatz, formation: zustand.formation, formSlot: zustand.formSlot };
    const k0 = s.formLive || (s.optionen && s.optionen.formation) || zustand.formation, key = FORMEN[k0] ? k0 : '4-4-2';
    // aktuelle Plätze aus den echten Positionen der Spieler ableiten
    const FORM = formSlots(key), slotMap = {}, frei = new Set(FORM.map((_, k) => k));
    feld.forEach((p, n) => { let best = -1, bd = 1e9; frei.forEach(k => { const d = Math.hypot(FORM[k].fu - p.fu, FORM[k].fv - p.fv); if (d < bd){ bd = d; best = k; } }); if (best >= 0){ slotMap[idx[n]] = best; frei.delete(best); } });
    // schon geplante (noch nicht ausgeführte) Wechsel im Fenster gleich mitzeigen
    const gp = (s.wechselPlan[0] || []).map(w => ({ o: PLAYER_DATABASE.indexOf(w.raus.daten), i: w.rein })).filter(q => idx.includes(q.o));
    const sqV = idx.slice(), slotV = { ...slotMap };
    gp.forEach(q => { const k = sqV.indexOf(q.o); if (k >= 0){ sqV[k] = q.i; slotV[q.i] = slotMap[q.o]; delete slotV[q.o]; } });
    const bankV = (s.bank && s.bank[0] ? s.bank[0] : []).filter(i => !gp.some(q => q.i === i));
    zustand.squad = [twIdx].concat(sqV); zustand.torwart = 0; zustand.ersatz = bankV.slice(); zustand.formation = key; zustand.formSlot = { ...slotV };
    if (beiHalbzeit && s.phase === 'halbzeit') clearTimeout(s.hzUhr);
    formEditorOeffnen(null, document.body);
    const ov = document.getElementById('formEditor'); if (!ov) return;
    ov._start = sqV.slice(); ov._geplantIn = gp.map(q => q.i); ov._maxRein = Math.max(0, wechselRest(0)); ov._twStart = twIdx;
    const hilfe = ov.querySelector('.fe-hilfe'); if (hilfe) hilfe.textContent = 'Formation wählen oder Spieler tauschen. Bankspieler auf einen Platz ziehen = Wechsel (noch ' + ov._maxRein + '). Angriff = oben.';
    ov._ende = () => {
      ov._ende = null;
      try {
        const nowSq = zustand.squad.slice(1), start = ov._start;
        const ein = nowSq.filter(i => !start.includes(i)), aus = start.filter(i => !nowSq.includes(i));
        const paare = gp.map(q => ({ o: q.o, i: q.i, neu: false }));
        const frei2 = aus.slice();
        ein.forEach(i => {
          const sl = zustand.formSlot[i]; let o = frei2.find(a => slotV[a] === sl); if (o == null) o = frei2[0]; if (o == null) return;
          frei2.splice(frei2.indexOf(o), 1); paare.push({ o, i, neu: true });
        });
        // Platzwünsche für die echten Feldspieler (ausgewechselte Spieler übernehmen den Platz ihres Nachfolgers)
        const pref = {}; idx.forEach(a => { const q = paare.find(x => x.o === a); const v = q ? q.i : a; if (zustand.formSlot[v] != null) pref[a] = zustand.formSlot[v]; });
        const ok = formLiveAnwenden(zustand.formation, pref);
        let neuGeplant = 0;
        if (zustand.squad[0] !== twIdx && wechselRest(0) > 0){ const twNeu = zustand.squad[0]; if (s.bank[0] && s.bank[0].includes(twNeu)){ s.wechselPlan[0].push({ raus: tw, rein: twNeu }); neuGeplant++; } }   // V11.13: Torwartwechsel im Spiel
        paare.filter(q => q.neu).forEach(q => {
          const raus = teamSp(0).find(p => p.aktiv && PLAYER_DATABASE.indexOf(p.daten) === q.o); if (!raus || wechselRest(0) <= 0) return;
          s.wechselPlan[0].push({ raus, rein: q.i }); neuGeplant++;
        });
        if (neuGeplant){
          if (s.phase === 'standard' && s.std) wechselAusfuehrenAlle(true, true);   // steht der Ball gerade, sofort
          try { zeigeHinweis(s.phase === 'halbzeit' ? '🔄 Wechsel gilt ab der 2. Halbzeit' : s.phase === 'standard' ? '🔄 Wechsel' : '🔄 Wechsel erfolgt bei der nächsten Unterbrechung', 2.4); } catch (x) {}
        } else if (ok){ try { zeigeHinweis('📋 Neue Aufstellung: ' + zustand.formation, 2.2); } catch (x) {} }
      } finally {
        zustand.squad = snap.squad; zustand.torwart = snap.torwart; zustand.ersatz = snap.ersatz; zustand.formation = snap.formation; zustand.formSlot = snap.formSlot;
        try { formSpeichern(); } catch (x) {} try { ersatzSpeichern(); } catch (x) {} try { formKnopfAktualisieren(); } catch (x) {}
        ov._maxRein = null; ov._start = null; ov._geplantIn = null;
        ov.classList.remove('fe-live');
        try { wechselKnoepfe(); } catch (x) {}
        if (beiHalbzeit && s && s.phase === 'halbzeit'){ clearTimeout(s.hzUhr); s.hzUhr = spielTimer(() => { if (s && s.phase === 'halbzeit' && !s.gast) zweiteHalbzeit(); }, 9000); }
      }
    };
  }

  // =====================================================================
  // V3.0: Trainer am Spielfeldrand mit Sprechblasen (über 500 Sätze, passend zur Spielsituation)
  // =====================================================================
  const TRAINER_SAETZE = {"hitze": ["Trinken, Jungs, es ist heiß!", "Kräfte einteilen bei der Hitze!", "Im Schatten wäre jetzt schön…", "Ball laufen lassen, nicht so viel rennen!", "Bei der Hitze zählt Kopf, nicht Beine!", "Wasserflaschen bereit an der Linie!"],"kaelte": ["Bewegen, Jungs, sonst wird's kalt!", "Warm bleiben, immer in Bewegung!", "Bei der Kälte gut aufwärmen!", "Hände in die Ärmel, aber Kopf hoch!", "Kalte Füße? Dann lauft mehr!", "Der Ball ist hart bei der Kälte – sauber annehmen!"], "anpfiff": ["Los geht's, Jungs! Volle Konzentration!", "Wir spielen unser Spiel – kurze Pässe!", "Von Anfang an hellwach sein!", "Die ersten Minuten gehören uns!", "Ruhig bleiben, Ball laufen lassen!", "Jeder hilft jedem – los!", "Zeigt, was wir trainiert haben!", "Kompakt stehen, dann schnell nach vorn!", "Mutig spielen, keine Angst!", "Viel Spaß – und gebt alles!", "Sprecht miteinander auf dem Platz!", "Erst der Ball, dann der Gegner!", "Wach sein bei jedem zweiten Ball!", "Heute holen wir uns das Ding!", "Wir fangen stark an, Männer!", "Alle bereit? Dann ab dafür!", "Geduld, die Chancen kommen!", "Laufbereitschaft zeigen von Minute eins!"], "angriff": ["Jetzt nach vorne, nachrücken!", "Breit machen, Flügel nutzen!", "Schieß doch mal, {n}!", "Einer muss in die Box!", "Kombinieren, nicht verschleppen!", "Tempo! Jetzt Tempo!", "Den Doppelpass suchen!", "Geh ins Eins-gegen-eins, {n}!", "Zweiter Pfosten besetzen!", "Schneller spielen, nicht so lange halten!", "Der Raum ist da – rein da!", "Flanke, Flanke!", "Hinterlaufen! Hinterlaufen!", "Nicht quer, jetzt steil!", "Mitgehen, nicht stehen bleiben!", "Schuss aus der zweiten Reihe!", "Gut so, {n}, weiter so!", "Den letzten Pass sauber spielen!", "Lauf in die Tiefe, {n}!", "Ruhig, Kopf hoch, dann spielen!"], "verteidigen": ["Zurück! Alle zurück!", "Kompakt bleiben, Abstände klein!", "Druck auf den Ball!", "Nicht einfach durchlaufen lassen!", "{n}, nimm deinen Mann!", "Doppeln! Zu zweit drauf!", "Torwart, sprich mit deinen Leuten!", "Die Mitte zumachen!", "Nicht reingrätschen, stehen bleiben!", "Abseitslinie halten!", "Schieben, schieben, schieben!", "Rückwärts arbeiten, {n}!", "Keine Flanke zulassen!", "Klären! Einfach weg damit!", "Bleib dran, {n}, nicht abschütteln lassen!", "Zweikampf annehmen!", "Den Rückraum absichern!", "Hinten nichts anbrennen lassen!", "Ruhe, Ruhe – nicht hektisch werden!", "Konter absichern, einer bleibt hinten!"], "tor_eigen": ["JAAA! Super, {n}!", "Tooor! So geht das!", "Klasse gemacht, {n}!", "Genau so haben wir's trainiert!", "Weltklasse! Weiter so!", "Was für ein Ding, {n}!", "Jawoll! Und jetzt nachlegen!", "Stark rausgespielt, Jungs!", "Das hast du dir verdient, {n}!", "Ich hab's gewusst! Klasse!", "Super Abschluss, {n}!", "Ganz ruhig – jetzt nicht nachlassen!", "Mannschaftstor, alle haben geholfen!", "Ihr seid der Wahnsinn!", "Das war eiskalt, {n}!", "Klatscht ab und dann weiter!", "Bombe! Unhaltbar!", "Davon wollen wir mehr sehen!"], "tor_gegner": ["Kopf hoch, weitermachen!", "Abhaken, Jungs, weiter geht's!", "Das war zu einfach – wacher sein!", "Nicht hängen lassen, wir kommen zurück!", "Wer hatte den Mann? Sprecht euch ab!", "Egal, noch ist alles drin!", "Ruhig bleiben, unser Spiel spielen!", "Jetzt erst recht!", "Fehler passieren – zusammenhalten!", "Torwart, keine Schuld – weiter!", "Zurück ins Spiel, sofort!", "Wir haben noch genug Zeit!", "Konzentration! Das darf nicht passieren!", "Mund abputzen, weiter!", "Jetzt zeigen wir Charakter!", "Alle zusammen, jetzt kämpfen!", "Ärgern ist erlaubt, aufgeben nicht!", "Das holen wir uns zurück!"], "ausgleich_eigen": ["Ausgleich! Jetzt drehen wir das!", "Wieder drin! Klasse, {n}!", "Wusste ich doch! Weiter Druck!", "Alles wieder offen – jetzt nachlegen!", "Unentschieden reicht uns nicht!", "Super Moral, Jungs!"], "fuehrung_weg": ["Mist! Jetzt nicht nervös werden!", "Ausgleich… egal, wir sind besser!", "Weiter konzentriert spielen!", "Nicht hektisch, wir gehen wieder in Führung!", "Kurz schütteln und weiter!", "Das war unnötig – wacher sein!"], "chance_vergeben": ["Uuuh! Fast!", "Knapp! Das nächste Mal sitzt der!", "Der war schon fast drin!", "Gute Idee, {n}, weiter versuchen!", "Ganz knapp vorbei – weiter so!", "Zielen, {n}, nicht nur draufhauen!", "Den musst du machen, {n}!", "Mehr Ruhe im Abschluss!", "Weiter schießen, der nächste geht rein!", "Fast! Ich hatte ihn schon gesehen!", "Nur Zentimeter! Weiter!", "Pfosten! So ein Pech!", "Gute Chance – wir kommen!", "Flach schießen, {n}, flach!"], "gegner_chance": ["Puh! Das war knapp!", "Glück gehabt – wacher sein!", "Wer war da beim Mann?", "So viel Platz dürfen wir nicht lassen!", "Das war gefährlich – aufpassen!", "Schneller rausrücken!", "Zu einfach durchgelassen!", "Hinten dichtmachen jetzt!", "Nochmal geht das nicht gut!", "Konzentration in der Abwehr!"], "parade_eigen": ["Super gehalten, {n}!", "Was für eine Parade!", "Unser Torwart ist der Beste!", "Stark, {n}! Ganz stark!", "Klasse Reflex!", "Den hast du super gehalten!", "Danke, {n}! Weltklasse!", "Halt sie alle, {n}!", "Mega Parade!", "Die Hände sind Gold wert!"], "parade_gegner": ["Mist, der Torwart!", "Gut gehalten – trotzdem weiter so!", "Höher schießen, in die Ecke!", "Der Torwart ist gut, ins Eck zielen!", "Nachsetzen bei Abprallern!", "Nicht aufgeben, irgendwann ist er drin!", "Weiter aufs Tor schießen!", "Fast, {n}, fast!"], "foul_gegen": ["Foul! Das war Foul, Schiri!", "Alles okay, {n}?", "Das geht so nicht, Schiri!", "Pfeif das ab!", "Hey, das war von hinten!", "Steh auf, {n}, weiter geht's!", "Schiri, da muss Gelb kommen!", "Ruhig bleiben, Jungs – Freistoß!", "Lasst euch nicht provozieren!", "Klares Foul, gut gepfiffen!", "Das war gefährlich!", "Freistoß – jetzt was draus machen!"], "foul_eigen": ["Fair bleiben, {n}!", "Nicht so reingehen!", "Kopf benutzen, {n}!", "Stehen bleiben, nicht grätschen!", "Das war unnötig!", "Ruhig, {n}, nicht so hektisch!", "Erst denken, dann Zweikampf!", "Das war doch Ball, Schiri!", "Sauber verteidigen!", "Fouls kosten uns Kraft und Freistöße!"], "gelb_eigen": ["Vorsicht jetzt, {n}! Gelb!", "Mit Gelb musst du aufpassen!", "Ganz ruhig, {n}!", "Nicht nochmal, {n}!", "Gelb… das war zu viel!", "Kontrolliert spielen jetzt, {n}!", "Keine Diskussion, weiter!", "Jetzt bitte nur noch fair!"], "gelb_gegner": ["Richtig so, Schiri!", "Gelb, das war überfällig!", "Endlich mal eine Karte!", "Den haben wir jetzt im Griff!", "Gut gepfiffen!", "Jetzt gegen den ins Dribbling gehen!"], "rot_eigen": ["Nein! Rot! Das darf nicht wahr sein!", "Jetzt müssen alle mehr laufen!", "Zu acht schaffen wir das auch!", "Rot, {n}… das kostet uns!", "Enger zusammenrücken jetzt!", "Jeder muss jetzt einen Meter mehr gehen!", "Kompakter stehen, wir sind einer weniger!", "Ruhig, Jungs – das stehen wir durch!"], "rot_gegner": ["Rot! Jetzt sind wir einer mehr!", "Überzahl! Jetzt Druck machen!", "Ball laufen lassen, die werden müde!", "Nutzt die Überzahl, Jungs!", "Breit spielen, die haben Lücken!", "Geduldig bleiben, der Platz kommt!"], "ecke_eigen": ["Ecke! Alle Großen nach vorne!", "Ecke – zweiter Pfosten besetzen!", "Gute Flanke jetzt, {n}!", "Rein in den Strafraum!", "Kopfball! Hoch steigen!", "Einer bleibt hinten, gegen den Konter!", "Ab in die Mitte!", "Ecke – das ist unsere Chance!", "Zum Tor hin drehen, {n}!", "Kurz oder lang – du entscheidest, {n}!"], "ecke_gegner": ["Ecke gegen uns – jeder nimmt seinen Mann!", "Pfosten besetzen!", "Torwart, du kommst raus!", "Klären! Hoch und weit!", "Nicht nur zugucken – Körper rein!", "Erster Kontakt muss uns gehören!", "Abpraller beachten!", "Konzentration bei der Ecke!"], "freistoss_eigen": ["Freistoß! Schieß ihn rein, {n}!", "Über die Mauer, {n}!", "Ganz ruhig anlaufen!", "Gute Position – direkt drauf!", "Unten rum oder oben rein, {n}!", "Nachgehen, falls er abprallt!", "Mach ihn, {n}!", "Ins Torwarteck oder ins lange?", "Gut zielen, {n}!", "Konzentriert, das ist deine Chance!"], "freistoss_gegner": ["Mauer stellen! Schnell!", "Nicht wegdrehen in der Mauer!", "Hochspringen beim Schuss!", "Torwart, stell die Mauer!", "Abpraller holen!", "Keiner läuft zu früh raus!", "Auf die Kopfballspieler achten!", "Ruhe bewahren!"], "einwurf_eigen": ["Schneller Einwurf!", "Anbieten! Einer muss frei sein!", "Wirf zu {n}!", "Freilaufen, Jungs!", "Schnell machen, bevor die sortiert sind!", "Beide Füße auf dem Boden!"], "einwurf_gegner": ["Zustellen beim Einwurf!", "Jeder hat seinen Mann!", "Nicht schlafen jetzt!", "Eng ran an die Leute!"], "abstoss": ["Kurz rausspielen!", "Anbieten für den Torwart!", "Ruhig von hinten aufbauen!", "Weit oder kurz – entscheide, Torwart!", "Breit machen beim Abstoß!"], "halbzeit_fuehrung": ["Gute erste Halbzeit, so weitermachen!", "Nicht nachlassen in der zweiten Hälfte!", "Das war stark – jetzt nachlegen!", "Konzentriert bleiben, noch ist nichts gewonnen!", "Trinken, durchatmen, weiter so!", "Super gespielt, Jungs! Genauso weiter!"], "halbzeit_rueckstand": ["Jetzt Gas geben in der zweiten Halbzeit!", "Wir drehen das, glaubt dran!", "Mehr Laufbereitschaft, mehr Mut!", "Wir sind nicht schlechter – zeigt es!", "Neue Halbzeit, neues Glück!", "Kopf hoch, wir kommen zurück!"], "halbzeit_remis": ["Alles offen – jetzt holen wir uns das!", "Noch ein bisschen mutiger nach vorn!", "Gut gespielt, aber da geht mehr!", "Wer mehr will, gewinnt – also los!", "Weiter konzentriert, die Chance kommt!", "Zweite Halbzeit gehört uns!"], "zweite": ["Neue Halbzeit – volle Konzentration!", "Wie besprochen, Jungs!", "Gleich von Anfang an Druck!", "Die ersten Minuten sind wichtig!", "Alles geben jetzt!", "Auf geht's – zweite Halbzeit!"], "schluss_fuehrung": ["Jetzt clever spielen!", "Ball halten, Zeit runterspielen!", "Nur noch ein paar Minuten!", "Hinten dicht machen!", "Keine unnötigen Risiken!", "Ruhig bleiben, das bringen wir heim!", "Jeder Ball muss geklärt werden!", "Zusammen – nur noch kurz!", "Keine Fouls jetzt in Tornähe!", "Konzentration bis zum Schluss!"], "schluss_rueckstand": ["Alles nach vorne!", "Jetzt muss was passieren!", "Schießen, schießen, schießen!", "Schneller! Die Zeit läuft!", "Alle Mann in die Offensive!", "Noch ist es nicht vorbei!", "Hohe Bälle in den Strafraum!", "Jeder Ball zählt jetzt!", "Risiko jetzt, Jungs!", "Wir brauchen nur ein Tor!"], "schluss_remis": ["Einer geht noch!", "Jetzt den Lucky Punch suchen!", "Aber hinten nichts anbrennen lassen!", "Letzte Kräfte mobilisieren!", "Wer will den Sieg mehr?", "Konzentration – ein Fehler entscheidet!"], "muede": ["{n}, durchhalten!", "{n}, ich sehe dich – noch ein bisschen!", "Langsamer machen, {n}, Kräfte sparen!", "{n}, nicht sprinten, wenn's nicht nötig ist!", "Halt durch, {n}!", "{n}, atme durch!", "Gleich kommt Hilfe, {n}!", "Kurze Pässe, {n}, nicht so viel laufen!"], "wechsel": ["{n} raus, {m} rein – viel Glück!", "Komm her, {n}, gut gemacht!", "{m}, zeig was du kannst!", "Frische Beine – los, {m}!", "Danke, {n}! Starkes Spiel!", "{m}, du weißt, was zu tun ist!", "Rein mit dir, {m}, gib Gas!", "{n}, setz dich, du hast alles gegeben!", "{m}, halt dich an die Position von {n}!", "Jetzt bringen wir neue Energie!"], "verletzt": ["{n}! Alles okay?", "Bleib liegen, {n}, Hilfe kommt!", "Oh nein, {n}…", "Vorsicht mit {n}, Schiri!", "Holt den Arzt für {n}!", "Geht's noch, {n}?", "Hoffentlich nichts Schlimmes…", "Ganz ruhig, {n}, wir kümmern uns!"], "ballverlust": ["Nicht so leicht verlieren!", "Sofort nachsetzen!", "Gegenpressing! Holt ihn zurück!", "Einfacher spielen!", "Den Ball sichern, {n}!", "Nicht zu viel dribbeln, {n}!", "Kopf hoch vor dem Pass!", "Zurück, zurück, sofort!"], "ballgewinn": ["Super erobert, {n}!", "Jetzt schnell umschalten!", "Konter! Konter!", "Gut gemacht – jetzt nach vorne!", "Klasse Zweikampf, {n}!", "So wird's gemacht!", "Tempo jetzt!", "Schnell den freien Mann suchen!"], "pass_gut": ["Schöner Pass!", "Genau so!", "Toll gesehen, {n}!", "Super Ball!", "Weiter so kombinieren!", "Das sieht gut aus, Jungs!"], "abseits": ["Abseits! Später loslaufen!", "Auf die Linie achten!", "Zu früh gestartet!", "Timing, Jungs, Timing!", "Gut gestellt, Abwehr!", "Abseitsfalle! Klasse!"], "allgemein": ["Weiter so, Jungs!", "Kommt schon, wir schaffen das!", "Mehr Druck jetzt!", "Immer in Bewegung bleiben!", "Schaut über die Schulter!", "Laut sein auf dem Platz!", "Jeder Meter zählt!", "Ich will Leidenschaft sehen!", "Fair bleiben, aber hart arbeiten!", "Gemeinsam sind wir stark!", "Schritt für Schritt!", "Spaß haben, Jungs!", "Gut gekämpft bisher!", "Bleibt wach!", "Augen auf!", "Nicht meckern, spielen!", "Sprecht miteinander!", "Nicht nachlassen!", "Ich will mehr Bewegung sehen!", "Spielt euch frei!", "Ihr macht das gut!", "Konzentration halten!", "Mehr Mut!", "Jeder für jeden!", "Ruhig bleiben, unser Spiel!", "Wo ist die Ordnung?", "Anbieten, anbieten!", "Ich sehe viel Gutes!", "Bleibt fokussiert!", "Gebt alles!", "Schön die Positionen halten!", "Mehr reden auf dem Platz!", "Spielt einfach!", "Ball und Gegner laufen lassen!", "Weiter, weiter!"], "sieg": ["Gewonnen! Ihr seid super!", "Was für ein Spiel, Jungs!", "Ich bin so stolz auf euch!", "Verdient gewonnen!", "Klasse Teamleistung!", "Das feiern wir!"], "niederlage": ["Kopf hoch, Jungs!", "Nächstes Mal holen wir uns das!", "Ihr habt gekämpft – gut gemacht!", "Daraus lernen wir!", "Abhaken – Training wartet!", "Ich bin trotzdem stolz auf euch!"], "remis_ende": ["Unentschieden – okay!", "Ein Punkt ist ein Punkt!", "Da war mehr drin, aber gut gekämpft!", "Gutes Spiel von beiden Teams!"], "elfmeter": ["Ganz ruhig, du schaffst das!", "Ecke aussuchen und durchziehen!", "Nicht verunsichern lassen!", "Torwart, du hältst den!"], "konter_gegner": ["Konter! Alle zurück!", "Foul ziehen? Nein – sauber zurücklaufen!", "Sprint zurück, {n}!", "Nicht stehen bleiben, die kontern!", "Den Ballführer stellen!", "Laufwege zumachen!", "Zeit gewinnen, die anderen kommen!", "Schnell umschalten nach hinten!"], "lob": ["Stark, {n}!", "Das war richtig gut, {n}!", "Super Einsatz, {n}!", "{n}, du bist heute überall!", "Weiter so, {n}!", "Genau das will ich sehen, {n}!", "Top Laufweg, {n}!", "Klasse Übersicht, {n}!", "{n}, du spielst richtig stark!", "Sauber gemacht, {n}!", "Bravo, {n}!", "Was für ein Einsatz!"], "schiri": ["Schiri, das war doch Ecke!", "Wie lange noch, Schiri?", "Pfeif doch mal, Schiri!", "Das war doch klar, Schiri!", "Schiri, da war Hand!", "Hey, das war Einwurf für uns!", "Gute Entscheidung, Schiri!", "Ruhig, Jungs, der Schiri entscheidet!"], "taktik": ["Mehr über die Flügel!", "Spielt durch die Mitte!", "Hoch pressen jetzt!", "Etwas tiefer stehen!", "Ball schneller laufen lassen!", "Mehr Tempo im Spiel!", "Geduldig aufbauen!", "Lange Bälle hinter die Abwehr!", "Viererkette… äh, Dreierkette halten!", "Der Sechser muss sich zeigen!", "Außen weit raus!", "Stürmer, lauf die Abwehr an!", "Mittelfeld schneller nachrücken!", "Wechselt mal die Seite!", "Mehr Diagonalbälle!", "Kurz, kurz, lang!", "Vorne anlaufen, hinten absichern!", "Raum eng machen!", "Spielt flach, nicht hoch!", "Breite und Tiefe, Jungs!"], "dribbling": ["Geh durch, {n}!", "Tunnel! Ha, schön!", "Nicht zu viel tricksen, {n}!", "Mutig, {n}, ins Dribbling!", "Den Gegner ausspielen!", "Tempodribbling, {n}!", "Abspielen, {n}, du hast einen frei!", "Toller Trick!"], "torwart": ["Torwart, raus da!", "Halt die Linie, Torwart!", "Gut aufgepasst, Torwart!", "Sicher fangen!", "Schnell abwerfen!", "Ruhig, Torwart, du machst das gut!", "Ruf laut, Torwart!", "Steh nicht zu weit vorne!"], "wetter_regen": ["Bei Regen flach spielen!", "Der Ball rutscht – aufpassen!", "Bei Nässe einfach aufs Tor schießen!", "Vorsicht beim Grätschen im Regen!"], "wetter_schnee": ["Bei Schnee kurz spielen!", "Nicht ausrutschen, Jungs!", "Der Ball springt komisch – aufpassen!", "Warm bleiben, immer bewegen!"], "wetter_sonne": ["Trinken nicht vergessen!", "Kräfte einteilen bei der Hitze!", "Herrliches Fußballwetter!", "In den Schatten bei der Pause!"], "aufmunterung": ["Weiter glauben!", "Wir geben nicht auf!", "Zeigt Herz, Jungs!", "Noch ist alles möglich!", "Jeder kämpft für jeden!", "Brust raus!", "Ihr könnt das!", "Lasst die Köpfe nicht hängen!", "Wir sind ein Team!", "Jetzt erst recht, Jungs!", "Alles reinwerfen!", "Zusammen schaffen wir das!", "Fehler abhaken, weiter!", "Konzentration auf den nächsten Ball!", "Mutig bleiben!", "Wir haben schon Schwereres geschafft!", "Weiter, weiter, weiter!", "Jeder Zweikampf zählt!", "Kampf annehmen!", "Ich glaube an euch!"], "fuehrung_halten": ["Gut so, jetzt nicht nachlassen!", "Weiter konzentriert bleiben!", "Das dritte Tor wäre schön!", "Nicht zu früh zurückziehen!", "Weiter nach vorne spielen!", "Die Führung verteidigen wir zusammen!"]};
  function trainerWaehlen(opt, gegnerIdx){
    const belegt = new Set([...(opt.squad || []), ...gegnerIdx, ...(s.bank ? s.bank.flat() : [])].map(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].bild));
    const pool = [...new Set(PLAYER_DATABASE.filter(d => d.ki && !belegt.has(d.bild)).map(d => d.bild))].filter(k => SPRITES[k + '_v']);
    const hash = t => { let x = 7; for (const c of String(t)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
    const k0 = pool.length ? pool[hash(s.land[0]) % pool.length] : 'a31';
    let k1 = pool.length ? pool[hash(s.gegner[0] + '#') % pool.length] : 'a31';
    if (k1 === k0 && pool.length > 1) k1 = pool[(pool.indexOf(k0) + 7) % pool.length];
    s.trainer = [k0, k1].map(key => ({ key, bild: neuesBild(SPRITES[key + '_v']), blase: null, naechst: 2, x: 0, z: -HB }));
    s.trainerUhr = 6;
  }
  // sagt einen Satz aus der Kategorie (n, m = Spielernamen)
  function trainerSag(team, kat, n, m, vorrang){
    if (!s || !s.trainer || s.gast) return false;
    if (team !== (s.lokalTeam || 0)) return false;   // V4.8: nur dein eigener Trainer spricht, der Gegner-Trainer bleibt still
    const tr = s.trainer[team], liste = TRAINER_SAETZE[kat]; if (!tr || !liste || !liste.length) return false;
    if (!vorrang && tr.blase && tr.blase.t < tr.blase.dauer + 1.6) return false;
    let kand = liste.filter(z => (n || !z.includes('{n}')) && (m || !z.includes('{m}')));
    tr.zuletzt = tr.zuletzt || [];
    const frisch = kand.filter(z => !tr.zuletzt.includes(z)); if (frisch.length) kand = frisch;
    if (!kand.length) return false;
    const roh = kand[(Math.random() * kand.length) | 0];
    tr.zuletzt.push(roh); if (tr.zuletzt.length > 40) tr.zuletzt.shift();
    const text = roh.replace(/\{n\}/g, n || '').replace(/\{m\}/g, m || '');
    tr.blase = { text: 'Trainer: ' + text, t: 0, start: performance.now() / 1000, dauer: klemme(1.5 + text.split(' ').length * .32, 2, 4.4) };
    s.trainerUhr = Math.max(s.trainerUhr || 0, 3.5);
    return true;
  }
  const teamVonName = n => { const p = n && s.spieler.find(q => q.name === n); return p ? p.team : null; };
  // Hook aus dem Kommentar: jedes Ereignis, das der Kommentator meldet, kann auch ein Trainer kommentieren
  function trainerEreignis(typ, name){
    if (!s || s.gast || !s.trainer) return;
    const t = teamVonName(name), stand = tm => Math.sign(s.tore[tm] - s.tore[1 - tm]);
    const beide = (a, b, n0, n1, vr) => { const t0 = t != null ? t : (s.besitzTeam != null ? s.besitzTeam : 0); trainerSag(t0, a, n0, null, vr); if (b) spielTimer(() => trainerSag(1 - t0, b, n1, null, vr), 1100 + Math.random() * 600); };
    if (/^(tor|fuehrung|ausbau|anschluss|ausgleich|aufholjagd)$/.test(typ)){
      const tt = s.letztTorTeam != null ? s.letztTorTeam : t; if (tt == null) return;
      trainerSag(tt, typ === 'ausgleich' ? 'ausgleich_eigen' : 'tor_eigen', name, null, true);
      spielTimer(() => trainerSag(1 - tt, typ === 'ausgleich' ? 'fuehrung_weg' : 'tor_gegner', null, null, true), 1300);
      return;
    }
    if (t == null && /^(knapp|drueber|pfosten|latte|parade|fang|parade_ecke|foul|gelb|rot|tackle|pass|abseits)$/.test(typ)) return;
    switch (typ){
      case 'knapp': case 'drueber': case 'pfosten': case 'latte': case 'chance':
        return beide('chance_vergeben', Math.random() < .55 ? 'gegner_chance' : null, name, null);
      case 'parade': case 'parade_ecke': case 'fang':
        if (typ === 'fang' && Math.random() < .6) return;
        return beide('parade_eigen', Math.random() < .5 ? 'parade_gegner' : null, name, s.letzterSchuetze);
      case 'foul': return beide('foul_eigen', 'foul_gegen', name, null, true);
      case 'gelb': return beide('gelb_eigen', 'gelb_gegner', name, null, true);
      case 'rot': return beide('rot_eigen', 'rot_gegner', name, null, true);
      case 'tackle': if (Math.random() < .35) return beide(Math.random() < .5 ? 'ballgewinn' : 'lob', Math.random() < .4 ? 'ballverlust' : null, name, null); return;
      case 'pass': if (Math.random() < .12) trainerSag(t, 'pass_gut', name); return;
      case 'abseits': if (Math.random() < .6) trainerSag(t, 'abseits'); return;
      case 'halbzeit': for (const tm of [0, 1]) spielTimer(() => trainerSag(tm, ['halbzeit_rueckstand', 'halbzeit_remis', 'halbzeit_fuehrung'][stand(tm) + 1], null, null, true), 400 + tm * 1500); return;
      case 'schlussphase': case 'spannend': case 'entschieden': case 'letzte': case 'minute':
        for (const tm of [0, 1]) spielTimer(() => trainerSag(tm, ['schluss_rueckstand', 'schluss_remis', 'schluss_fuehrung'][stand(tm) + 1]), 300 + tm * 1700); return;
      case 'abpfiff': case 'abpfiff_sieg':
        for (const tm of [0, 1]) spielTimer(() => trainerSag(tm, ['niederlage', 'remis_ende', 'sieg'][stand(tm) + 1], null, null, true), 600 + tm * 900); return;
      case 'einlauf': case 'einlauf_liga':
        for (const tm of [0, 1]) spielTimer(() => trainerSag(tm, 'anpfiff', null, null, true), 1500 + tm * 1800); return;
    }
  }
  // Standards: Trainer rufen ihren Leuten etwas zu
  function trainerStandard(typ, team, schuetze){
    const n = schuetze && schuetze.name;
    if (typ === 'ecke'){ trainerSag(team, 'ecke_eigen', n); spielTimer(() => trainerSag(1 - team, 'ecke_gegner'), 900); }
    else if (typ === 'freistoss' && s.std && s.std.elf){ trainerSag(team, 'elfmeter', n, null, true); spielTimer(() => trainerSag(1 - team, 'torwart', null, null, true), 900); }
    else if (typ === 'freistoss'){ const nah = Math.abs(s.std.ort.x - richt(team) * HL) < 24; trainerSag(team, nah ? 'freistoss_eigen' : (Math.random() < .5 ? 'taktik' : 'angriff'), n); if (nah) spielTimer(() => trainerSag(1 - team, 'freistoss_gegner'), 900); }
    else if (typ === 'einwurf'){ if (Math.random() < .45) trainerSag(team, 'einwurf_eigen', n); else if (Math.random() < .3) trainerSag(1 - team, 'einwurf_gegner'); }
    else if (typ === 'abstoss'){ if (Math.random() < .35) trainerSag(team, Math.random() < .5 ? 'abstoss' : 'torwart'); }
    else if (typ === 'anstoss' && s.halbzeitGewesen && s.zeit > HALBZEIT - 1 && !s.zweiteGesagt){ s.zweiteGesagt = true; for (const tm of [0, 1]) spielTimer(() => trainerSag(tm, 'zweite', null, null, true), 300 + tm * 1400); }
  }
  // laufend: je nach Lage im Spiel
  function trainerSchritt(dt){
    if (!s || !s.trainer) return;
    if (s.phase !== 'spiel' || s.gast) return;
    s.trainerUhr -= dt; if (s.trainerUhr > 0) return;
    s.trainerUhr = 5 + Math.random() * 6;
    const tm = Math.random() < .55 ? 0 : 1, b = welt.ball, own = b.besitzer, dir = richt(tm);
    const lage = Math.sign(s.tore[tm] - s.tore[1 - tm]), spaet = s.zeit < 50;
    const meine = teamSp(tm);
    const muede = meine.filter(p => p.rolle !== 'TW' && p.ausdauer / Math.max(1, p.maxAusdauer) < .33)[0];
    if (muede && Math.random() < .5) return trainerSag(tm, 'muede', muede.name);
    if (own && own.team === tm && b.p.x * dir > 0) return trainerSag(tm, Math.random() < .25 ? 'dribbling' : 'angriff', own.name);
    if (own && own.team !== tm){
      const zuTor = b.p.x * dir < 0, schnell = Math.hypot(own.v.x, own.v.z) > 5.5 && own.v.x * -dir > 3;
      if (schnell && zuTor) return trainerSag(tm, 'konter_gegner', (meine.filter(p => p.rolle !== 'TW').sort((a, c) => d2(a.p, b.p) - d2(c.p, b.p))[0] || {}).name);
      if (zuTor) return trainerSag(tm, 'verteidigen', (meine.filter(p => p.rolle !== 'TW').sort((a, c) => d2(a.p, b.p) - d2(c.p, b.p))[0] || {}).name);
    }
    if (spaet && lage < 0) return trainerSag(tm, Math.random() < .5 ? 'schluss_rueckstand' : 'aufmunterung');
    if (spaet && lage > 0) return trainerSag(tm, 'schluss_fuehrung');
    if (lage > 0 && Math.random() < .35) return trainerSag(tm, 'fuehrung_halten');
    if (lage < 0 && Math.random() < .45) return trainerSag(tm, 'aufmunterung');
    const wt = s.wetter === 'regen' ? 'wetter_regen' : s.wetter === 'schnee' ? 'wetter_schnee' : s.wetter === 'sonne' ? 'wetter_sonne' : null;
    if (wt && Math.random() < .12) return trainerSag(tm, wt);
    if (s.temp != null && (s.temp >= 27 || s.temp <= 3) && Math.random() < .14) return trainerSag(tm, s.temp >= 27 ? 'hitze' : 'kaelte');   // V4.5
    const q = Math.random();
    if (q < .3) return trainerSag(tm, 'allgemein');
    if (q < .55) return trainerSag(tm, 'taktik');
    if (q < .75){ const p = meine.filter(x => x.rolle !== 'TW')[(Math.random() * Math.max(1, meine.length - 1)) | 0]; return trainerSag(tm, 'lob', p && p.name); }
    if (q < .85) return trainerSag(tm, 'torwart');
    if (q < .93) return trainerSag(tm, 'schiri');
    return trainerSag(tm, 'allgemein');
  }
  // Sprechblasen zeichnen (über allem). Ist der Trainer nicht im Bild, hängt die Blase oben am Rand mit seinem Kopf.
  function zeilenUmbruch(g, text, maxB){
    const w = text.split(' '), z = []; let l = '';
    for (const x of w){ const t = l ? l + ' ' + x : x; if (g.measureText(t).width > maxB && l){ z.push(l); l = x; } else l = t; }
    if (l) z.push(l); return z;
  }
  // V4.3: Platz für die Blasen in der oberen Leiste (links: Pause ↔ Spielstand, rechts: Spielstand ↔ Knöpfe)
  let hudCache = null, hudZeit = 0;
  function hudPlatz(){
    const jetzt = performance.now(); if (hudCache && jetzt - hudZeit < 800) return hudCache;
    hudZeit = jetzt; hudCache = null;
    try {
      const cv = document.getElementById('spielCanvas'), tf = document.querySelector('#hud .tafel'), uh = document.getElementById('uhr');
      if (!cv || !tf) return null;
      const cr = cv.getBoundingClientRect(), k = kam.w / Math.max(1, cr.width), tr = tf.getBoundingClientRect(), ur = uh ? uh.getBoundingClientRect() : tr;
      let li = 0, re = kam.w;
      document.querySelectorAll('#hud .k-hud').forEach(b => { if (b.hidden || b.offsetParent === null) return; const r0 = b.getBoundingClientRect(); if (r0.top > tr.bottom) return;
        const x0 = (r0.left - cr.left) * k, x1 = (r0.right - cr.left) * k;
        if (x1 < (tr.left - cr.left) * k) li = Math.max(li, x1); else if (x0 > (tr.right - cr.left) * k) re = Math.min(re, x0); });
      const uOben = uh && ur.top < tr.bottom;   // V6.1: Wetter steht unten links – nur oben mitzählen
      const oben = (tr.top - cr.top) * k, hoehe = (Math.max(tr.bottom, uOben ? ur.bottom : tr.bottom) - tr.top) * k;
      const uL = uOben ? (ur.left - cr.left) * k : re;   // V5.8: freier Platz zwischen Tafel (links) und Wetter (rechts)
      hudCache = { links: [li + 6, (tr.left - cr.left) * k - 6], rechts: [(tr.right - cr.left) * k + 6, re - 6], mitte: [(tr.right - cr.left) * k + 8, Math.min(re, uL) - 8], oben, hoehe: (tr.bottom - tr.top) * k };
    } catch (e) {}
    return hudCache;
  }
  function zeichneTrainerBlasen(g){
    if (!s || !s.trainer) return;
    const W = kam.w, H = kam.h, hp = hudPlatz();
    s.trainer.forEach((tr, team) => {
      const bl = tr.blase; if (!bl) return; bl.t = performance.now() / 1000 - bl.start; if (bl.t > bl.dauer) return;
      const a = Math.min(1, bl.t * 6, (bl.dauer - bl.t) * 3);
      // Bereich in der oberen Leiste (falls genug Platz), sonst darunter
      const ber = hp ? (team === 0 ? hp.links : hp.rechts) : null, r0 = hp ? Math.max(9, Math.min(14, hp.hoehe / 2 - 2)) : 15;
      const leiste = !!(ber && ber[1] - ber[0] > 2 * r0 + 80);
      const mi = hp && hp.mitte ? hp.mitte : [W * .3, W * .7];
      let fs = W < 700 ? 9.5 : 11, maxB = Math.max(110, Math.min(W * .42, 360, (hp && hp.mitte ? hp.mitte[1] - hp.mitte[0] - 2 * r0 - 30 : 360)));   // V6.1: Blase oben rechts neben der Tafel
      g.save(); g.globalAlpha = a; g.font = '800 ' + fs + 'px system-ui,sans-serif';
      if (!bl.zeilen || bl.fs !== fs || bl.maxB !== maxB){
        let z = zeilenUmbruch(g, bl.text, maxB);
        if (leiste && z.length > 2){ fs -= 1.5; g.font = '800 ' + fs + 'px system-ui,sans-serif'; z = zeilenUmbruch(g, bl.text, maxB); }
        if (z.length > 3) z = z.slice(0, 3);
        bl.zeilen = z; bl.bw = Math.min(maxB + 16, Math.max(...z.map(t => g.measureText(t).width)) + 16); bl.fs = fs; bl.maxB = maxB;
      }
      fs = bl.fs; g.font = '800 ' + fs + 'px system-ui,sans-serif';
      const zeilen = bl.zeilen, bw = bl.bw, bh = zeilen.length * (fs + 3) + 7;
      const k = tr.kopf, sichtbar = false;   // V4.2: Trainer-Blasen stehen immer oben (links dein Trainer, rechts der Gegner)
      const farbe = (s.kits && s.kits[team] && s.kits[team].t) || '#ffe234';
      let bx, by, sx, sy, mini = false;
      if (sichtbar){ bx = klemme(k.x - bw / 2 + (team === 0 ? -bw * .25 : bw * .25), 6, W - bw - 6); by = Math.max(54, k.y - bh - 14); sx = k.x; sy = k.y - 2; }
      else if (true){ mini = true; { const lmin = (hp && hp.mitte ? hp.mitte[0] + 4 : 380) + 2 * r0 + 8, rmax = (hp && hp.mitte ? hp.mitte[1] : W - 8) - bw; bx = Math.max(lmin, Math.min(rmax, W / 2 - bw / 2 + r0 + 4)); }   // V9.2: Trainer-Spruch in der Mitte
        by = hp ? Math.max(4, hp.oben - 2) : 8; }   // V6.1: Trainer-Blase oben rechts neben der Tafel
      else { mini = true; bx = team === 0 ? 48 : W - bw - 48; by = 56; sx = team === 0 ? bx + 6 : bx + bw - 6; sy = by + bh + 6; }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect ? g.roundRect(bx + 2, by + 3, bw, bh, 9) : g.rect(bx + 2, by + 3, bw, bh); g.fill();
      { const gr = g.createLinearGradient(0, by, 0, by + bh); gr.addColorStop(0, '#2f86ff'); gr.addColorStop(1, '#1550d6'); g.fillStyle = gr; }   // V9.2: moderne blaue Blase, weiße Schrift
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6;
      g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, Math.min(14, bh / 2)) : g.rect(bx, by, bw, bh); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.roundRect ? g.roundRect(bx + 3, by + 2, bw - 6, bh * .42, Math.min(11, bh / 2)) : g.rect(bx + 3, by + 2, bw - 6, bh * .42); g.fill();
      // Zipfel zum Trainer
      if (!mini){ const tx = klemme(sx, bx + 12, bx + bw - 12); g.beginPath(); g.moveTo(tx - 6, by + bh - 1); g.lineTo(sx, sy); g.lineTo(tx + 6, by + bh - 1); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.fillRect(tx - 5, by + bh - 3, 10, 3); }
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'top';
      zeilen.forEach((z, i) => g.fillText(z, bx + 8, by + 6 + i * (fs + 3)));
      // kleiner Trainerkopf, wenn er gerade nicht im Bild ist
      if (mini && tr.bild && tr.bild.complete && tr.bild.naturalWidth){
        const cx = bx - r0 - 6, cy = by + bh / 2, im = tr.bild, nw = im.naturalWidth, nh = im.naturalHeight;
        g.save(); g.beginPath(); g.arc(cx, cy, r0, 0, Math.PI * 2); g.fillStyle = farbe; g.fill(); g.clip();
        const kv = tr.fig && tr.fig.kopfV;
        if (kv && kv.width){ const hd = r0 * 2.15, wd = hd * kv.width / kv.height; g.drawImage(kv, cx - wd / 2, cy - r0 * 1.05, wd, hd); }   // V4.2: ganzer Kopf
        else g.drawImage(im, nw * .18, 0, nw * .64, nh * .34, cx - r0, cy - r0 * .9, r0 * 2, r0 * 2 * (nh * .34) / (nw * .64));
        g.restore();
        g.beginPath(); g.arc(cx, cy, r0, 0, Math.PI * 2); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      }
      g.restore();
    });
  }

  // V3.4: Bank und Trainer als echte Figuren (mit Beinen, Trikot und Laufanimation)
  function randFigur(key, team, kit, nummer){
    const f = baueFigur(key, kit.h || '#222', team);
    const o = { ...f, daten: { name: '', rating: 70, bild: key }, p: V(), v: V(), blick: V(0, 0, 1), laufPhase: Math.random() * 6, tempo: 4, sprung: 0, jubel: 0, gefallen: 0, grae: 0, ringFarbe: kit.t };
    trikotVorbereiten(o, key, kit, nummer);
    return o;
  }
  function trainerKit(team){
    const k = (s.kits && s.kits[team]) || { t: '#2a64e0' };
    return { t: '#1e2740', kragen: k.t || '#ffe234', n: k.t || '#ffffff', h: '#1e2740', s: '#1e2740', sBand: [k.t || '#ffffff'], schuh: ['#111111'], land: null };
  }
  // V3.5: Leibchen (Netz-Überzieher in Neonfarbe) für die Auswechselspieler beim Aufwärmen
  const LEIBCHEN_FARBEN = ['#c6ff1a', '#ff6a13', '#ff2fa0', '#1fe0ff'];
  function hexRGB(c){ const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '')); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function leibchenFarben(){
    const abst = (a, b) => { const x = hexRGB(a), y = hexRGB(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    const wahl = [];
    for (const team of [0, 1]){
      const k = s.kits[team] || {};
      const kand = LEIBCHEN_FARBEN.filter(c => !wahl.includes(c)).sort((a, b) => { const sc = c => Math.min(abst(c, k.t), abst(c, k.h || k.t), wahl.length ? abst(c, wahl[0]) * .8 : 999); return sc(b) - sc(a); });
      wahl.push(kand[0]);
    }
    return wahl;
  }
  function leibchenMalen(cv, farbe, ansicht){
    if (!cv || cv.leibchen) return; cv.leibchen = true;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.save();
    // Weste: Schultern/Seiten bleiben im Trikot, breiter Halsausschnitt
    g.beginPath();
    if (ansicht === 's'){ g.rect(W * .2, H * .06, W * .6, H * .86); }
    else {
      g.moveTo(W * .2, H * .04); g.lineTo(W * .36, H * .04);
      g.quadraticCurveTo(W * .5, H * (ansicht === 'v' ? .3 : .12), W * .64, H * .04);
      g.lineTo(W * .8, H * .04); g.quadraticCurveTo(W * .9, H * .3, W * .86, H * .5);
      g.lineTo(W * .88, H * .94); g.lineTo(W * .12, H * .94); g.lineTo(W * .14, H * .5);
      g.quadraticCurveTo(W * .1, H * .3, W * .2, H * .04); g.closePath();
    }
    g.fillStyle = farbe; g.globalAlpha = .93; g.fill();
    g.clip();
    // Netzstruktur
    g.globalAlpha = .22; g.fillStyle = '#000';
    for (let y = 2; y < H; y += 6) for (let x = (y / 6 % 2) * 3; x < W; x += 6) g.fillRect(x, y, 2, 2);
    // Licht und Schatten
    g.globalAlpha = 1;
    const sh = g.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(0,0,0,.25)'); sh.addColorStop(.45, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,0,.22)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H);
    g.restore();
    // Saum
    g.save(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * .12, H * .94); g.lineTo(W * .88, H * .94); g.stroke(); g.restore();
  }
  function leibchenAnziehen(o, farbe){
    let n = 0;
    const versuch = () => {
      if (o.torsoV && o.torsoR && o.torsoS){ leibchenMalen(o.torsoV, farbe, 'v'); leibchenMalen(o.torsoR, farbe, 'r'); leibchenMalen(o.torsoS, farbe, 's'); return; }
      if (++n < 60) setTimeout(versuch, 100);
    };
    versuch();
  }
  // HALL OF FAME: Ausgewechselte setzen sich wieder auf die Bank (fliegende Wechsel, beliebig oft)
  function halleZurBank(team, daten){
    const ri = PLAYER_DATABASE.indexOf(daten); if (ri < 0 || !s.bank || s.bank[team].includes(ri)) return;
    s.bank[team].push(ri);
    try { const lf = s.leibchen || (s.leibchen = leibchenFarben()); const o = randFigur(daten.bild, team, s.kits[team], ''); o.idx = ri; leibchenAnziehen(o, lf[team]); s.bankFig[team].push(o); } catch (e) {}
  }
  function bankFigurenAufbauen(){
    s.bankFig = [[], []]; s.rausFig = [[], []];
    for (const team of [0, 1]){
      const lf = s.leibchen || (s.leibchen = leibchenFarben());
      for (const i of s.bank[team]){ const d = PLAYER_DATABASE[i]; if (!d) continue; const o = randFigur(d.bild, team, s.kits[team], ''); o.idx = i; leibchenAnziehen(o, lf[team]); s.bankFig[team].push(o); }
      const tr = s.trainer && s.trainer[team]; if (tr) tr.fig = randFigur(tr.key, team, trainerKit(team), '');
    }
  }
  // V11.5: Hallen-Zuschauer – Stufen an beiden Stirnseiten, in den Ecken und hinten (zwei Reihen); jeder Fan sieht anders aus
  // (anderer Kopf, Shirt, Hose, Größe, dazu Schal / Kappe / Mütze / Hut / Fahne) und jubelt auf seine eigene Art, wenn sein Team trifft
  const FAN_FARBEN = ['#f2f2f2', '#1b1b1f', '#d62828', '#f77f00', '#fcbf49', '#2a9d8f', '#264653', '#6a4c93', '#e56b9f', '#3a86ff', '#8ac926', '#7b5e3b', '#00b4d8', '#b5179e'];
  const FAN_HOSEN = ['#2b3a55', '#1e1e24', '#3b3f4a', '#5a4632', '#27406b', '#4a4a4a'];
  const FAN_TEXTUR = ['hautFarbe', 'kopfV', 'kopfR', 'kopfS', 'kopfD', 'kopfSLinks', 'torsoV', 'torsoR', 'torsoS'];
  const FAN_STUFE = .5;
  function fanWahl(a){ return a[Math.floor(Math.random() * a.length)]; }
  function fanKit(team){
    const tk = (s.kits && s.kits[team]) || { t: '#2a64e0', kragen: '#ffffff', n: '#ffffff' };
    const r = Math.random(), hose = fanWahl(FAN_HOSEN);
    let kit;
    if (r < .46) kit = { ...tk };   // Trikot der eigenen Mannschaft
    else if (r < .62) kit = { t: '#f2f2f2', m2: tk.t, m3: tk.t, muster: 'streifen', kragen: tk.t, n: tk.t };   // weißes Shirt mit Streifen in Teamfarbe
    else { const c = fanWahl(FAN_FARBEN); kit = { t: c, m2: fanWahl(FAN_FARBEN), m3: c, muster: Math.random() < .22 ? 'quer' : null, kragen: fanWahl(FAN_FARBEN), n: '#ffffff' }; }
    return { ...kit, h: hose, s: hose, sBand: [], schuh: ['#222222', '#e8e8e8'], hand: tk.hand || ['#eeeeee', '#333333'], nRand: null, land: null, flagge: null, ring: kit.t };
  }
  function fanSichtbar(o){
    if (tiefe(o.zx, 0, o.zz) < NAH) return false;
    const f = P(o.zx, o.podest || 0, o.zz), r = 1.7 * f.s, h = 3.6 * f.s;
    return f.x + r > -20 && f.x - r < kam.w + 20 && f.y + r * .5 > -20 && f.y - h < kam.h + 20;
  }
  function fanTexturen(o){
    const b = o.basis; if (!b || (o.torsoV && o.kopfV)) return;
    if (b.torsoV && b.kopfV) for (const k of FAN_TEXTUR) if (b[k] !== undefined) o[k] = b[k];
  }
  function halleZuschauerBauen(){
    s.zuschauer = []; s.zuschauerVorn = []; s.zuschauerHg = [];
    const _pr = grafikProfil(), low = _pr === GRAFIK.low, hochQ = _pr === GRAFIK.high || _pr === GRAFIK.ultra, nBasis = low ? 4 : 6, lueckenAnteil = low ? .95 : (hochQ ? .91 : .93);   // V10.0: Halle – bei Niedrig/Mittel/Auto deutlich weniger Zuschauer (FPS)   // V10.0: weniger Zuschauer in der Halle (alle Grafikstufen) – FPS; vorher .08
    const pool = PLAYER_DATABASE.filter(d => d && d.bild);
    for (let i = pool.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)), q = pool[i]; pool[i] = pool[j]; pool[j] = q; }
    const basen = [[], []]; let pi = 0;
    for (const team of [0, 1]) for (let i = 0; i < nBasis; i++){
      const d = pool[pi++ % Math.max(1, pool.length)]; if (!d) continue;
      try { basen[team].push(randFigur(d.bild, team, fanKit(team), '')); } catch (e) {}
    }
    const zaehler = [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)];
    const neu = (x, z, team, stufe, bx, bz) => {
      const liste = basen[team]; if (!liste.length || Math.random() < lueckenAnteil) return;
      const base = liste[zaehler[team]++ % liste.length], tk = (s.kits && s.kits[team]) || {}, c1 = tk.t || '#2a64e0', c2 = tk.kragen || '#ffffff', r = Math.random();
      const o = { ...base, p: V(), v: V(), blick: V(bx, 0, bz), zeichen: { y: .4, rot: 0, dz: 0, schwung: 0, rueck: false }, laufPhase: Math.random() * 6, jubel: 0, gefallen: 0, grae: 0, sprung: 0 };
      o.basis = base; o.fan = true; o.zx = x; o.zz = z; o.team0 = team; o.podest = stufe; o.bx = bx; o.bz = bz;
      o.skal = Math.random() < .12 ? .76 + Math.random() * .08 : .93 + Math.random() * .14;   // ein paar Kinder, sonst leicht verschiedene Größen
      o.verz = Math.random(); o.phaseF = Math.random() * 6.28;
      o.art = fanWahl(['fan', 'fan', 'fan', 'hoch', 'faust', 'tanz', 'wiegen', 'herz']);
      o.schal = r < .4 ? [c1, c2] : null;
      o.deck = (r > .3 && r < .58) ? { typ: fanWahl(['kappe', 'kappe', 'muetze']), f: Math.random() < .55 ? c1 : fanWahl(FAN_FARBEN) } : (r >= .58 && r < .67) ? { typ: 'hut', f: fanWahl(FAN_FARBEN) } : null;
      o.fahne = r > .92 ? [c1, c2] : null;
      o.p.set(x, 0, z);
      s.zuschauer.push(o);
      if (Math.abs(x) > 22.4) s.zuschauerHg.push(o); else s.zuschauerVorn.push(o);
    };
    // hinten: untere Reihe auf dem Hallenboden, obere Reihe auf der Stufe (bis in die Ecken)
    for (let x = -25.2; x <= 25.2; x += 1.95){
      const xx = x + (Math.random() - .5) * .7; if (Math.abs(xx) < 1.9) continue;
      neu(xx, -16.0 + (Math.random() - .5) * .4, Math.abs(xx) < 7 ? (Math.random() < .5 ? 0 : 1) : (xx < 0 ? 0 : 1), 0, -xx * .012, 1);
    }
    for (let x = -24.3; x <= 24.3; x += 2.05){
      const xx = x + (Math.random() - .5) * .7; if (Math.abs(xx) < 2) continue;
      neu(xx, -17.5 + (Math.random() - .5) * .3, Math.abs(xx) < 7 ? (Math.random() < .5 ? 0 : 1) : (xx < 0 ? 0 : 1), FAN_STUFE, -xx * .012, 1);
    }
    // beide Seiten (Stirnseiten): innen auf dem Boden, außen auf der Stufe – schauen aufs Feld
    for (const sx of [-1, 1]){
      const team = sx < 0 ? 0 : 1;
      for (let z = -15.4; z <= 13; z += 2.15){ const zz = z + (Math.random() - .5) * .6; neu(sx * (23.9 + (Math.random() - .5) * .5), zz, team, 0, -sx, Math.max(-.35, Math.min(.35, -zz * .025))); }
      for (let z = -14.4; z <= 13; z += 2.15){ const zz = z + (Math.random() - .5) * .6; neu(sx * (26.2 + (Math.random() - .5) * .4), zz, team, FAN_STUFE, -sx, Math.max(-.35, Math.min(.35, -zz * .025))); }
    }
    s.zuschauerHg.sort((a, b) => a.zz - b.zz);
  }
  // Stufen (niedrige Podeste) hinten und an den beiden Seitenwänden
  function halleStufen(g){
    const H = FAN_STUFE, WX = 27, WZ = -18, Z1 = -16.85, VZ1 = 14, X1 = 25.2;
    const flaeche = (pts, farbe) => { g.fillStyle = farbe; vieleck(g, pts); g.fill(); };
    for (const [x0, x1] of [[-WX, -1.6], [1.6, WX]]){
      flaeche([[x0, 0, Z1], [x1, 0, Z1], [x1, H, Z1], [x0, H, Z1]], '#3d4a6c');
      flaeche([[x0, H, WZ], [x1, H, WZ], [x1, H, Z1], [x0, H, Z1]], '#5a6a93');
    }
    for (const sx of [-1, 1]){
      const x = sx * X1;
      flaeche([[x, 0, WZ], [x, 0, VZ1], [x, H, VZ1], [x, H, WZ]], '#3d4a6c');
      flaeche([[x, H, WZ], [sx * WX, H, WZ], [sx * WX, H, VZ1], [x, H, VZ1]], '#5a6a93');
    }
  }
  function fanDetail(){ const p = grafikProfil(); return p === GRAFIK.high || p === GRAFIK.ultra; }   // V10.0: Schals/Mützen/Fahnen nur bei Hoch/Ultra
  function zeichneZuschauer(g, o){
    fanTexturen(o);
    zeichneFigur(g, o);
    const ki = o.kopfInfo; if (!ki) return;
    const hx = ki[0], hy = ki[1], oben = ki[2], kinn = ki[3], sk = ki[4], sw = ki[5], rot = ki[6], kh = kinn - oben;
    if (!(kh > 4)) return;
    const z = o.zeichen, seit = z.ansicht === 's', rueck = z.ansicht === 'r', rg = (z.dx || 0) < 0 ? -1 : 1;
    const kb = kh * .84, KON = 'rgba(28,22,34,.6)', lw = Math.max(1, .022 * sk), tt = performance.now() / 1000;
    g.save(); g.translate(hx, hy); g.rotate(rot || 0); g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = KON;
    // Schal um den Hals (mit herunterhängenden Enden)
    if (o.schal && fanDetail()){
      const c1 = o.schal[0], c2 = o.schal[1], w = seit ? sw * .55 : sw * .66, h = kh * .27, cy = kinn - kh * .03, x0 = -w / 2, n = 6;
      g.save(); g.beginPath(); g.ellipse(0, cy, w / 2, h / 2, 0, 0, Math.PI * 2); g.fillStyle = c1; g.fill(); g.clip();
      g.fillStyle = c2; for (let i = 1; i < n; i += 2) g.fillRect(x0 + w * i / n, cy - h, w / n, h * 2);
      g.restore();
      g.beginPath(); g.ellipse(0, cy, w / 2, h / 2, 0, 0, Math.PI * 2); g.stroke();
      if (!rueck){
        const ex = seit ? -rg * w * .15 : w * .18, ew = Math.max(2, kh * .2), el = kh * .75;
        g.fillStyle = c1; g.fillRect(ex, cy, ew, el); g.fillStyle = c2; g.fillRect(ex, cy + el * .3, ew, el * .15); g.fillRect(ex, cy + el * .62, ew, el * .15); g.strokeRect(ex, cy, ew, el);
      }
    }
    // Kopfbedeckung
    const dk = fanDetail() ? o.deck : null;
    if (dk){
      const y0 = oben + kh * .27, cx = seit ? rg * kb * .03 : 0, rw = kb * .53;
      g.fillStyle = dk.f;
      if (dk.typ === 'hut'){
        g.beginPath(); g.ellipse(cx, y0 + kh * .03, rw * 1.2, kh * .09, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(cx - rw * .72, y0 + kh * .03); g.quadraticCurveTo(cx - rw * .66, y0 - kh * .3, cx, y0 - kh * .3); g.quadraticCurveTo(cx + rw * .66, y0 - kh * .3, cx + rw * .72, y0 + kh * .03); g.closePath(); g.fill(); g.stroke();
      } else {
        g.beginPath(); g.moveTo(cx - rw, y0); g.bezierCurveTo(cx - rw, y0 - kh * .46, cx + rw, y0 - kh * .46, cx + rw, y0); g.closePath(); g.fill(); g.stroke();
        if (dk.typ === 'kappe' && !rueck){
          g.beginPath();
          if (seit){ g.moveTo(cx + rg * rw * .6, y0 - kh * .02); g.lineTo(cx + rg * (rw + kh * .32), y0 + kh * .04); g.lineTo(cx + rg * rw * .55, y0 + kh * .07); g.closePath(); }
          else g.ellipse(cx, y0 + kh * .02, rw * .92, kh * .075, 0, 0, Math.PI);
          g.fill(); g.stroke();
        } else if (dk.typ === 'muetze'){
          g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - rw, y0 - kh * .06, rw * 2, kh * .08); g.strokeRect(cx - rw, y0 - kh * .06, rw * 2, kh * .08);
          g.fillStyle = dk.f; g.beginPath(); g.arc(cx, oben - kh * .09, kh * .075, 0, Math.PI * 2); g.fill(); g.stroke();
        }
      }
    }
    // Fahne an einer Stange
    if (o.fahne && fanDetail()){
      const sd = o.phaseF > 3.14 ? 1 : -1, px = sd * (sw * .5 + kb * .35), y1 = oben - kh * 1.35, y2 = kinn + kh * .9;
      const fw = kh * 1.35, fh = kh * .8, wv = Math.sin(tt * 5 + o.phaseF) * fh * (o.jubel > 0 ? .22 : .1), xa = px, xb = px + sd * fw, xm = (xa + xb) / 2, ym = y1 + fh / 2;
      g.strokeStyle = '#3a2f26'; g.lineWidth = Math.max(1.4, kh * .07); g.beginPath(); g.moveTo(px, y2); g.lineTo(px, y1); g.stroke();
      g.lineWidth = lw; g.strokeStyle = KON;
      g.fillStyle = o.fahne[0]; g.beginPath(); g.moveTo(xa, y1); g.quadraticCurveTo(xm, y1 + wv, xb, y1 + wv * .4); g.lineTo(xb, ym + wv * .6); g.quadraticCurveTo(xm, ym - wv, xa, ym); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.fahne[1]; g.beginPath(); g.moveTo(xa, ym); g.quadraticCurveTo(xm, ym - wv, xb, ym + wv * .6); g.lineTo(xb, y1 + fh + wv * .3); g.quadraticCurveTo(xm, y1 + fh + wv * .8, xa, y1 + fh); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }
  function bankFigurenSchritt(dt){
    if (!s.bankFig) return;
    if (s.halle && !s.zuschauer) halleZuschauerBauen();
    if (s.halle && s.zuschauer){
      const jetzt0 = performance.now() / 1000;
      for (const o of s.zuschauer){
        o.p.set(o.zx, 0, o.zz); o.v.set(0, 0, 0); o.blick.set(o.bx, 0, o.bz);
        const an = s.phase === 'tor' && s.letztTorTeam === o.team0;   // V11.5: nur die Fans des Torschützen-Teams jubeln – jeder etwas versetzt und auf seine Art
        if (an){
          if (!o.jubelAn) o.jubelAn = jetzt0 + o.verz * .7;
          if (!o.jubelStart && jetzt0 >= o.jubelAn){ o.jubelStart = 1; o.jubelArt = o.art; o.jubel = 3.2 - o.verz * .6; }
        } else if (s.phase !== 'tor'){ o.jubelAn = 0; o.jubelStart = 0; o.jubelArt = null; }
        if (fanSichtbar(o)){ fanTexturen(o); animiereFigur(o, dt, 0); }
      }
    }
    const jetzt = performance.now() / 1000, X = TUN_X;
    for (const team of [0, 1]){
      const sx = team === 0 ? -1 : 1;
      s.bankFig[team] = s.bankFig[team].filter(o => s.bank[team].includes(o.idx));
      const liste = s.bankFig[team].concat(s.rausFig[team]);
      liste.forEach((o, i) => {
        // V5.0: Auswechselspieler (mit Leibchen) und Ausgewechselte SITZEN auf der Bank
        const x = s.halle ? sx * (2.4 + i * 1.0) : sx * (X + 1.75 + i * .95), z = s.halle ? -(BANDE_Z + 2.2) : -(HB + 1.45);
        o.p.set(x, 0, z); o.v.set(0, 0, 0); o.blick.set(0, 0, 1);
        animiereFigur(o, dt, 0);
        if (s.halle){ o.zeichen.pose = null; o.zeichen.huefteFest = null; } else { o.zeichen.pose = 'sitzen'; o.zeichen.huefteFest = .32; } o.zeichen.intens = 0;
      });
      const tr = s.trainer && s.trainer[team];
      if (tr && tr.fig && s.presse && s.presse.team === team) presseTrainer(tr, dt);
      else if (tr && tr.fig){
        const o = tr.fig, spricht = tr.blase && tr.blase.t < tr.blase.dauer;
        const ph = jetzt * .35 + team * 2, x = sx * (X + 6.8) + Math.sin(ph) * 1.1, vx = Math.cos(ph) * 1.1 * .35;
        o.p.set(x, 0, -(s.halle ? BANDE_Z + 2.2 : HB + .55)); o.v.set(spricht ? 0 : vx, 0, 0);
        if (!spricht && Math.abs(vx) > .2) o.blick.set(Math.sign(vx), 0, .3); else o.blick.set(0, 0, 1);
        o.jubel = s.phase === 'tor' && s.letztTorTeam === team ? 1 : 0;
        animiereFigur(o, dt, 0);
        tr.x = o.p.x; tr.z = o.p.z;
        const k = P(o.p.x, 2.05, o.p.z); tr.kopf = { x: k.x, y: k.y, s: k.s };
      }
    }
  }
  window.__trainerHook = (typ, name) => { try { trainerEreignis(typ, name); } catch (e) {} try { window.__nachspielEreignis(typ); } catch (e) {} };
  function pause(an, erzwingen){
    if (!laeuft || s.phase === 'ende') return;
    if (an && !erzwingen && (s.gast || (s.optionen && (s.optionen.gast || s.optionen.fern || s.optionen.modus)))) return;   // V6.1: online gibt es keine Pause
    pausiert = an; $s('pauseUeber').hidden = !an;
    try { wechselKnoepfe(); if (!an){ const wu = document.getElementById('wechselUeber'); if (wu) wu.hidden = true; } } catch (e) {}
    $s('pauseInfo').textContent = (KUERZEL[s.land[0]] || '') + ' ' + s.tore[0] + ' – ' + s.tore[1] + ' ' + (KUERZEL[s.gegner[0]] || '') + ' · ' + $s('minute').textContent;
    musik.sfx && musik.sfx.stadion(!an, s.regen);
  }
  function ende(elfWinner){
    try { if (ausklangStart(elfWinner)) return; } catch (e) { schleifeFehler(e); s && (s.ausklang = null, s.ausklangFertig = true); ausklangKnopf(false); }   // V6.2: erst die Szene nach dem Abpfiff
    try { endeKern(elfWinner); }
    catch (e) { schleifeFehler(e); try { $s('endeUeber').hidden = false; } catch(x){typeof __scWarn==='function'&&__scWarn(x)} }
    // V3.16: Stadion-Geräusche (Gemurmel, Gesänge) nach dem Abpfiff beenden, sonst laufen sie im Hintergrund weiter
    try {
      const sRef = s;
      setTimeout(() => { try { if (s === sRef && s && s.phase === 'ende') musik.sfx && musik.sfx.stadion(false); } catch(x){typeof __scWarn==='function'&&__scWarn(x)} }, 4000);
    } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  function endeKern(elfWinner){
    // Idempotent: Netzwerk/Elfmeterschießen dürfen das Spielende nur einmal auslösen.
    if (!s || s.phase === 'ende') return;
    s.phase = 'ende'; laeuft = false; pausiert = false; window.__trainingSig = null;   // V7.7: Spiel zu Ende -> nächstes Spiel wieder 3 Punkte
   
    // V6.2: Online – den Mitspielern das Spielende sofort (und zur Sicherheit noch zweimal) schicken.
    // Früher kam es nur mit dem Abpfiff-Satz mit; der wird jetzt schon zu Beginn der Szene nach dem Abpfiff gesagt.
    if (s.fern){ const sRef = s, schick = () => { try { if (s === sRef && s.phase === 'ende'){ sendeT = 0; sendeZustand(); } } catch(e){typeof __scWarn==='function'&&__scWarn(e)} };
      schick(); setTimeout(schick, 400); setTimeout(schick, 1500); }
    try { if (!s.gast) SPIELE.plus(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V3.16
    try { if (!s.gast) VERLETZT.nachSpiel(s.neuVerletzt || {}); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V3.0
    s.belohnung = null;
    try {   // V4.1: Trainingspunkte (Sieg 5 / Unentschieden 3 / Niederlage 1) und Crows (nur Liga und Pokal)
      if (!s.gast && s.optionen && Array.isArray(s.optionen.squad) && !s.optionen.nationTeam){   // V4.6: Nation gegen Nation ohne Training
        const ichT = s.lokalTeam || 0, wT = s.tore[ichT], dT = s.tore[1 - ichT];
        const erg = typeof elfWinner === 'number' ? (elfWinner === ichT ? 'S' : 'N') : (wT > dT ? 'S' : wT < dT ? 'N' : 'U');
        let mvpMein = false; try { if (s.optionen.turnier){ const al = s.spieler.map(p => ({ p, n: bewerten(p), st: pst(p) })); const mv = al.slice().sort((a, b) => b.n - a.n || (s.tore[b.p.team] - s.tore[1 - b.p.team]) - (s.tore[a.p.team] - s.tore[1 - a.p.team]) || b.st.tore - a.st.tore)[0]; mvpMein = !!mv && mv.p.team === ichT; } } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V11.6: MVP-Bonus
        s.belohnung = STAND.nachSpiel({ squad: s.optionen.squad, ersatz: s.optionen.ersatz || [], erg, tore: wT, wertung: !!s.optionen.turnier, stufe: s.stufe, mvp: mvpMein });
      }
    } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    spielTimerStop();
    if (s.elfmeter && typeof elfWinner === 'number') s.elfmeterSieger = elfWinner;
    if (!s.abpfiffGesagt){   // V6.2: bei der Szene nach dem Abpfiff schon gesagt/gepfiffen
      (typeof KOMMENTAR !== 'undefined') && !s.gast && KOMMENTAR.ereignis(s.tore[0] !== s.tore[1] ? 'abpfiff_sieg' : 'abpfiff', null, true);
      musik.sfx && musik.sfx.pfiff(3);
    }
    const [a, b] = s.tore;
    $s('endeStand').innerHTML = flaggeHTML(s.land[0]) + ' ' + a + ' – ' + b + ' ' + flaggeHTML(s.gegner[0]);
    const ich = s.lokalTeam || 0, wir = s.tore[ich], die = s.tore[1 - ich];
    const entschiedenDurchElf = typeof s.elfmeterSieger === 'number';
    const gewonnen = entschiedenDurchElf ? s.elfmeterSieger === ich : wir > die;
    $s('endeText').textContent = entschiedenDurchElf ? (gewonnen ? 'Sieg nach Verlängerung und Elfmeterschießen! 🏆' : 'Niederlage nach Verlängerung und Elfmeterschießen.') : (wir > die ? 'Sieg! Stark gespielt.' : wir < die ? 'Niederlage. Revanche?' : 'Unentschieden.');
    try {   // V4.1: Belohnung anzeigen
      const bl = s.belohnung; if (bl){ const tx = [bl.serieBonus ? '🔥 ' + bl.serie + ' SIEGE IN FOLGE: +' + bl.serieBonus.toLocaleString('de-DE') + ' Crows!' : (bl.serie >= 2 ? '🔥 Serie: ' + bl.serie + ' Siege in Folge (bei ' + (Math.ceil(bl.serie / SERIE_LAENGE) * SERIE_LAENGE) + ': +' + (bl.serieNext || SERIE_BONUS).toLocaleString('de-DE') + ')' : ''), bl.cr ? '💰 +' + bl.cr + ' Crows' : '', bl.mvpBonus ? '👑 MVP: +' + bl.mvpBonus + ' Crows' : '', bl.marktNeu ? '📩 ' + bl.marktNeu + (bl.marktNeu > 1 ? ' neue Transferangebote' : ' neues Transferangebot') + ' – schau in die Kaderliste' : '', bl.star ? '🏋 Vor dem nächsten Spiel: 3 Trainingspunkte für ' + bl.star : '🏋 +' + bl.tp + ' Trainingspunkte'].filter(Boolean).join('  ·  ');
        $s('endeText').textContent += '\n' + tx; $s('endeText').style.whiteSpace = 'pre-line';
        if (bl.serieBonus) setTimeout(() => { try { window.scSerienGlueckwunsch && window.scSerienGlueckwunsch(bl.serie, bl.serieBonus); } catch (e) {} }, 900); }   // V3.03
    } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    const imTurnier = !!(s.optionen && s.optionen.turnier) && !s.gast;
    if (s.optionen && s.optionen.htSpiel && !s.gast && window.__htErgebnis){ try { window.__htErgebnis({ id: s.optionen.htSpiel, tore: s.tore.slice(), elf: typeof s.elfmeterSieger === 'number' ? s.elfmeterSieger : null }); } catch (e) { console.error(e); } }   // HALLENTURNIER: Ergebnis eintragen
    $s('nochmal').hidden = !!s.gast || imTurnier || !!(s.optionen && s.optionen.htSpiel); $s('turnierWeiter').hidden = !imTurnier; $s('zumMenue').hidden = imTurnier; $s('zumMenue').textContent = (s.optionen && s.optionen.htSpiel && !s.gast) ? '📋 ZUR TABELLE' : 'ZUM MENÜ';
    graceAlle();
    { const rb = $s('revanche'), nb = $s('nochmal');   // V4.5 Revanche
      if (rb){ rb.hidden = !(s.gast && NETZ.onlineModus === 'freund' && NETZ.teamVon(NETZ.gid) === 1); rb.disabled = false; rb.textContent = '🔁 REVANCHE ANFRAGEN'; }
      if (nb) nb.textContent = (!imTurnier && !s.gast && s.fern && s.optionen && s.optionen.gegnerIdx) ? '🔁 REVANCHE' : 'NOCHMAL'; }
    try { bewertungZeigen(); } catch (e) { $s('bewertung').hidden = true; $s('endeBox').classList.remove('mitBew'); }
    s.endeTimer = spielTimer(() => { if (s && s.phase === 'ende') $s('endeUeber').hidden = false; }, 900);
    try {   // V11.4: Skill-Fenster (3 Trainingspunkte verteilen) immer nach dem Spiel
      const op = s.optionen, st = op && Array.isArray(op.squad) ? op.squad[0] : -1;
      if (!s.gast && st >= 0 && !(op.fernAnzahl > 0) && !op.nationTeam && window.MATCH_SKILLS && STAND.trainierbar(st)){
        STAND.punkteSetzen(st, 3);
        spielTimer(() => { try { if (s && s.phase === 'ende') window.MATCH_SKILLS.zeigen(op, () => {}); } catch (e) {} }, 1200);
      }
    } catch (e) {}
    // Im Online-Turnier erst das Ergebnis übernehmen und den Turnierbaum zeigen.
    // Die nächste Partie wird danach automatisch vom Gastgeber gestartet.
    if (imTurnier && NETZ.rolle === 'host' && NETZ.partner) {
      spielTimer(() => { if (s && s.phase === 'ende' && !$s('endeUeber').hidden) $s('turnierWeiter').click(); }, 2100);
    }
    if (gewonnen) musik.sfx && musik.sfx.jubel(true);
  }
  // ---------- Spielerbewertungen (wie bei Sofascore) und MVP ----------
  function bewerten(p){
    const st = pst(p), t = p.team, wir = s.tore[t], die = s.tore[1 - t];
    let n = 6.3 + st.tore * 1.0 + st.vorlagen * .6 + st.aufsTor * .15 - Math.max(0, st.schuesse - st.aufsTor) * .05
          + st.passOk * .05 - Math.max(0, st.paesse - st.passOk) * .08 + st.ballGew * .12
          - st.fouls * .1 - st.gelb * .3 - st.rot * 1.2 + (wir > die ? .3 : wir < die ? -.25 : 0);
    if (p.rolle === 'TW') n += st.paraden * .3 - st.gegentore * .3 + (die === 0 ? .5 : 0);
    return Math.round(klemme(n, 3, 10) * 10) / 10;
  }
  const noteFarbe = n => n >= 9 ? '#3a4ff5' : n >= 8 ? '#1f8fe0' : n >= 7 ? '#2fb344' : n >= 6 ? '#f08c00' : '#e5484d';
  function bewertungZeigen(){
    const el = $s('bewertung'), box = $s('endeBox');
    if (s.gast){ el.hidden = true; box.classList.remove('mitBew'); return; }
    const alle = s.spieler.map(p => ({ p, n: bewerten(p), st: pst(p) }));
    const mvp = alle.slice().sort((a, b) => b.n - a.n || (s.tore[b.p.team] - s.tore[1 - b.p.team]) - (s.tore[a.p.team] - s.tore[1 - a.p.team]) || b.st.tore - a.st.tore)[0];
    const bild = p => (typeof BILDER !== 'undefined' && p.daten && BILDER[p.daten.bild]) ? '<img src="' + BILDER[p.daten.bild] + '" alt="">' : '';
    const chips = st => [st.tore ? '<i>⚽ ' + st.tore + '</i>' : '', st.vorlagen ? '<i>👟 ' + st.vorlagen + '</i>' : '', st.paraden ? '<i>🧤 ' + st.paraden + '</i>' : '',
      st.ballGew ? '<i>🛡️ ' + st.ballGew + '</i>' : '', st.gelb ? '<i>🟨</i>' : '', st.rot ? '<i>🟥</i>' : ''].join('');
    const zeile = x => '<div class="bz' + (x === mvp ? ' mvp' : '') + '">' + bild(x.p) + '<span class="bn"><b>' + x.p.name + '</b>' + (x.p === s.du ? '<em>DU</em>' : '')
      + '<small>#' + (x.p.nummer || '') + (x.p.rolle === 'TW' ? ' · TW' : '') + '</small></span><span class="bc">' + chips(x.st) + '</span>'
      + '<span class="note" style="background:' + noteFarbe(x.n) + '">' + x.n.toFixed(1) + '</span></div>';
    const team = t => '<div class="bt"><div class="bk">' + flaggeHTML((t ? s.gegner : s.land)[0]) + ' ' + (KUERZEL[(t ? s.gegner : s.land)[0]] || '') + '</div>'
      + alle.filter(x => x.p.team === t).sort((a, b) => b.n - a.n).map(zeile).join('') + '</div>';
    const m = mvp.st, pz = m.paesse ? Math.round(m.passOk / m.paesse * 100) + ' %' : '–';
    el.innerHTML = '<div class="mvpkarte"><div class="krone">👑 MVP</div>' + bild(mvp.p) + '<b>' + mvp.p.name + '</b>'
      + '<span class="note gross" style="background:' + noteFarbe(mvp.n) + '">' + mvp.n.toFixed(1) + '</span>'
      + '<div class="mz">' + (mvp.p.rolle === 'TW' ? '<span>Paraden<b>' + m.paraden + '</b></span><span>Gegentore<b>' + m.gegentore + '</b></span>'
          : '<span>Tore<b>' + m.tore + '</b></span><span>Vorlagen<b>' + m.vorlagen + '</b></span><span>Schüsse<b>' + m.schuesse + '</b></span>')
      + '<span>Pässe<b>' + pz + '</b></span></div></div>' + team(0) + team(1);
    el.hidden = false; box.classList.add('mitBew');
  }
  function beenden(insMenue = true){
    graceAlle();
    (typeof KOMMENTAR !== 'undefined') && KOMMENTAR.stopp();
    if (s && s.fern){ try { NETZ.setup(null); } catch (e) { console.warn('SILESCROW Netzwerk-Cleanup:', e); } s.fern = false; }
    spielTimerStop();
    if (s) { clearTimeout(s.elfTimer); clearTimeout(s.hzUhr); s.elfTimer = 0; s.hzUhr = 0; }
    if (meldungT){ clearTimeout(meldungT); meldungT = 0; }
    if (hinweisT){ clearTimeout(hinweisT); hinweisT = 0; }
    laeuft = false; pausiert = false;
    $s('elfmeterUeber').hidden = true; $s('hzUeber').hidden = true; { const eb = $s('elfBar'); if (eb) eb.hidden = true; }
    cancelAnimationFrame(rafId); rafId = 0;
    $s('spiel').hidden = true; $s('pauseUeber').hidden = true; $s('endeUeber').hidden = true;
    musik.sfx && musik.sfx.stadion(false);
    if (insMenue) musik.spiele('menue');
    if (insMenue) try { ligaStufeInsMenue(); } catch (e) {}   // V4.6
  }

  return { grafikSetzen: m => grafikSetzen(m), get grafikModus(){ return grafik.modus; }, get grafikStufe(){ return fps.stufe; }, get rechenzeit(){ return fps.letzteArbeit || 0; }, get fans(){ return welt.fans; }, testElf: () => elfmeterschiessenStart(), testWechsel: team => { const raus = teamSp(team).find(p => p.rolle !== 'TW' && p !== s.steuer); return !!(raus && s.bank[team].length && wechselAusfuehren(team, raus, s.bank[team][0])); }, testStandard: (t, team, x, z) => standard(t, team, V(x, 0, z)), testFoul: (t, o) => foul(t, o, true), stadionTest: () => { const f = stadionFans(); return f ? [f.haupt.heim[3].bilder[0].toDataURL(), f.haupt.heim[3].bilder[1].toDataURL()] : null; }, set testPhase(p){ if (s) s.phase = p; }, get ball(){ return welt.ball; }, bildschirm: q => aufBildschirm(q), hinweis: (t, d) => zeigeHinweis(t, d), starte, beenden, starteGast, gastEmpfang, fernEingabe, fernWeg, fernZurueck, get laeuft(){ return laeuft; }, get gast(){ return !!(s && s.gast); }, get zustand(){ return s; }, set tempo(f){ tempoFaktor = f; }, set autopilot(a){ autopilot = a; } };
})();

