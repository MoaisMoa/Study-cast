import type { MyStudyRoom } from "@/types/myStudy";
import type { MainRoomResponse, RoomCategory } from "@/types";
import { apiClient } from "./apiClient";
import { getDefaultRoomImage } from "@/utils/roomImage";

/** 내가 생성한 스터디 목록 조회 — GET /api/main/my-created-rooms */
export async function listMyRooms(): Promise<MyStudyRoom[]> {
  const res = await apiClient.get<MainRoomResponse[]>("/api/main/my-created-rooms");
  return res.data.map(toMyStudyRoom);
}

/** 스터디 종료 — PATCH /api/rooms/{id}/close */
export async function closeRooms(ids: string[]): Promise<{ ok: boolean; message?: string }> {
  try {
    await Promise.all(ids.map((id) => apiClient.patch(`/api/rooms/${id}/close`)));
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "스터디 종료 처리 중 오류가 발생했습니다.",
    };
  }
}

/** 스터디 삭제 — DELETE /api/rooms/{id} */
export async function deleteRooms(ids: string[]): Promise<{ ok: boolean; message?: string }> {
  try {
    await Promise.all(ids.map((id) => apiClient.delete(`/api/rooms/${id}`)));
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "스터디 삭제 처리 중 오류가 발생했습니다.",
    };
  }
}

/** 비공개 방 참여 코드 검증 — POST /api/rooms/{id}/verify-code */
export async function verifyJoinCode(id: string, code: string): Promise<boolean> {
  const res = await apiClient.post<{ valid: boolean }>(`/api/rooms/${id}/verify-code`, { code });
  return res.data.valid;
}

function toMyStudyRoom(r: MainRoomResponse): MyStudyRoom {
  return {
    id: String(r.roomNo),
    ownerId: "",
    title: r.roomTitle,
    category: r.categoryName as RoomCategory,
    type: r.premium ? "PREMIUM" : "FREE",
    visibility: r.roomPrivate ? "private" : "public",
    members: r.currentUsers ?? 0,
    maxMembers: r.maxUsers ?? 4,
    isLive: r.live ?? false,
    createdAt: toDateStr(r.createdAt),
    periodStart: toDateStr(r.createdAt),
    periodEnd: toDateStr(r.expiredAt),
    img: r.roomThumbnail ?? getDefaultRoomImage(r.roomTitle),
    avgStudyTime: fmtSec(r.averageStudySeconds),
  };
}

function toDateStr(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10); // "yyyy-MM-ddTHH:mm:ss" → "yyyy-MM-dd"
}

function fmtSec(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return "0분";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}분`;
}
