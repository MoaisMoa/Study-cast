package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinCodeCheckResponse {
    
    private String code;        // 확인한 참여 코드
    private Boolean duplicate;  // 중복 여부
    private String message;     // 응답 메시지
}
