import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-muted">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-muted">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          홈으로
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
        >
          전체 상품 보기
        </Link>
      </div>
    </div>
  );
}
