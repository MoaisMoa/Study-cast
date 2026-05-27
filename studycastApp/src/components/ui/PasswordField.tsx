import { useState } from "react";
import { useAT } from "@/theme";

export interface PasswordFieldProps {
  label?: string;
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  success?: string;
  hint?: string;
}

export function PasswordField({
  label, id, placeholder, value, onChange, error, success, hint,
}: PasswordFieldProps) {
  const T = useAT();
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: "block", fontSize: 12, fontWeight: 600,
            color: T.textS, marginBottom: 6, letterSpacing: ".2px",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "11px 14px",
            paddingRight: 42,
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
        <button
          type="button"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: show ? T.red : T.textM,
            display: "flex",
            alignItems: "center",
          }}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && !error && !success && (
        <div style={{ fontSize: 11, color: T.textM, marginTop: 5 }}>{hint}</div>
      )}
      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>{error}</div>}
      {success && <div style={{ fontSize: 11, color: "#4caf50", marginTop: 5 }}>{success}</div>}
    </div>
  );
}
