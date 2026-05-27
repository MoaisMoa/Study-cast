package com.younghee.studycast.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.UserDTO;

@Mapper
public interface UserMapper {
    
    // 이메일로 회원 조회
    UserDTO findByEmail(@Param("userEmail") String userEmail);
    // UUID로 회원 조회
    UserDTO findByUuid(@Param("userUuid") UUID userUuid);
    // 회원가입
    int insertUser(UserDTO user);
    // 사용자 상태 변경
    int updateUserStatus(
        @Param("userUuid") UUID userUuid,
        @Param("userStatus") String userStatus
    );
    // 비밀번호 변경
    int updatePassword(
        @Param("userUuid") UUID userUuid,
        @Param("userPassword") String userPassword
    );
}
