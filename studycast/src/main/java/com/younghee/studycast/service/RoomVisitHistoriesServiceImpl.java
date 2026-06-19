package com.younghee.studycast.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RoomVisitHistoriesMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.request.RoomVisitSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomVisitHistoriesServiceImpl implements RoomVisitHistoriesService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 20;

    private final RoomVisitHistoriesMapper roomVisitHistoriesMapper;
    private final RoomsMapper roomsMapper;

    // 방문 기록 저장 또는 갱신
    @Override
    @Transactional
    public void recordVisit(Long roomNo, UUID userUuid) {
        validateRoomNo(roomNo);
        validateUserUuid(userUuid);

        RoomsDTO room = roomsMapper.findByRoomNo(roomNo);

        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }

        roomVisitHistoriesMapper.upsertVisitHistory(roomNo, userUuid);
    }

    // 최근 방문한 방 조회
    @Override
    @Transactional
    public MainRoomPageResponse getRecentVisitedRooms(UUID userUuid, RoomVisitSearchRequest request) {
        validateUserUuid(userUuid);

        RoomVisitSearchRequest normalized = normalizeRequest(request);

        int page = normalized.getPage();
        int size = normalized.getSize();
        int limit = size + 1;
        int offset = page * size;

        roomVisitHistoriesMapper.deleteExpiredVisitHistoriesByUserUuid(userUuid);

        List<MainRoomResponse> rooms =
            roomVisitHistoriesMapper.findRecentVisitedRooms(userUuid, limit, offset);

        boolean last = rooms.size() <= size;

        if (rooms.size() > size) {
            rooms = rooms.subList(0, size);
        }

        return new MainRoomPageResponse(rooms, page, size, last);
    }

    // 자주 방문한 방 조회
    @Override
    @Transactional
    public MainRoomPageResponse getFrequentVisitedRooms(UUID userUuid, RoomVisitSearchRequest request) {
        validateUserUuid(userUuid);

        RoomVisitSearchRequest normalized = normalizeRequest(request);

        int page = normalized.getPage();
        int size = normalized.getSize();
        int limit = size + 1;
        int offset = page * size;

        roomVisitHistoriesMapper.deleteExpiredVisitHistoriesByUserUuid(userUuid);

        List<MainRoomResponse> rooms =
            roomVisitHistoriesMapper.findFrequentVisitedRooms(userUuid, limit, offset);

        boolean last = rooms.size() <= size;

        if (rooms.size() > size) {
            rooms = rooms.subList(0, size);
        }

        return new MainRoomPageResponse(rooms, page, size, last);
    }

    private RoomVisitSearchRequest normalizeRequest(RoomVisitSearchRequest request) {
        if (request == null) {
            request = new RoomVisitSearchRequest();
        }

        if (request.getPage() == null) {
            request.setPage(DEFAULT_PAGE);
        }

        if (request.getSize() == null) {
            request.setSize(DEFAULT_SIZE);
        }

        if (request.getPage() < 0) {
            throw new IllegalArgumentException("페이지 번호는 0 이상이어야 합니다.");
        }

        if (request.getSize() <= 0) {
            throw new IllegalArgumentException("페이지 크기는 1 이상이어야 합니다.");
        }

        if (request.getSize() > MAX_SIZE) {
            request.setSize(MAX_SIZE);
        }

        return request;
    }

    private void validateRoomNo(Long roomNo) {
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("방 번호가 올바르지 않습니다.");
        }
    }

    private void validateUserUuid(UUID userUuid) {
        if (userUuid == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
    }
}
