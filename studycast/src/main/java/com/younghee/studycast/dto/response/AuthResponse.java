package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// JWT 로그인 성공 응답용 (프론트에 전달)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    // API 요청 시 인증에  사용하는 짧은 수명의 토큰
    private String accessToken;
    // Access Token 재발급에 사용하는 긴 수명의 토큰
    private String refreshToken;
}
