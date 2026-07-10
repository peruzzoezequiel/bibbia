import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavorites, removeFavorite, favKey } from '../lib/personal.js'
import { LANGS } from '../lib/i18n.js'

export default function FavoritesModal({ open, onClose, lang, tr }) {
  const navigate = useNavigate()
  const [list, setList] = useState([])

  useEffect(() => { if (open) setList(getFavorites()) }, [open])
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function pick(e) {
    onClose()
    navigate(`/${e.lang}/${e.slug}/${e.chapter}#v${e.verse}`)
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="search-modal" role="dialog" aria-label={tr.favorites}>
        <div className="search-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.8l1.1-6.5L2.6 9.8l6.5-.9L12 3z"/>
          </svg>
          <span style={{ flex: 1, fontWeight: 500, fontSize: 15 }}>{tr.favorites}</span>
          <button className="icon-btn" aria-label={tr.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="search-body">
          {list.length === 0 && <p className="search-hint">{tr.noFavorites}</p>}
          {list.map((e) => (
            <div className="fav-item" key={favKey(e)}>
              <button className="fav-open" onClick={() => pick(e)}>
                <span className="search-ref">{e.abbr} {e.chapter}:{e.verse}</span>
                <span className="search-snippet">{e.text.slice(0, 90)}{e.text.length > 90 ? '…' : ''}</span>
                <span className="fav-lang">{LANGS[e.lang]?.label || e.lang}</span>
              </button>
              <button className="fav-remove" aria-label={tr.remove}
                onClick={() => setList(removeFavorite(favKey(e)))}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
