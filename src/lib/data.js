const BASE = import.meta.env.BASE_URL || '/'

const indexCache = new Map()   // lang -> index
const bookCache = new Map()    // `${lang}/${slug}` -> chapters
const flatCache = new Map()    // lang -> flat verse list

export async function loadIndex(lang) {
  if (indexCache.has(lang)) return indexCache.get(lang)
  const res = await fetch(`${BASE}data/${lang}/index.json`)
  const data = await res.json()
  indexCache.set(lang, data)
  return data
}

export async function loadBook(lang, slug) {
  const key = `${lang}/${slug}`
  if (bookCache.has(key)) return bookCache.get(key)
  const res = await fetch(`${BASE}data/${lang}/${slug}.json`)
  if (!res.ok) throw new Error(`Livro não encontrado: ${key}`)
  const data = await res.json()
  bookCache.set(key, data)
  return data
}

export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Copy with a fallback for contexts where the async Clipboard API is blocked.
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus(); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

// Loads every book of a language once and builds a flat, searchable verse list.
export async function loadAll(lang, onProgress) {
  if (flatCache.has(lang)) return flatCache.get(lang)
  const index = await loadIndex(lang)
  const flat = []
  let done = 0
  await Promise.all(
    index.map(async (book) => {
      const chapters = await loadBook(lang, book.slug)
      chapters.forEach((verses, ci) => {
        verses.forEach((text, vi) => {
          flat.push({
            slug: book.slug, abbr: book.abbr, name: book.name,
            testament: book.testament, c: ci + 1, v: vi + 1,
            text, norm: normalize(text),
          })
        })
      })
      done += 1
      if (onProgress) onProgress(done, index.length)
    })
  )
  flatCache.set(lang, flat)
  return flat
}
