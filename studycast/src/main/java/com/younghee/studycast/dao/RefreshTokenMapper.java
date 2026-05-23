package com.younghee.studycast.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.RefreshTokenDTO;

@Mapper
public interface RefreshTokenMapper {
    // Refresh Token 저장
    int insert(RefreshTokenDTO refreshToken);
    // token_hash로 Refresh Token 조회
    RefreshTokenDTO findByTokenHash(@Param("tokenHash") String tokenHash);
    // 로그아웃 시 Refresh Token 폐기
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);
    // 해당 사용자의 모든 Refresh Token 폐기
    int revokeAllByUserUuid(@Param("userUuid") UUID userUuid);
}
