/* Silescrow Cup V 4.2 – js/patches/26-scfuehrungjs.js */

(function(){
  var KEY = 'scFuehrungV207';
  function resetMarke(){ try { return localStorage.getItem('scResetTs') || '0'; } catch(e) { return '0'; } }
  var box = document.getElementById('scFuehrung');
  var txt = document.getElementById('scFuehrungText');
  var zahl = document.getElementById('scFuehrungZahl');
  var btn = document.getElementById('scFuehrungBtn');
  var fertig = false;
  var landAuf = false;
  function ende(){
    fertig = true;
    try { localStorage.setItem(KEY, resetMarke()); } catch(e) {}
    box.classList.remove('an');
  }
  function imLadebildschirm(){
    var l = document.getElementById('laden');
    if (!l) return false;
    if (l.hidden) return false;
    return getComputedStyle(l).display !== 'none';
  }
  // Modus-Knöpfe (Freundschaft, Hall of Fame, Liga, Pokal, Online) sind erst nach dem Team grau
  var MODUS_RE = /FREUNDSCHAFT|HALL\s*OF\s*FAME|LEAGUE|POKAL|CUP|ONLINE|LIGA/i;
  function sperreModi(sperren){
    var knoepfe = document.querySelectorAll('#menue button');
    for (var k = 0; k < knoepfe.length; k++){
      var b = knoepfe[k];
      if (b.id === 'scFuehrungBtn' || b.id === 'scFuehrungWeg') continue;
      var t = (b.textContent || '').trim();
      if (!MODUS_RE.test(t)) continue;
      if (sperren){
        if (!b.disabled || b.dataset.scSperre === '1'){ b.disabled = true; b.dataset.scSperre = '1'; b.classList.add('scModusGesperrt'); }
      } else if (b.dataset.scSperre === '1'){
        b.disabled = false; delete b.dataset.scSperre; b.classList.remove('scModusGesperrt');
      }
    }
  }
  function pruefe(){
    if (fertig) { box.classList.remove('an'); sperreModi(false); return; }
    if (imLadebildschirm()) { box.classList.remove('an'); return; }
    box.classList.add('an');
    var sq = (typeof zustand !== 'undefined' && zustand.squad) ? zustand.squad.length : 0;
    var tw = (typeof zustand !== 'undefined' && typeof zustand.torwart === 'number') ? zustand.torwart >= 0 : false;
    var twDa = tw; try { twDa = tw || (zustand.squad || []).some(function(i){ return PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role === 'TW'; }); } catch(e) {}   // V3.1: Torwart-Spieler im Team zählt schon vor der vollen Elf
    var er = (typeof zustand !== 'undefined' && zustand.ersatz) ? zustand.ersatz.length : 0;
    var land = (typeof zustand !== 'undefined') ? zustand.land : null;
    var liga = false;
    try { liga = !!(window.ligaGesperrt && window.ligaGesperrt()); } catch(e) {}
    var ok1 = sq >= 11, ok2 = tw, ok3 = er >= 2, ok4 = !!land || liga;
    // Sobald ein Land gewählt ist (oder eine Liga läuft), gilt die Einführung als erledigt
    if (ok4) { try { var rm = resetMarke(); if (localStorage.getItem(KEY) !== rm) localStorage.setItem(KEY, rm); } catch(e) {} }   // V3.05: nur schreiben, wenn sich etwas ändert
    // Erst die 13 Spieler, dann öffnet sich automatisch das Länderfenster (einmal pro Start)
    if (ok1 && ok2 && ok3 && !ok4 && !landAuf) {
      var lu = document.getElementById('landUeber');
      var lk = document.getElementById('landKnopf');
      if (lu && lu.hidden && lk) { landAuf = true; lk.click(); }
    }
    var rolleZahl = { DF: 0, MF: 0, ST: 0 };   // V2.08: Abwehr/Mittelfeld/Sturm in der Startelf (ohne Torwart)
    try { (zustand.squad || []).forEach(function(i, k){ if (i == null || k === zustand.torwart) return; var r = PLAYER_DATABASE[i] && PLAYER_DATABASE[i].role; if (rolleZahl[r] != null) rolleZahl[r]++; }); } catch(e) {}
    var ziele = [['DF','Abwehr',4],['MF','Mittelfeld',4],['ST','Sturm',2]];
    var haken = function(ok){ return ok ? ' <span class="scOk">✓</span>' : ''; };
    var zeile = 'Startelf ' + Math.min(sq,11) + '/11' + haken(sq >= 11) + ' · Torwart' + (twDa ? ' <span class="scOk">✓</span>' : ' fehlt') + ' · Ersatz ' + Math.min(er,2) + '/2' + haken(er >= 2) + ' · Land' + (ok4 ? ' <span class="scOk">✓</span>' : ' fehlt');
    ziele.forEach(function(z){ zeile += ' · ' + z[1] + ' ' + Math.min(rolleZahl[z[0]], z[2]) + '/' + z[2] + haken(rolleZahl[z[0]] >= z[2]); });
    zahl.innerHTML = zeile;
    var fehltRolle = ziele.filter(function(z){ return rolleZahl[z[0]] < z[2]; }).map(function(z){ return (z[2] - rolleZahl[z[0]]) + ' ' + ({ DF: 'Abwehrspieler', MF: 'Mittelfeldspieler', ST: 'Stürmer' })[z[0]]; });
    if (!twDa) fehltRolle.unshift('1 Torwart');   // V3.1: Torwart zuerst nennen
    if (!ok1) { txt.textContent = 'Wähle noch ' + (11 - sq) + ' Spieler'; }
    else if (!ok2) { txt.textContent = 'Wähle einen Torwart'; }
    else if (!ok3) { txt.textContent = 'Wähle noch ' + (2 - er) + ' Ersatzspieler'; }
    else if (!ok4) { txt.textContent = 'Wähle dein Land im Fenster'; }
    else { txt.textContent = 'Super! Alles bereit'; }
    var alles = ok1 && ok2 && ok3 && ok4;
    sperreModi(!alles);
    btn.disabled = !alles;
    btn.classList.toggle('ok', alles);
    btn.textContent = 'WEITER';
  }
  btn.addEventListener('click', function(){ if (!btn.disabled) ende(); });
  var schon = false;
  try { schon = localStorage.getItem(KEY) === resetMarke(); } catch(e) {}
  if (!schon) { setInterval(pruefe, 300); pruefe(); }
})();
