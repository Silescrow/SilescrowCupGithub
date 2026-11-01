/* Silescrow Cup V 4.2 – js/patches/32-v307-fixes-js.js */

(function(){
  /* V3.07: solange das Ergebnis-/MVP-Fenster offen ist, darf das Spielfeld Wischen nach oben/unten zulassen */
  function init(){
    var e=document.getElementById('endeUeber'), sp=document.getElementById('spiel');
    if(!e||!sp) return;
    var sync=function(){ sp.classList.toggle('endeOffen', !e.hidden); };
    try{ new MutationObserver(sync).observe(e,{attributes:true,attributeFilter:['hidden','class','style']}); }catch(x){}
    sync();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
