import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { Profile } from '@/types'
import { VOCABULARY } from '@/lib/vocabulary'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import CvClassicTemplate from '@/components/cv/CvClassicTemplate'
import CvModernTemplate from '@/components/cv/CvModernTemplate'
import { useCvPreferences } from './useCvPreferences'
import '@/styles/cv-print.css'

type Props = {
  open: boolean
  profile: Profile
  onClose: () => void
}

function SegmentedButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-9 px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${
        selected ? 'bg-accent text-ink' : 'text-muted'
      }`}
    >
      {label}
    </button>
  )
}

// Panneau de génération du CV (prompt CV, Phase 3) — plein écran comme
// PreviewOverlay/StatsOverlay, plutôt qu'une petite modale centrée : la
// prévisualisation A4 en dessous des contrôles a besoin de place pour
// rester scrollable et lisible avant l'impression réelle (voir le prompt :
// « mêmes styles que ceux utilisés à l'impression »).
export default function CvOverlay({ open, profile, onClose }: Props) {
  const { reduced } = useMotionPrefs()
  const { model, setModel, lang, setLang } = useCvPreferences()
  // Décoché par défaut à chaque ouverture — voir le commentaire sur
  // includePhoto dans CvClassicTemplate.tsx : jamais un ajout automatique.
  const [includePhoto, setIncludePhoto] = useState(false)
  const hasPhoto = Boolean(profile.identity.photo)
  const vocabulary = VOCABULARY[profile.domain]

  // Portail direct sur <body>, en dehors de #root (voir index.html) — pas
  // seulement pour raison de style. #root porte aussi la (longue) page
  // /edit derrière ce panneau : à l'impression, la masquer entièrement via
  // #root { display: none } (cv-print.css) est ce qui évite qu'elle
  // continue à peser sur la hauteur totale du document une fois cachée
  // (visibility:hidden ne suffit pas, display:none oui) — repéré en
  // générant un vrai PDF pendant les tests : un CV d'une page en produisait
  // deux, la seconde dupliquant la première. Si ce panneau restait à
  // l'intérieur de #root, le masquer le ferait disparaître lui aussi.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          className="cv-overlay-root fixed inset-0 z-40 bg-ink overflow-y-auto"
        >
          <div className="cv-overlay-chrome sticky top-0 z-10 border-b border-ink-raised bg-ink/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 px-3 rounded-md bg-ink-raised/90 text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Retour à l'édition
              </button>
              <h1 className="font-medium">Télécharger mon CV</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
              <div className="flex rounded-md border border-ink-raised overflow-hidden">
                <SegmentedButton label="Classique" selected={model === 'classic'} onClick={() => setModel('classic')} />
                <SegmentedButton label="Moderne" selected={model === 'modern'} onClick={() => setModel('modern')} />
              </div>
              <div className="flex rounded-md border border-ink-raised overflow-hidden">
                <SegmentedButton label="FR" selected={lang === 'fr'} onClick={() => setLang('fr')} />
                <SegmentedButton label="EN" selected={lang === 'en'} onClick={() => setLang('en')} />
              </div>
              {hasPhoto && (
                <label className="flex items-center gap-1.5 min-h-9 px-1 text-xs text-muted">
                  <input type="checkbox" checked={includePhoto} onChange={(e) => setIncludePhoto(e.target.checked)} />
                  Inclure ma photo
                </label>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="ml-auto min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
              >
                Générer
              </button>
            </div>

            {/* Nudge discret, jamais bloquant (prompt) : un CV partiel reste
                utile à certains utilisateurs. */}
            {profile.positions.length === 0 && (
              <p className="px-4 pb-3 text-xs text-muted">
                Ton CV sera plus convaincant avec au moins une expérience renseignée dans la section « {vocabulary.history} ».
              </p>
            )}
          </div>

          <div className="py-8">
            {model === 'classic' ? (
              <CvClassicTemplate profile={profile} lang={lang} includePhoto={includePhoto} preview />
            ) : (
              <CvModernTemplate profile={profile} lang={lang} includePhoto={includePhoto} preview />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
