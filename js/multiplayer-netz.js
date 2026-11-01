/* Silescrow Cup V 4.2 – js/multiplayer-netz.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */


// =====================================================================
// MEHRSPIELER-RAUM  (Raumcode, zweites Handy, über die Raum-Funktion von claude.ai)
// Gastgeber rechnet das Spiel, der Gast schickt nur seine Eingaben.
// =====================================================================
const NETZ = (() => {
  let raum = null, rolle = null, code = null, modus = 'zusammen', partner = false;
  let letztesSetup = null, zaehler = { sR: 0, sH: 0, pa: 0, sz: 0, wx: 0, fl: 0, fh: 0 }, ein = { x: 0, z: 0, sp: 0 }, einT = 0;
  let aendern = () => {}, wechsel = () => {};
  // V3.64 Lobby mit Namen: eigener Name (max. 12 Zeichen), Namen der Gäste und des Gastgebers
  let meinName = '', hostName = '', lobbyNamen = {}, lobbySlots = {}, letztesTurnierSig = '', letztesLigaSig = '';
  const saubern = t => String(t == null ? '' : t).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);

  // Ersatz für lokale Tests (nur wenn die Seite nicht in claude.ai läuft)
  function atrappe(){
    const ich = Math.random().toString(36).slice(2);
    return { join: async name => {
      const bc = new BroadcastChannel('sc-raum-' + name), andere = new Map(); let meins = {}; const hoerer = [];
      const liefern = () => { const peers = [{ peer: ich, isMe: true, sameTab: true, presence: meins },
        ...[...andere].map(([k, v]) => ({ peer: k, isMe: false, sameTab: false, presence: v }))];
        hoerer.forEach(f => f({ peers, joined: [], left: [], updated: [] })); };
      bc.onmessage = e => { const m = e.data;
        if (m.typ === 'p'){ andere.set(m.id, m.p); liefern(); }
        if (m.typ === 'hallo') bc.postMessage({ typ: 'p', id: ich, p: meins });
        if (m.typ === 'weg'){ andere.delete(m.id); liefern(); } };
      bc.postMessage({ typ: 'hallo', id: ich });
      return { name,
        presence: async patch => { meins = { ...meins }; for (const k in patch){ if (patch[k] === null) delete meins[k]; else meins[k] = patch[k]; } bc.postMessage({ typ: 'p', id: ich, p: meins }); },
        onPeers: f => { hoerer.push(f); setTimeout(liefern, 0); return () => {}; },
        peers: () => [], connected: () => true,
        leave: async () => { bc.postMessage({ typ: 'weg', id: ich }); bc.close(); } };
    } };
  }
  // Raum ohne Claude-Konto: PeerJS verbindet zwei Handys direkt (kostenloser Vermittler, kein eigener Server)
  function peerRaum(){
    return { join: (name, rolle) => new Promise((fertig, fehl) => {
      const code = String(name).replace(/^sc-/, ''), hostId = 'silescrow-cup-' + code;
      let meins = {}, bereit = false, zu = false;
      const conns = new Map(), rttMap = new Map();          // Verbindung -> Status des Gegenübers (Gastgeber: mehrere, Gast: nur der Gastgeber)
      const hoerer = [];
      let vpAlt = '';
      const liefern = () => {
        if (rolle === 'host'){ const vp = [...conns.keys()].filter(c => c.open).map(c => String(c.peer)), sig = vp.join(','); if (sig !== vpAlt){ vpAlt = sig; meins = { ...meins, vp }; setTimeout(() => { try { sendeAlle({ vp }); if (typeof voiceNeu === 'function') voiceNeu(); } catch (e) {} }, 0); } }
        const peers = [{ peer: 'ich', isMe: true, sameTab: true, presence: meins }];
        conns.forEach((pr, c) => { if (pr) peers.push({ peer: String(c.peer), isMe: false, sameTab: false, presence: pr }); });
        hoerer.forEach(f => f({ peers, joined: [], left: [], updated: [] }));
      };
      const sende = (c, d) => { try { if (c && c.open) c.send(d ? { typ: 'd', d } : { typ: 'p', p: meins }); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} };   // V4.1: danach nur noch Änderungen senden
      const sendeAlle = d => conns.forEach((pr, c) => sende(c, d));
      const verbinden = c => {
        conns.set(c, null);
        // V4.1: Herzschlag – bricht die Leitung ab, wird das nach ca. 8 s erkannt (nicht erst nach 30 s)
        let letzt = Date.now(), tick = Date.now();
        const hb = setInterval(() => {
          const n = Date.now(); if (n - tick > 5000) letzt = n; tick = n;   // Handy war im Hintergrund: nicht sofort trennen
          try { if (c.open) c.send({ typ: 'h', t: n }); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
          if (c.open && n - letzt > 8000){ clearInterval(hb); try { c.close(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} conns.delete(c); liefern(); }
        }, 2000);
        c.on('open', () => { letzt = Date.now(); sende(c); if (!bereit){ bereit = true; fertig(raum); } });
        c.on('data', m => {
          letzt = Date.now();
          if (m && m.typ === 'h' && m.t){ try { c.send({ typ: 'hr', t: m.t }); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
          else if (m && m.typ === 'hr' && m.t){ rttMap.set(c, Date.now() - m.t); }
          else if (m && m.typ === 'p'){ conns.set(c, m.p); liefern(); }
          else if (m && m.typ === 'd' && m.d){ const neu = Object.assign({}, conns.get(c) || {}); for (const k in m.d){ if (m.d[k] === null) delete neu[k]; else neu[k] = m.d[k]; } conns.set(c, neu); liefern(); if (m.d.vp) try { voiceNeu(); } catch (e) {} }
        });
        c.on('close', () => { clearInterval(hb); conns.delete(c); rttMap.delete(c); liefern(); });
        c.on('error', () => {});
      };
      let peer;
      try { peer = rolle === 'host' ? new window.Peer(hostId, { debug: 0 }) : new window.Peer(undefined, { debug: 0 }); }
      catch (e) { return fehl(new Error('kein-raum')); }
      const uhr = setTimeout(() => { if (!bereit){ try { peer.destroy(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} fehl(new Error('zeit')); } }, 12000);
      // V9.0: Voice-Chat – jeder ruft jeden an (Gastgeber verteilt die Peer-IDs), Mikro an/aus über track.enabled
      const anrufe = new Map(); let mic = null;
      const audioFuer = (id, st) => { let a = document.getElementById('vc-' + id); if (!a){ a = document.createElement('audio'); a.id = 'vc-' + id; a.autoplay = true; a.setAttribute('playsinline', ''); document.body.appendChild(a); } a.srcObject = st; a.muted = !(mic && mic.getAudioTracks().some(t => t.enabled)); try { const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} };
      const binde = call => { const alt = anrufe.get(call.peer); if (alt && alt !== call){ try { alt.close(); } catch (e) {} } anrufe.set(call.peer, call);
        call.on('stream', st => audioFuer(call.peer, st));
        call.on('close', () => { if (anrufe.get(call.peer) === call) anrufe.delete(call.peer); const a = document.getElementById('vc-' + call.peer); if (a) a.remove(); });
        call.on('error', () => {}); };
      try { peer.on('call', call => { try { call.answer(mic || undefined); binde(call); } catch (e) {} }); } catch (e) {}
      const andereIds = () => { const ids = new Set(); conns.forEach((pr, c) => { if (c.open) ids.add(String(c.peer)); if (pr && Array.isArray(pr.vp)) pr.vp.forEach(x => ids.add(String(x))); }); ids.delete(String(peer.id)); return [...ids]; };
      const alleAnrufen = () => { if (!mic) return; andereIds().forEach(id => { try { binde(peer.call(id, mic)); } catch (e) {} }); };
      const voice = {
        async an(){ if (!mic){ mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); alleAnrufen(); } mic.getAudioTracks().forEach(t => t.enabled = true); document.querySelectorAll('audio[id^="vc-"]').forEach(a => { a.muted = false; try { const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }); return 'an'; },
        aus(){ if (mic) mic.getAudioTracks().forEach(t => t.enabled = false); document.querySelectorAll('audio[id^="vc-"]').forEach(a => { a.muted = true; }); return 'aus'; },
        get status(){ return !mic ? 'aus' : mic.getAudioTracks().some(t => t.enabled) ? 'an' : 'aus'; },
        stopp(){ anrufe.forEach(c => { try { c.close(); } catch (e) {} }); anrufe.clear(); if (mic){ mic.getTracks().forEach(t => t.stop()); mic = null; } document.querySelectorAll('audio[id^="vc-"]').forEach(a => a.remove()); }
      };
      peer.on('error', e => {
        if (!bereit){ clearTimeout(uhr); fehl(new Error(e && e.type === 'unavailable-id' ? 'code-belegt' : e && e.type === 'peer-unavailable' ? 'nicht-gefunden' : 'fehler')); }
      });
      peer.on('disconnected', () => { try { if (!zu && !peer.destroyed) peer.reconnect(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} });
      const voiceNeu = () => { if (mic) setTimeout(() => { andereIds().forEach(id => { if (!anrufe.has(id)) try { binde(peer.call(id, mic)); } catch (e) {} }); }, 400); };
      const raum = { name, voice,
        presence: async patch => { meins = { ...meins }; for (const k in patch){ if (patch[k] === null) delete meins[k]; else meins[k] = patch[k]; } sendeAlle(patch); },
        onPeers: f => { hoerer.push(f); setTimeout(liefern, 0); return () => {}; },
        peers: () => [], connected: () => [...conns.keys()].some(c => c.open),
        ping: () => { const v = [...rttMap.values()]; return v.length ? Math.max(...v) : null; },   // V4.5
        leave: async () => { zu = true; try { voice.stopp(); } catch (e) {} conns.forEach((pr, c) => { try { c.close(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }); try { peer.destroy(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} } };
      peer.on('open', () => {
        if (rolle === 'host'){
          peer.on('connection', c => { if (conns.size >= 8){ try { c.close(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} return; } verbinden(c); });
          clearTimeout(uhr); bereit = true; fertig(raum);
        } else {
          verbinden(peer.connect(hostId, { reliable: true, serialization: 'json' }));
        }
      });
    }) };
  }
  async function raumFunktion(){
    if (window.claude && typeof window.claude.use === 'function'){
      try { const r = await window.claude.use('room'); if (r) return r; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    }
    if (typeof window.Peer === 'function') return peerRaum();
    if (location.protocol === 'file:' && typeof BroadcastChannel !== 'undefined') return atrappe();
    return null;
  }
  async function betreten(name, rolle){
    const r = await raumFunktion();
    if (!r) throw new Error('kein-raum');
    return r.join(name, rolle);
  }

  // --- Gastgeber: bis zu 3 Gäste (gesamt 4 Menschen). Reihenfolge = Beitrittszeit, Plätze 1–3 ---
  let hostHalle = false, gaeste = [], voll = [], letztePub = '', vergeben = [], akzeptiert = {}, hostTeam = null, onlineModus = 'freund', hostModus = 'freund', teamZu = {}, hostTz = {};   // V4.3: Gast -> Team (0 = Team des Gastgebers, 1 = Gegnerteam)   // V5.0: 'freund' = Freundschaftsspiel, 'cup' = Online-Cup
  const gid = (() => {   // V4.1: gleiche Kennung nach Neuladen, damit der alte Platz wieder zugeordnet wird
    try { let g = sessionStorage.getItem('sc_gid'); if (!g){ g = Math.random().toString(36).slice(2, 8); sessionStorage.setItem('sc_gid', g); } return g; }
    catch (e) { return Math.random().toString(36).slice(2, 8); }
  })();
  let chatBei = () => {}, rvBei = () => {}, chatGesehen = {}, rvGesehen = {}, gastCmInit = false, gastCmSeen = null;   // V4.5
  let wahl = null, ws = 0, meinPlatz = null, abgelehnt = false, vergebenGast = [], meinNr = null, meinPos = null, ps = 0;
  const modusEff = () => 'zusammen';   // online spielen immer alle zusammen in einem Team
  function veroeffentlichen(){
    if (!raum || rolle !== 'host') return;
    const pub = { hn: meinName, nm: Object.fromEntries(gaeste.map(g => [g.gid, g.nm || ('Gast ' + g.k)])), slots: Object.fromEntries(gaeste.map(g => [g.gid, g.k])), voll, vergeben, akzeptiert, modus: modusEff(), om: onlineModus, tz: teamZu, tm: hostTeam, hl: hostHalle ? 1 : 0 };   // HALL OF FAME: Spielort
    const j = JSON.stringify(pub); if (j === letztePub) return; letztePub = j;
    raum.presence(pub);
  }
  function hostPeers(ch){
    const gesehen = new Set(), liste = [];
    ch.peers.filter(p => !p.sameTab && p.presence && p.presence.rolle === 'gast' && p.presence.gid).forEach(p => {
      const pr = p.presence; if (gesehen.has(pr.gid)) return; gesehen.add(pr.gid);
      liste.push({ gid: pr.gid, nm: saubern(pr.nm), jt: +pr.jt || 0, wahl: pr.wahl == null ? null : +pr.wahl, ws: +pr.ws || 0, e: pr.e || null, nr: pr.nr == null ? null : +pr.nr, pos: pr.pos || null, ps: +pr.ps || 0, fuer: pr.fuer == null ? null : +pr.fuer, gt: pr.gt || null, chat: pr.chat || null, rv: pr.rv || null });
    });
    liste.sort((a, b) => a.jt - b.jt || (a.gid < b.gid ? -1 : 1));
    // V4.5: Schnell-Chat und Revanche-Wunsch der Gäste
    liste.forEach(g => {
      if (!(g.gid in chatGesehen)) chatGesehen[g.gid] = g.chat ? g.chat.id : null;
      else if (g.chat && g.chat.id !== chatGesehen[g.gid]){
        chatGesehen[g.gid] = g.chat.id; const nm = g.nm || 'Gast';
        try { chatBei(nm, g.chat.i); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
        try { raum.presence({ cm: { id: Math.random().toString(36).slice(2, 8), g: g.gid, v: nm, i: g.chat.i } }); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      }
      if (!(g.gid in rvGesehen)) rvGesehen[g.gid] = g.rv || null;
      else if (g.rv && g.rv !== rvGesehen[g.gid]){ rvGesehen[g.gid] = g.rv; try { rvBei(g.nm || 'Gast'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
    });
    const vorher = gaeste.length;
    const lauf = !!(SPIEL.zustand && SPIEL.zustand.fern && SPIEL.laeuft);
    if (lauf){
      // im Spiel bleiben die Plätze fest
      const fest = SPIEL.zustand.setup.plaetze || {};
      gaeste = liste.filter(g => fest[g.gid]).map(g => ({ ...g, k: fest[g.gid] }));
      gaeste.forEach(g => { SPIEL.fernZurueck(g.k - 1); if (g.e) SPIEL.fernEingabe(g.e, g.k - 1); });
      Object.keys(fest).forEach(id => { if (!liste.some(g => g.gid === id)) SPIEL.fernWeg(fest[id] - 1); });
      voll = [];
    } else {
      gaeste = liste.slice(0, 3).map((g, i) => ({ ...g, k: i + 1 }));
      voll = liste.slice(3).map(g => g.gid);
      // V4.9: neue Gäste automatisch verteilen (Blau = Team des Gastgebers, max. 3 Menschen), manuelle Wahl bleibt
      { let blau = 1 + gaeste.filter(g => (g.gid in teamZu) && teamZu[g.gid] !== 1).length;
        gaeste.forEach(g => { if (!(g.gid in teamZu)){ if (blau < 3){ teamZu[g.gid] = 0; blau++; } else teamZu[g.gid] = 1; } }); }
    }
    if (gaeste.length !== vorher) wechsel(gaeste.length, 'host', vorher);
    veroeffentlichen();
    aendern();
  }
  function gastPeers(ch){
    const hst = ch.peers.find(p => !p.sameTab && p.presence && p.presence.rolle === 'host');
    const vorher = partner; partner = !!hst;
    if (partner !== vorher) wechsel(partner ? 1 : 0, 'gast', vorher ? 1 : 0);
    if (!hst) gastCmInit = false;
    if (!hst && vorher){   // V4.1: Gastgeber getrennt -> Meldung und zurück ins Menü
      letztesSetup = null; letztesTurnierSig = ''; letztesLigaSig = '';
      try { if (SPIEL.gast) SPIEL.beenden(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      try { const tb = document.getElementById('turnier'); if (tb) tb.hidden = true; const lb = document.getElementById('liga'); if (lb) lb.hidden = true; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      try { toast('Verbindung verloren – Gastgeber getrennt'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    }
    if (hst){
      const pr = hst.presence;
      meinPlatz = pr.slots && pr.slots[gid] ? pr.slots[gid] : (pr.voll && pr.voll.indexOf(gid) >= 0 ? 'voll' : null);
      vergebenGast = pr.vergeben || []; hostTeam = pr.tm || null; hostHalle = !!pr.hl; hostModus = 'freund'; hostTz = pr.tz || {}; if (hostTz[gid] === 1 && wahl != null){ wahl = null; ws++; raum.presence({ wahl: null, ws }); }
      { const cm = pr.cm; if (!gastCmInit){ gastCmInit = true; gastCmSeen = cm ? cm.id : null; }
        else if (cm && cm.id !== gastCmSeen){ gastCmSeen = cm.id; if (cm.g !== gid){ try { chatBei(saubern(cm.v), cm.i); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} } } }   // V4.5
      hostName = saubern(pr.hn); lobbySlots = pr.slots || {}; lobbyNamen = {}; if (pr.nm) for (const k in pr.nm) lobbyNamen[k] = saubern(pr.nm[k]);
      const a = pr.akzeptiert && pr.akzeptiert[gid];
      if (a && a[0] === ws && wahl != null && a[1] == null){ wahl = null; ws++; abgelehnt = true; raum.presence({ wahl: null, ws }); }
      const su = pr.su;
      if (su && su.id !== letztesSetup && meinPlatz !== 'voll' && (!su.plaetze || su.plaetze[gid])){ letztesSetup = su.id; zaehler = { sR: 0, sH: 0, pa: 0, sz: 0, wx: 0, fl: 0, fh: 0 }; SPIEL.starteGast(su); }
      if (!su && letztesSetup && SPIEL.gast){ letztesSetup = null; letztesTurnierSig = null; letztesLigaSig = null; SPIEL.beenden(); }   // V4.1: Baum nach dem Spiel beim Gast immer neu zeigen
      if (pr.st) SPIEL.gastEmpfang(pr.st);
      // Baum auf dem Gastgerät mit dem vom Gastgeber veröffentlichten Stand aktualisieren.
      if (pr.tb && typeof TURNIER !== 'undefined' && typeof TURNIER.syncOnline === 'function') {
        const sig = JSON.stringify(pr.tb);
        if (sig !== letztesTurnierSig) { letztesTurnierSig = sig; TURNIER.syncOnline(pr.tb); }
      }
      // V6.4: Liga-Tabelle des Gastgebers beim Mitspieler anzeigen
      if (pr.lg && typeof LIGA !== 'undefined' && typeof LIGA.syncOnline === 'function') {
        const sigL = JSON.stringify(pr.lg);
        if (sigL !== letztesLigaSig) { letztesLigaSig = sigL; LIGA.syncOnline(pr.lg); }
      }
    }
    aendern();
  }

  return {
    get rolle(){ return rolle; }, get code(){ return code; },
    get partner(){ return rolle === 'host' ? gaeste.length > 0 : partner; },
    get anzahl(){ return rolle === 'host' ? gaeste.length + 1 : (partner ? 2 : 0); },
    get gaeste(){ return gaeste; }, get gid(){ return gid; }, get meinPlatz(){ return meinPlatz; },
    get vergebenGast(){ return vergebenGast; }, get wahl(){ return wahl; },
    get onlineModus(){ return rolle === 'gast' ? hostModus : onlineModus; },
    setOnlineModus(m){ if (rolle !== 'host') return; onlineModus = 'freund'; veroeffentlichen(); aendern(); },
    teamVon(id){ return ((rolle === 'gast' ? hostTz : teamZu)[id] === 1) ? 1 : 0; },
    setGastTeam(id, t){ if (rolle !== 'host') return; teamZu[id] = t === 1 ? 1 : 0; veroeffentlichen(); aendern(); },
    get name(){ return meinName; },
    setName(t){
      meinName = saubern(t);
      if (!raum) return;
      if (rolle === 'host'){ veroeffentlichen(); aendern(); }
      else if (rolle === 'gast'){ raum.presence({ nm: meinName }); aendern(); }
    },
    // Lobby für den Gast: Gastgeber zuerst, dann die Gäste nach Platz
    get lobbyGast(){
      const l = [{ name: hostName || 'Gastgeber', host: true, ich: false, team: 0 }];
      Object.keys(lobbySlots).sort((a, b) => lobbySlots[a] - lobbySlots[b]).forEach(k => {
        const ich = k === gid;
        l.push({ name: (ich ? meinName : lobbyNamen[k]) || lobbyNamen[k] || ('Gast ' + lobbySlots[k]), host: false, ich, team: hostTz[k] === 1 ? 1 : 0 });
      });
      return l;
    },
    // V4.5: Schnell-Chat, Revanche-Wunsch, Ping
    chatSenden(i){ if (!raum) return; const id = Math.random().toString(36).slice(2, 8);
      if (rolle === 'gast') raum.presence({ chat: { id, i } }); else if (rolle === 'host') raum.presence({ cm: { id, g: null, v: meinName || 'Gastgeber', i } }); },
    revanche(){ if (raum && rolle === 'gast') raum.presence({ rv: Math.random().toString(36).slice(2, 8) }); },
    get ping(){ try { return raum && raum.ping ? raum.ping() : null; } catch(e){ return null; } },
    set beiChat(f){ chatBei = f; }, set beiRevanche(f){ rvBei = f; },
    get abgelehnt(){ const a = abgelehnt; abgelehnt = false; return a; },
    voiceAn: () => (raum && raum.voice) ? raum.voice.an() : Promise.reject(new Error('kein-voice')), voiceAus: () => raum && raum.voice ? raum.voice.aus() : 'aus', get voiceStatus(){ return raum && raum.voice ? raum.voice.status : 'aus'; }, get voiceMoeglich(){ return !!(raum && raum.voice); },
    get modus(){ return modus; }, get modusEff(){ return modusEff(); },
    set beiAenderung(f){ aendern = f; }, set beiWechsel(f){ wechsel = f; },
    async erstellen(){
      await this.verlassen();
      let c = null;
      for (let versuch = 0; versuch < 6 && !raum; versuch++){
        c = String(1000 + Math.floor(Math.random() * 9000));
        try { raum = await betreten('sc-' + c, 'host'); }
        catch (e) { if (!e || e.message !== 'code-belegt') throw e; }
      }
      if (!raum) throw new Error('code-belegt');
      rolle = 'host'; code = c; partner = false; gaeste = []; voll = []; letztePub = '';
      raum.presence({ rolle: 'host', modus });
      raum.onPeers(hostPeers, () => { gaeste = []; aendern(); });
      aendern(); return c;
    },
    async beitreten(c){
      await this.verlassen();
      raum = await betreten('sc-' + c, 'gast');
      rolle = 'gast'; code = c; partner = false; gastCmInit = false; letztesSetup = null; wahl = null; ws = 0; meinPlatz = null; vergebenGast = []; meinNr = null; meinPos = null; ps = 0;
      raum.presence({ rolle: 'gast', gid, nm: meinName, jt: Date.now(), wahl: null, ws: 0, e: { ...ein, t: { ...zaehler } } });
      raum.onPeers(gastPeers, () => { partner = false; aendern(); });
      aendern();
    },
    async verlassen(){
      if (raum){ try { await raum.leave(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
      raum = null; rolle = null; code = null; partner = false; gastCmInit = false; chatGesehen = {}; rvGesehen = {}; letztesSetup = null; letztesTurnierSig = ''; gaeste = []; voll = []; letztePub = ''; hostModus = 'freund'; teamZu = {}; hostTz = {}; hostName = ''; lobbyNamen = {}; lobbySlots = {}; wahl = null; meinPlatz = null; vergebenGast = []; aendern();
    },
    // Gastgeber: welche Spieler sind schon vergeben, und wessen Wahl wurde angenommen
    gaesteInfo(verg, akz, team){ vergeben = verg; akzeptiert = akz; if (team !== undefined) hostTeam = team; veroeffentlichen(); },
    get hostTeam(){ return hostTeam; },
    get hostHalle(){ return hostHalle; }, halleSetzen(v){ hostHalle = !!v; veroeffentlichen(); },
    // Gast: eigenen Spieler wählen (null = Wahl zurücknehmen)
    waehle(idx){ wahl = idx; ws++; meinNr = null; meinPos = null; ps++; if (raum && rolle === 'gast') raum.presence({ wahl: idx, ws, nr: null, pos: null, ps, fuer: idx }); },
    // Gast: Trikotnummer / Position des eigenen Spielers (wie beim Gastgeber); der Gastgeber übernimmt sie
    get meinNr(){ return meinNr; }, get meinPos(){ return meinPos; },
    setzeSpieler(o){
      if (wahl == null) return;
      if (o.nr !== undefined) meinNr = o.nr;
      if (o.pos !== undefined) meinPos = o.pos;
      ps++; if (raum && rolle === 'gast') raum.presence({ nr: meinNr, pos: meinPos, ps, fuer: wahl });
      aendern();
    },
    // V4.2: Gast im Gegnerteam meldet sein eigenes 5er-Team an den Gastgeber (null = zurücknehmen)
    teamMelden(tm){ if (raum && rolle === 'gast') raum.presence({ gt: tm || null }); },
    setup(su){ if (raum && rolle === 'host') raum.presence({ su: su || null, st: null }); },
    zustand(z){ if (raum && rolle === 'host') raum.presence({ st: z }); },
    // Online-Turnierstand wird vom Gastgeber an alle verbundenen Geräte verteilt.
    turnierState(tb){ if (raum && rolle === 'host') raum.presence({ tb: tb || null }); },
    ligaState(lg){ if (raum && rolle === 'host') raum.presence({ lg: lg || null }); },   // V6.4
    eingabe(e){
      const jetzt = performance.now();
      if (e.x === ein.x && e.z === ein.z && e.sp === ein.sp && jetzt - einT < 400) return;
      ein = e; einT = jetzt;
      if (raum && rolle === 'gast') raum.presence({ e: { ...ein, t: { ...zaehler } } });
    },
    taste(name){ zaehler[name]++; if (raum && rolle === 'gast') raum.presence({ e: { ...ein, t: { ...zaehler } } }); }
  };
})();


// ===== V4.5: Verbindungsanzeige, Schnell-Chat, Revanche-Hinweis =====
(function(){
  const SPRUECHE = ['👍 Gut gespielt!', '🔥 Tolles Tor!', '😮 Knapp!', '😂 Haha!', '🤝 Fairplay', '🔁 Nochmal?', '⏳ Moment, gleich da', '🏆 GG!'];
  const st = document.createElement('style');
  st.textContent = '#netzBox{position:fixed;right:calc(10px + env(safe-area-inset-right,0px));top:calc(58px + env(safe-area-inset-top,0px));z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-family:Arial,sans-serif}'
    + '#netzBox.menue{top:auto;bottom:calc(14px + env(safe-area-inset-bottom,0px));flex-direction:column-reverse}'
    + '#netzBox[hidden]{display:none}'
    + '#micKnopf{width:40px;height:40px;border:3px solid #000;border-radius:10px;background:#4b5878;box-shadow:0 3px 0 #000;padding:0;cursor:pointer;display:grid;place-items:center}'
    + '#micKnopf.an{background:#22c55e}#micKnopf[hidden]{display:none}'
    + '#chatKnopf{width:40px;height:40px;border:3px solid #000;border-radius:10px;background:#ffe234;box-shadow:0 3px 0 #000;font-size:19px;padding:0;cursor:pointer;display:grid;place-items:center}'
    + '#netzPing{background:rgba(10,18,51,.88);color:#fff;border:2px solid #000;border-radius:8px;padding:2px 8px;font-weight:800;font-size:12px;white-space:nowrap}'
    + '#netzPing i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}'
    + '#chatWahl{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:rgba(10,18,51,.96);border:3px solid #000;border-radius:12px;padding:8px;width:min(270px,72vw)}'
    + '#chatWahl[hidden]{display:none}'
    + '#chatWahl button{min-height:42px;border:2px solid #000;border-radius:9px;background:#fff;color:#0b1430;font-weight:800;font-size:13px;padding:4px 6px;cursor:pointer}'
    + '#chatBlasen{position:fixed;left:50%;transform:translateX(-50%);top:calc(84px + env(safe-area-inset-top,0px));z-index:31;display:flex;flex-direction:column;gap:4px;align-items:center;pointer-events:none;font-family:Arial,sans-serif}'
    + '.chatBlase{background:#fff;color:#0b1430;border:3px solid #000;border-radius:14px;padding:5px 12px;font-weight:800;font-size:15px;box-shadow:0 3px 0 #000;max-width:80vw;text-align:center}';
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'netzBox'; box.hidden = true;
  box.innerHTML = '<div id="netzPing" hidden></div><button id="chatKnopf" type="button" aria-label="Schnell-Chat">💬</button><button id="micKnopf" type="button" aria-label="Sprach-Chat" class="aus"></button><div id="chatWahl" hidden></div>';
  document.body.appendChild(box);
  const blasen = document.createElement('div'); blasen.id = 'chatBlasen'; document.body.appendChild(blasen);
  const $i = id => document.getElementById(id), wahl = $i('chatWahl'), ping = $i('netzPing');
  ['touchstart', 'touchmove', 'touchend', 'pointerdown'].forEach(ev => box.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
  let letzte = 0;
  function zeige(name, i){
    const t = SPRUECHE[i]; if (t == null) return;
    const d = document.createElement('div'); d.className = 'chatBlase'; d.textContent = (name ? name + ': ' : '') + t;
    blasen.appendChild(d); while (blasen.children.length > 3) blasen.removeChild(blasen.firstChild);
    setTimeout(() => { try { d.remove(); } catch(e){} }, 4000);
  }
  SPRUECHE.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t;
    b.addEventListener('click', () => { const n = Date.now(); if (n - letzte < 1200) return; letzte = n; NETZ.chatSenden(i); zeige('Du', i); wahl.hidden = true; });
    wahl.appendChild(b); });
  $i('chatKnopf').addEventListener('click', () => { wahl.hidden = !wahl.hidden; });
  // V9.0: online springt die Steuerung nach dem Pass/bei Ballgewinn automatisch wie offline; Sprach-Chat – Mikro an/aus
  { const mk = $i('micKnopf');
    const MIC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="#fff"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>';
    const zeichne = () => { const an = NETZ.voiceStatus === 'an'; mk.classList.toggle('an', an); mk.classList.toggle('aus', !an); mk.innerHTML = MIC + (an ? '' : '<path d="M4 4l16 16" stroke="#ff4b4b" stroke-width="3"/>') + '</svg>'; mk.title = an ? 'Sprach-Chat an – tippen zum Ausschalten' : 'Sprach-Chat aus – tippen zum Einschalten'; };
    zeichne();
    mk.addEventListener('click', async () => {
      if (!NETZ.voiceMoeglich){ try { toast('Sprach-Chat geht nur online im Raum.'); } catch (e) {} return; }
      if (NETZ.voiceStatus === 'an'){ NETZ.voiceAus(); zeichne(); try { toast('🔇 Sprach-Chat aus'); } catch (e) {} return; }
      try { await NETZ.voiceAn(); zeichne(); try { toast('🎤 Sprach-Chat an – ihr hört und sprecht miteinander (mit Kopfhörern kein Echo)'); } catch (e) {} }
      catch (e) { zeichne(); try { toast('Mikrofon nicht erlaubt – bitte in den Browser-Einstellungen freigeben.'); } catch (x) {} }
    });
    setInterval(zeichne, 1500); }
  NETZ.beiChat = (name, i) => zeige(name, i);
  NETZ.beiRevanche = name => {
    try { toast('🔁 ' + name + ' will Revanche!'); } catch(e){}
    try { if (!$i('spiel').hidden) SPIEL.hinweis('🔁 ' + name + ' will Revanche!', 4); } catch(e){}
    const nb = $i('nochmal'); if (nb && !nb.hidden && /REVANCHE|NOCHMAL/.test(nb.textContent)) nb.textContent = '🔁 REVANCHE (' + name + ' wartet)';
  };
  function aktualisieren(){
    let an = false;
    try { an = !!(NETZ.rolle && NETZ.partner); } catch(e){}
    box.hidden = !an;
    if (!an){ wahl.hidden = true; return; }
    box.classList.toggle('menue', $i('spiel').hidden);
    const p = NETZ.ping;
    if (p == null) ping.hidden = true;
    else { const f = p < 120 ? '#2fb344' : p < 300 ? '#f08c00' : '#e5484d'; ping.hidden = false; ping.innerHTML = '<i style="background:' + f + '"></i>' + Math.round(p) + ' ms'; }
  }
  setInterval(aktualisieren, 1500);
})();