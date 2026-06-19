package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class UserAuthDTO {
    private Long authNo;
    private UUID userUuid;

    private String provider;
    private String providerUserId;
    private String providerEmail;
    private String providerName;
    private String providerProfileImage;

    private LocalDateTime connectedAt;
    private LocalDateTime lastLoginAt;
}
