import { useEffect, useRef, useState } from 'react'
import { BotIcon, BotOffIcon, SettingsIcon, SproutIcon, TriangleAlertIcon } from 'lucide-react'

import { HistoryPanel } from '@/components/history-panel'
import { PurchaseForm } from '@/components/purchase-form'
import { ResultView } from '@/components/result-view'
import { SettingsDialog } from '@/components/settings-dialog'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AiError, analyzeWithAi } from '@/lib/ai'
import { computeFinanceFacts } from '@/lib/finance'
import { analyzeLocally } from '@/lib/local-analyzer'
import { clearSettings, loadHistory, loadSettings, newId, saveHistory, saveSettings } from '@/lib/storage'
import type { AiSettings, Analysis, DecisionRecord, FinanceFacts, PurchaseInput } from '@/lib/types'

interface ResultState {
  input: PurchaseInput
  facts: FinanceFacts
  analysis: Analysis
  recorded: DecisionRecord['decision'] | null
}

const LOADING_MESSAGES = [
  '가격을 노동 시간으로 바꿔보는 중...',
  '10년 뒤 통장을 들여다보는 중...',
  '세 가지 미래를 나란히 놓는 중...',
]

function ResultSkeleton() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1600)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
      <Card>
        <CardContent className="flex items-center gap-5">
          <Skeleton className="size-28 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">{LOADING_MESSAGES[idx]}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ aiEnabled, onOpenSettings }: { aiEnabled: boolean; onOpenSettings: () => void }) {
  return (
    <Card className="h-full border-dashed bg-transparent shadow-none">
      <CardContent className="flex h-full min-h-72 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <SproutIcon className="size-7" />
        </div>
        <div className="max-w-sm">
          <p className="font-medium">물건과 가격을 입력하면 세 가지 훗날을 보여드려요</p>
          <p className="mt-1 text-sm text-muted-foreground">
            샀을 때 어떤 미래가 오는지, 아꼈을 때 무엇이 자라는지, 아끼지 않는 습관이 쌓이면 어떻게 되는지.
          </p>
        </div>
        {!aiEnabled && (
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <BotIcon />
            AI 키 연결해서 더 정확하게 보기
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function App() {
  const [settings, setSettings] = useState<AiSettings | null>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [history, setHistory] = useState<DecisionRecord[]>(() => loadHistory())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const handleSubmit = async (input: PurchaseInput) => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    setResult(null)
    const facts = computeFinanceFacts(input)

    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }

    let analysis: Analysis
    if (settings) {
      try {
        analysis = await analyzeWithAi(input, facts, settings)
      } catch (err) {
        if (id !== requestId.current) return
        analysis = analyzeLocally(input, facts)
        setError(
          err instanceof AiError
            ? `${err.message} 대신 기본 분석 결과를 보여드려요.`
            : 'AI 분석 중 문제가 생겨 기본 분석 결과를 보여드려요.',
        )
      }
    } else {
      await new Promise((r) => setTimeout(r, 500))
      analysis = analyzeLocally(input, facts)
    }

    if (id !== requestId.current) return
    setResult({ input, facts, analysis, recorded: null })
    setLoading(false)
  }

  const handleRecord = (decision: DecisionRecord['decision']) => {
    if (!result) return
    const record: DecisionRecord = {
      id: newId(),
      createdAt: new Date().toISOString(),
      item: result.input.item,
      price: result.input.price,
      verdict: result.analysis.verdict,
      score: result.analysis.score,
      decision,
    }
    setHistory((h) => [record, ...h].slice(0, 100))
    setResult({ ...result, recorded: decision })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="#"
            className="flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault()
              handleReset()
            }}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SproutIcon className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">훗날</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">· 오늘의 선택이 만드는 내일</span>
          </a>
          <div className="flex items-center gap-2">
            <Badge variant={settings ? 'secondary' : 'outline'} className="hidden sm:inline-flex">
              {settings ? <BotIcon /> : <BotOffIcon />}
              {settings ? `AI 연결됨 · ${settings.model}` : 'AI 미연결 · 기본 분석'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
              AI 설정
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            이 물건, <span className="text-primary">지금</span> 사는 게 맞을까요?
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            훗날은 사지 말라고 잔소리하는 곳이 아니에요. 샀을 때와 아꼈을 때의 미래를 숫자와 장면으로 나란히 보여드리고,
            결정은 당신이 하도록 돕습니다.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <div className="lg:sticky lg:top-20">
            <PurchaseForm loading={loading} aiEnabled={Boolean(settings)} onSubmit={handleSubmit} />
          </div>

          <div ref={resultRef} className="scroll-mt-20">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <TriangleAlertIcon />
                <AlertTitle>AI 연결에 문제가 있었어요</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <AlertAction>
                  <Button variant="outline" size="xs" onClick={() => setSettingsOpen(true)}>
                    설정 확인
                  </Button>
                </AlertAction>
              </Alert>
            )}
            {loading ? (
              <ResultSkeleton />
            ) : result ? (
              <ResultView
                input={result.input}
                facts={result.facts}
                analysis={result.analysis}
                recorded={result.recorded}
                onRecord={handleRecord}
                onReset={handleReset}
              />
            ) : (
              <EmptyState aiEnabled={Boolean(settings)} onOpenSettings={() => setSettingsOpen(true)} />
            )}
          </div>
        </section>

        <section>
          <HistoryPanel
            records={history}
            onRemove={(id) => setHistory((h) => h.filter((r) => r.id !== id))}
            onClear={() => setHistory([])}
          />
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6">
          <p>
            훗날의 모든 숫자는 참고용 추정치예요. 연 5% 수익률 가정은 기회비용을 가늠하기 위한 것이며 투자 권유나 금융
            자문이 아닙니다.
          </p>
          <p>
            입력한 내용과 API 키는 서버로 전송되지 않고 브라우저에만 저장됩니다. AI 분석 시에는 선택한 AI 제공사에만
            직접 전달돼요.
          </p>
        </div>
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(s) => {
          saveSettings(s)
          setSettings(s)
        }}
        onClear={() => {
          clearSettings()
          setSettings(null)
        }}
      />
    </div>
  )
}
