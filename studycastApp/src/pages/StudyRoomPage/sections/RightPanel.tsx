import { useRef } from "react";
import type { ChatMessage, RoomMember, TimerState } from "@/types/studyRoom";
import { useT } from "@/theme";
import { fmtT } from "@/data/studyRoom";
import { Av, SendIc, MicOn, MicOff, CamOn, CamOff, XIc } from "../components/RoomIcons";

export interface RightPanelProps {
  chatTab: "채팅" | "멤버";
  setChatTab: (t: "채팅" | "멤버") => void;
  msgs: ChatMessage[];
  inp: string;
  setInp: (v: string) => void;
  send: () => void;
  isSending: boolean;
  sendError: string | null;
  setSendError: (v: string | null) => void;
  members: RoomMember[];
  elapsed: Record<number, number>;
  totalSec: number;
  timerState: TimerState;
  noticeMsg: string | null;
  /** 현재 로그인한 사용자의 UUID — "나" 식별 기준 (화상화면/멤버관리/멤버목록/채팅 공통) */
  myUuid: string;
  /** 본인 마이크/카메라 상태 (멤버 목록 자기 행 아이콘) */
  mic?: boolean;
  cam?: boolean;
  /** 최대 수용 인원 (채팅 상단 표기) */
  maxMembers?: number;
  /** 공지 배너 닫기 */
  setNoticeMsg?: (v: string | null) => void;
}

const GREEN = "#4caf50";

export function RightPanel(props: RightPanelProps) {
  const {
    chatTab, setChatTab, msgs, inp, setInp, send, isSending, sendError, setSendError,
    members, elapsed, totalSec, timerState, noticeMsg, myUuid,
    mic = true, cam = true, maxMembers = 4, setNoticeMsg,
  } = props;
  const T = useT();
  const chatRef = useRef<HTMLDivElement>(null);
  const c2 = T.text2;
  const c3 = T.text3;
  const greenBg = T.dark ? "rgba(76,175,80,.16)" : "#E8F5E9";
  const hostUuid = members.find((m) => m.role === "HOST")?.userUuid;

  return (
    <>
      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {(["채팅", "멤버"] as const).map((t) => (
          <button key={t} onClick={() => setChatTab(t)}
            style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: chatTab === t ? 700 : 500, color: chatTab === t ? T.text : c3, background: "none", border: "none", borderBottom: `2px solid ${chatTab === t ? T.red : "transparent"}`, cursor: "pointer", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {chatTab === "채팅" && (
        <>
          {/* 참여 인원 — 채팅 상단 고정 */}
          <div style={{ flexShrink: 0, padding: "6px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: c2 }}>참여 인원</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>{members.length}</span>
              <span style={{ fontSize: 12, color: c3 }}>/ {maxMembers}명</span>
            </div>
          </div>

          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ fontSize: 10, color: c3, flexShrink: 0, whiteSpace: "nowrap" }}>{msg.text}</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>
                );
              }
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: msg.mine ? "row-reverse" : "row", alignItems: "flex-start", gap: 6 }}>
                  {!msg.mine && <div style={{ flexShrink: 0, marginTop: 2 }}><Av name={msg.name ?? ""} color={msg.color ?? "#9E9E9E"} size={26} profileImage={msg.profileImage} /></div>}
                  <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", alignItems: msg.mine ? "flex-end" : "flex-start", gap: 2 }}>
                    {!msg.mine && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}>
                        <span style={{ fontSize: 11, color: c2, fontWeight: 500 }}>{msg.name}</span>
                        {hostUuid && msg.userUuid === hostUuid && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: T.red, background: T.redLight, padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>HOST</span>
                        )}
                      </div>
                    )}
                    <div style={{ background: msg.mine ? T.red : T.surface2, color: msg.mine ? "#fff" : T.text, borderRadius: msg.mine ? "12px 12px 2px 12px" : "2px 12px 12px 12px", padding: "8px 12px", fontSize: 13, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.text}</div>
                    <span style={{ fontSize: 10, color: c3, paddingLeft: 2 }}>{msg.time?.slice(0, 5)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}` }}>
            {sendError && <div style={{ padding: "5px 12px", fontSize: 11, color: T.red, background: T.redLight }}>{sendError}</div>}
            <div style={{ padding: "8px 10px", display: "flex", gap: 6, alignItems: "flex-end" }}>
              <textarea
                value={inp}
                onChange={(e) => {
                  if (e.target.value.length > 50) return;
                  setInp(e.target.value);
                  setSendError(null);
                  e.target.style.height = "auto";
                  const maxH = 20 * 5 + 16;
                  e.target.style.height = Math.min(e.target.scrollHeight, maxH) + "px";
                  e.target.style.overflowY = e.target.scrollHeight > maxH ? "auto" : "hidden";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
                }}
                placeholder="메시지 입력... (최대 50자)"
                rows={1}
                style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 18, background: T.surface2, padding: "7px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: "20px", height: 36, overflowY: "hidden", transition: "height 100ms" }}
                onFocus={(e) => (e.target.style.borderColor = T.red)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
              <button onClick={send} disabled={isSending} style={{ width: 32, height: 32, borderRadius: "50%", background: isSending ? c3 : T.red, border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginBottom: 2 }}>
                <SendIc s={16} c="#fff" />
              </button>
            </div>
          </div>
        </>
      )}

      {chatTab === "멤버" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* 인원 수 — 상단 고정 */}
          <div style={{ flexShrink: 0, padding: "8px 14px 6px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: c2 }}>참여중</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>{members.length}</span>
              <span style={{ fontSize: 11, color: c3 }}>/ {maxMembers}명</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
            {members.map((m) => {
              const isSelf = m.userUuid === myUuid;
              const micState = isSelf ? mic : m.mic;
              const camState = isSelf ? cam : m.cam;
              const isActive = isSelf ? timerState === "running" : camState;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", opacity: isActive ? 1 : 0.55 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Av name={m.short} color={m.color} size={32} profileImage={m.profileImage} />
                    <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: isActive ? GREEN : c3, border: `2px solid ${T.surface}` }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      {m.role === "HOST" && <span style={{ fontSize: 9, color: T.red, fontWeight: 700, flexShrink: 0 }}>HOST</span>}
                      {isSelf && (
                        <span style={{ fontSize: 9, fontWeight: 600, flexShrink: 0, color: isActive ? GREEN : c3, background: isActive ? greenBg : T.surface2, padding: "1px 5px", borderRadius: 4 }}>
                          {isActive ? "측정중" : "일시정지"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: isActive ? T.red : c3, fontWeight: 500 }}>{fmtT(isSelf ? totalSec : (elapsed[m.id] ?? m.sec))}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                    {micState ? <MicOn s={13} c={c2} /> : <MicOff s={13} c={c3} />}
                    {camState ? <CamOn s={13} c={c2} /> : <CamOff s={13} c={c3} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 공지 배너 — 멤버탭 하단, 초록 */}
          {noticeMsg && (
            <div style={{ flexShrink: 0, margin: "0 10px 8px", background: greenBg, border: `1px solid ${T.dark ? "rgba(76,175,80,.4)" : "#A5D6A7"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 12, flexShrink: 0 }}>📢</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, marginBottom: 2 }}>공지사항</div>
                <div style={{ fontSize: 12, color: T.dark ? "#A5D6A7" : "#1B5E20", wordBreak: "break-word" }}>{noticeMsg}</div>
              </div>
              {setNoticeMsg && (
                <button onClick={() => setNoticeMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}><XIc s={13} c="#81C784" /></button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
