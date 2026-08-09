// Statistiques dérivées de l'état réel du Profile — rien n'est stocké en
// dur : le nombre d'années, les allocations par catégorie et la tendance
// de la sparkline se recalculent à chaque rendu à partir des données brutes.
import type { Holding, Position, Profile } from '@/types'

function parseYearMonth(value: string): number {
  const [year, month] = value.split('-').map(Number)
  return year * 12 + (month - 1)
}

export function yearsOfExperience(positions: Position[], now: Date = new Date()): number {
  if (positions.length === 0) return 0
  const starts = positions.map((p) => parseYearMonth(p.startDate))
  const ends = positions.map((p) => (p.endDate ? parseYearMonth(p.endDate) : parseYearMonth(`${now.getFullYear()}-${now.getMonth() + 1}`)))
  const earliestStart = Math.min(...starts)
  const latestEnd = Math.max(...ends)
  return Math.max(0, Math.floor((latestEnd - earliestStart) / 12))
}

export type CategoryAllocation = {
  category: string
  weight: number
}

export function categoryAllocations(holdings: Holding[]): CategoryAllocation[] {
  const byCategory = new Map<string, number>()
  for (const holding of holdings) {
    byCategory.set(holding.category, (byCategory.get(holding.category) ?? 0) + holding.weight)
  }
  return Array.from(byCategory, ([category, weight]) => ({ category, weight })).sort(
    (a, b) => b.weight - a.weight,
  )
}

export function sortedHoldings(holdings: Holding[]): Holding[] {
  return [...holdings].sort((a, b) => b.weight - a.weight)
}

export function sortedPositions(positions: Position[]): Position[] {
  return [...positions].sort((a, b) => parseYearMonth(b.startDate) - parseYearMonth(a.startDate))
}

// Courbe de progression pour la sparkline : nombre cumulé de compétences
// acquises, ordonnées par ancienneté (years) croissante. Purement dérivé
// des holdings existants, aucune donnée inventée.
//
// Toujours au moins 2 points : Sparkline (KeyMetric.tsx) positionne le i-ème
// point à `i / (trend.length - 1)`, une division par zéro avec un seul point
// (profil à exactement une compétence) qui produit un chemin SVG NaN —
// repéré en testant les Phases 5 et 6 avec des profils de démonstration
// minimaux. Un point unique devient donc une petite montée depuis 0, comme
// le cas déjà géré à 0 compétence.
export function experienceTrend(holdings: Holding[]): number[] {
  if (holdings.length === 0) return [0, 0]
  const byAge = [...holdings].sort((a, b) => b.years - a.years)
  const points = byAge.map((_, i) => i + 1)
  return points.length > 1 ? points : [0, points[0]]
}

export function totalPositions(positions: Position[]): number {
  return positions.length
}

export function totalHoldings(holdings: Holding[]): number {
  return holdings.length
}

export function displayYearRange(position: Position): string {
  const startYear = position.startDate.split('-')[0]
  const endYear = position.endDate ? position.endDate.split('-')[0] : 'présent'
  return `${startYear} – ${endYear}`
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function weightSum(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + h.weight, 0)
}

// Un profil "vide" (Phase 4) : rien de significatif saisi — pas seulement
// aucune position/compétence, mais aucun nom non plus, ce qui distingue un
// profil fraîchement créé d'un profil réel mais partiellement rempli (celui-
// ci doit s'afficher normalement, avec les états vides par section).
export function isProfileEmpty(profile: Profile): boolean {
  return (
    !profile.identity.fullName.trim() &&
    profile.positions.length === 0 &&
    profile.holdings.length === 0 &&
    profile.certificates.length === 0
  )
}
