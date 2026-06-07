import type { VisitedRoom, VisitedTab } from "@/types/visitedRoom";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";

export interface VisitedRoomCardProps {
  room: VisitedRoom;
  tab: VisitedTab;
  onCardClick: (room: VisitedRoom) => void;
}

export function VisitedRoomCard({ room, tab, onCardClick }: VisitedRoomCardProps) {
  const T = useT();
  const full = room.members === room.max;
  const meta = tab === "recent" ? room.visitedAt : null;
  const cnt = tab === "frequent" ? room.visitCount : null;
  const showLive = room.isLive && room.status === "open" && room.members >= 1;

  return (
    <div className="visited-card" onClick={() => onCardClick(room)} style={{ background: T.surface }}>
      <div className="visited-card-thumb" style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: T.surface2 }}>
        <img src={room.img} alt={room.title} className="visited-card-img" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)" }} />

        {showLive && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: T.red, color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "blink 1.2s ease-in-out infinite" }} />LIVE
          </div>
        )}
        {room.isNew && !showLive && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "#2e7d32", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 6 }}>NEW</div>
        )}

        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4 }}>
          {room.status === "ended" ? (
            <span style={{ background: "#78909C", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6 }}>종료</span>
          ) : full ? (
            <span style={{ background: "#424242", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 6 }}>마감</span>
          ) : null}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 10px 8px", background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="users" size={12} color="#fff" strokeWidth={1.8} />{room.members} / {room.max} 명
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
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{room.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: T.text3 }}>{room.cat} · 평균 {room.time}</span>
          {meta && <span style={{ fontSize: 11, color: T.text3, background: T.surface2, padding: "2px 7px", borderRadius: 10 }}>{meta}</span>}
          {cnt && <span style={{ fontSize: 11, color: T.red, fontWeight: 600, background: T.redLight, padding: "2px 7px", borderRadius: 10 }}>{cnt}회 방문</span>}
        </div>
      </div>
    </div>
  );
}
