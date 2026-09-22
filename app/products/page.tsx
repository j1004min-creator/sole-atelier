import { Suspense } from "react";
import type { Metadata } from "next";

import { PriceBandBar } from "@/components/price/PriceBandBar";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductCard";
import {
  applyFilters,
  getBrands,
  getCatalog,
  priceHistogram,
  type Filters,
  type SortKey,
} from "@/lib/catalog";
import { CATEGORY_MAP, type CategoryId, type MoodId, type ShoeType } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "전체 상품",
  description: "카테고리·브랜드·종류·가격대·사이즈로 좁혀 원하는 신발을 찾아보세요.",
};

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}
function list(v: string | string[] | undefined): string[] {
  const s = one(v);
  return s ? s.split(",").filter(Boolean) : [];
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const all = await getCatalog();
  const brands = await getBrands();

  const category = one(sp.category) as CategoryId | null;
  const filters: Filters = {
    category: category && CATEGORY_MAP[category] ? category : null,
    brands: list(sp.brand),
    types: list(sp.type) as ShoeType[],
    moods: list(sp.mood) as MoodId[],
    bands: list(sp.band),
    size: one(sp.size) ? Number(one(sp.size)) : null,
    sort: (one(sp.sort) as SortKey) ?? "recommended",
    q: one(sp.q),
  };

  const filtered = applyFilters(all, filters);

  // 가격 분포의 "전체" 막대는 가격대를 제외한 나머지 필터를 적용한 결과로 잡는다.
  // 그래야 막대를 눌렀을 때 숫자가 말이 된다.
  const withoutBand = applyFilters(all, { ...filters, bands: [] });

  const cat = filters.category ? CATEGORY_MAP[filters.category] : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {cat ? cat.name : "전체 상품"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
          {cat ? cat.description : "44개 상품을 카테고리·가격대·무드로 좁혀 비교해보세요."}
        </p>
      </header>

      <Suspense fallback={<div className="h-40 rounded-card border border-line bg-surface" />}>
        <PriceBandBar
          total={priceHistogram(withoutBand)}
          filtered={priceHistogram(filtered)}
          accent={filters.category ?? "sports"}
        />
      </Suspense>

      <div className="mt-6 rounded-card border border-line p-4 sm:p-5">
        <Suspense fallback={<div className="h-64" />}>
          <ProductFilters brands={brands} resultCount={filtered.length} />
        </Suspense>
      </div>

      <div className="mt-8">
        <ProductGrid
          products={filtered}
          emptyMessage="조건에 맞는 상품이 없습니다. 가격대나 필터를 조금 넓혀보세요."
        />
      </div>
    </div>
  );
}
