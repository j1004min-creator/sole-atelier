import { createClient, hasSupabaseEnv } from "./supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "customer" | "admin";
};

/** 헤더 표시용 가벼운 조회. Supabase 가 없으면 비로그인으로 취급한다. */
export async function getSessionEmail(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
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
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}
