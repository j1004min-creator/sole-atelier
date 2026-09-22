"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { MOODS } from "@/lib/taxonomy";

const NAV = [
  { href: "/products", label: "전체" },
  { href: "/products?category=sports", label: "스포츠" },
  { href: "/products?category=luxury", label: "명품" },
  { href: "/products?category=contemporary", label: "컨템포러리" },
  { href: "/mood", label: "무드 추천" },
  { href: "/tryon", label: "가상 실착" },
];

export function Header({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:h-16">
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-ml-1 grid h-9 w-9 place-items-center rounded-md hover:bg-surface-2 md:hidden"
        >
          <span aria-hidden className="text-lg">
            {open ? "✕" : "☰"}
          </span>
        </button>

        <Link href="/" className="shrink-0 text-[17px] font-semibold tracking-tight sm:text-lg">
          SOLE<span className="text-muted"> ATELIER</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/wishlist"
            className="hidden rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 sm:block"
          >
            찜
          </Link>
          {userEmail ? (
            <Link
              href="/orders"
              className="max-w-[9rem] truncate rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-surface-2"
              title={userEmail}
            >
              내 주문
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-surface-2"
            >
              로그인
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-2"
          >
            장바구니
            {ready && count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold text-white tnum">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto max-w-[1280px] px-4 py-3">
            <div className="grid grid-cols-2 gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                >
                  {n.label}
                </Link>
              ))}
              <Link href="/wishlist" className="rounded-md px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2">
                찜
              </Link>
            </div>
            <p className="mt-3 px-3 text-xs font-medium text-muted">무드로 바로 가기</p>
            <div className="mt-1 flex flex-wrap gap-1.5 px-3 pb-1">
              {MOODS.map((m) => (
                <Link
                  key={m.id}
                  href={`/mood/${m.id}`}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2"
                >
                  {m.emoji} {m.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

