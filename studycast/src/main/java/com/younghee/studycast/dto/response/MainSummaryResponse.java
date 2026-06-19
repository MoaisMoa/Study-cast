package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
// 메인페이지 개인 학습 정보 조회 응답
public class MainSummaryResponse {
    // 1. 오늘 누적 공부 시간
    private Long todayStudySeconds;
    
    // 2. 가장 가까운 디데이
    private Long ddayNo;
    private String ddayTitle;
    private Long remainingDays;

    // 3. 내 각오
    private String studyResolution;
}
