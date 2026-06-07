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
}

export function MyStudyCard({ room, onCardClick, selectMode, selected, onToggle }: MyStudyCardProps) {
  const T = useT();
  const [hov, setHov] = useState(false);
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
        cursor: "pointer",
        background: T.surface,
        border: selected ? `2px solid ${T.red}` : hov ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
        boxShadow: hov ? T.shadowHover : T.shadow,
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      {selectMode && (
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
            transform: hov ? "scale(1.05)" : "scale(1)", transition: "transform 0.3s ease",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%)" }} />

        {isLive && (
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, background: T.red, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} /> LIVE
          </div>
        )}
        {isNew && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "#2e7d32", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>NEW</div>
        )}

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {full ? (
            <div style={{ background: "rgba(40,40,40,.85)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>마감</div>
          ) : room.type === "PREMIUM" ? (
            <div style={{ background: "rgba(180,100,0,.9)", color: "#FFD54F", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>PREMIUM</div>
          ) : (
            <div style={{ background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>FREE</div>
          )}
        </div>

        <div style={{ position: "absolute", bottom: 6, left: 8, right: 8, color: "#fff", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="users" size={12} color="#fff" />{room.members}/{room.maxMembers}명
          </div>
          {room.visibility === "private" && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
              <Icon name="lock" size={10} color="rgba(255,255,255,.85)" strokeWidth={1.8} />
              <span style={{ color: "rgba(255,255,255,.85)" }}>비공개</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "10px 12px 12px", background: T.surface }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
          {room.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 2 }}>
          <div style={{ fontSize: 10, color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.category} · {fmtDateShort(room.periodStart)} ~ {fmtDateFull(room.periodEnd)}
          </div>
          <StatusBadge status={runStatus} />
        </div>
      </div>
    </div>
  );
}
