package com.younghee.studycast.service;

public interface KakaoUnlinkService {
    // 카카오 연동 해제 (회원 탈퇴 시 사용, 실패해도 탈퇴 흐름을 막지 않는 best-effort)
    void unlink(String providerUserId);
}
