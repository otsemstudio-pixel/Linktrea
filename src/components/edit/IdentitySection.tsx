import { useRef, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Upload, X } from 'lucide-react'
import type { Profile } from '@/types'
import { resizePhotoToWebP } from '@/lib/photo'
import TextField from './fields/TextField'
import TextAreaField from './fields/TextAreaField'
import SelectField from './fields/SelectField'

const AVAILABILITY_OPTIONS = [
  { value: 'open', label: 'Ouvert aux missions' },
  { value: 'busy', label: 'Disponibilité limitée' },
  { value: 'closed', label: 'Non disponible actuellement' },
]

export default function IdentitySection() {
  const { register, control, setValue, formState } = useFormContext<Profile>()
  const bio = useWatch({ control, name: 'identity.bio' }) ?? ''
  const photo = useWatch({ control, name: 'identity.photo' })
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await resizePhotoToWebP(file)
    if (result.ok) {
      setPhotoError(null)
      setValue('identity.photo', result.dataUrl, { shouldDirty: true })
    } else {
      setPhotoError(result.error)
    }
  }

  return (
    <>
      <div className="mb-5">
        <span className="text-label uppercase tracking-label text-muted block mb-2">Photo</span>
        <div className="flex items-center gap-3">
          {photo ? (
            <img src={photo} alt="" className="size-16 rounded-full object-cover border border-ink-raised" />
          ) : (
            <div className="size-16 rounded-full bg-ink-raised" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 px-3 rounded-md border border-ink-raised text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
          >
            <Upload size={14} aria-hidden="true" />
            Choisir une photo
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setValue('identity.photo', null, { shouldDirty: true })}
              aria-label="Retirer la photo"
              className="size-11 flex items-center justify-center rounded-md border border-ink-raised focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        {photoError && <p className="mt-2 text-xs text-down">{photoError}</p>}
      </div>

      <TextField label="Nom complet" registration={register('identity.fullName')} error={formState.errors.identity?.fullName?.message} />
      <TextField label="Headline" registration={register('identity.headline')} placeholder="Analyste financière · Abidjan" />
      <TextField label="Localisation" registration={register('identity.location')} />
      <TextAreaField label="Bio" registration={register('identity.bio')} value={bio} maxLength={280} rows={4} />
      <SelectField label="Disponibilité" registration={register('identity.availability')} options={AVAILABILITY_OPTIONS} />
    </>
  )
}
