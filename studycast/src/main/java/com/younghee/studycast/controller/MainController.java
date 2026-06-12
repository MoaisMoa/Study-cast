package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.MainRoomSearchRequest;
import com.younghee.studycast.dto.response.MainRoomPageResponse;
import com.younghee.studycast.dto.response.MainRoomResponse;
import com.younghee.studycast.dto.response.MainSummaryResponse;
import com.younghee.studycast.service.MainService;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/main")
public class MainController {
    
    private final MainService mainService;

    // 1. 내 스터디 조회
    @GetMapping("/my-studies")
    public ResponseEntity<List<MainRoomResponse>> getMyStudies(Authentication authentication) {
        // 1. 인증 사용자 UUID 추출
        UUID userUuid = getUserUuid(authentication);

        // 2. 내 스터디 조회
        List<MainRoomResponse> response = mainService.getMyStudies(userUuid);

        // 3. 응답 반환
        return ResponseEntity.ok(response);
    }
    
    // 2. 개인 학습 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<MainSummaryResponse> getMainSummary(Authentication authentication) {
        // 1. 인증 사용자 UUID 추출
        UUID userUuid = getUserUuid(authentication);

        // 2. 개인 학습 요약 조회
        MainSummaryResponse response = mainService.getMainSummary(userUuid);

        // 3. 응답 반환
        return ResponseEntity.ok(response);
    }
    
    // 3. 추천 스터디 조회
    @GetMapping("/recommendations")
    public ResponseEntity<List<MainRoomResponse>> getRecommendedRooms(Authentication authentication) {
        // 1. 인증 사용자 UUID 추출
        UUID userUuid = getUserUuid(authentication);

        // 2. 추천 스터디 조회
        List<MainRoomResponse> response = mainService.getRecommendedRooms(userUuid);

        // 3. 응답 반환
        return ResponseEntity.ok(response);
    }
    
    // 4. 공개 스터디 목록 조회 (비로그인 허용)
    @GetMapping("/rooms")
    public ResponseEntity<MainRoomPageResponse> getPublicRooms(
        @ModelAttribute MainRoomSearchRequest request
    ) {
        // 1. 공개 스터디 목록 조회
        MainRoomPageResponse response = mainService.getPublicRooms(request);

        // 2. 응답 반환
        return ResponseEntity.ok(response);
    }

    // 5. 비로그인 사용자용 최근 활동 추천 스터디 조회
    @GetMapping("/guest-recommendations")
    public ResponseEntity<List<MainRoomResponse>> getGuestRecommendedRooms() {
        List<MainRoomResponse> response = mainService.getGuestRecommendedRooms();
        return ResponseEntity.ok(response);
    }
    
    // 6. JWT 인증 객체에서 사용자 UUID 추출
    private UUID getUserUuid(Authentication authentication) {
        // 1. 인증 객체 누락 방어
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        // 2. principal을 UUID로 변환
        return (UUID) authentication.getPrincipal();
    }

}
