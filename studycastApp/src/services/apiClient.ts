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
// 요청마다 accessToken 자동 첨부
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("sc_access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
})
