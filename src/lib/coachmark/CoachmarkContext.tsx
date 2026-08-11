// Mécanisme générique de coachmark (tuto interactif, Phase 1) — deux
// responsabilités distinctes partagées par ce contexte unique :
// 1) un REGISTRE, alimenté par les composants de l'éditeur eux-mêmes via
//    useCoachmarkTarget()/useCoachmarkActivator() : chaque section qui peut
//    être ciblée s'y déclare avec un id, sans que ce fichier ait besoin de
//    connaître la structure de l'éditeur.
// 2) l'état de la SÉQUENCE en cours (étape active, en pause ou éteinte),
//    piloté par CoachmarkOverlay.tsx.
// Les registres vivent dans des refs (Map), pas du state React : les
// (dés)enregistrements se produisent au montage/démontage de composants
// tiers et n'ont pas besoin de déclencher un rendu de ce contexte — seule la
// lecture ponctuelle par l'overlay, au moment de cibler une étape, compte.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type CoachmarkStep = {
  id: string
  // undefined = bulle centrée (pas de cible ni de halo) — étapes d'intro/fin.
  // Un tableau désigne des cibles ALTERNATIVES pour le même concept selon le
  // contexte (ex. le bouton "Aperçu" n'existe que sur mobile — desktop
  // affiche déjà l'aperçu en direct dans un panneau séparé) : l'overlay
  // retient le premier id dont l'élément enregistré a une taille non nulle
  // au moment de l'étape, jamais les deux à la fois.
  targetId?: string | string[]
  // Id à activer AVANT de cibler targetId, quand ce n'est pas le même
  // élément — ex. la photo (targetId) vit dans la section "Identité", qui
  // doit être ouverte en premier, pas la photo elle-même qui n'a pas
  // d'activateur propre. undefined = active targetId lui-même (cas courant :
  // cibler l'en-tête d'un accordéon replié).
  activateId?: string
  text: string
}

type CoachmarkContextValue = {
  registerTarget: (id: string, el: HTMLElement | null) => void
  registerActivator: (id: string, activate: (() => void) | null) => void
  getTarget: (id: string) => HTMLElement | null
  activate: (id: string) => void
  steps: CoachmarkStep[]
  index: number
  isActive: boolean
  start: (steps: CoachmarkStep[]) => void
  advance: () => void
  skip: () => void
}

const CoachmarkContext = createContext<CoachmarkContextValue | null>(null)

type ProviderProps = {
  children: ReactNode
  // Appelé une fois, à la toute fin de la séquence — que ce soit par
  // complétion normale (dernier "Suivant") ou par "Passer le tuto" : les
  // deux issues doivent mémoriser la même chose (voir EditPage.tsx, clé
  // localStorage linktrea:tutorial-seen), donc un seul point d'appel.
  onFinish?: () => void
}

export function CoachmarkProvider({ children, onFinish }: ProviderProps) {
  const targets = useRef(new Map<string, HTMLElement>())
  const activators = useRef(new Map<string, () => void>())
  const [tour, setTour] = useState<{ steps: CoachmarkStep[]; index: number; isActive: boolean }>({
    steps: [],
    index: 0,
    isActive: false,
  })

  const registerTarget = useCallback((id: string, el: HTMLElement | null) => {
    if (el) targets.current.set(id, el)
    else targets.current.delete(id)
  }, [])

  const registerActivator = useCallback((id: string, activate: (() => void) | null) => {
    if (activate) activators.current.set(id, activate)
    else activators.current.delete(id)
  }, [])

  const getTarget = useCallback((id: string) => targets.current.get(id) ?? null, [])

  // Appelle la fonction d'activation enregistrée pour cet id, si elle
  // existe — n'importe quelle cible n'a pas forcément besoin d'être
  // "activée" (une simple zone déjà visible, par exemple), donc l'absence
  // d'activateur enregistré n'est pas une erreur, juste un no-op.
  const activate = useCallback((id: string) => {
    activators.current.get(id)?.()
  }, [])

  const start = useCallback((steps: CoachmarkStep[]) => {
    if (steps.length === 0) return
    setTour({ steps, index: 0, isActive: true })
  }, [])

  const advance = useCallback(() => {
    setTour((t) => {
      const nextIndex = t.index + 1
      if (nextIndex >= t.steps.length) return { steps: [], index: 0, isActive: false }
      return { ...t, index: nextIndex }
    })
  }, [])

  const skip = useCallback(() => {
    setTour({ steps: [], index: 0, isActive: false })
  }, [])

  // onFinish réagit à la TRANSITION active→inactive plutôt que d'être
  // appelé directement dans advance()/skip() : les deux chemins retombent
  // sur le même changement d'état, un seul endroit à tenir à jour plutôt que
  // deux appels dupliqués (et ça reste correct si un futur troisième moyen
  // de terminer la séquence est ajouté).
  const wasActive = useRef(false)
  useEffect(() => {
    if (wasActive.current && !tour.isActive) onFinish?.()
    wasActive.current = tour.isActive
  }, [tour.isActive, onFinish])

  return (
    <CoachmarkContext.Provider
      value={{
        registerTarget,
        registerActivator,
        getTarget,
        activate,
        steps: tour.steps,
        index: tour.index,
        isActive: tour.isActive,
        start,
        advance,
        skip,
      }}
    >
      {children}
    </CoachmarkContext.Provider>
  )
}

// Contexte par défaut sûr (registre inerte, séquence jamais active) plutôt
// qu'une erreur si un composant utilise ces hooks hors CoachmarkProvider —
// CollapsibleSection.tsx, par exemple, est un composant partagé qui ne doit
// pas planter dans un contexte qui n'a pas (encore) ce provider.
const NOOP_CONTEXT: CoachmarkContextValue = {
  registerTarget: () => {},
  registerActivator: () => {},
  getTarget: () => null,
  activate: () => {},
  steps: [],
  index: 0,
  isActive: false,
  start: () => {},
  advance: () => {},
  skip: () => {},
}

export function useCoachmark(): CoachmarkContextValue {
  return useContext(CoachmarkContext) ?? NOOP_CONTEXT
}

// À poser sur l'élément DOM que la bulle doit désigner — id undefined = pas
// d'enregistrement (permet un usage conditionnel sans `if` chez l'appelant).
export function useCoachmarkTarget(id: string | undefined) {
  const { registerTarget } = useCoachmark()
  return useCallback(
    (el: HTMLElement | null) => {
      if (id) registerTarget(id, el)
    },
    [id, registerTarget],
  )
}

// À appeler dans le composant capable d'« activer » une cible avant qu'elle
// ne soit ciblée (typiquement : ouvrir un accordéon replié). `activate` est
// dans les dépendances : un composant appelant comme CollapsibleSection.tsx
// passe typiquement une fonction fléchée recréée à chaque rendu, donc ce
// hook la ré-enregistre à chaque fois plutôt que de risquer une fermeture
// obsolète si elle capturait un jour une valeur qui change.
export function useCoachmarkActivator(id: string | undefined, activate: () => void) {
  const { registerActivator } = useCoachmark()
  useEffect(() => {
    if (!id) return
    registerActivator(id, activate)
    return () => registerActivator(id, null)
  }, [id, activate, registerActivator])
}
