// Micro-variation purement décorative pour le bandeau tickers (élément
// signature demandé dans le plan de design). Dérivée de façon déterministe
// de l'id du ticker pour ne jamais changer entre deux rendus.
export function pseudoVariation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  const normalized = (Math.abs(hash) % 400) / 100 - 2 // entre -2.00 et +2.00
  return Math.round(normalized * 100) / 100
}
