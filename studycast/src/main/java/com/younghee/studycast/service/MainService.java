package com.younghee.studycast.service;

import java.util.List;
import java.util.UUID;

import com.younghee.studycast.dto.request.MainRoomSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;
import com.younghee.studycast.dto.response.MainSummaryResponse;

public interface MainService {
    // 1. 내 스터디 조회
    List<MainRoomResponse> getMyStudies(UUID userUuid);

    // 2. 개인 학습 요약 조회
    MainSummaryResponse getMainSummary(UUID userUuid);

    // 3. 추천 스터디 조회
    List<MainRoomResponse> getRecommendedRooms(UUID userUuid);

    // 4. 공개 스터디 목록 조회
    MainRoomPageResponse getPublicRooms(MainRoomSearchRequest request);

    // 5. 비로그인 시 추천 스터디 조회
    List<MainRoomResponse> getGuestRecommendedRooms();

    // 6. 내가 생성한 스터디 전체 조회 (종료 포함, 관리 페이지용)
    List<MainRoomResponse> getMyCreatedRooms(UUID userUuid);
}
