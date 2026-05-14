package com.younghee.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class RoomVisitHistoriesDTO {
    private Long historyNo;
    private Long roomNo;
    private UUID userUuid;
    private int visitCount;
    private LocalDateTime lastVisitedAt;
}
