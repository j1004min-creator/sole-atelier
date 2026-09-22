import { cache } from "react";

import { createClient, hasSupabaseEnv } from "./supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "customer" | "admin";
};

/**
 * 한 요청 안에서는 한 번만 조회한다.
 *
 * force-dynamic 때문에 레이아웃과 페이지가 각각 렌더되는데, cache() 가 없으면
 * 요청 하나에 getUser() 가 두세 번 나간다. 프리페치까지 겹치면 호출이 폭증하고,
 * 토큰 만료 시점에 갱신이 동시에 일어나 리프레시 토큰 경합으로 세션이 끊긴다.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;

    const { data: profile } = await supabase
      .from("shoe_profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email ?? null,
      displayName: profile?.display_name ?? null,
      role: (profile?.role as "customer" | "admin") ?? "customer",
    };
  } catch {
    return null;
  }
});

/** 헤더 표시용. 위와 같은 조회를 재사용한다. */
export async function getSessionEmail(): Promise<string | null> {
  return (await getSessionUser())?.email ?? null;
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}
