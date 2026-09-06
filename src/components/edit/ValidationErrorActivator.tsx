import { useEffect } from 'react'
import type { Profile } from '@/types'
import { useCoachmark } from '@/lib/coachmark/CoachmarkContext'

type Props = {
  section: keyof Profile | null
}

// Clé de Profile -> coachmarkId des CollapsibleSection de EditPage.tsx —
// correspondance directe sauf 'domain' (vit dans la section "Identité") et
// 'theme' (vit dans "Apparence"), qui n'ont pas leur propre accordéon.
const SECTION_TO_COACHMARK_ID: Partial<Record<keyof Profile, string>> = {
  domain: 'identity',
  identity: 'identity',
  positions: 'positions',
  holdings: 'holdings',
  certificates: 'certificates',
  tickers: 'tickers',
  theme: 'appearance',
  appearance: 'appearance',
}

// Rouvre automatiquement la section qui porte une erreur de validation,
// même repliée (prompt "corrige ce garde-fou", Phase 3) — un
// CollapsibleSection replié DÉMONTE son contenu (voir ce composant), donc
// l'erreur de champ que react-hook-form afficherait normalement à côté du
// champ fautif n'est tout simplement pas rendue tant que la section reste
// fermée. Réutilise le registre d'activation déjà posé pour le tuto en
// coachmarks plutôt que de transformer CollapsibleSection en composant
// contrôlé — voir useCoachmarkActivator dans CollapsibleSection.tsx.
// Ne rend rien, composant purement déclencheur, à monter sous
// CoachmarkProvider (même principe que CoachmarkAutoStart.tsx).
export default function ValidationErrorActivator({ section }: Props) {
  const { activate } = useCoachmark()

  useEffect(() => {
    if (!section) return
    const targetId = SECTION_TO_COACHMARK_ID[section]
    if (targetId) activate(targetId)
    // Ne réagit qu'à un CHANGEMENT de section fautive — si la personne
    // referme la section manuellement alors que la même erreur persiste
    // (autosave qui rejoue le même échec toutes les 500ms), on ne la
    // rouvre pas de force à chaque nouvelle tentative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  return null
}
