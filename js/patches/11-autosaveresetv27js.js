/* Silescrow Cup V 4.2 – js/patches/11-autosaveresetv27js.js */

(function(){
  // V2.27: Speichern/Laden sind vollständig entfernt. STAND speichert automatisch.
  // Nur "NEUES SPIEL" bleibt als bewusste, bestätigte Komplettlöschung.
  // WERKSZUSTAND: wirklich alles weg – Spielstand, Kader, Liga, Cup, Hall of Fame, Einstellungen und auch „Glücksrad schon gesehen“
  function loeschenUndNeu(){
    try{ var S = window.localStorage, del = []; for (var i = 0; i < S.length; i++){ var k = S.key(i); if (k && (k.indexOf('sc81_') === 0 || k.indexOf('silescrow') === 0 || k.indexOf('sc_') === 0)) del.push(k); } del.forEach(function(k){ S.removeItem(k); }); }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    try{ window.localStorage.removeItem('sc_autosave'); window.localStorage.removeItem('sc_slot1_geleert'); }catch(e){}   // V3.08: Auto-Save mitlöschen
    try{ window.sessionStorage.clear(); }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    try{ window.name = String(window.name).replace(/\s*scRadNie/g, ''); }catch(e){}
    try{ window.__radNie = false; window.__radGedreht = false; }catch(e){}
    try{ window.localStorage.setItem('scResetTs', String(Date.now())); }catch(e){}   // V11.28: alte Sicherung (IndexedDB) darf nach dem Zurücksetzen nicht zurückkommen
    try{ indexedDB.deleteDatabase('silescrowCup'); }catch(e){}
    try{ if (window.indexedDB && indexedDB.databases) indexedDB.databases().then(function(ds){ ds.forEach(function(d){ if (d && d.name) indexedDB.deleteDatabase(d.name); }); }); }catch(e){}
    setTimeout(function(){ window.location.reload(); }, 150);
  }
  function resetSpielstand(){
    var text = '<span style="display:block;background:#d62828;color:#fff;border:2px solid #000;border-radius:10px;padding:6px 8px;margin:0 0 6px;font-weight:900;line-height:1.25">⚠️ ACHTUNG: ALLE PACKS UND SPIELER VERSCHWINDEN!<br><small style="font-weight:700">Gekaufte und ungeöffnete Packs, alle Gold-, Silber- und Bronze-Spieler, Crows, Titel, Liga, Silescrow Cup und Hall of Fame werden gelöscht – das kann nicht rückgängig gemacht werden.</small></span><span style=\"display:block;background:#ffe234;color:#000;border:2px solid #000;border-radius:10px;padding:5px 8px;margin:0 0 6px;font-weight:900;line-height:1.25\">🗑️ Auch der AUTO-SAVE wird gelöscht – du verlierst wirklich alles!</span>Tipp: vorher im Spielstand-Fenster auf einem Platz SPEICHERN – manuell gespeicherte Plätze bleiben erhalten.';   // V11.21: deutlicher Warnhinweis
    if (typeof window.wahlDialog === 'function'){ window.wahlDialog('NEUES SPIEL STARTEN?', text, '🗑️ JA, ALLES ZURÜCKSETZEN', 'ABBRECHEN', loeschenUndNeu, function(){}); return; }
    if (window.confirm('Wirklich ein neues Spiel starten?\n\n' + text)) loeschenUndNeu();
  }
  window.__scLoeschenUndNeu = loeschenUndNeu;   // V3.10: wird vom Spielstand-Fenster genutzt (letzten Platz löschen)
  function bind(){
    var b=document.getElementById('neuesSpielKnopf');
    if(!b || b.dataset.bound==='1') return;
    b.dataset.bound='1';
    b.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); resetSpielstand(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  setTimeout(bind,100); setTimeout(bind,500);
})();
