/* Silescrow Cup V 4.2 – js/patches/35-zusatz.js */

(function(){
  function fuellen(){
    var p=document.getElementById('shopPlatz'),f=document.getElementById('flaeche'),re=document.querySelector('#menue .rechts'),ein=document.querySelector('#menue .rechts .einstellungen');
    if(!p||!f||!re||!ein||!p.offsetHeight) return;
    var s=f.getBoundingClientRect().width/f.offsetWidth; if(!s) return;
    var last=null; for(var i=ein.children.length-1;i>=0;i--){ var c=ein.children[i]; if(c.offsetHeight>0 && c!==p && getComputedStyle(c).display!=='none'){ last=c; break; } }
    var cs=getComputedStyle(ein), pad=(parseFloat(cs.paddingBottom)||0)+(parseFloat(cs.borderBottomWidth)||0)+9;
    var bottom=Math.max(last?last.getBoundingClientRect().bottom:0, p.getBoundingClientRect().bottom);
    var slack=(re.getBoundingClientRect().bottom-bottom)/s-pad;
    var h=p.offsetHeight, n=Math.max(44,Math.min(134,Math.round(h+slack)));
    if(Math.abs(n-h)>=2) p.style.height=n+'px';
  }
  function platz(){
    fuellen();
    var p=document.getElementById('shopPlatz'),k=document.getElementById('packKnopf'),f=document.getElementById('flaeche');
    if(!p||!k||!f||!k.parentElement) return;
    var r=p.getBoundingClientRect(); if(!r.width) return;
    var kr=k.parentElement.getBoundingClientRect(), s=f.getBoundingClientRect().width/f.offsetWidth; if(!s) return;
    k.style.setProperty('--sx',((r.left-kr.left)/s)+'px');
    k.style.setProperty('--sy',((r.top-kr.top)/s)+'px');
    k.style.setProperty('--sw',(r.width/s)+'px');
    k.style.setProperty('--sh',((r.height/s)-6)+'px');
  }
  window.addEventListener('resize',platz);
  setInterval(platz,400);
})();
