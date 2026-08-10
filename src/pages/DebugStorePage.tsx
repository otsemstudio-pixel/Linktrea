import { useState } from 'react'
import { LocalProfileStore } from '@/lib/store/LocalProfileStore'
import { createEmptyProfile } from '@/lib/emptyProfile'
import type { Profile } from '@/types'

// Vérifie LocalProfileStore uniquement — SupabaseProfileStore a besoin
// d'une session authentifiée (Phase 3, pas encore construite) pour être
// testée pour de vrai. Ne fait pas partie du site public.
const STORAGE_KEY = 'ledger:local-store'

function buildFixtureProfile(): Profile {
  const profile = createEmptyProfile()
  profile.identity = {
    fullName: 'Store Fixture',
    headline: 'Test',
    location: 'Test',
    bio: '',
    photo: null,
    photoTreatment: 'none',
    availability: 'open',
    signature: '',
  }
  return profile
}

type TestCase = {
  name: string
  run: () => Promise<{ pass: boolean; detail: string }>
}

export default function DebugStorePage() {
  const [log, setLog] = useState<string[]>([])

  const store = new LocalProfileStore()

  const cases: TestCase[] = [
    {
      name: 'loadMine() sans donnée -> null',
      run: async () => {
        localStorage.removeItem(STORAGE_KEY)
        const result = await store.loadMine()
        return { pass: result === null, detail: JSON.stringify(result) }
      },
    },
    {
      name: 'save() puis loadMine() -> round-trip',
      run: async () => {
        localStorage.removeItem(STORAGE_KEY)
        const fixture = buildFixtureProfile()
        await store.save(fixture)
        const result = await store.loadMine()
        const same = JSON.stringify(result) === JSON.stringify(fixture)
        return { pass: same, detail: same ? 'OK' : 'profil différent après round-trip' }
      },
    },
    {
      name: 'publish() format invalide -> reason "invalid"',
      run: async () => {
        localStorage.removeItem(STORAGE_KEY)
        await store.save(buildFixtureProfile())
        const result = await store.publish('ab') // trop court (min 3)
        const pass = result.ok === false && result.reason === 'invalid'
        return { pass, detail: JSON.stringify(result) }
      },
    },
    {
      name: 'publish() tiret en tête -> reason "invalid"',
      run: async () => {
        const result = await store.publish('-jean')
        const pass = result.ok === false && result.reason === 'invalid'
        return { pass, detail: JSON.stringify(result) }
      },
    },
    {
      name: 'publish() valide -> ok, puis loadBySlug() la retrouve',
      run: async () => {
        localStorage.removeItem(STORAGE_KEY)
        const fixture = buildFixtureProfile()
        await store.save(fixture)
        const publishResult = await store.publish('Jean-David') // casse volontaire
        if (!publishResult.ok) return { pass: false, detail: `publish a échoué: ${JSON.stringify(publishResult)}` }

        const bySlug = await store.loadBySlug('jean-david') // normalisé en minuscules
        const same = JSON.stringify(bySlug) === JSON.stringify(fixture)
        return { pass: same, detail: same ? 'OK — slug normalisé et retrouvé' : 'profil non retrouvé ou différent' }
      },
    },
    {
      name: 'unpublish() -> loadBySlug() ne retrouve plus rien',
      run: async () => {
        await store.unpublish()
        const bySlug = await store.loadBySlug('jean-david')
        return { pass: bySlug === null, detail: JSON.stringify(bySlug) }
      },
    },
    {
      name: 'loadMine() après unpublish() -> profil toujours là (éditable)',
      run: async () => {
        const mine = await store.loadMine()
        return { pass: mine !== null, detail: mine ? 'profil conservé, comme attendu' : 'profil perdu — BUG' }
      },
    },
  ]

  async function runAll() {
    const lines: string[] = []
    for (const c of cases) {
      const { pass, detail } = await c.run()
      lines.push(`${pass ? 'PASS' : 'FAIL'} — ${c.name} — ${detail}`)
    }
    setLog(lines)
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Debug — ProfileStore (local)</h1>
      <p>Page de test manuel pour LocalProfileStore. Ne fait pas partie du site public.</p>
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
