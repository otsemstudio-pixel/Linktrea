import { useId } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import type { Profile, PhotoTreatment } from '@/types'
import { deriveSurfaceTokens } from '@/lib/theme/deriveSurfaces'
import { oklchToHex } from '@/lib/theme/color'
import { resolveAppearanceBackground } from '@/lib/theme/resolveAppearance'
import { photoFilterCss, VIGNETTE_OVERLAY_CSS } from '@/lib/theme/photoTreatment'
import DuotoneFilterDefs from '@/components/DuotoneFilterDefs'
import DemoPortrait from './DemoPortrait'

const TREATMENTS: { value: PhotoTreatment; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'grayscale', label: 'Niveaux de gris' },
  { value: 'duotone', label: 'Duoton' },
  { value: 'sepia', label: 'Sépia' },
  { value: 'high-contrast', label: 'Contraste élevé' },
  { value: 'muted', label: 'Adouci' },
]

type ThumbProps = {
  treatment: PhotoTreatment
  photo: string | null
  darkHex: string
  accent: string
  vignette: boolean
}

// Miniature réutilisée pour les six traitements ET pour la tuile Vignette
// (avec un traitement forcé plutôt qu'un choix) — un seul endroit qui sait
// dessiner filtre + calque ensemble.
function TreatmentThumb({ treatment, photo, darkHex, accent, vignette }: ThumbProps) {
  const duotoneId = useId()
  const filter = photoFilterCss(treatment, duotoneId)
  return (
    <div className="relative size-16 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--ink-raised)' }}>
      {treatment === 'duotone' && <DuotoneFilterDefs id={duotoneId} darkHex={darkHex} lightHex={accent} />}
      {photo ? (
        <img src={photo} alt="" className="size-full object-cover" style={filter ? { filter } : undefined} />
      ) : (
        <DemoPortrait className="size-full" style={filter ? { filter } : undefined} />
      )}
      {vignette && <div aria-hidden="true" className="absolute inset-0" style={{ background: VIGNETTE_OVERLAY_CSS }} />}
    </div>
  )
}

type TileProps = {
  label: string
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}

function Tile({ label, selected, onClick, children }: TileProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="flex flex-col items-center gap-1.5 min-h-11 text-xs">
      <div className="rounded-full" style={{ boxShadow: selected ? '0 0 0 2px var(--accent)' : 'none' }}>
        {children}
      </div>
      <span className="flex items-center gap-1 text-center">
        {selected && <Check size={11} className="text-accent shrink-0" aria-hidden="true" />}
        {label}
      </span>
    </button>
  )
}

// Aperçu en direct des traitements en grille (personnalisation avancée,
// Phase 2 ; étendu par le correctif "filtres photo étendus") — sur la vraie
// photo si elle existe, sinon sur un portrait neutre (DemoPortrait). Chaque
// miniature reflète aussi l'état actuel de la vignette (calque combinable,
// voir PhotoTreatment dans src/types/profile.ts) : les sept tuiles montrent
// donc bien sept rendus réels, la 7e (Vignette) étant un bouton à bascule
// plutôt qu'un choix exclusif — elle prévisualise le traitement actuellement
// sélectionné, AVEC la vignette forcée, pour montrer l'effet avant de
// l'activer.
export default function PhotoTreatmentPicker() {
  const { control, setValue } = useFormContext<Profile>()
  const photo = useWatch({ control, name: 'identity.photo' })
  const treatment = useWatch({ control, name: 'identity.photoTreatment' })
  const vignette = useWatch({ control, name: 'identity.photoVignette' })
  const accent = useWatch({ control, name: 'theme.accent' })
  const appearance = useWatch({ control, name: 'appearance' })
  const background = resolveAppearanceBackground(appearance).hex
  const darkHex = oklchToHex(deriveSurfaceTokens(background).surface0)

  return (
    <div className="mb-5">
      <span className="text-label uppercase tracking-label text-muted block mb-2">Traitement de la photo</span>
      <div className="grid grid-cols-4 gap-3">
        {TREATMENTS.map(({ value, label }) => (
          <Tile
            key={value}
            label={label}
            selected={treatment === value}
            onClick={() => setValue('identity.photoTreatment', value, { shouldDirty: true })}
          >
            <TreatmentThumb treatment={value} photo={photo} darkHex={darkHex} accent={accent} vignette={vignette} />
          </Tile>
        ))}
        <Tile
          label="Vignette"
          selected={vignette}
          onClick={() => setValue('identity.photoVignette', !vignette, { shouldDirty: true })}
        >
          <TreatmentThumb treatment={treatment} photo={photo} darkHex={darkHex} accent={accent} vignette={true} />
        </Tile>
      </div>
    </div>
  )
}
