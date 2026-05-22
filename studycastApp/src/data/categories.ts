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

export const TYPE_OPTS = ["전체 스터디", "일반", "프리미엄"] as const;
export type TypeOpt = (typeof TYPE_OPTS)[number];

export const TABS = ["전체", "신규 스터디"] as const;
export type TabKey = (typeof TABS)[number];
