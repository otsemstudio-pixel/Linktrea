import { HelpCircle } from 'lucide-react'
import { useCoachmark, type CoachmarkStep } from '@/lib/coachmark/CoachmarkContext'

type Props = {
  steps: CoachmarkStep[]
}

// Relance la séquence à la demande, quel que soit l'état de localStorage —
// seul moyen de la revoir une fois le premier passage automatique déjà vu
// (CoachmarkAutoStart.tsx).
export default function CoachmarkHelpButton({ steps }: Props) {
  const { start } = useCoachmark()

  return (
    <button
      type="button"
      onClick={() => start(steps)}
      aria-label="Revoir le tuto"
      className="size-11 flex items-center justify-center rounded-md text-muted focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
    >
      <HelpCircle size={18} aria-hidden="true" />
    </button>
  )
}
