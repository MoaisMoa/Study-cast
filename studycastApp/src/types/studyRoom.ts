export type StudyRole = "HOST" | "MEMBER";
export type TimerState = "idle" | "running" | "paused";
export type DeviceError = null | "denied" | "unavailable";

export interface RoomMember {
  id: number;
  userUuid: string;
  name: string;
  short: string;
  email: string;
  role?: StudyRole;
  color: string;
  sec: number;          // 누적 공부 시간(초)
  joinedAtMs: number;   // 방 입장 시각(epoch ms) — 참석 시간은 이 값 기준으로 매번 계산
  mic: boolean;
  cam: boolean;
  profileImage?: string;
  /** 지금 이 순간 공부 타이머를 실행 중인지(시작 버튼을 눌렀는지) — 실시간 브로드캐스트로만 갱신, 본인은 로컬 timerState를 직접 사용 */
  studying?: boolean;
}

export interface ChatMessage {
  id: number;
  type?: "system";
  name?: string;
  text: string;
  time: string;
  mine?: boolean;
  color?: string;
  isHost?: boolean;
  userUuid?: string;
  profileImage?: string;
}

/** 좌측 네비 모달 종류 */
export type RoomModal = null | "members" | "cal" | "notice" | "settings";

/** 모바일 하단 탭 */
export type RoomMobileTab = "cam" | "chat" | "members";
