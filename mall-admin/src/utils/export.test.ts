import { toCsv } from './export'

describe('CSV export', () => {
  it('emits a BOM and escapes commas, quotes and new lines', () => {
    const csv = toCsv(
      ['订单号', '收货人', '备注'],
      [['A-1', '张三', '包含,逗号'], ['A-2', '李"四', '第一行\n第二行']],
    )

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"包含,逗号"')
    expect(csv).toContain('"李""四"')
    expect(csv).toContain('"第一行\n第二行"')
  })
})
