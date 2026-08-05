import { useMemo, useState } from 'react'
import { encodeProfile, decodeProfile, PAYLOAD_WARNING_THRESHOLD } from '@/lib/codec'
import { createEmptyProfile } from '@/lib/emptyProfile'
import type { Profile } from '@/types'

// Fixture de test volontairement chargée (positions, holdings, certificats,
// tickers) pour vérifier que l'aller-retour encode/decode préserve tout,
// y compris les tableaux vides implicites et les champs nullable.
function buildFixtureProfile(): Profile {
  const profile = createEmptyProfile()
  profile.identity = {
    fullName: 'Test Fixture',
    headline: 'Analyste · Test',
    location: 'Abidjan, CI',
    bio: 'Profil de test pour valider le codec.',
    photo: null,
    availability: 'open',
  }
  profile.positions = [
    {
      id: 'pos-1',
      role: 'Analyste financier',
      company: 'Société X',
      startDate: '2023-01',
      endDate: null,
      description: 'Analyse de portefeuille.',
      highlights: ['+18% de rendement', '12 clients suivis'],
    },
  ]
  profile.holdings = [
    { id: 'hold-1', label: 'Modélisation financière', category: 'Analyse', weight: 42, years: 5 },
    { id: 'hold-2', label: 'Excel avancé', category: 'Outils', weight: 28, years: 6 },
  ]
  profile.certificates = [
    {
      id: 'cert-1',
      title: 'Licence Finance',
      institution: 'ESATIC',
      year: '2021',
      credentialUrl: 'https://example.com/cred/1',
      fileUrl: null,
    },
  ]
  profile.tickers = [
    { id: 'tick-1', platform: 'linkedin', handle: 'test-fixture', url: 'https://linkedin.com/in/test-fixture' },
  ]
  profile.theme = { preset: 'ledger', accent: '#E4A93C', motion: 'full' }
  return profile
}

type TestCase = {
  name: string
  run: () => { pass: boolean; detail: string }
}

export default function DebugCodecPage() {
  const [log, setLog] = useState<string[]>([])

  const fixture = useMemo(buildFixtureProfile, [])

  const cases: TestCase[] = useMemo(
    () => [
      {
        name: 'Round-trip profil chargé',
        run: () => {
          const encoded = encodeProfile(fixture)
          const result = decodeProfile(encoded)
          if (!result.ok) return { pass: false, detail: result.error }
          const same = JSON.stringify(result.profile) === JSON.stringify(fixture)
          return {
            pass: same,
            detail: same
              ? `OK — payload de ${encoded.length} caractères`
              : 'Le profil décodé diffère du profil original',
          }
        },
      },
      {
        name: 'Round-trip profil vide',
        run: () => {
          const empty = createEmptyProfile()
          const encoded = encodeProfile(empty)
          const result = decodeProfile(encoded)
          if (!result.ok) return { pass: false, detail: result.error }
          const same = JSON.stringify(result.profile) === JSON.stringify(empty)
          return { pass: same, detail: same ? `OK — payload de ${encoded.length} caractères` : 'Divergence' }
        },
      },
      {
        name: 'Payload vide rejeté',
        run: () => {
          const result = decodeProfile('')
          return { pass: !result.ok, detail: result.ok ? 'Aurait dû échouer' : result.error }
        },
      },
      {
        name: 'Payload corrompu rejeté',
        run: () => {
          const result = decodeProfile('###not-a-valid-payload###')
          return { pass: !result.ok, detail: result.ok ? 'Aurait dû échouer' : result.error }
        },
      },
      {
        name: 'Payload tronqué rejeté',
        run: () => {
          const encoded = encodeProfile(fixture)
          const truncated = encoded.slice(0, Math.max(0, encoded.length - 5))
          const result = decodeProfile(truncated)
          return { pass: !result.ok, detail: result.ok ? 'Aurait dû échouer' : result.error }
        },
      },
      {
        name: 'Seuil d\'avertissement payload',
        run: () => {
          const encoded = encodeProfile(fixture)
          const withinBudget = encoded.length < PAYLOAD_WARNING_THRESHOLD
          return {
            pass: withinBudget,
            detail: `${encoded.length} / ${PAYLOAD_WARNING_THRESHOLD} caractères`,
          }
        },
      },
    ],
    [fixture],
  )

  function runAll() {
    const lines = cases.map((c) => {
      const { pass, detail } = c.run()
      return `${pass ? 'PASS' : 'FAIL'} — ${c.name} — ${detail}`
    })
    setLog(lines)
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Debug — codec.ts</h1>
      <p>Page de test manuel pour encodeProfile() / decodeProfile(). Ne fait pas partie du site public.</p>
      <button onClick={runAll} style={{ padding: '8px 16px', marginBottom: 16 }}>
        Lancer les tests
      </button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {log.map((line, i) => (
          <li
            key={i}
            style={{
              color: line.startsWith('PASS') ? 'green' : 'crimson',
              marginBottom: 4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}
