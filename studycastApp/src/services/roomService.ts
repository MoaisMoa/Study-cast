/**
 * 스터디룸 관련 서비스
 * 1. 백엔드 API 호출
 * 2. 요청 파라미터 전달
 * 3. 응답 데이터 반환
 * 4. multipart/form-data 구성
 * 5. 화면에서 직접 apiClient를 몰라도 되게 감싸는 계층
 */

import { CreateRoomPayload, CreateRoomResponse, JoinCodeCheckResponse, MainRoomPageResponse, MainRoomResponse, MainRoomSearchParams, MainSummaryResponse, Room, MyRoom } from "@/types";
import { apiClient } from "./apiClient";
import { getDefaultRoomImage } from "@/utils/roomImage";

/** 공개 스터디 목록 API 응답 원본 조회 */
export async function listRooms(
  params?: MainRoomSearchParams
): Promise<MainRoomPageResponse> {
  const response = await apiClient.get<MainRoomPageResponse>(
    "/api/main/rooms",
    { params }
  );
  return response.data;
}

/** 추천 스터디
 *  - 로그인: 관심 카테고리 + 마감 제외 + 최근 활동순 10개
 *  - 비로그인(guest): 관심사 무시 + 마감 제외 + 최근 활동순 10개 (전체 대상)
 */
export async function listRecommended(opts?: { guest?: boolean }): Promise<Room[]> {
  const guest = opts?.guest ?? false;
  
  const url = guest
    ? "/api/main/guest-recommendations"
    : "/api/main/recommendations";

  const response = await apiClient.get<MainRoomResponse[]>(url);

  return response.data.map(toRoom);
}

/** 내 스터디 (최대 3개, 생성방 1순위 → 최근 접속순) */
export async function listMyRooms(): Promise<MyRoom[]> {
  const response = await apiClient.get<MainRoomResponse[]> (
    "/api/main/my-studies"
  );

  return response.data.map(toMyRoom);
}

/** 개인 학습 요약 조회 */
export async function getMainSummary(): Promise<MainSummaryResponse> {
  const response = await apiClient.get<MainSummaryResponse>(
    "/api/main/summary"
  );

  return response.data;
}

/**
 * 공개 스터디 목록 조회 후 화면용 Room 타입으로 변환
 */
export async function listRoomCards(
  params?: MainRoomSearchParams
): Promise<{ rooms: Room[]; page: number; size: number; last: boolean }> {
  const response = await apiClient.get<MainRoomPageResponse>(
    "/api/main/rooms",
    { params }
  );

  return {
    rooms: response.data.rooms.map(toRoom),
    page: response.data.page,
    size: response.data.size,
    last: response.data.last,
  };
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

/**
 * 초 단위 공부 시간을 화면 표시용 문자열로 변환
 */
function formatStudyTime(seconds: number | null): string {
  if (seconds == null) return "-";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * 메인페이지 API 응답을 기존 화면용 Room 타입으로 변환
 * - Browse / MobileBrowse의 기존 카드 UI를 그대로 사용하기 위한 변환 함수
 */
function toRoom(response: MainRoomResponse): Room {
  const createdAt = response.createdAt ? new Date(response.createdAt).getTime() : null;
  const createdDaysAgo =
    createdAt == null
      ? undefined
      : Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));

  return {
    id: response.roomNo,
    title: response.roomTitle,
    cat: response.categoryName,
    time: formatStudyTime(response.averageStudySeconds),
    members: response.currentUsers,
    max: response.maxUsers,
    img: response.roomThumbnail || getDefaultRoomImage(response.roomNo),
    live: response.live,
    type: response.premium ? "PREMIUM" : "FREE",
    recent: response.newRoom,
    createdDaysAgo,
    overCapacity: response.currentUsers > response.maxUsers,
    isPrivate: response.roomPrivate,
    createdAt: response.createdAt ?? null,
    expiredAt: response.expiredAt ?? null,
  };
}

/**
 * 메인페이지 API 응답을 기존 화면용 MyRoom 타입으로 변환
 * - Dashboard / MobileDashboard 의 기존 카드 UI를 그대로 사용하기 위한 변환 함수
 */
function toMyRoom(response: MainRoomResponse): MyRoom {
  return {
    id: response.roomNo,
    title: response.roomTitle,
    cat: response.categoryName,
    type: response.premium ? "PREMIUM" : "FREE",
    members: response.currentUsers,
    max: response.maxUsers,
    img: response.roomThumbnail || getDefaultRoomImage(response.roomNo),
    live: response.live,
    isPrivate: response.roomPrivate,
    time: formatStudyTime(response.averageStudySeconds),
    createdAt: response.createdAt
      ? new Date(response.createdAt).getTime()
      : null,
    expiredAt: response.expiredAt ?? null,
    visitedAt: response.lastVisitedAt
      ? new Date(response.lastVisitedAt).getTime()
      : null,
  };
}

interface RoomDetailResponse {
  roomNo: number;
  roomTitle: string;
  roomThumbnail: string | null;
  categoryNo: number;
  categoryName: string;
  currentUsers: number;
  maxUsers: number;
  roomPrivate: boolean;
  owner: boolean;
  expired: boolean;
  createdAt: string;
  expiredAt: string;
}

/** 이메일 초대 링크 등으로 roomNo만 가지고 있을 때, 메인페이지 카드 모달을 띄우기 위한 최소 정보 조회 */
export async function getRoomSummary(roomId: number | string): Promise<Room> {
  const { data } = await apiClient.get<RoomDetailResponse>(`/api/rooms/${roomId}`);
  return {
    id: data.roomNo,
    title: data.roomTitle,
    cat: data.categoryName as Room["cat"],
    time: "-",
    members: data.currentUsers,
    max: data.maxUsers,
    img: data.roomThumbnail || getDefaultRoomImage(data.roomNo),
    live: data.currentUsers > 0,
    type: "FREE",
    isPrivate: data.roomPrivate,
    createdAt: data.createdAt ?? null,
    expiredAt: data.expiredAt ?? null,
  };
}
