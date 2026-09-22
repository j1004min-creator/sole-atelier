import Image from "next/image";
import Link from "next/link";

import { PriceBadge } from "@/components/price/PriceBadge";
import type { Product } from "@/lib/catalog";
import { discountRate, formatKRW } from "@/lib/format";
import { CATEGORY_CLASSES } from "@/lib/theme";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const off = discountRate(product.price, product.compareAtPrice);
  const cat = CATEGORY_CLASSES[product.category];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus:outline-none"
      aria-label={`${product.brand.nameKo} ${product.nameKo}`}
    >
      <div className="relative overflow-hidden rounded-card border border-line bg-surface">
        <div className="relative aspect-4/5">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
        </div>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
          {product.isNew && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
              NEW
            </span>
          )}
          {product.isBestseller && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cat.solid}`}>
              BEST
            </span>
          )}
          {off !== null && (
            <span className="rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold text-white tnum">
              {off}%
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute right-2 top-2">
          <PriceBadge price={product.price} />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} aria-hidden />
          <p className="truncate text-xs font-medium text-muted">{product.brand.nameKo}</p>
        </div>
        <p className="mt-0.5 truncate text-sm font-medium group-hover:underline">
          {product.nameKo}
        </p>
        <p className="mt-1 text-sm font-semibold tnum">
          {formatKRW(product.price)}
          {product.compareAtPrice && (
            <span className="ml-1.5 text-xs font-normal text-muted line-through tnum">
              {formatKRW(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  emptyMessage = "조건에 맞는 상품이 없습니다.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (!products.length) {
    return (
      <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
