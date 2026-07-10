import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { loadIndex } from './lib/data.js'
import { useSettings } from './lib/useSettings.js'
import { getLast } from './lib/personal.js'
import { initAnalytics, trackPageView } from './lib/analytics.js'
import { LANGS, DEFAULT_LANG, isLang, t } from './lib/i18n.js'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import Reader from './components/Reader.jsx'
import Settings from './components/Settings.jsx'
import SearchModal from './components/SearchModal.jsx'
import FavoritesModal from './components/FavoritesModal.jsx'
import ConsentBanner from './components/ConsentBanner.jsx'
import './App.css'

function storedLang() {
  const saved = localStorage.getItem('biblia-lang')
  if (isLang(saved)) return saved
  const nav = (navigator.language || '').slice(0, 2)
  return isLang(nav) ? nav : DEFAULT_LANG
}

// Root: resume the last read position, or fall back to Genesis 1.
function rootTarget() {
  const last = getLast()
  if (last && isLang(last.lang) && last.slug && last.chapter) {
    return `/${last.lang}/${last.slug}/${last.chapter}`
  }
  return `/${storedLang()}/genesis/1`
}

export default function App() {
  const [settings, update] = useSettings()
  const location = useLocation()

  useEffect(() => { initAnalytics() }, [])
  // register each chapter/route change as a page view (after the title updates)
  useEffect(() => {
    const id = setTimeout(() => trackPageView(location.pathname), 80)
    return () => clearTimeout(id)
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<Navigate to={rootTarget()} replace />} />
      <Route path="/:lang/*" element={<Layout settings={settings} update={update} />} />
      <Route path="*" element={<Navigate to={`/${DEFAULT_LANG}/genesis/1`} replace />} />
    </Routes>
  )
}

function Layout({ settings, update }) {
  const { lang } = useParams()
  const [books, setBooks] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('biblia-sidebar') === 'hidden')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)

  // On desktop the menu button collapses the in-flow sidebar (immersive reading);
  // on mobile it opens the off-canvas overlay.
  function toggleSidebar() {
    if (window.innerWidth > 820) {
      setCollapsed((c) => {
        const next = !c
        localStorage.setItem('biblia-sidebar', next ? 'hidden' : 'shown')
        return next
      })
    } else {
      setSidebarOpen((v) => !v)
    }
  }

  useEffect(() => {
    if (!isLang(lang)) return
    localStorage.setItem('biblia-lang', lang)
    document.documentElement.setAttribute('lang', LANGS[lang].htmlLang)
    setBooks(null)
    loadIndex(lang).then(setBooks)
  }, [lang])

  if (!isLang(lang)) return <Navigate to={`/${DEFAULT_LANG}/genesis/1`} replace />
  if (!books) return <div className="boot">…</div>

  const tr = t(lang)

  return (
    <div className={`app ${collapsed ? 'nav-collapsed' : ''}`}>
      <TopBar
        lang={lang} tr={tr} collapsed={collapsed}
        onToggleSidebar={toggleSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenFavorites={() => setFavoritesOpen(true)}
        settings={settings} update={update}
      />
      <div className="body">
        <Sidebar
          lang={lang} tr={tr} books={books}
          open={sidebarOpen} onClose={() => setSidebarOpen(false)}
          onCollapse={toggleSidebar}
        />
        <main className="main">
          <Routes>
            <Route path=":slug/:chapter" element={<ReaderRoute lang={lang} tr={tr} books={books} settings={settings} update={update} />} />
            <Route path="*" element={<Navigate to="genesis/1" replace />} />
          </Routes>
        </main>
      </div>
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}
      {collapsed && (
        <button className="rail-reopen" onClick={toggleSidebar} title={tr.showBooks} aria-label={tr.showBooks}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      )}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} tr={tr} settings={settings} update={update} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} tr={tr} />
      <FavoritesModal open={favoritesOpen} onClose={() => setFavoritesOpen(false)} lang={lang} tr={tr} />
      <ConsentBanner tr={tr} />
    </div>
  )
}

function ReaderRoute({ lang, tr, books, settings, update }) {
  const { slug, chapter } = useParams()
  const book = books.find((b) => b.slug === slug)
  if (!book) return <Navigate to="genesis/1" replace />
  return <Reader lang={lang} tr={tr} book={book} books={books} chapter={Number(chapter)} settings={settings} update={update} />
}
