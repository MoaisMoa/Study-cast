package com.younghee.studycast.dao;

import java.util.List;
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
    int updateUserStatus(
        @Param("userUuid") UUID userUuid,
        @Param("userStatus") String userStatus
    );
    // 비밀번호 변경
    int updatePassword(
        @Param("userUuid") UUID userUuid,
        @Param("userPassword") String userPassword
    );
    // 프로필 이미지 변경
    int updateProfileImage(
        @Param("userUuid") UUID userUuid,
        @Param("userProfileImage") String userProfileImage
    );

    // 프로필 정보 업데이트 (이미지, 성별, 생년월일, 각오)
    int updateProfile(UserDTO userDTO);

    // 관심 카테고리 조회
    List<String> selectCategoryNamesByUserUuid(@Param("userUuid") UUID userUuid);

    // 관심 카테고리 초기화
    int deleteUserInterests(@Param("userUuid") UUID userUuid);

    // 관심 카테고리 추가
    int insertUserInterest(@Param("userUuid") UUID userUuid, @Param("categoryName") String categoryName);
}
