/**
 * 추후 백엔드 연결을 위한 API 클라이언트 어댑터.
 *
 * 현재는 더미 데이터만 다루기 때문에 실제 fetch 호출 없이
 * `sleep` + 랜덤 실패 헬퍼만 노출한다.
 * 백엔드 연결 시 `request` 함수만 교체하면 된다.
 */

import axios from "axios";

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

/**
 * TODO(API 연결): 실제 백엔드가 붙으면 아래처럼 교체한다.
 *
 * export async function request<T>(path: string, init?: RequestInit): Promise<T> {
 *   const res = await fetch(`${apiClientConfig.baseURL}${path}`, {
 *     headers: { "Content-Type": "application/json" },
 *     credentials: "include",
 *     ...init,
 *   });
 *   if (!res.ok) throw new Error(`HTTP ${res.status}`);
 *   return (await res.json()) as T;
 * }
 */

// axios (Spring API 호출)
export const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// ** accessToken 자동으로 붙이는 Axios 공통 설정
// Axios 요청 보내기 전에 accessToken 자동으로 붙일지 말지 결정하는 코드
// 1. 공개 API 목록: Authorization: Bearer -> X
const PUBLIC_AUTH_URLS = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/refresh"
];

// 2. Axios 요청 인터셉터
// : apiClient로 요청을 보내기 직전에(서버) 이 함수 먼저 실행
apiClient.interceptors.request.use((config) => {
  // 1) 현재 요청하려는 주소
  const url = config.url ?? "";
  // 2) 공개 API 여부 확인
  // : 하나라도 맞으면 some()은 true 반환
  const isPublicAuthUrl = PUBLIC_AUTH_URLS.some((publicUrl) => 
    url.includes(publicUrl)
  );
  // 3) 공개 API면 토큰 안 붙이고 바로 반환
  if (isPublicAuthUrl) {
    return config;
  };
  // ** 401 원인
  // 4) 브라우저 localStorage에 저장된 accessToken 가져옴
  const accessToken = localStorage.getItem("sc_access_token");
  // 5) accessToken 있으면 Authorization 헤더 추가
  // : JwtAuthenticationFilter 검증
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
})
