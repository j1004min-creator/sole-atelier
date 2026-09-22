import { NextResponse } from "next/server";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

/**
 * 토스페이먼츠 결제 승인.
 *
 * 순서가 중요하다.
 *  1) 승인 API 를 호출하기 전에 DB 에 저장된 주문 금액과 쿼리로 넘어온 금액이 같은지 본다.
 *  2) 같을 때만 토스에 승인을 요청한다.
 *  3) 승인 성공 후 주문을 PAID 로 바꾼다. 이미 PAID 면 다시 승인하지 않는다.
 */
export async function POST(request: Request) {
  const secret = process.env.TOSS_SECRET_KEY;
  const confirmSecret = process.env.ORDER_CONFIRM_SECRET;

  if (!secret || !confirmSecret || !hasSupabaseEnv()) {
    return NextResponse.json(
      { code: "CONFIG", message: "결제 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  let body: { paymentKey?: string; orderId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "BAD_REQUEST", message: "요청 형식 오류" }, { status: 400 });
  }

  const { paymentKey, orderId } = body;
  const amount = Number(body.amount);

  if (!paymentKey || !orderId || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "결제 정보가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // 1) 승인 전 금액 검증.
  //    비회원 주문은 RLS 때문에 일반 select 로 안 보이므로 RLS 를 우회하는 함수로 확인한다.
  const { data: pre, error: preError } = await supabase.rpc("shoe_precheck_order", {
    p_secret: confirmSecret,
    p_order_id: orderId,
    p_amount: amount,
  });

  if (preError) {
    return NextResponse.json(
      { code: "PRECHECK_FAILED", message: "주문을 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  const check = pre as { found: boolean; status?: string; amountMatches?: boolean } | null;

  if (!check?.found) {
    return NextResponse.json(
      { code: "ORDER_NOT_FOUND", message: "주문을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // 이미 승인된 주문이면 토스를 다시 부르지 않는다 (새로고침 대비)
  if (check.status === "PAID") {
    return NextResponse.json({ status: "PAID", alreadyPaid: true });
  }

  // 금액이 다르면 토스를 호출하기 전에 끊는다
  if (!check.amountMatches) {
    await supabase.rpc("shoe_fail_order", {
      p_secret: confirmSecret,
      p_order_id: orderId,
      p_code: "AMOUNT_MISMATCH",
      p_message: "결제 금액이 주문 금액과 다릅니다.",
    });
    return NextResponse.json(
      { code: "AMOUNT_MISMATCH", message: "결제 금액이 주문 금액과 달라 승인을 중단했습니다." },
      { status: 400 },
    );
  }

  // 2) 토스 결제 승인
  const auth = Buffer.from(`${secret}:`).toString("base64");
  let tossJson: Record<string, unknown> = {};
  let tossOk = false;

  try {
    const res = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    tossJson = (await res.json()) as Record<string, unknown>;
    tossOk = res.ok;
  } catch {
    return NextResponse.json(
      { code: "NETWORK", message: "결제 승인 요청에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  if (!tossOk) {
    const code = String(tossJson.code ?? "UNKNOWN");
    const message = String(tossJson.message ?? "결제 승인에 실패했습니다.");
    await supabase.rpc("shoe_fail_order", {
      p_secret: confirmSecret,
      p_order_id: orderId,
      p_code: code,
      p_message: message,
    });
    return NextResponse.json({ code, message }, { status: 400 });
  }

  // 3) 주문 확정 — 금액 재검증·중복 승인 방지는 DB 함수 안에서 한 번 더 한다
  const { data: confirmed, error: confirmError } = await supabase.rpc("shoe_confirm_order", {
    p_secret: confirmSecret,
    p_order_id: orderId,
    p_payment_key: paymentKey,
    p_amount: amount,
    p_method: (tossJson.method as string) ?? null,
    p_receipt: ((tossJson.receipt as { url?: string } | undefined)?.url ?? null) as string | null,
    p_raw: tossJson,
  });

  if (confirmError) {
    return NextResponse.json(
      {
        code: "ORDER_UPDATE_FAILED",
        message:
          "결제는 승인됐지만 주문 상태를 저장하지 못했습니다. 고객센터로 문의해주세요. (" +
          confirmError.message +
          ")",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "PAID",
    alreadyPaid: Boolean((confirmed as { alreadyPaid?: boolean } | null)?.alreadyPaid),
    method: tossJson.method ?? null,
    receiptUrl: (tossJson.receipt as { url?: string } | undefined)?.url ?? null,
  });
}
