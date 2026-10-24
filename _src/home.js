document.addEventListener('DOMContentLoaded',function(){
  const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
  // The curtain always lifts: whatever happens below, the page is open and its headline up within four seconds.
  setTimeout(()=>{root.classList.remove('intro-on');try{startHero()}catch(e){const h=document.getElementById('top');if(h)h.classList.add('lit')}},4000);
  const header=document.querySelector('header.site'),nav=document.getElementById('mainNav');

  // Mark the nav item for the section in view.
  const links=[...nav.querySelectorAll('a')];
  const navIO=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    links.forEach(a=>a.getAttribute('href')==='#'+e.target.id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));
  }),{rootMargin:'-45% 0px -54% 0px'});
  // every section is watched, so one with no nav item (Questions, the name) clears the mark rather than leaving the last one lit
  document.querySelectorAll('main > section[id]').forEach(s=>navIO.observe(s));
  new IntersectionObserver(es=>{if(es[0].isIntersecting)links.forEach(a=>a.removeAttribute('aria-current'))},{rootMargin:'0px 0px -60% 0px'}).observe(document.getElementById('top'));

  // The header floats over the ink hero, then settles onto the page (site.js gives it the ink of each ink ground beneath it).
  const hero=document.getElementById('top');
  const atTop=()=>header.classList.toggle('top',scrollY<8);addEventListener('scroll',atTop,{passive:true});atTop();

  // Work the first frame does not need waits for a quiet moment (a second at most), so start-up is never one long task.
  const later=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:1000}):setTimeout(f,1);
  // (an engine whose media queries take only the older addListener)
  const onMQ=(m,f)=>m.addEventListener?m.addEventListener('change',f):m.addListener(f);

  // Local time in Miami, set into the hero's survey note. The clock is not shown on a phone, so there it (whose first
  // reading wakes the browser's whole date library) is not read until a wider window shows it; on a wider window the
  // first reading is taken before the first frame (the script under the hero), so the note never paints one line and
  // then swaps to the time.
  // (One script serves the English, Spanish and Portuguese home pages: each reads its words and its way of writing the
  // time from the page's language.)
  const clock=document.getElementById('clock'),lang=document.documentElement.lang;
  const [locale,pts,sunUp,sunAt,sunDown]=lang==='es'?['es-US',['N','NE','E','SE','S','SO','O','NO'],'Sol a ','° de altura, ','Sol bajo el horizonte']
    :lang==='pt-BR'?['pt-BR',['N','NE','L','SE','S','SO','O','NO'],'Sol a ','° de altura, ','Sol abaixo do horizonte']
    :['en-US',['N','NE','E','SE','S','SW','W','NW'],'Sun ','° up, ','Sun below the horizon'];
  const sunline=document.getElementById('sunline');
  // The sun the drawing is lit by, stated the way a sun study states it. A phone shows it too, beside the caption,
  // so it is set before the drawing is framed under the note (and kept up to date with or without the clock).
  // (While a visitor holds the sun at another hour, the note states that hour and its sun.)
  const sunNote=d=>{if(window.CentamontSun&&sunline){const s=CentamontSun(d);sunline.textContent=s.el>0?sunUp+Math.round(s.el)+sunAt+pts[Math.round(s.az/45)%8]:sunDown}};
  sunNote();
  const tick=()=>{const d=heroM&&heroM.sunT!=null?new Date(heroM.sunT):new Date();sunNote(d);if(!clock||!clock.offsetParent)return;try{clock.textContent=new Intl.DateTimeFormat(locale,{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(d)}catch(e){}};
  setInterval(tick,30000);

  // Models
  const Model=window.CentamontModel,models=[];
  let heroM=null,towerM=null;
  // one line between phone and desktop, the same 820px as the stylesheet, read again whenever the window changes
  const mq=matchMedia('(max-width:820px)');let narrow=mq.matches;const note=document.querySelector('.hero .coords');if(window.ResizeObserver&&note)new ResizeObserver(()=>tick()).observe(note);else{onMQ(mq,()=>later(tick));if(narrow)later(tick);else requestAnimationFrame(tick)}
  // The hero's camera: beside the headline on a wide screen, above it on a phone
  // a phone held sideways frames the tower beside the text, as a desktop does
  const side=()=>matchMedia('(orientation:landscape) and (max-height:500px)').matches;
  // Text enlarged on its own (a browser's text-only zoom, which leaves the window as wide as it was) leaves no room beside
  // the headline for the tower, so from one and a half times the set size the hero stacks as it does on a phone: the
  // tower above, the copy under it (home.css, .hero.stack). At the set size this never applies.
  let stack=false;
  const stacked=()=>{const s=!narrow&&!side()&&parseFloat(getComputedStyle(document.body).fontSize)>=27;if(s!==stack){stack=s;hero.classList.toggle('stack',s)}return narrow||stack};
  const heroView=()=>{const mid=matchMedia('(max-width:1180px)').matches,wide=innerWidth>1600;return stacked()&&!side()?(photo?{phi:.13,dist:100,ty:19.7,scale:2,offsetX:.08}:{phi:.1,dist:92,ty:17.5,scale:2,offsetX:.08}):{phi:.13,dist:100,ty:mid&&!photo?21.3:19.7,scale:wide?2.2:2.0,offsetX:wide?.25:mid?.28:.22}};
  let heroTy=0,framed=false;
  // The hero is the drawing: the tower drawn in line, lit by this hour's sun, its residences under contract in bronze, on
  // every screen. (A blind panel preferred it, 3 to 0, to the path-traced photograph that once replaced it when built; the
  // photographs now close the developer story, where the finished building is shown as it will look: see plate below.)
  // With a still (model.js, STILLS) the camera would stand where the still was made from, with no orbit, no tilt after
  // the pointer and no ride up the façade; those branches stay, so the photograph can come back to the hero in one line.
  // (tools/plates.mjs asks for one still by name, to photograph the hero under it for the plates)
  const photo=Model&&Model.stills&&Model.stills[window.__cmStill]?window.__cmStill:null;
  // The hero is lit by this hour's sun, so it is seen from where the sun models it: by day the camera starts 35 degrees off
  // the sun's bearing and turns away from it as it builds and orbits, coming to rest up to 80 degrees off, so a lit face
  // and a shade side both show and the shadow falls in the open. The sun stands on the viewer's left (the shadow falls to
  // the right) wherever the window leaves it 50 degrees of room, and the entrance, on the south face, always stays
  // within 56 degrees of the eye, so the porte-cochère stands clear in front of the podium and never lies across its
  // corner (it wins over the sun). The whole sweep keeps inside that window: about 17 degrees while it builds (0.0009 a
  // frame), then 14.3 degrees for each 0.0001 a frame of idle drift until it rests 45 s on; the drift is as near the
  // night's degree a second as the window leaves room for, about 0.0002 a frame where it can (0.7 degrees a second) and
  // slower, down to about 0.00006, where the window is narrowest (near midday, when the sun stands over the entrance), so
  // the first frame still stands 35 degrees off the sun (25 at the narrowest, with the sun just east of south).
  // The shadows' hatch runs along the line of sight at mid-sweep, so it never closes up on the low ground. After dark the
  // camera starts where it always has. (Bearings are compass degrees from the tower to the eye.)
  const heroCam=(()=>{const o={th:-0.5,orbit:0.0009,idle:0.0003},s=window.CentamontSun&&CentamontSun();if(photo){const th=Model.stills[photo].th;return{th,orbit:0,idle:null,hatch:th*180/Math.PI+180}}if(!s||!(s.night<0.6))return o;
    const A=s.az,lo=124,hi=236,left=A-lo>=50,off=Math.min(79.5,left?A-lo:hi-A),idle=Math.max(0.55,Math.min(2,(off-35-17)/14.3))/1e4,S=17+14.3e4*idle;
    let eR=left?A-off:A+off,e0=left?eR+S:eR-S;
    const sh=Math.max(lo-Math.min(e0,eR),Math.min(0,hi-Math.max(e0,eR)));eR+=sh;e0+=sh;
    o.th=((reduce?eR:e0)-180)*Math.PI/180;o.orbit=left?-0.0009:0.0009;o.idle=left?-idle:idle;o.hatch=(e0+eR)/2;return o})();
  // (on a wide screen the ruler's names grow with it, from 13px up to 16px at 2560)
  const frameHero=()=>{framed=true;const v=heroView(),narrow=stacked();heroM.o.labelSize=Math.round(Math.min(16,Math.max(13,innerWidth/160)));Object.assign(heroM.o,{dist:v.dist,ty:v.ty,scale:v.scale,offsetX:v.offsetX});heroM.phi=v.phi;
    // on a phone the crown stays below the survey note and the tower stands clear of the headline
    const wrap=hero.querySelector('.wrap'),at=e=>{let t=0;for(;e&&e!==hero;e=e.offsetParent)t+=e.offsetTop;return t};
    if(narrow){const up=!side(),note=document.querySelector('.hero .coords'),c=heroM.c.getBoundingClientRect(),nb=note&&note.offsetParent?note.getBoundingClientRect().bottom-c.top:64;
      // on a short phone held upright the fold never cuts through the first button: if a little closing up (24px at most)
      // shows it whole, the copy closes up under the drawing; if not, the copy steps down so the button starts under the fold
      hero.style.removeProperty('--rise');
      const btn=up&&wrap.querySelector('.row .btn');if(btn){const t=hero.offsetTop+at(btn),need=Math.ceil(t+btn.offsetHeight-(innerHeight-14));if(t<innerHeight&&need>0)hero.style.setProperty('--rise',(need<=24?need:-Math.ceil(innerHeight-t))+'px')}
      // and the drawing's ground stays 28px above the headline, so the podium and its hatch never touch the type (with the
      // photograph, 18px: below its quay there is only water, fading into the bay); the crown stands 14px under the
      // caption, or 10px under the sun line where that closes the note (its line has no descenders)
      const h1=up&&wrap.querySelector('h1'),gb=h1?Math.max(c.height*.22,c.height-(at(h1)-(photo?18:28))):c.height*.22;
      const top=nb+(sunline&&sunline.offsetParent?10:14);
      // (with the photograph the camera's height is the still's, so only the size is fitted: the largest that keeps the
      // crown under the note and the ground over the headline)
      if(photo){let lo=.2,hi=v.scale;for(let i=0;i<24;i++){const s=(lo+hi)/2,b=heroM.fit(heroCam.th,v.phi,{measure:true,ty:v.ty,scale:s});if(b.y0>=top&&b.y1<=c.height-gb)lo=s;else hi=s}heroM.o.ty=v.ty;heroM.o.scale=lo}
      else{const f=heroM.fit(heroCam.th,v.phi,{margin:[top,0,gb,0],vOnly:true,maxScale:v.scale});heroM.o.ty=f.ty;heroM.o.scale=f.scale}
      // upright, the tower and its ruler stand as one group on the screen's centre line
      if(up){const b=heroM.fit(heroCam.th,v.phi,{measure:true});heroM.o.offsetX+=(heroM.w/2-(b.x0+b.x1)/2)/heroM.w}}
    // and the level ruler's labels end where the page's column does, under the header's last button: the tower moves
    // left as far as the headline allows, then draws smaller, keeping its left edge (a tablet held upright, whose width
    // sizes the tower, needs the most). Where the column leaves a wide margin beside it, the tower gives up no more than
    // a fifth of its size for that, and past it only keeps off the screen's edge. The sun's path ends on the labels' line.
    const W=heroM.w,col=wrap.offsetLeft+wrap.offsetWidth-parseFloat(getComputedStyle(wrap).paddingRight),box=()=>heroM.fit(heroCam.th,v.phi,{measure:true});
    const textR=narrow&&!side()?-1e9:Math.max(...[...hero.querySelectorAll('h1,.lede,.row .btn,.row .write')].map(e=>e.getBoundingClientRect().right))+64;let b=box();
    for(const [edge,floor] of [[Math.min(W-18,col),W-col>100?.8:.55],[W-18,.55]]){let over=b.x1-edge;if(over<=.5)continue;
      const sh=Math.min(over,Math.max(0,b.x0-textR));heroM.o.offsetX-=sh/W;over-=sh;
      for(let i=0;i<8&&over>.5&&heroM.o.scale>v.scale*floor+1e-6;i++){b=box();heroM.o.scale*=Math.max(floor*v.scale/heroM.o.scale,1-over/(b.x1-b.x0));const b2=box();heroM.o.offsetX+=(b.x0-b2.x0)/W;over=box().x1-edge}
      b=box()}
    heroM.o.edge=W-Math.min(W-18,Math.max(col,b.x1));
    // beside the headline the ground sinks into the hero's foot (site.css), so its level goes unnamed rather than half-read
    heroM.o.groundLabel=narrow||side();
    // stacked, the group stands on the centre line and the ruler's labels take the corner the sun's path would use
    heroM.o.sunPath=!narrow||side();
    heroTy=heroM.o.ty;heroM.o.ty=heroTy+(reduce||photo?0:Math.min(1,scrollY/innerHeight)*9);
    // the photograph is sent for once the drawing is first framed, so its size is chosen for the size it is shown at (a
    // phone's tower is drawn small enough for the lighter file, which is a quarter of the pixels to decode and lay down)
    if(photo&&!heroM.ph)heroM.photo(photo,'/hero/',true);
    heroM.touch()};
  // A drawing that cannot start (no canvas, an old engine) costs only itself: the rest of the page carries on without it.
  const make=(id,o)=>{try{const m=new Model(document.getElementById(id),o);return m.dead?null:m}catch(e){return null}};
  if(Model){
    // (the drawing's resize observer frames it in its first frame, before it draws; an engine without one frames it now)
    heroM=make('heroModel',{turn:photo&&Model.stills[photo].turn||0,real3d:!!photo,order:'top',orbit:heroCam.orbit,orbitIdle:heroCam.idle,hatch:heroCam.hatch,rate:34,slow:2,soldRate:60,cascadeK:4,theta:heroCam.th,labels:true,dimSide:1,palms:false,guides:true,sunPath:true,onResize:()=>{narrow=mq.matches;frameHero()}});
    if(heroM){if(!window.ResizeObserver)try{frameHero()}catch(e){}models.push(heroM);
      // the headline's own type sets where the copy sits, so the framing is taken again once the fonts are in
      // (unless the first framing is still to come: it will see them)
      if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(framed)try{frameHero()}catch(e){}});
      // and again whenever the headline changes size on its own, as text enlarged without the window changing does
      if(window.ResizeObserver){let hs='';new ResizeObserver(([e])=>{const r=e.contentRect,k=Math.round(r.width)+'x'+Math.round(r.height);if(k===hs)return;const was=hs;hs=k;if(was&&framed)requestAnimationFrame(()=>{try{frameHero()}catch(e){}})}).observe(hero.querySelector('h1'))}}
  }
  if(heroM){
    // the tilt that follows the pointer is motion too: with motion off the drawing holds still
    if(!reduce&&!photo)addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&scrollY<innerHeight)heroM.pointer(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)},{passive:true});
    // A loupe over the tower on desktop: it shows the structure behind the glass.
    const heroEl=document.querySelector('.hero');
    // (only beside the headline: a window narrowed to the phone layout puts the tower above it, and the loupe goes)
    if(heroEl&&matchMedia('(hover:hover) and (pointer:fine)').matches){
      heroEl.addEventListener('pointermove',e=>{const r=heroEl.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        const on=!narrow&&!stack&&x>r.width*.52&&!e.target.closest('a,button,.coords,.scrub'),was=!!heroM.lens;heroM.lens=on?{x,y,r:Math.min(96,r.width*.07)}:null;heroEl.classList.toggle('loupe',on);if(on||was)heroM.touch()},{passive:true});
      heroEl.addEventListener('pointerleave',()=>{heroM.lens=null;heroEl.classList.remove('loupe');heroM.touch()});
    }
    // The sun's path can be moved by hand. Over its arc (or dragging along it) the drawing is lit for that hour of today,
    // its shadows thrown for it, and the survey note states it; let go, the sun goes back to now. The arc takes the
    // pointer in a band laid over it (the loupe never opens there); a touch moves the sun only sideways, so a finger
    // moving up or down still scrolls the page. With motion off the sun stays where it is.
    if(heroEl&&!reduce){
      const band=document.createElement('div'),coarse=matchMedia('(pointer:coarse)').matches;band.className='scrub';band.setAttribute('aria-hidden','true');
      Object.assign(band.style,{position:'absolute',zIndex:'1',display:'none',cursor:'ew-resize',touchAction:'pan-y pinch-zoom'});heroEl.appendChild(band);
      const at=e=>{const r=heroM.c.getBoundingClientRect();return heroM.sunAt(e.clientX-r.left)};
      let drag=null,bk='',noteT=null;
      band.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,on:e.pointerType==='mouse'};if(drag.on){try{band.setPointerCapture(e.pointerId)}catch(_){}heroM.scrub(at(e))}});
      band.addEventListener('pointermove',e=>{
        if(e.pointerType==='mouse'){heroM.scrub(at(e));return}
        if(!drag||drag.id!==e.pointerId)return;
        // (a touch takes the sun once it has moved sideways more than it has moved up or down)
        if(!drag.on){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.2)return;drag.on=true;try{band.setPointerCapture(e.pointerId)}catch(_){}}
        heroM.scrub(at(e))});
      const end=e=>{if(drag&&drag.id===e.pointerId)drag=null;if(e.pointerType!=='mouse'||e.type!=='pointerup')heroM.scrub(null)};
      ['pointerup','pointercancel','pointerleave'].forEach(t=>band.addEventListener(t,end));
      // (the band follows the arc wherever the drawing puts it, and the note the sun wherever it is moved to)
      heroM.o.onFrame=m=>{const b=m.sunBox(coarse?12:0),k=b?[b.x0,b.y0,b.x1,b.y1].map(Math.round).join():'';
        if(k!==bk){bk=k;if(b)Object.assign(band.style,{display:'block',left:Math.round(b.x0)+'px',top:Math.round(b.y0)+'px',width:Math.round(b.x1-b.x0)+'px',height:Math.round(b.y1-b.y0)+'px'});else band.style.display='none'}
        if(m.sunT!==noteT){noteT=m.sunT;tick()}};
    }
  }
  // Beside the headline the drawing's bronze is named over its level ruler, in the names' column above the roof: the
  // residences under contract, as the hero stands once built, read as the story's gauge reads them (home.css, .key-sold). It follows the ruler wherever the
  // drawing puts it, keeps inside the window, and goes where the tower stands above the copy, which leaves it no room.
  const keyEl=hero.querySelector('.key-sold');
  if(heroM&&keyEl){const was=heroM.o.onFrame;let kk='';heroM.o.onFrame=m=>{if(was)was(m);const r=m.rb,on=!!r&&!stacked()&&m.L>33.5,k=on?Math.round(r.x0)+','+Math.round(r.y1):'';if(k===kk)return;kk=k;keyEl.classList.toggle('on',on);if(on){const c=m.c,x=c.offsetLeft+r.x1-3*m.o.labelSize-6;keyEl.style.left=Math.round(Math.min(x,innerWidth-keyEl.offsetWidth-16))+'px';keyEl.style.top=Math.round(c.offsetTop+r.y0-keyEl.offsetHeight-14)+'px'}}}
  document.addEventListener('cm-theme',()=>models.forEach(m=>m.colors()));

  // Intro: a hundred blows, counted and parted by the curtain's own script (just after its markup), from the first paint.
  // The hero tower then sells as the curve below has it by completion (46 of its 62 residences, about three quarters),
  // its sold residences standing in the sketch before the frame rises into them: the pre-sale threshold is met as ground breaks.
  // It goes up briskly (sales at 60 levels' worth a second, the frame at 34 levels a second, its rooms lit in about
  // half a second after dark), so the finished tower, and its photograph (fetched at once), stand about two seconds after it starts.
  // It starts as the halves part. Until then it is drawn once, under the curtain, and holds still; if they have already
  // parted (a slow connection), it starts now, behind the open page. Without the curtain's script there is no intro.
  // Without an intro (a return visit, a phone, motion off) the build has been seen or is not wanted: the tower stands
  // finished from the first frame, and its photograph, fetched at once, fades in as soon as it is decoded.
  // Standing finished, the tower waits unseen for its photograph (or 1.2 s at most), then the canvas fades in whole on the
  // compositor (home.css, #heroModel.wait): the drawn tower never shows for a moment before the photograph replaces it.
  const intro=window.CentamontIntro;let started=false;
  const unveil=()=>{if(!heroM||!photo||reduce)return;const c=heroM.c;c.classList.add('wait');let t=0;const go=()=>{clearTimeout(t);mo.disconnect();c.classList.remove('wait')},mo=new MutationObserver(()=>{if(c.dataset.still)go()});mo.observe(c,{attributes:true,attributeFilter:['data-still']});t=setTimeout(go,1200)};
  const startHero=()=>{if(started)return;started=true;if(heroM){heroM.hold(false);if(!intro){unveil();heroM.set(34,23,false,true)}else{heroM.sketch();setTimeout(()=>heroM.set(0,14,false),reduce?0:100);setTimeout(()=>heroM.set(34,23,false),reduce?0:300)}}hero.classList.add('lit')};
  if(!intro)root.classList.remove('intro-on');
  if(intro&&!intro.open&&root.classList.contains('intro-on')){if(heroM)heroM.hold(true);intro.go=startHero}else startHero();
  // The open menu covers the page below the header, so its drawings run no frames until it closes (the hero only once
  // the intro has let it go). site.js marks the open menu on the root.
  let covered=false;new MutationObserver(()=>{const o=root.classList.contains('menu-open');if(o===covered)return;covered=o;models.forEach(m=>m.hold(o||(m===heroM&&!started)))}).observe(root,{attributes:true,attributeFilter:['class']});

  // Hero camera rides up the façade as the page scrolls away, like a lift, while the next sheet is laid over it.
  // The copy sinks (42% of the scroll) and dims with it, but only where its buttons come fully into view before the sinking
  // carries them past the hero's foot and under the next sheet. A short or zoomed window, whose copy runs well below the
  // fold, keeps the copy still.
  if(heroM&&!reduce){let q=0,lp=-1,sink=true;const row=hero.querySelector('.wrap .row'),fits=()=>{let rb=row?row.offsetHeight:0;for(let e=row;e&&e!==hero;e=e.offsetParent)rb+=e.offsetTop;sink=!row||.42*Math.max(0,hero.offsetTop+rb-innerHeight)<=.58*(hero.offsetHeight-rb);lp=-1;onScroll()};
    const onScroll=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;const p=Math.min(1,scrollY/innerHeight);if(p===lp)return;lp=p;if(!photo){heroM.o.ty=heroTy+p*9;heroM.touch()}hero.style.setProperty('--p',sink?p.toFixed(4):'0')})};
    addEventListener('scroll',onScroll,{passive:true});let fw=innerWidth;addEventListener('resize',()=>{if(innerWidth!==fw){fw=innerWidth;fits()}});
    // (the observer measures the copy in the first frame, where the page is laid out anyway)
    if(window.ResizeObserver){new ResizeObserver(fits).observe(hero);onScroll()}else fits()}

  // The building rises with the developer story, as a Miami pre-construction sale runs and as the curve below has it
  // at par: residences sell off plan from launch, the lender's pre-sale threshold is met, then ground breaks.
  // Bronze is the stacking plan: the two penthouse levels sell with the rest, while the podium (lobby and amenities)
  // and the crown (the plant screen and roof) are never for sale. The gauge reads the drawing itself.
  // Step figures (data-sold, residences of 62) are the curve's at par: 18 at month 3, 32 when the threshold is met and
  // ground breaks in month 14, 46 at its top-off (month 32), every one by the last closing; the hero stands at 46.
  const steps=[...document.querySelectorAll('#steps .step')],name=document.getElementById('stageName');
  const gauge=document.querySelector('.rise .gauge'),gB=document.getElementById('gB'),gS=document.getElementById('gS'),gM=document.getElementById('gM'),pad=v=>String(v).padStart(2,'0');
  const RES=+document.getElementById('gR').textContent.replace('/',''),LIM=.5; // residences; the curve's default threshold
  // what each step ends on (from its data attributes; the model counts levels' worth, two residences to a level), and
  // the camera's bearing and elevation for it
  const data=steps.map((s,n)=>({e:n>0,b:+s.dataset.built,s:+s.dataset.sold/2,c:+s.dataset.built>0&&n<steps.length-1}));
  // the first release, as Strategy plans it and the first 90 days sell it: the residences of step 03, marked from Strategy
  data.forEach((d,n)=>{d.rel=n===1||n===2?data[2].s:0});
  const VIEWS=[[-0.7,-1.3],[-0.9,0.24],[-0.6,0.19],[-0.38,0.16],[-0.15,0.2],[0.1,0.23]];
  // every resting view holds the whole tower, its crown and the crane inside the canvas, refitted to the canvas's size
  // (a phone, or any short figure such as a phone on its side, keeps tight margins)
  // (the site plan is centred on the column the gauge and caption share, not on the canvas's bleed to the page edge)
  // (and on a very wide screen the elevation, level ruler and all, comes no further than 64px past that column into the
  // margin, so the ruler stays with the gauge and caption it belongs to: it slides right, and where the column is too
  // narrow for that, it is drawn smaller inside the column)
  const view=n=>{const [th,ph]=VIEWS[n],d=data[n],tight=narrow||towerM.h<360,bl=Math.max(0,gauge.getBoundingClientRect().left-towerM.c.getBoundingClientRect().left);
    if(!n)return towerM.fit(th,ph,{plan:true,margin:tight?[12,24,12,24+bl]:[40,40,40,40+bl]});
    // (the first release's name, where it is set over its bracket, is kept inside too)
    const m=tight?[14,12,10,12]:[30,22,22,22],v=towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,margin:m});
    const b=towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,measure:true,ty:v.ty,scale:v.scale,offsetX:v.offsetX}),need=bl-64-b.x0,room=towerM.w-m[1]-b.x1;
    if(need>room)return towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,margin:[m[0],m[1],m[2],bl-64]});
    if(need>0)v.offsetX+=need/towerM.w;
    return v};
  // A step's figures arrive with its heading: as the step crosses the reading line, at any pace of reading, skimming or
  // jumping, the drawing goes straight to the step's own state, its sales and its frame timed to land within 0.3 s
  // (sales over the first 0.1 s, since they lead construction and ground breaks only once the threshold is sold, the
  // frame over the next 0.15 s, which leaves a slow frame or two of room), so the gauge, which reads the drawing itself, never stands a beat behind the words or the
  // drawing. The camera, the envelope, the crane and the crown keep their own pace; with motion off it all simply stands.
  let cur=-1,last=0,reading=false,st={...data[0]};
  const motionOff=()=>reduce||root.dataset.motion==='off';
  const put=d=>{Object.assign(st,d);if(!towerM)return;
    // (rates in levels a second: each count crosses its whole distance in its share of the 0.3 s)
    towerM.o.soldRate=Math.max(6,Math.abs(st.s-towerM.S)/.1);towerM.o.rate=Math.max(11,(Math.abs(st.b-towerM.L)+1.1)/.15);
    towerM.release(st.rel);towerM.o.envelope=st.e;towerM.set(st.b,st.s,st.c)};
  // The story's tower is made in a quiet moment after start-up, or as the story comes within a screen of view if that is
  // sooner: it is far down the page, and the first frame has the hero to draw. Until then the gauge states the step's
  // figures itself, and the drawing starts on the step the reader is at.
  // The story closes on the finished building as it will look: at the last closing the plate of this hour's photograph
  // (hero/plate-*.webp, from the hero's stills by tools/plates.mjs) stands over the drawing, and goes as the reader reads
  // back up (home.css, .elev.built). It is fetched with the story's tower, far down the page, never with the hero.
  const elev=document.querySelector('.rise .elev');let plate=null;
  const plateIn=()=>{if(plate||!elev||!Model||!Model.still)return;const k=Model.still(),f='/hero/plate-'+k;plate=new Image();plate.className='bplate';plate.alt='';plate.decoding='async';plate.dataset.still=k;plate.sizes='(max-width:820px) 46vw, 400px';plate.srcset=f+'-half.webp 593w, '+f+'.webp 1185w';plate.src=f+'-half.webp';elev.appendChild(plate)};
  // (it stands over the drawing's own canvas, between the gauge and the caption, laid out wherever the figure puts them)
  const plateFit=()=>{if(!plate)return;const c=document.getElementById('tower');if(!c)return;plate.style.top=c.offsetTop+'px';plate.style.height=c.offsetHeight+'px'};
  const story=()=>{plateIn();if(towerM||!Model)return;
    // by day the story keeps the draughtsman's light (from the south-west, high over the left shoulder), since its views
    // turn toward the south; after dark its homes are lit only once the building is finished (Last closing)
    towerM=make('tower',{theta:-0.7,phi:-0.62,dist:40,ty:2.5,scale:1.5,labels:true,palms:false,footprint:true,north:true,planNotes:true,envelope:false,rate:11,slow:1.5,facadeLag:6,restGuides:true,draft:true});
    if(!towerM)return;models.push(towerM);
    let lb=-1,ls=-1,lf=-1,lm=null,ps=0;
    towerM.o.onFrame=m=>{const b=Math.floor(m.L+.02),s=Math.floor(m.S*2+.02),f=Math.min(1,m.S*2/RES),met=m.S*2>=RES*LIM-.001;
      if(b!==lb){lb=b;gB.textContent=pad(b)}if(s!==ls){ls=s;gS.textContent=pad(s)}
      if(Math.abs(f-lf)>.0005){lf=f;gM.style.transform='scaleX('+f.toFixed(4)+')'}
      if(met!==lm){gauge.classList.toggle('met',met);
        // crossing the threshold while reading forward marks it once
        if(met&&reading&&ps*2<RES*LIM&&lm!==null){gauge.classList.remove('pulse');void gauge.offsetWidth;gauge.classList.add('pulse')}lm=met}
      ps=m.S};
    towerM.o.onResize=()=>{narrow=mq.matches;vs=null;if(cur===riseN)rise(true);else if(cur>=0)towerM.camTo(view(cur),true)};
    towerM.o.envelope=st.e;towerM.set(st.b,st.s,st.c,true);towerM.release(st.rel||0,true);towerM.camTo(view(Math.max(cur,0)),true);if(cur===riseN){vs=null;rise(true)}};
  // without a drawing the gauge states the figures directly
  const state=d=>{Object.assign(st,d);gB.textContent=pad(d.b);gS.textContent=pad(d.s*2);gM.style.transform='scaleX('+Math.min(1,d.s*2/RES).toFixed(4)+')';gauge.classList.toggle('met',d.s*2>=RES*LIM)};
  // Ground broken, the building goes up as the reader reads on. Across the step marked data-rise (Ground broken), from its
  // heading on the reading line to its foot, the frame climbs a floor at a time from that step's levels to the next
  // step's, the sales count on with it and the camera turns toward the next step's view, so at the step's foot the
  // drawing stands exactly as the next step has it and nothing jumps. Reading back up takes it down again.
  const riseN=steps.findIndex(s=>s.hasAttribute('data-rise'));let lr=-1,vs=null;
  const lerp=(a,b,t)=>a+(b-a)*t;
  // (how far through the step the reading line is, eased in and out, 0 to 1; it starts once the heading is past)
  const riseAt=()=>{const r=steps[riseN].getBoundingClientRect(),p=Math.min(1,Math.max(0,((innerHeight*(narrow?.63:.5)-r.top)/r.height-.12)/.8));return p*p*(3-2*p)};
  const rise=force=>{if(riseN<0||cur!==riseN)return;const e=riseAt();if(!force&&Math.abs(e-lr)<.002)return;lr=e;
    const a=data[riseN],b=data[riseN+1],d={e:true,b:Math.round(lerp(a.b,b.b,e)),s:Math.round(lerp(a.s*2,b.s*2,e))/2,c:a.c,rel:0};
    if(!towerM){state(d);return}
    // (the two views it turns between are framed once a size, not each frame)
    if(!vs)vs=[view(riseN),view(riseN+1)];
    const[va,vb]=vs;towerM.camTo({theta:lerp(va.theta,vb.theta,e),phi:lerp(va.phi,vb.phi,e),ty:lerp(va.ty,vb.ty,e),scale:lerp(va.scale,vb.scale,e),offsetX:lerp(va.offsetX,vb.offsetX,e)});put(d)};
  function stage(n){
    if(n===cur)return;
    const now=performance.now(),fwd=n===cur+1,skim=now-last<450;last=now;cur=n;
    reading=fwd&&!skim&&!motionOff();
    if(n===riseN)rise(true);
    else if(towerM){towerM.camTo(view(n));put(data[n])}
    else state(data[n]);
    steps.forEach((x,i)=>x.classList.toggle('on',i===n));
    if(elev){const end=n===steps.length-1;if(end)plateFit();elev.classList.toggle('built',end)}
    name.textContent=steps[n].dataset.name;
  }
  stage(0);
  const towerEl=document.getElementById('tower');
  if(Model&&towerEl){later(story);new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){o.disconnect();story()}},{rootMargin:'100% 0px'}).observe(towerEl)}
  let stepIO=null;
  const watch=()=>{if(stepIO)stepIO.disconnect();stepIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)stage(steps.indexOf(e.target))}),{rootMargin:narrow?'-62% 0px -36% 0px':'-48% 0px -48% 0px'});steps.forEach(s=>stepIO.observe(s))};
  // A jump that lands above the story or past it (a menu link with motion off, a key, the scrollbar) crosses no step,
  // so the drawing takes the first or the last step's state rather than keeping the one it had.
  const list=document.getElementById('steps');let er=0;
  const ends=()=>{er=0;const r=list.getBoundingClientRect(),y=innerHeight*(narrow?.63:.5);if(r.top>y)stage(0);else if(r.bottom<y)stage(steps.length-1)};
  // (and reading back up, a step the reading band never left is taken again once the band's foot is back inside it: the
  // observer reports a step only as it comes into the band, and two steps can share it)
  const back=()=>{if(cur<1)return;const y=innerHeight*(narrow?.64:.52),k=steps.findIndex(s=>{const r=s.getBoundingClientRect();return r.top<=y&&r.bottom>y});if(k>=0&&k<cur)stage(k)};
  const onS=()=>{ends();back();rise(false)};
  addEventListener('scroll',()=>{if(!er)er=requestAnimationFrame(onS)},{passive:true});
  watch();onMQ(mq,()=>{narrow=mq.matches;watch()});

  // Practices: the elevation keeps a one-pixel line at any width.
  const facade=document.querySelector('.facade');
  const hair=()=>{const w=facade&&facade.getBoundingClientRect().width;if(w)facade.parentNode.style.setProperty('--fu',(1200/w).toFixed(4))};
  // (measured by an observer where there is one, which reads it in the first frame rather than while the page starts)
  if(window.ResizeObserver&&facade)new ResizeObserver(hair).observe(facade);else{hair();addEventListener('resize',hair)}
  // (The private door opens from site.js, once half of it is in view, on the stylesheet's clock.)

  // Markets: South Florida and New York open first. The survey sweeps in South Florida's coast, then its county lines, then
  // the one stretch of coast that opens now, with Miami, Fort Lauderdale and West Palm Beach together, as New York's reach
  // draws on the overview; then the routes draw out from South Florida in the order of the list, 160 ms apart, and each row
  // lights as its route lands. A row in the list lights its place on the map.
  const chart=document.getElementById('chart'),ov=chart.querySelector('.ov'),sv=chart.querySelector('.sv'),loc=chart.querySelector('.loc'),reach=sv.querySelector('.rch'),fig=chart.querySelector('.map'),NS='http://www.w3.org/2000/svg';
  const order=['sf','ny','ladal','more','intl'],groups=order.map(m=>({a:-1,on:null,draw:[],els:[...chart.querySelectorAll('[data-m="'+m+'"]')]}));
  // (in ms from the start: the coast sweeps in over 500, the county lines tick in from 180, the reach and its points draw from
  // 220 to 620, and the routes leave from 560, 750 each and 160 apart, so the last lands at 1630)
  const T1=500,K0=180,T2=300,R0=220,T3=400,MS=R0+T3,Q0=560,TR=750,GAP=160,MR=TR+GAP*2,MT=Q0+MR,cl=v=>Math.min(1,Math.max(0,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  // (the routes are measured in the first frame that paints them, once the map comes near, not while the page loads)
  let armed=false;const arm=()=>{armed=true;const defs=ov.insertBefore(document.createElementNS(NS,'defs'),ov.firstChild);
  // a route keeps its dashes, so it draws through a mask of its own
  chart.querySelectorAll('.arc').forEach((p,k)=>{const mk=defs.appendChild(document.createElementNS(NS,'mask'));mk.id='route'+k;
    ['maskUnits','userSpaceOnUse','x','-20','y','-100','width','760','height','480'].forEach((v,j,a)=>{if(j%2===0)mk.setAttribute(v,a[j+1])});
    const d=mk.appendChild(document.createElementNS(NS,'path'));d.setAttribute('d',p.getAttribute('d'));p.setAttribute('mask','url(#route'+k+')');
    // (and it leaves from the locator's edge, so the reach inside it stays clear)
    const o=mk.appendChild(document.createElementNS(NS,'rect'));['x','y','width','height','transform'].forEach(n=>{if(loc.hasAttribute(n))o.setAttribute(n,loc.getAttribute(n))});
    d.style.setProperty('--len',Math.ceil(p.getTotalLength())+'px');groups[order.indexOf(p.dataset.m)].draw.push(d)})};
  const wide=matchMedia('(min-width:1200px)'),held={},hold=(k,v)=>{v=v.toFixed(4);if(held[k]!==v){held[k]=v;chart.style.setProperty(k,v)}};
  // (a reader who arrives in a hurry finds the plate already drawn: its clock is started as if it had run its course)
  let mraf=0,near=false,tS=0,tR=0;const done=(now,T)=>window.cmHurried&&cmHurried(fig.getBoundingClientRect())?now-T-1:now;
  const paint=()=>{mraf=0;if(!armed)arm();const h=innerHeight,now=performance.now(),lb=loc.getBoundingClientRect().bottom,fb=fig.getBoundingClientRect().bottom;let ms=MS,mr=MR,run=false;
    if(!reduce){
      if(wide.matches){
        // side by side, the plate starts as soon as the locator is in view, and then plays through on its own (never while
        // the whole plate is above the screen, as a jump past it leaves it: it keeps its arrival for the way back)
        if(!tS&&lb<h&&fb>64)tS=done(now,MT);ms=tS?now-tS:0;mr=ms-Q0;run=!!tS&&ms<MT}
      else{
        // stacked, the survey comes first and plays as soon as its reach is in view; the routes leave as soon as the
        // locator on the overview below it is in view, but never before the survey's three points have landed (and here
        // too, never while the whole plate is above the screen)
        const rb=reach.getBoundingClientRect().bottom;if(!tS&&rb<h&&fb>64)tS=done(now,MS);ms=tS?now-tS:0;
        if(tS&&!tR&&lb<h&&fb>64)tR=done(now,MR)<now?now-MR-1:Math.max(now,tS+Q0);mr=tR?now-tR:-1;run=(!!tS&&ms<MS)||(!!tR&&mr<MR)}}
    hold('--c',ease(cl(ms/T1)));hold('--t',ease(cl((ms-K0)/T2)));hold('--r',ease(cl((ms-R0)/T3)));
    groups.forEach((g,i)=>{const a=i>1?ease(cl((mr-(i-2)*GAP)/TR)):(ms>=MS?1:0);if(a!==g.a){g.a=a;g.draw.forEach(d=>d.style.setProperty('--a',a.toFixed(4)))}
      const on=a>=1;if(on!==g.on){g.on=on;g.els.forEach(e=>e.classList.toggle('landed',on))}});
    // the three points pulse once, together, when the first route has landed
    if(!reduce&&groups[2].on)chart.classList.add('pulse');
    if(run)req()};
  const req=()=>{if(!mraf)mraf=requestAnimationFrame(paint)};
  new IntersectionObserver(es=>{near=es[0].isIntersecting;if(near)req()},{rootMargin:'25% 0px'}).observe(chart);
  addEventListener('scroll',()=>{if(near)req()},{passive:true});addEventListener('resize',req);
  // each drawing's type takes its size in the first frame (from an observer, where there is one), so a jump to the map finds it set
  // (the survey is sliced to its box, so its scale is set by whichever side fills)
  const unit=()=>{const a=ov.getBoundingClientRect(),b=sv.getBoundingClientRect();if(a.width)ov.style.setProperty('--u',(720/a.width).toFixed(4));if(b.width&&b.height)sv.style.setProperty('--u',Math.min(360/b.width,370/b.height).toFixed(4))};
  if(window.ResizeObserver){const ro=new ResizeObserver(unit);ro.observe(ov);ro.observe(sv)}else{unit();addEventListener('resize',unit)}
  // A row lights its market on the map, and a point on the map lights its row, under the mouse only: a tap has no leave, so
  // it would stay lit. (Each market's name in its row is the link to its page.)
  chart.querySelectorAll('.lv, svg [data-m]').forEach(n=>{n.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')chart.dataset.hl=n.dataset.m});n.addEventListener('pointerleave',()=>delete chart.dataset.hl)});

  // The name is cut line by line; the ruler counts its hundred blows.
  const inIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');inIO.unobserve(e.target)}}),{threshold:.3});
  ['chart','cut','ruler'].forEach(id=>inIO.observe(document.getElementById(id)));
});
