package com.younghee.studycast.service;

import com.younghee.studycast.dto.request.SignupRequest;

public interface UserService {
    // 회원가입
    int signup(SignupRequest request);
}
