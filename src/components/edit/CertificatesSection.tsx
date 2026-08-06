import { useFormContext, useFieldArray } from 'react-hook-form'
import { Trash2, Plus } from 'lucide-react'
import type { Profile, Certificate } from '@/types'
import TextField from './fields/TextField'

function newCertificate(): Certificate {
  return { id: crypto.randomUUID(), title: '', institution: '', year: '', credentialUrl: null, fileUrl: null }
}

export default function CertificatesSection() {
  const { register, control } = useFormContext<Profile>()
  const { fields, append, remove } = useFieldArray({ control, name: 'certificates' })

  return (
    <>
      {fields.length === 0 && (
        <p className="text-sm text-muted mb-4">
          Ajoutez un diplôme ou une certification, avec un lien de vérification si possible.
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-ink-raised bg-ink-raised/40 p-4 mb-3">
          <TextField label="Titre" registration={register(`certificates.${index}.title`)} placeholder="Licence Finance" />
          <TextField label="Institution" registration={register(`certificates.${index}.institution`)} placeholder="ESATIC" />
          <TextField label="Année" registration={register(`certificates.${index}.year`)} placeholder="2023" />
          <TextField
            label="URL de vérification"
            registration={register(`certificates.${index}.credentialUrl`)}
            placeholder="https://..."
          />
          <TextField label="URL du document" registration={register(`certificates.${index}.fileUrl`)} placeholder="https://..." />
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
        onClick={() => append(newCertificate())}
        className="min-h-11 px-3 rounded-md border border-ink-raised text-sm text-accent flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
      >
        <Plus size={14} aria-hidden="true" /> Ajouter un certificat
      </button>
    </>
  )
}
