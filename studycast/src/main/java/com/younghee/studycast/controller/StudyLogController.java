package com.younghee.studycast.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.response.TodayStudyResponse;
import com.younghee.studycast.service.StudyLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/study-logs")
public class StudyLogController {

    private final StudyLogService studyLogService;

    // 오늘 누적 공부 시간 조회
    @GetMapping("/today")
    public ResponseEntity<TodayStudyResponse> getTodayStudySeconds(
        Authentication authentication
    ) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        UUID userUuid = (UUID) authentication.getPrincipal();
        int totalSeconds = studyLogService.getTodayStudySeconds(userUuid);
        return ResponseEntity.ok(new TodayStudyResponse(totalSeconds));
    }
}
