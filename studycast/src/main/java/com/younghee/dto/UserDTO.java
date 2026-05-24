package com.younghee.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 사용자 정보 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID userUuid;
    private String userEmail;
    private String userPassword;
    private String userName;
    private String userProfileImage;
    private String userGender;
    private LocalDate userBirthDate;
    private String userBio;
    private String userStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
