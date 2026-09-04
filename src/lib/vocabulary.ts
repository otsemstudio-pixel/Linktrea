// Vocabulaire par domaine (refonte v2, Phase 1). Le produit ne présente
// aujourd'hui que la Finance, mais est destiné à s'étendre à d'autres
// domaines professionnels (Droit, Diplomatie, Informatique, Design) —
// chaque composant qui affiche un libellé de section lit VOCABULARY[domain],
// jamais une chaîne écrite en dur, pour que ces domaines s'ajoutent plus
// tard sans toucher aux composants eux-mêmes.
import type { Domain } from '@/types'
import type { CvLang } from './cv/types'

// Libellé du CV — objet {fr, en} plutôt qu'une chaîne unique : c'est
// l'extension « avec une dimension de langue » demandée par le prompt CV
// (Phase 2), plutôt qu'une seconde table de vocabulaire dupliquée. Ne
// s'applique qu'aux 4 champs cv* : le reste de DomainVocabulary sert le
// profil public, qui n'a pas de sélecteur de langue.
type CvLabel = Record<CvLang, string>

export type DomainVocabulary = {
  keyMetric: string
  keyMetricUnit: string
  expertiseBreakdown: string
  history: string
  historyItem: string
  certifications: string
  networks: string
  // Intitulés du CV PDF (prompt dédié) — volontairement distincts des
  // libellés ci-dessus : ceux-ci portent la métaphore du profil public par
  // domaine ("Allocation", "Actifs certifiés"...), alors qu'un CV attend un
  // vocabulaire de candidature standard ("Expérience", "Compétences"...),
  // quel que soit le domaine.
  cvSummary: CvLabel
  cvExperience: CvLabel
  cvSkills: CvLabel
  cvCertifications: CvLabel
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
    cvSummary: { fr: 'Résumé', en: 'Summary' },
    cvExperience: { fr: 'Expérience', en: 'Experience' },
    cvSkills: { fr: 'Compétences', en: 'Skills' },
    cvCertifications: { fr: 'Certifications', en: 'Certifications' },
  },
  // Domaine pilote (prompt dédié) — reprend entièrement la famille visuelle
  // finance (tickers, sparkline, anneau d'allocation) : seul le vocabulaire
  // change. Les intitulés cv* restent identiques à 'finance' : ce sont des
  // libellés de candidature standard, pas une métaphore par domaine (voir
  // le commentaire sur DomainVocabulary ci-dessus).
  entrepreneuriat: {
    keyMetric: 'Parcours entrepreneurial',
    keyMetricUnit: 'ans',
    expertiseBreakdown: "Domaines d'expertise",
    history: 'Aventures entrepreneuriales',
    historyItem: 'Venture',
    certifications: 'Formations & programmes',
    networks: 'Réseaux',
    cvSummary: { fr: 'Résumé', en: 'Summary' },
    cvExperience: { fr: 'Expérience', en: 'Experience' },
    cvSkills: { fr: 'Compétences', en: 'Skills' },
    cvCertifications: { fr: 'Certifications', en: 'Certifications' },
  },
  // Domaine "famille visuelle Protocole" (prompt dédié) — première entrée à
  // introduire une vraie nouvelle famille de motifs structurels (voir
  // src/lib/theme/visualFamily.ts), pas seulement du vocabulaire. Les
  // intitulés cv* restent identiques aux autres domaines, pour la même
  // raison qu'en Entrepreneuriat (voir le commentaire sur DomainVocabulary).
  diplomatie: {
    keyMetric: 'Parcours diplomatique',
    keyMetricUnit: 'ans',
    expertiseBreakdown: "Zones d'expertise",
    history: 'Missions',
    historyItem: 'Mission',
    certifications: 'Accréditations',
    networks: 'Réseaux',
    cvSummary: { fr: 'Résumé', en: 'Summary' },
    cvExperience: { fr: 'Expérience', en: 'Experience' },
    cvSkills: { fr: 'Compétences', en: 'Skills' },
    cvCertifications: { fr: 'Certifications', en: 'Certifications' },
  },
  // Les entrées 'droit', 'informatique', 'design' viendront plus tard, avec
  // leur propre vocabulaire (Phases 6/7 du prompt v2) — pas implémentées
  // maintenant, seule la structure doit exister.
}
