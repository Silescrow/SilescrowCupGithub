/* Silescrow Cup V 4.2 – js/patches/29-league-fenster-knopf-praemien-ze.js */

/* V3.05: League-Fenster – Knopf PRÄMIEN zeigt, was es am Saisonende gibt und wie es danach weitergeht */
(function(){
  var k = document.getElementById('lgPraemien'); if (!k) return;
  function stufe(){ var st = null; try { st = LIGA.info && LIGA.info.stufe; } catch (e) {} if (!st) try { st = zustand.stufe; } catch (e) {} return ['leicht', 'mittel', 'stark'].indexOf(st) >= 0 ? st : 'mittel'; }
  k.addEventListener('click', function(){
    var st = stufe(), si = { leicht: 0, mittel: 1, stark: 2 }[st], NAME = { leicht: 'LEICHT', mittel: 'MITTEL', stark: 'STARK' };
    var z = function(n){ return Number(n).toLocaleString('de-DE'); }, M = '<span class="sc-muenze">C</span>';
    var reihen = [['🏆', 'Meister', [12000, 15000, 20000]], ['🥈', 'Platz 2 – 3', [4500, 6000, 8000]], ['🎖️', 'Platz 4', [1000, 1500, 2000]], ['👑', 'Torschützenkönig', [500, 750, 1000]], ['⭐', 'Champions-Cup-Sieg (Top 4)', [6000, 9000, 11000]]];
    var alt = document.getElementById('lgPrUeber'); if (alt) alt.remove();
    var o = document.createElement('div'); o.id = 'lgPrUeber';
    o.innerHTML = '<div class="lgp-box"><h3>🏆 PRÄMIEN · STUFE ' + NAME[st] + '</h3><div class="lgp-liste">' +
      reihen.map(function(r){ return '<div class="lgp-z"><span>' + r[0] + ' ' + r[1] + '</span><b>' + M + ' ' + z(r[2][si]) + '</b></div>'; }).join('') +
      '<div class="lgp-z klein"><span>🔥 Jede 5 Siege in Folge</span><b>' + M + ' ' + z([200, 300, 400][si]) + '</b></div><div class="lgp-z klein"><span>🌟 MVP aus deinem Team</span><b>' + M + ' ' + z([200, 300, 400][si]) + '</b></div><div class="lgp-z klein"><span>Ab Platz 5</span><b>–</b></div></div>' +
      '<p class="lgp-ablauf">Nach dem letzten Spieltag: Abschlusstabelle und Prämien · Top 4 spielen den Champions Cup · danach startet mit <b>NÄCHSTE SAISON</b> sofort die neue Saison (gleiches Team, Land und Stufe).</p>' +
      '<button type="button" class="lgp-zu">OK</button></div>';
    document.body.appendChild(o);
    var zu = function(){ o.remove(); };
    o.querySelector('.lgp-zu').addEventListener('click', zu);
    o.addEventListener('click', function(e){ if (e.target === o) zu(); });
  });
})();
