import { useState, type FormEvent } from 'react'
import { Loader2Icon, SparklesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES, URGENCIES } from '@/lib/labels'
import type { Category, PurchaseInput, Urgency } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PurchaseFormProps {
  loading: boolean
  aiEnabled: boolean
  onSubmit: (input: PurchaseInput) => void
}

const EXAMPLES: PurchaseInput[] = [
  {
    item: '무선 노이즈캔슬링 헤드폰',
    price: 450000,
    category: 'electronics',
    urgency: 'want',
    usesPerMonth: 20,
    yearsOfUse: 3,
    monthlyIncome: 2800000,
    alreadyOwnSimilar: true,
    reason: '출퇴근 지하철이 시끄러워서. 지금 쓰는 유선 이어폰은 멀쩡함.',
  },
  {
    item: '오피스 의자',
    price: 380000,
    category: 'home',
    urgency: 'need',
    usesPerMonth: 22,
    yearsOfUse: 7,
    monthlyIncome: 3200000,
    alreadyOwnSimilar: false,
    reason: '재택근무 시작. 식탁 의자에 앉아 일하다 허리가 아프기 시작함.',
  },
  {
    item: '한정판 스니커즈',
    price: 219000,
    category: 'fashion',
    urgency: 'impulse',
    usesPerMonth: 4,
    yearsOfUse: 2,
    monthlyIncome: 2500000,
    alreadyOwnSimilar: true,
    reason: '오늘 발매. 리셀가 오를 것 같고 SNS에서 다들 신음.',
  },
]

function parseNumber(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatInput(value: number) {
  return value ? value.toLocaleString('ko-KR') : ''
}

export function PurchaseForm({ loading, aiEnabled, onSubmit }: PurchaseFormProps) {
  const [item, setItem] = useState('')
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState<Category>('electronics')
  const [urgency, setUrgency] = useState<Urgency>('want')
  const [usesPerMonth, setUsesPerMonth] = useState(8)
  const [yearsOfUse, setYearsOfUse] = useState(3)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [alreadyOwnSimilar, setAlreadyOwnSimilar] = useState(false)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ item?: string; price?: string }>({})

  const fill = (example: PurchaseInput) => {
    setItem(example.item)
    setPrice(example.price)
    setCategory(example.category)
    setUrgency(example.urgency)
    setUsesPerMonth(example.usesPerMonth)
    setYearsOfUse(example.yearsOfUse)
    setMonthlyIncome(example.monthlyIncome ?? 0)
    setAlreadyOwnSimilar(example.alreadyOwnSimilar)
    setReason(example.reason)
    setErrors({})
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!item.trim()) nextErrors.item = '어떤 물건인지 알려주세요.'
    if (price <= 0) nextErrors.price = '가격을 입력해 주세요.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      item: item.trim(),
      price,
      category,
      urgency,
      usesPerMonth: Math.max(0.1, usesPerMonth),
      yearsOfUse: Math.max(0.1, yearsOfUse),
      monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
      alreadyOwnSimilar,
      reason,
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">무엇을 사려고 하시나요?</CardTitle>
        <CardDescription>물건과 가격만 있어도 분석할 수 있어요. 소득과 상황을 적으면 훨씬 정확해져요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="grid gap-1.5">
              <Label htmlFor="item">물건</Label>
              <Input
                id="item"
                placeholder="예: 무선 헤드폰, 에어프라이어, 러닝화"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                aria-invalid={Boolean(errors.item)}
                autoComplete="off"
              />
              {errors.item && <p className="text-xs text-destructive">{errors.item}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price">가격</Label>
              <div className="relative">
                <Input
                  id="price"
                  inputMode="numeric"
                  placeholder="0"
                  className="pr-8 text-right tabular"
                  value={formatInput(price)}
                  onChange={(e) => setPrice(parseNumber(e.target.value))}
                  aria-invalid={Boolean(errors.price)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  원
                </span>
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>지금 이 물건은</Label>
            <div className="grid grid-cols-2 gap-2">
              {URGENCIES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  aria-pressed={urgency === u.value}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left transition-colors',
                    urgency === u.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span className="block text-sm font-medium">{u.label}</span>
                  <span className="block text-xs text-muted-foreground">{u.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="uses">월 사용 횟수</Label>
              <div className="relative">
                <Input
                  id="uses"
                  type="number"
                  min={0}
                  step={1}
                  className="pr-8 tabular"
                  value={usesPerMonth}
                  onChange={(e) => setUsesPerMonth(Number(e.target.value))}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  회
                </span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="years">예상 사용 기간</Label>
              <div className="relative">
                <Input
                  id="years"
                  type="number"
                  min={0}
                  step={0.5}
                  className="pr-8 tabular"
                  value={yearsOfUse}
                  onChange={(e) => setYearsOfUse(Number(e.target.value))}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  년
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="income">
                월 가처분 소득 <span className="font-normal text-muted-foreground">(선택)</span>
              </Label>
              <div className="relative">
                <Input
                  id="income"
                  inputMode="numeric"
                  placeholder="노동 시간으로 환산해 드려요"
                  className="pr-8 tabular"
                  value={formatInput(monthlyIncome)}
                  onChange={(e) => setMonthlyIncome(parseNumber(e.target.value))}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  원
                </span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>비슷한 물건이 이미 있나요?</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: false, label: '없어요' },
                  { value: true, label: '있어요' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setAlreadyOwnSimilar(opt.value)}
                    aria-pressed={alreadyOwnSimilar === opt.value}
                    className={cn(
                      'h-8 rounded-lg border text-sm font-medium transition-colors',
                      alreadyOwnSimilar === opt.value
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'border-border bg-background hover:bg-muted',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="reason">
              사고 싶은 이유나 상황 <span className="font-normal text-muted-foreground">(선택)</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="예: 지금 쓰는 게 고장 나서 / 세일 중이라 / 친구가 쓰는 걸 보고"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>예시로 채우기:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.item}
                  type="button"
                  onClick={() => fill(ex)}
                  className="rounded-md border border-dashed border-border px-2 py-0.5 hover:bg-muted"
                >
                  {ex.item}
                </button>
              ))}
            </div>
            <Button type="submit" size="lg" disabled={loading} className="sm:min-w-40">
              {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
              {loading ? '훗날을 그려보는 중' : aiEnabled ? 'AI로 판단하기' : '판단하기'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
