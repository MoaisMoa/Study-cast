const BC_NAME = 'studycast-room';
const PENDING_KEY = 'sc_pending_room';

let bc: BroadcastChannel | null = null;

/** StudyRoomPage 마운트 시 호출 — 다른 탭의 입장 체크/강제 퇴장 요청에 응답 */
export function registerSession(roomId: string, onForceLeave: () => void): void {
  localStorage.removeItem(PENDING_KEY);
  bc?.close();
  bc = new BroadcastChannel(BC_NAME);
  bc.onmessage = ({ data }) => {
    if (data?.type === 'PING') bc!.postMessage({ type: 'PONG', roomId });
    if (data?.type === 'FORCE_LEAVE') onForceLeave();
  };
}

/** 퇴장 시 호출 — 채널 해제 */
export function unregisterSession(): void {
  localStorage.removeItem(PENDING_KEY);
  bc?.close();
  bc = null;
}

/** 다른 탭에서 진행 중인 방이 있으면 그 방 번호 반환, 없으면 null (최대 200ms 대기) */
export async function getActiveRoomId(): Promise<string | null> {
  return new Promise((resolve) => {
    const ch = new BroadcastChannel(BC_NAME);
    let done = false;

    ch.onmessage = ({ data }) => {
      if (data?.type === 'PONG' && !done) {
        done = true;
        ch.close();
        resolve(data.roomId ?? null);
      }
    };

    ch.postMessage({ type: 'PING' });

    setTimeout(() => {
      if (!done) { done = true; ch.close(); resolve(null); }
    }, 200);
  });
}

/** 입장 시도 전 호출 — 이미 열린 방이 있으면 false 반환 */
export async function canEnterRoom(): Promise<boolean> {
  if (localStorage.getItem(PENDING_KEY)) return false;
  return (await getActiveRoomId()) === null;
}

/** window.open 직전 호출 — 탭 로딩 중 중복 입장 방지 */
export function setPendingEntry(roomId: string): void {
  localStorage.setItem(PENDING_KEY, roomId);
}

/** 로그아웃 등으로 활성 스터디룸을 강제 퇴장시킴 — 해당 탭의 registerSession이 onForceLeave를 실행 */
export function forceLeaveActiveRoom(): void {
  const ch = new BroadcastChannel(BC_NAME);
  ch.postMessage({ type: 'FORCE_LEAVE' });
  ch.close();
}
