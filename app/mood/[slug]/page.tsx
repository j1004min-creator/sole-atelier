import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PriceBandBar } from "@/components/price/PriceBandBar";
import { ProductGrid } from "@/components/product/ProductCard";
import { applyFilters, getCatalog, priceHistogram } from "@/lib/catalog";
import { MOODS, MOOD_MAP, type MoodId } from "@/lib/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mood = MOOD_MAP[slug as MoodId];
  if (!mood) return { title: "무드를 찾을 수 없습니다" };
  return { title: `${mood.name} 추천 신발`, description: mood.description };
}

export default async function MoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const mood = MOOD_MAP[slug as MoodId];
  if (!mood) notFound();

  const all = await getCatalog();
  const inMood = all.filter((p) => p.moods.includes(mood.id));

  const bandParam = typeof sp.band === "string" ? sp.band.split(",").filter(Boolean) : [];
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const filtered = applyFilters(inMood, {
    bands: bandParam,
    sort: (sort as "price-asc") ?? "recommended",
  });

  return (
    <div>
      <header className="border-b border-line" style={{ background: mood.gradient }}>
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:py-16">
          <nav className="mb-4 text-xs">
            <Link href="/mood" className="text-ink-2/70 hover:text-ink">
              ← 무드 전체 보기
            </Link>
          </nav>
          <p className="text-4xl" aria-hidden>
            {mood.emoji}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: mood.accent }}>
            {mood.name}
          </h1>
          <p className="mt-2 text-lg font-medium text-ink-2">{mood.headline}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2/85">{mood.description}</p>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-10">
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold">{mood.name} 스타일링 팁</h2>
          <ul className="mt-3 space-y-2">
            {mood.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white tnum"
                  style={{ background: mood.accent }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <PriceBandBar total={priceHistogram(inMood)} filtered={priceHistogram(filtered)} />
        </div>

        <div className="mt-8">
          <h2 className="mb-6 text-lg font-semibold tracking-tight">
            {mood.name}에 어울리는 {filtered.length}개
          </h2>
          <ProductGrid
            products={filtered}
            emptyMessage="선택한 가격대에는 추천 상품이 없습니다. 가격대를 넓혀보세요."
          />
        </div>

        <section className="mt-16 border-t border-line pt-8">
          <h2 className="text-sm font-semibold text-muted">다른 무드도 둘러보기</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOODS.filter((m) => m.id !== mood.id).map((m) => (
              <Link
                key={m.id}
                href={`/mood/${m.id}`}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 hover:border-ink"
              >
                {m.emoji} {m.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
