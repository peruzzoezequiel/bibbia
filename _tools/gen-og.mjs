// Gera public/og-image.png (1200×630) — a imagem de preview em redes sociais.
// Requer sharp:  npm i -D sharp   (depois:  node _tools/gen-og.mjs)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f3"/>
  <rect width="1200" height="14" fill="#8a6d3b"/>
  <g transform="translate(600 232)" fill="none" stroke="#8a6d3b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(-52 -52) scale(4.3)">
      <path d="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6v13M12 6v13M21 6v13"/>
    </g>
  </g>
  <text x="600" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="88" font-weight="600" fill="#1f1b16">Bíblia</text>
  <text x="600" y="470" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="34" fill="#8a6d3b">King James 1611 · Reina-Valera · Diodati · Almeida</text>
  <text x="600" y="530" text-anchor="middle" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="28" fill="#6b6358">Leitura online · busca · áudio · 4 idiomas</text>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(path.join(ROOT, 'public', 'og-image.png'))
console.log('public/og-image.png gerado (1200×630)')
