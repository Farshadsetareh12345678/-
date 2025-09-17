// =============== Custom cursor ===============
const cursor = document.querySelector('.cursor');
const cursorOutline = document.querySelector('.cursor-outline');
let cx = -100, cy = -100, tx = -100, ty = -100;

window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
function raf(){
  cx += (tx - cx) * 0.2;
  cy += (ty - cy) * 0.2;
  cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  cursorOutline.style.transform = `translate(${cx}px, ${cy}px)`;
  requestAnimationFrame(raf);
}
raf();

// =============== Magnetic spring ===============
const magnets = document.querySelectorAll('[data-magnet]');
magnets.forEach(el=>{
  let vx=0, vy=0, x=0, y=0, rect;
  const k = 0.08, damp = 0.75, range = 22;
  const loop = ()=>{
    vx*=damp; vy*=damp; x+=vx; y+=vy;
    el.style.transform=`translate(${x}px,${y}px)`;
    requestAnimationFrame(loop);
  }; loop();
  el.addEventListener('mouseenter',()=>{ rect = el.getBoundingClientRect(); cursorOutline.style.width='56px'; cursorOutline.style.height='56px'; });
  el.addEventListener('mouseleave',()=>{ vx=vy=0; x=y=0; el.style.transform=''; cursorOutline.style.width='36px'; cursorOutline.style.height='36px'; });
  el.addEventListener('mousemove',(e)=>{
    if(!rect) rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width/2))/range;
    const dy = (e.clientY - (rect.top + rect.height/2))/range;
    vx += (dx - x) * k * 2;
    vy += (dy - y) * k * 2;
  });
});

// =============== Parallax (scroll + mouse) ===============
const parallaxItems = document.querySelectorAll('[data-parallax]');
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e)=>{
  mouseX = (e.clientX / window.innerWidth - 0.5);
  mouseY = (e.clientY / window.innerHeight - 0.5);
});
function parallaxRAF(){
  parallaxItems.forEach(el=>{
    const speed = parseFloat(el.dataset.speed || 0.1);
    const mtx = mouseX * speed * 30;
    const mty = mouseY * speed * 30;
    const y = (window.scrollY || window.pageYOffset) * speed * 0.3;
    el.style.transform = `translate3d(${mtx}px, ${mty + y}px, 0)`;
  });
  requestAnimationFrame(parallaxRAF);
}
parallaxRAF();

// =============== Intersection Observer: reveal ===============
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.setAttribute('data-visible','true');
      io.unobserve(entry.target);
    }
  });
},{ threshold: 0.2 });
document.querySelectorAll('[data-io], .poem-card').forEach(el=> io.observe(el));

// =============== Card tilt ===============
document.querySelectorAll('.parallax-tilt').forEach(el=>{
  let b; el.addEventListener('mouseenter', ()=> b = el.getBoundingClientRect());
  el.addEventListener('mousemove', (e)=>{
    const rx = (e.clientY - (b.top + b.height/2)) / b.height;
    const ry = (e.clientX - (b.left + b.width/2)) / b.width;
    el.style.transform = `perspective(700px) rotateX(${ -rx * 6 }deg) rotateY(${ ry * 6 }deg)`;
  });
  el.addEventListener('mouseleave', ()=> el.style.transform = '');
});

// =============== Title split + stagger reveal ===============
const splitTitle = document.querySelector('[data-split]');
if(splitTitle){
  const wordsRaw = splitTitle.textContent.trim().split(/\s+/);
  splitTitle.innerHTML = wordsRaw.map(w=>`<span class="w"><span>${w}</span></span>`).join(' ');
  const words = splitTitle.querySelectorAll('.w');
  words.forEach((w,i)=>{
    w.style.display='inline-block';
    w.style.overflow='hidden';
    const inner = w.firstElementChild;
    inner.style.display='inline-block';
    inner.style.transform='translateY(120%)';
    inner.style.transition=`transform .7s cubic-bezier(.17,.84,.44,1) ${i*40}ms`;
  });
  window.addEventListener('load', ()=> words.forEach(w=> w.firstElementChild.style.transform='translateY(0)'));
}

// =============== Prism intensity on scroll ===============
const title = document.querySelector('.title');
if(title){
  window.addEventListener('scroll', ()=>{
    const t = Math.min(1, window.scrollY/400);
    title.style.textShadow = `${t*1.5}px 0 0 rgba(255,0,90,${0.35*t}), ${-t*1.5}px 0 0 rgba(0,180,255,${0.35*t})`;
  }, {passive:true});
}

// =============== Scroll Telegraph ===============
const thumb = document.querySelector('.telegraph-thumb');
const prog = document.getElementById('progress');
const chapter = document.getElementById('chapter');
const sections = [...document.querySelectorAll('main section')];

function updateTelegraph(){
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = Math.max(0, Math.min(1, scrollY / max));
  if(thumb) thumb.style.transform = `translateY(${p * 84}%)`;
  if(prog) prog.textContent = `${Math.round(p*100)}%`;
  // active chapter
  const current = sections.reduce((a,s)=> (scrollY >= s.offsetTop-140 ? s : a), sections[0]);
  const stitle = current?.querySelector('.section-title, .seq-title')?.textContent?.trim() || 'آغاز';
  if(chapter) chapter.textContent = stitle;
}
window.addEventListener('scroll', updateTelegraph, {passive:true});
window.addEventListener('load', updateTelegraph);

// =============== Cinematic sequence depth ===============
const seqBg = document.querySelectorAll('.seq-bg');
function seqRAF(){
  seqBg.forEach(bg=>{
    const r = bg.parentElement.getBoundingClientRect();
    const t = 1 - Math.abs((r.top + r.height/2 - innerHeight/2) / (innerHeight/2));
    bg.style.transform = `scale(${1 + t*0.08}) translateY(${(1-t)*-20}px)`;
    bg.style.filter = `saturate(${1 + t*0.3}) blur(${(1-t)*6}px)`;
  });
  requestAnimationFrame(seqRAF);
}
seqRAF();

// =============== Dynamic marquee keywords ===============
const marquee = document.querySelector('.marquee-inner');
if(marquee){
  const keywords = ['نور','هویت','شیشه','پارالاکس','سکوت','شکوه','سایه','طلوع'];
  marquee.innerHTML = new Array(4).fill(0).map(()=> keywords.map(k=> `<span>${k}</span>`).join(' — ')).join(' — ');
}

// =============== Touch gestures for cards ===============
const cards = document.querySelector('.cards');
if(cards){
  let sx=0, dx=0, active=null, pid=null;
  cards.addEventListener('pointerdown', e=>{
    active = e.target.closest('.card'); if(!active) return;
    sx = e.clientX; pid = e.pointerId; active.setPointerCapture(pid);
  });
  cards.addEventListener('pointermove', e=>{
    if(!active || e.pointerId!==pid) return;
    dx = e.clientX - sx;
    active.style.transition='none';
    active.style.transform = `translateX(${dx}px) rotate(${dx/40}deg)`;
    active.style.opacity = 1 - Math.min(.7, Math.abs(dx)/300);
  });
  function end(){
    if(!active) return;
    active.style.transition='.35s';
    if(Math.abs(dx) > 160){
      active.style.transform=`translateX(${dx>0? 500:-500}px) rotate(${dx/30}deg)`;
      active.style.opacity=0; setTimeout(()=> active.remove(), 350);
    } else {
      active.style.transform=''; active.style.opacity='';
    }
    active = null; dx = 0;
  }
  cards.addEventListener('pointerup', end);
  cards.addEventListener('pointercancel', end);
}

// =============== Theme presets ===============
const themes = {
  aurora: {'--accent':'#8bdcff','--accent-2':'#b38bff','--bg':'#0b0e14'},
  saffron: {'--accent':'#ffb300','--accent-2':'#ff5e7e','--bg':'#0c0a08'},
  emerald: {'--accent':'#34e4a8','--accent-2':'#9c6bff','--bg':'#0a1211'}
};
function applyTheme(name){ Object.entries(themes[name]).forEach(([k,v])=> document.documentElement.style.setProperty(k,v)); }

// =============== Theme toggle (light/dark + presets hook) ===============
const toggle = document.querySelector('[data-theme-toggle]');
if(toggle){
  toggle.addEventListener('click', ()=>{
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    toggle.textContent = `تم: ${isLight ? 'شب' : 'روز'}`;
    toggle.setAttribute('aria-pressed', String(!isLight));
  });
}

// =============== Ambient sound (very subtle) ===============
const soundBtn = document.getElementById('sound');
let ctx, node, gain;
if(soundBtn){
  soundBtn.addEventListener('click', async ()=>{
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      gain = ctx.createGain(); gain.gain.value = 0.02; // very subtle
      node = new OscillatorNode(ctx, {type:'sine', frequency: 180});
      const lfo = new OscillatorNode(ctx, {type:'sine', frequency: 0.08});
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 20;
      lfo.connect(lfoGain).connect(node.frequency);
      node.connect(gain).connect(ctx.destination);
      node.start(); lfo.start();
      soundBtn.textContent = 'صوت: روشن';
      soundBtn.setAttribute('aria-pressed','true');
    }else{
      if(ctx.state === 'running'){ await ctx.suspend(); soundBtn.textContent='صوت: خاموش'; soundBtn.setAttribute('aria-pressed','false'); }
      else { await ctx.resume(); soundBtn.textContent='صوت: روشن'; soundBtn.setAttribute('aria-pressed','true'); }
    }
  });
}

// =============== Respect reduced motion ===============
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('.marquee-inner').forEach(m=> m.style.animation = 'none');
  // soften parallax by zeroing speed
  parallaxItems.forEach(el=> el.dataset.speed = 0);
}
