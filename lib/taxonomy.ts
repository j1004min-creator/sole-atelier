/** 쇼핑몰 분류 체계 — 카테고리(브랜드 티어) / 신발 종류 / 무드 / 가격대 */

export type CategoryId = "sports" | "luxury" | "contemporary";
export type ShoeType = "sneakers" | "running" | "boots" | "dress" | "heels" | "sandals";
export type MoodId =
  | "wedding"
  | "office"
  | "sporty"
  | "walk"
  | "date"
  | "travel"
  | "party"
  | "campus";

export type Category = {
  id: CategoryId;
  name: string;
  tagline: string;
  description: string;
  /** 카테고리 고유 강조색 — 칩·그래프·배지에 일관되게 사용 */
  accent: string;
  accentSoft: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "sports",
    name: "스포츠 브랜드",
    tagline: "나이키 · 아디다스 · 뉴발란스 · 아식스",
    description:
      "러닝부터 코트, 스트리트까지. 매일 신어도 무너지지 않는 퍼포먼스 브랜드의 대표 모델을 모았습니다.",
    accent: "#2563EB",
    accentSoft: "#E8EFFE",
  },
  {
    id: "luxury",
    name: "명품 브랜드",
    tagline: "샤넬 · 에르메스 · 프라다 · 구찌",
    description:
      "장인의 손끝에서 완성되는 가죽과 실루엣. 하객룩과 오피스룩의 마지막 한 끗을 책임지는 하우스 슈즈입니다.",
    accent: "#A07338",
    accentSoft: "#F6EEE2",
  },
  {
    id: "contemporary",
    name: "컨템포러리 · 디자이너",
    tagline: "코먼프로젝트 · 베자 · 폴스미스",
    description:
      "과하지 않게 취향을 드러내는 선택. 미니멀한 실루엣과 좋은 소재로 오래 신는 디자이너 슈즈입니다.",
    accent: "#3F8F7B",
    accentSoft: "#E4F2EE",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

export const SHOE_TYPES: { id: ShoeType; name: string }[] = [
  { id: "sneakers", name: "스니커즈" },
  { id: "running", name: "러닝화" },
  { id: "boots", name: "부츠" },
  { id: "dress", name: "구두 · 로퍼" },
  { id: "heels", name: "힐 · 펌프스" },
  { id: "sandals", name: "샌들" },
];

export const SHOE_TYPE_MAP = Object.fromEntries(
  SHOE_TYPES.map((t) => [t.id, t.name]),
) as Record<ShoeType, string>;

export type Mood = {
  id: MoodId;
  name: string;
  emoji: string;
  headline: string;
  description: string;
  /** 무드 카드 배경 그라디언트 */
  gradient: string;
  accent: string;
  /** 스타일링 팁 3개 */
  tips: string[];
};

export const MOODS: Mood[] = [
  {
    id: "wedding",
    name: "하객룩",
    emoji: "💐",
    headline: "주인공보다 튀지 않게, 그래도 예쁘게",
    description:
      "오래 서 있고 많이 걷는 날. 발이 편하면서도 드레시한 라인을 유지하는 슬링백과 로퍼를 골랐습니다.",
    gradient: "linear-gradient(135deg,#FDF2F4 0%,#F4E9F7 100%)",
    accent: "#B4637A",
    tips: [
      "굽은 5~7cm가 가장 오래 버팁니다. 스틸레토보다 블록힐이나 슬링백을 추천해요.",
      "베이지·누드 계열은 다리를 길어 보이게 하고 어떤 드레스와도 맞습니다.",
      "예식장 대리석 바닥은 미끄러워요. 아웃솔에 논슬립 패드를 붙이고 가세요.",
    ],
  },
  {
    id: "office",
    name: "오피스룩",
    emoji: "🗂️",
    headline: "단정함은 신발 끝에서 완성됩니다",
    description:
      "출근길 지하철부터 오후 미팅까지. 포멀함을 잃지 않으면서 하루 종일 편한 로퍼·첼시 부츠·미니멀 스니커.",
    gradient: "linear-gradient(135deg,#EEF2F7 0%,#E7ECF3 100%)",
    accent: "#3B5B87",
    tips: [
      "벨트와 가방 색을 신발과 맞추면 그것만으로 정돈돼 보입니다.",
      "화이트 레더 스니커는 슬랙스와 함께라면 대부분의 오피스에서 무리 없어요.",
      "굽 뒷면은 생각보다 많이 보입니다. 3개월에 한 번 굽갈이를 하세요.",
    ],
  },
  {
    id: "sporty",
    name: "스포츠룩",
    emoji: "🏃",
    headline: "기록은 신발에서 시작됩니다",
    description:
      "데일리 조깅부터 대회 준비까지. 쿠셔닝·반발력·접지력을 기준으로 고른 퍼포먼스 러닝화와 코트화입니다.",
    gradient: "linear-gradient(135deg,#E8F3FF 0%,#E3FBF4 100%)",
    accent: "#1D74D6",
    tips: [
      "러닝화는 평소 사이즈보다 5~10mm 크게 신어야 발톱이 멍들지 않습니다.",
      "쿠셔닝화와 반발화를 번갈아 신으면 부상 위험이 줄어듭니다.",
      "미드솔 수명은 보통 600~800km입니다. 주행거리를 기록해두세요.",
    ],
  },
  {
    id: "walk",
    name: "산책룩",
    emoji: "🌿",
    headline: "하루 만 보를 버티는 발",
    description:
      "동네 한 바퀴, 한강, 주말 나들이. 가볍고 푹신하고 어디에나 어울리는 편안한 데일리 슈즈.",
    gradient: "linear-gradient(135deg,#F0F7EC 0%,#EAF4F1 100%)",
    accent: "#4C7A3F",
    tips: [
      "발볼이 넓다면 와이드(2E) 라스트가 있는 모델을 확인하세요.",
      "무게 280g 이하면 장시간 걸어도 확실히 덜 피곤합니다.",
      "인솔만 바꿔도 착화감이 크게 달라집니다.",
    ],
  },
  {
    id: "date",
    name: "데이트룩",
    emoji: "🍷",
    headline: "가까이서 봤을 때 더 좋은 신발",
    description:
      "많이 걷고 오래 앉는 날. 과하지 않게 시선을 끄는 컬러와 소재감으로 골랐습니다.",
    gradient: "linear-gradient(135deg,#FCF1EA 0%,#F7E8F0 100%)",
    accent: "#B5603F",
    tips: [
      "스웨이드는 조명 아래서 가장 예쁘지만 비 오는 날은 피하세요.",
      "상의에 쓴 색을 신발에 한 번 더 쓰면 전체가 정돈됩니다.",
      "굽이 있다면 걷는 거리를 미리 확인하세요. 3km가 마지노선입니다.",
    ],
  },
  {
    id: "travel",
    name: "여행룩",
    emoji: "🧳",
    headline: "캐리어에 한 켤레만 넣는다면",
    description:
      "공항, 골목길, 트레일까지 한 켤레로. 방수·경량·그립을 갖춘 여행용 슈즈를 모았습니다.",
    gradient: "linear-gradient(135deg,#EDF4FA 0%,#F3F0E9 100%)",
    accent: "#2F6E8F",
    tips: [
      "고어텍스 모델은 갑작스러운 비에 여행 하루를 구해줍니다.",
      "기내에서는 신발을 벗게 되니 탈착이 쉬운 모델이 편합니다.",
      "새 신발은 절대 여행에 가져가지 마세요. 최소 2주는 길들이고 출발하세요.",
    ],
  },
  {
    id: "party",
    name: "파티룩",
    emoji: "✨",
    headline: "조명 아래에서 빛나는 한 켤레",
    description:
      "연말 모임, 갈라, 기념일. 광택 있는 소재와 또렷한 실루엣으로 존재감을 만드는 슈즈입니다.",
    gradient: "linear-gradient(135deg,#F3EEFB 0%,#FBEFF3 100%)",
    accent: "#6B4E9E",
    tips: [
      "파텐트(에나멜) 소재는 실내 조명에서 가장 효과가 큽니다.",
      "발등이 많이 드러날수록 다리가 길어 보입니다.",
      "앞꿈치 쿠션 패드 하나면 굽 높이 2cm를 벌 수 있어요.",
    ],
  },
  {
    id: "campus",
    name: "캠퍼스룩",
    emoji: "🎒",
    headline: "매일 신어도 질리지 않는",
    description:
      "강의실에서 동아리방, 저녁 약속까지. 데님·조거·슬랙스 어디에나 붙는 스테디셀러 스니커.",
    gradient: "linear-gradient(135deg,#FFF6E8 0%,#EEF3FD 100%)",
    accent: "#C07A22",
    tips: [
      "화이트·블랙·크림 중 하나는 반드시 있어야 코디가 편해집니다.",
      "하이탑은 발목을 덮어 다리가 짧아 보일 수 있어요. 통 넓은 바지와 매치하세요.",
      "캔버스화는 방수 스프레이를 뿌려두면 수명이 두 배가 됩니다.",
    ],
  },
];

export const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<
  MoodId,
  Mood
>;

export type PriceBand = {
  id: string;
  label: string;
  short: string;
  min: number;
  /** 상한 (미포함). null 이면 무제한 */
  max: number | null;
};

export const PRICE_BANDS: PriceBand[] = [
  { id: "under10", label: "10만원 미만", short: "~10만", min: 0, max: 100000 },
  { id: "10to30", label: "10만 ~ 30만원", short: "10-30만", min: 100000, max: 300000 },
  { id: "30to70", label: "30만 ~ 70만원", short: "30-70만", min: 300000, max: 700000 },
  { id: "70to150", label: "70만 ~ 150만원", short: "70-150만", min: 700000, max: 1500000 },
  { id: "over150", label: "150만원 이상", short: "150만~", min: 1500000, max: null },
];

export function bandOf(price: number): PriceBand {
  return (
    PRICE_BANDS.find((b) => price >= b.min && (b.max === null || price < b.max)) ??
    PRICE_BANDS[PRICE_BANDS.length - 1]
  );
}
