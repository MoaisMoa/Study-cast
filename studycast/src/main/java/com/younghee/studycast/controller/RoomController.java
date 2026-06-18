package com.younghee.studycast.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.request.LeaveRoomRequest;
import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.request.RoomJoinRequest;
import com.younghee.studycast.dto.request.RoomUpdateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.LiveKitTokenResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;
import com.younghee.studycast.dto.response.RoomDetailResponse;
import com.younghee.studycast.dto.response.RoomJoinResponse;
import com.younghee.studycast.dto.response.RoomParticipantResponse;
import com.younghee.studycast.dto.response.RoomUpdateResponse;
import com.younghee.studycast.service.LiveKitTokenService;
import com.younghee.studycast.service.RoomService;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {
    
    private final RoomService roomService;
    private final LiveKitTokenService liveKitTokenService;

    // 스터디방 생성
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RoomCreateResponse> createRoom(
        Authentication authentication,
        @RequestPart("request") RoomCreateRequest request,
        @RequestPart(value = "image", required = false)
        MultipartFile image
    ) {
        // 1. JWT 인증 정보에서 로그인 사용자 UUID 조회
        UUID userUuid = getUserUuid(authentication);
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

    // 추가) 스터디방 상세 페이지
    // 스터디방 상세 페이지 헤더 조회
    @GetMapping("/{roomNo}")
    public ResponseEntity<RoomDetailResponse> getRoomDetail(
        @PathVariable long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = getUserUuid(authentication);

        RoomDetailResponse response = roomService.getRoomDetail(roomNo, userUuid);

        return ResponseEntity.ok(response);
    }

    // 스터디방 입장 처리
    @PostMapping("/{roomNo}/join")
    public ResponseEntity<RoomJoinResponse> joinRoom(
        @PathVariable Long roomNo,
        @RequestBody(required = false) RoomJoinRequest request,
        Authentication authentication    
    ) {
        UUID userUuid = getUserUuid(authentication);

        RoomJoinResponse response = roomService.joinRoom(roomNo, userUuid, request);

        return ResponseEntity.ok(response);
    }
    
    // 스터디방 active 참여자 목록 조회
    @GetMapping("/{roomNo}/participants")
    public ResponseEntity<List<RoomParticipantResponse>> getActiveParticipants(
        @PathVariable Long roomNo
    ) {
        List<RoomParticipantResponse> response = roomService.getActiveParticipants(roomNo);

        return ResponseEntity.ok(response);
    }

    // LiveKit 접속 토큰 발급
    @GetMapping("/{roomNo}/token")
    public ResponseEntity<LiveKitTokenResponse> getLiveKitToken(
        @PathVariable Long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = getUserUuid(authentication);

        LiveKitTokenResponse response =
            liveKitTokenService.issueRoomToken(roomNo, userUuid);

        return ResponseEntity.ok(response);
    }
    
    // 스터디방 퇴장 처리 + 공부시간 저장
    @DeleteMapping("/{roomNo}/leave")
    public ResponseEntity<Void> leaveRoom(
        @PathVariable Long roomNo,
        @RequestBody(required = false) LeaveRoomRequest request,
        Authentication authentication
    ) {
        UUID userUuid = getUserUuid(authentication);
        int studiedSeconds = (request != null && request.getStudiedSeconds() != null)
            ? Math.max(0, request.getStudiedSeconds())
            : 0;
        roomService.leaveRoom(roomNo, userUuid, studiedSeconds);

        return ResponseEntity.noContent().build();
    }

    
    // 스터디방 설정 업데이트 (방장 전용)
    @PatchMapping(value = "/{roomNo}/settings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RoomUpdateResponse> updateRoomSettings(
        @PathVariable Long roomNo,
        @RequestPart("request") RoomUpdateRequest request,
        @RequestPart(value = "image", required = false) MultipartFile image,
        Authentication authentication
    ) {
        UUID userUuid = getUserUuid(authentication);
        RoomUpdateResponse response = roomService.updateRoomSettings(roomNo, userUuid, request, image);
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
