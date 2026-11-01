/* Silescrow Cup V 4.2 – js/patches/31-schriftzug-und-praemie-waehrend-.js */

/* V3.05: Schriftzug und Prämie, während der Kapitän den Pokal / die Schale hebt */
window.scFeierBanner = function(art, stufe, halle){
  var alt = document.getElementById('scFeier'); if (alt) alt.remove();
  var si = { leicht: 0, mittel: 1, stark: 2 }[stufe]; if (si == null) si = 1;
  var titel, betrag;
  if (halle){ titel = 'HALLENSIEGER!'; betrag = [800, 1800, 3000][si]; }
  else if (art === 'schale'){ titel = 'MEISTER!'; betrag = [12000, 15000, 20000][si]; }
  else { titel = 'POKALSIEGER!'; betrag = [1500, 3000, 5000][si]; }
  var o = document.createElement('div'); o.id = 'scFeier';
  o.innerHTML = '<div class="scf-titel">🏆 ' + titel + '</div><div class="scf-praemie"><span class="sc-muenze">C</span> +' + betrag.toLocaleString('de-DE') + ' Crows</div>';
  (document.getElementById('spiel') || document.body).appendChild(o);
};
window.scFeierWeg = function(){ var o = document.getElementById('scFeier'); if (o) o.remove(); };
