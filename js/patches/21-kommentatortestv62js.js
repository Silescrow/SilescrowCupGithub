/* Silescrow Cup V 4.2 – js/patches/21-kommentatortestv62js.js */

(function(){
  var knopf=document.getElementById('eKomTest'), ueb=document.getElementById('kmTest');
  if(!knopf||!ueb||typeof KOMMENTAR==='undefined') return;
  var liste=document.getElementById('ktListe'), suche=document.getElementById('ktSuche'), blockSel=document.getElementById('ktBlock'), info=document.getElementById('ktInfo');
  var lab={}; KOMMENTAR.EREIGNISSE.forEach(function(e){ lab[e[0]]=e[1]; });
  var clips=KOMMENTAR.clips, zu=KOMMENTAR.zuordnung(), falsch={}, rows={}, folge=null, folgeT=0, anzahl=0;
  var bl=[]; clips.forEach(function(c){ if(bl.indexOf(c.block)<0) bl.push(c.block); });
  blockSel.innerHTML='<option value="0">Alle Blöcke</option>'+bl.map(function(b){ return '<option value="'+b+'">Block '+b+'</option>'; }).join('');
  function zuText(id){ var t=zu[id]; return t==='x'?'nicht verwenden':(lab[t]||t||'–'); }
  function sichtbar(){ var q=suche.value.trim().toLowerCase(), b=+blockSel.value; return clips.filter(function(c){ return (!b||c.block===b)&&(!q||(c.text+' '+zuText(c.id)+' '+c.id).toLowerCase().indexOf(q)>=0); }); }
  function zaehle(){ info.textContent=anzahl+' Sätze · '+Object.keys(falsch).length+' markiert'; }
  function zeichne(){
    var l=sichtbar(); liste.innerHTML=''; rows={}; anzahl=l.length;
    l.forEach(function(c){
      var r=document.createElement('div'); r.className='kt-r'+(falsch[c.id]?' kt-falsch':''); rows[c.id]=r;
      r.innerHTML='<div class="kt-t"><div class="kt-s"></div><div class="kt-m"></div></div><button type="button" data-p="1">▶</button><button type="button" class="kt-grau" data-f="1">✗</button>';
      r.querySelector('.kt-s').textContent=c.text;
      r.querySelector('.kt-m').textContent='Block '+c.block+' · Nr '+c.nr+' · '+c.id+' · '+zuText(c.id);
      r.querySelector('[data-p]').onclick=function(){ stopp(); spiele(c.id); };
      r.querySelector('[data-f]').onclick=function(){ if(falsch[c.id]) delete falsch[c.id]; else falsch[c.id]=1; r.classList.toggle('kt-falsch',!!falsch[c.id]); zaehle(); };
      liste.appendChild(r);
    });
    zaehle();
  }
  function markiere(id){ Object.keys(rows).forEach(function(k){ rows[k].classList.remove('kt-an'); }); if(id&&rows[id]){ rows[id].classList.add('kt-an'); rows[id].scrollIntoView({block:'nearest'}); } }
  function spiele(id){ try{ KOMMENTAR.probe(id); }catch(e){} markiere(id); }
  function stopp(){ clearTimeout(folgeT); folge=null; try{ KOMMENTAR.stopp(); }catch(e){} markiere(null); }
  function schritt(){ if(!folge||!folge.length){ stopp(); return; } var c=folge.shift(); spiele(c.id); folgeT=setTimeout(schritt,(c.dauer||2)*1000+700); }
  document.getElementById('ktAlle').onclick=function(){ stopp(); folge=sichtbar().slice(); schritt(); };
  document.getElementById('ktStopp').onclick=stopp;
  document.getElementById('ktKopie').onclick=function(){
    var t=clips.filter(function(c){ return falsch[c.id]; }).map(function(c){ return c.id+' | '+c.text+' | '+zuText(c.id); }).join('\n');
    if(!t){ info.textContent='Noch nichts markiert (✗ neben dem Satz tippen)'; return; }
    try{ navigator.clipboard.writeText(t).then(function(){ info.textContent='Kopiert: '+Object.keys(falsch).length+' Sätze'; }, function(){ window.prompt('Zum Kopieren:',t); }); }catch(e){ window.prompt('Zum Kopieren:',t); }
  };
  suche.oninput=zeichne; blockSel.onchange=zeichne;
  document.getElementById('ktZu').onclick=function(){ stopp(); ueb.hidden=true; };
  knopf.addEventListener('click',function(){ var e=document.getElementById('einstUeber'); if(e) e.hidden=true; ueb.hidden=false; zeichne(); });
})();
