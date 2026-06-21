/** 로그인/로그아웃 발생을 다른 탭에 알리기 위한 브로드캐스트 채널 */
const BC_NAME = "studycast-auth";

/** 로그인 또는 로그아웃 직후 호출 — 다른 탭에 인증 상태 재확인을 요청 */
export function broadcastAuthChange(): void {
  const ch = new BroadcastChannel(BC_NAME);
  ch.postMessage({ type: "AUTH_CHANGED" });
  ch.close();
}

/** 다른 탭에서 로그인/로그아웃이 발생하면 콜백 실행 — 반환값은 구독 해제 함수 */
export function subscribeAuthChange(onChange: () => void): () => void {
  const ch = new BroadcastChannel(BC_NAME);
  ch.onmessage = ({ data }) => {
    if (data?.type === "AUTH_CHANGED") onChange();
  };
  return () => ch.close();
}
