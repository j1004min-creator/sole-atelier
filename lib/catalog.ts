import { cache } from "react";

import { createClient, hasSupabaseEnv } from "./supabase/server";
import { BRANDS, PRODUCTS, imageUrl } from "./seed-data";
import type { CategoryId, MoodId, ShoeType } from "./taxonomy";
import { PRICE_BANDS, bandOf } from "./taxonomy";

export type Brand = {
  slug: string;
  name: string;
  nameKo: string;
  category: CategoryId;
  country: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameKo: string;
  brand: Brand;
  category: CategoryId;
  shoeType: ShoeType;
  price: number;
  compareAtPrice: number | null;
  description: string;
  story: string;
  materials: string;
  colorway: string;
  imageUrl: string;
  imageAlt: string;
  sizes: number[];
  moods: MoodId[];
  isNew: boolean;
  isBestseller: boolean;
  stock: number;
};

/** Supabase 가 없거나 조회에 실패했을 때 쓰는 폴백. 사이트가 빈 화면이 되지 않게 한다. */
function fallbackCatalog(): Product[] {
  const brandBySlug = new Map(
    BRANDS.map((b) => [
      b.slug,
      { slug: b.slug, name: b.name, nameKo: b.nameKo, category: b.category, country: b.country },
    ]),
  );
  return PRODUCTS.map((p) => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    nameKo: p.nameKo,
    brand: brandBySlug.get(p.brandSlug)!,
    category: p.category,
    shoeType: p.shoeType,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    description: p.description,
    story: p.story,
    materials: p.materials,
    colorway: p.colorway,
    imageUrl: imageUrl(p.imageId),
    imageAlt: p.imageAlt,
    sizes: p.sizes,
    moods: p.moods,
    isNew: Boolean(p.isNew),
    isBestseller: Boolean(p.isBestseller),
    stock: p.stock,
  }));
}

type Row = {
  id: string;
  slug: string;
  name: string;
  name_ko: string;
  category: CategoryId;
  shoe_type: ShoeType;
  price: number;
  compare_at_price: number | null;
  description: string;
  story: string;
  materials: string;
  colorway: string;
  image_url: string;
  image_alt: string;
  sizes: number[];
  is_new: boolean;
  is_bestseller: boolean;
  stock: number;
  shoe_brands: {
    slug: string;
    name: string;
    name_ko: string;
    category: CategoryId;
    country: string | null;
  } | null;
  shoe_product_moods: { mood_id: MoodId }[] | null;
};

/** 한 요청 안에서는 한 번만 조회한다. */
export const getCatalog = cache(async (): Promise<Product[]> => {
  if (!hasSupabaseEnv()) return fallbackCatalog();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shoe_products")
      .select(
        "id, slug, name, name_ko, category, shoe_type, price, compare_at_price, description," +
          " story, materials, colorway, image_url, image_alt, sizes, is_new, is_bestseller, stock," +
          " shoe_brands ( slug, name, name_ko, category, country )," +
          " shoe_product_moods ( mood_id )",
      )
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return fallbackCatalog();

    return (data as unknown as Row[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      nameKo: r.name_ko,
      brand: {
        slug: r.shoe_brands?.slug ?? "",
        name: r.shoe_brands?.name ?? "",
        nameKo: r.shoe_brands?.name_ko ?? "",
        category: r.shoe_brands?.category ?? r.category,
        country: r.shoe_brands?.country ?? "",
      },
      category: r.category,
      shoeType: r.shoe_type,
      price: r.price,
      compareAtPrice: r.compare_at_price,
      description: r.description,
      story: r.story,
      materials: r.materials,
      colorway: r.colorway,
      imageUrl: r.image_url,
      imageAlt: r.image_alt,
      sizes: r.sizes ?? [],
      moods: (r.shoe_product_moods ?? []).map((m) => m.mood_id),
      isNew: r.is_new,
      isBestseller: r.is_bestseller,
      stock: r.stock,
    }));
  } catch {
    return fallbackCatalog();
  }
});

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getCatalog();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getBrands(): Promise<Brand[]> {
  const all = await getCatalog();
  const map = new Map<string, Brand>();
  for (const p of all) if (p.brand.slug) map.set(p.brand.slug, p.brand);
  return [...map.values()];
}

export async function getProductsByMood(mood: MoodId): Promise<Product[]> {
  const all = await getCatalog();
  return all.filter((p) => p.moods.includes(mood));
}

/** 5개 가격 구간별 개수. 분포 그래프에 쓴다. */
export function priceHistogram(products: Product[]): { id: string; count: number }[] {
  const counts = new Map(PRICE_BANDS.map((b) => [b.id, 0]));
  for (const p of products) {
    const b = bandOf(p.price);
    counts.set(b.id, (counts.get(b.id) ?? 0) + 1);
  }
  return PRICE_BANDS.map((b) => ({ id: b.id, count: counts.get(b.id) ?? 0 }));
}

export type SortKey = "recommended" | "price-asc" | "price-desc" | "new";

export type Filters = {
  category?: CategoryId | null;
  brands?: string[];
  types?: ShoeType[];
  bands?: string[];
  moods?: MoodId[];
  size?: number | null;
  sort?: SortKey;
  q?: string | null;
};

export function applyFilters(products: Product[], f: Filters): Product[] {
  let out = products;

  if (f.category) out = out.filter((p) => p.category === f.category);
  if (f.brands?.length) out = out.filter((p) => f.brands!.includes(p.brand.slug));
  if (f.types?.length) out = out.filter((p) => f.types!.includes(p.shoeType));
  if (f.moods?.length) out = out.filter((p) => p.moods.some((m) => f.moods!.includes(m)));
  if (f.size) out = out.filter((p) => p.sizes.includes(f.size!));
  if (f.bands?.length) {
    out = out.filter((p) => f.bands!.includes(bandOf(p.price).id));
  }
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    if (q) {
      out = out.filter((p) =>
        [p.nameKo, p.name, p.brand.name, p.brand.nameKo, p.colorway]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
  }

  switch (f.sort) {
    case "price-asc":
      return [...out].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...out].sort((a, b) => b.price - a.price);
    case "new":
      return [...out].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    default:
      return [...out].sort(
        (a, b) => Number(b.isBestseller) - Number(a.isBestseller) || a.price - b.price,
      );
  }
}
