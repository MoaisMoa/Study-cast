package com.younghee.studycast.dto.response;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import com.younghee.studycast.dto.DdaysDTO;

import lombok.Getter;

@Getter
public class DdayResponse {
    private final long ddayNo;
    private final String title;
    private final String type;
    private final String targetDate; // "yyyy-MM-dd"
    private final long remainingDays;

    public DdayResponse(DdaysDTO dto) {
        this.ddayNo = dto.getDdayNo();
        this.title = dto.getDdayTitle();
        this.type = dto.getDdayType();
        this.targetDate = dto.getTargetDate().toString();
        this.remainingDays = ChronoUnit.DAYS.between(LocalDate.now(), dto.getTargetDate());
    }
}
