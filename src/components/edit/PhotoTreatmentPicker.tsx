import { useId } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import type { Profile, PhotoTreatment } from '@/types'
import { deriveSurfaceTokens } from '@/lib/theme/deriveSurfaces'
import { oklchToHex } from '@/lib/theme/color'
import { resolveAppearanceBackground } from '@/lib/theme/resolveAppearance'
import { photoFilterCss } from '@/lib/theme/photoTreatment'
import DuotoneFilterDefs from '@/components/DuotoneFilterDefs'
import DemoPortrait from './DemoPortrait'

const TREATMENTS: { value: PhotoTreatment; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'grayscale', label: 'Niveaux de gris' },
  { value: 'duotone', label: 'Duoton' },
]

type ThumbProps = {
  treatment: PhotoTreatment
  label: string
  photo: string | null
  darkHex: string
  accent: string
  selected: boolean
  onClick: () => void
}

function TreatmentThumb({ treatment, label, photo, darkHex, accent, selected, onClick }: ThumbProps) {
  const duotoneId = useId()
  const filter = photoFilterCss(treatment, duotoneId)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-1.5 min-h-11 text-xs"
    >
      <div
        className="relative size-16 rounded-full overflow-hidden border-2"
        style={{ borderColor: selected ? 'var(--accent)' : 'var(--ink-raised)' }}
      >
        {treatment === 'duotone' && <DuotoneFilterDefs id={duotoneId} darkHex={darkHex} lightHex={accent} />}
        {photo ? (
          <img src={photo} alt="" className="size-full object-cover" style={filter ? { filter } : undefined} />
        ) : (
          <DemoPortrait className="size-full" style={filter ? { filter } : undefined} />
        )}
      </div>
      <span className="flex items-center gap-1">
        {selected && <Check size={11} className="text-accent shrink-0" aria-hidden="true" />}
        {label}
      </span>
    </button>
  )
}

// Aperçu en direct des trois traitements côte à côte (personnalisation
// avancée, Phase 2) — sur la vraie photo si elle existe, sinon sur un
// portrait neutre (DemoPortrait) : le choix doit rester possible avant même
// d'avoir uploadé une photo. Couleurs dérivées du thème actif exactement
// comme sur la page publique (voir IdentityHeader.tsx : même darkHex/accent),
// pour que l'aperçu ne mente jamais sur le rendu réel.
export default function PhotoTreatmentPicker() {
  const { control, setValue } = useFormContext<Profile>()
  const photo = useWatch({ control, name: 'identity.photo' })
  const treatment = useWatch({ control, name: 'identity.photoTreatment' })
  const accent = useWatch({ control, name: 'theme.accent' })
  const appearance = useWatch({ control, name: 'appearance' })
  const background = resolveAppearanceBackground(appearance).hex
  const darkHex = oklchToHex(deriveSurfaceTokens(background).surface0)

  return (
    <div className="mb-5">
      <span className="text-label uppercase tracking-label text-muted block mb-2">Traitement de la photo</span>
      <div className="flex gap-4">
        {TREATMENTS.map(({ value, label }) => (
          <TreatmentThumb
            key={value}
            treatment={value}
            label={label}
            photo={photo}
            darkHex={darkHex}
            accent={accent}
            selected={treatment === value}
            onClick={() => setValue('identity.photoTreatment', value, { shouldDirty: true })}
          />
        ))}
      </div>
    </div>
  )
}
