import { NextResponse } from "next/server";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Incoming = {
  items?: { slug?: string; size?: number; quantity?: number }[];
  customer?: Record<string, string>;
};

/**
 * 결제 요청 "전에" 주문을 PENDING 으로 만들어 둔다.
 *
 * 금액은 이 라우트에서 계산하지 않는다. Postgres 함수(shoe_create_order)가
 * 상품 테이블의 가격으로 직접 계산하므로 클라이언트도, 이 라우트도 금액을 조작할 수 없다.
 */
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { message: "Supabase 환경변수가 설정되지 않아 주문을 만들 수 없습니다." },
      { status: 503 },
    );
  }

  let body: Incoming;
  try {
    body = (await request.json()) as Incoming;
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const items = (body.items ?? [])
    .filter((i) => typeof i.slug === "string" && Number.isFinite(i.size))
    .map((i) => ({
      slug: i.slug,
      size: Number(i.size),
      quantity: Math.min(10, Math.max(1, Number(i.quantity) || 1)),
    }));

  if (!items.length) {
    return NextResponse.json({ message: "장바구니가 비어 있습니다." }, { status: 400 });
  }

  const customer = body.customer ?? {};
  if (!customer.name?.trim()) {
    return NextResponse.json({ message: "주문자 이름을 입력해주세요." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email ?? "")) {
    return NextResponse.json({ message: "이메일 주소를 확인해주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("shoe_create_order", {
    p_items: items,
    p_customer: customer,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message || "주문을 만들지 못했습니다." },
      { status: 400 },
    );
  }

  return NextResponse.json(data);
}
