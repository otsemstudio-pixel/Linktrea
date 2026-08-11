// Détection automatique de plateforme depuis une URL collée (prompt "Icônes
// de plateformes et collage d'URL auto-détecté", Partie 2) — remplace la
// sélection manuelle de plateforme + saisie de pseudo par un champ unique :
// on colle l'URL du profil, on en déduit la plateforme et le pseudo.
import type { TickerPlatform } from '@/types'

export type PlatformDetection = { ok: true; platform: TickerPlatform; handle: string } | { ok: false }

function firstSegment(pathname: string): string | null {
  return pathname.split('/').filter(Boolean)[0] || null
}

// Une règle par plateforme détectable — hosts en minuscules (déjà garanti
// par URL.hostname), extractHandle reçoit le pathname BRUT (avec le slash
// de tête) et renvoie null si la forme ne correspond pas à un gabarit de
// profil connu pour cette plateforme (ex. la racine du domaine) : la règle
// est alors ignorée, jamais une détection à moitié fausse.
type PlatformRule = {
  platform: TickerPlatform
  hosts: string[]
  extractHandle: (pathname: string) => string | null
}

const RULES: PlatformRule[] = [
  {
    platform: 'linkedin',
    hosts: ['linkedin.com', 'www.linkedin.com'],
    extractHandle: (path) => {
      const parts = path.split('/').filter(Boolean)
      return parts[0] === 'in' && parts[1] ? parts[1] : null
    },
  },
  {
    // twitter.com redirige vers x.com depuis le rachat — les deux domaines
    // restent en usage réel, voir le prompt.
    platform: 'x',
    hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
    extractHandle: firstSegment,
  },
  {
    platform: 'instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
    extractHandle: firstSegment,
  },
  {
    platform: 'tiktok',
    hosts: ['tiktok.com', 'www.tiktok.com'],
    extractHandle: (path) => {
      const seg = firstSegment(path)
      return seg?.startsWith('@') ? seg.slice(1) : null
    },
  },
  {
    platform: 'github',
    hosts: ['github.com', 'www.github.com'],
    extractHandle: firstSegment,
  },
  {
    platform: 'behance',
    hosts: ['behance.net', 'www.behance.net'],
    extractHandle: firstSegment,
  },
  {
    // /@handle (format actuel) et /c/handle (ancien format "chaîne
    // personnalisée", encore répandu dans des liens déjà partagés) — voir le
    // prompt. Toujours reconstruit en /@handle à l'écriture (tickerUrl.ts).
    platform: 'youtube',
    hosts: ['youtube.com', 'www.youtube.com'],
    extractHandle: (path) => {
      const parts = path.split('/').filter(Boolean)
      if (parts[0]?.startsWith('@')) return parts[0].slice(1)
      if (parts[0] === 'c' && parts[1]) return parts[1]
      return null
    },
  },
]

// https:// obligatoire avant tout traitement (cohérent avec la validation
// déjà prévue côté schéma — voir httpsUrlSchema dans schema.ts) — une chaîne
// qui n'est même pas une URL valide, ou qui l'est mais pas en https, est
// rejetée ici, jamais interprétée comme un lien "générique" quand même.
export function detectPlatformFromUrl(input: string): PlatformDetection {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { ok: false }
  }
  if (url.protocol !== 'https:') return { ok: false }

  const host = url.hostname.toLowerCase()
  for (const rule of RULES) {
    if (!rule.hosts.includes(host)) continue
    const handle = rule.extractHandle(url.pathname)
    if (handle) return { ok: true, platform: rule.platform, handle }
  }

  // Aucun gabarit connu ne correspond — jamais un blocage de la saisie (voir
  // le prompt) : plateforme générique 'website', domaine tel quel comme
  // libellé, l'URL complète reste le lien réel.
  return { ok: true, platform: 'website', handle: host.replace(/^www\./, '') }
}
