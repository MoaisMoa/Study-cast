package com.younghee.studycast.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// 메인페이지 공개 스터디 페이지 조회 응답
public class MainRoomPageResponse {
    // 1. 현재 조회 목록
    private List<MainRoomResponse> rooms;

    // 2. 현재 페이지 정보
    private Integer page;
    private Integer size;

    // 3. 다음 데이터 존재 여부
    private Boolean last;
}
