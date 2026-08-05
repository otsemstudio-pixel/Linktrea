import type { UseFormRegisterReturn } from 'react-hook-form'

type Props = {
  label: string
  registration: UseFormRegisterReturn
  value: number
  min?: number
  max?: number
}

export default function SliderField({ label, registration, value, min = 0, max = 100 }: Props) {
  return (
    <label className="block mb-4">
      <span className="flex justify-between items-baseline mb-1.5">
        <span className="text-label uppercase tracking-label text-muted">{label}</span>
        <span className="text-xs font-mono text-accent">{value}%</span>
      </span>
      <input
        {...registration}
        type="range"
        min={min}
        max={max}
        className="w-full h-11 accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      />
    </label>
  )
}
