<?php
// ============================================================
//  /api/tokens.php
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireRoleApi(ROLE_ADMIN);
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $tokens = $db->query("SELECT t.id,t.nome,t.servico,t.descricao,t.ativo,t.ultimo_uso,t.created_at,u.nome as criado_por_nome FROM tokens_api t LEFT JOIN usuarios u ON u.id=t.created_by ORDER BY t.created_at DESC")->fetchAll();
    jsonOk($tokens);
}

if ($method === 'POST') {
    $body    = getBody();
    $acao    = $body['acao'] ?? 'criar';
    if ($acao === 'criar') {
        $nome    = trim($body['nome'] ?? '');
        $servico = trim($body['servico'] ?? '');
        $token   = trim($body['token'] ?? '');
        $desc    = trim($body['descricao'] ?? '');
        if (!$nome || !$servico || !$token) jsonFail('Nome, serviço e token são obrigatórios.', 422);
        $db->prepare("INSERT INTO tokens_api (nome,servico,token,descricao,created_by) VALUES (?,?,?,?,?)")->execute([$nome,$servico,$token,$desc,(int)$user['id']]);
        $id = (int)$db->lastInsertId();
        logAction((int)$user['id'], 'criar', 'token', $id);
        jsonOk(['id'=>$id,'nome'=>$nome,'servico'=>$servico], "Token $nome adicionado.");
    }
    if ($acao === 'toggle') {
        $id   = (int)($body['id'] ?? 0);
        $ativ = (int)$db->query("SELECT ativo FROM tokens_api WHERE id=$id")->fetchColumn();
        $db->prepare("UPDATE tokens_api SET ativo=? WHERE id=?")->execute([$ativ ? 0 : 1, $id]);
        jsonOk(['id'=>$id,'ativo'=>!$ativ], 'Status atualizado.');
    }
    if ($acao === 'testar') {
        $id = (int)($body['id'] ?? 0);
        $db->prepare("UPDATE tokens_api SET ultimo_uso=datetime('now') WHERE id=?")->execute([$id]);
        $stmt = $db->prepare("SELECT servico FROM tokens_api WHERE id=?"); $stmt->execute([$id]);
        $tk = $stmt->fetch();
        jsonOk(['id'=>$id], "Conexão com {$tk['servico']} testada (simulado).");
    }
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? (getBody()['id'] ?? 0));
    $db->prepare('DELETE FROM tokens_api WHERE id=?')->execute([$id]);
    logAction((int)$user['id'], 'deletar', 'token', $id);
    jsonOk(['id'=>$id], 'Token removido.');
}

jsonFail('Método não suportado.', 405);
