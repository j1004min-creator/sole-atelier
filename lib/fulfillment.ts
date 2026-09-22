/** 배송 단계 정의. 실제 택배사 연동 대신 관리자가 단계를 올린다. */

export type FulfillmentStatus = "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

export type FulfillmentStep = {
  id: FulfillmentStatus;
  label: string;
  description: string;
};

export const FULFILLMENT_STEPS: FulfillmentStep[] = [
  {
    id: "PREPARING",
    label: "상품 준비중",
    description: "주문을 확인하고 상품을 포장하고 있습니다.",
  },
  {
    id: "SHIPPED",
    label: "배송 시작",
    description: "택배사에 상품을 인계했습니다.",
  },
  {
    id: "IN_TRANSIT",
    label: "배송중",
    description: "상품이 배송지로 이동하고 있습니다.",
  },
  {
    id: "DELIVERED",
    label: "배송 완료",
    description: "상품이 배송지에 도착했습니다.",
  },
];

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  PREPARING: "상품 준비중",
  SHIPPED: "배송 시작",
  IN_TRANSIT: "배송중",
  DELIVERED: "배송 완료",
};

export function stepIndex(status: string | null | undefined): number {
  const i = FULFILLMENT_STEPS.findIndex((s) => s.id === status);
  return i < 0 ? 0 : i;
}

/** 주문일 기준 예상 도착일 (영업일 개념 없이 단순 +3일) */
export function estimatedArrival(createdAt: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/** 데모용 택배사 목록 */
export const COURIERS = ["CJ대한통운", "우체국택배", "한진택배", "롯데택배", "로젠택배"];
