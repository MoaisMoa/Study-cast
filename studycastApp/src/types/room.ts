export type RoomType = "FREE" | "PREMIUM";

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
  type: RoomType;
  recent?: boolean;
  createdDaysAgo?: number;
  overCapacity?: boolean;
  badge?: "NEW";
}

/** 내 스터디(메인 좌측 슬롯)용 Room */
export interface MyRoom {
  id: number;
  title: string;
  members: number;
  max: number;
  img: string;
  live: boolean;
  createdAt: number | null;
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
