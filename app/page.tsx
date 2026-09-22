import Image from "next/image";
import Link from "next/link";

import { HeroSearch } from "@/components/home/HeroSearch";
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
  const inStock = all.filter((p) => p.stock > 0).length;

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    products: all.filter((p) => p.category === c.id),
  }));

  return (
    <>
      {/* 히어로 — 여기서 바로 조건을 고르고 결과로 갈 수 있게 한다 */}
      <section className="border-b border-line bg-[linear-gradient(165deg,#eef1f6_0%,#f7f8fa_50%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-medium text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-contemporary" aria-hidden />
              지금 살 수 있는 {inStock}개 · 7만원부터 235만원까지
            </span>

            <h1 className="mt-4 text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-5xl">
              발품 팔지 않아도
              <br />
              <span className="text-accent">여기서 다 비교돼요.</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2 sm:text-base">
              나이키·아디다스부터 샤넬·에르메스까지 한 자리에. 가격대를 그래프로 보고, 상황에 맞는
              무드로 고르고, 가상 실착으로 미리 신어보세요.
            </p>

            <div className="mt-6">
              <HeroSearch />
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
              {[
                "5만원 이상 무료배송",
                "가상 실착으로 미리 확인",
                "가격대 한눈에 비교",
                "토스페이먼츠 간편결제",
              ].map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
          </div>

          <div className="hidden gap-2 lg:grid lg:grid-cols-2">
            {all.slice(0, 4).map((p, i) => (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className={`group relative overflow-hidden rounded-2xl border border-line bg-paper ${
                  i % 3 === 0 ? "row-span-2 aspect-3/5" : "aspect-square"
                }`}
              >
                <Image
                  src={p.imageUrl}
                  alt={p.imageAlt}
                  fill
                  sizes="220px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  priority={i === 0}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 무드 추천 — 메인의 첫 섹션 */}
      <section className="mx-auto max-w-[1280px] px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent">MOOD PICK</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              오늘, 어디 가세요?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              상황만 고르면 어울리는 신발과 스타일링 팁까지 함께 보여드립니다.
            </p>
          </div>
          <Link
            href="/mood"
            className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
          >
            무드 전체 보기
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOODS.map((m) => {
            const picks = all.filter((p) => p.moods.includes(m.id));
            return (
              <Link
                key={m.id}
                href={`/mood/${m.id}`}
                className="group overflow-hidden rounded-2xl border border-line transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_-14px_rgba(16,19,25,0.28)]"
              >
                <div className="p-5" style={{ background: m.gradient }}>
                  <span className="text-3xl" aria-hidden>
                    {m.emoji}
                  </span>
                  <p className="mt-3 text-base font-semibold" style={{ color: m.accent }}>
                    {m.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-2/80">
                    {m.headline}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 bg-paper px-4 py-3">
                  <div className="flex -space-x-2">
                    {picks.slice(0, 3).map((p) => (
                      <span
                        key={p.slug}
                        className="relative block h-8 w-8 overflow-hidden rounded-full border-2 border-paper bg-surface"
                      >
                        <Image src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted tnum">{picks.length}개 추천 →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 카테고리 */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">브랜드 티어로 찾기</h2>
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
                  className="group overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-line-strong"
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
        </div>
      </section>

      {/* 가격대 */}
      <section className="mx-auto max-w-[1280px] px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">예산부터 정하셨다면</h2>
        <p className="mt-1.5 text-sm text-muted">가격대를 고르면 그 범위 상품만 모아 보여드립니다.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRICE_BANDS.map((b) => {
            const n = histogram.find((h) => h.id === b.id)?.count ?? 0;
            return (
              <Link
                key={b.id}
                href={`/products?band=${b.id}`}
                className="rounded-2xl border border-line px-4 py-5 transition-colors hover:border-accent"
              >
                <p className="text-sm font-semibold tnum">{b.label}</p>
                <p className="mt-1 text-xs text-muted tnum">{n}개 상품</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 가상 실착 */}
      <section className="border-y border-line bg-surface-2">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-accent">VIRTUAL FITTING</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              사진만 보고 고르지 마세요
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">
              내 사진이나 모델컷 위에 신발을 올려 크기와 각도를 맞춰보는{" "}
              <strong className="font-semibold">합성 실착</strong>. 업로드한 사진은 브라우저 밖으로
              나가지 않습니다.
            </p>
            <Link
              href="/tryon"
              className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              가상 실착 스튜디오 열기
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MODEL_SHOTS.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="relative aspect-2/3 overflow-hidden rounded-2xl border border-line bg-paper"
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
            <h2 className="text-2xl font-semibold tracking-tight">새로 들어왔어요</h2>
            <Link href="/products?sort=new" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
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
          <h2 className="text-2xl font-semibold tracking-tight">많이 찾는 신발</h2>
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
