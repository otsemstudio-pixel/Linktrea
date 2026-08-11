import type { CvExperienceEntry } from '@/lib/cv/mapProfileToCv'

type Props = {
  entries: CvExperienceEntry[]
}

// Rendu identique pour Classique et Moderne (le prompt place ces deux
// modèles côte à côte sur le même contenu, seule la disposition en colonnes
// change) — évite deux implémentations qui dérivent l'une de l'autre.
export default function CvExperienceList({ entries }: Props) {
  return (
    <>
      {entries.map((entry) => (
        <article key={entry.id} className="cv-entry">
          <div className="cv-entry-head">
            <span className="cv-entry-role">
              {entry.role}
              {entry.role && entry.company && ' · '}
              {entry.company}
            </span>
            <span className="cv-entry-dates">{entry.dateRange}</span>
          </div>
          {entry.description && <p className="cv-entry-description">{entry.description}</p>}
          {entry.highlights.length > 0 && (
            <ul className="cv-entry-highlights">
              {entry.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </>
  )
}
