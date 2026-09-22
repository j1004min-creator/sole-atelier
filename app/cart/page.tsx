"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";
import { formatKRW } from "@/lib/format";

const FREE_SHIPPING_FROM = 50000;
const SHIPPING_FEE = 3000;

export default function CartPage() {
  const { items, ready, subtotal, setQuantity, remove } = useCart();

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16">
        <div className="h-40 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">장바구니가 비어 있습니다</h1>
        <p className="mt-2 text-sm text-muted">마음에 드는 신발을 담아보세요.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          상품 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">장바구니</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={`${item.slug}-${item.size}`} className="flex gap-4 py-5">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md border border-line bg-surface"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.nameKo}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{item.brandName}</p>
                <Link
                  href={`/products/${item.slug}`}
                  className="mt-0.5 block truncate text-sm font-medium hover:underline"
                >
                  {item.nameKo}
                </Link>
                <p className="mt-1 text-xs text-muted tnum">사이즈 {item.size}mm</p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-line">
                    <button
                      type="button"
                      aria-label="수량 줄이기"
                      onClick={() => setQuantity(item.slug, item.size, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-sm hover:bg-surface-2"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm tnum">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="수량 늘리기"
                      disabled={item.quantity >= 10}
                      onClick={() => setQuantity(item.slug, item.size, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-sm hover:bg-surface-2 disabled:text-muted"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.slug, item.size)}
                    className="text-xs text-muted underline underline-offset-2 hover:text-ink"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm font-semibold tnum">
                {formatKRW(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-card border border-line p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">결제 예정 금액</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">상품 금액</dt>
              <dd className="tnum">{formatKRW(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">배송비</dt>
              <dd className="tnum">{shipping === 0 ? "무료" : formatKRW(shipping)}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted tnum">
                {formatKRW(FREE_SHIPPING_FROM - subtotal)} 더 담으면 배송비가 무료입니다.
              </p>
            )}
          </dl>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span className="text-sm font-semibold">총 결제 금액</span>
            <span className="text-lg font-semibold tnum">{formatKRW(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-ink px-5 py-3.5 text-center text-sm font-medium text-white hover:opacity-90"
          >
            주문하기
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            최종 결제 금액은 서버에서 상품 가격으로 다시 계산합니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
