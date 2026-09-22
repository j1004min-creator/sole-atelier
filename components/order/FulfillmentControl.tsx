"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { COURIERS, FULFILLMENT_STEPS, type FulfillmentStatus } from "@/lib/fulfillment";

type Props = {
  orderId: string;
  orderName: string;
  customerName: string;
  status: FulfillmentStatus | string;
  courier: string | null;
  trackingNumber: string | null;
};

export function FulfillmentControl({
  orderId,
  orderName,
  customerName,
  status,
  courier,
  trackingNumber,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string>(status);
  const [carrier, setCarrier] = useState(courier ?? "");
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const dirty =
    value !== status || carrier !== (courier ?? "") || tracking !== (trackingNumber ?? "");

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("shoe_set_fulfillment", {
        p_order_id: orderId,
        p_status: value,
        p_courier: carrier || null,
        p_tracking: tracking || null,
        p_note: null,
      });
      if (error) {
        setMessage({ kind: "error", text: error.message });
        return;
      }
      setMessage({ kind: "ok", text: "저장했습니다." });
      router.refresh();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "저장에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{orderName}</p>
        <p className="text-xs text-muted tnum">
          {customerName} · {orderId}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]">
        <label className="block">
          <span className="text-[11px] text-muted">배송 단계</span>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-2 text-sm"
          >
            {FULFILLMENT_STEPS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] text-muted">택배사</span>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-2 text-sm"
          >
            <option value="">선택 안 함</option>
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] text-muted">송장번호</span>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="123456789012"
            className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-2 text-sm tnum outline-none focus:border-ink"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:bg-line-strong sm:w-auto"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-2 text-xs ${message.kind === "ok" ? "text-contemporary" : "text-sale"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
