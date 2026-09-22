"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * 로그인 여부는 서버가 이미 알고 있으므로 prop 으로 받는다.
 * 여기서 auth.getUser() 를 부르면 상품 페이지를 열 때마다 인증 서버로
 * 왕복이 한 번씩 더 생기고, 토큰 갱신 경합의 원인이 된다.
 */
export function WishlistButton({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(!isLoggedIn);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("shoe_wishlists")
          .select("product_id")
          .eq("product_id", productId)
          .maybeSingle();
        if (!cancelled) setSaved(Boolean(data));
      } catch {
        /* 조회 실패해도 버튼은 동작하게 둔다 */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, isLoggedIn]);

  async function toggle() {
    if (!isLoggedIn) return;
    setError(null);
    const next = !saved;
    setSaved(next); // 낙관적 반영
    try {
      const supabase = createClient();
      // user_id 는 DB 기본값(auth.uid())이 채운다
      const { error } = next
        ? await supabase.from("shoe_wishlists").insert({ product_id: productId })
        : await supabase.from("shoe_wishlists").delete().eq("product_id", productId);
      if (error) {
        setSaved(!next);
        setError("잠시 후 다시 시도해주세요.");
      }
    } catch {
      setSaved(!next);
      setError("잠시 후 다시 시도해주세요.");
    }
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="mt-3 block rounded-full border border-line px-5 py-3 text-center text-sm transition-colors hover:border-ink"
      >
        ♡ 찜하려면 로그인
      </a>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-pressed={saved}
        className="w-full rounded-full border border-line px-5 py-3 text-sm transition-colors hover:border-ink disabled:opacity-50"
      >
        {saved ? "♥ 찜한 상품" : "♡ 찜하기"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-sale">
          {error}
        </p>
      )}
    </div>
  );
}
