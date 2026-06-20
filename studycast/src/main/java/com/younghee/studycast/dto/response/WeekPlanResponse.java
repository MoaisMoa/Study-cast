package com.younghee.studycast.dto.response;

import com.younghee.studycast.dto.WeekPlanDTO;

import lombok.Getter;

@Getter
public class WeekPlanResponse {
    private final long planNo;
    private final int dayOfWeek;
    private final String title;
    private final String color;
    private final String startTime;
    private final String endTime;

    public WeekPlanResponse(WeekPlanDTO dto) {
        this.planNo    = dto.getPlanNo();
        this.dayOfWeek = dto.getDayOfWeek();
        this.title     = dto.getTitle();
        this.color     = dto.getColor();
        this.startTime = dto.getStartTime();
        this.endTime   = dto.getEndTime();
    }
}
