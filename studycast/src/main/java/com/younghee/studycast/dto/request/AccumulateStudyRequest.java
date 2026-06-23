package com.younghee.studycast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccumulateStudyRequest {
    private Integer studySeconds;
    private Long roomNo; // 방에 머무는 동안 호출된 경우, 이 방의 누적 공부 시간도 같이 가산
}
