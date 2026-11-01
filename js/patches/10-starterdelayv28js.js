/* Silescrow Cup V 4.2 – js/patches/10-starterdelayv28js.js */

(function(){
  // V2.28: Einmaliges Bronze-Starter-Pack ca. 10 Sekunden nach dem Eintritt ins Hauptmenü.
  // Keine Popup-Abfrage und keine doppelte Starter-Logik.
  var done=false, timer=null;
  function removeLegacy(){
    try{
      var p=document.getElementById('starterMainPopup'); if(p) p.remove();
      var st=document.getElementById('starterPackStatus'); if(st) st.hidden=true;
      var sb=document.getElementById('starterPackButton'); if(sb) sb.remove();
    }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  function getStarter(){
    try{
      var p=STAND.packs.find(function(x){return x&&x.quelle==='starter';});
      if(p) return p;
      var given=!!(STAND.daten&&STAND.daten.starterGiven);
      try{given=given||LS81.getItem('sc_starter_silber_v1')==='1';}catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      if(given) return null;
      p=STAND.packVerdienen('bronze','starter');
      try{LS81.setItem('sc_starter_silber_v1','1');}catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      return p;
    }catch(e){return null;}
  }
  function menuVisible(){
    var m=document.getElementById('menue');
    if(!m || m.hidden) return false;
    var f=document.getElementById('finalPack');
    return !f || f.hidden;
  }
  function open(){
    if(done || !menuVisible()) return false;
    var p=getStarter();
    if(!p || typeof window.zeigeStarterPack!=='function') return false;
    done=true;
    try{window.zeigeStarterPack(p,null);}catch(e){done=false;return false;}
    setTimeout(function(){
      try{
        var pack=document.getElementById('fpPack');
        if(pack && !pack.hidden) pack.click();
      }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
    },650);
    return true;
  }
  function arm(){
    removeLegacy();
    if(timer) clearInterval(timer);
    var waited=0;
    timer=setInterval(function(){
      removeLegacy();
      if(menuVisible()){
        waited+=250;
        if(waited>=10000 && open()){clearInterval(timer);timer=null;}
      } else waited=0;
    },250);
    setTimeout(function(){if(timer){clearInterval(timer);timer=null;}},30000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',arm,{once:true}); else arm();
})();
