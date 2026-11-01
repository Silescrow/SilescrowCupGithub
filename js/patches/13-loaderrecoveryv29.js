/* Silescrow Cup V 4.2 – js/patches/13-loaderrecoveryv29.js */

(function(){
  'use strict';
  // V2.29: eigenständiger Ladebildschirm-Fallback.
  // Läuft unabhängig von Audio, Multiplayer und anderen optionalen Modulen.
  function boot(){
    if(window.__ladenHaupt) return;   // V3.20: Hauptlader läuft – Notfall-Lader würde nur doppelt am Balken ziehen
    var root=document.getElementById('laden');
    var bar=document.querySelector('#laden .balken');
    var fill=document.getElementById('fuellung');
    var ball=document.getElementById('ball');
    var spin=document.getElementById('ballDreh');
    var status=document.getElementById('status');
    if(!root||!bar||!fill||!ball) return;
    root.hidden=false;
    root.style.display='';
    root.style.visibility='';
    var startTime=performance.now();
    var duration=5000;
    var done=false;
    var steps=[[0,'Rasen wird gemäht …'],[22,'Tornetze werden gespannt …'],[45,'Ball wird aufgepumpt …'],[68,'Spieler schnüren die Schuhe …'],[88,'Schiedsrichter pfeift sich warm …']];
    function draw(now){
      var p=Math.min(1,(now-startTime)/duration);
      var eased=p*p*(3-2*p);
      var pct=eased*100;
      var w=Math.max(0,bar.clientWidth-10);
      fill.style.width=(w*eased)+'px';
      ball.style.left=(5+w*eased)+'px';
      ball.style.transform='translate(-50%,-50%) rotate('+(eased*1080)+'deg)';
      if(spin) spin.setAttribute('transform','rotate('+(eased*1080)+' 50 50)');
      if(bar) bar.setAttribute('aria-valuenow',String(Math.round(pct)));
      if(status){
        var msg=steps[0][1];
        for(var i=0;i<steps.length;i++) if(pct>=steps[i][0]) msg=steps[i][1];
        status.textContent=pct>=99.9?'Bereit zum Anpfiff!':msg;
        if(pct>=99.9) status.classList.add('bereit');
      }
      if(p<1){ requestAnimationFrame(draw); return; }
      if(done) return;
      done=true;
      setTimeout(function(){
        try{
          if(typeof window.zeigeMenue==='function') window.zeigeMenue();
          else{
            root.hidden=true;
            var m=document.getElementById('menue'); if(m) m.hidden=false;
          }
        }catch(e){ root.hidden=true; var m2=document.getElementById('menue'); if(m2) m2.hidden=false; }
      },700);
    }
    requestAnimationFrame(draw);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
