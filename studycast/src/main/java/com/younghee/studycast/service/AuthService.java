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
}