type Props = {
  accent: string
  children: string
}

// Seul point d'application de l'accent sur les titres de section — voir
// cv-print.css : le reste de la mise en page reste noir sur blanc, quel que
// soit le modèle (Classique, Moderne).
export default function CvSectionTitle({ accent, children }: Props) {
  return (
    <h2 className="cv-section-title" style={{ color: accent }}>
      {children}
    </h2>
  )
}
