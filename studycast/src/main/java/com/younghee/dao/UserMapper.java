package com.younghee.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.dto.UserDTO;

@Mapper
public interface UserMapper {
    
    // 이메일로 회원 조회
    UserDTO findByEmail(@Param("userEmail") String userEmail);
    // UUID로 회원 조회
    UserDTO findByUuid(@Param("userUuid") UUID userUuid);
    // 회원가입
    int insertUser(UserDTO user);
    // 사용자 상태 변경
    int updatedUserStatus(
        @Param("userUuid") UUID userUuid,
        @Param("userStatus") String userStatus
    );
}
