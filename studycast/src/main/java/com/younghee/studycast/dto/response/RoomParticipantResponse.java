package com.younghee.studycast.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// 스터디방 상세 페이지 참여자 목록 응답
public class RoomParticipantResponse {
    
    private UUID userUuid;
    private String userName;
    private String profileImage;

    private Boolean owner;
    private Boolean cameraStatus;
    private Boolean micStatus;

    private LocalDateTime joinedAt;
}
