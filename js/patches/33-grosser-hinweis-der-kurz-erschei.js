/* Silescrow Cup V 4.2 – js/patches/33-grosser-hinweis-der-kurz-erschei.js */

/* V3.09: großer Hinweis, der kurz erscheint und von selbst wieder verschwindet (kein Knopf nötig) */
window.scGrossHinweis = function(titel, sub, ms){
  var alt = document.getElementById('scGrossHinweis'); if (alt) alt.remove();
  var o = document.createElement('div'); o.id = 'scGrossHinweis';
  o.innerHTML = '<div class="gh-box"><div class="gh-t"></div>' + (sub ? '<div class="gh-s"></div>' : '') + '</div>';
  o.querySelector('.gh-t').textContent = titel; if (sub) o.querySelector('.gh-s').textContent = sub;
  document.body.appendChild(o);
  setTimeout(function(){ o.classList.add('weg'); setTimeout(function(){ if (o.parentNode) o.remove(); }, 550); }, ms || 2000);
};
