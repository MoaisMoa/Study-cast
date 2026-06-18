package com.younghee.studycast.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.RoomsDTO;

@Mapper
public interface RoomsMapper {
    
    // 방 생성
    int insertRoom(RoomsDTO room);
    // 방 번호로 방 조회
    RoomsDTO findByRoomNo(Long roomNo);
    // 비공개 방 참여 코드 존재 여부 확인
    boolean existsByRoomPassword(String roomPassword);
    // 방 공지사항 업데이트
    int updateRoomNotice(@Param("roomNo") Long roomNo, @Param("roomNotice") String roomNotice);
}
