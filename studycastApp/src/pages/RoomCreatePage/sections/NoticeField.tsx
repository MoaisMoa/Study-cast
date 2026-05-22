import { useRT } from "@/theme";

export interface NoticeFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  setError: (msg: string) => void;
}

export function NoticeField({ value, onChange, error, setError }: NoticeFieldProps) {
  const T = useRT();
  return (
    <>
      <textarea
        placeholder="참여자에게 전달할 공지사항을 입력하세요."
        maxLength={500}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 500) {
            setError("공지사항은 최대 500자까지 입력할 수 있습니다.");
            return;
          }
          onChange(val);
          setError("");
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 14px",
          fontSize: 14,
          background: T.surface2,
          color: T.text,
          border: `1px solid ${error ? T.red : T.border}`,
          borderRadius: 8,
          outline: "none",
          transition: "border-color 0.15s",
          height: 120,
          resize: "vertical",
          lineHeight: 1.6,
          fontFamily: "inherit",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        {error
          ? <span style={{ fontSize: 12, color: T.red, margin: 0 }}>{error}</span>
          : <span />}
        <span style={{
          fontSize: 12,
          color: value.length >= 500 ? T.red : T.muted,
        }}>
          {value.length} / 500
        </span>
      </div>
    </>
  );
}
