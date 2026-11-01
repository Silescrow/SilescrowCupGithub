/* Silescrow Cup V 4.2 – js/patches/15-falls-eine-alte-version-beim-neu.js */

(function(){
  try{
    var originalPackVerdienen = STAND.packVerdienen.bind(STAND);
    STAND.packVerdienen = function(art, quelle){
      if(quelle === 'starter'){
        var already = false;
        try { already = !!(STAND.daten && STAND.daten.starterGiven); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
        try { already = already || LS81.getItem('sc_starter_silber_v1') === '1'; } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
        if(already){
          var existing = STAND.packs.find(function(pk){ return pk && pk.quelle === 'starter'; });
          return existing || null;
        }
      }
      return originalPackVerdienen(art, quelle);
    };

    // Falls eine alte Version beim Neuladen bereits doppelte Starter-Packs erzeugt hat:
    // nur das erste behalten; weitere werden entfernt.
    var starterIndexes=[];
    STAND.packs.forEach(function(pk,i){ if(pk && pk.quelle === 'starter') starterIndexes.push(i); });
    if(starterIndexes.length > 1){
      for(var i=starterIndexes.length-1;i>0;i--){
        try { STAND.packOeffnen(starterIndexes[i]); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      }
    }

    // Nach dem Öffnen darf das Starter-Pack nie wieder automatisch erzeugt werden.
    if(STAND.daten && STAND.daten.starterGiven){
      try { LS81.setItem('sc_starter_silber_v1','1'); } catch(e){typeof __scWarn==='function'&&__scWarn(e)}
      var status=document.getElementById('starterPackStatus');
      var button=document.getElementById('starterPackButton');
      var hasStarter=STAND.packs.some(function(pk){return pk && pk.quelle==='starter';});
      if(status && !hasStarter) status.hidden=true;
      if(button && !hasStarter) button.disabled=true;
    }
  }catch(e){typeof __scWarn==='function'&&__scWarn(e)}
})();
