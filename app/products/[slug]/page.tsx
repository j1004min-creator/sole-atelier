import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductTabs } from "@/components/product/ProductTabs";
import { getSessionUser } from "@/lib/auth";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { CATEGORY_MAP, SHOE_TYPE_MAP } from "@/lib/taxonomy";
import { CATEGORY_CLASSES } from "@/lib/theme";
import { isAiTryOnEnabled } from "@/lib/tryon-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "상품을 찾을 수 없습니다" };
  return {
    title: `${product.brand.nameKo} ${product.nameKo}`,
    description: product.description.slice(0, 120),
    openGraph: { images: [product.imageUrl] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await getCatalog();
  const sessionUser = await getSessionUser();
  const cat = CATEGORY_MAP[product.category];
  const cls = CATEGORY_CLASSES[product.category];

  const related = all
    .filter((p) => p.slug !== product.slug)
    .filter((p) => p.moods.some((m) => product.moods.includes(m)) || p.brand.slug === product.brand.slug)
    .slice(0, 4);

  const tryOnAlternatives = all
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 7);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:py-8">
      <nav aria-label="경로" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          홈
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-ink">
          {cat.name}
        </Link>
        <span aria-hidden>›</span>
        <Link
          href={`/products?brand=${product.brand.slug}`}
          className="hover:text-ink"
        >
          {product.brand.nameKo}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="relative aspect-4/5 overflow-hidden rounded-card border border-line bg-surface">
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls.bg} ${cls.text}`}>
              {cat.name}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2">
              {SHOE_TYPE_MAP[product.shoeType]}
            </span>
            <Link
              href={`/tryon?slug=${product.slug}`}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 hover:border-ink"
            >
              전체 화면으로 실착해보기 →
            </Link>
          </div>
        </div>

        <BuyBox product={product} isLoggedIn={Boolean(sessionUser)} />
      </div>

      <ProductTabs
        product={product}
        alternatives={tryOnAlternatives}
        aiEnabled={isAiTryOnEnabled()}
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-semibold tracking-tight">함께 보면 좋은 신발</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
