package com.younghee.studycast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 사용자 정보 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID userUuid;              // uuid (사용자 식별)
    private String userEmail;           // 이메일 (아이디)
    private String userPassword;        // 비밀번호
    private String userName;            // 사용자 이름
    private boolean nameChangeAvailable; // 이름 변경 가능 여부 (소셜 가입 시 true, 1회 사용 후 false)
    private String userProfileImage;    // 사용자 프로필 이미지 URL
    private String userGender;          // 성별
    private LocalDate userBirthDate;    // 생년월일
    private String userMotto;           // 내 각오 (최대 20자)
    private List<String> categories;    // 관심 카테고리 목록
    private boolean hasPassword;        // 비밀번호 등록 여부 (소셜 전용 계정이면 false) — getMe() 응답에서만 채워짐
    private String userStatus;          // 사용자 상태 ACTIVE, INACTIVE
    private LocalDateTime createdAt;    // 회원 가입 일시
    private LocalDateTime updatedAt;    // 회원 정보 수정 일시
    private LocalDateTime deletedAt;    // 회원 탈퇴 일시
}
