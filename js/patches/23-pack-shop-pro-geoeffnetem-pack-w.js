/* Silescrow Cup V 4.2 – js/patches/23-pack-shop-pro-geoeffnetem-pack-w.js */

// V10.3: Pack-Shop – pro geöffnetem Pack wird genau ein zufälliger Spieler freigeschaltet.
(function(){
  const NAME = { bronze: 'BRONZE', silber: 'SILBER', gold: 'GOLD' };
  const zahl = n => String(Math.max(0, n | 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  function offene(){ try { return (STAND.packs || []).filter(pk => pk && pk.quelle !== 'starter'); } catch (e) { return []; } }
  function meldung(t){ try { toast(t); } catch (e) {} }
  function anzeigen(){
    const k = document.getElementById('packKnopf'), z = document.getElementById('packZahl'); if (!k || !z) return;
    const liste = offene(), n = { bronze: 0, silber: 0, gold: 0 };
    liste.forEach(pk => { if (n[pk.art] != null) n[pk.art]++; });
    let cr = 0; try { cr = STAND.credits; } catch (e) {}
    const kann = ['bronze', 'silber', 'gold'].filter(a => { try { return cr >= PACK_PREIS[a] && STAND.packPool(a).length; } catch (e) { return false; } });
    k.hidden = false; k.classList.toggle('leer', !liste.length && !kann.length && !(STAND.wahl));
    k.classList.toggle('blinkt', !!(liste.length || kann.length || STAND.wahl));   // V 3.07: Shop-Knopf blinkt, wenn Packs verfügbar sind
    const FARBE = { bronze: ['#d98b4e', '#9c5a26'], silber: ['#eef2f7', '#9aa8ba'], gold: ['#ffd84a', '#c99400'] };
    const geschenk = a => { const [f, d] = FARBE[a]; return '<svg viewBox="0 0 24 32"><defs><linearGradient id="pkg' + a + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + f + '"/><stop offset="1" stop-color="' + d + '"/></linearGradient></defs><rect x="2" y="2" width="20" height="28" rx="3" transform="rotate(-6 12 16)" fill="url(#pkg' + a + ')" stroke="#000" stroke-width="2"/><path d="M12 9l1.9 4 4.3.5-3.2 2.9.9 4.3L12 18.5 8.1 20.7l.9-4.3-3.2-2.9 4.3-.5z" fill="#fff" stroke="#000" stroke-width="1"/><rect x="5" y="23" width="14" height="4" rx="1.5" fill="rgba(0,0,0,.45)" transform="rotate(-6 12 16)"/></svg>'; };
    // leuchtet: ungeöffnetes Pack oder genug Crows für dieses Pack
    const html = ['bronze', 'silber', 'gold'].map(a => '<span class="pg ' + a + (n[a] || kann.includes(a) ? ' hat' : '') + '" title="' + a + '">' + geschenk(a) + (n[a] >= 1 ? '<i>' + n[a] + '</i>' : '') + '</span>').join('');
    if (z.__h !== html){ z.__h = html; z.innerHTML = html; }
    { const t = document.getElementById('packText'), tx = '<span class="sc-muenze">C</span> ' + zahl(cr) + ' CROWS'; if (t && t.dataset.tx !== tx){ t.dataset.tx = tx; t.innerHTML = tx; } }   // V3.05: Crows-Münze
  }
  function karteHTML(i){
    const p = PLAYER_DATABASE[i];
    return '<span class="tier-badge ' + p.stufe + '">' + (p.stufe === 'gold' ? '★ GOLD' : p.stufe === 'silber' ? '◆ SILBER' : '● BRONZE') + '</span>' +
      '<img src="' + BILDER[p.bild] + '" alt=""><span class="wert">' + p.rating + '</span><span class="stern">★</span>' + (faehigkeiten(p).length ? '<span class="fae">' + faeIcons(p) + '</span>' : '') +
      '<span class="name"><span>' + p.name + '</span></span><span class="rolle41">' + ({ TW: 'TOR', DF: 'ABWEHR', MF: 'MITTELFELD', ST: 'STURM' }[p.role] || p.role) + '</span>';
  }
  function wahlZeigen(){
    const w = STAND.wahl; if (!w) return;
    const alt = document.getElementById('packWahl41'); if (alt) alt.remove();
    const o = document.createElement('div'); o.id = 'packWahl41';
    const idx = w.karten.map(n => PLAYER_DATABASE.findIndex(p => p.name === n)).filter(i => i >= 0);
    o.innerHTML = '<div class="pw-box"><h3>' + NAME[w.art] + '-PACK</h3><div class="pw-sub">Wähle <b>einen</b> Spieler aus.</div><div class="pw-reihe">' +
      idx.map(i => '<button type="button" class="karte stufe-' + PLAYER_DATABASE[i].stufe + ' pw-karte" data-n="' + PLAYER_DATABASE[i].name + '" style="--c:' + (PLAYER_DATABASE[i].farbe || '#2f6fe0') + '">' + karteHTML(i) + '</button>').join('') +
      '</div></div>';
    document.body.appendChild(o);
    o.querySelectorAll('.name').forEach(el => { try { namePassen(el); } catch (e) {} });
    o.querySelectorAll('.pw-karte').forEach(b => b.addEventListener('click', () => {
      const i = STAND.karteWaehlen(b.dataset.n); if (i === false) return;
      b.classList.add('gewaehlt'); try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(true); } catch (e) {}
      setTimeout(() => { o.remove(); let t = null; try { t = karteInsTeam(i); } catch (e) {} meldung('★ ' + (t || b.dataset.n + ' ist jetzt in deinem Team!')); try { zeichneKarten(); } catch (e) {} anzeigen(); }, 650);   // V5.3
    }));
  }
  function sichern(){
    try {
      const code = STAND.code(); if (!code) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
      a.download = 'Silescrow_Cup_Team_' + new Date().toISOString().slice(0, 10) + '.txt'; document.body.appendChild(a); a.click(); a.remove();
      meldung('💾 Team gesichert – Datei gut aufheben!');
    } catch (e) { meldung('Sichern hat nicht geklappt.'); }
  }
  function ladenDatei(){
    const f = document.createElement('input'); f.type = 'file'; f.accept = '.txt,text/plain';
    f.addEventListener('change', () => { const d = f.files && f.files[0]; if (!d) return; const r = new FileReader();
      r.onload = () => { if (STAND.laden(String(r.result || ''))){ meldung('📂 Team geladen!'); try { zeichneKarten(); } catch (e) {} anzeigen(); listeZeigen(); } else meldung('Die Datei ist kein gültiger Spielstand.'); };
      r.readAsText(d); });
    f.click();
  }
  // V4.1: Stars der Nationen gezielt kaufen (Original +2, die Nation spielt weiter mit ihrer Fake-Karte)
  function nationVon(i){ for (const n in NATION_KARTEN) if (NATION_KARTEN[n].includes(i)) return n; return null; }
  function flagge(n){ const l = COUNTRY_DATABASE.find(x => x[0] === n); return l ? l[1] : '🏳️'; }
  function sternListe(){
    const alt = document.getElementById('packListe'); if (alt) alt.remove();
    const cr = STAND.credits, o = document.createElement('div'); o.id = 'packListe';
    const reihe = i => { const p = PLAYER_DATABASE[i], n = nationVon(i), hat = STAND.hatKarte(i), preis = EINZEL_PREIS[p.stufe];
      return '<div class="sl-zeile ' + p.stufe + '"><img src="' + BILDER[p.bild] + '" alt=""><span class="sl-wert">' + (p.rating + PACK_BONUS_VON(p)) + '</span><span class="sl-name"><b>' + p.name + '</b><small>' +
        (n ? flagge(n) + ' ' + n : 'ohne Nation') + ' · ' + ({ TW: 'Tor', DF: 'Abwehr', MF: 'Mittelfeld', ST: 'Sturm' }[p.role] || p.role) + '</small></span>' +
        (hat ? '<em class="sl-hat">✓ IM TEAM</em>' : '<button type="button" class="sl-kauf' + (cr < preis ? ' teuer' : '') + '" data-n="' + p.name + '"><span class="sc-muenze">C</span> ' + zahl(preis) + '</button>') + '</div>'; };
    const liste = st => PLAYER_DATABASE.map((p, i) => i).filter(i => PLAYER_DATABASE[i].stufe === st).sort((a, b) => PLAYER_DATABASE[b].rating - PLAYER_DATABASE[a].rating);
    o.innerHTML = '<div class="pl-box"><h3>STARS DER NATIONEN</h3><div class="pl-cr"><span class="sc-muenze">C</span> <b>' + zahl(cr) + '</b> Crows</div>' +
      '<div style="font:600 12px/1.3 system-ui,sans-serif;opacity:.85">Kaufe gezielt einen Star. Du bekommst das <b>Original (+2)</b> – seine Nation spielt weiter mit einer schwächeren Kopie.</div>' +
      ['gold', 'silber', 'bronze'].map(st => '<div class="sl-titel ' + st + '">' + NAME[st] + '</div>' + liste(st).map(reihe).join('')).join('') +
      '<div class="pl-knoepfe"><button type="button" class="pl-zu pl-shop">◀ ZUM SHOP</button><button type="button" class="pl-zu pl-ende">ZURÜCK</button></div></div>';
    document.body.appendChild(o);
    const zu = () => o.remove();
    o.addEventListener('click', e => { if (e.target === o) zu(); });
    o.querySelector('.pl-ende').addEventListener('click', zu);
    o.querySelector('.pl-shop').addEventListener('click', () => { zu(); listeZeigen(); });
    o.querySelectorAll('.sl-kauf').forEach(b => b.addEventListener('click', () => {
      const r = STAND.einzelKaufen(b.dataset.n);
      if (r.fehler === 'geld'){ const i = PLAYER_DATABASE.findIndex(p => p.name === b.dataset.n); meldung('Nicht genug Crows – dir fehlen ' + zahl(EINZEL_PREIS[PLAYER_DATABASE[i].stufe] - STAND.credits) + '.'); return; }
      if (r.ok != null){ meldung('★ ' + b.dataset.n + ' ist jetzt in deinem Team!'); try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(true); } catch (e) {} try { zeichneKarten(); } catch (e) {} anzeigen(); sternListe(); }
    }));
  }
  /* V3.0 Pack-Übersicht (Variante B): je Stufe ein Banner – Gold, dann Silber, dann Bronze, je 10 Spieler pro Seite, die Stärksten zuerst */
function packUebersicht(){
  const alt = document.getElementById('packUebersicht'); if (alt) alt.remove();
  const STUFEN = ['gold', 'silber', 'bronze'], NAME = { gold: 'GOLD', silber: 'SILBER', bronze: 'BRONZE' };
  const proStufe = {}; STUFEN.forEach(st => { proStufe[st] = PLAYER_DATABASE.map((p, i) => [i, p]).filter(([i, p]) => p.stufe === st).sort((x, y) => y[1].rating - x[1].rating); });
  const SEITE = 10, seiten = [];
  STUFEN.forEach(st => { const l = proStufe[st], n = Math.max(1, Math.ceil(l.length / SEITE)); for (let k = 0; k < n; k++) seiten.push({ st, nr: k + 1, von: n, liste: l.slice(k * SEITE, k * SEITE + SEITE) }); });
  let seite = 0;
  const o = document.createElement('div'); o.id = 'packUebersicht'; o.className = 'pu2';
  const zeichne = () => {
    const sd = seiten[seite], st = sd.st;
    const hatK = i => { try { return !!STAND.hatKarte(i); } catch (e) { return false; } };
    const gezogen = proStufe[st].filter(([i]) => hatK(i)).length;
    const karten = sd.liste.map(([i, p]) => '<div class="pu2-k ' + st + (hatK(i) ? ' hat' : ' fehlt') + '">' + (hatK(i) ? '<i class="pu2-haken">✓</i>' : '') + '<span class="pu2-siegel">' + NAME[st] + '</span><div class="pu2-bild"><img src="' + BILDER[p.bild] + '" alt=""></div><b class="pu2-w">' + (p.rating + PACK_BONUS_VON(p)) + '</b>' + (p.pos ? '<i class="pu2-pos">' + p.pos + '</i>' : '') + '<span class="pu2-n">' + p.name + '</span></div>').join('');
    const weitere = STUFEN.filter(x => x !== st).map(x => '<button type="button" class="pu2-sprung ' + x + '" data-st="' + x + '">' + NAME[x] + ' (' + proStufe[x].length + ')</button>').join('');
    o.innerHTML = '<div class="pu2-box"><h3 class="pu2-titel">🎲 PACK-ÜBERSICHT</h3><div class="pu2-banner ' + st + '">' + (st === 'bronze' ? '● ● ' : '★ ★ ') + NAME[st] + '-SPIELER' + (st === 'bronze' ? ' ● ●' : ' ★ ★') + '<small class="pu2-zaehl">✓ ' + gezogen + ' / ' + proStufe[st].length + ' gezogen</small></div>' +
      '<div class="pu2-raster">' + karten + '</div>' +
      '<div class="pu2-nav"><button type="button" class="pu2-prev"' + (seite === 0 ? ' disabled' : '') + '>‹</button><span>' + NAME[st] + ' · SEITE ' + sd.nr + ' / ' + sd.von + '</span><button type="button" class="pu2-next"' + (seite >= seiten.length - 1 ? ' disabled' : '') + '>›</button><span class="pu2-leg">' + weitere + '</span><button type="button" class="pu2-zu">SCHLIESSEN</button></div></div>';
    o.querySelector('.pu2-prev').addEventListener('click', () => { if (seite > 0){ seite--; zeichne(); } });
    o.querySelector('.pu2-next').addEventListener('click', () => { if (seite < seiten.length - 1){ seite++; zeichne(); } });
    o.querySelector('.pu2-zu').addEventListener('click', () => o.remove());
    o.querySelectorAll('.pu2-sprung').forEach(b => b.addEventListener('click', () => { seite = seiten.findIndex(x => x.st === b.dataset.st); zeichne(); }));
  };
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  zeichne();
  document.body.appendChild(o);
}
function listeZeigen(){
    const alt = document.getElementById('packListe'); if (alt) alt.remove();
    if (STAND.wahl){ wahlZeigen(); return; }
    const liste = offene(), cr = STAND.credits;
    const o = document.createElement('div'); o.id = 'packListe';
    const kauf = a => { const rest = STAND.packPool(a).length, preis = PACK_PREIS[a], zuTeuer = cr < preis;
      return '<button type="button" class="pl-pack ' + a + (rest ? '' : ' alle') + (zuTeuer && rest ? ' teuer' : '') + '" data-kauf="' + a + '"' + (rest ? '' : ' disabled') + '>' + (liste.filter(pk => pk.art === a).length ? '<i class="pl-zahl">' + liste.filter(pk => pk.art === a).length + '</i>' : '') + '<b>★</b><span>' + NAME[a] + '</span><em>' + (rest ? '<span class="sc-muenze">C</span> ' + zahl(preis) : 'ALLE GESAMMELT') + '</em>' + (rest ? '<small>noch ' + rest + '</small>' : '') + '</button>'; };
    o.innerHTML = '<div class="pl-box"><h3>PACK-SHOP</h3><div class="pl-cr"><span class="sc-muenze">C</span> <b>' + zahl(cr) + '</b> Crows</div>' +
      '<div class="pl-t1" style="font:600 13px/1.3 system-ui,sans-serif;opacity:.85">Kaufe ein Pack: beim Öffnen kommt genau ein Spieler heraus. Jeder Spieler kommt nur einmal.</div>' +
      '<div class="pl-reihe pl-r1' + (liste.length ? '' : ' pl-allein') + '">' + ['bronze', 'silber', 'gold'].map(kauf).join('') + '</div>' +
      '<div class="pl-t2" style="font:700 12px/1.3 system-ui,sans-serif;opacity:.85">Deine Karte ist das Original (Gold +10 · Silber +7 · Bronze +5). Die Nation spielt danach mit einer viel schwächeren Kopie (−20).</div>' +   // V5.2: kein Transfersystem mehr
      (liste.length ? '<div class="pl-oh" style="font:800 13px/1.3 system-ui,sans-serif;color:#ffe234;margin-top:4px">DEINE UNGEÖFFNETEN PACKS</div><div class="pl-reihe pl-r2">' +
        liste.map((pk, i) => '<button type="button" class="pl-pack ' + pk.art + '" data-i="' + i + '"><b>★</b><span>' + (NAME[pk.art] || 'PACK') + '</span><em>ÖFFNEN</em></button>').join('') + '</div>' : '') +
      '<div class="pl-info">🔥 5 Siege in Folge: +200 / 300 / 400 <span class="sc-muenze">C</span> · 👑 MVP: +200 / 300 / 400 (je Stufe) · 🏆 Titel bringen die großen Prämien</div>' +
      '<div class="pl-knoepfe"><button type="button" class="pl-zu pl-uebersicht">🎲 Pack-Übersicht</button><button type="button" class="pl-zu pl-ende">ZURÜCK</button></div></div>';
    document.body.appendChild(o);
    const zu = () => o.remove();
    o.addEventListener('click', e => { if (e.target === o) zu(); });
    o.querySelector('.pl-ende').addEventListener('click', zu);
    o.querySelector('.pl-uebersicht').addEventListener('click', () => packUebersicht());
    o.querySelectorAll('.pl-pack[data-i]').forEach(b => b.addEventListener('click', () => { const pk = liste[+b.dataset.i]; zu();
      if (pk && pk.quelle === 'kauf' && window.zeigeFinalPack){
        const k = STAND.kaufPackZiehen(pk);
        if (!k){ meldung('Du hast schon alle ' + NAME[pk.art] + '-Spieler – Crows zurück.'); anzeigen(); listeZeigen(); return; }
        try { window.zeigeFinalPack(pk, false, () => { try { anzeigen(); listeZeigen(); } catch (e) {} }); } catch (e) {} return;
      }
      if (pk && pk.quelle === 'kauf'){
        const r = STAND.kaufPackOeffnen(pk);
        if (r.fehler === 'alle') meldung('Du hast schon alle ' + NAME[pk.art] + '-Spieler – Crows zurück.');
        else if (r.karte){ let t = null; try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(true); } catch (e) {} try { t = karteInsTeam(r.ok); } catch (e) {} meldung('🎴 ' + r.karte + ' gezogen! ' + (t ? 'Zum Team hinzugefügt.' : 'Der Spieler ist jetzt in deiner Sammlung.')); try { zeichneKarten(); } catch (e) {} }
        anzeigen(); return;
      }
      try { window.zeigeFinalPack && window.zeigeFinalPack(pk, false, () => { try { anzeigen(); listeZeigen(); } catch (e) {} }); } catch (e) {} }));
    o.querySelectorAll('.pl-pack[data-kauf]').forEach(b => b.addEventListener('click', () => {
      const r = STAND.packKaufenLagern(b.dataset.kauf);   // V4.8: Pack wird gesammelt
      if (r.fehler === 'geld'){ meldung('Nicht genug Crows – dir fehlen ' + zahl(PACK_PREIS[b.dataset.kauf] - STAND.credits) + '.'); return; }
      if (r.fehler === 'alle'){ meldung('Du hast schon alle ' + NAME[b.dataset.kauf] + '-Spieler.'); return; }
      if (r.ok){ meldung(NAME[b.dataset.kauf] + '-Pack gekauft – du hast jetzt ' + r.anzahl + '.'); zu(); anzeigen(); listeZeigen(); }
    }));
  }
  window.__packShop = listeZeigen;
  function los(){ const k = document.getElementById('packKnopf'); if (k && !k.__an){ k.__an = 1; k.addEventListener('click', listeZeigen); } anzeigen(); if (!window.__packUhr) window.__packUhr = setInterval(anzeigen, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
  window.__packAnzeige = anzeigen;
})();
