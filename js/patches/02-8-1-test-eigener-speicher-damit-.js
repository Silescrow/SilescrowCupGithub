/* Silescrow Cup V 4.2 – js/patches/02-8-1-test-eigener-speicher-damit-.js */

// 8+1-Test: eigener Speicher, damit Hauptspiel und Testversion sich nicht vermischen
var LS81=(function(){var P='sc81_';try{var S=window.localStorage;return{getItem:function(k){return S.getItem(P+k)},setItem:function(k,v){return S.setItem(P+k,v)},removeItem:function(k){return S.removeItem(P+k)},clear:function(){}};}catch(e){var m={};return{getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){}};}})();

/* V3.18: meldet verschluckte Fehler (catch-Blöcke) je Meldung nur einmal in der Konsole */
window.__scWarn=function(e){try{var m=String(e&&e.message||e);var h=window.__scSeen=window.__scSeen||{};if(h[m])return;h[m]=1;console.warn('[SC verschluckt]',m);}catch(x){typeof __scWarn==='function'&&__scWarn(x)}};
