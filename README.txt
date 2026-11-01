SILESCROW CUP V 4.2 - technische Modernisierung von V 4.1

Startdatei: Silescrow_Cup_V4_2.html  (nur ueber https/GitHub Pages oeffnen, nicht als Datei vom Handyspeicher)

Ordner
  images/   2.188 Bilder (webp/png) als einzelne Dateien
  audio/    1.051 Sounds, Musik, Kommentator (mp3)
  css/      basis.css, oberflaeche.css, erweiterungen.css (Reihenfolge wie in V 4.1)
  data/     spieler.js, spielerbilder.js, nationen.js, presse.js, kommentar.js, sprites.js
  js/       Programmcode, aufgeteilt (Start/Musik, Flaggen/Wetter, Multiplayer, Ladebildschirm,
            Werte, Spielstand, Kader/Formation, Aufstellung, Menue/Modi, Gluecksrad, Liga/Online,
            Turnier, Liga, Multiplayer-Menue, Spielkern mit KI/Ballphysik/Steuerung)
  js/patches/  die kleinen Zusatz-Skripte aus V 4.1, Reihenfolge = Nummer (nicht aendern!)
  sw.js     Service Worker: Offline-Spielbarkeit

Wichtig
  - Die Reihenfolge der <script>/<link>-Zeilen in der Startdatei nicht aendern.
  - manifest.webmanifest, apple-touch-icon3.png und icon3-192.png bleiben wie bisher im Repository.
    In der manifest.webmanifest muss "start_url" auf Silescrow_Cup_V4_2.html zeigen (oder "./", wenn index.html verwendet wird).
  - Nach dem ersten Laden speichert sw.js im Hintergrund alle Bilder und Sounds fuer den Offline-Betrieb.
