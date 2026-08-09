import { useState } from 'react'
import type { AppearanceConfig, FontDuoId } from '@/types'
import { ACCENT_SUGGESTIONS } from '@/lib/theme/accentSuggestions'
import { resolveAccent, accentCssTokens } from '@/lib/theme/accent'
import { hexToOklch } from '@/lib/theme/color'
import { FONT_DUOS, FONT_DUO_IDS } from '@/lib/theme/fontDuos'
import { useAppliedTheme } from '@/lib/theme/useAppliedTheme'

const BACKGROUND_PRESETS = [
  { label: 'Graphite', hex: '#0D0E0C' },
  { label: 'Encre', hex: '#0A0F1A' },
  { label: 'Papier', hex: '#EDE8DE' },
  { label: 'Onyx', hex: '#000000' },
]

const SURFACE_ROWS: { token: string; label: string }[] = [
  { token: '--surface-0', label: 'Fond principal' },
  { token: '--surface-1', label: 'Surface élevée' },
  { token: '--surface-2', label: 'Surface très élevée' },
  { token: '--surface-inset', label: 'Champ enfoncé' },
  { token: '--fg', label: 'Texte principal' },
  { token: '--fg-muted', label: 'Labels / métadonnées' },
  { token: '--up', label: 'Variation positive' },
  { token: '--down', label: 'Variation négative' },
]

const ACCENT_ROWS: { token: string; label: string }[] = [
  { token: '--accent', label: 'Accent' },
  { token: '--accent-hover', label: 'Accent (survol)' },
  { token: '--accent-border', label: 'Accent (bordure)' },
  { token: '--accent-subtle', label: 'Accent (fond translucide)' },
]

export default function DebugThemePage() {
  const [backgroundHex, setBackgroundHex] = useState('#0D0E0C')
  const [accent, setAccent] = useState('#E4A93C')
  const [fontDuo, setFontDuo] = useState<FontDuoId>('suisse')
  // Comme accent stocke déjà la valeur corrigée, re-résoudre après coup
  // donnerait toujours adjusted=false — il faut capturer le flag au moment
  // du choix, pas le recalculer depuis l'état déjà corrigé.
  const [lastAdjusted, setLastAdjusted] = useState(false)

  // Enveloppé en thème Personnalisé (refonte v2, Phase 2) : le fond est
  // désormais une couleur libre, plus l'un de 4 BackgroundId fixes — cette
  // page de debug pilote useAppliedTheme exactement comme le ferait le vrai
  // mode Personnalisé de l'éditeur.
  const appearance: AppearanceConfig = {
    kind: 'custom',
    settings: {
      background: backgroundHex,
      buttonColor: accent,
      buttonTextColor: '#0D0E0C',
      pageTextColor: '#E7E8E7',
      headingColor: '#E7E8E7',
      pageFontDuo: fontDuo,
      headingFontFamily: null,
      buttonStyle: 'solid',
      headerLayout: 'classic',
    },
    motion: 'full',
  }

  useAppliedTheme(appearance, accent)
  const isLight = hexToOklch(backgroundHex).l > 0.5
  const resolved = resolveAccent(accent, backgroundHex)
  const tokens = accentCssTokens(resolved.color, isLight)

  function pickAccent(hex: string) {
    const next = resolveAccent(hex, backgroundHex)
    setAccent(next.hex)
    setLastAdjusted(next.adjusted)
  }

  function pickBackground(hex: string) {
    setBackgroundHex(hex)
    const next = resolveAccent(accent, hex)
    setAccent(next.hex)
    setLastAdjusted(next.adjusted)
  }

  return (
    <div className="min-h-dvh bg-ink text-paper p-6 font-sans">
      <h1 className="text-2xl font-semibold mb-1">Debug — thème</h1>
      <p className="text-muted text-sm mb-6">
        Page de vérification visuelle du fond libre + accent (refonte v2, Phase 2). Ne fait pas partie du site
        public.
      </p>

      <section className="mb-8">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Fond</h2>
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => pickBackground(preset.hex)}
              className="min-h-11 px-4 rounded-md border"
              style={{
                borderColor: preset.hex === backgroundHex ? 'var(--accent)' : 'var(--muted)',
                color: preset.hex === backgroundHex ? 'var(--accent)' : 'var(--paper)',
              }}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="color"
            value={backgroundHex}
            onChange={(e) => pickBackground(e.target.value)}
            className="h-11 w-14 rounded-md border border-ink-raised bg-transparent p-0.5"
          />
        </div>
        <p className="text-xs text-muted font-mono">{backgroundHex}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Accent — 12 suggestions</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          {ACCENT_SUGGESTIONS.map((s) => (
            <button
              key={s.hex}
              onClick={() => pickAccent(s.hex)}
              aria-label={s.name}
              className="size-9 rounded-full border-2"
              style={{ background: s.hex, borderColor: accent === s.hex ? 'var(--paper)' : 'transparent' }}
            />
          ))}
        </div>
        <label className="flex items-center gap-3 min-h-11">
          <span className="text-sm">Libre</span>
          <input type="color" value={accent} onChange={(e) => pickAccent(e.target.value)} className="h-9 w-14" />
          <span className="text-xs font-mono text-muted">{accent}</span>
        </label>
        {lastAdjusted && (
          <p className="text-xs mt-2 text-muted" role="status">
            Ajusté pour la lisibilité (contraste &lt; 4.5:1 sur le fond choisi) → {accent}
          </p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Palette — surfaces &amp; texte</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SURFACE_ROWS.map((row) => (
            <div key={row.token} className="rounded-md overflow-hidden border border-ink-raised">
              <div className="h-16" style={{ background: `var(${row.token})` }} />
              <div className="bg-ink-raised p-2 text-xs">
                <div className="font-mono">{row.token}</div>
                <div className="text-muted">{row.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Palette — accent dérivé</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCENT_ROWS.map((row) => (
            <div key={row.token} className="rounded-md overflow-hidden border border-ink-raised">
              <div className="h-16" style={{ background: `var(${row.token})` }} />
              <div className="bg-ink-raised p-2 text-xs">
                <div className="font-mono">{row.token}</div>
                <div className="text-muted">{row.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-2 font-mono">
          {tokens.accent} · {tokens.accentHover} · {tokens.accentBorder} · {tokens.accentSubtle}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Duo typographique — 14 options</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {FONT_DUO_IDS.map((id) => {
            const def = FONT_DUOS[id]
            return (
              <button
                key={id}
                onClick={() => setFontDuo(id)}
                className="text-left rounded-md border p-2.5"
                style={{ borderColor: id === fontDuo ? 'var(--accent)' : 'var(--muted)' }}
              >
                <div className="text-sm" style={{ color: id === fontDuo ? 'var(--accent)' : 'var(--paper)' }}>
                  {def.name}
                </div>
                <div className="text-xs text-muted">{def.character}</div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted font-mono">
          --font-sans: {FONT_DUOS[fontDuo].titleFamily} · --font-mono: {FONT_DUOS[fontDuo].monoFamily}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Échelle typographique</h2>
        <div className="mb-4">
          <div className="text-label uppercase tracking-label text-muted mb-1">Chiffre clé (mono)</div>
          <div className="font-mono font-medium" style={{ fontSize: 'var(--text-hero)' }}>
            8 ANS
          </div>
        </div>
        <div className="mb-4">
          <div className="text-label uppercase tracking-label text-muted mb-1">Label (uppercase, tracking large)</div>
          <div className="font-mono text-label uppercase tracking-label">Valeur totale</div>
        </div>
        <div>
          <div className="text-label uppercase tracking-label text-muted mb-1">Texte courant (sans)</div>
          <p className="font-sans max-w-md">
            Analyste financier basé à Abidjan, spécialisé en modélisation et en allocation de portefeuille.
          </p>
        </div>
      </section>
    </div>
  )
}
