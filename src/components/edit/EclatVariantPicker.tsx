import { Check } from 'lucide-react'
import type { EclatVariant } from '@/types'
import { ECLAT_VARIANT_IDS, ECLAT_VARIANT_META } from '@/lib/theme/galleryThemes'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import EclatBackgroundLayer from '@/components/view/EclatBackgroundLayer'

type Props = {
  value: EclatVariant
  onChange: (variant: EclatVariant) => void
  // Fond animé du mode Personnalisé (voir CustomThemeSettings.animatedColors)
  // — même sélecteur, même aperçus animés, palette libre au lieu de la
  // palette fixe d'Éclat. undefined pour l'usage Galerie (Éclat) d'origine.
  colors?: [string, string, string]
  // "Variante" (Éclat, nom de thème) vs "Style d'animation" (Personnalisé,
  // axe générique) — même liste de valeurs, vocabulaire différent selon le
  // contexte d'appel.
  label?: string
}

// Sélecteur avec aperçu miniature ANIMÉ des cinq variantes (Phase 1 du
// prompt "Éclat") — pas juste une liste de noms. Animé indépendamment de
// l'interrupteur "Fond animé" (qui ne pilote que le rendu de la page
// publique) : ici, seule la préférence reduced motion compte, pour montrer
// à quoi ressemble chaque variante sans imposer de mouvement à qui a
// demandé d'en avoir le moins possible.
export default function EclatVariantPicker({ value, onChange, colors, label = 'Variante' }: Props) {
  const { reduced } = useMotionPrefs()

  return (
    <div className="mt-3">
      <span className="text-label uppercase tracking-label text-muted block mb-2">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {ECLAT_VARIANT_IDS.map((variant) => {
          const meta = ECLAT_VARIANT_META[variant]
          const selected = value === variant
          return (
            <button
              key={variant}
              type="button"
              onClick={() => onChange(variant)}
              aria-pressed={selected}
              className="relative aspect-square rounded-lg border overflow-hidden flex flex-col items-center justify-end gap-1 p-1.5 text-xs"
              style={{ borderColor: selected ? 'var(--accent)' : 'var(--ink-raised)', background: '#0D0E0C' }}
            >
              <EclatBackgroundLayer variant={variant} active={!reduced} colors={colors} />
              <span className="relative z-10 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5" style={{ color: '#E7E8E7' }}>
                {selected && <Check size={11} className="shrink-0" aria-hidden="true" />}
                {meta.name}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted mt-2">{ECLAT_VARIANT_META[value].description}</p>
    </div>
  )
}
