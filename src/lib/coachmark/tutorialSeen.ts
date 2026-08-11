// Mémorisation du tuto en coachmarks (Phase 1) — un seul indicateur, "vu ou
// pas", jamais l'étape où l'utilisateur s'est arrêté : "Passer le tuto" et
// une séquence terminée normalement comptent tous les deux comme "vu"
// (voir CoachmarkContext.tsx, onFinish), on ne relance jamais automatiquement
// une deuxième fois. Le bouton d'aide de l'éditeur reste le seul moyen de la
// revoir ensuite, volontairement.
const STORAGE_KEY = 'linktrea:tutorial-seen'

export function hasTutorialBeenSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Stockage indisponible : mieux vaut ne pas relancer le tuto à chaque
    // rendu que de planter — traité comme "déjà vu".
    return true
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Stockage plein ou indisponible : la préférence ne sera simplement pas
    // retenue, pas une erreur bloquante pour autant.
  }
}
