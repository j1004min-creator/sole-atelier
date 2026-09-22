-- SOLE ATELIER 스키마
--
-- 이 Supabase 프로젝트에는 다른 앱(market_*, budgets, transactions)이 함께 살고 있어
-- 모든 테이블에 shoe_ 접두사를 붙여 네임스페이스를 분리한다.

create or replace function public.shoe_touch_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.shoe_touch_updated_at() from public, anon, authenticated;

create table public.shoe_brands (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  name_ko    text not null,
  category   text not null check (category in ('sports','luxury','contemporary')),
  country    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.shoe_products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  name_ko          text not null,
  brand_id         uuid not null references public.shoe_brands(id) on delete restrict,
  category         text not null check (category in ('sports','luxury','contemporary')),
  shoe_type        text not null check (shoe_type in ('sneakers','running','boots','dress','heels','sandals')),
  price            integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price >= 0),
  description      text not null default '',
  story            text not null default '',
  materials        text not null default '',
  colorway         text not null default '',
  image_url        text not null,
  image_alt        text not null default '',
  images           jsonb not null default '[]'::jsonb,
  sizes            integer[] not null default '{}',
  is_new           boolean not null default false,
  is_bestseller    boolean not null default false,
  stock            integer not null default 20 check (stock >= 0),
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger shoe_products_touch_updated_at
  before update on public.shoe_products
  for each row execute function public.shoe_touch_updated_at();

create table public.shoe_product_moods (
  product_id uuid not null references public.shoe_products(id) on delete cascade,
  mood_id    text not null check (mood_id in
              ('wedding','office','sporty','walk','date','travel','party','campus')),
  primary key (product_id, mood_id)
);

create table public.shoe_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  role         text not null default 'customer' check (role in ('customer','admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger shoe_profiles_touch_updated_at
  before update on public.shoe_profiles
  for each row execute function public.shoe_touch_updated_at();

create table public.shoe_orders (
  id                uuid primary key default gen_random_uuid(),
  order_id          text unique not null,
  user_id           uuid references auth.users(id) on delete set null,
  order_name        text not null,
  amount            integer not null check (amount > 0),
  status            text not null default 'PENDING'
                    check (status in ('PENDING','PAID','FAILED','CANCELED')),
  payment_key       text,
  method            text,
  receipt_url       text,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text,
  shipping_postcode text,
  shipping_address  text,
  shipping_memo     text,
  raw_payment       jsonb,
  fail_code         text,
  fail_message      text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);

create table public.shoe_order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.shoe_orders(id) on delete cascade,
  product_id   uuid references public.shoe_products(id) on delete set null,
  product_name text not null,
  brand_name   text not null,
  size         integer not null,
  quantity     integer not null check (quantity > 0),
  unit_price   integer not null check (unit_price >= 0),
  image_url    text
);

create table public.shoe_wishlists (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.shoe_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- AI 실착 하루 사용량 (무료 GPU 할당량 보호)
create table public.shoe_tryon_usage (
  id       uuid primary key default gen_random_uuid(),
  day      date not null default current_date,
  user_key text not null,
  count    integer not null default 0,
  unique (day, user_key)
);

-- 서버 전용 비밀값. RLS 를 켜고 정책을 만들지 않아 PostgREST 로는 읽을 수 없다.
create table public.shoe_app_secrets (
  key   text primary key,
  value text not null
);

create index shoe_products_category_idx  on public.shoe_products (category);
create index shoe_products_brand_idx     on public.shoe_products (brand_id);
create index shoe_products_price_idx     on public.shoe_products (price);
create index shoe_products_type_idx      on public.shoe_products (shoe_type);
create index shoe_product_moods_mood_idx on public.shoe_product_moods (mood_id);
create index shoe_orders_user_idx        on public.shoe_orders (user_id);
create index shoe_orders_email_idx       on public.shoe_orders (customer_email);
create index shoe_order_items_order_idx  on public.shoe_order_items (order_id);
-- 외래키에는 커버링 인덱스가 있어야 한다. 없으면 상품 삭제·조인에서 풀스캔이 난다.
create index shoe_order_items_product_idx on public.shoe_order_items (product_id);
create index shoe_wishlists_product_idx   on public.shoe_wishlists (product_id);
