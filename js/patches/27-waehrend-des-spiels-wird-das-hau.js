/* Silescrow Cup V 4.2 – js/patches/27-waehrend-des-spiels-wird-das-hau.js */

/* V3.1: Während des Spiels wird das Hauptmenü abgeschaltet. Es lag sonst unsichtbar unter dem Spielfeld und hat mit
   Kartenbildern, Filtern und Animationen bei jedem Bild Leistung gekostet (auf schwächeren Handys wie dem A16 ca. 60 % mehr FPS).
   Nach dem Spiel wird es wieder eingeblendet und einmal frisch gezeichnet. */
(function(){
  var sp = document.getElementById('spiel'), me = document.getElementById('menue'); if (!sp || !me) return;
  var vonUns = false;
  function pruefen(){
    var spielt = !sp.hidden && getComputedStyle(sp).display !== 'none';
    if (spielt && !me.hidden){ vonUns = true; me.hidden = true; }
    else if (!spielt && vonUns){
      vonUns = false; me.hidden = false;
      setTimeout(function(){ try { if (typeof zeichneKarten === 'function') zeichneKarten(); if (typeof aktualisiere === 'function') aktualisiere(); } catch (e) { typeof __scWarn === 'function' && __scWarn(e); } }, 30);
    }
  }
  new MutationObserver(pruefen).observe(sp, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  pruefen();
})();
