import { useEffect, useRef } from "react";
import type { RoomMember, TimerState } from "@/types/studyRoom";
import type { LiveKitVideoTrack } from "@/hooks/useLiveKit";
import { fmtT } from "@/data/studyRoom";
import { Av, CamOff, MicOff, PlayIc, PauseIc } from "../components/RoomIcons";

export interface CamGridProps {
  members: RoomMember[];
  elapsed: Record<number, number>;
  totalSec: number;
  timerSec: number;
  timerState: TimerState;
  cam: boolean;
  camError?: boolean;
  focusedId: number | null;
  setFocusedId: (id: number | null) => void;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerResume: () => void;
  onTimerReset: () => void;
  // LiveKit
  videoTracks: Map<string, LiveKitVideoTrack>;
  selfIdentity: string | null;
  selfProfileImage?: string;
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

interface CamCellProps {
  m: RoomMember;
  avSize?: number;
  showTimer?: boolean;
  isSelf: boolean;
  camOn: boolean;
  camError: boolean;
  videoTrack: LiveKitVideoTrack | undefined;
  timerSec: number;
  timerState: TimerState;
  totalSec: number;
  elapsed: Record<number, number>;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerResume: () => void;
  onTimerReset: () => void;
  profileImage?: string;
}

function CamCell({
  m, avSize = 56, showTimer = false,
  isSelf, camOn, camError, videoTrack,
  timerSec, timerState, totalSec, elapsed,
  onTimerStart, onTimerPause, onTimerResume, onTimerReset,
  profileImage,
}: CamCellProps) {
  const showVideo = !!videoTrack && camOn && (isSelf ? !camError : true);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      background: camOn ? `linear-gradient(135deg,${m.color}22,${m.color}44)` : "#0a0a0a",
      border: `1px solid ${m.color}30`, borderRadius: 8, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
    }}>
      {showVideo
        ? <LiveVideo track={videoTrack!} mirrored={isSelf} />
        : <Av name={m.short} color={m.color} size={avSize} profileImage={isSelf ? profileImage : undefined} />}

      {((isSelf && timerState === "running" && camOn) || (!isSelf && camOn)) && (
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 3, background: "#E53935", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, zIndex: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "blink 1.2s ease-in-out infinite" }} />LIVE
        </div>
      )}
      {!camOn && (
        <div style={{ position: "absolute", top: 8, right: showTimer ? undefined : 8, left: showTimer ? 8 : undefined, background: "rgba(0,0,0,.6)", borderRadius: 5, padding: "3px 7px", display: "flex", alignItems: "center", gap: 3, zIndex: 2 }}>
          <CamOff s={11} c="#fff" /><span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>OFF</span>
        </div>
      )}

      {isSelf && showTimer && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600, color: "#1A1A1A", background: "rgba(255,255,255,.92)", padding: "4px 10px", borderRadius: 6 }}>{fmtT(timerSec)}</span>
          {timerState === "idle" && <button onClick={(e) => { e.stopPropagation(); onTimerStart(); }} style={{ display: "flex", alignItems: "center", gap: 4, background: camOn ? "#2e7d32" : "#9e9e9e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: camOn ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 600 }}><PlayIc s={12} />시작</button>}
          {timerState === "running" && <button onClick={(e) => { e.stopPropagation(); onTimerPause(); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "#E53935", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><PauseIc s={12} />중단</button>}
          {timerState === "paused" && <>
            <button onClick={(e) => { e.stopPropagation(); onTimerResume(); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><PlayIc s={12} />재개</button>
            <button onClick={(e) => { e.stopPropagation(); onTimerReset(); }} style={{ background: "rgba(255,255,255,.92)", color: "#555", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>초기화</button>
          </>}
        </div>
      )}
      {!isSelf && !m.mic && (
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.5)", borderRadius: 3, padding: "3px 4px", display: "flex", zIndex: 2 }}><MicOff s={11} c="#fff" /></div>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 12px 10px", background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Av name={m.short} color={m.color} size={24} profileImage={isSelf ? profileImage : undefined} />
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{m.name}</span>
          {m.role === "HOST" && <span style={{ background: "rgba(255,255,255,.22)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>HOST</span>}
        </div>
        <span style={{ color: "#fff", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", opacity: .85 }}>{fmtT(isSelf ? totalSec : (elapsed[m.id] || m.sec))}</span>
      </div>
    </div>
  );
}

export function CamGrid(props: CamGridProps) {
  const {
    members, elapsed, totalSec, timerSec, timerState, cam, camError = false,
    focusedId, setFocusedId, onTimerStart, onTimerPause, onTimerResume, onTimerReset,
    videoTracks, selfIdentity, selfProfileImage,
  } = props;

  const all = members.slice(0, 4);
  const count = all.length;

  function cellProps(m: RoomMember): Omit<CamCellProps, "m" | "avSize" | "showTimer"> {
    const isSelf = selfIdentity ? m.userUuid === selfIdentity : m.name === "나";
    return {
      isSelf,
      camOn: isSelf ? cam : m.cam,
      camError,
      videoTrack: videoTracks.get(isSelf ? (selfIdentity ?? "") : m.userUuid),
      timerSec, timerState, totalSec, elapsed,
      onTimerStart, onTimerPause, onTimerResume, onTimerReset,
      profileImage: selfProfileImage,
    };
  }

  // 포커스 모드
  if (focusedId) {
    const main = all.find((m) => m.id === focusedId) || all[0];
    const thumbs = all.filter((m) => m.id !== main.id);
    const mainIsSelf = selfIdentity ? main.userUuid === selfIdentity : main.name === "나";
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: 8, gap: 6 }}>
        <div style={{ flex: 1, minHeight: 0 }} onClick={() => setFocusedId(null)}>
          <CamCell m={main} avSize={90} showTimer={mainIsSelf} {...cellProps(main)} />
        </div>
        {thumbs.length > 0 && (
          <div style={{ flexShrink: 0, display: "flex", gap: 6, height: 110 }}>
            {thumbs.map((m) => (
              <div key={m.userUuid} style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setFocusedId(m.id)}>
                <CamCell m={m} avSize={36} {...cellProps(m)} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 기본 그리드
  const cols = count === 1 ? 1 : 2;
  const rows = count <= 2 ? 1 : 2;
  return (
    <div style={{ flex: 1, display: "grid", gap: 8, padding: 8, gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)`, minHeight: 0 }}>
      {all.map((m, idx) => {
        const isLast = idx === all.length - 1;
        const isSelf = selfIdentity ? m.userUuid === selfIdentity : m.name === "나";
        return (
          <div key={m.userUuid} style={{ gridColumn: count === 3 && isLast ? "1 / span 2" : undefined, minHeight: 0, height: "100%" }} onClick={() => setFocusedId(m.id)}>
            <CamCell m={m} avSize={count === 1 ? 90 : count === 2 ? 70 : 56} showTimer={isSelf} {...cellProps(m)} />
          </div>
        );
      })}
    </div>
  );
}
