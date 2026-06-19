import type { ChatMessage, RoomMember } from "@/types/studyRoom";
import { apiClient } from "./apiClient";

/** 방 입장 시 한 번에 받아오는 초기 스냅샷 */
export interface RoomSnapshot {
  roomId: string;
  title: string;
  maxMembers: number;
  members: RoomMember[];
  messages: ChatMessage[];
  notice: string | null;
  isHost: boolean;
  isPrivate: boolean;
  joinCode: string | null;
  camOn: boolean;
  micOn: boolean;
  thumbnail: string | null;
  categoryNo: number;
  expiredAt: string;
}

interface RoomDetailResponse {
  roomNo: number;
  roomTitle: string;
  roomNotice: string | null;
  roomThumbnail: string | null;
  categoryNo: number;
  categoryName: string;
  currentUsers: number;
  maxUsers: number;
  roomPrivate: boolean;
  roomPassword: string | null;
  owner: boolean;
  expired: boolean;
  cameraStatus: boolean;
  micStatus: boolean;
  createdAt: string;
  expiredAt: string;
}

interface ParticipantResponse {
  userUuid: string;
  userName: string;
  profileImage: string | null;
  owner: boolean;
  cameraStatus: boolean;
  micStatus: boolean;
  joinedAt: string;
}

export const MEMBER_COLORS = ["#E53935", "#2DA58E", "#C07A3A", "#1976D2", "#7B1FA2", "#388E3C", "#D32F2F"];

function nowT(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, "0")).join(":");
}

function toRoomMember(p: ParticipantResponse, index: number, isMe: boolean, myProfileImage?: string): RoomMember {
  const joinedAt = p.joinedAt ? new Date(p.joinedAt) : new Date();
  const joinMin = Math.max(0, Math.floor((Date.now() - joinedAt.getTime()) / 60_000));
  return {
    id: index + 1,
    userUuid: p.userUuid,
    name: isMe ? "나" : p.userName,
    short: isMe ? "나" : p.userName.slice(0, 2),
    email: "",
    role: p.owner ? "HOST" : "MEMBER",
    color: isMe ? MEMBER_COLORS[0] : MEMBER_COLORS[(index % (MEMBER_COLORS.length - 1)) + 1],
    sec: 0,
    joinMin,
    mic: p.micStatus,
    cam: p.cameraStatus,
    profileImage: isMe ? myProfileImage : undefined,
  };
}

/** 방 입장 + 초기 스냅샷 조회 */
export async function fetchRoom(roomId: string, myName: string, myProfileImage?: string): Promise<RoomSnapshot> {
  // 입장 처리 (이미 active 상태면 백엔드가 중복 처리)
  await apiClient.post(`/api/rooms/${roomId}/join`);

  const [detailRes, participantsRes] = await Promise.all([
    apiClient.get<RoomDetailResponse>(`/api/rooms/${roomId}`),
    apiClient.get<ParticipantResponse[]>(`/api/rooms/${roomId}/participants`),
  ]);

  const detail = detailRes.data;

  // 나를 항상 index 0(id=1)으로 정렬
  const sorted = [...participantsRes.data].sort((a) => (a.userName === myName ? -1 : 1));
  const members = sorted.map((p, i) => toRoomMember(p, i, p.userName === myName, myProfileImage));

  return {
    roomId,
    title: detail.roomTitle,
    maxMembers: detail.maxUsers,
    members,
    messages: [{ id: 0, type: "system", text: "스터디룸에 입장했습니다.", time: nowT() }],
    notice: detail.roomNotice ?? null,
    isHost: detail.owner,
    isPrivate: detail.roomPrivate,
    joinCode: detail.roomPassword ?? null,
    camOn: detail.cameraStatus ?? true,
    micOn: detail.micStatus ?? false,
    thumbnail: detail.roomThumbnail ?? null,
    categoryNo: detail.categoryNo,
    expiredAt: detail.expiredAt,
  };
}

export interface RoomUpdatePayload {
  roomTitle: string;
  maxUsers: number;
  categoryNo: number;
  expiredAt: string;
  cameraStatus: boolean;
  micStatus: boolean;
  roomNotice: string | null;
}

/** 방 설정 변경 */
export async function updateRoom(
  roomId: string,
  payload: RoomUpdatePayload,
  image?: File | null
): Promise<{ thumbnail: string | null }> {
  const formData = new FormData();
  formData.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (image) formData.append("image", image);
  const res = await apiClient.patch<{ roomNo: number; roomThumbnail: string | null }>(
    `/api/rooms/${roomId}/settings`,
    formData
  );
  return { thumbnail: res.data.roomThumbnail ?? null };
}

/** 멤버 추방 */
export async function kickMember(roomId: string, targetUuid: string): Promise<{ ok: boolean }> {
  await apiClient.delete(`/api/rooms/${roomId}/participants/${targetUuid}`);
  return { ok: true };
}

/** 공지 등록/수정/삭제 */
export async function saveNotice(roomId: string, notice: string | null): Promise<{ ok: boolean; notice: string | null }> {
  const res = await apiClient.patch<{ notice: string | null }>(`/api/rooms/${roomId}/notice`, { notice });
  return { ok: true, notice: res.data.notice };
}

// ── STOMP / WebSocket ──────────────────────────────────────────────────────
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;
const pendingOnConnect: Array<() => void> = [];

function getClient(): Client {
  if (!stompClient) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        [...pendingOnConnect].forEach((fn) => fn());
        pendingOnConnect.length = 0;
      },
    });
  }
  return stompClient;
}

function whenConnected(fn: () => void): void {
  const c = getClient();
  if (c.connected) {
    fn();
  } else {
    pendingOnConnect.push(fn);
    if (!c.active) c.activate();
  }
}

function formatSentAt(sentAt: string): string {
  const d = new Date(sentAt);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0")).join(":");
}

export interface MemberEvent {
  type: "JOINED" | "LEFT" | "KICKED" | "NOTICE";
  userUuid?: string;
  userName?: string;
  profileImage?: string | null;
  owner?: boolean;
  cameraStatus?: boolean;
  micStatus?: boolean;
  notice?: string | null;
}

/** 채팅 메시지 전송 (WebSocket) */
export async function sendMessage(roomId: string, text: string, userUuid: string): Promise<void> {
  await new Promise<void>((resolve) => {
    whenConnected(() => {
      getClient().publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({ roomNo: parseInt(roomId), userUuid, message: text }),
      });
      resolve();
    });
  });
}

/** 실시간 채팅 구독 (WebSocket) */
export function subscribeChat(
  roomId: string,
  getMyUuid: () => string,
  onMessage: (msg: ChatMessage) => void
): () => void {
  let sub: ReturnType<Client["subscribe"]> | null = null;

  whenConnected(() => {
    sub = getClient().subscribe(`/sub/chat/room/${roomId}`, (frame) => {
      try {
        const data = JSON.parse(frame.body);
        onMessage({
          id: data.chatNo ?? Date.now(),
          name: data.userName ?? "Unknown",
          text: data.message,
          time: data.sentAt ? formatSentAt(data.sentAt) : nowT(),
          mine: data.userUuid === getMyUuid(),
        });
      } catch { /* ignore malformed messages */ }
    });
  });

  return () => {
    sub?.unsubscribe();
    stompClient?.deactivate();
    stompClient = null;
  };
}

/** 멤버 입퇴장 실시간 구독 (WebSocket) */
export function subscribeMembers(
  roomId: string,
  onEvent: (event: MemberEvent) => void
): () => void {
  let sub: ReturnType<Client["subscribe"]> | null = null;

  whenConnected(() => {
    sub = getClient().subscribe(`/sub/room/${roomId}/members`, (frame) => {
      try {
        onEvent(JSON.parse(frame.body));
      } catch { /* ignore malformed */ }
    });
  });

  return () => {
    sub?.unsubscribe();
    stompClient?.deactivate();
    stompClient = null;
  };
}

/** 공부 타이머 보고 (no-op) */
export async function reportTimer(
  _roomId: string,
  _state: "running" | "paused" | "idle",
  _sec: number
): Promise<void> {}

/** 방 나가기 */
export async function leaveRoom(roomId: string, studiedSeconds = 0): Promise<{ ok: boolean }> {
  await apiClient.delete(`/api/rooms/${roomId}/leave`, {
    data: { studiedSeconds },
  });
  return { ok: true };
}

/** 오늘 누적 공부 시간 조회 (초 단위) */
export async function getTodayStudySeconds(): Promise<number> {
  const res = await apiClient.get<{ totalSeconds: number }>("/api/study-logs/today");
  return res.data.totalSeconds;
}

export interface LiveKitToken {
  url: string;
  roomName: string;
  token: string;
}

/** LiveKit 접속 토큰 발급 */
export async function fetchLiveKitToken(roomId: string): Promise<LiveKitToken> {
  const res = await apiClient.get<LiveKitToken>(`/api/rooms/${roomId}/token`);
  return res.data;
}
