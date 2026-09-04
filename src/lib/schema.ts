// Schéma de validation runtime du Profile. Sert de garde-fou pour tout
// payload venant d'une source non fiable (hash d'URL, fichier JSON importé) :
// on ne fait jamais confiance à un JSON.parse() brut sur ces canaux.
import { z } from 'zod'
import { ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET } from './theme/eclatGradients'

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
// .catch('none') — même raison que shapeLanguageSchema plus bas : un profil
// enregistré avant l'ajout de ce réglage (personnalisation avancée, Phase 2)
// n'a jamais eu ce champ. Liste étendue par le correctif "filtres photo
// étendus" — un ancien payload avec 'sepia'/'high-contrast'/'muted' n'existe
// pas encore, mais .catch() protège aussi contre une valeur simplement
// invalide (payload importé à la main, par exemple).
const photoTreatmentSchema = z.enum(['none', 'grayscale', 'duotone', 'sepia', 'high-contrast', 'muted']).catch('none')

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
  photoTreatment: photoTreatmentSchema,
  // .catch(false) — même raison : champ absent des payloads enregistrés
  // avant ce correctif.
  photoVignette: z.boolean().catch(false),
  availability: availabilitySchema,
  // .catch('') — même raison que photoTreatmentSchema : un profil enregistré
  // avant l'ajout de ce champ (personnalisation avancée, Phase 4) ne l'a
  // jamais eu dans son payload.
  signature: z.string().max(120).catch(''),
})

// "AAAA-MM" strict — seul format que les <select> mois/année de
// PositionsSection.tsx peuvent désormais produire (correctif date de fin).
const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const positionSchema = z
  .object({
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
  // N'invalide QUE quand les deux dates sont déjà au format "AAAA-MM" strict
  // (donc forcément saisies via les nouveaux <select>, jamais du texte libre
  // hérité d'avant ce correctif) : une position déjà enregistrée avec une
  // startDate/endDate au format libre (ancien champ texte) ne doit jamais
  // faire échouer la relecture de tout le profil (voir parseProfileData
  // dans SupabaseProfileStore.ts, qui retombe sur un profil vide au moindre
  // safeParse en échec) — seules les nouvelles saisies, forcément propres,
  // sont comparées.
  .refine(
    (p) => {
      if (p.endDate === null) return true
      if (!YEAR_MONTH_RE.test(p.endDate) || !YEAR_MONTH_RE.test(p.startDate)) return true
      return p.endDate >= p.startDate
    },
    { message: 'La date de fin ne peut pas être antérieure à la date de début.', path: ['endDate'] },
  )

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
  'tiktok',
  'youtube',
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
  'chancellerie',
])

const motionPreferenceSchema = z.enum(['full', 'reduced'])

const themeConfigSchema = z.object({
  background: z.enum(['graphite', 'encre', 'papier', 'onyx']),
  accent: z.string(),
  fontDuo: fontDuoIdSchema,
  motion: motionPreferenceSchema,
})

const domainSchema = z.enum(['finance', 'entrepreneuriat', 'diplomatie'])

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
  'eclat',
  'chancellerie',
  'missive',
  'ambassade',
])

// .catch('braise') — même raison que shapeLanguageSchema plus bas : un
// profil enregistré avant l'ajout du thème "Éclat" n'a jamais eu ce champ.
const eclatVariantSchema = z.enum(['braise', 'maree', 'crepuscule', 'eclipse', 'nebuleuse']).catch('braise')

const buttonStyleSchema = z.enum(['solid', 'outline', 'elevated'])
const headerLayoutSchema = z.enum(['classic', 'banner', 'seal'])
// .catch('soft') plutôt que .default('soft') : un profil Personnalisé
// enregistré avant l'ajout de ce réglage (personnalisation avancée, Phase 1)
// n'a jamais eu ce champ dans son payload — sans repli, il échouerait
// entièrement à la relecture (voir le commentaire en tête de ce fichier sur
// la rétrocompatibilité des payloads déjà partagés). .default() change le
// type INPUT du schéma (le champ devient optionnel), ce qui casse la
// compatibilité avec Resolver<Profile> dans EditPage.tsx (react-hook-form
// exige que le type des valeurs du formulaire soit exactement Profile,
// jamais Profile avec un champ optionnel) ; .catch() garde le même type
// des deux côtés et absorbe silencieusement une valeur absente ou invalide.
const shapeLanguageSchema = z.enum(['sharp', 'soft', 'pill']).catch('soft')
// Même raison, même solution (.catch()) — voir shapeLanguageSchema juste
// au-dessus (personnalisation avancée, Phase 4).
const signatureStyleSchema = z.enum(['plain', 'stamp']).catch('plain')
// Même raison, même solution — un profil Personnalisé enregistré avant
// l'ajout du style d'icônes de plateformes (prompt dédié, Partie 1) n'a
// jamais eu ce champ.
const platformIconStyleSchema = z.enum(['white', 'black', 'brand', 'accent']).catch('accent')

// .catch(...) — même raison que shapeLanguageSchema plus haut : un profil
// Personnalisé enregistré avant l'ajout du fond animé (refonte "fond animé
// personnalisé") n'a jamais eu ces trois champs.
const animatedColorsSchema = z
  .tuple([z.string(), z.string(), z.string()])
  .catch([ECLAT_ARC_ORANGE, ECLAT_ARC_RED, ECLAT_ARC_VIOLET])

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
  shape: shapeLanguageSchema,
  signatureStyle: signatureStyleSchema,
  platformIconStyle: platformIconStyleSchema,
  animatedBackground: z.boolean().catch(false),
  animatedColors: animatedColorsSchema,
  animationStyle: eclatVariantSchema,
})

// z.discriminatedUnion sur 'kind' — cohérent avec AppearanceConfig
// (src/types/profile.ts), et permet à zod de ne valider que la branche
// (gallery/custom) réellement présente dans le payload.
const appearanceConfigSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('gallery'),
    themeId: galleryThemeIdSchema,
    animatedBackground: z.boolean(),
    eclatVariant: eclatVariantSchema,
    motion: motionPreferenceSchema,
  }),
  z.object({
    kind: z.literal('custom'),
    settings: customThemeSettingsSchema,
    motion: motionPreferenceSchema,
  }),
])

// .catch() sur le CHAMP ENTIER (pas seulement chaque sous-champ) — doc
// "Publication automatique optionnelle + clarification de l'export",
// Phase 3 : shareCard vient d'être ajouté au modèle, donc AUCUN profil
// existant en base n'a cette clé aujourd'hui (contrairement à
// shapeLanguageSchema etc., ajoutés après coup mais sur des profils déjà
// backfillés) — sans ce repli au niveau objet, un payload qui ne contient
// simplement pas la clé échouerait entièrement la validation de tout le
// profil, pas seulement de ce champ.
const shareCardFormatSchema = z.enum(['square', 'portrait', 'landscape']).catch('square')

const shareCardConfigSchema = z
  .object({
    format: shareCardFormatSchema,
    showKeyMetric: z.boolean().catch(true),
    showTopSkills: z.boolean().catch(false),
    showCertifications: z.boolean().catch(false),
    showSignature: z.boolean().catch(false),
    showQrCode: z.boolean().catch(true),
  })
  .catch({
    format: 'square',
    showKeyMetric: true,
    showTopSkills: false,
    showCertifications: false,
    showSignature: false,
    showQrCode: true,
  })

export const profileSchema = z.object({
  domain: domainSchema,
  identity: identitySchema,
  positions: z.array(positionSchema),
  holdings: z.array(holdingSchema),
  certificates: z.array(certificateSchema),
  tickers: z.array(tickerSchema),
  theme: themeConfigSchema,
  appearance: appearanceConfigSchema,
  shareCard: shareCardConfigSchema,
})
