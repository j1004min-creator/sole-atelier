import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { getCatalog } from "@/lib/catalog";
import { MOODS } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "무드에 맞는 신발 추천",
  description: "하객룩·오피스룩·산책룩·스포츠룩 등 상황별로 어울리는 신발을 모았습니다.",
};

export default async function MoodHubPage() {
  const all = await getCatalog();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          무드에 맞는 신발 추천
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          브랜드나 가격보다 &ldquo;어디에 신고 갈지&rdquo;가 먼저인 날이 있습니다. 상황별로 골라둔
          신발과 스타일링 팁을 확인해보세요.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {MOODS.map((m) => {
          const picks = all.filter((p) => p.moods.includes(m.id));
          return (
            <Link
              key={m.id}
              href={`/mood/${m.id}`}
              className="group overflow-hidden rounded-card border border-line transition-colors hover:border-line-strong"
            >
              <div className="p-5" style={{ background: m.gradient }}>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl" aria-hidden>
                    {m.emoji}
                  </span>
                  <h2 className="text-lg font-semibold" style={{ color: m.accent }}>
                    {m.name}
                  </h2>
                  <span className="ml-auto text-xs text-ink-2/70 tnum">{picks.length}개</span>
                </div>
                <p className="mt-2 text-sm font-medium text-ink-2">{m.headline}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2/80">{m.description}</p>
              </div>

              <div className="grid grid-cols-4 gap-px bg-line">
                {picks.slice(0, 4).map((p) => (
                  <div key={p.slug} className="relative aspect-square bg-surface">
                    <Image
                      src={p.imageUrl}
                      alt={p.imageAlt}
                      fill
                      sizes="(max-width: 640px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
