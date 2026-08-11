import { useEffect, useState } from 'react'
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import { Trash2, Plus } from 'lucide-react'
import type { Profile, Ticker, TickerPlatform } from '@/types'
import { buildTickerUrl } from '@/lib/tickerUrl'
import { detectPlatformFromUrl } from '@/lib/detectPlatform'
import { resolveAppearancePlatformIconStyle } from '@/lib/theme/resolveAppearance'
import PlatformIcon from '@/components/PlatformIcon'
import TextField from './fields/TextField'
import SelectField from './fields/SelectField'

const PLATFORM_OPTIONS: { value: TickerPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'x', label: 'X' },
  { value: 'behance', label: 'Behance' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Site web' },
]

const PLATFORM_LABELS = Object.fromEntries(PLATFORM_OPTIONS.map((o) => [o.value, o.label])) as Record<
  TickerPlatform,
  string
>

// 'website' plutôt que 'linkedin' : le nouveau flux (collage d'URL, prompt
// "Icônes de plateformes...", Partie 2) n'a plus besoin d'une plateforme
// pré-choisie, la détection s'en charge dès que quelque chose est collé.
function newTicker(): Ticker {
  return { id: crypto.randomUUID(), platform: 'website', handle: '', url: '' }
}

function TickerRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { register, control, setValue, getValues, formState } = useFormContext<Profile>()
  const url = useWatch({ control, name: `tickers.${index}.url` }) ?? ''
  const platform = useWatch({ control, name: `tickers.${index}.platform` })
  const handle = useWatch({ control, name: `tickers.${index}.handle` })
  const appearance = useWatch({ control, name: 'appearance' })
  const iconStyle = resolveAppearancePlatformIconStyle(appearance)

  // Repli manuel (prompt : "Ce n'est pas la bonne plateforme ?", discret,
  // pas mis en avant) — ouvert par défaut seulement pour un réseau déjà en
  // email, jamais détectable depuis une URL (voir detectPlatform.ts) ; fermé
  // sinon, y compris pour un réseau ajouté avec l'ancien flux (sélection
  // manuelle + pseudo tapé) — son url déjà enregistrée se redétecte
  // correctement telle quelle, aucune migration de données nécessaire.
  const [manualMode, setManualMode] = useState(() => getValues(`tickers.${index}.platform`) === 'email')
  const liveDetection = manualMode ? null : detectPlatformFromUrl(url)

  // Sens URL → plateforme/pseudo (mode collage, par défaut) — seulement si
  // la détection réussit ; une saisie encore incomplète ne doit jamais
  // écraser les valeurs déjà enregistrées.
  useEffect(() => {
    if (manualMode) return
    const result = detectPlatformFromUrl(url)
    if (result.ok) {
      setValue(`tickers.${index}.platform`, result.platform, { shouldDirty: true })
      setValue(`tickers.${index}.handle`, result.handle, { shouldDirty: true })
    }
  }, [url, manualMode, index, setValue])

  // Sens plateforme/pseudo → URL (mode manuel uniquement) — inverse de
  // ci-dessus ; jamais actifs tous les deux en même temps (voir manualMode),
  // pour ne jamais tourner en boucle l'un contre l'autre. shouldValidate:true
  // ici (contrairement à l'effet ci-dessus, qui ne touche pas `url`) — sans
  // ça, une erreur "Lien invalide" affichée pendant l'état transitoire entre
  // le choix de la plateforme et la saisie du pseudo (url vide un instant)
  // restait affichée même une fois l'url reconstruite valide, la revalidation
  // de ce champ ne se déclenchant sinon que sur une interaction DIRECTE avec
  // lui (bug repéré à l'usage : ce champ n'est ici jamais édité directement,
  // seulement dérivé par ce useEffect).
  useEffect(() => {
    if (!manualMode) return
    setValue(`tickers.${index}.url`, buildTickerUrl(platform, handle), { shouldDirty: true, shouldValidate: true })
  }, [platform, handle, manualMode, index, setValue])

  return (
    <div className="rounded-lg border border-ink-raised bg-ink-raised/40 p-4 mb-3">
      <div className="flex items-center gap-3 mb-1">
        {/* Confirmation visuelle immédiate de la plateforme détectée (prompt)
            — même icône/style que sur le profil public. */}
        <div className="size-9 shrink-0 flex items-center justify-center rounded-md bg-ink-raised">
          <PlatformIcon platform={platform} style={iconStyle} size={18} />
        </div>
        <div className="flex-1">
          {manualMode ? (
            <SelectField label="Plateforme" registration={register(`tickers.${index}.platform`)} options={PLATFORM_OPTIONS} />
          ) : (
            <TextField
              label="Lien du profil"
              registration={register(`tickers.${index}.url`)}
              placeholder="https://linkedin.com/in/ton-identifiant"
            />
          )}
        </div>
      </div>

      {manualMode ? (
        <TextField
          label="Identifiant"
          registration={register(`tickers.${index}.handle`)}
          placeholder="mon-identifiant"
          maxLength={100}
        />
      ) : (
        <>
          {liveDetection?.ok && (
            <p className="text-xs text-muted mb-3">
              Détecté : <span className="text-paper">{PLATFORM_LABELS[platform]}</span> ·{' '}
              <input
                value={handle}
                onChange={(e) => setValue(`tickers.${index}.handle`, e.target.value, { shouldDirty: true })}
                aria-label="Pseudo affiché"
                className="inline-block w-36 bg-transparent border-b border-ink-raised text-paper font-mono focus-visible:outline-none focus:border-accent"
              />
            </p>
          )}
          {url && !liveDetection?.ok && (
            <p className="text-xs text-down mb-3">
              Colle une URL complète en https:// (ex. https://linkedin.com/in/ton-identifiant).
            </p>
          )}
        </>
      )}

      {formState.errors.tickers?.[index]?.url?.message && (
        <p className="text-xs text-down mb-4">{formState.errors.tickers[index]?.url?.message}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setManualMode((v) => !v)}
          className="min-h-11 text-xs text-muted underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 rounded"
        >
          {manualMode ? 'Revenir au collage de lien' : "Ce n'est pas la bonne plateforme ?"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="min-h-11 text-sm text-down flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-down focus-visible:-outline-offset-2 rounded"
        >
          <Trash2 size={14} aria-hidden="true" /> Supprimer
        </button>
      </div>
    </div>
  )
}

export default function TickersSection() {
  const { control } = useFormContext<Profile>()
  const { fields, append, remove } = useFieldArray({ control, name: 'tickers' })

  return (
    <>
      {fields.length === 0 && (
        <p className="text-sm text-muted mb-4">
          Ajoutez un premier réseau — collez le lien de votre profil LinkedIn, GitHub, X…
        </p>
      )}

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
