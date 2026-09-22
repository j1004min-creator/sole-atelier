import type { Product } from "./catalog";
import { SHOE_TYPE_MAP } from "./taxonomy";

const TYPE_EN: Record<string, string> = {
  sneakers: "sneakers",
  running: "running shoes",
  boots: "boots",
  dress: "leather dress shoes",
  heels: "high-heeled shoes",
  sandals: "sandals",
};

/**
 * 상품 정보로 FLUX Kontext 프롬프트를 만든다.
 *
 * 참조 이미지를 넣는 방식이 아니라 "설명"으로 그리게 하는 구조라,
 * 색·소재·종류를 최대한 구체적으로 적어준다. 그래도 실제 상품과는 다를 수 있다.
 */
export function buildTryOnPrompt(product: Product): string {
  const kind = TYPE_EN[product.shoeType] ?? "shoes";
  const colour = product.colorway.replace(/\s*\/\s*/g, " and ");
  const brandHint = product.brand.name;

  return [
    `Replace the shoes this person is wearing with ${colour} ${brandHint} ${kind}`,
    `made of ${product.materials}.`,
    "Keep the person, pose, body, clothing and background exactly the same.",
    "Photorealistic, correct perspective, matching lighting and ground shadow.",
  ].join(" ");
}

export function describeForAlt(product: Product): string {
  return `${product.brand.nameKo} ${product.nameKo} (${SHOE_TYPE_MAP[product.shoeType]}) AI 실착 이미지`;
}
