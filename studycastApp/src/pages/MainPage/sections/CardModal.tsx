import { useEffect, useState } from "react";
import { useT } from "@/theme";
import { useModal, useModalRoom } from "@/contexts/ModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { joinRoom } from "@/services/visitedRoomService";
import { openStudyRoom } from "@/utils/openStudyRoom";
import { canEnterRoom, setPendingEntry } from "@/utils/roomSession";
import { Icon } from "@/components/ui/Icon";
import { calcDays } from "@/utils/date";

const CODE_RE = /^[0-9]{4,6}$/;

function toDateOnlyStr(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function CardModal() {
  const T = useT();
  const { isLoggedIn } = useAuth();
  const room = useModalRoom();
  const setModalRoom = useModal();

  const [codeStep, setCodeStep] = useState(false);
  const [codeVal, setCodeVal] = useState("");
  const [codeError, setCodeError] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [entering, setEntering] = useState(false);
  const [entryBlocked, setEntryBlocked] = useState(false);
  const [loginCountdown, setLoginCountdown] = useState<number | null>(null);

  // 비로그인 안내 후 3초 카운트다운 → 로그인 페이지를 새 탭으로 열기 (메인페이지는 유지, 로그인 후 그 탭이 방으로 이어짐)
  useEffect(() => {
    if (loginCountdown === null) return;
    if (loginCountdown <= 0) {
      window.open(`/login?redirect=${encodeURIComponent(`/rooms/${room?.id}`)}`, "_blank", "noopener,noreferrer");
      handleClose();
      return;
    }
    const t = window.setTimeout(() => setLoginCountdown((v) => (v ?? 1) - 1), 1000);
    return () => window.clearTimeout(t);
  }, [loginCountdown, room?.id]);

  if (!room) return null;

  const full = !room.overCapacity && room.members >= room.max;
  const isPrivate = room.isPrivate ?? false;

  const totalDays = calcDays(toDateOnlyStr(room.createdAt), toDateOnlyStr(room.expiredAt));

  const handleClose = () => {
    setCodeStep(false);
    setCodeVal("");
    setCodeError("");
    setEntryBlocked(false);
    setLoginCountdown(null);
    setModalRoom(null);
  };

  const handleEnterClick = async () => {
    if (!isLoggedIn) { setLoginCountdown(3); return; }
    if (isPrivate) { setCodeStep(true); return; }
    setEntering(true);
    const allowed = await canEnterRoom();
    setEntering(false);
    if (!allowed) { setEntryBlocked(true); return; }
    setPendingEntry(String(room.id));
    openStudyRoom(room.id);
    handleClose();
  };

  const handleCodeSubmit = async () => {
    if (!CODE_RE.test(codeVal.trim())) { setCodeError("4~6자리 숫자를 입력해주세요."); return; }
    setVerifying(true);
    const allowed = await canEnterRoom();
    if (!allowed) { setVerifying(false); setEntryBlocked(true); setCodeStep(false); return; }
    const result = await joinRoom(room.id, codeVal.trim());
    setVerifying(false);
    if (result.ok) { setPendingEntry(String(room.id)); openStudyRoom(room.id); handleClose(); return; }
    setCodeError(result.message ?? "참여 코드가 올바르지 않습니다.");
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface,
          borderRadius: 20,
          overflow: "hidden",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 24px 64px rgba(0,0,0,.3)",
          animation: "modalIn .22s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
          <img
            src={room.img}
            alt={room.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 50%)",
          }} />
          <button
            onClick={handleClose}
            aria-label="닫기"
            style={{
              position: "absolute",
              top: 12, right: 12,
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,0,0,.5)",
              border: "none", color: "#fff", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          {room.live && (
            <div style={{
              position: "absolute",
              top: 12, left: 12,
              display: "flex", alignItems: "center", gap: 5,
              background: T.red, color: "#fff",
              fontSize: 12, fontWeight: 800,
              padding: "4px 10px", borderRadius: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#fff", display: "inline-block",
                animation: "blink 1.2s ease-in-out infinite",
              }} />
              LIVE
            </div>
          )}
        </div>

        <div style={{ padding: "22px 24px 28px" }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: T.text,
            marginBottom: 16, lineHeight: 1.3,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {room.title.replace(/ \(비공개\)$/, "")}
            {isPrivate && <Icon name="lock" size={18} color={T.text3} strokeWidth={1.8} />}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>스터디 기간</span>
              {totalDays != null && (
                <span style={{
                  background: "#FFF3E0", color: "#E65100",
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                }}>
                  총 {totalDays}일
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
              {formatDate(room.createdAt)} ~ {formatDate(room.expiredAt)}
            </div>
          </div>

          <div style={{ height: 1, background: T.border, marginBottom: 14 }} />

          <div style={{ display: "flex", gap: 12, marginBottom: 22, marginTop: 14 }}>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>카테고리</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{room.cat}</div>
            </div>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>참여 인원</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                {room.members} / {room.max} 명
              </div>
            </div>
            <div style={{ flex: 1, background: T.bg, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>평균 시간</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{room.time}</div>
            </div>
          </div>

          {codeStep ? (
            <>
              <div style={{ fontSize: 13, color: T.text2, textAlign: "center", marginBottom: 12 }}>
                비공개 스터디방입니다. 참여 코드가 필요합니다.
              </div>
              <input
                type="password"
                value={codeVal}
                onChange={(e) => {
                  setCodeVal(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setCodeError("");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleCodeSubmit(); }}
                placeholder="참여 코드 입력 (4~6자리 숫자)"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${codeError ? T.red : T.border}`,
                  fontSize: 15,
                  outline: "none",
                  background: T.bg,
                  color: T.text,
                  marginBottom: 6,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  boxSizing: "border-box",
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                }}
              />
              {codeError && (
                <div style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>{codeError}</div>
              )}
              {!codeError && <div style={{ marginBottom: 10 }} />}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setCodeStep(false); setCodeVal(""); setCodeError(""); }}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    border: `1.5px solid ${T.border}`, background: "none",
                    color: T.text2, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleCodeSubmit}
                  disabled={verifying}
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    border: "none", background: T.red,
                    color: "#fff", fontSize: 15, fontWeight: 800,
                    cursor: verifying ? "not-allowed" : "pointer",
                    opacity: verifying ? 0.7 : 1,
                  }}
                >
                  {verifying ? "확인 중..." : "입장하기"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 12, color: loginCountdown !== null || entryBlocked ? T.red : T.text3,
                textAlign: "center", marginBottom: 14,
              }}>
                {loginCountdown !== null
                  ? `로그인 후 입장 가능합니다. (${loginCountdown}초 후 로그인 페이지로 이동)`
                  : entryBlocked
                    ? "이미 입장 중인 방이 있습니다."
                    : full
                      ? "정원이 마감된 스터디방입니다."
                      : isPrivate
                        ? "비공개 스터디방입니다. 참여 코드가 필요합니다."
                        : "설정한 내용으로 스터디에 참여하시겠어요?"}
              </div>
              <button
                disabled={full || entering || loginCountdown !== null}
                onClick={handleEnterClick}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 12,
                  border: "none",
                  background: full || loginCountdown !== null ? "#9e9e9e" : T.red,
                  color: "#fff",
                  fontSize: 16, fontWeight: 800,
                  cursor: full || entering || loginCountdown !== null ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                  letterSpacing: ".02em",
                  opacity: entering ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!full && !entering && loginCountdown === null) e.currentTarget.style.opacity = ".85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = entering ? "0.7" : "1"; }}
              >
                {loginCountdown !== null ? "로그인 페이지로 이동 중..." : full ? "참여 마감" : entering ? "확인 중..." : isPrivate ? "코드 입력 후 입장" : "참여하기"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
