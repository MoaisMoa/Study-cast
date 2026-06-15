import { useState } from "react";
import type { Room } from "@/types";
import { useT } from "@/theme";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";

/** 추천 슬라이더용 세로 카드 */
export function StudyCard({ room }: { room: Room }) {
  const T = useT();
  const setModalRoom = useModal();
  const [hov, setHov] = useState(false);
  const full = room.members === room.max;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => setModalRoom(room)}
      style={{
        borderRadius: T.radius,
        overflow: "hidden",
        cursor: "pointer",
        background: T.surface,
        border: hov ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
        boxShadow: hov ? T.shadowHover : T.shadow,
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        <img
          src={room.img}
          alt={room.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hov ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.3s ease",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%)",
        }} />
        {room.live && (
          <div style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: T.red,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
          }}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              animation: "blink 1.2s ease-in-out infinite",
            }} />
            LIVE
          </div>
        )}
        {full && (
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <div style={{
              background: "rgba(40,40,40,.85)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
            }}>
              마감
            </div>
          </div>
        )}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "14px 8px 6px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}>
          <div style={{
            color: "#fff",
            fontSize: 11,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <Icon name="users" size={12} color="#fff" />
            {room.members}/{room.max}명
            {room.type === "PREMIUM" && (
              <svg width={18} height={18} viewBox="0 0 24 24" fill="#FFD54F" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4, flexShrink: 0 }}>
                <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 2h14v2H5v-2z" />
              </svg>
            )}
          </div>
          {room.isPrivate && (
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="lock" size={11} color="#fff" strokeWidth={1.8} />비공개
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 12px 12px", background: T.surface }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: T.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 4,
        }}>
          {room.title.replace(/ \(비공개\)$/, "")}
        </div>
        <div style={{ fontSize: 10, color: T.text3 }}>
          {room.cat} · 평균 {room.time}
        </div>
      </div>
    </div>
  );
}
