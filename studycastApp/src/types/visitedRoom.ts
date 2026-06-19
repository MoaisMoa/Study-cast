import type { RoomCategory, RoomType, RoomVisibility } from "./room";
export type { RoomCategory } from "./room";

/** 방 운영 상태 */
export type VisitedRoomStatus = "open" | "full" | "ended" | "deleted" | "restricted";

/** 방문한 방 섹션 탭 */
export type VisitedTab = "recent" | "frequent";

/** 카드/모달에 표시할 방문한 방 데이터 */
export interface VisitedRoom {
  id: number;
  title: string;
  cat: RoomCategory;
  time: string;
  img: string;
  members: number;
  max: number;
  visibility: RoomVisibility;
  type: RoomType;
  status: VisitedRoomStatus;
  isLive: boolean;
  isNew: boolean;
  /** 최근 방문 라벨 (예: "방금 전") */
  visitedAt: string;
  /** 최근 방문 정렬용 (작을수록 최신) */
  visitedAtOrder: number;
  /** 누적 방문 횟수 */
  visitCount: number;
  /** 실제 입장 이력 여부 (단순 조회 제외) */
  hasEntered: boolean;
  period: { total: number; start: string; end: string };
}

/** 카테고리 필터 옵션 (전체 포함) */
export type VisitedCatFilter = "전체" | RoomCategory;

/** 운영 상태 필터 옵션 */
export type VisitedStatusFilter = "전체" | "입장 가능" | "정원 마감" | "운영 종료";
