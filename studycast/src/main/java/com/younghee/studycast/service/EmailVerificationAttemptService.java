package com.younghee.studycast.service;

public interface EmailVerificationAttemptService {
    // 인증번호 실패 횟수 증가
    void increaseAttemptCount(Long verificationNo);
}
