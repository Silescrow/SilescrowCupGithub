/* Silescrow Cup V 4.2 – js/patches/30-kleine-anzeige-automatisch-gespe.js */

/* V3.05: kleine Anzeige "Automatisch gespeichert" im Hauptmenü – erscheint nur, wenn wirklich gespeichert wurde, höchstens alle 30 s */
(function(){
  if (typeof LS81 === 'undefined' || !LS81 || typeof LS81.setItem !== 'function') return;
  var el = document.createElement('div'); el.id = 'scAutoSave'; el.textContent = '💾 Automatisch gespeichert'; document.body.appendChild(el);
  var letzte = 0, offen = false, t = 0, orig = LS81.setItem;
  function zeigen(){
    var me = document.getElementById('menue'), sp = document.getElementById('spiel');
    if (!me || me.hidden || (sp && !sp.hidden)){ offen = true; return; }   // im Spiel nicht – wird im Menü nachgeholt
    var jetzt = Date.now(), rest = 30000 - (jetzt - letzte);
    if (rest > 0){ offen = true; clearTimeout(t); t = setTimeout(zeigen, rest + 50); return; }
    offen = false; letzte = jetzt; el.classList.add('an'); setTimeout(function(){ el.classList.remove('an'); }, 2200);
  }
  var menueSeit = 0;   /* erst anzeigen, wenn das Hauptmenü schon 3 s zu sehen ist (nicht beim Spielstart) */
  setInterval(function(){ var me = document.getElementById('menue'); menueSeit = (me && !me.hidden) ? (menueSeit || Date.now()) : 0; }, 500);
  LS81.setItem = function(k, v){ var r = orig.apply(this, arguments); window.__scSaves = (window.__scSaves || 0) + 1; if (!menueSeit || Date.now() - menueSeit < 3000){ var sp = document.getElementById('spiel'); if (sp && !sp.hidden) offen = true; return r; } clearTimeout(t); t = setTimeout(zeigen, 500); return r; };
  setInterval(function(){ if (offen) zeigen(); }, 5000);
})();
