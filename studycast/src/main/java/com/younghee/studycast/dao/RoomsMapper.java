package com.younghee.studycast.dao;

import org.apache.ibatis.annotations.Mapper;

import com.younghee.studycast.dto.RoomsDTO;

@Mapper
public interface RoomsMapper {
    
    // 방 생성
    int insertRoom(RoomsDTO room);
    // 방 번호로 방 조회
    RoomsDTO findByRoomNo(Long roomNo);
    // 비공개 방 참여 코드 존재 여부 확인
    boolean existsByRoomPassword(String roomPassword);
}
