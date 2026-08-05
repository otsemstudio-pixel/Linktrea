import { useEffect } from 'react'
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import { Trash2, Plus } from 'lucide-react'
import type { Profile, Ticker, TickerPlatform } from '@/types'
import { buildTickerUrl } from '@/lib/tickerUrl'
import TextField from './fields/TextField'
import SelectField from './fields/SelectField'

const PLATFORM_OPTIONS: { value: TickerPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'x', label: 'X' },
  { value: 'behance', label: 'Behance' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Site web' },
]

function newTicker(): Ticker {
  return { id: crypto.randomUUID(), platform: 'linkedin', handle: '', url: '' }
}

function TickerRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue } = useFormContext<Profile>()
  const platform = useWatch({ control, name: `tickers.${index}.platform` })
  const handle = useWatch({ control, name: `tickers.${index}.handle` })

  useEffect(() => {
    setValue(`tickers.${index}.url`, buildTickerUrl(platform, handle), { shouldDirty: true })
  }, [platform, handle, index, setValue])

  return (
    <div className="rounded-lg border border-ink-raised bg-ink-raised/40 p-4 mb-3">
      <SelectField label="Plateforme" registration={register(`tickers.${index}.platform`)} options={PLATFORM_OPTIONS} />
      <TextField label="Identifiant" registration={register(`tickers.${index}.handle`)} placeholder="mon-identifiant" />
      <p className="text-xs text-muted font-mono mb-4 break-all">{buildTickerUrl(platform, handle) || '—'}</p>
      <button
        type="button"
        onClick={onRemove}
        className="min-h-11 text-sm text-down flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2 rounded"
      >
        <Trash2 size={14} aria-hidden="true" /> Supprimer
      </button>
    </div>
  )
}

export default function TickersSection() {
  const { control } = useFormContext<Profile>()
  const { fields, append, remove } = useFieldArray({ control, name: 'tickers' })

  return (
    <>
      {fields.length === 0 && <p className="text-sm text-muted mb-4">Aucun réseau pour le moment.</p>}

      {fields.map((field, index) => (
        <TickerRow key={field.id} index={index} onRemove={() => remove(index)} />
      ))}

      <button
        type="button"
        onClick={() => append(newTicker())}
        className="min-h-11 px-3 rounded-md border border-ink-raised text-sm text-accent flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <Plus size={14} aria-hidden="true" /> Ajouter un réseau
      </button>
    </>
  )
}
