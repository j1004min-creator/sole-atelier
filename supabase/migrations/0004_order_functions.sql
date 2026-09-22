-- 주문·결제 함수
--
-- 이 프로젝트는 service_role 키를 쓰지 않는다. 대신 금액 계산과 결제 확정을
-- SECURITY DEFINER 함수로 옮기고, 확정 계열 함수는 서버만 아는 비밀값으로 보호한다.
-- 키 하나로 DB 전체를 여는 것보다 권한 범위가 좁다.

-- 배포 후 반드시 실제 값으로 바꿀 것. 앱의 ORDER_CONFIRM_SECRET 과 같아야 한다.
--   select gen_random_uuid();  -- 같은 걸로 아무 난수나
insert into public.shoe_app_secrets (key, value)
values ('order_confirm', 'CHANGE_ME_SET_SAME_VALUE_AS_ORDER_CONFIRM_SECRET')
on conflict (key) do nothing;

-- 주문 생성 --------------------------------------------------------------
-- 가격은 전부 DB 에서 가져온다. 클라이언트가 보내는 건 slug/size/quantity 뿐이라
-- 금액 위조가 구조적으로 불가능하다.
create or replace function public.shoe_create_order(p_items jsonb, p_customer jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_rows jsonb; v_lines integer; v_goods integer := 0;
  v_shipping integer := 0; v_amount integer := 0;
  v_order_id text; v_order_uuid uuid; v_first text; v_name text;
  v_user uuid := auth.uid();
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception '한 번에 최대 20종까지 주문할 수 있습니다.' using errcode = 'P0001';
  end if;

  select jsonb_agg(
           jsonb_build_object(
             'product_id', p.id, 'name_ko', p.name_ko, 'brand_name', b.name_ko,
             'size', it.size, 'quantity', it.quantity, 'price', p.price,
             'image_url', p.image_url,
             'size_ok', (it.size = any (p.sizes)),
             'stock_ok', (p.stock >= it.quantity)
           ) order by it.ord
         ) into v_rows
  from (
    select (i.value->>'slug') as slug,
           (i.value->>'size')::int as size,
           least(greatest(coalesce((i.value->>'quantity')::int, 1), 1), 10) as quantity,
           i.ordinality as ord
    from jsonb_array_elements(p_items) with ordinality as i(value, ordinality)
  ) it
  join public.shoe_products p on p.slug = it.slug
  join public.shoe_brands  b on b.id = p.brand_id;

  v_lines := coalesce(jsonb_array_length(v_rows), 0);
  if v_lines <> jsonb_array_length(p_items) then
    raise exception '존재하지 않는 상품이 포함돼 있습니다.' using errcode = 'P0001';
  end if;
  if exists (select 1 from jsonb_array_elements(v_rows) r
             where (r.value->>'size_ok')::boolean is not true) then
    raise exception '선택할 수 없는 사이즈가 포함돼 있습니다.' using errcode = 'P0001';
  end if;
  if exists (select 1 from jsonb_array_elements(v_rows) r
             where (r.value->>'stock_ok')::boolean is not true) then
    raise exception '재고가 부족한 상품이 있습니다.' using errcode = 'P0001';
  end if;

  select coalesce(sum((r.value->>'price')::int * (r.value->>'quantity')::int), 0)
    into v_goods from jsonb_array_elements(v_rows) r;

  v_shipping := case when v_goods >= 50000 then 0 else 3000 end;
  v_amount   := v_goods + v_shipping;

  v_first := v_rows->0->>'name_ko';
  v_name  := case when v_lines > 1 then v_first || ' 외 ' || (v_lines - 1) || '건' else v_first end;

  v_order_id := 'SA-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' ||
                upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.shoe_orders (
    order_id, user_id, order_name, amount, status,
    customer_name, customer_email, customer_phone,
    shipping_postcode, shipping_address, shipping_memo
  ) values (
    v_order_id, v_user, v_name, v_amount, 'PENDING',
    coalesce(nullif(trim(p_customer->>'name'), ''), '구매자'),
    coalesce(nullif(trim(p_customer->>'email'), ''), 'guest@example.com'),
    nullif(trim(p_customer->>'phone'), ''),
    nullif(trim(p_customer->>'postcode'), ''),
    nullif(trim(p_customer->>'address'), ''),
    nullif(trim(p_customer->>'memo'), '')
  ) returning id into v_order_uuid;

  insert into public.shoe_order_items
    (order_id, product_id, product_name, brand_name, size, quantity, unit_price, image_url)
  select v_order_uuid, (r.value->>'product_id')::uuid, r.value->>'name_ko',
         r.value->>'brand_name', (r.value->>'size')::int, (r.value->>'quantity')::int,
         (r.value->>'price')::int, r.value->>'image_url'
  from jsonb_array_elements(v_rows) r;

  return jsonb_build_object('orderId', v_order_id, 'orderName', v_name,
    'amount', v_amount, 'goodsAmount', v_goods, 'shippingFee', v_shipping);
end;
$$;
revoke all on function public.shoe_create_order(jsonb, jsonb) from public;
grant execute on function public.shoe_create_order(jsonb, jsonb) to anon, authenticated;

-- 승인 전 금액 확인 ------------------------------------------------------
-- 비회원 주문은 RLS 때문에 라우트에서 일반 select 로 읽을 수 없다.
-- 그래서 토스를 호출하기 전에 금액을 대조하려면 이 함수가 필요하다.
create or replace function public.shoe_precheck_order(
  p_secret text, p_order_id text, p_amount integer
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_secret text; v_order public.shoe_orders%rowtype;
begin
  select value into v_secret from public.shoe_app_secrets where key = 'order_confirm';
  if v_secret is null or p_secret is distinct from v_secret then
    raise exception '권한이 없습니다.' using errcode = 'P0001';
  end if;

  select * into v_order from public.shoe_orders where order_id = p_order_id;
  if not found then return jsonb_build_object('found', false); end if;

  return jsonb_build_object('found', true, 'status', v_order.status,
    'amount', v_order.amount, 'amountMatches', (v_order.amount = p_amount));
end;
$$;
revoke all on function public.shoe_precheck_order(text, text, integer) from public;
grant execute on function public.shoe_precheck_order(text, text, integer) to anon, authenticated;

-- 결제 확정 --------------------------------------------------------------
create or replace function public.shoe_confirm_order(
  p_secret text, p_order_id text, p_payment_key text, p_amount integer,
  p_method text, p_receipt text, p_raw jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_secret text; v_order public.shoe_orders%rowtype;
begin
  select value into v_secret from public.shoe_app_secrets where key = 'order_confirm';
  if v_secret is null or p_secret is distinct from v_secret then
    raise exception '권한이 없습니다.' using errcode = 'P0001';
  end if;

  select * into v_order from public.shoe_orders where order_id = p_order_id for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.' using errcode = 'P0001';
  end if;

  -- 이미 승인된 주문이면 다시 승인하지 않는다 (멱등)
  if v_order.status = 'PAID' then
    return jsonb_build_object('status', 'PAID', 'alreadyPaid', true, 'amount', v_order.amount);
  end if;

  -- 저장해둔 금액과 다르면 승인하지 않는다
  if v_order.amount <> p_amount then
    update public.shoe_orders
       set status = 'FAILED', fail_code = 'AMOUNT_MISMATCH',
           fail_message = '결제 금액이 주문 금액과 다릅니다.'
     where id = v_order.id;
    raise exception '결제 금액이 주문 금액과 다릅니다.' using errcode = 'P0001';
  end if;

  update public.shoe_orders
     set status = 'PAID', payment_key = p_payment_key, method = p_method,
         receipt_url = p_receipt, raw_payment = p_raw, paid_at = now()
   where id = v_order.id;

  update public.shoe_products p
     set stock = greatest(0, p.stock - oi.quantity)
    from public.shoe_order_items oi
   where oi.order_id = v_order.id and oi.product_id = p.id;

  return jsonb_build_object('status', 'PAID', 'alreadyPaid', false, 'amount', v_order.amount);
end;
$$;
revoke all on function public.shoe_confirm_order(text, text, text, integer, text, text, jsonb) from public;
grant execute on function public.shoe_confirm_order(text, text, text, integer, text, text, jsonb) to anon, authenticated;

-- 결제 실패 기록 ---------------------------------------------------------
create or replace function public.shoe_fail_order(
  p_secret text, p_order_id text, p_code text, p_message text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_secret text;
begin
  select value into v_secret from public.shoe_app_secrets where key = 'order_confirm';
  if v_secret is null or p_secret is distinct from v_secret then
    raise exception '권한이 없습니다.' using errcode = 'P0001';
  end if;

  update public.shoe_orders
     set status = case when status = 'PAID' then status else 'FAILED' end,
         fail_code = p_code, fail_message = p_message
   where order_id = p_order_id;
end;
$$;
revoke all on function public.shoe_fail_order(text, text, text, text) from public;
grant execute on function public.shoe_fail_order(text, text, text, text) to anon, authenticated;

-- 주문 조회 --------------------------------------------------------------
-- 회원은 본인 주문, 비회원은 주문번호 + 이메일이 모두 맞아야 본다.
create or replace function public.shoe_get_order(p_order_id text, p_email text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_order public.shoe_orders%rowtype; v_items jsonb;
begin
  select * into v_order from public.shoe_orders where order_id = p_order_id;
  if not found then return null; end if;

  if v_order.user_id is not null and v_order.user_id = auth.uid() then
    null;
  elsif p_email is not null and lower(p_email) = lower(v_order.customer_email) then
    null;
  else
    raise exception '주문을 확인할 수 없습니다.' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'productName', product_name, 'brandName', brand_name, 'size', size,
           'quantity', quantity, 'unitPrice', unit_price, 'imageUrl', image_url)), '[]'::jsonb)
    into v_items
  from public.shoe_order_items where order_id = v_order.id;

  return jsonb_build_object(
    'orderId', v_order.order_id, 'orderName', v_order.order_name,
    'amount', v_order.amount, 'status', v_order.status, 'method', v_order.method,
    'receiptUrl', v_order.receipt_url, 'customerName', v_order.customer_name,
    'customerEmail', v_order.customer_email, 'createdAt', v_order.created_at,
    'paidAt', v_order.paid_at, 'failCode', v_order.fail_code,
    'failMessage', v_order.fail_message, 'items', v_items);
end;
$$;
revoke all on function public.shoe_get_order(text, text) from public;
grant execute on function public.shoe_get_order(text, text) to anon, authenticated;

-- AI 실착 사용량 ---------------------------------------------------------
create or replace function public.shoe_bump_tryon_usage(
  p_user_key text, p_per_user_limit integer, p_total_limit integer
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_today date := current_date; v_total integer; v_mine integer;
begin
  select coalesce(sum(count), 0) into v_total
  from public.shoe_tryon_usage where day = v_today;
  if v_total >= p_total_limit then
    return jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'TOTAL');
  end if;

  select coalesce(count, 0) into v_mine
  from public.shoe_tryon_usage where day = v_today and user_key = p_user_key;
  if coalesce(v_mine, 0) >= p_per_user_limit then
    return jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'USER');
  end if;

  insert into public.shoe_tryon_usage (day, user_key, count)
  values (v_today, p_user_key, 1)
  on conflict (day, user_key) do update set count = public.shoe_tryon_usage.count + 1
  returning count into v_mine;

  return jsonb_build_object('allowed', true,
    'remaining', greatest(0, p_per_user_limit - v_mine), 'reason', null);
end;
$$;
revoke all on function public.shoe_bump_tryon_usage(text, integer, integer) from public;
grant execute on function public.shoe_bump_tryon_usage(text, integer, integer) to anon, authenticated;
