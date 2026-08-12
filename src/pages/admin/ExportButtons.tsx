import { downloadCsv, downloadJson, downloadXlsx } from '@/lib/exportTable'

type Props = {
  // Sans extension — chaque fonction de téléchargement ajoute la sienne
  // (linktrea-inscriptions-90j.csv / .xlsx / .json).
  filename: string
  rows: Record<string, unknown>[]
}

const buttonClassName =
  'min-h-8 px-2.5 rounded-md border border-ink-raised text-xs text-muted focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2'

export default function ExportButtons({ filename, rows }: Props) {
  return (
    <div className="flex gap-1.5 mt-4 pt-4 border-t border-ink-raised">
      <button type="button" onClick={() => downloadCsv(filename, rows)} className={buttonClassName}>
        CSV
      </button>
      <button type="button" onClick={() => downloadXlsx(filename, rows)} className={buttonClassName}>
        Excel
      </button>
      <button type="button" onClick={() => downloadJson(filename, rows)} className={buttonClassName}>
        JSON
      </button>
    </div>
  )
}
