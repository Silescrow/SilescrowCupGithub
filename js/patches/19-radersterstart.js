/* Silescrow Cup V 4.2 – js/patches/19-radersterstart.js */

(function(){ var n = 0, iv = setInterval(function(){ n++; try {
  if (typeof radGesehen !== 'function' || typeof gluecksradZeigen !== 'function'){ if (n > 120) clearInterval(iv); return; }
  if (radGesehen()){ clearInterval(iv); return; }
  var m = document.getElementById('menue');
  if (m && !m.hidden){ clearInterval(iv); /* V11.11: Rad kommt nicht mehr beim Menü-Start, sondern beim ersten LEAGUE-Start eines neuen Spielers */ }
} catch (e) { clearInterval(iv); } }, 500); })();
