package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.response.AuthResponse;
import com.younghee.studycast.dto.UserDTO;

public interface AuthService {
    // 로그인
    AuthResponse login(UserDTO request);
    // Access Token 재발급
    AuthResponse refresh(String refreshToken);
    // 로그아웃
    void logout(String refreshToken, UUID userUuid);
    // 인증 사용자 정보 조회
    UserDTO getMe(UUID userUuid);
    // 비밀번호 변경
    void changePassword(UUID userUuid, String currentPassword, String newPassword);
    // 소셜 전용 계정 - 비밀번호 등록 (현재 비밀번호 확인 없이, 로그인 세션으로 본인 확인)
    void registerPassword(UUID userUuid, String newPassword);
    // 회원 탈퇴
    void withdraw(UUID userUuid, String password);
}