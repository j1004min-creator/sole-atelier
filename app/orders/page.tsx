import Link from "next/link";
import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { formatDateTime, formatKRW } from "@/lib/format";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "주문 내역" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "취소됨",
};

export default async function OrdersPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">주문 조회</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          로그인하면 주문 내역을 한눈에 볼 수 있습니다. 비회원으로 주문했다면 결제 완료 화면의
          주문번호로 조회하세요.
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

  let orders: {
    order_id: string;
    order_name: string;
    amount: number;
    status: string;
    created_at: string;
  }[] = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("shoe_orders")
      .select("order_id, order_name, amount, status, created_at")
      .order("created_at", { ascending: false });
    orders = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">주문 내역</h1>
      <p className="mt-1.5 text-sm text-muted">{user.email}</p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">아직 주문이 없습니다.</p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.order_id}>
              <Link href={`/orders/${o.order_id}`} className="flex items-center gap-4 py-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.order_name}</p>
                  <p className="mt-1 text-xs text-muted tnum">
                    {o.order_id} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tnum">{formatKRW(o.amount)}</p>
                  <p
                    className={`mt-0.5 text-xs ${
                      o.status === "PAID" ? "text-contemporary" : "text-muted"
                    }`}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
