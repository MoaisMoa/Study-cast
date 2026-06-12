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
// 메인페이지 / 방문한 방 / 내 스터디 카드 공통 응답
public class MainRoomResponse {
    
    // 1. 스터디방 기본 정보
    private Long roomNo;
    private String roomTitle;
    private String roomThumbnail;

    // 2. 카테고리 정보
    private Integer categoryNo;
    private String categoryName;

    // 3. 참여 인원 정보
    private Integer currentUsers;
    private Integer maxUsers;

    // 4. 카드 표시 정보
    private Boolean live;
    private Boolean newRoom;
    private Boolean full;
    private Boolean premium;
    private Boolean joinable;

    // 5. 기간 / 방문 정보
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
    private LocalDateTime lastVisitedAt;

    // 5. 추후 연결 정보
    private Long averageStudySeconds;
}
