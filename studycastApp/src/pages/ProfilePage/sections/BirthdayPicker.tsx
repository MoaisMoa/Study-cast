import { useT } from "@/theme";
import { DAYS, MONTHS, YEARS } from "@/data/profile";

export type BirthField = "birthY" | "birthM" | "birthD";

export interface BirthdayPickerProps {
  birthY: string;
  birthM: string;
  birthD: string;
  onChange: (key: BirthField, value: string) => void;
  error?: string;
}

export function BirthdayPicker({
  birthY,
  birthM,
  birthD,
  onChange,
  error,
}: BirthdayPickerProps) {
  const T = useT();
  const ff = "'Noto Sans KR', sans-serif";

  const selStyle: React.CSSProperties = {
    height: 48,
    padding: "0 32px 0 14px",
    border: `1px solid ${error ? T.red : T.border}`,
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    background: T.surface,
    color: T.text,
    fontFamily: ff,
    cursor: "pointer",
    appearance: "none",
    backgroundImage:
      `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23868e96'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    transition: "border-color 0.15s",
    width: "100%",
  };

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = T.red;
  };
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = error ? T.red : T.border;
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 8,
        }}
      >
        <select
          value={birthY}
          onChange={(e) => onChange("birthY", e.target.value)}
          style={selStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">년도</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select
          value={birthM}
          onChange={(e) => onChange("birthM", e.target.value)}
          style={selStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">월</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
        <select
          value={birthD}
          onChange={(e) => onChange("birthD", e.target.value)}
          style={selStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <option value="">일</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}일</option>
          ))}
        </select>
      </div>
      {error && (
        <div style={{ fontSize: 12, color: T.red, marginTop: 5 }}>{error}</div>
      )}
    </>
  );
}
