package com.younghee.studycast.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// 스터디방 입장 결과 응답
public class RoomJoinResponse {
    
    private Long roomNo;
    private Boolean joined;
    private Integer currentUsers;
    private Integer maxUsers;
    private LocalDateTime joinedAt;
    private String message;
}
