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
public class RoomVisitHistoriesDTO {
    private Long historyNo;
    private Long roomNo;
    private UUID userUuid;
    private Integer visitCount;
    private LocalDateTime lastVisitedAt;
}
