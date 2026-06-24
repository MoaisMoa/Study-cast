import type { VisitedRoom, VisitedRoomStatus } from "@/types/visitedRoom";
import type { MainRoomPageResponse, MainRoomResponse } from "@/types";
import { apiClient } from "./apiClient";
import { getDefaultRoomImage } from "@/utils/roomImage";

const PAGE_SIZE = 10;

export interface VisitedRoomsPageResult {
  rooms: VisitedRoom[];
  page: number;
  size: number;
  last: boolean;
}

export async function fetchRecentVisitedRooms(page = 0, size = PAGE_SIZE): Promise<VisitedRoomsPageResult> {
  const res = await apiClient.get<MainRoomPageResponse>("/api/visited-rooms/recent", { params: { page, size } });
  return { ...res.data, rooms: res.data.rooms.map(toVisitedRoom) };
}

export async function fetchFrequentVisitedRooms(page = 0, size = PAGE_SIZE): Promise<VisitedRoomsPageResult> {
  const res = await apiClient.get<MainRoomPageResponse>("/api/visited-rooms/frequent", { params: { page, size } });
  return { ...res.data, rooms: res.data.rooms.map(toVisitedRoom) };
}

export async function recordVisit(roomNo: number): Promise<void> {
  await apiClient.post(`/api/visited-rooms/${roomNo}`);
}

/** 스터디방 입장 — 비공개방은 joinCode 포함 */
export async function joinRoom(
  roomId: number,
  joinCode?: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const body = joinCode ? { joinCode } : null;
    await apiClient.post(`/api/rooms/${roomId}/join`, body);
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "참여 코드가 올바르지 않습니다.",
    };
  }
}

function toVisitedRoom(r: MainRoomResponse): VisitedRoom {
  const now = Date.now();
  const expiredMs = r.expiredAt ? new Date(r.expiredAt).getTime() : null;
  const isExpired = expiredMs != null && expiredMs <= now;

  let status: VisitedRoomStatus;
  if (isExpired) status = "ended";
  else if (r.full) status = "full";
  else status = "open";

  const lastVisitedMs = r.lastVisitedAt ? new Date(r.lastVisitedAt).getTime() : null;
  const createdMs = r.createdAt ? new Date(r.createdAt).getTime() : null;
  const totalDays =
    createdMs && expiredMs ? Math.ceil((expiredMs - createdMs) / 86_400_000) : 0;

  return {
    id: r.roomNo,
    title: r.roomTitle,
    cat: r.categoryName,
    time: formatStudyTime(r.averageStudySeconds),
    img: r.roomThumbnail ?? getDefaultRoomImage(r.roomNo),
    members: r.currentUsers,
    max: r.maxUsers,
    visibility: r.roomPrivate ? "private" : "public",
    type: r.premium ? "PREMIUM" : "FREE",
    status,
    isLive: r.live ?? false,
    isNew: r.newRoom ?? false,
    visitedAt: lastVisitedMs ? formatRelativeTime(lastVisitedMs) : "-",
    visitedAtOrder: lastVisitedMs ? now - lastVisitedMs : Number.MAX_SAFE_INTEGER,
    visitCount: r.visitCount ?? 0,
    hasEntered: false,
    period: {
      total: totalDays,
      start: formatDate(r.createdAt),
      end: formatDate(r.expiredAt),
    },
  };
}

function formatStudyTime(seconds: number | null | undefined): string {
  if (seconds == null) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}주 전`;
  return `${Math.floor(d / 30)}개월 전`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
