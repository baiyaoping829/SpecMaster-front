export const createSimplePdfBytes = (text: string) => {
  const escapePdfString = (s: string) =>
    String(s)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')

  const stream = `BT\n/F1 24 Tf\n20 120 Td\n(${escapePdfString(text)}) Tj\nET\n`

  const chunks: string[] = []
  const offsets: Record<number, number> = {}

  const push = (s: string) => chunks.push(s)
  const length = () => Buffer.byteLength(chunks.join(''), 'utf8')

  push('%PDF-1.4\n')

  const addObj = (n: number, body: string) => {
    offsets[n] = length()
    push(`${n} 0 obj\n${body}\nendobj\n`)
  }

  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  addObj(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'
  )
  addObj(4, `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream`)
  addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  const xrefOffset = length()
  const maxObj = 5
  push('xref\n')
  push(`0 ${maxObj + 1}\n`)
  push('0000000000 65535 f \n')
  for (let i = 1; i <= maxObj; i++) {
    const off = String(offsets[i] || 0).padStart(10, '0')
    push(`${off} 00000 n \n`)
  }
  push('trailer\n')
  push(`<< /Size ${maxObj + 1} /Root 1 0 R >>\n`)
  push('startxref\n')
  push(`${xrefOffset}\n`)
  push('%%EOF\n')

  return Buffer.from(chunks.join(''), 'utf8')
}

