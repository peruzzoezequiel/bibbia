import { LANGS, t, hreflangAlternates } from './i18n.js'

// Domínio de produção (deve casar com index.html, robots.txt e sitemap).
export const SITE_URL = 'https://www.bibbia.com.br'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href, hreflang) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
  let el = document.head.querySelector(sel)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    if (hreflang) el.setAttribute('hreflang', hreflang)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

// Updates the head for a chapter so shared links, Google (which renders JS)
// and AI crawlers get accurate, per-page, per-language metadata.
export function setChapterSeo({ lang, book, chapter, verses, version }) {
  const siteName = t(lang).brand
  const ref = `${book.name} ${chapter}`
  const title = `${ref} — ${siteName} · ${version}`
  const snippet = (verses || []).slice(0, 2).join(' ').replace(/\s+/g, ' ').slice(0, 155)
  const desc = snippet ? `${ref}: ${snippet}${snippet.length >= 155 ? '…' : ''}` : ref
  const url = `${SITE_URL}/${lang}/${book.slug}/${chapter}`

  document.title = title
  setMeta('name', 'description', desc)
  setLink('canonical', url)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:locale', LANGS[lang].htmlLang.replace('-', '_'))
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)

  // hreflang: mesma passagem, mesma tradição, em cada idioma disponível
  const alts = hreflangAlternates(lang)
  for (const a of alts) {
    setLink('alternate', `${SITE_URL}/${a.sel}/${book.slug}/${chapter}`, a.hreflang)
  }
  const ptAlt = alts.find((a) => a.hreflang.startsWith('pt'))
  if (ptAlt) setLink('alternate', `${SITE_URL}/${ptAlt.sel}/${book.slug}/${chapter}`, 'x-default')

  setJsonLd('ld-chapter', {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: ref,
    isPartOf: { '@type': 'Book', name: `${siteName} — ${version}` },
    inLanguage: LANGS[lang].htmlLang,
    url,
    position: chapter,
  })
  setJsonLd('ld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: `${SITE_URL}/${lang}/genesis/1` },
      { '@type': 'ListItem', position: 2, name: book.name, item: `${SITE_URL}/${lang}/${book.slug}/1` },
      { '@type': 'ListItem', position: 3, name: ref, item: url },
    ],
  })
}
