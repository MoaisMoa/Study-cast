package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;

public interface UserService {
    // 회원가입
    int signup(SignupRequest request);
    // 프로필
    void updateProfile(UUID userUuid, UserDTO dto);
    // 소셜 전용 계정 - 비밀번호 연결용 인증번호 발송
    void sendLinkCode(String userEmail);
    // 소셜 전용 계정 - 비밀번호 연결용 인증번호 확인
    void verifyLinkCode(String userEmail, String verificationCode);
}
