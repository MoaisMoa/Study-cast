import type { RoomVisibility } from "@/types";
import { useRT } from "@/theme";

export interface VisibilitySelectorProps {
  value: RoomVisibility;
  onChange: (v: RoomVisibility) => void;
  error?: string;
  isMobile: boolean;
}

const OPTIONS: Array<{ val: RoomVisibility; text: string; desc: string }> = [
  { val: "public", text: "공개 스터디", desc: "누구나 참여 가능" },
  { val: "private", text: "비공개 스터디", desc: "코드로만 참여 가능" },
];

export function VisibilitySelector({ value, onChange, error, isMobile }: VisibilitySelectorProps) {
  const T = useRT();
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
        {OPTIONS.map(({ val, text, desc }) => {
          const active = value === val;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                textAlign: "left",
                border: active
                  ? `1.5px solid ${T.red}`
                  : error
                  ? `1px solid ${T.red}`
                  : `1px solid ${T.border}`,
                borderRadius: 8,
                background: active ? "rgba(230,50,50,0.07)" : T.surface2,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `2px solid ${active ? T.red : T.muted2}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}>
                {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red }} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: active ? T.red : T.text }}>{text}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: T.red, margin: "5px 0 0" }}>{error}</p>
      )}
    </>
  );
}
