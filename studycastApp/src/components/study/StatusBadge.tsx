import type { RunStatus } from "@/types/myStudy";

const STYLES: Record<RunStatus, { bg: string; color: string; border: string }> = {
  "운영 중": { bg: "#E8F5E9", color: "#2e7d32", border: "#A5D6A7" },
  "마감":   { bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  "종료":   { bg: "#f1f3f5", color: "#868e96", border: "#dee2e6" },
};

export function StatusBadge({ status }: { status: RunStatus }) {
  const s = STYLES[status] ?? STYLES["종료"];
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 20,
      display: "inline-block",
      flexShrink: 0,
    }}>
      {status}
    </span>
  );
}
