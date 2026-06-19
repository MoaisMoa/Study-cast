package com.younghee.studycast.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ChatsService {
    Map<String, Object> sendMessage(Long roomNo, UUID userUuid, String message);
    List<Map<String, Object>> getChatHistory(Long roomNo);
}
