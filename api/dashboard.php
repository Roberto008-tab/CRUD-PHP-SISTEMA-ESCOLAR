<?php
// ============================================================
//  /api/dashboard.php — Estatísticas para o Dashboard React
// ============================================================
require_once __DIR__ . '/_middleware.php';

$user = requireApi();
$db   = getDB();

$totalAlunos   = (int)$db->query("SELECT COUNT(*) FROM alunos WHERE ativo=1")->fetchColumn();
$totalProfs    = (int)$db->query("SELECT COUNT(*) FROM professores WHERE ativo=1")->fetchColumn();
$totalUsuarios = (int)$db->query("SELECT COUNT(*) FROM usuarios WHERE ativo=1")->fetchColumn();
$mediaGeral    = round((float)$db->query("SELECT AVG(nota) FROM notas")->fetchColumn(), 1);
$totalRelats   = (int)$db->query("SELECT COUNT(*) FROM relatorios")->fetchColumn();

// Presença semana
$presStmt = $db->query("SELECT status, COUNT(*) as cnt FROM presenca WHERE data >= date('now','-7 days') GROUP BY status");
$presData = ['Presente' => 0, 'Ausente' => 0, 'Justificado' => 0];
foreach ($presStmt->fetchAll() as $r) $presData[$r['status']] = (int)$r['cnt'];
$totalPres = array_sum($presData);
$pctPres   = $totalPres ? round($presData['Presente'] / $totalPres * 100) : 0;

// Notas por disciplina
$discNotas = $db->query("SELECT disciplina, AVG(nota) as media, COUNT(*) as cnt FROM notas GROUP BY disciplina ORDER BY media DESC LIMIT 6")->fetchAll();

// Logs recentes
$logs = $db->query("SELECT l.*, u.nome, u.cargo FROM logs l LEFT JOIN usuarios u ON u.id = l.usuario_id ORDER BY l.created_at DESC LIMIT 10")->fetchAll();

// Alunos recentes
$alunosRecentes = $db->query("SELECT id, matricula, nome, turma, serie, created_at FROM alunos ORDER BY created_at DESC LIMIT 5")->fetchAll();

// Relatorios recentes
$relRecentes = $db->query("SELECT id, titulo, tipo, created_at FROM relatorios ORDER BY created_at DESC LIMIT 3")->fetchAll();

jsonOk([
    'totais' => [
        'alunos'    => $totalAlunos,
        'professores' => $totalProfs,
        'usuarios'  => $totalUsuarios,
        'media_geral' => $mediaGeral ?: 0,
        'relatorios'  => $totalRelats,
        'pct_presenca' => $pctPres,
    ],
    'presenca_semana' => [
        'presente'    => $presData['Presente'],
        'ausente'     => $presData['Ausente'],
        'justificado' => $presData['Justificado'],
        'total'       => $totalPres,
        'pct'         => $pctPres,
    ],
    'notas_disciplinas' => $discNotas,
    'logs_recentes'     => $logs,
    'alunos_recentes'   => $alunosRecentes,
    'relatorios_recentes' => $relRecentes,
]);
