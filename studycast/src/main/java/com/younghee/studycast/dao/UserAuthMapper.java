package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.UserAuthDTO;

@Mapper
public interface UserAuthMapper {
    // provider + providerUserId로 소셜 연동 정보 조회
    UserAuthDTO findByProviderAndProviderUserId(
        @Param("provider") String provider,
        @Param("providerUserId") String providerUserId
    );
    // 특정 사용자의 소셜 연동 목록 조회
    List<UserAuthDTO> findByUserUuid(@Param("userUuid") UUID userUuid);
    // 소셜 연동 정보 저장
    int insertUserAuth(UserAuthDTO userAuth);
    // 소셜 로그인 마지막 로그인 시간 갱신
    int updateLastLoginAt(@Param("authNo") Long authNo);
}
