# TEMPLATE.md

이 프로젝트를 **여러 사이트의 공통 베이스 템플릿**으로 쓰기 위한 문서. 새 사이트를 만들 때 "공통으로 가져가는 것 / 사이트마다 갈아끼우는 것"을 분리해 정리한다.

현재 상태(구현·컨벤션 전반)는 [`CLAUDE.md`](CLAUDE.md) 참고. 이 문서는 그 위에 얹히는 **재사용 전략**만 다룬다.

---

## 1. 공통 스택 (Template Core)

어느 사이트를 만들든 **그대로 유지**하는 부분.

### 1.1 기술 스택

- Next.js 16 App Router + React 19 + TypeScript 5
- Supabase (Auth + Postgres + Storage) — `@supabase/ssr`
- Tiptap 3 리치 에디터 스택
- Tailwind CSS v4 + shadcn/ui + Base UI
- Zustand, Framer Motion, GSAP, Three.js(R3F)
- Nodemailer (문의 폼), jsPDF (내보내기)

### 1.2 공통 아키텍처

| 영역 | 공통 파일/패턴 | 재사용 방식 |
|---|---|---|
| 멀티테넌트 헤더 주입 | [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts), [`src/middleware.ts`](src/middleware.ts) | 그대로 유지. `x-tenant-id` 키 값만 바꿈 |
| Supabase 클라이언트 분리 | [`src/lib/supabase/`](src/lib/supabase/) (`browser.ts` / `server.ts` / `client.ts`) | 그대로 |
| 관리자 RBAC | [`src/lib/auth.ts`](src/lib/auth.ts) + `tenant_memberships` 테이블 | 스키마·헬퍼 그대로, role 체계(`super_admin > admin > editor > viewer`) 유지 |
| 어드민 라우트 게이트 | [`src/middleware.ts`](src/middleware.ts) | 그대로 |
| Server Actions 배치 | 각 라우트 폴더의 `actions.ts` + [`src/app/admin/_lib/article-actions.ts`](src/app/admin/_lib/article-actions.ts) | 관례 유지 |
| Tiptap 에디터 | [`src/components/admin/TiptapEditor.tsx`](src/components/admin/TiptapEditor.tsx) + Toolbar + SlashCommandMenu | 그대로. 커스텀 노드만 사이트별로 교체 |
| 공용 렌더러 | [`src/components/shared/TiptapRenderer.tsx`](src/components/shared/TiptapRenderer.tsx) | 그대로 |
| 이미지 업로드 엔드포인트 | [`src/app/api/admin/upload-image/`](src/app/api/admin/upload-image/) | 그대로. Storage 버킷 이름만 맞춤 |
| 문의 폼 | [`src/app/api/contact/route.ts`](src/app/api/contact/route.ts) + Nodemailer | 그대로. SMTP env만 교체 |
| 콘텐츠 포맷 유틸 | [`src/lib/content.ts`](src/lib/content.ts) | 그대로 (Tiptap JSON 취급) |
| 어드민 UI 프리미티브 | [`src/components/admin/ArticleTable.tsx`](src/components/admin/ArticleTable.tsx), `ArticleFormShared.tsx` | 그대로 |
| 공통 레이아웃/프로바이더 | [`src/components/layout/`](src/components/layout/), [`src/components/providers/`](src/components/providers/) | 구조 유지, 브랜딩만 교체 |

### 1.3 공통 DB 스키마 (Supabase)

새 프로젝트에서 재현해야 하는 최소 테이블·정책.

**`articles` 테이블** (피드·포트폴리오 통합 저장소)
- `id uuid PK`, `tenant_id uuid`, `category text` (`'feed' | 'portfolio'`)
- `slug text`, `title text`, `excerpt text`, `content jsonb` (Tiptap JSON)
- `metadata jsonb` (사이트별 자유 필드), `cover_image_url text`
- `status text` (`'draft' | 'published'`), `sort_order int`
- `published_at timestamptz`, `deleted_at timestamptz` (soft delete)
- `created_at`, `updated_at`

**`tenant_memberships` 테이블** (RBAC)
- `tenant_id uuid`, `user_id uuid`, `role text` (`super_admin | admin | editor | viewer`)

**RLS 정책**
- `articles_select_published` — `current_setting('request.headers')::json->>'x-tenant-id' = tenant_id::text AND status = 'published'`
- 어드민 쓰기 정책 — `tenant_memberships`에 해당 사용자·테넌트의 `editor+` 역할이 있을 때만 허용

**Storage 버킷**
- 이미지 업로드용 public 버킷 1개 (어드민 에디터 붙여넣기·드래그용)

---

## 2. 사이트별 커스터마이즈 포인트 (Per-Site)

새 사이트마다 **반드시 바꾸거나 선택적으로 갈아끼우는** 영역.

### 2.1 반드시 교체

| 항목 | 위치 | 비고 |
|---|---|---|
| 테넌트 ID 상수 | [`src/lib/supabase/tenant.ts`](src/lib/supabase/tenant.ts) | 사이트별 UUID 신규 발급 후 교체 |
| Supabase URL/키 | `.env.local` | 프로젝트를 공유하면 같은 키, 분리하면 새 키 |
| 사이트 메타데이터 | [`src/app/layout.tsx`](src/app/layout.tsx) (`metadata` export), [`opengraph-image.tsx`](src/app/opengraph-image.tsx), [`twitter-image.tsx`](src/app/twitter-image.tsx), [`sitemap.ts`](src/app/sitemap.ts), [`robots.ts`](src/app/robots.ts) | 타이틀/설명/도메인 |
| 정적 카피 데이터 | [`src/data/`](src/data/) (`about.ts`, `faq.ts`, `pricing.ts` 등) | 사이트마다 내용이 다름 |
| 브랜딩 자산 | [`public/logo.*`](public/), `public/images/`, `public/ink/` | 로고·파비콘·OG 이미지 |
| 헤더/푸터 카피 | [`src/components/layout/Header.tsx`](src/components/layout/Header.tsx), [`Footer.tsx`](src/components/layout/Footer.tsx) | 메뉴 구성·회사 정보 |
| SMTP 환경변수 | `.env.local` | Nodemailer용 — 사이트마다 발송자 다름 |

### 2.2 선택적으로 교체 / 삭제

| 기능 | 위치 | 판단 기준 |
|---|---|---|
| 홈 3D 히어로 | [`src/components/three/`](src/components/three/), [`public/models/`](public/models/), [`public/textures/`](public/textures/) | 3D가 필요 없는 사이트면 전부 삭제 → R3F 의존성도 제거 |
| Portfolio 섹션 | [`src/app/portfolio/`](src/app/portfolio/), [`src/app/admin/portfolio/`](src/app/admin/portfolio/), [`src/components/portfolio/`](src/components/portfolio/), [`src/lib/db/portfolio.ts`](src/lib/db/portfolio.ts) | 포트폴리오가 없는 사이트면 통째로 제거 (articles.category='portfolio' 컬럼은 남겨도 무해) |
| Feed(블로그) 섹션 | [`src/app/feed/`](src/app/feed/), [`src/app/admin/feed/`](src/app/admin/feed/), [`src/components/feed/`](src/components/feed/), [`src/lib/db/feed.ts`](src/lib/db/feed.ts) | 블로그가 없으면 제거 |
| Pricing 페이지 | [`src/app/pricing/`](src/app/pricing/), [`src/components/pricing/`](src/components/pricing/), [`src/data/pricing.ts`](src/data/pricing.ts) | B2C 제품이면 유지, B2B/에이전시면 제거 고려 |
| PDF 내보내기 | [`src/components/pdf/`](src/components/pdf/) | 미사용 시 `jspdf`, `jspdf-autotable` 의존성까지 제거 |
| Tiptap 커스텀 노드 | [`src/components/admin/TiptapCustomNodes.tsx`](src/components/admin/TiptapCustomNodes.tsx) (Highlights / Deliverables / Activity) | 포트폴리오 전용 — 사이트 성격에 맞게 추가·삭제·교체 |
| 레거시 `Block[]` 호환 | [`src/components/shared/BlockRenderer.tsx`](src/components/shared/BlockRenderer.tsx), [`src/lib/content.ts`](src/lib/content.ts)의 `isLegacyBlocks` 분기 | 신규 사이트는 기존 레코드가 없으므로 **삭제해도 됨**. 삭제 시 저장·로드 경로를 Tiptap JSON 단일 포맷으로 단순화 |

---

## 3. 신규 사이트 시작 체크리스트

```
[ ] 1. 이 저장소를 템플릿으로 clone / 새 Next.js repo 생성
[ ] 2. Supabase 프로젝트 준비
      - 별도 프로젝트로 갈 것인지, 같은 프로젝트에 tenant만 추가할 것인지 결정
[ ] 3. 새 tenant UUID 발급 → src/lib/supabase/tenant.ts 교체
[ ] 4. DB 스키마 적용 (articles, tenant_memberships, RLS 정책, Storage 버킷)
[ ] 5. 초기 관리자 계정을 tenant_memberships에 insert (role='super_admin')
[ ] 6. .env.local 작성 (Supabase 키 + SMTP)
[ ] 7. 브랜딩 교체 (logo, favicon, OG 이미지, 사이트 메타데이터)
[ ] 8. 정적 데이터 교체 (src/data/*.ts)
[ ] 9. 쓰지 않는 섹션 제거 (Portfolio/Feed/Pricing/3D/PDF 중 불필요한 것)
[ ] 10. Tiptap 커스텀 노드를 사이트 성격에 맞게 조정
[ ] 11. npm run dev로 스팟체크 → /admin 로그인 → 첫 글 작성 테스트
[ ] 12. npm run build 성공 확인 후 배포
```

---

## 4. 추천: 상위 템플릿 레포로 승격

사이트를 2개 이상 만들 예정이면 **이 저장소를 "템플릿 전용 레포"로 분리**하고 사이트별 레포는 거기서 파생시키는 것을 권장.

**후보 구조**:

```
produck-template/          # 이 저장소를 이 상태로 유지 (공통만)
├── src/
│   ├── app/admin/         # 공통: 어드민 CRUD
│   ├── app/(marketing)/   # 공통: feed, portfolio, pricing, contact (필요한 것만)
│   ├── lib/               # 공통 전부
│   └── components/        # admin/, shared/, ui/, layout/ (공통)
├── CLAUDE.md, TEMPLATE.md, README.md
└── (사이트별 데이터/브랜딩은 최소한으로)

site-foo/                  # 새 사이트 — 템플릿을 초기값으로 clone
├── src/data/              # 사이트 고유
├── public/                # 사이트 고유 브랜딩
└── src/lib/supabase/tenant.ts  # 사이트 고유 tenant UUID
```

**분리 시 주의**: 공통 영역에서 일어난 개선을 사이트 레포로 흘려보내려면 템플릿 레포를 **git subtree / submodule**로 포함하거나, 주기적으로 diff를 cherry-pick 하는 워크플로가 필요. 처음엔 단순 clone으로 시작하고 2~3번째 사이트쯤 되면 판단해도 늦지 않다.

---

## 5. 공통 유지 원칙 (Template Hygiene)

템플릿으로 쓰려면 **다음은 반드시 지킨다**.

1. **사이트 고유 값은 한 파일에만 둔다** — 현재는 [`tenant.ts`](src/lib/supabase/tenant.ts)와 [`src/data/`](src/data/), `public/` 브랜딩이 전부. 새 상수를 하드코딩하지 말고 이 경계를 지킬 것.
2. **공통 컴포넌트에 사이트 고유 문구를 박지 않는다** — "produck" 같은 문자열이 [`src/components/layout/`](src/components/layout/)에 들어가면 템플릿성이 무너진다. 카피는 `src/data/` 또는 메타데이터에서 주입.
3. **스키마 변경은 공통 쪽 우선 반영** — 예: `articles`에 새 컬럼 추가 시 템플릿 레포의 DB 마이그레이션과 타입(`ArticleRow`)을 먼저 고치고, 사이트 레포로 전파.
4. **사이트별 기능 분기는 env / 플래그가 아니라 "파일 삭제"로** — 쓰지 않는 섹션은 라우트·컴포넌트·DB 쿼리까지 제거. 런타임 플래그로 숨기면 유지비가 계속 누적된다.
5. **Tiptap 커스텀 노드는 사이트별 파일로 분리** — 공통 Editor는 건드리지 않고 `TiptapCustomNodes.<site>.tsx` 식으로 주입 배열만 갈아끼우는 형태로 유지.
