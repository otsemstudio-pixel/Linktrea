// Contenu personnalisable de la carte de partage (refonte carte de partage,
// Phase 2) — logique pure (modèle, limite par format), indépendante du
// dessin canvas (voir shareCard.ts) et de l'UI à cocher.
import type { ShareCardFormat } from './shareCard'
import type { ShareCardConfig } from '@/types'

export type ShareCardContent = Omit<ShareCardConfig, 'format'>

// Par défaut : chiffre clé + QR seulement — évite une carte surchargée au
// premier essai (voir le prompt).
export const DEFAULT_SHARE_CARD_CONTENT: ShareCardContent = {
  showKeyMetric: true,
  showTopSkills: false,
  showCertifications: false,
  showSignature: false,
  showQrCode: true,
}

// Configuration complète (format + contenu) — valeur figée par défaut pour
// un profil dont le propriétaire n'a jamais explicitement configuré sa
// carte (doc "Publication automatique optionnelle + clarification de
// l'export", Phase 3), reprise telle quelle par profileSchema.ts en cas
// d'absence/corruption du champ.
export const DEFAULT_SHARE_CARD_CONFIG: ShareCardConfig = {
  format: 'square',
  ...DEFAULT_SHARE_CARD_CONTENT,
}

// Nombre maximum d'éléments actifs simultanément selon le format — Portrait
// a beaucoup plus de hauteur disponible que Paysage (colonne étroite), voir
// le prompt. Le carré est le format d'origine, au milieu des deux — 3, pas
// 4 : le QR (bien plus grand que les autres blocs, voir shareCard.ts) a
// besoin qu'on lui laisse de la place, et 4 blocs de texte pleins la
// laissaient rarement (le QR finissait omis faute d'espace plutôt que
// simplement plus petit — voir MIN_QR_SIZE dans shareCard.ts).
const FORMAT_MAX_ITEMS: Record<ShareCardFormat, number> = {
  landscape: 3,
  square: 3,
  portrait: 5,
  // La carte de visite (Phase 5) a un contenu FIXE, jamais piloté par
  // ShareCardContent — resolveShareCardContent() n'est simplement jamais
  // appelée pour ce format, mais Record<ShareCardFormat, number> exige
  // quand même une entrée pour chaque clé du type.
  business: 0,
}

// Ordre de priorité, du plus important au moins important — utilisé pour
// savoir QUOI désactiver quand le format ne peut pas accueillir tout ce qui
// est coché. Chiffre clé et QR restent les deux activés par défaut (voir
// DEFAULT_SHARE_CARD_CONTENT) : ce sont eux qu'on protège en dernier.
const PRIORITY_ORDER: (keyof ShareCardContent)[] = [
  'showQrCode',
  'showKeyMetric',
  'showTopSkills',
  'showCertifications',
  'showSignature',
]

export type ResolvedShareCardContent = {
  content: ShareCardContent
  // Clés désactivées automatiquement parce que le format ne pouvait pas
  // toutes les accueillir proprement — vide si rien n'a été touché. Pensé
  // pour qu'une UI (Phase 3) puisse en informer discrètement, sans que
  // cette fonction elle-même ait besoin de savoir comment l'afficher.
  autoDisabled: (keyof ShareCardContent)[]
}

// Applique la limite du format ET la contrainte de publication (showQrCode
// n'a de sens que sur un profil publié — même contrainte que le QR autonome,
// voir QrCodeSection.tsx) à un contenu choisi par la personne. Ne modifie
// jamais l'objet reçu, renvoie toujours une version résolue distincte.
export function resolveShareCardContent(content: ShareCardContent, format: ShareCardFormat, isPublished: boolean): ResolvedShareCardContent {
  const resolved: ShareCardContent = { ...content }
  const autoDisabled: (keyof ShareCardContent)[] = []

  if (resolved.showQrCode && !isPublished) {
    resolved.showQrCode = false
    autoDisabled.push('showQrCode')
  }

  const max = FORMAT_MAX_ITEMS[format]
  let activeCount = PRIORITY_ORDER.filter((key) => resolved[key]).length
  // Du moins prioritaire vers le plus prioritaire (ordre inverse de
  // PRIORITY_ORDER) : la première clé désactivée est toujours la moins
  // importante parmi celles encore actives.
  for (let i = PRIORITY_ORDER.length - 1; i >= 0 && activeCount > max; i--) {
    const key = PRIORITY_ORDER[i]
    if (!resolved[key]) continue
    resolved[key] = false
    autoDisabled.push(key)
    activeCount--
  }

  return { content: resolved, autoDisabled }
}

