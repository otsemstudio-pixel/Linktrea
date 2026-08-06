// Chargement effectif des polices d'un duo (refonte design Phase 2) —
// séparé de fontDuos.ts pour que le sélecteur (qui n'a besoin que des
// métadonnées) n'entraîne jamais les 14 paires dans le bundle. Chaque entrée
// est un import() statique explicite (pas de chemin interpolé) : Vite ne
// peut découper le bundle par paire que si le spécificateur est analysable
// à la compilation — une seule paire est donc réellement récupérée, au
// moment de la sélection, jamais les 14.
import type { FontDuoId } from '@/types'

// Une seule url de préchargement par rôle (titre + mono) et par duo — le
// poids principal, pas toutes les graisses : voir preloadFontDuo() plus bas.
import sourceSerif4Woff from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2?url'
import martianMonoWoff from '@fontsource/martian-mono/files/martian-mono-latin-700-normal.woff2?url'
import newsreaderWoff from '@fontsource/newsreader/files/newsreader-latin-700-normal.woff2?url'
import interTightWoff from '@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff2?url'
import archivoWoff from '@fontsource/archivo/files/archivo-latin-700-normal.woff2?url'
import loraWoff from '@fontsource/lora/files/lora-latin-700-normal.woff2?url'
import ibmPlexSansWoff from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2?url'
import geistWoff from '@fontsource/geist/files/geist-latin-700-normal.woff2?url'
import barlowCondensedWoff from '@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2?url'
import playfairDisplayWoff from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url'
import bitterWoff from '@fontsource/bitter/files/bitter-latin-700-normal.woff2?url'
import bigShouldersWoff from '@fontsource/big-shoulders/files/big-shoulders-latin-700-normal.woff2?url'
import poppinsWoff from '@fontsource/poppins/files/poppins-latin-700-normal.woff2?url'
import workSansWoff from '@fontsource/work-sans/files/work-sans-latin-700-normal.woff2?url'

import ibmPlexMonoWoff from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url'
import jetbrainsMonoWoff from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url'
import courierPrimeWoff from '@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2?url'
import dmMonoWoff from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2?url'
import spaceMonoWoff from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff2?url'

const LOADERS: Record<FontDuoId, () => Promise<unknown>> = {
  institutionnel: () =>
    Promise.all([
      import('@fontsource/source-serif-4/latin-400.css'),
      import('@fontsource/source-serif-4/latin-600.css'),
      import('@fontsource/source-serif-4/latin-700.css'),
      import('@fontsource/ibm-plex-mono/latin-400.css'),
      import('@fontsource/ibm-plex-mono/latin-500.css'),
    ]),
  terminal: () =>
    Promise.all([
      import('@fontsource/martian-mono/latin-400.css'),
      import('@fontsource/martian-mono/latin-600.css'),
      import('@fontsource/martian-mono/latin-700.css'),
      import('@fontsource/jetbrains-mono/latin-400.css'),
      import('@fontsource/jetbrains-mono/latin-500.css'),
    ]),
  editorial: () =>
    Promise.all([
      import('@fontsource/newsreader/latin-400.css'),
      import('@fontsource/newsreader/latin-600.css'),
      import('@fontsource/newsreader/latin-700.css'),
      import('@fontsource/ibm-plex-mono/latin-400.css'),
      import('@fontsource/ibm-plex-mono/latin-500.css'),
    ]),
  suisse: () =>
    Promise.all([
      import('@fontsource/inter-tight/latin-400.css'),
      import('@fontsource/inter-tight/latin-600.css'),
      import('@fontsource/inter-tight/latin-700.css'),
      import('@fontsource/jetbrains-mono/latin-400.css'),
      import('@fontsource/jetbrains-mono/latin-500.css'),
    ]),
  brut: () =>
    Promise.all([
      import('@fontsource/archivo/latin-400.css'),
      import('@fontsource/archivo/latin-700.css'),
      import('@fontsource/archivo/latin-900.css'),
      import('@fontsource/courier-prime/latin-400.css'),
      import('@fontsource/courier-prime/latin-700.css'),
    ]),
  classique: () =>
    Promise.all([
      import('@fontsource/lora/latin-400.css'),
      import('@fontsource/lora/latin-600.css'),
      import('@fontsource/lora/latin-700.css'),
      import('@fontsource/dm-mono/latin-400.css'),
      import('@fontsource/dm-mono/latin-500.css'),
    ]),
  technique: () =>
    Promise.all([
      import('@fontsource/ibm-plex-sans/latin-400.css'),
      import('@fontsource/ibm-plex-sans/latin-600.css'),
      import('@fontsource/ibm-plex-sans/latin-700.css'),
      import('@fontsource/ibm-plex-mono/latin-400.css'),
      import('@fontsource/ibm-plex-mono/latin-500.css'),
    ]),
  moderne: () =>
    Promise.all([
      import('@fontsource/geist/latin-400.css'),
      import('@fontsource/geist/latin-600.css'),
      import('@fontsource/geist/latin-700.css'),
      import('@fontsource/jetbrains-mono/latin-400.css'),
      import('@fontsource/jetbrains-mono/latin-500.css'),
    ]),
  compact: () =>
    Promise.all([
      import('@fontsource/barlow-condensed/latin-400.css'),
      import('@fontsource/barlow-condensed/latin-600.css'),
      import('@fontsource/barlow-condensed/latin-700.css'),
      import('@fontsource/dm-mono/latin-400.css'),
      import('@fontsource/dm-mono/latin-500.css'),
    ]),
  elegant: () =>
    Promise.all([
      import('@fontsource/playfair-display/latin-400.css'),
      import('@fontsource/playfair-display/latin-700.css'),
      import('@fontsource/playfair-display/latin-900.css'),
      import('@fontsource/dm-mono/latin-400.css'),
      import('@fontsource/dm-mono/latin-500.css'),
    ]),
  journal: () =>
    Promise.all([
      import('@fontsource/bitter/latin-400.css'),
      import('@fontsource/bitter/latin-600.css'),
      import('@fontsource/bitter/latin-700.css'),
      import('@fontsource/courier-prime/latin-400.css'),
      import('@fontsource/courier-prime/latin-700.css'),
    ]),
  machine: () =>
    Promise.all([
      import('@fontsource/big-shoulders/latin-400.css'),
      import('@fontsource/big-shoulders/latin-700.css'),
      import('@fontsource/big-shoulders/latin-900.css'),
      import('@fontsource/courier-prime/latin-400.css'),
      import('@fontsource/courier-prime/latin-700.css'),
    ]),
  geometrique: () =>
    Promise.all([
      import('@fontsource/poppins/latin-400.css'),
      import('@fontsource/poppins/latin-600.css'),
      import('@fontsource/poppins/latin-700.css'),
      import('@fontsource/space-mono/latin-400.css'),
      import('@fontsource/space-mono/latin-700.css'),
    ]),
  humaniste: () =>
    Promise.all([
      import('@fontsource/work-sans/latin-400.css'),
      import('@fontsource/work-sans/latin-600.css'),
      import('@fontsource/work-sans/latin-700.css'),
      import('@fontsource/dm-mono/latin-400.css'),
      import('@fontsource/dm-mono/latin-500.css'),
    ]),
}

// Poids principal (titre + mono) de chaque duo, pour <link rel="preload">
// côté profil publié — voir preloadFontDuo().
export const FONT_DUO_PRELOAD_URLS: Record<FontDuoId, [title: string, mono: string]> = {
  institutionnel: [sourceSerif4Woff, ibmPlexMonoWoff],
  terminal: [martianMonoWoff, jetbrainsMonoWoff],
  editorial: [newsreaderWoff, ibmPlexMonoWoff],
  suisse: [interTightWoff, jetbrainsMonoWoff],
  brut: [archivoWoff, courierPrimeWoff],
  classique: [loraWoff, dmMonoWoff],
  technique: [ibmPlexSansWoff, ibmPlexMonoWoff],
  moderne: [geistWoff, jetbrainsMonoWoff],
  compact: [barlowCondensedWoff, dmMonoWoff],
  elegant: [playfairDisplayWoff, dmMonoWoff],
  journal: [bitterWoff, courierPrimeWoff],
  machine: [bigShouldersWoff, courierPrimeWoff],
  geometrique: [poppinsWoff, spaceMonoWoff],
  humaniste: [workSansWoff, dmMonoWoff],
}

const loaded = new Set<FontDuoId>()

export function loadFontDuo(id: FontDuoId): Promise<void> {
  if (loaded.has(id)) return Promise.resolve()
  return LOADERS[id]().then(() => {
    loaded.add(id)
  })
}

const preloaded = new Set<FontDuoId>()

// Équivalent au <link rel="preload"> qu'un rendu serveur écrirait dans le
// HTML servi — impossible ici (site 100% frontend, voir le même
// compromis documenté dans useDocumentMeta.ts pour OpenGraph) : on
// l'injecte dès que le duo du profil est connu, avant que la mise en page
// ne déclenche elle-même le chargement de la police.
export function preloadFontDuo(id: FontDuoId) {
  if (preloaded.has(id)) return
  preloaded.add(id)
  for (const href of FONT_DUO_PRELOAD_URLS[id]) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.appendChild(link)
  }
}
