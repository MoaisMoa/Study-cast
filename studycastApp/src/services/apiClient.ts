/**
 * Spring Boot 백엔드 요청을 위한 Axios 공통 클라이언트
 * Access Token은 Authorization 헤더로 전송(인메모리 보관), Refresh Token은 httpOnly Cookie로 자동 처리(withCredentials: true)
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export interface ApiClientConfig {
  baseURL: string;
  /** 모든 mock 호출의 기본 지연 시간(ms) */
  defaultLatency: number;
}

export const apiClientConfig: ApiClientConfig = {
  baseURL: "/api",
  defaultLatency: 600,
};

/** 지정한 ms만큼 대기 */
export function sleep(ms: number = apiClientConfig.defaultLatency): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 더미 응답을 흉내내는 헬퍼.
 * - `failRate`(0~1) 확률로 reject
 * - 그 외에는 `data`를 resolve
 */
export async function mockRequest<T>(
  data: T,
  options: { latency?: number; failRate?: number; failMessage?: string } = {}
): Promise<T> {
  const { latency = apiClientConfig.defaultLatency, failRate = 0, failMessage = "request_failed" } =
    options;
  await sleep(latency);
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error(failMessage);
  }
  return data;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// axios (Spring API 공통 클라이언트)
// withCredentials: true → httpOnly Cookie를 모든 요청에 자동 포함
export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
  // 서버가 응답을 영원히 안 주는 경우(좀비 커넥션 등) 무한 로딩에 빠지지 않도록 기본 타임아웃 설정
  // 파일 업로드처럼 오래 걸리는 요청은 호출하는 쪽에서 timeout을 더 길게 개별 지정
  timeout: 10000,
});

// 인메모리 Access Token — Authorization 헤더로 매 요청에 실어 보냄.
// 페이지를 새로고침하면 비워지므로(브라우저에 영속 저장하지 않음) refresh 응답으로 다시 채워야 함
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** 세션 저장소 초기화 — Refresh Token은 쿠키로 관리되므로 사용자 정보 + 인메모리 Access Token만 삭제 */
export function clearAuthSession(): void {
  sessionStorage.removeItem("sc_user");
  setAccessToken(null);
}

const CSRF_COOKIE_NAME = "sc_csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/** document.cookie에서 이름으로 값 하나를 읽음 (없으면 null) */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// 요청 인터셉터 — 인메모리 Access Token을 Authorization 헤더로 첨부,
// /api/auth/refresh는 더블 서브밋 쿠키 방식 CSRF 토큰도 헤더로 첨부
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (config.url?.includes("/api/auth/refresh")) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      config.headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }
  return config;
});

// Axios 응답 인터셉터 — 401 시 /refresh 호출 후 원래 요청 재시도
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// 동시 다발 401 시 refresh를 한 번만 호출하기 위한 싱글턴 Promise
let refreshPromise: Promise<void> | null = null;
let isRedirectingToLogin = false;

function redirectToLoginOnce(): void {
  if (isRedirectingToLogin) return;

  isRedirectingToLogin = true;
  clearAuthSession();

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }
    if (originalRequest._retry) {
      redirectToLoginOnce();
      return Promise.reject(error);
    }

    // "현재 비밀번호/참여 코드가 틀림" 같은 입력값 오류도 401로 내려오는 엔드포인트 —
    // 로그인 세션 만료와는 무관하므로 캐시 정리/강제 로그아웃 대상에서 제외하고 그대로 에러만 전달
    if (
      url.includes("/api/auth/change-password") ||
      url.includes("/api/auth/withdraw") ||
      url.endsWith("/join")
    ) {
      return Promise.reject(error);
    }

    // 인증 관련 요청 자체가 실패한 경우 재시도하지 않음
    // /api/auth/me는 비로그인 사용자가 공개 페이지에서도 호출하므로 401이 정상 케이스 — 강제 리다이렉트 대상에서 제외
    if (
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/signup") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/me") ||
      url.includes("/api/auth/password/send-code") ||
      url.includes("/api/auth/password/verify-code") ||
      url.includes("/api/auth/password/reset")
    ) {
      clearAuthSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // refresh가 이미 진행 중이면 기존 Promise 대기, 아니면 새로 시작
    if (!refreshPromise) {
      const csrfToken = readCookie(CSRF_COOKIE_NAME);
      refreshPromise = axios
        .post(`/api/auth/refresh`, null, {
          withCredentials: true,
          headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {},
        })
        .then((res) => {
          setAccessToken(res.data?.accessToken ?? null);
        })
        .catch((refreshError) => {
          redirectToLoginOnce();
          return Promise.reject(refreshError);
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;
      // 새 Access Token이 메모리에 반영된 후 원래 요청 재시도(요청 인터셉터가 새 헤더를 붙여줌)
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);
