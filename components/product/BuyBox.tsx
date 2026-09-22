"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import type { Product } from "@/lib/catalog";
import { discountRate, formatKRW } from "@/lib/format";

export function BuyBox({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [size, setSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const off = discountRate(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;

  function doAdd(): boolean {
    if (!size) {
      setError("사이즈를 선택해주세요.");
      return false;
    }
    setError(null);
    add(
      {
        slug: product.slug,
        nameKo: product.nameKo,
        brandName: product.brand.nameKo,
        size,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      1,
    );
    return true;
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted">{product.brand.nameKo}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.nameKo}</h1>
      <p className="mt-1 text-sm text-muted">{product.name}</p>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tnum">{formatKRW(product.price)}</span>
        {product.compareAtPrice && (
          <>
            <span className="text-sm text-muted line-through tnum">
              {formatKRW(product.compareAtPrice)}
            </span>
            {off !== null && (
              <span className="rounded-full bg-sale px-2 py-0.5 text-xs font-semibold text-white tnum">
                {off}% 할인
              </span>
            )}
          </>
        )}
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-line pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">컬러</dt>
          <dd>{product.colorway}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">소재</dt>
          <dd>{product.materials}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">재고</dt>
          <dd className="tnum">{soldOut ? "품절" : `${product.stock}켤레 남음`}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium">사이즈 (mm)</p>
          <a href="#size-guide" className="text-xs text-muted underline underline-offset-2">
            사이즈 가이드
          </a>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setError(null);
              }}
              className={`rounded-md border py-2.5 text-sm tnum transition-colors ${
                size === s
                  ? "border-ink bg-ink text-white"
                  : "border-line hover:border-line-strong"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-sale">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            if (doAdd()) {
              setAdded(true);
              setTimeout(() => setAdded(false), 2200);
            }
          }}
          className="flex-1 rounded-full border border-ink px-5 py-3.5 text-sm font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
        >
          {added ? "장바구니에 담았습니다" : "장바구니 담기"}
        </button>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            if (doAdd()) router.push("/cart");
          }}
          className="flex-1 rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-line-strong"
        >
          바로 구매
        </button>
      </div>

      <WishlistButton productId={product.id} />

      <p className="mt-3 text-xs leading-relaxed text-muted">
        데모 사이트입니다. 결제는 토스페이먼츠 테스트 키로 진행되며 실제로 청구되지 않습니다.
      </p>
    </div>
  );
}
