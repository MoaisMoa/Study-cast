package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.exception.ForbiddenException;

import lombok.RequiredArgsConstructor;

// WebSocket SEND 핸들러(채팅·타이머 등) 공용 방 참여자 인가 체크.
// SUBSCRIBE는 destination(/sub/room/{roomNo}/...)에 방 번호가 노출돼 있어
// WebSocketAuthChannelInterceptor가 프레임 단계에서 바로 검증하지만, SEND는 destination이
// 방과 무관하게 고정(/pub/chat/message 등)이라 인터셉터에서 같은 방식으로 막을 수 없다.
// 그래서 각 SEND 핸들러(서비스 또는 컨트롤러)가 이 헬퍼를 호출해 동일한 기준으로 검증한다.
@Component
@RequiredArgsConstructor
public class RoomAccessGuard {

    private final RoomParticipantsMapper roomParticipantsMapper;

    public void requireActiveParticipant(Long roomNo, UUID userUuid) {
        if (!roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid)) {
            throw new ForbiddenException("이 방의 참여자가 아닙니다.");
        }
    }
}
