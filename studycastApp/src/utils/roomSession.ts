const BC_NAME = 'studycast-room';
const PENDING_KEY = 'sc_pending_room';

let bc: BroadcastChannel | null = null;

/** StudyRoomPage 마운트 시 호출 — 다른 탭의 입장 체크 요청에 응답 */
export function registerSession(roomId: string): void {
  localStorage.removeItem(PENDING_KEY);
  bc?.close();
  bc = new BroadcastChannel(BC_NAME);
  bc.onmessage = ({ data }) => {
    if (data?.type === 'PING') bc!.postMessage({ type: 'PONG' });
  };
}

/** 퇴장 시 호출 — 채널 해제 */
export function unregisterSession(): void {
  localStorage.removeItem(PENDING_KEY);
  bc?.close();
  bc = null;
}

/** 입장 시도 전 호출 — 이미 열린 방이 있으면 false 반환 (최대 200ms 대기) */
export async function canEnterRoom(): Promise<boolean> {
  if (localStorage.getItem(PENDING_KEY)) return false;

  return new Promise((resolve) => {
    const ch = new BroadcastChannel(BC_NAME);
    let done = false;

    ch.onmessage = ({ data }) => {
      if (data?.type === 'PONG' && !done) {
        done = true;
        ch.close();
        resolve(false);
      }
    };

    ch.postMessage({ type: 'PING' });

    setTimeout(() => {
      if (!done) { done = true; ch.close(); resolve(true); }
    }, 200);
  });
}

/** window.open 직전 호출 — 탭 로딩 중 중복 입장 방지 */
export function setPendingEntry(roomId: string): void {
  localStorage.setItem(PENDING_KEY, roomId);
}
