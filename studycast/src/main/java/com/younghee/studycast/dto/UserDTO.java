package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID userUuid;              // uuid (사용자 식별)
    private String userEmail;           // 이메일 (아이디)
    private String userPassword;        // 비밀번호
    private String userName;            // 사용자 이름
    private String userProfileImage;    // 사용자 프로필 이미지 URL
    private String userStatus;          // 사용자 상태 ACTIVE, INACTIVE
    private LocalDateTime createdAt;    // 회원 가입 일시
    private LocalDateTime updatedAt;    // 회원 정보 수정 일시
    private LocalDateTime deletedAt;    // 회원 탈퇴 일시
}
