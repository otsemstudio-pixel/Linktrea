import { duotoneChannels, GRAYSCALE_MATRIX } from '@/lib/theme/photoTreatment'

type Props = {
  id: string
  darkHex: string
  lightHex: string
}

// Définition SVG pure, jamais affichée elle-même (width/height nuls) —
// l'image qui la consomme la référence via style={{ filter: `url(#${id})` }}
// (voir photoFilterCss). Recalculée à chaque rendu à partir des couleurs
// résolues du thème actif, jamais mise en cache : un changement d'accent ou
// de fond doit se répercuter immédiatement, sans valeur figée à l'upload.
export default function DuotoneFilterDefs({ id, darkHex, lightHex }: Props) {
  const channels = duotoneChannels(darkHex, lightHex)
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id={id}>
        <feColorMatrix type="matrix" values={GRAYSCALE_MATRIX} />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={channels.r} />
          <feFuncG type="table" tableValues={channels.g} />
          <feFuncB type="table" tableValues={channels.b} />
        </feComponentTransfer>
      </filter>
    </svg>
  )
}
