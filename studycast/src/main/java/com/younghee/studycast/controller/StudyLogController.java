package com.younghee.studycast.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.AccumulateStudyRequest;
import com.younghee.studycast.dto.response.MonthlyStudyResponse;
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

    // 스터디룸에 머무는 동안 주기적으로 호출 — 방 퇴장 전에도 오늘 누적 시간을 중간 저장 (크래시/비정상 종료 대비)
    @PostMapping("/accumulate")
    public ResponseEntity<Void> accumulateStudySeconds(
        Authentication authentication,
        @RequestBody AccumulateStudyRequest request
    ) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        UUID userUuid = (UUID) authentication.getPrincipal();
        int seconds = request.getStudySeconds() != null ? request.getStudySeconds() : 0;
        if (seconds > 0) {
            studyLogService.saveTodayStudySeconds(userUuid, seconds);
        }
        return ResponseEntity.ok().build();
    }

    // 캘린더 플래너 — 특정 연/월의 출석일/총 공부 시간/일별 공부 시간 조회
    @GetMapping("/monthly")
    public ResponseEntity<MonthlyStudyResponse> getMonthlyStats(
        Authentication authentication,
        @RequestParam int year,
        @RequestParam int month
    ) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        UUID userUuid = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(studyLogService.getMonthlyStats(userUuid, year, month));
    }
}