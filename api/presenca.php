<?php
// ============================================================
//  /api/presenca.php — Chamadas + histórico + frequência
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireApi();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $action  = $_GET['action'] ?? 'historico';
    $alunoId = (int)($_GET['aluno_id'] ?? 0);
    $disc    = trim($_GET['disciplina'] ?? '');
    $data    = trim($_GET['data'] ?? '');

    if ($action === 'turmas') {
        $alunos = $db->query("SELECT id,nome,matricula,turma FROM alunos WHERE ativo=1 ORDER BY nome")->fetchAll();
        $turmas = $db->query("SELECT DISTINCT turma FROM alunos WHERE ativo=1 ORDER BY turma")->fetchAll(PDO::FETCH_COLUMN);
        $discs  = $db->query("SELECT DISTINCT disciplina FROM presenca ORDER BY disciplina")->fetchAll(PDO::FETCH_COLUMN);
        jsonOk(['alunos' => $alunos, 'turmas' => $turmas, 'disciplinas' => $discs]);
    }

    if ($action === 'frequencia') {
        $stats = $db->query("
            SELECT a.nome, a.matricula, a.turma,
                COUNT(*) as total,
                SUM(CASE WHEN p.status='Presente'    THEN 1 ELSE 0 END) as presentes,
                SUM(CASE WHEN p.status='Ausente'     THEN 1 ELSE 0 END) as ausentes,
                SUM(CASE WHEN p.status='Justificado' THEN 1 ELSE 0 END) as justificados
            FROM presenca p JOIN alunos a ON a.id = p.aluno_id
            GROUP BY p.aluno_id ORDER BY a.nome
        ")->fetchAll();
        jsonOk($stats);
    }

    // Histórico
    $where = '1=1'; $params = [];
    if ($alunoId) { $where .= ' AND p.aluno_id=?'; $params[] = $alunoId; }
    if ($disc)    { $where .= ' AND p.disciplina=?'; $params[] = $disc; }
    if ($data)    { $where .= ' AND p.data=?'; $params[] = $data; }

    $stmt = $db->prepare("
        SELECT p.*, a.nome as aluno_nome, a.matricula, a.turma
        FROM presenca p JOIN alunos a ON a.id = p.aluno_id
        WHERE $where ORDER BY p.data DESC, a.nome LIMIT 300
    ");
    $stmt->execute($params);
    jsonOk($stmt->fetchAll());
}

if ($method === 'POST') {
    $body       = getBody();
    $disciplina = trim($body['disciplina'] ?? '');
    $data       = trim($body['data'] ?? '');
    $presencas  = $body['presencas'] ?? []; // [{aluno_id, status, observacao}]

    if (!$disciplina || !$data) jsonFail('Disciplina e data são obrigatórios.', 422);
    if (empty($presencas)) jsonFail('Nenhum registro de presença enviado.', 422);

    $db->prepare('DELETE FROM presenca WHERE disciplina=? AND data=?')->execute([$disciplina, $data]);

    $stmt = $db->prepare('INSERT INTO presenca (aluno_id,professor_id,disciplina,data,status,observacao) VALUES (?,?,?,?,?,?)');
    foreach ($presencas as $p) {
        $stmt->execute([(int)$p['aluno_id'], (int)$user['id'], $disciplina, $data, $p['status'] ?? 'Presente', trim($p['observacao'] ?? '')]);
    }
    logAction((int)$user['id'], 'chamada', 'presenca', 0);
    jsonOk(['registros' => count($presencas)], "Chamada registrada: $disciplina em $data.");
}

jsonFail('Método não suportado.', 405);
