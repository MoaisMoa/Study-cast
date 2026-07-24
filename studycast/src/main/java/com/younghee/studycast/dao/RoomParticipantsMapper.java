package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.RoomParticipantDTO;
import com.younghee.studycast.dto.response.RoomParticipantResponse;

@Mapper
public interface RoomParticipantsMapper {
    
    // 방 참여자 등록
    int insertRoomParticipant(RoomParticipantDTO participant);
    // 방 번호 + 사용자 UUID로 참여자 조회
    RoomParticipantDTO findByRoomNoAndUserUuid(RoomParticipantDTO participant);

    // 추가) 방 상세
    // 특정 사용자의 방 참여 이력 조회
    RoomParticipantDTO findParticipantByRoomNoAndUserUuid(
        @Param("roomNo") Long roomNo, 
        @Param("userUuid") UUID userUuid
    );
    // 현재 active 상태인지 확인
    boolean existsActiveParticipant(
        @Param("roomNo") Long roomNo,
        @Param("userUuid") UUID userUuid
    );
    // 다른 방에 active 상태인지 확인 (멀티 디바이스 중복 입장 방지)
    boolean existsActiveInOtherRoom(
        @Param("userUuid") UUID userUuid,
        @Param("roomNo") Long roomNo
    );
    // 신규 참여자 등록
    int insertParticipant(RoomParticipantDTO participant);
    // 기존 참여자의 재입장 처리
    int rejoinParticipant(@Param("roomNo") Long roomNo, @Param("userUuid") UUID userUuid);
    // 퇴장 처리
    int leaveParticipant(@Param("roomNo") Long roomNo, @Param("userUuid") UUID userUuid);
    // 참여자 목록 조회
    List<RoomParticipantResponse> findActiveParticipantsByRoomNo(@Param("roomNo") Long roomNo);
    // 이 방에서의 누적 공부 시간 가산 (study_logs와 동일한 저장 시점에 같이 호출)
    int incrementStudySeconds(
        @Param("roomNo") Long roomNo,
        @Param("userUuid") UUID userUuid,
        @Param("seconds") int seconds
    );
    // 세션 중 카메라/마이크 on-off 토글 반영
    int updateDeviceStatus(
        @Param("roomNo") Long roomNo,
        @Param("userUuid") UUID userUuid,
        @Param("cameraStatus") boolean cameraStatus,
        @Param("micStatus") boolean micStatus
    );
}
