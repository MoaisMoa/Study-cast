package com.younghee.studycast.dto;

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
}
