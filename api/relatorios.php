<?php
// ============================================================
//  /api/relatorios.php
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user   = requireApi();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id) {
        $stmt = $db->prepare("SELECT r.*, u.nome as gerado_por_nome FROM relatorios r LEFT JOIN usuarios u ON u.id=r.gerado_por WHERE r.id=?");
        $stmt->execute([$id]);
        $r = $stmt->fetch();
        if (!$r) jsonFail('Relatório não encontrado.', 404);
        $r['dados'] = json_decode($r['dados'], true);
        jsonOk($r);
    }
    $relatorios = $db->query("SELECT r.*, u.nome as gerado_por_nome FROM relatorios r LEFT JOIN usuarios u ON u.id=r.gerado_por ORDER BY r.created_at DESC")->fetchAll();
    foreach ($relatorios as &$r) $r['dados'] = json_decode($r['dados'], true);
    jsonOk($relatorios);
}

if ($method === 'POST') {
    if ((int)$user['cargo'] > ROLE_DIRETOR) jsonFail('Permissão insuficiente.', 403);
    $body = getBody();
    $acao = $body['acao'] ?? 'gerar';

    if ($acao === 'gerar') {
        $ini  = $body['periodo_inicio'] ?? date('Y-m-d', strtotime('-7 days'));
        $fim  = $body['periodo_fim']    ?? date('Y-m-d');
        $tipo = $body['tipo'] ?? 'Semanal';

        $pstmt = $db->prepare("SELECT COUNT(DISTINCT data) FROM presenca WHERE data BETWEEN ? AND ?");
        $pstmt->execute([$ini, $fim]); $totalAulas = (int)$pstmt->fetchColumn();

        $freq = $db->prepare("SELECT SUM(CASE WHEN status='Presente' THEN 1 ELSE 0 END) as presentes, SUM(CASE WHEN status='Ausente' THEN 1 ELSE 0 END) as ausentes, COUNT(*) as total FROM presenca WHERE data BETWEEN ? AND ?");
        $freq->execute([$ini, $fim]); $freqData = $freq->fetch();

        $notasData = $db->prepare("SELECT disciplina, AVG(nota) as media, COUNT(*) as cnt FROM notas WHERE data_lancamento BETWEEN ? AND ? GROUP BY disciplina");
        $notasData->execute([$ini, $fim]); $notasData = $notasData->fetchAll();

        $stNA = $db->prepare("SELECT COUNT(*) FROM alunos WHERE date(created_at) BETWEEN ? AND ?");
        $stNA->execute([$ini, $fim]); $novosAlunos = (int)$stNA->fetchColumn();

        $dados  = json_encode(['periodo'=>['inicio'=>$ini,'fim'=>$fim],'frequencia'=>$freqData,'notas'=>$notasData,'novos_alunos'=>$novosAlunos,'total_aulas'=>$totalAulas]);
        $titulo = "$tipo — " . date('d/m/Y', strtotime($ini)) . " a " . date('d/m/Y', strtotime($fim));
        $db->prepare("INSERT INTO relatorios (titulo,tipo,periodo_inicio,periodo_fim,dados,gerado_por) VALUES (?,?,?,?,?,?)")->execute([$titulo,$tipo,$ini,$fim,$dados,(int)$user['id']]);
        $id = (int)$db->lastInsertId();
        logAction((int)$user['id'], 'gerar', 'relatorio', $id);
        $stmt = $db->prepare("SELECT r.*, u.nome as gerado_por_nome FROM relatorios r LEFT JOIN usuarios u ON u.id=r.gerado_por WHERE r.id=?");
        $stmt->execute([$id]); $r = $stmt->fetch(); $r['dados'] = json_decode($r['dados'], true);
        jsonOk($r, "Relatório $titulo gerado.");
    }

    if ($acao === 'marcar_nuvem') {
        $relId = (int)($body['relatorio_id'] ?? 0);
        $db->prepare("UPDATE relatorios SET enviado_nuvem=1 WHERE id=?")->execute([$relId]);
        logAction((int)$user['id'], 'envio_nuvem', 'relatorio', $relId);
        jsonOk(['id' => $relId], 'Relatório marcado como enviado para nuvem.');
    }
}

jsonFail('Método não suportado.', 405);
