/* Silescrow Cup V 4.2 – js/patches/14-v231-pack-orientation-js.js */

(function(){
  function syncPackOrientation(){
    var o=document.getElementById('finalPack');
    if(!o)return;
    o.classList.toggle('is-landscape',window.innerWidth>window.innerHeight);
    o.classList.toggle('is-portrait',window.innerHeight>=window.innerWidth);
  }
  syncPackOrientation();
  window.addEventListener('resize',syncPackOrientation,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(syncPackOrientation,80);},{passive:true});
})();
