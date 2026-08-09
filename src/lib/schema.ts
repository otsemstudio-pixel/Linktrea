// Schéma de validation runtime du Profile. Sert de garde-fou pour tout
// payload venant d'une source non fiable (hash d'URL, fichier JSON importé) :
// on ne fait jamais confiance à un JSON.parse() brut sur ces canaux.
import { z } from 'zod'

const availabilitySchema = z.enum(['open', 'busy', 'closed'])

const identitySchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  location: z.string(),
  bio: z.string().max(280),
  photo: z.string().nullable(),
  availability: availabilitySchema,
})

const positionSchema = z.object({
  id: z.string(),
  role: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string(),
  highlights: z.array(z.string()),
})

const holdingSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string(),
  weight: z.number().min(0).max(100),
  years: z.number().min(0),
})

const certificateSchema = z.object({
  id: z.string(),
  title: z.string(),
  institution: z.string(),
  year: z.string(),
  credentialUrl: z.string().nullable(),
  fileUrl: z.string().nullable(),
})

const tickerPlatformSchema = z.enum([
  'linkedin',
  'github',
  'x',
  'behance',
  'instagram',
  'email',
  'website',
])

const tickerSchema = z.object({
  id: z.string(),
  platform: tickerPlatformSchema,
  handle: z.string(),
  url: z.string(),
})

const fontDuoIdSchema = z.enum([
  'institutionnel',
  'terminal',
  'editorial',
  'suisse',
  'brut',
  'classique',
  'technique',
  'moderne',
  'compact',
  'elegant',
  'journal',
  'machine',
  'geometrique',
  'humaniste',
])

const motionPreferenceSchema = z.enum(['full', 'reduced'])

const themeConfigSchema = z.object({
  background: z.enum(['graphite', 'encre', 'papier', 'onyx']),
  accent: z.string(),
  fontDuo: fontDuoIdSchema,
  motion: motionPreferenceSchema,
})

const domainSchema = z.enum(['finance'])

const galleryThemeIdSchema = z.enum([
  'ledger',
  'bourse',
  'capital',
  'sceau',
  'lingot',
  'devise',
  'titre',
  'reserve',
  'coffre',
  'rente',
  'placement',
  'guilde',
])

const buttonStyleSchema = z.enum(['solid', 'outline', 'elevated'])
const headerLayoutSchema = z.enum(['classic', 'banner', 'seal'])

const customThemeSettingsSchema = z.object({
  background: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  pageTextColor: z.string(),
  headingColor: z.string(),
  pageFontDuo: fontDuoIdSchema,
  headingFontFamily: z.string().nullable(),
  buttonStyle: buttonStyleSchema,
  headerLayout: headerLayoutSchema,
})

// z.discriminatedUnion sur 'kind' — cohérent avec AppearanceConfig
// (src/types/profile.ts), et permet à zod de ne valider que la branche
// (gallery/custom) réellement présente dans le payload.
const appearanceConfigSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('gallery'),
    themeId: galleryThemeIdSchema,
    animatedBackground: z.boolean(),
    motion: motionPreferenceSchema,
  }),
  z.object({
    kind: z.literal('custom'),
    settings: customThemeSettingsSchema,
    motion: motionPreferenceSchema,
  }),
])

export const profileSchema = z.object({
  domain: domainSchema,
  identity: identitySchema,
  positions: z.array(positionSchema),
  holdings: z.array(holdingSchema),
  certificates: z.array(certificateSchema),
  tickers: z.array(tickerSchema),
  theme: themeConfigSchema,
  appearance: appearanceConfigSchema,
})
