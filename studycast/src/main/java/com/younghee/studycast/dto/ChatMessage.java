package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long roomNo;
    private UUID userUuid;
    private String userName;
    private String userProfileImage;
    private String message;
    private LocalDateTime sentAt;
}
