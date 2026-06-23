import type { RoomCategory } from "@/types";

export const CATS_FILTER: RoomCategory[] = [
  "어학",
  "공무원",
  "개발·IT",
  "자격증",
  "취업·면접",
  "대학생",
];

/** 사용자 관심 카테고리 — 빈 배열이면 전체 대상 */
export const USER_INTEREST_CATS: RoomCategory[] = ["개발·IT", "자격증"];

// 일반/프리미엄 필터 — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
export const TYPE_OPTS = ["전체 스터디", "일반", "프리미엄"] as const;
export type TypeOpt = (typeof TYPE_OPTS)[number];

// 공개/비공개 필터 — roomType(일반/프리미엄) 대신 메인페이지 필터로 사용
export const VISIBILITY_OPTS = ["전체 스터디", "공개", "비공개"] as const;
export type VisibilityOpt = (typeof VISIBILITY_OPTS)[number];

export const TABS = ["전체", "신규 스터디"] as const;
export type TabKey = (typeof TABS)[number];
