import { useEffect, useState } from "react";
import type { AuthNavigate } from "@/types";
import { useAT } from "@/theme";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { sendResetCode, verifyResetCode } from "@/services/authService";
import { StepBar } from "../components/StepBar";

interface VerifyFormProps {
  email: string;
  onNavigate: AuthNavigate;
}

const MAX_RESEND = 3;
const MAX_VERIFY = 3;

export function VerifyForm({ email, onNavigate }: VerifyFormProps) {
  const T = useAT();
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [secs, setSecs] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [verifyCount, setVerifyCount] = useState(0);

  useEffect(() => {
    if (secs <= 0) {
      setError("인증번호 입력 시간이 만료되었습니다.");
      return;
    }
    const id = window.setInterval(() => setSecs((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [secs]);

  useEffect(() => {
    const id = window.setTimeout(() => setCanResend(true), 30000);
    return () => window.clearTimeout(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  async function handleVerify() {
    if (!code) { setError("인증번호를 입력해주세요."); return; }
    if (secs <= 0) { setError("인증번호 입력 시간이 만료되었습니다."); return; }
    if (verifyCount >= MAX_VERIFY) {
      setError("인증 시도 3회를 초과했습니다. 인증번호를 다시 발급받아주세요.");
      return;
    }
    if (code.length < 6) { setError("인증번호 6자리를 입력해주세요."); return; }

    const result = await verifyResetCode({ email, code });
    if (!result.ok) {
      const next = verifyCount + 1;
      setVerifyCount(next);
      if (next >= MAX_VERIFY) setError("인증 시도 3회를 초과했습니다. 인증번호를 다시 발급받아주세요.");
      else setError(result.message ?? "인증번호가 올바르지 않습니다.");
      return;
    }
    onNavigate("reset", { email, verificationCode: code });
  }

  async function handleResend() {
    if (resendCount >= MAX_RESEND) return;

    const result = await sendResetCode({ email });

    if (!result.ok) {
      setError(result.message ?? "인증번호 재전송에 실패했습니다.");
      return;
    }

    const next = resendCount + 1;
    setResendCount(next);
    setSecs(300);
    setCanResend(false);
    setError("");
    setCode("");
    setVerifyCount(0);

    if (next < MAX_RESEND) {
      window.setTimeout(() => setCanResend(true), 60000);
    }
  }

  const resendDisabled = !canResend || resendCount >= MAX_RESEND;

  return (
    <div>
      <StepBar steps={["이메일 입력", "인증번호 확인", "비밀번호 재설정"]} current={1} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 5, color: T.text }}>인증번호 확인 📧</div>
        <div style={{ fontSize: 13, color: T.textM }}>
          <b style={{ color: T.textS }}>{email}</b> 로 인증번호를 전송했어요
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.textS, letterSpacing: ".2px" }}>인증번호</label>
          <span style={{
            fontFamily: T.mono,
            fontSize: 12,
            fontWeight: 600,
            color: secs > 0 ? T.red : T.textM,
          }}>
            {secs > 0 ? `${mm}:${ss}` : "만료됨"}
          </span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="인증번호 6자리 입력"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
            setError("");
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "11px 14px",
            border: `1.5px solid ${error ? T.red : focused ? T.red : T.borderM}`,
            borderRadius: 10,
            fontFamily: T.mono,
            fontSize: 18,
            fontWeight: 600,
            color: T.text,
            background: T.surface,
            outline: "none",
            letterSpacing: "0.3em",
            textAlign: "center",
            boxShadow: focused ? `0 0 0 3px ${T.redM}` : "none",
            transition: "all .15s",
          }}
        />
        {error && <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>{error}</div>}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: T.textM,
        marginBottom: 16,
      }}>
        인증번호를 받지 못하셨나요?
        <button
          onClick={handleResend}
          disabled={resendDisabled}
          style={{
            fontSize: 12,
            color: resendDisabled ? T.textM : T.red,
            background: "none",
            border: "none",
            cursor: resendDisabled ? "default" : "pointer",
            fontWeight: 600,
            textDecoration: resendDisabled ? "none" : "underline",
            fontFamily: T.sans,
          }}
        >
          재전송
        </button>
        <span style={{ color: resendCount >= MAX_RESEND ? T.red : T.textM }}>
          ({resendCount}/{MAX_RESEND})
        </span>
      </div>

      <PrimaryButton onClick={handleVerify} disabled={verifyCount >= MAX_VERIFY || secs <= 0}>
        확인
      </PrimaryButton>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: T.textM }}>
        <span onClick={() => onNavigate("find-pw")} style={{ color: T.red, cursor: "pointer" }}>
          ← 이메일 다시 입력
        </span>
      </div>
    </div>
  );
}
