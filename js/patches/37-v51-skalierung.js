/* Silescrow Cup V 4.2 – js/patches/37-v51-skalierung.js */

/* V5.1: Installierte App: Skalierung nach Start und bei jeder Groessen-/Ausrichtungsaenderung neu berechnen */
(function(){
  function neu(){ try{ if(typeof skaliere==='function') skaliere(); }catch(e){} try{ window.dispatchEvent(new Event('resize')); }catch(e){} }
  var w0=0,h0=0;
  function pruef(){ if(innerWidth!==w0||innerHeight!==h0){ w0=innerWidth; h0=innerHeight; neu(); } }
  [100,400,1000,2000,4000].forEach(function(ms){ setTimeout(neu,ms); });
  window.addEventListener('orientationchange',function(){ setTimeout(neu,150); setTimeout(neu,600); });
  window.addEventListener('pageshow',function(){ setTimeout(neu,100); });
  try{ if(window.visualViewport) visualViewport.addEventListener('resize',pruef); }catch(e){}
  setInterval(pruef,700);
  try{ if(screen.orientation&&screen.orientation.lock&&matchMedia('(display-mode: standalone)').matches) screen.orientation.lock('landscape').catch(function(){}); }catch(e){}
})();
