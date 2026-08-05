import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import { Trash2, Plus } from 'lucide-react'
import type { Profile, Holding } from '@/types'
import TextField from './fields/TextField'
import SliderField from './fields/SliderField'

function newHolding(): Holding {
  return { id: crypto.randomUUID(), label: '', category: '', weight: 10, years: 1 }
}

export default function HoldingsSection() {
  const { register, control } = useFormContext<Profile>()
  const { fields, append, remove } = useFieldArray({ control, name: 'holdings' })
  const holdings = useWatch({ control, name: 'holdings' }) ?? []
  const sum = holdings.reduce((total, h) => total + (Number(h?.weight) || 0), 0)

  return (
    <>
      <div className="flex justify-between items-baseline mb-4 min-h-11">
        <span className="text-sm">Somme des poids</span>
        <span className={`font-mono text-sm ${sum > 100 ? 'text-down' : 'text-paper'}`}>{sum}%</span>
      </div>
      {sum > 100 && (
        <p className="mb-4 text-xs text-down">
          La somme dépasse 100 % — l'allocation affichée en consultation ne sera plus cohérente.
        </p>
      )}

      {fields.length === 0 && <p className="text-sm text-muted mb-4">Aucune compétence pour le moment.</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-ink-raised bg-ink-raised/40 p-4 mb-3">
          <TextField label="Compétence" registration={register(`holdings.${index}.label`)} />
          <TextField label="Catégorie" registration={register(`holdings.${index}.category`)} placeholder="Analyse, Outils, Marchés..." />
          <SliderField label="Poids" registration={register(`holdings.${index}.weight`, { valueAsNumber: true })} value={holdings[index]?.weight ?? 0} />
          <TextField
            label="Années d'expérience"
            registration={register(`holdings.${index}.years`, { valueAsNumber: true })}
            type="number"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="min-h-11 text-sm text-down flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2 rounded"
          >
            <Trash2 size={14} aria-hidden="true" /> Supprimer
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append(newHolding())}
        className="min-h-11 px-3 rounded-md border border-ink-raised text-sm text-accent flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <Plus size={14} aria-hidden="true" /> Ajouter une compétence
      </button>
    </>
  )
}
