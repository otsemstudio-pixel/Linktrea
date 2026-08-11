import type { Profile } from '@/types'
import { VOCABULARY } from '@/lib/vocabulary'
import { mapProfileToCv } from '@/lib/cv/mapProfileToCv'
import type { CvLang } from '@/lib/cv/formatCvDate'
import CvSectionTitle from './CvSectionTitle'
import CvExperienceList from './CvExperienceList'
import CvSkillsList from './CvSkillsList'
import CvCertificationsList from './CvCertificationsList'
import '@/styles/cv-print.css'

type Props = {
  profile: Profile
  lang: CvLang
  // Aperçu à l'écran (conteneur A4 simulé, ombre) vs sortie imprimée réelle
  // (voir cv-print.css, .cv-doc--preview n'existe qu'à l'écran).
  preview?: boolean
  // Opt-in (prompt de suivi) — désactivé par défaut : beaucoup de guides de
  // candidature déconseillent la photo sur un CV (biais à l'embauche), donc
  // ce n'est jamais un ajout automatique, uniquement un choix explicite du
  // propriétaire du profil (case à cocher prévue Phase 3).
  includePhoto?: boolean
}

// Mise en page à une colonne, alignée à gauche, hiérarchie typographique
// simple — le format le plus sûr pour un parsing ATS (voir le prompt).
export default function CvClassicTemplate({ profile, lang, preview = false, includePhoto = false }: Props) {
  const vocabulary = VOCABULARY[profile.domain]
  const accent = profile.theme.accent
  const cv = mapProfileToCv(profile, lang)
  const metaLine = [cv.location, ...cv.contacts.map((c) => c.text)].filter(Boolean).join(' · ')
  const showPhoto = includePhoto && Boolean(cv.photo)

  return (
    <div className="cv-print-root">
      <div className={`cv-doc${preview ? ' cv-doc--preview' : ''}`}>
        <header className={`cv-header${showPhoto ? ' cv-header--with-photo' : ''}`}>
          {showPhoto && <img src={cv.photo!} alt="" className="cv-header-photo" />}
          <div>
            <h1 className="cv-name" style={{ borderBottomColor: accent }}>
              {cv.fullName || 'Nom à renseigner'}
            </h1>
            {cv.headline && <p className="cv-headline">{cv.headline}</p>}
            {metaLine && <p className="cv-meta">{metaLine}</p>}
          </div>
        </header>

        {cv.summary && (
          <section className="cv-section">
            <CvSectionTitle accent={accent}>{vocabulary.cvSummary[lang]}</CvSectionTitle>
            <p className="cv-summary">{cv.summary}</p>
          </section>
        )}

        {cv.experience.length > 0 && (
          <section className="cv-section">
            <CvSectionTitle accent={accent}>{vocabulary.cvExperience[lang]}</CvSectionTitle>
            <CvExperienceList entries={cv.experience} />
          </section>
        )}

        {cv.skills.length > 0 && (
          <section className="cv-section">
            <CvSectionTitle accent={accent}>{vocabulary.cvSkills[lang]}</CvSectionTitle>
            <CvSkillsList groups={cv.skills} />
          </section>
        )}

        {cv.certifications.length > 0 && (
          <section className="cv-section">
            <CvSectionTitle accent={accent}>{vocabulary.cvCertifications[lang]}</CvSectionTitle>
            <CvCertificationsList certifications={cv.certifications} />
          </section>
        )}
      </div>
    </div>
  )
}
