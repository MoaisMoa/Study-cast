package com.younghee.studycast.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// 프론트에서 방 생성 요청 받을 때
public class RoomCreateRequest {
    
    private String roomTitle;       // 방 제목
    private Boolean roomPrivate;    // 방 비공개 여부
    private String roomPassword;    // 비공개 방 참여 코드
    private Integer maxUsers;       // 방 최대 인원수
    private LocalDate expiredAt;    // 종료일
    private Boolean cameraStatus;   // 카메라 On/Off 
    private Boolean micStatus;      // 마이크 On/Off
    private Long categoryNo;        // 관심 카테고리
    private String roomNotice;      // 방 공지사항
}
