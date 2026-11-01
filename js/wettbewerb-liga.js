/* Silescrow Cup V 4.2 – js/wettbewerb-liga.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */


// =====================================================================
// LIGA (V3.50): 16 Teams, jeder gegen jeden (V6.5: Hin- und Rückrunde, 30 Spieltage). V6.4: auch online zu zweit (oder mehr) in einem Team.
// Tabelle, Torjaeger, Vorlagen, Torschuetzenkoenig. Spielstand wird automatisch gespeichert.
// =====================================================================
const LIGA = (() => {
  const KEY = 'sc_liga_v1', ANZ = 16; let TAGE = 30;   // V6.5: Hin- und Rückrunde = 30 Spieltage (alte gespeicherte Ligen mit 15 Spieltagen laufen weiter)
  const tagName = n => n <= 15 ? 'SPIELTAG ' + n : 'RÜCKRUNDE · SPIELTAG ' + (n - 15);
  const $l = id => document.getElementById(id);
  const DB = i => PLAYER_DATABASE[i];
  // V10.1: Mit MEIN SUPERTEAM steht vor deinem Team (S), z. B. (S) TÜR ★
  const kurz = l => { const o = (typeof L !== 'undefined' && L && L.opt && L.opt.superteam && L.opt.land) ? (Array.isArray(L.opt.land) ? L.opt.land[0] : L.opt.land) : null; return (o && l && l[0] === o ? '(S) ' : '') + TURNIER.kurz(l); };
  let L = null, ansicht = 'tabelle', zeigTag = 0;
  const mischen = a => { for (let i = a.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const lIdx = l => l ? COUNTRY_DATABASE.findIndex(x => x[0] === l[0]) : -1;
  const lVon = i => (i != null && i >= 0) ? (COUNTRY_DATABASE[i] || null) : null;
  let istGast = false;   // V6.4: Mitspieler sehen nur die Tabelle des Gastgebers
  function ligaExport(){ return { ...L, vorab: null, opt: { ...L.opt, land: lIdx(L.opt.land) }, teams: L.teams.map(lIdx) }; }
  function speichern(){
    try { LS81.setItem(KEY, JSON.stringify(L)); } catch (e){ typeof __scWarn === 'function' && __scWarn(e); }
    try { if (!istGast && typeof NETZ !== 'undefined' && NETZ.rolle === 'host' && NETZ.partner) NETZ.ligaState(ligaExport()); } catch (e){ typeof __scWarn === 'function' && __scWarn(e); }   // V6.4
  }
  function laden(){
    try { const r = LS81.getItem(KEY); if (!r) return null; const x = JSON.parse(r); return x && x.v === 1 && x.kader && x.plan && x.res ? x : null; }
    catch (e){ return null; }
  }
  function skalieren(){ const k = Math.min(innerWidth / 1120, innerHeight / 600); $l('lgFlaeche').style.transform = 'translate(-50%,-50%) scale(' + k + ')'; }
  addEventListener('resize', () => { if (!$l('liga').hidden) skalieren(); });

  // Spielplan: Kreismethode, jeder gegen jeden
  function spielplan(){
    let list = mischen([...Array(ANZ).keys()]);
    const plan = [];
    for (let r = 0; r < ANZ - 1; r++){
      const tag = [];
      for (let i = 0; i < ANZ / 2; i++){ let a = list[i], b = list[ANZ - 1 - i]; if ((r + i) % 2) [a, b] = [b, a]; tag.push([a, b]); }
      plan.push(tag);
      list = [list[0], list[ANZ - 1], ...list.slice(1, ANZ - 1)];
    }
    plan.push(...plan.map(tag => tag.map(([a, b]) => [b, a])));   // V6.5: Rückrunde = gleiche Paarungen, Heimrecht getauscht
    return plan;
  }
  // V5.0: die 31 anderen Nationen ausgeglichen nach Sternen auf zwei Ligen verteilen (Schlangen-Verfahren)
  function ligenAufteilen(eigen){
    const rest = mischen(COUNTRY_DATABASE.filter(l => l[0] !== eigen[0])).sort((x, y) => (LAND_STUFE[y[0]] || 1) - (LAND_STUFE[x[0]] || 1));
    const A = [], B = [], kapA = ANZ - 1, kapB = ANZ;
    const sum = t => t.reduce((s, l) => s + (LAND_STUFE[l[0]] || 1), 0) + (t === A ? 3 : 0);   // dein Superteam zählt wie eine 3-Sterne-Nation
    rest.forEach(l => { if (A.length >= kapA) B.push(l); else if (B.length >= kapB) A.push(l); else { const d = sum(A) - sum(B); (d < 0 || (d === 0 && Math.random() < .5) || (Math.abs(d) <= 2 && Math.random() < .3) ? A : B).push(l); } });   // V5.0: jede neue Liga anders, aber ausgeglichen
    return [...mischen(A), ...mischen(B)];
  }
  function neu(opt){
    window.__radGedreht = false;
    const andere = ligenAufteilen(opt.land);
    const rest = PLAYER_DATABASE.map((p, i) => i).filter(i => !opt.squad.includes(i));
    const kader = [opt.squad.slice()]; for (let k = 1; k < ANZ; k++) kader.push([]);
    const tws = rest.filter(i => DB(i).role === 'TW').sort((a, b) => DB(b).rating - DB(a).rating);
    const reihe = mischen([...Array(ANZ - 1)].map((_, k) => k + 1));
    tws.slice(0, ANZ - 1).forEach((i, n) => kader[reihe[n]].push(i));
    const feld = rest.filter(i => !kader.some(k => k.includes(i)));
    window.kiKaderStufenVerteilen(kader, feld, reihe);
    try { for (let k = 1; k < ANZ; k++){ const nk = window.nationKader(andere[k - 1], opt); if (nk && nk.elf.length === TEAM_GROESSE) kader[k] = nk.elf.slice(); } } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V6.0
    const nr = { ...(opt.nummern || {}) };
    kader.slice(1).forEach(k => {
      const belegt = new Set();
      k.slice().sort((a, b) => ((DB(b).role === 'TW') - (DB(a).role === 'TW'))).forEach((i, n) => {
        const vor = n === 0 ? [1] : ({ DF: [4, 5, 3, 2, 15], MF: [8, 6, 10, 7, 14], ST: [9, 11, 7, 10, 19] }[DB(i).role] || [13]);
        const x = vor.find(v => !belegt.has(v)) || [...Array(99)].map((_, v) => v + 1).find(v => !belegt.has(v)); belegt.add(x); nr[i] = x; });
    });
    const plan = spielplan(); TAGE = plan.length;
    L = { v: 1, opt, teams: [opt.land, ...andere.slice(0, ANZ - 1)], kader, nr, plan, res: plan.map(tg => tg.map(() => null)), tag: 0, stat: {} };
    L.z = zNeu(andere.slice(ANZ - 1));   // V5.0: SILESCROW LEAGUE 2 (wird simuliert)
    istGast = false; speichern(); ansicht = 'tabelle'; zeigTag = 0; oeffnen();
  }
  function fortsetzen(){
    const x = laden(); if (!x) return false;
    istGast = false;
    // V6.4: eine online gespielte Liga offline weiterspielen = ohne Mitspieler
    if (x.opt && x.opt.modus){ x.opt = { ...x.opt, modus: null, fernAnzahl: 0, plaetze: {}, gegnerPlaetze: {}, menschTorwart: x.opt.menschTorwart && !x.opt.fernAnzahl ? x.opt.menschTorwart : false }; }
    L = x; TAGE = L.plan.length; ansicht = 'tabelle'; zeigTag = Math.min(L.tag, TAGE - 1); oeffnen(); return true;
  }
  // V6.4: gespeicherte Online-Liga fortsetzen (Gastgeber + Mitspieler im selben Team). Gibt true oder einen Fehlertext zurück.
  function fortsetzenOnline(opt){
    const x = laden(); if (!x) return 'Keine gespeicherte Liga gefunden.';
    if (!x.opt || x.opt.modus !== 'zusammen') return 'Die gespeicherte Liga wurde offline gespielt.';
    // V5.8: Team darf sich geändert haben (z. B. neue Pack-Spieler) – es wird einfach übernommen
    istGast = false; L = x; TAGE = L.plan.length;
    L.kader[0] = opt.squad.slice();
    L.opt = { ...L.opt, squad: opt.squad.slice(), torwart: opt.torwart, menschTorwart: opt.menschTorwart, modus: opt.modus, fernAnzahl: opt.fernAnzahl, plaetze: opt.plaetze, gegnerPlaetze: opt.gegnerPlaetze, nummern: opt.nummern, posi: opt.posi, formation: opt.formation, formSlot: opt.formSlot };
    ansicht = 'tabelle'; zeigTag = Math.min(L.tag, TAGE - 1); speichern(); oeffnen(); return true;
  }
  // V6.4: Mitspieler übernimmt den veröffentlichten Ligastand (nur Anzeige, nichts wird gespeichert)
  function syncOnline(o){
    try {
      if (!o || o.v !== 1 || !Array.isArray(o.teams) || !o.kader || !o.plan || !o.res) return false;
      const teams = o.teams.map(lVon); if (teams.some(x => !x)) return false;
      istGast = true; L = { ...o, teams, opt: { ...o.opt, land: teams[0] } }; TAGE = L.plan.length;
      ansicht = 'tabelle'; zeigTag = Math.min(L.tag, TAGE - 1); oeffnen(); return true;
    } catch (e){ typeof __scWarn === 'function' && __scWarn(e); return false; }
  }

  // ---- Berechnung
  const staerke = k => { const a = L.kader[k]; return a.reduce((s, i) => s + DB(i).rating, 0) / Math.max(1, a.length) + (k === 0 ? 0 : landBonus(L.teams[k], L.seed || (L.seed = (Math.random() * 1e9) | 0))); };   // V8.0: Länderbonus wie im echten Spiel
  function poisson(l){ const e = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > e && k < 12); return k - 1; }
  function simulieren(a, b){
    const d = (staerke(a) - staerke(b)) / 45;
    return [Math.min(7, poisson(1.35 * Math.exp(d))), Math.min(7, poisson(1.35 * Math.exp(-d)))];
  }
  // ===== V5.0: SILESCROW LEAGUE 2 (simuliert) =====
  function zNeu(teams){
    const kader = teams.map(l => { let k = null; try { k = window.nationKader(l, L ? L.opt : null); } catch (e) {} return k && k.elf.length ? k.elf.slice() : []; });
    const plan = spielplan();
    return { teams, kader, plan, res: plan.map(tg => tg.map(() => null)) };
  }
  const zStaerke = k => { const a = L.z.kader[k] || []; return a.reduce((s, i) => s + DB(i).rating, 0) / Math.max(1, a.length) + landBonus(L.z.teams[k], L.seed || (L.seed = (Math.random() * 1e9) | 0)); };
  function zSimTag(ti){ L.z.res[ti] = L.z.plan[ti].map(([a, b]) => { const d = (zStaerke(a) - zStaerke(b)) / 45; return [Math.min(7, poisson(1.35 * Math.exp(d))), Math.min(7, poisson(1.35 * Math.exp(-d)))]; }); }
  function zSicher(){   // ältere Ligen: zweite Liga nachträglich anlegen und bis zum aktuellen Spieltag nachholen
    if (!L) return;
    if (!L.z || !Array.isArray(L.z.teams) || L.z.teams.length !== ANZ){
      const drin = new Set(L.teams.map(l => l[0]));
      let frei = mischen(COUNTRY_DATABASE.filter(l => !drin.has(l[0])));
      L.z = zNeu(frei.slice(0, ANZ));
    }
    for (let ti = 0; ti < Math.min(L.tag, L.z.plan.length); ti++) if (!L.z.res[ti] || !L.z.res[ti][0]) zSimTag(ti);
  }
  function zTabelle(){
    const T = [...Array(ANZ)].map((_, k) => ({ k, sp: 0, s: 0, u: 0, n: 0, tf: 0, ta: 0, pkt: 0 }));
    L.z.plan.forEach((tag, ti) => tag.forEach(([a, b], mi) => {
      const r = L.z.res[ti] && L.z.res[ti][mi]; if (!r) return;
      const A = T[a], B = T[b]; A.sp++; B.sp++; A.tf += r[0]; A.ta += r[1]; B.tf += r[1]; B.ta += r[0];
      if (r[0] > r[1]){ A.s++; B.n++; A.pkt += 3; } else if (r[0] < r[1]){ B.s++; A.n++; B.pkt += 3; } else { A.u++; B.u++; A.pkt++; B.pkt++; }
    }));
    return T.sort((x, y) => y.pkt - x.pkt || (y.tf - y.ta) - (x.tf - x.ta) || y.tf - x.tf || x.k - y.k);
  }
  // ===== V5.0: SILESCROW CHAMPIONS CUP – Top 4 beider Ligen, Auslosung, VF / HF / Finale =====
  const CC_RUNDEN = ['VIERTELFINALE', 'HALBFINALE', 'FINALE'];
  const ccLand = r => r.l === 'a' ? L.teams[r.k] : L.z.teams[r.k];
  const ccKader = r => r.l === 'a' ? L.kader[r.k] : L.z.kader[r.k];
  const ccStaerke = r => r.l === 'a' ? staerke(r.k) : zStaerke(r.k);
  const ccIch = r => r && r.l === 'a' && r.k === 0;
  function ccNeu(){
    zSicher();
    const A = tabelle().slice(0, 4).map((x, n) => ({ l: 'a', k: x.k, platz: n + 1 })), B = mischen(zTabelle().slice(0, 4).map((x, n) => ({ l: 'b', k: x.k, platz: n + 1 })));
    const paare = mischen(A.map((a, n) => [a, B[n]]));   // Auslosung: jedes Top-4-Team deiner League bekommt einen Gegner aus League 2
    L.cc = { runden: [paare.map(p => ({ a: p[0], b: p[1], r: null }))], runde: 0, sieger: null, gezeigt: false };
    speichern();
  }
  function ccSim(p){
    const d = (ccStaerke(p.a) - ccStaerke(p.b)) / 45;
    let t = [Math.min(7, poisson(1.35 * Math.exp(d))), Math.min(7, poisson(1.35 * Math.exp(-d)))], ne = false;
    if (t[0] === t[1]){ ne = Math.random() < .5 + Math.max(-.2, Math.min(.2, d * .5)) ? 'a' : 'b'; }
    p.r = { t, ne, s: t[0] > t[1] ? 'a' : t[0] < t[1] ? 'b' : ne };
  }
  function ccMein(){ if (!L.cc || L.cc.sieger) return null; const R = L.cc.runden[L.cc.runde]; return R && R.find(p => !p.r && (ccIch(p.a) || ccIch(p.b))) || null; }
  function ccWeiter(){   // Runde abschließen und nächste auslosen
    const R = L.cc.runden[L.cc.runde];
    R.forEach(p => { if (!p.r) ccSim(p); });
    const w = R.map(p => p.r.s === 'a' ? p.a : p.b);
    if (w.length === 1){ L.cc.sieger = w[0];
      if (ccIch(w[0]) && !L.cc.belohnt){ L.cc.belohnt = true; try { const ccn = L.opt.stufe === 'leicht' ? 6000 : L.opt.stufe === 'stark' ? 11000 : 9000; STAND.creditsPlus(ccn); setTimeout(() => { try { toast('🏆 CHAMPIONS-CUP-SIEGER: +' + ccn.toLocaleString('de-DE') + ' Crows!'); } catch (e) {} }, 900); } catch (e) {} }
    } else { L.cc.runden.push([...Array(w.length / 2)].map((_, n) => ({ a: w[2 * n], b: w[2 * n + 1], r: null }))); L.cc.runde++; }
    speichern();
  }
  function ccSpielen(){
    const p = ccMein(); if (!p) return;
    const ichA = ccIch(p.a), g = ichA ? p.b : p.a, gk = ccKader(g).slice(), o = L.opt, w = wetterAuslosen(jahreszeitLiga(TAGE - 1, TAGE));
    const gTw = gk.slice().sort((x, y) => ((DB(y).role === 'TW') - (DB(x).role === 'TW')) || (DB(x).rating - DB(y).rating))[0];
    const gegnerIdx = [gTw, ...gk.filter(i => i !== gTw)];
    $l('liga').hidden = true;
    SPIEL.starte({ ...o, squad: o.squad.slice(), nummern: Object.fromEntries(o.squad.map(i => [i, L.nr[i]])), gegnerNummern: Object.fromEntries(gegnerIdx.map(i => [i, L.nr[i]])),
      heim: true, gegnerLand: ccLand(g), gegnerBonus: landBonus(ccLand(g), L.seed || 1), gegnerIdx, twG: 0, turnier: 'CHAMPIONS CUP · ' + CC_RUNDEN[L.cc.runde], ligaCC: true,
      wetter: w.wetter, nacht: true, anstoss: w.anstoss, jz: w.jz, temp: w.temp, konferenz: [] });
  }
  function ccNachSpiel(tore, elfSieger){
    if (!L || !L.cc) return;
    const p = ccMein(); if (p){
      const ichA = ccIch(p.a), [wir, die] = tore, sieg = wir > die || (wir === die && elfSieger === 0);
      const t = ichA ? [wir, die] : [die, wir];
      p.r = { t, ne: wir === die ? (sieg === ichA ? 'a' : 'b') : false, s: sieg === ichA ? 'a' : 'b' };
      ccWeiter();
    }
    ansicht = 'cc'; oeffnen();
  }
  function stat(k, i){ const key = k + ':' + i; return L.stat[key] || (L.stat[key] = { k, i, t: 0, v: 0 }); }
  function waehle(k, gew, ausser){
    const liste = L.kader[k].filter(i => i !== ausser); if (!liste.length) return null;
    const w = liste.map(i => gew(DB(i))), sum = w.reduce((s, x) => s + x, 0); let r = Math.random() * sum;
    for (let n = 0; n < liste.length; n++){ r -= w[n]; if (r <= 0) return liste[n]; }
    return liste[liste.length - 1];
  }
  function toreVerteilen(k, n){
    for (let g = 0; g < n; g++){
      const s = waehle(k, p => ({ ST: 5, MF: 3, DF: 1.3, TW: .04 }[p.role] || 2) * Math.pow(p.rating / 70, 2));
      if (s == null) continue; stat(k, s).t++;
      if (Math.random() < .65){ const v = waehle(k, p => ({ MF: 4, ST: 3, DF: 2, TW: .2 }[p.role] || 2), s); if (v != null) stat(k, v).v++; }
    }
  }
  function tabelle(){
    const T = [...Array(ANZ)].map((_, k) => ({ k, sp: 0, s: 0, u: 0, n: 0, tf: 0, ta: 0, pkt: 0 }));
    L.plan.forEach((tag, ti) => tag.forEach(([a, b], mi) => {
      const r = L.res[ti][mi]; if (!r) return;
      const A = T[a], B = T[b]; A.sp++; B.sp++; A.tf += r[0]; A.ta += r[1]; B.tf += r[1]; B.ta += r[0];
      if (r[0] > r[1]){ A.s++; B.n++; A.pkt += 3; } else if (r[0] < r[1]){ B.s++; A.n++; B.pkt += 3; } else { A.u++; B.u++; A.pkt++; B.pkt++; }
    }));
    return T.sort((x, y) => y.pkt - x.pkt || (y.tf - y.ta) - (x.tf - x.ta) || y.tf - x.tf || x.k - y.k);
  }
  const meinSpiel = ti => { const tag = L.plan[ti], mi = tag.findIndex(([a, b]) => a === 0 || b === 0); return { mi, a: tag[mi][0], b: tag[mi][1], gegner: tag[mi][0] === 0 ? tag[mi][1] : tag[mi][0] }; };

  // ---- Spiel starten / auswerten
  function spielen(){
    const ms = meinSpiel(L.tag), k = ms.gegner, o = L.opt, w = wetterAuslosen(jahreszeitLiga(L.tag, TAGE));
    const g = L.kader[k];
    const gTw = g.slice().sort((x, y) => ((DB(y).role === 'TW') - (DB(x).role === 'TW')) || (DB(x).rating - DB(y).rating))[0];
    const gegnerIdx = [gTw, ...g.filter(i => i !== gTw)];
    $l('liga').hidden = true;
    // V3.56: Gesperrte Spieler (rote Karte im letzten Spiel) fehlen; Ersatz = bester freier normaler Spieler, sonst spielst du mit weniger
    const sperr = (L.gesperrt || []).filter(i => o.squad.includes(i));
    const posiL = { ...(o.posi || {}) }, nrL = Object.fromEntries(o.squad.map(i => [i, L.nr[i]]));
    let sq = o.squad.slice();
    if (sperr.length){
      const belegt = new Set(L.kader.flat());
      const pool = PLAYER_DATABASE.map((p, i) => i).filter(i => !belegt.has(i) && !DB(i).stufe).sort((x, y) => DB(y).rating - DB(x).rating);
      sq = o.squad.map((i, n) => {
        if (!sperr.includes(i)) return i;
        let pos = n === o.torwart ? pool.findIndex(x => DB(x).role === 'TW') : -1; if (pos < 0) pos = 0;
        const r = pool.length ? pool.splice(pos, 1)[0] : null;
        if (r != null){ if (posiL[i]) posiL[r] = posiL[i]; nrL[r] = L.nr[i]; }
        return r;
      });
    }
    const eigene = sq.filter(i => i != null);
    const twL = sq[o.torwart] != null ? eigene.indexOf(sq[o.torwart]) : -1;
    SPIEL.starte({ ...o, posi: posiL, squad: eigene, torwart: twL >= 0 ? twL : Math.min(o.torwart, eigene.length - 1),
      nummern: Object.fromEntries(eigene.map(i => [i, nrL[i]])), gegnerNummern: Object.fromEntries(gegnerIdx.map(i => [i, L.nr[i]])),
      heim: ms.a === 0, gegnerLand: L.teams[k], gegnerBonus: landBonus(L.teams[k], L.seed || (L.seed = (Math.random() * 1e9) | 0)), gegnerIdx, twG: 0, turnier: 'LEAGUE · ' + tagName(L.tag + 1), liga: true, ligaErstes: L.tag === 0,
      wetter: w.wetter, nacht: w.nacht, anstoss: w.anstoss, jz: w.jz, temp: w.temp, konferenz: [] });
  }
  function nachSpiel(tore, sp, karten){
    if (!L) return;
    const ti = L.tag, ms = meinSpiel(ti), [wir, die] = tore;
    L.res[ti][ms.mi] = ms.a === 0 ? [wir, die] : [die, wir];
    (sp || []).forEach(x => { if (x.idx < 0 || !(x.tore || x.vorlagen)) return; const st = stat(x.team === 0 ? 0 : ms.gegner, x.idx); st.t += x.tore || 0; st.v += x.vorlagen || 0; });
    L.plan[ti].forEach(([h, g], i) => { if (i === ms.mi) return; const r = (L.vorab && L.vorab[i]) || simulieren(h, g); L.res[ti][i] = r; toreVerteilen(h, r[0]); toreVerteilen(g, r[1]); });
    // V3.56: Rote Karte / Gelb-Rot = im nächsten Ligaspiel gesperrt (die alte Sperre ist mit diesem Spiel abgesessen)
    // V3.57: Zwei Gelbe Karten (über mehrere Spiele gesammelt) = ebenfalls eine Spielsperre, danach beginnt die Zählung neu
    const meine = (karten || []).filter(e => e.team === 0 && L.opt.squad.includes(e.idx));
    const gesp = new Set(meine.filter(e => e.typ === 'rot' || e.typ === 'gelbrot').map(e => e.idx));
    L.gelb = L.gelb || {};
    meine.filter(e => e.typ === 'gelb' && !gesp.has(e.idx)).forEach(e => {
      L.gelb[e.idx] = (L.gelb[e.idx] || 0) + 1;
      if (L.gelb[e.idx] >= 2){ L.gelb[e.idx] = 0; gesp.add(e.idx); }
    });
    gesp.forEach(i => { L.gelb[i] = 0; });
    L.gesperrt = [...gesp];
    L.vorab = null;   // V6.2
    try { zSicher(); zSimTag(ti); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V5.0: League 2 spielt mit
    L.tag++;
    if (L.tag >= TAGE && !L.cc) try { ccNeu(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); }   // V5.0: Champions Cup auslosen
    speichern();
    ansicht = L.tag >= TAGE ? 'cc' : 'tabelle'; zeigTag = ti; oeffnen();
    // V5.3: Saisonende = Pack (einmalig). Meister: Gold (leicht: Silber) · Platz 2–3: Silber (leicht: Bronze)
    if (L.tag >= TAGE && !L.packGegeben){
      L.packGegeben = true; speichern();
      try {
        const platz = tabelle().findIndex(r => r.k === 0) + 1, si = L.opt.stufe === 'leicht' ? 0 : L.opt.stufe === 'stark' ? 2 : 1;
        const n = platz === 1 ? [12000, 15000, 20000][si] : platz <= 3 ? [4500, 6000, 8000][si] : platz === 4 ? [1000, 1500, 2000][si] : 0;   /* V3.04: League lohnt sich am meisten */   // V4.1: Crows statt Pack · V5.5: auch Platz 4
        if (n){ STAND.creditsPlus(n); setTimeout(() => { try { toast((platz === 1 ? '🏆 Meister' : 'Platz ' + platz) + ': +' + n + ' Crows!'); } catch (e){ typeof __scWarn === 'function' && __scWarn(e); } }, 900); }
        { const kg = listeSpieler('t')[0]; if (kg && kg.k === 0){ const kn = [500, 750, 1000][si]; STAND.creditsPlus(kn); setTimeout(() => { try { toast('👑 Torschützenkönig: +' + kn + ' Crows!'); } catch (e){ typeof __scWarn === 'function' && __scWarn(e); } }, 2600); } }   // V11.6
      } catch (e){ typeof __scWarn === 'function' && __scWarn(e); }
    }
  }

  // ---- Darstellung
  const flag = k => flaggeHTML(L.teams[k][0]);
  const name = k => kurz(L.teams[k]) + (k === 0 ? ' ★' : '');
  function listeSpieler(art){
    const arr = Object.values(L.stat).filter(x => x[art] > 0);
    const z = art === 't' ? 'v' : 't';
    return arr.sort((a, b) => b[art] - a[art] || b[z] - a[z] || DB(a.i).name.localeCompare(DB(b.i).name)).slice(0, 12);
  }
  function tabelleHTML(){
    const T = tabelle();
    return '<table><thead><tr><th>#</th><th class="l">TEAM</th><th>SP</th><th>S</th><th>U</th><th>N</th><th>TORE</th><th>TD</th><th>PKT</th></tr></thead><tbody>' +
      T.map((r, n) => '<tr class="' + (r.k === 0 ? 'du ' : '') + (n === 0 ? 'meister' : '') + '"><td>' + (n + 1) + '</td><td class="l">' + flag(r.k) + name(r.k) + '</td><td>' + r.sp + '</td><td>' + r.s + '</td><td>' + r.u + '</td><td>' + r.n + '</td><td>' + r.tf + ':' + r.ta + '</td><td>' + (r.tf - r.ta > 0 ? '+' : '') + (r.tf - r.ta) + '</td><td><b>' + r.pkt + '</b></td></tr>').join('') + '</tbody></table>';
  }
  function spieltagHTML(){
    const tag = L.plan[zeigTag];
    return '<div class="lg-pager"><button type="button" data-d="-1">‹</button><b>' + tagName(zeigTag + 1) + '</b><button type="button" data-d="1">›</button></div>' +
      tag.map(([a, b], mi) => { const r = L.res[zeigTag][mi]; return '<div class="lg-spiel' + (a === 0 || b === 0 ? ' du' : '') + '"><span class="a">' + name(a) + ' ' + flag(a) + '</span><span class="e">' + (r ? r[0] + ' : ' + r[1] : '– : –') + '</span><span>' + flag(b) + name(b) + '</span></div>'; }).join('');
  }
  function spielerHTML(art){
    const arr = listeSpieler(art);
    if (!arr.length) return '<div class="lg-leer">Noch keine ' + (art === 't' ? 'Tore' : 'Vorlagen') + ' – spiel den ersten Spieltag!</div>';
    const fertig = L.tag >= TAGE;
    return '<table><thead><tr><th>#</th><th class="l">SPIELER</th><th class="l">TEAM</th><th>' + (art === 't' ? 'TORE' : 'VORLAGEN') + '</th><th>' + (art === 't' ? 'VORLAGEN' : 'TORE') + '</th></tr></thead><tbody>' +
      arr.map((x, n) => '<tr class="' + (x.k === 0 ? 'du' : '') + '"><td>' + (n === 0 && fertig ? '\uD83D\uDC51' : n + 1) + '</td><td class="l">' + DB(x.i).name + '</td><td class="l">' + flag(x.k) + kurz(L.teams[x.k]) + '</td><td><b>' + x[art] + '</b></td><td>' + x[art === 't' ? 'v' : 't'] + '</td></tr>').join('') + '</tbody></table>';
  }
  // V5.0: Tabelle der League 2 und Champions Cup
  const zFlag = k => flaggeHTML(L.z.teams[k][0]), zName = k => kurz(L.z.teams[k]);
  function liga2HTML(){
    zSicher(); const T = zTabelle();
    return '<table><thead><tr><th>#</th><th class="l">TEAM</th><th>SP</th><th>S</th><th>U</th><th>N</th><th>TORE</th><th>TD</th><th>PKT</th></tr></thead><tbody>' +
      T.map((r, n) => '<tr class="' + (n < 4 ? 'cc-platz' : '') + '"><td>' + (n + 1) + '</td><td class="l">' + zFlag(r.k) + zName(r.k) + (n < 4 ? ' <small class="cc-mark">CC</small>' : '') + '</td><td>' + r.sp + '</td><td>' + r.s + '</td><td>' + r.u + '</td><td>' + r.n + '</td><td>' + r.tf + ':' + r.ta + '</td><td>' + (r.tf - r.ta > 0 ? '+' : '') + (r.tf - r.ta) + '</td><td><b>' + r.pkt + '</b></td></tr>').join('') + '</tbody></table>';
  }
  function ccTeam(r, an){
    if (!r) return '<span class="cc-t leer">?</span>';
    return '<span class="cc-t' + (ccIch(r) ? ' du' : '') + (an === false ? ' raus' : '') + '">' + flaggeHTML(ccLand(r)[0]) + ' ' + kurz(ccLand(r)) + (ccIch(r) ? ' ★' : '') + '<small>' + (r.l === 'a' ? 'L1' : 'L2') + ' · ' + r.platz + '.</small></span>';
  }
  function ccHTML(){
    if (!L.cc) return '<div class="lg-leer">Die Top 4 beider Ligen spielen nach der Saison den SILESCROW CHAMPIONS CUP.</div>';
    const auslosung = !L.cc.gezeigt;
    let h = '<div class="cc-baum">';
    L.cc.runden.forEach((R, ri) => {
      h += '<div class="cc-runde"><h4>' + (ri === 0 && auslosung ? '🎱 AUSLOSUNG · ' : '') + CC_RUNDEN[ri] + '</h4>' + R.map((p, pi) => {
        const e = p.r ? p.r.t[0] + ' : ' + p.r.t[1] + (p.r.ne ? ' <small>n.E.</small>' : '') : '– : –';
        return '<div class="cc-paar' + (ccIch(p.a) || ccIch(p.b) ? ' du' : '') + (auslosung && ri === 0 ? ' los" style="animation-delay:' + (pi * .9 + .3) + 's' : '') + '">' + ccTeam(p.a, p.r ? p.r.s === 'a' : null) + '<b>' + e + '</b>' + ccTeam(p.b, p.r ? p.r.s === 'b' : null) + '</div>';
      }).join('') + '</div>';
    });
    for (let ri = L.cc.runden.length; ri < 3; ri++) h += '<div class="cc-runde leer"><h4>' + CC_RUNDEN[ri] + '</h4><div class="cc-paar">' + ccTeam(null) + '<b>– : –</b>' + ccTeam(null) + '</div></div>';
    h += '</div>';
    if (auslosung){ L.cc.gezeigt = true; speichern(); }
    return h;
  }
  function sperrText(){
    const g = (L.gesperrt || []).filter(i => L.opt.squad.includes(i));
    const v = Object.keys(L.gelb || {}).map(Number).filter(i => L.gelb[i] === 1 && L.opt.squad.includes(i) && !g.includes(i));
    return (g.length ? ' · \uD83D\uDFE5 Gesperrt: ' + g.map(i => DB(i).name).join(', ') : '') + (v.length ? ' · \uD83D\uDFE8 Verwarnt: ' + v.map(i => DB(i).name).join(', ') : '');
  }
  function infoText(){
    const fertig = L.tag >= TAGE;
    if (!fertig){
      if (L.tag === 0) return 'Dein erster Gegner: ' + kurz(L.teams[meinSpiel(0).gegner]) + sperrText();
      const ms = meinSpiel(L.tag - 1), r = L.res[L.tag - 1][ms.mi], mein = ms.a === 0 ? r : [r[1], r[0]];
      return 'Spieltag ' + L.tag + ' · dein Ergebnis ' + mein[0] + ':' + mein[1] + ' · Nächster Gegner: ' + kurz(L.teams[meinSpiel(L.tag).gegner]) + sperrText();
    }
    const T = tabelle(), me = T.findIndex(r => r.k === 0) + 1, kg = listeSpieler('t')[0];
    return '\uD83C\uDFC6 MEISTER: ' + kurz(L.teams[T[0].k]) + ' · Du: Platz ' + me + (kg ? ' · \uD83D\uDC51 Torschützenkönig: ' + DB(kg.i).name + ' (' + kg.t + ')' : '');
  }
  function rendern(){
    const fertig = L.tag >= TAGE;
    if (fertig && !L.cc) try { ccNeu(); } catch (e) {}   // V5.0: ältere Ligen bekommen ihren Champions Cup
    { const ct = $l('lgCcTab'); if (ct) ct.hidden = !fertig; }
    $l('lgTag').textContent = ansicht === 'liga2' ? 'SILESCROW LEAGUE 2 · ' + (fertig ? 'SAISON BEENDET' : 'SPIELTAG ' + Math.min(L.tag, TAGE) + ' / ' + TAGE)
      : ansicht === 'cc' ? 'SILESCROW CHAMPIONS CUP' : 'SILESCROW LEAGUE · ' + (fertig ? 'SAISON BEENDET' : tagName(L.tag + 1) + ' / ' + TAGE);
    document.querySelectorAll('#lgTabs button').forEach(b => b.classList.toggle('an', b.dataset.v === ansicht));
    $l('lgInfo').textContent = infoText();
    $l('lgInhalt').innerHTML = ansicht === 'tabelle' ? tabelleHTML() : ansicht === 'spieltag' ? spieltagHTML() : ansicht === 'tore' ? spielerHTML('t') : ansicht === 'liga2' ? liga2HTML() : ansicht === 'cc' ? ccHTML() : spielerHTML('v');
    if (ansicht === 'cc' && L.cc) $l('lgInfo').textContent = L.cc.sieger ? (ccIch(L.cc.sieger) ? '🏆 Du hast den SILESCROW CHAMPIONS CUP gewonnen!' : '🏆 Sieger des Champions Cup: ' + ccLand(L.cc.sieger)[0]) : ccMein() ? 'Dein ' + CC_RUNDEN[L.cc.runde] + ' wartet – K.-o.: bei Gleichstand Verlängerung und Elfmeterschießen.' : 'Du bist nicht (mehr) dabei – die anderen Spiele werden simuliert.';
    $l('lgLos').textContent = !fertig ? tagName(L.tag + 1) + ' ANPFIFF' : (L.cc && !L.cc.sieger) ? (ccMein() ? 'CHAMPIONS CUP · ' + CC_RUNDEN[L.cc.runde] + ' ANPFIFF' : 'CHAMPIONS CUP SIMULIEREN') : 'NÄCHSTE SAISON';
    $l('lgLos').hidden = istGast;   // V6.4: nur der Gastgeber gibt den Anpfiff
    $l('lgMenue').textContent = istGast ? 'ZUM SPIEL' : 'MENÜ';
  }
  function oeffnen(){
    $l('liga').hidden = false; skalieren(); rendern();
    // V6.4: Online läuft der nächste Spieltag wie im Online-Cup automatisch an, damit beide Geräte zusammen starten
    if (!istGast && typeof NETZ !== 'undefined' && NETZ.rolle === 'host' && NETZ.partner && L && L.tag < TAGE){
      const mein = L.tag; clearTimeout(oeffnen.t);
      oeffnen.t = setTimeout(() => { try { if (L && !istGast && L.tag === mein && !$l('liga').hidden && NETZ.rolle === 'host' && NETZ.partner) $l('lgLos').click(); } catch (e){ typeof __scWarn === 'function' && __scWarn(e); } }, 6000);
    }
  }

  $l('lgTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !L) return; ansicht = b.dataset.v; if (ansicht === 'spieltag') zeigTag = Math.min(zeigTag, TAGE - 1); rendern(); });
  $l('lgInhalt').addEventListener('click', e => { const b = e.target.closest('button[data-d]'); if (!b || !L) return; zeigTag = Math.max(0, Math.min(TAGE - 1, zeigTag + (+b.dataset.d))); rendern(); });
  $l('lgLos').addEventListener('click', () => { if (!L || istGast) return;
    if (L.tag >= TAGE){
      if (L.cc && !L.cc.sieger){   // V5.0: Champions Cup
        if (ccMein()){ ccSpielen(); return; }
        while (!L.cc.sieger) ccWeiter();
        ansicht = 'cc'; rendern(); return;
      }
      const optNeu = L.opt, naechste = () => { try { LS81.removeItem(KEY); } catch (e){} neu(optNeu); };   // V7.0: nächste Saison = Glücksrad, Rad-Packs bleiben
      if (typeof gluecksradZeigen === 'function'){ try { gluecksradZeigen(naechste, true); } catch (e){ naechste(); } } else naechste();
    } else spielen(); });
  $l('lgMenue').addEventListener('click', () => { clearTimeout(oeffnen.t); $l('liga').hidden = true; if (!istGast) SPIEL.beenden(); });

  // V5.1: Liga-Stand für den Kommentator (g = bereits gespielte Spieltage, r = Tabellenplatz des Spielers, 1 = Spitze)
  // V6.2: Am letzten Spieltag schon beim Abpfiff wissen, ob dein Team Meister ist (für Podest + Schale im Spiel).
  // Die anderen Spiele des Spieltags werden dafür vorab simuliert; nachSpiel() übernimmt genau diese Ergebnisse.
  function meisterVorab(tore){
    try {
      if (!L || L.tag !== TAGE - 1) return false;
      const ti = L.tag, ms = meinSpiel(ti), [wir, die] = tore;
      if (!L.vorab){ L.vorab = {}; L.plan[ti].forEach(([h, g], i) => { if (i !== ms.mi) L.vorab[i] = simulieren(h, g); }); }
      const alt = L.res[ti].slice();
      L.res[ti][ms.mi] = ms.a === 0 ? [wir, die] : [die, wir];
      Object.keys(L.vorab).forEach(i => { L.res[ti][i] = L.vorab[i]; });
      const T = tabelle(); L.res[ti] = alt;
      return T[0].k === 0;
    } catch (e){ return false; }
  }
  function status(){ try { if (!L) return null; const T = tabelle(), i = T.findIndex(x => x.k === 0); return { g: L.tag, tage: TAGE, r: i + 1, n: ANZ, pkt: T[i].pkt, abstand: T[0].pkt - T[i].pkt, land: L.teams[0][0], letzt: (() => { try { if (L.tag < 1) return null; const ms = meinSpiel(L.tag - 1), r = L.res[L.tag - 1][ms.mi]; return r ? (ms.a === 0 ? [r[0], r[1]] : [r[1], r[0]]) : null; } catch (e) { return null; } })() }; } catch (e){ return null; } }
  // V5.7: Liga fortsetzen mit deinem aktuellen Menü-Team (z. B. neue Pack-Spieler eingewechselt)
  function teamAusMenue(o){
    if (!L || !o || !Array.isArray(o.squad) || !o.squad.length) return false;
    L.kader[0] = o.squad.slice();
    L.nr = L.nr || {}; o.squad.forEach(i => { const n = Number(o.nummern && o.nummern[i]); if (n >= 1 && n <= 99) L.nr[i] = n; });
    L.opt = { ...L.opt, squad: o.squad.slice(), torwart: o.torwart, menschTorwart: o.menschTorwart, nummern: o.nummern, posi: o.posi, formation: o.formation, formSlot: o.formSlot, ersatz: o.ersatz };
    speichern(); return true;
  }
  return { neu, fortsetzen, fortsetzenOnline, syncOnline, nachSpiel, ccNachSpiel, status, meisterVorab, teamAusMenue, get gespeichert(){ return !!laden(); }, get info(){ const x = laden(); return x ? { squad: x.opt && x.opt.squad, ersatz: x.opt && x.opt.ersatz, torwart: x.opt && x.opt.torwart, stufe: x.opt && x.opt.stufe, land: x.opt && x.opt.land, tag: x.tag, tage: x.plan.length } : null; } };   // V4.5: + stufe
})();