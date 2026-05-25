package com.younghee.studycast.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private Integer roleCode;   // 권한 식별 번호
    private UUID userUuid;      // 사용자 식별 번호
    private String role;        // 사용자 권한 ROLE_USER(DEFAULT) / ROLE_ADMIN
}
