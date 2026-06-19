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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatsMapper chatsMapper;
    private final UserMapper userMapper;

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

        log.info("room={} message saved by {}", roomNo, userUuid);
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
