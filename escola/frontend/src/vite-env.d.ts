/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_SENDGRID_FROM?: string;
  readonly VITE_WEBHOOK_URL?: string;
  readonly VITE_WEBHOOK_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
