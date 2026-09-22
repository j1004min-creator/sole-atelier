import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getCatalog } from "@/lib/catalog";
import { formatShortKRW } from "@/lib/format";
import { CATEGORIES } from "@/lib/taxonomy";
import { CATEGORY_CLASSES } from "@/lib/theme";

export const metadata: Metadata = {
  title: "브랜드",
  description: "스포츠·명품·컨템포러리 브랜드를 한눈에.",
};

export default async function BrandsPage() {
  const all = await getCatalog();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">브랜드</h1>
      <p className="mt-2 text-sm text-muted">티어별로 정리했습니다.</p>

      <div className="mt-10 space-y-12">
        {CATEGORIES.map((cat) => {
          const cls = CATEGORY_CLASSES[cat.id];
          const brandMap = new Map<string, { nameKo: string; name: string; count: number; min: number; cover: string; alt: string }>();
          for (const p of all.filter((x) => x.category === cat.id)) {
            const cur = brandMap.get(p.brand.slug);
            if (cur) {
              cur.count += 1;
              cur.min = Math.min(cur.min, p.price);
            } else {
              brandMap.set(p.brand.slug, {
                nameKo: p.brand.nameKo,
                name: p.brand.name,
                count: 1,
                min: p.price,
                cover: p.imageUrl,
                alt: p.imageAlt,
              });
            }
          }

          return (
            <section key={cat.id}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cls.dot}`} aria-hidden />
                <h2 className="text-lg font-semibold">{cat.name}</h2>
                <span className="text-xs text-muted tnum">{brandMap.size}개 브랜드</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...brandMap.entries()].map(([slug, b]) => (
                  <Link
                    key={slug}
                    href={`/products?brand=${slug}`}
                    className="group overflow-hidden rounded-card border border-line transition-colors hover:border-ink"
                  >
                    <div className="relative aspect-3/2 bg-surface">
                      <Image
                        src={b.cover}
                        alt={b.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-3.5">
                      <p className="text-sm font-semibold">{b.nameKo}</p>
                      <p className="text-[11px] text-muted">{b.name}</p>
                      <p className="mt-1.5 text-xs text-ink-2 tnum">
                        {b.count}개 · {formatShortKRW(b.min)}원부터
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
