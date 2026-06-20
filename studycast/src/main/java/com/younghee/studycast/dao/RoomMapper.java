package com.younghee.studycast.dao;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.RoomParticipantDTO;
import com.younghee.studycast.dto.RoomsDTO;

@Mapper
public interface RoomMapper {
    int insertRoom(RoomsDTO room);
    RoomsDTO selectRoomById(@Param("roomNo") Long roomNo);
    int insertParticipant(RoomParticipantDTO participant);
    int deleteParticipant(@Param("userUuid") UUID userUuid, @Param("roomNo") Long roomNo);
    boolean existsParticipant(@Param("userUuid") UUID userUuid, @Param("roomNo") Long roomNo);
    int updateRoomUserCount(@Param("roomNo") Long roomNo, @Param("delta") int delta);
    int updateRoomNotice(@Param("roomNo") Long roomNo, @Param("roomNotice") String roomNotice);
    int clearRoomNotice(@Param("roomNo") Long roomNo);
    int selectParticipantCount(@Param("roomNo") Long roomNo);
    List<RoomParticipantDTO> selectParticipants(@Param("roomNo") Long roomNo);
    List<Map<String, Object>> selectParticipantsWithUser(@Param("roomNo") Long roomNo);
}
