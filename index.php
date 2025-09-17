<?php
// data/facts.php شامل آرایه‌ای از فکت‌های نمونه است. فعلاً استاتیک.
require_once __DIR__ . '/data/facts.php';
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>فکت‌خانه علمی — بدون اسکرول، پر از جادو</title>
  <meta name="description" content="نمایش فکت‌های علمی با طراحی سینماتیک، انیمیشن‌های سه‌بعدی و تعاملات خفن." />
  <link rel="stylesheet" href="assets/css/styles.css"/>
</head>
<body>
  <noscript>لطفاً جاوااسکریپت را فعال کنید.</noscript>

  <!-- لایه‌های بکگراند -->
  <div id="bg-gradient"></div>
  <canvas id="bg-stars"></canvas>
  <canvas id="bg-particles"></canvas>
  <canvas id="bg-matrix"></canvas>
  <div id="spotlight"></div>
  <div id="hologram-scan"></div>

  <!-- هدر شیشه‌ای -->
  <header class="glass header" data-parallax depth="0.3">
    <div class="brand">
      <span class="logo-glow">⚛</span>
      <h1>فکت‌خانه علمی</h1>
    </div>
    <div class="controls">
      <button class="btn ghost" id="toggleTheme" data-magnet>🌙/☀</button>
      <button class="btn" id="randomFact" data-magnet>یک فکت تصادفی</button>
      <div class="scene-tabs">
        <button class="tab active" data-scene="galaxy" data-magnet>کهکشان (1)</button>
        <button class="tab" data-scene="dna" data-magnet>DNA (2)</button>
        <button class="tab" data-scene="atom" data-magnet>اتم (3)</button>
        <button class="tab" data-scene="grid" data-magnet>گرید/فلیپ (4)</button>
        <button class="tab" data-scene="carousel" data-magnet>کاروسل 3D (5)</button>
        <button class="tab" data-scene="timeline" data-magnet>تایم‌لاین (6)</button>
      </div>
    </div>
  </header>

  <!-- کانتینر صحنه‌ها -->
  <main id="scenes">
    <!-- صحنه کهکشان -->
    <section class="scene show" id="scene-galaxy" aria-label="galaxy">
      <div class="center-stage">
        <div class="orb3d" data-parallax depth="0.2">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
          <div class="ring r3"></div>
          <div class="glow"></div>
        </div>
        <div class="fact-card glass tilt3d">
          <div class="typed" id="typedGalaxy"></div>
        </div>
      </div>
    </section>

    <!-- صحنه DNA -->
    <section class="scene" id="scene-dna" aria-label="dna">
      <div class="center-stage">
        <div class="dna-loader" data-parallax depth="0.2">
          <?php for($i=0;$i<12;$i++): ?>
            <span></span>
          <?php endfor; ?>
        </div>
        <div class="fact-card glass tilt3d">
          <div class="typed" id="typedDNA"></div>
        </div>
      </div>
    </section>

    <!-- صحنه اتم -->
    <section class="scene" id="scene-atom" aria-label="atom">
      <div class="center-stage">
        <div class="atom" data-parallax depth="0.25">
          <div class="nucleus"></div>
          <div class="orbit o1"><span class="e"></span></div>
          <div class="orbit o2"><span class="e"></span></div>
          <div class="orbit o3"><span class="e"></span></div>
        </div>
        <div class="fact-card glass tilt3d">
          <div class="typed" id="typedAtom"></div>
        </div>
      </div>
    </section>

    <!-- صحنه گرید/فلیپ -->
    <section class="scene" id="scene-grid" aria-label="grid">
      <div class="grid">
        <?php foreach(array_slice($FACTS,0,12) as $i=>$f): ?>
          <div class="card3d flip" tabindex="0">
            <div class="face front">
              <div class="icon">🔬</div>
              <div class="title">فکت #<?=($i+1)?></div>
            </div>
            <div class="face back">
              <p><?=htmlspecialchars($f)?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </section>

    <!-- صحنه کاروسل سه‌بعدی -->
    <section class="scene" id="scene-carousel" aria-label="carousel">
      <div class="carousel3d" data-parallax depth="0.15">
        <?php foreach(array_slice($FACTS,0,8) as $i=>$f): ?>
          <div class="carousel-item">
            <div class="glass card">
              <div class="icon">🧪</div>
              <p><?=htmlspecialchars($f)?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <div class="carousel-controls">
        <button class="btn" id="prev" data-magnet>◀</button>
        <button class="btn" id="next" data-magnet>▶</button>
      </div>
    </section>

    <!-- صحنه تایم‌لاین -->
    <section class="scene" id="scene-timeline" aria-label="timeline">
      <div class="timeline">
        <?php foreach(array_slice($FACTS,0,7) as $i=>$f): ?>
          <div class="tl-item">
            <div class="dot"></div>
            <div class="content glass">
              <h3>ایستگاه علمی <?=($i+1)?></h3>
              <p><?=htmlspecialchars($f)?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </section>
  </main>

  <!-- نوار پایین برای ناوبری و راهنما -->
  <footer class="glass footer">
    <div class="hints">
      <span>کلیدها: 1–6 تغییر صحنه | ←/→ چرخش کاروسل | Space: فکت تصادفی</span>
    </div>
    <div class="actions">
      <button class="btn ghost" id="toggleMatrix" data-magnet>ماتریکس</button>
      <button class="btn ghost" id="toggleParticles" data-magnet>ذرات</button>
      <button class="btn ghost" id="toggleStars" data-magnet>ستاره‌ها</button>
      <button class="btn ghost" id="toggleHologram" data-magnet>هولوگرام</button>
    </div>
  </footer>

  <!-- ریپل کلیکی -->
  <div id="rippleLayer"></div>

  <script>
    // ارسال فکت‌ها از PHP به JS
    window.__FACTS__ = <?php echo json_encode($FACTS, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
  </script>
  <script src="assets/js/app.js"></script>
</body>
</html>
