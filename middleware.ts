import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 세션 쿠키를 갱신한다.
 *
 * 프리페치 요청에서는 갱신하지 않는다. Next 의 링크 프리페치는 화면에 링크가
 * 들어올 때마다 발생해서, 여기서까지 토큰을 갱신하면 호출이 폭증하고
 * 만료 시점에 갱신이 동시에 일어나 리프레시 토큰 경합으로 로그인이 풀린다.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  if (request.headers.get("next-router-prefetch") === "1") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // 갱신 실패는 비로그인으로 취급한다
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 파일과 이미지 최적화 경로는 세션 갱신이 필요 없다
    "/((?!_next/|favicon\.ico|robots\.txt|sitemap\.xml|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
