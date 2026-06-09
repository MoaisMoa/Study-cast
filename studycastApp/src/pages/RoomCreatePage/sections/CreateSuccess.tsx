import { useState } from "react";
import { useRT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import { RoomNoticeModal } from "./RoomNoticeModal";

export interface CreateSuccessProps {
  thumbnail: string | null;
  name: string;
  visibility: "public" | "private";
  count: number;
  startDate: string;
  endDate: string;
  camOn: boolean;
  micOn: boolean;
  notice: string;
  roomId: number;
  isMobile: boolean;
  onEnter: () => void;
}

export function CreateSuccess({
  thumbnail, name, visibility, count, startDate, endDate, camOn, micOn, notice, roomId, isMobile, onEnter,
}: CreateSuccessProps) {
  const T = useRT();
  const [currentNotice, setCurrentNotice] = useState(notice);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  return (
      <div style={{
        background: T.surface,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        padding: isMobile ? "1.5rem 1rem" : "2.5rem",
        textAlign: "center",
      }}>
      {thumbnail && (
        <div style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          maxWidth: 480,
          margin: "0 auto 24px",
        }}>
          <img
            src={thumbnail}
            alt="thumbnail"
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)",
          }} />
          <div style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
          }}>
            {name}
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem" }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: T.red,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon name="check" size={20} color="#fff" />
        </div>
        <p style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: "0 0 2px", color: T.text }}>
          방이 생성됐어요!
        </p>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>스터디 그룹 방이 생성되었습니다.</p>
        <div style={{
          background: T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: "13px 16px",
          fontSize: 13,
          color: T.text2,
          lineHeight: 2,
          maxWidth: 360,
          width: "100%",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Icon name="home" size={18} color={T.red} />
            <strong style={{ color: T.text, fontSize: 14 }}>{name}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="users" size={14} color={T.muted} />
            최대 {count}명 · {visibility === "public" ? "공개" : "비공개"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="calendar" size={14} color={T.muted} />
            {startDate} ~ {endDate}
          </div>
          {categories.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Icon name="tag" size={14} color={T.muted} />
              {categories.join(" · ")}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="camera" size={14} color={T.muted} />
            카메라 {camOn ? "ON" : "OFF"}
            <Icon name="mic" size={14} color={T.muted} style={{ marginLeft: 4 }} />
            마이크 {micOn ? "ON" : "OFF"}
          </div>
          {currentNotice && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Icon name="bell" size={14} color={T.muted} />
              <span>{currentNotice}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <button
            onClick={() => setNoticeModalOpen(true)}
            style={{
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.text,
              cursor: "pointer",
            }}
          >
            공지사항 관리
          </button>
          <button
            onClick={onEnter}
            style={{
              padding: "10px 28px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              background: T.red,
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            입장하기
          </button>
        </div>
      </div>
      <RoomNoticeModal
        open={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        roomId={roomId}
        initialNotice={currentNotice}
        isHost
        onUpdate={(updatedNotice) => setCurrentNotice(updatedNotice ?? "")}
      />
      </div>
  );
}
