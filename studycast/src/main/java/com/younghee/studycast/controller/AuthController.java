package com.younghee.studycast.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.response.AuthResponse;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;
import com.younghee.studycast.security.JwtProvider;
import com.younghee.studycast.service.AuthService;
import com.younghee.studycast.service.UserService;
import com.younghee.studycast.util.AuthCookieUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
    private final AuthCookieUtil authCookieUtil;

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
        headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.buildTokenCookie(AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME,  auth.getAccessToken(),  accessMaxAge).toString());
        headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.buildTokenCookie(AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME, auth.getRefreshToken(), refreshMaxAge).toString());

        return ResponseEntity.ok().headers(headers)
            .body(Map.of("success", true, "message", "로그인되었습니다."));
    }

    // Access Token 재발급 — 쿠키의 Refresh Token 사용, 새 Access Token 쿠키 발급
    @PostMapping("/api/auth/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request) {

        String refreshToken = authCookieUtil.extractCookieValue(request, AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME);

        try {
            AuthResponse auth = authService.refresh(refreshToken);

            int accessMaxAge = (int) (jwtProvider.getAccessTokenValidityMs() / 1000);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.buildTokenCookie(AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME, auth.getAccessToken(), accessMaxAge).toString());

            return ResponseEntity.ok().headers(headers)
                .body(Map.of("success", true));

        } catch (IllegalArgumentException | IllegalStateException |
                 NoSuchElementException | SecurityException e) {
            log.warn("Refresh Token 재발급 실패: {}", e.getMessage());

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.clearTokenCookie(AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME).toString());
            headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.clearTokenCookie(AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME).toString());

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

        String refreshToken = authCookieUtil.extractCookieValue(request, AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME);

        authService.logout(refreshToken, userUuid);

        // 소셜 로그인 OAuth2 흐름 때문에 세션 자체는 STATELESS로 막아둘 수 없어서,
        // JWT 쿠키만 지우면 세션에 남은 인증 정보로 로그인 상태가 유지되는 문제 방지
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.clearTokenCookie(AuthCookieUtil.ACCESS_TOKEN_COOKIE_NAME).toString());
        headers.add(HttpHeaders.SET_COOKIE, authCookieUtil.clearTokenCookie(AuthCookieUtil.REFRESH_TOKEN_COOKIE_NAME).toString());

        return ResponseEntity.ok().headers(headers)
            .body(Map.of("success", true, "message", "로그아웃되었습니다."));
    }

    // 인증 사용자 정보 조회
    @GetMapping("/api/auth/me")
    public UserDTO getMe(Authentication authentication) {

        UUID userUuid = (UUID) authentication.getPrincipal();

        return authService.getMe(userUuid);
    }

    // 프로필 수정
    @PatchMapping("/api/auth/me")
    public Map<String, Object> updateMe(
        Authentication authentication,
        @RequestBody UserDTO dto
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();
        userService.updateProfile(userUuid, dto);
        return Map.of("success", true, "message", "프로필이 저장되었습니다.");
    }

    // 비밀번호 변경
    @PostMapping("/api/auth/change-password")
    public Map<String, Object> changePassword(
        Authentication authentication,
        @RequestBody Map<String, String> body
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || currentPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            return Map.of("success", false, "message", "비밀번호를 입력해 주세요.");
        }

        try {
            authService.changePassword(userUuid, currentPassword, newPassword);
            return Map.of("success", true, "message", "비밀번호가 변경되었습니다.");
        } catch (SecurityException e) {
            return Map.of("success", false, "message", e.getMessage(), "errorCode", "wrong_password");
        } catch (IllegalStateException e) {
            return Map.of("success", false, "message", e.getMessage(), "errorCode", "social_account");
        }
    }
}
