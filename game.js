// NostalRunner — Minimal Runner with retro vibes
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const el = (id) => document.getElementById(id);
const ui = {
  score: el('score'),
  combo: el('combo'),
  best: el('best'),
  menu: el('menu'),
  over: el('gameover'),
  final: el('finalScore'),
  start: el('startBtn'),
  restart: el('restartBtn'),
  name: el('playerName')
};

let token = null;
let bestScore = null;

async function fetchToken() {
  const r = await fetch('api.php?action=token');
  const j = await r.json();
  token = j.token || null;
}
async function fetchBest() {
  const r = await fetch('api.php?action=highscore');
  const j = await r.json();
  bestScore = j.highscore ?? null;
  ui.best.textContent = bestScore ? `${j.name} ${j.highscore}` : '—';
}
async function submitScore(name, score) {
  if (!token) return;
  const r = await fetch('api.php?action=submit', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name, score, token })
  });
  const j = await r.json();
  if (j.ok && j.highscore) {
    bestScore = j.highscore;
    ui.best.textContent = `${j.name} ${j.highscore}`;
  }
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a,b) => a + Math.random()*(b-a);
const irand = (a,b) => (a + Math.floor(Math.random()*(b-a+1)));

class Input {
  constructor() {
    this.keys = new Set();
    this.lock = new Set();
    window.addEventListener('keydown', e => {
      const k = mapKey(e.key);
      if (!k) return;
      this.keys.add(k);
      e.preventDefault();
    }, {passive:false});
    window.addEventListener('keyup', e => {
      const k = mapKey(e.key);
      if (!k) return;
      this.keys.delete(k);
      this.lock.delete(k);
      e.preventDefault();
    }, {passive:false});
  }
  once(k) {
    if (this.keys.has(k) && !this.lock.has(k)) {
      this.lock.add(k); return true;
    }
    return false;
  }
}
function mapKey(k) {
  k = k.toLowerCase();
  if (k==='w' || k==='arrowup' || k===' ') return 'jump';
  if (k==='s' || k==='arrowdown') return 'slide';
  if (k==='d' || k==='j') return 'dash';
  if (k==='p' || k==='escape') return 'pause';
  return null;
}

class Player {
  constructor() {
    this.x = 180; this.y = 0;
    this.w = 40; this.h = 48;
    this.ground = H - 120;
    this.vy = 0;
    this.double = true;
    this.slideT = 0;
    this.dashT = 0;
    this.invul = 0;
  }
  reset() {
    this.y = this.ground; this.vy = 0; this.double = true; this.slideT=0; this.dashT=0; this.invul=0;
  }
  get hitbox() {
    const sh = this.isSliding() ? this.h*0.6 : this.h;
    const oy = this.isSliding() ? this.h*0.4 : 0;
    return {x:this.x-16, y:this.y - sh + oy, w:this.w-8, h:sh-4};
  }
  jump() {
    if (this.onGround()) {
      this.vy = -13; this.double = true; sfx(220, 0.05);
    } else if (this.double) {
      this.vy = -12; this.double = false; sfx(330, 0.05);
    }
  }
  slide() {
    if (this.onGround()) this.slideT = 0.35;
  }
  dash() {
    if (this.dashT<=0) { this.dashT = 0.28; this.invul = 0.3; sfx(120, 0.06); }
  }
  onGround() { return this.y >= this.ground - 0.01; }
  isSliding() { return this.slideT>0; }
  isDashing() { return this.dashT>0; }
  update(dt) {
    this.slideT = Math.max(0, this.slideT - dt);
    this.dashT = Math.max(0, this.dashT - dt);
    this.invul  = Math.max(0, this.invul - dt);

    // gravity
    this.vy += 28*dt;
    this.y += this.vy;
    if (this.y > this.ground) { this.y = this.ground; this.vy = 0; }

    // friction during dash
    if (this.isDashing()) this.vy += -5*dt;
  }
  draw(t) {
    // body
    const hb = this.hitbox;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(this.x, this.ground+8, 28, 6, 0, 0, Math.PI*2); ctx.fill();

    // sprite (simple pixel style)
    ctx.save();
    ctx.translate(this.x, this.y);
    const slide = this.isSliding();
    const dash = this.isDashing();
    ctx.fillStyle = dash ? '#00ffa3' : '#8be9fd';
    const Ht = slide ? 28 : 42;
    const Wd = 30;
    ctx.fillRect(-Wd/2, -Ht, Wd, Ht); // torso
    ctx.fillStyle = '#ffb86c'; ctx.fillRect(-6, -Ht-12, 12, 12); // head
    ctx.fillStyle = '#bd93f9'; ctx.fillRect(-Wd/2-6, -Ht+8, 8, 8); // arm
    ctx.fillRect(Wd/2-2, -Ht+8, 8, 8);
    // eyes blink
    ctx.fillStyle = '#111'; if (Math.floor(t*2)%6===0) ctx.fillRect(-2, -Ht-8, 4, 2);

    // dash trail
    if (dash) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#00ffa3';
      for (let i=1;i<=4;i++){
        ctx.fillRect(-Wd/2 - i*8, -Ht, 8, Ht);
      }
    }
    ctx.restore();

    // debug hitbox (off)
    // ctx.strokeStyle = '#f00'; ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
  }
}

class Obstacle {
  constructor(speed, type='normal') {
    this.type = type; // normal / high / red
    this.w = 36; this.h = type==='high' ? 80 : 50;
    this.x = W + irand(0, 60);
    this.y = H - 120 + (type==='high' ? -30 : 0);
    this.speed = speed;
    this.passed = false;
    this.deadly = true;
    this.color = (type==='red') ? '#ff4d6d' : '#ffcc00';
  }
  update(dt, speedScale) { this.x -= this.speed*speedScale*dt; }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y - this.h, this.w, this.h);
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.fillRect(this.x, this.y - this.h, this.w, 6);
  }
  get hitbox() { return {x:this.x, y:this.y - this.h, w:this.w, h:this.h}; }
}

class Star {
  constructor(speed) {
    this.r = 10;
    this.x = W + irand(0, 80);
    this.y = irand(H-240, H-180);
    this.speed = speed*0.95;
    this.t = 0;
    this.eaten = false;
  }
  update(dt, speedScale) { this.x -= this.speed*speedScale*dt; this.t += dt; }
  draw() {
    ctx.save(); ctx.translate(this.x, this.y);
    const s = 1 + Math.sin(this.t*8)*0.1;
    ctx.scale(s,s);
    ctx.fillStyle = '#00ffa3';
    starPath(0,0,10,4,5);
    ctx.fill(); ctx.restore();
  }
  get hitbox() { return {x:this.x-10, y:this.y-10, w:20, h:20}; }
}
function starPath(x,y,r1,r2,n){
  ctx.beginPath();
  for (let i=0;i<n*2;i++){
    const ang = (Math.PI*i)/n;
    const r = (i%2===0)?r1:r2;
    ctx.lineTo(x+Math.cos(ang)*r, y+Math.sin(ang)*r);
  }
  ctx.closePath();
}

class Particles {
  constructor() { this.ps = []; }
  add(x,y,c) {
    for (let i=0;i<8;i++){
      this.ps.push({x, y, vx:rand(-80,80), vy:rand(-120,-20), a:1, c});
    }
  }
  update(dt) {
    for (const p of this.ps) { p.vy += 300*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.a -= 1.5*dt; }
    this.ps = this.ps.filter(p => p.a>0);
  }
  draw() {
    for (const p of this.ps) {
      ctx.globalAlpha = Math.max(0, p.a);
      ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    }
  }
}

function AABB(a,b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

// simple chiptune-ish sfx
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function sfx(freq, dur=0.05, type='square', vol=0.04) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

// Game state
const input = new Input();
const player = new Player();
const parts = new Particles();

let t=0, last=0, running=false, paused=false;
let score=0, combo=1, comboT=0;
let speed=260;
let objs=[], stars=[];
let spawnT=0, starT=0, dayT=0;

function reset() {
  t=0; last=0; score=0; combo=1; comboT=0; speed=260;
  objs.length=0; stars.length=0; spawnT=0; starT=0; dayT=0;
  player.reset();
}

function update(dt) {
  if (!running || paused) return;
  t += dt; dayT += dt;

  // Difficulty scaling
  const speedScale = 1 + Math.min(1.2, t/60);
  const spawnScale = clamp(0.7 + t/90, 0.7, 1.6);

  // Input
  if (input.once('pause')) paused = !paused;
  if (input.once('jump')) player.jump();
  if (input.once('slide')) player.slide();
  if (input.once('dash')) player.dash();

  // Player
  player.update(dt);

  // Spawners
  spawnT -= dt*spawnScale;
  if (spawnT <= 0) {
    const typeRoll = Math.random();
    const type = typeRoll < 0.15 ? 'high' : (typeRoll > 0.85 ? 'red' : 'normal');
    objs.push(new Obstacle(speed, type));
    spawnT = rand(0.7, 1.4);
  }
  starT -= dt;
  if (starT <= 0) {
    stars.push(new Star(speed));
    starT = rand(1.2, 2.2);
  }

  // Move entities
  for (const o of objs) o.update(dt, speedScale);
  for (const s of stars) s.update(dt, speedScale);

  // Collisions
  const ph = player.hitbox;
  for (const s of stars) {
    if (!s.eaten && AABB(ph, s.hitbox)) {
      s.eaten = true; combo = Math.min(10, combo+1); comboT = 3.5; score += 20*combo; sfx(660, 0.04);
      parts.add(s.x, s.y, '#00ffa3');
    }
  }
  for (const o of objs) {
    if (!o.passed && o.x + o.w < player.x) {
      o.passed = true; score += 5*combo;
    }
    if (AABB(ph, o.hitbox)) {
      if (o.type==='red' && player.isDashing()) {
        // break through
        parts.add(o.x+o.w/2, o.y-o.h/2, '#ff4d6d'); o.deadly=false; o.w=0; sfx(180, 0.04, 'sawtooth', 0.06);
        score += 30*combo;
      } else if (player.invul<=0) {
        gameOver(); return;
      }
    }
  }

  // Cleanup
  objs = objs.filter(o => o.x + o.w > -10);
  stars = stars.filter(s => !s.eaten && s.x > -20);

  // Combo decay
  comboT -= dt;
  if (comboT<=0) combo = Math.max(1, combo - 1), comboT = combo>1 ? 1.2 : 0;

  // Score passively
  score += Math.floor(10*dt);

  // UI
  ui.score.textContent = score;
  ui.combo.textContent = `x${combo}`;
}

function draw() {
  // Day/Night gradient
  const cyc = (Math.sin(dayT/30) + 1)/2; // 0..1 each ~60s
  const skyTop = `rgb(${Math.floor(10+40*cyc)}, ${Math.floor(20+60*cyc)}, ${Math.floor(40+120*cyc)})`;
  const skyBot = `rgb(${Math.floor(5+20*cyc)}, ${Math.floor(10+40*cyc)}, ${Math.floor(20+80*cyc)})`;
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, skyTop);
  g.addColorStop(1, skyBot);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // Parallax mountains
  parallaxLayer(0.2, 80, '#1a2033');
  parallaxLayer(0.4, 120, '#12182a');
  parallaxLayer(0.7, 180, '#0a0f1e');

  // Ground
  ctx.fillStyle = '#0c111e'; ctx.fillRect(0, H-100, W, 100);
  ctx.fillStyle = '#0f1526';
  for (let x=0;x<W;x+=24){ ctx.fillRect(x - (t*120)%24, H-100, 12, 4); }

  // Stars in sky
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  for (let i=0;i<60;i++){
    const sx = (i*160 + (t*20)%160) % (W+160) - 80;
    const sy = 40 + (i*37 % 180);
    const a = 0.2 + (i%5)/10;
    ctx.globalAlpha = a*(1 - cyc*0.8);
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Entities
  for (const s of stars) s.draw();
  for (const o of objs) o.draw();
  player.draw(t);

  // UI glow
  if (combo>1) {
    ctx.fillStyle = 'rgba(0,255,163,0.15)';
    ctx.fillRect(0,0,W,6);
  }
  // vignette
  const vg = ctx.createRadialGradient(W/2,H/2,100, W/2,H/2,500);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
}

function parallaxLayer(scale, h, color){
  const offset = (t*60*scale) % (W);
  ctx.fillStyle = color;
  for (let x=-offset; x<W; x+=160){
    mountain(x, H-100, 140, h);
  }
}
function mountain(x, baseY, width, height){
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x+width/2, baseY-height);
  ctx.lineTo(x+width, baseY);
  ctx.closePath();
  ctx.fill();
}

function loop(ts) {
  const now = ts/1000;
  if (!last) last = now;
  const dt = Math.min(0.033, now - last);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  ui.final.textContent = score;
  ui.over.classList.remove('hidden');
  const name = (ui.name.value || 'Player').trim().slice(0,16);
  submitScore(name, score);
  sfx(90, 0.12, 'triangle', 0.08);
}

// UI events
ui.start.addEventListener('click', () => {
  audioCtx.resume(); // allow sound after gesture
  ui.menu.classList.add('hidden');
  ui.over.classList.add('hidden');
  reset();
  running = true; paused = false;
});
ui.restart.addEventListener('click', () => {
  ui.over.classList.add('hidden');
  ui.menu.classList.add('hidden');
  reset(); running = true; paused = false;
});

// Boot
(async function boot(){
  await fetchToken();
  await fetchBest();
  requestAnimationFrame(loop);
})();
