"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { formatKRW } from "@/lib/format";

type State =
  | { kind: "confirming" }
  | { kind: "paid"; amount: number; orderId: string; method?: string | null; receiptUrl?: string | null; alreadyPaid: boolean }
  | { kind: "failed"; code: string; message: string };

export function ConfirmPayment() {
  const params = useSearchParams();
  const { clear } = useCart();
  const [state, setState] = useState<State>({ kind: "confirming" });
  const done = useRef(false);

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amountRaw = params.get("amount");

  useEffect(() => {
    // 새로고침으로 두 번 승인 요청하지 않도록 한 번만 실행한다
    if (done.current) return;
    done.current = true;

    if (!paymentKey || !orderId || !amountRaw) {
      setState({
        kind: "failed",
        code: "MISSING_PARAM",
        message: "결제 정보가 전달되지 않았습니다. 주문 내역에서 결제 상태를 확인해주세요.",
      });
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amountRaw) }),
        });
        const json = await res.json();

        if (!res.ok) {
          setState({
            kind: "failed",
            code: String(json.code ?? "UNKNOWN"),
            message: String(json.message ?? "결제 승인에 실패했습니다."),
          });
          return;
        }

        clear();
        setState({
          kind: "paid",
          amount: Number(amountRaw),
          orderId,
          method: json.method,
          receiptUrl: json.receiptUrl,
          alreadyPaid: Boolean(json.alreadyPaid),
        });
      } catch {
        setState({
          kind: "failed",
          code: "NETWORK",
          message: "결제 승인 요청 중 통신 오류가 발생했습니다.",
        });
      }
    })();
  }, [paymentKey, orderId, amountRaw, clear]);

  if (state.kind === "confirming") {
    return (
      <div className="rounded-card border border-line p-8 text-center">
        <p className="text-base font-medium">결제를 확인하고 있습니다</p>
        <p className="mt-2 text-sm text-muted">창을 닫지 말고 잠시만 기다려주세요.</p>
        <div className="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-ink" />
        </div>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="rounded-card border border-line p-8">
        <h1 className="text-xl font-semibold">결제를 완료하지 못했습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{state.message}</p>
        <p className="mt-2 text-xs text-muted">오류 코드: {state.code}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/cart"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            장바구니로 돌아가기
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
          >
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line p-8">
      <p className="text-3xl" aria-hidden>
        🎉
      </p>
      <h1 className="mt-3 text-xl font-semibold">
        {state.alreadyPaid ? "이미 결제가 완료된 주문입니다" : "결제가 완료되었습니다"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        테스트 결제라 실제로 청구되지 않았고 상품도 배송되지 않습니다.
      </p>

      <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-muted">주문번호</dt>
          <dd className="font-medium tnum">{state.orderId}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-muted">결제 금액</dt>
          <dd className="font-semibold tnum">{formatKRW(state.amount)}</dd>
        </div>
        {state.method && (
          <div className="flex justify-between py-3">
            <dt className="text-muted">결제 수단</dt>
            <dd>{state.method}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/orders/${state.orderId}`}
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          주문 상세 보기
        </Link>
        {state.receiptUrl && (
          <a
            href={state.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
          >
            영수증 확인
          </a>
        )}
        <Link
          href="/products"
          className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
        >
          계속 쇼핑하기
        </Link>
      </div>
    </div>
  );
}
