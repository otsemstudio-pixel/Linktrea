import type { UseFormRegisterReturn } from 'react-hook-form'

type Props = {
  label: string
  registration: UseFormRegisterReturn
  value?: string
  maxLength?: number
  rows?: number
  error?: string
}

export default function TextAreaField({ label, registration, value, maxLength, rows = 3, error }: Props) {
  return (
    <label className="block mb-4">
      <span className="flex justify-between items-baseline mb-1.5">
        <span className="text-label uppercase tracking-label text-muted">{label}</span>
        {maxLength && (
          <span className="text-xs text-muted font-mono">
            {(value ?? '').length}/{maxLength}
          </span>
        )}
      </span>
      <textarea
        {...registration}
        rows={rows}
        maxLength={maxLength}
        className="w-full rounded-md border border-ink-raised bg-ink px-3 py-2 text-sm text-paper resize-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      />
      {error && <span className="block mt-1 text-xs text-down">{error}</span>}
    </label>
  )
}
