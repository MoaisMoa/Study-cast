import { useState } from "react";
import type { RoomMember } from "@/types/studyRoom";
import { useT } from "@/theme";
import { fmtT, secToHM } from "@/data/studyRoom";
import { Av, XIc, PlusIc, MailIc, MicOn, MicOff, CamOn, CamOff, CheckIc } from "../components/RoomIcons";

export interface MemberModalProps {
  members: RoomMember[];
  elapsed: Record<number, number>;
  /** 본인(HOST) 장치 상태 — 첫 행 표시용 */
  mic?: boolean;
  cam?: boolean;
  /** 멤버별 경과 시간 가산(초) — 참석 시간 누적 */
  joinElapsed?: number;
  isHost: boolean;
  isPrivate?: boolean;
  joinCode?: string;
  onClose: () => void;
  onKickRequest: (m: RoomMember) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberModal({
  members, elapsed, mic = true, cam = true, joinElapsed = 0, isHost, isPrivate = false, joinCode, onClose, onKickRequest,
}: MemberModalProps) {
  const T = useT();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // HOST 최상단, 나머지 이름 오름차순
  const sortedMembers: RoomMember[] = [
    ...members.filter((m) => m.role === "HOST"),
    ...members.filter((m) => m.role !== "HOST").sort((a, b) => a.name.localeCompare(b.name, "ko")),
  ];

  const colTpl = "2fr 1fr 1fr 80px";
  const emailValid = EMAIL_RE.test(email);

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.surface, borderRadius: 16, width: 700, maxWidth: "96vw", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 17, color: T.text }}>멤버 관리</span>
            <span style={{ background: T.surface2, color: T.text2, fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 12 }}>{members.length}명 접속중</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isHost && (
              <button onClick={() => setShowInvite(true)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <PlusIc s={13} c="#fff" />초대하기
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.text3, padding: 4 }}><XIc s={18} c={T.text3} /></button>
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: colTpl, padding: "8px 22px", background: T.surface2, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {([["멤버 정보", "left"], ["참석 시간", "center"], ["공부 시간", "center"], ["관리", "center"]] as const).map(([t, a]) => (
            <span key={t} style={{ fontSize: 11, fontWeight: 700, color: T.text3, letterSpacing: ".05em", textAlign: a }}>{t}</span>
          ))}
        </div>

        {/* 멤버 행 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sortedMembers.map((m, i) => {
            const isSelf = m.role === "HOST";
            const micState = isSelf ? mic : m.mic;
            const camState = isSelf ? cam : m.cam;
            return (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: colTpl, alignItems: "center", padding: "14px 22px", borderBottom: i < sortedMembers.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ flexShrink: 0 }}><Av name={m.short} color={m.color} size={40} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.name}</span>
                      {m.role === "HOST" && <span style={{ background: T.redLight, color: T.red, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>HOST</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><MailIc s={11} c={T.text3} /><span style={{ fontSize: 12, color: T.text3 }}>{m.email}</span></div>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: T.text }}>{m.joinMin + Math.floor(joinElapsed / 60)}분</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: T.red, marginBottom: 4 }}>{fmtT(elapsed[m.id] || 0)}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
                    {micState ? <MicOn s={13} c={T.text3} /> : <MicOff s={13} c={T.text3} />}
                    {camState ? <CamOn s={13} c={T.text3} /> : <CamOff s={13} c={T.text3} />}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {isHost && m.role !== "HOST"
                    ? <button onClick={(e) => { e.stopPropagation(); onKickRequest(m); }}
                        style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>추방</button>
                    : <span style={{ fontSize: 12, color: T.text3, display: "block", textAlign: "center" }}>-</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 통계 */}
        <div style={{ padding: "12px 22px", borderTop: `1px solid ${T.border}`, background: T.surface2, display: "flex", gap: 28, flexShrink: 0 }}>
          {(() => {
            const total = members.reduce((acc, m) => acc + (elapsed[m.id] || 0), 0);
            const rows: Array<[string, string]> = [
              ["접속 인원", `${members.length}명`],
              ["총 공부시간", secToHM(total)],
              ["평균 공부시간", secToHM(members.length ? Math.floor(total / members.length) : 0)],
            ];
            return rows.map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 11, color: T.text3, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: l === "접속 인원" ? T.red : T.text }}>{v}</div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* 멤버 초대 모달 */}
      {showInvite && (
        <div onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.surface, borderRadius: 16, width: 340, padding: 24, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>멤버 초대</span>
              <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: T.text3 }}><XIc s={16} c={T.text3} /></button>
            </div>

            {sent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><CheckIc s={22} c="#2e7d32" /></div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2e7d32" }}>초대 링크 전송 완료!</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>{email}</div>
                </div>
                <div style={{ background: T.surface2, borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text3, marginBottom: 4 }}>스터디룸 링크</div>
                    <div style={{ fontSize: 12, color: T.text2, wordBreak: "break-all", fontFamily: "'JetBrains Mono',monospace", background: T.bg, borderRadius: 6, padding: "6px 10px", border: `1px solid ${T.border}` }}>
                      {typeof window !== "undefined" ? window.location.href : "/rooms"}
                    </div>
                  </div>
                  {isPrivate && joinCode && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.text3, marginBottom: 4 }}>초대 코드 <span style={{ color: T.text3, fontWeight: 400 }}>(숫자 {joinCode.length}자리)</span></div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: T.red, letterSpacing: "0.3em", fontFamily: "'JetBrains Mono',monospace", background: T.bg, borderRadius: 6, padding: "8px 10px", border: `1px solid ${T.border}`, textAlign: "center" }}>{joinCode}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: T.text2 }}>이메일 주소로 초대 링크를 전송합니다.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSent(false); }}
                    placeholder="이메일 입력..."
                    style={{ border: `1px solid ${email && !emailValid ? T.red : T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", background: T.bg, color: T.text }}
                    onFocus={(e) => (e.target.style.borderColor = T.red)}
                    onBlur={(e) => (e.target.style.borderColor = email && !emailValid ? T.red : T.border)}
                  />
                  {email && !emailValid && <span style={{ fontSize: 11, color: T.red }}>이메일 형식으로 입력해주세요.</span>}
                </div>
                <button
                  onClick={() => { if (emailValid) setSent(true); }}
                  disabled={!emailValid}
                  style={{ background: emailValid ? T.red : T.surface2, color: emailValid ? "#fff" : T.text3, border: "none", borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 600, cursor: emailValid ? "pointer" : "not-allowed", fontFamily: "inherit", width: "100%" }}>
                  초대 링크 전송
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
