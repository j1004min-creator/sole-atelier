-- 배송 현황
--
-- 실제 택배사 연동은 계약과 API 키가 필요하므로, 관리자가 단계를 올리면
-- 고객이 주문 상세에서 타임라인으로 확인하는 구조로 만든다.

alter table public.shoe_orders
  add column if not exists fulfillment_status text not null default 'PREPARING'
    check (fulfillment_status in ('PREPARING','SHIPPED','IN_TRANSIT','DELIVERED')),
  add column if not exists courier          text,
  add column if not exists tracking_number  text,
  add column if not exists shipped_at       timestamptz,
  add column if not exists delivered_at     timestamptz,
  add column if not exists fulfillment_note text;

comment on column public.shoe_orders.fulfillment_status is
  '배송 단계. 결제 완료(status=PAID) 이후에만 의미가 있다.';

-- shoe_orders 에는 UPDATE 정책이 없다(금액 조작 방지). 배송 상태는 이 함수로만 바꾼다.
create or replace function public.shoe_set_fulfillment(
  p_order_id text,
  p_status   text,
  p_courier  text default null,
  p_tracking text default null,
  p_note     text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_order public.shoe_orders%rowtype;
begin
  if not public.shoe_is_admin() then
    raise exception '관리자만 배송 상태를 변경할 수 있습니다.' using errcode = 'P0001';
  end if;
  if p_status not in ('PREPARING','SHIPPED','IN_TRANSIT','DELIVERED') then
    raise exception '알 수 없는 배송 상태입니다.' using errcode = 'P0001';
  end if;

  select * into v_order from public.shoe_orders where order_id = p_order_id for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.' using errcode = 'P0001';
  end if;
  if v_order.status <> 'PAID' then
    raise exception '결제가 완료된 주문만 배송 상태를 바꿀 수 있습니다.' using errcode = 'P0001';
  end if;

  update public.shoe_orders
     set fulfillment_status = p_status,
         courier          = coalesce(nullif(trim(p_courier), ''), courier),
         tracking_number   = coalesce(nullif(trim(p_tracking), ''), tracking_number),
         fulfillment_note  = nullif(trim(p_note), ''),
         -- 각 단계에 처음 도달한 시각만 남긴다
         shipped_at   = case when p_status in ('SHIPPED','IN_TRANSIT','DELIVERED')
                             then coalesce(shipped_at, now()) else null end,
         delivered_at = case when p_status = 'DELIVERED'
                             then coalesce(delivered_at, now()) else null end
   where id = v_order.id;

  return jsonb_build_object('orderId', p_order_id, 'fulfillmentStatus', p_status);
end;
$$;

revoke all on function public.shoe_set_fulfillment(text, text, text, text, text) from public;
grant execute on function public.shoe_set_fulfillment(text, text, text, text, text) to authenticated;

-- 주문 조회에 배송 정보 추가
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
    'failMessage', v_order.fail_message,
    'fulfillmentStatus', v_order.fulfillment_status,
    'courier', v_order.courier,
    'trackingNumber', v_order.tracking_number,
    'shippedAt', v_order.shipped_at,
    'deliveredAt', v_order.delivered_at,
    'fulfillmentNote', v_order.fulfillment_note,
    'shippingAddress', v_order.shipping_address,
    'shippingPostcode', v_order.shipping_postcode,
    'items', v_items
  );
end;
$$;

revoke all on function public.shoe_get_order(text, text) from public;
grant execute on function public.shoe_get_order(text, text) to anon, authenticated;

-- 찜 추가 시 클라이언트가 user_id 를 보내지 않아도 되게 한다.
-- 버튼이 auth.getUser() 를 따로 부르지 않아도 되고, 남의 id 로 넣는 것도 막힌다.
alter table public.shoe_wishlists
  alter column user_id set default auth.uid();
