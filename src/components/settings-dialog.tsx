import { useState } from 'react'
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AiError, PROVIDERS, defaultModelFor, testConnection } from '@/lib/ai'
import type { AiSettings, Provider } from '@/lib/types'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AiSettings | null
  /** 사이트에 내장된 기본 설정 (없으면 null) */
  builtIn: AiSettings | null
  onSave: (settings: AiSettings) => void
  onClear: () => void
}

export function SettingsDialog({ open, onOpenChange, settings, builtIn, onSave, onClear }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Remounting on open resets the draft fields to the saved settings. */}
        {open && (
          <SettingsForm
            settings={settings}
            builtIn={builtIn}
            onSave={onSave}
            onClear={onClear}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SettingsForm({ settings, builtIn, onSave, onClear, onOpenChange }: Omit<SettingsDialogProps, 'open'>) {
  const [provider, setProvider] = useState<Provider>(settings?.provider ?? 'openai')
  const [apiKey, setApiKey] = useState(settings?.apiKey ?? '')
  const [model, setModel] = useState(settings?.model ?? defaultModelFor(settings?.provider ?? 'openai'))
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleProviderChange = (value: Provider) => {
    setProvider(value)
    const prev = PROVIDERS.find((p) => p.value === provider)
    if (!model.trim() || model === prev?.defaultModel) setModel(defaultModelFor(value))
    setTestResult(null)
  }

  const current = { provider, apiKey: apiKey.trim(), model: model.trim() || defaultModelFor(provider) }
  const canSave = current.apiKey.length > 0

  const handleTest = async () => {
    if (!canSave) return
    setTesting(true)
    setTestResult(null)
    try {
      const greeting = await testConnection(current)
      setTestResult({ ok: true, message: `연결 성공: "${greeting}"` })
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof AiError ? err.message : '알 수 없는 오류가 발생했어요.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!canSave) return
    onSave(current)
    onOpenChange(false)
  }

  const providerMeta = PROVIDERS.find((p) => p.value === provider)!

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <KeyRoundIcon className="size-4" />
          AI 설정
        </DialogTitle>
        <DialogDescription>
          {builtIn
            ? '훗날에는 기본 AI 키가 내장되어 있어서 따로 설정하지 않아도 AI 분석이 동작해요. 다른 제공사나 내 키를 쓰고 싶을 때만 아래를 채워 주세요.'
            : 'API 키를 연결하면 AI가 물건과 가격, 상황을 읽고 맞춤 판단을 내려줘요. 키가 없어도 기본 분석은 계속 쓸 수 있어요.'}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {builtIn && !settings && (
          <Alert>
            <CheckCircle2Icon className="text-verdict-save" />
            <AlertTitle>기본 키 사용 중</AlertTitle>
            <AlertDescription>
              현재 {PROVIDERS.find((p) => p.value === builtIn.provider)?.label} · {builtIn.model} 으로 분석하고 있어요.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="provider">AI 제공사</Label>
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as Provider)}>
            <SelectTrigger id="provider" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="apiKey">API 키</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              placeholder={providerMeta.keyHint}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestResult(null)
              }}
              autoComplete="off"
              spellCheck={false}
              className="pr-9 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
              aria-label={showKey ? '키 숨기기' : '키 보기'}
            >
              {showKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="model">모델</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => {
              setModel(e.target.value)
              setTestResult(null)
            }}
            placeholder={providerMeta.defaultModel}
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">비워 두면 {providerMeta.defaultModel}을 사용해요.</p>
        </div>

        <Alert>
          <ShieldCheckIcon />
          <AlertTitle>키는 이 브라우저에만 저장돼요</AlertTitle>
          <AlertDescription>
            훗날은 서버가 없는 정적 사이트라 키가 어디에도 전송되지 않고, AI 제공사에만 직접 요청해요. 공용 PC라면 사용
            후 삭제해 주세요.
          </AlertDescription>
        </Alert>

        {testResult && (
          <Alert variant={testResult.ok ? 'default' : 'destructive'}>
            {testResult.ok ? <CheckCircle2Icon className="text-verdict-save" /> : <TriangleAlertIcon />}
            <AlertTitle>{testResult.ok ? '연결 확인' : '연결 실패'}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <div className="flex gap-2">
          {settings && (
            <Button
              variant="destructive"
              onClick={() => {
                onClear()
                onOpenChange(false)
              }}
            >
              {builtIn ? '내 키 삭제 (기본 키로 복귀)' : '키 삭제'}
            </Button>
          )}
          <Button variant="outline" onClick={handleTest} disabled={!canSave || testing}>
            {testing && <Loader2Icon className="animate-spin" />}
            연결 테스트
          </Button>
        </div>
        <Button onClick={handleSave} disabled={!canSave}>
          저장
        </Button>
      </DialogFooter>
    </>
  )
}
