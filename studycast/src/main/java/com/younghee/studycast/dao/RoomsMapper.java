package com.younghee.studycast.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.RoomsDTO;
import com.younghee.studycast.dto.request.RoomUpdateRequest;
import com.younghee.studycast.dto.response.RoomDetailResponse;

@Mapper
public interface RoomsMapper {
    
    // 방 생성
    int insertRoom(RoomsDTO room);
    // 방 번호로 방 조회
    RoomsDTO findByRoomNo(Long roomNo);
    // 비공개 방 참여 코드 존재 여부 확인
    boolean existsByRoomPassword(String roomPassword);

    // -- 추가 (방 상세 페이지)
    // 스터디방 상세 페이지 헤더 조회
    RoomDetailResponse findRoomDetailByRoomNo(
        @Param("roomNo") Long roomNo,
        @Param("userUuid") UUID userUuid
    );
    // 스터디방 입장/권한 검증용 조회
    RoomsDTO findRoomByRoomNo(@Param("roomNo") Long roomNo);
    // active 참여자 수 기준으로 rooms.now_users 재계산
    int syncNowUsersByActiveParticipants(@Param("roomNo") Long roomNo);
    // 현재 인원 조회
    Integer findNowUsersByRoomNo(@Param("roomNo") Long roomNo);
    // 방 설정 업데이트
    int updateRoom(
        @Param("roomNo") Long roomNo,
        @Param("req") RoomUpdateRequest req,
        @Param("thumbnail") String thumbnail
    );
    // 공지사항만 업데이트
    int updateRoomNotice(
        @Param("roomNo") Long roomNo,
        @Param("notice") String notice
    );
}
