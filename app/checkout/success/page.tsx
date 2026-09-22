import { Suspense } from "react";

import { ConfirmPayment } from "./ConfirmPayment";

export const metadata = { title: "결제 확인 중" };

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Suspense
        fallback={<div className="h-56 animate-pulse rounded-card bg-surface" />}
      >
        <ConfirmPayment />
      </Suspense>
    </div>
  );
}
