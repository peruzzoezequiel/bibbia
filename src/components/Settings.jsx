export default function Settings({ open, onClose, tr, settings, update }) {
  if (!open) return null
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="settings-panel" role="dialog" aria-label={tr.settings}>
        <div className="settings-head">
          <h2>{tr.settings}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={tr.close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="settings-row">
          <label>{tr.textSize}</label>
          <div className="size-control">
            <button onClick={() => update({ fontSize: Math.max(15, settings.fontSize - 1) })}>A−</button>
            <span>{settings.fontSize}px</span>
            <button onClick={() => update({ fontSize: Math.min(28, settings.fontSize + 1) })}>A+</button>
          </div>
        </div>

        <div className="settings-row">
          <label>{tr.verseDisplay}</label>
          <div className="seg">
            <button className={settings.layout === 'paragraph' ? 'on' : ''} onClick={() => update({ layout: 'paragraph' })}>{tr.paragraph}</button>
            <button className={settings.layout === 'lines' ? 'on' : ''} onClick={() => update({ layout: 'lines' })}>{tr.perLine}</button>
          </div>
        </div>

        <div className="settings-row">
          <label>{tr.font}</label>
          <div className="seg">
            <button className={settings.serif ? 'on' : ''} onClick={() => update({ serif: true })}>{tr.serif}</button>
            <button className={!settings.serif ? 'on' : ''} onClick={() => update({ serif: false })}>{tr.sans}</button>
          </div>
        </div>

        <div className="settings-row">
          <label>{tr.theme}</label>
          <div className="seg">
            <button className={settings.themeMode === 'auto' ? 'on' : ''} onClick={() => update({ themeMode: 'auto' })}>{tr.auto}</button>
            <button className={settings.themeMode === 'light' ? 'on' : ''} onClick={() => update({ themeMode: 'light' })}>{tr.light}</button>
            <button className={settings.themeMode === 'dark' ? 'on' : ''} onClick={() => update({ themeMode: 'dark' })}>{tr.dark}</button>
          </div>
          {settings.themeMode === 'auto' && <p className="settings-hint">{tr.autoHint}</p>}
        </div>
      </div>
    </>
  )
}
