package com.younghee.studycast.service;

import java.util.NoSuchElementException;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.config.LiveKitProperties;
import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.response.LiveKitTokenResponse;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LiveKitTokenServiceImpl implements LiveKitTokenService {
    
    private final LiveKitProperties liveKitProperties;
    private final RoomsMapper roomsMapper;
    private final RoomParticipantsMapper roomParticipantsMapper;

    @Override
    @Transactional(readOnly = true)
    public LiveKitTokenResponse issueRoomToken(Long roomNo, UUID userUuid) {
        // 1. roomNo 검증
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("유효하지 않은 스터디방 번호입니다.");
        }
        // 2. 로그인 사용자 검증
        if (userUuid == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }
        // 3. 방 존재 여부 확인
        RoomsDTO room = roomsMapper.findRoomByRoomNo(roomNo);

        if (room == null) {
            throw new NoSuchElementException("존재하지 않는 스터디방입니다.");
        }
        // 4. 만료된 방 토큰 발급 차단
        if (room.getExpiredAt() != null && room.getExpiredAt().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalStateException("만료된 스터디방입니다.");
        }
        // 5. 실제 입장 중인 사용자만 LiveKit 토큰 발급
        boolean active = roomParticipantsMapper.existsActiveParticipant(roomNo, userUuid);

        if (!active) {
            throw new IllegalStateException("스터디방에 먼저 입장해야 합니다.");
        }
        // 6. LiveKit roomName / identity 규칙
        String roomName = "study-room-" + roomNo;
        String identity = userUuid.toString();

        // 7. LiveKit AccessToken 생성
        AccessToken token = new AccessToken(
            liveKitProperties.getApiKey(), 
            liveKitProperties.getApiSecret()
        );

        token.setIdentity(identity);
        token.setName(identity);
        // 8. 토큰 만료 시간 설정
        int ttlMinutes = liveKitProperties.getTokenTtlMinutes() != null
            ? liveKitProperties.getTokenTtlMinutes()
            : 120;

        token.setTtl(ttlMinutes * 60L * 1000L);
        // 8. roomJoin 권한 부여
        token.addGrants(
            new RoomJoin(true),
            new RoomName(roomName)
        );
        // 9. 프론트에 LiveKit 접속 정보 반환
        return new LiveKitTokenResponse(liveKitProperties.getUrl(), roomName, token.toJwt());
    }
}
