package com.younghee.studycast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class StudyLogDTO {
    private Long logNo;
    private UUID userUuid;
    private LocalDate studyDate;
    private int totalSeconds;
    private LocalDateTime updatedAt;
}
