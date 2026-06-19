package com.younghee.studycast.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.AuthResponse;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;
import com.younghee.studycast.security.JwtProvider;
import com.younghee.studycast.service.AuthService;
import com.younghee.studycast.service.UserService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final JwtProvider jwtProvider;

    // 회원가입
    @PostMapping("/api/auth/signup")
    public Map<String, Object> signup(@RequestBody SignupRequest request) {

        userService.signup(request);

        return Map.of(
            "success", true,
            "message", "회원가입이 완료되었습니다."
        );
    }

    // 로그인 — 토큰을 httpOnly 쿠키로 전달
    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody UserDTO request) {

        log.info("로그인 API 요청: email={}", request.getUserEmail());

        AuthResponse auth = authService.login(request);

        int accessMaxAge  = (int) (jwtProvider.getAccessTokenValidityMs()  / 1000);
        int refreshMaxAge = (int) (jwtProvider.getRefreshTokenValidityMs() / 1000);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, buildCookie("sc_access_token",  auth.getAccessToken(),  accessMaxAge).toString());
        headers.add(HttpHeaders.SET_COOKIE, buildCookie("sc_refresh_token", auth.getRefreshToken(), refreshMaxAge).toString());

        return ResponseEntity.ok().headers(headers)
            .body(Map.of("success", true, "message", "로그인되었습니다."));
    }

    // Access Token 재발급 — 쿠키의 Refresh Token 사용, 새 Access Token 쿠키 발급
    @PostMapping("/api/auth/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request) {

        String refreshToken = getCookieValue(request, "sc_refresh_token");

        try {
            AuthResponse auth = authService.refresh(refreshToken);

            int accessMaxAge = (int) (jwtProvider.getAccessTokenValidityMs() / 1000);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, buildCookie("sc_access_token", auth.getAccessToken(), accessMaxAge).toString());

            return ResponseEntity.ok().headers(headers)
                .body(Map.of("success", true));

        } catch (IllegalArgumentException | IllegalStateException |
                 NoSuchElementException | SecurityException e) {
            log.warn("Refresh Token 재발급 실패: {}", e.getMessage());

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, clearCookie("sc_access_token").toString());
            headers.add(HttpHeaders.SET_COOKIE, clearCookie("sc_refresh_token").toString());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).headers(headers)
                .body(Map.of("success", false, "message", "인증이 만료되었습니다. 다시 로그인해주세요."));
        }
    }

    // 로그아웃 — 쿠키의 Refresh Token 폐기 및 쿠키 삭제
    @PostMapping("/api/auth/logout")
    public ResponseEntity<Map<String, Object>> logout(
        HttpServletRequest request,
        Authentication authentication
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();

        String refreshToken = getCookieValue(request, "sc_refresh_token");

        authService.logout(refreshToken, userUuid);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, clearCookie("sc_access_token").toString());
        headers.add(HttpHeaders.SET_COOKIE, clearCookie("sc_refresh_token").toString());

        return ResponseEntity.ok().headers(headers)
            .body(Map.of("success", true, "message", "로그아웃되었습니다."));
    }

    // 인증 사용자 정보 조회
    @GetMapping("/api/auth/me")
    public UserDTO getMe(Authentication authentication) {

        UUID userUuid = (UUID) authentication.getPrincipal();

        return authService.getMe(userUuid);
    }

    private ResponseCookie buildCookie(String name, String value, int maxAgeSeconds) {
        return ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(false)          // dev: false / prod: true
            .path("/")
            .maxAge(maxAgeSeconds)
            .sameSite("Strict")
            .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(false)          // dev: false / prod: true
            .path("/")
            .maxAge(0)
            .sameSite("Strict")
            .build();
    }

    private String getCookieValue(HttpServletRequest request, String name) {
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