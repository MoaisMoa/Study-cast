package com.younghee.studycast.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.ChatsMapper;
import com.younghee.studycast.dao.RoomMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.ChatMessage;
import com.younghee.studycast.dto.ChatsDTO;
import com.younghee.studycast.dto.RoomsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatsMapper chatsMapper;
    private final RoomMapper roomMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public ChatMessage publishChat(Long roomNo, UUID userUuid, String message) {
        RoomsDTO room = roomMapper.selectRoomById(roomNo);
        if (room == null) {
            throw new RuntimeException("존재하지 않는 룸입니다.");
        }
        if (!roomMapper.existsParticipant(userUuid, roomNo)) {
            throw new RuntimeException("해당 룸의 참여자가 아닙니다.");
        }

        ChatsDTO chat = new ChatsDTO();
        chat.setRoomNo(roomNo);
        chat.setUserUuid(userUuid);
        chat.setMessage(message);
        chat.setSentAt(LocalDateTime.now());

        int result = chatsMapper.insertChat(chat);
        if (result != 1) {
            throw new RuntimeException("채팅 저장에 실패했습니다.");
        }

        List<Map<String, Object>> rows = chatsMapper.selectRecentChats(roomNo, 1);
        Map<String, Object> latest = rows.isEmpty() ? Map.of() : rows.get(0);

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setRoomNo(roomNo);
        chatMessage.setUserUuid(userUuid);
        chatMessage.setUserName((String) latest.getOrDefault("userName", null));
        chatMessage.setUserProfileImage((String) latest.getOrDefault("userProfileImage", null));
        chatMessage.setMessage(message);
        chatMessage.setSentAt((LocalDateTime) latest.get("sentAt"));

        messagingTemplate.convertAndSend("/sub/rooms/" + roomNo, chatMessage);

        log.info("room={} message published by {}", roomNo, userUuid);
        return chatMessage;
    }
}
