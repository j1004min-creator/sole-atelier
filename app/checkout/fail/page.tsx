import Link from "next/link";

export const metadata = { title: "결제 실패" };

/** 토스 SDK 가 failUrl 로 넘겨주는 주요 에러 코드를 한국어로 풀어준다. */
const MESSAGES: Record<string, { title: string; detail: string }> = {
  PAY_PROCESS_CANCELED: {
    title: "결제를 취소하셨습니다",
    detail: "결제창을 닫으면 결제가 중단됩니다. 장바구니는 그대로 남아 있어요.",
  },
  PAY_PROCESS_ABORTED: {
    title: "결제가 중단되었습니다",
    detail: "결제 진행 중 문제가 생겼습니다. 결제 수단을 바꿔 다시 시도해보세요.",
  },
  REJECT_CARD_COMPANY: {
    title: "카드사에서 승인을 거절했습니다",
    detail: "한도 초과, 비밀번호 오류, 정지된 카드 등이 원인일 수 있습니다. 다른 카드로 시도해보세요.",
  },
  INVALID_CARD_EXPIRATION: {
    title: "카드 유효기간이 올바르지 않습니다",
    detail: "카드 앞면의 유효기간을 다시 확인해주세요.",
  },
  EXCEED_MAX_DAILY_PAYMENT_COUNT: {
    title: "하루 결제 횟수를 초과했습니다",
    detail: "테스트 환경의 일일 한도에 걸렸습니다. 내일 다시 시도해주세요.",
  },
};

export default async function FailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string; orderId?: string }>;
}) {
  const { code, message, orderId } = await searchParams;
  const known = code ? MESSAGES[code] : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-card border border-line p-8">
        <h1 className="text-xl font-semibold">{known?.title ?? "결제를 완료하지 못했습니다"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          {known?.detail ?? message ?? "알 수 없는 이유로 결제가 진행되지 않았습니다."}
        </p>

        <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
          {code && (
            <div className="flex justify-between py-3">
              <dt className="text-muted">오류 코드</dt>
              <dd className="font-medium">{code}</dd>
            </div>
          )}
          {orderId && (
            <div className="flex justify-between py-3">
              <dt className="text-muted">주문번호</dt>
              <dd className="tnum">{orderId}</dd>
            </div>
          )}
          {message && known && (
            <div className="py-3">
              <dt className="text-muted">원본 메시지</dt>
              <dd className="mt-1 text-xs text-muted">{message}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/checkout"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            다시 결제하기
          </Link>
          <Link
            href="/cart"
            className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
          >
            장바구니 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
