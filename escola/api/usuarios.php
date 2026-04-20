<?php
// ============================================================
//  /api/usuarios.php
// ============================================================
require_once __DIR__ . '/_middleware.php';

// Define o header de JSON antes de qualquer coisa
header('Content-Type: application/json');

try {
    // 1. Verifica se é Admin (Se falhar, o middleware deve lançar uma exceção ou jsonFail)
    $user   = requireRoleApi(ROLE_ADMIN); 
    $method = $_SERVER['REQUEST_METHOD'];
    $db     = getDB();
    global $ROLE_NAMES;

    if ($method === 'GET') {
        // Busca os usuários
        $stmt = $db->query("SELECT id, login, nome, email, cargo, ativo, created_at FROM usuarios ORDER BY cargo, nome");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Retorna no formato exato que o React espera
        echo json_encode([
            'success' => true,
            'usuarios' => $usuarios,
            'cargos'   => $ROLE_NAMES
        ]);
        exit;
    }

    if ($method === 'POST') {
        $body  = getBody();
        $login = trim($body['login'] ?? '');
        $senha = trim($body['senha'] ?? '');
        $nome  = trim($body['nome'] ?? '');
        $email = trim($body['email'] ?? '');
        $cargo = (int)($body['cargo'] ?? ROLE_PROFESSOR);

        if (!$login || !$senha || !$nome) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Login, senha e nome são obrigatórios.']);
            exit;
        }

        $db->prepare("INSERT INTO usuarios (login,senha_hash,nome,email,cargo) VALUES (?,?,?,?,?)")
           ->execute([$login, password_hash($senha, PASSWORD_DEFAULT), $nome, $email, $cargo]);
        
        $id = (int)$db->lastInsertId();
        logAction((int)$user['id'], 'criar', 'usuario', $id);
        
        echo json_encode(['success' => true, 'id' => $id, 'message' => "Usuário $nome criado."]);
        exit;
    }

    if ($method === 'PUT') {
        $body  = getBody();
        $id    = (int)($body['id'] ?? 0);
        $ativo = isset($body['ativo']) ? (int)$body['ativo'] : null;

        if (!$id) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'ID obrigatório.']);
            exit;
        }

        if ($ativo !== null) {
            $db->prepare("UPDATE usuarios SET ativo=? WHERE id=?")->execute([$ativo, $id]);
        } else {
            $nome  = trim($body['nome'] ?? '');
            $email = trim($body['email'] ?? '');
            $cargo = (int)($body['cargo'] ?? ROLE_PROFESSOR);
            
            $db->prepare("UPDATE usuarios SET nome=?, email=?, cargo=?, updated_at=datetime('now') WHERE id=?")
               ->execute([$nome, $email, $cargo, $id]);

            if (!empty($body['nova_senha'])) {
                $db->prepare("UPDATE usuarios SET senha_hash=? WHERE id=?")
                   ->execute([password_hash(trim($body['nova_senha']), PASSWORD_DEFAULT), $id]);
            }
        }
        
        logAction((int)$user['id'], 'editar', 'usuario', $id);
        echo json_encode(['success' => true, 'message' => 'Usuário atualizado.']);
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}

// Se chegar aqui, o método não é permitido
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método não suportado.']);