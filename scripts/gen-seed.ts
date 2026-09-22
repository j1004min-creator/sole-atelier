/**
 * lib/seed-data.ts 를 검증하고 Supabase 시드 SQL 을 표준출력으로 낸다.
 *   node --experimental-strip-types scripts/gen-seed.ts > supabase/migrations/0003_seed.sql
 */
import { BRANDS, PRODUCTS, MODEL_SHOTS, imageUrl } from "../lib/seed-data.ts";

const CATEGORIES = new Set(["sports", "luxury", "contemporary"]);
const TYPES = new Set(["sneakers", "running", "boots", "dress", "heels", "sandals"]);
const MOODS = new Set(["wedding", "office", "sporty", "walk", "date", "travel", "party", "campus"]);

const errors: string[] = [];
const brandSlugs = new Set(BRANDS.map((b) => b.slug));

if (brandSlugs.size !== BRANDS.length) errors.push("브랜드 slug 중복");

const seenSlug = new Set<string>();
const seenImage = new Map<string, string>();

for (const p of PRODUCTS) {
  if (seenSlug.has(p.slug)) errors.push(`상품 slug 중복: ${p.slug}`);
  seenSlug.add(p.slug);

  if (!brandSlugs.has(p.brandSlug)) errors.push(`${p.slug}: 알 수 없는 브랜드 ${p.brandSlug}`);
  if (!CATEGORIES.has(p.category)) errors.push(`${p.slug}: 잘못된 카테고리 ${p.category}`);
  if (!TYPES.has(p.shoeType)) errors.push(`${p.slug}: 잘못된 종류 ${p.shoeType}`);
  if (!p.moods.length) errors.push(`${p.slug}: 무드가 없음`);
  for (const m of p.moods) if (!MOODS.has(m)) errors.push(`${p.slug}: 잘못된 무드 ${m}`);
  if (p.price <= 0) errors.push(`${p.slug}: 가격 오류`);
  if (p.compareAtPrice && p.compareAtPrice <= p.price) errors.push(`${p.slug}: 정가가 판매가보다 낮음`);
  if (!p.sizes.length) errors.push(`${p.slug}: 사이즈 없음`);
  if (!/^\d{9,14}-[0-9a-z]+$/.test(p.imageId)) errors.push(`${p.slug}: 이미지 ID 형식 오류 ${p.imageId}`);
  if (!p.imageAlt) errors.push(`${p.slug}: alt 누락`);

  // 브랜드 티어와 상품 카테고리가 어긋나면 목록 색상이 뒤섞인다
  const brand = BRANDS.find((b) => b.slug === p.brandSlug)!;
  if (brand.category !== p.category) {
    errors.push(`${p.slug}: 브랜드(${brand.category})와 상품 카테고리(${p.category}) 불일치`);
  }

  const prev = seenImage.get(p.imageId);
  if (prev) errors.push(`이미지 중복: ${p.imageId} (${prev} ↔ ${p.slug})`);
  seenImage.set(p.imageId, p.slug);
}

for (const m of MODEL_SHOTS) {
  if (seenImage.has(m.imageId)) errors.push(`모델컷이 상품 이미지와 중복: ${m.imageId}`);
}

if (errors.length) {
  console.error("시드 검증 실패:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

const q = (s: string) => "'" + s.replace(/'/g, "''") + "'";

const lines: string[] = [];
lines.push("-- 이 파일은 scripts/gen-seed.ts 가 생성한다. 직접 고치지 말 것.");
lines.push("-- 원본: lib/seed-data.ts");
lines.push("");
lines.push("delete from public.shoe_product_moods;");
lines.push("delete from public.shoe_products;");
lines.push("delete from public.shoe_brands;");
lines.push("");

for (const b of BRANDS) {
  lines.push(
    `insert into public.shoe_brands (slug, name, name_ko, category, country, sort_order) values (${q(b.slug)}, ${q(b.name)}, ${q(b.nameKo)}, ${q(b.category)}, ${q(b.country)}, ${b.sortOrder});`,
  );
}
lines.push("");

const prodRows: string[] = [];
const moodRows: string[] = [];

PRODUCTS.forEach((p, i) => {
  const brandLookup = "(select id from public.shoe_brands where slug = " + q(p.brandSlug) + ")";
  prodRows.push(
    "(" +
      [
        q(p.slug),
        q(p.name),
        q(p.nameKo),
        brandLookup,
        q(p.category),
        q(p.shoeType),
        String(p.price),
        p.compareAtPrice ? String(p.compareAtPrice) : "null",
        q(p.description),
        q(p.story),
        q(p.materials),
        q(p.colorway),
        q(imageUrl(p.imageId)),
        q(p.imageAlt),
        "'{" + p.sizes.join(",") + "}'",
        p.isNew ? "true" : "false",
        p.isBestseller ? "true" : "false",
        String(p.stock),
        String(i + 1),
      ].join(",") +
      ")",
  );
  for (const m of p.moods) moodRows.push("(" + q(p.slug) + "," + q(m) + ")");
});

lines.push(
  "insert into public.shoe_products (slug, name, name_ko, brand_id, category, shoe_type, price," +
    " compare_at_price, description, story, materials, colorway, image_url, image_alt, sizes," +
    " is_new, is_bestseller, stock, sort_order) values",
);
lines.push(prodRows.join(",\n") + ";");
lines.push("");
lines.push("insert into public.shoe_product_moods (product_id, mood_id)");
lines.push("select p.id, v.mood from (values");
lines.push(moodRows.join(","));
lines.push(") as v(slug, mood) join public.shoe_products p on p.slug = v.slug;");

console.log(lines.join("\n"));
console.error(
  "OK  브랜드 " + BRANDS.length + " / 상품 " + PRODUCTS.length + " / 무드매핑 " + moodRows.length,
);
