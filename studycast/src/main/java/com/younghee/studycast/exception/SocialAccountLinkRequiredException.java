package com.younghee.studycast.exception;

// 소셜 전용 계정과 동일한 이메일로 회원가입 시도 시, 이메일 인증 없이는 비밀번호 연결을 막기 위한 예외
public class SocialAccountLinkRequiredException extends RuntimeException {
    public SocialAccountLinkRequiredException(String message) {
        super(message);
    }
}
