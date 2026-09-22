import type { MetadataRoute } from "next";

import { getCatalog } from "@/lib/catalog";
import { MOODS } from "@/lib/taxonomy";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sole-atelier.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();

  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/products`, priority: 0.9 },
    { url: `${BASE}/mood`, priority: 0.8 },
    { url: `${BASE}/brands`, priority: 0.7 },
    { url: `${BASE}/tryon`, priority: 0.7 },
    ...MOODS.map((m) => ({ url: `${BASE}/mood/${m.id}`, priority: 0.6 })),
    ...products.map((p) => ({ url: `${BASE}/products/${p.slug}`, priority: 0.6 })),
  ];
}
