<?php
// Simple highscore API with CSRF token and file locks
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

const HS_FILE = __DIR__ . '/highscore.json';
const MAX_NAME = 16;

$action = $_GET['action'] ?? '';

if ($action === 'token') {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    echo json_encode(['token' => $_SESSION['csrf']]); exit;
}

if ($action === 'highscore') {
    $data = read_highscore();
    if ($data) {
        echo json_encode(['ok'=>true, 'name'=>$data['name'], 'highscore'=>$data['score']]); exit;
    } else {
        echo json_encode(['ok'=>true, 'name'=>null, 'highscore'=>null]); exit;
    }
}

if ($action === 'submit' && $_SERVER['REQUEST_METHOD']==='POST') {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    $name = trim((string)($json['name'] ?? ''));
    $score = (int)($json['score'] ?? 0);
    $token = (string)($json['token'] ?? '');

    if (!$token || !isset($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $token)) {
        http_response_code(403);
        echo json_encode(['ok'=>false, 'error'=>'invalid_token']); exit;
    }

    // Basic validations
    if ($score < 0 || $score > 100000000) {
        echo json_encode(['ok'=>false, 'error'=>'invalid_score']); exit;
    }
    $name = sanitize_name($name);
    if ($name === '') $name = 'Player';

    $current = read_highscore();
    if (!$current || $score > (int)$current['score']) {
        $save = ['name'=>$name, 'score'=>$score, 'ts'=>time(), 'ip'=>client_ip_hash()];
        if (!safe_write_json(HS_FILE, $save)) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>'write_failed']); exit;
        }
        echo json_encode(['ok'=>true, 'name'=>$name, 'highscore'=>$score]); exit;
    }
    echo json_encode(['ok'=>true, 'name'=>$current['name'], 'highscore'=>$current['score']]); exit;
}

http_response_code(400);
echo json_encode(['ok'=>false, 'error'=>'bad_request']); exit;

// Helpers
function read_highscore(): ?array {
    if (!file_exists(HS_FILE)) return null;
    $fp = fopen(HS_FILE, 'r');
    if (!$fp) return null;
    flock($fp, LOCK_SH);
    $data = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $arr = json_decode($data, true);
    if (!is_array($arr) || !isset($arr['name'], $arr['score'])) return null;
    return $arr;
}

function safe_write_json(string $file, array $data): bool {
    $tmp = $file . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    $fp = fopen($tmp, 'w');
    if (!$fp) return false;
    if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return rename($tmp, $file);
}

function sanitize_name(string $name): string {
    $name = mb_substr($name, 0, MAX_NAME);
    // allow letters, digits, spaces, underscore and dash
    $name = preg_replace('/[^\p{L}\p{N}\s_-]+/u', '', $name);
    return trim($name);
}

function client_ip_hash(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return hash('sha256', $ip . 'pepper_here');
}
