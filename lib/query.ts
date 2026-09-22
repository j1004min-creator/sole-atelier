/** URL 쿼리에서 다중 선택 값을 읽고 쓰는 헬퍼. 필터 상태는 전부 URL 에 담는다. */

export function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function buildQuery(
  current: URLSearchParams,
  patch: Record<string, string | string[] | null>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
      next.delete(key);
    } else if (Array.isArray(value)) {
      next.set(key, value.join(","));
    } else {
      next.set(key, value);
    }
  }
  const s = next.toString();
  return s ? "?" + s : "";
}
