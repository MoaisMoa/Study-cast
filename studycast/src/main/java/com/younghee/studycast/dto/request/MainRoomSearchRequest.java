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

    // 3. 스터디 유형 필터 (ALL / FREE / PREMIUM) — UI에서 잠시 주석 처리됨, 추후 프리미엄 확장 시 재사용 예정. 삭제하지 말 것
    private String roomType;

    // 3-1. 공개/비공개 필터 (ALL / PUBLIC / PRIVATE) — roomType(일반/프리미엄) 대신 메인페이지 필터로 사용
    private String visibility;

    // 4. 바로 참여 가능한 방만 조회
    private Boolean joinableOnly;

    // 6. 키워드 검색 (방 제목 / 카테고리명)
    private String keyword;

    // 5. 페이지네이션
    private Integer page;
    private Integer size;
}
