import { useEffect, useState } from 'react'

// Vrai tant que l'onglet est visible (refonte v2, Phase 6) — permet de
// couper les animations de fond continues quand l'utilisateur change
// d'onglet, contrainte non négociable du prompt pour ne pas consommer de
// batterie inutilement sur les connexions mobiles ciblées.
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    function onChange() {
      setVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}
