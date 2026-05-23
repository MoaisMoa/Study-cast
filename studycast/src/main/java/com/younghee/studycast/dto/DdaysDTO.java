package com.younghee.studycast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class DdaysDTO {
    private Long ddayNo;
    private UUID userUuid;
    private String ddayTitle;
    private LocalDate targetDate;
    private boolean isMain;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
