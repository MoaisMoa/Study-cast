export type RoomType = "FREE" | "PREMIUM";

export type RoomCategory =
  | "어학"
  | "공무원"
  | "개발·IT"
  | "자격증"
  | "취업·면접"
  | "대학생";

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

/** 방 생성 폼 페이로드 */
export type RoomVisibility = "public" | "private";

export interface CreateRoomPayload {
  thumbnail: string | null;
  name: string;
  visibility: RoomVisibility;
  code: string;
  count: number;
  startDate: string;
  endDate: string;
  camOn: boolean;
  micOn: boolean;
  notice: string;
}

export interface CreateRoomResponse {
  roomId: number;
}
