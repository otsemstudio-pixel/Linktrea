import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import type { Profile, ThemePreset } from '@/types'
import { PRESET_COLORS } from '@/lib/presetColors'

const PRESET_LABELS: Record<ThemePreset, string> = {
  terminal: 'Terminal',
  ledger: 'Ledger',
  vault: 'Vault',
  tape: 'Tape',
}

export default function AppearanceSection() {
  const { control, setValue } = useFormContext<Profile>()
  const preset = useWatch({ control, name: 'theme.preset' })
  const motion = useWatch({ control, name: 'theme.motion' })

  function selectPreset(value: ThemePreset) {
    setValue('theme.preset', value, { shouldDirty: true })
    setValue('theme.accent', PRESET_COLORS[value].accent, { shouldDirty: true })
  }

  return (
    <>
      <span className="text-label uppercase tracking-label text-muted block mb-2">Thème</span>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(Object.keys(PRESET_COLORS) as ThemePreset[]).map((value) => {
          const colors = PRESET_COLORS[value]
          return (
            <button
              key={value}
              type="button"
              onClick={() => selectPreset(value)}
              aria-pressed={preset === value}
              className="rounded-lg border p-3 text-left min-h-11"
              style={{ borderColor: preset === value ? colors.accent : 'var(--ink-raised)', background: colors.ink }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: colors.paper }}>
                  {PRESET_LABELS[value]}
                </span>
                {preset === value && <Check size={14} style={{ color: colors.accent }} aria-hidden="true" />}
              </div>
              <div className="h-2 rounded-full" style={{ background: colors.accent, width: '60%' }} />
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 min-h-11 text-sm">
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
