package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.RoomCreateRequest;
import com.younghee.studycast.dto.RoomCreateResponse;
import com.younghee.studycast.service.RoomService;

import lombok.RequiredArgsConstructor;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {
    
    private final RoomService roomService;

    // 스터디방 생성
    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(
        Authentication authentication,
        @RequestBody RoomCreateRequest request,
        MultipartFile image
    ) {
        // 1. JWT 필터가 Access Token 검증
        // 2. Authentication에 사용자 UUID 저장
        // 3. Controller가 사용자 UUID 추출
        UUID userUuid = (UUID) authentication.getPrincipal();
        // 4. RoomService.createRoom() 호출
        RoomCreateResponse response = roomService.createRoom(userUuid, request, image);
        // 5. 방 생성 성공
        // 6. HTTP 201 Created + RoomCreateResponse 반환
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    
}
