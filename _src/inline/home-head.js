(function(){var d=document.documentElement;d.classList.add('js');if(/[?&]motion=off(&|$)/.test(location.search))d.dataset.motion='off';var q=/[?&]theme=(dark|light)(&|$)/.exec(location.search);if(q)d.dataset.theme=q[1];
try{var t=localStorage.getItem('cm-theme');if(t)d.dataset.theme=t;if(localStorage.getItem('cm-motion')==='off')d.dataset.motion='off';
if(!sessionStorage.getItem('cm-intro')&&!localStorage.getItem('cm-intro')&&!location.hash&&matchMedia('(min-width:821px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&d.dataset.motion!=='off')d.classList.add('intro-on')}catch(e){}
// if the shared script (site.js) has not arrived four seconds on, the header falls back to its plain list of links
setTimeout(function(){var b=document.body;if(b&&b.classList.contains('no-js'))d.classList.add('nosite')},4000)})();
