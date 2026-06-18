package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;

public interface RoomService {
    // 스터디방 생성
    RoomCreateResponse createRoom(
        UUID userUuid, 
        RoomCreateRequest request,
        MultipartFile image
    );    
    // 참여 코드 중복 확인
    JoinCodeCheckResponse checkJoinCodeDuplicate(String code);

    //
    RoomSnapshotResponse getRoomSnapshot(Long roomNo, UUID currentUserUuid);
}
