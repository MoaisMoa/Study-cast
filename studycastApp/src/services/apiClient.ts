/**
 * Spring Boot 백엔드 요청을 위한 Axios 공통 클라이언트
 * 인증은 httpOnly Cookie로 자동 처리 (withCredentials: true)
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

export const API_BASE_URL = "http://localhost:8080";

// axios (Spring API 공통 클라이언트)
// withCredentials: true → httpOnly Cookie를 모든 요청에 자동 포함
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/** 세션 저장소 초기화 — 토큰은 쿠키로 관리되므로 사용자 정보만 삭제 */
export function clearAuthSession(): void {
  sessionStorage.removeItem("sc_user");
}

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

    // 인증 관련 요청 자체가 실패한 경우 재시도하지 않음
    if (
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/signup") ||
      url.includes("/api/auth/refresh") ||
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
      refreshPromise = axios
        .post("http://localhost:8080/api/auth/refresh", null, { withCredentials: true })
        .then(() => {})
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
      // 새 Access Token 쿠키가 세팅된 후 원래 요청 재시도
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  }
);
