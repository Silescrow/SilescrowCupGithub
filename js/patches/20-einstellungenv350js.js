/* Silescrow Cup V 4.2 – js/patches/20-einstellungenv350js.js */

(function(){
  // V3.50: Einstellungen mit Reset-Knöpfen (Liga, Karten & Packs, alles)
  var o=document.getElementById('einstUeber'), msg=document.getElementById('eMsg');
  if(!o) return;
  function sag(t){ msg.textContent=t; clearTimeout(sag._t); sag._t=setTimeout(function(){msg.textContent='';},3000); }
  // V8.0: Grafik auch im Hauptmenü – nutzt dieselben Einstellungen wie im Spiel
  function grafikAnzeigen(){
    var m=null; try{ m=SPIEL.grafikModus; }catch(e){}
    if(!m){ try{ m=LS81.getItem('silescrowGrafik')||'auto'; }catch(e){ m='auto'; } }
    o.querySelectorAll('[data-mgrafik]').forEach(function(b){ b.classList.toggle('an', b.dataset.mgrafik===m); });
    var h=document.getElementById('grafikHinweis'), eh=document.getElementById('eGrafikHinweis'); if(eh) eh.textContent=h?h.textContent:'';
  }
  o.querySelectorAll('[data-mgrafik]').forEach(function(b){ b.addEventListener('click',function(){
    try{ SPIEL.grafikSetzen(b.dataset.mgrafik); }catch(e){ try{ LS81.setItem('silescrowGrafik', b.dataset.mgrafik); }catch(e2){} }
    grafikAnzeigen(); sag('Grafik: '+b.textContent.replace(/(empfohlen|\d+p)$/,'').trim());
  }); });
  document.getElementById('mEinst').addEventListener('click',function(){ msg.textContent=''; grafikAnzeigen(); o.hidden=false; });
  document.getElementById('eZu').addEventListener('click',function(){ o.hidden=true; });
  o.addEventListener('click',function(e){ if(e.target===o) o.hidden=true; });
  { const sa=document.getElementById('sAlles'); if(sa) sa.addEventListener('click',function(){ var su=document.getElementById('sichUeber'); if(su) su.hidden=true; o.hidden=true; var b=document.getElementById('neuesSpielKnopf'); if(b) b.click(); }); }   // V11.20: ALLES ZURÜCKSETZEN steht jetzt im Spielstand-Fenster
  document.getElementById('eAlles').addEventListener('click',function(){
    o.hidden=true;
    var b=document.getElementById('neuesSpielKnopf');
    if(b) b.click();   // fragt nach, löscht alles inkl. Liga und lädt neu
  });
})();
