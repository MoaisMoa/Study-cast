/**
 * 방문한 방 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 apiClient.request 로 교체.
 */

import type { VisitedRoom } from "@/types/visitedRoom";
import { VISITED_ROOMS_RAW, buildRecentRooms, buildFrequentRooms } from "@/data/visitedRooms";
import { mockRequest } from "./apiClient";

export interface VisitedRoomsResult {
  recentRooms: VisitedRoom[];
  frequentRooms: VisitedRoom[];
}

/** 방문한 방 목록 조회 (최근 + 자주, 정렬/중복제거 포함) */
export async function fetchVisitedRooms(): Promise<VisitedRoomsResult> {
  return mockRequest(
    {
      recentRooms: buildRecentRooms(VISITED_ROOMS_RAW),
      frequentRooms: buildFrequentRooms(VISITED_ROOMS_RAW),
    },
    { latency: 250 }
  );
}

/** 비공개 방 참여 코드 검증 — mock: "1234" 만 통과 */
const MOCK_CODE = "1234";
export async function verifyEntryCode(_roomId: number, code: string): Promise<boolean> {
  await mockRequest(null, { latency: 300 });
  return code.trim() === MOCK_CODE;
}
