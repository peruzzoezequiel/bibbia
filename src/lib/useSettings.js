import { useState, useEffect, useCallback } from 'react'

const KEY = 'biblia-settings'

const defaults = {
  themeMode: 'auto',   // 'auto' | 'light' | 'dark'
  fontSize: 19,        // px
  layout: 'paragraph', // 'paragraph' | 'lines'
  serif: true,
  compareLang: '',     // '' = off, else a language code shown side by side
}

// Daytime (06:00–17:59) → light, otherwise dark.
export function themeForHour(hour = new Date().getHours()) {
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

export function resolveTheme(mode) {
  return mode === 'auto' ? themeForHour() : mode
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    // migra a chave antiga `theme` (light/dark) para `themeMode`
    if (saved.theme && !saved.themeMode) saved.themeMode = saved.theme
    return { ...defaults, ...saved }
  } catch {
    return { ...defaults }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(read)

  // persist + apply the resolved theme
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
    document.documentElement.setAttribute('data-theme', resolveTheme(settings.themeMode))
  }, [settings])

  // when on auto, re-check the clock every minute so it flips at dawn/dusk
  useEffect(() => {
    if (settings.themeMode !== 'auto') return
    const tick = () => document.documentElement.setAttribute('data-theme', themeForHour())
    const id = setInterval(tick, 60 * 1000)
    return () => clearInterval(id)
  }, [settings.themeMode])

  const update = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return [settings, update]
}
