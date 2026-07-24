/**
 * 플래너/일정 서비스 — 현재는 localStorage(mock) 기반.
 * 추후 apiClient.request 로 교체.
 *
 * 컴포넌트는 이 서비스의 async 함수만 호출하므로,
 * 백엔드 연결 시 아래 mock 본문만 fetch 로 바꾸면 된다.
 */

import { apiClient } from "./apiClient";

export interface MonthlyStudyStats {
  attendDays: number;
  totalSeconds: number;
  /** 일별 공부 시간(초) — key: 일(1~31) */
  dailySeconds: Record<number, number>;
}

/** 서버 응답 형태 */
export interface DdayResponse {
  ddayNo: number;
  title: string;
  type: string;
  targetDate: string; // "yyyy-MM-dd"
  remainingDays: number;
}

/** 등록 요청 형태 */
export interface DdayCreatePayload {
  title: string;
  type: string;
  targetDate: string; // "yyyy-MM-dd"
}

/**
 * 내 디데이 목록 조회 — GET /api/ddays
 */
export async function fetchDdays(): Promise<DdayResponse[]> {
  const res = await apiClient.get<DdayResponse[]>("/api/ddays");
  return res.data;
}

/**
 * 디데이 등록 — POST /api/ddays
 */
export async function createDday(payload: DdayCreatePayload): Promise<void> {
  await apiClient.post("/api/ddays", payload);
}

/**
 * 디데이 삭제 — DELETE /api/ddays/{id}
 */
export async function deleteDday(ddayNo: number): Promise<void> {
  await apiClient.delete(`/api/ddays/${ddayNo}`);
}

/** 주간 계획 서버 응답 형태 */
export interface WeekPlanResponse {
  planNo: number;
  dayOfWeek: number;  // 0=월 ~ 6=일
  title: string;
  color: string;
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
}

/** 주간 계획 등록/수정 요청 형태 */
export interface WeekPlanPayload {
  dayOfWeek: number;
  title: string;
  color: string;
  startTime: string;
  endTime: string;
}

/** 내 주간 계획 목록 조회 — GET /api/week-plans */
export async function fetchWeekPlans(): Promise<WeekPlanResponse[]> {
  const res = await apiClient.get<WeekPlanResponse[]>("/api/week-plans");
  return res.data;
}

/** 주간 계획 등록 — POST /api/week-plans */
export async function createWeekPlan(payload: WeekPlanPayload): Promise<void> {
  await apiClient.post("/api/week-plans", payload);
}

/** 주간 계획 수정 — PUT /api/week-plans/{planNo} */
export async function updateWeekPlan(planNo: number, payload: WeekPlanPayload): Promise<void> {
  await apiClient.put(`/api/week-plans/${planNo}`, payload);
}

/** 주간 계획 삭제 — DELETE /api/week-plans/{planNo} */
export async function deleteWeekPlan(planNo: number): Promise<void> {
  await apiClient.delete(`/api/week-plans/${planNo}`);
}

/**
 * 월별 공부 통계 조회 — GET /api/study-logs/monthly
 */
export async function fetchMonthlyStudyStats(year: number, month: number): Promise<MonthlyStudyStats> {
  const res = await apiClient.get<MonthlyStudyStats>("/api/study-logs/monthly", {
    params: { year, month },
  });
  return res.data;
}
