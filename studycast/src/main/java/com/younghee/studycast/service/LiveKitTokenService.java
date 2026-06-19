package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.response.LiveKitTokenResponse;

public interface LiveKitTokenService {
    // LiveKit 방 접속 토큰 발급
    LiveKitTokenResponse issueRoomToken(Long roomNo, UUID userUuid);
}
