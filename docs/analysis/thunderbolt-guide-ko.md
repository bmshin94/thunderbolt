# Thunderbolt 분석 정리 (한국어)

> 이 문서는 Thunderbolt 저장소를 직접 열어보고 정리한 한국어 안내서입니다.
> 프로젝트가 무엇인지, 어떻게 설치·사용하는지, 어떤 부분이 재사용 가치가 있는지,
> 그리고 이 코드를 기반으로 어떤 사업 모델이 가능한지를 다룹니다.

## 저장소 주소

| 구분 | 주소 |
| --- | --- |
| 원본 (upstream) | https://github.com/thunderbird/thunderbolt |
| 이 저장소 (fork) | https://github.com/bmshin94/thunderbolt |
| 공식 웹사이트 | https://thunderbolt.io |
| 이슈 트래커 | https://github.com/thunderbird/thunderbolt/issues |
| 보안 취약점 신고 | https://github.com/thunderbird/thunderbolt/security/advisories/new |

---

## 1. 이게 뭐하는 프로젝트인가

Thunderbolt는 **오픈소스 · 크로스플랫폼 AI 클라이언트**입니다. 쉽게 말하면
"내 컴퓨터(또는 우리 회사 서버)에 직접 설치하는 ChatGPT"입니다.

슬로건은 `AI You Control: Choose your models. Own your data. Eliminate vendor lock-in.`
— 모델은 직접 고르고, 데이터는 직접 소유하고, 특정 벤더에 묶이지 않는다는 뜻입니다.

| 항목 | 내용 |
| --- | --- |
| 만든 곳 | MZLA Technologies (Thunderbird 메일과 같은 법인, 단 **별개 제품**) |
| 자금 | Mozilla 그랜트 |
| 라이선스 | MPL-2.0 |
| 주 언어 | TypeScript |
| 시작 | 2025년 7월 |
| 지원 플랫폼 | 웹 · macOS · Windows · Linux · iOS · Android (단일 React 코드베이스 + Tauri) |

### 핵심 특징 4가지

1. **모델 자유 선택** — Anthropic, OpenAI, Mistral, Fireworks, OpenRouter, 또는 OpenAI 호환
   엔드포인트 아무거나. 로컬 추론은 Ollama / llama.cpp 권장. **자체 호스팅 추론 엔드포인트는 없음**
   (사용자가 API 키를 직접 가져와야 함).
2. **데이터 소유권** — 모든 기기가 로컬 암호화 SQLite DB를 보유. 동기화는 옵트인이며,
   E2E 암호화를 켜면 서버는 암호문만 보게 됨.
3. **완전 자체 호스팅** — Docker Compose / Kubernetes(Helm) / Pulumi(AWS Fargate·EKS).
   SaaS 컨트롤 플레인에 의존하는 부분이 없음.
4. **확장 가능** — MCP 서버, 위젯, 스킬, 에이전트(ACP), 검색 제공자, 인증 제공자(OIDC/SAML)가
   모두 교체 가능한 모듈.

### 중요한 전제

공식 README와 배포 문서에 명시되어 있습니다.

> 현재 **활발한 개발 중이며 보안 감사를 진행하는 단계**입니다. 프로덕션 용도로는 의도되지 않았습니다.

기능 상태도 아직 고르지 않습니다.

| 기능 | 상태 |
| --- | --- |
| 웹 · macOS · Windows · Linux | 출시됨 |
| Android · iOS | 사용 가능 (앱스토어 출시 예정) |
| 커스텀 모델 / 프로바이더, OIDC, Google·Microsoft 연동 | 지원 |
| MCP 지원 | Preview |
| 기기 간 클라우드 동기화 | Preview |
| E2E 암호화 | Preview (암호학 감사 미완료) |
| ACP | 개발 중 |
| 에이전트 메모리 · 스킬 | 계획 |

---

## 2. 폴더 구조

| 경로 | 역할 |
| --- | --- |
| `src/` | 프론트엔드 본체 (React 19). 채팅, 검색, 음성, 위젯, 설정, DAL |
| `backend/` | API 서버 (Bun + Elysia). 인증, 프록시, 이메일, 웨이팅리스트 |
| `src-tauri/` | Tauri 2 래퍼 (Rust). 데스크톱·모바일 패키징 |
| `cli/` | 단일 바이너리 터미널 코딩 에이전트 |
| `crates/thunderbolt-acp-client` | ACP 클라이언트 (Rust) |
| `powersync-service/` | 멀티 디바이스 동기화 서비스 (Docker) |
| `shared/` | 프론트엔드 ↔ 백엔드 공용 타입·로직 |
| `deploy/` | Docker Compose · Kubernetes · Pulumi 배포 자산 |
| `e2e/` | Playwright E2E 테스트 |
| `web/` | 랜딩/문서 사이트 (Astro) |
| `docs/` | 아키텍처 · 개발 · 셀프호스팅 문서 |
| `.claude/`, `.thunderbot/` | 이 저장소 개발용 AI 에이전트 자동화 (스킬·커맨드·리뷰 에이전트) |

### 기술 스택

| 레이어 | 스택 |
| --- | --- |
| 클라이언트 | React 19 · Vite · Tauri 2 · Radix UI · Zustand · TanStack Query · Drizzle over SQLite |
| AI | Vercel AI SDK v6 · MCP 클라이언트 |
| 동기화 | PowerSync (커스텀 SharedWorker + E2E 암호화 변환 미들웨어) |
| 백엔드 | Elysia on Bun · Drizzle ORM · Better Auth · React Email / Resend |
| DB | PostgreSQL (운영) · PGLite (백엔드 테스트) |
| 인프라 | Docker Compose · Kubernetes · Pulumi |

---

## 3. 설치 및 사용법

주의: **서로 다른 두 개의 산출물**이 있습니다. 앱 본체와 CLI 에이전트는 별개입니다.

### 3-1. 앱 본체 (채팅 앱)

준비물: Bun 1.2+, Docker, (데스크톱·모바일 빌드 시) Rust 툴체인, AI 프로바이더 키 1개 이상.

```sh
git clone https://github.com/bmshin94/thunderbolt.git
cd thunderbolt

make doctor    # 누락된 도구를 검사하고 설치 명령어까지 출력
make setup     # 프론트엔드 + 백엔드 의존성 설치, 에이전트 심볼릭 링크 구성

cp .env.example .env
cp backend/.env.example backend/.env
make doctor    # BETTER_AUTH_SECRET 자동 생성

make up        # Postgres(:5433) + PowerSync(:8080) 컨테이너 기동
make run       # 백엔드(:8000) + 프론트엔드(:1420)
```

이후 `http://localhost:1420`에서 계정을 만들고, 설정에서 모델을 추가한 뒤 대화합니다.

네이티브 앱으로 실행하려면:

```sh
bun tauri:dev:desktop   # macOS / Windows / Linux
bun tauri:dev:ios       # iOS 시뮬레이터
bun tauri:dev:android   # Android 에뮬레이터
```

자주 막히는 지점 (문서에 정리되어 있음):

- `make up` 포트 충돌 → `5433` / `8080` 점유 프로세스 종료
- Postgres 데이터 포맷 에러 → `make nuke` (로컬 DB 초기화)
- `BETTER_AUTH_SECRET` 에러 → `make doctor` 또는 `openssl rand -base64 32`
- 리눅스 데스크톱 빌드 → GTK/WebKit 개발 패키지 선행 설치 필요

유용한 Makefile 타겟: `make doctor` / `run` / `up` / `down` / `nuke` / `check` / `format`

### 3-2. CLI (터미널 코딩 에이전트)

```sh
curl -fsSL https://raw.githubusercontent.com/thunderbird/thunderbolt/main/install.sh | sh
```

바이너리 하나가 `~/.local/bin/thunderbolt`에 설치됩니다. 데몬도, 별도 서버도 없습니다.
도구는 **bash · read · write · edit · webfetch** 5개이며, 일부 프로바이더에서는 네이티브 웹 검색도
사용합니다. Pi 하네스 기반이고, 단발 프롬프트 또는 대화형 REPL로 동작합니다.

---

## 4. 플러그인인가, 스킬인가, MCP인가

**세 가지 다 아닙니다.** Thunderbolt는 부품이 아니라 **완제품 애플리케이션**입니다.

혼동이 생기는 이유는 저장소 안에 성격이 다른 세 레이어가 함께 있기 때문입니다.

| 레이어 | 정체 | 위치 |
| --- | --- | --- |
| 앱 본체 | 완제품 AI 채팅 앱 | `src/`, `backend/` |
| MCP 클라이언트 | MCP 서버를 **불러다 쓰는 쪽** (Preview) | `mcp_servers` / `mcp_secrets` 테이블, `src/lib/mcp-connection-test.ts` |
| 개발용 AI 자동화 | 이 저장소를 고칠 때 쓰는 Claude Code 스킬·커맨드 | `.claude/`, `.thunderbot/` |

정리하면:

- Thunderbolt는 MCP **서버가 아니라 호스트/클라이언트**입니다.
- 자체 "Skills" 개념도 있으나 아직 계획 단계입니다 (`src/defaults/skills.ts`, `src/skills/`).
- `.claude/commands/`의 슬래시 커맨드는 **앱 기능이 아니라 저장소 개발 도구**입니다.

`.claude/`에 들어있는 개발 자동화 자산:

| 커맨드 | 역할 |
| --- | --- |
| `/thunderup` | 개발 환경 부트스트랩 |
| `/thundercheck` | 타입체크 + 린트 + 포맷 검사 |
| `/thunderpush` | 스테이징 · 커밋 · 푸시 (이 저장소에서는 git을 직접 쓰지 않는 규칙) |
| `/thunderfix` | PR 리뷰 코멘트 및 CI 실패 수정 |
| `/thunderbot` | 태스크 수령 → 구현 → 리뷰 → PR 자율 실행 |

전용 리뷰 에이전트: `powersync-sync-reviewer`, `react-effect-reviewer`, `thunder-deep-review`

---

## 5. API 토큰이 필요한가

**필요합니다. 단, 무료 경로가 있습니다.**

Thunderbolt는 자체 추론 엔드포인트를 제공하지 않습니다. README 표현 그대로
"There is no Thunderbolt-hosted inference endpoint — you bring your own API keys."

| 방법 | 토큰 | 비용 |
| --- | --- | --- |
| Ollama / llama.cpp (로컬) | 불필요 | 무료 |
| Anthropic / OpenAI / Mistral / Fireworks | 필요 | 사용량 과금 |
| OpenRouter (다수 모델 단일 키) | 필요 | 사용량 과금 |

코드상 지원 프로바이더 열거값 (`src/db/tables.ts`):

```
'openai' | 'custom' | 'openrouter' | 'thunderbolt' | 'anthropic' | 'tinfoil'
```

`custom`이 있어 OpenAI 호환 엔드포인트는 무엇이든 연결할 수 있습니다 (국내 LLM 포함).

### 자격증명 취급 방식 (보안상 중요)

비밀값은 **로컬 전용 테이블**에 저장되며 동기화되지 않습니다. `src/db/tables.ts`의 주석이
이를 명시합니다.

| 테이블 | 저장 내용 | 동기화 |
| --- | --- | --- |
| `models_secrets` | 모델 API 키 | 안 됨 (로컬 전용) |
| `integrations_secrets` | Google / Microsoft OAuth 토큰 | 안 됨 (로컬 전용) |
| `mcp_secrets` | MCP 서버 베어러 토큰 / API 키 | 안 됨 (로컬 전용) |

추가로 텔레메트리 정책(`TELEMETRY.md`)에 "이벤트 속성에 프롬프트, 응답, API 키, 사용자 작성
콘텐츠를 절대 포함하지 않으며, 전송 전 `apiKey` 속성을 스크럽한다"고 규정되어 있습니다.

그 밖에 필요한 것:

- `BETTER_AUTH_SECRET` — `make doctor`가 생성
- 현재는 **로그인이 필수** (완전 오프라인 모드는 아직 미완)
- CLI는 자체 프로바이더 키를 별도로 사용

---

## 6. 왜 GitHub에서 주목받는가

2026-09-18 기준 실측치입니다.

| 항목 | 값 |
| --- | --- |
| Stars | 4,774 |
| Forks | 327 |
| 생성 | 2025-07-23 |
| 주 언어 | TypeScript |
| 토픽 | `ai`, `ai-agents`, `llms`, `on-device-ai` |

이유를 다섯 가지로 정리하면:

1. **Mozilla라는 이름값** — Firefox / Thunderbird 계열에 대한 신뢰. 실제로 Mozilla 그랜트 지원.
2. **시기적으로 맞는 문제 정의** — 대화가 학습에 쓰이는 것에 대한 거부감, 사내 자료 외부 전송
   금지 정책, 로컬 LLM(Ollama) 확산이 겹친 타이밍.
3. **진짜 오픈소스** — MPL-2.0. 배포 자산(Docker / K8s / Pulumi)까지 전부 공개.
4. **단일 코드베이스 6개 플랫폼** — Tauri 2 활용 사례로서의 참고 가치.
5. **문서 품질** — `docs/architecture/`가 "무엇을"이 아니라 "왜 이렇게"까지 기록.

다만 **스타 수는 기대치이지 완성도가 아닙니다.** 핵심 기능 상당수가 Preview이고,
보안 감사도 진행 중입니다.

---

## 7. 로컬 에이전트 구축에 도움이 되는가

도움이 됩니다. 특히 **읽기용 참고가 아니라 실제로 떼어 쓸 수 있는 부품**이 있습니다.

| 자산 | 해결해주는 문제 |
| --- | --- |
| `cli/` | 동작하는 최소 구성 로컬 에이전트 (도구 5개, 데몬 없음) |
| `shared/agent-tool-permissions.ts` | **에이전트 도구 권한 제어** — 로컬 에이전트에서 반드시 마주치는 문제. 테스트 포함 |
| `src/ai/retry-budget.ts` | 재시도 폭주 방지 |
| `src/ai/web-tool-budget.ts`, `turn-web-budget.ts` | 도구 호출 예산 제한 |
| `src/ai/step-logic.ts` | 에이전트 스텝 루프 제어 |
| `src/ai/smooth-chunking.ts` | 스트리밍 출력 안정화 |
| `src/ai/eval/` | **에이전트 성능 평가 하네스** (베이스라인 생성·비교·캘리브레이션) |
| `src/acp/`, `crates/thunderbolt-acp-client` | 외부 에이전트 연결 (ACP) |
| `src/acp/iroh`, `shared/iroh.ts` | iroh P2P 전송 — 원격 기기의 에이전트 호출 |
| `src/dal/`, `src/db/` | Drizzle + SQLite 로컬 상태·기억 패턴 |
| `.claude/`, `.thunderbot/` | 에이전트 오케스트레이션·리뷰 자동화 패턴 |

한계도 있습니다. 이 저장소는 **브라우저 우선** 설계라 전체를 에이전트 프레임워크로 쓰기에는
무겁습니다. 터미널 에이전트만 필요하면 `cli/` + `shared/agent-*`만 떼어 오는 편이 낫습니다.

추천 읽기 순서: `cli/src` → `shared/agent-tool-permissions.ts` → `src/ai/step-logic.ts`

---

## 8. 수익화 검토

### 8-1. 먼저: 공식팀의 수익 방향 (코드 근거)

전략을 세우기 전에 원작자가 어디로 가는지 확인해야 합니다. 저장소에 근거가 남아 있습니다.

| 코드 근거 | 해석 |
| --- | --- |
| `backend/src/pro/exa.ts` (인증 + 레이트리밋 게이트) | 호스팅 웹검색 = 유료 "Pro" 티어 |
| `backend/src/tinfoil/`, 모델의 `isConfidential`, `CONFIDENTIAL_API_KEYS_ENABLED` | 기밀 연산 추론 = 프리미엄 기능 |
| `THUNDERBOLT_INFERENCE_URL` / `_API_KEY` | 자체 추론 엔드포인트 판매 여지 |
| `AUTH_MODE=oidc\|saml` + Keycloak 번들 | 엔터프라이즈 SSO |
| `DEBUG_TRANSCRIPT_UPSTREAM_KEY` ("Thunderbolt 팀이 발급", "호스팅 배포만 활성화") | 자체 호스팅 서비스 운영 중 |
| README "Enterprise features, support, and FDEs available" | 이미 엔터프라이즈 지원·파견 엔지니어를 판매 |

따라서 **정면 충돌을 피해야 하는 영역**은 글로벌 SaaS 호스팅, 웹검색 유료화, 자체 추론 판매,
글로벌 대기업 직접 계약입니다.

반대로 **비어 있는 영역**은 한국어·국내 규제 대응, 국내 현장 구축과 교육, 국내 업무 프로세스에
맞춘 업종 특화, 한국어 콘텐츠입니다. 미국 조직이 수행하기 어려운 영역입니다.

### 8-2. MPL-2.0에서 가능한 것과 주의할 것

MPL은 **파일 단위 카피레프트**이며 GPL보다 상업화에 유연합니다.

가능:

- 유료 판매 (구축비 · 구독 · 라이선스)
- **새로 추가한 파일의 코드는 비공개 유지**
- 사내 전용 개조 (배포하지 않으면 공개 의무 없음)
- 독점 소프트웨어와 결합
- SaaS 제공 (AGPL과 달리 소스 공개 의무 없음)

주의:

- **기존 파일을 수정해 배포하면 그 파일은 공개 의무** → 기존 파일은 호출만 하고 로직은
  새 파일에 두는 방식이 유리
- 파일 상단 MPL 헤더 제거는 위반
- **"Thunderbolt" / "Thunderbird" 상표는 사용 불가** (MPL은 상표권을 부여하지 않음) → 별도 브랜드 필요

실제 계약 전에는 IT 전문 변호사 검토를 권합니다. 이 문서는 법률 자문이 아닙니다.

### 8-3. 수익 모델 비교

아래 금액은 국내 SI / SaaS 관행에 근거한 **추정치**이며, 실제 시장 검증이 필요합니다.

| 모델 | 초기비용 | 수익성 | 난이도 | 반복수익 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| 1. 온프레미스 구축 SI | 낮음 | 매우 높음 | 영업 난이도 높음 | 없음 | 최우선 |
| 2. 업종 특화 제품 | 중간 | 높음 | 중간 | 있음 | 최우선 |
| 3. 한국 특화 포크 제품화 | 높음 | 높음 | 높음 | 있음 | 중기 |
| 4. 교육 / 콘텐츠 | 거의 없음 | 중간 | 낮음 | 부분 | 즉시 시작 |
| 5. 부품 · 컴포넌트 판매 | 낮음 | 중간 | 중간 | 부분 | 부업 |
| 6. 관리형 호스팅 SaaS | 높음 | 중간 | 높음 | 있음 | 비권장 |

#### 모델 1 — 온프레미스 구축 SI

대상: 망분리 규제 금융·보험, 병원, 공공·지자체, 제조 대기업, 법무법인 등
"데이터를 외부로 보낼 수 없는" 조직.

제공 범위: 서버 설치(Docker/K8s 자산 기존 활용), 사내 SSO 연동(OIDC/SAML 기능 기존 보유),
로컬 LLM 세팅(Ollama/vLLM), 사내 문서 연결용 MCP 서버 개발, 브랜딩 교체, 임직원 교육 및 운영 매뉴얼.

가격 추정: PoC 500만~1,500만 / 본 구축 3,000만~1억 / 연 유지보수 구축비의 15~20%.

진입 경로: 1곳에 저비용 PoC로 레퍼런스 확보 → 동일 업종 확장 → 업종 세미나 발표.

리스크: 보안 감사 미완료. 계약서에 평가·PoC 단계임을 명시하고 감사 일정을 로드맵으로 제시.

#### 모델 2 — 업종 특화 제품

범용 영역은 상용 서비스와 경쟁하기 어렵지만, 좁고 깊은 업무는 경쟁 우위를 만들 수 있습니다.
위젯(`src/widgets/`), 자동화(`src/automations/`), 스킬 구조가 이미 모듈화되어 있어 재활용이 쉽습니다.

후보: 세무(전자세금계산서 파싱 위젯 + 세법 개정 브리핑), 법무(판례 검색 MCP + 계약서 리스크 검토),
의료(의무기록 요약, 원내 전용), 제조(매뉴얼 기반 현장 질의 + 태블릿 앱), 교육(교재 기반 Q&A).

가격 추정: 사무소/사업장당 월 10만~50만 구독, 대형 구축은 별도.

장점: 문제가 명확해 영업 설득이 쉽고, 구독 구조라 반복 수익이 발생하며, 하나를 만들면
동일 업종 전체로 확장됩니다.

#### 모델 3 — 한국 특화 포크 제품화

국내 LLM 프리셋, 한국어 UX, 국내 그룹웨어 연동 MCP, 비개발자용 설치 마법사, 그리고
**ISMS-P / 개인정보 영향평가 대응 문서 팩**을 묶은 제품. 기업 보안심사 통과가 가장 큰 관문인데,
로컬 전용 비밀 테이블, 텔레메트리 비활성화 가능, 전체 소스 공개(심사관이 직접 검증 가능)라는
성질이 그대로 세일즈 포인트가 됩니다. "보안심사 대응 자료집"이 실질적 차별화 요소입니다.

제품화 비용이 크므로 모델 1로 현금 흐름을 만든 뒤 진행하는 것이 안전합니다.

#### 모델 4 — 교육 / 콘텐츠

초기 비용이 거의 없고 즉시 시작할 수 있으며, 모델 1·2의 영업 파이프라인 역할을 합니다.
국내에 이 스택을 다루는 콘텐츠가 드뭅니다.

주제 후보: 사내 AI 서버 직접 구축, React 19 + Tauri 2 멀티플랫폼 앱, 로컬 AI 에이전트 만들기(`cli/` 분석),
**AI에게 코딩 규칙 가르치기(`CLAUDE.md` 작성법)**, Ollama 기반 무료 사내 AI.

가격 추정: 온라인 강의 5만~15만/수강생, 기업 출강 200만~500만/회, 전자책 2만~5만.

#### 모델 5 — 부품 판매

`shared/agent-tool-permissions.ts`를 발전시킨 에이전트 권한 라이브러리, `src/ai/eval/` 기반 평가 도구,
국내 서비스 연동 MCP 서버 팩, `src/components/chat/` 기반 채팅 UI 킷 등.

#### 모델 6 — 관리형 호스팅 SaaS (비권장)

공식팀이 준비 중인 영역과 정면 충돌하고, 서버비 선투자와 24/7 운영 부담이 큽니다. 무엇보다
"데이터 소유"라는 제품 가치와 모순됩니다. 진행한다면 **고객 전용 VPC에 설치하고 운영만 대행**하는
형태여야 모순이 해소됩니다.

### 8-4. 90일 실행 계획 (권장 조합: 4 → 1 → 2)

```
1~30일   로컬 완전 구동, Ollama 연동 "무료 사내 AI" 데모 완성,
         구축 과정 콘텐츠 3편 발행, 타겟 업종 1개 선정
31~60일  업종 데모(위젯 1 + 스킬 1) 제작, 지인 회사 1곳 PoC 제안,
         보안심사 대응 자료집 v1 작성, 브랜딩 교체(새 이름)
61~90일  PoC 결과를 레퍼런스로 정리, 동일 업종 3곳 유료 제안,
         강의/전자책 1개 출시, 첫 계약 목표
```

업종 선정 기준: (1) 이미 인맥이 있는 업종 — 첫 고객이 가장 어렵습니다, (2) 데이터를 외부로
보낼 수 없는 업종, (3) 반복 업무가 많은 업종.

### 8-5. 피해야 할 함정

| 함정 | 이유 |
| --- | --- |
| 이름을 그대로 사용 | 상표권 침해. MPL은 상표 사용권을 주지 않음 |
| 완성품처럼 판매 | 공식적으로 "프로덕션 미권장" 상태. 사고 시 책임 문제 |
| Preview 기능을 숨김 | 동기화·E2E 암호화는 Preview. 고지 필요 |
| 글로벌 SaaS 도전 | 공식팀이 준비 중이며 자본 격차가 큼 |
| 기존 파일을 광범위하게 수정 | MPL 공개 의무 발생. 새 파일 전략 권장 |
| AI 성능 보장 약속 | 모델은 자체 제작물이 아님. 계약서에 면책 조항 필요 |
| 단독으로 대기업 SLA 계약 | 24/7 대응 불가. 파트너 필요 |

---

## 9. React / PHP로 만들 수 있는가

### React

**이미 React입니다** (`react ^19.2.1`). 새로 만들 필요가 없고, React 경험이 있으면 바로 참여할 수
있습니다. 다만 낯설 수 있는 요소가 있습니다.

| 요소 | 체감 난이도 |
| --- | --- |
| React 19 (`useOptimistic`, `useTransition`, `useEffectEvent`) | 중 |
| TypeScript 엄격 규칙 (`any` 금지) | 중 |
| Tailwind 4 (responsive 테마 변수 오버라이드) | 낮음 |
| Drizzle + 브라우저 내 SQLite / PowerSync | 높음 |

프로젝트 규칙은 `CLAUDE.md`와 `AGENTS.md`에 상세히 문서화되어 있습니다.

### PHP

프론트엔드는 PHP로 대체할 수 없습니다. 채팅 화면이 브라우저 안에서 로컬 SQLite(WASM),
스트리밍 응답, 클라이언트 측 E2E 암호화, 오프라인 동작을 수행해야 하기 때문입니다.

반면 **백엔드는 PHP로 대체 가능**합니다. 백엔드의 실질은 REST API이기 때문입니다.

| 현재 (Bun / Elysia) | PHP 대체안 |
| --- | --- |
| Better Auth | Laravel Sanctum / Passport |
| Drizzle + Postgres | Eloquent |
| `/v1/proxy` (업스트림 중계) | Guzzle |
| React Email + Resend | Laravel Mail |
| PowerSync JWT 발급 | `firebase/php-jwt` |
| PowerSync 동기화 엔진 | 대체 불가 — 별도 서비스로 유지하거나 기능 포기 |

선택지 비교:

| 방안 | 기간 | 결과 |
| --- | --- | --- |
| A. 현 저장소를 그대로 커스터마이즈 | 수 주 | 기능 100% 유지. **권장** |
| B. 프론트엔드 재활용 + PHP 백엔드 | 수 개월 | 동기화 기능 포기 |
| C. React + Laravel로 미니 버전 자체 구현 | 2~3주 (MVP) | 채팅 + 모델 선택 수준. **학습 목적으로 권장** |
| D. 전체 PHP 재작성 | 수천 시간 | 실익 없음. 비권장 |

---

## 10. 참고 문서

| 문서 | 내용 |
| --- | --- |
| `docs/introduction.md` | 프로젝트 개요, 기능 상태표 |
| `docs/development/quick-start.md` | 로컬 부트스트랩 전체 절차 |
| `docs/self-hosting/configuration.md` | 백엔드 환경변수 전체 레퍼런스 |
| `deploy/README.md` | Docker Compose · Helm · Pulumi 배포 |
| `docs/architecture/` | 동기화, E2E 암호화, 계정·기기 관리 등 설계 문서 |
| `docs/faq.md` | 자금 출처, Thunderbird와의 관계 등 |
| `TELEMETRY.md` | 수집 이벤트 및 프라이버시 정책 |
| `CLAUDE.md`, `AGENTS.md` | 코딩 규칙 및 아키텍처 불변 조건 |
| `cli/README.md` | CLI 에이전트 설치·사용 |

---

*작성일: 2026-09-18 · 저장소 상태 기준: `v0.1.133`*
