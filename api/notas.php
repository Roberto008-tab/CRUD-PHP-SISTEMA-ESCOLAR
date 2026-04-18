<?php
// ============================================================
//  /api/notas.php — CRUD de notas + boletim
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireApi();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $alunoId = (int)($_GET['aluno_id'] ?? 0);
    $disc    = trim($_GET['disciplina'] ?? '');
    $bim     = (int)($_GET['bimestre'] ?? 0);
    $boletim = isset($_GET['boletim']);

    if ($boletim) {
        $medias = $db->query("
            SELECT a.id as aluno_id, a.nome, a.matricula, a.turma, n.disciplina,
                   AVG(CASE WHEN n.bimestre=1 THEN n.nota END) as b1,
                   AVG(CASE WHEN n.bimestre=2 THEN n.nota END) as b2,
                   AVG(CASE WHEN n.bimestre=3 THEN n.nota END) as b3,
                   AVG(CASE WHEN n.bimestre=4 THEN n.nota END) as b4,
                   AVG(n.nota) as media
            FROM notas n JOIN alunos a ON a.id = n.aluno_id
            GROUP BY n.aluno_id, n.disciplina ORDER BY a.nome
        ")->fetchAll();
        jsonOk($medias);
    }

    $where = '1=1'; $params = [];
    if ($alunoId) { $where .= ' AND n.aluno_id = ?'; $params[] = $alunoId; }
    if ($disc)    { $where .= ' AND n.disciplina = ?'; $params[] = $disc; }
    if ($bim)     { $where .= ' AND n.bimestre = ?'; $params[] = $bim; }

    $stmt = $db->prepare("
        SELECT n.*, a.nome as aluno_nome, a.matricula, a.turma, p.nome as prof_nome
        FROM notas n
        JOIN alunos a ON a.id = n.aluno_id
        LEFT JOIN professores p ON p.id = n.professor_id
        WHERE $where ORDER BY n.created_at DESC LIMIT 300
    ");
    $stmt->execute($params);
    $notas = $stmt->fetchAll();
    $alunos = $db->query('SELECT id, nome, matricula FROM alunos WHERE ativo=1 ORDER BY nome')->fetchAll();
    $discs  = $db->query('SELECT DISTINCT disciplina FROM notas ORDER BY disciplina')->fetchAll(PDO::FETCH_COLUMN);
    jsonOk(['notas' => $notas, 'alunos' => $alunos, 'disciplinas' => $discs]);
}

if ($method === 'POST') {
    $body       = getBody();
    $alunoId    = (int)($body['aluno_id'] ?? 0);
    $disciplina = trim($body['disciplina'] ?? '');
    $bimestre   = (int)($body['bimestre'] ?? 1);
    $nota       = (float)str_replace(',', '.', $body['nota'] ?? 0);
    $tipo       = trim($body['tipo'] ?? 'Prova');
    $obs        = trim($body['observacao'] ?? '');

    if ($nota < 0 || $nota > 10) jsonFail('Nota deve ser entre 0 e 10.', 422);
    if (!$alunoId || !$disciplina) jsonFail('Aluno e disciplina são obrigatórios.', 422);

    $db->prepare("INSERT INTO notas (aluno_id,professor_id,disciplina,bimestre,nota,tipo,observacao,data_lancamento) VALUES (?,?,?,?,?,?,?,date('now'))")
       ->execute([$alunoId, (int)$user['id'], $disciplina, $bimestre, $nota, $tipo, $obs]);
    $id = (int)$db->lastInsertId();
    logAction((int)$user['id'], 'lancar', 'nota', $id);

    $stmt = $db->prepare("SELECT n.*, a.nome as aluno_nome, a.matricula FROM notas n JOIN alunos a ON a.id=n.aluno_id WHERE n.id=?");
    $stmt->execute([$id]);
    jsonOk($stmt->fetch(), "Nota $nota lançada.");
}

if ($method === 'PUT') {
    $body = getBody();
    $id   = (int)($body['id'] ?? 0);
    $nota = (float)str_replace(',', '.', $body['nota'] ?? 0);
    $obs  = trim($body['observacao'] ?? '');
    if ($nota < 0 || $nota > 10) jsonFail('Nota inválida.', 422);
    $db->prepare('UPDATE notas SET nota=?, observacao=? WHERE id=?')->execute([$nota, $obs, $id]);
    logAction((int)$user['id'], 'editar', 'nota', $id);
    jsonOk(['id' => $id, 'nota' => $nota], 'Nota atualizada.');
}

if ($method === 'DELETE') {
    if ((int)$user['cargo'] > ROLE_DIRETOR) jsonFail('Permissão insuficiente.', 403);
    $id = (int)($_GET['id'] ?? (getBody()['id'] ?? 0));
    $db->prepare('DELETE FROM notas WHERE id=?')->execute([$id]);
    logAction((int)$user['id'], 'deletar', 'nota', $id);
    jsonOk(['id' => $id], 'Nota removida.');
}

jsonFail('Método não suportado.', 405);
