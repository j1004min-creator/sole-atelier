/**
 * 상품 사진에서 배경을 지운다.
 *
 * 처음엔 "밝은 픽셀을 지우는" 방식으로 만들었는데, 흰 배경 사진에서만 동작했다.
 * 실제 상품 사진은 어두운 배경, 컬러 배경도 많아서 지금은
 *   ① 테두리 픽셀을 샘플링해 배경색을 추정하고
 *   ② 그 색과 비슷하면서 테두리에서 이어지는 영역만 flood fill 로 지운다.
 * 이렇게 하면 신발 안쪽의 흰 미드솔은 살아남는다.
 */

export type RemoveBgResult = {
  canvas: HTMLCanvasElement;
  /** 지워진 픽셀 비율 (0~1). 너무 낮으면 배경이 복잡한 사진이라는 뜻 */
  removedRatio: number;
  /** 테두리 색이 얼마나 균일한지 (0~1, 높을수록 단색 배경) */
  uniformity: number;
};

function dist2(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

export function removeBackground(
  source: CanvasImageSource,
  width: number,
  height: number,
  tolerance = 62,
  feather = 1,
): RemoveBgResult {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, width, height);

  let image: ImageData;
  try {
    image = ctx.getImageData(0, 0, width, height);
  } catch {
    // CORS 로 캔버스가 오염되면 원본을 그대로 돌려준다.
    return { canvas, removedRatio: 0, uniformity: 0 };
  }

  const data = image.data;
  const n = width * height;

  // ① 테두리 색 추정 — 네 변의 픽셀 평균
  const borderIdx: number[] = [];
  for (let x = 0; x < width; x++) {
    borderIdx.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    borderIdx.push(y * width, y * width + width - 1);
  }

  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (const i of borderIdx) {
    sr += data[i * 4];
    sg += data[i * 4 + 1];
    sb += data[i * 4 + 2];
  }
  const br = sr / borderIdx.length;
  const bg = sg / borderIdx.length;
  const bb = sb / borderIdx.length;

  // 테두리가 얼마나 균일한지 — 배경이 복잡하면 사용자에게 알려준다
  let spread = 0;
  for (const i of borderIdx) {
    spread += Math.sqrt(dist2(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], br, bg, bb));
  }
  const avgSpread = spread / borderIdx.length;
  const uniformity = Math.max(0, 1 - avgSpread / 90);

  // ② 테두리에서 시작하는 flood fill
  const tol2 = tolerance * tolerance;
  const visited = new Uint8Array(n);
  const stack: number[] = [...borderIdx];
  let removed = 0;

  while (stack.length) {
    const idx = stack.pop()!;
    if (idx < 0 || idx >= n || visited[idx]) continue;
    visited[idx] = 1;

    const o = idx * 4;
    if (dist2(data[o], data[o + 1], data[o + 2], br, bg, bb) > tol2) continue;

    data[o + 3] = 0;
    removed++;

    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  // ③ 가장자리 부드럽게
  for (let pass = 0; pass < feather; pass++) {
    const alpha = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) alpha[i] = data[i * 4 + 3];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (alpha[i] === 0) continue;
        const around =
          (alpha[i - 1] === 0 ? 1 : 0) +
          (alpha[i + 1] === 0 ? 1 : 0) +
          (alpha[i - width] === 0 ? 1 : 0) +
          (alpha[i + width] === 0 ? 1 : 0);
        if (around > 0) data[i * 4 + 3] = Math.round(alpha[i] * (1 - around * 0.22));
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  return { canvas, removedRatio: removed / n, uniformity };
}

/** 투명 여백을 잘라내 신발만 남긴다. 캔버스에서 위치를 잡기 쉬워진다. */
export function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return canvas;
  }

  let top = canvas.height;
  let left = canvas.width;
  let right = 0;
  let bottom = 0;
  let found = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] > 12) {
        found = true;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (!found) return canvas;

  const pad = 2;
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(canvas.width - 1, right + pad);
  bottom = Math.min(canvas.height - 1, bottom + pad);

  const w = right - left + 1;
  const h = bottom - top + 1;
  if (w <= 0 || h <= 0) return canvas;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  return out;
}
