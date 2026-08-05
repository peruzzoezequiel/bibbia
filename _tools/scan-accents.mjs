// Lista palavras do NT pt-bkj terminadas em -io/-ia/-ncia etc. (candidatas a acento)
// e alguns homógrafos de risco, com frequências, para curadoria manual.
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve(import.meta.dirname, '..', 'public', 'data', 'pt-bkj')
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'))
let all = ''
for (const b of idx.filter((b) => b.testament === 'NT')) {
  all += JSON.parse(fs.readFileSync(path.join(DIR, `${b.slug}.json`), 'utf8')).flat().join(' ') + ' '
}

const freq = {}
for (const w of all.split(/[^A-Za-zÀ-ÿ]+/)) {
  if (!w || /[áéíóúâêôãõà]/.test(w)) continue // já acentuada
  if (/(io|ia|ios|ias)$/.test(w) && w.length > 4) freq[w] = (freq[w] || 0) + 1
}
console.log('=== terminadas em -io/-ia sem acento (curadoria: acentuar ou não) ===')
console.log(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 90).map(([w, c]) => `${w}:${c}`).join('  '))

console.log('\n=== homógrafos / casos de risco (com contexto) ===')
for (const word of ['gloria', 'duvida', 'amem', 'Amem', 'porem', 'convem', 'contem', 'mantem', 'detem', 'provem']) {
  const re = new RegExp(`(?:[A-Za-zÀ-ÿ,;:]+ ){0,2}\\b${word}\\b(?: [A-Za-zÀ-ÿ,;:.]+){0,2}`, 'g')
  const ms = (all.match(re) || [])
  console.log(`${word} (${ms.length}): ${ms.slice(0, 5).join(' | ')}`)
}

console.log('\n=== outras sem acento (lista estendida) ===')
const list = 'sabados arvore arvores idolo idolos lampada lampadas calice epistola epistolas ministerio adulterio adulterios sacrificio sacrificios demonio demonios necessario necessarios voluntario salario denario denarios imperio premio proposito adversario adversarios contrario memoria ciencia consciencia paciencia obediencia desobediencia prudencia abundancia Cesar Cornelio diacono diaconos benção bencão convem alias'.split(' ')
const out = []
for (const w of list) {
  const c = (all.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length
  if (c) out.push(`${w}:${c}`)
}
console.log(out.join('  '))
