package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenDTO {
    private Long tokenNo;               // Refresh Token 식별 번호
    private UUID userUuid;              // 사용자 식별 번호
    private String tokenHash;           // Refresh Token SHA-256 해시값
    private LocalDateTime expiryDate;   // Refresh Token 만료 시간
    private boolean revoked;            // 토큰 폐기 여부 false(사용 가능) / true(폐기)
    private LocalDateTime createdAt;    // Refresh Token 생성 일시
}
