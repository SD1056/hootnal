import type { Category, Urgency, Verdict } from './types'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'electronics', label: '전자기기' },
  { value: 'fashion', label: '패션 · 의류' },
  { value: 'food', label: '식비 · 카페' },
  { value: 'hobby', label: '취미 · 여가' },
  { value: 'home', label: '생활 · 인테리어' },
  { value: 'beauty', label: '뷰티 · 건강' },
  { value: 'education', label: '교육 · 자기계발' },
  { value: 'transport', label: '교통 · 차량' },
  { value: 'subscription', label: '구독 서비스' },
  { value: 'other', label: '기타' },
]

export const URGENCIES: { value: Urgency; label: string; description: string }[] = [
  { value: 'need', label: '꼭 필요해요', description: '없으면 생활이나 일에 지장이 있어요' },
  { value: 'useful', label: '있으면 유용해요', description: '없어도 되지만 삶이 편해져요' },
  { value: 'want', label: '갖고 싶어요', description: '한동안 눈여겨보던 물건이에요' },
  { value: 'impulse', label: '방금 꽂혔어요', description: '오늘 처음 봤는데 사고 싶어요' },
]

export const VERDICT_META: Record<
  Verdict,
  { label: string; short: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  buy: {
    label: '사도 괜찮아요',
    short: '구매 권장',
    colorClass: 'text-verdict-buy',
    bgClass: 'bg-verdict-buy/10',
    borderClass: 'border-verdict-buy/30',
  },
  wait: {
    label: '조금만 더 고민해요',
    short: '7일 냉각기',
    colorClass: 'text-verdict-wait',
    bgClass: 'bg-verdict-wait/10',
    borderClass: 'border-verdict-wait/30',
  },
  save: {
    label: '이번엔 아껴요',
    short: '절약 권장',
    colorClass: 'text-verdict-save',
    bgClass: 'bg-verdict-save/10',
    borderClass: 'border-verdict-save/30',
  },
}
