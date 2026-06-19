package com.younghee.studycast.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 실시간 세션 기록 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudySessionsDTO {
    private Long sessionNo; // 개별 접속 세션 식별 번호
    private Long roomNo;    // 학습을 진행한 스터디룸
    private UUID userUuid;  // 접속한 유저
}
