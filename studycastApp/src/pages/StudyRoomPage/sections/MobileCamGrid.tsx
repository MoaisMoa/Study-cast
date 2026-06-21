import { useEffect, useRef } from "react";
import { useT } from "@/theme";
import type { RoomMember, TimerState } from "@/types/studyRoom";
import type { LiveKitVideoTrack } from "@/hooks/useLiveKit";
import { fmtT } from "@/data/studyRoom";
import { Av, CamOff, MicOn, MicOff, PlayIc, PauseIc } from "../components/RoomIcons";

export interface MobileCamGridProps {
  members: RoomMember[];
  elapsed: Record<number, number>;
  totalSec: number;
  timerSec: number;
  timerState: TimerState;
  cam: boolean;
  mic: boolean;
  focused: number | null;
  setFocused: React.Dispatch<React.SetStateAction<number | null>>;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  // LiveKit
  videoTracks: Map<string, LiveKitVideoTrack>;
  /** 현재 로그인한 사용자의 UUID — "나" 식별 기준 (화상화면/멤버관리/멤버목록/채팅 공통) */
  myUuid: string;
}

function LiveVideo({ track, mirrored = false }: { track: LiveKitVideoTrack; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => { track.detach(el); };
  }, [track]);
  return (
    <video
      ref={ref} autoPlay muted playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: mirrored ? "scaleX(-1)" : undefined }}
    />
  );
}

/**
 * 모바일 전용 세로 4분할 캠 그리드.
 * 셀을 탭하면 focused(확대) / 나머지는 shrunk(축소).
 */
export function MobileCamGrid(props: MobileCamGridProps) {
  const { members, elapsed, totalSec, timerSec, timerState, cam, mic, focused, setFocused, onTimerToggle, onTimerReset, videoTracks, myUuid } = props;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", minHeight: 0 }}>
      {members.map((m) => {
        const isSelf = m.userUuid === myUuid;
        const camOn = isSelf ? cam : m.cam;
        const micOn = isSelf ? mic : m.mic;
        // LiveKit identity == userUuid이므로 분기 없이 동일하게 조회 가능
        const videoTrack = videoTracks.get(m.userUuid);
        const showVideo = !!videoTrack && camOn;
        const isLive = (isSelf && timerState === "running" && camOn) || (!isSelf && camOn);
        const secVal = isSelf ? totalSec : (elapsed[m.id] || m.sec);
        const isFocused = focused === m.id;
        const isShrunk = focused !== null && !isFocused;
        const flexV = isFocused ? 3.5 : isShrunk ? 0.45 : 1;
        return (
          <div
            key={m.id}
            onClick={() => setFocused((v) => (v === m.id ? null : m.id))}
            style={{
              flex: flexV, minHeight: 0, position: "relative", borderRadius: 12, overflow: "hidden",
              cursor: "pointer", transition: "flex 280ms cubic-bezier(.4,0,.2,1)",
              background: camOn ? `linear-gradient(150deg,${m.color}44,${m.color}aa)` : "#111",
            }}
          >
            {/* 비디오 / 아바타 */}
            {showVideo
              ? <LiveVideo track={videoTrack!} mirrored={isSelf} />
              : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Av name={m.short} color={m.color} size={isFocused ? 72 : isShrunk ? 24 : 60} profileImage={m.profileImage} />
                </div>
              )
            }
            {camOn && !showVideo && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.18 }}>
                <Av name={m.short} color={m.color} size={isFocused ? 90 : isShrunk ? 32 : 56} profileImage={m.profileImage} />
              </div>
            )}
            {/* 그라디언트 */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,.5) 0%,transparent 35%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 45%)", pointerEvents: "none" }} />

            {/* 상단 */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {isLive && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(229,57,53,.9)", borderRadius: 5, padding: "3px 7px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>LIVE</span>
                  </div>
                )}
                {!camOn && !isShrunk && (
                  <div style={{ background: "rgba(0,0,0,.5)", borderRadius: 3, padding: "1px 5px", display: "flex", alignItems: "center", gap: 2 }}>
                    <CamOff s={9} c="rgba(255,255,255,.5)" />
                    <span style={{ color: "rgba(255,255,255,.4)", fontSize: 8 }}>OFF</span>
                  </div>
                )}
              </div>
              {!isShrunk && (micOn ? <MicOn s={11} c="rgba(255,255,255,.7)" /> : <MicOff s={11} c="rgba(255,255,255,.25)" />)}
            </div>

            {/* 하단 */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                {!isShrunk && <Av name={m.short} color={m.color} size={isFocused ? 34 : 30} profileImage={m.profileImage} />}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#fff", fontSize: isFocused ? 12 : isShrunk ? 8 : 10, fontWeight: 600, whiteSpace: "nowrap", lineHeight: 1 }}>{m.name}</span>
                    {m.role === "HOST" && !isShrunk && <span style={{ background: "#E53935", color: "#fff", fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, flexShrink: 0, lineHeight: 1 }}>HOST</span>}
                  </div>
                  {!isShrunk && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: isFocused ? 11 : 9, color: "rgba(255,255,255,.55)", lineHeight: 1 }}>{fmtT(secVal)}</span>}
                </div>
              </div>
              {/* 카메라 ON & 본인 타일이면 항상 고정 노출 (시작/재개/초기화는 헤더에서 관리) */}
              {isSelf && !isShrunk && cam && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: "#1A1A1A", background: "rgba(255,255,255,.92)", padding: "4px 8px", borderRadius: 14, flexShrink: 0 }}>{fmtT(timerSec)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
