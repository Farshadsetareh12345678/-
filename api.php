<?php
// api.php — پاسخ ساده و امن‌-تر شبیه‌سازی‌شده بدون افشای کلید
header("Content-Type: application/json; charset=utf-8");
header("Referrer-Policy: no-referrer");

session_start();

// ساده‌ترین ریت‌لیمیت: حداکثر 5 درخواست در 10 ثانیه
$now = time();
if (!isset($_SESSION["rl"])) $_SESSION["rl"] = [];
$_SESSION["rl"] = array_filter($_SESSION["rl"], fn($t) => $now - $t < 10);
if (count($_SESSION["rl"]) >= 5) {
  http_response_code(429);
  echo json_encode(["reply"=>"لطفاً کمی صبر کن، درخواست‌ها زیاد شد."]); exit;
}
$_SESSION["rl"][] = $now;

// دریافت ورودی
$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?: [];
$msg  = trim($data["message"] ?? "");
$risk = strtolower($data["risk"] ?? "low");

// بهداشت ورودی
$msg = mb_substr($msg, 0, 500, "UTF-8");

// قواعد ساده پاسخ: نماد، تایم‌فریم، اکشن
$symbol = null;
if (preg_match("/(btc|eth)\s*\/?\s*usdt/i", $msg, $m)) {
  $t = strtoupper($m[1]);
  $symbol = ($t === "BTC" ? "BTC/USDT" : "ETH/USDT");
}
$tf = null;
if (preg_match("/\b(1m|5m|15m|1h|4h|1d)\b/i", $msg, $m)) { $tf = $m[1]; }
$intent = null;
if (preg_match("/(long|لانگ|buy|short|شورت|sell|close|بستن)/i", $msg, $m)) {
  $w = strtolower($m[1]);
  $intent = (str_contains($w,"long")||str_contains($w,"لانگ")||str_contains($w,"buy")) ? "LONG" :
            (str_contains($w,"short")||str_contains($w,"شورت")||str_contains($w,"sell")) ? "SHORT" :
            "CLOSE";
}

// تولید پاسخ توضیحی شفاف
$riskLabel = strtoupper($risk);
$symText = $symbol ?: "BTC/USDT";
$tfText  = $tf ?: "1h";
$hints = [
  "حداکثر ریسک هر معامله را زیر ۱–۲٪ سرمایه نگه‌دار.",
  "قبل از ورود، سطح ابطال (Invalidation) را مشخص کن.",
  "اخبار و Funding را در نظر بگیر؛ از معاملات احساسی پرهیز کن.",
];
$hint = $hints[array_rand($hints)];

if (!$msg) {
  echo json_encode(["reply"=>"یک سوال یا دستور بده: مثل «لانگ BTC/USDT با اهرم 3 در 1h»"]); exit;
}

$reasoning = [];
$reasoning[] = "کانتکست: نماد $symText در تایم‌فریم $tfText با پروفایل ریسک {$riskLabel}.";
$reasoning[] = "قانون پایه: دنبال هم‌سویی روند، MA، و ساختار سقف/کف بگرد.";
$action = "در حال حاضر پیشنهاد ورود قطعی ندارم؛ ابتدا شکست معتبر و تأیید حجم را ببین.";

if ($intent === "LONG") {
  $action = "لانگ مشروط: ورود پله‌ای بعد از پولبک به حمایت اخیر، حدضرر زیر آخرین کف، مدیریت ریسک سختگیرانه.";
  $reasoning[] = "اگر RSI از محدوده تعادلی رو به بالا برگردد و MA کوتاه‌مدت بالای MA بلندمدت قرار گیرد، احتمال تداوم روند صعودی بیشتر است.";
} elseif ($intent === "SHORT") {
  $action = "شورت مشروط: ورود پس از رد مقاومت، حدضرر بالای آخرین سقف، از اهرم بالا پرهیز.";
  $reasoning[] = "واگرایی نزولی و شکست MA می‌تواند تریگر اولیه برای اصلاح باشد.";
} elseif ($intent === "CLOSE") {
  $action = "بستن پوزیشن: اگر قیمت به ناحیه هدف/ریسک رسید یا ساختار بازار خلاف پوزیشن شد، خروج مرحله‌ای انجام بده.";
  $reasoning[] = "حفظ سرمایه بر سودآوری مقدم است؛ قفل‌کردن سود با تریلینگ.";
} else {
  $reasoning[] = "برای راهنمایی دقیق‌تر، نوع اقدام (لانگ/شورت/بستن) را مشخص کن.";
}

$reply = "✅ " . $action . "\n"
       . "• " . implode("\n• ", $reasoning) . "\n"
       . "• نکته: {$hint}";

echo json_encode(["reply"=>$reply]);
