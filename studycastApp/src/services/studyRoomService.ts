import type { ChatMessage, RoomMember } from "@/types/studyRoom";
import { API_BASE_URL, apiClient, getAccessToken } from "./apiClient";
import { prefixRoomImageUrl } from "@/utils/roomImage";

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
  userEmail: string;
  profileImage: string | null;
  owner: boolean;
  cameraStatus: boolean;
  micStatus: boolean;
  joinedAt: string;
  todayStudySeconds: number;
}

export const MEMBER_COLORS = ["#E53935", "#2DA58E", "#C07A3A", "#1976D2", "#7B1FA2", "#388E3C", "#D32F2F"];

function nowT(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, "0")).join(":");
}

function toRoomMember(p: ParticipantResponse, index: number, isMe: boolean): RoomMember {
  const joinedAtMs = p.joinedAt ? new Date(p.joinedAt).getTime() : Date.now();
  return {
    id: index + 1,
    userUuid: p.userUuid,
    // 본인 화면에서는 "나", 다른 사람 화면에서는 실명으로 보임 (각자의 클라이언트에서 본인 기준으로 판별)
    name: isMe ? "나" : p.userName,
    // 아바타 fallback 이니셜은 본인 여부와 무관하게 실명 기준 (사진 없을 때 "나"가 아닌 실제 이름 첫 글자가 보여야 함)
    short: p.userName.slice(0, 2),
    // 개인정보 보호 — 본인 이메일만 노출, 다른 멤버에게는 보여주지 않음
    email: isMe ? p.userEmail : "",
    role: p.owner ? "HOST" : "MEMBER",
    color: isMe ? MEMBER_COLORS[0] : MEMBER_COLORS[(index % (MEMBER_COLORS.length - 1)) + 1],
    sec: p.todayStudySeconds ?? 0,
    joinedAtMs,
    mic: p.micStatus,
    cam: p.cameraStatus,
    // 본인 여부와 무관하게 실제 등록된 프로필 사진이 있으면 보여줌
    profileImage: p.profileImage ?? undefined,
  };
}

/** 방 입장 + 초기 스냅샷 조회 */
export async function fetchRoom(roomId: string, myUuid: string, joinCode?: string): Promise<RoomSnapshot> {
  // 입장 처리 (이미 active 상태면 백엔드가 중복 처리, 비공개방은 joinCode 필요)
  await apiClient.post(`/api/rooms/${roomId}/join`, joinCode ? { joinCode } : undefined);

  const [detailRes, participantsRes] = await Promise.all([
    apiClient.get<RoomDetailResponse>(`/api/rooms/${roomId}`),
    apiClient.get<ParticipantResponse[]>(`/api/rooms/${roomId}/participants`),
  ]);

  const detail = detailRes.data;

  // 나를 항상 index 0(id=1)으로 정렬 — UUID 기준이라 동명이인이어도 안전
  const sorted = [...participantsRes.data].sort((a, b) => {
    if (a.userUuid === myUuid) return -1;
    if (b.userUuid === myUuid) return 1;
    return 0;
  });
  const members = sorted.map((p, i) => toRoomMember(p, i, p.userUuid === myUuid));

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
    thumbnail: prefixRoomImageUrl(detail.roomThumbnail),
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
    formData,
    { timeout: 30000 } // 이미지 업로드는 일반 요청보다 오래 걸릴 수 있어 타임아웃을 길게 지정
  );
  return { thumbnail: prefixRoomImageUrl(res.data.roomThumbnail) };
}

/** 멤버 추방 */
export async function kickMember(roomId: string, targetUuid: string): Promise<{ ok: boolean }> {
  await apiClient.delete(`/api/rooms/${roomId}/participants/${targetUuid}`);
  return { ok: true };
}

/** 멤버 이메일 초대 (방장 전용) */
export async function inviteByEmail(roomId: string, toEmail: string): Promise<void> {
  await apiClient.post(`/api/rooms/${roomId}/invite`, { toEmail });
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
let subscriptionCount = 0;

function getClient(): Client {
  if (!stompClient) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      // 매 연결(최초 연결 + 재연결) 시도 직전에 매번 최신 Access Token으로 갱신
      // (연결 시점에 토큰이 없거나, 그 사이 재발급됐을 수 있어 고정 헤더로 두면 안 됨)
      beforeConnect: () => {
        const token = getAccessToken();
        stompClient!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
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

function disconnectIfIdle(): void {
  if (subscriptionCount === 0) {
    pendingOnConnect.length = 0;
    stompClient?.deactivate();
    stompClient = null;
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
  let active = true;
  subscriptionCount++;

  whenConnected(() => {
    if (!active) return;
    sub = getClient().subscribe(`/sub/chat/room/${roomId}`, (frame) => {
      try {
        const data = JSON.parse(frame.body);
        onMessage({
          id: data.chatNo ?? Date.now(),
          name: data.userName ?? "Unknown",
          text: data.message,
          time: data.sentAt ? formatSentAt(data.sentAt) : nowT(),
          mine: data.userUuid === getMyUuid(),
          userUuid: data.userUuid,
          profileImage: data.userProfileImage ?? undefined,
        });
      } catch { /* ignore malformed messages */ }
    });
  });

  return () => {
    active = false;
    sub?.unsubscribe();
    sub = null;
    subscriptionCount--;
    disconnectIfIdle();
  };
}

/** 멤버 입퇴장 실시간 구독 (WebSocket) */
export function subscribeMembers(
  roomId: string,
  onEvent: (event: MemberEvent) => void
): () => void {
  let sub: ReturnType<Client["subscribe"]> | null = null;
  let active = true;
  subscriptionCount++;

  whenConnected(() => {
    if (!active) return;
    sub = getClient().subscribe(`/sub/room/${roomId}/members`, (frame) => {
      try {
        onEvent(JSON.parse(frame.body));
      } catch { /* ignore malformed */ }
    });
  });

  return () => {
    active = false;
    sub?.unsubscribe();
    sub = null;
    subscriptionCount--;
    disconnectIfIdle();
  };
}

/** 누적 공부 타이머 1초 틱 — 같은 방 멤버 전체에게 실시간 브로드캐스트 (서버 저장 없음) */
export async function reportTimerTick(roomId: string, userUuid: string, totalSeconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    whenConnected(() => {
      getClient().publish({
        destination: "/pub/timer/update",
        body: JSON.stringify({ roomNo: parseInt(roomId), userUuid, totalSeconds }),
      });
      resolve();
    });
  });
}

export interface TimerUpdateEvent {
  userUuid: string;
  totalSeconds: number;
}

/** 멤버별 누적 공부 타이머 실시간 구독 (WebSocket) */
export function subscribeTimerUpdates(
  roomId: string,
  onUpdate: (event: TimerUpdateEvent) => void
): () => void {
  let sub: ReturnType<Client["subscribe"]> | null = null;
  let active = true;
  subscriptionCount++;

  whenConnected(() => {
    if (!active) return;
    sub = getClient().subscribe(`/sub/room/${roomId}/timer`, (frame) => {
      try {
        onUpdate(JSON.parse(frame.body));
      } catch { /* ignore malformed */ }
    });
  });

  return () => {
    active = false;
    sub?.unsubscribe();
    sub = null;
    subscriptionCount--;
    disconnectIfIdle();
  };
}

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

/** 방에 머무는 동안 누적 공부 시간 중간 저장 (방 퇴장 전 주기적 호출) — roomId를 같이 보내면 그 방의 누적 시간도 같이 저장됨 */
export async function accumulateStudySeconds(studySeconds: number, roomId?: string): Promise<void> {
  if (studySeconds <= 0) return;
  await apiClient.post("/api/study-logs/accumulate", { studySeconds, roomNo: roomId ? Number(roomId) : undefined });
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
