/* Silescrow Cup V 4.2 – js/aufstellung-ui.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */

/* Mini-Aufstellung als letzte Seite im Team-Fenster des Hauptmenüs – Antippen öffnet den Aufstellungs-Editor */
// V3.07: Online + Hall of Fame -> Aufstellung als Halle (Torwart + 4), ohne zu speichern
function onlineHalleAktiv(){
  try {
    if (!halleWahl) return false;
    const L = fwOnlineLage();
    if (L.online || L.gast) return true;
    if (NETZ.rolle) return true;   // Raum erstellt/betreten, auch wenn noch kein Mitspieler da ist
    const sichtbar = id => { const e = document.getElementById(id); return !!(e && !e.hidden && e.offsetParent !== null); };
    return sichtbar('vsUeber') || sichtbar('mpUeber');
  } catch (e) { return false; }
}
function aufMiniBauen(){
  aufNrCSS();
  if (onlineHalleAktiv()){   // V3.07: Online-Halle – Mini-Aufstellung mit Torwart + 4
    const hk = window.__onHalleForm && HALLEN_FORMEN[window.__onHalleForm] ? window.__onHalleForm : hallenFormKey();
    const FH = HALLEN_FORMEN[hk], tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
    const aus = onlineHalleAuswahl(hk);
    const posX2 = fv => 50 + fv * 57, posY2 = fu => 78 - (fu + .72) / 1.06 * 64;
    const tk2 = (i, rolle, pos) => { const p = i != null ? PLAYER_DATABASE[i] : null, nr = i != null ? zustand.nummern[i] : null;
      return '<span class="am-tok ' + rolle + (p ? '' : ' leer') + '" style="' + pos + '"><span class="am-bild">' + (p ? '<img src="' + BILDER[p.bild] + '" alt="">' : '') + '</span>' + (p ? '<i>' + ((nr != null && nr !== '' && Number(nr) > 0) ? Number(nr) : '–') + '</i>' : '') + '</span>'; };
    let t2 = tk2(tw, 'TW', 'left:50%;top:90%');
    FH.forEach((f, k) => { t2 += tk2(aus[k], f.rolle, 'left:' + posX2(f.fv).toFixed(1) + '%;top:' + posY2(f.fu).toFixed(1) + '%'); });
    const lin2 = '<svg viewBox="0 0 110 150" preserveAspectRatio="none" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"><rect x="3" y="3" width="104" height="144"/><line x1="3" y1="75" x2="107" y2="75"/><circle cx="55" cy="75" r="11"/><rect x="28" y="3" width="54" height="22"/><rect x="28" y="125" width="54" height="22"/></svg>';
    const e2 = document.createElement('div');
    e2.className = 'aufmini'; e2.setAttribute('role', 'button'); e2.tabIndex = 0;
    e2.setAttribute('aria-label', 'Hallen-Aufstellung ' + hk + ' ansehen');
    e2.innerHTML = '<div class="am-pitch">' + lin2 + t2 + '</div><div class="am-info"><div class="am-t">' + (window.HALLE_ICON || '🏀') + ' HALLE 5 GEGEN 5</div><div class="am-f">' + hk + '</div><div class="am-b">✎ ÄNDERN</div><div class="am-bk">🪑 BANK ' + Math.min(BANK_GROESSE, (zustand.ersatz || []).length) + '/' + BANK_GROESSE + '</div></div>';
    const auf2 = () => { try { onlineHalleEditor(); } catch (er) { console.error('onlineHalle', er); } };
    e2.addEventListener('click', auf2);
    e2.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); auf2(); } });
    return e2;
  }
  const key = zustand.formation, slots = formSlots(key);
  const twIdx = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
  const zu = formZuweisen(formFeld(), key, zustand.formSlot);
  const bySlot = new Array(slots.length).fill(null); zu.forEach((sl, i) => { bySlot[sl] = i; });
  const posX = fv => 50 + fv * 57, posY = fu => 78 - (fu + .72) / 1.06 * 64;
  const tk = (i, rolle, pos) => {
    const p = i != null ? PLAYER_DATABASE[i] : null, nr = i != null ? zustand.nummern[i] : null;
    return '<span class="am-tok ' + rolle + (p ? '' : ' leer') + '" style="' + pos + '"><span class="am-bild">' + (p ? '<img src="' + BILDER[p.bild] + '" alt="">' : '') + '</span>' +
      (p ? '<i>' + ((nr != null && nr !== '' && Number(nr) > 0) ? Number(nr) : '–') + '</i>' : '') + '</span>';
  };
  let toks = tk(twIdx, 'TW', 'left:50%;top:90%');
  slots.forEach((sd, k) => { toks += tk(bySlot[k], sd.rolle, 'left:' + posX(sd.fv).toFixed(1) + '%;top:' + posY(sd.fu).toFixed(1) + '%'); });
  const linien = '<svg viewBox="0 0 110 150" preserveAspectRatio="none" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"><rect x="3" y="3" width="104" height="144"/><line x1="3" y1="75" x2="107" y2="75"/><circle cx="55" cy="75" r="11"/><rect x="28" y="3" width="54" height="22"/><rect x="28" y="125" width="54" height="22"/></svg>';
  const el = document.createElement('div');
  el.className = 'aufmini'; el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.setAttribute('aria-label', 'Aufstellung ' + key + ' und Trikotnummern bearbeiten');
  el.innerHTML = '<div class="am-pitch">' + linien + toks + '</div><div class="am-info"><div class="am-t">📋 AUFSTELLUNG</div><div class="am-f">' + key + '</div><div class="am-b">✎ ÄNDERN</div>' + (() => { const bn = (zustand.ersatz || []).length; return '<div class="am-bk' + (bn < BANK_GROESSE ? ' offen' : '') + '">🪑 BANK ' + bn + '/' + BANK_GROESSE + '</div>'; })() + '</div>';
  const auf = () => { try { formEditorOeffnen(); } catch (e) { console.error('formEditor', e); } };
  el.addEventListener('click', auf);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); auf(); } });
  return el;
}
function formKnopfAktualisieren(){ const a = document.getElementById('formAnz'); if (a) a.textContent = zustand.formation; angebotHinweis(); }
// V9.9: Hauptmenü zeigt „Angebot erhalten“, solange ein Transferangebot offen ist
function angebotHinweis(){ try { const fk = document.getElementById('formKnopf'); if (!fk || typeof STAND === 'undefined') return; const n = (STAND.daten.markt && STAND.daten.markt.ang || []).length;
  let b = document.getElementById('fkAng'); if (!b){ b = document.createElement('span'); b.id = 'fkAng'; b.textContent = '📩 Angebot erhalten'; fk.appendChild(b); }
  b.style.display = n ? 'block' : 'none';
  if (n > (angebotHinweis.zuletzt | 0)){ try { toast('📩 Angebot erhalten – schau in die Kaderliste'); } catch (e) {} } angebotHinweis.zuletzt = n; } catch (e) {} }
function formEditorOeffnen(vor, ziel){
  if (!ziel && onlineHalleAktiv()){ try { onlineHalleEditor(); return; } catch (e) { console.error('onlineHalle', e); } }   // V3.07: Online + Hall of Fame = Torwart + 4, Rest Bank/Reserve
  let ov = document.getElementById('formEditor');
  if (!ov){ ov = document.createElement('div'); ov.id = 'formEditor'; }
  { const ziehe = ziel || document.getElementById('flaeche'); if (ov.parentNode !== ziehe) ziehe.appendChild(ov); }
  ov.classList.toggle('fe-live', !!ziel); if (!ziel) ov._ende = null;
  ov.style.display = 'flex';
  let sel = null, msg = '';
  const posX = fv => 50 + fv * 57, posY = fu => 74 - (fu + .72) / 1.06 * 58;   // V10.0: Spieler weiter auseinander   // V9.9: Feld besser ausnutzen, Torwart nicht mehr abgeschnitten
  const bank = () => { const er = (zustand.ersatz || []).filter(i => PLAYER_DATABASE[i] && !zustand.squad.includes(i)); if (!ov.classList.contains('fe-live')) kartenRest(zustand.squad).forEach(i => { if (!er.includes(i)) er.push(i); }); return er; };   // V9.9: im Spiel nur die echte Bank   // V5.0: nur die 2 Auswechselspieler
  // Bankspieler <-> Feldspieler (oder freier Platz): das Team wird wirklich umgebaut
  function tauschBank(feldIdx, bankIdx, slotNr){
    if (ov._maxRein != null){   // V9.9: im Spiel – nur noch so viele Wechsel wie erlaubt, geplante Wechsel bleiben
      const st = ov._start || [], gi = ov._geplantIn || [];
      if (feldIdx != null && gi.includes(feldIdx)){ msg = 'Dieser Wechsel ist schon geplant.'; return false; }
      const jetzt = zustand.squad.slice(1).filter(i => !st.includes(i)).length;
      const danach = jetzt - (feldIdx != null && !st.includes(feldIdx) ? 1 : 0) + (!st.includes(bankIdx) ? 1 : 0);
      if (danach > ov._maxRein){ msg = ov._maxRein > 0 ? 'Nur noch ' + ov._maxRein + ' Wechsel möglich.' : 'Keine Wechsel mehr möglich.'; return false; }
    }
    if (feldIdx == null){
      if (zustand.squad.length >= maxHost()){ msg = 'Das Team ist voll – tausche mit einem Spieler.'; return false; }
      zustand.squad.push(bankIdx);
      { const ep = (zustand.ersatz || []).indexOf(bankIdx); if (ep >= 0){ zustand.ersatz.splice(ep, 1); ersatzSpeichern(); } }
    } else {
      const pos = zustand.squad.indexOf(feldIdx);
      if (pos < 0) return false;
      if (pos === 0 && ov.classList.contains('fe-live')){ msg = 'Den Torwart tauschst du über das Tor-Feld.'; return false; }   // V11.13: im Menü darf jeder ausgewechselt werden
      if (gastIdxMenge().has(feldIdx)){ msg = 'Dieser Platz gehört einem Mitspieler.'; return false; }
      zustand.squad[pos] = bankIdx;
      { const ep = (zustand.ersatz || []).indexOf(bankIdx); if (ep >= 0){ zustand.ersatz[ep] = feldIdx; ersatzSpeichern(); } else if (zustand.ersatz && !zustand.ersatz.includes(feldIdx) && zustand.ersatz.length < BANK_GROESSE){ zustand.ersatz.push(feldIdx); ersatzSpeichern(); } }   // V5.0: der Feldspieler geht auf die Bank
      zustand.nrManuell.delete(feldIdx);
      if (zustand.posManuell) delete zustand.posManuell[feldIdx];
      delete zustand.formSlot[feldIdx];
    }
    zustand.formSlot[bankIdx] = slotNr;
    formSpeichern(); aktualisiere();
    msg = PLAYER_DATABASE[bankIdx].name + ' ist jetzt im Team.';
    return true;
  }
  function zeichne(){
    const _fr0 = feRects(ov);   // V12: jede Änderung (Tausch, Formation, AUTOMATISCH) wird animiert
    const key = zustand.formation, slots = formSlots(key);
    const twIdx = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
    try { startNummern(zustand.nummern, twIdx, formFeld(), key, zustand.formSlot, zustand.nrManuell); } catch (e) {}   // V10.11: Startspieler 1–11
    const zu = formZuweisen(formFeld(), key, zustand.formSlot);
    const bySlot = new Array(slots.length).fill(null); zu.forEach((sl, i) => { bySlot[sl] = i; });
    const chip = k => '<button type="button" data-f="' + k + '" class="' + (k === key ? 'an' : '') + '">' + k + '</button>';
    const chips = FORM_REIHE.map(chip).join('');
    const tok = (cls, style, p, lab, attr) => '<button type="button" class="fe-tok ' + cls + '" ' + attr + ' style="' + style + '"><span class="fe-bild">' +
      (p ? '<img src="' + BILDER[p.bild] + '" alt="">' : '<em>+</em>') + (lab ? '<u>' + lab + '</u>' : '') + ((p && lab && posAbzug(p.pos, lab)) ? '<s class="fe-abz">−' + posAbzug(p.pos, lab) + '</s>' : '') + ((p && p.stufe) ? '<i class="fe-stern fs-' + p.stufe + '">★</i>' : '') + (p ? aufNrChip(PLAYER_DATABASE.indexOf(p), zustand.nummern[PLAYER_DATABASE.indexOf(p)]) : '') + '</span><b>' + (p ? p.name + ((lab || p.pos) ? ' <small class="fe-pp">' + (lab || p.pos) + '</small>' : '') : 'frei') + '</b></button>';
    let toks = tok('TW fix' + (twIdx == null ? ' leer' : '') + (sel && sel.t === 't' ? ' sel' : ''), 'left:50%;top:90%', twIdx != null ? PLAYER_DATABASE[twIdx] : null, 'TOR', 'data-fix="1"');
    slots.forEach((sd, k) => {
      const i = bySlot[k], p = i != null ? PLAYER_DATABASE[i] : null;
      const cls = sd.rolle + (p ? '' : ' leer') + (sel && sel.t === 's' && sel.k === k ? ' sel' : '');
      toks += tok(cls, 'left:' + posX(sd.fv).toFixed(1) + '%;top:' + posY(sd.fu).toFixed(1) + '%', p, sd.label, 'data-s="' + k + '"');
    });
    const bk = bank();
    aufBankNr(zustand.nummern, zustand.squad.concat(twIdx != null ? [twIdx] : []), bk);
    const bkIn = (zustand.ersatz || []).filter(i => PLAYER_DATABASE[i] && !zustand.squad.includes(i));
    const bankHtml = bankMitReserve(bk, bk.filter(i => bkIn.includes(i)).length, i => tok('BK' + (sel && sel.t === 'b' && sel.idx === i ? ' sel' : ''), '', PLAYER_DATABASE[i], '', 'data-b="' + i + '"'), 'Noch keine Auswechselspieler – wähle im Hauptmenü 2 Spieler für die Bank (BANK 1 und 2).');
    const linien = '<svg viewBox="0 0 110 150" preserveAspectRatio="none" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"><rect x="3" y="3" width="104" height="144"/><line x1="3" y1="75" x2="107" y2="75"/><circle cx="55" cy="75" r="11"/><circle cx="55" cy="75" r="1.2" fill="#fff"/><rect x="26" y="3" width="58" height="26"/><rect x="40" y="3" width="30" height="11"/><rect x="26" y="121" width="58" height="26"/><rect x="40" y="136" width="30" height="11"/><path d="M44 29 A12 12 0 0 0 66 29"/><path d="M44 121 A12 12 0 0 1 66 121"/></svg>';
    { const _bs = (ov.querySelector('.fe-bankliste') || {}).scrollTop || 0; Promise.resolve().then(() => { const l = ov.querySelector('.fe-bankliste'); if (l) l.scrollTop = _bs; }); }
    ov.innerHTML = '<div class="fe-box"><div class="fe-title">📋 AUFSTELLUNG</div>' +
      '<div class="fe-bank"><h4>🪑 BANK</h4><div class="fe-bankliste">' + bankHtml + '</div></div>' +
      '<div class="fe-mitte"><div class="fe-pitch">' + linien + toks + '</div></div>' +
      '<div class="fe-seite"><div class="fe-label">FORMATION</div><div class="fe-chips">' + chips + '</div>' + 
      '<div class="fe-hilfe">Spieler antippen oder ziehen und auf einen Platz oder Bankspieler legen. Angriff = oben. Spieler antippen → NUMMER ÄNDERN.</div>' +
      '<div class="fe-msg">' + msg + '</div>' +
      '<div class="fe-act"><button type="button" class="fe-kader">📋 KADER ' + (((document.getElementById('kaderAnz') || {}).textContent) || '') + '</button><button type="button" class="fe-auto">🔄 AUTOMATISCH</button><button type="button" class="fe-ok">✔ FERTIG</button></div></div></div>';
    if (ov.classList.contains('fe-live') && ov._maxRein != null){ const h = ov.querySelector('.fe-hilfe'); if (h) h.textContent = 'Formation wählen oder Spieler tauschen. Bankspieler auf einen Platz ziehen = Wechsel (noch ' + ov._maxRein + '). Angriff = oben.'; }
    const neu = () => { try { zeichnePlaetze(); } catch(e){} };
    { const kb = ov.querySelector('.fe-kader'); if (kb) kb.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); try { superteamZeigen(); } catch (er) { console.error('Kader', er); } }); }
    feSelHinweis(ov, sel ? (sel.t === 's' ? bySlot[sel.k] : sel.t === 'b' ? sel.idx : twIdx) : null);
    feAnim(ov, _fr0);
    const nrOeffnen = ix => aufNrWahl(ov, {
      idx: ix, hole: i => zustand.nummern[i],
      alle: () => zustand.squad.concat(bank()).filter(i => i != null),
      fertig: (n, anderer, altN) => {
        if (anderer != null){ zustand.nummern[anderer] = altN; zustand.nrManuell.add(anderer); msg = '🔄 #' + n + ' war schon vergeben – getauscht mit ' + PLAYER_DATABASE[anderer].name + ': ' + PLAYER_DATABASE[ix].name + ' trägt jetzt #' + n + ', ' + PLAYER_DATABASE[anderer].name + ' trägt jetzt ' + (altN != null ? '#' + altN : 'keine feste Nummer') + '.'; }
        else msg = PLAYER_DATABASE[ix].name + ' trägt jetzt die #' + n + '.';
        zustand.nummern[ix] = n; zustand.nrManuell.add(ix); zustand.squad.forEach(i => { if (i != null) zustand.nrManuell.add(i); }); sel = null;   // alle sichtbaren Nummern festhalten, damit sich nichts von selbst verschiebt
        try { aktualisiere(); } catch (e) {}
        zeichne();
      }
    });
    aufNrUnterName(ov, sel, q => q.t === 's' ? bySlot[q.k] : q.idx, nrOeffnen);
    ov.querySelectorAll('.fe-chips button').forEach(bt => bt.addEventListener('click', () => {
      zustand.formation = bt.dataset.f; zustand.formSlot = {}; sel = null; msg = ''; formSpeichern(); formKnopfAktualisieren(); zeichne(); neu();
    }));
    const aktion = (a, z) => {
      msg = '';
      if (a.t === 'b' && z.t === 'b') return;
      if (a.t === 's' && z.t === 's'){
        if (a.k === z.k) return;
        const t = bySlot[a.k]; bySlot[a.k] = bySlot[z.k]; bySlot[z.k] = t;
        zustand.formSlot = {}; bySlot.forEach((i, sl) => { if (i != null) zustand.formSlot[i] = sl; });
        formSpeichern(); neu(); return;
      }
      if (a.t === 't' || z.t === 't'){   // V11.13: Torwart tauschen – mit Bank-/Reservespieler oder mit einem Feldspieler
        const o = a.t === 't' ? z : a, twPos = zustand.torwart, tw = zustand.squad[twPos];
        if (o.t === 'b'){
          if (ov.classList.contains('fe-live')){
            if (ov._maxRein != null && zustand.squad.slice(1).filter(i => !(ov._start || []).includes(i)).length + (zustand.squad[0] !== ov._twStart ? 1 : 0) >= ov._maxRein){ msg = 'Keine Wechsel mehr möglich.'; return; }
          }
          zustand.squad[twPos] = o.idx;
          const ep = (zustand.ersatz || []).indexOf(o.idx); if (ep >= 0) zustand.ersatz[ep] = tw; else if (zustand.ersatz && zustand.ersatz.length < BANK_GROESSE) zustand.ersatz.push(tw);
          zustand.nrManuell && zustand.nrManuell.delete(tw); ersatzSpeichern(); formSpeichern(); aktualisiere();
          msg = PLAYER_DATABASE[o.idx].name + ' steht jetzt im Tor.'; return;
        }
        if (o.t === 's'){
          if (ov.classList.contains('fe-live')){ msg = 'Im Spiel kommt ein neuer Torwart nur von der Bank.'; return; }
          const f = bySlot[o.k]; if (f == null) return;
          const fp = zustand.squad.indexOf(f); if (fp < 0) return;
          zustand.torwart = fp; delete zustand.formSlot[f]; zustand.formSlot[tw] = o.k;
          formSpeichern(); aktualisiere(); msg = PLAYER_DATABASE[f].name + ' steht jetzt im Tor, ' + PLAYER_DATABASE[tw].name + ' spielt im Feld.'; return;
        }
        return;
      }
      const sl = a.t === 's' ? a : z, bn = a.t === 'b' ? a : z;
      tauschBank(bySlot[sl.k], bn.idx, sl.k);
    };
    ov.querySelectorAll('.fe-tok[data-s],.fe-tok[data-b],.fe-tok[data-fix]').forEach(el => el.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('.fe-nr')) return;   // V11.1: Nummern-Schild antippen = Nummer ändern
      e.preventDefault();
      const q = el.dataset.fix != null ? { t: 't' } : el.dataset.s != null ? { t: 's', k: +el.dataset.s } : { t: 'b', idx: +el.dataset.b };
      const kann = !(q.t === 's' && bySlot[q.k] == null) && !(q.t === 't' && zustand.squad[zustand.torwart] == null);
      const x0 = e.clientX, y0 = e.clientY;
      let bewegt = false, ghost = null, hover = null;
      const box = ov.getBoundingClientRect(), sk = box.width / (ov.offsetWidth || box.width) || 1;
      const ziel = (x, y) => { const t = document.elementFromPoint(x, y); const c = t && t.closest ? t.closest('.fe-tok[data-s],.fe-tok[data-b],.fe-tok[data-fix]') : null; return c && c !== el ? c : null; };
      const qVon = c => c.dataset.fix != null ? { t: 't' } : c.dataset.s != null ? { t: 's', k: +c.dataset.s } : { t: 'b', idx: +c.dataset.b };
      const move = ev => {
        if (!kann) return;
        if (!bewegt && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8){
          bewegt = true; ghost = el.cloneNode(true); ghost.classList.add('fe-ghost'); ghost.removeAttribute('data-s'); ghost.removeAttribute('data-b'); ov.appendChild(ghost); el.style.opacity = .35;
        }
        if (bewegt){
          ghost.style.left = ((ev.clientX - box.left) / sk) + 'px'; ghost.style.top = ((ev.clientY - box.top) / sk) + 'px';
          const h = ziel(ev.clientX, ev.clientY);
          if (h !== hover){ if (hover) hover.classList.remove('ziel'); hover = h; if (hover) hover.classList.add('ziel'); }
        }
      };
      const ende = ev => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', ende); window.removeEventListener('pointercancel', ende);
        if (ghost) ghost.remove();
        if (ev.type === 'pointercancel' && !bewegt){ el.style.opacity = ''; return; }
        if (bewegt){
          const c = ev.type === 'pointercancel' ? null : ziel(ev.clientX, ev.clientY);
          if (c) aktion(q, qVon(c));
          sel = null; zeichne(); return;
        }
        if (sel === null){ if (kann) sel = q; }
        else if (sel.t === q.t && (sel.k === q.k && sel.idx === q.idx)) sel = null;
        else { aktion(sel, q); sel = null; }
        zeichne();
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', ende); window.addEventListener('pointercancel', ende);
    }));
    ov.querySelector('.fe-auto').addEventListener('click', () => {
      try {   // V3.09: stärkste Spieler aus Aufstellung + Bank + Reserve
        try {   // V10.11: auch das Tor – stärkster Torwart aus Aufstellung, Bank und Reserve
          const alt0 = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
          if (alt0 != null && !(typeof rolleDu !== 'undefined' && rolleDu === 'tor') && !gastIdxMenge().has(alt0)){
            const cand = autoTorKandidat(zustand.squad.concat(zustand.ersatz || [], kartenRest(zustand.squad)), alt0);
            if (cand != null){
              const cp = zustand.squad.indexOf(cand), ep = (zustand.ersatz || []).indexOf(cand);
              if (cp >= 0) zustand.squad[cp] = alt0; else if (ep >= 0) zustand.ersatz[ep] = alt0;
              zustand.squad[zustand.torwart] = cand;
              if (zustand.nummern){ const nc = zustand.nummern[cand]; if (zustand.nummern[alt0] != null) zustand.nummern[cand] = zustand.nummern[alt0]; if (nc != null) zustand.nummern[alt0] = nc; else delete zustand.nummern[alt0]; }
              try { zustand.nrManuell.delete(alt0); zustand.nrManuell.delete(cand); } catch (e) {}
              if (zustand.posManuell){ delete zustand.posManuell[alt0]; delete zustand.posManuell[cand]; }
              if (zustand.formSlot){ delete zustand.formSlot[cand]; delete zustand.formSlot[alt0]; }
            }
          }
        } catch (e) { console.error('auto-tor', e); }
        const twIdx = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
        const gast = gastIdxMenge(), felder = formFeld();
        const bankAlt = (zustand.ersatz || []).filter(i => PLAYER_DATABASE[i] && !zustand.squad.includes(i));
        const pool = [];
        felder.concat(bankAlt, kartenRest(zustand.squad)).forEach(i => { if (i != null && i !== twIdx && PLAYER_DATABASE[i] && !pool.includes(i) && (gast.has(i) || !autoVerletzt(i))) pool.push(i); });
        const fest = new Set(felder.filter(i => gast.has(i)));
        const zu = formBestAutoStark(pool, zustand.formation, felder.length, fest);
        const gew = Object.keys(zu).map(Number);
        if (gew.length){
          const geht = felder.filter(i => !gew.includes(i)), kommt = gew.filter(i => !felder.includes(i));
          geht.forEach((alt, q) => {
            const neuI = kommt[q]; if (neuI == null) return;
            const pos = zustand.squad.indexOf(alt); if (pos < 0) return;
            zustand.squad[pos] = neuI;
            if (zustand.nummern && zustand.nummern[alt] != null){ const bnr = zustand.nummern[neuI]; zustand.nummern[neuI] = zustand.nummern[alt]; if (bnr != null) zustand.nummern[alt] = bnr; else delete zustand.nummern[alt]; }
            try { zustand.nrManuell.delete(alt); } catch (e) {}
            if (zustand.posManuell) delete zustand.posManuell[alt];
          });
          const rest = pool.filter(i => !gew.includes(i) && !gast.has(i)).sort((a, b) => autoStaerke(b) - autoStaerke(a));
          zustand.ersatz = rest.slice(0, BANK_GROESSE);
          zustand.formSlot = zu;
          ersatzSpeichern(); formSpeichern(); aktualisiere();
        } else { zustand.formSlot = formBestAuto(formFeld(), zustand.formation); formSpeichern(); }
      } catch (e) { console.error('auto', e); zustand.formSlot = formBestAuto(formFeld(), zustand.formation); formSpeichern(); }
      sel = null; msg = '🔄 Die stärksten Spieler stehen jetzt in der Aufstellung.'; zeichne(); neu();
    });
    ov.querySelector('.fe-ok').addEventListener('click', () => { ov.style.display = 'none'; if (ov._ende) ov._ende(); });
  }
  ov.onclick = e => { if (e.target === ov){ ov.style.display = 'none'; if (ov._ende) ov._ende(); } };
  // V6.0: aus dem Bearbeiten-Fenster kommend – Spieler ist schon ausgewählt, passende Plätze leuchten
  if (vor && typeof vor.idx === 'number'){
    try { const sl = formZuweisen(formFeld(), zustand.formation, zustand.formSlot).get(vor.idx);
      if (sl != null){ sel = { t: 's', k: sl }; msg = '👉 ' + PLAYER_DATABASE[vor.idx].name + ' ist gewählt – tippe den Platz, auf dem er spielen soll.'; ov.dataset.ziel = ''; } } catch (e) {}
  } else ov.dataset.ziel = '';
  zeichne();
}
zustand.steuer = 'fest'; try { LS81.setItem('sc_steuer', 'fest'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
function teamIdxListe(){
  return zustand.squad.slice();
}
function positionenAbgleichen(){
  const tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
  const feld = teamIdxListe().filter(i => i !== tw);
  for (const k in (zustand.posManuell || {})) if (!feld.includes(+k)) delete zustand.posManuell[k];
  zustand.posi = positionenVerteilen(feld, zustand.posManuell || {});
}
// Position eines Spielers durchschalten: ABW → MIT → STU → TW → ABW (tauscht mit dem bisherigen Inhaber)
// Position direkt wählen; die übrigen KI-Spieler werden danach passend neu verteilt
zustand.posManuell = {};
function positionSetzen(i, ziel, ruhig){
  positionenAbgleichen();
  const idx = zustand.squad[i]; if (idx == null) return;
  const istTW = zustand.torwart === i;
  if (ziel === 'TW'){
    if (!istTW){ delete zustand.posManuell[idx]; if (ruhig){ zustand.torwart = i; rolleDu = i === 0 ? 'tor' : 'feld'; } else setzeTorwart(i); }
  } else {
    if (istTW){
      // neuer Torwart: gelernter Torwart, sonst der schwächste übrige Feldspieler
      let best = -1, bw = -1;
      const gSetP = gastIdxMenge();
      zustand.squad.forEach((x, j) => { if (j === i || gSetP.has(x)) return; const p = PLAYER_DATABASE[x]; const w = (p.role === 'TW' ? 100 : 0) + (100 - p.rating) + (j === 0 ? -50 : 0); if (w > bw){ bw = w; best = j; } });
      if (best >= 0){ zustand.torwart = best; rolleDu = best === 0 ? 'tor' : 'feld'; delete zustand.posManuell[zustand.squad[best]]; }
    }
    for (const k in zustand.posManuell) if (zustand.posManuell[k] === ziel) delete zustand.posManuell[k];
    zustand.posManuell[idx] = ziel;
  }
  zustand.posi = { ...zustand.posManuell };
  if (ruhig){ positionenAbgleichen(); return; }
  aktualisiere();
}
function positionWaehlen(i, knopf){
  // V6.0: Positions-Kästchen zeigt nur die aktuelle Position (Spieler-Fenster) – erst der Tipp darauf öffnet die Aufstellung
  if (!istGastModus() && zustand.squad[i] != null){ try { spielerEditWahl(i, knopf); } catch (e) {} return; }
  const idx = zustand.squad[i]; if (idx == null) return;
  let el = document.getElementById('posWahl');
  if (!el){ el = document.createElement('div'); el.id = 'posWahl'; document.getElementById('flaeche').appendChild(el); }
  const jetzt = zustand.torwart === i ? 'TW' : zustand.posi[idx];
  el.innerHTML = '<b>🪄 POSITION WÄHLEN</b>' + ['TW', 'AL', 'AR', 'MIT', 'STU'].map(p =>
    '<button type="button" data-p="' + p + '" class="' + (p === jetzt ? 'an ' : '') + 'pw-' + p.toLowerCase() + '">' + POS_TEXT[p] + '</button>').join('') + '<button type="button" class="zu">✕ SCHLIESSEN</button>';
  const f = document.getElementById('flaeche').getBoundingClientRect(), b = knopf.getBoundingClientRect(), sk = f.height / 600;
  const popupW = 260;
  const rawLeft = (b.left - f.left) / sk - 20;
  const rawTop = (b.bottom - f.top) / sk + 10;
  el.style.left = Math.max(6, Math.min(f.width / sk - popupW - 6, rawLeft)) + 'px';
  el.style.top = Math.max(8, Math.min(600 - 250, rawTop)) + 'px';
  el.hidden = false;
  el.onclick = e => { const q = e.target.closest('button'); if (!q) return; el.hidden = true; if (q.dataset.p){ musik.klick && musik.klick(); positionSetzen(i, q.dataset.p); } };
}
function positionWechseln(i){
  positionenAbgleichen();
  const idx = zustand.squad[i]; if (idx == null) return;
  const istTW = zustand.torwart === i, cur = istTW ? 'TW' : zustand.posi[idx];
  const reihe = ['ABW', 'MIT', 'STU', 'TW'];
  let next = reihe[(reihe.indexOf(cur) + 1) % 4];
  const inhaber = pos => Object.keys(zustand.posi).map(Number).find(k => zustand.posi[k] === pos);
  if (next === 'TW'){
    const j = zustand.torwart;
    if (j >= 0 && j !== i){ zustand.posi[zustand.squad[j]] = cur; }
    delete zustand.posi[idx];
    setzeTorwart(i); return;
  }
  if (istTW){
    // vom Tor ins Feld: der bisherige Abwehrspieler (oder nächste freie aus deinem Team) geht ins Tor
    for (const pos of ['ABW', 'MIT', 'STU']){
      const k = inhaber(pos), j = zustand.squad.indexOf(k);
      if (k != null && j >= 0){ delete zustand.posi[k]; zustand.posi[idx] = pos; setzeTorwart(j); return; }
    }
    return;
  }
  const k = inhaber(next);
  if (k != null && k !== idx) zustand.posi[k] = cur;
  zustand.posi[idx] = next;
  aktualisiere();
}

/* V10.11: Startspieler tragen erstmal immer die Nummern 1–11 (Torwart 1, Feldspieler der Reihe nach von hinten nach vorn). Selbst gewählte (manuell) bleiben. */
function startNummern(nr, tw, feld, key, slotPref, manuell){
  const man = i => !!(manuell && manuell.has(i));
  const zu = formZuweisen(feld, key, slotPref);
  const order = feld.filter(i => i != null).sort((a, b) => (zu.has(a) ? zu.get(a) : 99) - (zu.has(b) ? zu.get(b) : 99));
  const start = (tw != null ? [tw] : []).concat(order), belegt = new Set();
  start.forEach(i => { if (man(i) && Number(nr[i]) > 0) belegt.add(Number(nr[i])); });
  start.forEach(i => {
    if (man(i) && Number(nr[i]) > 0) return;
    let n = 1; while (belegt.has(n) && n < 99) n++;
    nr[i] = n; belegt.add(n);
  });
  Object.keys(nr).forEach(k => { const i = +k; if (!start.includes(i) && !man(i) && belegt.has(Number(nr[i]))) delete nr[i]; });   // Bank/Reserve: Nummer wird später neu (12, 13 …) vergeben
}
// automatische Nummern neu verteilen (selbst gewählte bleiben); der Torwart bekommt die 1
function nummernVerteilen(){
  const tw = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
  startNummern(zustand.nummern, tw, zustand.squad.filter(i => i != null && i !== tw), zustand.formation, zustand.formSlot, zustand.nrManuell);
}
const NUMMER_VORSCHLAG = { TW: [1, 12, 23], DF: [4, 5, 3, 2, 15], MF: [8, 6, 10, 7, 14], ST: [9, 11, 7, 10, 19] };
function vorschlagNummer(idx){
  const belegt = new Set(zustand.squad.filter(i => i !== idx).map(i => zustand.nummern[i]));
  const liste = NUMMER_VORSCHLAG[PLAYER_DATABASE[idx].role] || [13];
  return liste.find(n => !belegt.has(n)) || [...Array(99)].map((_, i) => i + 1).find(n => !belegt.has(n));
}
// Gast: eigenen Spieler wählen (wird beim Gastgeber automatisch zum menschlichen Mitspieler)
function gastWaehlen(idx){
  if (!NETZ.meinPlatz){ toast('Einen Moment, dein Platz im Raum wird zugeteilt …'); return; }
  if (NETZ.meinPlatz === 'voll'){ toast('Der Raum ist voll (4 von 4).'); return; }
  if (NETZ.teamVon(NETZ.gid) === 1){ toast('Du spielst im Gegnerteam – dein Spieler wird beim Anpfiff automatisch gewählt.'); return; }
  if (NETZ.wahl === idx){ NETZ.waehle(null); aktualisiere(); return; }
  const t = NETZ.hostTeam, pos = t && t.sq ? t.sq.indexOf(idx) : -1;
  if (pos === 0){ toast('Das ist der Spieler des Gastgebers.'); return; }
  if (NETZ.onlineModus === 'cup'){
    if (pos < 0){ toast('Wähle einen Spieler aus dem Team des Gastgebers.'); return; }
  } else {   // V6.0 Freundschaftsspiel: eigene, freigeschaltete Karten des Gastes
    if (!t || !t.sq || !t.sq.length){ toast('Warte, bis der Gastgeber seinen Spieler gewählt hat.'); return; }
    if (!STAND.hatKarte(idx)){ toast('🔒 Diese Karte hast du noch nicht freigeschaltet.'); return; }
  }
  // V5.0: Im Online-Cup sind Gold und Silber gesperrt, im Freundschaftsspiel dürfen Pack-Spieler übernommen werden.
  if (NETZ.onlineModus === 'cup' && cupGesperrt(PLAYER_DATABASE[idx])){ toast('🔒 Im Online-Cup sind Gold- und Silberspieler für Gäste gesperrt.'); return; }
  if (NETZ.vergebenGast.includes(idx)){ toast('Dieser Spieler ist schon vergeben.'); return; }
  NETZ.waehle(idx); aktualisiere();
}
function superteamFest(){ try { return !istGastModus() && zustand.squad.length >= TEAM_GROESSE; } catch (e) { return false; } }   // V11.10: steht das Superteam, wird im Hauptmenü nichts mehr abgewählt
const SUPERTEAM_FEST_TXT = '🔒 Dein Superteam steht – Spieler tauschen über AUFSTELLUNG ÄNDERN.';
function karteGetippt(idx, clickedCard){
  const pk = PLAYER_DATABASE[idx];
  if (istGastModus()){ gastWaehlen(idx); return; }
  if (window.ligaGesperrt && window.ligaGesperrt()){ toast('🔒 Die Liga läuft – das Team ist gesperrt. Tauschen über KADER. Neu wählen: LEAGUE → NEUE LEAGUE.'); return; }   // V10.2: laufende Liga sperrt die Spielerwahl im Hauptmenü (Tausch über KADER); frei beim ersten Start und nach NEUE LEAGUE
  if (!STAND.hatKarte(idx)){ toast(pk.stufe === 'gold' ? '🔒 Goldkarte: werde Liga-Meister und öffne das Pack.' : pk.stufe === 'silber' ? '🔒 Silberkarte: gewinne den SILESCROW CUP (ab Stufe mittel) oder werde Zweiter/Dritter der Liga.' : '🔒 Bronzekarte: gewinne ein frühes Turnierspiel und öffne das Pack.'); return; }

  if (!kartenAktiv(idx) && zustand.squad.indexOf(idx) < 0 && (zustand.ersatz || []).indexOf(idx) < 0){ toast('🔒 Nur Spieler aus deinem Kader sind aktiv.'); return; }   // V10.3
  if (gegnerGast() && NETZ.hostTeam && ((NETZ.hostTeam.sq && NETZ.hostTeam.sq.includes(idx)) || (NETZ.hostTeam.er && NETZ.hostTeam.er.includes(idx))) && zustand.squad.indexOf(idx) < 0){ toast('Diesen Spieler hat der Gastgeber schon in seinem Team.'); return; }
  if (!istGastModus() && NETZ.rolle === 'host' && gegnerAuswahlSet().has(idx) && zustand.squad.indexOf(idx) < 0 && (zustand.ersatz || []).indexOf(idx) < 0){ toast('Diesen Spieler hat dein Gegner schon gewählt.'); return; }
  // V2.80: Der Team-Zustand ist die einzige Quelle für die Markierung.
  // Dadurch bleibt eine Auswahl dauerhaft markiert, bis genau dieser Spieler
  // erneut angetippt und damit abgewählt wird. Kein manuelles Klassen-Flackern.
  const pos = zustand.squad.indexOf(idx);
  if (pos < 0 && (zustand.ersatz || []).indexOf(idx) < 0 && VERLETZT.ist(idx)){ const n = VERLETZT.spiele(idx); toast('✚ ' + pk.name + ' ist verletzt – fällt noch ' + n + ' Spiel' + (n > 1 ? 'e' : '') + ' aus.'); return; }
  if (pos >= 0 && superteamFest()){ toast(SUPERTEAM_FEST_TXT); return; }
  if (pos >= 0) {
    musik.auswahl && musik.auswahl(false);
    entferne(pos);
    return;
  }
  // V2.6: Auswechselbank – Spieler 10 und 11 setzen sich auf die Bank
  zustand.ersatz = zustand.ersatz || [];
  const bpos = zustand.ersatz.indexOf(idx);
  if (bpos >= 0 && superteamFest()){ toast(SUPERTEAM_FEST_TXT); return; }
  if (bpos >= 0){ zustand.ersatz.splice(bpos, 1); musik.auswahl && musik.auswahl(false); ersatzSpeichern(); aktualisiere(); auswahlHinweis(); return; }
  if (zustand.squad.length >= maxHost() && !istGastModus() && zustand.ersatz.length < BANK_GROESSE){
    zustand.ersatz.push(idx); musik.auswahl && musik.auswahl(true); ersatzSpeichern(); aktualisiere(); auswahlHinweis(); return;
  }
  if ((zustand.gastPlaetze || []).some(x => x.idx === idx)) { toast('Dieser Spieler gehört einem Mitspieler im Raum.'); return; }
  if (zustand.squad.length >= maxHost()) { toast('Dein Team ist komplett (' + TEAM_GROESSE + ' + ' + BANK_GROESSE + '). Tippe einen Spieler an, um ihn zu entfernen.'); return; }
  musik.auswahl && musik.auswahl(true);

  // V3.1: Die Führung beginnt mit dem Torwart. Er ist NICHT "du" (kein Stürmer mit der 9) – er bekommt die 1 und wartet,
  // der erste Feldspieler danach wird "du" und rückt an Platz 1. So findet besterTorwart() bei voller Elf den echten Torwart.
  if (zustand.squad.length === 0 && PLAYER_DATABASE[idx] && PLAYER_DATABASE[idx].role === 'TW'){
    zustand.torwart = -1; rolleDu = 'feld';
    zustand.squad.push(idx);
    zustand.nummern[idx] = vorschlagNummer(idx) || 1;
    zustand.nrManuell.delete(idx);
    positionenAbgleichen(); aktualisiere(); auswahlHinweis();
    return;
  }
  if (zustand.squad.length > 0 && PLAYER_DATABASE[idx] && PLAYER_DATABASE[idx].role !== 'TW' && zustand.squad.every(i => PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role === 'TW')){
    zustand.torwart = -1; rolleDu = 'feld';
    zustand.squad.unshift(idx);
    zustand.nummern[idx] = vorschlagNummer(idx) || 9;
    zustand.nrManuell.delete(idx);
    zustand.posManuell = zustand.posManuell || {};
    zustand.posManuell[idx] = ({ DF: 'AL', MF: 'MIT', ST: 'STU' })[PLAYER_DATABASE[idx].role] || 'STU';   // V3.1: Position passend zur echten Rolle
    positionenAbgleichen(); aktualisiere(); auswahlHinweis();
    return;
  }
  // Der allererste Spieler ist dein menschlicher Spieler.
  if (zustand.squad.length === 0){
    zustand.torwart = -1;
    rolleDu = 'feld';
    zustand.squad.push(idx);
    zustand.nummern[idx] = vorschlagNummer(idx) || 9;
    zustand.nrManuell.delete(idx);
    zustand.posManuell = zustand.posManuell || {};
    zustand.posManuell[idx] = 'STU';
    rolleDu = 'feld';
    positionenAbgleichen();
    aktualisiere();
    try { LS81.setItem('sc_tipp_pos', '0'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    auswahlHinweis();
    return;
  }

  zustand.squad.push(idx);
  zustand.nummern[idx] = vorschlagNummer(idx);
  if (zustand.squad.length === maxHost() && zustand.torwart < 0) zustand.torwart = besterTorwart();
  positionenAbgleichen();
  aktualisiere();
  auswahlHinweis();
}
// V2.6: Hinweis nach jeder Auswahl: wie viele Spieler / Auswechselspieler noch fehlen
function auswahlHinweis(){
  // V3.09: kein kleines Pop-up unten rechts mehr. Nur beim Übergang zur Bank erscheint kurz ein großer Hinweis.
  if (istGastModus()) return;
  const n = zustand.squad.length, vor = auswahlHinweis._n == null ? n : auswahlHinweis._n;
  auswahlHinweis._n = n;
  if (n >= maxHost() && vor < maxHost() && (zustand.ersatz || []).length < BANK_GROESSE){ try { scGrossHinweis('WÄHLE ' + BANK_GROESSE + ' AUSWECHSELSPIELER', 'Die grün blinkenden Karten kannst du wählen', 2000); } catch (e) {} }
}
function ersatzSpeichern(){ try { LS81.setItem('sc_ersatz', JSON.stringify(zustand.ersatz || [])); } catch (e) {} }
function ersatzLaden(){ try { const x = JSON.parse(LS81.getItem('sc_ersatz') || '[]'); if (Array.isArray(x)) zustand.ersatz = x.filter(i => PLAYER_DATABASE[i] && STAND.hatKarte(i)).slice(0, BANK_GROESSE); } catch (e) {} }
// fehlende Auswechselspieler automatisch aus freien, freigeschalteten Karten ergänzen (sonst normale Spieler)
// V3.0: Verletzungen – Spieler deines Teams fallen für 1–3 Spiele aus (Speicher sc_verletzt)
const VERLETZT = {
  _l(){ try { const x = JSON.parse(LS81.getItem('sc_verletzt') || '{}'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } },
  _s(x){ try { LS81.setItem('sc_verletzt', JSON.stringify(x)); } catch (e) {} },
  spiele(i){ const n = +this._l()[i] || 0; return n > 0 ? n : 0; },
  ist(i){ return this.spiele(i) > 0; },
  // nach jedem eigenen Spiel: alte Verletzungen heilen um ein Spiel, neue kommen dazu
  nachSpiel(neu){ const x = this._l(); for (const k in x){ x[k]--; if (x[k] <= 0) delete x[k]; } for (const k in (neu || {})) x[k] = Math.max(x[k] || 0, neu[k]); this._s(x); }
};
function ersatzAuffuellen(squad){
  const er = (zustand.ersatz || []).filter(i => !squad.includes(i) && !VERLETZT.ist(i)).slice(0, BANK_GROESSE);
  const frei = AUSWAHL.filter(i => !squad.includes(i) && !er.includes(i) && STAND.hatKarte(i) && !VERLETZT.ist(i)).sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating);
  const ki = PLAYER_DATABASE.map((p, i) => i).filter(i => PLAYER_DATABASE[i].ki && !squad.includes(i) && !er.includes(i));
  while (er.length < BANK_GROESSE && (frei.length || ki.length)) er.push(frei.length ? frei.shift() : ki.splice((Math.random() * ki.length) | 0, 1)[0]);
  return er;
}

function entferne(pos){
  setTimeout(auswahlHinweis, 0);   // V2.6
  zustand.nrManuell.delete(zustand.squad[pos]);
  zustand.squad.splice(pos, 1);
  if (zustand.torwart === pos) zustand.torwart = -1;
  else if (zustand.torwart > pos) zustand.torwart--;
  if (zustand.squad.length < maxHost() && rolleDu !== 'tor') zustand.torwart = -1;
  if (rolleDu === 'tor' && zustand.squad.length) zustand.torwart = 0;
  aktualisiere();
}

// Unter den KI-Spielern: wer als Torwart (TW) geführt ist, sonst der mit dem niedrigsten Wert
// V3.66: Spieler der Gäste (Online) werden nie automatisch zum Torwart gemacht
function gastIdxMenge(){ return new Set((zustand.gastPlaetze || []).map(x => x.idx).filter(x => x != null)); }
function besterTorwart(){
  let best = -1, bestScore = -1;
  const gSet = gastIdxMenge();
  for (let i = 1; i < zustand.squad.length; i++){
    if (gSet.has(zustand.squad[i])) continue;
    const p = PLAYER_DATABASE[zustand.squad[i]];
    const score = (p.role === 'TW' ? 100 : 0) + (100 - p.rating);
    if (score > bestScore){ bestScore = score; best = i; }
  }
  if (best < 0) best = zustand.squad.length > 1 ? 1 : 0;
  return best;
}

let rolleDu = 'feld';

function kiNummer(pos){ let n = 0; for (let j = 1; j <= pos; j++){ const i = zustand.squad[j]; if (!(zustand.gastPlaetze || []).some(x => x.idx === i)) n++; } return n; }
function gastSlotText(idx){
  const t = NETZ.hostTeam; if (!t || !t.sq) return '';
  const pos = t.sq.indexOf(idx);
  if (pos === 0) return 'GASTGEBER';
  if (NETZ.onlineModus === 'cup' && cupGesperrt(PLAYER_DATABASE[idx])) return '★ GESPERRT';
  return t.tw === pos ? 'FREI 🧤' : 'FREI';
}
// Darf ein Gast diesen Spieler übernehmen? Nur aus dem Team des Gastgebers, nicht dessen eigenen. Der gewählte Spieler bleibt danach fest.
// V5.0: Im Online-Cup sind Gold- und Silberspieler für Gäste gesperrt; im Freundschaftsspiel nicht.
function cupGesperrt(p){ return !!p && (p.stufe === 'gold' || p.stufe === 'silber'); }
function gastDarf(idx){ const pos = zustand.squad.indexOf(idx); return pos > 0 && !!PLAYER_DATABASE[idx] && !(NETZ.onlineModus === 'cup' && cupGesperrt(PLAYER_DATABASE[idx])); }
// Gastgeber: Platz für Gäste schaffen, Wahlen der Gäste prüfen (Gastgeber hat Vorrang) und bekannt geben
// V6.0 Freundschaftsspiel: Ein Spieler aus den eigenen Karten des Gastes ersetzt einen KI-Spieler im Team des Gastgebers.
// Verlässt der Gast den Raum oder wechselt die Wahl/den Modus, kommt der ersetzte Spieler zurück.
zustand.gastTausch = {};
function gastTauschPflegen(){
  const host = NETZ.rolle === 'host', ft = host && NETZ.onlineModus === 'freund', tsq = zustand.squad, gl = host ? NETZ.gaeste : [];
  Object.keys(zustand.gastTausch).forEach(id => {
    const e = zustand.gastTausch[id], g = gl.find(x => x.gid === id), j = tsq.indexOf(e.neu);
    if (j < 0){ delete zustand.gastTausch[id]; return; }   // Gastgeber hat den Spieler selbst entfernt
    if (ft && g && g.wahl === e.neu && NETZ.teamVon(g.gid) !== 1) return;
    if (e.alt != null && !tsq.includes(e.alt)) tsq[j] = e.alt;
    else { tsq.splice(j, 1); if (zustand.torwart === j) zustand.torwart = -1; else if (zustand.torwart > j) zustand.torwart--; }
    delete zustand.gastTausch[id];
  });
  if (!ft) return;
  const beansprucht = new Set(gl.map(x => x.wahl).filter(x => x != null));
  gl.forEach(g => {
    const w = g.wahl;
    if (w == null || NETZ.teamVon(g.gid) === 1 || zustand.gastTausch[g.gid] || tsq.includes(w)) return;
    const p = PLAYER_DATABASE[w]; if (!p || tsq.length === 0) return;
    if (tsq.length < maxHost()){ tsq.push(w); zustand.gastTausch[g.gid] = { neu: w, alt: null }; return; }
    let j = -1;
    for (let k = tsq.length - 1; k >= 1; k--){
      if (k !== zustand.torwart && !beansprucht.has(tsq[k]) && !Object.values(zustand.gastTausch).some(e => e.neu === tsq[k])){ j = k; break; }
    }
    if (j < 0) return;
    zustand.gastTausch[g.gid] = { neu: w, alt: tsq[j] }; zustand.nrManuell.delete(tsq[j]); tsq[j] = w;
  });
}
function gaesteAbgleich(){
  if (NETZ.rolle !== 'host'){ gastTauschPflegen(); zustand.gastPlaetze = []; return; }
  const zus = NETZ.modusEff === 'zusammen', mx = maxHost();
  while (zustand.squad.length > mx){ const weg = zustand.squad.pop(); zustand.nrManuell.delete(weg); }
  gastTauschPflegen();
  if (zustand.torwart >= zustand.squad.length) zustand.torwart = -1;
  // Ein Feldspieler bleibt Feldspieler: ein alter torwart===0 darf die Auswahl
  // des menschlichen Spielers nicht überschreiben.
  if (rolleDu !== 'tor' && zustand.torwart === 0 && zustand.squad.length > 0) zustand.torwart = zustand.squad.length > 1 ? besterTorwart() : -1;
  if (mx === 1 && zustand.squad.length === 1 && rolleDu === 'tor'){ zustand.torwart = 0; }
  else if (zustand.squad.length === mx && zustand.torwart < 0) zustand.torwart = rolleDu === 'tor' ? 0 : besterTorwart();
  const vergeben = new Set();
  zustand.gastPlaetze = NETZ.gaeste.map(g => {
    let idx = null; const gegner = NETZ.teamVon(g.gid) === 1;
    if (!gegner && zus && g.wahl != null && gastDarf(g.wahl) && !vergeben.has(g.wahl)){ idx = g.wahl; vergeben.add(idx); }
    return { gid: g.gid, k: g.k, idx, gegner };
  });
  // Gast-Wünsche für Trikotnummer/Position des eigenen Spielers übernehmen (jede Änderung nur einmal)
  zustand.gastPlaetze.forEach((gp, gi) => {
    const g = NETZ.gaeste[gi]; if (!g || gp.idx == null) return;
    zustand.gastPs = zustand.gastPs || {};
    const key = g.gid + ':' + gp.idx;
    if (g.fuer !== gp.idx || zustand.gastPs[key] === g.ps) return;
    zustand.gastPs[key] = g.ps;
    const j = zustand.squad.indexOf(gp.idx); if (j < 0) return;
    if (g.nr != null && g.nr >= 1 && g.nr <= 99 && !zustand.squad.some(x => x !== gp.idx && Number(zustand.nummern[x]) === g.nr)){ zustand.nummern[gp.idx] = g.nr; zustand.nrManuell.add(gp.idx); }
    if (g.pos && POS_TEXT[g.pos]) positionSetzen(j, g.pos, true);
  });
  // V3.66: Ein Gast-Spieler steht nur im Tor, wenn der Gast ausdrücklich TOR gewählt hat
  { const gSet = gastIdxMenge();
    const gTW = new Set(NETZ.gaeste.filter((g, gi) => zustand.gastPlaetze[gi] && zustand.gastPlaetze[gi].idx != null && g.fuer === zustand.gastPlaetze[gi].idx && g.pos === 'TW').map((g, _k) => g.fuer));
    const twI = zustand.torwart >= 0 ? zustand.squad[zustand.torwart] : null;
    if (twI != null && gSet.has(twI) && !gTW.has(twI)){ const nb = besterTorwart(); if (!gSet.has(zustand.squad[nb])) zustand.torwart = nb; } }
  const team = zus ? { sq: zustand.squad.slice(), tw: zustand.torwart, nr: Object.fromEntries(zustand.squad.map(i => [i, zustand.nummern[i]])),
                       ps: Object.fromEntries(zustand.squad.map((i, j) => [i, zustand.torwart === j ? 'TW' : (zustand.posi[i] || null)])),
                       w: zustand.squad.map(i => (ISTTRAIN(PLAYER_DATABASE[i]) || (PLAYER_DATABASE[i].stufe && STAND.hatKarte(i))) ? STAND.gesamt(i) : PLAYER_DATABASE[i].rating), er: (zustand.ersatz || []).slice(), land: zustand.land ? zustand.land[0] : null, art: zustand.teamArt || 'super' } : null;
  NETZ.gaesteInfo([...vergeben], Object.fromEntries(NETZ.gaeste.map((g, i) => [g.gid, [g.ws, zustand.gastPlaetze[i].idx]])), team);
}
// Anzeige-Plätze rechts: Gastgeber = DU, Freunde (Mensch), KI; Gast = nur der eigene Platz
function plaetzeListe(){
  if (istGastModus()) return [{ n: NETZ.meinPlatz && NETZ.meinPlatz !== 'voll' ? 'DU · SPIELER ' + (NETZ.meinPlatz + 1) : 'DU · GAST', idx: NETZ.wahl == null ? undefined : NETZ.wahl, gastk: -1 }];
  const liste = [{ n: 'DU', j: 0, idx: zustand.squad[0] }];
  let ki = 0;
  for (let j = 1; j < TEAM_GROESSE; j++){
    const idx = zustand.squad[j], gp = idx != null && (zustand.gastPlaetze || []).find(x => x.idx === idx);
    liste.push({ n: gp ? '👤 SPIELER ' + (gp.k + 1) : 'KI ' + (++ki), j, idx, mensch: !!gp });
  }
  return liste;
}

function gastNr(idx){ const t = NETZ.hostTeam; return NETZ.meinNr != null ? NETZ.meinNr : (t && t.nr && t.nr[idx] != null ? Number(t.nr[idx]) : null); }
function gastPos(idx){ const t = NETZ.hostTeam; return NETZ.meinPos || (t && t.ps && t.ps[idx]) || null; }
function zeichnePlaetze(){
  // V2.76: Auch KI-Spieler bekommen denselben ÄNDERN-Knopf wie der menschliche Spieler.
  plaetzeEl.innerHTML = '';
  { let gesehen = false; try { gesehen = LS81.getItem('sc_tipp_pos_v259') === '1'; } catch(e){typeof __scWarn==='function'&&__scWarn(e)} plaetzeEl.classList.toggle('tipp', !gesehen && zustand.squad.length > 0); }
  plaetzeListe().forEach(sl => {
    const n = sl.n, i = sl.j, idx = sl.idx;
    const p = idx !== undefined ? PLAYER_DATABASE[idx] : null;
    const el = document.createElement('div');
    el.className = 'platz' + (sl.gastk !== undefined ? ' ki1 gastplatz' : '') + (sl.mensch ? ' mensch' : '') + (p ? ' belegt' : '');
    el.setAttribute('role','button'); el.tabIndex = 0;
    el.setAttribute('aria-label', n + (p ? ': ' + p.name + ', antippen zum Bearbeiten' : ': leer'));
    const steuer = (i === 0 || !p) ? '' : '<button class=\"tw' + (zustand.torwart === i ? ' an' : ' pos-' + (zustand.posi[idx] || '').toLowerCase()) + '\" type=\"button\" aria-label=\"Position von ' + p.name + ' ändern\">' + (zustand.torwart === i ? '<svg viewBox=\"0 0 16 16\"><path d=\"M4 15V7.5C4 6 6 6 6 7.5V4C6 2.5 8 2.5 8 4V3.5C8 2 10 2 10 3.5V4.5C10 3 12 3 12 4.5V10C12 13 10 15 8 15Z\" fill=\"currentColor\"/></svg>TOR' : (formLabel(idx) || POS_TEXT[zustand.posi[idx]] || '–')) + '<i class=\"wechsel\" aria-hidden=\"true\">✎</i></button><button class=\"nrwahl\" type=\"button\" aria-label=\"Trikotnummer von ' + p.name + ' ändern\">#' + (zustand.nummern[idx] || '') + '</button>';
    const positionsanzeige = (sl.gastk !== undefined && sl.gastk !== -1) ? '<span class=\"posnur\">' + (POS_TEXT[zustand.posi[idx]] || '') + '</span>' : (sl.gastk === -1 ? '' : steuer);
    el.innerHTML =
      '<div class=\"kopfband\">' + (n === 'DU' ? '⭐ STAR' : (/^KI \d+$/.test(n) ? ((p && ((zustand.torwart === i ? 'TOR' : formLabel(idx)) || ({ TW: 'TOR', DF: 'ABW', MF: 'MIT', ST: 'STU' }[(PLAYER_DATABASE[idx]||{}).role] || ''))) || 'PLATZ ' + (i + 1)) : n)) + (p ? '<button type=\"button\" class=\"du-bearbeiten\" aria-label=\"' + (i === 0 || sl.gastk === -1 ? 'Eigenen Spieler bearbeiten' : 'KI-Spieler bearbeiten') + '\"><span>' + '✎</span> ÄNDERN</button>' : '') + '</div>' +
      '<svg class=\"trikot\" viewBox=\"0 0 64 56\" fill=\"none\" stroke=\"#0b1430\" stroke-width=\"2.5\" stroke-dasharray=\"5 4\" stroke-linejoin=\"round\"><path d=\"M22 4 L10 9 L2 22 L12 28 L16 22 V52 H48 V22 L52 28 L62 22 L54 9 L42 4 C40 9 36 12 32 12 C28 12 24 9 22 4 Z\"/></svg>' +
      '<div class=\"frage\">' + (p ? p.rating : '?') + '</div>' +
      (p ? '<img src=\"' + BILDER[p.bild] + '\" alt=\"\">' + positionsanzeige + '<div class=\"pname\"><span>' + p.name + '</span><b class=\"poskurz ' + (zustand.torwart === i ? 'twkurz' : '') + '\" title=\"Position\">' + ((sl.gastk === undefined && zustand.torwart !== i && formLabel(idx)) || (POS_KURZ[sl.gastk === -1 ? (gastPos(idx) || 'STU') : zustand.torwart === i ? 'TW' : (zustand.posi[idx] || 'STU')] || 'ST')) + '</b></div>' : '');
    el.addEventListener('click', e => {
      if (!p) return;
      if (sl.gastk === -1){
        e.stopPropagation(); spielerEditWahl('gast', el); return;   // V5.4: antippen = bearbeiten
      }
      if (i === undefined) return;
      if (e.target.closest('.du-bearbeiten')) { e.stopPropagation(); spielerEditWahl(i, e.target.closest('.du-bearbeiten')); return; }
      if (e.target.closest('.nrwahl')) { e.stopPropagation(); nummerWaehlen(i, e.target.closest('.nrwahl')); return; }
      if (e.target.closest('.tw')) { try { LS81.setItem('sc_tipp_pos_v259', '1'); } catch(er){typeof __scWarn==='function'&&__scWarn(er)} document.getElementById('plaetze').classList.remove('tipp'); positionWaehlen(i, e.target.closest('.tw')); return; }
      e.stopPropagation(); spielerEditWahl(i, el);   // V5.4: Spieler antippen öffnet Nummer/Position/Entfernen (vorher wurde er sofort entfernt)
    });
    el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && p && i !== undefined){ e.preventDefault(); spielerEditWahl(i, el);} });
    plaetzeEl.appendChild(el);
  });
  // V2.6: zwei Bankplätze (Auswechselspieler)
  if (!istGastModus()) for (let b = 0; b < BANK_GROESSE; b++){
    const idx = (zustand.ersatz || [])[b], p = idx != null ? PLAYER_DATABASE[idx] : null;
    const el = document.createElement('div');
    el.className = 'platz bankplatz' + (p ? ' belegt' : '');
    el.innerHTML = '<div class="kopfband">🪑 BANK ' + (b + 1) + '</div>' +
      '<svg class="trikot" viewBox="0 0 64 56" fill="none" stroke="#0b1430" stroke-width="2.5" stroke-dasharray="5 4" stroke-linejoin="round"><path d="M22 4 L10 9 L2 22 L12 28 L16 22 V52 H48 V22 L52 28 L62 22 L54 9 L42 4 C40 9 36 12 32 12 C28 12 24 9 22 4 Z"/></svg>' +
      (p ? '<img src="' + BILDER[p.bild] + '" alt=""><div class="pname"><span>' + p.name + '</span></div>' : '');
    el.addEventListener('click', () => { if (!p) return; zustand.ersatz.splice(b, 1); musik.auswahl && musik.auswahl(false); ersatzSpeichern(); aktualisiere(); auswahlHinweis(); });
    plaetzeEl.appendChild(el);
  }
  // V5.3: eine KADER-Kachel mit Spieleranzahl – öffnet die Superteam-Übersicht (dort einwechseln)
  if (!istGastModus()){
    let kn = 0; try { kn = (STAND.daten.karten || []).map(n => PLAYER_DATABASE.findIndex(x => x.name === n)).filter(i => i >= 0 && !zustand.squad.includes(i) && !(zustand.ersatz || []).includes(i)).length; } catch (e) {}
    const ka = document.getElementById('kaderAnz'); if (ka) ka.textContent = kaderGesamt(zustand.squad, zustand.ersatz);
  }
  { const fk = document.getElementById('fkKader'); if (fk) fk.style.display = istGastModus() ? 'none' : ''; }
  { const fkb = document.getElementById('formKnopf'); if (fkb){ if (!istGastModus()) fkb.style.setProperty('display', 'none', 'important'); else fkb.style.removeProperty('display'); } }   // V11.1: Knopf KADER/AUFSTELLUNG unten entfällt – beides steckt jetzt in der Mini-Aufstellung
  if (!istGastModus()){ try { plaetzeEl.appendChild(aufMiniBauen()); } catch (e) { console.error('aufMini', e); } }   // V11.1: Mini-Aufstellung
  plaetzeEl.querySelectorAll('.pname').forEach(namePassen);
  plaetzeSeiteAnwenden();
}
// V11.0: nur 8 Spieler pro Seite im Team-Fenster (größere Kacheln), Pfeile im Titel blättern
var PLAETZE_PRO_SEITE = 6, plaetzeSeite = 0;
function plaetzeSeiteAnwenden(){
  const kids = Array.from(plaetzeEl.children), istMini = k => k.classList.contains('aufmini'), nStart = kids.filter(k => !k.classList.contains('bankplatz') && !istMini(k)).length, hatBank = kids.some(k => k.classList.contains('bankplatz')), hatMini = kids.some(istMini);
  const seiteVon = (k, ix) => istMini(k) ? Math.ceil(nStart / PLAETZE_PRO_SEITE) + (hatBank ? 1 : 0) : k.classList.contains('bankplatz') ? Math.ceil(nStart / PLAETZE_PRO_SEITE) : Math.floor(ix / PLAETZE_PRO_SEITE);   // Seiten: Startelf je 6, Bank zuletzt
  const nS = Math.max(1, Math.ceil(nStart / PLAETZE_PRO_SEITE) + (hatBank ? 1 : 0) + (hatMini ? 1 : 0));
  if (hatMini && aufAnsicht() !== 'liste'){ kids.forEach(k => { if (istMini(k)) k.style.removeProperty('display'); else k.style.setProperty('display', 'none', 'important'); }); const z0 = document.getElementById('plZurueck'), v0 = document.getElementById('plVor'); if (z0 && v0){ z0.hidden = v0.hidden = true; z0.style.setProperty('display', 'none', 'important'); v0.style.setProperty('display', 'none', 'important'); } return; }   // V11.1: Standard = nur die Mini-Aufstellung
  { const z1 = document.getElementById('plZurueck'), v1 = document.getElementById('plVor'); if (z1 && v1){ z1.style.removeProperty('display'); v1.style.removeProperty('display'); } }
  if (plaetzeSeite > nS - 1) plaetzeSeite = nS - 1; if (plaetzeSeite < 0) plaetzeSeite = 0;
  kids.forEach((k, ix) => { if (seiteVon(k, ix) === plaetzeSeite) k.style.removeProperty('display'); else k.style.setProperty('display', 'none', 'important'); });
  const z = document.getElementById('plZurueck'), v = document.getElementById('plVor');
  if (z && v){ z.hidden = v.hidden = nS < 2; z.disabled = plaetzeSeite === 0; v.disabled = plaetzeSeite >= nS - 1; }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#plZurueck, #plVor'); if (!b || b.disabled) return;
  plaetzeSeite += b.id === 'plVor' ? 1 : -1; plaetzeSeiteAnwenden();
});

// V2.76: Derselbe Positions-/Nummern-Editor ist jetzt auch für KI-Spieler verfügbar.
function spielerEditWahl(i, knopf){
  const gastE = i === 'gast';
  const idx = gastE ? NETZ.wahl : zustand.squad[i]; if (idx == null) return;
  let el = document.getElementById('spielerEditWahl');
  if (!el){ el = document.createElement('div'); el.id='spielerEditWahl'; document.getElementById('flaeche').appendChild(el); }

  // V2.72: Der erste menschliche Spieler bekommt IMMER zuerst eine Feldposition.
  // Torwart darf später bewusst gewählt werden, wird aber niemals automatisch als Startposition gesetzt.
  if (!gastE && i === 0 && !zustand.posManuell?.[idx] && zustand.torwart !== 0){
    zustand.posManuell = zustand.posManuell || {};
    zustand.posManuell[idx] = 'STU';
    zustand.posi = { ...zustand.posManuell };
  }
  const htm = NETZ.hostTeam || {};
  const aktuell = gastE ? Number(gastNr(idx) || 9) : Number(zustand.nummern[idx] || vorschlagNummer(idx) || 9);
  const belegt = gastE ? (n => Object.keys(htm.nr || {}).some(x => +x !== idx && Number(htm.nr[x]) === n)) : (n => zustand.squad.some(x => x !== idx && Number(zustand.nummern[x]) === n));
  const jetzt = gastE ? (gastPos(idx) || 'STU') : (zustand.torwart === i ? 'TW' : (zustand.posi[idx] || zustand.posManuell?.[idx] || 'STU'));
  const posReihe = ['STU','MIT','AL','AR','TW'];
  // V6.0: einfache Position (Torwart / Abwehr / Mittelfeld / Sturm) aus der Aufstellung
  const einfachJetzt = gastE ? null : (zustand.torwart === i ? 'TW' : (() => { try { const sl = formZuweisen(formFeld(), zustand.formation, zustand.formSlot).get(idx); const r = sl != null ? formSlots(zustand.formation)[sl].rolle : null; return r === 'DF' || r === 'MF' || r === 'ST' ? r : 'MF'; } catch (e) { return 'MF'; } })());
  // V5.4: Besetzte Nummer antippen = Nummern tauschen (nur im eigenen Team; online beim Gast bleibt sie gesperrt)
  const tauschbar = !gastE;
  const nrKnopf = n => '<button type="button" data-nr="'+n+'" class="'+(belegt(n)?'belegt ':'')+(n===aktuell?'an':'')+'" '+(belegt(n) && !tauschbar?'disabled':'')+(belegt(n) && tauschbar?' title="tauschen"':'')+'>'+n+'</button>';
  const schnell = Array.from({length:11},(_,k)=>k+1).map(nrKnopf).join('');
  const erweitert = Array.from({length:88},(_,k)=>k+12).map(nrKnopf).join('');

  const editorTitel = gastE || i === 0 ? '👤 DEIN SPIELER' : '🪄 KI-SPIELER ' + kiNummer(i);
  el.innerHTML = '<div class="se-title">' + editorTitel + '</div><div class="se-sub">Trikotnummer und Position hier gemeinsam ändern.</div><div class="se-vor"></div>'+
    '<div class="se-grid">'+
    '<section class="se-block"><span class="se-label">🔢 TRIKOTNUMMER</span><div class="se-number-grid">'+schnell+'</div><button type="button" class="se-more">ERWEITERTE NUMMERN · 12–99</button><div class="se-moregrid" hidden>'+erweitert+'</div></section>'+
    (gastE ? '<section class="se-block"><span class="se-label">📍 POSITION <small style="display:block;color:#ffe234;margin-top:4px;font-size:10px">aktuell: '+(POS_TEXT[jetzt]||'STÜRMER')+'</small></span><div class="se-pos">'+posReihe.map(pos => '<button type="button" data-p="'+pos+'" class="pw-'+pos.toLowerCase()+' '+(pos===jetzt?'an':'')+'">'+POS_TEXT[pos]+'</button>').join('')+'</div></section>'
     : '<section class="se-block"><span class="se-label">📍 POSITION <small style="display:block;color:#ffe234;margin-top:4px;font-size:10px">aktuell: '+EINFACH_TEXT[einfachJetzt]+'</small></span><div class="se-pos se-pos1"><button type="button" data-r="'+einfachJetzt+'" class="an pw-'+({TW:'tw',DF:'al',MF:'mit',ST:'stu'}[einfachJetzt])+'">'+EINFACH_TEXT[einfachJetzt]+' <i>📋 ändern</i></button></div><small class="se-hinw">Antippen: In der Aufstellung den neuen Platz wählen.</small></section>')+'</div>'+
    '<div class="se-actions"><button type="button" class="se-entf">✕ AUS DEM TEAM</button><button type="button" class="se-close">✓ FERTIG</button></div>';

  const f=document.getElementById('flaeche').getBoundingClientRect(), b=knopf.getBoundingClientRect(), sk=f.height/600;
  const popupW=430, rawLeft=(b.right-f.left)/sk+10;
  el.style.left=Math.max(6,Math.min(f.width/sk-popupW-6,rawLeft))+'px';
  const wunschTop=(b.top-f.top)/sk-8;
  const platz=()=>{ const h=el.offsetHeight||330; el.style.top=Math.max(6,Math.min(600-h-6,wunschTop))+'px'; };
  el.hidden=false; platz();
  let vNr=aktuell, vPos=jetzt;
  const vorschau=()=>{ const v=el.querySelector('.se-vor'); if(v) v.innerHTML='👁 Vorschau: <b>#'+vNr+'</b> · <b>'+(POS_TEXT[vPos]||'STÜRMER')+'</b>'; };
  vorschau();

  const more=el.querySelector('.se-more'), moreGrid=el.querySelector('.se-moregrid');
  more.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();moreGrid.hidden=false;more.hidden=true;platz();});

  // V2.72: Nummern bleiben im Fenster bedienbar; kein sofortiges Neurendern mehr.
  el.querySelectorAll('[data-nr]').forEach(q=>q.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const n=Number(q.dataset.nr);
    if (belegt(n)){
      if (!tauschbar) return;
      const alt = Number(zustand.nummern[idx] || vNr), anderer = zustand.squad.find(x => x !== idx && Number(zustand.nummern[x]) === n);
      if (anderer == null) return;
      // Nachfrage: "Die 10 hat COBRA – tauschen?"
      let fr = el.querySelector('.se-tausch'); if (fr) fr.remove();
      fr = document.createElement('div'); fr.className = 'se-tausch';
      fr.innerHTML = '<div>🔄 Die <b>#' + n + '</b> hat <b>' + PLAYER_DATABASE[anderer].name + '</b>.<br>Tauschen? ' + PLAYER_DATABASE[anderer].name + ' bekommt dann die <b>#' + alt + '</b>.</div><div class="se-tausch-k"><button type="button" class="ja">TAUSCHEN</button><button type="button" class="nein">ABBRECHEN</button></div>';
      el.appendChild(fr);
      fr.addEventListener('click', ev => ev.stopPropagation());
      fr.querySelector('.nein').addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); fr.remove(); });
      fr.querySelector('.ja').addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation();
        zustand.nummern[anderer] = alt; zustand.nrManuell.add(anderer);
        zustand.nummern[idx] = n; zustand.nrManuell.add(idx);
        el.querySelectorAll('[data-nr]').forEach(x => { const m = Number(x.dataset.nr); x.classList.toggle('belegt', belegt(m)); x.classList.toggle('an', m === n); });
        vNr=n; vorschau(); fr.remove();
        try { toast('🔄 Getauscht: ' + PLAYER_DATABASE[idx].name + ' #' + n + ' · ' + PLAYER_DATABASE[anderer].name + ' #' + alt); } catch (er) {}
      });
      return;
    }
    if (gastE) NETZ.setzeSpieler({ nr: n }); else { zustand.nummern[idx]=n; zustand.nrManuell.add(idx); }
    el.querySelectorAll('[data-nr]').forEach(x=>{ const m = Number(x.dataset.nr); x.classList.toggle('an', m===n); if (tauschbar) x.classList.toggle('belegt', belegt(m)); });
    vNr=n; vorschau();
  }));

  el.querySelectorAll('[data-p]').forEach(q=>q.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const ziel=q.dataset.p;
    // Position direkt setzen, aber das Fenster offen lassen, damit Nummer + Position zusammen gewählt werden können.
    if (gastE) NETZ.setzeSpieler({ pos: ziel }); else positionSetzen(i,ziel);
    const jetztNeu = gastE ? ziel : (zustand.torwart===i ? 'TW' : (zustand.posi[idx] || ziel));
    el.querySelectorAll('[data-p]').forEach(x=>x.classList.toggle('an', x.dataset.p===jetztNeu));
    const sub=el.querySelector('.se-label small'); if(sub) sub.textContent='aktuell: '+(POS_TEXT[jetztNeu]||'STÜRMER');
    vPos=jetztNeu; vorschau();
    e.stopPropagation();
  }));

  // V6.0: TORWART direkt setzen – Abwehr/Mittelfeld/Sturm öffnen die Aufstellung mit diesem Spieler ausgewählt
  el.querySelectorAll('[data-r]').forEach(q=>q.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const r = q.dataset.r;
    el.hidden = true; aktualisiere();
    formEditorOeffnen({ idx, rolle: r });
  }));
  el.querySelector('.se-close').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();el.hidden=true;aktualisiere();});
  // V5.4: Spieler antippen öffnet dieses Fenster – rausnehmen geht jetzt hier
  el.querySelector('.se-entf').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();el.hidden=true; if (gastE){ NETZ.waehle(null); aktualisiere(); } else if (window.ligaGesperrt && window.ligaGesperrt()){ toast('🔒 Die Liga läuft – das Team ist gesperrt. Tauschen über KADER. Neu wählen: LEAGUE → NEUE LEAGUE.'); } else if (superteamFest()){ toast(SUPERTEAM_FEST_TXT); } else entferne(i);});
  el.addEventListener('click',e=>e.stopPropagation());
}

function nummerWaehlen(i, knopf){
  const idx = zustand.squad[i]; if (idx == null) return;
  let el = document.getElementById('nrWahl');
  if (!el){ el = document.createElement('div'); el.id = 'nrWahl'; document.getElementById('flaeche').appendChild(el); }
  const aktuell = Number(zustand.nummern[idx] || vorschlagNummer(idx) || 9);
  const belegt = n => zustand.squad.some(x => x !== idx && Number(zustand.nummern[x]) === n);
  const schnell = Array.from({length:11},(_,k)=>k+1).map(n =>
    '<button type="button" data-nr="'+n+'" class="'+(belegt(n)?'belegt':'')+'" '+(belegt(n)?'disabled':'')+'>'+n+'</button>'
  ).join('');
  const erweitert = Array.from({length:88},(_,k)=>k+12).map(n =>
    '<button type="button" data-nr="'+n+'" class="'+(belegt(n)?'belegt':'')+'" '+(belegt(n)?'disabled':'')+'>'+n+'</button>'
  ).join('');
  el.innerHTML = '<b>🔢 TRIKOTNUMMER WÄHLEN</b>'+
    '<div class="nr-schnell">'+schnell+'</div>'+
    '<button type="button" class="nr-erweitert">ERWEITERTE NUMMERN · 12–99</button>'+
    '<div class="nr-erweitert-grid" hidden>'+erweitert+'</div>'+
    '<button type="button" class="nr-abbrechen">ABBRECHEN</button>';
  const f = document.getElementById('flaeche').getBoundingClientRect(), b = knopf.getBoundingClientRect(), sk = f.height / 600;
  el.style.left = Math.min(f.width / sk - 252, Math.max(4, (b.left - f.left) / sk - 170)) + 'px';
  el.style.top = Math.min(600 - 260, (b.bottom - f.top) / sk + 5) + 'px';
  el.hidden = false;
  const extBtn = el.querySelector('.nr-erweitert'), extGrid = el.querySelector('.nr-erweitert-grid');
  extBtn.addEventListener('click',()=>{ extGrid.hidden=false; extBtn.hidden=true; });
  el.querySelectorAll('[data-nr]').forEach(q=>q.addEventListener('click',()=>{
    const n=Number(q.dataset.nr); if(belegt(n)) return;
    zustand.nummern[idx]=n; zustand.nrManuell.add(idx); el.hidden=true; aktualisiere();
  }));
  el.querySelector('.nr-abbrechen').addEventListener('click',()=>{el.hidden=true;});
  // aktuelle Nummer optisch hervorheben
  const akt=el.querySelector('[data-nr="'+aktuell+'"]'); if(akt) akt.classList.add('aktuell');
}
function setzeTorwart(i){
  zustand.torwart = i;
  rolleDu = i === 0 ? 'tor' : 'feld';
  aktualisiere();
}

function aktualisiere(){
  try { angebotHinweis(); } catch (e) {}
  { const sig = gastHostAnsicht() ? JSON.stringify(NETZ.hostTeam) : 'normal|' + hinweisRolle(); if (zeichneKarten.sig !== sig){ if (!gastHostAnsicht() && hinweisRolle()) zustand.seite = 1; zeichneKarten(); } }   // V3.1: neue Position -> Seite 1, dort stehen die gebrauchten Karten
  if (!istGastModus()) gaesteAbgleich();
  if (!istGastModus()) positionenAbgleichen();
  nummernVerteilen();
  markiereKarten();
  try { zeichnePlaetze(); } catch (e) { console.error('zeichnePlaetze', e); }
  markiereKarten();
  // Rollen-Schalter synchron halten
  document.querySelectorAll('[data-rolle]').forEach(b => b.classList.toggle('an', b.dataset.rolle === rolleDu));
  // Teamtitel: Land, sobald gewählt
  const land = zustand.land;
  const tt = $('#teamtitel');
  tt.innerHTML = istGastModus() ? 'DU BIST GAST' : land ? flaggeHTML(land[0]) + ' (S) ' + land[0].toUpperCase() : 'DEIN TEAM';
  tt.style.transform = 'skewX(6deg)';
  const verf = tt.parentElement.clientWidth - 16;
  if (tt.scrollWidth > verf) tt.style.transform = 'skewX(6deg) scaleX(' + (verf / tt.scrollWidth).toFixed(3) + ')';
  // Hinweiszeile
  const gast = istGastModus(), gg = gegnerGast();
  document.querySelector('.einstellungen').classList.toggle('gast', gast);
  const mx = maxHost(), n = zustand.squad.length;
  const gz = (NETZ.rolle === 'host' && NETZ.modusEff === 'zusammen') ? NETZ.gaeste.length : 0;
  const ohneWahl = (NETZ.rolle === 'host' && NETZ.modusEff === 'zusammen') ? (zustand.gastPlaetze || []).filter(x => x.idx == null) : [];
  let hinweis, fehlt;
  if (gast){
    if (NETZ.abgelehnt) toast('Dieser Spieler wurde gerade vergeben – wähle einen anderen.');
    hinweis = NETZ.meinPlatz === 'voll' ? 'Der Raum ist voll (4 von 4).' :
              !(NETZ.hostTeam && NETZ.hostTeam.sq && NETZ.hostTeam.sq.length) ? 'Der Gastgeber stellt gerade sein Team zusammen …' :
              NETZ.wahl == null ? 'Tippe deinen Spieler an.' : 'Du spielst als ' + PLAYER_DATABASE[NETZ.wahl].name + ' ✓  (zum Wechseln tippe ihn rechts an)';
    fehlt = NETZ.meinPlatz === 'voll' ? 'Kein Platz mehr frei' :
            NETZ.wahl == null ? 'Tippe deinen Spieler an' :
            'Bereit! Warte auf den Anpfiff vom Gastgeber …';
  } else {
    hinweis = n < mx ? 'Wähle ' + mx + ': der erste bist du' + (gz ? ', ' + (gz > 1 ? 'deine Freunde übernehmen' : 'dein Freund übernimmt') + ' danach einen davon' : ', ' + (TEAM_GROESSE - 1) + ' sind KI') : TEST_11 ? 'Spieler antippen: Nummer, Position, Rausion' : '🪄 Position links ändern · 🔢 Nummer rechts ändern';
    // Start nur mit allen Spielern, Torwart und Land
    fehlt = n < mx ? 'Noch ' + (mx - n) + ' Spieler wählen' :
            ohneWahl.length ? (() => { const g0 = NETZ.gaeste.find(g => g.k === ohneWahl[0].k); return (g0 && g0.nm ? g0.nm : 'Spieler ' + (ohneWahl[0].k + 1)) + ' wählt …'; })() :
            (doppelterSpieler() != null) ? '⚠️ ' + PLAYER_DATABASE[doppelterSpieler()].name + ' steht in beiden Teams' :
            (gegnerTeamGast() && !gegnerTeamOK(gegnerTeamGast())) ? 'Warte auf das Team von ' + (gegnerTeamGast().nm || 'deinem Gegner') :
            zustand.torwart < 0 ? 'Torwart festlegen' :
            !land ? 'Land auswählen' : '';
  }
  if (gg){
    hinweis = n < mx ? 'Du spielst im GEGNERTEAM: Wähle ' + mx + ' Spieler aus deinen Karten, der erste bist du.' : '🪄 Position links ändern · 🔢 Nummer rechts ändern';
    fehlt = n < mx ? 'Noch ' + (mx - n) + ' Spieler wählen' : doppelterSpielerGast() != null ? '⚠️ ' + PLAYER_DATABASE[doppelterSpielerGast()].name + ' spielt schon beim Gastgeber – wähle einen anderen' : zustand.torwart < 0 ? 'Torwart festlegen' : 'Bereit! Warte auf den Anpfiff vom Gastgeber …';
  }
  if (gg) gegnerTeamMelden(); else if (NETZ.rolle === 'gast' && gegnerTeamMelden.sig){ gegnerTeamMelden.sig = null; NETZ.teamMelden(null); }
  if (!istGastModus() && !gg && n >= mx){ const bn = (zustand.ersatz || []).length; if (bn < BANK_GROESSE) hinweis = '🪑 Wähle ' + (BANK_GROESSE - bn === 1 ? 'noch 1 Auswechselspieler' : BANK_GROESSE - bn + ' Auswechselspieler') + ' (' + bn + '/' + BANK_GROESSE + ')'; }   // V3.09: Hinweis für die Bank
  $('#teamhinweis').textContent = hinweis;
  { const th = document.querySelector('#menue .teamhinweis'); if (th) th.classList.toggle('voll', !istGastModus() && zustand.squad.length >= TEAM_GROESSE && (zustand.ersatz || []).length >= BANK_GROESSE); }   // V5.5: Platz sparen
  $('#fehlt').textContent = fehlt || 'Alles bereit!';
  // V4.5: Warnung auch im Raum-Fenster des Gastgebers
  if (NETZ.rolle === 'host' && !aktualisiere._dr){
    const st = $('#mpStatusH'), d = doppelterSpieler();
    if (st){
      if (d != null){ st.textContent = '⚠️ ' + PLAYER_DATABASE[d].name + ' steht in beiden Teams – einer von euch muss wechseln.'; st.classList.remove('ok'); }
      else if (/^⚠️/.test(st.textContent)){ aktualisiere._dr = true; try { mpAnzeigen(); } finally { aktualisiere._dr = false; } }
    }
  }
  // Start darf nach vollständiger Teamwahl nicht unnötig blockiert werden.
  // Torwart und Land werden beim Start automatisch ergänzt, falls noch nichts gewählt wurde.
  // Einzelspieler: keine alten/abgebrochenen Online-Gäste dürfen den Start blockieren.
  // Nur ein echter Gast oder ein noch nicht vollständiges Team blockiert den Start.
  // V10.8: Neue Liga – 11 Spieler plus 2 Auswechselspieler müssen gewählt sein
  const ligaOhneBank = !!(window.__ligaNeuWahl) && !gast && ((zustand.ersatz || []).length < BANK_GROESSE);
  $('#start').disabled = gast || gg || n < mx || ligaOhneBank;
  { const dd = $('#start').disabled; let on = false; try { on = istGastModus() || onlineVerbunden() || !!(NETZ.partner || (NETZ.gaeste && NETZ.gaeste.length)); } catch (e) {} ['freundKnopf', 'pokalKnopf', 'ligaKnopf', 'halleKnopf'].forEach(id => { const e = document.getElementById(id); if (e){ e.classList.remove('aus'); e.classList.remove('grau'); /* V11.31: alle Knöpfe bleiben antippbar */ } }); }   // V11.10: ohne 11 Spieler komplett grau und gesperrt   // V6.6: laufender Pokal/Liga bleibt antippbar
  // V4.3: Startknopf im Hauptmenü passt sich an (Freundschaftsspiel / Online-Cup / Turnier)
  { const sk = $('#start'), txt = startKnopfText(); if (sk && sk.textContent !== txt) sk.textContent = txt; }
  if (fortsetzenKnopf) try { fortsetzenPruefen(); } catch (e) {}   // V2.6: Fortsetzen hängt nicht mehr an der Teamwahl

  // Starter-Pack: Sobald das Team zum ersten Mal vollständig gewählt ist,
  // wird das Pack im Hauptmenü bereitgelegt – es öffnet sich NICHT automatisch.
  const packStatus = $('#starterPackStatus');
  const starterButton = $('#starterPackButton');
  if (packStatus && starterButton) {
    let starterPack = STAND.packs.find(pk => pk && pk.quelle === 'starter');
    let schonVergeben = false;
    try { schonVergeben = LS81.getItem('sc_starter_silber_v1') === '1'; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    if (!gast && n >= mx && !schonVergeben && !starterPack) {
      starterPack = STAND.packVerdienen('bronze','starter');
      try { LS81.setItem('sc_starter_silber_v1', '1'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    }
    packStatus.hidden = !starterPack;
    starterButton.disabled = !starterPack;
  }
}