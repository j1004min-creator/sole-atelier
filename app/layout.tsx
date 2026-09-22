import type { Metadata, Viewport } from "next";

import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSessionEmail } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SOLE ATELIER — 멀티브랜드 슈즈 편집숍",
    template: "%s · SOLE ATELIER",
  },
  description:
    "나이키·아디다스·뉴발란스부터 샤넬·에르메스·프라다까지. 가격대를 한눈에 비교하고, 가상 실착으로 미리 신어보세요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userEmail = await getSessionEmail();

  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
          >
            본문으로 건너뛰기
          </a>
          <Header userEmail={userEmail} />
          <main id="main">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
