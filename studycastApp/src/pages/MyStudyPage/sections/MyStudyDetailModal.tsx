import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MyStudyRoom } from "@/types/myStudy";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/study/StatusBadge";
import { calcRoomStatus, fmtDateFull } from "@/utils/myStudyDate";
import { verifyJoinCode } from "@/services/myStudyService";
import { openStudyRoom } from "@/utils/openStudyRoom";

export interface MyStudyDetailModalProps {
  room: MyStudyRoom | null;
  onClose: () => void;
}

export function MyStudyDetailModal({ room, onClose }: MyStudyDetailModalProps) {
  const T = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (!room) return null;

  const runStatus = calcRoomStatus(room);
  const isEnded = runStatus === "종료";
  const needCode = room.visibility === "private";

  async function handleEnter() {
    if (!room) return;
    if (isEnded) return;
    if (needCode) {
      if (code.trim().length < 4) {
        setCodeError("참여 코드 4자리를 입력해주세요.");
        return;
      }
      setVerifying(true);
      setCodeError("");
      const ok = await verifyJoinCode(room.id, code);
      setVerifying(false);
      if (!ok) {
        setCodeError("참여 코드가 일치하지 않습니다.");
        return;
      }
    }
    // 새 창으로 스터디룸 상세 페이지 열기
    openStudyRoom(room.id);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, borderRadius: 20, overflow: "hidden",
          width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,.3)",
          animation: "modalIn .22s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
          <img src={room.img} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 50%)" }} />
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,0,0,.5)", border: "none", color: "#fff", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            ✕
          </button>
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <StatusBadge status={runStatus} />
          </div>
        </div>

        <div style={{ padding: "22px 24px 28px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 16, lineHeight: 1.3 }}>
            {room.title}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>카테고리</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{room.category}</div>
            </div>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>참여 인원</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{room.members} / {room.maxMembers} 명</div>
            </div>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>공개 여부</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{room.visibility === "public" ? "공개" : "비공개"}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: T.text2, marginBottom: needCode && !isEnded ? 16 : 18, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="calendar" size={14} color={T.text3} />
            {fmtDateFull(room.periodStart)} ~ {fmtDateFull(room.periodEnd)}
          </div>

          {needCode && !isEnded && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: T.text2, marginBottom: 6 }}>참여 코드 (비공개 방)</div>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(""); }}
                placeholder="숫자 4~6자리"
                inputMode="numeric"
                style={{
                  width: "100%", height: 44, padding: "0 14px",
                  border: `1px solid ${codeError ? T.red : T.border}`,
                  borderRadius: 8, fontSize: 15, outline: "none",
                  background: T.bg, color: T.text, letterSpacing: "0.2em", fontWeight: 700,
                  boxSizing: "border-box", fontFamily: "'Noto Sans KR',sans-serif",
                }}
              />
              {codeError && <div style={{ fontSize: 12, color: T.red, marginTop: 5 }}>{codeError}</div>}
            </div>
          )}

          <button
            disabled={isEnded || verifying}
            onClick={handleEnter}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: isEnded ? "#9e9e9e" : T.red, color: "#fff",
              fontSize: 16, fontWeight: 800,
              cursor: isEnded || verifying ? "not-allowed" : "pointer",
              opacity: verifying ? 0.7 : 1, transition: "opacity 0.15s", letterSpacing: ".02em",
            }}
            onMouseEnter={(e) => { if (!isEnded && !verifying) e.currentTarget.style.opacity = ".85"; }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {isEnded ? "종료된 스터디" : verifying ? "확인 중..." : "입장하기"}
          </button>

          <button
            onClick={() => { onClose(); navigate("/rooms/new"); }}
            style={{
              width: "100%", marginTop: 10, padding: "11px 0", borderRadius: 12,
              border: `1px solid ${T.border}`, background: "none", color: T.text2,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            방 설정 / 새 방 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
