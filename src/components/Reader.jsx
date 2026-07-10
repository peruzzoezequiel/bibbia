import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadBook, copyText } from '../lib/data.js'
import { setChapterSeo } from '../lib/seo.js'
import { LANGS, LANGUAGES, langOf, versionLabel, compareOptions } from '../lib/i18n.js'
import { setLast, getFavorites, toggleFavorite, favKey } from '../lib/personal.js'
import { resolveTheme } from '../lib/useSettings.js'
import { makeVerseCard } from '../lib/verseCard.js'
import { useAudio } from '../lib/useAudio.js'
import AudioBar from './AudioBar.jsx'

export default function Reader({ lang, tr, book, books, chapter, settings, update }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [verses, setVerses] = useState(null)
  const [cmpVerses, setCmpVerses] = useState(null)
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(-1)
  const [selected, setSelected] = useState(-1)
  const [favs, setFavs] = useState(() => new Set())
  const scrollRef = useRef(null)
  const audio = useAudio(LANGS[lang].speech)

  const chapterCount = book.chapters
  const safeChapter = Math.min(Math.max(1, chapter), chapterCount)
  const version = versionLabel(lang, book.testament)
  const cmpLang = settings.compareLang && compareOptions(lang).includes(settings.compareLang) ? settings.compareLang : null

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadBook(lang, book.slug).then((data) => {
      if (!alive) return
      const v = data[safeChapter - 1] || []
      setVerses(v)
      setLoading(false)
      setChapterSeo({ lang, book, chapter: safeChapter, verses: v, version })
    })
    setLast({ lang, slug: book.slug, chapter: safeChapter })
    return () => { alive = false }
  }, [lang, book.slug, safeChapter])

  // secondary translation for side-by-side comparison
  useEffect(() => {
    if (!cmpLang) { setCmpVerses(null); return }
    let alive = true
    loadBook(cmpLang, book.slug).then((data) => {
      if (alive) setCmpVerses(data[safeChapter - 1] || [])
    }).catch(() => { if (alive) setCmpVerses([]) })
    return () => { alive = false }
  }, [cmpLang, book.slug, safeChapter])

  // which verses of this chapter are bookmarked
  useEffect(() => {
    const set = new Set(
      getFavorites()
        .filter((e) => e.lang === lang && e.slug === book.slug && e.chapter === safeChapter)
        .map((e) => e.verse)
    )
    setFavs(set)
  }, [lang, book.slug, safeChapter])

  function onToggleFav(verseNumber, text) {
    toggleFavorite({ lang, slug: book.slug, abbr: book.abbr, chapter: safeChapter, verse: verseNumber, text })
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(verseNumber)) next.delete(verseNumber)
      else next.add(verseNumber)
      return next
    })
  }

  useEffect(() => {
    if (scrollRef.current && !location.hash) scrollRef.current.scrollTo({ top: 0 })
    audio.stop()
    setSelected(-1)
  }, [lang, book.slug, safeChapter])

  useEffect(() => {
    const m = location.hash.match(/^#v(\d+)$/)
    if (!m || loading) return
    const idx = Number(m[1]) - 1
    setTarget(idx)
    const el = document.getElementById(`v-${idx}`)
    if (el) el.scrollIntoView({ block: 'center' })
    const t = setTimeout(() => setTarget(-1), 2600)
    return () => clearTimeout(t)
  }, [location.hash, loading, safeChapter, book.slug])

  useEffect(() => {
    if (audio.active < 0) return
    const el = document.getElementById(`v-${audio.active}`)
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [audio.active])

  const bookIdx = books.findIndex((b) => b.slug === book.slug)
  function go(dir) {
    let bi = bookIdx
    let ch = safeChapter + dir
    if (ch < 1) {
      bi = bi - 1 < 0 ? books.length - 1 : bi - 1
      ch = books[bi].chapters
    } else if (ch > chapterCount) {
      bi = bi + 1 >= books.length ? 0 : bi + 1
      ch = 1
    }
    navigate(`/${lang}/${books[bi].slug}/${ch}`)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const prevBook = books[bookIdx - 1] || books[books.length - 1]
  const nextBook = books[bookIdx + 1] || books[0]
  const prevLabel = safeChapter > 1 ? `${book.abbr} ${safeChapter - 1}` : `${prevBook.abbr} ${prevBook.chapters}`
  const nextLabel = safeChapter < chapterCount ? `${book.abbr} ${safeChapter + 1}` : `${nextBook.abbr} 1`

  return (
    <div className="reader" ref={scrollRef}>
      <ChapterStrip
        lang={lang} book={book} current={safeChapter} navigate={navigate} tr={tr}
        collapsed={settings.chaptersCollapsed}
        onToggle={() => update({ chaptersCollapsed: !settings.chaptersCollapsed })}
      />

      <div className="reader-inner">
        <AudioBar audio={audio} tr={tr} verses={verses || []} lang={lang} book={book} chapter={safeChapter} />

        {cmpLang && (
          <div className="compare-bar">
            <span className="cmp-tag">{LANGUAGES[langOf(lang)].label} · {version}</span>
            <span className="cmp-vs">×</span>
            <select className="cmp-select" value={cmpLang}
              onChange={(e) => update({ compareLang: e.target.value })} aria-label={tr.compare}>
              {compareOptions(lang).map((o) => (
                <option key={o} value={o}>{LANGUAGES[langOf(o)].label} · {LANGS[o].label}</option>
              ))}
            </select>
            <button className="cmp-close icon-btn" aria-label={tr.close} onClick={() => update({ compareLang: '' })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}

        <article
          className={`chapter ${cmpLang ? 'compare' : settings.layout} ${settings.serif ? 'serif' : 'sans'}`}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          <header className="chapter-head">
            <h1>{book.name} {safeChapter}</h1>
            {!cmpLang && <span className="chapter-version">{version}</span>}
          </header>

          {loading ? (
            <div className="chapter-loading"><span /><span /><span /></div>
          ) : cmpLang ? (
            <div className="verses-compare">
              {verses.map((v, i) => (
                <div className={`cmp-row ${target === i ? 'target' : ''} ${favs.has(i + 1) ? 'fav' : ''}`} id={`v-${i}`} key={i}
                  onClick={() => setSelected(selected === i ? -1 : i)}>
                  <sup className="vnum">{i + 1}</sup>
                  <div className="cmp-col">{v}</div>
                  <div className="cmp-col cmp-col-2">{cmpVerses ? (cmpVerses[i] ?? '') : '…'}</div>
                </div>
              ))}
            </div>
          ) : settings.layout === 'paragraph' ? (
            <p className="verses-flow">
              {verses.map((v, i) => (
                <span
                  className={`verse ${audio.active === i ? 'reading' : ''} ${target === i ? 'target' : ''} ${selected === i ? 'selected' : ''} ${favs.has(i + 1) ? 'fav' : ''}`}
                  id={`v-${i}`} key={i}
                  onClick={() => setSelected(selected === i ? -1 : i)}
                >
                  <sup className="vnum">{i + 1}</sup>{v}{' '}
                </span>
              ))}
            </p>
          ) : (
            <div className="verses-lines">
              {verses.map((v, i) => (
                <p
                  className={`verse-line ${audio.active === i ? 'reading' : ''} ${target === i ? 'target' : ''} ${selected === i ? 'selected' : ''} ${favs.has(i + 1) ? 'fav' : ''}`}
                  id={`v-${i}`} key={i}
                  onClick={() => setSelected(selected === i ? -1 : i)}
                >
                  <sup className="vnum">{i + 1}</sup><span>{v}</span>
                </p>
              ))}
            </div>
          )}
        </article>

        <nav className="chapter-nav">
          <button onClick={() => go(-1)}><Arrow dir="left" /> {prevLabel}</button>
          <button onClick={() => go(1)}>{nextLabel} <Arrow dir="right" /></button>
        </nav>
      </div>

      {selected >= 0 && verses && verses[selected] && (
        <VerseActions
          lang={lang} tr={tr} book={book} chapter={safeChapter} verse={selected + 1}
          text={verses[selected]} version={version}
          isFav={favs.has(selected + 1)}
          theme={resolveTheme(settings.themeMode)}
          onToggleFav={() => onToggleFav(selected + 1, verses[selected])}
          onListen={() => audio.play(verses, selected)}
          onClose={() => setSelected(-1)}
        />
      )}
    </div>
  )
}

function VerseActions({ lang, tr, book, chapter, verse, text, version, isFav, theme, onToggleFav, onListen, onClose }) {
  const [feedback, setFeedback] = useState('')
  const ref = `${book.name} ${chapter}:${verse}`
  const fullText = `"${text}"\n— ${ref} (${version})`

  function flash(msg) {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 1600)
  }
  async function copy() {
    flash(await copyText(fullText) ? tr.copied : tr.copyFail)
  }
  async function image() {
    const blob = await makeVerseCard({ text, ref, version, theme })
    if (!blob) return
    const file = new File([blob], `${book.abbr}-${chapter}-${verse}.png`, { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: ref }) } catch { /* cancelado */ }
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = file.name
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(a.href)
    }
  }
  async function share() {
    const url = `${window.location.origin}/${lang}/${book.slug}/${chapter}#v${verse}`
    if (navigator.share) {
      try { await navigator.share({ title: ref, text: fullText, url }) } catch { /* cancelado */ }
    } else {
      flash(await copyText(`${fullText}\n${url}`) ? tr.linkCopied : tr.shareFail)
    }
  }

  return (
    <div className="verse-actions" role="dialog" aria-label={ref}>
      <span className="va-ref">{ref}</span>
      <div className="va-sep" />
      <button className={isFav ? 'va-on' : ''} onClick={onToggleFav}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 19.2l.9-5.5-4-3.9L9.5 9 12 4z"/>
        </svg>
        {isFav ? tr.saved2 : tr.save}
      </button>
      <button onClick={copy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>
        </svg>
        {tr.copy}
      </button>
      <button onClick={share}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
        </svg>
        {tr.share}
      </button>
      <button onClick={image}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-6 6"/>
        </svg>
        {tr.image}
      </button>
      <button onClick={onListen}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        {tr.listen}
      </button>
      <button className="va-close" onClick={onClose} aria-label={tr.close}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      {feedback && <span className="va-feedback">{feedback}</span>}
    </div>
  )
}

function ChapterStrip({ lang, book, current, navigate, collapsed, onToggle, tr }) {
  return (
    <div className={`chapter-strip ${collapsed ? 'collapsed' : ''}`}>
      <button className="cs-toggle" onClick={onToggle} aria-expanded={!collapsed} title={tr.chapters}>
        <span className="cs-label">{tr.chapters}</span>
        <span className="cs-current">{current}</span>
        <svg className="cs-chev" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {!collapsed && (
        <div className="chapter-chips">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`chip ${n === current ? 'active' : ''}`}
              onClick={() => navigate(`/${lang}/${book.slug}/${n}`)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Arrow({ dir }) {
  const d = dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
