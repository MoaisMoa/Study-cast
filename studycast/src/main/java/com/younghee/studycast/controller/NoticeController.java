package com.younghee.studycast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.service.NoticeService;

import lombok.RequiredArgsConstructor;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class NoticeController {
    private final NoticeService noticeService;

    // 공지사항 등록
    @PostMapping("/{roomNo}/notice")
    public ResponseEntity<String> saveNotice(
        @PathVariable Long roomNo,
        @RequestBody RoomsDTO roomsDTO) {
            roomsDTO.setRoomNo(roomNo);
            noticeService.saveNotice(roomsDTO);

            return ResponseEntity.ok("공지사항 저장 완!");
        }
    

    // 공지사항 조회
    @GetMapping("/{roomNo}/notice")
    public ResponseEntity<String> getNotice(@PathVariable Long roomNo) {
        String notice = noticeService.getNotice(roomNo);
        if(notice == null || notice.trim().isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(notice);
    }

    @DeleteMapping("/{roomNo}/notice")
    public ResponseEntity<String> deleteNotice(@PathVariable Long roomNo) {
        noticeService.deleteNotice(roomNo);
        return ResponseEntity.ok("공지사항 삭제 완!");
    }
}
