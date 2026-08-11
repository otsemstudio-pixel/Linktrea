// Contenu du tuto en coachmarks (Phase 2) — construit à partir du domaine
// actif plutôt que des libellés écrits en dur : si un futur domaine (Droit,
// Diplomatie...) renomme ces sections sur le profil public, ce fichier suit
// sans modification (voir VOCABULARY dans src/lib/vocabulary.ts).
import type { Domain } from '@/types'
import { VOCABULARY } from '@/lib/vocabulary'
import type { CoachmarkStep } from './CoachmarkContext'

export function buildCoachmarkSteps(domain: Domain): CoachmarkStep[] {
  const vocab = VOCABULARY[domain]

  return [
    {
      id: 'welcome',
      text: 'Bienvenue ! Ce que tu remplis ici devient ton profil public, visible par lien.',
    },
    {
      id: 'photo',
      // La photo vit dans la section "Identité" — c'est ELLE qu'il faut
      // ouvrir si elle est repliée, pas la photo (qui n'a pas d'activateur
      // propre, voir IdentitySection.tsx).
      targetId: 'photo',
      activateId: 'identity',
      text: 'Ta photo et ton nom : la toute première chose que verra un visiteur sur ton profil.',
    },
    {
      id: 'availability',
      targetId: 'availability',
      activateId: 'identity',
      text: 'Ton statut de disponibilité s’affiche directement sur ton profil public, bien visible.',
    },
    {
      id: 'positions',
      targetId: 'positions',
      text: `Chaque poste ajouté ici apparaît dans « ${vocab.history} » de ton profil, du plus récent au plus ancien.`,
    },
    {
      id: 'holdings',
      targetId: 'holdings',
      text: `Ce que tu listes ici forme « ${vocab.expertiseBreakdown} », la répartition de ton expertise visible en un coup d’œil.`,
    },
    {
      id: 'certificates',
      targetId: 'certificates',
      text: `Tes diplômes et certifications apparaissent dans « ${vocab.certifications} », pour appuyer ta crédibilité.`,
    },
    {
      id: 'tickers',
      targetId: 'tickers',
      text: `Ajoute tes liens ici — ils s’affichent dans « ${vocab.networks} », pour qu’on te retrouve ailleurs.`,
    },
    {
      id: 'appearance',
      targetId: 'appearance',
      text: 'Un thème de la Galerie change fond, police et style en un clic — chaque réglage reste aussi ajustable séparément en mode Personnalisé.',
    },
    {
      id: 'preview',
      // Le bouton "Aperçu" n'existe que sur mobile — l'écran large affiche
      // déjà l'aperçu en direct dans son propre panneau (voir
      // DesktopPreviewPanel.tsx) ; resolveTargetId (CoachmarkOverlay.tsx)
      // choisit celui réellement visible au moment de l'étape.
      targetId: ['preview-desktop', 'preview-mobile'],
      text: 'Ceci te montre exactement ce que verront tes visiteurs, mis à jour en temps réel.',
    },
    {
      id: 'publish',
      targetId: 'publish',
      text: 'Choisis l’adresse de ton profil et publie-le ici — tant que ce n’est pas fait, il reste invisible pour tout le monde.',
    },
    {
      id: 'end',
      text: 'C’est tout ! Retrouve ce tuto à tout moment via le bouton d’aide (?) en haut de l’éditeur.',
    },
  ]
}
