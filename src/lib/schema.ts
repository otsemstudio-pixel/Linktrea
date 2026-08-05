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

const themeConfigSchema = z.object({
  preset: z.enum(['terminal', 'ledger', 'vault', 'tape']),
  accent: z.string(),
  motion: z.enum(['full', 'reduced']),
})

export const profileSchema = z.object({
  identity: identitySchema,
  positions: z.array(positionSchema),
  holdings: z.array(holdingSchema),
  certificates: z.array(certificateSchema),
  tickers: z.array(tickerSchema),
  theme: themeConfigSchema,
})
