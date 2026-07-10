// Desenha um cartão de versículo (imagem PNG) no navegador, para compartilhar.
const THEMES = {
  light: { bg: '#faf8f3', panel: '#ffffff', text: '#1f1b16', muted: '#6b6358', accent: '#8a6d3b' },
  dark: { bg: '#16140f', panel: '#1e1b15', text: '#ece6da', muted: '#a39c8d', accent: '#c9a86a' },
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function makeVerseCard({ text, ref, version, theme = 'light' }) {
  const S = 1080
  const c = THEMES[theme] || THEMES.light
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = c.accent
  ctx.fillRect(0, 0, S, 14)

  const margin = 110
  const maxW = S - margin * 2
  const quote = `“${text}”`

  // shrink the font until the wrapped quote fits the available height
  let size = 66
  let lines = []
  const topArea = 250, bottomArea = 210
  const maxTextH = S - topArea - bottomArea
  while (size >= 30) {
    ctx.font = `500 ${size}px Georgia, 'Times New Roman', serif`
    lines = wrap(ctx, quote, maxW)
    if (lines.length * size * 1.4 <= maxTextH) break
    size -= 2
  }

  // vertically center the block of text
  const lineH = size * 1.4
  const blockH = lines.length * lineH
  let y = topArea + (maxTextH - blockH) / 2 + size
  ctx.fillStyle = c.text
  ctx.textAlign = 'center'
  ctx.font = `500 ${size}px Georgia, 'Times New Roman', serif`
  for (const ln of lines) { ctx.fillText(ln, S / 2, y); y += lineH }

  // reference
  ctx.fillStyle = c.accent
  ctx.font = `600 40px -apple-system, Segoe UI, Roboto, sans-serif`
  ctx.fillText(ref.toUpperCase(), S / 2, S - 150)

  // version + site
  ctx.fillStyle = c.muted
  ctx.font = `400 26px -apple-system, Segoe UI, Roboto, sans-serif`
  ctx.fillText(version, S / 2, S - 100)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
