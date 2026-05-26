package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.ChatMessage;

public interface ChatService {
    ChatMessage publishChat(Long roomNo, UUID userUuid, String message);
}
