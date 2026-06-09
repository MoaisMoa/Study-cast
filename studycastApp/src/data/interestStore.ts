/**
 * 관심 카테고리 클라이언트 저장소 (백엔드 연동 전 임시 구현).
 *
 * 프로필에서 선택한 관심 카테고리를 localStorage에 저장하고,
 * 메인 추천 서비스(listRecommended)가 이 값을 읽어 추천을 필터링한다.
 * 추후 백엔드 API 연결 시 이 모듈만 교체하면 된다.
 */
import type { RoomCategory } from "@/types";
import { CATS_FILTER, USER_INTEREST_CATS } from "@/data/categories";

const STORAGE_KEY = "studycast.interestCats";

/** 저장된 관심 카테고리 조회 — 없으면 기본값(USER_INTEREST_CATS) */
export function getUserInterestCats(): RoomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [...USER_INTEREST_CATS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...USER_INTEREST_CATS];
    // 유효한 RoomCategory 값만 통과 (오염 데이터 방어)
    return parsed.filter((c): c is RoomCategory => CATS_FILTER.includes(c));
  } catch {
    return [...USER_INTEREST_CATS];
  }
}

/** 관심 카테고리 저장 */
export function saveUserInterestCats(cats: RoomCategory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  } catch {
    /* 저장 실패는 무시 (시크릿 모드 등) */
  }
}
