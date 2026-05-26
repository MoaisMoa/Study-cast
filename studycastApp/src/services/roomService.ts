/**
 * 스터디룸 관련 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 `apiClient.request`로 교체.
 */

import type { CreateRoomPayload, CreateRoomResponse, Room, MyRoom } from "@/types";
import { MY_ROOMS_RAW, REC_ROOMS, ROOM_POOL } from "@/data/rooms";
import { USER_INTEREST_CATS } from "@/data/categories";
import { mockRequest, apiClient } from "./apiClient";

/** 라이브 스터디 풀 (Browse 그리드용 — 동일 데이터를 4배로 늘려 페이지네이션 테스트) */
export async function listRooms(): Promise<Room[]> {
  const pool: Room[] = [
    ...ROOM_POOL,
    ...ROOM_POOL.map((r) => ({ ...r, id: r.id + 100 })),
    ...ROOM_POOL.map((r) => ({ ...r, id: r.id + 200 })),
    ...ROOM_POOL.map((r) => ({ ...r, id: r.id + 300 })),
  ];
  return mockRequest(pool, { latency: 200 });
}

/** 추천 스터디 — 관심 카테고리 + 마감 제외 + 최근 활동순 */
export async function listRecommended(): Promise<Room[]> {
  let list: Room[] = [...ROOM_POOL, ...REC_ROOMS];
  // id 기준 중복 제거
  const seen = new Set<number>();
  list = list.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  // 마감 제외
  list = list.filter((r) => r.members < r.max);
  // 관심 카테고리 적용
  if (USER_INTEREST_CATS.length > 0) {
    list = list.filter((r) => USER_INTEREST_CATS.includes(r.cat));
  }
  // 정렬: live > recent > else → 동순위 제목 오름차순
  list.sort((a, b) => {
    const score = (r: Room) => (r.live ? 2 : r.recent ? 1 : 0);
    if (score(b) !== score(a)) return score(b) - score(a);
    return a.title.localeCompare(b.title, "ko");
  });
  return mockRequest(list.slice(0, 10), { latency: 250 });
}

/** 내 스터디 (최대 3개, 생성방 1순위 → 최근 접속순) */
export async function listMyRooms(): Promise<MyRoom[]> {
  const sorted = [...MY_ROOMS_RAW]
    .sort((a, b) => {
      if (a.createdAt && !b.createdAt) return -1;
      if (!a.createdAt && b.createdAt) return 1;
      return (a.visitedAt || 99) - (b.visitedAt || 99);
    })
    .slice(0, 3);
  return mockRequest(sorted, { latency: 150 });
}

/** 참여 코드 중복 확인 — mock: 항상 사용 가능 */
export async function checkJoinCodeDuplicate(_code: string): Promise<boolean> {
  await mockRequest(null, { latency: 600 });
  return false; // false = 중복 아님
}

/** 방 생성 */
export async function createRoom(
  payload: CreateRoomPayload
): Promise<CreateRoomResponse> {
  const requestBody = {
    categoryNo: 1,
    roomTitle: payload.name,
    roomDescription: "",
    maxUsers: payload.count,
    roomPassword: payload.visibility === "private" ? payload.code : null,
    roomNotice: payload.notice,
    roomPrivate: payload.visibility === "private",
    roomPremium: false,
    roomThumbnail: payload.thumbnail,
    expiredAt: payload.endDate,
  };

  const response = await apiClient.post("/api/rooms", requestBody);
  return { roomId: response.data.roomNo };
}

export async function updateRoomNotice(
  roomId: number,
  notice: string | null
): Promise<{ notice: string | null }> {
  const response = await apiClient.patch(`/api/rooms/${roomId}/notice`, {
    notice,
  });
  return response.data;
}

export async function deleteRoomNotice(roomId: number): Promise<void> {
  await apiClient.delete(`/api/rooms/${roomId}/notice`);
}
