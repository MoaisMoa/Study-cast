package com.younghee.controller;

import org.springframework.web.bind.annotation.RestController;

import com.younghee.service.AuthService;
import com.younghee.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
public class AuthController {
    
    private final UserService userService;
    private final AuthService authService;

    // 회원가입
    // 로그인
    // Access Token 발급
    // 로그아웃
    // 인증 사용자 정보 조회
}
