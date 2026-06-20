package com.younghee.studycast.dao;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.ChatsDTO;

@Mapper
public interface ChatsMapper {
    int insertChat(ChatsDTO chatsDTO);
    List<Map<String, Object>> selectChatsByRoomNo(@Param("roomNo") Long roomNo);
    List<Map<String, Object>> selectRecentChats(@Param("roomNo") Long roomNo, @Param("limit") int limit);
    int deleteChat(@Param("chatNo") Long chatNo);
}
