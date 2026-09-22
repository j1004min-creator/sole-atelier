import { formatDateTime } from "@/lib/format";
import {
  FULFILLMENT_STEPS,
  estimatedArrival,
  stepIndex,
  type FulfillmentStatus,
} from "@/lib/fulfillment";

type Props = {
  status: FulfillmentStatus | string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  note: string | null;
  address: string | null;
  postcode: string | null;
};

export function DeliveryTimeline({
  status,
  createdAt,
  paidAt,
  shippedAt,
  deliveredAt,
  courier,
  trackingNumber,
  note,
  address,
  postcode,
}: Props) {
  const current = stepIndex(status);
  const done = status === "DELIVERED";

  // 각 단계에 실제로 도달한 시각. 없는 단계는 빈칸으로 둔다.
  const stampFor = (i: number): string | null => {
    if (i > current) return null;
    if (i === 0) return paidAt ?? createdAt;
    if (i === 1) return shippedAt;
    if (i === 3) return deliveredAt;
    return shippedAt;
  };

  return (
    <section className="mt-8 rounded-card border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">배송 현황</h2>
        {!done && (
          <p className="text-xs text-muted">
            도착 예정 <strong className="text-ink-2">{estimatedArrival(createdAt)}</strong>
          </p>
        )}
      </div>

      <ol className="mt-5">
        {FULFILLMENT_STEPS.map((step, i) => {
          const reached = i <= current;
          const isCurrent = i === current;
          const stamp = stampFor(i);
          const last = i === FULFILLMENT_STEPS.length - 1;

          return (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold ${
                    reached
                      ? "border-ink bg-ink text-white"
                      : "border-line-strong bg-paper"
                  }`}
                >
                  {reached ? "✓" : ""}
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className={`w-0.5 flex-1 ${i < current ? "bg-ink" : "bg-line"}`}
                    style={{ minHeight: "2.25rem" }}
                  />
                )}
              </div>

              <div className={last ? "pb-0" : "pb-5"}>
                <p
                  className={`text-sm ${
                    isCurrent ? "font-semibold text-ink" : reached ? "text-ink-2" : "text-muted"
                  }`}
                >
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
                      현재
                    </span>
                  )}
                </p>
                {reached && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.description}</p>
                )}
                {stamp && (
                  <p className="mt-0.5 text-xs text-muted tnum">{formatDateTime(stamp)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {(courier || trackingNumber || address || note) && (
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          {courier && (
            <div className="flex gap-4">
              <dt className="w-20 shrink-0 text-muted">택배사</dt>
              <dd>{courier}</dd>
            </div>
          )}
          {trackingNumber && (
            <div className="flex gap-4">
              <dt className="w-20 shrink-0 text-muted">송장번호</dt>
              <dd className="tnum">{trackingNumber}</dd>
            </div>
          )}
          {address && (
            <div className="flex gap-4">
              <dt className="w-20 shrink-0 text-muted">배송지</dt>
              <dd>
                {postcode && <span className="text-muted tnum">({postcode}) </span>}
                {address}
              </dd>
            </div>
          )}
          {note && (
            <div className="flex gap-4">
              <dt className="w-20 shrink-0 text-muted">안내</dt>
              <dd>{note}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-4 rounded-md bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted">
        데모 사이트라 실제 배송은 이뤄지지 않습니다. 배송 단계는 관리자가 직접 바꾸며, 택배사
        시스템과 연동돼 있지 않습니다.
      </p>
    </section>
  );
}
