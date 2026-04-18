// ============================================================
// ENTRY POINT — Fase 1 SEGURANÇA
// ============================================================
// CRIT-2: Inicialização async com PBKDF2 para seed de senhas
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./style.css";
import App from "./App";
// Correção aqui: apontando para o arquivo security.ts
import { initApp } from "./utils/security"; 

// CRIT-2: Aguardar inicialização async (PBKDF2 hashing de senhas seed)
initApp().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}).catch((err) => {
  console.error("[SEGURANÇA] Falha na inicialização:", err);
  // Mostrar erro na tela
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#030712;color:#f87171;font-family:system-ui;padding:2rem;text-align:center">
        <div>
          <h1 style="font-size:1.5rem;margin-bottom:1rem">⚠️ Erro de Inicialização</h1>
          <p style="color:#9ca3af">Não foi possível inicializar o sistema seguro.</p>
          <p style="color:#6b7280;margin-top:0.5rem;font-size:0.875rem">Verifique o console para detalhes.</p>
        </div>
      </div>
    `;
  }
});