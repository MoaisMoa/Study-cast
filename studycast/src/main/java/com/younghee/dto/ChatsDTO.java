package com.younghee.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 채팅DTO

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatsDTO {
    private Long chatNo;
    private Long roomNo;
    private UUID userUuid;
    private String message;
    private LocalDateTime sentAt;
}
