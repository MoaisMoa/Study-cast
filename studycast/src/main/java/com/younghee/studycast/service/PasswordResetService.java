package com.younghee.studycast.service;

import com.younghee.studycast.dto.PasswordResetRequest;

public interface PasswordResetService {

    // 비밀번호 재설정 인증번호 발송
    void sendCode(String userEmail);

    // 인증번호 확인
    void verifyCode(String userEmail, String verificationCode);
    
    // 새 비밀번호로 변경    
    void resetPassword(PasswordResetRequest request);
}
