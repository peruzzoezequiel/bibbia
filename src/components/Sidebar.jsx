import { useEffect, useState } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { normalize, loadBook } from '../lib/data.js'
import { verseOfDay } from '../lib/personal.js'

export default function Sidebar({ lang, tr, books, open, onClose, onCollapse }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [votd, setVotd] = useState(null)

  useEffect(() => {
    const vd = verseOfDay()
    let alive = true
    loadBook(lang, vd.slug).then((chs) => {
      if (!alive) return
      const text = chs?.[vd.chapter - 1]?.[vd.verse - 1]
      const book = books.find((b) => b.slug === vd.slug)
      if (text && book) setVotd({ ...vd, text, abbr: book.abbr })
    }).catch(() => {})
    return () => { alive = false }
  }, [lang, books])

  const q = normalize(query.trim())
  const filtered = books.filter((b) => normalize(b.name).includes(q))
  const vt = filtered.filter((b) => b.testament === 'VT')
  const nt = filtered.filter((b) => b.testament === 'NT')

  const renderLink = (b) => (
    <NavLink
      key={b.slug}
      to={`/${lang}/${b.slug}/1`}
      className={`book-link ${b.slug === slug ? 'active' : ''}`}
      onClick={onClose}
    >
      <span className="book-abbr">{b.abbr}</span>
      <span className="book-name">{b.name}</span>
      <span className="book-count">{b.chapters}</span>
    </NavLink>
  )

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-top">
        <span className="sidebar-title">{tr.books}</span>
        <button className="sidebar-collapse" onClick={onCollapse} title={tr.hideBooks} aria-label={tr.hideBooks}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      </div>
      {votd && (
        <button className="votd" onClick={() => { onClose(); navigate(`/${lang}/${votd.slug}/${votd.chapter}#v${votd.verse}`) }}>
          <span className="votd-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v2M18.4 5.6l-1.4 1.4M21 12h-2M5 12H3M7 7 5.6 5.6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>
            {tr.verseOfDay}
          </span>
          <span className="votd-text">{votd.text.slice(0, 110)}{votd.text.length > 110 ? '…' : ''}</span>
          <span className="votd-ref">{votd.abbr} {votd.chapter}:{votd.verse}</span>
        </button>
      )}
      <div className="sidebar-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        <input placeholder={tr.searchBook} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <nav className="book-list">
        {vt.length > 0 && <p className="book-group">{tr.ot}</p>}
        {vt.map(renderLink)}
        {nt.length > 0 && <p className="book-group">{tr.nt}</p>}
        {nt.map(renderLink)}
        {filtered.length === 0 && <p className="book-empty">{tr.nothing}</p>}
      </nav>

      <footer className="sidebar-footer">
        {tr.by}{' '}
        <a href="https://www.ezequielperuzzo.com.br" target="_blank" rel="noopener noreferrer">Ezequiel Peruzzo</a>
      </footer>
    </aside>
  )
}
