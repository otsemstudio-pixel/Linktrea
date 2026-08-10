// Modèle de données du profil "Ledger". Reflète exactement la structure
// sérialisée dans l'URL (voir src/lib/codec.ts) : tout changement de forme
// ici doit rester rétrocompatible avec les payloads déjà partagés.

export type Availability = 'open' | 'busy' | 'closed'

// Traitement d'affichage de la photo (personnalisation avancée, Phase 2 ;
// étendu par le correctif "filtres photo étendus") — jamais destructif : ne
// modifie que le rendu (filtre CSS/SVG), jamais le fichier stocké dans
// `photo` (voir resizePhotoToWebP), pour pouvoir changer d'avis sans
// réuploader. Pas de split Galerie/Personnalisé comme ShapeLanguage : reste
// éditable à tout moment quel que soit le mode (voir GalleryThemeMeta.
// photoTreatment pour la seule chose que la Galerie en fait — une
// SUGGESTION par défaut, jamais un verrou).
export type PhotoTreatment = 'none' | 'grayscale' | 'duotone' | 'sepia' | 'high-contrast' | 'muted'

export type Identity = {
  fullName: string
  headline: string
  location: string
  bio: string
  photo: string | null
  photoTreatment: PhotoTreatment
  // Vignette (correctif "filtres photo étendus") — calque indépendant, pas
  // une 7e valeur de PhotoTreatment : elle se COMBINE avec n'importe quel
  // traitement (un assombrissement radial des bords superposé en overlay),
  // alors que les six valeurs ci-dessus sont mutuellement exclusives (un
  // seul `filter` CSS/SVG à la fois). La modéliser comme un booléen séparé
  // évite de doubler l'énumération (sepia+vignette, muted+vignette...) pour
  // un axe qui n'a rien d'exclusif.
  photoVignette: boolean
  availability: Availability
  // Signature personnelle (personnalisation avancée, Phase 4) — chaîne vide
  // = pas de signature, aucune zone affichée sur le profil public (jamais un
  // placeholder). Voir SignatureQuote.tsx pour le rendu.
  signature: string
}

export type Position = {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string | null
  description: string
  highlights: string[]
}

export type Holding = {
  id: string
  label: string
  category: string
  weight: number
  years: number
}

export type Certificate = {
  id: string
  title: string
  institution: string
  year: string
  credentialUrl: string | null
  fileUrl: string | null
}

export type TickerPlatform =
  | 'linkedin'
  | 'github'
  | 'x'
  | 'behance'
  | 'instagram'
  | 'email'
  | 'website'

export type Ticker = {
  id: string
  platform: TickerPlatform
  handle: string
  url: string
}

export type BackgroundId = 'graphite' | 'encre' | 'papier' | 'onyx'
export type FontDuoId =
  | 'institutionnel'
  | 'terminal'
  | 'editorial'
  | 'suisse'
  | 'brut'
  | 'classique'
  | 'technique'
  | 'moderne'
  | 'compact'
  | 'elegant'
  | 'journal'
  | 'machine'
  | 'geometrique'
  | 'humaniste'
export type MotionPreference = 'full' | 'reduced'

export type ThemeConfig = {
  background: BackgroundId
  accent: string
  fontDuo: FontDuoId
  motion: MotionPreference
}

// Domaine professionnel présenté par le profil (refonte v2, Phase 1) — un
// seul domaine actif aujourd'hui, la structure existe pour accueillir
// 'droit' | 'diplomatie' | 'informatique' | 'design' plus tard sans
// migration de données (voir src/lib/vocabulary.ts).
export type Domain = 'finance'

// Système de thème à deux niveaux (refonte v2, Phase 1) : soit un thème
// nommé complet de la Galerie, soit un thème Personnalisé à réglages
// indépendants. `motion` reste commun aux deux, c'est une préférence
// d'accessibilité, pas un trait visuel du thème.
//
// Coexiste pour l'instant avec ThemeConfig (theme.*, ci-dessus), qui reste
// SEUL à piloter le rendu réel — voir Profile.appearance plus bas. Ce champ
// est le livrable structurel de la Phase 1 : modèle de données et
// navigation Galerie/Personnalisé, sans encore reprendre le moteur de rendu
// (Phases 2 à 6 du prompt v2, qui définiront le fond, la typographie, le
// style de boutons, le layout d'en-tête et les fonds animés propres à
// chaque thème nommé).
export type ButtonStyle = 'solid' | 'outline' | 'elevated'
export type HeaderLayout = 'classic' | 'banner' | 'seal'
// Variante d'affichage de la signature (personnalisation avancée, Phase 4) —
// 'stamp' : pivotée, encadrée d'un filet fin à l'accent, façon cachet ;
// réservée aux thèmes du registre "document officiel" (voir
// GalleryThemeMeta.signatureStyle), libre en Personnalisé.
export type SignatureStyle = 'plain' | 'stamp'

// Les 12 thèmes minimum du prompt v2 — un mot abstrait du champ lexical
// financier, jamais descriptif de sa couleur.
export type GalleryThemeId =
  | 'ledger'
  | 'bourse'
  | 'capital'
  | 'sceau'
  | 'lingot'
  | 'devise'
  | 'titre'
  | 'reserve'
  | 'coffre'
  | 'rente'
  | 'placement'
  | 'guilde'

// Langage de forme (personnalisation avancée, Phase 1) — un seul réglage
// pilote le rayon de tous les coins de l'application publique (cartes,
// boutons, pastilles de statut...), à l'exception du médaillon photo, qui
// reste circulaire quel que soit le langage choisi. Même logique à deux
// niveaux que ButtonStyle/HeaderLayout : fixé par thème dans la Galerie,
// libre en Personnalisé (voir GalleryThemeMeta.shape et resolveAppearanceShape).
export type ShapeLanguage = 'sharp' | 'soft' | 'pill'

export type CustomThemeSettings = {
  background: string // hex libre — pas limité aux 4 fonds fixes de ThemeConfig (voir Phase 2)
  buttonColor: string
  buttonTextColor: string
  pageTextColor: string
  headingColor: string
  pageFontDuo: FontDuoId
  // null = "identique à la police de page" (bascule activée par défaut,
  // voir le prompt v2) : reprend alors la police de titre du duo choisi
  // pour pageFontDuo plutôt qu'une police indépendante.
  headingFontFamily: string | null
  buttonStyle: ButtonStyle
  headerLayout: HeaderLayout
  shape: ShapeLanguage
  signatureStyle: SignatureStyle
}

export type AppearanceConfig =
  | { kind: 'gallery'; themeId: GalleryThemeId; animatedBackground: boolean; motion: MotionPreference }
  | { kind: 'custom'; settings: CustomThemeSettings; motion: MotionPreference }

export type Profile = {
  domain: Domain
  identity: Identity
  positions: Position[]
  holdings: Holding[]
  certificates: Certificate[]
  tickers: Ticker[]
  theme: ThemeConfig
  appearance: AppearanceConfig
}
