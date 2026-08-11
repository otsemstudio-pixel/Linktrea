import type { CvContact } from '@/lib/cv/mapProfileToCv'

type Props = {
  location: string
  contacts: CvContact[]
}

// Version verticale des coordonnées, une ligne par élément — pensée pour la
// colonne latérale étroite du modèle Moderne (voir cv-print.css), à la
// différence de la ligne unique séparée par « · » utilisée dans l'en-tête
// du modèle Classique (CvClassicTemplate.tsx).
export default function CvContactList({ location, contacts }: Props) {
  const lines = [location, ...contacts.map((c) => c.text)].filter(Boolean)
  if (lines.length === 0) return null

  return (
    <ul className="cv-contact-list">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  )
}
