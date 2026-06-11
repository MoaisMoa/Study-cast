import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types";
import { getCurrentUser, logout as logoutService, fetchCurrentUser, clearAuthSession } from "@/services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 초기 로드 상태 추가 — 서버 검증 완료 전 화면 로드 방지
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 서버 검증 흐름
  useEffect(() => {
    async function initializeAuth() {
      try {
        // 1. 로컬 캐시 확인
        const cachedUser = getCurrentUser();
        const accessToken = sessionStorage.getItem("sc_access_token");

        // 2. 캐시도 토큰도 없으면 로그아웃 상태로 초기화
        if (!cachedUser || !accessToken) {
          clearAuthSession();
          setIsLoading(false);
          return;
        }

        // 3. /api/auth/me로 서버 검증
        const verifiedUser = await fetchCurrentUser();

        if (verifiedUser) {
          // 4. 검증 성공 → 사용자 상태 확정
          setUser(verifiedUser);
        } else {
          // 5. 검증 실패 → 로그아웃 (401 등)
          clearAuthSession();
          setUser(null);
        }
      } catch (err) {
        // 네트워크 오류 등 → 로그인 상태는 유지하되, 서버 통신 오류는 기록
        // (나중에 useEffect 재시도 로직 추가 가능)
        const cachedUser = getCurrentUser();
        if (cachedUser) {
          setUser(cachedUser);
        } else {
          clearAuthSession();
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login: (u) => setUser(u),
      logout: async() => {
        await logoutService();
        setUser(null);
      },
    }),
    [user, isLoading]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
