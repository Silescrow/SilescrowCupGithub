/* Silescrow Cup V 4.2 – js/werte-konfig.js (Teil des früheren Hauptskripts, Reihenfolge unverändert) */
               // Porträts (Brust aufwärts), Schlüssel = Figur im Raster (r1c1 = Silescrow)
// =====================================================================
// SPIELSTAND: Training, Karten, Packs, Titel – gespeichert auf diesem Handy
// =====================================================================
const WERT_NAMEN = { abw: 'Abwehr', pas: 'Passspiel', sch: 'Schuss', aud: 'Ausdauer', tem: 'Schnelligkeit' };
const WERT_ICON = { abw: '🛡️', pas: '👟', sch: '⚽', aud: '🔋', tem: '⚡' };
const SPEZIAL = { abw: { name: 'MAUER', icon: '🧱', text: 'gewinnt kurz fast jeden Zweikampf' }, pas: { name: 'ZAUBERPASS', icon: '✨', text: 'Pässe kommen genau und schnell an' },
  sch: { name: 'FEUERSCHUSS', icon: '🔥', text: 'brennender Ball, schwer zu halten' }, dri: { name: 'ÜBERSTEIGER', icon: '🌀', text: 'Gegner kommen nicht an den Ball' },
  tem: { name: 'TURBO', icon: '⚡', text: 'kurz extrem schnell' } };
// V4.1: Eigene Spieler starten mit 62–76 (SILESCROW 76) und sind höchstens bis 110 trainierbar (Bronze-Niveau).
// Trainingspunkte: Sieg 5, Unentschieden 3, Niederlage 1. Jeder Punkt-Schritt kostet je nach Höhe 2/5/8/11/15/20 Punkte.
const START_WERT = 70, MAX_WERT = 110, PUNKTE_PRO_SPIEL = 5;
const MAX_SILESCROW = 135;   // V5.0: die Hauptfigur kann bis auf Gold-Niveau (135) trainiert werden, alle anderen bis 110
const maxWertVon = i => (PLAYER_DATABASE[i] && PLAYER_DATABASE[i].name === 'SILESCROW') ? MAX_SILESCROW : MAX_WERT;
const WERT_KEYS = ['tem', 'sch', 'pas', 'aud', 'abw'];
const TP_ERGEBNIS = { S: 5, U: 3, N: 1 };
const CREDITS_STUFE = { leicht: { S: 0, U: 0, N: 0 }, mittel: { S: 0, U: 0, N: 0 }, stark: { S: 0, U: 0, N: 0 } }   /* V3.03: keine Crows mehr pro Spiel */, CREDITS_PRO_TOR = 0, START_CREDITS = 1000;   // V11.6: Belohnungen je Schwierigkeit, Tore geben nichts
const SERIE_STUFE = { leicht: 200, mittel: 300, stark: 400 }   /* V3.09: 5 Siege in Folge je Stufe */, MVP_BONUS = 200, MVP_STUFE = { leicht: 200, mittel: 300, stark: 400 }, STUFE_OK = s => (s === 'leicht' || s === 'stark') ? s : 'mittel';
const SERIE_LAENGE = 5, SERIE_BONUS = 200;   // V3.09: 5 Siege in Folge = +200 Crows
const PACK_PREIS = { bronze: 2500, silber: 6000, gold: 15000 };
const EINZEL_PREIS = { bronze: 3750, silber: 9000, gold: 22500 };   // V4.1: gezielt einen Star kaufen (teurer als ein Pack)
// V5.3: Fähigkeiten – Silber: 1 Stärke · Gold: 2 Stärken + 1 Spezialschuss · ab 90: Weltklasse (realistisch, keine Zauberei)
const FAEHIGKEIT = {
  kopf:  { i: '🎯', n: 'Kopfballstark', t: 'gewinnt mehr Kopfballduelle, köpft genau ins Eck' },
  schuss:{ i: '💥', n: 'Schusskraft', t: 'härtere, genauere Schüsse – Torwart pariert schwerer' },
  pass:  { i: '🧭', n: 'Passgenie', t: 'Pässe und Steilpässe kommen genauer an' },
  antritt:{ i: '⚡', n: 'Antritt', t: 'schneller im Sprint' },
  zweikampf:{ i: '🧱', n: 'Zweikampf', t: 'gewinnt mehr Tacklings' },
  finesse:{ i: '🌀', n: 'Finesse-Schuss', t: 'Schüsse mit Effet ins lange Eck' },
  volley:{ i: '🦶', n: 'Volley', t: 'nimmt hohe Bälle im Strafraum direkt' },
  elfer: { i: '🥅', n: 'Elfmeter-Profi', t: 'verschießt fast nie' },
  welt:  { i: '👑', n: 'Weltklasse', t: 'ab 90 trainiert: weniger müde, bessere Ballannahme' }
};
function faehigkeiten(d){
  if (!d) return [];
  let h = 7; for (const ch of String(d.name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = d.role === 'ST' ? ['kopf', 'schuss', 'antritt', 'kopf', 'schuss'] : d.role === 'DF' ? ['zweikampf', 'kopf', 'antritt', 'zweikampf', 'pass'] : ['pass', 'schuss', 'antritt', 'zweikampf', 'pass'];
  const r = [];
  const zieh = (liste, n) => { for (let k = 0; r.length < n && k < 12; k++){ const f = liste[(h + k * 3) % liste.length]; if (!r.includes(f)) r.push(f); } };
  if (d.stufe === 'silber') zieh(pool, 1);
  else if (d.stufe === 'gold'){ zieh(pool, 2); const sp = ['finesse', 'volley', 'elfer']; r.push(sp[(h >>> 4) % 3]); }
  // Weltklasse: normale Spieler, die du auf 90+ trainiert hast (Karten-Spieler haben schon ihre Stärken)
  if (!d.stufe){ let g = d.rating; try { g = STAND.gesamt(PLAYER_DATABASE.indexOf(d)) || g; } catch (e) {} if (g >= 90) r.push('welt'); }
  return r;
}
const faeIcons = d => faehigkeiten(d).map(f => '<span title="' + FAEHIGKEIT[f].n + ': ' + FAEHIGKEIT[f].t + '">' + FAEHIGKEIT[f].i + '</span>').join('');
const PACK_BONUS = 5; const PACK_BONUS_STUFE = { gold: 10, silber: 7, bronze: 5 }, PACK_BONUS_VON = p => (p && PACK_BONUS_STUFE[p.stufe]) || PACK_BONUS, KOPIE_MALUS = 20;   // V3.05: dein Original Gold +10 / Silber +7 / Bronze +5, Kopie der Nation −20   // V4.1: gekaufte Pack-Spieler sind bei dir +2 stärker als dieselbe Karte bei ihrer Nation
// V3.16: Zähler für abgeschlossene Spiele
const SPIELE = (() => {
  let n = 0; try { n = +LS81.getItem('sc_spiele_n') || 0; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  return { n: () => n, plus(){ n++; try { LS81.setItem('sc_spiele_n', String(n)); } catch(e){typeof __scWarn==='function'&&__scWarn(e)} } };
})();
const ISTTRAIN = p => !!p && !!(p.eigen || (p.ki && !p.stufe));   // trainierbar: eigene + normale Figuren (keine Pack-Karten)
const nameHash = n => { let h = 2166136261 >>> 0; for (const ch of String(n || '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
// V4.1: Startwerte – die 45 sichtbaren Spieler: 5 Leistungsträger (74–76), 15 gute (70–73), 20 normale (66–69), 5 schwache (62–65)
const START_BASIS = (() => {
  const db = PLAYER_DATABASE, m = {};
  const basis = db.map((p, i) => i).filter(i => !db[i].stufe).sort((a, b) => ((db[a].ki ? 1 : 0) - (db[b].ki ? 1 : 0)) || a - b);
  const sc = basis.find(i => db[i].name === 'SILESCROW');
  const sicht = (sc == null ? basis : [sc].concat(basis.filter(i => i !== sc))).slice(0, 45);
  const rest = sicht.filter(i => i !== sc).sort((a, b) => nameHash(db[a].name) - nameHash(db[b].name) || a - b);
  if (sc != null) m[sc] = 76;
  rest.forEach((i, r) => { const h = nameHash(db[i].name + '#'); m[i] = r < 4 ? 74 + (h % 2) : r < 19 ? 70 + (h % 4) : r < 39 ? 66 + (h % 4) : 62 + (h % 4); });
  basis.forEach(i => { if (m[i] == null) m[i] = 64 + (nameHash(db[i].name + '#') % 13); });
  return m;
})();
const WERT_PROFIL = { ST: { tem: 3, sch: 4, pas: -2, aud: -1, abw: -4 }, MF: { tem: 0, sch: -2, pas: 4, aud: 3, abw: -5 },
                      DF: { tem: -2, sch: -5, pas: -1, aud: 2, abw: 6 }, TW: { tem: 0, sch: 0, pas: 0, aud: 0, abw: 0 } };
function startWerte(i){
  const p = PLAYER_DATABASE[i], b = START_BASIS[i] != null ? START_BASIS[i] : START_WERT, pr = WERT_PROFIL[p && p.role] || WERT_PROFIL.TW, w = {};
  WERT_KEYS.forEach(k => { w[k] = Math.max(50, Math.min(MAX_WERT, b + (pr[k] || 0))); });
  return w;
}
// Kosten für den nächsten Punkt (von v auf v+1)
function trainKosten(v){ const t = v + 1; return t <= 78 ? 2 : t <= 82 ? 5 : t <= 86 ? 8 : t <= 90 ? 11 : t <= 100 ? 15 : 20; }