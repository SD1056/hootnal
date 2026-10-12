# 훗날

> 이 물건, 지금 사는 게 맞을까요?

**훗날**은 합리적 소비를 돕는 정적 웹사이트입니다. 배포된 사이트: [sd1056.github.io/hootnal](https://sd1056.github.io/hootnal/) 사려는 물건과 가격을 입력하면 세 가지 미래를 나란히 보여줍니다.

- **샀을 때의 훗날** — 1회 사용당 비용, 소득 대비 비중, 만족감의 지속 기간
- **아꼈을 때의 훗날** — 같은 돈을 연 5%로 굴렸을 때 1 · 5 · 10 · 20년 뒤 가치, 소비 습관의 변화
- **아끼지 않았을 때의 훗날** — 이런 소비가 매달 반복될 때 10년간 사라지는 돈과 그 기회비용

여기에 가격을 **노동 시간으로 환산**하고, 0~100점의 **합리성 점수**와 "사도 괜찮아요 / 조금만 더 고민해요 / 이번엔 아껴요" 판정을 내립니다. 결정을 기록하면 지금까지 아낀 돈이 훗날 얼마가 되는지 누적해서 보여줍니다.

## AI 분석

사이트에는 **기본 Gemini 키가 내장**되어 있어 방문자가 아무 설정 없이 바로 AI 분석을 쓸 수 있습니다. 키와 모델은 `.env`에서 읽습니다.

```
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-flash-latest
```

방문자가 다른 제공사나 자기 키를 쓰고 싶으면 우측 상단 **AI 설정**에서 직접 넣을 수 있고, 그 경우 그 키가 우선합니다(`localStorage`에만 저장). 지원 제공사:

| 제공사 | 기본 모델 | 비고 |
| --- | --- | --- |
| OpenAI | `gpt-4o-mini` | JSON 모드 사용 |
| Anthropic (Claude) | `claude-sonnet-4-5` | 브라우저 직접 호출 헤더 사용 |
| Google Gemini | `gemini-flash-latest` | JSON 응답 모드 사용 |

**키 보안에 대해**: 훗날은 서버 없는 정적 사이트라 내장 키는 빌드 산출물(JS 번들)에 그대로 포함되어 누구나 볼 수 있습니다. 따라서 Google Cloud 콘솔에서 해당 키에 반드시 다음 제한을 걸어 두세요.

- **애플리케이션 제한 → 웹사이트**: `https://sd1056.github.io/*` (로컬 개발용으로 `http://127.0.0.1:4417/*` 추가 가능)
- **API 제한**: Generative Language API만 허용

이렇게 하면 다른 사이트에서 키를 가져다 써도 요청이 거부됩니다. 키가 비어 있으면 규칙 기반 **기본 분석**이 동작하므로 사이트는 항상 사용 가능합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

`http://127.0.0.1:4417` 에서 확인할 수 있습니다.

```bash
npm run build     # dist/ 에 정적 파일 생성
npm run preview   # 빌드 결과 미리보기 (127.0.0.1:4418)
npm run lint
```

## GitHub Pages 배포

`.github/workflows/deploy.yml` 이 `main` 브랜치에 푸시될 때마다 빌드하고 GitHub Pages에 배포합니다.

1. GitHub 저장소 **Settings → Pages** 에서 **Source** 를 **GitHub Actions** 로 선택합니다.
2. `main` 에 푸시하면 워크플로가 실행되고 `https://<계정>.github.io/<저장소>/` 에 게시됩니다.

워크플로는 저장소 이름으로 Vite `base` 경로를 자동 설정합니다. `<계정>.github.io` 처럼 사용자 사이트 저장소라면 `/` 로 배포됩니다. 로컬에서 같은 경로로 빌드하려면 `BASE_PATH=/<저장소>/ npm run build` 를 사용하세요.

## 기술 스택

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (Radix)
- 백엔드 없음 — 모든 계산과 저장은 브라우저에서 처리

## 구조

```
src/
  App.tsx                    # 레이아웃, 상태, 분석 흐름
  components/
    purchase-form.tsx        # 물건 · 가격 · 상황 입력
    result-view.tsx          # 판정, 숫자 카드, 세 가지 훗날
    settings-dialog.tsx      # AI 제공사 / 키 / 모델 설정
    history-panel.tsx        # 결정 기록과 누적 절약액
  lib/
    finance.ts               # 노동 시간 환산, 복리 미래가치, 포맷
    local-analyzer.ts        # AI 없이 동작하는 규칙 기반 분석
    ai.ts                    # OpenAI / Anthropic / Gemini 호출과 프롬프트
    storage.ts               # localStorage 입출력
```

## 면책

모든 숫자는 참고용 추정치입니다. 연 5% 수익률 가정은 기회비용을 가늠하기 위한 것이며 투자 권유나 금융 자문이 아닙니다.
