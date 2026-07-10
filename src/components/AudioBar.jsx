import { useState } from 'react'

export default function AudioBar({ audio, tr, verses, lang, book, chapter }) {
  const { supported, status, rate, changeRate } = audio
  const [dl, setDl] = useState('') // '', 'loading', 'missing'

  if (!supported) {
    return <div className="audiobar"><span className="audio-note">{tr.notSupported}</span></div>
  }

  const playing = status === 'playing'
  const paused = status === 'paused'

  function toggle() {
    if (playing) audio.pause()
    else if (paused) audio.resume()
    else audio.play(verses, 0)
  }

  async function download() {
    setDl('loading')
    const base = import.meta.env.BASE_URL || '/'
    // prefer .mp3 (cloud TTS) then .m4a (macOS say); guard against SPA fallback.
    let res, ext, ok = false
    for (ext of ['mp3', 'm4a']) {
      res = await fetch(`${base}audio/${lang}/${book.slug}/${chapter}.${ext}`)
      const type = res.headers.get('content-type') || ''
      if (res.ok && /audio|mpeg|mp4|octet-stream/.test(type)) { ok = true; break }
    }
    try {
      if (!ok) throw new Error('404')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${book.abbr}-${chapter}.${ext}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(a.href)
      setDl('')
    } catch {
      setDl('missing')
    }
  }

  return (
    <div className="audiobar">
      <button className={`audio-play ${playing ? 'on' : ''}`} onClick={toggle}
        aria-label={playing ? tr.pause : tr.listen}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
        <span>{playing ? tr.pause : paused ? tr.resume : tr.listen}</span>
      </button>

      {(playing || paused) && (
        <button className="audio-stop" onClick={audio.stop} aria-label={tr.stop}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        </button>
      )}

      <div className="audio-rate" role="group" aria-label="Velocidade">
        {[0.75, 1, 1.25, 1.5].map((r) => (
          <button key={r} className={rate === r ? 'on' : ''} onClick={() => changeRate(r)}>{r}×</button>
        ))}
      </div>

      <div className="audio-spacer" />

      <button className="audio-dl" onClick={download} disabled={dl === 'loading'} title={tr.download}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>
        </svg>
        {dl === 'loading' ? tr.downloading : tr.download}
      </button>

      {dl === 'missing' && <span className="audio-note">{tr.noAudio}</span>}
    </div>
  )
}
