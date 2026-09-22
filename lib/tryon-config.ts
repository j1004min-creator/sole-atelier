/** AI 실착은 Hugging Face Space 가 연결돼 있을 때만 켠다. */
export function isAiTryOnEnabled(): boolean {
  return Boolean(process.env.HF_SPACE_ID);
}

export const AI_DAILY_LIMIT_PER_USER = 3;
export const AI_DAILY_LIMIT_TOTAL = 40;
