// Registre des thèmes de la Galerie (refonte v2, Phases 2-5) — fond, duo
// typographique, style de boutons/cartes et layout d'en-tête de chacun des
// 12 thèmes minimum. Fond choisi parmi les 4 traitements du prompt (aplat,
// dégradé à deux teintes, texture guillochis, fond animé réservé à 4 thèmes
// que la Phase 6 pourra animer). Palette financière sobre : pas de fluo, pas
// de pastel, pas de texture léopard/tartan. Duo choisi parmi les 14 de
// fontDuos.ts, pour l'intention du thème plutôt que pour coller à sa couleur.
// Style de boutons choisi parmi les 3 de cardStyle.ts — la COULEUR reste
// l'accent partagé, seule la FORME varie par thème (voir Niveau 1 du prompt :
// les thèmes ne proposent pas de réglage de couleur de bouton indépendant,
// contrairement au mode Personnalisé). Layout d'en-tête choisi parmi les 3 de
// IdentityHeader.tsx, même logique.
import type { GalleryThemeId, FontDuoId, ButtonStyle, HeaderLayout, ShapeLanguage, SignatureStyle, PhotoTreatment } from '@/types'

export type BackgroundTreatment =
  | { kind: 'flat'; base: string }
  | { kind: 'gradient'; from: string; to: string }
  | { kind: 'texture'; base: string }

// Les 4 motifs de fond animé du prompt v2 (Phase 6) — voir
// AppliedBackgroundLayer.tsx (breath/guilloche/noise) et AmbientSparkline.tsx
// (sparkline, rendu dans l'en-tête plutôt que le fond de page, voir le
// prompt : "en arrière-plan de l'en-tête").
export type AnimatedBackgroundKind = 'breath' | 'guilloche' | 'sparkline' | 'noise'

export type GalleryThemeMeta = {
  id: GalleryThemeId
  name: string
  background: BackgroundTreatment
  // Un thème complet fixe son duo — voir Niveau 1 du prompt v2 ("l'utilisateur
  // choisit un nom, pas des réglages") : aucun sélecteur de police ne
  // s'affiche pour un thème de la Galerie, contrairement au mode Personnalisé.
  fontDuo: FontDuoId
  // Même logique pour la forme des boutons/cartes — voir cardStyle.ts.
  buttonStyle: ButtonStyle
  // Même logique pour le layout de la zone photo + identité.
  headerLayout: HeaderLayout
  // Même logique pour le langage de forme (personnalisation avancée,
  // Phase 1) — choisi pour l'intention du thème, pas pour coller à une
  // répartition égale entre les trois valeurs (voir ShapeLanguage).
  shape: ShapeLanguage
  // Même logique pour la variante de signature (personnalisation avancée,
  // Phase 4) — 'stamp' réservé aux thèmes du registre "document officiel"
  // (voir le prompt : "Sceau", "Réserve", proche du certificat), jamais
  // systématique.
  signatureStyle: SignatureStyle
  // Traitement de photo SUGGÉRÉ (correctif "filtres photo étendus") — pas
  // fixé comme les réglages ci-dessus : identity.photoTreatment reste
  // éditable à tout moment, Galerie ou Personnalisé (voir le commentaire sur
  // PhotoTreatment dans src/types/profile.ts). N'est appliqué qu'au choix
  // d'un thème quand identity.photoTreatment vaut encore 'none' (voir
  // selectGalleryTheme() dans AppearanceSection.tsx) — une suggestion pour
  // qui n'a encore rien choisi, jamais un remplacement d'un choix déjà fait.
  photoTreatment: PhotoTreatment
  // null = pas de fond animé pour ce thème — la variété inclut aussi le
  // calme, réservé à 3-4 thèmes seulement (prompt v2, Phase 6). Un thème qui
  // en a un l'affiche par défaut ; l'interrupteur "Fond animé" de l'éditeur
  // permet de le figer sans changer de thème (voir AppearanceSection.tsx).
  animationKind: AnimatedBackgroundKind | null
}

export const GALLERY_THEMES: Record<GalleryThemeId, GalleryThemeMeta> = {
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    background: { kind: 'flat', base: '#0D0E0C' },
    // Duo, style et layout par défaut du profil vide (voir emptyProfile.ts) —
    // Ledger doit rester visuellement identique à l'ancien theme.* par défaut.
    fontDuo: 'suisse',
    buttonStyle: 'solid',
    headerLayout: 'classic',
    shape: 'soft',
    signatureStyle: 'plain',
    photoTreatment: 'none',
    animationKind: null,
  },
  bourse: {
    id: 'bourse',
    name: 'Bourse',
    background: { kind: 'gradient', from: '#3A2A10', to: '#0D0E0C' },
    fontDuo: 'technique',
    buttonStyle: 'elevated',
    headerLayout: 'banner',
    shape: 'pill',
    signatureStyle: 'plain',
    photoTreatment: 'muted',
    animationKind: null,
  },
  capital: {
    id: 'capital',
    name: 'Capital',
    background: { kind: 'flat', base: '#0A0F1A' },
    fontDuo: 'institutionnel',
    buttonStyle: 'solid',
    headerLayout: 'classic',
    shape: 'sharp',
    signatureStyle: 'plain',
    photoTreatment: 'high-contrast',
    animationKind: null,
  },
  sceau: {
    id: 'sceau',
    name: 'Sceau',
    background: { kind: 'texture', base: '#0A0F1A' },
    fontDuo: 'classique',
    buttonStyle: 'outline',
    // Le nom du thème et celui du layout coïncident — pas une coïncidence :
    // c'est le pairing le plus évident du registre "document officiel".
    headerLayout: 'seal',
    shape: 'sharp',
    signatureStyle: 'stamp',
    photoTreatment: 'sepia',
    animationKind: null,
  },
  lingot: {
    id: 'lingot',
    name: 'Lingot',
    background: { kind: 'gradient', from: '#332508', to: '#0D0E0C' },
    fontDuo: 'elegant',
    buttonStyle: 'elevated',
    headerLayout: 'banner',
    // Lingot : bloc rectangulaire net, pas arrondi — cohérent avec l'objet
    // lui-même plutôt qu'avec le duo "elegant".
    shape: 'sharp',
    signatureStyle: 'plain',
    photoTreatment: 'sepia',
    animationKind: null,
  },
  devise: {
    id: 'devise',
    name: 'Devise',
    background: { kind: 'texture', base: '#0D0E0C' },
    fontDuo: 'geometrique',
    buttonStyle: 'outline',
    headerLayout: 'classic',
    shape: 'soft',
    signatureStyle: 'plain',
    photoTreatment: 'muted',
    animationKind: null,
  },
  titre: {
    id: 'titre',
    name: 'Titre',
    background: { kind: 'flat', base: '#EDE8DE' },
    fontDuo: 'journal',
    buttonStyle: 'outline',
    // "Titre" comme titre de propriété/certificat — le cadre en sceau
    // renforce ce sens plutôt que le sens boursier du mot.
    headerLayout: 'seal',
    shape: 'soft',
    signatureStyle: 'stamp',
    photoTreatment: 'sepia',
    animationKind: null,
  },
  reserve: {
    id: 'reserve',
    name: 'Réserve',
    background: { kind: 'flat', base: '#000000' },
    fontDuo: 'brut',
    buttonStyle: 'solid',
    headerLayout: 'classic',
    shape: 'sharp',
    signatureStyle: 'stamp',
    photoTreatment: 'high-contrast',
    animationKind: null,
  },
  // Les 4 thèmes suivants sont les candidats "3-4 thèmes" du prompt pour un
  // fond animé en Phase 6 — guillochis vivant (Coffre), respiration (Rente),
  // sparkline ambiante (Placement), grain de bruit (Guilde).
  coffre: {
    id: 'coffre',
    name: 'Coffre',
    background: { kind: 'texture', base: '#000000' },
    fontDuo: 'machine',
    buttonStyle: 'solid',
    headerLayout: 'seal',
    shape: 'sharp',
    signatureStyle: 'stamp',
    photoTreatment: 'high-contrast',
    animationKind: 'guilloche',
  },
  rente: {
    id: 'rente',
    name: 'Rente',
    background: { kind: 'gradient', from: '#10241A', to: '#000000' },
    fontDuo: 'humaniste',
    buttonStyle: 'elevated',
    headerLayout: 'banner',
    shape: 'pill',
    signatureStyle: 'plain',
    photoTreatment: 'muted',
    animationKind: 'breath',
  },
  placement: {
    id: 'placement',
    name: 'Placement',
    background: { kind: 'flat', base: '#0D0E0C' },
    fontDuo: 'compact',
    buttonStyle: 'solid',
    headerLayout: 'classic',
    shape: 'pill',
    signatureStyle: 'plain',
    photoTreatment: 'none',
    animationKind: 'sparkline',
  },
  guilde: {
    id: 'guilde',
    name: 'Guilde',
    background: { kind: 'texture', base: '#0A0F1A' },
    fontDuo: 'terminal',
    buttonStyle: 'outline',
    headerLayout: 'banner',
    shape: 'pill',
    signatureStyle: 'plain',
    photoTreatment: 'muted',
    animationKind: 'noise',
  },
}

export const GALLERY_THEME_IDS = Object.keys(GALLERY_THEMES) as GalleryThemeId[]
