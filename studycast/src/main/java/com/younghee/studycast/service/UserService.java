package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.UserDTO;
import com.younghee.studycast.dto.request.SignupRequest;

public interface UserService {
    // 회원가입
    int signup(SignupRequest request);
    // 프로필
    void updateProfile(UUID userUuid, UserDTO dto);
}
