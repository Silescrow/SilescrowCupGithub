/* Silescrow Cup V 4.2 – js/patches/16-v242-loader-logo-copy.js */

(function(){
  'use strict';
  function applyLoaderLogo(){
    var source=document.querySelector('#laden .qlogo');
    var target=document.querySelector('#menue .m-logo-img');
    if(!source || !target) return false;
    if(!target.getAttribute('src')) target.src=source.currentSrc || source.src;
    return true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyLoaderLogo,{once:true});
  else applyLoaderLogo();
  window.addEventListener('pageshow',applyLoaderLogo);
})();
