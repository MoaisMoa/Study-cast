package com.younghee.studycast.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


import com.younghee.studycast.service.ChatsService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatsService chatsService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/message")
    public void handleMessage(ChatMessageRequest request) {
        Map<String, Object> response = chatsService.sendMessage(
            request.getRoomNo(),
            UUID.fromString(request.getUserUuid()),
            request.getMessage()
        );
        messagingTemplate.convertAndSend("/sub/chat/room/" + request.getRoomNo(), response);
    }

    @GetMapping("/{roomNo}")
    public List<Map<String, Object>> getChatHistory(@PathVariable("roomNo") Long roomNo) {
        return chatsService.getChatHistory(roomNo);
    }

    @Data
    public static class ChatMessageRequest {
        private Long roomNo;
        private String userUuid;
        private String message;
    }
}
