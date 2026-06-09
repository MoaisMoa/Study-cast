import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthNavigate } from "@/types";
import { useAT } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Divider } from "@/components/ui/Divider";
import { isEmail } from "@/utils/validators";
import { getSavedEmail, login } from "@/services/authService";
import { SocialButtons } from "../components/SocialButtons";

interface LoginFormProps {
  onNavigate: AuthNavigate;
}

export function LoginForm({ onNavigate }: LoginFormProps) {
  const T = useAT();
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getSavedEmail();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  function validate(): boolean {
    const e: { email?: string; pw?: string } = {};
    if (!email) e.email = "이메일을 입력해주세요.";
    else if (!isEmail(email)) e.email = "올바른 이메일 형식을 입력해주세요.";
    if (!pw) e.pw = "비밀번호를 입력해주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    setLoginError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login({ email, password: pw }, remember);
      if (!result.ok) {
        setLoginError(result.message ?? "로그인에 실패했습니다.");
        return;
      }
      if (result.user) setAuthUser(result.user);
      navigate("/");
    } catch {
      setLoginError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleLogin();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", marginBottom: 5, color: T.text }}>
          만나서 반가워요 👋
        </div>
        <div style={{ fontSize: 13, color: T.textM }}>공부 친구들이 기다리고 있어요</div>
      </div>

      <Field
        label="이메일"
        id="login-email"
        type="email"
        placeholder="example@email.com"
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (!v || isEmail(v)) setErrors((p) => ({ ...p, email: "" }));
          else setErrors((p) => ({ ...p, email: "올바른 이메일 형식을 입력해주세요." }));
        }}
        error={errors.email}
      />

      <PasswordField
        label="비밀번호"
        id="login-pw"
        placeholder="비밀번호 입력"
        value={pw}
        onChange={(v) => {
          setPw(v);
          setErrors((p) => ({ ...p, pw: "" }));
        }}
        error={errors.pw}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: T.textM, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: T.red, cursor: "pointer" }}
          />
          아이디 저장
        </label>
        <span
          onClick={() => onNavigate("find-pw")}
          style={{ fontSize: 12, color: T.textM, cursor: "pointer" }}
        >
          비밀번호 찾기
        </span>
      </div>

      {loginError && (
        <div style={{ fontSize: 12, color: T.red, textAlign: "center", marginBottom: 12 }}>
          {loginError}
        </div>
      )}
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "처리 중..." : "로그인"}
      </PrimaryButton>
      <Divider />
      <SocialButtons label="계속하기" />

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: T.textM }}>
        아직 계정이 없나요?{" "}
        <span
          onClick={() => onNavigate("signup")}
          style={{ color: T.red, fontWeight: 600, cursor: "pointer" }}
        >
          회원가입
        </span>
      </div>
    </form>
  );
}
