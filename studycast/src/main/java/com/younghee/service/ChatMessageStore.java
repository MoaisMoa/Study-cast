package com.younghee.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.Data;

@Component
public class ChatMessageStore {

    private final ConcurrentHashMap<Long, ConcurrentLinkedQueue<ChatMessage>> roomMessages = new ConcurrentHashMap<>();
    private volatile Long messageCounter = 0L;

    @Data
    @AllArgsConstructor
    public static class ChatMessage {
        private Long messageNo;
        private Long roomNo;
        private UUID userUuid;
        private String message;
        private LocalDateTime sentAt;
        private String userName;
        private String userProfileImage;
    }

    public ChatMessage addMessage(Long roomNo, UUID userUuid, String message, String userName, String userProfileImage) {
        Long messageNo = ++messageCounter;
        LocalDateTime sentAt = LocalDateTime.now();
        ChatMessage chatMessage = new ChatMessage(messageNo, roomNo, userUuid, message, sentAt, userName, userProfileImage);

        roomMessages.computeIfAbsent(roomNo, k -> new ConcurrentLinkedQueue<>()).add(chatMessage);
        return chatMessage;
    }

    public List<ChatMessage> getMessages(Long roomNo) {
        ConcurrentLinkedQueue<ChatMessage> queue = roomMessages.get(roomNo);
        if (queue == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(queue);
    }

    public void clearRoom(Long roomNo) {
        roomMessages.remove(roomNo);
    }

    public void clear() {
        roomMessages.clear();
        messageCounter = 0L;
    }
}
