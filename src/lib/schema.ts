// Schéma de validation runtime du Profile. Sert de garde-fou pour tout
// payload venant d'une source non fiable (hash d'URL, fichier JSON importé) :
// on ne fait jamais confiance à un JSON.parse() brut sur ces canaux.
import { z } from 'zod'

// Assainissement du contenu public (refonte sécurité, Phase 6) — vérifie le
// protocole RÉEL tel que le navigateur le comprendrait (new URL().protocol),
// jamais un préfixe de chaîne : un test du type value.startsWith('http')
// laisserait passer "http://evil" en le confondant avec une validation de
// protocole, alors que ce n'est qu'un hasard de préfixe. '' veut dire
// "aucun lien fourni" (valeur par défaut d'un champ vide côté formulaire,
// équivalent à null pour l'affichage — voir CertificatesRail.tsx), toujours
// valide.
function hasProtocol(value: string, protocol: string): boolean {
  if (value === '') return true
  try {
    return new URL(value).protocol === protocol
  } catch {
    return false
  }
}

// Réservé aux liens destinés à devenir un href cliquable sur la page
// publique (certificats) — jamais data:, javascript:, ni même http:// nu.
const httpsUrlSchema = z
  .string()
  .nullable()
  .refine((v) => v === null || hasProtocol(v, 'https:'), { message: 'Le lien doit commencer par https://' })

const availabilitySchema = z.enum(['open', 'busy', 'closed'])

// Bornes de longueur (refonte sécurité, Phase 6) — aucune n'existait
// vraiment avant (seule bio en avait une), malgré ce que suggérait le
// prompt ; choisies ici pour rester confortables en saisie normale tout en
// empêchant un champ texte libre de servir à stocker un pavé arbitraire.
const identitySchema = z.object({
  fullName: z.string().max(100),
  headline: z.string().max(120),
  location: z.string().max(100),
  bio: z.string().max(280),
  photo: z.string().nullable(),
  availability: availabilitySchema,
})

const positionSchema = z.object({
  id: z.string(),
  role: z.string().max(100),
  company: z.string().max(100),
  startDate: z.string().max(20),
  endDate: z.string().max(20).nullable(),
  description: z.string().max(500),
  // .max(3) redondant avec la limite déjà imposée côté UI
  // (PositionsSection.tsx n'affiche plus le bouton "Ajouter" au-delà de 3) —
  // mais cette limite UI n'empêchait rien côté données : rien ne validait
  // qu'un payload importé ou modifié hors formulaire n'en contienne pas plus.
  highlights: z.array(z.string().max(140)).max(3),
})

const holdingSchema = z.object({
  id: z.string(),
  label: z.string().max(100),
  category: z.string().max(60),
  weight: z.number().min(0).max(100),
  years: z.number().min(0),
})

const certificateSchema = z.object({
  id: z.string(),
  title: z.string().max(120),
  institution: z.string().max(120),
  year: z.string().max(20),
  credentialUrl: httpsUrlSchema,
  fileUrl: httpsUrlSchema,
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

// url n'est jamais tapée directement par la personne (voir buildTickerUrl,
// déclenché automatiquement par un useEffect sur platform+handle dans
// TickersSection.tsx) — le refine reste nécessaire malgré tout : rien
// n'empêche un payload importé ou modifié hors formulaire de contenir une
// valeur qui n'est jamais passée par ce générateur. Protocole attendu
// dépendant de la plateforme : mailto: pour email, https: pour tout le reste
// (buildTickerUrl ne produit jamais un simple http:// non chiffré).
const tickerSchema = z
  .object({
    id: z.string(),
    platform: tickerPlatformSchema,
    handle: z.string().max(100),
    url: z.string(),
  })
  .refine((t) => hasProtocol(t.url, t.platform === 'email' ? 'mailto:' : 'https:'), {
    message: 'Lien invalide.',
    path: ['url'],
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
