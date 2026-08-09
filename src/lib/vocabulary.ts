// Vocabulaire par domaine (refonte v2, Phase 1). Le produit ne présente
// aujourd'hui que la Finance, mais est destiné à s'étendre à d'autres
// domaines professionnels (Droit, Diplomatie, Informatique, Design) —
// chaque composant qui affiche un libellé de section lit VOCABULARY[domain],
// jamais une chaîne écrite en dur, pour que ces domaines s'ajoutent plus
// tard sans toucher aux composants eux-mêmes.
import type { Domain } from '@/types'

export type DomainVocabulary = {
  keyMetric: string
  keyMetricUnit: string
  expertiseBreakdown: string
  history: string
  historyItem: string
  certifications: string
  networks: string
}

export const VOCABULARY: Record<Domain, DomainVocabulary> = {
  finance: {
    keyMetric: 'Valeur totale',
    keyMetricUnit: 'ans',
    expertiseBreakdown: 'Allocation',
    history: 'Historique des positions',
    historyItem: 'Position',
    certifications: 'Actifs certifiés',
    networks: 'Réseaux',
  },
  // Les entrées 'droit', 'diplomatie', 'informatique', 'design' viendront
  // plus tard, avec leur propre vocabulaire et leur propre famille de
  // motifs graphiques (Phases 6/7 du prompt v2) — pas implémentées
  // maintenant, seule la structure doit exister.
}
