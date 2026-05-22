import type { Room } from "@/types";
import { useT } from "@/theme";
import { useModal } from "@/contexts/ModalContext";
import { Icon } from "@/components/ui/Icon";

/** 모바일 가로형 카드 */
export function StudyCardRow({ room }: { room: Room }) {
  const T = useT();
  const setModalRoom = useModal();
  const full = room.members === room.max;
  return (
    <div
      onClick={() => setModalRoom(room)}
      style={{
        display: "flex",
        background: T.surface,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: T.shadow,
      }}
    >
      <div style={{ position: "relative", width: 96, flexShrink: 0 }}>
        <img src={room.img} alt={room.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top,rgba(0,0,0,.35) 0%,transparent 60%)",
        }} />
        {room.live && (
          <div style={{
            position: "absolute",
            top: 5,
            left: 5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: T.red,
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: 3,
          }}>
            <span style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              animation: "blink 1.2s ease-in-out infinite",
            }} />
            LIVE
          </div>
        )}
      </div>
      <div style={{
        flex: 1,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: T.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {room.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.text3 }}>{room.cat}</span>
          <span style={{ fontSize: 10, color: T.text3 }}>·</span>
          <span style={{ fontSize: 10, color: T.text3, display: "flex", alignItems: "center", gap: 2 }}>
            <Icon name="users" size={10} color={T.text3} />
            {room.members}/{room.max}명
          </span>
          <span style={{ fontSize: 10, color: T.text3 }}>· 평균 {room.time}</span>
        </div>
        <div>
          {full ? (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              background: "#495057",
              color: "#fff",
              padding: "1px 6px",
              borderRadius: 3,
            }}>
              마감
            </span>
          ) : room.type === "PREMIUM" ? (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(180,100,0,.9)",
              color: "#FFD54F",
              padding: "1px 6px",
              borderRadius: 3,
            }}>
              PREMIUM
            </span>
          ) : (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              background: T.surface2,
              color: T.text2,
              padding: "1px 6px",
              borderRadius: 3,
            }}>
              FREE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
