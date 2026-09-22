-- RLS 와 인증 트리거
--
-- 핵심 원칙: 주문의 생성·금액변경·상태변경에는 정책을 만들지 않는다.
-- 그 경로는 전부 SECURITY DEFINER 함수(0004)로만 열어 클라이언트가 금액을 만질 수 없게 한다.

-- 관리자 판별. SECURITY DEFINER 라 shoe_profiles 의 RLS 를 우회하므로
-- shoe_profiles 자신의 정책에서 호출해도 무한 재귀가 나지 않는다.
create or replace function public.shoe_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shoe_profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- 신규 가입 시 프로필 생성. 지정한 이메일은 자동으로 관리자가 된다.
-- auth.users 에는 다른 앱의 트리거도 걸려 있으므로 이름을 분리해 공존시킨다.
create or replace function public.handle_new_shoe_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.shoe_profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''), '@', 1)),
    case when lower(coalesce(new.email,'')) = 'j1004min@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_shoe_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_shoe on auth.users;
create trigger on_auth_user_created_shoe
  after insert on auth.users
  for each row execute function public.handle_new_shoe_user();

-- 트리거를 만들기 전에 이미 가입돼 있던 계정 백필.
-- 이게 없으면 기존 계정은 로그인해도 프로필이 없어 관리자 판별이 안 된다.
insert into public.shoe_profiles (id, email, display_name, role)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'display_name', split_part(coalesce(u.email,''), '@', 1)),
       case when lower(coalesce(u.email,'')) = 'j1004min@gmail.com' then 'admin' else 'customer' end
from auth.users u
where not exists (select 1 from public.shoe_profiles p where p.id = u.id);

alter table public.shoe_brands        enable row level security;
alter table public.shoe_products      enable row level security;
alter table public.shoe_product_moods enable row level security;
alter table public.shoe_profiles      enable row level security;
alter table public.shoe_orders        enable row level security;
alter table public.shoe_order_items   enable row level security;
alter table public.shoe_wishlists     enable row level security;
alter table public.shoe_tryon_usage   enable row level security;
alter table public.shoe_app_secrets   enable row level security;

-- 카탈로그: 누구나 읽기, 쓰기는 관리자만
create policy "brands are public"  on public.shoe_brands
  for select to anon, authenticated using (true);
-- FOR ALL 로 두면 SELECT 까지 포함돼 공개 읽기 정책과 겹친다.
-- 로그인 사용자가 읽을 때마다 shoe_is_admin() 이 행마다 호출되므로 쓰기만 남긴다.
create policy "brands admin insert" on public.shoe_brands
  for insert to authenticated with check (public.shoe_is_admin());
create policy "brands admin update" on public.shoe_brands
  for update to authenticated using (public.shoe_is_admin()) with check (public.shoe_is_admin());
create policy "brands admin delete" on public.shoe_brands
  for delete to authenticated using (public.shoe_is_admin());

create policy "products are public"  on public.shoe_products
  for select to anon, authenticated using (true);
-- FOR ALL 로 두면 SELECT 까지 포함돼 공개 읽기 정책과 겹친다.
-- 로그인 사용자가 읽을 때마다 shoe_is_admin() 이 행마다 호출되므로 쓰기만 남긴다.
create policy "products admin insert" on public.shoe_products
  for insert to authenticated with check (public.shoe_is_admin());
create policy "products admin update" on public.shoe_products
  for update to authenticated using (public.shoe_is_admin()) with check (public.shoe_is_admin());
create policy "products admin delete" on public.shoe_products
  for delete to authenticated using (public.shoe_is_admin());

create policy "product moods are public"  on public.shoe_product_moods
  for select to anon, authenticated using (true);
-- FOR ALL 로 두면 SELECT 까지 포함돼 공개 읽기 정책과 겹친다.
-- 로그인 사용자가 읽을 때마다 shoe_is_admin() 이 행마다 호출되므로 쓰기만 남긴다.
create policy "product moods admin insert" on public.shoe_product_moods
  for insert to authenticated with check (public.shoe_is_admin());
create policy "product moods admin update" on public.shoe_product_moods
  for update to authenticated using (public.shoe_is_admin()) with check (public.shoe_is_admin());
create policy "product moods admin delete" on public.shoe_product_moods
  for delete to authenticated using (public.shoe_is_admin());

-- 프로필: 본인 + 관리자. role 은 스스로 바꿀 수 없다 (승격 방지)
create policy "read own profile" on public.shoe_profiles
  for select to authenticated using ((select auth.uid()) = id or public.shoe_is_admin());
create policy "update own profile" on public.shoe_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and role = 'customer');

-- 주문: 본인 읽기만
create policy "read own orders" on public.shoe_orders
  for select to authenticated using ((select auth.uid()) = user_id or public.shoe_is_admin());

-- shoe_orders.order_id 는 text, shoe_order_items.order_id 는 uuid 라
-- 서브쿼리 안에서는 반드시 테이블을 명시해야 한다 (안 그러면 uuid = text 오류)
create policy "read own order items" on public.shoe_order_items
  for select to authenticated using (
    exists (
      select 1 from public.shoe_orders o
      where o.id = public.shoe_order_items.order_id
        and ((select auth.uid()) = o.user_id or public.shoe_is_admin())
    )
  );

create policy "manage own wishlist" on public.shoe_wishlists
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- shoe_tryon_usage 와 shoe_app_secrets 에는 정책을 만들지 않는다.
-- RLS 가 켜져 있고 정책이 없으면 클라이언트는 아무것도 읽고 쓸 수 없다 (의도된 상태).
