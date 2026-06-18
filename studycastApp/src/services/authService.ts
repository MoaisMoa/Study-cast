import axios from "axios";
import type { AuthUser } from "@/types";

const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

// ── 토큰 관리 ──────────────────────────────────────
const ACCESS_TOKEN_KEY = "sc_access_token";
const REFRESH_TOKEN_KEY = "sc_refresh_token";
const USER_KEY = "sc_user";
const SAVED_EMAIL_KEY = "sc_saved_email";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ── 이메일 저장 ────────────────────────────────────
export function getSavedEmail(): string | null {
  return localStorage.getItem(SAVED_EMAIL_KEY);
}

function handleSaveEmail(email: string, remember: boolean) {
  if (remember) localStorage.setItem(SAVED_EMAIL_KEY, email);
  else localStorage.removeItem(SAVED_EMAIL_KEY);
}

// ── 사용자 캐시 ────────────────────────────────────
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrentUser(user: AuthUser) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── 요청 인터셉터 — Authorization 헤더 자동 주입 ──
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── 응답 인터셉터 — 401 시 토큰 재발급 ────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("no refresh token");
        const { data } = await axios.post("/api/auth/refresh", { refreshToken });
        saveTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        clearAuthSession();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── 공통 결과 타입 ─────────────────────────────────
interface ApiResult {
  ok: boolean;
  message?: string;
}

// ── 로그인 ─────────────────────────────────────────
interface LoginParams {
  email: string;
  password: string;
}

interface LoginResult extends ApiResult {
  user?: AuthUser;
}

export async function login(
  { email, password }: LoginParams,
  remember: boolean = false
): Promise<LoginResult> {
  try {
    const { data } = await apiClient.post("/api/auth/login", {
      userEmail: email,
      userPassword: password,
    });

    saveTokens(data.accessToken, data.refreshToken);
    handleSaveEmail(email, remember);

    const user = await fetchCurrentUser();
    if (!user) return { ok: false, message: "사용자 정보를 불러올 수 없습니다." };

    return { ok: true, user };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 401) return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
      if (msg) return { ok: false, message: msg };
    }
    return { ok: false, message: "로그인 처리 중 오류가 발생했습니다." };
  }
}

// ── 현재 사용자 조회 ───────────────────────────────
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get("/api/auth/me");
    const user: AuthUser = {
      email: data.userEmail,
      name: data.userName,
    };
    saveCurrentUser(user);
    return user;
  } catch {
    return null;
  }
}

// ── 로그아웃 ───────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiClient.post("/api/auth/logout", { refreshToken });
    }
  } finally {
    clearAuthSession();
  }
}

// ── 토큰 재발급 ────────────────────────────────────
export async function refresh(): Promise<string | null> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const { data } = await axios.post("/api/auth/refresh", { refreshToken });
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
}

// ── 이메일 중복 확인 ───────────────────────────────
export function isEmailTaken(_email: string): boolean {
  // 실시간 입력 검증용 — 중복 체크는 signup API 호출 시 서버에서 처리
  return false;
}

// ── 회원가입 ───────────────────────────────────────
interface SignupParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function signup(params: SignupParams): Promise<ApiResult> {
  try {
    await apiClient.post("/api/auth/signup", {
      userName: params.name,
      userEmail: params.email,
      userPassword: params.password,
      userPasswordConfirm: params.confirmPassword,
    });
    return { ok: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 409) return { ok: false, message: "이미 가입된 이메일입니다." };
      if (msg) return { ok: false, message: msg };
    }
    return { ok: false, message: "회원가입 처리 중 오류가 발생했습니다." };
  }
}

// ── 비밀번호 찾기 — 인증번호 발송 ─────────────────
interface SendResetCodeParams {
  email: string;
}

export async function sendResetCode(params: SendResetCodeParams): Promise<ApiResult> {
  try {
    await apiClient.post("/api/auth/send-reset-code", {
      userEmail: params.email,
    });
    return { ok: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 404) return { ok: false, message: "가입되지 않은 이메일입니다." };
      if (msg) return { ok: false, message: msg };
    }
    return { ok: false, message: "인증번호 발송에 실패했습니다." };
  }
}

// ── 비밀번호 찾기 — 인증번호 확인 ─────────────────
interface VerifyResetCodeParams {
  email: string;
  code: string;
}

export async function verifyResetCode(params: VerifyResetCodeParams): Promise<ApiResult> {
  try {
    await apiClient.post("/api/auth/verify-reset-code", {
      userEmail: params.email,
      code: params.code,
    });
    return { ok: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 400) return { ok: false, message: "인증번호가 올바르지 않습니다." };
      if (msg) return { ok: false, message: msg };
    }
    return { ok: false, message: "인증번호 확인에 실패했습니다." };
  }
}

// ── 비밀번호 재설정 ────────────────────────────────
interface ResetPasswordParams {
  email: string;
  verificationCode: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export async function resetPassword(params: ResetPasswordParams): Promise<ApiResult> {
  try {
    await apiClient.post("/api/auth/reset-password", {
      userEmail: params.email,
      verificationCode: params.verificationCode,
      newPassword: params.newPassword,
      newPasswordConfirm: params.newPasswordConfirm,
    });
    return { ok: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      if (msg) return { ok: false, message: msg };
    }
    return { ok: false, message: "비밀번호 변경에 실패했습니다." };
  }
}

export { apiClient };