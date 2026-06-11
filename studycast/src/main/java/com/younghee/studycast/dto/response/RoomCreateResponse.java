package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
// 방 생성 결과를 프론트에 돌려줄 때
public class RoomCreateResponse {
    
    private Long roomNo;        // 방 번호
    private String roomTitle;   // 방 제목
    private String message;     // 응답 메시지
}
