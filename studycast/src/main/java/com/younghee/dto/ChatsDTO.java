package com.younghee.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChatsDTO {
    private Long chatNo;
    private Long roomNo;
    private UUID userUuid;
    private String message;
    private LocalDateTime sentAt;
}
