// app.js — UI، چت، چارت، ذرات، تم، فرمان‌ها، مودال و نوتیف

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const toast = (msg, type = "success", t = 2800) => {
  const wrap = $("#toasts"); const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg; wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, t);
};
const fmt = n => Number(n).toLocaleString("fa-IR", { maximumFractionDigits: 2 });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- Theme ----------
const themeBtn = $("#theme-toggle");
const setTheme = t => document.body.setAttribute("data-theme", t);
const nextTheme = () => (document.body.getAttribute("data-theme") === "dark" ? "light" : "dark");
const loadTheme = () => setTheme(localStorage.getItem("theme") || "dark");
loadTheme();
themeBtn.addEventListener("click", () => {
  const t = nextTheme(); setTheme(t); localStorage.setItem("theme", t);
});
document.addEventListener("keydown", e => {
  if ((e.key === "t" || e.key === "T") && !e.metaKey && !e.ctrlKey) { themeBtn.click(); }
});

// ---------- Risk toggle ----------
let risk = localStorage.getItem("risk") || "low";
const riskChips = $$(".risk-toggle .chip");
const applyRisk = r => {
  risk = r; localStorage.setItem("risk", r);
  riskChips.forEach(c => c.setAttribute("aria-pressed", String(c.dataset.risk === r)));
  $("#kpi-risk").textContent = r[0].toUpperCase() + r.slice(1);
  // رنگ سیگنال
  const sig = $("#kpi-signal"); sig.style.filter =
    r === "high" ? "drop-shadow(0 0 8px rgba(255,107,107,.6))" :
    r === "med" ? "drop-shadow(0 0 8px rgba(124,77,255,.6))" :
                  "drop-shadow(0 0 8px rgba(122,243,197,.5))";
};
riskChips.forEach(chip => chip.addEventListener("click", () => applyRisk(chip.dataset.risk)));
applyRisk(risk);

// ---------- KPI simulated feed ----------
let priceBTC = 26000, priceETH = 1700;
let chgBTC = 0, chgETH = 0;
const updateKPI = () => {
  const drift = risk === "high" ? 0.8 : risk === "med" ? 0.5 : 0.3;
  const n1 = (Math.sin(Date.now()/3000) + (Math.random()-0.5)*2) * drift;
  const n2 = (Math.cos(Date.now()/3500) + (Math.random()-0.5)*2) * drift;
  priceBTC = clamp(priceBTC + n1*18, 24000, 32000);
  priceETH = clamp(priceETH + n2*3.5, 1200, 2800);
  chgBTC = clamp(chgBTC + (Math.random()-0.5)*0.3, -5, 5);
  chgETH = clamp(chgETH + (Math.random()-0.5)*0.3, -5, 5);
  $("#kpi-btc").textContent = fmt(priceBTC);
  $("#kpi-eth").textContent = fmt(priceETH);
  $("#kpi-btc-chg").textContent = (chgBTC>=0?"+":"") + fmt(chgBTC) + "٪";
  $("#kpi-eth-chg").textContent = (chgETH>=0?"+":"") + fmt(chgETH) + "٪";
  const choose = Math.random();
  $("#kpi-signal").textContent = choose > .6 ? "📈 Long" : choose < .35 ? "📉 Short" : "⏸ Neutral";
};
setInterval(updateKPI, 1200); updateKPI();

// ---------- Background particles ----------
const canvasBG = $("#bg-particles"); const ctxBG = canvasBG.getContext("2d");
let W, H, particles = [];
const DPR = Math.min(2, window.devicePixelRatio || 1);
const initBG = () => {
  W = canvasBG.width = Math.floor(window.innerWidth * DPR);
  H = canvasBG.height = Math.floor(window.innerHeight * DPR);
  canvasBG.style.width = "100%"; canvasBG.style.height = "100%";
  const count = Math.floor((W*H) / (140000 * DPR));
  particles = Array.from({ length: count }, () => ({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2,
    r: Math.random()*1.6 + 0.4
  }));
};
const drawBG = () => {
  ctxBG.clearRect(0,0,W,H);
  ctxBG.fillStyle = getComputedStyle(document.body).getPropertyValue("--primary").trim();
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x<0||p.x>W) p.vx*=-1; if (p.y<0||p.y>H) p.vy*=-1;
    ctxBG.globalAlpha = 0.35;
    ctxBG.beginPath(); ctxBG.arc(p.x, p.y, p.r, 0, Math.PI*2); ctxBG.fill();
  });
  requestAnimationFrame(drawBG);
};
window.addEventListener("resize", initBG);
initBG(); requestAnimationFrame(drawBG);

// ---------- Lightweight live chart ----------
const chart = $("#chart"); const ctx = chart.getContext("2d");
const State = { tf: "1m", data: [], ma: [], atr: [] };
const MAX = 240;
const seedData = (base=priceBTC) => {
  State.data = []; let p = base;
  for (let i=0;i<MAX;i++){ p += (Math.random()-0.5)*8; State.data.push(p); }
  calcMA(); calcATR(); drawChart(true);
};
const calcMA = (len=12) => {
  const d = State.data; State.ma = d.map((_,i)=>{
    const start = Math.max(0, i-len+1); const slice = d.slice(start, i+1);
    return slice.reduce((a,b)=>a+b,0)/slice.length;
  });
};
const calcATR = (len=14) => {
  const d = State.data; const tr = d.map((v,i)=> i? Math.abs(v-d[i-1]) : 0);
  State.atr = tr.map((_,i)=>{ const start=Math.max(0,i-len+1); const slice=tr.slice(start,i+1);
    return slice.reduce((a,b)=>a+b,0)/slice.length; });
};
const drawChart = (animate=false) => {
  const w = chart.width, h = chart.height; ctx.clearRect(0,0,w,h);
  const min = Math.min(...State.data), max = Math.max(...State.data);
  const pad = (max-min)*0.12; const lo=min-pad, hi=max+pad;
  const x = i => (i/(MAX-1))*w; const y = v => h - (v - lo) / (hi - lo) * h;

  // grid
  ctx.globalAlpha = .5; ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
  for(let i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(0,(h/6)*i); ctx.lineTo(w,(h/6)*i); ctx.stroke(); }

  // price
  ctx.globalAlpha = 1; ctx.lineWidth = 2.2; ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--primary").trim();
  ctx.beginPath(); State.data.forEach((v,i)=>{ const px=x(i), py=y(v); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }); ctx.stroke();

  // MA
  ctx.lineWidth = 1.8; ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--accent").trim();
  ctx.beginPath(); State.ma.forEach((v,i)=>{ const px=x(i), py=y(v); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }); ctx.stroke();

  // ATR area
  ctx.globalAlpha = .25; ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--danger").trim();
  ctx.beginPath(); ctx.moveTo(x(0), y(State.data[0]-State.atr[0]));
  State.atr.forEach((a,i)=>{ ctx.lineTo(x(i), y(State.data[i]-a)); });
  for(let i=State.atr.length-1;i>=0;i--){ ctx.lineTo(x(i), y(State.data[i]+State.atr[i])); }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;

  if (animate) {
    chart.style.filter = "drop-shadow(0 6px 24px rgba(61,240,255,.18))";
    setTimeout(()=> chart.style.filter = "", 160);
  }
};
seedData();
setInterval(()=>{
  // append new point using KPI BTC base
  const last = State.data[State.data.length-1] ?? priceBTC;
  const drift = (Math.random()-0.5)*10 + (priceBTC - last)*0.1;
  State.data.push(last + drift);
  if (State.data.length > MAX) State.data.shift();
  calcMA(); calcATR(); drawChart();
}, 1500);

$$(".tf-chips .chip").forEach(ch => ch.addEventListener("click", () => {
  $$(".tf-chips .chip").forEach(c=>{ c.classList.remove("active"); c.setAttribute("aria-selected","false"); });
  ch.classList.add("active"); ch.setAttribute("aria-selected","true");
  State.tf = ch.dataset.tf; seedData(State.tf==="1h" ? priceBTC-2000 : priceBTC);
}));

// ---------- Chat ----------
const log = $("#chat-log"); const typing = $("#typing");
const addBubble = (text, who="agent") => {
  const div = document.createElement("div"); div.className = `bubble ${who}`;
  div.textContent = text; log.appendChild(div); log.scrollTop = log.scrollHeight; return div;
};
const sendBtn = $("#send-btn"); const input = $("#user-input");
const sendMessage = async () => {
  const msg = input.value.trim(); if (!msg) return;
  addBubble(msg, "user"); input.value = "";
  typing.classList.remove("hidden"); typing.setAttribute("aria-hidden","false");
  try {
    const res = await fetch("api.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message: msg, risk })
    });
    const data = await res.json();
    typing.classList.add("hidden"); typing.setAttribute("aria-hidden","true");
    addBubble(data.reply || "پاسخی دریافت نشد.", "agent");
  } catch (e) {
    typing.classList.add("hidden"); typing.setAttribute("aria-hidden","true");
    toast("خطا در ارتباط با ایجنت", "error");
  }
};
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ---------- Quick order + modal confirm ----------
const modal = $("#modal"); const modalBody = $("#modal-body");
const openModal = html => { modalBody.innerHTML = html; modal.classList.remove("hidden"); };
const closeModal = () => modal.classList.add("hidden");
$("#modal-cancel").addEventListener("click", closeModal);
$("#modal-confirm").addEventListener("click", () => {
  closeModal(); toast("سفارش ارسال شد (نمایشی)", "success");
});
$("#order-review").addEventListener("click", ()=>{
  const side = "review";
  const size = Number($("#order-size").value||0);
  const lev  = Number($("#order-lev").value||1);
  const sym  = $("#order-symbol").value;
  if (size < 10) return toast("حداقل سایز 10 USDT است", "error");
  openModal(`
    <div><strong>نوع:</strong> ${side}</div>
    <div><strong>سمبل:</strong> ${sym}</div>
    <div><strong>سایز:</strong> ${fmt(size)} USDT</div>
    <div><strong>اهرم:</strong> ${lev}x</div>
    <div style="margin-top:8px;color:#f7c56e">یادآوری: ریسک ${risk.toUpperCase()}</div>
  `);
});
$$(".quick-actions .btn").forEach(b => b.addEventListener("click", ()=>{
  const action = b.dataset.order;
  const sym = $("#order-symbol").value;
  openModal(`<div>آیا با اقدام <strong>${action.toUpperCase()}</strong> روی <strong>${sym}</strong> موافقی؟</div>`);
}));

// ---------- Command Palette (⌘/Ctrl+K) ----------
const cmdBtn = $("#cmdk"); const cmdModal = $("#cmdk-modal");
const cmdInput = $("#cmdk-input"); const cmdList = $("#cmdk-list");
const COMMANDS = [
  { id:"theme", label:"تغییر تم", run: ()=> themeBtn.click() },
  { id:"long", label:"ثبت لانگ (نمایشی)", run: ()=> openModal("لانگ نمایشی ثبت شود؟") },
  { id:"short", label:"ثبت شورت (نمایشی)", run: ()=> openModal("شورت نمایشی ثبت شود؟") },
  { id:"close", label:"بستن پوزیشن (نمایشی)", run: ()=> openModal("بستن پوزیشن فعلی؟") },
  { id:"risk low", label:"ریسک Low", run: ()=> applyRisk("low") },
  { id:"risk med", label:"ریسک Med", run: ()=> applyRisk("med") },
  { id:"risk high", label:"ریسک High", run: ()=> applyRisk("high") },
  { id:"help", label:"راهنما", run: ()=> toast("نمونه فرمان‌ها: theme, long, short, close, risk high", "success", 4200) }
];
const openCmd = () => { cmdModal.classList.remove("hidden"); cmdInput.value=""; renderCmd(""); cmdInput.focus(); };
const closeCmd = () => cmdModal.classList.add("hidden");
const renderCmd = q => {
  cmdList.innerHTML = "";
  const items = COMMANDS.filter(c => c.id.includes(q.trim().toLowerCase()));
  items.forEach((c,i)=>{
    const li = document.createElement("li"); li.className="cmdk-item"; li.textContent=c.label; li.tabIndex=0;
    li.addEventListener("click", ()=>{ c.run(); closeCmd(); });
    if (i===0) li.setAttribute("aria-selected","true");
    cmdList.appendChild(li);
  });
  if (!items.length) {
    const li = document.createElement("li"); li.className="cmdk-item"; li.textContent="چیزی پیدا نشد";
    cmdList.appendChild(li);
  }
};
cmdBtn.addEventListener("click", openCmd);
cmdInput.addEventListener("input", e=> renderCmd(e.target.value));
document.addEventListener("keydown", e=>{
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmd(); }
  if (e.key === "Escape") { closeCmd(); closeModal(); }
});

// ---------- A11y focus for modals ----------
modal.addEventListener("click", e=>{ if (e.target === modal) closeModal(); });
cmdModal.addEventListener("click", e=>{ if (e.target === cmdModal) closeCmd(); });
