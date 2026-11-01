/* Silescrow Cup V 4.2 – js/spielstand.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

const STAND = (() => {
  const KEY = 'sc_stand';
  const leer = () => ({ v: 1, sp: {}, karten: [], packs: [], titel: 0, starterGiven: false, cr: START_CREDITS, m41: true, wahl: null });
  let d = leer();
  const DB = i => PLAYER_DATABASE[i];
  const idxVon = n => PLAYER_DATABASE.findIndex(p => p.name === n);
  // V4.1: alte Spielstände umstellen – Dribbling wird Ausdauer, alte Trainings-Zuwächse (+4 je Punkt) werden geviertelt
  function umstellen(x){
    if (x.m41) return x;
    const sp = {};
    for (const n in (x.sp || {})){
      const i = idxVon(n); if (i < 0) continue;
      const alt = (x.sp[n] && x.sp[n].w) || {}, st = startWerte(i), w = {};
      const plus = k => Math.max(0, Math.round(((+alt[k] || START_WERT) - START_WERT) / 4));
      w.tem = Math.min(MAX_WERT, st.tem + plus('tem')); w.sch = Math.min(MAX_WERT, st.sch + plus('sch'));
      w.pas = Math.min(MAX_WERT, st.pas + plus('pas')); w.abw = Math.min(MAX_WERT, st.abw + plus('abw'));
      w.aud = Math.min(MAX_WERT, st.aud + plus('dri'));
      sp[n] = { w, p: Math.max(0, +(x.sp[n] && x.sp[n].p) || 0), g: (x.sp[n] && x.sp[n].g) || 0 };
    }
    x.sp = sp; if (typeof x.cr !== 'number') x.cr = START_CREDITS; x.m41 = true; if (!('wahl' in x)) x.wahl = null;
    return x;
  }
  // V11.9: Sicherheitsnetz – ist der gespeicherte Stand nicht lesbar, wird der alte Rohtext vorher gesichert, bevor speichern() ihn ersetzt
  try { const r0 = LS81.getItem(KEY); if (r0){ let ok0 = false; try { const x0 = JSON.parse(r0); ok0 = !!(x0 && x0.v === 1); } catch(e0){} if (!ok0) LS81.setItem('sc_stand_defekt', r0); } } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  try { const roh = LS81.getItem(KEY); if (roh){ const x = JSON.parse(roh); if (x && x.v === 1) { d = Object.assign(leer(), { m41: false, cr: undefined }, x); if (typeof d.starterGiven !== 'boolean') d.starterGiven = !!(d.packs && d.packs.some(pk => pk && pk.quelle === 'starter')) || !!(d.karten && d.karten.length) || !!(d.titel) || !!(d.sp && Object.keys(d.sp).length); umstellen(d); } } } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  try { const alt = +LS81.getItem('sc_titel'); if (alt && !d.titel) d.titel = alt; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  try { if (!d.markt || typeof d.markt !== 'object') d.markt = { liste: [], ang: [] }; if (!Array.isArray(d.markt.liste)) d.markt.liste = []; if (!Array.isArray(d.markt.ang)) d.markt.ang = []; if (!Array.isArray(d.verkauft)) d.verkauft = []; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}   // V9.8: Transfermarkt
  // V9.8: einmalig 3 normale Startfiguren als Reserve-Spieler (JINX, ROCKET, GRIZZLY) – nur, wenn noch nicht geschehen
  try { if (!d.res3){ d.res3 = true; if (!Array.isArray(d.karten)) d.karten = []; } } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  // V11.14: Spielstand doppelt sichern – localStorage (5 MB, teilen sich alle Spiele auf silescrow.github.io) + IndexedDB (viel größer).
  // Ist localStorage voll, ging bisher jede Änderung (z. B. neue Gold-Spieler) beim Neuladen verloren.
  const IDB = (() => { let db = null; const auf = () => new Promise((ok, no) => { if (db) return ok(db); try { const r = indexedDB.open('silescrowCup', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { db = r.result; ok(db); }; r.onerror = () => no(r.error); } catch (e) { no(e); } });
    return { put: (k, v) => auf().then(x => new Promise(ok => { try { const t = x.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(true); t.onerror = () => ok(false); } catch (e) { ok(false); } })).catch(() => false),
             get: k => auf().then(x => new Promise(ok => { try { const q = x.transaction('kv', 'readonly').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); } catch (e) { ok(null); } })).catch(() => null) }; })();
  let idbBereit = false, vollGemeldet = false, aenderung = false;
  const speichern = () => {
    if (aenderung) d.ts = Date.now();
    const txt = JSON.stringify(d);
    try { LS81.setItem(KEY, txt); } catch(e){ typeof __scWarn==='function'&&__scWarn(e);
      if (!vollGemeldet){ vollGemeldet = true; setTimeout(() => { try { toast('⚠️ Browser-Speicher ist voll – dein Spielstand wird zusätzlich anders gesichert. Tipp: in den Einstellungen 💾 SPIELSTAND sichern.'); } catch (x) {} }, 1500); } }
    if (idbBereit) IDB.put(KEY, txt);
    try { window.__packAnzeige && window.__packAnzeige(); } catch(e){} };
  const ladeTs = d.ts || 0;
  speichern(); aenderung = true;
  // Beim Start: Ist die IndexedDB-Kopie neuer (z. B. weil localStorage voll war), wird sie übernommen.
  IDB.get(KEY).then(roh => {
    try { if (roh){ const x = JSON.parse(roh); let rs = 0; try { rs = +localStorage.getItem('scResetTs') || 0; } catch (e) {}
      if (x && x.v === 1 && (x.ts || 0) > ladeTs && (x.ts || 0) > rs){ d = Object.assign(leer(), { m41: false, cr: undefined }, x); umstellen(d); try { LS81.setItem(KEY, JSON.stringify(d)); } catch (e) {}
        setTimeout(() => { try { zeichneKarten(); } catch (e) {} try { aktualisiere(); } catch (e) {} try { window.__packAnzeige && window.__packAnzeige(); } catch (e) {} try { toast('💾 Spielstand wiederhergestellt'); } catch (e) {} }, 300); } } } catch (e) {}
    idbBereit = true; IDB.put(KEY, JSON.stringify(d));
  });
  const sp = i => { const n = DB(i).name; return d.sp[n] || (d.sp[n] = { w: startWerte(i), p: 0 }); };
  const goldSpezial = p => p.role === 'ST' ? ['sch'] : p.role === 'MF' ? ['pas'] : p.role === 'DF' ? ['abw'] : [];
  // schwächsten Wert automatisch trainieren (KI-Mitspieler)
  function autoTrain(i, n){
    const s = sp(i); s.pa = (s.pa || 0) + n;
    for (let sicher = 0; sicher < 200; sicher++){
      const frei = WERT_KEYS.filter(k => s.w[k] < maxWertVon(i)); if (!frei.length) break;
      const k = frei.reduce((a, b) => s.w[b] < s.w[a] ? b : a), c = trainKosten(s.w[k]);
      if (s.pa < c) break; s.w[k]++; s.pa -= c;
    }
  }
  return {
    get daten(){ return d; },
    trainierbar: i => ISTTRAIN(DB(i)),
    start: i => startWerte(i),
    kosten: v => 1,   // V7.0: Star-Training: jeder Schritt kostet 1 Punkt
    punkteSetzen(i, n){ if (!this.trainierbar(i)) return 0; sp(i).p = n; speichern(); return n; },   // V7.0: vor jedem Spiel genau 3 Punkte
    werte(i){
      const p = DB(i); if (!p) return null;
      if (ISTTRAIN(p)){ const w = sp(i).w; return { ...w, dri: Math.round((w.tem + w.pas) / 2) }; }
      const r = p.rating + (p.stufe && d.karten.includes(p.name) ? PACK_BONUS_VON(p) : 0);
      return { abw: r, pas: r, sch: r, aud: r, dri: r, tem: r };
    },
    gesamt(i){ const w = this.werte(i); return Math.round((w.abw + w.pas + w.sch + w.aud + w.tem) / 5); },
    zuwachs(i){ const p = DB(i); if (!ISTTRAIN(p)) return null; const w = sp(i).w, st = startWerte(i), z = {}; WERT_KEYS.forEach(k => z[k] = Math.max(0, w[k] - st[k])); z.dri = Math.round((z.tem + z.pas) / 2); return z; },
    punkte(i){ return ISTTRAIN(DB(i)) ? sp(i).p : 0; },
    punkteGeben(i, n){ if (!this.trainierbar(i)) return 0; sp(i).p += n; speichern(); return n; },
    trainingNachSpiel(){ return 0; },   // V4.1: ersetzt durch nachSpiel()
    erhoehen(i, k){ if (!this.trainierbar(i)) return false; const s = sp(i); if (s.w[k] == null || s.w[k] >= maxWertVon(i)) return false; const c = 1; if (s.p < c) return false; s.w[k]++; s.p -= c; speichern(); return true; },
    punkteVerteilen(){ return false; },
    teamPunkte(){ return false; },
    // V4.1: nach jedem Spiel – Trainingspunkte (Star: zum Verteilen, Mitspieler: automatisch) und Crows (nur Liga/Pokal)
    nachSpiel(o){
      const erg = o && TP_ERGEBNIS[o.erg] ? o.erg : 'N', tp = TP_ERGEBNIS[erg];
      const squad = (o.squad || []).filter(i => i != null && DB(i)), star = squad[0];
      /* V7.0: Star-Punkte werden vor dem Spiel auf 3 gesetzt */
      new Set([...squad.slice(1), ...((o.ersatz || []).filter(i => i != null && DB(i)))]).forEach(i => { if (i !== star && ISTTRAIN(DB(i))) autoTrain(i, tp); });
      let cr = 0, serie = 0, serieBonus = 0, mvpBonus = 0, serieNext = SERIE_BONUS; if (o.wertung){ const stf = STUFE_OK(o.stufe); serieNext = SERIE_STUFE[stf]; cr = CREDITS_STUFE[stf][erg] + CREDITS_PRO_TOR * Math.max(0, o.tore | 0); d.cr += cr;
        if (o.mvp){ mvpBonus = MVP_STUFE[STUFE_OK(o.stufe)]; d.cr += mvpBonus; }   // V3.09: MVP aus deiner Mannschaft: leicht 200 / mittel 300 / stark 400 – auch bei Niederlage
        // V5.5: Siegesserie – alle 5 Siege in Folge (Liga, Silescrow Cup, Champions Cup) +1.000 Crows; Unentschieden/Niederlage beendet die Serie
        d.serie = erg === 'S' ? (d.serie | 0) + 1 : 0; serie = d.serie;
        if (serie > 0 && serie % SERIE_LAENGE === 0){ serieBonus = SERIE_STUFE[STUFE_OK(o.stufe)]; d.cr += serieBonus; } }
      let marktNeu = 0; if (o.wertung){ try { marktNeu = this.marktTick().length; } catch (e) {} }   // V9.8: Transferangebote
      speichern(); return { tp, cr, serie, serieBonus, serieNext, mvpBonus, marktNeu, star: star != null && ISTTRAIN(DB(star)) ? DB(star).name : null };
    },
    zuruecksetzen(i){
      if (!this.trainierbar(i)) return; const s = sp(i), st = startWerte(i); let summe = 0;
      WERT_KEYS.forEach(k => { for (let v = st[k]; v < s.w[k]; v++) summe += trainKosten(v); s.w[k] = st[k]; });
      s.p += summe; speichern();
    },
    spezial(i){
      const p = DB(i); if (!p) return [];
      if (p.stufe === 'gold') return goldSpezial(p);
      if (!ISTTRAIN(p)) return [];
      const w = sp(i).w, trainiert = ['tem', 'sch', 'pas', 'abw'].filter(k => w[k] >= maxWertVon(i));
      return trainiert;
    },
    offenePunkte(){ return PLAYER_DATABASE.map((p, i) => i).filter(i => this.punkte(i) > 0); },
    hatKarte(i){ const p = DB(i); if (p && (d.verkauft || []).includes(p.name)) return false; return !!p && (p.eigen || (p.ki && !p.stufe) || d.karten.includes(p.name)); },
    kartenReihe(){ return d.karten.slice(); },   // V10.6: Reihenfolge der freigeschalteten Pack-Karten (neueste zuletzt)
    karteFrei(i){ const p = DB(i); if (p && !d.karten.includes(p.name)){ d.karten.push(p.name); speichern(); } },
    // Crows
    get credits(){ return d.cr | 0; },
    creditsPlus(n){ d.cr = Math.max(0, (d.cr | 0) + (n | 0)); speichern(); return d.cr; },
    // V9.8: Vertrag auflösen – nur Pack-Karten (Bronze/Silber/Gold) gegen Crows; die Karte kann danach wieder aus Packs kommen
    auflKosten(i){ const p = DB(i); return p ? Math.max(100, Math.round(this.marktWert(i) * 0.6 / 10) * 10) : 0; },   // V9.9: Auflösesumme nach Marktwert – teurere Spieler kosten mehr
    // V9.8: TRANSFERMARKT – Spieler auf die Transferliste setzen; nach Liga-/Pokalspielen kommen manchmal Angebote (deutlich unter Shop-Preis, Gold am meisten)
    // V9.9: Marktwert richtet sich nach der Stärke (GES): stärkerer Spieler = deutlich teurer; Pack-Stufe gibt einen kleinen Aufschlag
    marktWert(i){ const p = DB(i); if (!p) return 0; let g = p.rating; try { g = this.gesamt(i) || p.rating; } catch (e) {}
      const f = p.stufe === 'gold' ? 1.5 : p.stufe === 'silber' ? 1.2 : 1;
      return Math.max(50, Math.round(Math.pow(Math.max(0, g - 45), 2) * 0.35 * f / 10) * 10); },
    // V9.9: Stärke der Nation 0..1 (Großteams hoch, kleine Nationen niedrig)
    nationStaerke(n){ const T = { 'Brasilien': 1, 'Argentinien': 1, 'Frankreich': 1, 'Spanien': .97, 'England': .97, 'Deutschland': .95, 'Portugal': .92, 'Niederlande': .9, 'Italien': .9,
        'Belgien': .75, 'Kroatien': .72, 'Uruguay': .7, 'Türkei': .68, 'Dänemark': .66, 'Kolumbien': .66, 'Marokko': .64, 'Schweiz': .62, 'Österreich': .6, 'Polen': .58, 'Mexiko': .58, 'USA': .58, 'Japan': .6, 'Südkorea': .56, 'Senegal': .56,
        'Nigeria': .42, 'Ägypten': .4, 'Australien': .4, 'Saudi-Arabien': .3, 'Iran': .34, 'Kanada': .3, 'Chile': .36, 'Costa Rica': .2 }; return T[n] != null ? T[n] : .5; },
    aufListe(i){ const p = DB(i); return !!p && d.markt.liste.includes(p.name); },
    marktListe(i){ const p = DB(i); if (!p) return false; const k = d.markt.liste.indexOf(p.name);
      if (k >= 0){ d.markt.liste.splice(k, 1); d.markt.ang = d.markt.ang.filter(a => a.n !== p.name); speichern(); return false; }
      d.markt.liste.push(p.name); speichern(); return true; },
    marktTick(){ const m = d.markt, neu = [];
      m.ang = m.ang.filter(a => { a.l = (a.l | 0) - 1; return a.l > 0 && m.liste.includes(a.n); });
      m.liste.forEach(n => { if (m.ang.some(a => a.n === n) || Math.random() > 0.4) return;   // nicht immer ein Angebot
        const i = idxVon(n); if (i < 0) return;
        // V9.9: Großteams wollen eher starke Spieler, kleine Teams eher schwächere (und zahlen weniger); Auswahl bleibt zufällig
        let g = 70; try { g = this.gesamt(i) || DB(i).rating; } catch (e) {}
        const ps = Math.max(0, Math.min(1, (g - 60) / 60));
        let teams = ['Brasilien', 'Spanien', 'Japan', 'Mexiko', 'Italien']; try { if (typeof COUNTRY_DATABASE !== 'undefined' && COUNTRY_DATABASE.length) teams = COUNTRY_DATABASE.map(l => l[0]); } catch (e) {}
        const gew = teams.map(t => 0.08 + Math.pow(1 - Math.abs(this.nationStaerke(t) - ps), 3) + Math.random() * 0.35); let sum = gew.reduce((x, y) => x + y, 0), r = Math.random() * sum, w = 0;
        while (w < teams.length - 1 && (r -= gew[w]) > 0) w++;
        const team = teams[w], ns = this.nationStaerke(team);
        const preis = Math.max(20, Math.round(this.marktWert(i) * (0.6 + ns * 0.5) * (0.85 + Math.random() * 0.3) / 10) * 10);
        const a = { n, team, preis, l: 3 }; m.ang.push(a); neu.push(a); });
      speichern(); return neu; },
    marktAblehnen(k){ d.markt.ang.splice(k, 1); speichern(); },
    marktVerkaufen(k){ const a = d.markt.ang[k]; if (!a) return { fehler: 'weg' };
      const p = PLAYER_DATABASE.find(x => x.name === a.n); if (!p) return { fehler: 'weg' };
      const besitz = PLAYER_DATABASE.filter(x => (x.eigen && !d.verkauft.includes(x.name)) || d.karten.includes(x.name)).length;
      if (besitz <= 13) return { fehler: 'min' };   // mindestens 13 Spieler bleiben im Besitz
      const j = d.karten.indexOf(p.name); if (j >= 0) d.karten.splice(j, 1);
      if (!p.stufe && !d.verkauft.includes(p.name)) d.verkauft.push(p.name);
      if (!p.stufe){ if (!d.wechsel || typeof d.wechsel !== 'object') d.wechsel = {}; d.wechsel[p.name] = a.team; }   // V11.13: der Spieler wechselt zu dieser Nation (Reserve)
      d.cr = (d.cr | 0) + a.preis; d.markt.liste = d.markt.liste.filter(n => n !== a.n); d.markt.ang = d.markt.ang.filter(x => x.n !== a.n);
      speichern(); return { ok: true, preis: a.preis, name: p.name, team: a.team }; },
    vertragAufloesen(i){   // V9.9: für jeden Spieler im Kader möglich (nicht für DICH), kostet je nach Marktwert
      const p = DB(i); if (!p) return { fehler: 'art' };
      const besitz = PLAYER_DATABASE.filter(x => (x.eigen && !d.verkauft.includes(x.name)) || d.karten.includes(x.name)).length;
      if (besitz <= 13) return { fehler: 'min' };
      const k = d.karten.indexOf(p.name); if (k < 0 && (p.stufe || !this.hatKarte(i))) return { fehler: 'karte' };
      const preis = this.auflKosten(i); if ((d.cr | 0) < preis) return { fehler: 'geld', preis };
      d.cr -= preis; if (k >= 0) d.karten.splice(k, 1); if (!p.stufe && !d.verkauft.includes(p.name)) d.verkauft.push(p.name);
      let land = null;   // V11.13: vereinsloser Spieler kommt bei einer zufälligen Nation in die Reserve (Pack-Spieler gehen zurück zu ihrer Nation)
      if (!p.stufe){ try { const l = COUNTRY_DATABASE.map(x => x[0]); land = l[(Math.random() * l.length) | 0]; if (!d.wechsel || typeof d.wechsel !== 'object') d.wechsel = {}; d.wechsel[p.name] = land; } catch (e) {} }
      else { try { for (const n in NATION_KARTEN) if (NATION_KARTEN[n].includes(i)) land = n; } catch (e) {} }
      try { d.markt.liste = d.markt.liste.filter(n => n !== p.name); d.markt.ang = d.markt.ang.filter(a => a.n !== p.name); } catch (e) {} speichern(); return { ok: true, preis, land };
    },
    // V11.5: Pro Pack wird genau ein zufälliger Spieler gezogen und direkt freigeschaltet.
    packPool(art){ return PLAYER_DATABASE.map((p, i) => i).filter(i => PLAYER_DATABASE[i].stufe === art && !this.hatKarte(i) && !d.packs.some(pk => pk.karte === PLAYER_DATABASE[i].name)); },
    packKaufen(art){
      if (!PACK_PREIS[art]) return { fehler: 'art' };
      const pool = this.packPool(art); if (!pool.length) return { fehler: 'alle' };
      if ((d.cr | 0) < PACK_PREIS[art]) return { fehler: 'geld' };
      d.cr -= PACK_PREIS[art];
      const idx = pool[(Math.random() * pool.length) | 0], name = PLAYER_DATABASE[idx].name;
      if (!d.karten.includes(name)) d.karten.push(name);
      speichern(); return { ok: idx, karte: name, art };
    },
    // V11.5: Packs werden im Shop gesammelt und beim Öffnen mit genau einem Spieler belohnt.
    packKaufenLagern(art){
      if (!PACK_PREIS[art]) return { fehler: 'art' };
      if (!this.packPool(art).length) return { fehler: 'alle' };
      if ((d.cr | 0) < PACK_PREIS[art]) return { fehler: 'geld' };
      d.cr -= PACK_PREIS[art];
      d.packs.push({ art, quelle: 'kauf', t: Date.now() }); speichern();
      return { ok: true, anzahl: d.packs.filter(pk => pk && pk.art === art && pk.quelle !== 'starter').length };
    },
    // V7.0: Glücksrad bei neuer Liga – Pack (kommt zu den ungeöffneten Packs) oder Crows
    radGewinn(art, cr, behalten, mehr){
      if (!behalten) d.packs = d.packs.filter(pk => !(pk && pk.rad));   // V7.0: Rad-Packs verfallen, wenn die alte Liga abgebrochen wird; nach einer beendeten Saison bleiben sie
      if (art){
        if (!this.packPool(art).length){ d.cr += PACK_PREIS[art]; speichern(); return { cr: PACK_PREIS[art], ersatz: true }; }
        if (!mehr && d.packs.some(pk => pk && pk.rad)){ d.cr += PACK_PREIS[art]; speichern(); return { cr: PACK_PREIS[art], ersatz: true, voll: true }; }   // nur ein ungeöffnetes Rad-Pack gleichzeitig
        d.packs.push({ art, quelle: 'kauf', t: Date.now(), rad: true }); speichern(); return { pack: art };
      }
      if (cr){ d.cr += cr; speichern(); return { cr }; }
      return {};
    },
    kaufPackOeffnen(pk){
      const n = d.packs.indexOf(pk); if (n < 0) return { fehler: 'weg' };
      const pool = this.packPool(pk.art);
      d.packs.splice(n, 1);
      if (!pool.length){ d.cr += PACK_PREIS[pk.art] || 0; speichern(); return { fehler: 'alle' }; }
      const idx = pool[(Math.random() * pool.length) | 0], name = PLAYER_DATABASE[idx].name;
      if (!d.karten.includes(name)) d.karten.push(name);
      speichern(); return { ok: idx, karte: name, art: pk.art };
    },
    einzelKaufen(name){
      const i = idxVon(name), p = DB(i); if (!p || !p.stufe) return { fehler: 'art' };
      if (d.karten.includes(name)) return { fehler: 'hat' };
      const preis = EINZEL_PREIS[p.stufe]; if ((d.cr | 0) < preis) return { fehler: 'geld' };
      d.cr -= preis; d.karten.push(name); speichern(); return { ok: i };
    },
    get wahl(){   // V11.8: keine 3-Spieler-Auswahl mehr – alte offene Auswahl wird automatisch zu einem Spieler
      if (d.wahl && d.wahl.karten && d.wahl.karten.length){ const n = d.wahl.karten[(Math.random() * d.wahl.karten.length) | 0]; d.wahl = null; if (!d.karten.includes(n)) d.karten.push(n); speichern(); try { toast('🎴 ' + n + ' aus deinem Pack!'); } catch (e) {} }
      return null; },
    kaufPackZiehen(pk){   // V11.8: Spieler für ein gekauftes Pack festlegen (eins kommt raus), dann normale Pack-Animation
      const pool = this.packPool(pk.art).filter(i => !d.packs.some(x => x !== pk && x.karte === PLAYER_DATABASE[i].name));
      if (!pool.length){ const n = d.packs.indexOf(pk); if (n >= 0) d.packs.splice(n, 1); d.cr += PACK_PREIS[pk.art] || 0; speichern(); return null; }
      if (!pk.karte){ pk.karte = PLAYER_DATABASE[pool[(Math.random() * pool.length) | 0]].name; speichern(); }
      return pk.karte; },
    karteWaehlen(name){
      if (!d.wahl || !d.wahl.karten.includes(name)) return false;
      const i = idxVon(name); d.wahl = null; if (i >= 0 && !d.karten.includes(name)) d.karten.push(name); speichern(); return i;
    },
    // alte, noch ungeöffnete Packs bleiben öffnbar
    packVerdienen(){ return null; },
    get packs(){ return d.packs; },
    packOeffnen(n){
      const pk = d.packs[n]; if (!pk) return null;
      d.packs.splice(n, 1);
      if (pk.karte && !d.karten.includes(pk.karte)) d.karten.push(pk.karte);
      speichern(); return pk;
    },
    get titel(){ return d.titel || 0; },
    titelPlus(){ d.titel = (d.titel || 0) + 1; speichern(); return d.titel; },
    sammlung(){ return d.karten.length; },
    // Sicherungscode: kompletter Spielstand als Text
    code(){ try { return 'SC1-' + btoa(unescape(encodeURIComponent(JSON.stringify(d)))); } catch (e) { return ''; } },
    laden(code){
      try {
        const x = JSON.parse(decodeURIComponent(escape(atob(String(code).trim().replace(/^SC1-/, '')))));
        if (!x || x.v !== 1 || typeof x.sp !== 'object') return false;
        d = Object.assign(leer(), { m41: false, cr: undefined }, x); if (typeof d.starterGiven !== 'boolean') d.starterGiven = !!(d.packs && d.packs.some(pk => pk && pk.quelle === 'starter')) || !!(d.karten && d.karten.length) || !!(d.titel) || !!(d.sp && Object.keys(d.sp).length);
        umstellen(d); speichern(); return true;
      } catch (e) { return false; }
    }
  };
})();