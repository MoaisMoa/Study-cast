/**
 * 화상(WebRTC/SFU) 연동 골격 — 현재는 mock(no-op).
 *
 * 추천: LiveKit (오픈소스, 자체 호스팅 시 무료 / 클라우드 무료 한도).
 * 실연결 시 아래 순서로 교체한다 (UI/컴포넌트는 그대로 둠):
 *
 *   1) npm i livekit-client
 *   2) connectMedia(): 서버에서 토큰 발급 → new Room().connect(WS_URL, token)
 *   3) onRemoteTrack(memberId, mediaStream): CamGrid 타일의 <video>.srcObject 로 주입
 *   4) setCamEnabled / setMicEnabled: room.localParticipant.setCameraEnabled(...) 등
 *
 * 본인 카메라 미리보기는 CamGrid 의 getUserMedia 가 이미 처리하므로 그대로 둔다.
 */

export interface MediaConnection {
  /** 연결 해제 */
  disconnect: () => void;
  /** 본인 카메라 on/off */
  setCamEnabled: (on: boolean) => Promise<void>;
  /** 본인 마이크 on/off */
  setMicEnabled: (on: boolean) => Promise<void>;
}

export interface ConnectMediaOptions {
  roomId: string;
  /** 멤버 id ↔ 원격 영상 스트림 도착 시 호출 (CamGrid 타일에 주입) */
  onRemoteTrack?: (memberId: number, stream: MediaStream | null) => void;
}

/**
 * 미디어 룸 접속 — 현재는 mock(연결 안 함, no-op 핸들 반환).
 * 실연결 시 LiveKit Room 으로 교체.
 */
export async function connectMedia(_opts: ConnectMediaOptions): Promise<MediaConnection> {
  // TODO(LiveKit): 토큰 발급 후 실제 연결
  //   const room = new Room();
  //   const token = await fetch(`/rtc/token?room=${_opts.roomId}`).then(r => r.text());
  //   await room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
  //   room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
  //     const memberId = Number(participant.identity);
  //     _opts.onRemoteTrack?.(memberId, new MediaStream([track.mediaStreamTrack]));
  //   });
  //   return {
  //     disconnect: () => room.disconnect(),
  //     setCamEnabled: (on) => room.localParticipant.setCameraEnabled(on),
  //     setMicEnabled: (on) => room.localParticipant.setMicrophoneEnabled(on),
  //   };

  return {
    disconnect: () => {},
    setCamEnabled: async () => {},
    setMicEnabled: async () => {},
  };
}

/** 미디어 서버 토큰 발급 (REST) — mock */
export async function fetchMediaToken(_roomId: string): Promise<string> {
  // TODO(API 연결): return request(`/rtc/token?room=${_roomId}`);
  return "";
}
