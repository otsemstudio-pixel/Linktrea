import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import type { Profile, BackgroundId, FontDuoId } from '@/types'
import { BACKGROUNDS, BACKGROUND_IDS } from '@/lib/theme/backgrounds'
import { ACCENT_SUGGESTIONS } from '@/lib/theme/accentSuggestions'
import { resolveAccent } from '@/lib/theme/accent'
import { FONT_DUOS, FONT_DUO_IDS } from '@/lib/theme/fontDuos'

const ADJUSTED_NOTICE_DURATION_MS = 4000

export default function AppearanceSection() {
  const { control, setValue } = useFormContext<Profile>()
  const background = useWatch({ control, name: 'theme.background' })
  const accent = useWatch({ control, name: 'theme.accent' })
  const fontDuo = useWatch({ control, name: 'theme.fontDuo' })
  const motion = useWatch({ control, name: 'theme.motion' })

  // Message transitoire "ajusté pour la lisibilité" — pas un état dérivé de
  // theme.accent : la valeur stockée est toujours DÉJÀ corrigée (voir
  // resolveAccent), donc on ne peut pas savoir après coup si une correction
  // a eu lieu. On le garde en local, posé au moment du choix, et effacé
  // après quelques secondes.
  const [adjustedNotice, setAdjustedNotice] = useState(false)

  useEffect(() => {
    if (!adjustedNotice) return
    const timer = setTimeout(() => setAdjustedNotice(false), ADJUSTED_NOTICE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [adjustedNotice])

  function selectBackground(id: BackgroundId) {
    setValue('theme.background', id, { shouldDirty: true })
    // Un accent lisible sur l'ancien fond peut ne plus l'être sur le
    // nouveau (ex. jaune clair lisible sur Graphite, illisible sur Papier)
    // — on le revalide immédiatement, jamais après coup.
    const resolved = resolveAccent(accent, id)
    setValue('theme.accent', resolved.hex, { shouldDirty: true })
    setAdjustedNotice(resolved.adjusted)
  }

  function pickAccent(hex: string) {
    const resolved = resolveAccent(hex, background)
    setValue('theme.accent', resolved.hex, { shouldDirty: true })
    setAdjustedNotice(resolved.adjusted)
  }

  function selectFontDuo(id: FontDuoId) {
    setValue('theme.fontDuo', id, { shouldDirty: true })
  }

  return (
    <>
      <span className="text-label uppercase tracking-label text-muted block mb-2">Fond</span>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {BACKGROUND_IDS.map((id) => {
          const def = BACKGROUNDS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectBackground(id)}
              aria-pressed={background === id}
              className="rounded-lg border p-3 text-left min-h-11 flex items-center gap-3"
              style={{ borderColor: background === id ? 'var(--accent)' : 'var(--ink-raised)' }}
            >
              <span
                className="size-8 rounded-full border shrink-0"
                style={{ background: def.base, borderColor: def.isLight ? 'var(--ink-raised)' : 'transparent' }}
                aria-hidden="true"
              />
              <span className="flex flex-col min-w-0">
                <span className="text-sm flex items-center gap-1.5">
                  {def.label}
                  {background === id && <Check size={13} className="text-accent shrink-0" aria-hidden="true" />}
                </span>
                <span className="text-xs text-muted truncate">{def.character}</span>
              </span>
            </button>
          )
        })}
      </div>

      <span className="text-label uppercase tracking-label text-muted block mb-2">Accent</span>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {ACCENT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.hex}
            type="button"
            onClick={() => pickAccent(suggestion.hex)}
            aria-label={suggestion.name}
            aria-pressed={accent?.toLowerCase() === suggestion.hex.toLowerCase()}
            className="size-9 min-h-9 rounded-full border-2 flex items-center justify-center"
            style={{
              background: suggestion.hex,
              borderColor:
                accent?.toLowerCase() === suggestion.hex.toLowerCase() ? 'var(--paper)' : 'transparent',
            }}
          >
            {accent?.toLowerCase() === suggestion.hex.toLowerCase() && (
              <Check size={14} className="text-ink" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 min-h-11 mb-1">
        <span className="text-sm">Personnalisé</span>
        <input
          type="color"
          value={accent ?? '#E4A93C'}
          onChange={(e) => pickAccent(e.target.value)}
          className="h-9 w-14 rounded-md border border-ink-raised bg-transparent p-0.5"
        />
        <span className="text-xs font-mono text-muted">{accent}</span>
      </label>

      {adjustedNotice && (
        <p className="text-xs text-muted mb-4" role="status">
          Ajusté pour la lisibilité.
        </p>
      )}

      <span className="text-label uppercase tracking-label text-muted block mb-2 mt-5">Typographie</span>
      {/* Aperçus en image statique (public/theme/duo-previews) : afficher ce
          sélecteur ne doit jamais charger les 14 paires de polices — seul le
          duo réellement choisi est récupéré, voir loadFontDuo.ts. */}
      <div className="grid grid-cols-2 gap-2 mb-1">
        {FONT_DUO_IDS.map((id) => {
          const def = FONT_DUOS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectFontDuo(id)}
              aria-pressed={fontDuo === id}
              className="rounded-lg border p-2 text-left min-h-11 flex items-center justify-between gap-2"
              style={{ borderColor: fontDuo === id ? 'var(--accent)' : 'var(--ink-raised)' }}
            >
              <img
                src={`${import.meta.env.BASE_URL}theme/duo-previews/${id}.png`}
                alt={`${def.name} — ${def.character}`}
                width={140}
                height={36}
                className="h-9 w-auto"
              />
              {fontDuo === id && <Check size={14} className="text-accent shrink-0" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted mb-4">{FONT_DUOS[fontDuo].character}</p>

      <label className="flex items-center gap-2 min-h-11 text-sm mt-4">
        <input
          type="checkbox"
          checked={motion === 'reduced'}
          onChange={(e) => setValue('theme.motion', e.target.checked ? 'reduced' : 'full', { shouldDirty: true })}
          className="size-4 accent-[var(--accent)]"
        />
        Réduire les animations
      </label>
    </>
  )
}
