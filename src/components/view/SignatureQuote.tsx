import type { SignatureStyle } from '@/types'

type Props = {
  signature: string
  style: SignatureStyle
}

// Signature personnelle (personnalisation avancée, Phase 4) — traitée comme
// une citation (italique, guillemets français), jamais comme un paragraphe
// de bio. Rien n'est rendu si le champ est vide : pas de placeholder ni de
// mention "aucune signature" sur le profil public (voir le prompt).
export default function SignatureQuote({ signature, style }: Props) {
  if (!signature) return null

  if (style === 'stamp') {
    return (
      <p
        className="inline-block italic text-sm font-mono px-4 py-2 border text-paper/90 max-w-xs"
        style={{ borderColor: 'var(--accent)', transform: 'rotate(-2.5deg)' }}
      >
        « {signature} »
      </p>
    )
  }

  return <p className="italic text-sm text-muted max-w-xs">« {signature} »</p>
}
