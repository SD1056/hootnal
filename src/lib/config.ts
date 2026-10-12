import type { AiSettings } from './types'

/**
 * 사이트에 기본으로 내장되는 AI 설정.
 * 값은 빌드 시 .env 의 VITE_GEMINI_API_KEY 에서 읽는다.
 * 정적 사이트라 이 키는 번들에 그대로 포함되어 방문자에게 노출되므로,
 * Google Cloud 콘솔에서 반드시 HTTP 리퍼러(웹사이트) 제한을 걸어 두어야 한다.
 */
const builtInKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
const builtInModel = (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim()

export const BUILTIN_SETTINGS: AiSettings | null = builtInKey
  ? { provider: 'gemini', apiKey: builtInKey, model: builtInModel || 'gemini-flash-latest' }
  : null
