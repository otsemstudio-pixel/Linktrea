import { useEffect, useRef } from 'react'

type Props = {
  active: boolean
}

const SIZE = 96 // petite texture agrandie en CSS — le bruit n'a pas besoin de haute résolution
const TARGET_FPS = 8
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS

// Grain de bruit animé (refonte v2, Phase 6, thème Guilde) — redessiné via
// requestAnimationFrame mais throttlé à ~8 images/seconde à l'intérieur de
// la boucle (un bruit qui change à 60 images/seconde ne se lirait pas
// différemment d'un bruit à 8, et coûterait bien plus cher) : jamais de
// re-render React, tout se passe dans le canvas. La boucle s'arrête net au
// démontage ou dès que `active` repasse à faux (prefers-reduced-motion,
// interrupteur "Fond animé", onglet masqué — voir useBackgroundAnimation).
export default function NoiseCanvas({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    canvas.width = SIZE
    canvas.height = SIZE

    let rafId: number
    let lastDraw = 0

    function draw(timestamp: number) {
      rafId = requestAnimationFrame(draw)
      if (timestamp - lastDraw < FRAME_INTERVAL_MS) return
      lastDraw = timestamp
      const imageData = ctx!.createImageData(SIZE, SIZE)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255
        imageData.data[i] = v
        imageData.data[i + 1] = v
        imageData.data[i + 2] = v
        imageData.data[i + 3] = 255
      }
      ctx!.putImageData(imageData, 0, 0)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full opacity-[0.035] mix-blend-overlay"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
