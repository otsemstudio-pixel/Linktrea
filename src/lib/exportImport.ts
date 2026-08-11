import type { Profile } from '@/types'

export function downloadProfileJson(profile: Profile) {
  const json = JSON.stringify(profile, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'linktrea-data.json'
  a.click()
  URL.revokeObjectURL(url)
}
