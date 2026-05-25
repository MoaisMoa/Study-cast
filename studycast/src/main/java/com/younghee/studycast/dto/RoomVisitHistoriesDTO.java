package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 스터디룸 방문 기록 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomVisitHistoriesDTO {
    private Long historyNo;                 // 기록 번호
    private Long roomNo;                    // 방 고유 번호
    private UUID userUuid;                  // 회원 고유 번호
    private int visitCount;                 // 방문 횟수
    private LocalDateTime lastVisitedAt;    // 최근 방문 일시
}
