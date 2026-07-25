package com.younghee.studycast.dto.response;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import com.younghee.studycast.dto.DdaysDTO;

import lombok.Getter;

@Getter
public class DdayResponse {
    // 서버 타임존과 무관하게 "오늘"을 항상 한국 기준으로 판정 (운영 서버가 UTC로 동작 중임)
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

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
        this.remainingDays = ChronoUnit.DAYS.between(LocalDate.now(KST), dto.getTargetDate());
    }
}
