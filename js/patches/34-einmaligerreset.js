/* Silescrow Cup V 4.2 – js/patches/34-einmaligerreset.js */

/* Einmalig: fragt beim ersten Start, ob der Spielstand komplett zurückgesetzt werden soll (Test mit den Gold-Packs rückgängig machen).
   Die Geschenk-Packs werden nicht mehr vergeben. Danach fragt das Spiel nie wieder. Vorgehen wie NEUES SPIEL in den Einstellungen. */
(function(){
  var FLAG='testGoldReset_v1';
  try{ if(localStorage.getItem(FLAG)) return; }catch(e){ return; }
  function loeschen(){
    try{ var S=window.localStorage, del=[]; for(var i=0;i<S.length;i++){ var k=S.key(i); if(k && (k.indexOf('sc81_')===0 || k.indexOf('silescrow')===0 || k.indexOf('sc_')===0)) del.push(k); } del.forEach(function(k){ S.removeItem(k); }); }catch(e){}
    try{ window.sessionStorage.clear(); }catch(e){}
    try{ window.name=String(window.name).replace(/\s*scRadNie/g,''); }catch(e){}
    try{ window.localStorage.setItem('scResetTs',String(Date.now())); }catch(e){}
    try{ window.localStorage.setItem(FLAG,'1'); }catch(e){}
    try{ indexedDB.deleteDatabase('silescrowCup'); }catch(e){}
    try{ if(window.indexedDB && indexedDB.databases) indexedDB.databases().then(function(ds){ ds.forEach(function(x){ if(x && x.name) indexedDB.deleteDatabase(x.name); }); }); }catch(e){}
    setTimeout(function(){ window.location.reload(); },200);
  }
  function behalten(){ try{ localStorage.setItem(FLAG,'1'); }catch(e){} }
  function fragen(){
    var text='Alles zurücksetzen? Karten, Packs, Crows, Training, Titel und Liga sind danach weg und du startest ganz neu – ohne Pack am Anfang.';
    if(typeof window.wahlDialog==='function'){ window.wahlDialog('ALLES ZURÜCKSETZEN?',text,'🗑️ JA, ALLES ZURÜCKSETZEN','NEIN, BEHALTEN',loeschen,behalten); return; }
    if(window.confirm(text)) loeschen(); else behalten();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(fragen,2500); }); else setTimeout(fragen,2500);
})();
