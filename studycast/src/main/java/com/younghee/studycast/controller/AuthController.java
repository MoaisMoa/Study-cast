package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.AuthResponse;
import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;
import com.younghee.studycast.service.AuthService;
import com.younghee.studycast.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AuthController {
    
    private final UserService userService;
    private final AuthService authService;

    // 회원가입
    @PostMapping("/api/auth/signup")
    public Map<String, Object> signup(@RequestBody SignupRequest request) {
        
        userService.signup(request);

        return Map.of(
            "success", true,
            "message", "회원가입이 완료되었습니다."
        );
    }

    // 로그인
    @PostMapping("/api/auth/login")
    public AuthResponse logiResponse(@RequestBody UserDTO request) {
        
        log.info("로그인 API 요청: email={}", request.getUserEmail());

        return authService.login(request);
    }
    
    // Access Token 발급
    @PostMapping("/api/auth/refresh")
    public AuthResponse refresh(@RequestBody Map<String, String> request) {
        
        String refreshToken = request.get("refreshToken");

        return authService.refresh(refreshToken);
    }
    
    // 로그아웃
    @PostMapping("/api/auth/logout")
    public Map<String, Object> logout(
        @RequestBody Map<String, String> request,
        Authentication authentication
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();

        String refreshToken = request.get("refreshToken");

        authService.logout(refreshToken, userUuid);

        return Map.of(
            "success", true,
            "message", "로그아웃되었습니다."
        );
    }

    @PatchMapping("/api/auth/me")
    public Map<String, Object> updateMe(
        Authentication authentication,
        @RequestBody UserDTO request
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();
        userService.updateProfile(userUuid, request);

        return Map.of(
            "success", true,
            "message", "프로필이 저장되었습니다."
        );
    }

    @PostMapping("/api/auth/change-password")
    public Map<String, Object> changePassword(
        @RequestBody Map<String, String> request,
        Authentication authentication
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        authService.changePassword(userUuid, currentPassword, newPassword);

        return Map.of(
            "success", true,
            "message", "비밀번호가 변경되었습니다."
        );
    }

    @PostMapping("/api/auth/withdraw")
    public Map<String, Object> withdraw(
        @RequestBody Map<String, String> request,
        Authentication authentication
    ) {
        UUID userUuid = (UUID) authentication.getPrincipal();
        String password = request.get("password");

        authService.withdraw(userUuid, password);

        return Map.of(
            "success", true,
            "message", "탈퇴 처리되었습니다."
        );
    }
    
    // 인증 사용자 정보 조회
    @GetMapping("/api/auth/me")
    public UserDTO getMe(Authentication authentication) {
        
        UUID userUuid = (UUID) authentication.getPrincipal();

        return authService.getMe(userUuid);
    }
    
}