// Inventário de resíduos arcaicos no NT da pt-bkj (grupos latinos, apóstrofos, acentos)
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve(import.meta.dirname, '..', 'public', 'data', 'pt-bkj')
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'))
let all = ''
for (const b of idx.filter((b) => b.testament === 'NT')) {
  all += JSON.parse(fs.readFileSync(path.join(DIR, `${b.slug}.json`), 'utf8')).flat().join(' ') + ' '
}

const freq = {}
for (const w of all.split(/[^A-Za-zÀ-ÿ'’]+/)) {
  if (!w) continue
  if (/[aeiou](pt|ct)[aeiour]|sanct|bapt|scri?pt|mn/i.test(w)) freq[w] = (freq[w] || 0) + 1
}
console.log('=== grupos latinos (ct/pt/mn) ===')
console.log(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([w, c]) => `${w}:${c}`).join('  '))

const ap = {}
for (const m of all.match(/[A-Za-zÀ-ÿ]*['’][A-Za-zÀ-ÿ]+/g) || []) ap[m] = (ap[m] || 0) + 1
console.log('=== apóstrofos ===')
console.log(Object.entries(ap).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w, c]) => `${w}:${c}`).join('  '))

const acc = 'espirito espiritos discipulo discipulos unigenito gloria glorias misericordia seculo seculos juizo sabio sabios proprio propria ultimo unico publico publicos cantico canticos impio impios exercito exercitos principe principes apostolo apostolos parabola parabolas tunica tunicas patria historia proximo duvida paraiso victoria'.split(' ')
const found = []
for (const w of acc) {
  const c = (all.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length
  if (c) found.push(`${w}:${c}`)
}
console.log('=== sem acento (lista conhecida) ===')
console.log(found.join('  '))
