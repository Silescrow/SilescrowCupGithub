/* Silescrow Cup V 4.2 – js/patches/28-herzlichen-glueckwunsch-fenster-.js */

/* V3.03: Herzlichen-Glückwunsch-Fenster bei jedem 5. Sieg in Folge */
window.scSerienGlueckwunsch = function(serie, bonus){
  var alt = document.getElementById('scGlueck'); if (alt) alt.remove();
  var o = document.createElement('div'); o.id = 'scGlueck';
  o.innerHTML = '<div class="scg-box"><div class="scg-pokal">🏆</div><h2>HERZLICHEN GLÜCKWUNSCH!</h2><p class="scg-serie">🔥 ' + serie + ' SIEGE IN FOLGE</p><p class="scg-bonus"><span class="sc-muenze">C</span> +' + Number(bonus).toLocaleString('de-DE') + ' Crows</p><button type="button" class="scg-ok">SUPER!</button></div>';
  document.body.appendChild(o);
  var zu = function(){ if (o.parentNode) o.remove(); };
  o.querySelector('.scg-ok').addEventListener('click', zu);
  o.addEventListener('click', function(e){ if (e.target === o) zu(); });
  setTimeout(function(){ try { o.style.transition = 'opacity .5s'; o.style.opacity = '0'; } catch (e) {} setTimeout(zu, 550); }, 4000);   // V3.09: Fenster geht nach 4 Sekunden von selbst weg
  try { musik.sfx && musik.sfx.jubel && musik.sfx.jubel(true); } catch (e) {}
};
