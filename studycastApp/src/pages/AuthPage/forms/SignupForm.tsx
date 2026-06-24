import { useState } from "react";
import type { AuthNavigate } from "@/types";
import { useAT } from "@/theme";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Divider } from "@/components/ui/Divider";
import { isEmail, isNameValid, isPwValidStrict } from "@/utils/validators";
import { isEmailTaken, signup } from "@/services/authService";
import { SocialButtons } from "../components/SocialButtons";
import { PwStrengthBar } from "../components/PwStrengthBar";
import { LinkAccountModal } from "../components/LinkAccountModal";

interface SignupFormProps {
  onNavigate: AuthNavigate;
}

type SignupErrors = { name?: string; email?: string; pw?: string; pw2?: string };

export function SignupForm({ onNavigate }: SignupFormProps) {
  const T = useAT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [pw2Success, setPw2Success] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  function validateEmail(v: string): string {
    if (!v) return "";
    if (!isEmail(v)) return "올바른 이메일 형식을 입력해주세요.";
    if (isEmailTaken(v)) return "이미 가입된 이메일입니다.";
    return "";
  }
  function validatePw(v: string): string {
    if (!v) return "";
    if (!isPwValidStrict(v)) return "비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.";
    return "";
  }

  function validate(): boolean {
    const e: SignupErrors = {};
    if (!name) e.name = "이름을 입력해주세요.";
    else if (!isNameValid(name)) e.name = "한글 2~5자 이내로 입력해주세요.";
    if (!email) e.email = "이메일을 입력해주세요.";
    else {
      const msg = validateEmail(email);
      if (msg) e.email = msg;
    }
    if (!pw) e.pw = "비밀번호를 입력해주세요.";
    else {
      const msg = validatePw(pw);
      if (msg) e.pw = msg;
    }
    if (!pw2) e.pw2 = "비밀번호 확인을 입력해주세요.";
    else if (pw !== pw2) e.pw2 = "비밀번호가 일치하지 않습니다.";

    setErrors(e);
    if (!e.pw2 && pw2) setPw2Success("비밀번호가 일치합니다.");
    return Object.keys(e).length === 0;
  }

  async function handleSignup() {
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup({ 
        name, 
        email, 
        password: pw,
        confirmPassword: pw2
      });
      if (!result.ok) {
        if (result.errorCode === "social_account_exists") {
          setLinkModalOpen(true);
          return;
        }
        setServerError(result.message ?? "회원가입 처리 중 오류가 발생했습니다.");
        return;
      }
      onNavigate("login");
    } catch {
      setServerError("회원가입 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.3px", marginBottom: 5, color: T.text }}>
          함께 공부를 시작해요 🎯
        </div>
        <div style={{ fontSize: 13, color: T.textM }}>무료로 가입하고 스터디룸을 탐색해보세요</div>
      </div>

      <Field
        label="이름"
        id="signup-name"
        placeholder="홍길동"
        value={name}
        onChange={(v) => {
          setName(v);
          if (!v || isNameValid(v)) setErrors((p) => ({ ...p, name: "" }));
          else if (v.length >= 1) setErrors((p) => ({ ...p, name: "한글 2~5자 이내로 입력해주세요." }));
        }}
        error={errors.name}
      />

      <Field
        label="이메일"
        id="signup-email"
        type="email"
        placeholder="example@email.com"
        value={email}
        onChange={(v) => {
          setEmail(v);
          setErrors((p) => ({ ...p, email: validateEmail(v) }));
        }}
        error={errors.email}
      />

      <div style={{ marginBottom: 14 }}>
        <PasswordField
          label="비밀번호"
          id="signup-pw"
          placeholder="영문자 + 숫자 + 특수문자 포함 8~16자리"
          value={pw}
          onChange={(v) => {
            setPw(v);
            setErrors((p) => ({ ...p, pw: "" }));
          }}
          error={errors.pw}
        />
        <PwStrengthBar pw={pw} />
      </div>

      <PasswordField
        label="비밀번호 확인"
        id="signup-pw2"
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

      {serverError && (
        <div style={{ fontSize: 12, color: T.red, textAlign: "center", marginBottom: 12 }}>
          {serverError}
        </div>
      )}
      <PrimaryButton onClick={handleSignup} disabled={loading}>
        {loading ? "처리 중..." : "회원가입"}
      </PrimaryButton>
      <Divider />
      <SocialButtons label="시작하기" />

      <div style={{ fontSize: 11, color: T.textM, textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
        가입하면 스터디캐스트의{" "}
        <span style={{ color: T.textS, textDecoration: "underline", cursor: "pointer" }}>이용약관</span> 및{" "}
        <span style={{ color: T.textS, textDecoration: "underline", cursor: "pointer" }}>개인정보처리방침</span>에 동의합니다.
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.textM }}>
        이미 계정이 있나요?{" "}
        <span onClick={() => onNavigate("login")} style={{ color: T.red, fontWeight: 600, cursor: "pointer" }}>
          로그인
        </span>
      </div>

      <LinkAccountModal
        open={linkModalOpen}
        email={email}
        name={name}
        password={pw}
        confirmPassword={pw2}
        onClose={() => setLinkModalOpen(false)}
        onLinked={() => {
          setLinkModalOpen(false);
          onNavigate("login");
        }}
      />
    </div>
  );
}
