import type {
  AuthResult,
  AuthUser,
  FindPwPayload,
  LoginPayload,
  ResetPwPayload,
  SignupPayload,
  VerifyCodePayload,
} from "@/types";

import { apiClient } from "./apiClient";

const SAVED_EMAIL_KEY = "sc_saved_email";
const USER_KEY = "sc_user";

/** 세션 저장소 초기화 — 토큰은 쿠키로 관리되므로 사용자 정보만 삭제 */
export function clearAuthSession(): void {
  sessionStorage.removeItem(USER_KEY);
}

interface BackendUser {
  userUuid: string;
  userEmail: string;
  userName: string;
  userProfileImage?: string | null;
  userStatus: string;
}

/** 로그인 — 토큰은 백엔드가 httpOnly 쿠키로 설정 */
export async function login(
  payload: LoginPayload,
  remember: boolean
): Promise<AuthResult & { user?: AuthUser }> {
  try {
    await apiClient.post("/api/auth/login", {
      userEmail: payload.email,
      userPassword: payload.password,
    });

    if (remember) {
      localStorage.setItem(SAVED_EMAIL_KEY, payload.email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    const meResponse = await apiClient.get<BackendUser>("/api/auth/me");

    const user: AuthUser = {
      email: meResponse.data.userEmail,
      name: meResponse.data.userName,
      profileImage: meResponse.data.userProfileImage ?? undefined,
    };

    sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    return { ok: true, user };
  } catch (e: any) {
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
    await apiClient.post("/api/auth/signup", {
      userEmail: payload.email,
      userPassword: payload.password,
      userPasswordConfirm: payload.confirmPassword,
      userName: payload.name
    });

    return {ok: true};
  } catch (e: any) {
    return {
      ok: false,
      message:
        e.response?.data?.message ||
        "회원가입 처리 중 오류가 발생했습니다."
    }
  }
}

/** 이메일 중복 여부 */
export function isEmailTaken(email: string): boolean {
  // 실제 중복 검사는 회원가입 API에서 처리하므로, 화면 즉시 검사용으로 일단 false 처리
  return false;
}

/** 인증 사용자 정보 조회 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<BackendUser>("/api/auth/me");

    const user: AuthUser = {
      email: response.data.userEmail,
      name: response.data.userName,
      profileImage: response.data.userProfileImage ?? undefined,
    };

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
