package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.PasswordResetRequest;
import com.younghee.studycast.service.PasswordResetService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@Slf4j
@RestController
@RequiredArgsConstructor
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;

    // 비밀번호 재설정 인증번호 발송
    @PostMapping("/api/auth/password/send-code")
    public Map<String,Object> sendCodeMap(@RequestBody Map<String, String> request) {
        
        String userEmail = request.get("userEmail");

        passwordResetService.sendCode(userEmail);

        return Map.of(
            "success", true,
            "message", "인증번호가 발송되었습니다."
        );
    }
    
    // 비밀번호 재설정 인증번호 확인
    @PostMapping("/api/auth/password/verify-code")
    public Map<String, Object> verifyCode(@RequestBody Map<String, String> request) {
        
        String userEmail = request.get("userEmail");
        String verificationCode = request.get("verificationCode");

        passwordResetService.verifyCode(userEmail, verificationCode);
        
        return Map.of(
            "success", true,
            "message", "인증번호가 확인되었습니다."
        );
    }
    
    // 새 비밀번호로 변경
    @PostMapping("/api/auth/password/reset")
    public Map<String, Object> resetPassword(@RequestBody PasswordResetRequest request) {
        
        passwordResetService.resetPassword(request);
        
        return Map.of(
            "success", true,
            "message", "비밀번호가 변경되었습니다."
        );
    }
    
}
