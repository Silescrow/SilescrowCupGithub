/* Silescrow Cup V 4.2 – js/patches/08-packsv19js.js */

(function(){
  // V19: ein einziges, robustes Pack-System. Alte Starter-Anzeigen komplett verstecken.
  var old=document.getElementById('starterPackStatus'); if(old) old.remove();
  var oldBtn=document.getElementById('starterPackButton'); if(oldBtn) oldBtn.remove();

  function starterPack(){
    try{
      var p=STAND.packs.find(function(x){return x&&x.quelle==='starter';});
      if(p) return p;
      // Der Starter darf nur EINMAL im gesamten Spielstand vergeben werden.
      // Der Marker liegt zusätzlich im eigentlichen Spielstand und nicht nur in LS81.
      var bereits=false;
      try{bereits=STAND.daten && STAND.daten.starterGiven===true;}catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      if(!bereits){ try{bereits=LS81.getItem('sc_starter_silber_v1')==='1';}catch(e){typeof __scWarn==='function'&&__scWarn(e)} }
      if(bereits) return null;
      p=STAND.packVerdienen('bronze','starter');
      try{LS81.setItem('sc_starter_silber_v1','1');}catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      return p;
    }catch(e){return null;}
  }
  function menuVisible(){
    var start=document.getElementById('start'), final=document.getElementById('finalPack');
    if(!start || (final && !final.hidden)) return false;
    var r=getComputedStyle(start); return r.display!=='none' && r.visibility!=='hidden';
  }
  var popup=document.createElement('div'); popup.id='starterMainPopup'; popup.hidden=true;
  popup.innerHTML='<div class="starter-v19-box" role="dialog" aria-modal="true"><div class="starter-v19-pack">🎁</div><h2>DEIN BRONZE-PACK</h2><p>Dein zufälliger Starter-Spieler wartet auf dich.</p><button type="button" id="starterV19Open">PACK ÖFFNEN</button></div>';
  document.body.appendChild(popup);
  var starterShown=false, starterOpened=false;
  function showStarter(){
    if(starterShown||starterOpened||!menuVisible()) return;
    var p=starterPack(); if(!p) return;
    starterShown=true; popup.hidden=false;
  }
  function openStarter(){
    if(starterOpened) return; starterOpened=true; popup.hidden=true;
    var p=starterPack(); if(!p||!window.zeigeStarterPack) return;
    window.zeigeStarterPack(p,null,true);
  }
  popup.querySelector('#starterV19Open').addEventListener('click',openStarter);
  popup.querySelector('#starterV19Open').addEventListener('touchend',function(e){e.preventDefault();openStarter();},{passive:false});
  var tries=0, tm=setInterval(function(){showStarter();if(++tries>120)clearInterval(tm);},200);

  // Patch the reward overlay so every opened pack explicitly adds the player to the collection.
  var overlay=document.getElementById('finalPack');
  if(!overlay) return;
  overlay.classList.add('v19-reward');
  var originalShow=window.zeigeFinalPack;
  window.zeigeFinalPack=function(pk,autoOpen,danach){   // V4.0: 3. Wert (danach) wird weitergereicht, damit man nach dem Öffnen im Pack-Shop bleibt
    if(!pk) return;
    if(autoOpen){ if(originalShow) originalShow(pk,true); return; }   // V6.9: nach Pokal/Liga nur Hinweis – öffnen im Hauptmenü
    overlay.classList.add('v19-reward');
    if(originalShow) originalShow(pk,false,danach);
    if(autoOpen) setTimeout(function(){
      var b=document.getElementById('fpOpen');
      if(b && !b.hidden && !b.disabled) b.click();
    },900);
  };
  var originalStarter=window.zeigeStarterPack;
  window.zeigeStarterPack=function(pk,done,autoOpen){
    if(!pk) return;
    if(originalStarter) originalStarter(pk,done);
    if(autoOpen) setTimeout(function(){
      var b=document.getElementById('fpOpen');
      if(b && !b.hidden && !b.disabled) b.click();
    },900);
  };

  // Whenever the pack animation has finished, refresh the player selection immediately.
  var observer=new MutationObserver(function(){
    try{
      var card=document.getElementById('fpCard');
      if(card && !card.hidden && typeof aktualisiere==='function') aktualisiere();
    }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
  });
  observer.observe(overlay,{subtree:true,attributes:true,attributeFilter:['hidden','class']});
})();
