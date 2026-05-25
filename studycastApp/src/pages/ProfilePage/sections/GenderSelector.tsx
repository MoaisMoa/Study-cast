import type { Gender } from "@/types/profile";
import { useT } from "@/theme";
import { GENDERS } from "@/data/profile";

export interface GenderSelectorProps {
  value: Gender;
  onChange: (next: Gender) => void;
}

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  const T = useT();
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {GENDERS.map((g) => {
        const active = value === g;
        return (
          <div
            key={g}
            onClick={() => onChange(g)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
              fontSize: 14,
              color: T.text,
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${active ? T.red : T.border}`,
                background: active ? T.red : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {active && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              )}
            </div>
            {g}
          </div>
        );
      })}
    </div>
  );
}
