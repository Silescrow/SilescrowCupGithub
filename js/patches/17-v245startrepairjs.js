/* Silescrow Cup V 4.2 – js/patches/17-v245startrepairjs.js */

(function(){
  function repairStart(){
    try{
      var b=document.getElementById('start');
      if(!b) return;
      var team=window.zustand;
      var mx=window.TEAM_GROESSE || 5;
      if(team && Array.isArray(team.squad) && team.squad.length>=mx){
        var netz=window.NETZ;
        var blockedGuest=netz && netz.rolle==='host' && Array.isArray(netz.gaeste) && netz.gaeste.length>0 && Array.isArray(team.gastPlaetze) && team.gastPlaetze.some(function(x){return x && x.idx==null;});
        if(!blockedGuest){ b.disabled=false; b.classList.add('v245-ready'); }
      }
    }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  }
  setInterval(repairStart,300);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',repairStart); else repairStart();
})();
