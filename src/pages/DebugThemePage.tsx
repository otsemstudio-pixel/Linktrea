import { useState } from 'react'
import type { ThemePreset } from '@/types'

const PRESETS: ThemePreset[] = ['terminal', 'ledger', 'vault', 'tape']

const TOKEN_ROWS: { token: string; label: string }[] = [
  { token: '--ink', label: 'Fond principal' },
  { token: '--ink-raised', label: 'Surface surélevée' },
  { token: '--paper', label: 'Texte principal' },
  { token: '--muted', label: 'Labels / métadonnées' },
  { token: '--accent', label: 'Accent (donnée mise en avant)' },
  { token: '--up', label: 'Variation positive' },
  { token: '--down', label: 'Variation négative' },
]

export default function DebugThemePage() {
  const [preset, setPreset] = useState<ThemePreset>('terminal')

  return (
    <div data-preset={preset} className="min-h-dvh bg-ink text-paper p-6 font-sans">
      <h1 className="text-2xl font-semibold mb-1">Debug — thème</h1>
      <p className="text-muted text-sm mb-6">
        Page de vérification visuelle des 4 presets. Ne fait pas partie du site public.
      </p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className="min-h-11 px-4 rounded-md border capitalize"
            style={{
              borderColor: p === preset ? 'var(--accent)' : 'var(--muted)',
              color: p === preset ? 'var(--accent)' : 'var(--paper)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Palette — {preset}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOKEN_ROWS.map((row) => (
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

      <section>
        <h2 className="text-label uppercase tracking-label text-muted mb-3">Polices actives</h2>
        <p className="font-mono text-sm">--font-mono: var(--font-mono)</p>
        <p className="font-sans text-sm">--font-sans: var(--font-sans)</p>
      </section>
    </div>
  )
}
