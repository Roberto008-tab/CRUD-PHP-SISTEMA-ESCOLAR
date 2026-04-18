# 🎓 EduGestor v3 — Sistema de Gerenciamento Escolar

O **EduGestor** é uma plataforma full-stack moderna para gestão de instituições de ensino. Esta versão (v3 Unified) marca a migração de um sistema PHP legado para uma arquitetura desvinculada, utilizando **React** no frontend e **PHP** como uma API funcional no backend com **SQLite**.

---

## 🚀 Tecnologias Utilizadas

### Frontend
* **React 18** com **TypeScript**
* **Vite** (Build tool ultra-rápida)
* **Tailwind CSS 4.0** (Estilização moderna e utilitária)
* **Lucide React** (Ícones)
* **Axios** (Comunicação com API)

### Backend
* **PHP 8.x** (Arquitetura orientada a API)
* **SQLite 3** (Banco de dados ágil e sem necessidade de configuração complexa)
* **PDO** (Segurança contra SQL Injection)
* **Blindagem .env** (Proteção de chaves de API)

---

## 📦 Estrutura do Projeto

```text
escola/
├── api/              # Endpoints da API PHP (Auth, Alunos, Notas, etc.)
├── frontend/         # Código fonte do React (Interface do usuário)
├── includes/         # Configurações globais e conexão com banco
├── database/         # Arquivo do banco de dados SQLite (Ignorado no Git)
└── .env.example      # Modelo de variáveis de ambiente