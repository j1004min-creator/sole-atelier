"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Brand } from "@/lib/catalog";
import { buildQuery, readList, toggleInList } from "@/lib/query";
import { CATEGORIES, MOODS, SHOE_TYPES } from "@/lib/taxonomy";

const SORTS = [
  { id: "recommended", label: "추천순" },
  { id: "price-asc", label: "낮은 가격순" },
  { id: "price-desc", label: "높은 가격순" },
  { id: "new", label: "신상품순" },
];

const SIZES = [225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-paper text-ink-2 hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

export function ProductFilters({ brands, resultCount }: { brands: Brand[]; resultCount: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [showAllBrands, setShowAllBrands] = useState(false);

  const category = params.get("category");
  const sort = params.get("sort") ?? "recommended";
  const size = params.get("size");
  const selBrands = readList(params, "brand");
  const selTypes = readList(params, "type");
  const selMoods = readList(params, "mood");

  const push = (patch: Record<string, string | string[] | null>) =>
    router.push(buildQuery(params, patch), { scroll: false });

  const visibleBrands = showAllBrands ? brands : brands.slice(0, 10);
  const activeCount =
    (category ? 1 : 0) +
    selBrands.length +
    selTypes.length +
    selMoods.length +
    readList(params, "band").length +
    (size ? 1 : 0);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted">카테고리</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!category} onClick={() => push({ category: null })}>
            전체
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => push({ category: category === c.id ? null : c.id })}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">종류</p>
        <div className="flex flex-wrap gap-1.5">
          {SHOE_TYPES.map((t) => (
            <Chip
              key={t.id}
              active={selTypes.includes(t.id)}
              onClick={() => push({ type: toggleInList(selTypes, t.id) })}
            >
              {t.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">무드</p>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <Chip
              key={m.id}
              active={selMoods.includes(m.id)}
              onClick={() => push({ mood: toggleInList(selMoods, m.id) })}
            >
              {m.emoji} {m.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">브랜드</p>
        <div className="flex flex-wrap gap-1.5">
          {visibleBrands.map((b) => (
            <Chip
              key={b.slug}
              active={selBrands.includes(b.slug)}
              onClick={() => push({ brand: toggleInList(selBrands, b.slug) })}
            >
              {b.nameKo}
            </Chip>
          ))}
          {brands.length > 10 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="rounded-full px-3 py-1.5 text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              {showAllBrands ? "접기" : `+${brands.length - 10}개 더`}
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted">사이즈 (mm)</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <Chip
              key={s}
              active={size === String(s)}
              onClick={() => push({ size: size === String(s) ? null : String(s) })}
            >
              <span className="tnum">{s}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-muted tnum">
          <strong className="text-ink">{resultCount}</strong>개 상품
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  buildQuery(params, {
                    category: null,
                    brand: null,
                    type: null,
                    mood: null,
                    band: null,
                    size: null,
                  }),
                  { scroll: false },
                )
              }
              className="ml-3 text-xs underline underline-offset-2 hover:text-ink"
            >
              필터 {activeCount}개 초기화
            </button>
          )}
        </p>

        <label className="flex items-center gap-2 text-xs text-muted">
          정렬
          <select
            value={sort}
            onChange={(e) => push({ sort: e.target.value === "recommended" ? null : e.target.value })}
            className="rounded-md border border-line bg-paper px-2 py-1.5 text-xs text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
