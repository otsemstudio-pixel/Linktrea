// Calcule un pourcentage de complétude du profil en cours d'édition — aucun
// appel réseau, dérivé uniquement du Profile déjà en mémoire (voir doc
// "Complétude, historique, publication différée", Phase 1). Pondération
// choisie pour refléter ce qui rend un profil réellement UTILE pour un
// visiteur : les deux sections de contenu substantiel (positions,
// compétences) pèsent le plus lourd, l'identité de base (nom, accroche,
// photo) juste derrière, le reste (réseaux, certificats, signature) reste
// valorisé mais plus léger — jamais un frein à la publication, purement un
// signal d'encouragement affiché côté éditeur (voir CompletionRing.tsx).
import type { Profile } from '@/types'

export type CompletionCriterionId = 'name' | 'headline' | 'photo' | 'positions' | 'holdings' | 'tickers' | 'certificates' | 'signature'

export type CompletionCriterion = {
  id: CompletionCriterionId
  label: string
  weight: number
  done: boolean
  // coachmarkId de la CollapsibleSection à ouvrir/cibler pour compléter ce
  // critère (voir useCoachmark().activate/getTarget dans CompletionRing.tsx).
  sectionId: string
}

export type ProfileCompletion = {
  percent: number
  criteria: CompletionCriterion[]
}

// Les poids somment exactement à 100 : le total gagné se lit directement
// comme un pourcentage, pas besoin de normaliser.
const WEIGHTS: Record<CompletionCriterionId, number> = {
  name: 10,
  headline: 10,
  photo: 5,
  positions: 20,
  holdings: 20,
  tickers: 15,
  certificates: 10,
  signature: 10,
}

export function computeProfileCompletion(profile: Profile): ProfileCompletion {
  const criteria: CompletionCriterion[] = [
    {
      id: 'name',
      label: 'Nom complet renseigné',
      weight: WEIGHTS.name,
      sectionId: 'identity',
      done: (profile.identity?.fullName ?? '').trim().length > 0,
    },
    {
      id: 'headline',
      label: 'Accroche renseignée',
      weight: WEIGHTS.headline,
      sectionId: 'identity',
      done: (profile.identity?.headline ?? '').trim().length > 0,
    },
    {
      id: 'photo',
      label: 'Photo ajoutée',
      weight: WEIGHTS.photo,
      sectionId: 'identity',
      done: Boolean(profile.identity?.photo),
    },
    {
      id: 'positions',
      label: 'Au moins une position renseignée',
      weight: WEIGHTS.positions,
      sectionId: 'positions',
      done: (profile.positions ?? []).some((p) => p.role.trim().length > 0 && p.company.trim().length > 0),
    },
    {
      id: 'holdings',
      label: 'Au moins une compétence renseignée',
      weight: WEIGHTS.holdings,
      sectionId: 'holdings',
      done: (profile.holdings ?? []).some((h) => h.label.trim().length > 0),
    },
    {
      id: 'tickers',
      label: 'Au moins un réseau renseigné',
      weight: WEIGHTS.tickers,
      sectionId: 'tickers',
      done: (profile.tickers ?? []).some((t) => t.handle.trim().length > 0),
    },
    {
      id: 'certificates',
      label: 'Au moins un certificat renseigné',
      weight: WEIGHTS.certificates,
      sectionId: 'certificates',
      done: (profile.certificates ?? []).some((c) => c.title.trim().length > 0),
    },
    {
      id: 'signature',
      label: 'Signature personnelle renseignée',
      weight: WEIGHTS.signature,
      sectionId: 'identity',
      done: (profile.identity?.signature ?? '').trim().length > 0,
    },
  ]

  const percent = criteria.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0)

  return { percent, criteria }
}
