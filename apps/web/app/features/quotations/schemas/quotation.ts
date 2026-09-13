import { z } from 'zod'
import type { QuotationDraft, QuotationRecord } from '../types'
import { addDays } from '../services/format'
import { quotationStatuses } from '../services/status'

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'กรุณาระบุวันที่')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, 'วันที่ไม่ถูกต้อง')

export const quotationSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(1, 'กรุณาระบุชื่อลูกค้า').max(200),
      address: z.string().max(1000),
      postalCode: z.string().regex(/^(\d{5})?$/, 'รหัสไปรษณีย์ต้องมี 5 หลัก'),
      taxId: z.string().regex(/^(\d{13})?$/, 'เลขผู้เสียภาษีต้องมี 13 หลัก'),
      branch: z.string().max(100),
    }),
    date: dateSchema,
    creditDays: z
      .number()
      .int('เครดิตต้องเป็นจำนวนวันเต็ม')
      .min(0, 'เครดิตต้องไม่ติดลบ')
      .max(365, 'เครดิตต้องไม่เกิน 365 วัน'),
    creditMode: z.enum(['days', 'cash', 'undated']).default('days'),
    dueDate: dateSchema.optional(),
    salesperson: z.string().max(200),
    project: z.string().max(200),
    reference: z.string().max(100),
    description: z.string().max(1000),
    warehouse: z.string().max(100),
    priceMode: z.enum(['exclusive', 'inclusive']),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          description: z.string().trim().min(1, 'กรุณาระบุชื่อสินค้า / รายละเอียด').max(1000),
          quantity: z.number().positive('จำนวนต้องมากกว่า 0').max(100000),
          unit: z.string().trim().min(1, 'กรุณาระบุหน่วย').max(30),
          unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ').max(1000000),
          discountPercent: z.number().min(0).max(100, 'ส่วนลดต้องไม่เกิน 100%'),
          vatRate: z.union([z.literal(0), z.literal(7)]),
          withholdingRate: z.union([z.literal(0), z.literal(1), z.literal(3), z.literal(5)]),
        }),
      )
      .min(1, 'กรุณาเพิ่มอย่างน้อย 1 รายการ')
      .max(100),
    documentDiscount: z.number().min(0).max(100000000),
    note: z.string().max(2000),
    internalNote: z.string().max(2000),
  })
  // Fill only missing fields so previously saved browser records remain readable.
  .transform((draft) => ({
    ...draft,
    dueDate: draft.dueDate ?? addDays(draft.date, draft.creditDays),
  }))
  .superRefine((draft, context) => {
    if (draft.creditMode === 'days' && draft.dueDate !== addDays(draft.date, draft.creditDays)) {
      context.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'วันครบกำหนดต้องตรงกับจำนวนวันเครดิต',
      })
    }
    if (draft.creditMode === 'cash' && (draft.creditDays !== 0 || draft.dueDate !== draft.date)) {
      context.addIssue({
        code: 'custom',
        path: ['creditDays'],
        message: 'เงินสดต้องมีเครดิต 0 วัน',
      })
    }
    const available = draft.items.reduce((sum, item) => {
      const gross = Math.round(item.quantity * item.unitPrice * 100)
      return sum + gross - Math.round((gross * item.discountPercent) / 100)
    }, 0)
    if (Math.round(draft.documentDiscount * 100) > available)
      context.addIssue({
        code: 'custom',
        path: ['documentDiscount'],
        message: 'ส่วนลดรวมต้องไม่เกินมูลค่ารายการ',
      })
  }) satisfies z.ZodType<QuotationDraft>

export const recordSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: z.enum(quotationStatuses),
  updatedAt: z.string(),
  draft: quotationSchema,
}) satisfies z.ZodType<QuotationRecord>
export const recordsSchema = z.array(recordSchema).max(1000)
