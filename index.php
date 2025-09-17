<?php // index.php ?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>AI Crypto Agent — اسپات و فیوچرز</title>
  <link rel="stylesheet" href="style.css">
  <meta name="color-scheme" content="dark light">
</head>
<body data-theme="dark">
  <canvas id="bg-particles" aria-hidden="true"></canvas>

  <header class="site-header" role="banner">
    <div class="brand">
      <div class="logo">🤖</div>
      <div class="title">
        <h1>AI Crypto Agent</h1>
        <p>هم‌تیمی هوشمند برای معاملات اسپات و فیوچرز</p>
      </div>
    </div>
    <nav class="actions" aria-label="کنترل‌های سریع">
      <button id="theme-toggle" class="btn secondary" aria-pressed="true" title="تغییر تم (T)">تم</button>
      <div class="risk-toggle" role="group" aria-label="ریسک">
        <button class="chip" data-risk="low" aria-pressed="true">Low</button>
        <button class="chip" data-risk="med">Med</button>
        <button class="chip" data-risk="high">High</button>
      </div>
      <button id="cmdk" class="btn primary" title="پنل فرمان (⌘/Ctrl + K)">⌘K</button>
    </nav>
  </header>

  <main class="container" role="main">
    <section class="kpi-cards" aria-label="نمای کلی بازار">
      <div class="card kpi" aria-live="polite">
        <div class="kpi-title">BTC/USDT</div>
        <div class="kpi-value"><span id="kpi-btc">--</span></div>
        <div class="kpi-sub">24h Δ <span id="kpi-btc-chg">--</span></div>
      </div>
      <div class="card kpi" aria-live="polite">
        <div class="kpi-title">ETH/USDT</div>
        <div class="kpi-value"><span id="kpi-eth">--</span></div>
        <div class="kpi-sub">24h Δ <span id="kpi-eth-chg">--</span></div>
      </div>
      <div class="card kpi" aria-live="polite">
        <div class="kpi-title">سیگنال لحظه‌ای</div>
        <div class="kpi-value signal" id="kpi-signal">--</div>
        <div class="kpi-sub">ریسک: <span id="kpi-risk">Low</span></div>
      </div>
    </section>

    <section class="grid">
      <div class="panel chart-panel card">
        <div class="panel-head">
          <h2>چارت زنده</h2>
          <div class="tf-chips" role="tablist" aria-label="تایم‌فریم">
            <button class="chip active" data-tf="1m" role="tab" aria-selected="true">1m</button>
            <button class="chip" data-tf="5m" role="tab">5m</button>
            <button class="chip" data-tf="15m" role="tab">15m</button>
            <button class="chip" data-tf="1h" role="tab">1h</button>
          </div>
        </div>
        <canvas id="chart" width="900" height="320" aria-label="چارت قیمت"></canvas>
        <div class="chart-legend">
          <span class="legend price">قیمت</span>
          <span class="legend ma">MA</span>
          <span class="legend atr">ATR</span>
        </div>
      </div>

      <div class="panel chat-panel card">
        <div class="panel-head">
          <h2>چت با ایجنت</h2>
          <div class="tips">Enter = ارسال • Shift+Enter = خط جدید</div>
        </div>
        <div id="chat-log" class="chat-log" aria-live="polite"></div>
        <div class="chat-input">
          <textarea id="user-input" rows="2" placeholder="سوالت رو بپرس یا مثل: «لانگ BTC با اهرم 3 در 1h» بنویس..."></textarea>
          <button id="send-btn" class="btn primary">ارسال</button>
        </div>
        <div id="typing" class="typing hidden" aria-hidden="true">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </section>

    <section class="panel trades-panel card">
      <div class="panel-head">
        <h2>سفارش سریع</h2>
        <div class="quick-actions">
          <button class="btn ghost" data-order="long">📈 لانگ</button>
          <button class="btn ghost" data-order="short">📉 شورت</button>
          <button class="btn ghost" data-order="close">🔒 بستن</button>
        </div>
      </div>
      <div class="row">
        <label>سایز (USDT)
          <input type="number" id="order-size" min="10" step="10" value="100">
        </label>
        <label>اهرم
          <input type="number" id="order-lev" min="1" max="20" step="1" value="3">
        </label>
        <label>جفت
          <select id="order-symbol">
            <option>BTC/USDT</option>
            <option>ETH/USDT</option>
          </select>
        </label>
        <button id="order-review" class="btn primary">بررسی و تأیید</button>
      </div>
    </section>
  </main>

  <div id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-card">
      <h3 id="modal-title">تأیید سفارش</h3>
      <div id="modal-body" class="modal-body"></div>
      <div class="modal-actions">
        <button id="modal-cancel" class="btn secondary">انصراف</button>
        <button id="modal-confirm" class="btn danger">تأیید</button>
      </div>
    </div>
  </div>

  <div id="toasts" class="toasts" aria-live="assertive"></div>

  <div id="cmdk-modal" class="cmdk hidden" role="dialog" aria-modal="true" aria-labelledby="cmdk-title">
    <div class="cmdk-card">
      <h3 id="cmdk-title">پنل فرمان</h3>
      <input id="cmdk-input" class="cmdk-input" placeholder="فرمان: theme, long, short, close, help..." />
      <ul id="cmdk-list" class="cmdk-list" role="listbox" aria-label="فرمان‌ها"></ul>
    </div>
  </div>

  <footer class="site-footer">
    <small>© 2025 — طراحی شده برای تمرکز، سرعت، و شفافیت</small>
  </footer>

  <script src="app.js"></script>
</body>
</html>
