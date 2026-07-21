// Gera sitemaps SEPARADOS por versão + um índice.
//
//   public/sitemap.xml              -> índice (aponta para todos os outros)
//   public/sitemap-<versao>.xml     -> um sitemap por versão (~1.189 URLs cada)
//
// Por que separado: em domínio novo o Google tem pouco orçamento de rastreamento.
// Enviando no Search Console apenas o sitemap da versão principal, esse orçamento
// se concentra nas páginas que importam, em vez de diluir em 10.702 URLs.
// (O campo `priority` é ignorado pelo Google — quem manda é o que você envia.)

import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://www.bibbia.com.br').replace(/\/$/, '')
const PRIMARY = 'pt-bkj' // versão principal: recebe a home e é a que deve ser enviada primeiro
const VERSIONS = ['pt-bkj', 'pt-livretr', 'pt-almeida', 'pt-livre', 'en-kjv', 'es-rv1909', 'it-diodati', 'fr-martin', 'fr-segond']

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const PUB = path.join(ROOT, 'public')
const today = new Date().toISOString().slice(0, 10)

const urlTag = (loc, priority) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`

let total = 0
const files = []

for (const ver of VERSIONS) {
  const index = JSON.parse(fs.readFileSync(path.join(DATA, ver, 'index.json'), 'utf8'))
  const urls = []
  // a home entra no sitemap da versão principal
  if (ver === PRIMARY) urls.push(urlTag(`${SITE_URL}/`, '1.0'))

  for (const book of index) {
    for (let c = 1; c <= book.chapters; c++) {
      urls.push(urlTag(`${SITE_URL}/${ver}/${book.slug}/${c}`, c === 1 ? '0.8' : '0.6'))
    }
  }

  const name = `sitemap-${ver}.xml`
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  fs.writeFileSync(path.join(PUB, name), xml)
  files.push(name)
  total += urls.length
  console.log(`  ${name.padEnd(26)} ${urls.length} URLs`)
}

// índice de sitemaps (a versão principal primeiro)
const ordered = [`sitemap-${PRIMARY}.xml`, ...files.filter((f) => f !== `sitemap-${PRIMARY}.xml`)]
const indexXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ordered.map((f) => `  <sitemap>\n    <loc>${SITE_URL}/${f}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`).join('\n') +
  `\n</sitemapindex>\n`
fs.writeFileSync(path.join(PUB, 'sitemap.xml'), indexXml)

console.log(`\nsitemap.xml (índice) com ${ordered.length} sitemaps · ${total} URLs no total`)
console.log(`Principal para enviar no Search Console: ${SITE_URL}/sitemap-${PRIMARY}.xml`)
