package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.RoomCreateRequest;
import com.younghee.studycast.dto.RoomCreateResponse;

public interface RoomService {
    // 스터디방 생성
    RoomCreateResponse createRoom(
        UUID userUuid, 
        RoomCreateRequest request,
        MultipartFile image
    );    
}
