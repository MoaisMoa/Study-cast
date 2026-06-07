import type { RoomCategory } from "@/types";

/** 이달 일자별 누적 공부 시간 (mock) — key: 일(day), value: "1h35m" | "today" */
export const PLANNER_STUDY_DATA: Record<number, string> = {
  2: "1h35m", 3: "4h", 5: "2h10m", 7: "6h10m", 9: "1h50m", 10: "7h",
  11: "10h20m", 13: "1h25m", 14: "4h10m", 15: "11h", 16: "2h10m", 17: "today",
};

/** 출석 강도 색상 (0:미출석 ~ 3:10시간+) — 라이트 */
export const PLANNER_IC_LIGHT = ["#F5F5F5", "#FFCDD2", "#E53935", "#B71C1C"];
export const PLANNER_IC_TEXT_LIGHT = ["#9e9e9e", "#B71C1C", "#fff", "#fff"];

/** 출석 강도 색상 — 다크 */
export const PLANNER_IC_DARK = ["#2a2a2a", "#7f1d1d", "#c62828", "#8B0000"];
export const PLANNER_IC_TEXT_DARK = ["#ccc", "#ef9a9a", "#fff", "#fff"];

/** 테마별 출석 강도 색상 선택 */
export const plannerIc = (dark: boolean): string[] => (dark ? PLANNER_IC_DARK : PLANNER_IC_LIGHT);
export const plannerIcText = (dark: boolean): string[] => (dark ? PLANNER_IC_TEXT_DARK : PLANNER_IC_TEXT_LIGHT);

/** @deprecated 테마 분기 전 라이트 고정값 — plannerIc(dark) 사용 권장 */
export const PLANNER_IC = PLANNER_IC_LIGHT;
export const PLANNER_IC_TEXT = PLANNER_IC_TEXT_LIGHT;

/** 공부 시간 문자열 → 강도 레벨 (-1: today, -2: dot, 0~3) */
export const plannerLv = (d?: string): number => {
  if (!d) return 0;
  if (d === "today") return -1;
  if (d === "dot") return -2;
  const v = parseFloat(d);
  return v >= 10 ? 3 : v >= 6 ? 2 : v >= 2 ? 1 : 0;
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
export interface PlannerSchedule {
  title: string;
  type: string;
  year: number;
  month: number;
  day: number;
  dday: number;
  date: string;
}

export interface WeekPlan {
  id: number;
  day: number;       // 0=월 ... 6=일
  title: string;
  cat: RoomCategory | string;
  color: string;
  start: string;     // "HH:MM"
  end: string;
}

/** 주간 수강표 초기값 (mock) */
export const INIT_WEEK_PLAN: WeekPlan[] = [
  { id: 1,  day: 0, title: "정보처리기사 기출",   cat: "자격증",  color: "#42A5F5", start: "07:00", end: "09:00" },
  { id: 2,  day: 0, title: "AWS 개념 정리",      cat: "개발·IT", color: "#9575CD", start: "14:00", end: "16:00" },
  { id: 3,  day: 0, title: "코딩테스트 복습",     cat: "개발·IT", color: "#E57373", start: "21:00", end: "23:00" },
  { id: 4,  day: 1, title: "기초 영문법",         cat: "어학",   color: "#66BB6A", start: "09:00", end: "11:00" },
  { id: 5,  day: 1, title: "College English",   cat: "어학",   color: "#66BB6A", start: "13:00", end: "15:00" },
  { id: 6,  day: 1, title: "데이터분석 입문",     cat: "개발·IT", color: "#9575CD", start: "19:00", end: "21:00" },
  { id: 7,  day: 2, title: "토익 LC 문제풀이",    cat: "어학",   color: "#FFD54F", start: "07:00", end: "09:00" },
  { id: 8,  day: 2, title: "기초 영문법",         cat: "어학",   color: "#66BB6A", start: "10:00", end: "12:00" },
  { id: 9,  day: 2, title: "빅데이터 분석",       cat: "개발·IT", color: "#5C7FA3", start: "20:00", end: "22:00" },
  { id: 10, day: 3, title: "College English",   cat: "어학",   color: "#66BB6A", start: "09:00", end: "11:00" },
  { id: 11, day: 3, title: "기초 컴퓨터사이언스", cat: "개발·IT", color: "#42A5F5", start: "13:00", end: "15:00" },
  { id: 12, day: 3, title: "공무원 국어",         cat: "공무원",  color: "#FF8A65", start: "21:00", end: "23:00" },
  { id: 13, day: 4, title: "코딩테스트 DP",       cat: "개발·IT", color: "#E57373", start: "07:00", end: "09:00" },
  { id: 14, day: 4, title: "AI 입문",            cat: "개발·IT", color: "#FF8A65", start: "14:00", end: "16:00" },
  { id: 15, day: 5, title: "토익 RC 문제풀이",    cat: "어학",   color: "#FFD54F", start: "10:00", end: "12:00" },
  { id: 16, day: 5, title: "빅데이터 분석실습",   cat: "개발·IT", color: "#5C7FA3", start: "15:00", end: "17:00" },
  { id: 18, day: 6, title: "대학 환경과 자기개발", cat: "대학생", color: "#FF8A65", start: "11:00", end: "13:00" },
  { id: 19, day: 6, title: "주간 복습",          cat: "자격증",  color: "#42A5F5", start: "15:00", end: "17:00" },
];

export const SCHED_KEY = "plannerSchedules_v1";
export const WEEK_KEY = "plannerWeekPlan_v1";

/**
 * 저장된 일정 목록 읽기 (없으면 기본 일정 폴백).
 * 추후 plannerService 가 API 로 교체되면 이 폴백은 제거.
 */
export function readSchedules(): PlannerSchedule[] {
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  try {
    const raw = localStorage.getItem(SCHED_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length > 0) return p as PlannerSchedule[];
    }
  } catch {
    /* ignore */
  }
  const mk = (title: string, type: string, n: number): PlannerSchedule => {
    const d = new Date(todayMid);
    d.setDate(d.getDate() + n);
    return {
      title, type,
      year: d.getFullYear(), month: d.getMonth(), day: d.getDate(),
      dday: n, date: `${d.getMonth() + 1}월 ${d.getDate()}일`,
    };
  };
  return [
    mk("CS 파이널 시험", "시험", 0),
    mk("팀 프로젝트 발표", "과제", 5),
    mk("스터디 최종 발표", "모임", 12),
  ];
}

/**
 * 가장 빠른 다가오는 D-day 1개 조회 (Dashboard 디데이 영역 ↔ 플래너 모달 공통 소스).
 * - localStorage(SCHED_KEY)의 일정에서 dday >= 0 중 가장 가까운 것
 * 반환: { dday, title } 또는 null(일정 없음)
 */
export function getNearestDday(): { dday: number; title: string } | null {
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);

  const list = readSchedules();

  const upcoming = list
    .map((s) => ({
      title: s.title,
      dday: Math.ceil((new Date(s.year, s.month, s.day).getTime() - todayMid.getTime()) / 86400000),
    }))
    .filter((s) => s.dday >= 0)
    .sort((a, b) => a.dday - b.dday);

  return upcoming.length > 0 ? upcoming[0] : null;
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
