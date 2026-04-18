# 🎓 EduGestor v3.0 — Unified (PHP + React)

> Backend PHP real + Interface React moderna. O melhor dos dois mundos.

---

## 🏗️ Arquitetura

```
escola/
├── index.php              ← Login PHP clássico (SSR)
├── dashboard.php          ← Dashboard PHP clássico (SSR)
├── alunos.php             ← CRUD PHP clássico (SSR)
├── professores.php        ← ... idem ...
├── notas.php
├── presenca.php
├── relatorios.php
├── usuarios.php
├── tokens.php
├── logout.php
│
├── config.php             ← Configurações globais + chaves de API
├── includes/
│   ├── db.php             ← PDO SQLite + schema + seed
│   ├── auth.php           ← Sessão, RBAC, login, logout, logs
│   └── layout.php         ← Sidebar + Topbar (PHP SSR)
│
├── api/                   ← 🆕 REST API JSON (PHP → React)
│   ├── _middleware.php    ← CORS, JSON headers, helpers
│   ├── auth.php           ← POST /login, GET /me, GET /logout
│   ├── dashboard.php      ← GET /dashboard (estatísticas)
│   ├── alunos.php         ← GET/POST/PUT/DELETE /alunos
│   ├── professores.php    ← GET/POST/PUT/DELETE /professores
│   ├── notas.php          ← GET/POST/PUT/DELETE /notas
│   ├── presenca.php       ← GET/POST /presenca
│   ├── relatorios.php     ← GET/POST /relatorios
│   ├── usuarios.php       ← GET/POST/PUT /usuarios (Admin only)
│   └── tokens.php         ← GET/POST/DELETE /tokens (Admin only)
│
├── database/
│   └── escola.db          ← SQLite (criado automaticamente)
│
├── assets/
│   ├── style.css          ← CSS compartilhado (PHP + React usa igual)
│   └── app.js             ← JS do PHP SSR
│
└── frontend/              ← 🆕 React (upgrade visual)
    ├── src/
    │   ├── App.tsx        ← Rotas protegidas
    │   ├── types.ts       ← Tipos TypeScript alinhados ao DB
    │   ├── services/api.ts← Fetch → PHP API
    │   ├── context/       ← AuthContext (sessão PHP real)
    │   ├── components/    ← Layout com sidebar
    │   └── pages/         ← Dashboard, Alunos, Professores...
    ├── package.json
    └── vite.config.ts     ← Proxy /api → PHP
```

---

## 🚀 Como Rodar

### Pré-requisitos
- PHP 8.1+ com extensões: `pdo`, `pdo_sqlite`, `json`
- Node.js 18+
- Servidor web (Apache/Nginx) **ou** PHP built-in

---

### Opção A — PHP Clássico (SSR puro, sem Node)

```bash
# 1. Coloque a pasta escola/ na raiz do servidor web

# Apache:
sudo cp -r escola/ /var/www/html/
# Nginx: configure root para escola/

# 2. Rode com PHP built-in (desenvolvimento):
cd escola/
php -S localhost:8080

# 3. Acesse:
# http://localhost:8080/index.php
```

---

### Opção B — React + PHP (Recomendado)

```bash
# Terminal 1 — Backend PHP
cd escola/
php -S localhost:8080

# Terminal 2 — Frontend React (dev)
cd escola/frontend/
npm install
npm run dev

# Acesse:
# http://localhost:5173  ← React (proxy → PHP)
# http://localhost:8080  ← PHP SSR puro
```

---

### Opção C — Build de Produção

```bash
# 1. Build React
cd escola/frontend/
npm install
npm run build
# Gera: escola/dist/

# 2. Configure o servidor para:
#    - Servir escola/dist/ em /
#    - PHP em localhost:8080 (separado)
#    - Proxy /api/* → localhost:8080/escola/api/*

# Nginx config:
# server {
#   root /var/www/escola/dist;
#   location /api/ {
#     proxy_pass http://localhost:8080/escola/api/;
#   }
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
# }
```

---

## 🔑 Credenciais de Demonstração

| Cargo | Login | Senha | Nível |
|-------|-------|-------|-------|
| Administrador | `admin` | `admin123` | 1 (total) |
| Diretor | `diretor` | `diretor123` | 2 |
| Secretaria | `secretaria` | `sec123` | 3 |
| Professor | `professor` | `prof123` | 4 |

> ⚠️ Altere antes de ir para produção! Edite `config.php` → `$DEFAULT_USERS`

---

## 🔐 RBAC — Hierarquia de Permissões

| Ação | Admin | Diretor | Secretaria | Professor |
|------|:-----:|:-------:|:----------:|:---------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Ver alunos | ✅ | ✅ | ✅ | ✅ |
| Criar/editar alunos | ✅ | ✅ | ✅ | ❌ |
| Deletar alunos | ✅ | ✅ | ❌ | ❌ |
| Lançar notas | ✅ | ✅ | ✅ | ✅ |
| Gerar relatórios | ✅ | ✅ | ❌ | ❌ |
| Enviar para nuvem | ✅ | ✅ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Gerenciar tokens | ✅ | ❌ | ❌ | ❌ |

---

## ⚙️ Configurações (config.php)

```php
// Integrações externas (opcional)
define('SUPABASE_URL',     'https://xxx.supabase.co');
define('SUPABASE_ANON_KEY','eyJ...');
define('OPENAI_API_KEY',   'sk-proj-...');
define('SENDGRID_API_KEY', 'SG...');
define('WEBHOOK_URL',      'https://hooks.slack.com/...');

// Sessão
define('SESSION_LIFETIME', 3600); // 1 hora
```

---

## 🌐 API REST Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth.php` | Login |
| GET | `/api/auth.php?action=me` | Usuário atual |
| GET | `/api/auth.php?action=logout` | Logout |
| GET | `/api/dashboard.php` | Estatísticas |
| GET/POST/PUT/DELETE | `/api/alunos.php` | CRUD alunos |
| GET/POST/PUT/DELETE | `/api/professores.php` | CRUD professores |
| GET/POST/PUT/DELETE | `/api/notas.php` | CRUD notas |
| GET | `/api/notas.php?boletim=1` | Boletim geral |
| GET/POST | `/api/presenca.php` | Chamadas |
| GET | `/api/presenca.php?action=frequencia` | Frequência |
| GET/POST | `/api/relatorios.php` | Relatórios |
| GET/POST/PUT | `/api/usuarios.php` | Usuários (Admin) |
| GET/POST/DELETE | `/api/tokens.php` | Tokens (Admin) |

---

## 🛠️ Stack Tecnológica

**Backend (PHP)**
- PHP 8.1+ · PDO SQLite · Sessions
- Autenticação com `password_hash` / `password_verify`
- RBAC com 4 níveis hierárquicos
- Logs de auditoria em banco de dados
- API REST JSON para o React

**Frontend (React)**
- React 19 · TypeScript · Vite 7
- React Router 7 · Lucide React
- Fetch API com cookies de sessão PHP
- Mesma folha de estilo CSS do PHP (design unificado)

---

## 📝 Diferenças entre PHP SSR e React

| Funcionalidade | PHP SSR | React |
|---------------|---------|-------|
| Login | ✅ Formulário HTML | ✅ Com preenchimento automático |
| Dashboard | ✅ | ✅ + Animações |
| CRUD Alunos | ✅ | ✅ + UX mais fluida |
| Boletim | ✅ | ✅ |
| Chamada | ✅ | ✅ + Melhor UX mobile |
| Relatórios | ✅ | ✅ + Visualização inline |
| Tokens de API | ✅ | ✅ + Toggle reveal |
| Hierarquia de cargos | ✅ | ✅ Cards visuais |

---

## 🗄️ Schema do Banco (SQLite)

```sql
usuarios    — id, login, senha_hash, nome, email, cargo(1-4), ativo
alunos      — id, matricula, nome, email, turma, serie, turno, responsavel...
professores — id, registro, nome, email, disciplina, formacao, turmas...
notas       — id, aluno_id, professor_id, disciplina, bimestre, nota, tipo...
presenca    — id, aluno_id, professor_id, disciplina, data, status...
tokens_api  — id, nome, servico, token, descricao, ativo...
relatorios  — id, titulo, tipo, periodo_inicio, periodo_fim, dados(JSON)...
logs        — id, usuario_id, acao, entidade, entidade_id, ip, created_at
```

---

## 📄 Licença

MIT — Livre para uso educacional e comercial.

---

**EduGestor v3.0 Unified** · PHP Backend + React Frontend · 2025
