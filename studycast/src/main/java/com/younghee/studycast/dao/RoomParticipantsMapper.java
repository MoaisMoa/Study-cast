package com.younghee.studycast.dao;

import org.apache.ibatis.annotations.Mapper;

import com.younghee.studycast.dto.RoomParticipantDTO;

@Mapper
public interface RoomParticipantsMapper {
    
    // 방 참여자 등록
    int insertRoomParticipant(RoomParticipantDTO participant);
    // 방 번호 + 사용자 UUID로 참여자 조회
    RoomParticipantDTO findByRoomNoAndUserUuid(RoomParticipantDTO participant);
}
