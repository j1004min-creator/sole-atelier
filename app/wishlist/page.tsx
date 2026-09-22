import Link from "next/link";
import type { Metadata } from "next";

import { ProductGrid } from "@/components/product/ProductCard";
import { getSessionUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "찜한 상품" };

export default async function WishlistPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">찜한 상품</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          로그인하면 마음에 드는 신발을 저장해두고 나중에 다시 볼 수 있습니다.
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

  let ids: string[] = [];
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.from("shoe_wishlists").select("product_id");
    ids = (data ?? []).map((r) => r.product_id as string);
  }

  const all = await getCatalog();
  const saved = all.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">찜한 상품</h1>
      <p className="mt-1.5 text-sm text-muted tnum">{saved.length}개</p>
      <div className="mt-8">
        <ProductGrid
          products={saved}
          emptyMessage="아직 찜한 상품이 없습니다. 상품 상세에서 ♡ 를 눌러 저장해보세요."
        />
      </div>
    </div>
  );
}
