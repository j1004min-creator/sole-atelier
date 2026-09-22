"use client";

import { useState } from "react";

import type { Product } from "@/lib/catalog";

import { AiStudio } from "./AiStudio";
import { CanvasStudio } from "./CanvasStudio";

const TABS = [
  { id: "canvas", label: "합성 실착", hint: "실제 상품 사진 · 무제한" },
  { id: "ai", label: "AI 실착", hint: "AI 생성 · 하루 제한" },
] as const;

export function TryOnStudio({
  product,
  alternatives,
  aiEnabled,
}: {
  product: Product;
  alternatives: Product[];
  aiEnabled: boolean;
}) {
  const [tab, setTab] = useState<"canvas" | "ai">("canvas");

  return (
    <div>
      <div role="tablist" aria-label="가상 실착 방식" className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-card border px-4 py-3 text-left transition-colors sm:flex-none sm:px-5 ${
              tab === t.id
                ? "border-ink bg-ink text-white"
                : "border-line bg-paper hover:border-line-strong"
            }`}
          >
            <span className="block text-sm font-medium">{t.label}</span>
            <span
              className={`mt-0.5 block text-[11px] ${tab === t.id ? "text-white/70" : "text-muted"}`}
            >
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "canvas" ? (
          <CanvasStudio product={product} alternatives={alternatives} />
        ) : (
          <AiStudio product={product} enabled={aiEnabled} />
        )}
      </div>
    </div>
  );
}
