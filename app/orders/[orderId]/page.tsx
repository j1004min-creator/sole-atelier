import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { DeliveryTimeline } from "@/components/order/DeliveryTimeline";
import { formatDateTime, formatKRW } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "주문 상세" };

type OrderItem = {
  productName: string;
  brandName: string;
  size: number;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
};

type OrderDetail = {
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  method: string | null;
  receiptUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  failMessage: string | null;
  fulfillmentStatus: string;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  fulfillmentNote: string | null;
  shippingAddress: string | null;
  shippingPostcode: string | null;
  items: OrderItem[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "취소됨",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderId } = await params;
  const { email } = await searchParams;

  let order: OrderDetail | null = null;
  let denied = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("shoe_get_order", {
      p_order_id: orderId,
      p_email: email ?? null,
    });
    if (error) denied = true;
    else order = data as OrderDetail | null;
  }

  if (denied || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">주문을 볼 수 없습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          비회원 주문은 주소 끝에 <code className="text-ink-2">?email=주문시입력한이메일</code> 을
          붙이면 확인할 수 있습니다. 회원 주문이라면 로그인해주세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            로그인
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link href="/orders" className="text-xs text-muted hover:text-ink">
        ← 주문 내역
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{order.orderName}</h1>
      <p className="mt-1.5 text-sm text-muted tnum">
        {order.orderId} · {formatDateTime(order.createdAt)}
      </p>

      <div
        className={`mt-5 inline-block rounded-full px-3 py-1.5 text-xs font-medium ${
          order.status === "PAID"
            ? "bg-contemporary-soft text-contemporary"
            : order.status === "FAILED"
              ? "bg-surface-2 text-sale"
              : "bg-surface-2 text-ink-2"
        }`}
      >
        {STATUS_LABEL[order.status] ?? order.status}
      </div>

      {order.failMessage && (
        <p className="mt-3 rounded-md bg-surface-2 px-3 py-2.5 text-xs text-sale">
          {order.failMessage}
        </p>
      )}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.items.map((it, i) => (
          <li key={i} className="flex gap-4 py-4">
            {it.imageUrl && (
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-surface">
                <Image
                  src={it.imageUrl}
                  alt={it.productName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">{it.brandName}</p>
              <p className="truncate text-sm font-medium">{it.productName}</p>
              <p className="mt-1 text-xs text-muted tnum">
                {it.size}mm · {it.quantity}개
              </p>
            </div>
            <p className="shrink-0 text-sm tnum">{formatKRW(it.unitPrice * it.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">결제 금액</dt>
          <dd className="font-semibold tnum">{formatKRW(order.amount)}</dd>
        </div>
        {order.method && (
          <div className="flex justify-between">
            <dt className="text-muted">결제 수단</dt>
            <dd>{order.method}</dd>
          </div>
        )}
        {order.paidAt && (
          <div className="flex justify-between">
            <dt className="text-muted">결제 일시</dt>
            <dd className="tnum">{formatDateTime(order.paidAt)}</dd>
          </div>
        )}
      </dl>

      {order.status === "PAID" && (
        <DeliveryTimeline
          status={order.fulfillmentStatus}
          createdAt={order.createdAt}
          paidAt={order.paidAt}
          shippedAt={order.shippedAt}
          deliveredAt={order.deliveredAt}
          courier={order.courier}
          trackingNumber={order.trackingNumber}
          note={order.fulfillmentNote}
          address={order.shippingAddress}
          postcode={order.shippingPostcode}
        />
      )}

      {order.receiptUrl && (
        <a
          href={order.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
        >
          영수증 확인
        </a>
      )}
    </div>
  );
}
