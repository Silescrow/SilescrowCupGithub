/* Silescrow Cup V 4.2 – js/patches/05-ja-nein-fenster-im-spiel-design-.js */

/* V10.0: Ja/Nein-Fenster im Spiel-Design (weiße Box) – ersetzt das Browser-confirm(), das den Quermodus verlässt */
window.jaNeinDialog = function(titel, text, labelJa, labelNein){
  return new Promise(res => {
    const alt = document.getElementById('jaNeinDialog'); if (alt) alt.remove();
    const o = document.createElement('div'); o.id = 'jaNeinDialog';
    o.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px';
    const bk = 'width:100%;height:46px;margin-top:8px;border:2px solid #000;border-radius:10px;font:800 15px/1 var(--text,sans-serif);cursor:pointer;color:#0b1430;';
    const box = document.createElement('div');
    box.style.cssText = 'width:100%;max-width:320px;background:#fff;border:3px solid #000;border-radius:14px;padding:16px;text-align:center;color:#0b1430';
    const h = document.createElement('div'); h.style.cssText = 'font:900 20px/1.1 var(--text,sans-serif)'; h.textContent = titel;
    const p = document.createElement('div'); p.style.cssText = 'margin:8px 0 6px;font:600 14px/1.3 var(--text,sans-serif)'; p.textContent = text;
    const ja = document.createElement('button'); ja.type = 'button'; ja.style.cssText = bk + 'background:#ffe234'; ja.textContent = labelJa || 'JA';
    const nein = document.createElement('button'); nein.type = 'button'; nein.style.cssText = bk + 'background:#fff'; nein.textContent = labelNein || 'ZURÜCK';
    box.append(h, p, ja, nein); o.appendChild(box); document.body.appendChild(o);
    const zu = v => { o.remove(); res(v); };
    ja.addEventListener('click', () => zu(true)); nein.addEventListener('click', () => zu(false));
    o.addEventListener('click', e => { if (e.target === o) zu(false); });
  });
};
