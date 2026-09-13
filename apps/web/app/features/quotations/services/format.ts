const moneyFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
export const formatMoney = (satang: number) => moneyFormatter.format(satang / 100)
export const formatDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(parsed)
    : '—'
}
export const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || !Number.isFinite(Number(days))) return ''
  parsed.setUTCDate(parsed.getUTCDate() + Number(days))
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : ''
}
export function nextDocumentNumber(date: string, existing: string[]): string {
  const prefix = `QT${date.replaceAll('-', '')}`
  const last = existing
    .filter((value) => value.startsWith(prefix))
    .reduce((max, value) => Math.max(max, Number(value.slice(prefix.length)) || 0), 0)
  return `${prefix}${String(last + 1).padStart(4, '0')}`
}
