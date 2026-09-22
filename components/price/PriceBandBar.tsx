"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { buildQuery, readList, toggleInList } from "@/lib/query";
import { PRICE_BANDS, type CategoryId } from "@/lib/taxonomy";
import { CATEGORY_CLASSES } from "@/lib/theme";

type Props = {
  /** 전체 카탈로그 기준 분포 (회색 배경 막대) */
  total: { id: string; count: number }[];
  /** 현재 필터 결과 기준 분포 (색 막대) */
  filtered: { id: string; count: number }[];
  accent?: CategoryId;
};

/**
 * 가격대를 "한눈에" 보여주는 막대 그래프.
 * 회색은 전체 분포, 색은 지금 보고 있는 결과. 막대를 누르면 그대로 필터가 된다.
 */
export function PriceBandBar({ total, filtered, accent = "sports" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const selected = readList(params, "band");
  const cat = CATEGORY_CLASSES[accent];

  const max = Math.max(1, ...total.map((t) => t.count));
  const totalCount = total.reduce((n, t) => n + t.count, 0);
  const filteredCount = filtered.reduce((n, t) => n + t.count, 0);

  return (
    <section
      aria-label="가격대 분포"
      className="rounded-card border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">가격대로 좁히기</h2>
        <p className="text-xs text-muted tnum">
          {filteredCount === totalCount
            ? `전체 ${totalCount}개`
            : `${totalCount}개 중 ${filteredCount}개 표시 중`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
        {PRICE_BANDS.map((band) => {
          const t = total.find((x) => x.id === band.id)?.count ?? 0;
          const f = filtered.find((x) => x.id === band.id)?.count ?? 0;
          const isOn = selected.includes(band.id);
          const totalH = Math.max(4, Math.round((t / max) * 100));
          const fillH = t === 0 ? 0 : Math.round((f / t) * 100);

          return (
            <button
              key={band.id}
              type="button"
              aria-pressed={isOn}
              disabled={t === 0}
              onClick={() =>
                router.push(
                  buildQuery(params, { band: toggleInList(selected, band.id), page: null }),
                  { scroll: false },
                )
              }
              className={`group flex flex-col items-center gap-1.5 rounded-lg border px-1 pb-2 pt-3 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isOn ? `${cat.border} ${cat.bg}` : "border-transparent hover:bg-surface-2"
              }`}
            >
              <span className="text-[11px] font-semibold text-ink-2 tnum">{t}</span>

              <span
                className="flex h-16 w-full items-end justify-center sm:h-20"
                aria-hidden="true"
              >
                <span
                  className="relative flex w-full max-w-9 items-end overflow-hidden rounded-[3px] bg-line-strong/60"
                  style={{ height: `${totalH}%` }}
                >
                  <span
                    className={`absolute inset-x-0 bottom-0 ${cat.dot} transition-[height] duration-300`}
                    style={{ height: `${fillH}%` }}
                  />
                </span>
              </span>

              <span
                className={`text-[10px] leading-tight sm:text-[11px] ${
                  isOn ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                {band.short}
              </span>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => router.push(buildQuery(params, { band: null }), { scroll: false })}
          className="mt-3 text-xs text-muted underline underline-offset-2 hover:text-ink"
        >
          가격대 필터 지우기
        </button>
      )}
    </section>
  );
}
