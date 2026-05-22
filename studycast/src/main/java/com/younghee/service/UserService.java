package com.younghee.service;

import com.younghee.dto.SignupRequest;

public interface UserService {
    // 회원가입
    int signup(SignupRequest request);
}
