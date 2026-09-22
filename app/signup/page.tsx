"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { display_name: form.name } },
      });
      if (error) {
        setError(error.message);
        return;
      }
      // 이메일 확인이 켜져 있으면 세션이 바로 생기지 않는다
      if (data.session) {
        router.push("/orders");
        router.refresh();
      } else {
        setSent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">메일을 확인해주세요</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {form.email} 으로 확인 링크를 보냈습니다. 링크를 누르면 가입이 완료됩니다.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full border border-line px-5 py-3 text-sm hover:border-ink"
        >
          로그인으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
      <p className="mt-2 text-sm text-muted">주문 내역과 찜을 저장할 수 있습니다.</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-muted">이름</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">이메일</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">비밀번호 (8자 이상)</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          {busy ? "가입 중…" : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="underline underline-offset-2 hover:text-ink">
          로그인
        </Link>
      </p>
    </div>
  );
}
