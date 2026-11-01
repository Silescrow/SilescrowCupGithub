/* Silescrow Cup V 4.2 – js/patches/01-beim-start-immer-die-neueste-ver.js */

// V7.1: Beim Start immer die neueste Version laden. Prüft (nur online auf der Spielseite) die Versionsnummer
// der veröffentlichten Seite ohne Zwischenspeicher; ist sie neuer, wird einmal automatisch neu geladen.
(function(){
  try {
    if (!/^https?:/.test(location.protocol)) return;
    const meine = (document.title.match(/V\s*([\d.]+)/) || [])[1]; if (!meine) return;
    const basis = location.origin + location.pathname;
    fetch(basis + '?vcheck=' + Date.now(), { cache: 'no-store', headers: { Range: 'bytes=0-4000' } })
      .then(r => r.text()).then(t => {
        // V8.0: zusätzlich Zeitstempel des Uploads vergleichen – so kommt jede Änderung an, auch wenn die Versionsnummer gleich bleibt
        const bMein = (document.querySelector('meta[name="sc-build"]') || {}).content || '', bNeu = (t.match(/name="sc-build" content="(\d+)"/) || [])[1] || '';
        if (bNeu && bMein && bNeu === bMein){ window.__scAktuell = true; const haken = () => { try { window.__scHaken && window.__scHaken(); } catch (e) {} }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(haken, 50)); else haken(); }   // V3.0: ✓ = du hast die neueste Version
        if (bNeu && bMein && bNeu > bMein){ let sb = ''; try { sb = sessionStorage.getItem('sc_reload_b') || ''; } catch (e) {} if (sb !== bNeu){ try { sessionStorage.setItem('sc_reload_b', bNeu); } catch (e) {} location.replace(basis + '?b=' + bNeu + location.hash); } return; }
        const neu = (t.match(/<title>[^<]*V\s*([\d.]+)/) || [])[1];
        if (!neu || neu === meine) return;
        const z = neu.split('.').map(Number), m = meine.split('.').map(Number);
        const neuer = z[0] > m[0] || (z[0] === m[0] && (z[1] || 0) > (m[1] || 0));
        if (!neuer) return;
        let schon = ''; try { schon = sessionStorage.getItem('sc_reload') || ''; } catch (e) {}
        if (schon === neu) return;   // nicht in Schleife neu laden
        try { sessionStorage.setItem('sc_reload', neu); } catch (e) {}
        location.replace(basis + '?v=' + neu + location.hash);
      }).catch(() => {});
  } catch (e) {}
})();
