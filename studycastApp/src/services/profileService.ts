/**
 * 프로필 관련 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 `apiClient.request`로 교체.
 */
import axios from "axios";
import type {
  ChangePasswordPayload,
  ProfileDraft,
  ProfileReadOnly,
  ProfileServiceResult,
  WithdrawPayload,
} from "@/types/profile";
import { WithdrawModal } from "@/pages/ProfilePage/sections/WithdrawModal";

const API_BASE_URL = "/api/auth";


/** 초기 프로필 데이터 (읽기 전용 정보 + 편집 가능한 draft) 조회 */
export async function fetchProfile(): Promise<{
  readonly: ProfileReadOnly;
  draft: ProfileDraft;
}> {
  const response = await axios.get(`${API_BASE_URL}/me`);
  const data = response.data;

  return {
    readonly: {
      name: data.userName,
      email: data.userEmail,
    },
    draft: {
      gender: data.userGender || "설정 안 함",
      birthY: data.birthY || "",
      birthM: data.birthM || "",
      birthD: data.birthD || "",
      motto: data.userMotto || "",
      categories: data.categories || [],
      avatarUrl: data.userProfileImage || null,
    },
  };
}

/** 프로필 저장 */
export async function updateProfile(
  draft: ProfileDraft
): Promise<ProfileServiceResult> {
  try {
    const response = await axios.patch(`/api/user/profile/gender`, {
      userGender: draft.gender,
      birthY: draft.birthY,
      birthM: draft.birthM,
      birthD: draft.birthD,
      userMotto: draft.motto,
      userProfileImage: draft.avatarUrl
    });
    if(response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data.message || "프로필 저장에 실패 했습니다.",
      errorCode: "server_error",
    };
  } catch (error: any) {
    console.error("프로필 저장 API 에러: ", error);
    return {
      ok: false,
      message: error.response?.data?.message || "프로필 저장 중 서버 오류가 발생했습니다.",
      errorCode: "server_error",
    };
  }
}

/**
 * 비밀번호 변경.
 * mock: 현재 비밀번호가 `wrong`이면 일부러 실패 처리해 UI 흐름 확인 가능.
 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ProfileServiceResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/change-password`, {
      currentPassword: payload.current,
      newPassword: payload.next
    });

    if(response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data.message || "비밀번호 변경에 실패했습니다.",
      errorCode: "pw_mismatch",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.messge || "비밀번호 변경 처리 중 오류가 발생했습니다.",
      errorCode: "server_error",
    };
  }
}

/**
 * 회원 탈퇴.
 * mock: `wrong` 입력 시 비밀번호 불일치로 실패 처리.
 */
export async function withdraw(
  payload: WithdrawPayload
): Promise<ProfileServiceResult> {
  if (!payload.password) {
    return { ok: false, message: "비밀번호를 입력해 주세요." };
  } try {
    const response = await axios.post(`${API_BASE_URL}/withdraw`, {
      password: payload.password
    });
    if (response.data && response.data.success) {
      return { ok: true };
    }
    return {
      ok: false,
      message: response.data.message || "현재 비밀번호가 일치하지 않습니다.",
      errorCode: "pw_mismatch",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "탈퇴 처리 중 오류가 발생 했습니다.",
      errorCode: "server_error",
    };
  }
}
