package com.younghee.studycast.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetRequest {
    private String userEmail;           // 회원 이메일
    private String verificationCode;    // 발송받은 인증번호
    private String newPassword;         // 새 비밀번호
    private String newPasswordConfirm;  // 새 비밀번호 확인
}
