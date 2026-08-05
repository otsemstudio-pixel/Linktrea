const MAX_INPUT_BYTES = 5 * 1024 * 1024
const OUTPUT_SIZE = 256
const WEBP_QUALITY = 0.8

export type PhotoResult = { ok: true; dataUrl: string } | { ok: false; error: string }

// Redimensionne côté client avant stockage : carré 256×256, recadrage
// "cover", export WebP — objectif de garder le payload URL sous ~4000
// caractères (voir PAYLOAD_WARNING_THRESHOLD dans codec.ts).
export async function resizePhotoToWebP(file: File): Promise<PhotoResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Le fichier doit être une image (JPEG, PNG, WebP...).' }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, error: 'Image trop lourde : 5 Mo maximum.' }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { ok: false, error: "Le navigateur ne permet pas de traiter l'image." }
    }

    const side = Math.min(image.width, image.height)
    const sx = (image.width - side) / 2
    const sy = (image.height - side) / 2
    ctx.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const dataUrl = canvas.toDataURL('image/webp', WEBP_QUALITY)
    return { ok: true, dataUrl }
  } catch {
    return { ok: false, error: "Impossible de lire cette image." }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}
