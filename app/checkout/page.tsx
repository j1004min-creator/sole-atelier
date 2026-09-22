"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { useCart } from "@/components/cart/CartProvider";
import { formatKRW } from "@/lib/format";

const FREE_SHIPPING_FROM = 50000;
const SHIPPING_FEE = 3000;

type TossWidgets = {
  setAmount: (a: { currency: string; value: number }) => Promise<void>;
  renderPaymentMethods: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  renderAgreement: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  requestPayment: (o: Record<string, unknown>) => Promise<unknown>;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, subtotal } = useCart();

  const widgetsRef = useRef<TossWidgets | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    address: "",
    memo: "",
  });

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  useEffect(() => {
    if (ready && items.length === 0) router.replace("/cart");
  }, [ready, items.length, router]);

  /** 토스 결제 UI 렌더링 */
  useEffect(() => {
    if (!ready || items.length === 0) return;

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      setError("결제 환경변수(NEXT_PUBLIC_TOSS_CLIENT_KEY)가 설정되지 않았습니다.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        // 비회원 결제라 customerKey 는 ANONYMOUS 를 쓴다
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS }) as unknown as TossWidgets;
        if (cancelled) return;
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: "KRW", value: total });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method" }),
          widgets.renderAgreement({ selector: "#agreement" }),
        ]);
        if (!cancelled) setWidgetReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(
            "결제 UI를 불러오지 못했습니다. 새로고침해도 같다면 잠시 후 다시 시도해주세요. (" +
              (e instanceof Error ? e.message : String(e)) +
              ")",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // 금액 변경은 아래 effect 에서 setAmount 로만 반영한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items.length]);

  /** 장바구니 금액이 바뀌면 위젯 금액도 갱신 */
  useEffect(() => {
    if (!widgetReady || !widgetsRef.current) return;
    widgetsRef.current.setAmount({ currency: "KRW", value: total }).catch(() => {});
  }, [total, widgetReady]);

  async function pay() {
    setError(null);

    if (!form.name.trim()) return setError("주문자 이름을 입력해주세요.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("이메일 주소를 확인해주세요.");
    if (!form.address.trim()) return setError("배송 주소를 입력해주세요.");
    if (!widgetsRef.current) return setError("결제 UI가 아직 준비되지 않았습니다.");

    setBusy(true);
    try {
      // 1) 결제 요청 전에 서버에 주문을 만든다. 금액은 서버가 상품 가격으로 다시 계산한다.
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, size: i.size, quantity: i.quantity })),
          customer: form,
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        setError(order.message ?? "주문을 만들지 못했습니다.");
        setBusy(false);
        return;
      }

      // 2) 서버가 계산한 금액이 기준이다
      if (order.amount !== total) {
        await widgetsRef.current.setAmount({ currency: "KRW", value: order.amount });
      }

      // 3) 결제창 호출 — 성공/실패 모두 리다이렉트로 돌아온다
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: form.email,
        customerName: form.name,
        ...(form.phone ? { customerMobilePhone: form.phone.replace(/\D/g, "") } : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg.includes("취소") || msg.toUpperCase().includes("CANCEL")
          ? "결제를 취소했습니다. 다시 시도할 수 있습니다."
          : msg,
      );
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16">
        <div className="h-64 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">주문서</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-semibold">주문자 · 배송지</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                label="이름"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="홍길동"
                autoComplete="name"
              />
              <Field
                label="이메일"
                required
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Field
                label="휴대폰"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="01012345678"
                autoComplete="tel"
              />
              <Field
                label="우편번호"
                value={form.postcode}
                onChange={(v) => setForm({ ...form, postcode: v })}
                placeholder="06236"
                autoComplete="postal-code"
              />
              <div className="sm:col-span-2">
                <Field
                  label="주소"
                  required
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  placeholder="서울시 강남구 테헤란로 1길 10, 101동 1001호"
                  autoComplete="street-address"
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="배송 메모"
                  value={form.memo}
                  onChange={(v) => setForm({ ...form, memo: v })}
                  placeholder="부재 시 경비실에 맡겨주세요"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold">결제 수단</h2>
            <div id="payment-method" className="mt-4 min-h-40" />
            <div id="agreement" className="mt-2" />
            {!widgetReady && !error && (
              <div className="mt-4 h-40 animate-pulse rounded-card bg-surface" />
            )}
          </section>
        </div>

        <aside className="h-fit rounded-card border border-line p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">주문 요약</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={`${i.slug}-${i.size}`} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-ink-2">
                  {i.nameKo}{" "}
                  <span className="text-muted tnum">
                    {i.size}mm × {i.quantity}
                  </span>
                </span>
                <span className="shrink-0 tnum">{formatKRW(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">상품 금액</dt>
              <dd className="tnum">{formatKRW(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">배송비</dt>
              <dd className="tnum">{shipping === 0 ? "무료" : formatKRW(shipping)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span className="text-sm font-semibold">총 결제 금액</span>
            <span className="text-lg font-semibold tnum">{formatKRW(total)}</span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-sale"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={busy || !widgetReady}
            className="mt-5 w-full rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:bg-line-strong"
          >
            {busy ? "결제창을 여는 중…" : `${formatKRW(total)} 결제하기`}
          </button>

          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            토스페이먼츠 <strong className="text-ink-2">테스트 키</strong>로 동작합니다. 실제로
            청구되지 않고 상품도 배송되지 않습니다.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">
        {label}
        {required && <span className="ml-0.5 text-sale">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
