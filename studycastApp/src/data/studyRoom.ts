import type { ChatMessage, RoomMember } from "@/types/studyRoom";

/** 본인(방장) */
export const SELF: RoomMember = {
  id: 1, userUuid: "", name: "나", short: "나", email: "me@study.kr",
  role: "HOST", color: "#E53935", sec: 8073, joinedAtMs: Date.now() - 180 * 60_000, mic: true, cam: true,
};

/** 다른 멤버 */
export const OTHERS_INIT: RoomMember[] = [
  { id: 2, userUuid: "", name: "이준혁", short: "이준", email: "leejh@study.kr", color: "#2DA58E", sec: 6312, joinedAtMs: Date.now() - 105 * 60_000, mic: false, cam: true },
  { id: 3, userUuid: "", name: "박서연", short: "박서", email: "parksy@study.kr", color: "#C07A3A", sec: 3527, joinedAtMs: Date.now() - 58 * 60_000,  mic: true,  cam: true },
  { id: 4, userUuid: "", name: "한수빈", short: "한수", email: "hansb@study.kr", color: "#D32F2F", sec: 4925, joinedAtMs: Date.now() - 82 * 60_000,  mic: true,  cam: false },
];

export const ALL_INIT: RoomMember[] = [SELF, ...OTHERS_INIT];

/** 입장 시점 초기 채팅 (mock — WebSocket 연결 전) */
export const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 0, type: "system", text: "스터디룸에 입장했습니다.", time: "13:55:00" },
  { id: 1, name: "이준", text: "오늘도 집중 고고!", time: "13:55:12", mine: false, color: "#2DA58E" },
  { id: 2, name: "박서", text: "모두 화이팅 💪", time: "13:56:30", mine: false, color: "#C07A3A" },
  { id: 3, name: "나", text: "오늘 목표 알고리즘 3문제!", time: "13:57:05", mine: true, isHost: true },
  { id: 4, name: "한수", text: "저는 영단어 100개요", time: "13:58:44", mine: false, color: "#D32F2F" },
  { id: 5, name: "박서", text: "다들 화이팅!", time: "14:00:01", mine: false, color: "#C07A3A" },
  { id: 6, name: "이준", text: "알고리즘 3번 문제 힌트 있어요?", time: "14:02:18", mine: false, color: "#2DA58E" },
  { id: 7, name: "나", text: "이분탐색 써보세요 ㅎㅎ", time: "14:03:45", mine: true, isHost: true },
  { id: 8, name: "이준", text: "오 감사합니다!!", time: "14:04:02", mine: false, color: "#2DA58E" },
];

export const ROOM_TITLE_DEFAULT = "CS 코딩테스트";
export const ROOM_MAX_MEMBERS = 4;

/** 시:분:초 */
export const fmtT = (s: number): string => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  return [h, m, sc].map((v) => String(v).padStart(2, "0")).join(":");
};
/** 짧은 누적 (Xh Ym) */
export const fmtS = (s: number): string => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
/** HH h MM m (제로패딩) */
export const secToHM = (s: number): string => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
};
export const nowT = (): string => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, "0")).join(":");
};
export const nowDate = (): string => {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} (${days[d.getDay()]})`;
};
