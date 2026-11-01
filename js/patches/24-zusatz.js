/* Silescrow Cup V 4.2 – js/patches/24-zusatz.js */
setInterval(function(){try{var z=(typeof SPIEL!=='undefined')&&SPIEL.zustand,n=document.getElementById('onNamen');if(!n)return;var an=!!window.__onlineMatch&&z&&z.spieler;if(!an){if(!n.hidden)n.hidden=true;return;}
var na=z.spieler.filter(function(p){return p.onlineName&&p.team===0;}).map(function(p){return p.onlineName;}),nb=z.spieler.filter(function(p){return p.onlineName&&p.team===1;}).map(function(p){return p.onlineName;});
var a=document.getElementById('onA'),b2=document.getElementById('onB'),ta=na.join(', '),tb=nb.join(', ');if(a.textContent!==ta)a.textContent=ta;if(b2.textContent!==tb)b2.textContent=tb;n.hidden=false;}catch(e){}},700);
setInterval(function(){try{var b=document.getElementById('onlineBadge'),h=document.getElementById('hud');if(!b)return;var an=!!window.__onlineMatch&&!!h&&h.offsetParent!==null;if(b.hidden===an)b.hidden=!an;}catch(e){}},700);
(function(){var _t=document.title;/* V8.1 */})();