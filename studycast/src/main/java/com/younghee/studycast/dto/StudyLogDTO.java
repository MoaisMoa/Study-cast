package com.younghee.studycast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 일일 공부 기록 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyLogDTO {
    private Long logNo;                 // 기록 고유 번호
    private UUID userUuid;              // 회원 고유 번호
    private LocalDate studyDate;        // 학습 날짜
    private int totalSeconds;           // 총 공부 시간
    private LocalDateTime updatedAt;    // 마지막 업데이트
}
