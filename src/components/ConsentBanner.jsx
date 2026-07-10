import { useState } from 'react'
import { hasConsentChoice, setConsent } from '../lib/analytics.js'

export default function ConsentBanner({ tr }) {
  const [visible, setVisible] = useState(() => !hasConsentChoice())
  if (!visible) return null

  function choose(granted) {
    setConsent(granted)
    setVisible(false)
  }

  return (
    <div className="consent" role="dialog" aria-label={tr.consentText} aria-live="polite">
      <p className="consent-text">{tr.consentText}</p>
      <div className="consent-actions">
        <button className="consent-decline" onClick={() => choose(false)}>{tr.decline}</button>
        <button className="consent-accept" onClick={() => choose(true)}>{tr.accept}</button>
      </div>
    </div>
  )
}
