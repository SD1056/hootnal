import { formatHours, formatKrwCompact } from './finance'
import type { Analysis, FinanceFacts, PurchaseInput, Verdict } from './types'

const URGENCY_LABEL: Record<PurchaseInput['urgency'], string> = {
  need: '꼭 필요한 것',
  useful: '있으면 유용한 것',
  want: '갖고 싶은 것',
  impulse: '방금 꽂힌 것',
}

/**
 * AI 키가 없을 때 쓰는 규칙 기반 분석.
 * 가격 대비 사용 빈도, 소득 대비 비중, 필요도, 중복 보유 여부를 점수로 환산한다.
 */
export function analyzeLocally(input: PurchaseInput, facts: FinanceFacts): Analysis {
  let score = 55

  switch (input.urgency) {
    case 'need':
      score += 25
      break
    case 'useful':
      score += 10
      break
    case 'want':
      score -= 5
      break
    case 'impulse':
      score -= 20
      break
  }

  if (input.alreadyOwnSimilar) score -= 15

  if (facts.incomeRatio !== null) {
    if (facts.incomeRatio > 0.5) score -= 25
    else if (facts.incomeRatio > 0.2) score -= 12
    else if (facts.incomeRatio > 0.1) score -= 5
    else if (facts.incomeRatio < 0.02) score += 8
  }

  if (facts.totalUses >= 200) score += 10
  else if (facts.totalUses >= 50) score += 4
  else if (facts.totalUses <= 5) score -= 10

  if (input.category === 'subscription') score -= 5
  if (input.category === 'education') score += 5

  score = Math.max(5, Math.min(95, Math.round(score)))

  const verdict: Verdict = score >= 65 ? 'buy' : score >= 40 ? 'wait' : 'save'
  const price = formatKrwCompact(input.price)
  const tenYear = facts.futureValues.find((f) => f.years === 10)!
  const twentyYear = facts.futureValues.find((f) => f.years === 20)!

  const headline =
    verdict === 'buy'
      ? `${input.item}, 사도 괜찮은 선택이에요`
      : verdict === 'wait'
        ? `${input.item}, 일주일만 더 생각해 보세요`
        : `${input.item}, 지금은 아끼는 쪽이 유리해요`

  const workHint =
    facts.workHours !== null
      ? ` 이 금액은 당신의 ${formatHours(facts.workHours)}에 해당하는 노동과 맞바꾸는 거예요.`
      : ''

  const summary =
    verdict === 'buy'
      ? `${URGENCY_LABEL[input.urgency]}이고 사용 빈도도 충분해서 ${price}의 값어치를 할 가능성이 높아요.${workHint} 다만 같은 품질의 더 저렴한 선택지가 없는지 한 번만 확인해 보세요.`
      : verdict === 'wait'
        ? `필요성은 있지만 ${price}를 지금 바로 써야 할 이유는 약해 보여요.${workHint} 장바구니에 넣어 두고 7일 뒤에도 여전히 사고 싶다면 그때 결정해도 늦지 않아요.`
        : `${URGENCY_LABEL[input.urgency]}에 ${price}를 쓰는 건 훗날의 당신에게 부담이 될 수 있어요.${workHint} 이 돈을 그대로 두면 10년 뒤 ${formatKrwCompact(tenYear.value)}가 되어 있을 거예요.`

  const ifBuy = {
    title: '샀을 때의 훗날',
    points: [
      `1회 사용당 비용은 약 ${formatKrwCompact(facts.costPerUse)}예요. 예상대로 ${facts.totalUses.toLocaleString('ko-KR')}번 쓴다면 나쁘지 않은 투자일 수 있어요.`,
      input.alreadyOwnSimilar
        ? '이미 비슷한 물건이 있어서 새 물건의 만족감은 생각보다 빨리 사라질 가능성이 커요.'
        : '처음 몇 주는 만족감이 높지만, 대부분의 소비는 3개월 안에 "원래 있던 것"처럼 느껴져요.',
      facts.incomeRatio !== null && facts.incomeRatio > 0.2
        ? `월 소득의 ${Math.round(facts.incomeRatio * 100)}%를 한 번에 쓰는 셈이라 이번 달 다른 지출을 조정해야 할 수 있어요.`
        : '이번 달 예산 안에서 소화 가능한 수준이라 생활에 큰 타격은 없을 거예요.',
    ],
  }

  const ifSave = {
    title: '아꼈을 때의 훗날',
    points: [
      `${price}를 연 ${Math.round(facts.annualRate * 100)}%로 굴리면 10년 뒤 ${formatKrwCompact(tenYear.value)}, 20년 뒤 ${formatKrwCompact(twentyYear.value)}가 돼요.`,
      '"사지 않기로 한 결정"은 그 자체로 소비 근육이 되어 다음 충동 앞에서 더 쉽게 멈출 수 있게 해줘요.',
      '비상금이 하루치라도 더 쌓이면, 갑작스러운 지출 앞에서 빚을 지지 않아도 되는 여유가 생겨요.',
    ],
  }

  const ifNotSave = {
    title: '아끼지 않았을 때의 훗날',
    points: [
      `이 정도 소비가 매달 반복되면 1년에 ${formatKrwCompact(facts.habitYearly)}, 10년이면 ${formatKrwCompact(facts.habitTenYears)}가 사라져요.`,
      `같은 돈을 매달 적립했다면 10년 뒤 ${formatKrwCompact(facts.habitTenYearsInvested)}가 되어 있었을 거예요. 이게 진짜 비용이에요.`,
      '"이 정도는 괜찮아"가 쌓이면 소득이 늘어도 저축은 늘지 않는 생활 수준 인플레이션에 갇히기 쉬워요.',
    ],
  }

  const alternatives: string[] = []
  if (input.category === 'electronics' || input.category === 'fashion' || input.category === 'hobby') {
    alternatives.push('리퍼비시, 중고 거래, 이전 세대 모델로 같은 효용을 더 낮은 가격에 얻을 수 있는지 확인해 보세요.')
  }
  if (input.usesPerMonth <= 2) {
    alternatives.push('월 2회 이하로 쓸 물건이라면 대여 서비스나 지인에게 빌리는 편이 훨씬 저렴해요.')
  }
  if (input.category === 'subscription') {
    alternatives.push('연 단위 결제 대신 월 단위로 한 달만 써보고, 실제 사용 시간을 기록해 보세요.')
  }
  if (input.alreadyOwnSimilar) {
    alternatives.push('지금 가진 물건을 한 달만 더 써보고, 정확히 무엇이 불편한지 적어본 뒤 결정하세요.')
  }
  if (alternatives.length === 0) {
    alternatives.push('가격 추적 사이트에 알림을 걸어 두고 세일 시즌을 기다려 보세요.')
    alternatives.push(`${price}를 "훗날 통장"에 먼저 옮겨 두고, 2주 뒤에도 사고 싶으면 그 돈으로 사세요.`)
  }

  const questions = [
    '이 물건이 없어서 지난 한 달 동안 실제로 불편했던 순간이 세 번 이상 있었나요?',
    '세일 중이 아니어도, 광고를 보지 않았어도 똑같이 사고 싶었을까요?',
    `${price}를 현금으로 손에 쥐고 있다면, 그래도 이것과 바꾸시겠어요?`,
  ]

  return {
    verdict,
    score,
    headline,
    summary,
    ifBuy,
    ifSave,
    ifNotSave,
    alternatives,
    questions,
    source: 'local',
  }
}
