package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeekPlanDTO {
    private Long planNo;
    private UUID userUuid;
    private int dayOfWeek;
    private String title;
    private String color;
    private String startTime;
    private String endTime;
    private LocalDateTime createdAt;
}
