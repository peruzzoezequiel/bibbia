import { useNavigate, useLocation } from 'react-router-dom'
import { LANGS, LANGUAGES, LANGUAGE_CODES, langOf, versionsForLang, defaultForLang, compareOptions } from '../lib/i18n.js'
import { resolveTheme } from '../lib/useSettings.js'

export default function TopBar({ lang, tr, collapsed, onToggleSidebar, onOpenSettings, onOpenSearch, onOpenFavorites, settings, update }) {
  const navigate = useNavigate()
  const location = useLocation()

  const curLang = langOf(lang)
  const versions = versionsForLang(curLang)

  // path is /{selection}/{slug}/{chapter}; keep slug+chapter when the selection changes
  function goTo(selId) {
    const parts = location.pathname.split('/').filter(Boolean)
    const rest = parts.slice(1).join('/') || 'genesis/1'
    navigate(`/${selId}/${rest}`)
  }
  // switching language keeps the same tradition/version family when possible
  const switchLanguage = (code) => goTo(defaultForLang(code, LANGS[lang].family))
  const switchVersion = (selId) => goTo(selId)

  return (
    <header className="topbar">
      <button className="icon-btn" aria-label={tr.toggleBooks} title={tr.toggleBooks} onClick={onToggleSidebar}>
        {collapsed
          ? <Icon path="M9 5l7 7-7 7" />
          : <Icon path="M4 6h16M4 12h16M4 18h16" />}
      </button>

      <button className="brand" onClick={() => navigate(`/${lang}/genesis/1`)} aria-label={tr.brand}>
        <span className="brand-mark">
          <Icon path="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6v13M12 6v13M21 6v13" />
        </span>
        <span className="brand-name">{tr.brand}</span>
      </button>

      <div className="spacer" />

      <label className="lang-select" title={tr.language}>
        <Icon path="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" size={16} />
        <select value={curLang} onChange={(e) => switchLanguage(e.target.value)} aria-label={tr.language}>
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>{LANGUAGES[code].label}</option>
          ))}
        </select>
      </label>

      {versions.length > 1 && (
        <label className="lang-select only-wide" title={tr.version}>
          <Icon path="M4 5h11M4 10h11M4 15h7M17 4l3 8-3 2-3-2 3-8z" size={16} />
          <select value={lang} onChange={(e) => switchVersion(e.target.value)} aria-label={tr.version}>
            {versions.map((selId) => (
              <option key={selId} value={selId}>{LANGS[selId].label}</option>
            ))}
          </select>
        </label>
      )}

      <button className="icon-btn" aria-label={tr.search} onClick={onOpenSearch} title={tr.search}>
        <Icon path="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-5.7-5.7" />
      </button>

      <button className="icon-btn" aria-label={tr.favorites} onClick={onOpenFavorites} title={tr.favorites}>
        <Icon path="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 19.2l.9-5.5-4-3.9L9.5 9 12 4z" />
      </button>

      <button className={`icon-btn only-wide ${settings.compareLang ? 'active' : ''}`} aria-label={tr.compare} title={tr.compare}
        onClick={() => update({ compareLang: settings.compareLang ? '' : (compareOptions(lang)[0] || '') })}>
        <Icon path="M4 5h7v14H4zM13 5h7v14h-7z" />
      </button>

      <button className="icon-btn" aria-label={tr.settings} onClick={onOpenSettings} title={tr.settings}>
        <Icon path="M4 6h16M7 12h10M10 18h4" />
      </button>

      <button className="icon-btn" aria-label={tr.theme} title={tr.theme}
        onClick={() => update({ themeMode: resolveTheme(settings.themeMode) === 'dark' ? 'light' : 'dark' })}>
        {resolveTheme(settings.themeMode) === 'dark' ? (
          <Icon path="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        ) : (
          <Icon path="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </button>
    </header>
  )
}

function Icon({ path, size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}
