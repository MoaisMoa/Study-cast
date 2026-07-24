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

interface CamCellProps {
  m: RoomMember;
  avSize?: number;
  showTimer?: boolean;
  isFocused?: boolean;
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
}

function CamCell({
  m, avSize = 56, showTimer = false, isFocused = false,
  isSelf, camOn, camError, videoTrack,
  timerSec, timerState, totalSec, elapsed,
  onTimerStart, onTimerPause, onTimerResume, onTimerReset,
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
        : <Av name={m.short} color={m.color} size={avSize} profileImage={m.profileImage} />}

      {isFocused && !showVideo && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.18 }}>
          <Av name={m.short} color={m.color} size={90} profileImage={m.profileImage} />
        </div>
      )}

      {((isSelf && timerState === "running" && camOn) || (!isSelf && m.studying && camOn)) && (
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
          <Av name={m.short} color={m.color} size={30} profileImage={m.profileImage} />
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
    videoTracks, myUuid,
  } = props;

  const all = members.slice(0, 4);
  const count = all.length;

  function cellProps(m: RoomMember): Omit<CamCellProps, "m" | "avSize" | "showTimer"> {
    const isSelf = m.userUuid === myUuid;
    return {
      isSelf,
      camOn: isSelf ? cam : m.cam,
      camError,
      // LiveKit identity == userUuid이므로 분기 없이 동일하게 조회 가능
      videoTrack: videoTracks.get(m.userUuid),
      timerSec, timerState, totalSec, elapsed,
      onTimerStart, onTimerPause, onTimerResume, onTimerReset,
    };
  }

  // 모든 멤버를 같은 DOM에 유지한 채 위치/크기만 바꿔서 부드럽게 확대/축소되도록 함
  // (이전엔 포커스 모드/기본 그리드가 서로 다른 return 분기라 DOM이 통째로 교체돼 애니메이션이 불가능했음)
  const GAP = 8;
  const thumbs = focusedId ? all.filter((m) => m.id !== focusedId) : [];

  function getRect(m: RoomMember, idx: number): { top: string; left: string; width: string; height: string } {
    if (focusedId) {
      if (m.id === focusedId) {
        const reserved = thumbs.length > 0 ? 110 + GAP : 0;
        return { top: "0%", left: "0%", width: "100%", height: `calc(100% - ${reserved}px)` };
      }
      const thumbIdx = thumbs.findIndex((t) => t.id === m.id);
      const thumbCount = thumbs.length;
      const w = `calc((100% - ${GAP * (thumbCount - 1)}px) / ${thumbCount})`;
      return {
        top: `calc(100% - 110px)`,
        left: `calc(${thumbIdx} * (${w} + ${GAP}px))`,
        width: w,
        height: "110px",
      };
    }

    // 기본 그리드 (count별 배치, count===3은 마지막 칸이 2칸 차지)
    const halfW = `calc(50% - ${GAP / 2}px)`;
    const halfH = `calc(50% - ${GAP / 2}px)`;
    const rightX = `calc(50% + ${GAP / 2}px)`;
    const bottomY = `calc(50% + ${GAP / 2}px)`;
    if (count === 1) return { top: "0%", left: "0%", width: "100%", height: "100%" };
    if (count === 2) return { top: "0%", left: idx === 0 ? "0%" : rightX, width: halfW, height: "100%" };
    if (count === 3 && idx === 2) return { top: bottomY, left: "0%", width: "100%", height: halfH };
    return {
      top: idx < 2 ? "0%" : bottomY,
      left: idx % 2 === 0 ? "0%" : rightX,
      width: halfW,
      height: halfH,
    };
  }

  return (
    <div style={{ flex: 1, position: "relative", padding: 8, minHeight: 0 }}>
      {all.map((m, idx) => {
        const isSelf = m.userUuid === myUuid;
        const isFocused = m.id === focusedId;
        const isThumb = focusedId !== null && !isFocused;
        const avSize = focusedId ? (isFocused ? 72 : 36) : 60;
        return (
          <div
            key={m.userUuid}
            onClick={() => setFocusedId(isFocused ? null : m.id)}
            style={{
              position: "absolute",
              ...getRect(m, idx),
              cursor: "pointer",
              transition: "top 280ms cubic-bezier(.4,0,.2,1), left 280ms cubic-bezier(.4,0,.2,1), width 280ms cubic-bezier(.4,0,.2,1), height 280ms cubic-bezier(.4,0,.2,1)",
            }}
          >
            <CamCell m={m} avSize={avSize} showTimer={isSelf && !isThumb} isFocused={isFocused} {...cellProps(m)} />
          </div>
        );
      })}
    </div>
  );
}
