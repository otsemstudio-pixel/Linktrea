// Anti-abus sur l'envoi de lien magique, côté client (refonte sécurité,
// Phase 3) — le plan gratuit Supabase limite l'envoi SMTP à ~2 emails/heure ;
// un formulaire non protégé permet à un tiers de vider ce quota et
// d'empêcher un vrai utilisateur de recevoir son lien. Purement dissuasif :
// contournable par qui vide son localStorage, ce n'est pas ce qui arrête un
// attaquant déterminé (voir le CAPTCHA Turnstile pour ça) — juste un frein
// contre l'usage maladroit (clics répétés) avec un message clair plutôt
// qu'un blocage muet.
const STORAGE_KEY = 'linktrea:otp-attempts'
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 3

type AttemptLog = Record<string, number[]>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readLog(): AttemptLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AttemptLog) : {}
  } catch {
    return {}
  }
}

function writeLog(log: AttemptLog): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
}

function recentAttempts(log: AttemptLog, key: string, now: number): number[] {
  return (log[key] ?? []).filter((t) => now - t < WINDOW_MS)
}

export type RateLimitCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export function checkRateLimit(email: string): RateLimitCheck {
  const key = normalizeEmail(email)
  const now = Date.now()
  const recent = recentAttempts(readLog(), key, now)
  if (recent.length < MAX_ATTEMPTS) return { allowed: true }
  const oldest = Math.min(...recent)
  return { allowed: false, retryAfterSeconds: Math.ceil((oldest + WINDOW_MS - now) / 1000) }
}

// À appeler juste avant chaque tentative d'envoi réelle (pas seulement les
// succès) — c'est la requête envoyée à Supabase qui consomme le quota SMTP,
// pas seulement une réponse positive.
export function recordAttempt(email: string): void {
  const key = normalizeEmail(email)
  const now = Date.now()
  const log = readLog()
  const recent = recentAttempts(log, key, now)
  recent.push(now)
  log[key] = recent
  writeLog(log)
}

export function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconde${seconds > 1 ? 's' : ''}`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
