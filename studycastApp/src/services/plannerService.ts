/**
 * 플래너/일정 서비스 — 현재는 localStorage(mock) 기반.
 * 추후 apiClient.request 로 교체.
 *
 * 컴포넌트는 이 서비스의 async 함수만 호출하므로,
 * 백엔드 연결 시 아래 mock 본문만 fetch 로 바꾸면 된다.
 */

import type { PlannerSchedule } from "@/data/planner";
import { getNearestDday, readSchedules } from "@/data/planner";
import { mockRequest } from "./apiClient";

export interface DdayItem {
  dday: number;
  title: string;
}

/**
 * 가장 빠른 다가오는 D-day 1개 조회.
 * - mock: localStorage 기반 getNearestDday()
 * - TODO(API 연결): return request<DdayItem | null>("/schedules/nearest");
 */
export async function fetchNearestDday(): Promise<DdayItem | null> {
  return mockRequest(getNearestDday(), { latency: 0 });
}

/**
 * 내 일정 목록 조회.
 * - TODO(API 연결): return request<PlannerSchedule[]>("/schedules");
 */
export async function fetchSchedules(): Promise<PlannerSchedule[]> {
  return mockRequest(readSchedules(), { latency: 0 });
}
