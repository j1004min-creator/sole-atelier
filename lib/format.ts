export function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

/** 목록 카드처럼 좁은 자리에서 쓰는 축약 표기 (139,000 → 13.9만) */
export function formatShortKRW(value: number): string {
  if (value >= 100000000) return (value / 100000000).toFixed(1).replace(/\.0$/, "") + "억";
  if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, "") + "만";
  return value.toLocaleString("ko-KR");
}

export function formatSize(mm: number): string {
  return String(mm);
}

export function discountRate(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
