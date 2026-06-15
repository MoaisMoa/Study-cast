package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// 방 참여자 DB 저장/조회용
public class RoomParticipantDTO {

    private Long partNo;
    private UUID userUuid;
    private Long roomNo;

    private Boolean cameraStatus;
    private Boolean micStatus;

    // 방 상세페이지 추가
    private Boolean active;             // 현재 참여 중인지 확인
    private LocalDateTime joinedAt;     // 입장 시간 저장, 공부시간 계산
    private LocalDateTime leftAt;       // 퇴장 시간 저장
    private LocalDateTime createdAt;    // 최초 참여 이력
    private LocalDateTime updatedAt;    // 재입장/퇴장 갱신 시간
}
