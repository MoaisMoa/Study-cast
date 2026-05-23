package com.younghee.studycast.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class RoomsDTO {
 private Long roomNo;
 private UUID userUuid;
 private Long categoryNo;
 private String roomTitle;
 private String roomDescription;
 private int maxUser;
 private int nowUser;
 private String roomPassword;
 private String roomNotice;
 private boolean roomPrivate;
 private boolean roomPremium;
 private String roomThumbnail;
 private LocalDateTime createdAt;
 private LocalDateTime updatedAt;
 private LocalDateTime expiredAt;
}