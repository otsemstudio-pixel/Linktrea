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
  | 'tiktok'
  | 'youtube'
  | 'email'
  | 'website'

// Style des icônes de plateformes (prompt "Icônes de plateformes et collage
// d'URL auto-détecté", Partie 1) — réglage global, pas par icône : voir
// resolveAppearancePlatformIconStyle. 'brand' = couleur de marque officielle
// propre à chaque icône (voir src/lib/platformIcons.ts) ; les trois autres
// appliquent une teinte uniforme à toute la grille.
export type PlatformIconStyle = 'white' | 'black' | 'brand' | 'accent'

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

// Variante de dégradé du thème "Éclat" (prompt "Éclat : dégradé chromatique
// animé") — même arc chromatique orange → rouge → violet pour les cinq,
// seules la forme, l'intensité et la vitesse changent (voir
// ECLAT_VARIANT_META dans galleryThemes.ts). Librement changeable à tout
// moment dans l'éditeur, indépendamment du reste des réglages de thème —
// pas fixé par thème comme ShapeLanguage/SignatureStyle, puisque c'est
// justement le seul réglage que ce thème-là propose de personnaliser.
export type EclatVariant = 'braise' | 'maree' | 'crepuscule' | 'eclipse' | 'nebuleuse'

// Les 12 thèmes minimum du prompt v2 — un mot abstrait du champ lexical
// financier, jamais descriptif de sa couleur. "Éclat" (13e) ajouté par le
// prompt dédié : plus expressif, mais un choix parmi d'autres de la Galerie,
// jamais un remplacement du fond par défaut ni superposable aux autres.
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
  | 'eclat'

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
  // Même logique à deux niveaux que shape/signatureStyle ci-dessus — fixé
  // par thème dans la Galerie (voir GalleryThemeMeta.platformIconStyle),
  // libre en Personnalisé.
  platformIconStyle: PlatformIconStyle
  // Fond animé (refonte "fond animé personnalisé") — superpose un arc
  // chromatique animé par-dessus `background` ci-dessus, MÊME mécanique de
  // rendu que le thème "Éclat" de la Galerie (voir EclatBackgroundLayer.tsx
  // et buildAnimatedGradient dans eclatGradients.ts) mais avec une palette
  // ET un style d'animation libres, pas la palette/variante fixes d'Éclat.
  // "Éclat" lui-même reste exclusif à la Galerie (nom de thème, palette figée
  // orange/rouge/violet) ; ceci est un axe séparé, générique, pas une façon
  // d'obtenir Éclat en Personnalisé.
  animatedBackground: boolean
  animatedColors: [string, string, string]
  // Réutilise EclatVariant comme catalogue de STYLES d'animation (pulsation,
  // glissement, rotation...) — ces cinq variantes ne décrivent que le
  // mouvement et l'intensité (voir ECLAT_VARIANT_META), pas la palette de
  // couleurs elle-même : les réutiliser ici évite de dupliquer cinq
  // animations CSS pour un axe qui n'a rien de spécifique à "Éclat".
  animationStyle: EclatVariant
}

export type AppearanceConfig =
  | {
      kind: 'gallery'
      themeId: GalleryThemeId
      animatedBackground: boolean
      // Variante du thème "Éclat" — présente pour tous les thèmes de la
      // Galerie (comme animatedBackground) mais seulement significative
      // quand themeId === 'eclat' ; inerte sinon. Le thème "Éclat" nommé
      // (palette orange/rouge/violet fixe) reste exclusif à la Galerie —
      // voir CustomThemeSettings.animationStyle ci-dessus pour l'équivalent
      // générique à palette libre du mode Personnalisé.
      eclatVariant: EclatVariant
      motion: MotionPreference
    }
  | { kind: 'custom'; settings: CustomThemeSettings; motion: MotionPreference }

// Format de la carte de partage — sous-ensemble de ShareCardFormat
// (src/lib/shareCard.ts, qui ajoute 'business' pour le rendu canvas) : la
// carte de visite a un contenu fixe, jamais piloté par ce réglage figé par
// le propriétaire (voir ShareCardConfig ci-dessous).
export type ShareCardPickableFormat = 'square' | 'portrait' | 'landscape'

// Configuration de la carte de partage (doc "Publication automatique
// optionnelle + clarification de l'export", Phase 3) — attribut du profil
// au même titre que le reste, plus une préférence locale au navigateur du
// propriétaire : suit exactement les mêmes règles de brouillon/publication.
// La route publique ne doit jamais lire que la version figée par le
// propriétaire (published_snapshot), jamais un brouillon en cours — voir
// ShareCardModal.tsx.
export type ShareCardConfig = {
  format: ShareCardPickableFormat
  showKeyMetric: boolean
  showTopSkills: boolean
  showCertifications: boolean
  showSignature: boolean
  showQrCode: boolean
}

export type Profile = {
  domain: Domain
  identity: Identity
  positions: Position[]
  holdings: Holding[]
  certificates: Certificate[]
  tickers: Ticker[]
  theme: ThemeConfig
  appearance: AppearanceConfig
  shareCard: ShareCardConfig
}
