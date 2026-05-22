export type Gender = "남자" | "여자" | "설정 안 함";

export type ProfileCategory =
  | "공무원"
  | "대학생"
  | "IT · 개발"
  | "고시 · 사법"
  | "어학 · 외국어"
  | "취업 · 면접"
  | "자격증"
  | "기타";

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

export type ProfileErrorCode = "pw_mismatch" | "server_error";

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
