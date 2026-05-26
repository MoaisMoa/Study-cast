package com.younghee.studycast.controller;

import java.security.Principal;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.younghee.studycast.dto.ChatRequest;
import com.younghee.studycast.service.ChatService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/rooms/{roomNo}/chat")
    public void sendMessage(
        @DestinationVariable Long roomNo,
        ChatRequest request,
        Principal principal
    ) {
        UUID userUuid = UUID.fromString(principal.getName());
        chatService.publishChat(roomNo, userUuid, request.getMessage());
    }
}
