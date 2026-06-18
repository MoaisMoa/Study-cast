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
  const token = sessionStorage.getItem("sc_access_token");
  if (!token) {
    console.warn("[AUTH] Access token is missing from sessionStorage for WebSocket authentication.");
    console.warn("[AUTH] sessionStorage keys:", Object.keys(sessionStorage));
  } else {
    console.log("[AUTH] Access token found, length:", token.length);
  }
  return token;
}

function formatTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function buildStompClient(): Client {
  const token = getAccessToken();
  const wsUrl = `${WS_BASE_URL}${WS_ENDPOINT}`.replace(/^http/, "ws");
  
  console.log("[STOMP] buildStompClient: token present =", !!token);
  if (token) {
    console.log("[STOMP] Authorization header will be sent: Bearer [token...]");
    console.log("[STOMP] Token length:", token.length);
  }
  
  const client = new Client({
    // webSocketFactory: () => new SockJS(`${WS_BASE_URL}${WS_ENDPOINT}`),
    brokerURL: wsUrl,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 20000,
    debug: (msg: string) => {
      console.log("[STOMP DEBUG]", msg);
    },
  });
  
  client.onConnect = (frame) => {
    console.log("[STOMP] Connected successfully", frame);
  };
  
  client.onStompError = (frame) => {
    console.error("[STOMP] STOMP error:", frame?.body, frame);
  };
  
  client.onWebSocketError = (event) => {
    console.error("[STOMP] WebSocket error:", event);
  };
  
  return client;
}

async function ensureStompConnected(): Promise<void> {
  if (!getAccessToken()) {
    throw new Error("로그인이 필요합니다.");
  }
  if (stompClient && stompClient.active && stompClient.connected) {
    console.log("[STOMP] Already connected, reusing existing connection");
    return;
  }
  if (stompClient) {
    console.log("[STOMP] Deactivating existing client");
    stompClient.deactivate();
    stompClient = null;
  }

  const client = buildStompClient();
  const ready = new Promise<void>((resolve, reject) => {
    client.onConnect = () => {
      console.log("[STOMP] onConnect fired - connection established and authenticated");
      stompClient = client;
      resolve();
    };
    client.onStompError = (frame) => {
      console.error("[STOMP] onStompError fired:", frame?.body, frame);
      reject(new Error(frame?.body || "STOMP error"));
    };
    client.onWebSocketError = (event) => {
      console.error("[STOMP] onWebSocketError fired during connect:", event);
      reject(new Error("WebSocket error during connection"));
    };
  });
  console.log("[STOMP] Calling client.activate()");
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
  
  console.log("[STOMP CHAT] Sending message to room", _roomId);
  
  await ensureStompConnected();
  if (!stompClient || !stompClient.connected) {
    throw new Error("WebSocket not connected");
  }
  
  const destination = `${STOMP_DESTINATION_PREFIX}/rooms/${_roomId}/chat`;
  console.log("[STOMP CHAT] Publishing to destination:", destination);
  
  stompClient.publish({
    destination,
    body: JSON.stringify({ message: text }),
  });

  console.log("[STOMP CHAT] Message published successfully");

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
    console.warn("[STOMP CHAT] subscribeChat called with empty roomId");
    return () => {};
  }

  let active = true;
  let subscription: any = null;
  const cleanup = () => {
    console.log("[STOMP CHAT] Cleanup called for room", _roomId);
    active = false;
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    if (stompClient && activeRoomId === _roomId) {
      console.log("[STOMP CHAT] Deactivating STOMP client");
      stompClient.deactivate();
      stompClient = null;
      activeRoomId = null;
    }
  };

  ensureStompConnected()
    .then(() => {
      if (!active || !stompClient) {
        console.warn("[STOMP CHAT] Connection lost or cleanup called during connect");
        return;
      }
      if (activeRoomId && activeRoomId !== _roomId && stompSubscription) {
        console.log("[STOMP CHAT] Unsubscribing from previous room:", activeRoomId);
        stompSubscription.unsubscribe();
        stompSubscription = null;
      }
      activeRoomId = _roomId;
      const destination = `${STOMP_SUBSCRIBE_PREFIX}/rooms/${_roomId}`;
      console.log("[STOMP CHAT] Subscribing to:", destination);
      
      subscription = stompClient.subscribe(
        destination,
        (frame) => {
          if (!frame.body) {
            console.warn("[STOMP CHAT] Empty frame body received");
            return;
          }
          try {
            const payload = JSON.parse(frame.body);
            console.log("[STOMP CHAT] Message received:", payload);
            _onMessage(toChatMessage(payload));
          } catch (err) {
            console.error("[STOMP CHAT] Failed to parse message:", err, frame.body);
          }
        }
      );
      stompSubscription = subscription;
      console.log("[STOMP CHAT] Subscription successful for room", _roomId);
    })
    .catch((error) => {
      console.error("[STOMP CHAT] WebSocket 구독 실패:", error);
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
