// Famille visuelle par domaine (prompt domaine Diplomatie « Protocole »,
// Phase 2) — un domaine ne choisit pas directement ses motifs structurels
// (filigrane, sceau, ruban) : il appartient à une famille visuelle, et
// c'est CETTE famille qui détermine le générateur SVG utilisé. Un seul
// point de vérité (resolveVisualFamily) : chaque composant qui dessine un
// motif structurel (GuillochePattern, CertificateSeal, PositionsHistory) et
// le rendu canvas de la carte de partage (shareCard.ts) le lisent tous,
// plutôt que de dériver chacun sa propre condition `domain === '...'`.
import type { Domain } from '@/types'

export type VisualFamily = 'marche' | 'protocole'

// 'marche' regroupe tout ce qui existe déjà (Finance, Entrepreneuriat) —
// aucun changement à son rendu dans cette passe (règle transversale du
// prompt : ne pas toucher à la famille marché). 'protocole' est la nouvelle
// famille du domaine Diplomatie (prompt dédié, Phase 3 — voir
// src/lib/svg/rosette.ts pour ses générateurs).
export const DOMAIN_VISUAL_FAMILY: Record<Domain, VisualFamily> = {
  finance: 'marche',
  entrepreneuriat: 'marche',
  diplomatie: 'protocole',
}

export function resolveVisualFamily(domain: Domain): VisualFamily {
  return DOMAIN_VISUAL_FAMILY[domain]
}
