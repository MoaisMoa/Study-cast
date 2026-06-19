package com.younghee.studycast.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.MainMapper;
import com.younghee.studycast.dto.request.MainRoomSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;
import com.younghee.studycast.dto.response.MainSummaryResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainServiceImpl implements MainService {
    
    private final MainMapper mainMapper;

    private static final Set<String> ALLOWED_TABS = Set.of("ALL", "NEW");
    private static final Set<String> ALLOWED_ROOM_TYPES = Set.of("ALL", "FREE", "PREMIUM");

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 20;

    @Override
    public List<MainRoomResponse> getMyStudies(UUID userUuid) {
        // 1. 인증 사용자 UUID 검증 (로그인 여부)
        validateUserUuid(userUuid);

        // 2. 내 스터디 조회
        return mainMapper.findMyStudies(userUuid);
    }

    @Override
    public MainSummaryResponse getMainSummary(UUID userUuid) {
        // 1. 인증 사용자 UUID 검증
        validateUserUuid(userUuid);

        // 2. 개인 학습 요약 조회
        return mainMapper.findMainSummary(userUuid);
    }

    @Override
    public List<MainRoomResponse> getRecommendedRooms(UUID userUuid) {
        // 1. 인증 사용자 UUID 검증
        validateUserUuid(userUuid);

        // 2. 추천 스터디 조회
        return mainMapper.findRecommendedRooms(userUuid);
    }

    @Override
    public MainRoomPageResponse getPublicRooms(MainRoomSearchRequest request) {
        // 1. 요청값 기본값 설정
        MainRoomSearchRequest normalizedRequest = normalizeSearchRequest(request);

        // 2. page / size 계산
        int page = normalizedRequest.getPage();
        int size = normalizedRequest.getSize();
        int limit = size + 1;
        int offset = page * size;

        // 3. size + 1개 조회
        List<MainRoomResponse> rooms = mainMapper.findPublicRooms(
            normalizedRequest, 
            limit, 
            offset
        );

        // 4. 마지막 페이지 여부 판단
        boolean last = rooms.size() <= size;

        // 5. size + 1개가 조회된 경우 화면에는 size개만 반환
        if (rooms.size() > size) {
            rooms = rooms.subList(0, size);
        }

        // 6. 페이지 응답 반환
        return new MainRoomPageResponse(rooms, page, size, last);
        
    }

    @Override
    public List<MainRoomResponse> getGuestRecommendedRooms() {
        return mainMapper.findGuestRecommendedRooms();
    }

    @Override
    public List<MainRoomResponse> getMyCreatedRooms(UUID userUuid) {
        validateUserUuid(userUuid);
        return mainMapper.findMyCreatedRooms(userUuid);
    }

    private void validateUserUuid(UUID userUuid) {
        // 인증 사용자 UUID 누락 방어
        if (userUuid == null) {
            throw new IllegalArgumentException("인증 사용자 정보가 없습니다.");
        }
    }

    private MainRoomSearchRequest normalizeSearchRequest(MainRoomSearchRequest request) {
        // 1. 요청 객체가 없으면 기본 요청 생성
        if (request == null) {
            request = new MainRoomSearchRequest();
        }
        // 2. tab 기본값 설정
        if (request.getTab() == null || request.getTab().isBlank()) {
            request.setTab("ALL");
        }
        // 3. roomType 기본값 설정
        if (request.getRoomType() == null || request.getRoomType().isBlank()) {
            request.setRoomType("ALL");
        }
        // 4. joinableOnly 기본값 설정
        if (request.getJoinableOnly() == null) {
            request.setJoinableOnly(false);
        }
        // 5. page 기본값 설정
        if (request.getPage() == null) {
            request.setPage(DEFAULT_PAGE);
        }
        // 6. size 기본값 설정
        if (request.getSize() == null) {
            request.setSize(DEFAULT_SIZE);
        }
        // 7. tab / roomType 정규화 (대문자 변환)
        request.setTab(request.getTab().trim().toUpperCase());
        request.setRoomType(request.getRoomType().trim().toUpperCase());

        // 8. tab 검증
        if (!ALLOWED_TABS.contains(request.getTab())) {
            throw new IllegalArgumentException("잘못된 탭 값입니다.");
        }
        // 9. roomType 검증
        if (!ALLOWED_ROOM_TYPES.contains(request.getRoomType())) {
            throw new IllegalArgumentException("잘못된 스터디 유형 값입니다.");
        }
        // 10. page 검증
        if (request.getPage() < 0) {
            throw new IllegalArgumentException("페이지 번호는 0 이상이어야 합니다.");
        }
        // 11. size 검증
        if (request.getSize() <= 0) {
            throw new IllegalArgumentException("페이지 크기는 1 이상이어야 합니다.");
        }
        // 12. size 상한 제한
        if (request.getSize() > MAX_SIZE) {
            request.setSize(MAX_SIZE);
        }

        return request;
    }
    
}
