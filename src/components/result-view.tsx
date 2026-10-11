import {
  CheckIcon,
  ClockIcon,
  HelpCircleIcon,
  LightbulbIcon,
  PiggyBankIcon,
  ShoppingBagIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatHours, formatKrw, formatKrwCompact } from '@/lib/finance'
import { VERDICT_META } from '@/lib/labels'
import type { Analysis, DecisionRecord, FinanceFacts, PurchaseInput } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ResultViewProps {
  input: PurchaseInput
  facts: FinanceFacts
  analysis: Analysis
  recorded: DecisionRecord['decision'] | null
  onRecord: (decision: DecisionRecord['decision']) => void
  onReset: () => void
}

function ScoreRing({ score, verdict }: { score: number; verdict: Analysis['verdict'] }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            verdict === 'buy' && 'stroke-verdict-buy',
            verdict === 'wait' && 'stroke-verdict-wait',
            verdict === 'save' && 'stroke-verdict-save',
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular leading-none">{score}</span>
        <span className="mt-1 text-[10px] text-muted-foreground">합리성 점수</span>
      </div>
    </div>
  )
}

function ScenarioCard({
  icon: Icon,
  title,
  points,
  tone,
}: {
  icon: typeof ShoppingBagIcon
  title: string
  points: string[]
  tone: 'buy' | 'save' | 'warn'
}) {
  return (
    <Card
      className={cn(
        'h-full border-t-4',
        tone === 'buy' && 'border-t-verdict-buy',
        tone === 'save' && 'border-t-verdict-save',
        tone === 'warn' && 'border-t-destructive/70',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={cn(
              'size-4',
              tone === 'buy' && 'text-verdict-buy',
              tone === 'save' && 'text-verdict-save',
              tone === 'warn' && 'text-destructive',
            )}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">이 시나리오에 대한 설명이 비어 있어요.</p>
        ) : (
          <ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultView({ input, facts, analysis, recorded, onRecord, onReset }: ResultViewProps) {
  const meta = VERDICT_META[analysis.verdict]

  return (
    <div className="flex flex-col gap-5">
      <Card className={cn('border', meta.borderClass, meta.bgClass)}>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={analysis.score} verdict={analysis.verdict} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('border-transparent', meta.bgClass, meta.colorClass)} variant="outline">
                {meta.label}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {analysis.source === 'ai' ? `AI 분석 · ${analysis.model}` : '기본 분석'}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{analysis.headline}</h2>
            <p className="text-sm leading-relaxed text-foreground/80">{analysis.summary}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{formatKrw(input.price)}은 이런 돈이에요</CardTitle>
          <CardDescription>
            연 {Math.round(facts.annualRate * 100)}% 수익률 가정. 투자 권유가 아니라 기회비용을 가늠하기 위한 숫자예요.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">노동 시간으로 환산하면</p>
            <p className="mt-1 text-lg font-semibold tabular">
              {facts.workHours !== null ? formatHours(facts.workHours) : '소득 미입력'}
            </p>
            {facts.hourlyWage !== null && (
              <p className="text-xs text-muted-foreground">시급 약 {formatKrw(facts.hourlyWage)} 기준</p>
            )}
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">1회 사용당 비용</p>
            <p className="mt-1 text-lg font-semibold tabular">{formatKrwCompact(facts.costPerUse)}</p>
            <p className="text-xs text-muted-foreground">총 {facts.totalUses.toLocaleString('ko-KR')}회 사용 가정</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">월 소득 대비</p>
            <p className="mt-1 text-lg font-semibold tabular">
              {facts.incomeRatio !== null ? `${(facts.incomeRatio * 100).toFixed(1)}%` : '소득 미입력'}
            </p>
            <p className="text-xs text-muted-foreground">한 달 가처분 소득 중 비중</p>
          </div>
          <div className="sm:col-span-3">
            <Separator className="my-1" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.futureValues.map((fv) => (
                <div key={fv.years} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">아끼면 {fv.years}년 뒤</span>
                  <span className="font-semibold tabular text-verdict-save">{formatKrwCompact(fv.value)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              이런 소비가 매달 반복되면 10년간 {formatKrwCompact(facts.habitTenYears)}를 쓰게 되고, 같은 돈을 매달
              모았다면{' '}
              <span className="font-medium text-foreground">{formatKrwCompact(facts.habitTenYearsInvested)}</span>이
              되어 있을 거예요.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <ScenarioCard icon={ShoppingBagIcon} title={analysis.ifBuy.title} points={analysis.ifBuy.points} tone="buy" />
        <ScenarioCard icon={TrendingUpIcon} title={analysis.ifSave.title} points={analysis.ifSave.points} tone="save" />
        <ScenarioCard
          icon={TrendingDownIcon}
          title={analysis.ifNotSave.title}
          points={analysis.ifNotSave.points}
          tone="warn"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LightbulbIcon className="size-4 text-verdict-wait" />더 나은 선택지
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.alternatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">제안된 대안이 없어요.</p>
            ) : (
              <ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
                {analysis.alternatives.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircleIcon className="size-4 text-primary" />
              결제 버튼을 누르기 전에
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">질문이 없어요.</p>
            ) : (
              <ol className="flex flex-col gap-2.5 text-sm leading-relaxed">
                {analysis.questions.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">그래서, 어떻게 하기로 하셨나요?</p>
            <p className="text-sm text-muted-foreground">
              결정을 기록하면 아낀 돈이 훗날 얼마가 되는지 아래에서 함께 쌓여요.
            </p>
          </div>
          {recorded ? (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {recorded === 'saved' ? <PiggyBankIcon /> : <ShoppingBagIcon />}
                {recorded === 'saved' ? '아끼기로 기록했어요' : '사기로 기록했어요'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onReset}>
                새로 분석하기
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onRecord('bought')}>
                <ShoppingBagIcon />
                살게요
              </Button>
              <Button onClick={() => onRecord('saved')}>
                <PiggyBankIcon />
                아낄게요
              </Button>
              {analysis.verdict === 'wait' && (
                <Button variant="ghost" onClick={onReset} className="hidden sm:inline-flex">
                  <ClockIcon />
                  7일 뒤에 다시
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
