export type Category =
  | 'electronics'
  | 'fashion'
  | 'food'
  | 'hobby'
  | 'home'
  | 'beauty'
  | 'education'
  | 'transport'
  | 'subscription'
  | 'other'

export type Urgency = 'need' | 'useful' | 'want' | 'impulse'

export interface PurchaseInput {
  item: string
  price: number
  category: Category
  urgency: Urgency
  /** 월 예상 사용 횟수 */
  usesPerMonth: number
  /** 예상 사용 연수 */
  yearsOfUse: number
  /** 월 가처분 소득 (선택) */
  monthlyIncome?: number
  /** 이미 비슷한 물건을 가지고 있는지 */
  alreadyOwnSimilar: boolean
  /** 사고 싶은 이유, 상황 */
  reason: string
}

export type Verdict = 'buy' | 'wait' | 'save'

export interface FutureScenario {
  title: string
  points: string[]
}

export interface Analysis {
  verdict: Verdict
  /** 0~100, 높을수록 합리적인 소비 */
  score: number
  headline: string
  summary: string
  ifBuy: FutureScenario
  ifSave: FutureScenario
  ifNotSave: FutureScenario
  alternatives: string[]
  questions: string[]
  source: 'ai' | 'local'
  model?: string
}

export interface FinanceFacts {
  hourlyWage: number | null
  workHours: number | null
  incomeRatio: number | null
  costPerUse: number
  totalUses: number
  futureValues: { years: number; value: number }[]
  habitYearly: number
  habitTenYears: number
  habitTenYearsInvested: number
  annualRate: number
}

export type Provider = 'openai' | 'anthropic' | 'gemini'

export interface AiSettings {
  provider: Provider
  apiKey: string
  model: string
}

export interface DecisionRecord {
  id: string
  createdAt: string
  item: string
  price: number
  verdict: Verdict
  score: number
  decision: 'bought' | 'saved'
}
