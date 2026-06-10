import { useRT } from "@/theme";
import { checkJoinCodeDuplicate } from "@/services/roomService";

export type CodeCheckState = "idle" | "checking" | "ok" | "duplicate";

export interface JoinCodeFieldProps {
  code: string;
  onChange: (v: string) => void;
  state: CodeCheckState;
  setState: (s: CodeCheckState) => void;
  error?: string;
  onErrorClear: () => void;
  isMobile: boolean;
}

export function JoinCodeField({
  code, onChange, state, setState, error, onErrorClear, isMobile,
}: JoinCodeFieldProps) {
  const T = useRT();

  const inputStyle = {
    width: isMobile ? "100%" : 160,
    boxSizing: "border-box" as const,
    padding: "10px 14px",
    fontSize: 14,
    background: T.surface2,
    color: T.text,
    border: `1px solid ${
      error || state === "duplicate"
        ? T.red
        : state === "ok"
        ? "#16a34a"
        : T.border
    }`,
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.15s",
    letterSpacing: "0.2em",
    fontWeight: 700,
  };

  const handleCheck = async () => {
    const trimmedCode = code.trim();

    if (!/^\d{4,6}$/.test(trimmedCode)) {
      setState("idle");
      return;
    }

    setState("checking");

    try {
      const isDuplicate =
        await checkJoinCodeDuplicate(trimmedCode);

      setState(isDuplicate ? "duplicate" : "ok");

      if (!isDuplicate) {
        onErrorClear();
      }
    } catch {
      setState("idle");
    }
  };

  return (
    <>
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        flexDirection: isMobile ? "column" : "row",
      }}>
        <div style={{ flex: isMobile ? undefined : "none" }}>
          <input
            type="text"
            placeholder="숫자 4~6자리"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "");

              onChange(v);
              /** 코드 변경 시 중복 확인 상태 초기화 */
              setState("idle");
              onErrorClear();
            }}
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={code.length < 4 || state === "checking"}
          style={{
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: code.length >= 4 && state !== "checking" ? T.surface3 : T.surface2,
            color: code.length < 4 || state === "checking" ? T.muted2 : T.text2,
            cursor: code.length < 4 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s",
            flexShrink: 0,
            width: isMobile ? "100%" : undefined,
          }}
        >
          {state === "checking" ? "확인 중..." : "중복 확인"}
        </button>
      </div>
      {state === "ok" && !error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#16a34a" }}>
          사용 가능한 참여 코드입니다.
        </p>
      )}
      {state === "duplicate" && (
        <p style={{ fontSize: 12, color: T.red, margin: "5px 0 0" }}>
          이미 사용 중인 참여 코드입니다.
        </p>
      )}
      {state === "idle" && !error && (
        <p style={{ fontSize: 12, color: T.muted, margin: "5px 0 0" }}>
          입력 후 중복 확인을 해주세요.
        </p>
      )}
      {error && state !== "duplicate" && (
        <p style={{ fontSize: 12, color: T.red, margin: "5px 0 0" }}>{error}</p>
      )}
    </>
  );
}
