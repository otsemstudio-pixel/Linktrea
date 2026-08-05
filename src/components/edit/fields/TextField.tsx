import type { UseFormRegisterReturn } from 'react-hook-form'

type Props = {
  label: string
  registration: UseFormRegisterReturn
  type?: string
  placeholder?: string
  error?: string
}

export default function TextField({ label, registration, type = 'text', placeholder, error }: Props) {
  return (
    <label className="block mb-4">
      <span className="text-label uppercase tracking-label text-muted block mb-1.5">{label}</span>
      <input
        {...registration}
        type={type}
        placeholder={placeholder}
        className="w-full min-h-11 rounded-md border border-ink-raised bg-ink px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      />
      {error && <span className="block mt-1 text-xs text-down">{error}</span>}
    </label>
  )
}
