import type { ReactNode } from "react";
import { useRT } from "@/theme";

export interface RowProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  isMobile: boolean;
}

/** RoomCreate에서 사용하는 폼 라벨/필드 2-col 그리드 */
export function Row({ label, required, hint, children, isMobile }: RowProps) {
  const T = useRT();
  return (
    <div style={{
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "180px 1fr",
      gap: isMobile ? undefined : "0 32px",
      padding: isMobile ? "18px 0" : "22px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ marginBottom: isMobile ? 10 : 0, paddingTop: isMobile ? 0 : 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: T.text }}>{label}</span>
          {required && <span style={{ color: T.red, fontSize: 13, lineHeight: 1 }}>*</span>}
        </div>
        {hint && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{hint}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
