package com.younghee.dto;

import java.util.UUID;

// 실시간 세션 기록 DTO
public class StudySessionsDTO {
    private Long sessionNo; // 개별 접속 세션 식별 번호
    private Long roomNo;    // 학습을 진행한 스터디룸
    private UUID userUuid;  // 접속한 유저
}
