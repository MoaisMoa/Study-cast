import type { RoomCategory, RoomType, RoomVisibility } from "./room";

/** 방 운영 상태 (기간/인원 기준 계산값) */
export type RunStatus = "운영 중" | "마감" | "종료";

/** 내 스터디 정렬 기준 */
export type SortValue = "recent" | "title" | "deadline";

/** 운영 상태 필터 */
export type StatusFilter = "전체" | RunStatus;

/** 공개 여부 필터 */
export type VisibilityFilter = "전체" | "공개" | "비공개";

/**
 * 내 스터디 방 — API 응답 필드명 기준 (ISO 날짜).
 * 메인페이지 Room 과 별개로, 방장 관리용 필드(ownerId, period 등)를 포함한다.
 */
export interface MyStudyRoom {
  id: string;
  ownerId: string;
  title: string;
  category: RoomCategory;
  type: RoomType;
  visibility: RoomVisibility;
  members: number;
  maxMembers: number;
  isLive: boolean;
  /** ISO 8601 yyyy-MM-dd */
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  img: string;
  avgStudyTime: string;
}

/** 종료/삭제 확인 모달 상태 */
export interface ConfirmModalState {
  type: "stop" | "delete";
  rooms: MyStudyRoom[];
}
