import type { Profile, Holding, TickerPlatform } from '@/types'
import { sortedPositions } from '@/lib/deriveStats'
import { formatCvDateRange, type CvLang } from './formatCvDate'

export type CvContact = {
  platform: TickerPlatform
  text: string
}

export type CvExperienceEntry = {
  id: string
  role: string
  company: string
  dateRange: string
  current: boolean
  description: string
  highlights: string[]
}

export type CvSkillGroup = {
  category: string
  items: string[]
}

export type CvCertification = {
  id: string
  title: string
  institution: string
  year: string
}

export type CvData = {
  fullName: string
  headline: string
  location: string
  photo: string | null
  contacts: CvContact[]
  summary: string
  experience: CvExperienceEntry[]
  skills: CvSkillGroup[]
  certifications: CvCertification[]
}

// Réseaux pertinents pour l'en-tête d'un CV — un canal de contact
// professionnel (email, site perso, LinkedIn, GitHub), pas les réseaux
// sociaux grand public (X, Instagram, Behance) qui ont leur place sur le
// profil public mais pas sur un CV envoyé à un recruteur.
const CV_RELEVANT_PLATFORMS: TickerPlatform[] = ['email', 'linkedin', 'website', 'github']

function buildContacts(profile: Profile): CvContact[] {
  return profile.tickers
    .filter((t) => CV_RELEVANT_PLATFORMS.includes(t.platform))
    .map((t) => ({ platform: t.platform, text: t.handle }))
}

function buildExperience(profile: Profile, lang: CvLang): CvExperienceEntry[] {
  return sortedPositions(profile.positions).map((p) => ({
    id: p.id,
    role: p.role,
    company: p.company,
    dateRange: formatCvDateRange(p.startDate, p.endDate, lang),
    current: p.endDate === null,
    description: p.description,
    highlights: p.highlights,
  }))
}

// Groupé par catégorie (champ déjà présent sur Holding), dans l'ordre de
// première apparition — un CV texte reste plus lisible et plus facile à
// parser pour un ATS en liste qu'avec l'anneau/la barre de progression du
// profil public (voir le prompt : « pas en anneau ni en barre »).
function buildSkills(holdings: Holding[]): CvSkillGroup[] {
  const order: string[] = []
  const byCategory = new Map<string, string[]>()
  for (const h of holdings) {
    if (!byCategory.has(h.category)) {
      byCategory.set(h.category, [])
      order.push(h.category)
    }
    byCategory.get(h.category)!.push(h.label)
  }
  return order.map((category) => ({ category, items: byCategory.get(category)! }))
}

export function mapProfileToCv(profile: Profile, lang: CvLang): CvData {
  return {
    fullName: profile.identity.fullName,
    headline: profile.identity.headline,
    location: profile.identity.location,
    photo: profile.identity.photo,
    contacts: buildContacts(profile),
    summary: profile.identity.bio,
    experience: buildExperience(profile, lang),
    skills: buildSkills(profile.holdings),
    certifications: profile.certificates.map((c) => ({ id: c.id, title: c.title, institution: c.institution, year: c.year })),
  }
}
