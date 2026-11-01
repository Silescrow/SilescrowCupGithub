/* Silescrow Cup V 4.2 – js/patches/12-v41-training-js.js */

(function(){
  const root=document.getElementById('matchSkillsUeber');
  if(!root) return;
  const liste=document.getElementById('msListe'), rest=document.getElementById('msRest'), start=document.getElementById('msStart');
  const vorher=document.getElementById('msStarkeVorher'), nachher=document.getElementById('msStarkeNachher'), nameEl=document.getElementById('msName');
  const skills=[
    {k:'tem',n:'⚡ Schnelligkeit',d:'Tempo & Antritt'},
    {k:'sch',n:'🎯 Schuss',d:'Schusskraft & Genauigkeit'},
    {k:'pas',n:'🧠 Passspiel',d:'Pässe & Spielaufbau'},
    {k:'aud',n:'🔋 Ausdauer',d:'Wie lange er sprinten kann'},
    {k:'abw',n:'🛡️ Abwehr',d:'Zweikämpfe & Verteidigen'}
  ];
  let idx=-1, basis=0, fertig=null;
  function render(){
    const w=STAND.werte(idx), p=STAND.punkte(idx);
    rest.textContent=p; vorher.textContent=basis; nachher.textContent=STAND.gesamt(idx);
    skills.forEach(x=>{
      const v=document.getElementById('msv-'+x.k), f=document.getElementById('msf-'+x.k), ko=document.getElementById('msk-'+x.k), plus=document.getElementById('msp-'+x.k);
      const mw=maxWertVon(idx), wert=w[x.k], maxi=wert>=mw, c=STAND.kosten(wert);
      if(v) v.textContent=wert; if(f) f.style.width=Math.max(0,Math.min(100,(wert-50)/(mw-50)*100))+'%';
      if(ko) ko.innerHTML=maxi?'<b>MAX</b>':'<b>'+c+'</b>Pkt.';
      if(plus){ plus.disabled=false; plus.classList.toggle('ms-kaum',maxi||p<c); }
    });
  }
  let hinweisT=null;
  function hinweis(t){ const e=document.getElementById('msHinweis'); if(!e) return; e.textContent=t; e.hidden=false; clearTimeout(hinweisT); hinweisT=setTimeout(()=>{ e.hidden=true; },2200); }
  function bauen(){
    liste.innerHTML='';
    skills.forEach(x=>{
      const row=document.createElement('div'); row.className='ms-row';
      row.innerHTML='<div class="ms-name">'+x.n+'<span class="ms-desc">'+x.d+'</span></div><div class="ms-bar"><div class="ms-fill" id="msf-'+x.k+'"></div></div><div class="ms-val" id="msv-'+x.k+'">0</div><div class="ms-kost" id="msk-'+x.k+'"></div><button type="button" class="ms-plus" id="msp-'+x.k+'" aria-label="Wert erhöhen">+</button>';
      liste.appendChild(row);
      row.querySelector('#msp-'+x.k).addEventListener('click',()=>{ const w=STAND.werte(idx)[x.k]; if(w>=maxWertVon(idx)){ hinweis('Höchstwert erreicht ('+w+').'); return; } if(STAND.punkte(idx)<1){ hinweis('Alle 3 Trainingspunkte sind verteilt.'); return; } if(STAND.erhoehen(idx,x.k)){ try{ typeof klick==='function'&&klick(); }catch(e){} render(); } });
    });
  }
  start.addEventListener('click',()=>{ root.hidden=true; const cb=fertig; fertig=null; if(cb) cb({tem:0,sch:0,dri:0,pas:0,aus:0}); });
  /* V3.07: ZURÜCK = zum Hauptmenü (im Turnier/Liga über WEITER-Knopf des Ergebnisfensters, damit das Ergebnis gewertet wird) */
  const zurueck=document.getElementById('msZurueck');
  if(zurueck) zurueck.addEventListener('click',()=>{ root.hidden=true; fertig=null;
    const zm=document.getElementById('zumMenue'), tw=document.getElementById('turnierWeiter');
    const b=(zm && !zm.hidden)?zm:((tw && !tw.hidden)?tw:zm);
    if(b) b.click(); });
  window.MATCH_SKILLS={zeigen:function(opt,cb){
    fertig=cb; idx=opt && Array.isArray(opt.squad) ? opt.squad[0] : -1;
    if(idx<0 || !STAND.trainierbar(idx)){ fertig=null; cb({tem:0,sch:0,dri:0,pas:0,aus:0}); return; }
    basis=STAND.gesamt(idx); nameEl.textContent=PLAYER_DATABASE[idx].name;
    document.getElementById('msSub').textContent='Verteile die Trainingspunkte von '+PLAYER_DATABASE[idx].name+'.';
    bauen(); render(); root.hidden=false;
  }};
})();
