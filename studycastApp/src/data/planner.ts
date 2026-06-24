import type { RoomCategory } from "@/types";

/** 이달 일자별 누적 공부 시간 (mock) — key: 일(day), value: "1h35m" | "today" */
export const PLANNER_STUDY_DATA: Record<number, string> = {
  2: "1h35m", 3: "4h", 5: "2h10m", 7: "6h10m", 9: "1h50m", 10: "7h",
  11: "10h20m", 13: "1h25m", 14: "4h10m", 15: "11h", 16: "2h10m", 17: "today",
};

/** 출석 강도 색상 (0:미출석 ~ 3:10시간+) — 라이트 */
export const PLANNER_IC_LIGHT = ["#F5F5F5", "#FFCDD2", "#E53935", "#B71C1C"];
export const PLANNER_IC_TEXT_LIGHT = ["#9e9e9e", "#B71C1C", "#fff", "#fff"];

/** 출석 강도 색상 — 다크 (0:미출석=달력 기본 배경은 다크 고유색 유지, 1~3 시간별 분류는 라이트와 동일) */
export const PLANNER_IC_DARK = ["#2a2a2a", PLANNER_IC_LIGHT[1], PLANNER_IC_LIGHT[2], PLANNER_IC_LIGHT[3]];
export const PLANNER_IC_TEXT_DARK = ["#ccc", PLANNER_IC_TEXT_LIGHT[1], PLANNER_IC_TEXT_LIGHT[2], PLANNER_IC_TEXT_LIGHT[3]];

/** 테마별 출석 강도 색상 선택 */
export const plannerIc = (dark: boolean): string[] => (dark ? PLANNER_IC_DARK : PLANNER_IC_LIGHT);
export const plannerIcText = (dark: boolean): string[] => (dark ? PLANNER_IC_TEXT_DARK : PLANNER_IC_TEXT_LIGHT);

/** @deprecated 테마 분기 전 라이트 고정값 — plannerIc(dark) 사용 권장 */
export const PLANNER_IC = PLANNER_IC_LIGHT;
export const PLANNER_IC_TEXT = PLANNER_IC_TEXT_LIGHT;

/** 공부 시간 문자열("2h10m" | "48m" 등) → 강도 레벨 (-1: today, -2: dot, 0~3) */
export const plannerLv = (d?: string): number => {
  if (!d) return 0;
  if (d === "today") return -1;
  if (d === "dot") return -2;
  const hMatch = d.match(/(\d+)h/);
  const mMatch = d.match(/(\d+)m/);
  const hours = (hMatch ? Number(hMatch[1]) : 0) + (mMatch ? Number(mMatch[1]) : 0) / 60;
  return hours >= 10 ? 3 : hours >= 6 ? 2 : hours >= 2 ? 1 : 0;
};

/** 카테고리별 대표 색상 */
export const PLANNER_CAT_COLOR: Record<string, string> = {
  "자격증": "#7C3AED",
  "개발·IT": "#0284C7",
  "어학": "#059669",
  "대학생": "#D97706",
  "공무원": "#DC2626",
  "취업·면접": "#DB2777",
};

/** 계획 편집/추가 색상 팔레트 */
export const PLANNER_PASTEL_COLORS: Array<{ label: string; val: string }> = [
  { label: "빨", val: "#E57373" },
  { label: "주", val: "#FF8A65" },
  { label: "노", val: "#FFD54F" },
  { label: "초", val: "#66BB6A" },
  { label: "파", val: "#42A5F5" },
  { label: "남", val: "#5C7FA3" },
  { label: "보", val: "#9575CD" },
];

/** ─── 타입 ─────────────────────────────────── */
export interface WeekPlan {
  id: number;
  day: number;       // 0=월 ... 6=일
  title: string;
  cat: RoomCategory | string;
  color: string;
  start: string;     // "HH:MM"
  end: string;
}




/** 분 변환 (06시 이전은 +24h 처리해 새벽 일정 정렬) */
export const toMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toMinExt = (t: string): number => {
  const m = toMin(t);
  return m < 6 * 60 ? m + 24 * 60 : m;
};
