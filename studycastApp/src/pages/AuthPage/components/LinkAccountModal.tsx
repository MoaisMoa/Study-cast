import { useEffect, useState } from "react";
import { useAT } from "@/theme";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Dialog } from "@/components/ui/Modal";
import { sendSignupLinkCode, verifySignupLinkCode, signup } from "@/services/authService";

export interface LinkAccountModalProps {
  open: boolean;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  onClose: () => void;
  onLinked: () => void;
}

const MAX_RESEND = 3;
const MAX_VERIFY = 3;

type Step = "intro" | "code";

export function LinkAccountModal({
  open,
  email,
  name,
  password,
  confirmPassword,
  onClose,
  onLinked,
}: LinkAccountModalProps) {
  const T = useAT();
  const [step, setStep] = useState<Step>("intro");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secs, setSecs] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [verifyCount, setVerifyCount] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep("intro");
      setCode("");
      setError("");
      setLoading(false);
      setSecs(300);
      setCanResend(false);
      setResendCount(0);
      setVerifyCount(0);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "code" || secs <= 0) return;
    const id = window.setInterval(() => setSecs((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [step, secs]);

  if (!open) return null;

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  async function handleSendCode() {
    setLoading(true);
    setError("");
    const result = await sendSignupLinkCode({ email });
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "인증번호 발송에 실패했습니다.");
      return;
    }
    setStep("code");
    setSecs(300);
    setCanResend(false);
    window.setTimeout(() => setCanResend(true), 30000);
  }

  async function handleResend() {
    if (resendCount >= MAX_RESEND) return;
    setLoading(true);
    setError("");
    const result = await sendSignupLinkCode({ email });
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "인증번호 재전송에 실패했습니다.");
      return;
    }
    const next = resendCount + 1;
    setResendCount(next);
    setSecs(300);
    setCanResend(false);
    setCode("");
    setVerifyCount(0);
    if (next < MAX_RESEND) {
      window.setTimeout(() => setCanResend(true), 60000);
    }
  }

  async function handleVerify() {
    if (!code) { setError("인증번호를 입력해주세요."); return; }
    if (secs <= 0) { setError("인증번호 입력 시간이 만료되었습니다."); return; }
    if (verifyCount >= MAX_VERIFY) {
      setError("인증 시도 3회를 초과했습니다. 인증번호를 다시 발급받아주세요.");
      return;
    }
    if (code.length < 6) { setError("인증번호 6자리를 입력해주세요."); return; }

    setLoading(true);
    const verifyResult = await verifySignupLinkCode({ email, code });
    if (!verifyResult.ok) {
      setLoading(false);
      const next = verifyCount + 1;
      setVerifyCount(next);
      if (next >= MAX_VERIFY) setError("인증 시도 3회를 초과했습니다. 인증번호를 다시 발급받아주세요.");
      else setError(verifyResult.message ?? "인증번호가 올바르지 않습니다.");
      return;
    }

    const signupResult = await signup({
      name,
      email,
      password,
      confirmPassword,
      verificationCode: code,
    });
    setLoading(false);

    if (!signupResult.ok) {
      setError(signupResult.message ?? "계정 연결 처리 중 오류가 발생했습니다.");
      return;
    }

    onLinked();
  }

  const resendDisabled = !canResend || resendCount >= MAX_RESEND || loading;

  return (
    <Dialog open={open} onClose={onClose} width={380}>
      <div
        style={{
          background: T.surface,
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 12px 40px rgba(0,0,0,.14)",
        }}
      >
        {step === "intro" ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              이미 소셜 로그인으로 가입된 이메일입니다
            </div>
            <div style={{ fontSize: 14, color: T.textM, lineHeight: 1.6, marginBottom: 20 }}>
              <b style={{ color: T.textS }}>{email}</b> 계정에 이메일 인증 후 비밀번호를 연결할 수 있어요.
              <br />연결하면 이메일/비밀번호로도 로그인할 수 있습니다.
            </div>
            {error && (
              <div style={{ fontSize: 12, color: T.red, marginBottom: 12 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  height: 44,
                  background: "none",
                  border: `1px solid ${T.borderM}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: T.textM,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: T.sans,
                }}
              >
                취소
              </button>
              <div style={{ flex: 1 }}>
                <PrimaryButton onClick={handleSendCode} disabled={loading}>
                  {loading ? "발송 중..." : "인증번호 받기"}
                </PrimaryButton>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              인증번호 확인
            </div>
            <div style={{ fontSize: 13, color: T.textM, marginBottom: 16 }}>
              <b style={{ color: T.textS }}>{email}</b> 로 인증번호를 전송했어요
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textS }}>인증번호</label>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: secs > 0 ? T.red : T.textM }}>
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
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: `1.5px solid ${error ? T.red : T.borderM}`,
                  borderRadius: 10,
                  fontFamily: T.mono,
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.text,
                  background: T.surface,
                  outline: "none",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              />
              {error && <div style={{ fontSize: 11, color: T.red, marginTop: 5 }}>{error}</div>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.textM, marginBottom: 16 }}>
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
              <span>({resendCount}/{MAX_RESEND})</span>
            </div>

            <PrimaryButton onClick={handleVerify} disabled={loading || verifyCount >= MAX_VERIFY || secs <= 0}>
              {loading ? "처리 중..." : "확인하고 연결하기"}
            </PrimaryButton>
          </>
        )}
      </div>
    </Dialog>
  );
}
