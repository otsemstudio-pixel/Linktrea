import type { UseFormRegisterReturn } from 'react-hook-form'

type Props = {
  label: string
  registration: UseFormRegisterReturn
  options: { value: string; label: string }[]
}

export default function SelectField({ label, registration, options }: Props) {
  return (
    <label className="block mb-4">
      <span className="text-label uppercase tracking-label text-muted block mb-1.5">{label}</span>
      <select
        {...registration}
        className="w-full min-h-11 rounded-md border border-ink-raised bg-ink px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
