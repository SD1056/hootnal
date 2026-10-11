import type { AiSettings, DecisionRecord } from './types'

const SETTINGS_KEY = 'hutnal.ai-settings.v1'
const HISTORY_KEY = 'hutnal.history.v1'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadSettings(): AiSettings | null {
  const parsed = safeParse<Partial<AiSettings> | null>(localStorage.getItem(SETTINGS_KEY), null)
  if (!parsed || !parsed.apiKey || !parsed.provider || !parsed.model) return null
  return { provider: parsed.provider, apiKey: parsed.apiKey, model: parsed.model }
}

export function saveSettings(settings: AiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearSettings() {
  localStorage.removeItem(SETTINGS_KEY)
}

export function loadHistory(): DecisionRecord[] {
  const parsed = safeParse<DecisionRecord[]>(localStorage.getItem(HISTORY_KEY), [])
  return Array.isArray(parsed) ? parsed : []
}

export function saveHistory(records: DecisionRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
}

export function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
