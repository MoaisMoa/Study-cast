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
// import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

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

const WS_BASE_URL = "http://localhost:8080";
const WS_ENDPOINT = "/ws";
const STOMP_DESTINATION_PREFIX = "/pub";
const STOMP_SUBSCRIBE_PREFIX = "/sub";

let stompClient: Client | null = null;
let stompSubscription: any = null;
let activeRoomId: string | null = null;

function getAccessToken(): string | null {
  return sessionStorage.getItem("sc_access_token");
}

function formatTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function buildStompClient(): Client {
  const token = getAccessToken();
  const wsUrl = `${WS_BASE_URL}${WS_ENDPOINT}`.replace(/^http/, "ws");
  const client = new Client({
    // webSocketFactory: () => new SockJS(`${WS_BASE_URL}${WS_ENDPOINT}`),
    brokerURL: wsUrl,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 20000,
    debug: () => {},
  });
  return client;
}

async function ensureStompConnected(): Promise<void> {
  if (stompClient && stompClient.active && stompClient.connected) {
    return;
  }
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }

  const client = buildStompClient();
  const ready = new Promise<void>((resolve, reject) => {
    client.onConnect = () => {
      stompClient = client;
      resolve();
    };
    client.onStompError = (frame) => {
      reject(new Error(frame?.body || "STOMP error"));
    };
    client.onWebSocketError = (event) => {
      reject(new Error("WebSocket error"));
    };
  });
  client.activate();
  return ready;
}

function toChatMessage(payload: any): ChatMessage {
  const sentAt = payload.sentAt ? new Date(payload.sentAt) : new Date();
  return {
    id: Number(payload.id ?? Date.now()),
    name: payload.userName ?? "알 수 없음",
    text: payload.message ?? String(payload.text ?? ""),
    time: formatTime(sentAt),
    mine: false,
    isHost: false,
  };
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
  if (!_roomId) {
    throw new Error("roomId is required for sendMessage");
  }
  await ensureStompConnected();
  if (!stompClient || !stompClient.connected) {
    throw new Error("WebSocket not connected");
  }
  stompClient.publish({
    destination: `${STOMP_DESTINATION_PREFIX}/rooms/${_roomId}/chat`,
    body: JSON.stringify({ message: text }),
  });

  return {
    id: Date.now(),
    name: "나",
    text,
    time: formatTime(new Date()),
    mine: true,
    isHost: true,
  };
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
  if (!_roomId) {
    return () => {};
  }

  let active = true;
  let subscription: any = null;
  const cleanup = () => {
    active = false;
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    if (stompClient) {
      stompClient.deactivate();
      stompClient = null;
      activeRoomId = null;
    }
  };

  ensureStompConnected()
    .then(() => {
      if (!active || !stompClient) return;
      if (activeRoomId && activeRoomId !== _roomId && stompSubscription) {
        stompSubscription.unsubscribe();
        stompSubscription = null;
      }
      activeRoomId = _roomId;
      subscription = stompClient.subscribe(
        `${STOMP_SUBSCRIBE_PREFIX}/rooms/${_roomId}`,
        (frame) => {
          if (!frame.body) return;
          try {
            const payload = JSON.parse(frame.body);
            _onMessage(toChatMessage(payload));
          } catch {
            // ignore malformed message
          }
        }
      );
      stompSubscription = subscription;
    })
    .catch((error) => {
      console.error("채팅 WebSocket 구독 실패", error);
    });

  return cleanup;
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
