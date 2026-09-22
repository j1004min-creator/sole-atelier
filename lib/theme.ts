import type { CategoryId } from "./taxonomy";

/**
 * 카테고리별 색 토큰. Tailwind 가 클래스명을 정적으로 스캔하므로
 * 문자열 조합 대신 완성된 클래스명을 표로 갖고 있어야 한다.
 */
export const CATEGORY_CLASSES: Record<
  CategoryId,
  { text: string; bg: string; border: string; dot: string; solid: string }
> = {
  sports: {
    text: "text-sports",
    bg: "bg-sports-soft",
    border: "border-sports",
    dot: "bg-sports",
    solid: "bg-sports text-white",
  },
  luxury: {
    text: "text-luxury",
    bg: "bg-luxury-soft",
    border: "border-luxury",
    dot: "bg-luxury",
    solid: "bg-luxury text-white",
  },
  contemporary: {
    text: "text-contemporary",
    bg: "bg-contemporary-soft",
    border: "border-contemporary",
    dot: "bg-contemporary",
    solid: "bg-contemporary text-white",
  },
};
