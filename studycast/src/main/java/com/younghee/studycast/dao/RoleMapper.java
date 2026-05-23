package com.younghee.studycast.dao;

import java.util.List;
import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RoleMapper {
    // 기본 권한 ROLE_USER 등록
    int insertDefaultRole(@Param("userUuid") UUID userUuid);
    // 사용자 권한 목록 조회
    List<String> findRolesByUserUuid(@Param("userUuid") UUID userUuid);
}
