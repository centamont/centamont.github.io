// Read before the first frame, so the hero never paints one way and then changes: on a phone held upright the copy
// takes the place the page script gives it once the drawing is up (the same --rise, worked out the same way), and on
// a wider window the survey note shows the local time from the start. (The sun line, which needs the drawing's script,
// comes last in the note, so when it arrives nothing before it moves. The time is written the page's language's way.)
(function(){var h=document.getElementById('top'),m=function(q){return matchMedia(q).matches},b=h.querySelector('.row .btn'),c=document.getElementById('clock');
if(b&&m('(max-width:820px)')&&!m('(orientation:landscape) and (max-height:500px)')){var t=h.offsetTop;for(var e=b;e&&e!==h;e=e.offsetParent)t+=e.offsetTop;var n=Math.ceil(t+b.offsetHeight-(innerHeight-14));if(t<innerHeight&&n>0)h.style.setProperty('--rise',(n<=24?n:-Math.ceil(innerHeight-t))+'px')}
if(c&&c.offsetParent)try{c.textContent=new Intl.DateTimeFormat({es:'es-US','pt-BR':'pt-BR'}[document.documentElement.lang]||'en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(new Date())}catch(x){}})();
