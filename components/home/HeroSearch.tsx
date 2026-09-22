"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATEGORIES, PRICE_BANDS } from "@/lib/taxonomy";

/**
 * 히어로 안에서 바로 조건을 고르고 결과로 이동하는 카드.
 * 목록 페이지까지 들어가서 필터를 찾아 누르는 단계를 없앤다.
 */
export function HeroSearch() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [band, setBand] = useState("");

  function search() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (band) params.set("band", band);
    const q = params.toString();
    router.push(q ? `/products?${q}` : "/products");
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-[0_8px_32px_-12px_rgba(16,19,25,0.18)] sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <label className="block">
          <span className="text-[11px] font-medium text-muted">카테고리</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          >
            <option value="">전체 브랜드</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-[11px] font-medium text-muted">예산</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PRICE_BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={band === b.id}
                onClick={() => setBand(band === b.id ? "" : b.id)}
                className={`rounded-lg border px-3 py-2.5 text-xs tnum transition-colors ${
                  band === b.id
                    ? "border-accent bg-accent-soft font-semibold text-accent"
                    : "border-line text-ink-2 hover:border-line-strong"
                }`}
              >
                {b.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={search}
        className="mt-4 w-full rounded-lg bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        신발 찾기
      </button>
    </div>
  );
}
