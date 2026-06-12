package com.younghee.studycast.dto.request;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// 메인페이지 공개 스터디 목록 조회 조건
public class MainRoomSearchRequest {
    
    // 1. 전체 또는 신규 탭 (ALL / NEW)
    private String tab;

    // 2. 복수 카테고리 필터
    private List<Integer> categoryNos;

    // 3. 스터디 유형 필터 (ALL / FREE / PREMIUM)
    private String roomType;

    // 4. 바로 참여 가능한 방만 조회
    private Boolean joinableOnly;

    // 5. 페이지네이션
    private Integer page;
    private Integer size;
}
