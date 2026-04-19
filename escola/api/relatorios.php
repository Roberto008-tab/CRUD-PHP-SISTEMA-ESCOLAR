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
        
        // 1. Busca o relatório completo no banco local
        $stmt = $db->prepare("SELECT * FROM relatorios WHERE id=?");
        $stmt->execute([$relId]);
        $relLocal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$relLocal) jsonFail('Relatório não encontrado localmente.', 404);

        // 2. Prepara os dados exatos para o Supabase
        $dadosSupabase = [
            'id' => (int)$relLocal['id'], // Mantém o mesmo ID
            'titulo' => $relLocal['titulo'],
            'tipo' => $relLocal['tipo'],
            'periodo_inicio' => $relLocal['periodo_inicio'],
            'periodo_fim' => $relLocal['periodo_fim'],
            'dados' => json_decode($relLocal['dados']), // Envia como JSON real
            'gerado_por' => (int)$relLocal['gerado_por']
        ];

        // 3. Verifica se as chaves existem
        if (empty(SUPABASE_URL) || empty(SUPABASE_ANON_KEY)) {
            jsonFail('Chaves do Supabase não configuradas.', 500);
        }

        // 4. A Ponte: Conexão cURL real com o Supabase
        $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/relatorios';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dadosSupabase));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_ANON_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 5. Se o Supabase aceitar (201 Created), marca no local
        if ($httpCode === 201) {
            $db->prepare("UPDATE relatorios SET enviado_nuvem=1 WHERE id=?")->execute([$relId]);
            logAction((int)$user['id'], 'envio_nuvem', 'relatorio', $relId);
            jsonOk(['id' => $relId], 'Relatório sincronizado com o Supabase com sucesso!');
        } else {
            // Se der erro, avisa o React (não coloca a nuvenzinha)
            jsonFail('Erro ao enviar para o Supabase. Código: ' . $httpCode . ' Resposta: ' . $response, 500);
        }
    } 
    
    if ($acao === 'enviar_email') {
        $relId = (int)($body['relatorio_id'] ?? 0);
        $emailDestino = $body['email'] ?? ''; // O e-mail do pai ou professor
        
        if (empty($emailDestino)) jsonFail('E-mail de destino não informado.', 400);
        if (empty(SENDGRID_API_KEY) || empty(EMAIL_FROM)) jsonFail('SendGrid não configurado no .env.', 500);

        // 1. Busca os dados do relatório no banco
        $stmt = $db->prepare("SELECT * FROM relatorios WHERE id=?");
        $stmt->execute([$relId]);
        $relLocal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$relLocal) jsonFail('Relatório não encontrado.', 404);

        // 2. Monta o corpo do e-mail (HTML)
        $html = "<div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>";
        $html .= "<h2 style='color: #4F46E5;'>Relatório Escolar: " . $relLocal['titulo'] . "</h2>";
        $html .= "<p>Olá! Um novo relatório (<b>" . $relLocal['tipo'] . "</b>) já está disponível no sistema.</p>";
        $html .= "<p><b>Período:</b> " . date('d/m/Y', strtotime($relLocal['periodo_inicio'])) . " a " . date('d/m/Y', strtotime($relLocal['periodo_fim'])) . "</p>";
        $html .= "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>";
        $html .= "<p style='font-size: 12px; color: #777;'>Mensagem automática enviada pelo <b>EduGestor</b>.</p>";
        $html .= "</div>";

        // 3. Prepara o "pacote" exigido pelo SendGrid
        $sendgridData = [
            "personalizations" => [
                [
                    "to" => [ ["email" => $emailDestino] ],
                    "subject" => "EduGestor: Novo Relatório Disponível"
                ]
            ],
            "from" => [
                "email" => EMAIL_FROM, // O e-mail que você validou
                "name" => APP_NAME     // "EduGestor" (puxa do config.php)
            ],
            "content" => [
                [
                    "type" => "text/html",
                    "value" => $html
                ]
            ]
        ];

        // 4. Dispara o E-mail pela API do SendGrid
        $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sendgridData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . SENDGRID_API_KEY,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // O SendGrid retorna 202 (Accepted) quando dá sucesso
        if ($httpCode >= 200 && $httpCode < 300) {
            logAction((int)$user['id'], 'envio_email', 'relatorio', $relId);
            jsonOk(['id' => $relId], 'E-mail enviado com sucesso!');
        } else {
            jsonFail('Erro no SendGrid (Código ' . $httpCode . '). Resposta: ' . $response, 500);
        }
    }
}

jsonFail('Método não suportado.', 405);
