import type { FinanceFacts, PurchaseInput } from './types'

/** 근로기준법 기준 월 소정근로시간 (주 40시간 + 주휴) */
const MONTHLY_WORK_HOURS = 209
/** 장기 분산투자 수익률을 보수적으로 가정 */
export const ANNUAL_RATE = 0.05
const HORIZONS = [1, 5, 10, 20]

export function futureValue(amount: number, years: number, rate = ANNUAL_RATE) {
  return amount * Math.pow(1 + rate, years)
}

/** 매월 같은 금액을 적립식으로 투자했을 때의 미래가치 */
export function futureValueOfMonthlyDeposit(monthly: number, years: number, rate = ANNUAL_RATE) {
  const r = rate / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * ((Math.pow(1 + r, n) - 1) / r)
}

export function computeFinanceFacts(input: PurchaseInput): FinanceFacts {
  const income = input.monthlyIncome && input.monthlyIncome > 0 ? input.monthlyIncome : null
  const hourlyWage = income ? income / MONTHLY_WORK_HOURS : null
  const workHours = hourlyWage ? input.price / hourlyWage : null
  const incomeRatio = income ? input.price / income : null

  const totalUses = Math.max(1, Math.round(input.usesPerMonth * 12 * input.yearsOfUse))
  const costPerUse = input.price / totalUses

  const futureValues = HORIZONS.map((years) => ({
    years,
    value: futureValue(input.price, years),
  }))

  const habitYearly = input.price * 12
  const habitTenYears = input.price * 12 * 10
  const habitTenYearsInvested = futureValueOfMonthlyDeposit(input.price, 10)

  return {
    hourlyWage,
    workHours,
    incomeRatio,
    costPerUse,
    totalUses,
    futureValues,
    habitYearly,
    habitTenYears,
    habitTenYearsInvested,
    annualRate: ANNUAL_RATE,
  }
}

export function formatKrw(value: number) {
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** 큰 금액을 "1,234만 원" 처럼 읽기 쉽게 */
export function formatKrwCompact(value: number) {
  const v = Math.round(value)
  if (v >= 100_000_000) {
    const eok = Math.floor(v / 100_000_000)
    const man = Math.round((v % 100_000_000) / 10_000)
    return man > 0 ? `${eok}억 ${man.toLocaleString('ko-KR')}만 원` : `${eok}억 원`
  }
  if (v >= 10_000) {
    const man = Math.floor(v / 10_000)
    const rest = v % 10_000
    return rest > 0
      ? `${man.toLocaleString('ko-KR')}만 ${rest.toLocaleString('ko-KR')}원`
      : `${man.toLocaleString('ko-KR')}만 원`
  }
  return `${v.toLocaleString('ko-KR')}원`
}

export function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}분`
  if (hours < 8) return `${hours.toFixed(1)}시간`
  const days = hours / 8
  if (days < 22) return `${days.toFixed(1)}일 (하루 8시간 기준)`
  return `${(days / 22).toFixed(1)}개월치 근무`
}
