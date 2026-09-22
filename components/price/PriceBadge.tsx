import { bandOf } from "@/lib/taxonomy";

/** 카드 위에 붙는 작은 가격대 라벨. 스크롤 중에도 예산 감각을 유지시켜 준다. */
export function PriceBadge({ price, className = "" }: { price: number; className?: string }) {
  const band = bandOf(price);
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-line bg-paper/90 px-2 py-0.5 text-[11px] font-medium text-ink-2 tnum backdrop-blur " +
        className
      }
    >
      {band.short}
    </span>
  );
}
