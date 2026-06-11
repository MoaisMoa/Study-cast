import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, RoomMember } from "@/types/studyRoom";
import {
  fetchRoom, sendMessage as svcSendMessage, subscribeChat,
  saveNotice as svcSaveNotice, kickMember as svcKickMember,
  updateRoom as svcUpdateRoom, leaveRoom as svcLeaveRoom,
} from "@/services/studyRoomService";

export interface UseStudyRoomResult {
  loading: boolean;
  title: string;
  setTitle: (v: string) => void;
  maxMembers: number;
  setMaxMembers: (v: number) => void;
  isHost: boolean;
  members: RoomMember[];
  setMembers: React.Dispatch<React.SetStateAction<RoomMember[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  notice: string | null;
  setNotice: (v: string | null) => void;
  /** 채팅 전송 (서비스 경유 → 낙관적 추가) */
  sendMessage: (text: string) => Promise<void>;
  /** 멤버 추방 */
  kickMember: (memberId: number) => Promise<void>;
  /** 공지 저장/삭제 */
  saveNotice: (msg: string | null) => Promise<void>;
  /** 방 설정 변경 */
  updateRoom: (patch: { title?: string; maxMembers?: number }) => Promise<void>;
  /** 방 나가기 */
  leaveRoom: () => Promise<void>;
}

/**
 * 스터디룸 데이터 연동 훅 — 컴포넌트는 더미를 직접 import 하지 않고 이 훅만 사용한다.
 * API/WebSocket 연동 시 studyRoomService.ts 의 함수 본문만 교체하면 된다.
 */
export function useStudyRoom(roomId: string): UseStudyRoomResult {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(true);

  // 초기 스냅샷 로드
  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchRoom(roomId).then((snap) => {
      if (!mounted.current) return;
      setTitle(snap.title);
      setMaxMembers(snap.maxMembers);
      setIsHost(snap.isHost);
      setMembers(snap.members);
      setMessages(snap.messages);
      setNotice(snap.notice);
      setLoading(false);
    });
    return () => { mounted.current = false; };
  }, [roomId]);

  // 실시간 채팅 구독 (mock — WebSocket 연동 시 자동 동작)
  useEffect(() => {
    const unsub = subscribeChat(roomId, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return unsub;
  }, [roomId]);

  const sendMessage = useCallback(async (text: string) => {
    const msg = await svcSendMessage(roomId, text);
    setMessages((prev) => [...prev, msg]);
  }, [roomId]);

  const kickMember = useCallback(async (memberId: number) => {
    await svcKickMember(roomId, memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, [roomId]);

  const saveNotice = useCallback(async (msg: string | null) => {
    const res = await svcSaveNotice(roomId, msg);
    setNotice(res.notice);
  }, [roomId]);

  const updateRoom = useCallback(async (patch: { title?: string; maxMembers?: number }) => {
    await svcUpdateRoom(roomId, patch);
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.maxMembers !== undefined) setMaxMembers(patch.maxMembers);
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    await svcLeaveRoom(roomId);
  }, [roomId]);

  return {
    loading, title, setTitle, maxMembers, setMaxMembers, isHost,
    members, setMembers, messages, setMessages, notice, setNotice,
    sendMessage, kickMember, saveNotice, updateRoom, leaveRoom,
  };
}
