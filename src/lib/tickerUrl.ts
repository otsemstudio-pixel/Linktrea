import type { TickerPlatform } from '@/types'

const URL_TEMPLATES: Record<TickerPlatform, (handle: string) => string> = {
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  github: (h) => `https://github.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  behance: (h) => `https://behance.net/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  email: (h) => `mailto:${h}`,
  website: (h) => (h.startsWith('http') ? h : `https://${h}`),
}

export function buildTickerUrl(platform: TickerPlatform, handle: string): string {
  if (!handle) return ''
  return URL_TEMPLATES[platform](handle.trim())
}
