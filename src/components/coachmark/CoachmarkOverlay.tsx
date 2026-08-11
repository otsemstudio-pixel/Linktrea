// Rendu visuel du coachmark actif (Phase 1) — halo + bulle positionnée +
// progression + navigation. Ne connaît rien du CONTENU de la séquence (voir
// CoachmarkContext.tsx) : un seul composant, monté une fois près de la
// racine de l'éditeur, sert n'importe quelle séquence démarrée via start().
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '@/lib/motion/MotionPrefsContext'
import { useCoachmark } from '@/lib/coachmark/CoachmarkContext'
import { computeBubblePosition, type BubblePosition, type Rect } from '@/lib/coachmark/placement'

// Délai laissé à la mise en page pour se stabiliser avant de mesurer la
// cible (ouverture d'un accordéon replié, scroll jusqu'à la cible) — la
// transition CollapsibleSection dure 250ms quand les animations sont
// actives (voir CollapsibleSection.tsx), 0 sinon.
function settleDelay(reduced: boolean): number {
  return reduced ? 30 : 320
}

// step.targetId peut désigner plusieurs cibles ALTERNATIVES pour le même
// concept selon le contexte (voir CoachmarkContext.tsx — ex. bouton "Aperçu"
// mobile vs panneau d'aperçu desktop, jamais visibles tous les deux à la
// fois). Retient le premier id dont l'élément enregistré a une taille non
// nulle ; à défaut (aucun visible, ex. juste après un redimensionnement),
// retombe sur le premier id de la liste plutôt que de ne rien cibler du tout.
function resolveTargetId(getTarget: (id: string) => HTMLElement | null, targetId: string | string[]): string {
  const ids = Array.isArray(targetId) ? targetId : [targetId]
  for (const id of ids) {
    const el = getTarget(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) return id
    }
  }
  return ids[0]
}

export default function CoachmarkOverlay() {
  const { steps, index, isActive, advance, skip, getTarget, activate } = useCoachmark()
  const { reduced } = useMotionPrefs()
  const step = isActive ? steps[index] : undefined

  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<BubblePosition | null>(null)
  const isCentered = step ? !step.targetId : false
  // Prête à être vue/focalisée : soit centrée (rien à mesurer), soit une
  // fois son placement calculé. Tant que ready est faux, la bulle ciblée
  // reste hors-écran (voir le style plus bas) — focus() ne doit jamais
  // s'appliquer avant : focaliser un élément positionné hors-écran peut
  // pousser le navigateur à défiler la page vers CETTE position plutôt que
  // vers la vraie cible.
  const ready = isCentered || position !== null

  // Étape 1 : active la cible (ouvre sa section si besoin), la fait défiler
  // à l'écran, attend que la mise en page se stabilise, puis mesure son
  // rectangle. Se relance à chaque changement d'étape.
  useEffect(() => {
    if (!step) {
      setTargetRect(null)
      return
    }
    const targetId = step.targetId
    if (!targetId) {
      setTargetRect(null)
      return
    }

    let cancelled = false
    const activateId = step.activateId

    async function measure(rawTargetId: string | string[]) {
      const id = resolveTargetId(getTarget, rawTargetId)
      // Ouvre/active AVANT de mesurer (ex. section repliée) — voir le
      // prompt : le mécanisme doit pouvoir activer un élément qui n'est pas
      // encore prêt plutôt que d'échouer silencieusement. activateId sert
      // quand la cible elle-même n'a pas d'activateur propre (ex. la photo
      // vit dans la section "Identité", qui doit être ouverte en premier).
      activate(activateId ?? id)
      // Attend AVANT de lire getTarget(id), pas seulement avant de mesurer
      // le rectangle : quand la cible vit dans le contenu d'un accordéon
      // replié (CollapsibleSection le démonte entièrement quand fermé, voir
      // ce fichier), setOpen(true) ne le REMONTE — et donc ne réenregistre
      // sa ref — qu'au prochain rendu, jamais dans le même tick que
      // activate() ci-dessus. Lire getTarget() tout de suite après
      // renverrait encore null pour ce cas précis (constaté en test).
      await new Promise((r) => setTimeout(r, settleDelay(reduced)))
      if (cancelled) return
      const el = getTarget(id)
      if (!el) {
        setTargetRect(null)
        return
      }
      // Défilement INSTANTANÉ, jamais 'smooth' : constaté en test, le
      // navigateur n'anime pas toujours ce défilement de façon fiable
      // (headless notamment), laissant la mesure ci-dessous lire la
      // position d'AVANT le défilement — la cible se retrouve alors hors-
      // écran malgré tout. Le halo/la bulle animent déjà leur propre
      // apparition en CSS (voir plus bas) : inutile que le défilement lui-
      // même soit doux pour que la transition globale le paraisse.
      el.scrollIntoView({ block: 'center', behavior: 'auto' })
      const rect = el.getBoundingClientRect()
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }

    measure(targetId)
    return () => {
      cancelled = true
    }
    // getTarget/activate sont stables (voir CoachmarkContext.tsx) — seul le pas d'étape compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reduced])

  // Étape 2 : une fois la cible mesurée (ou pour une bulle centrée), mesure
  // la bulle elle-même (sa taille dépend du texte) puis calcule sa position
  // finale. useLayoutEffect plutôt que useEffect : la bulle est d'abord
  // rendue invisible (voir plus bas), on ne veut pas de flash visible entre
  // la mesure et le repositionnement.
  useLayoutEffect(() => {
    if (!step) {
      setPosition(null)
      return
    }
    if (step.targetId && !targetRect) {
      setPosition(null)
      return
    }
    const bubbleEl = bubbleRef.current
    if (!bubbleEl) return
    if (!targetRect) {
      // Bulle centrée (pas de cible) — pas de calcul de placement à faire,
      // le centrage est géré par CSS (flex items-center justify-center).
      setPosition(null)
      return
    }
    const { width, height } = bubbleEl.getBoundingClientRect()
    setPosition(computeBubblePosition(targetRect, width, height, window.innerWidth, window.innerHeight))
  }, [step, targetRect])

  // Recalcule au redimensionnement/scroll pendant qu'une étape ciblée est
  // active — re-résout aussi la cible (resolveTargetId) à cette occasion :
  // un redimensionnement peut faire passer la page sous/au-dessus du seuil
  // desktop, changeant laquelle des cibles alternatives est visible.
  useEffect(() => {
    if (!step?.targetId) return
    function recompute() {
      const targetId = step?.targetId
      if (!targetId) return
      const el = getTarget(resolveTargetId(getTarget, targetId))
      if (!el) return
      const rect = el.getBoundingClientRect()
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Clavier : Entrée/flèche droite avance, Échap passe (à tout moment, voir
  // le prompt — jamais bloqué par le piège de focus ci-dessous, qui ne
  // concerne QUE Tab). Tab/Maj+Tab piègent le focus à l'intérieur de la
  // bulle (ses deux boutons) tant qu'une étape est affichée — sans ça, Tab
  // pourrait faire sortir le focus vers le formulaire assombri en arrière-
  // plan, invisible mais toujours dans l'ordre de tabulation du document.
  useEffect(() => {
    if (!isActive) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        skip()
      } else if (e.key === 'Tab') {
        const bubble = bubbleRef.current
        if (!bubble) return
        const focusable = bubble.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement
        if (e.shiftKey) {
          if (active === first || !bubble.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isActive, advance, skip])

  // Focus clavier : quand une bulle apparaît, le focus s'y déplace, pour
  // qu'un lecteur d'écran annonce son contenu (prompt, Phase 3) — seulement
  // une fois `ready` (voir plus haut), jamais pendant qu'elle est encore
  // hors-écran en attente de mesure.
  useEffect(() => {
    if (step && ready) bubbleRef.current?.focus()
  }, [step, ready])

  if (!isActive || !step) return null

  const isLast = index === steps.length - 1

  return (
    <div className="fixed inset-0 z-[200]" role="presentation">
      {/* Assombrissement — même teinte (noir, 60%) que Modal.tsx pour rester
          cohérent avec le reste de l'éditeur. Pour une étape ciblée, c'est le
          box-shadow du halo ci-dessous qui porte le voile (spread 9999px
          "découpé" autour de la cible) ; ce calque plein ne sert alors que de
          repli tant que la cible n'est pas encore mesurée (ready=false). */}
      {!targetRect && <div className="absolute inset-0 bg-black/60" aria-hidden="true" />}

      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            opacity: ready ? 1 : 0,
            boxShadow: '0 0 0 3px var(--accent), 0 0 0 9999px rgba(0,0,0,0.6)',
            transition: reduced
              ? undefined
              : 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease, opacity 0.15s ease',
          }}
        />
      )}

      {/* prefers-reduced-motion (prompt, Phase 3) : reduced=true retire la
          propriété transition plutôt que de mettre sa durée à 0 — un
          changement d'opacity/visibility sans transition CSS s'applique
          instantanément, exactement l'« affichage direct sans fondu »
          demandé, sans dupliquer la logique pour une durée nulle. */}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Étape ${index + 1} sur ${steps.length}`}
        tabIndex={-1}
        className={`fixed rounded-lg border border-ink-raised bg-ink p-4 text-paper shadow-xl focus:outline-none ${
          isCentered ? 'inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-sm' : 'max-w-sm w-[calc(100vw-32px)] sm:w-auto'
        }`}
        style={{
          top: isCentered ? undefined : (position?.top ?? -9999),
          left: isCentered ? undefined : (position?.left ?? -9999),
          width: isCentered ? undefined : position?.width,
          visibility: ready ? 'visible' : 'hidden',
          opacity: ready ? 1 : 0,
          transition: reduced ? undefined : 'opacity 0.15s ease',
        }}
      >
        <p className="text-sm mb-4">{step.text}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted font-mono">
            {index + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={skip}
              className="min-h-11 px-3 text-xs text-muted rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
            >
              Passer le tuto
            </button>
            <button
              type="button"
              onClick={advance}
              className="min-h-11 px-4 rounded-md bg-accent text-ink font-medium text-sm active:scale-[0.98] transition-transform focus-visible:outline-2 focus-visible:outline-paper focus-visible:-outline-offset-2"
            >
              {isLast ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
