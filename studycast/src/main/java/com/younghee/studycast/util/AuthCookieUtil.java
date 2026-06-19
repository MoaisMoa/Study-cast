package com.younghee.studycast.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
// 인증 토큰 쿠키 생성/삭제 담당하는 유틸 클래스
public class AuthCookieUtil {
    
    public static final String ACCESS_TOKEN_COOKIE_NAME = "sc_access_token";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "sc_refresh_token";

    private final boolean cookieSecure;

    public AuthCookieUtil(@Value("${app.cookie-secure:false}") boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }

    // JWT 토큰 담는 httpOnly Cookie 생성
    public ResponseCookie buildTokenCookie(String name, String value, int maxAgeSeconds) {
        return ResponseCookie.from(name, value)
            // JavaScript에서 쿠키 읽지 못하게 막음
            .httpOnly(true)
            // 로컬 개발 환경에서는 HTTP 사용하므로 false
            // 배포 환경에서는 HTTPS 사용하므로 true로 변경 필요
            .secure(cookieSecure)
            .path("/")
            .maxAge(maxAgeSeconds)
            // 다른 사이트에서 자동으로 쿠키 보내는 것 제한(CSRF 방어 도움)
            .sameSite("Strict")
            .build();
    }

    // 인증 토큰 쿠키 삭제용 Cookie 생성
    public ResponseCookie clearTokenCookie(String name) {
        return ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/")
            // 0으로 응답하면 브라우저가 해당 쿠키를 즉시 삭제
            .maxAge(0)
            .sameSite("Strict")
            .build();
    }
}
