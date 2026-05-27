import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types";
import { DEMO_AUTH_USER } from "@/data/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 더미 데이터 기준: 기본적으로 로그인 상태로 진입 (기존 IS_LOGGED_IN=true 유지)
  const [user, setUser] = useState<AuthUser | null>(DEMO_AUTH_USER);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: !!user,
      login: (u) => setUser(u),
      logout: () => setUser(null),
    }),
    [user]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
