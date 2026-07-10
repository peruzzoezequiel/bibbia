// Gera os arquivos de áudio (.m4a) que o botão "Baixar" do site consome.
// Narração com o texto EXATO de public/data/<lang> (100% fiel).
//
// Padrão: usa o comando `say` do macOS (offline, grátis, voz pt-BR).
// Versões: bkj (padrão), livre, almeida, livretr.
//   node _tools/gen-audio.mjs bkj             # Bíblia inteira (King James 1611)
//   node _tools/gen-audio.mjs livre joao      # só João, na Bíblia Livre
//   node _tools/gen-audio.mjs almeida joao 3  # só João 3, na Almeida
//   VOICE=Reed node _tools/gen-audio.mjs bkj  # força a voz (say -v '?' lista)
//
// Alternativa em nuvem (melhor qualidade): defina OPENAI_API_KEY para usar a
// OpenAI TTS em vez do `say` (gera .mp3). Ajuste synthOpenAI() para outro provedor.
//
// Saída: public/audio/<lang>/<slug>/<capitulo>.<ext>

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const pexec = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '..')

const KEY = process.env.OPENAI_API_KEY
const EXT = KEY ? 'mp3' : 'm4a'

// combinações idioma-versão; a voz do `say` é escolhida pelo idioma
const VERSIONS = ['pt-bkj', 'pt-livretr', 'pt-almeida', 'pt-livre', 'en-kjv', 'es-rv1909', 'it-diodati', 'fr-martin', 'fr-segond']
const DEFAULT_VOICE = { pt: 'Luciana', en: 'Samantha', es: 'Monica', it: 'Alice', fr: 'Thomas' }
const LANG = VERSIONS.includes(process.argv[2]) ? process.argv[2] : 'pt-bkj'
const VOICE = process.env.VOICE || DEFAULT_VOICE[LANG.split('-')[0]] || 'Samantha'
const DATA = path.join(ROOT, 'public', 'data', LANG)
const OUT = path.join(ROOT, 'public', 'audio', LANG)

async function synthSay(text, dest) {
  const tmp = path.join(os.tmpdir(), `biblia-${Date.now()}.txt`)
  fs.writeFileSync(tmp, text)
  try {
    await pexec('say', ['-v', VOICE, '-f', tmp, '-o', dest, '--data-format=aac'])
  } finally {
    fs.rmSync(tmp, { force: true })
  }
  return fs.statSync(dest).size
}

async function synthOpenAI(text, dest) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.TTS_VOICE || 'onyx',
      input: text, response_format: 'mp3',
    }),
  })
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return buf.length
}

const synth = KEY ? synthOpenAI : synthSay

const index = JSON.parse(fs.readFileSync(path.join(DATA, 'index.json'), 'utf8'))
const [onlySlug, onlyChap] = process.argv.slice(3)
console.log(`Idioma: ${LANG} · Motor: ${KEY ? 'OpenAI TTS' : `macOS say (voz ${VOICE})`} · saída .${EXT}`)

let count = 0
for (const book of index) {
  if (onlySlug && book.slug !== onlySlug) continue
  const chapters = JSON.parse(fs.readFileSync(path.join(DATA, `${book.slug}.json`), 'utf8'))
  fs.mkdirSync(path.join(OUT, book.slug), { recursive: true })
  for (let c = 0; c < chapters.length; c++) {
    const chapNum = c + 1
    if (onlyChap && Number(onlyChap) !== chapNum) continue
    const dest = path.join(OUT, book.slug, `${chapNum}.${EXT}`)
    if (fs.existsSync(dest)) { console.log('· existe:', book.slug, chapNum); continue }
    const text = chapters[c].join(' ')
    process.stdout.write(`gerando ${book.name} ${chapNum}… `)
    try {
      const size = await synth(text, dest)
      console.log(`ok (${(size / 1024).toFixed(0)} KB)`)
      count++
    } catch (e) {
      console.log('ERRO:', e.message)
    }
  }
}
console.log(`Concluído. ${count} arquivo(s) gerado(s).`)
