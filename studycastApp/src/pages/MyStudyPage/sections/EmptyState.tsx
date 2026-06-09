import { useT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export type EmptyStateType = "empty" | "filtered" | "error";

export interface EmptyStateProps {
  type: EmptyStateType;
  onCreateClick?: () => void;
  onRetry?: () => void;
}

export function EmptyState({ type, onCreateClick, onRetry }: EmptyStateProps) {
  const T = useT();
  const isFiltered = type === "filtered";
  const isError = type === "error";
  const icon: IconName = isError ? "alertTri" : isFiltered ? "filter" : "bookOpen";
  const title = isError
    ? "오류가 발생했습니다."
    : isFiltered
    ? "조건에 맞는 스터디 그룹이 없습니다."
    : "생성한 스터디 그룹이 없습니다.";
  const sub = isError
    ? "네트워크 또는 서버 오류입니다. 잠시 후 다시 시도해주세요."
    : isFiltered
    ? "다른 필터 조건을 선택해보세요."
    : "나만의 스터디 그룹을 직접 만들어보세요.";

  return (
    <div style={{
      gridColumn: "1 / -1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 24px",
      gap: 16,
      borderRadius: T.radius,
      border: `1.5px dashed ${isError ? T.red : T.border}`,
      background: T.surface,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: isError ? "#FFEBEE" : T.surface2,
        border: `1.5px solid ${isError ? T.red : T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={24} color={isError ? T.red : T.text3} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: isError ? T.red : T.text2, marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: T.text3 }}>{sub}</div>
      </div>
      {!isFiltered && !isError && (
        <button
          onClick={onCreateClick}
          style={{
            marginTop: 4, padding: "10px 24px", borderRadius: 8,
            border: "none", background: T.red, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Icon name="plus" size={15} color="#fff" strokeWidth={2.5} />
          새 스터디 만들기
        </button>
      )}
      {isError && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4, padding: "10px 24px", borderRadius: 8,
            border: `1.5px solid ${T.red}`, background: "none", color: T.red,
            fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
