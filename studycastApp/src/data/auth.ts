import type { AuthUser } from "@/types";

/** 더미 가입 계정 — 추후 authService 내부로 흡수 */
export const VALID_USERS: Array<{ email: string; pw: string }> = [
  { email: "test@test.com", pw: "Test1234!" },
  { email: "admin@studycast.kr", pw: "Admin1234!" },
];

/** 이미 가입된 이메일 (회원가입 중복 체크용) */
export const TAKEN_EMAILS: string[] = [
  "test@test.com",
  "admin@studycast.kr",
  "user@example.com",
];

/** 비밀번호 찾기에서 "가입 이력 있음"으로 인정할 이메일 */
export const REGISTERED_EMAILS: string[] = [
  "test@test.com",
  "admin@studycast.kr",
  "user@example.com",
];

/** 비밀번호 재설정 시 "이전 비밀번호와 동일" 체크용 */
export const PREV_PW_MAP: Record<string, string> = {
  "test@test.com": "Test1234!",
  "admin@studycast.kr": "Admin1234!",
  "user@example.com": "User1234!",
};

export const DEMO_AUTH_USER: AuthUser = {
  email: "test@test.com",
  name: "test",
};
