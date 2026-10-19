// Intro: a hundred blows, counted from the first paint; it waits for nothing else on the page. (The count is the
// stylesheet's: its digits are strips the compositor moves, so a page still being read and started under it can neither
// hold it on 001 nor make it leap; site.css, @keyframes cm-o.) This script takes it from the hundredth blow: it holds a
// moment, then a hairline cracks the stone and the halves part, each carrying its half of the count, which fades before
// the headline rises where it stood. Any tap, key or scroll (or a print) goes straight to the parting. The page script
// starts the tower as the halves begin to part (window.CentamontIntro.go), or at once if they already have. The parting
// itself runs on the stylesheet's clock (home.css, .curtain.split-on); the class 'part' only lets clicks through.
(function(){var d=document.documentElement;if(!d.classList.contains('intro-on'))return;
var c=document.querySelector('.curtain'),bar=document.getElementById('introBar'),I=window.CentamontIntro={open:false,go:null},D=580,done=false,hold=0;
// running, so the stylesheet's failsafe is not needed: the count and the parting play in full
c.style.animation='none';
try{sessionStorage.setItem('cm-intro','1');localStorage.setItem('cm-intro','1')}catch(e){}
var lit=function(){var h=document.getElementById('top');if(h){h.classList.add('lit');return true}},
open=function(){I.open=true;if(!lit())document.addEventListener('readystatechange',lit);if(I.go)I.go()},
part=function(fast){if(fast)c.classList.add('fast');c.classList.add('split-on');
  setTimeout(function(){c.classList.add('part')},fast?0:100);setTimeout(open,fast?100:120);setTimeout(function(){d.classList.remove('intro-on')},fast?760:820)},
finish=function(fast){if(done){if(fast&&hold){clearTimeout(hold);hold=0;part(true)}return}done=true;c.classList.add('struck');
  // a copy of the struck count in each half, so each slab carries its half away
  var k=c.querySelector('.in');[].forEach.call(c.querySelectorAll('.half'),function(h){var q=k.cloneNode(true);q.setAttribute('aria-hidden','true');[].forEach.call(q.querySelectorAll('[id]'),function(e){e.removeAttribute('id')});h.appendChild(q)});
  if(fast)part(true);else hold=setTimeout(function(){hold=0;part(false)},50)};
// the count ends with its bar; and if frames never come (a tab opened in the background, a stalled machine), on the clock
bar.addEventListener('animationend',function(){finish(false)});
setTimeout(function(){finish(false)},D+1200);
['pointerdown','keydown','wheel','touchstart'].forEach(function(ev){addEventListener(ev,function(){finish(true)},{once:true,passive:true})});
addEventListener('beforeprint',function(){finish(true)})})();
