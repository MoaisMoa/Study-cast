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
// 스터디방 상세 페이지 헤더 응답
public class RoomDetailResponse {
    
    private Long roomNo;
    private String roomTitle;
    private String roomNotice;
    private String roomThumbnail;

    private Long categoryNo;
    private String categoryName;

    private Integer currentUsers;
    private Integer maxUsers;

    private Boolean roomPrivate;
    private String roomPassword;
    private Boolean owner;
    private Boolean expired;

    private Boolean cameraStatus;
    private Boolean micStatus;

    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}
