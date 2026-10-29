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
  // The sun is stated in plain words rather than in a sun study's figures ("Sun high, south-west", not "Sun 52° up, S"):
  // how high it stands (high from 45°, halfway up from 20°, low under that) and the quarter of the sky it stands in.
  const [locale,pts,sunUp,sunLv,sunDown]=lang==='es'?['es-US',['al norte','al noreste','al este','al sureste','al sur','al suroeste','al oeste','al noroeste'],'Sol ',['bajo','a media altura','alto'],'Sol bajo el horizonte']
    :lang==='pt-BR'?['pt-BR',['ao norte','a nordeste','a leste','a sudeste','ao sul','a sudoeste','a oeste','a noroeste'],'Sol ',['baixo','a meia altura','alto'],'Sol abaixo do horizonte']
    :['en-US',['north','north-east','east','south-east','south','south-west','west','north-west'],'Sun ',['low','halfway up','high'],'Sun below the horizon'];
  const sunline=document.getElementById('sunline');
  // The sun the drawing is lit by, in the words above. A phone shows it too, beside the caption,
  // so it is set before the drawing is framed under the note (and kept up to date with or without the clock).
  // (While a visitor holds the sun at another hour, the note states that hour and its sun.)
  const sunNote=d=>{if(window.CentamontSun&&sunline){const s=CentamontSun(d);sunline.textContent=s.el>0?sunUp+sunLv[s.el>=45?2:s.el>=20?1:0]+', '+pts[Math.round(s.az/45)%8]:sunDown}};
  sunNote();
  const tick=()=>{const d=heroM&&heroM.sunT!=null?new Date(heroM.sunT):new Date();sunNote(d);if(!clock||!clock.parentNode.offsetParent)return;try{clock.textContent=new Intl.DateTimeFormat(locale,{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(d)}catch(e){}};
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
  // Once built, the finished tower is a photograph: the path-traced still for this hour of the Miami sun (morning, day,
  // gold or night), made from the desktop hero's own camera (model.js, STILLS), on a phone as on a desktop. The drawing
  // (labels, ruler, the residences under contract in bronze) stands only while it builds. With the photograph the
  // camera stands where the still was made from (its bearing, height and distance; only the size and the framing follow
  // the screen): no orbit, no tilt after the pointer, no ride up the façade. A phone held on its side keeps the drawing.
  // (A test asks for one still by name.)
  const photo=Model&&Model.stills&&Model.stills[window.__cmStill]?window.__cmStill:Model&&Model.still&&!side()?Model.still():null;
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
  // The photograph is framed by its own features, in the still's pixels: the crown's top, the podium, the quay, the near
  // bay's foot and the shaft's axis (66, 660, 784, 968 and 345 down and across the 1x file), the soft edge on its left (60)
  // and the crown's left end (286). The camera stands
  // where the still was made from, at its bearing and its eye's height; only the size and the shift of the lens follow
  // the screen (the lens's rise sets where the still stands up and down: phi follows, so the eye stays at the still's).
  // Beside the copy the crown stands a margin under the header and the near bay runs to the foot of the screen (the
  // water in front of the island, where the tower and its lit rooms are mirrored, is part of the picture), the shaft a
  // column clear of the headline and never nearer the window's edge than an eighth of it (the still's soft left edge
  // tucks under the copy's ink, so the evening sun, right of the shaft, stays in a 1440 window, though never so far that
  // the still falls short of the window's right edge); the veil's ink
  // stands solid to the copy's right edge and thins to nothing across the still's soft edge, well short of the shaft, so
  // the photograph comes out of the ink with no seam, no drawn sky beside it and no wash on the tower.
  // Stacked (a phone, a tablet held upright), the still runs the full width, its soft edge off the screen and the shaft
  // at a third of it, the crown under the caption line; the copy starts under the podium, and the photograph runs on
  // under the podium, over the quay and the near bay, as far as the room above the headline allows, fading into its ink.
  const ST={crown:66,podium:660,quay:784,foot:968,axis:345,soft:60,crown2:286};
  let plateAt=null;
  // The hero opens on the drawing. While the tower draws itself, the sheet stands a little left of the photograph's
  // framing and a little smaller (SET), so the level ruler and the levels' names have the page's margin to stand in
  // rather than the window's edge; once the building is up the camera settles onto the still's own framing over 0.7 s
  // as the photograph fades in, and the ruler goes with it. The photograph is laid where the tower stands, whatever the
  // size and the shift of the lens, so it comes in during the move. (Motion off, or a phone, or a visitor who has seen
  // the drawing before: the camera stands at the photograph's framing from the first frame.)
  const SET={x:.072,s:.93,ms:700};
  let settle=1,settleAt=0,phTgt=null;
  const settleTo=()=>{if(!phTgt)return;const e=settle*settle*(3-2*settle);heroM.o.offsetX=phTgt.offsetX-SET.x*(1-e);heroM.o.scale=phTgt.scale*(SET.s+(1-SET.s)*e)};
  const framePhoto=(v,narrow,nb)=>{const s=Model.stills[photo],W=heroM.w,H=heroM.h,c=heroM.c,ct=c.getBoundingClientRect().top+scrollY,hb=header?header.offsetTop+header.offsetHeight-ct:64,ey=v.ty-v.dist*Math.sin(v.phi);let z,X,Y,va=0,vb=0,tr=0,lb=[];plateAt=null;
    if(narrow){z=W/(s.w-ST.soft);X=W-s.w*z;Y=nb+12-ST.crown*z;hero.style.setProperty('--plate-foot',Math.round(ct-(hero.getBoundingClientRect().top+scrollY)+Y+ST.podium*z+18)+'px')}
    else{const tm=Math.max(28,H*.045),cl=c.getBoundingClientRect().left;
      z=Math.max(.3,Math.min(Math.min(W*1.15,H)*v.scale/s.f,(H-hb-tm)/(ST.foot-ST.crown)));Y=hb+tm-ST.crown*z;
      const textR=Math.max(0,...[...hero.querySelectorAll('h1 .ln > span,.lede,.row > *')].map(e=>e.getBoundingClientRect().right-cl));
      tr=textR;const ct0=c.getBoundingClientRect().top,bx=q=>{const e=hero.querySelector(q);return e?e.getBoundingClientRect():null},lr=bx('.lede'),rr=bx('.row'),nr=bx('.coords'),hr=bx('h1');lb=[hr&&[hr.top-ct0,hr.bottom-ct0,textR,...AIR.head],lr&&[lr.top-ct0,1e5,Math.max(lr.right,rr?rr.right:0)-cl,...AIR.lede],nr&&nr.height&&[-1e5,nr.bottom-ct0,nr.right-cl,...AIR.note]].filter(Boolean);X=Math.max(W+2-s.w*z,Math.min(textR-110,W-Math.max(96,W/8)-ST.axis*z));va=Math.round(Math.max(textR+8,X));vb=Math.round(Math.max(va+80,X+(ST.axis-150)*z));hero.style.removeProperty('--plate-foot')}
    const f=z*s.f,cx=X-(s.x-s.cx)*z,cy=Y-(s.y-s.cy)*z,ty=ey+(cy-H/2)*v.dist/f;
    Object.assign(heroM.o,{dist:v.dist,ty,scale:f/Math.min(W*1.15,H),offsetX:(cx-W/2)/W});heroM.phi=Math.asin(Math.max(-1,Math.min(1,(ty-ey)/v.dist)));
    // beside the copy, the drawing stands where the settle has it until the building is up (see SET)
    phTgt=narrow?null:{scale:heroM.o.scale,offsetX:heroM.o.offsetX};settleTo();if(narrow)plateAt={Y,z};
    // the canvas fades in under the header (so the header stands on the hero's ink, never on the sky) and, stacked,
    // into the copy's ink under the podium (until the copy is placed: frameHero runs it on to the headline)
    const m=[Math.round(hb*.5),Math.round(hb+Math.max(14,(Y+ST.crown*z-hb)*.55)),narrow?Math.round(Y+ST.podium*z):H,narrow?Math.round(Y+ST.podium*z+48):H];
    ['--m0','--m1','--m2','--m3'].forEach((k,i)=>c.style.setProperty(k,m[i]+'px'));hero.style.setProperty('--va',va+'px');hero.style.setProperty('--vb',vb+'px');
    airAt=narrow?null:{X,Y,z,W,H,textR:tr,lb,m0:m[0],m1:m[1]};airRows=null;airPaint()};
  // The air beside the photograph (wide screens). The still ends a little left of its shaft, so beside the copy there
  // is no picture, and black there made the photograph a print pasted on a dark slide, noon beside midnight. So the
  // still's own light runs on under the copy: its sky, the haze on its horizon and, under that, its bay, read row by
  // row from the scene right of the shaft (the brightest third of each row, so the shaft and the shadows don't darken it)
  // and laid across. Next to the still the rows keep their detail; toward the window's edge they melt into one soft fall
  // of light. Under the horizon the bay is laid in at a little over half its light (bayK), since beside the copy the
  // photograph has its lawn and its quay there, not open water: the hero's foot is one deep ink rather than a bright
  // band with the picture dark beside it. Nothing is made up: no cloud, tower or wave, only the still's own colours, in its own grade. The air
  // covers the still's soft left edge and gives way to the photograph over the next 130 of its pixels, short of the
  // shaft, and the hero's ink deepens over it toward the copy, so every line of it reads as it did on ink (4.5:1 at
  // least for the lede). It is drawn at a quarter of the screen's size (it holds only gradients; the hero's grain lies
  // over it), and it fades in and out with the photograph, frame for frame, as the veil it replaces fades the other way.
  // A phone shows the photograph whole above the copy and needs none.
  const AIR={from:440,to:600,horizon:612,bay:800,bayK:.56,keep:120,give:300,ink:[.8,.52],veil:.4,head:[.66,.52,200],lede:[.8,.7,240],note:[.62,.52,160]};
  let air=null,airAt=null,airRows=null,airKey='';
  // (any filter the stylesheet lays on the photograph, read off the canvas, whose pixels come unfiltered: saturate sepia
  // contrast brightness, the first two as one matrix; none today, since the stills carry their own grade)
  const gradeOf=c=>{const f=getComputedStyle(c).filter||'',n=(k,d)=>{const m=f.match(new RegExp(k+'\\(([\\d.]+)'));return m?+m[1]:d},s=n('saturate',1),q=1-n('sepia',0),ct=n('contrast',1),br=n('brightness',1),
    S=[.213+.787*s,.715-.715*s,.072-.072*s,.213-.213*s,.715+.285*s,.072-.072*s,.213-.213*s,.715-.715*s,.072+.928*s],
    P=[.393+.607*q,.769-.769*q,.189-.189*q,.349-.349*q,.686+.314*q,.168-.168*q,.272-.272*q,.534-.534*q,.131+.869*q],M=[];
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)M.push(P[i*3]*S[j]+P[i*3+1]*S[3+j]+P[i*3+2]*S[6+j]);
    return(r,g,b)=>[0,1,2].map(i=>{const v=Math.min(255,M[i*3]*r+M[i*3+1]*g+M[i*3+2]*b);return Math.min(255,Math.max(0,Math.min(255,((v/255-.5)*ct+.5)*255))*br)})};
  // the light right of the shaft, row by row, read off the hero's canvas once the photograph stands whole there (so over
  // the drawn sky its soft top fades into), at a quarter of the screen's size: the sky and the haze, then, from just
  // above the horizon, the bay's own tone; each row softened a little (near) and a lot (far)
  const airRead=a=>{const c=heroM.c,k=c.width/a.W,x0=a.X+AIR.from*a.z,x1=Math.min(a.W,a.X+AIR.to*a.z),w=Math.round((x1-x0)/4),h=Math.ceil(a.H/4);if(w<4)return null;
    const t=document.createElement('canvas');t.width=w;t.height=h;const q=t.getContext('2d',{willReadFrequently:true});q.drawImage(c,x0*k,0,(x1-x0)*k,a.H*k,0,0,w,h);
    const grade=gradeOf(c),d=q.getImageData(0,0,w,h).data,row=new Float32Array(h*3),lum=new Float32Array(w),idx=[...Array(w).keys()],keep=Math.max(1,Math.round(w*.3));
    for(let y=0;y<h;y++){for(let i=0;i<w;i++){const o=(y*w+i)*4;lum[i]=.2126*d[o]+.7152*d[o+1]+.0722*d[o+2]}
      idx.sort((a,b)=>lum[b]-lum[a]);let r=0,gg=0,b=0;for(let j=0;j<keep;j++){const o=(y*w+idx[j])*4;r+=d[o];gg+=d[o+1];b+=d[o+2]}
      row.set(grade(r/keep,gg/keep,b/keep),y*3)}
    const b0=Math.max(0,Math.min(h-10,Math.round((a.Y+AIR.bay*a.z)/4))),bay=[0,1,2].map(ch=>{let t=0;for(let y=b0;y<h;y++)t+=row[y*3+ch];return t/(h-b0)*AIR.bayK});
    for(let y=0;y<h;y++){const v=Math.min(1,Math.max(0,(y*4-(a.Y+AIR.horizon*a.z-10))/50));for(let ch=0;ch<3;ch++)row[y*3+ch]=row[y*3+ch]*(1-v)+bay[ch]*v}
    const blur=sg=>{const R=Math.ceil(sg*3),ker=[],out=new Float32Array(h*3);let t=0;for(let i=-R;i<=R;i++){const e=Math.exp(-.5*(i/sg)**2);ker.push(e);t+=e}
      for(let y=0;y<h;y++)for(let ch=0;ch<3;ch++){let v=0;for(let i=-R;i<=R;i++)v+=ker[i+R]*row[Math.min(h-1,Math.max(0,y+i))*3+ch];out[y*3+ch]=v/t}return out};
    return{h,near:blur(6*a.z),far:blur(14*a.z)}};
  // laid across, at the same quarter size: the near rows by the still, the far ones toward the window's edge, the ink
  // deepening toward the copy (from AIR.ink's first at the window's edge to its second at the copy's right edge, and
  // to none just past the still's soft edge); opaque over that soft edge, then giving way to the photograph
  const airPaint=()=>{const a=airAt;
    if(!a){if(air)air.hidden=true;return}if(!airRows)return;
    if(!air){air=document.createElement('canvas');air.className='hero-air';air.setAttribute('aria-hidden','true');heroM.c.after(air)}
    air.hidden=false;air.style.setProperty('--m0',a.m0+'px');air.style.setProperty('--m1',a.m1+'px');
    const w=Math.ceil(a.W/4),{near,far,h}=airRows,key=[w,h,a.X,a.Y,a.z*1e3,a.textR,...a.lb.flat()].map(Math.round).join();if(key===airKey)return;airKey=key;air.width=w;air.height=h;
    const g=air.getContext('2d'),im=g.createImageData(w,h),D=im.data,[tl,tr]=AIR.ink,ink=getComputedStyle(hero).getPropertyValue('--hero-rgb').split(',').map(Number),
      x0=a.X+95*a.z,xk=a.X+AIR.keep*a.z,xg=a.X+AIR.give*a.z,vt=Math.max(1,a.textR);
    // (the ink at x: from l at the window's edge to r at the copy's right edge R, then easing to none 240px past it, or by the
    // still's soft edge; over the lede and the buttons, and over the survey note, it runs deeper, to their own right edges)
    const ramp=(x,l,r,R)=>{const U=Math.max(R+240,x0);if(x<R)return l+(r-l)*x/R;const q=Math.min(1,Math.max(0,(U-x)/(U-R)));return r*q*q*(3-2*q)};
    for(let j=0;j<h;j++){const r=j*3,y=(j+.5)*4,bands=[];
      for(const [b0,b1,R,bl,br,F] of a.lb){let e=Math.min(1,Math.max(0,1-Math.max(b0-y,y-b1)/F));if(e>0)bands.push([e*e*(3-2*e),Math.max(vt,R),bl,br])}
      for(let i=0;i<w;i++){const x=(i+.5)*4,m=Math.min(1,Math.max(0,(x0-x)/(x0*.55))),u=Math.min(1,Math.max(0,(x-xk)/(xg-xk))),o=(j*w+i)*4;let t=ramp(x,tl,tr,vt);
        for(const [e,R,bl,br] of bands)t=Math.max(t,e*ramp(x,bl,br,R));
        // (and nowhere in the air less than a little ink, until the photograph takes over: its haze stays a tone of the
        // ink rather than a pale cloud between the copy and the picture)
        t=Math.max(t,AIR.veil*(1-u*u*(3-2*u)));
        for(let ch=0;ch<3;ch++)D[o+ch]=(near[r+ch]*(1-m)+far[r+ch]*m)*(1-t)+(ink[ch]||0)*t;D[o+3]=(1-u*u*(3-2*u))*255}}
    g.putImageData(im,0,0)};
  const frameHero=()=>{framed=true;const v=heroView(),narrow=stacked();heroM.o.labelSize=Math.round(Math.min(16,Math.max(13,innerWidth/160)));
    // the drawing is named while it builds, beside the copy; under the photograph on a phone, where it runs the full
    // width, there is no margin for a ruler, so the tower there draws unnamed as it always has
    heroM.o.labels=heroM.o.guides=!(photo&&narrow);Object.assign(heroM.o,{dist:v.dist,ty:v.ty,scale:v.scale,offsetX:v.offsetX});heroM.phi=v.phi;
    // on a phone the crown stays below the survey note and the tower stands clear of the headline
    const wrap=hero.querySelector('.wrap'),at=e=>{let t=0;for(;e&&e!==hero;e=e.offsetParent)t+=e.offsetTop;return t};
    if(narrow){const up=!side(),note=document.querySelector('.hero .coords'),c=heroM.c.getBoundingClientRect(),nb=note&&note.offsetParent?note.getBoundingClientRect().bottom-c.top:64;
      // on a short phone held upright the fold never cuts through the first button: if a little closing up (24px at most)
      // shows it whole, the copy closes up under the drawing; if not, the copy steps down so the button starts under the fold
      // (the photograph is framed first: the copy starts under its podium)
      hero.style.removeProperty('--rise');if(photo)framePhoto(v,true,nb);
      const btn=up&&wrap.querySelector('.row .btn');if(btn){const t=hero.offsetTop+at(btn),need=Math.ceil(t+btn.offsetHeight-(innerHeight-14));if(t<innerHeight&&need>0)hero.style.setProperty('--rise',(need<=24?need:-Math.ceil(innerHeight-t))+'px')}
      // the copy placed, the photograph runs on past the podium as far as the headline allows (the near bay, on a taller
      // phone), fading into the ink over its last 48px, just above the headline's first line; the paper's grain lies
      // under that fade, never on the picture
      if(plateAt){const{Y,z}=plateAt,ht=at(wrap.querySelector('h1'))-at(heroM.c),m2=Math.round(Math.max(Y+ST.podium*z,Math.min(Y+ST.foot*z,ht+8)-48));
        heroM.c.style.setProperty('--m2',m2+'px');heroM.c.style.setProperty('--m3',m2+48+'px');hero.style.setProperty('--plate-show',Math.round(at(heroM.c)+m2+48)+'px')}
      // and the drawing's ground stays 28px above the headline, so the podium and its hatch never touch the type; the crown
      // stands 14px under the caption, or 10px under the sun line where that closes the note (its line has no descenders)
      const h1=up&&wrap.querySelector('h1'),gb=h1?Math.max(c.height*.22,c.height-(at(h1)-28)):c.height*.22;
      const top=nb+(sunline&&sunline.offsetParent?10:14);
      if(!photo){const f=heroM.fit(heroCam.th,v.phi,{margin:[top,0,gb,0],vOnly:true,maxScale:v.scale});heroM.o.ty=f.ty;heroM.o.scale=f.scale}
      // upright, the tower and its ruler stand as one group on the screen's centre line
      if(up&&!photo){const b=heroM.fit(heroCam.th,v.phi,{measure:true});heroM.o.offsetX+=(heroM.w/2-(b.x0+b.x1)/2)/heroM.w}}
    // and the level ruler's labels end where the page's column does, under the header's last button: the tower moves
    // left as far as the headline allows, then draws smaller, keeping its left edge (a tablet held upright, whose width
    // sizes the tower, needs the most). Where the column leaves a wide margin beside it, the tower gives up no more than
    // a fifth of its size for that, and past it only keeps off the screen's edge. The sun's path ends on the labels' line.
    if(photo&&!narrow)framePhoto(v,false);
    const W=heroM.w,col=wrap.offsetLeft+wrap.offsetWidth-parseFloat(getComputedStyle(wrap).paddingRight),box=()=>heroM.fit(heroCam.th,v.phi,{measure:true});
    const textR=narrow&&!side()?-1e9:Math.max(...[...hero.querySelectorAll('h1,.lede,.row .btn,.row .write')].map(e=>e.getBoundingClientRect().right))+64;let b=box();
    if(!photo)for(const [edge,floor] of [[Math.min(W-18,col),W-col>100?.8:.55],[W-18,.55]]){let over=b.x1-edge;if(over<=.5)continue;
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
  // the drawing is seen building only where the curtain parts on it: a first visit, on a wide screen, with motion on
  if(photo&&!reduce&&window.CentamontIntro&&!matchMedia('(max-width:820px)').matches)settle=0;
  if(Model){
    // (the drawing's resize observer frames it in its first frame, before it draws; an engine without one frames it now)
    heroM=make('heroModel',{turn:photo&&Model.stills[photo].turn||0,real3d:true,order:'top',orbit:heroCam.orbit,orbitIdle:heroCam.idle,hatch:heroCam.hatch,rate:34,slow:2,soldRate:60,cascadeK:4,theta:heroCam.th,labels:true,dimSide:1,palms:false,guides:true,sunPath:true,onResize:()=>{narrow=mq.matches;frameHero()}});
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
    // (only beside the headline: a window narrowed to the phone layout puts the tower above it, and the loupe goes; and
    // only over the drawing: the photograph has no structure to show behind its glass)
    if(heroEl&&!photo&&matchMedia('(hover:hover) and (pointer:fine)').matches){
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
  // The photograph stands full bleed on the hero's ink (home.css, .hero.plated): the veil and the canvas's own fades,
  // which framePhoto() places, take its soft edges, so nothing is cut square.
  if(heroM&&photo)hero.classList.add('plated');
  // the camera settles onto the photograph's framing once the building stands (see SET), and the drawing's names go out
  // with the ruler as the photograph comes in
  if(heroM&&photo&&settle<1){const was=heroM.o.onFrame;heroM.o.onFrame=m=>{if(was)was(m);
    if(settle>=1||!phTgt)return;
    if(!(m.L>=34-1e-6&&m.G>=1&&m.occ>=1))return;
    const now=performance.now();if(!settleAt)settleAt=now;
    settle=Math.min(1,(now-settleAt)/SET.ms);settleTo();m.touch()}}
  // and once it stands whole, the air beside it (see airPaint) comes in as the veil it replaces goes (home.css, .aired)
  if(heroM&&photo){const was=heroM.o.onFrame;heroM.o.onFrame=m=>{if(was)was(m);const on=m.sa>=1&&!!airAt;if(on&&!airRows){try{airRows=airRead(airAt)}catch(e){airAt=null}airPaint()}hero.classList.toggle('aired',on&&!!airRows)}}
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
  const story=()=>{if(towerM||!Model)return;
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
