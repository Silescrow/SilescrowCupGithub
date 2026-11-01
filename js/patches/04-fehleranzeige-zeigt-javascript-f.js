/* Silescrow Cup V 4.2 – js/patches/04-fehleranzeige-zeigt-javascript-f.js */

/* V3.7 Fehleranzeige: zeigt JavaScript-Fehler unten im Bild an (Tippen = schließen) und merkt den letzten Fehler für den nächsten Start. */
(function(){
  var KEY = 'silescrow_letzter_fehler', box = null;
  function heap(){ return ''; }
  function zeige(text, alt){
    try {
      if (!box){
        box = document.createElement('div');
        box.style.cssText = 'position:fixed;left:50%;top:4px;transform:translateX(-50%);max-width:60vw;z-index:2147483647;background:rgba(176,0,32,.92);color:#fff;font:11px/1.3 Arial,sans-serif;padding:5px 9px;border-radius:8px;white-space:pre-wrap;max-height:22vh;overflow:hidden;pointer-events:none';
        box.addEventListener('click', function(){ box.remove(); box = null; });
        (document.body || document.documentElement).appendChild(box);
      }
      box.textContent = (alt ? 'Fehler vom letzten Mal:\n' : 'Fehler:\n') + text;
      clearTimeout(zeige._t); zeige._t = setTimeout(function(){ try { if (box){ box.remove(); box = null; } } catch(e){typeof __scWarn==='function'&&__scWarn(e)} }, 6000);
    } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  function melde(msg, ort){
    var t = msg + (ort ? ' @ ' + ort : '') + heap();
    zeige(t, false);
    try { LS81.setItem(KEY, new Date().toLocaleTimeString() + ' ' + t); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  addEventListener('error', function(e){ melde(e.message || 'Fehler', (e.lineno || '?') + ':' + (e.colno || '?')); });
  addEventListener('unhandledrejection', function(e){ var r = e.reason; melde('Promise: ' + (r && r.message ? r.message : r), ''); });
  addEventListener('DOMContentLoaded', function(){
    try { var alt = LS81.getItem(KEY); if (alt){ zeige(alt, true); LS81.removeItem(KEY); } } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  });
})();
