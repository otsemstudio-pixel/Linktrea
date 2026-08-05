import { useEffect } from 'react'
import type { Profile } from '@/types'
import { PRESET_COLORS } from './presetColors'

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
export function useDocumentMeta(profile: Profile, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const name = profile.identity.fullName || 'Ledger'
    const headline = profile.identity.headline
    const title = headline ? `${name} · ${headline}` : name
    const description = profile.identity.bio || `Portefeuille professionnel de ${name}, présenté façon relevé financier.`

    document.title = title
    setMetaTag('name', 'description', description)
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:type', 'profile')
    setMetaTag('property', 'og:url', window.location.href)
    setMetaTag('name', 'twitter:card', profile.identity.photo ? 'summary_large_image' : 'summary')
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)

    if (profile.identity.photo) {
      setMetaTag('property', 'og:image', profile.identity.photo)
      setMetaTag('name', 'twitter:image', profile.identity.photo)
    }
  }, [profile.identity.fullName, profile.identity.headline, profile.identity.bio, profile.identity.photo, enabled])
}

function faviconDataUri(ink: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${ink}'/><circle cx='16' cy='16' r='8' fill='${accent}'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Favicon et theme-color accordés au preset actif (Phase 6).
export function useFaviconAndThemeColor(preset: keyof typeof PRESET_COLORS, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const { ink, accent } = PRESET_COLORS[preset]

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.setAttribute('type', 'image/svg+xml')
    link.setAttribute('href', faviconDataUri(ink, accent))

    setMetaTag('name', 'theme-color', ink)
  }, [preset, enabled])
}
