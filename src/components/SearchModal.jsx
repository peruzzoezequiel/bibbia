import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadAll, normalize } from '../lib/data.js'

const MAX_RESULTS = 400

export default function SearchModal({ open, onClose, lang, tr }) {
  const navigate = useNavigate()
  const [flat, setFlat] = useState(null)
  const [progress, setProgress] = useState(0)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef(null)

  // (re)load the search index whenever the modal opens or the language changes
  useEffect(() => {
    if (!open) return
    setFlat(null)
    loadAll(lang, (done, total) => setProgress(Math.round((done / total) * 100))).then(setFlat)
  }, [open, lang])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 40) }, [open])
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180)
    return () => clearTimeout(t)
  }, [query])
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = normalize(debounced.trim())
    if (!flat || q.length < 2) return null
    const out = []
    for (const row of flat) {
      if (row.norm.includes(q)) {
        out.push(row)
        if (out.length >= MAX_RESULTS) break
      }
    }
    return out
  }, [flat, debounced])

  if (!open) return null

  function pick(row) {
    onClose()
    navigate(`/${lang}/${row.slug}/${row.c}#v${row.v}`)
  }

  const q = debounced.trim()

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="search-modal" role="dialog" aria-label={tr.search}>
        <div className="search-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input ref={inputRef} placeholder={tr.searchAll} value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button className="icon-btn" aria-label={tr.close} onClick={() => setQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          )}
        </div>

        <div className="search-body">
          {!flat && <p className="search-hint">{tr.preparing} {progress}%</p>}
          {flat && q.length < 2 && <p className="search-hint">{tr.searchHint}</p>}
          {flat && q.length >= 2 && results && (
            <p className="search-count">
              {results.length === 0
                ? tr.noResults
                : `${results.length}${results.length === MAX_RESULTS ? '+' : ''} ${tr.results}`}
            </p>
          )}
          {results && results.map((row, i) => (
            <button className="search-result" key={i} onClick={() => pick(row)}>
              <span className="search-ref">{row.abbr} {row.c}:{row.v}</span>
              <span className="search-snippet">{highlight(row.text, q)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function highlight(text, q) {
  const nq = normalize(q)
  const nt = normalize(text)
  const at = nt.indexOf(nq)
  if (at < 0) return text
  const ctx = 60
  const start = Math.max(0, at - ctx)
  const end = Math.min(text.length, at + nq.length + ctx)
  const pre = (start > 0 ? '… ' : '') + text.slice(start, at)
  const mid = text.slice(at, at + nq.length)
  const post = text.slice(at + nq.length, end) + (end < text.length ? ' …' : '')
  return <>{pre}<mark>{mid}</mark>{post}</>
}
