import { formatHours, formatKrw } from './finance'
import type { AiSettings, Analysis, FinanceFacts, Provider, PurchaseInput, Verdict } from './types'

export const PROVIDERS: { value: Provider; label: string; defaultModel: string; keyHint: string }[] = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', keyHint: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-4-5', keyHint: 'sk-ant-...' },
  { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-flash-latest', keyHint: 'AIza...' },
]

export function defaultModelFor(provider: Provider) {
  return PROVIDERS.find((p) => p.value === provider)!.defaultModel
}

const CATEGORY_LABEL: Record<PurchaseInput['category'], string> = {
  electronics: '전자기기',
  fashion: '패션/의류',
  food: '식비/카페',
  hobby: '취미/여가',
  home: '생활/인테리어',
  beauty: '뷰티/건강',
  education: '교육/자기계발',
  transport: '교통/차량',
  subscription: '구독 서비스',
  other: '기타',
}

const URGENCY_LABEL: Record<PurchaseInput['urgency'], string> = {
  need: '꼭 필요함 (없으면 생활이나 일에 지장)',
  useful: '있으면 유용함',
  want: '갖고 싶음',
  impulse: '방금 꽂힘 (충동)',
}

const SYSTEM_PROMPT = `당신은 "훗날"이라는 합리적 소비 권장 서비스의 재무 코치입니다.
사용자가 사려는 물건과 가격, 상황을 보고 이 소비가 합리적인지 판단하고, 세 가지 미래를 구체적으로 보여줍니다.

원칙:
- 훈계하지 말고, 숫자와 구체적 장면으로 설득하세요. 따뜻하지만 솔직하게.
- 무조건 아끼라고 하지 마세요. 꼭 필요하고 가치 있는 소비라면 분명하게 "사세요"라고 말하세요.
- 제공된 계산 결과(노동 시간 환산, 복리 미래가치, 1회 사용당 비용)를 반드시 활용하세요. 숫자를 새로 지어내지 마세요.
- 모든 문장은 한국어 존댓말, 각 포인트는 1~2문장으로 짧게.
- 반드시 아래 JSON 스키마만 출력하세요. 마크다운 코드블록이나 설명 없이 JSON 객체 하나만 출력합니다.

{
  "verdict": "buy" | "wait" | "save",
  "score": 0~100 사이 정수 (높을수록 합리적인 소비),
  "headline": "한 줄 결론 (물건 이름 포함, 25자 내외)",
  "summary": "결론의 핵심 근거 2~3문장",
  "ifBuy": { "title": "샀을 때의 훗날", "points": ["...", "...", "..."] },
  "ifSave": { "title": "아꼈을 때의 훗날", "points": ["...", "...", "..."] },
  "ifNotSave": { "title": "아끼지 않았을 때의 훗날", "points": ["...", "...", "..."] },
  "alternatives": ["더 합리적인 대안 2~3개"],
  "questions": ["결정 전에 스스로에게 물어볼 질문 3개"]
}

verdict 기준:
- buy: 필요성이 분명하고 가격 대비 효용이 높음. score 65 이상.
- wait: 가치는 있으나 지금 당장 살 이유가 약함. 7일 냉각기를 권장. score 40~64.
- save: 충동적이거나 소득 대비 과하거나 중복 소비. score 39 이하.`

function buildUserPrompt(input: PurchaseInput, facts: FinanceFacts) {
  const lines = [
    `물건: ${input.item}`,
    `가격: ${formatKrw(input.price)}`,
    `카테고리: ${CATEGORY_LABEL[input.category]}`,
    `필요도: ${URGENCY_LABEL[input.urgency]}`,
    `예상 사용: 월 ${input.usesPerMonth}회 × ${input.yearsOfUse}년 = 총 ${facts.totalUses}회`,
    `비슷한 물건 보유 여부: ${input.alreadyOwnSimilar ? '이미 있음' : '없음'}`,
    input.monthlyIncome ? `월 가처분 소득: ${formatKrw(input.monthlyIncome)}` : '월 가처분 소득: 미입력',
    input.reason.trim() ? `사고 싶은 이유/상황: ${input.reason.trim()}` : '사고 싶은 이유/상황: 미입력',
    '',
    '[미리 계산된 수치 — 그대로 인용하세요]',
    `- 1회 사용당 비용: ${formatKrw(facts.costPerUse)}`,
    facts.workHours !== null
      ? `- 노동 시간 환산: ${formatHours(facts.workHours)} (시급 ${formatKrw(facts.hourlyWage!)})`
      : '- 노동 시간 환산: 소득 미입력으로 계산 불가',
    facts.incomeRatio !== null ? `- 월 소득 대비 비중: ${(facts.incomeRatio * 100).toFixed(1)}%` : '',
    `- 이 돈을 연 ${Math.round(facts.annualRate * 100)}%로 굴렸을 때: ${facts.futureValues
      .map((f) => `${f.years}년 뒤 ${formatKrw(f.value)}`)
      .join(', ')}`,
    `- 같은 소비가 매달 반복될 때: 1년 ${formatKrw(facts.habitYearly)}, 10년 ${formatKrw(facts.habitTenYears)}, 매달 적립 투자했다면 10년 뒤 ${formatKrw(facts.habitTenYearsInvested)}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export class AiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AiError'
    this.status = status
  }
}

async function callOpenAI(settings: AiSettings, system: string, user: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new AiError(await readError(res), res.status)
  const data = await res.json()
  return data.choices?.[0]?.message?.content as string | undefined
}

async function callAnthropic(settings: AiSettings, system: string, user: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 2048,
      temperature: 0.6,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new AiError(await readError(res), res.status)
  const data = await res.json()
  const block = Array.isArray(data.content) ? data.content.find((c: { type: string }) => c.type === 'text') : null
  return block?.text as string | undefined
}

async function callGemini(settings: AiSettings, system: string, user: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': settings.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new AiError(await readError(res), res.status)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') as
    string | undefined
}

async function readError(res: Response) {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error?.message ?? body?.message ?? JSON.stringify(body)
  } catch {
    detail = await res.text().catch(() => '')
  }
  if (res.status === 401 || res.status === 403) return `API 키가 올바르지 않거나 권한이 없어요. (${res.status})`
  if (res.status === 404) return `모델 이름을 찾을 수 없어요. 설정에서 모델명을 확인해 주세요. (${detail})`
  if (res.status === 429) return '요청 한도를 초과했어요. 잠시 후 다시 시도해 주세요.'
  if (res.status === 503 || res.status === 529) return 'AI 서버가 지금 많이 붐벼요. 잠시 후 다시 시도해 주세요.'
  return `AI 요청에 실패했어요. (${res.status}) ${detail}`.trim()
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1))
    throw new AiError('AI 응답을 해석하지 못했어요. 다시 시도해 주세요.')
  }
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

function asScenario(value: unknown, title: string) {
  const obj = (value ?? {}) as { title?: unknown; points?: unknown }
  return {
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title : title,
    points: asStringArray(obj.points),
  }
}

function normalize(raw: unknown, settings: AiSettings): Analysis {
  const obj = (raw ?? {}) as Record<string, unknown>
  const verdictRaw = String(obj.verdict ?? '').toLowerCase()
  const verdict: Verdict = verdictRaw === 'buy' || verdictRaw === 'wait' || verdictRaw === 'save' ? verdictRaw : 'wait'
  const scoreNum = Number(obj.score)
  const score = Number.isFinite(scoreNum)
    ? Math.max(0, Math.min(100, Math.round(scoreNum)))
    : verdict === 'buy'
      ? 70
      : verdict === 'wait'
        ? 50
        : 30

  return {
    verdict,
    score,
    headline: typeof obj.headline === 'string' ? obj.headline : '분석 결과',
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    ifBuy: asScenario(obj.ifBuy, '샀을 때의 훗날'),
    ifSave: asScenario(obj.ifSave, '아꼈을 때의 훗날'),
    ifNotSave: asScenario(obj.ifNotSave, '아끼지 않았을 때의 훗날'),
    alternatives: asStringArray(obj.alternatives),
    questions: asStringArray(obj.questions),
    source: 'ai',
    model: settings.model,
  }
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 529])
const RETRY_DELAYS_MS = [1200, 2500]

/** 과부하 시 같은 제공사의 더 가벼운 모델로 한 번 더 시도한다. */
const FALLBACK_MODEL: Partial<Record<Provider, Record<string, string>>> = {
  gemini: {
    'gemini-flash-latest': 'gemini-flash-lite-latest',
    'gemini-2.5-flash': 'gemini-2.5-flash-lite',
  },
  openai: {
    'gpt-4o': 'gpt-4o-mini',
  },
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function callProvider(settings: AiSettings, system: string, user: string) {
  try {
    if (settings.provider === 'openai') return await callOpenAI(settings, system, user)
    if (settings.provider === 'anthropic') return await callAnthropic(settings, system, user)
    return await callGemini(settings, system, user)
  } catch (err) {
    if (err instanceof AiError) throw err
    throw new AiError('AI 서버에 연결하지 못했어요. 네트워크 상태나 브라우저의 광고 차단 확장을 확인해 주세요.')
  }
}

/**
 * 일시적 오류(과부하, 한도 초과, 5xx)는 짧게 기다렸다가 재시도하고,
 * 그래도 안 되면 대체 모델로 마지막 한 번을 더 시도한다.
 * 반환값에는 실제로 응답한 모델명이 담긴다.
 */
async function callWithRetry(
  settings: AiSettings,
  system: string,
  user: string,
): Promise<{ text: string | undefined; model: string }> {
  let lastError: AiError | undefined
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return { text: await callProvider(settings, system, user), model: settings.model }
    } catch (err) {
      if (!(err instanceof AiError) || !err.status || !RETRYABLE_STATUS.has(err.status)) throw err
      lastError = err
      if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt])
    }
  }

  const fallback = FALLBACK_MODEL[settings.provider]?.[settings.model]
  if (fallback) {
    try {
      return { text: await callProvider({ ...settings, model: fallback }, system, user), model: fallback }
    } catch (err) {
      if (err instanceof AiError) throw err
    }
  }
  throw lastError ?? new AiError('AI 요청에 실패했어요.')
}

export async function analyzeWithAi(
  input: PurchaseInput,
  facts: FinanceFacts,
  settings: AiSettings,
): Promise<Analysis> {
  const user = buildUserPrompt(input, facts)
  const { text, model } = await callWithRetry(settings, SYSTEM_PROMPT, user)
  if (!text) throw new AiError('AI가 빈 응답을 보냈어요. 다시 시도해 주세요.')
  return normalize(extractJson(text), { ...settings, model })
}

/** 설정 화면의 "연결 테스트"용 최소 요청 */
export async function testConnection(settings: AiSettings): Promise<string> {
  const system =
    '당신은 연결 테스트 응답기입니다. 반드시 {"ok": true, "greeting": "짧은 한국어 인사"} 형태의 JSON만 출력하세요.'
  const { text } = await callWithRetry(settings, system, '연결 테스트')
  const parsed = extractJson(text ?? '{}') as { greeting?: string }
  return parsed.greeting ?? '연결되었어요.'
}
