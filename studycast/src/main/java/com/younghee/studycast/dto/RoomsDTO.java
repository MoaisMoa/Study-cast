package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 스터디룸 정보 DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomsDTO {
    private Long roomNo;               // 방 고유 번호
    private UUID userUuid;             // 방장 고유 번호
    private Long categoryNo;           // 카테고리 고유 번호
    private String roomTitle;          // 방 제목
    private String roomDescription;    // 방 설명
    private int maxUser;               // 최대 인원
    private int nowUser;               // 현재 참가 중인 인원
    private String roomPassword;       // 방 비밀번호
    private String roomNotice;         // 방 공지사항
    private boolean roomPrivate;       // 방 비공개 여부
    private boolean roomPremium;       // 프리미엄 방 여부
    private String roomThumbnail;      // 방 썸네일
    private LocalDateTime createdAt;   // 생성일시
    private LocalDateTime updatedAt;   // 수정일시
    private LocalDateTime expiredAt;   // 룸 만료 일자
}