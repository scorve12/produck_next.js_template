# CLAUDE.md

이 저장소에서 Claude Code가 작업할 때 따라야 할 지침·기술 스택·컨벤션을 정리한 문서. 멀티테넌트 템플릿으로 재사용하기 위한 상위 전략은 [`TEMPLATE.md`](TEMPLATE.md) 참고.

---

## 1. 프로젝트 개요

- **목적**: 여러 사이트(포트폴리오·블로그·마케팅 페이지)를 만들 때 재사용하는 **멀티테넌트 Next.js 템플릿**
- **현재 상태**: 인프라 뼈대(Supabase 연결, 멀티테넌트 미들웨어, RBAC, 이미지 업로드, 문의 폼)만 구현됨. UI/어드민/콘텐츠 섹션은 아직 없음
- **멀티테넌트 방식**: 모든 Supabase 클라이언트가 `x-tenant-id` 헤더를 주입하고, DB 쪽은 RLS로 격리

---

## 2. 기술 스택 (실제 설치된 것)

### 런타임·프레임워크
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5.7** (strict, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`)
- **Node** — Next 16 요구사항 기준 (Node 20+)

### 백엔드·데이터
- **Supabase** — `@supabase/ssr` (브라우저·서버), `@supabase/supabase-js` (service role)
- **Nodemailer 6** — 문의 폼 SMTP 발송 (※ 보안 이슈로 7/8 업그레이드 검토 중)

### UI·스타일
- **Tailwind CSS v4** (`@tailwindcss/postcss`, `@theme` 디렉티브 사용)
- **clsx + tailwind-merge** (`cn` 유틸 in [`src/lib/utils.ts`](src/lib/utils.ts))

### 상태·기타
- **Zustand 5** (클라이언트 상태 — 아직 사용처 없음)
- **server-only** (서버 전용 모듈 가드)

### 아직 **설치되지 않은** 것 (TEMPLATE.md 목표와 다름)
TEMPLATE.md는 Tiptap 3, shadcn/ui, Base UI, Framer Motion, GSAP, Three.js(R3F), jsPDF를 언급하지만 현재 `package.json`에는 없음. 필요 시 도입.

---

## 3. 디렉토리 구조 (현재)

```
src/
├── app/
│   ├── api/
│   │   ├── admin/upload-image/route.ts   # editor+ 권한 → Supabase Storage
│   │   └── contact/route.ts              # Nodemailer SMTP
│   ├── layout.tsx                        # 사이트별 교체 (metadata)
│   ├── page.tsx                          # 사이트별 교체 (placeholder)
│   └── globals.css                       # Tailwind v4 엔트리
├── lib/
│   ├── auth.ts                           # RBAC 헬퍼 (requireRole, AuthError)
│   ├── content.ts                        # Tiptap JSON 유틸 (의존성 프리)
│   ├── utils.ts                          # cn(classnames)
│   ├── db/
│   │   ├── articles.ts                   # articles 테이블 CRUD
│   │   ├── feed.ts                       # articles.category='feed' 래퍼
│   │   └── portfolio.ts                  # articles.category='portfolio' 래퍼
│   └── supabase/
│       ├── browser.ts                    # createClient (브라우저)
│       ├── server.ts                     # createServerClient / createAuthServerClient
│       └── tenant.ts                     # TENANT_ID / TENANT_HEADER
├── types/
│   └── article.ts                        # ArticleRow, ArticleInsert, ArticleUpdate
└── proxy.ts                              # 테넌트 헤더 주입 + /admin 게이트
```

---

## 4. 핵심 아키텍처 규칙

### 4.1 Supabase 클라이언트 선택
두 가지 중 **반드시** 상황에 맞는 것을 쓴다.

| 파일 | 언제 사용 | 비고 |
|---|---|---|
| [`src/lib/supabase/browser.ts`](src/lib/supabase/browser.ts) | 클라이언트 컴포넌트 | `"use client"` 안에서만 |
| [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) | Server Component, Route Handler, Server Action | 사용자 세션 기반 → **RLS 적용** |

- `server.ts`는 `import "server-only"`로 보호됨. 이 가드를 우회하지 말 것.
- service role이 필요해지면 먼저 **RLS 정책을 고치는 게 맞는지** 재검토.

### 4.2 멀티테넌트 헤더
- [`src/lib/supabase/tenant.ts`](src/lib/supabase/tenant.ts)의 `TENANT_ID`가 모든 Supabase 요청에 `x-tenant-id` 헤더로 주입됨
- Postgres RLS 정책은 `current_setting('request.headers')::json->>'x-tenant-id'`로 읽어서 필터링
- **사이트 생성 시 이 값만 바꾸면 테넌트가 분리**됨 (env `NEXT_PUBLIC_TENANT_ID` 우선, 없으면 하드코드된 UUID)

### 4.3 RBAC
- 역할: `viewer < editor < admin < super_admin` (in [`src/lib/auth.ts`](src/lib/auth.ts))
- 보호해야 하는 API/Server Action은 **항상** 시작부에 `await requireRole("editor")` 패턴으로
- `AuthError`를 잡아서 401/403으로 내림 — 예시: [`upload-image/route.ts:18-26`](src/app/api/admin/upload-image/route.ts#L18-L26)

### 4.4 `/admin` 게이트
- [`src/proxy.ts`](src/proxy.ts)가 `/admin/*` 전체를 커버
- 비로그인 → `/login?next=...`, 테넌트 멤버십 없음 → `/`
- **미들웨어에서 세션 쿠키도 갱신**하므로 어떤 경로에서도 이 미들웨어를 비활성화하지 말 것 (`matcher` 수정 시 주의)

### 4.5 콘텐츠 저장 포맷
- `articles.content`는 **Tiptap JSON** (`TiptapNode`) — [`src/lib/content.ts`](src/lib/content.ts) 참고
- `content.ts`는 **의존성 프리**. 서버 잡(excerpt 생성, 검색 인덱싱 등)에서 Tiptap 번들을 로드하지 않기 위함. 이 원칙 깨지 말 것.
- 발췌는 `buildExcerpt(content)`, 변환·비교는 여기 유틸만 사용.

### 4.6 Articles 테이블 일원화
- `feed`·`portfolio` 둘 다 `articles` 테이블의 `category` 컬럼으로 구분
- `src/lib/db/feed.ts`·`portfolio.ts`는 얇은 래퍼일 뿐, 실제 쿼리는 [`articles.ts`](src/lib/db/articles.ts)에 집중
- 새 콘텐츠 타입이 생겨도 **가능하면 `category` 값 추가로 해결**. 테이블 늘리기 전에 재검토.
- Soft delete 전용 (`deleted_at`) — hard delete 금지.

---

## 5. 코드 컨벤션

### 5.1 TypeScript
- `strict: true` + `noUncheckedIndexedAccess: true` — 배열 인덱싱 결과는 항상 `| undefined`로 취급해야 함
- 경로 별칭: `@/*` → `./src/*`
- 환경변수는 `process.env.X!` non-null assertion 허용 (런타임에 없으면 어차피 터뜨리는 게 맞음). 단, 사용자 입력을 받는 API에서는 반드시 존재 검증 후 500 반환 — 예시: [`contact/route.ts:46-48`](src/app/api/contact/route.ts#L46-L48)

### 5.2 ESLint
- [`eslint.config.mjs`](eslint.config.mjs) 기반 (`next/core-web-vitals`, `next/typescript`)
- 미사용 변수는 `_` 접두사로 무시 가능 — 불필요한 파라미터에 이 규칙을 악용하지 말고, 진짜 필요 없으면 지울 것

### 5.3 주석
- **기본은 주석 없음**. 코드가 스스로 설명하게 한다.
- **왜**가 비자명한 곳(숨겨진 제약, 외부 버그 우회, 놀라운 동작)에만 짧은 주석.
- "이 함수는 X를 한다" 같은 **WHAT 주석 금지**.

### 5.4 에러 처리
- DB 에러(`error`)는 `throw error`로 상위로 전파 (in `src/lib/db/*`) — 호출자가 문맥에 맞게 처리
- API 라우트는 status + `{ error: "CODE" }` JSON 일관 패턴. 에러 코드는 `SCREAMING_SNAKE_CASE` 상수 문자열
- 예상 가능한 사용자 에러는 4xx, 설정·외부 시스템 에러는 5xx

---

## 6. 작업 시 지침 (Claude를 위한 규칙)

### 6.1 항상
- `TEMPLATE.md §5`의 "공통 유지 원칙"을 먼저 읽고, 사이트 고유 값이 공통 경로로 새지 않게 한다
- Supabase 클라이언트를 쓸 때마다 `browser / server / service role` 중 어느 것인지 **의식적으로** 선택
- `/admin` 관련 코드를 수정할 때는 미들웨어의 세션 갱신 책임을 해치지 않는지 체크
- 새 DB 컬럼/테이블을 쓸 때는 RLS 정책을 같이 고민. RLS 우회는 최후 수단
- 패키지 추가 전에 TEMPLATE.md가 가정하는 스택 목록과 맞는지 확인 (예: 상태관리는 Zustand, UI는 Tailwind + cn)

### 6.2 절대 하지 말 것
- `"use client"` 컴포넌트에서 `src/lib/supabase/server.ts` import — `server-only` 가드 때문에 빌드가 터진다
- `articles` hard delete — `softDeleteArticle` 사용
- `Block[]` 같은 레거시 포맷 새로 도입 — 콘텐츠는 항상 `TiptapNode`
- `src/components/layout/` 같은 공통 영역에 사이트명·URL·회사 정보를 하드코딩 (TEMPLATE.md §5.2 위반)
- env 값 유무를 런타임 플래그로 쓰는 "기능 켜기/끄기" — TEMPLATE.md §5.4에 따라 파일 삭제로 관리

### 6.3 확장할 때
- 새 어드민 라우트: `/admin/*` 하위 + `requireRole("editor")` 시작부 + Server Action은 `actions.ts`로 분리
- 새 콘텐츠 섹션: 먼저 `articles.category` 값 추가로 해결 가능한지 검토 → 불가능하면 새 테이블 + RLS + tenant_id 패턴 복제
- 새 업로드 엔드포인트: [`upload-image/route.ts`](src/app/api/admin/upload-image/route.ts)를 참고해 권한 체크 → 검증 → Storage 업로드 순서 유지

---

## 7. 명령어

```bash
bash scripts/init.sh # 신규 사이트 초기화 (tenant UUID 교체 + .env.local 생성)
npm run dev          # Next dev 서버
npm run build        # 프로덕션 빌드 (배포 전 반드시 확인)
npm run start        # 프로덕션 서버 (build 후)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

- PR 올리기 전 **`npm run typecheck && npm run build`** 둘 다 통과시키는 게 기본.
- `next lint`는 Next 16 기준 경고만 체크 — 타입 오류는 `typecheck`로 잡는다.

---

## 8. 환경변수

[`.env.local.example`](.env.local.example) 참고. 주요 키:

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 브라우저·서버 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (RLS 우회) — **서버에서만** |
| `NEXT_PUBLIC_TENANT_ID` | 사이트별 테넌트 UUID (없으면 [`tenant.ts`](src/lib/supabase/tenant.ts)의 하드코드 값 사용) |
| `SUPABASE_IMAGE_BUCKET` | 업로드 버킷 이름 (기본 `images`) |
| `SMTP_*`, `SMTP_FROM`, `CONTACT_TO` | 문의 폼 메일 발송 |

`SUPABASE_SERVICE_ROLE_KEY`를 실수로 `NEXT_PUBLIC_*` 네임스페이스에 넣으면 브라우저 번들에 노출된다. 절대 금지.

---

## 9. 향후 npm 패키지 분리 전략

현재는 GitHub Template 방식으로 운영하지만, 추후 `@produck/core` 같은 npm 패키지로 인프라 코드를 분리할 수 있다.

**패키지 후보 (코드가 안정되면 추출)**

| 파일 | 분리 가능 조건 |
|---|---|
| `src/lib/supabase/` | Next.js 의존 없음 (`server.ts`의 `next/headers`만 제거하면 됨) |
| `src/lib/auth.ts` | `tenant_memberships` 스키마가 고정된 후 |
| `src/proxy.ts` | Next.js 미들웨어 API가 안정된 후 |
| `src/lib/content.ts` | 이미 의존성 프리 — 지금 당장도 추출 가능 |

**지금 지켜야 할 원칙 (추출을 쉽게 만들기 위해)**

- `src/lib/supabase/`·`src/lib/auth.ts`·`src/proxy.ts`에 도메인 로직(`articles`, 사이트별 카테고리 등) 섞지 않기
- 위 파일들이 `src/lib/db/*`를 import하는 방향 금지 (단방향 의존: db → supabase, not supabase → db)

---

## 10. 관련 문서

- [`TEMPLATE.md`](TEMPLATE.md) — 멀티테넌트 재사용 전략, 사이트별 커스터마이즈 가이드, 신규 사이트 체크리스트
- [`package.json`](package.json) — 현재 의존성 (이 문서와 항상 일치하는지 확인)
