package com.younghee.studycast.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// 방문한 방 목록 조회 조건
public class RoomVisitSearchRequest {
    
    // 페이지네이션
    private Integer page;
    private Integer size;
}
