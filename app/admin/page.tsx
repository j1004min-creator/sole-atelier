import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { FulfillmentControl } from "@/components/order/FulfillmentControl";
import { requireAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { formatDateTime, formatKRW } from "@/lib/format";
import { FULFILLMENT_LABEL, type FulfillmentStatus } from "@/lib/fulfillment";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "관리자" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  FAILED: "결제 실패",
  CANCELED: "취소됨",
};

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">관리자 전용</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          이 페이지는 관리자 계정만 볼 수 있습니다. 관리자 권한은 Supabase 의{" "}
          <code className="text-ink-2">shoe_profiles.role</code> 을{" "}
          <code className="text-ink-2">admin</code> 으로 바꾸면 부여됩니다.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          로그인
        </Link>
      </div>
    );
  }

  const products = await getCatalog();

  let orders: {
    order_id: string;
    order_name: string;
    amount: number;
    status: string;
    customer_name: string;
    customer_email: string;
    created_at: string;
    fulfillment_status: string;
    courier: string | null;
    tracking_number: string | null;
  }[] = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("shoe_orders")
      .select("order_id, order_name, amount, status, customer_name, customer_email, created_at, fulfillment_status, courier, tracking_number")
      .order("created_at", { ascending: false })
      .limit(50);
    orders = data ?? [];
  }

  const paid = orders.filter((o) => o.status === "PAID");
  const revenue = paid.reduce((n, o) => n + o.amount, 0);
  const lowStock = products.filter((p) => p.stock <= 6);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">관리자</h1>
      <p className="mt-1.5 text-sm text-muted">{admin.email}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "등록 상품", value: `${products.length}개` },
          { label: "전체 주문", value: `${orders.length}건` },
          { label: "결제 완료", value: `${paid.length}건` },
          { label: "결제 금액", value: formatKRW(revenue) },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-line p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-lg font-semibold tnum">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">최근 주문</h2>
        {orders.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-sm text-muted">
            아직 주문이 없습니다.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2.5 font-medium">주문번호</th>
                  <th className="py-2.5 font-medium">상품</th>
                  <th className="py-2.5 font-medium">주문자</th>
                  <th className="py-2.5 text-right font-medium">금액</th>
                  <th className="py-2.5 font-medium">상태</th>
                  <th className="py-2.5 font-medium">배송</th>
                  <th className="py-2.5 font-medium">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.order_id}>
                    <td className="py-3">
                      <Link href={`/orders/${o.order_id}`} className="tnum hover:underline">
                        {o.order_id}
                      </Link>
                    </td>
                    <td className="max-w-48 truncate py-3">{o.order_name}</td>
                    <td className="py-3 text-muted">
                      {o.customer_name}
                      <span className="block text-xs">{o.customer_email}</span>
                    </td>
                    <td className="py-3 text-right tnum">{formatKRW(o.amount)}</td>
                    <td className="py-3">
                      <span className={o.status === "PAID" ? "text-contemporary" : "text-muted"}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-muted">
                      {o.status === "PAID"
                        ? (FULFILLMENT_LABEL[o.fulfillment_status as FulfillmentStatus] ?? "-")
                        : "-"}
                    </td>
                    <td className="py-3 text-xs text-muted tnum">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">배송 관리</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          결제가 완료된 주문만 배송 단계를 바꿀 수 있습니다. 바꾸면 고객의 주문 상세 화면에 바로
          반영됩니다. 실제 택배사와 연동돼 있지는 않습니다.
        </p>
        {paid.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-sm text-muted">
            결제 완료된 주문이 없습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {paid.map((o) => (
              <FulfillmentControl
                key={o.order_id}
                orderId={o.order_id}
                orderName={o.order_name}
                customerName={o.customer_name}
                status={o.fulfillment_status}
                courier={o.courier}
                trackingNumber={o.tracking_number}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">재고가 적은 상품</h2>
        {lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-muted">재고가 넉넉합니다.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((p) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="flex items-center gap-3 rounded-card border border-line p-3 hover:border-ink"
              >
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded border border-line bg-surface">
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted">{p.brand.nameKo}</p>
                  <p className="truncate text-sm font-medium">{p.nameKo}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-sale tnum">{p.stock}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">상품 목록</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          상품 등록·수정은 Supabase 대시보드의 <code className="text-ink-2">shoe_products</code>{" "}
          테이블에서 하거나, <code className="text-ink-2">lib/seed-data.ts</code> 를 고친 뒤{" "}
          <code className="text-ink-2">npm run seed</code> 로 SQL 을 다시 만들어 적용하세요.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-2.5 font-medium">상품</th>
                <th className="py-2.5 font-medium">카테고리</th>
                <th className="py-2.5 text-right font-medium">가격</th>
                <th className="py-2.5 text-right font-medium">재고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.slug}>
                  <td className="py-2.5">
                    <Link href={`/products/${p.slug}`} className="hover:underline">
                      <span className="text-muted">{p.brand.nameKo}</span> {p.nameKo}
                    </Link>
                  </td>
                  <td className="py-2.5 text-muted">{CATEGORY_MAP[p.category].name}</td>
                  <td className="py-2.5 text-right tnum">{formatKRW(p.price)}</td>
                  <td className="py-2.5 text-right tnum">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
