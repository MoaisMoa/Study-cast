package com.younghee.studycast.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.RoomCreateRequest;
import com.younghee.studycast.dto.RoomNoticeRequest;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.service.RoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomsDTO> createRoom(
        @RequestBody RoomCreateRequest request,
        Authentication authentication
    ) {
        UUID userUuid = UUID.fromString(authentication.getName());
        RoomsDTO room = roomService.createRoom(userUuid, request);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomNo}")
    public ResponseEntity<RoomsDTO> getRoom(@PathVariable Long roomNo) {
        RoomsDTO room = roomService.getRoom(roomNo);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{roomNo}/join")
    public ResponseEntity<RoomsDTO> joinRoom(
        @PathVariable Long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = UUID.fromString(authentication.getName());
        RoomsDTO room = roomService.joinRoom(userUuid, roomNo);
        return ResponseEntity.ok(room);
    }

    @DeleteMapping("/{roomNo}/leave")
    public ResponseEntity<Void> leaveRoom(
        @PathVariable Long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = UUID.fromString(authentication.getName());
        roomService.leaveRoom(userUuid, roomNo);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{roomNo}/notice")
    public ResponseEntity<Map<String, Object>> updateNotice(
        @PathVariable Long roomNo,
        @RequestBody RoomNoticeRequest request,
        Authentication authentication
    ) {
        UUID userUuid = UUID.fromString(authentication.getName());
        RoomsDTO room = roomService.updateNotice(userUuid, roomNo, request.getNotice());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "notice", room.getRoomNotice()
        ));
    }

    @DeleteMapping("/{roomNo}/notice")
    public ResponseEntity<Map<String, Object>> deleteNotice(
        @PathVariable Long roomNo,
        Authentication authentication
    ) {
        UUID userUuid = UUID.fromString(authentication.getName());
        roomService.deleteNotice(userUuid, roomNo);
        return ResponseEntity.ok(Map.of(
            "success", true
        ));
    }
}
