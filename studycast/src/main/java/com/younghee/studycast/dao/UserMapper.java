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
    int insertUser(UserDTO userDTO);

    // 사용자 상태 변경
    int updatedUserStatus(@Param("userStatus") String userSatus, @Param("userUuid") UUID userUuid);

    // 프로필 정보 업데이트
    int updateProfile(UserDTO userDTO);

    int updatePassword(UserDTO userDTO);

    // 회원 관심 카테고리 조회
    java.util.List<String> selectCategoryNamesByUserUuid(@Param("userUuid") UUID userUuid);

    // 카테고리 초기화
    int deleteUserInterests(@Param("userUuid") UUID userUuid);

    // 카테고리 추가
    int insertUserInterest(@Param("userUuid") UUID userUuid, @Param("categoryName") String categoryName);
}
