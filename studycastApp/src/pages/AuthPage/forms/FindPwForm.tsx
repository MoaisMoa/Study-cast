import { useState } from "react";
import type { AuthNavigate } from "@/types";
import { useAT } from "@/theme";
import { Field } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { isEmail } from "@/utils/validators";
import { sendResetCode } from "@/services/authService";
import { StepBar } from "../components/StepBar";

interface FindPwFormProps {
  onNavigate: AuthNavigate;
}

export function FindPwForm({ onNavigate }: FindPwFormProps) {
  const T = useAT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email) { setError("이메일을 입력해주세요."); return; }
    if (!isEmail(email)) { setError("올바른 이메일 형식을 입력해주세요."); return; }
    setLoading(true);
    try {
      const result = await sendResetCode({ email });
      if (!result.ok) {
        setError(result.message ?? "인증번호 발송에 실패했습니다.");
        return;
      }
      onNavigate("verify", { email });
    } catch {
      setError("인증번호 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepBar steps={["이메일 입력", "인증번호 확인", "비밀번호 재설정"]} current={0} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 5, color: T.text }}>비밀번호 찾기 🔑</div>
        <div style={{ fontSize: 13, color: T.textM }}>가입한 이메일로 인증번호를 보내드려요</div>
      </div>
      <Field
        label="가입한 이메일"
        id="find-email"
        type="email"
        placeholder="example@email.com"
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (!v || isEmail(v)) setError("");
          else setError("올바른 이메일 형식을 입력해주세요.");
        }}
        error={error}
      />
      <PrimaryButton onClick={handleSend} disabled={loading}>
        {loading ? "전송 중..." : "인증번호 전송"}
      </PrimaryButton>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: T.textM }}>
        <span onClick={() => onNavigate("login")} style={{ color: T.red, cursor: "pointer" }}>
          ← 로그인으로 돌아가기
        </span>
      </div>
    </div>
  );
}
