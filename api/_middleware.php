<?php
// ============================================================
//  EduGestor API — Middleware (CORS + JSON + Auth helper)
// ============================================================
header('Content-Type: application/json; charset=utf-8');

// 1. Permite especificamente a porta do React Vite
header('Access-Control-Allow-Origin: http://localhost:5173');

// 2. Fundamental: Permite que o React envie os cookies de sessão!
header('Access-Control-Allow-Credentials: true'); 

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Responder preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// ── Helpers ──────────────────────────────────────────────────

function jsonOk(mixed $data = null, string $msg = 'ok'): void {
    echo json_encode(['success' => true, 'message' => $msg, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonFail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg, 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function requireApi(): array {
    if (!isset($_SESSION['user'])) {
        jsonFail('Não autenticado. Faça login novamente.', 401);
    }
    if ((time() - ($_SESSION['logged_at'] ?? 0)) > SESSION_LIFETIME) {
        session_destroy();
        jsonFail('Sessão expirada. Faça login novamente.', 401);
    }
    // Renovar sessão
    $_SESSION['logged_at'] = time();
    return $_SESSION['user'];
}

function requireRoleApi(int ...$roles): array {
    $user = requireApi();
    if (!in_array((int)$user['cargo'], $roles, true)) {
        jsonFail('Acesso negado. Permissão insuficiente.', 403);
    }
    return $user;
}
