package com.younghee.studycast.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import org.mockito.ArgumentCaptor;

import com.younghee.studycast.dto.ChatsDTO;

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
 * ChatServiceImpl 단위 테스트
 *
 * ── 역할 ──────────────────────────────────────────────────────────────────────
 * sendMessage()    : 채팅 메시지 저장 + 발신자 정보 조합해서 반환
 * getChatHistory() : 방 번호로 채팅 내역 조회
 *
 * ── 참고 ──────────────────────────────────────────────────────────────────────
 * ChatsServiceImpl 은 ChatServiceImpl 과 코드가 100% 동일한 중복 파일이다.
 * 동일한 테스트를 두 번 작성하는 것은 의미가 없으므로 ChatServiceImpl 만 검증한다.
 * ──────────────────────────────────────────────────────────────────────────────
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChatServiceImpl — 채팅 서비스 단위 테스트")
class ChatServiceImplTest {

    @Mock private ChatsMapper chatsMapper;
    @Mock private UserMapper  userMapper;

    @InjectMocks
    private ChatServiceImpl chatService;

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
        Map<String, Object> result = chatService.sendMessage(1L, uuid, "안녕하세요!");

        // then: 반환값 확인
        assertThat(result.get("userName")).isEqualTo("홍길동");
        assertThat(result.get("userProfileImage")).isEqualTo("https://img.example.com/photo.jpg");
        assertThat(result.get("message")).isEqualTo("안녕하세요!");
        assertThat(result.get("roomNo")).isEqualTo(1L);
        assertThat(result.get("userUuid")).isEqualTo(uuid.toString());

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
        Map<String, Object> result = chatService.sendMessage(1L, uuid, "테스트");

        // then: "Unknown" 으로 대체되어야 함 (NPE 없이)
        assertThat(result.get("userName")).isEqualTo("Unknown");
        assertThat(result.get("userProfileImage")).isNull();
    }

    @Test
    @DisplayName("sendMessage — 실패: null roomNo → IllegalArgumentException")
    void sendMessage_nullRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatService.sendMessage(null, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호");
    }

    @Test
    @DisplayName("sendMessage — 실패: roomNo <= 0 → IllegalArgumentException")
    void sendMessage_invalidRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatService.sendMessage(0L, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> chatService.sendMessage(-1L, UUID.randomUUID(), "메시지"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("sendMessage — 실패: null userUuid → SecurityException")
    void sendMessage_nullUserUuid_throwsSecurity() {
        assertThatThrownBy(() -> chatService.sendMessage(1L, null, "메시지"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("인증 사용자");
    }

    @Test
    @DisplayName("sendMessage — 실패: null/blank 메시지 → IllegalArgumentException")
    void sendMessage_nullOrBlankMessage_throwsIllegalArgument() {
        UUID uuid = UUID.randomUUID();

        assertThatThrownBy(() -> chatService.sendMessage(1L, uuid, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("메시지 내용");

        assertThatThrownBy(() -> chatService.sendMessage(1L, uuid, "   "))
                .isInstanceOf(IllegalArgumentException.class);
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
        List<Map<String, Object>> result = chatService.getChatHistory(5L);

        // then
        assertThat(result).isEqualTo(expected);
        verify(chatsMapper).selectChatsByRoomNo(5L);
    }

    @Test
    @DisplayName("getChatHistory — 실패: null/invalid roomNo → IllegalArgumentException")
    void getChatHistory_invalidRoomNo_throwsIllegalArgument() {
        assertThatThrownBy(() -> chatService.getChatHistory(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("방 번호");

        assertThatThrownBy(() -> chatService.getChatHistory(0L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
