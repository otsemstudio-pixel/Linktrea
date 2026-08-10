// Signale à LoginPage qu'une suppression de compte vient de réussir, pour
// afficher une confirmation plutôt que le formulaire vierge silencieux
// (refonte sécurité, Phase 4). sessionStorage plutôt que le `state` de
// react-router : après suppression, AccountSection.tsx appelle signOut(),
// qui fait passer AuthContext à 'anonymous' — RequireAuth navigue alors
// vers /login de son côté, en concurrence avec toute navigation explicite
// tentée ici. Le `state` du navigate() perdant cette course est
// silencieusement écrasé par celui de RequireAuth ; un flag lu une seule
// fois au montage de LoginPage ne dépend d'aucune des deux navigations en
// particulier.
const STORAGE_KEY = 'linktrea:account-deleted'

export function markAccountDeleted(): void {
  sessionStorage.setItem(STORAGE_KEY, '1')
}

// Lecture non destructive — voir clearAccountDeletedFlag() pour pourquoi
// lire et effacer sont deux fonctions séparées, pas une seule "consume".
export function peekAccountDeletedFlag(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

// Effacement à part, pensé pour un useEffect plutôt qu'un initialiseur de
// useState : React (StrictMode, en dev) peut appeler l'initialiseur d'un
// useState deux fois par montage pour détecter les effets de bord dans le
// rendu — une fonction qui lit ET efface en un seul appel y perdrait le
// flag dès le premier appel "jetable", et le second (le vrai) le trouverait
// déjà vide. En séparant lecture (dans l'initialiseur, sans effet de bord)
// et effacement (dans un effet, idempotent — l'appeler deux fois ne change
// rien), les deux se comportent correctement quel que soit le nombre réel
// d'invocations.
export function clearAccountDeletedFlag(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
