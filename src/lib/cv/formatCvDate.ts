// Formatage des dates du CV — Intl.DateTimeFormat plutôt qu'une table de
// mois écrite à la main (déjà présente dans MonthYearSelect.tsx, mais pour
// un usage différent : les <option> de l'éditeur veulent le nom complet,
// le CV veut l'abréviation locale standard). Le paramètre `lang` existe dès
// la Phase 1 : la Phase 2 (bilingue) de ce même prompt réutilise cette
// fonction telle quelle plutôt que de la réécrire, aucune des deux locales
// n'ajoute de complexité qu'Intl ne gère pas déjà nativement.
import type { CvLang } from './types'
export type { CvLang }

const LOCALE: Record<CvLang, string> = { fr: 'fr-FR', en: 'en-US' }
const PRESENT: Record<CvLang, string> = { fr: 'Présent', en: 'Present' }

// 'AAAA-MM' → "janv. 2023" / "Jan 2023" selon la langue, '' si la valeur ne
// suit pas ce format (voir parseYearMonth dans deriveStats.ts pour le même
// garde-fou côté profil public).
export function formatCvMonthYear(yearMonth: string, lang: CvLang): string {
  const match = /^(\d{4})-(\d{1,2})$/.exec(yearMonth)
  if (!match) return ''
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  return new Intl.DateTimeFormat(LOCALE[lang], { month: 'short', year: 'numeric' }).format(date)
}

export function formatCvDateRange(startDate: string, endDate: string | null, lang: CvLang): string {
  const start = formatCvMonthYear(startDate, lang)
  const end = endDate ? formatCvMonthYear(endDate, lang) : PRESENT[lang]
  return `${start} – ${end}`
}
