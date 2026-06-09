import { useT } from "@/theme";
import { useModal, useModalRoom } from "@/contexts/ModalContext";
import { openStudyRoom } from "@/utils/openStudyRoom";

/**
 * 카드 클릭 시 떠오르는 방 상세 모달.
 * `ModalContext`로 열려있는 방을 읽고, 배경 클릭 / X 버튼 / 참여하기 버튼을 표시.
 */
export function CardModal() {
  const T = useT();
  const room = useModalRoom();
  const setModalRoom = useModal();

  if (!room) return null;
  const full = room.members === room.max;
  const onClose = () => setModalRoom(null);

  return (
    <div
      onClick={onClose}
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
            onClick={onClose}
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
          }}>
            {room.title}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>스터디 기간</span>
              <span style={{
                background: "#FFF3E0", color: "#E65100",
                fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 20,
              }}>
                총 92일
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
              2026년 05월 3일 ~ 2026년 08월 3일
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

          <div style={{
            fontSize: 12, color: T.text3,
            textAlign: "center", marginBottom: 14,
          }}>
            설정한 내용으로 스터디에 참여하시겠어요?
          </div>

          <button
            disabled={full}
            onClick={() => { if (!full) { openStudyRoom(room.id); onClose(); } }}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: full ? "#9e9e9e" : T.red,
              color: "#fff",
              fontSize: 16, fontWeight: 800,
              cursor: full ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              letterSpacing: ".02em",
            }}
            onMouseEnter={(e) => { if (!full) e.currentTarget.style.opacity = ".85"; }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {full ? "참여 마감" : "참여하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
