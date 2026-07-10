import { useState, useEffect, useRef, useCallback } from 'react'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

// Ranks voices so we pick the most natural one for the given language.
// Network voices (Google) and "enhanced/premium/neural" voices sound far more
// human than the default local ones.
function scoreVoice(v, speechLang) {
  const name = (v.name || '').toLowerCase()
  const lang = (v.lang || '').toLowerCase().replace('_', '-')
  const target = speechLang.toLowerCase()
  const base = target.slice(0, 2)
  let s = 0
  if (lang === target) s += 100
  else if (lang.startsWith(base)) s += 50
  else return -1
  if (name.includes('google')) s += 60
  if (v.localService === false) s += 40
  if (/enhanced|premium|aprimorad|neural|natural|siri/.test(name)) s += 30
  return s
}

export function useAudio(speechLang = 'pt-BR') {
  const [rate, setRate] = useState(() => Number(localStorage.getItem('biblia-rate')) || 1)
  const [status, setStatus] = useState('idle') // 'idle' | 'playing' | 'paused'
  const [active, setActive] = useState(-1)

  const versesRef = useRef([])
  const idxRef = useRef(0)
  const cancelledRef = useRef(false)
  const rateRef = useRef(rate)
  const bestVoiceRef = useRef(null)
  const langRef = useRef(speechLang)
  useEffect(() => { rateRef.current = rate }, [rate])
  useEffect(() => { langRef.current = speechLang }, [speechLang])

  // choose the most natural voice available for the current language
  useEffect(() => {
    if (!synth) return
    const pick = () => {
      const all = synth.getVoices()
      let best = null, bestScore = -1
      for (const v of all) {
        const sc = scoreVoice(v, speechLang)
        if (sc > bestScore) { best = v; bestScore = sc }
      }
      bestVoiceRef.current = best
    }
    pick()
    synth.addEventListener('voiceschanged', pick)
    return () => synth.removeEventListener('voiceschanged', pick)
  }, [speechLang])

  // Chrome pauses synthesis after ~15s; keep it alive.
  useEffect(() => {
    if (status !== 'playing' || !synth) return
    const t = setInterval(() => {
      if (synth.speaking && !synth.paused) { synth.pause(); synth.resume() }
    }, 9000)
    return () => clearInterval(t)
  }, [status])

  const speakFrom = useCallback((i) => {
    if (!synth) return
    const verses = versesRef.current
    if (i >= verses.length) { setStatus('idle'); setActive(-1); return }
    idxRef.current = i
    setActive(i)
    const u = new SpeechSynthesisUtterance(verses[i])
    const v = bestVoiceRef.current
    if (v) { u.voice = v; u.lang = v.lang }
    else u.lang = langRef.current
    u.rate = rateRef.current
    u.pitch = 1
    u.onend = () => { if (!cancelledRef.current) speakFrom(i + 1) }
    u.onerror = () => { if (!cancelledRef.current) speakFrom(i + 1) }
    synth.speak(u)
  }, [])

  const play = useCallback((verses, from = 0) => {
    if (!synth) return
    cancelledRef.current = true
    synth.cancel()
    versesRef.current = verses
    setStatus('playing')
    setTimeout(() => { cancelledRef.current = false; speakFrom(from) }, 80)
  }, [speakFrom])

  const pause = useCallback(() => {
    if (synth && synth.speaking) { synth.pause(); setStatus('paused') }
  }, [])

  const resume = useCallback(() => {
    if (synth && synth.paused) { synth.resume(); setStatus('playing') }
  }, [])

  const stop = useCallback(() => {
    if (!synth) return
    cancelledRef.current = true
    synth.cancel()
    setStatus('idle')
    setActive(-1)
  }, [])

  const changeRate = useCallback((r) => {
    rateRef.current = r
    setRate(r)
    localStorage.setItem('biblia-rate', String(r))
    if (status === 'playing') play(versesRef.current, idxRef.current)
  }, [status, play])

  useEffect(() => () => { if (synth) { cancelledRef.current = true; synth.cancel() } }, [])

  return {
    supported: !!synth,
    rate, changeRate,
    status, active,
    play, pause, resume, stop,
  }
}
