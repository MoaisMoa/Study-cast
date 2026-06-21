import { useEffect, useRef } from "react";
import type { ChatMessage, RoomMember, TimerState } from "@/types/studyRoom";
import { useT } from "@/theme";
import { fmtT } from "@/data/studyRoom";
import { Av, SendIc, MicOn, MicOff, CamOn, CamOff } from "../components/RoomIcons";

const GREEN = "#4caf50";

/* ── 모바일 채팅 드로어 콘텐츠 (탭/참여인원 헤더 없이 메시지 + 입력창만) ── */
export function MobileChatDrawer({
  msgs, inp, setInp, send,
}: {
  msgs: ChatMessage[]; inp: string; setInp: (v: string) => void; send: () => void;
}) {
  const theme = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs]);
  return (
    <>
      <div ref={ref} style={{ flex: 1, overflowY: "auto", padding: "8px 14px", display: "flex", flexDirection: "column", gap: 7, minHeight: 0 }}>
        {msgs.map((msg) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
                <span style={{ fontSize: 10, color: theme.text3, whiteSpace: "nowrap" }}>{msg.text}</span>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: msg.mine ? "row-reverse" : "row", alignItems: "flex-start", gap: 6 }}>
              {!msg.mine && <div style={{ flexShrink: 0, marginTop: 2 }}><Av name={msg.name ?? ""} color={msg.color ?? "#888"} size={26} profileImage={msg.profileImage} /></div>}
              <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", gap: 2 }}>
                {!msg.mine && <span style={{ fontSize: 10, color: theme.text3, paddingLeft: 2 }}>{msg.name}</span>}
                <div style={{ background: msg.mine ? theme.red : theme.surface2, color: msg.mine ? "#fff" : theme.text, borderRadius: msg.mine ? "14px 14px 2px 14px" : "2px 14px 14px 14px", padding: "8px 12px", fontSize: 13, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.text}</div>
                <span style={{ fontSize: 9, color: theme.text3, paddingLeft: 2 }}>{msg.time?.slice(0, 5)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {inp.length > 0 && <div style={{ padding: "3px 14px 0", textAlign: "right", fontSize: 10, color: inp.length >= 50 ? theme.red : theme.text3 }}>{inp.length}/50</div>}
        <div style={{ display: "flex", gap: 8, padding: "8px 14px 16px", alignItems: "flex-end" }}>
          <textarea value={inp}
            onChange={(e) => { if (e.target.value.length > 50) return; setInp(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder="메시지 입력..." rows={1}
            style={{ flex: 1, background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 18, padding: "8px 14px", fontSize: 13, color: theme.text, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "20px", height: 36, overflowY: "hidden", boxSizing: "border-box" }} />
          <button onClick={send} style={{ width: 40, height: 40, borderRadius: "50%", background: theme.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SendIc s={16} c="#fff" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 모바일 멤버 드로어 콘텐츠 (큰 카드 리스트) ── */
export function MobileMemberDrawer({
  members, elapsed, totalSec, timerState, mic, cam, myUuid,
}: {
  members: RoomMember[]; elapsed: Record<number, number>; totalSec: number;
  timerState: TimerState; mic: boolean; cam: boolean;
  /** 현재 로그인한 사용자의 UUID — "나" 식별 기준 (화상화면/멤버관리/멤버목록/채팅 공통) */
  myUuid: string;
}) {
  const T = useT();
  return (
    <div style={{ overflowY: "auto", padding: "0 14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {members.map((m) => {
        const isSelf = m.userUuid === myUuid;
        const camOn = isSelf ? cam : m.cam;
        const micOn = isSelf ? mic : m.mic;
        const isActive = isSelf ? timerState === "running" : camOn;
        return (
          <div key={m.userUuid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Av name={m.short} color={m.color} size={42} profileImage={m.profileImage} />
              <span style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: isActive ? GREEN : T.text3, border: `2px solid ${T.surface}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                {m.role === "HOST" && <span style={{ background: T.redLight, color: T.red, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>HOST</span>}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.red }}>{fmtT(isSelf ? totalSec : (elapsed[m.id] || m.sec))}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {micOn ? <MicOn s={14} c={T.text2} /> : <MicOff s={14} c={T.text3} />}
              {camOn ? <CamOn s={14} c={T.text2} /> : <CamOff s={14} c={T.text3} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
