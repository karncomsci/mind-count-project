import { z } from 'zod'
import { createDraft, quotationSchema, type QuotationDraft } from '../quotations/model'
import { billingStatuses } from './services/status'

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อโปรเจ็ค').max(200),
  customer: z.string().trim().max(200),
})
export const warehouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'กรุณาระบุชื่อคลังสินค้า').max(100),
  code: z.string().trim().max(30),
  address: z.string().max(1000),
  postalCode: z.string().regex(/^(\d{5})?$/, 'รหัสไปรษณีย์ต้องมี 5 หลัก'),
  purpose: z.enum(['ซื้อและขาย', 'ซื้อสินค้า', 'ขายสินค้า'], {
    error: 'กรุณาเลือกจุดประสงค์การใช้งาน',
  }),
  contact: z.string().max(200),
  email: z.union([z.literal(''), z.email('อีเมลไม่ถูกต้อง')]),
  phone: z.string().max(30),
})
export const attachmentSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(200),
    type: z.enum(['image/png', 'image/jpeg', 'application/pdf']),
    size: z
      .number()
      .int()
      .positive()
      .max(1024 * 1024),
    dataUrl: z
      .string()
      .max(1400000)
      .regex(/^data:(image\/(png|jpeg)|application\/pdf);base64,[A-Za-z0-9+/]+=*$/),
  })
  .refine((file) => file.dataUrl.startsWith(`data:${file.type};base64,`), 'ประเภทไฟล์ไม่ถูกต้อง')
export const billingDraftSchema: z.ZodType<BillingDraft> = quotationSchema.and(
  z.object({
    signatureEnabled: z.boolean(),
    attachments: z
      .array(attachmentSchema)
      .max(3)
      .refine(
        (files) => files.reduce((sum, file) => sum + file.size, 0) <= 1536 * 1024,
        'ไฟล์แนบรวมต้องไม่เกิน 1.5 MB',
      ),
  }),
)
export interface BillingDraft extends QuotationDraft {
  signatureEnabled: boolean
  attachments: BillingAttachment[]
}
export type BillingProject = z.infer<typeof projectSchema>
export type BillingWarehouse = z.infer<typeof warehouseSchema>
export type BillingAttachment = z.infer<typeof attachmentSchema>
export const billingRecordSchema = z.object({
  id: z.string().min(1),
  number: z.string().regex(/^BL\d{12,}$/),
  updatedAt: z.string(),
  version: z.number().int().nonnegative().default(0),
  status: z.enum(billingStatuses).default('draft'),
  kind: z.enum(['billing', 'consolidated']).default('billing'),
  deletedAt: z.iso.datetime().nullable().default(null),
  draft: billingDraftSchema,
})
export type BillingRecord = z.infer<typeof billingRecordSchema>

export function createBillingDraft(date: string): BillingDraft {
  return { ...createDraft(date), note: '', signatureEnabled: true, attachments: [] }
}
export function nextBillingNumber(date: string, existing: string[]): string {
  const prefix = `BL${date.replaceAll('-', '')}`
  const last = existing.reduce((max, number) => {
    const suffix = number.startsWith(prefix) ? number.slice(prefix.length) : ''
    return /^\d{4,}$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)
  return `${prefix}${String(last + 1).padStart(4, '0')}`
}
