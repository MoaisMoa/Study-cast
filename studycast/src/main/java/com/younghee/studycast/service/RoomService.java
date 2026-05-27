package com.younghee.studycast.service;

import java.util.UUID;

import com.younghee.studycast.dto.RoomCreateRequest;
import com.younghee.studycast.dto.RoomsDTO;

public interface RoomService {
    RoomsDTO createRoom(UUID userUuid, RoomCreateRequest request);
    RoomsDTO getRoom(Long roomNo);
    RoomsDTO joinRoom(UUID userUuid, Long roomNo);
    void leaveRoom(UUID userUuid, Long roomNo);
    boolean isParticipant(UUID userUuid, Long roomNo);
    RoomsDTO updateNotice(UUID userUuid, Long roomNo, String notice);
    void deleteNotice(UUID userUuid, Long roomNo);
}
