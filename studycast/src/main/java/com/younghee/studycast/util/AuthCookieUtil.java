package com.younghee.studycast.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
// 인증 토큰 쿠키 생성/삭제 담당하는 유틸 클래스
public class AuthCookieUtil {
    
    public static final String ACCESS_TOKEN_COOKIE_NAME = "sc_access_token";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "sc_refresh_token";
    public static final String CSRF_TOKEN_COOKIE_NAME = "sc_csrf_token";

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
            // 수정) Strict는 다른 사이트에서 API 요청할 때 쿠키를 보내지 않음 (백엔드와 프론트 주소 다름)
            .sameSite(cookieSecure ? "None" : "Lax")
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
            .sameSite(cookieSecure ? "None" : "Lax")
            .build();
    }

    // CSRF 토큰 담는 Cookie 생성 — 더블 서브밋 패턴이라 프론트 JS가 값을 읽어 헤더로 되돌려보내야 하므로 httpOnly(false)
    public ResponseCookie buildCsrfCookie(String value, int maxAgeSeconds) {
        return ResponseCookie.from(CSRF_TOKEN_COOKIE_NAME, value)
            .httpOnly(false)
            .secure(cookieSecure)
            .path("/")
            .maxAge(maxAgeSeconds)
            .sameSite(cookieSecure ? "None" : "Lax")
            .build();
    }

    // CSRF 토큰 쿠키 삭제용 Cookie 생성
    public ResponseCookie clearCsrfCookie() {
        return ResponseCookie.from(CSRF_TOKEN_COOKIE_NAME, "")
            .httpOnly(false)
            .secure(cookieSecure)
            .path("/")
            .maxAge(0)
            .sameSite(cookieSecure ? "None" : "Lax")
            .build();
    }

    // 요청에 담긴 쿠키에서 지정한 이름의 값 추출
    public String extractCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
