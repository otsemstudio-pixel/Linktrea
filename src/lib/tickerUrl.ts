import type { TickerPlatform } from '@/types'

// website est la seule plateforme où la personne saisit une URL plutôt
// qu'un simple identifiant — donc la seule où il faut vraiment normaliser le
// protocole plutôt que le déduire d'un gabarit fixe. `startsWith('http')`
// laissait auparavant passer un http:// non chiffré tel quel (le prompt
// impose https:// uniquement, voir schema.ts) ; on force maintenant https
// systématiquement, y compris pour une adresse saisie en http://.
function normalizeWebsiteUrl(handle: string): string {
  if (/^https?:\/\//i.test(handle)) {
    return handle.replace(/^http:\/\//i, 'https://')
  }
  return `https://${handle}`
}

const URL_TEMPLATES: Record<TickerPlatform, (handle: string) => string> = {
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  github: (h) => `https://github.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  behance: (h) => `https://behance.net/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  // Toujours reconstruit au format moderne @handle (voir detectPlatform.ts,
  // qui accepte aussi youtube.com/c/{handle} en lecture mais ne produit
  // jamais que ce format-ci) — tiktok.com n'a jamais eu de format /c/.
  tiktok: (h) => `https://tiktok.com/@${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  email: (h) => `mailto:${h}`,
  website: normalizeWebsiteUrl,
}

export function buildTickerUrl(platform: TickerPlatform, handle: string): string {
  if (!handle) return ''
  return URL_TEMPLATES[platform](handle.trim())
}
