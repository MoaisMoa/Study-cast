package com.younghee.studycast.service;

public interface EmailService {
    // 비밀번호 재설정 인증번호 발송
    void sendPasswordResetCode(String toEmail, String code);    
}
