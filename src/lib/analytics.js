// Google Analytics 4 com Consent Mode v2 (LGPD/GDPR).
// Defina seu ID de medição aqui ou via a variável VITE_GA_ID no deploy.
const GA_ID = import.meta.env.VITE_GA_ID || 'G-XXXXXXXXXX'
const CONSENT_KEY = 'biblia-consent'

let started = false

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments) }
}

export function hasConsentChoice() {
  return localStorage.getItem(CONSENT_KEY) != null
}

export function initAnalytics() {
  if (started) return
  if (!import.meta.env.PROD) return            // não roda em desenvolvimento
  if (!GA_ID || GA_ID.includes('XXXX')) return // sem ID configurado
  started = true

  ensureGtag()
  // Consent Mode: tudo NEGADO por padrão até o usuário aceitar (sem cookies antes disso)
  const granted = localStorage.getItem(CONSENT_KEY) === 'granted'
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    wait_for_update: 500,
  })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  window.gtag('js', new Date())
  // SPA: page_view manual por rota
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })
}

// registra a escolha do usuário e atualiza o consentimento do GA
export function setConsent(granted) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
  ensureGtag()
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  })
}

export function trackPageView(path) {
  if (!started || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}
