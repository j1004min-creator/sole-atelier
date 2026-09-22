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

/**
 * 한국 시간대로 고정해서 찍는다.
 *
 * timeZone 을 안 주면 실행 환경의 타임존을 따라간다. 로컬(KST)에서는 맞게 보이지만
 * Vercel 서버는 UTC 라서 서버 렌더링된 주문 시각이 9시간 어긋났다.
 * 서버·클라이언트 어디서 렌더링하든 같은 값이 나오도록 명시한다.
 */
const KST = "Asia/Seoul";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 푸터 저작권 연도 등. 이것도 서버 타임존을 타지 않게 한다. */
export function currentYearKST(): number {
  return Number(
    new Date().toLocaleDateString("en-US", { timeZone: KST, year: "numeric" }),
  );
}
