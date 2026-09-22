import type { Metadata } from "next";

import { TryOnStudio } from "@/components/tryon/TryOnStudio";
import { getCatalog } from "@/lib/catalog";
import { isAiTryOnEnabled } from "@/lib/tryon-config";

export const metadata: Metadata = {
  title: "가상 실착 스튜디오",
  description:
    "내 사진이나 모델컷 위에 신발을 올려보는 합성 실착과, AI가 신은 모습을 그려주는 AI 실착.",
};

export default async function TryOnPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const all = await getCatalog();
  const product = all.find((p) => p.slug === slug) ?? all[0];
  const alternatives = all.filter((p) => p.slug !== product.slug).slice(0, 12);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">가상 실착 스튜디오</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          신발이 내 코디에 맞을지 미리 봅니다. <strong className="text-ink-2">합성 실착</strong>은
          실제 상품 사진을 그대로 올려 크기·각도를 맞추는 방식이고,{" "}
          <strong className="text-ink-2">AI 실착</strong>은 AI가 신은 모습을 새로 그려주는
          방식입니다.
        </p>
      </header>

      <TryOnStudio product={product} alternatives={alternatives} aiEnabled={isAiTryOnEnabled()} />
    </div>
  );
}
