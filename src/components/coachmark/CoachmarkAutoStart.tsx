import { useEffect } from 'react'
import { useCoachmark, type CoachmarkStep } from '@/lib/coachmark/CoachmarkContext'
import { hasTutorialBeenSeen } from '@/lib/coachmark/tutorialSeen'

type Props = {
  steps: CoachmarkStep[]
}

// Lance la séquence automatiquement au premier accès à /edit — ne rend
// rien, composant purement déclencheur, à monter une fois n'importe où sous
// CoachmarkProvider. Le court délai laisse l'interface (chargement du
// profil, mise en page) se stabiliser avant que la première bulle
// n'apparaisse et ne mesure quoi que ce soit.
export default function CoachmarkAutoStart({ steps }: Props) {
  const { start } = useCoachmark()

  useEffect(() => {
    if (hasTutorialBeenSeen()) return
    const timer = setTimeout(() => start(steps), 800)
    return () => clearTimeout(timer)
    // Ne se relance jamais en cours de vie du composant (steps/start ne
    // devraient de toute façon pas changer) — seul le montage initial compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
