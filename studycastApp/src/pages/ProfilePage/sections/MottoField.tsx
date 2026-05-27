import { useT } from "@/theme";
import { MOTTO_MAX_LENGTH } from "@/data/profile";

export interface MottoFieldProps {
  value: string;
  onChange: (next: string) => void;
  error?: string;
}

export function MottoField({ value, onChange, error }: MottoFieldProps) {
  const T = useT();
  const ff = "'Noto Sans KR', sans-serif";
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>내 각오</div>
        <span
          style={{
            fontSize: 13,
            color: value.length > MOTTO_MAX_LENGTH ? T.red : T.text2,
          }}
        >
          {value.length} /{MOTTO_MAX_LENGTH}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v.length <= MOTTO_MAX_LENGTH) onChange(v);
        }}
        placeholder="올해는 반드시! 기필코! 합격한다!"
        style={{
          width: "100%",
          height: 120,
          padding: "12px 14px",
          border: `1px solid ${error ? T.red : T.border}`,
          borderRadius: 8,
          fontSize: 15,
          outline: "none",
          background: T.surface,
          color: T.text,
          fontFamily: ff,
          resize: "none",
          boxSizing: "border-box",
          lineHeight: 1.6,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.red)}
        onBlur={(e) => (e.target.style.borderColor = error ? T.red : T.border)}
      />
      {error && (
        <div style={{ fontSize: 12, color: T.red, marginTop: 5 }}>{error}</div>
      )}
    </>
  );
}
