import type { DropdownItem } from '~/components/base/dropdown'
export const rowActions = [
  { id: 'edit', label: 'แก้ไข', icon: 'edit' },
  { id: 'print', label: 'พิมพ์', icon: 'print' },
  { id: 'share', label: 'แชร์', icon: 'share' },
  { id: 'download', label: 'ดาวน์โหลด PDF', icon: 'download' },
  { id: 'envelope', label: 'พิมพ์จ่าหน้าซอง', icon: 'envelope' },
  { id: 'duplicate', label: 'สร้างซ้ำ', icon: 'copy' },
  { id: 'delete', label: 'ลบ', icon: 'trash', danger: true, separator: true },
] as const satisfies readonly DropdownItem[]
export type QuotationAction = (typeof rowActions)[number]['id']
export function isQuotationAction(value: string): value is QuotationAction {
  return rowActions.some((item) => item.id === value)
}
