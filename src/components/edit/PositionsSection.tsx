import { useFormContext, useFieldArray, useWatch, type Control, type FieldArrayWithId } from 'react-hook-form'
import { Reorder, useDragControls } from 'motion/react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import type { Profile, Position } from '@/types'

type PositionField = FieldArrayWithId<Profile, 'positions', 'id'>
import TextField from './fields/TextField'
import TextAreaField from './fields/TextAreaField'

function newPosition(): Position {
  return {
    id: crypto.randomUUID(),
    role: '',
    company: '',
    startDate: '',
    endDate: null,
    description: '',
    highlights: [],
  }
}

// highlights est un tableau de chaînes brutes : useFieldArray exige des
// tableaux d'objets, on gère donc l'ajout/suppression à la main via setValue.
function HighlightsList({ control, index }: { control: Control<Profile>; index: number }) {
  const { register, setValue, getValues } = useFormContext<Profile>()
  const highlights = useWatch({ control, name: `positions.${index}.highlights` }) ?? []

  function removeAt(hIndex: number) {
    const current = getValues(`positions.${index}.highlights`) ?? []
    setValue(
      `positions.${index}.highlights`,
      current.filter((_, i) => i !== hIndex),
      { shouldDirty: true },
    )
  }

  function addOne() {
    const current = getValues(`positions.${index}.highlights`) ?? []
    setValue(`positions.${index}.highlights`, [...current, ''], { shouldDirty: true })
  }

  return (
    <div className="mb-4">
      <span className="text-label uppercase tracking-label text-muted block mb-1.5">Résultats chiffrés</span>
      {highlights.map((_, hIndex) => (
        <div key={hIndex} className="flex gap-2 mb-2">
          <input
            {...register(`positions.${index}.highlights.${hIndex}`)}
            placeholder="18 émetteurs suivis sur la BRVM"
            maxLength={140}
            className="flex-1 min-h-11 rounded-md border border-ink-raised bg-surface-inset px-3 text-sm text-paper focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 focus:border-accent"
          />
          <button
            type="button"
            onClick={() => removeAt(hIndex)}
            aria-label="Retirer ce résultat"
            className="size-11 shrink-0 flex items-center justify-center rounded-md border border-ink-raised focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      {highlights.length < 3 && (
        <button
          type="button"
          onClick={addOne}
          className="min-h-11 text-sm text-accent flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
        >
          <Plus size={14} aria-hidden="true" /> Ajouter un résultat
        </button>
      )}
    </div>
  )
}

type CardProps = {
  position: PositionField
  index: number
  control: Control<Profile>
  onRemove: () => void
}

function PositionCard({ position, index, control, onRemove }: CardProps) {
  const { register, setValue } = useFormContext<Profile>()
  const dragControls = useDragControls()
  const endDate = useWatch({ control, name: `positions.${index}.endDate` })

  return (
    <Reorder.Item
      value={position}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-lg border border-ink-raised bg-ink-raised/40 p-4 mb-3"
    >
      <div className="flex items-start gap-2 mb-3">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label="Réordonner cette position"
          className="size-11 shrink-0 flex items-center justify-center rounded-md border border-ink-raised cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
        <div className="flex-1">
          <TextField
            label="Rôle"
            registration={register(`positions.${index}.role`)}
            placeholder="Analyste financière senior"
            maxLength={100}
          />
          <TextField
            label="Société"
            registration={register(`positions.${index}.company`)}
            placeholder="CGF Bourse"
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <TextField label="Début (AAAA-MM)" registration={register(`positions.${index}.startDate`)} placeholder="2023-06" />
        <label className="block mb-4">
          <span className="text-label uppercase tracking-label text-muted block mb-1.5">Fin</span>
          <input
            type="text"
            placeholder="En cours"
            disabled={endDate === null}
            value={endDate ?? ''}
            onChange={(e) => setValue(`positions.${index}.endDate`, e.target.value, { shouldDirty: true })}
            className="w-full min-h-11 rounded-md border border-ink-raised bg-surface-inset px-3 text-sm text-paper disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 focus:border-accent"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 mb-4 min-h-11 text-sm">
        <input
          type="checkbox"
          checked={endDate === null}
          onChange={(e) => setValue(`positions.${index}.endDate`, e.target.checked ? null : '', { shouldDirty: true })}
          className="size-4 accent-[var(--accent)]"
        />
        Poste en cours
      </label>

      <TextAreaField
        label="Description"
        registration={register(`positions.${index}.description`)}
        value=""
        rows={2}
        maxLength={500}
        placeholder="Couverture actions et obligataire sur la BRVM pour une clientèle institutionnelle."
      />

      <HighlightsList control={control} index={index} />

      <button
        type="button"
        onClick={onRemove}
        className="min-h-11 text-sm text-down flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2 rounded"
      >
        <Trash2 size={14} aria-hidden="true" /> Supprimer cette position
      </button>
    </Reorder.Item>
  )
}

export default function PositionsSection() {
  const { control, getValues, setValue } = useFormContext<Profile>()
  const { fields, append, remove } = useFieldArray({ control, name: 'positions' })

  // `fields` (React Hook Form) porte son propre id de suivi, distinct de
  // notre Position.id — on ne peut donc pas faire correspondre newOrder à
  // currentValues par id. On corrèle par position d'origine (égalité de
  // référence, newOrder n'étant qu'une permutation de `fields`), puis on va
  // chercher les valeurs live via getValues — jamais les valeurs par défaut
  // figées dans `fields`, qui ignorent tout ce que l'utilisateur a tapé.
  function handleReorder(newOrder: PositionField[]) {
    const currentValues = getValues('positions')
    const reordered = newOrder.map((item) => {
      const originalIndex = fields.indexOf(item)
      return currentValues[originalIndex]
    })
    setValue('positions', reordered, { shouldDirty: true })
  }

  return (
    <>
      {fields.length === 0 && (
        <p className="text-sm text-muted mb-4">
          Ajoutez votre poste actuel pour commencer — société, dates, quelques résultats chiffrés.
        </p>
      )}

      <Reorder.Group axis="y" values={fields} onReorder={handleReorder} as="div">
        {fields.map((field, index) => (
          <PositionCard key={field.id} position={field} index={index} control={control} onRemove={() => remove(index)} />
        ))}
      </Reorder.Group>

      <button
        type="button"
        onClick={() => append(newPosition())}
        className="min-h-11 px-3 rounded-md border border-ink-raised text-sm text-accent flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <Plus size={14} aria-hidden="true" /> Ajouter une position
      </button>
    </>
  )
}
