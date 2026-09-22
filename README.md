# SOLE ATELIER

나이키·아디다스·뉴발란스 같은 스포츠 브랜드부터 샤넬·프라다·구찌 같은 명품까지, 여러 브랜드의
신발을 한곳에 모아 파는 **멀티브랜드 슈즈 편집숍**입니다.

기존 신발 쇼핑몰의 두 가지 불편을 푸는 데 집중했습니다.

1. **가격대가 한눈에 안 보인다** → 가격대를 1급 탐색 축으로 올리고 분포를 막대 그래프로 보여줍니다.
2. **신어봐야 안다** → 브라우저에서 바로 합성해보는 **가상 실착 스튜디오**를 넣었습니다.

> 포트폴리오 데모입니다. 결제는 토스페이먼츠 **테스트 키**로만 동작하고 실제 청구·배송은 없습니다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) · React 19 · TypeScript |
| 스타일 | Tailwind CSS v4 · Pretendard |
| 데이터 | Supabase (PostgreSQL + Auth + RLS) |
| 결제 | 토스페이먼츠 v2 SDK (주문서형) |
| AI 실착 | Hugging Face Space (FLUX.1 Kontext) — 선택 |
| 배포 | Vercel (icn1) |

## 주요 기능

### 가격대를 한눈에
`components/price/PriceBandBar.tsx` — 5개 구간 막대 그래프. 회색은 전체 분포, 색은 현재 필터
결과입니다. 막대를 누르면 그대로 필터가 됩니다. 카테고리별로 강조색이 달라 목록에서 색만 봐도
티어가 구분됩니다.

### 무드 추천
하객룩·오피스룩·스포츠룩·산책룩·데이트룩·여행룩·파티룩·캠퍼스룩 8종. 단순 태그가 아니라
헤드라인·설명·스타일링 팁 3개를 갖춘 콘텐츠 페이지입니다.

### 가상 실착 스튜디오 (`/tryon`)
탭이 두 개입니다.

- **합성 실착** — 실제 상품 사진을 캔버스에 올려 위치·크기·회전·반전·그림자를 맞춥니다.
  배경 제거는 테두리 색을 샘플링해 flood fill 하는 방식이라 흰 배경·어두운 배경 모두 처리합니다.
  **사진은 브라우저 밖으로 나가지 않습니다.** 무제한·무료.
- **AI 실착** — FLUX.1 Kontext 로 신은 모습을 생성합니다. `HF_SPACE_ID` 가 설정돼 있을 때만
  활성화되고, 하루 사용 횟수가 제한됩니다. 프롬프트 기반이라 **실제 상품과 디테일이 다를 수
  있다**는 고지를 화면에 항상 띄웁니다.

### 결제 (토스페이먼츠 v2)
금액 위변조를 막는 것이 설계의 핵심입니다.

1. 결제 요청 **전에** `shoe_create_order` (Postgres 함수)가 **상품 테이블 가격으로 금액을 직접
   계산**해 주문을 `PENDING` 으로 만듭니다. 클라이언트는 `slug`·`size`·`quantity` 만 보냅니다.
2. `successUrl` 로 돌아오면 서버가 `shoe_precheck_order` 로 저장된 금액과 대조합니다. 다르면
   **토스를 호출하기 전에** 중단합니다.
3. 금액이 맞을 때만 승인 API 를 부르고, `shoe_confirm_order` 가 한 번 더 검증한 뒤 `PAID` 로
   바꾸고 재고를 차감합니다. 이미 `PAID` 면 다시 승인하지 않습니다(멱등).

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## 환경변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable(anon) 키 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 주문서형 클라이언트 키 |
| `TOSS_SECRET_KEY` | 토스 시크릿 키 (**서버 전용**) |
| `ORDER_CONFIRM_SECRET` | 결제 확정용 서버 전용 값. Supabase `shoe_app_secrets` 의 값과 같아야 합니다 |
| `HF_SPACE_ID` | AI 실착용 Hugging Face Space (없으면 AI 탭 비활성) |
| `HF_TOKEN` | 위 Space 호출용 토큰 |
| `NEXT_PUBLIC_SITE_URL` | 사이트맵에 쓰는 배포 URL (선택) |

**시크릿은 저장소에 커밋하지 않습니다.** 로컬은 `.env.local`, 배포는 Vercel 환경변수에 넣으세요.

Supabase 환경변수가 없어도 `lib/seed-data.ts` 폴백으로 사이트가 뜹니다. 카탈로그는 보이지만
주문·결제·로그인은 동작하지 않습니다.

## 데이터베이스

`supabase/migrations/` 의 SQL 을 순서대로 적용하면 스키마·RLS·시드·함수가 모두 만들어집니다.
자세한 순서와 적용 후 해야 할 일은 [supabase/migrations/README.md](supabase/migrations/README.md)
를 보세요.

## 데이터

`lib/seed-data.ts` 가 카탈로그의 단일 원본입니다(브랜드 20개 · 상품 44개 · 무드 매핑 103건).
고친 뒤 아래를 실행하면 검증과 SQL 생성이 함께 이뤄집니다.

```bash
npm run seed > supabase/migrations/0003_seed.sql
```

검증 항목: slug 중복, 브랜드 존재 여부, **브랜드 티어와 상품 카테고리 일치**, 이미지 중복,
가격/사이즈/alt 누락. 하나라도 걸리면 종료 코드 1로 실패합니다.

## AI 실착 Space 만들기 (선택)

`hf-space/` 의 파일을 Hugging Face Space(Gradio · ZeroGPU)에 올리고 `HF_SPACE_ID` 에
`<계정>/sole-atelier-tryon` 을 넣으면 AI 탭이 켜집니다. ZeroGPU 무료 사용에는 이메일 인증과
계정 생성 30일 경과 조건이 있습니다.

## 배포

GitHub 에 푸시하고 [vercel.com/new](https://vercel.com/new) 에서 저장소를 Import 한 뒤 위
환경변수를 등록하면 끝입니다. 이후 `main` 에 푸시할 때마다 자동 배포됩니다.
