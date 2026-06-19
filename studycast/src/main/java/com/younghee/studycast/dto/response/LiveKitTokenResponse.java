package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LiveKitTokenResponse {
    // LiveKit 서버 주소
    private String url;
    // LiveKit 내부 방 이름
    private String roomName;
    // LiveKit 접속용 JWT 토큰
    private String token;
}
