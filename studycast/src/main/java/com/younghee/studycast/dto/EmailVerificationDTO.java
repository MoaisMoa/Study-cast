package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationDTO {
    
    private Long verificationNo;        // 인증번호 기록 식별 번호
    private UUID userUuid;              // 인증번호 회원 식별
    private String userEmail;           // 인증번호 발송한 이메일
    private String verificationCode;    // 인증번호 (BCrypt 해시)
    private String purpose;             // 인증 목적
    private boolean verified;           // 인증번호 확인 성공 여부
    private boolean used;               // 비밀번호 변경에 이미 사용했는지 여부 (true 시 재사용 불가)
    private int attemptCount;           // 인증번호 입력 실패 횟수 (3회 제한)
    private LocalDateTime expiryDate;   // 인증번호 만료 시간 (5분 제한)
    private LocalDateTime createdAt;    // 인증번호 생성 시간
    private LocalDateTime verifiedAt;   // 인증번호 확인 성공 시간
    private LocalDateTime usedAt;       // 비밀번호 변경 완료 시간
}
