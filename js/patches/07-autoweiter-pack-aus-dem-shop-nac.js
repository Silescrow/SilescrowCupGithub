/* Silescrow Cup V 4.2 – js/patches/07-autoweiter-pack-aus-dem-shop-nac.js */

(function(){
  const overlay=document.getElementById('finalPack'), packEl=document.getElementById('fpPack'), cardEl=document.getElementById('fpCard');
  const title=document.getElementById('fpTitle'), sub=document.getElementById('fpSub'), label=document.getElementById('fpPackLabel');
  const open=document.getElementById('fpOpen'), close=document.getElementById('fpClose');
  let pending=null, afterClose=null, autoWeiter=false, autoT=null;   // V4.0: autoWeiter = Pack aus dem Shop: nach der Karte geht es von selbst zurück in den Shop

  function zeigePack(pk, done, mode){
    if(!pk) { if(done) done(); return; }
    pending=pk; afterClose=done||null; autoWeiter=(mode==='final'&&!!done); clearTimeout(autoT); overlay.hidden=false; overlay.classList.remove('showing-card'); overlay.classList.remove('bonus-ende'); cardEl.hidden=true; cardEl.classList.remove('reveal-from-pack'); cardEl.classList.remove('gross'); cardEl.innerHTML=''; packEl.hidden=false; packEl.classList.remove('revealed'); open.hidden=false; close.hidden=false; { const _w=document.getElementById('fpWeiter'); if(_w) _w.hidden=true; }
    const gold=pk.art==='gold', bronze=pk.art==='bronze'; packEl.className='fp-pack '+(gold?'gold':bronze?'bronze':'silber');
    if(mode==='starter'){
      title.textContent='DEIN STARTER PACK';
      sub.textContent='Deine Spieler sind gewählt – dein einmaliges Bronze-Pack wartet! 🎁';
      label.textContent='BRONZE';
      close.textContent=done?'TURNIER STARTEN':'SCHLIESSEN';
    } else {
      title.textContent=gold?'GOLD PACK':bronze?'BRONZE PACK':'SILBER PACK';
      sub.textContent=pk.quelle==='liga'?(gold?'Liga-Meister! 🏆':'Starke Saison in der Liga!'):pk.quelle==='turniersieg'?'Turniersieg! 🏆':gold?'Finale gewonnen! 🏆':bronze?'Turnierbonus – ein kleiner, aber nützlicher Spieler!':'Starke Leistung im Finale!';
      label.textContent=gold?'GOLD':bronze?'BRONZE':'SILBER';
      close.textContent='Später öffnen';
    }
  }

  // V6.9: Packs öffnet man nur im Hauptmenü – nach Pokal/Liga gibt es nur einen Hinweis, das Pack wird gespeichert
  window.zeigeFinalPack=function(pk, ausErgebnis, danach){
    if (ausErgebnis){
      const n = pk && pk.art === 'gold' ? 'GOLD' : pk && pk.art === 'bronze' ? 'BRONZE' : 'SILBER';
      try {
        const f = { BRONZE: '#e3a06a', SILBER: '#dfe6ef', GOLD: '#ffd84a' }[n];
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%) scale(.6);z-index:10000;background:' + f + ';color:#0b1430;border:3px solid #000;border-radius:14px;box-shadow:0 5px 0 #000;padding:12px 20px;font:900 18px/1.25 system-ui,sans-serif;text-align:center;opacity:0;transition:transform .35s cubic-bezier(.2,1.6,.4,1),opacity .3s;pointer-events:none';
        d.innerHTML = '🎁 NEUES ' + n + '-PACK!<div style="font:700 13px/1.3 system-ui,sans-serif;margin-top:3px">Öffne es im Hauptmenü.</div>';
        document.body.appendChild(d);
        requestAnimationFrame(() => { d.style.opacity = '1'; d.style.transform = 'translateX(-50%) scale(1)'; });
        setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); }, 3600);
      } catch (e) {}
      try { window.__packAnzeige && window.__packAnzeige(); } catch (e) {}
      return;
    }
    zeigePack(pk, danach || null, 'final');
  };
  window.zeigeStarterPack=function(pk, done){ zeigePack(pk, done, 'starter'); };

  // STARTER-PACK: automatisch direkt beim Betreten des Hauptmenüs öffnen.
  // Kein Klick auf den Button nötig. Einmal pro erzeugtem Starter-Pack.
  // V2.28: Starter-Pack wird nicht sofort geöffnet. Die neue zentrale Steuerung unten
  // wartet ca. 10 Sekunden, nachdem das Hauptmenü sichtbar ist.
  window.__autoStarterPackDone = true;

  function beendenPack(got){
    open.hidden=true; close.hidden=true;
    packEl.classList.add('revealed');
    if(got && got.karte){
      const p=PLAYER_DATABASE.find(x=>x.name===got.karte); if(p){
        let wA=p.rating, bo=0; try{ const g=STAND.gesamt(PLAYER_DATABASE.indexOf(p)); if(g){ wA=g; bo=g-p.rating; } }catch(e){}   /* V 3.07: Ziehung zeigt den Wert wie bei dir (mit Pack-Bonus) */
        const src=(typeof BILDER!=='undefined'&&BILDER[p.bild])?BILDER[p.bild]:'';
        { const st=p.stufe==='gold'?'gold':p.stufe==='bronze'?'bronze':'silber', TN={gold:'GOLD',silber:'SILBER',bronze:'BRONZE'}[st];
          const ROLLE={TW:'TOR',DF:'ABWEHR',MF:'MITTELFELD',ST:'STURM'}[p.role]||p.role||'';
          cardEl.classList.add('gross');
          cardEl.innerHTML='<div class="pu2-k '+st+' hat fp-gross-karte"><span class="pu2-siegel">'+TN+'</span><div class="pu2-bild"><img src="'+src+'" alt="'+p.name+'" decoding="async"></div><b class="pu2-w">'+wA+'</b>'+(p.pos?'<i class="pu2-pos">'+p.pos+'</i>':'')+'<span class="pu2-n">'+p.name+'</span><div class="fp-info"><span>'+ROLLE+'</span><span>Stärke '+wA+'</span>'+(bo>0?'<span class="fp-bo">+'+bo+' Pack-Bonus</span>':'')+'</div></div>'; }
        cardEl.hidden=false; cardEl.classList.add('reveal-from-pack'); overlay.classList.add('showing-card');
      }
    } else {
      overlay.classList.add('bonus-ende'); cardEl.innerHTML='<div class="fp-bonus"><div class="fp-bonus-icon">🎁</div><div class="fp-name">BONUS!</div><div class="fp-bonus-text">Alle Karten dieser Stufe sind schon frei.</div><div class="fp-rating">+15 Trainingspunkte</div></div>'; cardEl.hidden=false; cardEl.classList.add('reveal-from-pack'); overlay.classList.add('showing-card');
    }
    sub.textContent=got && got.karte?'NEUER SPIELER FREIGESCHALTET!':'';
    setTimeout(()=>{ const _w=document.getElementById('fpWeiter'); if(_w){ _w.hidden=false; _w.onclick=function(){ clearTimeout(autoT); _w.hidden=true; overlay.hidden=true; if(afterClose){const f=afterClose;afterClose=null;pending=null;f();} }; if(autoWeiter){ clearTimeout(autoT); autoT=setTimeout(function(){ if(autoWeiter && !overlay.hidden && !_w.hidden && afterClose) _w.onclick(); }, 2600); } } }, 1100);   /* V4.0: nach ca. 3,5 s automatisch zurück in den Pack-Shop (WEITER bleibt zum Abkürzen) */   /* V 3.07: WEITER-Knopf nach der Ziehung */
    setTimeout(()=>{ overlay.onclick=function(e){if(e.target===overlay) { overlay.hidden=true; if(afterClose){const f=afterClose;afterClose=null;pending=null;f();} } }; },0);
  }

  function packOeffnenMitAnimation(){
    if(!pending || packEl.classList.contains('opening')) return;
    let index=-1; const packs=STAND.packs; for(let i=0;i<packs.length;i++){ if(packs[i]===pending){index=i;break;} }
    const got=index>=0?STAND.packOeffnen(index):null;
    try{ if(got && got.karte && got.quelle!=='starter'){ const gi=PLAYER_DATABASE.findIndex(x=>x.name===got.karte); if(gi>=0) setTimeout(()=>{ const t=karteInsTeam(gi); if(t) try{ toast('★ '+t); }catch(e){} }, 2500); } }catch(e){}   // V5.3
    if(!got){overlay.hidden=true; const f=afterClose;afterClose=null;pending=null;if(f)f();return;}
    open.disabled=true; close.disabled=true; packEl.classList.add('opening');
    setTimeout(()=>{
      packEl.classList.remove('opening');
      beendenPack(got);
      setTimeout(()=>{
        packEl.hidden=true;
        packEl.classList.remove('revealed');
        open.disabled=false; close.disabled=false;
        try { if(typeof zeichneKarten==='function') zeichneKarten(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
        try { if(typeof aktualisiere==='function') aktualisiere(); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      },900);
    },950);
  }

  packEl.addEventListener('click', packOeffnenMitAnimation);
  packEl.setAttribute('role','button');
  packEl.setAttribute('tabindex','0');
  packEl.setAttribute('aria-label','Pack öffnen');
  packEl.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); packOeffnenMitAnimation(); }
  });
  open.onclick=packOeffnenMitAnimation;

  const starterStatus=document.getElementById('starterPackStatus');
  const starterButton=document.getElementById('starterPackButton');
  if(starterButton){
    starterButton.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      const pk=STAND.packs.find(x=>x && x.quelle==='starter');
      if(!pk){ try{ aktualisiere(); }catch(err){typeof __scWarn==='function'&&__scWarn(err)} return; }
      window.zeigeStarterPack(pk, null);
    }, {passive:false});
    starterButton.ontouchend=function(e){ e.preventDefault(); e.stopPropagation(); starterButton.click(); };
  }

  close.onclick=function(){
    overlay.hidden=true;
    const f=afterClose; afterClose=null; pending=null;
    if(f) setTimeout(f,120);
  };
})();
