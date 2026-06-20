package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class MonthlyStudyResponse {
    /** 이달 출석일 (공부 기록이 있는 날 수) */
    private int attendDays;
    /** 이달 총 공부 시간 (초) */
    private int totalSeconds;
    /** 일별 공부 시간 (초) — key: 일(1~31) */
    private Map<Integer, Integer> dailySeconds;
}
