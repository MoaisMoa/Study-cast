/**
 * 스터디룸 관련 서비스
 */

import type { CreateRoomPayload, CreateRoomResponse, JoinCodeCheckResponse, Room, MyRoom } from "@/types";
import { MY_ROOMS_RAW, REC_ROOMS, ROOM_POOL } from "@/data/rooms";
import { getUserInterestCats } from "@/data/interestStore";
import { apiClient, mockRequest } from "./apiClient";

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
  // 관심 카테고리 적용 (프로필에서 선택한 값 — 비어 있으면 전체)
  const interestCats = getUserInterestCats();
  if (interestCats.length > 0) {
    list = list.filter((r) => interestCats.includes(r.cat));
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
/**
 * 스터디방 생성
 * 방 생성 정보와 썸네일 이미지를 multipart/form-data로 함께 전송한다.
 * Content-Type은 직접 지정하지 않고 브라우저가 boundary를 생성하도록 한다.
 */

/** 참여 코드 중복 확인 */
export async function checkJoinCodeDuplicate(code: string): Promise<boolean> {
  // 1. 참여 코드 중복 확인 API 요청
  const response =
    await apiClient.get<JoinCodeCheckResponse>(
      "/api/rooms/check-code",
      {
        params: { code },
      }
    );
    // 2. 응답 DTO에서 중복 여부만 반환
    return response.data.duplicate;
}

/** 방 생성 */
export async function createRoom(
  payload: CreateRoomPayload,
  image?: File | null
): Promise<CreateRoomResponse> {
  // 1. multipart 요청 객체 생성
  const formData = new FormData();
  /**
   * Blob 사용 이유
   * : request 파트는 보통 text/plain으로 전송되는데,
   * 백엔드에서 JSON으로 요청 받고 있으므로 Blob 사용 
   */
  // 2. 방 생성 데이터를 application/json 파트로 변환
  const requestBlob = new Blob(
    [JSON.stringify(payload)],
    {
      type: "application/json"
    }
  );
  /**
   * key 이름 = Controller 파라미터
   * -> request와 image
   */ 
  // 3. Controller의 request 파트 이름과 동일하게 추가
  formData.append("request", requestBlob);
  // 4. 이미지가 있을 때만 image 파트 추가
  if (image) {
    formData.append("image", image);
  }
  /**  
   * Content-Type 지정 금지
   * : 브라우저와 Axios가 boundary를 자동 생성해야하기 때문
  */
  // 5. 방 생성 API 요청
  const response = await apiClient.post<CreateRoomResponse>(
    "/api/rooms",
    formData
  );
  // 6. 생성된 방 정보 반환
  return response.data;
}
