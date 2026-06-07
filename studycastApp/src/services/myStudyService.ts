/**
 * 내 스터디 관련 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 `apiClient.request`로 교체.
 */

import type { MyStudyRoom } from "@/types/myStudy";
import { MOCK_MY_STUDY_ROOMS } from "@/data/myStudy";
import { mockRequest } from "./apiClient";

/** 방장이 생성한 스터디 목록 조회 — GET /api/rooms?ownerId={ownerId} */
export async function listMyRooms(ownerId: string): Promise<MyStudyRoom[]> {
  const data = MOCK_MY_STUDY_ROOMS.filter((r) => r.ownerId === ownerId);
  return mockRequest(data, { latency: 250 });
}

/** 스터디 종료 — PATCH /api/rooms/{id}/close */
export async function closeRooms(ids: string[]): Promise<{ ok: boolean }> {
  // TODO(API 연결): await Promise.all(ids.map(id => request(`/rooms/${id}/close`, { method: "PATCH" })));
  await mockRequest(null, { latency: 400 });
  return { ok: true };
}

/** 스터디 삭제 — DELETE /api/rooms/{id} */
export async function deleteRooms(ids: string[]): Promise<{ ok: boolean }> {
  // TODO(API 연결): await Promise.all(ids.map(id => request(`/rooms/${id}`, { method: "DELETE" })));
  await mockRequest(null, { latency: 400 });
  return { ok: true };
}

/** 비공개 방 참여 코드 검증 — POST /api/rooms/{id}/verify-code */
export async function verifyJoinCode(_id: string, code: string): Promise<boolean> {
  await mockRequest(null, { latency: 300 });
  // mock: "1234" 만 정답
  return code.trim() === "1234";
}
