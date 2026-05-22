import { Fragment } from "react";
import { useAT } from "@/theme";

export interface StepBarProps {
  steps: string[];
  current: number;
}

export function StepBar({ steps, current }: StepBarProps) {
  const T = useAT();
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {steps.map((s, i) => (
        <Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                background: i < current ? "#4caf50" : i === current ? T.red : T.borderM,
                color: i <= current ? "#fff" : T.textM,
                transition: "all .2s",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <div
              style={{
                fontSize: 10,
                whiteSpace: "nowrap",
                fontWeight: i === current ? 600 : 500,
                color: i < current ? "#4caf50" : i === current ? T.red : T.textM,
              }}
            >
              {s}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1.5,
                marginBottom: 16,
                background: i < current ? T.red : T.borderM,
                transition: "background .2s",
              }}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
