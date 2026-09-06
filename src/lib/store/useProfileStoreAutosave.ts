import { useEffect, useRef, useState } from 'react'
import type { Profile } from '@/types'
import { profileSchema, describeProfileValidationError } from '@/lib/schema'
import { getProfileStore, ProfileStoreError } from './index'

export type SaveStatus = 'idle' | 'saved' | 'error'

// Remplace l'ancien useDraftAutosave (clé localStorage ledger:draft,
// déconnectée du store) : ce que l'éditeur enregistre doit passer par
// ProfileStore, sinon publish() (Phase 4) n'a aucune garantie de voir le
// contenu réellement tapé — exactement le bug que ça a d'abord provoqué.
export function useProfileStoreAutosave(value: Profile, delay = 500) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  // Section du profil portant le champ fautif (voir describeProfileValidationError)
  // — null pour une erreur serveur, où on ne recalcule pas cette info.
  // Permet à EditPage.tsx de rouvrir automatiquement la bonne section même
  // repliée (voir useCoachmarkActivator/activate dans CoachmarkContext.tsx).
  const [errorSection, setErrorSection] = useState<keyof Profile | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      // Le formulaire affiche déjà les erreurs de champ (zodResolver), mais
      // ça ne bloque pas ce hook, qui observe la valeur brute via useWatch —
      // et une erreur de champ dans une section repliée (CollapsibleSection)
      // n'est de toute façon plus rendue à l'écran. Sans ce garde-fou, une
      // valeur invalide (lien javascript:, texte trop long...) serait quand
      // même écrite ; elle ne pourrait certes plus jamais être RELUE
      // (parseProfileData la rejette et retombe sur un profil vide), mais ce
      // serait alors tout le profil qui disparaîtrait silencieusement au
      // prochain chargement — pas seulement le champ en cause (refonte
      // sécurité, Phase 6).
      //
      // Correctif (signalement "je modifie mais rien ne se passe") : un
      // simple `return` ici n'affichait RIEN — ni erreur, ni changement de
      // statut — dès qu'UN SEUL champ du profil entier échouait à cette
      // validation, même un champ que la personne ne touchait pas. Un
      // message explicite désignant le champ fautif remplace ce silence.
      const parsed = profileSchema.safeParse(value)
      if (!parsed.success) {
        const described = describeProfileValidationError(value, parsed.error)
        setStatus('error')
        setError(described.message)
        setErrorSection(described.section)
        return
      }
      try {
        const store = await getProfileStore()
        await store.save(value)
        setStatus('saved')
        setError(null)
        setErrorSection(null)
      } catch (e) {
        setStatus('error')
        setError(e instanceof ProfileStoreError ? e.message : "L'enregistrement a échoué.")
        setErrorSection(null)
      }
    }, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), delay])

  return { status, error, errorSection }
}
