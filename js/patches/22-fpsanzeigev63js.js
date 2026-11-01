/* Silescrow Cup V 4.2 – js/patches/22-fpsanzeigev63js.js */

(function(){
  // V6.3: FPS-Anzeige – ein/aus in den Einstellungen (⚙ im Hauptmenü) und im Grafik-Fenster im Spiel.
  var KEY='silescrowFpsAnzeige', el=document.getElementById('fpsAnzeige');
  var an=false; try{ an=LS81.getItem(KEY)==='1'; }catch(e){}
  var bilder=0, start=0, raf=0;
  function schritt(t){
    if(!an){ raf=0; return; }
    raf=requestAnimationFrame(schritt);
    if(!start) start=t;
    bilder++;
    if(t-start>=500){
      var f=Math.round(bilder*1000/(t-start)); bilder=0; start=t;
      el.className = f>=57?'':(f>=40?'mittel':'schlecht');
      var stufe = 0; try { if (typeof SPIEL!=='undefined' && SPIEL.laeuft && typeof SPIEL.grafikStufe==='number') stufe = SPIEL.grafikStufe; } catch(e){}
      var ms = 0, mod = ''; try { if (typeof SPIEL!=='undefined'){ ms = SPIEL.rechenzeit || 0; mod = SPIEL.grafikModus || ''; } } catch(e){}
      el.textContent = 'FPS '+f;   // V9.9: nur FPS und die Zahl   // V9.2: Rechenzeit pro Bild
    }
  }
  function knoepfe(){
    ['eFps','grafikFps'].forEach(function(id){ var b=document.getElementById(id); if(!b) return; b.textContent='📊 FPS ANZEIGEN: '+(an?'AN':'AUS'); b.classList.toggle('an',an); });
  }
  function setzen(wert){
    an=!!wert; try{ LS81.setItem(KEY, an?'1':'0'); }catch(e){}
    el.hidden=!an; knoepfe();
    if(an && !raf){ bilder=0; start=0; el.textContent='FPS --'; raf=requestAnimationFrame(schritt); }
  }
  ['eFps','grafikFps'].forEach(function(id){ var b=document.getElementById(id); if(b) b.addEventListener('click',function(e){ e.stopPropagation(); setzen(!an); }); });
  window.scFpsAnzeige = setzen;
  setzen(an);
})();
