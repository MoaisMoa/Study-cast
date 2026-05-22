import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthScreen, AuthNavigate, AuthNavigateMeta } from "@/types";
import { useAT } from "@/theme";
import { BrandPanel } from "./components/BrandPanel";
import { LoginForm } from "./forms/LoginForm";
import { SignupForm } from "./forms/SignupForm";
import { FindPwForm } from "./forms/FindPwForm";
import { VerifyForm } from "./forms/VerifyForm";
import { ResetPwForm } from "./forms/ResetPwForm";

export interface AuthPageProps {
  /** 진입 모드 — /login 진입 시 "login", /signup 진입 시 "signup" */
  mode: "login" | "signup";
}

/**
 * /login 과 /signup 두 라우터가 공통으로 사용하는 셸.
 * 비밀번호 찾기 / 인증번호 확인 / 비밀번호 재설정 3단계는
 * 별도 라우터로 분리하지 않고 AuthPage 내부 `screen` state로 관리한다.
 */
export function AuthPage({ mode }: AuthPageProps) {
  const T = useAT();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<AuthScreen>(mode);
  const [meta, setMeta] = useState<AuthNavigateMeta>({});

  // URL 모드가 바뀌면 내부 화면도 동기화
  useEffect(() => {
    setScreen(mode);
    setMeta({});
  }, [mode]);

  const navigateAuth: AuthNavigate = (s, data = {}) => {
    setScreen(s);
    setMeta(data);
    // 탭 변경(login ↔ signup)은 URL도 같이 동기화 — find-pw/verify/reset은 내부 state 유지
    if (s === "login" && mode !== "login") navigate("/login");
    else if (s === "signup" && mode !== "signup") navigate("/signup");
  };

  const showTabs = screen === "login" || screen === "signup";

  return (
    <>
      <div
        className="auth-root"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "100vh",
          fontFamily: T.sans,
          fontSize: 14,
          color: T.text,
          background: T.bg,
        }}
      >
        <div className="brand-side">
          <BrandPanel />
        </div>
        <div
          style={{
            background: T.surface,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            minHeight: "100vh",
          }}
        >
          <div style={{ width: "100%", maxWidth: 380 }}>
            {showTabs && (
              <div
                style={{
                  display: "flex",
                  background: T.bg,
                  borderRadius: 10,
                  padding: 4,
                  marginBottom: 32,
                  gap: 2,
                }}
              >
                {(["login", "signup"] as const).map((s, i) => (
                  <button
                    key={s}
                    onClick={() => navigateAuth(s)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: screen === s ? 700 : 500,
                      color: screen === s ? T.text : T.textM,
                      border: "none",
                      background: screen === s ? T.surface : "transparent",
                      borderRadius: 7,
                      cursor: "pointer",
                      boxShadow: screen === s ? "0 1px 6px rgba(0,0,0,.08)" : "none",
                      fontFamily: T.sans,
                      transition: "all .15s",
                    }}
                  >
                    {i === 0 ? "로그인" : "회원가입"}
                  </button>
                ))}
              </div>
            )}

            {screen === "login" && <LoginForm onNavigate={navigateAuth} />}
            {screen === "signup" && <SignupForm onNavigate={navigateAuth} />}
            {screen === "find-pw" && <FindPwForm onNavigate={navigateAuth} />}
            {screen === "verify" && <VerifyForm email={meta.email ?? ""} onNavigate={navigateAuth} />}
            {screen === "reset" && <ResetPwForm email={meta.email ?? ""} onNavigate={navigateAuth} />}
          </div>
        </div>
      </div>
    </>
  );
}
