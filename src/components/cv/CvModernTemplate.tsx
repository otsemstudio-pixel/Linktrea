import type { Profile } from '@/types'
import { VOCABULARY } from '@/lib/vocabulary'
import { mapProfileToCv } from '@/lib/cv/mapProfileToCv'
import type { CvLang } from '@/lib/cv/formatCvDate'
import CvSectionTitle from './CvSectionTitle'
import CvExperienceList from './CvExperienceList'
import CvSkillsList from './CvSkillsList'
import CvCertificationsList from './CvCertificationsList'
import CvContactList from './CvContactList'
import '@/styles/cv-print.css'

type Props = {
  profile: Profile
  lang: CvLang
  preview?: boolean
  // Opt-in, désactivé par défaut — voir le même commentaire sur
  // CvClassicTemplate.tsx.
  includePhoto?: boolean
}

// Deux colonnes : coordonnées + compétences en colonne latérale, résumé /
// expérience / formation en colonne principale — plus dense visuellement
// que Classique, mais toujours sobre (voir cv-print.css, .cv-modern-*).
export default function CvModernTemplate({ profile, lang, preview = false, includePhoto = false }: Props) {
  const vocabulary = VOCABULARY[profile.domain]
  const accent = profile.theme.accent
  const cv = mapProfileToCv(profile, lang)
  const showPhoto = includePhoto && Boolean(cv.photo)
  // Sans ça, un profil sans coordonnées ni compétences ni photo renseignées
  // afficherait un bloc latéral gris vide à côté du contenu principal — une
  // section vide qui se voit, contrairement aux sections cachées ci-dessous.
  const hasSidebarContent = Boolean(cv.location) || cv.contacts.length > 0 || cv.skills.length > 0 || showPhoto

  const main = (
    <main className="cv-modern-main">
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

      {cv.certifications.length > 0 && (
        <section className="cv-section">
          <CvSectionTitle accent={accent}>{vocabulary.cvCertifications[lang]}</CvSectionTitle>
          <CvCertificationsList certifications={cv.certifications} />
        </section>
      )}
    </main>
  )

  return (
    <div className="cv-print-root">
      <div className={`cv-doc${preview ? ' cv-doc--preview' : ''}`}>
        <header className="cv-header">
          <h1 className="cv-name" style={{ borderBottomColor: accent }}>
            {cv.fullName || 'Nom à renseigner'}
          </h1>
          {cv.headline && <p className="cv-headline">{cv.headline}</p>}
        </header>

        {hasSidebarContent ? (
          <div className="cv-modern-grid">
            <aside className="cv-modern-sidebar">
              {showPhoto && <img src={cv.photo!} alt="" className="cv-modern-sidebar-photo" />}
              <CvContactList location={cv.location} contacts={cv.contacts} />

              {cv.skills.length > 0 && (
                <section className="cv-section">
                  <CvSectionTitle accent={accent}>{vocabulary.cvSkills[lang]}</CvSectionTitle>
                  <CvSkillsList groups={cv.skills} />
                </section>
              )}
            </aside>

            {main}
          </div>
        ) : (
          main
        )}
      </div>
    </div>
  )
}
