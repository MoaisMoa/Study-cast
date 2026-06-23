/** 스터디룸 입장 — 상세 페이지(/rooms/:roomId)를 새 창으로 연다. */
export function openStudyRoom(roomId: number | string): void {
  if (typeof window === "undefined") return;
  window.open(`/rooms/${roomId}`, "_blank", "noopener,noreferrer");
}
