import type { Room } from "@/types";
import { useT } from "@/theme";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";

/** Browse 그리드용 라이브 카드 */
export function LiveStudyCard({ room: r }: { room: Room }) {
  const T = useT();
  const setModalRoom = useModal();
  const full = !r.overCapacity && r.members >= r.max;
  const isNew = r.createdDaysAgo != null && r.createdDaysAgo <= 10;
  const showLive = r.live && r.members >= 1;

  return (
    <div
      className="live-card"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
      }}
      onClick={() => setModalRoom(r)}
    >
      <div style={{
        position: "relative",
        aspectRatio: "4/3",
        overflow: "hidden",
        background: T.surface2,
      }}>
        <img src={r.img} alt={r.title} className="live-card-img" />
        {showLive && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: T.red,
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 6,
            boxShadow: "0 2px 6px rgba(0,0,0,.25)",
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              flexShrink: 0,
              animation: "blink 1.2s ease-in-out infinite",
            }} />
            LIVE
          </div>
        )}
        {isNew && !showLive && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "#2e7d32",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 6,
          }}>
            NEW
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          {full ? (
            <span style={{
              background: "#424242",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 6,
              display: "inline-block",
            }}>
              마감
            </span>
          ) : r.type === "PREMIUM" ? (
            <span style={{
              background: "#E65100",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 6,
              display: "inline-block",
            }}>
              PREMIUM
            </span>
          ) : (
            <span style={{
              background: "#424242",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 9px",
              borderRadius: 6,
              display: "inline-block",
            }}>
              FREE
            </span>
          )}
        </div>
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)",
          padding: "18px 10px 8px",
        }}>
          <div style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}>
            <Icon name="users" size={13} color="#fff" strokeWidth={1.8} />
            {r.members} / {r.max} 명
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px", background: T.surface }}>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: T.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 5,
          lineHeight: 1.3,
        }}>
          {r.title}
        </div>
        <div style={{ fontSize: 13, color: T.text3 }}>
          {r.cat} · 평균 {r.time}
        </div>
      </div>
    </div>
  );
}
