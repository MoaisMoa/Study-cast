import type {
  Gender,
  ProfileDraft,
  ProfileReadOnly,
} from "@/types/profile";
import { CATS_FILTER } from "@/data/categories";

export const GENDERS: Gender[] = ["남자", "여자", "설정 안 함"];

/** 관심 카테고리 — 메인 필터(CATS_FILTER)와 동일한 6개 RoomCategory를 그대로 사용 */
export const PROFILE_CATEGORIES = CATS_FILTER;

/** 최근 80년치 연도 (내림차순) */
export const YEARS: string[] = Array.from({ length: 80 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

/** 1~12월 (zero-padded) */
export const MONTHS: string[] = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

/** 1~31일 (zero-padded) */
export const DAYS: string[] = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

/** 회원가입에서 받은 등록 정보 — mock (로그인 더미 계정과 동일) */
export const PROFILE_READONLY: ProfileReadOnly = {
  name: "",
  email: "",
  hasPassword: true,
  nameChangeAvailable: false,
};

/** 프로필 초기값 — mock */
export const INITIAL_PROFILE: ProfileDraft = {
  gender: "설정 안 함",
  birthY: "",
  birthM: "",
  birthD: "",
  motto: "",
  categories: [],
  avatarUrl: null,
};

/** 카테고리 선택 최대 개수 */
export const MAX_CATEGORIES = 3;

/** 각오 글자 수 제한 */
export const MOTTO_MAX_LENGTH = 30;

/** 아바타 업로드 허용 MIME */
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png"];
