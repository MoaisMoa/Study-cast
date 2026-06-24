import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/types";
import { getCurrentUser, logout as logoutService, fetchCurrentUser, clearAuthSession } from "@/services/authService";
import { broadcastAuthChange, subscribeAuthChange } from "@/utils/authBroadcast";
import axios from "axios";

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
  /** 프로필 수정 등으로 서버의 사용자 정보가 바뀐 뒤, user를 다시 불러와 헤더 등 전역 표시를 갱신 */
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 초기 로드 상태 추가 — 서버 검증 완료 전 화면 로드 방지
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 서버에 현재 로그인 상태를 다시 확인 — 최초 진입 시 + 다른 탭에서 로그인/로그아웃 발생 시 재사용
  const refreshAuth = useCallback(async (skipOnPublicPath: boolean) => {
    const publicPaths = ["/login", "/signup", "/password"];
    const currentPath = window.location.pathname;

    // 공개 페이지에서는 /api/auth/me 호출 생략 (최초 진입 시에만 적용)
    if (skipOnPublicPath && publicPaths.some((path) => currentPath.startsWith(path))) {
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
  }, []);

  // 앱 시작 시 서버 검증 흐름
  useEffect(() => {
    // 소셜 로그인 콜백 직후 랜딩(쿠키만 새로 세팅되고 AuthContext.login()을 거치지 않는 경로)인지 확인
    const isOAuthLanding = new URLSearchParams(window.location.search).get("oauthLogin") === "1";

    refreshAuth(true).then(() => {
      if (!isOAuthLanding) return;
      // 다른 탭에도 로그인 완료를 알리고, URL에서 마커 제거
      broadcastAuthChange();
      const url = new URL(window.location.href);
      url.searchParams.delete("oauthLogin");
      window.history.replaceState({}, "", url.pathname + url.search);
    });
  }, [refreshAuth]);

  // 다른 탭에서 로그인/로그아웃이 발생하면 이 탭의 인증 상태도 다시 확인
  useEffect(() => {
    return subscribeAuthChange(() => refreshAuth(false));
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login: (u) => {
        setUser(u);
        broadcastAuthChange();
      },
      logout: async () => {
        await logoutService();
        setUser(null);
        broadcastAuthChange();
      },
      refreshUser: () => refreshAuth(false),
    }),
    [user, isLoading, refreshAuth]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
