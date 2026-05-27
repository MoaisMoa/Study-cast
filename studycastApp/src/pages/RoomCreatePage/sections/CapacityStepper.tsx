import { useRT } from "@/theme";
import { MemberDots } from "@/components/study/MemberDots";

export interface CapacityStepperProps {
  count: number | "";
  onChange: (v: number | "") => void;
  error?: string;
  setError: (msg: string) => void;
}

export function CapacityStepper({ count, onChange, error, setError }: CapacityStepperProps) {
  const T = useRT();
  const numeric = typeof count === "number" ? count : 0;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => onChange(Math.max(1, numeric - 1))}
          disabled={numeric <= 1}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface2,
            color: numeric <= 1 ? T.muted2 : T.text,
            fontSize: 20,
            cursor: numeric <= 1 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.1s",
          }}
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={count}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw === "") {
              onChange("");
              setError("인원 수를 입력해주세요.");
              return;
            }
            const num = parseInt(raw, 10);
            if (num < 1) {
              onChange(1);
              setError("");
            } else if (num > 4) {
              onChange(4);
              setError("최대 인원은 4명까지 입력 가능합니다.");
              window.setTimeout(() => setError(""), 1500);
            } else {
              onChange(num);
              setError("");
            }
          }}
          onBlur={() => {
            if (count === "" || (typeof count === "number" && count < 1)) {
              onChange(1);
              setError("");
            }
          }}
          style={{
            width: 52,
            height: 36,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            color: T.text,
            background: T.surface2,
            border: `1px solid ${error ? T.red : T.border}`,
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          onClick={() => onChange(Math.min(4, numeric + 1))}
          disabled={numeric >= 4}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface2,
            color: numeric >= 4 ? T.muted2 : T.text,
            fontSize: 20,
            cursor: numeric >= 4 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.1s",
          }}
        >
          +
        </button>
        <span style={{ fontSize: 13, color: T.muted }}>명</span>
      </div>
      {error && <p style={{ fontSize: 12, color: T.red, margin: "6px 0 0" }}>{error}</p>}
      <MemberDots count={numeric} />
    </>
  );
}
