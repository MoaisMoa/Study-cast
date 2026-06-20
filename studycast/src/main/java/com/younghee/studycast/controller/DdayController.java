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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.request.DdayCreateRequest;
import com.younghee.studycast.dto.response.DdayResponse;
import com.younghee.studycast.service.DdayService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ddays")
public class DdayController {

    private final DdayService ddayService;

    // 내 디데이 목록 조회
    @GetMapping
    public ResponseEntity<List<DdayResponse>> getDdays(Authentication authentication) {
        UUID userUuid = extractUuid(authentication);
        return ResponseEntity.ok(ddayService.getDdays(userUuid));
    }

    // 디데이 등록
    @PostMapping
    public ResponseEntity<Void> createDday(
            Authentication authentication,
            @RequestBody DdayCreateRequest request) {
        UUID userUuid = extractUuid(authentication);
        ddayService.createDday(userUuid, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 디데이 삭제
    @DeleteMapping("/{ddayNo}")
    public ResponseEntity<Void> deleteDday(
            Authentication authentication,
            @PathVariable Long ddayNo) {
        UUID userUuid = extractUuid(authentication);
        ddayService.deleteDday(userUuid, ddayNo);
        return ResponseEntity.noContent().build();
    }

    private UUID extractUuid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        return (UUID) authentication.getPrincipal();
    }
}
