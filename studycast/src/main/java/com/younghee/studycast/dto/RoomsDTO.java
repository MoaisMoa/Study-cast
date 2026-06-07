package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// DB 저장/조회용
public class RoomsDTO {

    private Long roomNo;            // 방 고유 번호
    private UUID userUuid;          // 회원(호스트) 식별 번호
    private Long categoryNo;        // 카테고리 식별 번호

    private String roomTitle;       // 방 제목
    // private String roomDescription; // 방 상세 소개 (화면설계/기능 요구사항 없음)

    private Integer maxUsers;       // 입장 가능한 최대 인원 수
    private Integer nowUsers;       // 현재 참가 인원 수

    private String roomPassword;    // 비공개 방 참여 코드
    private String roomNotice;      // 방 공지사항

    private Boolean roomPrivate;    // 방 비공개 여부
    private Boolean roomPremium;    // 방 프리미엄 여부

    private String roomThumbnail;   // 썸네일 사진

    private LocalDateTime createdAt;    // 방 생성일
    private LocalDateTime updatedAt;    // 방 수정일
    private LocalDateTime expiredAt;    // 방 만료일
}