package com.younghee.studycast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// 회원가입 요청 받는 전용 DTO
public class SignupRequest {
    // 회원가입 아이디로 사용할 이메일
    private String userEmail;
    // 비밀번호
    private String userPassword;
    // 비밀번호 확인
    private String userPasswordConfirm;
    // 사용자 이름
    private String userName;
    // 소셜 전용 계정에 비밀번호를 연결할 때 사용하는 인증번호 (선택)
    private String verificationCode;
}
