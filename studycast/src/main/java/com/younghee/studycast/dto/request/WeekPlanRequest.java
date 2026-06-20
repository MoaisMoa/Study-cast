package com.younghee.studycast.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WeekPlanRequest {
    private int dayOfWeek;   // 0=월 ~ 6=일
    private String title;
    private String color;
    private String startTime; // "HH:MM"
    private String endTime;   // "HH:MM"
}
