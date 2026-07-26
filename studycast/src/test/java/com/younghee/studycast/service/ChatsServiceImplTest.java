package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.mockito.ArgumentCaptor;

import com.younghee.studycast.dto.ChatsDTO;
import com.younghee.studycast.exception.ForbiddenException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.younghee.studycast.dao.ChatsMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.UserDTO;

/**
 * ChatsServiceImpl 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * sendMessage()    : 메시지 길이/방 참여자 검증 → 채팅 메시지 저장 → 발신자 정보 조합해서 반환
 * getChatHistory() : 방 번호로 채팅 내역 조회
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChatsServiceImpl — 채팅 서비스 단위 테스트")
class ChatsServiceImplTest {

    @Mock private ChatsMapper chatsMapper;
    @Mock private UserMapper userMapper;
    @Mock private RoomAccessGuard roomAccessGuard;

    @InjectMocks
    private ChatsServiceImpl chatsService;

    // ────────────────────────────────────────────────────────────────────────
    // 1. sendMessage() — 메시지 전송
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("sendMessage — 정상: 사용자 정보가 있으면 userName 이 결과 맵에 포함됨")
    void sendMessage_userFound_returnsMapWithUserName() {
        // given
        UUID uuid = UUID.randomUUID();
        UserDTO user = new UserDTO();
        user.setUserName("홍길동");
        user.setUserProfileImage("https://img.example.com/photo.jpg");

        given(chatsMapper.insertChat(any())).willReturn(1);
        given(userMapper.findByUuid(uuid)).willReturn(user);

        // when
        Map<String, Object> result = chatsService.sendMessage(1L, uuid, "안녕하세요!");

        // then: 반환값 확인
        assertThat(result.get("userName")).isEqualTo("홍길동");
        assertThat(result.get("userProfileImage")).isEqualTo("https://img.example.com/photo.jpg");
        assertThat(result.get("message")).isEqualTo("안녕하세요!");
        assertThat(result.get("roomNo")).isEqualTo(1L);
        assertThat(result.get("userUuid")).isEqualTo(uuid.toString());

        // 방 참여자 검증을 거쳤는지 확인
        verify(roomAccessGuard).requireActiveParticipant(1L, uuid);

        // DB에 저장된 DTO 내용 검증
        ArgumentCaptor<ChatsDTO> captor = ArgumentCaptor.forClass(ChatsDTO.class);
        verify(chatsMapper).insertChat(captor.capture());
        assertThat(captor.getValue().getRoomNo()).isEqualTo(1L);
        assertThat(captor.getValue().getUserUuid()).isEqualTo(uuid);
        assertThat(captor.getValue().getMessage()).isEqualTo("안녕하세요!");
    }

    @Test
    @DisplayName("sendMessage — 사용자 정보 없으면 userName 이 'Unknown' 으로 대체됨")
    void sendMessage_userNotFound_returnsUnknownName() {
        // given: DB에 해당 UUID 사용자 없음
        UUID uuid = UUID.randomUUID();
        given(chatsMapper.insertChat(any())).willReturn(1);
        given(userMapper.findByUuid(uuid)).willReturn(null);

        // when
        Map<String, Object> result = chatsService.sendMessage(1L, uuid, "테스트");

        // then: "Unknown" 으로 대체되어야 함 (NPE 없이)
        assertThat(result.get("userName")).isEqualTo("Unknown");
        assertThat(result.get("userProfileImage")).isNull();
    }

    @Test
    @DisplayName("sendMessage — 실패: null roomNo → IllegalArgumentException")
    void sendMessage_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatsService.sendMessage(null, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호");

        verifyNoInteractions(roomAccessGuard, chatsMapper);
    }

    @Test
    @DisplayName("sendMessage — 실패: roomNo <= 0 → IllegalArgumentException")
    void sendMessage_invalidRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatsService.sendMessage(0L, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> chatsService.sendMessage(-1L, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("sendMessage — 실패: null userUuid → SecurityException")
    void sendMessage_nullUserUuid_throwsSecurity() {
        assertThatThrownBy(() -> chatsService.sendMessage(1L, null, "메시지"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("인증 사용자");
    }

    @Test
    @DisplayName("sendMessage — 실패: null/blank 메시지 → IllegalArgumentException")
    void sendMessage_nullOrBlankMessage_throwsIllegalArgument() {
        UUID uuid = UUID.randomUUID();

        assertThatThrownBy(() -> chatsService.sendMessage(1L, uuid, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("메시지 내용");

        assertThatThrownBy(() -> chatsService.sendMessage(1L, uuid, "   "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("sendMessage — 실패: 50자 초과 메시지 → IllegalArgumentException (서버측 재검증, 프론트 우회 방지)")
    void sendMessage_messageTooLong_throwsIllegalArgument() {
        UUID uuid = UUID.randomUUID();
        String over50 = "가".repeat(51);

        assertThatThrownBy(() -> chatsService.sendMessage(1L, uuid, over50))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("50자");

        // 길이 검증이 방 참여자 검증보다 먼저 실행되어, 그쪽까지 도달하지 않아야 함
        verifyNoInteractions(roomAccessGuard, chatsMapper);
    }

    @Test
    @DisplayName("sendMessage — 정상: 50자 정확히는 통과함 (경계값)")
    void sendMessage_messageExactly50_succeeds() {
        UUID uuid = UUID.randomUUID();
        String exactly50 = "가".repeat(50);
        given(chatsMapper.insertChat(any())).willReturn(1);
        given(userMapper.findByUuid(uuid)).willReturn(null);

        Map<String, Object> result = chatsService.sendMessage(1L, uuid, exactly50);

        assertThat(result.get("message")).isEqualTo(exactly50);
    }

    @Test
    @DisplayName("sendMessage — 실패: 이 방의 active 참여자가 아니면 ForbiddenException (타 방 주입 방지)")
    void sendMessage_notActiveParticipant_throwsForbidden() {
        UUID uuid = UUID.randomUUID();
        doThrow(new ForbiddenException("이 방의 참여자가 아닙니다."))
                .when(roomAccessGuard).requireActiveParticipant(1L, uuid);

        assertThatThrownBy(() -> chatsService.sendMessage(1L, uuid, "메시지"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("참여자");

        // 방 참여자 검증에서 막혔으므로 실제 저장까지는 도달하지 않아야 함
        verifyNoInteractions(chatsMapper);
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. getChatHistory() — 채팅 내역 조회
    // ────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getChatHistory — 정상: 매퍼 반환값을 그대로 리턴")
    void getChatHistory_success() {
        // given
        List<Map<String, Object>> expected = List.of(Map.of("message", "테스트"));
        given(chatsMapper.selectChatsByRoomNo(5L)).willReturn(expected);

        // when
        List<Map<String, Object>> result = chatsService.getChatHistory(5L);

        // then
        assertThat(result).isEqualTo(expected);
        verify(chatsMapper).selectChatsByRoomNo(5L);
    }

    @Test
    @DisplayName("getChatHistory — 실패: null/invalid roomNo → IllegalArgumentException")
    void getChatHistory_invalidRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatsService.getChatHistory(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호");

        assertThatThrownBy(() -> chatsService.getChatHistory(0L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
