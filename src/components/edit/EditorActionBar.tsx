import { useRef, useState } from 'react'
import { Eye, Link2, Download, Upload } from 'lucide-react'
import type { Profile } from '@/types'
import { downloadProfileJson, parseProfileJson } from '@/lib/exportImport'
import { useCoachmarkTarget } from '@/lib/coachmark/CoachmarkContext'

type Props = {
  profile: Profile
  onPreview: () => void
  onGenerateLink: () => void
  onImport: (profile: Profile) => void
}

export default function EditorActionBar({ profile, onPreview, onGenerateLink, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  // Cible "preview-mobile" du tuto (voir steps.ts) — voir DesktopPreviewPanel.tsx
  // pour la cible alternative "preview-desktop", jamais visible en même temps.
  const previewTargetRef = useCoachmarkTarget('preview-mobile')

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const result = parseProfileJson(text)
    if (result.ok) {
      setImportError(null)
      onImport(result.profile)
    } else {
      setImportError(result.error)
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-ink-raised bg-ink/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      {importError && <p className="text-center text-xs text-down py-1.5 px-4">{importError}</p>}
      <div className="grid grid-cols-4 lg:grid-cols-3 gap-1 p-2 lg:mx-auto lg:max-w-[1400px] lg:px-8">
        {/* Redondant en desktop : l'aperçu est déjà visible en direct dans le panneau de droite. */}
        <button
          ref={previewTargetRef}
          type="button"
          onClick={onPreview}
          className="lg:hidden min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Eye size={16} aria-hidden="true" />
          Aperçu
        </button>
        {/* Action principale du parcours (Phase 5) : c'est le lien partageable
            qui est le but final, pas l'aperçu ni l'export — seul bouton mis
            en avant à l'accent. */}
        <button
          type="button"
          onClick={onGenerateLink}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md bg-accent-subtle text-accent text-xs font-medium focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Link2 size={16} aria-hidden="true" />
          Lien
        </button>
        <button
          type="button"
          onClick={() => downloadProfileJson(profile)}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Download size={16} aria-hidden="true" />
          Exporter
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-md text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Upload size={16} aria-hidden="true" />
          Importer
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
    </div>
  )
}
