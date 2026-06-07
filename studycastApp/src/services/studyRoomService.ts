/**
 * 스터디룸 서비스 — 현재는 더미 데이터 기준 mock 구현.
 *
 * API/WebSocket/WebRTC 연동 시 이 파일의 함수 본문만 교체하면 되도록,
 * 컴포넌트는 항상 이 서비스 함수만 호출한다 (데이터 직접 import 금지).
 *
 *   - REST  : fetchRoom / updateRoom / kickMember / postNotice ...
 *   - 채팅  : subscribeChat (WebSocket onmessage 로 교체)
 *   - 타이머: reportTimer (서버 시간 동기화로 교체)
 *   - 캠    : (WebRTC) CamGrid의 getUserMedia 자리 그대로 사용
 */

import type { ChatMessage, RoomMember } from "@/types/studyRoom";
import {
  ALL_INIT, INITIAL_MESSAGES, ROOM_MAX_MEMBERS, ROOM_TITLE_DEFAULT,
} from "@/data/studyRoom";
import { mockRequest } from "./apiClient";

/** 방 입장 시 한 번에 받아오는 초기 스냅샷 */
export interface RoomSnapshot {
  roomId: string;
  title: string;
  maxMembers: number;
  members: RoomMember[];
  messages: ChatMessage[];
  notice: string | null;
  /** 본인이 방장인지 */
  isHost: boolean;
}

/** 방 입장 — 초기 스냅샷 조회 (GET /rooms/:id) */
export async function fetchRoom(roomId: string): Promise<RoomSnapshot> {
  // TODO(API 연결): return request<RoomSnapshot>(`/rooms/${roomId}`);
  return mockRequest(
    {
      roomId,
      title: ROOM_TITLE_DEFAULT,
      maxMembers: ROOM_MAX_MEMBERS,
      members: ALL_INIT,
      messages: INITIAL_MESSAGES,
      notice: null,
      isHost: true,
    },
    { latency: 200 }
  );
}

/** 방 설정 변경 (PUT /rooms/:id) */
export async function updateRoom(
  _roomId: string,
  _patch: Partial<Pick<RoomSnapshot, "title" | "maxMembers">>
): Promise<{ ok: boolean }> {
  return mockRequest({ ok: true }, { latency: 400 });
}

/** 멤버 추방 (DELETE /rooms/:id/members/:memberId) */
export async function kickMember(_roomId: string, _memberId: number): Promise<{ ok: boolean }> {
  return mockRequest({ ok: true }, { latency: 300 });
}

/** 공지 등록/수정/삭제 (PUT /rooms/:id/notice) — null 이면 삭제 */
export async function saveNotice(_roomId: string, notice: string | null): Promise<{ ok: boolean; notice: string | null }> {
  return mockRequest({ ok: true, notice }, { latency: 300 });
}

/** 채팅 메시지 전송 (WebSocket send 또는 POST /rooms/:id/messages) */
export async function sendMessage(_roomId: string, text: string): Promise<ChatMessage> {
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((v) => String(v).padStart(2, "0")).join(":");
  return mockRequest<ChatMessage>(
    { id: Date.now(), name: "나", text, time, mine: true, isHost: true },
    { latency: 80 }
  );
}

/**
 * 실시간 채팅 구독 — 현재는 mock(no-op).
 * WebSocket 연동 시: ws.onmessage = (e) => onMessage(JSON.parse(e.data));
 * 반환값은 구독 해제 함수.
 */
export function subscribeChat(
  _roomId: string,
  _onMessage: (msg: ChatMessage) => void
): () => void {
  // TODO(WebSocket): const ws = new WebSocket(`${WS_BASE}/rooms/${_roomId}`);
  //                  ws.onmessage = (e) => _onMessage(JSON.parse(e.data));
  //                  return () => ws.close();
  return () => {};
}

/**
 * 공부 타이머 보고 — 현재는 mock(no-op).
 * 서버 시간 동기화 시: POST /rooms/:id/timer { state, sec }
 */
export async function reportTimer(
  _roomId: string,
  _state: "running" | "paused" | "idle",
  _sec: number
): Promise<void> {
  // TODO(API 연결): await request(`/rooms/${_roomId}/timer`, { method: "POST", body: ... });
}

/** 방 나가기 (POST /rooms/:id/leave) */
export async function leaveRoom(_roomId: string): Promise<{ ok: boolean }> {
  return mockRequest({ ok: true }, { latency: 150 });
}
