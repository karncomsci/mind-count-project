import { quotationPdfDefinition } from './pdf-definition'
import type { QuotationRecord } from '../types'

export async function createQuotationPdf(records: QuotationRecord[]): Promise<Blob> {
  const { default: pdfMake } = await import('pdfmake/build/pdfmake')
  const base = new URL('/fonts/sarabun/', window.location.origin).href
  pdfMake.addFonts({
    Sarabun: {
      normal: `${base}Sarabun-Regular.ttf`,
      bold: `${base}Sarabun-Bold.ttf`,
      italics: `${base}Sarabun-Regular.ttf`,
      bolditalics: `${base}Sarabun-Bold.ttf`,
    },
  })
  return pdfMake.createPdf(quotationPdfDefinition(records)).getBlob()
}
export function pdfFilename(records: QuotationRecord[]): string {
  return records.length === 1
    ? `${records[0]!.number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`
    : 'quotations.pdf'
}
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
