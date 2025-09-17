// جلوگیری از اسکرول موس و تاچ
(function preventScroll() {
  const block = e => { e.preventDefault(); e.stopPropagation(); return false; };
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('touchmove', block, { passive: false });
  document.body.style.overflow = 'hidden';
})();

// عناصر
const tabs = document.querySelectorAll('.tab');
const scenes = {
  galaxy: document.getElementById('scene-galaxy'),
  dna: document.getElementById('scene-dna'),
  atom: document.getElementById('scene-atom'),
  grid: document.getElementById('scene-grid'),
  carousel: document.getElementById('scene-carousel'),
  timeline: document.getElementById('scene-timeline'),
};
let activeScene = 'galaxy';

// تم روز/شب
const toggleTheme = document.getElementById('toggleTheme');
toggleTheme.addEventListener('click', () => {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', light ? 'dark' : 'light');
});

// نورافکن موس + پارالاکس + مگنت
(function interactions() {
  const spotlight = document.getElementById('spotlight');
  const magnets = document.querySelectorAll('[data-magnet]');
  const parallaxNodes = document.querySelectorAll('[data-parallax]');
  window.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
    // پارالاکس
    parallaxNodes.forEach(el => {
      const d = parseFloat(el.getAttribute('depth') || el.dataset.depth || 0.2);
      const x = (e.clientX / window.innerWidth - 0.5) * 2 * d * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 2 * d * 10;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    // مگنت
    magnets.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.9) btn.style.transform = `translate(${dx * 10}px, ${dy * 10}px)`;
      else btn.style.transform = '';
    });
  });
})();

// ریپل کلیکی + نمایش فکت تصادفی
const rippleLayer = document.getElementById('rippleLayer');
function ripple(x, y) {
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  rippleLayer.appendChild(s);
  setTimeout(() => s.remove(), 600);
}
window.addEventListener('click', (e) => {
  ripple(e.clientX, e.clientY);
});

// تایپینگ
function typeTo(el, text, speed=18) {
  el.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text.charAt(i++);
    if (i >= text.length) clearInterval(timer);
  }, speed);
}

// داده‌ها
const FACTS = Array.isArray(window.__FACTS__) ? window.__FACTS__ : [
  'نور با سرعت حدود 300,000 کیلومتر بر ثانیه حرکت می‌کند.',
  'DNA انسان حدود 3 میلیارد جفت‌باز دارد.',
  'خورشید 99.86٪ از جرم منظومه شمسی را تشکیل می‌دهد.',
];

// دکمه فکت تصادفی + Space
const randomBtn = document.getElementById('randomFact');
randomBtn.addEventListener('click', showRandomFact);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); showRandomFact(); }
});
function showRandomFact() {
  const pick = FACTS[Math.floor(Math.random() * FACTS.length)];
  const map = {
    galaxy: document.getElementById('typedGalaxy'),
    dna: document.getElementById('typedDNA'),
    atom: document.getElementById('typedAtom')
  };
  if (map[activeScene]) typeTo(map[activeScene], pick);
}

// ناوبری صحنه‌ها با تب‌ها و اعداد
tabs.forEach(t => t.addEventListener('click', () => activateScene(t.dataset.scene)));
window.addEventListener('keydown', (e) => {
  const keyMap = { Digit1:'galaxy', Digit2:'dna', Digit3:'atom', Digit4:'grid', Digit5:'carousel', Digit6:'timeline' };
  if (keyMap[e.code]) activateScene(keyMap[e.code]);
});
function activateScene(name) {
  activeScene = name;
  Object.values(scenes).forEach(s => s.classList.remove('show'));
  document.getElementById(`scene-${name}`).classList.add('show');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.scene === name));
}

// Tilt سه‌بعدی روی کارت‌ها
(function tilt3d() {
  const nodes = document.querySelectorAll('.tilt3d');
  nodes.forEach(node => {
    node.addEventListener('mousemove', (e) => {
      const r = node.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -12;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
      node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    node.addEventListener('mouseleave', () => node.style.transform = '');
  });
})();

// Flip با کیبورد
document.querySelectorAll('.card3d.flip').forEach(card => {
  card.addEventListener('keyup', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') card.classList.toggle('hover');
  });
});

// کاروسل 3D
(function carousel3d() {
  const root = document.querySelector('.carousel3d');
  if (!root) return;
  const items = Array.from(root.querySelectorAll('.carousel-item'));
  const N = items.length;
  let angle = 0;
  function layout() {
    const radius = 420;
    items.forEach((el, i) => {
      const a = (360 / N) * i + angle;
      const rad = a * Math.PI / 180;
      const x = Math.sin(rad) * radius;
      const z = Math.cos(rad) * radius;
      el.style.transform = `translate3d(${x}px, -10px, ${-z}px) rotateY(${a}deg)`;
      el.style.zIndex = Math.round(1000 - z);
      el.style.filter = `brightness(${1 + (z/600)})`;
    });
  }
  layout();
  document.getElementById('prev').addEventListener('click', () => { angle -= 360/N; layout(); });
  document.getElementById('next').addEventListener('click', () => { angle += 360/N; layout(); });
  window.addEventListener('keydown', (e) => {
    if (activeScene !== 'carousel') return;
    if (e.code === 'ArrowLeft') { angle -= 360/N; layout(); }
    if (e.code === 'ArrowRight') { angle += 360/N; layout(); }
  });
})();

// بوم ستاره‌ها
(function stars() {
  const c = document.getElementById('bg-stars');
  const ctx = c.getContext('2d');
  let W, H, stars = [];
  function resize() {
    W = c.width = innerWidth; H = c.height = innerHeight;
    stars = Array.from({length: Math.min(350, Math.floor(W*H/4000))}, () => ({
      x: Math.random()*W, y: Math.random()*H, s: Math.random()*1.2+0.2, v: Math.random()*0.2+0.05
    }));
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    stars.forEach(st => {
      st.x += st.v; if (st.x > W) st.x = 0;
      ctx.globalAlpha = st.s;
      ctx.fillRect(st.x, st.y, 1.2, 1.2);
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();

  // toggle
  document.getElementById('toggleStars').addEventListener('click', () => {
    c.style.display = (c.style.display === 'none') ? 'block' : 'none';
  });
})();

// بوم ذرات واکنشی
(function particles() {
  const c = document.getElementById('bg-particles');
  const ctx = c.getContext('2d');
  let W, H, pts = [];
  function resize() {
    W = c.width = innerWidth; H = c.height = innerHeight;
    pts = Array.from({length: Math.min(120, Math.floor(W/12))}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6,
      r: Math.random()*2+1
    }));
  }
  let mx = -9999, my = -9999;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function draw() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      // جذب/دفع با موس
      const dx = p.x - mx, dy = p.y - my;
      const d2 = dx*dx + dy*dy;
      if (d2 < 180*180) {
        const f = -0.08 / Math.max(60, d2);
        p.vx += f * dx * 180;
        p.vy += f * dy * 180;
      }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.99; p.vy *= 0.99;
      if (p.x<0||p.x>W) p.vx*=-1;
      if (p.y<0||p.y>H) p.vy*=-1;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(106,224,255,0.8)';
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });
    // خطوط
    for (let i=0;i<pts.length;i++) {
      for (let j=i+1;j<pts.length;j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d2 = dx*dx+dy*dy;
        if (d2 < 140*140) {
          ctx.strokeStyle = `rgba(176,132,255,${1 - d2/(140*140)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();

  document.getElementById('toggleParticles').addEventListener('click', () => {
    c.style.display = (c.style.display === 'none') ? 'block' : 'none';
  });
})();

// ماتریکس
(function matrix() {
  const canvas = document.getElementById('bg-matrix');
  const ctx = canvas.getContext('2d');
  let W, H, columns, drops, chars;
  function setup() {
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    columns = Math.floor(W / 14);
    drops = Array(columns).fill(1);
    chars = '01⚛🧬🧪∑πΩλΦΨ'.split('');
  }
  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#0ff';
    ctx.font = '14px monospace';
    for (let i=0;i<drops.length;i++) {
      const text = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(text, i*14, drops[i]*14);
      if (drops[i]*14 > H && Math.random()>0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  setup();
  draw();
  window.addEventListener('resize', setup);
  const btn = document.getElementById('toggleMatrix');
  btn.addEventListener('click', () => {
    canvas.style.display = (canvas.style.display === 'none') ? 'block' : 'none';
  });
})();

// هولوگرام
(function hologram() {
  const layer = document.getElementById('hologram-scan');
  document.getElementById('toggleHologram').addEventListener('click', () => {
    const on = layer.style.opacity !== '1';
    layer.style.opacity = on ? '1' : '0';
    document.querySelectorAll('.fact-card').forEach(el => el.classList.toggle('holo', on));
  });
})();

// کلیک = نمایش فکت در صحنه فعال
document.addEventListener('click', () => showRandomFact(), { capture: true });

// دسترسی‌پذیری: جلوگیری از فوکوس‌حلقه بد
document.addEventListener('keydown', e => e.key === 'Tab' && document.body.classList.add('kbd'));
document.addEventListener('mousedown', () => document.body.classList.remove('kbd'));
