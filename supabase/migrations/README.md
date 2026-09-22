# 마이그레이션

순서대로 적용하세요. Supabase 대시보드의 SQL Editor 에 붙여넣거나
`supabase db push` (CLI) 로 실행하면 됩니다.

| 파일 | 내용 |
|---|---|
| `0001_schema.sql` | 테이블·인덱스·`updated_at` 트리거 |
| `0002_rls.sql` | RLS 정책, 관리자 판별, 가입 트리거, 기존 계정 백필 |
| `0003_seed.sql` | 브랜드 21 · 상품 45 · 무드 매핑 106 (`npm run seed` 로 재생성) |
| `0004_order_functions.sql` | 주문 생성·결제 확정·조회·AI 사용량 함수 |
| `0005_fulfillment.sql` | 배송 단계·송장번호 컬럼과 관리자 전용 상태 변경 함수 |

## 적용 후 반드시 할 것

`0004` 는 `shoe_app_secrets` 에 **자리표시자**를 넣습니다. 실제 값으로 바꾸세요.
앱의 `ORDER_CONFIRM_SECRET` 환경변수와 **같은 값**이어야 결제 승인이 동작합니다.

```sql
update public.shoe_app_secrets
   set value = '<여기에 긴 난수>'
 where key = 'order_confirm';
```

## 알아둘 점

- 이 Supabase 프로젝트는 다른 앱과 공유하므로 모든 테이블에 `shoe_` 접두사를 씁니다.
- `shoe_app_secrets` 와 `shoe_tryon_usage` 는 **일부러** 정책을 만들지 않았습니다.
  RLS 가 켜져 있고 정책이 없으면 클라이언트는 접근할 수 없습니다.
- `0002` 의 가입 트리거는 `j1004min@gmail.com` 을 관리자로 지정합니다.
  다른 계정을 쓰려면 그 이메일을 바꾸세요.
