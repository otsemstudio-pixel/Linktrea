import { useEffect, useState } from 'react'

type Props = {
  label: string
  value: string // "AAAA-MM", ou '' si incomplet
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

// Plage large plutôt que bornée à quelques années : une position peut
// remonter à plusieurs décennies dans une carrière longue.
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 61 }, (_, i) => CURRENT_YEAR - i)

function parseValue(value: string): { year: string; month: string } {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  return match ? { year: match[1], month: match[2] } : { year: '', month: '' }
}

// Deux <select> (mois, année) composés en une seule chaîne "AAAA-MM" — pas
// register() ici : un champ RHF ordinaire suppose un contrôle par valeur,
// alors que ce composant en pilote deux vers une seule clé de formulaire
// (même logique de champ contrôlé que endDate/highlights dans
// PositionsSection.tsx, où setValue() est déjà utilisé pour cette raison).
//
// État local nécessaire : si mois/année dérivaient uniquement de `value` à
// chaque rendu (parseValue(value) direct, sans useState), choisir le mois
// PUIS l'année perdrait le mois à l'étape intermédiaire — tant que les deux
// ne sont pas renseignés, onChange('') est appelé (value reste ''), donc
// parseValue('') retomberait sur { month: '', year: '' } et effacerait
// visuellement le mois qu'on vient de choisir. L'état local retient les deux
// moitiés indépendamment ; le useEffect ne fait que RESYNCHRONISER depuis
// l'extérieur (décochage "En cours", changement de position).
export default function MonthYearSelect({ label, value, onChange, disabled, error }: Props) {
  const [month, setMonth] = useState(() => parseValue(value).month)
  const [year, setYear] = useState(() => parseValue(value).year)

  useEffect(() => {
    const parsed = parseValue(value)
    setMonth(parsed.month)
    setYear(parsed.year)
  }, [value])

  function updateMonth(nextMonth: string) {
    setMonth(nextMonth)
    onChange(year && nextMonth ? `${year}-${nextMonth}` : '')
  }
  function updateYear(nextYear: string) {
    setYear(nextYear)
    onChange(nextYear && month ? `${nextYear}-${month}` : '')
  }

  return (
    <div className="mb-4">
      <span className="text-label uppercase tracking-label text-muted block mb-1.5">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={month}
          disabled={disabled}
          onChange={(e) => updateMonth(e.target.value)}
          aria-label={`${label} — mois`}
          className="w-full min-h-11 rounded-md border border-ink-raised bg-surface-inset px-3 text-sm text-paper disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 focus:border-accent"
        >
          <option value="">Mois</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={year}
          disabled={disabled}
          onChange={(e) => updateYear(e.target.value)}
          aria-label={`${label} — année`}
          className="w-full min-h-11 rounded-md border border-ink-raised bg-surface-inset px-3 text-sm text-paper disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 focus:border-accent"
        >
          <option value="">Année</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-down" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
