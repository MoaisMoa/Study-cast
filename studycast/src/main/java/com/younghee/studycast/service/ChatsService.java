package com.younghee.studycast.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.younghee.studycast.dao.ChatsMapper;
import com.younghee.studycast.dto.ChatsDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatsService {

    private final ChatsMapper chatsMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public Map<String, Object> sendMessage(Long roomNo, UUID userUuid, String message) {
        ChatsDTO chat = new ChatsDTO();
        chat.setRoomNo(roomNo);
        chat.setUserUuid(userUuid);
        chat.setMessage(message);
        chatsMapper.insertChat(chat);

        List<Map<String, Object>> recentChats = chatsMapper.selectRecentChats(roomNo, 1);
        if (!recentChats.isEmpty()) {
            return recentChats.get(0);
        }
        return null;
    }

    public List<Map<String, Object>> getChatHistory(Long roomNo) {
        return chatsMapper.selectChatsByRoomNo(roomNo);
    }
}
