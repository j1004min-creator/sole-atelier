import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getProductBySlug } from "@/lib/catalog";
import { MODEL_SHOTS, imageUrl } from "@/lib/seed-data";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { buildTryOnPrompt } from "@/lib/tryon-prompt";
import { AI_DAILY_LIMIT_PER_USER, AI_DAILY_LIMIT_TOTAL, isAiTryOnEnabled } from "@/lib/tryon-config";

export const runtime = "nodejs";
export const maxDuration = 120;

function clientKeyOf(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "local";
  // IP 를 그대로 저장하지 않는다
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  if (!isAiTryOnEnabled()) {
    return NextResponse.json(
      { message: "AI 실착이 아직 연결되지 않았습니다. 합성 실착 탭을 이용해주세요." },
      { status: 503 },
    );
  }

  let body: { slug?: string; modelId?: string | null; imageDataUrl?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const product = body.slug ? await getProductBySlug(body.slug) : null;
  if (!product) {
    return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  // 사용량 제한 — 무료 GPU 할당량을 하루 만에 태우지 않도록
  let remaining = AI_DAILY_LIMIT_PER_USER;
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.rpc("shoe_bump_tryon_usage", {
        p_user_key: clientKeyOf(request),
        p_per_user_limit: AI_DAILY_LIMIT_PER_USER,
        p_total_limit: AI_DAILY_LIMIT_TOTAL,
      });
      const usage = data as { allowed: boolean; remaining: number; reason?: string } | null;
      if (usage && !usage.allowed) {
        return NextResponse.json(
          {
            message:
              usage.reason === "TOTAL"
                ? "오늘 AI 실착 전체 사용량을 다 썼습니다. 내일 다시 시도하거나 합성 실착 탭을 이용해주세요."
                : "오늘 AI 실착 횟수를 모두 사용했습니다. 합성 실착 탭은 제한 없이 쓸 수 있어요.",
          },
          { status: 429 },
        );
      }
      remaining = usage?.remaining ?? remaining;
    } catch {
      // 사용량 기록에 실패해도 생성 자체는 막지 않는다
    }
  }

  // 배경 이미지 — 업로드가 있으면 그것, 없으면 모델컷 URL
  let inputImage: string;
  if (body.imageDataUrl?.startsWith("data:image/")) {
    if (body.imageDataUrl.length > 9_000_000) {
      return NextResponse.json({ message: "이미지가 너무 큽니다." }, { status: 413 });
    }
    inputImage = body.imageDataUrl;
  } else {
    const shot = MODEL_SHOTS.find((m) => m.id === body.modelId) ?? MODEL_SHOTS[0];
    inputImage = imageUrl(shot.imageId, 768, 1024);
  }

  const prompt = buildTryOnPrompt(product);

  try {
    const { Client } = await import("@gradio/client");
    const app = await Client.connect(process.env.HF_SPACE_ID!, {
      hf_token: (process.env.HF_TOKEN as `hf_${string}`) || undefined,
    });

    const blob = inputImage.startsWith("data:")
      ? await (await fetch(inputImage)).blob()
      : await (await fetch(inputImage)).blob();

    const result = await app.predict("/infer", {
      input_image: blob,
      prompt,
      seed: 0,
      randomize_seed: true,
      guidance_scale: 2.5,
      steps: 28,
    });

    const data = result.data as unknown[];
    const first = data?.[0] as { url?: string } | undefined;
    if (!first?.url) {
      return NextResponse.json(
        { message: "AI 실착 결과를 받지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageUrl: first.url, remaining });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        message:
          "지금은 AI 실착이 붐빕니다(무료 GPU 대기열). 합성 실착 탭으로 먼저 확인해보세요. (" +
          detail.slice(0, 120) +
          ")",
      },
      { status: 503 },
    );
  }
}
