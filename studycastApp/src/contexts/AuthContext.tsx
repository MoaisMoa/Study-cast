import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types";
import { getCurrentUser, logout as logoutService, fetchCurrentUser, clearAuthSession } from "@/services/authService";
import axios from "axios";

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
      const publicPaths = ["/login", "/signup", "/password"];
      const currentPath = window.location.pathname;

      // 공개 페이지에서는 /api/auth/me 호출 생략
      if (publicPaths.some((path) => currentPath.startsWith(path))) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // httpOnly Cookie 기반: sessionStorage 토큰 체크 없이 바로 서버 검증
        // 401 발생 시 401 인터셉터가 /refresh → 재시도까지 자동 처리
        const verifiedUser = await fetchCurrentUser();

        if (verifiedUser) {
          setUser(verifiedUser);
        } else {
          clearAuthSession();
          setUser(null);
        }
      } catch (err) {
        // 추가) 인증 실패는 캐시 유저를 복구하지 않고 로그아웃 상태로 처리
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          clearAuthSession();
          setUser(null);
          return;
        }

        // 네트워크 오류 → 로컬 캐시 사용 (서버 다운 시 UI 유지)
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
