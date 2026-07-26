package com.younghee.studycast.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;


import com.younghee.studycast.service.ChatsService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatsService chatsService;
    private final SimpMessagingTemplate messagingTemplate;

    // 발신자 신원은 클라이언트가 보낸 값이 아니라, CONNECT 시점에 JWT로 검증된 Principal에서만 가져온다
    // (그래야 로그인한 사용자가 다른 사람의 UUID를 실어 보내 위장하는 것을 막을 수 있음)
    @MessageMapping("/chat/message")
    public void handleMessage(ChatMessageRequest request, Principal principal) {
        UUID userUuid = UUID.fromString(principal.getName());
        Map<String, Object> response = chatsService.sendMessage(
            request.getRoomNo(),
            userUuid,
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
        private String message;
    }
}
