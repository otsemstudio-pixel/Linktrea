// Contenu personnalisable de la carte de partage (refonte carte de partage,
// Phase 2) — logique pure (modèle, limite par format, persistance),
// indépendante du dessin canvas (voir shareCard.ts) et de l'UI à cocher
// (Phase 3 : l'aperçu en direct remplace le bouton "Carte" actuel, pas la
// peine de construire une UI de cases à cocher jetable ici pour la refaire
// juste après).
import type { ShareCardFormat } from './shareCard'

export type ShareCardContent = {
  showKeyMetric: boolean
  showTopSkills: boolean
  showCertifications: boolean
  showSignature: boolean
  showQrCode: boolean
}

// Par défaut : chiffre clé + QR seulement — évite une carte surchargée au
// premier essai (voir le prompt).
export const DEFAULT_SHARE_CARD_CONTENT: ShareCardContent = {
  showKeyMetric: true,
  showTopSkills: false,
  showCertifications: false,
  showSignature: false,
  showQrCode: true,
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

const STORAGE_KEY = 'ledger:share-card-content'

// Persiste le dernier choix de contenu (prompt : "pour ne pas lui faire
// recocher les mêmes cases à chaque génération") — localStorage suffit,
// c'est une préférence d'affichage locale, pas une donnée de profil.
export function loadShareCardContent(): ShareCardContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SHARE_CARD_CONTENT }
    const parsed = JSON.parse(raw)
    // Fusionné sur les défauts plutôt que retourné tel quel : un ajout futur
    // de champ ne doit pas produire un objet incomplet pour qui a déjà une
    // préférence enregistrée.
    return { ...DEFAULT_SHARE_CARD_CONTENT, ...parsed }
  } catch {
    return { ...DEFAULT_SHARE_CARD_CONTENT }
  }
}

export function saveShareCardContent(content: ShareCardContent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
  } catch {
    // Stockage plein ou indisponible : la préférence ne sera simplement pas
    // retenue pour la prochaine fois, pas une erreur bloquante pour autant.
  }
}
