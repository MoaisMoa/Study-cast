/**
 * 인증 관련 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 `apiClient.request`로 교체.
 */

import type {
  AuthResult,
  AuthUser,
  FindPwPayload,
  LoginPayload,
  ResetPwPayload,
  SignupPayload,
  VerifyCodePayload,
} from "@/types";
import {
  PREV_PW_MAP,
  REGISTERED_EMAILS,
  TAKEN_EMAILS,
  VALID_USERS,
} from "@/data/auth";
import { mockRequest } from "./apiClient";

const SAVED_EMAIL_KEY = "sc_saved_email";
const TOKEN_KEY = "sc_token";
const USER_KEY = "sc_user";

/** 로그인 */
export async function login(
  payload: LoginPayload,
  remember: boolean
): Promise<AuthResult & { user?: AuthUser }> {
  await mockRequest(null, { latency: 700 });
  const matched = VALID_USERS.find(
    (u) => u.email === payload.email && u.pw === payload.password
  );
  if (!matched) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  if (remember) localStorage.setItem(SAVED_EMAIL_KEY, payload.email);
  else localStorage.removeItem(SAVED_EMAIL_KEY);

  const user: AuthUser = { email: matched.email, name: matched.email.split("@")[0] };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(user));
  return { ok: true, user };
}

/** 회원가입 */
export async function signup(payload: SignupPayload): Promise<AuthResult> {
  try {
    await mockRequest(null, {
      latency: 800,
      failRate: 0.2,
      failMessage: "회원가입 처리 중 오류가 발생했습니다.",
    });
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ name: payload.name, email: payload.email })
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** 이메일 중복 여부 */
export function isEmailTaken(email: string): boolean {
  return TAKEN_EMAILS.includes(email.trim().toLowerCase());
}

/** 비밀번호 찾기 — 인증번호 발송 */
export async function sendResetCode(payload: FindPwPayload): Promise<AuthResult> {
  if (!REGISTERED_EMAILS.includes(payload.email.trim().toLowerCase())) {
    return { ok: false, message: "가입된 이력이 없습니다." };
  }
  try {
    await mockRequest(null, {
      latency: 700,
      failRate: 0.1,
      failMessage: "인증번호 발송에 실패했습니다. 다시 시도해주세요.",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** 인증번호 검증 — mock: "123456" 만 통과 */
export async function verifyResetCode(payload: VerifyCodePayload): Promise<AuthResult> {
  await mockRequest(null, { latency: 300 });
  if (payload.code !== "123456") {
    return { ok: false, message: "인증번호가 올바르지 않습니다." };
  }
  return { ok: true };
}

/** 비밀번호 재설정 */
export async function resetPassword(payload: ResetPwPayload): Promise<AuthResult> {
  const prev = PREV_PW_MAP[payload.email.trim().toLowerCase()];
  if (prev && prev === payload.password) {
    return { ok: false, message: "이전 비밀번호와 동일한 비밀번호는 사용할 수 없습니다." };
  }
  try {
    await mockRequest(null, {
      latency: 800,
      failRate: 0.1,
      failMessage: "비밀번호 변경 처리 중 오류가 발생했습니다.",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** 저장된 이메일 / 로그인 상태 */
export function getSavedEmail(): string | null {
  return localStorage.getItem(SAVED_EMAIL_KEY);
}
export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}
