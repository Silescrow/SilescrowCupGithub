/* Silescrow Cup V 4.2 – js/patches/38-v51-autosave-platz1.js */

/* V3.08: AUTO-SAVE liegt NICHT mehr in den Speicherplätzen. Er wird versteckt unter 'sc_autosave' gesichert (alle 20 s),
   die Plätze 1-3 bleiben für manuelles Speichern frei. "Alles zurücksetzen" löscht auch den Auto-Save. */
(function(){
  var KEY='sc_autosave';
  async function fuellen(){
    try{
      var S=window.localStorage; if(!S) return;
      var T=window.__spielstandTest; if(!T||!T.sammeln||!T.kodieren) return;
      var l=T.sammeln(); if(!l['sc81_sc_stand']) return;
      var code=await T.kodieren(l), cr=0,k=0,ti=0;
      try{ var d=JSON.parse(l['sc81_sc_stand']); cr=+d.cr||0; k=(d.karten||[]).length; ti=+d.titel||0; }catch(e){}
      S.setItem(KEY,JSON.stringify({t:Date.now(),auto:true,i:{cr:cr,k:k,ti:ti},c:code}));
    }catch(e){}
  }
  setTimeout(fuellen,8000);
  setInterval(fuellen,20000);
  try{
    var LSW=window.LS81; if(LSW&&typeof LSW.setItem==='function'){
      var o2=LSW.setItem, tm=0;
      LSW.setItem=function(k,v){ var r=o2.apply(this,arguments); if(k==='sc81_sc_stand'){ clearTimeout(tm); tm=setTimeout(fuellen,2500); } return r; };
    }
  }catch(e){}
  setInterval(function(){ var m=document.getElementById('menue'); if(m&&!m.hidden&&!window.__v51Menue){ window.__v51Menue=1; setTimeout(fuellen,4000); } },1500);
})();
