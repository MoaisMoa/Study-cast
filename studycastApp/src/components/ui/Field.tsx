import { useState } from "react";
import type { ReactNode } from "react";
import { useAT } from "@/theme";

export interface FieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  right?: ReactNode;
}

export function Field({
  label, id, type = "text", placeholder, value, onChange, error, right,
}: FieldProps) {
  const T = useAT();
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label
          htmlFor={id}
          style={{
            display: "block", fontSize: 12, fontWeight: 600,
            color: T.textS, letterSpacing: ".2px",
          }}
        >
          {label}
        </label>
        {right}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "11px 14px",
          border: `1.5px solid ${error ? T.red : focused ? T.red : T.borderM}`,
          borderRadius: 10,
          fontSize: 14,
          fontFamily: T.sans,
          color: T.text,
          background: T.surface,
          outline: "none",
          boxShadow: focused ? `0 0 0 3px ${T.redM}` : "none",
          transition: "all .15s",
        }}
      />
      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>{error}</div>}
    </div>
  );
}
