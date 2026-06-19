package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.request.MainRoomSearchRequest;
import com.younghee.studycast.dto.response.MainRoomResponse;
import com.younghee.studycast.dto.response.MainSummaryResponse;

@Mapper
public interface MainMapper {
    
    // 1. 생성 및 참여 스터디방 최대 3개 조회
    List<MainRoomResponse> findMyStudies(@Param("userUuid") UUID userUuid);

    // 2. 개인 학습 요약 조회
    MainSummaryResponse findMainSummary(@Param("userUuid") UUID userUuid);

    // 3. 관심 카테고리 기반 추천 스터디 조회
    List<MainRoomResponse> findRecommendedRooms(@Param("userUuid") UUID userUuid);

    // 4. 공개 스터디 목록 조회
    List<MainRoomResponse> findPublicRooms(
        @Param("request") MainRoomSearchRequest request,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    // 5. 비로그인 사용자용 최근 활동 추천 스터디 조회
    List<MainRoomResponse> findGuestRecommendedRooms();

    // 6. 내가 생성한 스터디 전체 조회 (종료 포함, 관리 페이지용)
    List<MainRoomResponse> findMyCreatedRooms(@Param("userUuid") UUID userUuid);
}
