// Camada pessoal salva no navegador: última posição, favoritos, versículo do dia.

const LAST = 'biblia-last'
const FAV = 'biblia-favorites'

export function setLast(pos) {
  try { localStorage.setItem(LAST, JSON.stringify(pos)) } catch { /* ignore */ }
}
export function getLast() {
  try { return JSON.parse(localStorage.getItem(LAST)) } catch { return null }
}

export const favKey = (e) => `${e.lang}:${e.slug}:${e.chapter}:${e.verse}`

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV)) || [] } catch { return [] }
}
function saveFavorites(list) {
  try { localStorage.setItem(FAV, JSON.stringify(list)) } catch { /* ignore */ }
}
export function toggleFavorite(entry) {
  const list = getFavorites()
  const k = favKey(entry)
  const i = list.findIndex((e) => favKey(e) === k)
  if (i >= 0) list.splice(i, 1)
  else list.unshift({ ...entry, at: Date.now() })
  saveFavorites(list)
  return list
}
export function removeFavorite(key) {
  const list = getFavorites().filter((e) => favKey(e) !== key)
  saveFavorites(list)
  return list
}

// Referências conhecidas para o "versículo do dia" (evita cair em genealogias).
const DAILY = [
  ['joao', 3, 16], ['salmos', 23, 1], ['proverbios', 3, 5], ['isaias', 41, 10],
  ['filipenses', 4, 13], ['jeremias', 29, 11], ['romanos', 8, 28], ['josue', 1, 9],
  ['salmos', 46, 1], ['mateus', 6, 33], ['proverbios', 16, 3], ['salmos', 91, 1],
  ['isaias', 40, 31], ['1-corintios', 13, 4], ['gALatas', 5, 22], ['salmos', 121, 1],
  ['hebreus', 11, 1], ['romanos', 12, 2], ['mateus', 11, 28], ['salmos', 27, 1],
  ['1-joao', 4, 19], ['efesios', 2, 8], ['salmos', 37, 4], ['tiago', 1, 5],
  ['proverbios', 4, 23], ['joao', 14, 6], ['salmos', 118, 24], ['2-timoteo', 1, 7],
  ['miqueias', 6, 8], ['lamentacoes', 3, 23], ['salmos', 19, 1], ['colossenses', 3, 23],
].map(([slug, chapter, verse]) => ({ slug: slug.toLowerCase(), chapter, verse }))

export function verseOfDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date - start) / 86400000)
  return DAILY[day % DAILY.length]
}
