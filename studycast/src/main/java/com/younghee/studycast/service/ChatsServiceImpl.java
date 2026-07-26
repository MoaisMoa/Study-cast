package com.younghee.studycast.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.ChatsMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.ChatsDTO;
import com.younghee.studycast.dto.UserDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatsServiceImpl implements ChatsService {

    private final ChatsMapper chatsMapper;
    private final UserMapper userMapper;
    private final RoomAccessGuard roomAccessGuard;

    @Override
    @Transactional
    public Map<String, Object> sendMessage(Long roomNo, UUID userUuid, String message) {
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("방 번호가 올바르지 않습니다.");
        }
        if (userUuid == null) {
            throw new SecurityException("인증 사용자 정보가 없습니다.");
        }
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("메시지 내용이 없습니다.");
        }
        // 프론트(RightPanel.tsx)는 50자를 넘으면 입력 자체를 막지만, 그건 클라이언트단 제약일 뿐이라
        // STOMP 프레임을 직접 조작하면 우회 가능 — 서버에서도 동일 기준으로 재검증
        if (message.length() > 50) {
            throw new IllegalArgumentException("메시지는 최대 50자까지 입력할 수 있습니다.");
        }
        // 로그인만 되어 있으면 임의의 roomNo로 메시지를 주입할 수 있던 취약점 방지 —
        // 실제로 이 방의 active 참여자인지 검증
        roomAccessGuard.requireActiveParticipant(roomNo, userUuid);

        ChatsDTO chat = new ChatsDTO();
        chat.setRoomNo(roomNo);
        chat.setUserUuid(userUuid);
        chat.setMessage(message);
        chatsMapper.insertChat(chat);

        UserDTO user = userMapper.findByUuid(userUuid);

        Map<String, Object> result = new HashMap<>();
        result.put("chatNo", chat.getChatNo());
        result.put("roomNo", roomNo);
        result.put("userUuid", userUuid.toString());
        result.put("message", message);
        result.put("sentAt", LocalDateTime.now().toString());
        result.put("userName", user != null ? user.getUserName() : "Unknown");
        result.put("userProfileImage", user != null ? user.getUserProfileImage() : null);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getChatHistory(Long roomNo) {
        if (roomNo == null || roomNo <= 0) {
            throw new IllegalArgumentException("방 번호가 올바르지 않습니다.");
        }
        return chatsMapper.selectChatsByRoomNo(roomNo);
    }
}
