<?php
// ============================================================
//  /api/professores.php — CRUD de professores
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireApi();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $q  = trim($_GET['q'] ?? '');
    $where  = 'ativo = 1'; $params = [];
    if ($q) { $where .= ' AND (nome LIKE ? OR registro LIKE ? OR disciplina LIKE ?)'; $params = ["%$q%","%$q%","%$q%"]; }
    $stmt = $db->prepare("SELECT * FROM professores WHERE $where ORDER BY nome");
    $stmt->execute($params);
    jsonOk(['professores' => $stmt->fetchAll(), 'total' => count($stmt->fetchAll() ?: [])]);
}

if ($method === 'POST') {
    if ((int)$user['cargo'] > ROLE_SECRETARIA) jsonFail('Permissão insuficiente.', 403);
    $body = getBody();
    $nome = trim($body['nome'] ?? '');
    if (!$nome) jsonFail('Nome é obrigatório.', 422);
    $last = $db->query("SELECT MAX(CAST(SUBSTR(registro,2) AS INTEGER)) FROM professores")->fetchColumn();
    $reg  = 'P' . str_pad(((int)$last) + 1, 3, '0', STR_PAD_LEFT);
    $db->prepare('INSERT INTO professores (registro,nome,email,telefone,disciplina,formacao,turmas) VALUES (?,?,?,?,?,?,?)')->execute([
        $reg, $nome, trim($body['email']??''), trim($body['telefone']??''),
        trim($body['disciplina']??''), trim($body['formacao']??''), trim($body['turmas']??''),
    ]);
    $id = (int)$db->lastInsertId();
    logAction((int)$user['id'], 'criar', 'professor', $id);
    $stmt = $db->prepare('SELECT * FROM professores WHERE id = ?'); $stmt->execute([$id]);
    jsonOk($stmt->fetch(), "Professor $reg cadastrado.");
}

if ($method === 'PUT') {
    if ((int)$user['cargo'] > ROLE_SECRETARIA) jsonFail('Permissão insuficiente.', 403);
    $body = getBody();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonFail('ID obrigatório.', 422);
    $db->prepare("UPDATE professores SET nome=?,email=?,telefone=?,disciplina=?,formacao=?,turmas=?,updated_at=datetime('now') WHERE id=?")
       ->execute([trim($body['nome']??''),trim($body['email']??''),trim($body['telefone']??''),trim($body['disciplina']??''),trim($body['formacao']??''),trim($body['turmas']??''),$id]);
    logAction((int)$user['id'], 'editar', 'professor', $id);
    $stmt = $db->prepare('SELECT * FROM professores WHERE id = ?'); $stmt->execute([$id]);
    jsonOk($stmt->fetch(), 'Professor atualizado.');
}

if ($method === 'DELETE') {
    if ((int)$user['cargo'] > ROLE_DIRETOR) jsonFail('Permissão insuficiente.', 403);
    $id = (int)($_GET['id'] ?? (getBody()['id'] ?? 0));
    $db->prepare('UPDATE professores SET ativo = 0 WHERE id = ?')->execute([$id]);
    logAction((int)$user['id'], 'deletar', 'professor', $id);
    jsonOk(['id' => $id], 'Professor removido.');
}

jsonFail('Método não suportado.', 405);
