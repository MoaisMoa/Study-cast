import { useState } from "react";
import type { MyStudyRoom } from "@/types/myStudy";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/study/StatusBadge";
import { calcRoomStatus, fmtDateFull, fmtDateShort, isNewRoom } from "@/utils/myStudyDate";

export interface MyStudyCardProps {
  room: MyStudyRoom;
  onCardClick: (room: MyStudyRoom) => void;
  selectMode: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export function MyStudyCard({ room, onCardClick, selectMode, selected, onToggle, disabled = false }: MyStudyCardProps) {
  const T = useT();
  const [hov, setHov] = useState(false);
  const hovActive = hov && !disabled;
  const runStatus = calcRoomStatus(room);
  const isEnded = runStatus === "종료";
  const full = runStatus === "마감";
  const isLive = !isEnded && room.isLive && room.members >= 1;
  const isNew = isNewRoom(room.createdAt) && !isLive && !isEnded;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onCardClick(room)}
      style={{
        borderRadius: T.radius,
        overflow: "hidden",
        cursor: disabled ? "not-allowed" : "pointer",
        background: T.surface,
        border: selected ? `2px solid ${T.red}` : hovActive ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
        boxShadow: hovActive ? T.shadowHover : T.shadow,
        transform: hovActive ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      {selectMode && !disabled && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(room.id); }}
          style={{
            position: "absolute", top: 8, left: 8, zIndex: 10,
            width: 22, height: 22, borderRadius: 6,
            background: selected ? T.red : "rgba(255,255,255,.85)",
            border: `2px solid ${selected ? T.red : "rgba(255,255,255,.7)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.2)", cursor: "pointer",
          }}
        >
          {selected && <Icon name="check" size={13} color="#fff" strokeWidth={2.5} />}
        </div>
      )}

      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        <img
          src={room.img}
          alt={room.title}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovActive ? "scale(1.05)" : "scale(1)", transition: "transform 0.3s ease",
            filter: disabled ? "grayscale(0.8) brightness(0.9)" : "none",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)" }} />

        {isLive && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: T.red, color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />LIVE
          </div>
        )}
        {isNew && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "#2e7d32", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>NEW</div>
        )}

        <div style={{ position: "absolute", top: 10, right: 10 }}>
          {full ? (
            <span style={{ background: "#424242", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6 }}>마감</span>
          ) : null}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 10px 8px", background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />{room.members}/{room.maxMembers}명
            {room.type === "PREMIUM" && (
              <svg width={16} height={16} viewBox="0 0 24 24" fill="#FFD54F" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
                <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 2h14v2H5v-2z" />
              </svg>
            )}
          </div>
          {room.visibility === "private" && (
            <div style={{ color: "#fff", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="lock" size={11} color="#fff" strokeWidth={1.8} />비공개
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "11px 13px 13px", background: T.surface }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
          {room.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 2 }}>
          <div style={{ fontSize: 12, color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.category} · {fmtDateShort(room.periodStart)} ~ {fmtDateShort(room.periodEnd)}
          </div>
          <StatusBadge status={runStatus} />
        </div>
      </div>
      {disabled && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(125,129,135,.34)", pointerEvents: "none", zIndex: 5 }} />
      )}
    </div>
  );
}
