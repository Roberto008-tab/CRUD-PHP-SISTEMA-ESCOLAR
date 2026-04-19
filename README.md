# 🎓 EduGestor v3 — Unified School Management

O **EduGestor v3** é uma plataforma full-stack de alto desempenho para gestão escolar. Esta versão marca a evolução definitiva de um sistema legado para uma arquitetura moderna e escalável, utilizando **React** no frontend e uma **API PHP robusta** no backend, integrada a serviços de nuvem líderes de mercado.

---

## 🌟 Diferenciais da Versão 3.0

* **Arquitetura Híbrida:** Performance de banco de dados local (**SQLite**) com a segurança da persistência em nuvem (**Supabase**).
* **Comunicação Automatizada:** Fluxo de notificação de relatórios via e-mail utilizando a infraestrutura do **SendGrid**.
* **Segurança Avançada:** Sistema de permissões baseado em cargos (RBAC) e proteção total de credenciais via variáveis de ambiente (`.env`).
* **Interface Progressiva:** UI moderna construída com **Tailwind CSS 4.0**, focada na experiência do usuário (UX).

---

## 🚀 Tecnologias e Integrações

### Frontend
* **React 18 + TypeScript:** Tipagem estática para um código livre de erros.
* **Vite:** Build tool de última geração.
* **Tailwind CSS 4.0:** Estilização utilitária de alta performance.
* **Context API:** Gerenciamento de estado global e autenticação.

### Backend & Cloud
* **PHP 8.x API:** Endpoints otimizados para comunicação JSON.
* **SQLite 3 + PDO:** Banco de dados relacional ágil com proteção contra SQL Injection.
* **Supabase Cloud:** Sincronização e backup externo de relatórios críticos.
* **SendGrid API:** Motor de disparo de e-mails transacionais para responsáveis.

---

## 📦 Estrutura do Ecossistema

```text
escola/
├── api/                # Endpoints REST (Auth, Relatórios, Alunos, Notas)
├── frontend/           # Aplicação Single Page (SPA) em React
│   ├── src/
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── pages/      # Telas principais (Dashboard, Relatórios, etc.)
│   │   └── services/   # Camada de comunicação com a API (Axios)
├── database/           # Persistência local (SQLite)
├── includes/           # Configurações globais e Core do sistema
└── .env                # Cofre de chaves (Supabase, SendGrid, OpenAI)
🔧 Configuração e Instalação

Backend:

Certifique-se de ter o PHP 8.x instalado.
Configure o arquivo .env com suas chaves do Supabase e SendGrid.
O banco SQLite será gerado automaticamente no primeiro acesso.

Frontend:
    Bash
cd frontend
npm install
npm run dev

🛠️ Funcionalidades Principais

Dashboard Administrativo: Visão geral de métricas da instituição.
Gestão Acadêmica: Controle completo de alunos, professores e turmas.
Lançamento de Notas e Presença: Interface intuitiva para o corpo docente.
Gerador de Relatórios: Consolidação de dados com opção de backup em nuvem e envio imediato por e-mail.