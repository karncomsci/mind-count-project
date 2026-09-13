import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { calculateTotals } from './calculations'
import { formatDate, formatMoney } from './format'
import type { QuotationRecord } from '../types'

export interface DocumentPdfOptions {
  title?: string
  signatureEnabled?: boolean
}
export function quotationPdfDefinition(
  records: QuotationRecord[],
  options: DocumentPdfOptions = {},
): TDocumentDefinitions {
  if (!records.length) throw new Error('กรุณาเลือกเอกสาร')
  const content: Content[] = records.map((record, index) => {
    const { draft } = record
    const totals = calculateTotals(draft)
    const summary = [
      ['รวมเป็นเงิน', totals.subtotal],
      ['ส่วนลดรวม', totals.discount],
      ['ภาษีมูลค่าเพิ่ม', totals.vat],
      ['จำนวนเงินรวมทั้งสิ้น', totals.total],
      ['หัก ณ ที่จ่าย', totals.withholding],
      ['ยอดชำระ', totals.payable],
    ] as const
    return {
      pageBreak: index ? 'before' : undefined,
      stack: [
        { text: options.title ?? 'ใบเสนอราคา', fontSize: 24, color: '#168ebd', bold: true },
        { text: record.number, fontSize: 15, margin: [0, 2, 0, 5] },
        {
          text: 'เอกสารตัวอย่าง · Mind Count',
          color: '#64748b',
          fontSize: 9,
          margin: [0, 0, 0, 18],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: draft.customer.name, bold: true },
                { text: draft.customer.address },
                { text: draft.customer.postalCode },
                { text: draft.customer.branch },
                { text: draft.customer.taxId ? `เลขผู้เสียภาษี ${draft.customer.taxId}` : '' },
              ],
            },
            {
              width: 200,
              stack: [
                { text: `วันที่ ${formatDate(draft.date)}` },
                ...(draft.creditMode === 'days'
                  ? [
                      { text: `เครดิต ${draft.creditDays} วัน` },
                      { text: `ครบกำหนด ${formatDate(draft.dueDate)}` },
                    ]
                  : [{ text: draft.creditMode === 'cash' ? 'เงินสด' : 'เครดิต (ไม่แสดงวันที่)' }]),
                { text: `พนักงานขาย ${draft.salesperson}` },
                {
                  text: `สกุลเงิน THB · ${draft.priceMode === 'inclusive' ? 'ราคารวมภาษี' : 'ราคาไม่รวมภาษี'}`,
                },
                { text: draft.reference ? `อ้างอิง ${draft.reference}` : '' },
              ],
            },
          ],
          columnGap: 20,
          margin: [0, 0, 0, 16],
        },
        {
          text: [draft.project, draft.description].filter(Boolean).join('\n'),
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: [28, '*', 37, 48, 43, 30, 65],
            body: [
              ['ลำดับ', 'สินค้า / รายละเอียด', 'จำนวน', 'ราคา/หน่วย', 'ส่วนลด %', 'VAT', 'รวม'].map(
                (text) => ({ text, color: '#ffffff', fillColor: '#249fce', bold: true }),
              ),
              ...draft.items.map((item, row) => [
                String(row + 1),
                item.description,
                `${item.quantity} ${item.unit}`,
                formatMoney(Math.round(item.unitPrice * 100)),
                String(item.discountPercent),
                `${item.vatRate}%`,
                { text: formatMoney(totals.lines[row]?.total ?? 0), alignment: 'right' as const },
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          fontSize: 9,
        },
        {
          columns: [
            {
              width: '*',
              text: draft.note ? `หมายเหตุ\n${draft.note}` : '',
              margin: [0, 12, 20, 0],
            },
            {
              width: 230,
              table: {
                widths: ['*', 'auto'],
                body: summary.map(([label, value]) => [
                  label,
                  { text: formatMoney(value), alignment: 'right' as const },
                ]),
              },
              layout: 'noBorders',
              margin: [0, 12, 0, 0],
            },
          ],
        },
        ...(options.signatureEnabled
          ? [
              {
                columns: [
                  {
                    text: '________________________\nผู้วางบิล / ตรายาง',
                    alignment: 'center' as const,
                  },
                  {
                    text: '________________________\nผู้รับวางบิล / วันที่',
                    alignment: 'center' as const,
                  },
                ],
                margin: [0, 45, 0, 0] as [number, number, number, number],
              },
            ]
          : []),
      ],
    }
  })
  return {
    pageSize: 'A4',
    pageMargins: [36, 36, 36, 40],
    defaultStyle: { font: 'Sarabun', fontSize: 11, color: '#334155' },
    info: {
      title: records.length === 1 ? records[0]!.number : (options.title ?? 'ใบเสนอราคา'),
      author: 'Mind Count',
    },
    content,
    footer: (page, count) => ({
      text: `${page} / ${count}`,
      alignment: 'center',
      fontSize: 9,
      color: '#64748b',
      margin: [0, 12, 0, 0],
    }),
  }
}
