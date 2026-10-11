import { PiggyBankIcon, ShoppingBagIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatKrwCompact, futureValue } from '@/lib/finance'
import { VERDICT_META } from '@/lib/labels'
import type { DecisionRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HistoryPanelProps {
  records: DecisionRecord[]
  onRemove: (id: string) => void
  onClear: () => void
}

export function HistoryPanel({ records, onRemove, onClear }: HistoryPanelProps) {
  const saved = records.filter((r) => r.decision === 'saved')
  const bought = records.filter((r) => r.decision === 'bought')
  const totalSaved = saved.reduce((sum, r) => sum + r.price, 0)
  const totalSpent = bought.reduce((sum, r) => sum + r.price, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">나의 결정 기록</CardTitle>
        <CardDescription>이 브라우저에만 저장돼요. 아끼기로 한 돈이 훗날 얼마가 되는지 확인해 보세요.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            아직 기록이 없어요. 분석 결과 아래에서 <span className="font-medium text-foreground">살게요</span> 또는{' '}
            <span className="font-medium text-foreground">아낄게요</span>를 누르면 여기에 쌓여요.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-verdict-save/10 p-3">
                <p className="text-xs text-muted-foreground">지금까지 아낀 돈</p>
                <p className="mt-1 text-lg font-semibold tabular text-verdict-save">{formatKrwCompact(totalSaved)}</p>
                <p className="text-xs text-muted-foreground">{saved.length}번의 멈춤</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">아낀 돈의 10년 뒤</p>
                <p className="mt-1 text-lg font-semibold tabular">{formatKrwCompact(futureValue(totalSaved, 10))}</p>
                <p className="text-xs text-muted-foreground">연 5% 가정</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">사기로 한 돈</p>
                <p className="mt-1 text-lg font-semibold tabular">{formatKrwCompact(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">{bought.length}번의 선택</p>
              </div>
            </div>

            <ul className="divide-y">
              {records.map((r) => {
                const meta = VERDICT_META[r.verdict]
                return (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        r.decision === 'saved'
                          ? 'bg-verdict-save/10 text-verdict-save'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {r.decision === 'saved' ? (
                        <PiggyBankIcon className="size-4" />
                      ) : (
                        <ShoppingBagIcon className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.item}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · 훗날
                        점수 {r.score} · <span className={meta.colorClass}>{meta.short}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.decision === 'saved' ? 'secondary' : 'outline'} className="tabular">
                        {r.decision === 'saved' ? '아낌' : '구매'} · {formatKrwCompact(r.price)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemove(r.id)}
                        aria-label={`${r.item} 기록 삭제`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClear}>
                기록 모두 지우기
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
