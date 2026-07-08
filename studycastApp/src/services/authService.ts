import axios from "axios";
import type {
  AuthResult,
  AuthUser,
  FindPwPayload,
  LoginPayload,
  ResetPwPayload,
  SignupPayload,
  VerifyCodePayload,
} from "@/types";

import { apiClient, setAccessToken } from "./apiClient";

const SAVED_EMAIL_KEY = "sc_saved_email";
const USER_KEY = "sc_user";

/** 세션 저장소 초기화 — Refresh Token은 쿠키로 관리되므로 사용자 정보 + 인메모리 Access Token만 삭제 */
export function clearAuthSession(): void {
  sessionStorage.removeItem(USER_KEY);
  setAccessToken(null);
}

interface BackendUser {
  userUuid: string;
  userEmail: string;
  userName: string;
  userProfileImage?: string | null;
  userStatus: string;
}

function toAuthUser(data: BackendUser): AuthUser {
  return {
    email: data.userEmail,
    name: data.userName,
    profileImage: data.userProfileImage ?? undefined,
    userUuid: data.userUuid,
  };
}

/** 로그인 — Access Token은 응답 바디로 받아 인메모리 저장, Refresh Token은 백엔드가 httpOnly 쿠키로 설정 */
export async function login(
  payload: LoginPayload,
  remember: boolean
): Promise<AuthResult & { user?: AuthUser }> {
  try {
    const loginResponse = await apiClient.post<{ accessToken: string }>("/api/auth/login", {
      userEmail: payload.email,
      userPassword: payload.password,
    });
    setAccessToken(loginResponse.data.accessToken);

    if (remember) {
      localStorage.setItem(SAVED_EMAIL_KEY, payload.email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    const meResponse = await apiClient.get<BackendUser>("/api/auth/me");
    const user = toAuthUser(meResponse.data);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    return { ok: true, user };
  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "로그인 처리 중 오류가 발생했습니다."
    }
  }
}

/** 회원가입 */
export async function signup(payload: SignupPayload): Promise<AuthResult> {
  try {
    const response = await apiClient.post("/api/auth/signup", {
      userEmail: payload.email,
      userPassword: payload.password,
      userPasswordConfirm: payload.confirmPassword,
      userName: payload.name,
      verificationCode: payload.verificationCode
    });

    if (response.data && response.data.success === false) {
      return {
        ok: false,
        errorCode: response.data.errorCode,
        message: response.data.message,
      };
    }

    return {ok: true};
  } catch (e: any) {
    const errorCode = e.response?.data?.errorCode;
    if (errorCode === "social_account_exists") {
      return { ok: false, errorCode, message: e.response?.data?.message };
    }
    if (axios.isAxiosError(e) && e.response?.status === 409) {
      return { ok: false, message: "이미 가입된 이메일입니다." };
    }
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "회원가입 처리 중 오류가 발생했습니다."
    }
  }
}

/** 소셜 전용 계정 - 비밀번호 연결용 인증번호 발송 */
export async function sendSignupLinkCode(payload: FindPwPayload): Promise<AuthResult> {
  try {
    await apiClient.post("/api/auth/signup/send-link-code", {
      userEmail: payload.email
    });

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "인증번호 발송에 실패했습니다. 다시 시도해주세요."
    };
  }
}

/** 소셜 전용 계정 - 비밀번호 연결용 인증번호 확인 */
export async function verifySignupLinkCode(payload: VerifyCodePayload): Promise<AuthResult> {
  try {
    await apiClient.post("/api/auth/signup/verify-link-code", {
      userEmail: payload.email,
      verificationCode: payload.code
    });

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "인증번호가 올바르지 않습니다."
    };
  }
}

/** 이메일 중복 여부 — 회원가입 폼에서 실시간 안내용 (최종 차단은 회원가입 API에서 처리) */
export async function isEmailTaken(email: string): Promise<boolean> {
  try {
    const res = await apiClient.get<{ taken: boolean }>("/api/auth/check-email", {
      params: { email },
    });
    return res.data.taken;
  } catch {
    return false;
  }
}

/**
 * 인메모리 Access Token을 채움 — 새로고침 등으로 메모리가 비어 있을 때 /api/auth/me 호출 전에 사용.
 * /api/auth/me는 401 인터셉터의 자동 refresh-재시도 대상에서 제외되어 있어 여기서 명시적으로 먼저 호출해야 함
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await apiClient.post<{ accessToken: string }>("/api/auth/refresh");
    setAccessToken(res.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

/** 인증 사용자 정보 조회 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<BackendUser>("/api/auth/me");
    const user = toAuthUser(response.data);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

/** 로그아웃 — Refresh Token 쿠키는 백엔드가 폐기 및 삭제 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout");
  } finally {
    clearAuthSession();
  }
}

/** 저장된 이메일 / 로그인 상태 */
export function getSavedEmail(): string | null {
  return localStorage.getItem(SAVED_EMAIL_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** 비밀번호 찾기 — 인증번호 발송 */
export async function sendResetCode(payload: FindPwPayload): Promise<AuthResult> {
  try {
    await apiClient.post("/api/auth/password/send-code", {
      userEmail: payload.email
    });

    return { ok: true };
  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { ok: false, message: "가입되지 않은 이메일입니다." };
    }
    return {
      ok:  false,
      message:
        e.response?.data?.message ||
        "인증번호 발송에 실패했습니다. 다시 시도해주세요."
    }
  }
}

/** 인증번호 검증 */
export async function verifyResetCode(payload: VerifyCodePayload): Promise<AuthResult> {
  try {
    await apiClient.post("/api/auth/password/verify-code", {
      userEmail: payload.email,
      verificationCode: payload.code
    });

    return { ok: true };
  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response?.status === 400) {
      return { ok: false, message: "인증번호가 올바르지 않습니다." };
    }
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "인증번호가 올바르지 않습니다."
    };
  }
}

/** 비밀번호 재설정 */
export async function resetPassword(payload: ResetPwPayload): Promise<AuthResult> {
  try {
    await apiClient.post("/api/auth/password/reset", {
      userEmail: payload.email,
      verificationCode: payload.verificationCode,
      newPassword: payload.newPassword,
      newPasswordConfirm: payload.newPasswordConfirm
    });

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "비밀번호 변경 처리 중 오류가 발생했습니다."
    }
  }
}
