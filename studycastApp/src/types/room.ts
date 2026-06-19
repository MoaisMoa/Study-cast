// 메인페이지 공개 스터디 목록 탭
export type MainRoomTab = "ALL" | "NEW";
// 메인페이지 스터디 및 유형 필터
export type MainRoomType = "ALL" | "FREE" | "PREMIUM";
// 카드 표시용 방 유형 (ALL 제외)
export type RoomType = "FREE" | "PREMIUM";
// 관심 카테고리
export type RoomCategory =
  | "어학"
  | "공무원"
  | "개발·IT"
  | "자격증"
  | "취업·면접"
  | "대학생";

export const ROOM_CATEGORY_NO: Record<RoomCategory, number> = {
  어학: 1,
  공무원: 2,
  "개발·IT": 3,
  자격증: 4,
  "취업·면접": 5,
  대학생: 6,
};
// 메인페이지 공개 스터디 목록 조회 조건
export interface MainRoomSearchParams {
  tab?: MainRoomTab;
  categoryNos?: number[];
  roomType?: MainRoomType;
  joinableOnly?: boolean;
  page?: number;
  size?: number;
  keyword?: string;
}

/** 메인페이지 스터디방 카드 API 응답 */
export interface MainRoomResponse {
  roomNo: number;
  roomTitle: string;
  roomThumbnail: string | null;

  categoryNo: number;
  categoryName: RoomCategory;

  currentUsers: number;
  maxUsers: number;

  live: boolean;
  newRoom: boolean;
  full: boolean;
  premium: boolean;
  joinable: boolean;
  roomPrivate: boolean;

  createdAt: string;
  expiredAt: string;
  lastVisitedAt: string | null;

  visitCount?: number | null;
  averageStudySeconds: number | null;
}

/** 메인페이지 공개 스터디 페이지 API 응답 */
export interface MainRoomPageResponse {
  rooms: MainRoomResponse[];
  page: number;
  size: number;
  last: boolean;
}

/** 메인페이지 개인 학습 요약 API 응답 */
export interface MainSummaryResponse {
  todayStudySeconds: number;
  ddayNo: number | null;
  ddayTitle: string | null;
  remainingDays: number | null;
  studyResolution: string | null;
}

/** 라이브/추천 카드용 공용 Room */
export interface Room {
  id: number;
  title: string;
  cat: RoomCategory;
  time: string;
  members: number;
  max: number;
  img: string;
  live: boolean;
  type: MainRoomType;
  recent?: boolean;
  createdDaysAgo?: number;
  overCapacity?: boolean;
  badge?: "NEW";
  isPrivate?: boolean;
  createdAt?: string | null;
  expiredAt?: string | null;
}

/** 내 스터디(메인 좌측 슬롯)용 Room */
export interface MyRoom {
  id: number;
  title: string;
  cat: RoomCategory;
  type: MainRoomType;
  members: number;
  max: number;
  img: string;
  live: boolean;
  isPrivate: boolean;
  time: string;
  createdAt: number | null;
  expiredAt: string | null;
  visitedAt: number | null;
}

/** 화면 상태용 공개 설정 */
export type RoomVisibility = "public" | "private";

/** 스터디방 생성 API 요청 */
export interface CreateRoomPayload {
  roomTitle: string;
  roomPrivate: boolean;
  roomPassword: string | null;
  maxUsers: number;
  expiredAt: string;
  cameraStatus: boolean;
  micStatus: boolean;
  categoryNo: number;
  roomNotice: string | null;
}

/** 스터디방 생성 API 응답 */
export interface CreateRoomResponse {
  roomNo: number;
  roomTitle: string;
  message: string;
}

/** 스터디방 비공개 참여코드 API 응답 */
export interface JoinCodeCheckResponse {
  code: string,
  duplicate: boolean,
  message: string
}
