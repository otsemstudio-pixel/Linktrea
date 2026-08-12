// Export CSV/XLSX/JSON générique pour le tableau de bord admin (doc
// "Tableau de bord admin", Phase 4) — entièrement côté client, à partir des
// données déjà chargées pour l'affichage : jamais un nouvel appel réseau au
// moment du clic sur un bouton d'export. CSV et JSON sans dépendance ; XLSX
// via SheetJS (voir package.json — installé depuis le CDN officiel
// sheetjs.com, pas le registre npm : la version publiée sur npm est bloquée
// depuis des années sur une version qui n'a jamais reçu le correctif de
// deux CVE connues, la distribution CDN si).
import * as XLSX from 'xlsx'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value: unknown): string {
  const str = String(value ?? '')
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, `${filename}.csv`)
}

export function downloadJson(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `${filename}.json`)
}

export function downloadXlsx(filename: string, rows: Record<string, unknown>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Données')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, `${filename}.xlsx`)
}
