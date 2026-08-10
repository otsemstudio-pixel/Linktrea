/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STORAGE_MODE: 'local' | 'supabase' | undefined
  // Optionnelle : le formulaire de connexion fonctionne sans (juste sans
  // CAPTCHA), voir TurnstileWidget.tsx.
  readonly VITE_TURNSTILE_SITE_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
