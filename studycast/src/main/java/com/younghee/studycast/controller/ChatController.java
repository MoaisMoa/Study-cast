package com.younghee.studycast.controller;

import java.security.Principal;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.younghee.studycast.dto.ChatRequest;
import com.younghee.studycast.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/rooms/{roomNo}/chat")
    public void sendMessage(
        @DestinationVariable("roomNo") Long roomNo,
        ChatRequest request,
        Principal principal
    ) {
        if (principal == null || principal.getName() == null ){
            log.error("채팅 전송 실패: 인증되지 않은 사용자 요청입니다!! (roomNo={})", roomNo);
            throw new IllegalArgumentException("로그인이 필요한 서비스입니다.");
        } try {
            UUID userUuid = UUID.fromString(principal.getName());
            chatService.publishChat(roomNo, userUuid, request.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("채팅 전송 실패! : 유효하지 않은 UUID 형식! string={}", principal.getName(), e);
            throw e;
        }
    }
}
