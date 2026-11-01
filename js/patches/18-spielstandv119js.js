/* Silescrow Cup V 4.2 – js/patches/18-spielstandv119js.js */

(function(){
  // V11.9: Spielstand sichern/laden – 3 Plätze im Gerät + Code zum Übertragen (Format ist bereit für Cloud/Google Play Games)
  var o=document.getElementById('sichUeber'), knopf=document.getElementById('eSicher');
  if(!o||!knopf) return;
  var $=function(id){return document.getElementById(id);};
  var PRE='SCSAVE1', SLOTS=3, modus='s', msgEl=$('sMsg'), frageJa=null;
  function sag(t,fehler){ msgEl.textContent=t; msgEl.className='s-msg'+(fehler?' fehler':''); clearTimeout(sag._t); sag._t=setTimeout(function(){msgEl.textContent='';},5000); }
  function istSpielKey(k){ return k && ((k.indexOf('sc81_')===0 && k!=='sc81_sc_stand_defekt') || k==='sc_radNie'); }
  function sammeln(){ var S=window.localStorage, ls={}; for(var i=0;i<S.length;i++){ var k=S.key(i); if(istSpielKey(k)) ls[k]=S.getItem(k); } return ls; }
  function b64(by){ var s='',c=0x8000; for(var i=0;i<by.length;i+=c) s+=String.fromCharCode.apply(null,by.subarray(i,i+c)); return btoa(s); }
  function unb64(s){ var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
  function version(){ try{ return SPIEL_VERSION; }catch(e){ return ''; } }
  async function kodieren(ls){
    var json=JSON.stringify({app:'silescrow-cup',fmt:1,ver:version(),t:Date.now(),ls:ls});
    var by=new TextEncoder().encode(json);
    if(window.CompressionStream){ try{ var st=new Blob([by]).stream().pipeThrough(new CompressionStream('gzip')); var buf=await new Response(st).arrayBuffer(); return PRE+'.g.'+b64(new Uint8Array(buf)); }catch(e){} }
    return PRE+'.p.'+b64(by);
  }
  async function dekodieren(code){
    code=String(code||'').replace(/\s+/g,'');
    var p=code.split('.');
    if(p.length!==3||p[0]!==PRE||(p[1]!=='g'&&p[1]!=='p')||!p[2]) throw new Error('Das ist kein gültiger Spielstand-Code.');
    var by; try{ by=unb64(p[2]); }catch(e){ throw new Error('Der Code ist beschädigt (Zeichen fehlen oder sind falsch).'); }
    var text;
    if(p[1]==='g'){
      if(!window.DecompressionStream) throw new Error('Dieses Gerät kann den komprimierten Code nicht lesen.');
      try{ var st=new Blob([by]).stream().pipeThrough(new DecompressionStream('gzip')); text=new TextDecoder().decode(await new Response(st).arrayBuffer()); }catch(e){ throw new Error('Der Code ist beschädigt oder unvollständig kopiert.'); }
    } else text=new TextDecoder().decode(by);
    var obj; try{ obj=JSON.parse(text); }catch(e){ throw new Error('Der Code ist beschädigt.'); }
    pruefen(obj); return obj;
  }
  function pruefen(obj){
    if(!obj||obj.app!=='silescrow-cup'||obj.fmt!==1||!obj.ls||typeof obj.ls!=='object') throw new Error('Falsches Format oder falsche Version.');
    var n=0; for(var k in obj.ls){ if(!istSpielKey(k)||typeof obj.ls[k]!=='string') throw new Error('Der Code enthält ungültige Einträge.'); n++; }
    if(!n||!obj.ls['sc81_sc_stand']) throw new Error('Im Code fehlt der Spielstand.');
    var st; try{ st=JSON.parse(obj.ls['sc81_sc_stand']); }catch(e){ st=null; }
    if(!st||st.v!==1) throw new Error('Der Spielstand im Code ist nicht lesbar.');
  }
  function esc(x){ return String(x==null?'':x).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  // V3.10: Superteam (Stärke) und Land des aktuellen Teams für die Anzeige im Platz merken
  function teamInfo(){
    var r={st:null,land:''};
    try{
      var su=(typeof fwSuper==='function')?fwSuper():null;
      if(su){ var s=(typeof fwSuperStaerke==='function')?fwSuperStaerke(su):null; r.st=(s==null||s==='–')?null:s; r.land=(su.land&&su.land[0])||''; }
      else if(typeof zustand!=='undefined'&&zustand&&zustand.land&&zustand.land[0]) r.land=zustand.land[0];
    }catch(e){}
    return r;
  }
  function teamText(i){
    if(!i||(i.st===undefined&&i.land===undefined)) return '';
    return 'Superteam: '+(i.st!=null?'Stärke '+i.st:'noch nicht gewählt')+' · Land: '+(i.land||'–');
  }
  function info(ls){ try{ var d=JSON.parse(ls['sc81_sc_stand']); return {cr:+d.cr||0,k:(d.karten||[]).length,ti:+d.titel||0}; }catch(e){ return {cr:0,k:0,ti:0}; } }
  function infoText(i){ return i.cr+' Crows · '+i.k+' Karten · '+i.ti+' Titel'; }
  function datum(t){ try{ return new Date(t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
  function slotLesen(n){ try{ var r=window.localStorage.getItem('scslot_'+n); return r?JSON.parse(r):null; }catch(e){ return null; } }
  function frage(text,ja,fn){ $('sFrageText').textContent=text; $('sFrageJa').textContent=ja; frageJa=fn; $('sFrage').classList.add('an'); try{ $('sFrage').scrollIntoView({block:'nearest'}); }catch(e){} }
  function frageZu(){ $('sFrage').classList.remove('an'); frageJa=null; }
  $('sFrageNein').addEventListener('click',frageZu);
  $('sFrageJa').addEventListener('click',function(){ var f=frageJa; frageZu(); if(f) f(); });
  function zeichne(){
    $('sTabS').classList.toggle('an',modus==='s'); $('sTabL').classList.toggle('an',modus==='l');
    $('sCodeS').hidden=modus!=='s'; $('sCodeL').hidden=modus!=='l';
    var box=$('sSlots'); box.innerHTML='';
    for(let n=1;n<=SLOTS;n++){
      var s=slotLesen(n), row=document.createElement('div'); row.className='s-row';
      var b=document.createElement('button'); b.type='button';
      var inf=s?(s.i||{cr:0,k:0,ti:0}):null, tt=s?teamText(inf):'';
      b.innerHTML='PLATZ '+n+(s?' · '+datum(s.t):' · leer')+'<small>'+(s?infoText(inf):(modus==='s'?'Antippen zum Speichern':'Noch nichts gespeichert'))+'</small>'+(tt?'<small class="s-team">'+esc(tt)+'</small>':'');
      if(modus==='l'&&!s) b.disabled=true;
      b.addEventListener('click',function(){ modus==='s'?slotSpeichern(n):slotLaden(n); });
      row.appendChild(b);
      if(s){
        var d=document.createElement('button'); d.type='button'; d.className='s-rot s-del'; d.textContent='🗑️';
        d.setAttribute('aria-label','Platz '+n+' löschen'); d.title='Platz '+n+' löschen';
        d.addEventListener('click',function(e){ e.stopPropagation(); slotLoeschen(n); });
        row.appendChild(d);
      }
      box.appendChild(row);
    }
  }
  // V3.10: Platz löschen (mit Warnhinweis). Ist es der letzte Platz, wird das ganze Spiel zurückgesetzt.
  function slotLoeschen(n){
    var s=slotLesen(n); if(!s) return;
    var rest=0; for(var k=1;k<=SLOTS;k++){ if(k!==n&&slotLesen(k)) rest++; }
    var letzter=(rest===0);
    var text=letzter
      ? '⚠️ ACHTUNG: Das ist dein letzter Spielstand! Wenn du Platz '+n+' löschst, wird das ganze Spiel zurückgesetzt. Auch der AUTO-SAVE wird gelöscht. Du verlierst ALLES: Packs, Karten, Crows, Titel, Liga und dein Superteam. Das kann nicht rückgängig gemacht werden.'
      : '🗑️ Platz '+n+' löschen? Dieser Spielstand ('+infoText(s.i||{cr:0,k:0,ti:0})+') geht für immer verloren.';
    frage(text,'BESTÄTIGEN',function(){
      try{ window.localStorage.removeItem('scslot_'+n); }catch(e){ sag('Löschen nicht möglich.',true); return; }
      if(letzter){ alleZuruecksetzen(); return; }
      sag('Platz '+n+' gelöscht.'); zeichne();
    });
  }
  function alleZuruecksetzen(){
    try{ window.localStorage.removeItem('scbak_vor_laden'); }catch(e){}
    try{ for(var q=1;q<=SLOTS;q++) window.localStorage.removeItem('scslot_'+q); window.localStorage.removeItem('sc_autosave'); }catch(e){}   // V4.0: auch die 3 Plätze und den Auto-Save löschen
    o.hidden=true; var e=document.getElementById('einstUeber'); if(e) e.hidden=true;
    if(typeof window.__scLoeschenUndNeu==='function'){ window.__scLoeschenUndNeu(); return; }
    var b=document.getElementById('neuesSpielKnopf'); if(b) b.click();
  }
  async function slotSpeichern(n){
    var tun=async function(){
      try{
        var ls=sammeln(); if(!ls['sc81_sc_stand']){ sag('Kein Spielstand zum Speichern gefunden.',true); return; }
        var code=await kodieren(ls);
        var inf=info(ls), ti=teamInfo(); inf.st=ti.st; inf.land=ti.land;
        window.localStorage.setItem('scslot_'+n,JSON.stringify({t:Date.now(),i:inf,c:code}));
        sag('Gespeichert auf Platz '+n+'.'); zeichne();
      }catch(e){ sag('Speichern nicht möglich: '+(e&&e.message?e.message:'Speicher voll?'),true); }
    };
    if(slotLesen(n)) frage('Platz '+n+' ist belegt. Den alten Spielstand dort überschreiben?','JA, ÜBERSCHREIBEN',tun); else tun();
  }
  function slotLaden(n){
    var s=slotLesen(n); if(!s) return;
    frage('Platz '+n+' laden? Dein aktueller Spielstand wird dabei überschrieben.','JA, LADEN',async function(){
      try{ var obj=await dekodieren(s.c); anwenden(obj); }catch(e){ sag(e.message||'Laden nicht möglich.',true); }
    });
  }
  function anwenden(obj){
    var S=window.localStorage, alt=sammeln(), k;
    try{ S.setItem('scbak_vor_laden',JSON.stringify({t:Date.now(),ls:alt})); }catch(e){}
    try{
      var del=[]; for(var i=0;i<S.length;i++){ k=S.key(i); if(istSpielKey(k)) del.push(k); }
      del.forEach(function(x){ S.removeItem(x); });
      for(k in obj.ls) S.setItem(k,obj.ls[k]);
    }catch(e){
      try{ for(k in obj.ls) S.removeItem(k); for(k in alt) S.setItem(k,alt[k]); }catch(e2){}
      throw new Error('Laden nicht möglich (Speicher voll?). Dein alter Stand blieb erhalten.');
    }
    sag('Geladen – das Spiel startet neu …');
    // kurz festhalten, falls das laufende Spiel noch einmal den alten Stand schreibt
    var n=0, iv=setInterval(function(){ try{ for(var x in obj.ls) if(S.getItem(x)!==obj.ls[x]) S.setItem(x,obj.ls[x]); }catch(e){} if(++n>=8){ clearInterval(iv); window.location.reload(); } },30);
  }
  async function codeErzeugen(){
    try{
      var ls=sammeln(); if(!ls['sc81_sc_stand']){ sag('Kein Spielstand gefunden.',true); return; }
      var code=await kodieren(ls), ta=$('sCodeOut'); ta.value=code; ta.focus({preventScroll:true}); ta.select();
      var ok=false; try{ if(navigator.clipboard&&navigator.clipboard.writeText){ await navigator.clipboard.writeText(code); ok=true; } }catch(e){}
      if(!ok){ try{ ta.setSelectionRange(0,code.length); ok=document.execCommand('copy'); }catch(e){} }
      sag(ok?'Code kopiert. Bitte sicher aufbewahren.':'Bitte den markierten Code selbst kopieren.',!ok);
    }catch(e){ sag('Code nicht möglich: '+(e&&e.message||''),true); }
  }
  async function codeLaden(){
    var txt=$('sCodeIn').value;
    if(!txt.trim()){ sag('Bitte zuerst den Code einfügen.',true); return; }
    try{ var obj=await dekodieren(txt); }catch(e){ sag(e.message||'Ungültiger Code.',true); return; }
    frage('Diesen Code laden? Dein aktueller Spielstand wird dabei überschrieben.','JA, LADEN',function(){ try{ anwenden(obj); }catch(e){ sag(e.message,true); } });
  }
  function auf(m){ modus=m; frageZu(); msgEl.textContent=''; zeichne(); }
  knopf.addEventListener('click',function(){ $('sCodeOut').value=''; $('sCodeIn').value=''; auf('s'); o.hidden=false; });
  $('sTabS').addEventListener('click',function(){ auf('s'); });
  $('sTabL').addEventListener('click',function(){ auf('l'); });
  $('sKopieren').addEventListener('click',codeErzeugen);
  $('sCodeLaden').addEventListener('click',codeLaden);
  $('sZu').addEventListener('click',function(){ o.hidden=true; });
  // V4.0: ALLES ZURÜCKSETZEN – mit Sicherheitsfrage, löscht Spielstand, 3 Plätze und Auto-Save
  $('sReset').addEventListener('click',function(){ frage('⚠️ ACHTUNG: Alles wird gelöscht – Packs, Karten, Crows, Titel, Liga, Hall of Fame, alle 3 Speicherplätze und der Auto-Save. Das kann nicht rückgängig gemacht werden. Du startest ganz neu.','JA, ALLES LÖSCHEN',alleZuruecksetzen); });
  o.addEventListener('click',function(e){ if(e.target===o) o.hidden=true; });
  window.__spielstandTest={sammeln:sammeln,kodieren:kodieren,dekodieren:dekodieren};
})();
