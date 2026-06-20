package com.younghee.studycast.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.WeekPlanRequest;
import com.younghee.studycast.dto.response.WeekPlanResponse;
import com.younghee.studycast.service.WeekPlanService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/week-plans")
public class WeekPlanController {

    private final WeekPlanService weekPlanService;

    @GetMapping
    public ResponseEntity<List<WeekPlanResponse>> getWeekPlans(Authentication authentication) {
        return ResponseEntity.ok(weekPlanService.getWeekPlans(extractUuid(authentication)));
    }

    @PostMapping
    public ResponseEntity<Void> createWeekPlan(
            Authentication authentication,
            @RequestBody WeekPlanRequest request) {
        weekPlanService.createWeekPlan(extractUuid(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{planNo}")
    public ResponseEntity<Void> updateWeekPlan(
            Authentication authentication,
            @PathVariable Long planNo,
            @RequestBody WeekPlanRequest request) {
        weekPlanService.updateWeekPlan(extractUuid(authentication), planNo, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{planNo}")
    public ResponseEntity<Void> deleteWeekPlan(
            Authentication authentication,
            @PathVariable Long planNo) {
        weekPlanService.deleteWeekPlan(extractUuid(authentication), planNo);
        return ResponseEntity.noContent().build();
    }

    private UUID extractUuid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        return (UUID) authentication.getPrincipal();
    }
}
