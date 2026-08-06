import { createEmptyProfile } from '@/lib/emptyProfile'
import PublicEmptyProfileGhost from './PublicEmptyProfileGhost'

// Aucun profil du tout (ni payload ni data.json) — même traitement que le
// profil publié mais vide (voir PublicEmptyProfileGhost) : un visiteur qui
// découvre le produit sans contenu à montrer ne doit jamais voir un écran
// vide, il doit voir ce que le produit produit. Pas de thème réel à
// reprendre ici (aucun profil n'existe), donc le thème par défaut.
export default function EmptyState() {
  return <PublicEmptyProfileGhost theme={createEmptyProfile().theme} />
}
