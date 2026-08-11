import { useState } from 'react'
import type { Profile } from '@/types'
import { demoProfile } from '@/lib/demoProfile'
import { createEmptyProfile } from '@/lib/emptyProfile'
import CvClassicTemplate from '@/components/cv/CvClassicTemplate'
import CvModernTemplate from '@/components/cv/CvModernTemplate'
import type { CvLang } from '@/lib/cv/formatCvDate'

type Model = 'classic' | 'modern'

// Profil minimal (règle transversale n°4 du prompt CV : tester un profil
// minimal ET complet) — seuls nom et une position renseignés, tout le reste
// vide, pour vérifier que les sections sans données disparaissent proprement
// plutôt que d'afficher un titre de section vide.
const minimalProfile: Profile = {
  ...createEmptyProfile(),
  identity: { ...createEmptyProfile().identity, fullName: 'Jordan Aka' },
  positions: [
    {
      id: 'pos-min',
      role: 'Assistant comptable',
      company: 'Cabinet Traoré & Associés',
      startDate: '2024-01',
      endDate: null,
      description: '',
      highlights: [],
    },
  ],
}

// Silhouette générique en SVG inline — juste pour visualiser le rendu avec
// photo dans ce debug, sans dépendre d'un fichier binaire ni du réseau.
const PLACEHOLDER_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23bcbcbc'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23e0e0e0'/%3E%3Cellipse cx='50' cy='88' rx='30' ry='24' fill='%23e0e0e0'/%3E%3C/svg%3E"

// Ne fait pas partie du site public — sert à visualiser/imprimer les
// modèles de CV pendant leur construction, avec le profil de démonstration
// déjà utilisé ailleurs (voir demoProfile.ts) et un profil minimal.
export default function DebugCvPage() {
  const [lang, setLang] = useState<CvLang>('fr')
  const [model, setModel] = useState<Model>('classic')
  const [minimal, setMinimal] = useState(false)
  const [includePhoto, setIncludePhoto] = useState(false)
  const baseProfile = minimal ? minimalProfile : demoProfile
  const profile = includePhoto ? { ...baseProfile, identity: { ...baseProfile.identity, photo: PLACEHOLDER_PHOTO } } : baseProfile

  return (
    <div style={{ background: '#525659', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="fixed top-3 left-3 z-50 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setModel(model === 'classic' ? 'modern' : 'classic')}
          className="min-h-11 px-3 rounded-md bg-white text-sm"
        >
          Modèle : {model === 'classic' ? 'Classique' : 'Moderne'}
        </button>
        <button
          type="button"
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="min-h-11 px-3 rounded-md bg-white text-sm"
        >
          Langue : {lang}
        </button>
        <button type="button" onClick={() => setMinimal((v) => !v)} className="min-h-11 px-3 rounded-md bg-white text-sm">
          Profil : {minimal ? 'Minimal' : 'Complet'}
        </button>
        <button type="button" onClick={() => setIncludePhoto((v) => !v)} className="min-h-11 px-3 rounded-md bg-white text-sm">
          Photo : {includePhoto ? 'Oui' : 'Non'}
        </button>
        <button type="button" onClick={() => window.print()} className="min-h-11 px-3 rounded-md bg-white text-sm">
          Imprimer
        </button>
      </div>
      {model === 'classic' ? (
        <CvClassicTemplate profile={profile} lang={lang} includePhoto={includePhoto} preview />
      ) : (
        <CvModernTemplate profile={profile} lang={lang} includePhoto={includePhoto} preview />
      )}
    </div>
  )
}
