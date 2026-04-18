<?php
// ============================================================
//  /api/auth.php — Login, logout, sessão atual
// ============================================================
require_once __DIR__ . '/_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── GET /api/auth.php?action=me ────────────────────────────
if ($method === 'GET' && $action === 'me') {
    if (!isset($_SESSION['user'])) {
        jsonFail('Não autenticado.', 401);
    }
    $u = $_SESSION['user'];
    // Nunca expor hash de senha
    unset($u['senha_hash'], $u['api_token']);
    jsonOk($u, 'Sessão ativa.');
}

// ── GET /api/auth.php?action=logout ────────────────────────
if ($method === 'GET' && $action === 'logout') {
    if (isset($_SESSION['user'])) {
        logAction($_SESSION['user']['id'], 'logout', 'session', 0);
    }
    session_destroy();
    jsonOk(null, 'Logout realizado.');
}

// ── POST /api/auth.php — Login ──────────────────────────────
if ($method === 'POST') {
    $body  = getBody();
    $login = trim($body['login'] ?? '');
    $senha = trim($body['senha'] ?? '');

    if (!$login || !$senha) {
        jsonFail('Login e senha são obrigatórios.', 422);
    }

    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM usuarios WHERE login = ? AND ativo = 1');
    $stmt->execute([$login]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        logAction(0, 'login_falhou', 'session', 0);
        jsonFail('Login ou senha incorretos.', 401);
    }

    $_SESSION['user']      = $user;
    $_SESSION['logged_at'] = time();
    logAction($user['id'], 'login', 'session', 0);

    // Remover campos sensíveis da resposta
    unset($user['senha_hash'], $user['api_token']);
    jsonOk($user, 'Login realizado com sucesso.');
}

jsonFail('Método não suportado.', 405);
