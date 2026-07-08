import { useRT } from "@/theme";
import { calcDays, offsetDate } from "@/utils/date";

export interface PeriodPickerProps {
  startDate: string;
  endDate: string;
  onEndDateChange: (v: string) => void;
  error?: string;
  setError: (msg: string) => void;
  isMobile: boolean;
}

export function PeriodPicker({
  startDate, endDate, onEndDateChange, error, setError, isMobile,
}: PeriodPickerProps) {
  const T = useRT();
  const days = calcDays(startDate, endDate);

  const inputStyle = {
    width: isMobile ? "100%" : "auto",
    boxSizing: "border-box" as const,
    padding: "10px 14px",
    fontSize: 14,
    background: T.surface2,
    color: T.text,
    border: `1px solid ${error ? T.red : T.border}`,
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.15s",
  };
  const hintStyle = { fontSize: 12, color: T.muted, margin: "5px 0 0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {days !== null && days > 0 && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(230,50,50,0.08)",
          border: `1px solid rgba(230,50,50,0.2)`,
          borderRadius: 6,
          padding: "5px 12px",
          alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 12, color: T.muted }}>총 기간</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>{days}일</span>
        </div>
      )}
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
      }}>
        <div style={{ flex: isMobile ? 1 : "none", minWidth: 0 }}>
          <input
            type="date"
            value={startDate}
            readOnly
            style={{ ...inputStyle, opacity: 0.6, cursor: "default", border: `1px solid ${T.border}` }}
          />
          <p style={hintStyle}>시작일 (오늘 자동 설정)</p>
        </div>
        <span style={{ color: T.muted, fontSize: 18, paddingBottom: 20, flexShrink: 0 }}>→</span>
        <div style={{ flex: isMobile ? 1 : "none", minWidth: 0 }}>
          <input
            type="date"
            value={endDate}
            min={offsetDate(1)}
            max={offsetDate(90)}
            onChange={(e) => {
              const val = e.target.value;
              onEndDateChange(val);
              if (!val) {
                setError("종료일을 선택해주세요.");
              } else if (val <= startDate) {
                setError("종료일은 시작일 이후 날짜를 선택해주세요.");
              } else {
                const totalDays =
                  Math.round(
                    (new Date(val).getTime() - new Date(startDate).getTime()) /
                      86400000
                  );

                if (totalDays > 90) {
                  setError("스터디 기간은 최대 90일까지 설정할 수 있습니다.");
                } else {
                  setError("");
                }
              }
            }}
            style={inputStyle}
          />
          <p style={hintStyle}>종료일 · 최대 90일 이내 (미선택 시 90일 자동 설정)</p>
        </div>
      </div>
      {error && <p style={{ fontSize: 12, color: T.red, margin: "5px 0 0" }}>{error}</p>}
    </div>
  );
}
