package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.response.MainRoomResponse;

@Mapper
public interface RoomVisitHistoriesMapper {

    // 3개월 지난 방문 기록 삭제
    int deleteExpiredVisitHistoriesByUserUuid(@Param("userUuid") UUID userUuid);
    
    // 방문 기록 저장 또는 갱신
    int upsertVisitHistory(
        @Param("roomNo") Long roomNo,
        @Param("userUuid") UUID userUuid
    );

    // 최근 방문한 방 조회
    List<MainRoomResponse> findRecentVisitedRooms(
        @Param("userUuid") UUID userUuid,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    // 자주 방문한 방 조회
    List<MainRoomResponse> findFrequentVisitedRooms(
        @Param("userUuid") UUID userUuid,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
}
