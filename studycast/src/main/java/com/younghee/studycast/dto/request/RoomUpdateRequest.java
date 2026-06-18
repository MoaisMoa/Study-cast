package com.younghee.studycast.dto.request;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomUpdateRequest {
    private String roomTitle;
    private Integer maxUsers;
    private Long categoryNo;
    private LocalDate expiredAt;
    private Boolean cameraStatus;
    private Boolean micStatus;
    private String roomNotice;
}
