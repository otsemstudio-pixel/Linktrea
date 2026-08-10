// Reconnaissance douce de l'email (refonte sécurité, Phase 2) — améliore
// l'interface (préremplissage, message de retour), n'authentifie jamais
// rien : la vérification réelle reste entièrement le lien magique. Jamais
// un cookie, jamais transmis à un serveur autre que Supabase lui-même (voir
// signInWithOtp dans LoginPage.tsx).
const STORAGE_KEY = 'linktrea:last-email'

export function getLastEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setLastEmail(email: string): void {
  localStorage.setItem(STORAGE_KEY, email)
}

export function clearLastEmail(): void {
  localStorage.removeItem(STORAGE_KEY)
}
