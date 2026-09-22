"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message.includes("Invalid login")
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : error.message,
        );
        return;
      }
      router.push("/orders");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
      <p className="mt-2 text-sm text-muted">주문 내역과 찜 목록을 보려면 로그인하세요.</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-muted">이메일</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">비밀번호</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-sale">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-white hover:opacity-90 disabled:bg-line-strong"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="underline underline-offset-2 hover:text-ink">
          회원가입
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted">
        로그인 없이도 주문할 수 있습니다.
      </p>
    </div>
  );
}
