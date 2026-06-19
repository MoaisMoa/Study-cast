package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.RoomVisitSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.service.RoomVisitHistoriesService;

import lombok.RequiredArgsConstructor;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/visited-rooms")
public class RoomVisitHistoriesController {
    
    private final RoomVisitHistoriesService roomVisitHistoriesService;

    // 1. 방문 기록 저장 또는 갱신
    @PostMapping("/{roomNo}")
    public ResponseEntity<Void> recordVisit(
        @PathVariable Long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = getUserUuid(authentication);

        roomVisitHistoriesService.recordVisit(roomNo, userUuid);

        return ResponseEntity.ok().build();
    }
    
    // 2. 최근 방문한 방 조회
    @GetMapping("/recent")
    public ResponseEntity<MainRoomPageResponse> getRecentVisitedRooms(
        Authentication authentication,
        @ModelAttribute RoomVisitSearchRequest request
    ) {
        UUID userUuid = getUserUuid(authentication);

        MainRoomPageResponse response =
            roomVisitHistoriesService.getRecentVisitedRooms(userUuid, request);
        
        return ResponseEntity.ok(response);
    }
    
    // 3. 자주 방문한 방 조회
    @GetMapping("/frequent")
    public ResponseEntity<MainRoomPageResponse> getFrequentVisitedRooms(
        Authentication authentication,
        @ModelAttribute RoomVisitSearchRequest request
    ) {
        UUID userUuid = getUserUuid(authentication);

        MainRoomPageResponse response =
            roomVisitHistoriesService.getFrequentVisitedRooms(userUuid, request);
        
        return ResponseEntity.ok(response);
    }
    
    // 인증 객체에서 로그인 사용자 UUID 추출
    private UUID getUserUuid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }

        return (UUID) authentication.getPrincipal();
    }
}
