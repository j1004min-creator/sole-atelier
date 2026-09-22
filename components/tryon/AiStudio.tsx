"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import type { Product } from "@/lib/catalog";
import { MODEL_SHOTS, imageUrl } from "@/lib/seed-data";

type Result = { imageUrl: string; remaining: number };

export function AiStudio({ product, enabled }: { product: Product; enabled: boolean }) {
  const [modelId, setModelId] = useState(MODEL_SHOTS[0].id);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const uploadUrlRef = useRef<string | null>(null);

  const usingUpload = Boolean(uploadData);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있습니다.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("6MB 이하 이미지만 올릴 수 있습니다.");
      return;
    }
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    const objUrl = URL.createObjectURL(file);
    uploadUrlRef.current = objUrl;
    setUploadUrl(objUrl);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setUploadData(String(reader.result));
    reader.onerror = () => setError("사진을 읽지 못했습니다.");
    reader.readAsDataURL(file);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          modelId: usingUpload ? null : modelId,
          imageDataUrl: usingUpload ? uploadData : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "AI 실착에 실패했습니다.");
        return;
      }
      setResult(json as Result);
    } catch {
      setError("네트워크 오류로 AI 실착에 실패했습니다. 합성 실착 탭을 이용해보세요.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
        <p className="text-sm font-medium">AI 실착은 준비 중입니다</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
          AI 실착은 Hugging Face Space 연결이 필요합니다. 환경변수 <code>HF_SPACE_ID</code> 와{" "}
          <code>HF_TOKEN</code> 을 설정하면 자동으로 켜집니다. 그동안에는{" "}
          <strong className="text-ink">합성 실착</strong> 탭을 이용해주세요 — 실제 상품 사진
          그대로라 오히려 정확합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">누구에게 신겨볼까요?</p>
          <div className="grid grid-cols-4 gap-1.5">
            {MODEL_SHOTS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={!usingUpload && modelId === m.id}
                title={m.label}
                onClick={() => {
                  setModelId(m.id);
                  setUploadData(null);
                  setUploadUrl(null);
                }}
                className={`relative aspect-2/3 overflow-hidden rounded-md border-2 ${
                  !usingUpload && modelId === m.id ? "border-ink" : "border-transparent"
                }`}
              >
                <Image
                  src={imageUrl(m.imageId, 200, 300)}
                  alt={m.label}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <label className="mt-3 block cursor-pointer rounded-md border border-dashed border-line-strong bg-surface px-3 py-4 text-center text-xs text-muted hover:border-ink">
            <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
            {uploadUrl ? "다른 사진 고르기" : "내 전신 사진 올리기"}
          </label>

          {uploadUrl && (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-16 w-12 overflow-hidden rounded border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadUrl}
                  alt="업로드한 사진 미리보기"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadData(null);
                  setUploadUrl(null);
                }}
                className="text-xs text-muted underline underline-offset-2 hover:text-ink"
              >
                내 사진 빼기
              </button>
            </div>
          )}
        </div>

        {usingUpload && (
          <p className="rounded-md border border-line bg-surface px-3 py-2.5 text-[11px] leading-relaxed text-ink-2">
            내 사진을 쓰면 이 사진이 <strong>서버를 거쳐 Hugging Face</strong>로 전송됩니다. 합성
            실착 탭은 사진이 브라우저 밖으로 나가지 않으니, 전송이 꺼려지면 그쪽을 이용해주세요.
          </p>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:bg-line-strong"
        >
          {busy ? "생성 중… (30~60초)" : "AI로 실착 이미지 만들기"}
        </button>

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-sale">
            {error}
          </p>
        )}

        <p className="text-[11px] leading-relaxed text-muted">
          무료 GPU 할당량 때문에 하루 사용 횟수가 제한됩니다. 대기열이 밀리면 1분 이상 걸릴 수
          있어요.
        </p>
      </div>

      <div>
        <div className="relative aspect-3/4 overflow-hidden rounded-card border border-line bg-surface">
          {result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.imageUrl}
              alt={`${product.nameKo} AI 실착 결과`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <p className="text-sm text-muted">
                {busy
                  ? "AI가 신발을 갈아 신기고 있습니다…"
                  : "왼쪽에서 사진을 고르고 버튼을 누르면 결과가 여기에 나옵니다."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2.5">
          <p className="text-[11px] font-semibold text-ink-2">꼭 읽어주세요</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            AI가 생성한 이미지입니다. 상품 설명을 바탕으로 그리기 때문에{" "}
            <strong className="text-ink-2">실제 상품과 디테일이 다를 수 있습니다.</strong> 구매
            판단은 반드시 상품 사진을 기준으로 해주세요.
          </p>
        </div>

        {result && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={result.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-4 py-2.5 text-sm hover:border-line-strong"
            >
              원본 크기로 열기
            </a>
            <span className="text-xs text-muted tnum">오늘 {result.remaining}회 남음</span>
          </div>
        )}
      </div>
    </div>
  );
}
