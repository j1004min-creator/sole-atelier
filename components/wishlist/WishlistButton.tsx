"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          if (!cancelled) setReady(true);
          return;
        }
        const { data } = await supabase
          .from("shoe_wishlists")
          .select("product_id")
          .eq("product_id", productId)
          .maybeSingle();
        if (!cancelled) {
          setSaved(Boolean(data));
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function toggle() {
    setNeedLogin(false);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setNeedLogin(true);
        return;
      }
      if (saved) {
        await supabase.from("shoe_wishlists").delete().eq("product_id", productId);
        setSaved(false);
      } else {
        await supabase
          .from("shoe_wishlists")
          .insert({ product_id: productId, user_id: auth.user.id });
        setSaved(true);
      }
    } catch {
      setNeedLogin(true);
    }
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
      {needLogin && (
        <p className="mt-2 text-xs text-muted">
          찜은 로그인 후 사용할 수 있습니다.{" "}
          <a href="/login" className="underline underline-offset-2 hover:text-ink">
            로그인하기
          </a>
        </p>
      )}
    </div>
  );
}
