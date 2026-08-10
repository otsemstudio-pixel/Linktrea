import { useEffect } from 'react'
import type { AppearanceConfig } from '@/types'
import { resolveAccent, accentCssTokens } from './accent'
import { resolveAppearanceCardStyle, styleTokens } from './cardStyle'
import { deriveSurfaceTokens } from './deriveSurfaces'
import { resolveAppearanceBackground, resolveAppearanceFontDuo, type ResolvedBackground } from './resolveAppearance'
import { resolveAppearanceShape, shapeTokens } from './shape'
import { hexToOklch, oklchToCss } from './color'
import { FONT_DUOS } from './fontDuos'
import { loadFontDuo, preloadFontDuo } from './loadFontDuo'

// Applique le fond (surfaces dérivées en direct depuis AppearanceConfig,
// refonte v2 Phase 2 — plus de blocs CSS statiques par id fixe, la couleur
// est désormais libre), l'accent dérivé, le duo typographique et le style de
// boutons/cartes sur <html> — seule racine partagée par toute la page,
// nécessaire pour que le thème s'applique même en dehors de l'arbre React
// monté. Mutualisé entre ProfileView (page publique, seulement quand
// standalone) et EditPage (chrome de l'éditeur, toujours actif) pour ne pas
// dupliquer cette logique.
export function useAppliedTheme(appearance: AppearanceConfig, accent: string, enabled = true): ResolvedBackground {
  const resolved = resolveAppearanceBackground(appearance)
  const resolvedFont = resolveAppearanceFontDuo(appearance)
  const resolvedAccent = resolveAccent(accent, resolved.hex)
  const resolvedCardStyle = resolveAppearanceCardStyle(appearance, resolvedAccent.hex)
  const resolvedShape = resolveAppearanceShape(appearance)

  useEffect(() => {
    if (!enabled) return
    const tokens = deriveSurfaceTokens(resolved.hex)
    const root = document.documentElement.style
    root.setProperty('--surface-0', oklchToCss(tokens.surface0))
    root.setProperty('--surface-1', oklchToCss(tokens.surface1))
    root.setProperty('--surface-2', oklchToCss(tokens.surface2))
    root.setProperty('--surface-inset', oklchToCss(tokens.surfaceInset))
    root.setProperty('--fg', oklchToCss(tokens.fg))
    root.setProperty('--fg-muted', oklchToCss(tokens.fgMuted))
    root.setProperty('--up', oklchToCss(tokens.up))
    root.setProperty('--down', oklchToCss(tokens.down))
    // color-scheme pilote le rendu des contrôles natifs (scrollbar, <input
    // type="color">...) — auparavant fixé par une règle CSS statique
    // [data-background='papier'], impossible à présent que le fond n'est
    // plus l'un de 4 id connus à l'avance.
    document.documentElement.style.colorScheme = tokens.isLight ? 'light' : 'dark'
  }, [resolved.hex, enabled])

  useEffect(() => {
    if (!enabled) return
    // Recalculée depuis le hex plutôt que de fermer sur resolvedAccent.color
    // (un nouvel objet à chaque rendu, qui ferait tourner cet effet en
    // continu s'il figurait dans le tableau de dépendances) — resolvedAccent
    // est déjà LE hex final corrigé, hexToOklch() ne fait que reformater la
    // même valeur pour accentCssTokens().
    const tokens = accentCssTokens(hexToOklch(resolvedAccent.hex), resolved.isLight)
    const root = document.documentElement.style
    root.setProperty('--accent', tokens.accent)
    root.setProperty('--accent-hover', tokens.accentHover)
    root.setProperty('--accent-border', tokens.accentBorder)
    root.setProperty('--accent-subtle', tokens.accentSubtle)
  }, [resolvedAccent.hex, resolved.isLight, enabled])

  useEffect(() => {
    if (!enabled) return
    const { buttonStyle, buttonColor, buttonTextColor } = resolvedCardStyle
    const surfaceTokens = deriveSurfaceTokens(resolved.hex)
    const elevatedSurfaceCss = oklchToCss(surfaceTokens.surface2)
    const ambientFgCss = oklchToCss(surfaceTokens.fg)
    const ambientFgMutedCss = oklchToCss(surfaceTokens.fgMuted)
    // --card-* habille les blocs denses (positions, certificats, réseaux) :
    // le texte ambiant du thème ne bouge QUE si le fond de la carte devient
    // opaque (Plein) — sinon il resterait lisible mais perdrait sa hiérarchie
    // (titre/muted) pour rien. --button-* habille les boutons au sens strict
    // (une seule ligne, ex. "Contacter") : là, "texte à la même couleur" du
    // prompt s'applique aussi à Contouré/Élevé.
    const card = styleTokens(buttonStyle, buttonColor, buttonTextColor, elevatedSurfaceCss, ambientFgCss, ambientFgMutedCss)
    const button = styleTokens(buttonStyle, buttonColor, buttonTextColor, elevatedSurfaceCss, buttonColor, buttonColor)
    const root = document.documentElement.style
    root.setProperty('--card-bg', card.background)
    root.setProperty('--card-fg', card.foreground)
    root.setProperty('--card-fg-muted', card.foregroundMuted)
    root.setProperty('--card-border-color', card.borderColor)
    root.setProperty('--card-border-width', card.borderWidth)
    root.setProperty('--card-shadow', card.boxShadow)
    root.setProperty('--button-bg', button.background)
    root.setProperty('--button-fg', button.foreground)
    root.setProperty('--button-border-color', button.borderColor)
    root.setProperty('--button-border-width', button.borderWidth)
    root.setProperty('--button-shadow', button.boxShadow)
  }, [resolvedCardStyle.buttonStyle, resolvedCardStyle.buttonColor, resolvedCardStyle.buttonTextColor, resolved.hex, enabled])

  useEffect(() => {
    if (!enabled) return
    const { pageFontDuo, headingFontFamily } = resolvedFont
    const def = FONT_DUOS[pageFontDuo]
    const root = document.documentElement.style
    // Le repli est posé immédiatement, avant même que la police ne soit
    // chargée : c'est ce qui permet à font-display: swap (déjà actif dans
    // le CSS généré par @fontsource) de peindre avec le repli puis de
    // basculer sans attendre le réseau.
    root.setProperty('--font-sans', `'${def.titleFamily}', ${def.titleFallback}`)
    root.setProperty('--font-mono', `'${def.monoFamily}', ${def.monoFallback}`)
    // Police des titres : "identique à la police de page" (headingFontFamily
    // null, par défaut — voir Niveau 2 du prompt v2) suit --font-sans en
    // permanence via var(), pas une copie figée de sa valeur au moment du
    // calcul — sinon un changement ultérieur de duo laisserait les titres
    // à l'ancienne police. Un nom saisi en mode Personnalisé est une chaîne
    // libre, jamais l'un des 14 duos : pas de chargement possible pour elle,
    // seul un repli générique s'applique si la police n'est pas déjà
    // installée chez le visiteur.
    root.setProperty('--font-heading', headingFontFamily ? `'${headingFontFamily}', ${def.titleFallback}` : 'var(--font-sans)')
    preloadFontDuo(pageFontDuo)
    void loadFontDuo(pageFontDuo)
  }, [resolvedFont.pageFontDuo, resolvedFont.headingFontFamily, enabled])

  useEffect(() => {
    if (!enabled) return
    const tokens = shapeTokens(resolvedShape)
    const root = document.documentElement.style
    root.setProperty('--radius-base', tokens.base)
    root.setProperty('--radius-sm', tokens.sm)
    root.setProperty('--radius-md', tokens.md)
    root.setProperty('--radius-lg', tokens.lg)
  }, [resolvedShape, enabled])

  return resolved
}
