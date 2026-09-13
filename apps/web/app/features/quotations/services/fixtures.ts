import { addDays } from './format'
import type {
  Customer,
  QuotationDraft,
  QuotationLine,
  QuotationRecord,
  QuotationStatus,
} from '../types'

export const sampleCustomers: Customer[] = [
  {
    name: 'บริษัท บลูสกาย สตูดิโอ จำกัด',
    address: '88 ถนนพหลโยธิน แขวงสามเสนใน\nเขตพญาไท กรุงเทพมหานคร',
    postalCode: '10400',
    taxId: '',
    branch: 'สำนักงานใหญ่',
  },
  {
    name: 'บริษัท กรีนลีฟ รีเทล จำกัด',
    address: '129 ถนนสุขุมวิท แขวงคลองตัน\nเขตคลองเตย กรุงเทพมหานคร',
    postalCode: '10110',
    taxId: '',
    branch: 'สำนักงานใหญ่',
  },
  {
    name: 'บริษัท นอร์ท สเปซ จำกัด',
    address: '45 ถนนนิมมานเหมินท์ ตำบลสุเทพ\nอำเภอเมืองเชียงใหม่ เชียงใหม่',
    postalCode: '50200',
    taxId: '',
    branch: 'สำนักงานใหญ่',
  },
]
export const sampleProducts = [
  { name: 'ออกแบบอัตลักษณ์แบรนด์', unit: 'งาน', price: 15000 },
  { name: 'ออกแบบเว็บไซต์', unit: 'งาน', price: 35000 },
  { name: 'ดูแลสื่อออนไลน์', unit: 'เดือน', price: 8500 },
  { name: 'ชุดของขวัญพรีเมียม', unit: 'ชุด', price: 590 },
]
export function createLine(id: string): QuotationLine {
  return {
    id,
    description: '',
    quantity: 1,
    unit: 'งาน',
    unitPrice: 0,
    discountPercent: 0,
    vatRate: 7,
    withholdingRate: 0,
  }
}
export function createDraft(date: string): QuotationDraft {
  return {
    customer: { name: '', address: '', postalCode: '', taxId: '', branch: '' },
    date,
    creditDays: 30,
    creditMode: 'days',
    dueDate: addDays(date, 30),
    salesperson: 'ผู้ดูแลระบบ',
    project: '',
    reference: '',
    description: '',
    warehouse: 'คลังสินค้าหลัก',
    priceMode: 'exclusive',
    items: [createLine('line-1')],
    documentDiscount: 0,
    note: 'ใบเสนอราคานี้มีอายุ 30 วันนับจากวันที่ออกเอกสาร',
    internalNote: '',
  }
}
export function sampleQuotations(): QuotationRecord[] {
  const statuses: QuotationStatus[] = [
    'draft',
    'sent',
    'accepted',
    'sent',
    'draft',
    'expired',
    'accepted',
    'sent',
  ]
  return statuses.map((status, index) => {
    const draft = createDraft(`2026-09-${String(13 - index).padStart(2, '0')}`)
    draft.customer = { ...sampleCustomers[index % sampleCustomers.length]! }
    const product = sampleProducts[index % sampleProducts.length]!
    draft.items = [
      {
        ...createLine(`sample-line-${index}`),
        description: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity: index === 3 ? 50 : 1,
      },
    ]
    draft.project = ['Brand identity 2026', 'Website redesign', 'Social media', 'Corporate gifts'][
      index % 4
    ]!
    return {
      id: `sample-${index + 1}`,
      number: `QT${draft.date.replaceAll('-', '')}0001`,
      status,
      draft,
      updatedAt: `${draft.date}T08:00:00.000Z`,
    }
  })
}
