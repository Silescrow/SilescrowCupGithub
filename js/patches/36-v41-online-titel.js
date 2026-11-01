/* Silescrow Cup V 4.2 – js/patches/36-v41-online-titel.js */

/* V4.1: Online-Fenster wie offline. AUFSTELLUNG ist sofort nutzbar (auch ohne Gast) und fuehrt danach zurueck zum Warten. */
function v41AufstellungOeffnen(zurueckId){
  var fenster=document.getElementById(zurueckId); if(fenster) fenster.hidden=true;
  try{ formEditorOeffnen(); }catch(e){ try{ document.getElementById('formKnopf').click(); }catch(e2){} }
  var t0=Date.now(), iv=setInterval(function(){
    var ov=document.getElementById(window.__onHalleOffen ? 'vorAuf' : 'formEditor');   /* V3.07: Hallenfenster */
    if(!ov || !ov.isConnected || ov.style.display==='none' || Date.now()-t0>600000){ clearInterval(iv); if(fenster) fenster.hidden=false; }
  },300);
}
setInterval(function(){ try{
  var gast=false; try{ gast = NETZ.rolle==='gast' && !!NETZ.partner; }catch(e){}
  var mp=document.getElementById('mpUeber');
  if(mp && !mp.hidden){
    var alt=mp.querySelector('#mpAuf'); if(alt) alt.remove();   /* V5.2: AUFSTELLUNG nur noch im ONLINE-SPIEL-Fenster */
  }
  var o=document.getElementById('vsUeber'); if(!o||o.hidden) return;
  var h=o.querySelector('h2'); if(!h) return;
  var halle = gast ? !!NETZ.hostHalle : !!halleWahl;
  var neu = halle ? (window.HALLE_ICON||'')+'HALL OF FAME \u00B7 ONLINE' : '\u2694\uFE0F ONLINE-SPIEL';
  if(h.dataset.t!==neu){ h.dataset.t=neu; h.innerHTML=neu; }
  var los=o.querySelector('#vsLos'), auf=o.querySelector('#vsAuf');
  if(!auf && los){
    auf=document.createElement('button'); auf.type='button'; auf.id='vsAuf'; auf.innerHTML='\uD83D\uDCCB AUFSTELLUNG';
    auf.onclick=function(){ v41AufstellungOeffnen('vsUeber'); };
    los.parentNode.insertBefore(auf,los);
  }
  if(auf){ auf.hidden = gast; auf.disabled = false; }
}catch(e){} },500);
