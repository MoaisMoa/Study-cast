import type { VisitedTab } from "@/types/visitedRoom";
import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";

export type EmptyType = "tab" | "error";

export interface EmptyStateProps {
  tab?: VisitedTab;
  type?: EmptyType;
}

export function EmptyState({ tab, type = "tab" }: EmptyStateProps) {
  const T = useT();

  const wrap: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "60px 24px", gap: 14, textAlign: "center",
  };
  const circle: React.CSSProperties = {
    width: 60, height: 60, borderRadius: "50%",
    background: T.surface2, border: `1.5px dashed ${T.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  if (type === "error") {
    return (
      <div style={wrap}>
        <div style={circle}><Icon name="alertCircle" size={26} color={T.text3} strokeWidth={1.4} /></div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text2, marginBottom: 5 }}>오류가 발생했습니다.</div>
          <div style={{ fontSize: 13, color: T.text3 }}>네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</div>
        </div>
      </div>
    );
  }

  const msg = tab === "recent" ? "최근 방문한 스터디 그룹이 없습니다." : "자주 방문한 스터디 그룹이 없습니다.";
  const sub = tab === "recent"
    ? "스터디방에 실제로 입장하면 이곳에 기록됩니다."
    : "3회 이상 방문한 스터디방이 이곳에 표시됩니다.";
  return (
    <div style={wrap}>
      <div style={circle}><Icon name="users" size={26} color={T.text3} strokeWidth={1.4} /></div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text2, marginBottom: 5 }}>{msg}</div>
        <div style={{ fontSize: 13, color: T.text3 }}>{sub}</div>
      </div>
    </div>
  );
}
