"use client";

import { useState } from "react";

import { TryOnStudio } from "@/components/tryon/TryOnStudio";
import type { Product } from "@/lib/catalog";
import { MOOD_MAP } from "@/lib/taxonomy";

const TABS = [
  { id: "detail", label: "상세 정보" },
  { id: "tryon", label: "가상 실착" },
  { id: "size", label: "사이즈 · 배송" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductTabs({
  product,
  alternatives,
  aiEnabled,
}: {
  product: Product;
  alternatives: Product[];
  aiEnabled: boolean;
}) {
  const [tab, setTab] = useState<TabId>("detail");

  return (
    <section className="mt-16">
      <div role="tablist" aria-label="상품 정보" className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm transition-colors ${
              tab === t.id
                ? "border-ink font-semibold text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-8">
        {tab === "detail" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">이 신발은</h3>
              <p className="mt-3 text-sm leading-[1.8] text-ink-2">{product.description}</p>
              <h3 className="mt-8 text-base font-semibold">어떻게 신으면 좋을까</h3>
              <p className="mt-3 text-sm leading-[1.8] text-ink-2">{product.story}</p>
            </div>
            <div>
              <h3 className="text-base font-semibold">이런 자리에 어울립니다</h3>
              <div className="mt-3 space-y-3">
                {product.moods.map((id) => {
                  const m = MOOD_MAP[id];
                  if (!m) return null;
                  return (
                    <div
                      key={id}
                      className="rounded-card border border-line p-4"
                      style={{ background: m.gradient }}
                    >
                      <p className="text-sm font-semibold" style={{ color: m.accent }}>
                        {m.emoji} {m.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-2/80">{m.headline}</p>
                    </div>
                  );
                })}
              </div>

              <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">브랜드</dt>
                  <dd>
                    {product.brand.nameKo} ({product.brand.name}) · {product.brand.country}
                  </dd>
                </div>
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">소재</dt>
                  <dd>{product.materials}</dd>
                </div>
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">컬러</dt>
                  <dd>{product.colorway}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {tab === "tryon" && (
          <TryOnStudio product={product} alternatives={alternatives} aiEnabled={aiEnabled} />
        )}

        {tab === "size" && (
          <div id="size-guide" className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">사이즈 고르는 법</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-2">
                <li>· 발 길이를 mm 로 재고, 그 수치에 가장 가까운 사이즈를 고르세요.</li>
                <li>· 러닝화는 발톱이 눌리지 않도록 5~10mm 크게 신는 편이 좋습니다.</li>
                <li>· 구두·로퍼는 딱 맞게, 부츠는 두꺼운 양말을 감안해 5mm 크게 고르세요.</li>
                <li>· 발볼이 넓다면 뉴발란스처럼 와이드 라스트가 있는 브랜드가 편합니다.</li>
                <li>· 발은 오후에 붓습니다. 저녁에 재는 치수가 실제에 가깝습니다.</li>
              </ul>

              <h3 className="mt-8 text-base font-semibold">이 상품의 사이즈</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-line px-2.5 py-1 text-xs tnum"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold">배송 · 교환</h3>
              <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">배송비</dt>
                  <dd>3,000원 (5만원 이상 무료)</dd>
                </div>
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">배송 기간</dt>
                  <dd>결제 후 2~4일</dd>
                </div>
                <div className="flex gap-4 py-3">
                  <dt className="w-24 shrink-0 text-muted">교환 · 반품</dt>
                  <dd>수령 후 7일 이내, 착용 흔적이 없는 경우</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-md border border-line bg-surface px-3 py-2.5 text-xs leading-relaxed text-muted">
                포트폴리오 데모입니다. 실제 배송·교환은 이뤄지지 않으며, 결제는 토스페이먼츠 테스트
                키로만 동작합니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
