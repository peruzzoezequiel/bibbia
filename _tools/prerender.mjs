// Prerender (SSG): após `vite build`, gera um HTML estático por capítulo e versão
// em dist/<versao>/<slug>/<cap>/index.html, com o texto e os metadados embutidos.
// Buscadores e IAs que NÃO executam JavaScript leem o conteúdo real.
//
// Uso: node _tools/prerender.mjs   (depois de `npm run build`)

import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://www.bibbia.com.br').replace(/\/$/, '')
const SITE_NAMES = { pt: 'Bíblia', en: 'Bible', es: 'Biblia', it: 'Bibbia', fr: 'Bible' }
const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const DATA = path.join(ROOT, 'public', 'data')

const VERSIONS = {
  'pt-bkj':     { htmlLang: 'pt-BR', family: 'tr', versionOT: 'King James 1611', versionNT: 'Almeida' },
  'pt-livretr': { htmlLang: 'pt-BR', family: 'tr', version: 'Bíblia Livre (Texto Recebido)' },
  'pt-almeida': { htmlLang: 'pt-BR', family: 'tr', version: 'Almeida 1911' },
  'pt-livre':   { htmlLang: 'pt-BR', family: 'critical', version: 'Bíblia Livre' },
  'en-kjv':     { htmlLang: 'en', family: 'tr', version: 'King James Version' },
  'es-rv1909':  { htmlLang: 'es', family: 'tr', version: 'Reina-Valera 1909' },
  'it-diodati': { htmlLang: 'it', family: 'tr', version: 'Diodati 1649' },
  'fr-martin':  { htmlLang: 'fr', family: 'tr', version: 'Martin 1744' },
  'fr-segond':  { htmlLang: 'fr', family: 'critical', version: 'Louis Segond 1910' },
}
const IDS = Object.keys(VERSIONS)
const LANG_ORDER = ['pt', 'en', 'es', 'it', 'fr']

// versões equivalentes (mesma family) — uma representante por idioma
function hreflangAlternates(ver) {
  const fam = VERSIONS[ver].family
  const out = []
  for (const code of LANG_ORDER) {
    const sel = IDS.find((s) => s.split('-')[0] === code && VERSIONS[s].family === fam)
    if (sel) out.push({ hreflang: VERSIONS[sel].htmlLang, sel })
  }
  return out
}

const templatePath = path.join(DIST, 'index.html')
if (!fs.existsSync(templatePath)) {
  console.error('dist/index.html não encontrado. Rode `npm run build` primeiro.')
  process.exit(1)
}
const template = fs.readFileSync(templatePath, 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function version(ver, testament) {
  const V = VERSIONS[ver]
  return V.version || (testament === 'NT' ? V.versionNT : V.versionOT)
}

function buildPage(ver, book, chapter, verses) {
  const siteName = SITE_NAMES[ver.split('-')[0]] || 'Bíblia'
  const ref = `${book.name} ${chapter}`
  const vlabel = version(ver, book.testament)
  const title = `${ref} — ${siteName} · ${vlabel}`
  const snippet = verses.slice(0, 2).join(' ').replace(/\s+/g, ' ').slice(0, 155)
  const desc = `${ref}: ${snippet}${snippet.length >= 155 ? '…' : ''}`
  const url = `${SITE_URL}/${ver}/${book.slug}/${chapter}`

  const htmlLang = VERSIONS[ver].htmlLang
  const versesHtml = verses.map((v, i) => `<p><sup>${i + 1}</sup> ${esc(v)}</p>`).join('\n')
  const article = `<article><h1>${esc(ref)}</h1><p><em>${esc(vlabel)}</em></p>\n${versesHtml}</article>`

  const ld = [
    { '@context': 'https://schema.org', '@type': 'Chapter', name: ref,
      isPartOf: { '@type': 'Book', name: `${siteName} — ${vlabel}` },
      inLanguage: htmlLang, url, position: chapter },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: siteName, item: `${SITE_URL}/${ver}/genesis/1` },
        { '@type': 'ListItem', position: 2, name: book.name, item: `${SITE_URL}/${ver}/${book.slug}/1` },
        { '@type': 'ListItem', position: 3, name: ref, item: url },
      ] },
  ].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')

  const alts = hreflangAlternates(ver)
  const altLinks = alts
    .map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${SITE_URL}/${a.sel}/${book.slug}/${chapter}" />`)
    .concat(alts.filter((a) => a.hreflang.startsWith('pt'))
      .map((a) => `<link rel="alternate" hreflang="x-default" href="${SITE_URL}/${a.sel}/${book.slug}/${chapter}" />`))
    .join('\n')

  let html = template
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${htmlLang}"`)
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  html = html.replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
  html = html.replace('</head>', `${altLinks}\n${ld}\n</head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${article}</div>`)
  return html
}

let count = 0
for (const ver of IDS) {
  const index = JSON.parse(fs.readFileSync(path.join(DATA, ver, 'index.json'), 'utf8'))
  for (const book of index) {
    const chapters = JSON.parse(fs.readFileSync(path.join(DATA, ver, `${book.slug}.json`), 'utf8'))
    chapters.forEach((verses, ci) => {
      const chapter = ci + 1
      const dir = path.join(DIST, ver, book.slug, String(chapter))
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'index.html'), buildPage(ver, book, chapter, verses))
      count++
    })
  }
}
console.log(`Prerender concluído: ${count} páginas estáticas em dist/ (${IDS.length} versões)`)
