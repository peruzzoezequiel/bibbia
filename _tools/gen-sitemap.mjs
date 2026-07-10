// Gera public/sitemap.xml com todos os capítulos de todas as versões (pt).
// Troque SITE_URL pelo seu domínio (ou: SITE_URL=https://... node ...).

import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://www.bibbia.com.br').replace(/\/$/, '')
const VERSIONS = ['pt-bkj', 'pt-livretr', 'pt-almeida', 'pt-livre', 'en-kjv', 'es-rv1909', 'it-diodati', 'fr-martin', 'fr-segond']
const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const today = new Date().toISOString().slice(0, 10)

const urls = [`  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>`]

for (const ver of VERSIONS) {
  const index = JSON.parse(fs.readFileSync(path.join(DATA, ver, 'index.json'), 'utf8'))
  for (const book of index) {
    for (let c = 1; c <= book.chapters; c++) {
      urls.push(
        `  <url>\n    <loc>${SITE_URL}/${ver}/${book.slug}/${c}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${c === 1 ? '0.8' : '0.6'}</priority>\n  </url>`
      )
    }
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml gerado: ${urls.length} URLs (${VERSIONS.length} versões)`)
