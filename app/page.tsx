import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { getCatalog, priceHistogram } from "@/lib/catalog";
import { formatShortKRW } from "@/lib/format";
import { CATEGORIES, MOODS, PRICE_BANDS } from "@/lib/taxonomy";
import { CATEGORY_CLASSES } from "@/lib/theme";
import { MODEL_SHOTS, imageUrl } from "@/lib/seed-data";

export default async function HomePage() {
  const all = await getCatalog();
  const histogram = priceHistogram(all);

  const newArrivals = all.filter((p) => p.isNew).slice(0, 4);
  const bestsellers = all.filter((p) => p.isBestseller).slice(0, 4);
  const hero = all.find((p) => p.slug === "jordan-1-chicago") ?? all[0];

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    products: all.filter((p) => p.category === c.id),
  }));

  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(160deg,#eef1f6_0%,#f7f8fa_45%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted">
              MULTI-BRAND SHOE ATELIER
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
              러닝화부터 하우스 슈즈까지,
              <br />
              <span className="text-muted">한 자리에서 비교하세요.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2 sm:text-base">
              나이키·아디다스·뉴발란스부터 샤넬·프라다·구찌까지 {all.length}개 상품. 가격대를 한눈에
              보고, 상황에 맞는 무드로 고르고, 가상 실착으로 미리 신어보세요.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/products"
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                전체 상품 보기
              </Link>
              <Link
                href="/tryon"
                className="rounded-full border border-line-strong bg-paper px-5 py-3 text-sm font-medium transition-colors hover:border-ink"
              >
                가상 실착 해보기
              </Link>
            </div>
          </div>

          {hero && (
            <Link href={`/products/${hero.slug}`} className="group block">
              <div className="relative aspect-4/5 overflow-hidden rounded-card border border-line bg-paper sm:aspect-square lg:aspect-4/5">
                <Image
                  src={hero.imageUrl}
                  alt={hero.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  priority
                />
                <div className="absolute bottom-3 left-3 rounded-lg bg-paper/95 px-3.5 py-2.5 backdrop-blur">
                  <p className="text-[11px] font-medium text-muted">{hero.brand.nameKo}</p>
                  <p className="text-sm font-semibold">{hero.nameKo}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-14">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">카테고리로 찾기</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {byCategory.map((c) => {
            const cls = CATEGORY_CLASSES[c.id];
            const cover = c.products[0];
            const min = Math.min(...c.products.map((p) => p.price));
            const max = Math.max(...c.products.map((p) => p.price));
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="group overflow-hidden rounded-card border border-line transition-colors hover:border-line-strong"
              >
                {cover && (
                  <div className="relative aspect-16/10 overflow-hidden bg-surface">
                    <Image
                      src={cover.imageUrl}
                      alt={cover.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cls.dot}`} aria-hidden />
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    <span className="ml-auto text-xs text-muted tnum">{c.products.length}개</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{c.tagline}</p>
                  <p className="mt-2.5 text-xs font-medium text-ink-2 tnum">
                    {formatShortKRW(min)} ~ {formatShortKRW(max)}원
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">오늘, 어디 가세요?</h2>
              <p className="mt-1.5 text-sm text-muted">
                상황에 맞는 신발을 골라뒀습니다. 스타일링 팁도 함께 있어요.
              </p>
            </div>
            <Link
              href="/mood"
              className="text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              무드 전체 보기
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MOODS.map((m) => {
              const n = all.filter((p) => p.moods.includes(m.id)).length;
              return (
                <Link
                  key={m.id}
                  href={`/mood/${m.id}`}
                  className="group rounded-card border border-line p-4 transition-transform hover:-translate-y-0.5"
                  style={{ background: m.gradient }}
                >
                  <span className="text-2xl" aria-hidden>
                    {m.emoji}
                  </span>
                  <p className="mt-2 text-sm font-semibold" style={{ color: m.accent }}>
                    {m.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-2/70 tnum">{n}개 추천</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-14">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">예산부터 정하셨다면</h2>
        <p className="mt-1.5 text-sm text-muted">
          가격대를 고르면 그 범위 상품만 모아 보여드립니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRICE_BANDS.map((b) => {
            const n = histogram.find((h) => h.id === b.id)?.count ?? 0;
            return (
              <Link
                key={b.id}
                href={`/products?band=${b.id}`}
                className="rounded-card border border-line px-4 py-5 transition-colors hover:border-ink"
              >
                <p className="text-sm font-semibold tnum">{b.label}</p>
                <p className="mt-1 text-xs text-muted tnum">{n}개 상품</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface-2">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted">VIRTUAL FITTING</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              사진만 보고 고르지 마세요
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">
              내 사진이나 모델컷 위에 신발을 올려 크기와 각도를 맞춰보는{" "}
              <strong className="font-semibold">합성 실착</strong>, 그리고 AI가 실제로 신은 모습을
              그려주는 <strong className="font-semibold">AI 실착</strong>. 업로드한 사진은 브라우저
              밖으로 나가지 않습니다.
            </p>
            <Link
              href="/tryon"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              가상 실착 스튜디오 열기
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MODEL_SHOTS.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="relative aspect-2/3 overflow-hidden rounded-card border border-line bg-paper"
              >
                <Image
                  src={imageUrl(m.imageId, 400, 600)}
                  alt={m.label}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-14">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">새로 들어왔어요</h2>
            <Link
              href="/products?sort=new"
              className="text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              더 보기
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 pb-14">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">많이 찾는 신발</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
