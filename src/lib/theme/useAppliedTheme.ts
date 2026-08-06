import { useEffect } from 'react'
import type { BackgroundId, FontDuoId } from '@/types'
import { resolveAccent, accentCssTokens } from './accent'
import { FONT_DUOS } from './fontDuos'
import { loadFontDuo, preloadFontDuo } from './loadFontDuo'

// Applique fond (attribut [data-background]), accent dérivé et duo
// typographique sur <html> — seule racine partagée par toute la page,
// nécessaire pour que le thème s'applique même en dehors de l'arbre React
// monté. Mutualisé entre ProfileView (page publique, seulement quand
// standalone) et EditPage (chrome de l'éditeur, toujours actif) pour ne pas
// dupliquer cette logique.
export function useAppliedTheme(background: BackgroundId, accent: string, fontDuo: FontDuoId, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    document.documentElement.dataset.background = background
  }, [background, enabled])

  useEffect(() => {
    if (!enabled) return
    const resolved = resolveAccent(accent, background)
    const tokens = accentCssTokens(resolved.color, background)
    const root = document.documentElement.style
    root.setProperty('--accent', tokens.accent)
    root.setProperty('--accent-hover', tokens.accentHover)
    root.setProperty('--accent-border', tokens.accentBorder)
    root.setProperty('--accent-subtle', tokens.accentSubtle)
  }, [accent, background, enabled])

  useEffect(() => {
    if (!enabled) return
    const def = FONT_DUOS[fontDuo]
    const root = document.documentElement.style
    // Le repli est posé immédiatement, avant même que la police ne soit
    // chargée : c'est ce qui permet à font-display: swap (déjà actif dans
    // le CSS généré par @fontsource) de peindre avec le repli puis de
    // basculer sans attendre le réseau.
    root.setProperty('--font-sans', `'${def.titleFamily}', ${def.titleFallback}`)
    root.setProperty('--font-mono', `'${def.monoFamily}', ${def.monoFallback}`)
    preloadFontDuo(fontDuo)
    void loadFontDuo(fontDuo)
  }, [fontDuo, enabled])
}
