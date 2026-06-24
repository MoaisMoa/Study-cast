import type { RoomCategory } from "./room";

export type Gender = "남자" | "여자" | "설정 안 함";

/** 관심 카테고리 — 메인 필터(CATS_FILTER)와 완전히 동일한 RoomCategory 사용 */
export type ProfileCategory = RoomCategory;

/** 회원가입 시 등록된 정보 — 프로필 페이지에서는 읽기 전용 */
export interface ProfileReadOnly {
  name: string;
  email: string;
}

/** 프로필 페이지에서 편집 가능한 필드들 */
export interface ProfileDraft {
  gender: Gender;
  birthY: string;
  birthM: string;
  birthD: string;
  motto: string;
  categories: ProfileCategory[];
  /** Data URL or null (null이면 기본 이미지 사용) */
  avatarUrl: string | null;
}

export interface ChangePasswordPayload {
  current: string;
  next: string;
}

export interface WithdrawPayload {
  password: string;
}

export type ProfileErrorCode = "wrong_password" | "social_account" | "server_error";

export interface ProfileServiceResult {
  ok: boolean;
  message?: string;
  errorCode?: ProfileErrorCode;
}

/** 비밀번호 변경 모달에서 사용하는 3개 필드 */
export interface PasswordChangeForm {
  current: string;
  next: string;
  confirm: string;
}

export type PasswordFieldKey = keyof PasswordChangeForm;
