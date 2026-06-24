import { useState } from "react";
import type { PasswordChangeForm, PasswordFieldKey } from "@/types/profile";
import { useT } from "@/theme";
import { Dialog } from "@/components/ui/Modal";
import { PwStrengthBar } from "@/components/ui/PwStrengthBar";
import { changePassword, registerPassword } from "@/services/profileService";
import { EyeButton } from "../components/EyeButton";

const EMPTY_FORM: PasswordChangeForm = { current: "", next: "", confirm: "" };
const EMPTY_SHOW: Record<PasswordFieldKey, boolean> = {
  current: false,
  next: false,
  confirm: false,
};

const isPwValid = (v: string): boolean =>
  v.length >= 8 &&
  v.length <= 16 &&
  /[A-Za-z]/.test(v) &&
  /[0-9]/.test(v) &&
  /[^A-Za-z0-9]/.test(v);

function validateNextField(v: string, currentVal: string): string {
  if (!v) return "";
  if (!isPwValid(v))
    return "비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.";
  if (v === currentVal) return "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.";
  return "";
}

export interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** "register"면 소셜 전용 계정에 비밀번호를 처음 등록하는 모드 — 현재 비밀번호 입력 없음 */
  mode?: "change" | "register";
}

export function PasswordChangeModal({
  open,
  onClose,
  onSuccess,
  mode = "change",
}: PasswordChangeModalProps) {
  const T = useT();
  const ff = "'Noto Sans KR', sans-serif";

  const [pw, setPw] = useState<PasswordChangeForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<PasswordFieldKey, string>>>({});
  const [show, setShow] = useState<Record<PasswordFieldKey, boolean>>(EMPTY_SHOW);
  const [pw2Success, setPw2Success] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function reset() {
    setPw(EMPTY_FORM);
    setErrors({});
    setShow(EMPTY_SHOW);
    setPw2Success("");
    setLoading(false);
    setApiError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateAll(): Partial<Record<PasswordFieldKey, string>> {
    const e: Partial<Record<PasswordFieldKey, string>> = {};
    if (mode === "change" && !pw.current) e.current = "현재 비밀번호를 입력해 주세요.";
    if (!pw.next) e.next = "새 비밀번호를 입력해 주세요.";
    else {
      const msg = validateNextField(pw.next, pw.current);
      if (msg) e.next = msg;
    }
    if (!pw.confirm) e.confirm = "새 비밀번호 확인을 입력해 주세요.";
    else if (pw.next !== pw.confirm) e.confirm = "비밀번호가 일치하지 않습니다.";
    return e;
  }

  async function handleSubmit() {
    const e = validateAll();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const result =
        mode === "register"
          ? await registerPassword({ next: pw.next })
          : await changePassword({ current: pw.current, next: pw.next });
      if (!result.ok) {
        if (result.errorCode === "wrong_password") {
          setErrors((p) => ({
            ...p,
            current: result.message ?? "현재 비밀번호가 일치하지 않습니다.",
          }));
        } else {
          setApiError(
            result.message ??
              (mode === "register"
                ? "비밀번호 등록 처리 중 오류가 발생했습니다."
                : "비밀번호 변경 처리 중 오류가 발생했습니다.")
          );
        }
        return;
      }
      reset();
      onSuccess();
    } catch {
      setApiError(
        mode === "register"
          ? "비밀번호 등록 처리 중 오류가 발생했습니다."
          : "비밀번호 변경 처리 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputBaseStyle = (errorMsg?: string, successBorder?: boolean): React.CSSProperties => ({
    width: "100%",
    height: 44,
    padding: "0 40px 0 14px",
    border: `1px solid ${
      errorMsg ? T.red : successBorder ? "#4caf50" : T.border
    }`,
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    background: T.bg,
    color: T.text,
    fontFamily: ff,
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} width={400}>
      <div
        style={{
          background: T.surface,
          borderRadius: 12,
          padding: 28,
          boxShadow: T.shadowHover,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            marginBottom: 20,
          }}
        >
          {mode === "register" ? "비밀번호 등록" : "비밀번호 변경"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 현재 비밀번호 — 소셜 전용 계정 최초 등록 시에는 없음 */}
          {mode === "change" && (
          <div>
            <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
              현재 비밀번호
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={show.current ? "text" : "password"}
                value={pw.current}
                onChange={(e) => {
                  setPw((p) => ({ ...p, current: e.target.value }));
                  setErrors((p) => ({ ...p, current: "" }));
                }}
                style={inputBaseStyle(errors.current)}
              />
              <EyeButton
                visible={show.current}
                onToggle={() => setShow((p) => ({ ...p, current: !p.current }))}
              />
            </div>
            {errors.current && (
              <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>
                {errors.current}
              </div>
            )}
          </div>
          )}

          {/* 새 비밀번호 */}
          <div>
            <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
              새 비밀번호
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={show.next ? "text" : "password"}
                value={pw.next}
                onChange={(e) => {
                  const v = e.target.value;
                  setPw((p) => ({ ...p, next: v }));
                  const msg = validateNextField(v, pw.current);
                  setErrors((p) => ({ ...p, next: msg }));
                }}
                style={inputBaseStyle(errors.next)}
              />
              <EyeButton
                visible={show.next}
                onToggle={() => setShow((p) => ({ ...p, next: !p.next }))}
              />
            </div>
            {pw.next && <PwStrengthBar pw={pw.next} trackColor={T.border} />}
            {!pw.next && (
              <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>
                영문자, 숫자, 특수문자 포함 8~16자
              </div>
            )}
            {errors.next && (
              <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>
                {errors.next}
              </div>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <div style={{ fontSize: 13, color: T.text2, marginBottom: 6 }}>
              새 비밀번호 확인
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={show.confirm ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => {
                  const v = e.target.value;
                  setPw((p) => ({ ...p, confirm: v }));
                  if (!v) {
                    setErrors((p) => ({ ...p, confirm: "" }));
                    setPw2Success("");
                  } else if (v === pw.next) {
                    setErrors((p) => ({ ...p, confirm: "" }));
                    setPw2Success("비밀번호가 일치합니다.");
                  } else {
                    setErrors((p) => ({
                      ...p,
                      confirm: "비밀번호가 일치하지 않습니다.",
                    }));
                    setPw2Success("");
                  }
                }}
                style={inputBaseStyle(errors.confirm, !!pw2Success && !errors.confirm)}
              />
              <EyeButton
                visible={show.confirm}
                onToggle={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
              />
            </div>
            {pw2Success && (
              <div style={{ fontSize: 12, color: "#4caf50", marginTop: 4 }}>
                {pw2Success}
              </div>
            )}
            {errors.confirm && (
              <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>
                {errors.confirm}
              </div>
            )}
          </div>
        </div>

        {apiError && (
          <div
            style={{
              fontSize: 12,
              color: T.red,
              marginTop: 14,
              textAlign: "center",
            }}
          >
            {apiError}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: 14,
              color: T.text2,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: ff,
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              height: 44,
              background: T.red,
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: ff,
              transition: "opacity 0.15s",
            }}
          >
            {loading
              ? mode === "register" ? "등록 중..." : "변경 중..."
              : mode === "register" ? "등록 완료" : "변경 완료"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
