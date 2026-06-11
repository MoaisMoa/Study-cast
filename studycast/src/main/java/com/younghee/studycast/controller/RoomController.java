package com.younghee.studycast.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;
import com.younghee.studycast.service.RoomService;

import lombok.RequiredArgsConstructor;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {
    
    private final RoomService roomService;

    // 스터디방 생성
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RoomCreateResponse> createRoom(
        Authentication authentication,
        @RequestPart("request") RoomCreateRequest request,
        @RequestPart(value = "image", required = false)
        MultipartFile image
    ) {
        // 1. JWT 인증 정보에서 로그인 사용자 UUID 조회
        UUID userUuid = (UUID) authentication.getPrincipal();
        // 2. RoomService.createRoom() 호출
        RoomCreateResponse response = roomService.createRoom(userUuid, request, image);
        // 3. HTTP 201 Created + RoomCreateResponse 반환
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    
    // 참여 코드 조회
    @GetMapping("/check-code")
    public ResponseEntity<JoinCodeCheckResponse> checkJoinCodeDuplicate(
        @RequestParam("code") String code
    ) {
        JoinCodeCheckResponse response =
            roomService.checkJoinCodeDuplicate(code);

        return ResponseEntity.ok(response);
    }
    
}
