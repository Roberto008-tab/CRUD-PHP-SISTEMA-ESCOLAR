<?php
// ============================================================
//  /api/usuarios.php
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireRoleApi(ROLE_ADMIN);
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
global $ROLE_NAMES, $ROLE_COLORS;

if ($method === 'GET') {
    $usuarios = $db->query("SELECT id,login,nome,email,cargo,ativo,foto,created_at,updated_at,ultimo_acesso FROM usuarios ORDER BY cargo,nome")->fetchAll();
    jsonOk(['usuarios' => $usuarios, 'cargos' => $ROLE_NAMES]);
}

if ($method === 'POST') {
    $body  = getBody();
    $login = trim($body['login'] ?? '');
    $senha = trim($body['senha'] ?? '');
    $nome  = trim($body['nome'] ?? '');
    $email = trim($body['email'] ?? '');
    $cargo = (int)($body['cargo'] ?? ROLE_PROFESSOR);
    if (!$login || !$senha || !$nome) jsonFail('Login, senha e nome são obrigatórios.', 422);
    try {
        $db->prepare("INSERT INTO usuarios (login,senha_hash,nome,email,cargo) VALUES (?,?,?,?,?)")->execute([$login, password_hash($senha, PASSWORD_DEFAULT), $nome, $email, $cargo]);
        $id = (int)$db->lastInsertId();
        logAction((int)$user['id'], 'criar', 'usuario', $id);
        jsonOk(['id' => $id, 'login' => $login, 'nome' => $nome, 'cargo' => $cargo], "Usuário $nome criado.");
    } catch (\PDOException $e) {
        jsonFail('Login já existe. Escolha outro.', 409);
    }
}

if ($method === 'PUT') {
    $body  = getBody();
    $id    = (int)($body['id'] ?? 0);
    $nome  = trim($body['nome'] ?? '');
    $email = trim($body['email'] ?? '');
    $cargo = (int)($body['cargo'] ?? ROLE_PROFESSOR);
    $ativo = isset($body['ativo']) ? (int)$body['ativo'] : null;
    if (!$id) jsonFail('ID obrigatório.', 422);
    if ($ativo !== null) {
        $db->prepare("UPDATE usuarios SET ativo=? WHERE id=?")->execute([$ativo, $id]);
    } else {
        $db->prepare("UPDATE usuarios SET nome=?,email=?,cargo=?,updated_at=datetime('now') WHERE id=?")->execute([$nome,$email,$cargo,$id]);
        if (!empty($body['nova_senha'])) {
            $db->prepare("UPDATE usuarios SET senha_hash=? WHERE id=?")->execute([password_hash(trim($body['nova_senha']), PASSWORD_DEFAULT), $id]);
        }
    }
    logAction((int)$user['id'], 'editar', 'usuario', $id);
    jsonOk(['id' => $id], 'Usuário atualizado.');
}

jsonFail('Método não suportado.', 405);
