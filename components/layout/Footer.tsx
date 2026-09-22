import Link from "next/link";

import { CATEGORIES, MOODS } from "@/lib/taxonomy";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-semibold">SOLE ATELIER</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            스포츠 브랜드부터 하우스 슈즈까지,
            <br />
            한곳에서 비교하고 신어보는 편집숍.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">카테고리</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.id}`} className="hover:text-ink">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/brands" className="hover:text-ink">
                전체 브랜드
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">무드 추천</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-muted">
            {MOODS.map((m) => (
              <li key={m.id}>
                <Link href={`/mood/${m.id}`} className="hover:text-ink">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">고객 안내</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/tryon" className="hover:text-ink">
                가상 실착 스튜디오
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-ink">
                주문 조회
              </Link>
            </li>
          </ul>
          <p className="mt-4 rounded-md border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
            데모 사이트입니다. 결제는 토스페이먼츠 <strong className="text-ink-2">테스트 키</strong>로
            동작하며 실제로 청구되지 않고, 상품이 배송되지도 않습니다.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-muted">
          © {new Date().getFullYear()} SOLE ATELIER · 포트폴리오 데모
        </div>
      </div>
    </footer>
  );
}
