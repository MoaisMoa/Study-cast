package com.younghee.studycast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// 스터디방 입장 요청
public class RoomJoinRequest {
    
    private String joinCode;
}
