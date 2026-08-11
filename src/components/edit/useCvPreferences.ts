import { useState } from 'react'
import type { CvLang } from '@/lib/cv/formatCvDate'

export type CvModel = 'classic' | 'modern'

const MODEL_KEY = 'linktrea:cv-model'
const LANG_KEY = 'linktrea:cv-lang'

// Persistance modèle + langue (prompt CV, Phase 3) — pas la photo : celle-ci
// n'est pas mentionnée dans les préférences à retenir, et reste un choix
// ponctuel par génération (voir CvOverlay.tsx, désactivée par défaut).
function readModel(): CvModel {
  try {
    return localStorage.getItem(MODEL_KEY) === 'modern' ? 'modern' : 'classic'
  } catch {
    return 'classic'
  }
}

function readLang(): CvLang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

export function useCvPreferences() {
  const [model, setModelState] = useState<CvModel>(readModel)
  const [lang, setLangState] = useState<CvLang>(readLang)

  function setModel(next: CvModel) {
    setModelState(next)
    try {
      localStorage.setItem(MODEL_KEY, next)
    } catch {
      // Stockage indisponible : le choix reste actif pour cette session, non
      // retenu à la prochaine ouverture — pas une erreur bloquante.
    }
  }

  function setLang(next: CvLang) {
    setLangState(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      // idem setModel
    }
  }

  return { model, setModel, lang, setLang }
}
