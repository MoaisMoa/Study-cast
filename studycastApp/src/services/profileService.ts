/**
 * 프로필 관련 서비스 — 현재는 더미 데이터 기준 mock 구현.
 * 추후 `apiClient.request`로 교체.
 */

import type {
  ChangePasswordPayload,
  ProfileDraft,
  ProfileReadOnly,
  ProfileServiceResult,
  WithdrawPayload,
} from "@/types/profile";
import { INITIAL_PROFILE, PROFILE_READONLY } from "@/data/profile";
import { mockRequest } from "./apiClient";

/** 초기 프로필 데이터 (읽기 전용 정보 + 편집 가능한 draft) 조회 */
export async function fetchProfile(): Promise<{
  readonly: ProfileReadOnly;
  draft: ProfileDraft;
}> {
  return mockRequest(
    { readonly: PROFILE_READONLY, draft: INITIAL_PROFILE },
    { latency: 200 }
  );
}

/** 프로필 저장 */
export async function updateProfile(
  _draft: ProfileDraft
): Promise<ProfileServiceResult> {
  try {
    // TODO(API 연결): await request("/profile", { method: "PUT", body: JSON.stringify(_draft) });
    await mockRequest(null, { latency: 600 });
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "프로필 저장 중 오류가 발생했습니다.",
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
    await mockRequest(null, { latency: 800 });
    if (payload.current === "wrong") {
      return {
        ok: false,
        message: "현재 비밀번호가 일치하지 않습니다.",
        errorCode: "pw_mismatch",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "비밀번호 변경 처리 중 오류가 발생했습니다.",
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
  }
  try {
    await mockRequest(null, { latency: 600 });
    if (payload.password === "wrong") {
      return {
        ok: false,
        message: "현재 비밀번호가 일치하지 않습니다.",
        errorCode: "pw_mismatch",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "탈퇴 처리 중 오류가 발생했습니다.",
      errorCode: "server_error",
    };
  }
}
