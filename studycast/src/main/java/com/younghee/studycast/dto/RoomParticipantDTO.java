package com.younghee.studycast.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 스터디룸 참여 현황 DTO

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomParticipantDTO {
    private Long partNo;            // 참여 이력 식별자
    private UUID userUuid;          // 회원 고유 번호
    private Long roomNo;            // 방 고유 번호
    private boolean cameraStatus;   // 카메라 상태
    private boolean micStatus;      // 마이크 상태
}
