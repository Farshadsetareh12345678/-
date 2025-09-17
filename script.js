// جلوگیری کامل از اسکرول موس و تاچ
(function preventScroll(){
  const block = e => { e.preventDefault(); e.stopPropagation(); return false; };
  window.addEventListener('wheel', block, {passive:false});
  window.addEventListener('touchmove', block, {passive:false});
  document.body.style.overflow = 'hidden';
})();

// تم روز/شب
document.getElementById('toggleTheme').addEventListener('click', ()=>{
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', light ? 'dark':'light');
});

// نورافکن + پارالاکس + مگنت لطیف
const spotlight = document.getElementById('spotlight');
window.addEventListener('mousemove', (e)=>{
  document.documentElement.style.setProperty('--mx', e.clientX + 'px');
  document.documentElement.style.setProperty('--my', e.clientY + 'px');

  // پارالاکس
  document.querySelectorAll('[data-parallax]').forEach(el=>{
    const d = parseFloat(el.getAttribute('data-parallax')) || 0.2;
    const x = (e.clientX / innerWidth - .5) * 2 * d * 10;
    const y = (e.clientY / innerHeight - .5) * 2 * d * 10;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
});

// ریپل کلیکی
const rippleLayer = document.getElementById('rippleLayer');
window.addEventListener('click', (e)=>{
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.left = e.clientX + 'px';
  s.style.top  = e.clientY + 'px';
  rippleLayer.appendChild(s);
  setTimeout(()=>s.remove(), 700);
}, {capture:true});

// تایپینگ
function typeTo(el, text, speed=18){
  el.textContent = '';
  let i=0; const t = setInterval(()=>{
    el.textContent += text.charAt(i++);
    if(i>=text.length) clearInterval(t);
  }, speed);
}

// داده‌ها
const FACTS = Array.isArray(window.__FACTS__) ? window.__FACTS__ : [];
let idx = 0;
const typedEl = document.getElementById('typed');
function showIndex(i){
  idx = (i + FACTS.length) % FACTS.length;
  typeTo(typedEl, FACTS[idx]);
}
function randomFact(){
  const r = Math.floor(Math.random()*FACTS.length);
  showIndex(r);
}

// کنترل‌ها
document.getElementById('btnRandom').addEventListener('click', randomFact);
document.getElementById('prev').addEventListener('click', ()=>showIndex(idx-1));
document.getElementById('next').addEventListener('click', ()=>showIndex(idx+1));
window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){ e.preventDefault(); randomFact(); }
  if(e.code === 'ArrowLeft') showIndex(idx-1);
  if(e.code === 'ArrowRight') showIndex(idx+1);
});

// شروع
showIndex(0);

// Tilt 3D نرم
(function tilt3d(){
  const nodes = document.querySelectorAll('.tilt3d');
  nodes.forEach(node=>{
    node.addEventListener('mousemove', (e)=>{
      const r = node.getBoundingClientRect();
      const rx = ((e.clientY - r.top)/r.height - .5) * -12;
      const ry = ((e.clientX - r.left)/r.width - .5) * 12;
      node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    node.addEventListener('mouseleave', ()=> node.style.transform = '');
  });
})();

// Flip کارت‌ها با کیبورد
document.querySelectorAll('.card3d.flip').forEach(card=>{
  card.addEventListener('keyup', (e)=>{
    if(e.code==='Enter' || e.code==='Space') card.classList.toggle('hover');
  });
});

// ستاره‌ها
(function stars(){
  const c = document.getElementById('bg-stars');
  const ctx = c.getContext('2d');
  let W,H,stars=[];
  function resize(){
    W = c.width = innerWidth; H = c.height = innerHeight;
    stars = Array.from({length: Math.min(350, Math.floor(W*H/4000))}, _=>({
      x: Math.random()*W, y: Math.random()*H, s: Math.random()*1.2+.2, v: Math.random()*0.2+.05
    }));
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    stars.forEach(st=>{
      st.x += st.v; if(st.x>W) st.x=0;
      ctx.globalAlpha = st.s;
      ctx.fillRect(st.x, st.y, 1.2, 1.2);
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
  document.getElementById('toggleStars').addEventListener('click', ()=>{
    c.style.display = (c.style.display==='none') ? 'block' : 'none';
  });
})();

// ذرات
(function particles(){
  const c = document.getElementById('bg-particles');
  const ctx = c.getContext('2d');
  let W,H,pts=[];
  function resize(){
    W = c.width = innerWidth; H = c.height = innerHeight;
    pts = Array.from({length: Math.min(120, Math.floor(W/12))}, _=>({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6,
      r: Math.random()*2+1
    }));
  }
  let mx=-9999, my=-9999;
  window.addEventListener('mousemove',(e)=>{mx=e.clientX; my=e.clientY;});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      const dx=p.x-mx, dy=p.y-my; const d2=dx*dx+dy*dy;
      if(d2<180*180){ const f=-0.08/Math.max(60,d2); p.vx+=f*dx*180; p.vy+=f*dy*180; }
      p.x+=p.vx; p.y+=p.vy; p.vx*=0.99; p.vy*=0.99;
      if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;

      ctx.beginPath(); ctx.fillStyle='rgba(106,224,255,0.85)'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d2=dx*dx+dy*dy;
        if(d2<140*140){
          ctx.strokeStyle=`rgba(176,132,255,${1 - d2/(140*140)})`;
          ctx.lineWidth=.6; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
  document.getElementById('toggleParticles').addEventListener('click', ()=>{
    c.style.display = (c.style.display==='none') ? 'block' : 'none';
  });
})();

// هولوگرام
document.getElementById('toggleHolo').addEventListener('click', ()=>{
  const layer = document.getElementById('holo');
  const on = layer.style.opacity !== '1';
  layer.style.opacity = on ? '1' : '0';
  document.querySelectorAll('.holoable').forEach(el=>{
    el.style.boxShadow = on ? '0 0 20px rgba(0,255,255,0.35), inset 0 0 18px rgba(176,132,255,0.25)' : '';
  });
});
