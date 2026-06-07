import type { MyStudyRoom, RunStatus } from "@/types/myStudy";

/** ISO("yyyy-MM-dd") → Date (브라우저 파싱 안전) */
export function parseDate(iso: string): Date {
  if (!iso) return new Date(NaN);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** ISO → "yy.MM.dd" */
export function fmtDateShort(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}.${m}.${d}`;
}

/** ISO → "yyyy.MM.dd" */
export function fmtDateFull(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

/** createdAt 기준 NEW 여부 (10일 이내) */
export function isNewRoom(createdAt: string): boolean {
  if (!createdAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (today.getTime() - parseDate(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 10;
}

/** 방 운영 상태 계산: 기간 종료 > 인원 마감 > 운영 중 */
export function calcRoomStatus(room: Pick<MyStudyRoom, "periodEnd" | "members" | "maxMembers">): RunStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parseDate(room.periodEnd) < today) return "종료";
  if (room.members >= room.maxMembers) return "마감";
  return "운영 중";
}
