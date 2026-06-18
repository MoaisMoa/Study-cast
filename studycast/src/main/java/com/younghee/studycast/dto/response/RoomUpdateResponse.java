package com.younghee.studycast.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomUpdateResponse {
    private Long roomNo;
    private String roomThumbnail;
}
