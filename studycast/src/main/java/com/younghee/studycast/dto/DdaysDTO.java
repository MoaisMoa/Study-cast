package com.younghee.studycast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// D-day DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DdaysDTO {
    private Long ddayNo;                // 디데이 고유 번호
    private UUID userUuid;              // 회원 고유 번호
    private String ddayTitle;           // 목표 제목
    private LocalDate targetDate;       // 목표 날짜
    private boolean isMain;             // 디데이 노출 여부
    private LocalDateTime createdAt;    // 생성 일시
    private LocalDateTime updatedAt;    // 수정 일시
}
