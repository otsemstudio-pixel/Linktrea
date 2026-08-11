import { useEffect } from 'react'
import type { Profile } from '@/types'
import { resolveAccent } from './theme/accent'

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Génère titre, description, OpenGraph et Twitter Card à partir du profil.
// Limite assumée : ce site est 100% frontend (Phase 1), donc ces balises ne
// sont écrites qu'après exécution du JS — un crawler qui n'exécute pas JS
// (certains bots de partage) verra les valeurs statiques d'index.html, pas
// celles-ci. Corriger ça demanderait du pré-rendu ou un serveur, hors
// périmètre. Ça reste utile pour l'onglet du navigateur et les crawlers
// modernes qui exécutent du JS.
//
// og:image pointe TOUJOURS vers l'image statique de repli
// (public/og-default.png, voir scripts/render-og-image.mjs), jamais vers
// identity.photo : ce champ est un data: URI (voir photo.ts), et og:image
// doit être une URL http(s) réelle — la quasi-totalité des robots de partage
// (Facebook, LinkedIn, Slack, WhatsApp) ignorent silencieusement un data:
// URI. Une carte de partage générée par profil (voir shareCard.ts) n'existe
// que dans le navigateur de son auteur, pas à une URL que ces robots
// peuvent atteindre — nécessiterait un rendu serveur, hors périmètre.
export function useDocumentMeta(profile: Profile, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const name = profile.identity.fullName || 'Linktrea'
    const headline = profile.identity.headline
    const title = headline ? `${name} · ${headline}` : name
    const description = profile.identity.bio || `Portefeuille professionnel de ${name}, présenté façon relevé financier.`
    // BASE_URL est relatif ("./", voir vite.config.ts — nécessaire pour que
    // le même build serve aussi bien à la racine d'un domaine que dans un
    // sous-dossier GitHub Pages) : le concaténer directement après l'origine
    // produit une URL invalide ("https://host./og-default.png"). new URL()
    // le résout correctement quel que soit le chemin du document courant.
    const ogImage = new URL(`${import.meta.env.BASE_URL}og-default.png`, document.baseURI).href

    document.title = title
    setMetaTag('name', 'description', description)
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:type', 'profile')
    setMetaTag('property', 'og:url', window.location.href)
    setMetaTag('property', 'og:image', ogImage)
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', ogImage)
  }, [profile.identity.fullName, profile.identity.headline, profile.identity.bio, enabled])
}

function faviconDataUri(ink: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${ink}'/><circle cx='16' cy='16' r='8' fill='${accent}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Favicon et theme-color accordés au fond + à l'accent actifs (Phase 6).
// `backgroundHex` est désormais une couleur libre (refonte v2, Phase 2),
// résolue en amont par useAppliedTheme via resolveAppearanceBackground.
export function useFaviconAndThemeColor(backgroundHex: string, accent: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const ink = backgroundHex
    const { hex: resolvedAccent } = resolveAccent(accent, backgroundHex)

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.setAttribute('type', 'image/svg+xml')
    link.setAttribute('href', faviconDataUri(ink, resolvedAccent))

    setMetaTag('name', 'theme-color', ink)
  }, [backgroundHex, accent, enabled])
}
