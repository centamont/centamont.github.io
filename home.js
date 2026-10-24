// © Centamont. Not open source: centamont.com/terms.html. Built from _src/home.js by tools/version.py: edit the source, not this file.
document.addEventListener('DOMContentLoaded',function(){
const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
setTimeout(()=>{root.classList.remove('intro-on');try{startHero()}catch(e){const h=document.getElementById('top');if(h)h.classList.add('lit')}},4000);
const header=document.querySelector('header.site'),nav=document.getElementById('mainNav');
const links=[...nav.querySelectorAll('a')];
const navIO=new IntersectionObserver(es=>es.forEach(e=>{
if(!e.isIntersecting)return;
links.forEach(a=>a.getAttribute('href')==='#'+e.target.id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));
}),{rootMargin:'-45% 0px -54% 0px'});
document.querySelectorAll('main > section[id]').forEach(s=>navIO.observe(s));
new IntersectionObserver(es=>{if(es[0].isIntersecting)links.forEach(a=>a.removeAttribute('aria-current'))},{rootMargin:'0px 0px -60% 0px'}).observe(document.getElementById('top'));
const hero=document.getElementById('top');
const atTop=()=>header.classList.toggle('top',scrollY<8);addEventListener('scroll',atTop,{passive:true});atTop();
const later=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:1000}):setTimeout(f,1);
const onMQ=(m,f)=>m.addEventListener?m.addEventListener('change',f):m.addListener(f);
const clock=document.getElementById('clock'),lang=document.documentElement.lang;
const [locale,pts,sunUp,sunAt,sunDown]=lang==='es'?['es-US',['N','NE','E','SE','S','SO','O','NO'],'Sol a ','° de altura, ','Sol bajo el horizonte']
:lang==='pt-BR'?['pt-BR',['N','NE','L','SE','S','SO','O','NO'],'Sol a ','° de altura, ','Sol abaixo do horizonte']
:['en-US',['N','NE','E','SE','S','SW','W','NW'],'Sun ','° up, ','Sun below the horizon'];
const sunline=document.getElementById('sunline');
const sunNote=d=>{if(window.CentamontSun&&sunline){const s=CentamontSun(d);sunline.textContent=s.el>0?sunUp+Math.round(s.el)+sunAt+pts[Math.round(s.az/45)%8]:sunDown}};
sunNote();
const tick=()=>{const d=heroM&&heroM.sunT!=null?new Date(heroM.sunT):new Date();sunNote(d);if(!clock||!clock.offsetParent)return;try{clock.textContent=new Intl.DateTimeFormat(locale,{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(d)}catch(e){}};
setInterval(tick,30000);
const Model=window.CentamontModel,models=[];
let heroM=null,towerM=null;
const mq=matchMedia('(max-width:820px)');let narrow=mq.matches;const note=document.querySelector('.hero .coords');if(window.ResizeObserver&&note)new ResizeObserver(()=>tick()).observe(note);else{onMQ(mq,()=>later(tick));if(narrow)later(tick);else requestAnimationFrame(tick)}
const side=()=>matchMedia('(orientation:landscape) and (max-height:500px)').matches;
let stack=false;
const stacked=()=>{const s=!narrow&&!side()&&parseFloat(getComputedStyle(document.body).fontSize)>=27;if(s!==stack){stack=s;hero.classList.toggle('stack',s)}return narrow||stack};
const heroView=()=>{const mid=matchMedia('(max-width:1180px)').matches,wide=innerWidth>1600;return stacked()&&!side()?(photo?{phi:.13,dist:100,ty:19.7,scale:2,offsetX:.08}:{phi:.1,dist:92,ty:17.5,scale:2,offsetX:.08}):{phi:.13,dist:100,ty:mid&&!photo?21.3:19.7,scale:wide?2.2:2.0,offsetX:wide?.25:mid?.28:.22}};
let heroTy=0,framed=false;
const photo=Model&&Model.stills&&Model.stills[window.__cmStill]?window.__cmStill:null;
const heroCam=(()=>{const o={th:-0.5,orbit:0.0009,idle:0.0003},s=window.CentamontSun&&CentamontSun();if(photo){const th=Model.stills[photo].th;return{th,orbit:0,idle:null,hatch:th*180/Math.PI+180}}if(!s||!(s.night<0.6))return o;
const A=s.az,lo=124,hi=236,left=A-lo>=50,off=Math.min(79.5,left?A-lo:hi-A),idle=Math.max(0.55,Math.min(2,(off-35-17)/14.3))/1e4,S=17+14.3e4*idle;
let eR=left?A-off:A+off,e0=left?eR+S:eR-S;
const sh=Math.max(lo-Math.min(e0,eR),Math.min(0,hi-Math.max(e0,eR)));eR+=sh;e0+=sh;
o.th=((reduce?eR:e0)-180)*Math.PI/180;o.orbit=left?-0.0009:0.0009;o.idle=left?-idle:idle;o.hatch=(e0+eR)/2;return o})();
const frameHero=()=>{framed=true;const v=heroView(),narrow=stacked();heroM.o.labelSize=Math.round(Math.min(16,Math.max(13,innerWidth/160)));Object.assign(heroM.o,{dist:v.dist,ty:v.ty,scale:v.scale,offsetX:v.offsetX});heroM.phi=v.phi;
const wrap=hero.querySelector('.wrap'),at=e=>{let t=0;for(;e&&e!==hero;e=e.offsetParent)t+=e.offsetTop;return t};
if(narrow){const up=!side(),note=document.querySelector('.hero .coords'),c=heroM.c.getBoundingClientRect(),nb=note&&note.offsetParent?note.getBoundingClientRect().bottom-c.top:64;
hero.style.removeProperty('--rise');
const btn=up&&wrap.querySelector('.row .btn');if(btn){const t=hero.offsetTop+at(btn),need=Math.ceil(t+btn.offsetHeight-(innerHeight-14));if(t<innerHeight&&need>0)hero.style.setProperty('--rise',(need<=24?need:-Math.ceil(innerHeight-t))+'px')}
const h1=up&&wrap.querySelector('h1'),gb=h1?Math.max(c.height*.22,c.height-(at(h1)-(photo?18:28))):c.height*.22;
const top=nb+(sunline&&sunline.offsetParent?10:14);
if(photo){let lo=.2,hi=v.scale;for(let i=0;i<24;i++){const s=(lo+hi)/2,b=heroM.fit(heroCam.th,v.phi,{measure:true,ty:v.ty,scale:s});if(b.y0>=top&&b.y1<=c.height-gb)lo=s;else hi=s}heroM.o.ty=v.ty;heroM.o.scale=lo}
else{const f=heroM.fit(heroCam.th,v.phi,{margin:[top,0,gb,0],vOnly:true,maxScale:v.scale});heroM.o.ty=f.ty;heroM.o.scale=f.scale}
if(up){const b=heroM.fit(heroCam.th,v.phi,{measure:true});heroM.o.offsetX+=(heroM.w/2-(b.x0+b.x1)/2)/heroM.w}}
const W=heroM.w,col=wrap.offsetLeft+wrap.offsetWidth-parseFloat(getComputedStyle(wrap).paddingRight),box=()=>heroM.fit(heroCam.th,v.phi,{measure:true});
const textR=narrow&&!side()?-1e9:Math.max(...[...hero.querySelectorAll('h1,.lede,.row .btn,.row .write')].map(e=>e.getBoundingClientRect().right))+64;let b=box();
for(const [edge,floor] of [[Math.min(W-18,col),W-col>100?.8:.55],[W-18,.55]]){let over=b.x1-edge;if(over<=.5)continue;
const sh=Math.min(over,Math.max(0,b.x0-textR));heroM.o.offsetX-=sh/W;over-=sh;
for(let i=0;i<8&&over>.5&&heroM.o.scale>v.scale*floor+1e-6;i++){b=box();heroM.o.scale*=Math.max(floor*v.scale/heroM.o.scale,1-over/(b.x1-b.x0));const b2=box();heroM.o.offsetX+=(b.x0-b2.x0)/W;over=box().x1-edge}
b=box()}
heroM.o.edge=W-Math.min(W-18,Math.max(col,b.x1));
heroM.o.groundLabel=narrow||side();
heroM.o.sunPath=!narrow||side();
heroTy=heroM.o.ty;heroM.o.ty=heroTy+(reduce||photo?0:Math.min(1,scrollY/innerHeight)*9);
if(photo&&!heroM.ph)heroM.photo(photo,'/hero/',true);
heroM.touch()};
const make=(id,o)=>{try{const m=new Model(document.getElementById(id),o);return m.dead?null:m}catch(e){return null}};
if(Model){
heroM=make('heroModel',{turn:photo&&Model.stills[photo].turn||0,real3d:!!photo,order:'top',orbit:heroCam.orbit,orbitIdle:heroCam.idle,hatch:heroCam.hatch,rate:34,slow:2,soldRate:60,cascadeK:4,theta:heroCam.th,labels:true,dimSide:1,palms:false,guides:true,sunPath:true,onResize:()=>{narrow=mq.matches;frameHero()}});
if(heroM){if(!window.ResizeObserver)try{frameHero()}catch(e){}models.push(heroM);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(framed)try{frameHero()}catch(e){}});
if(window.ResizeObserver){let hs='';new ResizeObserver(([e])=>{const r=e.contentRect,k=Math.round(r.width)+'x'+Math.round(r.height);if(k===hs)return;const was=hs;hs=k;if(was&&framed)requestAnimationFrame(()=>{try{frameHero()}catch(e){}})}).observe(hero.querySelector('h1'))}}
}
if(heroM){
if(!reduce&&!photo)addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&scrollY<innerHeight)heroM.pointer(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)},{passive:true});
const heroEl=document.querySelector('.hero');
if(heroEl&&matchMedia('(hover:hover) and (pointer:fine)').matches){
heroEl.addEventListener('pointermove',e=>{const r=heroEl.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
const on=!narrow&&!stack&&x>r.width*.52&&!e.target.closest('a,button,.coords,.scrub'),was=!!heroM.lens;heroM.lens=on?{x,y,r:Math.min(96,r.width*.07)}:null;heroEl.classList.toggle('loupe',on);if(on||was)heroM.touch()},{passive:true});
heroEl.addEventListener('pointerleave',()=>{heroM.lens=null;heroEl.classList.remove('loupe');heroM.touch()});
}
if(heroEl&&!reduce){
const band=document.createElement('div'),coarse=matchMedia('(pointer:coarse)').matches;band.className='scrub';band.setAttribute('aria-hidden','true');
Object.assign(band.style,{position:'absolute',zIndex:'1',display:'none',cursor:'ew-resize',touchAction:'pan-y pinch-zoom'});heroEl.appendChild(band);
const at=e=>{const r=heroM.c.getBoundingClientRect();return heroM.sunAt(e.clientX-r.left)};
let drag=null,bk='',noteT=null;
band.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,on:e.pointerType==='mouse'};if(drag.on){try{band.setPointerCapture(e.pointerId)}catch(_){}heroM.scrub(at(e))}});
band.addEventListener('pointermove',e=>{
if(e.pointerType==='mouse'){heroM.scrub(at(e));return}
if(!drag||drag.id!==e.pointerId)return;
if(!drag.on){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.2)return;drag.on=true;try{band.setPointerCapture(e.pointerId)}catch(_){}}
heroM.scrub(at(e))});
const end=e=>{if(drag&&drag.id===e.pointerId)drag=null;if(e.pointerType!=='mouse'||e.type!=='pointerup')heroM.scrub(null)};
['pointerup','pointercancel','pointerleave'].forEach(t=>band.addEventListener(t,end));
heroM.o.onFrame=m=>{const b=m.sunBox(coarse?12:0),k=b?[b.x0,b.y0,b.x1,b.y1].map(Math.round).join():'';
if(k!==bk){bk=k;if(b)Object.assign(band.style,{display:'block',left:Math.round(b.x0)+'px',top:Math.round(b.y0)+'px',width:Math.round(b.x1-b.x0)+'px',height:Math.round(b.y1-b.y0)+'px'});else band.style.display='none'}
if(m.sunT!==noteT){noteT=m.sunT;tick()}};
}
}
const keyEl=hero.querySelector('.key-sold');
if(heroM&&keyEl){const was=heroM.o.onFrame;let kk='';heroM.o.onFrame=m=>{if(was)was(m);const r=m.rb,on=!!r&&!stacked()&&m.L>33.5,k=on?Math.round(r.x0)+','+Math.round(r.y1):'';if(k===kk)return;kk=k;keyEl.classList.toggle('on',on);if(on){const c=m.c,x=c.offsetLeft+r.x1-3*m.o.labelSize-6;keyEl.style.left=Math.round(Math.min(x,innerWidth-keyEl.offsetWidth-16))+'px';keyEl.style.top=Math.round(c.offsetTop+r.y0-keyEl.offsetHeight-14)+'px'}}}
document.addEventListener('cm-theme',()=>models.forEach(m=>m.colors()));
const intro=window.CentamontIntro;let started=false;
const unveil=()=>{if(!heroM||!photo||reduce)return;const c=heroM.c;c.classList.add('wait');let t=0;const go=()=>{clearTimeout(t);mo.disconnect();c.classList.remove('wait')},mo=new MutationObserver(()=>{if(c.dataset.still)go()});mo.observe(c,{attributes:true,attributeFilter:['data-still']});t=setTimeout(go,1200)};
const startHero=()=>{if(started)return;started=true;if(heroM){heroM.hold(false);if(!intro){unveil();heroM.set(34,23,false,true)}else{heroM.sketch();setTimeout(()=>heroM.set(0,14,false),reduce?0:100);setTimeout(()=>heroM.set(34,23,false),reduce?0:300)}}hero.classList.add('lit')};
if(!intro)root.classList.remove('intro-on');
if(intro&&!intro.open&&root.classList.contains('intro-on')){if(heroM)heroM.hold(true);intro.go=startHero}else startHero();
let covered=false;new MutationObserver(()=>{const o=root.classList.contains('menu-open');if(o===covered)return;covered=o;models.forEach(m=>m.hold(o||(m===heroM&&!started)))}).observe(root,{attributes:true,attributeFilter:['class']});
if(heroM&&!reduce){let q=0,lp=-1,sink=true;const row=hero.querySelector('.wrap .row'),fits=()=>{let rb=row?row.offsetHeight:0;for(let e=row;e&&e!==hero;e=e.offsetParent)rb+=e.offsetTop;sink=!row||.42*Math.max(0,hero.offsetTop+rb-innerHeight)<=.58*(hero.offsetHeight-rb);lp=-1;onScroll()};
const onScroll=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;const p=Math.min(1,scrollY/innerHeight);if(p===lp)return;lp=p;if(!photo){heroM.o.ty=heroTy+p*9;heroM.touch()}hero.style.setProperty('--p',sink?p.toFixed(4):'0')})};
addEventListener('scroll',onScroll,{passive:true});let fw=innerWidth;addEventListener('resize',()=>{if(innerWidth!==fw){fw=innerWidth;fits()}});
if(window.ResizeObserver){new ResizeObserver(fits).observe(hero);onScroll()}else fits()}
const steps=[...document.querySelectorAll('#steps .step')],name=document.getElementById('stageName');
const gauge=document.querySelector('.rise .gauge'),gB=document.getElementById('gB'),gS=document.getElementById('gS'),gM=document.getElementById('gM'),pad=v=>String(v).padStart(2,'0');
const RES=+document.getElementById('gR').textContent.replace('/',''),LIM=.5;
const data=steps.map((s,n)=>({e:n>0,b:+s.dataset.built,s:+s.dataset.sold/2,c:+s.dataset.built>0&&n<steps.length-1}));
data.forEach((d,n)=>{d.rel=n===1||n===2?data[2].s:0});
const VIEWS=[[-0.7,-1.3],[-0.9,0.24],[-0.6,0.19],[-0.38,0.16],[-0.15,0.2],[0.1,0.23]];
const view=n=>{const [th,ph]=VIEWS[n],d=data[n],tight=narrow||towerM.h<360,bl=Math.max(0,gauge.getBoundingClientRect().left-towerM.c.getBoundingClientRect().left);
if(!n)return towerM.fit(th,ph,{plan:true,margin:tight?[12,24,12,24+bl]:[40,40,40,40+bl]});
const m=tight?[14,12,10,12]:[30,22,22,22],v=towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,margin:m});
const b=towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,measure:true,ty:v.ty,scale:v.scale,offsetX:v.offsetX}),need=bl-64-b.x0,room=towerM.w-m[1]-b.x1;
if(need>room)return towerM.fit(th,ph,{built:d.b,crane:d.c,release:d.rel,margin:[m[0],m[1],m[2],bl-64]});
if(need>0)v.offsetX+=need/towerM.w;
return v};
let cur=-1,last=0,reading=false,st={...data[0]};
const motionOff=()=>reduce||root.dataset.motion==='off';
const put=d=>{Object.assign(st,d);if(!towerM)return;
towerM.o.soldRate=Math.max(6,Math.abs(st.s-towerM.S)/.1);towerM.o.rate=Math.max(11,(Math.abs(st.b-towerM.L)+1.1)/.15);
towerM.release(st.rel);towerM.o.envelope=st.e;towerM.set(st.b,st.s,st.c)};
const elev=document.querySelector('.rise .elev');let plate=null;
const plateIn=()=>{if(plate||!elev||!Model||!Model.still)return;const k=Model.still(),f='/hero/plate-'+k;plate=new Image();plate.className='bplate';plate.alt='';plate.decoding='async';plate.dataset.still=k;plate.sizes='(max-width:820px) 46vw, 400px';plate.srcset=f+'-half.webp 593w, '+f+'.webp 1185w';plate.src=f+'-half.webp';elev.appendChild(plate)};
const plateFit=()=>{if(!plate)return;const c=document.getElementById('tower');if(!c)return;plate.style.top=c.offsetTop+'px';plate.style.height=c.offsetHeight+'px'};
const story=()=>{plateIn();if(towerM||!Model)return;
towerM=make('tower',{theta:-0.7,phi:-0.62,dist:40,ty:2.5,scale:1.5,labels:true,palms:false,footprint:true,north:true,planNotes:true,envelope:false,rate:11,slow:1.5,facadeLag:6,restGuides:true,draft:true});
if(!towerM)return;models.push(towerM);
let lb=-1,ls=-1,lf=-1,lm=null,ps=0;
towerM.o.onFrame=m=>{const b=Math.floor(m.L+.02),s=Math.floor(m.S*2+.02),f=Math.min(1,m.S*2/RES),met=m.S*2>=RES*LIM-.001;
if(b!==lb){lb=b;gB.textContent=pad(b)}if(s!==ls){ls=s;gS.textContent=pad(s)}
if(Math.abs(f-lf)>.0005){lf=f;gM.style.transform='scaleX('+f.toFixed(4)+')'}
if(met!==lm){gauge.classList.toggle('met',met);
if(met&&reading&&ps*2<RES*LIM&&lm!==null){gauge.classList.remove('pulse');void gauge.offsetWidth;gauge.classList.add('pulse')}lm=met}
ps=m.S};
towerM.o.onResize=()=>{narrow=mq.matches;vs=null;if(cur===riseN)rise(true);else if(cur>=0)towerM.camTo(view(cur),true)};
towerM.o.envelope=st.e;towerM.set(st.b,st.s,st.c,true);towerM.release(st.rel||0,true);towerM.camTo(view(Math.max(cur,0)),true);if(cur===riseN){vs=null;rise(true)}};
const state=d=>{Object.assign(st,d);gB.textContent=pad(d.b);gS.textContent=pad(d.s*2);gM.style.transform='scaleX('+Math.min(1,d.s*2/RES).toFixed(4)+')';gauge.classList.toggle('met',d.s*2>=RES*LIM)};
const riseN=steps.findIndex(s=>s.hasAttribute('data-rise'));let lr=-1,vs=null;
const lerp=(a,b,t)=>a+(b-a)*t;
const riseAt=()=>{const r=steps[riseN].getBoundingClientRect(),p=Math.min(1,Math.max(0,((innerHeight*(narrow?.63:.5)-r.top)/r.height-.12)/.8));return p*p*(3-2*p)};
const rise=force=>{if(riseN<0||cur!==riseN)return;const e=riseAt();if(!force&&Math.abs(e-lr)<.002)return;lr=e;
const a=data[riseN],b=data[riseN+1],d={e:true,b:Math.round(lerp(a.b,b.b,e)),s:Math.round(lerp(a.s*2,b.s*2,e))/2,c:a.c,rel:0};
if(!towerM){state(d);return}
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
const list=document.getElementById('steps');let er=0;
const ends=()=>{er=0;const r=list.getBoundingClientRect(),y=innerHeight*(narrow?.63:.5);if(r.top>y)stage(0);else if(r.bottom<y)stage(steps.length-1)};
const back=()=>{if(cur<1)return;const y=innerHeight*(narrow?.64:.52),k=steps.findIndex(s=>{const r=s.getBoundingClientRect();return r.top<=y&&r.bottom>y});if(k>=0&&k<cur)stage(k)};
const onS=()=>{ends();back();rise(false)};
addEventListener('scroll',()=>{if(!er)er=requestAnimationFrame(onS)},{passive:true});
watch();onMQ(mq,()=>{narrow=mq.matches;watch()});
const facade=document.querySelector('.facade');
const hair=()=>{const w=facade&&facade.getBoundingClientRect().width;if(w)facade.parentNode.style.setProperty('--fu',(1200/w).toFixed(4))};
if(window.ResizeObserver&&facade)new ResizeObserver(hair).observe(facade);else{hair();addEventListener('resize',hair)}
const chart=document.getElementById('chart'),ov=chart.querySelector('.ov'),sv=chart.querySelector('.sv'),loc=chart.querySelector('.loc'),reach=sv.querySelector('.rch'),fig=chart.querySelector('.map'),NS='http://www.w3.org/2000/svg';
const order=['sf','ny','ladal','more','intl'],groups=order.map(m=>({a:-1,on:null,draw:[],els:[...chart.querySelectorAll('[data-m="'+m+'"]')]}));
const T1=500,K0=180,T2=300,R0=220,T3=400,MS=R0+T3,Q0=560,TR=750,GAP=160,MR=TR+GAP*2,MT=Q0+MR,cl=v=>Math.min(1,Math.max(0,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
let armed=false;const arm=()=>{armed=true;const defs=ov.insertBefore(document.createElementNS(NS,'defs'),ov.firstChild);
chart.querySelectorAll('.arc').forEach((p,k)=>{const mk=defs.appendChild(document.createElementNS(NS,'mask'));mk.id='route'+k;
['maskUnits','userSpaceOnUse','x','-20','y','-100','width','760','height','480'].forEach((v,j,a)=>{if(j%2===0)mk.setAttribute(v,a[j+1])});
const d=mk.appendChild(document.createElementNS(NS,'path'));d.setAttribute('d',p.getAttribute('d'));p.setAttribute('mask','url(#route'+k+')');
const o=mk.appendChild(document.createElementNS(NS,'rect'));['x','y','width','height','transform'].forEach(n=>{if(loc.hasAttribute(n))o.setAttribute(n,loc.getAttribute(n))});
d.style.setProperty('--len',Math.ceil(p.getTotalLength())+'px');groups[order.indexOf(p.dataset.m)].draw.push(d)})};
const wide=matchMedia('(min-width:1200px)'),held={},hold=(k,v)=>{v=v.toFixed(4);if(held[k]!==v){held[k]=v;chart.style.setProperty(k,v)}};
let mraf=0,near=false,tS=0,tR=0;const done=(now,T)=>window.cmHurried&&cmHurried(fig.getBoundingClientRect())?now-T-1:now;
const paint=()=>{mraf=0;if(!armed)arm();const h=innerHeight,now=performance.now(),lb=loc.getBoundingClientRect().bottom,fb=fig.getBoundingClientRect().bottom;let ms=MS,mr=MR,run=false;
if(!reduce){
if(wide.matches){
if(!tS&&lb<h&&fb>64)tS=done(now,MT);ms=tS?now-tS:0;mr=ms-Q0;run=!!tS&&ms<MT}
else{
const rb=reach.getBoundingClientRect().bottom;if(!tS&&rb<h&&fb>64)tS=done(now,MS);ms=tS?now-tS:0;
if(tS&&!tR&&lb<h&&fb>64)tR=done(now,MR)<now?now-MR-1:Math.max(now,tS+Q0);mr=tR?now-tR:-1;run=(!!tS&&ms<MS)||(!!tR&&mr<MR)}}
hold('--c',ease(cl(ms/T1)));hold('--t',ease(cl((ms-K0)/T2)));hold('--r',ease(cl((ms-R0)/T3)));
groups.forEach((g,i)=>{const a=i>1?ease(cl((mr-(i-2)*GAP)/TR)):(ms>=MS?1:0);if(a!==g.a){g.a=a;g.draw.forEach(d=>d.style.setProperty('--a',a.toFixed(4)))}
const on=a>=1;if(on!==g.on){g.on=on;g.els.forEach(e=>e.classList.toggle('landed',on))}});
if(!reduce&&groups[2].on)chart.classList.add('pulse');
if(run)req()};
const req=()=>{if(!mraf)mraf=requestAnimationFrame(paint)};
new IntersectionObserver(es=>{near=es[0].isIntersecting;if(near)req()},{rootMargin:'25% 0px'}).observe(chart);
addEventListener('scroll',()=>{if(near)req()},{passive:true});addEventListener('resize',req);
const unit=()=>{const a=ov.getBoundingClientRect(),b=sv.getBoundingClientRect();if(a.width)ov.style.setProperty('--u',(720/a.width).toFixed(4));if(b.width&&b.height)sv.style.setProperty('--u',Math.min(360/b.width,370/b.height).toFixed(4))};
if(window.ResizeObserver){const ro=new ResizeObserver(unit);ro.observe(ov);ro.observe(sv)}else{unit();addEventListener('resize',unit)}
chart.querySelectorAll('.lv, svg [data-m]').forEach(n=>{n.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')chart.dataset.hl=n.dataset.m});n.addEventListener('pointerleave',()=>delete chart.dataset.hl)});
const inIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');inIO.unobserve(e.target)}}),{threshold:.3});
['chart','cut','ruler'].forEach(id=>inIO.observe(document.getElementById(id)));
});
