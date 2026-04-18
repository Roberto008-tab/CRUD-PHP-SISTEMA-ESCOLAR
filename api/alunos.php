<?php
// ============================================================
//  /api/alunos.php — CRUD de alunos
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireApi();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET — Listar / Buscar ────────────────────────────────────
if ($method === 'GET') {
    $q     = trim($_GET['q'] ?? '');
    $turma = trim($_GET['turma'] ?? '');
    $serie = trim($_GET['serie'] ?? '');
    $id    = (int)($_GET['id'] ?? 0);

    if ($id) {
        $stmt = $db->prepare('SELECT * FROM alunos WHERE id = ? AND ativo = 1');
        $stmt->execute([$id]);
        $aluno = $stmt->fetch();
        if (!$aluno) jsonFail('Aluno não encontrado.', 404);
        jsonOk($aluno);
    }

    $where  = 'ativo = 1';
    $params = [];
    if ($q) {
        $where  .= ' AND (nome LIKE ? OR matricula LIKE ? OR email LIKE ?)';
        $params  = array_merge($params, ["%$q%", "%$q%", "%$q%"]);
    }
    if ($turma) { $where .= ' AND turma = ?'; $params[] = $turma; }
    if ($serie)  { $where .= ' AND serie = ?';  $params[] = $serie; }

    $stmt = $db->prepare("SELECT * FROM alunos WHERE $where ORDER BY nome");
    $stmt->execute($params);
    $alunos = $stmt->fetchAll();

    $turmas = $db->query("SELECT DISTINCT turma FROM alunos WHERE ativo=1 ORDER BY turma")->fetchAll(PDO::FETCH_COLUMN);
    $series = $db->query("SELECT DISTINCT serie FROM alunos WHERE ativo=1 ORDER BY serie")->fetchAll(PDO::FETCH_COLUMN);

    jsonOk([
        'alunos' => $alunos,
        'turmas' => $turmas,
        'series' => $series,
        'total'  => count($alunos),
    ]);
}

// ── POST — Criar ─────────────────────────────────────────────
if ($method === 'POST') {
    if ((int)$user['cargo'] > ROLE_SECRETARIA) jsonFail('Permissão insuficiente.', 403);

    $body = getBody();
    $nome = trim($body['nome'] ?? '');
    if (!$nome) jsonFail('Nome é obrigatório.', 422);

    // Gera matrícula automática
    $ano  = date('Y');
    $last = $db->query("SELECT MAX(CAST(SUBSTR(matricula,5) AS INTEGER)) FROM alunos WHERE matricula LIKE '$ano%'")->fetchColumn();
    $mat  = $ano . str_pad(((int)$last) + 1, 3, '0', STR_PAD_LEFT);

    $fields = ['nome','email','telefone','data_nascimento','turma','serie','turno','responsavel','tel_responsavel','endereco','observacoes'];
    $data   = [];
    foreach ($fields as $f) $data[$f] = trim($body[$f] ?? '');

    $stmt = $db->prepare('INSERT INTO alunos (matricula,nome,email,telefone,data_nascimento,turma,serie,turno,responsavel,tel_responsavel,endereco,observacoes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $mat, $data['nome'], $data['email'], $data['telefone'],
        $data['data_nascimento'], $data['turma'], $data['serie'],
        $data['turno'] ?: 'Matutino', $data['responsavel'],
        $data['tel_responsavel'], $data['endereco'], $data['observacoes'],
    ]);
    $newId = (int)$db->lastInsertId();
    logAction((int)$user['id'], 'criar', 'aluno', $newId);

    $stmt2 = $db->prepare('SELECT * FROM alunos WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonOk($stmt2->fetch(), "Aluno $mat cadastrado com sucesso.");
}

// ── PUT — Atualizar ──────────────────────────────────────────
if ($method === 'PUT') {
    if ((int)$user['cargo'] > ROLE_SECRETARIA) jsonFail('Permissão insuficiente.', 403);

    $body = getBody();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonFail('ID é obrigatório.', 422);

    $fields = ['nome','email','telefone','data_nascimento','turma','serie','turno','responsavel','tel_responsavel','endereco','observacoes'];
    $vals   = [];
    $set    = [];
    foreach ($fields as $f) {
        $set[]  = "$f = ?";
        $vals[] = trim($body[$f] ?? '');
    }
    $vals[] = $id;
    $db->prepare("UPDATE alunos SET " . implode(', ', $set) . ", updated_at = datetime('now') WHERE id = ?")->execute($vals);
    logAction((int)$user['id'], 'editar', 'aluno', $id);

    $stmt = $db->prepare('SELECT * FROM alunos WHERE id = ?');
    $stmt->execute([$id]);
    jsonOk($stmt->fetch(), 'Aluno atualizado.');
}

// ── DELETE — Desativar (soft delete) ────────────────────────
if ($method === 'DELETE') {
    if ((int)$user['cargo'] > ROLE_DIRETOR) jsonFail('Permissão insuficiente.', 403);

    $id = (int)($_GET['id'] ?? (getBody()['id'] ?? 0));
    if (!$id) jsonFail('ID é obrigatório.', 422);

    $db->prepare('UPDATE alunos SET ativo = 0 WHERE id = ?')->execute([$id]);
    logAction((int)$user['id'], 'deletar', 'aluno', $id);
    jsonOk(['id' => $id], 'Aluno removido.');
}

jsonFail('Método não suportado.', 405);
