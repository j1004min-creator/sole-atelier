"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Product } from "@/lib/catalog";
import { removeBackground, trimTransparent } from "@/lib/remove-bg";
import { MODEL_SHOTS, imageUrl } from "@/lib/seed-data";

const W = 900;
const H = 1200;

type BgKind = "model" | "upload" | "studio";

type Transform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flip: boolean;
  opacity: number;
  shadow: number;
};

const DEFAULT_TRANSFORM: Transform = {
  x: 0.5,
  y: 0.86,
  scale: 0.14,
  rotation: 0,
  flip: false,
  opacity: 1,
  shadow: 0.35,
};

function loadImage(src: string, cors = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다: " + src));
    img.src = src;
  });
}

/** 배경을 캔버스에 cover 로 채운다 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export function CanvasStudio({
  product,
  alternatives,
}: {
  product: Product;
  alternatives: Product[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const shoeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawShoeRef = useRef<HTMLImageElement | null>(null);
  const uploadUrlRef = useRef<string | null>(null);

  const [activeShoe, setActiveShoe] = useState<Product>(product);
  const [bgKind, setBgKind] = useState<BgKind>("model");
  const [modelId, setModelId] = useState(MODEL_SHOTS[0].id);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [removeBg, setRemoveBg] = useState(true);
  const [tolerance, setTolerance] = useState(62);
  const [bgQuality, setBgQuality] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const model = useMemo(
    () => MODEL_SHOTS.find((m) => m.id === modelId) ?? MODEL_SHOTS[0],
    [modelId],
  );

  const bgSrc =
    bgKind === "upload" ? uploadUrl : bgKind === "model" ? imageUrl(model.imageId, 900, 1200) : null;

  /** 배경 로드 */
  useEffect(() => {
    let cancelled = false;
    if (!bgSrc) {
      bgImgRef.current = null;
      setTick((t) => t + 1);
      return;
    }
    loadImage(bgSrc, bgKind !== "upload")
      .then((img) => {
        if (cancelled) return;
        bgImgRef.current = img;
        setTick((t) => t + 1);
      })
      .catch(() => {
        if (cancelled) return;
        bgImgRef.current = null;
        setMessage("배경 이미지를 불러오지 못했습니다.");
        setTick((t) => t + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [bgSrc, bgKind]);

  /** 신발 이미지 로드 + 배경 제거 */
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setMessage(null);

    loadImage(activeShoe.imageUrl)
      .then((img) => {
        if (cancelled) return;
        rawShoeRef.current = img;
        applyShoeProcessing(img);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("신발 이미지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      });

    return () => {
      cancelled = true;
    };
    // applyShoeProcessing 은 tolerance/removeBg 를 읽으므로 아래 effect 에서 다시 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShoe.imageUrl]);

  const applyShoeProcessing = useCallback(
    (img: HTMLImageElement) => {
      const maxSide = 700;
      const ratio = Math.min(maxSide / img.naturalWidth, maxSide / img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * ratio);
      const h = Math.round(img.naturalHeight * ratio);

      if (!removeBg) {
        const plain = document.createElement("canvas");
        plain.width = w;
        plain.height = h;
        plain.getContext("2d")!.drawImage(img, 0, 0, w, h);
        shoeCanvasRef.current = plain;
      } else {
        const { canvas: cut, removedRatio } = removeBackground(img, w, h, tolerance, 1);
        shoeCanvasRef.current = trimTransparent(cut);
        setBgQuality(removedRatio);
      }
      setTick((t) => t + 1);
    },
    [removeBg, tolerance],
  );

  useEffect(() => {
    if (rawShoeRef.current) applyShoeProcessing(rawShoeRef.current);
  }, [removeBg, tolerance, applyShoeProcessing]);

  /** 그리기 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    if (bgImgRef.current) {
      drawCover(ctx, bgImgRef.current, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#faf9f7");
      grad.addColorStop(1, "#ece9e3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.88, W * 0.28, H * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const shoe = shoeCanvasRef.current;
    if (!shoe) return;

    const targetW = W * transform.scale;
    const drawRatio = targetW / shoe.width;
    const dw = shoe.width * drawRatio;
    const dh = shoe.height * drawRatio;

    ctx.save();
    ctx.translate(transform.x * W, transform.y * H);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    if (transform.flip) ctx.scale(-1, 1);
    ctx.globalAlpha = transform.opacity;

    if (transform.shadow > 0) {
      ctx.shadowColor = `rgba(0,0,0,${transform.shadow})`;
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 12;
    }

    ctx.drawImage(shoe, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, [transform, tick]);

  /** 드래그로 위치 잡기 (마우스·터치 공통) */
  const dragging = useRef(false);

  function movePointer(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform((t) => ({
      ...t,
      x: Math.min(1.2, Math.max(-0.2, x)),
      y: Math.min(1.2, Math.max(-0.2, y)),
    }));
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    movePointer(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging.current) movePointer(e);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 이미 해제됨 */
    }
  };

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("이미지 파일만 올릴 수 있습니다.");
      return;
    }
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadUrlRef.current = url;
    setUploadUrl(url);
    setBgKind("upload");
    setMessage(null);
  }

  useEffect(() => {
    return () => {
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    };
  }, []);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `sole-atelier-${activeShoe.slug}.png`;
      a.click();
    } catch {
      setMessage("이미지 저장에 실패했습니다. 브라우저 설정을 확인해주세요.");
    }
  }

  const sliders = [
    { key: "scale" as const, label: "크기", min: 0.03, max: 0.5, step: 0.005 },
    { key: "rotation" as const, label: "회전", min: -45, max: 45, step: 1 },
    { key: "opacity" as const, label: "불투명도", min: 0.2, max: 1, step: 0.02 },
    { key: "shadow" as const, label: "그림자", min: 0, max: 0.8, step: 0.02 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="relative overflow-hidden rounded-card border border-line bg-surface">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="block h-auto w-full cursor-grab touch-none active:cursor-grabbing"
            aria-label="가상 실착 합성 캔버스. 눌러서 신발 위치를 옮길 수 있습니다."
          />
          {status === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-paper/70 text-sm text-muted">
              이미지를 준비하고 있습니다…
            </div>
          )}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted">
          캔버스를 누르거나 끌어서 신발 위치를 옮기세요. 업로드한 사진은 브라우저 안에서만
          처리되며 서버로 전송되지 않습니다.
        </p>

        {message && (
          <p role="status" className="mt-2 text-xs text-sale">
            {message}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            PNG로 저장
          </button>
          <button
            type="button"
            onClick={() => setTransform(DEFAULT_TRANSFORM)}
            className="rounded-full border border-line px-4 py-2.5 text-sm hover:border-line-strong"
          >
            위치 초기화
          </button>
          <button
            type="button"
            onClick={() => setTransform((t) => ({ ...t, flip: !t.flip }))}
            className="rounded-full border border-line px-4 py-2.5 text-sm hover:border-line-strong"
          >
            좌우 반전
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">배경</p>
          <div className="flex gap-1.5">
            {(
              [
                ["model", "모델컷"],
                ["upload", "내 사진"],
                ["studio", "스튜디오"],
              ] as [BgKind, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={bgKind === k}
                onClick={() => setBgKind(k)}
                className={`flex-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                  bgKind === k
                    ? "border-ink bg-ink text-white"
                    : "border-line hover:border-line-strong"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {bgKind === "model" && (
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {MODEL_SHOTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={modelId === m.id}
                  title={m.label}
                  onClick={() => {
                    setModelId(m.id);
                    setTransform((t) => ({
                      ...t,
                      x: m.footHint.x,
                      y: m.footHint.y,
                      scale: m.footHint.scale,
                    }));
                  }}
                  className={`relative aspect-2/3 overflow-hidden rounded-md border-2 ${
                    modelId === m.id ? "border-ink" : "border-transparent"
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
          )}

          {bgKind === "upload" && (
            <label className="mt-3 block cursor-pointer rounded-md border border-dashed border-line-strong bg-surface px-3 py-4 text-center text-xs text-muted hover:border-ink">
              <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
              {uploadUrl ? "다른 사진 고르기" : "전신 또는 발 사진 올리기"}
            </label>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">신발 배경 제거</p>
            <button
              type="button"
              role="switch"
              aria-checked={removeBg}
              aria-label="신발 배경 제거"
              onClick={() => setRemoveBg((v) => !v)}
              className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                removeBg ? "bg-ink" : "bg-line-strong"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  removeBg ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          {removeBg && (
            <label className="mt-2 block text-[11px] text-muted">
              민감도
              <input
                type="range"
                min={20}
                max={140}
                step={2}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="mt-1 w-full accent-[#16181d]"
              />
            </label>
          )}
          {removeBg && bgQuality !== null && bgQuality < 0.08 && (
            <p className="mt-2 rounded-md bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-ink-2">
              이 사진은 배경이 복잡해서 잘 안 떨어집니다. 민감도를 올리거나, 배경 제거를 끄고 크기·위치만
              맞춰보세요.
            </p>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            배경이 단색인 상품 사진에서 가장 잘 동작합니다. 테두리 색을 읽어 같은 색 영역만 지우기
            때문에 흰 배경·어두운 배경 모두 처리합니다.
          </p>
        </div>

        <div className="space-y-3">
          {sliders.map((s) => (
            <label key={s.key} className="block text-[11px] text-muted">
              <span className="flex justify-between">
                <span>{s.label}</span>
                <span className="tnum">{Number(transform[s.key]).toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={transform[s.key] as number}
                onChange={(e) => setTransform((t) => ({ ...t, [s.key]: Number(e.target.value) }))}
                className="mt-1 w-full accent-[#16181d]"
              />
            </label>
          ))}
        </div>

        {alternatives.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">다른 신발로 바꿔보기</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[product, ...alternatives].slice(0, 8).map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={activeShoe.slug === p.slug}
                  title={`${p.brand.nameKo} ${p.nameKo}`}
                  onClick={() => setActiveShoe(p)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 bg-surface ${
                    activeShoe.slug === p.slug ? "border-ink" : "border-transparent"
                  }`}
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
