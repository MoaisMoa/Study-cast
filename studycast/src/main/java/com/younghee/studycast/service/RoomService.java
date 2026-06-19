package com.younghee.studycast.service;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import com.younghee.studycast.dto.request.RoomCreateRequest;
import com.younghee.studycast.dto.request.RoomJoinRequest;
import com.younghee.studycast.dto.request.RoomUpdateRequest;
import com.younghee.studycast.dto.response.JoinCodeCheckResponse;
import com.younghee.studycast.dto.response.RoomCreateResponse;
import com.younghee.studycast.dto.response.RoomDetailResponse;
import com.younghee.studycast.dto.response.RoomJoinResponse;
import com.younghee.studycast.dto.response.RoomParticipantResponse;
import com.younghee.studycast.dto.response.RoomUpdateResponse;

public interface RoomService {
    // 스터디방 생성
    RoomCreateResponse createRoom(
        UUID userUuid, 
        RoomCreateRequest request,
        MultipartFile image
    );    
    // 참여 코드 중복 확인
    JoinCodeCheckResponse checkJoinCodeDuplicate(String code);

    // 추가) 방 상세 페이지
    // 스터디방 상세 페이지 헤더 조회
    RoomDetailResponse getRoomDetail(Long roomNo, UUID userUuid);
    // 스터디방 입장 처리
    RoomJoinResponse joinRoom(Long roomNo, UUID userUuid, RoomJoinRequest request);
    // 스터디방 active 참여자 목록 조회
    List<RoomParticipantResponse> getActiveParticipants(Long roomNo);
    // 스터디방 퇴장 처리 + 공부시간 저장
    void leaveRoom(Long roomNo, UUID userUuid, int studiedSeconds);
    // 스터디방 설정 업데이트 (방장 전용)
    RoomUpdateResponse updateRoomSettings(Long roomNo, UUID userUuid, RoomUpdateRequest request, MultipartFile image);

    //
    RoomSnapshotResponse getRoomSnapshot(Long roomNo, UUID currentUserUuid);
}
