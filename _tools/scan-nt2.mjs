// Segundo inventário: h intervocálico, plurais -aes, -avel/-ivel, e retardatários
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.resolve(import.meta.dirname, '..', 'public', 'data', 'pt-bkj')
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'))
let all = ''
for (const b of idx.filter((b) => b.testament === 'NT')) {
  all += JSON.parse(fs.readFileSync(path.join(DIR, `${b.slug}.json`), 'utf8')).flat().join(' ') + ' '
}

function freqOf(re) {
  const f = {}
  for (const w of all.split(/[^A-Za-zÀ-ÿ'’]+/)) {
    if (w && re.test(w)) f[w] = (f[w] || 0) + 1
  }
  return Object.entries(f).sort((a, b) => b[1] - a[1])
}

console.log('=== h intervocálico (sahia, cahiu…) ===')
console.log(freqOf(/[aeiou]h[aeiou]/i).slice(0, 30).map(([w, c]) => `${w}:${c}`).join('  '))

console.log('\n=== plural -aes (quaes, taes…) ===')
console.log(freqOf(/aes$/).slice(0, 30).map(([w, c]) => `${w}:${c}`).join('  '))

console.log('\n=== -avel/-ivel/-aveis/-iveis sem acento ===')
console.log(freqOf(/(avel|ivel|aveis|iveis)$/).slice(0, 30).map(([w, c]) => `${w}:${c}`).join('  '))

console.log('\n=== retardatários (bytes) ===')
for (const w of ['Bethfage', 'Genezareth', 'berylo', 'áquele', 'áqueles', 'áquela']) {
  const m = all.match(new RegExp(`.{0,25}${w}.{0,25}`, 'g'))
  if (m) console.log(`${w}: ${m.length}x  ex: "${m[0]}"`)
}