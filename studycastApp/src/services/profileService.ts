import { apiClient } from "./apiClient";
import type {
  ChangePasswordPayload,
  ProfileDraft,
  ProfileReadOnly,
  ProfileServiceResult,
  RegisterPasswordPayload,
  WithdrawPayload,
} from "@/types/profile";

function parseBirthDate(userBirthDate?: string | null) {
  if (!userBirthDate) return { birthY: "", birthM: "", birthD: "" };
  const [year, month, day] = userBirthDate.split("-");
  return {
    birthY: year ?? "",
    birthM: month ?? "",
    birthD: day ?? "",
  };
}

/** 프로필 조회 */
export async function fetchProfile(): Promise<{
  readonly: ProfileReadOnly;
  draft: ProfileDraft;
}> {
  const response = await apiClient.get("/api/auth/me");
  const data = response.data;
  const birth = parseBirthDate(data.userBirthDate);

  return {
    readonly: {
      name: data.userName,
      email: data.userEmail,
      hasPassword: !!data.hasPassword,
      nameChangeAvailable: !!data.nameChangeAvailable,
    },
    draft: {
      gender: data.userGender || "설정 안 함",
      birthY: birth.birthY,
      birthM: birth.birthM,
      birthD: birth.birthD,
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
    const payload: Record<string, unknown> = {
      userGender: draft.gender,
      userMotto: draft.motto,
      userProfileImage: draft.avatarUrl,
      categories: draft.categories,
    };

    if (draft.birthY && draft.birthM && draft.birthD) {
      payload.userBirthDate = `${draft.birthY}-${draft.birthM}-${draft.birthD}`;
    }

    const response = await apiClient.patch("/api/auth/me", payload);
    if (response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data?.message || "프로필 저장에 실패했습니다.",
      errorCode: "server_error",
    };
  } catch (error: any) {
    console.error("프로필 저장 API 에러:", error);
    return {
      ok: false,
      message: error.response?.data?.message || "프로필 저장 중 서버 오류가 발생했습니다.",
      errorCode: "server_error",
    };
  }
}

/** 비밀번호 변경 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ProfileServiceResult> {
  try {
    const response = await apiClient.post("/api/auth/change-password", {
      currentPassword: payload.current,
      newPassword: payload.next,
    });

    if (response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data?.message || "비밀번호 변경에 실패했습니다.",
      errorCode: response.data?.errorCode as any || "server_error",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "비밀번호 변경 처리 중 오류가 발생했습니다.",
      errorCode: error.response?.data?.errorCode || "server_error",
    };
  }
}

/** 소셜 전용 계정 - 비밀번호 등록 */
export async function registerPassword(
  payload: RegisterPasswordPayload
): Promise<ProfileServiceResult> {
  try {
    const response = await apiClient.post("/api/auth/register-password", {
      newPassword: payload.next,
    });

    if (response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data?.message || "비밀번호 등록에 실패했습니다.",
      errorCode: response.data?.errorCode as any || "server_error",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "비밀번호 등록 처리 중 오류가 발생했습니다.",
      errorCode: error.response?.data?.errorCode || "server_error",
    };
  }
}

/** 소셜 가입 계정 - 이름 최초 1회 변경 */
export async function changeName(name: string): Promise<ProfileServiceResult> {
  try {
    const response = await apiClient.patch("/api/auth/me/name", {
      userName: name,
    });

    if (response.data && response.data.success) {
      return { ok: true };
    }

    return {
      ok: false,
      message: response.data?.message || "이름 변경에 실패했습니다.",
      errorCode: response.data?.errorCode as any || "server_error",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "이름 변경 처리 중 오류가 발생했습니다.",
      errorCode: error.response?.data?.errorCode || "server_error",
    };
  }
}

/** 회원 탈퇴 */
export async function withdraw(
  payload: WithdrawPayload
): Promise<ProfileServiceResult> {
  if (!payload.password) {
    return { ok: false, message: "비밀번호를 입력해 주세요." };
  }

  try {
    const response = await apiClient.post("/api/auth/withdraw", {
      password: payload.password,
    });
    if (response.data && response.data.success) {
      return { ok: true };
    }
    return {
      ok: false,
      message: response.data?.message || "현재 비밀번호가 일치하지 않습니다.",
      errorCode: response.data?.errorCode as any || "server_error",
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.response?.data?.message || "탈퇴 처리 중 오류가 발생했습니다.",
      errorCode: error.response?.data?.errorCode || "server_error",
    };
  }
}
