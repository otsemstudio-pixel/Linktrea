// Langue du CV généré (Phase 2, prompt dédié) — indépendante de la langue
// d'affichage du reste de l'application. Type partagé entre formatCvDate.ts
// et vocabulary.ts (voir DomainVocabulary) pour éviter que l'un des deux ne
// dépende de l'autre pour un type aussi simple.
export type CvLang = 'fr' | 'en'
