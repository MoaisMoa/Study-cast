package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.younghee.studycast.config.LiveKitProperties;
import com.younghee.studycast.dao.RoomParticipantsMapper;
import com.younghee.studycast.dao.RoomsMapper;
import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.response.LiveKitTokenResponse;

/**
 * LiveKitTokenServiceImpl 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * issueRoomToken() : 스터디방에 입장 중인 사용자에게 LiveKit 화상 통화용 JWT 발급
 *
 * ── LiveKit JWT 발급 흐름 ─────────────────────────────────────────────────────
 * 1. roomNo / userUuid 유효성 검사
 * 2. 방 존재 여부 확인
 * 3. 방 만료 여부 확인
 * 4. 실제 활성 참여자인지 확인 (입장하지 않은 상태에서 토큰 발급 차단)
 * 5. LiveKit AccessToken 생성 → JWT 문자열 반환
 *
 * ── 단위 테스트 전략 ─────────────────────────────────────────────────────────
 * LiveKit SDK 의 AccessToken.toJwt() 는 HMAC-SHA256 서명으로 JWT 를 생성하는
 * 순수 로컬 연산이다. 네트워크 없이 동작하므로 테스트 API key/secret 으로
 * 성공 케이스까지 검증 가능하다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("LiveKitTokenServiceImpl — LiveKit JWT 발급 단위 테스트")
class LiveKitTokenServiceImplTest {

    @Mock private LiveKitProperties         liveKitProperties;
    @Mock private RoomsMapper               roomsMapper;
    @Mock private RoomParticipantsMapper    roomParticipantsMapper;

    @InjectMocks
    private LiveKitTokenServiceImpl liveKitTokenService;

    private static final UUID   USER_UUID = UUID.randomUUID();
    private static final Long   ROOM_NO   = 10L;

    // ────────────────────────────────────────────────────────────────────────
    // 1. 입력값 검증
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("실패: null roomNo → IllegalArgumentException")
    void issueRoomToken_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(null, USER_UUID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 스터디방 번호");
    }

    @Test
    @DisplayName("실패: roomNo <= 0 → IllegalArgumentException")
    void issueRoomToken_invalidRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(0L, USER_UUID))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(-1L, USER_UUID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("실패: null userUuid → SecurityException")
    void issueRoomToken_nullUserUuid_throwsSecurity() {
        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(ROOM_NO, null))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("로그인이 필요");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. 비즈니스 규칙 검증
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("실패: 존재하지 않는 방 → NoSuchElementException")
    void issueRoomToken_roomNotFound_throwsNoSuchElement() {
        // given: 방이 DB에 없음
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(null);

        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("존재하지 않는 스터디방");
    }

    @Test
    @DisplayName("실패: 만료된 방 → IllegalStateException")
    void issueRoomToken_expiredRoom_throwsIllegalState() {
        // given: 방이 존재하지만 이미 만료됨 (어제 만료)
        RoomsDTO expiredRoom = new RoomsDTO();
        expiredRoom.setRoomNo(ROOM_NO);
        expiredRoom.setExpiredAt(LocalDateTime.now().minusDays(1));
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(expiredRoom);

        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("만료된 스터디방");
    }

    @Test
    @DisplayName("실패: 활성 참여자가 아닌 사용자 → IllegalStateException (입장 없이 토큰 발급 차단)")
    void issueRoomToken_notActiveParticipant_throwsIllegalState() {
        // given: 방은 있고 만료 안 됐지만, 이 사용자는 입장하지 않은 상태
        RoomsDTO room = makeActiveRoom();
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(ROOM_NO, USER_UUID)).willReturn(false);

        assertThatThrownBy(() -> liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("먼저 입장");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. 정상 토큰 발급
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("정상: expiredAt이 null인 방 (만료일 미설정) → 만료 체크 스킵 후 토큰 발급 가능")
    void issueRoomToken_expiredAtNull_doesNotThrow() {
        // given: 방이 존재하지만 만료일이 null인 경우 (무기한 방)
        RoomsDTO roomWithNoExpiry = new RoomsDTO();
        roomWithNoExpiry.setRoomNo(ROOM_NO);
        roomWithNoExpiry.setExpiredAt(null); // 만료일 없음
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(roomWithNoExpiry);
        given(roomParticipantsMapper.existsActiveParticipant(ROOM_NO, USER_UUID)).willReturn(true);
        given(liveKitProperties.getApiKey()).willReturn("test-api-key");
        given(liveKitProperties.getApiSecret()).willReturn("test-api-secret");
        given(liveKitProperties.getUrl()).willReturn("wss://livekit.example.com");

        // when: 만료일이 null이면 만료 체크를 건너뜀 → 예외 없이 토큰 발급
        LiveKitTokenResponse resp = liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID);

        assertThat(resp.getToken()).isNotBlank();
    }

    @Test
    @DisplayName("정상: 활성 참여자에게 LiveKit JWT 발급 — url·roomName·token 모두 포함")
    void issueRoomToken_success_returnsToken() {
        // given
        given(liveKitProperties.getApiKey()).willReturn("test-api-key");
        given(liveKitProperties.getApiSecret()).willReturn("test-api-secret");
        given(liveKitProperties.getUrl()).willReturn("wss://livekit.example.com");
        // tokenTtlMinutes 는 null 이면 120 이 기본값으로 사용됨 (굳이 stub 불필요)

        RoomsDTO room = makeActiveRoom();
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(ROOM_NO, USER_UUID)).willReturn(true);

        // when
        LiveKitTokenResponse resp = liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID);

        // then
        assertThat(resp.getUrl()).isEqualTo("wss://livekit.example.com");
        assertThat(resp.getRoomName()).isEqualTo("study-room-" + ROOM_NO); // 규칙: "study-room-{roomNo}"
        assertThat(resp.getToken()).isNotBlank(); // JWT 문자열 생성 확인
    }

    @Test
    @DisplayName("정상: tokenTtlMinutes 가 설정된 경우 해당 값으로 TTL 적용")
    void issueRoomToken_customTtl_success() {
        given(liveKitProperties.getApiKey()).willReturn("test-api-key");
        given(liveKitProperties.getApiSecret()).willReturn("test-api-secret");
        given(liveKitProperties.getUrl()).willReturn("wss://livekit.example.com");
        given(liveKitProperties.getTokenTtlMinutes()).willReturn(30); // 기본값 120 대신 30분

        RoomsDTO room = makeActiveRoom();
        given(roomsMapper.findRoomByRoomNo(ROOM_NO)).willReturn(room);
        given(roomParticipantsMapper.existsActiveParticipant(ROOM_NO, USER_UUID)).willReturn(true);

        LiveKitTokenResponse resp = liveKitTokenService.issueRoomToken(ROOM_NO, USER_UUID);

        assertThat(resp.getToken()).isNotBlank();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 테스트 데이터 생성 헬퍼
    // ────────────────────────────────────────────────────────────────────────

    /** 활성(만료 안 된) 스터디방 DTO */
    private RoomsDTO makeActiveRoom() {
        RoomsDTO room = new RoomsDTO();
        room.setRoomNo(ROOM_NO);
        room.setExpiredAt(LocalDateTime.now().plusDays(7)); // 7일 뒤 만료
        return room;
    }
}
