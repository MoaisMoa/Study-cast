import type { MyStudyRoom } from "@/types/myStudy";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import { PremiumCrown } from "@/components/ui/PremiumCrown";
import { StatusBadge } from "@/components/study/StatusBadge";
import { calcRoomStatus, fmtDateFull, fmtDateShort, isNewRoom } from "@/utils/myStudyDate";

export interface MyStudyCardMobileProps {
  room: MyStudyRoom;
  onCardClick: (room: MyStudyRoom) => void;
  selectMode: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function MyStudyCardMobile({ room, onCardClick, selectMode, selected, onToggle }: MyStudyCardMobileProps) {
  const T = useT();
  const runStatus = calcRoomStatus(room);
  const isEnded = runStatus === "종료";
  const full = runStatus === "마감";
  const isLive = !isEnded && room.isLive && room.members >= 1;
  const isNew = isNewRoom(room.createdAt) && !isLive && !isEnded;

  return (
    <div
      onClick={() => onCardClick(room)}
      style={{
        borderRadius: 10, overflow: "hidden", cursor: "pointer", position: "relative",
        background: T.surface,
        border: selected ? `2px solid ${T.red}` : `1px solid ${T.border}`,
        boxShadow: T.shadow,
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

      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
        <img src={room.img} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)" }} />

        {isLive && (
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, background: T.red, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />LIVE
          </div>
        )}
        {isNew && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "#2e7d32", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5 }}>NEW</div>
        )}

        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {full ? (
            <span style={{ background: "#424242", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>마감</span>
          ) : null}
        </div>

        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 12 }}>
            <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />{room.members}/{room.maxMembers}명
            {room.type === "PREMIUM" && <PremiumCrown />}
          </div>
          {room.visibility === "private" && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
              <Icon name="lock" size={11} color="rgba(255,255,255,.85)" strokeWidth={1.8} />
              <span style={{ color: "rgba(255,255,255,.85)" }}>비공개</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "11px 13px 13px", background: T.surface }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {room.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 2 }}>
          <div style={{ fontSize: 11, color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.category} · {fmtDateShort(room.periodStart)} ~ {fmtDateFull(room.periodEnd)}
          </div>
          <StatusBadge status={runStatus} />
        </div>
      </div>
    </div>
  );
}
