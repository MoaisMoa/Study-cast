package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.request.RoomVisitSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;

public interface RoomVisitHistoriesService {

    // 방문 기록 저장 또는 갱신
    void recordVisit(Long roomNo, UUID userUuid);

    // 최근 방문한 방 조회
    MainRoomPageResponse getRecentVisitedRooms(UUID userUuid, RoomVisitSearchRequest request);

    // 자주 방문한 방 조회
    MainRoomPageResponse getFrequentVisitedRooms(UUID userUuid, RoomVisitSearchRequest request);
}
