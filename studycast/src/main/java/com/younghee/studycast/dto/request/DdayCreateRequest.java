package com.younghee.studycast.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DdayCreateRequest {
    private String title;
    private String type;
    private String targetDate; // "yyyy-MM-dd"
}
