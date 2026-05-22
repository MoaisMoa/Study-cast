import { useState } from "react";
import type { AuthNavigate } from "@/types";
import { useAT } from "@/theme";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { isPwValidLoose } from "@/utils/validators";
import { resetPassword } from "@/services/authService";
import { StepBar } from "../components/StepBar";

interface ResetPwFormProps {
  email: string;
  onNavigate: AuthNavigate;
}

type ResetErrors = { pw?: string; pw2?: string };

export function ResetPwForm({ email, onNavigate }: ResetPwFormProps) {
  const T = useAT();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [pw2Success, setPw2Success] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleReset() {
    setServerError("");
    setSuccessMsg("");
    const e: ResetErrors = {};
    if (!pw) e.pw = "비밀번호를 입력해주세요.";
    else if (!isPwValidLoose(pw)) e.pw = "비밀번호는 영문자와 숫자를 포함한 8~16자리여야 합니다.";
    if (!pw2) e.pw2 = "비밀번호 확인을 입력해주세요.";
    else if (pw !== pw2) e.pw2 = "비밀번호가 일치하지 않습니다.";
    setErrors(e);
    if (!e.pw2 && pw2) setPw2Success("비밀번호가 일치합니다.");
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const result = await resetPassword({ email, password: pw });
      if (!result.ok) {
        if (result.message?.includes("이전 비밀번호")) {
          setErrors({ pw: result.message });
        } else {
          setServerError(result.message ?? "비밀번호 변경에 실패했습니다.");
        }
        return;
      }
      setSuccessMsg("비밀번호가 성공적으로 변경되었습니다.");
      window.setTimeout(() => onNavigate("login"), 1500);
    } catch {
      setServerError("비밀번호 변경 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepBar steps={["이메일 입력", "인증번호 확인", "비밀번호 재설정"]} current={2} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 5, color: T.text }}>새 비밀번호 설정 🔒</div>
        <div style={{ fontSize: 13, color: T.textM }}>새로운 비밀번호를 입력해주세요</div>
      </div>
      <PasswordField
        label="새 비밀번호"
        id="reset-pw"
        placeholder="영문자 + 숫자 포함 8~16자리"
        value={pw}
        onChange={(v) => {
          setPw(v);
          setErrors((p) => ({ ...p, pw: "" }));
        }}
        error={errors.pw}
      />
      <PasswordField
        label="새 비밀번호 확인"
        id="reset-pw2"
        placeholder="비밀번호 재입력"
        value={pw2}
        onChange={(v) => {
          setPw2(v);
          if (!v) {
            setErrors((p) => ({ ...p, pw2: "" }));
            setPw2Success("");
          } else if (v === pw) {
            setErrors((p) => ({ ...p, pw2: "" }));
            setPw2Success("비밀번호가 일치합니다.");
          } else {
            setErrors((p) => ({ ...p, pw2: "비밀번호가 일치하지 않습니다." }));
            setPw2Success("");
          }
        }}
        error={errors.pw2}
        success={pw2Success}
      />
      {successMsg && (
        <div style={{ fontSize: 12, color: "#4caf50", textAlign: "center", marginBottom: 12 }}>{successMsg}</div>
      )}
      {serverError && (
        <div style={{ fontSize: 12, color: T.red, textAlign: "center", marginBottom: 12 }}>{serverError}</div>
      )}
      <PrimaryButton onClick={handleReset} disabled={loading || !!successMsg}>
        {loading ? "처리 중..." : "비밀번호 변경"}
      </PrimaryButton>
    </div>
  );
}
